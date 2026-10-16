import type { LoginCredentials } from './auth';
import { MESSAGES } from './messages';
import type { RegistrationData, RegistrationErrors } from './registration';

export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const FULL_NAME_MIN_LENGTH = 2;
export const FULL_NAME_MAX_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type CredentialErrors = Partial<Record<keyof LoginCredentials, string>>;

/** Normaliza un correo para validarlo y compararlo: sin espacios periféricos y en minúsculas. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Normaliza un nombre: sin espacios periféricos y con espacios internos colapsados. */
export function normalizeFullName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, ' ');
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(normalized);
}

export function isValidPasswordLength(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
}

function validateEmail(email: string): string | undefined {
  if (normalizeEmail(email) === '') return MESSAGES.EMAIL_REQUIRED;
  if (!isValidEmail(email)) return MESSAGES.EMAIL_INVALID;
  return undefined;
}

function validatePassword(password: string): string | undefined {
  // La contraseña se valida sin recortar (FR-004).
  if (password === '') return MESSAGES.PASSWORD_REQUIRED;
  if (password.length < PASSWORD_MIN_LENGTH) return MESSAGES.PASSWORD_TOO_SHORT;
  if (password.length > PASSWORD_MAX_LENGTH) return MESSAGES.PASSWORD_TOO_LONG;
  return undefined;
}

/** Reglas de FR-003 y FR-004. Devuelve {} si las credenciales son válidas. */
export function validateCredentials({ email, password }: LoginCredentials): CredentialErrors {
  const errors: CredentialErrors = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
}

function validateFullName(fullName: string): string | undefined {
  const normalized = normalizeFullName(fullName);
  if (normalized === '') return MESSAGES.NAME_REQUIRED;
  if (normalized.length < FULL_NAME_MIN_LENGTH || normalized.length > FULL_NAME_MAX_LENGTH) {
    return MESSAGES.NAME_INVALID;
  }
  return undefined;
}

function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  // La confirmación se compara exacta, sin recortar (FR-007).
  if (confirmPassword === '') return MESSAGES.CONFIRM_REQUIRED;
  if (confirmPassword !== password) return MESSAGES.PASSWORDS_MISMATCH;
  return undefined;
}

function validateTerms(acceptsTerms: boolean): string | undefined {
  if (!acceptsTerms) return MESSAGES.TERMS_REQUIRED;
  return undefined;
}

/** Reglas de FR-004–FR-008. Devuelve {} si los datos de registro son válidos. */
export function validateRegistration(data: RegistrationData): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const fullNameError = validateFullName(data.fullName);
  const emailError = validateEmail(data.email);
  const passwordError = validatePassword(data.password);
  const confirmPasswordError = validateConfirmPassword(data.password, data.confirmPassword);
  const termsError = validateTerms(data.acceptsTerms);
  if (fullNameError) errors.fullName = fullNameError;
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
  if (termsError) errors.acceptsTerms = termsError;
  return errors;
}
