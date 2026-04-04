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

        // Carregar bloqueios
        const { data: blocks } = await supabaseClient.from('blocked_times').select('blocked_time');
        if (blocks) this.state.blockedTimes = blocks.map(b => b.blocked_time);

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
    }
});
