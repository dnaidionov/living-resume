export type AnalyticsEvent =
  | "chat_started"
  | "ai_context_viewed"
  | "fit_analysis_started"
  | "fit_analysis_completed"
  | "contact_clicked";

export function trackEvent(event: AnalyticsEvent, detail?: Record<string, string>) {
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
