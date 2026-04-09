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

        // Simular e-mail usando o celular
        const email = `${phone.replace(/\D/g, '')}@finotrata.com`;

        const { data, error } = await supabaseClient.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    name: name,
                    cpf: cpf,
                    birth_date: birthDate
                }
            }
        });

        if (error) {
            this.showNotification("Erro", error.message);
            return;
        }

        this.showNotification("Sucesso!", "Conta criada com sucesso.");
        this.state.authView = 'login';
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
        const email = `${phoneClean}@finotrata.com`;

        // 1. Verificar se existe um perfil com esse CPF e Data de Nascimento
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('cpf', cpf)
            .eq('birth_date', birthDate)
            .eq('email', email)
            .single();

        if (error || !profile) {
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

        // Como usamos "celular@finotrata.com" e não temos acesso ao reset real via e-mail sem Service Role,
        // o ideal seria um Admin fazer isso ou usarmos uma função RPC. 
        // Para este protótipo, vamos simular o sucesso e avisar o usuário.
        
        this.showNotification("Aviso", "No Supabase Real, a redefinição exige link de e-mail. Usaremos um fluxo simulado aqui.");
        
        // No mundo real, aqui chamaríamos uma Edge Function ou Admin API
        this.state.authView = 'login';
        this.state.recoveryStep = 'verify';
        this.render();
    }
});
