// One restrained, branded layout for every PLP email, with a plain-text twin for clients that block HTML.
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const NAVY = "#0c2e4b", BLUE = "#1d75db", INK = "#101828", MUTED = "#667085", LINE = "#e4e7ec";

/**
 * @param {{ origin: string, preheader?: string, greeting?: string, heading: string, paragraphs?: string[],
 *   code?: string, details?: [string, string][], note?: { label: string, text: string },
 *   button?: { label: string, url: string }, footnote?: string }} m
 */
export function renderEmail(m) {
  const logo = new URL("/plp-dove.png", m.origin).href;
  const p = (text) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#344054">${escape(text)}</p>`;
  const details = m.details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;border:1px solid ${LINE};border-radius:10px;border-collapse:separate">${m.details
        .map(([k, v], i) => `<tr><td style="padding:10px 14px;font-size:13px;color:${MUTED};width:34%;vertical-align:top;${i ? `border-top:1px solid ${LINE};` : ""}">${escape(k)}</td><td style="padding:10px 14px;font-size:14px;color:${INK};vertical-align:top;${i ? `border-top:1px solid ${LINE};` : ""}">${escape(v)}</td></tr>`)
        .join("")}</table>`
    : "";
  const code = m.code
    ? `<div style="margin:6px 0 18px;padding:16px;text-align:center;background:#f3f8fd;border:1px solid #cfe2f6;border-radius:10px;font:700 30px/1.2 'SFMono-Regular',Menlo,Consolas,monospace;letter-spacing:8px;color:${NAVY}">${escape(m.code)}</div>`
    : "";
  const note = m.note ? `<div style="margin:0 0 18px;padding:12px 14px;border-left:3px solid ${BLUE};background:#f8fafc;font-size:14px;line-height:1.6;color:#344054"><strong style="color:${INK}">${escape(m.note.label)}</strong><br>${escape(m.note.text)}</div>` : "";
  const button = m.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 20px"><tr><td style="border-radius:8px;background:${BLUE}"><a href="${escape(m.button.url)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">${escape(m.button.label)}</a></td></tr></table>`
    : "";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(m.heading)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escape(m.preheader ?? m.heading)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden">
<tr><td style="background:${NAVY};padding:18px 24px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding-right:10px"><img src="${escape(logo)}" width="34" height="34" alt="" style="display:block;border:0"></td><td style="font-size:15px;font-weight:700;color:#ffffff">Peace and Love Proclaimers<div style="font-size:11px;font-weight:500;letter-spacing:1.5px;color:#a1c9e7">PLP HUB</div></td></tr></table></td></tr>
<tr><td style="padding:28px 28px 8px">
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:${INK}">${escape(m.heading)}</h1>
${m.greeting ? p(m.greeting) : ""}${(m.paragraphs ?? []).map(p).join("")}${code}${details}${note}${button}
${m.footnote ? `<p style="margin:0 0 18px;font-size:13px;line-height:1.6;color:${MUTED}">${escape(m.footnote)}</p>` : ""}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid ${LINE};font-size:12px;line-height:1.6;color:${MUTED}">Peace and Love Proclaimers · Youth for Change · Kigali, Rwanda<br>This is an automated message from the PLP Hub. Please do not reply to this address.</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    m.greeting, ...(m.paragraphs ?? []),
    m.code ? `Code: ${m.code}` : null,
    ...(m.details ?? []).map(([k, v]) => `${k}: ${v}`),
    m.note ? `${m.note.label}: ${m.note.text}` : null,
    m.button ? `${m.button.label}: ${m.button.url}` : null,
    m.footnote, "— Peace and Love Proclaimers, PLP Hub",
  ].filter(Boolean).join("\n\n");
  return { html, text };
}
