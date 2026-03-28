export type AnalyticsEvent =
  | "chat_opened"
  | "chat_started"
  | "chat_prompt_clicked"
  | "chat_response_received"
  | "chat_fit_handoff_shown"
  | "chat_fit_handoff_accepted"
  | "chat_fit_handoff_declined"
  | "chat_closed"
  | "chat_error"
  | "ai_context_viewed"
  | "fit_analysis_started"
  | "fit_analysis_completed"
  | "contact_clicked"
  | "github_clicked"
  | "linkedin_clicked"
  | "resume_downloaded";

export type AnalyticsValue = string | number | boolean;

export function trackEvent(event: AnalyticsEvent, detail?: Record<string, AnalyticsValue>) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("living-resume:analytics", {
      detail: {
        event,
        ...detail
      }
    })
  );
}
