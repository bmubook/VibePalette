function themePreview() {
    return {
        isDark: true,
        lang: 'ar',
        currentPalette: null,
        palettes: [],
        customPalettes: [],
        loading: true,
        activeExport: null,
        toastVisible: false,
        toastMsg: '',
        searchQuery: '',
        showFavOnly: false,
        colorFilter: 'all',
        wcagOnly: false,
        showImportModal: false,
        importJson: '',
        importError: '',
        favorites: JSON.parse(localStorage.getItem('vp_favs') || '[]'),
        colorFamilies: [
            { id: 'all', ar: 'الكل', en: 'All' },
            { id: 'warm', ar: 'دافئة', en: 'Warm' },
            { id: 'green', ar: 'خضراء', en: 'Green' },
            { id: 'blue', ar: 'زرقاء', en: 'Blue' },
            { id: 'purple', ar: 'بنفسجية', en: 'Purple' },
            { id: 'pink', ar: 'وردية', en: 'Pink' },
            { id: 'neutral', ar: 'محايدة', en: 'Neutral' }
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
        },

        async loadPalettes() {
            this.loading = true;
            this.customPalettes = JSON.parse(localStorage.getItem('vp_custom') || '[]');
            let builtIn = [];
            try {
                const res = await fetch(new URL('palettes.json', document.baseURI));
                if (!res.ok) throw new Error('fetch failed');
                const data = await res.json();
                builtIn = data.palettes || [];
            } catch (e) {
                builtIn = [FALLBACK_PALETTE];
                console.warn('VibePalette: using fallback palette', e);
            }
            this.palettes = [...builtIn, ...this.customPalettes];
        },

        boot() {
            const urlId = new URLSearchParams(location.search).get('p');
            const savedId = urlId || localStorage.getItem('vp_palette');
            const found = savedId ? this.palettes.find(p => p.id === parseInt(savedId, 10)) : null;
            this.currentPalette = found || this.palettes.find(p => p.id === 8) || this.palettes[0];
            if (urlId) this.persistPaletteUrl(this.currentPalette.id);
        },

        registerServiceWorker() {
            if (!('serviceWorker' in navigator)) return;
            navigator.serviceWorker.register(new URL('sw.js', document.baseURI)).catch(() => {});
        },

        selectPalette(p) {
            this.currentPalette = p;
            localStorage.setItem('vp_palette', String(p.id));
            this.persistPaletteUrl(p.id);
        },

        persistPaletteUrl(id) {
            const url = new URL(location.href);
            url.searchParams.set('p', id);
            history.replaceState(null, '', url.pathname + url.search);
        },

        toggleDarkMode() {
            this.isDark = !this.isDark;
            localStorage.setItem('vp_dark', this.isDark ? '1' : '0');
        },

        toggleLang() {
            this.lang = this.lang === 'ar' ? 'en' : 'ar';
            localStorage.setItem('vp_lang', this.lang);
        },

        randomPalette() {
            const list = this.filteredPalettes.length ? this.filteredPalettes : this.palettes;
            const pick = list[Math.floor(Math.random() * list.length)];
            this.selectPalette(pick);
            this.showToast(this.lang === 'ar' ? `🎲 ${pick.nameAr}` : `🎲 ${pick.nameEn}`);
        },

        sharePalette() {
            const url = `${location.origin}${location.pathname}?p=${this.currentPalette.id}`;
            navigator.clipboard.writeText(url).then(() => {
                this.showToast(this.lang === 'ar' ? '✓ تم نسخ الرابط!' : '✓ Link copied!');
            });
        },

        passesWcagAA(p) {
            return (
                this.getContrastRatio(p.light.bg, p.light.text) >= 4.5 &&
                this.getContrastRatio(p.dark.bg, p.dark.text) >= 4.5 &&
                this.getContrastRatio(p.light.bg, p.light.btn) >= 3 &&
                this.getContrastRatio(p.dark.bg, p.dark.btn) >= 3
            );
        },

        isCustomPalette(p) {
            return p.id >= 1000 || p.custom === true;
        },

        openImportModal() {
            this.importError = '';
            this.importJson = '';
            this.showImportModal = true;
        },

        closeImportModal() {
            this.showImportModal = false;
            this.importError = '';
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
            const from = this.normalizeHex(grad.from || raw.gradFrom);
            const to = this.normalizeHex(grad.to || raw.gradTo);
            const lbg = this.normalizeHex(light.bg);
            const ltx = this.normalizeHex(light.text);
            const lbtn = this.normalizeHex(light.btn);
            const dbg = this.normalizeHex(dark.bg);
            const dtx = this.normalizeHex(dark.text);
            const dbtn = this.normalizeHex(dark.btn);
            if (![from, to, lbg, ltx, lbtn, dbg, dtx, dbtn].every(Boolean)) {
                throw new Error('invalid');
            }
            const nameEn = raw.nameEn || raw.name || 'Custom Palette';
            const nameAr = raw.nameAr || nameEn || 'لوحة مخصصة';
            return {
                nameEn: String(nameEn),
                nameAr: String(nameAr),
                light: { bg: lbg, text: ltx, btn: lbtn },
                dark: { bg: dbg, text: dtx, btn: dbtn },
                grad: { from, to }
            };
        },

        importPalette() {
            this.importError = '';
            try {
                const raw = JSON.parse(this.importJson);
                const norm = this.normalizePalette(raw);
                const maxId = this.customPalettes.reduce((m, p) => Math.max(m, p.id), 999);
                const palette = { id: maxId + 1, custom: true, ...norm };
                this.customPalettes.push(palette);
                localStorage.setItem('vp_custom', JSON.stringify(this.customPalettes));
                const builtIn = this.palettes.filter(p => !this.isCustomPalette(p));
                this.palettes = [...builtIn, ...this.customPalettes];
                this.selectPalette(palette);
                this.closeImportModal();
                this.showToast(this.lang === 'ar' ? '✓ تم استيراد اللوحة!' : '✓ Palette imported!');
            } catch (e) {
                this.importError = this.lang === 'ar'
                    ? 'صيغة JSON غير صالحة. انسخ من تصدير JSON Tokens.'
                    : 'Invalid JSON. Paste from JSON Tokens export.';
            }
        },

        removeCustomPalette() {
            const p = this.currentPalette;
            if (!this.isCustomPalette(p)) return;
            this.customPalettes = this.customPalettes.filter(c => c.id !== p.id);
            localStorage.setItem('vp_custom', JSON.stringify(this.customPalettes));
            const builtIn = this.palettes.filter(x => !this.isCustomPalette(x));
            this.palettes = [...builtIn, ...this.customPalettes];
            this.selectPalette(this.palettes[0]);
            this.showToast(this.lang === 'ar' ? '✓ حُذفت اللوحة المخصصة' : '✓ Custom palette removed');
        },

        get currentBg() {
            if (!this.currentPalette) return '#EEF2FF';
            return this.isDark ? this.currentPalette.dark.bg : this.currentPalette.light.bg;
        },
        get currentText() {
            if (!this.currentPalette) return '#312E81';
            return this.isDark ? this.currentPalette.dark.text : this.currentPalette.light.text;
        },
        get currentBtn() {
            if (!this.currentPalette) return '#6366F1';
            return this.isDark ? this.currentPalette.dark.btn : this.currentPalette.light.btn;
        },

        get currentSwatches() {
            if (!this.currentPalette) return [];
            const p = this.currentPalette;
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
            const labels = this.lang === 'ar'
                ? ['الإيرادات', 'المستخدمون', 'الطلبات', 'معدل التحويل']
                : ['Revenue', 'Users', 'Orders', 'Conversion'];
            const vals = ['24.5K', '1,842', '386', '4.8%'];
            return labels.map((label, i) => ({ label, value: vals[i] }));
        },

        getPaletteFamily(p) {
            const hex = p.grad.from;
            const [r, g, b] = this.hexToRgb(hex).map(c => Math.round(c * 255));
            const max = Math.max(r, g, b),
                min = Math.min(r, g, b);
            if (max - min < 25) return 'neutral';
            let h = 0;
            const d = max - min;
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

        paletteHexBlob(p) {
            return [p.light.bg, p.light.text, p.light.btn, p.dark.bg, p.dark.text, p.dark.btn, p.grad.from, p.grad.to]
                .join(' ')
                .toLowerCase();
        },

        get filteredPalettes() {
            let list = this.palettes;
            if (this.showFavOnly) list = list.filter(p => this.favorites.includes(p.id));
            if (this.wcagOnly) list = list.filter(p => this.passesWcagAA(p));
            if (this.colorFilter !== 'all') list = list.filter(p => this.getPaletteFamily(p) === this.colorFilter);
            if (this.searchQuery.trim()) {
                const q = this.searchQuery.trim().toLowerCase().replace('#', '');
                list = list.filter(
                    p =>
                        p.nameAr.includes(this.searchQuery.trim()) ||
                        p.nameEn.toLowerCase().includes(q) ||
                        this.paletteHexBlob(p).includes(q)
                );
            }
            return list;
        },

        get favCount() {
            return this.favorites.length;
        },
        isFav(id) {
            return this.favorites.includes(id);
        },
        toggleFav(id) {
            if (this.favorites.includes(id)) this.favorites = this.favorites.filter(f => f !== id);
            else this.favorites.push(id);
            localStorage.setItem('vp_favs', JSON.stringify(this.favorites));
        },

        hexToRgb(hex) {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return [r, g, b];
        },
        luminance(hex) {
            const [r, g, b] = this.hexToRgb(hex).map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        },
        getContrastRatio(bg, fg) {
            const l1 = Math.max(this.luminance(bg), this.luminance(fg));
            const l2 = Math.min(this.luminance(bg), this.luminance(fg));
            return (l1 + 0.05) / (l2 + 0.05);
        },

        copyColor(hex, label) {
            navigator.clipboard.writeText(hex).then(() => {
                this.showToast(this.lang === 'ar' ? `✓ ${label}: ${hex}` : `✓ ${label}: ${hex}`);
            });
        },

        buildPrompt(p) {
            const name = this.lang === 'ar' ? p.nameAr : p.nameEn;
            if (this.lang === 'ar') {
                return `أنت مطور واجهات UI/UX محترف. طبّق الهوية البصرية التالية بأسلوب "Glow Aesthetic":

1. الألوان:
   - نهاري: خلفية ${p.light.bg} | نص ${p.light.text} | أزرار ${p.light.btn}
   - ليلي: خلفية ${p.dark.bg} | نص ${p.dark.text} | أزرار ${p.dark.btn}
   - تدرج: ${p.grad.from} → ${p.grad.to}

2. هالة Glow: radial-gradient ثابت (${p.grad.from} → ${p.grad.to})، blur 120px، opacity ~20%.

3. واجهة: زوايا 2xl، backdrop-blur، انتقالات 500ms، دعم تبديل Light/Dark أنيق.

4. إمكانية الوصول: نص/خلفية نهاري ${this.getContrastRatio(p.light.bg, p.light.text).toFixed(1)}:1 | ليلي ${this.getContrastRatio(p.dark.bg, p.dark.text).toFixed(1)}:1

اللوحة: ${name} — VibePalette`;
            }
            return `Act as a professional UI/UX Developer. Apply this "${name}" visual identity with "Glow Aesthetic":

1. Colors:
   - Light: BG ${p.light.bg} | Text ${p.light.text} | Button ${p.light.btn}
   - Dark: BG ${p.dark.bg} | Text ${p.dark.text} | Button ${p.dark.btn}
   - Gradient: ${p.grad.from} → ${p.grad.to}

2. Glow Aura: fixed radial-gradient (${p.grad.from} → ${p.grad.to}), blur 120px, opacity ~20%.

3. UI: 2xl rounded corners, backdrop-blur(10px), smooth 500ms transitions, elegant Light/Dark toggle.

4. Accessibility: Light text/BG ${this.getContrastRatio(p.light.bg, p.light.text).toFixed(1)}:1 | Dark ${this.getContrastRatio(p.dark.bg, p.dark.text).toFixed(1)}:1

Palette: ${p.nameEn} — VibePalette`;
        },

        copyExport(type) {
            const p = this.currentPalette;
            let text = '';
            switch (type) {
                case 'prompt':
                    text = this.buildPrompt(p);
                    break;
                case 'css':
                    text = `/* ${p.nameEn} — VibePalette */\n:root {\n  /* Light Mode */\n  --bg: ${p.light.bg};\n  --text: ${p.light.text};\n  --btn: ${p.light.btn};\n  --grad-from: ${p.grad.from};\n  --grad-to: ${p.grad.to};\n}\n\n[data-theme="dark"] {\n  --bg: ${p.dark.bg};\n  --text: ${p.dark.text};\n  --btn: ${p.dark.btn};\n}`;
                    break;
                case 'tailwind':
                    text = `// ${p.nameEn} — VibePalette\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        light: { bg: '${p.light.bg}', text: '${p.light.text}', btn: '${p.light.btn}' },\n        dark: { bg: '${p.dark.bg}', text: '${p.dark.text}', btn: '${p.dark.btn}' },\n        grad: { from: '${p.grad.from}', to: '${p.grad.to}' }\n      }\n    }\n  }\n}`;
                    break;
                case 'scss':
                    text = `// ${p.nameEn} — VibePalette\n$light-bg: ${p.light.bg};\n$light-text: ${p.light.text};\n$light-btn: ${p.light.btn};\n$dark-bg: ${p.dark.bg};\n$dark-text: ${p.dark.text};\n$dark-btn: ${p.dark.btn};\n$grad-from: ${p.grad.from};\n$grad-to: ${p.grad.to};`;
                    break;
                case 'json':
                    text = JSON.stringify(
                        { nameEn: p.nameEn, nameAr: p.nameAr, light: p.light, dark: p.dark, grad: p.grad },
                        null,
                        2
                    );
                    break;
                case 'colors':
                    text = `Light: ${p.light.bg}, ${p.light.text}, ${p.light.btn} | Dark: ${p.dark.bg}, ${p.dark.text}, ${p.dark.btn} | Grad: ${p.grad.from} → ${p.grad.to}`;
                    break;
            }
            navigator.clipboard.writeText(text).then(() => {
                this.activeExport = type;
                this.showToast(this.lang === 'ar' ? '✓ تم النسخ بنجاح!' : '✓ Copied to clipboard!');
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
