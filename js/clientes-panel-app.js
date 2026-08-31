// --- Painel de Clientes (página standalone, fora do app principal) ---
// Segue o mesmo padrão de relatorios.html/relatorios-app.js: página independente,
// autenticação própria, sem depender do restante do app (ui.js, views.js, etc).
//
// Reaproveita 100% da lógica de js/client-insights.js (Object.assign(App, {...})),
// que é o MESMO arquivo usado dentro do app principal — qualquer melhoria feita lá
// vale para os dois lugares automaticamente, sem duplicar código.

const App = {
    state: {
        loading: true,
        role: null,

        // Campos usados por js/client-insights.js
        viewingClientId: null,
        clientInsights: null,
        isLoadingClientInsights: false,
        editingClientPreferences: false,
        clientsPanelData: null,
        isLoadingClientsPanel: false,
        clientsPanelFilter: 'atencao'
    },

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    formatWA(phone) {
        if (!phone) return '';
        let num = String(phone).replace(/\D/g, '');
        if (num.length > 0 && !num.startsWith('55')) num = '55' + num;
        return num;
    },

    showNotification(title, message) {
        const el = document.createElement('div');
        el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] max-w-sm w-[92%] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 fade-in';
        el.innerHTML = `<p class="text-sm font-bold text-zinc-100">${this.escapeHTML(title)}</p><p class="text-xs text-zinc-400 mt-1">${this.escapeHTML(message)}</p>`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    },

    async init() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) { window.location.href = 'index.html'; return; }

        const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
        if (!profile || !['admin', 'manager', 'barber'].includes(profile.role)) {
            window.location.href = 'index.html';
            return;
        }
        this.state.role = profile.role;

        const [{ data: clientsData }, { data: barbersData }] = await Promise.all([
            supabaseClient.from('profiles').select('*'),
            supabaseClient.from('barbers').select('*')
        ]);
        CLIENTES = clientsData || [];
        BARBERS = barbersData || [];

        this.state.loading = false;
        this.render();
        await this.loadClientsPanelData(); // definido em js/client-insights.js
    },

    render() {
        const app = document.getElementById('app');
        if (!app) return;

        if (this.state.loading) {
            app.innerHTML = this.renderLoading();
            return;
        }

        const modalHtml = this.state.viewingClientId ? this.renderClientInsightsModal() : '';
        app.innerHTML = this.renderShell() + modalHtml;
        if (window.lucide) lucide.createIcons({ root: app });
    },

    renderLoading() {
        return `<div class="flex items-center justify-center h-screen">
            <div class="flex flex-col items-center gap-4">
                <div class="w-10 h-10 rounded-full border-4 border-zinc-700 border-t-amber-500 animate-spin"></div>
                <p class="text-zinc-500 text-sm">Carregando painel de clientes...</p>
            </div>
        </div>`;
    },

    renderShell() {
        return `
        <div class="min-h-screen flex flex-col">
            <header class="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
                <a href="index.html" class="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-amber-500 transition-all active:scale-95">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </a>
                <div class="flex-1">
                    <h1 class="text-base font-bold text-zinc-100 leading-none">Painel de Clientes</h1>
                    <p class="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Visão 360° de todos os clientes</p>
                </div>
                <span class="text-[10px] text-zinc-600 uppercase tracking-widest font-bold border border-zinc-800 px-2 py-1 rounded-lg">${this.state.role}</span>
            </header>

            <main class="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
                ${this.renderClientsPanelTab()}
            </main>
        </div>`;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await App.init();
    if (window.lucide) lucide.createIcons();
});
