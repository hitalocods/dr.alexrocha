'use client';

import { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  TrendingDown,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Repeat,
  Trash2,
  Edit2,
  DollarSign,
} from 'lucide-react';
import { Expense, ExpenseCategory } from '@/lib/types';

const CATEGORIES: ExpenseCategory[] = [
  'Aluguel',
  'Energia/Água',
  'Materiais/Insumos',
  'Equipamentos',
  'Marketing',
  'Sistemas',
  'Impostos',
  'Outros',
];

export default function DespesasPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<Expense | null>(null);

  // Form
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Aluguel');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formRecurring, setFormRecurring] = useState(false);
  const [formDueDate, setFormDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState<'paid' | 'pending'>('pending');
  const [submitting, setSubmitting] = useState(false);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const from = `${selectedMonth}-01`;
      const [year, month] = selectedMonth.split('-');
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const to = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

      const res = await fetch(`/api/expenses?from=${from}&to=${to}`).then((r) => r.json());
      if (Array.isArray(res)) setExpenses(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedMonth]);

  const openNewModal = () => {
    setEditingExp(null);
    setFormDesc('');
    setFormCategory('Aluguel');
    setFormAmount(0);
    setFormRecurring(false);
    setFormDueDate(new Date().toISOString().slice(0, 10));
    setFormStatus('pending');
    setModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExp(exp);
    setFormDesc(exp.description);
    setFormCategory(exp.category);
    setFormAmount(exp.amount);
    setFormRecurring(exp.is_recurring_monthly);
    setFormDueDate(exp.due_date);
    setFormStatus(exp.status);
    setModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        description: formDesc,
        category: formCategory,
        amount: Number(formAmount) || 0,
        is_recurring_monthly: formRecurring,
        due_date: formDueDate,
        status: formStatus,
        payment_date: formStatus === 'paid' ? new Date().toISOString().slice(0, 10) : null,
      };

      if (editingExp) {
        const res = await fetch(`/api/expenses/${editingExp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          loadExpenses();
          setModalOpen(false);
        }
      } else {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          loadExpenses();
          setModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (exp: Expense) => {
    const newStatus = exp.status === 'paid' ? 'pending' : 'paid';
    const paymentDate = newStatus === 'paid' ? new Date().toISOString().slice(0, 10) : null;
    try {
      const res = await fetch(`/api/expenses/${exp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, payment_date: paymentDate }),
      });
      if (res.ok) {
        setExpenses((prev) =>
          prev.map((e) =>
            e.id === exp.id ? { ...e, status: newStatus, payment_date: paymentDate } : e
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta despesa?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalAmount = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const paidAmount = expenses
    .filter((e) => e.status === 'paid')
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const pendingAmount = totalAmount - paidAmount;

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-space font-bold text-2xl lg:text-3xl text-[#0d1f23]">
            Setor de Despesas
          </h1>
          <p className="text-xs sm:text-sm text-[#5a636a] mt-1">
            Controle de custos fixos mensais (aluguel, energia) e despesas variáveis da clínica.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-5 py-3 rounded-2xl bg-[#0d1f23] text-white font-bold text-xs hover:bg-[#132e35] transition shadow-premium flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#e8a33d]" />
          Lançar Despesa
        </button>
      </div>

      {/* Cards de Resumo & Seletor de Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Seletor do Mês */}
        <div className="bg-white rounded-3xl p-5 border border-line shadow-card flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#69818d]">
            <Calendar className="w-4 h-4 text-[#e8a33d]" /> Mês de Referência
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="mt-3 font-space font-bold text-lg text-[#0d1f23] bg-transparent outline-none cursor-pointer"
          />
        </div>

        {/* Total Despesas do Mês */}
        <div className="bg-white rounded-3xl p-5 border border-line shadow-card">
          <span className="text-[11px] font-mono font-bold uppercase text-[#69818d]">
            Total de Despesas
          </span>
          <div className="font-space font-bold text-2xl text-rose-600 mt-2">
            {formatBRL(totalAmount)}
          </div>
          <div className="text-[11px] text-[#5a636a] mt-1">
            {expenses.length} lançamentos cadastrados
          </div>
        </div>

        {/* Pagas */}
        <div className="bg-white rounded-3xl p-5 border border-line shadow-card">
          <span className="text-[11px] font-mono font-bold uppercase text-emerald-600">
            Contas Pagas
          </span>
          <div className="font-space font-bold text-2xl text-emerald-600 mt-2">
            {formatBRL(paidAmount)}
          </div>
          <div className="text-[11px] text-[#5a636a] mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Liquidado
          </div>
        </div>

        {/* Pendentes */}
        <div className="bg-white rounded-3xl p-5 border border-line shadow-card">
          <span className="text-[11px] font-mono font-bold uppercase text-amber-600">
            A Pagar / Pendente
          </span>
          <div className="font-space font-bold text-2xl text-amber-600 mt-2">
            {formatBRL(pendingAmount)}
          </div>
          <div className="text-[11px] text-[#5a636a] mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Vencimentos abertos
          </div>
        </div>
      </div>

      {/* Lista / Tabela de Despesas */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-line shadow-card">
        <h3 className="font-space font-bold text-lg text-[#0d1f23] mb-4">
          Lançamentos de Despesas
        </h3>

        {loading ? (
          <div className="py-16 text-center text-[#5a636a]">
            <div className="w-8 h-8 border-3 border-[#e8a33d] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Carregando despesas...
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center text-[#afb3b7]">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Nenhuma despesa registrada para este mês.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-[#69818d] font-mono uppercase text-[10px]">
                  <th className="pb-3 font-bold">Descrição</th>
                  <th className="pb-3 font-bold">Categoria</th>
                  <th className="pb-3 font-bold">Tipo</th>
                  <th className="pb-3 font-bold">Vencimento</th>
                  <th className="pb-3 font-bold">Valor</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#f7f6f2]/50 transition">
                    <td className="py-3.5 font-bold text-[#0d1f23]">{exp.description}</td>
                    <td className="py-3.5 text-[#5a636a]">{exp.category}</td>
                    <td className="py-3.5">
                      {exp.is_recurring_monthly ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          <Repeat className="w-3 h-3" /> Fixa Mensal
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#69818d]">Variável</span>
                      )}
                    </td>
                    <td className="py-3.5 text-[#5a636a] font-mono">
                      {new Date(exp.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3.5 font-space font-bold text-[#0d1f23]">
                      {formatBRL(exp.amount)}
                    </td>
                    <td className="py-3.5">
                      <button
                        onClick={() => toggleStatus(exp)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                          exp.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                      >
                        {exp.status === 'paid' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Pago
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" /> Pendente
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(exp)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-[#0d1f23] transition"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE DESPESA */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>

            <h3 className="font-space font-bold text-xl text-[#0d1f23] mb-1">
              {editingExp ? 'Editar Despesa' : 'Nova Despesa'}
            </h3>
            <p className="text-xs text-[#5a636a] mb-6">
              Registre os custos da clínica para alimentar o balanço financeiro.
            </p>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                  Descrição da Despesa
                </label>
                <input
                  type="text"
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ex: Aluguel do Consultório, Energia, etc"
                  className="w-full bg-transparent text-sm font-semibold outline-none text-[#0d1f23]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold outline-none text-[#0d1f23]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-semibold outline-none text-[#0d1f23]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                    Vencimento
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold outline-none text-[#0d1f23]"
                  />
                </div>

                <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'paid' | 'pending')}
                    className="w-full bg-transparent text-xs font-semibold outline-none text-[#0d1f23]"
                  >
                    <option value="pending">Pendente (A Pagar)</option>
                    <option value="paid">Pago</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-[#0d1f23] block">
                    Despesa Fixa Recorrente?
                  </label>
                  <span className="text-[10px] text-[#5a636a]">
                    Repete todo mês (Ex: aluguel, internet)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formRecurring}
                  onChange={(e) => setFormRecurring(e.target.checked)}
                  className="w-5 h-5 accent-[#e8a33d] rounded cursor-pointer"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-line text-xs font-bold hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-full bg-[#0d1f23] text-white text-xs font-bold hover:bg-[#132e35] shadow"
                >
                  {submitting ? 'Salvando...' : 'Salvar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
