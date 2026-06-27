// js/teacher-behavioral.js

const teacherSession = JSON.parse(sessionStorage.getItem('teacherSession'));
if (!teacherSession) window.location.href = 'teacher-login.html';

let students = [];
const domainsList = [
    { id: 'BEH001', name: 'Fine Motor Skills', cat: 'Psychomotor' },
    { id: 'BEH002', name: 'Gross Motor Skills', cat: 'Psychomotor' },
    { id: 'BEH003', name: 'Coordination', cat: 'Psychomotor' },
    { id: 'BEH004', name: 'Attention Span', cat: 'Affective' },
    { id: 'BEH005', name: 'Emotional Regulation', cat: 'Affective' },
    { id: 'BEH006', name: 'Self-Confidence', cat: 'Affective' },
    { id: 'BEH007', name: 'Social Skills', cat: 'Affective' },
    { id: 'BEH008', name: 'Punctuality', cat: 'Social' },
    { id: 'BEH009', name: 'Attendance', cat: 'Social' },
    { id: 'BEH010', name: 'Relationship with Others', cat: 'Social' },
    { id: 'BEH011', name: 'Sense of Responsibility', cat: 'Social' },
    { id: 'BEH012', name: 'Honesty', cat: 'Social' }
];

document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('teacherInfo').textContent = `Class: ${teacherSession.classAssigned}`;
    students = await api.getTeacherStudents(teacherSession.teacherId);
    const sel = document.getElementById('behStudent');
    sel.innerHTML = '<option value="">Select student...</option>';
    students.forEach(s => { sel.innerHTML += `<option value="${s['Student ID']}">${s['Full Name']}</option>`; });
    sel.addEventListener('change', renderBehavioral);
});

function renderBehavioral() {
    const studentId = document.getElementById('behStudent').value;
    const container = document.getElementById('behContainer');
    if (!studentId) { container.innerHTML = '<div class="text-center py-5 text-muted"><p>Select a student</p></div>'; return; }
    let html = '<div class="table-responsive"><table class="table table-bordered"><thead class="table-dark"><tr><th>Domain</th><th>Category</th><th>Rating (1-5)</th><th>Label</th></tr></thead><tbody>';
    domainsList.forEach(d => {
        html += `<tr><td>${d.name}</td><td><span class="badge bg-secondary">${d.cat}</span></td>
            <td><select class="form-select form-select-sm beh-score" data-domain="${d.id}" onchange="updateBehLabel(this)">
                <option value="0">-</option><option value="1">1 - Poor</option><option value="2">2 - Needs Improvement</option>
                <option value="3">3 - Satisfactory</option><option value="4" selected>4 - Good</option><option value="5">5 - Excellent</option>
            </select></td><td class="beh-label">Good</td></tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function updateBehLabel(sel) {
    const labels = { 0: '-', 1: 'Poor', 2: 'Needs Improvement', 3: 'Satisfactory', 4: 'Good', 5: 'Excellent' };
    sel.closest('tr').querySelector('.beh-label').textContent = labels[sel.value] || '-';
}

async function saveBehavioral() {
    const studentId = document.getElementById('behStudent').value;
    const term = document.getElementById('behTerm').value;
    if (!studentId) { showToast('Select a student', 'warning'); return; }
    try {
        let saved = 0;
        for (const sel of document.querySelectorAll('.beh-score')) {
            const score = parseInt(sel.value);
            if (score > 0) {
                await api.call('saveBehavioral', { studentId, term: parseInt(term), domainId: sel.dataset.domain, score });
                saved++;
            }
        }
        showToast(`Saved ${saved} behavioral ratings`, 'success');
    } catch (e) { showToast('Error: '+e.message, 'danger'); }
}

function showToast(msg, type='success') {
    const t = document.getElementById('toastMessage'), b = document.getElementById('toastBody');
    if (!t) return; t.className = `toast align-items-center text-white border-0 bg-${type}`;
    b.textContent = msg; new bootstrap.Toast(t).show();
}

function teacherLogout() { sessionStorage.removeItem('teacherSession'); window.location.href = 'teacher-login.html'; }