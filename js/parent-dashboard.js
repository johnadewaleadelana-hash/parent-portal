// js/parent-dashboard.js
// ============================================
// Parent Dashboard Logic
// ============================================

let studentData = null;
let reportData = null;
let sessionTimer = null;
let timeLeft = CONFIG.SESSION_TIMEOUT;

document.addEventListener('DOMContentLoaded', async function() {
    // Check if logged in
    const storedStudent = sessionStorage.getItem('parentStudent');
    if (!storedStudent) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        studentData = JSON.parse(storedStudent);
        displayStudentInfo();
        await loadDashboardData();
        startSessionTimer();
    } catch (e) {
        console.error('Error loading dashboard:', e);
        window.location.href = 'index.html';
    }
});

function displayStudentInfo() {
    document.getElementById('studentName').textContent = studentData['Full Name'] || 'Student';
    document.getElementById('studentFullName').textContent = studentData['Full Name'] || 'Student';
    document.getElementById('academicYear').textContent = CONFIG.ACADEMIC_YEAR;
    document.getElementById('currentTerm').textContent = CONFIG.CURRENT_TERM.replace('Term', 'Term ');
}

async function loadDashboardData() {
    try {
        const studentId = studentData['Student ID'];
        
        // Get report data
        reportData = await api.getReport(studentId, 'Term3');
        
        // Guard: if reportData is null/undefined or has error, show placeholder
        if (!reportData || reportData.error) {
            console.error('Report data error:', reportData?.error || 'No data returned');
            showNotification('No report data available for this student', 'warning');
            // Show empty state
            document.getElementById('averageScore').textContent = '--';
            document.getElementById('subjectCount').textContent = '0';
            document.getElementById('attendancePercent').textContent = '--';
            return;
        }
        
        // Update cards
        updatePerformanceCards();
        updateSubjectList();
        updateAttendance();
        
        // Store for later use
        sessionStorage.setItem('parentReport', JSON.stringify(reportData));
        
    } catch (error) {
        console.error('Error loading report:', error);
        showNotification('Error loading report data. Please try again.', 'error');
        
        // Show placeholder values instead of crashing
        const avgEl = document.getElementById('averageScore');
        if (avgEl) avgEl.textContent = '--';
        const subjEl = document.getElementById('subjectCount');
        if (subjEl) subjEl.textContent = '0';
        const attEl = document.getElementById('attendancePercent');
        if (attEl) attEl.textContent = '--';
    }
}

function updatePerformanceCards() {
    // SAFETY: Guard against null/undefined reportData
    if (!reportData) {
        console.warn('updatePerformanceCards: reportData is null');
        return;
    }
    
    const avg = reportData.average || 0;
    const grade = reportData.grade || 'F';
    const gpa = reportData.gpa || 0;
    const gradeInfo = api.getGradeColor(grade);
    
    // Average
    const avgScoreEl = document.getElementById('averageScore');
    if (avgScoreEl) avgScoreEl.textContent = avg.toFixed(2);
    
    const avgGradeEl = document.getElementById('averageGrade');
    if (avgGradeEl) {
        avgGradeEl.textContent = grade;
        avgGradeEl.style.backgroundColor = gradeInfo.color;
        avgGradeEl.style.color = '#fff';
    }
    
    // GPA
    const gpaScoreEl = document.getElementById('gpaScore');
    if (gpaScoreEl) gpaScoreEl.textContent = gpa.toFixed(2);
    
    const gpaLabelEl = document.getElementById('gpaLabel');
    if (gpaLabelEl) {
        gpaLabelEl.textContent = gpa >= 3.5 ? 'Excellent' : gpa >= 3.0 ? 'Very Good' : 'Good';
    }
    
    // Subjects
    const scores = reportData.scores || [];
    const passed = scores.filter(s => s.cumulative && s.cumulative >= 40).length;
    
    const subjCountEl = document.getElementById('subjectCount');
    if (subjCountEl) subjCountEl.textContent = scores.length;
    
    const passedCountEl = document.getElementById('passedCount');
    if (passedCountEl) passedCountEl.textContent = passed + ' Passed';
}

function updateSubjectList() {
    const container = document.getElementById('subjectList');
    if (!container) return;
    
    const scores = reportData && reportData.scores ? reportData.scores : [];
    
    if (scores.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-3">No subject data available</div>';
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table table-hover">';
    html += `
        <thead>
            <tr>
                <th>Subject</th>
                <th>Term 1</th>
                <th>Term 2</th>
                <th>Term 3</th>
                <th>Cumulative</th>
                <th>Grade</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    scores.forEach(subject => {
        const cumulative = subject.cumulative || 0;
        const grade = subject.grade || 'F';
        const gradeInfo = api.getGradeColor(grade);
        const status = cumulative >= 70 ? '🌟 Distinction' : 
                      cumulative >= 60 ? '✅ Very Good' : 
                      cumulative >= 50 ? '✅ Credit' : 
                      cumulative >= 40 ? '⚠️ Pass' : '❌ Fail';
        const statusColor = cumulative >= 70 ? '#28a745' :
                           cumulative >= 60 ? '#8bc34a' :
                           cumulative >= 50 ? '#ffc107' :
                           cumulative >= 40 ? '#fd7e14' : '#d32f2f';
        
        html += `
            <tr>
                <td><strong>${subject.subject}</strong></td>
                <td>${subject.term1 || '-'}</td>
                <td>${subject.term2 || '-'}</td>
                <td>${subject.term3 || '-'}</td>
                <td><strong>${cumulative.toFixed(2)}</strong></td>
                <td>
                    <span class="grade-badge" style="background-color:${gradeInfo.color};color:#fff;padding:4px 10px;border-radius:4px;">
                        ${grade}
                    </span>
                </td>
                <td style="color:${statusColor}">${status}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function updateAttendance() {
    if (!reportData) return;
    
    const attendance = reportData.attendance || {};
    const term3 = attendance.term3 || {};
    const timesOpened = term3['Times School Opened'] || 0;
    const timesPresent = term3['Times Present'] || 0;
    const percentage = timesOpened > 0 ? (timesPresent / timesOpened) * 100 : 0;
    
    const attPercentEl = document.getElementById('attendancePercent');
    if (attPercentEl) attPercentEl.textContent = percentage.toFixed(1) + '%';
    
    const attDaysEl = document.getElementById('attendanceDays');
    if (attDaysEl) attDaysEl.textContent = `${timesPresent}/${timesOpened} days`;
}

// Session Timer
function startSessionTimer() {
    updateTimerDisplay();
    sessionTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(sessionTimer);
            logout();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timerEl = document.getElementById('sessionTimer');
    if (timerEl) {
        timerEl.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        if (timeLeft < 60) {
            timerEl.style.color = '#dc3545';
        }
    }
}

// Download PDF
function downloadPDF() {
    window.location.href = 'parent-report.html?action=download';
}

// Print Report
function printReport() {
    window.location.href = 'parent-report.html?action=print';
}

// Logout - redirect to index.html (landing page)
function logout() {
    sessionStorage.removeItem('parentStudent');
    sessionStorage.removeItem('parentPin');
    sessionStorage.removeItem('parentClass');
    sessionStorage.removeItem('parentReport');
    clearInterval(sessionTimer);
    window.location.href = 'index.html';
}

// Notification Helper
function showNotification(message, type = 'success') {
    // Create notification element
    const container = document.getElementById('notification-container') || 
                     (() => {
                         const div = document.createElement('div');
                         div.id = 'notification-container';
                         div.style.cssText = `
                             position: fixed;
                             top: 20px;
                             right: 20px;
                             z-index: 9999;
                             max-width: 400px;
                         `;
                         document.body.appendChild(div);
                         return div;
                     })();
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    notification.style.cssText = `
        padding: 15px 20px;
        margin-bottom: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}