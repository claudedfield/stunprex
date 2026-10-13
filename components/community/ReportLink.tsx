'use client'
/**
 * The "Report" link under a question, an answer and a comment (LEGAL-03.2). It leads to /report
 * with the item filled in: its type, its id and its address on this page. Shown to everyone,
 * signed in or not.
 */
import { usePathname } from 'next/navigation'

export default function ReportLink({ targetType, targetId, anchor }: { targetType: 'question' | 'answer' | 'comment'; targetId: string; anchor?: string }) {
  const pathname = usePathname() ?? '/community'
  const url = `${pathname}${anchor ? `#${anchor}` : ''}`
  const href = `/report?type=${targetType}&id=${encodeURIComponent(targetId)}&url=${encodeURIComponent(url)}`
  return (
    <a href={href} rel="nofollow" data-report-link={targetType}
      className="text-xs font-ui text-brown/40 hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded">
      Report
    </a>
  )
}
