import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { billsTable } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/bills
export async function GET() {
  try {
    const bills = await db.select().from(billsTable);

    return NextResponse.json({
      bills: bills.map(b => ({
        ...b,
        startDate: b.startDate.toISOString(),
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

// POST /api/bills
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, amount, category, type, dueDay, totalInstallments, currentInstallment, startDate, active } = body;

    if (!id || !name || !amount || !category || !type || !dueDay || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.insert(billsTable).values({
      id,
      name,
      amount,
      category,
      type,
      dueDay,
      totalInstallments: totalInstallments ?? null,
      currentInstallment: currentInstallment ?? null,
      startDate: new Date(startDate),
      active: active ?? true,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}

// PATCH /api/bills - Edit a bill
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, amount, category, type, dueDay, totalInstallments, currentInstallment } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing bill id' }, { status: 400 });
    }

    await db.update(billsTable).set({
      name,
      amount,
      category,
      type,
      dueDay,
      totalInstallments: totalInstallments ?? null,
      currentInstallment: currentInstallment ?? null,
    }).where(eq(billsTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}

// DELETE /api/bills
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing bill id' }, { status: 400 });
    }

    await db.delete(billsTable).where(eq(billsTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}
