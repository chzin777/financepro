import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { balanceTable } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/balance
export async function GET() {
  try {
    const rows = await db.select().from(balanceTable).limit(1);
    const balance = rows[0]?.amount ?? 0;
    return NextResponse.json({ balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}

// PUT /api/balance
export async function PUT(request: Request) {
  try {
    const { balance } = await request.json();
    if (typeof balance !== 'number') {
      return NextResponse.json({ error: 'Invalid balance value' }, { status: 400 });
    }

    const existing = await db.select().from(balanceTable).limit(1);

    if (existing.length === 0) {
      await db.insert(balanceTable).values({ id: 1, amount: balance });
    } else {
      await db.update(balanceTable).set({ amount: balance, updatedAt: new Date() }).where(eq(balanceTable.id, 1));
    }

    return NextResponse.json({ balance });
  } catch (error) {
    console.error('Error updating balance:', error);
    return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
  }
}
