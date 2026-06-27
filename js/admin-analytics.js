// js/admin-analytics.js
// ============================================
// Admin - Analytics Dashboard with Chart.js

let chartInstances = {};
let currentTab = 'class';

document.addEventListener('DOMContentLoaded', async function() {
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) { window.location.href = 'admin-login.html'; return; }
    
    try {
        const classes = await api.getClasses();
        const students = await api.getStudents();
        const teachers = await api.getTeachers();
        
        // Populate dropdowns
        populateSelect('caClass', classes, 'Class Name', 'Class Name');
        populateSelect('saStudent', students, 'Full Name', 'Student ID');
        populateSelect('taTeacher', teachers, 'Full Name', 'Teacher ID');
        
        // Load default data
        if (classes.length > 0) loadClassAnalysis();
    } catch (e) {
        showToast('Error loading analytics data: ' + e.message, 'danger');
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

function switchTab(tab) { currentTab = tab; }

// ============================================
// CLASS ANALYSIS
// ============================================

async function loadClassAnalysis() {
    const className = document.getElementById('caClass').value;
    const term = document.getElementById('caTerm').value;
    if (!className) { showToast('Select a class', 'warning'); return; }
    
    try {
        showToast('Loading class analysis...', 'info');
        const data = await api.getClassAnalysis(className, term);
        if (data.error) { showToast(data.error, 'danger'); return; }
        
        // Stats cards
        document.getElementById('caStats').innerHTML = `
            <div class="col-md-3"><div class="card stat-card bg-primary text-white"><div class="card-body text-center"><h6>Students</h6><h3>${data.totalStudents||0}</h3></div></div></div>
            <div class="col-md-3"><div class="card stat-card bg-success text-white"><div class="card-body text-center"><h6>Class Avg</h6><h3>${(data.average||0).toFixed(1)}</h3></div></div></div>
            <div class="col-md-3"><div class="card stat-card bg-warning text-white"><div class="card-body text-center"><h6>Pass Rate</h6><h3>${data.passRate||0}%</h3></div></div></div>
            <div class="col-md-3"><div class="card stat-card bg-info text-white"><div class="card-body text-center"><h6>Distinctions</h6><h3>${data.distinctionCount||0}</h3></div></div></div>`;
        
        // Grade distribution chart
        const gd = data.gradeDistribution || {};
        renderBarChart('caGradeChart', 'Grade Distribution', ['A','B','C','D','E','F'],
            [gd.A||0, gd.B||0, gd.C||0, gd.D||0, gd.E||0, gd.F||0],
            ['#28a745','#8bc34a','#ffc107','#fd7e14','#f44336','#d32f2f']);
        
        // Subject performance chart
        const sp = data.subjectPerformance || {};
        const subjNames = Object.values(sp).map(s => s.name);
        const subjAvgs = Object.values(sp).map(s => s.average || 0);
        renderBarChart('caSubjectChart', 'Subject Averages', subjNames, subjAvgs, '#1a237e');
        
        // Top performers
        const top = data.topPerformers || [];
        document.getElementById('caTopTable').innerHTML = top.length ? `
            <table class="table table-sm analytics-table"><thead><tr><th>#</th><th>Name</th><th>Average</th><th>Grade</th></tr></thead><tbody>
            ${top.map((s,i) => `<tr><td>${i+1}</td><td>${s.name}</td><td>${(s.average||0).toFixed(1)}</td><td><span class="badge" style="background:${api.getGradeColor(s.grade||'F').color}">${s.grade||'F'}</span></td></tr>`).join('')}
            </tbody></table>` : '<p class="text-muted">No data</p>';
        
        // Bottom performers
        const bottom = data.bottomPerformers || [];
        document.getElementById('caBottomTable').innerHTML = bottom.length ? `
            <table class="table table-sm analytics-table"><thead><tr><th>#</th><th>Name</th><th>Average</th><th>Grade</th></tr></thead><tbody>
            ${bottom.map((s,i) => `<tr><td>${i+1}</td><td>${s.name}</td><td>${(s.average||0).toFixed(1)}</td><td><span class="badge" style="background:${api.getGradeColor(s.grade||'F').color}">${s.grade||'F'}</span></td></tr>`).join('')}
            </tbody></table>` : '<p class="text-muted">No data</p>';
        
        showToast('Class analysis loaded', 'success');
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

// ============================================
// SCHOOL ANALYSIS
// ============================================

async function loadSchoolAnalysis() {
    const term = document.getElementById('saTerm').value;
    try {
        showToast('Loading school analysis...', 'info');
        const data = await api.getSchoolAnalysis(term);
        if (data.error) { showToast(data.error, 'danger'); return; }
        
        const classes = data.classAnalyses || [];
        
        // Stats
        document.getElementById('saStats').innerHTML = `
            <div class="col-md-3"><div class="card stat-card bg-primary text-white"><div class="card-body text-center"><h6>Total Students</h6><h3>${data.totalStudents||0}</h3></div></div></div>
            <div class="col-md-3"><div class="card stat-card bg-success text-white"><div class="card-body text-center"><h6>Overall Avg</h6><h3>${(data.overallAverage||0).toFixed(1)}</h3></div></div></div>
            <div class="col-md-3"><div class="card stat-card bg-warning text-white"><div class="card-body text-center"><h6>Pass Rate</h6><h3>${data.totalPassRate||0}%</h3></div></div></div>
            <div class="col-md-3"><div class="card stat-card bg-info text-white"><div class="card-body text-center"><h6>Best Class</h6><h3 style="font-size:18px">${data.bestClass?.className||'-'}</h3></div></div></div>`;
        
        // Class comparison chart
        const clsNames = classes.map(c => c.className);
        const clsAvgs = classes.map(c => c.average || 0);
        renderBarChart('saClassChart', 'Class Averages', clsNames, clsAvgs, '#0d47a1');
        
        // Pass rates chart
        const clsPass = classes.map(c => c.passRate || 0);
        renderBarChart('saPassChart', 'Pass Rates (%)', clsNames, clsPass, '#28a745');
        
        // Class summary table
        document.getElementById('saClassTable').innerHTML = `
            <table class="table table-sm analytics-table"><thead><tr><th>Class</th><th>Students</th><th>Average</th><th>Pass Rate</th><th>Distinctions</th></tr></thead><tbody>
            ${classes.map(c => `<tr><td><strong>${c.className}</strong></td><td>${c.students||0}</td><td>${(c.average||0).toFixed(1)}</td><td>${c.passRate||0}%</td><td>${c.distinctionCount||0}</td></tr>`).join('')}
            </tbody></table>`;
        
        showToast('School analysis loaded', 'success');
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

// ============================================
// STUDENT ANALYSIS
// ============================================

async function loadStudentAnalysis() {
    const studentId = document.getElementById('saStudent').value;
    if (!studentId) { showToast('Select a student', 'warning'); return; }
    
    try {
        showToast('Loading student analysis...', 'info');
        const data = await api.getStudentAnalysis(studentId);
        if (data.error) { showToast(data.error, 'danger'); return; }
        
        const student = data.student || {};
        const perf = data.performance || [];
        
        // Profile
        document.getElementById('saStudentProfile').innerHTML = `
            <div class="card bg-light"><div class="card-body">
                <h5><i class="fas fa-user-graduate"></i> ${student['Full Name']||'Unknown'}</h5>
                <span class="badge bg-primary me-2">${student['Class']||'-'}</span>
                <span class="badge bg-secondary me-2">${student['Student ID']||'-'}</span>
                ${data.promotionStatus ? `<span class="badge bg-success">${data.promotionStatus.message||'Active'}</span>` : ''}
            </div></div>`;
        
        // Stats
        document.getElementById('saStudentStats').innerHTML = `
            <div class="col-md-3"><div class="card stat-card bg-primary text-white"><div class="card-body text-center"><h6>Cumulative Avg</h6><h3>${(data.cumulative||0).toFixed(1)}</h3></div></div></div>
            <div class="col-md-3"><div class="card stat-card bg-success text-white"><div class="card-body text-center"><h6>Grade</h6><h3>${data.grade||'F'}</h3></div></div></div>
            <div class="col-md-3"><div class="card stat-card bg-warning text-white"><div class="card-body text-center"><h6>GPA</h6><h3>${(data.gpa||0).toFixed(2)}</h3></div></div></div>
            <div class="col-md-3"><div class="card stat-card bg-info text-white"><div class="card-body text-center"><h6>Remark</h6><h3 style="font-size:14px">${data.remark||'-'}</h3></div></div></div>`;
        
        // Term performance chart
        const termLabels = perf.map(p => p.term);
        const termAvgs = perf.map(p => p.average || 0);
        renderLineChart('saTermChart', 'Performance by Term', termLabels, termAvgs, '#1a237e');
        
        // Strengths & weaknesses
        const strengths = data.strengths || [];
        const weaknesses = data.weaknesses || [];
        let swHtml = '';
        if (strengths.length) {
            swHtml += `<h6 class="text-success"><i class="fas fa-check-circle"></i> Strengths (≥70)</h6>`;
            strengths.forEach(s => { swHtml += `<div class="d-flex justify-content-between mb-1"><span>${s.subject}</span><strong class="text-success">${s.score.toFixed(1)}</strong></div>`; });
        }
        if (weaknesses.length) {
            swHtml += `<h6 class="text-danger mt-3"><i class="fas fa-exclamation-circle"></i> Needs Improvement (<40)</h6>`;
            weaknesses.forEach(s => { swHtml += `<div class="d-flex justify-content-between mb-1"><span>${s.subject}</span><strong class="text-danger">${s.score.toFixed(1)}</strong></div>`; });
        }
        if (!strengths.length && !weaknesses.length) swHtml = '<p class="text-muted">No subject data available</p>';
        document.getElementById('saStrengths').innerHTML = swHtml;
        
        showToast('Student analysis loaded', 'success');
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

// ============================================
// TEACHER ANALYSIS
// ============================================

async function loadTeacherAnalysis() {
    const teacherId = document.getElementById('taTeacher').value;
    if (!teacherId) { showToast('Select a teacher', 'warning'); return; }
    
    try {
        showToast('Loading teacher analysis...', 'info');
        const data = await api.getTeacherAnalysis(teacherId);
        if (data.error) { showToast(data.error, 'danger'); return; }
        
        const teacher = data.teacher || {};
        const cp = data.classPerformance || {};
        const cpClasses = Object.keys(cp);
        
        // Stats
        document.getElementById('taStats').innerHTML = `
            <div class="col-md-4"><div class="card stat-card bg-primary text-white"><div class="card-body text-center"><h6>${teacher['Full Name']||'Teacher'}</h6><h6 style="font-size:14px">${teacher['Email']||''}</h6></div></div></div>
            <div class="col-md-4"><div class="card stat-card bg-success text-white"><div class="card-body text-center"><h6>Classes</h6><h3>${cpClasses.length}</h3></div></div></div>
            <div class="col-md-4"><div class="card stat-card bg-warning text-white"><div class="card-body text-center"><h6>Overall Avg</h6><h3>${(data.overallAverage||0).toFixed(1)}</h3></div></div></div>`;
        
        // Class performance chart
        const clsNames = cpClasses;
        const clsAvgs = clsNames.map(c => cp[c].average || 0);
        renderBarChart('taClassChart', 'Class Averages', clsNames, clsAvgs, '#6f42c1');
        
        // Subject performance table
        const subjects = data.subjects || [];
        document.getElementById('taSubjectTable').innerHTML = `
            <table class="table table-sm analytics-table"><thead><tr><th>Subject</th><th>Class</th></tr></thead><tbody>
            ${subjects.map(s => `<tr><td>${s['Subject Name']||''}</td><td>${s['Class']||''}</td></tr>`).join('')}
            ${cpClasses.length ? `<tr class="table-light"><td colspan="2"><strong>Class Performance Details</strong></td></tr>
            ${cpClasses.map(c => `<tr><td>${c}</td><td><small>Avg: ${cp[c].average.toFixed(1)} | Pass: ${cp[c].passRate}% | Dist: ${cp[c].distinctionRate}%</small></td></tr>`).join('')}` : ''}
            </tbody></table>`;
        
        showToast('Teacher analysis loaded', 'success');
    } catch (e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

// ============================================
// CHART HELPERS
// ============================================

function renderBarChart(canvasId, label, labels, data, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Destroy existing chart
    if (chartInstances[canvasId]) { chartInstances[canvasId].destroy(); }
    
    const ctx = canvas.getContext('2d');
    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: Array.isArray(colors) ? colors : (colors || '#1a237e'),
                borderColor: Array.isArray(colors) ? colors.map(() => 'rgba(0,0,0,0.1)') : '#1a237e',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

function renderLineChart(canvasId, label, labels, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    if (chartInstances[canvasId]) { chartInstances[canvasId].destroy(); }
    
    const ctx = canvas.getContext('2d');
    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color || '#1a237e',
                backgroundColor: (color || '#1a237e') + '33',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: color || '#1a237e',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

// ============================================
// UTILITIES
// ============================================

function refreshAll() {
    if (currentTab === 'class') loadClassAnalysis();
    else if (currentTab === 'school') loadSchoolAnalysis();
    else if (currentTab === 'student') loadStudentAnalysis();
    else if (currentTab === 'teacher') loadTeacherAnalysis();
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