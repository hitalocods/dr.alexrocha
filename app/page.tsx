'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Service, ClinicSettings, BusinessDayHours } from '@/lib/types';
import { Lock } from 'lucide-react';

export default function BookingPage() {
  const [step, setStep] = useState<string | number>('hero');
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<ClinicSettings>({
    show_prices_publicly: false,
    clinic_name: 'Dr. Alex Rocha',
    clinic_phone: '5586988664485',
    clinic_address: 'Alleanza Clinic — Teresina-PI',
    default_slots: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
  });
  const [businessHours, setBusinessHours] = useState<BusinessDayHours[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [slotErrorMessage, setSlotErrorMessage] = useState<string | null>(null);

  // Modal Localização
  const [modalLocation, setModalLocation] = useState(false);

  // Form State
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Calendário
  const [calRef, setCalRef] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Carregar dados iniciais da API em tempo real sem cache
  const loadFreshData = useCallback(async () => {
    try {
      const timestamp = Date.now();
      const [resServices, resSettings, resSchedule] = await Promise.all([
        fetch(`/api/services?_t=${timestamp}`, { cache: 'no-store' }).then((r) => r.json()),
        fetch(`/api/settings?_t=${timestamp}`, { cache: 'no-store' }).then((r) => r.json()),
        fetch(`/api/schedule-settings?_t=${timestamp}`, { cache: 'no-store' }).then((r) => r.json()),
      ]);

      if (Array.isArray(resServices)) {
        setServices(resServices.filter((s) => s.is_active));
      }
      if (resSettings && !resSettings.error) {
        setSettings(resSettings);
      }
      if (resSchedule && resSchedule.businessHours) {
        setBusinessHours(resSchedule.businessHours);
        setBlockedDates(resSchedule.blockedDates || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do agendamento:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFreshData();
  }, [loadFreshData]);

  // Buscar slots ocupados em tempo real quando a data muda ou periodicamente
  const fetchBookedSlots = useCallback(async (date: string) => {
    try {
      const timestamp = Date.now();
      const res = await fetch(`/api/appointments?from=${date}&to=${date}&_t=${timestamp}`, {
        cache: 'no-store',
      }).then((r) => r.json());

      if (Array.isArray(res)) {
        const times = res
          .filter((a) => a.status !== 'cancelled')
          .map((a) => a.time);
        setBookedSlots(times);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    fetchBookedSlots(selectedDate);

    // Polling inteligente a cada 8 segundos caso outro paciente esteja agendando no mesmo momento
    const interval = setInterval(() => {
      fetchBookedSlots(selectedDate);
    }, 8000);

    return () => clearInterval(interval);
  }, [selectedDate, fetchBookedSlots]);

  const chosenService = services.find((s) => s.id === selectedService);

  // Navegação
  const goTo = (s: string | number) => {
    setSlotErrorMessage(null);
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Atualizar dados ao avançar de etapa
    if (s === 1 || s === 2) {
      loadFreshData();
      if (selectedDate) fetchBookedSlots(selectedDate);
    }
  };

  const getStepIndex = () => {
    if (step === 'hero') return -1;
    return typeof step === 'number' ? step : parseInt(step as string) || 0;
  };

  const stepIdx = getStepIndex();

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

  // Horários disponíveis para a data selecionada
  const getAvailableTimesForDate = () => {
    if (!selectedDate) return [];
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();

    const config = businessHours.find((b) => b.day_of_week === dayOfWeek);
    if (!config || !config.is_working) return [];

    return config.slots || settings.default_slots || [];
  };

  const isDateBlocked = (isoDate: string, dateObj: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateObj < today) return true; // Passado

    // Checar se a data específica está bloqueada
    if (blockedDates.includes(isoDate)) return true;

    // Checar se o dia da semana não atende
    const dow = dateObj.getDay();
    const config = businessHours.find((b) => b.day_of_week === dow);
    if (config && !config.is_working) return true;

    // Se domingo e não configurado
    if (!config && dow === 0) return true;

    return false;
  };

  // Enviar agendamento com validação atômica em tempo real
  const confirmBooking = async () => {
    if (!chosenService || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setSlotErrorMessage(null);

    try {
      // 1. Salvar no banco (com trava de concorrência)
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          client_phone: clientPhone,
          notes: clientNotes,
          service_id: chosenService.id,
          date: selectedDate,
          time: selectedTime,
          price_charged: chosenService.price,
          status: 'pending',
        }),
      });

      const resData = await res.json();

      if (res.status === 409) {
        // Horário acabou de ser ocupado por outro cliente
        setSlotErrorMessage('Este horário acabou de ser reservado por outro paciente. Por favor, selecione outro horário.');
        await fetchBookedSlots(selectedDate);
        setStep(2); // Retorna para a etapa de horário
        return;
      }

      if (!res.ok) {
        throw new Error(resData.error || 'Erro ao realizar agendamento.');
      }

      // 2. Montar mensagem WhatsApp
      const d = new Date(selectedDate + 'T00:00:00');
      const dateLabel = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

      const priceText = settings.show_prices_publicly
        ? `\nValor: R$ ${chosenService.price.toFixed(2).replace('.', ',')}`
        : '';

      const msg = `Olá, Dr. Alex! Quero agendar:%0A%0A` +
        `Serviço: ${chosenService.name}%0A` +
        `Dia: ${dateLabel}%0A` +
        `Horário: ${selectedTime}%0A` +
        `Nome: ${clientName}%0A` +
        `WhatsApp: ${clientPhone}%0A` +
        (clientNotes ? `Obs: ${clientNotes}%0A` : '') +
        (priceText ? `${priceText}%0A` : '') +
        `%0AAguardo a confirmação, obrigado(a)!`;

      const phone = (settings.clinic_phone || '5586988664485').replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');

      setStep('done');
    } catch (e: any) {
      console.error('Erro ao salvar agendamento:', e);
      alert(e.message || 'Erro ao enviar agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setClientName('');
    setClientPhone('');
    setClientNotes('');
    setSlotErrorMessage(null);
    setStep('hero');
    loadFreshData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f2f0ea] text-[#0d1f23] flex flex-col justify-between">
      {/* Barra de Progresso Superior */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#f2f0ea] via-[#f2f0ea] to-transparent pt-4 pb-2">
        <div className="flex gap-1.5 justify-center max-w-[340px] mx-auto px-4">
          {[0, 1, 2, 3, 4].map((i) => {
            const isDone = i < stepIdx;
            const isActive = i === stepIdx;
            const rotate = i === 0 ? '-10deg' : i === 1 ? '7deg' : i === 2 ? '-6deg' : i === 3 ? '5deg' : '-3deg';
            return (
              <div
                key={i}
                style={{
                  transform: isDone || isActive ? 'rotate(0deg)' : `rotate(${rotate})`,
                  backgroundColor: isDone || isActive ? '#e8a33d' : '#2d4a53',
                }}
                className="flex-1 h-[9px] rounded-full transition-all duration-500 ease-out"
              />
            );
          })}
        </div>
        <div className="flex justify-between max-w-[640px] mx-auto mt-2 px-6 text-[10.5px] uppercase font-bold tracking-wider text-[#5a636a]">
          {['Serviço', 'Dia', 'Horário', 'Seus dados', 'Confirmar'].map((label, idx) => (
            <span
              key={label}
              className={`transition-opacity duration-300 ${stepIdx === idx ? 'opacity-100 text-[#0d1f23]' : 'opacity-40'}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Cabeçalho */}
      <header className="text-center pt-6 pb-2 px-6">
        <div className="font-space font-bold text-2xl md:text-3xl text-[#0d1f23]">
          Dr. Alex Rocha<span className="text-[#e8a33d]">.</span>
        </div>
        <div className="mt-1 text-[11.5px] tracking-[0.18em] uppercase text-[#5a636a] font-semibold">
          Quiropraxia · Osteopatia · Alleanza Clinic
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-[640px] w-full mx-auto px-6 py-6 flex-1">
        {loading ? (
          <div className="text-center py-20 animate-pulse text-[#5a636a]">
            <div className="w-8 h-8 border-3 border-[#e8a33d] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Carregando agenda e serviços...
          </div>
        ) : (
          <>
            {/* Mensagem de Alerta de Conflito de Horário */}
            {slotErrorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold text-center animate-fade">
                ⚠️ {slotErrorMessage}
              </div>
            )}

            {/* ETAPA HERO */}
            {step === 'hero' && (
              <section className="animate-fade text-center py-6">
                <h1 className="font-space font-bold text-3xl sm:text-4xl md:text-5xl leading-tight text-[#0d1f23]">
                  Alinhe sua <em className="not-italic text-[#e8a33d]">agenda</em>,<br />
                  alinhe seu corpo.
                </h1>
                <p className="mt-4 max-w-[420px] mx-auto text-[#5a636a] text-base leading-relaxed">
                  Agende sua avaliação ou sessão em poucos toques — sem espera e direto pelo WhatsApp.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={() => goTo(0)}
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#0d1f23] text-[#f2f0ea] font-bold text-sm hover:bg-[#132e35] transition-all transform hover:-translate-y-0.5 shadow-premium cursor-pointer"
                  >
                    Agendar meu horário
                  </button>
                </div>

                <div className="mt-4 flex gap-2 justify-center">
                  <button
                    onClick={() => setModalLocation(true)}
                    className="px-5 py-2.5 rounded-full border border-line text-xs font-semibold text-[#0d1f23] hover:bg-black/5 transition cursor-pointer"
                  >
                    Como chegar
                  </button>
                </div>
              </section>
            )}

            {/* ETAPA 0: ESCOLHA DO SERVIÇO */}
            {step === 0 && (
              <section className="animate-fade">
                <span className="block text-center font-mono text-xs uppercase font-bold text-[#69818d] tracking-widest mb-1">
                  Etapa 1
                </span>
                <h2 className="font-space font-bold text-2xl text-center text-[#0d1f23]">
                  Qual cuidado hoje?
                </h2>
                <p className="text-center text-sm text-[#5a636a] mb-6">
                  Selecione o procedimento desejado
                </p>

                <div className="space-y-3">
                  {services.map((svc) => {
                    const isSelected = selectedService === svc.id;
                    const priceLabel = settings.show_prices_publicly
                      ? `R$ ${svc.price.toFixed(2).replace('.', ',')}`
                      : 'Consulte';

                    return (
                      <div
                        key={svc.id}
                        onClick={() => setSelectedService(svc.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                          isSelected
                            ? 'bg-[#0d1f23] text-[#fffdf9] border-transparent shadow-premium scale-[1.01]'
                            : 'bg-[#fffdf9] border-line hover:border-[#e8a33d]/60 text-[#0d1f23]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-[#e8a33d] bg-[#e8a33d]' : 'border-line'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#0d1f23]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-base ${isSelected ? 'text-[#fffdf9]' : 'text-[#0d1f23]'}`}>
                            {svc.name}
                          </div>
                          <div className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-[#afb3b7]' : 'text-[#5a636a]'}`}>
                            {svc.description}
                          </div>
                          <div className={`text-xs font-bold mt-2.5 ${isSelected ? 'text-[#e8a33d]' : 'text-[#69818d]'}`}>
                            {svc.duration} · {priceLabel}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-center gap-3">
                  <button
                    onClick={() => goTo('hero')}
                    className="px-6 py-3.5 rounded-full border border-line font-bold text-sm hover:bg-black/5 transition cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={!selectedService}
                    onClick={() => goTo(1)}
                    className="px-8 py-3.5 rounded-full bg-[#0d1f23] text-[#f2f0ea] font-bold text-sm disabled:opacity-40 disabled:pointer-events-none hover:bg-[#132e35] transition shadow-premium cursor-pointer"
                  >
                    Continuar
                  </button>
                </div>
              </section>
            )}

            {/* ETAPA 1: ESCOLHA DA DATA */}
            {step === 1 && (
              <section className="animate-fade">
                <span className="block text-center font-mono text-xs uppercase font-bold text-[#69818d] tracking-widest mb-1">
                  Etapa 2
                </span>
                <h2 className="font-space font-bold text-2xl text-center text-[#0d1f23]">
                  Escolha o dia
                </h2>
                <p className="text-center text-sm text-[#5a636a] mb-6">
                  Atendimento conforme disponibilidade
                </p>

                {/* Navegação de Mês */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => shiftMonth(-1)}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white text-lg transition cursor-pointer"
                  >
                    ←
                  </button>
                  <div className="font-space font-bold text-lg min-w-[160px] text-center">
                    {monthNames[calRef.getMonth()]} {calRef.getFullYear()}
                  </div>
                  <button
                    onClick={() => shiftMonth(1)}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white text-lg transition cursor-pointer"
                  >
                    →
                  </button>
                </div>

                {/* Grid do Calendário */}
                <div className="grid grid-cols-7 gap-1.5 max-w-[380px] mx-auto text-center">
                  {DOW.map((d, i) => (
                    <div key={i} className="text-[11px] font-bold text-[#5a636a] pb-2">
                      {d}
                    </div>
                  ))}

                  {/* Dias vazios antes do dia 1 */}
                  {Array.from({ length: new Date(calRef.getFullYear(), calRef.getMonth(), 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-10 h-10" />
                  ))}

                  {/* Dias do mês */}
                  {Array.from({
                    length: new Date(calRef.getFullYear(), calRef.getMonth() + 1, 0).getDate(),
                  }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateObj = new Date(calRef.getFullYear(), calRef.getMonth(), dayNum);
                    const iso = `${calRef.getFullYear()}-${String(calRef.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isBlocked = isDateBlocked(iso, dateObj);
                    const isSelected = selectedDate === iso;

                    return (
                      <button
                        key={dayNum}
                        disabled={isBlocked}
                        onClick={() => {
                          setSelectedDate(iso);
                          setSelectedTime(null);
                        }}
                        className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0d1f23] text-[#e8a33d] shadow-premium scale-105'
                            : isBlocked
                            ? 'opacity-25 line-through text-[#5a636a] cursor-not-allowed'
                            : 'hover:border-[#e8a33d] border border-transparent text-[#0d1f23]'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-center gap-3">
                  <button
                    onClick={() => goTo(0)}
                    className="px-6 py-3.5 rounded-full border border-line font-bold text-sm hover:bg-black/5 transition cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={!selectedDate}
                    onClick={() => goTo(2)}
                    className="px-8 py-3.5 rounded-full bg-[#0d1f23] text-[#f2f0ea] font-bold text-sm disabled:opacity-40 disabled:pointer-events-none hover:bg-[#132e35] transition shadow-premium cursor-pointer"
                  >
                    Continuar
                  </button>
                </div>
              </section>
            )}

            {/* ETAPA 2: ESCOLHA DO HORÁRIO */}
            {step === 2 && (
              <section className="animate-fade">
                <span className="block text-center font-mono text-xs uppercase font-bold text-[#69818d] tracking-widest mb-1">
                  Etapa 3
                </span>
                <h2 className="font-space font-bold text-2xl text-center text-[#0d1f23]">
                  Escolha o horário
                </h2>
                <p className="text-center text-sm text-[#5a636a] mb-6">
                  {selectedDate &&
                    new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                    })}
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-w-[420px] mx-auto">
                  {getAvailableTimesForDate().map((t) => {
                    const isOccupied = bookedSlots.includes(t);
                    const isSelected = selectedTime === t;

                    return (
                      <button
                        key={t}
                        disabled={isOccupied}
                        onClick={() => setSelectedTime(t)}
                        className={`py-3 px-2 rounded-2xl font-bold text-sm border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0d1f23] text-[#e8a33d] border-transparent shadow-premium scale-105'
                            : isOccupied
                            ? 'opacity-30 line-through bg-transparent border-line cursor-not-allowed'
                            : 'bg-white border-line hover:border-[#e8a33d] text-[#0d1f23]'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-center gap-3">
                  <button
                    onClick={() => goTo(1)}
                    className="px-6 py-3.5 rounded-full border border-line font-bold text-sm hover:bg-black/5 transition cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={!selectedTime}
                    onClick={() => goTo(3)}
                    className="px-8 py-3.5 rounded-full bg-[#0d1f23] text-[#f2f0ea] font-bold text-sm disabled:opacity-40 disabled:pointer-events-none hover:bg-[#132e35] transition shadow-premium cursor-pointer"
                  >
                    Continuar
                  </button>
                </div>
              </section>
            )}

            {/* ETAPA 3: DADOS DO CLIENTE */}
            {step === 3 && (
              <section className="animate-fade max-w-[460px] mx-auto">
                <span className="block text-center font-mono text-xs uppercase font-bold text-[#69818d] tracking-widest mb-1">
                  Etapa 4
                </span>
                <h2 className="font-space font-bold text-2xl text-center text-[#0d1f23]">
                  Seus dados
                </h2>
                <p className="text-center text-sm text-[#5a636a] mb-6">
                  Para confirmarmos seu agendamento
                </p>

                <div className="space-y-3.5">
                  <div className="bg-white rounded-2xl p-3 px-4 border border-line focus-within:border-[#e8a33d] transition">
                    <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] tracking-wider mb-1">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Como podemos te chamar?"
                      className="w-full bg-transparent outline-none text-[#0d1f23] text-sm font-medium"
                    />
                  </div>

                  <div className="bg-white rounded-2xl p-3 px-4 border border-line focus-within:border-[#e8a33d] transition">
                    <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] tracking-wider mb-1">
                      WhatsApp com DDD
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(86) 9 9999-9999"
                      className="w-full bg-transparent outline-none text-[#0d1f23] text-sm font-medium"
                    />
                  </div>

                  <div className="bg-white rounded-2xl p-3 px-4 border border-line focus-within:border-[#e8a33d] transition">
                    <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] tracking-wider mb-1">
                      Observações / Queixa principal (opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Motivo da consulta, dores, histórico..."
                      className="w-full bg-transparent outline-none text-[#0d1f23] text-sm font-medium resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-center gap-3">
                  <button
                    onClick={() => goTo(2)}
                    className="px-6 py-3.5 rounded-full border border-line font-bold text-sm hover:bg-black/5 transition cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={clientName.trim().length < 2 || clientPhone.trim().length < 8}
                    onClick={() => goTo(4)}
                    className="px-8 py-3.5 rounded-full bg-[#0d1f23] text-[#f2f0ea] font-bold text-sm disabled:opacity-40 disabled:pointer-events-none hover:bg-[#132e35] transition shadow-premium cursor-pointer"
                  >
                    Revisar agendamento
                  </button>
                </div>
              </section>
            )}

            {/* ETAPA 4: REVISÃO & CONFIRMAÇÃO */}
            {step === 4 && (
              <section className="animate-fade max-w-[460px] mx-auto">
                <span className="block text-center font-mono text-xs uppercase font-bold text-[#69818d] tracking-widest mb-1">
                  Etapa 5
                </span>
                <h2 className="font-space font-bold text-2xl text-center text-[#0d1f23]">
                  Confira e confirme
                </h2>
                <p className="text-center text-sm text-[#5a636a] mb-6">
                  Você concluirá pelo WhatsApp do Dr. Alex
                </p>

                <div className="bg-white rounded-3xl p-6 border border-line shadow-premium space-y-3">
                  <div className="flex justify-between py-2 border-b border-dashed border-line text-sm">
                    <span className="text-[#5a636a] font-medium">Serviço</span>
                    <span className="font-bold text-right">{chosenService?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-line text-sm">
                    <span className="text-[#5a636a] font-medium">Dia</span>
                    <span className="font-bold text-right">
                      {selectedDate &&
                        new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                        })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-line text-sm">
                    <span className="text-[#5a636a] font-medium">Horário</span>
                    <span className="font-bold text-right">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-line text-sm">
                    <span className="text-[#5a636a] font-medium">Nome</span>
                    <span className="font-bold text-right">{clientName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-line text-sm">
                    <span className="text-[#5a636a] font-medium">WhatsApp</span>
                    <span className="font-bold text-right">{clientPhone}</span>
                  </div>
                  {clientNotes && (
                    <div className="flex justify-between py-2 border-b border-dashed border-line text-sm">
                      <span className="text-[#5a636a] font-medium">Observações</span>
                      <span className="font-medium text-right text-xs max-w-[200px]">{clientNotes}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-[#e8a33d] flex justify-between items-baseline font-space">
                    <span className="font-bold text-sm">Duração</span>
                    <span className="font-bold text-base text-[#69818d]">{chosenService?.duration}</span>
                  </div>

                  {settings.show_prices_publicly && chosenService && (
                    <div className="flex justify-between items-baseline font-space">
                      <span className="font-bold text-sm">Valor</span>
                      <span className="font-bold text-lg text-[#0d1f23]">
                        R$ {chosenService.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-center gap-3">
                  <button
                    onClick={() => goTo(3)}
                    className="px-6 py-3.5 rounded-full border border-line font-bold text-sm hover:bg-black/5 transition cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={submitting}
                    onClick={confirmBooking}
                    className="px-8 py-3.5 rounded-full bg-[#0d1f23] text-[#f2f0ea] font-bold text-sm hover:bg-[#132e35] transition shadow-premium flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? 'Salvando...' : 'Confirmar pelo WhatsApp'}
                  </button>
                </div>
              </section>
            )}

            {/* ETAPA CONCLUÍDO */}
            {step === 'done' && (
              <section className="animate-fade text-center py-10 max-w-[420px] mx-auto">
                <div className="w-20 h-20 rounded-full bg-[#0d1f23] flex items-center justify-center mx-auto mb-6 shadow-premium">
                  <svg className="w-9 h-9 text-[#e8a33d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-space font-bold text-2xl text-[#0d1f23]">Quase lá!</h2>
                <p className="text-sm text-[#5a636a] mt-2 mb-8 leading-relaxed">
                  Sua solicitação foi registrada no sistema e aberta no WhatsApp. É só enviar a mensagem para confirmar diretamente com o Dr. Alex Rocha.
                </p>
                <button
                  onClick={resetFlow}
                  className="px-6 py-3.5 rounded-full border border-line font-bold text-sm hover:bg-black/5 transition cursor-pointer"
                >
                  Fazer novo agendamento
                </button>
              </section>
            )}
          </>
        )}
      </main>

      {/* Rodapé */}
      <footer className="text-center py-8 px-6 text-xs text-[#5a636a] border-t border-line/40">
        <div>
          Dr. Alex Rocha · Quiropraxia &amp; Osteopatia · Alleanza Clinic · Teresina-PI
        </div>
        <div className="mt-1">
          <a href="https://www.instagram.com/alleanzaclinic/" target="_blank" rel="noreferrer" className="font-bold text-[#69818d] hover:underline">
            @alleanzaclinic
          </a>{' '}
          · (86) 9 8866-4485
        </div>
        <div className="mt-4 text-[11px] opacity-70 flex items-center justify-center gap-4">
          <span>Desenvolvido por Atlas Software</span>
          <span>·</span>
          <Link href="/admin" className="text-[#0d1f23] font-semibold hover:text-[#e8a33d] flex items-center gap-1">
            <Lock className="w-3 h-3" /> Painel Admin
          </Link>
        </div>
      </footer>

      {/* Modal Localização */}
      {modalLocation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
          <div className="bg-[#fffdf9] max-w-md w-full rounded-3xl p-6 shadow-premium relative">
            <button
              onClick={() => setModalLocation(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
            <span className="font-mono text-xs uppercase font-bold text-[#69818d]">Como chegar</span>
            <h3 className="font-space font-bold text-xl text-[#0d1f23] mt-1 mb-2">Alleanza Clinic</h3>
            <p className="text-sm text-[#5a636a] leading-relaxed mb-4">
              Atendimento especializado em Teresina-PI. Confira o endereço e trace sua rota até o consultório.
            </p>
            <div className="font-mono text-xs bg-[#f2f0ea] p-3.5 rounded-xl text-[#0d1f23] mb-4">
              {settings.clinic_address}
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Alleanza+Clinic+Teresina+PI"
              target="_blank"
              rel="noreferrer"
              className="inline-block px-5 py-3 rounded-full bg-[#0d1f23] text-white text-xs font-bold hover:bg-[#132e35] transition"
            >
              Abrir no Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
