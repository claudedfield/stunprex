import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Cookie Policy',
  description:
    'StunpreX keeps cookies to the minimum needed to run the site. Visits are counted on our own server, with nothing on your device.',
};

export default function Page() {
  return (
    <LegalPage title="Cookie Policy" lastUpdated="2026-10-21">
      <p>We keep cookies to the minimum needed to run the site.</p>

      <ul>
        <li>
          <strong>Essential cookies</strong>: sign-in/session and security. These are
          required for the site to function and don&rsquo;t need consent.
        </li>
        <li>
          <strong>Game scores</strong>: each game keeps your best score in your browser&rsquo;s
          local storage. It stays on your device and is never sent to us.
        </li>
        <li>
          <strong>Analytics</strong>: nothing on your device. Our server counts the pages it serves, as
          totals.
        </li>
      </ul>

      <p>
        We do <strong>not</strong> use advertising or cross-site tracking cookies. You can
        clear or block cookies in your browser; blocking essential ones may break sign-in.
      </p>
    </LegalPage>
  );
}
