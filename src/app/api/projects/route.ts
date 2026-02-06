import { NextResponse } from "next/server";
import { projects } from "@/data/projects";

export async function GET() {
  const sorted = [...projects].sort((a, b) => {
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  return NextResponse.json({ projects: sorted });
}
