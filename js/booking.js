Object.assign(App, {
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

    startStaffBooking() {
        // Abre o modal de seleção de tipo de agendamento
        this.openStaffBookingModal();
    },

    openStaffBookingModal() {
        // Remove modal anterior se existir
        const existing = document.getElementById('staff-booking-mode-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'staff-booking-mode-modal';
        modal.className = 'fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 app-bg opacity-80 backdrop-blur-sm fade-in';
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
        // Fecha o modal de seleção
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
        }).slice(0, 8); // Limite de 8 resultados

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
        this.state.isStaffBooking = false;
        this.state.staffBookingMode = null;
        this.state.staffSelectedClient = null;
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

        // Validação: modo "cliente cadastrado" exige que o cliente tenha sido selecionado
        if (this.state.isStaffBooking && this.state.staffBookingMode === 'registered' && !this.state.staffSelectedClient) {
            this.showNotification('Selecione o cliente', 'Pesquise e selecione o cliente cadastrado antes de confirmar.');
            return;
        }

        // --- TRAVA DE SEGURANÇA: Verificação de colisão em tempo real ---
        // 1. Recarrega os dados mais recentes do servidor para garantir visibilidade total
        await this.loadInitialData();
        
        const totalValue = this.state.selectedServices.reduce((sum, s) => sum + s.priceValue, 0);
        const totalDuration = this.state.selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
        const serviceNames = this.state.selectedServices.map(s => s.name).join(' + ');
        
        const selectedTime = this.state.selectedTime;
        const selectedDate = this.state.selectedDate;
        const barberId = String(this.state.selectedBarber.user_id).toLowerCase().trim();

        const collisions = (this.state.allAppointmentsForStats || []).filter(apt => {
            // Compara data e barbeiro (garantindo strings limpas)
            if (apt.date !== selectedDate || String(apt.barber_id).toLowerCase().trim() !== barberId) return false;
            
            const [aptH, aptM] = apt.time.split(':').map(Number);
            const aptStartTotal = aptH * 60 + aptM;
            const aptEndTotal = aptStartTotal + (apt.total_duration || 30);
            
            const [thisH, thisM] = selectedTime.split(':').map(Number);
            const thisTotal = thisH * 60 + thisM;
            const thisEndTotal = thisTotal + totalDuration;

            // Proteção simplificada: Apenas evita que dois agendamentos comecem NO MESMO MINUTO.
            // Isso permite que o barbeiro gerencie sobreposições de duração (durations que "vazam").
            return (thisTotal === aptStartTotal);
        });

        if (collisions.length > 0) {
            console.warn("COLISÃO DETECTADA:", collisions);
            this.showNotification("Horário Ocupado", "Este horário acaba de ser reservado ou está em conflito com outro agendamento.");
            this.state.activeBookingStep = 2; 
            this.render();
            return;
        }
        // --- FIM DA TRAVA ---

        let clientId = null;
        let clientName = 'Cliente';
        let clientPhone = '';
        let clientAvatar = null;

        if (this.state.isStaffBooking) {
            if (this.state.staffBookingMode === 'registered' && this.state.staffSelectedClient) {
                // Agendamento para CLIENTE CADASTRADO — vincula ao perfil existente
                clientId = this.state.staffSelectedClient.id;
                clientName = this.state.staffSelectedClient.name;
                clientPhone = this.state.staffSelectedClient.phone;
                clientAvatar = this.state.staffSelectedClient.avatar;
            } else {
                // Agendamento AVULSO (Walk-in) — sem vínculo a conta
                clientName = document.getElementById('client-name-manual')?.value || 'Cliente Avulso';
                clientPhone = document.getElementById('client-phone-manual')?.value || '';
            }
        } else {
            // Agendamento padrão pelo CLIENTE logado
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                this.showNotification("Erro", "Você precisa estar logado.");
                return;
            }
            clientId = user.id;
            const { data: profile } = await supabaseClient.from('profiles').select('name, phone, avatar').eq('id', user.id).single();
            clientName = profile?.name || 'Cliente';
            clientPhone = profile?.phone || '';
            clientAvatar = profile?.avatar || null;
        }

        const appointmentData = {
            client_id: clientId,
            client_name: clientName,
            client_phone: clientPhone, 
            client_avatar: clientAvatar,
            barber_id: barberId,
            barber_name: this.state.selectedBarber.name,
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
            result = await supabaseClient.from('appointments').update(appointmentData).eq('id', this.state.editingAppointmentId);
        } else {
            result = await supabaseClient.from('appointments').insert(appointmentData);
        }

        if (result.error) {
            this.showNotification("Erro ao Agendar", result.error.message);
            return;
        }

        this.state.isBooking = false;
        this.state.isStaffBooking = false;
        this.state.staffBookingMode = null;
        this.state.staffSelectedClient = null;
        this.state.editingAppointmentId = null;

        // Efeito Visual e Físico de Sucesso
        this.triggerConfetti();

        this.showNotification(
            this.state.editingAppointmentId ? "Alteração Confirmada!" : "Agendamento Confirmado!", 
            "O agendamento foi registrado na agenda."
        );

        await this.loadInitialData();
        await this.loadAppointments();
        this.render();
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
    }
});
