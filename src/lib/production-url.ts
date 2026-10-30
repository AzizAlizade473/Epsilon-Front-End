// SEC-9: production uses an explicitly configured public HTTPS domain.
// This validates configuration, not DNS ownership or backend deployment identity.
const nonProductionLabel =
  /(^|[^a-z0-9])(dev(elopment)?|stage|staging|test(ing)?|mock|sandbox|preview|qa|uat|localhost)([^a-z0-9]|$)/i;
const localSuffix =
  /\.(local|localdomain|lan|internal|intranet|home|localhost|test|invalid|example|arpa|onion)$/i;
const reservedDomain =
  /(^|\.)(example\.(com|net|org)|nip\.io|sslip\.io|localtest\.me)$/i;

export function isProductionApiUrl(
  value: string,
  nonProductionUrls: readonly string[] = [],
): boolean {
  try {
    if (value !== value.trim()) return false;
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.port && url.port !== '443')
    )
      return false;
    // All IP literals are excluded, including URL-normalized hex/octal IPv4
    // and IPv4-mapped IPv6. Single-label hosts cannot be public API domains.
    if (
      !hostname.includes('.') ||
      hostname.includes(':') ||
      /^[\d.]+$/.test(hostname)
    )
      return false;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(hostname)) return false;
    if (
      hostname
        .split('.')
        .some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
    )
      return false;
    if (localSuffix.test(hostname) || reservedDomain.test(hostname))
      return false;
    if (
      nonProductionLabel.test(`${hostname}/${decodeURIComponent(url.pathname)}`)
    )
      return false;
    // A shared origin configured for development/staging cannot be production.
    return !nonProductionUrls.some((candidate) => {
      const other = new URL(candidate);
      return other.hostname.toLowerCase().replace(/\.$/, '') === hostname;
    });
  } catch {
    return false;
  }
}
