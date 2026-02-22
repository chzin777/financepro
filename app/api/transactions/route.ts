import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { transactionsTable, balanceTable } from '@/app/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/transactions
export async function GET() {
  try {
    const transactions = await db
      .select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.createdAt));

    return NextResponse.json({
      transactions: transactions.map(t => ({
        ...t,
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST /api/transactions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, description, amount, type, category, date } = body;

    if (!id || !description || !amount || !type || !category || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.insert(transactionsTable).values({
      id,
      description,
      amount,
      type,
      category,
      date: new Date(date),
      createdAt: new Date(),
    });

    // Update balance
    const balanceRows = await db.select().from(balanceTable).limit(1);
    const currentBalance = balanceRows[0]?.amount ?? 0;
    const balanceChange = type === 'income' ? amount : -amount;
    const newBalance = currentBalance + balanceChange;

    if (balanceRows.length === 0) {
      await db.insert(balanceTable).values({ id: 1, amount: newBalance });
    } else {
      await db.update(balanceTable).set({ amount: newBalance, updatedAt: new Date() }).where(eq(balanceTable.id, 1));
    }

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

// DELETE /api/transactions
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
    }

    // Get transaction to reverse balance
    const txRows = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
    if (txRows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const tx = txRows[0];
    const balanceChange = tx.type === 'income' ? -tx.amount : tx.amount;

    // Delete transaction
    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));

    // Update balance
    const balanceRows = await db.select().from(balanceTable).limit(1);
    const currentBalance = balanceRows[0]?.amount ?? 0;
    const newBalance = currentBalance + balanceChange;

    await db.update(balanceTable).set({ amount: newBalance, updatedAt: new Date() }).where(eq(balanceTable.id, 1));

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
