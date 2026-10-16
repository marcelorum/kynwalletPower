# Feature Specification: Pantalla de Registro de KynWallet

**Feature Branch**: `002-registro-usuarios`

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "Necesito construir la pantalla web de registro para la
billetera virtual KynWallet, con el objetivo de permitir que nuevos usuarios creen una cuenta
de forma sencilla. El diseño de referencia se encuentra en Figma:
https://www.figma.com/design/f7uDsv8sh6ZOtK2OitTqtg/Billetera-Virtual---Prototipos?node-id=31-2.
La pantalla debe permitir ingresar nombre completo, correo electrónico, contraseña y confirmación
de contraseña, aceptar términos y condiciones, validar todos los campos antes de enviar y
simular el registro. Si el registro es exitoso, debe redirigir a `/login` con un mensaje de
éxito; de lo contrario, debe mostrar errores inline por campo. Los botones de Google y Apple
muestran el aviso 'Próximamente'. El alcance se limita a una demostración funcional del
registro, sin servicios backend ni base de datos. Genera historias de usuario y criterios de
aceptación, respetando la Constitución del proyecto."

**Diseño de referencia**: Figma, frame `04 · Registro` (nodo `31:2`). Compuesto por un panel
de marca a la izquierda (gradiente naranja `#FF8A65` → `#EF5226`, logo KynWallet, titular
"Comienza tu camino financiero.", tarjeta mock ilustrativa) y un panel de formulario a la
derecha (título de registro, campos Nombre completo, Correo electrónico, Contraseña y
Confirmar contraseña, checkbox de términos y condiciones, botón "Crear cuenta" `#FF6B3D`,
divisor "o regístrate con", botones Google y Apple, y pie "¿Ya tienes cuenta? Inicia sesión").

## Clarifications

### Session 2026-10-16

- Q: ¿Dónde se muestra el mensaje de éxito tras el registro? → A: En la pantalla `/login`,
  como mensaje visible tras la redirección (el formulario de registro no se reemplaza por una
  vista propia de éxito).
- Q: ¿Qué hacen los botones Google/Apple? → A: Muestran el aviso "Próximamente" y no inician
  ningún flujo de registro externo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear una cuenta con datos válidos (Priority: P1)

Como nuevo usuario de la billetera virtual, quiero completar el formulario de registro con
datos válidos y aceptar los términos, para crear mi cuenta y continuar al inicio de sesión.

**Why this priority**: es el propósito central de la pantalla; sin este flujo no existe valor
demostrable.

**Independent Test**: se completan los cuatro campos con valores válidos, se aceptan los
términos, se presiona "Crear cuenta" y se verifica la redirección a `/login` con el mensaje
de éxito.

**Acceptance Scenarios**:

1. **Given** la pantalla de registro cargada, **When** el usuario ingresa un nombre completo,
   un correo válido, una contraseña de al menos 8 caracteres y su confirmación coincidente,
   acepta los términos y presiona "Crear cuenta", **Then** el sistema redirige a `/login` y
   muestra un mensaje de éxito visible (por ejemplo, "Cuenta creada. Inicia sesión").
2. **Given** el usuario envió el formulario con datos válidos, **When** el registro simulado
   está en curso, **Then** el botón "Crear cuenta" muestra un estado de carga, queda
   deshabilitado y no admite envíos adicionales.
3. **Given** el usuario está en el campo de confirmación, **When** presiona la tecla Enter,
   **Then** el formulario se envía igual que al presionar "Crear cuenta".
4. **Given** el usuario escribe el correo con mayúsculas o espacios al inicio o final,
   **When** envía un registro por lo demás válido, **Then** el sistema lo acepta igualmente
   (el correo se valida y registra sin distinguir mayúsculas y sin espacios periféricos).

---

### User Story 2 - Recibir validación inline antes de enviar (Priority: P1)

Como usuario, quiero que el formulario me indique qué datos faltan o tienen formato
incorrecto antes de crear la cuenta, para corregir errores rápidamente.

**Why this priority**: el requerimiento exige validación total antes del envío; sin ella el
botón "Crear cuenta" no puede garantizar datos correctos.

**Independent Test**: se envía el formulario vacío, luego con correo mal formado, contraseña
corta, confirmación distinta y términos sin aceptar, y se verifican los mensajes asociados a
cada campo.

**Acceptance Scenarios**:

1. **Given** todos los campos vacíos y términos sin aceptar, **When** el usuario presiona
   "Crear cuenta", **Then** se muestran mensajes junto a cada campo obligatorio, no se ejecuta
   el registro y el foco se mueve al primer campo con error.
2. **Given** un correo sin formato válido (por ejemplo, "usuario@" o "usuario.com"),
   **When** el usuario sale del campo o envía el formulario, **Then** se muestra "Ingresa un
   correo electrónico válido".
3. **Given** una contraseña con menos de 8 caracteres, **When** el usuario envía el
   formulario, **Then** se muestra "La contraseña debe tener al menos 8 caracteres" y no se
   ejecuta el registro.
4. **Given** una confirmación distinta de la contraseña, **When** el usuario sale del campo o
   envía el formulario, **Then** se muestra "Las contraseñas no coinciden" y no se ejecuta el
   registro.
5. **Given** los términos sin aceptar, **When** el usuario presiona "Crear cuenta",
   **Then** se muestra "Debes aceptar los términos y condiciones" y no se ejecuta el
   registro.
6. **Given** un campo con mensaje de validación, **When** el usuario corrige el valor (o
   acepta los términos), **Then** el mensaje de ese campo desaparece.
7. **Given** un campo con error, **When** el campo es leído por un lector de pantalla,
   **Then** se anuncia el mensaje de error asociado a ese campo.

---

### User Story 3 - Navegar al inicio de sesión existente (Priority: P2)

Como usuario que ya tiene cuenta, quiero un acceso visible al inicio de sesión desde la
pantalla de registro, para no crear una cuenta duplicada.

**Why this priority**: evita fricción y cuentas duplicadas, pero no bloquea el flujo
principal de registro.

**Independent Test**: se activa el enlace "¿Ya tienes cuenta? Inicia sesión" y se verifica
la navegación a `/login` conservando el estado esperado.

**Acceptance Scenarios**:

1. **Given** la pantalla de registro, **When** el usuario activa el enlace "¿Ya tienes
   cuenta? Inicia sesión", **Then** el sistema navega a `/login` sin mostrar errores ni
   ejecutar el registro.
2. **Given** el enlace de inicio de sesión, **When** el usuario lo opera solo con teclado,
   **Then** puede alcanzarlo, activarlo con Enter y el foco queda en un punto lógico de
   `/login`.

---

### User Story 4 - Elementos sociales fuera del alcance (Priority: P3)

Como usuario de la demostración, quiero que los botones visibles del diseño que no forman
parte del alcance (Google, Apple) me informen que no están disponibles, para no quedar con
la impresión de un error.

**Why this priority**: garantiza fidelidad al diseño de referencia sin ampliar el alcance
funcional (YAGNI).

**Independent Test**: se activa cada botón social y se verifica el aviso informativo.

**Acceptance Scenarios**:

1. **Given** la pantalla de registro, **When** el usuario activa el botón Google o Apple,
   **Then** se muestra el aviso "Próximamente" y la pantalla conserva los datos ingresados.
2. **Given** el aviso "Próximamente", **When** el usuario lo cierra, **Then** el foco vuelve
   al botón que lo originó y ningún campo pierde su valor.

---

### Edge Cases

- El usuario presiona "Crear cuenta" varias veces seguidas: solo se procesa un intento.
- El correo contiene espacios al inicio o al final: se ignoran al validar y registrar.
- La contraseña contiene espacios: se respetan tal cual, sin recortarlos.
- El nombre contiene espacios extra o múltiples apellidos: se acepta tras recortar espacios
  periféricos y colapsar espacios internos, sin rechazar caracteres propios de nombres
  (tildes, eñes, guiones).
- Correo o contraseñas exceden longitudes razonables (correo > 254 caracteres, contraseña >
  128): se rechaza con mensaje de validación y no se ejecuta el registro.
- El usuario pega texto en los campos: se acepta y se valida igual que el texto escrito.
- Tras el registro exitoso, el usuario vuelve atrás en el navegador: no se reenvía el
  registro ni se duplica la cuenta.
- Ventana estrecha (dispositivo móvil): el formulario permanece completamente utilizable sin
  desplazamiento horizontal; solo se muestra el formulario.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla DEBE reproducir la estructura, textos y jerarquía visual del diseño
  de referencia de Figma (`04 · Registro`), aplicando el sistema de diseño corporativo cuando
  exista: panel de marca con gradiente `#FF8A65` → `#EF5226`, titular "Comienza tu camino
  financiero." y tarjeta mock; formulario con los campos, botón "Crear cuenta" `#FF6B3D`,
  divisor "o regístrate con", botones Google/Apple y pie de login.
- **FR-002**: La pantalla DEBE permitir ingresar nombre completo, correo electrónico,
  contraseña y confirmación de contraseña.
- **FR-003**: La pantalla DEBE mostrar un checkbox de términos y condiciones que el usuario
  pueda marcar o desmarcar solo con teclado y cuyo estado sea anunciado por tecnologías de
  asistencia.
- **FR-004**: El sistema DEBE validar que el nombre sea obligatorio, tenga al menos 2
  caracteres visibles y no exceda 100 caracteres.
- **FR-005**: El sistema DEBE validar que el correo sea obligatorio, tenga formato de correo
  válido y no exceda 254 caracteres; la comparación DEBE ignorar mayúsculas y espacios
  periféricos.
- **FR-006**: El sistema DEBE validar que la contraseña sea obligatoria y tenga entre 8 y 128
  caracteres.
- **FR-007**: El sistema DEBE validar que la confirmación sea obligatoria y coincida
  exactamente con la contraseña.
- **FR-008**: El sistema DEBE exigir la aceptación de los términos antes de registrar; sin
  ella NO DEBE ejecutar el registro.
- **FR-009**: El sistema DEBE mostrar los mensajes de validación junto al campo
  correspondiente (o junto al checkbox en el caso de términos), al salir del campo y al
  intentar enviar, y DEBE ocultarlos cuando el valor se corrija.
- **FR-010**: El sistema NO DEBE ejecutar el registro mientras existan errores de validación.
- **FR-011**: El sistema DEBE simular el registro del lado del cliente, sin servicios backend
  ni base de datos.
- **FR-012**: El registro simulado DEBE incluir una espera breve (aprox. 1 segundo) con
  indicador de carga en el botón "Crear cuenta", durante la cual el envío queda
  deshabilitado.
- **FR-013**: Ante un registro válido, el sistema DEBE redirigir a `/login` y mostrar un
  mensaje de éxito visible y anunciado por tecnologías de asistencia.
- **FR-014**: El sistema NO DEBE registrar ni mostrar las contraseñas en mensajes, registros
  de diagnóstico, URL ni almacenamiento del navegador.
- **FR-015**: Los botones Google y Apple DEBEN mostrarse según el diseño y, al activarse,
  informar "Próximamente" sin iniciar ningún flujo externo y conservando los datos
  ingresados.
- **FR-016**: El enlace "¿Ya tienes cuenta? Inicia sesión" DEBE navegar a `/login` sin
  ejecutar el registro.
- **FR-017**: El formulario DEBE poder enviarse con la tecla Enter y operarse completamente
  con teclado, con orden de foco lógico y foco visible.
- **FR-018**: La pantalla DEBE cumplir WCAG 2.1 nivel AA: etiquetas asociadas a cada campo,
  errores anunciados por tecnologías de asistencia, mensajes de resultado anunciados de forma
  automática y contraste suficiente.
- **FR-019**: La pantalla DEBE adaptarse a anchos desde 320 px hasta escritorio sin
  desplazamiento horizontal; en escritorio muestra 2 paneles (marca + formulario) y en móvil
  solo el formulario, manteniendo el logo visible.
- **FR-020**: Los errores inesperados DEBEN mostrarse con un mensaje comprensible para el
  usuario, sin revelar detalles técnicos.

### Key Entities

- **Cuenta en registro**: datos ingresados en el formulario (nombre completo, correo
  electrónico, contraseña y confirmación) más la aceptación de términos. No se persiste.
- **Intento de registro**: datos ingresados y su resultado: error de validación o registro
  exitoso con redirección a `/login`. No se persiste.

### Fuera de alcance (explícito)

- Backend, base de datos, persistencia de cuentas o sesión persistente.
- Verificación de correo, recuperación de contraseña y bloqueo por intentos fallidos.
- Registro real con Google/Apple (solo muestran "Próximamente").
- Reglas de complejidad de contraseña más allá de la longitud (8 a 128 caracteres).
- Pantallas adicionales de la aplicación más allá de la redirección a `/login`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario nuevo completa el registro con datos válidos en menos de 60 segundos
  desde que la pantalla se muestra.
- **SC-002**: El resultado de un intento válido (redirección a `/login` con mensaje de éxito)
  se produce en un máximo de 2 segundos tras presionar "Crear cuenta".
- **SC-003**: El 100 % de los escenarios de aceptación de las historias P1 y P2 se verifican
  mediante pruebas automatizadas que pasan.
- **SC-004**: El 90 % de los participantes de una prueba de usabilidad completa el registro
  en el primer intento sin asistencia.
- **SC-005**: La pantalla no presenta incumplimientos WCAG 2.1 AA en una auditoría
  automatizada de accesibilidad y es operable solo con teclado.
- **SC-006**: La revisión visual frente al diseño de Figma no detecta diferencias en textos,
  orden de elementos ni jerarquía visual.
- **SC-007**: El análisis de secretos no detecta contraseñas en el código fuente versionado.

## Assumptions

- La demostración es exclusivamente del lado del cliente: no hay backend, base de datos ni
  pantallas adicionales de la aplicación; la redirección a `/login` con mensaje de éxito es
  el final del flujo.
- El mensaje de éxito se muestra en `/login`; el detalle exacto del texto queda abierto a la
  revisión del spec (propuesta: "Cuenta creada. Inicia sesión").
- El aviso de Google/Apple es exactamente el texto "Próximamente", según el checklist del
  taller.
- La política de contraseña (8 a 128 caracteres) aplica solo a la validación de longitud; la
  demo no implementa reglas de complejidad adicionales.
- El idioma de la interfaz es español.
- No existen BRD ni ARD para esta funcionalidad; si se incorporan, esta especificación DEBE
  alinearse con ellos (Constitución, Principio VI).
- El diseño de referencia corresponde a escritorio con 2 paneles; la adaptación a móvil (solo
  formulario) se deriva del mismo diseño.

## Supuestos abiertos

- [ ] Texto exacto del mensaje de éxito en `/login` (propuesta: "Cuenta creada. Inicia
  sesión").
- [ ] Comportamiento exacto del "alert" social: `window.alert` nativo frente a aviso
  accesible en página (el spec asume aviso anunciado que conserva foco y datos).
- [ ] Destino y texto del enlace de términos y condiciones (el frame no lo detalla).
