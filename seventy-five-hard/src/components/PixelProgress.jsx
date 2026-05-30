const TASKS = ['workout_1', 'workout_2_outdoor', 'diet', 'no_alcohol'];

export default function PixelProgress({ log }) {
  if (!log) return null;
  let done = 0;
  for (const t of TASKS) if (log[t]) done++;
  if (log.water_count >= 3) done++;
  if (log.reading_pages >= 10) done++;
  if (log.photo_taken) done++;
  if (log.sleep_hours >= 8) done++;
  const total = 8;
  const cells = Array.from({ length: total }, (_, i) => i < done);

  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
      {cells.map((on, i) => (
        <div key={i} style={{
          flex: 1, height: 12,
          background: on ? 'var(--mint)' : '#fff',
          border: '2px solid var(--ink)',
        }} />
      ))}
    </div>
  );
}
