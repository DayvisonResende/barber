const fs = require('fs');

let content = fs.readFileSync('js/views.js', 'utf8');

// 1. Extract renderAppointmentCard
const startStr = "const clientInitial = (apt.clientName[0] || 'C').toUpperCase();";
const endStr = "                                </div>\n                                `;";

const firstStart = content.indexOf(startStr);
const nextEnd = content.indexOf(endStr, firstStart);
if (firstStart === -1 || nextEnd === -1) {
    console.error("Could not find card bounds!");
    process.exit(1);
}
const finalEnd = nextEnd + endStr.length;
const actualStart = content.lastIndexOf('\n', firstStart) + 1;

const cardBlock = content.substring(actualStart, finalEnd);
const renderApptCardMethod = '    renderAppointmentCard(apt) {\n' + cardBlock + '\n    },';

// 2. Insert renderAppointmentCard right before renderAgendamentos
const renderAgendamentosIdx = content.indexOf('    renderAgendamentos() {');
content = content.substring(0, renderAgendamentosIdx) + renderApptCardMethod + '\n\n' + content.substring(renderAgendamentosIdx);

// 3. Replace the original block inside renderAgendamentos with a call to this new method
const newRaIdx = content.indexOf('    renderAgendamentos() {');
const newStart = content.indexOf(startStr, newRaIdx);
const newActualStart = content.lastIndexOf('\n', newStart) + 1;
const newEndIdx = content.indexOf(endStr, newStart) + endStr.length;

const blockToReplace = content.substring(newActualStart, newEndIdx);
content = content.replace(blockToReplace, '                return this.renderAppointmentCard(apt);');

// 4. Inject renderDailyTable right before renderAgendamentos
const dailyTableMethod = `    renderDailyTable(filteredApts, dateStr) {
        const targetDate = new Date(dateStr + 'T12:00:00');
        const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const dayName = daysOfWeek[targetDate.getDay()].split('-')[0];
        const dateFmt = dateStr.split('-').reverse().join('/').slice(0, 5);

        let minMin = 8 * 60;
        let maxMin = 20 * 60;
        filteredApts.forEach(apt => {
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
            slots.push({ time: \`\${hh}:\${mm}\`, minutes: m, apts: [], isCovered: false });
        }

        let currentCoveredUntil = 0;
        slots.forEach(slot => {
            const aptsHere = filteredApts.filter(a => {
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

        return \`
            <div class="space-y-4 fade-in slide-in-up flex flex-col h-full min-h-[70vh]">
                <div class="flex items-center justify-between card-bg p-3 rounded-2xl border border-theme shadow-sm shrink-0">
                    <button onclick="App.prevAgendaDay()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 text-muted-theme hover:text-theme hover:bg-zinc-700 transition-colors active:scale-95">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    </button>
                    <div class="text-center flex-1 cursor-pointer select-none" onclick="document.getElementById('agenda-date-picker').showPicker()">
                        <h2 class="text-lg font-black text-theme uppercase tracking-wider">\${dayName}</h2>
                        <p class="text-xs text-amber-500 font-bold">\${dateFmt}</p>
                        <input type="date" id="agenda-date-picker" class="opacity-0 absolute w-0 h-0" value="\${dateStr}" onchange="App.setAgendaDay(this.value)">
                    </div>
                    <button onclick="App.nextAgendaDay()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 text-muted-theme hover:text-theme hover:bg-zinc-700 transition-colors active:scale-95">
                        <i data-lucide="arrow-right" class="w-5 h-5"></i>
                    </button>
                </div>

                <div class="flex justify-between items-center shrink-0">
                    <h3 class="text-xl font-bold text-theme">Grade Horária</h3>
                    <button onclick="App.setAgendaViewMode('list')" class="text-xs text-muted-theme bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-bold uppercase transition-colors flex items-center gap-1.5 border border-zinc-700">
                        <i data-lucide="list" class="w-3.5 h-3.5"></i> Lista
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar rounded-2xl border border-theme shadow-md relative bg-zinc-950 pb-20">
                    \${slots.map(slot => {
                        const isHour = slot.time.endsWith('00');
                        return \`
                        <div class="flex h-[40px] border-b \${isHour ? 'border-zinc-700' : 'border-zinc-800'} relative group">
                            <div class="w-16 shrink-0 border-r border-zinc-800 flex items-center justify-center text-[10px] font-bold \${isHour ? 'text-theme bg-zinc-900/80' : 'text-muted-theme/50 bg-zinc-900/30'}">
                                \${isHour || slot.apts.length > 0 ? slot.time : ''}
                            </div>
                            
                            <div class="flex-1 relative">
                                \${!slot.isCovered ? \`
                                    <button onclick="App.state.appointmentsFilterStart = '\${dateStr}'; App.state.appointmentsFilterEnd = '\${dateStr}'; App.startStaffBooking('\${dateStr}', '\${slot.time}')" class="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-amber-500/10 transition-all text-amber-500 z-0">
                                        <i data-lucide="plus" class="w-5 h-5"></i>
                                    </button>
                                \` : ''}

                                \${slot.apts.map((apt, index) => {
                                    let dur = parseInt(apt.total_duration) || 30;
                                    const spans = Math.ceil(dur / 5);
                                    const width = 100 / slot.apts.length;
                                    const left = index * width;
                                    const clientInitial = (apt.clientName[0] || 'C').toUpperCase();
                                    
                                    return \`
                                        <div onclick="App.openAppointmentModal('\${apt.id}')" 
                                             class="absolute top-[2px] bg-zinc-900 border \${apt.status === 'completed' ? 'border-emerald-500/50 border-l-emerald-500' : 'border-amber-500/50 border-l-amber-500'} border-l-[3px] rounded-lg p-2 shadow-lg cursor-pointer hover:border-amber-500 transition-colors z-10 overflow-hidden flex flex-col gap-1 hover:-translate-y-0.5"
                                             style="height: calc(\${spans * 40}px - 4px); left: calc(\${left}% + 4px); width: calc(\${width}% - 8px);">
                                            
                                            <div class="flex items-center gap-2">
                                                <div class="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-zinc-800 border border-theme flex items-center justify-center">
                                                    \${apt.clientAvatar ? \`<img src="\${apt.clientAvatar}" class="w-full h-full object-cover">\` : \`<span class="w-full h-full flex items-center justify-center text-amber-500 text-[9px] font-black">\${clientInitial}</span>\`}
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <p class="text-xs font-black text-theme truncate leading-none">\${App.escapeHTML(apt.clientName)}</p>
                                                    <p class="text-[9px] text-muted-theme truncate leading-tight mt-0.5">\${apt.services?.map(s => s.name).join(', ') || apt.service?.name || 'Serviço'}</p>
                                                </div>
                                            </div>
                                            
                                            \${spans > 2 ? \`
                                            <div class="mt-auto flex items-center justify-between text-[8px] font-bold text-muted-theme">
                                                <span>\${apt.time}</span>
                                                \${apt.barberName ? \`<span class="truncate max-w-[80px] text-right"><i data-lucide="scissors" class="w-2.5 h-2.5 inline-block -mt-0.5"></i> \${apt.barberName}</span>\` : ''}
                                            </div>
                                            \` : ''}
                                        </div>
                                    \`;
                                }).join('')}
                            </div>
                        </div>
                        \`;
                    }).join('')}
                </div>
            </div>
        \`;
    },`;

const latestRaIdx = content.indexOf('    renderAgendamentos() {');
content = content.substring(0, latestRaIdx) + dailyTableMethod + '\n\n' + content.substring(latestRaIdx);

// 5. Inject the agendaViewMode toggle logic
const injectionLogic = `
            if (this.state.agendaViewMode === 'table') {
                setTimeout(() => {
                    const mc = document.getElementById('modal-container');
                    if (mc && this.state.openAppointmentModalId) {
                        const apt = this.state.appointments.find(a => a.id === this.state.openAppointmentModalId);
                        if (apt) {
                            mc.innerHTML = \`
                                <div class="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 fade-in" onclick="if(event.target === this) App.closeAppointmentModal()">
                                    <div class="w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                                        <button onclick="App.closeAppointmentModal()" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-950 text-muted-theme hover:text-red-500 hover:bg-red-500/10 border border-theme transition-colors z-20 shadow-md">
                                            <i data-lucide="x" class="w-4 h-4"></i>
                                        </button>
                                        \${this.renderAppointmentCard(apt)}
                                    </div>
                                </div>
                            \`;
                            if (window.lucide) lucide.createIcons({ root: mc });
                        }
                    } else if (mc && !this.state.isDateRangeModalOpen && !this.state.isComandaModalOpen) {
                        mc.innerHTML = '';
                    }
                }, 0);
                return this.renderDailyTable(this.state.appointments.filter(a => a.date === this.state.agendaSelectedDate), this.state.agendaSelectedDate);
            }

            setTimeout(() => {`;

content = content.replace('            setTimeout(() => {', injectionLogic);

// 6. Add list toggle button
const listHeaderStr = `                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-theme">Agenda</h2>
                            <span class="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-medium">
                                \${filteredApts.length} serviço(s)
                            </span>
                        </div>`;
                        
const newHeaderStr = `                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-theme">Agenda</h2>
                            <div class="flex items-center gap-2">
                                <span class="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-medium">
                                    \${filteredApts.length} serviço(s)
                                </span>
                                <button onclick="App.setAgendaViewMode('table')" class="text-xs text-muted-theme bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-bold uppercase transition-colors flex items-center gap-1.5 border border-zinc-700">
                                    <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i> Tabela
                                </button>
                            </div>
                        </div>`;

content = content.replace(listHeaderStr, newHeaderStr);

fs.writeFileSync('js/views.js', content, 'utf8');
console.log('SUCCESS');
