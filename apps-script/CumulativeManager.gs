// CumulativeManager.gs - Cumulative Calculations
// ============================================

class CumulativeManager {
  
  constructor(schoolManager) {
    this.schoolManager = schoolManager;
    this.spreadsheet = schoolManager.spreadsheet;
    this.utils = schoolManager.utils;
  }
  
  /**
   * Calculate cumulative score for a student in a subject
   * Formula: ((Term1 Total + Term2 Total) / 2) * 0.3 + (Term3 Total * 0.7)
   */
  calculateCumulative(studentId, subjectId) {
    try {
      const t1 = this.schoolManager.getStudentScores(studentId, 1)
        .find(s => s['Subject ID'] === subjectId);
      const t2 = this.schoolManager.getStudentScores(studentId, 2)
        .find(s => s['Subject ID'] === subjectId);
      const t3 = this.schoolManager.getStudentScores(studentId, 3)
        .find(s => s['Subject ID'] === subjectId);
      
      const t1Total = t1 && t1['Total'] ? Number(t1['Total']) : null;
      const t2Total = t2 && t2['Total'] ? Number(t2['Total']) : null;
      const t3Total = t3 && t3['Total'] ? Number(t3['Total']) : null;
      
      // Only calculate if we have all three terms
      if (t1Total !== null && t2Total !== null && t3Total !== null) {
        const cumulative = ((t1Total + t2Total) / 2) * 0.3 + (t3Total * 0.7);
        return Math.round(cumulative * 100) / 100;
      }
      
      // If only Term 3 exists, just return Term 3 total
      if (t3Total !== null) {
        return t3Total;
      }
      
      return null;
    } catch (error) {
      Logger.log('calculateCumulative Error:', error);
      return null;
    }
  }
  
  /**
   * Calculate average score for a student in a specific term
   */
  calculateStudentAverage(studentId, term) {
    try {
      const scores = this.schoolManager.scoreManager.getStudentScores(studentId, term);
      if (scores.length === 0) return 0;
      
      let total = 0;
      let count = 0;
      for (const score of scores) {
        if (score['Total'] && Number(score['Total']) > 0) {
          total += Number(score['Total']);
          count++;
        }
      }
      return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
    } catch (error) {
      Logger.log('calculateStudentAverage Error:', error);
      return 0;
    }
  }
  
  /**
   * Calculate cumulative average across all terms
   */
  calculateCumulativeStudentAverage(studentId) {
    try {
      const student = this.schoolManager.getStudent(studentId);
      if (!student) return 0;
      
      const subjects = this.schoolManager.getSubjects(student['Class']);
      let total = 0;
      let count = 0;
      
      for (const subject of subjects) {
        const cumulative = this.calculateCumulative(studentId, subject['Subject ID']);
        if (cumulative !== null) {
          total += cumulative;
          count++;
        }
      }
      
      return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
    } catch (error) {
      Logger.log('calculateCumulativeStudentAverage Error:', error);
      return 0;
    }
  }
  
  /**
   * Update cumulative score for a student in Scores_Term3 sheet
   * Called after saving scores for Term 3
   */
  updateCumulativeScore(studentId, subjectId) {
    try {
      Logger.log(`🔄 Updating cumulative for student: ${studentId}, subject: ${subjectId}`);
      
      const cumulative = this.calculateCumulative(studentId, subjectId);
      if (cumulative === null) {
        Logger.log('⚠️ Cannot calculate cumulative - missing term data');
        return null;
      }
      
      // Get Term 1 and Term 2 totals for reference
      const t1 = this.schoolManager.getStudentScores(studentId, 1)
        .find(s => s['Subject ID'] === subjectId);
      const t2 = this.schoolManager.getStudentScores(studentId, 2)
        .find(s => s['Subject ID'] === subjectId);
      
      const t1Total = t1 && t1['Total'] ? Number(t1['Total']) : 0;
      const t2Total = t2 && t2['Total'] ? Number(t2['Total']) : 0;
      
      // Update the Term 3 sheet with cumulative data
      const sheet = this.spreadsheet.getSheetByName('Scores_Term3');
      if (!sheet) {
        Logger.log('❌ Scores_Term3 sheet not found');
        return null;
      }
      
      const allData = sheet.getDataRange().getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === studentId && allData[i][1] === subjectId) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex === -1) {
        Logger.log('⚠️ No existing row found for cumulative update');
        return null;
      }
      
      // Update the cumulative columns (columns 9, 10, 11 = Cumulative, Grade, Remark)
      const grade = this.schoolManager.scoreManager.calculateGrade(cumulative);
      const remark = this.schoolManager.scoreManager.calculateRemark(cumulative);
      
      // Update Term1 Total (col 7), Term2 Total (col 8), Cumulative (col 9), Grade (col 10), Remark (col 11)
      sheet.getRange(rowIndex, 7, 1, 5).setValues([[
        t1Total,
        t2Total,
        cumulative,
        grade,
        remark
      ]]);
      
      Logger.log(`✅ Cumulative updated: ${cumulative} (Grade: ${grade})`);
      return cumulative;
      
    } catch (error) {
      Logger.log('❌ updateCumulativeScore Error:', error);
      return null;
    }
  }

  // ============================================
// REPORT CARD GENERATION
// ============================================

/**
 * Generate report card for a student
 */
generateReportCard(studentId, term) {
    try {
        const student = this.schoolManager.getStudent(studentId);
        if (!student) {
            return { error: 'Student not found' };
        }
        
        const scores = this.schoolManager.getStudentScores(studentId, term);
        const subjects = this.schoolManager.getSubjects(student['Class']);
        const attendance = this.schoolManager.getAttendance(studentId, term);
        const behavioral = this.schoolManager.getBehavioral(studentId, term);
        const comments = this.schoolManager.getComments(studentId, term);
        const settings = this.schoolManager.getSettings();
        
        // Build score data
        const scoreData = [];
        let total = 0;
        let count = 0;
        
        for (const subject of subjects) {
            const score = scores.find(s => s['Subject ID'] === subject['Subject ID']);
            if (score && score['Total']) {
                const totalScore = Number(score['Total']);
                total += totalScore;
                count++;
                scoreData.push({
                    subject: subject['Subject Name'],
                    ca1: Number(score['CA1']) || 0,
                    ca2: Number(score['CA2']) || 0,
                    exam: Number(score['Exam']) || 0,
                    total: totalScore,
                    grade: score['Grade'] || this.schoolManager.scoreManager.calculateGrade(totalScore),
                    remark: score['Remark'] || this.schoolManager.scoreManager.calculateRemark(totalScore),
                    comment: score['Comment'] || ''
                });
            }
        }
        
        const average = count > 0 ? Math.round((total / count) * 100) / 100 : 0;
        const gpa = this.utils.calculateGPA(average);
        
        return {
            student: student,
            scores: scoreData,
            average: average,
            grade: this.schoolManager.scoreManager.calculateGrade(average),
            remark: this.schoolManager.scoreManager.calculateRemark(average),
            gpa: gpa,
            attendance: attendance || { 'Times School Opened': 0, 'Times Present': 0 },
            behavioral: behavioral || [],
            comments: comments || {},
            settings: settings,
            term: term
        };
        
    } catch (error) {
        Logger.log('generateReportCard Error:', error);
        return { error: error.message };
    }
}

/**
 * Generate cumulative report for a student
 */
generateCumulativeReport(studentId) {
    try {
        const student = this.schoolManager.getStudent(studentId);
        if (!student) {
            return { error: 'Student not found' };
        }
        
        const subjects = this.schoolManager.getSubjects(student['Class']);
        const scoreData = [];
        let total = 0;
        let count = 0;
        
        for (const subject of subjects) {
            const t1 = this.schoolManager.getStudentScores(studentId, 1).find(s => s['Subject ID'] === subject['Subject ID']);
            const t2 = this.schoolManager.getStudentScores(studentId, 2).find(s => s['Subject ID'] === subject['Subject ID']);
            const t3 = this.schoolManager.getStudentScores(studentId, 3).find(s => s['Subject ID'] === subject['Subject ID']);
            
            const t1Total = t1 && t1['Total'] ? Number(t1['Total']) : null;
            const t2Total = t2 && t2['Total'] ? Number(t2['Total']) : null;
            const t3Total = t3 && t3['Total'] ? Number(t3['Total']) : null;
            
            let cumulative = null;
            let grade = null;
            let remark = null;
            
            // Calculate cumulative only if all terms exist
            if (t1Total !== null && t2Total !== null && t3Total !== null) {
                cumulative = ((t1Total + t2Total) / 2) * 0.3 + (t3Total * 0.7);
                cumulative = Math.round(cumulative * 100) / 100;
                grade = this.schoolManager.scoreManager.calculateGrade(cumulative);
                remark = this.schoolManager.scoreManager.calculateRemark(cumulative);
                total += cumulative;
                count++;
            }
            
            scoreData.push({
                subject: subject['Subject Name'],
                term1: t1Total,
                term2: t2Total,
                term3: t3Total,
                cumulative: cumulative,
                grade: grade,
                remark: remark,
                comment: t3 && t3['Comment'] ? t3['Comment'] : ''
            });
        }
        
        const average = count > 0 ? Math.round((total / count) * 100) / 100 : 0;
        const gpa = this.utils.calculateGPA(average);
        
        // Get attendance
        const attendance = {
            term1: this.schoolManager.getAttendance(studentId, 1),
            term2: this.schoolManager.getAttendance(studentId, 2),
            term3: this.schoolManager.getAttendance(studentId, 3)
        };
        
        // Get behavioral
        const behavioral = {
            term1: this.schoolManager.getBehavioral(studentId, 1),
            term2: this.schoolManager.getBehavioral(studentId, 2),
            term3: this.schoolManager.getBehavioral(studentId, 3)
        };
        
        // Get comments
        const comments = {
            term1: this.schoolManager.getComments(studentId, 1),
            term2: this.schoolManager.getComments(studentId, 2),
            term3: this.schoolManager.getComments(studentId, 3)
        };
        
        // Get promotion status
        const promotion = this.schoolManager.getPromotionStatus(studentId);
        
        const settings = this.schoolManager.getSettings();
        
        return {
            student: student,
            scores: scoreData,
            average: average,
            grade: this.schoolManager.scoreManager.calculateGrade(average),
            remark: this.schoolManager.scoreManager.calculateRemark(average),
            gpa: gpa,
            headTeacherComment: this.schoolManager.getHeadTeacherComment(average),
            attendance: attendance,
            behavioral: behavioral,
            comments: comments,
            promotion: promotion,
            settings: settings,
            classAverage: this.calculateClassAverage(student['Class']),
            totalSubjects: subjects.length
        };
        
    } catch (error) {
        Logger.log('generateCumulativeReport Error:', error);
        return { error: error.message };
    }
}

/**
 * Calculate class average
 */
calculateClassAverage(className) {
    try {
        const students = this.schoolManager.getStudents(className);
        let total = 0;
        let count = 0;
        
        for (const student of students) {
            const avg = this.calculateCumulativeStudentAverage(student['Student ID']);
            if (avg > 0) {
                total += avg;
                count++;
            }
        }
        
        return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
    } catch (error) {
        Logger.log('calculateClassAverage Error:', error);
        return 0;
    }
}
}