"use client";

import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";

export type FamilyWebNode = {
  id: string;
  label: string;
  subtitle: string;
  confidence: string;
  note: string;
  href?: string;
  bridge?: boolean;
};

export type FamilyWebLane = {
  title: string;
  subtitle: string;
  nodes: FamilyWebNode[];
  laneStyle: "documented" | "bridge";
};

export function FamilyWeb({
  lanes,
  selectedNodeId,
  onSelectNode
}: {
  lanes: FamilyWebLane[];
  selectedNodeId: string | null;
  onSelectNode: (node: FamilyWebNode) => void;
}) {
  return (
    <section className="archive-panel space-y-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="archive-kicker">How everyone fits together</div>
          <h2 className="archive-section__title text-3xl">How the family connects</h2>
          <p className="max-w-3xl text-sm leading-6 text-[var(--archive-text-soft)]">
            Solid connections show where we have good documents. Dotted ones are research that still needs more
            checking. This view helps keep the main family line clear.
          </p>
        </div>
        <div className="rounded-full border border-[rgba(18,20,24,0.1)] bg-[rgba(18,20,24,0.03)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--archive-text-soft)]">
          Direct line first, collateral branches muted
        </div>
      </div>

      <div className="space-y-4">
        {lanes.map((lane) => (
          <div key={lane.title} className="rounded-[1.5rem] border border-[rgba(18,20,24,0.1)] bg-[rgba(18,20,24,0.03)] p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="archive-eyebrow">{lane.title}</div>
                <div className="mt-1 text-sm leading-6 text-[var(--archive-text-soft)]">{lane.subtitle}</div>
              </div>
              <div className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                lane.laneStyle === "documented"
                  ? "border-[rgba(139,31,43,0.2)] bg-[rgba(139,31,43,0.08)] text-[var(--archive-accent)]"
                  : "border-[rgba(160,123,70,0.2)] bg-[rgba(160,123,70,0.08)] text-[var(--archive-accent-soft)]"
              }`}>
                {lane.laneStyle === "documented" ? "Solid connections" : "Bridge connections"}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto pb-2">
              <div className="min-w-[900px] sm:min-w-[1100px]">
                <div className="flex items-stretch">
                  {lane.nodes.map((node, index) => {
                    const selected = selectedNodeId === node.id;
                    return (
                      <div key={node.id} className="flex items-stretch">
                        <div className="w-[180px] sm:w-[230px]">
                          <button
                            type="button"
                            onClick={() => onSelectNode(node)}
                            className={`h-full w-full rounded-[1.4rem] border p-4 text-left transition hover:-translate-y-0.5 ${
                              node.bridge
                                ? "border-dashed border-[rgba(160,123,70,0.28)] bg-[rgba(37,29,46,0.9)] text-[rgba(244,239,231,0.95)]"
                                : "border-[rgba(18,20,24,0.08)] bg-[rgba(244,239,231,0.96)] text-[var(--archive-text)]"
                            } ${selected ? "ring-2 ring-[rgba(160,123,70,0.45)]" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(244,239,231,0.72)]">
                                {node.bridge ? "Research bridge" : "Loaded profile"}
                              </div>
                              <ConfidenceBadge label={node.confidence} />
                            </div>
                            <div className="mt-3 text-lg font-semibold leading-6 archive-display">{node.label}</div>
                            <div className="mt-2 text-xs uppercase tracking-[0.2em] text-[rgba(244,239,231,0.62)]">{node.subtitle}</div>
                            <div className="mt-3 text-sm leading-6 text-[rgba(244,239,231,0.78)]">{node.note}</div>
                            <div className="mt-4 flex items-center justify-between gap-3">
                              {node.href ? (
                                <Link
                                  href={node.href}
                                  className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--archive-accent)] underline decoration-[rgba(139,31,43,0.28)] underline-offset-4"
                                >
                                  Open profile
                                </Link>
                              ) : (
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(244,239,231,0.56)]">
                                  Bridge not yet loaded
                                </span>
                              )}
                              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(244,239,231,0.56)]">
                                Step {index + 1}
                              </span>
                            </div>
                          </button>
                        </div>
                        {index < lane.nodes.length - 1 ? (
                          <div className="flex w-[56px] items-center justify-center">
                            <div
                              className={`h-px w-full ${
                                lane.laneStyle === "documented"
                                  ? "border-t-2 border-[rgba(139,31,43,0.45)]"
                                  : "border-t-2 border-dashed border-[rgba(160,123,70,0.45)]"
                              }`}
                              aria-hidden="true"
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
