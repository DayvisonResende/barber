const fs = require('fs');
let lines = fs.readFileSync('js/views.js', 'utf8').split('\n');

const block = lines.slice(1040, 1216).join('\n');

const newMethod = '    renderAppointmentCard(apt) {\n' + block + '\n    },';

const raIdx = lines.findIndex(l => l.includes('    renderAgendamentos() {'));
lines.splice(raIdx, 0, newMethod, '');

const newRaIdx = lines.findIndex(l => l.includes('    renderAgendamentos() {'));

let bStart = -1;
let bEnd = -1;
for(let i = newRaIdx; i < lines.length; i++) {
    if (lines[i].includes('const clientInitial = (apt.clientName[0] || \\'C\\').toUpperCase();')) {
        bStart = i;
    }
    if (bStart !== -1 && lines[i].includes('                                `;')) {
        bEnd = i;
        break;
    }
}

if (bStart !== -1 && bEnd !== -1) {
    lines.splice(bStart, bEnd - bStart + 1, '                return this.renderAppointmentCard(apt);');
    fs.writeFileSync('js/views.js', lines.join('\n'), 'utf8');
    console.log('SUCCESS');
} else {
    console.log('Failed to find block bounds inside renderAgendamentos', bStart, bEnd);
}
