function themePreview() {
    return {
        isDark: true,
        lang: 'ar',
        activeTab: 'preview',
        currentPalette: null,
        comparePaletteId: 3,
        palettes: [],
        customPalettes: [],
        loading: true,
        activeExport: null,
        toastVisible: false,
        toastMsg: '',
        searchQuery: '',
        searchRef: null,
        showFavOnly: false,
        colorFilter: 'all',
        collectionFilter: 'all',
        wcagOnly: false,
        showImportModal: false,
        showToolsModal: false,
        importJson: '',
        importError: '',
        generatorColor: '#6366F1',
        colorBlindMode: 'none',
        beforeAfter: false,
        vibeStep: 0,
        vibeScores: {},
        favorites: JSON.parse(localStorage.getItem('vp_favs') || '[]'),
        votes: JSON.parse(localStorage.getItem('vp_votes') || '{}'),
        votedIds: JSON.parse(localStorage.getItem('vp_voted') || '[]'),
        colorFamilies: [
            { id: 'all', ar: 'الكل', en: 'All' },
            { id: 'warm', ar: 'دافئة', en: 'Warm' },
            { id: 'green', ar: 'خضراء', en: 'Green' },
            { id: 'blue', ar: 'زرقاء', en: 'Blue' },
            { id: 'purple', ar: 'بنفسجية', en: 'Purple' },
            { id: 'pink', ar: 'وردية', en: 'Pink' },
            { id: 'neutral', ar: 'محايدة', en: 'Neutral' }
        ],
        collections: [
            { id: 'all', ar: 'كل المجالات', en: 'All use cases' },
            { id: 'saas', ar: 'SaaS', en: 'SaaS' },
            { id: 'ecommerce', ar: 'متاجر', en: 'E-commerce' },
            { id: 'portfolio', ar: 'معارض', en: 'Portfolio' },
            { id: 'medical', ar: 'طبي', en: 'Medical' },
            { id: 'general', ar: 'عام', en: 'General' }
        ],
        vibeQuestions: [
            {
                ar: 'ما نوع مشروعك؟',
                en: 'Project type?',
                options: [
                    { ar: 'SaaS / تطبيق', en: 'SaaS / App', tags: ['saas'] },
                    { ar: 'متجر إلكتروني', en: 'E-commerce', tags: ['ecommerce'] },
                    { ar: 'معرض أعمال', en: 'Portfolio', tags: ['portfolio'] },
                    { ar: 'طبي / صحي', en: 'Medical / Health', tags: ['medical'] }
                ]
            },
            {
                ar: 'ما الحالة المفضلة؟',
                en: 'Preferred mood?',
                options: [
                    { ar: 'دافئ وحماسي', en: 'Warm & bold', tags: ['warm'] },
                    { ar: 'هادئ وطبيعي', en: 'Calm & natural', tags: ['green'] },
                    { ar: 'تقني وبارد', en: 'Tech & cool', tags: ['blue', 'purple'] },
                    { ar: 'محايد وأنيق', en: 'Neutral & minimal', tags: ['neutral'] }
                ]
            },
            {
                ar: 'أولوية الوصول؟',
                en: 'Accessibility priority?',
                options: [
                    { ar: 'WCAG AA إلزامي', en: 'WCAG AA required', wcag: true },
                    { ar: 'مرن', en: 'Flexible', wcag: false }
                ]
            }
        ],
        exportTypes: [
            { id: 'prompt', icon: '🤖', ar: 'AI Prompt', en: 'AI Prompt' },
            { id: 'promptpack', icon: '📋', ar: 'Prompt Pack', en: 'Prompt Pack' },
            { id: 'css', icon: '🎨', ar: 'CSS Variables', en: 'CSS Variables' },
            { id: 'shadcn', icon: '⚡', ar: 'shadcn/ui', en: 'shadcn/ui' },
            { id: 'cursor', icon: '🖱️', ar: 'Cursor Rule', en: 'Cursor Rule' },
            { id: 'tailwind', icon: '💨', ar: 'Tailwind', en: 'Tailwind' },
            { id: 'scss', icon: '💎', ar: 'SCSS', en: 'SCSS' },
            { id: 'json', icon: '📦', ar: 'JSON Tokens', en: 'JSON Tokens' },
            { id: 'figma', icon: '🎭', ar: 'Figma Tokens', en: 'Figma Tokens' },
            { id: 'lovable', icon: '💜', ar: 'Lovable', en: 'Lovable' },
            { id: 'bolt', icon: '⚡', ar: 'Bolt', en: 'Bolt' },
            { id: 'colors', icon: '🎯', ar: 'ألوان فقط', en: 'Colors Only' }
        ],
        tabs: [
            { id: 'preview', ar: 'معاينة', en: 'Preview' },
            { id: 'studio', ar: 'استوديو', en: 'Studio' },
            { id: 'community', ar: 'مجتمع', en: 'Community' },
            { id: 'export', ar: 'تصدير', en: 'Export' }
        ],

        async init() {
            const savedDark = localStorage.getItem('vp_dark');
            if (savedDark !== null) this.isDark = savedDark === '1';
            const savedLang = localStorage.getItem('vp_lang');
            if (savedLang === 'ar' || savedLang === 'en') this.lang = savedLang;
            await this.loadPalettes();
            this.boot();
            this.loading = false;
            this.registerServiceWorker();
            this.setupKeyboard();
            const embed = new URLSearchParams(location.search).get('embed');
            if (embed === '1') this.activeTab = 'preview';
        },

        setupKeyboard() {
            window.addEventListener('keydown', (e) => {
                if (e.target.matches('input, textarea, select')) {
                    if (e.key === 'Escape') {
                        this.showImportModal = false;
                        this.showToolsModal = false;
                    }
                    return;
                }
                if (e.key === 'd' || e.key === 'D') this.toggleDarkMode();
                if (e.key === '/' && !e.ctrlKey) {
                    e.preventDefault();
                    this.$nextTick(() => this.$refs.searchInput?.focus());
                }
                if (e.key === 'ArrowRight') this.navigatePalette(1);
                if (e.key === 'ArrowLeft') this.navigatePalette(-1);
            });
        },

        navigatePalette(dir) {
            const list = this.filteredPalettes;
            if (!list.length) return;
            const idx = list.findIndex((p) => p.id === this.currentPalette.id);
            const next = list[(idx + dir + list.length) % list.length];
            this.selectPalette(next);
        },

        async loadPalettes() {
            this.customPalettes = JSON.parse(localStorage.getItem('vp_custom') || '[]');
            let builtIn = [];
            try {
                const res = await fetch(new URL('palettes.json', document.baseURI));
                if (!res.ok) throw new Error('fetch failed');
                const data = await res.json();
                builtIn = (data.palettes || []).map((p) => ({
                    ...p,
                    _family: this.getPaletteFamily(p),
                    _tags: ColorUtils.inferTags({ ...p, _family: this.getPaletteFamily(p) })
                }));
            } catch (e) {
                builtIn = [{ ...FALLBACK_PALETTE, _family: 'purple', _tags: ['saas'] }];
            }
            this.customPalettes = this.customPalettes.map((p) => ({
                ...p,
                _family: this.getPaletteFamily(p),
                _tags: ColorUtils.inferTags(p)
            }));
            this.palettes = [...builtIn, ...this.customPalettes];
        },

        boot() {
            const params = new URLSearchParams(location.search);
            const urlId = params.get('p');
            const savedId = urlId || localStorage.getItem('vp_palette');
            const found = savedId ? this.palettes.find((p) => p.id === parseInt(savedId, 10)) : null;
            this.currentPalette = found || this.palettes.find((p) => p.id === 8) || this.palettes[0];
            this.comparePaletteId = 3;
            if (urlId) this.persistPaletteUrl(this.currentPalette.id);
            this.updatePageMeta();
        },

        registerServiceWorker() {
            if (!('serviceWorker' in navigator)) return;
            navigator.serviceWorker.register(new URL('sw.js', document.baseURI)).catch(() => {});
        },

        selectPalette(p) {
            this.currentPalette = p;
            localStorage.setItem('vp_palette', String(p.id));
            this.persistPaletteUrl(p.id);
            this.updatePageMeta();
        },

        persistPaletteUrl(id) {
            const url = new URL(location.href);
            url.searchParams.set('p', id);
            history.replaceState(null, '', url.pathname + url.search);
        },

        updatePageMeta() {
            if (!this.currentPalette) return;
            const name = this.lang === 'ar' ? this.currentPalette.nameAr : this.currentPalette.nameEn;
            document.title = `${name} | VibePalette`;
            const desc = `${name} — Light/Dark palette with AI-ready exports. ${this.currentPalette.light.bg} / ${this.currentPalette.dark.bg}`;
            this.setMeta('description', desc);
            this.setMeta('og:title', `${name} | VibePalette`, 'property');
            this.setMeta('og:description', desc, 'property');
            this.setMeta('twitter:title', `${name} | VibePalette`);
            this.setMeta('twitter:description', desc);
            const ogUrl = `${location.origin}${location.pathname}?p=${this.currentPalette.id}`;
            this.setMeta('og:url', ogUrl, 'property');
        },

        setMeta(name, content, attr = 'name') {
            let el = document.querySelector(`meta[${attr}="${name}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, name);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        },

        toggleDarkMode() {
            this.isDark = !this.isDark;
            localStorage.setItem('vp_dark', this.isDark ? '1' : '0');
        },

        toggleLang() {
            this.lang = this.lang === 'ar' ? 'en' : 'ar';
            localStorage.setItem('vp_lang', this.lang);
            this.updatePageMeta();
        },

        randomPalette() {
            const list = this.filteredPalettes.length ? this.filteredPalettes : this.palettes;
            this.selectPalette(list[Math.floor(Math.random() * list.length)]);
            this.showToast(this.lang === 'ar' ? '🎲 لوحة عشوائية' : '🎲 Random palette');
        },

        sharePalette() {
            const url = `${location.origin}${location.pathname}?p=${this.currentPalette.id}`;
            navigator.clipboard.writeText(url).then(() => this.showToast(this.lang === 'ar' ? '✓ تم نسخ الرابط!' : '✓ Link copied!'));
        },

        get embedCode() {
            const base = `${location.origin}${location.pathname.replace(/index\.html$/, '')}`;
            const src = `${base}embed.html?p=${this.currentPalette?.id || 8}`;
            return `<iframe src="${src}" width="100%" height="420" style="border:0;border-radius:16px" title="VibePalette"></iframe>`;
        },

        copyEmbed() {
            navigator.clipboard.writeText(this.embedCode).then(() =>
                this.showToast(this.lang === 'ar' ? '✓ كود Embed' : '✓ Embed copied')
            );
        },

        getVoteCount(id) {
            return this.votes[id] || 0;
        },

        hasVoted(id) {
            return this.votedIds.includes(id);
        },

        toggleVote(id) {
            if (this.hasVoted(id)) {
                this.showToast(this.lang === 'ar' ? 'صوّتت مسبقاً' : 'Already voted');
                return;
            }
            this.votes[id] = (this.votes[id] || 0) + 1;
            this.votedIds.push(id);
            localStorage.setItem('vp_votes', JSON.stringify(this.votes));
            localStorage.setItem('vp_voted', JSON.stringify(this.votedIds));
            this.showToast(this.lang === 'ar' ? '⭐ شكراً!' : '⭐ Thanks!');
        },

        get topCommunityPalettes() {
            return [...this.palettes]
                .sort((a, b) => (this.votes[b.id] || 0) - (this.votes[a.id] || 0))
                .slice(0, 8);
        },

        passesWcagAA(p) {
            return (
                ColorUtils.contrastRatio(p.light.bg, p.light.text) >= 4.5 &&
                ColorUtils.contrastRatio(p.dark.bg, p.dark.text) >= 4.5 &&
                ColorUtils.contrastRatio(p.light.bg, p.light.btn) >= 3 &&
                ColorUtils.contrastRatio(p.dark.bg, p.dark.btn) >= 3
            );
        },

        isCustomPalette(p) {
            return p && (p.id >= 1000 || p.custom === true);
        },

        openImportModal() {
            this.importError = '';
            this.importJson = '';
            this.showImportModal = true;
        },

        closeImportModal() {
            this.showImportModal = false;
        },

        normalizeHex(hex) {
            if (!hex || typeof hex !== 'string') return null;
            let h = hex.trim();
            if (!h.startsWith('#')) h = '#' + h;
            if (!/^#[0-9A-Fa-f]{6}$/.test(h)) return null;
            return h.toUpperCase();
        },

        normalizePalette(raw) {
            const grad = raw.grad || raw.gradient || {};
            const light = raw.light || {};
            const dark = raw.dark || {};
            const from = this.normalizeHex(grad.from);
            const to = this.normalizeHex(grad.to);
            const lbg = this.normalizeHex(light.bg);
            const ltx = this.normalizeHex(light.text);
            const lbtn = this.normalizeHex(light.btn);
            const dbg = this.normalizeHex(dark.bg);
            const dtx = this.normalizeHex(dark.text);
            const dbtn = this.normalizeHex(dark.btn);
            if (![from, to, lbg, ltx, lbtn, dbg, dtx, dbtn].every(Boolean)) throw new Error('invalid');
            return {
                nameEn: String(raw.nameEn || raw.name || 'Custom Palette'),
                nameAr: String(raw.nameAr || raw.nameEn || 'لوحة مخصصة'),
                light: { bg: lbg, text: ltx, btn: lbtn },
                dark: { bg: dbg, text: dtx, btn: dbtn },
                grad: { from, to }
            };
        },

        importPalette() {
            try {
                const norm = this.normalizePalette(JSON.parse(this.importJson));
                const maxId = this.customPalettes.reduce((m, p) => Math.max(m, p.id), 999);
                const palette = {
                    id: maxId + 1,
                    custom: true,
                    ...norm,
                    _family: this.getPaletteFamily({ grad: norm.grad }),
                    _tags: ['general']
                };
                this.customPalettes.push(palette);
                localStorage.setItem('vp_custom', JSON.stringify(this.customPalettes));
                this.mergePalettes();
                this.selectPalette(palette);
                this.closeImportModal();
                this.showToast(this.lang === 'ar' ? '✓ تم الاستيراد' : '✓ Imported');
            } catch (e) {
                this.importError = this.lang === 'ar' ? 'JSON غير صالح' : 'Invalid JSON';
            }
        },

        mergePalettes() {
            const builtIn = this.palettes.filter((p) => !this.isCustomPalette(p));
            this.palettes = [...builtIn, ...this.customPalettes];
        },

        removeCustomPalette() {
            const p = this.currentPalette;
            if (!this.isCustomPalette(p)) return;
            this.customPalettes = this.customPalettes.filter((c) => c.id !== p.id);
            localStorage.setItem('vp_custom', JSON.stringify(this.customPalettes));
            this.mergePalettes();
            this.selectPalette(this.palettes[0]);
        },

        generateFromColor() {
            const hex = this.normalizeHex(this.generatorColor);
            if (!hex) return this.showToast(this.lang === 'ar' ? 'لون غير صالح' : 'Invalid color');
            const gen = ColorUtils.generatePaletteFromBase(hex);
            const maxId = this.customPalettes.reduce((m, p) => Math.max(m, p.id), 999);
            const palette = {
                id: maxId + 1,
                custom: true,
                ...gen,
                nameEn: `Generated ${hex}`,
                nameAr: `مولّد ${hex}`,
                _family: this.getPaletteFamily({ grad: gen.grad }),
                _tags: ['general']
            };
            this.customPalettes.push(palette);
            localStorage.setItem('vp_custom', JSON.stringify(this.customPalettes));
            this.mergePalettes();
            this.selectPalette(this.palettes.find((x) => x.id === palette.id));
            this.showToast(this.lang === 'ar' ? '✓ لوحة جديدة' : '✓ Palette created');
        },

        async extractFromImage(event) {
            const file = event.target.files?.[0];
            if (!file) return;
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const w = 120;
                canvas.width = w;
                canvas.height = Math.round((img.height / img.width) * w);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const colors = ColorUtils.extractDominantColors(ctx.getImageData(0, 0, canvas.width, canvas.height), 1);
                URL.revokeObjectURL(url);
                if (colors[0]) {
                    this.generatorColor = colors[0];
                    this.generateFromColor();
                }
            };
            img.src = url;
            event.target.value = '';
        },

        autoFixContrast() {
            const p = this.currentPalette;
            const fixed = {
                ...p,
                light: {
                    ...p.light,
                    text: ColorUtils.fixForeground(p.light.bg, p.light.text, 4.5),
                    btn: ColorUtils.fixForeground(p.light.bg, p.light.btn, 3)
                },
                dark: {
                    ...p.dark,
                    text: ColorUtils.fixForeground(p.dark.bg, p.dark.text, 4.5),
                    btn: ColorUtils.fixForeground(p.dark.bg, p.dark.btn, 3)
                }
            };
            if (this.isCustomPalette(p)) {
                const idx = this.customPalettes.findIndex((c) => c.id === p.id);
                if (idx >= 0) this.customPalettes[idx] = { ...fixed, custom: true };
                localStorage.setItem('vp_custom', JSON.stringify(this.customPalettes));
            } else {
                const maxId = this.customPalettes.reduce((m, x) => Math.max(m, x.id), 999);
                fixed.id = maxId + 1;
                fixed.custom = true;
                fixed.nameEn = `${p.nameEn} (AA Fixed)`;
                fixed.nameAr = `${p.nameAr} (مصحح)`;
                this.customPalettes.push(fixed);
                localStorage.setItem('vp_custom', JSON.stringify(this.customPalettes));
            }
            fixed._family = this.getPaletteFamily(fixed);
            fixed._tags = p._tags || ['general'];
            this.mergePalettes();
            this.selectPalette(this.palettes.find((x) => x.id === fixed.id) || fixed);
            this.showToast(this.lang === 'ar' ? '✓ تباين محسّن' : '✓ Contrast improved');
        },

        simulateColor(hex) {
            if (this.colorBlindMode === 'none') return hex;
            return ColorUtils.simulateBlindness(hex, this.colorBlindMode);
        },

        getSimPalette(p) {
            if (!p || this.colorBlindMode === 'none') return p;
            const sim = (h) => this.simulateColor(h);
            return {
                ...p,
                light: { bg: sim(p.light.bg), text: sim(p.light.text), btn: sim(p.light.btn) },
                dark: { bg: sim(p.dark.bg), text: sim(p.dark.text), btn: sim(p.dark.btn) },
                grad: { from: sim(p.grad.from), to: sim(p.grad.to) }
            };
        },

        get displayPalette() {
            return this.getSimPalette(this.currentPalette);
        },

        get comparePalette() {
            return this.palettes.find((p) => p.id === this.comparePaletteId) || this.palettes[1];
        },

        get displayCompare() {
            const c = this.comparePalette;
            return c ? this.getSimPalette(c) : null;
        },

        getFontPairing(p) {
            const fam = p?._family || this.getPaletteFamily(p || this.currentPalette);
            const map = {
                warm: { h: 'Cairo', b: 'Inter', arH: 'القاهرة', arB: 'إنتر' },
                green: { h: 'Inter', b: 'Cairo', arH: 'إنتر', arB: 'القاهرة' },
                blue: { h: 'Inter', b: 'Inter', arH: 'إنتر', arB: 'إنتر' },
                purple: { h: 'Cairo', b: 'Inter', arH: 'القاهرة', arB: 'إنتر' },
                pink: { h: 'Cairo', b: 'Inter', arH: 'القاهرة', arB: 'إنتر' },
                neutral: { h: 'Inter', b: 'Inter', arH: 'إنتر', arB: 'إنتر' }
            };
            return map[fam] || map.blue;
        },

        vibePick(option) {
            option.tags?.forEach((t) => {
                this.vibeScores[t] = (this.vibeScores[t] || 0) + 2;
            });
            if (option.wcag) this.vibeRequireWcag = true;
            if (this.vibeStep < this.vibeQuestions.length - 1) this.vibeStep++;
            else this.finishVibeQuiz();
        },

        finishVibeQuiz() {
            let best = null;
            let bestScore = -1;
            let list = this.palettes;
            if (this.vibeRequireWcag) list = list.filter((p) => this.passesWcagAA(p));
            list.forEach((p) => {
                const tags = p._tags || ColorUtils.inferTags(p);
                let score = tags.reduce((s, t) => s + (this.vibeScores[t] || 0), 0);
                if (this.vibeScores[p._family]) score += this.vibeScores[p._family];
                if (score > bestScore) {
                    bestScore = score;
                    best = p;
                }
            });
            if (best) {
                this.selectPalette(best);
                this.activeTab = 'preview';
                this.showToast(this.lang === 'ar' ? `✨ ${best.nameAr}` : `✨ ${best.nameEn}`);
            }
            this.vibeStep = 0;
            this.vibeScores = {};
            this.vibeRequireWcag = false;
        },

        resetVibeQuiz() {
            this.vibeStep = 0;
            this.vibeScores = {};
            this.vibeRequireWcag = false;
        },

        downloadShareImage() {
            const p = this.currentPalette;
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 630;
            const ctx = canvas.getContext('2d');
            const grd = ctx.createLinearGradient(0, 0, 1200, 630);
            grd.addColorStop(0, p.grad.from);
            grd.addColorStop(1, p.grad.to);
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 1200, 630);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 56px Cairo, sans-serif';
            ctx.fillText(p.nameEn, 60, 120);
            ctx.font = '32px Inter, sans-serif';
            ctx.fillText(`Light ${p.light.bg} · Dark ${p.dark.bg}`, 60, 200);
            ctx.fillText('VibePalette — AI-Ready Colors', 60, 280);
            [p.light.bg, p.light.btn, p.dark.bg, p.dark.btn].forEach((c, i) => {
                ctx.fillStyle = c;
                ctx.fillRect(60 + i * 140, 340, 120, 120);
            });
            canvas.toBlob((blob) => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `vibepalette-${p.id}.png`;
                a.click();
            });
        },

        get currentBg() {
            if (!this.currentPalette) return '#EEF2FF';
            const p = this.displayPalette;
            return this.isDark ? p.dark.bg : p.light.bg;
        },
        get currentText() {
            if (!this.currentPalette) return '#312E81';
            const p = this.displayPalette;
            return this.isDark ? p.dark.text : p.light.text;
        },
        get currentBtn() {
            if (!this.currentPalette) return '#6366F1';
            const p = this.displayPalette;
            return this.isDark ? p.dark.btn : p.light.btn;
        },

        get currentSwatches() {
            const p = this.displayPalette;
            if (!p) return [];
            const L = this.lang === 'ar' ? 'نهاري' : 'Light';
            const D = this.lang === 'ar' ? 'ليلي' : 'Dark';
            return [
                { label: `${L} BG`, hex: p.light.bg },
                { label: `${L} Text`, hex: p.light.text },
                { label: `${L} Btn`, hex: p.light.btn },
                { label: `${D} BG`, hex: p.dark.bg },
                { label: `${D} Text`, hex: p.dark.text },
                { label: `${D} Btn`, hex: p.dark.btn },
                { label: 'Grad →', hex: p.grad.from },
                { label: 'Grad ←', hex: p.grad.to }
            ];
        },

        get dashboardRows() {
            const labels =
                this.lang === 'ar'
                    ? ['الإيرادات', 'المستخدمون', 'الطلبات', 'معدل التحويل']
                    : ['Revenue', 'Users', 'Orders', 'Conversion'];
            return labels.map((label, i) => ({ label, value: ['24.5K', '1,842', '386', '4.8%'][i] }));
        },

        getPaletteFamily(p) {
            const hex = p.grad.from;
            const [r, g, b] = ColorUtils.hexToRgb(hex);
            const max = Math.max(r, g, b),
                min = Math.min(r, g, b);
            if (max - min < 25) return 'neutral';
            let h = 0;
            const d = max - min || 1;
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (max === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
            h *= 360;
            if (h < 85) return 'warm';
            if (h < 165) return 'green';
            if (h < 210) return 'blue';
            if (h < 285) return 'purple';
            if (h < 330) return 'pink';
            return 'warm';
        },

        get filteredPalettes() {
            let list = this.palettes;
            if (this.showFavOnly) list = list.filter((p) => this.favorites.includes(p.id));
            if (this.wcagOnly) list = list.filter((p) => this.passesWcagAA(p));
            if (this.colorFilter !== 'all') list = list.filter((p) => (p._family || this.getPaletteFamily(p)) === this.colorFilter);
            if (this.collectionFilter !== 'all')
                list = list.filter((p) => (p._tags || []).includes(this.collectionFilter));
            if (this.searchQuery.trim()) {
                const q = this.searchQuery.trim().toLowerCase().replace('#', '');
                list = list.filter(
                    (p) =>
                        p.nameAr.includes(this.searchQuery.trim()) ||
                        p.nameEn.toLowerCase().includes(q) ||
                        this.paletteHexBlob(p).includes(q)
                );
            }
            return list;
        },

        paletteHexBlob(p) {
            return [p.light.bg, p.light.text, p.light.btn, p.dark.bg, p.dark.text, p.dark.btn, p.grad.from, p.grad.to]
                .join(' ')
                .toLowerCase();
        },

        get favCount() {
            return this.favorites.length;
        },
        isFav(id) {
            return this.favorites.includes(id);
        },
        toggleFav(id) {
            if (this.favorites.includes(id)) this.favorites = this.favorites.filter((f) => f !== id);
            else this.favorites.push(id);
            localStorage.setItem('vp_favs', JSON.stringify(this.favorites));
        },

        getContrastRatio(bg, fg) {
            return ColorUtils.contrastRatio(bg, fg);
        },

        copyColor(hex, label) {
            navigator.clipboard.writeText(hex).then(() => this.showToast(`✓ ${label}: ${hex}`));
        },

        buildPrompt(p, scene) {
            const name = this.lang === 'ar' ? p.nameAr : p.nameEn;
            const fonts = this.getFontPairing(p);
            const base =
                this.lang === 'ar'
                    ? `أنت مطور UI/UX. اللوحة: ${name}.\nالنهاري: ${p.light.bg}/${p.light.text}/${p.light.btn}\nالليلي: ${p.dark.bg}/${p.dark.text}/${p.dark.btn}\nتدرج: ${p.grad.from}→${p.grad.to}\nخطوط: ${fonts.arH} + ${fonts.arB}\nGlow: radial-gradient blur 120px opacity 20%.\n`
                    : `You are a UI/UX developer. Palette: ${name}.\nLight: ${p.light.bg}/${p.light.text}/${p.light.btn}\nDark: ${p.dark.bg}/${p.dark.text}/${p.dark.btn}\nGradient: ${p.grad.from}→${p.grad.to}\nFonts: ${fonts.h} + ${fonts.b}\nGlow aura: radial-gradient blur 120px 20% opacity.\n`;
            const scenes = {
                landing:
                    this.lang === 'ar'
                        ? 'المشهد: Landing Page كاملة — Hero، ميزات، CTA، Footer.'
                        : 'Scene: Full Landing Page — hero, features, CTA, footer.',
                dashboard:
                    this.lang === 'ar'
                        ? 'المشهد: Dashboard — sidebar، بطاقات KPI، جدول بيانات.'
                        : 'Scene: Dashboard — sidebar, KPI cards, data table.',
                auth:
                    this.lang === 'ar'
                        ? 'المشهد: Auth — تسجيل دخول/إنشاء حساب بتصميم أنيق.'
                        : 'Scene: Auth — sign-in/sign-up screens.'
                default:
                    this.lang === 'ar'
                        ? 'طبّق على تطبيق ويب كامل Light/Dark.'
                        : 'Apply to a full web app with Light/Dark.'
            };
            return base + (scenes[scene] || scenes.default) + '\nVibePalette';
        },

        buildExport(type) {
            const p = this.currentPalette;
            const hsl = (hex) => {
                const [r, g, b] = ColorUtils.hexToRgb(hex);
                const [h, s, l] = ColorUtils.rgbToHsl(r, g, b);
                return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
            };
            switch (type) {
                case 'prompt':
                    return this.buildPrompt(p, 'default');
                case 'promptpack':
                    return ['=== LANDING ===', this.buildPrompt(p, 'landing'), '\n=== DASHBOARD ===', this.buildPrompt(p, 'dashboard'), '\n=== AUTH ===', this.buildPrompt(p, 'auth')].join('\n');
                case 'css':
                    return `/* ${p.nameEn} */\n:root {\n  --bg: ${p.light.bg};\n  --text: ${p.light.text};\n  --btn: ${p.light.btn};\n  --grad-from: ${p.grad.from};\n  --grad-to: ${p.grad.to};\n}\n[data-theme="dark"] {\n  --bg: ${p.dark.bg};\n  --text: ${p.dark.text};\n  --btn: ${p.dark.btn};\n}`;
                case 'shadcn':
                    return `@layer base {\n  :root {\n    --background: ${hsl(p.light.bg)};\n    --foreground: ${hsl(p.light.text)};\n    --primary: ${hsl(p.light.btn)};\n    --ring: ${hsl(p.grad.from)};\n  }\n  .dark {\n    --background: ${hsl(p.dark.bg)};\n    --foreground: ${hsl(p.dark.text)};\n    --primary: ${hsl(p.dark.btn)};\n  }\n}`;
                case 'cursor':
                    return `---\ndescription: VibePalette ${p.nameEn}\nglobs: ["**/*.{tsx,jsx,vue,css,html}"]\n---\n# ${p.nameEn} Theme\n\nUse these colors:\n- Light: bg ${p.light.bg}, text ${p.light.text}, accent ${p.light.btn}\n- Dark: bg ${p.dark.bg}, text ${p.dark.text}, accent ${p.dark.btn}\n- Gradient: ${p.grad.from} → ${p.grad.to}\n\nStyle: rounded-2xl, backdrop-blur, glow gradient backgrounds, 500ms transitions, support RTL Arabic.`;
                case 'tailwind':
                    return `module.exports = { theme: { extend: { colors: { vp: { light: { bg: '${p.light.bg}', text: '${p.light.text}', btn: '${p.light.btn}' }, dark: { bg: '${p.dark.bg}', text: '${p.dark.text}', btn: '${p.dark.btn}' }, grad: { from: '${p.grad.from}', to: '${p.grad.to}' } } } } } };`;
                case 'scss':
                    return `$light-bg: ${p.light.bg};\n$light-text: ${p.light.text};\n$dark-bg: ${p.dark.bg};\n$dark-text: ${p.dark.text};\n$grad-from: ${p.grad.from};\n$grad-to: ${p.grad.to};`;
                case 'json':
                    return JSON.stringify({ nameEn: p.nameEn, nameAr: p.nameAr, light: p.light, dark: p.dark, grad: p.grad }, null, 2);
                case 'figma':
                    return JSON.stringify(
                        {
                            vp: {
                                light: { bg: { value: p.light.bg }, text: { value: p.light.text }, btn: { value: p.light.btn } },
                                dark: { bg: { value: p.dark.bg }, text: { value: p.dark.text }, btn: { value: p.dark.btn } },
                                grad: { from: { value: p.grad.from }, to: { value: p.grad.to } }
                            }
                        },
                        null,
                        2
                    );
                case 'lovable':
                    return `Create a modern ${p.nameEn} themed app.\nColors: Light mode background ${p.light.bg}, text ${p.light.text}, primary ${p.light.btn}. Dark mode background ${p.dark.bg}, text ${p.dark.text}, primary ${p.dark.btn}. Use gradient ${p.grad.from} to ${p.grad.to} for accents. Rounded corners, glassmorphism, smooth animations.`;
                case 'bolt':
                    return `Build a web app with ${p.nameEn} design system.\n:root light ${p.light.bg}/${p.light.text}/${p.light.btn}\n:root dark ${p.dark.bg}/${p.dark.text}/${p.dark.btn}\nGradient hero using ${p.grad.from} and ${p.grad.to}. Accessible contrast, responsive, beautiful UI.`;
                case 'colors':
                    return `Light: ${p.light.bg}, ${p.light.text}, ${p.light.btn} | Dark: ${p.dark.bg}, ${p.dark.text}, ${p.dark.btn} | Grad: ${p.grad.from} → ${p.grad.to}`;
                default:
                    return '';
            }
        },

        copyExport(type) {
            const text = this.buildExport(type);
            navigator.clipboard.writeText(text).then(() => {
                this.activeExport = type;
                this.showToast(this.lang === 'ar' ? '✓ تم النسخ' : '✓ Copied');
                setTimeout(() => (this.activeExport = null), 2500);
            });
        },

        showToast(msg) {
            this.toastMsg = msg;
            this.toastVisible = true;
            setTimeout(() => (this.toastVisible = false), 2000);
        }
    };
}

const FALLBACK_PALETTE = {
    id: 8,
    nameAr: 'سماء الغسق',
    nameEn: 'Dusk Sky',
    light: { bg: '#EEF2FF', text: '#312E81', btn: '#F43F5E' },
    dark: { bg: '#05051A', text: '#E0E7FF', btn: '#FB7185' },
    grad: { from: '#4F46E5', to: '#F43F5E' }
};
