// Utils.gs - Utility Functions (FINAL WORKING VERSION)
// ============================================

class Utils {
  
  constructor(schoolManager) {
    this.schoolManager = schoolManager;
    this.spreadsheet = schoolManager.spreadsheet;
  }
  
  /**
   * Get data from a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {boolean} includeHeaders - Whether to include headers
   * @returns {Array} Sheet data as array of objects
   */
  getSheetData(sheetName, includeHeaders = true) {
    try {
      const sheet = this.spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        Logger.log('❌ Sheet not found:', sheetName);
        return [];
      }
      
      const data = sheet.getDataRange().getValues();
      if (data.length === 0) {
        return [];
      }
      
      // Get headers from first row
      const headers = data[0].map(h => String(h).trim());
      
      // Filter out empty rows
      const rows = data.slice(1).filter(row => {
        return row.some(cell => cell !== '' && cell !== undefined && cell !== null);
      });
      
      if (!includeHeaders) {
        return rows;
      }
      
      // Convert to array of objects with header keys
      const result = rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          // Use the header as the key, clean it up
          const key = String(header).trim();
          obj[key] = row[index] !== undefined && row[index] !== null ? row[index] : '';
        });
        return obj;
      });
      
      return result;
      
    } catch (error) {
      Logger.log('❌ getSheetData Error:', error.message);
      return [];
    }
  }
  
  /**
   * Get raw data from a sheet (2D array)
   * @param {string} sheetName - Name of the sheet
   * @returns {Array} 2D array of data
   */
  getRawSheetData(sheetName) {
    try {
      const sheet = this.spreadsheet.getSheetByName(sheetName);
      if (!sheet) return [];
      return sheet.getDataRange().getValues();
    } catch (error) {
      Logger.log('❌ getRawSheetData Error:', error.message);
      return [];
    }
  }
  
  /**
   * Update data in a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {Array} data - 2D array of data
   * @param {number} startRow - Row to start from (1-indexed)
   * @returns {boolean} Success
   */
  updateSheetData(sheetName, data, startRow = 2) {
    try {
      const sheet = this.spreadsheet.getSheetByName(sheetName);
      if (!sheet) return false;
      
      const lastRow = sheet.getLastRow();
      if (lastRow >= startRow) {
        sheet.deleteRows(startRow, lastRow - startRow + 1);
      }
      
      if (data && data.length > 0) {
        sheet.getRange(startRow, 1, data.length, data[0].length).setValues(data);
      }
      return true;
    } catch (error) {
      Logger.log('❌ updateSheetData Error:', error.message);
      return false;
    }
  }
  
  /**
   * Append a row to a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {Array} row - Row data
   * @returns {boolean} Success
   */
  appendRow(sheetName, row) {
    try {
      const sheet = this.spreadsheet.getSheetByName(sheetName);
      if (!sheet) return false;
      sheet.appendRow(row);
      return true;
    } catch (error) {
      Logger.log('❌ appendRow Error:', error.message);
      return false;
    }
  }
  
  /**
   * Generate a unique ID
   * @param {string} prefix - ID prefix (e.g., 'STU', 'TCH')
   * @param {number} length - Length of the numeric part
   * @returns {string} Unique ID
   */
  generateId(prefix, length = 3) {
    try {
      const sheet = this.spreadsheet.getSheetByName('Students');
      if (!sheet) return prefix + '001';
      
      const data = sheet.getDataRange().getValues();
      let maxNum = 0;
      
      for (let i = 1; i < data.length; i++) {
        const id = data[i][0];
        if (id && id.startsWith(prefix)) {
          const num = parseInt(id.replace(prefix, ''));
          if (num > maxNum) maxNum = num;
        }
      }
      
      const nextNum = maxNum + 1;
      const paddedNum = String(nextNum).padStart(length, '0');
      return prefix + paddedNum;
    } catch (error) {
      return prefix + '001';
    }
  }
  
  /**
   * Generate a 6-digit PIN
   * @returns {string} 6-digit PIN
   */
  generatePin() {
    let pin;
    let exists = true;
    let attempts = 0;
    const existingPins = this.getExistingPins();
    
    while (exists && attempts < 1000) {
      pin = String(Math.floor(100000 + Math.random() * 900000));
      exists = existingPins.includes(pin);
      attempts++;
    }
    
    return pin || '000000';
  }
  
  /**
   * Get all existing PINs
   * @returns {Array} List of PINs
   */
  getExistingPins() {
    try {
      const pins = this.getSheetData('StudentPins');
      return pins.map(p => p['PIN']).filter(p => p);
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Calculate GPA based on average
   * @param {number} average - Average score
   * @returns {number} GPA (0-4.0)
   */
  calculateGPA(average) {
    const gpaMap = {
      90: 4.0, 80: 3.5, 75: 3.25, 70: 3.0,
      65: 2.75, 60: 2.5, 55: 2.25, 50: 2.0,
      45: 1.75, 40: 1.5, 35: 1.25, 30: 1.0,
      25: 0.75, 20: 0.5, 15: 0.25
    };
    
    for (const [score, gpa] of Object.entries(gpaMap).sort((a, b) => b[0] - a[0])) {
      if (average >= Number(score)) {
        return gpa;
      }
    }
    return 0;
  }
  
  /**
   * Format date
   * @param {string} date - Date string
   * @param {string} format - Format string
   * @returns {string} Formatted date
   */
  formatDate(date, format = 'DD/MM/YYYY') {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return format.replace('DD', day).replace('MM', month).replace('YYYY', year);
  }
  
  /**
   * Get grade color
   * @param {string} grade - Grade letter
   * @returns {Object} Color information
   */
  getGradeColor(grade) {
    try {
      const colors = this.getSheetData('GradeColors');
      const color = colors.find(c => c['Grade'] === grade);
      if (color) {
        return {
          name: color['Color Name'],
          hex: color['Hex Color'],
          cssClass: color['CSS Class']
        };
      }
      return { name: 'Default', hex: '#000000', cssClass: '' };
    } catch (error) {
      return { name: 'Default', hex: '#000000', cssClass: '' };
    }
  }
}