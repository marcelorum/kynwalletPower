import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RegistrationResult } from '@/domain/registration';
import { MESSAGES } from '@/domain/messages';
import { expectNoA11yViolations } from '@/test/a11y';
import { createAuthStub } from '@/test/authStub';
import { TEST_ACCOUNT } from '@/test/fixtures';
import { App } from './App';

/** Registro falso inmediato (la UI ya cubre la espera; aquí importa el cableado). */
function createRegisterStub() {
  const fn = vi.fn((): Promise<RegistrationResult> => Promise.resolve({ kind: 'success' }));
  return { register: fn };
}

async function goToRegister(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Regístrate' }));
  await screen.findByRole('button', { name: 'Crear cuenta' });
}

async function fillValidRegistration(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre completo'), 'Ana García');
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@example.test');
  await user.type(screen.getByLabelText('Contraseña'), 'secreto-123');
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'secreto-123');
  await user.click(screen.getByRole('checkbox', { name: 'Acepto los' }));
}

describe('App · accesibilidad de la pantalla completa (FR-015, SC-005)', () => {
  it('vista de login sin violaciones', async () => {
    const { container } = render(<App authenticate={createAuthStub().authenticate} />);
    await expectNoA11yViolations(container);
  });

  it('vista de login con errores visibles sin violaciones', async () => {
    const { container } = render(<App authenticate={createAuthStub().authenticate} />);
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await userEvent.click(screen.getByRole('button', { name: 'Google' }));
    await expectNoA11yViolations(container);
  });

  it('vista de bienvenida sin violaciones', async () => {
    const { container } = render(<App authenticate={createAuthStub().authenticate} />);
    await userEvent.type(screen.getByLabelText('Correo electrónico'), TEST_ACCOUNT.email);
    await userEvent.type(screen.getByLabelText('Contraseña'), TEST_ACCOUNT.password);
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await screen.findByRole('heading', { name: /Bienvenido,/ });
    await expectNoA11yViolations(container);
  });
});

describe('App · registro (R011–R013)', () => {
  it('R011 US3-1: "Regístrate" muestra el registro y "Inicia sesión" vuelve sin errores', async () => {
    const user = userEvent.setup();
    const register = createRegisterStub();
    render(<App authenticate={createAuthStub().authenticate} register={register.register} />);

    await goToRegister(user);
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Inicia sesión' }));
    expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre completo')).not.toBeInTheDocument();
    expect(screen.queryByText(MESSAGES.NAME_REQUIRED)).not.toBeInTheDocument();
    expect(register.register).not.toHaveBeenCalled();
  });

  it('R012 US1-1: registro válido → /login con éxito visible, anunciado y foco lógico', async () => {
    const user = userEvent.setup();
    const register = createRegisterStub();
    render(<App authenticate={createAuthStub().authenticate} register={register.register} />);

    await goToRegister(user);
    await fillValidRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    const success = await screen.findByRole('status');
    expect(success).toHaveTextContent(MESSAGES.REGISTER_SUCCESS);
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveFocus();
    expect(register.register).toHaveBeenCalledOnce();
  });

  it('R013: vista de registro sin violaciones, con errores y aviso visibles', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <App authenticate={createAuthStub().authenticate} register={createRegisterStub().register} />,
    );

    await goToRegister(user);
    await expectNoA11yViolations(container);

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    await user.click(screen.getByRole('button', { name: 'Google' }));
    await expectNoA11yViolations(container);
    await act(async () => {});
  });
});
