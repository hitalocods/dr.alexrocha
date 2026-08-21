'use client';

import { useState, useEffect } from 'react';
import {
  Phone,
  Building,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { ClinicSettings } from '@/lib/types';

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<ClinicSettings>({
    show_prices_publicly: false,
    clinic_name: 'Dr. Alex Rocha',
    clinic_phone: '5586988664485',
    clinic_address: 'Alleanza Clinic — Teresina-PI',
    default_slots: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings').then((r) => r.json());
      if (res && !res.error) {
        setSettings(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-space font-bold text-2xl lg:text-3xl text-[#0d1f23]">
          Configurações da Clínica
        </h1>
        <p className="text-xs sm:text-sm text-[#5a636a] mt-1">
          Ajuste as preferências de atendimento, visibilidade de preços e informações de contato.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Configurações atualizadas com sucesso!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Bloco: Preferências do Agendamento */}
        <div className="bg-white rounded-3xl p-6 border border-line shadow-card space-y-5">
          <h3 className="font-space font-bold text-lg text-[#0d1f23] pb-3 border-b border-line">
            Preferências de Agendamento
          </h3>

          {/* Toggle de Preços */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#f7f6f2]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#e8a33d]/15 text-[#e8a33d] flex items-center justify-center shrink-0">
                {settings.show_prices_publicly ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="font-space font-bold text-sm text-[#0d1f23] block">
                  Exibir Preços dos Serviços aos Pacientes
                </span>
                <span className="text-xs text-[#5a636a]">
                  Se desmarcado, a página pública mostra &quot;Consulte&quot; em vez dos valores em R$.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSettings({
                  ...settings,
                  show_prices_publicly: !settings.show_prices_publicly,
                })
              }
              className={`px-4 py-2 rounded-full font-bold text-xs transition cursor-pointer ${
                settings.show_prices_publicly
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-300 text-[#0d1f23]'
              }`}
            >
              {settings.show_prices_publicly ? 'Preços Visíveis' : 'Preços Ocultos'}
            </button>
          </div>

          {/* WhatsApp da Clínica */}
          <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
            <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
              WhatsApp da Clínica (com código do país e DDD)
            </label>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#69818d]" />
              <input
                type="text"
                required
                value={settings.clinic_phone}
                onChange={(e) => setSettings({ ...settings, clinic_phone: e.target.value })}
                placeholder="Ex: 5586988664485"
                className="w-full bg-transparent text-sm font-semibold outline-none text-[#0d1f23]"
              />
            </div>
            <span className="text-[10px] text-[#5a636a] mt-1 block">
              Número para onde as mensagens automáticas de confirmação de agendamento serão enviadas.
            </span>
          </div>

          {/* Endereço / Localização */}
          <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
            <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
              Endereço da Clínica
            </label>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#69818d]" />
              <input
                type="text"
                required
                value={settings.clinic_address}
                onChange={(e) => setSettings({ ...settings, clinic_address: e.target.value })}
                placeholder="Ex: Alleanza Clinic — Teresina-PI"
                className="w-full bg-transparent text-sm font-semibold outline-none text-[#0d1f23]"
              />
            </div>
          </div>
        </div>

        {/* Botão de Salvar Alterações */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-full bg-[#0d1f23] text-white font-bold text-xs hover:bg-[#132e35] transition shadow-premium flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#e8a33d]" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
