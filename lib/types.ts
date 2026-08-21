export interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number; // Valor em centavos ou decimal
  price_display?: string; // Formatado em R$
  category?: string;
  is_active: boolean;
  order_num: number;
  created_at?: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  notes?: string;
  service_id: string;
  service_name?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  price_charged: number;
  is_paid: boolean;
  payment_method?: 'pix' | 'credit' | 'debit' | 'cash' | 'unspecified';
  created_at?: string;
}

export type ExpenseCategory = 'Aluguel' | 'Energia/Água' | 'Materiais/Insumos' | 'Equipamentos' | 'Marketing' | 'Sistemas' | 'Impostos' | 'Outros';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory | string;
  amount: number; // Em R$
  is_recurring_monthly: boolean; // Se for fixa mensal
  due_date: string; // YYYY-MM-DD
  status: 'paid' | 'pending';
  payment_date?: string | null;
  created_at?: string;
}

export interface BlockedDate {
  id: string;
  date: string; // YYYY-MM-DD
  reason?: string;
  created_at?: string;
}

export interface BusinessDayHours {
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  day_name: string;
  is_working: boolean;
  slots: string[]; // ["08:00", "09:00", ...]
}

export interface ClinicSettings {
  show_prices_publicly: boolean;
  clinic_name: string;
  clinic_phone: string; // WhatsApp: 5586988664485
  clinic_address: string;
  default_slots: string[];
}

export interface FinancialSummary {
  period: {
    from: string;
    to: string;
    type: 'today' | 'week' | 'month' | 'custom';
  };
  metrics: {
    grossRevenue: number;
    paidRevenue: number;
    pendingRevenue: number;
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalExpenses: number;
    paidExpenses: number;
    fixedExpenses: number;
    variableExpenses: number;
    netProfit: number;
  };
  charts: {
    revenueByDay: { date: string; label: string; revenue: number; expenses: number; profit: number }[];
    revenueByService: { name: string; value: number; count: number }[];
    statusBreakdown: { status: string; count: number; label: string }[];
    expensesByCategory: { category: string; amount: number }[];
  };
}
