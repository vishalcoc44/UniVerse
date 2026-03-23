import { NextResponse } from "next/server";
import { createClient } from "@/lib/server-supabase";

export const runtime = "nodejs";

const allowedTypes = new Set(["feature", "bug"]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = typeof body?.type === "string" ? body.type : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";

    if (!allowedTypes.has(type)) {
      return NextResponse.json({ error: "Invalid feedback type." }, { status: 400 });
    }

    if (description.length < 10 || description.length > 2000) {
      return NextResponse.json(
        { error: "Feedback description must be between 10 and 2000 characters." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { error } = await supabase.from("UpdateFeedback").insert({
      id: crypto.randomUUID(),
      userId: user.id,
      type,
      description,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
