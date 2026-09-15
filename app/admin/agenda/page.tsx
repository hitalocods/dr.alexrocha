'use client';

import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  MessageSquare,
  User,
  DollarSign,
  Edit2,
  Trash2,
  Filter,
  Check,
} from 'lucide-react';
import { Appointment, Service, AppointmentStatus } from '@/lib/types';

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal Novo / Editar Agendamento
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formServiceId, setFormServiceId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<AppointmentStatus>('pending');
  const [formPaid, setFormPaid] = useState(false);
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Carregar lista de serviços apenas uma vez na montagem
  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((resSvc) => {
        if (Array.isArray(resSvc)) setServices(resSvc);
      })
      .catch((err) => console.error('Erro ao carregar serviços:', err));
  }, []);

  // Carregar dados de agendamentos da data
  const loadAppointments = async (date: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const resApt = await fetch(`/api/appointments?from=${date}&to=${date}`).then((r) => r.json());
      if (Array.isArray(resApt)) setAppointments(resApt);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // Carregamento inicial da data selecionada
    loadAppointments(selectedDate);

    // Polling inteligente e econômico (60s) apenas se a aba estiver visível
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadAppointments(selectedDate, true);
      }
    }, 60000);

    // Proteção de aba minimizada / tela bloqueada:
    // Ao reabrir a aba, sincroniza imediatamente 1 vez
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAppointments(selectedDate, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedDate]);

  // Ações Rápidas
  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus, isPaid?: boolean) => {
    try {
      const updates: any = { status: newStatus };
      if (isPaid !== undefined) updates.is_paid = isPaid;

      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este agendamento?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setEditingApt(null);
    setFormName('');
    setFormPhone('');
    setFormServiceId(services[0]?.id || '');
    setFormDate(selectedDate);
    setFormTime('09:00');
    setFormPrice(services[0]?.price || 200);
    setFormStatus('pending');
    setFormPaid(false);
    setFormNotes('');
    setModalOpen(true);
  };

  const openEditModal = (apt: Appointment) => {
    setEditingApt(apt);
    setFormName(apt.client_name);
    setFormPhone(apt.client_phone);
    setFormServiceId(apt.service_id);
    setFormDate(apt.date);
    setFormTime(apt.time);
    setFormPrice(apt.price_charged);
    setFormStatus(apt.status);
    setFormPaid(apt.is_paid);
    setFormNotes(apt.notes || '');
    setModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        client_name: formName,
        client_phone: formPhone,
        service_id: formServiceId,
        date: formDate,
        time: formTime,
        price_charged: Number(formPrice) || 0,
        status: formStatus,
        is_paid: formPaid,
        notes: formNotes,
      };

      if (editingApt) {
        const res = await fetch(`/api/appointments/${editingApt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          loadAppointments(selectedDate);
          setModalOpen(false);
        }
      } else {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          loadAppointments(selectedDate);
          setModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Enviar WhatsApp para o Paciente
  const openWhatsAppPatient = (phone: string, name: string, time: string, serviceName?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const msg = `Olá, ${name}! Tudo bem? Confirmando seu horário com o Dr. Alex Rocha hoje às ${time}${serviceName ? ` para ${serviceName}` : ''}. Podemos confirmar sua presença?`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchesSearch =
      a.client_name.toLowerCase().includes(search.toLowerCase()) ||
      a.client_phone.includes(search);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">Confirmado</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Concluído</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">Cancelado</span>;
      case 'no_show':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">Não compareceu</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">Pendente</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-space font-bold text-2xl lg:text-3xl text-[#0d1f23]">
            Agenda de Pacientes
          </h1>
          <p className="text-xs sm:text-sm text-[#5a636a] mt-1">
            Controle de atendimentos, confirmações e status em tempo real.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-5 py-3 rounded-2xl bg-[#0d1f23] text-white font-bold text-xs hover:bg-[#132e35] transition shadow-premium flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#e8a33d]" />
          Novo Agendamento
        </button>
      </div>

      {/* Barra de Filtros e Data */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-line shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Seletor de Data */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e8a33d]/15 text-[#e8a33d] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-[#69818d] tracking-wider">
              Data Selecionada
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-space font-bold text-base text-[#0d1f23] bg-transparent outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Busca e Filtro de Status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#f7f6f2] px-3 py-2 rounded-xl border border-line focus-within:border-[#e8a33d] transition flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-[#afb3b7]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="bg-transparent text-xs text-[#0d1f23] outline-none w-full sm:w-40"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#f7f6f2] px-3 py-2 rounded-xl border border-line text-xs font-semibold text-[#0d1f23] outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="confirmed">Confirmado</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Lista de Agendamentos do Dia */}
      {loading ? (
        <div className="py-20 text-center text-[#5a636a]">
          <div className="w-8 h-8 border-3 border-[#e8a33d] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Carregando atendimentos do dia...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-line shadow-card">
          <div className="w-16 h-16 rounded-full bg-[#f7f6f2] flex items-center justify-center mx-auto mb-4 text-[#afb3b7]">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <h3 className="font-space font-bold text-lg text-[#0d1f23]">Nenhum agendamento encontrado</h3>
          <p className="text-xs text-[#5a636a] mt-1 max-w-sm mx-auto">
            Não há consultas marcadas para o dia selecionado com os filtros atuais.
          </p>
          <button
            onClick={openNewModal}
            className="mt-5 px-5 py-2.5 rounded-full bg-[#0d1f23] text-white text-xs font-bold hover:bg-[#132e35] transition"
          >
            + Agendar Paciente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((apt) => {
            return (
              <div
                key={apt.id}
                className="bg-white rounded-3xl p-5 border border-line shadow-card hover:border-[#e8a33d]/40 transition flex flex-col justify-between"
              >
                <div>
                  {/* Top do Card: Horário & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-line/60">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#e8a33d]" />
                      <span className="font-space font-bold text-lg text-[#0d1f23]">{apt.time}</span>
                    </div>
                    <div>{getStatusBadge(apt.status)}</div>
                  </div>

                  {/* Informações do Paciente */}
                  <div className="mt-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#69818d] shrink-0" />
                      <span className="font-bold text-sm text-[#0d1f23] truncate">{apt.client_name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#5a636a]">
                      <Phone className="w-3.5 h-3.5 text-[#69818d] shrink-0" />
                      <span>{apt.client_phone}</span>
                    </div>

                    <div className="pt-2 text-xs font-medium text-[#2d4a53]">
                      Procedimento: <strong>{apt.service_name || 'Procedimento'}</strong>
                    </div>

                    {apt.notes && (
                      <div className="bg-[#f7f6f2] p-2.5 rounded-xl text-[11px] text-[#5a636a] italic">
                        &quot;{apt.notes}&quot;
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card: Preço, Pagamento & Ações */}
                <div className="mt-5 pt-3 border-t border-line/60">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-space font-bold text-sm text-[#0d1f23]">
                      R$ {Number(apt.price_charged).toFixed(2).replace('.', ',')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${apt.is_paid
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}
                    >
                      {apt.is_paid ? 'Pago' : 'Pagamento Pendente'}
                    </span>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {/* Botão Concluir & Pago */}
                    {apt.status !== 'completed' && (
                      <button
                        title="Marcar como Concluído e Pago"
                        onClick={() => handleUpdateStatus(apt.id, 'completed', true)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Concluir
                      </button>
                    )}

                    {/* Botão WhatsApp */}
                    <button
                      title="Conversar no WhatsApp"
                      onClick={() =>
                        openWhatsAppPatient(apt.client_phone, apt.client_name, apt.time, apt.service_name)
                      }
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    {/* Botão Editar */}
                    <button
                      title="Editar Agendamento"
                      onClick={() => openEditModal(apt)}
                      className="p-2 rounded-xl bg-gray-100 text-[#0d1f23] hover:bg-gray-200 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Botão Excluir */}
                    <button
                      title="Excluir Agendamento"
                      onClick={() => handleDelete(apt.id)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE NOVO / EDITAR AGENDAMENTO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>

            <h3 className="font-space font-bold text-xl text-[#0d1f23] mb-1">
              {editingApt ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h3>
            <p className="text-xs text-[#5a636a] mb-6">
              Preencha os detalhes do paciente e procedimento.
            </p>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                  Nome do Paciente
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full bg-transparent text-sm font-semibold outline-none text-[#0d1f23]"
                />
              </div>

              <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                  WhatsApp com DDD
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="(86) 9 9999-9999"
                  className="w-full bg-transparent text-sm font-semibold outline-none text-[#0d1f23]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                    Procedimento
                  </label>
                  <select
                    value={formServiceId}
                    onChange={(e) => {
                      setFormServiceId(e.target.value);
                      const s = services.find((srv) => srv.id === e.target.value);
                      if (s) setFormPrice(s.price);
                    }}
                    className="w-full bg-transparent text-xs font-semibold outline-none text-[#0d1f23]"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (R$ {s.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                    Valor Cobrado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-semibold outline-none text-[#0d1f23]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold outline-none text-[#0d1f23]"
                  />
                </div>

                <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold outline-none text-[#0d1f23]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AppointmentStatus)}
                    className="w-full bg-transparent text-xs font-semibold outline-none text-[#0d1f23]"
                  >
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="no_show">Não compareceu</option>
                  </select>
                </div>

                <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#0d1f23]">
                    Já foi Pago?
                  </label>
                  <input
                    type="checkbox"
                    checked={formPaid}
                    onChange={(e) => setFormPaid(e.target.checked)}
                    className="w-5 h-5 accent-[#e8a33d] rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                  Observações / Histórico do Paciente
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Queixas, observações clínicas..."
                  className="w-full bg-transparent text-xs font-medium outline-none text-[#0d1f23] resize-none"
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
                  {submitting ? 'Salvando...' : 'Salvar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
