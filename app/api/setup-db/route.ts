import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getSession();
    // Permite inicialização no primeiro acesso ou autenticado
    const result = await initializeDatabase();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
