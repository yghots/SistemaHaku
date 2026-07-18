/**
 * Backfill de `Pedido.codigoPedido` al formato de negocio `PED-AAAA-NNNNNN`
 * (Fase 24). Ejecutado una única vez, contra los datos de prueba existentes
 * en ese momento (proyecto sin producción — ver DEVELOPMENT_PROGRESS.md,
 * Fase 22 "Exponer totalPedido/totalPagado..." / Fase 24 de codigoPedido).
 *
 * Se conserva en el repositorio (Fase 30, corrección B7 de la auditoría)
 * únicamente para que el proceso sea reproducible en otro ambiente si
 * hiciera falta — NO se ha vuelto a ejecutar desde entonces y NO debe
 * ejecutarse contra una base de datos con códigos ya migrados (es
 * idempotente: si `codigoPedido` ya coincide con el formato esperado, la
 * fila se omite, pero igual recorre toda la tabla).
 *
 * Uso (desde `Backend/`):
 *   npx ts-node -r tsconfig-paths/register scripts/backfill/backfill-codigo-pedido.ts
 *
 * Requiere `DATABASE_URL` disponible (via `.env`, cargado por `dotenv/config`).
 */
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { PedidoCodigoGenerator } from '../../src/modules/pedidos/pedido-codigo.generator';

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
  });

  const pedidos = await prisma.pedido.findMany({
    select: { id: true, creadoEn: true, codigoPedido: true },
  });

  for (const pedido of pedidos) {
    const nuevoCodigo = PedidoCodigoGenerator.generar(
      pedido.id,
      pedido.creadoEn,
    );
    if (nuevoCodigo === pedido.codigoPedido) continue;
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { codigoPedido: nuevoCodigo },
    });
    console.log(`id=${pedido.id} "${pedido.codigoPedido}" -> "${nuevoCodigo}"`);
  }

  await prisma.$disconnect();
}

void main();
