// js/admin-dashboard.js
// ============================================
// Admin Dashboard - Updated with Scores & Refresh

document.addEventListener('DOMContentLoaded', async function() {
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    try {
        await loadStats();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
});

async function loadStats() {
    try {
        // Get students
        const students = await api.getStudents();
        document.getElementById('totalStudents').textContent = students.length || 0;
        
        // Get teachers
        const teachers = await api.getTeachers();
        document.getElementById('totalTeachers').textContent = teachers.length || 0;
        
        // Get subjects
        const subjects = await api.getSubjects();
        document.getElementById('totalSubjects').textContent = subjects.length || 0;
        
        // Get classes
        const classes = await api.getClasses();
        document.getElementById('totalClasses').textContent = classes.length || 0;
        
        // NEW: Get scores count - total score records across all terms
        try {
            const term1Scores = await api.getStudentScores(null, 1);
            const term2Scores = await api.getStudentScores(null, 2);
            const term3Scores = await api.getStudentScores(null, 3);
            const totalScores = (term1Scores ? term1Scores.length : 0) + 
                                (term2Scores ? term2Scores.length : 0) + 
                                (term3Scores ? term3Scores.length : 0);
            const scoresElement = document.getElementById('totalScores');
            if (scoresElement) {
                scoresElement.textContent = totalScores;
            }
        } catch (scoreError) {
            console.log('Could not load scores count:', scoreError.message);
            const scoresElement = document.getElementById('totalScores');
            if (scoresElement) {
                scoresElement.textContent = 'N/A';
            }
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('totalStudents').textContent = 'Error';
    }
}

function adminLogout() {
    sessionStorage.removeItem('adminSession');
    window.location.href = 'admin-login.html';
}

async function refreshData() {
    const refreshBtn = document.querySelector('.btn-outline-dark i');
    if (refreshBtn) {
        refreshBtn.className = 'fas fa-spinner fa-spin';
    }
    await loadStats();
    if (refreshBtn) {
        refreshBtn.className = 'fas fa-sync';
    }
}