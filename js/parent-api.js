// js/parent-api.js - Complete Version (GitHub Pages Compatible)
// ============================================
// School Report System - Parent Portal API Client
// FIXED: Handles proxy timeouts (504) gracefully

class ParentAPI {
    constructor() {
        this.apiUrl = CONFIG.API_URL;
        this.schoolId = CONFIG.SCHOOL_ID;
        this.apiKey = CONFIG.API_KEY;
        this.currentStudent = null;
        this.currentReport = null;
        
        this.isGitHubPages = window.location.hostname.includes('github.io') || 
                             window.location.hostname.includes('netlify.app');
        this.corsProxyUrl = 'https://corsproxy.io/?';
        
        console.log(`🌐 Running from: ${window.location.hostname}`);
        console.log(`🔌 CORS proxy ${this.isGitHubPages ? 'ENABLED' : 'DISABLED'}`);
    }

    async call(action, params = {}, method = 'GET') {
        try {
            console.log(`📤 API Call: ${action}`, params);
            
            const url = new URL(this.apiUrl);
            url.searchParams.append('action', action);
            url.searchParams.append('schoolId', this.schoolId);
            url.searchParams.append('apiKey', this.apiKey);
            url.searchParams.append('_t', Date.now().toString());
            
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (typeof value === 'object') {
                        url.searchParams.append(key, JSON.stringify(value));
                    } else {
                        url.searchParams.append(key, value);
                    }
                }
            });
            
            let fetchUrl = url.toString();
            if (this.isGitHubPages) {
                fetchUrl = this.corsProxyUrl + encodeURIComponent(fetchUrl);
            }
            
            // Add timeout via AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout
            
            const options = {
                method: method,
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            };
            
            if (method === 'POST') {
                options.headers['Content-Type'] = 'text/plain;charset=utf-8';
                options.body = JSON.stringify(params);
            }
            
            const response = await fetch(fetchUrl, options);
            clearTimeout(timeoutId);
            const text = await response.text();
            
            console.log(`📥 Raw (${action}):`, text.substring(0, 300));
            
            // Check if response is HTML (error page from Google)
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                const errorMatch = text.match(/<title>([^<]+)<\/title>/);
                const errorTitle = errorMatch ? errorMatch[1] : 'Unknown Error';
                throw new Error(`Apps Script error: ${errorTitle}. Re-deploy with ALL .gs files.`);
            }
            
            // Parse JSON
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error('Invalid JSON response: ' + text.substring(0, 100));
            }
            
            console.log(`📥 Parsed (${action}):`, result);
            
            // Handle proxy error responses (e.g. 504 from corsproxy.io)
            if (result.error && result.error.status === 504) {
                throw new Error(`Request timed out (${action} took too long). Try refreshing.`);
            }
            
            if (result.status === 'error') {
                throw new Error(result.data?.error || 'Unknown API error');
            }
            
            return result.data;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error(`❌ Timeout (${action}): Request exceeded 45s`);
                throw new Error('Request timed out. The server took too long to respond.');
            }
            console.error(`❌ API Error (${action}):`, error.message);
            throw error;
        }
    }

    // ============================================
    // TEST METHOD
    // ============================================

    async test() {
        const result = await this.call('test');
        console.log('✅ API test:', result);
        return result;
    }

    // ============================================
    // PARENT PORTAL METHODS
    // ============================================

    async validatePin(pin, className) {
        const result = await this.call('validatePin', { pin, class: className });
        if (result.valid) {
            this.currentStudent = result.student;
            return result;
        }
        throw new Error(result.message || 'Invalid PIN');
    }

    async getReport(studentId, term = null) {
        if (!term || term === 'Term3') {
            const report = await this.call('generateCumulativeReport', { studentId });
            this.currentReport = report;
            return report;
        }
        const report = await this.call('getReportCard', { studentId, term });
        this.currentReport = report;
        return report;
    }

    // Lightweight report - just scores for current term (faster than full cumulative)
    async getQuickReport(studentId) {
        const scores = await this.call('getStudentScores', { studentId, term: 3 });
        const student = await this.call('getStudent', { studentId });
        const subjects = await this.call('getSubjects', { class: student ? student['Class'] : null });
        
        const report = {
            student: student || {},
            scores: scores.map(s => {
                const subject = subjects.find(sub => sub['Subject ID'] === s['Subject ID']);
                return {
                    subject: subject ? subject['Subject Name'] : 'Unknown',
                    ca1: Number(s['CA1']) || 0,
                    ca2: Number(s['CA2']) || 0,
                    exam: Number(s['Exam']) || 0,
                    total: Number(s['Total']) || 0,
                    grade: s['Grade'] || 'F'
                };
            }),
            average: scores.length > 0 ? scores.reduce((sum, s) => sum + (Number(s['Total']) || 0), 0) / scores.length : 0
        };
        
        const avg = report.average;
        report.grade = this.calculateGrade(avg);
        report.gpa = this.calculateGPA(avg);
        
        this.currentReport = report;
        return report;
    }

    async getAttendance(studentId, term) {
        return await this.call('getAttendance', { studentId, term });
    }

    async getBehavioral(studentId, term) {
        return await this.call('getBehavioral', { studentId, term });
    }

    async getComments(studentId, term) {
        return await this.call('getComments', { studentId, term });
    }

    // ============================================
    // ADMIN METHODS
    // ============================================

    async getStudents(className = null) {
        return await this.call('getStudents', { class: className });
    }

    async getStudent(studentId) {
        return await this.call('getStudent', { studentId });
    }

    async addStudent(data) {
        return await this.call('addStudent', data);
    }

    async updateStudent(data) {
        return await this.call('updateStudent', data);
    }

    async deleteStudent(studentId) {
        return await this.call('deleteStudent', { studentId });
    }

    async getTeachers() {
        return await this.call('getTeachers');
    }

    async addTeacher(data) {
        return await this.call('addTeacher', data);
    }

    async updateTeacher(data) {
        return await this.call('updateTeacher', data);
    }

    async deleteTeacher(data) {
        return await this.call('deleteTeacher', { teacherId: data.teacherId });
    }

    async getSubjects(className = null) {
        return await this.call('getSubjects', { class: className });
    }

    async addSubject(data) {
        return await this.call('addSubject', data);
    }

    async updateSubject(data) {
        return await this.call('updateSubject', data);
    }

    async deleteSubject(data) {
        return await this.call('deleteSubject', { subjectId: data.subjectId });
    }

    async getClasses() {
        return await this.call('getClasses');
    }

    async addClass(data) {
        return await this.call('addClass', data);
    }

    async updateClass(data) {
        return await this.call('updateClass', data);
    }

    async deleteClass(data) {
        return await this.call('deleteClass', { classId: data.classId });
    }

    async getStudentScores(studentId = null, term = null) {
        const params = {};
        if (studentId) params.studentId = studentId;
        if (term) params.term = term;
        return await this.call('getStudentScores', params);
    }

    async saveScores(data) {
        return await this.call('saveScores', data);
    }

    async generatePins(className, term) {
        return await this.call('generatePins', { class: className, term });
    }

    async getPinStatus(className) {
        return await this.call('getPinStatus', { class: className });
    }

    async revokePin(studentId) {
        return await this.call('revokePin', { studentId });
    }

    async getPromotionStatus(studentId) {
        return await this.call('getPromotionStatus', { studentId });
    }

    async getSettings() {
        return await this.call('getSettings');
    }

    async updateSettings(data) {
        return await this.call('updateSettings', data);
    }

    async generateTranscript(studentId, type = 'standard', options = {}) {
        return await this.call('generateTranscript', { studentId, type, ...options });
    }

    async generateBroadsheet(className, term, type = 'full') {
        return await this.call('generateBroadsheet', { class: className, term, type });
    }

    async getAcademicCalendar() {
        return await this.call('getAcademicCalendar');
    }

    async getClassAnalysis(className, term) {
        return await this.call('getClassAnalysis', { class: className, term });
    }

    async getStudentAnalysis(studentId) {
        return await this.call('getStudentAnalysis', { studentId });
    }

    async getSchoolAnalysis(term) {
        return await this.call('getSchoolAnalysis', { term });
    }

    async getTeacherAnalysis(teacherId) {
        return await this.call('getTeacherAnalysis', { teacherId });
    }

    // ============================================
    // TEACHER METHODS
    // ============================================

    async teacherLogin(email, password) {
        return await this.call('teacherLogin', { email, password });
    }

    async getTeacherStudents(teacherId, className = null) {
        return await this.call('getTeacherStudents', { teacherId, class: className });
    }

    async getTeacherSubjects(teacherId, className = null) {
        return await this.call('getTeacherSubjects', { teacherId, class: className });
    }

    async getTeacherClass(teacherId) {
        return await this.call('getTeacherClass', { teacherId });
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    calculateGrade(score) {
        const grading = CONFIG.GRADING;
        for (const [grade, range] of Object.entries(grading)) {
            if (score >= range.min && score <= range.max) return grade;
        }
        return 'F';
    }

    getGradeColor(grade) {
        return CONFIG.GRADING[grade] || { color: '#000000', cssClass: '' };
    }

    calculateGPA(average) {
        if (average >= 90) return 4.0;
        if (average >= 80) return 3.5;
        if (average >= 75) return 3.25;
        if (average >= 70) return 3.0;
        if (average >= 65) return 2.75;
        if (average >= 60) return 2.5;
        if (average >= 55) return 2.25;
        if (average >= 50) return 2.0;
        if (average >= 45) return 1.75;
        if (average >= 40) return 1.5;
        if (average >= 35) return 1.25;
        if (average >= 30) return 1.0;
        if (average >= 25) return 0.75;
        if (average >= 20) return 0.5;
        if (average >= 15) return 0.25;
        return 0;
    }

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}

// Create global instance
const api = new ParentAPI();
console.log('✅ ParentAPI initialized (cache-busting enabled)');