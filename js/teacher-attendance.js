// js/teacher-attendance.js

const teacherSession = JSON.parse(sessionStorage.getItem('teacherSession'));
if (!teacherSession) window.location.href = 'teacher-login.html';

let students = [];

document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('teacherInfo').textContent = `Class: ${teacherSession.classAssigned}`;
    students = await api.getTeacherStudents(teacherSession.teacherId);
    renderAttendance();
});

function renderAttendance() {
    const container = document.getElementById('attendanceContainer');
    if (students.length === 0) { container.innerHTML = '<div class="text-center py-5"><p>No students</p></div>'; return; }
    let html = '<div class="table-responsive"><table class="table table-bordered"><thead class="table-dark"><tr><th>#</th><th>Student</th><th>Times Present</th><th>%</th></tr></thead><tbody>';
    students.forEach((s, i) => {
        html += `<tr><td>${i+1}</td><td><strong>${s['Full Name']}</strong></td>
            <td><input type="number" class="form-control form-control-sm att-present" data-sid="${s['Student ID']}" min="0" value="0" oninput="calcPercent(this)"></td>
            <td class="att-pct">0%</td></tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function calcPercent(input) {
    const opened = parseInt(document.getElementById('timesOpened').value) || 0;
    const present = parseInt(input.value) || 0;
    const pct = opened > 0 ? Math.round((present/opened)*100) : 0;
    input.closest('tr').querySelector('.att-pct').textContent = pct + '%';
}

async function saveAllAttendance() {
    const term = document.getElementById('attTerm').value;
    const timesOpened = parseInt(document.getElementById('timesOpened').value) || 0;
    if (timesOpened <= 0) { showToast('Enter times school opened', 'warning'); return; }
    try {
        let saved = 0;
        for (const row of document.querySelectorAll('.att-present')) {
            const studentId = row.dataset.sid;
            const timesPresent = parseInt(row.value) || 0;
            if (timesPresent > 0) {
                await api.call('saveAttendance', { studentId, term: parseInt(term), timesOpened, timesPresent });
                saved++;
            }
        }
        showToast(`Saved attendance for ${saved} students`, 'success');
    } catch (e) { showToast('Error: '+e.message, 'danger'); }
}

function showToast(msg, type='success') {
    const t = document.getElementById('toastMessage'), b = document.getElementById('toastBody');
    if (!t) return; t.className = `toast align-items-center text-white border-0 bg-${type}`;
    b.textContent = msg; new bootstrap.Toast(t).show();
}

function teacherLogout() { sessionStorage.removeItem('teacherSession'); window.location.href = 'teacher-login.html'; }