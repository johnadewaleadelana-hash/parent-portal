// AnalyticsManager.gs - Analytics Operations (Basic)
// ============================================

class AnalyticsManager {
  
  constructor(schoolManager) {
    this.schoolManager = schoolManager;
    this.spreadsheet = schoolManager.spreadsheet;
    this.utils = schoolManager.utils;
  }
  
  /**
   * Get class analysis
   * @param {string} className - Class name
   * @param {string} term - Term
   * @returns {Object} Class analysis
   */
  getClassAnalysis(className, term) {
    try {
      const broadsheet = this.schoolManager.broadsheetManager.generateBroadsheet(className, term);
      if (broadsheet.error) {
        return { error: broadsheet.error };
      }
      
      const students = broadsheet.students;
      const subjects = this.schoolManager.getSubjects(className);
      
      // Grade distribution
      const gradeDistribution = {
        A: 0, B: 0, C: 0, D: 0, E: 0, F: 0
      };
      
      for (const student of students) {
        const grade = student.grade || 'F';
        if (gradeDistribution.hasOwnProperty(grade)) {
          gradeDistribution[grade]++;
        }
      }
      
      // Subject performance
      const subjectPerformance = {};
      for (const subject of subjects) {
        const subjectId = subject['Subject ID'];
        subjectPerformance[subjectId] = {
          name: subject['Subject Name'],
          average: broadsheet.summary.subjectAverages[subjectId] || 0,
          passCount: 0,
          distinctionCount: 0,
          failCount: 0
        };
        
        for (const student of students) {
          if (student.subjects[subjectId]) {
            const total = student.subjects[subjectId].total;
            if (total >= 40) {
              subjectPerformance[subjectId].passCount++;
              if (total >= 70) {
                subjectPerformance[subjectId].distinctionCount++;
              }
            } else if (total > 0) {
              subjectPerformance[subjectId].failCount++;
            }
          }
        }
      }
      
      return {
        className: className,
        term: term,
        totalStudents: students.length,
        average: broadsheet.summary.overallAverage,
        passRate: broadsheet.summary.passRate,
        distinctionCount: broadsheet.summary.distinctionCount,
        gradeDistribution: gradeDistribution,
        subjectPerformance: subjectPerformance,
        topPerformers: students.slice(0, 5).map(s => ({
          name: s.name,
          average: s.average,
          grade: s.grade
        })),
        bottomPerformers: students.slice(-3).reverse().map(s => ({
          name: s.name,
          average: s.average,
          grade: s.grade
        }))
      };
      
    } catch (error) {
      Logger.log('getClassAnalysis Error:', error);
      return { error: error.message };
    }
  }
  
  /**
   * Get school analysis
   * @param {string} term - Term
   * @returns {Object} School analysis
   */
  getSchoolAnalysis(term) {
    try {
      const classes = this.schoolManager.getClasses();
      const classAnalyses = [];
      let totalStudents = 0;
      let overallAverage = 0;
      let totalPassRate = 0;
      
      for (const cls of classes) {
        if (cls['Is Active'] === 'Yes') {
          const analysis = this.getClassAnalysis(cls['Class Name'], term);
          if (!analysis.error) {
            classAnalyses.push({
              className: cls['Class Name'],
              students: analysis.totalStudents,
              average: analysis.average,
              passRate: analysis.passRate,
              distinctionCount: analysis.distinctionCount
            });
            totalStudents += analysis.totalStudents;
            overallAverage += analysis.average * analysis.totalStudents;
            totalPassRate += analysis.passRate * analysis.totalStudents;
          }
        }
      }
      
      overallAverage = totalStudents > 0 ? Math.round((overallAverage / totalStudents) * 100) / 100 : 0;
      totalPassRate = totalStudents > 0 ? Math.round((totalPassRate / totalStudents) * 100) : 0;
      
      // Find best and worst performing classes
      const sorted = [...classAnalyses].sort((a, b) => b.average - a.average);
      
      return {
        term: term,
        totalStudents: totalStudents,
        overallAverage: overallAverage,
        totalPassRate: totalPassRate,
        classAnalyses: classAnalyses,
        bestClass: sorted[0] || null,
        worstClass: sorted[sorted.length - 1] || null
      };
      
    } catch (error) {
      Logger.log('getSchoolAnalysis Error:', error);
      return { error: error.message };
    }
  }
  
  /**
   * Get student analysis
   * @param {string} studentId - Student ID
   * @returns {Object} Student analysis
   */
  getStudentAnalysis(studentId) {
    try {
      const student = this.schoolManager.getStudent(studentId);
      if (!student) {
        return { error: 'Student not found' };
      }
      
      // Get performance across terms
      const terms = ['Term1', 'Term2', 'Term3'];
      const performance = [];
      
      for (const term of terms) {
        const termNum = term.replace('Term', '');
        const scores = this.schoolManager.getStudentScores(studentId, termNum);
        const subjects = this.schoolManager.getSubjects(student['Class']);
        
        let total = 0;
        let count = 0;
        const subjectScores = {};
        
        for (const subject of subjects) {
          const score = scores.find(s => s['Subject ID'] === subject['Subject ID']);
          if (score && Number(score['Total']) > 0) {
            const scoreTotal = Number(score['Total']);
            total += scoreTotal;
            count++;
            subjectScores[subject['Subject Name']] = scoreTotal;
          }
        }
        
        performance.push({
          term: term,
          average: count > 0 ? Math.round((total / count) * 100) / 100 : 0,
          subjects: subjectScores
        });
      }
      
      // Calculate cumulative
      const cumulative = this.schoolManager.calculateCumulativeStudentAverage(studentId);
      
      // Find strengths and weaknesses
      const allSubjects = this.schoolManager.getSubjects(student['Class']);
      const strengths = [];
      const weaknesses = [];
      
      for (const subject of allSubjects) {
        const cumulativeScore = this.schoolManager.calculateCumulative(studentId, subject['Subject ID']);
        if (cumulativeScore !== null) {
          if (cumulativeScore >= 70) {
            strengths.push({ subject: subject['Subject Name'], score: cumulativeScore });
          } else if (cumulativeScore < 40) {
            weaknesses.push({ subject: subject['Subject Name'], score: cumulativeScore });
          }
        }
      }
      
      return {
        student: student,
        performance: performance,
        cumulative: cumulative,
        grade: this.schoolManager.scoreManager.calculateGrade(cumulative),
        remark: this.schoolManager.scoreManager.calculateRemark(cumulative),
        gpa: this.utils.calculateGPA(cumulative),
        strengths: strengths.slice(0, 3),
        weaknesses: weaknesses.slice(0, 3),
        promotionStatus: this.schoolManager.getPromotionStatus(studentId)
      };
      
    } catch (error) {
      Logger.log('getStudentAnalysis Error:', error);
      return { error: error.message };
    }
  }
  
  /**
   * Get teacher analysis
   * @param {string} teacherId - Teacher ID
   * @returns {Object} Teacher analysis
   */
  getTeacherAnalysis(teacherId) {
    try {
      const teachers = this.schoolManager.getTeachers();
      const teacher = teachers.find(t => t['Teacher ID'] === teacherId);
      
      if (!teacher) {
        return { error: 'Teacher not found' };
      }
      
      const subjects = this.schoolManager.getSubjects().filter(s => s['Teacher ID'] === teacherId);
      const classData = {};
      
      for (const subject of subjects) {
        const className = subject['Class'];
        if (!classData[className]) {
          classData[className] = {
            subjects: [],
            students: this.schoolManager.getStudents(className)
          };
        }
        classData[className].subjects.push(subject);
      }
      
      const results = {};
      for (const [className, data] of Object.entries(classData)) {
        const students = data.students;
        const subjectNames = data.subjects.map(s => s['Subject Name']);
        
        let totalScores = 0;
        let totalStudents = 0;
        let passCount = 0;
        let distinctionCount = 0;
        
        for (const student of students) {
          let studentTotal = 0;
          let studentCount = 0;
          
          for (const subject of data.subjects) {
            const cumulative = this.schoolManager.calculateCumulative(student['Student ID'], subject['Subject ID']);
            if (cumulative !== null) {
              studentTotal += cumulative;
              studentCount++;
              if (cumulative >= 40) passCount++;
              if (cumulative >= 70) distinctionCount++;
            }
          }
          
          if (studentCount > 0) {
            totalScores += studentTotal / studentCount;
            totalStudents++;
          }
        }
        
        results[className] = {
          subjects: subjectNames,
          totalStudents: totalStudents,
          average: totalStudents > 0 ? Math.round((totalScores / totalStudents) * 100) / 100 : 0,
          passRate: totalStudents > 0 ? Math.round((passCount / (totalStudents * data.subjects.length)) * 100) : 0,
          distinctionRate: totalStudents > 0 ? Math.round((distinctionCount / (totalStudents * data.subjects.length)) * 100) : 0
        };
      }
      
      return {
        teacher: teacher,
        subjects: subjects,
        classPerformance: results,
        overallAverage: Object.values(results).reduce((sum, r) => sum + r.average, 0) / (Object.keys(results).length || 1)
      };
      
    } catch (error) {
      Logger.log('getTeacherAnalysis Error:', error);
      return { error: error.message };
    }
  }
}