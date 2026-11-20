export function resolveTrustedViewerCountry(request: Request): string {
  // Cloudflare Workers supplies the country derived from the connection at the edge.
  // Do not use browser body fields or caller-controlled country headers as location evidence.
  const country = (request as Request & { cf?: { country?: unknown } }).cf?.country;
  return typeof country === "string" && /^[A-Z]{2}$/.test(country) ? country : "ZZ";
}
