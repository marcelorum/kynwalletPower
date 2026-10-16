/** Datos del formulario de registro (spec 002-registro-usuarios, Key Entities). */
export type RegistrationData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptsTerms: boolean;
};

/** Errores de validación por campo del formulario de registro. */
export type RegistrationErrors = Partial<Record<keyof RegistrationData, string>>;

/** Resultado del caso de uso de registro (espejo de AuthResult). */
export type RegistrationResult =
  { kind: 'success' } | { kind: 'invalid'; errors: RegistrationErrors } | { kind: 'unavailable' };
