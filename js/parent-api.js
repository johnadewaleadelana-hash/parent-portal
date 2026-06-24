// js/parent-api.js - Complete Version (CORS-FIXED for GitHub Pages)
// ============================================
// School Report System - Parent Portal API Client
//
// FIXED: This version handles Google Apps Script CORS issues by:
// 1. Using a free CORS proxy to add CORS headers
// 2. Falling back to direct fetch if no proxy needed
// 3. Retry logic for transient failures
//
// ⚠️ IMPORTANT FOR DEPLOYMENT:
// In Google Apps Script editor, deploy as:
//   - Execute as: Me
//   - Who has access: Anyone (or Anyone with link)
//
// If you set "Anyone" and CORS still fails from GitHub Pages,
// this file will automatically use the CORS proxy.

class ParentAPI {
    constructor() {
        this.apiUrl = CONFIG.API_URL;
        this.schoolId = CONFIG.SCHOOL_ID;
        this.apiKey = CONFIG.API_KEY;
        this.currentStudent = null;
        this.currentReport = null;
        this.retryCount = 0;
        this.maxRetries = 1;
        
        // CORS proxy for Google Apps Script (GitHub Pages fix)
        // https://corsproxy.io/ is a free service that adds CORS headers
        this.corsProxyUrl = 'https://corsproxy.io/?';
        this.useCorsProxy = false; // Will enable if direct fetch fails
    }

    // ============================================
    // BASE API CALL
    // ============================================

    async call(action, params = {}, method = 'GET') {
        try {
            console.log(`📤 API Call: ${action}`, params);
            
            // Build URL with ALL params as query string (Google Apps Script parses these)
            const url = new URL(this.apiUrl);
            url.searchParams.append('action', action);
            url.searchParams.append('schoolId', this.schoolId);
            url.searchParams.append('apiKey', this.apiKey);
            
            // Add action-specific params as query params too
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (typeof value === 'object') {
                        url.searchParams.append(key, JSON.stringify(value));
                    } else {
                        url.searchParams.append(key, value);
                    }
                }
            });
            
            // Determine the actual URL to fetch
            let fetchUrl = url.toString();
            
            // If using CORS proxy, wrap the URL
            if (this.useCorsProxy) {
                fetchUrl = this.corsProxyUrl + encodeURIComponent(fetchUrl);
            }
            
            console.log(`📤 Fetching: ${method} ${fetchUrl.substring(0, 150)}...`);
            
            const options = {
                method: method,
                headers: {
                    'Accept': 'application/json'
                }
            };
            
            // For POST, also send JSON body (Apps Script will parse from e.postData)
            if (method === 'POST' && !this.useCorsProxy) {
                options.headers['Content-Type'] = 'text/plain;charset=utf-8';
                options.body = JSON.stringify(params);
            }
            
            const response = await fetch(fetchUrl, options);
            const text = await response.text();
            
            console.log(`📥 Raw response (${action}):`, text.substring(0, 150));
            
            // Try to parse JSON response
            // Google Apps Script may return an HTML page on first call (auth redirect)
            // or a JSON response on subsequent calls
            let result;
            try {
                result = JSON.parse(text);
            } catch (parseError) {
                // If HTML response (auth page), retry without proxy but with redirect follow
                console.log('⏳ Non-JSON response received (likely auth redirect)');
                
                if (!this.useCorsProxy) {
                    // Try again with redirect: 'follow' (handles the Google auth redirect)
                    console.log('🔄 Retrying with redirect follow...');
                    const retryResponse = await fetch(url.toString(), {
                        method: method,
                        headers: {
                            'Accept': 'application/json'
                        },
                        ...(method === 'POST' ? {
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify(params)
                        } : {}),
                        redirect: 'follow'
                    });
                    const retryText = await retryResponse.text();
                    console.log('📥 Retry response:', retryText.substring(0, 150));
                    result = JSON.parse(retryText);
                } else {
                    throw new Error('Received HTML instead of JSON. Check your Apps Script deployment settings.');
                }
            }
            
            console.log(`📥 Parsed response (${action}):`, result);
            
            if (result.status === 'error') {
                throw new Error(result.data.error || 'API error');
            }
            
            return result.data;
            
        } catch (error) {
            console.error(`❌ API Error (${action}):`, error);
            
            // If CORS error and haven't tried proxy yet, enable proxy and retry
            if (!this.useCorsProxy && 
                (error.message.includes('Failed to fetch') || 
                 error.message.includes('NetworkError') ||
                 error.message.includes('NetworkError when attempting to fetch resource') ||
                 error.toString().includes('TypeError'))) {
                
                console.log('🔄 CORS detected! Enabling CORS proxy and retrying...');
                this.useCorsProxy = true;
                await new Promise(resolve => setTimeout(resolve, 500));
                return this.call(action, params, method);
            }
            
            // If proxy also failed, throw clearly
            if (this.useCorsProxy) {
                throw new Error(`CORS error persists. Please verify:
1. Your Apps Script is deployed with access set to "Anyone"
2. Your Spreadsheet ID in main.gs is correct
3. The API_URL in config.js matches your deployment URL
4. Try visiting the API URL directly in a browser to test`);
            }
            
            throw error;
        }
    }

    // ============================================
    // PARENT PORTAL METHODS
    // ============================================

    async validatePin(pin, className) {
        const result = await this.call('validatePin', { 
            pin: pin, 
            class: className 
        });
        
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

    async getAttendance(studentId, term) {
        return await this.call('getAttendance', { 
            studentId: studentId, 
            term: term 
        });
    }

    async getBehavioral(studentId, term) {
        return await this.call('getBehavioral', { 
            studentId: studentId, 
            term: term 
        });
    }

    async getComments(studentId, term) {
        return await this.call('getComments', { 
            studentId: studentId, 
            term: term 
        });
    }

    // ============================================
    // ADMIN METHODS - STUDENTS
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
        return await this.call('deleteStudent', { studentId: studentId });
    }

    // ============================================
    // ADMIN METHODS - TEACHERS
    // ============================================

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

    // ============================================
    // ADMIN METHODS - SUBJECTS
    // ============================================

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

    // ============================================
    // ADMIN METHODS - CLASSES
    // ============================================

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

    // ============================================
    // ADMIN METHODS - SCORES
    // ============================================

    async getStudentScores(studentId = null, term = null) {
        const params = {};
        if (studentId) params.studentId = studentId;
        if (term) params.term = term;
        return await this.call('getStudentScores', params);
    }

    async saveScores(data) {
        // For saving scores, send via GET params to avoid CORS preflight on POST
        // The main.gs handler reads from e.parameter
        return await this.call('saveScores', data);
    }

    // ============================================
    // ADMIN METHODS - PINS
    // ============================================

    async generatePins(className, term) {
        return await this.call('generatePins', { 
            class: className, 
            term: term 
        });
    }

    async getPinStatus(className) {
        return await this.call('getPinStatus', { class: className });
    }

    async revokePin(studentId) {
        return await this.call('revokePin', { studentId: studentId });
    }

    async getPromotionStatus(studentId) {
        return await this.call('getPromotionStatus', { studentId });
    }

    // ============================================
    // ADMIN METHODS - SETTINGS
    // ============================================

    async getSettings() {
        return await this.call('getSettings');
    }

    async updateSettings(data) {
        return await this.call('updateSettings', data);
    }

    // ============================================
    // ADMIN METHODS - TRANSCRIPTS & BROADSHEETS
    // ============================================

    async generateTranscript(studentId, type = 'standard', options = {}) {
        return await this.call('generateTranscript', { 
            studentId: studentId, 
            type: type,
            ...options 
        });
    }

    async generateBroadsheet(className, term, type = 'full') {
        return await this.call('generateBroadsheet', { 
            class: className, 
            term: term, 
            type: type 
        });
    }

    async getAcademicCalendar() {
        return await this.call('getAcademicCalendar');
    }

    // ============================================
    // ADMIN METHODS - ANALYTICS
    // ============================================

    async getClassAnalysis(className, term) {
        return await this.call('getClassAnalysis', { 
            class: className, 
            term: term 
        });
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
    // UTILITY METHODS
    // ============================================

    calculateGrade(score) {
        const grading = CONFIG.GRADING;
        for (const [grade, range] of Object.entries(grading)) {
            if (score >= range.min && score <= range.max) {
                return grade;
            }
        }
        return 'F';
    }

    getGradeColor(grade) {
        const grading = CONFIG.GRADING;
        return grading[grade] || { color: '#000000', cssClass: '' };
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
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Create global instance
const api = new ParentAPI();
console.log('✅ ParentAPI initialized (CORS proxy auto-detection active)');