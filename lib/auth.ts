import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dralex_rocha_jwt_token_key_2026';
const ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@dralexrocha.com.br';
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
const CONTINGENCY_PASSWORD = process.env.CONTINGENCY_ADMIN_PASSWORD || 'alex@contingencia2026';

export interface AdminPayload {
  email: string;
  name: string;
  role: 'admin';
  is_contingency?: boolean;
}

export interface AuthResult {
  valid: boolean;
  contingency?: boolean;
  user?: AdminPayload;
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (error) {
    console.error('Erro ao ler sessão:', error);
    return null;
  }
}

export function validateCredentials(email: string, pass: string): AuthResult {
  const cleanEmail = (email || '').toLowerCase().trim();
  const cleanAdminEmail = (ADMIN_EMAIL || '').toLowerCase().trim();

  // 1. Verificação Primária
  if (cleanEmail === cleanAdminEmail && pass === ADMIN_PASSWORD) {
    return {
      valid: true,
      contingency: false,
      user: {
        email: ADMIN_EMAIL,
        name: 'Dr. Alex Rocha',
        role: 'admin',
      },
    };
  }

  // 2. Modo de Contingência (garante login se a nuvem ou env oscilar)
  if (
    (cleanEmail === cleanAdminEmail || cleanEmail === 'contingencia@dralexrocha.com.br') &&
    (pass === CONTINGENCY_PASSWORD || (process.env.NODE_ENV !== 'production' && pass === 'admin123'))
  ) {
    return {
      valid: true,
      contingency: true,
      user: {
        email: cleanEmail,
        name: 'Dr. Alex Rocha (Contingência)',
        role: 'admin',
        is_contingency: true,
      },
    };
  }

  return { valid: false };
}
