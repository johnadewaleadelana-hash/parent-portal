// PromotionManager.gs - Promotion Operations
// ============================================

class PromotionManager {
  
  constructor(schoolManager) {
    this.schoolManager = schoolManager;
    this.spreadsheet = schoolManager.spreadsheet;
    this.utils = schoolManager.utils;
  }
  
  /**
   * Get promotion status for a student
   * @param {string} studentId - Student ID
   * @returns {Object} Promotion status
   */
  getPromotionStatus(studentId) {
    try {
      const student = this.schoolManager.getStudent(studentId);
      if (!student) {
        return { error: 'Student not found' };
      }
      
      const currentClass = student['Class'];
      const classData = this.schoolManager.getClass(currentClass);
      
      if (!classData) {
        return {
          currentClass: currentClass,
          promoted: false,
          message: 'No promotion rules found for this class'
        };
      }
      
      // Calculate cumulative average
      const average = this.schoolManager.calculateCumulativeStudentAverage(studentId);
      
      // Count passed subjects
      const subjects = this.schoolManager.getSubjects(currentClass);
      let passedSubjects = 0;
      let totalSubjects = subjects.length;
      
      for (const subject of subjects) {
        const cumulative = this.schoolManager.calculateCumulative(studentId, subject['Subject ID']);
        if (cumulative !== null && cumulative >= 40) {
          passedSubjects++;
        }
      }
      
      // Check promotion criteria
      const minAverage = Number(classData['Promotion Average']) || 50;
      const minPass = Number(classData['Min Subjects Pass']) || 5;
      
      const isPromoted = average >= minAverage && passedSubjects >= minPass;
      const nextClass = isPromoted ? classData['Next Class'] : null;
      
      return {
        studentId: studentId,
        studentName: student['Full Name'],
        currentClass: currentClass,
        nextClass: nextClass,
        average: average,
        passedSubjects: passedSubjects,
        totalSubjects: totalSubjects,
        minAverage: minAverage,
        minPass: minPass,
        promoted: isPromoted,
        message: isPromoted ? `Promoted to ${nextClass}` : 'Not promoted',
        criteria: {
          averageMet: average >= minAverage,
          subjectsPassedMet: passedSubjects >= minPass
        }
      };
      
    } catch (error) {
      Logger.log('getPromotionStatus Error:', error);
      return { error: error.message };
    }
  }
  
  /**
   * Promote a single student
   * @param {string} studentId - Student ID
   * @returns {Object} Result
   */
  promoteStudent(studentId) {
    try {
      const status = this.getPromotionStatus(studentId);
      
      if (status.error) {
        return { success: false, error: status.error };
      }
      
      if (!status.promoted) {
        return { 
          success: false, 
          error: status.message,
          details: status
        };
      }
      
      // Update student record
      const sheet = this.spreadsheet.getSheetByName('Students');
      const allData = sheet.getDataRange().getValues();
      
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === studentId) {
          const now = new Date().toISOString().split('T')[0];
          sheet.getRange(i + 1, 3).setValue(status.nextClass); // Class
          sheet.getRange(i + 1, 8).setValue(status.nextClass); // Current Class
          break;
        }
      }
      
      // Log promotion
      this.logPromotion(studentId, status.currentClass, status.nextClass);
      
      return {
        success: true,
        message: `Student promoted from ${status.currentClass} to ${status.nextClass}`,
        fromClass: status.currentClass,
        toClass: status.nextClass,
        average: status.average
      };
      
    } catch (error) {
      Logger.log('promoteStudent Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Bulk promote students in a class
   * @param {string} className - Class name
   * @returns {Object} Result
   */
  bulkPromote(className) {
    try {
      const students = this.schoolManager.getStudents(className);
      if (students.length === 0) {
        return { success: false, error: 'No students found in this class' };
      }
      
      const results = [];
      let promoted = 0;
      let failed = 0;
      
      for (const student of students) {
        const result = this.promoteStudent(student['Student ID']);
        results.push({
          studentId: student['Student ID'],
          name: student['Full Name'],
          success: result.success,
          message: result.message || result.error
        });
        
        if (result.success) {
          promoted++;
        } else {
          failed++;
        }
      }
      
      return {
        success: true,
        total: students.length,
        promoted: promoted,
        failed: failed,
        results: results,
        message: `Promoted ${promoted} students, ${failed} failed`
      };
      
    } catch (error) {
      Logger.log('bulkPromote Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Log promotion to history
   * @param {string} studentId - Student ID
   * @param {string} fromClass - From class
   * @param {string} toClass - To class
   */
  logPromotion(studentId, fromClass, toClass) {
    try {
      const sheet = this.spreadsheet.getSheetByName('PromotionHistory');
      if (!sheet) return;
      
      const now = new Date().toISOString().split('T')[0];
      const settings = this.schoolManager.getSettings();
      const academicYear = settings['Academic_Year'] || '2024/2025';
      
      sheet.appendRow([
        studentId,
        fromClass,
        toClass,
        now,
        academicYear
      ]);
      
    } catch (error) {
      Logger.log('logPromotion Error:', error);
    }
  }
  
  /**
   * Get promotion history for a student
   * @param {string} studentId - Student ID
   * @returns {Array} Promotion history
   */
  getPromotionHistory(studentId) {
    try {
      const history = this.utils.getSheetData('PromotionHistory');
      return history.filter(h => h['Student ID'] === studentId);
    } catch (error) {
      Logger.log('getPromotionHistory Error:', error);
      return [];
    }
  }
}