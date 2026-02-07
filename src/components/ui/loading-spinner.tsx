interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ message, fullScreen = true }: LoadingSpinnerProps) {
  return (
    <div className={fullScreen ? "flex h-screen items-center justify-center bg-zinc-950" : "flex items-center justify-center"}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        {message && <p className="text-sm text-zinc-500">{message}</p>}
      </div>
    </div>
  );
}
