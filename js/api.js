Object.assign(App, {
    async init() {
        this.state.isLoading = true;
        // Tentar carregar dados do cache primeiro (instantâneo)
        this.loadCache();
        this.render(); // Renderização inicial com cache (se houver)

        // 1. Verificar sessão primeiro (evita colisão de locks do Supabase Auth)
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        // 2. Carregar dados em paralelo agora que o canal de auth está livre
        await this.loadInitialData();

        const user = session?.user;
        if (user) {
            await this.loadSession(user);
            
            // Carregar dados específicos do usuário logado em paralelo
            await Promise.all([
                this.loadAppointments(),
                this.loadTransactions(),
                this.loadProfiles(),
                this.loadPlans(),
                this.loadClientPlans()
            ]);
            // Uso semanal depende de clientPlans já carregado
            await this.loadPlanUsage();
            
            this.setupRealtime();
        }

        this.state.isCheckingAuth = false;
        this.state.isLoading = false;
        this.applyTheme();
        this.render();
        this.applyMasks();
    },

    loadCache() {
        try {
            const cachedSettings = localStorage.getItem('shop_settings');
            const cachedServices = localStorage.getItem('services');

            if (cachedSettings) this.state.shopSettings = JSON.parse(cachedSettings);
            if (cachedServices) SERVICES = JSON.parse(cachedServices);
        } catch (e) {
            console.error("Erro ao carregar cache:", e);
        }
    },
    
    // Auxiliares para Input de Data Nativo
    dbToInputDate(dateStr) {
        if (!dateStr) return '';
        // Caso já esteja no formato YYYY-MM-DD
        if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) return dateStr;
        
        // Caso esteja DD/MM/YYYY
        if (dateStr.includes('/')) {
            const [d, m, y] = dateStr.split('/');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        
        // Caso esteja YYYYMMDD ou similar (limpo)
        if (dateStr.length === 8) {
            return `${dateStr.substring(4,8)}-${dateStr.substring(2,4)}-${dateStr.substring(0,2)}`;
        }
        
        return dateStr;
    },

    inputToDbDate(dateStr) {
        if (!dateStr || !dateStr.includes('-')) return dateStr;
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    },

    async loadInitialData() {
        // Disparar todas as consultas em paralelo
        const [svcsRes, brbsRes, blocksRes, settingsRes, statsRes, specsRes, bCfgRes, bSlotsRes, bExRes, catsRes, prodsRes] = await Promise.all([
            supabaseClient.from('services').select('*'),
            supabaseClient.from('barbers').select('*'),
            supabaseClient.from('blocked_times').select('*'),
            supabaseClient.from('shop_settings').select('*').limit(1).single(),
            supabaseClient.from('appointments').select('id, date, time, barber_id, total_duration').eq('status', 'pending'),
            supabaseClient.from('barber_services').select('*'),
            supabaseClient.from('barber_config').select('*'),
            supabaseClient.from('barber_slots').select('*'),
            supabaseClient.from('barber_exceptions').select('*'),
            supabaseClient.from('categories').select('*'),
            supabaseClient.from('products').select('*')
        ]);

        // Processar Serviços
        if (svcsRes.data) {
            SERVICES = svcsRes.data
                .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
                .map((s, idx) => ({
                    id: s.id, name: s.name, price: s.price, priceValue: s.price_value,
                    duration: s.duration, durationMinutes: s.duration_minutes,
                    sort_order: s.sort_order ?? idx,
                    price_variable: s.price_variable ?? false
                }));
            localStorage.setItem('services', JSON.stringify(SERVICES));
        }

        if (catsRes && catsRes.data) CATEGORIES = catsRes.data;
        if (prodsRes && prodsRes.data) PRODUCTS = prodsRes.data;

        // Processar Barbeiros
        if (brbsRes.data) BARBERS = brbsRes.data;

        // Processar Bloqueios
        if (blocksRes.data) {
            this.state.blockedTimesFull = blocksRes.data;
            this.state.blockedTimes = blocksRes.data.filter(b => !b.barber_id && !b.date).map(b => b.blocked_time) || [];
        }

        // Processar Especialidades (Mapeamento Barbeiro x Serviço)
        this.state.barberServices = specsRes.data || [];

        // Processar Estatísticas de Ocupação
        if (statsRes.data) this.state.allAppointmentsForStats = statsRes.data;

        // Processar Configurações
        if (settingsRes.data) {
            this.state.shopSettings = settingsRes.data;
            localStorage.setItem('shop_settings', JSON.stringify(settingsRes.data));
        } else if (!this.state.shopSettings) {
            // Fallback apenas se não houver cache nem dado novo
            this.state.shopSettings = {
                name: 'FinnoTrato Barbearia',
                logo_url: null,
                slogan: 'A melhor experiência em estilo e cuidado.',
                address_street: 'Rua da Tesoura, 123',
                address_city: 'Bairro Nova Estética - Cidade SP',
                phone: '(11) 99999-9999',
                whatsapp: '5511999999999',
                instagram_url: 'https://instagram.com',
                facebook_url: 'https://facebook.com',
                google_review_url: 'https://maps.google.com/?q=FinnoTrato+Barber+Avaliar',
                commission_rate: 100,
                working_days: [1, 2, 3, 4, 5, 6] // Default: Seg-Sab
            };
        } else if (this.state.shopSettings && !this.state.shopSettings.working_days) {
            this.state.shopSettings.working_days = [1, 2, 3, 4, 5, 6];
        }

        // Processar Configurações de Escala dos Barbeiros
        this.state.barberConfigs = bCfgRes.data || [];
        this.state.barberSlots = bSlotsRes.data || [];
        this.state.barberExceptions = bExRes.data || [];

    },

    async loadProfiles() {
        const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);
        if (!isStaff || !this.state.isAuthenticated) return;

        let query = supabaseClient.from('profiles').select('*');
        
        // Se for admin, vê todos. Se for staff básico (barbeiro), vê apenas clientes.
        if (this.state.role !== 'admin') {
            query = query.eq('role', 'client');
        }

        const { data: userProfiles, error } = await query.order('name', { ascending: true });
        
        if (error) {
            console.error("Erro ao carregar perfis:", error);
            return;
        }

        if (userProfiles) {
            CLIENTES = userProfiles;
            console.log(`✅ Carregados ${userProfiles.length} perfis de clientes/equipe.`);
        }
    },

    async loadAppointments() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        // Limpando a consulta para ser direto ao ponto (sem Joins/relacionamentos)
        let query = supabaseClient.from('appointments').select('*').eq('status', 'pending');

        if (this.state.role === 'client') {
            query = query.eq('client_id', user.id);
        } else if (this.state.role === 'barber') {
            // Barbeiro vê apenas sua própria agenda
            query = query.eq('barber_id', user.id);
        }
        // Admin e Gerente não aplicam filtros, vendo a agenda completa.

        const { data: apts, error } = await query.order('date', { ascending: true }).order('time', { ascending: true });

        if (error) {
            console.error("DEBUG SUPABASE ERROR:", error);
            return;
        }

        if (apts) {
            this.state.appointments = apts.map(a => {
                let phone = a.client_phone || '';
                // Fallback legado: Tentar buscar do perfil do cliente caso o agendamento manual não tenha salvo
                if (!phone && a.client_id && typeof CLIENTES !== 'undefined') {
                    const prof = CLIENTES.find(c => c.id === a.client_id);
                    if (prof && prof.phone) phone = prof.phone;
                }
                
                return {
                    id: a.id,
                    clientName: a.client_name,
                    clientPhone: phone,
                    barberName: a.barber_name,
                    service: { name: a.service_names, price: a.service_price },
                    numericValue: a.service_numeric_value,
                    date: a.date,
                    time: a.time,
                    status: a.status,
                    barber_id: a.barber_id,
                    clientAvatar: a.client_avatar,
                    total_duration: a.total_duration,
                    comanda_items: a.comanda_items || []
                };
            });
            
            // Agendar próxima notificação local (30 min antes)
            this.scheduleNextNotification();
        }
    },

    async loadTransactions() {
        if (!this.state.isAuthenticated) return;

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        let query = supabaseClient.from('transactions').select('*');
        
        if (this.state.role === 'barber') {
            // Barbeiro só vê suas próprias transações finalizadas
            query = query.eq('barber_id', user.id);
        }

        const { data: txs } = await query.order('completed_at', { ascending: false });
        if (txs) {
            this.state.completedTransactions = txs.map(t => {
                // Tenta encontrar o nome do barbeiro no array global BARBERS usando o barber_id
                const barber = BARBERS.find(b => String(b.user_id) === String(t.barber_id));
                return {
                    id: t.id,
                    clientName: t.client_name,
                    service: { name: t.service_name },
                    paymentMethod: t.payment_method,
                    numericValue: t.numeric_value,
                    barberName: barber ? barber.name : (t.barber_name || 'Profissional'),
                    barberId: t.barber_id, // Importante para o financeiro
                    date: t.date,
                    time: t.time,
                    completedAt: t.completed_at,
                    isSettled: t.is_settled || false
                };
            });
        }
    },

    async loadPayouts() {
        if (!this.state.isAuthenticated) return;
        
        const { data: payouts, error } = await supabaseClient
            .from('payouts')
            .select('*')
            .order('payout_date', { ascending: false });
            
        if (!error && payouts) {
            this.state.payouts = payouts;
        }
    },

    async processBarberPayout(barberId, amount, type) {
        if (!this.state.isAuthenticated) return { error: 'Não autenticado' };

        const { data: { user } } = await supabaseClient.auth.getUser();
        
        // 1. Registrar o Pagamento
        const { data: payout, error: payoutError } = await supabaseClient
            .from('payouts')
            .insert([{
                barber_id: barberId,
                amount: amount,
                type: type, // 'advance' ou 'full'
                admin_id: user.id
            }])
            .select()
            .single();

        if (payoutError) throw payoutError;

        // 2. Se for quitação total, marcar as transações como quitadas
        if (type === 'full') {
            const { error: updateError } = await supabaseClient
                .from('transactions')
                .update({ is_settled: true })
                .eq('barber_id', barberId)
                .eq('is_settled', false);

            if (updateError) throw updateError;
        }

        // 3. Atualizar Estado Local
        await Promise.all([
            this.loadTransactions(),
            this.loadPayouts()
        ]);

        return { success: true };
    },

    async wipeDatabaseForLaunch() {
        if (!this.state.isAuthenticated) return { error: 'Não autenticado' };

        try {
            // A ORDEM É CRÍTICA PARA INIBIR (409 Conflict Foreign Keys constraints)
            // 1. Transactions referenciam appointments (então apague TODAS as transactions primeiro usando um selector limpo null-check)
            await supabaseClient.from('transactions').delete().not('id', 'is', null);
            
            // 2. Pode apagar os repasses de barbeiros
            await supabaseClient.from('payouts').delete().not('id', 'is', null);
            
            // 3. O caminho principal pra agenda agora está limpo de trancas de banco, pode apagar todos.
            await supabaseClient.from('appointments').delete().not('id', 'is', null);

            // Recarregar o estado base do App
            await Promise.all([
                this.loadTransactions(),
                this.loadPayouts(),
                this.fetchFullUpdate()
            ]);

            return { success: true };
        } catch (error) {
            console.error("Erro na limpeza massiva Wipe:", error);
            return { error: error.message };
        }
    },

    async resetGlobalFinancials() {
        if (!this.state.isAuthenticated) return { error: 'Não autenticado' };

        try {
            // 1. Marcar todas as transações finalizadas e pendentes como quitadas
            const { error: txError } = await supabaseClient
                .from('transactions')
                .update({ is_settled: true })
                .eq('is_settled', false);

            if (txError) throw txError;

            // 2. Limpar a tabela de payouts se possível (hack usando neq zero para contornar restrições sem id)
            await supabaseClient.from('payouts').delete().neq('amount', 0);

            // 3. Recarregar estado
            await Promise.all([
                this.loadTransactions(),
                this.loadPayouts()
            ]);

            return { success: true };
        } catch (error) {
            console.error("Erro no reset do financeiro:", error);
            return { error: error.message };
        }
    },

    // ─────────────────────────────────────────────────────────────────
    // 🛡️ PROTEÇÃO DE ESTADO — Detecta interação ativa do usuário
    // ─────────────────────────────────────────────────────────────────

    _hasActiveInteraction() {
        // Retorna true se QUALQUER usuário estiver em modo de edição ou interação ativa.
        // Nesse caso, o render automático (polling/realtime) é suprimido para não
        // destruir trabalho em andamento. Os dados são atualizados no state silenciosamente
        // e o render ocorrerá na próxima ação do usuário.
        return !!(
            // --- Edições inline no dashboard do barbeiro ---
            this.state.editingPriceId ||
            this.state.editingServicesId ||
            this.state.editingDurationId ||
            this.state.editingTimeId ||

            // --- Modais de pagamento ---
            this.state.showingSplitPaymentId ||
            this.state.confirmingPaymentId ||

            // --- Modal da comanda ---
            this.state.comandaModalOpen ||

            // --- Fluxo de agendamento (cliente e staff) ---
            this.state.isBooking ||
            this.state.editingAppointmentId ||

            // --- Formulários de edição de perfil e configurações ---
            this.state.isEditingProfile ||
            this.state.isEditingShop ||
            this.state.editingServiceId
        );
    },

    setupRealtime() {
        // Limpar conexões e polling anteriores
        supabaseClient.removeAllChannels();
        this.stopPolling();

        // --- ESTRATÉGIA 1: WebSocket (Supabase Realtime) ---
        // Tenta usar o WebSocket nativo. Se funcionar, é instantâneo.
        let realtimeWorking = false;

        const monitors = [
            { table: 'appointments', label: 'Agenda', callback: async () => await this.fetchFullUpdate(true) },
            { table: 'transactions', label: 'Financeiro', callback: async () => {
                if (this.state.isAuthenticated) { await Promise.all([this.loadTransactions(), this.loadAppointments()]); if (!this._hasActiveInteraction()) this.render(); }
            }},
            { table: 'blocked_times', label: 'Bloqueios', callback: async () => { await this.loadInitialData(); if (!this._hasActiveInteraction()) this.render(); } },
            { table: 'shop_settings', label: 'Configurações', callback: async () => { await this.loadInitialData(); if (!this._hasActiveInteraction()) this.render(); } },
            { table: 'barbers', label: 'Equipe', callback: async () => { await this.loadInitialData(); if (!this._hasActiveInteraction()) this.render(); } },
            { table: 'services', label: 'Serviços', callback: async () => { await this.loadInitialData(); if (!this._hasActiveInteraction()) this.render(); } }
        ];

        monitors.forEach(mon => {
            supabaseClient.channel(`ch-${mon.table}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: mon.table }, async (payload) => {
                    realtimeWorking = true;
                    console.log(`⚡ [${mon.label}] Atualização via WebSocket!`, payload.eventType);
                    if (mon.table === 'appointments' && payload.eventType === 'INSERT') {
                        const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);
                        if (isStaff) { this.showNotification('Novo Agendamento!', `Às ${payload.new.time}.`); this.haptic('success'); }
                    }
                    await mon.callback();
                })
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        realtimeWorking = true;
                        console.log(`✅ [${mon.label}] Realtime WebSocket Ativo.`);
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        console.warn(`⚠️ [${mon.label}] WebSocket indisponível. Polling automático ativo.`);
                    }
                });
        });

        // --- ESTRATÉGIA 2: Polling Automático (Fallback Garantido) ---
        // Verifica silenciosamente se houve novos agendamentos a cada 15 segundos.
        // Funciona mesmo quando o WebSocket falha, sem precisar que o usuário atualize manualmente.
        this._startPolling();
    },

    _startPolling() {
        const POLL_INTERVAL = 10000; // 10 segundos
        let lastSignature = null; // Combinação de count + último timestamp

        const getSignature = async () => {
            if (!this.state.isAuthenticated) return null;
            
            try {
                // 1. Assinatura de Agendamentos (detecta novos lances, alterações na agenda ou mudança manual de preço)
                let aptQuery = supabaseClient
                    .from('appointments')
                    .select('id, service_names, date, time, service_numeric_value')
                    .eq('status', 'pending');

                const { data: { user } } = await supabaseClient.auth.getUser();
                if (!user) return null;

                if (this.state.role === 'barber') {
                    aptQuery = aptQuery.eq('barber_id', user.id);
                } else if (this.state.role === 'client') {
                    aptQuery = aptQuery.eq('client_id', user.id);
                }

                // 2. Assinatura de Serviços (detecta mudanças em preços globais, nomes ou novos serviços)
                const svcQuery = supabaseClient.from('services').select('id, name, price_value');

                // Executa em paralelo para performance
                const [aptRes, svcRes] = await Promise.all([aptQuery, svcQuery]);
                
                if (aptRes.error || svcRes.error || !aptRes.data || !svcRes.data) return null;

                // Gerar assinaturas ordenadas para evitar disparos falsos
                // Incluímos o valor numérico do serviço no agendamento para detectar mudanças no "botão verde"
                const aptSig = aptRes.data.map(a => `${a.id}:${a.service_names}:${a.date}:${a.time}:${a.service_numeric_value}`).sort().join('|');
                const svcSig = svcRes.data.map(s => `${s.id}:${s.name}:${s.price_value}`).sort().join(';');

                return `A[${aptSig}]-S[${svcSig}]`;
            } catch(e) {
                console.error("Erro ao gerar assinatura de polling:", e);
                return null;
            }
        };

        const poll = async () => {
            if (!this.state.isAuthenticated) return;
            
            const currentSignature = await getSignature();
            if (currentSignature === null) return;

            const currentItems = currentSignature ? currentSignature.split('|') : [];
            const currentCount = currentItems.length;
            
            // Primeira rodada: apenas registra o estado atual como referência
            if (lastSignature === null) {
                lastSignature = currentSignature;
                console.log(`🔄 [Polling] Referência inicial: ${currentCount} agendamentos.`);
                return;
            }

            // Se a assinatura mudou (seja por contagem ou conteúdo), atualiza tudo
            if (currentSignature !== lastSignature) {
                const prevItems = lastSignature ? lastSignature.split('|') : [];
                const prevCount = prevItems.length;
                
                lastSignature = currentSignature; // Atualiza ANTES do await para evitar duplo disparo
                console.log(`🔄 [Polling] Mudança detectada! (Contagem ou Conteúdo). Atualizando...`);
                
                const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);
                const isNewAppointment = currentCount > prevCount;
                
                if (isStaff && isNewAppointment) {
                    // Dispara alerta sonoro + notificação visual para o barbeiro
                    await this.alertNewAppointment();
                }
                
                await this.fetchFullUpdate(true);
            }
        };

        // Checagem inicial 3 segundos após o login
        setTimeout(poll, 3000);
        
        // Checagens periódicas a cada 15 segundos
        this._pollingTimer = setInterval(poll, POLL_INTERVAL);
        console.log(`🔄 Polling automático ativado (a cada ${POLL_INTERVAL / 1000}s como fallback)`);
    },

    stopPolling() {
        if (this._pollingTimer) {
            clearInterval(this._pollingTimer);
            this._pollingTimer = null;
            console.log('🛑 Polling desativado.');
        }
    },

    // ─────────────────────────────────────────────────────────────────
    // 🔔 SISTEMA DE ALERTAS — Som + Notificação para Barbeiro
    // ─────────────────────────────────────────────────────────────────

    async requestNotificationPermission() {
        if (!('Notification' in window)) return;
        if (!('serviceWorker' in navigator)) return;
        if (Notification.permission === 'denied') return;
        const VAPID_PUBLIC_KEY = 'BCnUM_K2sHA6y3uPG0-E89YVveHu7Ac6Zb8yDcyC5edo3bT6DvwdofYbJbZBTYPHBrP9p3m2yx4jSUpE5o1HedQ';
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') { console.warn('Permissao negada.'); return; }
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this._urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return;
            const { error } = await supabaseClient
                .from('push_subscriptions')
                .upsert({ user_id: user.id, subscription: subscription.toJSON() }, { onConflict: 'user_id' });
            if (error) { console.error('Erro ao salvar push:', error.message); }
            else { console.log('Push Web ativo - notificacoes funcionam com app fechado.'); }
        } catch(e) { console.warn('Web Push nao disponivel:', e.message); }
    },

    _urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        return Uint8Array.from([...window.atob(base64)].map(c => c.charCodeAt(0)));
    },

    /** Toca um som de alerta de barbearia usando Web Audio API (sem arquivo externo) */
    playAlertSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Sequência de tons: dois bipes curtos + um longo (estilo campainha)
            const notes = [
                { freq: 880, start: 0,    duration: 0.12 },  // Lá5
                { freq: 880, start: 0.15, duration: 0.12 },  // Lá5
                { freq: 1174,start: 0.35, duration: 0.30 },  // Ré6 (nota mais alta)
            ];

            notes.forEach(({ freq, start, duration }) => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, ctx.currentTime + start);

                // Envelope suave: fade in e fade out para não ser agressivo
                gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
                gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + start + 0.02);
                gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);

                oscillator.start(ctx.currentTime + start);
                oscillator.stop(ctx.currentTime + start + duration);
            });

            // Fechar o contexto após o som terminar para liberar recursos
            setTimeout(() => ctx.close(), 1200);
        } catch(e) {
            console.warn('Web Audio API não disponível:', e);
        }
    },

    /** Mostra uma notificação nativa do navegador (funciona em segundo plano) */
    sendBrowserNotification(title, body) {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        try {
            const notification = new Notification(title, {
                body,
                icon: './icon-192.png',
                badge: './icon-192.png',
                tag: 'novo-agendamento',     // Substitui notificação anterior (não empilha)
                renotify: true,             // Toca som mesmo se substituir outra
                vibrate: [200, 100, 200],   // Vibração no mobile
                requireInteraction: false,  // Desaparece sozinho
            });

            // Ao clicar na notificação, abre/foca o app
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch(e) {
            console.warn('Erro ao exibir notificação:', e);
        }
    },

    /** Orquestra: som + notificação visual + in-app quando novo agendamento chega */
    async alertNewAppointment() {
        // 1. Som de alerta (Web Audio API)
        this.playAlertSound();

        // 2. Vibração háptica no mobile
        this.haptic('success');

        // 3. Notificação nativa do navegador (visível mesmo em segundo plano)
        this.sendBrowserNotification(
            '🔔 Novo Agendamento!',
            'Um cliente acabou de agendar um serviço. Toque para ver.'
        );

        // 4. Notificação visual in-app (para quando o app está em primeiro plano)
        this.showNotification('Novo Agendamento!', 'Cliente na agenda — verifique os detalhes.');
        
        console.log('🔔 Alerta de novo agendamento disparado!');
    },

    async fetchFullUpdate(fromBackground = false) {
        this.state.isLoading = true;
        // Se estivermos logados, recarregamos tudo em paralelo para máxima performance
        const tasks = [this.loadInitialData()];
        if (this.state.isAuthenticated) {
            tasks.push(this.loadAppointments());
            tasks.push(this.loadTransactions());
            tasks.push(this.loadProfiles());
            tasks.push(this.loadPayouts());
            tasks.push(this.loadPlans());
            tasks.push(this.loadClientPlans());
        }
        
        await Promise.all(tasks);
        this.state.isLoading = false;

        // Se a atualização veio do background (polling/realtime) E o usuário está
        // em interação ativa (editando, modal aberto), NÃO reescrevemos a tela.
        // Os dados foram atualizados no state e serão usados na próxima renderização.
        if (fromBackground && this._hasActiveInteraction()) {
            console.log('🛡️ [Background] Dados atualizados silenciosamente — render pendente registrado.');
            this._pendingRender = true; // Sinaliza que há dados frescos esperando exibição
            return;
        }

        this._pendingRender = false;
        this.render();
    },

    async loadSession(user) {
        this.state.isAuthenticated = true;
        
        try {
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('❌ Erro ao carregar perfil (Possível RLS):', error.message);
                // Se houver erro de RLS (Recursão), o profile será nulo.
                return;
            }

            if (profile) {
                this.state.role = profile.role;
                this.state.userProfile = profile;
                console.log('✅ Sessão Carregada:', profile.name, `(${profile.role})`);
            }
        } catch (e) {
            console.error('❌ Falha Crítica na Sessão:', e);
        }
    },

    async saveProfileChanges() {
        const name = document.getElementById('edit-name')?.value;
        const phone = document.getElementById('edit-phone')?.value;
        const cpf = document.getElementById('edit-cpf')?.value;
        const birthDate = document.getElementById('edit-birth')?.value;

        if (!name || !phone || !cpf || !birthDate) {
            this.showNotification("Erro", "Todos os campos são obrigatórios.");
            return;
        }

        const oldPhone = this.state.userProfile?.phone;
        const phoneChanged = phone !== oldPhone;

        const confirmTitle = "Confirmar Alterações?";
        const confirmMsg = "Tem certeza que deseja atualizar seus dados profissionais?";

        this.showConfirm(confirmTitle, confirmMsg, phoneChanged, async () => {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return;

            const phoneClean = phone.replace(/\D/g, '').replace(/^55/, '');
            const derivedEmail = `55${phoneClean}@finotrata.com`;

            const { error: profileError } = await supabaseClient
                .from('profiles')
                .update({
                    name: name,
                    phone: phone,
                    cpf: cpf,
                    birth_date: this.inputToDbDate(birthDate),
                    email: derivedEmail
                })
                .eq('id', user.id);

            if (profileError) {
                this.showNotification("Erro ao Salvar", profileError.message);
                return;
            }

            if (phoneChanged) {
                const { error: emailError } = await supabaseClient.rpc('change_user_email', {
                    target_user_id: user.id,
                    new_email: derivedEmail
                });
                if (emailError) console.error('Erro ao atualizar email auth:', emailError);
            }

            // Sincronizar nome/avatar com a tabela de Barbers se necessário
            if (this.state.role === 'barber' || this.state.role === 'admin') {
                await supabaseClient.from('barbers').update({ 
                    name: name,
                    avatar: this.state.userProfile?.avatar // Mantém o avatar atual
                }).eq('user_id', user.id);
            }

            this.state.userProfile = {
                ...this.state.userProfile,
                name, phone, cpf, birth_date: birthDate
            };
            this.state.isEditingProfile = false;
            
            this.showNotification("Sucesso", "Perfil atualizado corretamente.");
            await this.loadInitialData(); // Garante atualização do cache global BARBERS
            this.render();
        });
    },

    initEditDuration(id) {
        this.state.editingDurationId = id;
        this.render();
    },

    cancelEditDuration() {
        this.state.editingDurationId = null;
        this.render();
    },

    initEditTime(id) {
        this.state.editingTimeId = id;
        this.render();
    },

    cancelEditTime() {
        this.state.editingTimeId = null;
        this.render();
    },

    async updateAppointmentTime(id, newTime) {
        try {
            const { error } = await supabaseClient
                .from('appointments')
                .update({ time: newTime })
                .eq('id', id);

            if (error) throw error;

            this.state.editingTimeId = null;
            this.showNotification("Sucesso", "Horário alterado com sucesso!");
            await this.loadAppointments();
            this.render();
        } catch (err) {
            console.error("Erro ao alterar horário:", err);
            this.showNotification("Erro", "Não foi possível alterar o horário.");
        }
    },

    async updateAppointmentDuration(id, newMinutes) {
        try {
            const { error } = await supabaseClient
                .from('appointments')
                .update({ total_duration: parseInt(newMinutes) })
                .eq('id', id);

            if (error) throw error;

            this.state.editingDurationId = null;
            this.showNotification("Sucesso", "Duração ajustada e agenda atualizada!");
            await this.loadInitialData(); // Atualiza janelas de disponibilidade
            await this.loadAppointments(); // Atualiza painel de agendamentos
            this.render();
        } catch (err) {
            console.error("Erro ao ajustar duração:", err);
            this.showNotification("Erro", "Não foi possível ajustar o tempo.");
        }
    },

    initEditPrice(id) {
        this.state.editingPriceId = id;
        this.render();
    },

    cancelEditPrice() {
        this.state.editingPriceId = null;
        this.render();
    },

    async updateAppointmentPrice(id, newPrice) {
        try {
            // Limpar o valor (remover R$, trocar vírgula por ponto)
            const cleanValue = String(newPrice).replace(/[R$\s]/g, '').replace(',', '.');
            const numericValue = parseFloat(cleanValue);

            if (isNaN(numericValue)) {
                this.showNotification("Erro", "Por favor, insira um valor numérico válido.");
                return;
            }

            const formattedPrice = `R$ ${numericValue.toFixed(2).replace('.', ',')}`;

            const { error } = await supabaseClient
                .from('appointments')
                .update({ 
                    service_price: formattedPrice,
                    service_numeric_value: numericValue
                })
                .eq('id', id);

            if (error) throw error;

            this.state.editingPriceId = null;
            this.showNotification("Sucesso", "Valor do serviço atualizado!");
            await this.loadAppointments();
            this.render();
        } catch (err) {
            console.error("Erro ao atualizar preço:", err);
            this.showNotification("Erro", "Não foi possível atualizar o valor.");
        }
    },

    initEditServices(id) {
        const apt = this.state.appointments.find(a => a.id === id);
        if (!apt) return;
        this.state.editingServicesId = id;
        const currentNames = (apt.service.name || '').split(' + ');
        this.state.tempSelectedServices = SERVICES.filter(s => currentNames.includes(s.name));
        this.render();
    },

    toggleEditService(serviceId) {
        const service = SERVICES.find(s => s.id === serviceId);
        if (!service) return;
        
        const index = this.state.tempSelectedServices.findIndex(s => s.id === serviceId);
        if (index > -1) {
            this.state.tempSelectedServices.splice(index, 1);
        } else {
            this.state.tempSelectedServices.push(service);
        }
        this.render();
    },

    cancelEditServices() {
        this.state.editingServicesId = null;
        this.state.tempSelectedServices = [];
        this.render();
    },

    async updateAppointmentServices(id) {
        if (this.state.tempSelectedServices.length === 0) {
            this.showNotification("Erro", "Selecione pelo menos um serviço.");
            return;
        }

        try {
            const apt = this.state.appointments.find(a => a.id === id);
            const comandaTotal = (apt && apt.comanda_items) ? apt.comanda_items.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0;

            const baseServicesPrice = this.state.tempSelectedServices.reduce((sum, s) => sum + s.priceValue, 0);
            const totalDuration = this.state.tempSelectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
            const serviceNames = this.state.tempSelectedServices.map(s => s.name).join(' + ');

            const grandTotal = baseServicesPrice + comandaTotal;
            const formattedPrice = `R$ ${grandTotal.toFixed(2).replace('.', ',')}`;

            const { error } = await supabaseClient
                .from('appointments')
                .update({
                    service_names: serviceNames,
                    service_price: formattedPrice,
                    service_numeric_value: grandTotal,
                    total_duration: totalDuration
                })
                .eq('id', id);

            if (error) throw error;

            this.state.editingServicesId = null;
            this.state.tempSelectedServices = [];
            this.showNotification("Sucesso", "Serviço(s) atualizados!");
            await this.loadAppointments();
            this.render();
        } catch (err) {
            console.error("Erro ao atualizar serviços:", err);
            this.showNotification("Erro", "Falha ao atualizar o agendamento.");
        }
    },

    async toggleTimeBlock(time, barberId = null, date = null) {
        const bid = (!barberId || barberId === 'null' || barberId === 'undefined' || barberId === '') ? null : barberId;
        const dstr = (!date || date === 'null' || date === 'undefined' || date === '') ? null : date;

        // Tenta encontrar usando uma consulta fresca no banco para evitar problemas de sincronia local
        let query = supabaseClient.from('blocked_times')
            .select('id')
            .eq('blocked_time', time);
        
        if (bid === null) query = query.is('barber_id', null);
        else query = query.eq('barber_id', bid);

        if (dstr === null) query = query.is('date', null);
        else query = query.eq('date', dstr);

        const { data: existing } = await query.maybeSingle();

        if (existing) {
            await supabaseClient.from('blocked_times').delete().eq('id', existing.id);
        } else {
            // Usa upsert para garantir que mesmo se algo mudar entre o select e o insert, não dê erro 409
            await supabaseClient.from('blocked_times').upsert({ 
                blocked_time: time,
                barber_id: bid,
                date: dstr
            });
        }
        
        await this.loadInitialData();
        this.render();
    },

    async bulkToggleDay(barberId, date, action) {
        const bid = (!barberId || barberId === 'null' || barberId === 'undefined' || barberId === '') ? null : barberId;
        const dstr = (!date || date === 'null' || date === 'undefined' || date === '') ? null : date;

        // SEMPRE deleta antes para evitar conflito.
        // Importante: No Supabase JS, para deletar NULL, deve-se usar .is('col', null)
        let deleteQuery = supabaseClient.from('blocked_times').delete();
        
        if (bid) deleteQuery = deleteQuery.eq('barber_id', bid);
        else deleteQuery = deleteQuery.is('barber_id', null);

        if (dstr) deleteQuery = deleteQuery.eq('date', dstr);
        else deleteQuery = deleteQuery.is('date', null);

        await deleteQuery;

        if (action === 'block') {
            const toInsert = AVAILABLE_TIMES.map(t => ({ 
                blocked_time: t, 
                barber_id: bid, 
                date: dstr 
            }));

            if (toInsert.length > 0) {
                // Bulk insert no Supabase
                const { error } = await supabaseClient.from('blocked_times').insert(toInsert);
                if (error) console.error("Erro no Bulk Insert:", error);
            }
        }

        this.showNotification("Agenda Atualizada", action === 'block' ? "Dia totalmente bloqueado." : "Horários liberados.");
        await this.loadInitialData();
        this.render();
    },

    setAdminScheduleDate(date) {
        this.state.adminScheduleDate = date;
        this.render();
    },

    setAdminScheduleBarber(barberId) {
        this.state.adminScheduleBarberId = barberId;
        this.render();
    },

    toggleService(id) {
        const svc = SERVICES.find(s => s.id === id);
        const index = this.state.selectedServices.findIndex(s => s.id === id);
        
        let newSelection = [...this.state.selectedServices];
        if (index > -1) {
            newSelection.splice(index, 1);
        } else {
            newSelection.push(svc);
        }

        // Validação Inteligente: Verifica se a janela de tempo cabe na agenda
        if (this.state.selectedBarber && this.state.selectedDate && this.state.selectedTime) {
            const totalDuration = newSelection.reduce((sum, s) => sum + (s.durationMinutes || 30), 0);
            const fits = this.checkIfTimeFits(this.state.selectedBarber.user_id, this.state.selectedDate, this.state.selectedTime, totalDuration);
            
            if (!fits && index === -1) { 
                this.showNotification("Tempo Reduzido", `O barbeiro ${this.state.selectedBarber.name.split(' ')[0]} terá menos tempo que o estimado para este combo, mas você ainda pode agendar.`);
                // Não retorna mais! Permite continuar.
            }
        }

        this.state.selectedServices = newSelection;
        this.render();
    },

    checkIfTimeFits(barberId, date, startTime, duration) {
        // Agora o sistema é flexível: apenas garante que o horário de INÍCIO está disponível
        const [h, m] = startTime.split(':').map(Number);
        const currentTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        // 1. Verifica se está no horário de trabalho (RECORRENTE/FIXO)
        const isReleased = (this.state.blockedTimesFull || []).some(b => 
            b.barber_id === barberId && !b.date && b.blocked_time === currentTime
        );
        if (!isReleased) return false;

        // 2. Verifica se há algum BLOQUEIO EXPLICÍCITO (Blacklist) manual para este slot
        const isExplicitlyBlocked = (this.state.blockedTimesFull || []).some(b => {
            if (!b.barber_id && !b.date && b.blocked_time === currentTime) return true;
            if (b.barber_id === barberId && b.date === date && b.blocked_time === currentTime) return true;
            return false;
        });
        if (isExplicitlyBlocked) return false;

        // 3. Verifica se já existe um agendamento que COMEÇA exatamente neste horário
        const isOccupiedAtStart = (this.state.allAppointmentsForStats || []).some(apt => 
            apt.date === date && apt.barber_id === barberId && apt.time === currentTime && apt.status !== 'cancelled'
        );
        
        if (isOccupiedAtStart) return false;

        return true; // Se o início está livre, "cabe" (trust the barber)
    },

    async completeAppointment() {
        if (!this.state.confirmingPaymentId) return;
        const id = this.state.confirmingPaymentId;
        const paymentMethod = this.state.confirmingPaymentMethod;

        const apt = this.state.appointments.find(a => a.id === id);
        if (apt) {
            // 1. Inserir na tabela de transações
            const { error: txError } = await supabaseClient.from('transactions').insert({
                appointment_id: apt.id,
                client_name: apt.clientName,
                service_name: apt.service.name,
                payment_method: paymentMethod,
                numeric_value: apt.numericValue,
                date: apt.date,
                time: apt.time,
                barber_id: apt.barber_id // Vincula a transação ao barbeiro (UUID)
            });

            if (txError) {
                this.showNotification("Erro no Caixa", txError.message);
                return;
            }

            // 2. Atualizar status na tabela appointments
            await supabaseClient.from('appointments').update({ status: 'completed' }).eq('id', apt.id);

            this.showNotification("Corte Finalizado!", `Recebido via ${paymentMethod}.`);
            await this.loadAppointments();
            await this.loadTransactions();
        }

        this.state.confirmingPaymentId = null;
        this.state.confirmingPaymentMethod = null;
        this.render();
    },

    initSplitPayment(id) {
        const apt = this.state.appointments.find(a => a.id === id);
        if (!apt) return;

        this.state.showingSplitPaymentId = id;
        this.state.splitPaymentAmounts = { Pix: 0, Dinheiro: 0, Débito: 0, Crédito: 0 };
        this.render();
    },

    updateSplitAmount(method, value) {
        const cleanValue = String(value).replace(/[R$\s]/g, '').replace(',', '.');
        const numericValue = parseFloat(cleanValue) || 0;
        this.state.splitPaymentAmounts[method] = numericValue;
        this.render();
    },

    async completeSplitPayment(id) {
        const apt = this.state.appointments.find(a => a.id === id);
        if (!apt) return;

        const totalPaid = Object.values(this.state.splitPaymentAmounts).reduce((a, b) => a + b, 0);
        
        if (Math.abs(totalPaid - apt.numericValue) > 0.01) {
            this.showNotification("Erro no Valor", `A soma (R$ ${totalPaid.toFixed(2).replace('.', ',')}) deve ser igual ao total do serviço (R$ ${apt.numericValue.toFixed(2).replace('.', ',')})`);
            return;
        }

        try {
            this.state.isLoading = true;
            this.render();

            const transactionsToInsert = Object.entries(this.state.splitPaymentAmounts)
                .filter(([_, amount]) => amount > 0)
                .map(([method, amount]) => ({
                    appointment_id: apt.id,
                    client_name: apt.clientName,
                    service_name: apt.service.name,
                    payment_method: method,
                    numeric_value: amount,
                    date: apt.date,
                    time: apt.time,
                    barber_id: apt.barber_id
                }));

            const { error: txError } = await supabaseClient.from('transactions').insert(transactionsToInsert);
            if (txError) throw txError;

            await supabaseClient.from('appointments').update({ status: 'completed' }).eq('id', apt.id);

            this.state.showingSplitPaymentId = null;
            this.showNotification("Corte Finalizado!", "Pagamento dividido registrado com sucesso.");
            
            await this.loadAppointments();
            await this.loadTransactions();
            this.render();
        } catch (err) {
            console.error("Erro no split payment:", err);
            this.showNotification("Erro", "Não foi possível finalizar o pagamento.");
        } finally {
            this.state.isLoading = false;
            this.render();
        }
    },

    async saveShopSettings() {
        let whatsappRaw = document.getElementById('shop-whatsapp').value.replace(/\D/g, '');
        // Adiciona 55 automaticamente se o usuário não colocou e o tamanho for de número brasileiro (10 ou 11 dígitos)
        if (whatsappRaw.length === 10 || whatsappRaw.length === 11) {
            whatsappRaw = '55' + whatsappRaw;
        }

        const newSettings = {
            name: document.getElementById('shop-name').value,
            logo_url: document.getElementById('shop-logo').value,
            slogan: document.getElementById('shop-slogan').value,
            address_street: document.getElementById('shop-street').value,
            address_city: document.getElementById('shop-city').value,
            phone: document.getElementById('shop-phone').value,
            whatsapp: whatsappRaw,
            instagram_url: document.getElementById('shop-instagram').value,
            facebook_url: document.getElementById('shop-facebook').value,
            google_review_url: document.getElementById('shop-google').value,
            commission_rate: document.getElementById('shop-commission') ? parseInt(document.getElementById('shop-commission').value) : (this.state.shopSettings.commission_rate || 100)
        };

        const { error } = await supabaseClient
            .from('shop_settings')
            .update(newSettings)
            .eq('id', this.state.shopSettings.id);

        if (error) {
            this.showNotification('Erro', 'Não foi possível salvar as alterações.');
            console.error(error);
        } else {
            this.state.shopSettings = { ...this.state.shopSettings, ...newSettings };
            this.state.isEditingShop = false;
            this.showNotification('Sucesso!', 'Vitrine da barbearia atualizada.');
            this.render();
        }
    },

    async updateCommissionRate(newRate) {
        const rate = parseInt(newRate);
        if (isNaN(rate) || rate < 0 || rate > 100) return;
        
        const { error } = await supabaseClient
            .from('shop_settings')
            .update({ commission_rate: rate })
            .eq('id', this.state.shopSettings.id);

        if (!error) {
            this.state.shopSettings.commission_rate = rate;
            this.showNotification('Sucesso', `Repasse padrão atualizado para ${rate}%`);
            this.render();
        } else {
            this.showNotification('Erro', 'Não foi possível atualizar o repasse.');
        }
    },

    async toggleShopOpeningDay(dayIdx) {
        const idx = parseInt(dayIdx);
        let days = [...(this.state.shopSettings.working_days || [1,2,3,4,5,6])];
        
        if (days.includes(idx)) {
            days = days.filter(d => d !== idx);
        } else {
            days.push(idx);
        }
        
        // Salvar imediatamente
        const { error } = await supabaseClient
            .from('shop_settings')
            .update({ working_days: days })
            .eq('id', this.state.shopSettings.id);

        if (!error) {
            this.state.shopSettings.working_days = days;
            this.render();
        } else {
            this.showNotification("Erro", "Não foi possível atualizar o funcionamento da casa.");
        }
    },

    // ─────────────────────────────────────────────────────────────────
    // JANELA DE DISPONIBILIDADE
    // ─────────────────────────────────────────────────────────────────

    /**
     * Salva quantos dias no futuro os clientes podem agendar.
     * Ex: 20 = somente de hoje até hoje+20 dias.
     */
    async saveBookingWindow(value) {
        const days = parseInt(value);
        if (isNaN(days) || days < 1 || days > 365) {
            this.showNotification('Valor inválido', 'Informe um número entre 1 e 365 dias.');
            return;
        }
        const { error } = await supabaseClient
            .from('shop_settings')
            .update({ booking_window_days: days })
            .eq('id', this.state.shopSettings.id);

        if (!error) {
            this.state.shopSettings.booking_window_days = days;
            this.showNotification('Janela salva ✓', `Clientes podem agendar até ${days} dias no futuro.`);
            this.render();
        } else {
            this.showNotification('Erro', 'Não foi possível salvar a janela de disponibilidade.');
        }
    },

    // ─────────────────────────────────────────────────────────────────
    // HORÁRIOS POR DIA DA SEMANA
    // ─────────────────────────────────────────────────────────────────

    /**
     * Lê os inputs de horário por dia da UI e salva no barber_config
     * como day_schedules: { 0: {closed,start,end}, 1: {...}, ... }
     */
    async saveBarberDaySchedules(barberId) {
        const daysLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const daySchedules = {};
        const workingDays = [];

        daysLabels.forEach((_, idx) => {
            const startEl      = document.getElementById(`day-start-${barberId}-${idx}`);
            const endEl        = document.getElementById(`day-end-${barberId}-${idx}`);
            const lunchStartEl = document.getElementById(`day-lunch-start-${barberId}-${idx}`);
            const lunchEndEl   = document.getElementById(`day-lunch-end-${barberId}-${idx}`);
            const rowEl        = document.getElementById(`day-row-${barberId}-${idx}`);
            const checkEl      = rowEl?.querySelector('input[type="checkbox"]');
            const isClosed     = checkEl ? checkEl.checked : false;

            daySchedules[idx] = {
                closed:      isClosed,
                start:       startEl?.value      || '09:00',
                end:         endEl?.value        || '18:00',
                lunch_start: lunchStartEl?.value || null,
                lunch_end:   lunchEndEl?.value   || null,
            };

            if (!isClosed) workingDays.push(idx);
        });

        // Deriva work_start/work_end do primeiro/último dia aberto para retrocompatibilidade com o motor
        const openDays = Object.entries(daySchedules).filter(([, v]) => !v.closed);
        const allStarts = openDays.map(([, v]) => v.start).sort();
        const allEnds   = openDays.map(([, v]) => v.end).sort();
        const workStart = allStarts[0] || '09:00';
        const workEnd   = allEnds[allEnds.length - 1] || '18:00';

        await this.saveBarberConfig(barberId, {
            day_schedules: daySchedules,
            working_days: workingDays,
            work_start: workStart,
            work_end: workEnd,
        });
    },

    /**
     * Atualiza o estado "closed" de um dia específico imediatamente
     * no estado local e re-renderiza para feedback visual instantâneo.
     */
    toggleDayClosed(barberId, dayIdx, isClosed) {
        const bIdStr = String(barberId).toLowerCase();
        let config = this.state.barberConfigs.find(c =>
            String(c.barber_id).toLowerCase() === bIdStr
        );
        if (!config) {
            config = { barber_id: barberId, day_schedules: {} };
            this.state.barberConfigs.push(config);
        }
        if (!config.day_schedules) config.day_schedules = {};
        if (!config.day_schedules[dayIdx]) config.day_schedules[dayIdx] = {};
        config.day_schedules[dayIdx].closed = isClosed;
        this.render();
    },



    async updateBarberCommission(barberId, newRate) {
        // Se estiver vazio, salva como null para usar o padrão da loja
        const rateValue = newRate.trim() === "" ? null : parseInt(newRate);
        
        if (rateValue !== null && (isNaN(rateValue) || rateValue < 0 || rateValue > 100)) return;

        const { error } = await supabaseClient.from('barbers')
            .update({ commission_rate: rateValue })
            .eq('id', barberId);

        if (!error) {
            // Atualiza no estado local para feedback imediato
            const barber = BARBERS.find(b => b.id === barberId);
            if (barber) barber.commission_rate = rateValue;
            
            const msg = rateValue === null ? 'Usando padrão da casa.' : `Comissão de ${barber?.name.split(' ')[0]} atualizada para ${rateValue}%`;
            this.showNotification('Sucesso', msg);
            this.render(); 
        } else {
            this.showNotification('Erro', 'Não foi possível atualizar a comissão do profissional.');
            console.error(error);
        }
    },

    async saveBarberServices(barberId, serviceIds) {
        this.state.isLoading = true;
        this.render();

        try {
            // 1. Limpar especialidades antigas
            // Nota: barberId agora é o ID numérico (BigInt)
            const { error: delError } = await supabaseClient.from('barber_services')
                .delete()
                .eq('barber_id', parseInt(barberId));

            if (delError) throw delError;

            // 2. Inserir novas especialidades
            if (serviceIds.length > 0) {
                const inserts = serviceIds.map(sId => ({
                    barber_id: barberId,
                    service_id: parseInt(sId)
                }));
                const { error } = await supabaseClient.from('barber_services').insert(inserts);
                if (error) throw error;
            }

            this.showNotification('Sucesso', 'Especialidades atualizadas!');
            await this.loadInitialData(); // Recarregar para atualizar this.state.barberServices
            this.render();
        } catch (error) {
            console.error(error);
            this.showNotification('Erro', 'Falha ao salvar especialidades.');
        } finally {
            this.state.isLoading = false;
            this.render();
        }
    },

    async addBarber() {
        const name = document.getElementById('new-barber-name').value;
        let userId = document.getElementById('new-barber-userid').value;
        let avatar = document.getElementById('new-barber-avatar').value;

        if (!name) {
            this.showNotification("Erro", "O nome do profissional é obrigatório.");
            return;
        }

        if (!avatar) avatar = "";
        
        if (!userId) {
            userId = null; // Caso não tenha vínculo
        }

        const { data, error } = await supabaseClient.from('barbers').insert({
            name: name,
            user_id: userId,
            avatar: avatar,
            is_active: true
        });

        if (error) {
            this.showNotification("Erro", "Falha ao adicionar profissional.");
            console.error(error);
        } else {
            this.showNotification("Sucesso", "Novo profissional cadastrado na barbearia.");
            await this.loadInitialData();
            this.render();
        }
    },

    async toggleBarberStatus(id) {
        const barber = BARBERS.find(b => b.id === id);
        if (!barber) return;

        const newStatus = !barber.is_active;

        const { error } = await supabaseClient.from('barbers')
            .update({ is_active: newStatus })
            .eq('id', id);

        if (error) {
            this.showNotification("Erro", "Falha ao atualizar o status do profissional.");
        } else {
            this.showNotification("Sucesso", `Profissional ${newStatus ? 'ativado' : 'desativado'}.`);
            await this.loadInitialData();
            this.render();
        }
    },

    async removeBarber(id) {
        const barber = BARBERS.find(b => b.id === id);
        if (!barber) return;

        this.showConfirm("Remover Profissional", "Isto apaga o profissional e limpa seus vínculos. Deseja continuar?", true, async () => {
            console.log("Iniciando exclusão do barbeiro:", barber);
            
            // 1. Limpar por UUID
            if (barber.user_id) {
                console.log("Deletando por user_id:", barber.user_id);
                try { await supabaseClient.from('appointments').delete().eq('barber_id', barber.user_id); } catch(e) { console.log(e); }
                try { await supabaseClient.from('transactions').delete().eq('barber_id', barber.user_id); } catch(e) { console.log(e); }
            }
            
            // 2. Limpar por nome (fallback para mockups velhos)
            if (barber.name) {
                console.log("Deletando por nome:", barber.name);
                try { await supabaseClient.from('appointments').delete().eq('barber_name', barber.name); } catch(e) { console.log(e); }
            }
            
            // 3. Limpar por ID numérico (fallback)
            console.log("Deletando por numeral:", id);
            try { await supabaseClient.from('appointments').delete().eq('barber_id', id); } catch(e) { console.log(e); }
            try { await supabaseClient.from('transactions').delete().eq('barber_id', id); } catch(e) { console.log(e); }

            console.log("Deletando barbeiro da tabela...");
            const response = await supabaseClient.from('barbers').delete().eq('id', id);
            console.log("Resposta da exclusão do barbeiro:", response);

            if (response.error) {
                this.showNotification("Erro", "Detalhes no console! (Falha ao apagar Tabela Barbers)");
            } else {
                this.showNotification("Removido", "O profissional foi apagado do sistema.");
                await this.loadInitialData();
                this.render();
            }
        });
    },

    async addService() {
        const name = document.getElementById('new-service-name').value;
        const priceStr = document.getElementById('new-service-price').value.replace(',', '.'); // Permite preencher só "30.00"
        const durationStr = document.getElementById('new-service-duration').value;
        const priceVariable = document.getElementById('new-service-price-variable')?.checked ?? false;

        if (!name || !priceStr || !durationStr) {
            this.showNotification("Erro", "Preencha todos os campos do serviço.");
            return;
        }

        const numericValue = parseFloat(priceStr);
        const priceText = priceVariable
            ? `A partir de R$ ${numericValue.toFixed(2).replace('.', ',')}`
            : `R$ ${numericValue.toFixed(2).replace('.', ',')}`;
        const durationMinutes = parseInt(durationStr, 10);
        const durationText = `${durationMinutes} min`;

        const id = this.state.editingServiceId;
        const serviceData = {
            name: name,
            price: priceText,
            price_value: numericValue,
            duration: durationText,
            duration_minutes: durationMinutes,
            price_variable: priceVariable
        };

        let result;
        if (id) {
            result = await supabaseClient.from('services').update(serviceData).eq('id', id);
        } else {
            result = await supabaseClient.from('services').insert(serviceData);
        }


        if (result.error) {
            this.showNotification("Erro", id ? "Erro ao atualizar o serviço." : "Erro ao adicionar este serviço.");
        } else {
            this.showNotification("Sucesso", id ? "Serviço atualizado com sucesso!" : "Serviço disponível para a casa!");
            this.state.editingServiceId = null; // Limpa o estado após sucesso
            await this.loadInitialData();
            this.render();
        }
    },

    async updateServiceOrder(newOrderIds) {
        if (!newOrderIds || newOrderIds.length === 0) return;

        // 1. Reordenar o array local SERVICES baseada na nova ordem de IDs
        const reordered = newOrderIds.map(id => SERVICES.find(s => String(s.id) === String(id))).filter(Boolean);
        
        // 2. Atualizar indices de sort_order localmente
        reordered.forEach((s, i) => { s.sort_order = i; });
        SERVICES = reordered;
        
        // 3. Renderizar com a nova ordem imediatamente
        this.render();

        // 4. Salvar no Supabase (em lote)
        const updates = reordered.map((s, i) => ({ id: s.id, sort_order: i }));
        
        try {
            // Executar updates em paralelo
            await Promise.all(updates.map(({ id, sort_order }) =>
                supabaseClient.from('services').update({ sort_order }).eq('id', id)
            ));
            
            // Opcional: Notificar sucesso silencioso ou log
            console.log('✅ Ordem dos serviços salva no banco.');
        } catch (e) {
            console.error('Erro ao salvar ordem dos serviços:', e);
            this.showNotification('Erro', 'Não foi possível salvar a nova ordem no servidor.');
        }
    },


    async removeService(id) {
        this.showConfirm("Remover Serviço", "Tem certeza que deseja apagar permanentemente este serviço do catálogo?", true, async () => {
            const { error } = await supabaseClient.from('services')
                .delete()
                .eq('id', id);

            if (error) {
                this.showNotification("Erro", "Não foi possível remover o serviço.");
            } else {
                this.showNotification("Removido", "O serviço foi retirado do catálogo.");
                await this.loadInitialData();
                this.render();
            }
        });
    },

    initEditService(id) {
        this.state.editingServiceId = id;
        this.render();
    },

    cancelEditService() {
        this.state.editingServiceId = null;
        this.render();
    },

    async updateUserRole(userId, newRole, userName, userAvatar) {
        this.showConfirm("Alterar Papel", `Deseja mudar a permissão deste usuário para "${newRole}"?`, true, async () => {
            const { error } = await supabaseClient.from('profiles').update({ role: newRole }).eq('id', userId);
            
            if (error) {
                console.error("Erro RLS Update:", error);
                this.showNotification("Erro", "Falha de RLS no Banco. Configure o POLICY UPDATE para profiles.");
            } else {
                // Se foi promovido a barbeiro, injeta automaticamente na tabela de equipe se ainda nao estiver
                if (newRole === 'barber') {
                    const { data: existing } = await supabaseClient.from('barbers').select('id').eq('user_id', userId).maybeSingle();
                    if (!existing) {
                        const fallBackAvatar = userAvatar || "";
                        try {
                            await supabaseClient.from('barbers').insert({
                                user_id: userId,
                                name: userName,
                                avatar: fallBackAvatar,
                                is_active: true
                            });
                        } catch (e) {
                            console.log("Insert staff silencioso falhou", e);
                        }
                    }
                }
                this.showNotification("Sucesso", "Permissões atualizadas com sucesso!");
                await this.loadInitialData();
                this.render();
            }
        });
    },

    async cancelAppointment(id) {
        this.showConfirm("Cancelar Agendamento", "Tem certeza que deseja cancelar este atendimento? O horário será liberado imediatamente.", true, async () => {
            try {
                const { error } = await supabaseClient
                    .from('appointments')
                    .update({ status: 'cancelled' })
                    .eq('id', id);

                if (error) throw error;

                this.showNotification("Cancelado", "O agendamento foi removido da agenda.");
                await this.loadInitialData();
                this.render();
            } catch (err) {
                console.error("Erro ao cancelar:", err);
                this.showNotification("Erro", "Não foi possível cancelar o agendamento.");
            }
        });
    },

    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Limite de 10MB para segurança antes da compressão
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification("Arquivo Muito Grande", "Escolha uma imagem de até 10MB.");
            return;
        }

        this.state.isUploadingAvatar = true;
        this.render();

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // 1. Comprimir a imagem (apenas a comprimida irá para o Supabase)
            const compressedBlob = await this.compressImage(file, 400, 0.7);
            
            // 2. Definir caminho no Storage (buckets/avatars/USER_ID/avatar.jpg)
            const filePath = `${user.id}/avatar-${Date.now()}.jpg`;

            // 3. Upload para Supabase Storage
            const { error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(filePath, compressedBlob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 4. Obter URL Pública
            const { data: { publicUrl } } = supabaseClient.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 5. Atualizar tabela Profiles
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .update({ avatar: publicUrl })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 6. Sincronizar com a tabela Barbers (se o usuário for barbeiro)
            if (this.state.role === 'barber' || this.state.role === 'admin') {
                const { error: syncError } = await supabaseClient
                    .from('barbers')
                    .update({ avatar: publicUrl })
                    .eq('user_id', user.id);
                
                if (syncError) {
                    console.warn("Sincronização com barbers falhou:", syncError.message);
                    // Não travamos o processo total se a sincronização falhar, mas avisamos no console
                }
            }

            // 7. Atualizar estado local e UI
            this.state.userProfile.avatar = publicUrl;
            this.showNotification("Sucesso", "Foto de perfil atualizada!");
            await this.loadInitialData(); // Recarregar para atualizar listas de barbeiros se necessário
        } catch (err) {
            console.error("Erro no upload do avatar:", err);
            this.showNotification("Erro no Upload", "Não foi possível salvar sua foto.");
        } finally {
            this.state.isUploadingAvatar = false;
            this.render();
        }
    },

    async handleShopLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Limite de 10MB
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification("Arquivo Muito Grande", "Escolha uma imagem de até 10MB.");
            return;
        }

        this.state.isUploadingLogo = true;
        this.render();

        try {
            // 1. Comprimir a imagem
            const compressedBlob = await this.compressImage(file, 600, 0.8);
            
            // 2. Definir caminho no Storage
            const filePath = `logos/shop_${Date.now()}.jpg`;

            // 3. Upload para Supabase Storage
            const { error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(filePath, compressedBlob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 4. Obter URL Pública
            const { data: { publicUrl } } = supabaseClient.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 5. Atualizar tabela shop_settings
            const { error: shopError } = await supabaseClient
                .from('shop_settings')
                .update({ logo_url: publicUrl })
                .eq('id', this.state.shopSettings.id);

            if (shopError) throw shopError;

            // 6. Atualizar estado local
            this.state.shopSettings.logo_url = publicUrl;
            this.showNotification("Sucesso", "Logo da barbearia atualizada!");
        } catch (err) {
            console.error("Erro no upload da logo:", err);
            this.showNotification("Erro no Upload", "Não foi possível salvar a logo.");
        } finally {
            this.state.isUploadingLogo = false;
            this.render();
        }
    },

    async adminDeleteUser(userId, userName) {
        this.showConfirmModal({
            title: `Excluir Cliente Permanentemente?`,
            message: `Aviso! O perfil de ${userName} e seus agendamentos serão deletados para sempre. Não é possível reverter isso. Deseja continuar?`,
            icon: "trash-2",
            isDestructive: true,
            onConfirm: async () => {
                try {
                    // Executa o script RPC que foi injetado pelo Admin no Supabase
                    const { error } = await supabaseClient.rpc('admin_delete_user', { target_user_id: userId });
                    
                    if (error) {
                        console.error('Erro na função Supabase de exclusão do Admin:', error);
                        throw new Error(error.message || "Você precisa rodar a função admin_delete_user no painel Supabase primeiro!");
                    }

                    this.showNotification("Excluído com Sucesso", `O cliente ${userName} foi completamente apagado do sistema.`);
                    await this.fetchFullUpdate();

                } catch (err) {
                    console.error("Falha ao destruir a conta do cliente via Admin:", err);
                    this.showNotification("Falha", err.message || "Não foi possível excluir o usuário agora.");
                }
            }
        });
    },

    // --- Novas Lógicas de Escala ---

    async saveBarberSlot(barberId, dayOfWeek, time) {
        const isBulk = this.state.adminScheduleBulkMode && this.state.adminScheduleBulkDays.length > 0;
        
        let operation;
        if (isBulk) {
            const upserts = this.state.adminScheduleBulkDays.map(d => ({
                barber_id: barberId,
                day_of_week: d,
                slot_time: time
            }));
            operation = supabaseClient.from('barber_slots').upsert(upserts, { onConflict: 'barber_id,day_of_week,slot_time' });
        } else {
            operation = supabaseClient.from('barber_slots').upsert({ 
                barber_id: barberId, 
                day_of_week: dayOfWeek, 
                slot_time: time 
            }, { onConflict: 'barber_id,day_of_week,slot_time' });
        }

        const { error } = await operation;
        
        if (!error) {
            await this.refreshScheduleData();
            return true;
        }
        return false;
    },

    async removeBarberSlot(barberId, dayOfWeek, time) {
        const isBulk = this.state.adminScheduleBulkMode && this.state.adminScheduleBulkDays.length > 0;

        let query = supabaseClient.from('barber_slots').delete();
        
        if (isBulk) {
            query = query
                .eq('barber_id', barberId)
                .in('day_of_week', this.state.adminScheduleBulkDays)
                .eq('slot_time', time);
        } else {
            query = query.match({ 
                barber_id: barberId, 
                day_of_week: dayOfWeek, 
                slot_time: time 
            });
        }

        const { error } = await query;
        
        if (!error) {
            await this.refreshScheduleData();
            return true;
        }
        return false;
    },

    toggleBulkDay(dayIdx) {
        const idx = Number(dayIdx);
        let days = [...(this.state.adminScheduleBulkDays || [])];
        
        if (days.includes(idx)) {
            days = days.filter(d => d !== idx);
        } else {
            days.push(idx);
        }
        
        // Mantém ordenado para consistência visual
        days.sort((a, b) => a - b);
        
        // Sincroniza a visualização com o último dia clicado para feedback imediato
        this.setState({ 
            adminScheduleBulkDays: days,
            adminScheduleDayOfWeek: idx
        });
    },

    toggleBulkMode() {
        const newMode = !this.state.adminScheduleBulkMode;
        // Ao ativar o modo massa, pré-seleciona o dia atual
        const newDays = newMode ? [this.state.adminScheduleDayOfWeek] : [];
        this.setState({ 
            adminScheduleBulkMode: newMode,
            adminScheduleBulkDays: newDays
        });
    },

    async saveBarberConfig(barberId, config) {
        const { error } = await supabaseClient
            .from('barber_config')
            .upsert({ barber_id: barberId, ...config });
        
        if (!error) {
            await this.refreshScheduleData();
            return true;
        }
        return false;
    },

    async toggleBarberException(barberId, date, isClosed) {
        const { error } = await supabaseClient
            .from('barber_exceptions')
            .upsert({ barber_id: barberId, specific_date: date, is_closed: isClosed });
        
        if (!error) {
            await this.refreshScheduleData();
            return true;
        }
        return false;
    },

    async deleteBarberException(barberId, date) {
        const { error } = await supabaseClient
            .from('barber_exceptions')
            .delete()
            .match({ barber_id: barberId, specific_date: date });
        
        if (!error) {
            await this.refreshScheduleData();
            return true;
        }
        return false;
    },

    async refreshScheduleData() {
        const [bCfgRes, bSlotsRes, bExRes] = await Promise.all([
            supabaseClient.from('barber_config').select('*'),
            supabaseClient.from('barber_slots').select('*'),
            supabaseClient.from('barber_exceptions').select('*')
        ]);
        this.state.barberConfigs = bCfgRes.data || [];
        this.state.barberSlots = bSlotsRes.data || [];
        this.state.barberExceptions = bExRes.data || [];
        this.render();
    },

    // ─────────────────────────────────────────────────────────────────
    // ADMIN: Configuração de Horários do Barbeiro (novo sistema)
    // ─────────────────────────────────────────────────────────────────

    /**
     * Salva a configuração de horário do barbeiro (work_start, work_end,
     * working_days, lunch_start, lunch_end) na tabela barber_config.
     * Faz UPSERT baseado em barber_id.
     */
    async saveBarberConfig(barberId, updates) {
        if (!barberId) return;

        // Buscar config atual para fazer merge
        const current = this.state.barberConfigs.find(c =>
            String(c.barber_id).toLowerCase() === String(barberId).toLowerCase()
        ) || { barber_id: barberId };

        const merged = { ...current, ...updates, barber_id: barberId };

        const { error } = await supabaseClient
            .from('barber_config')
            .upsert(merged, { onConflict: 'barber_id' });

        if (error) {
            this.showNotification('Erro ao salvar configuração', error.message);
            return;
        }

        await this.refreshScheduleData();
        this.showNotification('Configuração salva ✓', 'Horários atualizados com sucesso.');
    },

    /**
     * Salva os dias de trabalho do barbeiro (array de ints [0..6]).
     * Chamado pelo painel de checkboxes de dias da semana.
     */
    async saveBarberWorkingDays(barberId, days) {
        await this.saveBarberConfig(barberId, { working_days: days });
    },

    /**
     * Toggle de um dia de trabalho individual do barbeiro.
     */
    async toggleBarberWorkingDay(barberId, dayIdx) {
        const config = this.state.barberConfigs.find(c =>
            String(c.barber_id).toLowerCase() === String(barberId).toLowerCase()
        );
        const currentDays = config?.working_days ?? [1, 2, 3, 4, 5, 6];
        let newDays;
        if (currentDays.includes(dayIdx)) {
            newDays = currentDays.filter(d => d !== dayIdx);
        } else {
            newDays = [...currentDays, dayIdx].sort();
        }
        await this.saveBarberConfig(barberId, { working_days: newDays });
    },

    // ─────────────────────────────────────────────────────────────────
    // ADMIN: Exceções de Agenda (folgas, feriados)
    // ─────────────────────────────────────────────────────────────────

    async toggleBarberException(barberId, dateStr, isClosed) {
        if (!barberId || !dateStr) return;

        const { error } = await supabaseClient
            .from('barber_exceptions')
            .upsert({ barber_id: barberId, specific_date: dateStr, is_closed: isClosed }, { onConflict: 'barber_id,specific_date' });

        if (error) {
            this.showNotification('Erro', error.message);
            return;
        }
        await this.refreshScheduleData();
        this.showNotification(isClosed ? 'Dia bloqueado' : 'Dia desbloqueado', `${dateStr} atualizado.`);
    },

    async deleteBarberException(barberId, dateStr) {
        const { error } = await supabaseClient
            .from('barber_exceptions')
            .delete()
            .eq('barber_id', barberId)
            .eq('specific_date', dateStr);

        if (error) {
            this.showNotification('Erro', error.message);
            return;
        }
        await this.refreshScheduleData();
        this.showNotification('Exceção removida', 'Agenda restaurada para o padrão.');
    },

    // ─────────────────────────────────────────────────────────────────
    // BLOQUEIO DE JANELA DE HORÁRIO (blocked_times)
    // ─────────────────────────────────────────────────────────────────

    /**
     * Cria bloqueios de 5 em 5 minutos cobrindo a faixa início→fim
     * para um barbeiro em uma data específica.
     */
    async addTimeBlockWindow(barberId) {
        const dateEl  = document.getElementById(`block-window-date-${barberId}`);
        const startEl = document.getElementById(`block-window-start-${barberId}`);
        const endEl   = document.getElementById(`block-window-end-${barberId}`);

        const date  = dateEl?.value;
        const start = startEl?.value;
        const end   = endEl?.value;

        if (!date || !start || !end) {
            this.showNotification('Campos incompletos', 'Preencha a data, início e fim do bloqueio.');
            return;
        }

        const startMin = this.timeToMinutes(start);
        const endMin   = this.timeToMinutes(end);

        if (endMin <= startMin) {
            this.showNotification('Horário inválido', 'O horário de fim deve ser maior que o de início.');
            return;
        }

        // Gerar slots de 5 em 5 minutos dentro da janela
        const slots = [];
        for (let t = startMin; t < endMin; t += 5) {
            slots.push({
                barber_id: barberId,
                date: date,
                blocked_time: this.minutesToTime(t)
            });
        }

        if (slots.length === 0) {
            this.showNotification('Janela muito pequena', 'A janela deve ter pelo menos 5 minutos.');
            return;
        }

        const { error } = await supabaseClient
            .from('blocked_times')
            .upsert(slots, { onConflict: 'barber_id,date,blocked_time', ignoreDuplicates: true });

        if (error) {
            this.showNotification('Erro ao bloquear', error.message);
            return;
        }

        // Atualizar estado local imediatamente
        const existing = (this.state.blockedTimesFull || []).filter(b =>
            !(b.barber_id === barberId && b.date === date)
        );
        this.state.blockedTimesFull = [...existing, ...slots];

        this.showNotification('Bloqueio criado ✓', `${start} – ${end} bloqueado em ${this.inputToDbDate(date)}.`);
        this.render();
    },

    /**
     * Remove todos os bloqueios de um barbeiro em uma data específica.
     */
    async removeTimeBlockWindow(barberId, date) {
        this.showConfirmModal({
            title: 'Remover Bloqueio?',
            message: `Deseja liberar todos os horários bloqueados em ${this.inputToDbDate(date)} para este barbeiro?`,
            icon: 'clock-x',
            isDestructive: false,
            onConfirm: async () => {
                const { error } = await supabaseClient
                    .from('blocked_times')
                    .delete()
                    .eq('barber_id', barberId)
                    .eq('date', date);

                if (error) {
                    this.showNotification('Erro', error.message);
                    return;
                }

                // Remover do estado local
                this.state.blockedTimesFull = (this.state.blockedTimesFull || []).filter(b =>
                    !(b.barber_id === barberId && b.date === date)
                );

                this.showNotification('Bloqueio removido ✓', `Horários de ${this.inputToDbDate(date)} liberados.`);
                this.render();
            }
        });
    },



    // ─────────────────────────────────────────────────────────────────
    // ADMIN: Legado — barber_slots (mantido para retrocompatibilidade)
    // ─────────────────────────────────────────────────────────────────

    async saveBarberSlot(barberId, dayOfWeek, slotTime) {
        const { error } = await supabaseClient
            .from('barber_slots')
            .upsert({ barber_id: barberId, day_of_week: dayOfWeek, slot_time: slotTime },
                { onConflict: 'barber_id,day_of_week,slot_time' });
        if (error) { this.showNotification('Erro', error.message); return; }
        await this.refreshScheduleData();
    },

    async removeBarberSlot(barberId, dayOfWeek, slotTime) {
        const { error } = await supabaseClient
            .from('barber_slots')
            .delete()
            .eq('barber_id', barberId)
            .eq('day_of_week', dayOfWeek)
            .eq('slot_time', slotTime);
        if (error) { this.showNotification('Erro', error.message); return; }
        await this.refreshScheduleData();
    },

    // ─────────────────────────────────────────────────────────────────
    // ADMIN: Helpers de UI para seleção em massa de dias
    // ─────────────────────────────────────────────────────────────────

    toggleBulkMode() {
        this.state.adminScheduleBulkMode = !this.state.adminScheduleBulkMode;
        this.state.adminScheduleBulkDays = [];
        this.render();
    },

    toggleBulkDay(dayIdx) {
        const days = this.state.adminScheduleBulkDays;
        const idx = days.indexOf(dayIdx);
        if (idx > -1) {
            this.state.adminScheduleBulkDays = days.filter(d => d !== dayIdx);
        } else {
            this.state.adminScheduleBulkDays = [...days, dayIdx];
        }
        this.render();
    },

    /**
     * Retorna os horários disponíveis para um barbeiro em uma data específica,
     * considerando slots fixos, exceções, almoço e agendamentos existentes.
     */
    getBarberAvailableSlots(barberId, dateStr) {
        if (!barberId || !dateStr) return [];

        // Parsing de data robusto para evitar deslocamento de fuso
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();

        const bIdStr = String(barberId).toLowerCase();

        // 1. Verificar Exceção para a data
        const exception = this.state.barberExceptions.find(ex => 
            String(ex.barber_id).toLowerCase() === bIdStr && 
            ex.specific_date === dateStr
        );
        if (exception?.is_closed) return [];

        // 2. Obter Slots Definidos
        let activeSlots = this.state.barberSlots
            .filter(s => String(s.barber_id).toLowerCase() === bIdStr && Number(s.day_of_week) === dayOfWeek)
            .map(s => s.slot_time);

        if (activeSlots.length === 0) return [];

        // Ordenar horários
        activeSlots.sort();

        // 3. Filtrar Almoço (por dia com fallback global)
        const config = this.state.barberConfigs.find(c => String(c.barber_id).toLowerCase() === bIdStr);
        const dayCfg = config?.day_schedules?.[dayOfWeek] || {};
        const lunchStart = dayCfg.lunch_start || config?.lunch_start;
        const lunchEnd   = dayCfg.lunch_end   || config?.lunch_end;
        if (lunchStart && lunchEnd) {
            activeSlots = activeSlots.filter(time => time < lunchStart || time >= lunchEnd);
        }

        // 4. Filtrar Agendamentos Ocupados
        const slotsWithStatus = activeSlots.map(time => {
            const isOccupied = (this.state.allAppointmentsForStats || []).some(apt => {
                if (String(apt.barber_id).toLowerCase() !== bIdStr || apt.date !== dateStr) return false;
                
                const slotMinutes = this.timeToMinutes(time);
                const aptStartMinutes = this.timeToMinutes(apt.time);
                const aptEndMinutes = aptStartMinutes + (apt.total_duration || 30);
                
                return slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes;
            });

            return { time, isOccupied };
        });

        return slotsWithStatus;
    },

    timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    },

    minutesToTime(totalMinutes) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    },

    // --- Helpers de Estado e UI ---
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    },

    setAdminScheduleBarber(val) {
        this.state.adminScheduleBarberId = val || null;
        this.render();
    },

    // ═══════════════════════════════════════════════════════════════════
    // 🚀 NOVO MOTOR DE AGENDAMENTO v2 — Tempo Contínuo
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Verifica se dois intervalos de tempo se sobrepõem.
     * Regra: conflito existe quando NÃO é verdade que um termina antes do outro começar.
     * Fórmula: !(A.fim <= B.inicio || A.inicio >= B.fim)
     */
    hasIntervalConflict(aStart, aEnd, bStart, bEnd) {
        return !(aEnd <= bStart || aStart >= bEnd);
    },

    /**
     * Retorna o range de trabalho de um barbeiro em uma data específica.
     * Usa barber_slots (horários salvos) para derivar início e fim do expediente.
     * Retorna null se o barbeiro não trabalha nesse dia.
     * @returns {{ inicioMin: number, fimMin: number } | null}
     */
    getBarberWorkRange(barberId, dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();
        const bIdStr = String(barberId).toLowerCase();

        // 1. Checar exceção para a data (folga/feriado)
        const exception = (this.state.barberExceptions || []).find(ex =>
            String(ex.barber_id).toLowerCase() === bIdStr &&
            ex.specific_date === dateStr
        );
        if (exception?.is_closed) return null;

        // 2. Buscar config do barbeiro
        const config = (this.state.barberConfigs || []).find(c =>
            String(c.barber_id).toLowerCase() === bIdStr
        );

        // 3. Verificar se o barbeiro trabalha nesse dia da semana
        //    Prioridade: day_schedules[dayOfWeek].closed → working_days array
        const daySchedules = config?.day_schedules || {};
        const dayCfg = daySchedules[dayOfWeek];

        if (dayCfg?.closed === true) return null;

        if (!dayCfg && config?.working_days && Array.isArray(config.working_days)) {
            if (!config.working_days.includes(dayOfWeek)) return null;
        }

        // 4. Obter horário de início e fim do expediente
        //    Prioridade: day_schedules[dow].start/end → barber_config.work_start/work_end → barber_slots → padrão
        let inicioMin, fimMin;

        if (dayCfg?.start && dayCfg?.end) {
            // ✅ Horário específico para este dia (novo sistema por dia)
            inicioMin = this.timeToMinutes(dayCfg.start);
            fimMin    = this.timeToMinutes(dayCfg.end);
        } else if (config?.work_start && config?.work_end) {
            // ✅ Config global do barbeiro (sistema anterior)
            inicioMin = this.timeToMinutes(config.work_start);
            fimMin    = this.timeToMinutes(config.work_end);
        } else {
            // Fallback: derivar dos barber_slots existentes
            const daySlots = (this.state.barberSlots || [])
                .filter(s =>
                    String(s.barber_id).toLowerCase() === bIdStr &&
                    Number(s.day_of_week) === dayOfWeek
                )
                .map(s => s.slot_time)
                .sort();

            if (daySlots.length > 0) {
                inicioMin = this.timeToMinutes(daySlots[0]);
                fimMin = this.timeToMinutes(daySlots[daySlots.length - 1]) + 5;
            } else {
                // Fallback final: usar horário padrão da loja (08:00 → 18:00)
                const shopStart = this.state.shopSettings?.work_start || '08:00';
                const shopEnd = this.state.shopSettings?.work_end || '18:00';
                inicioMin = this.timeToMinutes(shopStart);
                fimMin = this.timeToMinutes(shopEnd);
            }
        }


        if (inicioMin >= fimMin) return null;
        return { inicioMin, fimMin };
    },


    /**
     * Retorna todos os intervalos de tempo ocupados de um barbeiro em uma data.
     * Inclui agendamentos existentes (pending) e o intervalo de almoço.
     * @returns {Array<{ inicio: number, fim: number }>}
     */
    getBarberBusyIntervals(barberId, dateStr) {
        const bIdStr = String(barberId).toLowerCase();
        const intervals = [];

        // 1. Agendamentos existentes (status pending)
        const appointments = (this.state.allAppointmentsForStats || []).filter(apt =>
            String(apt.barber_id).toLowerCase() === bIdStr &&
            apt.date === dateStr
        );

        appointments.forEach(apt => {
            const start = this.timeToMinutes(apt.time);
            const duration = apt.total_duration || 30;
            intervals.push({ inicio: start, fim: start + duration });
        });

        // 2. Intervalo de almoço por dia com fallback global
        const dayOfWeekBusy = new Date(dateStr + 'T00:00:00').getDay();
        const config = (this.state.barberConfigs || []).find(c =>
            String(c.barber_id).toLowerCase() === bIdStr
        );
        const dayCfgBusy  = config?.day_schedules?.[dayOfWeekBusy] || {};
        const lunchStartB = dayCfgBusy.lunch_start || config?.lunch_start;
        const lunchEndB   = dayCfgBusy.lunch_end   || config?.lunch_end;
        if (lunchStartB && lunchEndB) {
            intervals.push({
                inicio: this.timeToMinutes(lunchStartB),
                fim:    this.timeToMinutes(lunchEndB)
            });
        }

        // 3. Horários bloqueados manualmente (blocked_times) para esta data e barbeiro
        const blockedFull = this.state.blockedTimesFull || [];

        // Bloqueios globais (sem barber_id e sem date) — afetam todos
        const globalBlocks = blockedFull.filter(b => !b.barber_id && !b.date);

        // Bloqueios específicos deste barbeiro nesta data
        const specificBlocks = blockedFull.filter(b =>
            String(b.barber_id || '').toLowerCase() === bIdStr && b.date === dateStr
        );

        [...globalBlocks, ...specificBlocks].forEach(b => {
            const t = this.timeToMinutes(b.blocked_time);
            intervals.push({ inicio: t, fim: t + 5 }); // bloqueia o slot de 5 min
        });

        return intervals;
    },

    /**
     * Motor Principal: Calcula horários disponíveis para um serviço em uma data.
     * Agrupa por horário com lista de barbeiros disponíveis em cada slot.
     *
     * @param {Object} params
     * @param {string} params.data - Data no formato YYYY-MM-DD
     * @param {number} [params.servicoId] - ID do serviço (usado para buscar duração se duracaoTotal não fornecida)
     * @param {number} [params.duracaoTotal] - Duração total em minutos (prioridade sobre servicoId para multi-serviço)
     * @param {number} [params.granularidadeMin=5] - Intervalo entre slots em minutos
     * @param {string} [params.editingAppointmentId=null] - ID do agendamento sendo editado
     * @returns {Object} { "09:00": [barber1, barber2], "09:05": [barber1] }
     */
    getHorariosDisponiveis({ data, servicoId, servicoIds, duracaoTotal, granularidadeMin = 5, editingAppointmentId = null }) {
        // Resolver duração: prioridade para duracaoTotal (multi-serviço), fallback para servicoId
        let duracao = duracaoTotal || 0;
        if (!duracao && servicoId) {
            const servico = SERVICES.find(s => s.id === servicoId);
            if (!servico) return {};
            duracao = servico.durationMinutes || 30;
        }
        if (!duracao) duracao = 30; // guarda final: nunca retornar vazio por duração zero

        // Normalizar lista de IDs dos serviços (para filtro de especialidades)
        const idsServicos = servicoIds || (servicoId ? [servicoId] : []);
        console.log('[Motor v2] data:', data, '| duração:', duracao, 'min | serviços:', idsServicos);

        const resultado = {};

        // Verificar dias de funcionamento da barbearia
        const [year, month, day] = data.split('-').map(Number);
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        const workingDays = this.state.shopSettings?.working_days || [1, 2, 3, 4, 5, 6];
        if (!workingDays.includes(dayOfWeek)) return {};

        // Para cada barbeiro ativo
        const activeBarbers = BARBERS.filter(b => b.is_active !== false && b.active !== false);

        activeBarbers.forEach(barber => {
            const bId = barber.user_id;

            // 1. Obter range de trabalho
            const workRange = this.getBarberWorkRange(bId, data);
            if (!workRange) {
                console.log(`[Motor v2] ${barber.name}: sem expediente neste dia`);
                return;
            }

            const { inicioMin, fimMin } = workRange;
            console.log(`[Motor v2] ${barber.name}: expediente ${this.minutesToTime(inicioMin)} – ${this.minutesToTime(fimMin)}`);

            // 2. Filtrar especialidades: checar se o barbeiro realiza ALGUM dos serviços selecionados
            //    Se idsServicos estiver vazio (sem filtro), permite qualquer barbeiro
            const especialidades = (this.state.barberServices || []).filter(s =>
                s.barber_id === barber.id
            ).map(s => s.service_id);

            if (especialidades.length > 0 && idsServicos.length > 0) {
                const fazAlgum = idsServicos.some(id => especialidades.includes(id));
                if (!fazAlgum) {
                    console.log(`[Motor v2] ${barber.name}: não realiza estes serviços, ignorado`);
                    return;
                }
            }

            // 3. Obter intervalos ocupados deste barbeiro nesta data
            let busyIntervals = this.getBarberBusyIntervals(bId, data);

            // Se estamos editando um agendamento, remove-o dos intervalos ocupados
            if (editingAppointmentId) {
                const editingApt = (this.state.allAppointmentsForStats || []).find(
                    a => a.id === editingAppointmentId
                );
                if (editingApt && String(editingApt.barber_id).toLowerCase() === String(bId).toLowerCase()) {
                    const editStart = this.timeToMinutes(editingApt.time);
                    const editEnd = editStart + (editingApt.total_duration || 30);
                    busyIntervals = busyIntervals.filter(
                        i => !(i.inicio === editStart && i.fim === editEnd)
                    );
                }
            }

            // 4. Gerar candidatos de slots dentro do expediente
            for (let t = inicioMin; t + duracao <= fimMin; t += granularidadeMin) {
                const slotInicio = t;
                const slotFim = t + duracao;

                // Verificar se o slot conflita com algum intervalo ocupado
                const conflito = busyIntervals.some(interval =>
                    this.hasIntervalConflict(slotInicio, slotFim, interval.inicio, interval.fim)
                );

                if (!conflito) {
                    const timeStr = this.minutesToTime(t);
                    if (!resultado[timeStr]) resultado[timeStr] = [];
                    resultado[timeStr].push(barber);
                }
            }
        });

        return resultado;
    },

    /**
     * Pré-computa a disponibilidade de cada dia do mês para um serviço.
     * Usado para mostrar dots verde/cinza no calendário.
     * @returns {Object} { "2026-04-28": true, "2026-04-29": false }
     */
    getCalendarAvailability(year, month, servicoId) {
        if (!servicoId) return {};

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const availability = {};

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            if (dateObj < today) {
                availability[this.dateToStr(dateObj)] = false;
                continue;
            }

            const dateStr = this.dateToStr(dateObj);
            const slots = this.getHorariosDisponiveis({ data: dateStr, servicoId });
            availability[dateStr] = Object.keys(slots).length > 0;
        }

        return availability;
    },

    /**
     * Converte objeto Date para string YYYY-MM-DD sem problemas de timezone.
     */
    dateToStr(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    /**
     * Formata número de minutos para exibição (ex: 90 → "1h 30min", 30 → "30min")
     */
    formatDuration(minutes) {
        if (minutes < 60) return `${minutes} min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    },

    /**
     * Formata phone para exibição amigável
     */
    formatDisplayPhone(phone) {
        if (!phone) return '';
        const digits = String(phone).replace(/\D/g, '');
        if (digits.length === 11) {
            return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
        } else if (digits.length === 10) {
            return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
        }
        return phone;
    },

    // ─────────────────────────────────────────────────────────────────
    // SISTEMA DE COMANDA DIGITAL (LITE)
    // ─────────────────────────────────────────────────────────────────
    
    openComandaModal(appointmentId) {
        // Sinaliza que há um modal de comanda aberto para proteger o render automático
        this.state.comandaModalOpen = true;
        this.renderComandaModal(appointmentId);
    },

    closeComandaModal() {
        this.state.comandaModalOpen = false;
        const mc = document.getElementById('modal-container');
        if (mc) mc.innerHTML = '';
        // Se houve atualizações silenciosas enquanto o modal estava aberto,
        // renderiza agora para que o admin veja os dados frescos
        this._flushRenderIfNeeded();
    },

    // Renderiza imediatamente se houver um render pendente de uma atualização silenciosa.
    // Deve ser chamado no fim de qualquer ação que encerra uma interação ativa.
    _flushRenderIfNeeded() {
        if (this._pendingRender) {
            console.log('🔄 [Flush] Interação encerrada — executando render pendente.');
            this._pendingRender = false;
            this.render();
        }
    },

    async addComandaItem(appointmentId, productId, qty = 1) {
        const apt = this.state.appointments.find(a => a.id === appointmentId);
        const product = PRODUCTS.find(p => p.id === productId);
        if (!apt || !product) return;

        this.showConfirmModal({
            title: "Adicionar à Comanda?",
            message: `Deseja adicionar ${qty}x ${product.name} (R$ ${(product.price * qty).toFixed(2).replace('.', ',')}) à comanda?`,
            icon: "shopping-bag",
            onConfirm: async () => {
                // Pega comanda atual ou inicia vazia
                let comanda = apt.comanda_items || [];
                
                // Verifica se o item já existe para aumentar a quantidade
                const existingItemIndex = comanda.findIndex(i => i.id === product.id);
                if (existingItemIndex >= 0) {
                    comanda[existingItemIndex].qty += qty;
                } else {
                    comanda.push({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        qty: qty
                    });
                }

                const newVal = apt.numericValue + (product.price * qty);

                try {
                    const { error } = await supabaseClient
                        .from('appointments')
                        .update({ 
                            comanda_items: comanda,
                            service_numeric_value: newVal,
                            service_price: `R$ ${newVal.toFixed(2).replace('.', ',')}`
                        })
                        .eq('id', appointmentId);
                    
                    if (error) throw error;

                    this.showNotification("Sucesso", `${qty}x ${product.name} adicionado à comanda!`);
                    this.closeComandaModal(); // Fecha modal e limpa flag de interação
                    await this.loadAppointments();
                    this.render();
                    
                } catch (error) {
                    console.error("Erro ao adicionar item na comanda:", error);
                    this.showNotification("Erro", "Falha ao adicionar item.");
                }
            }
        });
    },

    async removeComandaItem(appointmentId, itemIndex) {
        const apt = this.state.appointments.find(a => a.id === appointmentId);
        if (!apt || !apt.comanda_items) return;

        const item = apt.comanda_items[itemIndex];
        if (!item) return;

        if (!confirm(`Deseja remover 1x ${item.name} da comanda?`)) {
            return;
        }

        let comanda = [...apt.comanda_items];
        
        // Remove 1 quantidade ou tira o item todo
        if (comanda[itemIndex].qty > 1) {
            comanda[itemIndex].qty -= 1;
        } else {
            comanda.splice(itemIndex, 1);
        }

        // Subtrai o valor
        const newVal = apt.numericValue - item.price;

        try {
            const { error } = await supabaseClient
                .from('appointments')
                .update({ 
                    comanda_items: comanda,
                    service_numeric_value: newVal,
                    service_price: `R$ ${newVal.toFixed(2).replace('.', ',')}`
                })
                .eq('id', appointmentId);
            
            if (error) throw error;

            this.showNotification("Removido", "Item removido da comanda.");
            await this.loadAppointments();
            this.render();
            
        } catch (error) {
            console.error("Erro ao remover item da comanda:", error);
            this.showNotification("Erro", "Falha ao remover item.");
        }
    },

    // ─────────────────────────────────────────────────────────────────
    // GERENCIAMENTO DE ESTOQUE (CATEGORIAS E PRODUTOS)
    // ─────────────────────────────────────────────────────────────────

    async addCategory(name) {
        if (!name) return;
        try {
            const { error } = await supabaseClient.from('categories').insert({ name });
            if (error) throw error;
            this.showNotification("Sucesso", "Categoria criada.");
            await this.loadInitialData();
            this.render();
        } catch(e) {
            console.error("Erro ao criar categoria:", e);
            this.showNotification("Erro", "Não foi possível criar categoria.");
        }
    },

    async deleteCategory(id) {
        if(!confirm("Tem certeza? Produtos desta categoria serão excluídos!")) return;
        try {
            const { error } = await supabaseClient.from('categories').delete().eq('id', id);
            if (error) throw error;
            this.showNotification("Sucesso", "Categoria excluída.");
            await this.loadInitialData();
            this.render();
        } catch(e) {
            console.error("Erro ao excluir categoria:", e);
            this.showNotification("Erro", "Falha ao excluir.");
        }
    },

    async addProduct(name, priceStr, categoryId) {
        if (!name || !priceStr || !categoryId) {
            this.showNotification("Erro", "Preencha todos os campos do produto.");
            return;
        }
        const numericValue = parseFloat(priceStr.replace(',', '.'));
        try {
            const { error } = await supabaseClient.from('products').insert({
                name: name,
                price: numericValue,
                category_id: categoryId
            });
            if (error) throw error;
            this.showNotification("Sucesso", "Produto criado.");
            await this.loadInitialData();
            this.render();
        } catch(e) {
            console.error("Erro ao criar produto:", e);
            this.showNotification("Erro", "Falha ao criar produto.");
        }
    },

    initEditProduct(id) {
        this.state.editingProductId = id;
        this.render();
    },

    cancelEditProduct() {
        this.state.editingProductId = null;
        this.render();
    },

    async updateProduct(id, newName, newPriceStr, newCategoryId) {
        if (!newName || !newPriceStr || !newCategoryId) {
            this.showNotification("Erro", "Preencha todos os campos do produto.");
            return;
        }
        const numericValue = parseFloat(newPriceStr.replace(',', '.'));
        if (isNaN(numericValue)) {
            this.showNotification("Erro", "Valor inválido.");
            return;
        }
        try {
            const { error } = await supabaseClient.from('products').update({
                name: newName,
                price: numericValue,
                category_id: newCategoryId
            }).eq('id', id);
            
            if (error) throw error;
            
            this.state.editingProductId = null;
            this.showNotification("Sucesso", "Produto atualizado.");
            await this.loadInitialData();
            this.render();
        } catch(e) {
            console.error("Erro ao atualizar produto:", e);
            this.showNotification("Erro", "Falha ao atualizar produto.");
        }
    },

    async deleteProduct(id) {
        if(!confirm("Tem certeza que deseja excluir este produto?")) return;
        try {
            const { error } = await supabaseClient.from('products').delete().eq('id', id);
            if (error) throw error;
            this.showNotification("Sucesso", "Produto excluído.");
            await this.loadInitialData();
            this.render();
        } catch(e) {
            console.error("Erro ao excluir produto:", e);
            this.showNotification("Erro", "Falha ao excluir.");
        }
    }
});


