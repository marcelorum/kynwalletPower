import { useCallback, useState } from 'react';
import type { Authenticate } from '@/application/authenticate';
import { createRegister, type Register } from '@/application/register';
import { MESSAGES } from '@/domain/messages';
import { InMemoryRegistrationGateway } from '@/infrastructure/InMemoryRegistrationGateway';
import { LoginForm } from '@/ui/features/login/LoginForm';
import { LoginScreen } from '@/ui/features/login/LoginScreen';
import { RegisterForm } from '@/ui/features/register/RegisterForm';
import { RegisterScreen } from '@/ui/features/register/RegisterScreen';

type AppProps = {
  authenticate: Authenticate;
  register?: Register;
};

type View = 'login' | 'register';

// Gateway real por defecto para no cambiar la raíz de composición (main.tsx).
const defaultRegister = createRegister(new InMemoryRegistrationGateway());

/** Navegación sin router: la vista vive en el estado (plan 002, YAGNI). */
export function App({ authenticate, register = defaultRegister }: AppProps) {
  const [view, setView] = useState<View>('login');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const goRegister = useCallback(() => setView('register'), []);
  const goLogin = useCallback(() => setView('login'), []);
  const handleRegistered = useCallback(() => {
    setSuccessMessage(MESSAGES.REGISTER_SUCCESS);
    setView('login');
  }, []);

  if (view === 'register') {
    return (
      <RegisterScreen>
        <RegisterForm register={register} onSuccess={handleRegistered} onNavigateLogin={goLogin} />
      </RegisterScreen>
    );
  }

  return (
    <LoginScreen>
      <LoginForm
        authenticate={authenticate}
        onNavigateRegister={goRegister}
        successMessage={successMessage}
      />
    </LoginScreen>
  );
}
