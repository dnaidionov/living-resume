export type ChatPromptTopic =
  | "experience_summary"
  | "product_strategy"
  | "ai_native_work"
  | "leadership"
  | "technical_depth"
  | "case_study"
  | "build_process"
  | "fit_check_request"
  | "contact_interest"
  | "other";

export type ChatAnalyticsMode = "resume_qa" | "build_process";
export type ChatEntryPoint = "header_cta" | "hero_cta";

export function classifyChatPromptTopic(message: string): ChatPromptTopic {
  const normalized = message.toLowerCase();

  if (/\bfit\b|\bjob\b|\brole\b/.test(normalized)) {
    return "fit_check_request";
  }

  if (/\bbuild\b|\bbuilt\b|\bsite\b|\bsystem\b|\barchitecture\b|\bhow this is built\b/.test(normalized)) {
    return "build_process";
  }

  if (/\bai\b|\bllm\b|\borchestration\b|\bai-native\b/.test(normalized)) {
    return "ai_native_work";
  }

  if (/\bstrategy\b|\broadmap\b|\bdiscovery\b|\bexecution\b/.test(normalized)) {
    return "product_strategy";
  }

  if (/\bleadership\b|\bmanage\b|\bteam\b|\bplayer-coach\b/.test(normalized)) {
    return "leadership";
  }

  if (/\btechnical\b|\bintegration\b|\bdata\b|\bdatabase\b|\bapi\b/.test(normalized)) {
    return "technical_depth";
  }

  if (/\bcase study\b|\bproject\b|\bexample\b/.test(normalized)) {
    return "case_study";
  }

  if (/\bcontact\b|\bemail\b|\breach out\b|\bbook\b/.test(normalized)) {
    return "contact_interest";
  }

  if (/\bexperience\b|\bbackground\b|\bstrongest\b|\bwhat kind of\b/.test(normalized)) {
    return "experience_summary";
  }

  return "other";
}

export function inferChatModeForAnalytics(message: string): ChatAnalyticsMode {
  return classifyChatPromptTopic(message) === "build_process" ? "build_process" : "resume_qa";
}

export function buildChatResponseReceivedDetail(
  mode: ChatAnalyticsMode,
  responseTimeMs: number,
  messageCount: number,
  containsLink: boolean
) {
  return {
    mode,
    response_time_ms: responseTimeMs,
    response_time_bucket: bucketChatResponseTime(responseTimeMs),
    message_count: messageCount,
    contains_link: containsLink
  };
}

export function buildChatClosedDetail(messageCount: number, hadResponse: boolean, durationMs: number) {
  return {
    message_count: messageCount,
    had_response: hadResponse,
    session_duration_bucket: bucketChatSessionDuration(durationMs)
  };
}

function bucketChatResponseTime(durationMs: number) {
  if (durationMs < 3_000) {
    return "under_3s";
  }

  if (durationMs < 8_000) {
    return "3s_to_8s";
  }

  if (durationMs < 15_000) {
    return "8s_to_15s";
  }

  return "15s_plus";
}

function bucketChatSessionDuration(durationMs: number) {
  if (durationMs < 30_000) {
    return "under_30s";
  }

  if (durationMs < 120_000) {
    return "30s_to_2m";
  }

  if (durationMs < 300_000) {
    return "2m_to_5m";
  }

  return "5m_plus";
}
