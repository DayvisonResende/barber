Object.assign(App, {
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

        // Normalizar dados (remover pontos, traços, etc) antes de salvar
        const cleanCpf = cpf.replace(/\D/g, '');
        const cleanPhone = phone.replace(/\D/g, '');
        const email = `${cleanPhone}@finotrata.com`;

        const { data, error } = await supabaseClient.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    name: name,
                    cpf: cleanCpf,
                    birth_date: this.inputToDbDate(birthDate)
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
        const cpfClean = cpf.replace(/\D/g, '');
        const birthForDb = this.inputToDbDate(birthDate);

        // 1. Verificar se existe um perfil com esse CPF e Data de Nascimento
        // Usamos .filter com 'in' para aceitar tanto o formato limpo quanto o formatado.
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('email', email)
            .filter('cpf', 'in', `(${cpfClean},"${cpf}")`)
            .filter('birth_date', 'in', `(${birthClean},"${birthForDb}")`)
            .single();

        if (error || !profile) {
            console.error("DEBUG IDENTITY ERROR:", { error, email, cpf, birthDate });
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
