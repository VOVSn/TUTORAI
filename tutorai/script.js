// Global variable to hold translations
let translations = {};
const currentLanguage = 'en'; // Assuming 'en' is the primary/only language for now

// --- DOM Elements ---
const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const settingsTabButtons = document.querySelectorAll('.settings-tab-button');
const settingsTabContents = document.querySelectorAll('.settings-tab-content');
const themeSelector = document.getElementById('themeSelector'); // New theme selector
const markdownToggle = document.getElementById('markdownToggle');
const streamResponsesToggle = document.getElementById('streamResponsesToggle');
const body = document.body;
const ollamaEndpointInput = document.getElementById('ollamaEndpoint');
const ollamaModelInput = document.getElementById('ollamaModel');
const ollamaTemperatureInput = document.getElementById('ollamaTemperature');
const checkOllamaStatusBtn = document.getElementById('checkOllamaStatusBtn');
const ollamaStatusText = document.getElementById('ollamaStatusText');
const clearChatHistoryBtn = document.getElementById('clearChatHistoryBtn');
const chatMessagesContainer = document.querySelector('.chat-messages');
const sendButton = document.querySelector('.send-button');
const chatInput = document.querySelector('.chat-input');
const agentNameDiv = document.querySelector('.agent-name');
const agentStatusDiv = document.querySelector('.agent-status');

const attachFileBtn = document.getElementById('attachFileBtn');
const imageUpload = document.getElementById('imageUpload');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');

// About Popup Elements
const showAboutBtn = document.getElementById('showAboutBtn');
const aboutPopupOverlay = document.getElementById('aboutPopupOverlay');
const closeAboutPopup = document.getElementById('closeAboutPopup');

// Learner Stats Popup Elements
const showLearnerStatsBtn = document.getElementById('showLearnerStatsBtn');
const learnerStatsPopupOverlay = document.getElementById('learnerStatsPopupOverlay');
const closeLearnerStatsPopup = document.getElementById('closeLearnerStatsPopup');
const learnerStatsContent = document.getElementById('learnerStatsContent');

// --- Constants for File Storage and Ollama ---
const SETTINGS_FILE = 'tutorai_settings.json';
const CHAT_HISTORY_FILE = 'tutorai_chat_history.json';
const STUDENT_PROGRESSION_FILE = 'tutorai_student_progression.json'; // User state for tutoring

const DEFAULT_OLLAMA_TEMPERATURE = 0.3;
const MAX_HISTORY_FOR_PROMPT = 6;
const OLLAMA_CHECK_INTERVAL = 60000;
const PREVIEW_IMAGE_MAX_DIMENSION_PX = 300;
const OLLAMA_IMAGE_MAX_DIMENSION_PX = 512;
const IMAGE_QUALITY_PREVIEW = 0.85;
const IMAGE_QUALITY_OLLAMA = 0.9;
const DEFAULT_THEME = 'light';


// --- Application State (loaded from/saved to files) ---
let appSettings = { // Default structure for settings
    ollamaUserEndpoint: 'http://localhost:11434/api/generate',
    ollamaUserModel: 'gemma3:4b',
    ollamaTemperatureSetting: DEFAULT_OLLAMA_TEMPERATURE.toFixed(1),
    tutorAiChatMarkdownEnabled: true,
    currentTheme: DEFAULT_THEME, // Replaces tutorAiChatDarkModeEnabled
    tutorAiActiveSettingsTab: 'basic',
    tutorAiStreamResponsesEnabled: true
};
let chatHistory = [];
let user_state = null; // Tutoring state

// --- Runtime State (not persisted like above) ---
let isCheckingOllama = false;
let lastMessageDateString = '';
let isAiResponding = false;
let ollamaHeaderCheckIntervalId = null;
let isOllamaReachableForHeader = true;

let currentOriginalImageBase64DataUri = null;
let currentResizedPreviewDataUri = null;

// --- TUTORING FEATURE ---
const startStudyBtnMain = document.getElementById('startStudyBtnMain');
const clearLearningProgressBtn = document.getElementById('clearLearningProgressBtn');
const KNOWN_LANG = 'english'; // User's primary/known language, can be made configurable later
let isTutoringActive = false;
let isTutorResponding = false;
let currentLessonConfig = { learn_lang: null, input_lang: null, output_lang: null };
let lesson_sentences = [];
let current_sentence_index = 0;
let lesson_interactions = []; // For the current active lesson only
let expectedTutorResponseHandler = null; // Function pointer for next user input in tutor mode
const USER_STATE_VERSION = "1.1"; // For user_state schema management

// --- Pywebview API interaction ---
async function callPywebviewApi(methodName, ...args) {
    return new Promise((resolve, reject) => {
        if (window.pywebview && window.pywebview.api && typeof window.pywebview.api[methodName] === 'function') {
            window.pywebview.api[methodName](...args).then(resolve).catch(reject);
        } else {
            const checkInterval = setInterval(() => {
                if (window.pywebview && window.pywebview.api && typeof window.pywebview.api[methodName] === 'function') {
                    clearInterval(checkInterval);
                    window.pywebview.api[methodName](...args).then(resolve).catch(reject);
                }
            }, 100);
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error(`pywebview.api.${methodName} did not become available.`));
            }, 5000);
        }
    });
}

async function loadDataFromFile(filename, defaultValue = null) {
    try {
        const data = await callPywebviewApi('load_json_data', filename);
        console.log(`Data loaded from ${filename}:`, data);
        return data === null || data === undefined ? defaultValue : data;
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        displaySystemMessage("errorLoadingFile", { filename: filename, error: error.message });
        return defaultValue;
    }
}

async function saveDataToFile(filename, data) {
    try {
        const result = await callPywebviewApi('save_json_data', filename, data);
        if (result && result.success) {
            console.log(`Data saved to ${filename} successfully.`);
        } else {
            console.error(`Failed to save data to ${filename}:`, result ? result.message : "Unknown error");
            displaySystemMessage("errorSavingFile", { filename: filename, error: result ? result.message : "Unknown error" });
        }
        return result;
    } catch (error) {
        console.error(`Error saving ${filename}:`, error);
        displaySystemMessage("errorSavingFile", { filename: filename, error: error.message });
        return { success: false, message: error.message };
    }
}

async function deleteFile(filename) {
    try {
        const result = await callPywebviewApi('delete_data', filename);
        if (result && result.success) {
            console.log(`File ${filename} deleted successfully.`);
        } else {
            console.error(`Failed to delete ${filename}:`, result ? result.message : "Unknown error");
        }
        return result;
    } catch (error) {
        console.error(`Error deleting ${filename}:`, error);
        return { success: false, message: error.message };
    }
}

async function fetchTranslations() {
    try {
        const response = await fetch('translations.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}. Failed to fetch 'translations.json'.`);
        }
        const loadedTranslations = await response.json();
        if (typeof loadedTranslations !== 'object' || loadedTranslations === null || !loadedTranslations.en || Object.keys(loadedTranslations.en).length < 10) {
            console.warn("Translations file 'translations.json' loaded, but content seems invalid or incomplete:", loadedTranslations);
            throw new Error("Translations file content is invalid or incomplete.");
        }
        translations = loadedTranslations;
        console.info("Translations loaded successfully from translations.json.");
        return true;
    } catch (error) {
        console.error("Could not load or parse translations.json:", error);
        translations = {
            en: {
                pageTitle: "TUTORAI Chat (Default)",
                agentName: "TUTORAI (Default)",
                systemMsgTranslationsFailed: "Warning: UI translations failed to load. Some text may appear as placeholders or use default values. Please check the console (F12) for error details (e.g., if 'translations.json' was not found or is malformed).",
                ollamaError: "Error communicating with AI: {error} (Default)",
                errorLoadingFile: "Error loading {filename}: {error} (Default)",
                errorSavingFile: "Error saving {filename}: {error} (Default)",
                settingsTitle: "Settings (Default)",
                chatInputPlaceholder: "Ask TUTORAI something... (Default)",
                ollamaEndpointPlaceholder: "http://localhost:11434/api/generate",
                ollamaModelPlaceholder: "gemma3:4b",
                themeLabel: "Theme (Default)",
                themeLight: "Light (Default)",
                themeDark: "Dark (Default)",
                themeMemphis: "Memphis (Default)",
            }
        };
        console.warn("Using minimal fallback translations due to error with translations.json.");
        return false;
    }
}

// --- Translation Functions ---
function getTranslation(key, replacements = {}) {
    let translation = translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
    for (const placeholder in replacements) {
        translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return translation;
}

function applyTranslations() {
    document.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        const isButton = (el.tagName === 'INPUT' && el.type === 'button') || el.tagName === 'BUTTON';
        const isTitleElement = el.tagName === 'TITLE';
        const isOptionElement = el.tagName === 'OPTION';

        if (el.id === 'startStudyBtnMain') return; // Title handled by updateStudyButtonText

        if (isButton || isTitleElement || isOptionElement) { 
            el.textContent = getTranslation(key);
        } else if (el.hasAttribute('placeholder') && el.tagName === 'INPUT' && key) {
             el.placeholder = getTranslation(key);
        } else {
            el.textContent = getTranslation(key);
        }
    });

    if (agentNameDiv) agentNameDiv.textContent = getTranslation('agentName');
    setAgentStatus(isAiResponding ? 'typing' : (isTutoringActive ? 'tutoring' : 'active'));
    if (settingsButton) settingsButton.title = getTranslation('settingsTitle');
    if (ollamaEndpointInput && !ollamaEndpointInput.dataset.translateKey) ollamaEndpointInput.placeholder = getTranslation('ollamaEndpointPlaceholder');
    if (ollamaModelInput && !ollamaModelInput.dataset.translateKey) ollamaModelInput.placeholder = getTranslation('ollamaModelPlaceholder');
    if (attachFileBtn) attachFileBtn.title = getTranslation('attachFileTitle');
    if (chatInput && !chatInput.dataset.translateKey) chatInput.placeholder = isTutoringActive ? getTranslation('tutorChatInputPlaceholder') : getTranslation('chatInputPlaceholder');
    if (sendButton) sendButton.title = getTranslation('sendMessageTitle');
    if (showLearnerStatsBtn) showLearnerStatsBtn.title = getTranslation('viewLearningProgressTitle');

    if (ollamaStatusText && ollamaStatusText.dataset.key) {
        const currentStatusKey = ollamaStatusText.dataset.key;
        const currentReplacements = JSON.parse(ollamaStatusText.dataset.replacements || '{}');
        ollamaStatusText.textContent = getTranslation(currentStatusKey, currentReplacements);
    } else if (ollamaStatusText && !ollamaStatusText.textContent) {
         ollamaStatusText.textContent = '';
    }
    if (!isAiResponding && !isTutoringActive) {
        updateAgentHeaderStatus();
    }
    updateStudyButtonText();
}


// --- Utility Functions ---
function scrollToBottom() {
    if (chatMessagesContainer) {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
}

function updateAgentHeaderStatus() {
    if (isTutoringActive) {
        if (agentStatusDiv) {
            agentStatusDiv.classList.remove('reachable', 'not-reachable');
            agentStatusDiv.classList.add('tutoring');
            agentStatusDiv.textContent = getTranslation('agentStatusTutoring');
        }
        return;
    }
    if (agentStatusDiv) {
        agentStatusDiv.classList.remove('reachable', 'not-reachable', 'tutoring');
        if (isOllamaReachableForHeader) {
            agentStatusDiv.textContent = getTranslation('agentStatusActive');
            agentStatusDiv.classList.add('reachable');
        } else {
            agentStatusDiv.textContent = getTranslation('agentStatusNotReachable');
            agentStatusDiv.classList.add('not-reachable');
        }
    }
}

function setAgentStatus(statusKey) {
    if (agentStatusDiv) {
        agentStatusDiv.classList.remove('reachable', 'not-reachable', 'tutoring');
        let statusText = '';
        switch (statusKey) {
            case 'typing':
                statusText = getTranslation('agentStatusTyping');
                break;
            case 'tutoring':
                statusText = getTranslation('agentStatusTutoring');
                agentStatusDiv.classList.add('tutoring');
                break;
            case 'active':
            default:
                updateAgentHeaderStatus();
                return;
        }
        agentStatusDiv.textContent = statusText;
    }
}


// --- Popup Management ---
function openPopup(overlayElement) {
    if (settingsPanel && settingsPanel.classList.contains('is-open')) {
        settingsPanel.classList.remove('is-open');
    }
    if (overlayElement) {
        overlayElement.classList.add('is-open');
    }
}
function closePopup(overlayElement) {
    if (overlayElement) overlayElement.classList.remove('is-open');
}

if (showAboutBtn && aboutPopupOverlay && closeAboutPopup) {
    showAboutBtn.addEventListener('click', () => openPopup(aboutPopupOverlay));
    closeAboutPopup.addEventListener('click', () => closePopup(aboutPopupOverlay));
    aboutPopupOverlay.addEventListener('click', (event) => {
        if (event.target === aboutPopupOverlay) closePopup(aboutPopupOverlay);
    });
}

// Learner Stats Popup Logic
function displayLearnerStats() {
    if (!learnerStatsPopupOverlay || !learnerStatsContent) {
        console.warn("Learner stats popup elements (overlay or content) not found. Cannot display stats.");
        return;
    }
    learnerStatsContent.innerHTML = '';
    if (!user_state || !user_state.version || user_state.version !== USER_STATE_VERSION || Object.keys(user_state.language_proficiency).length === 0) {
        learnerStatsContent.innerHTML = `<p>${getTranslation('noLearningDataFound')}</p>`;
        openPopup(learnerStatsPopupOverlay);
        return;
    }
    try {
        let html = '';
        if (user_state.language_proficiency && Object.keys(user_state.language_proficiency).length > 0) {
            html += `<h4>${getTranslation('languagesPracticedTitle')}</h4><ul>`;
            for (const lang in user_state.language_proficiency) {
                if (Object.prototype.hasOwnProperty.call(user_state.language_proficiency, lang)) {
                    const prof = user_state.language_proficiency[lang];
                    let accuracyToDisplay = 0;
                    if (prof.overall_accuracy_estimate) {
                        let val = parseFloat(prof.overall_accuracy_estimate);
                        if (isNaN(val)) val = 0;
                        accuracyToDisplay = Math.max(0, Math.min(100, val * 100));
                    }
                    html += `<li><strong>${lang.charAt(0).toUpperCase() + lang.slice(1)}:</strong>
                                Level ${prof.level ? prof.level.toFixed(2) : 'N/A'},
                                Accuracy: ${accuracyToDisplay.toFixed(1)}%,
                                Streak: ${prof.correct_streak_session || 0}
                             </li>`;
                    if (prof.strengths && Array.isArray(prof.strengths) && prof.strengths.length > 0) {
                        html += `<p style="font-size:0.9em; margin-left: 20px;"><em>Strengths:</em> ${prof.strengths.join(', ')}</p>`;
                    }
                    if (prof.weaknesses && Array.isArray(prof.weaknesses) && prof.weaknesses.length > 0) {
                        html += `<p style="font-size:0.9em; margin-left: 20px;"><em>Weaknesses:</em> ${prof.weaknesses.join(', ')}</p>`;
                    }
                }
            }
            html += `</ul>`;
        } else {
            html += `<p>${getTranslation('noLanguagesPracticedYet')}</p>`;
        }

        // Enhanced check for learning_focus
        if (user_state.learning_focus && typeof user_state.learning_focus === 'object' &&
            !Array.isArray(user_state.learning_focus) && Object.keys(user_state.learning_focus).length > 0) {
            let hasFocus = false;
            let focusHtml = `<hr><h4>${getTranslation('currentLearningFocusTitle')}</h4>`;
            for (const lang in user_state.learning_focus) {
                if (Object.prototype.hasOwnProperty.call(user_state.learning_focus, lang)) {
                    // Ensure user_state.learning_focus[lang] is an array before calling .join
                    if (user_state.learning_focus[lang] && Array.isArray(user_state.learning_focus[lang]) && user_state.learning_focus[lang].length > 0) {
                        focusHtml += `<p><strong>${lang.charAt(0).toUpperCase() + lang.slice(1)}:</strong> ${user_state.learning_focus[lang].join(', ')}</p>`;
                        hasFocus = true;
                    }
                }
            }
            if (hasFocus) html += focusHtml;
        }


        if (user_state.lesson_history_summary && user_state.lesson_history_summary.length > 0) {
            html += `<hr><h4>${getTranslation('lessonHistoryTitle')}</h4><ul>`;
            const recentHistory = user_state.lesson_history_summary.slice(-5).reverse();
            recentHistory.forEach(item => {
                const d = new Date(item.date_utc);
                const dateDisplay = (item.date_utc && !isNaN(d.getTime())) ? d.toLocaleDateString(currentLanguage, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                html += `<li><strong>${dateDisplay} (${item.learn_lang || 'N/A'} via ${item.lang_pair || 'N/A'}):</strong> ${item.key_takeaway || 'No summary.'}</li>`;
            });
            html += `</ul>`;
        }
        learnerStatsContent.innerHTML = html || `<p>${getTranslation('noLearningDataFound')}</p>`;
        openPopup(learnerStatsPopupOverlay);

    } catch (e) {
        console.error("Error processing user_state for stats:", e);
        learnerStatsContent.innerHTML = `<p>${getTranslation('errorLoadingLearningData')}</p>`;
        openPopup(learnerStatsPopupOverlay);
    }
}

if (showLearnerStatsBtn && learnerStatsPopupOverlay && closeLearnerStatsPopup) {
    showLearnerStatsBtn.addEventListener('click', displayLearnerStats);
    closeLearnerStatsPopup.addEventListener('click', () => closePopup(learnerStatsPopupOverlay));
    learnerStatsPopupOverlay.addEventListener('click', (event) => {
        if (event.target === learnerStatsPopupOverlay) closePopup(learnerStatsPopupOverlay);
    });
}

// --- Settings Panel Logic ---
async function setActiveSettingsTab(tabName) {
    settingsTabButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });
    settingsTabContents.forEach(content => {
        content.classList.toggle('active', content.id === `settings-tab-${tabName}`);
    });
    appSettings.tutorAiActiveSettingsTab = tabName;
    await saveAllAppSettings();
}

if (settingsButton && settingsPanel) {
    settingsButton.addEventListener('click', async function(event) {
        event.stopPropagation();
        const isOpening = !settingsPanel.classList.contains('is-open');
        if (isOpening) {
            closePopup(aboutPopupOverlay);
            closePopup(learnerStatsPopupOverlay);
        }
        settingsPanel.classList.toggle('is-open');

        if (settingsPanel.classList.contains('is-open')) {
            setActiveSettingsTab(appSettings.tutorAiActiveSettingsTab || 'basic');
        }
    });

    settingsTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveSettingsTab(button.dataset.tab);
        });
    });

    document.addEventListener('click', function(event) {
        if (settingsPanel.classList.contains('is-open')) {
            const isClickInsidePanel = settingsPanel.contains(event.target);
            const isClickOnButton = settingsButton.contains(event.target) || event.target === settingsButton;
            if (!isClickInsidePanel && !isClickOnButton) {
                settingsPanel.classList.remove('is-open');
            }
        }
    });
}

const allInteractiveButtons = document.querySelectorAll('.circle-button, .send-button, .header-icon-button, .settings-button');
allInteractiveButtons.forEach(button => {
    if (button.disabled) return;
    button.addEventListener('mousedown', () => { if(!button.disabled) button.classList.add('active')});
    button.addEventListener('mouseup', () => button.classList.remove('active'));
    button.addEventListener('mouseleave', () => button.classList.remove('active'));
});


// --- Settings Management ---
async function saveAllAppSettings() {
    await saveDataToFile(SETTINGS_FILE, appSettings);
}

function applyTheme(themeName) {
    body.classList.remove('light-mode', 'dark-mode', 'memphis-mode');
    if (themeName !== 'light') { 
        body.classList.add(themeName + '-mode');
    }
    console.log("Theme applied:", themeName);
}

function loadAndApplyAppSettings() {
    if (appSettings.hasOwnProperty('tutorAiChatDarkModeEnabled') && !appSettings.hasOwnProperty('currentTheme')) {
        appSettings.currentTheme = appSettings.tutorAiChatDarkModeEnabled ? 'dark' : 'light';
        delete appSettings.tutorAiChatDarkModeEnabled; 
        console.log("Migrated dark mode setting to currentTheme:", appSettings.currentTheme);
    }
    if (!appSettings.currentTheme) { 
        appSettings.currentTheme = DEFAULT_THEME;
    }

    if (ollamaEndpointInput) ollamaEndpointInput.value = appSettings.ollamaUserEndpoint;
    if (ollamaModelInput) ollamaModelInput.value = appSettings.ollamaUserModel;
    if (ollamaTemperatureInput) {
        let tempToSet = parseFloat(appSettings.ollamaTemperatureSetting);
        if (isNaN(tempToSet) || tempToSet < 0.1 || tempToSet > 1.0) {
            tempToSet = DEFAULT_OLLAMA_TEMPERATURE;
        }
        ollamaTemperatureInput.value = tempToSet.toFixed(1);
        appSettings.ollamaTemperatureSetting = tempToSet.toFixed(1);
    }

    if (themeSelector) {
        themeSelector.value = appSettings.currentTheme;
        applyTheme(appSettings.currentTheme);
    }

    if (markdownToggle) {
        markdownToggle.checked = appSettings.tutorAiChatMarkdownEnabled;
    }
    if (streamResponsesToggle) {
        streamResponsesToggle.checked = appSettings.tutorAiStreamResponsesEnabled;
    }
    setActiveSettingsTab(appSettings.tutorAiActiveSettingsTab || 'basic');
}

if (themeSelector) {
    themeSelector.addEventListener('change', async function() {
        const newTheme = this.value;
        appSettings.currentTheme = newTheme;
        applyTheme(newTheme);
        await saveAllAppSettings();
    });
}

if (markdownToggle) {
    markdownToggle.addEventListener('change', async function() {
        appSettings.tutorAiChatMarkdownEnabled = this.checked;
        await saveAllAppSettings();
    });
}

if (streamResponsesToggle) {
    streamResponsesToggle.addEventListener('change', async function() {
        appSettings.tutorAiStreamResponsesEnabled = this.checked;
        await saveAllAppSettings();
    });
}

if (ollamaEndpointInput) {
    ollamaEndpointInput.addEventListener('change', async () => {
        appSettings.ollamaUserEndpoint = ollamaEndpointInput.value;
        await saveAllAppSettings();
    });
}
if (ollamaModelInput) {
    ollamaModelInput.addEventListener('change', async () => {
        appSettings.ollamaUserModel = ollamaModelInput.value;
        await saveAllAppSettings();
    });
}
if (ollamaTemperatureInput) {
    ollamaTemperatureInput.addEventListener('input', (e) => {
        if (e.target.value.includes(',')) {
            e.target.value = e.target.value.replace(',', '.');
        }
    });
    ollamaTemperatureInput.addEventListener('change', async () => {
        let tempValue = parseFloat(ollamaTemperatureInput.value);
        if (isNaN(tempValue) || tempValue < 0.1) tempValue = 0.1;
        else if (tempValue > 1.0) tempValue = 1.0;
        ollamaTemperatureInput.value = tempValue.toFixed(1);
        appSettings.ollamaTemperatureSetting = tempValue.toFixed(1);
        await saveAllAppSettings();
    });
}

function setOllamaStatusPanelText(key, replacements = {}, typeClass = '') {
    if(!ollamaStatusText) return;
    ollamaStatusText.textContent = getTranslation(key, replacements);
    ollamaStatusText.className = `status-text ${typeClass}`;
    ollamaStatusText.dataset.key = key;
    ollamaStatusText.dataset.replacements = JSON.stringify(replacements);
}

async function _performOllamaReachabilityTest() {
    const endpointUrlFromInput = appSettings.ollamaUserEndpoint || 'http://localhost:11434/api/generate';
    let ollamaBaseUrlToTest;
    try {
        const parsedUrl = new URL(endpointUrlFromInput);
        ollamaBaseUrlToTest = parsedUrl.origin;
    } catch (e) {
        console.warn("Invalid Ollama endpoint URL:", endpointUrlFromInput, e);
        return { reachable: false, errorType: 'invalid_url' };
    }
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(ollamaBaseUrlToTest, { method: 'GET', mode: 'cors', signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
            const responseText = await response.text();
            if (responseText.toLowerCase().includes("ollama is running")) {
               return { reachable: true, status: 'running' };
            } else {
               return { reachable: true, status: 'ok_unexpected_content' };
            }
        } else {
            return { reachable: false, errorType: 'http_error', statusCode: response.status };
        }
    } catch (error) {
        console.warn('Ollama reachability test failed:', error);
         return { reachable: false, errorType: error.name === 'AbortError' ? 'timeout' : 'fetch_error', errorName: error.name };
    }
}

if (checkOllamaStatusBtn && ollamaStatusText) {
    checkOllamaStatusBtn.addEventListener('click', async () => {
        if (isCheckingOllama || isTutoringActive) return;
        isCheckingOllama = true;
        stopPeriodicOllamaHeaderCheck();
        setOllamaStatusPanelText('ollamaStatusChecking', {}, 'checking');
        checkOllamaStatusBtn.disabled = true;
        const result = await _performOllamaReachabilityTest();
        if (result.reachable) {
            if (result.status === 'running') {
                setOllamaStatusPanelText('ollamaStatusRunning', {}, 'success');
            } else {
                setOllamaStatusPanelText('ollamaStatusOKUnexpected', {}, 'success');
            }
        } else {
            if (result.errorType === 'invalid_url') {
                setOllamaStatusPanelText('ollamaStatusInvalidURL', {}, 'error');
            } else if (result.errorType === 'http_error') {
                 setOllamaStatusPanelText('ollamaStatusReachableWithCode', { status: result.statusCode }, 'error');
            } else {
                setOllamaStatusPanelText('ollamaStatusNotReachable', {}, 'error');
            }
        }
        isOllamaReachableForHeader = result.reachable;
        updateAgentHeaderStatus();
        isCheckingOllama = false;
        checkOllamaStatusBtn.disabled = false;
        startPeriodicOllamaHeaderCheck();
        setTimeout(() => {
            if (ollamaStatusText.dataset.key && settingsPanel.classList.contains('is-open')) {
                setOllamaStatusPanelText('', {}, '');
            }
        }, 5000);
    });
}

async function checkOllamaForHeaderUpdate() {
    if (isAiResponding || isCheckingOllama || isTutoringActive) return;
    const result = await _performOllamaReachabilityTest();
    isOllamaReachableForHeader = result.reachable;
    if (!isAiResponding) {
         updateAgentHeaderStatus();
    }
}

function startPeriodicOllamaHeaderCheck() {
    if (ollamaHeaderCheckIntervalId) clearInterval(ollamaHeaderCheckIntervalId);
    ollamaHeaderCheckIntervalId = setInterval(checkOllamaForHeaderUpdate, OLLAMA_CHECK_INTERVAL);
}

function stopPeriodicOllamaHeaderCheck() {
    if (ollamaHeaderCheckIntervalId) clearInterval(ollamaHeaderCheckIntervalId);
    ollamaHeaderCheckIntervalId = null;
}

// --- Image Upload Handling ---
async function resizeImage(originalDataUri, maxWidth, maxHeight, quality = 0.9, outputFormat = 'image/jpeg') {
    return new Promise((resolve, reject) => {
        if (!originalDataUri) {
            reject(new Error("Original data URI is null or undefined."));
            return;
        }
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                if (width / maxWidth > height / maxHeight) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                } else {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }
            width = Math.max(1, width);
            height = Math.max(1, height);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL(outputFormat, quality));
        };
        img.onerror = (err) => {
            console.error("Image load error for resizing:", err, originalDataUri ? originalDataUri.substring(0,100) : "undefined URI");
            reject(err);
        };
        img.src = originalDataUri;
    });
}
async function generateResizedPreview(originalDataUri) {
    return resizeImage(originalDataUri, PREVIEW_IMAGE_MAX_DIMENSION_PX, PREVIEW_IMAGE_MAX_DIMENSION_PX, IMAGE_QUALITY_PREVIEW);
}
function clearSelectedImageState() {
    currentOriginalImageBase64DataUri = null;
    currentResizedPreviewDataUri = null;
    if(imagePreview) imagePreview.src = '#';
    if(imagePreviewContainer) imagePreviewContainer.style.display = 'none';
    if (imageUpload) imageUpload.value = '';
}
if (attachFileBtn && imageUpload && imagePreviewContainer && imagePreview && removeImageBtn) {
    attachFileBtn.addEventListener('click', () => {
        if (isTutoringActive) return;
        imageUpload.click();
    });
    imageUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                currentOriginalImageBase64DataUri = e.target.result;
                imagePreview.src = currentOriginalImageBase64DataUri;
                imagePreviewContainer.style.display = 'block';
                currentResizedPreviewDataUri = null;
                try {
                    currentResizedPreviewDataUri = await generateResizedPreview(currentOriginalImageBase64DataUri);
                } catch (error) {
                    console.error("Error generating resized preview for history:", error);
                    currentResizedPreviewDataUri = currentOriginalImageBase64DataUri;
                }
            }
            reader.readAsDataURL(file);
        } else {
            clearSelectedImageState();
        }
    });
    removeImageBtn.addEventListener('click', () => {
        clearSelectedImageState();
    });
}

// --- Chat History and Messaging ---
function displaySystemMessage(translationKey, replacements = {}) {
    const text = getTranslation(translationKey, replacements);
    const systemMessageDiv = document.createElement('div');
    systemMessageDiv.classList.add('system-message');
    systemMessageDiv.textContent = text;
    if(chatMessagesContainer) chatMessagesContainer.appendChild(systemMessageDiv);
    scrollToBottom();
}

function formatDateForDisplay(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return getTranslation('dateToday');
    if (date.toDateString() === yesterday.toDateString()) return getTranslation('dateYesterday');
    return date.toLocaleDateString(currentLanguage, { year: 'numeric', month: 'long', day: 'numeric' });
}

function addDateSeparator(timestamp) {
    const messageDate = new Date(timestamp);
    const messageDateStr = messageDate.toDateString();
    if (messageDateStr !== lastMessageDateString) {
        const separatorDiv = document.createElement('div');
        separatorDiv.classList.add('date-separator');
        const dateTextNode = document.createTextNode(formatDateForDisplay(timestamp));
        separatorDiv.appendChild(dateTextNode);
        if(chatMessagesContainer) chatMessagesContainer.appendChild(separatorDiv);
        lastMessageDateString = messageDateStr;
    }
}

function formatAiMessageContent(text) {
    const useMarkdown = appSettings.tutorAiChatMarkdownEnabled;
    if (useMarkdown && typeof marked !== 'undefined') {
        try {
            return marked.parse(text, { breaks: true, gfm: true });
        } catch (e) {
            console.error("[MarkdownDebug] Error in marked.parse:", e);
            const tempDiv = document.createElement('div');
            tempDiv.textContent = text;
            return tempDiv.innerHTML.replace(/\n/g, '<br>');
        }
    } else {
        const tempDiv = document.createElement('div');
        tempDiv.textContent = text;
        return tempDiv.innerHTML.replace(/\n/g, '<br>');
    }
}

function renderMessageToDOM(messageData, isStreamingPlaceholder = false) {
    addDateSeparator(messageData.timestamp);
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', messageData.type);
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    let displayText = messageData.text || "";

    if (messageData.type === 'ai' || messageData.type === 'tutor') {
        contentDiv.innerHTML = formatAiMessageContent(displayText.trim());
    } else if (messageData.type === 'user') {
        if (messageData.imageBase64) {
            const imgPreviewElement = document.createElement('img');
            imgPreviewElement.src = messageData.imageBase64;
            imgPreviewElement.alt = getTranslation('userImagePreviewAlt');
            imgPreviewElement.classList.add('message-image-preview');
            contentDiv.appendChild(imgPreviewElement);
        } else if (messageData.hasImage) {
            const svgIconNS = "http://www.w3.org/2000/svg";
            const svgIcon = document.createElementNS(svgIconNS, "svg");
            svgIcon.setAttribute("viewBox", "0 0 24 24");
            svgIcon.classList.add('message-image-fallback-icon');
            const path = document.createElementNS(svgIconNS, "path");
            path.setAttribute("d", "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z");
            svgIcon.appendChild(path);
            contentDiv.appendChild(svgIcon);
        }
        if (displayText.trim()) {
            const textNode = document.createTextNode(displayText);
            contentDiv.appendChild(textNode);
        }
    } else {
        contentDiv.textContent = displayText;
    }
    messageDiv.appendChild(contentDiv);
    const timeDiv = document.createElement('div');
    timeDiv.classList.add('message-time');
    if (!isStreamingPlaceholder) {
        timeDiv.textContent = new Date(messageData.timestamp).toLocaleTimeString(currentLanguage, { hour: 'numeric', minute: '2-digit' });
    }
    messageDiv.appendChild(timeDiv);
    if(chatMessagesContainer) chatMessagesContainer.appendChild(messageDiv);
    return messageDiv;
}

async function saveMessageToHistory(messageData) {
    chatHistory.push(messageData);
    await saveDataToFile(CHAT_HISTORY_FILE, chatHistory);
}

async function addNewMessage(text, type, hasImage = false, imageBase64ForHistory = null) {
    if (type !== 'user' && (!text || (typeof text === 'string' && !text.trim())) ) {
         if (!hasImage) return null;
    }
    if (type === 'user' && !text.trim() && !hasImage) {
        return null;
    }
    const messageData = {
        text: text,
        type: type,
        hasImage: hasImage,
        imageBase64: imageBase64ForHistory,
        timestamp: Date.now()
    };
    const isPlaceholder = (type === 'ai' && !text && appSettings.tutorAiStreamResponsesEnabled);
    const messageElement = renderMessageToDOM(messageData, isPlaceholder);

    if (type === 'user' || type === 'tutor' || (type === 'ai' && !isPlaceholder)) {
        await saveMessageToHistory(messageData);
    }
    scrollToBottom();
    return messageElement;
}

async function loadChatHistoryFromFile() {
    if (!chatMessagesContainer) return;
    chatMessagesContainer.innerHTML = '';
    lastMessageDateString = '';

    if (chatHistory && chatHistory.length > 0) {
        chatHistory.forEach(msgData => {
            msgData.hasImage = msgData.hasImage || false;
            msgData.imageBase64 = msgData.imageBase64 || null;
            renderMessageToDOM(msgData);
        });
        displaySystemMessage("systemMsgLoadedFromFile", { filename: CHAT_HISTORY_FILE });
    } else {
         displaySystemMessage("systemMsgNoHistory");
    }
    scrollToBottom();
}

if (clearChatHistoryBtn) {
    clearChatHistoryBtn.addEventListener('click', async () => {
        if (isTutoringActive) {
            alert(getTranslation("clearHistoryFailTutoringActive", {}));
            return;
        }
        if (confirm(getTranslation('confirmClearHistory'))) {
            chatHistory = [];
            await saveDataToFile(CHAT_HISTORY_FILE, []);
            if(chatMessagesContainer) chatMessagesContainer.innerHTML = '';
            lastMessageDateString = '';
            displaySystemMessage("systemMsgHistoryCleared");
            if (settingsPanel && settingsPanel.classList.contains('is-open')) {
                settingsPanel.classList.remove('is-open');
            }
        }
    });
}

// --- Ollama Integration (General Chat) ---
function getChatHistoryForPrompt() {
    const recentMessages = chatHistory
        .filter(msg => msg.type === 'user' || msg.type === 'ai' || msg.type === 'tutor')
        .slice(-MAX_HISTORY_FOR_PROMPT);

    const userLabel = getTranslation('ollamaPromptUserLabel');
    const aiLabel = getTranslation('ollamaPromptAiLabel');

    return recentMessages.map(msg => {
        const prefix = (msg.type === 'user') ? userLabel : aiLabel;
        let messageContent = msg.text || "";
        if (msg.type === 'user' && msg.hasImage && !msg.text.trim()) {
            messageContent = `[${getTranslation('userImageContextInPrompt', {altText: getTranslation('userImagePreviewAlt')})}]`;
        }
        return `${prefix}: ${messageContent}`;
    }).join('\n');
}

function constructOllamaPrompt(userInput, chatHistoryString, currentMessageHasImage) {
    const systemPrompt = getTranslation('ollamaPromptSystem');
    const userLabel = getTranslation('ollamaPromptUserLabel');
    const aiLabel = getTranslation('ollamaPromptAiLabel');
    let fullPrompt = `${systemPrompt}\n\n`;
    if (chatHistoryString) {
        fullPrompt += `Previous conversation:\n${chatHistoryString}\n\n`;
    }
    let currentUserInputLine = `${userLabel}: `;
    if (currentMessageHasImage) {
        currentUserInputLine += `[${getTranslation('userImageContextInPrompt', {altText: getTranslation('userImagePreviewAlt')})}] `;
    }
    currentUserInputLine += (userInput || "");
    fullPrompt += `${currentUserInputLine}\n${aiLabel}:`;
    return fullPrompt;
}

async function callOllamaApi(promptText, onTokenCallback, imageBase64Payload = null) {
    const endpoint = appSettings.ollamaUserEndpoint || 'http://localhost:11434/api/generate';
    const model = appSettings.ollamaUserModel || 'gemma3:4b';
    const stream = appSettings.tutorAiStreamResponsesEnabled;
    let temperatureValue = parseFloat(appSettings.ollamaTemperatureSetting);
    if (isNaN(temperatureValue) || temperatureValue < 0.1 || temperatureValue > 1.0) {
        temperatureValue = DEFAULT_OLLAMA_TEMPERATURE;
    }

    const requestPayload = {
        model: model,
        prompt: promptText,
        stream: stream,
        options: { temperature: temperatureValue }
    };
    if (imageBase64Payload) {
        requestPayload.images = [imageBase64Payload];
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(requestPayload),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error structure" }));
            throw new Error(`Ollama API Error: ${response.status} - ${errorData.error || response.statusText}`);
        }
        if (stream && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                    try {
                        const jsonResponse = JSON.parse(line);
                        if (jsonResponse.response) {
                            onTokenCallback(jsonResponse.response);
                        }
                        if (jsonResponse.done) {
                            return;
                        }
                    } catch (e) {
                        console.warn("Error parsing streamed JSON line:", line, e);
                    }
                }
            }
            return;
        } else {
            const data = await response.json();
            return data.response;
        }
    } catch (error) {
        console.error("Error calling Ollama API:", error);
        isOllamaReachableForHeader = false;
        updateAgentHeaderStatus();
        throw error;
    }
}

function createVisualAiMessage() {
    const timestamp = Date.now();
    addDateSeparator(timestamp);
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'ai');
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerHTML = '';
    messageDiv.appendChild(contentDiv);
    const timeDiv = document.createElement('div');
    timeDiv.classList.add('message-time');
    messageDiv.appendChild(timeDiv);
    if(chatMessagesContainer) chatMessagesContainer.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
}

// --- TUTORING FEATURE IMPLEMENTATION ---
function getDefaultUserState() {
    return {
        version: USER_STATE_VERSION,
        user_preferences: {
            default_input_lang: null,
            default_output_lang: KNOWN_LANG,
            last_learn_lang: null,
            last_input_lang: null,
            last_output_lang: null,
        },
        language_proficiency: {},
        learning_focus: {}, // Expects an object: { lang: [focus1, focus2], ... }
        lesson_history_summary: [], 
        current_lesson_data: { 
            learn_lang: null,
            input_lang: null,
            output_lang: null,
            interactions: [] 
        }
    };
}

async function loadUserStateFromFile() {
    console.log(`Attempting to load student progression from ${STUDENT_PROGRESSION_FILE}`);
    const rawLoadedState = await loadDataFromFile(STUDENT_PROGRESSION_FILE, null);
    let stateModified = false;

    if (rawLoadedState && typeof rawLoadedState === 'object' && rawLoadedState.version === USER_STATE_VERSION) {
        user_state = rawLoadedState;

        // Validate and correct user_state.learning_focus
        if (user_state.learning_focus === undefined || typeof user_state.learning_focus !== 'object' || Array.isArray(user_state.learning_focus)) {
            console.warn(`User state from ${STUDENT_PROGRESSION_FILE} has an invalid 'learning_focus' (type: ${typeof user_state.learning_focus}, isArray: ${Array.isArray(user_state.learning_focus)}). Resetting 'learning_focus' field to default (empty object).`);
            user_state.learning_focus = getDefaultUserState().learning_focus; // Reset to {}
            stateModified = true;
        } else {
            // If it's an object, ensure its children are arrays
            for (const lang in user_state.learning_focus) {
                if (Object.prototype.hasOwnProperty.call(user_state.learning_focus, lang)) {
                    if (!Array.isArray(user_state.learning_focus[lang])) {
                        console.warn(`User state for language '${lang}' in 'learning_focus' is not an array (was ${typeof user_state.learning_focus[lang]}). Resetting for this language to an empty array.`);
                        user_state.learning_focus[lang] = [];
                        stateModified = true;
                    }
                }
            }
        }

        // Validate and correct user_state.language_proficiency
        if (user_state.language_proficiency === undefined || typeof user_state.language_proficiency !== 'object' || Array.isArray(user_state.language_proficiency)) {
            console.warn(`User state from ${STUDENT_PROGRESSION_FILE} has an invalid 'language_proficiency'. Resetting 'language_proficiency' field to default.`);
            user_state.language_proficiency = getDefaultUserState().language_proficiency;
            stateModified = true;
        } else {
            for (const lang in user_state.language_proficiency) {
                if (Object.prototype.hasOwnProperty.call(user_state.language_proficiency, lang)) {
                    const profEntry = user_state.language_proficiency[lang];
                    if (typeof profEntry !== 'object' || profEntry === null) {
                        console.warn(`Proficiency data for language '${lang}' is not a valid object. Removing.`);
                        delete user_state.language_proficiency[lang];
                        stateModified = true;
                    } else {
                        // Example of more granular checks (can be expanded)
                        if (profEntry.strengths && !Array.isArray(profEntry.strengths)) {
                            profEntry.strengths = []; stateModified = true;
                        }
                        if (profEntry.weaknesses && !Array.isArray(profEntry.weaknesses)) {
                             profEntry.weaknesses = []; stateModified = true;
                        }
                    }
                }
            }
        }
        
        // Ensure other essential top-level fields exist and have correct basic types
        const defaultStateForComparison = getDefaultUserState();
        for (const key of ['user_preferences', 'current_lesson_data']) {
            if (user_state[key] === undefined || typeof user_state[key] !== 'object' || Array.isArray(user_state[key])) {
                console.warn(`User state field '${key}' is invalid or missing. Resetting to default.`);
                user_state[key] = defaultStateForComparison[key];
                stateModified = true;
            }
        }
        if (user_state.lesson_history_summary === undefined || !Array.isArray(user_state.lesson_history_summary)) {
             console.warn(`User state field 'lesson_history_summary' is invalid or missing. Resetting to default.`);
             user_state.lesson_history_summary = defaultStateForComparison.lesson_history_summary;
             stateModified = true;
        }


        console.info(`Successfully loaded user state from ${STUDENT_PROGRESSION_FILE} (version ${user_state.version}).`);
        if (stateModified) {
            console.log("User state was modified to correct structure. Saving changes.");
            await saveUserStateToFile();
        }

    } else {
        if (rawLoadedState && typeof rawLoadedState === 'object') {
            console.warn(`User state from ${STUDENT_PROGRESSION_FILE} has version ${rawLoadedState.version || 'undefined/missing'}, expected ${USER_STATE_VERSION}. Resetting to default.`);
        } else if (rawLoadedState === null) {
            console.warn(`No user state file found at ${STUDENT_PROGRESSION_FILE} or file was invalid. Initializing with default state.`);
        } else {
             console.warn(`Unexpected data type loaded from ${STUDENT_PROGRESSION_FILE}. Expected object or null, got ${typeof rawLoadedState}. Initializing with default state.`);
        }
        user_state = getDefaultUserState();
        console.log(`Initialized user_state with defaults. Attempting to save to ${STUDENT_PROGRESSION_FILE}.`);
        await saveUserStateToFile();
    }

    if (user_state && user_state.current_lesson_data && user_state.current_lesson_data.learn_lang && !isTutoringActive) {
        console.log("Found incomplete lesson data from previous session in user_state. Clearing it as no lesson is active.");
        user_state.current_lesson_data = getDefaultUserState().current_lesson_data;
        await saveUserStateToFile();
    }
    updateStudyButtonText();
}


async function saveUserStateToFile() {
    if (user_state) {
        if (!isTutoringActive && user_state.current_lesson_data && user_state.current_lesson_data.learn_lang) {
             console.warn("Saving user state: Tutoring not active, but current_lesson_data exists. Clearing it before save.");
             user_state.current_lesson_data = getDefaultUserState().current_lesson_data;
        }
        await saveDataToFile(STUDENT_PROGRESSION_FILE, user_state);
    } else {
        console.warn("Attempted to save user state, but user_state is null. Skipping save.");
    }
}

function updateStudyButtonText() {
    let buttonTextKey = 'studySessionBtn';
    let replacements = {};
    if (isTutoringActive && currentLessonConfig.learn_lang) {
         buttonTextKey = 'studySessionBtnContinue';
         replacements = { learn_lang: currentLessonConfig.learn_lang };
    } else if (user_state && user_state.user_preferences && user_state.user_preferences.last_learn_lang) {
        buttonTextKey = 'studySessionBtnContinue';
        replacements = { learn_lang: user_state.user_preferences.last_learn_lang };
    }
    const text = getTranslation(buttonTextKey, replacements);
    if (startStudyBtnMain) startStudyBtnMain.title = text;
}

function disableChatInputForTutor(placeholderKey = 'tutorChatInputPlaceholder', replacements = {}) {
    if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = getTranslation(placeholderKey, replacements);
    }
    if (sendButton) sendButton.disabled = true;
    if (attachFileBtn) attachFileBtn.disabled = true;
}
function enableChatInputAfterTutor(isStillTutoring = false) {
    if (chatInput) {
        chatInput.disabled = false;
        if (isStillTutoring) {
            if (!chatInput.placeholder.startsWith(getTranslation('tutorChatInputTranslationPlaceholder', {output_lang: ''}).substring(0,10)) &&
                !chatInput.placeholder.startsWith(getTranslation('tutorThinkingPlaceholder').substring(0,10)) &&
                !chatInput.placeholder.startsWith(getTranslation('tutorInitializingPlaceholder').substring(0,10))
            ) {
                 chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
            }
        } else {
            chatInput.placeholder = getTranslation('chatInputPlaceholder');
        }
    }
    if (sendButton) sendButton.disabled = false;
    if (attachFileBtn) attachFileBtn.disabled = false;
}

async function displayTutorMessage(textOrKey, type = 'tutor', replacements = {}) {
    const messageText = translations[currentLanguage]?.[textOrKey] ? getTranslation(textOrKey, replacements) : textOrKey;
    await addNewMessage(messageText, type);
}

async function callTutorOllamaApi(promptBlueprintObject) {
    const endpoint = appSettings.ollamaUserEndpoint || 'http://localhost:11434/api/generate';
    const model = appSettings.ollamaUserModel || 'gemma3:4b'; 

    const ollamaSystemPrompt = `You are an AI language tutor state machine. You will receive a JSON object describing the current context and user input. Your task is to analyze this input and return a JSON object in the specified 'desired_output_format'. Do NOT add any explanatory text outside the JSON response. Adhere strictly to the example structure provided in 'desired_output_format'.`;
    const ollamaUserPrompt = `Current task and state:\n\`\`\`json\n${JSON.stringify(promptBlueprintObject, null, 2)}\n\`\`\`\nPlease provide your response strictly in the 'desired_output_format' JSON structure.`;

    const requestPayload = {
        model: model,
        prompt: ollamaUserPrompt,
        system: ollamaSystemPrompt,
        stream: false, 
        format: "json", 
        options: { temperature: 0.5 } 
    };

    isTutorResponding = true;
    disableChatInputForTutor('tutorThinkingPlaceholder');

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Tutor Ollama API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        let jsonData;

        if (typeof data.response === 'string') {
            try { jsonData = JSON.parse(data.response); }
            catch (e) {
                console.error("Failed to parse JSON from data.response string:", data.response, e);
                throw new Error("Tutor model did not return valid JSON in response string.");
            }
        } else if (data.message && typeof data.message.content === 'string') { 
             try { jsonData = JSON.parse(data.message.content); }
             catch (e) {
                console.error("Failed to parse JSON from data.message.content string:", data.message.content, e);
                throw new Error("Tutor model did not return valid JSON in data.message.content.");
             }
        } else if (typeof data === 'object' && data.response === undefined && data.message === undefined) {
            if (Object.keys(data).length > 0 && (data.intention || data.sentences || data.updated_user_state || data.lesson_summary_text)) {
                jsonData = data;
            } else {
                 console.error("Tutor model returned an object, but not in expected field (response/message.content) and doesn't look like the direct JSON output:", data);
                 throw new Error("Tutor model returned an unexpected object format.");
            }
        }
        else {
            console.error("Tutor model returned an unexpected response structure. Data:", data);
            throw new Error("Tutor model returned an unexpected response format (not string in response/message.content, not direct object).");
        }
        console.log("Tutor LLM Response (parsed):", jsonData);
        return jsonData;
    } catch (error) {
        console.error("Error calling Tutor Ollama API:", error);
        await displayTutorMessage('tutorErrorGeneral');
        throw error;
    } finally {
        isTutorResponding = false;
    }
}

async function handleInitialTutorInteraction(userInputText) {
    expectedTutorResponseHandler = null;
    const { last_learn_lang, last_input_lang, last_output_lang } = user_state.user_preferences;

    const promptBlueprint = {
        system_instruction: `You are an AI assistant helping a user start a language lesson. The user was reminded of their previous session: learning '${last_learn_lang || 'N/A'}', translating from '${last_input_lang || 'N/A'}' to '${last_output_lang || 'N/A'}'. Their known/primary language is '${KNOWN_LANG}'. Analyze their response to understand their intention for the current session. They might want to continue, switch languages, change translation directions, or specify a completely new setup. Pay attention if they mention specific languages or translation directions.`,
        user_previous_session_context: {
            last_learn_lang: last_learn_lang,
            last_input_lang: last_input_lang,
            last_output_lang: last_output_lang
        },
        user_current_response: userInputText,
        known_lang: KNOWN_LANG,
        current_user_state_summary: {
            language_proficiency: user_state.language_proficiency
        },
        desired_output_format: {
            description: "Return a JSON object indicating the user's intention and any specified languages. 'intention' can be 'continue_previous', 'new_lesson_specified', 'choose_new_language', 'choose_new_direction', 'unclear'. If 'new_lesson_specified', fill in 'learn_lang', 'input_lang', 'output_lang'. If only language is new, fill 'learn_lang'. If only direction is new, set 'intention' to 'choose_new_direction' and 'learn_lang' to last_learn_lang if available.",
            example: { "intention": "continue_previous", "learn_lang": "spanish", "input_lang": "spanish", "output_lang": "english" }
        }
    };

    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && llmResponse.intention) {
            if (llmResponse.intention === 'continue_previous' && last_learn_lang && last_input_lang && last_output_lang) {
                currentLessonConfig = { learn_lang: last_learn_lang, input_lang: last_input_lang, output_lang: last_output_lang };
                await prepareLessonCore();
            } else if (llmResponse.intention === 'new_lesson_specified' && llmResponse.learn_lang && llmResponse.input_lang && llmResponse.output_lang) {
                currentLessonConfig = {
                    learn_lang: llmResponse.learn_lang.toLowerCase(),
                    input_lang: llmResponse.input_lang.toLowerCase(),
                    output_lang: llmResponse.output_lang.toLowerCase()
                };
                await prepareLessonCore();
            } else if (llmResponse.intention === 'choose_new_language' && llmResponse.learn_lang) {
                currentLessonConfig.learn_lang = llmResponse.learn_lang.toLowerCase();
                await displayTutorMessage('tutorAskDirectionClarification', 'tutor', { learn_lang: currentLessonConfig.learn_lang, known_lang: KNOWN_LANG });
                expectedTutorResponseHandler = handleDirectionClarification;
                enableChatInputAfterTutor(true);
            }
            else { 
                await displayTutorMessage('tutorAskLanguageDirection');
                expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
                enableChatInputAfterTutor(true);
            }
        } else {
            throw new Error("Invalid LLM response structure for initial interaction.");
        }
    } catch (error) {
        await displayTutorMessage('tutorErrorOllamaResponse');
        await displayTutorMessage('tutorAskLanguageDirection'); 
        expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
        enableChatInputAfterTutor(true);
    }
}

async function handleGeneralLanguageDirectionSetup(userInputText) {
    expectedTutorResponseHandler = null;
    const promptBlueprint = {
        system_instruction: `You are an AI assistant helping a user set up a language lesson. Their known/primary language is '${KNOWN_LANG}'. Analyze their response to identify: 1. The language they want to learn/practice ('learn_lang'). 2. The source language for translation ('input_lang'). 3. The target language for translation ('output_lang'). One of input/output should be 'learn_lang'. The other is often '${KNOWN_LANG}' unless specified otherwise.`,
        user_current_response: userInputText,
        known_lang: KNOWN_LANG,
        current_user_state_summary: {
            language_proficiency: user_state.language_proficiency,
            user_preferences: user_state.user_preferences
        },
        desired_output_format: {
            description: "Return a JSON object with 'learn_lang', 'input_lang', and 'output_lang'. Ensure language names are lowercase English (e.g., 'spanish'). If any part is unclear, set the respective field(s) to null.",
            example: { "learn_lang": "spanish", "input_lang": "english", "output_lang": "spanish" }
        }
    };

    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && llmResponse.learn_lang && llmResponse.input_lang && llmResponse.output_lang) {
            currentLessonConfig = {
                learn_lang: llmResponse.learn_lang.toLowerCase(),
                input_lang: llmResponse.input_lang.toLowerCase(),
                output_lang: llmResponse.output_lang.toLowerCase()
            };
            const langs = [currentLessonConfig.input_lang, currentLessonConfig.output_lang];
            if (!langs.includes(currentLessonConfig.learn_lang) || currentLessonConfig.input_lang === currentLessonConfig.output_lang) {
                 throw new Error("Invalid language configuration from LLM (learn_lang not in pair, or input/output same).");
            }
            await prepareLessonCore();
        } else if (llmResponse && llmResponse.learn_lang && (!llmResponse.input_lang || !llmResponse.output_lang)) {
            currentLessonConfig.learn_lang = llmResponse.learn_lang.toLowerCase();
            await displayTutorMessage('tutorAskDirectionClarification', 'tutor', { learn_lang: currentLessonConfig.learn_lang, known_lang: KNOWN_LANG });
            expectedTutorResponseHandler = handleDirectionClarification;
            enableChatInputAfterTutor(true);
        } else {
            await displayTutorMessage('tutorUnclearIntent');
            expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
            enableChatInputAfterTutor(true);
        }
    } catch (error) {
        console.error("Error in language/direction setup:", error);
        await displayTutorMessage('tutorErrorOllamaResponse');
        await displayTutorMessage('tutorAskLanguageDirection'); 
        expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
        enableChatInputAfterTutor(true);
    }
}

async function handleDirectionClarification(userInputText) {
    expectedTutorResponseHandler = null;
    const promptBlueprint = {
        system_instruction: `The user wants to learn '${currentLessonConfig.learn_lang}'. Their known language is '${KNOWN_LANG}'. We asked if they want to translate FROM '${currentLessonConfig.learn_lang}' TO '${KNOWN_LANG}' (for understanding) or FROM '${KNOWN_LANG}' TO '${currentLessonConfig.learn_lang}' (for production). Analyze their response to determine 'input_lang' and 'output_lang'.`,
        learn_lang_context: currentLessonConfig.learn_lang,
        known_lang_context: KNOWN_LANG,
        user_current_response: userInputText,
        desired_output_format: {
            description: `Return a JSON object with 'input_lang' and 'output_lang'. Values should be '${currentLessonConfig.learn_lang}' or '${KNOWN_LANG}'. If unclear, set to null.`,
            example: { "input_lang": "english", "output_lang": "spanish" } 
        }
    };
    promptBlueprint.desired_output_format.example = { "input_lang": KNOWN_LANG, "output_lang": currentLessonConfig.learn_lang };


    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && llmResponse.input_lang && llmResponse.output_lang) {
            currentLessonConfig.input_lang = llmResponse.input_lang.toLowerCase();
            currentLessonConfig.output_lang = llmResponse.output_lang.toLowerCase();

            const langs = [currentLessonConfig.input_lang, currentLessonConfig.output_lang];
            if (currentLessonConfig.input_lang === currentLessonConfig.output_lang ||
                !langs.includes(currentLessonConfig.learn_lang) ||
                !(langs.includes(KNOWN_LANG) || langs.includes(currentLessonConfig.learn_lang))) { 
                throw new Error("Invalid language pair after clarification.");
            }
            await prepareLessonCore();
        } else {
            await displayTutorMessage('tutorUnclearIntent');
            await displayTutorMessage('tutorAskDirectionClarification', 'tutor', { learn_lang: currentLessonConfig.learn_lang, known_lang: KNOWN_LANG });
            expectedTutorResponseHandler = handleDirectionClarification;
            enableChatInputAfterTutor(true);
        }
    } catch (error) {
        console.error("Error in direction clarification:", error);
        await displayTutorMessage('tutorErrorOllamaResponse');
        await displayTutorMessage('tutorAskLanguageDirection'); 
        expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
        enableChatInputAfterTutor(true);
    }
}

async function prepareLessonCore() {
    user_state.user_preferences.last_learn_lang = currentLessonConfig.learn_lang;
    user_state.user_preferences.last_input_lang = currentLessonConfig.input_lang;
    user_state.user_preferences.last_output_lang = currentLessonConfig.output_lang;

    if (!user_state.language_proficiency[currentLessonConfig.learn_lang]) {
        user_state.language_proficiency[currentLessonConfig.learn_lang] = {
            level: 0.1, last_practiced_utc: null, strengths: [], weaknesses: [],
            correct_streak_session: 0, overall_accuracy_estimate: 0.0
        };
    }
    // Ensure learning_focus for the language is an array
    if (!user_state.learning_focus[currentLessonConfig.learn_lang] || !Array.isArray(user_state.learning_focus[currentLessonConfig.learn_lang])) {
        user_state.learning_focus[currentLessonConfig.learn_lang] = [];
    }


    user_state.current_lesson_data = {
        learn_lang: currentLessonConfig.learn_lang,
        input_lang: currentLessonConfig.input_lang,
        output_lang: currentLessonConfig.output_lang,
        interactions: []
    };
    lesson_interactions = []; 

    await saveUserStateToFile();
    updateStudyButtonText();

    await displayTutorMessage('tutorReadyToStartLesson', 'tutor', {
        learn_lang: currentLessonConfig.learn_lang,
        input_lang: currentLessonConfig.input_lang,
        output_lang: currentLessonConfig.output_lang
    });

    const promptBlueprint = {
        system_instruction: `You are a helpful and encouraging language teaching AI. The student wants to translate 5 sentences from '${currentLessonConfig.input_lang}' to '${currentLessonConfig.output_lang}'. Their primary goal is to improve their '${currentLessonConfig.learn_lang}'. Based on their current learning state for '${currentLessonConfig.learn_lang}', provide 5 sentences in '${currentLessonConfig.input_lang}'. The sentences should be suitable for their proficiency in '${currentLessonConfig.learn_lang}' when translated.`,
        student_learning_state: user_state, 
        lesson_config: currentLessonConfig,
        desired_output_format: {
            description: `Return a JSON object with a single key 'sentences', which is an array of 5 strings in '${currentLessonConfig.input_lang}'.`,
            example: { "sentences": [`first sentence in ${currentLessonConfig.input_lang}`, `second sentence in ${currentLessonConfig.input_lang}`, "...", "...", "..."] }
        }
    };

    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && llmResponse.sentences && Array.isArray(llmResponse.sentences) && llmResponse.sentences.length > 0) {
            lesson_sentences = llmResponse.sentences.slice(0, 5); 
            current_sentence_index = 0;
            await startTranslationExerciseCycle();
        } else {
            await displayTutorMessage('tutorErrorNoSentences');
            await exitTutoringMode();
        }
    } catch (error) {
        await displayTutorMessage('tutorErrorOllamaResponse');
        await exitTutoringMode();
    }
}

async function startTranslationExerciseCycle() {
    if (current_sentence_index < lesson_sentences.length) {
        const currentSentence = lesson_sentences[current_sentence_index];
        await displayTutorMessage(`${getTranslation('tutorTranslateThis', { output_lang: currentLessonConfig.output_lang })}\n\n"${currentSentence}"`, 'tutor');
        expectedTutorResponseHandler = processUserTranslation;
        enableChatInputAfterTutor(true);
        chatInput.placeholder = getTranslation('tutorChatInputTranslationPlaceholder', {output_lang: currentLessonConfig.output_lang});
        chatInput.focus();
    } else {
        await concludeLesson();
    }
}

async function processUserTranslation(userTranslationText) {
    expectedTutorResponseHandler = null;
    const originalSentence = lesson_sentences[current_sentence_index];

    const promptBlueprint = {
        system_instruction: `You are a helpful and encouraging language teaching AI. The student is learning '${currentLessonConfig.learn_lang}'. They translated a sentence from '${currentLessonConfig.input_lang}' to '${currentLessonConfig.output_lang}'. Evaluate their translation, provide corrections and advice, and update their entire learning state.`,
        exercise_details: {
            learn_lang: currentLessonConfig.learn_lang,
            input_lang: currentLessonConfig.input_lang,
            original_sentence: originalSentence,
            output_lang: currentLessonConfig.output_lang,
            user_translation: userTranslationText
        },
        student_learning_state_before_this_interaction: user_state, 
        desired_output_format: {
            description: `Return a JSON object with 'your_corrections' (string, specific corrections to the user's translation or the correct translation if very different), 'your_advice' (string, general advice, encouragement, or explanation of mistakes), and 'updated_user_state' (the *complete, modified* user_state JSON object reflecting changes based on this interaction, especially for '${currentLessonConfig.learn_lang}' proficiency metrics like level, strengths, weaknesses, last_practiced_utc, overall_accuracy_estimate as a decimal 0.0-1.0, and correct_streak_session). Ensure 'learning_focus' in 'updated_user_state' is an object mapping language strings to arrays of focus strings, e.g., {"spanish": ["verb tenses", "prepositions"]}.`,
            example: {
                "your_corrections": "The correct phrasing is '...' because...",
                "your_advice": "Good try! Remember that adjectives often come after nouns in this language.",
                "updated_user_state": getDefaultUserState() // Example state
            }
        }
    };
    // Update example to be more specific for learning_focus
    promptBlueprint.desired_output_format.example.updated_user_state.language_proficiency[currentLessonConfig.learn_lang || 'example_lang'] = {
        level: 0.15, last_practiced_utc: new Date().toISOString(), strengths: ["vocabulary"], weaknesses: ["verb conjugation"],
        correct_streak_session: 1, overall_accuracy_estimate: 0.75
    };
    promptBlueprint.desired_output_format.example.updated_user_state.learning_focus[currentLessonConfig.learn_lang || 'example_lang'] = ["verb tenses"];


    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && typeof llmResponse.your_corrections === 'string' &&
            typeof llmResponse.your_advice === 'string' &&
            llmResponse.updated_user_state && typeof llmResponse.updated_user_state === 'object' &&
            llmResponse.updated_user_state.version === USER_STATE_VERSION) { 

            let receivedUserState = llmResponse.updated_user_state;

            // --- BEGIN VALIDATION OF LLM-RETURNED USER_STATE ---
            const defaultUserStateSnapshot = getDefaultUserState(); // For comparison and default structures

            if (receivedUserState.learning_focus === undefined || typeof receivedUserState.learning_focus !== 'object' || Array.isArray(receivedUserState.learning_focus)) {
                console.warn(`LLM returned user_state with invalid 'learning_focus' (type: ${typeof receivedUserState.learning_focus}). Attempting to restore from previous state or default.`);
                // Prefer previous valid state if available, else default.
                receivedUserState.learning_focus = (user_state && typeof user_state.learning_focus === 'object' && !Array.isArray(user_state.learning_focus)) 
                                                ? JSON.parse(JSON.stringify(user_state.learning_focus)) // Deep copy
                                                : defaultUserStateSnapshot.learning_focus;
            } else {
                for (const lang in receivedUserState.learning_focus) {
                    if (Object.prototype.hasOwnProperty.call(receivedUserState.learning_focus, lang)) {
                        if (!Array.isArray(receivedUserState.learning_focus[lang])) {
                            console.warn(`LLM returned learning_focus for language '${lang}' not as an array. Correcting.`);
                            // Attempt to restore this specific language's focus from previous state if valid, else empty array.
                            receivedUserState.learning_focus[lang] = (user_state && user_state.learning_focus && user_state.learning_focus[lang] && Array.isArray(user_state.learning_focus[lang]))
                                                                   ? JSON.parse(JSON.stringify(user_state.learning_focus[lang]))
                                                                   : [];
                        }
                    }
                }
            }

            if (receivedUserState.language_proficiency === undefined || typeof receivedUserState.language_proficiency !== 'object' || Array.isArray(receivedUserState.language_proficiency)) {
                console.warn(`LLM returned user_state with invalid 'language_proficiency'. Restoring from previous or default.`);
                receivedUserState.language_proficiency = (user_state && typeof user_state.language_proficiency === 'object' && !Array.isArray(user_state.language_proficiency))
                                                      ? JSON.parse(JSON.stringify(user_state.language_proficiency))
                                                      : defaultUserStateSnapshot.language_proficiency;
            } else {
                for (const lang in receivedUserState.language_proficiency) {
                    if (Object.prototype.hasOwnProperty.call(receivedUserState.language_proficiency, lang)) {
                        const prof = receivedUserState.language_proficiency[lang];
                        if (typeof prof !== 'object' || prof === null) {
                            console.warn(`LLM returned invalid proficiency data for lang '${lang}'. Attempting to restore or remove.`);
                            if (user_state && user_state.language_proficiency && user_state.language_proficiency[lang]) {
                                receivedUserState.language_proficiency[lang] = JSON.parse(JSON.stringify(user_state.language_proficiency[lang]));
                            } else {
                                delete receivedUserState.language_proficiency[lang];
                            }
                        } else {
                            if (prof.strengths && !Array.isArray(prof.strengths)) prof.strengths = [];
                            if (prof.weaknesses && !Array.isArray(prof.weaknesses)) prof.weaknesses = [];
                            if (typeof prof.level !== 'number' || isNaN(prof.level)) prof.level = 0.1;
                            if (typeof prof.overall_accuracy_estimate !== 'number' || isNaN(prof.overall_accuracy_estimate)) prof.overall_accuracy_estimate = 0.0;
                            if (typeof prof.correct_streak_session !== 'number' || isNaN(prof.correct_streak_session)) prof.correct_streak_session = 0;
                        }
                    }
                }
            }
            // Ensure other critical parts are objects/arrays as expected, copying from current valid user_state if LLM messes up
            if (typeof receivedUserState.user_preferences !== 'object' || Array.isArray(receivedUserState.user_preferences)) receivedUserState.user_preferences = JSON.parse(JSON.stringify(user_state.user_preferences || defaultUserStateSnapshot.user_preferences));
            if (!Array.isArray(receivedUserState.lesson_history_summary)) receivedUserState.lesson_history_summary = JSON.parse(JSON.stringify(user_state.lesson_history_summary || defaultUserStateSnapshot.lesson_history_summary));
            if (typeof receivedUserState.current_lesson_data !== 'object' || Array.isArray(receivedUserState.current_lesson_data)) receivedUserState.current_lesson_data = JSON.parse(JSON.stringify(user_state.current_lesson_data || defaultUserStateSnapshot.current_lesson_data));
            // --- END VALIDATION ---


            if (llmResponse.your_corrections) await displayTutorMessage(`**Corrections/Feedback:**\n${llmResponse.your_corrections}`, 'tutor');
            if (llmResponse.your_advice) await displayTutorMessage(`**Advice:**\n${llmResponse.your_advice}`, 'tutor');

            user_state = receivedUserState; // Assign the (potentially corrected) state

            const interactionData = {
                original_sentence: originalSentence,
                user_translation: userTranslationText,
                ai_corrections: llmResponse.your_corrections,
                ai_advice: llmResponse.your_advice
            };
            lesson_interactions.push(interactionData);
            if (user_state.current_lesson_data && user_state.current_lesson_data.interactions && Array.isArray(user_state.current_lesson_data.interactions)) {
                 user_state.current_lesson_data.interactions.push(interactionData);
            } else { 
                console.warn("current_lesson_data.interactions not found or not an array, re-initializing.");
                user_state.current_lesson_data = { ...currentLessonConfig, interactions: [interactionData] };
            }


            await saveUserStateToFile();
            current_sentence_index++;
            await startTranslationExerciseCycle();
        } else {
            console.error("Invalid LLM response structure for feedback:", llmResponse);
            throw new Error("Invalid LLM response structure for feedback. Missing fields or version mismatch.");
        }
    } catch (error) {
        console.error("Error processing user translation:", error);
        await displayTutorMessage('tutorErrorOllamaResponse');
        current_sentence_index++; // Still advance to not get stuck
        await startTranslationExerciseCycle();
    }
}

async function concludeLesson() {
    await displayTutorMessage("tutorConcludingMessageDisplay", 'tutor'); 

    if (user_state.current_lesson_data) {
         user_state.current_lesson_data.interactions = lesson_interactions;
    }

    const promptBlueprint = {
        system_instruction: `You are a helpful and encouraging language teaching AI. The student has completed a lesson translating ${lesson_interactions.length} sentences from '${currentLessonConfig.input_lang}' to '${currentLessonConfig.output_lang}', focusing on improving their '${currentLessonConfig.learn_lang}'. Summarize their performance, offer motivation, and suggest a next focus.`,
        lesson_context: {
            learn_lang: currentLessonConfig.learn_lang,
            input_lang: currentLessonConfig.input_lang,
            output_lang: currentLessonConfig.output_lang,
            number_of_exercises: lesson_interactions.length
        },
        student_learning_state_after_lesson: user_state, 
        desired_output_format: {
            description: `Return a JSON object with 'lesson_summary_text' (string, overall summary of the lesson's performance, highlighting strengths and areas for improvement), 'motivational_message' (string, encouraging words for the student), and 'next_focus_suggestion' (string, optional, a specific topic or grammar point for '${currentLessonConfig.learn_lang}' they could focus on next).`,
            example: {
                "lesson_summary_text": "You did well on vocabulary recall, but verb conjugations in the past tense were a bit tricky. Overall, good progress!",
                "motivational_message": "Great job completing the lesson! Keep practicing, and you'll see even more improvement.",
                "next_focus_suggestion": "past tense irregular verbs"
            }
        }
    };

    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && typeof llmResponse.lesson_summary_text === 'string' &&
            typeof llmResponse.motivational_message === 'string') { 

            if (llmResponse.lesson_summary_text) await displayTutorMessage(`**${getTranslation('tutorLessonSummaryTitle')}**\n${llmResponse.lesson_summary_text}`, 'tutor');
            if (llmResponse.motivational_message) await displayTutorMessage(`**${getTranslation('tutorMotivationalMessageTitle')}**\n${llmResponse.motivational_message}`, 'tutor');

            if (llmResponse.next_focus_suggestion && currentLessonConfig.learn_lang) {
                await displayTutorMessage(`**${getTranslation('tutorNextFocusSuggestionTitle', {learn_lang: currentLessonConfig.learn_lang})}** ${llmResponse.next_focus_suggestion}`, 'tutor');
                // Ensure user_state.learning_focus and user_state.learning_focus[lang] are correctly structured before pushing
                if (user_state.learning_focus && typeof user_state.learning_focus === 'object' && !Array.isArray(user_state.learning_focus)) {
                    if (!user_state.learning_focus[currentLessonConfig.learn_lang] || !Array.isArray(user_state.learning_focus[currentLessonConfig.learn_lang])) {
                        user_state.learning_focus[currentLessonConfig.learn_lang] = []; // Initialize if not an array
                    }
                    if (!user_state.learning_focus[currentLessonConfig.learn_lang].includes(llmResponse.next_focus_suggestion)) {
                        user_state.learning_focus[currentLessonConfig.learn_lang].push(llmResponse.next_focus_suggestion);
                    }
                } else {
                    console.warn("Could not add next_focus_suggestion as user_state.learning_focus is not a valid object.");
                }
            }


            if (currentLessonConfig.learn_lang && currentLessonConfig.input_lang && currentLessonConfig.output_lang) {
                if (!user_state.lesson_history_summary || !Array.isArray(user_state.lesson_history_summary)) {
                     user_state.lesson_history_summary = []; // Initialize if not an array
                }
                const takeaway = llmResponse.lesson_summary_text.substring(0, 150) + (llmResponse.lesson_summary_text.length > 150 ? "..." : "");
                user_state.lesson_history_summary.push({
                    date_utc: new Date().toISOString(),
                    lang_pair: `${currentLessonConfig.input_lang}-${currentLessonConfig.output_lang}`,
                    learn_lang: currentLessonConfig.learn_lang,
                    key_takeaway: takeaway,
                    num_exercises: lesson_interactions.length
                });
            }
        } else {
            throw new Error("Invalid LLM response structure for lesson summary.");
        }
    } catch (error) {
        console.error("Error concluding lesson with LLM:", error);
        await displayTutorMessage('tutorErrorOllamaResponse');
        if (currentLessonConfig.learn_lang && currentLessonConfig.input_lang && currentLessonConfig.output_lang) {
             if (!user_state.lesson_history_summary || !Array.isArray(user_state.lesson_history_summary)) user_state.lesson_history_summary = [];
             user_state.lesson_history_summary.push({ date_utc: new Date().toISOString(), lang_pair: `${currentLessonConfig.input_lang}-${currentLessonConfig.output_lang}`, learn_lang: currentLessonConfig.learn_lang, key_takeaway: "Lesson completed (summary generation error).", num_exercises: lesson_interactions.length });
        }
    } finally {
        if (user_state.current_lesson_data) { // Ensure it exists before trying to reset
            user_state.current_lesson_data = getDefaultUserState().current_lesson_data;
        }
        await saveUserStateToFile();
        await displayTutorMessage('tutorLessonComplete');
        await exitTutoringMode(false); 
    }
}

async function initiateTutoringSession() {
    if (isTutoringActive) {
        if (confirm(getTranslation("confirmExitExistingTutoring"))) {
            await exitTutoringMode(false); 
        } else { return; } 
    }
    if (isAiResponding || isTutorResponding) {
        alert(getTranslation("waitForAiResponseComplete"));
        return;
    }

    isTutoringActive = true;
    setAgentStatus('tutoring');
    updateStudyButtonText();
    disableChatInputForTutor('tutorInitializingPlaceholder');
    closePopup(settingsPanel); closePopup(aboutPopupOverlay); closePopup(learnerStatsPopupOverlay);

    // Ensure user_state is loaded and valid before proceeding
    if (!user_state) {
        await loadUserStateFromFile(); // This will initialize if null or fix if malformed
        if(!user_state) { // Still null after attempt (should not happen with current loadUserStateFromFile logic)
            console.error("User state is null even after loadUserStateFromFile. Cannot start tutoring.");
            await displayTutorMessage("tutorErrorGeneral");
            await exitTutoringMode(false);
            return;
        }
    }


    const { last_learn_lang, last_input_lang, last_output_lang } = user_state.user_preferences;

    if (last_learn_lang && last_input_lang && last_output_lang) {
        await displayTutorMessage('tutorWelcomeBack', 'tutor', {
            last_learn_lang: last_learn_lang,
            last_input_lang: last_input_lang,
            last_output_lang: last_output_lang
        });
        expectedTutorResponseHandler = handleInitialTutorInteraction;
    } else {
        await displayTutorMessage('tutorAskLanguageDirection');
        expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
    }
    enableChatInputAfterTutor(true);
    if (chatInput) {
        chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
        chatInput.focus();
    }
}

async function exitTutoringMode(showMessage = true) {
    if (showMessage) await displayTutorMessage('tutorExiting');

    isTutoringActive = false;
    isTutorResponding = false;
    expectedTutorResponseHandler = null;
    lesson_sentences = [];
    current_sentence_index = 0;
    lesson_interactions = [];
    currentLessonConfig = { learn_lang: null, input_lang: null, output_lang: null };

    if(user_state && user_state.current_lesson_data && user_state.current_lesson_data.learn_lang) {
        user_state.current_lesson_data = getDefaultUserState().current_lesson_data;
        await saveUserStateToFile(); 
    }

    setAgentStatus('active'); 
    updateStudyButtonText();
    enableChatInputAfterTutor(false); 
}

if (startStudyBtnMain) {
    startStudyBtnMain.addEventListener('click', initiateTutoringSession);
}

if (clearLearningProgressBtn) {
    clearLearningProgressBtn.addEventListener('click', async () => {
        if (confirm(getTranslation('confirmClearLearningProgress'))) {
            const wasTutoring = isTutoringActive;
            if (wasTutoring) {
                await exitTutoringMode(false); 
            }
            user_state = getDefaultUserState();
            await saveUserStateToFile();
            displaySystemMessage('learningProgressCleared');
            updateStudyButtonText(); 
            if (settingsPanel.classList.contains('is-open')) {
                settingsPanel.classList.remove('is-open');
            }
        }
    });
}
// --- END TUTORING FEATURE IMPLEMENTATION ---

if (sendButton && chatInput) {
    const handleSendMessage = async () => {
        const userText = chatInput.value.trim();

        if (isTutoringActive) {
            if (isTutorResponding) return;
            if (!userText) return; 
            await addNewMessage(userText, 'user');
            chatInput.value = '';
            
            if (expectedTutorResponseHandler) {
                await expectedTutorResponseHandler(userText);
            } else {
                console.warn("Tutoring active but no response handler set. Re-enabling input, something is wrong.");
                await displayTutorMessage('tutorErrorGeneral'); 
                enableChatInputAfterTutor(true); 
            }
            return;
        }

        // Standard chat mode
        if (isAiResponding) return;
        const originalImageForProcessing = currentOriginalImageBase64DataUri;
        const previewImageForHistory = currentResizedPreviewDataUri;
        const hasImageToSend = !!originalImageForProcessing;
        if (!userText && !hasImageToSend) return;

        await addNewMessage(userText, 'user', hasImageToSend, previewImageForHistory);
        chatInput.value = ''; chatInput.focus();
        clearSelectedImageState();
        isAiResponding = true; setAgentStatus('typing');
        sendButton.disabled = true; if (attachFileBtn) attachFileBtn.disabled = true;
        stopPeriodicOllamaHeaderCheck();

        let ollamaApiImagePayload = null;
        if (hasImageToSend && originalImageForProcessing) {
            try {
                const resizedForOllamaDataUri = await resizeImage( originalImageForProcessing, OLLAMA_IMAGE_MAX_DIMENSION_PX, OLLAMA_IMAGE_MAX_DIMENSION_PX, IMAGE_QUALITY_OLLAMA );
                ollamaApiImagePayload = resizedForOllamaDataUri.split(',')[1];
            } catch (err) {
                console.error("Error resizing image for Ollama:", err);
                if (originalImageForProcessing) {
                   const parts = originalImageForProcessing.split(',');
                   if (parts.length > 1) ollamaApiImagePayload = parts[1];
                }
            }
        }

        const chatHistoryString = getChatHistoryForPrompt();
        const ollamaPrompt = constructOllamaPrompt(userText, chatHistoryString, hasImageToSend);
        let aiMessageElement;
        let accumulatedAiResponse = "";
        const streamEnabled = appSettings.tutorAiStreamResponsesEnabled;

        if (streamEnabled) {
            aiMessageElement = createVisualAiMessage();
        }

        try {
            if (streamEnabled) {
                await callOllamaApi(ollamaPrompt, (token) => {
                    accumulatedAiResponse += token;
                    const contentDiv = aiMessageElement.querySelector('.message-content');
                    if (contentDiv) {
                        contentDiv.innerHTML = formatAiMessageContent(accumulatedAiResponse);
                    }
                    scrollToBottom();
                }, ollamaApiImagePayload);
                const finalTimestamp = Date.now();
                const timeDiv = aiMessageElement.querySelector('.message-time');
                 if (timeDiv) {
                    timeDiv.textContent = new Date(finalTimestamp).toLocaleTimeString(currentLanguage, { hour: 'numeric', minute: '2-digit' });
                 }
                const finalMessageData = { text: accumulatedAiResponse, type: 'ai', timestamp: finalTimestamp, hasImage: false, imageBase64: null };
                chatHistory.push(finalMessageData);
                await saveDataToFile(CHAT_HISTORY_FILE, chatHistory);
            } else {
                const aiResponseText = await callOllamaApi(ollamaPrompt, () => {}, ollamaApiImagePayload);
                await addNewMessage(aiResponseText, 'ai');
            }
            isOllamaReachableForHeader = true;
        } catch (error) {
            console.error("Ollama processing error:", error);
            if (aiMessageElement && streamEnabled) {
                aiMessageElement.remove();
            }
            await addNewMessage(getTranslation('ollamaError', { error: error.message || "Unknown error" }), 'ai');
            isOllamaReachableForHeader = false;
        } finally {
            isAiResponding = false;
            setAgentStatus('active');
            sendButton.disabled = false;
            if (attachFileBtn) attachFileBtn.disabled = false;
            startPeriodicOllamaHeaderCheck();
            enableChatInputAfterTutor(false); 
        }
    };
    sendButton.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            if (isTutoringActive && isTutorResponding) return;
            if (!isTutoringActive && isAiResponding) return;
            e.preventDefault();
            handleSendMessage();
        }
    });
}

// --- Initial Application Load ---
async function initializeApp() {
    const translationsLoadedSuccessfully = await fetchTranslations();

    const loadedSettings = await loadDataFromFile(SETTINGS_FILE, {});
    appSettings = { ...appSettings, ...loadedSettings }; 

    if (appSettings.hasOwnProperty('tutorAiChatDarkModeEnabled')) {
        if (!appSettings.hasOwnProperty('currentTheme')) { 
            appSettings.currentTheme = appSettings.tutorAiChatDarkModeEnabled ? 'dark' : 'light';
        }
        delete appSettings.tutorAiChatDarkModeEnabled; 
        console.log("Migrated old dark mode setting. New theme:", appSettings.currentTheme);
    }
    if (!appSettings.currentTheme) {
        appSettings.currentTheme = DEFAULT_THEME;
    }

    if (typeof appSettings.ollamaTemperatureSetting === 'string') {
        appSettings.ollamaTemperatureSetting = parseFloat(appSettings.ollamaTemperatureSetting).toFixed(1);
    } else if (typeof appSettings.ollamaTemperatureSetting !== 'number') { // Also handles if it's not a string (e.g. undefined)
        appSettings.ollamaTemperatureSetting = DEFAULT_OLLAMA_TEMPERATURE.toFixed(1);
    }


    // Load student progression (tutoring state) - Uses the refactored function
    await loadUserStateFromFile(); 

    const loadedChatHistory = await loadDataFromFile(CHAT_HISTORY_FILE, []);
    chatHistory = Array.isArray(loadedChatHistory) ? loadedChatHistory : [];

    loadAndApplyAppSettings(); 
    applyTranslations(); 
    await loadChatHistoryFromFile();

    if (!translationsLoadedSuccessfully) {
        setTimeout(() => {
            if (chatMessagesContainer) {
                 displaySystemMessage("systemMsgTranslationsFailed");
            } else {
                alert(getTranslation("systemMsgTranslationsFailed"));
            }
        }, 100);
    }

    if (typeof marked === 'undefined') {
        console.warn("Marked.js library is not loaded. Markdown formatting will fallback to simple newline-to-br conversion for AI messages.");
        if(markdownToggle) {
            markdownToggle.checked = false;
            markdownToggle.disabled = true;
            appSettings.tutorAiChatMarkdownEnabled = false;
        }
    } else {
        marked.setOptions({ breaks: true, gfm: true, pedantic: false, smartLists: true, smartypants: false });
    }

    checkOllamaForHeaderUpdate().then(() => {
        startPeriodicOllamaHeaderCheck();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closePopup(settingsPanel); closePopup(aboutPopupOverlay); closePopup(learnerStatsPopupOverlay);
        }
    });

    console.log("TUTORAI Application Initialized.");
    if (window.pywebview && window.pywebview.api) {
        window.pywebview.api.greet("JavaScript").then(response => {
            console.log("Python says:", response);
        });
    } else {
        console.warn("pywebview.api not available at the end of initializeApp.");
    }
}

function onPywebviewReady() {
    console.log("pywebview is ready. Initializing app...");
    initializeApp();
}

if (window.pywebview && window.pywebview.api) {
    onPywebviewReady();
} else {
    window.addEventListener('pywebviewready', onPywebviewReady);
}