import type { RegistrationData } from '@/domain/registration';
import type { RegistrationGateway } from './ports/RegistrationGateway';
import { createRegister } from './register';

const valid: RegistrationData = {
  fullName: 'Ana María López',
  email: 'ana@example.test',
  password: 'secreto-123',
  confirmPassword: 'secreto-123',
  acceptsTerms: true,
};

const gatewayThatSucceeds = (): RegistrationGateway => ({
  register: vi.fn().mockResolvedValue({ kind: 'success' }),
});

describe('createRegister', () => {
  it('US1: con errores de validación no invoca al gateway y devuelve invalid', async () => {
    const gateway = gatewayThatSucceeds();
    const result = await createRegister(gateway)({
      ...valid,
      fullName: '',
      acceptsTerms: false,
    });
    expect(gateway.register).not.toHaveBeenCalled();
    expect(result.kind).toBe('invalid');
    expect(result).toEqual({
      kind: 'invalid',
      errors: expect.objectContaining({ fullName: expect.any(String) }),
    });
  });

  it('US1-4: delega con el correo y el nombre normalizados, contraseña sin modificar', async () => {
    const gateway = gatewayThatSucceeds();
    const result = await createRegister(gateway)({
      ...valid,
      fullName: '  Ana   María  ',
      email: '  Ana@Example.test ',
      password: ' con espacios ',
      confirmPassword: ' con espacios ',
    });
    expect(gateway.register).toHaveBeenCalledWith({
      fullName: 'Ana María',
      email: 'ana@example.test',
      password: ' con espacios ',
      confirmPassword: ' con espacios ',
      acceptsTerms: true,
    });
    expect(result).toEqual({ kind: 'success' });
  });

  it('FR-011: si el gateway lanza una excepción devuelve unavailable sin rechazar', async () => {
    const gateway: RegistrationGateway = {
      register: vi.fn().mockRejectedValue(new Error('caído')),
    };
    await expect(createRegister(gateway)(valid)).resolves.toEqual({ kind: 'unavailable' });
  });
});
