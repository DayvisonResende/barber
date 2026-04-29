Object.assign(App, {

    // ─────────────────────────────────────────────────────────────────
    // INICIALIZAÇÃO DO FLUXO DE AGENDAMENTO
    // ─────────────────────────────────────────────────────────────────

    startBooking() {
        this.state.isBooking = true;
        this.state.bookingStep = 'date';
        this.state.selectedDate = '';
        this.state.selectedTime = '';
        this.state.selectedBarber = null;
        this.state.selectedServices = [];          // multi-serviço
        this.state.bookingSelectedService = null;  // legado (compat)
        this.state.bookingSelectedServices = [];   // novo: array multi-select
        this.state.bookingAvailableSlots = {};
        this.state.bookingIsLoadingSlots = false;
        this.state.editingAppointmentId = null;
        this.state.currentMonth = new Date().getMonth();
        this.state.currentYear = new Date().getFullYear();
        this.state.bookingCalendarAvailability = {};
        this.render();
    },

    cancelBooking() {
        this.state.isBooking = false;
        this.state.isStaffBooking = false;
        this.state.staffBookingMode = null;
        this.state.staffSelectedClient = null;
        this.state.bookingStep = 'date';
        this.state.bookingSelectedService = null;
        this.state.bookingSelectedServices = [];
        this.state.selectedServices = [];
        this.state.bookingAvailableSlots = {};
        this.state.editingAppointmentId = null;
        this.render();
    },

    // ─────────────────────────────────────────────────────────────────
    // NAVEGAÇÃO DO CALENDÁRIO
    // ─────────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────────
    // PASSO 1: SELEÇÃO DE DATA
    // ─────────────────────────────────────────────────────────────────

    selectDate(date) {
        this.state.selectedDate = date;
        this.state.selectedTime = '';
        this.state.selectedBarber = null;
        this.state.bookingAvailableSlots = {};
        // Avança para seleção de serviço
        this.state.bookingStep = 'service';
        this.render();
    },

    // ─────────────────────────────────────────────────────────────────
    // PASSO 2: SELEÇÃO DE SERVIÇO(S) — multi-select
    // ─────────────────────────────────────────────────────────────────

    /**
     * Toggle de seleção de serviço. Chamado pelo checkbox de cada serviço.
     * O usuário pode selecionar vários antes de confirmar.
     */
    toggleBookingService(serviceId) {
        const svc = SERVICES.find(s => s.id === serviceId);
        if (!svc) return;

        const list = this.state.bookingSelectedServices || [];
        const idx = list.findIndex(s => s.id === serviceId);
        if (idx > -1) {
            this.state.bookingSelectedServices = list.filter(s => s.id !== serviceId);
        } else {
            this.state.bookingSelectedServices = [...list, svc];
        }
        this.render();
    },

    /**
     * Confirma a seleção de serviços e avança para os slots.
     * Soma a duração de todos os serviços selecionados.
     */
    confirmServiceSelection() {
        const services = this.state.bookingSelectedServices || [];
        if (services.length === 0) {
            this.showNotification('Selecione ao menos 1 serviço', 'Escolha o serviço desejado antes de continuar.');
            return;
        }

        const duracaoTotal = services.reduce((sum, s) => sum + (s.durationMinutes || 30), 0);

        // Sincroniza com selectedServices (legado) e bookingSelectedService (primeiro item)
        this.state.selectedServices = services;
        this.state.bookingSelectedService = services[0];
        this.state.selectedTime = '';
        this.state.selectedBarber = null;
        this.state.bookingIsLoadingSlots = true;
        this.state.bookingStep = 'slots';
        this.render();

        // Motor de disponibilidade com duração total dos serviços combinados
        const slots = this.getHorariosDisponiveis({
            data: this.state.selectedDate,
            duracaoTotal,
            servicoIds: services.map(s => s.id),
            granularidadeMin: 15,
            editingAppointmentId: this.state.editingAppointmentId
        });

        this.state.bookingAvailableSlots = slots;
        this.state.bookingIsLoadingSlots = false;
        this.render();
    },

    // Compat legado — não removido para não quebrar outros contextos
    selectService(serviceId) {
        this.state.bookingSelectedServices = [];
        this.toggleBookingService(serviceId);
        this.confirmServiceSelection();
    },

    // Volta para seleção de serviço (mantém os serviços já marcados)
    backToService() {
        this.state.bookingStep = 'service';
        this.state.selectedTime = '';
        this.state.selectedBarber = null;
        this.state.bookingAvailableSlots = {};
        // Não apaga bookingSelectedServices para o usuário não perder o que já marcou
        this.render();
    },

    // Volta para seleção de data (limpa tudo)
    backToDate() {
        this.state.bookingStep = 'date';
        this.state.selectedDate = '';
        this.state.selectedTime = '';
        this.state.selectedBarber = null;
        this.state.bookingSelectedService = null;
        this.state.bookingSelectedServices = [];
        this.state.selectedServices = [];
        this.state.bookingAvailableSlots = {};
        this.render();
    },

    // ─────────────────────────────────────────────────────────────────
    // PASSO 3: SELEÇÃO DE HORÁRIO + BARBEIRO
    // ─────────────────────────────────────────────────────────────────

    selectTimeAndBarberNew(time, barberId) {
        const barber = BARBERS.find(b => b.id === barberId);
        if (!barber) return;

        this.state.selectedTime = time;
        this.state.selectedBarber = barber;
        this.state.bookingStep = 'confirm';
        this.render();
    },

    // Mantém compatibilidade com código legado que chama selectTimeAndBarber
    selectTimeAndBarber(time, barberId) {
        this.selectTimeAndBarberNew(time, barberId);
    },

    // ─────────────────────────────────────────────────────────────────
    // MULTI-SERVIÇO: toggle para staff (opcional, via confirm step)
    // ─────────────────────────────────────────────────────────────────

    toggleService(id) {
        const svc = SERVICES.find(s => s.id === id);
        if (!svc) return;
        const index = this.state.selectedServices.findIndex(s => s.id === id);
        if (index > -1) {
            this.state.selectedServices.splice(index, 1);
        } else {
            this.state.selectedServices.push(svc);
        }
        // Atualiza o serviço principal para refletir o combo
        this.state.bookingSelectedService = this.state.selectedServices[0] || null;
        this.render();
    },

    // ─────────────────────────────────────────────────────────────────
    // PASSO 4: CONFIRMAÇÃO DO AGENDAMENTO
    // ─────────────────────────────────────────────────────────────────

    async confirmBooking() {
        const { selectedDate, selectedTime, selectedBarber, selectedServices, bookingSelectedService } = this.state;

        // Usar selectedServices ou bookingSelectedService como fallback
        const services = selectedServices.length > 0 ? selectedServices : (bookingSelectedService ? [bookingSelectedService] : []);

        if (!selectedDate || !selectedTime || !selectedBarber || services.length === 0) {
            this.showNotification('Dados Incompletos', 'Selecione data, horário, barbeiro e serviço.');
            return;
        }

        // Validação modo staff: cliente cadastrado deve estar selecionado
        if (this.state.isStaffBooking && this.state.staffBookingMode === 'registered' && !this.state.staffSelectedClient) {
            this.showNotification('Selecione o cliente', 'Pesquise e selecione o cliente cadastrado antes de confirmar.');
            return;
        }

        // ── VALIDAÇÃO ANTI-RACE CONDITION: Re-busca dados frescos do servidor ──
        await this.loadInitialData();

        const totalValue = services.reduce((sum, s) => sum + s.priceValue, 0);
        const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
        const serviceNames = services.map(s => s.name).join(' + ');

        const barberId = String(selectedBarber.user_id).toLowerCase().trim();
        const newStart = this.timeToMinutes(selectedTime);
        const newEnd = newStart + totalDuration;

        // Verificar colisões por JANELA DE TEMPO REAL (não mais por minuto exato)
        const collisions = (this.state.allAppointmentsForStats || []).filter(apt => {
            // Ignorar o próprio agendamento se estiver editando
            if (this.state.editingAppointmentId && apt.id === this.state.editingAppointmentId) return false;

            // Filtrar por data e barbeiro
            if (apt.date !== selectedDate || String(apt.barber_id).toLowerCase().trim() !== barberId) return false;

            const aptStart = this.timeToMinutes(apt.time);
            const aptEnd = aptStart + (apt.total_duration || 30);

            // Regra de conflito por janela de tempo real
            return this.hasIntervalConflict(newStart, newEnd, aptStart, aptEnd);
        });

        if (collisions.length > 0) {
            console.warn('🚫 COLISÃO DETECTADA (janela real):', collisions);
            this.showNotification(
                'Horário Ocupado',
                'Este horário conflita com outro agendamento. Por favor, escolha outro.'
            );
            this.state.bookingStep = 'slots';
            // Recalcular slots com dados frescos
            this.state.bookingAvailableSlots = this.getHorariosDisponiveis({
                data: selectedDate,
                servicoId: services[0]?.id,
                granularidadeMin: 15,
                editingAppointmentId: this.state.editingAppointmentId
            });
            this.render();
            return;
        }

        // ── Determinar dados do cliente ──
        let clientId = null;
        let clientName = 'Cliente';
        let clientPhone = '';
        let clientAvatar = null;

        if (this.state.isStaffBooking) {
            if (this.state.staffBookingMode === 'registered' && this.state.staffSelectedClient) {
                clientId = this.state.staffSelectedClient.id;
                clientName = this.state.staffSelectedClient.name;
                clientPhone = this.state.staffSelectedClient.phone;
                clientAvatar = this.state.staffSelectedClient.avatar;
            } else {
                clientName = document.getElementById('client-name-manual')?.value || 'Cliente Avulso';
                clientPhone = document.getElementById('client-phone-manual')?.value || '';
            }
        } else {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                this.showNotification('Erro', 'Você precisa estar logado.');
                return;
            }
            clientId = user.id;
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('name, phone, avatar')
                .eq('id', user.id)
                .single();
            clientName = profile?.name || 'Cliente';
            clientPhone = profile?.phone || '';
            clientAvatar = profile?.avatar || null;
        }

        // ── Salvar agendamento ──
        const appointmentData = {
            client_id: clientId,
            client_name: clientName,
            client_phone: clientPhone,
            client_avatar: clientAvatar,
            barber_id: barberId,
            barber_name: selectedBarber.name,
            service_names: serviceNames,
            service_price: `R$ ${totalValue.toFixed(2).replace('.', ',')}`,
            service_numeric_value: totalValue,
            total_duration: totalDuration,
            date: selectedDate,
            time: selectedTime,
            status: 'pending'
        };

        let result;
        if (this.state.editingAppointmentId) {
            result = await supabaseClient
                .from('appointments')
                .update(appointmentData)
                .eq('id', this.state.editingAppointmentId);
        } else {
            result = await supabaseClient.from('appointments').insert(appointmentData);
        }

        if (result.error) {
            this.showNotification('Erro ao Agendar', result.error.message);
            return;
        }

        // ── Sucesso ──
        const wasEditing = !!this.state.editingAppointmentId;

        this.state.isBooking = false;
        this.state.isStaffBooking = false;
        this.state.staffBookingMode = null;
        this.state.staffSelectedClient = null;
        this.state.editingAppointmentId = null;
        this.state.bookingStep = 'date';
        this.state.bookingSelectedService = null;
        this.state.bookingAvailableSlots = {};

        this.triggerConfetti();
        this.showNotification(
            wasEditing ? 'Alteração Confirmada!' : 'Agendamento Confirmado! ✂️',
            `${serviceNames} com ${selectedBarber.name.split(' ')[0]} às ${selectedTime}.`
        );

        await this.loadInitialData();
        await this.loadAppointments();
        this.render();
    },

    // ─────────────────────────────────────────────────────────────────
    // CANCELAR / EDITAR AGENDAMENTO
    // ─────────────────────────────────────────────────────────────────


    editAppointment(id) {
        const apt = this.state.appointments.find(a => a.id === id);
        if (!apt) return;

        const serviceNames = (apt.service?.name || '').split(' + ');
        const services = SERVICES.filter(s => serviceNames.includes(s.name));
        const barber = BARBERS.find(b => b.name === apt.barberName) || BARBERS[0];

        this.state.isBooking = true;
        this.state.editingAppointmentId = id;
        this.state.bookingStep = 'date';
        this.state.selectedDate = apt.date;
        this.state.selectedTime = apt.time;
        this.state.selectedBarber = barber;
        this.state.selectedServices = services;
        this.state.bookingSelectedService = services[0] || null;
        this.state.currentMonth = new Date(apt.date + 'T00:00:00').getMonth();
        this.state.currentYear = new Date(apt.date + 'T00:00:00').getFullYear();
        this.state.bookingCalendarAvailability = {};
        this.render();
    },

    // ─────────────────────────────────────────────────────────────────
    // STAFF BOOKING — Agendamento Manual pelo Barbeiro/Admin
    // ─────────────────────────────────────────────────────────────────

    startStaffBooking() {
        this.openStaffBookingModal();
    },

    openStaffBookingModal() {
        const existing = document.getElementById('staff-booking-mode-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'staff-booking-mode-modal';
        modal.className = 'fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-[2px] fade-in';
        modal.innerHTML = `
            <div class="w-full max-w-sm card-bg border border-theme rounded-3xl p-6 shadow-2xl slide-in-up">
                <div class="text-center mb-6">
                    <div class="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <i data-lucide="calendar-plus" class="w-6 h-6 text-amber-500"></i>
                    </div>
                    <h3 class="text-xl font-bold text-theme">Novo Agendamento</h3>
                    <p class="text-xs text-muted-theme mt-1">Como deseja registrar este cliente?</p>
                </div>

                <div class="space-y-3">
                    <button onclick="App.setStaffBookingMode('registered')" class="w-full flex items-center gap-4 p-4 input-bg hover:bg-zinc-700 border border-theme hover:border-amber-500/40 rounded-2xl transition-all duration-200 active:scale-[0.98] text-left group">
                        <div class="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                            <i data-lucide="user-check" class="w-5 h-5 text-amber-500"></i>
                        </div>
                        <div>
                            <p class="font-bold text-theme text-sm">Cliente Cadastrado</p>
                            <p class="text-[11px] text-muted-theme mt-0.5">Buscar e vincular a uma conta existente</p>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-600 ml-auto group-hover:text-amber-500 transition-colors"></i>
                    </button>

                    <button onclick="App.setStaffBookingMode('walkin')" class="w-full flex items-center gap-4 p-4 input-bg hover:bg-zinc-700 border border-theme hover:border-theme rounded-2xl transition-all duration-200 active:scale-[0.98] text-left group">
                        <div class="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-600 transition-colors">
                            <i data-lucide="user-plus" class="w-5 h-5 text-muted-theme"></i>
                        </div>
                        <div>
                            <p class="font-bold text-theme text-sm">Cliente Avulso</p>
                            <p class="text-[11px] text-muted-theme mt-0.5">Walk-in sem conta no sistema</p>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-600 ml-auto group-hover:text-zinc-400 transition-colors"></i>
                    </button>
                </div>

                <button onclick="document.getElementById('staff-booking-mode-modal').remove()" class="w-full mt-4 py-3 text-sm text-muted-theme hover:text-theme transition-colors">
                    Cancelar
                </button>
            </div>
        `;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons({ root: modal });
    },

    setStaffBookingMode(mode) {
        const modal = document.getElementById('staff-booking-mode-modal');
        if (modal) modal.remove();

        this.state.isStaffBooking = true;
        this.state.staffBookingMode = mode;
        this.state.staffSelectedClient = null;
        this.startBooking();
    },

    searchStaffClients(term) {
        const resultsEl = document.getElementById('staff-client-search-results');
        if (!resultsEl) return;

        if (!term || term.trim().length < 2) {
            resultsEl.innerHTML = '<p class="text-[11px] text-muted-theme text-center py-3">Digite ao menos 2 caracteres para buscar.</p>';
            return;
        }

        const q = term.toLowerCase().trim();
        const results = (CLIENTES || []).filter(c => {
            if (c.role !== 'client') return false;
            const nameMatch = (c.name || '').toLowerCase().includes(q);
            const phoneMatch = (c.phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
            return nameMatch || phoneMatch;
        }).slice(0, 8);

        if (results.length === 0) {
            resultsEl.innerHTML = '<p class="text-[11px] text-muted-theme text-center py-4">Nenhum cliente encontrado.</p>';
            return;
        }

        resultsEl.innerHTML = results.map(c => {
            const initial = (c.name?.[0] || 'C').toUpperCase();
            const phone = c.phone ? App.formatDisplayPhone(c.phone) : 'Sem telefone';
            return `
                <button onclick="App.selectStaffClient('${c.id}')" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-700 transition-colors text-left active:scale-[0.98]">
                    <div class="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 input-bg flex items-center justify-center border border-theme">
                        ${c.avatar
                            ? `<img src="${c.avatar}" class="w-full h-full object-cover" />`
                            : `<span class="text-sm font-black text-amber-500/70">${initial}</span>`
                        }
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="font-bold text-theme text-sm truncate">${App.escapeHTML(c.name || 'Cliente')}</p>
                        <p class="text-[11px] text-muted-theme truncate">${App.escapeHTML(phone)}</p>
                    </div>
                    <i data-lucide="plus-circle" class="w-4 h-4 text-amber-500 flex-shrink-0"></i>
                </button>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons({ root: resultsEl });
    },

    selectStaffClient(clientId) {
        const client = (CLIENTES || []).find(c => c.id === clientId);
        if (!client) return;

        this.state.staffSelectedClient = {
            id: client.id,
            name: client.name,
            phone: client.phone || '',
            avatar: client.avatar || null
        };
        this.render();
    },

    clearStaffClient() {
        this.state.staffSelectedClient = null;
        this.render();
    },

    // ─────────────────────────────────────────────────────────────────
    // PAGAMENTO — Completar agendamento
    // ─────────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────────
    // LEGADO — Mantidos para compatibilidade
    // ─────────────────────────────────────────────────────────────────

    // Método legado para compatibilidade (não usado no novo fluxo)
    setBookingStep(step) {
        const stepMap = { 1: 'date', 2: 'slots', 3: 'confirm' };
        this.state.bookingStep = stepMap[step] || 'date';
        this.state.activeBookingStep = step;
        this.render();
    }
});
