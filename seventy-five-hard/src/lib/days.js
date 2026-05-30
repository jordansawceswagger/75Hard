// Local-time YYYY-MM-DD for "today" (avoids UTC off-by-one near midnight).
export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Day number of the 75 Hard run. The start date itself is day 1.
// Returns at least 1 (a future start_date still reads as day 1).
export function daysSince(startDate) {
  if (!startDate) return 1;
  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date(`${todayISO()}T00:00:00`);
  const diff = Math.floor((now - start) / 86400000);
  return Math.max(1, diff + 1);
}
