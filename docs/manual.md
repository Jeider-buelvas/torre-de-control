# Torre de Control v3.1 — Antecedentes, funcionamiento y manual de uso

Nov 5, 2026 · @Jeider

## Presentación

Este documento reúne los antecedentes, el funcionamiento y el manual de uso de la Torre de Control v3.1 de Polyuprotec S.A., como insumo para elaborar los procedimientos internos y el manual de instrucciones. La entrega solicitada vence el Nov 30, 2026.

| Dato | Valor |
| --- | --- |
| Sistema | Torre de Control · Sistema de Monitoreo Operativo |
| Versión del sistema | v3.1 (05/11/2026) |
| Componentes | Maestra v4.4 · Macro Comercial v14.5 · Producción V2 v4.3 · App web 04/11/2026 |
| Responsable técnico | Jeider Buelvas, Desarrollador Full Stack |
| Destinatarios | Responsables de procesos, calidad y documentación interna |
| Acceso a la App | https://torredecontrol.polypro.space/torre\_de\_control\_v2/ (cuentas @polyuprotec.com) |

**Cómo usar este documento**

- Secciones 1 a 4: contexto, arquitectura, roles y ciclo de vida de una OP. Base para el alcance y las definiciones de los procedimientos.
- Secciones 5 a 7: manual de usuario por actor (Comercial, áreas, Producción, App).
- Secciones 8 y 9: reglas de cálculo, protección de datos y notificaciones. Base para los criterios de control.
- Secciones 10 y 11: administración técnica y solución de problemas.
- Sección 12: procedimientos propuestos, listos para adaptar al formato del sistema de gestión.

Las contraseñas, tokens y claves técnicas no se incluyen en este documento. Los custodia el responsable técnico.

## 1. Antecedentes del proyecto

La Torre de Control nace para ver en un solo lugar el estado real de cada Orden de Producción (OP), desde que Comercial la registra hasta que se entrega al cliente. Antes, cada área llevaba su cronograma por separado y no había una vista consolidada ni trazabilidad de los cambios.

### 1.1 Problema que resuelve

- Cada área (Diseño, Dibujo, Compras, Producción, Galvanizado, Pintura, Logística, Montaje, Administración) registraba su avance en archivos propios, sin una vista única por OP.
- No había forma confiable de saber si una OP iba a tiempo frente a la fecha comprometida con el cliente.
- Las fechas podían modificarse sin dejar registro de quién, cuándo ni por qué.
- Algunos indicadores mostraban cumplimiento falso: 100% o "al día" sin avance registrado.

### 1.2 Objetivos

1. Consolidar el avance de todas las áreas por OP, subestructura y tarea.
2. Medir el cumplimiento de cada proceso contra su plan y el cumplimiento de entrega al cliente.
3. Mostrar riesgos, retrasos y falta de planeación, sin ocultarlos.
4. Proteger las fechas reales y la fecha comprometida, con trazabilidad de cada cambio.
5. Avisar automáticamente por correo los eventos importantes.

### 1.3 Alcance

- **Incluye:** registro y edición de OP (Comercial), cronogramas por área, registro diario de Producción, consolidación en la Maestra, App web de consulta, bitácora por OP, historial de cambios y notificaciones.
- **No incluye (por ahora):** integración de la base de Compras y migración de los registros de Producción de octubre; quedaron fuera por decisión del 03/11/2026.
- **Excluido expresamente:** botones de "liberación rápida" para que Comercial libere Dibujo u otras áreas. La propuesta se descartó en la reunión.

### 1.4 Cronología de versiones

| Fecha | Versión | Cambio principal |
| --- | --- | --- |
| 05/11/2026 | v3.1 | Buscar O.P, mejoras de velocidad en edición, texto "Se registró una nueva O.P" en el correo |
| 04/11/2026 | v3.1 | Bitácora de la OP con correo semanal |
| 03/11/2026 | v3.0 | Acuerdos de la reunión: protección de fechas, historial, semáforo por plan, avance y entrega, "Sin planeación", cumplimiento de entrega al cliente, tareas "No aplica" |
| 30/10/2026 | v2.x | Gantt: validación de fechas, avisos ⚠, formato dd/mm/aaaa, paginador, botón de observaciones |
| Finales de octubre de 2026 | v2.x | Fecha de entrega en todas las áreas, edición de OP con registro, Producción V2 con registro diario, vista Producción diaria, correo de nueva OP |
| Octubre de 2026 | v1.x | Torre original: plantillas por área, Maestra consolidada, App web y macro de Comercial |

### 1.5 Acuerdos de la reunión del 03/11/2026 incorporados

- Toda tarea nueva inicia en estado "Abierto"; no se asume avance sin registro.
- La fecha fin real de una tarea terminada y la fecha de entrega comercial son línea base: no se modifican sin autorización y todo intento queda registrado.
- Historial de cambios de solo consulta, con usuario, fecha, valor anterior y nuevo.
- Notificación automática de cambios críticos.
- Una OP sin fechas planeadas se muestra como "⚠ Sin planeación", no como "al día".
- El cumplimiento solo se calcula con evidencia real (tareas terminadas o kg registrados).
- Secuencia de áreas parametrizable: Diseño → Dibujo → Compras → Producción → Galvanizado → Pintura → Logística → Montaje → Administración.
- Vista general con OP activas, avance consolidado, en riesgo, retrasadas y sin planeación.
- Indicador organizacional de cumplimiento de entrega al cliente (solicitud posterior a la reunión).

## 2. Arquitectura y componentes

La Torre funciona con archivos de Google Sheets que tienen macros (Apps Script) y una App web alojada en el hosting de la empresa. La información nace en Comercial, se registra en los cronogramas de cada área, se consolida en la Maestra y se consulta en la App.

### 2.1 Inventario de componentes

| Componente | Dónde vive | Versión | Qué hace |
| --- | --- | --- | --- |
| PLANTILLA\_LOOKER\_COMERCIAL | Google Sheets + Apps Script | v14.5 | Registra y edita OP, las envía a las áreas, marca tareas "No aplica", registra entregas reales y reprogramaciones, busca OP |
| Cronogramas de área (9 archivos) | Google Sheets, hoja "Cronograma" | Plantilla por área | Cada área registra estado, fechas reales, kg avanzados y observaciones de sus tareas |
| PLANTILLA\_LOOKER\_PRODUCCION\_V2 | Google Sheets + Apps Script | v4.3 | Cronograma de Producción más hojas mensuales de kg diarios por OP y subestructura; sincroniza el avance al cronograma |
| TORRE\_CONTROL\_MAESTRA\_POLYUPROTEC | Google Sheets + Apps Script + Web App | v4.4 | Importa todas las áreas, consolida en LOOKER\_MAESTRA, calcula indicadores, vigila cambios, guarda historial y bitácora, entrega los datos a la App |
| App web | Hosting torredecontrol.polypro.space | 04/11/2026 | Tablero de consulta con inicio de sesión Google (@polyuprotec.com), bitácora y análisis con IA |
| Correos automáticos | Hosting (archivos PHP) | 03–05/11/2026 | Nueva OP, cambios críticos cada 15 min y bitácora semanal, desde notificacion@torredecontrol.polypro.space |

### 2.2 Hojas principales de la Maestra

| Hoja | Contenido | Quién la escribe |
| --- | --- | --- |
| DISEÑO, DIBUJO, COMPRAS, … | Copia del cronograma de cada área (IMPORTRANGE A5:AK) | Fórmula de importación |
| LOOKER\_MAESTRA | Todas las áreas en una sola tabla de 40 columnas | Menú 🔄 Actualizar LOOKER\_MAESTRA |
| CURVA\_S | Avance planeado vs real acumulado | Menú 📈 Generar Curva S |
| PRODUCCION\_DIARIA | Kg reales y planeados por día, OP y subestructura | Menú 🏭 Actualizar Producción diaria |
| HISTORIAL\_CAMBIOS | Registro de cambios e intentos bloqueados (solo consulta) | Script de vigilancia |
| LINEA\_BASE | Fechas protegidas por tarea (oculta) | Script de vigilancia |
| BITACORA\_OP | Notas, compromisos y bloqueos de cada OP | Script, desde la App |

### 2.3 Hojas de control en Comercial

| Hoja | Contenido |
| --- | --- |
| BASE\_CREADOR | Formulario para registrar o editar una OP |
| Una hoja por OP (4127, 4115, …) | Plan de la OP por área, subestructura y tarea; metadatos en AB1:AM1 |
| REGISTRO\_CAMBIOS | Cada creación, edición y envío de OP |
| ENTREGAS\_CLIENTE | Fecha original, vigente, reprogramaciones y entrega real por OP |
| REPROGRAMACIONES\_ENTREGA | Cada cambio de fecha de entrega con su motivo |

Las hojas de control pueden ocultarse; no deben renombrarse, borrarse ni editarse a mano.

## 3. Roles y responsabilidades

Comercial es el único rol que crea, edita y cierra la línea base comercial de una OP; cada área es dueña solo de su avance real.

| Rol | Responsabilidades en la Torre | No le corresponde |
| --- | --- | --- |
| Comercial | Registrar la OP con fecha de entrega, completar plan, kg y subestructuras en la hoja de la OP, enviarla a las áreas, reprogramar con motivo, marcar tareas "No aplica", registrar la entrega real | Registrar avance de las áreas |
| Jefe o responsable de área | Registrar estado, inicio y duración reales, kg avanzados y observaciones de sus tareas; cerrar los compromisos de la bitácora que le asignen | Cambiar la fecha de entrega, marcar "No aplica", modificar fechas de tareas ya terminadas |
| Producción | Registrar los kg diarios en las hojas mensuales de Producción V2 y sincronizarlos al cronograma | Editar a mano el estado "Entrega en negro" cuando lo calcula la sincronización |
| Gerencia y coordinación | Revisar la vista ejecutiva, el semáforo, el cumplimiento de entrega y las alertas; dar seguimiento a la bitácora | — |
| Usuario autorizado de fechas | Corregir una fecha protegida cuando hay una razón justificada; el cambio queda registrado | Corregir sin dejar el motivo |
| Administrador técnico | Instalar y publicar versiones, mantener IDs, permisos, tokens y activadores, revisar el historial y los correos | Registrar datos operativos |
| Cualquier usuario con sesión en la App | Consultar todas las vistas y anotar en la bitácora de cualquier OP | Modificar datos de cronogramas desde la App |

Las listas de usuarios autorizados están en el código: AUTORIZADOS\_FECHAS en la Maestra y AUTORIZADOS\_ENTREGA en Comercial. Hoy están vacías; la empresa debe definir quiénes van.

## 4. Ciclo de vida de una OP

Una OP recorre nueve pasos: se registra en Comercial, se planea, se envía a las áreas, cada área registra su avance, la Torre la vigila y Comercial registra la entrega real al cliente.

1. **Registro (Comercial).** En BASE\_CREADOR se diligencian número de OP, proyecto, cliente, comercial, sede, número de subestructuras, fecha de entrega al cliente y áreas. El botón "Crear Nueva OP" crea la hoja de la OP. Esa fecha queda como **fecha comprometida original** y sale el correo "Se registró una nueva O.P".
2. **Planeación (Comercial).** En la hoja de la OP se completan el nombre y los kg de cada subestructura, y la fecha de inicio y la duración planeadas de cada tarea. Si una tarea no se hace en ese contrato, se marca "No aplica" en 🧩 Tareas de la OP.
3. **Envío a áreas (Comercial).** "📤 Enviar / Actualizar OP en Áreas" crea o actualiza la OP en el cronograma de cada área, sin borrar lo que el área ya registró.
4. **Ejecución (áreas).** Cada área cambia el estado de sus tareas (Abierto, En pausa, Reproceso, Terminado) y registra inicio y duración reales, kg avanzados y observaciones. Producción registra kg diarios en Producción V2.
5. **Consolidación (Maestra).** La Maestra importa todos los cronogramas, arma LOOKER\_MAESTRA y calcula avance, semáforo y cumplimiento. La App lee esos datos.
6. **Vigilancia (automática).** Cada edición de fechas, estados o kg queda en el Historial. Si alguien intenta cambiar una fecha protegida, el cambio se revierte y se notifica.
7. **Seguimiento (todos).** En la App se revisan semáforo, Gantt, alertas y bitácora. Los compromisos y bloqueos se anotan en la bitácora de la OP.
8. **Reprogramación (Comercial, si aplica).** Si el cliente o la empresa mueven la entrega, Comercial edita la OP; la macro pide un motivo obligatorio y guarda la reprogramación. La fecha original no cambia.
9. **Entrega y cierre (Comercial).** "🚚 Registrar entrega real al cliente" guarda la fecha real; desde ese momento la fecha comprometida ya no se puede reprogramar. La entrega cuenta para el indicador de cumplimiento del mes.

## 5. Manual de usuario — Comercial

Todo el trabajo de Comercial se hace en PLANTILLA\_LOOKER\_COMERCIAL, con el formulario BASE\_CREADOR, los botones de la hoja y los menús "🚀 Torre de Control" y "🔎 Buscar O.P".

### 5.1 Menús disponibles

| Menú | Opción | Para qué sirve |
| --- | --- | --- |
| 🚀 Torre de Control | ➕ Crear Nueva OP / 💾 Guardar cambios | Crea la OP; en modo edición guarda los cambios |
| 🚀 Torre de Control | ✏️ Cargar OP para editar | Lleva una OP existente al formulario |
| 🚀 Torre de Control | ✖️ Cancelar edición | Sale del modo edición sin guardar |
| 🚀 Torre de Control | 📤 Enviar / Actualizar OP en Áreas | Crea o actualiza la OP en los cronogramas de las áreas |
| 🚀 Torre de Control | 🧩 Tareas de la OP | Marca tareas "No aplica" o les pone un nombre propio en esa OP |
| 🚀 Torre de Control | 🚚 Registrar entrega real al cliente | Guarda la fecha en que se entregó la OP |
| 🚀 Torre de Control | 🔄 Extraer Datos al Gantt | Llena la hoja "Cronograma Comercial" con las tareas de la OP de B4 |
| 🚀 Torre de Control | 📋 Ver registro de cambios | Abre REGISTRO\_CAMBIOS |
| 🚀 Torre de Control | 📨 Reenviar correo de una O.P | Vuelve a enviar el aviso de nueva OP |
| 🚀 Torre de Control | Opciones de una sola vez | Agregar campo Fecha de entrega, Autorizar acceso a áreas, Probar correo, Ordenar lista de áreas, Preparar registro de entregas |
| 🔎 Buscar O.P | 🔎 Buscar O.P… | Abre el buscador de OP |
| 🔎 Buscar O.P | 🏠 Ir a BASE\_CREADOR | Vuelve al formulario |

### 5.2 Registrar una OP nueva

1. Ir a BASE\_CREADOR y llenar los campos obligatorios: número de OP (C3), nombre del proyecto, cliente, comercial responsable, sede, subestructuras y fecha de entrega al cliente.
2. Marcar las áreas que participan.
3. Pulsar **Crear Nueva OP** y confirmar el resumen.
4. En la hoja nueva de la OP, completar nombre y kg de cada subestructura (columnas E y F) y la fecha de inicio y la duración planeadas de cada tarea (columnas I y J).
5. Si alguna tarea no aplica al contrato, usar 🧩 Tareas de la OP (5.6).
6. Pulsar **📤 Enviar / Actualizar OP en Áreas** y confirmar.

Si el número ya existe, la macro ofrece cargarla para editarla en lugar de duplicarla.

### 5.3 Editar una OP

1. Usar ✏️ Cargar OP para editar, o el botón ✏️ Editar dentro de 🔎 Buscar O.P.
2. Corregir lo necesario en el formulario. El número de OP no se puede cambiar.
3. Pulsar el botón principal (en modo edición dice Guardar cambios) y revisar el resumen de cambios.
4. Si cambió la fecha de entrega, escribir el **motivo obligatorio** (5.5).
5. Aceptar la actualización en las áreas, o hacerla después con 📤 Enviar / Actualizar.

Las fechas, los kg y las observaciones que ya tenía la hoja se conservan, incluso si se agregan o quitan áreas o subestructuras. Si se quitan subestructuras con avance, la macro avisa antes de borrarlas.

### 5.4 Buscar una OP

1. Abrir 🔎 Buscar O.P o pulsar el botón de la hoja.
2. Escribir parte del número, proyecto, cliente, comercial o sede. No importan tildes ni mayúsculas.
3. Hacer clic en la OP (o moverse con ↑ ↓ y pulsar Enter). Aparece la barra "Abriendo O.P…" hasta que Google abre la hoja.
4. ✏️ Editar carga la OP en el formulario; ↻ actualiza la lista.

### 5.5 Reprogramar la fecha de entrega

1. Cargar la OP para editar y cambiar la fecha de entrega.
2. Al guardar, elegir el motivo: 1 Solicitud del cliente, 2 Causa interna, 3 Materiales o proveedores, 4 Cambio de alcance, 5 Otro.
3. Escribir el comentario; con "Otro" es obligatorio.

La reprogramación queda en REPROGRAMACIONES\_ENTREGA y en REGISTRO\_CAMBIOS. La fecha original no cambia y sigue siendo la referencia del indicador oficial. Si la OP ya tiene entrega real, no se puede reprogramar.

### 5.6 Tareas que no aplican y nombre de tarea por OP

1. Abrir la hoja de la OP y usar 🧩 Tareas de la OP.
2. Marcar ☐ No aplica en las tareas que no se hacen en ese contrato. Su peso se reparte entre las demás tareas de la subestructura.
3. Si hace falta, escribir un "Nombre en esta OP". Solo cambia lo que ve el área; por dentro se conserva el nombre original.
4. Guardar y pulsar 📤 Enviar a las áreas.

Cada subestructura debe tener al menos una tarea que aplique. "Entrega en negro" de Producción no se puede renombrar, porque Producción V2 la usa para sincronizar los kg. No se deben borrar filas de tareas a mano.

### 5.7 Registrar la entrega real

1. Usar 🚚 Registrar entrega real al cliente (desde la hoja de la OP, o escribiendo el número).
2. Escribir la fecha real (dd/mm/aaaa); no puede ser futura.
3. Escribir una observación, por ejemplo número de remisión o quién recibió.
4. La macro muestra si la entrega fue a tiempo frente a la fecha original y la vigente.

La entrega real queda fija. Solo un usuario de AUTORIZADOS\_ENTREGA puede corregirla, con motivo obligatorio.

## 6. Manual de usuario — Áreas y Producción V2

Cada área registra su avance en la hoja "Cronograma" de su archivo; solo diligencia cinco columnas, y el resto lo llenan Comercial o las fórmulas.

### 6.1 Columnas que diligencia el área

| Columna | Campo | Cómo se llena |
| --- | --- | --- |
| P | ESTADO | Abierto, En pausa, Reproceso o Terminado |
| S | KG\_AVANCE\_ACUMULADO | Kg acumulados de la tarea (áreas que miden por kg) |
| U | FECHA\_INICIO\_TAREA\_REAL | Fecha en que empezó la tarea. Las tareas nuevas la traen vacía; las siguientes se encadenan solas cuando la anterior tiene fin real |
| V | DURACION\_DIAS\_TAREAS\_REAL | Días hábiles que duró o va a durar la tarea |
| AC | OBSERVACIONES | Notas de la tarea; se ven en la App con 👁 Ver observaciones |

La fecha fin real (W) se calcula sola con días hábiles y festivos de Colombia. Las columnas de plan (desde AE), la fecha de entrega (AD), los nombres de tarea y las de datos generales vienen de Comercial y no se modifican en el área.

### 6.2 Estados de una tarea

| Estado | Cuándo usarlo | Efecto |
| --- | --- | --- |
| Abierto | Estado inicial; tarea sin terminar | No suma avance por sí solo |
| En pausa | Tarea detenida | En áreas de pesos fijos suma un aporte parcial |
| Reproceso | Tarea que se está rehaciendo | Cuenta como evidencia de actividad |
| Terminado | Tarea completa | Suma su peso completo; su fecha fin real queda protegida |
| No aplica | La tarea no se hace en el contrato | Solo lo marca Comercial; no cuenta y su peso se reparte |

### 6.3 Reglas de protección en los cronogramas

- En una tarea **Terminado** con fecha real válida no se puede cambiar el inicio real, la duración real ni el fin real, ni sacarla de Terminado.
- La **fecha de entrega al cliente** no se cambia desde el área.
- **"No aplica"** no se pone ni se quita desde el área.
- Si alguien lo intenta, el cambio se deshace al instante, queda como "Intento bloqueado" en el Historial y se incluye en el siguiente correo de cambios.
- Todo cambio de estado, fechas o kg queda en el Historial con usuario, fecha y valores.

Si una fecha protegida está mal (por ejemplo, un año mal digitado), la corrige un usuario autorizado (6.5, procedimiento PR-06).

### 6.4 Producción V2

Producción registra los kg de cada día en las hojas mensuales (por ejemplo "NOVIEMBRE 2026") de PLANTILLA\_LOOKER\_PRODUCCION\_V2. Cada subestructura aparece como un bloque "OP 4127\_1 · Nombre" con una fila de kg reales y una de kg planeados por día.

| Opción del menú | Para qué sirve |
| --- | --- |
| 📤 Enviar / Crear O.P (botón "Crear O.P - Producción") | Programa una OP o subestructura en la hoja del mes desde el formulario |
| 🔄 Sincronizar diario → Cronograma | Lleva los kg diarios al cronograma de Producción |
| ⏱ Activar sincronización automática | La misma sincronización cada hora |
| 🔁 Actualizar lista de OP del formulario | Refresca la lista desplegable de OP |
| 🧹 Borrar de los meses las OP que no vienen de Comercial | Limpia pruebas u OP no registradas |

Reglas de la sincronización:

- Solo **sube** valores: nunca baja los kg, nunca saca una tarea de Terminado y no borra datos digitados.
- La tarea "Entrega en negro" toma los kg de la subestructura y pasa a Terminado cuando los kg reales alcanzan el peso de la subestructura.
- Toma la fecha de inicio más temprana entre la digitada y la del primer reporte diario.
- No toca una tarea Terminado con fecha real válida ni una tarea "No aplica".

### 6.5 Corrección de una fecha protegida

La hace un correo incluido en AUTORIZADOS\_FECHAS, editando la celda en el cronograma del área. El cambio se conserva y queda en el Historial como "Cambio autorizado".

## 7. Manual de usuario — App web Torre de Control

La App es de consulta: muestra en un solo lugar lo que registran Comercial, las áreas y Producción. Los datos no se editan aquí, salvo la bitácora.

### 7.1 Ingreso

1. Abra la dirección de la Torre de Control en el navegador.
2. Inicie sesión con su cuenta Google @polyuprotec.com. No se aceptan cuentas de otro dominio.
3. La App carga los datos de la Maestra. Use el botón de actualizar para traer los últimos cambios.

### 7.2 Banda de resumen

En la parte superior aparecen 6 indicadores generales. Al hacer clic se abre el detalle de las OP que los componen. "Cumplimiento entrega" lleva a la vista Entregas.

### 7.3 Vistas

| Vista | Qué muestra | Uso típico |
| --- | --- | --- |
| Tarjetas de OP | Una tarjeta por OP con semáforo, avance, áreas en orden de proceso y botón 📝 de bitácora | Revisión diaria |
| Obeya | Tablero por área y estado | Reunión de seguimiento |
| Por Área | Avance y tareas agrupadas por área | Jefes de área |
| Gantt | Plan vs. real por OP con 4 fechas (dd/mm/aaaa), paginador 10/20/50/Todos y avisos ⚠ | Revisión de cronograma |
| Detalle | Tabla de tareas con columna 👁 Ver observaciones | Consultar notas de las áreas |
| Alertas | OP vencidas, sin planeación, entregas inconsistentes y bitácora pendiente | Priorizar |
| Entregas | Indicador de cumplimiento de entrega, gráfica y reprogramaciones | Gerencia y Comercial |
| Historial | Cambios y bloqueos registrados, con filtros | Auditoría |

### 7.4 Semáforo y avisos

- Pase el puntero sobre el semáforo para ver **por qué** tiene ese color (regla, brecha, fechas).
- **Sin planeación** (naranja) significa que la OP no tiene fechas de plan.
- El ⚠ del Gantt indica una fecha a más de 2 años del plan o un fin real anterior al inicio; pase el puntero para ver el detalle.

### 7.5 Filtros

Las vistas permiten filtrar por OP, cliente, área y semáforo. El orden de las áreas siempre sigue el proceso: Diseño → Dibujo → Compras → Producción → Galvanizado → Pintura → Logística → Montaje → Administración → RRHH.

### 7.6 Bitácora de la OP

La bitácora guarda notas, compromisos y bloqueos por OP. Cada registro lleva autor, fecha y hora.

1. En la tarjeta de la OP pulse **📝 Bitácora**.
2. Elija el tipo (nota, compromiso o bloqueo), el área y escriba la descripción.
3. Para compromisos y bloqueos indique responsable y fecha compromiso.
4. Pulse **Guardar**.
5. Para cerrar un compromiso o bloqueo, pulse **Cerrar** y escriba una nota de cierre.

Los compromisos vencidos y bloqueos abiertos aparecen en Alertas y en el correo semanal de los lunes.

### 7.7 Entregas

Muestra por OP la fecha original, la vigente y la real, los días de diferencia y si cumplió. El indicador oficial se mide contra la fecha **original** con tolerancia de 0 días. El botón de reprogramaciones muestra cada cambio con su motivo.

### 7.8 Historial

Lista los cambios de estado, fechas y kg, los cambios autorizados y los intentos bloqueados. Filtre por OP, área, tipo, usuario o fecha.

## 8. Indicadores y reglas de cálculo

Todos los indicadores se calculan en la Maestra a partir de los cronogramas. La App solo los muestra, así que la misma regla aplica en todas las vistas.

### 8.1 Avance de la OP

- Cada tarea tiene un peso (columna Q, aporte). El avance del área es la suma de los aportes de sus tareas según su estado o kg.
- Las tareas **No aplica** aportan 0 y su peso se reparte proporcionalmente entre las demás tareas del área, así que el área puede llegar al 100 %.
- El avance real de la OP para el semáforo es el % de tareas Terminado.

### 8.2 Semáforo (regla v4.2)

**Brecha** = avance esperado − avance real. El avance esperado es el % de tareas cuyo fin planeado ya pasó.

| Color | Se asigna cuando |
| --- | --- |
| 🔴 Rojo | La entrega está vencida y la OP no está terminada; o el cronograma termina después de la entrega; o el plan venció hace más de 7 días; o la brecha es de 25 puntos o más |
| 🟡 Amarillo | La brecha es de 10 puntos o más; o el plan venció hace 1 a 7 días; o la entrega es en 15 días o menos y el avance es menor al 80 % |
| 🟢 Al día | No se cumple ninguna de las anteriores |
| 🟠 Sin planeación | La OP no tiene fechas planeadas |

Las reglas se evalúan en ese orden; la primera que se cumple define el color y se muestra como motivo.

### 8.3 Cumplimiento y eficiencia

- **Cumplimiento %** solo se calcula si hay evidencia de avance: al menos una tarea Terminado o Reproceso, o kg mayores a 0. Sin evidencia la OP aparece como "sin avance" y no como 0 % ni 100 %.
- **Cumpl. %** por tarea solo se muestra en tareas Terminado.
- **Eficiencia** compara duración real contra planeada en tareas Terminado; sin tareas terminadas queda vacía.
- La **fecha fin real** de la OP sale solo de tareas Terminado.

### 8.4 Cumplimiento de entrega al cliente

| Fecha | Significado |
| --- | --- |
| Original | Primera fecha de entrega registrada. No se sobrescribe |
| Vigente | Fecha actual tras reprogramaciones; cada cambio exige motivo |
| Real | Fecha en que se entregó; la registra Comercial |

Una OP **cumple** si la fecha real es igual o anterior a la original (tolerancia 0 días). El indicador es el % de OP entregadas que cumplen, y se muestra también el cumplimiento contra la fecha vigente como referencia.

### 8.5 Fechas inválidas

- Una fecha anterior al año 2000 se trata como vacía.
- En el Gantt se ignora un fin real anterior al inicio real, y se marca ⚠ una fecha a más de 2 años (730 días) del plan.

## 9. Control de datos, protección, trazabilidad y notificaciones

El sistema protege las fechas que sustentan los indicadores y deja rastro de cada cambio, para que los datos de la Torre de Control sean auditables.

### 9.1 Qué se protege

| Dato | Regla | Quién puede cambiarlo |
| --- | --- | --- |
| Fecha fin real e inicio/duración real de una tarea Terminado | No se modifica ni se saca de Terminado | Usuarios en AUTORIZADOS\_FECHAS |
| Fecha de entrega comercial (línea base) | Se guarda en LINEA\_BASE; un cambio en el área se revierte | Solo Comercial, con motivo |
| Estado No aplica | No se pone ni se quita en el área | Solo Comercial (botón Tareas O.P) |
| Fecha original de entrega | Nunca se sobrescribe | Nadie |
| Entrega real registrada | Bloquea nuevas reprogramaciones | Usuarios en AUTORIZADOS\_ENTREGA |

### 9.2 Hojas de trazabilidad

| Hoja | Archivo | Contenido |
| --- | --- | --- |
| HISTORIAL | Maestra | Cambios, cambios autorizados e intentos bloqueados: fecha, usuario, OP, área, tarea, campo, valor anterior y nuevo |
| LINEA\_BASE | Maestra | Copia de las fechas protegidas para poder revertir |
| BITACORA\_OP | Maestra | Notas, compromisos y bloqueos con su cierre |
| ENTREGAS\_CLIENTE | Comercial | Una fila por OP con fecha original, vigente y real |
| REPROGRAMACIONES\_ENTREGA | Comercial | Cada reprogramación con motivo, usuario y fecha |

Estas hojas pueden ocultarse sin afectar el funcionamiento, pero no deben renombrarse, borrarse ni editarse a mano.

### 9.3 Notificaciones por correo

| Correo | Cuándo | Destino |
| --- | --- | --- |
| Nueva O.P | Al registrar una OP en Comercial ("¡Se registró una nueva O.P!") | todos@polyuprotec.com |
| Resumen de cambios | Cada 15 minutos, solo si hubo cambios o bloqueos | todos@polyuprotec.com |
| Bitácora semanal | Lunes a las 7:00: compromisos vencidos, próximos y bloqueos | todos@polyuprotec.com |

Los correos salen de la cuenta de notificaciones del servidor de la Torre de Control. Las credenciales están solo en el servidor y no se incluyen en este documento.

### 9.4 Seguridad de acceso

- La App y la bitácora exigen sesión Google del dominio polyuprotec.com.
- El autor de cada registro de bitácora se toma de la sesión, no de lo que escriba el usuario.
- La comunicación entre el servidor y Apps Script usa un token privado que solo conoce el administrador.

## 10. Administración, instalación, despliegue y mantenimiento

Esta sección es para el administrador del sistema (Desarrollo Full Stack). Cubre las versiones vigentes, cómo publicar cambios y las tareas de mantenimiento.

### 10.1 Versiones vigentes (Torre de Control v3.1)

| Componente | Archivo | Versión |
| --- | --- | --- |
| Macro Comercial | MACRO\_COMERCIAL | v14.5 |
| Maestra (API, semáforo, protección, bitácora) | MAESTRA\_POLYUPROTEC | v4.4 |
| Producción V2 | PRODUCCION\_V2 | v4.3 |
| App web | app.html + PHP (bitacora.php, notificar\_cambios.php, notificar\_bitacora.php, notificar\_op.php) | 04/11/2026 |

### 10.2 Publicar un cambio en Apps Script

1. Haga una copia de respaldo del código actual.
2. Pegue la nueva versión en el editor de Apps Script y guarde.
3. Si el archivo es la Maestra (Web App): **Implementar → Administrar implementaciones → Editar → Versión: Nueva versión → Implementar**. No cree una implementación nueva, porque cambia la URL y la App deja de recibir datos.
4. Recargue la hoja para que aparezca el menú actualizado.
5. Verifique en la App que los datos y el semáforo cargan.

### 10.3 Activadores

| Activador | Archivo | Cómo se instala |
| --- | --- | --- |
| Protección de cronogramas (onEdit en cada área) | Maestra | Menú → Instalar protección |
| Resumen de cambios (cada 15 min) | Maestra | Se instala con la protección |
| Correo semanal de bitácora (lunes 7:00) | Maestra | Menú → Activar correo de bitácora |
| Sincronización diaria (cada hora) | Producción V2 | Menú → Activar sincronización automática |

Para revisar o eliminar activadores use el panel "Activadores" del proyecto de Apps Script. Instale cada activador una sola vez para evitar correos duplicados.

### 10.4 Servidor web

- Suba app.html y los archivos PHP a la carpeta de la Torre de Control en el hosting.
- Configure en cada PHP la URL de la Web App, el token y los datos SMTP. Estos valores no se documentan aquí; los custodia el administrador.
- Pruebe con las opciones del menú "Probar correo de cambios" y "Probar correo de bitácora".

### 10.5 Parámetros configurables

| Parámetro | Dónde | Valor actual |
| --- | --- | --- |
| AUTORIZADOS\_FECHAS | Maestra | Vacío (debe diligenciarse) |
| AUTORIZADOS\_ENTREGA | Comercial | Vacío (debe diligenciarse) |
| ORDEN\_AREAS | Comercial y App | Diseño → … → RRHH |
| MOTIVOS\_REPROG | Comercial | Lista de motivos de reprogramación |
| TOLERANCIA\_ENTREGA\_DIAS | App | 0 |
| GANTT\_DIAS\_AVISO | App | 730 |
| ID\_COMERCIAL / ID\_MAESTRA | Maestra | IDs de los archivos de Google Sheets |

### 10.6 Mantenimiento periódico

- **Semanal:** revisar en Historial los intentos bloqueados y en Alertas las OP sin planeación o con entregas inconsistentes.
- **Mensual:** crear la hoja del nuevo mes en Producción V2 y revisar que la sincronización corre.
- **Trimestral:** revisar el tamaño de HISTORIAL y BITACORA\_OP y archivar si pasa de varios miles de filas; revisar la lista de autorizados.
- **Ante cada cambio:** aplicar la regla "original funcional + solo modificaciones = final" y comparar original vs. final antes de publicar.

## 11. Solución de problemas frecuentes

La mayoría de las fallas vistas en la operación vienen de datos digitados o de no publicar la nueva versión de la Web App, no del código.

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| Un cambio en el código no se ve en la App (p. ej. no sale el motivo del semáforo) | No se publicó una nueva versión de la Web App | Implementar → Administrar implementaciones → Editar → Nueva versión (10.2) |
| Error "ID ilegal" o la vista Entregas sale vacía | ID\_COMERCIAL mal escrito (por ejemplo l minúscula en vez de I mayúscula) | Copiar el ID desde la URL del archivo, sin digitarlo |
| Una OP no muestra fecha de entrega | La OP no tiene fecha en Comercial ni en las áreas | Registrar la fecha en Comercial |
| Alerta "entregas distintas" | Las áreas tienen fechas de entrega diferentes para la misma OP | Comercial corrige y envía la OP a las áreas |
| ⚠ en el Gantt con año lejano (p. ej. 2029) | Año mal digitado en una fecha | Corregir la fecha (si está protegida, por un autorizado) |
| Duración de miles de días | Fecha de inicio con año 1900 | Ya se trata como vacía (V2 v4.1); digitar la fecha correcta |
| El semáforo está en "Al día" sin avance | Versión antigua de la Maestra | Verificar que está en v4.2 o superior |
| "Sin planeación" | La OP no tiene fechas de plan | Comercial programa el cronograma |
| Filas duplicadas en ENTREGAS\_CLIENTE | Ejecución simultánea en versiones anteriores a v14.1 | Usar v14.1 o superior; la Maestra ya ignora duplicados |
| Mi cambio se deshizo solo | Se intentó modificar un dato protegido | Ver el registro en Historial y pedir la corrección a un autorizado |
| Buscar O.P tarda al abrir una OP | Primera carga de la lista | Esperar la barra "Abriendo O.P…"; no cerrar el cuadro antes de que termine |
| No llegan correos | Activador no instalado o datos SMTP del servidor | Revisar activadores y probar con "Probar correo" |
| La bitácora no guarda | Sesión vencida o cuenta fuera del dominio | Volver a iniciar sesión con la cuenta @polyuprotec.com |
| Un área no llega al 100 % | Tareas que no se hacen siguen activas | Comercial las marca No aplica en Tareas O.P |

### 11.1 Casos de datos pendientes a la fecha

- OP 4093: fecha de Montaje con año 2029.
- OP 4101: fechas de entrega inconsistentes entre áreas.
- OP 4027, 4077 y 4085: sin fecha de entrega.
- OP 4127: Armado y Soldadura deben marcarse No aplica.
- Listas AUTORIZADOS\_FECHAS y AUTORIZADOS\_ENTREGA vacías.

## 12. Insumos para procedimientos internos

Estos son los procedimientos que propone el sistema tal como funciona hoy. Cada uno puede pasarse al formato oficial de calidad de la empresa.

### PR-01 Registro de una nueva OP

- **Responsable:** Comercial. **Frecuencia:** cada contrato nuevo.
- **Pasos:** 1) Crear la OP en la base del creador con datos generales y subestructuras. 2) Registrar la fecha de entrega comprometida (queda como fecha original). 3) Ajustar tareas con Tareas O.P (No aplica, nombres). 4) Enviar la OP a las áreas. 5) Programar en Producción V2.
- **Registros:** hoja de la OP, ENTREGAS\_CLIENTE, correo "Se registró una nueva O.P".

### PR-02 Actualización de avance por área

- **Responsable:** jefe o encargado de cada área. **Frecuencia:** diaria o cada vez que cambie una tarea.
- **Pasos:** 1) Abrir el cronograma del área. 2) Actualizar estado, inicio real, duración y kg. 3) Marcar Terminado solo cuando la tarea esté completa. 4) Escribir observaciones si hay novedades.
- **Registros:** cronograma del área, HISTORIAL.

### PR-03 Reporte diario de producción

- **Responsable:** Producción. **Frecuencia:** diaria.
- **Pasos:** 1) Digitar los kg del día en la hoja del mes. 2) Verificar que la sincronización automática corrió o ejecutarla manualmente.
- **Registros:** PRODUCCION\_V2, cronograma de Producción.

### PR-04 Reprogramación de la fecha de entrega

- **Responsable:** Comercial, con visto bueno de la Gerencia. **Frecuencia:** cuando se requiera.
- **Pasos:** 1) Editar la OP y cambiar la fecha de entrega. 2) Elegir el motivo (obligatorio). 3) Guardar y enviar a las áreas. 4) Informar al cliente.
- **Registros:** REPROGRAMACIONES\_ENTREGA. La fecha original no cambia y el indicador oficial sigue midiendo contra ella.

### PR-05 Registro de la entrega real

- **Responsable:** Comercial. **Frecuencia:** cada entrega al cliente.
- **Pasos:** 1) Usar "Registrar entrega". 2) Digitar la fecha real con soporte (remisión o acta). 3) Verificar en la vista Entregas.
- **Registros:** ENTREGAS\_CLIENTE.

### PR-06 Corrección de fechas protegidas

- **Responsable:** usuario autorizado (AUTORIZADOS\_FECHAS). **Frecuencia:** excepcional.
- **Pasos:** 1) Recibir la solicitud con justificación. 2) Corregir la celda en el cronograma. 3) Verificar en Historial que quedó como "Cambio autorizado".
- **Registros:** HISTORIAL, solicitud escrita.

### PR-07 Gestión de la bitácora

- **Responsable:** cualquier usuario; cierra el responsable del compromiso o bloqueo. **Frecuencia:** continua.
- **Pasos:** 1) Registrar notas, compromisos o bloqueos desde la App. 2) Revisar el correo de los lunes. 3) Cerrar con nota cuando se cumpla.
- **Registros:** BITACORA\_OP.

### PR-08 Seguimiento semanal de la Torre de Control

- **Responsable:** Gerencia de proyectos y jefes de área. **Frecuencia:** semanal.
- **Pasos:** 1) Revisar banda de resumen y OP en rojo o amarillo con su motivo. 2) Revisar Alertas, bitácora y cumplimiento de entregas. 3) Definir compromisos y registrarlos en la bitácora.
- **Registros:** BITACORA\_OP, acta de reunión.

### PR-09 Control de cambios del sistema

- **Responsable:** Desarrollo Full Stack. **Frecuencia:** cada cambio.
- **Pasos:** 1) Recibir la solicitud. 2) Explicar el cambio antes de programarlo. 3) Partir del original funcional y aplicar solo las modificaciones. 4) Probar comparando original vs. final. 5) Publicar (10.2) y actualizar la tabla de versiones.
- **Registros:** archivos de versión, este documento.

## 13. Glosario y anexos

### 13.1 Glosario

| Término | Definición |
| --- | --- |
| OP | Orden de producción; corresponde a un contrato o pedido |
| Subestructura | Parte de una OP con su propio peso en kg (p. ej. OP 4127\_1) |
| Maestra | Archivo que reúne los cronogramas de todas las áreas y sirve los datos a la App |
| Cronograma | Hoja de cada área con las tareas, el plan y el avance real de cada OP |
| Línea base | Fechas comprometidas que se guardan para compararlas y protegerlas |
| Fecha original | Primera fecha de entrega registrada; base del indicador oficial |
| Fecha vigente | Fecha de entrega actual tras reprogramaciones |
| Brecha | Avance esperado menos avance real, en puntos porcentuales |
| Evidencia | Tarea Terminado o Reproceso, o kg mayores a 0 |
| No aplica | Tarea que no se ejecuta en esa OP; su peso se reparte |
| Obeya | Tablero visual de seguimiento por área |
| Bitácora | Registro de notas, compromisos y bloqueos por OP |
| Web App | Servicio de Apps Script que entrega los datos de la Maestra a la App |
| Activador | Tarea automática de Apps Script (por edición o por tiempo) |

### 13.2 Anexos que acompañan este documento

| Anexo | Contenido |
| --- | --- |
| A | Código fuente: MACRO\_COMERCIAL v14.5, MAESTRA\_POLYUPROTEC v4.4, PRODUCCION\_V2 v4.3 |
| B | Paquete de la App web (app.html y archivos PHP) |
| C | Botones PNG de las macros |
| D | Acta de acuerdos de la reunión del 03/11 |
| E | Lista de usuarios autorizados (a diligenciar) |

El código y los paquetes se entregan aparte. No contienen ni deben contener contraseñas en documentos compartidos.

### 13.3 Control del documento

| Versión | Fecha | Descripción | Elaboró |
| --- | --- | --- | --- |
| 1.0 | 05/11/2026 | Versión inicial para procedimientos y manual | Jeider Buelvas — Desarrollo Full Stack |
|  |  |  |  |
