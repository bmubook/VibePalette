/* VibePalette color utilities — no dependencies */
const ColorUtils = {
    hexToRgb(hex) {
        const h = hex.replace('#', '');
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    },
    rgbToHex(r, g, b) {
        const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
        return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
    },
    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (max === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
        }
        return [h * 360, s * 100, l * 100];
    },
    hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        if (s === 0) {
            const v = l * 255;
            return [v, v, v];
        }
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        return [
            hue2rgb(p, q, h + 1 / 3) * 255,
            hue2rgb(p, q, h) * 255,
            hue2rgb(p, q, h - 1 / 3) * 255
        ];
    },
    adjustHex(hex, { h = 0, s = 0, l = 0 }) {
        let [r, g, b] = this.hexToRgb(hex);
        let [hh, ss, ll] = this.rgbToHsl(r, g, b);
        return this.rgbToHex(...this.hslToRgb(hh + h, ss + s, ll + l));
    },
    luminance(hex) {
        const [r, g, b] = this.hexToRgb(hex).map((c) => {
            c /= 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    },
    contrastRatio(bg, fg) {
        const l1 = Math.max(this.luminance(bg), this.luminance(fg));
        const l2 = Math.min(this.luminance(bg), this.luminance(fg));
        return (l1 + 0.05) / (l2 + 0.05);
    },
    fixForeground(bg, fg, target = 4.5) {
        let [r, g, b] = this.hexToRgb(fg);
        let [h, s, l] = this.rgbToHsl(r, g, b);
        const bgL = this.luminance(bg);
        for (let i = 0; i < 40; i++) {
            const hex = this.rgbToHex(...this.hslToRgb(h, s, l));
            if (this.contrastRatio(bg, hex) >= target) return hex;
            l += bgL > 0.5 ? -4 : 4;
        }
        return bgL > 0.5 ? '#000000' : '#FFFFFF';
    },
    generatePaletteFromBase(baseHex) {
        const base = baseHex.toUpperCase();
        const [r, g, b] = this.hexToRgb(base);
        const [h, s] = this.rgbToHsl(r, g, b);
        const lightBg = this.rgbToHex(...this.hslToRgb(h, Math.max(15, s * 0.35), 97));
        const darkBg = this.rgbToHex(...this.hslToRgb(h, Math.min(80, s * 0.9), 6));
        const lightText = this.fixForeground(lightBg, this.rgbToHex(...this.hslToRgb(h, s, 15)), 4.5);
        const darkText = this.fixForeground(darkBg, this.rgbToHex(...this.hslToRgb(h, Math.max(20, s * 0.5), 92)), 4.5);
        const lightBtn = base;
        const darkBtn = this.adjustHex(base, { l: 8 });
        const gradTo = this.adjustHex(base, { h: 25, l: 12 });
        return {
            nameEn: 'Generated Palette',
            nameAr: 'لوحة مولّدة',
            light: { bg: lightBg, text: lightText, btn: lightBtn },
            dark: { bg: darkBg, text: darkText, btn: darkBtn },
            grad: { from: base, to: gradTo }
        };
    },
    simulateBlindness(hex, type) {
        const [r, g, b] = this.hexToRgb(hex);
        let rn = r, gn = g, bn = b;
        if (type === 'protanopia') {
            rn = 0.567 * r + 0.433 * g;
            gn = 0.558 * r + 0.442 * g;
            bn = 0.242 * g + 0.758 * b;
        } else if (type === 'deuteranopia') {
            rn = 0.625 * r + 0.375 * g;
            gn = 0.7 * r + 0.3 * g;
            bn = 0.3 * g + 0.7 * b;
        } else if (type === 'tritanopia') {
            rn = 0.95 * r + 0.05 * g;
            gn = 0.433 * g + 0.567 * b;
            bn = 0.475 * g + 0.525 * b;
        }
        return this.rgbToHex(rn, gn, bn);
    },
    extractDominantColors(imageData, count = 5) {
        const data = imageData.data;
        const buckets = {};
        for (let i = 0; i < data.length; i += 16) {
            const r = Math.round(data[i] / 32) * 32;
            const g = Math.round(data[i + 1] / 32) * 32;
            const b = Math.round(data[i + 2] / 32) * 32;
            if (data[i + 3] < 128) continue;
            const key = `${r},${g},${b}`;
            buckets[key] = (buckets[key] || 0) + 1;
        }
        return Object.entries(buckets)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([k]) => {
                const [r, g, b] = k.split(',').map(Number);
                return this.rgbToHex(r, g, b);
            });
    },
    inferTags(p) {
        if (p.tags && p.tags.length) return p.tags;
        const id = p.id;
        const tags = new Set();
        const fam = p._family;
        if (fam) tags.add(fam);
        const saas = [8, 10, 20, 24, 32, 34, 40, 44];
        const ecommerce = [4, 9, 22, 36, 43];
        const portfolio = [15, 33, 41, 7, 14];
        const medical = [3, 18, 38, 25, 42];
        if (saas.includes(id)) tags.add('saas');
        if (ecommerce.includes(id)) tags.add('ecommerce');
        if (portfolio.includes(id)) tags.add('portfolio');
        if (medical.includes(id)) tags.add('medical');
        if (!tags.size) tags.add('general');
        return [...tags];
    }
};
