# Torre de Control · Polyuprotec S.A.

Sistema de monitoreo operativo de las órdenes de producción (O.P): Comercial registra la O.P, cada área reporta su avance en su cronograma, la **Maestra** consolida y la **App web** lo muestra con semáforo, Gantt, entregas, Tareas de la O.P. e historial.

**Versión vigente: v3.2** · Responsable: Jeider Buelvas — Desarrollo Full Stack

## Estructura

| Carpeta | Contenido | Dónde corre |
| --- | --- | --- |
| `apps-script/comercial/` | Macro Comercial (v14.10) y botones PNG | Apps Script del archivo Comercial |
| `apps-script/maestra/` | Maestra (v4.7): API de la App, semáforo, protección, historial, Tareas de la O.P. | Apps Script de la Maestra (Web App) |
| `apps-script/produccion-v2/` | Producción V2 (v4.5): registro diario de kg fabricados y entregados en negro | Apps Script de los dos archivos de Producción (Barranquilla y Bogotá), mismo código |
| `apps-script/produccion/` | Script original de creación de O.P (v1.x, histórico) | — |
| `web/torre_de_control_v2/` | App web (`app.html`) y PHP de correo y Tareas de la O.P. (`bitacora.php`) | Hosting |
| `web/torre_de_control_v2/manual_torre_control/` | Manual v3.2 en HTML y PDF, protegido con la sesión | Hosting |
| `docs/` | Manual en Markdown | — |

## Secretos (no están en este repositorio)

| Secreto | Dónde se configura |
| --- | --- |
| `TOKEN` y `SMTP_PASS` | `web/torre_de_control_v2/config.php` en el servidor (copiar de `config.ejemplo.php`) |
| `TOKEN_CORREO` | Macro Comercial → Apps Script → ⚙️ Configuración del proyecto → Propiedades del script |
| `TOKEN_CORREO_CAMBIOS` | Maestra → Apps Script → ⚙️ Configuración del proyecto → Propiedades del script |

Los tres tokens tienen **el mismo valor**. Las versiones antiguas del historial tienen los secretos reemplazados por `CONFIGURAR_AQUI`.

## Publicar un cambio

1. Partir del original funcional y aplicar solo las modificaciones; comparar original vs. final.
2. Apps Script: pegar el archivo y guardar. En la Maestra: **Implementar → Administrar implementaciones → Editar → Nueva versión** (no crear una implementación nueva: cambia la URL).
3. Hosting: subir los archivos de `web/` (nunca sobrescribir `config.php`).
4. Hacer commit con la versión en el mensaje y, si es una versión del sistema, crear la etiqueta (`git tag -a v3.2 -m "..."`).

El detalle de uso, indicadores, administración y procedimientos está en el manual (`docs/manual.md`).
