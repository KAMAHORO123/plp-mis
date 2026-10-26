import http from "node:http";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { fileURLToPath } from "node:url";
const assets = fileURLToPath(new URL("./assets/", import.meta.url));
const origin = process.env.APP_ORIGIN;
if (!origin) throw Error("APP_ORIGIN is required");
// Private renderer. No host port, database access or client-controlled verification URL.
http
  .createServer(async (req, res) => {
    if (req.url === "/healthz" && req.method === "GET") {
      res.end("ok");
      return;
    }
    if (req.url !== "/render" || req.method !== "POST") {
      res.writeHead(404).end();
      return;
    }
    try {
      let input = "";
      for await (const chunk of req) {
        input += chunk;
        if (input.length > 16000) throw Error("Too large");
      }
      const c = JSON.parse(input);
      if (
        !/^[a-f0-9-]{36}$/.test(c.id) ||
        typeof c.recipient !== "string" ||
        c.recipient.length > 200 ||
        typeof c.programme !== "string" ||
        c.programme.length > 200 ||
        !Number.isFinite(Date.parse(c.issued_at))
      )
        throw Error("Invalid certificate");
      const url = new URL("/verify/" + c.id, origin).href;
      const qr = await QRCode.toBuffer(url, {
        margin: 4,
        width: 600,
        errorCorrectionLevel: "M",
      });
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      });
      const pdf = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
        info: { Title: "PLP Certificate of Achievement" },
      });
      pdf.pipe(res);
      const blue = "#2175ba",
        navy = "#153952";
      pdf.rect(0, 0, 10, 595).fill(blue);
      pdf.lineWidth(1).rect(25, 25, 792, 545).stroke(blue);
      // Blue geometric border inspired by imigongo. Keep the centre uncluttered.
      for (let y = 45; y < 550; y += 28) {
        pdf
          .save()
          .translate(39, y)
          .rotate(45)
          .rect(-5, -5, 10, 10)
          .strokeColor("#b6d5ef")
          .stroke()
          .restore();
      }
      pdf.image(assets + "logo.png", 285, 48, { fit: [110, 76] });
      pdf
        .fillColor(navy)
        .font("Times-Italic")
        .fontSize(17)
        .text("Peace and Love\nProclaimers", 400, 60, { width: 190 });
      pdf
        .font("Helvetica")
        .fontSize(9)
        .fillColor(blue)
        .text("RECOGNIZING GROWTH & SERVICE", 80, 139, {
          width: 680,
          align: "center",
        });
      pdf
        .font("Times-Roman")
        .fontSize(32)
        .fillColor(navy)
        .text("Certificate of Achievement", 70, 168, {
          width: 700,
          align: "center",
        });
      pdf
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#62758a")
        .text("Proudly presented to", 70, 223, { width: 700, align: "center" });
      const fit = (value, font, size, width) => {
        pdf.font(font).fontSize(size);
        while (pdf.widthOfString(value) > width && size > 8)
          pdf.fontSize(--size);
      };
      fit(c.recipient, "Times-Bold", 32, 680);
      pdf
        .fillColor(navy)
        .text(c.recipient, 80, 252, { width: 680, align: "center" });
      pdf.moveTo(260, 299).lineTo(580, 299).strokeColor("#b6d5ef").stroke();
      pdf
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#62758a")
        .text(
          c.request_id ? "In recognition of" : "For successfully completing",
          80,
          320,
          {
            width: 680,
            align: "center",
          },
        );
      fit(c.programme, "Helvetica-Bold", 20, 680);
      pdf
        .fillColor(navy)
        .text(c.programme, 80, 346, { width: 680, align: "center" });
      pdf
        .font("Helvetica")
        .fontSize(11)
        .text("Peace and Love Proclaimers", 80, 381, {
          width: 680,
          align: "center",
        });
      pdf.image(assets + "signature.png", 337, 425, {
        fit: [145, 66],
        align: "center",
      });
      pdf.moveTo(325, 497).lineTo(505, 497).strokeColor("#b6d5ef").stroke();
      pdf
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Israel Nuru", 325, 505, { width: 180, align: "center" });
      pdf
        .font("Helvetica")
        .fontSize(10)
        .text("Executive Director", 325, 524, { width: 180, align: "center" });
      pdf.image(assets + "stamp.png", 530, 436, { fit: [93, 93] });
      pdf.image(qr, 668, 423, { width: 105 });
      pdf.link(668, 423, 105, 105, url);
      pdf
        .fontSize(8)
        .text("SCAN TO VERIFY", 662, 532, { width: 117, align: "center" });
      pdf.fontSize(10).text(
        "Issued " +
          new Date(c.issued_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }),
        70,
        456,
        { width: 245 },
      );
      pdf.end();
    } catch {
      if (!res.headersSent)
        res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unable to render certificate" }));
    }
  })
  .listen(Number(process.env.PORT || 8083), "0.0.0.0");
