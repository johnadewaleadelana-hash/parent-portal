// GraduateTransferManager.gs - Graduate and Transfer Operations
// ============================================

class GraduateTransferManager {
  
  constructor(schoolManager) {
    this.schoolManager = schoolManager;
    this.spreadsheet = schoolManager.spreadsheet;
    this.utils = schoolManager.utils;
  }
  
  /**
   * Mark a student as graduated
   * @param {string} studentId - Student ID
   * @param {string} className - Graduation class
   * @param {string} graduationDate - Graduation date
   * @returns {Object} Result
   */
  markGraduated(studentId, className, graduationDate) {
    try {
      const student = this.schoolManager.getStudent(studentId);
      if (!student) {
        return { success: false, error: 'Student not found' };
      }
      
      const average = this.schoolManager.calculateCumulativeStudentAverage(studentId);
      const grade = this.schoolManager.scoreManager.calculateGrade(average);
      const gpa = this.utils.calculateGPA(average);
      const settings = this.schoolManager.getSettings();
      const academicYear = settings['Academic_Year'] || '2024/2025';
      
      const now = graduationDate || new Date().toISOString().split('T')[0];
      
      // Add to graduate records
      const sheet = this.spreadsheet.getSheetByName('GraduateRecords');
      if (!sheet) {
        return { success: false, error: 'GraduateRecords sheet not found' };
      }
      
      sheet.appendRow([
        studentId,
        student['Full Name'],
        className || student['Class'],
        now,
        academicYear,
        average,
        grade,
        gpa,
        'No',
        '',
        'No'
      ]);
      
      // Update student status
      this.updateStudentStatus(studentId, 'Graduated');
      
      return {
        success: true,
        message: `Student ${student['Full Name']} marked as graduated`,
        average: average,
        grade: grade,
        gpa: gpa
      };
      
    } catch (error) {
      Logger.log('markGraduated Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Mark a student as transferred
   * @param {string} studentId - Student ID
   * @param {string} toSchool - Receiving school
   * @param {string} transferDate - Transfer date
   * @returns {Object} Result
   */
  markTransferred(studentId, toSchool, transferDate) {
    try {
      const student = this.schoolManager.getStudent(studentId);
      if (!student) {
        return { success: false, error: 'Student not found' };
      }
      
      const now = transferDate || new Date().toISOString().split('T')[0];
      
      // Add to transfer records
      const sheet = this.spreadsheet.getSheetByName('TransferRecords');
      if (!sheet) {
        return { success: false, error: 'TransferRecords sheet not found' };
      }
      
      sheet.appendRow([
        studentId,
        student['Full Name'],
        now,
        student['Class'],
        toSchool || '',
        '',
        '',
        'No',
        'No',
        ''
      ]);
      
      // Update student status
      this.updateStudentStatus(studentId, 'Transferred');
      
      return {
        success: true,
        message: `Student ${student['Full Name']} marked as transferred to ${toSchool || 'another school'}`
      };
      
    } catch (error) {
      Logger.log('markTransferred Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update student status
   * @param {string} studentId - Student ID
   * @param {string} status - New status
   */
  updateStudentStatus(studentId, status) {
    try {
      const sheet = this.spreadsheet.getSheetByName('Students');
      if (!sheet) return;
      
      const allData = sheet.getDataRange().getValues();
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === studentId) {
          sheet.getRange(i + 1, 7).setValue(status);
          break;
        }
      }
    } catch (error) {
      Logger.log('updateStudentStatus Error:', error);
    }
  }
  
  /**
   * Get all graduates
   * @param {string} academicYear - Optional academic year filter
   * @returns {Array} Graduates
   */
  getGraduates(academicYear) {
    try {
      const graduates = this.utils.getSheetData('GraduateRecords');
      if (academicYear) {
        return graduates.filter(g => g['Academic Year'] === academicYear);
      }
      return graduates;
    } catch (error) {
      Logger.log('getGraduates Error:', error);
      return [];
    }
  }
  
  /**
   * Get all transfers
   * @param {string} academicYear - Optional academic year filter
   * @returns {Array} Transfers
   */
  getTransfers(academicYear) {
    try {
      const transfers = this.utils.getSheetData('TransferRecords');
      if (academicYear) {
        // Filter by date if needed
        return transfers;
      }
      return transfers;
    } catch (error) {
      Logger.log('getTransfers Error:', error);
      return [];
    }
  }
  
  /**
   * Generate transcript for graduate (stub - full implementation in TranscriptManager)
   */
  generateGraduateTranscript(studentId) {
    return { success: true, message: 'Transcript generated (stub)' };
  }
}