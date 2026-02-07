interface ChatHeaderProps {
  companyName?: string;
  showProgress?: boolean;
  saving?: boolean;
}

export default function ChatHeader({
  companyName,
  showProgress,
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
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
            <span className="text-xs text-zinc-500">
              {saving ? "Analyse en cours..." : "Entretien en cours"}
            </span>
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
