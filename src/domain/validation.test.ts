import { MESSAGES } from './messages';
import {
  normalizeEmail,
  normalizeFullName,
  validateCredentials,
  validateRegistration,
} from './validation';

describe('normalizeEmail', () => {
  it('US1-3: recorta espacios periféricos y convierte a minúsculas', () => {
    expect(normalizeEmail('  Demo@Example.COM ')).toBe('demo@example.com');
  });

  it('no altera el contenido interior', () => {
    expect(normalizeEmail('a.b+c@d.com')).toBe('a.b+c@d.com');
  });
});

describe('validateCredentials (data-model.md)', () => {
  const valid = { email: 'ana@example.test', password: 'secreto-123' };

  it('credenciales válidas → {}', () => {
    expect(validateCredentials(valid)).toEqual({});
  });

  it.each(['', '   '])('correo vacío tras trim (%j) → EMAIL_REQUIRED', (email) => {
    expect(validateCredentials({ ...valid, email }).email).toBe(MESSAGES.EMAIL_REQUIRED);
  });

  it.each(['usuario@', 'usuario.com', 'a@b.c', 'a b@c.com'])(
    'US3-2: correo sin formato válido (%s) → EMAIL_INVALID',
    (email) => {
      expect(validateCredentials({ ...valid, email }).email).toBe(MESSAGES.EMAIL_INVALID);
    },
  );

  it('correo de > 254 caracteres → EMAIL_INVALID', () => {
    const email = `${'a'.repeat(245)}@example.test`;
    expect(email.length).toBeGreaterThan(254);
    expect(validateCredentials({ ...valid, email }).email).toBe(MESSAGES.EMAIL_INVALID);
  });

  it('acepta el correo con espacios periféricos', () => {
    expect(validateCredentials({ ...valid, email: '  Ana@Example.test ' })).toEqual({});
  });

  it('contraseña vacía → PASSWORD_REQUIRED', () => {
    expect(validateCredentials({ ...valid, password: '' }).password).toBe(
      MESSAGES.PASSWORD_REQUIRED,
    );
  });

  it('US3-3: contraseña de < 8 caracteres → PASSWORD_TOO_SHORT', () => {
    expect(validateCredentials({ ...valid, password: '1234567' }).password).toBe(
      MESSAGES.PASSWORD_TOO_SHORT,
    );
  });

  it('contraseña de > 128 caracteres → PASSWORD_TOO_LONG', () => {
    expect(validateCredentials({ ...valid, password: 'x'.repeat(129) }).password).toBe(
      MESSAGES.PASSWORD_TOO_LONG,
    );
  });

  it('la contraseña no se recorta: 7 caracteres + espacios cuenta los espacios', () => {
    expect(validateCredentials({ ...valid, password: ' 123456 ' })).toEqual({});
    expect(validateCredentials({ ...valid, password: '        ' })).toEqual({});
  });
});

describe('normalizeFullName (FR-004)', () => {
  it('US1: recorta espacios periféricos y colapsa espacios internos', () => {
    expect(normalizeFullName('  Ana   María  López ')).toBe('Ana María López');
  });

  it('conserva un solo espacio entre palabras', () => {
    expect(normalizeFullName('Ana María')).toBe('Ana María');
  });

  it('solo espacios → cadena vacía', () => {
    expect(normalizeFullName('   ')).toBe('');
  });
});

describe('validateRegistration (FR-004–FR-008)', () => {
  const valid = {
    fullName: 'Ana María López',
    email: 'ana@example.test',
    password: 'secreto-123',
    confirmPassword: 'secreto-123',
    acceptsTerms: true,
  };

  it('US1-1: datos válidos → {}', () => {
    expect(validateRegistration(valid)).toEqual({});
  });

  it.each(['', '   '])('US2-1: nombre vacío tras normalizar (%j) → NAME_REQUIRED', (fullName) => {
    expect(validateRegistration({ ...valid, fullName }).fullName).toBe(MESSAGES.NAME_REQUIRED);
  });

  it('FR-004: nombre de 1 carácter visible → NAME_INVALID', () => {
    expect(validateRegistration({ ...valid, fullName: 'A' }).fullName).toBe(MESSAGES.NAME_INVALID);
  });

  it('FR-004: nombre de > 100 caracteres visibles → NAME_INVALID', () => {
    const fullName = 'a'.repeat(101);
    expect(validateRegistration({ ...valid, fullName }).fullName).toBe(MESSAGES.NAME_INVALID);
  });

  it('acepta tildes, eñes y guiones propios de nombres', () => {
    expect(validateRegistration({ ...valid, fullName: 'María-José Ñáñez' })).toEqual({});
  });

  it('acepta el nombre con espacios extra tras normalizar', () => {
    expect(validateRegistration({ ...valid, fullName: '  Ana   María  ' })).toEqual({});
  });

  it.each(['', '   '])('US2-1: correo vacío tras trim (%j) → EMAIL_REQUIRED', (email) => {
    expect(validateRegistration({ ...valid, email }).email).toBe(MESSAGES.EMAIL_REQUIRED);
  });

  it.each(['usuario@', 'usuario.com'])(
    'US2-2: correo sin formato válido (%s) → EMAIL_INVALID',
    (email) => {
      expect(validateRegistration({ ...valid, email }).email).toBe(MESSAGES.EMAIL_INVALID);
    },
  );

  it('FR-005: correo de > 254 caracteres → EMAIL_INVALID', () => {
    const email = `${'a'.repeat(245)}@example.test`;
    expect(email.length).toBeGreaterThan(254);
    expect(validateRegistration({ ...valid, email }).email).toBe(MESSAGES.EMAIL_INVALID);
  });

  it('US1-4: acepta el correo con mayúsculas y espacios periféricos', () => {
    expect(validateRegistration({ ...valid, email: '  Ana@Example.test ' })).toEqual({});
  });

  it('US2-1: contraseña vacía → PASSWORD_REQUIRED', () => {
    expect(validateRegistration({ ...valid, password: '' }).password).toBe(
      MESSAGES.PASSWORD_REQUIRED,
    );
  });

  it('US2-3: contraseña de < 8 caracteres → PASSWORD_TOO_SHORT', () => {
    expect(validateRegistration({ ...valid, password: '1234567' }).password).toBe(
      MESSAGES.PASSWORD_TOO_SHORT,
    );
  });

  it('FR-006: contraseña de > 128 caracteres → PASSWORD_TOO_LONG', () => {
    expect(validateRegistration({ ...valid, password: 'x'.repeat(129) }).password).toBe(
      MESSAGES.PASSWORD_TOO_LONG,
    );
  });

  it('la contraseña respeta los espacios: no se recorta', () => {
    const withSpaces = { ...valid, password: ' 123456 ', confirmPassword: ' 123456 ' };
    expect(validateRegistration(withSpaces)).toEqual({});
  });

  it('US2-1: confirmación vacía → CONFIRM_REQUIRED', () => {
    expect(validateRegistration({ ...valid, confirmPassword: '' }).confirmPassword).toBe(
      MESSAGES.CONFIRM_REQUIRED,
    );
  });

  it('US2-4: confirmación distinta de la contraseña → PASSWORDS_MISMATCH', () => {
    expect(
      validateRegistration({ ...valid, confirmPassword: 'otra-clave-99' }).confirmPassword,
    ).toBe(MESSAGES.PASSWORDS_MISMATCH);
  });

  it('FR-007: la confirmación respeta espacios (comparación exacta)', () => {
    expect(
      validateRegistration({ ...valid, password: 'secreto-123', confirmPassword: ' secreto-123' })
        .confirmPassword,
    ).toBe(MESSAGES.PASSWORDS_MISMATCH);
  });

  it('US2-5: términos sin aceptar → TERMS_REQUIRED', () => {
    expect(validateRegistration({ ...valid, acceptsTerms: false }).acceptsTerms).toBe(
      MESSAGES.TERMS_REQUIRED,
    );
  });

  it('US2-1: envío vacío muestra un error por campo obligatorio', () => {
    const errors = validateRegistration({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptsTerms: false,
    });
    expect(errors).toEqual({
      fullName: MESSAGES.NAME_REQUIRED,
      email: MESSAGES.EMAIL_REQUIRED,
      password: MESSAGES.PASSWORD_REQUIRED,
      confirmPassword: MESSAGES.CONFIRM_REQUIRED,
      acceptsTerms: MESSAGES.TERMS_REQUIRED,
    });
  });
});
