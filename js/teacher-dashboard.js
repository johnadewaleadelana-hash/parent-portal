// js/teacher-dashboard.js
// ============================================

const teacherSession = JSON.parse(sessionStorage.getItem('teacherSession'));
if (!teacherSession) window.location.href = 'teacher-login.html';

document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('teacherNameDisplay').innerHTML = `<i class="fas fa-user"></i> ${teacherSession.fullName}`;
    document.getElementById('teacherInfo').textContent = `Class: ${teacherSession.classAssigned} • Subjects: ${teacherSession.subjects.join(', ')}`;
    
    try {
        const students = await api.getTeacherStudents(teacherSession.teacherId);
        const subjects = await api.getTeacherSubjects(teacherSession.teacherId);
        const allScores = await api.getStudentScores(null, CONFIG.CURRENT_TERM.replace('Term',''));
        
        document.getElementById('statStudents').textContent = students.length || 0;
        document.getElementById('statSubjects').textContent = subjects.length || 0;
        document.getElementById('statClass').textContent = teacherSession.classAssigned || '-';
        document.getElementById('statScores').textContent = allScores ? allScores.length : 0;
    } catch (e) {
        console.error('Dashboard error:', e);
    }
});

function teacherLogout() {
    sessionStorage.removeItem('teacherSession');
    window.location.href = 'teacher-login.html';
}