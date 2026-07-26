import { NextResponse } from "next/server";
import { SarvamAIClient } from "sarvamai";
import { TOOL_SPECS, runTool } from "@/lib/tools";

export const maxDuration = 120;

const MAX_ROUNDS = 5;
const MAX_QUESTION = 400;

const SYSTEM = `You answer questions about a small Indian business's paperwork.

You have no knowledge of this business except what the tools return. Never state
an amount, a date, a rate or a deadline that did not come from a tool call in
this conversation. If the tools do not give you a figure, say you do not have it.

When a tool reports "ambiguous" or "unknown", say so plainly and say why. Do not
fill the gap with a likely answer. Being unable to answer is an acceptable
outcome; a confident wrong number about someone's tax is not.

Answer in plain English, short sentences. Amounts as "Rs 5,12,000". No em dashes.
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

  let body: { question?: unknown };
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

  const today = new Date().toISOString().slice(0, 10);

  const client = new SarvamAIClient({ apiSubscriptionKey: key });
  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: `${SYSTEM}\n\nToday's date is ${today}. Compute every "next month", "overdue" or "days left" against that date, never against any other assumption.` },
    { role: "user", content: question },
  ];

  const trace: Trace[] = [];
  const started = Date.now();

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
        const answer = choice?.message?.content;
        return NextResponse.json({
          answer: answer ?? "I could not produce an answer from the records I hold.",
          trace,
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

    return NextResponse.json({
      answer: "I could not settle this within the steps allowed.",
      trace,
      rounds: MAX_ROUNDS,
      totalMs: Date.now() - started,
    });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "ask failed";
    return NextResponse.json({ error: "ASK_FAILED", detail, trace }, { status: 502 });
  }
}
