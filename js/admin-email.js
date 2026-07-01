// js/admin-email.js
// ============================================
// Admin - Email Notifications

let allStudents = [];
let allPins = [];

document.addEventListener('DOMContentLoaded', async function() {
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) { window.location.href = 'admin-login.html'; return; }
    
    try {
        allStudents = await api.getStudents();
        const classes = await api.getClasses();
        const activeStudents = allStudents.filter(s => s['Status'] === 'Active');
        
        // Populate class dropdowns
        ['pinClass', 'bulkClass'].forEach(id => {
            const sel = document.getElementById(id);
            if (sel) {
                sel.innerHTML = '<option value="">Select class...</option>';
                classes.forEach(c => sel.innerHTML += `<option value="${c['Class Name']}">${c['Class Name']}</option>`);
            }
        });
        
        // Populate student dropdown
        const reportSel = document.getElementById('reportStudent');
        if (reportSel) {
            reportSel.innerHTML = '<option value="">Select student...</option>';
            activeStudents.forEach(s => {
                reportSel.innerHTML += `<option value="${s['Student ID']}">${s['Full Name']} (${s['Class']})</option>`;
            });
        }
        
        // Load PINs
        allPins = await api.call('getPinStatus', { class: '' }) || { students: [] };
        
    } catch (e) {
        showToast('Error loading data: ' + e.message, 'danger');
    }
});

// ============================================
// LOAD STUDENTS FOR PIN SENDING
// ============================================

async function loadPinStudents() {
    const className = document.getElementById('pinClass').value;
    const sel = document.getElementById('pinStudents');
    if (!className) { sel.innerHTML = '<option value="">Select a class first</option>'; return; }
    
    const students = allStudents.filter(s => s['Class'] === className && s['Status'] === 'Active');
    sel.innerHTML = '';
    students.forEach(s => {
        const pin = allPins.students?.find(p => p['Student ID'] === s['Student ID']);
        const pinVal = pin ? pin['PIN'] : 'N/A';
        sel.innerHTML += `<option value="${s['Student ID']}" data-pin="${pinVal}" data-email="${s['Parent Email'] || ''}">${s['Full Name']} (PIN: ${pinVal})</option>`;
    });
    if (students.length === 0) sel.innerHTML = '<option value="">No students in this class</option>';
}

// ============================================
// SEND PINS
// ============================================

async function sendPINs() {
    const sel = document.getElementById('pinStudents');
    const selected = Array.from(sel.selectedOptions);
    if (selected.length === 0) { showToast('Select at least one student', 'warning'); return; }
    
    const subject = document.getElementById('pinSubject').value;
    const bodyTemplate = document.getElementById('pinBody').value;
    
    if (!confirm(`Send PIN emails to ${selected.length} parent(s)?`)) return;
    
    let sent = 0, failed = 0;
    for (const opt of selected) {
        const studentId = opt.value;
        const student = allStudents.find(s => s['Student ID'] === studentId);
        const email = opt.dataset.email || student?.['Parent Email'];
        const pin = opt.dataset.pin || 'N/A';
        
        if (!email) { failed++; continue; }
        
        const body = bodyTemplate
            .replace(/{PIN}/g, pin)
            .replace(/{STUDENT_NAME}/g, student?.['Full Name'] || 'Student')
            .replace(/{CLASS}/g, student?.['Class'] || '');
        
        try {
            await api.call('sendEmail', { to: email, subject, body, type: 'pin' });
            sent++;
        } catch (e) {
            failed++;
        }
    }
    
    document.getElementById('pinSendResult').innerHTML = 
        `<span class="text-success">${sent} sent</span>${failed ? `<span class="text-danger ms-2">${failed} failed</span>` : ''}`;
    showToast(`Sent ${sent} PIN emails`, failed > 0 ? 'warning' : 'success');
}

// ============================================
// SEND REPORT
// ============================================

async function sendReport() {
    const studentId = document.getElementById('reportStudent').value;
    const term = document.getElementById('reportTerm').value;
    const subject = document.getElementById('reportSubject').value;
    const bodyTemplate = document.getElementById('reportBody').value;
    const attachPDF = document.getElementById('attachPDF').checked;
    
    if (!studentId) { showToast('Select a student', 'warning'); return; }
    
    const student = allStudents.find(s => s['Student ID'] === studentId);
    const email = student?.['Parent Email'];
    if (!email) { showToast('No parent email for this student', 'warning'); return; }
    
    try {
        const report = await api.getReport(studentId, term);
        const avg = report?.average || 0;
        const grade = report?.grade || 'F';
        
        const body = bodyTemplate
            .replace(/{STUDENT_NAME}/g, student?.['Full Name'] || 'Student')
            .replace(/{CLASS}/g, student?.['Class'] || '')
            .replace(/{TERM}/g, `Term ${term}`)
            .replace(/{AVERAGE}/g, avg.toFixed(1))
            .replace(/{GRADE}/g, grade);
        
        const finalSubject = subject.replace(/{STUDENT_NAME}/g, student?.['Full Name'] || 'Student')
            .replace(/{TERM}/g, `Term ${term}`);
        
        await api.call('sendEmail', { to: email, subject: finalSubject, body, type: 'report', attachPDF });
        document.getElementById('reportSendResult').innerHTML = '<span class="text-success">Report sent!</span>';
        showToast('Report email sent!', 'success');
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

// ============================================
// BULK SEND
// ============================================

async function loadBulkStudents() {
    const className = document.getElementById('bulkClass').value;
    const container = document.getElementById('bulkRecipients');
    const count = document.getElementById('bulkCount');
    
    if (!className) { container.innerHTML = ''; count.textContent = '0'; return; }
    
    const students = allStudents.filter(s => s['Class'] === className && s['Status'] === 'Active' && s['Parent Email']);
    count.textContent = students.length;
    container.innerHTML = students.map(s => `<div>${s['Full Name']} - ${s['Parent Email']}</div>`).join('');
}

async function bulkSend() {
    const className = document.getElementById('bulkClass').value;
    const term = document.getElementById('bulkTerm').value;
    const subject = document.getElementById('bulkSubject').value;
    const bodyTemplate = document.getElementById('bulkBody').value;
    
    if (!className) { showToast('Select a class', 'warning'); return; }
    
    const students = allStudents.filter(s => s['Class'] === className && s['Status'] === 'Active' && s['Parent Email']);
    if (students.length === 0) { showToast('No students with parent emails in this class', 'warning'); return; }
    
    if (!confirm(`Send reports to ${students.length} parents in ${className}?`)) return;
    
    const progress = document.getElementById('bulkProgress');
    const bar = document.getElementById('bulkProgressBar');
    progress.classList.remove('d-none');
    
    let sent = 0, failed = 0;
    for (let i = 0; i < students.length; i++) {
        const s = students[i];
        try {
            const report = await api.getReport(s['Student ID'], term);
            const avg = report?.average || 0;
            const grade = report?.grade || 'F';
            
            const body = bodyTemplate
                .replace(/{STUDENT_NAME}/g, s['Full Name'])
                .replace(/{CLASS}/g, s['Class'])
                .replace(/{TERM}/g, `Term ${term}`)
                .replace(/{AVERAGE}/g, avg.toFixed(1))
                .replace(/{GRADE}/g, grade);
            
            const finalSubject = subject.replace(/{TERM}/g, `Term ${term}`);
            
            await api.call('sendEmail', { to: s['Parent Email'], subject: finalSubject, body, type: 'report' });
            sent++;
        } catch (e) {
            failed++;
        }
        
        const pct = Math.round(((i + 1) / students.length) * 100);
        bar.style.width = pct + '%';
        bar.textContent = pct + '%';
    }
    
    document.getElementById('bulkSendResult').innerHTML = 
        `<span class="text-success">${sent} sent</span>${failed ? `<span class="text-danger ms-2">${failed} failed</span>` : ''}`;
    showToast(`Bulk send complete: ${sent} sent, ${failed} failed`, failed > 0 ? 'warning' : 'success');
}

// ============================================
// TEMPLATES
// ============================================

function saveTemplate(type) {
    const id = type === 'pin' ? 'tmplPin' : type === 'report' ? 'tmplReport' : 'tmplNotify';
    const content = document.getElementById(id).value;
    localStorage.setItem(`email_template_${type}`, content);
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} template saved locally!`, 'success');
}

// ============================================
// TOAST & LOGOUT
// ============================================

function showToast(msg, type = 'success') {
    const t = document.getElementById('toastMessage'), b = document.getElementById('toastBody');
    if (!t) return;
    t.className = `toast align-items-center text-white border-0 bg-${type}`;
    b.textContent = msg;
    new bootstrap.Toast(t).show();
}

function adminLogout() {
    sessionStorage.removeItem('adminSession');
    window.location.href = 'admin-login.html';
}