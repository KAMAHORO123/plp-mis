# Private certificate renderer

Run `npm ci`, then `APP_ORIGIN=https://your-hub-host npm start`. Listens on 8083. The platform checks ownership and revocation before asking this service to render a PDF. There is no browser-facing render endpoint in the gateway.

The service accepts only certificate fields from the trusted platform. Verification URLs are built from configured `APP_ORIGIN`, never supplied by a browser. The stamp and signature are bundled into this private service image rather than the public landing build. Do not expose its port or publish the image/assets in a public registry.

PDFs use the supplied PLP identity, Israel Nuru's Executive Director signature and a QR pointing to the database-backed verification page. A PDF's appearance alone does not establish authenticity; the verification record is authoritative.
