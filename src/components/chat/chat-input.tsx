"use client";
import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  function ChatInput({ value, onChange, onSubmit, placeholder, disabled }, ref) {
    return (
      <div className="px-4 py-4">
        <form
          onSubmit={onSubmit}
          className="mx-auto flex max-w-3xl items-center gap-2"
        >
          <Input
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
          />
          <Button
            type="submit"
            disabled={disabled || !value.trim()}
            className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        </form>
      </div>
    );
  }
);

export default ChatInput;
