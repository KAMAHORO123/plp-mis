// Generates the dark theme from the light stylesheets, so every surface and text colour has a dark counterpart.
//
//   node scripts/build-dark-theme.mjs
//
// Each colour in the light CSS is mapped by role: light backgrounds become dark surfaces (cards stay a step
// lighter than the page, as in light mode), dark text becomes light text, accent text gets lighter so it stays
// readable, and light borders become subtle dark lines. Dark colours, photos and the certificate paper are left
// alone. Hand-tuned exceptions live in src/components/shared/theme.css, which loads after the generated file.
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const targets = [
  {
    out: 'src/styles/dark-auto.css',
    sources: ['src/features/hub', 'src/i18n', 'src/components/shared'],
  },
  {
    out: 'landing/src/dark-auto.css',
    sources: ['landing/src'],
  },
];
// Stylesheets that are already themed, or must keep their light look.
const skipFiles = /(?:^|\/)(?:theme|dark-auto|globals)\.css$/;
// Certificate previews are printed paper; they keep their light design.
const skipSelector = /\.cc-(?:sheet|title|small|name|role|citation|programme|org|foot|qr|brand)\b|\.cs-mini\b/;

// ---- colour helpers -------------------------------------------------------------------------------
const named = { white: '#ffffff', black: '#000000' };
const colorPattern = /#[0-9a-f]{8}\b|#[0-9a-f]{6}\b|#[0-9a-f]{3,4}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:white|black)\b/gi;

function parse(text) {
  const value = named[text.toLowerCase()] ?? text;
  if (value.startsWith('#')) {
    let hex = value.slice(1);
    if (hex.length <= 4) hex = [...hex].map((c) => c + c).join('');
    const n = (i) => parseInt(hex.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? n(6) / 255 : 1 };
  }
  const parts = value.slice(value.indexOf('(') + 1, -1).split(/[\s,/]+/).filter(Boolean);
  const num = (p, scale) => (p.endsWith('%') ? (parseFloat(p) / 100) * scale : parseFloat(p));
  if (/^rgb/i.test(value)) {
    const [r, g, b, a = '1'] = parts;
    return { r: num(r, 255), g: num(g, 255), b: num(b, 255), a: num(a, 1) };
  }
  if (/^hsl/i.test(value)) {
    const [h, s, l, a = '1'] = parts;
    return { ...fromHsl(parseFloat(h), num(s, 1), num(l, 1)), a: num(a, 1) };
  }
  return null;
}
function toHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}
function fromHsl(h, s, l) {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}
const format = ({ r, g, b }, a) => {
  const hex = '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  return a < 1 ? `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+a.toFixed(3)})` : hex;
};

// ---- mapping by role ------------------------------------------------------------------------------
// True black theme: surfaces and lines are neutral greys; only tinted highlights keep a hint of their hue.
const neutralHue = 0;
function surface(c) {
  const { h, s, l } = toHsl(c);
  const tint = s >= 0.08;
  if (l >= 0.985) return fromHsl(0, 0, 0.085);                       // white cards
  if (l >= 0.94) return fromHsl(0, 0, 0.045);                        // page and pale panels
  // Tinted chips and highlights keep only a faint trace of their hue, so the theme reads as black, not navy.
  if (l >= 0.8) return fromHsl(h, Math.min(s, 0.12), 0.12);
  if (l >= 0.55) return fromHsl(h, Math.min(s, 0.14), 0.19);
  return null;
}
function ink(c) {
  const { h, s, l } = toHsl(c);
  if (l >= 0.62) return null;                                   // already light enough
  // Accents (links, green, red) stay coloured but lighter. Deep navy is PLP's ink colour, so it becomes light text.
  const navy = h >= 195 && h <= 240 && l < 0.3;
  if (s > 0.42 && !navy) return fromHsl(h, Math.min(s, 0.85), 0.74);
  if (l < 0.5) return fromHsl(0, 0, 0.93 - l * 0.4);            // headings and body text
  return fromHsl(0, 0, 0.66);                                    // muted greys
}
function line(c) {
  const { l } = toHsl(c);
  if (l < 0.7) return null;
  return fromHsl(0, 0, 0.17);
}
const roles = {
  color: ink, 'caret-color': ink, 'text-decoration-color': ink, '-webkit-text-fill-color': ink,
  background: surface, 'background-color': surface, 'background-image': surface,
  border: line, 'border-color': line, 'border-top': line, 'border-right': line, 'border-bottom': line, 'border-left': line,
  'border-top-color': line, 'border-right-color': line, 'border-bottom-color': line, 'border-left-color': line,
  'border-block': line, 'border-inline': line, 'border-block-end': line, 'border-block-start': line,
  outline: line, 'outline-color': line, 'column-rule': line, 'column-rule-color': line,
};
function convert(prop, value) {
  const role = roles[prop];
  if (!role || value.includes('var(')) return null;
  let changed = false;
  const next = value.replace(colorPattern, (text) => {
    const c = parse(text);
    if (!c || c.a === 0) return text;
    const mapped = role(c);
    if (!mapped) return text;
    changed = true;
    return format(mapped, c.a);
  });
  return changed ? next : null;
}

// ---- build ----------------------------------------------------------------------------------------
const prefix = (selector) => selector.split(',').map((s) => {
  const part = s.trim();
  if (/^(?:html|:root)\b/.test(part)) return part.replace(/^(html|:root)/, 'html[data-theme="dark"]');
  if (/^body\b/.test(part)) return `html[data-theme="dark"] ${part}`;
  return `html[data-theme="dark"] ${part}`;
}).join(',\n');

function cssFiles(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return /node_modules|public/.test(e.name) ? [] : cssFiles(rel);
    return e.name.endsWith('.css') && !skipFiles.test(rel) ? [rel] : [];
  });
}

for (const target of targets) {
  const files = [...new Set(target.sources.flatMap(cssFiles))].sort();
  const out = postcss.root();
  let rules = 0;
  for (const file of files) {
    const source = postcss.parse(fs.readFileSync(path.join(root, file), 'utf8'), { from: file });
    out.append(postcss.comment({ text: ` from ${file} ` }));
    source.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes/i.test(rule.parent.name)) return;
      if (skipSelector.test(rule.selector) || /data-theme/.test(rule.selector)) return;
      const decls = [];
      rule.each((node) => {
        if (node.type !== 'decl') return;
        const value = convert(node.prop, node.value);
        if (value) decls.push(postcss.decl({ prop: node.prop, value, important: node.important }));
      });
      if (!decls.length) return;
      const darkRule = postcss.rule({ selector: prefix(rule.selector), nodes: decls });
      // Keep the media query (e.g. phone layouts) around the dark rule.
      let wrapped = darkRule;
      for (let parent = rule.parent; parent && parent.type === 'atrule'; parent = parent.parent) {
        wrapped = postcss.atRule({ name: parent.name, params: parent.params, nodes: [wrapped] });
      }
      out.append(wrapped);
      rules++;
    });
  }
  const header = `/* Generated by scripts/build-dark-theme.mjs from the light stylesheets. Do not edit by hand. */\n`;
  fs.writeFileSync(path.join(root, target.out), header + out.toString() + '\n');
  console.log(`${target.out}: ${rules} rules from ${files.length} stylesheets`);
}
