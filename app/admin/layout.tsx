'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  Receipt,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard Financeiro', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Agenda de Pacientes', href: '/admin/agenda', icon: Calendar },
  { label: 'Gestão de Serviços', href: '/admin/servicos', icon: Sparkles },
  { label: 'Setor de Despesas', href: '/admin/despesas', icon: Receipt },
  { label: 'Horários & Trava de Datas', href: '/admin/horarios', icon: Clock },
  { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
  { label: 'Licença Atlas Software', href: '/admin/assinatura', icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  if (isLoginPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#0d1f23] flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-[#0d1f23] text-white flex-col justify-between p-6 shrink-0 shadow-2xl">
        <div>
          {/* Logo & Marca */}
          <div className="pb-6 border-b border-white/10">
            <div className="font-space font-bold text-2xl text-white">
              Dr. Alex Rocha<span className="text-[#e8a33d]">.</span>
            </div>
            <div className="text-[11px] uppercase tracking-widest text-[#afb3b7] mt-1 font-mono font-medium">
              Painel de Gestão
            </div>
          </div>

          {/* Navegação */}
          <nav className="mt-6 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#e8a33d] text-[#0d1f23] shadow-lg shadow-[#e8a33d]/20 font-bold'
                      : 'text-[#afb3b7] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0d1f23]' : 'text-[#e8a33d]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-[#afb3b7] hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#e8a33d]" />
              Ver Página Pública
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Topbar Mobile */}
      <div className="md:hidden bg-[#0d1f23] text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div>
          <div className="font-space font-bold text-lg text-white">
            Dr. Alex Rocha<span className="text-[#e8a33d]">.</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[#afb3b7] font-mono">
            Painel Administrativo
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Drawer Mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm pt-20 p-4">
          <div className="bg-[#0d1f23] rounded-3xl p-6 text-white space-y-2 border border-white/10 shadow-2xl">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold ${
                    isActive ? 'bg-[#e8a33d] text-[#0d1f23] font-bold' : 'text-[#afb3b7] hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-xs text-[#afb3b7]"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#e8a33d]" />
                Ver Página Pública
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
