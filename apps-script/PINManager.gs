// PINManager.gs - Complete PIN Operations
// ============================================

class PINManager {
    
    constructor(schoolManager) {
        this.schoolManager = schoolManager;
        this.spreadsheet = schoolManager.spreadsheet;
        this.utils = schoolManager.utils;
    }
    
    /**
     * Validate a PIN
     * @param {string} pin - 6-digit PIN
     * @param {string} className - Class name
     * @returns {Object} Validation result
     */
    validatePin(pin, className) {
        try {
            Logger.log(`🔍 Validating PIN: ${pin} for class: ${className}`);
            
            const pins = this.utils.getSheetData('StudentPins');
            Logger.log(`📊 Total PIN records: ${pins.length}`);
            
            // Find the PIN
            const pinRecord = pins.find(p => {
                const pinValue = String(p['PIN'] || '').trim();
                const inputPin = String(pin).trim();
                const status = String(p['PIN Status'] || '').trim();
                
                Logger.log(`  Comparing: "${pinValue}" == "${inputPin}" && Status: "${status}"`);
                
                return pinValue === inputPin && status === 'Active';
            });
            
            if (!pinRecord) {
                Logger.log(`❌ No active PIN found for: ${pin}`);
                return { valid: false, message: 'Invalid or inactive PIN' };
            }
            
            Logger.log(`✅ Found PIN record for student: ${pinRecord['Student ID']}`);
            
            const student = this.schoolManager.getStudent(pinRecord['Student ID']);
            if (!student) {
                Logger.log(`❌ Student not found: ${pinRecord['Student ID']}`);
                return { valid: false, message: 'Student not found' };
            }
            
            if (className && student['Class'] !== className) {
                Logger.log(`❌ Class mismatch: ${student['Class']} vs ${className}`);
                return { valid: false, message: 'PIN does not match this class' };
            }
            
            // Update PIN usage (mark as used)
            //this.updatePinUsage(pinRecord['Student ID']);
            
            return {
                valid: true,
                studentId: pinRecord['Student ID'],
                student: student,
                pinRecord: pinRecord
            };
            
        } catch (error) {
            Logger.log('❌ validatePin Error:', error);
            return { valid: false, message: 'Validation error: ' + error.message };
        }
    }
    
    /**
     * Update PIN usage (mark as used when validated)
     * @param {string} studentId - Student ID
     */
    updatePinUsage(studentId) {
        try {
            const sheet = this.spreadsheet.getSheetByName('StudentPins');
            if (!sheet) return;
            
            const allData = sheet.getDataRange().getValues();
            for (let i = 1; i < allData.length; i++) {
                if (allData[i][0] === studentId) {
                    // Column 7 is "PIN Status" - update to "Used"
                    sheet.getRange(i + 1, 8).setValue('Used');
                    // Column 9 is "PIN Sent Date" - update to today
                    sheet.getRange(i + 1, 10).setValue(new Date().toISOString().split('T')[0]);
                    Logger.log(`✅ Updated PIN status to "Used" for student: ${studentId}`);
                    break;
                }
            }
        } catch (error) {
            Logger.log('❌ updatePinUsage Error:', error);
            // Don't throw - this is a non-critical operation
        }
    }
    
    /**
     * Get PIN for a student
     * @param {string} studentId - Student ID
     * @returns {Object} PIN record
     */
    getStudentPin(studentId) {
        try {
            const pins = this.utils.getSheetData('StudentPins');
            return pins.find(p => p['Student ID'] === studentId);
        } catch (error) {
            Logger.log('getStudentPin Error:', error);
            return null;
        }
    }
    
    /**
     * Save PIN record
     * @param {Object} data - PIN data
     * @returns {boolean} Success
     */
    savePinRecord(data) {
        try {
            const sheet = this.spreadsheet.getSheetByName('StudentPins');
            if (!sheet) return false;
            
            const allData = sheet.getDataRange().getValues();
            let rowIndex = -1;
            
            for (let i = 1; i < allData.length; i++) {
                if (allData[i][0] === data.studentId) {
                    rowIndex = i + 1;
                    break;
                }
            }
            
            const row = [
                data.studentId,
                data.fullName,
                data.className,
                data.parentEmail || '',
                data.phone || '',
                data.pin,
                data.pinGeneratedDate,
                data.pinStatus || 'Active',
                data.pinSentVia || '',
                data.pinSentDate || '',
                data.labelPrinted || 'No'
            ];
            
            if (rowIndex === -1) {
                sheet.appendRow(row);
            } else {
                sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
            }
            
            return true;
            
        } catch (error) {
            Logger.log('savePinRecord Error:', error);
            return false;
        }
    }
    
    /**
     * Generate PINs for a class
     * @param {string} className - Class name
     * @param {string} term - Term
     * @returns {Object} Result
     */
    generatePins(className, term) {
        try {
            const students = this.schoolManager.getStudents(className);
            if (students.length === 0) {
                return { success: false, error: 'No students found in this class' };
            }
            
            const sheet = this.spreadsheet.getSheetByName('StudentPins');
            if (!sheet) {
                return { success: false, error: 'StudentPins sheet not found' };
            }
            
            const now = new Date().toISOString().split('T')[0];
            const pins = [];
            let successCount = 0;
            
            for (const student of students) {
                const existing = this.getStudentPin(student['Student ID']);
                let pin;
                
                if (existing) {
                    pin = existing['PIN'];
                } else {
                    pin = this.utils.generatePin();
                }
                
                const pinData = {
                    studentId: student['Student ID'],
                    fullName: student['Full Name'],
                    className: student['Class'],
                    parentEmail: student['Parent Email'] || '',
                    phone: student['Phone'] || '',
                    pin: pin,
                    pinGeneratedDate: now,
                    pinStatus: 'Active',
                    pinSentVia: '',
                    pinSentDate: '',
                    labelPrinted: 'No'
                };
                
                const success = this.savePinRecord(pinData);
                if (success) {
                    successCount++;
                    pins.push(pinData);
                }
            }
            
            return {
                success: true,
                message: `Generated ${successCount} PINs for ${className}`,
                count: successCount,
                pins: pins
            };
            
        } catch (error) {
            Logger.log('generatePins Error:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Revoke a PIN
     * @param {string} studentId - Student ID
     * @returns {Object} Result
     */
    revokePin(studentId) {
        try {
            const sheet = this.spreadsheet.getSheetByName('StudentPins');
            if (!sheet) {
                return { success: false, error: 'StudentPins sheet not found' };
            }
            
            const allData = sheet.getDataRange().getValues();
            for (let i = 1; i < allData.length; i++) {
                if (allData[i][0] === studentId) {
                    sheet.getRange(i + 1, 8).setValue('Revoked');
                    return { success: true, message: 'PIN revoked successfully' };
                }
            }
            
            return { success: false, error: 'Student not found' };
            
        } catch (error) {
            Logger.log('revokePin Error:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get PIN status for a class
     * @param {string} className - Class name
     * @returns {Object} PIN statistics
     */
    getPinStatus(className) {
        try {
            const pins = this.utils.getSheetData('StudentPins');
            const classPins = pins.filter(p => p['Class'] === className);
            
            return {
                total: classPins.length,
                active: classPins.filter(p => p['PIN Status'] === 'Active').length,
                used: classPins.filter(p => p['PIN Status'] === 'Used').length,
                revoked: classPins.filter(p => p['PIN Status'] === 'Revoked').length,
                labelPrinted: classPins.filter(p => p['Label Printed'] === 'Yes').length,
                students: classPins
            };
            
        } catch (error) {
            Logger.log('getPinStatus Error:', error);
            return { error: error.message };
        }
    }
}