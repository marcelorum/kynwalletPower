---

description: "Task list for 002-registro-usuarios"
---

# Tasks: Pantalla de Registro de KynWallet

**Input**: Design documents from `/specs/002-registro-usuarios/`

**Prerequisites**: spec.md, plan.md

**Feature doc**: `odd/tasks/registro-usuarios.md` (T3)

**Tests**: OBLIGATORIAS donde aplique. TDD (RED → GREEN → REFACTOR) con Vitest + Testing Library para dominio, aplicación, reducer e integración. Excepción: este `tasks.md` es documento pasivo, sin RED aplicable (igual que T1/T2).

**Organization**: Tasks are grouped by layer first (dominio → aplicación → UI → cableado App) and then by user story, to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Rutas relativas a la raíz del repositorio. Las pruebas viven junto al código (`*.test.ts(x)`).
- Trazabilidad: cada `it(...)` DEBE empezar con el ID del escenario o requisito que verifica, p. ej. `it('US2-2: correo mal formado…')`.
- Cada tarea cierra con un work-unit commit convencional (tests junto al código, docs junto al cambio visible). Heurístico ~400 líneas por tarea solo orientativo, sin rework cosmético.

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 800–1100 (5–7 archivos nuevos + 4–5 modificados, con tests co-ubicados) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (feature branch `feature/registro-marcelo-nazar` ya existe; slices posibles: dominio+aplicación → UI+App → verificación) |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Dominio + aplicación + gateway (R001–R006) | Single PR | `npx vitest run src/domain/validation.test.ts src/application/register.test.ts` | N/A (lógica pura, sin UI) | `src/domain/registration.ts`, `src/domain/validation.ts`, `src/domain/messages.ts`, `src/application/register.ts`, `src/application/ports/RegistrationGateway.ts`, `src/infrastructure/InMemoryRegistrationGateway.ts` |
| 2 | UI registro + cableado App (R007–R013) | Single PR | `npx vitest run src/ui/features/register/` | `npm run dev` a 1440px y 375px: registro válido → `/login` con éxito | `src/ui/features/register/`, `src/App.tsx`, `src/ui/features/login/LoginForm.tsx` |
| 3 | Verificación (R014–R016) | Single PR | `npm run verify` (o subconjunto autorizado en T5) | `npm run dev` + spot check Figma frame 04 | Sin cambios producto; solo evidencia |

---

## Phase 1: Dominio (Blocking Prerequisites)

**Purpose**: Fuente única de validación y textos; todo lo demás depende de esto

**⚠️ CRITICAL**: No UI work can begin until R001–R003 are green

- [ ] R001 [P] [US1/US2] RED: pruebas de `validateRegistration` y `normalizeFullName` en `src/domain/validation.test.ts`
  - Objetivo: fijar el contrato de validación antes de implementarlo (FR-004–FR-008 + edge cases).
  - Archivos: `src/domain/validation.test.ts` (edit), `src/domain/registration.ts` (nuevo, solo tipos para compilar el test).
  - Aceptación: casos nombre (vacío, 1 visible, > 100, tildes/eñes/guiones válidos, trim + colapso interno), correo (vacío, mal formado `usuario@`/`usuario.com`, > 254, mayúsculas + espacios aceptados), contraseña (vacía, < 8, > 128, espacios respetados), confirmación (vacía, distinta), términos sin aceptar; válido → `{}`. Test falla antes de R002.
  - Tests: `npx vitest run src/domain/validation.test.ts` en rojo.
  - Commit sugerido: `test(registro): casos validateRegistration y normalizeFullName` (RED; sin producto aún).
- [ ] R002 [US1/US2] GREEN: implementar `validateRegistration` + `normalizeFullName`
  - Objetivo: validación pura en el dominio, reutilizando `normalizeEmail`, `isValidEmail`, `isValidPasswordLength`.
  - Archivos: `src/domain/registration.ts` (tipos `RegistrationData`, `RegistrationResult`, `RegistrationErrors`), `src/domain/validation.ts` (edit).
  - Aceptación: R001 en verde; sin imports de React/aplicación/infra en `domain/` (regla ESLint vigente); contraseñas nunca en mensajes de error.
  - Tests: `npx vitest run src/domain/validation.test.ts` en verde.
  - Commit sugerido: `feat(registro): validacion dominio con normalizacion` (cierra R001+R002 como work unit).
- [ ] R003 [P] [US1/US4] Ampliar `src/domain/messages.ts` con textos del registro
  - Objetivo: fuente única de textos (Principio IV) para errores, éxito y aviso social.
  - Archivos: `src/domain/messages.ts` (edit).
  - Aceptación: constantes nuevas `NAME_REQUIRED`, `NAME_INVALID`, `CONFIRM_REQUIRED`, `PASSWORDS_MISMATCH`, `TERMS_REQUIRED`, `REGISTER_SUCCESS: 'Cuenta creada. Inicia sesión'`, `SOCIAL_COMING_SOON: 'Próximamente'`; verified by import en R002/R006 tests (sin test propio de constantes).
  - Tests: re-ejecutar `npx vitest run src/domain/validation.test.ts` en verde.
  - Commit sugerido: `feat(registro): textos dominio para registro y aviso social`.

**Checkpoint**: `npx vitest run src/domain/validation.test.ts` en verde; `npx eslint src/domain/` limpio

---

## Phase 2: Aplicación e Infraestructura

**Purpose**: Caso de uso `register()` + gateway en memoria; sin backend real (FR-011)

- [ ] R004 [P] Crear el puerto `src/application/ports/RegistrationGateway.ts`
  - Objetivo: puerto DIP `register(data): Promise<RegistrationResult>` (espejo de `AuthGateway`).
  - Archivos: `src/application/ports/RegistrationGateway.ts` (nuevo).
  - Aceptación: interfaz exportada con el tipo del dominio; `src/application/**` solo importa `@/domain`.
  - Tests: sin test propio; lo ejercitan R005–R006.
  - Commit sugerido: `feat(registro): puerto RegistrationGateway` (puede plegarse con R006 si se prefiere un solo work unit).
- [ ] R005 [US1] RED: pruebas del caso de uso en `src/application/register.test.ts`
  - Objetivo: fijar que `register()` valida antes de delegar, normaliza el correo y mapea fallos a `unavailable`.
  - Archivos: `src/application/register.test.ts` (nuevo, gateway falso).
  - Aceptación: con errores → gateway NO invocado; correo `  User@Example.COM ` → delegado normalizado `user@example.com`, contraseña sin modificar; gateway que lanza → `unavailable`. Test falla antes de R006.
  - Tests: `npx vitest run src/application/register.test.ts` en rojo.
  - Commit sugerido: `test(registro): casos register con gateway falso` (RED).
- [ ] R006 [US1] GREEN: implementar `src/application/register.ts` + `src/infrastructure/InMemoryRegistrationGateway.ts`
  - Objetivo: caso de uso `createRegister(gateway) => (data) => Promise<RegistrationResult>` y adaptador en memoria con espera ~1 s, siempre éxito si validó (FR-011/FR-012), sin persistencia.
  - Archivos: `src/application/register.ts` (nuevo), `src/infrastructure/InMemoryRegistrationGateway.ts` (nuevo), `src/infrastructure/InMemoryRegistrationGateway.test.ts` (nuevo: resuelve éxito tras espera con fake timers; nunca expone la contraseña).
  - Aceptación: R005 en verde; gateway captura excepciones → `unavailable` sin rechazar; resultado nunca contiene la contraseña; sin `console` ni storage.
  - Tests: `npx vitest run src/application/register.test.ts src/infrastructure/InMemoryRegistrationGateway.test.ts` en verde.
  - Commit sugerido: `feat(registro): caso de uso register y gateway en memoria`.

**Checkpoint**: dominio + aplicación + gateway en verde con `npx vitest run src/domain src/application src/infrastructure`

---

## Phase 3: User Story 1 — Crear cuenta con datos válidos (Priority: P1) 🎯 MVP

**Goal**: datos válidos + términos → espera con botón en carga → redirección a `/login` con "Cuenta creada. Inicia sesión"

**Independent Test**: completar los cuatro campos válidos, aceptar términos, presionar "Crear cuenta", ver carga y luego `/login` con éxito; Enter en confirmación envía; correo con mayúsculas/espacios aceptado

### Tests for User Story 1 ⚠️

> Escribir primero; confirmar que FALLAN antes de implementar

- [ ] R007 [P] [US1] RED: pruebas del reducer en `src/ui/features/register/registerReducer.test.ts`
  - Objetivo: fijar estado `valores/errores/status/aviso`; un solo intento en vuelo.
  - Archivos: `src/ui/features/register/registerReducer.test.ts` (nuevo).
  - Aceptación: inicial `editing` con valores vacíos; `submit` válido → `submitting`; segundo `submit` en `submitting` se ignora (edge doble clic); `success` → estado final con redirección pendiente; `change` recalcula y limpia el error del campo. Falla antes de R008.
  - Tests: `npx vitest run src/ui/features/register/registerReducer.test.ts` en rojo.
  - Commit sugerido: `test(registro): casos registerReducer y anti-doble-envio` (RED).
- [ ] R008 [US1] GREEN: implementar `registerReducer.ts` + `useRegisterForm.ts`
  - Objetivo: estado controlado espejo de `useLoginForm` (`change/blur/submit/showNotice`).
  - Archivos: `src/ui/features/register/registerReducer.ts` (nuevo), `src/ui/features/register/useRegisterForm.ts` (nuevo).
  - Aceptación: R007 en verde; `blur` valida el campo; `submit` con errores queda en `editing` sin llamar al gateway; ignora resultados si el componente se desmonta.
  - Tests: `npx vitest run src/ui/features/register/registerReducer.test.ts` en verde.
  - Commit sugerido: `feat(registro): reducer y hook del formulario`.
- [ ] R009 [US1] RED: pruebas de integración en `src/ui/features/register/RegisterForm.test.tsx` (US1 + US2-central)
  - Objetivo: fijar flujo válido, carga, Enter, normalización y validación inline con foco.
  - Archivos: `src/ui/features/register/RegisterForm.test.tsx` (nuevo, gateway falso + `user-event`).
  - Aceptación: US1-1 válido → `onSuccess` con correo normalizado; US1-2 durante espera botón `aria-busy`, deshabilitado, segundo clic no re-invoca; US1-3 Enter en confirmación envía; US1-4 correo con mayúsculas/espacios aceptado; US2-1 envío vacío → mensajes por campo, gateway no invocado, foco en el primer campo con error; US2-2 `usuario@` + blur → "Ingresa un correo electrónico válido"; US2-3 7 caracteres → longitud; US2-4 confirmación distinta → "Las contraseñas no coinciden"; US2-5 términos sin aceptar → mensaje y no registra; US2-6 corregir limpia el mensaje; errores anunciados vía `aria-describedby`. Fallan antes de R010.
  - Tests: `npx vitest run src/ui/features/register/RegisterForm.test.tsx` en rojo.
  - Commit sugerido: `test(registro): integracion flujo valido y validacion inline` (RED).

### Implementation for User Story 1

- [ ] R010 [US1/US2] GREEN: implementar `RegisterForm.tsx` + `RegisterScreen.tsx` (+ CSS)
  - Objetivo: formulario (`<form noValidate>`, `TextField` ×2, `PasswordField` ×2, `Checkbox` términos con enlace no navegante, `Button` "Crear cuenta" con `loading`, `Divider` "o regístrate con", `SocialButton` ×2, pie a login) y layout 2 paneles con `BrandPanel` reutilizado (FR-001/FR-019).
  - Archivos: `src/ui/features/register/RegisterForm.tsx` + `.module.css` (nuevos), `src/ui/features/register/RegisterScreen.tsx` + `.module.css` (nuevos). Reutiliza sin modificar: `TextField`, `PasswordField`, `Button`, `Checkbox`, `SocialButton`, `Divider`, `Alert`, `BrandPanel`.
  - Aceptación: R009 en verde; foco al primer campo con error; cada error con `aria-describedby`; móvil solo formulario con logo visible, sin scroll horizontal desde 320px; enlace de términos muestra aviso en página (decisión plan, sin navegación).
  - Tests: `npx vitest run src/ui/features/register/` en verde.
  - Commit sugerido: `feat(registro): formulario y pantalla de registro`.

**Checkpoint**: historia US1 funciona de punta a punta con `npm run dev` y sus pruebas pasan

---

## Phase 4: User Stories 2–4 — Validación inline, navegación y sociales (P1–P3)

**Goal**: US2 validación completa ya cubierta en R009/R010; aquí US3 (pie a `/login`) y US4 (Google/Apple "Próximamente" accesible)

- [ ] R011 [US3] RED→GREEN: navegación registro ↔ login sin router
  - Objetivo: pie "¿Ya tienes cuenta? Inicia sesión" navega a `/login` sin registrar; `App` conmuta `view: 'login' | 'register'`.
  - Archivos: `src/ui/features/register/RegisterForm.test.tsx` (ampliar: US3-1 clic/Enter en el pie → `onNavigateLogin`, gateway no invocado, sin errores; US3-2 solo-teclado alcanzable), `src/ui/features/register/RegisterForm.tsx` (edit), `src/App.tsx` (edit).
  - Aceptación: US3-1/US3-2 en verde; foco en punto lógico de `/login` tras navegar.
  - Tests: `npx vitest run src/ui/features/register/RegisterForm.test.tsx src/App.test.tsx` en verde.
  - Commit sugerido: `feat(registro): navegacion registro-login sin router`.
- [ ] R012 [US4] RED→GREEN: aviso social "Próximamente" accesible + pie login "Regístrate"
  - Objetivo: Google/Apple y enlace de términos muestran `Alert tone="info"` "Próximamente", conservan datos y devuelven el foco al botón origen al cerrar (decisión plan; no `window.alert`); `LoginForm` suma pie "Regístrate" y muestra `successMessage` visible y anunciado.
  - Archivos: `src/ui/features/register/RegisterForm.test.tsx` (ampliar: US4-1 cada botón social → aviso, datos conservados; US4-2 cerrar devuelve foco), `src/ui/features/register/RegisterForm.tsx` + reducer (edit), `src/ui/features/login/LoginForm.tsx` (edit: pie + `successMessage`), `src/App.tsx` + `src/App.test.tsx` (edit: `successMessage: 'Cuenta creada. Inicia sesión'` tras registro).
  - Aceptación: US4-1/US4-2 en verde; el aviso usa `role="status"`; éxito en login visible y anunciado (`role="status"`/`alert` según patrón `Alert`).
  - Tests: `npx vitest run src/ui/features/register/ src/App.test.tsx` en verde.
  - Commit sugerido: `feat(registro): aviso social accesible y exito en login`.
- [ ] R013 [US2-fidelidad] Verificación de contraste botón/placeholder con axe
  - Objetivo: cubrir el riesgo del plan (botón `#FF6B3D` de Figma): auditoría axe sobre registro + revisión manual de contraste AA de botón y placeholders.
  - Archivos: `src/App.test.tsx` (ampliar: sin violaciones axe en vista registro con errores y tras aviso) — edit; si falla, tokens derivados accesibles como en login (desviación documentada en el PR, no rework cosmético).
  - Aceptación: axe sin violaciones; contraste texto/botón AA verificado manualmente; atentos a placeholder (token `neutral-600` del login si el de Figma falla).
  - Tests: `npx vitest run src/App.test.tsx` en verde.
  - Commit sugerido: `test(registro): accesibilidad axe y contraste` (o `fix(registro): tokens accesibles derivados` si hubo que ajustar).

**Checkpoint**: US1–US4 funcionan de forma independiente; la pantalla coincide con el frame 04

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: seguridad, responsive, fidelidad Figma y controles de cumplimiento (T5 los ejecuta; aquí solo se declaran)

- [ ] R014 Seguridad: la contraseña nunca fuga
  - Objetivo: verificar FR-014 en el flujo de registro.
  - Archivos: `src/ui/features/register/RegisterForm.test.tsx` (ampliar: tras intento fallido y exitoso, la contraseña no aparece en `document.body.textContent`, `window.location.href`, llamadas `console.*` ni `Storage`).
  - Aceptación: test en verde.
  - Tests: `npx vitest run src/ui/features/register/RegisterForm.test.tsx` en verde.
  - Commit sugerido: `test(registro): sin fuga de contrasena` (plegable con R010/R012 si se prefiere).
- [ ] R015 Responsive + fidelidad visual (manual, sin código salvo fixes)
  - Objetivo: 320/480/960/1280/1440px sin scroll horizontal; 2 paneles en desktop, solo formulario en móvil; spot check contra Figma frame 04 (textos, orden, jerarquía).
  - Archivos: `src/ui/features/register/RegisterScreen.module.css` (edit solo si hay scroll o ruptura).
  - Aceptación: checklist manual anotado en el PR/T5; fixes mínimos solo si rompe FR-019.
  - Tests: N/A (verificación manual declarada para T5).
  - Commit sugerido: `fix(registro): responsive sin scroll horizontal` (solo si hizo falta; si no, sin commit).
- [ ] R016 Recorrido de verificación T5 (referencia, no se ejecuta en T3)
  - Objetivo: dejar trazado el cierre (lo ejecuta T5): lint, typecheck, test, build + spot check Figma.
  - Archivos: ninguno (referencia).
  - Aceptación: `npm run lint`, `npm run typecheck`, `npx vitest run`, `npm run build` declarados para T5; SC-003 (100 % escenarios P1/P2 automatizados) cubierto por R009–R013.
  - Tests: N/A en T3.
  - Commit sugerido: N/A (sin cambios).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Dominio)**: sin dependencias. R001 (RED) → R002 (GREEN); R003 en paralelo con R001 (archivos distintos)
- **Phase 2 (Aplicación/Infra)**: depende de Phase 1 (tipos + `validateRegistration`). R004 en paralelo; R005 (RED) → R006 (GREEN)
- **Phase 3 (US1)**: depende de Phase 2 (caso de uso + gateway). R007 → R008; R009 (RED) → R010 (GREEN)
- **Phase 4 (US3/US4)**: depende de Phase 3 (amplía `RegisterForm` y `App`). R011 → R012 → R013
- **Phase 5 (Polish)**: depende de todas las historias. R014–R015 en paralelo; R016 es referencia a T5

### Within Each User Story

- Pruebas primero, y deben FALLAR (Principio I, Constitución TDD)
- Dominio → aplicación/infraestructura → reducer/hook → componentes → integración → App
- Cada tarea se cierra con work-unit commit + focused test command en verde

### Parallel Opportunities

- R001 + R003 + R004 (archivos distintos)
- R005 + R007 (archivos distintos)
- R014 + R015 tras R012

---

## Parallel Example: Dominio + Aplicación

```bash
# RED en paralelo (archivos distintos):
npx vitest run src/domain/validation.test.ts
npx vitest run src/application/register.test.ts
npx vitest run src/ui/features/register/registerReducer.test.ts

# Verde por unidad:
npx vitest run src/domain/validation.test.ts src/application/register.test.ts
npx vitest run src/ui/features/register/
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Completar Phase 1 (Dominio) y Phase 2 (Aplicación/Infra)
2. Completar Phase 3 (US1: R007–R010)
3. **DETENERSE Y VALIDAR**: registro válido → `/login` con "Cuenta creada. Inicia sesión"; carga y anti-doble-envío
4. Demostrar el MVP

### Incremental Delivery

1. Phase 1 + 2 → base lista (work unit 1)
2. Phase 3 → US1 registro válido (MVP, work unit 2)
3. Phase 4 → US2 inline (ya en R009/R010) + US3 navegación + US4 sociales (work unit 2)
4. Phase 5 → seguridad, axe/contraste, responsive (work unit 3, alimenta T5)
5. T5 ejecuta `verify` completo; T6 push + PR (fuera de este tasks.md)

---

## Notes

- Decisiones confirmadas 2026-10-16 (plan + `docs/decisiones.md`): éxito `"Cuenta creada. Inicia sesión"` en `/login`; aviso accesible `"Próximamente"` en página (no `window.alert`); términos no navegante; navegación sin router en estado de `App`.
- Sin backend, persistencia, verificación de correo ni complejidad de contraseña más allá de longitud (spec Fuera de alcance).
- Sin librerías nuevas (sin router, sin formularios): reutiliza `TextField`, `PasswordField`, `Button`, `Checkbox`, `SocialButton`, `Divider`, `Alert`, `BrandPanel`.
- Hacer commit al cerrar cada tarea o grupo lógico con Conventional Commits, referenciando el ID (p. ej. `feat(registro): … [R010]` si el equipo lo adopta).
- Riesgo conocido: contraste AA del botón `#FF6B3D`/placeholder de Figma → R013 lo verifica; si falla, tokens accesibles derivados como en login.
