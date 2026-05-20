const fs = require('fs');
let lines = fs.readFileSync('js/views.js', 'utf8').split('\n');

const bStart = lines.findIndex(l => l.includes("const clientInitial = (apt.clientName[0] || 'C').toUpperCase();"));
const bEnd = lines.findIndex((l, i) => i > bStart && l.includes("                                `;"));

if (bStart > -1 && bEnd > -1) {
    let block = lines.slice(bStart, bEnd + 1).join('\n');
    block = block.replace("return `", "return `"); // No regex replace to avoid syntax issues if any
    
    const newMethod = '    renderAppointmentCard(apt) {\n' + block + '\n    },';
    
    const raIdx = lines.findIndex(l => l.includes('    renderDailyTable(filteredApts, dateStr) {'));
    lines.splice(raIdx, 0, newMethod, '');
    
    fs.writeFileSync('js/views.js', lines.join('\n'), 'utf8');
    console.log('SUCCESS');
} else {
    console.log('FAILED TO FIND BOUNDS');
}
