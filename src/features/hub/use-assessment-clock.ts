import { useEffect, useState } from 'react';

/** Server deadlines, with monotonic elapsed time between ticks. */
export function useAssessmentClock(endsAt?: string, serverTime?: string) {
  const [clock, setClock] = useState({ key: '', remaining: 0 });
  const key = `${endsAt ?? ''}/${serverTime ?? ''}`;
  const initial = () => endsAt ? Math.max(0, Date.parse(endsAt) - (serverTime ? Date.parse(serverTime) : Date.now())) : 0;
  useEffect(() => {
    if (!endsAt) return;
    const duration = initial(), anchor = performance.now();
    const tick = () => setClock({ key, remaining: Math.max(0, duration - (performance.now() - anchor)) });
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [endsAt, serverTime, key]);
  return clock.key === key ? clock.remaining : initial();
}
