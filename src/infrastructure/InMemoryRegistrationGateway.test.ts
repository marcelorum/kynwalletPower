import type { RegistrationData } from '@/domain/registration';
import type { RegistrationGateway } from '@/application/ports/RegistrationGateway';
import { InMemoryRegistrationGateway } from './InMemoryRegistrationGateway';

const valid: RegistrationData = {
  fullName: 'Ana María López',
  email: 'ana@example.test',
  password: 'secreto-123',
  confirmPassword: 'secreto-123',
  acceptsTerms: true,
};

describe('InMemoryRegistrationGateway (FR-011/FR-012)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // Se consume tras el puerto (uso real del caso de uso): la simulación ignora la entrada.
  const gateway = (options: { delayMs?: number } = {}): RegistrationGateway =>
    new InMemoryRegistrationGateway(options);

  it('FR-011: resuelve éxito sin persistencia', async () => {
    const result = await gateway({ delayMs: 0 }).register(valid);
    expect(result).toEqual({ kind: 'success' });
  });

  it('FR-014: el resultado nunca contiene la contraseña', async () => {
    const result = await gateway({ delayMs: 0 }).register(valid);
    expect(JSON.stringify(result)).not.toContain(valid.password);
  });

  it('FR-012: espera delayMs antes de responder (1000 ms por defecto)', async () => {
    vi.useFakeTimers();
    const onResolve = vi.fn();
    gateway().register(valid).then(onResolve);
    await vi.advanceTimersByTimeAsync(999);
    expect(onResolve).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(onResolve).toHaveBeenCalledOnce();
  });
});
