/**
 * Adapter for the official e-kassa receipt page (monitoring.e-kassa.gov.az).
 *
 * UNDOCUMENTED SITE DEPENDENCY (observed 2026-11-22 in the site's public bundle and on a
 * real Android phone): the page's own "ÇEKİ YÜKLƏ" (download as JPG) button builds a
 * `blob:` URL from the receipt JPEG and clicks an `<a download>` link. Android WebView
 * hands downloads to DownloadManager, which only accepts http(s) and silently drops
 * `blob:` links, so the file never reaches the app. This bridge receives the file the
 * page exports, only when the customer taps that button. It never solves or touches the
 * reCAPTCHA, reads no cookies or tokens, and reads nothing else from the page.
 * If the site changes, or an authorised API becomes available, replace this module only:
 * the screen depends on `parseExportMessage` and `EXPORT_BRIDGE_SCRIPT`, nothing else.
 */

export const OFFICIAL_HOST = 'monitoring.e-kassa.gov.az';
/** Same shape the backend accepts: 12-char Fiscal ID, optionally followed by 32 more. */
const OFFICIAL_RECEIPT =
  /^https:\/\/monitoring\.e-kassa\.gov\.az\/#\/index\?doc=[A-Za-z0-9]{12}(?:[A-Za-z0-9]{32})?$/;

/** The official receipt page for a scanned fiscal QR (full `doc` kept as is), or null. */
export function officialReceiptUrl(qr: string): string | null {
  // Some registers pad the QR text with NUL bytes.
  const text = qr.replace(/\u0000+$/, '').trim();
  return OFFICIAL_RECEIPT.test(text) ? text : null;
}

/** Top-level navigation must stay on the official site (reCAPTCHA runs in sub-frames). */
export function isAllowedTopNavigation(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === OFFICIAL_HOST;
  } catch {
    return url === 'about:blank';
  }
}

export const MIN_RECEIPT_BYTES = 1024;
export const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;
const MESSAGE = 'epsilon:ekassa-export';

/**
 * Runs in the official page before its own scripts. Remembers blobs the page creates and,
 * when the customer clicks a download link pointing at one, posts that file to the app.
 */
export const EXPORT_BRIDGE_SCRIPT = `(function () {
  if (window.__epsilonExport) return;
  window.__epsilonExport = true;
  var blobs = {};
  var create = URL.createObjectURL;
  URL.createObjectURL = function (value) {
    var url = create.apply(URL, arguments);
    if (value instanceof Blob && value.size <= ${MAX_RECEIPT_BYTES}) blobs[url] = value;
    return url;
  };
  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[download]') : null;
    var blob = link && blobs[link.href];
    if (!blob) return;
    var reader = new FileReader();
    reader.onload = function () {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: '${MESSAGE}', size: blob.size, data: String(reader.result).split(',')[1] || ''
      }));
    };
    reader.readAsDataURL(blob);
  }, true);
})(); true;`;

export type ReceiptExport = {
  mime: 'image/jpeg' | 'image/png';
  /** Base64 file content, exactly as exported by the official page. */
  data: string;
  bytes: number;
};

export type ExportProblem = 'format' | 'size';

/**
 * Validates a message from the official page. Returns null for anything that is not an
 * export, a problem for an export that is not a usable image, or the image itself.
 */
export function parseExportMessage(
  raw: string,
): ReceiptExport | { problem: ExportProblem } | null {
  let message: unknown;
  try {
    message = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    typeof message !== 'object' ||
    message === null ||
    (message as { type?: unknown }).type !== MESSAGE
  )
    return null;
  const data = (message as { data?: unknown }).data;
  if (typeof data !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(data))
    return { problem: 'format' };
  const bytes =
    Math.floor((data.length * 3) / 4) - (data.match(/=+$/)?.[0].length ?? 0);
  if (bytes < MIN_RECEIPT_BYTES || bytes > MAX_RECEIPT_BYTES)
    return { problem: 'size' };
  // File signature, not the page's word for it.
  const mime = data.startsWith('/9j/')
    ? 'image/jpeg'
    : data.startsWith('iVBORw0KGgo')
      ? 'image/png'
      : null;
  if (!mime) return { problem: 'format' };
  return { mime, data, bytes };
}
