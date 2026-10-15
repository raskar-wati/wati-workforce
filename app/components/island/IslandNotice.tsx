"use client";

import { AlertTriangle, Bell, Check, Clock, PencilLine, X } from "lucide-react";
import {
  useNotifications,
  type AppNotification,
  type NoticeOutcome,
} from "../../lib/notifications";
import { CardCtaChip, WorkforceCard, type ObjectState } from "../cards/WorkforceCard";

/**
 * One island notice, in the two places it can show: a compact row in the
 * open island, and a card in the Ask Wati page's chat. Both share the same
 * actions — one CTA (approve for blocking notices, Review for info ones)
 * plus a × to dismiss — and, once a blocking notice is decided anywhere, the
 * outcome in place of the buttons.
 */

const OUTCOME_LABEL: Record<NoticeOutcome, string> = {
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
  resolved: "Done",
};

const OUTCOME_STATE: Record<NoticeOutcome, ObjectState> = {
  approved: "live",
  rejected: "rejected",
  expired: "expired",
  resolved: "live",
};

export function IslandNoticeRow({
  notice,
  onAct,
}: {
  notice: AppNotification;
  /** Called after any action that should close the island (Review). */
  onAct?: () => void;
}) {
  const { openNotice } = useNotifications();
  return (
    <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-[var(--wati-surface-subtle)]">
      <button
        type="button"
        onClick={() => {
          openNotice(notice.id);
          onAct?.();
        }}
        className="flex min-w-0 flex-1 flex-col text-left"
      >
        <span className="truncate text-[13px] font-semibold text-[var(--wati-text-title)]">
          {notice.title}
        </span>
        <span className="truncate text-[12px] text-[var(--wati-text-body)] opacity-80">
          {notice.body}
          {notice.body && " · "}
          {formatStamp(notice.at)}
        </span>
      </button>
      <NoticeActions notice={notice} onAct={onAct} />
    </div>
  );
}

export function IslandNoticeCard({
  notice,
  onClose,
}: {
  notice: AppNotification;
  /** Remove the card from the chat (after Dismiss, or the × on a decided one). */
  onClose: () => void;
}) {
  const blocking = notice.priority === "blocking";
  return (
    <WorkforceCard
      tone={
        notice.resolved
          ? notice.resolved === "rejected"
            ? "danger"
            : notice.resolved === "expired"
              ? "neutral"
              : "success"
          : blocking
            ? "draft"
            : notice.kind === "run-failed"
              ? "danger"
              : "info"
      }
      icon={
        notice.resolved === "approved" || notice.resolved === "resolved" ? (
          <Check size={12} strokeWidth={2.5} />
        ) : notice.resolved === "rejected" ? (
          <X size={12} strokeWidth={2.5} />
        ) : notice.resolved === "expired" ? (
          <Clock size={12} strokeWidth={2.5} />
        ) : blocking ? (
          <PencilLine size={12} strokeWidth={2.5} />
        ) : notice.kind === "run-failed" ? (
          <AlertTriangle size={12} strokeWidth={2.5} />
        ) : notice.kind === "approval-expired" ? (
          <Clock size={12} strokeWidth={2.5} />
        ) : (
          <Bell size={12} strokeWidth={2.5} />
        )
      }
      title={notice.title}
      subtitle={[notice.body, formatStamp(notice.at)].filter(Boolean).join(" · ")}
      state={notice.resolved ? OUTCOME_STATE[notice.resolved] : blocking ? "draft" : undefined}
      stateLabel={notice.resolved ? OUTCOME_LABEL[notice.resolved] : undefined}
      actions={<NoticeActions notice={notice} onDismiss={onClose} showOutcome={false} />}
    />
  );
}

function NoticeActions({
  notice,
  onAct,
  onDismiss,
  showOutcome = true,
}: {
  notice: AppNotification;
  onAct?: () => void;
  /** Extra step after Dismiss, e.g. taking the card out of the chat. */
  onDismiss?: () => void;
  /** Rows show the outcome as text; cards already show it in the pill. */
  showOutcome?: boolean;
}) {
  const { openNotice, decideNotice, dismiss } = useNotifications();
  const review = () => {
    openNotice(notice.id);
    onAct?.();
  };

  if (notice.resolved) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        {showOutcome && (
          <span className="text-[12px] font-medium text-[var(--wati-text-body)]">
            {OUTCOME_LABEL[notice.resolved]}
          </span>
        )}
        {onDismiss && <DismissButton onClick={onDismiss} />}
      </div>
    );
  }

  // One CTA per notice: the approval itself for blocking ones (or Review
  // when it needs a cost check first), Review for updates — plus a × to
  // hide it. Hiding an approval doesn't reject the draft; it stays in the
  // agent thread and the approvals queue, where Reject lives.
  const primaryAction =
    notice.priority === "blocking" && !notice.reviewToDecide ? (
      <CardCtaChip onClick={() => decideNotice(notice.id, "approve")}>
        {notice.approveLabel ?? "Approve"}
      </CardCtaChip>
    ) : (
      <CardCtaChip onClick={review}>Review</CardCtaChip>
    );

  return (
    <div className="flex shrink-0 items-center gap-1">
      {primaryAction}
      <DismissButton
        onClick={() => {
          dismiss(notice.id);
          onDismiss?.();
        }}
      />
    </div>
  );
}

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Dismiss"
      className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--wati-icon-default)] hover:bg-black/[0.04]"
    >
      <X size={14} strokeWidth={1.75} />
    </button>
  );
}

/** When the notice arrived: "10:42 AM" today, "Yesterday, 10:42 AM", else "Oct 14, 10:42 AM". */
function formatStamp(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (days === 0) return time;
  if (days === 1) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
}
