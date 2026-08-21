import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { FinancialSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rangeType = (searchParams.get('type') || 'month') as 'today' | 'week' | 'month' | 'custom';
    let from = searchParams.get('from');
    let to = searchParams.get('to');

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (rangeType === 'today') {
      from = todayStr;
      to = todayStr;
    } else if (rangeType === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diff));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      from = startOfWeek.toISOString().slice(0, 10);
      to = endOfWeek.toISOString().slice(0, 10);
    } else if (rangeType === 'month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      from = `${year}-${month}-01`;
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    }

    if (!from || !to) {
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      to = todayStr;
    }

    const [appointments, expenses, services] = await Promise.all([
      db.getAppointments({ from, to }),
      db.getExpenses({ from, to }),
      db.getServices(),
    ]);

    let grossRevenue = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;
    let completedAppointments = 0;
    let cancelledAppointments = 0;

    appointments.forEach((a) => {
      const price = Number(a.price_charged) || 0;
      if (a.status !== 'cancelled') {
        grossRevenue += price;
        if (a.is_paid || a.status === 'completed') {
          paidRevenue += price;
        } else {
          pendingRevenue += price;
        }
      }
      if (a.status === 'completed') completedAppointments++;
      if (a.status === 'cancelled') cancelledAppointments++;
    });

    let totalExpenses = 0;
    let paidExpenses = 0;
    let fixedExpenses = 0;
    let variableExpenses = 0;

    expenses.forEach((e) => {
      const amount = Number(e.amount) || 0;
      totalExpenses += amount;
      if (e.status === 'paid') paidExpenses += amount;
      if (e.is_recurring_monthly) fixedExpenses += amount;
      else variableExpenses += amount;
    });

    const netProfit = grossRevenue - totalExpenses;

    const dateMap: { [date: string]: { revenue: number; expenses: number } } = {};
    const curDate = new Date(from + 'T00:00:00');
    const endDate = new Date(to + 'T00:00:00');
    while (curDate <= endDate) {
      const dStr = curDate.toISOString().slice(0, 10);
      dateMap[dStr] = { revenue: 0, expenses: 0 };
      curDate.setDate(curDate.getDate() + 1);
    }

    appointments.forEach((a) => {
      if (a.status !== 'cancelled' && dateMap[a.date]) {
        dateMap[a.date].revenue += Number(a.price_charged) || 0;
      }
    });

    expenses.forEach((e) => {
      if (dateMap[e.due_date]) {
        dateMap[e.due_date].expenses += Number(e.amount) || 0;
      }
    });

    const revenueByDay = Object.keys(dateMap).sort().map((d) => {
      const parts = d.split('-');
      const label = `${parts[2]}/${parts[1]}`;
      const rev = dateMap[d].revenue;
      const exp = dateMap[d].expenses;
      return {
        date: d,
        label,
        revenue: rev,
        expenses: exp,
        profit: rev - exp,
      };
    });

    const svcMap: { [id: string]: { name: string; value: number; count: number } } = {};
    services.forEach((s) => {
      svcMap[s.id] = { name: s.name, value: 0, count: 0 };
    });

    appointments.forEach((a) => {
      if (a.status !== 'cancelled') {
        const id = a.service_id;
        if (!svcMap[id]) {
          svcMap[id] = { name: a.service_name || 'Outro', value: 0, count: 0 };
        }
        svcMap[id].value += Number(a.price_charged) || 0;
        svcMap[id].count += 1;
      }
    });

    const revenueByService = Object.values(svcMap).filter((s) => s.count > 0 || s.value > 0);

    const expCategoryMap: { [cat: string]: number } = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Outros';
      expCategoryMap[cat] = (expCategoryMap[cat] || 0) + (Number(e.amount) || 0);
    });

    const expensesByCategory = Object.entries(expCategoryMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    const statusLabels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      no_show: 'Não compareceu',
    };
    const statusCountMap: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    };
    appointments.forEach((a) => {
      if (statusCountMap[a.status] !== undefined) {
        statusCountMap[a.status]++;
      }
    });

    const statusBreakdown = Object.entries(statusCountMap).map(([status, count]) => ({
      status,
      count,
      label: statusLabels[status] || status,
    }));

    const responseData: FinancialSummary = {
      period: {
        from,
        to,
        type: rangeType,
      },
      metrics: {
        grossRevenue,
        paidRevenue,
        pendingRevenue,
        totalAppointments: appointments.length,
        completedAppointments,
        cancelledAppointments,
        totalExpenses,
        paidExpenses,
        fixedExpenses,
        variableExpenses,
        netProfit,
      },
      charts: {
        revenueByDay,
        revenueByService,
        statusBreakdown,
        expensesByCategory,
      },
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
