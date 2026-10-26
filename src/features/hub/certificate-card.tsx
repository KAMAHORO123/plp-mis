import { useEffect, useState } from 'react';
import { Copy, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { downloadCertificatePDF, certificateFileName, type CertificateDesignData } from './certificate-pdf';

const codeOf = (id: string) => `PLP-${id.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}`;
const longDate = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : d);

/**
 * A compact preview of a certificate: the same wording as the PDF, laid out to read well at card size.
 * The full design (signature, stamp) is in the PDF, which Download saves and Print opens ready to print.
 * `pending` hides the QR code and code for certificates not issued yet (previews of a request).
 */
export function CertificateCard({ design, revoked = false, pending = false, actions = true, qrNote = 'QR code added when issued' }: { design: CertificateDesignData; revoked?: boolean; pending?: boolean; actions?: boolean; qrNote?: string }) {
  const [qr, setQr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (pending) return;
    let active = true;
    import('qrcode').then((QR) => QR.toDataURL(design.verificationUrl, { margin: 1, width: 200, errorCorrectionLevel: 'M' })).then((url) => { if (active) setQr(url); }).catch(() => {});
    return () => { active = false; };
  }, [design.verificationUrl, pending]);

  const file = certificateFileName(design.recipient, design.title);
  const download = async () => {
    setBusy(true);
    try { await downloadCertificatePDF([design], file); }
    catch { toast.error('The certificate could not be created. Try again.'); }
    finally { setBusy(false); }
  };
  // Opens the real PDF ready to print. The tab opens first, during the click, so pop-up blockers allow it.
  const print = async () => {
    const tab = window.open('', '_blank');
    if (!tab) return toast.error('Allow pop-ups for this site to print, or download the PDF instead.');
    try { await downloadCertificatePDF([design], file, tab); }
    catch { tab.close(); toast.error('The certificate could not be prepared for printing.'); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(design.verificationUrl); toast.success('Verification link copied'); }
    catch { toast.error('Copy the link from the certificate page instead.'); }
  };

  return (
    <article className="cc-card">
      <div className="cc-sheet" aria-label={`${design.title ?? 'Certificate'} for ${design.recipient}`}>
        <div className="cc-brand"><img src="/images/plp/certificates/plp-dove.png" alt="" /><span>Peace and Love Proclaimers</span></div>
        <p className="cc-title">{design.title ?? 'Certificate of Achievement'}</p>
        <p className="cc-small">Presented to</p>
        <p className="cc-name">{design.recipient}</p>
        {design.role && <p className="cc-role">{design.role}</p>}
        <p className="cc-citation">{design.citation || design.recognition}</p>
        <p className="cc-programme">{design.programme}</p>
        <p className="cc-org">{design.organization}{design.period ? ` · ${design.period}` : ''}</p>
        <div className="cc-foot">
          <dl>
            <div><dt>{design.dateLabel === 'COMPLETED' ? 'Completed' : 'Issued'}</dt><dd>{longDate(design.issued)}</dd></div>
            {!pending && <div><dt>Certificate code</dt><dd><code>{codeOf(design.id)}</code></dd></div>}
          </dl>
          <div className="cc-qr">{pending ? <span>{qrNote}</span> : qr ? <img src={qr} alt="QR code to verify this certificate" /> : <span />}{!pending && <small>Scan to verify</small>}</div>
        </div>
      </div>
      {actions && (
        <div className="cc-actions">
          <div className="cc-meta">
            <strong>{design.programme}</strong>
            <span>{longDate(design.issued)} <em className={revoked ? 'cc-badge revoked' : 'cc-badge'}>{revoked ? 'Revoked' : 'Valid'}</em></span>
          </div>
          <div className="cc-buttons">
            <button className="hub-button" disabled={busy || revoked} onClick={() => void download()}><Download size={15} />{busy ? 'Preparing…' : 'Download'}</button>
            <button className="hub-button secondary" disabled={revoked} onClick={() => void print()}><Printer size={15} />Print</button>
            <button className="hub-button secondary" onClick={() => void copy()} title="Copy verification link"><Copy size={15} />Copy link</button>
          </div>
        </div>
      )}
    </article>
  );
}
