import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const status = searchParams.get('status') || undefined;

    const appointments = await db.getAppointments({ from, to, status });
    return NextResponse.json(appointments, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.client_name || !body.client_phone || !body.date || !body.time) {
      return NextResponse.json({ error: 'Nome, WhatsApp, data e horário são obrigatórios' }, { status: 400 });
    }

    // Obter preço padrão do serviço se não for informado
    let price = Number(body.price_charged) || 0;
    if (!price && body.service_id) {
      const services = await db.getServices();
      const s = services.find((srv) => srv.id === body.service_id);
      if (s) price = s.price;
    }

    try {
      const created = await db.createAppointment({
        client_name: body.client_name,
        client_phone: body.client_phone,
        notes: body.notes || '',
        service_id: body.service_id || '',
        date: body.date,
        time: body.time,
        status: body.status || 'pending',
        price_charged: price,
        is_paid: body.is_paid || false,
        payment_method: body.payment_method || 'unspecified',
      });

      return NextResponse.json(created, { status: 201 });
    } catch (conflictErr: any) {
      return NextResponse.json({ error: conflictErr.message }, { status: 409 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
