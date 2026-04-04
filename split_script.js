const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'script.legacy.js');
const jsDir = path.join(__dirname, 'js');
const code = fs.readFileSync(srcFile, 'utf8');

const appIndex = code.indexOf('const App = {');
if (appIndex === -1) {
    console.error('App start not found!');
    process.exit(1);
}

const beforeApp = code.substring(0, appIndex);

// Find the end of App
let appInnerStart = code.indexOf('{', appIndex);
let bracketCount = 0;
let started = false;
let appEndIndex = -1;

for (let i = appInnerStart; i < code.length; i++) {
    if (code[i] === '{') { started = true; bracketCount++; }
    else if (code[i] === '}') { bracketCount--; }
    
    if (started && bracketCount === 0) {
        appEndIndex = i;
        break;
    }
}

const appInner = code.substring(appInnerStart + 1, appEndIndex);
const afterApp = code.substring(appEndIndex + 1);

// Parse the top level properties of App
// We need to carefully split by comma that is at level 0
let properties = [];
let propStart = 0;
let level = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < appInner.length; i++) {
    const c = appInner[i];
    
    if ((c === "'" || c === '"' || c === '`') && appInner[i-1] !== '\\') {
        if (!inString) {
            inString = true;
            stringChar = c;
        } else if (c === stringChar) {
            inString = false;
        }
    }
    
    // We ideally should also handle comments, but let's assume no commas with level 0 exist in comments, or no top-level comments contain mismatched braces
    if (!inString) {
        if (c === '{' || c === '[' || c === '(') level++;
        if (c === '}' || c === ']' || c === ')') level--;
    }
    
    if (c === ',' && level === 0 && !inString) {
        properties.push(appInner.substring(propStart, i).trim());
        propStart = i + 1;
    }
}
if (propStart < appInner.length) {
    const lastProp = appInner.substring(propStart).trim();
    if (lastProp) properties.push(lastProp);
}

const groups = {
    api: ['init', 'loadInitialData', 'loadAppointments', 'loadTransactions', 'setupRealtime', 'loadSession', 'saveProfileChanges', 'completeAppointment', 'toggleTimeBlock', 'toggleService', 'saveShopSettings'],
    auth: ['login', 'register', 'logout', 'verifyRecovery', 'resetPassword'],
    booking: ['startBooking', 'prevMonth', 'nextMonth', 'setBookingStep', 'cancelBooking', 'selectDate', 'selectTimeAndBarber', 'confirmBooking', 'cancelAppointment', 'editAppointment', 'initCompleteAppointment', 'cancelCompleteAppointment'],
    ui: ['applyMasks', 'applyTheme', 'toggleTheme', 'showNotification', 'showConfirm', 'hideConfirm', 'showConfirmModal', 'hideConfirmModal', 'updateNavUI', 'updateHeaderUI', 'requestNotificationPermission', 'scheduleNextNotification', 'toggleReminderPopup', 'clearNotifications', 'setTab', 'setRole', 'setAuthView', 'toggleProfileEdit', 'toggleShopEdit', 'copyAddress', 'shareLocation', 'formatDisplayPhone'],
    views: ['render', 'renderLoyaltyCard', 'getUpcomingReminder', 'renderReminderCard', 'renderCalendar', 'renderLogin', 'renderRegister', 'renderForgotPassword', 'renderAgendamentos', 'renderRelatorios', 'renderClientes', 'renderBarbearia', 'renderPerfil', 'renderConfiguracoes'],
    reports: ['setReportsFilter', 'setAppointmentsFilter', 'setCustomReportRange'],
    state: ['state']
};

function getMethodName(propStr) {
    if (propStr.startsWith('state:')) return 'state';
    const match = propStr.match(/^((async\s+)?([a-zA-Z0-9_]+))\s*(:|\()/);
    if (match) {
        return match[3];
    }
    return '';
}

const groupedProps = {};
for (const p of properties) {
    const name = getMethodName(p);
    let group = 'ui';
    for (const [g, names] of Object.entries(groups)) {
        if (names.includes(name)) {
            group = g;
            break;
        }
    }
    if (!groupedProps[group]) groupedProps[group] = [];
    groupedProps[group].push(p);
}

if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir);
}

for (const [group, props] of Object.entries(groupedProps)) {
    let output = '';
    if (group === 'state') {
        output = 'const App = {\n    ' + props.join(',\n    ') + '\n};\n';
    } else {
        output = 'Object.assign(App, {\n    ' + props.join(',\n\n    ') + '\n});\n';
    }
    fs.writeFileSync(path.join(jsDir, group + '.js'), output);
}

fs.writeFileSync(path.join(jsDir, 'config.js'), beforeApp.trim() + '\n');

let appJS = afterApp.replace(/^(\s*;)/, '').trim();
fs.writeFileSync(path.join(jsDir, 'app.js'), appJS + '\n');

fs.copyFileSync(srcFile, path.join(__dirname, 'script.legacy.js'));
console.log('Refactoring complete without esprima!');
