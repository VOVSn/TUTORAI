// Global variable to hold translations
let translations = {};
const currentLanguage = 'en'; // Assuming 'en' is the primary/only language for now

// --- DOM Elements ---
const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const settingsTabButtons = document.querySelectorAll('.settings-tab-button');
const settingsTabContents = document.querySelectorAll('.settings-tab-content');
const darkModeToggle = document.getElementById('darkModeToggle');
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

// --- Constants for LocalStorage and Ollama ---
const OLLAMA_ENDPOINT_KEY = 'ollamaUserEndpoint';
const OLLAMA_MODEL_KEY = 'ollamaUserModel';
const OLLAMA_TEMPERATURE_KEY = 'ollamaTemperatureSetting';
const DEFAULT_OLLAMA_TEMPERATURE = 0.3;
const CHAT_HISTORY_KEY = 'TutorAiChatHistory';
const MARKDOWN_ENABLED_KEY = 'tutorAiChatMarkdownEnabled';
const DARK_MODE_KEY = 'tutorAiChatDarkModeEnabled';
const ACTIVE_SETTINGS_TAB_KEY = 'tutorAiActiveSettingsTab';
const MAX_HISTORY_FOR_PROMPT = 6;
const OLLAMA_CHECK_INTERVAL = 60000;
const PREVIEW_IMAGE_MAX_DIMENSION_PX = 300;
const OLLAMA_IMAGE_MAX_DIMENSION_PX = 512;
const IMAGE_QUALITY_PREVIEW = 0.85;
const IMAGE_QUALITY_OLLAMA = 0.9;


// --- Application State ---
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
const USER_STATE_KEY = 'tutorAiLanguageLearningUserState';
const KNOWN_LANG = 'english';
let user_state = null;
let isTutoringActive = false;
let isTutorResponding = false;
let currentLessonConfig = { learn_lang: null, input_lang: null, output_lang: null };
let lesson_sentences = [];
let current_sentence_index = 0;
let lesson_interactions = [];
let expectedTutorResponseHandler = null;
// --- END TUTORING FEATURE ---

async function fetchTranslations() {
    try {
        const response = await fetch('translations.json'); // Path relative to script.js
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}. Failed to fetch 'translations.json'. Check path, server configuration, and if the file exists at 'tutorai/translations.json'.`);
        }
        const loadedTranslations = await response.json();
        // Basic sanity check for loaded translations
        if (typeof loadedTranslations !== 'object' || loadedTranslations === null || !loadedTranslations.en || Object.keys(loadedTranslations.en).length < 10) { // Check for 'en' and a reasonable number of keys
            console.warn("Translations file loaded, but content seems invalid, empty, or missing sufficient 'en' keys. Content:", loadedTranslations);
            throw new Error("Translations file content is invalid or incomplete.");
        }
        translations = loadedTranslations;
        console.info("Translations loaded successfully.");
        return true; // Success
    } catch (error) {
        console.error("Could not load or parse translations.json:", error);
        // Fallback to a more comprehensive set of default English strings
        translations = {
            en: {
                pageTitle: "TUTORAI Chat (Default)",
                agentName: "TUTORAI",
                agentStatusActive: "Active",
                agentStatusTyping: "Typing... (Default)",
                agentStatusNotReachable: "Not Reachable (Default)",
                agentStatusTutoring: "Tutoring Mode (Default)",
                settingsTitle: "Settings (Default)",
                settingsTabBasic: "Basic (Default)",
                settingsTabAdvanced: "Advanced (Default)",
                darkModeLabel: "Dark Mode (Default)",
                streamResponsesLabel: "Stream Responses (Default)",
                markdownLabel: "Use Markdown (Default)",
                ollamaStatusTitle: "Ollama Status (Default)",
                applicationInfoTitle: "Application Info (Default)",
                showAboutBtn: "About TUTORAI (Default)",
                ollamaConfigTitle: "Ollama Configuration (Default)",
                ollamaEndpointLabel: "Endpoint URL (Default)",
                ollamaModelLabel: "Model Name (Default)",
                ollamaTemperatureLabel: "Temperature (0.1-1.0) (Default)",
                checkOllamaBtn: "Check Ollama (Default)",
                chatDataTitle: "Chat Data (Default)",
                clearChatHistoryBtn: "Clear Chat History (Default)",
                ollamaEndpointPlaceholder: "http://localhost:11434/api/generate",
                ollamaModelPlaceholder: "gemma3:4b",
                chatInputPlaceholder: "Ask TUTORAI something... (Default)",
                sendMessageTitle: "Send Message (Default)",
                attachFileTitle: "Upload Image (Default)",
                dateToday: "Today (Default)",
                dateYesterday: "Yesterday (Default)",
                userImagePreviewAlt: "User image preview (Default)",
                systemMsgTranslationsFailed: "Warning: UI translations failed to load. Some text may appear as placeholders. Please check the browser console (F12) for error details (e.g., if 'translations.json' was not found or is malformed).",
                // Add more critical keys as needed for basic operation
                confirmClearHistory: "Are you sure you want to clear all chat history from your browser's storage? This action cannot be undone. (Default)",
                ollamaError: "Error communicating with AI: {error} (Default)",
                learningTitle: "Learning (Default)",
                studySessionBtn: "Start Study Session (Default)",
                clearLearningProgressBtn: "Clear Learning Progress (Default)",
                confirmClearLearningProgress: "Are you sure you want to clear all your learning progress? (Default)",
                learnerStatsTitle: "Your Learning Progress (Default)",
                viewLearningProgressTitle: "View Learning Progress (Default)",
                aboutTitle: "About TUTORAI (Default)",
             }
        };
        return false; // Failure
    }
}

// --- Translation Functions ---
function getTranslation(key, replacements = {}) {
    let translation = translations[currentLanguage]?.[key] || key;
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
        const isPlaceholder = el.hasAttribute('placeholder') && el.tagName === 'INPUT';

        if (el.id === 'startStudyBtnMain') return; // Handled by updateStudyButtonText

        if (isButton || isTitleElement) {
            el.textContent = getTranslation(key);
        } else if (isPlaceholder) {
            // Placeholders on inputs with data-translate-key are not generically handled here.
            // They are handled by specific assignments below if needed, or by specific keys.
            // e.g. chatInput.placeholder uses its own logic.
            // If you want generic placeholder translation, you'd do:
            // el.placeholder = getTranslation(key);
            // But current HTML structure uses specific keys for placeholders.
        } else {
            el.textContent = getTranslation(key);
        }
    });

    // Specific assignments (some might be redundant if data-translate-key is on the element already, but harmless)
    // The <title> element is already handled by the loop above if it has data-translate-key.
    // if (document.querySelector('title')) {
    //      document.querySelector('title').textContent = getTranslation('pageTitle');
    // }
    if (agentNameDiv) agentNameDiv.textContent = getTranslation('agentName');
    setAgentStatus(isAiResponding ? 'typing' : (isTutoringActive ? 'tutoring' : 'active'));

    if (settingsButton) settingsButton.title = getTranslation('settingsTitle');

    if (ollamaEndpointInput) ollamaEndpointInput.placeholder = getTranslation('ollamaEndpointPlaceholder');
    if (ollamaModelInput) ollamaModelInput.placeholder = getTranslation('ollamaModelPlaceholder');

    if (attachFileBtn) attachFileBtn.title = getTranslation('attachFileTitle');
    if (chatInput) chatInput.placeholder = isTutoringActive ? getTranslation('tutorChatInputPlaceholder') : getTranslation('chatInputPlaceholder');
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
        if (statusKey === 'typing') {
            agentStatusDiv.textContent = getTranslation('agentStatusTyping');
        } else if (statusKey === 'tutoring') {
            agentStatusDiv.classList.add('tutoring');
            agentStatusDiv.textContent = getTranslation('agentStatusTutoring');
        } else {
            updateAgentHeaderStatus();
        }
    }
}

// --- Popup Management ---
function openPopup(overlayElement) {
    if (settingsPanel.classList.contains('is-open')) {
        settingsPanel.classList.remove('is-open');
    }
    if (overlayElement) overlayElement.classList.add('is-open');
}
function closePopup(overlayElement) {
    if (overlayElement) overlayElement.classList.remove('is-open');
}

// About Popup Logic
if (showAboutBtn && aboutPopupOverlay && closeAboutPopup) {
    showAboutBtn.addEventListener('click', () => openPopup(aboutPopupOverlay));
    closeAboutPopup.addEventListener('click', () => closePopup(aboutPopupOverlay));
    aboutPopupOverlay.addEventListener('click', (event) => {
        if (event.target === aboutPopupOverlay) closePopup(aboutPopupOverlay);
    });
}

// Learner Stats Popup Logic
function displayLearnerStats() {
    if (!learnerStatsPopupOverlay || !learnerStatsContent) return;

    learnerStatsContent.innerHTML = ''; // Clear previous content

    const storedState = localStorage.getItem(USER_STATE_KEY);
    if (!storedState) {
        learnerStatsContent.innerHTML = `<p>${getTranslation('noLearningDataFound')}</p>`;
        openPopup(learnerStatsPopupOverlay);
        return;
    }

    try {
        const state = JSON.parse(storedState);
        let html = '';

        if (state.language_proficiency && Object.keys(state.language_proficiency).length > 0) {
            html += `<h4>${getTranslation('languagesPracticedTitle')}</h4><ul>`;
            for (const lang in state.language_proficiency) {
                const prof = state.language_proficiency[lang];

                let accuracyToDisplay = 0;
                if (prof.overall_accuracy_estimate) {
                    let val = parseFloat(prof.overall_accuracy_estimate);
                    if (isNaN(val)) {
                        val = 0;
                    }

                    if (val > 1 && val <= 100) { // e.g., 70 for 70%
                        accuracyToDisplay = val;
                    } else if (val >= 0 && val <= 1) { // e.g., 0.7 for 70%
                        accuracyToDisplay = val * 100;
                    } else if (val > 100) { // Erroneously large, e.g. 7000
                        accuracyToDisplay = 100; // Cap at 100%
                    } else { // Negative or other unexpected
                        accuracyToDisplay = 0;
                    }
                }

                html += `<li><strong>${lang.charAt(0).toUpperCase() + lang.slice(1)}:</strong>
                            Level ${prof.level ? prof.level.toFixed(2) : 'N/A'},
                            Accuracy: ${accuracyToDisplay.toFixed(1)}%,
                            Streak: ${prof.correct_streak_session || 0}
                         </li>`;
                if (prof.strengths && prof.strengths.length > 0) {
                    html += `<p style="font-size:0.9em; margin-left: 20px;"><em>Strengths:</em> ${prof.strengths.join(', ')}</p>`;
                }
                if (prof.weaknesses && prof.weaknesses.length > 0) {
                    html += `<p style="font-size:0.9em; margin-left: 20px;"><em>Weaknesses:</em> ${prof.weaknesses.join(', ')}</p>`;
                }
            }
            html += `</ul>`;
        } else {
            html += `<p>${getTranslation('noLanguagesPracticedYet')}</p>`;
        }

        if (state.learning_focus && Object.keys(state.learning_focus).length > 0) {
            let hasFocus = false;
            let focusHtml = `<hr><h4>${getTranslation('currentLearningFocusTitle')}</h4>`;
            for (const lang in state.learning_focus) {
                if (state.learning_focus[lang] && state.learning_focus[lang].length > 0) {
                    focusHtml += `<p><strong>${lang.charAt(0).toUpperCase() + lang.slice(1)}:</strong> ${state.learning_focus[lang].join(', ')}</p>`;
                    hasFocus = true;
                }
            }
            if(hasFocus) html += focusHtml;
        }

        if (state.lesson_history_summary && state.lesson_history_summary.length > 0) {
            html += `<hr><h4>${getTranslation('lessonHistoryTitle')}</h4><ul>`;
            const recentHistory = state.lesson_history_summary.slice(-5).reverse(); // Show last 5, newest first
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
        console.error("Error parsing user_state for stats:", e);
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
function setActiveSettingsTab(tabName) {
    settingsTabButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });
    settingsTabContents.forEach(content => {
        content.classList.toggle('active', content.id === `settings-tab-${tabName}`);
    });
    localStorage.setItem(ACTIVE_SETTINGS_TAB_KEY, tabName);
}

if (settingsButton && settingsPanel) {
    settingsButton.addEventListener('click', function(event) {
        event.stopPropagation();
        const isOpening = !settingsPanel.classList.contains('is-open');
        // Close other popups if opening settings
        if (isOpening) {
            closePopup(aboutPopupOverlay);
            closePopup(learnerStatsPopupOverlay);
        }
        settingsPanel.classList.toggle('is-open');

        if (settingsPanel.classList.contains('is-open')) {
            const lastActiveTab = localStorage.getItem(ACTIVE_SETTINGS_TAB_KEY) || 'basic';
            setActiveSettingsTab(lastActiveTab);
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


// --- Dark Mode ---
function setDarkMode(enabled) {
    if (enabled) {
        body.classList.add('dark-mode');
        localStorage.setItem(DARK_MODE_KEY, 'true');
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem(DARK_MODE_KEY, 'false');
        if (darkModeToggle) darkModeToggle.checked = false;
    }
}
if (darkModeToggle) {
    darkModeToggle.addEventListener('change', function() {
        setDarkMode(this.checked);
    });
}


if (markdownToggle) {
    markdownToggle.addEventListener('change', function() {
        localStorage.setItem(MARKDOWN_ENABLED_KEY, this.checked);
    });
}

// --- Ollama Settings Management ---
function loadOllamaSettings() {
    if (ollamaEndpointInput) {
        ollamaEndpointInput.value = localStorage.getItem(OLLAMA_ENDPOINT_KEY) || 'http://localhost:11434/api/generate';
    }
    if (ollamaModelInput) {
        ollamaModelInput.value = localStorage.getItem(OLLAMA_MODEL_KEY) || 'gemma3:4b';
    }
    if (ollamaTemperatureInput) {
        const storedTemp = localStorage.getItem(OLLAMA_TEMPERATURE_KEY);
        let tempToSet = DEFAULT_OLLAMA_TEMPERATURE;
        if (storedTemp !== null) {
            const parsed = parseFloat(storedTemp);
            if (!isNaN(parsed) && parsed >= 0.1 && parsed <= 1.0) {
                tempToSet = parsed;
            }
        }
        ollamaTemperatureInput.value = tempToSet.toFixed(1);
        localStorage.setItem(OLLAMA_TEMPERATURE_KEY, tempToSet.toFixed(1));
    }
}

function saveOllamaSetting(key, value) {
    localStorage.setItem(key, value);
}

if (ollamaEndpointInput) {
    ollamaEndpointInput.addEventListener('input', () => saveOllamaSetting(OLLAMA_ENDPOINT_KEY, ollamaEndpointInput.value));
}
if (ollamaModelInput) {
    ollamaModelInput.addEventListener('input', () => saveOllamaSetting(OLLAMA_MODEL_KEY, ollamaModelInput.value));
}
if (ollamaTemperatureInput) {
    ollamaTemperatureInput.addEventListener('input', () => { // Handle comma replacement on input
        if (ollamaTemperatureInput.value.includes(',')) {
            ollamaTemperatureInput.value = ollamaTemperatureInput.value.replace(',', '.');
        }
    });
    ollamaTemperatureInput.addEventListener('change', () => {
        // The 'input' event should have already replaced comma with dot
        let tempValue = parseFloat(ollamaTemperatureInput.value);
        if (isNaN(tempValue) || tempValue < 0.1) tempValue = 0.1;
        else if (tempValue > 1.0) tempValue = 1.0;

        ollamaTemperatureInput.value = tempValue.toFixed(1); // Ensures display with dot
        saveOllamaSetting(OLLAMA_TEMPERATURE_KEY, tempValue.toFixed(1));
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
    const endpointUrlFromInput = (ollamaEndpointInput ? ollamaEndpointInput.value.trim() : '') || 'http://localhost:11434/api/generate';
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
         return { reachable: false, errorType: 'fetch_error', errorName: error.name };
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
            if (ollamaStatusText.dataset.key && settingsPanel.classList.contains('is-open')) { // Only clear if panel is still open
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
    const useMarkdown = markdownToggle ? markdownToggle.checked : true;
    if (useMarkdown && typeof marked !== 'undefined') {
        return marked.parse(text, { breaks: true, gfm: true });
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

function saveMessageToHistory(messageData) {
    const historyJson = localStorage.getItem(CHAT_HISTORY_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];
    history.push(messageData);
    try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error("Error saving history to localStorage (likely full):", e);
        displaySystemMessage("Error saving history: Storage might be full.");
    }
}

function addNewMessage(text, type, hasImage = false, imageBase64ForHistory = null) {
    if (type !== 'ai' && type !== 'tutor' && (!text || (typeof text === 'string' && !text.trim())) && !hasImage ) {
         return null;
    }

    const messageData = {
        text: text,
        type: type,
        hasImage: hasImage,
        imageBase64: imageBase64ForHistory,
        timestamp: Date.now()
    };

    const isPlaceholder = (type === 'ai' && !text && (streamResponsesToggle ? streamResponsesToggle.checked : true));

    const messageElement = renderMessageToDOM(messageData, isPlaceholder);

    if (type === 'user' || type === 'tutor' || (type === 'ai' && !isPlaceholder)) {
        saveMessageToHistory(messageData);
    }

    scrollToBottom();
    return messageElement;
}

async function loadChatHistory() {
    if (!chatMessagesContainer) return;
    chatMessagesContainer.innerHTML = '';
    lastMessageDateString = '';

    let historyActuallyLoaded = false;
    let systemMessageAlreadyShownAboutLoading = false;

    try {
        const response = await fetch('chat_history.json', { cache: "no-store" });
        if (response.ok) {
            const historyFromFile = await response.json();
            if (Array.isArray(historyFromFile) && historyFromFile.length > 0) {
                historyFromFile.forEach(msgData => {
                    msgData.hasImage = msgData.hasImage || false;
                    msgData.imageBase64 = msgData.imageBase64 || null;
                    renderMessageToDOM(msgData);
                });
                historyActuallyLoaded = true;
                localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(historyFromFile));
                displaySystemMessage("systemMsgLoadedFromFile"); // Uses getTranslation
                systemMessageAlreadyShownAboutLoading = true;
            } else if (Array.isArray(historyFromFile) && historyFromFile.length === 0) {
                console.info("chat_history.json is empty. Will try localStorage.");
            } else {
                console.warn("chat_history.json is not a valid history array. Will try localStorage.");
            }
        } else if (response.status !== 404) {
            console.warn(`Error loading chat_history.json (status: ${response.status}). Will try localStorage.`);
        }
    } catch (error) {
        console.info("Could not load chat_history.json (likely not present). Will try localStorage:", error.message);
    }

    if (!historyActuallyLoaded) {
        const historyFromStorageJson = localStorage.getItem(CHAT_HISTORY_KEY);
        if (historyFromStorageJson) {
            try {
                const historyFromStorage = JSON.parse(historyFromStorageJson);
                if (Array.isArray(historyFromStorage) && historyFromStorage.length > 0) {
                    historyFromStorage.forEach(msgData => {
                        msgData.hasImage = msgData.hasImage || false;
                        msgData.imageBase64 = msgData.imageBase64 || null;
                        renderMessageToDOM(msgData)
                    });
                    historyActuallyLoaded = true;
                    if (!systemMessageAlreadyShownAboutLoading) {
                        displaySystemMessage("systemMsgLoadedFromStorage"); // Uses getTranslation
                        systemMessageAlreadyShownAboutLoading = true;
                    }
                } else {
                     console.info("Browser's local storage for chat history is empty or invalid array.");
                }
            } catch (e) {
                console.error("Error parsing history from local storage. Clearing it.", e);
                localStorage.removeItem(CHAT_HISTORY_KEY);
            }
        }
    }

    if (!historyActuallyLoaded && !systemMessageAlreadyShownAboutLoading) {
         displaySystemMessage("systemMsgNoHistory"); // Uses getTranslation
    }

    scrollToBottom();
}

if (clearChatHistoryBtn) {
    clearChatHistoryBtn.addEventListener('click', () => {
        if (isTutoringActive) {
            alert("Please exit tutoring mode before clearing chat history."); // Consider translating this too if needed
            return;
        }
        if (confirm(getTranslation('confirmClearHistory'))) {
            localStorage.removeItem(CHAT_HISTORY_KEY);
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
    const historyJson = localStorage.getItem(CHAT_HISTORY_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];

    const recentMessages = history
        .filter(msg => msg.type === 'user' || msg.type === 'ai' || msg.type === 'tutor')
        .slice(-MAX_HISTORY_FOR_PROMPT);

    const userLabel = getTranslation('ollamaPromptUserLabel');
    const aiLabel = getTranslation('ollamaPromptAiLabel');

    return recentMessages.map(msg => {
        const prefix = msg.type === 'user' ? userLabel : aiLabel;
        let messageContent = msg.text || "";
        if (msg.type === 'user' && msg.hasImage && !msg.text.trim()) {
            messageContent = `[${getTranslation('userImagePreviewAlt')}]`;
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
        currentUserInputLine += `[Image Provided] `;
    }
    currentUserInputLine += (userInput || "");

    fullPrompt += `${currentUserInputLine}\n${aiLabel}:`;
    return fullPrompt;
}

async function callOllamaApi(promptText, onTokenCallback, imageBase64Payload = null) {
    const endpoint = (ollamaEndpointInput ? ollamaEndpointInput.value : null) || 'http://localhost:11434/api/generate';
    const model = (ollamaModelInput ? ollamaModelInput.value : null) || 'gemma3:4b';
    const stream = streamResponsesToggle ? streamResponsesToggle.checked : true;

    let temperatureValue = DEFAULT_OLLAMA_TEMPERATURE;
    if (ollamaTemperatureInput) {
        const parsedTemp = parseFloat(ollamaTemperatureInput.value); // Value is already dot-separated
        if (!isNaN(parsedTemp) && parsedTemp >= 0.1 && parsedTemp <= 1.0) {
            temperatureValue = parsedTemp;
        }
    }

    const requestPayload = {
        model: model,
        prompt: promptText,
        stream: stream,
        options: {
            temperature: temperatureValue
        }
    };

    if (imageBase64Payload) {
        requestPayload.images = [imageBase64Payload];
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
        version: "1.1", // Keep version consistent
        user_preferences: {
            default_input_lang: null,
            default_output_lang: KNOWN_LANG,
            last_learn_lang: null,
            last_input_lang: null,
            last_output_lang: null,
        },
        language_proficiency: {},
        learning_focus: {},
        lesson_history_summary: [],
        current_lesson_data: {
            input_lang: null,
            output_lang: null,
            interactions: []
        }
    };
}

function loadUserState() {
    const storedState = localStorage.getItem(USER_STATE_KEY);
    if (storedState) {
        try {
            user_state = JSON.parse(storedState);
            if (!user_state.version || user_state.version !== "1.1") {
                console.warn("User state version mismatch or missing. Resetting to default.");
                user_state = getDefaultUserState();
                saveUserState();
            }
            if (user_state.current_lesson_data && user_state.current_lesson_data.input_lang) {
                console.log("Found incomplete lesson data from previous session. Clearing it.");
                user_state.current_lesson_data = { input_lang: null, output_lang: null, interactions: [] };
                saveUserState();
            }

        } catch (e) {
            console.error("Error parsing user_state from localStorage. Resetting to default.", e);
            user_state = getDefaultUserState();
            saveUserState();
        }
    } else {
        user_state = getDefaultUserState();
    }
    updateStudyButtonText();
}

function saveUserState() {
    if (user_state) {
        try {
            if (!isTutoringActive && user_state.current_lesson_data && !user_state.current_lesson_data.input_lang) {
                 user_state.current_lesson_data = { input_lang: null, output_lang: null, interactions: [] };
            } else if (isTutoringActive && user_state.current_lesson_data) {
                // Current lesson data is actively being managed
            }
            localStorage.setItem(USER_STATE_KEY, JSON.stringify(user_state));
        } catch (e) {
            console.error("Error saving user_state to localStorage:", e);
        }
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
            // Placeholder might be set by specific tutor step, or default tutor placeholder
            if (!chatInput.placeholder.startsWith(getTranslation('tutorChatInputTranslationPlaceholder', {output_lang: ''}).substring(0,10))) {
                 chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
            }
        } else {
            chatInput.placeholder = getTranslation('chatInputPlaceholder');
        }
    }
    if (sendButton) sendButton.disabled = false;
    if (attachFileBtn) attachFileBtn.disabled = false;
}

function displayTutorMessage(textOrKey, type = 'tutor', replacements = {}) {
    const messageText = translations[currentLanguage]?.[textOrKey] ? getTranslation(textOrKey, replacements) : textOrKey;
    addNewMessage(messageText, type);
}

async function callTutorOllamaApi(promptBlueprintObject) {
    const endpoint = (ollamaEndpointInput ? ollamaEndpointInput.value : null) || 'http://localhost:11434/api/generate';
    const model = (ollamaModelInput ? ollamaModelInput.value : null) || 'gemma3:4b';

    const ollamaSystemPrompt = `You are an AI language tutor state machine. You will receive a JSON object describing the current context and user input. Your task is to analyze this input and return a JSON object in the specified 'desired_output_format'. Do NOT add any explanatory text outside the JSON response.`;

    const ollamaUserPrompt = `Current task and state:\n\`\`\`json\n${JSON.stringify(promptBlueprintObject, null, 2)}\n\`\`\`\nPlease provide your response strictly in the 'desired_output_format' JSON structure.`;

    const requestPayload = {
        model: model,
        prompt: ollamaUserPrompt,
        system: ollamaSystemPrompt,
        stream: false,
        format: "json",
        options: {
            temperature: 0.5
        }
    };

    isTutorResponding = true;
    disableChatInputForTutor();

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
            try {
                jsonData = JSON.parse(data.response);
            } catch (e) {
                 console.error("Failed to parse JSON from Ollama tutor response string:", data.response, e);
                 throw new Error("Tutor model did not return valid JSON in response string.");
            }
        } else if (typeof data.response === 'object') {
            jsonData = data.response;
        } else if (data.message && data.message.content && typeof data.message.content === 'string') {
             try {
                jsonData = JSON.parse(data.message.content);
            } catch (e) {
                 console.error("Failed to parse JSON from Ollama tutor response (data.message.content):", data.message.content, e);
                 throw new Error("Tutor model did not return valid JSON in data.message.content.");
            }
        }
        else {
            console.error("Unexpected Ollama tutor response format:", data);
            throw new Error("Tutor model returned an unexpected response format.");
        }
        return jsonData;

    } catch (error) {
        console.error("Error calling Tutor Ollama API:", error);
        displayTutorMessage('tutorErrorGeneral');
        throw error;
    } finally {
        isTutorResponding = false;
    }
}

async function handleInitialTutorInteraction(userInputText) {
    expectedTutorResponseHandler = null;
    let promptBlueprint;

    const lastLearnLang = user_state.user_preferences.last_learn_lang;
    const lastInputLang = user_state.user_preferences.last_input_lang;
    const lastOutputLang = user_state.user_preferences.last_output_lang;

    promptBlueprint = {
        system_instruction: "You are an AI assistant helping a user start a language lesson. The user was reminded of their previous session: learning '{last_learn_lang}', translating from '{last_input_lang}' to '{last_output_lang}'. Their known/primary language is '{known_lang}'. Analyze their response to understand their intention for the current session. They might want to continue, switch languages, change translation directions, or specify a completely new setup. Pay attention if they mention specific languages or translation directions.",
        user_previous_session_context: {
            last_learn_lang: lastLearnLang,
            last_input_lang: lastInputLang,
            last_output_lang: lastOutputLang
        },
        user_current_response: userInputText,
        known_lang: KNOWN_LANG,
        current_user_state_summary: {
            language_proficiency: user_state.language_proficiency
        },
        desired_output_format: {
            description: "Return a JSON object indicating the user's intention and any specified languages. 'intention' can be 'continue_previous', 'new_lesson_specified', 'choose_new_language', 'choose_new_direction', 'unclear'. If 'new_lesson_specified', fill in 'learn_lang', 'input_lang', 'output_lang'. If only language is new, fill 'learn_lang'. If only direction is new, set 'intention' to 'choose_new_direction' and 'learn_lang' to last_learn_lang.",
            example: { intention: "continue_previous", learn_lang: "spanish", input_lang: "spanish", output_lang: "english" }
        }
    };

    promptBlueprint.system_instruction = promptBlueprint.system_instruction
        .replace('{last_learn_lang}', lastLearnLang || 'N/A')
        .replace('{last_input_lang}', lastInputLang || 'N/A')
        .replace('{last_output_lang}', lastOutputLang || 'N/A')
        .replace('{known_lang}', KNOWN_LANG);

    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && llmResponse.intention) {
            if (llmResponse.intention === 'continue_previous' && lastLearnLang && lastInputLang && lastOutputLang) {
                currentLessonConfig.learn_lang = lastLearnLang;
                currentLessonConfig.input_lang = lastInputLang;
                currentLessonConfig.output_lang = lastOutputLang;
                await prepareLessonCore();
            } else if (llmResponse.intention === 'new_lesson_specified' && llmResponse.learn_lang && llmResponse.input_lang && llmResponse.output_lang) {
                currentLessonConfig.learn_lang = llmResponse.learn_lang.toLowerCase();
                currentLessonConfig.input_lang = llmResponse.input_lang.toLowerCase();
                currentLessonConfig.output_lang = llmResponse.output_lang.toLowerCase();
                await prepareLessonCore();
            } else {
                displayTutorMessage('tutorAskLanguageDirection');
                expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
                enableChatInputAfterTutor(true);
                chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
            }
        } else {
            throw new Error("Invalid LLM response structure for initial interaction.");
        }
    } catch (error) {
        displayTutorMessage('tutorErrorOllamaResponse');
        exitTutoringMode();
    }
}

async function handleGeneralLanguageDirectionSetup(userInputText) {
    expectedTutorResponseHandler = null;
    const promptBlueprint = {
        system_instruction: "You are an AI assistant helping a user set up a language lesson. Their known/primary language is '{known_lang}'. Analyze their response to identify: 1. The language they want to learn/practice ('learn_lang'). 2. The source language for translation ('input_lang'). 3. The target language for translation ('output_lang'). One of input/output should be 'learn_lang'. The other is often '{known_lang}' unless specified otherwise.",
        user_current_response: userInputText,
        known_lang: KNOWN_LANG,
        current_user_state_summary: {
            language_proficiency: user_state.language_proficiency,
            user_preferences: user_state.user_preferences
        },
        desired_output_format: {
            description: "Return a JSON object with 'learn_lang', 'input_lang', and 'output_lang'. Ensure language names are lowercase English (e.g., 'spanish'). If any part is unclear, set the respective field(s) to null.",
            example: { learn_lang: "spanish", input_lang: "english", output_lang: "spanish" }
        }
    };
    promptBlueprint.system_instruction = promptBlueprint.system_instruction.replace('{known_lang}', KNOWN_LANG);

    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && llmResponse.learn_lang && llmResponse.input_lang && llmResponse.output_lang) {
            currentLessonConfig.learn_lang = llmResponse.learn_lang.toLowerCase();
            currentLessonConfig.input_lang = llmResponse.input_lang.toLowerCase();
            currentLessonConfig.output_lang = llmResponse.output_lang.toLowerCase();

            const langs = [currentLessonConfig.input_lang, currentLessonConfig.output_lang];
            if (!langs.includes(currentLessonConfig.learn_lang)) {
                 throw new Error("Learn language not in input/output pair.");
            }
            if (currentLessonConfig.input_lang === currentLessonConfig.output_lang) {
                throw new Error("Input and output languages cannot be the same.");
            }

            await prepareLessonCore();
        } else if (llmResponse && llmResponse.learn_lang && (!llmResponse.input_lang || !llmResponse.output_lang)) {
            currentLessonConfig.learn_lang = llmResponse.learn_lang.toLowerCase();
            displayTutorMessage('tutorAskDirectionClarification', 'tutor', { learn_lang: currentLessonConfig.learn_lang, known_lang: KNOWN_LANG });
            expectedTutorResponseHandler = handleDirectionClarification;
            enableChatInputAfterTutor(true);
            chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
        }
        else {
            displayTutorMessage('tutorUnclearIntent');
            expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
            enableChatInputAfterTutor(true);
            chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
        }
    } catch (error) {
         console.error("Error in language/direction setup:", error);
        displayTutorMessage('tutorErrorOllamaResponse');
        displayTutorMessage('tutorAskLanguageDirection');
        expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
        enableChatInputAfterTutor(true);
        chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
    }
}

async function handleDirectionClarification(userInputText) {
     expectedTutorResponseHandler = null;
     const promptBlueprint = {
        system_instruction: "The user wants to learn '{learn_lang}'. Their known language is '{known_lang}'. We asked if they want to translate FROM '{learn_lang}' TO '{known_lang}' (for understanding) or FROM '{known_lang}' TO '{learn_lang}' (for production). Analyze their response to determine 'input_lang' and 'output_lang'.",
        learn_lang_context: currentLessonConfig.learn_lang,
        known_lang_context: KNOWN_LANG,
        user_current_response: userInputText,
        desired_output_format: {
            description: "Return a JSON object with 'input_lang' and 'output_lang'. Values should be '{learn_lang}' or '{known_lang}'. If unclear, set to null.",
            example: { input_lang: "english", output_lang: "spanish" }
        }
    };
    promptBlueprint.system_instruction = promptBlueprint.system_instruction
        .replace(/{learn_lang}/g, currentLessonConfig.learn_lang)
        .replace(/{known_lang}/g, KNOWN_LANG);

    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && llmResponse.input_lang && llmResponse.output_lang) {
            currentLessonConfig.input_lang = llmResponse.input_lang.toLowerCase();
            currentLessonConfig.output_lang = llmResponse.output_lang.toLowerCase();
            if (currentLessonConfig.input_lang === currentLessonConfig.output_lang) {
                throw new Error("Input and output cannot be same after clarification.");
            }
            const langs = [currentLessonConfig.input_lang, currentLessonConfig.output_lang];
            if (!langs.includes(currentLessonConfig.learn_lang) || !langs.includes(KNOWN_LANG)) {
                if (!( (currentLessonConfig.input_lang === currentLessonConfig.learn_lang && currentLessonConfig.output_lang === KNOWN_LANG) ||
                       (currentLessonConfig.input_lang === KNOWN_LANG && currentLessonConfig.output_lang === currentLessonConfig.learn_lang) )) {
                    throw new Error("Invalid language pair after clarification.");
                }
            }
            await prepareLessonCore();
        } else {
            displayTutorMessage('tutorUnclearIntent');
            displayTutorMessage('tutorAskDirectionClarification', 'tutor', { learn_lang: currentLessonConfig.learn_lang, known_lang: KNOWN_LANG });
            expectedTutorResponseHandler = handleDirectionClarification;
            enableChatInputAfterTutor(true);
            chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
        }
    } catch (error) {
         console.error("Error in direction clarification:", error);
        displayTutorMessage('tutorErrorOllamaResponse');
        displayTutorMessage('tutorAskLanguageDirection');
        expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
        enableChatInputAfterTutor(true);
        chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
    }
}


async function prepareLessonCore() {
    user_state.user_preferences.last_learn_lang = currentLessonConfig.learn_lang;
    user_state.user_preferences.last_input_lang = currentLessonConfig.input_lang;
    user_state.user_preferences.last_output_lang = currentLessonConfig.output_lang;
    if (!user_state.language_proficiency[currentLessonConfig.learn_lang]) {
        user_state.language_proficiency[currentLessonConfig.learn_lang] = {
            level: 0.1, last_practiced_utc: null, strengths: [], weaknesses: [],
            correct_streak_session: 0, overall_accuracy_estimate: 0
        };
    }
    if (!user_state.learning_focus[currentLessonConfig.learn_lang]) {
        user_state.learning_focus[currentLessonConfig.learn_lang] = [];
    }

    user_state.current_lesson_data = {
        input_lang: currentLessonConfig.input_lang,
        output_lang: currentLessonConfig.output_lang,
        interactions: []
    };
    lesson_interactions = [];
    saveUserState();
    updateStudyButtonText();

    displayTutorMessage('tutorReadyToStartLesson', 'tutor', {
        learn_lang: currentLessonConfig.learn_lang,
        input_lang: currentLessonConfig.input_lang,
        output_lang: currentLessonConfig.output_lang
    });

    const promptBlueprint = {
        system_instruction: "You are a helpful and encouraging language teaching AI. The student wants to translate 5 sentences from '{input_lang}' to '{output_lang}'. Their primary goal is to improve their '{learn_lang}'. Based on their current learning state for '{learn_lang}', provide 5 sentences in '{input_lang}'. The sentences should be suitable for their proficiency in '{learn_lang}' when translated.",
        student_learning_state: user_state,
        lesson_config: currentLessonConfig,
        desired_output_format: {
            description: "Return a JSON object with a single key 'sentences', which is an array of 5 strings in '{input_lang}'.",
            example: {"sentences": ["sentence1", "sentence2", "sentence3", "sentence4", "sentence5"]}
        }
    };
    promptBlueprint.system_instruction = promptBlueprint.system_instruction
        .replace(/{input_lang}/g, currentLessonConfig.input_lang)
        .replace(/{output_lang}/g, currentLessonConfig.output_lang)
        .replace(/{learn_lang}/g, currentLessonConfig.learn_lang);
    promptBlueprint.desired_output_format.description = promptBlueprint.desired_output_format.description
        .replace('{input_lang}', currentLessonConfig.input_lang);


    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && llmResponse.sentences && Array.isArray(llmResponse.sentences) && llmResponse.sentences.length === 5) {
            lesson_sentences = llmResponse.sentences;
            current_sentence_index = 0;
            startTranslationExerciseCycle();
        } else {
            displayTutorMessage('tutorErrorNoSentences');
            exitTutoringMode();
        }
    } catch (error) {
        displayTutorMessage('tutorErrorOllamaResponse');
        exitTutoringMode();
    }
}

function startTranslationExerciseCycle() {
    if (current_sentence_index < lesson_sentences.length) {
        const currentSentence = lesson_sentences[current_sentence_index];
        displayTutorMessage(`${getTranslation('tutorTranslateThis', { output_lang: currentLessonConfig.output_lang })}\n\n"${currentSentence}"`, 'tutor');
        expectedTutorResponseHandler = processUserTranslation;
        enableChatInputAfterTutor(true);
        chatInput.placeholder = getTranslation('tutorChatInputTranslationPlaceholder', {output_lang: currentLessonConfig.output_lang});
        chatInput.focus();
    } else {
        concludeLesson();
    }
}

async function processUserTranslation(userTranslationText) {
    expectedTutorResponseHandler = null;
    const originalSentence = lesson_sentences[current_sentence_index];

    const promptBlueprint = {
        system_instruction: "You are a helpful and encouraging language teaching AI. The student is learning '{learn_lang}'. They translated a sentence from '{input_lang}' to '{output_lang}'. Evaluate their translation, provide corrections and advice, and update their entire learning state.",
        exercise_details: {
            learn_lang: currentLessonConfig.learn_lang,
            input_lang: currentLessonConfig.input_lang,
            original_sentence: originalSentence,
            output_lang: currentLessonConfig.output_lang,
            user_translation: userTranslationText
        },
        student_learning_state_before_this_interaction: user_state,
        desired_output_format: {
            description: "Return a JSON object with 'your_corrections' (string), 'your_advice' (string), and 'updated_user_state' (the *complete, modified* user_state JSON object reflecting changes based on this interaction, especially for '{learn_lang}' proficiency metrics like level, strengths, weaknesses, last_practiced_utc, accuracy, streak). Accuracy should be a decimal value between 0 and 1 (e.g., 0.75 for 75%).",
            example: { your_corrections: "...", your_advice: "...", updated_user_state: { /* complete user_state object with overall_accuracy_estimate as decimal */ } }
        }
    };
     promptBlueprint.system_instruction = promptBlueprint.system_instruction
        .replace(/{learn_lang}/g, currentLessonConfig.learn_lang)
        .replace(/{input_lang}/g, currentLessonConfig.input_lang)
        .replace(/{output_lang}/g, currentLessonConfig.output_lang);
     promptBlueprint.desired_output_format.description = promptBlueprint.desired_output_format.description
        .replace('{learn_lang}', currentLessonConfig.learn_lang);


    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && llmResponse.your_corrections && llmResponse.your_advice && llmResponse.updated_user_state) {
            displayTutorMessage(`**Correction:**\n${llmResponse.your_corrections}\n\n**Advice:**\n${llmResponse.your_advice}`, 'tutor');

            user_state = llmResponse.updated_user_state;
            if (!user_state.current_lesson_data || !user_state.current_lesson_data.input_lang) {
                user_state.current_lesson_data = {
                    input_lang: currentLessonConfig.input_lang,
                    output_lang: currentLessonConfig.output_lang,
                    interactions: lesson_interactions
                };
            }


            const interactionData = {
                original_sentence: originalSentence,
                user_translation: userTranslationText,
                ai_correction: llmResponse.your_corrections,
                ai_advice: llmResponse.your_advice
            };
            lesson_interactions.push(interactionData);
            if(user_state.current_lesson_data && user_state.current_lesson_data.interactions) {
                user_state.current_lesson_data.interactions.push(interactionData);
            } else {
                user_state.current_lesson_data = { interactions: [interactionData], ...currentLessonConfig };
            }


            saveUserState();

            current_sentence_index++;
            startTranslationExerciseCycle();
        } else {
            throw new Error("Invalid LLM response structure for feedback.");
        }
    } catch (error) {
        displayTutorMessage('tutorErrorOllamaResponse');
        current_sentence_index++;
        startTranslationExerciseCycle();
    }
}

async function concludeLesson() {
    displayTutorMessage("Processing lesson summary...", 'tutor');

    if (user_state.current_lesson_data) {
         user_state.current_lesson_data.interactions = lesson_interactions;
    }

    const promptBlueprint = {
        system_instruction: "You are a helpful and encouraging language teaching AI. The student has completed a lesson translating 5 sentences from '{input_lang}' to '{output_lang}', focusing on improving their '{learn_lang}'. Summarize their performance, offer motivation, and suggest a next focus.",
        lesson_context: {
            learn_lang: currentLessonConfig.learn_lang,
            input_lang: currentLessonConfig.input_lang,
            output_lang: currentLessonConfig.output_lang
        },
        student_learning_state_after_lesson: user_state,
        desired_output_format: {
            description: "Return a JSON object with 'lesson_summary_text' (string, overall summary of the lesson), 'motivational_message' (string), and 'next_focus_suggestion' (string, optional, for '{learn_lang}').",
            example: { lesson_summary_text: "You did well on X, but could improve Y.", motivational_message: "Keep practicing!", next_focus_suggestion: "verb conjugations" }
        }
    };
    promptBlueprint.system_instruction = promptBlueprint.system_instruction
        .replace(/{input_lang}/g, currentLessonConfig.input_lang || "the input language")
        .replace(/{output_lang}/g, currentLessonConfig.output_lang || "the output language")
        .replace(/{learn_lang}/g, currentLessonConfig.learn_lang || "the language being learned");
    promptBlueprint.desired_output_format.description = promptBlueprint.desired_output_format.description
        .replace('{learn_lang}', currentLessonConfig.learn_lang || "the language being learned");


    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && llmResponse.motivational_message) { // motivational_message is a good indicator of a valid response
            const summaryText = (typeof llmResponse.lesson_summary_text === 'string' && llmResponse.lesson_summary_text.trim() !== "")
                                ? llmResponse.lesson_summary_text
                                : "Well done on completing the exercises!";

            displayTutorMessage(`**Lesson Summary:**\n${summaryText}\n\n**Motivation:**\n${llmResponse.motivational_message}`, 'tutor');

            if (llmResponse.next_focus_suggestion && currentLessonConfig.learn_lang) {
                displayTutorMessage(`**Next Focus Suggestion for ${currentLessonConfig.learn_lang}:** ${llmResponse.next_focus_suggestion}`, 'tutor');
                if (user_state.learning_focus && user_state.learning_focus[currentLessonConfig.learn_lang] &&
                    !user_state.learning_focus[currentLessonConfig.learn_lang].includes(llmResponse.next_focus_suggestion)) {
                    user_state.learning_focus[currentLessonConfig.learn_lang].push(llmResponse.next_focus_suggestion);
                }
            }

            // Add to history only if lesson config is valid
            if (currentLessonConfig.learn_lang && currentLessonConfig.input_lang && currentLessonConfig.output_lang) {
                if (!user_state.lesson_history_summary) user_state.lesson_history_summary = [];
                user_state.lesson_history_summary.push({
                    date_utc: new Date().toISOString(),
                    lang_pair: `${currentLessonConfig.input_lang}-${currentLessonConfig.output_lang}`,
                    learn_lang: currentLessonConfig.learn_lang,
                    key_takeaway: summaryText.substring(0, 100) + (summaryText.length > 100 ? "..." : "")
                });
            } else {
                console.warn("Skipping adding lesson to history due to incomplete lesson config at conclusion.", currentLessonConfig);
            }
        } else {
            throw new Error("Invalid LLM response structure for lesson summary.");
        }
    } catch (error) {
        console.error("Error concluding lesson with LLM:", error);
        displayTutorMessage('tutorErrorOllamaResponse');
        // Still add a generic history item if config is valid, as the lesson did happen
        if (currentLessonConfig.learn_lang && currentLessonConfig.input_lang && currentLessonConfig.output_lang) {
            if (!user_state.lesson_history_summary) user_state.lesson_history_summary = [];
             user_state.lesson_history_summary.push({
                date_utc: new Date().toISOString(),
                lang_pair: `${currentLessonConfig.input_lang}-${currentLessonConfig.output_lang}`,
                learn_lang: currentLessonConfig.learn_lang,
                key_takeaway: "Lesson completed (summary generation error)."
            });
        }
    } finally {
        // Clear current lesson data from user_state and save
        if (user_state.current_lesson_data) {
            user_state.current_lesson_data = { input_lang: null, output_lang: null, interactions: [] };
        }
        saveUserState();
        displayTutorMessage('tutorLessonComplete');
        exitTutoringMode(); // This will also call saveUserState again, which is fine.
    }
}

function initiateTutoringSession() {
    if (isTutoringActive) {
        if (confirm("A tutoring session is already active. Do you want to end it and start a new one?")) {
            exitTutoringMode(false);
        } else {
            return;
        }
    }
    if (isAiResponding || isTutorResponding) {
        alert("Please wait for the current AI response to complete.");
        return;
    }

    isTutoringActive = true;
    setAgentStatus('tutoring');
    updateStudyButtonText();
    disableChatInputForTutor();

    loadUserState();

    const lastLearnLang = user_state.user_preferences.last_learn_lang;
    const lastInputLang = user_state.user_preferences.last_input_lang;
    const lastOutputLang = user_state.user_preferences.last_output_lang;

    if (lastLearnLang && lastInputLang && lastOutputLang) {
        displayTutorMessage('tutorWelcomeBack', 'tutor', {
            last_learn_lang: lastLearnLang,
            last_input_lang: lastInputLang,
            last_output_lang: lastOutputLang
        });
        expectedTutorResponseHandler = handleInitialTutorInteraction;
    } else {
        displayTutorMessage('tutorAskLanguageDirection');
        expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
    }
    enableChatInputAfterTutor(true);
    chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
    chatInput.focus();
    closePopup(settingsPanel);
    closePopup(aboutPopupOverlay);
    closePopup(learnerStatsPopupOverlay);
}

function exitTutoringMode(showMessage = true) {
    if (showMessage) displayTutorMessage('tutorExiting');
    isTutoringActive = false;
    isTutorResponding = false;
    expectedTutorResponseHandler = null;
    lesson_sentences = [];
    current_sentence_index = 0;
    lesson_interactions = [];
    currentLessonConfig = { learn_lang: null, input_lang: null, output_lang: null };

    if(user_state && user_state.current_lesson_data) {
        user_state.current_lesson_data = { input_lang: null, output_lang: null, interactions: [] };
        saveUserState(); // Save the cleared current_lesson_data
    }

    setAgentStatus('active');
    updateStudyButtonText();
    enableChatInputAfterTutor(false);
}

if (startStudyBtnMain) {
    startStudyBtnMain.addEventListener('click', initiateTutoringSession);
}

if (clearLearningProgressBtn) {
    clearLearningProgressBtn.addEventListener('click', () => {
        if (confirm(getTranslation('confirmClearLearningProgress'))) {
            localStorage.removeItem(USER_STATE_KEY);
            user_state = getDefaultUserState();
            if (isTutoringActive) {
                exitTutoringMode(false);
            }
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

            addNewMessage(userText, 'user');
            chatInput.value = '';
            disableChatInputForTutor();

            if (expectedTutorResponseHandler) {
                await expectedTutorResponseHandler(userText);
            } else {
                console.warn("Tutoring active but no response handler set.");
                enableChatInputAfterTutor(true);
            }
            return;
        }

        if (isAiResponding) return;

        const originalImageForProcessing = currentOriginalImageBase64DataUri;
        const previewImageForHistory = currentResizedPreviewDataUri;
        const hasImageToSend = !!originalImageForProcessing;

        if (!userText && !hasImageToSend) return;

        addNewMessage(userText, 'user', hasImageToSend, previewImageForHistory);
        chatInput.value = '';
        chatInput.focus();
        clearSelectedImageState();

        isAiResponding = true;
        setAgentStatus('typing');
        sendButton.disabled = true;
        if (attachFileBtn) attachFileBtn.disabled = true;
        stopPeriodicOllamaHeaderCheck();

        let ollamaApiImagePayload = null;
        if (hasImageToSend && originalImageForProcessing) {
            try {
                const resizedForOllamaDataUri = await resizeImage(
                    originalImageForProcessing,
                    OLLAMA_IMAGE_MAX_DIMENSION_PX,
                    OLLAMA_IMAGE_MAX_DIMENSION_PX,
                    IMAGE_QUALITY_OLLAMA
                );
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
        const streamEnabled = streamResponsesToggle ? streamResponsesToggle.checked : true;

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
                saveMessageToHistory({ text: accumulatedAiResponse, type: 'ai', timestamp: finalTimestamp, hasImage: false, imageBase64: null });

            } else {
                const aiResponseText = await callOllamaApi(ollamaPrompt, () => {}, ollamaApiImagePayload);
                addNewMessage(aiResponseText, 'ai');
            }
            isOllamaReachableForHeader = true;
        } catch (error) {
            console.error("Ollama processing error:", error);
            if (aiMessageElement && streamEnabled) {
                aiMessageElement.remove();
            }
            addNewMessage(getTranslation('ollamaError', { error: error.message || "Unknown error" }), 'ai');
            isOllamaReachableForHeader = false;
        } finally {
            isAiResponding = false;
            setAgentStatus(isTutoringActive ? 'tutoring' : 'active');
            sendButton.disabled = isTutoringActive;
            if (attachFileBtn) attachFileBtn.disabled = isTutoringActive;
            startPeriodicOllamaHeaderCheck();
            if (isTutoringActive && expectedTutorResponseHandler) {
                enableChatInputAfterTutor(true);
            } else if (!isTutoringActive) {
                enableChatInputAfterTutor(false);
            }
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
    const translationsLoadedSuccessfully = await fetchTranslations(); // Load translations first

    const savedDarkModePref = localStorage.getItem(DARK_MODE_KEY);
    setDarkMode(savedDarkModePref === 'true');

    if (markdownToggle) {
        const savedMarkdownPref = localStorage.getItem(MARKDOWN_ENABLED_KEY);
        markdownToggle.checked = savedMarkdownPref === null ? true : (savedMarkdownPref === 'true');
    }
    const lastActiveTab = localStorage.getItem(ACTIVE_SETTINGS_TAB_KEY) || 'basic';
    setActiveSettingsTab(lastActiveTab);

    loadOllamaSettings();
    loadUserState(); // This calls updateStudyButtonText which uses getTranslation
    applyTranslations(); // Apply translations (either full or fallback from fetchTranslations)
    loadChatHistory();   // This calls displaySystemMessage which uses getTranslation

    if (!translationsLoadedSuccessfully) {
        // displaySystemMessage itself relies on translations.
        // The key 'systemMsgTranslationsFailed' MUST be in the fallback object in fetchTranslations.
        // Use a timeout to ensure this message appears after initial history/loading messages.
        setTimeout(() => {
            if (chatMessagesContainer) { // Ensure the container exists
                 displaySystemMessage("systemMsgTranslationsFailed");
            } else {
                // Absolute fallback if UI isn't ready, though unlikely
                alert(getTranslation("systemMsgTranslationsFailed"));
            }
        }, 100);
    }

    if (typeof marked === 'undefined') {
        console.warn("Marked.js library is not loaded. Markdown formatting will fallback to simple newline-to-br conversion for AI messages.");
        if(markdownToggle) {
            markdownToggle.checked = false;
            markdownToggle.disabled = true;
        }
    } else {
        marked.setOptions({
          breaks: true,
          gfm: true,
          pedantic: false,
          smartLists: true,
          smartypants: false
        });
    }

    checkOllamaForHeaderUpdate().then(() => {
        startPeriodicOllamaHeaderCheck();
    });

    // Close all popups on Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closePopup(settingsPanel);
            closePopup(aboutPopupOverlay);
            closePopup(learnerStatsPopupOverlay);
        }
    });
}

// --- Start the application ---
initializeApp();