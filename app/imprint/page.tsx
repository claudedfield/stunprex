import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Imprint',
  description:
    'Imprint / Impressum for StunpreX — a project operated by DField Kft., Dunakeszi, Hungary.',
};

export default function Page() {
  return (
    <LegalPage title="Imprint / Impressum" lastUpdated="2026-08-23">
      <p>
        <strong>StunpreX</strong> is a project operated by DField Kft.
      </p>

      <ul>
        <li>
          <strong>Company:</strong> DField Kft. (DField Korlátolt Felelősségű Társaság)
        </li>
        <li>
          <strong>Registered seat:</strong> 2120 Dunakeszi, Torony köz 5. 1. ajtó, Hungary
        </li>
        <li>
          <strong>Company registration number:</strong> 13-09-242182 (registered at the
          Registry Court of the Pest County Court)
        </li>
        <li>
          <strong>Tax number:</strong> 32876217-2-13 · <strong>EU VAT:</strong> HU32876217
        </li>
        <li>
          <strong>Represented by:</strong> Dezső Mező, managing director
        </li>
        <li>
          <strong>Contact:</strong>{' '}
          <a href="mailto:hello@stunprex.com">hello@stunprex.com</a>
        </li>
        <li>
          <strong>Hosting provider:</strong> Vercel Inc., 340 S Lemon Ave #4133, Walnut,
          CA 91789, USA.
        </li>
      </ul>

      <p>
        Responsible for content under applicable Hungarian/EU law: Dezső Mező, DField Kft.
      </p>
    </LegalPage>
  );
}
