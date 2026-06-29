// js/admin-graduates.js

document.addEventListener('DOMContentLoaded', async function() {
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) { window.location.href = 'admin-login.html'; return; }
    
    try {
        const students = await api.getStudents();
        const classes = await api.getClasses();
        
        // Populate all student dropdowns
        ['gradStudent', 'trStudent', 'tsStudent'].forEach(id => {
            const sel = document.getElementById(id);
            if (sel) {
                sel.innerHTML = '<option value="">Select student...</option>';
                students.filter(s => s['Status'] === 'Active').forEach(s => {
                    sel.innerHTML += `<option value="${s['Student ID']}">${s['Full Name']} (${s['Class']})</option>`;
                });
            }
        });
        
        // Populate class dropdowns
        ['gradClass', 'trClass', 'gradClassFilter', 'trClassFilter'].forEach(id => {
            const sel = document.getElementById(id);
            if (sel && classes.length) {
                sel.innerHTML = '<option value="">All</option>';
                classes.forEach(c => sel.innerHTML += `<option value="${c['Class Name']}">${c['Class Name']}</option>`);
            }
        });
        
        // Set default date
        document.getElementById('gradDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('trDate').value = new Date().toISOString().split('T')[0];
        
        // Load existing records
        loadGraduates();
        loadTransfers();
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
});

// ============================================
// GRADUATES
// ============================================

async function markGraduated() {
    const studentId = document.getElementById('gradStudent').value;
    const className = document.getElementById('gradClass').value;
    const gradDate = document.getElementById('gradDate').value;
    
    if (!studentId || !className) { showToast('Select student and class', 'warning'); return; }
    if (!confirm('Mark this student as graduated?')) return;
    
    try {
        const result = await api.call('markGraduated', { studentId, className, graduationDate: gradDate });
        if (result.success) {
            showToast(result.message, 'success');
            loadGraduates();
        } else {
            showToast(result.error || 'Error', 'danger');
        }
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

async function loadGraduates() {
    try {
        const graduates = await api.call('getGraduates', {});
        const search = (document.getElementById('gradSearch')?.value || '').toLowerCase();
        const yearFilter = document.getElementById('gradYearFilter')?.value || '';
        const classFilter = document.getElementById('gradClassFilter')?.value || '';
        
        let filtered = graduates || [];
        if (search) filtered = filtered.filter(g => (g['Full Name'] || '').toLowerCase().includes(search));
        if (yearFilter) filtered = filtered.filter(g => g['Academic Year'] === yearFilter);
        if (classFilter) filtered = filtered.filter(g => g['Graduation Class'] === classFilter);
        
        const body = document.getElementById('gradBody');
        if (!filtered.length) {
            body.innerHTML = '<tr><td colspan="10" class="text-center text-muted">No graduates found</td></tr>';
        } else {
            body.innerHTML = filtered.map(g => `<tr>
                <td>${g['Student ID']}</td><td>${g['Full Name']}</td><td>${g['Graduation Class'] || g['Class'] || ''}</td>
                <td>${g['Graduation Date'] || ''}</td><td>${g['Academic Year'] || ''}</td>
                <td>${g['Final Average'] ? Number(g['Final Average']).toFixed(1) : '-'}</td>
                <td><span class="grade-${g['Final Grade'] || 'F'} badge">${g['Final Grade'] || '-'}</span></td>
                <td>${g['Final GPA'] || '-'}</td>
                <td>${g['Certificate Issued'] === 'Yes' ? '<span class="text-success">Yes</span>' : 'No'}</td>
                <td>${g['Transcript Generated'] === 'Yes' ? '<span class="text-success">Yes</span>' : 'No'}</td>
            </tr>`).join('');
        }
        
        // Stats
        document.getElementById('gradStats').innerHTML = `
            <div class="col-md-4"><div class="card bg-primary text-white stat-box"><div class="card-body text-center py-2"><h6>Total Graduates</h6><h3>${graduates.length}</h3></div></div></div>
            <div class="col-md-4"><div class="card bg-success text-white stat-box"><div class="card-body text-center py-2"><h6>With Certificate</h6><h3>${graduates.filter(g => g['Certificate Issued'] === 'Yes').length}</h3></div></div></div>
            <div class="col-md-4"><div class="card bg-info text-white stat-box"><div class="card-body text-center py-2"><h6>With Transcript</h6><h3>${graduates.filter(g => g['Transcript Generated'] === 'Yes').length}</h3></div></div></div>`;
    } catch (e) {
        document.getElementById('gradBody').innerHTML = '<tr><td colspan="10" class="text-center text-danger">Error loading</td></tr>';
    }
}

// ============================================
// TRANSFERS
// ============================================

async function markTransferred() {
    const studentId = document.getElementById('trStudent').value;
    const toSchool = document.getElementById('trSchool').value;
    const transferDate = document.getElementById('trDate').value;
    
    if (!studentId || !toSchool) { showToast('Select student and enter school name', 'warning'); return; }
    if (!confirm(`Mark this student as transferred to ${toSchool}?`)) return;
    
    try {
        const result = await api.call('markTransferred', { studentId, toSchool, transferDate });
        if (result.success) {
            showToast(result.message, 'success');
            loadTransfers();
        } else {
            showToast(result.error || 'Error', 'danger');
        }
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

async function loadTransfers() {
    try {
        const transfers = await api.call('getTransfers', {});
        const search = (document.getElementById('trSearch')?.value || '').toLowerCase();
        const classFilter = document.getElementById('trClassFilter')?.value || '';
        
        let filtered = transfers || [];
        if (search) filtered = filtered.filter(t => (t['Full Name'] || '').toLowerCase().includes(search) || (t['To School'] || '').toLowerCase().includes(search));
        if (classFilter) filtered = filtered.filter(t => t['From Class'] === classFilter);
        
        const body = document.getElementById('trBody');
        if (!filtered.length) {
            body.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No transfers found</td></tr>';
        } else {
            body.innerHTML = filtered.map(t => `<tr>
                <td>${t['Student ID']}</td><td>${t['Full Name']}</td><td>${t['Transfer Date'] || ''}</td>
                <td>${t['From Class'] || ''}</td><td>${t['To School'] || ''}</td>
                <td>${t['Transcript Sent'] === 'Yes' ? '<span class="text-success">Sent</span>' : (t['Transcript Requested'] === 'Yes' ? 'Requested' : 'No')}</td>
            </tr>`).join('');
        }
    } catch (e) {
        document.getElementById('trBody').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading</td></tr>';
    }
}

// ============================================
// TRANSCRIPTS
// ============================================

async function previewTranscript() {
    const studentId = document.getElementById('tsStudent').value;
    const type = document.getElementById('tsType').value;
    if (!studentId) { showToast('Select a student', 'warning'); return; }
    
    try {
        const result = await api.generateTranscript(studentId, type);
        const container = document.getElementById('tsPreview');
        container.classList.remove('d-none');
        
        if (result && result.student) {
            const student = result.student;
            container.innerHTML = `<div class="card bg-light"><div class="card-body">
                <h5>${student['Full Name']}</h5>
                <p class="mb-1">Class: ${student['Class']} | ID: ${student['Student ID']}</p>
                <p class="mb-0">Type: ${type.charAt(0).toUpperCase() + type.slice(1)} Transcript</p>
            </div></div>`;
        } else {
            container.innerHTML = '<div class="alert alert-info">Transcript data loaded. Use Generate PDF to download.</div>';
        }
    } catch (e) {
        document.getElementById('tsPreview').classList.remove('d-none');
        document.getElementById('tsPreview').innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
}

async function generateTranscript() {
    const studentId = document.getElementById('tsStudent').value;
    const type = document.getElementById('tsType').value;
    if (!studentId) { showToast('Select a student', 'warning'); return; }
    
    try {
        await api.generateTranscript(studentId, type);
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} transcript generated!`, 'success');
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

function showToast(msg, type) {
    const t = document.getElementById('toastMessage'), b = document.getElementById('toastBody');
    if (!t) return; t.className = `toast align-items-center text-white border-0 bg-${type}`;
    b.textContent = msg; new bootstrap.Toast(t).show();
}

function adminLogout() {
    sessionStorage.removeItem('adminSession');
    window.location.href = 'admin-login.html';
}