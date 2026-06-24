/**
 * main.gs - API Entry Point (Web App)
 * ============================================
 * This file provides the doGet() and doPost() handlers
 * that are REQUIRED for your Google Apps Script Web App.
 * 
 * Deploy this project as a Web App, and the frontend
 * will connect via this file.
 * 
 * @author School Report System
 * @version 1.0
 */

// ============================================
// IMPORTANT: Set your Spreadsheet ID here
// ============================================
// To find your Spreadsheet ID:
// Open your Google Sheet > Look at the URL:
// https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
// Extract only the ID from this URL:
// https://docs.google.com/spreadsheets/d/1-zHGvgLyxhe2E3tUICqibSDqx4drNYYeIMEJcEZ1qF4/edit
const SPREADSHEET_ID = '1-zHGvgLyxhe2E3tUICqibSDqx4drNYYeIMEJcEZ1qF4';

// ============================================
// API Key for basic authentication
// ============================================
const API_KEYS = ['API_KEY_001'];

// ============================================
// HTTP GET Handler
// ============================================
function doGet(e) {
  return handleRequest(e);
}

// ============================================
// HTTP POST Handler
// ============================================
function doPost(e) {
  return handleRequest(e);
}

// ============================================
// Main Request Handler
// ============================================
function handleRequest(e) {
  const startTime = new Date().getTime();
  
  try {
    // Get parameters
    let params;
    if (e.postData && e.postData.contents) {
      // POST request - parse JSON body
      try {
        params = JSON.parse(e.postData.contents);
      } catch (parseError) {
        // If not JSON, fall back to parameters
        params = e.parameter;
      }
    } else {
      // GET request - use URL parameters
      params = e.parameter;
    }
    
    Logger.log(`📥 Request received: action=${params.action}, params=${JSON.stringify(params)}`);
    
    // Validate required params
    if (!params.action) {
      return sendError('Missing action parameter');
    }
    
    if (!params.schoolId || !params.apiKey) {
      return sendError('Missing authentication parameters');
    }
    
    // Verify API key
    if (!API_KEYS.includes(params.apiKey)) {
      return sendError('Invalid API key');
    }
    
    // Initialize SchoolManager
    const schoolManager = new SchoolManager(SPREADSHEET_ID);
    let result;
    
    // Route to appropriate handler based on action
    switch (params.action) {
      
      // ============================================
      // STUDENT ACTIONS
      // ============================================
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
        
      // ============================================
      // TEACHER ACTIONS
      // ============================================
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
        
      // ============================================
      // SUBJECT ACTIONS
      // ============================================
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
        
      // ============================================
      // CLASS ACTIONS
      // ============================================
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
        
      // ============================================
      // SCORE ACTIONS
      // ============================================
      case 'getStudentScores':
        result = schoolManager.getStudentScores(
          params.studentId || null,
          params.term || null
        );
        break;
        
      case 'saveScores':
        result = schoolManager.saveScores(params);
        break;
        
      // ============================================
      // CUMULATIVE ACTIONS
      // ============================================
      case 'getReportCard':
        result = schoolManager.getReportCard(params.studentId, params.term);
        break;
        
      case 'generateCumulativeReport':
        result = schoolManager.generateCumulativeReport(params.studentId);
        break;
        
      // ============================================
      // ATTENDANCE ACTIONS
      // ============================================
      case 'getAttendance':
        result = schoolManager.getAttendance(params.studentId, params.term);
        break;
        
      // ============================================
      // BEHAVIORAL ACTIONS
      // ============================================
      case 'getBehavioral':
        result = schoolManager.getBehavioral(params.studentId, params.term);
        break;
        
      // ============================================
      // COMMENT ACTIONS
      // ============================================
      case 'getComments':
        result = schoolManager.getComments(params.studentId, params.term);
        break;
        
      // ============================================
      // PIN ACTIONS
      // ============================================
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
        
      // ============================================
      // SETTINGS ACTIONS
      // ============================================
      case 'getSettings':
        result = schoolManager.getSettings();
        break;
        
      case 'updateSettings':
        result = schoolManager.updateSettings(params);
        break;
        
      // ============================================
      // TRANSCRIPT ACTIONS
      // ============================================
      case 'generateTranscript':
        result = schoolManager.generateTranscript(
          params.studentId,
          params.type || 'standard',
          params.options || {}
        );
        break;
        
      // ============================================
      // BROADSHEET ACTIONS
      // ============================================
      case 'generateBroadsheet':
        result = schoolManager.generateBroadsheet(
          params.class,
          params.term,
          params.type || 'full'
        );
        break;
        
      // ============================================
      // ANALYTICS ACTIONS
      // ============================================
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
        
      // ============================================
      // PROMOTION ACTIONS
      // ============================================
      case 'getPromotionStatus':
        result = schoolManager.getPromotionStatus(params.studentId);
        break;
        
      // ============================================
      // CALENDAR ACTIONS
      // ============================================
      case 'getAcademicCalendar':
        result = schoolManager.getAcademicCalendar();
        break;
        
      default:
        return sendError('Unknown action: ' + params.action);
    }
    
    const elapsed = new Date().getTime() - startTime;
    Logger.log(`✅ Action '${params.action}' completed in ${elapsed}ms`);
    
    return sendSuccess(result);
    
  } catch (error) {
    Logger.log(`❌ handleRequest Error: ${error.message}\n${error.stack}`);
    return sendError(error.message);
  }
}

// ============================================
// Response Helpers
// ============================================

function sendSuccess(data) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      data: data
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendError(message) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'error',
      data: {
        error: message
      }
    }))
    .setMimeType(ContentService.MimeType.JSON);
}