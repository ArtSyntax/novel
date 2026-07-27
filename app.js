/**
 * THE ECHO - Novel Reader Application
 * Core JavaScript Logic (Vanilla JS)
 * Supports Edit 1 (Original) and Edit 2 (Remastered) Edition Switching
 */

// Available Editions Definition
const editions = {
    edit2: {
        id: 'edit2',
        path: 'echo_edit_2',
        chaptersCount: 12,
        title: 'Edit 2 (Remastered)',
        shortTitle: 'Edit 2 (12 ตอน)',
        headerTitle: 'THE ECHO (Edit 2)',
        label: 'Edit 2'
    },
    edit1: {
        id: 'edit1',
        path: 'echo',
        chaptersCount: 10,
        title: 'Edit 1 (Original)',
        shortTitle: 'Edit 1 (10 ตอน)',
        headerTitle: 'THE ECHO (Edit 1)',
        label: 'Edit 1'
    }
};

// Application State
const state = {
    currentEdition: 'edit2', // Default to Edit 2 (Remastered)
    currentChapter: 1,
    currentTheme: 'sepia', // light, dark, sepia
    fontSize: 18, // in pixels
    isSidebarOpen: false,
    chaptersCount: 12,
    glossary: {},
    viewCount: 0
};

// Chapter Names for navigation (populated dynamically)
let chapterNames = [];

// Fetch chapter titles dynamically from the first line of each .md file
async function fetchChapterTitles() {
    const edition = editions[state.currentEdition] || editions.edit2;
    const fetchPromises = [];
    for (let i = 1; i <= state.chaptersCount; i++) {
        fetchPromises.push(
            fetch(`${edition.path}/chapters/chapter_${i}.md`)
                .then(res => res.ok ? res.text() : '')
                .then(text => {
                    const firstLine = text.split('\n')[0] || '';
                    const match = firstLine.match(/บทที่ \d+: (.*?)$/);
                    let title = match ? match[1].trim() : `ตอนที่ ${i}`;
                    // Strip markdown indicators and trailing Edition tags
                    title = title.replace(/[\*#_]/g, '').replace(/\(Remaster Edition\)/gi, '').trim();
                    return { index: i, title: `บทที่ ${i}: ${title}` };
                })
                .catch(() => {
                    return { index: i, title: `บทที่ ${i}: ตอนที่ ${i}` };
                })
        );
    }
    const results = await Promise.all(fetchPromises);
    results.sort((a, b) => a.index - b.index);
    chapterNames = results.map(r => r.title);
}

// Fetch glossary terms from metadata/glossary.md
async function fetchGlossary() {
    const edition = editions[state.currentEdition] || editions.edit2;
    try {
        const response = await fetch(`${edition.path}/metadata/glossary.md`);
        if (!response.ok) return;
        const text = await response.text();
        
        // Match lines: * **Term**: Definition
        const regex = /^\*\s+\*\*(.*?)\*\*:\s*(.*?)$/gm;
        let match;
        state.glossary = {};
        while ((match = regex.exec(text)) !== null) {
            const term = match[1].trim();
            const definition = match[2].trim();
            state.glossary[term] = definition;
        }
    } catch (e) {
        console.warn("Failed to fetch glossary:", e);
    }
}

// Fetch and increment the global view count using Counter API
async function updateGlobalViewCount() {
    const namespace = 'artsyntax_the_echo';
    const key = 'page_views';
    const apiUrl = `https://api.counterapi.dev/v1/${namespace}/${key}/up`;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('API response not ok');
        const data = await response.json();
        
        if (data && typeof data.count === 'number') {
            state.viewCount = data.count;
            saveSetting('echo_view_count', state.viewCount);
            return;
        }
    } catch (e) {
        console.warn("Failed to fetch global counter, using fallback simulation:", e);
    }
    
    // Fallback to local simulation if API fails
    const savedViewCount = localStorage.getItem('echo_view_count');
    if (savedViewCount) {
        state.viewCount = parseInt(savedViewCount, 10) + 1;
    } else {
        state.viewCount = 1;
    }
    saveSetting('echo_view_count', state.viewCount);
}

// Fetch synopsis from metadata/synopsis.md and render it
async function fetchSynopsis() {
    const edition = editions[state.currentEdition] || editions.edit2;
    try {
        const response = await fetch(`${edition.path}/metadata/synopsis.md`);
        if (!response.ok) throw new Error('Synopsis file not found');
        const markdown = await response.text();
        
        let html = parseMarkdown(markdown);
        // Highlight glossary terms
        html = highlightGlossaryTerms(html, state.glossary);
        
        if (elements.bookDescription) {
            elements.bookDescription.innerHTML = html;
        }
    } catch (e) {
        console.warn("Failed to fetch synopsis:", e);
        if (elements.bookDescription) {
            elements.bookDescription.innerHTML = `<p class="error-text">เกิดข้อผิดพลาดในการโหลดข้อมูลเรื่องย่อ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</p>`;
        }
    }
}

// Fetch book metadata from metadata/metadata.md and update landing page details
async function fetchMetadata() {
    const edition = editions[state.currentEdition] || editions.edit2;
    try {
        const response = await fetch(`${edition.path}/metadata/metadata.md`);
        if (!response.ok) throw new Error('Metadata file not found');
        const text = await response.text();
        
        // Extract values using regex patterns matching markdown format
        const titleMatch    = text.match(/\*\*(?:ชื่อเรื่อง|Title)\s*\(Title\):\*\*\s*(.*)/i);
        const subtitleMatch = text.match(/\*\*(?:คำโปรย|Subtitle)\s*\(Subtitle\):\*\*\s*(.*)/i);
        const authorMatch   = text.match(/\*\*(?:ผู้แต่ง|Author)\s*\(Author\):\*\*\s*(.*)/i);
        const genreMatch    = text.match(/\*\*(?:แนวเรื่อง|Genre)\s*\(Genre\):\*\*\s*(.*)/i);
        const lengthMatch   = text.match(/\*\*(?:จำนวนตอน|Length)\s*\(Length\):\*\*\s*(.*)/i);

        if (titleMatch && elements.bookTitle) {
            elements.bookTitle.textContent = titleMatch[1].trim();
        }
        if (subtitleMatch && elements.bookSubtitle) {
            elements.bookSubtitle.textContent = subtitleMatch[1].trim();
        }
        if (authorMatch && elements.bookAuthor) {
            elements.bookAuthor.textContent = authorMatch[1].trim();
        }
        if (genreMatch && elements.bookGenre) {
            elements.bookGenre.textContent = genreMatch[1].trim();
        }
        if (lengthMatch && elements.bookLength) {
            elements.bookLength.textContent = lengthMatch[1].trim();
        }
    } catch (e) {
        console.warn("Failed to fetch metadata, using fallbacks:", e);
        if (elements.bookTitle) elements.bookTitle.textContent = 'THE ECHO';
        if (elements.bookSubtitle) elements.bookSubtitle.textContent = 'Strategic Sci-Fi Rom-Com';
        if (elements.bookAuthor) elements.bookAuthor.textContent = 'artsyntax';
        if (elements.bookGenre) elements.bookGenre.textContent = 'Sci-Fi, Rom-Com, Drama';
        if (elements.bookLength) elements.bookLength.textContent = `${state.chaptersCount} ตอน (บริบูรณ์)`;
    }
}

// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Highlight glossary terms in HTML by wrapping them in spans
function highlightGlossaryTerms(html, glossary) {
    if (!glossary || Object.keys(glossary).length === 0) return html;
    
    let output = html;
    const sortedTerms = Object.keys(glossary).sort((a, b) => b.length - a.length);
    
    const regexStr = sortedTerms.map(term => {
        const escaped = escapeRegExp(term);
        const isEnglish = /^[A-Za-z0-9\s-]+$/.test(term);
        return isEnglish ? `\\b${escaped}\\b` : escaped;
    }).join('|');
    const pattern = new RegExp(`(${regexStr})`, 'gi');
    
    const parts = output.split(/(<[^>]+>)/g);
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) { // Text segment
            parts[i] = parts[i].replace(pattern, (match) => {
                const matchedTerm = sortedTerms.find(t => t.toLowerCase() === match.toLowerCase()) || match;
                const definition = glossary[matchedTerm];
                return `<span class="glossary-term" data-definition="${definition}">${match}</span>`;
            });
        }
    }
    return parts.join('');
}

function parseMarkdown(md) {
    let html = md.replace(/\r\n/g, '\n');
    let blocks = html.split(/\n{2,}/);
    
    let parsedBlocks = blocks.map(block => {
        let el = block.trim();
        if (!el) return '';
        
        let isBlock = false;
        let blockHtml = '';
        
        // 1. System Alerts or Blockquotes
        if (el.startsWith('> [!')) {
            const match = el.match(/^> \[\!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\n([\s\S]*)$/m);
            if (match) {
                const type = match[1];
                const content = match[2].replace(/^>\s?/gm, '').trim();
                blockHtml = `<div class="alert ${type.toLowerCase()}"><strong>${type}</strong><p>${content}</p></div>`;
                isBlock = true;
            }
        }
        // 2. Normal Blockquotes
        else if (el.startsWith('>')) {
            const cleanContent = el.replace(/^>\s?/gm, '').trim();
            blockHtml = `<blockquote>${cleanContent}</blockquote>`;
            isBlock = true;
        }
        // 3. Horizontal Rule
        else if (el === '---') {
            blockHtml = '<hr>';
            isBlock = true;
        }
        // 4. Headings
        else if (el.startsWith('#')) {
            let temp = el.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
            temp = temp.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
            temp = temp.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
            temp = temp.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
            blockHtml = temp;
            isBlock = true;
        }
        // 5. Lists
        else if (el.startsWith('-')) {
            let temp = el.replace(/^- (.*?)$/gm, '<li>$1</li>');
            blockHtml = `<ul>\n${temp}\n</ul>`;
            isBlock = true;
        }
        
        if (isBlock) {
            blockHtml = blockHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            blockHtml = blockHtml.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
            return blockHtml;
        }
        
        // 6. Normal Paragraph
        el = el.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        el = el.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
        el = el.replace(/\n/g, '<br>');
        return `<p>${el}</p>`;
    });
    
    return parsedBlocks.filter(b => b).join('\n');
}

// DOM Elements
const elements = {
    app: document.getElementById('app'),
    landingView: document.getElementById('landing-view'),
    readerView: document.getElementById('reader-view'),
    contentArea: document.getElementById('content-area'),
    chapterTitle: document.getElementById('chapter-title'),
    btnStart: document.getElementById('btn-start'),
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    btnHeaderPrev: document.getElementById('btn-header-prev'),
    btnHeaderNext: document.getElementById('btn-header-next'),
    btnBackHome: document.getElementById('btn-back-home'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    btnFontDec: document.getElementById('font-dec'),
    btnFontInc: document.getElementById('font-inc'),
    btnToggleMenu: document.getElementById('btn-toggle-menu'),
    btnMenuClose: document.getElementById('btn-menu-close'),
    sidebar: document.getElementById('sidebar'),
    sidebarMenu: document.getElementById('sidebar-menu'),
    readingProgress: document.getElementById('reading-progress'),
    progressBar: document.getElementById('progress-bar'),
    bottomSheet: document.getElementById('glossary-bottom-sheet'),
    bottomSheetBackdrop: document.getElementById('bottom-sheet-backdrop'),
    btnCloseSheet: document.getElementById('btn-close-sheet'),
    bottomSheetTerm: document.getElementById('bottom-sheet-term'),
    bottomSheetDefinition: document.getElementById('bottom-sheet-definition'),
    viewCountVal: document.getElementById('view-count-val'),
    bookDescription: document.getElementById('book-description'),
    bookTitle: document.getElementById('book-title'),
    bookSubtitle: document.getElementById('book-subtitle'),
    bookAuthor: document.getElementById('book-author'),
    bookGenre: document.getElementById('book-genre'),
    bookLength: document.getElementById('book-length')
};

// Initialize Application
async function init() {
    loadSettings();
    updateEditionUI();
    
    try {
        await Promise.all([fetchChapterTitles(), fetchGlossary()]);
        await Promise.all([fetchMetadata(), fetchSynopsis()]);
    } catch (e) {
        console.warn("Failed to pre-fetch metadata, using fallbacks:", e);
    }
    
    buildSidebarMenu();
    setupEventListeners();
    applyTheme(state.currentTheme);
    applyFontSize(state.fontSize);
    
    if (elements.viewCountVal) {
        elements.viewCountVal.textContent = state.viewCount.toLocaleString();
    }
    
    updateGlobalViewCount().then(() => {
        if (elements.viewCountVal) {
            elements.viewCountVal.textContent = state.viewCount.toLocaleString();
        }
        
        setInterval(async () => {
            try {
                const res = await fetch(`https://api.counterapi.dev/v1/artsyntax_the_echo/page_views`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && typeof data.count === 'number') {
                        state.viewCount = data.count;
                        if (elements.viewCountVal) {
                            elements.viewCountVal.textContent = state.viewCount.toLocaleString();
                        }
                        saveSetting('echo_view_count', state.viewCount);
                    }
                }
            } catch (e) {
                // Ignore silent errors
            }
        }, 20000);
    });
    
    handleHashRouting();
}

// Load configurations from localStorage
function loadSettings() {
    const savedEdition = localStorage.getItem('echo_edition');
    if (savedEdition && editions[savedEdition]) {
        state.currentEdition = savedEdition;
        state.chaptersCount = editions[savedEdition].chaptersCount;
    }
    
    const savedTheme = localStorage.getItem('echo_theme');
    if (savedTheme) state.currentTheme = savedTheme;
    
    const savedFontSize = localStorage.getItem('echo_font_size');
    if (savedFontSize) state.fontSize = parseInt(savedFontSize, 10);
    
    const savedChapter = localStorage.getItem('echo_current_chapter');
    if (savedChapter) state.currentChapter = parseInt(savedChapter, 10);

    const savedViewCount = localStorage.getItem('echo_view_count');
    if (savedViewCount) {
        state.viewCount = parseInt(savedViewCount, 10);
    } else {
        state.viewCount = 0;
    }
}

// Save specific config to localStorage
function saveSetting(key, value) {
    localStorage.setItem(key, value);
}

// Switch between Edit 1 and Edit 2
async function switchEdition(editionId) {
    if (!editions[editionId] || state.currentEdition === editionId) return;
    
    state.currentEdition = editionId;
    state.chaptersCount = editions[editionId].chaptersCount;
    saveSetting('echo_edition', editionId);
    
    // Clamp current chapter if switching to an edition with fewer chapters
    if (state.currentChapter > state.chaptersCount) {
        state.currentChapter = state.chaptersCount;
    }
    
    updateEditionUI();
    
    if (elements.bookDescription && !elements.landingView.classList.contains('hidden')) {
        elements.bookDescription.innerHTML = `<div class="loader-container" style="padding: 20px 0;"><div class="loader"></div><p>กำลังจูนสัญญาณ ${editions[editionId].label}...</p></div>`;
    }

    try {
        await Promise.all([fetchChapterTitles(), fetchGlossary()]);
        await Promise.all([fetchMetadata(), fetchSynopsis()]);
    } catch (e) {
        console.warn("Error switching edition metadata:", e);
    }
    
    buildSidebarMenu();
    
    // If currently reading, reload the chapter for the new edition
    if (!elements.readerView.classList.contains('hidden')) {
        loadChapter(state.currentChapter);
    }
}

// Update Edition Selector UI elements across Landing Page, Header, and Sidebar
function updateEditionUI() {
    const currentEd = state.currentEdition;
    const editionObj = editions[currentEd];
    
    // 1. Landing Page Cards
    document.querySelectorAll('.edition-card').forEach(card => {
        if (card.dataset.edition === currentEd) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    // 2. Header Dropdown Button Label & Menu items
    const headerEditionName = document.getElementById('header-edition-name');
    if (headerEditionName) {
        headerEditionName.textContent = editionObj.headerTitle;
    }
    document.querySelectorAll('.edition-menu-item').forEach(item => {
        if (item.dataset.edition === currentEd) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 3. Sidebar Edition Pills
    document.querySelectorAll('.sidebar-edition-pill').forEach(pill => {
        if (pill.dataset.edition === currentEd) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}

// Build Sidebar Chapter List
function buildSidebarMenu() {
    elements.sidebarMenu.innerHTML = '';
    chapterNames.forEach((name, index) => {
        const chapterNum = index + 1;
        const li = document.createElement('li');
        li.className = `sidebar-item ${chapterNum === state.currentChapter ? 'active' : ''}`;
        li.dataset.chapter = chapterNum;
        li.innerHTML = `
            <span class="num">${String(chapterNum).padStart(2, '0')}</span>
            <span class="name">${name.replace(`บทที่ ${chapterNum}: `, '')}</span>
        `;
        li.addEventListener('click', () => {
            loadChapter(chapterNum);
            toggleSidebar(false);
        });
        elements.sidebarMenu.appendChild(li);
    });
}

// Set up UI Event Listeners
function setupEventListeners() {
    // Edition Switchers on Landing Page
    document.querySelectorAll('.edition-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const ed = e.currentTarget.dataset.edition;
            switchEdition(ed);
        });
    });

    // Edition Switchers in Sidebar
    document.querySelectorAll('.sidebar-edition-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            const ed = e.currentTarget.dataset.edition;
            switchEdition(ed);
        });
    });

    // Header Edition Picker Toggle & Menu items
    const btnEditionToggle = document.getElementById('btn-edition-toggle');
    const headerEditionMenu = document.getElementById('header-edition-menu');
    if (btnEditionToggle && headerEditionMenu) {
        btnEditionToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = headerEditionMenu.classList.contains('hidden');
            if (isHidden) {
                headerEditionMenu.classList.remove('hidden');
                btnEditionToggle.setAttribute('aria-expanded', 'true');
            } else {
                headerEditionMenu.classList.add('hidden');
                btnEditionToggle.setAttribute('aria-expanded', 'false');
            }
        });

        document.querySelectorAll('.edition-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const ed = e.currentTarget.dataset.edition;
                headerEditionMenu.classList.add('hidden');
                btnEditionToggle.setAttribute('aria-expanded', 'false');
                switchEdition(ed);
            });
        });

        document.addEventListener('click', (e) => {
            if (!btnEditionToggle.contains(e.target) && !headerEditionMenu.contains(e.target)) {
                headerEditionMenu.classList.add('hidden');
                btnEditionToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Landing View Start Reading Button
    if (elements.btnStart) {
        elements.btnStart.addEventListener('click', () => {
            showView('reader');
            loadChapter(state.currentChapter);
        });
    }

    // Back to Landing Page
    if (elements.btnBackHome) {
        elements.btnBackHome.addEventListener('click', () => {
            showView('landing');
            window.location.hash = '';
        });
    }

    // Prev / Next Buttons (Footer & Header)
    const handlePrev = () => {
        if (state.currentChapter > 1) {
            loadChapter(state.currentChapter - 1);
        }
    };
    const handleNext = () => {
        if (state.currentChapter < state.chaptersCount) {
            loadChapter(state.currentChapter + 1);
        }
    };

    if (elements.btnPrev) elements.btnPrev.addEventListener('click', handlePrev);
    if (elements.btnNext) elements.btnNext.addEventListener('click', handleNext);
    if (elements.btnHeaderPrev) elements.btnHeaderPrev.addEventListener('click', handlePrev);
    if (elements.btnHeaderNext) elements.btnHeaderNext.addEventListener('click', handleNext);

    // Theme Switchers
    elements.themeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedTheme = e.currentTarget.dataset.theme;
            applyTheme(selectedTheme);
        });
    });

    // Font Sizing Buttons
    elements.btnFontDec.addEventListener('click', () => {
        if (state.fontSize > 14) {
            applyFontSize(state.fontSize - 2);
        }
    });
    elements.btnFontInc.addEventListener('click', () => {
        if (state.fontSize < 28) {
            applyFontSize(state.fontSize + 2);
        }
    });

    // Sidebar Toggling
    elements.btnToggleMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar(!state.isSidebarOpen);
    });
    elements.btnMenuClose.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar(false);
    });
    
    // Close sidebar when clicking outside on mobile overlay
    document.addEventListener('click', (e) => {
        if (state.isSidebarOpen && !elements.sidebar.contains(e.target) && !elements.btnToggleMenu.contains(e.target)) {
            toggleSidebar(false);
        }
    });

    // Handle back/forward browser buttons
    window.addEventListener('hashchange', handleHashRouting);

    // Track scroll for reading progress bar
    window.addEventListener('scroll', updateProgressBar);

    // Glossary Bottom Sheet Close handlers
    if (elements.btnCloseSheet) {
        elements.btnCloseSheet.addEventListener('click', hideBottomSheet);
    }
    if (elements.bottomSheetBackdrop) {
        elements.bottomSheetBackdrop.addEventListener('click', hideBottomSheet);
    }
    
    // Tap on glossary terms (mobile layout)
    document.addEventListener('click', (e) => {
        const termEl = e.target.closest('.glossary-term');
        if (termEl && window.innerWidth <= 768) {
            e.preventDefault();
            showBottomSheet(termEl.textContent, termEl.getAttribute('data-definition'));
        }
    });
}

// Show Mobile Bottom Sheet
function showBottomSheet(term, definition) {
    if (!elements.bottomSheet) return;
    
    elements.bottomSheetTerm.textContent = term;
    elements.bottomSheetDefinition.textContent = definition;
    
    elements.bottomSheet.classList.remove('hidden');
    elements.bottomSheet.setAttribute('aria-hidden', 'false');
    
    elements.bottomSheet.offsetHeight; // Force reflow
    elements.bottomSheet.classList.add('open');
}

// Hide Mobile Bottom Sheet
function hideBottomSheet() {
    if (!elements.bottomSheet) return;
    
    elements.bottomSheet.classList.remove('open');
    elements.bottomSheet.setAttribute('aria-hidden', 'true');
    
    setTimeout(() => {
        if (!elements.bottomSheet.classList.contains('open')) {
            elements.bottomSheet.classList.add('hidden');
        }
    }, 300);
}

// Handle routing based on URL Hash (#edit2/chapter-1 or #chapter-1)
function handleHashRouting() {
    const hash = window.location.hash;
    
    // Hash format with edition prefix: #edit1/chapter-3 or #edit2/chapter-5
    const editionMatch = hash.match(/^#(edit1|edit2)\/chapter-(\d+)$/);
    if (editionMatch) {
        const edId = editionMatch[1];
        const chapterNum = parseInt(editionMatch[2], 10);
        if (editions[edId]) {
            if (state.currentEdition !== edId) {
                switchEdition(edId).then(() => {
                    showView('reader');
                    loadChapter(chapterNum);
                });
                return;
            }
        }
        if (chapterNum >= 1 && chapterNum <= state.chaptersCount) {
            showView('reader');
            loadChapter(chapterNum);
            return;
        }
    }
    
    // Hash format without edition prefix: #chapter-3
    const match = hash.match(/^#chapter-(\d+)$/);
    if (match) {
        const chapterNum = parseInt(match[1], 10);
        if (chapterNum >= 1 && chapterNum <= state.chaptersCount) {
            showView('reader');
            loadChapter(chapterNum);
            return;
        }
    }
    
    // Default: show landing unless active reader view
    if (hash === '' && !elements.readerView.classList.contains('hidden')) {
        showView('landing');
    }
}

// Switch between Landing Page and Reader Page views
function showView(view) {
    if (view === 'landing') {
        elements.landingView.classList.remove('hidden');
        elements.readerView.classList.add('hidden');
        document.body.classList.remove('reader-mode-active');
        const edLabel = editions[state.currentEdition].label;
        document.title = `THE ECHO (${edLabel}) — นิยายรักไซไฟจิตวิทยา`;
    } else {
        elements.landingView.classList.add('hidden');
        elements.readerView.classList.remove('hidden');
        document.body.classList.add('reader-mode-active');
    }
}

// Load a specific chapter dynamically
async function loadChapter(chapterNumber) {
    if (chapterNumber < 1 || chapterNumber > state.chaptersCount) return;
    
    state.currentChapter = chapterNumber;
    saveSetting('echo_current_chapter', chapterNumber);
    window.location.hash = `#${state.currentEdition}/chapter-${chapterNumber}`;
    
    // Update Active class in Sidebar
    const items = elements.sidebarMenu.querySelectorAll('.sidebar-item');
    items.forEach(item => {
        const num = parseInt(item.dataset.chapter, 10);
        if (num === chapterNumber) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Enable/disable prev/next buttons (Footer & Header)
    const isFirst = (chapterNumber === 1);
    const isLast = (chapterNumber === state.chaptersCount);
    if (elements.btnPrev) elements.btnPrev.disabled = isFirst;
    if (elements.btnNext) elements.btnNext.disabled = isLast;
    if (elements.btnHeaderPrev) elements.btnHeaderPrev.disabled = isFirst;
    if (elements.btnHeaderNext) elements.btnHeaderNext.disabled = isLast;
    
    // Display loading state
    const edLabel = editions[state.currentEdition].label;
    elements.contentArea.innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
            <p>กำลังจูนสัญญาณความทรงจำบทที่ ${chapterNumber} (${edLabel})...</p>
        </div>
    `;
    
    // Smooth scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        const edition = editions[state.currentEdition] || editions.edit2;
        const response = await fetch(`${edition.path}/chapters/chapter_${chapterNumber}.md`);
        if (!response.ok) {
            throw new Error(`Failed to fetch chapter ${chapterNumber}`);
        }
        
        let markdownContent = await response.text();
        
        // Strip the first line if it is a heading containing the chapter title/number
        const lines = markdownContent.split('\n');
        if (lines.length > 0 && lines[0].trim().startsWith('#')) {
            lines.shift();
            while (lines.length > 0 && lines[0].trim() === '') {
                lines.shift();
            }
            markdownContent = lines.join('\n');
        }
        
        let htmlContent = parseMarkdown(markdownContent);
        htmlContent = highlightGlossaryTerms(htmlContent, state.glossary);
        
        const footerEl = document.querySelector('.landing-footer p');
        const copyrightText = footerEl ? footerEl.innerHTML : '© 2026 artsyntax. All rights reserved.';
        const copyrightHtml = `
            <div class="chapter-copyright">
                <hr>
                <p>${copyrightText}</p>
            </div>
        `;
        htmlContent += copyrightHtml;
        
        elements.contentArea.innerHTML = htmlContent;
        
        const currentName = chapterNames[chapterNumber - 1] || `บทที่ ${chapterNumber}`;
        elements.chapterTitle.textContent = currentName;
        document.title = `${currentName} — THE ECHO (${edLabel})`;
        
        updateProgressBar();
        
    } catch (error) {
        console.error("Error loading chapter:", error);
        elements.contentArea.innerHTML = `
            <div class="error-container">
                <h3>เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
                <p>ขออภัย ระบบประสาทไม่สามารถซิงค์สัญญาณข้อมูลบทเรียนนี้ได้ในขณะนี้</p>
                <button class="btn" onclick="loadChapter(${chapterNumber})">ลองโหลดอีกครั้ง</button>
            </div>
        `;
    }
}

// Toggle Sidebar State
function toggleSidebar(open) {
    state.isSidebarOpen = open;
    if (open) {
        elements.sidebar.classList.add('open');
        elements.btnToggleMenu.setAttribute('aria-expanded', 'true');
    } else {
        elements.sidebar.classList.remove('open');
        elements.btnToggleMenu.setAttribute('aria-expanded', 'false');
    }
}

// Apply Selected Theme color variables
function applyTheme(theme) {
    state.currentTheme = theme;
    saveSetting('echo_theme', theme);
    
    elements.themeButtons.forEach(btn => {
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const root = document.documentElement;
    if (theme === 'sepia') {
        root.style.setProperty('--bg-color', '#f5efeb');
        root.style.setProperty('--text-color', '#2d221e');
        root.style.setProperty('--card-bg', '#eae1db');
        root.style.setProperty('--accent-color', '#b36d59');
        root.style.setProperty('--border-color', '#d5c7bf');
        document.body.style.backgroundColor = '#f5efeb';
    } else if (theme === 'dark') {
        root.style.setProperty('--bg-color', '#12161a');
        root.style.setProperty('--text-color', '#c5cbd3');
        root.style.setProperty('--card-bg', '#1d232a');
        root.style.setProperty('--accent-color', '#b38274');
        root.style.setProperty('--border-color', '#2a333d');
        document.body.style.backgroundColor = '#12161a';
    } else { // light
        root.style.setProperty('--bg-color', '#f8f9fa');
        root.style.setProperty('--text-color', '#1f2021');
        root.style.setProperty('--card-bg', '#ffffff');
        root.style.setProperty('--accent-color', '#b35e4d');
        root.style.setProperty('--border-color', '#e2e5e8');
        document.body.style.backgroundColor = '#f8f9fa';
    }
}

// Apply reading font size
function applyFontSize(size) {
    state.fontSize = size;
    saveSetting('echo_font_size', size);
    elements.contentArea.style.fontSize = `${size}px`;
    
    const sizeIndicator = document.getElementById('font-size-val');
    if (sizeIndicator) sizeIndicator.textContent = size;
}

// Update Top Progress Bar based on scroll percentage
function updateProgressBar() {
    if (elements.landingView.classList.contains('hidden')) {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        if (docHeight > 0) {
            const scrollPercent = (scrollTop / docHeight) * 100;
            elements.progressBar.style.width = `${scrollPercent}%`;
            elements.readingProgress.style.display = 'block';
        } else {
            elements.readingProgress.style.display = 'none';
        }
    } else {
        elements.readingProgress.style.display = 'none';
    }
}

// Run app
document.addEventListener('DOMContentLoaded', init);
