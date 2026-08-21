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

    const { holderName, number, expiryMonth, expiryYear, ccv } = await request.json();

    if (!holderName || !number || !expiryMonth || !expiryYear || !ccv) {
      return NextResponse.json({ error: 'Todos os campos do cartão são obrigatórios' }, { status: 400 });
    }

    const license = await db.getLicense();

    // 1. Criar/Obter cliente
    const customer = await asaasService.getOrCreateCustomer(
      holderName,
      'admin@dralexrocha.com.br',
      '86988664485'
    );

    // 2. Criar assinatura de cartão no Asaas
    const subscription = await asaasService.createCardSubscription(
      customer.id,
      license.monthly_price,
      license.next_due_date,
      {
        holderName,
        number: number.replace(/\D/g, ''),
        expiryMonth,
        expiryYear,
        ccv,
      }
    );

    // 3. Atualizar licença
    await db.updateLicense({
      status: 'active',
      asaas_customer_id: customer.id,
      asaas_subscription_id: subscription?.id || `sub_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Assinatura recorrente configurada com sucesso no cartão de crédito!',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
