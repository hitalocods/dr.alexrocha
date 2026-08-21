'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  DollarSign,
  Clock,
} from 'lucide-react';
import { Service, ClinicSettings } from '@/lib/types';

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSvc, setEditingSvc] = useState<Service | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDur, setFormDur] = useState('45 min');
  const [formPrice, setFormPrice] = useState<number>(200);
  const [formCategory, setFormCategory] = useState('Serviços');
  const [formActive, setFormActive] = useState(true);
  const [formOrder, setFormOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resSvc, resSet] = await Promise.all([
        fetch('/api/services').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
      ]);
      if (Array.isArray(resSvc)) setServices(resSvc);
      if (resSet && !resSet.error) setSettings(resSet);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingSvc(null);
    setFormName('');
    setFormDesc('');
    setFormDur('45 min');
    setFormPrice(200);
    setFormCategory('Serviços');
    setFormActive(true);
    setFormOrder(services.length + 1);
    setModalOpen(true);
  };

  const openEditModal = (svc: Service) => {
    setEditingSvc(svc);
    setFormName(svc.name);
    setFormDesc(svc.description);
    setFormDur(svc.duration);
    setFormPrice(svc.price);
    setFormCategory(svc.category || 'Serviços');
    setFormActive(svc.is_active);
    setFormOrder(svc.order_num);
    setModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formName,
        description: formDesc,
        duration: formDur,
        price: Number(formPrice) || 0,
        category: formCategory,
        is_active: formActive,
        order_num: Number(formOrder) || 1,
      };

      if (editingSvc) {
        const res = await fetch(`/api/services/${editingSvc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          loadData();
          setModalOpen(false);
        }
      } else {
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          loadData();
          setModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este serviço do catálogo?')) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleServiceActive = async (svc: Service) => {
    try {
      const res = await fetch(`/api/services/${svc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !svc.is_active }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === svc.id ? { ...s, is_active: !s.is_active } : s))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePublicPrices = async () => {
    if (!settings) return;
    const newValue = !settings.show_prices_publicly;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_prices_publicly: newValue }),
      });
      if (res.ok) {
        setSettings({ ...settings, show_prices_publicly: newValue });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-space font-bold text-2xl lg:text-3xl text-[#0d1f23]">
            Gestão de Serviços
          </h1>
          <p className="text-xs sm:text-sm text-[#5a636a] mt-1">
            Cadastre, edite valores, descrições e controle a exibição pública de preços.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-5 py-3 rounded-2xl bg-[#0d1f23] text-white font-bold text-xs hover:bg-[#132e35] transition shadow-premium flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#e8a33d]" />
          Adicionar Novo Serviço
        </button>
      </div>

      {/* Banner de Controle de Exibição Pública de Preços */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-line shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#e8a33d]/15 text-[#e8a33d] flex items-center justify-center shrink-0 mt-0.5">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-space font-bold text-base text-[#0d1f23]">
              Exibição Pública dos Preços
            </h3>
            <p className="text-xs text-[#5a636a] mt-0.5 max-w-xl">
              Quando desativado, os pacientes verão <strong className="text-[#0d1f23]">&quot;Consulte&quot;</strong> na página pública de agendamento. Quando ativado, os valores em R$ aparecem diretamente.
            </p>
          </div>
        </div>

        <button
          onClick={togglePublicPrices}
          className={`px-5 py-2.5 rounded-full font-bold text-xs transition flex items-center gap-2 shrink-0 ${
            settings?.show_prices_publicly
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-200 text-[#0d1f23] hover:bg-gray-300'
          }`}
        >
          {settings?.show_prices_publicly ? (
            <>
              <Eye className="w-4 h-4" />
              Preços Visíveis ao Público
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              Preços Ocultos (&quot;Consulte&quot;)
            </>
          )}
        </button>
      </div>

      {/* Grid de Serviços */}
      {loading ? (
        <div className="py-20 text-center text-[#5a636a]">
          <div className="w-8 h-8 border-3 border-[#e8a33d] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Carregando catálogo de serviços...
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-line shadow-card">
          <Sparkles className="w-10 h-10 text-[#afb3b7] mx-auto mb-3" />
          <h3 className="font-space font-bold text-lg text-[#0d1f23]">Nenhum serviço cadastrado</h3>
          <p className="text-xs text-[#5a636a] mt-1 mb-4">Adicione os serviços que a clínica oferece.</p>
          <button
            onClick={openNewModal}
            className="px-5 py-2.5 rounded-full bg-[#0d1f23] text-white text-xs font-bold"
          >
            Adicionar Primeiro Serviço
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={`bg-white rounded-3xl p-6 border shadow-card transition flex flex-col justify-between ${
                svc.is_active ? 'border-line hover:border-[#e8a33d]/40' : 'opacity-60 border-dashed border-line'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#69818d] bg-[#f7f6f2] px-2.5 py-1 rounded-md">
                      {svc.category || 'Serviços'}
                    </span>
                    <h3 className="font-space font-bold text-lg text-[#0d1f23] mt-2">
                      {svc.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="font-space font-bold text-xl text-[#0d1f23]">
                      R$ {Number(svc.price).toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-[11px] font-medium text-[#69818d] flex items-center justify-end gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {svc.duration}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#5a636a] mt-3 leading-relaxed">
                  {svc.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between">
                <button
                  onClick={() => toggleServiceActive(svc)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                    svc.is_active
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {svc.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {svc.is_active ? 'Ativo no Agendamento' : 'Desativado'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(svc)}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0d1f23] transition"
                    title="Editar Serviço"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(svc.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                    title="Excluir Serviço"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE NOVO / EDITAR SERVIÇO */}
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
              {editingSvc ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>
            <p className="text-xs text-[#5a636a] mb-6">
              Configure o nome, valor e detalhes do procedimento.
            </p>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                  Nome do Procedimento / Serviço
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Sessão de Quiropraxia"
                  className="w-full bg-transparent text-sm font-semibold outline-none text-[#0d1f23]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-semibold outline-none text-[#0d1f23]"
                  />
                </div>

                <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                    Duração Estimada
                  </label>
                  <input
                    type="text"
                    required
                    value={formDur}
                    onChange={(e) => setFormDur(e.target.value)}
                    placeholder="Ex: 45 min"
                    className="w-full bg-transparent text-sm font-semibold outline-none text-[#0d1f23]"
                  />
                </div>
              </div>

              <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                  Descrição para o Paciente
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Benefícios, técnica aplicada e foco do atendimento..."
                  className="w-full bg-transparent text-xs font-medium outline-none text-[#0d1f23] resize-none"
                />
              </div>

              <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line flex items-center justify-between">
                <label className="text-xs font-bold text-[#0d1f23]">
                  Serviço Ativo para Agendamento?
                </label>
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
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
                  {submitting ? 'Salvando...' : 'Salvar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
