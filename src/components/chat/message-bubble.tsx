import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  if (role === "assistant") {
    return (
      <div className="flex gap-3">
        <Avatar className="mt-0.5 shrink-0">
          <AvatarFallback className="bg-violet-600 text-white text-xs font-semibold">
            L
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-violet-400">Lia</span>
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%]">
        <div className="flex items-center justify-end gap-2 mb-1">
          <span className="text-sm font-medium text-zinc-400">Vous</span>
        </div>
        <div className="rounded-2xl rounded-tr-sm bg-violet-600 px-4 py-3 text-sm text-white leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
}
