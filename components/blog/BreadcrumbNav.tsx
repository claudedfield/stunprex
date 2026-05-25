// BreadcrumbNav — Home → Blog → [Category] → [Post]
import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string; // no href = current page (not linked)
}

interface Props {
  crumbs: Crumb[];
}

export function BreadcrumbNav({ crumbs }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol
        className="flex flex-wrap items-center gap-1.5 text-sm text-brown/55 font-ui"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {crumbs.map((crumb, i) => (
          <li
            key={i}
            className="flex items-center gap-1.5"
            itemScope
            itemType="https://schema.org/ListItem"
            itemProp="itemListElement"
          >
            {i > 0 && (
              <span aria-hidden className="text-brown/25 select-none">/</span>
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="hover:text-orange transition-colors"
                itemProp="item"
              >
                <span itemProp="name">{crumb.label}</span>
              </Link>
            ) : (
              <span className="text-brown/80" itemProp="name" aria-current="page">
                {crumb.label}
              </span>
            )}
            <meta itemProp="position" content={String(i + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
