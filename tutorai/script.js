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
        if (typeof loadedTranslations !== 'object' || loadedTranslations === null || !loadedTranslations.en || Object.keys(loadedTranslations.en).length < 10) {
            console.warn("Translations file loaded, but content seems invalid, empty, or missing sufficient 'en' keys. Content:", loadedTranslations);
            throw new Error("Translations file content is invalid or incomplete.");
        }
        translations = loadedTranslations;
        console.info("Translations loaded successfully.");
        return true;
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
                confirmClearHistory: "Are you sure you want to clear all chat history from your browser's storage? This action cannot be undone. (Default)",
                ollamaError: "Error communicating with AI: {error} (Default)",
                
                // --- ADDED/UPDATED CRITICAL KEYS FOR FALLBACK ---
                ollamaPromptSystem: "You are a helpful AI assistant named TUTORAI. The user is communicating in English. Your task is to provide a helpful and concise response to the user's current query, strictly in English. Use Markdown for formatting if appropriate (e.g., lists, bold, italics). If an image is provided, analyze it in conjunction with the text prompt. (Default Prompt)",
                ollamaPromptUserLabel: "User (Default)",
                ollamaPromptAiLabel: "TUTORAI (Default)",
                systemMsgLoadedFromFile: "Loaded history from chat_history.json. (Default)",
                systemMsgLoadedFromStorage: "Loaded history from browser storage. (Default)",
                systemMsgNoHistory: "No chat history found. (Default)",
                systemMsgHistoryCleared: "Chat history cleared. (Default)",
                ollamaStatusChecking: "Checking... (Default)",
                ollamaStatusRunning: "Ollama Running (Default)",
                ollamaStatusOKUnexpected: "Reachable (OK, unexpected content) (Default)",
                ollamaStatusReachableWithCode: "Reachable (Status: {status}) (Default)",
                ollamaStatusNotReachable: "Not Reachable (Default)",
                ollamaStatusInvalidURL: "Invalid URL (Default)",

                learningTitle: "Learning (Default)",
                studySessionBtn: "Start Study Session (Default)",
                studySessionBtnContinue: "Study: {learn_lang} (Default)",
                clearLearningProgressBtn: "Clear Learning Progress (Default)",
                confirmClearLearningProgress: "Are you sure you want to clear all your learning progress? (Default)",
                learningProgressCleared: "Learning progress cleared. (Default)",
                learnerStatsTitle: "Your Learning Progress (Default)",
                viewLearningProgressTitle: "View Learning Progress (Default)",
                noLearningDataFound: "No learning data found. (Default)",
                languagesPracticedTitle: "Languages Practiced (Default)",
                noLanguagesPracticedYet: "You haven't practiced any languages yet. (Default)",
                currentLearningFocusTitle: "Current Learning Focus (Default)",
                lessonHistoryTitle: "Recent Lesson History (Default)",
                errorLoadingLearningData: "Error loading learning data. (Default)",
                aboutTitle: "About TUTORAI (Default)",
                aboutP1: "TUTORAI is a lightweight, privacy-focused chat application... (Default)",
                aboutP2: "Remarkably, this entire application... (Default)",
                aboutAuthorLabel: "Author: (Default)",
                aboutGithubLabel: "GitHub: (Default)",
                aboutGithubLinkText: "github.com/VOVSn (Default)",
                aboutP4: "This project is open-source. (Default)",

                tutorWelcomeBack: "Welcome back! Last time you were practicing {last_learn_lang}... (Default)",
                tutorAskLanguageDirection: "What language would you like to learn...? (Default)",
                tutorAskDirectionClarification: "Okay, {learn_lang}! And would you like to translate...? (Default)",
                tutorUnclearIntent: "I'm sorry, I didn't quite catch that. (Default)",
                tutorReadyToStartLesson: "Great! Let's start your {learn_lang} lesson... (Default)",
                tutorTranslateThis: "Please translate this sentence to {output_lang}: (Default)",
                tutorLessonComplete: "Lesson complete! Well done. (Default)",
                tutorExiting: "Exiting tutoring mode. (Default)",
                tutorErrorGeneral: "An error occurred in the tutoring session. (Default)",
                tutorErrorOllamaResponse: "Sorry, I couldn't understand the learning model's response. (Default)",
                tutorErrorNoSentences: "Sorry, I couldn't get sentences for you. (Default)",
                tutorChatInputPlaceholder: "Enter your response or translation... (Default)",
                tutorChatInputTranslationPlaceholder: "Enter your translation to {output_lang}... (Default)"
             }
        };
        return false; // Failure
    }
}

// --- Translation Functions ---
function getTranslation(key, replacements = {}) {
    let translation = translations[currentLanguage]?.[key] || key; // Fallback to key itself if not found
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
        // const isPlaceholder = el.hasAttribute('placeholder') && el.tagName === 'INPUT'; // Not used this way currently

        if (el.id === 'startStudyBtnMain') return; 

        if (isButton || isTitleElement) {
            el.textContent = getTranslation(key);
        } else if (el.hasAttribute('placeholder') && el.tagName === 'INPUT' && key) { // Generic placeholder handling
             el.placeholder = getTranslation(key);
        } else {
            el.textContent = getTranslation(key);
        }
    });

    if (agentNameDiv) agentNameDiv.textContent = getTranslation('agentName');
    setAgentStatus(isAiResponding ? 'typing' : (isTutoringActive ? 'tutoring' : 'active'));

    if (settingsButton) settingsButton.title = getTranslation('settingsTitle');

    // Specific placeholders if not covered by data-translate-key generic handling
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

function setAgentStatus(statusKey) { // statusKey is like 'typing', 'tutoring', 'active'
    if (agentStatusDiv) {
        agentStatusDiv.classList.remove('reachable', 'not-reachable', 'tutoring'); // Clear previous specific classes
        let statusText = '';
        switch (statusKey) {
            case 'typing':
                statusText = getTranslation('agentStatusTyping');
                // No specific class for typing, just text
                break;
            case 'tutoring':
                statusText = getTranslation('agentStatusTutoring');
                agentStatusDiv.classList.add('tutoring');
                break;
            case 'active': // This implies checking reachability
            default:
                // This will set reachable/not-reachable class and text
                updateAgentHeaderStatus(); 
                return; // updateAgentHeaderStatus sets its own text
        }
        agentStatusDiv.textContent = statusText;
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

    learnerStatsContent.innerHTML = ''; 

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
                    if (isNaN(val)) val = 0;

                    if (val > 1 && val <= 100) accuracyToDisplay = val;
                    else if (val >= 0 && val <= 1) accuracyToDisplay = val * 100;
                    else if (val > 100) accuracyToDisplay = 100;
                    else accuracyToDisplay = 0;
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
            const recentHistory = state.lesson_history_summary.slice(-5).reverse();
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
        localStorage.setItem(MARKDOWN_ENABLED_KEY, this.checked.toString()); // Store as string "true" or "false"
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
        // Save it back to ensure it's stored consistently, e.g. if it was null before
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
    ollamaTemperatureInput.addEventListener('input', () => { 
        if (ollamaTemperatureInput.value.includes(',')) {
            ollamaTemperatureInput.value = ollamaTemperatureInput.value.replace(',', '.');
        }
    });
    ollamaTemperatureInput.addEventListener('change', () => {
        let tempValue = parseFloat(ollamaTemperatureInput.value);
        if (isNaN(tempValue) || tempValue < 0.1) tempValue = 0.1;
        else if (tempValue > 1.0) tempValue = 1.0;

        ollamaTemperatureInput.value = tempValue.toFixed(1); 
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
        ollamaBaseUrlToTest = parsedUrl.origin; // Test base URL (e.g. http://localhost:11434)
    } catch (e) {
        console.warn("Invalid Ollama endpoint URL:", endpointUrlFromInput, e);
        return { reachable: false, errorType: 'invalid_url' };
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        // Fetch the base URL, not the /api/generate endpoint for a general check
        const response = await fetch(ollamaBaseUrlToTest, { method: 'GET', mode: 'cors', signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            const responseText = await response.text(); // Ollama base URL usually returns "Ollama is running"
            if (responseText.toLowerCase().includes("ollama is running")) {
               return { reachable: true, status: 'running' };
            } else {
               // It's reachable but doesn't say "Ollama is running". Still, server is up.
               return { reachable: true, status: 'ok_unexpected_content' }; 
            }
        } else {
            return { reachable: false, errorType: 'http_error', statusCode: response.status };
        }
    } catch (error) {
        console.warn('Ollama reachability test failed:', error);
         // Differentiate network errors (fetch_error) from aborts (timeout)
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
            } else { // 'ok_unexpected_content'
                setOllamaStatusPanelText('ollamaStatusOKUnexpected', {}, 'success');
            }
        } else {
            if (result.errorType === 'invalid_url') {
                setOllamaStatusPanelText('ollamaStatusInvalidURL', {}, 'error');
            } else if (result.errorType === 'http_error') {
                 setOllamaStatusPanelText('ollamaStatusReachableWithCode', { status: result.statusCode }, 'error');
            } else { // 'fetch_error', 'timeout', or other
                setOllamaStatusPanelText('ollamaStatusNotReachable', {}, 'error');
            }
        }
        isOllamaReachableForHeader = result.reachable; // Update header status based on this check
        updateAgentHeaderStatus();

        isCheckingOllama = false;
        checkOllamaStatusBtn.disabled = false;
        startPeriodicOllamaHeaderCheck(); // Restart periodic check
        setTimeout(() => {
            // Clear status text only if panel is still open and the same status is shown
            if (ollamaStatusText.dataset.key && settingsPanel.classList.contains('is-open')) { 
                setOllamaStatusPanelText('', {}, ''); // Clear by setting to empty
            }
        }, 5000); // Clear after 5 seconds
    });
}

async function checkOllamaForHeaderUpdate() {
    if (isAiResponding || isCheckingOllama || isTutoringActive) return; // Don't check if busy

    const result = await _performOllamaReachabilityTest();
    isOllamaReachableForHeader = result.reachable;
    if (!isAiResponding) { // Only update header if AI is not currently "typing"
         updateAgentHeaderStatus();
    }
}

function startPeriodicOllamaHeaderCheck() {
    if (ollamaHeaderCheckIntervalId) clearInterval(ollamaHeaderCheckIntervalId); // Clear existing if any
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
            // Ensure dimensions are at least 1px to avoid canvas errors
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
    if (imageUpload) imageUpload.value = ''; // Reset file input
}

if (attachFileBtn && imageUpload && imagePreviewContainer && imagePreview && removeImageBtn) {
    attachFileBtn.addEventListener('click', () => {
        if (isTutoringActive) return; // Disable image upload during tutoring
        imageUpload.click();
    });

    imageUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                currentOriginalImageBase64DataUri = e.target.result;
                imagePreview.src = currentOriginalImageBase64DataUri; // Show original initially for speed
                imagePreviewContainer.style.display = 'block';
                currentResizedPreviewDataUri = null; // Reset

                try {
                    // Generate and store the smaller preview for chat history
                    currentResizedPreviewDataUri = await generateResizedPreview(currentOriginalImageBase64DataUri);
                    // Optionally, update imagePreview.src to the resized one if you want the preview box to show the exact data that will be stored for history display
                    // imagePreview.src = currentResizedPreviewDataUri; 
                } catch (error) {
                    console.error("Error generating resized preview for history:", error);
                    // Fallback: use original if resizing fails, though it might be large for history
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
    // console.log("[MarkdownDebug] Formatting AI message. Text:", text.substring(0, 50) + "...", "useMarkdown:", useMarkdown, "marked defined:", typeof marked !== 'undefined', "MarkdownToggle checked:", markdownToggle ? markdownToggle.checked : "N/A");

    if (useMarkdown && typeof marked !== 'undefined') {
        try {
            const parsed = marked.parse(text, { breaks: true, gfm: true });
            // console.log("[MarkdownDebug] Parsed with marked:", parsed.substring(0,100) + "...");
            return parsed;
        } catch (e) {
            console.error("[MarkdownDebug] Error in marked.parse:", e);
            // Fallback to plain text on error
            const tempDiv = document.createElement('div');
            tempDiv.textContent = text;
            return tempDiv.innerHTML.replace(/\n/g, '<br>');
        }
    } else {
        // console.log("[MarkdownDebug] Using plain text rendering.");
        const tempDiv = document.createElement('div');
        tempDiv.textContent = text; // This correctly escapes HTML entities if any are in 'text'
        const plainRender = tempDiv.innerHTML.replace(/\n/g, '<br>'); // Then convert newlines
        // console.log("[MarkdownDebug] Plain text render:", plainRender.substring(0,100) + "...");
        return plainRender;
    }
}

function renderMessageToDOM(messageData, isStreamingPlaceholder = false) {
    addDateSeparator(messageData.timestamp);

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', messageData.type); // e.g. 'user', 'ai', 'tutor'

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    let displayText = messageData.text || "";

    if (messageData.type === 'ai' || messageData.type === 'tutor') {
        contentDiv.innerHTML = formatAiMessageContent(displayText.trim());
    } else if (messageData.type === 'user') {
        if (messageData.imageBase64) { // Image data for display in chat
            const imgPreviewElement = document.createElement('img');
            imgPreviewElement.src = messageData.imageBase64; 
            imgPreviewElement.alt = getTranslation('userImagePreviewAlt');
            imgPreviewElement.classList.add('message-image-preview');
            contentDiv.appendChild(imgPreviewElement);
        } else if (messageData.hasImage) { // Fallback if no base64, but we know there was an image
            const svgIconNS = "http://www.w3.org/2000/svg";
            const svgIcon = document.createElementNS(svgIconNS, "svg");
            svgIcon.setAttribute("viewBox", "0 0 24 24");
            svgIcon.classList.add('message-image-fallback-icon');
            const path = document.createElementNS(svgIconNS, "path");
            path.setAttribute("d", "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z");
            svgIcon.appendChild(path);
            contentDiv.appendChild(svgIcon);
        }

        if (displayText.trim()) { // Add text if present
            const textNode = document.createTextNode(displayText); // Ensures text is treated as text
            contentDiv.appendChild(textNode);
        }
    } else { // Other message types (e.g., system, though usually handled by displaySystemMessage)
        contentDiv.textContent = displayText;
    }
    messageDiv.appendChild(contentDiv);

    const timeDiv = document.createElement('div');
    timeDiv.classList.add('message-time');
    if (!isStreamingPlaceholder) { // Don't show time for empty streaming placeholder
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
        displaySystemMessage("Error saving history: Storage might be full."); // TODO: Translate this
    }
}

function addNewMessage(text, type, hasImage = false, imageBase64ForHistory = null) {
    // Allow empty text if there's an image for user messages
    if (type !== 'user' && (!text || (typeof text === 'string' && !text.trim())) ) {
         if (!hasImage) return null; // For non-user, text is required or image is not relevant
    }
    if (type === 'user' && !text.trim() && !hasImage) { // User message must have text or image
        return null;
    }


    const messageData = {
        text: text,
        type: type,
        hasImage: hasImage,
        // imageBase64 is the one for *displaying in history*. For 'user' messages, this is currentResizedPreviewDataUri.
        // For AI messages, it's typically null unless the AI itself sends an image (not current feature).
        imageBase64: imageBase64ForHistory, 
        timestamp: Date.now()
    };

    // A placeholder AI message is one that's created visually but doesn't have text content yet because it will be streamed.
    const isPlaceholder = (type === 'ai' && !text && (streamResponsesToggle ? streamResponsesToggle.checked : true));

    const messageElement = renderMessageToDOM(messageData, isPlaceholder);

    // Save to history unless it's a placeholder AI message (which will be saved when complete)
    if (type === 'user' || type === 'tutor' || (type === 'ai' && !isPlaceholder)) {
        saveMessageToHistory(messageData);
    }

    scrollToBottom();
    return messageElement;
}

async function loadChatHistory() {
    if (!chatMessagesContainer) return;
    chatMessagesContainer.innerHTML = ''; // Clear existing messages
    lastMessageDateString = ''; // Reset date separator tracking

    let historyActuallyLoaded = false;
    let systemMessageAlreadyShownAboutLoading = false;

    // Attempt to load from chat_history.json first (if it exists)
    try {
        const response = await fetch('chat_history.json', { cache: "no-store" }); // Disable cache for this
        if (response.ok) {
            const historyFromFile = await response.json();
            if (Array.isArray(historyFromFile) && historyFromFile.length > 0) {
                historyFromFile.forEach(msgData => {
                    // Ensure necessary fields, providing defaults if absent from old history formats
                    msgData.hasImage = msgData.hasImage || false;
                    msgData.imageBase64 = msgData.imageBase64 || null; // This is for displaying in chat
                    renderMessageToDOM(msgData);
                });
                historyActuallyLoaded = true;
                // Overwrite localStorage with this history if loaded from file
                localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(historyFromFile));
                displaySystemMessage("systemMsgLoadedFromFile");
                systemMessageAlreadyShownAboutLoading = true;
            } else if (Array.isArray(historyFromFile) && historyFromFile.length === 0) {
                console.info("chat_history.json is empty. Will try localStorage.");
                // If file is empty, clear localStorage too to sync states
                localStorage.removeItem(CHAT_HISTORY_KEY);
            } else {
                console.warn("chat_history.json is not a valid history array. Will try localStorage.");
            }
        } else if (response.status !== 404) { // Log errors other than "not found"
            console.warn(`Error loading chat_history.json (status: ${response.status}). Will try localStorage.`);
        }
    } catch (error) {
        // This usually means chat_history.json doesn't exist or network error
        console.info("Could not load chat_history.json (likely not present). Will try localStorage:", error.message);
    }

    // If not loaded from file, try localStorage
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
                        displaySystemMessage("systemMsgLoadedFromStorage");
                        systemMessageAlreadyShownAboutLoading = true;
                    }
                } else {
                     console.info("Browser's local storage for chat history is empty or invalid array.");
                }
            } catch (e) {
                console.error("Error parsing history from local storage. Clearing it.", e);
                localStorage.removeItem(CHAT_HISTORY_KEY); // Clear corrupted history
            }
        }
    }

    if (!historyActuallyLoaded && !systemMessageAlreadyShownAboutLoading) {
         displaySystemMessage("systemMsgNoHistory");
    }

    scrollToBottom();
}

if (clearChatHistoryBtn) {
    clearChatHistoryBtn.addEventListener('click', () => {
        if (isTutoringActive) {
            // TODO: Translate this alert if needed, or use a custom modal
            alert(getTranslation("clearHistoryFailTutoringActive", {})); 
            return;
        }
        if (confirm(getTranslation('confirmClearHistory'))) {
            localStorage.removeItem(CHAT_HISTORY_KEY);
            if(chatMessagesContainer) chatMessagesContainer.innerHTML = ''; // Clear UI
            lastMessageDateString = ''; // Reset date separator
            displaySystemMessage("systemMsgHistoryCleared"); // Confirmation message
            if (settingsPanel && settingsPanel.classList.contains('is-open')) {
                settingsPanel.classList.remove('is-open'); // Close settings panel
            }
        }
    });
}

// --- Ollama Integration (General Chat) ---
function getChatHistoryForPrompt() {
    const historyJson = localStorage.getItem(CHAT_HISTORY_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];

    // Filter for user, AI, and tutor messages to build context
    const recentMessages = history
        .filter(msg => msg.type === 'user' || msg.type === 'ai' || msg.type === 'tutor')
        .slice(-MAX_HISTORY_FOR_PROMPT);

    const userLabel = getTranslation('ollamaPromptUserLabel');
    const aiLabel = getTranslation('ollamaPromptAiLabel'); // Tutor messages will also use AI label in prompt

    return recentMessages.map(msg => {
        const prefix = (msg.type === 'user') ? userLabel : aiLabel;
        let messageContent = msg.text || "";
        // If user message has image but no text, represent image in prompt
        if (msg.type === 'user' && msg.hasImage && !msg.text.trim()) {
            // Use a generic placeholder for the image in the text prompt
            messageContent = `[${getTranslation('userImageContextInPrompt', {altText: getTranslation('userImagePreviewAlt')})}]`;
        }
        return `${prefix}: ${messageContent}`;
    }).join('\n');
}

function constructOllamaPrompt(userInput, chatHistoryString, currentMessageHasImage) {
    const systemPrompt = getTranslation('ollamaPromptSystem');
    const userLabel = getTranslation('ollamaPromptUserLabel');
    const aiLabel = getTranslation('ollamaPromptAiLabel');

    let fullPrompt = `${systemPrompt}\n\n`; // Start with system prompt
    if (chatHistoryString) {
        fullPrompt += `Previous conversation:\n${chatHistoryString}\n\n`;
    }

    // Construct current user input line
    let currentUserInputLine = `${userLabel}: `;
    if (currentMessageHasImage) {
        // Add a generic placeholder if an image is part of the current message
        currentUserInputLine += `[${getTranslation('userImageContextInPrompt', {altText: getTranslation('userImagePreviewAlt')})}] `;
    }
    currentUserInputLine += (userInput || ""); // Add user text if any

    fullPrompt += `${currentUserInputLine}\n${aiLabel}:`; // Append current input and prompt AI for response
    return fullPrompt;
}

async function callOllamaApi(promptText, onTokenCallback, imageBase64Payload = null) {
    const endpoint = (ollamaEndpointInput ? ollamaEndpointInput.value : null) || 'http://localhost:11434/api/generate';
    const model = (ollamaModelInput ? ollamaModelInput.value : null) || 'gemma3:4b';
    const stream = streamResponsesToggle ? streamResponsesToggle.checked : true;

    let temperatureValue = DEFAULT_OLLAMA_TEMPERATURE;
    if (ollamaTemperatureInput) {
        const parsedTemp = parseFloat(ollamaTemperatureInput.value);
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

    if (imageBase64Payload) { // Ollama expects images as an array of base64 strings
        requestPayload.images = [imageBase64Payload]; // Ensure it's just the base64 part
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

            // Read the stream
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true }); // Process chunk
                const lines = chunk.split('\n').filter(line => line.trim() !== ''); // Split into lines
                for (const line of lines) {
                    try {
                        const jsonResponse = JSON.parse(line);
                        if (jsonResponse.response) { // Ollama streams token in 'response'
                            onTokenCallback(jsonResponse.response);
                        }
                        if (jsonResponse.done) { // Check if stream is done
                            return; // Exit loop
                        }
                    } catch (e) {
                        console.warn("Error parsing streamed JSON line:", line, e);
                        // Potentially handle partial JSON if necessary, or just log and continue
                    }
                }
            }
            return; // Streaming finished
        } else { // Not streaming or no response.body
            const data = await response.json();
            return data.response; // Return full response if not streamed
        }
    } catch (error) {
        console.error("Error calling Ollama API:", error);
        isOllamaReachableForHeader = false; // Assume not reachable on error
        updateAgentHeaderStatus();
        throw error; // Re-throw to be caught by caller
    }
}

function createVisualAiMessage() {
    const timestamp = Date.now(); // Timestamp for when streaming starts
    addDateSeparator(timestamp);

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'ai'); // AI message styling

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerHTML = ''; // Start with empty content
    messageDiv.appendChild(contentDiv);

    const timeDiv = document.createElement('div');
    timeDiv.classList.add('message-time');
    // Time will be added once streaming is complete
    messageDiv.appendChild(timeDiv);

    if(chatMessagesContainer) chatMessagesContainer.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv; // Return the created message element
}

// --- TUTORING FEATURE IMPLEMENTATION ---

function getDefaultUserState() {
    return {
        version: "1.1", 
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
        current_lesson_data: { // Store details about an ongoing lesson for potential resume (not fully implemented yet) or analysis
            input_lang: null,
            output_lang: null,
            interactions: [] // individual Q&As within a lesson
        }
    };
}

function loadUserState() {
    const storedState = localStorage.getItem(USER_STATE_KEY);
    if (storedState) {
        try {
            user_state = JSON.parse(storedState);
            // Version check for future migrations
            if (!user_state.version || user_state.version !== "1.1") {
                console.warn("User state version mismatch or missing. Resetting to default.");
                user_state = getDefaultUserState();
                saveUserState(); // Save the new default state
            }
            // Ensure current_lesson_data is reset if a lesson wasn't properly concluded
            if (user_state.current_lesson_data && user_state.current_lesson_data.input_lang) {
                console.log("Found incomplete lesson data from previous session. Clearing it.");
                user_state.current_lesson_data = { input_lang: null, output_lang: null, interactions: [] };
                saveUserState();
            }

        } catch (e) {
            console.error("Error parsing user_state from localStorage. Resetting to default.", e);
            user_state = getDefaultUserState();
            saveUserState(); // Save the new default state
        }
    } else {
        user_state = getDefaultUserState();
        // No need to save here, will be saved upon first modification or lesson start
    }
    updateStudyButtonText(); // Update button based on loaded/default state
}

function saveUserState() {
    if (user_state) {
        try {
            // If tutoring is not active, ensure current_lesson_data is cleared before saving
            // This prevents saving mid-lesson state if tutoring is exited unexpectedly
            if (!isTutoringActive && user_state.current_lesson_data && user_state.current_lesson_data.input_lang) {
                 user_state.current_lesson_data = { input_lang: null, output_lang: null, interactions: [] };
            }
            localStorage.setItem(USER_STATE_KEY, JSON.stringify(user_state));
        } catch (e) {
            console.error("Error saving user_state to localStorage:", e);
            // Potentially notify user if storage is full
        }
    }
}

function updateStudyButtonText() {
    let buttonTextKey = 'studySessionBtn'; // Default: "Start Study Session"
    let replacements = {};
    if (isTutoringActive && currentLessonConfig.learn_lang) {
         // If tutoring is active and learn_lang is set, show "Study: [language]"
         buttonTextKey = 'studySessionBtnContinue';
         replacements = { learn_lang: currentLessonConfig.learn_lang };
    } else if (user_state && user_state.user_preferences && user_state.user_preferences.last_learn_lang) {
        // If not active, but there was a last language, also show "Study: [language]"
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
    if (attachFileBtn) attachFileBtn.disabled = true; // Also disable attach file during tutoring
}
function enableChatInputAfterTutor(isStillTutoring = false) {
    if (chatInput) {
        chatInput.disabled = false;
        if (isStillTutoring) {
            // If still tutoring, placeholder might be specific (e.g., "translate to X") or general tutor input
            // The specific tutor step (e.g., startTranslationExerciseCycle) will set the more specific placeholder.
            // Otherwise, fall back to the general tutor placeholder.
            if (!chatInput.placeholder.startsWith(getTranslation('tutorChatInputTranslationPlaceholder', {output_lang: ''}).substring(0,10))) { // Avoid overwriting specific translation placeholder
                 chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
            }
        } else {
            chatInput.placeholder = getTranslation('chatInputPlaceholder'); // General chat placeholder
        }
    }
    if (sendButton) sendButton.disabled = false;
    if (attachFileBtn) attachFileBtn.disabled = false; // Re-enable attach file if not tutoring
}

function displayTutorMessage(textOrKey, type = 'tutor', replacements = {}) {
    // Check if textOrKey is a key in translations, otherwise use it as literal text
    const messageText = translations[currentLanguage]?.[textOrKey] ? getTranslation(textOrKey, replacements) : textOrKey;
    addNewMessage(messageText, type); // 'tutor' type messages are styled like 'ai'
}

async function callTutorOllamaApi(promptBlueprintObject) {
    const endpoint = (ollamaEndpointInput ? ollamaEndpointInput.value : null) || 'http://localhost:11434/api/generate';
    const model = (ollamaModelInput ? ollamaModelInput.value : null) || 'gemma3:4b'; // Consider a specific model for tutoring if needed

    // System prompt for the tutor model
    const ollamaSystemPrompt = `You are an AI language tutor state machine. You will receive a JSON object describing the current context and user input. Your task is to analyze this input and return a JSON object in the specified 'desired_output_format'. Do NOT add any explanatory text outside the JSON response.`;

    // User prompt containing the JSON blueprint
    const ollamaUserPrompt = `Current task and state:\n\`\`\`json\n${JSON.stringify(promptBlueprintObject, null, 2)}\n\`\`\`\nPlease provide your response strictly in the 'desired_output_format' JSON structure.`;

    const requestPayload = {
        model: model,
        prompt: ollamaUserPrompt,
        system: ollamaSystemPrompt, // Add the system prompt
        stream: false, // Tutor interactions are expected to be single JSON responses
        format: "json", // Request JSON output from Ollama
        options: {
            temperature: 0.5 // Moderate temperature for structured output
        }
    };

    isTutorResponding = true;
    disableChatInputForTutor('tutorThinkingPlaceholder'); // Use a "thinking" placeholder

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
            const errorText = await response.text(); // Get more error details
            throw new Error(`Tutor Ollama API Error: ${response.status} - ${errorText}`);
        }
        const data = await response.json(); // Ollama with format:"json" should return JSON in `response`

        let jsonData;
        // Ollama's JSON mode might put the JSON string inside `data.response` or directly in `data.message.content`
        if (typeof data.response === 'string') {
            try {
                jsonData = JSON.parse(data.response);
            } catch (e) {
                 console.error("Failed to parse JSON from Ollama tutor response string:", data.response, e);
                 throw new Error("Tutor model did not return valid JSON in response string.");
            }
        } else if (typeof data.response === 'object') { // Already an object (less common for ollama /generate)
            jsonData = data.response;
        } else if (data.message && data.message.content && typeof data.message.content === 'string') { // Check newer Ollama format
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
        displayTutorMessage('tutorErrorGeneral'); // Generic error message to user
        throw error; // Re-throw for higher-level handling (e.g., exit tutoring)
    } finally {
        isTutorResponding = false;
        // Input will be re-enabled by the calling function if appropriate
    }
}

async function handleInitialTutorInteraction(userInputText) {
    expectedTutorResponseHandler = null; // Clear handler for this step
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
        current_user_state_summary: { // Provide some summary for context if available
            language_proficiency: user_state.language_proficiency 
        },
        desired_output_format: {
            description: "Return a JSON object indicating the user's intention and any specified languages. 'intention' can be 'continue_previous', 'new_lesson_specified', 'choose_new_language', 'choose_new_direction', 'unclear'. If 'new_lesson_specified', fill in 'learn_lang', 'input_lang', 'output_lang'. If only language is new, fill 'learn_lang'. If only direction is new, set 'intention' to 'choose_new_direction' and 'learn_lang' to last_learn_lang.",
            example: { intention: "continue_previous", learn_lang: "spanish", input_lang: "spanish", output_lang: "english" }
        }
    };

    // Replace placeholders in system instruction
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
                // If intention is unclear or needs more info (e.g., 'choose_new_language')
                displayTutorMessage('tutorAskLanguageDirection'); // Ask generally
                expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
                enableChatInputAfterTutor(true);
                chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
            }
        } else {
            throw new Error("Invalid LLM response structure for initial interaction.");
        }
    } catch (error) {
        displayTutorMessage('tutorErrorOllamaResponse'); // Inform user
        // Fallback: ask generally again or exit
        exitTutoringMode(); // Or retry by setting expectedTutorResponseHandler
    }
}

async function handleGeneralLanguageDirectionSetup(userInputText) {
    expectedTutorResponseHandler = null;
    const promptBlueprint = {
        system_instruction: "You are an AI assistant helping a user set up a language lesson. Their known/primary language is '{known_lang}'. Analyze their response to identify: 1. The language they want to learn/practice ('learn_lang'). 2. The source language for translation ('input_lang'). 3. The target language for translation ('output_lang'). One of input/output should be 'learn_lang'. The other is often '{known_lang}' unless specified otherwise.",
        user_current_response: userInputText,
        known_lang: KNOWN_LANG,
        current_user_state_summary: { // Include user state for better suggestions
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

            // Validation: learn_lang must be one of input/output, and they can't be same
            const langs = [currentLessonConfig.input_lang, currentLessonConfig.output_lang];
            if (!langs.includes(currentLessonConfig.learn_lang)) {
                 throw new Error("Learn language is not part of the input/output pair.");
            }
            if (currentLessonConfig.input_lang === currentLessonConfig.output_lang) {
                throw new Error("Input and output languages cannot be the same.");
            }

            await prepareLessonCore();
        } else if (llmResponse && llmResponse.learn_lang && (!llmResponse.input_lang || !llmResponse.output_lang)) {
            // If learn_lang is identified but direction is missing
            currentLessonConfig.learn_lang = llmResponse.learn_lang.toLowerCase();
            displayTutorMessage('tutorAskDirectionClarification', 'tutor', { learn_lang: currentLessonConfig.learn_lang, known_lang: KNOWN_LANG });
            expectedTutorResponseHandler = handleDirectionClarification;
            enableChatInputAfterTutor(true);
            chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
        }
        else { // Unclear response from LLM
            displayTutorMessage('tutorUnclearIntent'); // Ask user to rephrase
            expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup; // Retry this step
            enableChatInputAfterTutor(true);
            chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
        }
    } catch (error) {
         console.error("Error in language/direction setup:", error);
        displayTutorMessage('tutorErrorOllamaResponse'); // Inform user
        // Fallback to asking again generally
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
        learn_lang_context: currentLessonConfig.learn_lang, // Remind LLM of the learn_lang
        known_lang_context: KNOWN_LANG,
        user_current_response: userInputText,
        desired_output_format: {
            description: "Return a JSON object with 'input_lang' and 'output_lang'. Values should be '{learn_lang}' or '{known_lang}'. If unclear, set to null.",
            example: { input_lang: "english", output_lang: "spanish" }
        }
    };
    // Replace placeholders in instructions and example
    promptBlueprint.system_instruction = promptBlueprint.system_instruction
        .replace(/{learn_lang}/g, currentLessonConfig.learn_lang)
        .replace(/{known_lang}/g, KNOWN_LANG);
    promptBlueprint.desired_output_format.description = promptBlueprint.desired_output_format.description
        .replace(/{learn_lang}/g, currentLessonConfig.learn_lang)
        .replace(/{known_lang}/g, KNOWN_LANG);


    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && llmResponse.input_lang && llmResponse.output_lang) {
            currentLessonConfig.input_lang = llmResponse.input_lang.toLowerCase();
            currentLessonConfig.output_lang = llmResponse.output_lang.toLowerCase();
            // Validate the received languages
            if (currentLessonConfig.input_lang === currentLessonConfig.output_lang) {
                throw new Error("Input and output languages cannot be same after clarification.");
            }
            // Ensure the pair makes sense (one is learn_lang, other is known_lang)
            const langs = [currentLessonConfig.input_lang, currentLessonConfig.output_lang];
            if (!langs.includes(currentLessonConfig.learn_lang) || !langs.includes(KNOWN_LANG)) {
                // This specific check might be too restrictive if user wants to learn lang A from lang B (neither is KNOWN_LANG)
                // For now, assume one of them is KNOWN_LANG
                if (!( (currentLessonConfig.input_lang === currentLessonConfig.learn_lang && currentLessonConfig.output_lang === KNOWN_LANG) ||
                       (currentLessonConfig.input_lang === KNOWN_LANG && currentLessonConfig.output_lang === currentLessonConfig.learn_lang) )) {
                    throw new Error("Invalid language pair after clarification (must involve learn_lang and known_lang).");
                }
            }
            await prepareLessonCore();
        } else { // Unclear response from LLM
            displayTutorMessage('tutorUnclearIntent');
            // Ask again for clarification
            displayTutorMessage('tutorAskDirectionClarification', 'tutor', { learn_lang: currentLessonConfig.learn_lang, known_lang: KNOWN_LANG });
            expectedTutorResponseHandler = handleDirectionClarification; // Retry this step
            enableChatInputAfterTutor(true);
            chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
        }
    } catch (error) {
         console.error("Error in direction clarification:", error);
        displayTutorMessage('tutorErrorOllamaResponse');
        // Fallback: go back to general language direction setup
        displayTutorMessage('tutorAskLanguageDirection');
        expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
        enableChatInputAfterTutor(true);
        chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
    }
}


async function prepareLessonCore() {
    // Update user preferences with the new lesson config
    user_state.user_preferences.last_learn_lang = currentLessonConfig.learn_lang;
    user_state.user_preferences.last_input_lang = currentLessonConfig.input_lang;
    user_state.user_preferences.last_output_lang = currentLessonConfig.output_lang;
    
    // Initialize proficiency for the language if it's new
    if (!user_state.language_proficiency[currentLessonConfig.learn_lang]) {
        user_state.language_proficiency[currentLessonConfig.learn_lang] = {
            level: 0.1, last_practiced_utc: null, strengths: [], weaknesses: [],
            correct_streak_session: 0, overall_accuracy_estimate: 0 // 0-1 scale for accuracy
        };
    }
    // Initialize learning focus if new
    if (!user_state.learning_focus[currentLessonConfig.learn_lang]) {
        user_state.learning_focus[currentLessonConfig.learn_lang] = [];
    }

    // Reset current lesson data in user_state for the new lesson
    user_state.current_lesson_data = {
        input_lang: currentLessonConfig.input_lang,
        output_lang: currentLessonConfig.output_lang,
        interactions: [] // Reset interactions for the new lesson
    };
    lesson_interactions = []; // Also reset global lesson_interactions array for this session
    saveUserState(); // Save updated preferences and initialized structures
    updateStudyButtonText(); // Reflect new learn_lang on button

    displayTutorMessage('tutorReadyToStartLesson', 'tutor', {
        learn_lang: currentLessonConfig.learn_lang,
        input_lang: currentLessonConfig.input_lang,
        output_lang: currentLessonConfig.output_lang
    });

    // Prompt to get sentences from LLM
    const promptBlueprint = {
        system_instruction: "You are a helpful and encouraging language teaching AI. The student wants to translate 5 sentences from '{input_lang}' to '{output_lang}'. Their primary goal is to improve their '{learn_lang}'. Based on their current learning state for '{learn_lang}' (proficiency level, strengths, weaknesses), provide 5 sentences in '{input_lang}'. The sentences should be suitable for their proficiency in '{learn_lang}' when translated, gradually increasing in complexity if appropriate. Focus on common vocabulary and grammar structures.",
        student_learning_state: user_state, // Provide full user state for context
        lesson_config: currentLessonConfig,
        desired_output_format: {
            description: "Return a JSON object with a single key 'sentences', which is an array of 5 strings. These strings are the sentences in '{input_lang}' for the student to translate.",
            example: {"sentences": ["sentence1 in input_lang", "sentence2 in input_lang", "sentence3 in input_lang", "sentence4 in input_lang", "sentence5 in input_lang"]}
        }
    };
    // Replace placeholders
    promptBlueprint.system_instruction = promptBlueprint.system_instruction
        .replace(/{input_lang}/g, currentLessonConfig.input_lang)
        .replace(/{output_lang}/g, currentLessonConfig.output_lang)
        .replace(/{learn_lang}/g, currentLessonConfig.learn_lang);
    promptBlueprint.desired_output_format.description = promptBlueprint.desired_output_format.description
        .replace('{input_lang}', currentLessonConfig.input_lang);
    promptBlueprint.desired_output_format.example.sentences = promptBlueprint.desired_output_format.example.sentences.map(s => s.replace('input_lang', currentLessonConfig.input_lang));


    try {
        const llmResponse = await callTutorOllamaApi(promptBlueprint);
        if (llmResponse && llmResponse.sentences && Array.isArray(llmResponse.sentences) && llmResponse.sentences.length > 0) { // Check for at least 1 sentence
            lesson_sentences = llmResponse.sentences.slice(0, 5); // Take up to 5 sentences
            current_sentence_index = 0;
            startTranslationExerciseCycle(); // Start the first exercise
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
        enableChatInputAfterTutor(true); // Enable input for user's translation
        chatInput.placeholder = getTranslation('tutorChatInputTranslationPlaceholder', {output_lang: currentLessonConfig.output_lang});
        chatInput.focus();
    } else {
        concludeLesson(); // All sentences done
    }
}

async function processUserTranslation(userTranslationText) {
    expectedTutorResponseHandler = null;
    const originalSentence = lesson_sentences[current_sentence_index];

    const promptBlueprint = {
        system_instruction: "You are a helpful and encouraging language teaching AI. The student is learning '{learn_lang}'. They translated a sentence from '{input_lang}' to '{output_lang}'. Evaluate their translation for accuracy and naturalness. Provide specific corrections (if any), positive reinforcement, and brief, actionable advice. Update their learning state, including proficiency level (0.0 to 1.0 scale), strengths, weaknesses, overall_accuracy_estimate (0.0 to 1.0, reflecting this attempt and past performance), and correct_streak_session. Be detailed in the state update.",
        exercise_details: {
            learn_lang: currentLessonConfig.learn_lang,
            input_lang: currentLessonConfig.input_lang,
            original_sentence: originalSentence,
            output_lang: currentLessonConfig.output_lang,
            user_translation: userTranslationText
        },
        student_learning_state_before_this_interaction: user_state, // Pass the entire current user_state
        desired_output_format: {
            description: "Return a JSON object with: 'feedback_text' (string, combines corrections and advice for the user, e.g., 'Good try! A small correction: ... Also, remember ...'), and 'updated_user_state' (the *complete, modified* user_state JSON object reflecting changes based on this interaction. Ensure '{learn_lang}' proficiency metrics like level, strengths, weaknesses, last_practiced_utc, overall_accuracy_estimate (as a decimal 0.0-1.0), correct_streak_session are updated. The overall_accuracy_estimate should be a weighted average or similar, not just this one attempt).",
            example: { feedback_text: "Excellent! That's correct. / Almost there! Instead of 'X', try 'Y'. This is because...", updated_user_state: { /* complete user_state object */ } }
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
        // Ensure all expected parts of the response are present
        if (llmResponse && typeof llmResponse.feedback_text === 'string' && llmResponse.updated_user_state && typeof llmResponse.updated_user_state === 'object') {
            displayTutorMessage(llmResponse.feedback_text, 'tutor'); // Display feedback to user

            // IMPORTANT: Update the global user_state with the one returned by the LLM
            user_state = llmResponse.updated_user_state; 
            
            // Ensure current_lesson_data is preserved or re-initialized if wiped by LLM
            if (!user_state.current_lesson_data || !user_state.current_lesson_data.input_lang) {
                user_state.current_lesson_data = {
                    input_lang: currentLessonConfig.input_lang,
                    output_lang: currentLessonConfig.output_lang,
                    interactions: lesson_interactions // Restore from local copy if LLM cleared it
                };
            }


            // Record this interaction for the lesson summary
            const interactionData = {
                original_sentence: originalSentence,
                user_translation: userTranslationText,
                ai_feedback: llmResponse.feedback_text // Storing the combined feedback
                // ai_correction: llmResponse.your_corrections, // If you split them in prompt
                // ai_advice: llmResponse.your_advice // If you split them in prompt
            };
            lesson_interactions.push(interactionData); // Update local session log
            // Also update it in the user_state being prepared for saving
            if(user_state.current_lesson_data && user_state.current_lesson_data.interactions) {
                user_state.current_lesson_data.interactions.push(interactionData);
            } else { // Should not happen if initialized correctly
                user_state.current_lesson_data = { interactions: [interactionData], ...currentLessonConfig };
            }


            saveUserState(); // Save the updated state after each interaction

            current_sentence_index++;
            startTranslationExerciseCycle(); // Move to next sentence or conclude
        } else {
            throw new Error("Invalid LLM response structure for feedback. Missing feedback_text or updated_user_state.");
        }
    } catch (error) {
        console.error("Error processing user translation:", error)
        displayTutorMessage('tutorErrorOllamaResponse');
        // Decide how to proceed: skip sentence or end lesson? For now, skip.
        current_sentence_index++;
        startTranslationExerciseCycle();
    }
}

async function concludeLesson() {
    displayTutorMessage("tutorConcludingMessage", 'tutor'); // e.g., "Let's summarize your lesson..."

    // Final update of lesson interactions in user_state before sending to LLM for summary
    if (user_state.current_lesson_data) {
         user_state.current_lesson_data.interactions = lesson_interactions; // Ensure it has the latest
    }

    const promptBlueprint = {
        system_instruction: "You are a helpful and encouraging language teaching AI. The student has completed a lesson translating sentences from '{input_lang}' to '{output_lang}', focusing on improving their '{learn_lang}'. Review their 'student_learning_state_after_lesson' (especially 'current_lesson_data.interactions' and '{learn_lang}' proficiency). Provide a concise, positive summary of their performance, offer motivation, and suggest one or two specific areas for their next focus in '{learn_lang}'.",
        lesson_context: {
            learn_lang: currentLessonConfig.learn_lang,
            input_lang: currentLessonConfig.input_lang,
            output_lang: currentLessonConfig.output_lang,
            number_of_exercises: lesson_interactions.length
        },
        student_learning_state_after_lesson: user_state, // Entire state including all interactions
        desired_output_format: {
            description: "Return a JSON object with: 'lesson_summary_for_user' (string, overall friendly summary and motivation for the student), and 'next_focus_suggestions' (array of strings, 1-2 brief suggestions for what to focus on next in '{learn_lang}', e.g., ['verb conjugations', 'using prepositions']).",
            example: { lesson_summary_for_user: "Great job completing the lesson! You showed good progress in X. Keep practicing Y!", next_focus_suggestions: ["past tense verbs", "sentence structure"] }
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
        // Check for expected fields in the LLM response
        if (llmResponse && typeof llmResponse.lesson_summary_for_user === 'string' && Array.isArray(llmResponse.next_focus_suggestions)) {
            
            displayTutorMessage(`**Lesson Summary:**\n${llmResponse.lesson_summary_for_user}`, 'tutor');

            if (llmResponse.next_focus_suggestions.length > 0 && currentLessonConfig.learn_lang) {
                const suggestionsText = llmResponse.next_focus_suggestions.join(', ');
                displayTutorMessage(`**Next Focus Suggestion for ${currentLessonConfig.learn_lang}:** ${suggestionsText}`, 'tutor');
                
                // Update user_state.learning_focus with these suggestions
                if (user_state.learning_focus && user_state.learning_focus[currentLessonConfig.learn_lang]) {
                    llmResponse.next_focus_suggestions.forEach(suggestion => {
                        if (!user_state.learning_focus[currentLessonConfig.learn_lang].includes(suggestion)) {
                            user_state.learning_focus[currentLessonConfig.learn_lang].push(suggestion);
                        }
                    });
                }
            }

            // Add a summary to lesson_history_summary in user_state
            if (currentLessonConfig.learn_lang && currentLessonConfig.input_lang && currentLessonConfig.output_lang) {
                if (!user_state.lesson_history_summary) user_state.lesson_history_summary = [];
                // Use a part of the LLM's summary or a generic one
                const takeaway = llmResponse.lesson_summary_for_user.substring(0, 150) + (llmResponse.lesson_summary_for_user.length > 150 ? "..." : "");
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
        displayTutorMessage('tutorErrorOllamaResponse'); // Inform user of error
        // Add a generic history item even if LLM summary fails, as lesson did occur
        if (currentLessonConfig.learn_lang && currentLessonConfig.input_lang && currentLessonConfig.output_lang) {
            if (!user_state.lesson_history_summary) user_state.lesson_history_summary = [];
             user_state.lesson_history_summary.push({
                date_utc: new Date().toISOString(),
                lang_pair: `${currentLessonConfig.input_lang}-${currentLessonConfig.output_lang}`,
                learn_lang: currentLessonConfig.learn_lang,
                key_takeaway: "Lesson completed (summary generation error).",
                num_exercises: lesson_interactions.length
            });
        }
    } finally {
        // IMPORTANT: Clear current_lesson_data from user_state as the lesson is now concluded
        if (user_state.current_lesson_data) {
            user_state.current_lesson_data = { input_lang: null, output_lang: null, interactions: [] };
        }
        saveUserState(); // Save the final state including history summary and cleared current_lesson_data
        displayTutorMessage('tutorLessonComplete');
        exitTutoringMode(false); // Exit tutoring mode without showing the "Exiting" message again
    }
}

function initiateTutoringSession() {
    if (isTutoringActive) {
        if (confirm(getTranslation("confirmExitExistingTutoring"))) { // TODO: Add this translation key
            exitTutoringMode(false); // Exit silently before starting new
        } else {
            return; // User cancelled
        }
    }
    if (isAiResponding || isTutorResponding) {
        alert(getTranslation("waitForAiResponseComplete")); // TODO: Add this translation key
        return;
    }

    isTutoringActive = true;
    setAgentStatus('tutoring'); // Update agent header status
    updateStudyButtonText(); // Update button text/title
    disableChatInputForTutor('tutorInitializingPlaceholder'); // Disable main chat input

    loadUserState(); // Ensure user_state is fresh

    const lastLearnLang = user_state.user_preferences.last_learn_lang;
    const lastInputLang = user_state.user_preferences.last_input_lang;
    const lastOutputLang = user_state.user_preferences.last_output_lang;

    // Decide initial prompt based on whether there was a previous session
    if (lastLearnLang && lastInputLang && lastOutputLang) {
        displayTutorMessage('tutorWelcomeBack', 'tutor', {
            last_learn_lang: lastLearnLang,
            last_input_lang: lastInputLang,
            last_output_lang: lastOutputLang
        });
        expectedTutorResponseHandler = handleInitialTutorInteraction;
    } else {
        displayTutorMessage('tutorAskLanguageDirection'); // General prompt for new users
        expectedTutorResponseHandler = handleGeneralLanguageDirectionSetup;
    }
    enableChatInputAfterTutor(true); // Enable input for tutor interaction
    chatInput.placeholder = getTranslation('tutorChatInputPlaceholder');
    chatInput.focus();
    
    // Close any open popups
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
    lesson_interactions = []; // Clear session-specific lesson data
    currentLessonConfig = { learn_lang: null, input_lang: null, output_lang: null }; // Reset config

    // Clear current_lesson_data in user_state if not already cleared by concludeLesson
    if(user_state && user_state.current_lesson_data && user_state.current_lesson_data.input_lang) {
        user_state.current_lesson_data = { input_lang: null, output_lang: null, interactions: [] };
        saveUserState(); // Save the cleared current_lesson_data
    }

    setAgentStatus('active'); // Reset agent header status
    updateStudyButtonText(); // Update study button text
    enableChatInputAfterTutor(false); // Re-enable general chat input
}

if (startStudyBtnMain) {
    startStudyBtnMain.addEventListener('click', initiateTutoringSession);
}

if (clearLearningProgressBtn) {
    clearLearningProgressBtn.addEventListener('click', () => {
        if (confirm(getTranslation('confirmClearLearningProgress'))) {
            localStorage.removeItem(USER_STATE_KEY); // Remove all learning data
            user_state = getDefaultUserState(); // Reset to default state
            if (isTutoringActive) { // If tutoring was active, exit it
                exitTutoringMode(false); // Exit silently
            }
            displaySystemMessage('learningProgressCleared'); // Inform user
            updateStudyButtonText(); // Update button as there's no history now
            if (settingsPanel.classList.contains('is-open')) {
                settingsPanel.classList.remove('is-open'); // Close settings panel
            }
        }
    });
}

// --- END TUTORING FEATURE IMPLEMENTATION ---


if (sendButton && chatInput) {
    const handleSendMessage = async () => {
        const userText = chatInput.value.trim();

        if (isTutoringActive) {
            if (isTutorResponding) return; // Don't send if tutor is already processing
            if (!userText) return; // Require some input for tutor interaction

            addNewMessage(userText, 'user'); // Add user's message to chat
            chatInput.value = ''; // Clear input
            disableChatInputForTutor('tutorThinkingPlaceholder'); // Disable input while tutor thinks

            if (expectedTutorResponseHandler) {
                await expectedTutorResponseHandler(userText); // Process with current handler
            } else {
                // This case should ideally not be reached if logic is correct
                console.warn("Tutoring active but no response handler set. Re-enabling input.");
                enableChatInputAfterTutor(true); // Re-enable input if stuck
            }
            return; // End here for tutoring mode
        }

        // Regular chat mode below
        if (isAiResponding) return; // Don't send if AI is already responding

        const originalImageForProcessing = currentOriginalImageBase64DataUri;
        const previewImageForHistory = currentResizedPreviewDataUri; // This is the smaller one
        const hasImageToSend = !!originalImageForProcessing;

        if (!userText && !hasImageToSend) return; // Nothing to send

        // For user message, use `previewImageForHistory` for display in chat right away
        addNewMessage(userText, 'user', hasImageToSend, previewImageForHistory);
        chatInput.value = '';
        chatInput.focus();
        clearSelectedImageState(); // Clear preview and stored image data

        isAiResponding = true;
        setAgentStatus('typing');
        sendButton.disabled = true;
        if (attachFileBtn) attachFileBtn.disabled = true;
        stopPeriodicOllamaHeaderCheck();

        let ollamaApiImagePayload = null;
        if (hasImageToSend && originalImageForProcessing) {
            try {
                // Resize original image specifically for Ollama API
                const resizedForOllamaDataUri = await resizeImage(
                    originalImageForProcessing,
                    OLLAMA_IMAGE_MAX_DIMENSION_PX,
                    OLLAMA_IMAGE_MAX_DIMENSION_PX,
                    IMAGE_QUALITY_OLLAMA
                );
                ollamaApiImagePayload = resizedForOllamaDataUri.split(',')[1]; // Get only base64 part
            } catch (err) {
                console.error("Error resizing image for Ollama:", err);
                // Fallback: try to send original if resizing fails, but remove data URI prefix
                if (originalImageForProcessing) {
                   const parts = originalImageForProcessing.split(',');
                   if (parts.length > 1) ollamaApiImagePayload = parts[1];
                }
            }
        }

        const chatHistoryString = getChatHistoryForPrompt();
        const ollamaPrompt = constructOllamaPrompt(userText, chatHistoryString, hasImageToSend);

        let aiMessageElement; // To hold the AI's message div if streaming
        let accumulatedAiResponse = "";
        const streamEnabled = streamResponsesToggle ? streamResponsesToggle.checked : true;

        if (streamEnabled) {
            aiMessageElement = createVisualAiMessage(); // Create empty AI message bubble
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

                // After streaming finishes, finalize the message in history
                const finalTimestamp = Date.now();
                const timeDiv = aiMessageElement.querySelector('.message-time');
                 if (timeDiv) { // Add timestamp to the visual message
                    timeDiv.textContent = new Date(finalTimestamp).toLocaleTimeString(currentLanguage, { hour: 'numeric', minute: '2-digit' });
                 }
                // Save the complete message to history
                saveMessageToHistory({ text: accumulatedAiResponse, type: 'ai', timestamp: finalTimestamp, hasImage: false, imageBase64: null });

            } else { // Not streaming
                const aiResponseText = await callOllamaApi(ollamaPrompt, () => {}, ollamaApiImagePayload);
                addNewMessage(aiResponseText, 'ai'); // Adds directly to UI and history
            }
            isOllamaReachableForHeader = true; // Successful communication
        } catch (error) {
            console.error("Ollama processing error:", error);
            if (aiMessageElement && streamEnabled) { // If streaming failed, remove placeholder
                aiMessageElement.remove();
            }
            // Display error message as an AI response
            addNewMessage(getTranslation('ollamaError', { error: error.message || "Unknown error" }), 'ai');
            isOllamaReachableForHeader = false; // Communication failed
        } finally {
            isAiResponding = false;
            // Agent status depends on whether tutoring is active
            setAgentStatus(isTutoringActive ? 'tutoring' : 'active'); 
            sendButton.disabled = isTutoringActive; // Disable send if tutoring (tutor controls flow)
            if (attachFileBtn) attachFileBtn.disabled = isTutoringActive; // Disable attach if tutoring
            
            startPeriodicOllamaHeaderCheck(); // Restart reachability check

            // Re-enable input based on mode
            if (isTutoringActive && expectedTutorResponseHandler) { // If tutoring and waiting for user
                enableChatInputAfterTutor(true);
            } else if (!isTutoringActive) { // If not tutoring, enable general chat
                enableChatInputAfterTutor(false);
            }
        }
    };

    sendButton.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter (not Shift+Enter)
            if (isTutoringActive && isTutorResponding) return; // Block if tutor busy
            if (!isTutoringActive && isAiResponding) return; // Block if AI busy

            e.preventDefault(); // Prevent newline in input
            handleSendMessage();
        }
    });
}

// --- Initial Application Load ---
async function initializeApp() {
    const translationsLoadedSuccessfully = await fetchTranslations(); 

    const savedDarkModePref = localStorage.getItem(DARK_MODE_KEY);
    setDarkMode(savedDarkModePref === 'true');

    if (markdownToggle) {
        const savedMarkdownPref = localStorage.getItem(MARKDOWN_ENABLED_KEY);
        // Default to true if not set, otherwise use the stored string 'true'/'false'
        markdownToggle.checked = (savedMarkdownPref === null) ? true : (savedMarkdownPref === 'true');
    }
    if (streamResponsesToggle) { // Assuming similar toggle for streaming
        const savedStreamPref = localStorage.getItem('tutorAiStreamResponsesEnabled'); // Example key
        streamResponsesToggle.checked = (savedStreamPref === null) ? true : (savedStreamPref === 'true');
         streamResponsesToggle.addEventListener('change', function() { // Save preference
            localStorage.setItem('tutorAiStreamResponsesEnabled', this.checked.toString());
        });
    }


    const lastActiveTab = localStorage.getItem(ACTIVE_SETTINGS_TAB_KEY) || 'basic';
    setActiveSettingsTab(lastActiveTab);

    loadOllamaSettings();
    loadUserState(); 
    applyTranslations(); // Apply translations (either full or fallback)
    loadChatHistory();   

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
            markdownToggle.checked = false; // Force it off
            markdownToggle.disabled = true; // Disable the toggle
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

    // Initial check for Ollama status and start periodic checks
    checkOllamaForHeaderUpdate().then(() => {
        startPeriodicOllamaHeaderCheck();
    });

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