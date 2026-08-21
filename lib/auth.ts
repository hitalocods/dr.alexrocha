import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dralex_rocha_jwt_token_key_2026';
const ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@dralexrocha.com.br';
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

export interface AdminPayload {
  email: string;
  name: string;
  role: 'admin';
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
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function validateCredentials(email: string, pass: string): boolean {
  return (
    email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim() &&
    pass === ADMIN_PASSWORD
  );
}
