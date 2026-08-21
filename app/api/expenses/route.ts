import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    const expenses = await db.getExpenses({ from, to });
    return NextResponse.json(expenses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.description || body.amount === undefined || !body.due_date) {
      return NextResponse.json({ error: 'Descrição, valor e data de vencimento são obrigatórios' }, { status: 400 });
    }

    const created = await db.createExpense({
      description: body.description,
      category: body.category || 'Outros',
      amount: Number(body.amount) || 0,
      is_recurring_monthly: Boolean(body.is_recurring_monthly),
      due_date: body.due_date,
      status: body.status || 'pending',
      payment_date: body.payment_date || null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
