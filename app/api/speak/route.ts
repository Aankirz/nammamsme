import { NextResponse } from "next/server";
import { SarvamAIClient } from "sarvamai";

const MAX_CHARS = 480;

export async function POST(request: Request): Promise<NextResponse> {
  const key = process.env.SARVAM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  }

  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "EXPECTED_JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "NO_TEXT" }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: "TEXT_TOO_LONG", maxChars: MAX_CHARS }, { status: 413 });
  }

  try {
    const client = new SarvamAIClient({ apiSubscriptionKey: key });
    const result = (await client.textToSpeech.convert({
      text,
      target_language_code: "en-IN",
    })) as { audios?: string[] };

    const audio = result.audios?.[0];
    if (!audio) {
      return NextResponse.json({ error: "NO_AUDIO" }, { status: 502 });
    }

    return NextResponse.json({ audio, mimeType: "audio/wav" });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "speech failed";
    return NextResponse.json({ error: "SPEECH_FAILED", detail }, { status: 502 });
  }
}
