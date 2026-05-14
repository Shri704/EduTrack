/**
 * Returns a user-facing message if the email is incomplete or invalid; otherwise null.
 * Rejects missing @, missing dot in domain, too-short TLD (e.g. ".c"), and common
 * Gmail-style typos like @gmail.co instead of @gmail.com.
 */
export function getEmailFormatError(raw) {
  const email = String(raw ?? "").trim();
  if (!email) return "Enter an email address.";
  if (/\s/.test(email)) return "Remove spaces from the email address.";
  if (!email.includes("@")) {
    return "This email is missing @. Use a full address like name@school.com.";
  }
  const parts = email.split("@");
  if (parts.length !== 2) {
    return "Use exactly one @ in the email (for example: name@school.com).";
  }
  const [local, domain] = parts;
  if (!local) {
    return "Add the part before @ (for example: priya in priya@school.com).";
  }
  if (!domain) {
    return "Add the part after @ with a domain like gmail.com or school.edu.";
  }
  const lowerDomain = domain.toLowerCase();
  if (!lowerDomain.includes(".")) {
    return "Add a domain with a dot after @ (for example school.com or gmail.com).";
  }
  const lastDot = lowerDomain.lastIndexOf(".");
  const hostBeforeTld = lowerDomain.slice(0, lastDot);
  const tld = lowerDomain.slice(lastDot + 1);
  if (!hostBeforeTld) {
    return "Add a name before the dot in the domain (for example gmail.com).";
  }
  if (!tld || tld.length < 2) {
    return "After the last dot, add at least two characters (for example .com or .in).";
  }
  if (!/^[a-z0-9-]+$/i.test(tld)) {
    return "Use only letters, numbers, or hyphens after the last dot (for example .com).";
  }

  const rightmostLabel = hostBeforeTld.includes(".")
    ? hostBeforeTld.slice(hostBeforeTld.lastIndexOf(".") + 1)
    : hostBeforeTld;
  const mustBeDotCom = new Set([
    "gmail",
    "googlemail",
    "hotmail",
    "outlook",
    "live",
    "msn",
    "icloud"
  ]);
  if (mustBeDotCom.has(rightmostLabel) && tld !== "com") {
    return `For ${rightmostLabel}, use @${rightmostLabel}.com (not .${tld}).`;
  }

  return null;
}
