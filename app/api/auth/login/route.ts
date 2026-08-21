import { NextResponse } from 'next/server';
import { signToken, validateCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    const isValid = validateCredentials(email, password);
    if (!isValid) {
      return NextResponse.json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' }, { status: 401 });
    }

    const payload = {
      email,
      name: 'Dr. Alex Rocha',
      role: 'admin' as const,
    };

    const token = signToken(payload);

    const response = NextResponse.json({
      success: true,
      user: payload,
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao processar login: ' + error.message }, { status: 500 });
  }
}
