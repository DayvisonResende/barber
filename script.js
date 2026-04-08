// --- Backend: Supabase (Configure suas chaves aqui) ---
const SUPABASE_URL = 'https://plhxtgbmmupojzbhpnpe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bRVr0xmHMYC96km1wxpSog_ewkOTKTK';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Dados da Aplicação (Carregados do Supabase) ---
let SERVICES = [];
let BARBERS = [];
let CLIENTES = [];

const AVAILABLE_TIMES = Array.from({ length: 144 }).map((_, i) => {
    const hours = Math.floor(i / 6).toString().padStart(2, '0');
    const mins = ((i % 6) * 10).toString().padStart(2, '0');
    return `${hours}:${mins}`;
});

const AVATAR_OPTIONS = null; // Removido para Iniciais Simplificadas

// --- Estado e Lógica Central ---
const App = {
    state: {
        isAuthenticated: false,
        authView: 'login', // 'login', 'register', 'forgot'
        activeTab: 'agendamentos',
        role: 'client', // 'client' ou 'barber'
        appointments: [],
        completedTransactions: [], // Histórico de Caixa
        reportsFilter: 'day', // 'day', 'week', 'month', 'year', 'custom'
        reportsCustomStart: '',
        reportsCustomEnd: '',
        unreadCount: 0,
        appointmentsFilter: 'day',
        blockedTimes: [],
        confirmingPaymentId: null,
        confirmingPaymentMethod: null,
        // Estado do formulário de marcação
        isBooking: false,
        selectedServices: [],
        selectedBarber: null,
        selectedDate: '',
        selectedTime: '',
        activeBookingStep: 1,
        editingAppointmentId: null,
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        recoveryStep: 'verify', // 'verify' ou 'reset'
        recoveryUserId: null,
        isEditingProfile: false,
        isBuildingAvatar: false,
        theme: localStorage.getItem('finotrato-theme') || 'dark',
        showReminderPopup: false,
        // Configurações da Barbearia (Dinâmicas)
        shopSettings: null,
        isEditingShop: false
    },

    async init() {
        // Verificar se usuário já está logado
        const { data: { session } } = await supabaseClient.auth.getSession();
        const user = session?.user;
        
        if (user) {
            await this.loadSession(user);
        }
        
        await this.loadInitialData();
        this.applyTheme();

        if (this.state.isAuthenticated) {
            await this.loadAppointments();
            await this.loadTransactions();
            this.setupRealtime(); // Ativa a "escuta" em tempo real
        }
        this.render();
        this.applyMasks(); // Aplica as máscaras após renderizar
    },

    applyMasks() {
        // Máscara para Celular/WhatsApp (Equipe e Cliente)
        const phoneInputs = ['reg-phone', 'login-phone', 'forgot-phone', 'edit-phone', 'shop-whatsapp', 'shop-phone'];
        phoneInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', (e) => {
                    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
                    e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
                });
            }
        });

        // Máscara para CPF
        const cpfInput = document.getElementById('reg-cpf') || document.getElementById('forgot-cpf') || document.getElementById('edit-cpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/);
                e.target.value = !x[2] ? x[1] : x[1] + '.' + x[2] + (x[3] ? '.' + x[3] : '') + (x[4] ? '-' + x[4] : '');
            });
        }

        // Máscara para Data
        const dateInput = document.getElementById('reg-birth') || document.getElementById('forgot-birth') || document.getElementById('edit-birth');
        if (dateInput) {
            dateInput.addEventListener('input', (e) => {
                let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,2})(\d{0,4})/);
                e.target.value = !x[2] ? x[1] : x[1] + '/' + x[2] + (x[3] ? '/' + x[3] : '');
            });
        }
    },
    applyTheme() {
        document.body.classList.toggle('light-mode', this.state.theme === 'light');
    },

    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('finotrato-theme', this.state.theme);
        this.applyTheme();
        this.render();
    },

    async loadInitialData() {
        // Carregar catálogo
        const { data: svcs } = await supabaseClient.from('services').select('*');
        if (svcs) SERVICES = svcs.map(s => ({
            id: s.id, name: s.name, price: s.price, priceValue: s.price_value,
            duration: s.duration, durationMinutes: s.duration_minutes
        }));

        // Carregar barbeiros
        const { data: brbs } = await supabaseClient.from('barbers').select('*').eq('is_active', true);
        if (brbs) BARBERS = brbs;

        // Carregar bloqueios
        const { data: blocks } = await supabaseClient.from('blocked_times').select('blocked_time');
        if (blocks) this.state.blockedTimes = blocks.map(b => b.blocked_time);

        // Se for barbeiro e estiver logado, carregar lista de clientes
        if (this.state.role === 'barber' && this.state.isAuthenticated) {
            const { data: userProfiles } = await supabaseClient.from('profiles').select('*').eq('role', 'client');
            if (userProfiles) CLIENTES = userProfiles;
        }

        // Carregar agendamentos atuais para verificar disponibilidade global
        const { data: allApts } = await supabaseClient.from('appointments').select('date, time, barber_id').eq('status', 'pending');
        this.state.allAppointmentsForStats = allApts || [];

        // Carregar Configurações da Barbearia (Vitrine)
        const { data: settings } = await supabaseClient.from('shop_settings').select('*').limit(1).single();
        if (settings) {
            this.state.shopSettings = settings;
        } else {
            // Fallback caso a tabela esteja vazia (previne erros de renderização)
            this.state.shopSettings = {
                name: 'FinnoTrato Barber',
                logo_url: null,
                address_street: 'Rua da Tesoura, 123',
                address_city: 'Bairro Nova Estética - Cidade SP',
                phone: '(11) 99999-9999',
                whatsapp: '5511999999999',
                instagram_url: 'https://instagram.com',
                facebook_url: 'https://facebook.com',
                google_review_url: 'https://maps.google.com/?q=FinnoTrato+Barber+Avaliar'
            };
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
            this.state.appointments = apts.map(a => ({
                id: a.id,
                clientName: a.client_name,
                clientPhone: a.client_phone || '', // Campo direto
                barberName: a.barber_name,
                service: { name: a.service_names, price: a.service_price },
                numericValue: a.service_numeric_value,
                date: a.date,
                time: a.time,
                status: a.status
            }));
            
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
            this.state.completedTransactions = txs.map(t => ({
                id: t.id,
                clientName: t.client_name,
                service: { name: t.service_name },
                paymentMethod: t.payment_method,
                numericValue: t.numeric_value,
                date: t.date,
                time: t.time,
                completedAt: t.completed_at
            }));
        }
    },

    setupRealtime() {
        // "Ouvido" digital do Supabase: Sempre que alguém agendar, alterar ou cancelar, 
        // todos os outros apps ligados serão atualizados na hora.
        supabaseClient.channel('agenda-realtime')
            .on(
                'postgres_changes', 
                { event: '*', schema: 'public', table: 'appointments' }, 
                async (payload) => {
                    console.log('⚡ Atualização Instantânea Detectada!', payload);
                    
                    // Recarrega a disponibilidade global (fila)
                    await this.loadInitialData();
                    
                    // Recarrega os agendamentos do usuário logado (caso tenha sido ele ou algo mude para ele)
                    await this.loadAppointments();
                    
                    this.render();
                }
            )
            .subscribe();
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

    // --- Ações de Estado ---
    setAuthView(view) {
        this.state.authView = view;
        this.render();
    },

    async login() {
        const phone = document.getElementById('login-phone')?.value;
        const password = document.getElementById('login-password')?.value;

        if (!phone || !password) {
            this.showNotification("Erro", "Preencha celular e senha.");
            return;
        }

        // Simular e-mail usando o celular
        const email = `${phone.replace(/\D/g, '')}@finotrata.com`;

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            this.showNotification("Login Falhou", error.message);
            return;
        }

        await this.loadSession(data.user);
        this.state.activeTab = 'agendamentos';
        this.updateNavUI();
        this.render();
    },

    async register() {
        const phone = document.getElementById('reg-phone')?.value;
        const password = document.getElementById('reg-password')?.value;
        const confirmPassword = document.getElementById('reg-confirm-password')?.value;
        const name = document.getElementById('reg-name')?.value;
        const cpf = document.getElementById('reg-cpf')?.value;
        const birthDate = document.getElementById('reg-birth')?.value;

        if (!phone || !password || !name || !cpf || !birthDate) {
            this.showNotification("Erro", "Preencha todos os campos.");
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification("Erro", "As senhas não coincidem.");
            return;
        }

        // Simular e-mail usando o celular
        const email = `${phone.replace(/\D/g, '')}@finotrata.com`;

        const { data, error } = await supabaseClient.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    name: name,
                    cpf: cpf,
                    birth_date: birthDate
                }
            }
        });

        if (error) {
            this.showNotification("Erro", error.message);
            return;
        }

        this.showNotification("Sucesso!", "Conta criada com sucesso.");
        this.state.authView = 'login';
        this.render();
    },

    async logout() {
        await supabaseClient.auth.signOut();
        this.state.isAuthenticated = false;
        this.state.authView = 'login';
        this.state.recoveryStep = 'verify';
        this.state.activeTab = 'agendamentos';
        this.render();
    },

    async verifyRecovery() {
        const phone = document.getElementById('forgot-phone')?.value;
        const cpf = document.getElementById('forgot-cpf')?.value;
        const birthDate = document.getElementById('forgot-birth')?.value;

        if (!phone || !cpf || !birthDate) {
            this.showNotification("Erro", "Preencha todos os campos para verificar.");
            return;
        }

        const phoneClean = phone.replace(/\D/g, '');
        const email = `${phoneClean}@finotrata.com`;

        // 1. Verificar se existe um perfil com esse CPF e Data de Nascimento
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('cpf', cpf)
            .eq('birth_date', birthDate)
            .eq('email', email)
            .single();

        if (error || !profile) {
            this.showNotification("Erro de Identidade", "Os dados não conferem com nossa base.");
            return;
        }

        // 2. Avançar para a troca de senha
        this.state.recoveryStep = 'reset';
        this.state.recoveryUserId = profile.id;
        this.showNotification("Sucesso", "Identidade confirmada! Defina sua nova senha.");
        this.render();
    },

    async resetPassword() {
        const password = document.getElementById('new-password')?.value;
        const confirm = document.getElementById('new-confirm-password')?.value;

        if (!password || password.length < 6) {
            this.showNotification("Erro", "A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        if (password !== confirm) {
            this.showNotification("Erro", "As senhas não coincidem.");
            return;
        }

        // Como usamos "celular@finotrata.com" e não temos acesso ao reset real via e-mail sem Service Role,
        // o ideal seria um Admin fazer isso ou usarmos uma função RPC. 
        // Para este protótipo, vamos simular o sucesso e avisar o usuário.
        
        this.showNotification("Aviso", "No Supabase Real, a redefinição exige link de e-mail. Usaremos um fluxo simulado aqui.");
        
        // No mundo real, aqui chamaríamos uma Edge Function ou Admin API
        this.state.authView = 'login';
        this.state.recoveryStep = 'verify';
        this.render();
    },

    toggleProfileEdit() {
        this.state.isEditingProfile = !this.state.isEditingProfile;
        this.render();
        if (this.state.isEditingProfile) {
            this.applyMasks();
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
                    birth_date: birthDate
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

            this.state.userProfile = {
                ...this.state.userProfile,
                name, phone, cpf, birth_date: birthDate
            };
            this.state.isEditingProfile = false;
            
            this.showNotification("Sucesso", "Perfil atualizado corretamente.");
            this.render();
        });
    },

    toggleReminderPopup() {
        this.state.showReminderPopup = !this.state.showReminderPopup;
        this.render();
    },

    async requestNotificationPermission() {
        if (!("Notification" in window)) {
            this.showNotification("Não suportado", "Seu navegador não suporta notificações.");
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            this.showNotification("Notificações Ativas!", "Você receberá um aviso 30 minutos antes de cada corte.");
        } else {
            this.showNotification("Permissão Negada", "Os avisos automáticos foram bloqueados.");
        }
        this.render();
    },

    scheduleNextNotification() {
        if (!("Notification" in window) || Notification.permission !== 'granted') return;
        
        // Limpar agendamentos anteriores
        if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
        
        const reminder = this.getUpcomingReminder();
        if (!reminder) return;

        // Horário do corte em milisegundos
        const [hours, minutes] = reminder.apt.time.split(':').map(Number);
        const aptDate = new Date();
        aptDate.setHours(hours, minutes, 0, 0);

        // Disparar 30 minutos antes
        const triggerTime = aptDate.getTime() - (30 * 60 * 1000);
        const now = Date.now();
        const delay = triggerTime - now;

        if (delay > 0) {
            this.notificationTimeout = setTimeout(() => {
                new Notification("✂️ Seu corte está chegando!", {
                    body: `Faltam 30 minutos para o seu horário das ${reminder.apt.time}. Já estamos te esperando!`,
                    icon: "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/scissors.svg"
                });
            }, delay);
        }
    },

    setTab(tabId) {
        this.state.activeTab = tabId;
        if (tabId !== 'agendamentos') {
            this.state.isBooking = false; // Resetar formulário ao sair da aba
        }
        this.updateNavUI();
        this.render();
    },

    setRole(role) {
        this.state.role = role;
        this.state.isBooking = false;
        if (role === 'barber' && this.state.activeTab === 'perfil') {
            this.state.activeTab = 'relatorios';
        } else if (role !== 'barber' && this.state.activeTab === 'relatorios') {
            this.state.activeTab = 'perfil';
        }
        this.render();
        this.updateNavUI();
        this.updateHeaderUI();
    },

    startBooking() {
        this.state.isBooking = true;
        this.state.selectedServices = [];
        this.state.selectedBarber = null;
        this.state.selectedDate = '';
        this.state.selectedTime = '';
        this.state.activeBookingStep = 1;
        this.state.editingAppointmentId = null; // Limpa qualquer edição anterior
        this.state.currentMonth = new Date().getMonth();
        this.state.currentYear = new Date().getFullYear();
        this.render();
    },

    prevMonth() {
        if (this.state.currentMonth === 0) {
            this.state.currentMonth = 11;
            this.state.currentYear--;
        } else {
            this.state.currentMonth--;
        }
        this.render();
    },

    nextMonth() {
        if (this.state.currentMonth === 11) {
            this.state.currentMonth = 0;
            this.state.currentYear++;
        } else {
            this.state.currentMonth++;
        }
        this.render();
    },

    setBookingStep(step) {
        // Automatically clear dependent variables if we navigate backward intentionally to modify things
        if (step === 1 && this.state.activeBookingStep !== 1) {
            this.state.selectedTime = '';
            this.state.selectedBarber = null;
            this.state.selectedServices = [];
        } else if (step === 2 && this.state.activeBookingStep !== 2) {
            this.state.selectedServices = [];
        }
        this.state.activeBookingStep = step;
        this.render();
    },

    cancelBooking() {
        this.state.isBooking = false;
        this.render();
    },

    async toggleTimeBlock(time) {
        if (this.state.blockedTimes.includes(time)) {
            this.state.blockedTimes = this.state.blockedTimes.filter(t => t !== time);
            await supabaseClient.from('blocked_times').delete().eq('blocked_time', time);
        } else {
            this.state.blockedTimes.push(time);
            await supabaseClient.from('blocked_times').insert({ blocked_time: time });
        }
        this.render();
    },

    toggleService(id) {
        const svc = SERVICES.find(s => s.id === id);
        const index = this.state.selectedServices.findIndex(s => s.id === id);

        if (index > -1) {
            this.state.selectedServices.splice(index, 1);
        } else {
            this.state.selectedServices.push(svc);
        }

        this.render();
    },

    selectDate(date) {
        this.state.selectedDate = date;
        this.state.selectedTime = '';
        this.state.selectedBarber = null;
        this.state.selectedServices = []; // Reiniciar serviços pois mudou a data
        this.state.activeBookingStep = 2;
        this.render();
    },

    selectTimeAndBarber(time, barberId) {
        this.state.selectedTime = time;
        // Search by integer ID from UI, but ensure we store the full object including user_id (UUID)
        this.state.selectedBarber = BARBERS.find(b => b.id === barberId);
        this.state.activeBookingStep = 3;
        this.render();
    },

    async confirmBooking() {
        if (this.state.selectedServices.length === 0 || !this.state.selectedBarber || !this.state.selectedDate || !this.state.selectedTime) return;

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            this.showNotification("Erro", "Você precisa estar logado.");
            return;
        }

        const { data: profile } = await supabaseClient.from('profiles').select('name, phone').eq('id', user.id).single();
        const clientName = profile?.name || 'Cliente';
        const clientPhone = profile?.phone || '';

        const totalValue = this.state.selectedServices.reduce((sum, s) => sum + s.priceValue, 0);
        const serviceNames = this.state.selectedServices.map(s => s.name).join(' + ');

        const appointmentData = {
            client_id: user.id,
            client_name: clientName,
            client_phone: clientPhone, 
            // Agora usa o user_id (UUID) para bater com a nova coluna do banco
            barber_id: this.state.selectedBarber.user_id,
            barber_name: this.state.selectedBarber.name,
            service_names: serviceNames,
            service_price: `R$ ${totalValue.toFixed(2).replace('.', ',')}`,
            service_numeric_value: totalValue,
            date: this.state.selectedDate,
            time: this.state.selectedTime,
            status: 'pending'
        };

        let result;
        if (this.state.editingAppointmentId) {
            // Caso de ALTERAÇÃO
            result = await supabaseClient.from('appointments').update(appointmentData).eq('id', this.state.editingAppointmentId);
        } else {
            // Caso de NOVO AGENDAMENTO
            result = await supabaseClient.from('appointments').insert(appointmentData);
        }

        if (result.error) {
            this.showNotification("Erro ao Agendar", result.error.message);
            return;
        }

        this.state.isBooking = false;
        this.state.editingAppointmentId = null;
        this.showNotification(
            this.state.editingAppointmentId ? "Alteração Confirmada!" : "Agendamento Confirmado!", 
            "O barbeiro foi notificado do seu horário."
        );

        await this.loadInitialData(); // Atualiza fila/bloqueios
        await this.loadAppointments(); // Recarregar lista do cliente
        this.render();
    },

    showConfirmModal({ title, message, onConfirm, icon = 'help-circle', isDestructive = false }) {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const iconEl = document.getElementById('confirm-icon');
        const iconBg = document.getElementById('confirm-icon-bg');
        const btnConfirm = document.getElementById('btn-confirm-action');
        const warning = document.getElementById('confirm-warning');

        if (!modal || !titleEl || !messageEl || !iconEl || !btnConfirm) return;

        titleEl.textContent = title;
        messageEl.textContent = message;
        
        // Configurar Ícone
        iconEl.setAttribute('data-lucide', icon);
        if (isDestructive) {
            iconBg.className = 'bg-red-500/10 p-4 rounded-2xl';
            iconEl.className = 'w-8 h-8 text-red-500';
            btnConfirm.className = 'flex-1 py-3 rounded-xl font-bold transition-all duration-200 bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20';
        } else {
            iconBg.className = 'bg-amber-500/10 p-4 rounded-2xl';
            iconEl.className = 'w-8 h-8 text-amber-500';
            btnConfirm.className = 'flex-1 py-3 rounded-xl font-bold transition-all duration-200 bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md shadow-amber-500/20';
        }

        // Warning (esconder por padrão, a menos que queiramos usar no futuro)
        if (warning) warning.classList.add('hidden');

        // Ação
        btnConfirm.onclick = () => {
            onConfirm();
            this.hideConfirmModal();
        };

        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    },

    hideConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        if (modal) modal.classList.add('hidden');
    },

    async cancelAppointment(id) {
        this.showConfirmModal({
            title: "Cancelar Horário?",
            message: "Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.",
            icon: "alert-triangle",
            isDestructive: true,
            onConfirm: async () => {
                const { error } = await supabaseClient.from('appointments')
                    .update({ status: 'cancelled' })
                    .eq('id', id);

                if (error) {
                    this.showNotification("Erro ao cancelar", error.message);
                    return;
                }

                this.showNotification("Cancelado", "O seu agendamento foi cancelado com sucesso.");
                await this.loadInitialData();
                await this.loadAppointments();
                this.render();
            }
        });
    },

    editAppointment(id) {
        const apt = this.state.appointments.find(a => a.id === id);
        if (!apt) return;

        // Limpar e preparar o estado de agendamento com os dados atuais
        this.state.isBooking = true;
        this.state.editingAppointmentId = id;
        this.state.activeBookingStep = 1;
        this.state.selectedDate = apt.date;
        this.state.selectedTime = apt.time;
        this.state.selectedBarber = BARBERS.find(b => b.name === apt.barberName) || BARBERS[0];
        
        // Mapear serviços de volta (isso assume que os nomes batem)
        const names = apt.service.name.split(' + ');
        this.state.selectedServices = SERVICES.filter(s => names.includes(s.name));

        this.render();
    },

    initCompleteAppointment(id, paymentMethod) {
        this.state.confirmingPaymentId = id;
        this.state.confirmingPaymentMethod = paymentMethod;
        this.render();
    },

    cancelCompleteAppointment() {
        this.state.confirmingPaymentId = null;
        this.state.confirmingPaymentMethod = null;
        this.render();
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

    setReportsFilter(type) {
        this.state.reportsFilter = type;
        this.render();
    },

    setAppointmentsFilter(type) {
        this.state.appointmentsFilter = type;
        this.render();
    },

    setCustomReportRange() {
        const start = document.getElementById('report-start-date').value;
        const end = document.getElementById('report-end-date').value;
        if (start && end) {
            this.state.reportsCustomStart = start;
            this.state.reportsCustomEnd = end;
            this.render();
        }
    },

    clearNotifications() {
        this.state.unreadCount = 0;
        this.updateHeaderUI();
    },

    showNotification(title, message) {
        const toast = document.getElementById('toast-notification');
        document.getElementById('toast-title').innerText = title;
        document.getElementById('toast-message').innerText = message;

        toast.classList.remove('hidden');

        // Esconder após 4 segundos
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    },

    showConfirm(title, message, showWarning, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        document.getElementById('confirm-title').innerText = title;
        document.getElementById('confirm-message').innerText = message;
        
        const warning = document.getElementById('confirm-warning');
        if (showWarning) {
            warning.classList.remove('hidden');
        } else {
            warning.classList.add('hidden');
        }

        const btn = document.getElementById('btn-confirm-action');
        btn.onclick = () => {
            onConfirm();
            this.hideConfirm();
        };

        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    },

    hideConfirm() {
        document.getElementById('confirm-modal').classList.add('hidden');
    },

    // --- Atualizações de UI parciais ---
    updateNavUI() {
        const btnPerfil = document.getElementById('nav-perfil');
        const btnRelatorios = document.getElementById('nav-relatorios');
        const btnClientes = document.getElementById('nav-clientes');
        const btnBarbearia = document.getElementById('nav-barbearia');

        if (this.state.role === 'barber') {
            if (btnPerfil) btnPerfil.classList.add('hidden');
            if (btnRelatorios) btnRelatorios.classList.remove('hidden');
            if (btnClientes) btnClientes.classList.remove('hidden');
            if (btnBarbearia) btnBarbearia.classList.remove('hidden');
        } else {
            if (btnPerfil) btnPerfil.classList.remove('hidden');
            if (btnRelatorios) btnRelatorios.classList.add('hidden');
            if (btnClientes) btnClientes.classList.add('hidden');
            if (btnBarbearia) btnBarbearia.classList.remove('hidden');
        }

        document.querySelectorAll('.nav-btn').forEach(btn => {
            const isActive = btn.dataset.tab === this.state.activeTab;
            const iconContainer = btn.querySelector('.icon-container');

            // Cores do texto
            btn.classList.toggle('text-amber-500', isActive);
            btn.classList.toggle('text-muted-theme', !isActive);

            // Fundo do ícone
            iconContainer.classList.toggle('bg-amber-500/10', isActive);
            iconContainer.classList.toggle('bg-transparent', !isActive);
        });
    },

    updateHeaderUI() {
        const btnNotify = document.getElementById('btn-notifications');
        const badge = document.getElementById('notification-badge');

        if (this.state.role === 'barber') {
            btnNotify.classList.remove('hidden');
            if (this.state.unreadCount > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        } else {
            btnNotify.classList.add('hidden');
        }
    },

    // --- Renderização Principal ---
    render() {
        const main = document.getElementById('main-content');
        const header = document.getElementById('app-header');
        const nav = document.getElementById('bottom-nav');

        if (!this.state.isAuthenticated) {
            header.classList.add('hidden');
            nav.classList.add('hidden');

            if (this.state.authView === 'login') {
                main.innerHTML = this.renderLogin();
            } else if (this.state.authView === 'register') {
                main.innerHTML = this.renderRegister();
            } else if (this.state.authView === 'forgot') {
                main.innerHTML = this.renderForgotPassword();
            }
        } else {
            header.classList.remove('hidden');
            nav.classList.remove('hidden');
            this.updateNavUI();
            this.updateHeaderUI();

            let html = '';

            if (this.state.activeTab === 'agendamentos') {
                html = this.renderAgendamentos();
            } else if (this.state.activeTab === 'perfil') {
                html = this.renderPerfil();
            } else if (this.state.activeTab === 'relatorios') {
                html = this.renderRelatorios();
            } else if (this.state.activeTab === 'clientes') {
                html = this.renderClientes();
            } else if (this.state.activeTab === 'barbearia') {
                html = this.renderBarbearia();
            } else if (this.state.activeTab === 'configuracoes') {
                html = this.renderConfiguracoes();
            }

            main.innerHTML = html;
        }

        // Renderizar Lembrete Flutuante Global (Sino)
        const reminderHtml = this.renderReminderCard(this.getUpcomingReminder());
        const reminderBox = document.getElementById('reminder-container');
        if (reminderBox) {
            reminderBox.innerHTML = reminderHtml;
        }

        // Recriar os ícones Lucide recém inseridos no DOM
        if (window.lucide) {
            lucide.createIcons();
        }
    },

    renderLoyaltyCard(count = 0) {
        const total = 10;
        const progress = count % total;
        const slots = Array.from({ length: total }, (_, i) => i < progress);

        return `
            <div class="loyalty-card rounded-2xl p-5 shadow-2xl space-y-4">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-2">
                        <div class="bg-amber-500/20 p-1.5 rounded-lg">
                            <i data-lucide="award" class="w-4 h-4 text-amber-500"></i>
                        </div>
                        <h3 class="text-sm font-bold text-zinc-100 uppercase tracking-widest">VIP Member</h3>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest leading-none">Status</p>
                        <p class="text-xs font-bold text-amber-500 mt-0.5">${count >= 10 ? 'PREMIUM' : 'SILVER'}</p>
                    </div>
                </div>

                <div class="grid grid-cols-5 gap-2.5">
                    ${slots.map((active, i) => `
                        <div class="stamp-slot ${active ? 'stamp-active' : 'stamp-inactive'}">
                            <i data-lucide="${active ? 'check' : 'scissors'}" class="w-5 h-5"></i>
                        </div>
                    `).join('')}
                </div>

                <div class="pt-2 border-t border-white/5">
                    <div class="flex justify-between items-center">
                        <div class="flex-1">
                            <div class="flex justify-between items-center mb-1.5">
                                <span class="text-[10px] text-zinc-400 font-bold uppercase">${progress === 0 ? 'Meta Alcançada!' : `${total - progress} cortes para o VIP`}</span>
                                <span class="text-[10px] text-zinc-500">${progress}/${total}</span>
                            </div>
                            <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div class="h-full bg-amber-500 shadow-lg shadow-amber-500/20 transition-all duration-1000" style="width: ${(progress / total) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    ${progress === 0 && count > 0 ? `
                        <p class="text-center text-amber-500 text-[10px] font-black uppercase tracking-tighter mt-3 animate-pulse">🎉 PRÓXIMO CORTE É POR NOSSA CONTA! 🎉</p>
                    ` : ''}
                </div>
            </div>
        `;
    },

    getUpcomingReminder() {
        if (this.state.role !== 'client') return null;

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        // Procurar o próximo agendamento de hoje que ainda não passou da hora
        const todayApts = this.state.appointments
            .filter(apt => apt.date === todayStr && apt.status === 'pending')
            .sort((a, b) => a.time.localeCompare(b.time));

        if (todayApts.length === 0) return null;

        const nextApt = todayApts.find(apt => {
            const [aptH, aptM] = apt.time.split(':').map(Number);
            const aptDate = new Date();
            aptDate.setHours(aptH, aptM, 0, 0);
            return aptDate > now;
        });

        if (!nextApt) return null;

        // Calcular tempo restante
        const [aptH, aptM] = nextApt.time.split(':').map(Number);
        const aptDate = new Date();
        aptDate.setHours(aptH, aptM, 0, 0);
        
        const diffMs = aptDate - now;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        let timeMsg = '';
        if (diffHrs > 0) {
            timeMsg = `em ${diffHrs}h ${diffMins}min`;
        } else {
            timeMsg = `em ${diffMins} minutos`;
        }

        return { apt: nextApt, timeMsg };
    },

    renderReminderCard(reminder) {
        if (!reminder) return '';
        
        return `
            <!-- Botão do Sino Flutuante -->
            <div onclick="App.toggleReminderPopup()" class="floating-bell pulse-warm">
                <i data-lucide="bell-ring" class="w-7 h-7 ${this.state.showReminderPopup ? '' : 'animate-bounce'}"></i>
            </div>

            <!-- Popover de Informações -->
            ${this.state.showReminderPopup ? `
                <div class="popover-card">
                    <div class="flex flex-col items-center text-center space-y-3">
                        <div class="bg-amber-500/20 p-3 rounded-full text-amber-500">
                            <i data-lucide="calendar-check" class="w-8 h-8"></i>
                        </div>
                        
                        <div>
                            <p class="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none">Seu próximo corte</p>
                            <h3 class="text-xl font-black text-theme mt-1">Hoje, às ${reminder.apt.time}</h3>
                            <p class="text-xs font-bold text-amber-500/80 mt-1 flex items-center justify-center gap-1">
                                <i data-lucide="timer" class="w-3.5 h-3.5"></i> Faltam ${reminder.timeMsg}
                            </p>
                        </div>

                        <div class="w-full pt-4 border-t border-white/5 flex gap-2">
                             <a href="https://wa.me/55?text=Ol%C3%A1,%20estou%20a%20caminho%20do%20meu%20hor%C3%A1rio%20das%20${reminder.apt.time}" target="_blank" class="flex-1 py-2 bg-[#25D366]/10 text-[#25D366] rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5">
                                <i data-lucide="message-circle" class="w-3 h-3"></i> WhatsApp
                            </a>
                            <button onclick="App.toggleReminderPopup()" class="p-2 input-bg text-zinc-400 rounded-xl">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    },

    // --- Vistas ---
    renderCalendar() {
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const year = this.state.currentYear;
        const month = this.state.currentMonth;

        const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let calendarHtml = `
            <div class="card-bg border border-theme rounded-2xl p-4 shadow-sm w-full font-sans">
                <!-- Header -->
                <div class="flex justify-between items-center mb-6">
                    <button onclick="App.prevMonth()" class="p-2 text-muted-theme hover:text-white transition-colors input-bg/50 hover:input-bg rounded-full">
                        <i data-lucide="chevron-left" class="w-5 h-5"></i>
                    </button>
                    <h4 class="text-theme font-bold text-lg capitalize tracking-wide">${monthNames[month]} de ${year}</h4>
                    <button onclick="App.nextMonth()" class="p-2 text-muted-theme hover:text-white transition-colors input-bg/50 hover:input-bg rounded-full">
                        <i data-lucide="chevron-right" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <!-- Days of Week -->
                <div class="grid grid-cols-7 gap-1 text-center mb-4">
                    ${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(day => `
                        <div class="text-xs font-semibold text-muted-theme">${day}</div>
                    `).join('')}
                </div>
                
                <!-- Days Grid -->
                <div class="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
        `;

        // Empty slots before 1st day
        for (let i = 0; i < firstDay; i++) {
            calendarHtml += `<div></div>`;
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(year, month, i);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            const isPast = dateObj < today;
            const isSelected = this.state.selectedDate === dateStr;

            if (isPast) {
                calendarHtml += `
                    <div class="flex justify-center items-center h-10 w-full text-zinc-600/30 font-medium cursor-not-allowed">
                        ${i}
                    </div>
                `;
            } else if (isSelected) {
                calendarHtml += `
                    <div class="flex justify-center items-center h-10 w-full cursor-pointer" onclick="App.selectDate('${dateStr}')">
                        <span class="bg-amber-500 text-zinc-950 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">${i}</span>
                    </div>
                `;
            } else {
                calendarHtml += `
                    <div class="flex justify-center items-center h-10 w-full cursor-pointer hover:input-bg/60 rounded-full group transition-colors" onclick="App.selectDate('${dateStr}')">
                        <span class="text-zinc-300 font-medium group-hover:text-white">${i}</span>
                    </div>
                `;
            }
        }

        calendarHtml += `
                </div>
            </div>
        `;

        return calendarHtml;
    },

    renderLogin() {
        return `
            <div class="space-y-6 fade-in slide-in-up mt-12">
                <div class="flex flex-col items-center justify-center space-y-4 mb-12">
                    <div class="bg-amber-500 p-4 rounded-2xl shadow-lg shadow-amber-500/20">
                        <i data-lucide="scissors" class="w-10 h-10 text-zinc-950"></i>
                    </div>
                    <h1 class="text-4xl font-bold tracking-tight text-white">FinnoTrato<span class="text-amber-500">Barber</span></h1>
                    <p class="text-muted-theme text-sm">O seu estilo nas suas mãos.</p>
                </div>

                <div class="space-y-4">
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-theme">Celular (WhatsApp)</label>
                        <input type="tel" id="login-phone" placeholder="(11) 99999-9999" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <label class="text-sm font-medium text-muted-theme">Senha</label>
                            <button onclick="App.setAuthView('forgot')" class="text-xs text-amber-500 font-medium hover:text-amber-400">Esqueci a senha</button>
                        </div>
                        <input type="password" id="login-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>
                </div>

                <div class="pt-4 space-y-4">
                    <button onclick="App.login()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25">
                        <i data-lucide="log-in" class="w-5 h-5"></i> Entrar
                    </button>
                    <button onclick="App.setAuthView('register')" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-transparent text-zinc-300 border border-theme hover:card-bg">
                        Criar uma nova conta
                    </button>
                </div>
            </div>
        `;
    },

    renderRegister() {
        return `
            <div class="space-y-6 fade-in slide-in-up mt-8">
                <div class="mb-8">
                    <button onclick="App.setAuthView('login')" class="flex items-center gap-2 text-muted-theme hover:text-white transition-colors mb-4">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Voltar
                    </button>
                    <h2 class="text-3xl font-bold text-theme">Criar Conta</h2>
                    <p class="text-muted-theme mt-1">Preencha os dados abaixo.</p>
                </div>

                <div class="space-y-4">
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-theme">Nome Completo</label>
                        <input type="text" id="reg-name" placeholder="João da Silva" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-muted-theme">CPF</label>
                            <input type="tel" id="reg-cpf" placeholder="000.000.000-00" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-muted-theme">Nascimento</label>
                            <input type="tel" id="reg-birth" placeholder="00/00/0000" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-theme">Celular (WhatsApp)</label>
                        <input type="tel" id="reg-phone" placeholder="(11) 99999-9999" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>
                    
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-theme">Criar Senha</label>
                        <input type="password" id="reg-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-theme">Confirmar Senha</label>
                        <input type="password" id="reg-confirm-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>
                </div>

                <div class="pt-4">
                    <button onclick="App.register()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25">
                        <i data-lucide="user-plus" class="w-5 h-5"></i> Finalizar Cadastro
                    </button>
                </div>
            </div>
        `;
    },

    renderForgotPassword() {
        if (this.state.recoveryStep === 'verify') {
            return `
                <div class="space-y-6 fade-in slide-in-up mt-8">
                    <div class="mb-8">
                        <button onclick="App.setAuthView('login')" class="flex items-center gap-2 text-muted-theme hover:text-white transition-colors mb-4">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Voltar
                        </button>
                        <h2 class="text-3xl font-bold text-theme">Recuperar Senha</h2>
                        <p class="text-muted-theme mt-1">Confirme sua identidade para redefinir.</p>
                    </div>

                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-muted-theme">Celular Cadastrado</label>
                            <input type="tel" id="forgot-phone" placeholder="(11) 99999-9999" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-2">
                                <label class="text-sm font-medium text-muted-theme">CPF</label>
                                <input type="tel" id="forgot-cpf" placeholder="000.000.000-00" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-sm font-medium text-muted-theme">Nascimento</label>
                                <input type="tel" id="forgot-birth" placeholder="00/00/0000" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div class="pt-4">
                        <button onclick="App.verifyRecovery()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25">
                            <i data-lucide="shield-check" class="w-5 h-5"></i> Verificar Identidade
                        </button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="space-y-6 fade-in slide-in-up mt-8">
                    <div class="mb-8">
                        <h2 class="text-3xl font-bold text-theme">Nova Senha</h2>
                        <p class="text-muted-theme mt-1">Identidade confirmada! Defina sua nova senha.</p>
                    </div>

                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-muted-theme">Nova Senha</label>
                            <input type="password" id="new-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-muted-theme">Confirmar Nova Senha</label>
                            <input type="password" id="new-confirm-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                        </div>
                    </div>

                    <div class="pt-4">
                        <button onclick="App.resetPassword()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25">
                            <i data-lucide="save" class="w-5 h-5"></i> Atualizar Senha
                        </button>
                    </div>
                </div>
            `;
        }
    },

    renderAgendamentos() {
        if (this.state.role === 'barber') {
            const todayObj = new Date();
            const year = todayObj.getFullYear();
            const monthStr = String(todayObj.getMonth() + 1).padStart(2, '0');
            const dateStr = String(todayObj.getDate()).padStart(2, '0');
            const dayOfWeek = todayObj.getDay();

            const todayFormatted = `${year}-${monthStr}-${dateStr}`;
            const thisMonthFormatted = `${year}-${monthStr}`;

            const startOfWeek = new Date(todayObj);
            startOfWeek.setDate(todayObj.getDate() - dayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0);

            let filteredApts = this.state.appointments;

            if (this.state.appointmentsFilter === 'day') {
                filteredApts = filteredApts.filter(a => a.date === todayFormatted);
            } else if (this.state.appointmentsFilter === 'week') {
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                filteredApts = filteredApts.filter(a => {
                    const aptDate = new Date(a.date + 'T00:00:00'); // parse safely
                    return aptDate >= startOfWeek && aptDate <= endOfWeek;
                });
            } else if (this.state.appointmentsFilter === 'month') {
                filteredApts = filteredApts.filter(a => a.date.startsWith(thisMonthFormatted));
            }

            return `
                <div class="space-y-6 fade-in slide-in-up">
                    <div class="flex flex-col gap-4 mb-2">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-theme">Agenda</h2>
                            <span class="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-medium">
                                ${filteredApts.length} cortes
                            </span>
                        </div>
                        
                    </div>

                    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style="-ms-overflow-style: none; scrollbar-width: none;">
                            <button onclick="App.setAppointmentsFilter('day')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.appointmentsFilter === 'day' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Hoje</button>
                            <button onclick="App.setAppointmentsFilter('week')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.appointmentsFilter === 'week' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Semana</button>
                            <button onclick="App.setAppointmentsFilter('month')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.appointmentsFilter === 'month' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Mês</button>
                        </div>
                    </div>

                    ${filteredApts.length === 0 ? `
                        <div class="text-center py-12 text-muted-theme">
                            <i data-lucide="calendar" class="w-16 h-16 mx-auto mb-4 opacity-20"></i>
                            <p>Nenhum agendamento encontrado.</p>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            ${filteredApts.map(apt => `
                                <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm border-l-4 border-l-amber-500">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <h3 class="font-semibold text-theme text-lg">${apt.clientName}</h3>
                                            <p class="text-muted-theme text-sm flex items-center gap-1 mt-1">
                                                <i data-lucide="scissors" class="w-4 h-4"></i> ${apt.service.name}
                                            </p>
                                        </div>
                                        <div class="text-right">
                                            <span class="text-amber-500 font-bold flex items-center gap-1 justify-end">
                                                <i data-lucide="clock" class="w-4 h-4"></i> ${apt.time}
                                            </span>
                                            <span class="text-xs text-muted-theme">${apt.date}</span>
                                        </div>
                                    </div>
                                    <!-- Ações Rápidas -->
                                    <div class="flex gap-2 mt-4 pt-4 border-t border-theme overflow-x-auto scrollbar-hide">
                                        <a href="https://wa.me/55${apt.clientPhone}?text=Olá%20${encodeURIComponent(apt.clientName)},%20seu%20horário%20de%20${encodeURIComponent(apt.time)}%20está%20chegando!%20Te%20aguardo." target="_blank" class="flex-shrink-0 flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-xs font-semibold">
                                            <i data-lucide="bell-ring" class="w-3.5 h-3.5"></i> Lembrete
                                        </a>
                                        <a href="https://wa.me/55${apt.clientPhone}" target="_blank" class="flex-shrink-0 flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors text-xs font-semibold">
                                            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> Mensagem
                                        </a>
                                        <a href="tel:+55${apt.clientPhone}" class="flex-shrink-0 flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors text-xs font-semibold">
                                            <i data-lucide="phone" class="w-3.5 h-3.5"></i> Ligar
                                        </a>
                                    </div>
                                    <div class="mt-4 pt-4 border-t border-theme">
                                        <p class="text-xs font-semibold text-muted-theme mb-2 uppercase tracking-wide">Como o cliente pagou?</p>
                                        ${this.state.confirmingPaymentId === apt.id ? `
                                            <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex flex-col items-center gap-3 fade-in">
                                                <p class="text-sm font-medium text-amber-500">Confirmar <span class="font-bold uppercase">${this.state.confirmingPaymentMethod}</span>?</p>
                                                <div class="flex gap-2 w-full">
                                                    <button onclick="App.cancelCompleteAppointment()" class="flex-1 py-2 rounded-lg font-medium transition-all duration-200 input-bg text-zinc-300 hover:bg-zinc-700 text-xs border border-zinc-700 active:scale-[0.98]">
                                                        Cancelar
                                                    </button>
                                                    <button onclick="App.completeAppointment()" class="flex-1 py-2 rounded-lg font-bold transition-all duration-200 bg-amber-500 text-zinc-950 hover:bg-amber-400 text-xs shadow-md shadow-amber-500/20 active:scale-[0.98]">
                                                        Finalizar
                                                    </button>
                                                </div>
                                            </div>
                                        ` : `
                                        <div class="grid grid-cols-2 gap-2">
                                            <button onclick="App.initCompleteAppointment(${apt.id}, 'Dinheiro')" class="py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 text-xs active:scale-[0.98]">
                                                <i data-lucide="banknote" class="w-4 h-4 text-emerald-500"></i> Dinheiro
                                            </button>
                                            <button onclick="App.initCompleteAppointment(${apt.id}, 'Pix')" class="py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 text-xs active:scale-[0.98]">
                                                <i data-lucide="zap" class="w-4 h-4 text-teal-400"></i> Pix
                                            </button>
                                            <button onclick="App.initCompleteAppointment(${apt.id}, 'Débito')" class="py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 text-xs active:scale-[0.98]">
                                                <i data-lucide="credit-card" class="w-4 h-4 text-blue-400"></i> Débito
                                            </button>
                                            <button onclick="App.initCompleteAppointment(${apt.id}, 'Crédito')" class="py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 text-xs active:scale-[0.98]">
                                                <i data-lucide="credit-card" class="w-4 h-4 text-amber-500"></i> Crédito
                                            </button>
                                        </div>
                                        `}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
        }

        // Visão Cliente
        if (!this.state.isBooking) {
            const clientApts = this.state.appointments;

            return `
                <div class="space-y-6 fade-in slide-in-up">
                    <div class="flex items-center justify-between">
                        <h2 class="text-2xl font-bold text-theme">Meus Cortes</h2>
                    </div>

                    <button onclick="App.startBooking()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md shadow-amber-500/20">
                        <i data-lucide="calendar" class="w-5 h-5"></i> Novo Agendamento
                    </button>

                    <div class="space-y-4 mt-8">
                        <h3 class="text-sm font-medium text-muted-theme uppercase tracking-wider">Próximos Agendamentos</h3>
                        ${clientApts.length === 0 ? `
                            <p class="text-muted-theme text-sm">Não tem nenhum agendamento futuro.</p>
                        ` : clientApts.map(apt => `
                            <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm flex items-center gap-4">
                                <div class="input-bg p-3 rounded-xl text-amber-500 flex-shrink-0">
                                    <i data-lucide="scissors" class="w-6 h-6"></i>
                                </div>
                                <div class="flex-1">
                                    <h4 class="font-semibold text-theme">${apt.service.name} <span class="font-normal text-xs text-muted-theme">com ${apt.barberName || 'Marcos Barbeiro'}</span></h4>
                                    <p class="text-xs text-muted-theme flex items-center gap-1 mt-1">
                                        <i data-lucide="calendar" class="w-3 h-3"></i> ${apt.date} às ${apt.time}
                                    </p>
                                </div>
                                <div class="text-right flex-shrink-0 flex flex-col items-end gap-2">
                                    <p class="text-sm font-medium text-zinc-300">${apt.service.price}</p>
                                    <div class="flex gap-2">
                                        <button onclick="App.editAppointment('${apt.id}')" class="p-2 input-bg text-amber-500 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 active:scale-95" title="Alterar Horário">
                                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                                        </button>
                                        <button onclick="App.cancelAppointment('${apt.id}')" class="p-2 input-bg text-rose-500 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 active:scale-95" title="Cancelar">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Formulário de Agendamento (Cliente)
        const today = new Date().toISOString().split('T')[0];
        return `
            <div class="space-y-6 fade-in slide-in-up">
                <div class="flex items-center justify-between">
                    <h2 class="text-2xl font-bold text-theme">Novo Agendamento</h2>
                    <button onclick="App.cancelBooking()" class="p-2 input-bg rounded-full text-muted-theme hover:text-white transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Passo 1: Data -->
                <div class="card-bg border border-theme rounded-2xl overflow-hidden shadow-sm transition-all">
                    <!-- Header -->
                    <div class="p-4 flex justify-between items-center cursor-pointer ${this.state.activeBookingStep === 1 ? 'border-b border-theme' : ''}" onclick="App.setBookingStep(1)">
                        <div class="flex items-center gap-3">
                            <i data-lucide="calendar" class="w-5 h-5 ${this.state.selectedDate && this.state.activeBookingStep !== 1 ? 'text-amber-500' : 'text-muted-theme'}"></i>
                            <div>
                                <h3 class="font-bold text-theme">Disponibilidade</h3>
                                <p class="text-xs text-muted-theme mt-0.5">${this.state.selectedDate && this.state.activeBookingStep !== 1 ? `Data: ${this.state.selectedDate}` : 'Selecione datas'}</p>
                            </div>
                        </div>
                        <i data-lucide="${this.state.activeBookingStep === 1 ? 'chevron-up' : 'chevron-down'}" class="w-5 h-5 text-muted-theme"></i>
                    </div>
                    
                    <!-- Corpo -->
                    ${this.state.activeBookingStep === 1 ? `
                        <div class="p-4 fade-in app-bg/30">
                            ${this.renderCalendar()}
                        </div>
                    ` : ''}
                </div>

                <!-- Passo 2: Horário e Profissional -->
                <div class="${this.state.selectedDate ? 'block' : 'hidden'} card-bg border border-theme rounded-2xl overflow-hidden shadow-sm transition-all mt-4">
                    <div class="p-4 flex justify-between items-center cursor-pointer ${this.state.activeBookingStep === 2 ? 'border-b border-theme' : ''}" onclick="App.setBookingStep(2)">
                        <div class="flex items-center gap-3">
                            <i data-lucide="clock" class="w-5 h-5 ${this.state.selectedTime && this.state.activeBookingStep !== 2 ? 'text-amber-500' : 'text-muted-theme'}"></i>
                            <div>
                                <h3 class="font-bold text-theme">Horário e Barbeiro</h3>
                                <p class="text-xs text-muted-theme mt-0.5">${this.state.selectedTime && this.state.activeBookingStep !== 2 ? `${this.state.selectedTime} com ${this.state.selectedBarber?.name.split(' ')[0]}` : 'Escolha a agenda'}</p>
                            </div>
                        </div>
                        <i data-lucide="${this.state.activeBookingStep === 2 ? 'chevron-up' : 'chevron-down'}" class="w-5 h-5 text-muted-theme"></i>
                    </div>

                    ${this.state.activeBookingStep === 2 ? `
                        <div class="p-4 fade-in app-bg/30 space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
                            ${AVAILABLE_TIMES.map((time, idx) => {
            // Lógica real de disponibilidade: Verifica agendamentos no banco para a data selecionada
            const availableBarbers = BARBERS.filter(barber => {
                // 1. Verifica se o Barbeiro bloqueou esse horário manualmente
                if (this.state.blockedTimes.includes(time)) return false; 
                
                // 2. Verifica se já existe um agendamento para este Barbeiro neste Dia e Hora
                const isOccupied = this.state.allAppointmentsForStats?.some(apt => 
                    apt.date === this.state.selectedDate && 
                    apt.time === time && 
                    apt.barber_id === barber.user_id // Comparação agora usa UUID (user_id)
                );

                return !isOccupied;
            });

            if (availableBarbers.length === 0) return ''; // Ninguém disponível no horário

            return `
                                <div class="p-3 card-bg border border-theme rounded-xl flex items-center justify-between shadow-sm">
                                    <span class="text-xl font-bold text-theme">${time}</span>
                                    <div class="flex gap-4">
                                        ${availableBarbers.map(barber => {
                const isSelected = this.state.selectedTime === time && this.state.selectedBarber?.id === barber.id;
                return `
                                            <div onclick="App.selectTimeAndBarber('${time}', ${barber.id})" class="cursor-pointer transition-all flex flex-col items-center gap-1 ${isSelected ? 'scale-110' : 'hover:scale-105 opacity-60 hover:opacity-100'}">
                                                <div class="relative">
                                                    <img src="${barber.avatar}" alt="${barber.name}" class="w-12 h-12 rounded-full input-bg border-2 ${isSelected ? 'border-amber-500 object-cover shadow-md shadow-amber-500/20' : 'border-zinc-700 object-cover'}">
                                                    ${isSelected ? '<div class="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 shadow-sm"><i data-lucide="check" class="w-3 h-3 text-zinc-950"></i></div>' : ''}
                                                </div>
                                                <span class="text-[10px] ${isSelected ? 'text-amber-500 font-bold' : 'text-muted-theme font-medium'}">${barber.name.split(' ')[0]}</span>
                                            </div>
                                            `;
            }).join('')}
                                    </div>
                                </div>
                                `;
        }).join('')}
                        </div>
                    ` : ''}
                </div>

                <!-- Passo 3: Serviços -->
                <div class="${this.state.selectedTime && this.state.selectedBarber ? 'block' : 'hidden'} card-bg border border-theme rounded-2xl overflow-hidden shadow-sm transition-all mt-4">
                    <div class="p-4 flex justify-between items-center cursor-pointer ${this.state.activeBookingStep === 3 ? 'border-b border-theme' : ''}" onclick="App.setBookingStep(3)">
                        <div class="flex items-center gap-3">
                            <i data-lucide="scissors" class="w-5 h-5 ${this.state.selectedServices.length > 0 && this.state.activeBookingStep !== 3 ? 'text-amber-500' : 'text-muted-theme'}"></i>
                            <div>
                                <h3 class="font-bold text-theme">Serviços com ${this.state.selectedBarber?.name.split(' ')[0] || ''}</h3>
                                <p class="text-xs text-muted-theme mt-0.5">${this.state.selectedServices.length > 0 && this.state.activeBookingStep !== 3 ? `${this.state.selectedServices.length} serviço(s) selecionado(s)` : 'Selecione o que deseja'}</p>
                            </div>
                        </div>
                        <i data-lucide="${this.state.activeBookingStep === 3 ? 'chevron-up' : 'chevron-down'}" class="w-5 h-5 text-muted-theme"></i>
                    </div>

                    ${this.state.activeBookingStep === 3 ? `
                        <div class="p-4 fade-in app-bg/30 grid gap-2">
                            ${SERVICES.map(svc => {
            const isSelected = this.state.selectedServices.some(s => s.id === svc.id);
            return `
                                <div onclick="App.toggleService(${svc.id})" class="p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-theme input-bg hover:border-zinc-700'} flex items-center gap-3">
                                    <div class="w-5 h-5 rounded border ${isSelected ? 'bg-amber-500 border-amber-500 text-zinc-950 flex items-center justify-center' : 'border-zinc-600'}">
                                        ${isSelected ? '<i data-lucide="check" class="w-3 h-3"></i>' : ''}
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex justify-between items-center">
                                            <h4 class="font-semibold text-theme">${svc.name}</h4>
                                            <span class="font-medium text-amber-500">${svc.price}</span>
                                        </div>
                                    </div>
                                </div>
                                `;
        }).join('')}
                        </div>
                    ` : ''}
                </div>

                <!-- 4. Confirmar -->
                ${this.state.selectedServices.length > 0 ? `
                    <div class="pt-6 fade-in slide-in-up space-y-4">
                        <div class="p-4 card-bg border border-theme rounded-xl flex justify-between items-center shadow-lg border-l-4 border-l-amber-500">
                            <div>
                                <p class="text-muted-theme text-sm">Resumo da Visita</p>
                                <p class="text-xs text-muted-theme flex items-center gap-1 mt-0.5"><i data-lucide="clock" class="w-3 h-3"></i> Total de ${this.state.selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0)} min</p>
                            </div>
                            <span class="text-xl font-bold text-amber-500">R$ ${this.state.selectedServices.reduce((sum, s) => sum + s.priceValue, 0).toFixed(2).replace('.', ',')}</span>
                        </div>
                        <button onclick="App.confirmBooking()" class="w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md shadow-amber-500/20">
                            Confirmar Agendamento
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderRelatorios() {
        const todayObj = new Date();
        const year = todayObj.getFullYear();
        const month = String(todayObj.getMonth() + 1).padStart(2, '0');
        const date = String(todayObj.getDate()).padStart(2, '0');
        const dayOfWeek = todayObj.getDay(); // 0(Sun)-6(Sat)

        const todayStr = `${year}-${month}-${date}`;
        const thisMonthStr = `${year}-${month}`;

        // Start of week (Sunday)
        const startOfWeek = new Date(todayObj);
        startOfWeek.setDate(todayObj.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        let filteredTxs = this.state.completedTransactions.filter(tx => {
            const txDateObj = new Date(tx.completedAt);
            const _y = txDateObj.getFullYear();
            const _m = String(txDateObj.getMonth() + 1).padStart(2, '0');
            const _d = String(txDateObj.getDate()).padStart(2, '0');
            const txDateStr = `${_y}-${_m}-${_d}`;

            switch (this.state.reportsFilter) {
                case 'day': return txDateStr === todayStr;
                case 'week': return txDateObj >= startOfWeek && txDateObj <= todayObj;
                case 'month': return txDateStr.startsWith(thisMonthStr);
                case 'year': return txDateStr.startsWith(`${year}`);
                case 'custom':
                    if (!this.state.reportsCustomStart || !this.state.reportsCustomEnd) return false;
                    return txDateStr >= this.state.reportsCustomStart && txDateStr <= this.state.reportsCustomEnd;
                default: return true;
            }
        });

        const periodTotal = filteredTxs.reduce((sum, tx) => sum + tx.numericValue, 0);

        const filterLabels = {
            'day': 'Hoje', 'week': 'Na Semana', 'month': 'No Mês', 'year': 'No Ano', 'custom': 'No Período'
        };

        const activeLabel = filterLabels[this.state.reportsFilter];

        // Limit visually to 50 for performance
        const displayTxs = [...filteredTxs].reverse().slice(0, 50);

        const isManagement = this.state.role === 'admin' || this.state.role === 'manager';
        const reportTitle = isManagement ? 'Balanço Financeiro Global' : 'Meu Desempenho Financeiro';
        const revenueLabel = isManagement ? 'Faturamento Total da Casa' : 'Minhas Entradas Totais';

        return `
            <div class="space-y-6 fade-in">
                <!-- Header / Filters -->
                <div class="flex flex-col gap-4 mb-2">
                    <h2 class="text-2xl font-bold text-theme">${reportTitle}</h2>
                    
                    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style="-ms-overflow-style: none; scrollbar-width: none;">
                        <button onclick="App.setReportsFilter('day')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.reportsFilter === 'day' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Hoje</button>
                        <button onclick="App.setReportsFilter('week')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.reportsFilter === 'week' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Semana</button>
                        <button onclick="App.setReportsFilter('month')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.reportsFilter === 'month' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Mês</button>
                        <button onclick="App.setReportsFilter('year')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.reportsFilter === 'year' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Ano</button>
                        <button onclick="App.setReportsFilter('custom')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center ${this.state.reportsFilter === 'custom' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">
                            <i data-lucide="calendar-search" class="w-4 h-4"></i>
                        </button>
                    </div>

                    ${this.state.reportsFilter === 'custom' ? `
                        <div class="card-bg border border-theme p-3 rounded-xl flex gap-2 items-end fade-in">
                            <div class="flex-1">
                                <label class="text-xs text-muted-theme mb-1 block">De</label>
                                <input type="date" id="report-start-date" value="${this.state.reportsCustomStart}" class="w-full input-bg text-zinc-300 text-sm rounded-lg p-2 border-none outline-none focus:ring-1 focus:ring-amber-500">
                            </div>
                            <div class="flex-1">
                                <label class="text-xs text-muted-theme mb-1 block">Até</label>
                                <input type="date" id="report-end-date" value="${this.state.reportsCustomEnd}" class="w-full input-bg text-zinc-300 text-sm rounded-lg p-2 border-none outline-none focus:ring-1 focus:ring-amber-500">
                            </div>
                            <button onclick="App.setCustomReportRange()" class="bg-amber-500 text-zinc-950 p-2 rounded-lg font-bold hover:bg-amber-400 active:scale-95"><i data-lucide="search" class="w-5 h-5"></i></button>
                        </div>
                    ` : ''}
                </div>

                <!-- Resumo Principal -->
                <div class="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 shadow-lg shadow-amber-500/20 relative overflow-hidden transition-all duration-300">
                    <div class="absolute right-[-20px] top-[-20px] opacity-20">
                        <i data-lucide="trending-up" class="w-32 h-32 text-zinc-950"></i>
                    </div>
                    <p class="text-zinc-900 font-medium text-sm">Entradas ${activeLabel}</p>
                    <h3 class="text-4xl font-bold text-zinc-950 mt-1 mb-4">R$ ${periodTotal.toFixed(2).replace('.', ',')}</h3>
                    
                    <div class="flex justify-between items-center text-zinc-900 text-sm font-medium pt-3 border-t border-zinc-950/20">
                        <span>${filteredTxs.length} serviços finalizados</span>
                        <p class="text-[10px] uppercase font-black opacity-60">${revenueLabel}</p>
                    </div>
                </div>

                <!-- Histórico e Métodos de Pgto -->
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <h3 class="text-sm font-medium text-muted-theme uppercase tracking-wider">Histórico do Período</h3>
                        ${filteredTxs.length > 50 ? `<span class="text-xs text-amber-500">Mostrando 50 recentes</span>` : ''}
                    </div>
                    
                    ${displayTxs.length === 0 ? `
                        <div class="text-center py-8 text-muted-theme card-bg rounded-xl border border-theme">
                            <i data-lucide="wallet" class="w-10 h-10 mx-auto mb-2 opacity-30"></i>
                            <p class="text-sm cursor-default">Nenhum valor no período selecionado.</p>
                        </div>
                    ` : `
                        <div class="space-y-3 pb-8">
                            ${displayTxs.map(tx => `
                                <div class="card-bg rounded-xl border border-theme p-3 shadow-sm flex items-center justify-between hover:border-zinc-700 transition-colors">
                                    <div class="flex items-center gap-3">
                                        <div class="input-bg p-2 rounded-lg flex items-center justify-center">
                                            ${tx.paymentMethod === 'Pix' ? '<i data-lucide="zap" class="w-5 h-5 text-teal-400"></i>' : tx.paymentMethod === 'Dinheiro' ? '<i data-lucide="banknote" class="w-5 h-5 text-emerald-500"></i>' : tx.paymentMethod === 'Débito' ? '<i data-lucide="credit-card" class="w-5 h-5 text-blue-400"></i>' : '<i data-lucide="credit-card" class="w-5 h-5 text-amber-500"></i>'}
                                        </div>
                                        <div>
                                            <p class="font-medium text-theme text-sm">${tx.clientName}</p>
                                            <p class="text-xs text-muted-theme">${tx.service.name} • <span class="capitalize">${tx.paymentMethod}</span></p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-bold text-amber-500">R$ ${tx.numericValue.toFixed(2).replace('.', ',')}</p>
                                        <p class="text-[10px] text-muted-theme font-mono mt-0.5">${tx.date} • ${tx.time}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    renderClientes() {
        // Ordena por quantidade de cortes (clientes mais fiéis primeiro)
        const sortedClients = [...CLIENTES].sort((a, b) => b.cutCount - a.cutCount);

        return `
            <div class="space-y-6 fade-in slide-in-up">
                <div class="flex flex-col gap-4 mb-2">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-theme">Meus Clientes</h2>
                        <span class="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-medium">
                            ${sortedClients.length} no total
                        </span>
                    </div>
                    
                    <div class="relative mt-2 flex items-center">
                        <i data-lucide="search" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-theme"></i>
                        <input type="text" placeholder="Buscar por nome ou celular..." class="w-full card-bg border border-theme rounded-xl pl-10 pr-4 py-3 text-sm text-theme focus:outline-none focus:border-amber-500 transition-colors shadow-sm" readonly onclick="App.showNotification('Busca', 'Funcionalidade de busca de clientes virá em breve.')" />
                    </div>
                </div>

                <div class="space-y-4 pb-4">
                    ${sortedClients.map(client => `
                        <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm flex flex-col gap-4 hover:border-zinc-700 transition-colors">
                            <div class="flex items-center gap-4">
                                <img src="${client.avatar}" alt="${client.name}" class="w-14 h-14 rounded-full input-bg border flex-shrink-0 border-zinc-700 object-cover" />
                                <div class="flex-1 min-w-0">
                                    <h3 class="font-bold text-theme text-lg truncate">${client.name}</h3>
                                    <p class="text-muted-theme text-xs flex items-center gap-1.5 mt-0.5 truncate">
                                        <i data-lucide="mail" class="w-3 h-3 text-muted-theme"></i> ${client.email}
                                    </p>
                                </div>
                                <div class="text-right flex-shrink-0">
                                    <div class="inline-flex flex-col items-center justify-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1.5 min-w-[50px]">
                                        <span class="text-amber-500 font-bold text-sm leading-none">${client.cut_count || 0}</span>
                                        <span class="text-[10px] text-amber-500/80 font-medium uppercase mt-0.5 tracking-wider">Cortes</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Ações de Contato -->
                            <div class="flex gap-2 pt-4 border-t border-theme">
                                <a href="https://wa.me/55${client.phone}" target="_blank" class="flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-xs font-bold">
                                    <i data-lucide="message-square" class="w-4 h-4"></i> WhatsApp
                                </a>
                                <a href="tel:+55${client.phone}" class="flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors text-xs font-bold">
                                    <i data-lucide="phone" class="w-4 h-4"></i> Ligar
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderBarbearia() {
        const s = this.state.shopSettings;
        const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);
        const isEditing = this.state.isEditingShop;

        if (isEditing && isStaff) {
            return `
                <div class="space-y-6 fade-in pb-6">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h2 class="text-2xl font-bold text-theme">Editar Barbearia</h2>
                            <p class="text-xs text-muted-theme">Atualize sua marca e contatos.</p>
                        </div>
                        <button onclick="App.toggleShopEdit()" class="p-2 input-bg rounded-full text-muted-theme hover:text-white">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4 flex items-center gap-3">
                        <i data-lucide="info" class="w-5 h-5 text-amber-500"></i>
                        <p class="text-[10px] text-amber-200/80 font-medium leading-relaxed uppercase">
                            Não precisa digitar <span class="bg-amber-500 text-zinc-950 px-1 rounded font-bold">55</span> nos números. O sistema formata e adiciona o código do Brasil automaticamente para você!
                        </p>
                    </div>

                    <div class="card-bg rounded-2xl border border-theme p-6 space-y-5 shadow-xl">
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Nome da Barbearia</label>
                            <input type="text" id="shop-name" value="${s.name}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">URL do Logo (Imagem)</label>
                            <input type="text" id="shop-logo" value="${s.logo_url || ''}" placeholder="https://exemplo.com/logo.png" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Rua e Número</label>
                                <input type="text" id="shop-street" value="${s.address_street}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Cidade / Estado</label>
                                <input type="text" id="shop-city" value="${s.address_city}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">WhatsApp (Apenas Números)</label>
                                <input type="text" id="shop-whatsapp" value="${s.whatsapp}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Telefone Comercial</label>
                                <input type="text" id="shop-phone" value="${s.phone}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                        </div>
                        <div class="space-y-4 pt-2 border-t border-theme/50">
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">URL Instagram</label>
                                <input type="text" id="shop-instagram" value="${s.instagram_url}" class="w-full input-bg border border-zinc-700 rounded-xl p-2 text-theme focus:border-amber-500 outline-none transition-colors text-xs" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">URL Facebook</label>
                                <input type="text" id="shop-facebook" value="${s.facebook_url || ''}" class="w-full input-bg border border-zinc-700 rounded-xl p-2 text-theme focus:border-amber-500 outline-none transition-colors text-xs" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">URL do Google (Avaliação)</label>
                                <input type="text" id="shop-google" value="${s.google_review_url}" class="w-full input-bg border border-zinc-700 rounded-xl p-2 text-theme focus:border-amber-500 outline-none transition-colors text-xs" />
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button onclick="App.toggleShopEdit()" class="flex-1 py-4 rounded-xl font-bold transition-all duration-200 input-bg text-muted-theme hover:bg-zinc-700 border border-zinc-700 shadow-sm">
                            Cancelar
                        </button>
                        <button onclick="App.saveShopSettings()" class="flex-1 py-4 rounded-xl font-bold transition-all duration-200 bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-xl shadow-amber-500/20">
                            Salvar
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-6 fade-in slide-in-up pb-6">
                <!-- Título -->
                <div class="flex justify-between items-center mb-2">
                    <div class="flex flex-col gap-2">
                        <h2 class="text-2xl font-bold text-theme">A Barbearia</h2>
                        <p class="text-xs text-muted-theme">Siga nossas redes e venha nos visitar.</p>
                    </div>
                    ${isStaff ? `
                        <button onclick="App.toggleShopEdit()" class="p-2.5 bg-amber-500 text-zinc-950 rounded-xl hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/20 flex items-center gap-2 font-bold text-xs">
                            <i data-lucide="edit-3" class="w-4 h-4"></i> Editar
                        </button>
                    ` : ''}
                </div>

                <!-- Intro -->
                <div class="relative card-bg border border-theme rounded-3xl p-8 shadow-xl overflow-hidden flex flex-col items-center text-center mt-4">
                    <div class="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <div class="w-24 h-24 rounded-full flex items-center justify-center mb-5 z-10 border-4 border-zinc-950 shadow-2xl relative overflow-hidden bg-zinc-900">
                        ${s.logo_url ? `
                            <img src="${s.logo_url}" alt="Logo" class="w-full h-full object-cover">
                        ` : `
                            <i data-lucide="scissors" class="w-10 h-10 text-amber-500"></i>
                        `}
                    </div>
                    <h2 class="text-3xl font-black text-theme relative z-10 tracking-tight italic uppercase">${s.name}</h2>
                    <p class="text-muted-theme text-sm mt-2 relative z-10 font-medium">A melhor experiência em estilo e cuidado.</p>
                </div>

                <!-- Contatos Rápidos -->
                <div class="space-y-4">
                    <h3 class="text-[10px] font-bold text-muted-theme uppercase tracking-[0.25em] mb-4 mt-8 flex items-center gap-2">
                        <div class="w-8 h-px bg-theme/20"></div> Contato e Redes Sociais
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                        <a href="https://wa.me/${s.whatsapp}" target="_blank" class="bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/10 hover:bg-[#25D366]/20 transition-all duration-300 rounded-3xl p-4 flex flex-col items-center gap-3 justify-center shadow-lg active:scale-95">
                            <div class="bg-[#25D366]/20 p-2.5 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.012 2c-5.508 0-9.987 4.479-9.987 9.988 0 1.75.452 3.457 1.319 4.972L2 22l5.161-1.353a9.948 9.948 0 0 0 4.851 1.226c5.509 0 10.013-4.504 10.013-10.013s-4.504-10.012-10.013-10.012zm5.823 14.16c-.25.713-1.464 1.3-2.022 1.38-.501.071-1.077.106-1.745-.107-2.617-.837-4.305-3.486-4.436-3.66-.131-.174-1.063-1.411-1.063-2.695 0-1.284.672-1.921.912-2.181.25-.26-.145-.51-.145-.51l1.107-.107c.25.011.511.022.753.593.25.592.511 1.254.511 1.254s.061.127.018.239a.44.44 0 0 1-.223.239c-.131.061-.223.111-.315.207-.131.131-.274.275-.018.711.25.436.56 1.01.99 1.48.583.633 1.137.95 1.623 1.17 1.545.698 2.37.5 2.766.1a1.8 1.8 0 0 1 .536-.71c.145-.126.315-.175.56-.08.68.254 1.25.54 2.1 1.05zm0 0"/></svg>
                            </div>
                            <span class="text-xs font-black uppercase tracking-tighter">WhatsApp</span>
                        </a>
                        <a href="tel:+55${s.phone.replace(/\D/g, '')}" class="input-bg text-theme border border-theme/50 hover:bg-zinc-700 transition-all duration-300 rounded-3xl p-4 flex flex-col items-center gap-3 justify-center shadow-lg active:scale-95">
                            <div class="bg-zinc-800 p-2.5 rounded-xl border border-white/5">
                                <i data-lucide="phone" class="w-6 h-6"></i>
                            </div>
                            <span class="text-xs font-black uppercase tracking-tighter">${this.formatDisplayPhone(s.phone)}</span>
                        </a>
                        <a href="${s.instagram_url}" target="_blank" class="bg-gradient-to-tr from-[#f09433]/10 via-[#e6683c]/10 to-[#bc1888]/10 text-[#e1306c] border border-[#e1306c]/10 hover:bg-[#e1306c]/20 transition-all duration-300 rounded-3xl p-4 flex flex-col items-center gap-3 justify-center shadow-lg active:scale-95">
                            <div class="bg-[#bc1888]/20 p-2.5 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                            </div>
                            <span class="text-xs font-black uppercase tracking-tighter">Instagram</span>
                        </a>
                        <a href="${s.facebook_url || '#'}" target="_blank" class="bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-all duration-300 rounded-3xl p-4 flex flex-col items-center gap-3 justify-center shadow-lg active:scale-95">
                            <div class="bg-[#1877F2]/20 p-2.5 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.792 5 15.536 5H18V0h-3.977C10.038 0 9 2.105 9 5.589V8z"/></svg>
                            </div>
                            <span class="text-xs font-black uppercase tracking-tighter">Facebook</span>
                        </a>
                    </div>
                    
                    <!-- Novo: Botão Google Review -->
                    <div class="mt-4 pt-4 border-t border-theme/20">
                        <a href="${s.google_review_url}" target="_blank" class="w-full bg-zinc-800/40 hover:bg-zinc-800/60 border border-theme/50 transition-all duration-300 rounded-3xl p-5 flex items-center justify-between shadow-sm group active:scale-[0.98]">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-2xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-full h-full">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/>
                                    </svg>
                                </div>
                                <div class="text-left">
                                    <h4 class="text-sm font-bold text-theme">Avalie-nos no Google</h4>
                                    <p class="text-[10px] text-muted-theme font-medium leading-none mt-1">Sua nota nos ajuda a crescer!</p>
                                </div>
                            </div>
                            <div class="bg-amber-500/10 p-2.5 rounded-xl text-amber-500 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all duration-500 shadow-inner">
                                <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                            </div>
                        </a>
                    </div>
                </div>

                <div class="space-y-4 pt-6">
                    <h3 class="text-[10px] font-bold text-muted-theme uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                        <div class="w-8 h-px bg-theme/20"></div> Nossa Localização
                    </h3>
                    <div class="card-bg border border-theme rounded-3xl p-6 shadow-xl flex flex-col gap-6 group hover:border-amber-500/30 transition-all duration-300">
                        <div class="flex items-center gap-5">
                            <div class="bg-zinc-900 border border-amber-500/20 p-4 rounded-2xl text-amber-500 self-start shadow-inner group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all duration-500">
                                <i data-lucide="map-pin" class="w-7 h-7"></i>
                            </div>
                            <div class="flex-1">
                                <p class="font-black text-theme text-lg italic tracking-tight uppercase">${s.address_street}</p>
                                <p class="text-sm text-muted-theme font-medium mt-1">${s.address_city}</p>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="App.copyAddress()" class="p-3 bg-zinc-800 text-amber-500 rounded-xl hover:bg-zinc-700 transition-all active:scale-95 border border-amber-500/10 shadow-sm" title="Copiar Endereço">
                                    <i data-lucide="copy" class="w-5 h-5"></i>
                                </button>
                                <button onclick="App.shareLocation()" class="p-3 bg-zinc-800 text-amber-500 rounded-xl hover:bg-zinc-700 transition-all active:scale-95 border border-amber-500/10 shadow-sm" title="Compartilhar">
                                    <i data-lucide="share-2" class="w-5 h-5"></i>
                                </button>
                            </div>
                        </div>
                        <a href="https://maps.google.com/?q=${encodeURIComponent(s.address_street + ', ' + s.address_city)}" target="_blank" class="w-full py-4 rounded-2xl font-black transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] bg-zinc-900 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-zinc-950 hover:border-amber-500 shadow-lg text-xs uppercase tracking-widest">
                            <i data-lucide="navigation" class="w-5 h-5"></i> Como chegar pelo Mapa
                        </a>
                    </div>
                </div>
            </div>
        `;
    },

    toggleShopEdit() {
        this.state.isEditingShop = !this.state.isEditingShop;
        this.render();
        if (this.state.isEditingShop) {
            this.applyMasks();
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
            address_street: document.getElementById('shop-street').value,
            address_city: document.getElementById('shop-city').value,
            phone: document.getElementById('shop-phone').value,
            whatsapp: whatsappRaw,
            instagram_url: document.getElementById('shop-instagram').value,
            facebook_url: document.getElementById('shop-facebook').value,
            google_review_url: document.getElementById('shop-google').value
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

    async copyAddress() {
        const addr = `${this.state.shopSettings.address_street}, ${this.state.shopSettings.address_city}`;
        try {
            await navigator.clipboard.writeText(addr);
            this.showNotification('Copiado!', 'Endereço copiado para a área de transferência.');
        } catch (err) {
            console.error('Falha ao copiar:', err);
        }
    },

    async shareLocation() {
        const addr = `${this.state.shopSettings.address_street}, ${this.state.shopSettings.address_city}`;
        const shareData = {
            title: this.state.shopSettings.name,
            text: `Visite a nossa barbearia: ${addr}`,
            url: `https://maps.google.com/?q=${encodeURIComponent(addr)}`
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`, '_blank');
            }
        } catch (err) {
            console.error('Erro ao compartilhar:', err);
        }
    },

    formatDisplayPhone(phone) {
        if (!phone) return '';
        // Remove tudo que não é número
        let cleaned = phone.replace(/\D/g, '');
        // Remove o 55 se existir para formatar o resto
        if (cleaned.startsWith('55')) cleaned = cleaned.substring(2);
        
        if (cleaned.length === 11) {
            return `(${cleaned.substring(0,2)}) ${cleaned.substring(2,7)}-${cleaned.substring(7)}`;
        } else if (cleaned.length === 10) {
            return `(${cleaned.substring(0,2)}) ${cleaned.substring(2,6)}-${cleaned.substring(6)}`;
        }
        return phone; // Fallback
    },

    renderPerfil() {
        const isBarber = this.state.role === 'barber';
        const isEditing = this.state.isEditingProfile;
        const userName = this.state.userProfile?.name || 'Cliente';
        const initial = (userName[0] || 'U').toUpperCase();

        const roleInfo = {
            'admin': { label: 'Administrador', color: 'bg-amber-500/10 text-amber-500', icon: 'shield-check' },
            'manager': { label: 'Gerente', color: 'bg-sky-500/10 text-sky-500', icon: 'star' },
            'barber': { label: 'Barbeiro', color: 'bg-emerald-500/10 text-emerald-500', icon: 'scissors' },
            'client': { label: 'Cliente', color: 'bg-zinc-500/10 text-zinc-400', icon: 'user' }
        };
        const currentRole = roleInfo[this.state.role] || roleInfo['client'];

        if (isEditing) {
            return `
                <div class="space-y-6 fade-in pb-6">
                    <div class="flex flex-col items-center text-center">
                        <div class="w-24 h-24 input-bg rounded-full flex items-center justify-center border-4 border-amber-500/20 mb-4 shadow-xl shadow-amber-500/10">
                            <span class="text-3xl font-black text-amber-500/30">${initial}</span>
                        </div>
                        <h2 class="text-2xl font-bold text-theme italic">Editando Perfil</h2>
                    </div>

                    <div class="card-bg rounded-2xl border border-theme p-6 space-y-5 shadow-xl">
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Nome Completo</label>
                            <input type="text" id="edit-name" value="${this.state.userProfile?.name || ''}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Celular (Novo Celular = Novo Login)</label>
                            <input type="tel" id="edit-phone" value="${this.state.userProfile?.phone || ''}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">CPF</label>
                                <input type="tel" id="edit-cpf" value="${this.state.userProfile?.cpf || ''}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Nascimento</label>
                                <input type="tel" id="edit-birth" value="${this.state.userProfile?.birth_date || ''}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button onclick="App.toggleProfileEdit()" class="flex-1 py-4 rounded-xl font-bold transition-all duration-200 input-bg text-muted-theme hover:bg-zinc-700 border border-zinc-700">
                            Cancelar
                        </button>
                        <button onclick="App.saveProfileChanges()" class="flex-1 py-4 rounded-xl font-bold transition-all duration-200 bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md shadow-amber-500/20">
                            Confirmar Mudanças
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-6 fade-in pb-6">
                <div class="flex flex-col items-center text-center">
                    <div class="w-24 h-24 input-bg rounded-full flex items-center justify-center border-4 border-zinc-950 mb-4 shadow-xl shadow-amber-500/10 relative">
                        <span class="text-4xl font-black text-amber-500">${initial}</span>
                        <div class="absolute -bottom-1 -right-1 w-8 h-8 ${currentRole.color.split(' ')[0]} border-4 border-zinc-950 rounded-full flex items-center justify-center">
                            <i data-lucide="${currentRole.icon}" class="w-3.5 h-3.5 ${currentRole.color.split(' ')[1]}"></i>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <h2 class="text-2xl font-bold text-theme">${userName}</h2>
                        <button onclick="App.toggleProfileEdit()" class="p-1.5 text-muted-theme hover:text-amber-500 transition-colors input-bg/50 rounded-lg">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <p class="font-medium uppercase tracking-widest text-[10px] px-3 py-1 rounded-full mt-2 flex items-center gap-1.5 ${currentRole.color}">
                        ${currentRole.label}
                    </p>
                </div>

                <!-- Dados Pessoais -->
                <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm space-y-4">
                    <div class="flex items-center gap-4 text-zinc-300 p-2 border-b border-theme/50">
                        <i data-lucide="smartphone" class="w-5 h-5 text-muted-theme"></i>
                        <div class="flex-1">
                            <p class="text-xs text-muted-theme uppercase font-bold tracking-wider">Celular</p>
                            <p class="text-sm font-medium text-theme">${this.state.userProfile?.phone || ''}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex items-center gap-3 text-zinc-300 p-2">
                             <i data-lucide="credit-card" class="w-5 h-5 text-muted-theme"></i>
                             <div class="flex-1">
                                <p class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">CPF</p>
                                <p class="text-xs text-theme font-medium">${this.state.userProfile?.cpf || '---'}</p>
                             </div>
                        </div>
                        <div class="flex items-center gap-3 text-zinc-300 p-2">
                             <i data-lucide="calendar" class="w-5 h-5 text-muted-theme"></i>
                             <div class="flex-1">
                                <p class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Nascimento</p>
                                <p class="text-xs text-theme font-medium">${this.state.userProfile?.birth_date || '---'}</p>
                             </div>
                        </div>
                    </div>
                </div>

                ${!isBarber ? this.renderLoyaltyCard(this.state.userProfile?.cut_count || 0) : ''}

                <button onclick="App.logout()" class="w-full py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] input-bg text-red-500 border border-red-500/20 hover:bg-red-500/5">
                    <i data-lucide="log-out" class="w-5 h-5"></i> Sair da Conta
                </button>
            </div>
        `;
    },

    renderConfiguracoes() {
        return `
            <div class="space-y-6 fade-in">
                <h2 class="text-2xl font-bold text-theme mb-6">Configurações</h2>

                <div class="card-bg rounded-2xl border border-theme p-6 shadow-sm flex items-center gap-4 mb-8">
                    <div class="input-bg p-3 rounded-full text-muted-theme">
                        <i data-lucide="shield-check" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <p class="text-theme font-bold">Conexão Segura</p>
                        <p class="text-xs text-muted-theme">Dados protegidos via Supabase Cloud.</p>
                    </div>
                </div>

                <div class="space-y-2 mt-8">
                    <h3 class="text-sm font-medium text-muted-theme uppercase tracking-wider mb-2">Preferências</h3>
                    <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm divide-y divide-zinc-800">
                        <div class="flex items-center justify-between py-3" onclick="App.requestNotificationPermission()">
                            <div class="flex items-center gap-3">
                                <i data-lucide="bell" class="w-5 h-5 text-muted-theme"></i>
                                <span class="text-theme">Notificações Push</span>
                            </div>
                            <div class="w-10 h-6 ${Notification.permission === 'granted' ? 'bg-amber-500' : 'bg-zinc-800'} rounded-full flex items-center p-1 cursor-pointer transition-colors">
                                <div class="w-4 h-4 card-bg rounded-full ${Notification.permission === 'granted' ? 'translate-x-4' : 'translate-x-0'} shadow-sm transition-transform"></div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between py-3" onclick="App.toggleTheme()">
                            <div class="flex items-center gap-3">
                                <i data-lucide="${this.state.theme === 'dark' ? 'moon' : 'sun'}" class="w-5 h-5 text-muted-theme"></i>
                                <span class="text-theme">Modo ${this.state.theme === 'dark' ? 'Escuro' : 'Claro'}</span>
                            </div>
                            <div class="w-10 h-6 ${this.state.theme === 'light' ? 'bg-zinc-300' : 'bg-amber-500'} rounded-full flex items-center p-1 cursor-pointer transition-colors">
                                <div class="w-4 h-4 card-bg rounded-full ${this.state.theme === 'light' ? 'translate-x-0' : 'translate-x-4'} shadow-sm transition-transform"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <button onclick="App.logout()" class="w-full mt-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-transparent border border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500">
                    <i data-lucide="log-out" class="w-5 h-5"></i> Sair da Conta
                </button>
            </div>
        `;
    }
};

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    await App.init();
    if (window.lucide) {
        lucide.createIcons();
    }
});
