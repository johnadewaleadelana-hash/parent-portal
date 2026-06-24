// TranscriptManager.gs - Transcript Operations (Basic)
// ============================================

class TranscriptManager {
  
  constructor(schoolManager) {
    this.schoolManager = schoolManager;
    this.spreadsheet = schoolManager.spreadsheet;
    this.utils = schoolManager.utils;
  }
  
  /**
   * Generate a transcript for a student
   * @param {string} studentId - Student ID
   * @param {string} type - transcript type (standard, cumulative, transfer, graduation)
   * @param {Object} options - Additional options
   * @returns {Object} Transcript data
   */
  generateTranscript(studentId, type = 'standard', options = {}) {
    try {
      const student = this.schoolManager.getStudent(studentId);
      if (!student) {
        return { error: 'Student not found' };
      }
      
      const settings = this.schoolManager.getSettings();
      const subjects = this.schoolManager.getSubjects(student['Class']);
      
      let transcriptData = {
        student: student,
        settings: settings,
        generated: new Date().toISOString(),
        type: type,
        year: settings['Academic_Year'] || '2024/2025'
      };
      
      // Get term scores
      if (type === 'standard' || type === 'cumulative') {
        const term1 = this.getTermScores(studentId, 1);
        const term2 = this.getTermScores(studentId, 2);
        const term3 = this.getTermScores(studentId, 3);
        
        transcriptData.terms = {
          term1: term1,
          term2: term2,
          term3: term3
        };
        
        // Calculate averages
        transcriptData.averages = {
          term1: this.calculateTermAverage(term1),
          term2: this.calculateTermAverage(term2),
          term3: this.calculateTermAverage(term3),
          cumulative: this.schoolManager.calculateCumulativeStudentAverage(studentId)
        };
        
        // Calculate overall
        const cumulativeAvg = transcriptData.averages.cumulative;
        transcriptData.overall = {
          average: cumulativeAvg,
          grade: this.schoolManager.scoreManager.calculateGrade(cumulativeAvg),
          remark: this.schoolManager.scoreManager.calculateRemark(cumulativeAvg),
          gpa: this.utils.calculateGPA(cumulativeAvg)
        };
      }
      
      // Get attendance
      if (settings['Include_Attendance'] === 'Yes') {
        transcriptData.attendance = {
          term1: this.schoolManager.getAttendance(studentId, 1),
          term2: this.schoolManager.getAttendance(studentId, 2),
          term3: this.schoolManager.getAttendance(studentId, 3)
        };
      }
      
      // Get comments
      if (settings['Include_Comments'] === 'Yes') {
        transcriptData.comments = {
          tutor: this.schoolManager.commentManager.getCommentsByType(studentId, 'Term3'),
          headTeacher: this.schoolManager.commentManager.getHeadTeacherComment(
            transcriptData.overall ? transcriptData.overall.average : 0          )
        };
      }
      
      return transcriptData;
      
    } catch (error) {
      Logger.log('generateTranscript Error:', error);
      return { error: error.message };
    }
  }
  
  /**
   * Get scores for a specific term
   */
  getTermScores(studentId, term) {
    const scores = this.schoolManager.getStudentScores(studentId, term);
    const result = {};
    
    for (const score of scores) {
      const subjectId = score['Subject ID'];
      const subject = this.schoolManager.getSubjects().find(s => s['Subject ID'] === subjectId);
      result[subjectId] = {
        subjectName: subject ? subject['Subject Name'] : subjectId,
        ca1: Number(score['CA1']),
        ca2: Number(score['CA2']),
        exam: Number(score['Exam']),
        total: Number(score['Total']),
        grade: score['Grade'],
        remark: score['Remark'],
        comment: score['Comment'] || ''
      };
    }
    
    return result;
  }
  
  /**
   * Calculate average for a term
   */
  calculateTermAverage(scores) {
    const totals = Object.values(scores).map(s => s.total).filter(t => t > 0);
    if (totals.length === 0) return 0;
    const sum = totals.reduce((a, b) => a + b, 0);
    return Math.round((sum / totals.length) * 100) / 100;
  }
}