export interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  lastMessage?: string;
  lastMessageAt?: string;
  messagesCount: number;
}

export interface Message {
  id: string;
  projectId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  sector: string;
  description: string;
  target: string;
  brandTone: string;
  createdAt: string;
  updatedAt: string;
}
