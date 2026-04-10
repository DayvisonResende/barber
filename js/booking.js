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
        this.state.isStaffBooking = true;
        this.startBooking();
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

        // --- TRAVA DE SEGURANÇA: Verificação de colisão em tempo real ---
        // 1. Recarrega os dados mais recentes do servidor para garantir que ninguém agendou nesse meio tempo
        await this.loadInitialData();

        const totalValue = this.state.selectedServices.reduce((sum, s) => sum + s.priceValue, 0);
        const totalDuration = this.state.selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
        const serviceNames = this.state.selectedServices.map(s => s.name).join(' + ');
        
        const selectedTime = this.state.selectedTime;
        const selectedDate = this.state.selectedDate;
        const barberId = String(this.state.selectedBarber.user_id);

        const isStillAvailable = !(this.state.allAppointmentsForStats || []).some(apt => {
            if (apt.date !== selectedDate || String(apt.barber_id) !== barberId) return false;
            
            const [aptH, aptM] = apt.time.split(':').map(Number);
            const aptStartTotal = aptH * 60 + aptM;
            const aptEndTotal = aptStartTotal + (apt.total_duration || 30);
            
            const [thisH, thisM] = selectedTime.split(':').map(Number);
            const thisTotal = thisH * 60 + thisM;
            const thisEndTotal = thisTotal + totalDuration;

            // Colisão: Se o novo agendamento começa antes de um existente terminar, 
            // OU se um existente começa antes do novo terminar.
            return (thisTotal < aptEndTotal && thisEndTotal > aptStartTotal);
        });

        if (!isStillAvailable) {
            this.showNotification("Horário Ocupado", "Este horário acaba de ser reservado por outro cliente. Por favor, escolha outra opção.");
            this.state.activeBookingStep = 2; // Volta para o passo de horários
            this.render();
            return;
        }
        // --- FIM DA TRAVA ---

        let clientId = null;
        let clientName = 'Cliente';
        let clientPhone = '';
        let clientAvatar = null;

        if (this.state.isStaffBooking) {
            // Agendamento MANUAL pelo barbeiro (Walk-in)
            clientName = document.getElementById('client-name-manual')?.value || 'Cliente Avulso';
            clientPhone = document.getElementById('client-phone-manual')?.value || '';
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
        this.state.isStaffBooking = false; // Reset
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
