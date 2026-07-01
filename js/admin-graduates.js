// js/admin-graduates.js
// ============================================
// Admin - Graduate & Transfer Management

let allStudents = [];
let allGraduates = [];
let allTransfers = [];
let currentTab = 'graduates';

document.addEventListener('DOMContentLoaded', async function() {
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) { window.location.href = 'admin-login.html'; return; }
    
    try {
        allStudents = await api.getStudents();
        const classes = await api.getClasses();
        const activeStudents = allStudents.filter(s => s['Status'] === 'Active');
        
        // Populate student dropdowns
        ['gradStudent', 'trStudent', 'tsStudent'].forEach(id => {
            const sel = document.getElementById(id);
            if (sel) {
                sel.innerHTML = '<option value="">Select student...</option>';
                activeStudents.forEach(s => {
                    sel.innerHTML += `<option value="${s['Student ID']}">${s['Full Name']} (${s['Class']})</option>`;
                });
            }
        });
        
        // Populate class dropdowns
        ['gradClass', 'trClass', 'gradClassFilter', 'trClassFilter'].forEach(id => {
            const sel = document.getElementById(id);
            if (sel) {
                sel.innerHTML = '<option value="">All Classes</option>';
                classes.forEach(c => sel.innerHTML += `<option value="${c['Class Name']}">${c['Class Name']}</option>`);
            }
        });
        
        // Set default dates
        document.getElementById('gradDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('trDate').value = new Date().toISOString().split('T')[0];
        
        // Load data
        await loadGraduates();
        await loadTransfers();
        
    } catch (e) {
        showToast('Error loading data: ' + e.message, 'danger');
    }
});

// ============================================
// TAB SWITCHING
// ============================================

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('#mainTabs .nav-link').forEach((el, i) => {
        el.classList.toggle('active', ['graduates','transfers','transcripts'][i] === tab);
    });
    document.getElementById('tab-graduates').style.display = tab === 'graduates' ? 'block' : 'none';
    document.getElementById('tab-transfers').style.display = tab === 'transfers' ? 'block' : 'none';
    document.getElementById('tab-transcripts').style.display = tab === 'transcripts' ? 'block' : 'none';
}

// ============================================
// GRADUATES
// ============================================

async function markGraduated() {
    const studentId = document.getElementById('gradStudent').value;
    const className = document.getElementById('gradClass').value;
    const gradDate = document.getElementById('gradDate').value;
    
    if (!studentId || !className) { showToast('Please select a student and graduating class', 'warning'); return; }
    if (!confirm('Are you sure you want to mark this student as graduated?')) return;
    
    try {
        const result = await api.call('markGraduated', { studentId, className, graduationDate: gradDate });
        if (result.success) {
            showToast(result.message, 'success');
            await loadGraduates();
            document.getElementById('gradStudent').value = '';
        } else {
            showToast(result.error || 'Failed to mark as graduated', 'danger');
        }
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

async function loadGraduates() {
    try {
        allGraduates = await api.call('getGraduates', {}) || [];
        
        const search = (document.getElementById('gradSearch')?.value || '').toLowerCase();
        const yearFilter = document.getElementById('gradYearFilter')?.value || '';
        const classFilter = document.getElementById('gradClassFilter')?.value || '';
        
        let filtered = [...allGraduates];
        if (search) filtered = filtered.filter(g => (g['Full Name'] || '').toLowerCase().includes(search));
        if (yearFilter) filtered = filtered.filter(g => g['Academic Year'] === yearFilter);
        if (classFilter) filtered = filtered.filter(g => (g['Graduation Class'] || g['Class']) === classFilter);
        
        // Update stats
        const currentYear = '2024/2025';
        document.getElementById('gradTotal').textContent = allGraduates.length;
        document.getElementById('gradThisYear').textContent = allGraduates.filter(g => g['Academic Year'] === currentYear).length;
        document.getElementById('gradCertCount').textContent = allGraduates.filter(g => g['Certificate Issued'] === 'Yes').length;
        document.getElementById('gradTransCount').textContent = allGraduates.filter(g => g['Transcript Generated'] === 'Yes').length;
        
        // Render table
        const body = document.getElementById('gradBody');
        if (!filtered.length) {
            body.innerHTML = '<tr><td colspan="12" class="text-center text-muted py-4">No graduates found</td></tr>';
            return;
        }
        
        body.innerHTML = filtered.map((g, i) => {
            const grade = g['Final Grade'] || 'F';
            const gradeClass = 'grade-' + grade;
            return `<tr>
                <td>${i + 1}</td>
                <td>${g['Student ID'] || ''}</td>
                <td><strong>${g['Full Name'] || ''}</strong></td>
                <td>${g['Graduation Class'] || g['Class'] || ''}</td>
                <td>${g['Graduation Date'] || ''}</td>
                <td>${g['Academic Year'] || ''}</td>
                <td>${g['Final Average'] ? Number(g['Final Average']).toFixed(1) : '-'}</td>
                <td><span class="grade-badge ${gradeClass}">${grade}</span></td>
                <td>${g['Final GPA'] || '-'}</td>
                <td>${g['Certificate Issued'] === 'Yes' ? '<span class="text-success fw-bold">Yes</span>' : '<span class="text-muted">No</span>'}</td>
                <td>${g['Transcript Generated'] === 'Yes' ? '<span class="text-success fw-bold">Yes</span>' : '<span class="text-muted">No</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewGraduate('${g['Student ID']}')" title="View"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="editGraduate('${g['Student ID']}')" title="Edit"><i class="fas fa-edit"></i></button>
                </td>
            </tr>`;
        }).join('');
        
    } catch (e) {
        document.getElementById('gradBody').innerHTML = '<tr><td colspan="12" class="text-center text-danger">Error loading graduates</td></tr>';
    }
}

function viewGraduate(studentId) {
    const g = allGraduates.find(x => x['Student ID'] === studentId);
    if (!g) return;
    showToast(`${g['Full Name']} - Avg: ${g['Final Average'] || 'N/A'}, Grade: ${g['Final Grade'] || 'N/A'}`, 'info');
}

function editGraduate(studentId) {
    showToast('Edit feature coming soon for: ' + studentId, 'info');
}

function exportGraduates() {
    if (!allGraduates.length) { showToast('No graduates to export', 'warning'); return; }
    const headers = ['Student ID', 'Full Name', 'Graduation Class', 'Graduation Date', 'Academic Year', 'Final Average', 'Final Grade', 'Final GPA', 'Certificate Issued', 'Transcript Generated'];
    let csv = headers.join(',') + '\n';
    allGraduates.forEach(g => {
        csv += `"${g['Student ID']}","${g['Full Name']}","${g['Graduation Class'] || ''}","${g['Graduation Date'] || ''}","${g['Academic Year'] || ''}",${g['Final Average'] || ''},"${g['Final Grade'] || ''}",${g['Final GPA'] || ''},"${g['Certificate Issued'] || 'No'}","${g['Transcript Generated'] || 'No'}"\n`;
    });
    downloadCSV(csv, 'graduates_export.csv');
    showToast('Graduates exported!', 'success');
}

// ============================================
// TRANSFERS
// ============================================

async function markTransferred() {
    const studentId = document.getElementById('trStudent').value;
    const toSchool = document.getElementById('trSchool').value.trim();
    const transferDate = document.getElementById('trDate').value;
    
    if (!studentId || !toSchool) { showToast('Please select a student and enter the receiving school name', 'warning'); return; }
    if (!confirm(`Mark this student as transferred to ${toSchool}?`)) return;
    
    try {
        const result = await api.call('markTransferred', { studentId, toSchool, transferDate });
        if (result.success) {
            showToast(result.message, 'success');
            await loadTransfers();
            document.getElementById('trStudent').value = '';
            document.getElementById('trSchool').value = '';
        } else {
            showToast(result.error || 'Failed to mark as transferred', 'danger');
        }
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

async function loadTransfers() {
    try {
        allTransfers = await api.call('getTransfers', {}) || [];
        
        const search = (document.getElementById('trSearch')?.value || '').toLowerCase();
        const classFilter = document.getElementById('trClassFilter')?.value || '';
        
        let filtered = [...allTransfers];
        if (search) filtered = filtered.filter(t => 
            (t['Full Name'] || '').toLowerCase().includes(search) || 
            (t['To School'] || '').toLowerCase().includes(search));
        if (classFilter) filtered = filtered.filter(t => t['From Class'] === classFilter);
        
        const body = document.getElementById('trBody');
        if (!filtered.length) {
            body.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No transfers found</td></tr>';
            return;
        }
        
        body.innerHTML = filtered.map((t, i) => {
            const transReq = t['Transcript Requested'] === 'Yes';
            const transSent = t['Transcript Sent'] === 'Yes';
            return `<tr>
                <td>${i + 1}</td>
                <td>${t['Student ID'] || ''}</td>
                <td><strong>${t['Full Name'] || ''}</strong></td>
                <td>${t['Transfer Date'] || ''}</td>
                <td>${t['From Class'] || ''}</td>
                <td>${t['To School'] || ''}</td>
                <td>${transReq ? '<span class="text-success fw-bold">Yes</span>' : '<span class="text-muted">No</span>'}</td>
                <td>${transSent ? '<span class="text-success fw-bold">Yes</span>' : '<span class="text-muted">No</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewTransfer('${t['Student ID']}')" title="View"><i class="fas fa-eye"></i></button>
                </td>
            </tr>`;
        }).join('');
        
    } catch (e) {
        document.getElementById('trBody').innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error loading transfers</td></tr>';
    }
}

function viewTransfer(studentId) {
    const t = allTransfers.find(x => x['Student ID'] === studentId);
    if (!t) return;
    showToast(`${t['Full Name']} → ${t['To School']} on ${t['Transfer Date']}`, 'info');
}

function exportTransfers() {
    if (!allTransfers.length) { showToast('No transfers to export', 'warning'); return; }
    const headers = ['Student ID', 'Full Name', 'Transfer Date', 'From Class', 'To School', 'Transcript Requested', 'Transcript Sent'];
    let csv = headers.join(',') + '\n';
    allTransfers.forEach(t => {
        csv += `"${t['Student ID']}","${t['Full Name']}","${t['Transfer Date'] || ''}","${t['From Class'] || ''}","${t['To School'] || ''}","${t['Transcript Requested'] || 'No'}","${t['Transcript Sent'] || 'No'}"\n`;
    });
    downloadCSV(csv, 'transfers_export.csv');
    showToast('Transfers exported!', 'success');
}

// ============================================
// TRANSCRIPTS
// ============================================

async function previewTranscript() {
    const studentId = document.getElementById('tsStudent').value;
    const type = document.getElementById('tsType').value;
    if (!studentId) { showToast('Please select a student', 'warning'); return; }
    
    const area = document.getElementById('tsPreviewArea');
    area.classList.remove('d-none');
    area.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm"></div> Loading...</div>';
    
    try {
        const result = await api.generateTranscript(studentId, type);
        const student = allStudents.find(s => s['Student ID'] === studentId);
        area.innerHTML = `
            <div class="card border-primary">
                <div class="card-header bg-primary text-white d-flex justify-content-between">
                    <span><i class="fas fa-file-alt"></i> ${type.charAt(0).toUpperCase() + type.slice(1)} Transcript</span>
                    <span>${student?.['Full Name'] || studentId}</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Student:</strong> ${student?.['Full Name'] || 'N/A'}</p>
                            <p class="mb-1"><strong>Class:</strong> ${student?.['Class'] || 'N/A'}</p>
                            <p class="mb-1"><strong>Student ID:</strong> ${studentId}</p>
                        </div>
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Transcript Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
                            <p class="mb-1"><strong>Status:</strong> <span class="text-success">Ready</span></p>
                        </div>
                    </div>
                    <hr>
                    <p class="text-muted mb-0">Transcript data loaded successfully. Use "Generate PDF" to download or "Email" to send.</p>
                </div>
            </div>`;
    } catch (e) {
        area.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
}

async function generateTranscriptPDF() {
    const studentId = document.getElementById('tsStudent').value;
    const type = document.getElementById('tsType').value;
    if (!studentId) { showToast('Please select a student', 'warning'); return; }
    
    try {
        await api.generateTranscript(studentId, type);
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} transcript generated!`, 'success');
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

async function emailTranscript() {
    const studentId = document.getElementById('tsStudent').value;
    const type = document.getElementById('tsType').value;
    if (!studentId) { showToast('Please select a student', 'warning'); return; }
    
    const student = allStudents.find(s => s['Student ID'] === studentId);
    const email = student?.['Parent Email'];
    if (!email) { showToast('No parent email for this student', 'warning'); return; }
    
    try {
        await api.call('sendEmail', { to: email, subject: `${type.charAt(0).toUpperCase() + type.slice(1)} Transcript - ${student?.['Full Name']}`, body: `Dear Parent,\n\nPlease find attached the ${type} transcript for ${student?.['Full Name']}.\n\nThank you,\nSchool Administration`, type: 'transcript' });
        showToast('Transcript emailed successfully!', 'success');
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

// ============================================
// UTILITIES
// ============================================

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

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