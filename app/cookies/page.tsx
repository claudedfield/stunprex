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
          <strong>Essential cookies</strong>: signing in sets cookies that keep you signed in and
          protect the sign-in form, and a short cookie, kept at most 15 minutes, that carries your
          choice below to the end of the sign-in. If you choose Google, one more security cookie lasts at most 15
          minutes, while you go to Google&rsquo;s page and back. These are needed for the sign-in you
          asked for. If you select &ldquo;Keep me signed in on this device for 30 days&rdquo;, we
          keep your sign-in cookie for that period. Otherwise, it is a session cookie, which your
          browser normally removes when you close it. Signing out removes the sign-in cookie. On
          Google&rsquo;s own pages,{' '}
          <a href="https://policies.google.com/technologies/cookies">Google&rsquo;s cookie information</a>{' '}
          and <a href="https://policies.google.com/privacy">privacy policy</a> apply.
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
