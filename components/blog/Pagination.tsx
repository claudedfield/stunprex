// Pagination — server-rendered, URL-param based (?page=N).
import Link from 'next/link';

interface Props {
  currentPage: number;
  totalPages: number;
  baseHref: string; // e.g. '/blog' or '/blog/category/methodology'
}

export function Pagination({ currentPage, totalPages, baseHref }: Props) {
  if (totalPages <= 1) return null;

  const pageHref = (p: number) =>
    p === 1 ? baseHref : `${baseHref}?page=${p}`;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 mt-12">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={pageHref(currentPage - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-deepblue/20 text-deepblue hover:bg-deepblue hover:text-white transition-colors"
          aria-label="Previous page"
        >
          ←
        </Link>
      ) : (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brown/10 text-brown/25 cursor-not-allowed" aria-disabled>
          ←
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p) => (
        <Link
          key={p}
          href={pageHref(p)}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold font-ui transition-colors ${
            p === currentPage
              ? 'bg-deepblue text-white border border-deepblue'
              : 'border border-deepblue/20 text-deepblue hover:bg-deepblue/8'
          }`}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </Link>
      ))}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={pageHref(currentPage + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-deepblue/20 text-deepblue hover:bg-deepblue hover:text-white transition-colors"
          aria-label="Next page"
        >
          →
        </Link>
      ) : (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brown/10 text-brown/25 cursor-not-allowed" aria-disabled>
          →
        </span>
      )}
    </nav>
  );
}
