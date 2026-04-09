Object.assign(App, {
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

    async loadInitialData() {
        // Carregar catálogo
        const { data: svcs } = await supabaseClient.from('services').select('*');
        if (svcs) SERVICES = svcs.map(s => ({
            id: s.id, name: s.name, price: s.price, priceValue: s.price_value,
            duration: s.duration, durationMinutes: s.duration_minutes
        }));

        // Carregar barbeiros (todos, para gerenciar no painel)
        const { data: brbs } = await supabaseClient.from('barbers').select('*');
        if (brbs) BARBERS = brbs;

        // Carregar bloqueios (Novos campos: barber_id, date)
        const { data: blocks } = await supabaseClient.from('blocked_times').select('*');
        if (blocks) this.state.blockedTimesFull = blocks; // Guardamos os objetos completos para filtrar na renderização
        this.state.blockedTimes = blocks?.filter(b => !b.barber_id && !b.date).map(b => b.blocked_time) || [];

        // Se for staff (admin, manager, barber) e estiver logado, carregar contas
        if (['admin', 'manager', 'barber'].includes(this.state.role) && this.state.isAuthenticated) {
            let query = supabaseClient.from('profiles').select('*');
            // Barbeiros e gerentes casuais (se houver regra no RLS) veem só clientes. Admin vê todo mundo.
            if (this.state.role !== 'admin') {
                query = query.eq('role', 'client');
            }
            const { data: userProfiles } = await query;
            if (userProfiles) CLIENTES = userProfiles;
        }

        // Carregar agendamentos atuais para verificar disponibilidade de JANELA (total_duration)
        const { data: allApts } = await supabaseClient.from('appointments')
            .select('date, time, barber_id, total_duration')
            .eq('status', 'pending');
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
                slogan: 'A melhor experiência em estilo e cuidado.',
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
                status: a.status,
                total_duration: a.total_duration,
                clientAvatar: a.client_avatar
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
                    console.log('⚡ Atualização Instantânea (Agenda)!', payload);
                    await this.loadInitialData();
                    await this.loadAppointments();
                    this.render();
                }
            )
            .on(
                'postgres_changes', 
                { event: '*', schema: 'public', table: 'blocked_times' }, 
                async (payload) => {
                    console.log('⚡ Atualização Instantânea (Bloqueios)!', payload);
                    await this.loadInitialData();
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

    async toggleTimeBlock(time, barberId = null, date = null) {
        const bid = barberId === 'null' ? null : barberId;
        const dstr = date === 'null' ? null : date;

        // Tenta encontrar usando uma consulta fresca no banco para evitar problemas de sincronia local
        const { data: existing } = await supabaseClient.from('blocked_times')
            .select('id')
            .eq('blocked_time', time)
            .eq('barber_id', bid)
            .eq('date', dstr)
            .maybeSingle();

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
        const bid = barberId === 'null' ? null : barberId;
        const dstr = date === 'null' ? null : date;

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

        // Cada slot de 10 min dentro da janela deve estar livre
        for (let t = startTotal; t < endTotal; t += 10) {
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

        if (!name || !priceStr || !durationStr) {
            this.showNotification("Erro", "Preencha todos os campos do serviço.");
            return;
        }

        const numericValue = parseFloat(priceStr);
        const priceText = `R$ ${numericValue.toFixed(2).replace('.', ',')}`;
        const durationMinutes = parseInt(durationStr, 10);
        const durationText = `${durationMinutes} min`;

        const { error } = await supabaseClient.from('services').insert({
            name: name,
            price: priceText,
            price_value: numericValue,
            duration: durationText,
            duration_minutes: durationMinutes
        });

        if (error) {
            this.showNotification("Erro", "Erro ao adicionar este serviço.");
        } else {
            this.showNotification("Sucesso", "Serviço disponível para a casa!");
            await this.loadInitialData();
            this.render();
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
    }
});

