// --- Perfil "Cliente 360°" + Painel de Clientes ---
// Módulo isolado: nenhuma outra funcionalidade do app depende deste arquivo.
// Toda a leitura de histórico é feita sob demanda (não usa this.state.appointments,
// que só guarda os últimos 30 dias para o staff).

Object.assign(App, {

    // ============================================================
    // PERFIL INDIVIDUAL
    // ============================================================

    async openClientInsights(clientId) {
        // Fecha o sino (se estiver aberto) no MESMO ciclo de render que abre o perfil —
        // evita duas trocas seguidas de conteúdo no modal-container (o "pisca 2x").
        this.state.isNotificationsPanelOpen = false;
        this.state.viewingClientId = clientId;
        this.state.isLoadingClientInsights = true;
        this.state.clientInsights = null;
        this.state.editingClientPreferences = false;
        this.render();

        try {
            const raw = await this.loadClientInsightsData(clientId);
            const client = CLIENTES.find(c => c.id === clientId) || { id: clientId, name: 'Cliente' };
            this.state.clientInsights = this.computeClientInsights(client, raw);
        } catch (e) {
            console.error('Erro ao carregar Perfil 360°:', e);
            this.showNotification('Erro', 'Não foi possível carregar o histórico deste cliente.');
            this.state.viewingClientId = null;
        } finally {
            this.state.isLoadingClientInsights = false;
            this.render();
        }
    },

    closeClientInsights() {
        this.state.viewingClientId = null;
        this.state.clientInsights = null;
        this.state.editingClientPreferences = false;
        this.render();
    },

    // --- Carregamento (sob demanda, isolado de loadAppointments/loadTransactions) ---
    async loadClientInsightsData(clientId) {
        const { data: appts, error: aptError } = await supabaseClient
            .from('appointments')
            .select('*')
            .eq('client_id', clientId)
            .eq('status', 'completed')
            .order('date', { ascending: true });

        if (aptError) throw aptError;
        const appointments = appts || [];

        let transactions = [];
        const apptIds = appointments.map(a => a.id);
        if (apptIds.length > 0) {
            const { data: txs } = await supabaseClient
                .from('transactions')
                .select('*')
                .in('appointment_id', apptIds);
            transactions = txs || [];
        }

        let clientPlan = null;
        let planUsage = [];
        const { data: cps } = await supabaseClient
            .from('client_plans')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        const today = new Date().toISOString().split('T')[0];
        const activeCp = (cps || []).find(cp => cp.status === 'active' && cp.end_date >= today) || (cps || [])[0] || null;

        if (activeCp) {
            const { data: planRow } = await supabaseClient.from('plans').select('*').eq('id', activeCp.plan_id).single();
            const { data: usage } = await supabaseClient
                .from('plan_usage')
                .select('*')
                .eq('client_plan_id', activeCp.id)
                .order('used_at', { ascending: false });
            clientPlan = { ...activeCp, plan: planRow || null };
            planUsage = usage || [];
        }

        return { appointments, transactions, clientPlan, planUsage };
    },

    // --- Cálculo (função pura: não toca no Supabase; só lê o que já foi carregado) ---
    computeClientInsights(client, { appointments, transactions, clientPlan, planUsage }) {
        const dayMs = 86400000;
        const toDate = (d) => new Date(`${d}T00:00:00`);
        const diffDays = (a, b) => Math.round((toDate(b) - toDate(a)) / dayMs);

        const visits = appointments.length;
        const isNew = visits < 2;

        const since = client.created_at
            ? new Date(client.created_at).toISOString().split('T')[0]
            : (appointments[0]?.date || null);

        const lastVisitDate = visits > 0 ? appointments[visits - 1].date : null;
        const todayStr = new Date().toISOString().split('T')[0];
        const daysSinceLastVisit = lastVisitDate ? diffDays(lastVisitDate, todayStr) : null;

        // Intervalos entre visitas consecutivas (últimos 5, mais recentes primeiro)
        const allIntervals = [];
        for (let i = 1; i < appointments.length; i++) {
            allIntervals.push(diffDays(appointments[i - 1].date, appointments[i].date));
        }
        const recentIntervals = [...allIntervals].reverse().slice(0, 5);
        const avgFrequencyDays = allIntervals.length > 0
            ? Math.round(allIntervals.reduce((s, v) => s + v, 0) / allIntervals.length)
            : null;
        const intervalStdDev = allIntervals.length > 1
            ? Math.sqrt(allIntervals.reduce((s, v) => s + Math.pow(v - avgFrequencyDays, 2), 0) / allIntervals.length)
            : 0;

        // Status automático (regra de referência: dias sem visita vs frequência média)
        let status = null;
        let ratio = null;
        if (!isNew && avgFrequencyDays > 0) {
            ratio = daysSinceLastVisit / avgFrequencyDays;
            if (ratio > 2.5) {
                status = { emoji: '🔴', label: 'Ausente', color: 'rose' };
            } else if (ratio > 1.7) {
                status = { emoji: '🟠', label: 'Em risco', color: 'amber' };
            } else if (ratio > 1.3) {
                status = { emoji: '🟡', label: 'Frequência diminuindo', color: 'amber' };
            } else {
                status = { emoji: '🟢', label: 'Ativo', color: 'emerald' };
            }
        }

        // Previsão da próxima visita (janela = frequência média ± desvio, mínimo 2 dias)
        let nextVisit = null;
        if (!isNew && avgFrequencyDays > 0) {
            const window = Math.max(2, Math.round(intervalStdDev));
            const start = new Date(toDate(lastVisitDate).getTime() + (avgFrequencyDays - window) * dayMs);
            const end = new Date(toDate(lastVisitDate).getTime() + (avgFrequencyDays + window) * dayMs);
            nextVisit = {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
                overdue: daysSinceLastVisit > (avgFrequencyDays + window)
            };
        }

        // Financeiro
        const totalSpent = transactions.reduce((s, t) => s + (Number(t.numeric_value) || 0), 0);
        const ticketMedio = transactions.length > 0 ? totalSpent / transactions.length : 0;

        // Serviços favoritos (service_names vem como "Corte + Barba")
        const serviceCounts = {};
        appointments.forEach(a => {
            (a.service_names || '').split(' + ').map(s => s.trim()).filter(Boolean).forEach(name => {
                serviceCounts[name] = (serviceCounts[name] || 0) + 1;
            });
        });
        const favoriteServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);

        // Barbeiro favorito
        const barberCounts = {};
        appointments.forEach(a => {
            const name = BARBERS.find(b => String(b.user_id) === String(a.barber_id))?.name || a.barber_name || null;
            if (name) barberCounts[name] = (barberCounts[name] || 0) + 1;
        });
        const favoriteBarberEntry = Object.entries(barberCounts).sort((a, b) => b[1] - a[1])[0] || null;

        // Produtos (comanda) — guarda também a última data de compra de cada produto p/ gerar dicas
        const productCounts = {};
        const productLastDate = {};
        let productsQty = 0;
        appointments.forEach(a => {
            (a.comanda_items || []).forEach(item => {
                productsQty += item.qty || 0;
                productCounts[item.name] = (productCounts[item.name] || 0) + (item.qty || 0);
                if (!productLastDate[item.name] || a.date > productLastDate[item.name]) {
                    productLastDate[item.name] = a.date;
                }
            });
        });
        const favoriteProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

        // Comparação mensal (mês atual + 2 anteriores)
        const now = new Date();
        const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const months = [0, 1, 2].map(offset => {
            const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthAppointments = appointments.filter(a => a.date.startsWith(key));
            const monthApptIds = monthAppointments.map(a => a.id);
            const monthSpent = transactions
                .filter(t => monthApptIds.includes(t.appointment_id))
                .reduce((s, t) => s + (Number(t.numeric_value) || 0), 0);
            const monthProducts = monthAppointments.reduce((s, a) => s + (a.comanda_items || []).reduce((s2, i) => s2 + (i.qty || 0), 0), 0);
            return { label: monthLabels[d.getMonth()], visits: monthAppointments.length, spent: monthSpent, products: monthProducts };
        }).reverse(); // mais antigo -> mais recente

        // "O que mudou" — compara os 2 meses mais recentes em várias métricas
        const [prevMonth, curMonth] = months.slice(-2);
        const changes = [];
        if (prevMonth && prevMonth.visits > 0) {
            changes.push({ key: 'frequência de visitas', pct: Math.round(((curMonth.visits - prevMonth.visits) / prevMonth.visits) * 100) });
        }
        if (prevMonth && prevMonth.spent > 0) {
            changes.push({ key: 'valor gasto', pct: Math.round(((curMonth.spent - prevMonth.spent) / prevMonth.spent) * 100) });
        }
        if (prevMonth && prevMonth.products > 0) {
            changes.push({ key: 'compra de produtos', pct: Math.round(((curMonth.products - prevMonth.products) / prevMonth.products) * 100) });
        }
        const mainChange = changes.filter(c => Math.abs(c.pct) >= 30).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))[0] || null;
        const monthlyChangeText = mainChange
            ? `Principal mudança: ${mainChange.pct < 0 ? 'redução' : 'aumento'} de ${Math.abs(mainChange.pct)}% em ${mainChange.key} em relação ao mês anterior.`
            : null;

        // Timeline (últimos atendimentos)
        const timeline = [...appointments].reverse().slice(0, 8).map(a => ({
            date: a.date,
            label: a.service_names || 'Atendimento',
            value: Number(a.service_numeric_value) || 0,
            products: (a.comanda_items || []).map(i => i.name)
        }));

        // Uso do plano por mês (para comparar mês atual x média histórica)
        let planUsageThisMonth = 0;
        let planUsageMonthlyAvg = null;
        if (clientPlan && planUsage.length > 0) {
            const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const usageByMonth = {};
            planUsage.forEach(u => {
                const k = (u.used_at || '').slice(0, 7);
                usageByMonth[k] = (usageByMonth[k] || 0) + 1;
            });
            planUsageThisMonth = usageByMonth[curKey] || 0;
            const monthKeys = Object.keys(usageByMonth);
            planUsageMonthlyAvg = monthKeys.length > 0
                ? Math.round((monthKeys.reduce((s, k) => s + usageByMonth[k], 0) / monthKeys.length) * 10) / 10
                : null;
        }

        // Dicas específicas para o barbeiro (até 3)
        const tips = [];
        if (status?.label === 'Ausente') {
            tips.push(`Costuma retornar a cada ${avgFrequencyDays} dias e já está há ${daysSinceLastVisit} dias sem visitar. Uma abordagem amigável pode ajudar a reativar o cliente.`);
        } else if (status?.label === 'Em risco') {
            tips.push('A frequência deste cliente caiu de forma consistente nos últimos meses. Vale um contato para entender o motivo.');
        } else if (status?.label === 'Frequência diminuindo') {
            tips.push('O intervalo desde a última visita está acima do habitual para este cliente. Vale acompanhar.');
        }
        // Serviço que sumiu da rotina: aparecia nas visitas históricas mas não nas últimas 3
        const last3 = appointments.slice(-3);
        const last3Services = new Set(last3.flatMap(a => (a.service_names || '').split(' + ').map(s => s.trim())));
        favoriteServices.slice(0, 3).forEach(([name, count]) => {
            if (count >= 3 && appointments.length >= 5 && !last3Services.has(name)) {
                tips.push(`Costumava fazer "${name}" com frequência, mas não aparece nos últimos atendimentos. Perguntar sobre a mudança pode revelar preço, preferência ou outro motivo.`);
            }
        });
        // Produto que parou de comprar
        favoriteProducts.forEach(([name, count]) => {
            if (count < 2) return;
            const purchasesOfProduct = appointments.filter(a => (a.comanda_items || []).some(i => i.name === name)).map(a => a.date);
            if (purchasesOfProduct.length < 2) return;
            const gaps = [];
            for (let i = 1; i < purchasesOfProduct.length; i++) gaps.push(diffDays(purchasesOfProduct[i - 1], purchasesOfProduct[i]));
            const avgGap = gaps.reduce((s, v) => s + v, 0) / gaps.length;
            const daysSincePurchase = diffDays(productLastDate[name], todayStr);
            if (avgGap > 0 && daysSincePurchase > avgGap * 1.5) {
                tips.push(`Costumava comprar "${name}" a cada ${Math.round(avgGap)} dias, mas já se passaram ${daysSincePurchase} dias desde a última compra.`);
            }
        });
        // Plano subutilizado
        if (clientPlan && planUsageMonthlyAvg != null && planUsageMonthlyAvg > 0 && planUsageThisMonth < planUsageMonthlyAvg * 0.4) {
            tips.push(`Está usando menos o plano este mês (${planUsageThisMonth}x) do que a média histórica (${planUsageMonthlyAvg}x). Relembrar os benefícios pode ajudar.`);
        }
        if (isNew) tips.length = 0;
        const recommendation = tips[0] || null;

        // Saúde do cliente (0-100) — heurística simples, pesos inspirados no documento de referência
        let healthScore = null;
        if (!isNew) {
            const freqScore = ratio == null ? 70 : (ratio <= 1 ? 100 : ratio <= 1.3 ? 85 : ratio <= 1.7 ? 60 : ratio <= 2.5 ? 30 : 10);
            const recenciaScore = ratio == null ? 70 : Math.max(0, Math.min(100, Math.round(100 - (ratio - 1) * 60)));
            const avgMonthlySpent = months.reduce((s, m) => s + m.spent, 0) / months.length;
            const gastoScore = avgMonthlySpent > 0 ? Math.max(0, Math.min(100, Math.round((curMonth.spent / avgMonthlySpent) * 100))) : 60;
            const avgMonthlyVisits = months.reduce((s, m) => s + m.visits, 0) / months.length;
            const servicosScore = avgMonthlyVisits > 0 ? Math.max(0, Math.min(100, Math.round((curMonth.visits / avgMonthlyVisits) * 100))) : 60;
            const produtosScore = productsQty === 0 ? 60 : (months.slice(-2).some(m => m.products > 0) ? 100 : 20);
            const planoScore = !clientPlan ? 70 : (planUsageThisMonth > 0 ? 100 : 40);

            healthScore = Math.round(
                freqScore * 0.35 +
                recenciaScore * 0.25 +
                gastoScore * 0.15 +
                servicosScore * 0.10 +
                produtosScore * 0.05 +
                planoScore * 0.10
            );
        }

        return {
            client, isNew, since, lastVisitDate, daysSinceLastVisit, avgFrequencyDays, recentIntervals, status, healthScore, nextVisit,
            visits, totalSpent, ticketMedio, productsQty,
            favoriteServices, favoriteBarberEntry, favoriteProducts,
            months, monthlyChangeText, timeline, tips, recommendation,
            clientPlan, planUsage, planUsageThisMonth, planUsageMonthlyAvg,
            // Histórico completo (não recortado), usado no dossiê CSV — a "timeline" acima é só as últimas 8 para exibição.
            rawAppointments: appointments, rawTransactions: transactions
        };
    },

    // DD/MM/YYYY ou YYYY-MM-DD (formatos que já existem no banco) -> sempre DD/MM/YYYY para exibição.
    formatBirthDate(bd) {
        if (!bd) return null;
        if (bd.includes('/')) return bd;
        const [y, m, dd] = bd.split('-');
        if (!y || !m || !dd) return bd;
        return `${dd}/${m}/${y}`;
    },

    buildSuggestedWhatsappMessage(d) {
        const firstName = (d.client.name || '').split(' ')[0] || 'tudo bem';
        if (d.status?.label === 'Ausente' || d.status?.label === 'Em risco') {
            return `Oi ${firstName}! Tudo bem? Faz um tempinho que você não aparece por aqui. Quando quiser dar aquele trato no visual, é só chamar a gente 😄`;
        }
        if (d.status?.label === 'Frequência diminuindo') {
            return `Oi ${firstName}! Passando pra lembrar que já faz um tempinho desde seu último corte. Bora agendar o próximo? 💈`;
        }
        return `Oi ${firstName}! Tudo bem? Passando aqui pra manter contato 😄`;
    },

    // Templates de mensagem prontos pro botão "Enviar Mensagem" do Perfil 360°.
    // Cada tipo só aparece quando faz sentido pra aquele cliente específico (ver getAvailableMessageTypes).
    buildWhatsappMessageByType(d, client, type) {
        const firstName = (client.name || '').split(' ')[0] || '';
        const greeting = firstName ? `Oi ${firstName}!` : 'Oi!';

        if (type === 'birthday') {
            return `${greeting} 🎉 Passando pra desejar um feliz aniversário! Que tal comemorar dando um trato novo no visual? Te esperamos aqui 💈`;
        }
        if (type === 'plan') {
            const planName = d.clientPlan?.plan?.name || 'seu plano';
            const endDate = d.clientPlan?.end_date ? new Date(`${d.clientPlan.end_date}T00:00:00`).toLocaleDateString('pt-BR') : '';
            return `${greeting} Passando pra avisar que o seu plano "${planName}"${endDate ? ` vence em ${endDate}` : ' está perto de vencer'}. Quer aproveitar pra renovar e continuar com os benefícios? Qualquer dúvida é só chamar 😄`;
        }
        if (type === 'reengage') {
            return this.buildSuggestedWhatsappMessage(d);
        }
        return `${greeting} Tudo bem? Passando aqui pra manter contato 😄`;
    },

    // Decide quais botões de mensagem fazem sentido mostrar pra este cliente.
    getAvailableMessageTypes(d, client) {
        const types = [];
        if (d.status && ['Ausente', 'Em risco', 'Frequência diminuindo'].includes(d.status.label)) {
            types.push({ type: 'reengage', label: 'Reengajar', icon: 'user-round-search' });
        }
        if (this.isBirthdayMonth(client)) {
            types.push({ type: 'birthday', label: 'Aniversário', icon: 'cake' });
        }
        if (d.clientPlan?.end_date) {
            const daysLeft = Math.round((new Date(`${d.clientPlan.end_date}T00:00:00`) - new Date(`${new Date().toISOString().split('T')[0]}T00:00:00`)) / 86400000);
            if (daysLeft >= 0 && daysLeft <= 7) {
                types.push({ type: 'plan', label: 'Plano vencendo', icon: 'hourglass' });
            }
        }
        types.push({ type: 'generic', label: 'Mensagem', icon: 'message-circle' });
        return types;
    },

    // --- Preferências do cliente (requer coluna "preferences" em profiles — ver _dev/add_client_preferences.sql) ---
    toggleEditClientPreferences() {
        this.state.editingClientPreferences = !this.state.editingClientPreferences;
        this.render();
    },

    async saveClientPreferences(clientId) {
        const textarea = document.getElementById('client-preferences-input');
        if (!textarea) return;
        const notes = textarea.value.trim();

        try {
            const { error } = await supabaseClient.from('profiles').update({ preferences: { notes } }).eq('id', clientId);
            if (error) throw error;

            const client = CLIENTES.find(c => c.id === clientId);
            if (client) client.preferences = { notes };

            this.state.editingClientPreferences = false;
            this.showNotification('Salvo!', 'Preferências do cliente atualizadas.');
            this.render();
        } catch (e) {
            console.error(e);
            this.showNotification('Erro ao salvar', 'Rode a migração _dev/add_client_preferences.sql no Supabase antes de usar este campo.');
        }
    },

    // --- Dossiê em CSV (tudo que o sistema tem do cliente, exceto login/senha) ---
    csvEscape(value) {
        const str = value === null || value === undefined ? '' : String(value);
        if (/[";\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
        return str;
    },

    // Usa ; como separador (padrão do Excel em pt-BR) para abrir corretamente com duplo clique.
    csvRow(fields) {
        return fields.map(f => this.csvEscape(f)).join(';') + '\r\n';
    },

    buildClientDossierCSV(client, d) {
        const rows = [];
        const push = (...fields) => rows.push(this.csvRow(fields));
        const money = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',')}`;
        const dateBR = (dt) => dt ? new Date(`${dt}T00:00:00`).toLocaleDateString('pt-BR') : '';

        push('DOSSIÊ DO CLIENTE');
        push('Gerado em', new Date().toLocaleString('pt-BR'));
        push('');

        push('DADOS CADASTRAIS');
        push('Nome', client.name || '');
        push('Telefone', client.phone || '');
        push('Email de contato', client.email || '');
        push('CPF', client.cpf || '');
        push('Data de nascimento', this.formatBirthDate(client.birth_date) || '');
        push('Cliente desde', dateBR(d.since));
        push('Conta pausada', client.is_paused ? 'Sim' : 'Não');
        push('Preferências pessoais', client.preferences?.notes || '');
        push('');

        push('RESUMO E SAÚDE DO CLIENTE');
        push('Status de frequência', d.status ? `${d.status.emoji} ${d.status.label}` : 'Cliente novo');
        push('Saúde do cliente (0-100)', d.healthScore ?? '');
        push('Última visita', d.lastVisitDate ? `${dateBR(d.lastVisitDate)} (${d.daysSinceLastVisit} dias atrás)` : '');
        push('Frequência média', d.avgFrequencyDays ? `${d.avgFrequencyDays} dias` : '');
        push('Próxima visita esperada', d.nextVisit ? `${dateBR(d.nextVisit.start)} a ${dateBR(d.nextVisit.end)}` : '');
        push('Total de atendimentos', d.visits);
        push('Total gasto (histórico)', money(d.totalSpent));
        push('Ticket médio', money(d.ticketMedio));
        push('Produtos comprados (unidades)', d.productsQty);
        push('Barbeiro preferido', d.favoriteBarberEntry ? d.favoriteBarberEntry[0] : '');
        push('Serviço favorito', d.favoriteServices[0] ? `${d.favoriteServices[0][0]} (${d.favoriteServices[0][1]}x)` : '');
        push('');

        if (d.clientPlan) {
            push('PLANO');
            push('Nome do plano', d.clientPlan.plan?.name || '');
            push('Vencimento', dateBR(d.clientPlan.end_date));
            push('Total de usos', d.planUsage.length);
            push('Uso este mês', d.planUsageThisMonth);
            push('Média mensal histórica', d.planUsageMonthlyAvg ?? '');
            push('');

            if (d.planUsage.length) {
                push('HISTÓRICO DE USO DO PLANO');
                push('Data de uso');
                d.planUsage.forEach(u => push(dateBR((u.used_at || '').slice(0, 10))));
                push('');
            }
        }

        push('HISTÓRICO DE ATENDIMENTOS (' + d.rawAppointments.length + ')');
        push('Data', 'Horário', 'Serviço(s)', 'Valor', 'Barbeiro', 'Produtos na comanda');
        d.rawAppointments.forEach(a => {
            const barberName = BARBERS.find(b => String(b.user_id) === String(a.barber_id))?.name || a.barber_name || '';
            const productsStr = (a.comanda_items || []).map(i => `${i.name} x${i.qty}`).join(' | ');
            push(dateBR(a.date), a.time || '', a.service_names || '', money(a.service_numeric_value), barberName, productsStr);
        });
        push('');

        push('HISTÓRICO FINANCEIRO / TRANSAÇÕES (' + d.rawTransactions.length + ')');
        push('Data', 'Forma de Pagamento', 'Valor Pago', 'Comissão de Produto');
        d.rawTransactions.forEach(t => {
            push(dateBR(t.date), t.payment_method || '', money(t.numeric_value), money(t.product_commission));
        });

        return rows.join('');
    },

    downloadCSV(filename, content) {
        const bom = String.fromCharCode(0xFEFF); // força o Excel a ler como UTF-8 (acentos)
        const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    downloadClientDossier(clientId) {
        const client = CLIENTES.find(c => c.id === clientId);
        const d = this.state.clientInsights;
        if (!client || !d) return;

        const csv = this.buildClientDossierCSV(client, d);
        const safeName = (client.name || 'cliente')
            .normalize('NFD')
            .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        this.downloadCSV(`dossie_${safeName || 'cliente'}.csv`, csv);
    },

    // --- Renderização do modal individual ---
    renderClientInsightsModal() {
        const client = CLIENTES.find(c => c.id === this.state.viewingClientId) || { name: 'Cliente' };
        const money = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',')}`;
        const dateBR = (d) => d ? new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR') : '—';

        const closeBtn = `
            <button onclick="App.closeClientInsights()" class="w-10 h-10 rounded-full card-bg flex items-center justify-center text-muted-theme hover:text-theme transition-colors border border-theme">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>`;

        const downloadBtn = `
            <button onclick="App.downloadClientDossier('${this.state.viewingClientId}')" title="Baixar dossiê em CSV" class="w-10 h-10 rounded-full card-bg flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-colors border border-emerald-500/20">
                <i data-lucide="download" class="w-5 h-5"></i>
            </button>`;

        if (this.state.isLoadingClientInsights || !this.state.clientInsights) {
            return `
                <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm fade-in">
                    <div class="card-bg w-full max-w-sm rounded-[2.5rem] p-8 border border-theme shadow-2xl flex flex-col items-center gap-4">
                        <i data-lucide="loader-2" class="w-8 h-8 text-amber-500 animate-spin"></i>
                        <p class="text-xs font-bold uppercase tracking-widest text-muted-theme">Carregando histórico...</p>
                        <button onclick="App.closeClientInsights()" class="text-[10px] text-muted-theme uppercase tracking-widest hover:text-theme">Cancelar</button>
                    </div>
                </div>`;
        }

        const d = this.state.clientInsights;
        const colorMap = { emerald: 'emerald-500', amber: 'amber-500', rose: 'rose-500' };
        const statusColor = d.status ? colorMap[d.status.color] : 'zinc-500';
        const scoreColor = d.healthScore == null ? 'zinc-500' : d.healthScore >= 70 ? 'emerald-500' : d.healthScore >= 40 ? 'amber-500' : 'rose-500';
        const phone = client.phone || '';
        const messageTypes = phone ? this.getAvailableMessageTypes(d, client) : [];
        const waLinkFor = (type) => `https://wa.me/${App.formatWA(phone)}?text=${encodeURIComponent(this.buildWhatsappMessageByType(d, client, type))}`;

        return `
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm fade-in">
                <div class="card-bg w-full max-w-lg rounded-[2.5rem] p-6 md:p-8 border border-theme shadow-2xl scale-in relative flex flex-col max-h-[88vh]">

                    <div class="flex justify-between items-start mb-5 shrink-0">
                        <div class="min-w-0">
                            <p class="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1">Perfil 360°</p>
                            <h3 class="text-xl font-black text-theme truncate">${App.escapeHTML(client.name || 'Cliente')}</h3>
                            <div class="flex flex-wrap items-center gap-2 mt-2">
                                ${d.status ? `
                                    <span class="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-${statusColor}/10 text-${statusColor} border border-${statusColor}/20 px-2.5 py-1 rounded-full">
                                        ${d.status.emoji} ${d.status.label}
                                    </span>
                                ` : `
                                    <span class="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-2.5 py-1 rounded-full">
                                        ✨ Cliente novo
                                    </span>
                                `}
                                ${d.healthScore != null ? `
                                    <span class="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-${scoreColor}/10 text-${scoreColor} border border-${scoreColor}/20 px-2.5 py-1 rounded-full">
                                        <i data-lucide="heart-pulse" class="w-3 h-3"></i> ${d.healthScore}/100
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            ${downloadBtn}
                            ${closeBtn}
                        </div>
                    </div>

                    <div class="overflow-y-auto pr-1 space-y-5 flex-1 min-h-0 custom-scrollbar">

                        ${d.recommendation ? `
                            <div class="p-4 rounded-2xl border border-${statusColor}/20 bg-${statusColor}/5">
                                <p class="text-[10px] font-black text-${statusColor} uppercase tracking-widest mb-1">Próxima ação sugerida</p>
                                <p class="text-xs text-theme leading-relaxed">${App.escapeHTML(d.recommendation)}</p>
                            </div>
                        ` : ''}

                        ${messageTypes.length ? `
                            <div class="space-y-2">
                                <h4 class="text-[10px] font-black text-muted-theme uppercase tracking-widest flex items-center gap-1.5">
                                    <i data-lucide="message-circle" class="w-3.5 h-3.5 text-[#25D366]"></i> Enviar mensagem
                                </h4>
                                <div class="flex flex-wrap gap-2">
                                    ${messageTypes.map(mt => `
                                        <a href="${waLinkFor(mt.type)}" target="_blank" class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-xs font-bold border border-[#25D366]/20">
                                            <i data-lucide="${mt.icon}" class="w-3.5 h-3.5"></i> ${mt.label}
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${d.tips.length > 1 ? `
                            <div class="space-y-2">
                                <h4 class="text-[10px] font-black text-muted-theme uppercase tracking-widest">Outros pontos de atenção</h4>
                                <div class="space-y-1.5">
                                    ${d.tips.slice(1).map(t => `<p class="text-[11px] text-muted-theme leading-relaxed flex gap-2"><i data-lucide="dot" class="w-4 h-4 text-amber-500 shrink-0"></i> ${App.escapeHTML(t)}</p>`).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Ficha resumida -->
                        <div class="grid grid-cols-2 gap-3">
                            <div class="card-bg border border-theme/60 rounded-2xl p-3">
                                <p class="text-[9px] text-muted-theme uppercase font-bold tracking-widest">Cliente desde</p>
                                <p class="text-sm font-bold text-theme mt-1">${dateBR(d.since)}</p>
                            </div>
                            <div class="card-bg border border-theme/60 rounded-2xl p-3">
                                <p class="text-[9px] text-muted-theme uppercase font-bold tracking-widest">Última visita</p>
                                <p class="text-sm font-bold text-theme mt-1">${d.lastVisitDate ? `${d.daysSinceLastVisit} dias atrás` : '—'}</p>
                            </div>
                            <div class="card-bg border border-theme/60 rounded-2xl p-3">
                                <p class="text-[9px] text-muted-theme uppercase font-bold tracking-widest">Frequência média</p>
                                <p class="text-sm font-bold text-theme mt-1">${d.avgFrequencyDays ? `A cada ${d.avgFrequencyDays} dias` : '—'}</p>
                            </div>
                            <div class="card-bg border border-theme/60 rounded-2xl p-3">
                                <p class="text-[9px] text-muted-theme uppercase font-bold tracking-widest">Ticket médio</p>
                                <p class="text-sm font-bold text-amber-500 mt-1">${money(d.ticketMedio)}</p>
                            </div>
                            <div class="card-bg border border-theme/60 rounded-2xl p-3">
                                <p class="text-[9px] text-muted-theme uppercase font-bold tracking-widest">Total gasto</p>
                                <p class="text-sm font-bold text-amber-500 mt-1">${money(d.totalSpent)}</p>
                            </div>
                            <div class="card-bg border border-theme/60 rounded-2xl p-3">
                                <p class="text-[9px] text-muted-theme uppercase font-bold tracking-widest">Serviços / Produtos</p>
                                <p class="text-sm font-bold text-theme mt-1">${d.visits} / ${d.productsQty}</p>
                            </div>
                            <div class="card-bg border border-theme/60 rounded-2xl p-3">
                                <p class="text-[9px] text-muted-theme uppercase font-bold tracking-widest">Aniversário</p>
                                <p class="text-sm font-bold text-theme mt-1">${this.formatBirthDate(client.birth_date) || '—'}</p>
                            </div>
                        </div>

                        ${d.nextVisit ? `
                            <div class="card-bg border ${d.nextVisit.overdue ? 'border-rose-500/30 bg-rose-500/5' : 'border-theme/60'} rounded-2xl p-3 flex items-center gap-3">
                                <i data-lucide="calendar-clock" class="w-5 h-5 ${d.nextVisit.overdue ? 'text-rose-500' : 'text-amber-500'} shrink-0"></i>
                                <div>
                                    <p class="text-[9px] text-muted-theme uppercase font-bold tracking-widest">Próxima visita esperada</p>
                                    <p class="text-xs font-bold text-theme mt-0.5">
                                        ${dateBR(d.nextVisit.start)} — ${dateBR(d.nextVisit.end)}
                                        ${d.nextVisit.overdue ? '<span class="text-rose-500">· já passou do esperado</span>' : ''}
                                    </p>
                                </div>
                            </div>
                        ` : ''}

                        ${d.recentIntervals.length ? `
                            <div class="space-y-2">
                                <h4 class="text-[10px] font-black text-muted-theme uppercase tracking-widest">Últimos intervalos entre visitas</h4>
                                <div class="flex flex-wrap gap-2">
                                    ${d.recentIntervals.map(i => `<span class="text-[11px] font-bold input-bg text-theme border border-theme px-2.5 py-1 rounded-full">${i} dias</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${(d.favoriteServices.length || d.favoriteBarberEntry) ? `
                            <div class="space-y-2">
                                <h4 class="text-[10px] font-black text-muted-theme uppercase tracking-widest">Preferências</h4>
                                <div class="flex flex-wrap gap-2">
                                    ${d.favoriteBarberEntry ? `<span class="text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-full">Barbeiro: ${App.escapeHTML(d.favoriteBarberEntry[0])}</span>` : ''}
                                    ${d.favoriteServices.slice(0, 3).map(([name, count]) => `
                                        <span class="text-[11px] font-bold input-bg text-theme border border-theme px-3 py-1.5 rounded-full">${App.escapeHTML(name)} · ${count}x</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${d.favoriteProducts.length ? `
                            <div class="space-y-2">
                                <h4 class="text-[10px] font-black text-muted-theme uppercase tracking-widest">Produtos favoritos</h4>
                                <div class="flex flex-wrap gap-2">
                                    ${d.favoriteProducts.map(([name, count]) => `
                                        <span class="text-[11px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-3 py-1.5 rounded-full">${App.escapeHTML(name)} · ${count}x</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Comparação mensal -->
                        <div class="space-y-2">
                            <h4 class="text-[10px] font-black text-muted-theme uppercase tracking-widest">Últimos 3 meses</h4>
                            <div class="grid grid-cols-3 gap-2">
                                ${d.months.map(m => `
                                    <div class="card-bg border border-theme/60 rounded-xl p-3 text-center">
                                        <p class="text-[9px] text-muted-theme uppercase font-bold tracking-widest">${m.label}</p>
                                        <p class="text-sm font-black text-theme mt-1">${m.visits}</p>
                                        <p class="text-[9px] text-muted-theme">visita(s)</p>
                                        <p class="text-[10px] font-bold text-amber-500 mt-1">${money(m.spent)}</p>
                                    </div>
                                `).join('')}
                            </div>
                            ${d.monthlyChangeText ? `<p class="text-[11px] text-muted-theme italic pt-1">${App.escapeHTML(d.monthlyChangeText)}</p>` : ''}
                        </div>

                        ${d.clientPlan ? `
                            <div class="space-y-2">
                                <h4 class="text-[10px] font-black text-muted-theme uppercase tracking-widest">Plano</h4>
                                <div class="card-bg border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-bold text-theme">${App.escapeHTML(d.clientPlan.plan?.name || 'Plano')}</p>
                                        <p class="text-[10px] text-muted-theme mt-0.5">Vence em ${dateBR(d.clientPlan.end_date)}</p>
                                        ${d.planUsageMonthlyAvg != null ? `<p class="text-[10px] text-muted-theme mt-0.5">Uso este mês: ${d.planUsageThisMonth}x · média histórica: ${d.planUsageMonthlyAvg}x</p>` : ''}
                                    </div>
                                    <div class="text-right shrink-0">
                                        <p class="text-lg font-black text-amber-500">${d.planUsage.length}</p>
                                        <p class="text-[9px] text-muted-theme uppercase font-bold tracking-widest">uso(s) total</p>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Preferências pessoais -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <h4 class="text-[10px] font-black text-muted-theme uppercase tracking-widest">Preferências pessoais</h4>
                                ${!this.state.editingClientPreferences ? `
                                    <button onclick="App.toggleEditClientPreferences()" class="text-[10px] text-amber-500 font-bold uppercase tracking-widest hover:underline">Editar</button>
                                ` : ''}
                            </div>
                            ${this.state.editingClientPreferences ? `
                                <textarea id="client-preferences-input" rows="3" placeholder="Ex: Corte degradê médio, máquina 0.5/1/2, gosta de café sem açúcar..." class="w-full input-bg border border-theme rounded-xl p-3 text-theme text-xs focus:border-amber-500 outline-none transition-colors">${App.escapeHTML(client.preferences?.notes || '')}</textarea>
                                <div class="flex gap-2">
                                    <button onclick="App.saveClientPreferences('${client.id}')" class="flex-1 py-2 bg-amber-500 text-zinc-950 text-xs font-bold rounded-lg active:scale-95 transition-all">Salvar</button>
                                    <button onclick="App.toggleEditClientPreferences()" class="flex-1 py-2 input-bg text-muted-theme text-xs font-bold rounded-lg border border-theme active:scale-95 transition-all">Cancelar</button>
                                </div>
                            ` : `
                                <p class="text-xs text-muted-theme italic leading-relaxed">${client.preferences?.notes ? App.escapeHTML(client.preferences.notes) : 'Nenhuma preferência registrada ainda.'}</p>
                            `}
                        </div>

                        <!-- Timeline -->
                        ${d.timeline.length ? `
                            <div class="space-y-2">
                                <h4 class="text-[10px] font-black text-muted-theme uppercase tracking-widest">Histórico recente</h4>
                                <div class="space-y-2">
                                    ${d.timeline.map(t => `
                                        <div class="flex items-center justify-between gap-3 card-bg border border-theme/50 rounded-xl p-3">
                                            <div class="min-w-0">
                                                <p class="text-xs font-bold text-theme truncate">${App.escapeHTML(t.label)}</p>
                                                <p class="text-[10px] text-muted-theme">${dateBR(t.date)}${t.products.length ? ` · ${t.products.map(App.escapeHTML).join(', ')}` : ''}</p>
                                            </div>
                                            <p class="text-xs font-bold text-amber-500 shrink-0">${money(t.value)}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : `
                            <p class="text-xs text-muted-theme italic text-center py-6">Nenhum atendimento concluído registrado ainda.</p>
                        `}
                    </div>
                </div>
            </div>`;
    },

    // ============================================================
    // PAINEL GERAL DE CLIENTES (aba Barbearia > Painel)
    // ============================================================

    openClientsPanel() {
        this.state.adminShopTab = 'painel';
        this.loadClientsPanelData();
    },

    setClientsPanelFilter(filter) {
        this.state.clientsPanelFilter = filter;
        this.render();
    },

    // Cancelamentos feitos pelo CLIENTE nos últimos 7 dias — alimenta a notificação do
    // sino. Consulta leve (filtrada por data), então pode rodar no login e sempre que o
    // sino é aberto, sem o mesmo custo da busca de "clientes em atenção".
    async loadRecentCancellations() {
        const since = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        try {
            const { data, error } = await supabaseClient
                .from('appointments')
                .select('id, client_id, client_name, client_phone, date, time, service_names, cancelled_by_role')
                .eq('status', 'cancelled')
                .eq('cancelled_by_role', 'client')
                .gte('date', since)
                .order('date', { ascending: false });

            if (error) throw error;
            this.state.recentCancellations = data || [];
        } catch (e) {
            // Provavelmente a coluna cancelled_by_role ainda não existe (migração não
            // rodada) — degrada em silêncio, essa categoria só fica vazia.
            this.state.recentCancellations = [];
        }
    },

    async loadClientsPanelData() {
        this.state.isLoadingClientsPanel = true;
        this.render();

        try {
            const { data: appts, error } = await supabaseClient
                .from('appointments')
                .select('id, client_id, date, service_names, service_numeric_value, comanda_items, barber_id, barber_name')
                .eq('status', 'completed')
                .not('client_id', 'is', null)
                .order('date', { ascending: true });

            if (error) throw error;
            const appointments = appts || [];
            const apptIds = appointments.map(a => a.id);

            let transactions = [];
            if (apptIds.length > 0) {
                const { data: txs } = await supabaseClient
                    .from('transactions')
                    .select('appointment_id, numeric_value')
                    .in('appointment_id', apptIds);
                transactions = txs || [];
            }

            const byClient = {};
            appointments.forEach(a => {
                if (!byClient[a.client_id]) byClient[a.client_id] = [];
                byClient[a.client_id].push(a);
            });

            const summaries = Object.entries(byClient).map(([clientId, apts]) => {
                const client = CLIENTES.find(c => c.id === clientId) || { id: clientId, name: 'Cliente removido' };
                const apptIdSet = new Set(apts.map(a => a.id));
                const clientTx = transactions.filter(t => apptIdSet.has(t.appointment_id));
                return this.computeClientInsights(client, { appointments: apts, transactions: clientTx, clientPlan: null, planUsage: [] });
            });

            this.state.clientsPanelData = summaries;
        } catch (e) {
            console.error('Erro ao carregar Painel de Clientes:', e);
            this.showNotification('Erro', 'Não foi possível carregar o painel de clientes.');
            this.state.clientsPanelData = [];
        } finally {
            this.state.isLoadingClientsPanel = false;
            this.render();
        }
    },

    renderClientsPanelTab() {
        if (this.state.isLoadingClientsPanel || !this.state.clientsPanelData) {
            return `
                <div class="p-12 text-center text-muted-theme space-y-3 fade-in">
                    <i data-lucide="refresh-cw" class="w-8 h-8 mx-auto animate-spin opacity-30"></i>
                    <p class="text-[10px] font-bold tracking-widest uppercase opacity-40">Calculando situação dos clientes...</p>
                </div>`;
        }

        const money = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',')}`;
        const rank = { 'Ausente': 0, 'Em risco': 1, 'Frequência diminuindo': 2, 'Ativo': 3 };
        const now = new Date();
        const isBirthdayMonth = (c) => {
            // birth_date pode estar salvo como YYYY-MM-DD ou DD/MM/YYYY (legado) — o mês
            // fica sempre na posição [1] em ambos os formatos.
            const bd = c.client.birth_date;
            if (!bd) return false;
            const month = parseInt(bd.split(/[\/-]/)[1], 10);
            return !isNaN(month) && (month - 1) === now.getMonth();
        };

        let data = [...this.state.clientsPanelData];
        const filter = this.state.clientsPanelFilter;
        if (filter === 'atencao') data = data.filter(c => c.status && ['Ausente', 'Em risco', 'Frequência diminuindo'].includes(c.status.label));
        else if (filter === 'ativos') data = data.filter(c => c.status?.label === 'Ativo');
        else if (filter === 'novos') data = data.filter(c => c.isNew);
        else if (filter === 'aniversariantes') data = data.filter(isBirthdayMonth);

        data.sort((a, b) => {
            const ra = a.status ? rank[a.status.label] : 4;
            const rb = b.status ? rank[b.status.label] : 4;
            if (ra !== rb) return ra - rb;
            return (b.daysSinceLastVisit || 0) - (a.daysSinceLastVisit || 0);
        });

        const counts = {
            atencao: this.state.clientsPanelData.filter(c => c.status && ['Ausente', 'Em risco', 'Frequência diminuindo'].includes(c.status.label)).length,
            ativos: this.state.clientsPanelData.filter(c => c.status?.label === 'Ativo').length,
            novos: this.state.clientsPanelData.filter(c => c.isNew).length,
            aniversariantes: this.state.clientsPanelData.filter(isBirthdayMonth).length
        };

        const colorMap = { emerald: 'emerald-500', amber: 'amber-500', rose: 'rose-500' };

        return `
            <div class="space-y-4 fade-in">
                <div class="flex items-center justify-between gap-2">
                    <p class="text-[11px] text-muted-theme leading-relaxed">Visão de retenção: clientes ordenados por quem mais precisa de atenção primeiro.</p>
                    ${!location.pathname.endsWith('clientes.html') ? `
                        <a href="clientes.html" target="_blank" class="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-violet-400 hover:bg-violet-500/10 transition-all active:scale-95 whitespace-nowrap">
                            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>Tela cheia
                        </a>
                    ` : ''}
                </div>

                <div class="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <button onclick="App.setClientsPanelFilter('atencao')" class="shrink-0 text-[11px] font-bold px-3 py-2 rounded-lg border ${filter === 'atencao' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'input-bg text-muted-theme border-theme'}">Precisam de atenção (${counts.atencao})</button>
                    <button onclick="App.setClientsPanelFilter('ativos')" class="shrink-0 text-[11px] font-bold px-3 py-2 rounded-lg border ${filter === 'ativos' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'input-bg text-muted-theme border-theme'}">Ativos (${counts.ativos})</button>
                    <button onclick="App.setClientsPanelFilter('novos')" class="shrink-0 text-[11px] font-bold px-3 py-2 rounded-lg border ${filter === 'novos' ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' : 'input-bg text-muted-theme border-theme'}">Novos (${counts.novos})</button>
                    <button onclick="App.setClientsPanelFilter('aniversariantes')" class="shrink-0 text-[11px] font-bold px-3 py-2 rounded-lg border ${filter === 'aniversariantes' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'input-bg text-muted-theme border-theme'}">Aniversariantes (${counts.aniversariantes})</button>
                    <button onclick="App.setClientsPanelFilter('all')" class="shrink-0 text-[11px] font-bold px-3 py-2 rounded-lg border ${filter === 'all' ? 'input-bg text-amber-500 border-amber-500/30' : 'input-bg text-muted-theme border-theme'}">Todos</button>
                </div>

                <div class="space-y-2">
                    ${data.length === 0 ? `
                        <div class="p-10 text-center text-muted-theme space-y-2">
                            <i data-lucide="party-popper" class="w-7 h-7 mx-auto opacity-30"></i>
                            <p class="text-[11px] font-bold uppercase tracking-widest opacity-50">Nenhum cliente nesse filtro.</p>
                        </div>
                    ` : data.map(c => {
            const statusColor = c.status ? colorMap[c.status.color] : 'zinc-500';
            return `
                            <button onclick="App.openClientInsights('${c.client.id}')" class="w-full text-left card-bg border border-theme/50 rounded-2xl p-3 flex items-center gap-3 hover:border-${statusColor}/40 transition-colors">
                                <div class="w-10 h-10 rounded-full input-bg border border-theme flex items-center justify-center font-bold text-theme shrink-0">
                                    ${(c.client.name || 'C')[0].toUpperCase()}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-bold text-theme truncate">${App.escapeHTML(c.client.name || 'Cliente')}</p>
                                    <p class="text-[10px] text-muted-theme">${c.lastVisitDate ? `Última visita: ${c.daysSinceLastVisit}d atrás` : 'Sem visitas'} ${c.avgFrequencyDays ? `· média ${c.avgFrequencyDays}d` : ''}${this.formatBirthDate(c.client.birth_date) ? ` · 🎂 ${this.formatBirthDate(c.client.birth_date)}` : ''}</p>
                                </div>
                                <div class="text-right shrink-0">
                                    ${c.status ? `<span class="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-${statusColor}/10 text-${statusColor} border border-${statusColor}/20 px-2 py-1 rounded-full">${c.status.emoji} ${c.status.label}</span>` : `<span class="text-[9px] font-black uppercase tracking-widest bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-2 py-1 rounded-full">Novo</span>`}
                                    <p class="text-[10px] font-bold text-amber-500 mt-1">${money(c.totalSpent)}</p>
                                </div>
                            </button>
                        `;
        }).join('')}
                </div>
            </div>`;
    },

    // ============================================================
    // SINO DE NOTIFICAÇÕES (aniversariantes, planos vencendo, clientes em atenção)
    // ============================================================

    isBirthdayMonth(client) {
        const bd = client?.birth_date;
        if (!bd) return false;
        const month = parseInt(bd.split(/[\/-]/)[1], 10);
        return !isNaN(month) && (month - 1) === new Date().getMonth();
    },

    // Usado só pela notificação do sino — mais restrito que isBirthdayMonth (que ainda
    // alimenta o filtro "Aniversariantes" do Painel de Clientes, onde faz sentido ver o mês todo).
    isBirthdayToday(client) {
        const bd = client?.birth_date;
        if (!bd) return false;
        let day, month;
        if (bd.includes('/')) {
            const [d, m] = bd.split('/');
            day = parseInt(d, 10); month = parseInt(m, 10);
        } else {
            const [, m, d] = bd.split('-');
            day = parseInt(d, 10); month = parseInt(m, 10);
        }
        const now = new Date();
        return !isNaN(day) && !isNaN(month) && day === now.getDate() && (month - 1) === now.getMonth();
    },

    // --- Armazenamento local de "lidas/dispensadas" (por navegador, sem mudança de banco) ---
    // Cada notificação tem um id estável (ex: "plan:<client_plan_id>"). Dispensar guarda
    // {id: timestamp}. Se o problema de origem ainda existir depois de NOTIF_SNOOZE_DAYS,
    // a notificação volta a aparecer sozinha — o barbeiro precisa resolver, não só esconder.
    NOTIF_STORAGE_KEY: 'finotrato-notif-dismissed',
    NOTIF_SNOOZE_DAYS: 2,

    _loadDismissedNotifs() {
        try { return JSON.parse(localStorage.getItem(this.NOTIF_STORAGE_KEY)) || {}; }
        catch (e) { return {}; }
    },

    _saveDismissedNotifs(map) {
        try { localStorage.setItem(this.NOTIF_STORAGE_KEY, JSON.stringify(map)); }
        catch (e) { /* localStorage indisponível (modo privado etc) — segue sem persistir */ }
    },

    dismissNotification(notifId) {
        const map = this._loadDismissedNotifs();
        map[notifId] = Date.now();
        this._saveDismissedNotifs(map);
        this.render();
    },

    dismissAllNotifications() {
        const { visible } = this.getNotificationsSummary();
        const map = this._loadDismissedNotifs();
        const now = Date.now();
        visible.forEach(item => { map[item.id] = now; });
        this._saveDismissedNotifs(map);
        this.render();
    },

    // Monta a lista "bruta" de notificações (com id estável) a partir de dados já em
    // memória (sem query nova), depois filtra o que está dispensado e ainda dentro do
    // prazo de soneca — isso vira "visible", que é o que aparece na caixa e conta no sino.
    getNotificationsSummary() {
        const today = new Date().toISOString().split('T')[0];
        const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

        const items = [];

        (typeof CLIENTES !== 'undefined' ? CLIENTES : []).forEach(c => {
            if (this.isBirthdayToday(c)) {
                items.push({
                    id: `birthday:${c.id}:${today}`,
                    type: 'birthday',
                    clientId: c.id,
                    title: c.name || 'Cliente',
                    subtitle: 'Aniversário é hoje! 🎉'
                });
            }
        });

        (this.state.clientPlans || [])
            .filter(cp => cp.status === 'active' && cp.end_date >= today && cp.end_date <= in3Days)
            .sort((a, b) => a.end_date.localeCompare(b.end_date))
            .forEach(cp => {
                const client = CLIENTES.find(c => c.id === cp.client_id);
                const daysLeft = Math.max(0, Math.round((new Date(`${cp.end_date}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000));
                const endDateBR = new Date(`${cp.end_date}T00:00:00`).toLocaleDateString('pt-BR');
                items.push({
                    id: `plan:${cp.id}`,
                    type: 'plan',
                    clientId: cp.client_id,
                    title: client?.name || 'Cliente',
                    subtitle: `${cp.plan?.name || 'Plano'} · vence em ${endDateBR}`,
                    badge: daysLeft === 0 ? 'Vence hoje' : `${daysLeft}d`
                });
            });

        (this.state.clientsPanelData || [])
            .filter(c => c.status && ['Ausente', 'Em risco', 'Frequência diminuindo'].includes(c.status.label))
            .forEach(c => {
                items.push({
                    id: `attention:${c.client.id}:${c.status.label}`,
                    type: 'attention',
                    clientId: c.client.id,
                    title: c.client.name || 'Cliente',
                    subtitle: `${c.status.emoji} ${c.status.label}`
                });
            });

        (this.state.recentCancellations || []).forEach(apt => {
            const dateBR = new Date(`${apt.date}T00:00:00`).toLocaleDateString('pt-BR');
            items.push({
                id: `cancelled:${apt.id}`,
                type: 'cancelled',
                clientId: apt.client_id || null,
                phone: apt.client_phone || null,
                title: apt.client_name || 'Cliente',
                subtitle: `Cancelou ${apt.service_names || 'o atendimento'} de ${dateBR} às ${apt.time}`
            });
        });

        const dismissed = this._loadDismissedNotifs();
        const snoozeMs = this.NOTIF_SNOOZE_DAYS * 24 * 60 * 60 * 1000;
        const isSnoozed = (item) => {
            const t = dismissed[item.id];
            if (!t) return false;
            // Cancelamento é um evento pontual — uma vez dispensado, não volta (diferente
            // das outras categorias, que são condições contínuas e merecem reaparecer
            // depois de um tempo se ainda não foram resolvidas).
            if (item.type === 'cancelled') return true;
            return (Date.now() - t) < snoozeMs;
        };

        const visible = items.filter(it => !isSnoozed(it));

        return { items, visible, total: visible.length };
    },

    toggleNotificationsPanel() {
        this.state.isNotificationsPanelOpen = !this.state.isNotificationsPanelOpen;
        // Recalcula "clientes em atenção" toda vez que o sino é aberto — o cliente pode ter
        // sido atendido/renovado desde a última vez, e esse dado não entra no polling automático
        // do app (é pesado demais pra rodar em segundo plano o tempo todo).
        if (this.state.isNotificationsPanelOpen && !this.state.isLoadingClientsPanel) {
            // Cancelamentos são uma consulta leve, sempre atualiza junto sem custo extra.
            // Não chama render() sozinha, então força um re-render quando terminar (o
            // loadClientsPanelData() abaixo pode terminar antes ou depois dela).
            this.loadRecentCancellations().then(() => this.render());
            // loadClientsPanelData() já chama this.render() sozinha (no início e no fim).
            // Chamar render() de novo aqui recriava o modal do zero com o MESMO conteúdo,
            // reiniciando a animação de entrada — era isso que parecia "piscar 2x" ao abrir.
            this.loadClientsPanelData();
        } else {
            this.render();
        }
    },

    closeNotificationsPanel() {
        this.state.isNotificationsPanelOpen = false;
        this.state._notifPanelAnimated = false; // reseta pra animar de novo na próxima abertura
        this.render();
    },

    renderNotificationsPanel() {
        const { visible } = this.getNotificationsSummary();
        const isEmpty = visible.length === 0 && !this.state.isLoadingClientsPanel;

        // O carregamento dos "clientes em atenção" gera pelo menos 2 renders (carregando →
        // carregado). Como o modal é recriado do zero a cada render (innerHTML), a animação
        // de entrada reiniciaria em cada um — parecendo "piscar" várias vezes. Por isso ela só
        // toca na primeira vez que o sino abre; atualizações seguintes ficam paradas.
        const isFreshOpen = !this.state._notifPanelAnimated;
        this.state._notifPanelAnimated = true;

        const typeMeta = {
            plan: { label: 'Planos vencendo', color: 'amber-500', icon: 'hourglass' },
            birthday: { label: 'Aniversário hoje', color: 'violet-400', icon: null },
            attention: { label: 'Clientes que precisam de atenção', color: 'rose-400', icon: 'alert-triangle' },
            cancelled: { label: 'Cancelamentos recentes', color: 'rose-500', icon: 'calendar-x' }
        };

        const renderRow = (item) => {
            // Cliente avulso (sem conta) não tem clientId pra abrir o Perfil 360° — nesse
            // caso, se tiver telefone, vira um link de WhatsApp; senão, fica só informativo.
            const mainContent = `
                    <div class="min-w-0">
                        <p class="text-xs font-bold text-theme truncate">${App.escapeHTML(item.title)}</p>
                        <p class="text-[10px] text-muted-theme truncate">${App.escapeHTML(item.subtitle)}</p>
                    </div>
                    ${item.badge ? `<span class="text-[10px] font-black uppercase text-${typeMeta[item.type].color} shrink-0">${App.escapeHTML(item.badge)}</span>` : ''}
                `;
            const cardClasses = `flex-1 min-w-0 text-left flex items-center justify-between gap-2 card-bg border border-${typeMeta[item.type].color}/20 rounded-xl p-3 hover:border-${typeMeta[item.type].color}/40 transition-colors`;

            const mainEl = item.clientId
                ? `<button onclick="App.openClientInsights('${item.clientId}')" class="${cardClasses}">${mainContent}</button>`
                : item.phone
                    ? `<a href="https://wa.me/${App.formatWA(item.phone)}" target="_blank" class="${cardClasses}">${mainContent}</a>`
                    : `<div class="${cardClasses} cursor-default">${mainContent}</div>`;

            return `
            <div class="flex items-stretch gap-1.5">
                ${mainEl}
                <button onclick="App.dismissNotification('${item.id}')" title="Dispensar" class="w-9 shrink-0 rounded-xl input-bg border border-theme text-muted-theme hover:text-rose-400 hover:border-rose-500/30 transition-colors flex items-center justify-center active:scale-95">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                </button>
            </div>`;
        };

        const sections = ['plan', 'cancelled', 'birthday', 'attention'].map(type => {
            const rows = visible.filter(it => it.type === type);
            if (type === 'attention' && this.state.isLoadingClientsPanel) {
                return `
                    <div class="space-y-2">
                        <h4 class="text-[10px] font-black text-${typeMeta.attention.color} uppercase tracking-widest flex items-center gap-1.5">
                            <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> ${typeMeta.attention.label}
                        </h4>
                        <div class="flex items-center gap-2 text-[11px] text-muted-theme p-3">
                            <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Calculando situação dos clientes...
                        </div>
                    </div>`;
            }
            if (rows.length === 0) return '';
            const meta = typeMeta[type];
            return `
                <div class="space-y-2">
                    <h4 class="text-[10px] font-black text-${meta.color} uppercase tracking-widest flex items-center gap-1.5">
                        ${meta.icon ? `<i data-lucide="${meta.icon}" class="w-3.5 h-3.5"></i>` : '🎂'} ${meta.label} (${rows.length})
                    </h4>
                    <div class="space-y-1.5">
                        ${rows.slice(0, 10).map(renderRow).join('')}
                        ${rows.length > 10 ? `<a href="clientes.html" target="_blank" class="block text-center text-[10px] text-amber-500 font-bold uppercase tracking-widest pt-1 hover:underline">Ver todos (${rows.length}) →</a>` : ''}
                    </div>
                </div>`;
        }).join('');

        return `
            <div class="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-16 md:pt-20 bg-zinc-950/80 backdrop-blur-sm ${isFreshOpen ? 'fade-in' : ''}" onclick="if(event.target === this) App.closeNotificationsPanel()">
                <div class="card-bg w-full max-w-md rounded-3xl border border-theme shadow-2xl ${isFreshOpen ? 'scale-in' : ''} flex flex-col max-h-[80vh]">
                    <div class="flex justify-between items-center p-5 pb-3 shrink-0">
                        <h3 class="text-lg font-black text-theme flex items-center gap-2">
                            <i data-lucide="bell" class="w-5 h-5 text-amber-500"></i> Notificações
                        </h3>
                        <div class="flex items-center gap-2">
                            ${visible.length > 0 ? `
                                <button onclick="App.dismissAllNotifications()" class="text-[10px] font-bold text-muted-theme hover:text-amber-500 uppercase tracking-widest transition-colors" title="Marcar tudo como lido">
                                    Limpar tudo
                                </button>
                            ` : ''}
                            <button onclick="App.closeNotificationsPanel()" class="w-9 h-9 rounded-full card-bg flex items-center justify-center text-muted-theme hover:text-theme transition-colors border border-theme">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                    <div class="overflow-y-auto px-5 pb-5 space-y-5 custom-scrollbar">
                        ${isEmpty ? `
                            <div class="py-10 text-center text-muted-theme space-y-2">
                                <i data-lucide="party-popper" class="w-7 h-7 mx-auto opacity-30"></i>
                                <p class="text-[11px] font-bold uppercase tracking-widest opacity-50">Tudo em dia por aqui</p>
                            </div>
                        ` : sections}
                    </div>
                </div>
            </div>`;
    }
});
