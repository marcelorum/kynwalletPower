# Implementation Plan: Pantalla de Registro de KynWallet

**Branch**: `002-registro-usuarios` | **Date**: 2026-10-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-registro-usuarios/spec.md`, Figma frame `04 · Registro` (nodo `31:2`), y referencia de formato `specs/001-login-billetera/plan.md`.

## Summary

Demo web solo-cliente de la pantalla de registro de KynWallet, fiel al diseño de Figma
(frame 04: 2 paneles en escritorio, solo formulario en móvil). Permite ingresar nombre
completo, correo, contraseña y confirmación, aceptar términos, valida todos los campos
inline, simula el registro con espera breve y redirige a `/login` con mensaje de éxito.
Se construye con React + TypeScript + Vite reutilizando el patrón del login: dominio puro,
caso de uso con puerto `RegistrationGateway`, adaptador en memoria y componentes de UI
existentes (`TextField`, `PasswordField`, `Button`, `Checkbox`, `SocialButton`, `Divider`,
`Alert`, `BrandPanel`). Sin router externo: la navegación `/register` ↔ `/login` vive en el
estado de `App`. Desarrollo guiado por pruebas con Vitest + Testing Library.

## Decisiones sobre las abiertas del spec

| Abierta del spec | Decisión (default razonable) |
|---|---|
| Texto exacto del mensaje de éxito en `/login` | `"Cuenta creada. Inicia sesión"` (propuesta del spec). Visible y anunciado por tecnologías de asistencia. |
| `window.alert` nativo vs aviso accesible para Google/Apple | Aviso accesible en página (`Alert tone="info"` con texto `"Próximamente"`), mismo patrón que el login (`FEATURE_UNAVAILABLE` → texto específico). Conserva foco y datos; el foco vuelve al botón que lo originó al cerrarse. |
| Destino y texto del enlace de términos y condiciones | Etiqueta del checkbox con enlace no navegante `"términos y condiciones"` que muestra el mismo aviso informativo en página (sin navegación externa ni documento legal, fuera de alcance). Se registra como supuesto hasta definición del responsable. |

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`), Node.js ≥ 20 LTS para herramientas

**Primary Dependencies**: React 19, Vite 8, `@fontsource-variable/inter` (sin cambios; sin router)

**Storage**: N/A (estado en memoria; la cuenta en registro no se persiste, spec Key Entities)

**Testing**: Vitest 5, React Testing Library, `@testing-library/user-event`, jsdom,
`axe-core` (helper propio en `src/test/a11y.ts`), `@vitest/coverage-v8` (igual que login)

**Target Platform**: Navegadores modernos (las dos últimas versiones de Chrome, Firefox, Safari
y Edge), de 320px a escritorio

**Project Type**: Aplicación web de página única (SPA), solo frontend

**Performance Goals**: resultado del intento válido en ≤ 2 s (SC-002), con espera simulada de
~1 s e indicador de carga en "Crear cuenta"

**Constraints**: sin backend, base de datos ni APIs externas; WCAG 2.1 AA; contraseñas nunca
registradas ni persistidas (FR-014); sin scroll horizontal desde 320px; móvil muestra solo el
formulario con logo visible

**Scale/Scope**: 1 pantalla nueva (registro) + enlace bidireccional con login existente;
~5 archivos nuevos de feature + extensiones de dominio/aplicación

## Architecture

Clean Architecture ligera, espejo del login (Principio III):

```text
RegisterForm ──→ useRegisterForm ──→ registerReducer ──→ register() ──→ RegistrationGateway
     │                    │                                              ▲ (puerto)
     │                    └── validateRegistration (domain puro)         │ InMemoryRegistrationGateway
     └────── TextField / PasswordField / Checkbox / Alert (ui/components, sin cambios)
App ──→ vista `register | login` + mensaje de éxito (único lugar con el estado de ruta)
```

- **`domain/`**: tipos `RegistrationData`, `RegistrationResult` y `validateRegistration`
  (nombre, correo, contraseña, confirmación, términos). Reutiliza `normalizeEmail`,
  `isValidEmail`, `isValidPasswordLength` de `validation.ts`; añade normalización de nombre
  (recorte periférico + colapso de espacios internos).
- **`application/`**: caso de uso `register()` que valida y delega en el puerto
  `RegistrationGateway`; normaliza el correo antes de registrar. Sin autenticación real.
- **`infrastructure/`**: `InMemoryRegistrationGateway` que simula la espera (~1 s) y
  siempre resuelve éxito si la validación pasó (sin persistencia, FR-011).
- **`ui/`**: `RegisterScreen` (layout 2 paneles con `BrandPanel` reutilizado) +
  `RegisterForm` (formulario controlado por `useRegisterForm`/`registerReducer`, mismo
  patrón que `LoginForm`). Enter envía (submit nativo del `<form>`). Foco al primer campo
  con error; errores asociados por `aria-describedby` (patrón existente de `TextField`).
- **Navegación sin router** (YAGNI, igual que login sin router): `App` mantiene
  `view: 'login' | 'register'` y `successMessage`; el pie "¿Ya tienes cuenta? Inicia sesión"
  y el pie del login "Regístrate" conmutan la vista. Alternativa rechazada: `react-router`,
  innecesario para 2 vistas de demo.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/domain/registration.ts` | Create | Tipos `RegistrationData`, `RegistrationResult`, `RegistrationErrors` |
| `src/domain/validation.ts` | Modify | Añade `validateRegistration` + `normalizeFullName`; reutiliza email/password existentes |
| `src/domain/validation.test.ts` | Modify | Casos: nombre, correo, longitudes, confirmación, términos, normalizaciones |
| `src/domain/messages.ts` | Modify | Textos nuevos: nombre, confirmación, términos, éxito, aviso social (fuente única) |
| `src/application/ports/RegistrationGateway.ts` | Create | Puerto `register(data): Promise<RegistrationResult>` |
| `src/application/register.ts` | Create | Caso de uso: valida y delega en el gateway (espejo de `authenticate.ts`) |
| `src/application/register.test.ts` | Create | No registra con errores; normaliza correo; mapea fallo a `unavailable` |
| `src/infrastructure/InMemoryRegistrationGateway.ts` | Create | Espera ~1 s y resuelve éxito; sin persistencia ni secretos versionados |
| `src/infrastructure/InMemoryRegistrationGateway.test.ts` | Create | Espera/estado de éxito; no expone la contraseña |
| `src/ui/features/register/RegisterScreen.tsx` (+ `.module.css`) | Create | Layout 2 paneles con `BrandPanel`; móvil solo formulario |
| `src/ui/features/register/RegisterForm.tsx` (+ `.module.css`) | Create | Campos, checkbox términos, botón con `loading`, sociales, pie a `/login` |
| `src/ui/features/register/RegisterForm.test.tsx` | Create | Integración: P1/P2 (US1, US2, US3) + aviso social (US4) |
| `src/ui/features/register/registerReducer.ts` (+ `.test.ts`) | Create | Estado valores/errores/status/aviso; un solo intento en vuelo |
| `src/ui/features/register/useRegisterForm.ts` | Create | Hook `change/blur/submit/showNotice` (espejo de `useLoginForm`) |
| `src/App.tsx` (+ `App.test.tsx`) | Modify | Conmuta `login ↔ register`; muestra mensaje de éxito en login tras registro |
| `src/ui/features/login/LoginForm.tsx` | Modify | Pie "Regístrate" navega a registro; muestra `successMessage` si existe |

**Structure Decision**: sin carpetas nuevas de capa; la feature vive en
`src/ui/features/register/` junto a `login/`. Pruebas co-ubicadas (`*.test.ts(x)`) como en
el login. Sin librerías de formularios ni estado global (KISS/YAGNI).

## Validation Strategy

Fuente única en `domain/validation.ts` (sin lógica en componentes):

| Campo | Regla (spec FR-004–FR-008) |
|---|---|
| Nombre completo | Obligatorio; 2–100 caracteres visibles tras normalizar (trim + colapso interno; tildes/eñes/guiones válidos) |
| Correo | Obligatorio; formato válido; ≤ 254; compara/registra normalizado (trim + minúsculas); contraseña respeta espacios |
| Contraseña | Obligatoria; 8–128 caracteres, sin recorte |
| Confirmación | Obligatoria; igualdad exacta con contraseña |
| Términos | Aceptación obligatoria; sin ella no se ejecuta el registro |

Comportamiento (FR-009/FR-010/FR-017/FR-018): valida al salir del campo (`blur`) y al enviar;
los errores se muestran junto al campo y desaparecen al corregirse; con errores no se llama
al gateway; el foco se mueve al primer campo con error; cada error se anuncia por
`aria-describedby`; Enter envía el formulario.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit (dominio) | `validateRegistration`, `normalizeFullName`, reutilización email/password | Vitest; tabla de casos por FR (válidos, vacíos, formatos, longitudes, confirmación, términos, normalizaciones) |
| Unit (aplicación) | `register()` | Gateway falso; verifica no-llamada con errores, normalización de correo, `unavailable` ante fallo |
| Unit (infra) | `InMemoryRegistrationGateway` | Resuelve éxito tras espera; nunca expone la contraseña |
| Unit (reducer) | `registerReducer` | Transiciones valores/errores/`submitting`; sin doble envío |
| Integración (componentes) | `RegisterForm`: US1 (registro válido → redirección + éxito), US2 (cada mensaje inline + foco + limpieza), US3 (navegación a login), US4 (aviso "Próximamente" conserva datos y devuelve foco) | RTL + `user-event`; pruebas nombradas por ID (`US1-1`, `FR-009`…) como en login |
| Accesibilidad | Sin violaciones axe en registro; operación solo-teclado; errores y éxito anunciados | Helper `src/test/a11y.ts`; cobertura ≥ 80 % |

Trazabilidad: cada prueba referencia su escenario o FR (convención 9.2 del login).

## Constitution Check

| Principio / Regla | Cumplimiento en el diseño | Estado |
|---|---|---|
| I. TDD | Historias P1→P3 con RED primero (dominio → caso de uso → reducer → componentes) | ✅ |
| II. SOLID | `RegistrationGateway` inyectado (DIP); componentes de campo por props; un reducer por feature | ✅ |
| III. Clean Architecture | `domain/` sin React; `application/` solo depende de `domain/`; regla ESLint vigente | ✅ |
| IV. DRY/KISS/YAGNI | Reutiliza 7 componentes + `BrandPanel` + helpers; sin router, sin librerías de formularios | ✅ |
| V. Seguridad | FR-014: contraseñas jamás en mensajes, logs, URL ni storage; sin secretos versionados | ✅ |
| VI. BRD/ARD | No existen (supuesto del spec) | ✅ N/A |
| 8.1 Pruebas | Unitarias + integración; cobertura ≥ 80 %; IDs US/FR | ✅ |
| 8.4 Accesibilidad AA | Contrato `aria-describedby`, foco visible, `Alert` con `role` adecuado; reutiliza tokens accesibles del login | ✅ (verifica contraste del botón `#FF6B3D` en verificación) |
| 8.6 Sistema de diseño | Panel de marca y botón con tokens de Figma; textos y jerarquía 1:1 del frame 04 | ✅ |

**Resultado del gate**: APROBADO sin desviaciones nuevas (hereda tokens accesibles del login).

## Complexity Tracking

| Punto | Decisión | Alternativa rechazada porque |
|---|---|---|
| Sin `react-router`; vista en estado de `App` | 2 vistas de demo; evita dependencia y configuración | Router añade superficie sin valor demostrable (YAGNI) |
| Aviso social en página en vez de `window.alert` | Accesible, conserva datos/foco, testeable con RTL | `alert` nativo bloquea, no es anunciable de forma controlada ni testeable |

## Risks & Assumptions

**Riesgos**:

- Fidelidad visual al frame 04 (gradiente `#FF8A65` → `#EF5226`, tarjeta mock, botón
  `#FF6B3D`): mitigado con spot check contra Figma en T5 y reutilización de `BrandPanel`.
- Contraste AA del botón/placeholder de Figma: verificar con axe + revisión manual; si falla,
  aplicar tokens accesibles derivados como en login (desviación documentada).
- Doble envío y botón atrás tras éxito: `submitting` deshabilita; volver atrás no reenvía
  (sin persistencia ni re-ejecución en montaje).
- Colisión de alcance: complejidad de contraseña, verificación de correo y persistencia
  quedan explícitamente fuera (spec Fuera de alcance).

**Supuestos** (heredan del spec):

- Solo cliente, sin backend ni base de datos; `/login` con mensaje es el final del flujo.
- Interfaz en español; diseño desktop 2 paneles, móvil solo formulario con logo.
- Enlace de términos como aviso en página hasta definición legal del destino.
- Sin BRD/ARD; si aparecen, el plan se alinea (Constitución VI).

## Next step

T3 `tasks.md` SDD (historias P1→P3 con IDs US/FR trazables a este plan), luego implementación.
