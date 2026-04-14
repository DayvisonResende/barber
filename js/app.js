// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    await App.init();
    if (window.lucide) {
        lucide.createIcons();
    }
});
