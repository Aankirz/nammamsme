import { NextResponse } from "next/server";
import { SarvamAIClient } from "sarvamai";
import { TOOL_SPECS, runTool } from "@/lib/tools";
import { chat } from "@/lib/chat";

export const maxDuration = 120;

const MAX_ROUNDS = 6;
const MAX_QUESTION = 600;
const HISTORY_TURNS = 12;

const SYSTEM = `You answer questions about a small Indian business's paperwork, in conversation.

You know nothing about this business except what the tools return and what has
been said earlier in this conversation. Never state an amount, a date, a rate or
a deadline that did not come from a tool call. If the tools do not give you a
figure, say you do not have it.

When a tool reports "ambiguous" or "unknown", say so plainly and say why. Do not
fill the gap with a likely answer. Being unable to answer is acceptable; a
confident wrong number about someone's tax is not.

When the user tells you something about themselves or their business that is not
in their documents and will matter later, call remember_fact. When a question
touches something you might have been told before, call recall_facts before
saying you do not know.

Use the conversation so far. If the user says "that one" or "the same supplier",
resolve it from earlier turns rather than asking again.

Answer in plain English, short sentences. Amounts as "₹5,12,000". No em dashes.
Lead with the answer, then the reason. Two or three sentences unless asked for more.`;

interface ToolCall {
  id: string;
  type: string;
  function: { name: string; arguments: string };
}

interface Trace {
  tool: string;
  args: Record<string, unknown>;
}

export async function POST(request: Request): Promise<NextResponse> {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 503 });

  let body: { chatId?: unknown; question?: unknown; documentId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "EXPECTED_JSON" }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ error: "NO_QUESTION" }, { status: 400 });
  if (question.length > MAX_QUESTION) {
    return NextResponse.json({ error: "QUESTION_TOO_LONG" }, { status: 413 });
  }

  const chatId =
    typeof body.chatId === "string" && body.chatId.length > 0
      ? body.chatId
      : `chat_${Date.now().toString(36)}`;

  const openDocument = typeof body.documentId === "string" ? body.documentId : null;
  const today = new Date().toISOString().slice(0, 10);
  const started = Date.now();

  const history = chat.conversation(chatId).turns.slice(-HISTORY_TURNS);

  const context = [
    `Today's date is ${today}. Compute every relative date against it.`,
    openDocument ? `The user currently has document ${openDocument} open.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: `${SYSTEM}\n\n${context}` },
    ...history.map((turn) => ({ role: turn.role, content: turn.content })),
    { role: "user", content: question },
  ];

  chat.append(chatId, { role: "user", content: question, at: new Date().toISOString() });

  const client = new SarvamAIClient({ apiSubscriptionKey: key });
  const trace: Trace[] = [];

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const response = (await client.chat.completions({
        model: "sarvam-105b",
        messages: messages as never,
        tools: TOOL_SPECS as never,
        temperature: 0,
        max_tokens: 4096,
      })) as {
        choices: Array<{
          finish_reason: string;
          message: { content: string | null; tool_calls?: ToolCall[] };
        }>;
      };

      const choice = response.choices[0];
      const calls = choice?.message?.tool_calls ?? [];

      if (calls.length === 0) {
        const answer =
          choice?.message?.content ??
          "I could not produce an answer from the records I hold.";

        const conversation = chat.append(chatId, {
          role: "assistant",
          content: answer,
          trace,
          at: new Date().toISOString(),
        });

        return NextResponse.json({
          chatId,
          answer,
          trace,
          turns: conversation.turns.length,
          remembered: chat.facts().length,
          rounds: round + 1,
          totalMs: Date.now() - started,
        });
      }

      messages.push({ role: "assistant", content: null, tool_calls: calls });

      for (const call of calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          args = {};
        }

        trace.push({ tool: call.function.name, args });
        const result = await runTool(call.function.name, args);

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    const answer = "I could not settle this within the steps allowed.";
    chat.append(chatId, { role: "assistant", content: answer, trace, at: new Date().toISOString() });

    return NextResponse.json({
      chatId,
      answer,
      trace,
      rounds: MAX_ROUNDS,
      totalMs: Date.now() - started,
    });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "chat failed";
    return NextResponse.json({ error: "CHAT_FAILED", detail, chatId, trace }, { status: 502 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const chatId = new URL(request.url).searchParams.get("chatId");

  return NextResponse.json({
    conversation: chatId ? chat.conversation(chatId) : null,
    remembered: chat.facts(),
  });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const factId = new URL(request.url).searchParams.get("factId");

  if (factId) {
    return NextResponse.json({ forgotten: chat.forget(factId), factId });
  }

  chat.reset();
  return NextResponse.json({ reset: true });
}
