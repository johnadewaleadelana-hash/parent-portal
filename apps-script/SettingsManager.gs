// SettingsManager.gs - Settings Operations (FIXED VERSION)
// ============================================

class SettingsManager {
  
  constructor(schoolManager) {
    this.schoolManager = schoolManager;
    this.spreadsheet = schoolManager.spreadsheet;
    this.utils = schoolManager.utils;
  }
  
  getSettings() {
    try {
      Logger.log('🔍 Getting settings...');
      
      // Get data from Settings sheet
      const data = this.utils.getSheetData('Settings');
      Logger.log('📊 Raw settings data length:', data.length);
      
      if (!data || data.length === 0) {
        Logger.log('⚠️ No settings found, returning empty object');
        return {};
      }
      
      const settings = {};
      data.forEach(item => {
        if (item['Setting'] && item['Value']) {
          const key = item['Setting'].replace(/\s/g, '_');
          settings[key] = item['Value'];
          Logger.log('📋 Setting:', key, '=', item['Value']);
        }
      });
      
      Logger.log('✅ Loaded', Object.keys(settings).length, 'settings');
      return settings;
      
    } catch (error) {
      Logger.log('❌ getSettings Error:', error.message);
      Logger.log('Stack:', error.stack);
      return {};
    }
  }
  
  updateSettings(settings) {
    try {
      const sheet = this.spreadsheet.getSheetByName('Settings');
      if (!sheet) {
        return { success: false, error: 'Settings sheet not found' };
      }
      
      const allData = sheet.getDataRange().getValues();
      
      for (const [key, value] of Object.entries(settings)) {
        const settingKey = key.replace(/_/g, ' ');
        for (let i = 1; i < allData.length; i++) {
          if (allData[i][0] === settingKey) {
            sheet.getRange(i + 1, 2).setValue(value);
            break;
          }
        }
      }
      
      return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
      Logger.log('❌ updateSettings Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}