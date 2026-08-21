import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { asaasService } from '@/lib/asaas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { type } = await request.json().catch(() => ({ type: 'monthly' }));
    const license = await db.getLicense();

    const amount = type === 'setup' ? license.setup_price : license.monthly_price;
    const desc = type === 'setup'
      ? 'Taxa de Implantação e Configuração - Atlas Software'
      : 'Mensalidade Sistema de Gestão Dr. Alex Rocha - Atlas Software';

    // 1. Criar/Obter cliente no Asaas de forma segura
    const customer = await asaasService.getOrCreateCustomer(
      'Dr. Alex Rocha',
      'admin@dralexrocha.com.br',
      '86988664485'
    );

    const customerId = customer?.id || 'cus_dralex_atlas';

    // 2. Gerar cobrança PIX no Asaas
    const pixData = await asaasService.createPixPayment(
      customerId,
      amount,
      desc,
      license.next_due_date || new Date().toISOString().slice(0, 10)
    );

    // Salvar ID do pagamento na licença
    await db.updateLicense({
      asaas_customer_id: customerId,
      asaas_payment_id: pixData.paymentId,
    });

    return NextResponse.json({
      success: true,
      amount,
      description: desc,
      qrCodeBase64: pixData.encodedImage,
      pixCopiaECola: pixData.payload,
      paymentId: pixData.paymentId,
      dueDate: license.next_due_date,
    });
  } catch (error: any) {
    console.error('Erro na rota POST /api/subscription/pix:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar PIX' }, { status: 500 });
  }
}
