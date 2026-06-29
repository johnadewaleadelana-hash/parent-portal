// StudentManager.gs - Student Operations
// ============================================

class StudentManager {
  
  constructor(schoolManager) {
    this.schoolManager = schoolManager;
    this.spreadsheet = schoolManager.spreadsheet;
    this.utils = schoolManager.utils;
  }
  
  getStudents(className) {
    try {
      const students = this.utils.getSheetData('Students');
      if (className) {
        return students.filter(s => s['Class'] === className);
      }
      return students;
    } catch (error) {
      Logger.log('getStudents Error:', error);
      return [];
    }
  }
  
  getStudent(studentId) {
    try {
      const students = this.getStudents();
      return students.find(s => s['Student ID'] === studentId);
    } catch (error) {
      Logger.log('getStudent Error:', error);
      return null;
    }
  }
  
  // StudentManager.gs - Add these methods if missing
// ============================================

addStudent(data) {
    const { fullName, className, parentEmail, phone, status, admissionDate } = data;
    const sheet = this.spreadsheet.getSheetByName('Students');
    
    if (!sheet) {
        return { success: false, error: 'Students sheet not found' };
    }
    
    // Generate student ID
    const students = this.getStudents();
    const nextId = students.length + 1;
    const studentId = 'STU' + String(nextId).padStart(3, '0');
    
    // Check if student already exists (by name and class)
    const existing = students.find(s => s['Full Name'] === fullName && s['Class'] === className);
    if (existing) {
        return { success: false, error: 'Student already exists in this class' };
    }
    
    const row = [
        studentId,
        fullName,
        className,
        parentEmail || '',
        phone || '',
        new Date().toISOString().split('T')[0],
        status || 'Active',
        className,
        admissionDate || new Date().toISOString().split('T')[0]
    ];
    
    sheet.appendRow(row);
    return { success: true, studentId, message: 'Student added successfully' };
}

updateStudent(data) {
    const { studentId, fullName, className, parentEmail, phone, status, currentClass, admissionDate } = data;
    const sheet = this.spreadsheet.getSheetByName('Students');
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === studentId) {
            const row = [
                studentId,
                fullName || allData[i][1],
                className || allData[i][2],
                parentEmail || allData[i][3],
                phone || allData[i][4],
                allData[i][5],
                status || allData[i][6],
                className || allData[i][7],
                admissionDate || allData[i][8]
            ];
            sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
            return { success: true, message: 'Student updated successfully' };
        }
    }
    
    return { success: false, error: 'Student not found' };
}

deleteStudent(studentId) {
    const sheet = this.spreadsheet.getSheetByName('Students');
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === studentId) {
            sheet.getRange(i + 1, 7).setValue('Inactive');
            return { success: true, message: 'Student marked as inactive' };
        }
    }
    
    return { success: false, error: 'Student not found' };
}
  
  getStudentByPin(pin) {
    // Stub - will implement later
    return null;
  }
  
  importStudents(studentsData) {
    try {
      if (!studentsData || studentsData.length === 0) {
        return { success: 0, failed: 0, error: 'No data provided' };
      }
      
      let success = 0;
      let failed = 0;
      const errors = [];
      
      for (let i = 0; i < studentsData.length; i++) {
        try {
          const row = studentsData[i];
          const result = this.addStudent({
            fullName: row['Full Name'] || row.fullName || row['Full_Name'],
            className: row['Class'] || row.className,
            parentEmail: row['Parent Email'] || row.parentEmail || row['Parent_Email'] || '',
            phone: row['Phone'] || row.phone || '',
            status: row['Status'] || row.status || 'Active',
            admissionDate: row['Admission Date'] || row.admissionDate || row['Admission_Date'] || ''
          });
          
          if (result.success) {
            success++;
          } else if (result.error && !result.error.includes('already exists')) {
            failed++;
            errors.push({ row: i + 1, error: result.error });
          } else {
            // Already exists - still count as success
            success++;
          }
        } catch (rowError) {
          failed++;
          errors.push({ row: i + 1, error: rowError.message });
        }
      }
      
      return { success, failed, errors: errors.slice(0, 10), total: studentsData.length };
      
    } catch (error) {
      Logger.log('❌ importStudents Error:', error);
      return { success: 0, failed: studentsData?.length || 0, error: error.message };
    }
  }
  // SchoolManager.gs - Add these methods
// ============================================

// ============================================
// TEACHER OPERATIONS
// ============================================

/**
 * Get all teachers
 * @returns {Array} List of teachers
 */
getTeachers() {
    return this.utils.getSheetData('Teachers');
}

/**
 * Add a new teacher
 * @param {Object} data - Teacher data
 * @returns {Object} Result
 */
addTeacher(data) {
    const sheet = this.spreadsheet.getSheetByName('Teachers');
    const teachers = this.getTeachers();
    const nextId = teachers.length + 1;
    const teacherId = 'TCH' + String(nextId).padStart(3, '0');
    
    const row = [
        teacherId,
        data.fullName,
        data.email,
        data.phone || '',
        data.classAssigned || '',
        data.subjects || '',
        data.password || 'teacher123',
        data.role || 'teacher',
        data.isTutor || 'No'
    ];
    
    sheet.appendRow(row);
    return { success: true, teacherId, message: 'Teacher added successfully' };
}

/**
 * Update a teacher
 * @param {Object} data - Teacher data with teacherId
 * @returns {Object} Result
 */
updateTeacher(data) {
    const sheet = this.spreadsheet.getSheetByName('Teachers');
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === data.teacherId) {
            const row = [
                data.teacherId,
                data.fullName || allData[i][1],
                data.email || allData[i][2],
                data.phone || allData[i][3],
                data.classAssigned || allData[i][4],
                data.subjects || allData[i][5],
                data.password || allData[i][6],
                data.role || allData[i][7],
                data.isTutor || allData[i][8]
            ];
            sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
            return { success: true, message: 'Teacher updated successfully' };
        }
    }
    
    return { success: false, error: 'Teacher not found' };
}

/**
 * Delete a teacher (soft delete)
 * @param {string} teacherId - Teacher ID
 * @returns {Object} Result
 */
deleteTeacher(teacherId) {
    // In a full implementation, you might want to mark as inactive
    // For now, we'll remove the teacher from the sheet
    const sheet = this.spreadsheet.getSheetByName('Teachers');
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === teacherId) {
            sheet.deleteRow(i + 1);
            return { success: true, message: 'Teacher deleted successfully' };
        }
    }
    
    return { success: false, error: 'Teacher not found' };
}
}

