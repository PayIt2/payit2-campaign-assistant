const amount = (s: string) => Number(s.replace(/,/g, ""));

export function parseRaised(text: string): { raised: number; goal: number } {
  const m = text.match(/\*\*Raised:\*\* \$([\d,]+(?:\.\d+)?) of \$([\d,]+(?:\.\d+)?) goal/);
  if (!m) throw new Error(`No "Raised" line in tool output:\n${text}`);
  return { raised: amount(m[1]), goal: amount(m[2]) };
}

export function parseField(text: string, label: string): string {
  const m = text.match(new RegExp(`\\*\\*${label}:\\*\\* (.+)`));
  if (!m) throw new Error(`No "${label}" line in tool output:\n${text}`);
  return m[1].trim();
}
