import type { RegistrationData, RegistrationResult } from '@/domain/registration';

/** Puerto de registro (espejo de AuthGateway). */
export interface RegistrationGateway {
  register(data: RegistrationData): Promise<RegistrationResult>;
}
