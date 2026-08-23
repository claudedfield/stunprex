import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'How StunpreX handles personal data — what we collect, why, who processes it, how long we keep it, and your rights under the GDPR.',
};

export default function Page() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="2026-08-23">
      <p>
        <strong>Controller:</strong> DField Kft., 2120 Dunakeszi, Torony köz 5. 1. ajtó,
        Hungary · <a href="mailto:hello@stunprex.com">hello@stunprex.com</a>.
      </p>

      <h2>What we collect and why</h2>
      <ul>
        <li>
          <strong>Email address</strong> — when you join the newsletter or sign in. Purpose:
          send the sign-in link and (with your consent) occasional updates.{' '}
          <strong>Legal basis:</strong> consent (Art. 6(1)(a) GDPR) for marketing email;
          performance of the service (Art. 6(1)(b)) for authentication.
        </li>
        <li>
          <strong>Account data</strong> — if you create an account (email + your activity on
          the site, e.g. saved game scores, questions). <strong>Legal basis:</strong>{' '}
          performance of the service.
        </li>
        <li>
          <strong>Basic technical/usage data</strong> — standard server logs and
          privacy-respecting, cookieless analytics (Vercel Analytics — no personal data
          collected, no cross-site tracking), to keep the site secure and working and to
          understand what content helps. <strong>Legal basis:</strong> legitimate interest
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
          Vercel Inc. (hosting, database, cookieless analytics; data may be processed in the
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
        StunpreX serves youth football development; some users are minors. Account creation
        for a minor requires verifiable parental consent (see the sign-up flow). We minimise
        data collected from or about children.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:hello@stunprex.com">hello@stunprex.com</a>
      </p>
    </LegalPage>
  );
}
