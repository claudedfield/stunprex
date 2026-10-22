import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'How StunpreX handles personal data: what we collect, why, who processes it, how long we keep it, and your rights under the GDPR.',
};

export default function Page() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="2026-10-21">
      <p>
        <strong>Controller:</strong> DField Kft., 2120 Dunakeszi, Torony köz 5. 1. ajtó,
        Hungary · <a href="mailto:hello@stunprex.com">hello@stunprex.com</a>.
      </p>

      <h2>What we collect and why</h2>
      <ul>
        <li>
          <strong>Email address</strong>: when you sign in; your name and email address when you join
          the newsletter. Purpose:
          send the sign-in link and (with your consent) occasional updates.{' '}
          <strong>Legal basis:</strong> consent (Art. 6(1)(a) GDPR) for marketing email;
          performance of the service (Art. 6(1)(b)) for authentication.
        </li>
        <li>
          <strong>Sign-in with Google</strong> is optional. We store your email address and a
          Google account identifier to recognise your StunpreX account. We do not store your Google
          profile name or picture. Authentication tokens are processed during sign-in but are not
          retained in our account database. We do not request access to your Gmail messages,
          contacts or Google Drive files. Google (Google Ireland Limited, Dublin) processes the
          sign-in under its own <a href="https://policies.google.com/privacy">privacy policy</a>. We keep the link to your Google account while your account is
          open. <strong>Legal basis:</strong> performance of the service (Art. 6(1)(b) GDPR).
        </li>
        <li>
          <strong>Account data</strong>: if you create an account (email, your display name
          and profile, and your questions, answers and comments). <strong>Legal basis:</strong>{' '}
          performance of the service.
        </li>
        <li>
          <strong>Reports</strong> (our report form at stunprex.com/report, open to anyone): what you
          report and why; your name and email address if you give them, used only to answer you about
          the report; and our decision with its reasons. <strong>Legal basis:</strong> our duties under
          the EU Digital Services Act to handle reports of illegal content and give reasons (Art.
          6(1)(c) GDPR); otherwise our legitimate interest in a safe and lawful community (Art.
          6(1)(f)). We keep a reporter&rsquo;s identity confidential and do not tell a reported person
          who reported them, unless the law requires us to in a particular case.
        </li>
        <li>
          <strong>Basic technical/usage data</strong>: standard server logs, to keep the site
          secure and working. <strong>Legal basis:</strong> legitimate interest (Art. 6(1)(f)).
        </li>
        <li>
          <strong>Counting visits</strong>: when our server sends you a page, it adds one to that
          page&rsquo;s total for the day and, if your browser tells it which site you came from, one to
          that site&rsquo;s total, by its name only. To keep people and automated programs apart, the
          server looks at the description your browser sends with the request while it sends the
          page, and does not store it; a visit from a known automated program is added to that
          program&rsquo;s total, by the program&rsquo;s name, instead. The totals contain nothing about you, and nothing
          is sent from your device for this. We also keep one number per community question: how many times it has
          been opened. It is a count on the question, not a record of who opened it.
        </li>
        <li>
          We do <strong>not</strong> sell personal data, and we do not run advertising
          profiling.
        </li>
      </ul>

      <h2>Who processes it (sub-processors)</h2>
      <ul>
        <li>
          Hostinger International Ltd. (our server in the Netherlands, which holds the website and
          its database; sign-in, report and newsletter emails; our mailboxes).
        </li>
        <li>
          Google Ireland Limited, only if you choose to sign in with Google; it acts under its own{' '}
          <a href="https://policies.google.com/privacy">privacy policy</a>, not on our behalf.
        </li>
      </ul>

      <h2>Retention</h2>
      <ul>
        <li>
          Newsletter: until you unsubscribe. We then delete your name and address from our list
          without delay. If you never confirm, we delete your request within 7 days; an address
          that cannot be delivered to is deleted after 90 days.
        </li>
        <li>Account data: until you delete your account.</li>
        <li>
          Reports and our decisions: 1 year from the decision, and no longer than 1 year and 3
          months; longer only while a dispute is open.
        </li>
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
