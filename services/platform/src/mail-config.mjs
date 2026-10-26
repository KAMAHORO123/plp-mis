import "./environment.mjs";
import nodemailer from "nodemailer";
// Username and password are both set (SMTP AUTH) or both empty (IP-authorised relay).
export function missingMailSettings(env = process.env) {
  const blank = (key) => !env[key]?.trim();
  const credentials = ["SMTP_USER", "SMTP_PASSWORD"];
  return [
    "SMTP_HOST",
    ...(credentials.every(blank) ? [] : credentials),
    "MAIL_FROM",
  ].filter(blank);
}
export function mailConfigured(env = process.env) {
  return missingMailSettings(env).length === 0;
}
export function createMailTransport(env = process.env) {
  const missing = missingMailSettings(env);
  if (missing.length)
    throw Error("Missing mail settings: " + missing.join(", "));
  const port = Number(env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw Error("SMTP_PORT must be a valid port number");
  // Relays such as Google's expect a real domain in EHLO, not a container hostname.
  const name =
    env.SMTP_HELO_NAME?.trim() || env.MAIL_FROM.trim().split("@").pop().replace(/>$/, "");
  return nodemailer.createTransport({
    name,
    host: env.SMTP_HOST.trim(),
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    ...(env.SMTP_USER?.trim()
      ? { auth: { user: env.SMTP_USER.trim(), pass: env.SMTP_PASSWORD } }
      : {}),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}
