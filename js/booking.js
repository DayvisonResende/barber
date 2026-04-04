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
