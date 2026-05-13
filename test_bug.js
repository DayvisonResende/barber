const fs = require('fs');

const fakeState = {
    shopSettings: {
        work_start: '08:00',
        work_end: '18:00',
        working_days: [1,2,3,4,5,6]
    },
    barberConfigs: [
        { barber_id: 1, lunch_start: '12:00', lunch_end: '13:00' },
        { barber_id: 2, lunch_start: '13:00', lunch_end: '14:00' }
    ],
    BARBERS: [
        { id: 1, name: 'João Barber' },
        { id: 2, name: 'Maria Barber' }
    ]
};

const fakeApts = [
    { id: 101, time: '10:00', total_duration: 30, clientName: 'Carlos', barberName: 'João' }
];

// Extract renderDailyTable logic
let minMin = 8 * 60;
let maxMin = 18 * 60;
const lunchApts = [];
(fakeState.barberConfigs || []).forEach(cfg => {
    const bInfo = (fakeState.BARBERS || []).find(b => String(b.id) === String(cfg.barber_id));
    if (!bInfo) return;
    const lStart = cfg.lunch_start || '12:00';
    const lEnd = cfg.lunch_end || '13:00';
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
const allGridItems = [...fakeApts, ...lunchApts];

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

try {
    slots.forEach(slot => {
        slot.apts.forEach((apt, index) => {
            let dur = parseInt(apt.total_duration) || 30;
            const spans = Math.ceil(dur / 5);
            const width = 100 / slot.apts.length;
            const left = index * width;
            
            // This is the line that might crash
            const clientInitial = (apt.clientName[0] || 'C').toUpperCase();
            
            if (apt.isLunch) {
                // success
            } else {
                // success
            }
        });
    });
    console.log("SUCCESS");
} catch(e) {
    console.log("ERROR: " + e.message);
}
