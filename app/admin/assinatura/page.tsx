'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Server,
  Headphones,
  Lock,
  Calendar,
  Layers,
  Database,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { SoftwareLicense } from '@/lib/db';

export default function AssinaturaPage() {
  const [license, setLicense] = useState<SoftwareLicense | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLicense = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscription').then((r) => r.json());
      if (res && !res.error) {
        setLicense(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicense();
  }, []);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8 animate-fade max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase font-bold text-[#e8a33d] bg-[#0d1f23] px-2.5 py-1 rounded-md">
              Atlas Software
            </span>
            <span className="text-xs text-[#5a636a] font-medium">· Licença &amp; Manutenção</span>
          </div>
          <h1 className="font-space font-bold text-2xl lg:text-3xl text-[#0d1f23] mt-2">
            Licença do Sistema &amp; Suporte
          </h1>
          <p className="text-xs sm:text-sm text-[#5a636a] mt-1">
            Status da hospedagem em nuvem, banco de dados e plano de manutenção semestral.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Licença Ativa &amp; Regular
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#5a636a]">
          <div className="w-8 h-8 border-3 border-[#e8a33d] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Carregando status da licença...
        </div>
      ) : (
        <>
          {/* CARD PRINCIPAL DO PLANO */}
          <div className="bg-[#0d1f23] text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Brilho decorativo de fundo */}
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#e8a33d]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-mono text-[#afb3b7]">
                  <Sparkles className="w-3.5 h-3.5 text-[#e8a33d]" />
                  <span>Plano Clínico Semestral · Dr. Alex Rocha</span>
                </div>

                <h2 className="font-space font-bold text-2xl sm:text-3xl text-white">
                  Manutenção, Cloud &amp; Suporte Contínuo
                </h2>

                <p className="text-xs sm:text-sm text-[#afb3b7] leading-relaxed max-w-xl">
                  Garante o funcionamento ininterrupto 24h por dia do portal de agendamentos, banco de dados PostgreSQL na nuvem, backups automáticos, atualizações de segurança e suporte técnico prioritário da Atlas Software.
                </p>

                {/* Vantagens Inclusas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-[#afb3b7]">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#e8a33d]" />
                    <span>Hospedagem &amp; Cloud Dedicada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-[#e8a33d]" />
                    <span>Suporte Técnico Atlas Software</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#e8a33d]" />
                    <span>Backups &amp; Segurança SSL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#e8a33d]" />
                    <span>Agendamentos Ilimitados</span>
                  </div>
                </div>
              </div>

              {/* Box de Resumo do Plano (6 Meses de R$ 50) */}
              <div className="lg:col-span-5 bg-[#132e35] border border-white/10 rounded-3xl p-6 text-center space-y-4">
                <div className="inline-block bg-[#e8a33d]/20 text-[#e8a33d] border border-[#e8a33d]/30 text-[10px] font-mono uppercase font-bold px-3 py-1 rounded-full tracking-wider">
                  Contrato Semestral (6 Meses)
                </div>

                <div>
                  <div className="font-space font-bold text-4xl text-[#e8a33d]">
                    {formatBRL(license?.monthly_price || 50)}
                    <span className="text-xs text-[#afb3b7] font-normal"> / mês</span>
                  </div>
                  <p className="text-[11px] text-[#afb3b7] mt-1 font-medium">
                    Plano de 6 meses (6x de {formatBRL(license?.monthly_price || 50)})
                  </p>
                </div>

                <div className="bg-[#0d1f23] p-4 rounded-2xl text-xs space-y-2 border border-white/5">
                  <div className="flex justify-between items-center text-[#afb3b7]">
                    <span>Modalidade:</span>
                    <strong className="text-white font-semibold">Semestral (6 Meses)</strong>
                  </div>
                  <div className="flex justify-between items-center text-[#afb3b7]">
                    <span>Status do Contrato:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ativo
                    </span>
                  </div>
                  {license?.next_due_date && (
                    <div className="flex justify-between items-center text-[#afb3b7] pt-1 border-t border-white/5">
                      <span>Próxima Renovação:</span>
                      <strong className="text-[#e8a33d] font-mono">
                        {new Date(license.next_due_date + 'T00:00:00').toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white/5 rounded-2xl text-[11px] text-[#afb3b7] flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#e8a33d] shrink-0" />
                  <span>Ambiente verificado e operando normalmente.</span>
                </div>
              </div>
            </div>
          </div>

          {/* INFORMAÇÕES DE INFRAESTRUTURA & SUPORTE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 1: Status da Infraestrutura */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-line shadow-card space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-line">
                <div className="w-10 h-10 rounded-2xl bg-[#0d1f23] text-[#e8a33d] flex items-center justify-center font-bold">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-space font-bold text-base text-[#0d1f23]">
                    Status dos Serviços em Nuvem
                  </h3>
                  <p className="text-xs text-[#5a636a]">
                    Monitoramento da infraestrutura técnica
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-[#f7f6f2] rounded-2xl border border-line text-xs">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-[#0d1f23]" />
                    <span className="font-medium text-[#0d1f23]">Banco PostgreSQL Neon</span>
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online 100%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#f7f6f2] rounded-2xl border border-line text-xs">
                  <div className="flex items-center gap-2.5">
                    <Server className="w-4 h-4 text-[#0d1f23]" />
                    <span className="font-medium text-[#0d1f23]">Servidor Web &amp; API</span>
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Operacional
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#f7f6f2] rounded-2xl border border-line text-xs">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[#0d1f23]" />
                    <span className="font-medium text-[#0d1f23]">Criptografia SSL &amp; Backups</span>
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                    Ativo
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#f7f6f2] rounded-2xl border border-line text-xs">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#0d1f23]" />
                    <span className="font-medium text-[#0d1f23]">Portal de Agendamentos</span>
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                    Ativo 24h
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: Canal de Atendimento & Suporte Atlas */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-line shadow-card space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-line">
                  <div className="w-10 h-10 rounded-2xl bg-[#e8a33d]/20 text-[#0d1f23] flex items-center justify-center font-bold">
                    <Headphones className="w-5 h-5 text-[#e8a33d]" />
                  </div>
                  <div>
                    <h3 className="font-space font-bold text-base text-[#0d1f23]">
                      Suporte Técnico Atlas Software
                    </h3>
                    <p className="text-xs text-[#5a636a]">
                      Canal direto para dúvidas, ajustes e melhorias
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#5a636a] leading-relaxed">
                  Sua licença semestral inclui suporte técnico especializado para a clínica. Caso precise de auxílio com configurações, criação de novos serviços ou melhorias na plataforma, nossa equipe está à disposição.
                </p>

                <div className="p-4 bg-[#f7f6f2] rounded-2xl border border-line space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5a636a]">Tempo médio de resposta:</span>
                    <strong className="text-[#0d1f23]">Prioritário</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5a636a]">Cobertura:</span>
                    <strong className="text-[#0d1f23]">Suporte, Segurança &amp; Cloud</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="https://wa.me/5586988664485?text=Ol%C3%A1%2C+preciso+de+suporte+para+o+sistema+do+Dr.+Alex+Rocha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-2xl bg-[#0d1f23] hover:bg-[#132e35] text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  Falar com o Suporte Atlas Software
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
