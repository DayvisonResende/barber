Object.assign(App, {
    renderSplash() {
        const name = this.state.shopSettings?.name || 'FinnoTrato';
        const highlightRegex = /(barber|barbearia)/i;
        let formattedName = name;

        if (highlightRegex.test(name)) {
            const parts = name.split(highlightRegex);
            formattedName = parts.map(part => {
                const lowerPart = part.toLowerCase();
                if (lowerPart === 'barber' || lowerPart === 'barbearia') {
                    return `<span class="text-amber-500">${part}</span>`;
                }
                return part;
            }).join('');
        }

        return `
            <div class="flex flex-col items-center justify-center min-h-[80vh] app-bg fade-in">
                <div class="relative w-32 h-32 mb-8">
                    <div class="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                    <div class="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <i data-lucide="scissors" class="w-12 h-12 text-amber-500 animate-pulse"></i>
                    </div>
                </div>
                <h1 class="text-3xl font-black text-theme italic uppercase tracking-widest animate-pulse logo-font">${formattedName}</h1>
                <p class="text-[10px] text-muted-theme font-bold uppercase tracking-[0.3em] mt-2">${this.state.shopSettings?.slogan || 'Personal Grooming'}</p>
            </div>
        `;
    },



    renderReminderCard(reminder) {
        if (!reminder) return '';

        return `
            <!-- Botão do Sino Flutuante -->
            <div onclick="App.toggleReminderPopup()" class="floating-bell pulse-warm">
                <i data-lucide="bell-ring" class="w-7 h-7 ${this.state.showReminderPopup ? '' : 'animate-bounce'}"></i>
            </div>

            <!-- Popover de Informações -->
            ${this.state.showReminderPopup ? `
                <div class="popover-card">
                    <div class="flex flex-col items-center text-center space-y-3">
                        <div class="bg-amber-500/20 p-3 rounded-full text-amber-500">
                            <i data-lucide="calendar-check" class="w-8 h-8"></i>
                        </div>
                        
                        <div>
                            <p class="text-[10px] text-muted-theme uppercase font-black tracking-widest leading-none">Seu próximo corte</p>
                            <h3 class="text-xl font-black text-theme mt-1">Hoje, às ${reminder.apt.time}</h3>
                            <p class="text-xs font-bold text-amber-500/80 mt-1 flex items-center justify-center gap-1">
                                <i data-lucide="timer" class="w-3.5 h-3.5"></i> Faltam ${reminder.timeMsg}
                            </p>
                        </div>

                        <div class="w-full pt-4 border-t border-theme flex gap-2">
                             <a href="https://wa.me/${App.formatWA(this.state.shopSettings?.whatsapp)}?text=Ol%C3%A1,%20estou%20a%20caminho%20do%20meu%20hor%C3%A1rio%20das%20${reminder.apt.time}" target="_blank" class="flex-1 py-2 bg-[#25D366]/10 text-[#25D366] rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5">
                                <i data-lucide="message-circle" class="w-3 h-3"></i> WhatsApp
                            </a>
                            <button onclick="App.toggleReminderPopup()" class="p-2 input-bg text-muted-theme rounded-xl">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    },

    renderRegistrationSuccess() {
        return `
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md fade-in">
                <div class="card-bg border border-amber-500/30 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl shadow-amber-500/10 slide-in-up text-center space-y-6">
                    <div class="relative mx-auto w-24 h-24">
                        <!-- Círculos de fundo pulsantes -->
                        <div class="absolute inset-0 bg-amber-500/20 rounded-full animate-ping"></div>
                        <div class="absolute inset-2 bg-amber-500/30 rounded-full animate-pulse"></div>
                        
                        <!-- Ícone de Check -->
                        <div class="absolute inset-0 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/40">
                            <i data-lucide="check" class="w-12 h-12 text-zinc-950 stroke-[3]"></i>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <h2 class="text-3xl font-black text-theme">Tudo Pronto!</h2>
                        <p class="text-muted-theme font-medium px-4">Sua conta foi criada com sucesso. Agora você já pode agendar seus horários!</p>
                    </div>

                    <div class="pt-2">
                        <button onclick="App.closeRegistrationSuccess()" class="w-full py-4 bg-amber-500 text-zinc-950 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/20">
                            Começar Agora
                        </button>
                    </div>

                    <p class="text-[10px] text-muted-theme font-bold uppercase tracking-tighter opacity-50">FinnoTrato Barber • Estilo & Excelência</p>
                </div>
            </div>
        `;
    },

    renderLogin() {
        return `
            <div class="space-y-6 fade-in slide-in-up mt-12">
                <div class="flex flex-col items-center justify-center space-y-4 mb-12">
                    <div class="w-20 h-20 rounded-2xl shadow-xl shadow-amber-500/10 overflow-hidden bg-zinc-800 border-2 border-amber-500/20 flex items-center justify-center">
                        ${this.state.shopSettings?.logo_url ? `
                            <img src="${this.state.shopSettings.logo_url}" class="w-full h-full object-cover" />
                        ` : `
                            <div class="p-4 bg-amber-500 rounded-xl">
                                <i data-lucide="scissors" class="w-10 h-10 text-zinc-950"></i>
                            </div>
                        `}
                    </div>

                    <h1 class="text-[2.75rem] font-bold tracking-tight text-theme logo-font leading-tight">
                        ${(() => {
                const name = this.state.shopSettings?.name || 'FinnoTratoBarber';
                const highlightRegex = /(barber|barbearia)/i;
                if (highlightRegex.test(name)) {
                    const parts = name.split(highlightRegex);
                    return parts.map(part => {
                        const lowerPart = part.toLowerCase();
                        if (lowerPart === 'barber' || lowerPart === 'barbearia') {
                            return `<span class="text-amber-500">${part}</span>`;
                        }
                        return part;
                    }).join('');
                }
                return name;
            })()}
                    </h1>
                    <p class="text-muted-theme text-sm text-center px-6">${this.state.shopSettings?.slogan || 'O seu estilo nas suas mãos.'}</p>
                </div>

                <div class="space-y-4">
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-theme">Celular (WhatsApp)</label>
                        <input type="tel" id="login-phone" inputmode="numeric" placeholder="(11) 99999-9999" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <label class="text-sm font-medium text-muted-theme">Senha</label>
                            <button onclick="App.setAuthView('forgot')" class="text-xs text-amber-500 font-medium hover:text-amber-400">Esqueci a senha</button>
                        </div>
                        <div class="relative group">
                            <input type="password" id="login-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 pr-12 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                            <button type="button" onclick="App.togglePasswordVisibility('login-password', 'eye-login')" class="absolute right-0 top-0 h-full px-4 text-muted-theme hover:text-amber-500 transition-colors">
                                <i id="eye-login" data-lucide="eye" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="pt-4 space-y-4">
                    <button onclick="App.login()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25">
                        <i data-lucide="log-in" class="w-5 h-5"></i> Entrar
                    </button>
                    <button onclick="App.setAuthView('register')" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-transparent text-muted-theme border border-theme hover:card-bg">
                        Criar uma nova conta
                    </button>
                </div>
            </div>
        `;
    },

    renderRegister() {
        return `
            <div class="space-y-6 fade-in slide-in-up mt-8">
                <div class="mb-8">
                    <button onclick="App.setAuthView('login')" class="flex items-center gap-2 text-muted-theme hover:text-theme transition-colors mb-4">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Voltar
                    </button>
                    <h2 class="text-3xl font-bold text-theme">Criar Conta</h2>
                    <p class="text-muted-theme mt-1">Preencha os dados abaixo.</p>
                </div>

                <div class="space-y-4">
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-theme">Nome Completo</label>
                        <input type="text" id="reg-name" placeholder="João da Silva" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-muted-theme">CPF</label>
                            <input type="tel" id="reg-cpf" inputmode="numeric" placeholder="000.000.000-00" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-muted-theme">Nascimento</label>
                            <input type="date" id="reg-birth" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-theme">Celular (WhatsApp)</label>
                        <input type="tel" id="reg-phone" inputmode="numeric" placeholder="(11) 99999-9999" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>
                    
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-theme">Criar Senha</label>
                        <div class="relative group">
                            <input type="password" id="reg-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 pr-12 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                            <button type="button" onclick="App.togglePasswordVisibility('reg-password', 'eye-reg')" class="absolute right-0 top-0 h-full px-4 text-muted-theme hover:text-amber-500 transition-colors">
                                <i id="eye-reg" data-lucide="eye" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-theme">Confirmar Senha</label>
                        <div class="relative group">
                            <input type="password" id="reg-confirm-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 pr-12 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                            <button type="button" onclick="App.togglePasswordVisibility('reg-confirm-password', 'eye-reg-confirm')" class="absolute right-0 top-0 h-full px-4 text-muted-theme hover:text-amber-500 transition-colors">
                                <i id="eye-reg-confirm" data-lucide="eye" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="pt-4">
                    <button onclick="App.register()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-theme">
                        <i data-lucide="user-plus" class="w-5 h-5"></i> Finalizar Cadastro
                    </button>
                </div>
            </div>
        `;
    },

    renderForgotPassword() {
        if (this.state.recoveryStep === 'verify') {
            return `
                <div class="space-y-6 fade-in slide-in-up mt-8">
                    <div class="mb-8">
                        <button onclick="App.setAuthView('login')" class="flex items-center gap-2 text-muted-theme hover:text-theme transition-colors mb-4">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Voltar
                        </button>
                        <h2 class="text-3xl font-bold text-theme">Recuperar Senha</h2>
                        <p class="text-muted-theme mt-1">Confirme sua identidade para redefinir.</p>
                    </div>

                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-muted-theme">Celular Cadastrado</label>
                            <input type="tel" id="forgot-phone" inputmode="numeric" placeholder="(11) 99999-9999" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-2">
                                <label class="text-sm font-medium text-muted-theme">CPF</label>
                                <input type="tel" id="forgot-cpf" inputmode="numeric" placeholder="000.000.000-00" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-sm font-medium text-muted-theme">Nascimento</label>
                                <input type="date" id="forgot-birth" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div class="pt-4">
                        <button onclick="App.verifyRecovery()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-theme">
                            <i data-lucide="shield-check" class="w-5 h-5"></i> Verificar Identidade
                        </button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="space-y-6 fade-in slide-in-up mt-8">
                    <div class="mb-8">
                        <h2 class="text-3xl font-bold text-theme">Nova Senha</h2>
                        <p class="text-muted-theme mt-1">Identidade confirmada! Defina sua nova senha.</p>
                    </div>

                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-muted-theme">Nova Senha</label>
                            <div class="relative group">
                                <input type="password" id="new-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 pr-12 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                                <button type="button" onclick="App.togglePasswordVisibility('new-password', 'eye-new')" class="absolute right-0 top-0 h-full px-4 text-muted-theme hover:text-amber-500 transition-colors">
                                    <i id="eye-new" data-lucide="eye" class="w-5 h-5"></i>
                                </button>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-muted-theme">Confirmar Nova Senha</label>
                            <div class="relative group">
                                <input type="password" id="new-confirm-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 pr-12 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                                <button type="button" onclick="App.togglePasswordVisibility('new-confirm-password', 'eye-new-confirm')" class="absolute right-0 top-0 h-full px-4 text-muted-theme hover:text-amber-500 transition-colors">
                                    <i id="eye-new-confirm" data-lucide="eye" class="w-5 h-5"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="pt-4">
                        <button onclick="App.resetPassword()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-theme">
                            <i data-lucide="save" class="w-5 h-5"></i> Atualizar Senha
                        </button>
                    </div>
                </div>
            `;
        }
    },

    renderBookingFlow() {
        const step = this.state.bookingStep;
        const isEditing = !!this.state.editingAppointmentId;
        const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);

        // ── Progress indicator ──
        const steps = ['date', 'service', 'slots', 'confirm'];
        const stepIdx = steps.indexOf(step);
        const stepLabels = ['Data', 'Serviço', 'Horário', 'Confirmar'];

        const progressHtml = `
            <div class="flex items-center gap-1 mb-6">
                ${steps.map((s, i) => `
                    <div class="flex items-center gap-1 ${i < steps.length - 1 ? 'flex-1' : ''}">
                        <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-all
                            ${i < stepIdx ? 'bg-amber-500 text-zinc-950' :
                i === stepIdx ? 'bg-amber-500 text-zinc-950 ring-4 ring-amber-500/20' :
                    'input-bg text-muted-theme border border-theme'}">
                            ${i < stepIdx ? '<i data-lucide="check" class="w-3 h-3"></i>' : i + 1}
                        </div>
                        ${i < steps.length - 1 ? `<div class="flex-1 h-px ${i < stepIdx ? 'bg-amber-500' : 'bg-zinc-700'}"></div>` : ''}
                    </div>
                `).join('')}
            </div>`;

        // ── STEP 1: DATE ──
        if (step === 'date') {
            return `
            <div class="space-y-5 fade-in slide-in-up">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-theme">${isEditing ? 'Alterar Horário' : 'Novo Agendamento'}</h2>
                        <p class="text-xs text-muted-theme mt-0.5">Escolha a data do seu atendimento</p>
                    </div>
                    <button onclick="App.cancelBooking()" class="p-2 input-bg rounded-full text-muted-theme hover:text-theme transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                ${progressHtml}
                ${this.renderCalendar()}
                <p class="text-center text-[10px] text-muted-theme">
                    <span class="inline-flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Selecione uma data para continuar
                    </span>
                </p>
            </div>`;
        }

        // ── STEP 2: SERVICE (multi-select) ──
        if (step === 'service') {
            const dateObj = new Date(this.state.selectedDate + 'T00:00:00');
            const dateFormatted = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
            const selected = this.state.bookingSelectedServices || [];
            const totalDuration = selected.reduce((s, sv) => s + sv.durationMinutes, 0);
            const totalValue = selected.reduce((s, sv) => s + sv.priceValue, 0);
            const hasVariable = selected.some(sv => sv.price_variable);
            const hasSelected = selected.length > 0;

            return `
            <div class="space-y-5 fade-in slide-in-up">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-theme">Serviços</h2>
                        <p class="text-xs text-muted-theme mt-0.5 capitalize">${dateFormatted}</p>
                    </div>
                    <button onclick="App.cancelBooking()" class="p-2 input-bg rounded-full text-muted-theme hover:text-theme transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                ${progressHtml}
                <button onclick="App.backToDate()" class="flex items-center gap-1.5 text-xs text-muted-theme hover:text-amber-500 transition-colors">
                    <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Trocar data
                </button>
                <p class="text-[11px] text-muted-theme font-medium">Selecione um ou mais serviços:</p>
                <div class="space-y-2">
                    ${SERVICES.map(svc => {
                const isChecked = selected.some(s => s.id === svc.id);
                return `
                        <div onclick="App.toggleBookingService(${svc.id})"
                            class="flex items-center gap-4 p-4 card-bg border rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-sm
                                ${isChecked ? 'border-amber-500 bg-amber-500/5 shadow-amber-500/10' : 'border-theme hover:border-amber-500/30'}">
                            <!-- Checkbox visual -->
                            <div class="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-150
                                ${isChecked ? 'bg-amber-500 border-amber-500 shadow-md shadow-amber-500/30' : 'border-2 border-zinc-600 bg-transparent'}">
                                ${isChecked ? '<i data-lucide="check" class="w-4 h-4 text-zinc-950 font-black"></i>' : ''}
                            </div>
                            <!-- Info -->
                            <div class="flex-1 min-w-0">
                                <p class="font-bold text-theme text-sm truncate">${App.escapeHTML(svc.name)}</p>
                                <p class="text-[11px] text-muted-theme mt-0.5 flex items-center gap-2">
                                    <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>${svc.duration}</span>
                                    <span class="opacity-30">•</span>
                                    <span class="${isChecked ? 'text-amber-500 font-semibold' : ''}">
                                        ${svc.price_variable ? '<span class="text-[10px] italic opacity-70">A partir de</span> ' : ''}${svc.price}
                                    </span>
                                </p>
                            </div>
                        </div>`;
            }).join('')}
                </div>

                <!-- Footer com total + botão (posicionado após a lista) -->
                <div class="mt-8 pb-4">
                    <div class="max-w-lg mx-auto">
                        <div class="card-bg border border-theme rounded-2xl shadow-sm overflow-hidden">
                            ${hasSelected ? `
                                <div class="px-4 pt-3 pb-2 flex items-center justify-between border-b border-theme/50">
                                    <div class="flex items-center gap-3 text-sm">
                                        <div class="flex items-center gap-1 text-muted-theme">
                                            <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                                            <span class="font-bold text-theme">${this.formatDuration ? this.formatDuration(totalDuration) : totalDuration + ' min'}</span>
                                        </div>
                                        <span class="text-zinc-700">·</span>
                                        <div>
                                            ${hasVariable ? '<span class="text-[10px] text-amber-500 italic font-bold">A partir de </span>' : ''}
                                            <span class="font-black text-amber-500">R$ ${totalValue.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>
                                    <span class="text-[10px] font-bold text-muted-theme uppercase tracking-widest">
                                        ${selected.length} serviço${selected.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                            ` : ''}
                            <div class="p-3">
                                <button onclick="App.confirmServiceSelection()"
                                    class="w-full py-3.5 rounded-xl font-black text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]
                                        ${hasSelected
                    ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                    : 'input-bg text-muted-theme cursor-not-allowed opacity-60'}">
                                    <i data-lucide="clock" class="w-4 h-4"></i>
                                    ${hasSelected ? 'Ver Horários Disponíveis' : 'Selecione ao menos 1 serviço'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        // ── STEP 3: SLOTS ──
        if (step === 'slots') {
            const svc = this.state.bookingSelectedService;
            const dateObj = new Date(this.state.selectedDate + 'T00:00:00');
            const dateFormatted = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
            const slots = this.state.bookingAvailableSlots;
            const isLoading = this.state.bookingIsLoadingSlots;
            const sortedTimes = Object.keys(slots).sort();

            // Filtrar horários passados se for hoje
            const now = new Date();
            const todayStr = this.dateToStr ? this.dateToStr(now) : now.toISOString().split('T')[0];
            const currentMin = now.getHours() * 60 + now.getMinutes();
            const validTimes = isStaff
                ? sortedTimes
                : sortedTimes.filter(t => {
                    if (this.state.selectedDate !== todayStr) return true;
                    const [h, m] = t.split(':').map(Number);
                    return (h * 60 + m) > currentMin;
                });

            return `
            <div class="space-y-5 fade-in slide-in-up">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-theme">Horários</h2>
                        <p class="text-xs text-muted-theme mt-0.5 capitalize">${dateFormatted}</p>
                    </div>
                    <button onclick="App.cancelBooking()" class="p-2 input-bg rounded-full text-muted-theme hover:text-theme transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                ${progressHtml}
                <div class="flex items-center justify-between">
                    <button onclick="App.backToService()" class="flex items-center gap-1.5 text-xs text-muted-theme hover:text-amber-500 transition-colors">
                        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Trocar serviço
                    </button>
                    ${svc ? `
                        <span class="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                            <i data-lucide="scissors" class="w-3 h-3"></i> ${App.escapeHTML(svc.name)} · ${svc.duration}
                        </span>` : ''}
                </div>

                ${isLoading ? `
                    <div class="flex flex-col items-center justify-center py-16 space-y-3">
                        <div class="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <p class="text-xs text-muted-theme">Calculando disponibilidade...</p>
                    </div>
                ` : validTimes.length === 0 ? `
                    <div class="flex flex-col items-center justify-center py-16 text-center space-y-4">
                        <div class="w-16 h-16 input-bg border border-theme rounded-full flex items-center justify-center">
                            <i data-lucide="calendar-x" class="w-8 h-8 text-muted-theme"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-theme">Sem horários disponíveis</h4>
                            <p class="text-xs text-muted-theme mt-1">Nenhum barbeiro disponível para este dia e serviço.<br>Tente outra data.</p>
                        </div>
                        <button onclick="App.backToDate()" class="px-6 py-3 bg-amber-500 text-zinc-950 rounded-xl font-bold text-sm active:scale-95 transition-all">
                            Escolher outra data
                        </button>
                    </div>
                ` : `
                    <div class="space-y-3 pb-6">
                        <p class="text-[10px] text-muted-theme uppercase font-bold tracking-widest">${validTimes.length} horário(s) disponível(is)</p>
                        ${validTimes.map(time => `
                            <div class="card-bg border border-theme rounded-2xl p-4 shadow-sm">
                                <p class="text-2xl font-black text-theme mb-3 flex items-center gap-2">
                                    <i data-lucide="clock" class="w-5 h-5 text-amber-500"></i>${time}
                                </p>
                                <div class="flex flex-wrap gap-2">
                                    ${slots[time].map(barber => `
                                        <button onclick="App.selectTimeAndBarberNew('${time}', ${barber.id})"
                                            class="flex items-center gap-2.5 px-3 py-2 input-bg hover:bg-amber-500/10 border border-theme hover:border-amber-500/40 rounded-xl transition-all duration-200 active:scale-[0.97] group">
                                            <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                                ${barber.avatar
                    ? `<img src="${barber.avatar}" class="w-full h-full object-cover" />`
                    : `<span class="text-sm font-black text-amber-500/70">${(barber.name?.[0] || 'B').toUpperCase()}</span>`
                }
                                            </div>
                                            <span class="text-sm font-semibold text-theme group-hover:text-amber-500 transition-colors">${App.escapeHTML(barber.name.split(' ')[0])}</span>
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>`;
        }

        // ── STEP 4: CONFIRM ──
        if (step === 'confirm') {
            const svc = this.state.bookingSelectedService;
            const services = this.state.selectedServices.length > 0 ? this.state.selectedServices : (svc ? [svc] : []);
            const barber = this.state.selectedBarber;
            const totalValue = services.reduce((s, sv) => s + sv.priceValue, 0);
            const totalDuration = services.reduce((s, sv) => s + sv.durationMinutes, 0);
            const dateObj = new Date(this.state.selectedDate + 'T00:00:00');
            const dateFormatted = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
            const hasVariable = services.some(s => s.price_variable);

            // Desconto de plano (apenas para cliente)
            const planDiscount = this.getBookingPlanDiscount ? this.getBookingPlanDiscount(services) : null;

            return `
            <div class="space-y-5 fade-in slide-in-up">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-theme">Confirmar</h2>
                        <p class="text-xs text-muted-theme mt-0.5">Revise seu agendamento</p>
                    </div>
                    <button onclick="App.cancelBooking()" class="p-2 input-bg rounded-full text-muted-theme hover:text-theme transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                ${progressHtml}

                <button onclick="App.backToService()" class="flex items-center gap-1.5 text-xs text-muted-theme hover:text-amber-500 transition-colors">
                    <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Voltar
                </button>

                <!-- Resumo -->
                <div class="card-bg border border-amber-500/20 rounded-3xl p-5 space-y-4 shadow-xl">
                    <div class="flex items-center gap-3 pb-4 border-b border-theme/50">
                        <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800 border-2 border-amber-500/30 flex items-center justify-center">
                            ${barber?.avatar
                    ? `<img src="${barber.avatar}" class="w-full h-full object-cover" />`
                    : `<span class="text-xl font-black text-amber-500/70">${(barber?.name?.[0] || 'B').toUpperCase()}</span>`
                }
                        </div>
                        <div>
                            <p class="font-bold text-theme">${App.escapeHTML(barber?.name || '')}</p>
                            <p class="text-xs text-muted-theme">Profissional selecionado</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-0.5">
                            <p class="text-[10px] text-muted-theme uppercase font-bold tracking-widest">Data</p>
                            <p class="font-semibold text-theme text-sm capitalize">${dateFormatted}</p>
                        </div>
                        <div class="space-y-0.5">
                            <p class="text-[10px] text-muted-theme uppercase font-bold tracking-widest">Horário</p>
                            <p class="font-semibold text-theme text-sm">${this.state.selectedTime}</p>
                        </div>
                    </div>

                    <div class="space-y-1.5 pt-2 border-t border-theme/50">
                        <p class="text-[10px] text-muted-theme uppercase font-bold tracking-widest mb-2">Serviço(s)</p>
                        ${services.map(sv => `
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-theme font-medium">${App.escapeHTML(sv.name)}</span>
                                <span class="text-amber-500 font-bold">${sv.price_variable ? '<span class="text-[10px] italic text-muted-theme mr-1">A partir de</span>' : ''}R$ ${sv.priceValue.toFixed(2).replace('.', ',')}</span>
                            </div>
                        `).join('')}
                    </div>

                    ${planDiscount ? `
                    <div class="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div class="flex items-center gap-2">
                            <i data-lucide="tag" class="w-4 h-4 text-emerald-400"></i>
                            <span class="text-sm font-bold text-emerald-400">Plano ${App.escapeHTML(planDiscount.clientPlan.plan?.name || '')}</span>
                        </div>
                        <span class="text-sm font-black text-emerald-400">- R$ ${planDiscount.discountAmount.toFixed(2).replace('.', ',')}</span>
                    </div>` : ''}

                    <div class="flex items-center justify-between pt-3 border-t border-theme/50">
                        <div class="flex items-center gap-1.5 text-xs text-muted-theme">
                            <i data-lucide="clock" class="w-3.5 h-3.5"></i> ${this.formatDuration ? this.formatDuration(totalDuration) : totalDuration + ' min'}
                        </div>
                        <div class="text-right">
                            ${planDiscount ? `<p class="text-sm text-muted-theme line-through leading-none mb-0.5">R$ ${totalValue.toFixed(2).replace('.', ',')}</p>` :
                (hasVariable ? '<p class="text-[9px] text-amber-500 font-black uppercase tracking-widest italic leading-none">A partir de</p>' : '')}
                            <p class="text-2xl font-black ${planDiscount ? 'text-emerald-400' : 'text-amber-500'}">
                                R$ ${planDiscount ? planDiscount.discountedTotal.toFixed(2).replace('.', ',') : totalValue.toFixed(2).replace('.', ',')}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Staff: cliente -->
                ${this.state.isStaffBooking ? `
                    <div class="card-bg border border-theme rounded-2xl p-4 space-y-3 shadow-sm">
                        ${this.state.staffBookingMode === 'registered' ? `
                            <p class="text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <i data-lucide="user-check" class="w-3 h-3"></i> Cliente Cadastrado
                            </p>
                            ${this.state.staffSelectedClient ? `
                                <div class="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                    <div class="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800 flex items-center justify-center border border-amber-500/30">
                                        ${this.state.staffSelectedClient.avatar
                                ? `<img src="${this.state.staffSelectedClient.avatar}" class="w-full h-full object-cover" />`
                                : `<span class="font-black text-amber-500/70">${(this.state.staffSelectedClient.name?.[0] || 'C').toUpperCase()}</span>`
                            }
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-bold text-theme text-sm truncate">${App.escapeHTML(this.state.staffSelectedClient.name)}</p>
                                        <p class="text-[11px] text-muted-theme">${App.escapeHTML(App.formatDisplayPhone(this.state.staffSelectedClient.phone) || 'Sem telefone')}</p>
                                    </div>
                                    <button onclick="App.clearStaffClient()" class="p-1.5 input-bg border border-theme rounded-lg transition-colors">
                                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-muted-theme"></i>
                                    </button>
                                </div>
                            ` : `
                                <div class="relative">
                                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-theme pointer-events-none"></i>
                                    <input type="text" id="staff-client-search-input" placeholder="Buscar cliente por nome ou telefone..."
                                        class="w-full input-bg border border-theme rounded-xl p-3 pl-9 text-theme focus:border-amber-500 outline-none transition-colors text-sm"
                                        oninput="App.searchStaffClients(this.value)" autocomplete="off" />
                                </div>
                                <div id="staff-client-search-results" class="max-h-48 overflow-y-auto rounded-xl input-bg border border-theme/50">
                                    <p class="text-[11px] text-muted-theme text-center py-3">Digite ao menos 2 caracteres.</p>
                                </div>
                            `}
                        ` : `
                            <p class="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <i data-lucide="user-plus" class="w-3 h-3"></i> Cliente Walk-in
                            </p>
                            <input type="text" id="client-name-manual" placeholder="Nome do Cliente" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors text-sm" />
                            <input type="tel" id="client-phone-manual" inputmode="numeric" placeholder="Telefone (Opcional)" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors text-sm" />
                        `}
                    </div>
                ` : ''}

                <button onclick="App.confirmBooking()" class="w-full py-4 rounded-2xl font-black text-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20">
                    <i data-lucide="check-circle" class="w-6 h-6"></i>
                    ${isEditing ? 'Confirmar Alteração' : 'Confirmar Agendamento'}
                </button>
            </div>`;
        }

        return '';
    },

    // ── LEGADO: mantido para referência interna ──
    renderBookingFlowLegacy() {
        const today = new Date().toISOString().split('T')[0];
        return `
            <div class="space-y-6 fade-in slide-in-up">
                <div class="flex items-center justify-between">
                    <h2 class="text-2xl font-bold text-theme">Novo Agendamento</h2>
                    <button onclick="App.cancelBooking()" class="p-2 input-bg rounded-full text-muted-theme hover:text-theme transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Passo 1: Data -->
                <div class="card-bg border border-theme rounded-2xl overflow-hidden shadow-sm transition-all">
                    <!-- Header -->
                    <div class="p-4 flex justify-between items-center cursor-pointer ${this.state.activeBookingStep === 1 ? 'border-b border-theme' : ''}" onclick="App.setBookingStep(1)">
                        <div class="flex items-center gap-3">
                            <i data-lucide="calendar" class="w-5 h-5 ${this.state.selectedDate && this.state.activeBookingStep !== 1 ? 'text-amber-500' : 'text-muted-theme'}"></i>
                            <div>
                                <h3 class="font-bold text-theme">Disponibilidade</h3>
                                <p class="text-xs text-muted-theme mt-0.5">${this.state.selectedDate && this.state.activeBookingStep !== 1 ? `Data: ${this.state.selectedDate}` : 'Selecione datas'}</p>
                            </div>
                        </div>
                        <i data-lucide="${this.state.activeBookingStep === 1 ? 'chevron-up' : 'chevron-down'}" class="w-5 h-5 text-muted-theme"></i>
                    </div>
                    
                    <!-- Corpo -->
                    ${this.state.activeBookingStep === 1 ? `
                        <div class="p-4 fade-in input-bg">
                            ${this.renderCalendar()}
                        </div>
                    ` : ''}
                </div>

                <!-- Passo 2: Horário e Profissional -->
                <div class="${this.state.selectedDate ? 'block' : 'hidden'} card-bg border border-theme rounded-2xl overflow-hidden shadow-sm transition-all mt-4">
                    <div class="p-4 flex justify-between items-center cursor-pointer ${this.state.activeBookingStep === 2 ? 'border-b border-theme' : ''}" onclick="App.setBookingStep(2)">
                        <div class="flex items-center gap-3">
                            <i data-lucide="clock" class="w-5 h-5 ${this.state.selectedTime && this.state.activeBookingStep !== 2 ? 'text-amber-500' : 'text-muted-theme'}"></i>
                            <div>
                                <h3 class="font-bold text-theme">Horário e Barbeiro</h3>
                                <p class="text-xs text-muted-theme mt-0.5">${this.state.selectedTime && this.state.activeBookingStep !== 2 ? `${this.state.selectedTime} com ${this.state.selectedBarber?.name.split(' ')[0]}` : 'Escolha a agenda'}</p>
                            </div>
                        </div>
                        <i data-lucide="${this.state.activeBookingStep === 2 ? 'chevron-up' : 'chevron-down'}" class="w-5 h-5 text-muted-theme"></i>
                    </div>

                    ${this.state.activeBookingStep === 2 ? `
                        <div class="p-4 fade-in input-bg space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
                        ${(() => {
                    const dateObj = new Date(this.state.selectedDate + 'T00:00:00');
                    const dayOfWeek = dateObj.getDay();
                    const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);

                    // NOVO: Verificação de Barbearia Aberta (Ignorada para staff se necessário, mas mantida por padrão)
                    const workingDays = this.state.shopSettings.working_days || [1, 2, 3, 4, 5, 6];
                    const isShopOpen = workingDays.includes(dayOfWeek);

                    if (!isShopOpen && !isStaff) {
                        return `
                                    <div class="flex flex-col items-center justify-center py-10 text-center space-y-4">
                                        <div class="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
                                            <i data-lucide="calendar-x" class="w-8 h-8"></i>
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-theme">Barbearia Fechada</h4>
                                            <p class="text-xs text-muted-theme mt-1">Neste dia não funcionamos.<br>Por favor, selecione outra data.</p>
                                        </div>
                                    </div>
                                `;
                    }

                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                    // Agrupar slots por horário: { "09:00": [barber1, barber2], "09:45": [barber1] }
                    const slotsByTime = {};

                    // Filtro resiliente: se is_active/active for undefined, assume que é ativo (retrocompatibilidade)
                    const activeBarbers = BARBERS.filter(b => b.is_active !== false && b.active !== false);

                    activeBarbers.forEach(barber => {
                        const available = this.getBarberAvailableSlots(barber.user_id, this.state.selectedDate);

                        // Debug log para ajudar o suporte (visível no console)
                        if (available.length === 0) {
                            console.log(`ℹ️ Nenhuma disponibilidade para ${barber.name} em ${this.state.selectedDate}`);
                        }

                        available.forEach(slot => {
                            if (slot.isOccupied) return;

                            // Se não for staff, não mostrar horários retroativos do dia de hoje
                            if (!isStaff && this.state.selectedDate === todayStr && slot.time <= currentTimeStr) return;

                            if (!slotsByTime[slot.time]) slotsByTime[slot.time] = [];
                            slotsByTime[slot.time].push(barber);
                        });
                    });

                    const sortedTimes = Object.keys(slotsByTime).sort();

                    if (sortedTimes.length === 0) {
                        return `
                                    <div class="flex flex-col items-center justify-center py-10 text-center space-y-4">
                                        <div class="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-500">
                                            <i data-lucide="clock" class="w-8 h-8"></i>
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-theme">Sem Horários</h4>
                                            <p class="text-xs text-muted-theme mt-1">Nenhum barbeiro disponível para esta data.<br>Tente outro dia.</p>
                                        </div>
                                    </div>
                                `;
                    }

                    return sortedTimes.map(time => `
                                <div class="p-3 card-bg border border-theme rounded-xl flex items-center justify-between shadow-sm">
                                    <span class="text-xl font-bold text-theme">${time}</span>
                                    <div class="flex gap-4">
                                        ${slotsByTime[time].map(barber => {
                        const isSelected = this.state.selectedTime === time && this.state.selectedBarber?.id === barber.id;
                        return `
                                                <div onclick="App.selectTimeAndBarber('${time}', ${barber.id})" class="cursor-pointer transition-all flex flex-col items-center gap-1 ${isSelected ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}">
                                                    <div class="relative">
                                                        ${barber.avatar ? `
                                                            <img src="${barber.avatar}" alt="${App.escapeHTML(barber.name)}" class="w-12 h-12 rounded-full input-bg border-2 ${isSelected ? 'border-amber-500 object-cover shadow-md shadow-amber-500/20' : 'border-zinc-700 object-cover'}">
                                                        ` : `
                                                            <div class="w-12 h-12 rounded-full input-bg border-2 ${isSelected ? 'border-amber-500 shadow-md shadow-amber-500/20' : 'border-zinc-700'} flex items-center justify-center bg-zinc-800 shadow-inner">
                                                                <span class="text-xl font-black text-amber-500/70">${(barber.name?.[0] || 'P').toUpperCase()}</span>
                                                            </div>
                                                        `}
                                                        ${isSelected ? '<div class="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 shadow-sm"><i data-lucide="check" class="w-3 h-3 text-zinc-950"></i></div>' : ''}
                                                    </div>
                                                    <span class="text-[10px] ${isSelected ? 'text-amber-500 font-bold' : 'text-muted-theme font-medium'}">${barber.name.split(' ')[0]}</span>
                                                </div>
                                            `;
                    }).join('')}
                                    </div>
                                </div>
                            `).join('');
                })()}
                        </div>
                    ` : ''}
                </div>

                <!-- Passo 3: Serviços -->
                <div class="${this.state.selectedTime && this.state.selectedBarber ? 'block' : 'hidden'} card-bg border border-theme rounded-2xl overflow-hidden shadow-sm transition-all mt-4">
                    <div class="p-4 flex justify-between items-center cursor-pointer ${this.state.activeBookingStep === 3 ? 'border-b border-theme' : ''}" onclick="App.setBookingStep(3)">
                        <div class="flex items-center gap-3">
                            <i data-lucide="scissors" class="w-5 h-5 ${this.state.selectedServices.length > 0 && this.state.activeBookingStep !== 3 ? 'text-amber-500' : 'text-muted-theme'}"></i>
                            <div>
                                <h3 class="font-bold text-theme">Serviços com ${this.state.selectedBarber?.name.split(' ')[0] || ''}</h3>
                                <p class="text-xs text-muted-theme mt-0.5">${this.state.selectedServices.length > 0 && this.state.activeBookingStep !== 3 ? `${this.state.selectedServices.length} serviço(s) selecionado(s)` : 'Selecione o que deseja'}</p>
                            </div>
                        </div>
                        <i data-lucide="${this.state.activeBookingStep === 3 ? 'chevron-up' : 'chevron-down'}" class="w-5 h-5 text-muted-theme"></i>
                    </div>

                    ${this.state.activeBookingStep === 3 ? `
                        <div class="p-4 fade-in input-bg grid gap-2">
                            ${(() => {
                    // Filtrar serviços baseados no barbeiro selecionado
                    let availableServices = SERVICES;
                    const barberId = this.state.selectedBarber?.id;

                    if (barberId) {
                        const mappedServices = this.state.barberServices.filter(s => s.barber_id === barberId).map(s => s.service_id);
                        // Se o barbeiro tem especialidades cadastradas, filtra por elas. 
                        // Se não tem nada (vazio), assume que faz tudo (retrocompatibilidade).
                        if (mappedServices.length > 0) {
                            availableServices = SERVICES.filter(svc => mappedServices.includes(svc.id));
                        }
                    }

                    return availableServices.map(svc => {
                        const isSelected = this.state.selectedServices.some(s => s.id === svc.id);
                        return `
                                        <div onclick="App.toggleService(${svc.id})" class="p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-theme input-bg hover:border-zinc-700'} flex items-center gap-3">
                                            <div class="w-5 h-5 rounded border ${isSelected ? 'bg-amber-500 border-amber-500 text-zinc-950 flex items-center justify-center' : 'border-zinc-600'}">
                                                ${isSelected ? '<i data-lucide="check" class="w-3 h-3"></i>' : ''}
                                            </div>
                                            <div class="flex-1">
                                                <h4 class="font-bold text-theme text-sm">${svc.name}</h4>
                                                <p class="text-[10px] text-muted-theme mt-0.5 uppercase tracking-tighter">
                                                    ${svc.duration} • ${svc.price_variable ? '<span class="text-amber-500 font-bold italic mr-1">A partir de</span>' : ''}R$ ${svc.priceValue.toFixed(2).replace('.', ',')}
                                                </p>
                                            </div>
                                        </div>
                                    `;
                    }).join('') || '<div class="p-8 text-center text-muted-theme text-xs opacity-80">Nenhum serviço disponível com este profissional para os parâmetros selecionados.</div>';
                })()}
                        </div>
                    ` : ''}
                </div>

                <!-- 4. Confirmar -->
                ${this.state.selectedServices.length > 0 ? `
                    <div class="pt-6 fade-in slide-in-up space-y-4">
                        <div class="p-4 card-bg border border-theme rounded-xl flex justify-between items-center shadow-lg border-l-4 border-l-amber-500">
                            <div>
                                <p class="text-muted-theme text-sm">Resumo da Visita</p>
                                <p class="text-xs text-muted-theme flex items-center gap-1 mt-0.5"><i data-lucide="clock" class="w-3 h-3"></i> Total de ${this.state.selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0)} min</p>
                            </div>
                            <div class="text-right">
                                ${this.state.selectedServices.some(s => s.price_variable) ? '<p class="text-[9px] text-amber-500 font-black uppercase tracking-widest italic leading-none mb-1">A partir de</p>' : ''}
                                <span class="text-xl font-bold text-amber-500">R$ ${this.state.selectedServices.reduce((sum, s) => sum + s.priceValue, 0).toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>

                        ${this.state.isStaffBooking ? `
                            <div class="p-4 card-bg border border-theme rounded-xl space-y-4 shadow-lg border-l-4 ${this.state.staffBookingMode === 'registered' ? 'border-l-amber-500/50' : 'border-l-emerald-500/50'}">
                                
                                ${this.state.staffBookingMode === 'registered' ? `
                                    <p class="text-[10px] text-amber-500 font-bold uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                        <i data-lucide="user-check" class="w-3 h-3"></i> Cliente Cadastrado
                                    </p>

                                    ${this.state.staffSelectedClient ? `
                                        <!-- Cliente já selecionado: mostra card de confirmação -->
                                        <div class="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                            <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-zinc-700 flex items-center justify-center border-2 border-amber-500/30">
                                                ${this.state.staffSelectedClient.avatar
                                ? `<img src="${this.state.staffSelectedClient.avatar}" class="w-full h-full object-cover" />`
                                : `<span class="text-base font-black text-amber-500/70">${(this.state.staffSelectedClient.name?.[0] || 'C').toUpperCase()}</span>`
                            }
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <p class="font-bold text-theme text-sm truncate">${App.escapeHTML(this.state.staffSelectedClient.name)}</p>
                                                <p class="text-[11px] text-muted-theme truncate">${App.escapeHTML(App.formatDisplayPhone(this.state.staffSelectedClient.phone) || 'Sem telefone')}</p>
                                            </div>
                                            <button onclick="App.clearStaffClient()" class="flex-shrink-0 p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors" title="Trocar cliente">
                                                <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-muted-theme"></i>
                                            </button>
                                        </div>
                                    ` : `
                                        <!-- Busca de cliente -->
                                        <div class="relative">
                                            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-theme pointer-events-none"></i>
                                            <input 
                                                type="text" 
                                                id="staff-client-search-input"
                                                placeholder="Buscar por nome ou telefone..." 
                                                class="w-full input-bg border border-zinc-700 rounded-xl p-3 pl-9 text-theme focus:border-amber-500 outline-none transition-colors text-sm"
                                                oninput="App.searchStaffClients(this.value)"
                                                autocomplete="off"
                                            />
                                        </div>
                                        <div id="staff-client-search-results" class="max-h-48 overflow-y-auto rounded-xl bg-zinc-800/50 border border-zinc-700/50 divide-y divide-zinc-700/30">
                                            <p class="text-[11px] text-zinc-600 text-center py-3">Digite ao menos 2 caracteres para buscar.</p>
                                        </div>
                                    `}
                                ` : `
                                    <!-- Modo Walk-in: inputs manuais -->
                                    <p class="text-[10px] text-emerald-500 font-bold uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                        <i data-lucide="user-plus" class="w-3 h-3"></i> Dados do Cliente (Walk-in)
                                    </p>
                                    <div class="space-y-3">
                                        <input type="text" id="client-name-manual" placeholder="Nome do Cliente" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors text-sm" />
                                        <input type="tel" id="client-phone-manual" inputmode="numeric" placeholder="Telefone (Opcional)" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors text-sm" />
                                    </div>
                                    <p class="text-[9px] text-muted-theme pl-1">Deixe em branco para usar "Cliente Avulso".</p>
                                `}
                            </div>
                        ` : ''}

                        <button onclick="App.confirmBooking()" class="w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md shadow-amber-500/20">
                            Confirmar Agendamento
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderAppointmentCard(apt) {
        if (!apt) return '';
        const clientInitial = (apt.clientName?.[0] || 'C').toUpperCase();
        const isExpanded = this.state.expandedAppointmentId === apt.id || this.state.openAppointmentModalId === apt.id;
        const isDone = apt.status === 'completed';

        return `
            <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm border-l-4 ${isDone ? 'border-l-zinc-500 opacity-75' : 'border-l-amber-500'}">
                <div class="flex justify-between items-start gap-3 cursor-pointer" onclick="if(event.target.closest('button') || event.target.closest('input') || event.target.closest('select')) return; App.toggleAppointmentAccordion('${apt.id}')">
                    <!-- Avatar do Cliente -->
                    <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-theme flex items-center justify-center input-bg shadow-inner">
                        ${apt.clientAvatar ? `
                            <img src="${apt.clientAvatar}" class="w-full h-full object-cover" />
                        ` : `
                            <span class="text-lg font-black text-amber-500/50">${clientInitial}</span>
                        `}
                    </div>

                    <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-theme text-lg truncate">${App.escapeHTML(apt.clientName)}</h3>
                        <div class="flex flex-wrap gap-1.5 mt-1.5">
                            ${this.state.editingServicesId === apt.id ? `
                                <div class="w-full input-bg border border-amber-500/30 rounded-xl p-3 flex flex-col gap-3 fade-in shadow-inner">
                                    <div class="flex flex-wrap gap-1.5">
                                        ${SERVICES.filter(s => {
                                            const specialties = (this.state.barberServices || []).filter(bs => String(bs.barber_id) === String(apt.barber_id)).map(bs => bs.service_id);
                                            return specialties.length === 0 || specialties.includes(s.id);
                                        }).map(s => {
                                            const isSelected = (this.state.tempSelectedServices || []).some(ts => ts.id === s.id);
                                            return `
                                                <button onclick="App.toggleEditService(${s.id})" class="px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${isSelected ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'input-bg text-muted-theme border border-theme hover:border-amber-500/30'}">
                                                    ${s.name}
                                                </button>
                                            `;
                                        }).join('')}
                                    </div>
                                    <div class="flex gap-2">
                                        <button onclick="App.updateAppointmentServices('${apt.id}')" class="flex-1 py-1.5 bg-amber-500 text-zinc-950 rounded-lg text-[10px] font-black uppercase shadow-sm active:scale-95">Salvar</button>
                                        <button onclick="App.cancelEditServices()" class="flex-1 py-1.5 input-bg text-muted-theme rounded-lg text-[10px] font-bold uppercase border border-theme active:scale-95">X</button>
                                    </div>
                                </div>
                            ` : `
                                <button onclick="App.initEditServices('${apt.id}')" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20 hover:bg-amber-500/20 transition-all" title="Editar Serviço(s)">
                                    <i data-lucide="scissors" class="w-3 h-3"></i> ${apt.service?.name || 'Serviço'}
                                </button>
                            `}

                            ${this.state.editingPriceId === apt.id ? `
                                <div class="flex items-center gap-1 fade-in">
                                    <div class="relative">
                                        <span class="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-emerald-500 font-bold">R$</span>
                                        <input type="text" id="adj-price-${apt.id}" value="${apt.numericValue?.toFixed(2).replace('.', ',') || '0,00'}" class="w-20 input-bg border border-emerald-500 rounded pl-6 pr-1 py-0.5 text-[10px] text-emerald-500 font-bold outline-none" inputmode="decimal" />
                                    </div>
                                    <button onclick="App.updateAppointmentPrice('${apt.id}', document.getElementById('adj-price-${apt.id}').value)" class="p-1 bg-emerald-500 text-zinc-950 rounded hover:bg-emerald-400">
                                        <i data-lucide="check" class="w-3 h-3"></i>
                                    </button>
                                    <button onclick="App.cancelEditPrice()" class="p-1 input-bg text-muted-theme rounded border border-theme">
                                        <i data-lucide="x" class="w-3 h-3"></i>
                                    </button>
                                </div>
                            ` : `
                                <button onclick="App.initEditPrice('${apt.id}')" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20 hover:bg-emerald-500/20 transition-all" title="Editar Valor">
                                    <i data-lucide="dollar-sign" class="w-3 h-3"></i> ${apt.service?.price?.replace('A partir de', '<span class="text-amber-500 mr-0.5 italic">A partir de</span>') || 'R$ 0,00'}
                                </button>
                            `}
                            
                            <!-- Badge de Duração (Editável) -->
                            ${this.state.editingDurationId === apt.id ? `
                                <div class="flex items-center gap-1 fade-in">
                                    <div class="relative">
                                        <input type="number" id="adj-dur-${apt.id}" value="${apt.total_duration || 30}" class="w-16 input-bg border border-amber-500 rounded px-1 py-0.5 text-[10px] text-amber-500 font-bold outline-none" step="5" />
                                    </div>
                                    <button onclick="App.updateAppointmentDuration('${apt.id}', document.getElementById('adj-dur-${apt.id}').value)" class="p-1 bg-amber-500 text-zinc-950 rounded hover:bg-amber-400">
                                        <i data-lucide="check" class="w-3 h-3"></i>
                                    </button>
                                    <button onclick="App.cancelEditDuration()" class="p-1 input-bg text-muted-theme rounded border border-theme">
                                        <i data-lucide="x" class="w-3 h-3"></i>
                                    </button>
                                </div>
                            ` : `
                                <button onclick="App.initEditDuration('${apt.id}')" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md input-bg text-muted-theme text-[10px] font-bold uppercase tracking-wider border border-theme hover:border-amber-500/30 transition-all" title="Editar Duração">
                                    <i data-lucide="clock" class="w-3 h-3 text-amber-500"></i> ${apt.total_duration || 30} MIN
                                </button>
                            `}
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                        ${this.state.editingTimeId === apt.id ? `
                            <div class="flex flex-col items-end gap-1 fade-in">
                                <select id="adj-time-${apt.id}" class="input-bg border border-amber-500 rounded px-1 text-sm text-amber-500 font-bold outline-none leading-none h-8">
                                    ${AVAILABLE_TIMES.map(t => `<option value="${t}" ${apt.time === t ? 'selected' : ''}>${t}</option>`).join('')}
                                </select>
                                <div class="flex gap-1">
                                    <button onclick="App.updateAppointmentTime('${apt.id}', document.getElementById('adj-time-${apt.id}').value)" class="p-1 bg-amber-500 text-zinc-950 rounded hover:bg-amber-400 shadow-sm">
                                        <i data-lucide="check" class="w-3 h-3"></i>
                                    </button>
                                    <button onclick="App.cancelEditTime()" class="p-1 input-bg text-muted-theme rounded hover:bg-zinc-700 shadow-sm border border-theme">
                                        <i data-lucide="x" class="w-3 h-3"></i>
                                    </button>
                                </div>
                            </div>
                        ` : `
                            <button onclick="App.initEditTime('${apt.id}')" class="text-amber-500 font-black text-xl flex items-center gap-1 justify-end italic leading-none hover:scale-105 transition-transform active:scale-95" title="Alterar Horário">
                                ${apt.time}
                            </button>
                        `}
                        <span class="text-[9px] text-muted-theme font-bold uppercase tracking-tighter mt-1 block">${apt.date?.split('-').reverse().join('/') || ''}</span>
                    </div>
                </div>
                <div class="accordion-content ${isExpanded ? 'open' : ''}">
                    <!-- Ações Rápidas -->
                    <div class="flex gap-2 mt-4 pt-4 border-t border-theme overflow-x-auto scrollbar-hide">
                        <a href="${'https://wa.me/' + App.formatWA(apt.clientPhone) + '?text=' + encodeURIComponent('Olá ' + (apt.clientName || '') + ', passando para lembrar do seu horário às ' + (apt.time || '') + ' no dia ' + (apt.date?.split('-').reverse().join('/') || '') + ' na ' + (App.state.shopSettings?.name || 'Finno Trato Barbearia') + ' com ' + (apt.barberName || 'Profissional') + '. Aguardamos você.')}" target="_blank" class="flex-shrink-0 flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-xs font-semibold">
                            <i data-lucide="bell-ring" class="w-3.5 h-3.5"></i> Lembrete
                        </a>
                        <a href="https://wa.me/${App.formatWA(apt.clientPhone)}" target="_blank" class="flex-shrink-0 flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 input-bg text-muted-theme hover:text-theme border border-theme transition-colors text-xs font-semibold">
                            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> Mensagem
                        </a>
                        <a href="tel:+55${apt.clientPhone}" class="flex-shrink-0 flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 input-bg text-muted-theme hover:text-theme border border-theme transition-colors text-xs font-semibold">
                            <i data-lucide="phone" class="w-3.5 h-3.5"></i> Ligar
                        </a>
                        <button onclick="App.cancelAppointment('${apt.id}')" class="flex-shrink-0 flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all text-xs font-bold active:scale-95">
                            <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Cancelar
                        </button>
                    </div>
                    
                    <!-- Comanda (Barbeiro) -->
                    <div class="mt-4 pt-4 border-t border-theme">
                        <div class="flex justify-between items-center mb-3">
                            <p class="text-xs font-semibold text-muted-theme uppercase tracking-wide flex items-center gap-1.5">
                                <i data-lucide="shopping-bag" class="w-3 h-3 text-amber-500"></i> Comanda
                            </p>
                            <button onclick="App.openComandaModal('${apt.id}')" class="text-[10px] bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-2 py-1 rounded font-bold uppercase transition-colors">
                                + Adicionar
                            </button>
                        </div>
                        ${(!apt.comanda_items || apt.comanda_items.length === 0) ? `
                            <p class="text-[10px] text-muted-theme/50 italic">Nenhum item na comanda.</p>
                        ` : `
                            <div class="space-y-2">
                                ${(apt.comanda_items || []).map((item, idx) => `
                                    <div class="flex justify-between items-center input-bg p-2 rounded-lg border border-theme">
                                        <div class="flex items-center gap-2">
                                            <span class="text-amber-500 font-bold text-xs">${item.qty}x</span>
                                            <span class="text-theme text-xs font-medium">${item.name}</span>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <span class="text-emerald-500 text-xs font-bold">R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
                                            <button onclick="App.removeComandaItem('${apt.id}', ${idx})" class="text-red-500 hover:text-red-400 p-1">
                                                <i data-lucide="trash-2" class="w-3 h-3"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>

                    <div class="mt-4 pt-4 border-t border-theme">
                        ${isDone ? `
                        <div class="flex items-center justify-center gap-2 py-3 bg-zinc-500/10 border border-zinc-500/20 rounded-xl">
                            <i data-lucide="check-circle-2" class="w-4 h-4 text-zinc-400"></i>
                            <p class="text-sm font-bold text-zinc-400">Atendimento Concluído</p>
                        </div>
                        ` : `
                        <p class="text-xs font-semibold text-muted-theme mb-2 uppercase tracking-wide">Como o cliente pagou?</p>
                        ${this.state.confirmingPaymentId === apt.id ? `
                            <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex flex-col items-center gap-3 fade-in">
                                <p class="text-sm font-medium text-amber-500">Confirmar <span class="font-bold uppercase">${this.state.confirmingPaymentMethod}</span>?</p>
                                <div class="flex gap-2 w-full">
                                    <button onclick="App.cancelCompleteAppointment()" class="flex-1 py-2 rounded-lg font-medium transition-all duration-200 input-bg text-theme hover:bg-zinc-700 text-xs border border-theme active:scale-[0.98]">
                                        Cancelar
                                    </button>
                                    <button onclick="App.completeAppointment()" class="flex-1 py-2 rounded-lg font-bold transition-all duration-200 bg-amber-500 text-zinc-950 hover:bg-amber-400 text-xs shadow-md shadow-amber-500/20 active:scale-[0.98]">
                                        Finalizar
                                    </button>
                                </div>
                            </div>
                        ` : `
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="App.initCompleteAppointment('${apt.id}', 'Dinheiro')" class="py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-theme hover-bg border border-theme text-xs active:scale-[0.98]">
                                <i data-lucide="banknote" class="w-4 h-4 text-emerald-500"></i> Dinheiro
                            </button>
                            <button onclick="App.initCompleteAppointment('${apt.id}', 'Pix')" class="py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-theme hover-bg border border-theme text-xs active:scale-[0.98]">
                                <i data-lucide="zap" class="w-4 h-4 text-teal-400"></i> Pix
                            </button>
                            <button onclick="App.initCompleteAppointment('${apt.id}', 'Débito')" class="py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-theme hover-bg border border-theme text-xs active:scale-[0.98]">
                                <i data-lucide="credit-card" class="w-4 h-4 text-blue-400"></i> Débito
                            </button>
                            <button onclick="App.initCompleteAppointment('${apt.id}', 'Crédito')" class="py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-theme hover-bg border border-theme text-xs active:scale-[0.98]">
                                <i data-lucide="credit-card" class="w-4 h-4 text-amber-500"></i> Crédito
                            </button>
                        </div>
                        <button onclick="App.initSplitPayment('${apt.id}')" class="w-full mt-2 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-muted-theme hover-bg border border-theme text-xs active:scale-[0.98]">
                            <i data-lucide="layers" class="w-4 h-4 text-purple-400"></i> Pagamento Dividido
                        </button>
                        `}
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    renderDailyTable(filteredApts, dateStr) {
        const targetDate = new Date(dateStr + 'T12:00:00');
        const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const dayName = daysOfWeek[targetDate.getDay()].split('-')[0];
        const dateFmt = dateStr.split('-').reverse().join('/').slice(0, 5);

        // Pegar horário de funcionamento por dia da semana (usa day_schedules se disponível)
        const dow = new Date(dateStr + 'T12:00:00').getDay();
        const activeConfigs = (this.state.barberConfigs || []);

        const workingConfigsToday = activeConfigs.map(cfg => {
            const dayCfg = (cfg.day_schedules || {})[dow] || {};
            if (dayCfg.closed) return null;
            return {
                barber_id:       cfg.barber_id,
                todayStart:      dayCfg.start       || cfg.work_start  || '09:00',
                todayEnd:        dayCfg.end         || cfg.work_end    || '18:00',
                todayLunchStart: dayCfg.lunch_start || cfg.lunch_start || null,
                todayLunchEnd:   dayCfg.lunch_end   || cfg.lunch_end   || null,
            };
        }).filter(Boolean);

        let gridStart = '09:00';
        let gridEnd = '18:00';
        if (workingConfigsToday.length > 0) {
            const allStarts = workingConfigsToday.map(c => c.todayStart).filter(Boolean).sort();
            const allEnds   = workingConfigsToday.map(c => c.todayEnd).filter(Boolean).sort();
            if (allStarts.length > 0) gridStart = allStarts[0];
            if (allEnds.length > 0)   gridEnd   = allEnds[allEnds.length - 1];
        } else if (activeConfigs.length > 0) {
            const allStarts = activeConfigs.map(c => c.work_start).filter(Boolean).sort();
            const allEnds   = activeConfigs.map(c => c.work_end).filter(Boolean).sort();
            if (allStarts.length > 0) gridStart = allStarts[0];
            if (allEnds.length > 0)   gridEnd   = allEnds[allEnds.length - 1];
        }
        let minMin = parseInt(gridStart.split(':')[0]) * 60 + parseInt(gridStart.split(':')[1] || 0);
        let maxMin = parseInt(gridEnd.split(':')[0]) * 60 + parseInt(gridEnd.split(':')[1] || 0);
        const lunchApts = [];
        workingConfigsToday.forEach(cfg => {
            const bInfo = (typeof BARBERS !== 'undefined' ? BARBERS : []).find(b => String(b.id) === String(cfg.barber_id) || String(b.user_id) === String(cfg.barber_id));
            if (!bInfo) return;
            const lStart = cfg.todayLunchStart || '12:00';
            const lEnd = cfg.todayLunchEnd || '13:00';
            const [sh, sm] = lStart.split(':').map(Number);
            const [eh, em] = lEnd.split(':').map(Number);
            const dur = (eh * 60 + em) - (sh * 60 + sm);
            if (dur > 0) {
                lunchApts.push({
                    id: 'lunch-' + cfg.barber_id,
                    isLunch: true,
                    time: lStart,
                    total_duration: dur,
                    barberName: bInfo.name.split(' ')[0],
                    clientName: 'Almoço',
                    clientAvatar: null,
                    status: 'lunch',
                    services: [{name: 'Pausa'}]
                });
            }
        });
        const allGridItems = [...filteredApts, ...lunchApts];

        allGridItems.forEach(apt => {
            const [h, m] = apt.time.split(':').map(Number);
            const aptMin = h * 60 + m;
            let dur = parseInt(apt.total_duration) || 30;
            if (aptMin < minMin) minMin = Math.floor(aptMin/60)*60;
            if (aptMin + dur > maxMin) maxMin = Math.ceil((aptMin + dur)/60)*60 + 60;
        });

        const slots = [];
        for (let m = minMin; m < maxMin; m += 5) {
            const hh = String(Math.floor(m / 60)).padStart(2, '0');
            const mm = String(m % 60).padStart(2, '0');
            slots.push({ time: `${hh}:${mm}`, minutes: m, apts: [], isCovered: false });
        }

        let currentCoveredUntil = 0;
        slots.forEach(slot => {
            const aptsHere = allGridItems.filter(a => {
                const [h, m] = a.time.split(':').map(Number);
                return (h * 60 + m) === slot.minutes;
            });

            if (aptsHere.length > 0) {
                slot.apts = aptsHere;
                let maxDuration = 15;
                aptsHere.forEach(a => {
                    let dur = parseInt(a.total_duration) || 30;
                    if (dur > maxDuration) maxDuration = dur;
                });
                currentCoveredUntil = Math.max(currentCoveredUntil, slot.minutes + maxDuration);
            } else {
                if (slot.minutes < currentCoveredUntil) {
                    slot.isCovered = true;
                }
            }
        });

        return `
            <div class="space-y-4 fade-in slide-in-up flex flex-col h-full min-h-[70vh]">
                <div class="flex items-center justify-between card-bg p-3 rounded-2xl border border-theme shadow-sm shrink-0">
                    <button onclick="App.prevAgendaDay()" class="w-10 h-10 flex items-center justify-center rounded-xl input-bg border border-theme text-muted-theme hover:text-theme transition-colors active:scale-95">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    </button>
                    <div class="text-center flex-1 cursor-pointer select-none" onclick="document.getElementById('agenda-date-picker').showPicker()">
                        <h2 class="text-lg font-black text-theme uppercase tracking-wider">${dayName}</h2>
                        <p class="text-xs text-amber-500 font-bold">${dateFmt}</p>
                        <input type="date" id="agenda-date-picker" class="opacity-0 absolute w-0 h-0" value="${dateStr}" onchange="App.setAgendaDay(this.value)">
                    </div>
                    <button onclick="App.nextAgendaDay()" class="w-10 h-10 flex items-center justify-center rounded-xl input-bg border border-theme text-muted-theme hover:text-theme transition-colors active:scale-95">
                        <i data-lucide="arrow-right" class="w-5 h-5"></i>
                    </button>
                </div>

                <div class="flex justify-between items-center shrink-0">
                    <h3 class="text-xl font-bold text-theme">Grade Horária</h3>
                    <div class="flex items-center gap-2">
                        <button onclick="App.toggleQuickBlock()" class="text-xs text-orange-400 input-bg hover:bg-orange-500/10 px-3 py-1.5 rounded-lg font-bold uppercase transition-colors flex items-center gap-1.5 border border-theme hover:border-orange-500/30">
                            <i data-lucide="lock" class="w-3.5 h-3.5"></i> Bloquear
                        </button>
                        <button onclick="App.setAgendaViewMode('list')" class="text-xs text-muted-theme input-bg px-3 py-1.5 rounded-lg font-bold uppercase transition-colors flex items-center gap-1.5 border border-theme">
                            <i data-lucide="list" class="w-3.5 h-3.5"></i> Lista
                        </button>
                    </div>
                </div>

                <div id="grid-scroll-container" data-grid-start="${gridStart}" class="flex-1 overflow-y-auto custom-scrollbar rounded-2xl border border-theme shadow-md relative pb-20" style="background: var(--bg-app)">
                    ${(() => {
                        const blockedOnDate = new Set(
                            (this.state.blockedTimesFull || [])
                                .filter(b => b.date === dateStr)
                                .map(b => b.blocked_time)
                        );
                        return slots.map(slot => {
                        const isHour = slot.time.endsWith('00');
                        const isBlocked = blockedOnDate.has(slot.time);
                        return `
                        <div class="flex h-[20px] relative group ${isBlocked ? 'bg-orange-500/5' : ''}" style="border-bottom: 1px solid ${isHour ? 'var(--border-main)' : 'color-mix(in srgb, var(--border-main) 30%, transparent)'}">
                            <div class="w-16 shrink-0 flex items-center justify-center text-[10px] font-bold ${isHour ? `${isBlocked ? 'text-orange-400/70' : 'text-theme'}` : `${isBlocked ? 'text-orange-500/40' : 'text-muted-theme'} opacity-60`}" style="border-right: 1px solid ${isBlocked ? 'rgba(249,115,22,0.2)' : 'color-mix(in srgb, var(--border-main) 30%, transparent)'}; background: ${isHour ? 'var(--bg-card)' : 'transparent'}">
                                ${isBlocked && isHour ? '<i data-lucide="lock" class="w-2.5 h-2.5"></i>' : slot.time}
                            </div>

                            <div class="flex-1 relative">
                                ${isBlocked && isHour ? `
                                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                        <i data-lucide="lock" class="w-3 h-3 text-orange-500/50"></i>
                                    </div>
                                ` : ''}
                                ${!slot.isCovered && !isBlocked ? `
                                    <button onclick="App.state.appointmentsFilterStart = '${dateStr}'; App.state.appointmentsFilterEnd = '${dateStr}'; App.startStaffBooking('${dateStr}', '${slot.time}')" class="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-amber-500/10 transition-all text-amber-500 z-0">
                                        <i data-lucide="plus" class="w-5 h-5"></i>
                                    </button>
                                ` : ''}

                                ${slot.apts.map((apt, index) => {
                                    let dur = parseInt(apt.total_duration) || 30;
                                    const spans = Math.ceil(dur / 5);
                                    const width = 100 / slot.apts.length;
                                    const left = index * width;
                                    const clientInitial = (apt.clientName && apt.clientName.length > 0 ? apt.clientName[0] : 'C').toUpperCase();
                                    
                                    if (apt.isLunch) {
                                        return `
                                            <div class="absolute top-[2px] bg-amber-500/25 border border-dashed border-amber-500/60 rounded-lg p-2 z-0 overflow-hidden flex flex-col items-center justify-center gap-1 cursor-default"
                                                 style="height: calc(${spans * 20}px - 4px); left: calc(${left}% + 4px); width: calc(${width}% - 8px);">
                                                <i data-lucide="coffee" class="w-4 h-4 text-amber-500/70"></i>
                                                <p class="text-[9px] font-black text-amber-500/80 uppercase">${apt.clientName}</p>
                                                <p class="text-[8px] font-bold text-amber-500/60">${apt.barberName}</p>
                                            </div>
                                        `;
                                    }
                                    const isDone = apt.status === 'completed';
                                    return `
                                        <div onclick="App.openAppointmentModal('${apt.id}')"
                                             class="absolute top-[2px] ${isDone ? 'bg-zinc-500/5 border border-zinc-500/30 border-l-zinc-500 opacity-75' : 'card-bg border border-amber-500/50 border-l-amber-500 hover:border-amber-500 hover:-translate-y-0.5'} border-l-[3px] rounded-lg p-2 shadow-sm cursor-pointer transition-colors z-10 overflow-hidden flex flex-col gap-1"
                                             style="height: calc(${spans * 20}px - 4px); left: calc(${left}% + 4px); width: calc(${width}% - 8px);">

                                            <div class="flex items-center gap-1.5">
                                                <div class="w-6 h-6 rounded-full overflow-hidden shrink-0 ${isDone ? 'bg-zinc-500/10 border border-zinc-500/20' : 'input-bg border border-theme'} flex items-center justify-center">
                                                    ${apt.clientAvatar ? `<img src="${apt.clientAvatar}" class="w-full h-full object-cover">` : `<span class="w-full h-full flex items-center justify-center ${isDone ? 'text-zinc-400' : 'text-amber-500'} text-[9px] font-black">${clientInitial}</span>`}
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <p class="text-xs font-black ${isDone ? 'text-muted-theme' : 'text-theme'} truncate leading-none">${App.escapeHTML(apt.clientName)}</p>
                                                    <p class="text-[9px] text-muted-theme truncate leading-tight mt-0.5">${apt.services?.map(s => s.name).join(', ') || apt.service?.name || 'Serviço'}</p>
                                                </div>
                                                ${isDone ? '<i data-lucide="check-circle-2" class="w-3 h-3 text-zinc-400 flex-shrink-0"></i>' : ''}
                                            </div>

                                            ${spans > 2 ? `
                                            <div class="mt-auto flex items-center justify-between text-[8px] font-bold text-muted-theme">
                                                <span>${apt.time}</span>
                                                ${apt.barberName ? `<span class="truncate max-w-[80px] text-right"><i data-lucide="scissors" class="w-2.5 h-2.5 inline-block -mt-0.5"></i> ${apt.barberName}</span>` : ''}
                                            </div>
                                            ` : ''}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        `;
                    }).join('');
                    })()}
                </div>
            </div>
        `;
    },

    renderAgendamentos() {
        if (this.state.isBooking) {
            return this.renderBookingFlow();
        }
        if (['admin', 'manager', 'barber'].includes(this.state.role)) {
            const todayObj = new Date();
            const year = todayObj.getFullYear();
            const monthStr = String(todayObj.getMonth() + 1).padStart(2, '0');
            const dateStr = String(todayObj.getDate()).padStart(2, '0');
            const dayOfWeek = todayObj.getDay();

            const todayFormatted = `${year}-${monthStr}-${dateStr}`;
            const thisMonthFormatted = `${year}-${monthStr}`;

            const startOfWeek = new Date(todayObj);
            startOfWeek.setDate(todayObj.getDate() - dayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0);

            let filteredApts = this.state.appointments;

            if (this.state.appointmentsFilter === 'day') {
                filteredApts = filteredApts.filter(a => a.date === todayFormatted);
            } else if (this.state.appointmentsFilter === 'custom' && this.state.appointmentsFilterStart && this.state.appointmentsFilterEnd) {
                const sDate = this.state.appointmentsFilterStart;
                const eDate = this.state.appointmentsFilterEnd;
                filteredApts = filteredApts.filter(a => a.date >= sDate && a.date <= eDate);
            }

            if (this.state.agendaViewMode === 'table') {
                setTimeout(() => {
                    const mc = document.getElementById('modal-container');
                    if (mc && this.state.openAppointmentModalId && !this.state.showingSplitPaymentId && !this.state.comandaModalOpen) {
                        const apt = this.state.appointments.find(a => a.id === this.state.openAppointmentModalId);
                        if (apt) {
                            mc.innerHTML = `
                                <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 fade-in" onclick="if(event.target === this) App.closeAppointmentModal()">
                                    <div class="w-full max-w-md max-h-[90vh] flex flex-col gap-2 relative">
                                        <div class="flex justify-end">
                                            <button onclick="App.closeAppointmentModal()" class="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 text-muted-theme hover:text-red-500 hover:bg-red-500/10 border border-theme transition-colors shadow-2xl">
                                                <i data-lucide="x" class="w-5 h-5"></i>
                                            </button>
                                        </div>
                                        <div class="overflow-y-auto custom-scrollbar">
                                            ${this.renderAppointmentCard(apt)}
                                        </div>
                                    </div>
                                </div>
                            `;
                            if (window.lucide) lucide.createIcons({ root: mc });
                        }
                    } else if (mc && this.state.isQuickBlockOpen) {
                        const qbDate = this.state.agendaSelectedDate;
                        const dateFmt = qbDate.split('-').reverse().join('/').slice(0, 5);

                        // Bloqueios ativos no dia, agrupados por barbeiro
                        const blocksToday = (this.state.blockedTimesFull || []).filter(b => b.date === qbDate && b.barber_id);
                        const blocksByBarber = blocksToday.reduce((acc, b) => {
                            if (!acc[b.barber_id]) acc[b.barber_id] = [];
                            acc[b.barber_id].push(b.blocked_time);
                            return acc;
                        }, {});
                        const activeBlocksHtml = Object.keys(blocksByBarber).length === 0
                            ? '<p class="text-[11px] text-muted-theme italic text-center py-1">Nenhum bloqueio neste dia.</p>'
                            : Object.entries(blocksByBarber).map(([bid, times]) => {
                                const barber = BARBERS.find(b => b.user_id === bid);
                                const name = barber ? App.escapeHTML(barber.name.split(' ')[0]) : 'Barbeiro';
                                const sorted = times.slice().sort();
                                const first = sorted[0];
                                const [lh, lm] = sorted[sorted.length - 1].split(':').map(Number);
                                const endMin = lh * 60 + lm + 5;
                                const endTime = String(Math.floor(endMin / 60)).padStart(2, '0') + ':' + String(endMin % 60).padStart(2, '0');
                                return `
                                    <div class="flex items-center justify-between p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                                        <div class="flex items-center gap-2.5 min-w-0">
                                            <i data-lucide="lock" class="w-3.5 h-3.5 text-orange-400 shrink-0"></i>
                                            <div class="min-w-0">
                                                <p class="text-xs font-black text-theme truncate">${name}</p>
                                                <p class="text-[10px] text-orange-400/80 font-bold">${first} – ${endTime}</p>
                                            </div>
                                        </div>
                                        <button onclick="App.removeTimeBlockWindow('${bid}', '${qbDate}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-theme hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                        </button>
                                    </div>
                                `;
                            }).join('');

                        mc.innerHTML = `
                            <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 fade-in" onclick="if(event.target===this) App.toggleQuickBlock()">
                                <div class="w-full max-w-sm card-bg rounded-3xl border border-theme shadow-2xl overflow-hidden scale-in">
                                    <div class="bg-zinc-900/50 p-5 border-b border-theme flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                                <i data-lucide="lock" class="w-5 h-5 text-orange-400"></i>
                                            </div>
                                            <div>
                                                <h2 class="text-base font-black text-theme">Bloqueio Rápido</h2>
                                                <p class="text-[11px] text-orange-400 font-bold">${dateFmt}</p>
                                            </div>
                                        </div>
                                        <button onclick="App.toggleQuickBlock()" class="w-9 h-9 flex items-center justify-center rounded-xl input-bg text-muted-theme hover:text-red-400 transition-colors border border-theme">
                                            <i data-lucide="x" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                    <div class="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                        <!-- Bloqueios ativos -->
                                        ${Object.keys(blocksByBarber).length > 0 ? `
                                        <div class="space-y-2">
                                            <p class="text-[10px] text-muted-theme uppercase font-black tracking-widest">Bloqueios Ativos</p>
                                            ${activeBlocksHtml}
                                        </div>
                                        <div class="border-t border-theme/50"></div>
                                        ` : ''}

                                        <!-- Criar novo bloqueio -->
                                        <p class="text-[10px] text-muted-theme uppercase font-black tracking-widest">Novo Bloqueio</p>
                                        <div class="space-y-1.5">
                                            <label class="text-[10px] text-muted-theme uppercase font-black tracking-widest">Barbeiro</label>
                                            <select id="qb-barber" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-orange-400 outline-none text-sm">
                                                <option value="all">Todos os Barbeiros</option>
                                                ${BARBERS.map(b => `<option value="${b.user_id}">${App.escapeHTML(b.name)}</option>`).join('')}
                                            </select>
                                        </div>
                                        <div class="grid grid-cols-2 gap-3">
                                            <div class="space-y-1.5">
                                                <label class="text-[10px] text-muted-theme uppercase font-black tracking-widest">De</label>
                                                <input type="time" id="qb-start" value="12:00" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-orange-400 outline-none text-sm font-bold" />
                                            </div>
                                            <div class="space-y-1.5">
                                                <label class="text-[10px] text-muted-theme uppercase font-black tracking-widest">Até</label>
                                                <input type="time" id="qb-end" value="14:00" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-orange-400 outline-none text-sm font-bold" />
                                            </div>
                                        </div>
                                        <button onclick="App.quickBlockTimeWindow()" class="w-full py-3.5 rounded-xl bg-orange-500 text-zinc-950 font-black text-sm uppercase tracking-widest hover:bg-orange-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
                                            <i data-lucide="lock" class="w-4 h-4"></i> Bloquear Horário
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                        if (window.lucide) lucide.createIcons({ root: mc });
                    } else if (mc && !this.state.isDateRangeModalOpen && !this.state.comandaModalOpen && !this.state.showingSplitPaymentId && !this.state.isQuickBlockOpen && !this.state.transactionDetailId) {
                        mc.innerHTML = '';
                    }
                    const gc = document.getElementById('grid-scroll-container');
                    if (gc) {
                        const viewDate = this.state.agendaSelectedDate;
                        if (this.state._gridLastScrolledDate !== viewDate) {
                            const gs = gc.dataset.gridStart || '09:00';
                            const [startH, startM] = gs.split(':').map(Number);
                            const now = new Date();
                            const viewingToday = viewDate === todayFormatted;
                            const targetMin = viewingToday
                                ? now.getHours() * 60 + now.getMinutes()
                                : startH * 60 + startM;
                            gc.scrollTop = Math.max(0, (targetMin - (startH * 60 + startM)) * 4 - 80);
                            this.state._gridLastScrolledDate = viewDate;
                        }
                    }
                }, 0);
                return this.renderDailyTable(this.state.appointments.filter(a => a.date === this.state.agendaSelectedDate), this.state.agendaSelectedDate);
            }

            setTimeout(() => {
                const mc = document.getElementById('modal-container');
                if (mc) {
                    mc.innerHTML = this.state.isDateRangeModalOpen ? `
                        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 fade-in">
                            <div class="card-bg w-full max-w-sm rounded-3xl border border-theme shadow-2xl overflow-hidden scale-in">
                                <div class="input-bg p-6 border-b border-theme relative">
                                    <button onclick="App.toggleDateRangeModal()" class="absolute top-4 right-4 p-2 card-bg rounded-full text-muted-theme hover:text-red-500 transition-colors border border-theme">
                                        <i data-lucide="x" class="w-4 h-4"></i>
                                    </button>
                                    <div class="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
                                        <i data-lucide="calendar" class="w-6 h-6 text-amber-500"></i>
                                    </div>
                                    <h2 class="text-xl font-bold text-theme">Filtrar por Data</h2>
                                    <p class="text-sm text-muted-theme mt-1">Selecione o período desejado</p>
                                </div>
                                <div class="p-6 space-y-4">
                                    <div>
                                        <label class="block text-xs font-bold text-muted-theme uppercase tracking-wider mb-2">Data Inicial</label>
                                        <input type="date" id="apt-start-date" value="${this.state.appointmentsFilterStart || todayFormatted}" class="w-full input-bg border border-theme rounded-xl px-4 py-3 text-theme focus:border-amber-500 outline-none color-scheme-dark transition-colors" />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-muted-theme uppercase tracking-wider mb-2">Data Final</label>
                                        <input type="date" id="apt-end-date" value="${this.state.appointmentsFilterEnd || todayFormatted}" class="w-full input-bg border border-theme rounded-xl px-4 py-3 text-theme focus:border-amber-500 outline-none color-scheme-dark transition-colors" />
                                    </div>
                                    <button onclick="App.setCustomAppointmentsRange()" class="w-full mt-4 bg-amber-500 text-zinc-950 font-black py-4 rounded-xl uppercase tracking-widest hover:bg-amber-400 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20">
                                        Buscar Agendamentos
                                    </button>
                                </div>
                            </div>
                        </div>
                    ` : '';
                    if (this.state.isDateRangeModalOpen && window.lucide) {
                        lucide.createIcons({ root: mc });
                    }
                }
            }, 0);

            return `
                <div class="space-y-6 fade-in slide-in-up">
                    <div class="flex flex-col gap-4 mb-2">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-theme">Agenda</h2>
                            <div class="flex items-center gap-2">
                                <span class="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-medium">
                                    ${filteredApts.length} serviço(s)
                                </span>
                                <button onclick="App.setAgendaViewMode('table')" class="text-xs text-muted-theme input-bg hover-bg px-3 py-1.5 rounded-lg font-bold uppercase transition-colors flex items-center gap-1.5 border border-theme">
                                    <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i> Tabela
                                </button>
                            </div>
                        </div>
                        
                    </div>

                    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style="-ms-overflow-style: none; scrollbar-width: none;">
                            <button onclick="App.setAppointmentsFilter('day')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.appointmentsFilter === 'day' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Hoje</button>
                            <button onclick="App.toggleDateRangeModal()" class="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-colors ${this.state.appointmentsFilter === 'custom' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme border border-theme'}">
                                <i data-lucide="calendar" class="w-4 h-4"></i>
                            </button>
                            ${this.state.appointmentsFilter === 'custom' && this.state.appointmentsFilterStart && this.state.appointmentsFilterEnd ? `
                                <span class="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 whitespace-nowrap">
                                    ${this.state.appointmentsFilterStart.split('-').reverse().join('/')} até ${this.state.appointmentsFilterEnd.split('-').reverse().join('/')}
                                </span>
                            ` : ''}
                        </div>
                    </div>

                            ${filteredApts.length === 0 ? `
                                <div class="text-center py-12 text-muted-theme">
                                    <i data-lucide="calendar" class="w-16 h-16 mx-auto mb-4 opacity-40"></i>
                                    <p>Nenhum agendamento encontrado.</p>
                                </div>
                            ` : `
                                <div class="space-y-4">
                                    ${filteredApts.map(apt => this.renderAppointmentCard(apt)).join('')}
                                </div>
                            `}
                    <!-- Modal de pagamento dividido gerenciado via #modal-container em ui.js -->
                </div>

                <!-- Botão Flutuante de Agendamento Rápido (Apenas para Staff) -->
                ${['admin', 'manager', 'barber'].includes(this.state.role) ? `
                    <button onclick="App.startStaffBooking()" class="fixed bottom-24 right-6 w-14 h-14 bg-amber-500 text-zinc-950 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-40 border-4 border-zinc-950/20 group">
                        <i data-lucide="plus" class="w-8 h-8 group-hover:rotate-90 transition-transform duration-300"></i>
                    </button>
                ` : ''}
            `;
        }

        // Visão Cliente
        const clientApts = this.state.appointments;
        return `
                <div class="space-y-6 fade-in slide-in-up">
                    <div class="flex items-center justify-between">
                        <h2 class="text-2xl font-bold text-theme">Meu(s) Serviço(s)</h2>
                    </div>

                    ${this.state.userProfile?.is_paused ? `
                        <div class="card-bg border border-rose-500/30 rounded-2xl p-5 flex flex-col gap-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                                    <i data-lucide="pause-circle" class="w-5 h-5 text-rose-400"></i>
                                </div>
                                <div>
                                    <p class="font-bold text-theme text-sm">Conta temporariamente pausada</p>
                                    <p class="text-xs text-muted-theme mt-0.5">Novos agendamentos estão desabilitados. Entre em contato com a barbearia.</p>
                                </div>
                            </div>
                            <a href="https://wa.me/${(this.state.shopSettings?.whatsapp || '').replace(/\D/g, '')}" target="_blank" class="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20">
                                <i data-lucide="message-circle" class="w-5 h-5"></i> Falar com a Barbearia
                            </a>
                        </div>
                    ` : `
                        <button onclick="App.startBooking()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md shadow-amber-500/20">
                            <i data-lucide="calendar" class="w-5 h-5"></i> Novo Agendamento
                        </button>
                    `}

                    <div class="space-y-4 mt-8">
                        <h3 class="text-sm font-medium text-muted-theme uppercase tracking-wider">Próximos Agendamentos</h3>
                        ${clientApts.length === 0 ? `
                            <p class="text-muted-theme text-sm">Não tem nenhum agendamento futuro.</p>
                        ` : clientApts.map(apt => `
                            <div class="flex flex-col gap-2">
                                <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm flex items-center gap-4">
                                    <div class="input-bg p-3 rounded-xl text-amber-500 flex-shrink-0">
                                        <i data-lucide="scissors" class="w-6 h-6"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-theme">${apt.service.name} <span class="font-normal text-xs text-muted-theme">com ${apt.barberName || 'Marcos Barbeiro'}</span></h4>
                                        <p class="text-xs text-muted-theme flex items-center gap-1 mt-1">
                                            <i data-lucide="calendar" class="w-3 h-3"></i> ${apt.date.split('-').reverse().map((p, i) => i === 2 ? p.slice(-2) : p).join('/')} às ${apt.time}
                                        </p>
                                    </div>
                                    <div class="text-right flex-shrink-0 flex flex-col items-end gap-2">
                                        <p class="text-sm font-medium text-theme">${apt.service.price.replace('A partir de', '<span class="text-amber-500 font-bold italic">A partir de</span>')}</p>
                                        ${(apt.comanda_items && apt.comanda_items.length > 0) ? `
                                            <div class="text-[9px] text-amber-500 bg-amber-500/10 px-2 py-1.5 rounded-lg border border-amber-500/20 text-center font-bold leading-tight">
                                                <i data-lucide="lock" class="w-3 h-3 inline-block mb-0.5"></i> Bloqueado<br/>(Comanda Ativa)
                                            </div>
                                        ` : `
                                            <div class="flex gap-2">
                                                ${(() => {
                                                    if (this.state.role === 'client') {
                                                        const diffMs = new Date(`${apt.date}T${apt.time}:00`) - new Date();
                                                        if (diffMs > 0 && diffMs < 2 * 60 * 60 * 1000) return '';
                                                    }
                                                    return `<button onclick="App.editAppointment('${apt.id}')" class="p-2 input-bg text-amber-500 rounded-lg hover:bg-zinc-700 transition-colors border border-theme active:scale-95" title="Alterar Horário">
                                                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                                                    </button>`;
                                                })()}
                                                ${(() => {
                                                    const d = apt.date.replace(/-/g, '');
                                                    const parts = apt.time.split(':');
                                                    const startDt = d + 'T' + parts[0] + parts[1] + '00';
                                                    const dur = parseInt(apt.total_duration) || 30;
                                                    const endDate = new Date(new Date(apt.date + 'T' + apt.time + ':00').getTime() + dur * 60000);
                                                    const endDt = endDate.getFullYear() + '' + String(endDate.getMonth()+1).padStart(2,'0') + String(endDate.getDate()).padStart(2,'0') + 'T' + String(endDate.getHours()).padStart(2,'0') + String(endDate.getMinutes()).padStart(2,'0') + '00';
                                                    const shopName = (App.state.shopSettings && App.state.shopSettings.name) || 'Barbearia';
                                                    const svcName = (apt.services && apt.services.length > 0) ? apt.services.map(function(s){return s.name;}).join(', ') : (apt.service ? apt.service.name : 'Agendamento');
                                                    const title = encodeURIComponent(svcName + ' na ' + shopName);
                                                    const details = encodeURIComponent('Profissional: ' + (apt.barberName || '') + '\nEstabelecimento: ' + shopName);
                                                    const addr = (App.state.shopSettings && App.state.shopSettings.address_street) ? App.state.shopSettings.address_street + ', ' + (App.state.shopSettings.address_city || '') : '';
                                                    const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + title + '&dates=' + startDt + '/' + endDt + '&details=' + details + '&location=' + encodeURIComponent(addr) + '&ctz=America%2FSao_Paulo';
                                                    return '<a href="' + url + '" target="_blank" class="p-2 input-bg text-indigo-400 rounded-lg hover:bg-zinc-700 transition-colors border border-theme active:scale-95" title="Adicionar ao Google Calendar"><i data-lucide="calendar-plus" class="w-4 h-4"></i></a>';
                                                })()}
                                                <button onclick="App.cancelAppointment('${apt.id}')" class="p-2 input-bg text-rose-500 rounded-lg hover:bg-zinc-700 transition-colors border border-theme active:scale-95" title="Cancelar">
                                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                                </button>
                                            </div>
                                        `}
                                    </div>
                                </div>
                                
                                <!-- Comanda (Cliente) -->
                                <div class="card-bg rounded-2xl border border-theme p-3 shadow-sm">
                                    <div class="flex justify-between items-center mb-2">
                                        <h4 class="text-xs font-bold text-theme flex items-center gap-1.5"><i data-lucide="shopping-bag" class="w-3.5 h-3.5 text-amber-500"></i> Comanda</h4>
                                        <button onclick="App.openComandaModal('${apt.id}')" class="text-[10px] bg-amber-500 text-zinc-950 hover:bg-amber-400 px-2.5 py-1 rounded-md font-bold uppercase transition-colors shadow-sm active:scale-95">
                                            + Pedir Item
                                        </button>
                                    </div>
                                    ${(!apt.comanda_items || apt.comanda_items.length === 0) ? `
                                        <p class="text-[10px] text-muted-theme italic">Nenhum item adicionado.</p>
                                    ` : `
                                        <div class="space-y-1.5 mt-2">
                                            ${(apt.comanda_items || []).map(item => `
                                                <div class="flex justify-between items-center text-xs">
                                                    <span class="text-muted-theme"><span class="text-amber-500 font-bold">${item.qty}x</span> ${item.name}</span>
                                                    <span class="text-emerald-500 font-bold">R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    `}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
    },

    renderRelatorios() {
        if (this.state.reportsView === 'dashboard') {
            return this.renderAnalyticsDashboard();
        }

        if (this.state.productReportTab === 'products') {
            return this.renderProductsReport();
        }

        const todayObj = new Date();
        const year = todayObj.getFullYear();
        const month = String(todayObj.getMonth() + 1).padStart(2, '0');
        const date = String(todayObj.getDate()).padStart(2, '0');
        const dayOfWeek = todayObj.getDay(); // 0(Sun)-6(Sat)

        const todayStr = `${year}-${month}-${date}`;
        const thisMonthStr = `${year}-${month}`;

        // Start of week (Sunday)
        const startOfWeek = new Date(todayObj);
        startOfWeek.setDate(todayObj.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        let filteredTxs = this.state.completedTransactions.filter(tx => {
            const txDateObj = new Date(tx.completedAt);
            const _y = txDateObj.getFullYear();
            const _m = String(txDateObj.getMonth() + 1).padStart(2, '0');
            const _d = String(txDateObj.getDate()).padStart(2, '0');
            const txDateStr = `${_y}-${_m}-${_d}`;

            // 1. Filtro de Data
            let dateMatch = false;
            switch (this.state.reportsFilter) {
                case 'day': dateMatch = txDateStr === todayStr; break;
                case 'week': dateMatch = txDateObj >= startOfWeek && txDateObj <= todayObj; break;
                case 'month': dateMatch = txDateStr.startsWith(thisMonthStr); break;
                case 'year': dateMatch = txDateStr.startsWith(`${year}`); break;
                case 'custom':
                    if (this.state.reportsCustomStart && this.state.reportsCustomEnd) {
                        dateMatch = txDateStr >= this.state.reportsCustomStart && txDateStr <= this.state.reportsCustomEnd;
                    }
                    break;
                default: dateMatch = true;
            }

            if (!dateMatch) return false;

            // 2. Filtro de Método de Pagamento
            if (this.state.paymentMethodFilter !== 'all' && tx.paymentMethod !== this.state.paymentMethodFilter) {
                return false;
            }

            // 3. Filtro de Status de Pagamento (Sumir do relatório se quitado)
            // Se for barbeiro, o padrão é ver apenas o pendente.
            const showOnlyPending = this.state.paymentStatusFilter === 'pending';
            if (showOnlyPending && tx.isSettled) return false;

            return true;
        });

        const commissionRate = (this.state.shopSettings?.commission_rate || 100) / 100;
        const isBarber = this.state.role === 'barber';
        const periodTotalRaw = filteredTxs.reduce((sum, tx) => sum + tx.numericValue, 0);
        let periodTotal = isBarber ? (periodTotalRaw * commissionRate) : periodTotalRaw;

        let myAdvancesList = [];
        let myAdvancesTotal = 0;
        if (isBarber && this.state.paymentStatusFilter === 'pending') {
            const payouts = this.state.payouts || [];
            const myPayouts = payouts.filter(p => String(p.barber_id) === String(this.state.userProfile?.id));
            const lastFull = myPayouts.find(p => p.type === 'full');
            const lastFullTime = lastFull ? new Date(lastFull.payout_date).getTime() : 0;

            myAdvancesList = myPayouts.filter(p => p.type === 'advance' && new Date(p.payout_date).getTime() > lastFullTime);
            myAdvancesTotal = myAdvancesList.reduce((sum, p) => sum + Number(p.amount), 0);
            periodTotal = Math.max(0, periodTotal - myAdvancesTotal);
        }

        const filterLabels = {
            'day': 'Hoje', 'week': 'Na Semana', 'month': 'No Mês', 'year': 'No Ano', 'custom': 'No Período'
        };

        const activeLabel = filterLabels[this.state.reportsFilter];

        // Limit visually to 50 for performance
        const displayTxs = [...filteredTxs].reverse().slice(0, 50);

        let myAdvancesHtml = '';
        if (isBarber && this.state.paymentStatusFilter === 'all' && this.state.payouts) {
            const myPayouts = this.state.payouts.filter(p => String(p.barber_id) === String(this.state.userProfile?.id));
            if (myPayouts.length > 0) {
                myAdvancesHtml = myPayouts.map(p => `
                    <div class="card-bg rounded-xl border border-rose-500/30 p-3 shadow-md flex items-start justify-between gap-3 bg-rose-500/5">
                        <div class="flex items-start gap-3 min-w-0 flex-1">
                            <div class="input-bg bg-rose-500/10 p-2 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i data-lucide="hand-coins" class="w-5 h-5 text-rose-500"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="font-bold text-rose-500 text-sm truncate uppercase">${p.type === 'advance' ? 'Adiantamento (Vale)' : 'Quitação Total'}</p>
                                <div class="text-[10px] text-muted-theme mt-0.5 font-mono">${new Date(p.payout_date).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div class="text-right flex-shrink-0 flex flex-col items-end min-w-[75px] mt-0.5">
                            <p class="font-black text-rose-500 leading-none text-base">R$ ${Math.abs(Number(p.amount)).toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                `).join('');
            }
        }

        const isManagement = this.state.role === 'admin' || this.state.role === 'manager';
        const reportTitle = isManagement ? 'Balanço Global' : 'Meu Desempenho';
        const revenueLabel = isManagement ? 'Faturamento Total da Casa' : 'Minhas Entradas Totais';

        setTimeout(() => {
            const mc = document.getElementById('modal-container');
            if (!mc) return;
            if (this.state.transactionDetailId) {
                const tx = this.state.completedTransactions.find(t => t.id === this.state.transactionDetailId);
                if (tx) {
                    mc.innerHTML = this.renderTransactionDetailModal(tx, this.state.transactionDetailApt);
                    if (window.lucide) lucide.createIcons({ root: mc });
                }
            } else if (!this.state.isDateRangeModalOpen && !this.state.comandaModalOpen && !this.state.isQuickBlockOpen) {
                mc.innerHTML = '';
            }
        }, 0);

        return `
            <div class="space-y-6 fade-in">
                <!-- Tab: Financeiro | Produtos -->
                <div class="flex card-bg p-1 rounded-xl border border-theme">
                    <button onclick="App.setProductReportTab('financial')" class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all bg-amber-500 text-zinc-950">Financeiro</button>
                    <button onclick="App.setProductReportTab('products')" class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-muted-theme hover:text-theme">Produtos</button>
                </div>

                <!-- Header & View Toggle -->
                <div class="flex items-end justify-between mb-2">
                    <h2 class="text-2xl font-bold text-theme">${reportTitle}</h2>
                    <div class="flex items-center gap-2">
                        <button onclick="App.exportTransactionsToCSV()" class="p-2 rounded-lg card-bg border border-theme text-muted-theme hover:text-amber-500 hover:border-amber-500/30 transition-all active:scale-95" title="Exportar CSV">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </button>
                        <div class="flex card-bg p-1 rounded-lg border border-theme">
                            <button onclick="App.toggleReportsView('list')" class="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${this.state.reportsView === 'list' ? 'bg-amber-500 text-zinc-950' : 'text-muted-theme'}">Lista</button>
                            <button onclick="App.toggleReportsView('dashboard')" class="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${this.state.reportsView === 'dashboard' ? 'bg-amber-500 text-zinc-950' : 'text-muted-theme'}">Estratégico</button>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col gap-4">
                    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button onclick="App.setReportsFilter('day')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.reportsFilter === 'day' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Hoje</button>
                        <button onclick="App.setReportsFilter('week')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.reportsFilter === 'week' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Semana</button>
                        <button onclick="App.setReportsFilter('month')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.reportsFilter === 'month' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Mês</button>
                        <button onclick="App.setReportsFilter('year')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.reportsFilter === 'year' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Ano</button>
                        <button onclick="App.setReportsFilter('custom')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center ${this.state.reportsFilter === 'custom' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">
                            <i data-lucide="calendar-search" class="w-4 h-4"></i>
                        </button>
                    </div>

                    ${this.state.reportsFilter === 'custom' ? `
                        <div class="card-bg border border-theme p-3 rounded-xl flex gap-2 items-end fade-in">
                            <div class="flex-1">
                                <label class="text-xs text-muted-theme mb-1 block">De</label>
                                <input type="date" id="report-start-date" value="${this.state.reportsCustomStart}" class="w-full input-bg text-theme text-sm rounded-lg p-2 border-none outline-none focus:ring-1 focus:ring-amber-500">
                            </div>
                            <div class="flex-1">
                                <label class="text-xs text-muted-theme mb-1 block">Até</label>
                                <input type="date" id="report-end-date" value="${this.state.reportsCustomEnd}" class="w-full input-bg text-theme text-sm rounded-lg p-2 border-none outline-none focus:ring-1 focus:ring-amber-500">
                            </div>
                            <button onclick="App.setCustomReportRange()" class="bg-amber-500 text-zinc-950 p-2 rounded-lg font-bold hover:bg-amber-400 active:scale-95"><i data-lucide="search" class="w-5 h-5"></i></button>
                        </div>
                    ` : ''}

                    <!-- Filtro por Método de Pagamento (Chips) -->
                    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style="-ms-overflow-style: none; scrollbar-width: none;">
                        <button onclick="App.setPaymentFilter('all')" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${this.state.paymentMethodFilter === 'all' ? 'bg-zinc-100 text-zinc-950' : 'input-bg text-muted-theme hover:text-theme'}">Tudo</button>
                        <button onclick="App.setPaymentFilter('Pix')" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${this.state.paymentMethodFilter === 'Pix' ? 'bg-teal-500 text-zinc-950' : 'input-bg text-muted-theme hover:text-teal-400'} flex items-center gap-1.5">
                            <div class="w-1.5 h-1.5 rounded-full ${this.state.paymentMethodFilter === 'Pix' ? 'bg-zinc-950' : 'bg-teal-500'}"></div> Pix
                        </button>
                        <button onclick="App.setPaymentFilter('Dinheiro')" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${this.state.paymentMethodFilter === 'Dinheiro' ? 'bg-emerald-500 text-zinc-950' : 'input-bg text-muted-theme hover:text-emerald-400'} flex items-center gap-1.5">
                            <div class="w-1.5 h-1.5 rounded-full ${this.state.paymentMethodFilter === 'Dinheiro' ? 'bg-zinc-950' : 'bg-emerald-500'}"></div> Dinheiro
                        </button>
                        <button onclick="App.setPaymentFilter('Crédito')" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${this.state.paymentMethodFilter === 'Crédito' ? 'bg-amber-500 text-zinc-950' : 'input-bg text-muted-theme hover:text-amber-400'} flex items-center gap-1.5">
                            <div class="w-1.5 h-1.5 rounded-full ${this.state.paymentMethodFilter === 'Crédito' ? 'bg-zinc-950' : 'bg-amber-500'}"></div> Crédito
                        </button>
                        <button onclick="App.setPaymentFilter('Débito')" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${this.state.paymentMethodFilter === 'Débito' ? 'bg-blue-500 text-zinc-950' : 'input-bg text-muted-theme hover:text-blue-400'} flex items-center gap-1.5">
                            <div class="w-1.5 h-1.5 rounded-full ${this.state.paymentMethodFilter === 'Débito' ? 'bg-zinc-950' : 'bg-blue-500'}"></div> Débito
                        </button>
                    </div>

                    <!-- Filtro de Status de Pagamento -->
                    <div class="flex items-center gap-2 mt-2">
                        <span class="text-[9px] font-black text-muted-theme uppercase tracking-widest mr-1 opacity-50">Status:</span>
                        <button onclick="App.setPaymentStatusFilter('pending')" class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${this.state.paymentStatusFilter === 'pending' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'input-bg text-muted-theme'}">Pendentes</button>
                        <button onclick="App.setPaymentStatusFilter('all')" class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${this.state.paymentStatusFilter === 'all' ? 'bg-zinc-200 text-zinc-950 shadow-lg' : 'input-bg text-muted-theme'}">Arquivados</button>
                    </div>
                </div>
                </div>

                <!-- Resumo Principal -->
                <div class="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 shadow-theme relative overflow-hidden transition-all duration-300">
                    <div class="absolute right-[-20px] top-[-20px] opacity-20">
                        <i data-lucide="trending-up" class="w-32 h-32 text-zinc-950"></i>
                    </div>
                    <p class="text-zinc-900 font-medium text-sm">${isManagement ? 'Faturamento Bruto' : 'Meus Ganhos Líquidos'} ${activeLabel}</p>
                    <h3 class="text-4xl font-bold text-zinc-950 mt-1 mb-4">R$ ${periodTotal.toFixed(2).replace('.', ',')}</h3>
                    
                    ${myAdvancesTotal > 0 ? `
                        <div class="mb-4 text-[10px] font-bold text-amber-900 uppercase tracking-tighter bg-amber-500/20 inline-block px-3 py-1.5 rounded-lg border border-amber-900/10">
                            <i data-lucide="info" class="w-3 h-3 inline-block -mt-0.5"></i> ${periodTotalRaw === 0 ? `Lembrete: R$ ${myAdvancesTotal.toFixed(2).replace('.', ',')} em vales/dívidas ativas.` : `Deduzido R$ ${myAdvancesTotal.toFixed(2).replace('.', ',')} em adiantamentos.`}
                        </div>
                    ` : ''}
                    
                    <div class="flex justify-between items-center text-zinc-900 text-sm font-medium pt-3 border-t border-zinc-950/20">
                        <span>${filteredTxs.length} serviços finalizados</span>
                        <p class="text-[10px] uppercase font-black opacity-60">${revenueLabel}</p>
                    </div>

                    ${isManagement && (this.state.shopSettings?.commission_rate < 100) ? `
                        <div class="mt-4 pt-3 border-t border-zinc-950/10 flex flex-col gap-1">
                            <div class="flex justify-between text-[11px] font-bold text-zinc-900/70 lowercase italic">
                                <span>Repasse Equipe (${this.state.shopSettings.commission_rate}%):</span>
                                <span>R$ ${(periodTotal * (this.state.shopSettings.commission_rate / 100)).toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div class="flex justify-between text-[11px] font-bold text-zinc-950 uppercase tracking-tighter">
                                <span>Líquido Casa (${100 - this.state.shopSettings.commission_rate}%):</span>
                                <span>R$ ${(periodTotal * (1 - this.state.shopSettings.commission_rate / 100)).toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Histórico -->
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <h3 class="text-sm font-medium text-muted-theme uppercase tracking-wider">Histórico do Período</h3>
                        ${filteredTxs.length > 50 ? `<span class="text-xs text-amber-500">Mostrando 50 recentes</span>` : ''}
                    </div>
                    
                    ${displayTxs.length === 0 && !myAdvancesHtml ? `
                        <div class="text-center py-8 text-muted-theme card-bg rounded-xl border border-theme">
                            <i data-lucide="wallet" class="w-10 h-10 mx-auto mb-2 opacity-30"></i>
                            <p class="text-sm cursor-default">Nenhum valor no período selecionado.</p>
                        </div>
                    ` : `
                        <div class="space-y-3 pb-8">
                            ${myAdvancesHtml}
                            ${displayTxs.map(tx => {
            return `
                                <div onclick="App.openTransactionDetail('${tx.id}')" class="card-bg rounded-xl border border-theme shadow-sm p-3 flex items-start justify-between hover:border-amber-500/30 transition-all gap-3 cursor-pointer group">
                                    <div class="flex items-start gap-3 min-w-0 flex-1">
                                        <div class="input-bg p-2 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                            ${tx.paymentMethod === 'Pix' ? '<i data-lucide="zap" class="w-5 h-5 text-teal-400"></i>' : tx.paymentMethod === 'Dinheiro' ? '<i data-lucide="banknote" class="w-5 h-5 text-emerald-500"></i>' : tx.paymentMethod === 'Débito' ? '<i data-lucide="credit-card" class="w-5 h-5 text-blue-400"></i>' : '<i data-lucide="credit-card" class="w-5 h-5 text-amber-500"></i>'}
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <p class="font-bold text-theme text-sm truncate">${App.escapeHTML(tx.clientName)}</p>
                                            <div class="text-[10px] text-muted-theme flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <span class="input-bg px-1.5 py-0.5 rounded border border-theme font-bold text-amber-500 uppercase tracking-tighter flex-shrink-0">${tx.paymentMethod}</span>
                                                <span class="opacity-30 flex-shrink-0">•</span>
                                                <span class="truncate">${tx.service.name}</span>
                                                ${isManagement && tx.barberName ? `
                                                    <span class="opacity-30 flex-shrink-0">•</span>
                                                    <span class="text-amber-500 font-bold uppercase tracking-tighter bg-amber-500/10 px-1 rounded flex-shrink-0">${tx.barberName.split(' ')[0]}</span>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-right flex-shrink-0 flex flex-col items-end min-w-[75px] mt-0.5">
                                        <p class="font-black text-theme leading-none text-base">R$ ${(this.state.role === 'barber' ? tx.numericValue * commissionRate : tx.numericValue).toFixed(2).replace('.', ',')}</p>
                                        <p class="text-[9px] text-muted-theme font-mono mt-1.5 opacity-60">${tx.date} • ${tx.time}</p>
                                    </div>
                                </div>
                                `;
        }).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    renderTransactionDetailModal(tx, apt) {
        const payMap = {
            'Pix':     { icon: 'zap',         color: 'text-teal-400',    bg: 'bg-teal-500/10',    badge: 'bg-teal-500 text-zinc-950' },
            'Dinheiro':{ icon: 'banknote',     color: 'text-emerald-500', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500 text-zinc-950' },
            'Débito':  { icon: 'credit-card',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    badge: 'bg-blue-500 text-zinc-950' },
            'Crédito': { icon: 'credit-card',  color: 'text-amber-500',   bg: 'bg-amber-500/10',   badge: 'bg-amber-500 text-zinc-950' },
        };
        const pay = payMap[tx.paymentMethod] || payMap['Crédito'];

        const comanda = (apt && apt.comanda_items) ? apt.comanda_items : [];
        const comandaTotal = comanda.reduce((sum, i) => sum + (i.price * (i.qty || 1)), 0);
        const servicesTotal = Math.max(0, tx.numericValue - comandaTotal);
        const servicesList = (tx.service.name || '').split(' + ').map(s => s.trim()).filter(Boolean);
        const dateFmt = tx.date.split('-').reverse().join('/');
        const isLoading = apt === null;

        return `
            <div class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-4 pb-4 fade-in" onclick="if(event.target===this) App.closeTransactionDetail()">
                <div class="w-full max-w-sm card-bg rounded-3xl border border-theme shadow-2xl overflow-hidden scale-in">

                    <!-- Cabeçalho -->
                    <div class="input-bg p-5 border-b border-theme">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="${pay.bg} w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
                                    <i data-lucide="${pay.icon}" class="w-5 h-5 ${pay.color}"></i>
                                </div>
                                <div class="min-w-0">
                                    <h2 class="font-black text-theme text-base leading-tight truncate">${App.escapeHTML(tx.clientName)}</h2>
                                    <p class="text-[11px] text-muted-theme mt-0.5">${dateFmt} • ${tx.time} • ${App.escapeHTML((tx.barberName || '').split(' ')[0])}</p>
                                </div>
                            </div>
                            <button onclick="App.closeTransactionDetail()" class="w-9 h-9 flex items-center justify-center rounded-xl input-bg text-muted-theme hover:text-red-400 transition-colors border border-theme shrink-0">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="mt-3">
                            <span class="text-[10px] font-black px-2.5 py-1 rounded-lg ${pay.badge} uppercase tracking-widest">${tx.paymentMethod}</span>
                        </div>
                    </div>

                    <!-- Corpo -->
                    <div class="p-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">

                        <!-- Serviços -->
                        <div class="space-y-1">
                            <p class="text-[10px] font-black text-muted-theme uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                <i data-lucide="scissors" class="w-3 h-3"></i> Serviços
                            </p>
                            ${servicesList.map((s, idx) => `
                                <div class="flex items-center justify-between py-1.5 border-b border-theme/30 last:border-0">
                                    <span class="text-sm text-theme">${App.escapeHTML(s)}</span>
                                    ${servicesList.length === 1 ? `<span class="text-sm font-bold text-theme">R$ ${servicesTotal.toFixed(2).replace('.', ',')}</span>` : ''}
                                </div>
                            `).join('')}
                            ${servicesList.length > 1 ? `
                                <div class="flex items-center justify-between pt-1.5">
                                    <span class="text-xs text-muted-theme">Subtotal</span>
                                    <span class="text-sm font-bold text-theme">R$ ${servicesTotal.toFixed(2).replace('.', ',')}</span>
                                </div>
                            ` : ''}
                        </div>

                        <!-- Produtos da Comanda -->
                        ${isLoading ? `
                            <div class="flex items-center justify-center gap-2 py-2 text-muted-theme">
                                <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>
                                <span class="text-xs">Carregando comanda...</span>
                            </div>
                        ` : comanda.length > 0 ? `
                            <div class="space-y-1">
                                <p class="text-[10px] font-black text-muted-theme uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                    <i data-lucide="shopping-bag" class="w-3 h-3"></i> Produtos da Comanda
                                </p>
                                ${comanda.map(item => `
                                    <div class="flex items-center justify-between py-1.5 border-b border-theme/30 last:border-0">
                                        <div class="flex items-center gap-2 min-w-0">
                                            <span class="text-[10px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md shrink-0">${item.qty || 1}×</span>
                                            <span class="text-sm text-theme truncate">${App.escapeHTML(item.name)}</span>
                                        </div>
                                        <span class="text-sm font-bold text-theme shrink-0 ml-3">R$ ${(item.price * (item.qty || 1)).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                `).join('')}
                                <div class="flex items-center justify-between pt-1.5">
                                    <span class="text-xs text-muted-theme">Subtotal produtos</span>
                                    <span class="text-sm font-bold text-theme">R$ ${comandaTotal.toFixed(2).replace('.', ',')}</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Rodapé / Total -->
                    <div class="p-5 border-t border-theme input-bg flex items-center justify-between">
                        <span class="text-sm font-bold text-muted-theme uppercase tracking-wider">Total</span>
                        <span class="text-2xl font-black text-theme">R$ ${tx.numericValue.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderAnalyticsDashboard() {
        const stats = this.getAnalytics();
        const isBarber = this.state.role === 'barber';
        if (!stats) {
            return `
                <div class="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <i data-lucide="bar-chart-3" class="w-16 h-16 text-zinc-800 animate-pulse"></i>
                    <p class="text-muted-theme">Não há dados suficientes para gerar o dashboard estratégico.</p>
                    <button onclick="App.toggleReportsView('list')" class="text-amber-500 text-sm font-bold uppercase tracking-widest border-b border-amber-500/30 pb-1">Voltar para Lista</button>
                </div>
            `;
        }

        const growthColor = stats.growth >= 0 ? 'text-emerald-500' : 'text-rose-500';
        const growthIcon = stats.growth >= 0 ? 'trending-up' : 'trending-down';

        return `
            <div class="space-y-6 fade-in pb-12">
                <!-- Header -->
                <div class="flex items-end justify-between mb-2">
                    <h2 class="text-2xl font-bold text-theme italic">Business Intelligence</h2>
                    <div class="flex card-bg p-1 rounded-lg border border-theme">
                        <button onclick="App.toggleReportsView('list')" class="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all text-muted-theme">Lista</button>
                        <button onclick="App.toggleReportsView('dashboard')" class="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all bg-amber-500 text-zinc-950">Estratégico</button>
                    </div>
                </div>

                <!-- KPI Cards Grid -->
                <div class="grid grid-cols-2 gap-3">
                    <div class="card-bg border border-theme p-4 rounded-2xl space-y-1 shadow-sm">
                        <p class="text-[10px] uppercase font-black text-muted-theme tracking-widest">Ticket Médio</p>
                        <h4 class="text-xl font-bold text-theme">R$ ${stats.avgTicket.toFixed(2)}</h4>
                        <div class="flex items-center gap-1 text-[10px] text-muted-theme">
                            <i data-lucide="info" class="w-3 h-3"></i> este mês
                        </div>
                    </div>
                    <div class="card-bg border border-theme p-4 rounded-2xl space-y-1 shadow-sm">
                        <p class="text-[10px] uppercase font-black text-muted-theme tracking-widest">Crescimento</p>
                        <h4 class="text-xl font-bold ${growthColor}">${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}%</h4>
                        <div class="flex items-center gap-1 text-[10px] ${growthColor}">
                            <i data-lucide="${growthIcon}" class="w-3 h-3"></i> vs mês ant.
                        </div>
                    </div>

                    ${!isBarber ? `
                        <div class="card-bg border border-emerald-500/20 p-4 rounded-2xl space-y-1 shadow-sm bg-emerald-500/5">
                            <p class="text-[10px] uppercase font-black text-emerald-500/70 tracking-widest text-center">Líquido Loja</p>
                            <h4 class="text-xl font-bold text-emerald-500 text-center">R$ ${stats.totalShopShare.toFixed(2)}</h4>
                        </div>
                        <div class="card-bg border border-amber-500/20 p-4 rounded-2xl space-y-1 shadow-sm bg-amber-500/5">
                            <p class="text-[10px] uppercase font-black text-amber-500/70 tracking-widest text-center">Repasse Time</p>
                            <h4 class="text-xl font-bold text-amber-500 text-center">R$ ${stats.totalBarberShare.toFixed(2)}</h4>
                        </div>
                    ` : ''}
                </div>

                <!-- Main Revenue Chart -->
                <div class="card-bg border border-theme p-5 rounded-3xl shadow-xl space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-bold text-theme flex items-center gap-2 italic">
                            <i data-lucide="line-chart" class="w-4 h-4 text-amber-500"></i> Evolução de Faturamento
                        </h3>
                        <span class="text-[10px] input-bg px-2 py-0.5 rounded text-muted-theme font-bold uppercase tracking-tighter">Últimos 6 meses</span>
                    </div>
                    <div class="h-48 w-full relative">
                        <canvas id="revenueGrowthChart"></canvas>
                    </div>
                </div>

                <!-- Rankings / Insights -->
                <div class="space-y-4 mt-8">
                    <h3 class="text-xs font-bold text-muted-theme uppercase tracking-widest">Mix de Serviços (Popularidade)</h3>
                    <div class="space-y-2">
                        ${stats.topServices.map((s, idx) => `
                            <div class="flex items-center justify-between p-3 card-bg rounded-xl border border-theme/50">
                                <div class="flex items-center gap-3">
                                    <span class="w-6 h-6 rounded flex items-center justify-center input-bg text-[10px] font-black ${idx === 0 ? 'text-amber-500 border border-amber-500/20' : 'text-muted-theme'}">${idx + 1}</span>
                                    <span class="text-sm font-medium text-theme">${App.escapeHTML(s.name)}</span>
                                </div>
                                <span class="text-xs font-bold text-muted-theme">${s.count} <span class="text-[10px] font-normal uppercase opacity-50">serviço(s)</span></span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Dica Estratégica AI -->
                <div class="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex gap-3">
                    <div class="bg-amber-500 text-zinc-950 p-2 rounded-xl h-fit">
                        <i data-lucide="sparkles" class="w-5 h-5"></i>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs font-bold text-amber-500 uppercase tracking-tight">Análise BarberBI</p>
                        <p class="text-xs text-amber-200/80 leading-relaxed italic">
                            ${stats.growth < 0 ? 'Atenção: Seu faturamento caiu este mês. Considere uma promoção para dias úteis (terça e quarta).' : 'Bom trabalho! O faturamento está em alta. Que tal oferecer um programa de fidelidade para os clientes mais frequentes?'}
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    renderProductsReport() {
        const { aggregatedItems, totalRevenue, totalQty } = this.getFilteredProductItems();
        const isLoading = this.state.isLoadingProductSales;
        const dateFilter = this.state.productDateFilter;
        const catFilter = this.state.productCategoryFilter;

        const dateFilterLabels = {
            'day': 'Hoje', 'week': 'Esta Semana', 'month': 'Este Mês', 'year': 'Este Ano', 'custom': 'No Período'
        };

        return `
            <div class="space-y-6 fade-in pb-12">
                <!-- Tab: Financeiro | Produtos -->
                <div class="flex card-bg p-1 rounded-xl border border-theme">
                    <button onclick="App.setProductReportTab('financial')" class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-muted-theme hover:text-theme">Financeiro</button>
                    <button onclick="App.setProductReportTab('products')" class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all bg-amber-500 text-zinc-950">Produtos</button>
                </div>

                <!-- Header -->
                <div class="flex items-end justify-between">
                    <h2 class="text-2xl font-bold text-theme">Produtos Vendidos</h2>
                    <button onclick="App.exportProductsToCSV()" class="p-2 rounded-lg card-bg border border-theme text-muted-theme hover:text-amber-500 hover:border-amber-500/30 transition-all active:scale-95" title="Exportar CSV">
                        <i data-lucide="download" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- Filtros de Data -->
                <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button onclick="App.setProductDateFilter('day')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${dateFilter === 'day' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Hoje</button>
                    <button onclick="App.setProductDateFilter('week')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${dateFilter === 'week' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Semana</button>
                    <button onclick="App.setProductDateFilter('month')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${dateFilter === 'month' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Mês</button>
                    <button onclick="App.setProductDateFilter('year')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${dateFilter === 'year' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Ano</button>
                    <button onclick="App.setProductDateFilter('custom')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center ${dateFilter === 'custom' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">
                        <i data-lucide="calendar-search" class="w-4 h-4"></i>
                    </button>
                </div>

                ${dateFilter === 'custom' ? `
                    <div class="card-bg border border-theme p-3 rounded-xl flex gap-2 items-end fade-in">
                        <div class="flex-1">
                            <label class="text-xs text-muted-theme mb-1 block">De</label>
                            <input type="date" id="product-start-date" value="${this.state.productDateStart}" class="w-full input-bg text-theme text-sm rounded-lg p-2 border-none outline-none focus:ring-1 focus:ring-amber-500">
                        </div>
                        <div class="flex-1">
                            <label class="text-xs text-muted-theme mb-1 block">Até</label>
                            <input type="date" id="product-end-date" value="${this.state.productDateEnd}" class="w-full input-bg text-theme text-sm rounded-lg p-2 border-none outline-none focus:ring-1 focus:ring-amber-500">
                        </div>
                        <button onclick="App.setCustomProductRange()" class="bg-amber-500 text-zinc-950 p-2 rounded-lg font-bold hover:bg-amber-400 active:scale-95"><i data-lucide="search" class="w-5 h-5"></i></button>
                    </div>
                ` : ''}

                <!-- Filtros de Categoria -->
                ${CATEGORIES.length > 0 ? `
                    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style="-ms-overflow-style: none; scrollbar-width: none;">
                        <button onclick="App.setProductCategoryFilter('all')" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${catFilter === 'all' ? 'bg-zinc-100 text-zinc-950' : 'input-bg text-muted-theme hover:text-theme'}">Todas</button>
                        ${CATEGORIES.map(cat => `
                            <button onclick="App.setProductCategoryFilter('${cat.id}')" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${catFilter === cat.id ? 'bg-amber-500 text-zinc-950' : 'input-bg text-muted-theme hover:text-amber-400'}">${App.escapeHTML(cat.name)}</button>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- Card Resumo -->
                <div class="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 shadow-theme relative overflow-hidden transition-all duration-300">
                    <div class="absolute right-[-20px] top-[-20px] opacity-20">
                        <i data-lucide="package" class="w-32 h-32 text-zinc-950"></i>
                    </div>
                    <p class="text-zinc-900 font-medium text-sm">Receita de Produtos — ${dateFilterLabels[dateFilter] || ''}</p>
                    <h3 class="text-4xl font-bold text-zinc-950 mt-1 mb-4">R$ ${isLoading ? '...' : totalRevenue.toFixed(2).replace('.', ',')}</h3>
                    <div class="flex justify-between items-center text-zinc-900 text-sm font-medium pt-3 border-t border-zinc-950/20">
                        <span>${isLoading ? '—' : totalQty + ' itens vendidos'}</span>
                        <span class="text-[10px] uppercase font-black opacity-60">${isLoading ? '' : aggregatedItems.length + ' produtos distintos'}</span>
                    </div>
                </div>

                <!-- Lista de Produtos -->
                <div class="space-y-4">
                    <h3 class="text-sm font-medium text-muted-theme uppercase tracking-wider">Itens Vendidos no Período</h3>

                    ${isLoading ? `
                        <div class="text-center py-10 text-muted-theme">
                            <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin text-amber-500"></i>
                            <p class="text-sm">Carregando produtos...</p>
                        </div>
                    ` : aggregatedItems.length === 0 ? `
                        <div class="text-center py-10 text-muted-theme card-bg rounded-xl border border-theme">
                            <i data-lucide="package-open" class="w-10 h-10 mx-auto mb-2 opacity-30"></i>
                            <p class="text-sm cursor-default">Nenhum produto vendido no período.</p>
                        </div>
                    ` : `
                        <div class="space-y-3">
                            ${aggregatedItems.map(item => `
                                <div class="card-bg rounded-xl border border-theme p-3 shadow-sm flex items-center justify-between gap-3">
                                    <div class="flex items-center gap-3 min-w-0 flex-1">
                                        <div class="input-bg p-2 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <i data-lucide="package" class="w-5 h-5 text-amber-500"></i>
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <p class="font-bold text-theme text-sm truncate">${App.escapeHTML(item.name)}</p>
                                            <div class="text-[10px] text-muted-theme flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <span class="input-bg px-1.5 py-0.5 rounded border border-theme font-bold text-amber-500 uppercase tracking-tighter">${App.escapeHTML(item.categoryName)}</span>
                                                <span class="opacity-30">•</span>
                                                <span>${item.totalQty}x vendido${item.totalQty > 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-right flex-shrink-0 flex flex-col items-end min-w-[80px]">
                                        <p class="font-black text-theme leading-none text-base">R$ ${item.totalRevenue.toFixed(2).replace('.', ',')}</p>
                                        <p class="text-[9px] text-muted-theme font-mono mt-1 opacity-60">R$ ${item.price.toFixed(2).replace('.', ',')} / un</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    renderBarbearia() {
        if (this.state.isManagingShop) {
            return this.renderShopManagement();
        }

        const s = this.state.shopSettings;
        const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);
        const isEditing = this.state.isEditingShop;

        if (isEditing && isStaff) {
            return `
                <div class="space-y-6 fade-in pb-6">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h2 class="text-2xl font-bold text-theme">Editar Barbearia</h2>
                            <p class="text-xs text-muted-theme">Atualize sua marca e contatos.</p>
                        </div>
                        <button onclick="App.toggleShopEdit()" class="p-2 input-bg rounded-full text-muted-theme hover:text-theme">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4 flex items-center gap-3">
                        <i data-lucide="info" class="w-5 h-5 text-amber-500"></i>
                        <p class="text-[10px] text-amber-200/80 font-medium leading-relaxed uppercase">
                            Não precisa digitar <span class="bg-amber-500 text-zinc-950 px-1 rounded font-bold">55</span> nos números. O sistema formata e adiciona o código do Brasil automaticamente para você!
                        </p>
                    </div>

                    <div class="card-bg rounded-2xl border border-theme p-6 space-y-5 shadow-xl">
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Nome da Barbearia</label>
                            <input type="text" id="shop-name" value="${App.escapeHTML(s.name)}" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Slogan / Frase de Impacto</label>
                            <input type="text" id="shop-slogan" value="${s.slogan || ''}" placeholder="Ex: A melhor experiência em estilo e cuidado." class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>

                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Logo da Barbearia</label>
                            
                            <div class="flex items-center gap-4 p-4 card-bg border border-theme rounded-2xl">
                                <div class="relative w-16 h-16 rounded-xl overflow-hidden input-bg border-2 border-theme flex-shrink-0">
                                    ${s.logo_url ? `
                                        <img src="${s.logo_url}" class="w-full h-full object-cover" />
                                    ` : `
                                        <div class="w-full h-full flex items-center justify-center text-zinc-600">
                                            <i data-lucide="image" class="w-8 h-8"></i>
                                        </div>
                                    `}
                                    
                                    ${this.state.isUploadingLogo ? `
                                        <div class="absolute inset-0 bg-zinc-950/60 flex items-center justify-center">
                                            <div class="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ` : ''}
                                </div>

                                <div class="flex-1 space-y-2">
                                    <p class="text-[10px] text-muted-theme leading-tight">Envie uma imagem JPG ou PNG. Recomendamos um formato quadrado ou horizontal.</p>
                                    <div class="flex gap-2">
                                        <label for="shop-logo-input" class="cursor-pointer px-3 py-1.5 input-bg hover:bg-zinc-700 border border-theme text-theme text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center gap-2">
                                            <i data-lucide="upload" class="w-3.5 h-3.5 text-amber-500"></i>
                                            ${s.logo_url ? 'Trocar Imagem' : 'Enviar Logo'}
                                            <input type="file" id="shop-logo-input" class="hidden" accept="image/*" onchange="App.handleShopLogoUpload(event)" ${this.state.isUploadingLogo ? 'disabled' : ''} />
                                        </label>
                                        <input type="hidden" id="shop-logo" value="${s.logo_url || ''}" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Rua e Número</label>
                                <input type="text" id="shop-street" value="${s.address_street}" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Cidade / Estado</label>
                                <input type="text" id="shop-city" value="${s.address_city}" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">WhatsApp (Apenas Números)</label>
                                <input type="text" id="shop-whatsapp" inputmode="numeric" value="${s.whatsapp}" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Telefone Comercial</label>
                                <input type="text" id="shop-phone" inputmode="numeric" value="${s.phone}" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                        </div>
                        

                        <div class="space-y-4 pt-4 border-t border-theme/50">

                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">URL Instagram</label>
                                <input type="text" id="shop-instagram" value="${s.instagram_url}" class="w-full input-bg border border-theme rounded-xl p-2 text-theme focus:border-amber-500 outline-none transition-colors text-xs" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">URL Facebook</label>
                                <input type="text" id="shop-facebook" value="${s.facebook_url || ''}" class="w-full input-bg border border-theme rounded-xl p-2 text-theme focus:border-amber-500 outline-none transition-colors text-xs" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">URL do Google (Avaliação)</label>
                                <input type="text" id="shop-google" value="${s.google_review_url}" class="w-full input-bg border border-theme rounded-xl p-2 text-theme focus:border-amber-500 outline-none transition-colors text-xs" />
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button onclick="App.toggleShopEdit()" class="flex-1 py-4 rounded-xl font-bold transition-all duration-200 input-bg text-muted-theme hover:bg-zinc-700 border border-theme shadow-sm">
                            Cancelar
                        </button>
                        <button onclick="App.saveShopSettings()" class="flex-1 py-4 rounded-xl font-bold transition-all duration-200 bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-xl shadow-amber-500/20">
                            Salvar
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-6 fade-in slide-in-up pb-6">
                <!-- Título -->
                <div class="flex justify-between items-center mb-2">
                    <div class="flex flex-col gap-2">
                        <h2 class="text-2xl font-bold text-theme">A Barbearia</h2>
                        <p class="text-xs text-muted-theme">Siga nossas redes e venha nos visitar.</p>
                    </div>
                    <div class="flex gap-2">
                        ${['admin', 'manager', 'barber'].includes(this.state.role) ? `
                            <button onclick="App.toggleShopManagement()" class="p-2.5 input-bg text-theme rounded-xl hover:bg-zinc-700 transition-all active:scale-95 shadow-lg border border-theme flex items-center gap-2 font-bold text-xs" title="Gestão Avançada">
                                <i data-lucide="settings" class="w-4 h-4 text-theme"></i> Painel
                            </button>
                        ` : ''}
                        ${isStaff ? `
                            <button onclick="App.toggleShopEdit()" class="p-2.5 bg-amber-500 text-zinc-950 rounded-xl hover:bg-amber-400 transition-all active:scale-95 shadow-theme flex items-center gap-2 font-bold text-xs">
                                <i data-lucide="edit-3" class="w-4 h-4"></i> Editar
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Intro -->
                <div class="relative card-bg border border-theme rounded-3xl p-8 shadow-xl overflow-hidden flex flex-col items-center text-center mt-4">
                    <div class="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <div class="w-24 h-24 rounded-full flex items-center justify-center mb-5 z-10 border-4 border-zinc-950 shadow-2xl relative overflow-hidden card-bg">
                        ${s.logo_url ? `
                            <img src="${s.logo_url}" alt="Logo" class="w-full h-full object-cover">
                        ` : `
                            <i data-lucide="scissors" class="w-10 h-10 text-amber-500"></i>
                        `}
                    </div>
                    <h2 class="text-3xl text-theme relative z-10 font-pristina">${App.escapeHTML(s.name)}</h2>
                    <p class="text-muted-theme text-sm mt-2 relative z-10 font-medium">${s.slogan || 'A melhor experiência em estilo e cuidado.'}</p>
                </div>

                <!-- Contatos Rápidos -->
                <div class="space-y-4">
                    <h3 class="text-[10px] font-bold text-muted-theme uppercase tracking-[0.25em] mb-4 mt-8 flex items-center gap-2">
                        <div class="w-8 h-px bg-theme/20"></div> Contato e Redes Sociais
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                        ${s.whatsapp ? `
                            <a href="https://wa.me/${App.formatWA(s.whatsapp)}" target="_blank" class="bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/10 hover:bg-[#25D366]/20 transition-all duration-300 rounded-3xl p-4 flex flex-col items-center gap-3 justify-center shadow-lg active:scale-95">
                                <div class="bg-[#25D366]/20 p-2.5 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.012 2c-5.508 0-9.987 4.479-9.987 9.988 0 1.75.452 3.457 1.319 4.972L2 22l5.161-1.353a9.948 9.948 0 0 0 4.851 1.226c5.509 0 10.013-4.504 10.013-10.013s-4.504-10.012-10.013-10.012zm5.823 14.16c-.25.713-1.464 1.3-2.022 1.38-.501.071-1.077.106-1.745-.107-2.617-.837-4.305-3.486-4.436-3.66-.131-.174-1.063-1.411-1.063-2.695 0-1.284.672-1.921.912-2.181.25-.26-.145-.51-.145-.51l1.107-.107c.25.011.511.022.753.593.25.592.511 1.254.511 1.254s.061.127.018.239a.44.44 0 0 1-.223.239c-.131.061-.223.111-.315.207-.131.131-.274.275-.018.711.25.436.56 1.01.99 1.48.583.633 1.137.95 1.623 1.17 1.545.698 2.37.5 2.766.1a1.8 1.8 0 0 1 .536-.71c.145-.126.315-.175.56-.08.68.254 1.25.54 2.1 1.05zm0 0"/></svg>
                                </div>
                                <span class="text-xs font-black uppercase tracking-tighter">WhatsApp</span>
                            </a>
                        ` : ''}
                        ${s.phone ? `
                            <a href="tel:+55${s.phone.replace(/\D/g, '')}" class="input-bg text-theme border border-theme/50 hover:bg-zinc-700 transition-all duration-300 rounded-3xl p-4 flex flex-col items-center gap-3 justify-center shadow-lg active:scale-95">
                                <div class="input-bg p-2.5 rounded-xl border border-white/5">
                                    <i data-lucide="phone" class="w-6 h-6"></i>
                                </div>
                                <span class="text-xs font-black uppercase tracking-tighter">${this.formatDisplayPhone(s.phone)}</span>
                            </a>
                        ` : ''}
                        ${s.instagram_url ? `
                            <a href="${s.instagram_url}" target="_blank" class="bg-gradient-to-tr from-[#f09433]/10 via-[#e6683c]/10 to-[#bc1888]/10 text-[#e1306c] border border-[#e1306c]/10 hover:bg-[#e1306c]/20 transition-all duration-300 rounded-3xl p-4 flex flex-col items-center gap-3 justify-center shadow-lg active:scale-95">
                                <div class="bg-[#bc1888]/20 p-2.5 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                                </div>
                                <span class="text-xs font-black uppercase tracking-tighter">Instagram</span>
                            </a>
                        ` : ''}
                        ${s.facebook_url ? `
                            <a href="${s.facebook_url}" target="_blank" class="bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-all duration-300 rounded-3xl p-4 flex flex-col items-center gap-3 justify-center shadow-lg active:scale-95">
                                <div class="bg-[#1877F2]/20 p-2.5 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.792 5 15.536 5H18V0h-3.977C10.038 0 9 2.105 9 5.589V8z"/></svg>
                                </div>
                                <span class="text-xs font-black uppercase tracking-tighter">Facebook</span>
                            </a>
                        ` : ''}
                    </div>
                    
                    <!-- Novo: Botão Google Review -->
                    ${s.google_review_url ? `
                        <div class="pt-2">
                            <a href="${s.google_review_url}" target="_blank" class="w-full card-bg border border-amber-500/20 hover:border-amber-500/50 transition-all duration-500 rounded-2xl p-4 flex items-center justify-between group shadow-lg active:scale-[0.98]">
                                <div class="flex items-center gap-4">
                                    <div class="bg-white p-2 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" class="w-5 h-5" alt="Google Logo" />
                                    </div>
                                    <div class="text-left">
                                        <p class="text-xs font-black text-theme uppercase tracking-widest">Avaliar no Google</p>
                                        <p class="text-[10px] text-muted-theme font-medium mt-0.5">Sua opinião é muito importante para nós!</p>
                                    </div>
                                </div>
                                <i data-lucide="external-link" class="w-4 h-4 text-muted-theme group-hover:text-amber-500 transition-colors"></i>
                            </a>
                        </div>
                    ` : ''}
                </div>

                <div class="space-y-4 pt-6">
                    <h3 class="text-[10px] font-bold text-muted-theme uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                        <div class="w-8 h-px bg-theme/20"></div> Nossa Localização
                    </h3>
                    <div class="card-bg border border-theme rounded-3xl p-6 shadow-xl flex flex-col gap-6 group hover:border-amber-500/30 transition-all duration-300">
                        <div class="flex items-start gap-4">
                            <div class="card-bg border border-amber-500/20 p-4 rounded-2xl text-amber-500 flex-shrink-0 shadow-inner group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all duration-500">
                                <i data-lucide="map-pin" class="w-7 h-7"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-black text-theme text-base italic tracking-tight uppercase leading-snug">${s.address_street}</p>
                                <p class="text-sm text-muted-theme font-medium mt-1">${s.address_city}</p>
                                <div class="flex gap-2 mt-3">
                                    <button onclick="App.copyAddress()" class="p-2.5 input-bg text-amber-500 rounded-xl hover:bg-zinc-700 transition-all active:scale-95 border border-amber-500/10 shadow-sm" title="Copiar Endereço">
                                        <i data-lucide="copy" class="w-4 h-4"></i>
                                    </button>
                                    <button onclick="App.shareLocation()" class="p-2.5 input-bg text-amber-500 rounded-xl hover:bg-zinc-700 transition-all active:scale-95 border border-amber-500/10 shadow-sm" title="Compartilhar">
                                        <i data-lucide="share-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col gap-3">
                            <a href="https://maps.google.com/?q=${encodeURIComponent(s.address_street + ', ' + s.address_city)}" target="_blank" class="w-full py-4 rounded-2xl font-black transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] card-bg text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-zinc-950 hover:border-amber-500 shadow-lg text-xs uppercase tracking-widest">
                                <i data-lucide="navigation" class="w-5 h-5"></i> Como chegar pelo Mapa
                            </a>
                            <a href="https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(s.address_street + ', ' + s.address_city)}&dropoff[nickname]=Finno%20Trato%20Barbearia" target="_blank" class="w-full py-4 rounded-2xl font-black transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] bg-zinc-950 text-white border border-zinc-700 hover:bg-white hover:text-zinc-950 hover:border-white shadow-lg text-xs uppercase tracking-widest">
                                <img src="assets/Uber_App_Icon.svg" alt="Uber" class="w-7 h-7 rounded-sm">
                                Chamar Uber
                            </a>

                        </div>
                    </div>
        </div>
            </div>
        `;
    },

    renderShopManagement() {
        const tab = this.state.adminShopTab;

        let contentHtml = '';

        if (tab === 'barbers') {
            contentHtml = `
                <div class="space-y-4 fade-in">
                    <!-- Lista de Profissionais Existentes -->
                    <h3 class="text-xs font-bold text-muted-theme uppercase tracking-wider mt-6 mb-2">Equipe Atual</h3>
                    <div class="space-y-3">
                        ${BARBERS.map(b => `
                            <div class="card-bg border ${b.is_active ? 'border-theme' : 'border-red-500/30 opacity-60'} rounded-2xl p-4 shadow-sm flex flex-col gap-4 hover:border-theme transition-all">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full overflow-hidden border border-theme flex-shrink-0 flex items-center justify-center bg-zinc-800">
                                            ${b.avatar ? `
                                                <img src="${b.avatar}" class="w-full h-full object-cover" />
                                            ` : `
                                                <span class="text-base font-black text-amber-500/70">${(b.name?.[0] || 'P').toUpperCase()}</span>
                                            `}
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-theme text-sm">${App.escapeHTML(b.name)}</h4>
                                            <p class="text-[9px] uppercase text-muted-theme tracking-widest">${b.is_active ? '<span class="text-emerald-500 font-black">Ativo</span>' : '<span class="text-red-500 font-bold">Inativo</span>'}</p>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <button onclick="App.renderBarberServicesModal(${b.id})" class="p-2 input-bg text-amber-500 rounded-lg hover:bg-zinc-700 transition-colors border border-theme active:scale-95" title="Definir Serviços (Especialidades)">
                                            <i data-lucide="scissors" class="w-3.5 h-3.5"></i>
                                        </button>
                                        <button onclick="App.toggleBarberStatus(${b.id})" class="p-2 input-bg rounded-lg hover:bg-zinc-700 transition-colors border border-theme active:scale-95" title="${b.is_active ? 'Desativar' : 'Ativar'}">
                                            <i data-lucide="${b.is_active ? 'pause' : 'play'}" class="w-3.5 h-3.5 ${b.is_active ? 'text-amber-500' : 'text-emerald-500'}"></i>
                                        </button>
                                        <button onclick="App.removeBarber(${b.id})" class="p-2 input-bg text-red-500 rounded-lg hover:bg-zinc-700 transition-colors border border-theme active:scale-95" title="Remover Barbeiro">
                                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-3 pt-3 border-t border-theme/50">
                                    <div class="flex-1">
                                        <label class="text-[9px] font-black text-muted-theme uppercase tracking-widest block mb-1">Repasse Individual (%)</label>
                                        <p class="text-[8px] text-muted-theme/60 italic leading-tight">Deixe vazio para usar o padrão da casa.</p>
                                    </div>
                                    <div class="relative w-20">
                                        <input 
                                            type="number" 
                                            value="${b.commission_rate ?? ''}" 
                                            placeholder="${this.state.shopSettings?.commission_rate || 100}"
                                            onchange="App.updateBarberCommission(${b.id}, this.value)"
                                            min="0" max="100" 
                                            class="w-full card-bg border border-theme rounded-lg p-2 text-xs text-amber-500 font-bold text-center focus:border-amber-500 outline-none shadow-inner" 
                                        />
                                        <div class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-amber-500/30 font-bold">%</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (tab === 'services') {
            const editingSvc = this.state.editingServiceId ? SERVICES.find(s => s.id === this.state.editingServiceId) : null;
            contentHtml = `
                <div class="space-y-4 fade-in">
                    <!-- Formulário Novo Serviço -->
                    <div class="card-bg border border-theme rounded-2xl p-5 shadow-sm space-y-4">
                        <div class="flex justify-between items-center">
                            <h3 class="text-sm font-bold text-theme flex items-center gap-2">
                                <i data-lucide="${editingSvc ? 'edit-2' : 'scissors'}" class="w-4 h-4 text-amber-500"></i> 
                                ${editingSvc ? 'Editar Serviço' : 'Cadastrar Serviço'}
                            </h3>
                            ${editingSvc ? `
                                <button onclick="App.cancelEditService()" class="text-[10px] text-red-500 font-bold uppercase tracking-wider hover:underline">Cancelar</button>
                            ` : ''}
                        </div>
                        
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Nome do Serviço *</label>
                            <input type="text" id="new-service-name" value="${editingSvc ? App.escapeHTML(editingSvc.name) : ''}" placeholder="Ex: Corte Degrade + Barba" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Preço (R$) *</label>
                                <input type="number" id="new-service-price" value="${editingSvc ? editingSvc.priceValue : ''}" inputmode="decimal" placeholder="45.00" step="0.01" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Duração (Minutos) *</label>
                                <input type="number" id="new-service-duration" value="${editingSvc ? editingSvc.durationMinutes : ''}" inputmode="numeric" placeholder="30" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                        </div>

                        <!-- Checkbox: Preço Variável -->
                        <label class="flex items-center gap-3 p-3 rounded-xl card-bg border border-theme/50 cursor-pointer hover:border-amber-500/40 transition-colors group">
                            <input
                                type="checkbox"
                                id="new-service-price-variable"
                                ${editingSvc?.price_variable ? 'checked' : ''}
                                class="w-4 h-4 accent-amber-500 cursor-pointer"
                            />
                            <div class="flex-1">
                                <p class="text-xs font-bold text-theme group-hover:text-amber-500 transition-colors">Preço variável</p>
                                <p class="text-[10px] text-muted-theme leading-tight">Exibe <span class="text-amber-500 font-bold">"A partir de R$ X,XX"</span> para o cliente. Ideal para serviços que variam conforme o tamanho do cabelo.</p>
                            </div>
                        </label>
                        </label>                        <button onclick="App.addService()" class="w-full py-3 rounded-xl font-bold transition-all duration-200 ${editingSvc ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400' : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'} shadow-lg active:scale-95 flex items-center justify-center gap-2">
                            <i data-lucide="${editingSvc ? 'save' : 'plus'}" class="w-4 h-4"></i> 
                            ${editingSvc ? 'Salvar Alterações' : 'Adicionar ao Catálogo'}
                        </button>

                    </div>

                    <!-- Lista de Serviços com Reordenação -->
                    <h3 class="text-xs font-bold text-muted-theme uppercase tracking-wider mt-6 mb-2 flex items-center gap-2">
                        Catálogo Atual
                        <span class="text-[9px] text-zinc-600 normal-case font-normal">— arraste ou use as setas para reordenar</span>
                    </h3>
                    <div class="space-y-3" id="services-sortable-list">
                        ${SERVICES.map((s, idx) => `
                            <div class="card-bg border border-theme rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-all group hover:border-amber-500 cursor-default" data-service-id="${s.id}">
                                <!-- Handle de arrasto -->
                                <div class="sortable-handle cursor-grab active:cursor-grabbing p-2 -ml-2 text-zinc-600 hover:text-amber-500 transition-colors flex-shrink-0">
                                    <i data-lucide="grip-vertical" class="w-5 h-5"></i>
                                </div>

                                <!-- Número de ordem (opcional, mas ajuda no visual) -->
                                <div class="w-6 h-6 rounded-lg input-bg border border-theme flex items-center justify-center text-[10px] font-black text-muted-theme flex-shrink-0">
                                    ${idx + 1}
                                </div>

                                <!-- Info do Serviço -->
                                <div class="flex-1 min-w-0">
                                    <h4 class="font-bold text-theme truncate">${App.escapeHTML(s.name)}</h4>
                                    <p class="text-xs text-muted-theme flex items-center gap-2 mt-1">
                                        <span class="text-amber-500 font-bold">${s.price}</span>
                                        <span class="opacity-50">•</span>
                                        <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${s.duration}</span>
                                    </p>
                                </div>

                                <!-- Ações -->
                                <div class="flex gap-2 flex-shrink-0">
                                    <button onclick="App.initEditService(${s.id})" class="p-2 input-bg text-amber-500 rounded-lg hover:bg-zinc-700 transition-colors border border-theme active:scale-95" title="Editar">
                                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                                    </button>
                                    <button onclick="App.removeService(${s.id})" class="p-2 input-bg text-red-500 rounded-lg hover:bg-zinc-700 transition-colors border border-theme active:scale-95" title="Remover">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (tab === 'schedules') {
            const selectedBarberId = this.state.adminScheduleBarberId || (this.state.role === 'barber' ? this.state.userProfile?.id : null);
            const viewMode = this.state.adminScheduleViewMode; // 'fixed' ou 'exceptions'
            const currentBarber = BARBERS.find(b => b.user_id === selectedBarberId);
            const selectedDay = this.state.adminScheduleDayOfWeek;
            const selectedDate = this.state.adminScheduleDate;

            const daysLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const fullDaysLabels = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

            const barberConfig = this.state.barberConfigs.find(c => c.barber_id === selectedBarberId) || { lunch_start: '12:00', lunch_end: '13:00' };

            contentHtml = `
                <div class="space-y-6 fade-in pb-10">
                    <!-- NOVO: Configuração Global da Casa (Sempre Visível) -->
                    <div class="card-bg rounded-2xl border border-theme p-5 space-y-4 shadow-xl">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            <h3 class="text-[10px] font-black uppercase text-theme tracking-[0.2em]">Semana de Trabalho (Dias Abertos)</h3>
                        </div>
                        
                        <div class="flex flex-wrap gap-2">
                            ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => {
                const isOpen = (this.state.shopSettings.working_days || [1, 2, 3, 4, 5, 6]).includes(idx);
                return `
                                    <button 
                                        onclick="App.toggleShopOpeningDay(${idx})"
                                        class="flex-1 min-w-[45px] py-3 rounded-xl text-[10px] font-black uppercase transition-all border border-theme ${isOpen ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' : 'input-bg text-muted-theme opacity-50'}"
                                    >
                                        ${day}
                                    </button>
                                `;
            }).join('')}
                        </div>
                        <p class="text-[9px] text-amber-500/60 font-medium pl-1 italic">Estes são os dias que a barbearia aparece disponível para os clientes.</p>
                    </div>

                    <!-- Janela de Disponibilidade -->
                    <div class="card-bg rounded-2xl border border-theme p-5 space-y-4 shadow-xl">
                        <div class="flex items-center gap-3 mb-1">
                            <div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            <h3 class="text-[10px] font-black uppercase text-theme tracking-[0.2em]">Janela de Disponibilidade</h3>
                        </div>
                        <p class="text-[9px] text-amber-500/60 font-medium pl-1 italic leading-relaxed">Quantos dias no futuro os clientes podem agendar a partir de hoje. Ex: 20 dias = somente do dia de hoje até 20 dias à frente.</p>
                        <div class="flex items-center gap-3">
                            <div class="relative flex-1">
                                <input
                                    type="number"
                                    id="shop-booking-window"
                                    min="1" max="365"
                                    value="${this.state.shopSettings?.booking_window_days || 30}"
                                    class="w-full input-bg border border-theme rounded-xl p-3 text-theme font-bold text-center focus:border-amber-500 outline-none"
                                />
                                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-theme text-[10px] font-black uppercase tracking-widest">dias</span>
                            </div>
                            <button onclick="App.saveBookingWindow(document.getElementById('shop-booking-window').value)" class="py-3 px-5 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs uppercase tracking-widest hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/20">
                                Salvar
                            </button>
                        </div>
                    </div>

                    <!-- Seleção de Barbeiro (Apenas Admin) -->
                    ${this.state.role === 'admin' ? `
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-black tracking-widest pl-1">Barbeiro</label>
                            <select onchange="App.setAdminScheduleBarber(this.value)" class="w-full card-bg border border-theme rounded-xl p-3 text-theme outline-none focus:border-amber-500">
                                <option value="" ${!selectedBarberId ? 'selected' : ''}>--- Selecione um Barbeiro ---</option>
                                ${BARBERS.map(b => `<option value="${b.user_id}" ${selectedBarberId === b.user_id ? 'selected' : ''}>${App.escapeHTML(b.name)}</option>`).join('')}
                            </select>
                        </div>
                    ` : ''}

                    ${!selectedBarberId ? `
                        <div class="text-center py-20 text-muted-theme">
                            <i data-lucide="user-plus" class="w-16 h-16 mx-auto mb-4 opacity-20"></i>
                            <p class="font-medium">Selecione um barbeiro para gerenciar a escala.</p>
                        </div>
                    ` : `

                        <!-- Toggle de Modo -->
                        <div class="flex gap-2 p-1 card-bg rounded-xl">
                            <button onclick="App.setState({ adminScheduleViewMode: 'fixed' })" class="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'fixed' ? 'bg-amber-500 text-zinc-950 shadow-lg' : 'text-muted-theme hover:text-theme'}">Escala Fixa (Semanal)</button>
                            <button onclick="App.setState({ adminScheduleViewMode: 'exceptions' })" class="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'exceptions' ? 'bg-amber-500 text-zinc-950 shadow-lg' : 'text-muted-theme hover:text-theme'}">Exceções (Feriados/...)</button>
                        </div>

                        ${viewMode === 'fixed' ? `
                            <!-- MODO ESCALA FIXA (novo sistema: horário início/fim + dias) -->
                            <div class="space-y-5 slide-in-right">

                                <!-- Horário por Dia da Semana -->
                                <div class="card-bg rounded-2xl border border-theme p-5 space-y-4">
                                    <div class="flex items-center justify-between">
                                        <h3 class="text-sm font-bold text-theme flex items-center gap-2">
                                            <i data-lucide="calendar-days" class="w-4 h-4 text-amber-500"></i>
                                            Horário por Dia da Semana
                                        </h3>
                                    </div>
                                    <p class="text-[10px] text-muted-theme italic">Configure início, fim e intervalo de almoço individualmente para cada dia.</p>

                                    <!-- Linha por dia da semana -->
                                    <div class="space-y-2">
                                        ${daysLabels.map((label, idx) => {
                                            const daySchedules = barberConfig.day_schedules || {};
                                            const dayCfg = daySchedules[idx] || {};
                                            const isClosed = dayCfg.closed === true;
                                            const dayStart = dayCfg.start || barberConfig.work_start || '09:00';
                                            const dayEnd = dayCfg.end || barberConfig.work_end || '18:00';
                                            const dayLunchStart = dayCfg.lunch_start || barberConfig.lunch_start || '12:00';
                                            const dayLunchEnd = dayCfg.lunch_end || barberConfig.lunch_end || '13:00';
                                            return `
                                            <div class="rounded-xl border ${isClosed ? 'border-theme/30 opacity-50' : 'border-theme'} input-bg transition-all overflow-hidden" id="day-row-${selectedBarberId}-${idx}">
                                                <div class="flex items-center gap-2 p-3">
                                                    <div class="w-9 text-center flex-shrink-0">
                                                        <span class="text-[10px] font-black uppercase ${isClosed ? 'text-muted-theme' : 'text-amber-500'}">${label}</span>
                                                    </div>
                                                    <div class="flex-1 grid grid-cols-2 gap-2 ${isClosed ? 'pointer-events-none opacity-40' : ''}">
                                                        <input type="time" id="day-start-${selectedBarberId}-${idx}" value="${dayStart}" class="w-full input-bg border border-theme rounded-lg p-2 text-theme outline-none focus:border-amber-500 text-xs font-bold" />
                                                        <input type="time" id="day-end-${selectedBarberId}-${idx}" value="${dayEnd}" class="w-full input-bg border border-theme rounded-lg p-2 text-theme outline-none focus:border-amber-500 text-xs font-bold" />
                                                    </div>
                                                    <label class="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                                                        <input type="checkbox" ${isClosed ? 'checked' : ''} onchange="App.toggleDayClosed('${selectedBarberId}', ${idx}, this.checked)" class="sr-only peer" />
                                                        <div class="relative w-9 h-5 input-bg rounded-full transition-all peer-checked:bg-red-500/70">
                                                            <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4 ${isClosed ? 'translate-x-4' : ''}"></div>
                                                        </div>
                                                        <span class="text-[9px] font-black uppercase ${isClosed ? 'text-red-400' : 'text-muted-theme'}">Fechado</span>
                                                    </label>
                                                </div>
                                                ${!isClosed ? `
                                                <div class="flex items-center gap-2 px-3 pb-3 pt-0">
                                                    <div class="w-9 flex-shrink-0 flex justify-center">
                                                        <i data-lucide="coffee" class="w-3 h-3 text-amber-500/50"></i>
                                                    </div>
                                                    <div class="flex-1 grid grid-cols-2 gap-2">
                                                        <input type="time" id="day-lunch-start-${selectedBarberId}-${idx}" value="${dayLunchStart}" class="w-full input-bg border border-amber-500/20 rounded-lg p-1.5 text-amber-400/70 outline-none focus:border-amber-500 text-xs font-bold" />
                                                        <input type="time" id="day-lunch-end-${selectedBarberId}-${idx}" value="${dayLunchEnd}" class="w-full input-bg border border-amber-500/20 rounded-lg p-1.5 text-amber-400/70 outline-none focus:border-amber-500 text-xs font-bold" />
                                                    </div>
                                                    <div class="flex-shrink-0 w-[5.5rem]"></div>
                                                </div>
                                                ` : ''}
                                            </div>`;
                                        }).join('')}
                                    </div>

                                    <button onclick="App.saveBarberDaySchedules('${selectedBarberId}')" class="w-full py-3.5 rounded-xl bg-amber-500 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 hover:bg-amber-400 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20">
                                        <i data-lucide="save" class="w-4 h-4"></i> Salvar Horários
                                    </button>
                                </div>
                            </div>
                        ` : `
                            <!-- MODO EXCEÇÕES -->
                            <div class="space-y-6 slide-in-right">
                                <!-- Card: Fechar o dia inteiro -->
                                <div class="card-bg rounded-2xl border border-theme p-5 space-y-4">
                                     <div class="space-y-2">
                                        <label class="text-[10px] text-muted-theme uppercase font-black tracking-widest pl-1">Escolher Data</label>
                                        <input type="date" value="${selectedDate}" onchange="App.setState({ adminScheduleDate: this.value })" class="w-full input-bg border border-theme rounded-xl p-3 text-theme outline-none focus:border-amber-500" />
                                    </div>

                                    ${selectedDate ? `
                                        <div class="pt-4 border-t border-theme space-y-4">
                                            <div class="flex items-center justify-between p-4 input-bg rounded-xl border border-theme">
                                                <div>
                                                    <h4 class="text-sm font-bold text-theme">Marcar como Fechado?</h4>
                                                    <p class="text-[10px] text-muted-theme">O barbeiro não aparecerá para agendamentos neste dia.</p>
                                                </div>
                                                <div class="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" ${this.state.barberExceptions.find(ex => ex.barber_id === selectedBarberId && ex.specific_date === selectedDate)?.is_closed ? 'checked' : ''} onchange="App.toggleBarberException('${selectedBarberId}', '${selectedDate}', this.checked)" class="sr-only peer">
                                                    <div class="w-11 h-6 input-bg border border-theme peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                                </div>
                                            </div>

                                            <div class="space-y-2 pt-4">
                                                <h4 class="text-xs font-bold text-muted-theme uppercase tracking-widest">Exceções Salvas</h4>
                                                <div class="space-y-2">
                                                    ${this.state.barberExceptions.filter(ex => ex.barber_id === selectedBarberId).map(ex => `
                                                        <div class="flex items-center justify-between p-3 card-bg border border-theme rounded-xl">
                                                            <div class="flex items-center gap-3">
                                                                <div class="p-2 rounded-lg ${ex.is_closed ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}">
                                                                    <i data-lucide="${ex.is_closed ? 'calendar-x' : 'calendar-check'}" class="w-4 h-4"></i>
                                                                </div>
                                                                <div>
                                                                    <p class="text-xs font-bold text-theme">${App.inputToDbDate(ex.specific_date)}</p>
                                                                    <p class="text-[10px] text-muted-theme">${ex.is_closed ? 'Dia Fechado' : 'Horário Customizado'}</p>
                                                                </div>
                                                            </div>
                                                            <button onclick="App.deleteBarberException('${selectedBarberId}', '${ex.specific_date}')" class="p-2 text-muted-theme hover:text-red-500 transition-colors">
                                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                                            </button>
                                                        </div>
                                                    `).join('')}
                                                    ${this.state.barberExceptions.filter(ex => ex.barber_id === selectedBarberId).length === 0 ? '<p class="text-[10px] text-muted-theme italic opacity-50 py-4 text-center">Nenhuma exceção cadastrada.</p>' : ''}
                                                </div>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>

                                <!-- Card: Bloqueio de Janela de Horário -->
                                <div class="card-bg rounded-2xl border border-orange-500/30 p-5 space-y-4 bg-orange-500/5">
                                    <div class="flex items-center gap-2">
                                        <div class="p-2 bg-orange-500/20 rounded-xl">
                                            <i data-lucide="clock-x" class="w-4 h-4 text-orange-400"></i>
                                        </div>
                                        <div>
                                            <h3 class="text-sm font-bold text-theme">Bloqueio de Janela de Horário</h3>
                                            <p class="text-[10px] text-orange-400/70">Bloqueia uma faixa de horários em um dia específico</p>
                                        </div>
                                    </div>

                                    <p class="text-[10px] text-muted-theme italic leading-relaxed">
                                        Use para imprevistos: bloqueie um período (ex: 14:00 às 16:00) sem fechar o dia inteiro. Os clientes não verão esses horários disponíveis.
                                    </p>

                                    <div class="space-y-3">
                                        <div class="space-y-1">
                                            <label class="text-[10px] text-muted-theme uppercase font-black tracking-widest">Data do Bloqueio</label>
                                            <input type="date" id="block-window-date-${selectedBarberId}" value="${selectedDate || ''}"
                                                class="w-full input-bg border border-theme rounded-xl p-3 text-theme outline-none focus:border-orange-400 text-sm" />
                                        </div>
                                        <div class="grid grid-cols-2 gap-3">
                                            <div class="space-y-1">
                                                <label class="text-[10px] text-muted-theme uppercase font-black tracking-widest">Início</label>
                                                <input type="time" id="block-window-start-${selectedBarberId}" value="14:00"
                                                    class="w-full input-bg border border-theme rounded-xl p-3 text-theme outline-none focus:border-orange-400 text-sm font-bold" />
                                            </div>
                                            <div class="space-y-1">
                                                <label class="text-[10px] text-muted-theme uppercase font-black tracking-widest">Fim</label>
                                                <input type="time" id="block-window-end-${selectedBarberId}" value="16:00"
                                                    class="w-full input-bg border border-theme rounded-xl p-3 text-theme outline-none focus:border-orange-400 text-sm font-bold" />
                                            </div>
                                        </div>
                                        <button onclick="App.addTimeBlockWindow('${selectedBarberId}')"
                                            class="w-full py-3 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 font-black text-xs uppercase tracking-widest hover:bg-orange-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                            <i data-lucide="plus-circle" class="w-4 h-4"></i> Criar Bloqueio
                                        </button>
                                    </div>

                                    <!-- Lista de bloqueios de janela existentes para o barbeiro selecionado -->
                                    ${(() => {
                                        const barberBlocks = (this.state.blockedTimesFull || [])
                                            .filter(b => b.barber_id === selectedBarberId && b.date)
                                            .reduce((acc, b) => {
                                                const key = b.date;
                                                if (!acc[key]) acc[key] = [];
                                                acc[key].push(b.blocked_time);
                                                return acc;
                                            }, {});

                                        const keys = Object.keys(barberBlocks).sort();
                                        if (keys.length === 0) return '<p class="text-[10px] text-muted-theme italic opacity-50 text-center pt-2">Nenhum bloqueio de horário cadastrado.</p>';

                                        return `
                                            <div class="space-y-2 pt-2 border-t border-orange-500/20">
                                                <p class="text-[10px] text-orange-400/70 font-black uppercase tracking-widest">Bloqueios Ativos</p>
                                                ${keys.map(date => {
                                                    const times = barberBlocks[date].sort();
                                                    const first = times[0];
                                                    const last = times[times.length - 1];
                                                    const [fh, fm] = last.split(':').map(Number);
                                                    const endMin = fh * 60 + fm + 5;
                                                    const endTime = String(Math.floor(endMin/60)).padStart(2,'0') + ':' + String(endMin%60).padStart(2,'0');
                                                    return `
                                                        <div class="flex items-center justify-between p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                                                            <div class="flex items-center gap-2.5">
                                                                <i data-lucide="clock-x" class="w-4 h-4 text-orange-400 flex-shrink-0"></i>
                                                                <div>
                                                                    <p class="text-xs font-bold text-theme">${App.inputToDbDate(date)}</p>
                                                                    <p class="text-[10px] text-orange-400/80">${first} – ${endTime} <span class="text-muted-theme">(${times.length} slots)</span></p>
                                                                </div>
                                                            </div>
                                                            <button onclick="App.removeTimeBlockWindow('${selectedBarberId}', '${date}')" class="p-2 text-muted-theme hover:text-red-500 transition-colors" title="Remover bloqueio">
                                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                                            </button>
                                                        </div>
                                                    `;
                                                }).join('')}
                                            </div>
                                        `;
                                    })()}
                                </div>
                            </div>
                        `}
                    `}
                </div>
            `;
        } else if (tab === 'accounts') {
            const roleLabels = {
                'client': 'Cliente',
                'barber': 'Barbeiro (Equipe)',
                'manager': 'Gerente',
                'admin': 'Administrador'
            };

            contentHtml = `
                <div class="space-y-4 fade-in">
                    <div class="input-bg/50 border border-theme/50 rounded-xl p-4 mb-2 flex items-start gap-3">
                        <i data-lucide="shield" class="w-5 h-5 text-muted-theme mt-0.5"></i>
                        <p class="text-xs text-muted-theme font-medium leading-relaxed">
                            Apenas usuários com nível <b>Admin</b> podem alterar permissões. Promover para Barbeiro já cadastra na equipe.
                        </p>
                    </div>
                    
                    <div class="space-y-3">
                        ${CLIENTES.length === 0 ? `
                            <div class="p-12 text-center text-muted-theme space-y-3 fade-in">
                                <i data-lucide="refresh-cw" class="w-8 h-8 mx-auto animate-spin opacity-20"></i>
                                <p class="text-xs font-bold tracking-widest uppercase opacity-40">Buscando Contas...</p>
                            </div>
                        ` : CLIENTES.map(c => `
                            <div class="card-bg border border-theme/50 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full input-bg flex items-center justify-center border border-theme font-bold text-theme overflow-hidden">
                                        ${c.avatar ? `
                                            <img src="${c.avatar}" class="w-full h-full object-cover" />
                                        ` : (c.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-theme text-sm">${c.name || 'Usuário Sem Nome'}</h4>
                                        <p class="text-[10px] text-muted-theme tracking-wide">${c.email || c.phone || 'Sem contato'}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 w-full md:w-auto">
                                    <select id="role-select-${c.id}" class="flex-1 md:w-auto card-bg border border-theme rounded-lg p-2 text-xs text-theme focus:border-amber-500 outline-none">
                                        <option value="client" ${c.role === 'client' ? 'selected' : ''}>Cliente</option>
                                        <option value="barber" ${c.role === 'barber' ? 'selected' : ''}>Barbeiro</option>
                                        <option value="manager" ${c.role === 'manager' ? 'selected' : ''}>Gerente</option>
                                        <option value="admin" ${c.role === 'admin' ? 'selected' : ''}>Admin</option>
                                    </select>
                                    ${this.state.role === 'admin' ? `
                                        <button onclick="App.updateUserRole('${c.id}', document.getElementById('role-select-${c.id}').value, '${App.escapeHTML(c.name)}', '${c.avatar || ''}')" class="p-2 bg-amber-500 text-zinc-950 rounded-lg hover:bg-amber-400 transition-colors shadow-sm font-bold text-xs active:scale-95 whitespace-nowrap">
                                            Salvar
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (tab === 'clients') {
            const sortedClients = [...CLIENTES].sort((a, b) => (b.cut_count || 0) - (a.cut_count || 0));

            contentHtml = `
                    <div class="space-y-4 pb-4">
                        <div class="relative w-full">
                            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-theme"></i>
                            <input oninput="App.filterGestaoClients(this.value)" type="text" placeholder="Buscar por cliente, telefone..." class="w-full card-bg border border-theme rounded-xl py-3 pl-10 pr-4 text-theme text-sm focus:border-amber-500 outline-none transition-colors shadow-inner" />
                        </div>
                        <div class="space-y-3" id="admin-clients-list">
                        ${sortedClients.length === 0 ? `
                             <div class="p-12 text-center text-muted-theme space-y-3 fade-in">
                                <i data-lucide="cloud-lightning" class="w-8 h-8 mx-auto opacity-20"></i>
                                <p class="text-[10px] font-bold tracking-widest uppercase opacity-40">Nenhum cliente...</p>
                            </div>
                        ` : sortedClients.map(client => `
                            <div class="client-gestao-card card-bg rounded-2xl border ${client.is_paused ? 'border-rose-500/40' : 'border-theme/50'} p-4 shadow-sm flex flex-col gap-4 hover:border-zinc-600 transition-colors" data-search="${App.escapeHTML(client.name)} ${client.phone} ${client.email}">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-full ${client.is_paused ? 'bg-rose-500/10 border border-rose-500/30' : 'input-bg border border-theme'} flex items-center justify-center font-bold ${client.is_paused ? 'text-rose-400' : 'text-amber-500'} text-lg">
                                        ${(client.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2">
                                            <h3 class="font-bold text-theme text-base truncate">${client.name || 'Usuário'}</h3>
                                            ${client.is_paused ? '<span class="text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full flex-shrink-0">Pausado</span>' : ''}
                                        </div>
                                        <p class="text-muted-theme text-[10px] flex items-center gap-1.5 mt-0.5 truncate uppercase tracking-tighter">
                                            <i data-lucide="phone" class="w-3 h-3 text-muted-theme"></i> ${client.phone || client.email || 'Sem contato'}
                                        </p>
                                    </div>
                                    <div class="text-right flex-shrink-0">
                                        <div class="inline-flex flex-col items-center justify-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-2 py-1 min-w-[45px]">
                                            <span class="text-amber-500 font-bold text-xs leading-none">${client.cut_count || 0}</span>
                                            <span class="text-[8px] text-amber-500/80 font-black uppercase mt-0.5 tracking-tighter">Serviço(s)</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex gap-2 pt-3 border-t border-theme">
                                    <a href="https://wa.me/${App.formatWA(client.phone || client.email)}" target="_blank" class="flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-xs font-bold border border-[#25D366]/10">
                                        <i data-lucide="message-square" class="w-4 h-4"></i> Whats
                                    </a>
                                    <a href="tel:+${App.formatWA(client.phone || client.email)}" class="flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 input-bg text-theme hover:bg-zinc-700 border border-theme transition-colors text-xs font-bold">
                                        <i data-lucide="phone" class="w-4 h-4"></i> Ligar
                                    </a>
                                    <button onclick="App.toggleClientPause('${client.id}', ${!!client.is_paused}, '${App.escapeHTML(client.name)}')" class="flex-none py-2 px-3 ${client.is_paused ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'} rounded-lg flex items-center justify-center transition-colors" title="${client.is_paused ? 'Reativar cliente' : 'Pausar cliente'}">
                                        <i data-lucide="${client.is_paused ? 'play-circle' : 'pause-circle'}" class="w-4 h-4"></i>
                                    </button>
                                    ${this.state.role === 'admin' ? `
                                    <button onclick="App.adminDeleteUser('${client.id}', '${App.escapeHTML(client.name)}')" class="flex-none py-2 px-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/20 transition-colors" title="Excluir Cliente">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } else if (tab === 'financeiro') {
            const stats = this.getAnalytics();
            const commissionRate = (this.state.shopSettings?.commission_rate || 50) / 100;
            const txs = this.state.completedTransactions || [];
            const payouts = this.state.payouts || [];

            contentHtml = `
                <div class="space-y-6 fade-in">
                    <!-- Configurações Financeiras -->
                    ${this.state.role === 'admin' ? `
                        <div class="card-bg border border-amber-500/20 p-5 rounded-3xl shadow-xl flex items-center gap-4 bg-amber-500/5">
                            <div class="flex-1">
                                <label class="text-xs font-black text-amber-500 uppercase tracking-widest block mb-1">Repasse ao Barbeiro (%)</label>
                                <p class="text-[10px] text-amber-500/70 italic leading-relaxed">Define quanto do valor total o barbeiro recebe. Salva automaticamente.</p>
                            </div>
                            <div class="relative w-24 flex-shrink-0">
                                <input type="number" id="finance-commission" onchange="App.updateCommissionRate(this.value)" value="${this.state.shopSettings?.commission_rate || 100}" min="0" max="100" class="w-full card-bg border border-amber-500/30 rounded-xl p-3 text-amber-500 font-black text-center focus:border-amber-500 outline-none shadow-inner" />
                                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500/50 font-black text-xs">%</div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Resumo Global de Dívida -->
                    <div class="card-bg border border-theme p-5 rounded-3xl shadow-xl relative overflow-hidden">
                        <div class="flex justify-between items-start z-10 relative">
                            <div>
                                <p class="text-[10px] uppercase font-black text-muted-theme tracking-widest mb-1">Total Pendente de Repasse</p>
                                <h3 class="text-3xl font-bold text-theme">R$ ${stats?.pendingBalance.toFixed(2).replace('.', ',') || '0,00'}</h3>
                                <p class="text-[9px] text-muted-theme mt-2 italic">Comissões não quitadas menos adiantamentos.</p>
                            </div>
                            <button onclick="App.confirmGlobalReset()" class="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-red-500/5 group" title="Zerar todos os repasses e reiniciar saldo">
                                <i data-lucide="power" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Lista de Barbeiros e Saldos -->
                    <div class="space-y-4">
                        <h3 class="text-sm font-bold text-theme uppercase tracking-wider flex items-center gap-2">
                            <i data-lucide="users" class="w-4 h-4 text-amber-500"></i> Saldos por Profissional
                        </h3>
                        
                        <div class="space-y-3">
                            ${BARBERS.map(b => {
                const bTxs = txs.filter(t => String(t.barberId) === String(b.user_id) && !t.isSettled);
                const bEarnings = bTxs.reduce((s, t) => s + (t.numericValue * commissionRate), 0);

                const bPayouts = payouts.filter(p => String(p.barber_id) === String(b.user_id));
                const lastBFull = bPayouts.find(p => p.type === 'full');
                const lastBFullTime = lastBFull ? new Date(lastBFull.payout_date).getTime() : 0;

                const bAdvances = bPayouts.filter(p => p.type === 'advance' && new Date(p.payout_date).getTime() > lastBFullTime).reduce((s, p) => s + Number(p.amount), 0);
                const bFinalBalance = Math.max(0, bEarnings - bAdvances);

                return `
                                    <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm flex items-center justify-between gap-3 hover:border-amber-500/30 transition-all">
                                        <div class="min-w-0">
                                            <p class="font-bold text-theme text-sm truncate">${App.escapeHTML(b.name)}</p>
                                            <p class="text-[10px] text-muted-theme uppercase font-black tracking-tighter mt-0.5">Saldo: <span class="text-amber-500">R$ ${bFinalBalance.toFixed(2).replace('.', ',')}</span></p>
                                        </div>
                                        <div class="flex gap-2">
                                            <button onclick="App.openPayoutModal('${b.user_id}', '${App.escapeHTML(b.name)}', ${bFinalBalance})" class="px-3 py-2 bg-amber-500 text-zinc-950 text-[10px] font-black uppercase rounded-lg shadow-theme active:scale-95 transition-all">
                                                Pagar
                                            </button>
                                        </div>
                                    </div>
                                `;
            }).join('')}
                        </div>
                    </div>

                    <!-- Histórico de Repasses -->
                    <div class="space-y-4 pt-4 border-t border-theme">
                        <h3 class="text-sm font-bold text-theme uppercase tracking-wider flex items-center gap-2">
                            <i data-lucide="history" class="w-4 h-4 text-muted-theme"></i> Histórico de Pagamentos
                        </h3>
                        <div class="space-y-2">
                            ${(() => {
                    const activePayouts = payouts.filter(p => BARBERS.some(b => String(b.user_id) === String(p.barber_id)));
                    if (activePayouts.length === 0) {
                        return '<p class="text-xs text-muted-theme text-center py-4 italic">Nenhum pagamento registrado na base de ativos.</p>';
                    }
                    return activePayouts.slice(0, 10).map(p => {
                        const barber = BARBERS.find(b => String(b.user_id) === String(p.barber_id));
                        return `
                                        <div class="card-bg border border-theme/50 p-3 rounded-xl flex items-center justify-between">
                                            <div class="text-[10px]">
                                                <p class="font-bold text-theme uppercase tracking-tighter">${App.escapeHTML(barber.name)}</p>
                                                <p class="text-muted-theme mt-0.5">${new Date(p.payout_date).toLocaleDateString()} • ${p.type === 'full' ? 'QUITAÇÃO' : 'ADIANTAMENTO'}</p>
                                            </div>
                                            <p class="font-black text-amber-500 text-sm">R$ ${p.amount.toFixed(2).replace('.', ',')}</p>
                                        </div>
                                    `;
                    }).join('');
                })()}
                        </div>
                    </div>

                    <!-- HARD RESET WIPE BANCO -->
                    <div class="mt-8 p-4 border border-red-900 bg-red-500/5 rounded-2xl">
                        <h4 class="text-sm font-bold text-red-500 flex items-center gap-2 mb-2"><i data-lucide="alert-triangle" class="w-4 h-4"></i> Zona de Perigo</h4>
                        <p class="text-[10px] text-muted-theme mb-4 text-balance leading-relaxed">Apagar todo o faturamento, agendamentos e histórico de pagamentos no banco de dados. Use isso <b>apenas quando for inaugurar o sistema limpo</b> para abrir para os barbeiros. O botão ZERAR lá no topo quita as dívidas mas mantém o Faturamento.</p>
                        <button onclick="App.confirmWipeDatabase()" class="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-500 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-500 hover:text-theme transition-all shadow-md shadow-red-500/20 active:scale-95 border border-red-500/20">
                            <i data-lucide="bomb" class="w-4 h-4"></i> APAGAR TUDO (INICIAR APLICATIVO)
                        </button>
                    </div>
                </div>
            `;
        } else if (tab === 'estoque') {
            contentHtml = `
                <div class="space-y-6 fade-in">
                    <!-- Gerenciar Categorias -->
                    <div class="card-bg border border-theme p-5 rounded-3xl shadow-xl">
                        <h3 class="text-sm font-bold text-theme uppercase tracking-wider mb-4 flex items-center gap-2">
                            <i data-lucide="tags" class="w-4 h-4 text-amber-500"></i> Categorias de Comanda
                        </h3>
                        <div class="flex gap-2 mb-4">
                            <input type="text" id="new-category-name" placeholder="Ex: Bebidas, Pomadas..." class="flex-1 input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors text-sm" />
                            <button onclick="App.addCategory(document.getElementById('new-category-name').value)" class="bg-amber-500 text-zinc-950 px-4 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-theme">
                                Adicionar
                            </button>
                        </div>
                        <div class="space-y-2">
                            ${CATEGORIES.length === 0 ? '<p class="text-xs text-muted-theme italic">Nenhuma categoria cadastrada.</p>' : CATEGORIES.map(c => `
                                <div class="flex justify-between items-center input-bg p-3 rounded-xl border border-theme/50 hover:border-amber-500/30 transition-colors">
                                    <span class="font-bold text-theme text-sm">${c.name}</span>
                                    <button onclick="App.deleteCategory('${c.id}')" class="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Gerenciar Produtos -->
                    <div class="card-bg border border-theme p-5 rounded-3xl shadow-xl">
                        <h3 class="text-sm font-bold text-theme uppercase tracking-wider mb-4 flex items-center gap-2">
                            <i data-lucide="package" class="w-4 h-4 text-amber-500"></i> Produtos
                        </h3>
                        ${CATEGORIES.length === 0 ? `
                            <p class="text-xs text-amber-500 italic">Crie uma categoria primeiro para adicionar produtos.</p>
                        ` : `
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div class="space-y-1 col-span-2 md:col-span-1">
                                    <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Nome *</label>
                                    <input type="text" id="new-product-name" placeholder="Ex: Heineken LN" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors text-sm" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Preço (R$) *</label>
                                    <input type="number" id="new-product-price" placeholder="10.00" step="0.01" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors text-sm" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Categoria *</label>
                                    <select id="new-product-category" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors text-sm appearance-none cursor-pointer">
                                        <option value="">Selecione...</option>
                                        ${CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Estoque inicial</label>
                                    <input type="number" id="new-product-stock" placeholder="∞ ilimitado" min="0" step="1" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors text-sm" />
                                </div>
                            </div>
                            <button onclick="App.addProduct(document.getElementById('new-product-name').value, document.getElementById('new-product-price').value, document.getElementById('new-product-category').value, document.getElementById('new-product-stock').value)" class="w-full bg-amber-500 text-zinc-950 py-3 rounded-xl font-black uppercase tracking-wider hover:bg-amber-400 active:scale-[0.98] transition-all shadow-theme mb-6">
                                + Adicionar Produto
                            </button>
                        `}

                        <div class="space-y-3">
                            ${CATEGORIES.map(cat => {
                const catProducts = PRODUCTS.filter(p => p.category_id === cat.id);
                if (catProducts.length === 0) return '';
                return `
                                    <div class="mb-4 last:mb-0">
                                        <h4 class="text-[11px] text-muted-theme uppercase font-black tracking-widest mb-2 px-1 border-b border-theme/50 pb-1">${cat.name}</h4>
                                        <div class="space-y-2">
                                            ${catProducts.map(p => `
                                                ${this.state.editingProductId === p.id ? `
                                                    <div class="flex flex-col gap-2 input-bg p-3 rounded-xl border border-amber-500/50 w-full fade-in">
                                                        <div class="flex gap-2">
                                                            <input type="text" id="edit-prod-name-${p.id}" value="${App.escapeHTML(p.name)}" placeholder="Nome" class="flex-1 input-bg border border-theme rounded p-1.5 text-xs text-theme focus:border-amber-500 outline-none" />
                                                            <input type="number" id="edit-prod-price-${p.id}" value="${p.price.toFixed(2)}" step="0.01" class="w-20 input-bg border border-theme rounded p-1.5 text-xs text-theme focus:border-amber-500 outline-none" />
                                                            <input type="number" id="edit-prod-stock-${p.id}" value="${p.stock_quantity != null ? p.stock_quantity : ''}" placeholder="∞" min="0" step="1" title="Estoque (vazio = ilimitado)" class="w-16 input-bg border border-theme rounded p-1.5 text-xs text-theme focus:border-amber-500 outline-none" />
                                                        </div>
                                                        <div class="flex justify-between items-center mt-1">
                                                            <select id="edit-prod-cat-${p.id}" class="input-bg border border-theme rounded p-1.5 text-xs text-theme max-w-[150px] focus:border-amber-500 outline-none">
                                                                ${CATEGORIES.map(c => `<option value="${c.id}" ${c.id === p.category_id ? 'selected' : ''}>${c.name}</option>`).join('')}
                                                            </select>
                                                            <div class="flex gap-1">
                                                                <button onclick="App.updateProduct('${p.id}', document.getElementById('edit-prod-name-${p.id}').value, document.getElementById('edit-prod-price-${p.id}').value, document.getElementById('edit-prod-cat-${p.id}').value, document.getElementById('edit-prod-stock-${p.id}').value)" class="p-1.5 bg-emerald-500 text-zinc-950 rounded hover:bg-emerald-400">
                                                                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                                                                </button>
                                                                <button onclick="App.cancelEditProduct()" class="p-1.5 input-bg border border-theme text-muted-theme rounded hover:border-amber-500/40 transition-colors">
                                                                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ` : `
                                                <div class="flex justify-between items-center input-bg p-3 rounded-xl border border-theme/50 hover:border-amber-500/30 transition-colors w-full">
                                                    <div class="flex flex-col">
                                                        <span class="font-bold text-theme text-sm">${App.escapeHTML(p.name)}</span>
                                                        <span class="text-xs text-emerald-500 font-bold">R$ ${p.price.toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${p.stock_quantity === 0 ? 'bg-rose-500/15 text-rose-400' : p.stock_quantity != null && p.stock_quantity <= 3 ? 'bg-amber-500/15 text-amber-400' : 'border border-theme text-muted-theme'}">
                                                            ${p.stock_quantity != null ? p.stock_quantity + ' un' : '∞'}
                                                        </span>
                                                        <button onclick="App.initEditProduct('${p.id}')" class="text-amber-500 hover:bg-amber-500/10 p-2 rounded-lg transition-colors">
                                                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                                                        </button>
                                                        <button onclick="App.deleteProduct('${p.id}')" class="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors">
                                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                `}
                                            `).join('')}
                                        </div>
                                    </div>
                                `;
            }).join('')}
                            ${PRODUCTS.length === 0 ? '<p class="text-xs text-muted-theme italic text-center py-4">Nenhum produto cadastrado.</p>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }


        return `
            <div class="space-y-6 fade-in slide-in-up pb-6">
                <!-- Cabeçalho -->
                <div class="flex items-center justify-between mb-4 border-b border-theme/50 pb-4">
                    <div>
                        <h2 class="text-2xl font-bold text-theme flex items-center gap-2"><i data-lucide="shield-check" class="w-6 h-6 text-amber-500"></i> Painel ${this.state.role === 'admin' ? 'Admin' : 'Equipe'}</h2>
                        <p class="text-xs text-muted-theme mt-1">Gestão de sistema e atendimentos.</p>
                    </div>
                    <button onclick="App.toggleShopManagement()" class="p-2 input-bg rounded-lg text-muted-theme hover:text-theme border border-theme shadow-sm transition-colors active:scale-95">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Abas da Gestão -->
                <div class="flex gap-2 p-1 card-bg rounded-xl overflow-x-auto scrollbar-hide border border-theme">
                    <button onclick="App.setAdminShopTab('barbers')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'barbers' ? 'input-bg text-amber-500 shadow-sm' : 'text-muted-theme hover:text-theme'}">
                        <i data-lucide="users" class="w-3.5 h-3.5"></i> Equipe
                    </button>
                    <button onclick="App.setAdminShopTab('services')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'services' ? 'input-bg text-amber-500 shadow-sm' : 'text-muted-theme hover:text-theme'}">
                        <i data-lucide="scissors" class="w-3.5 h-3.5"></i> Serviços
                    </button>
                    <button onclick="App.setAdminShopTab('clients')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'clients' ? 'input-bg text-amber-500 shadow-sm' : 'text-muted-theme hover:text-theme'}">
                        <i data-lucide="contact" class="w-3.5 h-3.5"></i> Clientes
                    </button>
                    <button onclick="App.setAdminShopTab('schedules')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'schedules' ? 'input-bg text-amber-500 shadow-sm' : 'text-muted-theme hover:text-theme'}">
                        <i data-lucide="clock" class="w-3.5 h-3.5"></i> Horários
                    </button>
                    <button onclick="App.setAdminShopTab('accounts')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'accounts' ? 'input-bg text-amber-500 shadow-sm' : 'text-muted-theme hover:text-theme'}">
                        <i data-lucide="shield" class="w-3.5 h-3.5"></i> Contas
                    </button>
                    <button onclick="App.setAdminShopTab('financeiro')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'financeiro' ? 'input-bg text-amber-500 shadow-sm' : 'text-muted-theme hover:text-theme'}">
                        <i data-lucide="wallet" class="w-3.5 h-3.5"></i> Financeiro
                    </button>
                    <button onclick="App.setAdminShopTab('estoque')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'estoque' ? 'input-bg text-amber-500 shadow-sm' : 'text-muted-theme hover:text-theme'}">
                        <i data-lucide="package" class="w-3.5 h-3.5"></i> Estoque
                    </button>
                </div>

                <!-- Conteúdo Tab -->
                <div class="mt-4">
                    ${contentHtml}
                </div>
            </div>
        `;
    },

    renderPerfil() {
        const isBarber = this.state.role === 'barber';
        const isEditing = this.state.isEditingProfile;
        const userName = this.state.userProfile?.name || 'Cliente';
        const initial = (userName[0] || 'U').toUpperCase();

        const roleInfo = {
            'admin': { label: 'Administrador', color: 'bg-amber-500/10 text-amber-500', icon: 'shield-check' },
            'manager': { label: 'Gerente', color: 'bg-sky-500/10 text-sky-500', icon: 'star' },
            'barber': { label: 'Barbeiro', color: 'bg-emerald-500/10 text-emerald-500', icon: 'scissors' },
            'client': { label: 'Cliente', color: 'bg-zinc-500/10 text-muted-theme', icon: 'user' }
        };
        const currentRole = roleInfo[this.state.role] || roleInfo['client'];

        if (isEditing) {
            const avatarUrl = this.state.userProfile?.avatar;
            const isUploading = this.state.isUploadingAvatar;

            return `
                <div class="space-y-6 fade-in pb-6">
                    <div class="flex flex-col items-center text-center">
                        <div class="relative group">
                            <div class="w-24 h-24 input-bg rounded-full flex items-center justify-center border-4 border-amber-500/20 mb-4 shadow-xl shadow-amber-500/10 overflow-hidden">
                                ${avatarUrl ? `
                                    <img src="${avatarUrl}" class="w-full h-full object-cover" />
                                ` : `
                                    <span class="text-3xl font-black text-amber-500/30">${initial}</span>
                                `}

                                ${isUploading ? `
                                    <div class="absolute inset-0 bg-zinc-950/60 flex items-center justify-center">
                                        <div class="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <label for="avatar-input" class="absolute bottom-4 right-0 w-8 h-8 bg-amber-500 text-zinc-950 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-amber-400 transition-colors border-4 border-zinc-900">
                                <i data-lucide="camera" class="w-4 h-4"></i>
                                <input type="file" id="avatar-input" class="hidden" accept="image/*" onchange="App.handleAvatarUpload(event)" ${isUploading ? 'disabled' : ''}/>
                            </label>
                        </div>
                        <h2 class="text-2xl font-bold text-theme italic">Editando Perfil</h2>
                    </div>

                    <div class="card-bg rounded-2xl border border-theme p-6 space-y-5 shadow-xl">
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Nome Completo</label>
                            <input type="text" id="edit-name" value="${this.state.userProfile?.name || ''}" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Celular (Novo Celular = Novo Login)</label>
                            <input type="tel" id="edit-phone" inputmode="numeric" value="${this.state.userProfile?.phone || ''}" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">CPF</label>
                                <input type="tel" id="edit-cpf" inputmode="numeric" value="${this.state.userProfile?.cpf || ''}" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Nascimento</label>
                                <input type="date" id="edit-birth" value="${this.dbToInputDate(this.state.userProfile?.birth_date)}" class="w-full input-bg border border-theme rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button onclick="App.toggleProfileEdit()" class="flex-1 py-4 rounded-xl font-bold transition-all duration-200 input-bg text-muted-theme hover:bg-zinc-700 border border-theme">
                            Cancelar
                        </button>
                        <button onclick="App.saveProfileChanges()" class="flex-1 py-4 rounded-xl font-bold transition-all duration-200 bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md shadow-amber-500/20">
                            Confirmar Mudanças
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-6 fade-in pb-6">
                <div class="flex flex-col items-center text-center">
                    <div class="w-24 h-24 input-bg rounded-full flex items-center justify-center border-4 border-zinc-950 mb-4 shadow-xl shadow-amber-500/10 relative overflow-hidden">
                        ${this.state.userProfile?.avatar ? `
                            <img src="${this.state.userProfile.avatar}" class="w-full h-full object-cover" />
                        ` : `
                            <span class="text-4xl font-black text-amber-500">${initial}</span>
                        `}
                    </div>
                    <div class="flex items-center gap-2">
                        <h2 class="text-2xl font-bold text-theme">${userName}</h2>
                        <button onclick="App.toggleProfileEdit()" class="p-1.5 text-muted-theme hover:text-amber-500 transition-colors input-bg/50 rounded-lg">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <p class="font-medium uppercase tracking-widest text-[10px] px-3 py-1 rounded-full mt-2 flex items-center gap-1.5 ${currentRole.color}">
                        <i data-lucide="${currentRole.icon}" class="w-3 h-3"></i> ${currentRole.label}
                    </p>
                </div>

                <!-- Dados Pessoais -->
                <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm space-y-4">
                    <div class="flex items-center gap-4 text-theme p-2 border-b border-theme/50">
                        <i data-lucide="smartphone" class="w-5 h-5 text-muted-theme"></i>
                        <div class="flex-1">
                            <p class="text-xs text-muted-theme uppercase font-bold tracking-wider">Celular</p>
                            <p class="text-sm font-medium text-theme">${this.state.userProfile?.phone || ''}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex items-center gap-3 text-theme p-2">
                             <i data-lucide="credit-card" class="w-5 h-5 text-muted-theme"></i>
                             <div class="flex-1">
                                <p class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">CPF</p>
                                <p class="text-xs text-theme font-medium">${this.state.userProfile?.cpf || '---'}</p>
                             </div>
                        </div>
                        <div class="flex items-center gap-3 text-theme p-2">
                             <i data-lucide="calendar" class="w-5 h-5 text-muted-theme"></i>
                             <div class="flex-1">
                                <p class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Nascimento</p>
                                <p class="text-xs text-theme font-medium">${this.state.userProfile?.birth_date || '---'}</p>
                             </div>
                        </div>
                    </div>
                </div>

            </div>
        `;
    },

    renderConfiguracoes() {
        return `
            <div class="space-y-6 fade-in">
                <h2 class="text-2xl font-bold text-theme mb-6">Configurações</h2>

                <div class="card-bg rounded-2xl border border-theme p-6 shadow-sm flex items-center gap-4 mb-8">
                    <div class="input-bg p-3 rounded-full text-muted-theme">
                        <i data-lucide="shield-check" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <p class="text-theme font-bold">Conexão Segura</p>
                        <p class="text-xs text-muted-theme">Dados protegidos</p>
                    </div>
                </div>

                <div class="space-y-2 mt-8">
                    <h3 class="text-sm font-medium text-muted-theme uppercase tracking-wider mb-2">Preferências</h3>
                    <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm divide-y divide-theme">
                        <div class="flex items-center justify-between py-3" onclick="App.requestNotificationPermission()">
                            <div class="flex items-center gap-3">
                                <i data-lucide="bell" class="w-5 h-5 text-muted-theme"></i>
                                <span class="text-theme">Notificações Push</span>
                            </div>
                            <div class="w-10 h-6 ${Notification.permission === 'granted' ? 'bg-amber-500' : 'input-bg'} rounded-full flex items-center p-1 cursor-pointer transition-colors">
                                <div class="w-4 h-4 card-bg rounded-full ${Notification.permission === 'granted' ? 'translate-x-4' : 'translate-x-0'} shadow-sm transition-transform"></div>
                            </div>
                        </div>
                        <div class="py-3">
                            <div class="flex items-center gap-3 mb-3">
                                <i data-lucide="palette" class="w-5 h-5 text-muted-theme"></i>
                                <span class="text-theme font-medium">Tema</span>
                            </div>
                            <div class="grid grid-cols-4 gap-2">
                                ${(() => {
                                    const themes = [
                                        { id: 'dark',   label: 'Escuro',  bg: '#18181b', border: '#3f3f46', dot: '#f59e0b', text: '#e4e4e7' },
                                        { id: 'light',  label: 'Claro',   bg: '#f7f5f0', border: '#ddd8ce', dot: '#f59e0b', text: '#1c1917' },
                                        { id: 'green',  label: 'Verde',   bg: '#f0f8f1', border: '#b8ddc2', dot: '#16a34a', text: '#1a3022' },
                                        { id: 'pink',   label: 'Rosa',    bg: '#fdf2f5', border: '#f0c5d6', dot: '#ec4899', text: '#3a1025' },
                                        { id: 'blue',   label: 'Azul',    bg: '#eff6fc', border: '#b8d5ee', dot: '#3b82f6', text: '#0f2540' },
                                        { id: 'yellow', label: 'Dourado', bg: '#fdf9ec', border: '#e5d280', dot: '#ca8a04', text: '#3a2800' },
                                        { id: 'brown',  label: 'Café',    bg: '#f8f0e8', border: '#d8bc98', dot: '#92400e', text: '#2a1500' },
                                        { id: 'red',    label: 'Rubi',    bg: '#fdf0ee', border: '#f0b5ae', dot: '#ef4444', text: '#3a0808' },
                                    ];
                                    return themes.map(t => {
                                        const isActive = this.state.theme === t.id;
                                        return `
                                            <button onclick="App.setTheme('${t.id}')"
                                                    style="background:${t.bg}; border-color:${isActive ? t.dot : t.border};"
                                                    class="relative rounded-xl border-2 p-2 flex flex-col items-center justify-center gap-1.5 h-16 transition-all active:scale-95${isActive ? ' shadow-lg' : ''}">
                                                <div style="background:${t.dot}" class="w-5 h-5 rounded-full shadow-sm"></div>
                                                <span style="color:${t.text}" class="text-[9px] font-bold leading-none">${t.label}</span>
                                                ${isActive ? `<div class="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center" style="background:${t.dot}"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg></div>` : ''}
                                            </button>
                                        `;
                                    }).join('');
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-3 mt-8">
                    <button onclick="App.logout()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-transparent border border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500">
                        <i data-lucide="log-out" class="w-5 h-5"></i> Sair da Conta
                    </button>
                    ${this.state.role === 'client' ? `
                    <button onclick="App.deleteAccount()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-transparent text-muted-theme hover:bg-red-500/10 hover:text-red-500">
                        <i data-lucide="trash-2" class="w-5 h-5"></i> Excluir Conta Permanentemente
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderSplash() {
        const s = this.state.shopSettings;
        return `
            <div class="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-[300] fade-in-fast">
                <div class="relative">
                    <div class="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                    <div class="w-32 h-32 rounded-3xl overflow-hidden card-bg border-2 border-amber-500/20 shadow-2xl relative z-10 flex items-center justify-center animate-bounce-subtle">
                        ${s?.logo_url ? `
                            <img src="${s.logo_url}" class="w-full h-full object-cover" />
                        ` : `
                            <i data-lucide="scissors" class="w-16 h-16 text-amber-500"></i>
                        `}
                    </div>
                </div>
                
                <div class="mt-8 text-center space-y-2">
                    <h2 class="text-xl font-bold text-theme tracking-widest uppercase italic logo-font">${s?.name || 'Carregando...'}</h2>
                    <div class="flex items-center justify-center gap-1.5">
                        <div class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                    </div>
                </div>

                <style>
                    @keyframes bounce-subtle {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                    .animate-bounce-subtle {
                        animation: bounce-subtle 2s ease-in-out infinite;
                    }
                </style>
            </div>
        `;
    },

    // ============================================================
    // VIEWS DE PLANOS
    // ============================================================

    renderPlanos() {
        const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);
        if (isStaff) {
            if (this.state.isCreatingPlan) return this.renderPlanForm();
            if (this.state.assigningPlanId) return this.renderPlanAssignModal();
            return this.renderPlanosStaff();
        }
        return this.renderPlanosClient();
    },

    renderPlanosClient() {
        const clientPlan = this.getActiveClientPlan();
        const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const todayDow = new Date().getDay();

        if (!clientPlan || !clientPlan.plan) {
            return `
            <div class="space-y-6 fade-in-fast">
                <div>
                    <h2 class="text-2xl font-bold text-theme">Meu Plano</h2>
                    <p class="text-xs text-muted-theme mt-0.5">Benefícios exclusivos para você</p>
                </div>
                <div class="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div class="w-20 h-20 input-bg border border-theme rounded-full flex items-center justify-center">
                        <i data-lucide="tag" class="w-10 h-10 text-muted-theme"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-theme">Nenhum plano ativo</h3>
                        <p class="text-xs text-muted-theme mt-1 max-w-xs">Fale com seu barbeiro para aderir a um plano e começar a economizar em cada visita.</p>
                    </div>
                </div>
            </div>`;
        }

        const plan = clientPlan.plan;
        const usedThisWeek = this.getPlanWeekUsageCount();
        const remainingUses = Math.max(0, plan.usage_per_week - usedThisWeek);
        const totalUsed = this.getTotalPlanUsageCount();
        const totalRemaining = plan.max_discount_uses != null ? Math.max(0, plan.max_discount_uses - totalUsed) : null;
        const daysLeft = this.getDaysUntilPlanExpiry(clientPlan);
        const isActiveToday = this.isPlanActiveToday(clientPlan);
        const [sy, sm, sd] = clientPlan.start_date.split('-');
        const [ey, em, ed] = clientPlan.end_date.split('-');

        // Duração total em dias
        const startTs = new Date(clientPlan.start_date + 'T00:00:00').getTime();
        const endTs = new Date(clientPlan.end_date + 'T00:00:00').getTime();
        const totalDays = Math.ceil((endTs - startTs) / (1000 * 60 * 60 * 24));
        const elapsedDays = totalDays - daysLeft;
        const progressPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

        const discountLabel = plan.discount_type === 'global'
            ? `${plan.global_discount_percent}% em todos os serviços`
            : 'Desconto individual por serviço';

        return `
        <div class="space-y-5 fade-in-fast">
            <div>
                <h2 class="text-2xl font-bold text-theme">Meu Plano</h2>
                <p class="text-xs text-muted-theme mt-0.5">Seus benefícios ativos</p>
            </div>

            ${daysLeft !== null && daysLeft <= 7 ? `
            <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-500 shrink-0 mt-0.5"></i>
                <p class="text-sm text-amber-400 font-medium">
                    ${daysLeft <= 0 ? 'Seu plano <b>expira hoje</b>!' : `Seu plano termina em <b>${daysLeft} dia${daysLeft !== 1 ? 's' : ''}</b>.`}
                    <span class="block text-xs text-muted-theme mt-0.5 font-normal">Renove com seu barbeiro para não perder os benefícios.</span>
                </p>
            </div>` : ''}

            <!-- Card principal do plano -->
            <div class="card-bg border border-amber-500/30 rounded-3xl p-5 space-y-5 shadow-xl shadow-amber-500/5">
                <div class="flex items-start justify-between">
                    <div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-amber-500">Plano Ativo</span>
                        <h3 class="text-2xl font-black text-theme mt-0.5">${App.escapeHTML(plan.name)}</h3>
                        ${plan.description ? `<p class="text-xs text-muted-theme mt-1">${App.escapeHTML(plan.description)}</p>` : ''}
                    </div>
                    <div class="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl">
                        <i data-lucide="award" class="w-7 h-7 text-amber-500"></i>
                    </div>
                </div>

                <!-- Desconto -->
                <div class="flex items-center gap-3 p-3 input-bg rounded-xl">
                    <i data-lucide="tag" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                    <div>
                        <p class="text-[10px] text-muted-theme uppercase font-bold tracking-widest">Desconto</p>
                        <p class="text-sm font-bold text-emerald-400">${discountLabel}</p>
                    </div>
                </div>

                <!-- Uso semanal -->
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-[10px] text-muted-theme uppercase font-bold tracking-widest flex items-center gap-1.5">
                            <i data-lucide="repeat" class="w-3 h-3"></i> Usos esta semana
                        </p>
                        <p class="text-sm font-black text-theme">${usedThisWeek} / ${plan.usage_per_week}</p>
                    </div>
                    <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500 ${remainingUses > 0 ? 'bg-emerald-500' : 'bg-red-500'}"
                            style="width: ${Math.min(100, (usedThisWeek / plan.usage_per_week) * 100)}%"></div>
                    </div>
                    <p class="text-[11px] mt-1.5 ${remainingUses > 0 ? 'text-emerald-400' : 'text-red-400'} font-semibold">
                        ${remainingUses > 0 ? `${remainingUses} uso${remainingUses !== 1 ? 's' : ''} disponível${remainingUses !== 1 ? 'is' : ''} esta semana` : 'Limite semanal atingido'}
                    </p>
                </div>

                ${plan.max_discount_uses != null ? `
                <!-- Total de usos do plano -->
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-[10px] text-muted-theme uppercase font-bold tracking-widest flex items-center gap-1.5">
                            <i data-lucide="ticket" class="w-3 h-3"></i> Usos do plano (total)
                        </p>
                        <p class="text-sm font-black text-theme">${totalUsed} / ${plan.max_discount_uses}</p>
                    </div>
                    <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500 ${totalRemaining > 0 ? 'bg-emerald-500' : 'bg-red-500'}"
                            style="width: ${Math.min(100, (totalUsed / plan.max_discount_uses) * 100)}%"></div>
                    </div>
                    <p class="text-[11px] mt-1.5 ${totalRemaining > 0 ? 'text-emerald-400' : 'text-red-400'} font-semibold">
                        ${totalRemaining > 0 ? `${totalRemaining} uso${totalRemaining !== 1 ? 's' : ''} restante${totalRemaining !== 1 ? 's' : ''} no plano` : 'Todos os usos do plano foram utilizados'}
                    </p>
                </div>` : ''}

                <!-- Dias ativos -->
                <div>
                    <p class="text-[10px] text-muted-theme uppercase font-bold tracking-widest mb-2 flex items-center gap-1.5">
                        <i data-lucide="calendar-days" class="w-3 h-3"></i> Dias com desconto
                    </p>
                    <div class="flex gap-1.5">
                        ${DAYS_PT.map((d, i) => {
            const isActive = (plan.active_days || []).includes(i);
            const isToday = i === todayDow;
            return `<div class="flex-1 py-1.5 rounded-lg text-center text-[11px] font-black transition-all
                            ${isActive && isToday ? 'bg-amber-500 text-zinc-950 ring-2 ring-amber-500/40' :
                isActive ? 'bg-amber-500/15 text-amber-400' :
                    'input-bg text-zinc-600'}">
                            ${d}
                        </div>`;
        }).join('')}
                    </div>
                    ${!isActiveToday ? `<p class="text-[11px] text-muted-theme mt-1.5">O desconto não está ativo hoje.</p>` : `<p class="text-[11px] text-emerald-400 mt-1.5">Desconto ativo hoje!</p>`}
                </div>

                <!-- Validade -->
                <div>
                    <p class="text-[10px] text-muted-theme uppercase font-bold tracking-widest mb-2 flex items-center gap-1.5">
                        <i data-lucide="calendar" class="w-3 h-3"></i> Validade
                    </p>
                    <div class="flex items-center justify-between text-sm mb-2">
                        <span class="text-muted-theme">${sd}/${sm}/${sy}</span>
                        <span class="font-bold ${daysLeft <= 7 ? 'text-amber-400' : 'text-theme'}">${ed}/${em}/${ey}</span>
                    </div>
                    <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500 ${daysLeft <= 7 ? 'bg-amber-500' : 'bg-emerald-500'}"
                            style="width: ${progressPct}%"></div>
                    </div>
                    <p class="text-[11px] mt-1.5 ${daysLeft <= 7 ? 'text-amber-400' : 'text-muted-theme'}">
                        ${daysLeft <= 0 ? 'Expirado' : `${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`}
                    </p>
                </div>
            </div>

            ${plan.discount_type === 'individual' && (plan.serviceDiscounts || []).length > 0 ? `
            <div class="card-bg border border-theme rounded-2xl p-4 space-y-3">
                <p class="text-[10px] text-muted-theme uppercase font-bold tracking-widest">Serviços com desconto</p>
                ${plan.serviceDiscounts.map(sd => {
            const svc = SERVICES.find(s => String(s.id) === String(sd.service_id));
            if (!svc) return '';
            return `<div class="flex items-center justify-between">
                        <span class="text-sm text-theme">${App.escapeHTML(svc.name)}</span>
                        <span class="text-sm font-black text-emerald-400">${sd.discount_percent}% off</span>
                    </div>`;
        }).join('')}
            </div>` : ''}
        </div>`;
    },

    renderPlanosStaff() {
        const plans = this.state.plans || [];
        const clientPlans = this.state.clientPlans || [];
        const tab = this.state.plansAdminTab;
        const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        return `
        <div class="space-y-5 fade-in-fast">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-theme">Planos</h2>
                    <p class="text-xs text-muted-theme mt-0.5">Crie e gerencie planos de fidelidade</p>
                </div>
                ${tab === 'list' ? `
                <button onclick="App.startCreatePlan()"
                    class="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-950 rounded-xl font-black text-sm active:scale-95 transition-all shadow-md shadow-amber-500/20">
                    <i data-lucide="plus" class="w-4 h-4"></i> Criar
                </button>` : ''}
            </div>

            <!-- Tabs -->
            <div class="flex gap-2 p-1 input-bg rounded-xl">
                <button onclick="App.setPlansAdminTab('list')"
                    class="flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'list' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-muted-theme'}">
                    Meus Planos (${plans.length})
                </button>
                <button onclick="App.setPlansAdminTab('clientes')"
                    class="flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'clientes' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-muted-theme'}">
                    Clientes (${clientPlans.filter(cp => { const t = new Date().toISOString().split('T')[0]; return cp.status === 'active' && cp.end_date >= t; }).length})
                </button>
            </div>

            ${tab === 'list' ? `
            <!-- Lista de Planos -->
            ${plans.length === 0 ? `
                <div class="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <div class="w-16 h-16 input-bg border border-theme rounded-full flex items-center justify-center">
                        <i data-lucide="package-open" class="w-8 h-8 text-muted-theme"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-theme">Nenhum plano criado</h3>
                        <p class="text-xs text-muted-theme mt-1">Crie seu primeiro plano para fidelizar clientes.</p>
                    </div>
                    <button onclick="App.startCreatePlan()"
                        class="px-6 py-3 bg-amber-500 text-zinc-950 rounded-xl font-black text-sm active:scale-95 transition-all shadow-md shadow-amber-500/20">
                        Criar Primeiro Plano
                    </button>
                </div>
            ` : plans.map(plan => {
            const activeCount = clientPlans.filter(cp => cp.plan_id === plan.id && cp.status === 'active').length;
            const discountLabel = plan.discount_type === 'global'
                ? `${plan.global_discount_percent}% em todos`
                : `Individual por serviço`;
            const durationLabel = `${plan.duration_value} ${plan.duration_type === 'days' ? 'dia' : 'mês'}${plan.duration_value > 1 ? 's' : ''}`;
            return `
                <div class="card-bg border border-theme rounded-2xl p-4 space-y-3 shadow-sm hover:border-amber-500/20 transition-colors">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                            <h3 class="font-black text-theme text-lg truncate">${App.escapeHTML(plan.name)}</h3>
                            ${plan.description ? `<p class="text-xs text-muted-theme truncate">${App.escapeHTML(plan.description)}</p>` : ''}
                        </div>
                        <span class="shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ${discountLabel}
                        </span>
                    </div>

                    <div class="grid grid-cols-${plan.max_discount_uses != null ? '4' : '3'} gap-2 text-center">
                        <div class="input-bg rounded-xl p-2">
                            <p class="text-[10px] text-muted-theme uppercase font-bold">Usos/sem</p>
                            <p class="font-black text-theme">${plan.usage_per_week}×</p>
                        </div>
                        ${plan.max_discount_uses != null ? `
                        <div class="input-bg rounded-xl p-2">
                            <p class="text-[10px] text-muted-theme uppercase font-bold">Total</p>
                            <p class="font-black text-amber-400">${plan.max_discount_uses}×</p>
                        </div>` : ''}
                        <div class="input-bg rounded-xl p-2">
                            <p class="text-[10px] text-muted-theme uppercase font-bold">Duração</p>
                            <p class="font-black text-theme text-xs">${durationLabel}</p>
                        </div>
                        <div class="input-bg rounded-xl p-2">
                            <p class="text-[10px] text-muted-theme uppercase font-bold">Clientes</p>
                            <p class="font-black text-amber-500">${activeCount}</p>
                        </div>
                    </div>

                    <div class="flex gap-1">
                        ${DAYS_PT.map((d, i) => `
                            <div class="flex-1 py-1 rounded-lg text-center text-[10px] font-black
                                ${(plan.active_days || []).includes(i) ? 'bg-amber-500/15 text-amber-400' : 'input-bg text-zinc-700'}">
                                ${d}
                            </div>`).join('')}
                    </div>

                    <div class="flex gap-2 pt-1">
                        <button onclick="App.startAssignPlan('${plan.id}')"
                            class="flex-1 py-2.5 rounded-xl font-bold text-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors active:scale-95 flex items-center justify-center gap-1.5">
                            <i data-lucide="user-plus" class="w-4 h-4"></i> Atribuir
                        </button>
                        <button onclick="App.startEditPlan('${plan.id}')"
                            class="py-2.5 px-4 rounded-xl font-bold text-sm input-bg text-muted-theme border border-theme hover:text-theme transition-colors active:scale-95">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <button onclick="App.confirmDeletePlan('${plan.id}')"
                            class="py-2.5 px-4 rounded-xl font-bold text-sm input-bg text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors active:scale-95">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>`;
        }).join('')}
            ` : `
            <!-- Lista de Clientes com Planos -->
            ${clientPlans.length === 0 ? `
                <div class="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <div class="w-16 h-16 bg-zinc-800/60 rounded-full flex items-center justify-center">
                        <i data-lucide="users" class="w-8 h-8 text-zinc-600"></i>
                    </div>
                    <p class="text-sm text-muted-theme">Nenhum cliente com plano atribuído.</p>
                </div>
            ` : clientPlans.map(cp => {
            const client = CLIENTES.find(c => c.id === cp.client_id);
            const clientName = client?.name || 'Cliente';
            const clientAvatar = client?.avatar || null;
            const planName = cp.plan?.name || 'Plano';
            const daysLeft = this.getDaysUntilPlanExpiry(cp);
            const [ey, em, ed] = (cp.end_date || '').split('-');
            const today = new Date().toISOString().split('T')[0];
            const isExpiredByDate = cp.status === 'active' && cp.end_date < today;
            const effectiveStatus = isExpiredByDate ? 'expired' : cp.status;
            const statusColor = effectiveStatus === 'active' ? 'text-emerald-400' : effectiveStatus === 'expired' ? 'text-red-400' : 'text-zinc-500';
            const statusLabel = effectiveStatus === 'active' ? 'Ativo' : effectiveStatus === 'expired' ? 'Expirado' : 'Cancelado';
            return `
                <div class="card-bg border border-theme rounded-2xl p-4 flex items-center gap-3">
                    <div class="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden bg-zinc-800 flex items-center justify-center border-2 ${effectiveStatus === 'active' ? 'border-amber-500/30' : 'border-zinc-700'}">
                        ${clientAvatar
                ? `<img src="${clientAvatar}" class="w-full h-full object-cover" />`
                : `<span class="font-black text-amber-500/70 text-base">${(clientName[0] || 'C').toUpperCase()}</span>`
            }
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-theme text-sm truncate">${App.escapeHTML(clientName)}</p>
                        <p class="text-[11px] text-amber-500/80 font-semibold">${App.escapeHTML(planName)}</p>
                        <p class="text-[10px] text-muted-theme">
                            até ${ed}/${em}/${ey}
                            ${effectiveStatus === 'active' && daysLeft !== null && daysLeft <= 7
                ? `<span class="text-amber-400 font-bold"> · ${daysLeft}d restantes</span>`
                : ''
            }
                        </p>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                        <span class="text-[10px] font-black uppercase ${statusColor}">${statusLabel}</span>
                        ${effectiveStatus === 'active' ? `
                        <button onclick="App.confirmRevokePlan('${cp.id}')"
                            class="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors px-2 py-1 input-bg rounded-lg border border-red-500/20">
                            Revogar
                        </button>` : ''}
                        ${cp.status === 'cancelled' && cp.end_date >= today ? `
                        <button onclick="App.reactivateClientPlan('${cp.id}')"
                            class="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 input-bg rounded-lg border border-emerald-500/20">
                            Reativar
                        </button>` : ''}
                        ${effectiveStatus !== 'active' ? `
                        <button onclick="App.deleteClientPlan('${cp.id}')"
                            class="text-[11px] font-bold text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 input-bg rounded-lg border border-theme">
                            Excluir
                        </button>` : ''}
                    </div>
                </div>`;
        }).join('')}
            `}
        </div>`;
    },

    renderPlanForm() {
        const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const isEditing = !!this.state.editingPlanId;
        const plan = isEditing ? (this.state.plans || []).find(p => p.id === this.state.editingPlanId) : null;

        const defaultDays = plan?.active_days || [0, 1, 2, 3, 4, 5, 6];
        const defaultDiscountType = plan?.discount_type || 'global';
        const defaultGlobalPct = plan?.global_discount_percent || '';
        const defaultUsage = plan?.usage_per_week || 1;
        const defaultDurationType = plan?.duration_type || 'months';
        const defaultDurationValue = plan?.duration_value || 1;
        const defaultMaxUses = plan?.max_discount_uses ?? '';

        return `
        <div class="space-y-5 fade-in-fast slide-in-up">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-theme">${isEditing ? 'Editar Plano' : 'Novo Plano'}</h2>
                    <p class="text-xs text-muted-theme mt-0.5">Configure os benefícios do plano</p>
                </div>
                <button onclick="App.cancelPlanForm()" class="p-2 input-bg rounded-full text-muted-theme hover:text-theme transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Nome e Descrição -->
            <div class="space-y-3">
                <div class="space-y-1.5">
                    <label class="text-xs font-bold text-muted-theme uppercase tracking-widest">Nome do Plano</label>
                    <input type="text" id="plan-name" value="${App.escapeHTML(plan?.name || '')}"
                        placeholder="Ex: Bronze, Prata, Ouro..."
                        class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                </div>
                <div class="space-y-1.5">
                    <label class="text-xs font-bold text-muted-theme uppercase tracking-widest">Descrição (opcional)</label>
                    <input type="text" id="plan-description" value="${App.escapeHTML(plan?.description || '')}"
                        placeholder="Breve descrição para o cliente..."
                        class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                </div>
            </div>

            <!-- Tipo de Desconto -->
            <div class="space-y-3">
                <label class="text-xs font-bold text-muted-theme uppercase tracking-widest">Tipo de Desconto</label>
                <div class="grid grid-cols-2 gap-2">
                    <label class="cursor-pointer">
                        <input type="radio" name="plan-discount-type" value="global" class="sr-only"
                            ${defaultDiscountType === 'global' ? 'checked' : ''}
                            onchange="App.togglePlanDiscountType('global')" />
                        <div class="plan-dtype-btn p-3 rounded-xl border-2 text-center transition-all
                            ${defaultDiscountType === 'global' ? 'border-amber-500 bg-amber-500/10' : 'border-theme input-bg'}">
                            <i data-lucide="percent" class="w-5 h-5 mx-auto mb-1 ${defaultDiscountType === 'global' ? 'text-amber-500' : 'text-muted-theme'}"></i>
                            <p class="text-sm font-bold ${defaultDiscountType === 'global' ? 'text-amber-500' : 'text-muted-theme'}">Global</p>
                            <p class="text-[10px] text-muted-theme">Todos os serviços</p>
                        </div>
                    </label>
                    <label class="cursor-pointer">
                        <input type="radio" name="plan-discount-type" value="individual" class="sr-only"
                            ${defaultDiscountType === 'individual' ? 'checked' : ''}
                            onchange="App.togglePlanDiscountType('individual')" />
                        <div class="plan-dtype-btn p-3 rounded-xl border-2 text-center transition-all
                            ${defaultDiscountType === 'individual' ? 'border-amber-500 bg-amber-500/10' : 'border-theme input-bg'}">
                            <i data-lucide="list" class="w-5 h-5 mx-auto mb-1 ${defaultDiscountType === 'individual' ? 'text-amber-500' : 'text-muted-theme'}"></i>
                            <p class="text-sm font-bold ${defaultDiscountType === 'individual' ? 'text-amber-500' : 'text-muted-theme'}">Individual</p>
                            <p class="text-[10px] text-muted-theme">Por serviço</p>
                        </div>
                    </label>
                </div>
                <div class="mt-2">
                    <label class="cursor-pointer w-full">
                        <input type="radio" name="plan-discount-type" value="fixed" class="sr-only"
                            ${defaultDiscountType === 'fixed' ? 'checked' : ''}
                            onchange="App.togglePlanDiscountType('fixed')" />
                        <div class="plan-dtype-btn p-3 rounded-xl border-2 text-center transition-all
                            ${defaultDiscountType === 'fixed' ? 'border-amber-500 bg-amber-500/10' : 'border-theme input-bg'}">
                            <i data-lucide="tag" class="w-5 h-5 mx-auto mb-1 ${defaultDiscountType === 'fixed' ? 'text-amber-500' : 'text-muted-theme'}"></i>
                            <p class="text-sm font-bold ${defaultDiscountType === 'fixed' ? 'text-amber-500' : 'text-muted-theme'}">Valor Fixo</p>
                            <p class="text-[10px] text-muted-theme">Preço final por serviço</p>
                        </div>
                    </label>
                </div>

                <!-- Desconto Global -->
                <div id="plan-global-section" class="${defaultDiscountType !== 'global' ? 'hidden' : ''} space-y-1.5">
                    <label class="text-xs font-bold text-muted-theme uppercase tracking-widest">Percentual de Desconto (%)</label>
                    <div class="relative">
                        <input type="number" id="plan-global-pct" value="${defaultGlobalPct}" min="1" max="100" step="1"
                            placeholder="Ex: 20"
                            class="w-full card-bg border border-theme rounded-xl p-3 pr-12 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                        <span class="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 font-black">%</span>
                    </div>
                </div>

                <!-- Desconto Individual por Serviço -->
                <div id="plan-individual-section" class="${defaultDiscountType !== 'individual' ? 'hidden' : ''} space-y-2">
                    <label class="text-xs font-bold text-muted-theme uppercase tracking-widest">Desconto por Serviço (%)</label>
                    ${SERVICES.map(svc => {
            const existing = (plan?.serviceDiscounts || []).find(d => String(d.service_id) === String(svc.id));
            return `
                        <div class="flex items-center gap-3 card-bg border border-theme rounded-xl p-3">
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-bold text-theme truncate">${App.escapeHTML(svc.name)}</p>
                                <p class="text-[11px] text-muted-theme">${svc.price}</p>
                            </div>
                            <div class="relative w-24">
                                <input type="number" id="plan-svc-${svc.id}" value="${existing?.discount_percent || ''}"
                                    min="0" max="100" step="0.5" placeholder="0"
                                    class="w-full input-bg border border-theme rounded-lg p-2 pr-6 text-theme text-sm text-right focus:outline-none focus:border-amber-500 transition-colors" />
                                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-amber-500 text-xs font-black">%</span>
                            </div>
                        </div>`;
        }).join('')}
                </div>

                <!-- Valor Fixo por Serviço -->
                <div id="plan-fixed-section" class="${defaultDiscountType !== 'fixed' ? 'hidden' : ''} space-y-2">
                    <label class="text-xs font-bold text-muted-theme uppercase tracking-widest">Valor Final por Serviço (R$)</label>
                    <p class="text-[11px] text-amber-500/70">Digite o preço que o cliente vai pagar. O desconto é calculado automaticamente.</p>
                    ${SERVICES.map(svc => {
                        const existingFixed = (plan?.serviceDiscounts || []).find(d => String(d.service_id) === String(svc.id) && d.fixed_price != null);
                        return `
                        <div class="flex items-center gap-3 card-bg border border-theme rounded-xl p-3">
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-bold text-theme truncate">${App.escapeHTML(svc.name)}</p>
                                <p class="text-[11px] text-muted-theme">Preço normal: ${svc.price}</p>
                            </div>
                            <div class="relative w-28">
                                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-amber-500 text-xs font-black">R$</span>
                                <input type="number" id="plan-svc-fixed-${svc.id}" value="${existingFixed?.fixed_price || ''}"
                                    min="0" step="0.01" placeholder="0,00"
                                    class="w-full input-bg border border-theme rounded-lg p-2 pl-7 text-theme text-sm text-right focus:outline-none focus:border-amber-500 transition-colors" />
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- Dias Ativos -->
            <div class="space-y-2">
                <label class="text-xs font-bold text-muted-theme uppercase tracking-widest">Dias com Desconto</label>
                <div class="flex gap-1.5">
                    ${DAYS_PT.map((d, i) => `
                        <label class="flex-1 cursor-pointer">
                            <input type="checkbox" id="plan-day-${i}" class="sr-only"
                                ${defaultDays.includes(i) ? 'checked' : ''}
                                onchange="this.closest('label').querySelector('.day-chip').classList.toggle('bg-amber-500', this.checked); this.closest('label').querySelector('.day-chip').classList.toggle('text-zinc-950', this.checked); this.closest('label').querySelector('.day-chip').classList.toggle('input-bg', !this.checked); this.closest('label').querySelector('.day-chip').classList.toggle('text-muted-theme', !this.checked);" />
                            <div class="day-chip py-2 rounded-xl text-center text-[11px] font-black transition-all
                                ${defaultDays.includes(i) ? 'bg-amber-500 text-zinc-950' : 'input-bg text-muted-theme border border-theme'}">
                                ${d}
                            </div>
                        </label>`).join('')}
                </div>
            </div>

            <!-- Frequência e Duração -->
            <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                    <label class="text-xs font-bold text-muted-theme uppercase tracking-widest">Usos por Semana</label>
                    <input type="number" id="plan-usage-week" value="${defaultUsage}" min="1" max="7"
                        class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                </div>
                <div class="space-y-1.5">
                    <label class="text-xs font-bold text-muted-theme uppercase tracking-widest">Duração</label>
                    <input type="number" id="plan-duration-value" value="${defaultDurationValue}" min="1"
                        class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                </div>
            </div>
            <div class="flex gap-2">
                <label class="flex-1 cursor-pointer">
                    <input type="radio" name="plan-duration-type" value="days" class="sr-only"
                        ${defaultDurationType === 'days' ? 'checked' : ''}
                        onchange="document.getElementById('plan-dur-days').className='py-2.5 rounded-xl text-center text-sm font-bold border-2 transition-all border-amber-500 bg-amber-500/10 text-amber-500';document.getElementById('plan-dur-months').className='py-2.5 rounded-xl text-center text-sm font-bold border-2 transition-all border-theme input-bg text-muted-theme'" />
                    <div id="plan-dur-days" class="py-2.5 rounded-xl text-center text-sm font-bold border-2 transition-all
                        ${defaultDurationType === 'days' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-theme input-bg text-muted-theme'}">
                        Dias
                    </div>
                </label>
                <label class="flex-1 cursor-pointer">
                    <input type="radio" name="plan-duration-type" value="months" class="sr-only"
                        ${defaultDurationType === 'months' ? 'checked' : ''}
                        onchange="document.getElementById('plan-dur-months').className='py-2.5 rounded-xl text-center text-sm font-bold border-2 transition-all border-amber-500 bg-amber-500/10 text-amber-500';document.getElementById('plan-dur-days').className='py-2.5 rounded-xl text-center text-sm font-bold border-2 transition-all border-theme input-bg text-muted-theme'" />
                    <div id="plan-dur-months" class="py-2.5 rounded-xl text-center text-sm font-bold border-2 transition-all
                        ${defaultDurationType === 'months' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-theme input-bg text-muted-theme'}">
                        Meses
                    </div>
                </label>
            </div>

            <!-- Usos totais do desconto -->
            <div class="space-y-1.5">
                <label class="text-xs font-bold text-muted-theme uppercase tracking-widest">Usos do Desconto (Total)</label>
                <input type="number" id="plan-max-uses" value="${defaultMaxUses}" min="1"
                    placeholder="Ilimitado"
                    class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                <p class="text-[10px] text-zinc-500">Deixe vazio para não limitar o total de usos do plano</p>
            </div>

            <!-- Botão salvar -->
            <button onclick="App.savePlanForm()"
                class="w-full py-4 rounded-2xl font-black text-lg bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <i data-lucide="check-circle" class="w-5 h-5"></i>
                ${isEditing ? 'Salvar Alterações' : 'Criar Plano'}
            </button>
        </div>`;
    },

    renderPlanAssignModal() {
        const planId = this.state.assigningPlanId;
        const plan = (this.state.plans || []).find(p => p.id === planId);
        if (!plan) return this.renderPlanosStaff();

        const today = new Date().toISOString().split('T')[0];
        const defaultEndDate = this.calcPlanEndDate(today, plan.duration_value, plan.duration_type);
        const [ey, em, ed] = defaultEndDate.split('-');
        const client = this.state.assignClientData;

        return `
        <div class="space-y-5 fade-in-fast slide-in-up">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-theme">Atribuir Plano</h2>
                    <p class="text-xs text-amber-500 font-semibold mt-0.5">${App.escapeHTML(plan.name)}</p>
                </div>
                <button onclick="App.cancelAssignPlan()" class="p-2 input-bg rounded-full text-muted-theme hover:text-theme transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Busca de cliente -->
            <div class="space-y-2">
                <label class="text-xs font-bold text-muted-theme uppercase tracking-widest">Cliente</label>
                ${client ? `
                <div class="flex items-center gap-3 p-3 card-bg border border-amber-500/30 rounded-xl">
                    <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800 flex items-center justify-center border border-amber-500/30">
                        ${client.avatar
                ? `<img src="${client.avatar}" class="w-full h-full object-cover" />`
                : `<span class="font-black text-amber-500/70">${(client.name?.[0] || 'C').toUpperCase()}</span>`
            }
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-theme text-sm">${App.escapeHTML(client.name)}</p>
                        <p class="text-[11px] text-muted-theme">${App.formatDisplayPhone ? App.formatDisplayPhone(client.phone) : client.phone || ''}</p>
                    </div>
                    <button onclick="App.clearAssignClient()" class="p-1.5 input-bg border border-theme rounded-lg">
                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-muted-theme"></i>
                    </button>
                </div>` : `
                <div class="relative">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-theme pointer-events-none"></i>
                    <input type="text" id="assign-client-search" placeholder="Buscar cliente por nome ou telefone..."
                        class="w-full card-bg border border-theme rounded-xl p-3 pl-9 text-theme focus:border-amber-500 outline-none transition-colors text-sm"
                        oninput="App.searchAssignClients(this.value)" autocomplete="off" />
                </div>
                <div id="assign-client-results" class="max-h-48 overflow-y-auto rounded-xl input-bg border border-theme/50">
                    <p class="text-[11px] text-muted-theme text-center py-3">Digite ao menos 2 caracteres.</p>
                </div>`}
            </div>

            <!-- Data de início -->
            <div class="space-y-1.5">
                <label class="text-xs font-bold text-muted-theme uppercase tracking-widest">Data de Início</label>
                <input type="date" id="assign-start-date" value="${today}" min="${today}"
                    onchange="App.updateAssignEndDate()"
                    class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
            </div>

            <!-- Data de encerramento calculada -->
            <div class="flex items-center justify-between p-3 input-bg rounded-xl border border-theme">
                <div class="flex items-center gap-2 text-muted-theme text-sm">
                    <i data-lucide="calendar-check" class="w-4 h-4"></i>
                    Expira em
                </div>
                <span class="font-black text-theme" id="assign-end-date-display">${ed}/${em}/${ey}</span>
            </div>

            <div class="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-muted-theme space-y-1">
                <p class="flex items-center gap-1.5 font-bold text-amber-400">
                    <i data-lucide="info" class="w-3.5 h-3.5"></i> Informações do plano
                </p>
                <p>· Duração: ${plan.duration_value} ${plan.duration_type === 'days' ? 'dia' : 'mês'}${plan.duration_value > 1 ? 's' : ''}</p>
                <p>· Usos por semana: ${plan.usage_per_week}×</p>
                <p>· Se o cliente já tiver um plano ativo, ele será cancelado.</p>
            </div>

            <button onclick="App.confirmAssignPlan()"
                class="w-full py-4 rounded-2xl font-black text-lg bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <i data-lucide="user-check" class="w-5 h-5"></i> Confirmar Atribuição
            </button>
        </div>`;
    },

    renderSplitPaymentModal(id) {
        const apt = this.state.appointments.find(a => a.id === id);
        if (!apt) return '';

        const split = this.state.splitPaymentAmounts;
        const totalPaid = Object.values(split).reduce((a, b) => a + b, 0);
        const balance = apt.numericValue - totalPaid;
        const isCompleted = Math.abs(balance) < 0.01;

        return `
            <div class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-zinc-950/80 backdrop-blur-sm fade-in">
                <div class="card-bg w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2.5rem] border border-theme shadow-2xl scale-in relative flex flex-col max-h-[90dvh]">
                    <!-- Detalhe de fundo -->
                    <div class="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <!-- HEADER FIXO: sempre visível no topo, não scroll -->
                    <div class="relative flex justify-between items-center px-5 pt-5 pb-4 border-b border-theme shrink-0">
                        <div>
                            <h3 class="text-xl font-black text-theme">Dividir Pagamento</h3>
                            <p class="text-[10px] text-muted-theme font-bold uppercase tracking-widest mt-0.5">Finalizar Agendamento</p>
                        </div>
                        <button onclick="App.state.showingSplitPaymentId = null; App.render();" class="w-10 h-10 rounded-full card-bg flex items-center justify-center text-muted-theme hover:text-theme transition-colors border border-theme shrink-0">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <!-- CORPO SCROLLÁVEL -->
                    <div class="overflow-y-auto px-5 py-5 space-y-5">

                        <div class="card-bg/50 rounded-2xl p-4 border border-theme flex justify-between items-center">
                            <div>
                                <p class="text-[10px] text-muted-theme font-bold uppercase tracking-wider mb-1">Total do Serviço</p>
                                <p class="text-2xl font-black text-theme">R$ ${apt.numericValue.toFixed(2).replace('.', ',')}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-muted-theme font-bold uppercase tracking-wider mb-1">Faltando</p>
                                <p class="text-2xl font-black ${balance > 0 ? 'text-amber-500' : balance < 0 ? 'text-red-500' : 'text-emerald-500'}">
                                    R$ ${Math.abs(balance).toFixed(2).replace('.', ',')}
                                </p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            ${Object.entries({
            'Dinheiro': { icon: 'banknote', color: 'emerald' },
            'Pix': { icon: 'zap', color: 'teal' },
            'Débito': { icon: 'credit-card', color: 'blue' },
            'Crédito': { icon: 'credit-card', color: 'amber' }
        }).map(([method, style]) => `
                                <div class="space-y-1.5">
                                    <label class="text-[10px] text-muted-theme font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <i data-lucide="${style.icon}" class="w-3.5 h-3.5 text-${style.color}-500"></i> ${method}
                                    </label>
                                    <div class="relative group">
                                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-theme">R$</span>
                                        <input type="text" 
                                            value="${split[method] ? split[method].toFixed(2).replace('.', ',') : ''}"
                                            onchange="App.updateSplitAmount('${method}', this.value)"
                                            placeholder="0,00"
                                            class="w-full card-bg border border-theme rounded-2xl p-3 pl-10 text-theme font-bold focus:outline-none focus:border-amber-500 transition-colors"
                                            inputmode="decimal" />
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="pb-2">
                            <button 
                                onclick="App.completeSplitPayment('${id}')" 
                                ${!isCompleted ? 'disabled' : ''}
                                class="w-full py-4 rounded-2xl font-black transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] ${isCompleted ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25' : 'input-bg text-muted-theme border border-theme cursor-not-allowed'}">
                                <i data-lucide="check-circle" class="w-6 h-6"></i> FINALIZAR AGENDAMENTO
                            </button>
                            <p class="text-center text-[10px] text-muted-theme font-medium mt-3 italic">
                                ${isCompleted ? 'Tudo pronto! Valores conferem.' : 'A soma dos valores deve bater com o total.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderBarberServicesModal(barberId) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        const barber = BARBERS.find(b => b.id === parseInt(barberId));
        if (!barber) return;

        // Pegar serviços que o barbeiro já faz
        const currentServices = this.state.barberServices
            .filter(s => s.barber_id === barber.id)
            .map(s => s.service_id);

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm fade-in">
                <div class="card-bg w-full max-w-sm rounded-[2.5rem] p-8 border border-theme shadow-2xl scale-in relative overflow-hidden flex flex-col max-h-[80vh]">
                    <div class="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>
                    
                    <div class="relative flex flex-col min-h-0">
                        <div class="flex justify-between items-center mb-6 shrink-0">
                            <div>
                                <h3 class="text-xl font-black text-theme">Especialidades</h3>
                                <p class="text-[10px] text-muted-theme font-bold uppercase tracking-widest mt-0.5">O que ${barber.name.split(' ')[0]} faz?</p>
                            </div>
                            <button onclick="document.getElementById('modal-container').innerHTML = '';" class="w-10 h-10 rounded-full card-bg flex items-center justify-center text-muted-theme hover:text-theme transition-colors border border-theme">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <div class="overflow-y-auto pr-2 space-y-2 mb-6 flex-1 min-h-0 custom-scrollbar">
                            ${SERVICES.map(svc => {
            const isSelected = currentServices.includes(svc.id);
            return `
                                    <label class="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-theme card-bg/50 hover:border-theme'}">
                                        <input type="checkbox" name="barber-service" value="${svc.id}" ${isSelected ? 'checked' : ''} class="w-5 h-5 rounded border-theme card-bg text-amber-500 focus:ring-amber-500/20" />
                                        <div class="flex-1">
                                            <p class="font-bold text-sm text-theme">${svc.name}</p>
                                            <p class="text-[10px] text-muted-theme font-medium">${svc.duration}</p>
                                        </div>
                                    </label>
                                `;
        }).join('')}
                        </div>

                        <button 
                            onclick="(() => {
                                const selected = Array.from(document.querySelectorAll('input[name=\\'barber-service\\']:checked')).map(i => i.value);
                                App.saveBarberServices('${barberId}', selected);
                                document.getElementById('modal-container').innerHTML = '';
                            })()"
                            class="w-full py-4 rounded-2xl bg-amber-500 text-zinc-950 font-black hover:bg-amber-400 shadow-theme active:scale-[0.98] transition-all shrink-0">
                            SALVAR ESPECIALIDADES
                        </button>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    renderComandaModal(appointmentId) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        const apt = this.state.appointments.find(a => a.id === appointmentId);
        if (!apt) return;

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm fade-in">
                <div class="card-bg w-full max-w-md rounded-[2.5rem] p-6 md:p-8 border border-theme shadow-2xl scale-in relative overflow-hidden flex flex-col h-[85vh]">
                    <div class="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>
                    
                    <div class="relative flex flex-col min-h-0">
                        <div class="flex justify-between items-center mb-6 shrink-0">
                            <div>
                                <h3 class="text-xl font-black text-theme">Comanda Digital</h3>
                                <p class="text-[10px] text-muted-theme font-bold uppercase tracking-widest mt-0.5">Adicionar itens ao serviço</p>
                            </div>
                            <button onclick="App.closeComandaModal()" class="w-10 h-10 rounded-full card-bg flex items-center justify-center text-muted-theme hover:text-theme transition-colors border border-theme">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>

                        ${CATEGORIES.length === 0 || PRODUCTS.length === 0 ? `
                            <div class="text-center py-8 text-muted-theme">
                                <i data-lucide="package-x" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                                <p class="text-sm font-medium">Nenhum produto cadastrado.</p>
                                <p class="text-[10px] mt-1">Vá no Painel Admin > Estoque.</p>
                            </div>
                        ` : `
                            <div class="overflow-y-auto pr-2 space-y-4 mb-6 flex-1 min-h-0 custom-scrollbar">
                                ${CATEGORIES.map((cat, idx) => {
            const catProducts = PRODUCTS.filter(p => p.category_id === cat.id && (p.stock_quantity == null || p.stock_quantity > 0));
            if (catProducts.length === 0) return '';
            return `
                                        <div class="border border-theme rounded-[2.5rem] overflow-hidden card-bg mb-3 last:mb-0 shadow-sm">
                                            <button
                                                onclick="
                                                    const content = this.nextElementSibling;
                                                    const icon = this.querySelector('.chevron-icon');
                                                    const isOpen = content.classList.toggle('open');
                                                    if (isOpen) {
                                                        content.style.maxHeight = content.scrollHeight + 'px';
                                                        content.style.opacity = '1';
                                                        icon.style.transform = 'rotate(180deg)';
                                                    } else {
                                                        content.style.maxHeight = '0px';
                                                        content.style.opacity = '0';
                                                        icon.style.transform = 'rotate(0deg)';
                                                    }
                                                "
                                                class="w-full flex items-center justify-between p-6 hover-bg transition-all duration-300 active:scale-[0.99]"
                                            >
                                                <div class="flex items-center gap-3">
                                                    <div class="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                                                    <h4 class="text-xs text-theme uppercase font-black tracking-widest">${cat.name}</h4>
                                                </div>
                                                <i data-lucide="chevron-down" class="chevron-icon w-5 h-5 text-muted-theme transition-transform duration-500 ease-in-out"></i>
                                            </button>
                                            
                                            <div class="accordion-content transition-all duration-500 ease-in-out" style="max-height: 0px; opacity: 0; overflow: hidden;">
                                                <div class="p-6 pt-0 space-y-3">
                                                    ${catProducts.map(p => `
                                                        <div class="flex flex-col p-4 rounded-2xl border border-theme input-bg hover:border-amber-500/30 transition-all duration-300 group">
                                                            <div class="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <p class="text-sm font-bold text-theme group-hover:text-amber-500 transition-colors leading-tight">${p.name}</p>
                                                                    <p class="text-xs text-emerald-500 font-black mt-1" id="price-${p.id}" data-price="${p.price}">R$ ${p.price.toFixed(2).replace('.', ',')}</p>
                                                                </div>
                                                                ${p.stock_quantity != null ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.stock_quantity <= 3 ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/10 text-amber-500'}">${p.stock_quantity} restante${p.stock_quantity !== 1 ? 's' : ''}</span>` : ''}
                                                            </div>
                                                            <div class="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-theme/40">
                                                                <div class="flex items-center app-bg border border-theme rounded-lg h-10 px-1 shadow-inner shrink-0">
                                                                    <button onclick="event.stopPropagation(); const q=this.nextElementSibling; let v=parseInt(q.innerText); if(v>1) { q.innerText=v-1; const pel = document.getElementById('price-${p.id}'); pel.innerText = 'R$ ' + (parseFloat(pel.dataset.price)*(v-1)).toFixed(2).replace('.',','); }" class="w-9 h-9 flex items-center justify-center text-muted-theme hover:text-theme active:scale-95 transition-all">
                                                                        <i data-lucide="minus" class="w-4 h-4"></i>
                                                                    </button>
                                                                    <span class="w-6 text-center text-xs font-bold text-theme select-none" id="qty-${p.id}">1</span>
                                                                    <button onclick="event.stopPropagation(); const max=${p.stock_quantity != null ? p.stock_quantity : 999}; const q=this.previousElementSibling; let v=parseInt(q.innerText); if(v>=max) return; v++; q.innerText=v; const pel=document.getElementById('price-${p.id}'); pel.innerText='R$ '+(parseFloat(pel.dataset.price)*v).toFixed(2).replace('.',',');" class="w-9 h-9 flex items-center justify-center text-muted-theme hover:text-theme active:scale-95 transition-all">
                                                                        <i data-lucide="plus" class="w-4 h-4"></i>
                                                                    </button>
                                                                </div>
                                                                <button onclick="event.stopPropagation(); App.addComandaItem('${appointmentId}', '${p.id}', parseInt(document.getElementById('qty-${p.id}').innerText))" class="bg-amber-500 text-zinc-950 w-10 h-10 rounded-xl flex items-center justify-center hover:scale-[1.05] active:scale-95 transition-all shadow-lg shadow-amber-500/20 shrink-0">
                                                                    <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        </div>
                                    `;
        }).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons({ root: modalContainer });
    }
});
