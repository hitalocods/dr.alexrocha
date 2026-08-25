import { neon } from '@neondatabase/serverless';
import { Service, Appointment, Expense, BlockedDate, BusinessDayHours, ClinicSettings } from './types';

const DATABASE_URL = process.env.DATABASE_URL;

let isDbInitialized = false;

// Interface da Licença do Software
export interface SoftwareLicense {
  id: string;
  plan_name: string;
  monthly_price: number;
  setup_price: number;
  status: 'active' | 'pending' | 'overdue';
  next_due_date: string;
  last_paid_at: string | null;
  asaas_customer_id?: string;
  asaas_subscription_id?: string;
  asaas_payment_id?: string;
}

// Dados em memória para fallback/demo
const mockState = {
  services: [
    { id: 'quiro-sessao', name: 'Sessão de Quiropraxia', description: 'Ajuste quiroprático com foco em alívio de dores e alinhamento da coluna.', duration: '45 min', price: 200, category: 'Serviços', is_active: true, order_num: 1 },
    { id: 'osteo-sessao', name: 'Sessão de Osteopatia', description: 'Tratamento manual do corpo como um todo, foco em estrutura e mobilidade.', duration: '50 min', price: 220, category: 'Serviços', is_active: true, order_num: 2 },
    { id: 'reab-fisio', name: 'Reabilitação — Fisioterapia em Geral', description: 'Acompanhamento para recuperação de lesões e restrição de movimento.', duration: '50 min', price: 180, category: 'Serviços', is_active: true, order_num: 3 },
    { id: 'massagem-pistolinha', name: 'Massagem Terapêutica com Pistolinha Massageadora', description: 'Massagem terapêutica com massageador de percussão, foco em relaxamento muscular.', duration: '30 min', price: 150, category: 'Serviços', is_active: true, order_num: 4 },
  ] as Service[],
  appointments: [] as Appointment[],
  expenses: [
    { id: 'exp-1', description: 'Aluguel do Consultório', category: 'Aluguel', amount: 1500, is_recurring_monthly: true, due_date: `${new Date().toISOString().slice(0, 7)}-10`, status: 'paid', payment_date: `${new Date().toISOString().slice(0, 7)}-08` },
    { id: 'exp-2', description: 'Energia Elétrica (Equatorial)', category: 'Energia/Água', amount: 320, is_recurring_monthly: true, due_date: `${new Date().toISOString().slice(0, 7)}-15`, status: 'paid', payment_date: `${new Date().toISOString().slice(0, 7)}-14` },
    { id: 'exp-3', description: 'Sistema de Agendamento e Cloud', category: 'Sistemas', amount: 120, is_recurring_monthly: true, due_date: `${new Date().toISOString().slice(0, 7)}-20`, status: 'pending' },
    { id: 'exp-4', description: 'Ponteiras e Óleos de Massagem', category: 'Materiais/Insumos', amount: 240, is_recurring_monthly: false, due_date: `${new Date().toISOString().slice(0, 7)}-05`, status: 'paid', payment_date: `${new Date().toISOString().slice(0, 7)}-05` },
  ] as Expense[],
  blocked_dates: [] as BlockedDate[],
  business_hours: [
    { day_of_week: 0, day_name: 'Domingo', is_working: false, slots: [] },
    { day_of_week: 1, day_name: 'Segunda-feira', is_working: true, slots: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'] },
    { day_of_week: 2, day_name: 'Terça-feira', is_working: true, slots: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'] },
    { day_of_week: 3, day_name: 'Quarta-feira', is_working: true, slots: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'] },
    { day_of_week: 4, day_name: 'Quinta-feira', is_working: true, slots: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'] },
    { day_of_week: 5, day_name: 'Sexta-feira', is_working: true, slots: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'] },
    { day_of_week: 6, day_name: 'Sábado', is_working: true, slots: ['08:00', '09:00', '10:00', '11:00', '12:00'] },
  ] as BusinessDayHours[],
  settings: {
    show_prices_publicly: false,
    clinic_name: 'Dr. Alex Rocha · Quiropraxia & Osteopatia',
    clinic_phone: '5586988664485',
    clinic_address: 'Alleanza Clinic — Teresina-PI',
    default_slots: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
  } as ClinicSettings,
  license: {
    id: 'atlas_license',
    plan_name: 'Plano Manutenção & Hospedagem Cloud',
    monthly_price: Number(process.env.SOFTWARE_MONTHLY_PRICE) || 50.00,
    setup_price: Number(process.env.SOFTWARE_SETUP_PRICE) || 100.00,
    status: 'active',
    next_due_date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 2).padStart(2, '0')}-10`,
    last_paid_at: new Date().toISOString(),
  } as SoftwareLicense,
};

export function getSql() {
  const url = process.env.DATABASE_URL || DATABASE_URL;
  if (!url || url.trim() === '' || url.includes('ep-sample-123456')) {
    return null;
  }
  return neon(url);
}

// Inicializador de tabelas do Neon
export async function initializeDatabase() {
  const sql = getSql();
  if (!sql) {
    return { success: true, mode: 'memory', message: 'Rodando com armazenamento local' };
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration VARCHAR(64) DEFAULT '45 min',
        price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        category VARCHAR(128) DEFAULT 'Serviços',
        is_active BOOLEAN DEFAULT TRUE,
        order_num INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(64) PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        client_phone VARCHAR(64) NOT NULL,
        notes TEXT,
        service_id VARCHAR(64) REFERENCES services(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        time VARCHAR(10) NOT NULL,
        status VARCHAR(32) DEFAULT 'pending',
        price_charged NUMERIC(10, 2) DEFAULT 0.00,
        is_paid BOOLEAN DEFAULT FALSE,
        payment_method VARCHAR(32) DEFAULT 'unspecified',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments (date, time);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);`;

    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(64) PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        category VARCHAR(128) NOT NULL DEFAULT 'Outros',
        amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        is_recurring_monthly BOOLEAN DEFAULT FALSE,
        due_date DATE NOT NULL,
        status VARCHAR(32) DEFAULT 'pending',
        payment_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses (due_date);`;

    await sql`
      CREATE TABLE IF NOT EXISTS blocked_dates (
        id VARCHAR(64) PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS business_hours (
        day_of_week INT PRIMARY KEY,
        day_name VARCHAR(32) NOT NULL,
        is_working BOOLEAN DEFAULT TRUE,
        slots JSONB DEFAULT '["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]'::jsonb
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(64) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tabela de Licença do Software Atlas
    await sql`
      CREATE TABLE IF NOT EXISTS software_license (
        id VARCHAR(64) PRIMARY KEY,
        plan_name VARCHAR(255) NOT NULL,
        monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
        setup_price NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        next_due_date DATE NOT NULL,
        last_paid_at TIMESTAMP WITH TIME ZONE,
        asaas_customer_id VARCHAR(128),
        asaas_subscription_id VARCHAR(128),
        asaas_payment_id VARCHAR(128),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Semente inicial de serviços se tabela vazia
    const servicesCount = await sql`SELECT count(*) as count FROM services`;
    if (parseInt(servicesCount[0]?.count || '0') === 0) {
      for (const s of mockState.services) {
        await sql`
          INSERT INTO services (id, name, description, duration, price, category, is_active, order_num)
          VALUES (${s.id}, ${s.name}, ${s.description}, ${s.duration}, ${s.price}, ${s.category || 'Serviços'}, ${s.is_active}, ${s.order_num})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    // Semente de horários se vazia
    const hoursCount = await sql`SELECT count(*) as count FROM business_hours`;
    if (parseInt(hoursCount[0]?.count || '0') === 0) {
      for (const h of mockState.business_hours) {
        await sql`
          INSERT INTO business_hours (day_of_week, day_name, is_working, slots)
          VALUES (${h.day_of_week}, ${h.day_name}, ${h.is_working}, ${JSON.stringify(h.slots)})
          ON CONFLICT (day_of_week) DO NOTHING;
        `;
      }
    }

    // Semente de configurações padrão se vazia
    const settingsCount = await sql`SELECT count(*) as count FROM settings`;
    if (parseInt(settingsCount[0]?.count || '0') === 0) {
      await sql`
        INSERT INTO settings (key, value)
        VALUES 
          ('show_prices_publicly', 'false'::jsonb),
          ('clinic_name', '"Dr. Alex Rocha - Alleanza Clinic"'::jsonb),
          ('clinic_phone', '"5586988664485"'::jsonb),
          ('clinic_address', '"Alleanza Clinic — Teresina-PI"'::jsonb),
          ('default_slots', '["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]'::jsonb)
        ON CONFLICT (key) DO NOTHING;
      `;
    }

    // Semente inicial da Licença Atlas Software se vazia
    const licenseCount = await sql`SELECT count(*) as count FROM software_license`;
    if (parseInt(licenseCount[0]?.count || '0') === 0) {
      const nextMonthDue = `${new Date().getFullYear()}-${String(new Date().getMonth() + 2).padStart(2, '0')}-10`;
      await sql`
        INSERT INTO software_license (id, plan_name, monthly_price, setup_price, status, next_due_date, last_paid_at)
        VALUES ('atlas_license', 'Plano Manutenção & Hospedagem Cloud', 50.00, 100.00, 'active', ${nextMonthDue}::date, NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    // Manutenção de armazenamento inteligente para plano gratuito
    await sql`
      DELETE FROM appointments 
      WHERE status = 'cancelled' 
        AND date < (CURRENT_DATE - INTERVAL '180 days');
    `;

    isDbInitialized = true;
    return { success: true, mode: 'neon', message: 'Tabelas criadas e sincronizadas com sucesso!' };
  } catch (error: any) {
    console.error('Erro ao inicializar banco Neon:', error);
    return { success: false, mode: 'neon_error', error: error.message };
  }
}

async function ensureDbInit() {
  if (!isDbInitialized && getSql()) {
    await initializeDatabase();
  }
}

// Helpers de Acesso a Dados
export const db = {
  // LICENÇA DO SOFTWARE
  async getLicense(): Promise<SoftwareLicense> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) return { ...mockState.license };
    try {
      const rows = await sql`SELECT * FROM software_license WHERE id = 'atlas_license' LIMIT 1`;
      if (rows.length === 0) {
        return { ...mockState.license };
      }
      const r = rows[0];
      return {
        id: r.id,
        plan_name: r.plan_name,
        monthly_price: parseFloat(r.monthly_price || '50'),
        setup_price: parseFloat(r.setup_price || '100'),
        status: r.status,
        next_due_date: typeof r.next_due_date === 'string' ? r.next_due_date.slice(0, 10) : new Date(r.next_due_date).toISOString().slice(0, 10),
        last_paid_at: r.last_paid_at ? new Date(r.last_paid_at).toISOString() : null,
        asaas_customer_id: r.asaas_customer_id,
        asaas_subscription_id: r.asaas_subscription_id,
        asaas_payment_id: r.asaas_payment_id,
      };
    } catch (e) {
      return { ...mockState.license };
    }
  },

  async updateLicense(updates: Partial<SoftwareLicense>): Promise<SoftwareLicense> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) {
      mockState.license = { ...mockState.license, ...updates };
      return mockState.license;
    }

    const current = await this.getLicense();
    const merged = { ...current, ...updates };

    await sql`
      INSERT INTO software_license (id, plan_name, monthly_price, setup_price, status, next_due_date, last_paid_at, asaas_customer_id, asaas_subscription_id, asaas_payment_id, updated_at)
      VALUES (
        'atlas_license', 
        ${merged.plan_name}, 
        ${merged.monthly_price}, 
        ${merged.setup_price}, 
        ${merged.status}, 
        ${merged.next_due_date}::date, 
        ${merged.last_paid_at ? new Date(merged.last_paid_at) : null}, 
        ${merged.asaas_customer_id || null}, 
        ${merged.asaas_subscription_id || null}, 
        ${merged.asaas_payment_id || null},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        plan_name = EXCLUDED.plan_name,
        monthly_price = EXCLUDED.monthly_price,
        setup_price = EXCLUDED.setup_price,
        status = EXCLUDED.status,
        next_due_date = EXCLUDED.next_due_date,
        last_paid_at = EXCLUDED.last_paid_at,
        asaas_customer_id = EXCLUDED.asaas_customer_id,
        asaas_subscription_id = EXCLUDED.asaas_subscription_id,
        asaas_payment_id = EXCLUDED.asaas_payment_id,
        updated_at = NOW();
    `;
    return merged;
  },

  // SERVIÇOS
  async getServices(): Promise<Service[]> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) return [...mockState.services].sort((a, b) => a.order_num - b.order_num);
    try {
      const rows = await sql`SELECT * FROM services ORDER BY order_num ASC, name ASC`;
      return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        duration: r.duration,
        price: parseFloat(r.price),
        category: r.category,
        is_active: r.is_active,
        order_num: r.order_num,
        created_at: r.created_at,
      }));
    } catch (e) {
      console.warn('Erro ao consultar services no Neon:', e);
      return [...mockState.services];
    }
  },

  async createService(svc: Omit<Service, 'created_at'>): Promise<Service> {
    await ensureDbInit();
    const sql = getSql();
    const newService: Service = {
      ...svc,
      price: Number(svc.price) || 0,
      created_at: new Date().toISOString(),
    };
    if (!sql) {
      mockState.services.push(newService);
      return newService;
    }
    await sql`
      INSERT INTO services (id, name, description, duration, price, category, is_active, order_num)
      VALUES (${newService.id}, ${newService.name}, ${newService.description}, ${newService.duration}, ${newService.price}, ${newService.category || 'Serviços'}, ${newService.is_active}, ${newService.order_num})
    `;
    return newService;
  },

  async updateService(id: string, updates: Partial<Service>): Promise<Service | null> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) {
      const index = mockState.services.findIndex(s => s.id === id);
      if (index === -1) return null;
      mockState.services[index] = { ...mockState.services[index], ...updates };
      return mockState.services[index];
    }
    const current = (await sql`SELECT * FROM services WHERE id = ${id}`)[0];
    if (!current) return null;

    const merged = {
      name: updates.name ?? current.name,
      description: updates.description ?? current.description,
      duration: updates.duration ?? current.duration,
      price: updates.price !== undefined ? Number(updates.price) : Number(current.price),
      category: updates.category ?? current.category,
      is_active: updates.is_active !== undefined ? updates.is_active : current.is_active,
      order_num: updates.order_num !== undefined ? updates.order_num : current.order_num,
    };

    await sql`
      UPDATE services 
      SET name = ${merged.name}, description = ${merged.description}, duration = ${merged.duration},
          price = ${merged.price}, category = ${merged.category}, is_active = ${merged.is_active},
          order_num = ${merged.order_num}, updated_at = NOW()
      WHERE id = ${id}
    `;
    return { id, ...merged };
  },

  async deleteService(id: string): Promise<boolean> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) {
      mockState.services = mockState.services.filter(s => s.id !== id);
      return true;
    }
    await sql`DELETE FROM services WHERE id = ${id}`;
    return true;
  },

  // AGENDAMENTOS
  async getAppointments(filters?: { from?: string; to?: string; status?: string }): Promise<Appointment[]> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) {
      let list = [...mockState.appointments];
      if (filters?.from) list = list.filter(a => a.date >= filters.from!);
      if (filters?.to) list = list.filter(a => a.date <= filters.to!);
      if (filters?.status) list = list.filter(a => a.status === filters.status);
      return list.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
    }
    try {
      let rows: any[];
      if (filters?.from && filters?.to) {
        if (filters?.status) {
          rows = await sql`
            SELECT a.*, s.name as service_name 
            FROM appointments a 
            LEFT JOIN services s ON a.service_id = s.id 
            WHERE a.date >= ${filters.from} AND a.date <= ${filters.to} AND a.status = ${filters.status}
            ORDER BY a.date DESC, a.time DESC
          `;
        } else {
          rows = await sql`
            SELECT a.*, s.name as service_name 
            FROM appointments a 
            LEFT JOIN services s ON a.service_id = s.id 
            WHERE a.date >= ${filters.from} AND a.date <= ${filters.to}
            ORDER BY a.date DESC, a.time DESC
          `;
        }
      } else {
        rows = await sql`
          SELECT a.*, s.name as service_name 
          FROM appointments a 
          LEFT JOIN services s ON a.service_id = s.id 
          ORDER BY a.date DESC, a.time DESC
        `;
      }

      return rows.map((r: any) => ({
        id: r.id,
        client_name: r.client_name,
        client_phone: r.client_phone,
        notes: r.notes,
        service_id: r.service_id,
        service_name: r.service_name || 'Serviço',
        date: typeof r.date === 'string' ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10),
        time: r.time,
        status: r.status,
        price_charged: parseFloat(r.price_charged || '0'),
        is_paid: r.is_paid,
        payment_method: r.payment_method,
        created_at: r.created_at,
      }));
    } catch (e) {
      console.warn('Erro ao carregar appointments:', e);
      return [...mockState.appointments];
    }
  },

  async createAppointment(data: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
    await ensureDbInit();
    const id = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const sql = getSql();
    const newApt: Appointment = {
      ...data,
      id,
      price_charged: Number(data.price_charged) || 0,
      created_at: new Date().toISOString(),
    };

    if (!sql) {
      const conflict = mockState.appointments.find(
        (a) => a.date === data.date && a.time === data.time && a.status !== 'cancelled'
      );
      if (conflict) {
        throw new Error('Este horário já foi preenchido. Por favor, selecione outro horário.');
      }

      const svc = mockState.services.find(s => s.id === data.service_id);
      newApt.service_name = svc?.name || 'Serviço';
      mockState.appointments.unshift(newApt);
      return newApt;
    }

    const existing = await sql`
      SELECT id FROM appointments 
      WHERE date = ${newApt.date} AND time = ${newApt.time} AND status != 'cancelled'
      LIMIT 1
    `;

    if (existing.length > 0) {
      throw new Error('Este horário acabou de ser reservado por outro paciente. Por favor, escolha outro horário.');
    }

    await sql`
      INSERT INTO appointments (id, client_name, client_phone, notes, service_id, date, time, status, price_charged, is_paid, payment_method)
      VALUES (${newApt.id}, ${newApt.client_name}, ${newApt.client_phone}, ${newApt.notes || null}, ${newApt.service_id || null}, ${newApt.date}, ${newApt.time}, ${newApt.status}, ${newApt.price_charged}, ${newApt.is_paid}, ${newApt.payment_method || 'unspecified'})
    `;
    return newApt;
  },

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) {
      const idx = mockState.appointments.findIndex(a => a.id === id);
      if (idx === -1) return null;
      mockState.appointments[idx] = { ...mockState.appointments[idx], ...updates };
      return mockState.appointments[idx];
    }

    const current = (await sql`SELECT * FROM appointments WHERE id = ${id}`)[0];
    if (!current) return null;

    const merged = {
      client_name: updates.client_name ?? current.client_name,
      client_phone: updates.client_phone ?? current.client_phone,
      notes: updates.notes !== undefined ? updates.notes : current.notes,
      service_id: updates.service_id ?? current.service_id,
      date: updates.date ?? (typeof current.date === 'string' ? current.date.slice(0, 10) : new Date(current.date).toISOString().slice(0, 10)),
      time: updates.time ?? current.time,
      status: updates.status ?? current.status,
      price_charged: updates.price_charged !== undefined ? Number(updates.price_charged) : Number(current.price_charged),
      is_paid: updates.is_paid !== undefined ? updates.is_paid : current.is_paid,
      payment_method: updates.payment_method ?? current.payment_method,
    };

    await sql`
      UPDATE appointments
      SET client_name = ${merged.client_name}, client_phone = ${merged.client_phone}, notes = ${merged.notes},
          service_id = ${merged.service_id}, date = ${merged.date}, time = ${merged.time},
          status = ${merged.status}, price_charged = ${merged.price_charged}, is_paid = ${merged.is_paid},
          payment_method = ${merged.payment_method}
      WHERE id = ${id}
    `;

    return { id, ...merged };
  },

  async deleteAppointment(id: string): Promise<boolean> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) {
      mockState.appointments = mockState.appointments.filter(a => a.id !== id);
      return true;
    }
    await sql`DELETE FROM appointments WHERE id = ${id}`;
    return true;
  },

  // DESPESAS
  async getExpenses(filters?: { from?: string; to?: string }): Promise<Expense[]> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) {
      let list = [...mockState.expenses];
      if (filters?.from) list = list.filter(e => e.due_date >= filters.from!);
      if (filters?.to) list = list.filter(e => e.due_date <= filters.to!);
      return list.sort((a, b) => b.due_date.localeCompare(a.due_date));
    }
    try {
      let rows: any[];
      if (filters?.from && filters?.to) {
        rows = await sql`SELECT * FROM expenses WHERE due_date >= ${filters.from} AND due_date <= ${filters.to} ORDER BY due_date DESC`;
      } else {
        rows = await sql`SELECT * FROM expenses ORDER BY due_date DESC`;
      }
      return rows.map((r: any) => ({
        id: r.id,
        description: r.description,
        category: r.category,
        amount: parseFloat(r.amount || '0'),
        is_recurring_monthly: r.is_recurring_monthly,
        due_date: typeof r.due_date === 'string' ? r.due_date.slice(0, 10) : new Date(r.due_date).toISOString().slice(0, 10),
        status: r.status,
        payment_date: r.payment_date ? (typeof r.payment_date === 'string' ? r.payment_date.slice(0, 10) : new Date(r.payment_date).toISOString().slice(0, 10)) : null,
        created_at: r.created_at,
      }));
    } catch (e) {
      console.warn('Erro ao ler expenses:', e);
      return [...mockState.expenses];
    }
  },

  async createExpense(data: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    await ensureDbInit();
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const sql = getSql();
    const newExp: Expense = {
      ...data,
      id,
      amount: Number(data.amount) || 0,
      created_at: new Date().toISOString(),
    };

    if (!sql) {
      mockState.expenses.unshift(newExp);
      return newExp;
    }

    await sql`
      INSERT INTO expenses (id, description, category, amount, is_recurring_monthly, due_date, status, payment_date)
      VALUES (${newExp.id}, ${newExp.description}, ${newExp.category}, ${newExp.amount}, ${newExp.is_recurring_monthly}, ${newExp.due_date}, ${newExp.status}, ${newExp.payment_date || null})
    `;
    return newExp;
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) {
      const idx = mockState.expenses.findIndex(e => e.id === id);
      if (idx === -1) return null;
      mockState.expenses[idx] = { ...mockState.expenses[idx], ...updates };
      return mockState.expenses[idx];
    }

    const current = (await sql`SELECT * FROM expenses WHERE id = ${id}`)[0];
    if (!current) return null;

    const merged = {
      description: updates.description ?? current.description,
      category: updates.category ?? current.category,
      amount: updates.amount !== undefined ? Number(updates.amount) : Number(current.amount),
      is_recurring_monthly: updates.is_recurring_monthly !== undefined ? updates.is_recurring_monthly : current.is_recurring_monthly,
      due_date: updates.due_date ?? (typeof current.due_date === 'string' ? current.due_date.slice(0, 10) : new Date(current.due_date).toISOString().slice(0, 10)),
      status: updates.status ?? current.status,
      payment_date: updates.payment_date !== undefined ? updates.payment_date : current.payment_date,
    };

    await sql`
      UPDATE expenses
      SET description = ${merged.description}, category = ${merged.category}, amount = ${merged.amount},
          is_recurring_monthly = ${merged.is_recurring_monthly}, due_date = ${merged.due_date},
          status = ${merged.status}, payment_date = ${merged.payment_date || null}
      WHERE id = ${id}
    `;
    return { id, ...merged };
  },

  async deleteExpense(id: string): Promise<boolean> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) {
      mockState.expenses = mockState.expenses.filter(e => e.id !== id);
      return true;
    }
    await sql`DELETE FROM expenses WHERE id = ${id}`;
    return true;
  },

  // DATAS BLOQUEADAS
  async getBlockedDates(): Promise<BlockedDate[]> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) return [...mockState.blocked_dates];
    try {
      const rows = await sql`SELECT * FROM blocked_dates ORDER BY date ASC`;
      return rows.map((r: any) => ({
        id: r.id,
        date: typeof r.date === 'string' ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10),
        reason: r.reason,
        created_at: r.created_at,
      }));
    } catch (e) {
      return [...mockState.blocked_dates];
    }
  },

  async toggleBlockedDate(date: string, reason?: string): Promise<{ blocked: boolean }> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) {
      const idx = mockState.blocked_dates.findIndex(b => b.date === date);
      if (idx >= 0) {
        mockState.blocked_dates.splice(idx, 1);
        return { blocked: false };
      } else {
        mockState.blocked_dates.push({ id: `blk_${Date.now()}`, date, reason: reason || 'Dia trancado' });
        return { blocked: true };
      }
    }

    const existing = await sql`SELECT id FROM blocked_dates WHERE date = ${date}`;
    if (existing.length > 0) {
      await sql`DELETE FROM blocked_dates WHERE date = ${date}`;
      return { blocked: false };
    } else {
      const id = `blk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await sql`INSERT INTO blocked_dates (id, date, reason) VALUES (${id}, ${date}, ${reason || 'Dia trancado'})`;
      return { blocked: true };
    }
  },

  // DIAS DA SEMANA E HORÁRIOS
  async getBusinessHours(): Promise<BusinessDayHours[]> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) return [...mockState.business_hours];
    try {
      const rows = await sql`SELECT * FROM business_hours ORDER BY day_of_week ASC`;
      return rows.map((r: any) => ({
        day_of_week: r.day_of_week,
        day_name: r.day_name,
        is_working: r.is_working,
        slots: typeof r.slots === 'string' ? JSON.parse(r.slots) : (r.slots || []),
      }));
    } catch (e) {
      return [...mockState.business_hours];
    }
  },

  async updateBusinessDay(day_of_week: number, is_working: boolean, slots: string[]): Promise<BusinessDayHours> {
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    await ensureDbInit();
    const sql = getSql();
    if (!sql) {
      const idx = mockState.business_hours.findIndex(b => b.day_of_week === day_of_week);
      if (idx >= 0) {
        mockState.business_hours[idx].is_working = is_working;
        mockState.business_hours[idx].slots = slots;
        return mockState.business_hours[idx];
      }
      const item: BusinessDayHours = {
        day_of_week,
        day_name: dayNames[day_of_week] || 'Dia',
        is_working,
        slots,
      };
      mockState.business_hours.push(item);
      return item;
    }
    await sql`
      UPDATE business_hours 
      SET is_working = ${is_working}, slots = ${JSON.stringify(slots)}::jsonb
      WHERE day_of_week = ${day_of_week}
    `;
    return {
      day_of_week,
      day_name: dayNames[day_of_week] || 'Dia',
      is_working,
      slots,
    };
  },

  // CONFIGURAÇÕES GERAIS
  async getSettings(): Promise<ClinicSettings> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) return { ...mockState.settings };
    try {
      const rows = await sql`SELECT * FROM settings`;
      const result: any = { ...mockState.settings };
      for (const row of rows) {
        let val = row.value;
        if (typeof val === 'string') {
          try {
            val = JSON.parse(val);
          } catch {
            // Mantém a string original caso não seja JSON
          }
        }
        result[row.key] = val;
      }
      return result;
    } catch (e) {
      console.warn('Erro ao ler settings:', e);
      return { ...mockState.settings };
    }
  },

  async updateSetting(key: keyof ClinicSettings, value: any): Promise<void> {
    await ensureDbInit();
    const sql = getSql();
    if (!sql) {
      (mockState.settings as any)[key] = value;
      return;
    }
    await sql`
      INSERT INTO settings (key, value)
      VALUES (${key}, ${JSON.stringify(value)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}::jsonb, updated_at = NOW()
    `;
  },
};
