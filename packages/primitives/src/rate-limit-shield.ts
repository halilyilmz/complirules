/**
 * Brute-Force Koruması — Kayar Pencere Rate Limit + Hesap Kilitleme
 *
 * Dayanak: 6698 s. KVKK Md. 12(1): "teknolojinin ulaştığı seviyeye uygun" teknik tedbir. Kurul,
 * brute-force/credential-stuffing ile hesap ele geçirilen vakalarda rate limit, kilitleme ve
 * çok faktörlü doğrulama eksikliğini veri sorumlusu kusuru olarak değerlendirmektedir.
 * Üretimde paylaşımlı depo (Redis) kullanın; bu uygulama tek süreçli referanstır.
 */

export interface RateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
  lockoutMs?: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  /** Eşik aşıldığında MFA zorunlu kılınmalıdır. */
  requireMfa: boolean;
}

export class RateLimitShield {
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly lockoutMs: number;
  private readonly failures = new Map<string, number[]>();
  private readonly lockedUntil = new Map<string, number>();

  constructor(options: RateLimitOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 5;
    this.windowMs = options.windowMs ?? 15 * 60 * 1000;
    this.lockoutMs = options.lockoutMs ?? 15 * 60 * 1000;
  }

  /** Anahtar: `ip:${ip}` ve `acct:${email}` için ayrı ayrı çağırın. */
  check(key: string, now = Date.now()): RateLimitDecision {
    const lock = this.lockedUntil.get(key);
    if (lock !== undefined && lock > now) {
      return { allowed: false, remaining: 0, retryAfterMs: lock - now, requireMfa: true };
    }
    const recent = this.recent(key, now);
    return {
      allowed: true,
      remaining: Math.max(0, this.maxAttempts - recent.length),
      retryAfterMs: 0,
      requireMfa: recent.length >= Math.ceil(this.maxAttempts / 2)
    };
  }

  recordFailure(key: string, now = Date.now()): RateLimitDecision {
    const recent = this.recent(key, now);
    recent.push(now);
    this.failures.set(key, recent);
    if (recent.length >= this.maxAttempts) {
      this.lockedUntil.set(key, now + this.lockoutMs);
      this.failures.delete(key);
      return { allowed: false, remaining: 0, retryAfterMs: this.lockoutMs, requireMfa: true };
    }
    return this.check(key, now);
  }

  recordSuccess(key: string): void {
    this.failures.delete(key);
    this.lockedUntil.delete(key);
  }

  private recent(key: string, now: number): number[] {
    return (this.failures.get(key) ?? []).filter(t => now - t < this.windowMs);
  }
}
