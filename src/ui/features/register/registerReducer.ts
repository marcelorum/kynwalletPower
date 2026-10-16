import type { RegistrationErrors, RegistrationResult } from '@/domain/registration';
import { validateRegistration } from '@/domain/validation';

export type RegisterField = 'fullName' | 'email' | 'password' | 'confirmPassword';
export type RegisterTouchedField = RegisterField | 'acceptsTerms';
export type RegisterFieldErrors = RegistrationErrors;

export type RegisterState = {
  status: 'editing' | 'submitting' | 'success' | 'registerError';
  values: Record<RegisterField, string>;
  acceptsTerms: boolean;
  touched: Record<RegisterTouchedField, boolean>;
  fieldErrors: RegisterFieldErrors;
  submitError: 'unavailable' | null;
  notice: string | null;
};

export type RegisterAction =
  | { type: 'change'; field: RegisterField; value: string }
  | { type: 'toggleTerms'; checked: boolean }
  | { type: 'blur'; field: RegisterField }
  | { type: 'showNotice'; message: string }
  | { type: 'dismissNotice' }
  | { type: 'submit' }
  | { type: 'result'; result: RegistrationResult };

export const initialRegisterState: RegisterState = {
  status: 'editing',
  values: { fullName: '', email: '', password: '', confirmPassword: '' },
  acceptsTerms: false,
  touched: {
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    acceptsTerms: false,
  },
  fieldErrors: {},
  submitError: null,
  notice: null,
};

function allTouched(): RegisterState['touched'] {
  return {
    fullName: true,
    email: true,
    password: true,
    confirmPassword: true,
    acceptsTerms: true,
  };
}

/** Errores visibles: solo los de campos ya tocados (espejo de loginReducer). */
function visibleErrors(
  values: RegisterState['values'],
  acceptsTerms: boolean,
  touched: RegisterState['touched'],
): RegisterFieldErrors {
  const data = { ...values, acceptsTerms };
  const errors = validateRegistration(data);
  const visible: RegisterFieldErrors = {};
  if (touched.fullName && errors.fullName) visible.fullName = errors.fullName;
  if (touched.email && errors.email) visible.email = errors.email;
  if (touched.password && errors.password) visible.password = errors.password;
  if (touched.confirmPassword && errors.confirmPassword) {
    visible.confirmPassword = errors.confirmPassword;
  }
  if (touched.acceptsTerms && errors.acceptsTerms) visible.acceptsTerms = errors.acceptsTerms;
  return visible;
}

/** Máquina de estados del formulario de registro (espejo de loginReducer, plan 002). */
export function registerReducer(state: RegisterState, action: RegisterAction): RegisterState {
  switch (action.type) {
    case 'change': {
      const values = { ...state.values, [action.field]: action.value };
      return {
        ...state,
        status: state.status === 'registerError' ? 'editing' : state.status,
        submitError: null,
        values,
        fieldErrors: visibleErrors(values, state.acceptsTerms, state.touched),
      };
    }

    case 'toggleTerms': {
      const touched = { ...state.touched, acceptsTerms: true };
      return {
        ...state,
        status: state.status === 'registerError' ? 'editing' : state.status,
        submitError: null,
        acceptsTerms: action.checked,
        touched,
        fieldErrors: visibleErrors(state.values, action.checked, touched),
      };
    }

    case 'blur': {
      const touched = { ...state.touched, [action.field]: true };
      return {
        ...state,
        touched,
        fieldErrors: visibleErrors(state.values, state.acceptsTerms, touched),
      };
    }

    case 'showNotice':
      return { ...state, notice: action.message };

    case 'dismissNotice':
      return { ...state, notice: null };

    case 'submit': {
      if (state.status === 'submitting') return state;
      const touched = allTouched();
      const fieldErrors = visibleErrors(state.values, state.acceptsTerms, touched);
      // FR-010: no se registra mientras existan errores de validación.
      const status = Object.keys(fieldErrors).length > 0 ? 'editing' : 'submitting';
      return { ...state, status, touched, fieldErrors, submitError: null, notice: null };
    }

    case 'result':
      if (action.result.kind === 'success') {
        return { ...state, status: 'success' };
      }
      if (action.result.kind === 'invalid') {
        return { ...state, status: 'editing', fieldErrors: action.result.errors };
      }
      return { ...state, status: 'registerError', submitError: 'unavailable' };
  }
}
