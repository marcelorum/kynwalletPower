import type { RegistrationGateway } from '@/application/ports/RegistrationGateway';
import type { RegistrationResult } from '@/domain/registration';

const DEFAULT_DELAY_MS = 1000;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Registro simulado en memoria (FR-011/FR-012): espera breve y siempre resuelve
 * éxito porque el caso de uso ya validó. Sin persistencia; la entrada se ignora
 * y el resultado nunca contiene la contraseña (FR-014).
 */
export class InMemoryRegistrationGateway implements RegistrationGateway {
  private readonly delayMs: number;

  constructor(options: { delayMs?: number } = {}) {
    this.delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
  }

  async register(): Promise<RegistrationResult> {
    await wait(this.delayMs);
    try {
      return { kind: 'success' };
    } catch {
      return { kind: 'unavailable' };
    }
  }
}
