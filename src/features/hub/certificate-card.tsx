import { translateUi, useSiteLanguage } from '../../i18n/language';
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
export function CertificateCard({ design, revoked = false, pending = false, actions = true, qrNote = 'QR code added when issued' }: {
    design: CertificateDesignData;
    revoked?: boolean;
    pending?: boolean;
    actions?: boolean;
    qrNote?: string;
}) {
    useSiteLanguage();
    const [qr, setQr] = useState('');
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        if (pending)
            return;
        let active = true;
        import('qrcode').then((QR) => QR.toDataURL(design.verificationUrl, { margin: 1, width: 200, errorCorrectionLevel: 'M' })).then((url) => { if (active)
            setQr(url); }).catch(() => { });
        return () => { active = false; };
    }, [design.verificationUrl, pending]);
    const file = certificateFileName(design.recipient, design.title);
    const download = async () => {
        setBusy(true);
        try {
            await downloadCertificatePDF([design], file);
        }
        catch {
            toast.error(translateUi('The certificate could not be created. Try again.'));
        }
        finally {
            setBusy(false);
        }
    };
    // Opens the real PDF ready to print. The tab opens first, during the click, so pop-up blockers allow it.
    const print = async () => {
        const tab = window.open('', '_blank');
        if (!tab)
            return toast.error(translateUi('Allow pop-ups for this site to print, or download the PDF instead.'));
        try {
            await downloadCertificatePDF([design], file, tab);
        }
        catch {
            tab.close();
            toast.error(translateUi('The certificate could not be prepared for printing.'));
        }
    };
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(design.verificationUrl);
            toast.success(translateUi('Verification link copied'));
        }
        catch {
            toast.error(translateUi('Copy the link from the certificate page instead.'));
        }
    };
    return (<article className="cc-card">
      <div className="cc-sheet" aria-label={translateUi("{p0} for {p1}", { p0: translateUi(design.title ?? 'Certificate'), p1: translateUi(design.recipient) })}>
        <div className="cc-brand"><img src="/images/plp/certificates/plp-dove.png" alt={translateUi("")}/><span>{translateUi("Peace and Love Proclaimers")}</span></div>
        <p className="cc-title">{translateUi(design.title ?? 'Certificate of Achievement')}</p>
        <p className="cc-small">{translateUi("Presented to")}</p>
        <p className="cc-name">{translateUi(design.recipient)}</p>
        {translateUi(design.role && <p className="cc-role">{translateUi(design.role)}</p>)}
        <p className="cc-citation">{translateUi(design.citation || design.recognition)}</p>
        <p className="cc-programme">{translateUi(design.programme)}</p>
        <p className="cc-org">{translateUi(design.organization)}{translateUi(design.period ? ` · ${design.period}` : '')}</p>
        <div className="cc-foot">
          <dl>
            <div><dt>{translateUi(design.dateLabel === 'COMPLETED' ? 'Completed' : 'Issued')}</dt><dd>{translateUi(longDate(design.issued))}</dd></div>
            {translateUi(!pending && <div><dt>{translateUi("Certificate code")}</dt><dd><code>{translateUi(codeOf(design.id))}</code></dd></div>)}
          </dl>
          <div className="cc-qr">{translateUi(pending ? <span>{translateUi(qrNote)}</span> : qr ? <img src={qr} alt={translateUi("QR code to verify this certificate")}/> : <span />)}{translateUi(!pending && <small>{translateUi("Scan to verify")}</small>)}</div>
        </div>
      </div>
      {translateUi(actions && (<div className="cc-actions">
          <div className="cc-meta">
            <strong>{translateUi(design.programme)}</strong>
            <span>{translateUi(longDate(design.issued))} <em className={revoked ? 'cc-badge revoked' : 'cc-badge'}>{translateUi(revoked ? 'Revoked' : 'Valid')}</em></span>
          </div>
          <div className="cc-buttons">
            <button className="hub-button" disabled={busy || revoked} onClick={() => void download()}><Download size={15}/>{translateUi(busy ? 'Preparing…' : 'Download')}</button>
            <button className="hub-button secondary" disabled={revoked} onClick={() => void print()}><Printer size={15}/>{translateUi("Print")}</button>
            <button className="hub-button secondary" onClick={() => void copy()} title={translateUi("Copy verification link")}><Copy size={15}/>{translateUi("Copy link")}</button>
          </div>
        </div>))}
    </article>);
}
