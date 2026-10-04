/**
 * HIPAA Security Rule (45 CFR § 164.312(a)(2)(iii)) Oturum Kapatma Güvencesi
 * Klinik ve sağlık arayüzlerinde 15 dakikalık maksimum hareketsizlik kuralı.
 */
export const HIPAA_MAX_INACTIVITY_MS = 15 * 60 * 1000; // 15 dakika

export interface SessionActivityState {
  lastActiveAt: number;
  maxInactivityMs: number;
}

export function isHipaaSessionExpired(
  lastActiveAt: number | Date,
  currentTime: number = Date.now(),
  maxInactivityMs: number = HIPAA_MAX_INACTIVITY_MS
): boolean {
  const lastTime = typeof lastActiveAt === 'number' ? lastActiveAt : lastActiveAt.getTime();
  return (currentTime - lastTime) >= maxInactivityMs;
}

export function createSessionTracker(
  initialTime: number = Date.now(),
  maxInactivityMs: number = HIPAA_MAX_INACTIVITY_MS
): {
  recordActivity: (time?: number) => void;
  isExpired: (time?: number) => boolean;
  remainingMs: (time?: number) => number;
} {
  let lastActiveAt = initialTime;

  return {
    recordActivity: (time: number = Date.now()) => {
      lastActiveAt = time;
    },
    isExpired: (time: number = Date.now()) => {
      return (time - lastActiveAt) >= maxInactivityMs;
    },
    remainingMs: (time: number = Date.now()) => {
      const remaining = maxInactivityMs - (time - lastActiveAt);
      return remaining > 0 ? remaining : 0;
    }
  };
}
