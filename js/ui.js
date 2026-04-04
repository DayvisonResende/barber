Object.assign(App, {
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

    setAdminShopTab(tabName) {
        this.state.adminShopTab = tabName;
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
    }
});
