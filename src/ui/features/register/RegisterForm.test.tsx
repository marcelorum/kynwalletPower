import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RegistrationResult } from '@/domain/registration';
import { MESSAGES } from '@/domain/messages';
import { RegisterForm } from './RegisterForm';

/** Registro falso controlable desde las pruebas (espejo de createAuthStub). */
function createRegisterStub(result: RegistrationResult = { kind: 'success' }) {
  let resolvePending: (() => void) | null = null;
  let deferred = false;
  const fn = vi.fn(
    (): Promise<RegistrationResult> =>
      new Promise<RegistrationResult>((resolve) => {
        if (deferred) {
          resolvePending = () => resolve(result);
        } else {
          resolve(result);
        }
      }),
  );
  return {
    register: fn,
    /** Las siguientes llamadas quedan pendientes hasta llamar a release(). */
    defer() {
      deferred = true;
    },
    release() {
      resolvePending?.();
    },
  };
}

const VALID = {
  fullName: 'Ana García',
  email: 'ana@example.test',
  password: 'secreto-123',
};

function setup(stub = createRegisterStub()) {
  const user = userEvent.setup();
  const onSuccess = vi.fn();
  const onNavigateLogin = vi.fn();
  render(
    <RegisterForm
      register={stub.register}
      onSuccess={onSuccess}
      onNavigateLogin={onNavigateLogin}
    />,
  );
  const fullName = screen.getByLabelText('Nombre completo');
  const email = screen.getByLabelText('Correo electrónico');
  const password = screen.getByLabelText('Contraseña');
  const confirmPassword = screen.getByLabelText('Confirmar contraseña');
  const terms = screen.getByRole('checkbox', { name: 'Acepto los' });
  const submit = () => user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
  return {
    user,
    stub,
    onSuccess,
    onNavigateLogin,
    fullName,
    email,
    password,
    confirmPassword,
    terms,
    submit,
  };
}

async function fillValid(ctx: ReturnType<typeof setup>, overrides: Partial<typeof VALID> = {}) {
  const values = { ...VALID, ...overrides };
  await ctx.user.type(ctx.fullName, values.fullName);
  await ctx.user.type(ctx.email, values.email);
  await ctx.user.type(ctx.password, values.password);
  await ctx.user.type(ctx.confirmPassword, values.password);
  await ctx.user.click(ctx.terms);
}

describe('RegisterForm · US1 Crear cuenta con datos válidos', () => {
  it('R009 US1-1: datos válidos → onSuccess con el correo normalizado', async () => {
    const ctx = setup();
    await fillValid(ctx);
    await ctx.submit();
    await act(async () => {});
    expect(ctx.stub.register).toHaveBeenCalledOnce();
    expect(ctx.stub.register).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@example.test' }),
    );
    expect(ctx.onSuccess).toHaveBeenCalledOnce();
  });

  it('R009 US1-2: durante la espera el botón está ocupado y no admite reenvíos', async () => {
    const ctx = setup();
    ctx.stub.defer();
    await fillValid(ctx);
    await ctx.submit();
    const busy = screen.getByRole('button', { name: 'Creando cuenta…' });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    await ctx.user.click(busy);
    await ctx.user.keyboard('{Enter}');
    expect(ctx.stub.register).toHaveBeenCalledOnce();
    await act(async () => ctx.stub.release());
    expect(ctx.onSuccess).toHaveBeenCalledOnce();
  });

  it('R009 US1-3: Enter en la confirmación envía el formulario', async () => {
    const { user, stub, onSuccess, fullName, email, password, confirmPassword, terms } = setup();
    await user.type(fullName, VALID.fullName);
    await user.type(email, VALID.email);
    await user.type(password, VALID.password);
    await user.type(confirmPassword, `${VALID.password}{Enter}`);
    // Enter en confirmación envía antes de aceptar términos: solo falta ese error.
    expect(stub.register).not.toHaveBeenCalled();
    expect(screen.getByText(MESSAGES.TERMS_REQUIRED)).toBeInTheDocument();
    await user.click(terms);
    await user.click(confirmPassword);
    await user.keyboard('{Enter}');
    await act(async () => {});
    expect(stub.register).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('R009 US1-4: correo con mayúsculas se acepta y se delega tal cual', async () => {
    // El input type="email" recorta espacios; el caso de uso normaliza mayúsculas.
    const ctx = setup();
    await fillValid(ctx, { email: 'Ana@Example.TEST' });
    await ctx.submit();
    await act(async () => {});
    expect(ctx.stub.register).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'Ana@Example.TEST', password: VALID.password }),
    );
    expect(ctx.onSuccess).toHaveBeenCalledOnce();
  });
});

describe('RegisterForm · US2 Validación inline', () => {
  it('R009 US2-1: envío vacío → mensajes por campo, sin registrar y foco en el nombre', async () => {
    const { stub, submit, fullName } = setup();
    await submit();
    expect(screen.getByLabelText('Nombre completo')).toHaveAccessibleDescription(
      MESSAGES.NAME_REQUIRED,
    );
    expect(screen.getByLabelText('Correo electrónico')).toHaveAccessibleDescription(
      MESSAGES.EMAIL_REQUIRED,
    );
    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription(
      MESSAGES.PASSWORD_REQUIRED,
    );
    expect(screen.getByLabelText('Confirmar contraseña')).toHaveAccessibleDescription(
      MESSAGES.CONFIRM_REQUIRED,
    );
    expect(screen.getByText(MESSAGES.TERMS_REQUIRED)).toBeInTheDocument();
    expect(stub.register).not.toHaveBeenCalled();
    expect(fullName).toHaveFocus();
  });

  it('R009 US2-2: "usuario@" y salir del campo → mensaje de correo válido', async () => {
    const { user, email } = setup();
    await user.type(email, 'usuario@');
    await user.tab();
    expect(email).toHaveAccessibleDescription(MESSAGES.EMAIL_INVALID);
    expect(email).toHaveAttribute('aria-invalid', 'true');
  });

  it('R009 US2-3: contraseña de 7 caracteres → mensaje de longitud, sin registrar', async () => {
    const ctx = setup();
    await fillValid(ctx);
    await ctx.user.clear(ctx.password);
    await ctx.user.clear(ctx.confirmPassword);
    await ctx.user.type(ctx.password, '1234567');
    await ctx.user.type(ctx.confirmPassword, '1234567');
    await ctx.submit();
    expect(ctx.password).toHaveAccessibleDescription(MESSAGES.PASSWORD_TOO_SHORT);
    expect(ctx.stub.register).not.toHaveBeenCalled();
    expect(ctx.password).toHaveFocus();
  });

  it('R009 US2-4: confirmación distinta → "Las contraseñas no coinciden"', async () => {
    const ctx = setup();
    await fillValid(ctx);
    await ctx.user.clear(ctx.confirmPassword);
    await ctx.user.type(ctx.confirmPassword, 'otra-clave-99');
    await ctx.user.tab();
    expect(ctx.confirmPassword).toHaveAccessibleDescription(MESSAGES.PASSWORDS_MISMATCH);
    expect(ctx.stub.register).not.toHaveBeenCalled();
  });

  it('R009 US2-5: términos sin aceptar → mensaje y no registra', async () => {
    const { user, stub, fullName, email, password, confirmPassword, submit } = setup();
    await user.type(fullName, VALID.fullName);
    await user.type(email, VALID.email);
    await user.type(password, VALID.password);
    await user.type(confirmPassword, VALID.password);
    await submit();
    expect(screen.getByText(MESSAGES.TERMS_REQUIRED)).toBeInTheDocument();
    expect(stub.register).not.toHaveBeenCalled();
  });

  it('R009 US2-6: corregir el valor oculta el mensaje', async () => {
    const { user, email } = setup();
    await user.type(email, 'usuario@');
    await user.tab();
    await user.type(email, 'example.test');
    expect(email).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText(MESSAGES.EMAIL_INVALID)).not.toBeInTheDocument();
  });
});

describe('RegisterForm · US3 Navegación al login', () => {
  it('R011 US3-1: pie a login → navega sin registrar ni mostrar errores', async () => {
    const { user, stub, onNavigateLogin } = setup();
    await user.click(screen.getByRole('button', { name: 'Inicia sesión' }));
    expect(onNavigateLogin).toHaveBeenCalledOnce();
    expect(stub.register).not.toHaveBeenCalled();
    expect(screen.queryByText(MESSAGES.NAME_REQUIRED)).not.toBeInTheDocument();
  });

  it('R011 US3-2: el pie se activa solo con teclado', async () => {
    const { user, onNavigateLogin } = setup();
    const footer = screen.getByRole('button', { name: 'Inicia sesión' });
    footer.focus();
    await user.keyboard('{Enter}');
    expect(onNavigateLogin).toHaveBeenCalledOnce();
  });
});

describe('RegisterForm · US4 Aviso social accesible', () => {
  it.each(['Google', 'Apple'])(
    'R012 US4-1: "%s" muestra "Próximamente" y conserva los datos',
    async (provider) => {
      const ctx = setup();
      await ctx.user.type(ctx.fullName, VALID.fullName);
      await ctx.user.type(ctx.email, VALID.email);
      await ctx.user.click(screen.getByRole('button', { name: provider }));
      expect(screen.getByRole('status')).toHaveTextContent(MESSAGES.SOCIAL_COMING_SOON);
      expect(ctx.fullName).toHaveValue(VALID.fullName);
      expect(ctx.email).toHaveValue(VALID.email);
      expect(ctx.stub.register).not.toHaveBeenCalled();
    },
  );

  it('R012 US4-1b: el enlace de términos muestra el mismo aviso sin navegar', async () => {
    const ctx = setup();
    await ctx.user.type(ctx.fullName, VALID.fullName);
    await ctx.user.click(screen.getByRole('button', { name: 'términos y condiciones' }));
    expect(screen.getByRole('status')).toHaveTextContent(MESSAGES.SOCIAL_COMING_SOON);
    expect(ctx.fullName).toHaveValue(VALID.fullName);
    expect(ctx.stub.register).not.toHaveBeenCalled();
  });

  it.each(['Google', 'Apple'])(
    'R012 US4-2: cerrar el aviso de "%s" devuelve el foco al botón origen',
    async (provider) => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: provider }));
      await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
      expect(screen.queryByText(MESSAGES.SOCIAL_COMING_SOON)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: provider })).toHaveFocus();
    },
  );
});

describe('RegisterForm · seguridad (FR-014)', () => {
  it('R014: la contraseña no aparece en el DOM, la URL, la consola ni el almacenamiento', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      vi.spyOn(console, method),
    );
    const secret = 'clave-secreta-99';

    const ctx = setup(createRegisterStub({ kind: 'unavailable' }));
    await fillValid(ctx);
    await ctx.user.clear(ctx.password);
    await ctx.user.clear(ctx.confirmPassword);
    await ctx.user.type(ctx.password, secret);
    await ctx.user.type(ctx.confirmPassword, secret);
    await ctx.submit();
    await screen.findByRole('alert');

    const serialized = [
      document.body.textContent ?? '',
      window.location.href,
      ...setItem.mock.calls.flat(),
      ...consoleSpies.flatMap((spy) => spy.mock.calls.flat().map(String)),
    ].join('\n');
    expect(serialized).not.toContain(secret);
    expect(setItem).not.toHaveBeenCalled();

    setItem.mockRestore();
    consoleSpies.forEach((spy) => spy.mockRestore());
  });
});
