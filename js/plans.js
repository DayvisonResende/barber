// ============================================================
// MÓDULO DE PLANOS - FinnoTrato Barbearia
// ============================================================
Object.assign(App, {

    // ── CARREGAMENTO DE DADOS ──────────────────────────────────

    async loadPlans() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);
        if (!isStaff) return;

        const { data: plans } = await supabaseClient
            .from('plans')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

        if (!plans) return;

        const planIds = plans.map(p => p.id);
        let discounts = [];
        if (planIds.length > 0) {
            const { data: d } = await supabaseClient
                .from('plan_service_discounts')
                .select('*')
                .in('plan_id', planIds);
            discounts = d || [];
        }

        this.state.plans = plans.map(p => ({
            ...p,
            serviceDiscounts: discounts.filter(d => d.plan_id === p.id)
        }));
    },

    async loadClientPlans() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);

        let query = supabaseClient.from('client_plans').select('*');
        if (!isStaff) {
            query = query.eq('client_id', user.id);
        }

        const { data: cps } = await query.order('created_at', { ascending: false });
        if (!cps || cps.length === 0) { this.state.clientPlans = []; return; }

        const planIds = [...new Set(cps.map(cp => cp.plan_id))];
        const { data: rawPlans } = await supabaseClient.from('plans').select('*').in('id', planIds);
        const { data: rawDiscounts } = await supabaseClient.from('plan_service_discounts').select('*').in('plan_id', planIds);

        const plansWithDiscounts = (rawPlans || []).map(p => ({
            ...p,
            serviceDiscounts: (rawDiscounts || []).filter(d => d.plan_id === p.id)
        }));

        this.state.clientPlans = cps.map(cp => ({
            ...cp,
            plan: plansWithDiscounts.find(p => p.id === cp.plan_id) || null
        }));
    },

    async loadPlanUsage() {
        const activeClientPlan = this.getActiveClientPlan();
        if (!activeClientPlan) { this.state.planUsage = []; return; }

        // Início da semana (segunda-feira)
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + diff);
        weekStart.setHours(0, 0, 0, 0);

        const { data: usage } = await supabaseClient
            .from('plan_usage')
            .select('*')
            .eq('client_plan_id', activeClientPlan.id)
            .gte('used_at', weekStart.toISOString());

        this.state.planUsage = usage || [];
    },

    // ── CONSULTAS DE ESTADO ────────────────────────────────────

    getActiveClientPlan() {
        const today = new Date().toISOString().split('T')[0];
        return (this.state.clientPlans || []).find(cp =>
            cp.status === 'active' && cp.end_date >= today
        ) || null;
    },

    isPlanActiveToday(clientPlan) {
        if (!clientPlan || clientPlan.status !== 'active') return false;
        const today = new Date().toISOString().split('T')[0];
        if (clientPlan.end_date < today) return false;
        const plan = clientPlan.plan;
        if (!plan) return false;
        const dayOfWeek = new Date().getDay();
        return (plan.active_days || []).includes(dayOfWeek);
    },

    getPlanWeekUsageCount() {
        return (this.state.planUsage || []).length;
    },

    calculatePlanDiscount(services, plan) {
        let discountAmount = 0;
        services.forEach(sv => {
            if (plan.discount_type === 'fixed') {
                const sd = (plan.serviceDiscounts || []).find(d => String(d.service_id) === String(sv.id));
                if (sd && sd.fixed_price != null) {
                    const fixedDiscount = sv.priceValue - parseFloat(sd.fixed_price);
                    if (fixedDiscount > 0) discountAmount += fixedDiscount;
                }
            } else {
                let pct = 0;
                if (plan.discount_type === 'global') {
                    pct = plan.global_discount_percent || 0;
                } else {
                    const sd = (plan.serviceDiscounts || []).find(d => String(d.service_id) === String(sv.id));
                    pct = sd ? sd.discount_percent : 0;
                }
                discountAmount += sv.priceValue * (pct / 100);
            }
        });
        const originalTotal = services.reduce((s, sv) => s + sv.priceValue, 0);
        return {
            originalTotal,
            discountAmount: Math.round(discountAmount * 100) / 100,
            discountedTotal: Math.max(0, Math.round((originalTotal - discountAmount) * 100) / 100)
        };
    },

    getUsageCountForDate(targetDate) {
        const d = new Date((targetDate || new Date().toISOString().split('T')[0]) + 'T00:00:00');
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() + diff);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return (this.state.planUsage || []).filter(u => {
            const usedAt = new Date(u.used_at);
            return usedAt >= weekStart && usedAt < weekEnd;
        }).length;
    },

    getBookingPlanDiscount(services) {
        let clientPlan;

        if (this.state.isStaffBooking) {
            const selectedClientId = this.state.staffSelectedClient?.id;
            if (!selectedClientId) return null;
            const today = new Date().toISOString().split('T')[0];
            clientPlan = (this.state.clientPlans || []).find(cp =>
                cp.client_id === selectedClientId &&
                cp.status === 'active' &&
                cp.end_date >= today
            );
        } else {
            if (this.state.role !== 'client') return null;
            clientPlan = this.getActiveClientPlan();
            if (!clientPlan) return null;
            // Limite por semana da DATA do agendamento, não da semana atual
            const usedInBookingWeek = this.getUsageCountForDate(this.state.selectedDate);
            if (usedInBookingWeek >= (clientPlan.plan?.usage_per_week || 1)) return null;
        }

        if (!clientPlan) return null;
        if (!clientPlan.plan) return null;
        if (!this.isPlanActiveToday(clientPlan)) return null;
        const result = this.calculatePlanDiscount(services, clientPlan.plan);
        if (result.discountAmount <= 0) return null;
        return { clientPlan, ...result };
    },

    getDaysUntilPlanExpiry(clientPlan) {
        if (!clientPlan) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(clientPlan.end_date + 'T00:00:00');
        return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    },

    // ── AÇÕES DE CRUD ──────────────────────────────────────────

    async savePlanForm() {
        const name = document.getElementById('plan-name')?.value?.trim();
        if (!name) { this.showNotification('Erro', 'Informe o nome do plano.'); return; }

        const discountType = document.querySelector('input[name="plan-discount-type"]:checked')?.value || 'global';
        const globalPct = parseFloat(document.getElementById('plan-global-pct')?.value) || 0;
        const usagePerWeek = parseInt(document.getElementById('plan-usage-week')?.value) || 1;
        const durationType = document.querySelector('input[name="plan-duration-type"]:checked')?.value || 'months';
        const durationValue = parseInt(document.getElementById('plan-duration-value')?.value) || 1;
        const description = document.getElementById('plan-description')?.value?.trim() || null;

        const activeDays = [0, 1, 2, 3, 4, 5, 6].filter(d =>
            document.getElementById(`plan-day-${d}`)?.checked
        );
        if (activeDays.length === 0) {
            this.showNotification('Erro', 'Selecione ao menos um dia ativo.');
            return;
        }

        if (discountType === 'global' && (globalPct <= 0 || globalPct > 100)) {
            this.showNotification('Erro', 'Informe um desconto entre 1% e 100%.');
            return;
        }

        if (discountType === 'fixed') {
            const hasAnyFixed = SERVICES.some(svc => {
                const val = parseFloat(document.getElementById(`plan-svc-fixed-${svc.id}`)?.value);
                return !isNaN(val) && val >= 0;
            });
            if (!hasAnyFixed) {
                this.showNotification('Erro', 'Informe o valor fixo de ao menos um serviço.');
                return;
            }
        }

        const { data: { user } } = await supabaseClient.auth.getUser();

        const planData = {
            name, description,
            created_by: user.id,
            discount_type: discountType,
            global_discount_percent: discountType === 'global' ? globalPct : null,
            usage_per_week: usagePerWeek,
            active_days: activeDays,
            duration_type: durationType,
            duration_value: durationValue,
            is_active: true
        };

        let planId = this.state.editingPlanId;

        if (planId) {
            const { error } = await supabaseClient.from('plans').update(planData).eq('id', planId);
            if (error) { this.showNotification('Erro', error.message); return; }
        } else {
            const { data: newPlan, error } = await supabaseClient.from('plans').insert(planData).select().single();
            if (error) { this.showNotification('Erro', error.message); return; }
            planId = newPlan.id;
        }

        if (discountType === 'individual' || discountType === 'fixed') {
            await supabaseClient.from('plan_service_discounts').delete().eq('plan_id', planId);
            let discountRows = [];
            if (discountType === 'individual') {
                discountRows = SERVICES
                    .map(svc => {
                        const pct = parseFloat(document.getElementById(`plan-svc-${svc.id}`)?.value) || 0;
                        return pct > 0 ? { plan_id: planId, service_id: String(svc.id), discount_percent: pct, fixed_price: null } : null;
                    })
                    .filter(Boolean);
            } else if (discountType === 'fixed') {
                discountRows = SERVICES
                    .map(svc => {
                        const val = document.getElementById(`plan-svc-fixed-${svc.id}`)?.value;
                        const fixedPrice = val !== '' && val != null ? parseFloat(val) : null;
                        return fixedPrice != null ? { plan_id: planId, service_id: String(svc.id), discount_percent: null, fixed_price: fixedPrice } : null;
                    })
                    .filter(Boolean);
            }
            if (discountRows.length > 0) {
                await supabaseClient.from('plan_service_discounts').insert(discountRows);
            }
        }

        this.showNotification('Sucesso!', this.state.editingPlanId ? 'Plano atualizado!' : 'Plano criado com sucesso!');
        this.state.isCreatingPlan = false;
        this.state.editingPlanId = null;
        await this.loadPlans();
        this.render();
    },

    async confirmDeletePlan(planId) {
        this.showConfirmModal({
            title: 'Excluir Plano?',
            message: 'O plano será removido. Clientes com este plano ativo perderão o acesso.',
            icon: 'trash-2',
            isDestructive: true,
            onConfirm: async () => {
                const { error } = await supabaseClient.from('plans').delete().eq('id', planId);
                if (error) { this.showNotification('Erro', error.message); return; }
                this.showNotification('Removido', 'Plano excluído com sucesso.');
                await this.loadPlans();
                await this.loadClientPlans();
                this.render();
            }
        });
    },

    async confirmAssignPlan() {
        const planId = this.state.assigningPlanId;
        const client = this.state.assignClientData;
        if (!planId || !client) {
            this.showNotification('Erro', 'Selecione um cliente.');
            return;
        }

        const plan = this.state.plans.find(p => p.id === planId);
        if (!plan) return;

        const startDate = document.getElementById('assign-start-date')?.value;
        if (!startDate) { this.showNotification('Erro', 'Informe a data de início.'); return; }

        const endDate = this.calcPlanEndDate(startDate, plan.duration_value, plan.duration_type);

        const { data: { user } } = await supabaseClient.auth.getUser();

        // Cancelar plano anterior do cliente se houver
        await supabaseClient.from('client_plans')
            .update({ status: 'cancelled' })
            .eq('client_id', client.id)
            .eq('status', 'active');

        const { error } = await supabaseClient.from('client_plans').insert({
            client_id: client.id,
            plan_id: planId,
            assigned_by: user.id,
            start_date: startDate,
            end_date: endDate,
            status: 'active'
        });

        if (error) { this.showNotification('Erro', error.message); return; }

        this.showNotification('Plano Atribuído!', `${plan.name} ativado para ${client.name}.`);
        this.state.assigningPlanId = null;
        this.state.assignClientData = null;
        await this.loadClientPlans();
        this.render();
    },

    async reactivateClientPlan(clientPlanId) {
        const { error } = await supabaseClient.from('client_plans')
            .update({ status: 'active' })
            .eq('id', clientPlanId);
        if (error) { this.showNotification('Erro', error.message); return; }
        this.showNotification('Plano Reativado!', 'O plano voltou a estar ativo.');
        await this.loadClientPlans();
        this.render();
    },

    async deleteClientPlan(clientPlanId) {
        this.showConfirmModal({
            title: 'Excluir Registro?',
            message: 'O histórico deste plano será removido permanentemente.',
            icon: 'trash-2',
            isDestructive: true,
            onConfirm: async () => {
                const { error } = await supabaseClient.from('client_plans').delete().eq('id', clientPlanId);
                if (error) { this.showNotification('Erro', error.message); return; }
                this.showNotification('Removido', 'Registro excluído.');
                await this.loadClientPlans();
                this.render();
            }
        });
    },

    async confirmRevokePlan(clientPlanId) {
        this.showConfirmModal({
            title: 'Revogar Plano?',
            message: 'O cliente perderá o acesso ao plano imediatamente.',
            icon: 'x-circle',
            isDestructive: true,
            onConfirm: async () => {
                const { error } = await supabaseClient.from('client_plans')
                    .update({ status: 'cancelled' })
                    .eq('id', clientPlanId);
                if (error) { this.showNotification('Erro', error.message); return; }
                this.showNotification('Plano Revogado', 'Acesso ao plano removido.');
                await this.loadClientPlans();
                this.render();
            }
        });
    },

    async recordPlanUsage(clientPlanId, appointmentId, appointmentDate) {
        if (!clientPlanId) return;
        const usedAt = appointmentDate
            ? new Date(appointmentDate + 'T12:00:00').toISOString()
            : new Date().toISOString();
        await supabaseClient.from('plan_usage').insert({
            client_plan_id: clientPlanId,
            appointment_id: appointmentId || null,
            used_at: usedAt
        });
        await this.loadPlanUsage();
    },

    // ── AÇÕES DE UI ────────────────────────────────────────────

    startCreatePlan() {
        this.haptic('light');
        this.state.isCreatingPlan = true;
        this.state.editingPlanId = null;
        this.render();
    },

    startEditPlan(planId) {
        this.haptic('light');
        this.state.isCreatingPlan = true;
        this.state.editingPlanId = planId;
        this.render();
    },

    cancelPlanForm() {
        this.haptic('light');
        this.state.isCreatingPlan = false;
        this.state.editingPlanId = null;
        this.render();
    },

    setPlansAdminTab(tab) {
        this.haptic('light');
        this.state.plansAdminTab = tab;
        this.render();
    },

    startAssignPlan(planId) {
        this.haptic('light');
        this.state.assigningPlanId = planId;
        this.state.assignClientData = null;
        this.render();
        // Re-aplica máscara no campo de busca após render
        setTimeout(() => {
            const el = document.getElementById('assign-client-search');
            if (el) el.focus();
        }, 100);
    },

    cancelAssignPlan() {
        this.haptic('light');
        this.state.assigningPlanId = null;
        this.state.assignClientData = null;
        this.render();
    },

    selectAssignClient(clientId) {
        const client = CLIENTES.find(c => c.id === clientId);
        if (!client) return;
        this.state.assignClientData = client;
        this.render();
    },

    clearAssignClient() {
        this.state.assignClientData = null;
        this.render();
    },

    searchAssignClients(value) {
        const container = document.getElementById('assign-client-results');
        if (!container) return;
        const term = value.toLowerCase().trim();
        if (term.length < 2) {
            container.innerHTML = '<p class="text-[11px] text-muted-theme text-center py-3">Digite ao menos 2 caracteres.</p>';
            return;
        }
        const digitsOnly = term.replace(/\D/g, '');
        const matches = CLIENTES.filter(c => {
            if (c.role !== 'client') return false;
            const nameMatch = (c.name || '').toLowerCase().includes(term);
            const phoneMatch = digitsOnly.length > 0 && (c.phone || '').replace(/\D/g, '').includes(digitsOnly);
            return nameMatch || phoneMatch;
        }).slice(0, 8);

        if (matches.length === 0) {
            container.innerHTML = '<p class="text-[11px] text-muted-theme text-center py-3">Nenhum cliente encontrado.</p>';
            return;
        }
        container.innerHTML = matches.map(c => `
            <button onclick="App.selectAssignClient('${c.id}')"
                class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-amber-500/5 transition-colors border-b border-theme/30 last:border-0">
                <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    ${c.avatar
                ? `<img src="${c.avatar}" class="w-full h-full rounded-full object-cover" />`
                : `<span class="text-sm font-black text-amber-500/70">${(c.name?.[0] || 'C').toUpperCase()}</span>`
            }
                </div>
                <div class="text-left min-w-0">
                    <p class="text-sm font-bold text-theme truncate">${App.escapeHTML(c.name)}</p>
                    <p class="text-[11px] text-muted-theme">${App.formatDisplayPhone ? App.formatDisplayPhone(c.phone) : c.phone || ''}</p>
                </div>
            </button>
        `).join('');
    },

    togglePlanDiscountType(type) {
        const globalSection = document.getElementById('plan-global-section');
        const individualSection = document.getElementById('plan-individual-section');
        const fixedSection = document.getElementById('plan-fixed-section');
        if (globalSection) globalSection.classList.toggle('hidden', type !== 'global');
        if (individualSection) individualSection.classList.toggle('hidden', type !== 'individual');
        if (fixedSection) fixedSection.classList.toggle('hidden', type !== 'fixed');

        // Atualizar destaque visual dos cards de seleção
        document.querySelectorAll('.plan-dtype-btn').forEach(btn => {
            const radio = btn.previousElementSibling;
            const isSelected = radio && radio.value === type;
            btn.classList.toggle('border-amber-500', isSelected);
            btn.classList.toggle('bg-amber-500/10', isSelected);
            btn.classList.toggle('border-theme', !isSelected);
            btn.classList.toggle('input-bg', !isSelected);
            const icon = btn.querySelector('i');
            const title = btn.querySelector('p:first-of-type');
            if (icon) { icon.classList.toggle('text-amber-500', isSelected); icon.classList.toggle('text-muted-theme', !isSelected); }
            if (title) { title.classList.toggle('text-amber-500', isSelected); title.classList.toggle('text-muted-theme', !isSelected); }
        });
    },

    updateAssignEndDate() {
        const startDate = document.getElementById('assign-start-date')?.value;
        const planId = this.state.assigningPlanId;
        const plan = this.state.plans.find(p => p.id === planId);
        const endEl = document.getElementById('assign-end-date-display');
        if (!startDate || !plan || !endEl) return;
        const endDate = this.calcPlanEndDate(startDate, plan.duration_value, plan.duration_type);
        const [y, m, d] = endDate.split('-');
        endEl.textContent = `${d}/${m}/${y}`;
    },

    calcPlanEndDate(startDate, durationValue, durationType) {
        const start = new Date(startDate + 'T00:00:00');
        if (durationType === 'days') {
            start.setDate(start.getDate() + durationValue);
        } else {
            start.setMonth(start.getMonth() + durationValue);
        }
        return start.toISOString().split('T')[0];
    }
});
