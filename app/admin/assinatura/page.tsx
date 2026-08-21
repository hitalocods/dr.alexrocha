'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Sparkles,
  Server,
  Headphones,
  Lock,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';
import { SoftwareLicense } from '@/lib/db';

export default function AssinaturaPage() {
  const [license, setLicense] = useState<SoftwareLicense | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal / Seção de Pagamento
  const [paymentType, setPaymentType] = useState<'monthly' | 'setup'>('monthly');
  const [paymentMethodTab, setPaymentMethodTab] = useState<'pix' | 'card'>('pix');
  const [pixData, setPixData] = useState<{
    amount: number;
    description: string;
    qrCodeBase64: string | null;
    pixCopiaECola: string;
    dueDate: string;
  } | null>(null);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form Cartão
  const [cardHolder, setCardHolder] = useState('Dr. Alex Rocha');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardCcv, setCardCcv] = useState('');
  const [submittingCard, setSubmittingCard] = useState(false);
  const [cardSuccess, setCardSuccess] = useState(false);
  const [cardError, setCardError] = useState('');

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

  const handleGeneratePix = async (type: 'monthly' | 'setup') => {
    setPaymentType(type);
    setGeneratingPix(true);
    setPixData(null);
    setCopied(false);

    try {
      const res = await fetch('/api/subscription/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        setPixData(data);
      } else {
        alert(data.error || 'Erro ao gerar PIX');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingPix(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixData?.pixCopiaECola) return;
    navigator.clipboard.writeText(pixData.pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCard(true);
    setCardError('');
    setCardSuccess(false);

    try {
      const res = await fetch('/api/subscription/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holderName: cardHolder,
          number: cardNumber,
          expiryMonth: cardExpMonth,
          expiryYear: cardExpYear,
          ccv: cardCcv,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCardSuccess(true);
        loadLicense();
      } else {
        setCardError(data.error || 'Falha ao processar cartão de crédito.');
      }
    } catch (err: any) {
      setCardError(err.message || 'Erro ao cadastrar cartão.');
    } finally {
      setSubmittingCard(false);
    }
  };

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
            Status da hospedagem na nuvem, banco de dados e manutenção contínua.
          </p>
        </div>

        {license && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                license.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {license.status === 'active' ? 'Licença Ativa & Regular' : 'Aguardando Pagamento'}
            </span>
          </div>
        )}
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
                  <span>Plano Clínico Dr. Alex Rocha</span>
                </div>

                <h2 className="font-space font-bold text-2xl sm:text-3xl text-white">
                  Manutenção, Cloud &amp; Suporte Contínuo
                </h2>

                <p className="text-xs sm:text-sm text-[#afb3b7] leading-relaxed max-w-xl">
                  Garante o funcionamento 24h por dia do portal de agendamentos, banco de dados Neon PostgreSQL na nuvem, atualizações de segurança e suporte técnico especializado da Atlas Software.
                </p>

                {/* Vantagens Inclusas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-[#afb3b7]">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#e8a33d]" />
                    <span>Hospedagem &amp; Banco na Nuvem</span>
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

              {/* Box de Valor e Vencimento */}
              <div className="lg:col-span-5 bg-[#132e35] border border-white/10 rounded-3xl p-6 text-center space-y-4">
                <span className="text-[11px] font-mono uppercase font-bold text-[#afb3b7] tracking-wider block">
                  Valor da Mensalidade
                </span>

                <div className="font-space font-bold text-4xl text-[#e8a33d]">
                  {formatBRL(license?.monthly_price || 50)}
                  <span className="text-xs text-[#afb3b7] font-normal"> / mês</span>
                </div>

                <div className="bg-[#0d1f23] p-3 rounded-2xl text-xs space-y-1">
                  <div className="text-[#afb3b7]">Próximo Vencimento:</div>
                  <div className="font-space font-bold text-sm text-white">
                    {license?.next_due_date &&
                      new Date(license.next_due_date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                  </div>
                </div>

                <button
                  onClick={() => handleGeneratePix('monthly')}
                  className="w-full py-3.5 rounded-2xl bg-[#e8a33d] hover:bg-[#d4902b] text-[#0d1f23] font-bold text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  Pagar Mensalidade via PIX
                </button>
              </div>
            </div>
          </div>

          {/* SEÇÃO DE PAGAMENTO & RECORRÊNCIA */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-line shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
              <div>
                <h3 className="font-space font-bold text-xl text-[#0d1f23]">
                  Formas de Pagamento da Licença
                </h3>
                <p className="text-xs text-[#5a636a] mt-0.5">
                  Pague no PIX com baixa automática instantânea ou cadastre no débito mensal do cartão.
                </p>
              </div>

              {/* Abas PIX vs Cartão */}
              <div className="flex items-center gap-2 bg-[#f7f6f2] p-1.5 rounded-2xl border border-line">
                <button
                  onClick={() => setPaymentMethodTab('pix')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    paymentMethodTab === 'pix'
                      ? 'bg-[#0d1f23] text-white shadow'
                      : 'text-[#5a636a] hover:text-[#0d1f23]'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  PIX Instantâneo
                </button>
                <button
                  onClick={() => setPaymentMethodTab('card')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    paymentMethodTab === 'card'
                      ? 'bg-[#0d1f23] text-white shadow'
                      : 'text-[#5a636a] hover:text-[#0d1f23]'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Cartão Recorrente
                </button>
              </div>
            </div>

            {/* ABA PIX */}
            {paymentMethodTab === 'pix' && (
              <div className="space-y-6 animate-fade">
                {/* Botões de Ação para Gerar PIX */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleGeneratePix('monthly')}
                    disabled={generatingPix}
                    className="px-5 py-3 rounded-2xl bg-[#0d1f23] text-white font-bold text-xs hover:bg-[#132e35] transition shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <QrCode className="w-4 h-4 text-[#e8a33d]" />
                    Gerar PIX Mensalidade ({formatBRL(license?.monthly_price || 50)})
                  </button>

                  <button
                    onClick={() => handleGeneratePix('setup')}
                    disabled={generatingPix}
                    className="px-5 py-3 rounded-2xl bg-[#f7f6f2] hover:bg-gray-200 border border-line text-[#0d1f23] font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 text-[#e8a33d]" />
                    Gerar PIX Taxa de Implantação ({formatBRL(license?.setup_price || 100)})
                  </button>
                </div>

                {/* Exibição do QR Code Gerado */}
                {generatingPix && (
                  <div className="py-12 text-center text-[#5a636a]">
                    <div className="w-8 h-8 border-3 border-[#e8a33d] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Gerando chave PIX com confirmação automática...
                  </div>
                )}

                {pixData && (
                  <div className="bg-[#f7f6f2] rounded-3xl p-6 border border-[#e8a33d]/40 shadow-card animate-fade max-w-lg mx-auto text-center space-y-4">
                    <span className="text-[11px] font-mono font-bold uppercase text-[#e8a33d] bg-[#0d1f23] px-3 py-1 rounded-full inline-block">
                      PIX com Baixa Automática
                    </span>

                    <h4 className="font-space font-bold text-lg text-[#0d1f23]">
                      {pixData.description}
                    </h4>

                    <div className="font-space font-bold text-3xl text-[#0d1f23]">
                      {formatBRL(pixData.amount)}
                    </div>

                    {/* QR Code Imagem */}
                    {pixData.qrCodeBase64 ? (
                      <div className="bg-white p-4 rounded-2xl inline-block shadow-md mx-auto">
                        <img
                          src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                          alt="QR Code PIX"
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="bg-white p-6 rounded-2xl max-w-xs mx-auto border border-line text-xs font-mono text-[#5a636a] space-y-2">
                        <QrCode className="w-12 h-12 text-[#0d1f23] mx-auto opacity-70" />
                        <p className="font-sans font-bold text-xs text-[#0d1f23]">
                          Escaneie no aplicativo do seu banco ou use o Copia e Cola abaixo
                        </p>
                      </div>
                    )}

                    {/* Código Copia e Cola */}
                    <div className="space-y-2 text-left">
                      <label className="block text-[10px] font-mono uppercase font-bold text-[#69818d]">
                        Código PIX Copia e Cola
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={pixData.pixCopiaECola}
                          className="flex-1 bg-white border border-line rounded-xl px-3 py-2 text-xs font-mono text-[#0d1f23] outline-none select-all truncate"
                        />
                        <button
                          onClick={handleCopyPix}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            copied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#0d1f23] text-white hover:bg-[#132e35]'
                          }`}
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copiar
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-800 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Assim que você pagar no app do banco, o sistema reconhece e renova sozinho!</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ABA CARTÃO */}
            {paymentMethodTab === 'card' && (
              <div className="max-w-md mx-auto space-y-4 animate-fade">
                <div className="bg-[#f7f6f2] p-4 rounded-2xl text-xs text-[#5a636a] leading-relaxed">
                  💳 <strong>Débito Automático Mensal:</strong> Cadastre seu cartão uma única vez. A mensalidade de <strong>{formatBRL(license?.monthly_price || 50)}</strong> será debitada automaticamente todo dia 10 e o recibo enviado por e-mail.
                </div>

                {cardSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Cartão cadastrado com sucesso! A assinatura recorrente está ativa.
                  </div>
                )}

                {cardError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                    {cardError}
                  </div>
                )}

                <form onSubmit={handleSaveCard} className="space-y-3">
                  <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                    <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                      Nome impresso no Cartão
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Nome do titular"
                      className="w-full bg-transparent text-xs font-semibold outline-none text-[#0d1f23]"
                    />
                  </div>

                  <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                    <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                      Número do Cartão
                    </label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="0000 0000 0000 0000"
                      className="w-full bg-transparent text-xs font-semibold outline-none text-[#0d1f23]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                      <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                        Mês (MM)
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        required
                        value={cardExpMonth}
                        onChange={(e) => setCardExpMonth(e.target.value)}
                        placeholder="12"
                        className="w-full bg-transparent text-xs font-semibold outline-none text-[#0d1f23]"
                      />
                    </div>

                    <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                      <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                        Ano (AAAA)
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        value={cardExpYear}
                        onChange={(e) => setCardExpYear(e.target.value)}
                        placeholder="2028"
                        className="w-full bg-transparent text-xs font-semibold outline-none text-[#0d1f23]"
                      />
                    </div>

                    <div className="bg-[#f7f6f2] rounded-2xl p-3 px-4 border border-line">
                      <label className="block text-[10px] uppercase font-mono font-bold text-[#69818d] mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={cardCcv}
                        onChange={(e) => setCardCcv(e.target.value)}
                        placeholder="123"
                        className="w-full bg-transparent text-xs font-semibold outline-none text-[#0d1f23]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingCard}
                    className="w-full py-3.5 rounded-2xl bg-[#0d1f23] hover:bg-[#132e35] text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4 text-[#e8a33d]" />
                    {submittingCard ? 'Cadastrando Cartão...' : 'Ativar Assinatura Recorrente'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
