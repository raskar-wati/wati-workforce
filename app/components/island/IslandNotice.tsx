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
 * actions — inline Approve/Reject for blocking notices, Review/Dismiss for
 * info ones — and, once a blocking notice is decided anywhere, the outcome
 * in place of the buttons.
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
          {notice.priority === "blocking" && !notice.resolved && (
            <> · waiting {formatAge(notice.at)}</>
          )}
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
      subtitle={
        blocking && !notice.resolved
          ? `${notice.body ?? ""} · waiting ${formatAge(notice.at)}`
          : notice.body
      }
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

  if (notice.priority === "blocking") {
    return (
      <div className="flex shrink-0 items-center gap-2">
        {notice.reviewToDecide ? (
          <CardCtaChip primary onClick={review}>
            Review
          </CardCtaChip>
        ) : (
          <>
            <button
              type="button"
              onClick={() => decideNotice(notice.id, "reject")}
              className="px-1 text-[13px] tracking-[-0.078px] text-black/60 hover:text-[#0a0a0a]"
            >
              Reject
            </button>
            <CardCtaChip primary onClick={() => decideNotice(notice.id, "approve")}>
              {notice.approveLabel ?? "Approve"}
            </CardCtaChip>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <CardCtaChip onClick={review}>Review</CardCtaChip>
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

function formatAge(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
