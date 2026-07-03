export function calculateLeadScore(signals: { hasPhone?: boolean; askedPrice?: boolean; wantsSchedule?: boolean }) {
  let score = 20;
  if (signals.hasPhone) score += 20;
  if (signals.askedPrice) score += 20;
  if (signals.wantsSchedule) score += 40;
  return Math.min(score, 100);
}
