/**
 * THE ECHO - Novel Reader Application
 * Core JavaScript Logic (Vanilla JS)
 */

// Application State
const state = {
    currentChapter: 1,
    currentTheme: 'sepia', // light, dark, sepia
    fontSize: 18, // in pixels
    isSidebarOpen: false,
    chaptersCount: 10,
    glossary: {}
};

// Chapter Names for navigation
// Chapter Names for navigation (Default fallbacks, will be overwritten by dynamic fetches)
let chapterNames = [
    "บทที่ 1: เศษตรรกะ",
    "บทที่ 2: รหัสซ้อน",
    "บทที่ 3: ตัวแปรแทรก",
    "บทที่ 4: ม้าโทรจัน",
    "บทที่ 5: ประมูลลวง",
    "บทที่ 6: หิมะจำลอง",
    "บทที่ 7: กระดานเปล่า",
    "บทที่ 8: ย้อนโครงสร้าง",
    "บทที่ 9: หมากสวนกลับ",
    "บทที่ 10: มาสเตอร์พีซ"
];

// Fetch chapter titles dynamically from the first line of each .md file
async function fetchChapterTitles() {
    const fetchPromises = [];
    for (let i = 1; i <= state.chaptersCount; i++) {
        fetchPromises.push(
            fetch(`echo/chapters/chapter_${i}.md`)
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
    try {
        const response = await fetch('echo/metadata/glossary.md');
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

// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Highlight glossary terms in HTML by wrapping them in spans
function highlightGlossaryTerms(html, glossary) {
    if (!glossary || Object.keys(glossary).length === 0) return html;
    
    let output = html;
    const sortedTerms = Object.keys(glossary).sort((a, b) => b.length - a.length);
    
    // Construct single regex pattern for efficiency and preventing nested replacements
    const regexStr = sortedTerms.map(term => {
        const escaped = escapeRegExp(term);
        const isEnglish = /^[A-Za-z0-9\s-]+$/.test(term);
        return isEnglish ? `\\b${escaped}\\b` : escaped;
    }).join('|');
    const pattern = new RegExp(`(${regexStr})`, 'gi');
    
    // Split by HTML tags to avoid replacing inside tag attributes
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
    // Normalize newlines
    let html = md.replace(/\r\n/g, '\n');
    
    // Split by double newlines to find block elements first
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
            // Apply inline formatting to block content (bold, links)
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
    bottomSheetDefinition: document.getElementById('bottom-sheet-definition')
};

// Initialize Application
async function init() {
    // Load saved settings from LocalStorage
    loadSettings();
    
    // Fetch chapter titles and glossary metadata in parallel first
    try {
        await Promise.all([fetchChapterTitles(), fetchGlossary()]);
    } catch (e) {
        console.warn("Failed to pre-fetch metadata, using fallbacks:", e);
    }
    
    // Build sidebar menu links (with dynamic or default names)
    buildSidebarMenu();
    
    // Set up Event Listeners
    setupEventListeners();
    
    // Apply current configurations
    applyTheme(state.currentTheme);
    applyFontSize(state.fontSize);
    
    // Check URL hash for direct chapter linking (loads chapter with highlights applied!)
    handleHashRouting();
}

// Load configurations from localStorage
function loadSettings() {
    const savedTheme = localStorage.getItem('echo_theme');
    if (savedTheme) state.currentTheme = savedTheme;
    
    const savedFontSize = localStorage.getItem('echo_font_size');
    if (savedFontSize) state.fontSize = parseInt(savedFontSize, 10);
    
    const savedChapter = localStorage.getItem('echo_current_chapter');
    if (savedChapter) state.currentChapter = parseInt(savedChapter, 10);
}

// Save specific config to localStorage
function saveSetting(key, value) {
    localStorage.setItem(key, value);
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
    // Landing View Buttons
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

    // Prev / Next Buttons
    if (elements.btnPrev) {
        elements.btnPrev.addEventListener('click', () => {
            if (state.currentChapter > 1) {
                loadChapter(state.currentChapter - 1);
            }
        });
    }
    if (elements.btnNext) {
        elements.btnNext.addEventListener('click', () => {
            if (state.currentChapter < state.chaptersCount) {
                loadChapter(state.currentChapter + 1);
            }
        });
    }

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
    elements.btnToggleMenu.addEventListener('click', () => toggleSidebar(true));
    elements.btnMenuClose.addEventListener('click', () => toggleSidebar(false));
    
    // Close sidebar when clicking outside on mobile overlay
    document.addEventListener('click', (e) => {
        if (state.isSidebarOpen && !elements.sidebar.contains(e.target) && e.target !== elements.btnToggleMenu) {
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
    
    // Force reflow
    elements.bottomSheet.offsetHeight;
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

// Handle routing based on URL Hash (#chapter-1)
function handleHashRouting() {
    const hash = window.location.hash;
    const match = hash.match(/^#chapter-(\d+)$/);
    if (match) {
        const chapterNum = parseInt(match[1], 10);
        if (chapterNum >= 1 && chapterNum <= state.chaptersCount) {
            showView('reader');
            loadChapter(chapterNum);
            return;
        }
    }
    
    // Default: show landing unless active progress was loaded
    if (hash === '' && elements.landingView.classList.contains('hidden')) {
        showView('landing');
    }
}

// Switch between Landing Page and Reader Page views
function showView(view) {
    if (view === 'landing') {
        elements.landingView.classList.remove('hidden');
        elements.readerView.classList.add('hidden');
        document.body.classList.remove('reader-mode-active');
        document.title = "THE ECHO — นิยายรักไซไฟจิตวิทยา";
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
    window.location.hash = `#chapter-${chapterNumber}`;
    
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

    // Enable/disable prev/next buttons
    elements.btnPrev.disabled = (chapterNumber === 1);
    elements.btnNext.disabled = (chapterNumber === state.chaptersCount);
    
    // Display loading state
    elements.contentArea.innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
            <p>กำลังจูนสัญญาณความทรงจำบทที่ ${chapterNumber}...</p>
        </div>
    `;
    
    // Smooth scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        // Fetch the markdown file from the workspace root
        const response = await fetch(`echo/chapters/chapter_${chapterNumber}.md`);
        if (!response.ok) {
            throw new Error(`Failed to fetch chapter ${chapterNumber}`);
        }
        
        let markdownContent = await response.text();
        
        // Strip the first line if it is a heading containing the chapter title/number
        const lines = markdownContent.split('\n');
        if (lines.length > 0 && lines[0].trim().startsWith('#')) {
            lines.shift(); // Remove the first line
            // Remove any leading empty lines
            while (lines.length > 0 && lines[0].trim() === '') {
                lines.shift();
            }
            markdownContent = lines.join('\n');
        }
        
        // Parse and render the content
        let htmlContent = parseMarkdown(markdownContent);
        
        // Apply glossary highlighting to the HTML content
        htmlContent = highlightGlossaryTerms(htmlContent, state.glossary);
        
        // Append copyright notice dynamically
        const copyrightHtml = `
            <div class="chapter-copyright">
                <hr>
                <p>© 2026 artsyntax. สงวนลิขสิทธิ์ตามพระราชบัญญัติลิขสิทธิ์ พ.ศ. 2537 และที่แก้ไขเพิ่มเติม รวมถึงอนุสัญญาระหว่างประเทศ ห้ามมิให้คัดลอก ทำซ้ำ ดัดแปลง หรือเผยแพร่ส่วนหนึ่งส่วนใดโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร<br>
                All rights reserved. Under Thai Copyright Act B.E. 2537 and international conventions. No part of this work may be reproduced, modified, or distributed without prior written permission from the author.</p>
            </div>
        `;
        htmlContent += copyrightHtml;
        
        // Inject into content area
        elements.contentArea.innerHTML = htmlContent;
        
        // Set document title
        const currentName = chapterNames[chapterNumber - 1];
        elements.chapterTitle.textContent = currentName;
        document.title = `${currentName} — THE ECHO`;
        
        // Reset progress bar
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
    
    // Remove active class from all buttons and add to selected
    elements.themeButtons.forEach(btn => {
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Apply color variables to document element
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
    
    // Update font indicator text if present
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
