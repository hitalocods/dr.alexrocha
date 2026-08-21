import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const services = await db.getServices();
    return NextResponse.json(services, {
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ error: 'Nome do serviço é obrigatório' }, { status: 400 });
    }

    const id = data.id || `svc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const created = await db.createService({
      id,
      name: data.name,
      description: data.description || '',
      duration: data.duration || '45 min',
      price: Number(data.price) || 0,
      category: data.category || 'Serviços',
      is_active: data.is_active !== undefined ? data.is_active : true,
      order_num: Number(data.order_num) || 0,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
