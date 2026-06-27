// js/teacher-scores.js
// ============================================
// Teacher Score Entry

const teacherSession = JSON.parse(sessionStorage.getItem('teacherSession'));
if (!teacherSession) window.location.href = 'teacher-login.html';

let currentStudents = [];
let currentSubjects = [];
let isSaving = false;

document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('teacherInfo').textContent = `Class: ${teacherSession.classAssigned}`;
    document.getElementById('scoreTerm').addEventListener('change', loadScores);
    await loadSubjects();
    if (currentSubjects.length > 0) loadScores();
});

async function loadSubjects() {
    const sel = document.getElementById('scoreSubject');
    sel.innerHTML = '<option value="">Loading...</option>';
    currentSubjects = await api.getTeacherSubjects(teacherSession.teacherId);
    currentStudents = await api.getTeacherStudents(teacherSession.teacherId);
    sel.innerHTML = '<option value="">Select subject...</option>';
    currentSubjects.forEach(s => { sel.innerHTML += `<option value="${s['Subject ID']}">${s['Subject Name']}</option>`; });
    if (currentSubjects.length > 0) { sel.value = currentSubjects[0]['Subject ID']; }
}

async function loadScores() {
    const subjectId = document.getElementById('scoreSubject').value;
    const term = document.getElementById('scoreTerm').value;
    if (!subjectId) return;
    try {
        const allScores = await api.getStudentScores(null, term);
        const filtered = allScores.filter(s => s['Subject ID'] === subjectId);
        const scoresMap = {};
        filtered.forEach(s => { scoresMap[s['Student ID']] = s; });
        renderScores(scoresMap);
        updateSummary(scoresMap);
    } catch (e) { console.error(e); showToast('Error loading scores', 'danger'); }
}

function renderScores(scoresMap) {
    const container = document.getElementById('scoresContainer');
    if (currentStudents.length === 0) { container.innerHTML = '<div class="text-center py-5 text-muted"><p>No students</p></div>'; return; }
    let html = '<div class="table-responsive"><table class="table table-bordered table-hover"><thead class="table-dark"><tr><th>#</th><th>Student</th><th>CA1 (0-20)</th><th>CA2 (0-20)</th><th>Exam (0-60)</th><th>Total</th><th>Grade</th></tr></thead><tbody>';
    currentStudents.forEach((student, i) => {
        const s = scoresMap[student['Student ID']] || {};
        html += `<tr data-student-id="${student['Student ID']}"><td>${i+1}</td>
            <td><strong>${student['Full Name']}</strong></td>
            <td><input type="number" class="form-control form-control-sm" data-field="ca1" min="0" max="20" value="${s['CA1']||''}" oninput="onChange(this)"></td>
            <td><input type="number" class="form-control form-control-sm" data-field="ca2" min="0" max="20" value="${s['CA2']||''}" oninput="onChange(this)"></td>
            <td><input type="number" class="form-control form-control-sm" data-field="exam" min="0" max="60" value="${s['Exam']||''}" oninput="onChange(this)"></td>
            <td class="total-cell text-center fw-bold">${s['Total']||'-'}</td>
            <td class="grade-cell text-center">${s['Grade']||'-'}</td></tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
    document.getElementById('summaryStats').style.display = 'block';
}

function onChange(input) {
    const row = input.closest('tr');
    if (!row) return;
    const ca1 = parseFloat(row.querySelector('[data-field="ca1"]')?.value) || 0;
    const ca2 = parseFloat(row.querySelector('[data-field="ca2"]')?.value) || 0;
    const exam = parseFloat(row.querySelector('[data-field="exam"]')?.value) || 0;
    const total = Math.min(ca1,20) + Math.min(ca2,20) + Math.min(exam,60);
    const grade = api.calculateGrade(total);
    row.querySelector('.total-cell').textContent = total;
    row.querySelector('.grade-cell').textContent = grade;
    updateSummaryFromTable();
}

async function saveAllScores() {
    if (isSaving) return; isSaving = true;
    const term = document.getElementById('scoreTerm').value;
    const subjectId = document.getElementById('scoreSubject').value;
    try {
        let saved = 0;
        for (const row of document.querySelectorAll('#scoresContainer tbody tr')) {
            const studentId = row.dataset.studentId;
            const ca1 = parseFloat(row.querySelector('[data-field="ca1"]')?.value) || 0;
            const ca2 = parseFloat(row.querySelector('[data-field="ca2"]')?.value) || 0;
            const exam = parseFloat(row.querySelector('[data-field="exam"]')?.value) || 0;
            if (ca1===0 && ca2===0 && exam===0) continue;
            await api.saveScores({ studentId, subjectId, term: parseInt(term), ca1, ca2, exam, comment: '' });
            saved++;
        }
        showToast(`✅ Saved ${saved} scores!`, 'success');
    } catch (e) { showToast('Error: '+e.message, 'danger'); }
    finally { isSaving = false; }
}

function updateSummary(scoresMap) {
    const total = currentStudents.length; let filled = 0, totalScore = 0, count = 0;
    currentStudents.forEach(st => {
        const s = scoresMap[st['Student ID']];
        if (s && s['Total']) { filled++; totalScore += parseFloat(s['Total']); count++; }
    });
    document.getElementById('totalStudentsStat').textContent = total;
    document.getElementById('scoresEnteredStat').textContent = total > 0 ? Math.round((filled/total)*100)+'%' : '0%';
    document.getElementById('classAverageStat').textContent = count > 0 ? (totalScore/count).toFixed(1) : '0.0';
}

function updateSummaryFromTable() {
    const rows = document.querySelectorAll('#scoresContainer tbody tr');
    let total = rows.length, filled = 0, totalScore = 0, count = 0;
    rows.forEach(r => {
        const tc = r.querySelector('.total-cell');
        if (tc && tc.textContent && tc.textContent !== '-') { const s = parseFloat(tc.textContent); if (s>0) { filled++; totalScore += s; count++; } }
    });
    document.getElementById('totalStudentsStat').textContent = total;
    document.getElementById('scoresEnteredStat').textContent = total > 0 ? Math.round((filled/total)*100)+'%' : '0%';
    document.getElementById('classAverageStat').textContent = count > 0 ? (totalScore/count).toFixed(1) : '0.0';
}

function showToast(msg, type='success') {
    const t = document.getElementById('toastMessage'), b = document.getElementById('toastBody');
    if (!t) return; t.className = `toast align-items-center text-white border-0 bg-${type}`;
    b.textContent = msg; new bootstrap.Toast(t).show();
}

function teacherLogout() { sessionStorage.removeItem('teacherSession'); window.location.href = 'teacher-login.html'; }