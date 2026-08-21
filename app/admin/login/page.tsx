'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@dralexrocha.com.br');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas');
      }

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1f23] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Cartão de Login */}
        <div className="bg-[#132e35] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Brilho decorativo */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#e8a33d]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#e8a33d] text-[#0d1f23] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#e8a33d]/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="font-space font-bold text-2xl text-white">
              Dr. Alex Rocha<span className="text-[#e8a33d]">.</span>
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#afb3b7] mt-1 font-mono">
              Acesso Administrativo
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#0d1f23] border border-white/10 rounded-2xl p-3 px-4 focus-within:border-[#e8a33d] transition">
              <label className="block text-[10px] uppercase font-mono font-bold text-[#afb3b7] tracking-wider mb-1">
                E-mail
              </label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#afb3b7]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dralexrocha.com.br"
                  className="w-full bg-transparent text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="bg-[#0d1f23] border border-white/10 rounded-2xl p-3 px-4 focus-within:border-[#e8a33d] transition">
              <label className="block text-[10px] uppercase font-mono font-bold text-[#afb3b7] tracking-wider mb-1">
                Senha
              </label>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#afb3b7]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#e8a33d] hover:bg-[#d4902b] text-[#0d1f23] font-bold text-sm transition-all shadow-lg shadow-[#e8a33d]/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Dica de Acesso Padrão */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-[11px] text-[#afb3b7]">
              Credenciais de acesso inicial padrão configuradas no sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
