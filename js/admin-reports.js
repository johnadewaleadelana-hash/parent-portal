// js/admin-reports.js
// ============================================
// Admin - Reports & Broadsheet Generation

let currentBroadsheet = null;
let currentClasses = [];
let currentSubjects = [];

document.addEventListener('DOMContentLoaded', async function() {
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) { window.location.href = 'admin-login.html'; return; }
    
    try {
        currentClasses = await api.getClasses();
        const activeClasses = currentClasses.filter(c => c['Is Active'] === 'Yes' || !c['Is Active']);
        populateSelect('brClass', activeClasses, 'Class Name', 'Class Name');
        
        document.getElementById('brType').addEventListener('change', function() {
            document.getElementById('brSubject').style.display = this.value === 'subject' ? 'block' : 'none';
        });
        document.getElementById('brSubject').style.display = 'none';
    } catch (e) {
        showToast('Error loading data: ' + e.message, 'danger');
    }
});

function populateSelect(id, data, labelField, valueField) {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">Select...</option>';
    data.forEach(item => {
        sel.innerHTML += `<option value="${item[valueField]}">${item[labelField]}</option>`;
    });
}

// ============================================
// GENERATE BROADSHEET
// ============================================

async function generateBroadsheet() {
    const className = document.getElementById('brClass').value;
    const term = document.getElementById('brTerm').value;
    const type = document.getElementById('brType').value;
    
    if (!className) { showToast('Select a class', 'warning'); return; }
    
    document.getElementById('loadingState').classList.remove('d-none');
    document.getElementById('broadPreview').classList.add('d-none');
    document.getElementById('emptyState').classList.add('d-none');
    
    try {
        const data = await api.generateBroadsheet(className, term, type);
        
        if (data.error) {
            showToast(data.error, 'danger');
            document.getElementById('loadingState').classList.add('d-none');
            document.getElementById('emptyState').classList.remove('d-none');
            return;
        }
        
        currentBroadsheet = data;
        
        // Set header
        document.getElementById('bsTitle').textContent = `${className} - Term ${term} Broadsheet`;
        document.getElementById('bsDate').textContent = new Date().toLocaleDateString();
        
        // Render based on type
        if (type === 'full') renderFullBroadsheet(data);
        else if (type === 'subject') renderSubjectBroadsheet(data);
        else if (type === 'summary') renderSummaryBroadsheet(data);
        
        // Update stats
        document.getElementById('statStudents').textContent = data.summary?.totalStudents || data.students?.length || 0;
        document.getElementById('statAverage').textContent = (data.summary?.overallAverage || 0).toFixed(1);
        document.getElementById('statPassRate').textContent = (data.summary?.passRate || 0) + '%';
        document.getElementById('statDistinctions').textContent = data.summary?.distinctionCount || 0;
        
        document.getElementById('loadingState').classList.add('d-none');
        document.getElementById('broadPreview').classList.remove('d-none');
        showToast('Broadsheet generated successfully!', 'success');
        
    } catch (e) {
        document.getElementById('loadingState').classList.add('d-none');
        document.getElementById('emptyState').classList.remove('d-none');
        showToast('Error: ' + e.message, 'danger');
    }
}

// ============================================
// RENDER FULL BROADSHEET
// ============================================

function renderFullBroadsheet(data) {
    document.getElementById('fullView').classList.remove('d-none');
    document.getElementById('subjectView').classList.add('d-none');
    document.getElementById('summaryView').classList.add('d-none');
    
    const students = data.students || [];
    const subjects = Object.keys(students[0]?.subjects || {});
    
    // Build header
    let headerHtml = '<th>#</th><th>Student</th><th>ID</th>';
    subjects.forEach(subjId => {
        const subj = currentClasses.length ? { name: subjId } : { name: subjId };
        headerHtml += `<th>${subjId}<br><small>CA1/CA2/Exam/Total</small></th>`;
    });
    headerHtml += '<th>Total</th><th>Average</th><th>Grade</th><th>Rank</th>';
    document.getElementById('fullHeader').innerHTML = headerHtml;
    
    // Build body
    let bodyHtml = '';
    students.forEach((s, i) => {
        const gradeClass = getGradeClass(s.grade);
        let rowHtml = `<tr class="student-row"><td>${i+1}</td><td><strong>${s.name}</strong></td><td>${s.id}</td>`;
        
        let studentTotal = 0;
        let studentCount = 0;
        
        subjects.forEach(subjId => {
            const sub = s.subjects[subjId];
            if (sub && sub.total > 0) {
                rowHtml += `<td class="text-center"><small>${sub.ca1}/${sub.ca2}/${sub.exam}</small><br><strong>${sub.total}</strong> <span class="${getGradeClass(sub.grade)}">${sub.grade}</span></td>`;
                studentTotal += sub.total;
                studentCount++;
            } else {
                rowHtml += `<td class="text-center text-muted">-</td>`;
            }
        });
        
        const avg = studentCount > 0 ? (studentTotal / studentCount) : 0;
        rowHtml += `<td><strong>${studentTotal}</strong></td><td>${avg.toFixed(1)}</td><td><span class="${gradeClass}">${s.grade}</span></td><td class="rank-col">${s.rank}</td></tr>`;
        bodyHtml += rowHtml;
    });
    document.getElementById('fullBody').innerHTML = bodyHtml;
    
    // Build footer (subject averages)
    let footerHtml = '<tr class="sum-row"><td colspan="3"><strong>Subject Averages</strong></td>';
    subjects.forEach(subjId => {
        const avg = data.summary?.subjectAverages?.[subjId] || 0;
        footerHtml += `<td class="text-center"><strong>${avg.toFixed(1)}</strong></td>`;
    });
    footerHtml += `<td></td><td><strong>${(data.summary?.overallAverage || 0).toFixed(1)}</strong></td><td></td><td></td></tr>`;
    document.getElementById('fullFooter').innerHTML = footerHtml;
}

// ============================================
// RENDER SUBJECT BROADSHEET
// ============================================

function renderSubjectBroadsheet(data) {
    document.getElementById('fullView').classList.add('d-none');
    document.getElementById('subjectView').classList.remove('d-none');
    document.getElementById('summaryView').classList.add('d-none');
    
    const students = data.students || [];
    let bodyHtml = '';
    
    students.forEach((s, i) => {
        const gradeClass = getGradeClass(s.grade);
        // For subject view, show first subject's data
        const subjKeys = Object.keys(s.subjects);
        const firstSubj = subjKeys.length > 0 ? s.subjects[subjKeys[0]] : null;
        
        bodyHtml += `<tr class="student-row">
            <td>${i+1}</td>
            <td><strong>${s.name}</strong></td>
            <td>${firstSubj ? firstSubj.ca1 : '-'}</td>
            <td>${firstSubj ? firstSubj.ca2 : '-'}</td>
            <td>${firstSubj ? firstSubj.exam : '-'}</td>
            <td><strong>${firstSubj ? firstSubj.total : '-'}</strong></td>
            <td><span class="${gradeClass}">${firstSubj ? firstSubj.grade : '-'}</span></td>
            <td>${firstSubj ? firstSubj.remark : '-'}</td>
            <td class="rank-col">${s.rank}</td>
        </tr>`;
    });
    document.getElementById('subjectBody').innerHTML = bodyHtml;
}

// ============================================
// RENDER SUMMARY BROADSHEET
// ============================================

async function renderSummaryBroadsheet(data) {
    document.getElementById('fullView').classList.add('d-none');
    document.getElementById('subjectView').classList.add('d-none');
    document.getElementById('summaryView').classList.remove('d-none');
    
    const term = document.getElementById('brTerm').value;
    let bodyHtml = '';
    
    try {
        const schoolData = await api.getSchoolAnalysis(term);
        const classes = schoolData.classAnalyses || [];
        
        classes.forEach((c, i) => {
            const perfClass = c.average >= 70 ? 'text-success' : c.average >= 50 ? 'text-warning' : 'text-danger';
            const perfIcon = c.average >= 70 ? 'fa-star' : c.average >= 50 ? 'fa-check' : 'fa-exclamation';
            bodyHtml += `<tr>
                <td>${i+1}</td>
                <td><strong>${c.className}</strong></td>
                <td>${c.students}</td>
                <td>${(c.average || 0).toFixed(1)}</td>
                <td>${c.passRate || 0}%</td>
                <td>${c.distinctionCount || 0}</td>
                <td class="${perfClass}"><i class="fas ${perfIcon}"></i></td>
            </tr>`;
        });
    } catch (e) {
        bodyHtml = `<tr><td colspan="7" class="text-center text-muted">Error loading summary</td></tr>`;
    }
    document.getElementById('summaryBody').innerHTML = bodyHtml;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

function exportExcel() {
    if (!currentBroadsheet) { showToast('Generate a broadsheet first', 'warning'); return; }
    
    const wsData = [['Student', 'ID', 'Average', 'Grade', 'Remark', 'Rank']];
    (currentBroadsheet.students || []).forEach(s => {
        wsData.push([s.name, s.id, s.average, s.grade, s.remark, s.rank]);
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Broadsheet');
    XLSX.writeFile(wb, `broadsheet_${currentBroadsheet.className}_Term${document.getElementById('brTerm').value}.xlsx`);
    showToast('Excel downloaded!', 'success');
}

function exportPDF() {
    if (!currentBroadsheet) { showToast('Generate a broadsheet first', 'warning'); return; }
    
    const element = document.getElementById('broadContent');
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `broadsheet_${currentBroadsheet.className}_Term${document.getElementById('brTerm').value}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
    showToast('PDF generated!', 'success');
}

function exportCSV() {
    if (!currentBroadsheet) { showToast('Generate a broadsheet first', 'warning'); return; }
    
    let csv = 'Student,ID,Average,Grade,Remark,Rank\n';
    (currentBroadsheet.students || []).forEach(s => {
        csv += `"${s.name}",${s.id},${s.average},${s.grade},"${s.remark}",${s.rank}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `broadsheet_${currentBroadsheet.className}_Term${document.getElementById('brTerm').value}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded!', 'success');
}

function toggleMinFormat() {
    const checked = document.getElementById('minFormat').checked;
    const content = document.getElementById('broadContent');
    if (checked) {
        content.style.border = '2px solid #1a237e';
        content.style.padding = '20px';
        content.style.background = '#fff';
    } else {
        content.style.border = 'none';
        content.style.padding = '0';
        content.style.background = 'transparent';
    }
}

function getGradeClass(grade) {
    const map = { 'A': 'grade-a', 'B': 'grade-b', 'C': 'grade-c', 'D': 'grade-d', 'E': 'grade-e', 'F': 'grade-f' };
    return map[grade] || '';
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