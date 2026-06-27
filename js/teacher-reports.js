// js/teacher-reports.js

const teacherSession = JSON.parse(sessionStorage.getItem('teacherSession'));
if (!teacherSession) window.location.href = 'teacher-login.html';

let students = [];

document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('teacherInfo').textContent = `Class: ${teacherSession.classAssigned}`;
    students = await api.getTeacherStudents(teacherSession.teacherId);
    const sel = document.getElementById('rptStudent');
    sel.innerHTML = '<option value="">Select student...</option>';
    students.forEach(s => { sel.innerHTML += `<option value="${s['Student ID']}">${s['Full Name']}</option>`; });
});

async function loadReport() {
    const studentId = document.getElementById('rptStudent').value;
    const type = document.getElementById('rptType').value;
    const term = document.getElementById('rptTerm').value;
    const container = document.getElementById('reportContainer');
    
    if (!studentId) { showToast('Select a student', 'warning'); return; }
    
    try {
        const student = students.find(s => s['Student ID'] === studentId);
        let report;
        if (type === 'cumulative') {
            report = await api.getReport(studentId, 'Term3');
        } else {
            report = await api.call('getReportCard', { studentId, term });
        }
        
        if (!report || report.error) {
            container.innerHTML = `<div class="alert alert-warning">No data available for this student</div>`;
            return;
        }
        
        const scores = report.scores || [];
        const avg = report.average || 0;
        const grade = report.grade || 'F';
        const gradeInfo = api.getGradeColor(grade);
        
        let html = `
        <div class="card shadow-sm">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">${student['Full Name']} - Report</h5>
                <small>${student['Class']} • ${CONFIG.ACADEMIC_YEAR} • ${type === 'cumulative' ? 'Cumulative' : 'Term ' + term}</small>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-4"><div class="card bg-light"><div class="card-body text-center">
                        <h6>Average</h6><h3>${avg.toFixed(2)}</h3></div></div></div>
                    <div class="col-md-4"><div class="card bg-light"><div class="card-body text-center">
                        <h6>Grade</h6><h3><span class="badge" style="background:${gradeInfo.color}">${grade}</span></h3></div></div></div>
                    <div class="col-md-4"><div class="card bg-light"><div class="card-body text-center">
                        <h6>Subjects</h6><h3>${scores.length}</h3></div></div></div>
                </div>
                <div class="table-responsive">
                    <table class="table table-bordered table-hover">
                        <thead class="table-dark">
                            <tr><th>Subject</th>
                                ${type === 'cumulative' ? '<th>Term 1</th><th>Term 2</th><th>Term 3</th><th>Cumulative</th>' : '<th>CA1</th><th>CA2</th><th>Exam</th><th>Total</th>'}
                                <th>Grade</th><th>Remark</th>
                            </tr>
                        </thead>
                        <tbody>`;
        
        scores.forEach(s => {
            if (type === 'cumulative') {
                html += `<tr><td><strong>${s.subject}</strong></td>
                    <td>${s.term1 || '-'}</td><td>${s.term2 || '-'}</td><td>${s.term3 || '-'}</td>
                    <td>${s.cumulative ? s.cumulative.toFixed(2) : '-'}</td>
                    <td><span class="badge" style="background:${api.getGradeColor(s.grade || 'F').color}">${s.grade || 'F'}</span></td>
                    <td>${s.remark || '-'}</td></tr>`;
            } else {
                html += `<tr><td><strong>${s.subject}</strong></td>
                    <td>${s.ca1 || '-'}</td><td>${s.ca2 || '-'}</td><td>${s.exam || '-'}</td>
                    <td>${s.total || '-'}</td>
                    <td><span class="badge" style="background:${api.getGradeColor(s.grade || 'F').color}">${s.grade || 'F'}</span></td>
                    <td>${s.remark || '-'}</td></tr>`;
            }
        });
        
        html += `</tbody></table></div>`;
        
        // Attendance
        const att = report.attendance;
        if (att) {
            const t3 = att.term3 || {};
            html += `<div class="mt-3"><strong>Attendance:</strong> ${t3['Times Present'] || 0}/${t3['Times School Opened'] || 0} days</div>`;
        }
        
        // Comments
        const cmts = report.comments;
        if (cmts && cmts.term3 && cmts.term3.length > 0) {
            html += `<div class="mt-3"><h6>Comments</h6>`;
            cmts.term3.forEach(c => {
                html += `<p class="mb-1"><em>${c['Comment Text'] || ''}</em></p>`;
            });
            html += `</div>`;
        }
        
        html += `<div class="mt-3 text-end"><button class="btn btn-sm btn-outline-primary" onclick="window.print()"><i class="fas fa-print"></i> Print</button></div>`;
        html += `</div></div>`;
        
        container.innerHTML = html;
        
    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">Error loading report: ${e.message}</div>`;
    }
}

function showToast(msg, type) {
    const t = document.getElementById('toastMessage'), b = document.getElementById('toastBody');
    if (!t) return; t.className = `toast align-items-center text-white border-0 bg-${type}`;
    b.textContent = msg; new bootstrap.Toast(t).show();
}

function teacherLogout() { sessionStorage.removeItem('teacherSession'); window.location.href = 'teacher-login.html'; }