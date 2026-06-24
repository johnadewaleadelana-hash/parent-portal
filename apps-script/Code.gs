/**
 * School Report System - Complete Setup Script
 * This script creates all 25 tabs with headers and sample data
 * 
 * Run this script once to set up your entire system
 * 
 * @author School Report System
 * @version 1.0
 */

// ============================================
// MAIN SETUP FUNCTION
// ============================================

function runSetup() {
  // Show confirmation dialog
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '⚠️ Setup Confirmation',
    'This will create 25 tabs with headers and sample data.\n\n' +
    '⚠️ WARNING: Any existing tabs with the same names will be overwritten!\n\n' +
    'Do you want to continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    ui.alert('Setup cancelled.');
    return;
  }
  
  try {
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create all tabs
    createAllTabs(ss);
    
    // Show success message
    ui.alert(
      '✅ Setup Complete!',
      'All 25 tabs have been created with headers and sample data.\n\n' +
      'You can now proceed to Phase 2: Google Apps Script Backend.',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    ui.alert(
      '❌ Error',
      'An error occurred during setup:\n\n' +
      error.toString() +
      '\n\nPlease check the logs and try again.',
      ui.ButtonSet.OK
    );
    console.error('Setup Error:', error);
  }
}

// ============================================
// CREATE ALL TABS
// ============================================

function createAllTabs(ss) {
  // Define all tabs with their data
  const tabs = {
    'Students': getStudentsData(),
    'Teachers': getTeachersData(),
    'Subjects': getSubjectsData(),
    'Classes': getClassesData(),
    'Scores_Term1': getScoresTerm1Data(),
    'Scores_Term2': getScoresTerm2Data(),
    'Scores_Term3': getScoresTerm3Data(),
    'BehavioralDomains': getBehavioralDomainsData(),
    'BehavioralRubrics': getBehavioralRubricsData(),
    'BehavioralScores': getBehavioralScoresData(),
    'Attendance': getAttendanceData(),
    'CommentTypes': getCommentTypesData(),
    'CommentSections': getCommentSectionsData(),
    'Comments': getCommentsData(),
    'HeadTeacherComments': getHeadTeacherCommentsData(),
    'GradeColors': getGradeColorsData(),
    'StudentPins': getStudentPinsData(),
    'TermSettings': getTermSettingsData(),
    'Settings': getSettingsData(),
    'PromotionHistory': getPromotionHistoryData(),
    'GraduateRecords': getGraduateRecordsData(),
    'TransferRecords': getTransferRecordsData(),
    'TranscriptSettings': getTranscriptSettingsData(),
    'BroadsheetTemplate': getBroadsheetTemplateData(),
    'AcademicCalendar': getAcademicCalendarData()
  };
  
  // Get existing sheet names
  const existingSheets = ss.getSheets().map(s => s.getName());
  
  // Create or replace each tab
  for (const [name, data] of Object.entries(tabs)) {
    let sheet;
    
    if (existingSheets.includes(name)) {
      // Delete existing sheet
      const existingSheet = ss.getSheetByName(name);
      ss.deleteSheet(existingSheet);
    }
    
    // Create new sheet
    sheet = ss.insertSheet(name);
    
    // Write data
    if (data && data.length > 0) {
      const range = sheet.getRange(1, 1, data.length, data[0].length);
      range.setValues(data);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, data[0].length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1a237e');
      headerRange.setFontColor('#ffffff');
      headerRange.setHorizontalAlignment('center');
      
      // Auto-resize columns
      for (let i = 1; i <= data[0].length; i++) {
        sheet.autoResizeColumn(i);
      }
      
      // Freeze header row
      sheet.setFrozenRows(1);
    }
  }
}

// ============================================
// DATA DEFINITIONS FOR EACH TAB
// ============================================

function getStudentsData() {
  return [
    ['Student ID', 'Full Name', 'Class', 'Parent Email', 'Phone', 'Date Added', 'Status', 'Current Class', 'Admission Date'],
    ['STU001', 'AKINKUADE NATHAN', 'Year 4', 'nathan.parent@email.com', '08012345678', '2024-09-01', 'Active', 'Year 4', '2020-09-01'],
    ['STU002', 'ADEGBITE HAVILAH', 'Nursery A', 'havilah.parent@email.com', '08087654321', '2024-09-01', 'Active', 'Nursery A', '2024-09-01'],
    ['STU003', 'DOE JOHN', 'Year 4', 'john.parent@email.com', '08011223344', '2024-09-02', 'Active', 'Year 4', '2022-09-01'],
    ['STU004', 'SMITH JANE', 'Year 4', 'jane.parent@email.com', '08044332211', '2024-09-02', 'Active', 'Year 4', '2023-09-01'],
    ['STU005', 'BROWN MICHAEL', 'Year 4', 'michael.parent@email.com', '08099887766', '2024-09-03', 'Active', 'Year 4', '2023-09-01']
  ];
}

function getTeachersData() {
  return [
    ['Teacher ID', 'Full Name', 'Email', 'Phone', 'Class Assigned', 'Subjects', 'Password', 'Role', 'Is Tutor'],
    ['TCH001', 'MR BOBOYE EMMANUEL', 'boboeye@peniel.school', '08012345678', 'Year 4', 'English Language,Mathematics,Basic Science', 'teacher123', 'teacher', 'Yes'],
    ['TCH002', 'MRS OLORUNTOBI', 'oloruntobi@peniel.school', '08023456789', 'Nursery A', 'Literacy,Communication,Mathematics', 'teacher456', 'teacher', 'Yes'],
    ['TCH003', 'MR ADEBAYO', 'adebayo@peniel.school', '08034567890', 'Year 4', 'ICT,Physical Education,History', 'teacher789', 'teacher', 'No'],
    ['TCH004', 'MS FUNKE', 'funke@peniel.school', '08045678901', 'Year 4', 'Geography,French,Cultural Arts', 'teacher101', 'teacher', 'No'],
    ['TCH005', 'ADMIN', 'admin@peniel.school', '08056789012', 'All', 'All', 'admin123', 'admin', 'No']
  ];
}

function getSubjectsData() {
  return [
    ['Subject ID', 'Subject Name', 'Class', 'Teacher ID'],
    ['SUB001', 'English Language', 'Year 4', 'TCH001'],
    ['SUB002', 'Mathematics', 'Year 4', 'TCH001'],
    ['SUB003', 'Basic Science', 'Year 4', 'TCH001'],
    ['SUB004', 'ICT', 'Year 4', 'TCH003'],
    ['SUB005', 'Physical and Health Education', 'Year 4', 'TCH003'],
    ['SUB006', 'Religious and National Value', 'Year 4', 'TCH004'],
    ['SUB007', 'Pre-Vocational Studies', 'Year 4', 'TCH004'],
    ['SUB008', 'Geography', 'Year 4', 'TCH004'],
    ['SUB009', 'History', 'Year 4', 'TCH003'],
    ['SUB010', 'French', 'Year 4', 'TCH004'],
    ['SUB011', 'Cultural and Creative Art', 'Year 4', 'TCH004'],
    ['SUB012', 'Quantitative Reasoning', 'Year 4', 'TCH001'],
    ['SUB013', 'Verbal Reasoning', 'Year 4', 'TCH001'],
    ['SUB014', 'Yoruba', 'Year 4', 'TCH004'],
    ['SUB015', 'Literacy', 'Nursery A', 'TCH002'],
    ['SUB016', 'Communication and Language', 'Nursery A', 'TCH002'],
    ['SUB017', 'Mathematical Development', 'Nursery A', 'TCH002'],
    ['SUB018', 'Understanding the World', 'Nursery A', 'TCH002'],
    ['SUB019', 'Physical Development', 'Nursery A', 'TCH002'],
    ['SUB020', 'Expressive Art Design', 'Nursery A', 'TCH002']
  ];
}

function getClassesData() {
  return [
    ['Class ID', 'Class Name', 'Next Class', 'Promotion Average', 'Min Subjects Pass', 'School ID', 'Is Active'],
    ['CLS001', 'Nursery A', 'Nursery B', '50', '5', 'SCH001', 'Yes'],
    ['CLS002', 'Nursery B', 'Year 1', '50', '5', 'SCH001', 'Yes'],
    ['CLS003', 'Year 1', 'Year 2', '50', '5', 'SCH001', 'Yes'],
    ['CLS004', 'Year 2', 'Year 3', '50', '5', 'SCH001', 'Yes'],
    ['CLS005', 'Year 3', 'Year 4', '50', '5', 'SCH001', 'Yes'],
    ['CLS006', 'Year 4', 'Year 5', '50', '5', 'SCH001', 'Yes'],
    ['CLS007', 'Year 5', 'Year 6', '50', '5', 'SCH001', 'Yes']
  ];
}

function getScoresTerm1Data() {
  return [
    ['Student ID', 'Subject ID', 'CA1', 'CA2', 'Exam', 'Total', 'Grade', 'Remark', 'Comment', 'Last Updated'],
    ['STU001', 'SUB001', '15', '19', '45', '79', 'A', 'Very Good', 'Good effort', '2024-12-15'],
    ['STU001', 'SUB002', '13', '13', '36', '62', 'B', 'Very Good', 'Needs more practice', '2024-12-15'],
    ['STU001', 'SUB003', '18', '17', '53', '88', 'A', 'Distinction', 'Excellent understanding', '2024-12-15'],
    ['STU001', 'SUB004', '18', '19', '57', '94', 'A', 'Distinction', 'Outstanding', '2024-12-15'],
    ['STU001', 'SUB005', '19', '17', '43', '79', 'A', 'Very Good', 'Good participation', '2024-12-15'],
    ['STU001', 'SUB006', '17', '15', '54', '86', 'A', 'Distinction', 'Excellent', '2024-12-15'],
    ['STU001', 'SUB007', '18', '18', '46', '82', 'A', 'Distinction', 'Very good', '2024-12-15'],
    ['STU001', 'SUB008', '19', '18', '50', '87', 'A', 'Distinction', 'Outstanding', '2024-12-15'],
    ['STU001', 'SUB009', '17', '13', '49', '79', 'A', 'Very Good', 'Good', '2024-12-15'],
    ['STU001', 'SUB010', '20', '14', '42', '76', 'A', 'Very Good', 'Excellent', '2024-12-15'],
    ['STU001', 'SUB011', '15', '20', '48', '83', 'A', 'Distinction', 'Creative', '2024-12-15'],
    ['STU001', 'SUB012', '14', '15', '47', '76', 'A', 'Very Good', 'Good reasoning', '2024-12-15'],
    ['STU001', 'SUB013', '16', '20', '42', '78', 'A', 'Very Good', 'Excellent', '2024-12-15'],
    ['STU001', 'SUB014', '14', '12', '42', '68', 'B', 'Very Good', 'Keep improving', '2024-12-15']
  ];
}

function getScoresTerm2Data() {
  return [
    ['Student ID', 'Subject ID', 'CA1', 'CA2', 'Exam', 'Total', 'Grade', 'Remark', 'Comment', 'Last Updated'],
    ['STU001', 'SUB001', '15', '19', '45', '79', 'A', 'Very Good', 'Good progress', '2025-04-10'],
    ['STU001', 'SUB002', '13', '13', '36', '62', 'B', 'Very Good', 'Improved', '2025-04-10'],
    ['STU001', 'SUB003', '18', '17', '53', '88', 'A', 'Distinction', 'Excellent', '2025-04-10'],
    ['STU001', 'SUB004', '18', '19', '57', '94', 'A', 'Distinction', 'Outstanding', '2025-04-10'],
    ['STU001', 'SUB005', '19', '17', '43', '79', 'A', 'Very Good', 'Good effort', '2025-04-10'],
    ['STU001', 'SUB006', '17', '15', '54', '86', 'A', 'Distinction', 'Excellent', '2025-04-10'],
    ['STU001', 'SUB007', '18', '18', '46', '82', 'A', 'Distinction', 'Very good', '2025-04-10'],
    ['STU001', 'SUB008', '19', '18', '50', '87', 'A', 'Distinction', 'Outstanding', '2025-04-10'],
    ['STU001', 'SUB009', '17', '13', '49', '79', 'A', 'Very Good', 'Good', '2025-04-10'],
    ['STU001', 'SUB010', '20', '14', '42', '76', 'A', 'Very Good', 'Excellent', '2025-04-10'],
    ['STU001', 'SUB011', '15', '20', '48', '83', 'A', 'Distinction', 'Creative', '2025-04-10'],
    ['STU001', 'SUB012', '14', '15', '47', '76', 'A', 'Very Good', 'Good reasoning', '2025-04-10'],
    ['STU001', 'SUB013', '16', '20', '42', '78', 'A', 'Very Good', 'Excellent', '2025-04-10'],
    ['STU001', 'SUB014', '14', '12', '42', '68', 'B', 'Very Good', 'Improving', '2025-04-10']
  ];
}

function getScoresTerm3Data() {
  return [
    ['Student ID', 'Subject ID', 'CA1', 'CA2', 'Exam', 'Total', 'Term1 Total', 'Term2 Total', 'Cumulative', 'Grade', 'Remark', 'Comment'],
    ['STU001', 'SUB001', '14', '13', '40', '67', '79', '79', '75.5', 'A', 'Distinction', 'Consistent effort'],
    ['STU001', 'SUB002', '14', '16', '40', '70', '62', '62', '69.0', 'B', 'Very Good', 'Improved'],
    ['STU001', 'SUB003', '18', '17', '46', '81', '88', '88', '86.0', 'A', 'Distinction', 'Excellent'],
    ['STU001', 'SUB004', '18', '19', '54', '91', '94', '94', '90.5', 'A', 'Distinction', 'Outstanding'],
    ['STU001', 'SUB005', '16', '18', '40', '74', '79', '79', '80.0', 'A', 'Distinction', 'Good effort'],
    ['STU001', 'SUB006', '18', '15', '44', '77', '86', '86', '85.3', 'A', 'Distinction', 'Very good'],
    ['STU001', 'SUB007', '17', '19', '45', '81', '82', '82', '84.7', 'A', 'Distinction', 'Excellent'],
    ['STU001', 'SUB008', '14', '16', '51', '81', '87', '87', '79.8', 'A', 'Distinction', 'Outstanding'],
    ['STU001', 'SUB009', '12', '14', '53', '79', '79', '79', '82.2', 'A', 'Distinction', 'Good'],
    ['STU001', 'SUB010', '16', '16', '55', '87', '76', '76', '81.3', 'A', 'Distinction', 'Excellent'],
    ['STU001', 'SUB011', '18', '19', '51', '88', '83', '83', '89.3', 'A', 'Distinction', 'Creative'],
    ['STU001', 'SUB012', '10', '16', '42', '68', '76', '76', '78.3', 'A', 'Distinction', 'Good'],
    ['STU001', 'SUB013', '20', '20', '49', '89', '78', '78', '84.7', 'A', 'Distinction', 'Excellent'],
    ['STU001', 'SUB014', '9', '9', '45', '63', '68', '68', '60.1', 'B', 'Very Good', 'Keep improving']
  ];
}

function getBehavioralDomainsData() {
  return [
    ['Domain ID', 'Domain Name', 'Domain Category', 'Display Order', 'Is Active', 'School ID', 'Term'],
    ['BEH001', 'Fine Motor Skills', 'Psychomotor', '1', 'Yes', 'SCH001', 'All'],
    ['BEH002', 'Gross Motor Skills', 'Psychomotor', '2', 'Yes', 'SCH001', 'All'],
    ['BEH003', 'Coordination', 'Psychomotor', '3', 'Yes', 'SCH001', 'All'],
    ['BEH004', 'Attention Span', 'Affective', '1', 'Yes', 'SCH001', 'All'],
    ['BEH005', 'Emotional Regulation', 'Affective', '2', 'Yes', 'SCH001', 'All'],
    ['BEH006', 'Self-Confidence', 'Affective', '3', 'Yes', 'SCH001', 'All'],
    ['BEH007', 'Social Skills', 'Affective', '4', 'Yes', 'SCH001', 'All'],
    ['BEH008', 'Punctuality', 'Social', '1', 'Yes', 'SCH001', 'All'],
    ['BEH009', 'Attendance', 'Social', '2', 'Yes', 'SCH001', 'All'],
    ['BEH010', 'Relationship with Others', 'Social', '3', 'Yes', 'SCH001', 'All'],
    ['BEH011', 'Sense of Responsibility', 'Social', '4', 'Yes', 'SCH001', 'All'],
    ['BEH012', 'Honesty', 'Social', '5', 'Yes', 'SCH001', 'All']
  ];
}

function getBehavioralRubricsData() {
  return [
    ['Rubric ID', 'Score', 'Label', 'Description', 'Color', 'Display Order'],
    ['RUB001', '5', 'Excellent', 'Consistently demonstrates the skill', '#28a745', '1'],
    ['RUB002', '4', 'Good', 'Often demonstrates the skill', '#8bc34a', '2'],
    ['RUB003', '3', 'Satisfactory', 'Sometimes demonstrates the skill', '#ffc107', '3'],
    ['RUB004', '2', 'Needs Improvement', 'Rarely demonstrates the skill', '#fd7e14', '4'],
    ['RUB005', '1', 'Poor', 'Does not demonstrate the skill', '#d32f2f', '5']
  ];
}

function getBehavioralScoresData() {
  return [
    ['Student ID', 'Term', 'Domain ID', 'Score', 'Added By', 'Added Date', 'Last Modified'],
    ['STU001', 'Term3', 'BEH001', '4', 'TCH001', '2025-06-20', '2025-06-20'],
    ['STU001', 'Term3', 'BEH002', '4', 'TCH001', '2025-06-20', '2025-06-20'],
    ['STU001', 'Term3', 'BEH003', '5', 'TCH001', '2025-06-20', '2025-06-20'],
    ['STU001', 'Term3', 'BEH004', '5', 'TCH001', '2025-06-20', '2025-06-20'],
    ['STU001', 'Term3', 'BEH005', '5', 'TCH001', '2025-06-20', '2025-06-20'],
    ['STU001', 'Term3', 'BEH006', '5', 'TCH001', '2025-06-20', '2025-06-20'],
    ['STU001', 'Term3', 'BEH007', '5', 'TCH001', '2025-06-20', '2025-06-20'],
    ['STU001', 'Term3', 'BEH008', '5', 'TCH001', '2025-06-20', '2025-06-20'],
    ['STU001', 'Term3', 'BEH009', '5', 'TCH001', '2025-06-20', '2025-06-20'],
    ['STU001', 'Term3', 'BEH010', '5', 'TCH001', '2025-06-20', '2025-06-20'],
    ['STU001', 'Term3', 'BEH011', '4', 'TCH001', '2025-06-20', '2025-06-20'],
    ['STU001', 'Term3', 'BEH012', '4', 'TCH001', '2025-06-20', '2025-06-20']
  ];
}

function getAttendanceData() {
  return [
    ['Student ID', 'Term', 'Times School Opened', 'Times Present', 'Attendance Percentage', 'Last Updated'],
    ['STU001', 'Term1', '46', '45', '97.83', '2024-12-15'],
    ['STU001', 'Term2', '45', '44', '97.78', '2025-04-10'],
    ['STU001', 'Term3', '43', '42', '97.67', '2025-06-20']
  ];
}

function getCommentTypesData() {
  return [
    ['Comment Type ID', 'Type Name', 'Display Label', 'Is Active', 'School ID', 'Display Order'],
    ['CMT001', 'Tutor Comment', 'Class Tutor\'s Comment', 'Yes', 'SCH001', '1'],
    ['CMT002', 'House Parent Comment', 'House Parent\'s Comment', 'Yes', 'SCH001', '2'],
    ['CMT003', 'Sports Teacher Comment', 'Sports Teacher\'s Comment', 'Yes', 'SCH001', '3'],
    ['CMT004', 'Counselor Comment', 'School Counselor\'s Comment', 'Yes', 'SCH001', '4'],
    ['CMT005', 'Head Teacher Comment', 'Head Teacher\'s Comment', 'Yes', 'SCH001', '5']
  ];
}

function getCommentSectionsData() {
  return [
    ['Section ID', 'Section Name', 'Comment Type ID', 'Display Order', 'Display Location', 'Is Required'],
    ['SEC001', 'Tutor Section', 'CMT001', '1', 'After Scores', 'No'],
    ['SEC002', 'House Parent Section', 'CMT002', '2', 'After Tutor', 'No'],
    ['SEC003', 'Sports Section', 'CMT003', '3', 'After House', 'No'],
    ['SEC004', 'Counselor Section', 'CMT004', '4', 'After Sports', 'No'],
    ['SEC005', 'Head Teacher Section', 'CMT005', '5', 'Bottom of Report', 'Yes']
  ];
}

function getCommentsData() {
  return [
    ['Student ID', 'Term', 'Comment Type ID', 'Comment Text', 'Added By', 'Added Date', 'Last Modified', 'Is Approved'],
    ['STU001', 'Term3', 'CMT001', 'Nathan is a brilliant boy and he performs excellently, but he needs to learn to control his emotions.', 'TCH001', '2025-06-20', '2025-06-20', 'Yes'],
    ['STU001', 'Term3', 'CMT002', 'Nathan is well-behaved and respectful in the boarding house.', 'TCH002', '2025-06-20', '2025-06-20', 'Yes'],
    ['STU001', 'Term3', 'CMT005', 'This is an outstanding performance. Keep it up!', 'ADMIN001', '2025-06-20', '2025-06-20', 'Yes']
  ];
}

function getHeadTeacherCommentsData() {
  return [
    ['Comment ID', 'Min Average', 'Max Average', 'Comment Text'],
    ['HT001', '0', '39', 'This is not a good result but there is still room for improvement. You need to wake up, play less and be diligent. I know you can make it.'],
    ['HT002', '40', '44', 'This is not a good result but there is still room for improvement. You need to wake up, play less and be diligent. I know you can make it.'],
    ['HT003', '45', '49', 'Your performance this term is not encouraging. I believe you can do better. I will be looking forward to a brilliant performance from you next term.'],
    ['HT004', '50', '59', 'You have just barely performed above average but you can do better. I expect significant improvement from you next term. Well done.'],
    ['HT005', '60', '69', 'This is a good result. You have performed reasonably well this term but there is still room for improvement. Well done.'],
    ['HT006', '70', '100', 'This is an outstanding performance. Keep it up!']
  ];
}

function getGradeColorsData() {
  return [
    ['Grade', 'Min Score', 'Max Score', 'Color Name', 'Hex Color', 'CSS Class'],
    ['A', '70', '100', 'Green', '#28a745', 'grade-a'],
    ['B', '60', '69', 'Light Green', '#8bc34a', 'grade-b'],
    ['C', '50', '59', 'Yellow', '#ffc107', 'grade-c'],
    ['D', '45', '49', 'Orange', '#fd7e14', 'grade-d'],
    ['E', '40', '44', 'Light Red', '#f44336', 'grade-e'],
    ['F', '0', '39', 'Red', '#d32f2f', 'grade-f']
  ];
}

function getStudentPinsData() {
  return [
    ['Student ID', 'Full Name', 'Class', 'Parent Email', 'Phone', 'PIN', 'PIN Generated Date', 'PIN Status', 'PIN Sent Via', 'PIN Sent Date', 'Label Printed'],
    ['STU001', 'AKINKUADE NATHAN', 'Year 4', 'nathan.parent@email.com', '08012345678', '482719', '2025-06-20', 'Active', 'Email', '2025-06-20', 'Yes'],
    ['STU002', 'ADEGBITE HAVILAH', 'Nursery A', 'havilah.parent@email.com', '08087654321', '935182', '2025-06-20', 'Active', 'Print', '2025-06-20', 'Yes'],
    ['STU003', 'DOE JOHN', 'Year 4', 'john.parent@email.com', '08011223344', '738192', '2025-06-20', 'Active', 'WhatsApp', '2025-06-20', 'No']
  ];
}

function getTermSettingsData() {
  return [
    ['Term', 'Start Date', 'End Date', 'Is Active', 'Weight', 'Is Cumulative'],
    ['Term1', '2024-09-01', '2024-12-15', 'No', '1', 'No'],
    ['Term2', '2025-01-05', '2025-04-10', 'No', '1', 'No'],
    ['Term3', '2025-04-28', '2025-07-20', 'Yes', '1', 'Yes']
  ];
}

function getSettingsData() {
  // Comprehensive settings list
  const settings = [
    ['School Name', 'L\'école Peniel'],
    ['Motto', 'Grooming the total child'],
    ['Address', 'Along AAUA Permanent Site Road, Akungba Akoko, Ondo State'],
    ['Phone', '08012345678'],
    ['Email', 'info@penielschool.com'],
    ['Current Term', 'Term3'],
    ['Academic Year', '2024/2025'],
    ['Next Term Begins', '2025-09-15'],
    ['School Logo URL', 'https://drive.google.com/uc?export=view&id=YOUR_LOGO_ID'],
    ['Logo Width', '150'],
    ['Logo Height', '150'],
    ['Report Background Color', '#ffffff'],
    ['Report Primary Color', '#1a237e'],
    ['Report Secondary Color', '#0d47a1'],
    ['Grade_A_Min', '70'],
    ['Grade_A_Max', '100'],
    ['Grade_B_Min', '60'],
    ['Grade_B_Max', '69'],
    ['Grade_C_Min', '50'],
    ['Grade_C_Max', '59'],
    ['Grade_D_Min', '45'],
    ['Grade_D_Max', '49'],
    ['Grade_E_Min', '40'],
    ['Grade_E_Max', '44'],
    ['Grade_F_Min', '0'],
    ['Grade_F_Max', '39'],
    ['Remark_Distinction_Min', '70'],
    ['Remark_VeryGood_Min', '60'],
    ['Remark_Credit_Min', '50'],
    ['Remark_Pass_Min', '40'],
    ['GPA_A_Min', '70'],
    ['GPA_B_Min', '60'],
    ['GPA_C_Min', '50'],
    ['GPA_D_Min', '45'],
    ['GPA_E_Min', '40'],
    ['GPA_F_Min', '0'],
    ['Promotion_Min_Average', '50'],
    ['Promotion_Min_Subjects_Pass', '5'],
    ['Watermark Text', 'DRAFT'],
    ['Watermark Opacity', '0.1'],
    ['Watermark Color', '#000000'],
    ['Show Watermark', 'Yes'],
    ['Transcript Title', 'Academic Transcript'],
    ['Transcript Subtitle', 'Official Record of Academic Performance'],
    ['Include GPA', 'Yes'],
    ['Include Grade', 'Yes'],
    ['Include Attendance', 'Yes'],
    ['Include Behavioral', 'No'],
    ['Include Comments', 'Yes'],
    ['Include School Logo', 'Yes'],
    ['Signature Line', 'Yes'],
    ['Date Format', 'DD/MM/YYYY'],
    ['Max Terms to Show', '3'],
    ['Show Class Rank', 'Yes'],
    ['Show School Name', 'Yes'],
    ['Transcript Footer', 'This is an official transcript'],
    ['Allow Parent Access', 'No'],
    ['Broadsheet Show Student Names', 'Yes'],
    ['Broadsheet Show Student IDs', 'Yes'],
    ['Broadsheet Show CA1', 'Yes'],
    ['Broadsheet Show CA2', 'Yes'],
    ['Broadsheet Show Exam', 'Yes'],
    ['Broadsheet Show Total', 'Yes'],
    ['Broadsheet Show Grade', 'Yes'],
    ['Broadsheet Show Subject Total', 'Yes'],
    ['Broadsheet Show Final Average', 'Yes'],
    ['Broadsheet Show Class Average', 'Yes'],
    ['Broadsheet Show Class Ranking', 'Yes'],
    ['Broadsheet Show GPA', 'Yes'],
    ['Broadsheet Show Attendance', 'Yes'],
    ['Broadsheet Include Subject Wise', 'Yes'],
    ['Broadsheet Include Student Wise', 'Yes'],
    ['Broadsheet Include Summary Row', 'Yes'],
    ['Broadsheet Include Headers', 'Yes'],
    ['Broadsheet Include School Name', 'Yes'],
    ['Broadsheet Include Date Generated', 'Yes'],
    ['Broadsheet Include Class Name', 'Yes'],
    ['Broadsheet Include Term', 'Yes'],
    ['Broadsheet Include Academic Year', 'Yes'],
    ['Broadsheet Include Footer', 'Yes'],
    ['Broadsheet Footer Text', 'Ministry of Education Approved']
  ];
  
  return settings;
}

function getPromotionHistoryData() {
  return [
    ['Student ID', 'From Class', 'To Class', 'Promotion Date', 'Academic Year'],
    ['STU001', 'Year 3', 'Year 4', '2024-07-15', '2023/2024'],
    ['STU001', 'Year 4', 'Year 5', '2025-07-15', '2024/2025']
  ];
}

function getGraduateRecordsData() {
  return [
    ['Student ID', 'Full Name', 'Graduation Class', 'Graduation Date', 'Academic Year', 'Final Average', 'Final Grade', 'Final GPA', 'Certificate Issued', 'Certificate Date', 'Transcript Generated'],
    ['STU005', 'BROWN MICHAEL', 'Year 5', '2025-07-15', '2024/2025', '83.2', 'A', '3.65', 'Yes', '2025-07-15', 'Yes']
  ];
}

function getTransferRecordsData() {
  return [
    ['Student ID', 'Full Name', 'Transfer Date', 'From Class', 'To School', 'School Address', 'School Phone', 'Transcript Requested', 'Transcript Sent', 'Transcript Date'],
    ['STU003', 'DOE JOHN', '2025-06-01', 'Year 4', 'Crown Heights School', '123 Main Street, Lagos', '08011223344', 'Yes', 'Yes', '2025-06-05']
  ];
}

function getTranscriptSettingsData() {
  return [
    ['Setting', 'Value', 'Category', 'Description'],
    ['Transcript Title', 'Academic Transcript', 'Display', 'Title of the transcript'],
    ['Transcript Subtitle', 'Official Record of Academic Performance', 'Display', 'Subtitle'],
    ['Include GPA', 'Yes', 'Content', 'Show GPA on transcript'],
    ['Include Grade', 'Yes', 'Content', 'Show grade on transcript'],
    ['Include Attendance', 'Yes', 'Content', 'Show attendance on transcript'],
    ['Include Behavioral', 'No', 'Content', 'Show behavioral on transcript'],
    ['Include Comments', 'Yes', 'Content', 'Show comments on transcript'],
    ['Include School Logo', 'Yes', 'Display', 'Show school logo'],
    ['Signature Line', 'Yes', 'Display', 'Show signature lines'],
    ['Date Format', 'DD/MM/YYYY', 'Format', 'Date display format'],
    ['Max Terms to Show', '3', 'Content', 'Number of terms to show'],
    ['Show Class Rank', 'Yes', 'Content', 'Show class ranking'],
    ['Show School Name', 'Yes', 'Display', 'Show school name'],
    ['Transcript Footer', 'This is an official transcript', 'Display', 'Footer text'],
    ['Watermark Text', 'TRANSCRIPT', 'Security', 'Watermark text'],
    ['Show Watermark', 'Yes', 'Security', 'Show watermark'],
    ['Allow Parent Access', 'No', 'Security', 'Parent can request transcript']
  ];
}

function getBroadsheetTemplateData() {
  return [
    ['Setting', 'Value', 'Category', 'Description', 'Display Order'],
    ['Show Student Names', 'Yes', 'Content', 'Show student names', '1'],
    ['Show Student IDs', 'Yes', 'Content', 'Show student IDs', '2'],
    ['Show CA1', 'Yes', 'Content', 'Show CA1 scores', '3'],
    ['Show CA2', 'Yes', 'Content', 'Show CA2 scores', '4'],
    ['Show Exam', 'Yes', 'Content', 'Show exam scores', '5'],
    ['Show Total', 'Yes', 'Content', 'Show subject totals', '6'],
    ['Show Grade', 'Yes', 'Content', 'Show subject grades', '7'],
    ['Show Subject Total', 'Yes', 'Content', 'Show total across subjects', '8'],
    ['Show Final Average', 'Yes', 'Content', 'Show final average', '9'],
    ['Show Class Average', 'Yes', 'Content', 'Show class average per subject', '10'],
    ['Show Class Ranking', 'Yes', 'Content', 'Show class ranking', '11'],
    ['Show GPA', 'Yes', 'Content', 'Show GPA', '12'],
    ['Show Attendance', 'Yes', 'Content', 'Show attendance', '13'],
    ['Include Subject Wise', 'Yes', 'Layout', 'Subjects as columns', '14'],
    ['Include Student Wise', 'Yes', 'Layout', 'Students as rows', '15'],
    ['Include Summary Row', 'Yes', 'Layout', 'Average row at bottom', '16'],
    ['Include Headers', 'Yes', 'Layout', 'Subject headers', '17'],
    ['Include School Name', 'Yes', 'Display', 'School name at top', '18'],
    ['Include Date Generated', 'Yes', 'Display', 'Date generated', '19'],
    ['Include Class Name', 'Yes', 'Display', 'Class name', '20'],
    ['Include Term', 'Yes', 'Display', 'Term name', '21'],
    ['Include Academic Year', 'Yes', 'Display', 'Academic year', '22'],
    ['Include Footer', 'Yes', 'Display', 'Footer text', '23'],
    ['Footer Text', 'Ministry of Education Approved', 'Display', 'Footer content', '24']
  ];
}

function getAcademicCalendarData() {
  return [
    ['Academic Year', 'Term', 'Start Date', 'End Date', 'Is Active', 'Is Completed', 'Graduation Class', 'School ID'],
    ['2023/2024', 'Term1', '2023-09-01', '2023-12-15', 'No', 'Yes', 'Year 5', 'SCH001'],
    ['2023/2024', 'Term2', '2024-01-05', '2024-04-10', 'No', 'Yes', 'Year 5', 'SCH001'],
    ['2023/2024', 'Term3', '2024-04-28', '2024-07-20', 'No', 'Yes', 'Year 5', 'SCH001'],
    ['2024/2025', 'Term1', '2024-09-01', '2024-12-15', 'No', 'Yes', 'Year 6', 'SCH001'],
    ['2024/2025', 'Term2', '2025-01-05', '2025-04-10', 'No', 'Yes', 'Year 6', 'SCH001'],
    ['2024/2025', 'Term3', '2025-04-28', '2025-07-20', 'Yes', 'No', 'Year 6', 'SCH001']
  ];
}

// ============================================
// ADDITIONAL UTILITY FUNCTIONS
// ============================================

/**
 * Reset all tabs (delete all and recreate)
 * WARNING: This will delete all data!
 */
function resetAllTabs() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '⚠️ DANGEROUS ACTION',
    'This will DELETE ALL TABS and recreate them with sample data.\n\n' +
    '⚠️ ALL EXISTING DATA WILL BE LOST FOREVER!\n\n' +
    'Are you sure you want to continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    ui.alert('Reset cancelled.');
    return;
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Delete all sheets except the first one
  const sheets = ss.getSheets();
  for (let i = 1; i < sheets.length; i++) {
    ss.deleteSheet(sheets[i]);
  }
  
  // Recreate all tabs
  createAllTabs(ss);
  
  ui.alert('✅ Reset Complete!', 'All tabs have been recreated.', ui.ButtonSet.OK);
}

/**
 * Add data validation to specific columns
 */
function addDataValidation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Add validation to Students: Status column
  const studentsSheet = ss.getSheetByName('Students');
  if (studentsSheet) {
    const statusRange = studentsSheet.getRange('G2:G');
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Active', 'Inactive', 'Graduated', 'Transferred'])
      .build();
    statusRange.setDataValidation(rule);
  }
  
  // Add validation to Teachers: Role column
  const teachersSheet = ss.getSheetByName('Teachers');
  if (teachersSheet) {
    const roleRange = teachersSheet.getRange('H2:H');
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['teacher', 'admin', 'super_admin'])
      .build();
    roleRange.setDataValidation(rule);
  }
  
  ui.alert('✅ Validation Added!', 'Data validation has been added to key columns.', ui.ButtonSet.OK);
}

/**
 * Create a custom menu in Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 School Report System')
    .addItem('🚀 Run Full Setup', 'runSetup')
    .addSeparator()
    .addItem('🔄 Reset All Tabs (DANGEROUS)', 'resetAllTabs')
    .addItem('✅ Add Data Validation', 'addDataValidation')
    .addSeparator()
    .addItem('📖 View Documentation', 'showDocumentation')
    .addToUi();
}

/**
 * Show documentation
 */
function showDocumentation() {
  const html = HtmlService.createHtmlOutput(`
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
          h1 { color: #1a237e; }
          h2 { color: #0d47a1; margin-top: 20px; }
          ul { margin: 10px 0; }
          .warning { background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107; }
          .success { background: #d4edda; padding: 10px; border-radius: 5px; border-left: 4px solid #28a745; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>📊 School Report System</h1>
        <p>Welcome to the School Report System setup assistant.</p>
        
        <div class="success">
          <strong>✅ Setup Complete!</strong><br>
          All 25 tabs have been created with headers and sample data.
        </div>
        
        <h2>📋 What's Been Created:</h2>
        <ul>
          <li><strong>Students</strong> - Student information</li>
          <li><strong>Teachers</strong> - Teacher information</li>
          <li><strong>Subjects</strong> - Subject list per class</li>
          <li><strong>Classes</strong> - Class promotion rules</li>
          <li><strong>Scores_Term1, Term2, Term3</strong> - Academic scores</li>
          <li><strong>BehavioralDomains</strong> - Behavioral domains configuration</li>
          <li><strong>BehavioralRubrics</strong> - Rating scale</li>
          <li><strong>BehavioralScores</strong> - Student behavioral scores</li>
          <li><strong>Attendance</strong> - Student attendance</li>
          <li><strong>CommentTypes</strong> - Comment types configuration</li>
          <li><strong>CommentSections</strong> - Comment display sections</li>
          <li><strong>Comments</strong> - Student comments</li>
          <li><strong>HeadTeacherComments</strong> - Predefined comments</li>
          <li><strong>GradeColors</strong> - Traffic light colors</li>
          <li><strong>StudentPins</strong> - Parent access PINs</li>
          <li><strong>TermSettings</strong> - Term configuration</li>
          <li><strong>Settings</strong> - School settings</li>
          <li><strong>PromotionHistory</strong> - Promotion records</li>
          <li><strong>GraduateRecords</strong> - Graduated students</li>
          <li><strong>TransferRecords</strong> - Transferred students</li>
          <li><strong>TranscriptSettings</strong> - Transcript configuration</li>
          <li><strong>BroadsheetTemplate</strong> - Broadsheet configuration</li>
          <li><strong>AcademicCalendar</strong> - Academic years and terms</li>
        </ul>
        
        <div class="warning">
          <strong>⚠️ Important:</strong><br>
          1. Update the <strong>Settings</strong> tab with your school information<br>
          2. Replace the <strong>School Logo URL</strong> with your actual logo<br>
          3. Update the <strong>HeadTeacherComments</strong> with your preferred comments<br>
          4. Customize <strong>GradeColors</strong> to match your school colors
        </div>
        
        <h2>🔗 Next Steps:</h2>
        <ol>
          <li>Review and update all sample data</li>
          <li>Copy your <strong>Spreadsheet ID</strong> from the URL</li>
          <li>Proceed to <strong>Phase 2: Google Apps Script Backend</strong></li>
        </ol>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Version 1.0 | School Report System
        </p>
      </body>
    </html>
  `);
  
  SpreadsheetApp.getUi().showSidebar(html);
}