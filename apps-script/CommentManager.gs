// CommentManager.gs - Comment Operations
// ============================================

class CommentManager {
  
  constructor(schoolManager) {
    this.schoolManager = schoolManager;
    this.spreadsheet = schoolManager.spreadsheet;
    this.utils = schoolManager.utils;
  }
  
  /**
   * Get all comment types
   * @returns {Array} Comment types
   */
  getCommentTypes() {
    try {
      return this.utils.getSheetData('CommentTypes');
    } catch (error) {
      Logger.log('getCommentTypes Error:', error);
      return [];
    }
  }
  
  /**
   * Get comment sections
   * @returns {Array} Comment sections
   */
  getCommentSections() {
    try {
      return this.utils.getSheetData('CommentSections');
    } catch (error) {
      Logger.log('getCommentSections Error:', error);
      return [];
    }
  }
  
  /**
   * Get comments for a student
   * @param {string} studentId - Student ID
   * @param {string} term - Term
   * @returns {Array} Comments
   */
  getComments(studentId, term) {
    try {
      const comments = this.utils.getSheetData('Comments');
      return comments.filter(c => 
        c['Student ID'] === studentId && 
        c['Term'] === term
      );
    } catch (error) {
      Logger.log('getComments Error:', error);
      return [];
    }
  }
  
  /**
   * Get comments grouped by type
   * @param {string} studentId - Student ID
   * @param {string} term - Term
   * @returns {Object} Comments grouped by type
   */
  getCommentsByType(studentId, term) {
    try {
      const comments = this.getComments(studentId, term);
      const types = this.getCommentTypes();
      
      const result = {};
      types.forEach(type => {
        const comment = comments.find(c => c['Comment Type ID'] === type['Comment Type ID']);
        result[type['Type Name']] = comment ? comment['Comment Text'] : '';
      });
      
      return result;
    } catch (error) {
      Logger.log('getCommentsByType Error:', error);
      return {};
    }
  }
  
  /**
   * Save a comment
   * @param {Object} data - Comment data
   * @returns {Object} Result
   */
  saveComment(data) {
    try {
      const { studentId, term, commentTypeId, commentText, addedBy } = data;
      const sheet = this.spreadsheet.getSheetByName('Comments');
      
      if (!sheet) {
        return { success: false, error: 'Comments sheet not found' };
      }
      
      const now = new Date().toISOString().split('T')[0];
      const addedByUser = addedBy || 'System';
      
      // Check if comment already exists
      const allData = sheet.getDataRange().getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === studentId && 
            allData[i][1] === term && 
            allData[i][2] === commentTypeId) {
          rowIndex = i + 1;
          break;
        }
      }
      
      const row = [
        studentId,
        term,
        commentTypeId,
        commentText || '',
        addedByUser,
        now,
        now,
        'Yes'
      ];
      
      if (rowIndex === -1) {
        sheet.appendRow(row);
      } else {
        sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
      }
      
      return { success: true, message: 'Comment saved successfully' };
      
    } catch (error) {
      Logger.log('saveComment Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get head teacher comment based on average
   * @param {number} average - Student average
   * @returns {string} Head teacher comment
   */
  getHeadTeacherComment(average) {
    try {
      const comments = this.utils.getSheetData('HeadTeacherComments');
      
      for (const comment of comments) {
        const minAvg = Number(comment['Min Average']);
        const maxAvg = Number(comment['Max Average']);
        if (average >= minAvg && average <= maxAvg) {
          return comment['Comment Text'];
        }
      }
      
      return 'Performance noted. Keep working hard!';
      
    } catch (error) {
      Logger.log('getHeadTeacherComment Error:', error);
      return 'Performance noted. Keep working hard!';
    }
  }
  
  /**
   * Get all head teacher comments
   * @returns {Array} All comments
   */
  getHeadTeacherComments() {
    try {
      return this.utils.getSheetData('HeadTeacherComments');
    } catch (error) {
      Logger.log('getHeadTeacherComments Error:', error);
      return [];
    }
  }
  
  /**
   * Auto-generate head teacher comment
   * @param {number} average - Student average
   * @returns {Object} Comment with ID
   */
  generateHeadTeacherComment(average) {
    try {
      const comments = this.getHeadTeacherComments();
      
      for (const comment of comments) {
        const minAvg = Number(comment['Min Average']);
        const maxAvg = Number(comment['Max Average']);
        if (average >= minAvg && average <= maxAvg) {
          return {
            commentId: comment['Comment ID'],
            text: comment['Comment Text']
          };
        }
      }
      
      return {
        commentId: null,
        text: 'Performance noted. Keep working hard!'
      };
      
    } catch (error) {
      Logger.log('generateHeadTeacherComment Error:', error);
      return {
        commentId: null,
        text: 'Performance noted. Keep working hard!'
      };
    }
  }
}