const fs = require('fs');
let lines = fs.readFileSync('js/views.js', 'utf8').split('\n');

const bStart = lines.findIndex(l => l.includes("const clientInitial = (apt.clientName[0] || 'C').toUpperCase();"));
const bEnd = lines.findIndex((l, i) => i > bStart && l.includes("                                `;"));

if (bStart > -1 && bEnd > -1) {
    let block = lines.slice(bStart, bEnd + 1).join('\n');
    block = block.replace("return `", "return `");
    
    const newMethod = '    renderAppointmentCard(apt) {\n' + block + '\n    },';
    
    const raIdx = lines.findIndex(l => l.includes('    renderAgendamentos() {'));
    lines.splice(raIdx, 0, newMethod, '');
    
    // Replace inside the map
    const newRaIdx = lines.findIndex(l => l.includes('    renderAgendamentos() {'));
    const mapBStart = lines.findIndex((l, i) => i > newRaIdx && l.includes("const clientInitial = (apt.clientName[0] || 'C').toUpperCase();"));
    const mapBEnd = lines.findIndex((l, i) => i > mapBStart && l.includes("                                `;"));
    
    if (mapBStart > -1 && mapBEnd > -1) {
        lines.splice(mapBStart, mapBEnd - mapBStart + 1, '                return this.renderAppointmentCard(apt);');
    }
    
    fs.writeFileSync('js/views.js', lines.join('\n'), 'utf8');
    console.log('SUCCESS');
} else {
    console.log('FAILED TO FIND BOUNDS');
}
