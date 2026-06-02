"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStrategySession } from "@/hooks/use-strategy-session";
import StrategySessionChat from "@/components/strategy/strategy-session-chat";
import StrategyWorkflowPanel from "@/components/strategy/strategy-workflow-panel";
import MetricsPanel from "@/components/metrics/metrics-panel";
import type { StrategyProgressSnapshot } from "@/lib/strategy-stages";

interface StrategyWorkspaceProps {
  /** Window title for the chat header. */
  title: string;
  subtitle?: string;
  /** BusinessDiscovery JSON to seed the diagnostic (optional). */
  discoveryJson?: string | null;
  /** Send the opening trigger automatically on mount. */
  autoStart?: boolean;
  /** Slot rendered at the far left of the chat header (e.g. a back button). */
  headerLeft?: ReactNode;
}

type PanelView = "funnel" | "metrics";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function RightPanel({
  snapshot,
  active,
  view,
  onView,
}: {
  snapshot: StrategyProgressSnapshot;
  active: boolean;
  view: PanelView;
  onView: (v: PanelView) => void;
}) {
  return (
    <div className="flex h-full w-full flex-col bg-zinc-950">
      <div className="flex gap-1 border-b border-zinc-800 px-3 py-2">
        <TabButton active={view === "funnel"} onClick={() => onView("funnel")}>
          Funnel
        </TabButton>
        <TabButton active={view === "metrics"} onClick={() => onView("metrics")}>
          Metrics
        </TabButton>
      </div>
      <div className="min-h-0 flex-1">
        {view === "funnel" ? (
          <StrategyWorkflowPanel snapshot={snapshot} active={active} />
        ) : (
          <MetricsPanel />
        )}
      </div>
    </div>
  );
}

/**
 * Split-screen strategy workspace: the live Lia conversation on the left, and a
 * right panel that toggles between the "4 Levels of B2B Marketing" funnel and
 * the marketing metrics dashboards (CAC per channel…). The panel is hidden
 * below `lg` and surfaced via a header toggle.
 */
export default function StrategyWorkspace({
  title,
  subtitle,
  discoveryJson,
  autoStart = true,
  headerLeft,
}: StrategyWorkspaceProps) {
  const session = useStrategySession({ discoveryJson });
  const startedRef = useRef(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState<PanelView>("funnel");

  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    startedRef.current = true;
    void session.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* Left — conversation */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-zinc-800">
        <StrategySessionChat
          messages={session.messages}
          isThinking={session.isThinking}
          pendingChoices={session.pendingChoices}
          starting={session.isStreaming || session.isThinking}
          title={title}
          subtitle={subtitle}
          headerLeft={headerLeft}
          onSend={session.sendMessage}
          onSelect={session.selectChoice}
          rightSlot={
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="ml-auto rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 lg:hidden"
            >
              {panelOpen ? "Fermer" : "Stratégie"}
            </button>
          }
        />
      </div>

      {/* Right — funnel / metrics (persistent on lg+) */}
      <aside className="hidden w-[400px] shrink-0 lg:flex xl:w-[460px]">
        <RightPanel
          snapshot={session.snapshot}
          active={session.isStreaming}
          view={view}
          onView={setView}
        />
      </aside>

      {/* Right — panel overlay on small screens */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="flex-1 bg-black/60"
            onClick={() => setPanelOpen(false)}
            aria-hidden
          />
          <div className="w-[88%] max-w-[420px] border-l border-zinc-800 bg-zinc-950 shadow-2xl">
            <RightPanel
              snapshot={session.snapshot}
              active={session.isStreaming}
              view={view}
              onView={setView}
            />
          </div>
        </div>
      )}
    </div>
  );
}
