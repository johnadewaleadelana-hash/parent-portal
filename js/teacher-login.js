// js/teacher-login.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('teacherLoginForm');
    const email = document.getElementById('teacherEmail');
    const password = document.getElementById('teacherPassword');
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!email.value.trim() || !password.value.trim()) {
            showError('Please enter email and password');
            return;
        }

        loginBtn.disabled = true;
        loginText.classList.add('d-none');
        loginSpinner.classList.remove('d-none');
        errorDiv.classList.add('d-none');

        try {
            const result = await api.teacherLogin(email.value.trim(), password.value.trim());
            
            if (result.success) {
                sessionStorage.setItem('teacherSession', JSON.stringify({
                    teacherId: result.teacher.teacherId,
                    fullName: result.teacher.fullName,
                    email: result.teacher.email,
                    classAssigned: result.teacher.classAssigned,
                    subjects: result.teacher.subjects,
                    isTutor: result.teacher.isTutor,
                    loginTime: new Date().toISOString()
                }));
                window.location.href = 'teacher-dashboard.html';
            } else {
                showError(result.error || 'Invalid credentials');
            }
        } catch (error) {
            showError(error.message || 'Login error');
        } finally {
            loginBtn.disabled = false;
            loginText.classList.remove('d-none');
            loginSpinner.classList.add('d-none');
        }
    });

    function showError(msg) {
        errorText.textContent = msg;
        errorDiv.classList.remove('d-none');
    }
});