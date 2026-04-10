const App = {
    state: {
        isCheckingAuth: true,
        isLoading: false,
        isAuthenticated: false,
        authView: 'login', // 'login', 'register', 'forgot'
        activeTab: 'agendamentos',
        role: 'client', // 'client' ou 'barber'
        appointments: [],
        completedTransactions: [], // Histórico de Caixa
        reportsFilter: 'day', // 'day', 'week', 'month', 'year', 'custom'
        reportsCustomStart: '',
        reportsCustomEnd: '',
        unreadCount: 0,
        appointmentsFilter: 'day',
        paymentMethodFilter: 'all', // 'all', 'Pix', 'Crédito', 'Débito', 'Dinheiro'
        reportsView: 'list', // 'list' ou 'dashboard'
        blockedTimes: [],
        confirmingPaymentId: null,
        confirmingPaymentMethod: null,
        // Estado do formulário de marcação
        isBooking: false,
        selectedServices: [],
        selectedBarber: null,
        selectedDate: '',
        selectedTime: '',
        activeBookingStep: 1,
        editingAppointmentId: null,
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        recoveryStep: 'verify', // 'verify' ou 'reset'
        recoveryUserId: null,
        isEditingProfile: false,
        isBuildingAvatar: false,
        theme: localStorage.getItem('finotrato-theme') || 'dark',
        showReminderPopup: false,
        // Configurações da Barbearia (Dinâmicas)
        shopSettings: null,
        isEditingShop: false,
        isManagingShop: false, // Controle do painel admin
        adminShopTab: 'barbers', // 'barbers', 'services', 'schedules'
        adminScheduleDate: new Date().toISOString().split('T')[0],
        adminScheduleBarberId: null,
        editingDurationId: null, 
        isStaffBooking: false, // Indica se o barbeiro está agendando para um cliente sem cadastro
        isUploadingAvatar: false
    }
};
