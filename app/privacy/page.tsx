import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'How StunpreX handles personal data: what we collect, why, who processes it, how long we keep it, and your rights under the GDPR.',
};

export default function Page() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="2026-09-24">
      <p>
        <strong>Controller:</strong> DField Kft., 2120 Dunakeszi, Torony köz 5. 1. ajtó,
        Hungary · <a href="mailto:hello@stunprex.com">hello@stunprex.com</a>.
      </p>

      <h2>What we collect and why</h2>
      <ul>
        <li>
          <strong>Email address</strong>: when you join the newsletter or sign in. Purpose:
          send the sign-in link and (with your consent) occasional updates.{' '}
          <strong>Legal basis:</strong> consent (Art. 6(1)(a) GDPR) for marketing email;
          performance of the service (Art. 6(1)(b)) for authentication.
        </li>
        <li>
          <strong>Account data</strong>: if you create an account (email + your activity on
          the site, e.g. saved game scores, questions). <strong>Legal basis:</strong>{' '}
          performance of the service.
        </li>
        <li>
          <strong>Basic technical/usage data</strong>: standard server logs, to keep the site
          secure and working. We use no analytics or tracking at present. <strong>Legal basis:</strong> legitimate interest
          (Art. 6(1)(f)).
        </li>
        <li>
          We do <strong>not</strong> sell personal data, and we do not run advertising
          profiling.
        </li>
      </ul>

      <h2>Who processes it (sub-processors)</h2>
      <ul>
        <li>
          Vercel Inc. (hosting, database; data may be processed in the
          EU/USA under appropriate safeguards).
        </li>
        <li>Our email/SMTP provider (to deliver sign-in links).</li>
        <li>Beehiiv Inc. (newsletter delivery), for newsletter subscribers.</li>
      </ul>

      <h2>Retention</h2>
      <ul>
        <li>Newsletter email: until you unsubscribe.</li>
        <li>Account data: until you delete your account.</li>
        <li>Logs: a limited period for security/diagnostics.</li>
      </ul>

      <h2>Your rights (GDPR)</h2>
      <p>
        Access, rectification, erasure, restriction, portability, objection, and withdrawal
        of consent at any time. To exercise any right, email{' '}
        <a href="mailto:hello@stunprex.com">hello@stunprex.com</a>. You may also lodge a
        complaint with the Hungarian Data Protection Authority (NAIH,{' '}
        <a href="https://naih.hu" target="_blank" rel="noopener noreferrer">
          naih.hu
        </a>
        ).
      </p>

      <h2>Children</h2>
      <p>
        StunpreX content is open to read without an account. People aged 16 or over may create
        their own account. A parent or guardian may use their own account to seek general
        guidance about supporting a younger player; this does not create an account for that
        player and does not permit a person under 16 to use the adult&rsquo;s account. The
        newsletter is for subscribers aged 16 or over; a parent may subscribe with their own
        address. If you believe an account or subscription is held by a person under 16, email
        hello@stunprex.com and we will close it. We ask for the minimum data and never ask for
        information about a child&rsquo;s health.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:hello@stunprex.com">hello@stunprex.com</a>
      </p>
    </LegalPage>
  );
}
