// SchoolManager.gs - Complete Manager Class
// ============================================

class SchoolManager {
  
  constructor(sheetId) {
    this.sheetId = sheetId;
    
    try {
      this.spreadsheet = SpreadsheetApp.openById(sheetId);
    } catch (error) {
      Logger.log('❌ Failed to open spreadsheet:', error.message);
      throw new Error('Cannot open spreadsheet with ID: ' + sheetId);
    }
    
    this.cache = {};
    this.cacheTime = 0;
    this.cacheDuration = 300;
    
    // Initialize ALL managers
    this.utils = new Utils(this);
    this.settingsManager = new SettingsManager(this);
    this.studentManager = new StudentManager(this);
    this.scoreManager = new ScoreManager(this);
    this.cumulativeManager = new CumulativeManager(this);
    this.behavioralManager = new BehavioralManager(this);
    this.commentManager = new CommentManager(this);
    this.pinManager = new PINManager(this);
    this.promotionManager = new PromotionManager(this);
    this.graduateTransferManager = new GraduateTransferManager(this);
    this.transcriptManager = new TranscriptManager(this);
    this.broadsheetManager = new BroadsheetManager(this);
    this.analyticsManager = new AnalyticsManager(this);
  }
  
  // ============================================
  // SETTINGS
  // ============================================
  
  getSettings() {
    return this.settingsManager.getSettings();
  }
  
  updateSettings(settings) {
    return this.settingsManager.updateSettings(settings);
  }
  
  // ============================================
  // STUDENTS
  // ============================================
  
  getStudents(className) {
    return this.studentManager.getStudents(className);
  }
  
  getStudent(studentId) {
    return this.studentManager.getStudent(studentId);
  }
  
  addStudent(data) {
    return this.studentManager.addStudent(data);
  }
  
  updateStudent(data) {
    return this.studentManager.updateStudent(data);
  }
  
  deleteStudent(studentId) {
    return this.studentManager.deleteStudent(studentId);
  }
  
  getStudentByPin(pin) {
    return this.studentManager.getStudentByPin(pin);
  }
  
  importStudents(students) {
    return this.studentManager.importStudents(students);
  }
  
  // ============================================
  // TEACHERS
  // ============================================
  
  getTeachers() {
    return this.utils.getSheetData('Teachers');
  }
  
  addTeacher(data) {
    const sheet = this.spreadsheet.getSheetByName('Teachers');
    const teachers = this.getTeachers();
    const nextId = teachers.length + 1;
    const teacherId = 'TCH' + String(nextId).padStart(3, '0');
    
    const row = [
      teacherId,
      data.fullName,
      data.email,
      data.phone || '',
      data.classAssigned || '',
      data.subjects || '',
      data.password || 'teacher123',
      data.role || 'teacher',
      data.isTutor || 'No'
    ];
    
    sheet.appendRow(row);
    return { success: true, teacherId, message: 'Teacher added successfully' };
  }

  // SchoolManager.gs - Add this method
// ============================================

/**
 * Delete a teacher (soft delete)
 * @param {string} teacherId - Teacher ID
 * @returns {Object} Result
 */
deleteTeacher(teacherId) {
    try {
        const sheet = this.spreadsheet.getSheetByName('Teachers');
        if (!sheet) {
            return { success: false, error: 'Teachers sheet not found' };
        }
        
        const allData = sheet.getDataRange().getValues();
        
        for (let i = 1; i < allData.length; i++) {
            if (allData[i][0] === teacherId) {
                // Delete the row
                sheet.deleteRow(i + 1);
                return { success: true, message: 'Teacher deleted successfully' };
            }
        }
        
        return { success: false, error: 'Teacher not found' };
        
    } catch (error) {
        Logger.log('❌ deleteTeacher Error:', error);
        return { success: false, error: error.message };
    }
}

// SchoolManager.gs - updateTeacher method
// ============================================

/**
 * Update a teacher
 * @param {Object} data - Teacher data with teacherId
 * @returns {Object} Result
 */
updateTeacher(data) {
    Logger.log('🔍 updateTeacher called with:', data);
    
    try {
        const sheet = this.spreadsheet.getSheetByName('Teachers');
        if (!sheet) {
            return { success: false, error: 'Teachers sheet not found' };
        }
        
        const allData = sheet.getDataRange().getValues();
        
        for (let i = 1; i < allData.length; i++) {
            if (allData[i][0] === data.teacherId) {
                Logger.log('✅ Found teacher at row', i + 1);
                
                // Build the row with all fields
                const row = [
                    data.teacherId,
                    data.fullName || allData[i][1],
                    data.email || allData[i][2],
                    data.phone || allData[i][3],
                    data.classAssigned || allData[i][4],
                    data.subjects || allData[i][5],
                    data.password || allData[i][6],
                    data.role || allData[i][7],
                    data.isTutor || allData[i][8]
                ];
                
                sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
                Logger.log('✅ Teacher updated successfully');
                return { success: true, message: 'Teacher updated successfully' };
            }
        }
        
        Logger.log('❌ Teacher not found:', data.teacherId);
        return { success: false, error: 'Teacher not found' };
        
    } catch (error) {
        Logger.log('❌ updateTeacher Error:', error);
        return { success: false, error: error.message };
    }
}

// SchoolManager.gs - Subject Methods
// ============================================

/**
 * Get all subjects
 * @param {string} className - Optional class filter
 * @returns {Array} List of subjects
 */
getSubjects(className) {
    const subjects = this.utils.getSheetData('Subjects');
    if (className) {
        return subjects.filter(s => s['Class'] === className);
    }
    return subjects;
}

/**
 * Add a new subject
 * @param {Object} data - Subject data
 * @returns {Object} Result
 */
addSubject(data) {
    try {
        Logger.log('🔍 addSubject called with:', data);
        
        const sheet = this.spreadsheet.getSheetByName('Subjects');
        if (!sheet) {
            return { success: false, error: 'Subjects sheet not found' };
        }
        
        const subjects = this.getSubjects();
        const nextId = subjects.length + 1;
        const subjectId = 'SUB' + String(nextId).padStart(3, '0');
        
        const row = [
            subjectId,
            data.subjectName,
            data.class,
            data.teacherId || ''
        ];
        
        sheet.appendRow(row);
        Logger.log('✅ Subject added:', subjectId);
        return { success: true, subjectId, message: 'Subject added successfully' };
        
    } catch (error) {
        Logger.log('❌ addSubject Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update a subject
 * @param {Object} data - Subject data with subjectId
 * @returns {Object} Result
 */
updateSubject(data) {
    try {
        Logger.log('🔍 updateSubject called with:', data);
        
        if (!data.subjectId) {
            return { success: false, error: 'Missing subjectId' };
        }
        
        const sheet = this.spreadsheet.getSheetByName('Subjects');
        if (!sheet) {
            return { success: false, error: 'Subjects sheet not found' };
        }
        
        const allData = sheet.getDataRange().getValues();
        
        for (let i = 1; i < allData.length; i++) {
            if (allData[i][0] === data.subjectId) {
                const row = [
                    data.subjectId,
                    data.subjectName || allData[i][1],
                    data.class || allData[i][2],
                    data.teacherId || allData[i][3]
                ];
                sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
                Logger.log('✅ Subject updated:', data.subjectId);
                return { success: true, message: 'Subject updated successfully' };
            }
        }
        
        Logger.log('❌ Subject not found:', data.subjectId);
        return { success: false, error: 'Subject not found' };
        
    } catch (error) {
        Logger.log('❌ updateSubject Error:', error);
        return { success: false, error: error.message };
    }
}

// SchoolManager.gs - Class Methods
// ============================================

/**
 * Get all classes
 * @returns {Array} List of classes
 */
getClasses() {
    return this.utils.getSheetData('Classes');
}

/**
 * Get a class by name
 * @param {string} className - Class name
 * @returns {Object} Class data
 */
getClass(className) {
    const classes = this.getClasses();
    return classes.find(c => c['Class Name'] === className);
}

/**
 * Add a new class
 * @param {Object} data - Class data
 * @returns {Object} Result
 */
addClass(data) {
    try {
        Logger.log('🔍 addClass called with:', data);
        
        const sheet = this.spreadsheet.getSheetByName('Classes');
        if (!sheet) {
            return { success: false, error: 'Classes sheet not found' };
        }
        
        const classes = this.getClasses();
        const nextId = classes.length + 1;
        const classId = 'CLS' + String(nextId).padStart(3, '0');
        
        const row = [
            classId,
            data.className,
            data.nextClass || '',
            data.promotionAvg || '50',
            data.minSubjectsPass || '5',
            'SCH001', // School ID - hardcoded for now
            data.isActive || 'Yes'
        ];
        
        sheet.appendRow(row);
        Logger.log('✅ Class added:', classId);
        return { success: true, classId, message: 'Class added successfully' };
        
    } catch (error) {
        Logger.log('❌ addClass Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update a class
 * @param {Object} data - Class data with classId
 * @returns {Object} Result
 */
updateClass(data) {
    try {
        Logger.log('🔍 updateClass called with:', data);
        
        if (!data.classId) {
            return { success: false, error: 'Missing classId' };
        }
        
        const sheet = this.spreadsheet.getSheetByName('Classes');
        if (!sheet) {
            return { success: false, error: 'Classes sheet not found' };
        }
        
        const allData = sheet.getDataRange().getValues();
        
        for (let i = 1; i < allData.length; i++) {
            if (allData[i][0] === data.classId) {
                const row = [
                    data.classId,
                    data.className || allData[i][1],
                    data.nextClass || allData[i][2],
                    data.promotionAvg || allData[i][3],
                    data.minSubjectsPass || allData[i][4],
                    allData[i][5], // School ID - keep existing
                    data.isActive || allData[i][6]
                ];
                sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
                Logger.log('✅ Class updated:', data.classId);
                return { success: true, message: 'Class updated successfully' };
            }
        }
        
        Logger.log('❌ Class not found:', data.classId);
        return { success: false, error: 'Class not found' };
        
    } catch (error) {
        Logger.log('❌ updateClass Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a class
 * @param {string} classId - Class ID
 * @returns {Object} Result
 */
deleteClass(classId) {
    try {
        Logger.log('🔍 deleteClass called for:', classId);
        
        const sheet = this.spreadsheet.getSheetByName('Classes');
        if (!sheet) {
            return { success: false, error: 'Classes sheet not found' };
        }
        
        const allData = sheet.getDataRange().getValues();
        
        for (let i = 1; i < allData.length; i++) {
            if (allData[i][0] === classId) {
                sheet.deleteRow(i + 1);
                Logger.log('✅ Class deleted:', classId);
                return { success: true, message: 'Class deleted successfully' };
            }
        }
        
        Logger.log('❌ Class not found:', classId);
        return { success: false, error: 'Class not found' };
        
    } catch (error) {
        Logger.log('❌ deleteClass Error:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Delete a subject
 * @param {string} subjectId - Subject ID
 * @returns {Object} Result
 */
deleteSubject(subjectId) {
    try {
        Logger.log('🔍 deleteSubject called for:', subjectId);
        
        const sheet = this.spreadsheet.getSheetByName('Subjects');
        if (!sheet) {
            return { success: false, error: 'Subjects sheet not found' };
        }
        
        const allData = sheet.getDataRange().getValues();
        
        for (let i = 1; i < allData.length; i++) {
            if (allData[i][0] === subjectId) {
                sheet.deleteRow(i + 1);
                Logger.log('✅ Subject deleted:', subjectId);
                return { success: true, message: 'Subject deleted successfully' };
            }
        }
        
        Logger.log('❌ Subject not found:', subjectId);
        return { success: false, error: 'Subject not found' };
        
    } catch (error) {
        Logger.log('❌ deleteSubject Error:', error);
        return { success: false, error: error.message };
    }
}
  
  // ============================================
  // SCORES
  // ============================================
  
  getStudentScores(studentId, term) {
    return this.scoreManager.getStudentScores(studentId, term);
  }
  
  saveScores(data) {
    return this.scoreManager.saveScores(data);
  }
  
  batchSaveScores(scoresData) {
    return this.scoreManager.batchSaveScores(scoresData);
  }
  
  // ============================================
  // CUMULATIVE
  // ============================================
  
  calculateCumulative(studentId, subjectId) {
    return this.cumulativeManager.calculateCumulative(studentId, subjectId);
  }
  
  calculateStudentAverage(studentId, term) {
    return this.cumulativeManager.calculateStudentAverage(studentId, term);
  }
  
  calculateCumulativeStudentAverage(studentId) {
    return this.cumulativeManager.calculateCumulativeStudentAverage(studentId);
  }
  
  // ============================================
  // ATTENDANCE
  // ============================================
  
  getAttendance(studentId, term) {
    const data = this.utils.getSheetData('Attendance');
    return data.find(a => a['Student ID'] === studentId && a['Term'] === 'Term' + term);
  }
  
  saveAttendance(data) {
    const { studentId, term, timesOpened, timesPresent } = data;
    const sheet = this.spreadsheet.getSheetByName('Attendance');
    const termStr = 'Term' + term;
    
    if (!sheet) {
      return { success: false, error: 'Attendance sheet not found' };
    }
    
    const percentage = (Number(timesPresent) / Number(timesOpened)) * 100;
    const formattedPercentage = Math.round(percentage * 100) / 100;
    
    const allData = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === studentId && allData[i][1] === termStr) {
        rowIndex = i + 1;
        break;
      }
    }
    
    const row = [
      studentId,
      termStr,
      Number(timesOpened),
      Number(timesPresent),
      formattedPercentage,
      new Date().toISOString().split('T')[0]
    ];
    
    if (rowIndex === -1) {
      sheet.appendRow(row);
    } else {
      sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    }
    
    return { success: true, message: 'Attendance saved', percentage: formattedPercentage };
  }
  
  // ============================================
  // BEHAVIORAL
  // ============================================
  
  getBehavioral(studentId, term) {
    return this.behavioralManager.getBehavioralScores(studentId, term);
  }
  
  saveBehavioral(data) {
    return this.behavioralManager.saveBehavioralScores(data);
  }
  
  getBehavioralDomains(term) {
    return this.behavioralManager.getDomains(term);
  }
  
  // ============================================
  // COMMENTS
  // ============================================
  
  getComments(studentId, term) {
    return this.commentManager.getComments(studentId, term);
  }
  
  saveComment(data) {
    return this.commentManager.saveComment(data);
  }
  
  getHeadTeacherComment(average) {
    return this.commentManager.getHeadTeacherComment(average);
  }
  
  // ============================================
  // PIN
  // ============================================
  
  validatePin(pin, className) {
    return this.pinManager.validatePin(pin, className);
  }
  
  generatePins(className, term) {
    return this.pinManager.generatePins(className, term);
  }
  
  revokePin(studentId) {
    return this.pinManager.revokePin(studentId);
  }
  
  getPinStatus(className) {
    return this.pinManager.getPinStatus(className);
  }
  
  // ============================================
  // PROMOTION
  // ============================================
  
  getPromotionStatus(studentId) {
    return this.promotionManager.getPromotionStatus(studentId);
  }
  
  promoteStudent(studentId) {
    return this.promotionManager.promoteStudent(studentId);
  }
  
  bulkPromote(className) {
    return this.promotionManager.bulkPromote(className);
  }
  
  // ============================================
  // TRANSCRIPT
  // ============================================
  
  generateTranscript(studentId, type, options) {
    return this.transcriptManager.generateTranscript(studentId, type, options);
  }
  
  // ============================================
  // BROADSHEET
  // ============================================
  
  generateBroadsheet(className, term, type) {
    return this.broadsheetManager.generateBroadsheet(className, term, type);
  }
  
  // ============================================
  // ANALYTICS
  // ============================================
  
  getClassAnalysis(className, term) {
    return this.analyticsManager.getClassAnalysis(className, term);
  }
  
  getStudentAnalysis(studentId) {
    return this.analyticsManager.getStudentAnalysis(studentId);
  }
  
  getSchoolAnalysis(term) {
    return this.analyticsManager.getSchoolAnalysis(term);
  }
  
  getTeacherAnalysis(teacherId) {
    return this.analyticsManager.getTeacherAnalysis(teacherId);
  }
  
  // ============================================
  // GRADUATE/TRANSFER
  // ============================================
  
  getGraduates(academicYear) {
    return this.graduateTransferManager.getGraduates(academicYear);
  }
  
  getTransfers(academicYear) {
    return this.graduateTransferManager.getTransfers(academicYear);
  }
  
  markGraduated(studentId, className, graduationDate) {
    return this.graduateTransferManager.markGraduated(studentId, className, graduationDate);
  }
  
  markTransferred(studentId, toSchool, transferDate) {
    return this.graduateTransferManager.markTransferred(studentId, toSchool, transferDate);
  }

  
  
  // ============================================
  // ACADEMIC CALENDAR
  // ============================================
  
  getAcademicCalendar() {
    return this.utils.getSheetData('AcademicCalendar');
  }

  // ============================================
// REPORT CARD METHODS
// ============================================

/**
 * Get report card for a student
 * @param {string} studentId - Student ID
 * @param {string} term - Term (1, 2, 3)
 * @returns {Object} Report card data
 */
getReportCard(studentId, term) {
    // Use the cumulative manager to get report data
    return this.cumulativeManager.generateReportCard(studentId, term);
}

/**
 * Generate cumulative report for a student
 * @param {string} studentId - Student ID
 * @returns {Object} Cumulative report data
 */
generateCumulativeReport(studentId) {
    return this.cumulativeManager.generateCumulativeReport(studentId);
}

}