// All certificate downloads use this template, including every batch page.
export interface CertificateDesignData {
  recipient: string;
  programme: string;
  organization: string;
  recognition: string;
  dateLabel: 'REQUESTED' | 'COMPLETED' | 'ISSUED';
  completed: string;
  issued: string;
  authorization: string;
  id: string;
  verificationUrl: string;
  /** Large heading; defaults to "Certificate of Achievement". */
  title?: string;
  /** Shown under the recipient's name, e.g. "Club President". */
  role?: string;
  /** A personal sentence that replaces the generic recognition line. */
  citation?: string;
  /** Term of service, already formatted, e.g. "January 2026 – July 2026". */
  period?: string;
}
/** "Ange Uwera - Certificate of Leadership.pdf": readable, and safe on every operating system. */
export function certificateFileName(...parts: (string | undefined | null)[]) {
  const name = parts.filter(Boolean).join(' - ').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
  return `${name || 'PLP certificate'}.pdf`;
}
/** A certificate as the platform issued it (GET /certificates), with its own wording. */
export interface IssuedCertificate { id: string; recipient: string; programme: string; issued_at: string; kind: string; title?: string | null; citation?: string | null; role?: string | null; period_from?: string | null; period_to?: string | null; school?: string | null }
// The wording every school certificate falls back to, so previews and downloads always read the same.
export const DEFAULT_SCHOOL_TITLE = 'Certificate of Membership';
export const DEFAULT_SCHOOL_PROGRAMME = 'Service as a PLP member';
export const DEFAULT_CITATION = 'In recognition of dedicated service to the Peace and Love Proclaimers community and for helping build a culture of peace at school.';
export const verificationUrlFor = (id: string) => `${window.location.origin}/verify/${encodeURIComponent(id)}`;

/** The one description of a school certificate used by the preview card, the member's download and the leader's batch. */
export function schoolCertificateDesign(c: { id: string; recipient: string; issued: string; school?: string | null; title?: string | null; programme?: string | null; citation?: string | null; role?: string | null; periodFrom?: string | null; periodTo?: string | null; verificationUrl?: string }): CertificateDesignData {
  return {
    recipient: c.recipient, title: c.title || DEFAULT_SCHOOL_TITLE, role: c.role || undefined, citation: c.citation || DEFAULT_CITATION,
    period: formatPeriod(c.periodFrom, c.periodTo), programme: c.programme || DEFAULT_SCHOOL_PROGRAMME,
    organization: c.school || 'Peace and Love Proclaimers', recognition: 'In recognition of dedicated service to',
    dateLabel: 'ISSUED', completed: c.issued, issued: c.issued, authorization: 'PLP administrator',
    id: c.id, verificationUrl: c.verificationUrl ?? verificationUrlFor(c.id),
  };
}
/** The one description of a course completion certificate. */
export function courseCertificateDesign(c: { id: string; recipient: string; course: string; date: string }): CertificateDesignData {
  return {
    recipient: c.recipient, title: 'Certificate of Completion', programme: c.course, organization: 'PLP Academy',
    recognition: 'For successfully completing the course', dateLabel: 'COMPLETED', completed: c.date, issued: c.date,
    authorization: 'PLP Academy · Automatic course completion', id: c.id, verificationUrl: verificationUrlFor(c.id),
  };
}
/** A certificate as the platform issued it, described for display and download. */
export function issuedCertificateDesign(c: IssuedCertificate): CertificateDesignData {
  const issued = c.issued_at.slice(0, 10);
  return c.kind === 'school'
    ? schoolCertificateDesign({ id: c.id, recipient: c.recipient, issued, school: c.school, title: c.title, programme: c.programme, citation: c.citation, role: c.role, periodFrom: c.period_from, periodTo: c.period_to })
    : courseCertificateDesign({ id: c.id, recipient: c.recipient, course: c.programme, date: issued });
}
/** Downloads one issued certificate exactly as worded when it was issued, named after the person. */
export function downloadIssuedCertificate(c: IssuedCertificate) {
  const design = issuedCertificateDesign(c);
  return downloadCertificatePDF([design], certificateFileName(c.recipient, design.title));
}
/** "January 2026 – July 2026" from ISO dates; either end may be missing. */
export function formatPeriod(from?: string | null, to?: string | null) {
  const month = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  return from && to ? `${month(from)} – ${month(to)}` : from ? `Since ${month(from)}` : to ? `Until ${month(to)}` : '';
}
const fit = (pdf: { getTextWidth: (t: string) => number; setFontSize: (n: number) => unknown }, text: string, size: number, width: number) => pdf.setFontSize(Math.min(size, size * width / Math.max(pdf.getTextWidth(text), 1)));

/** Saves the certificates as one PDF, or, with `printWindow`, shows them there ready to print. */
export async function downloadCertificatePDF(certificates: CertificateDesignData[], filename: string, printWindow?: Window | null) {
 if (!certificates.length) return;
 // Trim only empty image margins at render time; preserve the supplied artwork.
 const loadImage=(src:string,trim=false)=>new Promise<{data:string;width:number;height:number}>((resolve,reject)=>{
  const img=new Image();img.onload=()=>{try{
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');ctx.drawImage(img,0,0);
   if(trim){
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
     const i=(y*canvas.width+x)*4;
     if(pixels[i+3]>32&&Math.min(pixels[i],pixels[i+1],pixels[i+2])<235){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
    }
    if(right>=left){const width=right-left+1,height=bottom-top+1;canvas.width=width;canvas.height=height;ctx.drawImage(img,left,top,width,height,0,0,width,height);}
   }
   resolve({data:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height});
  }catch(error){reject(error);}};img.onerror=()=>reject(new Error(`Unable to load certificate image: ${src}`));img.src=src;
 });
 const [logo,signature,stamp]=await Promise.all([
  loadImage('/images/plp/certificates/plp-dove.png',true),
  loadImage('/images/plp/executive-director-signature.png'),
  loadImage('/images/plp/certificates/plp-stamp.png',true),
 ]);
 const {jsPDF}=await import('jspdf');const QRCode=await import('qrcode');const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
 for(let i=0;i<certificates.length;i++){
  const certificate=certificates[i];if(i)pdf.addPage();
  pdf.setFillColor(255,255,255);pdf.rect(0,0,297,210,'F');
  pdf.setFillColor(18,54,82);pdf.rect(0,0,7,210,'F');pdf.setFillColor(29,117,219);pdf.rect(7,0,2,210,'F');
  pdf.setDrawColor(76,139,191);pdf.setLineWidth(.5);pdf.rect(15,12,269,186);pdf.setDrawColor(226,232,239);pdf.setLineWidth(.2);pdf.rect(18,15,263,180);
  const placeImage=(image:{data:string;width:number;height:number},x:number,y:number,width:number,height:number)=>{
   const scale=Math.min(width/image.width,height/image.height);const w=image.width*scale,h=image.height*scale;
   pdf.addImage(image.data,'PNG',x+(width-w)/2,y+(height-h)/2,w,h);
  };
  // High-resolution dove plus native PDF text stays sharp at print size.
  placeImage(logo,113,22,32,26);
  pdf.setTextColor(18,54,82);pdf.setFont('times','italic');pdf.setFontSize(13);
  pdf.text('Peace and',149,28);pdf.text('Love',149,34);pdf.text('Proclaimers',149,40);
  pdf.setFont('helvetica','normal');pdf.setFontSize(7);pdf.setTextColor(65,94,118);
  pdf.text('Youth For Change',148.5,49,{align:'center'});
  const heading=certificate.title||'Certificate of Achievement';pdf.setTextColor(18,54,82);pdf.setFont('times','normal');pdf.setFontSize(31);fit(pdf,heading,31,240);pdf.text(heading,148.5,75,{align:'center'});
  pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.setTextColor(99,112,128);pdf.text('Presented to',148.5,88,{align:'center'});
  pdf.setFont('times','bold');pdf.setTextColor(18,54,82);pdf.setFontSize(29);pdf.setFontSize(Math.min(29,29*235/Math.max(pdf.getTextWidth(certificate.recipient),1)));pdf.text(certificate.recipient,148.5,103,{align:'center'});
  pdf.setDrawColor(76,139,191);pdf.line(90,110,207,110);
  // Optional role, then the citation (up to two lines) or the standard recognition line, then programme and school.
  let y=110;
  if(certificate.role){pdf.setFont('times','italic');pdf.setFontSize(12);pdf.setTextColor(65,94,118);fit(pdf,certificate.role,12,200);pdf.text(certificate.role,148.5,117,{align:'center'});y=117;}
  pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.setTextColor(99,112,128);
  const lines=(pdf.splitTextToSize(certificate.citation||certificate.recognition,205) as string[]).slice(0,2);
  lines.forEach((l,n)=>pdf.text(l,148.5,y+9+n*5,{align:'center'}));y+=9+(lines.length-1)*5;
  pdf.setFont('helvetica','bold');pdf.setTextColor(18,54,82);pdf.setFontSize(15);fit(pdf,certificate.programme,15,235);pdf.text(certificate.programme,148.5,y+11,{align:'center'});
  pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.text(certificate.organization,148.5,y+18,{align:'center'});
  pdf.setDrawColor(226,232,239);pdf.line(29,154,268,154);
  pdf.setFontSize(8);pdf.setTextColor(99,112,128);pdf.text(certificate.period?'TERM OF SERVICE':certificate.dateLabel,29,164);
  pdf.setTextColor(18,54,82);pdf.setFontSize(10);pdf.text(certificate.period||certificate.completed,29,172);const signatureWidth=Math.min(65,25*signature.width/signature.height);const signatureHeight=signatureWidth*signature.height/signature.width;
  pdf.addImage(signature.data,'PNG',148.5-signatureWidth/2,157+(25-signatureHeight)/2,signatureWidth,signatureHeight);
  pdf.setDrawColor(170,189,205);pdf.line(115,183,182,183);pdf.setFont('helvetica','bold');pdf.setFontSize(10);pdf.text('Israel Nuru',148.5,188,{align:'center'});pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.text('Executive Director',148.5,193,{align:'center'});
  // The issue date shows once: as the main date when nothing else is printed there, otherwise on its own line.
  if(certificate.period||certificate.dateLabel!=='ISSUED'){pdf.setFontSize(8);pdf.setTextColor(99,112,128);pdf.text(`Issued ${certificate.issued}`,29,181);}
  placeImage(stamp,195,157,31,31);
  const url=certificate.verificationUrl;pdf.addImage(await QRCode.toDataURL(url,{margin:4,width:600,errorCorrectionLevel:'M'}),'PNG',238,155,31,31);pdf.setFontSize(7);pdf.text('SCAN TO VERIFY',253.5,190,{align:'center'});pdf.link(238,155,31,36,{url});


 }
 if (printWindow) { pdf.autoPrint(); printWindow.location.href = String(pdf.output('bloburl')); return; }
 pdf.save(filename);
}
