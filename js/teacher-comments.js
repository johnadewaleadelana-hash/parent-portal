// js/teacher-comments.js

const teacherSession = JSON.parse(sessionStorage.getItem('teacherSession'));
if (!teacherSession) window.location.href = 'teacher-login.html';

let students = [];
let subjects = [];

document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('teacherInfo').textContent = `Class: ${teacherSession.classAssigned}`;
    students = await api.getTeacherStudents(teacherSession.teacherId);
    subjects = await api.getTeacherSubjects(teacherSession.teacherId);
    
    const sel = document.getElementById('cmtStudent');
    sel.innerHTML = '<option value="">Select student...</option>';
    students.forEach(s => { sel.innerHTML += `<option value="${s['Student ID']}">${s['Full Name']}</option>`; });
    sel.addEventListener('change', loadComments);
});

async function loadComments() {
    const studentId = document.getElementById('cmtStudent').value;
    const term = document.getElementById('cmtTerm').value;
    const container = document.getElementById('cmtContainer');
    if (!studentId) { container.innerHTML = '<div class="text-center py-5 text-muted"><p>Select a student</p></div>'; return; }
    
    // Get existing comments
    let existingTutor = '', existingHead = '';
    try {
        const comments = await api.getComments(studentId, term);
        if (comments && comments.length > 0) {
            const tutor = comments.find(c => c['Comment Type ID'] === 'CMT001');
            const head = comments.find(c => c['Comment Type ID'] === 'CMT005');
            if (tutor) existingTutor = tutor['Comment Text'] || '';
            if (head) existingHead = head['Comment Text'] || '';
        }
    } catch(e) { /* no existing comments */ }
    
    let html = `<div class="row g-3">
        <div class="col-12"><label class="form-label fw-bold">Tutor's Comment</label>
        <textarea class="form-control" id="tutorComment" rows="4" placeholder="Write your comment about this student...">${existingTutor}</textarea></div>`;
    
    // Per-subject comments
    if (subjects.length > 0) {
        html += '<div class="col-12 mt-3"><label class="form-label fw-bold">Subject Comments</label></div>';
        subjects.forEach(subj => {
            html += `<div class="col-md-6"><label class="form-label small">${subj['Subject Name']}</label>
                <input type="text" class="form-control form-control-sm subj-comment" data-subj="${subj['Subject ID']}" placeholder="Comment for this subject"></div>`;
        });
    }
    
    // Head teacher auto-comment
    html += `<div class="col-12 mt-3"><label class="form-label fw-bold">Head Teacher's Comment (auto-generated)</label>
        <textarea class="form-control" id="headComment" rows="3" readonly placeholder="Based on average performance">${existingHead}</textarea>
        <div class="form-text">This is generated automatically based on the student's average score.</div></div>
    </div>`;
    
    container.innerHTML = html;
}

async function saveComments() {
    const studentId = document.getElementById('cmtStudent').value;
    const term = document.getElementById('cmtTerm').value;
    const tutorComment = document.getElementById('tutorComment')?.value || '';
    if (!studentId) { showToast('Select a student', 'warning'); return; }
    
    try {
        // Save tutor comment
        if (tutorComment.trim()) {
            await api.call('saveComment', { studentId, term: parseInt(term), commentTypeId: 'CMT001', commentText: tutorComment });
        }
        showToast('Comments saved successfully!', 'success');
    } catch (e) { showToast('Error: '+e.message, 'danger'); }
}

function showToast(msg, type='success') {
    const t = document.getElementById('toastMessage'), b = document.getElementById('toastBody');
    if (!t) return; t.className = `toast align-items-center text-white border-0 bg-${type}`;
    b.textContent = msg; new bootstrap.Toast(t).show();
}

function teacherLogout() { sessionStorage.removeItem('teacherSession'); window.location.href = 'teacher-login.html'; }