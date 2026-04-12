Object.assign(App, {
    renderSplash() {
        return `
            <div class="flex flex-col items-center justify-center min-h-[80vh] bg-zinc-950 fade-in">
                <div class="relative w-32 h-32 mb-8">
                    <div class="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                    <div class="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <i data-lucide="scissors" class="w-12 h-12 text-amber-500 animate-pulse"></i>
                    </div>
                </div>
                <h1 class="text-2xl font-black text-white italic uppercase tracking-widest animate-pulse">FinnoTrato</h1>
                <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-2">Personal Grooming</p>
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
                            <p class="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none">Seu próximo corte</p>
                            <h3 class="text-xl font-black text-theme mt-1">Hoje, às ${reminder.apt.time}</h3>
                            <p class="text-xs font-bold text-amber-500/80 mt-1 flex items-center justify-center gap-1">
                                <i data-lucide="timer" class="w-3.5 h-3.5"></i> Faltam ${reminder.timeMsg}
                            </p>
                        </div>

                        <div class="w-full pt-4 border-t border-white/5 flex gap-2">
                             <a href="https://wa.me/55?text=Ol%C3%A1,%20estou%20a%20caminho%20do%20meu%20hor%C3%A1rio%20das%20${reminder.apt.time}" target="_blank" class="flex-1 py-2 bg-[#25D366]/10 text-[#25D366] rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5">
                                <i data-lucide="message-circle" class="w-3 h-3"></i> WhatsApp
                            </a>
                            <button onclick="App.toggleReminderPopup()" class="p-2 input-bg text-zinc-400 rounded-xl">
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

                    <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter opacity-50">FinnoTrato Barber • Estilo & Excelência</p>
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

                    <h1 class="text-4xl font-bold tracking-tight text-white">FinnoTrato<span class="text-amber-500">Barber</span></h1>
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
                        <input type="password" id="login-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>
                </div>

                <div class="pt-4 space-y-4">
                    <button onclick="App.login()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25">
                        <i data-lucide="log-in" class="w-5 h-5"></i> Entrar
                    </button>
                    <button onclick="App.setAuthView('register')" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-transparent text-zinc-300 border border-theme hover:card-bg">
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
                    <button onclick="App.setAuthView('login')" class="flex items-center gap-2 text-muted-theme hover:text-white transition-colors mb-4">
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
                        <input type="password" id="reg-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-theme">Confirmar Senha</label>
                        <input type="password" id="reg-confirm-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>
                </div>

                <div class="pt-4">
                    <button onclick="App.register()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25">
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
                        <button onclick="App.setAuthView('login')" class="flex items-center gap-2 text-muted-theme hover:text-white transition-colors mb-4">
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
                        <button onclick="App.verifyRecovery()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25">
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
                            <input type="password" id="new-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-muted-theme">Confirmar Nova Senha</label>
                            <input type="password" id="new-confirm-password" placeholder="••••••••" class="w-full card-bg border border-theme rounded-xl p-3 text-theme focus:outline-none focus:border-amber-500 transition-colors" />
                        </div>
                    </div>

                    <div class="pt-4">
                        <button onclick="App.resetPassword()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25">
                            <i data-lucide="save" class="w-5 h-5"></i> Atualizar Senha
                        </button>
                    </div>
                </div>
            `;
        }
    },

    renderBookingFlow() {
        const today = new Date().toISOString().split('T')[0];
        return `
            <div class="space-y-6 fade-in slide-in-up">
                <div class="flex items-center justify-between">
                    <h2 class="text-2xl font-bold text-theme">Novo Agendamento</h2>
                    <button onclick="App.cancelBooking()" class="p-2 input-bg rounded-full text-muted-theme hover:text-white transition-colors">
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
                        <div class="p-4 fade-in app-bg/30">
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
                        <div class="p-4 fade-in app-bg/30 space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
                        ${AVAILABLE_TIMES.map((time, idx) => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const isStaff = ['admin', 'manager', 'barber'].includes(this.state.role);
            
            if (!isStaff && this.state.selectedDate === todayStr && time <= currentTimeStr) {
                return '';
            }

            const availableBarbers = BARBERS.filter(barber => {
                if (!barber.is_active) return false;
                
                // 1. Verifica se o horário foi LIBERADO pel barbeiro
                const isReleased = (this.state.blockedTimesFull || []).some(b => 
                    String(b.barber_id) === String(barber.user_id) && !b.date && b.blocked_time === time
                );
                if (!isReleased) return false; 
                
                // 2. Verifica se há algum BLOQUEIO EXPLICÍCITO (Folga/Médico/Global)
                const isExplicitlyBlocked = (this.state.blockedTimesFull || []).some(b => {
                    if (!b.barber_id && !b.date && b.blocked_time === time) return true;
                    if (String(b.barber_id) === String(barber.user_id) && b.date === this.state.selectedDate && b.blocked_time === time) return true;
                    return false;
                });
                
                if (isExplicitlyBlocked) return false;
                
                // 3. Verifica se o horário já está OCUPADO por outro agendamento
                const isOccupied = (this.state.allAppointmentsForStats || []).some(apt => {
                    if (apt.date !== this.state.selectedDate) return false;
                    
                    // Compara o barbeiro (UUID)
                    if (String(apt.barber_id) !== String(barber.user_id)) return false;
                    
                    const [aptH, aptM] = apt.time.split(':').map(Number);
                    const aptStartTotal = aptH * 60 + aptM;
                    const aptEndTotal = aptStartTotal + (apt.total_duration || 30);
                    
                    const [thisH, thisM] = time.split(':').map(Number);
                    const thisTotal = thisH * 60 + thisM;
                    
                    // Bloqueia se o horário desejado cair dentro da janela de outro agendamento
                    return thisTotal >= aptStartTotal && thisTotal < aptEndTotal;
                });

                return !isOccupied;
            });

            if (availableBarbers.length === 0) return '';

            return `
                                <div class="p-3 card-bg border border-theme rounded-xl flex items-center justify-between shadow-sm">
                                    <span class="text-xl font-bold text-theme">${time}</span>
                                    <div class="flex gap-4">
                                        ${availableBarbers.map(barber => {
                const isSelected = this.state.selectedTime === time && this.state.selectedBarber?.id === barber.id;
                return `
                                            <div onclick="App.selectTimeAndBarber('${time}', ${barber.id})" class="cursor-pointer transition-all flex flex-col items-center gap-1 ${isSelected ? 'scale-110' : 'hover:scale-105 opacity-60 hover:opacity-100'}">
                                                <div class="relative">
                                                    <img src="${barber.avatar}" alt="${barber.name}" class="w-12 h-12 rounded-full input-bg border-2 ${isSelected ? 'border-amber-500 object-cover shadow-md shadow-amber-500/20' : 'border-zinc-700 object-cover'}">
                                                    ${isSelected ? '<div class="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 shadow-sm"><i data-lucide="check" class="w-3 h-3 text-zinc-950"></i></div>' : ''}
                                                </div>
                                                <span class="text-[10px] ${isSelected ? 'text-amber-500 font-bold' : 'text-muted-theme font-medium'}">${barber.name.split(' ')[0]}</span>
                                            </div>
                                            `;
            }).join('')}
                                    </div>
                                </div>
                                `;
        }).join('')}
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
                        <div class="p-4 fade-in app-bg/30 grid gap-2">
                            ${SERVICES.map(svc => {
            const isSelected = this.state.selectedServices.some(s => s.id === svc.id);
            return `
                                <div onclick="App.toggleService(${svc.id})" class="p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-theme input-bg hover:border-zinc-700'} flex items-center gap-3">
                                    <div class="w-5 h-5 rounded border ${isSelected ? 'bg-amber-500 border-amber-500 text-zinc-950 flex items-center justify-center' : 'border-zinc-600'}">
                                        ${isSelected ? '<i data-lucide="check" class="w-3 h-3"></i>' : ''}
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex justify-between items-center">
                                            <h4 class="font-semibold text-theme">${svc.name}</h4>
                                            <span class="font-medium text-amber-500">${svc.price}</span>
                                        </div>
                                    </div>
                                </div>
                                `;
        }).join('')}
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
                            <span class="text-xl font-bold text-amber-500">R$ ${this.state.selectedServices.reduce((sum, s) => sum + s.priceValue, 0).toFixed(2).replace('.', ',')}</span>
                        </div>

                        ${this.state.isStaffBooking ? `
                            <div class="p-4 card-bg border border-theme rounded-xl space-y-4 shadow-lg border-l-4 border-l-emerald-500/50">
                                <p class="text-[10px] text-emerald-500 font-bold uppercase tracking-widest pl-1">Dados do Cliente (Walk-in)</p>
                                <div class="space-y-3">
                                    <input type="text" id="client-name-manual" placeholder="Nome do Cliente" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors text-sm" />
                                    <input type="tel" id="client-phone-manual" inputmode="numeric" placeholder="Telefone (Opcional)" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors text-sm" />
                                </div>
                                <p class="text-[9px] text-muted-theme pl-1">Deixe em branco para usar "Cliente Avulso".</p>
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
            } else if (this.state.appointmentsFilter === 'week') {
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                filteredApts = filteredApts.filter(a => {
                    const aptDate = new Date(a.date + 'T00:00:00'); // parse safely
                    return aptDate >= startOfWeek && aptDate <= endOfWeek;
                });
            } else if (this.state.appointmentsFilter === 'month') {
                filteredApts = filteredApts.filter(a => a.date.startsWith(thisMonthFormatted));
            }

            return `
                <div class="space-y-6 fade-in slide-in-up">
                    <div class="flex flex-col gap-4 mb-2">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-theme">Agenda</h2>
                            <span class="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-medium">
                                ${filteredApts.length} cortes
                            </span>
                        </div>
                        
                    </div>

                    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style="-ms-overflow-style: none; scrollbar-width: none;">
                            <button onclick="App.setAppointmentsFilter('day')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.appointmentsFilter === 'day' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Hoje</button>
                            <button onclick="App.setAppointmentsFilter('week')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.appointmentsFilter === 'week' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Semana</button>
                            <button onclick="App.setAppointmentsFilter('month')" class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${this.state.appointmentsFilter === 'month' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'input-bg text-muted-theme hover:text-theme'}">Mês</button>
                        </div>
                    </div>

                            ${filteredApts.length === 0 ? `
                        <div class="text-center py-12 text-muted-theme">
                            <i data-lucide="calendar" class="w-16 h-16 mx-auto mb-4 opacity-20"></i>
                            <p>Nenhum agendamento encontrado.</p>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            ${filteredApts.map(apt => {
                                const clientInitial = (apt.clientName[0] || 'C').toUpperCase();
                                return `
                                <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm border-l-4 border-l-amber-500">
                                    <div class="flex justify-between items-start gap-3">
                                        <!-- Avatar do Cliente -->
                                        <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-zinc-900 flex items-center justify-center bg-zinc-800 shadow-inner">
                                            ${apt.clientAvatar ? `
                                                <img src="${apt.clientAvatar}" class="w-full h-full object-cover" />
                                            ` : `
                                                <span class="text-lg font-black text-amber-500/50">${clientInitial}</span>
                                            `}
                                        </div>

                                        <div class="flex-1 min-w-0">
                                            <h3 class="font-bold text-theme text-lg truncate">${apt.clientName}</h3>
                                            <div class="flex flex-wrap gap-1.5 mt-1.5">
                                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                                                    <i data-lucide="scissors" class="w-3 h-3"></i> ${apt.service.name}
                                                </span>
                                                
                                                <!-- Badge de Duração Editável -->
                                                ${this.state.editingDurationId === apt.id ? `
                                                    <div class="flex items-center gap-1 fade-in">
                                                        <select id="adj-dur-${apt.id}" class="bg-zinc-800 border border-amber-500 rounded px-1 text-[10px] text-amber-500 font-bold outline-none">
                                                            ${[5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,105,110,115,120].map(m => `<option value="${m}" ${apt.total_duration === m ? 'selected' : ''}>${m} min</option>`).join('')}
                                                        </select>
                                                        <button onclick="App.updateAppointmentDuration('${apt.id}', document.getElementById('adj-dur-${apt.id}').value)" class="p-1 bg-amber-500 text-zinc-950 rounded hover:bg-amber-400">
                                                            <i data-lucide="check" class="w-3 h-3"></i>
                                                        </button>
                                                        <button onclick="App.cancelEditDuration()" class="p-1 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600">
                                                            <i data-lucide="x" class="w-3 h-3"></i>
                                                        </button>
                                                    </div>
                                                ` : `
                                                    <button onclick="App.initEditDuration('${apt.id}')" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-muted-theme text-[10px] font-bold uppercase tracking-wider border border-zinc-700/50 hover:border-amber-500/50 transition-colors">
                                                        <i data-lucide="clock" class="w-3 h-3 text-amber-500"></i > ${apt.total_duration || 30} min
                                                    </button>
                                                `}
                                            </div>
                                        </div>
                                        <div class="text-right flex-shrink-0">
                                            ${this.state.editingTimeId === apt.id ? `
                                                <div class="flex flex-col items-end gap-1 fade-in">
                                                    <select id="adj-time-${apt.id}" class="bg-zinc-800 border border-amber-500 rounded px-1 text-sm text-amber-500 font-bold outline-none leading-none h-8">
                                                        ${AVAILABLE_TIMES.map(t => `<option value="${t}" ${apt.time === t ? 'selected' : ''}>${t}</option>`).join('')}
                                                    </select>
                                                    <div class="flex gap-1">
                                                        <button onclick="App.updateAppointmentTime('${apt.id}', document.getElementById('adj-time-${apt.id}').value)" class="p-1 bg-amber-500 text-zinc-950 rounded hover:bg-amber-400 shadow-sm">
                                                            <i data-lucide="check" class="w-3 h-3"></i>
                                                        </button>
                                                        <button onclick="App.cancelEditTime()" class="p-1 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 shadow-sm">
                                                            <i data-lucide="x" class="w-3 h-3"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ` : `
                                                <button onclick="App.initEditTime('${apt.id}')" class="text-amber-500 font-black text-xl flex items-center gap-1 justify-end italic leading-none hover:scale-105 transition-transform active:scale-95" title="Alterar Horário">
                                                    ${apt.time}
                                                </button>
                                            `}
                                            <span class="text-[9px] text-muted-theme font-bold uppercase tracking-tighter mt-1 block">${apt.date}</span>
                                        </div>
                                    </div>
                                    <!-- Ações Rápidas -->
                                    <div class="flex gap-2 mt-4 pt-4 border-t border-theme overflow-x-auto scrollbar-hide">
                                        <a href="https://wa.me/55${apt.clientPhone}?text=Olá%20${encodeURIComponent(apt.clientName)},%20seu%20horário%20de%20${encodeURIComponent(apt.time)}%20está%20chegando!%20Te%20aguardo." target="_blank" class="flex-shrink-0 flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-xs font-semibold">
                                            <i data-lucide="bell-ring" class="w-3.5 h-3.5"></i> Lembrete
                                        </a>
                                        <a href="https://wa.me/55${apt.clientPhone}" target="_blank" class="flex-shrink-0 flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors text-xs font-semibold">
                                            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> Mensagem
                                        </a>
                                        <a href="tel:+55${apt.clientPhone}" class="flex-shrink-0 flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors text-xs font-semibold">
                                            <i data-lucide="phone" class="w-3.5 h-3.5"></i> Ligar
                                        </a>
                                        <button onclick="App.cancelAppointment('${apt.id}')" class="flex-shrink-0 flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all text-xs font-bold active:scale-95">
                                            <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Cancelar
                                        </button>
                                    </div>
                                    <div class="mt-4 pt-4 border-t border-theme">
                                        <p class="text-xs font-semibold text-muted-theme mb-2 uppercase tracking-wide">Como o cliente pagou?</p>
                                        ${this.state.confirmingPaymentId === apt.id ? `
                                            <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex flex-col items-center gap-3 fade-in">
                                                <p class="text-sm font-medium text-amber-500">Confirmar <span class="font-bold uppercase">${this.state.confirmingPaymentMethod}</span>?</p>
                                                <div class="flex gap-2 w-full">
                                                    <button onclick="App.cancelCompleteAppointment()" class="flex-1 py-2 rounded-lg font-medium transition-all duration-200 input-bg text-zinc-300 hover:bg-zinc-700 text-xs border border-zinc-700 active:scale-[0.98]">
                                                        Cancelar
                                                    </button>
                                                    <button onclick="App.completeAppointment()" class="flex-1 py-2 rounded-lg font-bold transition-all duration-200 bg-amber-500 text-zinc-950 hover:bg-amber-400 text-xs shadow-md shadow-amber-500/20 active:scale-[0.98]">
                                                        Finalizar
                                                    </button>
                                                </div>
                                            </div>
                                        ` : `
                                        <div class="grid grid-cols-2 gap-2">
                                            <button onclick="App.initCompleteAppointment('${apt.id}', 'Dinheiro')" class="py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 text-xs active:scale-[0.98]">
                                                <i data-lucide="banknote" class="w-4 h-4 text-emerald-500"></i> Dinheiro
                                            </button>
                                            <button onclick="App.initCompleteAppointment('${apt.id}', 'Pix')" class="py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 text-xs active:scale-[0.98]">
                                                <i data-lucide="zap" class="w-4 h-4 text-teal-400"></i> Pix
                                            </button>
                                            <button onclick="App.initCompleteAppointment('${apt.id}', 'Débito')" class="py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 text-xs active:scale-[0.98]">
                                                <i data-lucide="credit-card" class="w-4 h-4 text-blue-400"></i> Débito
                                            </button>
                                            <button onclick="App.initCompleteAppointment('${apt.id}', 'Crédito')" class="py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 input-bg text-zinc-300 hover:bg-zinc-700 border border-zinc-700 text-xs active:scale-[0.98]">
                                                <i data-lucide="credit-card" class="w-4 h-4 text-amber-500"></i> Crédito
                                            </button>
                                        </div>
                                        `}
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    `}
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
                        <h2 class="text-2xl font-bold text-theme">Meus Cortes</h2>
                    </div>

                    <button onclick="App.startBooking()" class="w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md shadow-amber-500/20">
                        <i data-lucide="calendar" class="w-5 h-5"></i> Novo Agendamento
                    </button>

                    <div class="space-y-4 mt-8">
                        <h3 class="text-sm font-medium text-muted-theme uppercase tracking-wider">Próximos Agendamentos</h3>
                        ${clientApts.length === 0 ? `
                            <p class="text-muted-theme text-sm">Não tem nenhum agendamento futuro.</p>
                        ` : clientApts.map(apt => `
                            <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm flex items-center gap-4">
                                <div class="input-bg p-3 rounded-xl text-amber-500 flex-shrink-0">
                                    <i data-lucide="scissors" class="w-6 h-6"></i>
                                </div>
                                <div class="flex-1">
                                    <h4 class="font-semibold text-theme">${apt.service.name} <span class="font-normal text-xs text-muted-theme">com ${apt.barberName || 'Marcos Barbeiro'}</span></h4>
                                    <p class="text-xs text-muted-theme flex items-center gap-1 mt-1">
                                        <i data-lucide="calendar" class="w-3 h-3"></i> ${apt.date} às ${apt.time}
                                    </p>
                                </div>
                                <div class="text-right flex-shrink-0 flex flex-col items-end gap-2">
                                    <p class="text-sm font-medium text-zinc-300">${apt.service.price}</p>
                                    <div class="flex gap-2">
                                        <button onclick="App.editAppointment('${apt.id}')" class="p-2 input-bg text-amber-500 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 active:scale-95" title="Alterar Horário">
                                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                                        </button>
                                        <button onclick="App.cancelAppointment('${apt.id}')" class="p-2 input-bg text-rose-500 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 active:scale-95" title="Cancelar">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
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
                                <div class="text-[10px] text-zinc-500 mt-0.5 font-mono">${new Date(p.payout_date).toLocaleDateString()}</div>
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

        return `
            <div class="space-y-6 fade-in">
                <!-- Header & View Toggle -->
                <div class="flex items-end justify-between mb-2">
                    <h2 class="text-2xl font-bold text-theme">${reportTitle}</h2>
                    <div class="flex items-center gap-2">
                        <button onclick="App.exportTransactionsToCSV()" class="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-500 hover:border-amber-500/30 transition-all active:scale-95" title="Exportar CSV">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </button>
                        <div class="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                            <button onclick="App.toggleReportsView('list')" class="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${this.state.reportsView === 'list' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-500'}">Lista</button>
                            <button onclick="App.toggleReportsView('dashboard')" class="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${this.state.reportsView === 'dashboard' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-500'}">Estratégico</button>
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
                                <input type="date" id="report-start-date" value="${this.state.reportsCustomStart}" class="w-full input-bg text-zinc-300 text-sm rounded-lg p-2 border-none outline-none focus:ring-1 focus:ring-amber-500">
                            </div>
                            <div class="flex-1">
                                <label class="text-xs text-muted-theme mb-1 block">Até</label>
                                <input type="date" id="report-end-date" value="${this.state.reportsCustomEnd}" class="w-full input-bg text-zinc-300 text-sm rounded-lg p-2 border-none outline-none focus:ring-1 focus:ring-amber-500">
                            </div>
                            <button onclick="App.setCustomReportRange()" class="bg-amber-500 text-zinc-950 p-2 rounded-lg font-bold hover:bg-amber-400 active:scale-95"><i data-lucide="search" class="w-5 h-5"></i></button>
                        </div>
                    ` : ''}

                    <!-- Filtro por Método de Pagamento (Chips) -->
                    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style="-ms-overflow-style: none; scrollbar-width: none;">
                        <button onclick="App.setPaymentFilter('all')" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${this.state.paymentMethodFilter === 'all' ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}">Tudo</button>
                        <button onclick="App.setPaymentFilter('Pix')" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${this.state.paymentMethodFilter === 'Pix' ? 'bg-teal-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500 hover:text-teal-400'} flex items-center gap-1.5">
                            <div class="w-1.5 h-1.5 rounded-full ${this.state.paymentMethodFilter === 'Pix' ? 'bg-zinc-950' : 'bg-teal-500'}"></div> Pix
                        </button>
                        <button onclick="App.setPaymentFilter('Dinheiro')" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${this.state.paymentMethodFilter === 'Dinheiro' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500 hover:text-emerald-400'} flex items-center gap-1.5">
                            <div class="w-1.5 h-1.5 rounded-full ${this.state.paymentMethodFilter === 'Dinheiro' ? 'bg-zinc-950' : 'bg-emerald-500'}"></div> Dinheiro
                        </button>
                        <button onclick="App.setPaymentFilter('Crédito')" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${this.state.paymentMethodFilter === 'Crédito' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500 hover:text-amber-400'} flex items-center gap-1.5">
                            <div class="w-1.5 h-1.5 rounded-full ${this.state.paymentMethodFilter === 'Crédito' ? 'bg-zinc-950' : 'bg-amber-500'}"></div> Crédito
                        </button>
                        <button onclick="App.setPaymentFilter('Débito')" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${this.state.paymentMethodFilter === 'Débito' ? 'bg-blue-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500 hover:text-blue-400'} flex items-center gap-1.5">
                            <div class="w-1.5 h-1.5 rounded-full ${this.state.paymentMethodFilter === 'Débito' ? 'bg-zinc-950' : 'bg-blue-500'}"></div> Débito
                        </button>
                    </div>

                    <!-- Filtro de Status de Pagamento -->
                    <div class="flex items-center gap-2 mt-2">
                        <span class="text-[9px] font-black text-muted-theme uppercase tracking-widest mr-1 opacity-50">Status:</span>
                        <button onclick="App.setPaymentStatusFilter('pending')" class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${this.state.paymentStatusFilter === 'pending' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-zinc-800 text-zinc-500'}">Pendentes</button>
                        <button onclick="App.setPaymentStatusFilter('all')" class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${this.state.paymentStatusFilter === 'all' ? 'bg-zinc-200 text-zinc-950 shadow-lg' : 'bg-zinc-800 text-zinc-500'}">Arquivados</button>
                    </div>
                </div>
                </div>

                <!-- Resumo Principal -->
                <div class="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 shadow-lg shadow-amber-500/20 relative overflow-hidden transition-all duration-300">
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
                                const isExpanded = this.state.expandedTransactionId === tx.id;
                                return `
                                <div onclick="App.toggleTransactionExpand('${tx.id}')" class="card-bg rounded-xl border ${isExpanded ? 'border-amber-500/50 bg-amber-500/5 shadow-amber-500/10' : 'border-theme shadow-sm'} p-3 shadow-md flex items-start justify-between hover:border-amber-500/30 transition-all gap-3 cursor-pointer group">
                                    <div class="flex items-start gap-3 min-w-0 flex-1">
                                        <div class="input-bg p-2 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-zinc-800 transition-colors">
                                            ${tx.paymentMethod === 'Pix' ? '<i data-lucide="zap" class="w-5 h-5 text-teal-400"></i>' : tx.paymentMethod === 'Dinheiro' ? '<i data-lucide="banknote" class="w-5 h-5 text-emerald-500"></i>' : tx.paymentMethod === 'Débito' ? '<i data-lucide="credit-card" class="w-5 h-5 text-blue-400"></i>' : '<i data-lucide="credit-card" class="w-5 h-5 text-amber-500"></i>'}
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <div class="flex items-center gap-2">
                                                <p class="font-bold text-theme text-sm truncate">${tx.clientName}</p>
                                                <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-muted-theme transition-transform duration-300 ${isExpanded ? 'rotate-180 text-amber-500' : 'group-hover:translate-y-0.5'}"></i>
                                            </div>
                                            <div class="text-[10px] text-muted-theme flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <span class="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 font-bold text-amber-500 uppercase tracking-tighter flex-shrink-0">${tx.paymentMethod}</span>
                                                <span class="opacity-30 flex-shrink-0">•</span>
                                                <span class="${isExpanded ? 'whitespace-normal leading-relaxed text-zinc-300' : 'truncate block'} transition-all">${tx.service.name}</span>
                                                ${isManagement && tx.barberName ? `
                                                    <span class="opacity-30 flex-shrink-0">•</span>
                                                    <span class="text-amber-500 font-bold uppercase tracking-tighter bg-amber-500/10 px-1 rounded truncate flex-shrink-0">${tx.barberName.split(' ')[0]}</span>
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
                    <div class="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                        <button onclick="App.toggleReportsView('list')" class="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all text-zinc-500">Lista</button>
                        <button onclick="App.toggleReportsView('dashboard')" class="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all bg-amber-500 text-zinc-950">Estratégico</button>
                    </div>
                </div>

                <!-- KPI Cards Grid -->
                <div class="grid grid-cols-2 gap-3">
                    <div class="card-bg border border-zinc-800 p-4 rounded-2xl space-y-1 shadow-sm">
                        <p class="text-[10px] uppercase font-black text-muted-theme tracking-widest">Ticket Médio</p>
                        <h4 class="text-xl font-bold text-theme">R$ ${stats.avgTicket.toFixed(2)}</h4>
                        <div class="flex items-center gap-1 text-[10px] text-zinc-500">
                            <i data-lucide="info" class="w-3 h-3"></i> este mês
                        </div>
                    </div>
                    <div class="card-bg border border-zinc-800 p-4 rounded-2xl space-y-1 shadow-sm">
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
                        <h3 class="text-sm font-bold text-white flex items-center gap-2 italic">
                            <i data-lucide="line-chart" class="w-4 h-4 text-amber-500"></i> Evolução de Faturamento
                        </h3>
                        <span class="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-bold uppercase tracking-tighter">Últimos 6 meses</span>
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
                            <div class="flex items-center justify-between p-3 card-bg rounded-xl border border-zinc-800/50">
                                <div class="flex items-center gap-3">
                                    <span class="w-6 h-6 rounded flex items-center justify-center bg-zinc-800 text-[10px] font-black ${idx === 0 ? 'text-amber-500 border border-amber-500/20' : 'text-zinc-500'}">${idx + 1}</span>
                                    <span class="text-sm font-medium text-theme">${s.name}</span>
                                </div>
                                <span class="text-xs font-bold text-zinc-400">${s.count} <span class="text-[10px] font-normal uppercase opacity-50">cortes</span></span>
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
                        <button onclick="App.toggleShopEdit()" class="p-2 input-bg rounded-full text-muted-theme hover:text-white">
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
                            <input type="text" id="shop-name" value="${s.name}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Slogan / Frase de Impacto</label>
                            <input type="text" id="shop-slogan" value="${s.slogan || ''}" placeholder="Ex: A melhor experiência em estilo e cuidado." class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>

                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Logo da Barbearia</label>
                            
                            <div class="flex items-center gap-4 p-4 card-bg border border-zinc-700 rounded-2xl">
                                <div class="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 border-2 border-zinc-700 flex-shrink-0">
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
                                        <label for="shop-logo-input" class="cursor-pointer px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-theme text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center gap-2">
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
                                <input type="text" id="shop-street" value="${s.address_street}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Cidade / Estado</label>
                                <input type="text" id="shop-city" value="${s.address_city}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">WhatsApp (Apenas Números)</label>
                                <input type="text" id="shop-whatsapp" inputmode="numeric" value="${s.whatsapp}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Telefone Comercial</label>
                                <input type="text" id="shop-phone" inputmode="numeric" value="${s.phone}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                        </div>
                        <div class="space-y-4 pt-4 border-t border-theme/50">

                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">URL Instagram</label>
                                <input type="text" id="shop-instagram" value="${s.instagram_url}" class="w-full input-bg border border-zinc-700 rounded-xl p-2 text-theme focus:border-amber-500 outline-none transition-colors text-xs" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">URL Facebook</label>
                                <input type="text" id="shop-facebook" value="${s.facebook_url || ''}" class="w-full input-bg border border-zinc-700 rounded-xl p-2 text-theme focus:border-amber-500 outline-none transition-colors text-xs" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">URL do Google (Avaliação)</label>
                                <input type="text" id="shop-google" value="${s.google_review_url}" class="w-full input-bg border border-zinc-700 rounded-xl p-2 text-theme focus:border-amber-500 outline-none transition-colors text-xs" />
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button onclick="App.toggleShopEdit()" class="flex-1 py-4 rounded-xl font-bold transition-all duration-200 input-bg text-muted-theme hover:bg-zinc-700 border border-zinc-700 shadow-sm">
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
                            <button onclick="App.toggleShopManagement()" class="p-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all active:scale-95 shadow-lg border border-zinc-700 flex items-center gap-2 font-bold text-xs" title="Gestão Avançada">
                                <i data-lucide="settings" class="w-4 h-4 text-zinc-300"></i> Painel
                            </button>
                        ` : ''}
                        ${isStaff ? `
                            <button onclick="App.toggleShopEdit()" class="p-2.5 bg-amber-500 text-zinc-950 rounded-xl hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/20 flex items-center gap-2 font-bold text-xs">
                                <i data-lucide="edit-3" class="w-4 h-4"></i> Editar
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Intro -->
                <div class="relative card-bg border border-theme rounded-3xl p-8 shadow-xl overflow-hidden flex flex-col items-center text-center mt-4">
                    <div class="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <div class="w-24 h-24 rounded-full flex items-center justify-center mb-5 z-10 border-4 border-zinc-950 shadow-2xl relative overflow-hidden bg-zinc-900">
                        ${s.logo_url ? `
                            <img src="${s.logo_url}" alt="Logo" class="w-full h-full object-cover">
                        ` : `
                            <i data-lucide="scissors" class="w-10 h-10 text-amber-500"></i>
                        `}
                    </div>
                    <h2 class="text-3xl font-black text-theme relative z-10 tracking-tight italic uppercase">${s.name}</h2>
                    <p class="text-muted-theme text-sm mt-2 relative z-10 font-medium">${s.slogan || 'A melhor experiência em estilo e cuidado.'}</p>
                </div>

                <!-- Contatos Rápidos -->
                <div class="space-y-4">
                    <h3 class="text-[10px] font-bold text-muted-theme uppercase tracking-[0.25em] mb-4 mt-8 flex items-center gap-2">
                        <div class="w-8 h-px bg-theme/20"></div> Contato e Redes Sociais
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                        <a href="https://wa.me/${s.whatsapp}" target="_blank" class="bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/10 hover:bg-[#25D366]/20 transition-all duration-300 rounded-3xl p-4 flex flex-col items-center gap-3 justify-center shadow-lg active:scale-95">
                            <div class="bg-[#25D366]/20 p-2.5 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.012 2c-5.508 0-9.987 4.479-9.987 9.988 0 1.75.452 3.457 1.319 4.972L2 22l5.161-1.353a9.948 9.948 0 0 0 4.851 1.226c5.509 0 10.013-4.504 10.013-10.013s-4.504-10.012-10.013-10.012zm5.823 14.16c-.25.713-1.464 1.3-2.022 1.38-.501.071-1.077.106-1.745-.107-2.617-.837-4.305-3.486-4.436-3.66-.131-.174-1.063-1.411-1.063-2.695 0-1.284.672-1.921.912-2.181.25-.26-.145-.51-.145-.51l1.107-.107c.25.011.511.022.753.593.25.592.511 1.254.511 1.254s.061.127.018.239a.44.44 0 0 1-.223.239c-.131.061-.223.111-.315.207-.131.131-.274.275-.018.711.25.436.56 1.01.99 1.48.583.633 1.137.95 1.623 1.17 1.545.698 2.37.5 2.766.1a1.8 1.8 0 0 1 .536-.71c.145-.126.315-.175.56-.08.68.254 1.25.54 2.1 1.05zm0 0"/></svg>
                            </div>
                            <span class="text-xs font-black uppercase tracking-tighter">WhatsApp</span>
                        </a>
                        <a href="tel:+55${s.phone.replace(/\D/g, '')}" class="input-bg text-theme border border-theme/50 hover:bg-zinc-700 transition-all duration-300 rounded-3xl p-4 flex flex-col items-center gap-3 justify-center shadow-lg active:scale-95">
                            <div class="bg-zinc-800 p-2.5 rounded-xl border border-white/5">
                                <i data-lucide="phone" class="w-6 h-6"></i>
                            </div>
                            <span class="text-xs font-black uppercase tracking-tighter">${this.formatDisplayPhone(s.phone)}</span>
                        </a>
                        <a href="${s.instagram_url}" target="_blank" class="bg-gradient-to-tr from-[#f09433]/10 via-[#e6683c]/10 to-[#bc1888]/10 text-[#e1306c] border border-[#e1306c]/10 hover:bg-[#e1306c]/20 transition-all duration-300 rounded-3xl p-4 flex flex-col items-center gap-3 justify-center shadow-lg active:scale-95">
                            <div class="bg-[#bc1888]/20 p-2.5 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                            </div>
                            <span class="text-xs font-black uppercase tracking-tighter">Instagram</span>
                        </a>
                        <a href="${s.facebook_url || '#'}" target="_blank" class="bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-all duration-300 rounded-3xl p-4 flex flex-col items-center gap-3 justify-center shadow-lg active:scale-95">
                            <div class="bg-[#1877F2]/20 p-2.5 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.792 5 15.536 5H18V0h-3.977C10.038 0 9 2.105 9 5.589V8z"/></svg>
                            </div>
                            <span class="text-xs font-black uppercase tracking-tighter">Facebook</span>
                        </a>
                    </div>
                    
                    <!-- Novo: Botão Google Review -->
                    <div class="mt-4 pt-4 border-t border-theme/20">
                        <a href="${s.google_review_url}" target="_blank" class="w-full bg-zinc-800/40 hover:bg-zinc-800/60 border border-theme/50 transition-all duration-300 rounded-3xl p-5 flex items-center justify-between shadow-sm group active:scale-[0.98]">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-2xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-full h-full">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/>
                                    </svg>
                                </div>
                                <div class="text-left">
                                    <h4 class="text-sm font-bold text-theme">Avalie-nos no Google</h4>
                                    <p class="text-[10px] text-muted-theme font-medium leading-none mt-1">Sua nota nos ajuda a crescer!</p>
                                </div>
                            </div>
                            <div class="bg-amber-500/10 p-2.5 rounded-xl text-amber-500 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all duration-500 shadow-inner">
                                <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                            </div>
                        </a>
                    </div>
                </div>

                <div class="space-y-4 pt-6">
                    <h3 class="text-[10px] font-bold text-muted-theme uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                        <div class="w-8 h-px bg-theme/20"></div> Nossa Localização
                    </h3>
                    <div class="card-bg border border-theme rounded-3xl p-6 shadow-xl flex flex-col gap-6 group hover:border-amber-500/30 transition-all duration-300">
                        <div class="flex items-center gap-5">
                            <div class="bg-zinc-900 border border-amber-500/20 p-4 rounded-2xl text-amber-500 self-start shadow-inner group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all duration-500">
                                <i data-lucide="map-pin" class="w-7 h-7"></i>
                            </div>
                            <div class="flex-1">
                                <p class="font-black text-theme text-lg italic tracking-tight uppercase">${s.address_street}</p>
                                <p class="text-sm text-muted-theme font-medium mt-1">${s.address_city}</p>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="App.copyAddress()" class="p-3 bg-zinc-800 text-amber-500 rounded-xl hover:bg-zinc-700 transition-all active:scale-95 border border-amber-500/10 shadow-sm" title="Copiar Endereço">
                                    <i data-lucide="copy" class="w-5 h-5"></i>
                                </button>
                                <button onclick="App.shareLocation()" class="p-3 bg-zinc-800 text-amber-500 rounded-xl hover:bg-zinc-700 transition-all active:scale-95 border border-amber-500/10 shadow-sm" title="Compartilhar">
                                    <i data-lucide="share-2" class="w-5 h-5"></i>
                                </button>
                            </div>
                        </div>
                        <a href="https://maps.google.com/?q=${encodeURIComponent(s.address_street + ', ' + s.address_city)}" target="_blank" class="w-full py-4 rounded-2xl font-black transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] bg-zinc-900 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-zinc-950 hover:border-amber-500 shadow-lg text-xs uppercase tracking-widest">
                            <i data-lucide="navigation" class="w-5 h-5"></i> Como chegar pelo Mapa
                        </a>
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
                            <div class="card-bg border ${b.is_active ? 'border-theme' : 'border-red-500/30 opacity-60'} rounded-2xl p-4 shadow-sm flex items-center justify-between transition-all">
                                <div class="flex items-center gap-3">
                                    <img src="${b.avatar}" class="w-10 h-10 rounded-full object-cover border border-zinc-700" />
                                    <div>
                                        <h4 class="font-bold text-theme">${b.name}</h4>
                                        <p class="text-[10px] uppercase text-muted-theme tracking-wide">${b.is_active ? '<span class="text-emerald-500 font-black">Ativo</span> no Salão' : '<span class="text-red-500 font-bold">Desativado</span>'}</p>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="App.toggleBarberStatus(${b.id})" class="p-2 input-bg rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 active:scale-95" title="${b.is_active ? 'Desativar' : 'Ativar'}">
                                        <i data-lucide="${b.is_active ? 'pause' : 'play'}" class="w-4 h-4 ${b.is_active ? 'text-amber-500' : 'text-emerald-500'}"></i>
                                    </button>
                                    <button onclick="App.removeBarber(${b.id})" class="p-2 input-bg text-red-500 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 active:scale-95" title="Remover Barbeiro">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (tab === 'services') {
            contentHtml = `
                <div class="space-y-4 fade-in">
                    <!-- Formulário Novo Serviço -->
                    <div class="card-bg border border-theme rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 class="text-sm font-bold text-theme flex items-center gap-2"><i data-lucide="scissors" class="w-4 h-4 text-amber-500"></i> Cadastrar Serviço</h3>
                        
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Nome do Serviço *</label>
                            <input type="text" id="new-service-name" placeholder="Ex: Corte Degrade + Barba" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Preço (R$) *</label>
                                <input type="number" id="new-service-price" inputmode="decimal" placeholder="45.00" step="0.01" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Duração (Minutos) *</label>
                                <input type="number" id="new-service-duration" inputmode="numeric" placeholder="30" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                        </div>
                        <button onclick="App.addService()" class="w-full py-3 rounded-xl font-bold transition-all duration-200 bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2">
                            <i data-lucide="plus" class="w-4 h-4"></i> Adicionar ao Catálogo
                        </button>
                    </div>

                    <!-- Lista de Serviços Existentes -->
                    <h3 class="text-xs font-bold text-muted-theme uppercase tracking-wider mt-6 mb-2">Catálogo Atual</h3>
                    <div class="space-y-3">
                        ${SERVICES.map(s => `
                            <div class="card-bg border border-theme rounded-2xl p-4 shadow-sm flex items-center justify-between transition-all group hover:border-amber-500">
                                <div>
                                    <h4 class="font-bold text-theme">${s.name}</h4>
                                    <p class="text-xs text-muted-theme flex items-center gap-2 mt-1">
                                        <span class="text-amber-500 font-bold">${s.price}</span>
                                        <span class="opacity-50">•</span>
                                        <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${s.duration}</span>
                                    </p>
                                </div>
                                <div>
                                    <button onclick="App.removeService(${s.id})" class="p-2 input-bg text-red-500 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 active:scale-95" title="Remover">
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
            const selectedDate = this.state.adminScheduleDate;
            const currentBarber = BARBERS.find(b => b.user_id === selectedBarberId);

            contentHtml = `
                <div class="space-y-6 fade-in">
                    <!-- Seletores -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${this.state.role === 'admin' ? `
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-black tracking-widest pl-1">Selecionar Barbeiro</label>
                                <select onchange="App.setAdminScheduleBarber(this.value)" class="w-full card-bg border border-theme rounded-xl p-3 text-theme outline-none focus:border-amber-500">
                                    <option value="" ${!selectedBarberId ? 'selected' : ''}>--- Global (Todos) ---</option>
                                    ${BARBERS.map(b => `<option value="${b.user_id}" ${selectedBarberId === b.user_id ? 'selected' : ''}>${b.name}</option>`).join('')}
                                </select>
                            </div>
                        ` : ''}
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-black tracking-widest pl-1">Escolher Data</label>
                            <input type="date" value="${selectedDate}" onchange="App.setAdminScheduleDate(this.value)" class="w-full card-bg border border-theme rounded-xl p-3 text-theme outline-none focus:border-amber-500" />
                        </div>
                    </div>

                    <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                        <i data-lucide="info" class="w-5 h-5 text-amber-500 mt-0.5"></i>
                        <div>
                            <p class="text-xs text-amber-200/90 font-bold leading-relaxed">
                                ${!selectedBarberId ? '<b>MODO GLOBAL:</b> Bloqueios afetarão todos os barbeiros.' : `Gestão de horários para <b>${currentBarber?.name || 'Profissional'}</b>.`}
                            </p>
                            <p class="text-[10px] text-amber-200/60 mt-1">
                                Clique para bloquear/liberar. Use a data para folgas pontuais ou deixe sem data para horários diários (ex: almoço).
                            </p>
                        </div>
                    </div>
                    
                    <!-- Aba de tipo de bloqueio (Recorrente vs Específico) -->
                    <div class="flex gap-2 p-1 bg-zinc-900 rounded-xl">
                        <button onclick="App.setAdminScheduleDate('')" class="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!selectedDate ? 'bg-amber-500 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}">Diário / Fixo</button>
                        <button onclick="App.setAdminScheduleDate('${new Date().toISOString().split('T')[0]}')" class="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selectedDate ? 'bg-amber-500 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}">Data Específica</button>
                    </div>

                    <!-- Ações em Massa -->
                    <div class="flex gap-2">
                        <button onclick="App.bulkToggleDay('${selectedBarberId}', '${selectedDate}', 'block')" class="flex-1 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <i data-lucide="lock" class="w-3.5 h-3.5"></i> Bloquear Dia Inteiro
                        </button>
                        <button onclick="App.bulkToggleDay('${selectedBarberId}', '${selectedDate}', 'release')" class="flex-1 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <i data-lucide="unlock" class="w-3.5 h-3.5"></i> Liberar Tudo
                        </button>
                    </div>

                    <div class="grid grid-cols-4 gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                        ${AVAILABLE_TIMES.map(time => {
                            const block = (this.state.blockedTimesFull || []).find(b => 
                                b.blocked_time === time && 
                                b.barber_id === (selectedBarberId || null) && 
                                b.date === (selectedDate || null)
                            );
                            
                            // Lógica Invertida para Recorrente: Se NÃO tem registro, está BLOQUEADO.
                            // Para Global/Data específica: Se TEM registro, está BLOQUEADO.
                            const isRecurrentMode = selectedBarberId && !selectedDate;
                            const isBlocked = isRecurrentMode ? !block : !!block;
                            
                            return `
                                <button onclick="App.toggleTimeBlock('${time}', ${selectedBarberId ? `'${selectedBarberId}'` : 'null'}, ${selectedDate ? `'${selectedDate}'` : 'null'})" class="py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${isBlocked ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'card-bg border-theme text-amber-500 hover:border-amber-500 shadow-lg shadow-amber-500/5'}">
                                    <span class="text-[10px] font-black">${time}</span>
                                    ${isBlocked ? '<i data-lucide="lock" class="w-3 h-3"></i>' : '<i data-lucide="unlock" class="w-3 h-3 opacity-30"></i>'}
                                </button>
                            `;
                        }).join('')}
                    </div>
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
                    <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 mb-2 flex items-start gap-3">
                        <i data-lucide="shield" class="w-5 h-5 text-zinc-400 mt-0.5"></i>
                        <p class="text-xs text-zinc-400 font-medium leading-relaxed">
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
                            <div class="card-bg border border-zinc-700/50 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 font-bold text-theme">
                                        ${(c.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-theme text-sm">${c.name || 'Usuário Sem Nome'}</h4>
                                        <p class="text-[10px] text-muted-theme tracking-wide">${c.email || c.phone || 'Sem contato'}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 w-full md:w-auto">
                                    <select id="role-select-${c.id}" class="flex-1 md:w-auto bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-theme focus:border-amber-500 outline-none">
                                        <option value="client" ${c.role === 'client' ? 'selected' : ''}>Cliente</option>
                                        <option value="barber" ${c.role === 'barber' ? 'selected' : ''}>Barbeiro</option>
                                        <option value="manager" ${c.role === 'manager' ? 'selected' : ''}>Gerente</option>
                                        <option value="admin" ${c.role === 'admin' ? 'selected' : ''}>Admin</option>
                                    </select>
                                    ${this.state.role === 'admin' ? `
                                        <button onclick="App.updateUserRole('${c.id}', document.getElementById('role-select-${c.id}').value, '${c.name}', '')" class="p-2 bg-amber-500 text-zinc-950 rounded-lg hover:bg-amber-400 transition-colors shadow-sm font-bold text-xs active:scale-95 whitespace-nowrap">
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
                    <div class="space-y-3 pb-4">
                        ${sortedClients.length === 0 ? `
                             <div class="p-12 text-center text-muted-theme space-y-3 fade-in">
                                <i data-lucide="cloud-lightning" class="w-8 h-8 mx-auto opacity-20"></i>
                                <p class="text-xs font-bold tracking-widest uppercase opacity-40">Nenhum cliente encontrado...</p>
                            </div>
                        ` : sortedClients.map(client => `
                            <div class="card-bg rounded-2xl border border-zinc-700/50 p-4 shadow-sm flex flex-col gap-4 hover:border-zinc-600 transition-colors">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-amber-500 text-lg">
                                        ${(client.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-bold text-theme text-base truncate">${client.name || 'Usuário'}</h3>
                                        <p class="text-muted-theme text-[10px] flex items-center gap-1.5 mt-0.5 truncate uppercase tracking-tighter">
                                            <i data-lucide="phone" class="w-3 h-3 text-muted-theme"></i> ${client.phone || client.email || 'Sem contato'}
                                        </p>
                                    </div>
                                    <div class="text-right flex-shrink-0">
                                        <div class="inline-flex flex-col items-center justify-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-2 py-1 min-w-[45px]">
                                            <span class="text-amber-500 font-bold text-xs leading-none">${client.cut_count || 0}</span>
                                            <span class="text-[8px] text-amber-500/80 font-black uppercase mt-0.5 tracking-tighter">Cortes</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex gap-2 pt-3 border-t border-zinc-800">
                                    <a href="https://wa.me/55${client.phone}" target="_blank" class="flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-xs font-bold border border-[#25D366]/10">
                                        <i data-lucide="message-square" class="w-4 h-4"></i> Whats
                                    </a>
                                    <a href="tel:+55${client.phone}" class="flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors text-xs font-bold">
                                        <i data-lucide="phone" class="w-4 h-4"></i> Ligar
                                    </a>
                                </div>
                            </div>
                        `).join('')}
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
                    <div class="card-bg border border-theme p-5 rounded-3xl shadow-xl bg-gradient-to-br from-zinc-900 to-zinc-950 relative overflow-hidden">
                        <div class="flex justify-between items-start z-10 relative">
                            <div>
                                <p class="text-[10px] uppercase font-black text-muted-theme tracking-widest mb-1">Total Pendente de Repasse</p>
                                <h3 class="text-3xl font-bold text-theme">R$ ${stats?.pendingBalance.toFixed(2).replace('.', ',') || '0,00'}</h3>
                                <p class="text-[9px] text-zinc-500 mt-2 italic">Comissões não quitadas menos adiantamentos.</p>
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
                                    <div class="card-bg rounded-2xl border border-zinc-800 p-4 shadow-sm flex items-center justify-between gap-3 hover:border-amber-500/30 transition-all">
                                        <div class="min-w-0">
                                            <p class="font-bold text-theme text-sm truncate">${b.name}</p>
                                            <p class="text-[10px] text-muted-theme uppercase font-black tracking-tighter mt-0.5">Saldo: <span class="text-amber-500">R$ ${bFinalBalance.toFixed(2).replace('.', ',')}</span></p>
                                        </div>
                                        <div class="flex gap-2">
                                            <button onclick="App.openPayoutModal('${b.user_id}', '${b.name}', ${bFinalBalance})" class="px-3 py-2 bg-amber-500 text-zinc-950 text-[10px] font-black uppercase rounded-lg shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                                                Pagar
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Histórico de Repasses -->
                    <div class="space-y-4 pt-4 border-t border-zinc-800">
                        <h3 class="text-sm font-bold text-theme uppercase tracking-wider flex items-center gap-2">
                            <i data-lucide="history" class="w-4 h-4 text-zinc-500"></i> Histórico de Pagamentos
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
                                        <div class="card-bg border border-zinc-800/50 p-3 rounded-xl flex items-center justify-between">
                                            <div class="text-[10px]">
                                                <p class="font-bold text-theme uppercase tracking-tighter">${barber.name}</p>
                                                <p class="text-zinc-500 mt-0.5">${new Date(p.payout_date).toLocaleDateString()} • ${p.type === 'full' ? 'QUITAÇÃO' : 'ADIANTAMENTO'}</p>
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
                        <p class="text-[10px] text-zinc-500 mb-4 text-balance leading-relaxed">Apagar todo o faturamento, agendamentos e histórico de pagamentos no banco de dados. Use isso <b>apenas quando for inaugurar o sistema limpo</b> para abrir para os barbeiros. O botão ZERAR lá no topo quita as dívidas mas mantém o Faturamento.</p>
                        <button onclick="App.confirmWipeDatabase()" class="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-500 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-md shadow-red-500/20 active:scale-95 border border-red-500/20">
                            <i data-lucide="bomb" class="w-4 h-4"></i> APAGAR TUDO (INICIAR APLICATIVO)
                        </button>
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
                    <button onclick="App.toggleShopManagement()" class="p-2 input-bg rounded-lg text-muted-theme hover:text-white border border-zinc-700 shadow-sm transition-colors active:scale-95">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Abas da Gestão -->
                <div class="flex gap-2 p-1 bg-zinc-900 rounded-xl overflow-x-auto scrollbar-hide border border-zinc-800">
                    <button onclick="App.setAdminShopTab('barbers')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'barbers' ? 'bg-zinc-800 text-amber-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}">
                        <i data-lucide="users" class="w-3.5 h-3.5"></i> Equipe
                    </button>
                    <button onclick="App.setAdminShopTab('services')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'services' ? 'bg-zinc-800 text-amber-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}">
                        <i data-lucide="scissors" class="w-3.5 h-3.5"></i> Serviços
                    </button>
                    <button onclick="App.setAdminShopTab('clients')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'clients' ? 'bg-zinc-800 text-amber-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}">
                        <i data-lucide="contact" class="w-3.5 h-3.5"></i> Clientes
                    </button>
                    <button onclick="App.setAdminShopTab('schedules')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'schedules' ? 'bg-zinc-800 text-amber-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}">
                        <i data-lucide="clock" class="w-3.5 h-3.5"></i> Horários
                    </button>
                    <button onclick="App.setAdminShopTab('accounts')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'accounts' ? 'bg-zinc-800 text-amber-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}">
                        <i data-lucide="shield" class="w-3.5 h-3.5"></i> Contas
                    </button>
                    <button onclick="App.setAdminShopTab('financeiro')" class="flex-1 min-w-[90px] text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'financeiro' ? 'bg-zinc-800 text-amber-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}">
                        <i data-lucide="wallet" class="w-3.5 h-3.5"></i> Financeiro
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
            'client': { label: 'Cliente', color: 'bg-zinc-500/10 text-zinc-400', icon: 'user' }
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
                            <input type="text" id="edit-name" value="${this.state.userProfile?.name || ''}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Celular (Novo Celular = Novo Login)</label>
                            <input type="tel" id="edit-phone" inputmode="numeric" value="${this.state.userProfile?.phone || ''}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">CPF</label>
                                <input type="tel" id="edit-cpf" inputmode="numeric" value="${this.state.userProfile?.cpf || ''}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">Nascimento</label>
                                <input type="date" id="edit-birth" value="${this.dbToInputDate(this.state.userProfile?.birth_date)}" class="w-full input-bg border border-zinc-700 rounded-xl p-3 text-theme focus:border-amber-500 outline-none transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button onclick="App.toggleProfileEdit()" class="flex-1 py-4 rounded-xl font-bold transition-all duration-200 input-bg text-muted-theme hover:bg-zinc-700 border border-zinc-700">
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
                    <div class="flex items-center gap-4 text-zinc-300 p-2 border-b border-theme/50">
                        <i data-lucide="smartphone" class="w-5 h-5 text-muted-theme"></i>
                        <div class="flex-1">
                            <p class="text-xs text-muted-theme uppercase font-bold tracking-wider">Celular</p>
                            <p class="text-sm font-medium text-theme">${this.state.userProfile?.phone || ''}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex items-center gap-3 text-zinc-300 p-2">
                             <i data-lucide="credit-card" class="w-5 h-5 text-muted-theme"></i>
                             <div class="flex-1">
                                <p class="text-[10px] text-muted-theme uppercase font-bold tracking-wider">CPF</p>
                                <p class="text-xs text-theme font-medium">${this.state.userProfile?.cpf || '---'}</p>
                             </div>
                        </div>
                        <div class="flex items-center gap-3 text-zinc-300 p-2">
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
                        <p class="text-xs text-muted-theme">Dados protegidos via Supabase Cloud.</p>
                    </div>
                </div>

                <div class="space-y-2 mt-8">
                    <h3 class="text-sm font-medium text-muted-theme uppercase tracking-wider mb-2">Preferências</h3>
                    <div class="card-bg rounded-2xl border border-theme p-4 shadow-sm divide-y divide-zinc-800">
                        <div class="flex items-center justify-between py-3" onclick="App.requestNotificationPermission()">
                            <div class="flex items-center gap-3">
                                <i data-lucide="bell" class="w-5 h-5 text-muted-theme"></i>
                                <span class="text-theme">Notificações Push</span>
                            </div>
                            <div class="w-10 h-6 ${Notification.permission === 'granted' ? 'bg-amber-500' : 'bg-zinc-800'} rounded-full flex items-center p-1 cursor-pointer transition-colors">
                                <div class="w-4 h-4 card-bg rounded-full ${Notification.permission === 'granted' ? 'translate-x-4' : 'translate-x-0'} shadow-sm transition-transform"></div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between py-3" onclick="App.toggleTheme()">
                            <div class="flex items-center gap-3">
                                <i data-lucide="${this.state.theme === 'dark' ? 'moon' : 'sun'}" class="w-5 h-5 text-muted-theme"></i>
                                <span class="text-theme">Modo ${this.state.theme === 'dark' ? 'Escuro' : 'Claro'}</span>
                            </div>
                            <div class="w-10 h-6 ${this.state.theme === 'light' ? 'bg-zinc-300' : 'bg-amber-500'} rounded-full flex items-center p-1 cursor-pointer transition-colors">
                                <div class="w-4 h-4 card-bg rounded-full ${this.state.theme === 'light' ? 'translate-x-0' : 'translate-x-4'} shadow-sm transition-transform"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <button onclick="App.logout()" class="w-full mt-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] bg-transparent border border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500">
                    <i data-lucide="log-out" class="w-5 h-5"></i> Sair da Conta
                </button>
            </div>
        `;
    },

    renderSplash() {
        const s = this.state.shopSettings;
        return `
            <div class="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-[300] fade-in-fast">
                <div class="relative">
                    <div class="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                    <div class="w-32 h-32 rounded-3xl overflow-hidden bg-zinc-900 border-2 border-amber-500/20 shadow-2xl relative z-10 flex items-center justify-center animate-bounce-subtle">
                        ${s?.logo_url ? `
                            <img src="${s.logo_url}" class="w-full h-full object-cover" />
                        ` : `
                            <i data-lucide="scissors" class="w-16 h-16 text-amber-500"></i>
                        `}
                    </div>
                </div>
                
                <div class="mt-8 text-center space-y-2">
                    <h2 class="text-xl font-bold text-white tracking-widest uppercase italic">${s?.name || 'Carregando...'}</h2>
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
    }
});
