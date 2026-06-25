// js/admin-settings.js
// ============================================
// Admin - School Settings Management
// ============================================

let allSettings = {};
let loadAttempted = false;

document.addEventListener('DOMContentLoaded', async function() {
    const adminSession = sessionStorage.getItem('adminSession');
    if (!adminSession) {
        window.location.href = 'admin-login.html';
        return;
    }

    // Initialize color pickers to show hex values
    initColorPickers();
    
    // Load settings
    await loadSettings();
});

// ============================================
// COLOR PICKER INIT
// ============================================

function initColorPickers() {
    // All color input IDs and their corresponding hex display spans
    const colorFields = [
        'gradeA_color', 'gradeB_color', 'gradeC_color', 'gradeD_color', 'gradeE_color', 'gradeF_color',
        'reportBgColor', 'reportPrimaryColor', 'reportSecondaryColor', 'watermarkColor',
        'colorA', 'colorB', 'colorC', 'colorD', 'colorE', 'colorF'
    ];
    
    colorFields.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                const hexSpan = document.getElementById(id + '_hex');
                if (hexSpan) {
                    hexSpan.textContent = this.value;
                }
            });
        }
    });
}

// ============================================
// LOAD SETTINGS
// ============================================

async function loadSettings() {
    try {
        const settings = await api.getSettings();
        allSettings = settings;
        loadAttempted = true;
        
        console.log('📋 Loaded settings:', settings);
        
        // Populate form fields
        populateSchoolInfo(settings);
        populateGrading(settings);
        populateColors(settings);
        populateReportDesign(settings);
        populateAcademic(settings);
        populateLogo(settings);
        
    } catch (error) {
        console.error('❌ Error loading settings:', error);
        showToast('Error loading settings: ' + error.message, 'danger');
    }
}

// ============================================
// POPULATE FUNCTIONS
// ============================================

function populateSchoolInfo(settings) {
    setValue('schoolName', settings['School_Name']);
    setValue('schoolMotto', settings['Motto']);
    setValue('schoolAddress', settings['Address']);
    setValue('schoolPhone', settings['Phone']);
    setValue('schoolEmail', settings['Email']);
}

function populateGrading(settings) {
    setValue('gradeA_min', settings['Grade_A_Min']);
    setValue('gradeA_max', settings['Grade_A_Max']);
    setValue('gradeB_min', settings['Grade_B_Min']);
    setValue('gradeB_max', settings['Grade_B_Max']);
    setValue('gradeC_min', settings['Grade_C_Min']);
    setValue('gradeC_max', settings['Grade_C_Max']);
    setValue('gradeD_min', settings['Grade_D_Min']);
    setValue('gradeD_max', settings['Grade_D_Max']);
    setValue('gradeE_min', settings['Grade_E_Min']);
    setValue('gradeE_max', settings['Grade_E_Max']);
    setValue('gradeF_min', settings['Grade_F_Min']);
    setValue('gradeF_max', settings['Grade_F_Max']);
}

function populateColors(settings) {
    // Grade colors from GradeColors sheet (loaded differently)
    // Use defaults from CONFIG if settings don't have them
    const gradeColors = {
        'colorA': '#28a745',
        'colorB': '#8bc34a',
        'colorC': '#ffc107',
        'colorD': '#fd7e14',
        'colorE': '#f44336',
        'colorF': '#d32f2f'
    };
    
    // Try to load from settings
    // Settings stored with key like "Color_A" or we rely on GradeColors sheet
    Object.entries(gradeColors).forEach(([id, defaultColor]) => {
        const input = document.getElementById(id);
        if (input && !input.value) {
            input.value = defaultColor;
            const hexSpan = document.getElementById(id + '_hex');
            if (hexSpan) hexSpan.textContent = defaultColor;
        }
    });
    
    // Grade-specific color pickers in grading table
    const gradingColors = {
        'gradeA_color': '#28a745',
        'gradeB_color': '#8bc34a',
        'gradeC_color': '#ffc107',
        'gradeD_color': '#fd7e14',
        'gradeE_color': '#f44336',
        'gradeF_color': '#d32f2f'
    };
    
    Object.entries(gradingColors).forEach(([id, defaultColor]) => {
        const input = document.getElementById(id);
        if (input && !input.value) {
            input.value = defaultColor;
            const hexSpan = document.getElementById(id + '_hex');
            if (hexSpan) hexSpan.textContent = defaultColor;
        }
    });
}

function populateReportDesign(settings) {
    setValue('reportBgColor', settings['Report_Background_Color'] || '#ffffff');
    setValue('reportPrimaryColor', settings['Report_Primary_Color'] || '#1a237e');
    setValue('reportSecondaryColor', settings['Report_Secondary_Color'] || '#0d47a1');
    setValue('watermarkText', settings['Watermark_Text']);
    setValue('watermarkOpacity', settings['Watermark_Opacity'] || '0.1');
    setValue('watermarkColor', settings['Watermark_Color'] || '#000000');
    
    // Update hex displays for color inputs
    ['reportBgColor', 'reportPrimaryColor', 'reportSecondaryColor', 'watermarkColor'].forEach(id => {
        const input = document.getElementById(id);
        if (input && input.value) {
            const hexSpan = document.getElementById(id + '_hex');
            if (hexSpan) hexSpan.textContent = input.value;
        }
    });
}

function populateAcademic(settings) {
    setValue('currentTerm', settings['Current_Term'] || 'Term3');
    setValue('academicYear', settings['Academic_Year']);
    setValue('nextTermDate', settings['Next_Term_Begins']);
}

function populateLogo(settings) {
    setValue('logoUrl', settings['School_Logo_URL']);
    setValue('logoWidth', settings['Logo_Width'] || '150');
    setValue('logoHeight', settings['Logo_Height'] || '150');
    
    // Preview logo if URL exists
    if (settings['School_Logo_URL']) {
        previewLogo();
    }
}

// ============================================
// SAVE SECTION
// ============================================

async function saveSection(section) {
    try {
        let data = {};
        
        switch (section) {
            case 'school':
                data = {
                    'School Name': getValue('schoolName'),
                    'Motto': getValue('schoolMotto'),
                    'Address': getValue('schoolAddress'),
                    'Phone': getValue('schoolPhone'),
                    'Email': getValue('schoolEmail')
                };
                break;
                
            case 'grading':
                data = {
                    'Grade_A_Min': getValue('gradeA_min'),
                    'Grade_A_Max': getValue('gradeA_max'),
                    'Grade_B_Min': getValue('gradeB_min'),
                    'Grade_B_Max': getValue('gradeB_max'),
                    'Grade_C_Min': getValue('gradeC_min'),
                    'Grade_C_Max': getValue('gradeC_max'),
                    'Grade_D_Min': getValue('gradeD_min'),
                    'Grade_D_Max': getValue('gradeD_max'),
                    'Grade_E_Min': getValue('gradeE_min'),
                    'Grade_E_Max': getValue('gradeE_max'),
                    'Grade_F_Min': getValue('gradeF_min'),
                    'Grade_F_Max': getValue('gradeF_max')
                };
                break;
                
            case 'colors':
                data = {
                    'Color_A': getColorValue('colorA'),
                    'Color_B': getColorValue('colorB'),
                    'Color_C': getColorValue('colorC'),
                    'Color_D': getColorValue('colorD'),
                    'Color_E': getColorValue('colorE'),
                    'Color_F': getColorValue('colorF')
                };
                break;
                
            case 'report':
                data = {
                    'Report Background Color': getColorValue('reportBgColor'),
                    'Report Primary Color': getColorValue('reportPrimaryColor'),
                    'Report Secondary Color': getColorValue('reportSecondaryColor'),
                    'Watermark Text': getValue('watermarkText'),
                    'Watermark Opacity': getValue('watermarkOpacity'),
                    'Watermark Color': getColorValue('watermarkColor')
                };
                break;
                
            case 'academic':
                data = {
                    'Current Term': getValue('currentTerm'),
                    'Academic Year': getValue('academicYear'),
                    'Next Term Begins': getValue('nextTermDate')
                };
                break;
                
            case 'logo':
                data = {
                    'School Logo URL': getValue('logoUrl'),
                    'Logo Width': getValue('logoWidth'),
                    'Logo Height': getValue('logoHeight')
                };
                break;
                
            default:
                showToast('Unknown section: ' + section, 'danger');
                return;
        }
        
        console.log(`📤 Saving ${section}:`, data);
        
        const result = await api.updateSettings(data);
        
        if (result.success) {
            showFeedback(section);
            showToast('✅ ' + getSectionTitle(section) + ' saved successfully!', 'success');
            
            // Update local settings cache
            Object.entries(data).forEach(([key, value]) => {
                const settingKey = key.replace(/\s/g, '_');
                allSettings[settingKey] = value;
            });
        } else {
            showToast('Error: ' + (result.error || 'Save failed'), 'danger');
        }
        
    } catch (error) {
        console.error('❌ Error saving section:', error);
        showToast('Error saving: ' + error.message, 'danger');
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null && value !== '') {
        el.value = value;
        
        // If it's a color input, update the hex display
        if (el.type === 'color') {
            const hexSpan = document.getElementById(id + '_hex');
            if (hexSpan) hexSpan.textContent = value;
        }
    }
}

function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

function getColorValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '#000000';
}

function showFeedback(section) {
    const feedback = document.getElementById('feedback-' + section);
    if (feedback) {
        feedback.classList.remove('d-none');
        setTimeout(() => {
            feedback.classList.add('d-none');
        }, 3000);
    }
}

function getSectionTitle(section) {
    const titles = {
        'school': 'School Information',
        'grading': 'Grading System',
        'colors': 'Traffic Light Colors',
        'report': 'Report Design',
        'academic': 'Academic Settings',
        'logo': 'School Logo'
    };
    return titles[section] || section;
}

function previewLogo() {
    const url = document.getElementById('logoUrl').value.trim();
    const preview = document.getElementById('logoPreview');
    
    if (!preview) return;
    
    if (url) {
        preview.innerHTML = `<img src="${url}" alt="School Logo" onerror="this.parentElement.innerHTML=this.parentElement.innerHTML; showLogoPlaceholder()">`;
    } else {
        showLogoPlaceholder();
    }
}

function showLogoPlaceholder() {
    const preview = document.getElementById('logoPreview');
    if (preview) {
        preview.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-school fa-2x d-block mb-2"></i>
                <span>Enter a URL above</span>
            </div>
        `;
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toastMessage');
    const body = document.getElementById('toastBody');
    if (!toast || !body) return;
    
    toast.className = `toast align-items-center text-white border-0 bg-${type}`;
    body.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function adminLogout() {
    sessionStorage.removeItem('adminSession');
    window.location.href = 'admin-login.html';
}