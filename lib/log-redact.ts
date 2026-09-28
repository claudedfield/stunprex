/**
 * LEGAL-01m: no app log line carries an email address or a sign-in URL.
 *
 * Server logs are kept for a limited period (decision K), but they hold whatever the code
 * prints. A mail server's error names the recipient, and an Auth.js error can carry the
 * magic-link URL, whose query holds the email address and the sign-in token. Every error the
 * app logs passes through here first: email addresses become <email>, and the `token`,
 * `email` and `callbackUrl` query values become <redacted>.
 */
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const QUERY = /([?&](?:token|email|callbackUrl)=)[^&\s"'#]*/gi;

export function redactLogText(s: string): string {
  return s.replace(QUERY, '$1<redacted>').replace(EMAIL, '<email>');
}

/** What an error may put in a log: its name, code and redacted message, never its whole object. */
export function redactError(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as Error & { code?: unknown }).code;
    return redactLogText(`${err.name}${code ? ` (${String(code)})` : ''}: ${err.message}`);
  }
  return redactLogText(String(err));
}
