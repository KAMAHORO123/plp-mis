// Password rules for every place a password is set (sign-up, reset, change), following current NIST guidance:
// length plus a check against easily guessed choices, rather than forced symbol mixes. Sign-in is not checked.
const COMMON = new Set([
  "password", "passw0rd", "p@ssword", "p@ssw0rd", "qwerty", "qwertyuiop", "asdfghjkl", "zxcvbnm", "azerty", "letmein", "welcome",
  "iloveyou", "admin", "administrator", "changeme", "default", "secret", "master", "dragon", "monkey", "football", "sunshine",
  "princess", "trustno1", "abc", "abcdef", "abcdefgh", "loveyou", "plp", "plphub", "peaceandlove", "peaceloveproclaimers",
  "proclaimers", "rwanda", "kigali", "burundi", "jesus", "jesuschrist", "godisgood", "blessed", "computer", "internet",
]);
const SEQUENCES = ["0123456789", "1234567890", "9876543210", "abcdefghijklmnopqrstuvwxyz", "qwertyuiopasdfghjklzxcvbnm"];

/** A plain-language reason the password is too easy to guess, or "" when it is acceptable. */
export function passwordProblem(password, { email = "", name = "" } = {}) {
  const value = String(password ?? "");
  const lower = value.toLowerCase();
  if (value.length < 12) return "Use at least 12 characters.";
  if (value.length > 128) return "Use 128 characters or fewer.";
  if (/^(.)\1+$/.test(value) || new Set(lower).size < 4) return "Use a password with more variety than repeated characters.";
  if (/^\d+$/.test(value)) return "Add some letters: a number on its own is quick to guess.";
  // Mostly runs like "1234…", "abcd…" or keyboard rows such as "qwerty…".
  let steps = 0;
  for (let i = 1; i < lower.length; i++) {
    const pair = lower.slice(i - 1, i + 1), reversed = pair[1] + pair[0];
    if (SEQUENCES.some((s) => s.includes(pair) || s.includes(reversed))) steps++;
  }
  if (steps / (lower.length - 1) >= 0.7) return "Avoid keyboard or number sequences.";
  // Common words padded with numbers or symbols (for example "Password2026!") are among the first guesses attackers try.
  const core = lower.replace(/[^a-z]/g, "");
  if (COMMON.has(core) || COMMON.has(lower.replace(/[\d\W_]+$/g, "").replace(/^[\d\W_]+/g, ""))) return "This password is too common. Try a short sentence or a few unrelated words.";
  const local = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  if (local.length >= 4 && lower.replace(/[^a-z0-9]/g, "").includes(local)) return "Don't include your email address in your password.";
  for (const part of name.toLowerCase().split(/\s+/)) if (part.length >= 4 && lower.includes(part) && core.length - part.length < 6) return "Don't build your password around your name.";
  return "";
}
