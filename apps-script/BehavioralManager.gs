// BehavioralManager.gs - Behavioral Domain Operations
// ============================================

class BehavioralManager {
  
  constructor(schoolManager) {
    this.schoolManager = schoolManager;
    this.spreadsheet = schoolManager.spreadsheet;
    this.utils = schoolManager.utils;
  }
  
  /**
   * Get all behavioral domains
   * @param {string} term - Optional term filter
   * @returns {Array} List of domains
   */
  getDomains(term) {
    try {
      const domains = this.utils.getSheetData('BehavioralDomains');
      if (term) {
        return domains.filter(d => d['Term'] === term || d['Term'] === 'All');
      }
      return domains;
    } catch (error) {
      Logger.log('getDomains Error:', error);
      return [];
    }
  }
  
  /**
   * Get domains by category
   * @param {string} category - Psychomotor, Affective, Social, Cognitive
   * @returns {Array} Filtered domains
   */
  getDomainsByCategory(category) {
    try {
      const domains = this.getDomains();
      return domains.filter(d => d['Domain Category'] === category);
    } catch (error) {
      Logger.log('getDomainsByCategory Error:', error);
      return [];
    }
  }
  
  /**
   * Get behavioral scores for a student
   * @param {string} studentId - Student ID
   * @param {string} term - Term (Term1, Term2, Term3)
   * @returns {Array} Behavioral scores
   */
  getBehavioralScores(studentId, term) {
    try {
      const scores = this.utils.getSheetData('BehavioralScores');
      return scores.filter(s => 
        s['Student ID'] === studentId && 
        s['Term'] === term
      );
    } catch (error) {
      Logger.log('getBehavioralScores Error:', error);
      return [];
    }
  }
  
  /**
   * Get behavioral scores with domain names
   * @param {string} studentId - Student ID
   * @param {string} term - Term
   * @returns {Array} Enhanced scores with domain names
   */
  getBehavioralScoresWithDomains(studentId, term) {
    try {
      const scores = this.getBehavioralScores(studentId, term);
      const domains = this.getDomains(term);
      
      return scores.map(score => {
        const domain = domains.find(d => d['Domain ID'] === score['Domain ID']);
        return {
          ...score,
          'Domain Name': domain ? domain['Domain Name'] : '',
          'Domain Category': domain ? domain['Domain Category'] : '',
          'Category Display': domain ? this.getCategoryDisplay(domain['Domain Category']) : ''
        };
      });
    } catch (error) {
      Logger.log('getBehavioralScoresWithDomains Error:', error);
      return [];
    }
  }
  
  /**
   * Get category display name
   * @param {string} category - Domain category
   * @returns {string} Display name
   */
  getCategoryDisplay(category) {
    const map = {
      'Psychomotor': '🧠 Psychomotor Skills',
      'Affective': '❤️ Affective Skills',
      'Social': '🤝 Social Skills',
      'Cognitive': '🧠 Cognitive Skills'
    };
    return map[category] || category;
  }
  
  /**
   * Save behavioral scores
   * @param {Object} data - Score data
   * @returns {Object} Result
   */
  saveBehavioralScores(data) {
    try {
      const { studentId, term, scores } = data;
      const sheet = this.spreadsheet.getSheetByName('BehavioralScores');
      
      if (!sheet) {
        return { success: false, error: 'BehavioralScores sheet not found' };
      }
      
      const now = new Date().toISOString().split('T')[0];
      const addedBy = data.addedBy || 'System';
      
      // Delete existing scores for this student/term
      const allData = sheet.getDataRange().getValues();
      let rowsToDelete = [];
      
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === studentId && allData[i][1] === term) {
          rowsToDelete.push(i + 1);
        }
      }
      
      // Delete from bottom to top to maintain indices
      rowsToDelete.sort((a, b) => b - a);
      for (const row of rowsToDelete) {
        sheet.deleteRow(row);
      }
      
      // Add new scores
      for (const [domainId, score] of Object.entries(scores)) {
        const row = [
          studentId,
          term,
          domainId,
          score,
          addedBy,
          now,
          now
        ];
        sheet.appendRow(row);
      }
      
      return { 
        success: true, 
        message: 'Behavioral scores saved successfully',
        count: Object.keys(scores).length
      };
      
    } catch (error) {
      Logger.log('saveBehavioralScores Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get rubric for a score
   * @param {number} score - Score (1-5)
   * @returns {Object} Rubric data
   */
  getRubric(score) {
    try {
      const rubrics = this.utils.getSheetData('BehavioralRubrics');
      return rubrics.find(r => Number(r['Score']) === score);
    } catch (error) {
      Logger.log('getRubric Error:', error);
      return null;
    }
  }
  
  /**
   * Get all rubrics
   * @returns {Array} All rubrics
   */
  getRubrics() {
    try {
      return this.utils.getSheetData('BehavioralRubrics');
    } catch (error) {
      Logger.log('getRubrics Error:', error);
      return [];
    }
  }
  
  /**
   * Calculate behavioral average for a student
   * @param {string} studentId - Student ID
   * @param {string} term - Term
   * @returns {number} Average score
   */
  calculateBehavioralAverage(studentId, term) {
    try {
      const scores = this.getBehavioralScores(studentId, term);
      if (scores.length === 0) return 0;
      
      let total = 0;
      for (const score of scores) {
        total += Number(score['Score']);
      }
      
      return Math.round((total / scores.length) * 100) / 100;
    } catch (error) {
      Logger.log('calculateBehavioralAverage Error:', error);
      return 0;
    }
  }
}