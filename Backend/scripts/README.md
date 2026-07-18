# Scripts auxiliares

Scripts puntuales usados durante fases anteriores del proyecto (backfills de datos, generación de assets) — cada uno se ejecutó **una única vez** contra los datos existentes en su momento y luego se descartó del repositorio. La Fase 30 (corrección B7 de la auditoría integral) los incorpora aquí, versionados y documentados, para que el proceso sea reproducible en otro ambiente si hiciera falta repetirlo. **Ninguno se ha vuelto a ejecutar** desde que se creó esta carpeta — no forman parte del build (`nest build`) ni de ningún flujo automático.

No contienen lógica de negocio nueva: reutilizan clases ya existentes de `src/` (ej. `PedidoCodigoGenerator`) exactamente como se usan en producción, nunca reimplementan una regla por su cuenta.

## `backfill/`

Scripts que actualizan datos ya existentes para adoptar un nuevo formato/regla, después de un cambio de código.

- **`backfill-codigo-pedido.ts`** — recalcula `Pedido.codigoPedido` al formato `PED-AAAA-NNNNNN` (Fase 24) para pedidos creados antes de ese cambio. Idempotente (omite las filas que ya tienen el formato correcto).

## `templates/`

Scripts que generan archivos estáticos usados por la aplicación (nunca en tiempo de request).

- **`build-plantillas-importacion.ts`** — genera las 3 plantillas oficiales `.xlsx` del Centro de Importaciones (Clientes, Tiendas, Motorizados) con el estándar visual y de contenido unificado de la Fase 26 (hoja "Plantilla" vacía + hoja "Instrucciones", mismo estilo). Sobrescribe `src/modules/importaciones/plantillas/*.xlsx`.

## Cómo ejecutar (si hiciera falta reproducir alguno)

Desde `Backend/`, con las dependencias instaladas y `.env` configurado:

```bash
npx ts-node -r tsconfig-paths/register scripts/backfill/backfill-codigo-pedido.ts
npx ts-node scripts/templates/build-plantillas-importacion.ts
```

Revisar siempre el resultado antes de confiar en él (ej. abrir el `.xlsx` generado, o comparar los `codigoPedido` actualizados) — ninguno de estos scripts se ejecuta como parte de `npm run build`/`npm test`/CI.
