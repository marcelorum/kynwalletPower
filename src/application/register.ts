import type { RegistrationData, RegistrationResult } from '@/domain/registration';
import { normalizeEmail, normalizeFullName, validateRegistration } from '@/domain/validation';
import type { RegistrationGateway } from './ports/RegistrationGateway';

export type Register = (data: RegistrationData) => Promise<RegistrationResult>;

/** Caso de uso: valida y delega el registro en el puerto (espejo de authenticate). */
export function createRegister(gateway: RegistrationGateway): Register {
  return async (data) => {
    const errors = validateRegistration(data);
    if (Object.keys(errors).length > 0) return { kind: 'invalid', errors };
    try {
      return await gateway.register({
        ...data,
        fullName: normalizeFullName(data.fullName),
        email: normalizeEmail(data.email),
      });
    } catch {
      return { kind: 'unavailable' };
    }
  };
}
