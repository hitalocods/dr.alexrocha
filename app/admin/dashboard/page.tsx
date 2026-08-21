'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FinancialSummary } from '@/lib/types';

const COLORS = ['#e8a33d', '#2d4a53', '#69818d', '#0d1f23', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [periodType, setPeriodType] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialSummary | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchFinancial = useCallback(async (type: string, from?: string, to?: string) => {
    setLoading(true);
    try {
      let url = `/api/financial?type=${type}`;
      if (type === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (periodType !== 'custom') {
      fetchFinancial(periodType);
    }
  }, [periodType, fetchFinancial]);

  const handleApplyCustomFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFrom || !customTo) return;
    setPeriodType('custom');
    fetchFinancial('custom', customFrom, customTo);
  };

  const metrics = data?.metrics || {
    grossRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalExpenses: 0,
    paidExpenses: 0,
    fixedExpenses: 0,
    variableExpenses: 0,
    netProfit: 0,
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade">
      {/* Top Header & Date Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-space font-bold text-2xl lg:text-3xl text-[#0d1f23]">
            Dashboard Financeiro
          </h1>
          <p className="text-xs sm:text-sm text-[#5a636a] mt-1">
            Visão completa do faturamento, despesas e lucratividade da clínica.
          </p>
        </div>

        {/* Seletor de Período */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-line shadow-sm">
          <button
            onClick={() => setPeriodType('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodType === 'today'
                ? 'bg-[#0d1f23] text-white shadow'
                : 'text-[#5a636a] hover:text-[#0d1f23]'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriodType('week')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodType === 'week'
                ? 'bg-[#0d1f23] text-white shadow'
                : 'text-[#5a636a] hover:text-[#0d1f23]'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setPeriodType('month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodType === 'month'
                ? 'bg-[#0d1f23] text-white shadow'
                : 'text-[#5a636a] hover:text-[#0d1f23]'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriodType('custom')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              periodType === 'custom'
                ? 'bg-[#e8a33d] text-[#0d1f23] shadow'
                : 'text-[#5a636a] hover:text-[#0d1f23]'
            }`}
          >
            <Filter className="w-3 h-3" />
            Personalizado
          </button>
        </div>
      </div>

      {/* Formulário de Período Customizado (quando ativo) */}
      {periodType === 'custom' && (
        <form
          onSubmit={handleApplyCustomFilter}
          className="bg-white p-4 rounded-2xl border border-line shadow-sm flex flex-wrap items-center gap-4 animate-fade"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5a636a]">De:</span>
            <input
              type="date"
              required
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border border-line rounded-xl px-3 py-1.5 text-xs font-medium text-[#0d1f23] outline-none focus:border-[#e8a33d]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5a636a]">Até:</span>
            <input
              type="date"
              required
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border border-line rounded-xl px-3 py-1.5 text-xs font-medium text-[#0d1f23] outline-none focus:border-[#e8a33d]"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#0d1f23] text-white text-xs font-bold hover:bg-[#132e35] transition shadow cursor-pointer"
          >
            Filtrar Período
          </button>
        </form>
      )}

      {/* Indicador do Período Atual Selecionado */}
      {data?.period && (
        <div className="text-xs font-mono text-[#5a636a] flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-[#e8a33d]" />
          <span>
            Exibindo dados de{' '}
            <strong className="text-[#0d1f23]">
              {new Date(data.period.from + 'T00:00:00').toLocaleDateString('pt-BR')}
            </strong>{' '}
            até{' '}
            <strong className="text-[#0d1f23]">
              {new Date(data.period.to + 'T00:00:00').toLocaleDateString('pt-BR')}
            </strong>
          </span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-[#5a636a]">
          <div className="w-8 h-8 border-3 border-[#e8a33d] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Calculando métricas financeiras...
        </div>
      ) : (
        <>
          {/* CARDS DE KPIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Faturamento Bruto */}
            <div className="bg-white rounded-3xl p-5 border border-line shadow-card hover:border-[#e8a33d]/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-[#69818d] tracking-wider">
                  Faturamento Bruto
                </span>
                <div className="w-9 h-9 rounded-2xl bg-[#e8a33d]/15 text-[#e8a33d] flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="font-space font-bold text-2xl lg:text-3xl text-[#0d1f23] mt-2">
                {formatBRL(metrics.grossRevenue)}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#5a636a] pt-2 border-t border-line/50">
                <span>Recebido: <strong className="text-emerald-600">{formatBRL(metrics.paidRevenue)}</strong></span>
                <span>A receber: <strong className="text-amber-600">{formatBRL(metrics.pendingRevenue)}</strong></span>
              </div>
            </div>

            {/* Card 2: Despesas Totais */}
            <div className="bg-white rounded-3xl p-5 border border-line shadow-card hover:border-rose-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-[#69818d] tracking-wider">
                  Despesas Totais
                </span>
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div className="font-space font-bold text-2xl lg:text-3xl text-rose-600 mt-2">
                {formatBRL(metrics.totalExpenses)}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#5a636a] pt-2 border-t border-line/50">
                <span>Fixas: <strong>{formatBRL(metrics.fixedExpenses)}</strong></span>
                <span>Variáveis: <strong>{formatBRL(metrics.variableExpenses)}</strong></span>
              </div>
            </div>

            {/* Card 3: Lucro Líquido Real */}
            <div className={`rounded-3xl p-5 border shadow-card transition ${
              metrics.netProfit >= 0 ? 'bg-[#0d1f23] text-white border-transparent' : 'bg-rose-950 text-white border-transparent'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-[#afb3b7] tracking-wider">
                  Lucro Líquido Real
                </span>
                <div className="w-9 h-9 rounded-2xl bg-[#e8a33d] text-[#0d1f23] flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="font-space font-bold text-2xl lg:text-3xl text-[#e8a33d] mt-2">
                {formatBRL(metrics.netProfit)}
              </div>
              <div className="mt-3 text-xs text-[#afb3b7] pt-2 border-t border-white/10 flex justify-between items-center">
                <span>Receitas - Despesas</span>
                <span className="font-mono text-[11px] text-emerald-400 font-bold">
                  {metrics.grossRevenue > 0
                    ? `${((metrics.netProfit / metrics.grossRevenue) * 100).toFixed(1)}% Margem`
                    : '0%'}
                </span>
              </div>
            </div>

            {/* Card 4: Consultas & Atendimentos */}
            <div className="bg-white rounded-3xl p-5 border border-line shadow-card hover:border-[#e8a33d]/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-[#69818d] tracking-wider">
                  Atendimentos
                </span>
                <div className="w-9 h-9 rounded-2xl bg-[#2d4a53]/10 text-[#2d4a53] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="font-space font-bold text-2xl lg:text-3xl text-[#0d1f23] mt-2">
                {metrics.totalAppointments}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#5a636a] pt-2 border-t border-line/50">
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {metrics.completedAppointments} concluídos
                </span>
                {metrics.cancelledAppointments > 0 && (
                  <span className="text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {metrics.cancelledAppointments} canc.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* GRÁFICOS PRINCIPAIS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico 1: Evolução Financeira Diária (Receitas vs Despesas) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-line shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-space font-bold text-lg text-[#0d1f23]">
                    Evolução Financeira
                  </h3>
                  <p className="text-xs text-[#5a636a]">Receita Bruta vs Despesas no período</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-[#e8a33d]">
                    <div className="w-3 h-3 rounded-full bg-[#e8a33d]" /> Receita
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-500">
                    <div className="w-3 h-3 rounded-full bg-rose-500" /> Despesa
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
                {mounted && data?.charts.revenueByDay && data.charts.revenueByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.charts.revenueByDay}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e8a33d" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#e8a33d" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" stroke="#afb3b7" fontSize={11} />
                      <YAxis stroke="#afb3b7" fontSize={11} tickFormatter={(val) => `R$${val}`} />
                      <Tooltip
                        formatter={(val: any) => [formatBRL(Number(val)), '']}
                        contentStyle={{ backgroundColor: '#0d1f23', color: '#fff', borderRadius: '16px', border: 'none', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="revenue" name="Receita" stroke="#e8a33d" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                      <Area type="monotone" dataKey="expenses" name="Despesa" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#afb3b7]">
                    Nenhum registro para o período selecionado.
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico 2: Faturamento por Serviço */}
            <div className="bg-white rounded-3xl p-6 border border-line shadow-card flex flex-col justify-between">
              <div>
                <h3 className="font-space font-bold text-lg text-[#0d1f23]">
                  Receita por Procedimento
                </h3>
                <p className="text-xs text-[#5a636a] mb-4">Participação de cada serviço no faturamento</p>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                {mounted && data?.charts.revenueByService && data.charts.revenueByService.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.charts.revenueByService}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {data.charts.revenueByService.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [formatBRL(Number(val)), 'Faturamento']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-[#afb3b7] text-center">
                    Sem atendimentos faturados no período.
                  </div>
                )}
              </div>

              {/* Lista dos Serviços */}
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1">
                {data?.charts.revenueByService?.map((s, idx) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 truncate max-w-[170px] text-[#0d1f23]">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="font-bold font-mono">{formatBRL(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SEGUNDA LINHA DE GRÁFICOS: DESPESAS POR CATEGORIA & STATUS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Despesas por Categoria */}
            <div className="bg-white rounded-3xl p-6 border border-line shadow-card">
              <h3 className="font-space font-bold text-lg text-[#0d1f23] mb-1">
                Despesas por Categoria
              </h3>
              <p className="text-xs text-[#5a636a] mb-6">Distribuição dos custos da clínica</p>

              <div className="h-60 w-full">
                {mounted && data?.charts.expensesByCategory && data.charts.expensesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.expensesByCategory} layout="vertical">
                      <XAxis type="number" tickFormatter={(val) => `R$${val}`} fontSize={11} stroke="#afb3b7" />
                      <YAxis dataKey="category" type="category" fontSize={11} stroke="#0d1f23" width={110} />
                      <Tooltip formatter={(val: any) => [formatBRL(Number(val)), 'Total']} />
                      <Bar dataKey="amount" fill="#2d4a53" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#afb3b7]">
                    Nenhuma despesa registrada para o período selecionado.
                  </div>
                )}
              </div>
            </div>

            {/* Balanço Operacional Resumido */}
            <div className="bg-white rounded-3xl p-6 border border-line shadow-card flex flex-col justify-between">
              <div>
                <h3 className="font-space font-bold text-lg text-[#0d1f23] mb-1">
                  Resumo de Eficiência Operacional
                </h3>
                <p className="text-xs text-[#5a636a] mb-6">Indicadores rápidos de performance</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f7f6f2]">
                    <span className="text-xs font-semibold text-[#5a636a]">Ticket Médio por Atendimento</span>
                    <span className="font-space font-bold text-sm text-[#0d1f23]">
                      {metrics.completedAppointments > 0
                        ? formatBRL(metrics.grossRevenue / metrics.completedAppointments)
                        : formatBRL(0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f7f6f2]">
                    <span className="text-xs font-semibold text-[#5a636a]">Taxa de Conversão / Conclusão</span>
                    <span className="font-space font-bold text-sm text-emerald-600">
                      {metrics.totalAppointments > 0
                        ? `${((metrics.completedAppointments / metrics.totalAppointments) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f7f6f2]">
                    <span className="text-xs font-semibold text-[#5a636a]">Comprometimento com Despesas</span>
                    <span className="font-space font-bold text-sm text-rose-600">
                      {metrics.grossRevenue > 0
                        ? `${((metrics.totalExpenses / metrics.grossRevenue) * 100).toFixed(1)}% da receita`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-line text-center">
                <span className="text-xs text-[#5a636a]">
                  Deseja lançar novas despesas ou atendimentos? Acesse as abas correspondentes no menu lateral.
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
