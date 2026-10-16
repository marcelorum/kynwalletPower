import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { Register } from '@/application/register';
import { validateRegistration } from '@/domain/validation';
import {
  initialRegisterState,
  registerReducer,
  type RegisterField,
  type RegisterFieldErrors,
} from './registerReducer';

export function useRegisterForm(register: Register) {
  const [state, dispatch] = useReducer(registerReducer, initialRegisterState);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const change = useCallback((field: RegisterField, value: string) => {
    dispatch({ type: 'change', field, value });
  }, []);

  const blur = useCallback((field: RegisterField) => dispatch({ type: 'blur', field }), []);

  const toggleTerms = useCallback(
    (checked: boolean) => dispatch({ type: 'toggleTerms', checked }),
    [],
  );

  /** Valida y, si procede, registra. Devuelve los errores para que la vista gestione el foco. */
  const submit = useCallback((): RegisterFieldErrors => {
    if (inFlight.current) return {};
    const errors = validateRegistration({ ...state.values, acceptsTerms: state.acceptsTerms });
    dispatch({ type: 'submit' });
    if (Object.keys(errors).length > 0) return errors;

    inFlight.current = true;
    void register({ ...state.values, acceptsTerms: state.acceptsTerms }).then((result) => {
      inFlight.current = false;
      if (mounted.current) dispatch({ type: 'result', result });
    });
    return {};
  }, [register, state.values, state.acceptsTerms]);

  const showNotice = useCallback(
    (message: string) => dispatch({ type: 'showNotice', message }),
    [],
  );

  const dismissNotice = useCallback(() => dispatch({ type: 'dismissNotice' }), []);

  return { state, change, blur, toggleTerms, submit, showNotice, dismissNotice };
}
