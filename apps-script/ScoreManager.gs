// ScoreManager.gs - Complete File
// ============================================

class ScoreManager {
    
    constructor(schoolManager) {
        this.schoolManager = schoolManager;
        this.spreadsheet = schoolManager.spreadsheet;
        this.utils = schoolManager.utils;
    }
    
    /**
     * Get student scores for a specific term
     */
    getStudentScores(studentId, term) {
        try {
            const sheetName = 'Scores_Term' + term;
            const scores = this.utils.getSheetData(sheetName);
            if (studentId) {
                return scores.filter(s => s['Student ID'] === studentId);
            }
            return scores;
        } catch (error) {
            Logger.log('getStudentScores Error:', error);
            return [];
        }
    }
    
    /**
     * Save scores to Google Sheet
     */
    saveScores(data) {
        try {
            Logger.log('🔍 saveScores called with:', data);
            
            const { studentId, subjectId, term, ca1, ca2, exam, comment } = data;
            const sheetName = 'Scores_Term' + term;
            const sheet = this.spreadsheet.getSheetByName(sheetName);
            
            if (!sheet) {
                Logger.log('❌ Sheet not found:', sheetName);
                return { success: false, error: 'Sheet ' + sheetName + ' not found' };
            }
            
            // Validate scores
            if (ca1 < 0 || ca1 > 20) return { success: false, error: 'CA1 must be between 0 and 20' };
            if (ca2 < 0 || ca2 > 20) return { success: false, error: 'CA2 must be between 0 and 20' };
            if (exam < 0 || exam > 60) return { success: false, error: 'Exam must be between 0 and 60' };
            
            // Calculate total and grade
            const total = Number(ca1) + Number(ca2) + Number(exam);
            const grade = this.calculateGrade(total);
            const remark = this.calculateRemark(total);
            const now = new Date().toISOString().split('T')[0];
            
            // Find existing row
            const allData = sheet.getDataRange().getValues();
            let rowIndex = -1;
            
            for (let i = 1; i < allData.length; i++) {
                if (allData[i][0] === studentId && allData[i][1] === subjectId) {
                    rowIndex = i + 1;
                    break;
                }
            }
            
            const row = [
                studentId,
                subjectId,
                Number(ca1),
                Number(ca2),
                Number(exam),
                total,
                grade,
                remark,
                comment || '',
                now
            ];
            
            if (rowIndex === -1) {
                sheet.appendRow(row);
                Logger.log('✅ New row added for student:', studentId);
            } else {
                sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
                Logger.log('✅ Row updated for student:', studentId);
            }
            
            // If third term, update cumulative
            if (term == 3) {
                if (this.schoolManager && this.schoolManager.cumulativeManager) {
                    this.schoolManager.cumulativeManager.updateCumulativeScore(studentId, subjectId);
                }
            }
            
            return { success: true, message: 'Scores saved', total, grade, remark };
            
        } catch (error) {
            Logger.log('❌ saveScores Error:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Batch import scores
     * @param {Array} scoresData - Array of score objects
     * @returns {Object} Import result
     */
    importScores(scoresData) {
        try {
            if (!scoresData || scoresData.length === 0) {
                return { success: 0, failed: 0, error: 'No data provided' };
            }
            
            let success = 0;
            let failed = 0;
            const errors = [];
            
            for (let i = 0; i < scoresData.length; i++) {
                try {
                    const row = scoresData[i];
                    const result = this.saveScores({
                        studentId: row['Student ID'] || row.studentId,
                        subjectId: row['Subject ID'] || row.subjectId,
                        term: row['Term'] || row.term || 3,
                        ca1: Number(row['CA1'] || row.ca1 || 0),
                        ca2: Number(row['CA2'] || row.ca2 || 0),
                        exam: Number(row['Exam'] || row.exam || 0),
                        comment: row['Comment'] || row.comment || ''
                    });
                    
                    if (result.success) {
                        success++;
                    } else {
                        failed++;
                        errors.push({ row: i + 1, error: result.error });
                    }
                } catch (rowError) {
                    failed++;
                    errors.push({ row: i + 1, error: rowError.message });
                }
            }
            
            return { success, failed, errors: errors.slice(0, 10) };
            
        } catch (error) {
            Logger.log('❌ importScores Error:', error);
            return { success: 0, failed: scoresData?.length || 0, error: error.message };
        }
    }
    
    /**
     * Calculate grade based on total score
     */
    calculateGrade(total) {
        const settings = this.schoolManager.getSettings();
        const grading = {
            A: { min: Number(settings['Grade_A_Min']) || 70, max: Number(settings['Grade_A_Max']) || 100 },
            B: { min: Number(settings['Grade_B_Min']) || 60, max: Number(settings['Grade_B_Max']) || 69 },
            C: { min: Number(settings['Grade_C_Min']) || 50, max: Number(settings['Grade_C_Max']) || 59 },
            D: { min: Number(settings['Grade_D_Min']) || 45, max: Number(settings['Grade_D_Max']) || 49 },
            E: { min: Number(settings['Grade_E_Min']) || 40, max: Number(settings['Grade_E_Max']) || 44 },
            F: { min: Number(settings['Grade_F_Min']) || 0, max: Number(settings['Grade_F_Max']) || 39 }
        };
        
        for (const [grade, range] of Object.entries(grading)) {
            if (total >= range.min && total <= range.max) {
                return grade;
            }
        }
        return 'F';
    }
    
    /**
     * Calculate remark based on total score
     */
    calculateRemark(total) {
        const settings = this.schoolManager.getSettings();
        const minDistinction = Number(settings['Remark_Distinction_Min']) || 70;
        const minVeryGood = Number(settings['Remark_VeryGood_Min']) || 60;
        const minCredit = Number(settings['Remark_Credit_Min']) || 50;
        const minPass = Number(settings['Remark_Pass_Min']) || 40;
        
        if (total >= minDistinction) return 'Distinction';
        if (total >= minVeryGood) return 'Very Good';
        if (total >= minCredit) return 'Credit';
        if (total >= minPass) return 'Pass';
        return 'Fail';
    }
}