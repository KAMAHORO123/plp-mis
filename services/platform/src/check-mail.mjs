import { createMailTransport, missingMailSettings } from "./mail-config.mjs";
const missing = missingMailSettings();
if (missing.length) {
  console.error("SMTP not ready. Missing: " + missing.join(", "));
  console.error(
    "Save settings in deploy/.env or services/platform/.env, not .env.example.",
  );
  process.exitCode = 1;
} else {
  let transport;
  try {
    transport = createMailTransport();
    await transport.verify();
    console.log(
      "SMTP connection, TLS and authentication passed. No email was sent.",
    );
    console.log(
      "Sender acceptance and inbox delivery still require a password recovery request.",
    );
  } catch (error) {
    const safeCodes = [
      "EAUTH",
      "ETIMEDOUT",
      "ECONNECTION",
      "ESOCKET",
      "EDNS",
      "ETLS",
    ];
    console.error(
      "SMTP verification failed: " +
        (safeCodes.includes(error.code)
          ? error.code
          : "configuration or connection error"),
    );
    process.exitCode = 1;
  } finally {
    transport?.close();
  }
}
