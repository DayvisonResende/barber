const SUPABASE_URL = 'https://plhxtgbmmupojzbhpnpe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaHh0Z2JtbXVwb2p6YmhwbnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzk1MDMsImV4cCI6MjA5MDg1NTUwM30.xi2GoizxHsCFwQvW5otBrNFdxDhTE_MRmlOV3m0GYnA';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const Rel = {
    state: {
        loading: true,
        role: null,
        userId: null,
        tab: 'resultado',
        period: 'month',
        periodStart: '',
        periodEnd: '',
        barbers: [],
        products: [],
        categories: [],
        transactions: [],
        prevTransactions: [],
        productApts: [],
        fixedExpenses: [],
        expenses: [],
        prevExpenses: [],
        showNewFixed: false,
        showNewExpense: false,
        newFixed: { description: '', category: 'aluguel', amount: '', notes: '' },
        newExpense: { description: '', category: 'insumos', amount: '', date: '', notes: '' }
    },

    async init() {
        const { data: { session } } = await db.auth.getSession();
        if (!session) { window.location.href = 'index.html'; return; }

        const { data: profile } = await db.from('profiles').select('role').eq('id', session.user.id).single();
        if (!profile || profile.role === 'client') { window.location.href = 'index.html'; return; }

        this.state.role = profile.role;
        this.state.userId = session.user.id;

        const today = new Date().toISOString().split('T')[0];
        this.state.newExpense.date = today;

        const [barbers, products, categories] = await Promise.all([
            db.from('barbers').select('*'),
            db.from('products').select('*'),
            db.from('categories').select('*')
        ]);
        this.state.barbers = barbers.data || [];
        this.state.products = products.data || [];
        this.state.categories = categories.data || [];

        await this.loadTabData();
        this.state.loading = false;
        this.render();
    },

    getPeriodDates() {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        switch (this.state.period) {
            case 'day': return { start: fmt(now), end: fmt(now) };
            case 'week': {
                const s = new Date(now); s.setDate(now.getDate() - now.getDay());
                return { start: fmt(s), end: fmt(now) };
            }
            case 'year': return { start: `${now.getFullYear()}-01-01`, end: fmt(now) };
            case 'custom': return { start: this.state.periodStart, end: this.state.periodEnd };
            default: return { start: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, end: fmt(now) };
        }
    },

    getPrevPeriodDates() {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        switch (this.state.period) {
            case 'day': {
                const p = new Date(now); p.setDate(p.getDate() - 1);
                return { start: fmt(p), end: fmt(p) };
            }
            case 'week': {
                const ws = new Date(now); ws.setDate(now.getDate() - now.getDay());
                const pe = new Date(ws); pe.setDate(pe.getDate() - 1);
                const ps = new Date(pe); ps.setDate(ps.getDate() - 6);
                return { start: fmt(ps), end: fmt(pe) };
            }
            case 'year': {
                const y = now.getFullYear() - 1;
                return { start: `${y}-01-01`, end: `${y}-12-31` };
            }
            case 'custom': {
                const { start, end } = this.getPeriodDates();
                if (!start || !end) return { start: null, end: null };
                const s = new Date(start), e = new Date(end);
                const diff = e.getTime() - s.getTime();
                const pe = new Date(s.getTime() - 86400000);
                const ps = new Date(pe.getTime() - diff);
                return { start: fmt(ps), end: fmt(pe) };
            }
            default: {
                const pm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                const py = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
                return { start: `${py}-${pad(pm + 1)}-01`, end: `${py}-${pad(pm + 1)}-${pad(lastDay)}` };
            }
        }
    },

    async loadTabData() {
        const { start, end } = this.getPeriodDates();
        if (this.state.tab === 'resultado') return this.loadResultado(start, end);
        if (this.state.tab === 'atendimentos') {
            if (!start || !end) { this.state.loading = false; this.render(); return; }
            return this.loadTransactions(start, end);
        }
        if (this.state.tab === 'comissoes') {
            if (!start || !end) { this.state.loading = false; this.render(); return; }
            return this.loadProductApts(start, end);
        }
        if (this.state.tab === 'despesas') return this.loadExpenses(start, end);
    },

    async setPeriod(p) {
        this.state.period = p;
        this.state.loading = true;
        this.render();
        await this.loadTabData();
    },

    async applyCustomPeriod() {
        const s = document.getElementById('custom-start')?.value;
        const e = document.getElementById('custom-end')?.value;
        if (!s || !e) return;
        this.state.periodStart = s;
        this.state.periodEnd = e;
        this.state.loading = true;
        this.render();
        await this.loadTabData();
    },

    async setTab(tab) {
        this.state.tab = tab;
        this.state.loading = true;
        this.render();
        await this.loadTabData();
    },

    async loadResultado(start, end) {
        try {
            const { start: ps, end: pe } = this.getPrevPeriodDates();

            const [txRes, aptRes, expRes, fixedRes] = await Promise.all([
                db.from('transactions')
                    .select('id, date, completed_at, client_name, service_name, numeric_value, barber_id, payment_method')
                    .order('completed_at', { ascending: false }),
                start && end
                    ? db.from('appointments').select('id, date, comanda_items').eq('status', 'completed').gte('date', start).lte('date', end)
                    : Promise.resolve({ data: [] }),
                start && end
                    ? db.from('expenses').select('*').eq('type', 'variable').gte('expense_date', start).lte('expense_date', end)
                    : Promise.resolve({ data: [] }),
                db.from('expenses').select('*').eq('type', 'fixed').eq('is_active', true),
            ]);

            const allTx = txRes.data || [];
            this.state.transactions = start && end ? allTx.filter(t => {
                const raw = t.date || t.completed_at;
                const d = raw ? String(raw).slice(0, 10) : null;
                return d && d >= start && d <= end;
            }) : [];

            this.state.prevTransactions = (ps && pe) ? allTx.filter(t => {
                const raw = t.date || t.completed_at;
                const d = raw ? String(raw).slice(0, 10) : null;
                return d && d >= ps && d <= pe;
            }) : [];

            this.state.productApts = (aptRes.data || []).filter(a => a.comanda_items?.length > 0);
            this.state.expenses = expRes.data || [];
            this.state.fixedExpenses = fixedRes.data || [];

            if (ps && pe) {
                const prevExpRes = await db.from('expenses').select('amount')
                    .eq('type', 'variable').gte('expense_date', ps).lte('expense_date', pe);
                this.state.prevExpenses = prevExpRes.data || [];
            } else {
                this.state.prevExpenses = [];
            }
        } catch (e) {
            console.error('loadResultado:', e);
            this.state.transactions = [];
            this.state.prevTransactions = [];
            this.state.productApts = [];
            this.state.fixedExpenses = [];
            this.state.expenses = [];
            this.state.prevExpenses = [];
        } finally {
            this.state.loading = false;
            this.render();
        }
    },

    async loadTransactions(start, end) {
        try {
            const { data } = await db
                .from('transactions')
                .select('id, date, completed_at, client_name, service_name, numeric_value, comanda_total, product_commission, barber_id, payment_method, is_settled')
                .order('completed_at', { ascending: false });
            const all = data || [];
            this.state.transactions = all.filter(t => {
                const raw = t.date || t.completed_at;
                const d = raw ? String(raw).slice(0, 10) : null;
                return d && d >= start && d <= end;
            });
        } catch (e) {
            console.error('loadTransactions:', e);
            this.state.transactions = [];
        } finally {
            this.state.loading = false;
            this.render();
        }
    },

    async loadProductApts(start, end) {
        try {
            const { data } = await db
                .from('appointments')
                .select('id, date, client_name, barber_name, barber_id, comanda_items')
                .eq('status', 'completed')
                .gte('date', start).lte('date', end);
            this.state.productApts = (data || []).filter(a => a.comanda_items?.length > 0);
        } catch (e) {
            console.error('loadProductApts:', e);
            this.state.productApts = [];
        } finally {
            this.state.loading = false;
            this.render();
        }
    },

    async loadExpenses(start, end) {
        try {
            const queries = [
                db.from('expenses').select('*').eq('type', 'fixed').order('description'),
            ];
            if (start && end) {
                queries.push(
                    db.from('expenses').select('*')
                        .eq('type', 'variable')
                        .gte('expense_date', start).lte('expense_date', end)
                        .order('expense_date', { ascending: false })
                );
            }
            const [fixedRes, variableRes] = await Promise.all(queries);
            this.state.fixedExpenses = fixedRes.data || [];
            this.state.expenses = variableRes ? (variableRes.data || []) : [];
        } catch (e) {
            console.error('loadExpenses:', e);
            this.state.fixedExpenses = [];
            this.state.expenses = [];
        } finally {
            this.state.loading = false;
            this.render();
        }
    },

    async saveFixed() {
        const { description, category, amount, notes } = this.state.newFixed;
        if (!description.trim() || !amount) { alert('Preencha descricao e valor.'); return; }
        const numVal = parseFloat(String(amount).replace(',', '.'));
        if (isNaN(numVal) || numVal <= 0) { alert('Valor invalido.'); return; }

        const { error } = await db.from('expenses').insert({
            description: description.trim(), category, amount: numVal,
            expense_date: null, notes: notes.trim() || null,
            created_by: this.state.userId, type: 'fixed', is_active: true
        });
        if (error) { alert('Erro: ' + error.message); return; }

        this.state.newFixed = { description: '', category: 'aluguel', amount: '', notes: '' };
        this.state.showNewFixed = false;
        const { start, end } = this.getPeriodDates();
        await this.loadExpenses(start, end);
    },

    async toggleFixed(id, isActive) {
        await db.from('expenses').update({ is_active: !isActive }).eq('id', id);
        const { start, end } = this.getPeriodDates();
        await this.loadExpenses(start, end);
    },

    async deleteFixed(id) {
        if (!confirm('Excluir esta despesa fixa permanentemente?')) return;
        await db.from('expenses').delete().eq('id', id);
        const { start, end } = this.getPeriodDates();
        await this.loadExpenses(start, end);
    },

    async saveExpense() {
        const { description, category, amount, date, notes } = this.state.newExpense;
        if (!description.trim() || !amount || !date) { alert('Preencha descricao, valor e data.'); return; }
        const numVal = parseFloat(String(amount).replace(',', '.'));
        if (isNaN(numVal) || numVal <= 0) { alert('Valor invalido.'); return; }

        const { error } = await db.from('expenses').insert({
            description: description.trim(), category, amount: numVal,
            expense_date: date, notes: notes.trim() || null,
            created_by: this.state.userId, type: 'variable', is_active: true
        });
        if (error) { alert('Erro: ' + error.message); return; }

        const today = new Date().toISOString().split('T')[0];
        this.state.newExpense = { description: '', category: 'insumos', amount: '', date: today, notes: '' };
        this.state.showNewExpense = false;
        const { start, end } = this.getPeriodDates();
        await this.loadExpenses(start, end);
    },

    async deleteExpense(id) {
        if (!confirm('Excluir este lancamento?')) return;
        await db.from('expenses').delete().eq('id', id);
        const { start, end } = this.getPeriodDates();
        await this.loadExpenses(start, end);
    },

    render() {
        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = this.state.loading ? this.renderLoading() : this.renderPage();
        if (window.lucide) lucide.createIcons({ root: app });
    },

    renderLoading() {
        return `<div class="flex items-center justify-center h-screen">
            <div class="flex flex-col items-center gap-4">
                <div class="w-10 h-10 rounded-full border-4 border-zinc-700 border-t-amber-500 animate-spin"></div>
                <p class="text-zinc-500 text-sm">Carregando...</p>
            </div>
        </div>`;
    },

    renderPage() {
        const tabs = [
            { id: 'resultado', label: 'Resultado', icon: 'layout-dashboard' },
            { id: 'atendimentos', label: 'Atendimentos', icon: 'users' },
            { id: 'comissoes', label: 'Comissoes', icon: 'package' },
            { id: 'despesas', label: 'Despesas', icon: 'receipt' }
        ];
        const periods = [
            { id: 'day', label: 'Hoje' }, { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mes' }, { id: 'year', label: 'Ano' }
        ];
        const content = this.state.tab === 'resultado' ? this.renderResultado()
            : this.state.tab === 'atendimentos' ? this.renderAtendimentos()
            : this.state.tab === 'comissoes' ? this.renderComissoes()
            : this.renderDespesas();

        return `
        <div class="min-h-screen flex flex-col">
            <header class="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
                <a href="index.html" class="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-amber-500 transition-all active:scale-95">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </a>
                <div class="flex-1">
                    <h1 class="text-base font-bold text-zinc-100 leading-none">Relatorio Gerencial</h1>
                    <p class="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">FinnoTrato Barbearia</p>
                </div>
                <span class="text-[10px] text-zinc-600 uppercase tracking-widest font-bold border border-zinc-800 px-2 py-1 rounded-lg">${this.state.role}</span>
            </header>

            <div class="bg-zinc-900 border-b border-zinc-800 px-4 flex gap-0 overflow-x-auto">
                ${tabs.map(t => `
                    <button onclick="Rel.setTab('${t.id}')"
                        class="flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                        ${this.state.tab === t.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}">
                        <i data-lucide="${t.icon}" class="w-4 h-4"></i>${t.label}
                    </button>
                `).join('')}
            </div>

            <div class="bg-zinc-900/60 border-b border-zinc-800 px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
                ${periods.map(p => `
                    <button onclick="Rel.setPeriod('${p.id}')"
                        class="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all
                        ${this.state.period === p.id ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}">
                        ${p.label}
                    </button>
                `).join('')}
                <button onclick="Rel.setPeriod('custom')"
                    class="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5
                    ${this.state.period === 'custom' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}">
                    <i data-lucide="calendar-range" class="w-3.5 h-3.5"></i>Periodo
                </button>
                ${this.state.period === 'custom' ? `
                    <div class="flex items-center gap-2 ml-2 flex-shrink-0">
                        <input type="date" id="custom-start" value="${this.state.periodStart}"
                            class="bg-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1.5 border border-zinc-700 focus:border-amber-500 outline-none">
                        <span class="text-zinc-600 text-xs">-></span>
                        <input type="date" id="custom-end" value="${this.state.periodEnd}"
                            class="bg-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1.5 border border-zinc-700 focus:border-amber-500 outline-none">
                        <button onclick="Rel.applyCustomPeriod()"
                            class="px-3 py-1.5 bg-amber-500 text-zinc-950 rounded-lg text-xs font-black hover:bg-amber-400 active:scale-95">OK</button>
                    </div>
                ` : ''}
            </div>

            <main class="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
                ${content}
            </main>
        </div>`;
    },

    renderResultado() {
        const txs = this.state.transactions;
        const prevTxs = this.state.prevTransactions;
        const fixedExpenses = this.state.fixedExpenses;
        const varExpenses = this.state.expenses;
        const prevVarExpenses = this.state.prevExpenses;

        const faturamento = txs.reduce((s, t) => s + (t.numeric_value || 0), 0);
        const count = txs.length;
        const avg = count > 0 ? faturamento / count : 0;
        const prevFaturamento = prevTxs.reduce((s, t) => s + (t.numeric_value || 0), 0);
        const prevCount = prevTxs.length;
        const prevAvg = prevCount > 0 ? prevFaturamento / prevCount : 0;

        let serviceComm = 0;
        txs.forEach(t => {
            const b = this.state.barbers.find(b => String(b.user_id) === String(t.barber_id));
            serviceComm += (t.numeric_value || 0) * ((b?.commission_rate || 0) / 100);
        });
        let productComm = 0;
        this.state.productApts.forEach(apt => {
            (apt.comanda_items || []).forEach(item => {
                productComm += (item.price || 0) * (item.qty || 1) * ((item.commission_rate || 0) / 100);
            });
        });
        const totalComm = serviceComm + productComm;

        const fixedTotal = fixedExpenses.filter(e => e.is_active !== false).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        const varTotal = varExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        const despesas = fixedTotal + varTotal;

        const prevVarTotal = prevVarExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        const prevDespesas = fixedTotal + prevVarTotal;

        const resultado = faturamento - totalComm - despesas;
        const margem = faturamento > 0 ? (resultado / faturamento) * 100 : 0;

        let projection = null;
        if (this.state.period === 'month') {
            const now = new Date();
            const day = now.getDate();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            if (day > 0 && day < daysInMonth && faturamento > 0) {
                projection = (faturamento / day) * daysInMonth;
            }
        }

        const prevClientSet = new Set(prevTxs.map(t => (t.client_name || '').toLowerCase().trim()).filter(Boolean));
        const currentClients = [...new Set(txs.map(t => (t.client_name || '').toLowerCase().trim()).filter(Boolean))];
        const recorrentes = currentClients.filter(c => prevClientSet.has(c)).length;
        const novos = currentClients.length - recorrentes;
        const retencao = currentClients.length > 0 ? (recorrentes / currentClients.length * 100) : 0;

        const serviceMap = {};
        txs.forEach(t => {
            const s = t.service_name || 'Nao informado';
            if (!serviceMap[s]) serviceMap[s] = { name: s, total: 0, count: 0 };
            serviceMap[s].total += t.numeric_value || 0;
            serviceMap[s].count++;
        });
        const topServices = Object.values(serviceMap).sort((a, b) => b.total - a.total).slice(0, 5);

        const barberMap = {};
        txs.forEach(t => {
            const key = t.barber_id || 'none';
            if (!barberMap[key]) {
                const rec = this.state.barbers.find(b => String(b.user_id) === String(t.barber_id));
                barberMap[key] = { name: rec?.name || 'Nao informado', total: 0, count: 0 };
            }
            barberMap[key].total += t.numeric_value || 0;
            barberMap[key].count++;
        });
        const topBarbers = Object.values(barberMap)
            .map(b => ({ ...b, avg: b.count > 0 ? b.total / b.count : 0 }))
            .sort((a, b) => b.total - a.total);

        return `<div class="space-y-5 fade-in">

            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div class="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-3">
                    <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Demonstrativo do Periodo</p>
                    ${projection ? `
                    <div class="flex items-center gap-1.5 text-[10px] text-zinc-500 bg-zinc-800 px-2.5 py-1.5 rounded-lg flex-shrink-0">
                        <i data-lucide="trending-up" class="w-3 h-3 text-amber-500"></i>
                        <span>Projecao: <span class="text-amber-500 font-black">R$ ${this.fmt(projection)}</span></span>
                    </div>` : ''}
                </div>
                <div class="px-5 py-1 divide-y divide-zinc-800/40">
                    <div class="py-3.5 flex justify-between items-center">
                        <span class="text-sm text-zinc-400">Faturamento Bruto</span>
                        <span class="font-black text-zinc-100">R$ ${this.fmt(faturamento)}</span>
                    </div>
                    <div class="py-3.5 flex justify-between items-center">
                        <span class="text-sm text-zinc-400">(-) Comissoes de Servicos</span>
                        <span class="font-semibold text-blue-400">- R$ ${this.fmt(serviceComm)}</span>
                    </div>
                    <div class="py-3.5 flex justify-between items-center">
                        <span class="text-sm text-zinc-400">(-) Comissoes de Produtos</span>
                        <span class="font-semibold text-blue-400">- R$ ${this.fmt(productComm)}</span>
                    </div>
                    <div class="py-3.5 flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-zinc-400">(-) Despesas Fixas</span>
                            <span class="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">${fixedExpenses.filter(e => e.is_active !== false).length} itens</span>
                        </div>
                        <span class="font-semibold text-rose-400">- R$ ${this.fmt(fixedTotal)}</span>
                    </div>
                    <div class="py-3.5 flex justify-between items-center">
                        <span class="text-sm text-zinc-400">(-) Despesas Variaveis</span>
                        <span class="font-semibold text-rose-400">- R$ ${this.fmt(varTotal)}</span>
                    </div>
                    <div class="py-4 flex justify-between items-center">
                        <div>
                            <p class="font-black text-zinc-100">Resultado Liquido</p>
                            <p class="text-xs mt-0.5 ${margem >= 50 ? 'text-emerald-400' : margem >= 20 ? 'text-amber-400' : 'text-rose-400'} font-bold">${margem.toFixed(1)}% de margem</p>
                        </div>
                        <span class="font-black text-2xl ${resultado >= 0 ? 'text-emerald-400' : 'text-rose-400'}">R$ ${this.fmt(resultado)}</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                ${this.kpiCard('Faturamento', `R$ ${this.fmt(faturamento)}`, faturamento, prevFaturamento, true)}
                ${this.kpiCard('Servicos', String(count), count, prevCount, true)}
                ${this.kpiCard('Ticket Medio', `R$ ${this.fmt(avg)}`, avg, prevAvg, true)}
                ${this.kpiCard('Despesas', `R$ ${this.fmt(despesas)}`, despesas, prevDespesas, false)}
            </div>

            ${currentClients.length > 0 ? `
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div class="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
                    <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Clientes no Periodo</p>
                    <span class="text-2xl font-black text-zinc-100">${currentClients.length}</span>
                </div>
                <div class="p-5">
                    <div class="h-2.5 bg-zinc-800 rounded-full overflow-hidden flex mb-3">
                        <div class="h-full bg-emerald-500 rounded-l-full" style="width:${retencao.toFixed(1)}%"></div>
                        <div class="h-full bg-amber-500 flex-1 rounded-r-full"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-emerald-500/10 rounded-xl p-3.5">
                            <p class="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest mb-1">Recorrentes</p>
                            <p class="text-2xl font-black text-emerald-400">${recorrentes}</p>
                            <p class="text-xs text-emerald-400/60 mt-0.5">${retencao.toFixed(0)}% retencao</p>
                        </div>
                        <div class="bg-amber-500/10 rounded-xl p-3.5">
                            <p class="text-[10px] font-black text-amber-400/70 uppercase tracking-widest mb-1">Novos</p>
                            <p class="text-2xl font-black text-amber-400">${novos}</p>
                            <p class="text-xs text-amber-400/60 mt-0.5">${(100 - retencao).toFixed(0)}% do total</p>
                        </div>
                    </div>
                </div>
            </div>` : ''}

            ${topServices.length > 0 ? `
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div class="px-5 py-3.5 border-b border-zinc-800">
                    <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ranking de Servicos</p>
                </div>
                <div class="divide-y divide-zinc-800/50">
                    ${topServices.map((s, i) => {
                        const share = faturamento > 0 ? s.total / faturamento * 100 : 0;
                        const rc = ['bg-amber-500 text-zinc-950', 'bg-zinc-400 text-zinc-950', 'bg-amber-700/50 text-amber-200'];
                        return `<div class="px-5 py-3.5 flex items-center gap-3">
                            <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${rc[i] || 'bg-zinc-800 text-zinc-500'}">${i + 1}</span>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between gap-2 mb-1.5">
                                    <p class="text-sm font-semibold text-zinc-200 truncate">${s.name}</p>
                                    <p class="font-black text-amber-400 text-sm flex-shrink-0">R$ ${this.fmt(s.total)}</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div class="h-full bg-amber-500/60 rounded-full" style="width:${share.toFixed(1)}%"></div>
                                    </div>
                                    <span class="text-[10px] text-zinc-600 flex-shrink-0">${s.count}x · ${share.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>` : ''}

            ${topBarbers.length > 0 ? `
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div class="px-5 py-3.5 border-b border-zinc-800">
                    <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Desempenho por Profissional</p>
                </div>
                <div class="divide-y divide-zinc-800/50">
                    ${topBarbers.map(b => {
                        const share = faturamento > 0 ? b.total / faturamento * 100 : 0;
                        return `<div class="px-5 py-4 flex items-center gap-3">
                            <div class="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                <span class="text-amber-500 font-black text-sm">${(b.name[0] || '?').toUpperCase()}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between gap-2 mb-1">
                                    <p class="font-semibold text-zinc-100 text-sm truncate">${b.name}</p>
                                    <p class="font-black text-amber-500 text-sm flex-shrink-0">R$ ${this.fmt(b.total)}</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div class="h-full bg-amber-500 rounded-full" style="width:${share.toFixed(1)}%"></div>
                                    </div>
                                    <span class="text-[10px] text-zinc-600 flex-shrink-0">${b.count}x · ticket R$ ${this.fmt(b.avg)}</span>
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>` : this.emptyState('inbox', 'Nenhum dado no periodo')}

        </div>`;
    },

    renderAtendimentos() {
        const txs = this.state.transactions;
        const total = txs.reduce((s, t) => s + (t.numeric_value || 0), 0);
        const count = txs.length;
        const uniqueClients = new Set(txs.map(t => (t.client_name || '').toLowerCase().trim()).filter(Boolean)).size;
        const avg = count > 0 ? total / count : 0;

        const byBarber = {};
        txs.forEach(t => {
            const key = t.barber_id || 'none';
            if (!byBarber[key]) {
                const rec = this.state.barbers.find(b => String(b.user_id) === String(t.barber_id));
                byBarber[key] = { name: rec?.name || 'Nao informado', total: 0, count: 0, commissionRate: rec?.commission_rate };
            }
            byBarber[key].total += t.numeric_value || 0;
            byBarber[key].count++;
        });
        const barbers = Object.entries(byBarber).sort((a, b) => b[1].total - a[1].total);

        const byMethod = {};
        txs.forEach(t => {
            const m = t.payment_method || 'Outro';
            byMethod[m] = (byMethod[m] || 0) + (t.numeric_value || 0);
        });

        return `<div class="space-y-5 fade-in">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                ${this.card('trending-up', 'Faturamento', `R$ ${this.fmt(total)}`, 'amber')}
                ${this.card('scissors', 'Servicos', count, 'amber')}
                ${this.card('users', 'Clientes', uniqueClients, 'blue')}
                ${this.card('receipt', 'Ticket Medio', `R$ ${this.fmt(avg)}`, 'emerald')}
            </div>
            ${barbers.length === 0 ? this.emptyState('inbox', 'Nenhum servico no periodo') : `
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div class="px-5 py-3.5 border-b border-zinc-800">
                    <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Por Profissional</p>
                </div>
                ${barbers.map(([key, b]) => {
                    const share = total > 0 ? b.total / total * 100 : 0;
                    return `<div class="px-5 py-4 flex items-center gap-4 border-b border-zinc-800/50 last:border-0">
                        <div class="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                            <span class="text-amber-500 font-black text-sm">${(b.name[0] || '?').toUpperCase()}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-semibold text-zinc-100 text-sm leading-none">${b.name}</p>
                            <p class="text-xs text-zinc-500 mt-0.5">${b.count} servicos · ${share.toFixed(1)}%</p>
                            <div class="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div class="h-full bg-amber-500 rounded-full" style="width:${share.toFixed(1)}%"></div>
                            </div>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <p class="font-black text-amber-500 text-sm">R$ ${this.fmt(b.total)}</p>
                            ${b.commissionRate != null ? `<p class="text-[10px] text-zinc-600 mt-0.5">${b.commissionRate}% repasse</p>` : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>`}
            ${Object.keys(byMethod).length > 0 ? `
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div class="px-5 py-3.5 border-b border-zinc-800">
                    <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Por Forma de Pagamento</p>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4">
                    ${Object.entries(byMethod).map(([m, v]) => {
                        const colors = { Pix: 'teal-400', Dinheiro: 'emerald-400', 'Credito': 'amber-400', 'Debito': 'blue-400' };
                        const c = colors[m] || 'zinc-400';
                        return `<div class="p-4 text-center border-r border-b border-zinc-800/50 last:border-r-0">
                            <p class="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">${m}</p>
                            <p class="font-black text-${c} text-lg">R$ ${this.fmt(v)}</p>
                            <p class="text-[10px] text-zinc-600">${total > 0 ? (v / total * 100).toFixed(1) : 0}%</p>
                        </div>`;
                    }).join('')}
                </div>
            </div>` : ''}
        </div>`;
    },

    renderComissoes() {
        const apts = this.state.productApts;
        const productMap = {};
        let totalSales = 0, totalComm = 0;

        apts.forEach(apt => {
            (apt.comanda_items || []).forEach(item => {
                const qty = item.qty || 1;
                const price = item.price || 0;
                const rate = (item.commission_rate != null ? item.commission_rate : 0) / 100;
                const lineTotal = price * qty;
                const comm = lineTotal * rate;
                const key = item.id || item.name;
                if (!productMap[key]) {
                    productMap[key] = { name: item.name, price, rate: item.commission_rate || 0, qty: 0, total: 0, comm: 0 };
                }
                productMap[key].qty += qty;
                productMap[key].total += lineTotal;
                productMap[key].comm += comm;
                totalSales += lineTotal;
                totalComm += comm;
            });
        });

        const rows = Object.values(productMap).sort((a, b) => b.total - a.total);
        const totalBarbearia = totalSales - totalComm;

        return `<div class="space-y-5 fade-in">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                ${this.card('package', 'Vendas de Produtos', `R$ ${this.fmt(totalSales)}`, 'amber')}
                ${this.card('hand-coins', 'Comissoes Barbeiros', `R$ ${this.fmt(totalComm)}`, 'blue')}
                ${this.card('building-2', 'Liquido Barbearia', `R$ ${this.fmt(totalBarbearia)}`, 'emerald')}
            </div>
            ${rows.length === 0 ? this.emptyState('package-x', 'Nenhum produto vendido no periodo') : `
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div class="px-5 py-3.5 border-b border-zinc-800">
                    <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Detalhamento por Produto</p>
                </div>
                <div class="divide-y divide-zinc-800/50">
                    ${rows.map(p => {
                        const barbearia = p.total - p.comm;
                        const pct = p.total > 0 ? (p.comm / p.total * 100) : 0;
                        return `<div class="px-5 py-4">
                            <div class="flex items-start justify-between gap-3 mb-3">
                                <div class="min-w-0">
                                    <p class="font-semibold text-zinc-100 text-sm">${p.name}</p>
                                    <p class="text-[10px] text-zinc-600 mt-0.5">R$ ${this.fmt(p.price)} / un</p>
                                </div>
                                <div class="flex items-center gap-2 flex-shrink-0">
                                    <span class="bg-zinc-800 text-zinc-300 font-mono font-black text-xs px-2.5 py-1 rounded-lg">${p.qty}x</span>
                                    <span class="font-black text-amber-400 text-sm">R$ ${this.fmt(p.total)}</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="bg-blue-500/10 rounded-xl p-3">
                                    <p class="text-[10px] font-black text-blue-400/70 uppercase tracking-widest mb-1">Barbeiro <span class="bg-blue-500/20 px-1.5 rounded-full">${p.rate}%</span></p>
                                    <p class="font-black text-blue-400 text-base">R$ ${this.fmt(p.comm)}</p>
                                </div>
                                <div class="bg-emerald-500/10 rounded-xl p-3">
                                    <p class="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest mb-1">Barbearia</p>
                                    <p class="font-black text-emerald-400 text-base">R$ ${this.fmt(barbearia)}</p>
                                </div>
                            </div>
                            <div class="mt-2.5 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                                <div class="h-full bg-blue-500" style="width:${pct.toFixed(1)}%"></div>
                                <div class="h-full bg-emerald-500 flex-1"></div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
                <div class="border-t-2 border-zinc-700 bg-zinc-800/40 px-5 py-4">
                    <div class="grid grid-cols-3 gap-2">
                        <div class="text-center">
                            <p class="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Vendas</p>
                            <p class="font-black text-amber-400 text-sm">R$ ${this.fmt(totalSales)}</p>
                        </div>
                        <div class="text-center border-x border-zinc-700">
                            <p class="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Barbeiros</p>
                            <p class="font-black text-blue-400 text-sm">R$ ${this.fmt(totalComm)}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Barbearia</p>
                            <p class="font-black text-emerald-400 text-sm">R$ ${this.fmt(totalBarbearia)}</p>
                        </div>
                    </div>
                </div>
            </div>`}
        </div>`;
    },

    renderDespesas() {
        const fixed = this.state.fixedExpenses;
        const variable = this.state.expenses;
        const fixedActive = fixed.filter(e => e.is_active !== false);
        const fixedInactive = fixed.filter(e => e.is_active === false);
        const fixedTotal = fixedActive.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        const varTotal = variable.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        const total = fixedTotal + varTotal;

        const catLabels = {
            aluguel: 'Aluguel', insumos: 'Insumos/Produtos', equipamento: 'Equipamento',
            marketing: 'Marketing', servicos: 'Servicos (agua, luz...)', outros: 'Outros'
        };

        return `<div class="space-y-5 fade-in">

            <!-- Resumo -->
            <div class="grid grid-cols-3 gap-2">
                <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                    <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Fixas</p>
                    <p class="font-black text-rose-400 text-sm">R$ ${this.fmt(fixedTotal)}</p>
                </div>
                <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                    <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Variaveis</p>
                    <p class="font-black text-rose-400 text-sm">R$ ${this.fmt(varTotal)}</p>
                </div>
                <div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
                    <p class="text-[10px] font-black text-rose-500/70 uppercase tracking-widest mb-1">Total</p>
                    <p class="font-black text-rose-400 text-base">R$ ${this.fmt(total)}</p>
                </div>
            </div>

            <!-- FIXAS -->
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div class="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Despesas Fixas</p>
                        <p class="text-[10px] text-zinc-600 mt-0.5">Aparecem todo mes automaticamente</p>
                    </div>
                    <button onclick="Rel.state.showNewFixed = !Rel.state.showNewFixed; Rel.render()"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95
                        ${this.state.showNewFixed ? 'bg-zinc-700 text-zinc-300' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}">
                        <i data-lucide="${this.state.showNewFixed ? 'x' : 'plus'}" class="w-3.5 h-3.5"></i>
                        ${this.state.showNewFixed ? 'Cancelar' : 'Nova Fixa'}
                    </button>
                </div>

                ${this.state.showNewFixed ? `
                <div class="px-5 py-4 border-b border-amber-500/20 bg-amber-500/5 space-y-3">
                    <div>
                        <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">Descricao *</label>
                        <input type="text" value="${this.state.newFixed.description}" placeholder="Ex: Aluguel do espaco"
                            oninput="Rel.state.newFixed.description = this.value"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 text-sm focus:border-amber-500 outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">Categoria</label>
                            <select onchange="Rel.state.newFixed.category = this.value"
                                class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 text-sm focus:border-amber-500 outline-none">
                                ${Object.entries(catLabels).map(([v, l]) => `<option value="${v}" ${this.state.newFixed.category === v ? 'selected' : ''}>${l}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">Valor mensal (R$) *</label>
                            <input type="text" inputmode="decimal" value="${this.state.newFixed.amount}" placeholder="0,00"
                                oninput="Rel.state.newFixed.amount = this.value"
                                class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 text-sm focus:border-amber-500 outline-none">
                        </div>
                    </div>
                    <button onclick="Rel.saveFixed()"
                        class="w-full py-3 rounded-xl font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-all active:scale-95 text-sm">
                        Salvar Despesa Fixa
                    </button>
                </div>` : ''}

                ${fixedActive.length === 0 && !this.state.showNewFixed ? `
                <div class="px-5 py-8 text-center text-zinc-600">
                    <p class="text-sm">Nenhuma despesa fixa cadastrada</p>
                    <p class="text-xs mt-1">Adicione aluguel, internet, softwares...</p>
                </div>` : ''}

                ${fixedActive.map(e => `
                <div class="px-5 py-3.5 flex items-center gap-3 border-b border-zinc-800/50 last:border-0">
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-zinc-100 text-sm">${e.description}</p>
                        <span class="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded-full">${catLabels[e.category] || e.category}</span>
                    </div>
                    <p class="font-black text-rose-400 text-sm flex-shrink-0">R$ ${this.fmt(parseFloat(e.amount))}/mes</p>
                    <button onclick="Rel.toggleFixed('${e.id}', true)" title="Pausar esta despesa"
                        class="p-2 rounded-lg text-emerald-500 hover:bg-zinc-800 transition-colors active:scale-95 flex-shrink-0">
                        <i data-lucide="toggle-right" class="w-5 h-5"></i>
                    </button>
                    <button onclick="Rel.deleteFixed('${e.id}')"
                        class="p-2 rounded-lg text-zinc-700 hover:text-rose-500 hover:bg-rose-500/10 transition-colors active:scale-95 flex-shrink-0">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>`).join('')}

                ${fixedInactive.length > 0 ? `
                <div class="border-t border-zinc-800">
                    <div class="px-5 py-2.5">
                        <p class="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Pausadas</p>
                    </div>
                    ${fixedInactive.map(e => `
                    <div class="px-5 py-3 flex items-center gap-3 opacity-40">
                        <div class="flex-1 min-w-0">
                            <p class="font-semibold text-zinc-400 text-sm line-through">${e.description}</p>
                        </div>
                        <p class="text-zinc-600 text-sm flex-shrink-0">R$ ${this.fmt(parseFloat(e.amount))}</p>
                        <button onclick="Rel.toggleFixed('${e.id}', false)" title="Reativar"
                            class="p-2 rounded-lg text-zinc-600 hover:text-emerald-500 hover:bg-zinc-800 transition-colors active:scale-95 flex-shrink-0">
                            <i data-lucide="toggle-left" class="w-5 h-5"></i>
                        </button>
                        <button onclick="Rel.deleteFixed('${e.id}')"
                            class="p-2 rounded-lg text-zinc-700 hover:text-rose-500 hover:bg-rose-500/10 transition-colors active:scale-95 flex-shrink-0">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>`).join('')}
                </div>` : ''}
            </div>

            <!-- VARIAVEIS -->
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div class="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Despesas Variaveis</p>
                        <p class="text-[10px] text-zinc-600 mt-0.5">Lancadas manualmente quando ocorrem</p>
                    </div>
                    <button onclick="Rel.state.showNewExpense = !Rel.state.showNewExpense; Rel.render()"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95
                        ${this.state.showNewExpense ? 'bg-zinc-700 text-zinc-300' : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'}">
                        <i data-lucide="${this.state.showNewExpense ? 'x' : 'plus'}" class="w-3.5 h-3.5"></i>
                        ${this.state.showNewExpense ? 'Cancelar' : 'Lancar'}
                    </button>
                </div>

                ${this.state.showNewExpense ? `
                <div class="px-5 py-4 border-b border-rose-500/20 bg-rose-500/5 space-y-3">
                    <div>
                        <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">Descricao *</label>
                        <input type="text" value="${this.state.newExpense.description}" placeholder="Ex: Compra de giletes"
                            oninput="Rel.state.newExpense.description = this.value"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 text-sm focus:border-amber-500 outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">Categoria</label>
                            <select onchange="Rel.state.newExpense.category = this.value"
                                class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 text-sm focus:border-amber-500 outline-none">
                                ${Object.entries(catLabels).map(([v, l]) => `<option value="${v}" ${this.state.newExpense.category === v ? 'selected' : ''}>${l}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">Valor (R$) *</label>
                            <input type="text" inputmode="decimal" value="${this.state.newExpense.amount}" placeholder="0,00"
                                oninput="Rel.state.newExpense.amount = this.value"
                                class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 text-sm focus:border-amber-500 outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">Data *</label>
                        <input type="date" value="${this.state.newExpense.date}" onchange="Rel.state.newExpense.date = this.value"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 text-sm focus:border-amber-500 outline-none">
                    </div>
                    <button onclick="Rel.saveExpense()"
                        class="w-full py-3 rounded-xl font-bold bg-rose-500 text-zinc-100 hover:bg-rose-400 transition-all active:scale-95 text-sm">
                        Registrar Despesa
                    </button>
                </div>` : ''}

                ${variable.length === 0 && !this.state.showNewExpense ? `
                <div class="px-5 py-8 text-center text-zinc-600">
                    <p class="text-sm">Nenhuma despesa variavel no periodo</p>
                    <p class="text-xs mt-1">Lance quando comprar insumos, pagar servicos extras...</p>
                </div>` : ''}

                ${variable.map(e => `
                <div class="px-5 py-3.5 flex items-center gap-3 border-b border-zinc-800/50 last:border-0">
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-zinc-100 text-sm">${e.description}</p>
                        <div class="flex gap-2 mt-0.5 items-center">
                            <span class="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded-full">${catLabels[e.category] || e.category}</span>
                            <span class="text-[10px] text-zinc-600">${new Date(e.expense_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                    <p class="font-black text-rose-400 flex-shrink-0">R$ ${this.fmt(parseFloat(e.amount))}</p>
                    <button onclick="Rel.deleteExpense('${e.id}')"
                        class="p-2 rounded-lg text-zinc-700 hover:text-rose-500 hover:bg-rose-500/10 transition-colors active:scale-95 flex-shrink-0">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>`).join('')}
            </div>

        </div>`;
    },

    kpiCard(label, displayValue, current, prev, isGoodWhenUp) {
        let deltaHtml = '';
        if (prev > 0) {
            const pct = (current - prev) / prev * 100;
            const isPositive = isGoodWhenUp ? pct >= 0 : pct <= 0;
            const sign = pct >= 0 ? '+' : '';
            const icon = pct >= 0 ? 'trending-up' : 'trending-down';
            const clr = isPositive ? 'text-emerald-400' : 'text-rose-400';
            deltaHtml = `<div class="flex items-center gap-1 mt-1.5 ${clr}">
                <i data-lucide="${icon}" class="w-3 h-3"></i>
                <span class="text-[10px] font-bold">${sign}${pct.toFixed(1)}% vs ant.</span>
            </div>`;
        } else {
            deltaHtml = `<p class="text-[10px] text-zinc-700 mt-1.5">Sem dados anteriores</p>`;
        }
        return `<div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">${label}</p>
            <p class="font-black text-zinc-100 text-lg leading-none">${displayValue}</p>
            ${deltaHtml}
        </div>`;
    },

    card(icon, label, value, color) {
        const c = { amber: ['text-amber-500', 'bg-amber-500/10'], blue: ['text-blue-400', 'bg-blue-500/10'], emerald: ['text-emerald-400', 'bg-emerald-500/10'] }[color] || ['text-zinc-400', 'bg-zinc-800'];
        return `<div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div class="${c[1]} ${c[0]} w-9 h-9 rounded-xl flex items-center justify-center mb-3">
                <i data-lucide="${icon}" class="w-4 h-4"></i>
            </div>
            <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">${label}</p>
            <p class="text-xl font-black text-zinc-100 leading-none">${value}</p>
        </div>`;
    },

    emptyState(icon, msg) {
        return `<div class="text-center py-16 text-zinc-600">
            <i data-lucide="${icon}" class="w-12 h-12 mx-auto mb-3 opacity-30"></i>
            <p class="text-sm">${msg}</p>
        </div>`;
    },

    fmt(n) { return (n || 0).toFixed(2).replace('.', ','); }
};

document.addEventListener('DOMContentLoaded', () => Rel.init());
