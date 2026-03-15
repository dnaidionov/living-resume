export function normalizeChatText(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/\n\s*\n+/g, "\n").trim();
}
