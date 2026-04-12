Object.assign(App, {
    getUpcomingReminder() {
        if (this.state.role !== 'client') return null;

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        // Procurar o próximo agendamento de hoje que ainda não passou da hora
        const todayApts = (this.state.appointments || [])
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
    applyMasks() {
        // Máscara para Celular/WhatsApp (Equipe e Cliente)
        const phoneIds = ['reg-phone', 'login-phone', 'forgot-phone', 'edit-phone', 'shop-whatsapp', 'shop-phone', 'client-phone-manual'];
        phoneIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', (e) => {
                    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
                    e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
                });
            }
        });

        // Máscara para CPF
        const cpfIds = ['reg-cpf', 'forgot-cpf', 'edit-cpf'];
        cpfIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', (e) => {
                    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/);
                    e.target.value = !x[2] ? x[1] : x[1] + '.' + x[2] + (x[3] ? '.' + x[3] : '') + (x[4] ? '-' + x[4] : '');
                });
            }
        });

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

    // --- Ações de Estado ---
    setAuthView(view) {
        this.state.authView = view;
        this.render();
    },

    toggleProfileEdit() {
        this.state.isEditingProfile = !this.state.isEditingProfile;
        this.render();
        if (this.state.isEditingProfile) {
            this.applyMasks();
        }
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
        this.haptic('light');
        this.state.activeTab = tabId;
        if (tabId !== 'agendamentos') {
            this.state.isBooking = false; // Resetar formulário ao sair da aba
        }
        this.updateNavUI();
        this.render();
    },

    setRole(role) {
        this.haptic('medium');
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

    confirmGlobalReset() {
        this.showConfirmModal({
            title: "Zerar Todo Financeiro?",
            message: "Esta ação marcará TODOS os ganhos anteriores como QUITADOS e apagará os adiantamentos. Todos os saldos retornarão para R$ 0,00 e o total pendente será resetado. Deseja prosseguir?",
            icon: "power",
            isDestructive: true,
            onConfirm: async () => {
                this.showNotification('Aguarde...', 'Reiniciando valores do financeiro...');
                const result = await this.resetGlobalFinancials();
                if (result.error) {
                    alert('Erro: ' + result.error);
                } else {
                    this.showNotification('Financeiro Zerado!', 'Todos os repasses e valores foram reiniciados.');
                    this.renderShopManagement(); // re-render the admin tabs
                }
            }
        });
    },

    confirmWipeDatabase() {
        this.showConfirmModal({
            title: "APAGAR TODO BANDO DE DADOS?",
            message: "ATENÇÃO: Essa ação EXCLUIRÁ TODOS os agendamentos, todas as transações, relatórios e vales do sistema permanentemente. O app ficará zerado para inauguração. ESSA AÇÃO NÃO PODE SER DESFEITA!",
            icon: "alert-triangle",
            isDestructive: true,
            onConfirm: async () => {
                this.showNotification('Limpando Banco...', 'Excluindo todos os arquivos do sistema...');
                const result = await this.wipeDatabaseForLaunch();
                if (result.error) {
                    alert('Erro ao apagar banco: ' + result.error);
                } else {
                    this.showNotification('DB ZERADO!', 'Todos os dados antigos foram DESTRUÍDOS. Sistema inaugurado limpo.');
                    this.renderShopManagement(); // re-render the admin tabs
                    this.setTab('dashboard'); // refresh global screen
                }
            }
        });
    },

    hideConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        if (modal) modal.classList.add('hidden');
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

        const role = this.state.role;
        const isStaff = ['admin', 'manager', 'barber'].includes(role);

        // Perfil e Barbearia sempre visíveis para todos os logados
        if (btnPerfil) btnPerfil.classList.remove('hidden');
        if (btnBarbearia) btnBarbearia.classList.remove('hidden');

        // Relatórios visíveis apenas para Equipe/Admin
        if (btnRelatorios) {
            btnRelatorios.classList.toggle('hidden', !isStaff);
        }

        // Remover lógica de Clientes (unificado em Barbearia)
        if (btnClientes) btnClientes.classList.add('hidden');

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
        const headerName = document.getElementById('header-shop-name');
        const logoContainer = document.getElementById('header-logo-container');
        const logoIcon = document.getElementById('header-logo-icon');

        // 1. Atualizar Nome da Barbearia
        if (headerName && this.state.shopSettings) {
            const name = this.state.shopSettings.name;
            // Preservar o estilo (ex: FinnoTratoBarber -> FinnoTrato<span class="text-amber-500">Barber</span>)
            // Para ser flexível, se o nome contiver "Barber", vamos colorir.
            if (name.toLowerCase().includes('barber')) {
                const parts = name.split(/(barber)/i);
                headerName.innerHTML = parts.map(part => 
                    part.toLowerCase() === 'barber' ? `<span class="text-amber-500">${part}</span>` : part
                ).join('');
            } else {
                headerName.textContent = name;
            }
        }

        // 2. Atualizar Logo
        if (logoContainer && this.state.shopSettings) {
            if (this.state.shopSettings.logo_url) {
                // Se tem URL, coloca imagem e esconde o ícone
                logoContainer.innerHTML = `<img src="${this.state.shopSettings.logo_url}" class="w-full h-full object-cover" />`;
            } else if (logoIcon) {
                // Se não tem, garante que o ícone padrão está lá
                logoContainer.innerHTML = `<i id="header-logo-icon" data-lucide="scissors" class="w-5 h-5 text-zinc-950"></i>`;
                if (window.lucide) lucide.createIcons();
            }
        }

        // 3. Notificações e Refresh (Apenas Barbeiro/Admin)
        const btnRefresh = document.getElementById('btn-refresh');
        // Se for admin ou barbeiro, carregar histórico de pagamentos e transações
        const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);
        if (isStaff) {
            Promise.all([
                this.loadTransactions(),
                this.loadPayouts()
            ]);
        }

        const isPrivileged = this.state.role === 'barber' || this.state.role === 'admin';

        if (isPrivileged) {
            btnNotify?.classList.remove('hidden');
            btnRefresh?.classList.remove('hidden');
            if (this.state.unreadCount > 0) {
                badge?.classList.remove('hidden');
            } else {
                badge?.classList.add('hidden');
            }
        } else {
            btnNotify?.classList.add('hidden');
            btnRefresh?.classList.add('hidden');
        }
    },

    async handleManualRefresh() {
        const btn = document.querySelector('button[onclick="App.handleManualRefresh()"]');
        if (btn) btn.classList.add('animate-spin');

        try {
            await this.fetchFullUpdate();
            this.showNotification('Sucesso', 'Dados atualizados com sucesso.', 'success');
        } catch (error) {
            console.error(error);
            this.showNotification('Erro', 'Não foi possível atualizar os dados.');
        } finally {
            if (btn) btn.classList.remove('animate-spin');
        }
    },

    openPayoutModal(barberId, barberName, balance) {
        const modal = document.createElement('div');
        modal.id = 'payout-modal';
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm fade-in';
        
        modal.innerHTML = `
            <div class="card-bg w-full max-w-sm rounded-3xl border border-theme p-6 space-y-6 shadow-2xl slide-in-up">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold text-theme">Pagamento</h3>
                        <p class="text-xs text-muted-theme mt-1">${barberName}</p>
                    </div>
                    <button onclick="document.getElementById('payout-modal').remove()" class="text-zinc-500 hover:text-white transition-colors">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-center">
                        <p class="text-[10px] uppercase font-black text-amber-500/70 tracking-widest">Saldo Atual Disponível</p>
                        <p class="text-2xl font-black text-amber-500 mt-1">R$ ${balance.toFixed(2).replace('.', ',')}</p>
                    </div>

                    <div class="space-y-3">
                        <button onclick="App.handlePayout('${barberId}', ${balance}, 'full')" class="w-full py-4 bg-amber-500 text-zinc-950 font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-amber-500/20">
                            Pagar Tudo (Quitação)
                        </button>
                        
                        <div class="relative flex items-center py-2">
                            <div class="flex-grow border-t border-zinc-800"></div>
                            <span class="flex-shrink mx-4 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Ou Adiantar</span>
                            <div class="flex-grow border-t border-zinc-800"></div>
                        </div>

                        <div class="space-y-2">
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-theme font-bold">R$</span>
                                <input type="number" id="advance-amount" placeholder="Valor do Adiantamento" class="w-full input-bg border border-zinc-800 rounded-xl p-4 pl-10 text-theme outline-none focus:border-amber-500 transition-all font-bold" />
                            </div>
                            <button onclick="App.handlePayout('${barberId}', null, 'advance')" class="w-full py-3 bg-zinc-800 text-zinc-300 font-bold rounded-xl active:scale-95 transition-all border border-zinc-700">
                                Confirmar Adiantamento
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (window.lucide) window.lucide.createIcons();
    },

    async handlePayout(barberId, amount, type) {
        if (type === 'advance') {
            const input = document.getElementById('advance-amount');
            amount = parseFloat(input.value);
            if (!amount || amount <= 0) {
                return this.showNotification('Erro', 'Informe um valor válido para o adiantamento.');
            }
        }

        try {
            await this.processBarberPayout(barberId, amount, type);
            this.showNotification('Sucesso', 'Pagamento registrado com sucesso!', 'success');
            document.getElementById('payout-modal')?.remove();
            this.render(); // Atualizar UI
        } catch (error) {
            console.error(error);
            this.showNotification('Erro', 'Não foi possível processar o pagamento.');
        }
    },

    // --- Renderização Principal ---
    render() {
        const main = document.getElementById('main-content');
        const header = document.getElementById('app-header');
        const nav = document.getElementById('bottom-nav');

        // Splash Screen enquanto verifica login
        if (this.state.isCheckingAuth) {
            header.classList.add('hidden');
            nav.classList.add('hidden');
            main.innerHTML = this.renderSplash();
            if (window.lucide) lucide.createIcons({ root: main });
            return;
        }

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
            } else if (this.state.activeTab === 'barbearia') {
                html = this.renderBarbearia();
            } else if (this.state.activeTab === 'configuracoes') {
                html = this.renderConfiguracoes();
            }

            // Se estiver em estado de carregamento inicial intenso (opcional)
            if (this.state.isLoading) {
                main.innerHTML = this.renderSkeleton();
                return;
            }

            main.innerHTML = `<div class="fade-in-fast">${html}</div>`;
        }

        // Renderizar Lembrete Flutuante Global (Sino)
        const reminderHtml = this.renderReminderCard(this.getUpcomingReminder());
        const reminderBox = document.getElementById('reminder-container');
        if (reminderBox) {
            reminderBox.innerHTML = reminderHtml;
        }

        // Re-aplicar máscaras e recriar os ícones Lucide apenas no conteúdo principal (mais rápido)
        if (window.lucide) {
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                lucide.createIcons({
                    root: mainContent
                });
                
                // IMPORTANTE: Re-aplicar máscaras após injetar o HTML
                this.applyMasks();
            }
        }

        // Se estivermos na aba de relatórios estratégico, precisamos reinicializar o gráfico após o render
        if (this.state.activeTab === 'relatorios' && this.state.reportsView === 'dashboard') {
            // Pequeno delay para garantir que o canvas foi montado no DOM
            setTimeout(() => this.initCharts(), 10);
        }

        // --- Renderizar Modais Globais ---
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            if (this.state.showRegistrationSuccess) {
                modalContainer.innerHTML = this.renderRegistrationSuccess();
                // Disparar confetes apenas se o modal acabou de aparecer
                if (!modalContainer.getAttribute('data-active')) {
                    this.triggerConfetti();
                    modalContainer.setAttribute('data-active', 'true');
                }
            } else {
                modalContainer.innerHTML = '';
                modalContainer.removeAttribute('data-active');
            }
        }

    },

    renderSkeleton() {
        return `
            <div class="space-y-6 fade-in-fast p-4">
                <div class="flex items-center gap-4 mb-8">
                    <div class="w-12 h-12 skeleton rounded-full"></div>
                    <div class="space-y-2">
                        <div class="w-32 h-4 skeleton"></div>
                        <div class="w-20 h-3 skeleton opacity-50"></div>
                    </div>
                </div>
                
                <div class="h-40 w-full skeleton mb-6"></div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="h-24 skeleton"></div>
                    <div class="h-24 skeleton"></div>
                </div>
                <div class="h-12 w-full skeleton mt-8"></div>
            </div>
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

    toggleShopEdit() {
        this.state.isEditingShop = !this.state.isEditingShop;
        this.render();
        if (this.state.isEditingShop) {
            this.applyMasks();
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

    toggleShopManagement() {
        this.state.isManagingShop = !this.state.isManagingShop;
        this.render();
    },

    toggleTransactionExpand(id) {
        // Toggle: Se clicar no mesmo, fecha. Se no outro, abre o outro e fecha o anterior.
        this.state.expandedTransactionId = (this.state.expandedTransactionId === id) ? null : id;
        this.render();
    },

    setAdminShopTab(tabName) {
        this.state.adminShopTab = tabName;
        this.render();
    },

    closeRegistrationSuccess() {
        this.state.showRegistrationSuccess = false;
        this.state.authView = 'login';
        this.render();
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

    compressImage(file, maxWidth = 400, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxWidth) {
                            width *= maxWidth / height;
                            height = maxWidth;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', quality);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }
});
