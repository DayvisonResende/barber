const fs = require('fs');
let content = fs.readFileSync('js/views.js', 'utf8');

const startMarker = "const clientInitial = (apt.clientName[0] || 'C').toUpperCase();";
const endMarker = "                                </div>\n                                `;";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker, startIdx);

if (startIdx > -1 && endIdx > -1) {
    const finalEndIdx = endIdx + endMarker.length;
    // Walk back to start of line for startIdx
    const actualStartIdx = content.lastIndexOf('\n', startIdx) + 1;
    
    let block = content.substring(actualStartIdx, finalEndIdx);
    
    // Create new method string
    const newMethod = '    renderAppointmentCard(apt) {\n' + block.replace(/return `/, 'return `') + '\n    },';
    
    // Find where renderAgendamentos starts
    const raIdx = content.indexOf('    renderAgendamentos() {');
    
    content = content.substring(0, raIdx) + newMethod + '\n\n' + content.substring(raIdx);
    
    // Now replace the block inside renderAgendamentos
    // Since we added newMethod, indices changed
    const newRaIdx = content.indexOf('    renderAgendamentos() {');
    const bStart = content.indexOf(startMarker, newRaIdx);
    const actualBStart = content.lastIndexOf('\n', bStart) + 1;
    const bEnd = content.indexOf(endMarker, actualBStart) + endMarker.length;
    
    const toReplace = content.substring(actualBStart, bEnd);
    content = content.replace(toReplace, '                return this.renderAppointmentCard(apt);');
    
    fs.writeFileSync('js/views.js', content, 'utf8');
    console.log("Success");
} else {
    console.log("Not found", startIdx, endIdx);
}
