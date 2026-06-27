/**
 * main.gs - API Entry Point (Web App)
 * ============================================
 * This file provides the doGet() and doPost() handlers
 * that are REQUIRED for your Google Apps Script Web App.
 * 
 * IMPORTANT: You must upload ALL .gs files to Apps Script Editor:
 *   - main.gs, SchoolManager.gs, StudentManager.gs, ScoreManager.gs
 *   - CumulativeManager.gs, Utils.gs, PINManager.gs, SettingsManager.gs
 *   - CommentManager.gs, BehavioralManager.gs, TranscriptManager.gs
 *   - BroadsheetManager.gs, AnalyticsManager.gs, PromotionManager.gs
 *   - GraduateTransferManager.gs (15 files total)
 * 
 * @author School Report System
 * @version 1.1
 */

// ============================================
// Spreadsheet ID (must be just the ID, not full URL)
// ============================================
const SPREADSHEET_ID = '1-zHGvgLyxhe2E3tUICqibSDqx4drNYYeIMEJcEZ1qF4';

// ============================================
// API Keys for authentication
// ============================================
const API_KEYS = ['API_KEY_001', 'test_key'];

// ============================================
// HTTP Handlers
// ============================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

// ============================================
// Main Request Handler
// ============================================

function handleRequest(e) {
  // Wrap EVERYTHING in try-catch to ALWAYS return JSON
  try {
    // Ensure e exists
    if (!e) {
      return sendError('No request parameters received');
    }
    
    // Get parameters - handle both GET and POST
    let params;
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (parseError) {
        params = e.parameter;
      }
    } else {
      params = e.parameter;
    }
    
    Logger.log(`📥 Request: action=${params ? params.action : 'undefined'}`);
    
    // Validate params
    if (!params) {
      return sendError('No parameters provided');
    }
    if (!params.action) {
      return sendError('Missing action parameter');
    }
    
    // Initialize SchoolManager with full error handling
    let schoolManager;
    try {
      schoolManager = new SchoolManager(SPREADSHEET_ID);
    } catch (initError) {
      Logger.log(`❌ Failed to initialize SchoolManager: ${initError.message}`);
      return sendError('Failed to initialize: ' + initError.message + 
        '. Check that your Spreadsheet ID is correct and the sheet exists.');
    }
    
    // Route actions
    let result;
    switch (params.action) {
      
      // STUDENTS
      case 'getStudents':
        result = schoolManager.getStudents(params.class || null);
        break;
      case 'getStudent':
        result = schoolManager.getStudent(params.studentId);
        break;
      case 'addStudent':
        result = schoolManager.addStudent(params);
        break;
      case 'updateStudent':
        result = schoolManager.updateStudent(params);
        break;
      case 'deleteStudent':
        result = schoolManager.deleteStudent(params.studentId);
        break;
        
      // TEACHERS
      case 'getTeachers':
        result = schoolManager.getTeachers();
        break;
      case 'addTeacher':
        result = schoolManager.addTeacher(params);
        break;
      case 'updateTeacher':
        result = schoolManager.updateTeacher(params);
        break;
      case 'deleteTeacher':
        result = schoolManager.deleteTeacher(params.teacherId);
        break;
        
      // SUBJECTS
      case 'getSubjects':
        result = schoolManager.getSubjects(params.class || null);
        break;
      case 'addSubject':
        result = schoolManager.addSubject(params);
        break;
      case 'updateSubject':
        result = schoolManager.updateSubject(params);
        break;
      case 'deleteSubject':
        result = schoolManager.deleteSubject(params.subjectId);
        break;
        
      // CLASSES
      case 'getClasses':
        result = schoolManager.getClasses();
        break;
      case 'addClass':
        result = schoolManager.addClass(params);
        break;
      case 'updateClass':
        result = schoolManager.updateClass(params);
        break;
      case 'deleteClass':
        result = schoolManager.deleteClass(params.classId);
        break;
        
      // SCORES
      case 'getStudentScores':
        result = schoolManager.getStudentScores(params.studentId || null, params.term || null);
        break;
      // TEACHER ACTIONS
      case 'teacherLogin':
        result = schoolManager.teacherManager.teacherLogin(params.email, params.password);
        break;
      case 'getTeacherStudents':
        result = schoolManager.teacherManager.getTeacherStudents(params.teacherId, params.class || null);
        break;
      case 'getTeacherSubjects':
        result = schoolManager.teacherManager.getTeacherSubjects(params.teacherId, params.class || null);
        break;
      case 'getTeacherClass':
        result = schoolManager.teacherManager.getTeacherClass(params.teacherId);
        break;
        
      // SCORES
      case 'saveScores':
        result = schoolManager.saveScores(params);
        break;
        
      // REPORTS
      case 'getReportCard':
        result = schoolManager.getReportCard(params.studentId, params.term);
        break;
      case 'generateCumulativeReport':
        result = schoolManager.generateCumulativeReport(params.studentId);
        break;
        
      // ATTENDANCE
      case 'getAttendance':
        result = schoolManager.getAttendance(params.studentId, params.term);
        break;
        
      // BEHAVIORAL
      case 'getBehavioral':
        result = schoolManager.getBehavioral(params.studentId, params.term);
        break;
        
      // COMMENTS
      case 'getComments':
        result = schoolManager.getComments(params.studentId, params.term);
        break;
        
      // PINS
      case 'validatePin':
        result = schoolManager.validatePin(params.pin, params.class);
        break;
      case 'generatePins':
        result = schoolManager.generatePins(params.class, params.term);
        break;
      case 'getPinStatus':
        result = schoolManager.getPinStatus(params.class);
        break;
      case 'revokePin':
        result = schoolManager.revokePin(params.studentId);
        break;
        
      // SETTINGS
      case 'getSettings':
        result = schoolManager.getSettings();
        break;
      case 'updateSettings':
        result = schoolManager.updateSettings(params);
        break;
        
      // TRANSCRIPTS & BROADSHEETS
      case 'generateTranscript':
        result = schoolManager.generateTranscript(params.studentId, params.type || 'standard', params.options || {});
        break;
      case 'generateBroadsheet':
        result = schoolManager.generateBroadsheet(params.class, params.term, params.type || 'full');
        break;
        
      // ANALYTICS
      case 'getClassAnalysis':
        result = schoolManager.getClassAnalysis(params.class, params.term);
        break;
      case 'getStudentAnalysis':
        result = schoolManager.getStudentAnalysis(params.studentId);
        break;
      case 'getSchoolAnalysis':
        result = schoolManager.getSchoolAnalysis(params.term);
        break;
      case 'getTeacherAnalysis':
        result = schoolManager.getTeacherAnalysis(params.teacherId);
        break;
        
      // PROMOTION
      case 'getPromotionStatus':
        result = schoolManager.getPromotionStatus(params.studentId);
        break;
        
      // CALENDAR
      case 'getAcademicCalendar':
        result = schoolManager.getAcademicCalendar();
        break;
        
      // TEST - always returns success
      case 'test':
        result = { message: 'API is working', timestamp: new Date().toISOString() };
        break;
        
      default:
        return sendError('Unknown action: ' + params.action);
    }
    
    Logger.log(`✅ ${params.action} completed`);
    return sendSuccess(result);
    
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}\n${error.stack}`);
    return sendError(error.message || 'Unknown server error');
  }
}

// ============================================
// Response Helpers
// ============================================

function sendSuccess(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendError(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'error', data: { error: message } }))
    .setMimeType(ContentService.MimeType.JSON);
}