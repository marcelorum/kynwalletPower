import { MESSAGES } from '@/domain/messages';
import { initialRegisterState, registerReducer, type RegisterState } from './registerReducer';

const filled: RegisterState = {
  ...initialRegisterState,
  values: {
    fullName: 'Ana García',
    email: 'ana@example.test',
    password: 'secreto-123',
    confirmPassword: 'secreto-123',
  },
  acceptsTerms: true,
};

describe('registerReducer', () => {
  it('R007: estado inicial en editing con valores vacíos', () => {
    expect(initialRegisterState.status).toBe('editing');
    expect(initialRegisterState.values).toEqual({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    expect(initialRegisterState.acceptsTerms).toBe(false);
  });

  it('R007: submit válido → submitting', () => {
    expect(registerReducer(filled, { type: 'submit' }).status).toBe('submitting');
  });

  it('R007: un segundo submit en submitting se ignora', () => {
    const submitting = registerReducer(filled, { type: 'submit' });
    expect(registerReducer(submitting, { type: 'submit' })).toBe(submitting);
  });

  it('R007: success → estado final con redirección pendiente', () => {
    const submitting = registerReducer(filled, { type: 'submit' });
    const next = registerReducer(submitting, { type: 'result', result: { kind: 'success' } });
    expect(next.status).toBe('success');
  });

  it('R007: change recalcula y limpia el error del campo', () => {
    const submitted = registerReducer(initialRegisterState, { type: 'submit' });
    expect(submitted.fieldErrors.email).toBe(MESSAGES.EMAIL_REQUIRED);
    const next = registerReducer(submitted, {
      type: 'change',
      field: 'email',
      value: 'ana@example.test',
    });
    expect(next.values.email).toBe('ana@example.test');
    expect(next.fieldErrors.email).toBeUndefined();
  });

  it('R007: blur marca el campo como tocado y calcula su error', () => {
    const next = registerReducer(initialRegisterState, { type: 'blur', field: 'email' });
    expect(next.touched.email).toBe(true);
    expect(next.fieldErrors.email).toBe(MESSAGES.EMAIL_REQUIRED);
    expect(next.fieldErrors.fullName).toBeUndefined();
  });

  it('R007: submit con errores marca todo y sigue en editing', () => {
    const next = registerReducer(initialRegisterState, { type: 'submit' });
    expect(next.status).toBe('editing');
    expect(next.fieldErrors).toEqual({
      fullName: MESSAGES.NAME_REQUIRED,
      email: MESSAGES.EMAIL_REQUIRED,
      password: MESSAGES.PASSWORD_REQUIRED,
      confirmPassword: MESSAGES.CONFIRM_REQUIRED,
      acceptsTerms: MESSAGES.TERMS_REQUIRED,
    });
  });

  it('R007: toggleTerms actualiza la aceptación y limpia su error al aceptar', () => {
    const submitted = registerReducer(initialRegisterState, { type: 'submit' });
    expect(submitted.fieldErrors.acceptsTerms).toBe(MESSAGES.TERMS_REQUIRED);
    const next = registerReducer(submitted, { type: 'toggleTerms', checked: true });
    expect(next.acceptsTerms).toBe(true);
    expect(next.fieldErrors.acceptsTerms).toBeUndefined();
  });

  it('R007: unavailable → registerError', () => {
    const submitting = registerReducer(filled, { type: 'submit' });
    const next = registerReducer(submitting, { type: 'result', result: { kind: 'unavailable' } });
    expect(next.status).toBe('registerError');
    expect(next.submitError).toBe('unavailable');
  });

  it('R007: change tras registerError vuelve a editing sin mensaje', () => {
    const failed: RegisterState = {
      ...filled,
      status: 'registerError',
      submitError: 'unavailable',
    };
    const next = registerReducer(failed, {
      type: 'change',
      field: 'fullName',
      value: 'Ana García López',
    });
    expect(next.status).toBe('editing');
    expect(next.submitError).toBeNull();
  });

  it('R007: showNotice guarda el aviso y submit lo limpia', () => {
    const noticed = registerReducer(filled, {
      type: 'showNotice',
      message: MESSAGES.SOCIAL_COMING_SOON,
    });
    expect(noticed.notice).toBe(MESSAGES.SOCIAL_COMING_SOON);
    expect(registerReducer(noticed, { type: 'submit' }).notice).toBeNull();
  });

  it('R007: dismissNotice limpia el aviso conservando los valores', () => {
    const noticed = registerReducer(filled, {
      type: 'showNotice',
      message: MESSAGES.SOCIAL_COMING_SOON,
    });
    const next = registerReducer(noticed, { type: 'dismissNotice' });
    expect(next.notice).toBeNull();
    expect(next.values).toEqual(filled.values);
  });
});
