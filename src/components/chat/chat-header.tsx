interface ChatHeaderProps {
  companyName?: string;
  showProgress?: boolean;
  completedSteps?: number;
  totalSteps?: number;
  saving?: boolean;
}

export default function ChatHeader({
  companyName,
  showProgress,
  completedSteps = 0,
  totalSteps = 5,
  saving,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white text-sm font-bold">
          L
        </div>
        <h1 className="text-sm font-semibold text-zinc-100">Marketing AI</h1>
      </div>
      <div className="flex items-center gap-3">
        {showProgress && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                  i < completedSteps
                    ? "bg-violet-500"
                    : i === completedSteps && !saving
                    ? "bg-violet-500/40"
                    : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
        )}
        {companyName && (
          <span className="text-sm font-medium text-zinc-400">
            {companyName}
          </span>
        )}
      </div>
    </div>
  );
}
