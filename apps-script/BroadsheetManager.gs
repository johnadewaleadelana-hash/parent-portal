// BroadsheetManager.gs - Broadsheet Operations (Basic)
// ============================================

class BroadsheetManager {
  
  constructor(schoolManager) {
    this.schoolManager = schoolManager;
    this.spreadsheet = schoolManager.spreadsheet;
    this.utils = schoolManager.utils;
  }
  
  /**
   * Generate a broadsheet
   * @param {string} className - Class name
   * @param {string} term - Term
   * @param {string} type - broadsheet type (full, subject, summary)
   * @returns {Object} Broadsheet data
   */
  generateBroadsheet(className, term, type = 'full') {
    try {
      const students = this.schoolManager.getStudents(className);
      if (students.length === 0) {
        return { error: 'No students found in this class' };
      }
      
      const subjects = this.schoolManager.getSubjects(className);
      const settings = this.schoolManager.getSettings();
      
      let broadsheet = {
        className: className,
        term: 'Term' + term,
        academicYear: settings['Academic_Year'] || '2024/2025',
        generated: new Date().toISOString(),
        students: [],
        summary: {
          totalStudents: students.length,
          subjectAverages: {},
          overallAverage: 0,
          passRate: 0,
          distinctionCount: 0
        }
      };
      
      // Build student data
      for (const student of students) {
        const scores = this.schoolManager.getStudentScores(student['Student ID'], term);
        const studentData = {
          id: student['Student ID'],
          name: student['Full Name'],
          subjects: {}
        };
        
        let totalScore = 0;
        let subjectCount = 0;
        
        for (const subject of subjects) {
          const score = scores.find(s => s['Subject ID'] === subject['Subject ID']);
          const scoreData = {
            ca1: score ? Number(score['CA1']) : 0,
            ca2: score ? Number(score['CA2']) : 0,
            exam: score ? Number(score['Exam']) : 0,
            total: score ? Number(score['Total']) : 0,
            grade: score ? score['Grade'] : '-',
            remark: score ? score['Remark'] : '-'
          };
          
          studentData.subjects[subject['Subject ID']] = scoreData;
          
          if (scoreData.total > 0) {
            totalScore += scoreData.total;
            subjectCount++;
          }
        }
        
        studentData.average = subjectCount > 0 ? Math.round((totalScore / subjectCount) * 100) / 100 : 0;
        studentData.grade = this.schoolManager.scoreManager.calculateGrade(studentData.average);
        studentData.remark = this.schoolManager.scoreManager.calculateRemark(studentData.average);
        studentData.gpa = this.utils.calculateGPA(studentData.average);
        
        broadsheet.students.push(studentData);
      }
      
      // Calculate summary
      let overallTotal = 0;
      let passCount = 0;
      let distinctionCount = 0;
      
      for (const student of broadsheet.students) {
        overallTotal += student.average;
        if (student.average >= 40) passCount++;
        if (student.average >= 70) distinctionCount++;
      }
      
      const totalStudents = broadsheet.students.length;
      broadsheet.summary.overallAverage = totalStudents > 0 ? Math.round((overallTotal / totalStudents) * 100) / 100 : 0;
      broadsheet.summary.passRate = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;
      broadsheet.summary.distinctionCount = distinctionCount;
      
      // Calculate subject averages
      for (const subject of subjects) {
        let subjectTotal = 0;
        let subjectCount = 0;
        for (const student of broadsheet.students) {
          if (student.subjects[subject['Subject ID']]) {
            subjectTotal += student.subjects[subject['Subject ID']].total;
            subjectCount++;
          }
        }
        broadsheet.summary.subjectAverages[subject['Subject ID']] = subjectCount > 0 ? Math.round((subjectTotal / subjectCount) * 100) / 100 : 0;
      }
      
      // Rank students
      broadsheet.students.sort((a, b) => b.average - a.average);
      broadsheet.students.forEach((student, index) => {
        student.rank = index + 1;
      });
      
      return broadsheet;
      
    } catch (error) {
      Logger.log('generateBroadsheet Error:', error);
      return { error: error.message };
    }
  }
}