Object.assign(App, {
    async login() {
        const phone = document.getElementById('login-phone')?.value;
        const password = document.getElementById('login-password')?.value;

        if (!phone || !password) {
            this.showNotification("Erro", "Preencha celular e senha.");
            return;
        }

        // Simular e-mail usando o celular (lidando com legado sem 55 e novos com 55)
        let cleanPhone = phone.replace(/\D/g, '');
        cleanPhone = cleanPhone.replace(/^55/, ''); // Remove 55 se o usuário digitou

        let { data, error } = await supabaseClient.auth.signInWithPassword({ email: `55${cleanPhone}@finotrata.com`, password });
        
        // Tentar formato legado (sem 55) caso dê erro
        if (error && error.message.includes("Invalid login credentials")) {
            const res = await supabaseClient.auth.signInWithPassword({ email: `${cleanPhone}@finotrata.com`, password });
            data = res.data;
            error = res.error;
        }

        if (error) {
            const isInvalid = error.message.includes("Invalid login credentials");
            const friendlyMsg = isInvalid ? "Ocorreu um erro ao tentar entrar. Verifique o número de telefone e senha." : "Ocorreu um erro ao tentar entrar. Tente novamente mais tarde.";
            this.showNotification("Não foi possível acessar", friendlyMsg);
            return;
        }

        await this.loadSession(data.user);
        
        // --- Sincronização Pós-Login ---
        // Garantir que os dados específicos do usuário (agendamentos, perfis, etc) sejam carregados imediatamente
        await this.fetchFullUpdate();
        
        // Ativar escuta em tempo real para o novo usuário logado
        this.setupRealtime();

        // Solicitar permissão de notificação para barbeiros e admins
        const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);
        if (isStaff) {
            // Pequeno delay para não sobrepor o fluxo de login
            setTimeout(() => this.requestNotificationPermission(), 2000);
        }

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

        // Normalizar dados (remover pontos, traços, etc) antes de salvar
        const cleanCpf = cpf.replace(/\D/g, '');
        let cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('55')) {
            cleanPhone = '55' + cleanPhone; // Força padrão Internacional Brasil para API
        }
        const email = `${cleanPhone}@finotrata.com`;

        const { data, error } = await supabaseClient.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    name: name,
                    cpf: cleanCpf,
                    birth_date: this.inputToDbDate(birthDate),
                    phone: cleanPhone
                }
            }
        });

        if (error) {
            this.showNotification("Erro", error.message);
            return;
        }

        this.state.showRegistrationSuccess = true;
        this.render();
    },

    async logout() {
        await supabaseClient.auth.signOut();
        supabaseClient.removeAllChannels(); // Evitar vazamento de listeners
        this.stopPolling(); // Parar checagens automáticas
        this.state.isAuthenticated = false;
        this.state.authView = 'login';
        this.state.recoveryStep = 'verify';
        this.state.activeTab = 'agendamentos';
        this.render();
    },

    async deleteAccount() {
        this.showConfirmModal({
            title: "Excluir Conta Permanentemente?",
            message: "ATENÇÃO: Sua conta, histórico e agendamentos serão completamente apagados e você perderá o acesso. Esta ação é IRREVERSÍVEL. Deseja continuar?",
            icon: "alert-triangle",
            isDestructive: true,
            onConfirm: async () => {
                try {
                    // Tentativa de invocar a função SQL (RPC) de exclusão segura
                    const { error } = await supabaseClient.rpc('delete_my_account');
                    
                    if (error) {
                        console.error('Erro ao deletar conta via RPC:', error);
                        // Fallback se a função não existir: deletar apenas a linha de profile (se CASCADE estiver ativo isso limpará tudo)
                        const { data: { user } } = await supabaseClient.auth.getUser();
                        if (user) {
                            const fallbackRes = await supabaseClient.from('profiles').delete().eq('id', user.id);
                            if (fallbackRes.error) {
                                throw fallbackRes.error;
                            }
                        }
                    }

                    // Força o logout
                    this.showNotification("Conta Excluída", "Seus dados foram removidos com sucesso.");
                    await this.logout();
                } catch (err) {
                    console.error("Falha ao excluir a conta", err);
                    this.showNotification("Erro", "Não foi possível excluir a conta no momento.");
                }
            }
        });
    },

    async verifyRecovery() {
        const phone = document.getElementById('forgot-phone')?.value;
        const cpf = document.getElementById('forgot-cpf')?.value;
        const birthDate = document.getElementById('forgot-birth')?.value;

        if (!phone || !cpf || !birthDate) {
            this.showNotification("Erro", "Preencha todos os campos para verificar.");
            return;
        }

        const rawPhone = phone.replace(/\D/g, '');
        const phoneNo55 = rawPhone.replace(/^55/, '');
        const phoneWith55 = '55' + phoneNo55;

        const cpfClean = cpf.replace(/\D/g, '');
        const birthForDb = this.inputToDbDate(birthDate);

        // 1. Verificar se existe um perfil com esse CPF e Data de Nascimento
        // Usamos .in para aceitar tanto o formato limpo antigo quanto o 55 atual.
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('id, name, phone, role')
            .eq('cpf', cpfClean)
            .eq('birth_date', birthForDb)
            .in('phone', [phoneNo55, phoneWith55, phone, rawPhone])
            .single();

        if (!profile) {
            this.showNotification("Dados Incorretos", "Nenhum usuário bate com os dados informados.");
            return;
        }

        // 2. Avançar para a troca de senha
        this.state.recoveryUserId = profile.id;
        this.state.recoveryEmail = `${profile.phone}@finotrata.com`;
        this.state.recoveryStep = 'reset';
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

        // Efetivar a troca de senha usando a função RPC no banco de dados
        const { error } = await supabaseClient.rpc('reset_user_password', {
            target_user_id: this.state.recoveryUserId,
            new_password: password
        });

        if (error) {
            console.error("Erro ao resetar senha:", error);
            this.showNotification("Erro Crítico", "Não foi possível atualizar a senha. Verifique se o SQL foi rodado no painel.");
            return;
        }

        this.showNotification("Sucesso!", "Sua senha foi atualizada com sucesso.");
        
        this.state.authView = 'login';
        this.state.recoveryStep = 'verify';
        this.render();
    }
});
