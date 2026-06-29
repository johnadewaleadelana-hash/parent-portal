// js/admin-bulk-import.js
// ============================================
// Admin - Bulk Import/Export

let parsedStudentData = null;
let parsedScoreData = null;

document.addEventListener('DOMContentLoaded', async function() {
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) { window.location.href = 'admin-login.html'; return; }
    
    try {
        const classes = await api.getClasses();
        const subjects = await api.getSubjects();
        
        ['importScoresClass', 'expStudentClass', 'expScoreClass'].forEach(id => {
            const sel = document.getElementById(id);
            if (sel) {
                sel.innerHTML = '<option value="">All</option>';
                classes.forEach(c => sel.innerHTML += `<option value="${c['Class Name']}">${c['Class Name']}</option>`);
            }
        });
        
        ['importScoresSubject', 'expScoreSubject'].forEach(id => {
            const sel = document.getElementById(id);
            if (sel) {
                sel.innerHTML = '<option value="">All</option>';
                subjects.forEach(s => sel.innerHTML += `<option value="${s['Subject ID']}">${s['Subject Name']}</option>`);
            }
        });
    } catch (e) {
        showToast('Error loading data: ' + e.message, 'danger');
    }
});

// ============================================
// FILE HANDLING
// ============================================

function handleFile(file, type) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let data;
            const ext = file.name.split('.').pop().toLowerCase();
            
            if (ext === 'csv') {
                data = parseCSV(e.target.result);
            } else {
                data = parseExcel(e.target.result);
            }
            
            if (type === 'students') {
                parsedStudentData = data;
                renderPreview('student', data);
            } else {
                parsedScoreData = data;
                renderPreview('score', data);
            }
        } catch (err) {
            showToast('Error parsing file: ' + err.message, 'danger');
        }
    };
    
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('File is empty');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length === headers.length && values.some(v => v)) {
            const row = {};
            headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
            data.push(row);
        }
    }
    return data;
}

function parseExcel(buffer) {
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
    return data;
}

// ============================================
// PREVIEW
// ============================================

function renderPreview(type, data) {
    const prefix = type === 'student' ? 'student' : 'score';
    document.getElementById(`${prefix}Preview`).classList.remove('d-none');
    document.getElementById(`${prefix}RowCount`).textContent = data.length;
    
    const headers = Object.keys(data[0] || {});
    const headEl = document.getElementById(`${prefix}PreviewHead`);
    const bodyEl = document.getElementById(`${prefix}PreviewBody`);
    
    headEl.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    
    // Show first 50 rows
    const rows = data.slice(0, 50);
    bodyEl.innerHTML = rows.map(row => {
        return '<tr>' + headers.map(h => `<td>${row[h] || ''}</td>`).join('') + '</tr>';
    }).join('');
    
    showToast(`Loaded ${data.length} records. Preview shows first ${Math.min(50, data.length)}.`, 'info');
}

// ============================================
// IMPORT
// ============================================

async function importStudents() {
    if (!parsedStudentData || parsedStudentData.length === 0) {
        showToast('No student data to import', 'warning');
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
    
    try {
        const result = await api.call('importStudents', { students: parsedStudentData });
        
        const total = parsedStudentData.length;
        const success = result.success || 0;
        const failed = result.failed || 0;
        
        document.getElementById('studentImportResult').innerHTML = `
            <span class="text-success"><i class="fas fa-check-circle"></i> ${success} imported</span>
            ${failed > 0 ? `<span class="text-danger ms-2"><i class="fas fa-exclamation-circle"></i> ${failed} failed</span>` : ''}
        `;
        
        showToast(`Imported ${success} of ${total} students successfully!`, failed > 0 ? 'warning' : 'success');
    } catch (e) {
        showToast('Import error: ' + e.message, 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-upload"></i> Import Students';
    }
}

async function importScores() {
    if (!parsedScoreData || parsedScoreData.length === 0) {
        showToast('No score data to import', 'warning');
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
    
    try {
        const result = await api.call('importScores', { scores: parsedScoreData });
        
        const total = parsedScoreData.length;
        const success = result.success || 0;
        const failed = result.failed || 0;
        
        document.getElementById('scoreImportResult').innerHTML = `
            <span class="text-success"><i class="fas fa-check-circle"></i> ${success} imported</span>
            ${failed > 0 ? `<span class="text-danger ms-2"><i class="fas fa-exclamation-circle"></i> ${failed} failed</span>` : ''}
        `;
        
        showToast(`Imported ${success} of ${total} scores successfully!`, failed > 0 ? 'warning' : 'success');
    } catch (e) {
        showToast('Import error: ' + e.message, 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-upload"></i> Import Scores';
    }
}

// ============================================
// TEMPLATES
// ============================================

function downloadTemplate(type) {
    let headers, sampleData;
    
    if (type === 'students') {
        headers = ['Student ID', 'Full Name', 'Class', 'Parent Email', 'Phone', 'Admission Date', 'Status'];
        sampleData = ['STU001', 'John Doe', 'Year 4', 'john@email.com', '08012345678', '2024-09-01', 'Active'];
    } else {
        headers = ['Student ID', 'Subject ID', 'CA1', 'CA2', 'Exam', 'Comment'];
        sampleData = ['STU001', 'SUB001', '15', '18', '50', 'Good effort'];
    }
    
    const wsData = [headers, sampleData];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${type}_import_template.xlsx`);
    showToast('Template downloaded!', 'success');
}

// ============================================
// EXPORT
// ============================================

async function exportData(type, format) {
    try {
        let data, filename;
        
        switch (type) {
            case 'students': {
                const classFilter = document.getElementById('expStudentClass')?.value;
                const statusFilter = document.getElementById('expStudentStatus')?.value;
                let students = await api.getStudents();
                if (classFilter) students = students.filter(s => s['Class'] === classFilter);
                if (statusFilter) students = students.filter(s => s['Status'] === statusFilter);
                data = students;
                filename = `students_export_${new Date().toISOString().split('T')[0]}`;
                break;
            }
            case 'scores': {
                const term = document.getElementById('expScoreTerm')?.value || '3';
                data = await api.getStudentScores(null, term);
                filename = `scores_Term${term}_export_${new Date().toISOString().split('T')[0]}`;
                break;
            }
            case 'teachers': {
                data = await api.getTeachers();
                filename = `teachers_export_${new Date().toISOString().split('T')[0]}`;
                break;
            }
            case 'subjects': {
                data = await api.getSubjects();
                filename = `subjects_export_${new Date().toISOString().split('T')[0]}`;
                break;
            }
        }
        
        if (!data || data.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }
        
        if (format === 'csv') {
            const headers = Object.keys(data[0]);
            let csv = headers.join(',') + '\n';
            data.forEach(row => {
                csv += headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            downloadBlob(blob, `${filename}.csv`);
        } else {
            const headers = Object.keys(data[0]);
            const wsData = [headers];
            data.forEach(row => wsData.push(headers.map(h => row[h] || '')));
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, type);
            XLSX.writeFile(wb, `${filename}.xlsx`);
        }
        
        showToast(`${type} exported as ${format.toUpperCase()}!`, 'success');
    } catch (e) {
        showToast('Export error: ' + e.message, 'danger');
    }
}

function downloadBlob(blob, filename) {
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