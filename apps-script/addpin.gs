function addPinRecords() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('StudentPins');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
        sheet = ss.insertSheet('StudentPins');
        Logger.log('✅ Created StudentPins sheet');
    }
    
    // Clear existing data
    sheet.clear();
    
    // Add headers
    const headers = ['Student ID', 'Full Name', 'Class', 'Parent Email', 'Phone', 'PIN', 'PIN Generated Date', 'PIN Status', 'PIN Sent Via', 'PIN Sent Date', 'Label Printed'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
    // Add PIN data
    const pins = [
        ['STU001', 'AKINKUADE NATHAN', 'Year 4', 'nathan.parent@email.com', '08012345678', '482719', '2026-06-20', 'Active', '', '', 'No'],
        ['STU002', 'ADEGBITE HAVILAH', 'Nursery A', 'havilah.parent@email.com', '08087654321', '935182', '2026-06-20', 'Active', '', '', 'No'],
        ['STU003', 'DOE JOHN', 'Year 4', 'john.parent@email.com', '08011223344', '738192', '2026-06-20', 'Active', '', '', 'No']
    ];
    
    sheet.getRange(2, 1, pins.length, pins[0].length).setValues(pins);
    
    // Auto-resize columns
    sheet.autoResizeColumn(1);
    sheet.autoResizeColumn(2);
    sheet.autoResizeColumn(3);
    sheet.autoResizeColumn(6);
    
    Logger.log(`✅ Added ${pins.length} PIN records`);
}