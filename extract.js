const fs = require('fs');

const file = 'js/views.js';
let content = fs.readFileSync(file, 'utf8');

const start_str = "const clientInitial = (apt.clientName[0] || 'C').toUpperCase();";
const end_str = "</div>\n                                `;";

const start_idx = content.indexOf(start_str);
const end_idx = content.indexOf(end_str, start_idx);

if (start_idx !== -1 && end_idx !== -1) {
    const final_end_idx = end_idx + end_str.length;
    
    // ensure we capture the indentation
    const block_start_idx = content.lastIndexOf('\n', start_idx) + 1;
    
    const original_block = content.substring(block_start_idx, final_end_idx);
    
    const new_method = '    renderAppointmentCard(apt) {\n' + original_block.replace(/return `/, 'return `') + '\n    },';
    
    // insert before renderAgendamentos
    let ra_idx = content.indexOf('    renderAgendamentos() {');
    
    content = content.substring(0, ra_idx) + new_method + '\n\n' + content.substring(ra_idx);
    
    // The insertion shifted the indices
    ra_idx = content.indexOf('    renderAgendamentos() {');
    let block_start_idx_new = content.indexOf(start_str, ra_idx);
    block_start_idx_new = content.lastIndexOf('\n', block_start_idx_new) + 1;
    let final_end_idx_new = content.indexOf(end_str, block_start_idx_new) + end_str.length;
    
    const block_to_replace = content.substring(block_start_idx_new, final_end_idx_new);
    const new_block_inside_map = '                return this.renderAppointmentCard(apt);';
    
    content = content.replace(block_to_replace, new_block_inside_map);
    
    fs.writeFileSync(file, content, 'utf8');
        
    console.log('Successfully extracted renderAppointmentCard!');
} else {
    console.log('Failed to find bounds:', start_idx, end_idx);
}
