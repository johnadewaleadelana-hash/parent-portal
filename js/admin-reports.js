// js/admin-reports.js
// ============================================
// Admin - Reports & Broadsheet Generation
// Features: Full Class, Subject, Summary broadsheets
// Export: Excel (xlsx), PDF, CSV, Print
// Display toggles for CA1, CA2, Exam, Grade, Rank
// Ministry Format toggle

let currentBroadsheet = null;
let allSubjects = [];

document.addEventListener('DOMContentLoaded', async function() {
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) { window.location.href = 'admin-login.html'; return; }
    
    try {
        const classes = await api.getClasses();
        const sel = document.getElementById('brClass');
        sel.innerHTML = '<option value="">Select class...</option>';
        classes.forEach(c => {
            sel.innerHTML += `<option value="${c['Class Name']}">${c['Class Name']}</option>`;
        });
        
        // Load subjects for later use
        allSubjects = await api.getSubjects();
        
        // Ministry format toggle
        document.getElementById('minFormat').addEventListener('change', function() {
            const content = document.getElementById('broadContent');
            if (this.checked) {
                content.classList.add('min-format-active');
            } else {
                content.classList.remove('min-format-active');
            }
        });
        
    } catch (e) {
        showToast('Error loading data: ' + e.message, 'danger');
    }
});

// ============================================
// GENERATE BROADSHEET
// ============================================

async function generateBroadsheet() {
    const className = document.getElementById('brClass').value;
    const term = document.getElementById('brTerm').value;
    const type = document.getElementById('brType').value;
    
    if (!className) { showToast('Please select a class', 'warning'); return; }
    
    // Show loading
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
        
        // Set school header info
        const now = new Date();
        document.getElementById('bsTitle').textContent = `${className} - Term ${term} Broadsheet`;
        document.getElementById('bsDate').textContent = now.toLocaleDateString('en-GB');
        document.getElementById('bsDate2').textContent = now.toLocaleDateString('en-GB');
        
        // Render based on type
        if (type === 'full') renderFullBroadsheet(data, className, term);
        else if (type === 'subject') renderSubjectBroadsheet(data, className, term);
        else if (type === 'summary') renderSummaryBroadsheet(term);
        
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
// RENDER FULL CLASS BROADSHEET
// ============================================

function renderFullBroadsheet(data, className, term) {
    document.getElementById('fullView').classList.remove('d-none');
    document.getElementById('subjectView').classList.add('d-none');
    document.getElementById('summaryView').classList.add('d-none');
    
    const showCA1 = document.getElementById('showCA1').checked;
    const showCA2 = document.getElementById('showCA2').checked;
    const showExam = document.getElementById('showExam').checked;
    const showGrade = document.getElementById('showGrade').checked;
    const showRank = document.getElementById('showRank').checked;
    
    // Get subjects for this class
    const classSubjects = allSubjects.filter(s => s['Class'] === className);
    const students = data.students || [];
    
    // Build header
    let headerHtml = '<th>#</th><th class="student-name">Student Name</th><th>Student ID</th>';
    
    classSubjects.forEach(subj => {
        const subjName = subj['Subject Name'] || subj['Subject ID'];
        headerHtml += `<th>${subjName}<br><small>`;
        if (showCA1) headerHtml += 'CA1 ';
        if (showCA2) headerHtml += 'CA2 ';
        if (showExam) headerHtml += 'Exam ';
        headerHtml += 'Total</small></th>';
    });
    
    headerHtml += '<th>Total Score</th><th>Average</th>';
    if (showGrade) headerHtml += '<th>Grade</th>';
    if (showRank) headerHtml += '<th>Rank</th>';
    document.getElementById('fullHeader').innerHTML = headerHtml;
    
    // Build body
    let bodyHtml = '';
    students.forEach((s, i) => {
        const gradeClass = 'grade-' + (s.grade || 'F');
        let rowHtml = `<tr class="student-row"><td>${i+1}</td><td class="student-name">${s.name}</td><td>${s.id}</td>`;
        
        let studentTotal = 0;
        let studentCount = 0;
        
        classSubjects.forEach(subj => {
            const sub = s.subjects && s.subjects[subj['Subject ID']] ? s.subjects[subj['Subject ID']] : null;
            rowHtml += '<td>';
            if (sub && sub.total > 0) {
                if (showCA1) rowHtml += `<small>${sub.ca1}</small> `;
                if (showCA2) rowHtml += `<small>${sub.ca2}</small> `;
                if (showExam) rowHtml += `<small>${sub.exam}</small> `;
                rowHtml += `<br><strong>${sub.total}</strong>`;
                rowHtml += ` <span class="grade-badge grade-${sub.grade}">${sub.grade}</span>`;
                studentTotal += sub.total;
                studentCount++;
            } else {
                rowHtml += '-';
            }
            rowHtml += '</td>';
        });
        
        const avg = studentCount > 0 ? (studentTotal / studentCount) : 0;
        rowHtml += `<td><strong>${studentTotal}</strong></td><td>${avg.toFixed(1)}</td>`;
        if (showGrade) rowHtml += `<td><span class="grade-badge ${gradeClass}">${s.grade}</span></td>`;
        if (showRank) rowHtml += `<td class="fw-bold">${s.rank}</td>`;
        rowHtml += '</tr>';
        bodyHtml += rowHtml;
    });
    document.getElementById('fullBody').innerHTML = bodyHtml;
    
    // Build footer (subject averages)
    let footerHtml = '<tr class="sum-row"><td colspan="3"><strong>Subject Averages</strong></td>';
    classSubjects.forEach(subj => {
        const avg = data.summary?.subjectAverages?.[subj['Subject ID']] || 0;
        footerHtml += `<td><strong>${avg.toFixed(1)}</strong></td>`;
    });
    footerHtml += `<td></td><td><strong>${(data.summary?.overallAverage || 0).toFixed(1)}</strong></td>`;
    if (showGrade) footerHtml += '<td></td>';
    if (showRank) footerHtml += '<td></td>';
    footerHtml += '</tr>';
    
    // Add pass rate row
    footerHtml += `<tr class="sum-row"><td colspan="3"><strong>Pass Rate</strong></td>`;
    classSubjects.forEach(subj => {
        let passCount = 0, totalCount = 0;
        students.forEach(s => {
            const sub = s.subjects && s.subjects[subj['Subject ID']] ? s.subjects[subj['Subject ID']] : null;
            if (sub && sub.total > 0) { totalCount++; if (sub.total >= 40) passCount++; }
        });
        const pct = totalCount > 0 ? Math.round((passCount/totalCount)*100) : 0;
        footerHtml += `<td>${pct}%</td>`;
    });
    footerHtml += '<td></td><td></td>';
    if (showGrade) footerHtml += '<td></td>';
    if (showRank) footerHtml += '<td></td>';
    footerHtml += '</tr>';
    
    document.getElementById('fullFooter').innerHTML = footerHtml;
}

// ============================================
// RENDER SUBJECT BROADSHEET
// ============================================

function renderSubjectBroadsheet(data, className, term) {
    document.getElementById('fullView').classList.add('d-none');
    document.getElementById('subjectView').classList.remove('d-none');
    document.getElementById('summaryView').classList.add('d-none');
    
    const showCA1 = document.getElementById('showCA1').checked;
    const showCA2 = document.getElementById('showCA2').checked;
    const showExam = document.getElementById('showExam').checked;
    const showGrade = document.getElementById('showGrade').checked;
    const showRank = document.getElementById('showRank').checked;
    
    const classSubjects = allSubjects.filter(s => s['Class'] === className);
    const subjectName = classSubjects.length > 0 ? classSubjects[0]['Subject Name'] : 'All Subjects';
    document.getElementById('subjectTitle').textContent = `Subject: ${subjectName} - ${className} (Term ${term})`;
    
    // Rebuild header based on display options
    const table = document.getElementById('subjectTable');
    let headerHtml = '<tr><th>#</th><th>Student</th>';
    if (showCA1) headerHtml += '<th>CA1 (20)</th>';
    if (showCA2) headerHtml += '<th>CA2 (20)</th>';
    if (showExam) headerHtml += '<th>Exam (60)</th>';
    headerHtml += '<th>Total (100)</th>';
    if (showGrade) headerHtml += '<th>Grade</th>';
    headerHtml += '<th>Remark</th>';
    if (showRank) headerHtml += '<th>Rank</th>';
    headerHtml += '</tr>';
    table.querySelector('thead').innerHTML = headerHtml;
    
    // Build body
    const students = data.students || [];
    let bodyHtml = '';
    
    students.forEach((s, i) => {
        const gradeClass = 'grade-' + (s.grade || 'F');
        const firstSubjKey = s.subjects ? Object.keys(s.subjects)[0] : null;
        const sub = firstSubjKey ? s.subjects[firstSubjKey] : null;
        
        bodyHtml += `<tr class="student-row"><td>${i+1}</td><td class="student-name">${s.name}</td>`;
        if (showCA1) bodyHtml += `<td>${sub ? sub.ca1 : '-'}</td>`;
        if (showCA2) bodyHtml += `<td>${sub ? sub.ca2 : '-'}</td>`;
        if (showExam) bodyHtml += `<td>${sub ? sub.exam : '-'}</td>`;
        bodyHtml += `<td><strong>${sub ? sub.total : '-'}</strong></td>`;
        if (showGrade) bodyHtml += `<td><span class="grade-badge ${gradeClass}">${sub ? sub.grade : '-'}</span></td>`;
        bodyHtml += `<td>${sub ? (sub.remark || '-') : '-'}</td>`;
        if (showRank) bodyHtml += `<td class="fw-bold">${s.rank}</td>`;
        bodyHtml += '</tr>';
    });
    document.getElementById('subjectBody').innerHTML = bodyHtml;
}

// ============================================
// RENDER SUMMARY BROADSHEET
// ============================================

async function renderSummaryBroadsheet(term) {
    document.getElementById('fullView').classList.add('d-none');
    document.getElementById('subjectView').classList.add('d-none');
    document.getElementById('summaryView').classList.remove('d-none');
    
    try {
        const schoolData = await api.getSchoolAnalysis(term);
        const classes = schoolData.classAnalyses || [];
        let bodyHtml = '';
        
        classes.forEach((c, i) => {
            const perfClass = c.average >= 70 ? 'text-success' : c.average >= 50 ? 'text-warning' : 'text-danger';
            const perfIcon = c.average >= 70 ? 'fa-star' : c.average >= 50 ? 'fa-check-circle' : 'fa-exclamation-triangle';
            const perfLabel = c.average >= 70 ? 'Excellent' : c.average >= 50 ? 'Good' : 'Needs Improvement';
            
            bodyHtml += `<tr>
                <td>${i+1}</td>
                <td class="student-name">${c.className}</td>
                <td>${c.students || 0}</td>
                <td><strong>${(c.average || 0).toFixed(1)}</strong></td>
                <td>${c.passRate || 0}%</td>
                <td>${c.distinctionCount || 0}</td>
                <td class="${perfClass}"><i class="fas ${perfIcon}"></i> ${perfLabel}</td>
            </tr>`;
        });
        
        if (classes.length === 0) {
            bodyHtml = '<tr><td colspan="7" class="text-center text-muted py-3">No data available</td></tr>';
        }
        document.getElementById('summaryBody').innerHTML = bodyHtml;
        
        // Override stats for summary view
        document.getElementById('statStudents').textContent = schoolData.totalStudents || 0;
        document.getElementById('statAverage').textContent = (schoolData.overallAverage || 0).toFixed(1);
        document.getElementById('statPassRate').textContent = (schoolData.totalPassRate || 0) + '%';
        
    } catch (e) {
        document.getElementById('summaryBody').innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error: ${e.message}</td></tr>`;
    }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

function exportExcel() {
    if (!currentBroadsheet) { showToast('Generate a broadsheet first', 'warning'); return; }
    
    const students = currentBroadsheet.students || [];
    const wsData = [['Student Name', 'Student ID', 'Average', 'Grade', 'Remark', 'Rank']];
    
    students.forEach(s => {
        wsData.push([s.name, s.id, s.average || 0, s.grade || '', s.remark || '', s.rank || '']);
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Broadsheet');
    
    const className = document.getElementById('brClass').value || 'class';
    const term = document.getElementById('brTerm').value || '1';
    XLSX.writeFile(wb, `broadsheet_${className}_Term${term}.xlsx`);
    showToast('Excel file downloaded!', 'success');
}

function exportPDF() {
    if (!currentBroadsheet) { showToast('Generate a broadsheet first', 'warning'); return; }
    
    const element = document.getElementById('broadContent');
    const className = document.getElementById('brClass').value || 'class';
    const term = document.getElementById('brTerm').value || '1';
    
    const opt = {
        margin: [8, 8, 8, 8],
        filename: `broadsheet_${className}_Term${term}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
    showToast('PDF generating...', 'success');
}

function exportCSV() {
    if (!currentBroadsheet) { showToast('Generate a broadsheet first', 'warning'); return; }
    
    let csv = 'Student Name,Student ID,Average,Grade,Remark,Rank\n';
    (currentBroadsheet.students || []).forEach(s => {
        csv += `"${s.name}",${s.id},${s.average || 0},${s.grade || ''},"${s.remark || ''}",${s.rank || ''}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const className = document.getElementById('brClass').value || 'class';
    const term = document.getElementById('brTerm').value || '1';
    a.download = `broadsheet_${className}_Term${term}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV file downloaded!', 'success');
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