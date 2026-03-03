type LogLevel = "info" | "warn" | "error";

export function logEvent(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    context,
    timestamp: new Date().toISOString()
  };

  if (level === "error") {
    console.error(payload);
    return;
  }

  console.log(payload);
}
