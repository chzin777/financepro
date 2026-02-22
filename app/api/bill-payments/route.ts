import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { billPaymentsTable, balanceTable, billsTable } from '@/app/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/bill-payments?month=0&year=2026
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth()));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const payments = await db
      .select()
      .from(billPaymentsTable)
      .where(
        and(
          eq(billPaymentsTable.month, month),
          eq(billPaymentsTable.year, year)
        )
      );

    return NextResponse.json({
      payments: payments.map(p => ({
        id: p.id,
        billId: p.billId,
        month: p.month,
        year: p.year,
        paidAt: p.paidAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching bill payments:', error);
    return NextResponse.json({ error: 'Failed to fetch bill payments' }, { status: 500 });
  }
}

// POST /api/bill-payments - Mark bill as paid (subtracts from balance)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { billId, month, year } = body;

    if (!billId || month === undefined || year === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the bill to know the amount
    const [bill] = await db.select().from(billsTable).where(eq(billsTable.id, billId));
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Check if already paid
    const existing = await db
      .select()
      .from(billPaymentsTable)
      .where(
        and(
          eq(billPaymentsTable.billId, billId),
          eq(billPaymentsTable.month, month),
          eq(billPaymentsTable.year, year)
        )
      );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Bill already paid this month' }, { status: 409 });
    }

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

    // Insert payment record
    await db.insert(billPaymentsTable).values({
      id,
      billId,
      month,
      year,
      paidAt: new Date(),
    });

    // Subtract from balance
    const [currentBalance] = await db.select().from(balanceTable);
    const newBalance = (currentBalance?.amount || 0) - bill.amount;

    if (currentBalance) {
      await db
        .update(balanceTable)
        .set({ amount: newBalance, updatedAt: new Date() })
        .where(eq(balanceTable.id, 1));
    } else {
      await db.insert(balanceTable).values({ id: 1, amount: newBalance, updatedAt: new Date() });
    }

    return NextResponse.json({
      payment: { id, billId, month, year, paidAt: new Date().toISOString() },
      balance: newBalance,
    });
  } catch (error) {
    console.error('Error marking bill as paid:', error);
    return NextResponse.json({ error: 'Failed to mark bill as paid' }, { status: 500 });
  }
}

// DELETE /api/bill-payments?billId=xxx&month=0&year=2026 - Unmark as paid (refunds balance)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const billId = searchParams.get('billId');
    const month = parseInt(searchParams.get('month') || '-1');
    const year = parseInt(searchParams.get('year') || '-1');

    if (!billId || month < 0 || year < 0) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
    }

    // Get the bill to know the amount to refund
    const [bill] = await db.select().from(billsTable).where(eq(billsTable.id, billId));
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Delete payment record
    await db
      .delete(billPaymentsTable)
      .where(
        and(
          eq(billPaymentsTable.billId, billId),
          eq(billPaymentsTable.month, month),
          eq(billPaymentsTable.year, year)
        )
      );

    // Refund balance
    const [currentBalance] = await db.select().from(balanceTable);
    const newBalance = (currentBalance?.amount || 0) + bill.amount;

    if (currentBalance) {
      await db
        .update(balanceTable)
        .set({ amount: newBalance, updatedAt: new Date() })
        .where(eq(balanceTable.id, 1));
    } else {
      await db.insert(balanceTable).values({ id: 1, amount: newBalance, updatedAt: new Date() });
    }

    return NextResponse.json({ balance: newBalance });
  } catch (error) {
    console.error('Error unmarking bill payment:', error);
    return NextResponse.json({ error: 'Failed to unmark bill payment' }, { status: 500 });
  }
}
