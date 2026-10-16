import { useEffect, useRef, type FormEvent, type RefObject } from 'react';
import type { Register } from '@/application/register';
import { MESSAGES } from '@/domain/messages';
import { Alert } from '@/ui/components/Alert/Alert';
import { Button } from '@/ui/components/Button/Button';
import { Checkbox } from '@/ui/components/Checkbox/Checkbox';
import { Divider } from '@/ui/components/Divider/Divider';
import { PasswordField } from '@/ui/components/PasswordField/PasswordField';
import { SocialButton } from '@/ui/components/SocialButton/SocialButton';
import { TextField } from '@/ui/components/TextField/TextField';
import { useRegisterForm } from './useRegisterForm';
import styles from './RegisterForm.module.css';

type RegisterFormProps = {
  register: Register;
  onSuccess: () => void;
  onNavigateLogin: () => void;
};

type NoticeOrigin = 'google' | 'apple' | 'terms';

function focusInside(ref: RefObject<HTMLElement | null>) {
  const target = ref.current?.querySelector('button, input');
  if (target instanceof HTMLElement) target.focus();
}

export function RegisterForm({ register, onSuccess, onNavigateLogin }: RegisterFormProps) {
  const { state, change, blur, toggleTerms, submit, showNotice, dismissNotice } =
    useRegisterForm(register);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLDivElement>(null);
  const googleRef = useRef<HTMLSpanElement>(null);
  const appleRef = useRef<HTMLSpanElement>(null);
  const termsLinkRef = useRef<HTMLSpanElement>(null);
  const noticeOrigin = useRef<NoticeOrigin | null>(null);

  // US1-1: el registro exitoso redirige a /login (el padre conmuta la vista).
  useEffect(() => {
    if (state.status === 'success') onSuccess();
  }, [state.status, onSuccess]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = submit();
    // US2-1: el foco va al primer campo con error.
    if (errors.fullName) fullNameRef.current?.focus();
    else if (errors.email) emailRef.current?.focus();
    else if (errors.password) passwordRef.current?.focus();
    else if (errors.confirmPassword) confirmRef.current?.focus();
    else if (errors.acceptsTerms) termsRef.current?.querySelector('input')?.focus();
  };

  const showComingSoon = (origin: NoticeOrigin) => {
    noticeOrigin.current = origin;
    showNotice(MESSAGES.SOCIAL_COMING_SOON);
  };

  // US4-2: al cerrar el aviso el foco vuelve al botón que lo originó.
  const closeNotice = () => {
    dismissNotice();
    const origin = noticeOrigin.current;
    noticeOrigin.current = null;
    if (origin === 'google') focusInside(googleRef);
    else if (origin === 'apple') focusInside(appleRef);
    else if (origin === 'terms') focusInside(termsLinkRef);
  };

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>Completa tus datos para comenzar</p>
      </div>

      <TextField
        label="Nombre completo"
        ref={fullNameRef}
        type="text"
        name="fullName"
        autoComplete="name"
        placeholder="Tu nombre completo"
        value={state.values.fullName}
        error={state.fieldErrors.fullName}
        onChange={(event) => change('fullName', event.target.value)}
        onBlur={() => blur('fullName')}
      />

      <TextField
        label="Correo electrónico"
        ref={emailRef}
        type="email"
        name="email"
        autoComplete="username"
        placeholder="tucorreo@ejemplo.com"
        value={state.values.email}
        error={state.fieldErrors.email}
        onChange={(event) => change('email', event.target.value)}
        onBlur={() => blur('email')}
      />

      <PasswordField
        label="Contraseña"
        ref={passwordRef}
        name="password"
        autoComplete="new-password"
        placeholder="••••••••"
        value={state.values.password}
        error={state.fieldErrors.password}
        onChange={(event) => change('password', event.target.value)}
        onBlur={() => blur('password')}
      />

      <PasswordField
        label="Confirmar contraseña"
        ref={confirmRef}
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="••••••••"
        value={state.values.confirmPassword}
        error={state.fieldErrors.confirmPassword}
        onChange={(event) => change('confirmPassword', event.target.value)}
        onBlur={() => blur('confirmPassword')}
      />

      <div className={styles.terms} ref={termsRef}>
        <Checkbox label="Acepto los" checked={state.acceptsTerms} onChange={toggleTerms} />
        <span ref={termsLinkRef}>
          <Button variant="link" onClick={() => showComingSoon('terms')}>
            términos y condiciones
          </Button>
        </span>
        {state.fieldErrors.acceptsTerms && (
          <p role="alert" className={styles.termsError}>
            {state.fieldErrors.acceptsTerms}
          </p>
        )}
      </div>

      {state.submitError && <Alert tone="error">{MESSAGES.UNAVAILABLE}</Alert>}

      <Button type="submit" loading={state.status === 'submitting'} loadingLabel="Creando cuenta…">
        Crear cuenta
      </Button>

      <Divider>o regístrate con</Divider>

      <div className={styles.social}>
        <span ref={googleRef}>
          <SocialButton provider="Google" onClick={() => showComingSoon('google')} />
        </span>
        <span ref={appleRef}>
          <SocialButton provider="Apple" onClick={() => showComingSoon('apple')} />
        </span>
      </div>

      {state.notice && (
        <Alert tone="info">
          {state.notice}{' '}
          <Button variant="link" onClick={closeNotice}>
            Cerrar aviso
          </Button>
        </Alert>
      )}

      <p className={styles.footer}>
        ¿Ya tienes cuenta?
        <Button variant="link" onClick={onNavigateLogin}>
          Inicia sesión
        </Button>
      </p>
    </form>
  );
}
