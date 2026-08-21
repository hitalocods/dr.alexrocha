import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = body.event; // PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE, etc.

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const payment = body.payment;
      
      // Calcular próximo mês
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 10);
      const nextDueStr = nextMonth.toISOString().slice(0, 10);

      // Atualizar licença como ativa e prorrogar vencimento
      await db.updateLicense({
        status: 'active',
        next_due_date: nextDueStr,
        last_paid_at: new Date().toISOString(),
        asaas_payment_id: payment?.id || null,
      });
    } else if (event === 'PAYMENT_OVERDUE') {
      await db.updateLicense({
        status: 'overdue',
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro no webhook de assinatura Asaas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
