import { NextResponse } from "next/server";
import { projects, messages } from "@/data/projects";
import { projectResponses, pickRandom } from "@/lib/assistant-responses";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const projectMessages = messages.filter((m) => m.projectId === id);
  return NextResponse.json({ messages: projectMessages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const userMessage = {
    id: `m${Date.now()}`,
    projectId: id,
    role: "user" as const,
    content,
    createdAt: now,
  };

  const assistantMessage = {
    id: `m${Date.now() + 1}`,
    projectId: id,
    role: "assistant" as const,
    content: pickRandom(projectResponses),
    createdAt: new Date(Date.now() + 1000).toISOString(),
  };

  messages.push(userMessage, assistantMessage);

  project.lastMessage = assistantMessage.content;
  project.lastMessageAt = assistantMessage.createdAt;
  project.messagesCount += 2;

  return NextResponse.json({ messages: [userMessage, assistantMessage] }, { status: 201 });
}
