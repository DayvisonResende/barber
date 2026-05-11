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
        adminScheduleDayOfWeek: new Date().getDay(),
        adminScheduleViewMode: 'fixed', // 'fixed' ou 'exceptions'
        editingDurationId: null, 
        isStaffBooking: false, // Indica se o barbeiro está agendando manualmente
        staffBookingMode: null, // null | 'registered' | 'walkin'
        staffSelectedClient: null, // objeto { id, name, phone, avatar } do cliente cadastrado selecionado
        isUploadingAvatar: false,
        expandedTransactionId: null,
        expandedAppointmentId: null,
        showRegistrationSuccess: false,
        paymentStatusFilter: 'pending', // 'pending' ou 'all'
        payouts: [],
        editingPriceId: null,
        editingProductId: null,
        showingSplitPaymentId: null,
        splitPaymentAmounts: { Pix: 0, Dinheiro: 0, Débito: 0, Crédito: 0 },
        editingServiceId: null,
        editingServicesId: null,
        tempSelectedServices: [],
        adminScheduleBulkMode: false,
        adminScheduleBulkDays: [],

        // --- Novo Motor de Agendamento (v2) ---
        // Fluxo: 'date' → 'service' → 'slots' → 'confirm'
        bookingStep: 'date',
        bookingSelectedService: null,      // objeto { id, name, priceValue, durationMinutes, ... }
        bookingAvailableSlots: {},         // { "09:00": [barber1, barber2], "09:30": [barber1] }
        bookingIsLoadingSlots: false,      // spinner enquanto calcula
        bookingCalendarAvailability: {},   // { "2026-04-28": true/false } pré-computado por mês
        appointmentsFilterStart: null,
        appointmentsFilterEnd: null,
        isDateRangeModalOpen: false,
        agendaSelectedDate: new Date().toISOString().split('T')[0],
        openAppointmentModalId: null,
        agendaViewMode: 'table' // 'list' ou 'table'
    }
};
