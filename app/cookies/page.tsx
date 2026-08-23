import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Cookie Policy',
  description:
    'StunpreX keeps cookies to the minimum needed to run the site. Our analytics are cookieless, set no cookies, and require no consent banner.',
};

export default function Page() {
  return (
    <LegalPage title="Cookie Policy" lastUpdated="2026-08-23">
      <p>We keep cookies to the minimum needed to run the site.</p>

      <ul>
        <li>
          <strong>Essential cookies</strong> — sign-in/session and security. These are
          required for the site to function and don&rsquo;t need consent.
        </li>
        <li>
          <strong>Preference cookies</strong> — remember choices (e.g. reduced-motion,
          filters), stored locally where possible.
        </li>
        <li>
          <strong>Analytics</strong> — we use Vercel Analytics, which is cookieless and
          collects no personal data; it sets no cookies and requires no consent banner. If we
          ever adopt analytics that use cookies, this policy and a consent mechanism will be
          updated first.
        </li>
      </ul>

      <p>
        We do <strong>not</strong> use advertising or cross-site tracking cookies. You can
        clear or block cookies in your browser; blocking essential ones may break sign-in.
      </p>
    </LegalPage>
  );
}
