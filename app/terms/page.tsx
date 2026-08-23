import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Terms of Use',
  description:
    'The terms that apply when you use StunpreX — what the platform is, what it is not, acceptable use, intellectual property, and liability.',
};

export default function Page() {
  return (
    <LegalPage title="Terms of Use" lastUpdated="2026-08-23">
      <p>By using StunpreX you agree to these terms.</p>

      <ul>
        <li>
          <strong>What StunpreX is:</strong> an educational football-development platform —
          methodology, articles, drills, and games. Content is for general developmental and
          informational purposes; it is <strong>not</strong> medical, physiotherapeutic, or
          professional coaching advice for an individual. Train sensibly and consult a
          qualified professional for injury/medical concerns.
        </li>
        <li>
          <strong>No guarantees of outcome:</strong> development is long-horizon and
          individual. We make no promise of athletic results, selection, or performance.
        </li>
        <li>
          <strong>Accounts:</strong> keep your sign-in email secure; you&rsquo;re responsible
          for activity under your account. Minors require parental consent.
        </li>
        <li>
          <strong>Acceptable use:</strong> no unlawful, abusive, or disruptive use; community
          contributions must be respectful and on-topic; we may moderate or remove content and
          accounts that break these terms.
        </li>
        <li>
          <strong>Intellectual property:</strong> the Codex, methodology, content, drills, and
          games are owned by DField Kft.; personal, non-commercial use is permitted; no
          scraping, resale, or redistribution without permission.
        </li>
        <li>
          <strong>Liability:</strong> to the extent permitted by law, the service is provided
          &ldquo;as is&rdquo;; DField Kft. is not liable for indirect or consequential loss.
          Nothing limits liability that cannot be limited by law.
        </li>
        <li>
          <strong>Changes:</strong> we may update these terms; material changes will be posted
          here.
        </li>
        <li>
          <strong>Governing law:</strong> Hungary / EU. Contact:{' '}
          <a href="mailto:hello@stunprex.com">hello@stunprex.com</a>.
        </li>
      </ul>
    </LegalPage>
  );
}
