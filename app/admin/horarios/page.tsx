'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Calendar as CalendarIcon,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { BusinessDayHours, BlockedDate } from '@/lib/types';

export default function HorariosPage() {
  const [businessHours, setBusinessHours] = useState<BusinessDayHours[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendário de Bloqueio
  const [calRef, setCalRef] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Modal para Bloquear Data
  const [selectedDateToLock, setSelectedDateToLock] = useState<string | null>(null);
  const [lockReason, setLockReason] = useState('Folga / Ausência');
  const [savingLock, setSavingLock] = useState(false);

  // Adicionar Horário a um Dia da Semana
  const [activeDayModal, setActiveDayModal] = useState<BusinessDayHours | null>(null);
  const [newSlotTime, setNewSlotTime] = useState('18:00');

  const loadScheduleData = async () => {
    setLoading(true);
    try {
      const [resSchedule, resBlocked] = await Promise.all([
        fetch('/api/schedule-settings').then((r) => r.json()),
        fetch('/api/blocked-dates').then((r) => r.json()),
      ]);

      if (resSchedule && resSchedule.businessHours) {
        setBusinessHours(resSchedule.businessHours);
      }
      if (Array.isArray(resBlocked)) {
        setBlockedDates(resBlocked);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleData();
  }, []);

  // Alternar se o dia da semana é dia de trabalho
  const toggleWorkingDay = async (day: BusinessDayHours) => {
    const newIsWorking = !day.is_working;
    try {
      const res = await fetch('/api/schedule-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: day.day_of_week,
          is_working: newIsWorking,
          slots: day.slots,
        }),
      });

      if (res.ok) {
        setBusinessHours((prev) =>
          prev.map((d) =>
            d.day_of_week === day.day_of_week ? { ...d, is_working: newIsWorking } : d
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trancar / Destrancar Data Específica
  const handleToggleBlockDate = async (isoDate: string, reason?: string) => {
    setSavingLock(true);
    try {
      const res = await fetch('/api/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: isoDate, reason: reason || 'Dia trancado' }),
      });

      if (res.ok) {
        loadScheduleData();
        setSelectedDateToLock(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingLock(false);
    }
  };

  // Gerenciamento de Slots no dia da semana
  const handleAddSlot = async () => {
    if (!activeDayModal || !newSlotTime) return;
    const currentSlots = activeDayModal.slots || [];
    if (currentSlots.includes(newSlotTime)) return;

    const newSlots = [...currentSlots, newSlotTime].sort();
    try {
      const res = await fetch('/api/schedule-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: activeDayModal.day_of_week,
          is_working: activeDayModal.is_working,
          slots: newSlots,
        }),
      });

      if (res.ok) {
        setBusinessHours((prev) =>
          prev.map((d) =>
            d.day_of_week === activeDayModal.day_of_week ? { ...d, slots: newSlots } : d
          )
        );
        setActiveDayModal({ ...activeDayModal, slots: newSlots });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSlot = async (slotToRemove: string) => {
    if (!activeDayModal) return;
    const newSlots = activeDayModal.slots.filter((s) => s !== slotToRemove);
    try {
      const res = await fetch('/api/schedule-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: activeDayModal.day_of_week,
          is_working: activeDayModal.is_working,
          slots: newSlots,
        }),
      });

      if (res.ok) {
        setBusinessHours((prev) =>
          prev.map((d) =>
            d.day_of_week === activeDayModal.day_of_week ? { ...d, slots: newSlots } : d
          )
        );
        setActiveDayModal({ ...activeDayModal, slots: newSlots });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calendário
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const shiftMonth = (dir: number) => {
    const next = new Date(calRef);
    next.setMonth(next.getMonth() + dir);
    setCalRef(next);
  };

  const isBlocked = (isoDate: string) => {
    return blockedDates.some((b) => b.date === isoDate);
  };

  const getBlockedReason = (isoDate: string) => {
    return blockedDates.find((b) => b.date === isoDate)?.reason || 'Dia trancado';
  };

  return (
    <div className="space-y-8 animate-fade">
      {/* Header */}
      <div>
        <h1 className="font-space font-bold text-2xl lg:text-3xl text-[#0d1f23]">
          Horários &amp; Trava de Datas
        </h1>
        <p className="text-xs sm:text-sm text-[#5a636a] mt-1">
          Configure a grade semanal de trabalho e tranque dias específicos no calendário (feriados, férias ou folgas).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SEÇÃO 1: DIAS DA SEMANA & SLOTS (6 colunas) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-line shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h3 className="font-space font-bold text-lg text-[#0d1f23]">
                Grade Semanal de Atendimento
              </h3>
              <p className="text-xs text-[#5a636a]">Ative ou desative os dias e edite os horários</p>
            </div>
            <Clock className="w-5 h-5 text-[#e8a33d]" />
          </div>

          {loading ? (
            <div className="py-12 text-center text-[#5a636a] text-xs">Carregando horários...</div>
          ) : (
            <div className="space-y-3">
              {businessHours.map((day) => (
                <div
                  key={day.day_of_week}
                  className={`p-4 rounded-2xl border transition-all ${
                    day.is_working
                      ? 'bg-[#f7f6f2] border-line'
                      : 'bg-gray-50 border-dashed border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-space font-bold text-sm text-[#0d1f23]">
                        {day.day_name}
                      </div>
                      <div className="text-[11px] text-[#5a636a]">
                        {day.is_working
                          ? `${day.slots?.length || 0} horários configurados`
                          : 'Clínica fechada'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {day.is_working && (
                        <button
                          onClick={() => setActiveDayModal(day)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-line text-xs font-bold text-[#0d1f23] hover:bg-gray-100 transition"
                        >
                          Editar Horários
                        </button>
                      )}

                      <button
                        onClick={() => toggleWorkingDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          day.is_working
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {day.is_working ? 'Atende' : 'Não Atende'}
                      </button>
                    </div>
                  </div>

                  {/* Visualização Rápida dos Chips de Horário */}
                  {day.is_working && day.slots && day.slots.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-line/40">
                      {day.slots.map((slot) => (
                        <span
                          key={slot}
                          className="px-2 py-0.5 rounded-md bg-white border border-line text-[10px] font-mono font-bold text-[#0d1f23]"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEÇÃO 2: CALENDÁRIO DE TRAVA DE DATAS (6 colunas) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-line shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <div>
                <h3 className="font-space font-bold text-lg text-[#0d1f23]">
                  Travar / Bloquear Datas Específicas
                </h3>
                <p className="text-xs text-[#5a636a]">Clique em qualquer dia para trancar ou liberar</p>
              </div>
              <Lock className="w-5 h-5 text-[#e8a33d]" />
            </div>

            {/* Navegação do Calendário */}
            <div className="flex items-center justify-between mb-4 bg-[#f7f6f2] p-2 rounded-2xl">
              <button
                onClick={() => shiftMonth(-1)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white text-sm font-bold transition"
              >
                ←
              </button>
              <span className="font-space font-bold text-sm text-[#0d1f23]">
                {monthNames[calRef.getMonth()]} {calRef.getFullYear()}
              </span>
              <button
                onClick={() => shiftMonth(1)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white text-sm font-bold transition"
              >
                →
              </button>
            </div>

            {/* Grid do Calendário */}
            <div className="grid grid-cols-7 gap-2 text-center max-w-[380px] mx-auto">
              {DOW.map((d, i) => (
                <div key={i} className="text-[11px] font-bold text-[#69818d] pb-1">
                  {d}
                </div>
              ))}

              {Array.from({ length: new Date(calRef.getFullYear(), calRef.getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="w-9 h-9" />
              ))}

              {Array.from({
                length: new Date(calRef.getFullYear(), calRef.getMonth() + 1, 0).getDate(),
              }).map((_, i) => {
                const dayNum = i + 1;
                const iso = `${calRef.getFullYear()}-${String(calRef.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const locked = isBlocked(iso);

                return (
                  <button
                    key={dayNum}
                    onClick={() => {
                      if (locked) {
                        handleToggleBlockDate(iso);
                      } else {
                        setSelectedDateToLock(iso);
                        setLockReason('Folga / Ausência');
                      }
                    }}
                    title={locked ? `Trancado: ${getBlockedReason(iso)} (Clique para liberar)` : `Clique para trancar dia ${dayNum}`}
                    className={`w-9 h-9 mx-auto rounded-2xl flex flex-col items-center justify-center text-xs font-bold transition-all relative ${
                      locked
                        ? 'bg-rose-600 text-white shadow-md scale-105 hover:bg-rose-700'
                        : 'hover:bg-[#f7f6f2] text-[#0d1f23] border border-line/40'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {locked && <Lock className="w-2.5 h-2.5 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Lista de Datas Trancadas no Mês */}
            <div className="mt-6 pt-4 border-t border-line">
              <h4 className="text-xs font-bold uppercase font-mono text-[#69818d] mb-2">
                Datas Trancadas Atualmente ({blockedDates.length})
              </h4>
              {blockedDates.length === 0 ? (
                <p className="text-xs text-[#5a636a]">Nenhuma data trancada manualmente.</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {blockedDates.map((b) => (
                    <div
                      key={b.id}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2"
                    >
                      <span>
                        {new Date(b.date + 'T00:00:00').toLocaleDateString('pt-BR')} ({b.reason || 'Trancado'})
                      </span>
                      <button
                        onClick={() => handleToggleBlockDate(b.date)}
                        title="Liberar data"
                        className="text-rose-600 hover:text-rose-900 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#f7f6f2] rounded-2xl text-[11px] text-[#5a636a] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#e8a33d] shrink-0" />
            <span>Datas trancadas não poderão ser selecionadas por nenhum paciente no portal público.</span>
          </div>
        </div>
      </div>

      {/* MODAL PARA CONFIRMAR BLOQUEIO DE DATA COM MOTIVO */}
      {selectedDateToLock && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedDateToLock(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>

            <h3 className="font-space font-bold text-lg text-[#0d1f23] mb-1">
              Trancar Dia {new Date(selectedDateToLock + 'T00:00:00').toLocaleDateString('pt-BR')}
            </h3>
            <p className="text-xs text-[#5a636a] mb-4">
              Informe o motivo da ausência para este dia.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder="Ex: Feriado, Curso, Viagem, Folga..."
                className="w-full bg-[#f7f6f2] border border-line rounded-2xl p-3 text-xs font-semibold outline-none focus:border-[#e8a33d]"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDateToLock(null)}
                  className="px-4 py-2 rounded-full border border-line text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  disabled={savingLock}
                  onClick={() => handleToggleBlockDate(selectedDateToLock, lockReason)}
                  className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow"
                >
                  {savingLock ? 'Trancando...' : 'Confirmar Trava'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA ADICIONAR / REMOVER HORÁRIOS DO DIA DA SEMANA */}
      {activeDayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveDayModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>

            <h3 className="font-space font-bold text-xl text-[#0d1f23] mb-1">
              Horários de {activeDayModal.day_name}
            </h3>
            <p className="text-xs text-[#5a636a] mb-6">
              Adicione ou remova os horários disponíveis para este dia.
            </p>

            {/* Adicionar novo horário */}
            <div className="flex gap-2 mb-6">
              <input
                type="time"
                value={newSlotTime}
                onChange={(e) => setNewSlotTime(e.target.value)}
                className="flex-1 bg-[#f7f6f2] border border-line rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
              />
              <button
                onClick={handleAddSlot}
                className="px-5 py-2.5 rounded-2xl bg-[#0d1f23] text-white text-xs font-bold hover:bg-[#132e35] transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4 text-[#e8a33d]" /> Adicionar
              </button>
            </div>

            {/* Lista de Chips de Horário com Botão Remover */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {activeDayModal.slots && activeDayModal.slots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {activeDayModal.slots.map((slot) => (
                    <div
                      key={slot}
                      className="p-2.5 rounded-xl bg-[#f7f6f2] border border-line flex items-center justify-between"
                    >
                      <span className="font-mono font-bold text-xs text-[#0d1f23]">{slot}</span>
                      <button
                        onClick={() => handleRemoveSlot(slot)}
                        title="Remover horário"
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center py-6 text-[#afb3b7]">Nenhum horário cadastrado.</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-line flex justify-end">
              <button
                onClick={() => setActiveDayModal(null)}
                className="px-6 py-2.5 rounded-full bg-[#0d1f23] text-white text-xs font-bold"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
