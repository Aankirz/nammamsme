import { NextResponse } from "next/server";
import { fillForm } from "@/lib/forms";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;

  const filled = await fillForm(id);
  if (!filled) {
    return NextResponse.json({ error: "NO_FORM_FOR_DOCUMENT", id }, { status: 404 });
  }

  return NextResponse.json(filled);
}
