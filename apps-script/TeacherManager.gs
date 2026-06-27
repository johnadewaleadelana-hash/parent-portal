// TeacherManager.gs - Teacher Operations
// ============================================

class TeacherManager {
  
  constructor(schoolManager) {
    this.schoolManager = schoolManager;
    this.spreadsheet = schoolManager.spreadsheet;
    this.utils = schoolManager.utils;
  }
  
  /**
   * Teacher login - validates email and password
   * @param {string} email - Teacher email
   * @param {string} password - Teacher password
   * @returns {Object} { success, teacher, error }
   */
  teacherLogin(email, password) {
    try {
      Logger.log(`🔍 Teacher login attempt: ${email}`);
      
      const teachers = this.utils.getSheetData('Teachers');
      
      if (!teachers || teachers.length === 0) {
        return { success: false, error: 'No teachers found in the system' };
      }
      
      // Find teacher by email
      const teacher = teachers.find(t => {
        const teacherEmail = String(t['Email'] || '').trim().toLowerCase();
        return teacherEmail === String(email).trim().toLowerCase();
      });
      
      if (!teacher) {
        Logger.log('❌ Teacher not found with email:', email);
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Check password
      const storedPassword = String(teacher['Password'] || '').trim();
      const inputPassword = String(password || '').trim();
      
      if (storedPassword !== inputPassword) {
        Logger.log('❌ Password mismatch for:', email);
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Check role
      const role = String(teacher['Role'] || '').trim().toLowerCase();
      if (role !== 'teacher' && role !== 'admin' && role !== 'super_admin') {
        return { success: false, error: 'Account does not have teacher access' };
      }
      
      Logger.log(`✅ Teacher logged in: ${teacher['Full Name']} (${teacher['Teacher ID']})`);
      
      // Parse subjects from comma-separated string
      const subjectsStr = teacher['Subjects'] || '';
      const subjects = subjectsStr.split(',').map(s => s.trim()).filter(s => s);
      
      // Build teacher info for frontend
      const teacherInfo = {
        teacherId: teacher['Teacher ID'],
        fullName: teacher['Full Name'],
        email: teacher['Email'],
        phone: teacher['Phone'] || '',
        classAssigned: teacher['Class Assigned'] || '',
        subjects: subjects,
        subjectsString: subjectsStr,
        role: teacher['Role'] || 'teacher',
        isTutor: teacher['Is Tutor'] || 'No'
      };
      
      return { success: true, teacher: teacherInfo };
      
    } catch (error) {
      Logger.log('❌ teacherLogin Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get teacher by ID
   * @param {string} teacherId - Teacher ID
   * @returns {Object} Teacher data or null
   */
  getTeacher(teacherId) {
    try {
      const teachers = this.utils.getSheetData('Teachers');
      return teachers.find(t => t['Teacher ID'] === teacherId) || null;
    } catch (error) {
      Logger.log('getTeacher Error:', error);
      return null;
    }
  }
  
  /**
   * Get students assigned to this teacher's class
   * @param {string} teacherId - Teacher ID
   * @param {string} className - Optional class filter (overrides teacher's assigned class)
   * @returns {Array} List of students
   */
  getTeacherStudents(teacherId, className) {
    try {
      const teacher = this.getTeacher(teacherId);
      if (!teacher) return [];
      
      const targetClass = className || teacher['Class Assigned'] || '';
      if (!targetClass) return [];
      
      return this.schoolManager.getStudents(targetClass);
    } catch (error) {
      Logger.log('getTeacherStudents Error:', error);
      return [];
    }
  }
  
  /**
   * Get subjects assigned to this teacher
   * @param {string} teacherId - Teacher ID
   * @param {string} className - Class to filter subjects by
   * @returns {Array} List of subjects
   */
  getTeacherSubjects(teacherId, className) {
    try {
      const teacher = this.getTeacher(teacherId);
      if (!teacher) return [];
      
      // Get teacher's subject names from comma-separated list
      const subjectNames = (teacher['Subjects'] || '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
      
      if (subjectNames.length === 0) return [];
      
      // Get all subjects for the class
      const targetClass = className || teacher['Class Assigned'] || '';
      const allSubjects = this.schoolManager.getSubjects(targetClass);
      
      // Filter to only teacher's subjects
      return allSubjects.filter(subj => {
        return subjectNames.includes(subj['Subject Name']);
      });
      
    } catch (error) {
      Logger.log('getTeacherSubjects Error:', error);
      return [];
    }
  }
  
  /**
   * Get the class assigned to this teacher
   * @param {string} teacherId - Teacher ID
   * @returns {string} Class name or null
   */
  getTeacherClass(teacherId) {
    try {
      const teacher = this.getTeacher(teacherId);
      return teacher ? (teacher['Class Assigned'] || null) : null;
    } catch (error) {
      Logger.log('getTeacherClass Error:', error);
      return null;
    }
  }
}