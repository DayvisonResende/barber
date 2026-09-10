// --- Agendamento Personalizado (horário totalmente livre, digitado manualmente) ---
// Módulo isolado: não usa nem altera o fluxo normal de agendamento (booking.js), que
// continua funcionando exatamente como antes. É um jeito A PARTE de criar um
// agendamento, pra quando o barbeiro precisa de um horário fora da grade de slots
// (ex: encaixe, exceção, horário fora do expediente configurado).
//
// Só uma regra é mantida igual ao fluxo normal: não deixa marcar em cima de outro
// agendamento já existente do mesmo barbeiro (mesma checagem de colisão real).

Object.assign(App, {

    openCustomBooking(presetDate, presetTime) {
        this.state.isCustomBookingOpen = true;
        this.state.customBookingMode = 'registered';
        this.state.customBookingSelectedClient = null;
        this.state.customBookingBarberId = BARBERS.find(b => b.is_active !== false)?.id || null;
        this.state.customBookingServiceIds = [];
        this.state.customBookingDate = presetDate || new Date().toISOString().split('T')[0];
        this.state.customBookingTime = presetTime || '';
        this.render();
    },

    // Chamada a partir do seletor "Novo Agendamento" (o mesmo "+" que já existe na
    // grade/lista) quando o barbeiro escolhe "Horário Personalizado". Se o "+" foi
    // clicado num slot específico da grade, já chega com data/hora pré-preenchidas
    // (mas continuam editáveis).
    openCustomBookingFromChooser() {
        const modal = document.getElementById('staff-booking-mode-modal');
        if (modal) modal.remove();

        const presetDate = this.state.gridBookingDate;
        const presetTime = this.state.gridBookingTime;
        this.state.gridBookingDate = null;
        this.state.gridBookingTime = null;

        this.openCustomBooking(presetDate, presetTime);
    },

    closeCustomBooking() {
        this.state.isCustomBookingOpen = false;
        this.render();
    },

    setCustomBookingMode(mode) {
        this.state.customBookingMode = mode;
        this.render();
    },

    searchCustomBookingClient(term) {
        const resultsEl = document.getElementById('custom-booking-client-search-results');
        if (!resultsEl) return;

        if (!term || term.trim().length < 2) {
            resultsEl.innerHTML = '<p class="text-[11px] text-muted-theme text-center py-3">Digite ao menos 2 caracteres para buscar.</p>';
            return;
        }

        const q = term.toLowerCase().trim();
        const digitsOnly = q.replace(/\D/g, '');
        const results = (CLIENTES || []).filter(c => {
            if (c.role !== 'client') return false;
            const nameMatch = (c.name || '').toLowerCase().includes(q);
            const phoneMatch = digitsOnly.length > 0 && (c.phone || '').replace(/\D/g, '').includes(digitsOnly);
            return nameMatch || phoneMatch;
        }).slice(0, 8);

        if (results.length === 0) {
            resultsEl.innerHTML = '<p class="text-[11px] text-muted-theme text-center py-4">Nenhum cliente encontrado.</p>';
            return;
        }

        resultsEl.innerHTML = results.map(c => {
            const initial = (c.name?.[0] || 'C').toUpperCase();
            const phone = c.phone ? this.formatDisplayPhone(c.phone) : 'Sem telefone';
            return `
                <button onclick="App.selectCustomBookingClient('${c.id}')" class="w-full flex items-center gap-3 p-3 hover:bg-zinc-700/50 transition-colors text-left active:scale-[0.98]">
                    <div class="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 card-bg flex items-center justify-center border border-theme">
                        ${c.avatar
                    ? `<img src="${c.avatar}" class="w-full h-full object-cover" />`
                    : `<span class="text-sm font-black text-amber-500/70">${initial}</span>`
                }
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="font-bold text-theme text-sm truncate">${this.escapeHTML(c.name || 'Cliente')}</p>
                        <p class="text-[11px] text-muted-theme truncate">${this.escapeHTML(phone)}</p>
                    </div>
                    <i data-lucide="plus-circle" class="w-4 h-4 text-amber-500 flex-shrink-0"></i>
                </button>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons({ root: resultsEl });
    },

    selectCustomBookingClient(clientId) {
        const client = (CLIENTES || []).find(c => c.id === clientId);
        if (!client) return;
        this.state.customBookingSelectedClient = {
            id: client.id,
            name: client.name,
            phone: client.phone || '',
            avatar: client.avatar || null
        };
        this.render();
    },

    clearCustomBookingClient() {
        this.state.customBookingSelectedClient = null;
        this.render();
    },

    toggleCustomBookingService(serviceId) {
        const list = this.state.customBookingServiceIds;
        const idx = list.indexOf(serviceId);
        if (idx >= 0) list.splice(idx, 1);
        else list.push(serviceId);
        this.render();
    },

    async createCustomAppointment() {
        const barberId = this.state.customBookingBarberId;
        const barber = BARBERS.find(b => b.id === barberId);
        const services = SERVICES.filter(s => this.state.customBookingServiceIds.includes(s.id));
        const date = this.state.customBookingDate;
        const time = this.state.customBookingTime;

        if (!barber) { this.showNotification('Dados incompletos', 'Selecione o profissional.'); return; }
        if (services.length === 0) { this.showNotification('Dados incompletos', 'Selecione ao menos um serviço.'); return; }
        if (!date || !time) { this.showNotification('Dados incompletos', 'Informe a data e o horário.'); return; }

        let clientId = null, clientName = '', clientPhone = '', clientAvatar = null;
        if (this.state.customBookingMode === 'registered') {
            if (!this.state.customBookingSelectedClient) {
                this.showNotification('Selecione o cliente', 'Pesquise e selecione o cliente cadastrado.');
                return;
            }
            clientId = this.state.customBookingSelectedClient.id;
            clientName = this.state.customBookingSelectedClient.name;
            clientPhone = this.state.customBookingSelectedClient.phone;
            clientAvatar = this.state.customBookingSelectedClient.avatar;
        } else {
            clientName = document.getElementById('custom-booking-client-name')?.value?.trim() || '';
            clientPhone = document.getElementById('custom-booking-client-phone')?.value?.trim() || '';
            if (!clientName) { this.showNotification('Dados incompletos', 'Informe o nome do cliente avulso.'); return; }
        }

        const totalValue = services.reduce((sum, s) => sum + s.priceValue, 0);
        const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
        const serviceNames = services.map(s => s.name).join(' + ');

        // Mesma checagem de colisão real do fluxo normal — não deixa marcar em cima de
        // outro agendamento existente do mesmo barbeiro, mesmo sendo horário livre.
        const barberIdNorm = String(barber.user_id).toLowerCase().trim();
        const newStart = this.timeToMinutes(time);
        const newEnd = newStart + totalDuration;
        const collision = (this.state.allAppointmentsForStats || []).some(apt => {
            if (apt.date !== date || String(apt.barber_id).toLowerCase().trim() !== barberIdNorm) return false;
            const aptStart = this.timeToMinutes(apt.time);
            const aptEnd = aptStart + (apt.total_duration || 30);
            return this.hasIntervalConflict(newStart, newEnd, aptStart, aptEnd);
        });

        if (collision) {
            this.showNotification('Horário Ocupado', 'Já existe um agendamento desse profissional nesse período. Escolha outro horário.');
            return;
        }

        try {
            const { error } = await supabaseClient.from('appointments').insert({
                client_id: clientId,
                client_name: clientName,
                client_phone: clientPhone,
                client_avatar: clientAvatar,
                barber_id: barberIdNorm,
                barber_name: barber.name,
                service_names: serviceNames,
                service_price: `R$ ${totalValue.toFixed(2).replace('.', ',')}`,
                service_numeric_value: totalValue,
                total_duration: totalDuration,
                date: date,
                time: time,
                status: 'pending'
            });

            if (error) throw error;

            this.state.isCustomBookingOpen = false;
            this.showNotification('Agendamento criado ✓', `${clientName} às ${time} em ${date.split('-').reverse().join('/')}.`);
            await this.loadAppointments();
            this.render();
        } catch (err) {
            console.error('Erro ao criar agendamento personalizado:', err);
            this.showNotification('Erro', 'Não foi possível criar o agendamento.');
        }
    },

    renderCustomBookingModal() {
        if (!this.state.isCustomBookingOpen) return '';

        const activeBarbers = BARBERS.filter(b => b.is_active !== false);
        const selectedServices = SERVICES.filter(s => this.state.customBookingServiceIds.includes(s.id));
        const totalValue = selectedServices.reduce((sum, s) => sum + s.priceValue, 0);
        const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

        return `
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm fade-in" onclick="if(event.target === this) App.closeCustomBooking()">
                <div class="card-bg w-full max-w-lg rounded-[2rem] p-6 border border-theme shadow-2xl scale-in flex flex-col max-h-[90vh]">

                    <div class="flex justify-between items-start mb-4 shrink-0">
                        <div>
                            <p class="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1">Horário livre</p>
                            <h3 class="text-lg font-black text-theme">Agendamento Personalizado</h3>
                        </div>
                        <button onclick="App.closeCustomBooking()" class="w-9 h-9 rounded-full card-bg flex items-center justify-center text-muted-theme hover:text-theme transition-colors border border-theme">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>

                    <div class="overflow-y-auto pr-1 space-y-4 flex-1 min-h-0 custom-scrollbar">

                        <!-- Cliente -->
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Cliente</label>
                            <div class="flex gap-2 p-1 input-bg rounded-xl border border-theme">
                                <button onclick="App.setCustomBookingMode('registered')" class="flex-1 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${this.state.customBookingMode === 'registered' ? 'bg-amber-500 text-zinc-950' : 'text-muted-theme'}">Cadastrado</button>
                                <button onclick="App.setCustomBookingMode('walkin')" class="flex-1 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${this.state.customBookingMode === 'walkin' ? 'bg-amber-500 text-zinc-950' : 'text-muted-theme'}">Avulso</button>
                            </div>

                            ${this.state.customBookingMode === 'registered' ? `
                                ${this.state.customBookingSelectedClient ? `
                                    <div class="flex items-center justify-between gap-3 card-bg border border-theme rounded-xl p-3">
                                        <div class="flex items-center gap-2 min-w-0">
                                            <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 input-bg flex items-center justify-center border border-theme">
                                                ${this.state.customBookingSelectedClient.avatar
                    ? `<img src="${this.state.customBookingSelectedClient.avatar}" class="w-full h-full object-cover" />`
                    : `<span class="text-xs font-black text-amber-500/70">${(this.state.customBookingSelectedClient.name?.[0] || 'C').toUpperCase()}</span>`
                }
                                            </div>
                                            <p class="font-bold text-theme text-sm truncate">${App.escapeHTML(this.state.customBookingSelectedClient.name)}</p>
                                        </div>
                                        <button onclick="App.clearCustomBookingClient()" class="text-[10px] text-amber-500 font-bold uppercase tracking-wider hover:underline flex-shrink-0">Trocar</button>
                                    </div>
                                ` : `
                                    <div class="relative">
                                        <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-theme"></i>
                                        <input type="text" id="custom-booking-client-search-input" oninput="App.searchCustomBookingClient(this.value)" placeholder="Buscar cliente por nome ou telefone..." class="w-full input-bg border border-theme rounded-xl py-2.5 pl-10 pr-3 text-sm text-theme focus:border-amber-500 outline-none transition-colors" />
                                    </div>
                                    <div id="custom-booking-client-search-results" class="max-h-40 overflow-y-auto rounded-xl input-bg border border-theme/50 divide-y divide-theme/30"></div>
                                `}
                            ` : `
                                <div class="grid grid-cols-2 gap-2">
                                    <input type="text" id="custom-booking-client-name" placeholder="Nome do cliente" class="w-full input-bg border border-theme rounded-xl p-3 text-sm text-theme focus:border-amber-500 outline-none transition-colors" />
                                    <input type="text" id="custom-booking-client-phone" placeholder="Telefone (opcional)" class="w-full input-bg border border-theme rounded-xl p-3 text-sm text-theme focus:border-amber-500 outline-none transition-colors" />
                                </div>
                            `}
                        </div>

                        <!-- Profissional -->
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Profissional</label>
                            <select onchange="App.state.customBookingBarberId = this.value; App.render()" class="w-full input-bg border border-theme rounded-xl p-3 text-sm text-theme focus:border-amber-500 outline-none transition-colors">
                                ${activeBarbers.map(b => `<option value="${b.id}" ${String(this.state.customBookingBarberId) === String(b.id) ? 'selected' : ''}>${App.escapeHTML(b.name)}</option>`).join('')}
                            </select>
                        </div>

                        <!-- Serviços -->
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Serviço(s)</label>
                            <div class="flex flex-wrap gap-1.5">
                                ${SERVICES.map(s => {
            const isSelected = this.state.customBookingServiceIds.includes(s.id);
            return `
                                        <button onclick="App.toggleCustomBookingService(${s.id})" class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${isSelected ? 'bg-amber-500 text-zinc-950' : 'input-bg text-muted-theme border border-theme hover:border-amber-500/30'}">
                                            ${App.escapeHTML(s.name)}
                                        </button>
                                    `;
        }).join('')}
                            </div>
                            ${selectedServices.length > 0 ? `
                                <p class="text-[11px] text-muted-theme">Total: <span class="text-amber-500 font-bold">R$ ${totalValue.toFixed(2).replace('.', ',')}</span> · <span class="text-theme font-bold">${totalDuration} min</span></p>
                            ` : ''}
                        </div>

                        <!-- Data e Hora (livre) -->
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Data</label>
                                <input type="date" value="${this.state.customBookingDate}" onchange="App.state.customBookingDate = this.value" class="w-full input-bg border border-theme rounded-xl p-3 text-sm text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Horário (livre)</label>
                                <input type="time" value="${this.state.customBookingTime}" onchange="App.state.customBookingTime = this.value" class="w-full input-bg border border-amber-500/40 rounded-xl p-3 text-sm text-amber-500 font-bold focus:border-amber-500 outline-none transition-colors" />
                            </div>
                        </div>
                        <p class="text-[10px] text-muted-theme italic leading-relaxed">Esse horário não segue a grade normal de slots — só é bloqueado se já houver outro agendamento desse profissional no mesmo período.</p>
                    </div>

                    <button onclick="App.createCustomAppointment()" class="w-full mt-4 py-4 bg-amber-500 text-zinc-950 font-black rounded-xl uppercase tracking-widest text-sm active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20 shrink-0">
                        Criar Agendamento
                    </button>
                </div>
            </div>`;
    }
});
