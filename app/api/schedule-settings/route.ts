import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const hours = await db.getBusinessHours();
    const blockedDates = await db.getBlockedDates();
    return NextResponse.json({
      businessHours: hours,
      blockedDates: blockedDates.map(b => b.date),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { day_of_week, is_working, slots } = await request.json();
    if (day_of_week === undefined) {
      return NextResponse.json({ error: 'day_of_week é obrigatório' }, { status: 400 });
    }

    const updated = await db.updateBusinessDay(Number(day_of_week), Boolean(is_working), Array.isArray(slots) ? slots : []);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
