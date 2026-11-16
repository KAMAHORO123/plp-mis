// Keeps text readable on phones: every rule that sets text smaller than 12px gets a phone-only
// override (screens 640px wide or less) raising it to 12px. Desktop keeps the original sizes.
//
// The overrides are written at the end of each stylesheet between two marker comments, so they come
// after the rules they replace. Run again after changing styles:  node scripts/mobile-readable-text.mjs
import { readFileSync, writeFileSync, globSync } from 'node:fs';
import postcss from 'postcss';

const MIN = 12;
const START = '/* mobile-readable-text: generated, do not edit by hand */';
const END = '/* end mobile-readable-text */';
const files = [...globSync('src/**/*.css'), ...globSync('landing/src/**/*.css')];

const px = (value) => {
  const m = String(value).trim().match(/^(\d*\.?\d+)(px|rem|em)$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return m[2] === 'px' ? n : n * 16;
};
// Desktop-only rules never show on phones, and chart labels inside SVGs scale with the chart.
const desktopOnly = (node) => {
  for (let p = node.parent; p; p = p.parent)
    if (p.type === 'atrule' && p.name === 'media' && /min-width/.test(p.params) && !/max-width/.test(p.params)) return true;
  return false;
};
const skip = (selector) => /\b(svg|tspan|text)\b|::?(before|after)\b/.test(selector);

let total = 0;
for (const file of files) {
  let css = readFileSync(file, 'utf8');
  const at = css.indexOf(START);
  if (at >= 0) css = css.slice(0, at).trimEnd() + '\n';
  const selectors = new Set(), forced = new Set();   // forced: the original size was !important
  postcss.parse(css).walkDecls('font-size', (decl) => {
    const size = px(decl.value.replace(/\s*!important$/, ''));
    if (size === null || size >= MIN) return;
    const rule = decl.parent;
    if (rule.type !== 'rule' || desktopOnly(rule)) return;
    for (const s of rule.selectors) if (!skip(s)) (decl.important ? forced : selectors).add(s);
  });
  if (!selectors.size && !forced.size) { if (at >= 0) writeFileSync(file, css); continue; }
  total += selectors.size + forced.size;
  const rules = [
    selectors.size && `  ${[...selectors].join(',\n  ')} { font-size: ${MIN}px; }`,
    forced.size && `  ${[...forced].join(',\n  ')} { font-size: ${MIN}px !important; }`,
  ].filter(Boolean).join('\n');
  const block = `${START}\n@media (max-width: 640px) {\n${rules}\n}\n${END}\n`;
  writeFileSync(file, css + '\n' + block);
  console.log(`${file}: ${selectors.size + forced.size}`);
}
console.log(`${total} selectors raised to ${MIN}px on phones`);
