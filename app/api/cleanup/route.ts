import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { transactionsTable, billsTable } from '@/app/lib/db/schema';
import { lt, and, eq } from 'drizzle-orm';
import { subMonths } from 'date-fns';

/**
 * Rota de limpeza automática.
 * - Deleta transações com mais de 3 meses.
 * - Desativa contas temporárias expiradas.
 *
 * Protegida por CRON_SECRET para que só a Vercel Cron chame.
 */
export async function GET(request: Request) {
  try {
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const threeMonthsAgo = subMonths(new Date(), 3);

    // 1. Deletar transações com mais de 3 meses
    const deletedTransactions = await db
      .delete(transactionsTable)
      .where(lt(transactionsTable.date, threeMonthsAgo));

    // 2. Desativar contas temporárias que já expiraram
    const allTempBills = await db
      .select()
      .from(billsTable)
      .where(and(eq(billsTable.type, 'temporary'), eq(billsTable.active, true)));

    let deactivatedCount = 0;
    const now = new Date();

    for (const bill of allTempBills) {
      if (bill.totalInstallments && bill.currentInstallment) {
        const startDate = new Date(bill.startDate);
        const monthsPassed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        const currentInstallment = bill.currentInstallment + monthsPassed;

        if (currentInstallment > bill.totalInstallments) {
          await db
            .update(billsTable)
            .set({ active: false })
            .where(eq(billsTable.id, bill.id));
          deactivatedCount++;
        }
      }
    }

    // 3. Deletar contas inativas com mais de 3 meses
    const deletedBills = await db
      .delete(billsTable)
      .where(and(eq(billsTable.active, false), lt(billsTable.createdAt, threeMonthsAgo)));

    return NextResponse.json({
      success: true,
      cleanup: {
        transactionsDeleted: true,
        billsDeactivated: deactivatedCount,
        inactiveBillsDeleted: true,
        cutoffDate: threeMonthsAgo.toISOString(),
      },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
