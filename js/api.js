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
                this.loadProfiles()
            ]);
            
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
        const [svcsRes, brbsRes, blocksRes, settingsRes, statsRes, specsRes] = await Promise.all([
            supabaseClient.from('services').select('*'),
            supabaseClient.from('barbers').select('*'),
            supabaseClient.from('blocked_times').select('*'),
            supabaseClient.from('shop_settings').select('*').limit(1).single(),
            supabaseClient.from('appointments').select('date, time, barber_id, total_duration').eq('status', 'pending'),
            supabaseClient.from('barber_services').select('*')
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
                name: 'FinnoTrato Barber',
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
                    clientAvatar: a.client_avatar
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

    setupRealtime() {
        // Limpar conexões e polling anteriores
        supabaseClient.removeAllChannels();
        this.stopPolling();

        // --- ESTRATÉGIA 1: WebSocket (Supabase Realtime) ---
        // Tenta usar o WebSocket nativo. Se funcionar, é instantâneo.
        let realtimeWorking = false;

        const monitors = [
            { table: 'appointments', label: 'Agenda', callback: async () => await this.fetchFullUpdate() },
            { table: 'transactions', label: 'Financeiro', callback: async () => {
                if (this.state.isAuthenticated) { await Promise.all([this.loadTransactions(), this.loadAppointments()]); this.render(); }
            }},
            { table: 'blocked_times', label: 'Bloqueios', callback: async () => { await this.loadInitialData(); this.render(); } },
            { table: 'shop_settings', label: 'Configurações', callback: async () => { await this.loadInitialData(); this.render(); } },
            { table: 'barbers', label: 'Equipe', callback: async () => { await this.loadInitialData(); this.render(); } },
            { table: 'services', label: 'Serviços', callback: async () => { await this.loadInitialData(); this.render(); } }
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
                // Estratégia robusta: conta total de agendamentos pendentes
                // e pega o ID mais recente para detectar qualquer mudança
                let query = supabaseClient
                    .from('appointments')
                    .select('id', { count: 'exact' })
                    .eq('status', 'pending');

                // Aplicar mesmo filtro do loadAppointments por role
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (!user) return null;

                if (this.state.role === 'barber') {
                    query = query.eq('barber_id', user.id);
                } else if (this.state.role === 'client') {
                    query = query.eq('client_id', user.id);
                }

                const { count, error } = await query;
                if (error) return null;

                return count; // A contagem é nossa "assinatura" do estado atual
            } catch(e) {
                return null;
            }
        };

        const poll = async () => {
            if (!this.state.isAuthenticated) return;
            
            const currentSignature = await getSignature();
            if (currentSignature === null) return;

            // Primeira rodada: apenas registra o estado atual como referência
            if (lastSignature === null) {
                lastSignature = currentSignature;
                console.log(`🔄 [Polling] Referência inicial: ${currentSignature} agendamentos.`);
                return;
            }

            // Se o número de agendamentos mudou, atualiza tudo
            if (currentSignature !== lastSignature) {
                const prev = lastSignature;
                lastSignature = currentSignature; // Atualiza ANTES do await para evitar duplo disparo
                console.log(`🔄 [Polling] Mudança detectada! Antes: ${prev} | Agora: ${currentSignature}. Atualizando...`);
                
                const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);
                const isNewAppointment = currentSignature > prev;
                
                if (isStaff && isNewAppointment) {
                    // Dispara alerta sonoro + notificação visual para o barbeiro
                    await this.alertNewAppointment();
                }
                
                await this.fetchFullUpdate();
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

    async fetchFullUpdate() {
        this.state.isLoading = true;
        // Se estivermos logados, recarregamos tudo em paralelo para máxima performance
        const tasks = [this.loadInitialData()];
        if (this.state.isAuthenticated) {
            tasks.push(this.loadAppointments());
            tasks.push(this.loadTransactions());
            tasks.push(this.loadProfiles());
            tasks.push(this.loadPayouts());
        }
        
        await Promise.all(tasks);
        this.state.isLoading = false;
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

            const { error: profileError } = await supabaseClient
                .from('profiles')
                .update({
                    name: name,
                    phone: phone,
                    cpf: cpf,
                    birth_date: this.inputToDbDate(birthDate)
                })
                .eq('id', user.id);

            if (profileError) {
                this.showNotification("Erro ao Salvar", profileError.message);
                return;
            }

            if (phoneChanged) {
                const newPhoneClean = phone.replace(/\D/g, '');
                const newEmail = `${newPhoneClean}@finotrata.com`;
                await supabaseClient.auth.updateUser({ email: newEmail });
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
                this.showNotification("Tempo Insuficiente", `O barbeiro ${this.state.selectedBarber.name.split(' ')[0]} não tem tempo livre suficiente para este combo.`);
                return;
            }
        }

        this.state.selectedServices = newSelection;
        this.render();
    },

    checkIfTimeFits(barberId, date, startTime, duration) {
        const [h, m] = startTime.split(':').map(Number);
        const startTotal = h * 60 + m;
        const endTotal = startTotal + duration;

        // Cada slot de 5 min dentro da janela deve estar livre
        for (let t = startTotal; t < endTotal; t += 5) {
            const currentH = Math.floor(t / 60).toString().padStart(2, '0');
            const currentM = (t % 60).toString().padStart(2, '0');
            const currentTime = `${currentH}:${currentM}`;

            // 1. Verifica se está no horário de trabalho (RECORRENTE/FIXO)
            // IMPORTANTE: Só é obrigatório para o INÍCIO do serviço. 
            // Os slots seguintes podem ser "não-liberados" na escala fixa, 
            // permitindo que o serviço consuma o tempo até o próximo compromisso real.
            if (t === startTotal) {
                const isReleased = (this.state.blockedTimesFull || []).some(b => 
                    b.barber_id === barberId && !b.date && b.blocked_time === currentTime
                );
                if (!isReleased) return false;
            }

            // 2. Verifica se há algum BLOQUEIO EXPLICÍCITO (Blacklist) - Válido para a janela toda
            const isExplicitlyBlocked = (this.state.blockedTimesFull || []).some(b => {
                if (!b.barber_id && !b.date && b.blocked_time === currentTime) return true;
                if (b.barber_id === barberId && b.date === date && b.blocked_time === currentTime) return true;
                return false;
            });
            if (isExplicitlyBlocked) return false;

            // 2. Verifica AGENDAMENTOS
            const isOccupied = this.state.allAppointmentsForStats?.some(apt => {
                if (apt.date !== date || apt.barber_id !== barberId) return false;
                const [aptH, aptM] = apt.time.split(':').map(Number);
                const aptStart = aptH * 60 + aptM;
                const aptEnd = aptStart + (apt.total_duration || 30);
                return (t >= aptStart && t < aptEnd);
            });
            if (isOccupied) return false;
        }
        return true;
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
            commission_rate: document.getElementById('shop-commission') ? parseInt(document.getElementById('shop-commission').value) : (this.state.shopSettings.commission_rate || 100),
            working_days: Array.from(document.querySelectorAll('.day-selector.active')).map(btn => parseInt(btn.dataset.day))
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

        if (!avatar) {
            avatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(name) + "&background=f59e0b&color=000&rounded=true";
        }
        
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

    async reorderService(serviceId, direction) {
        // Encontrar posição atual do serviço na lista ordenada
        const idx = SERVICES.findIndex(s => s.id === serviceId);
        if (idx === -1) return;

        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= SERVICES.length) return;

        // Trocar as posições na array local
        [SERVICES[idx], SERVICES[swapIdx]] = [SERVICES[swapIdx], SERVICES[idx]];

        // Atribuir novos sort_order sequenciais
        const updates = SERVICES.map((s, i) => ({ id: s.id, sort_order: i }));

        // Atualizar localmente imediatamente (UI responsiva)
        SERVICES.forEach((s, i) => { s.sort_order = i; });
        this.render();

        // Persistir no banco em paralelo (sem bloquear a UI)
        try {
            await Promise.all(updates.map(({ id, sort_order }) =>
                supabaseClient.from('services').update({ sort_order }).eq('id', id)
            ));
        } catch (e) {
            console.error('Erro ao salvar ordem dos serviços:', e);
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
                        const fallBackAvatar = userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}&backgroundColor=b6e3f4`;
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
                        throw new Error("Você precisa rodar a função admin_delete_user no painel Supabase primeiro!");
                    }

                    this.showNotification("Excluído com Sucesso", `O cliente ${userName} foi completamente apagado do sistema.`);
                    await this.fetchFullUpdate();

                } catch (err) {
                    console.error("Falha ao destruir a conta do cliente via Admin:", err);
                    this.showNotification("Falha", err.message || "Não foi possível excluir o usuário agora.");
                }
            }
        });
    }
});

