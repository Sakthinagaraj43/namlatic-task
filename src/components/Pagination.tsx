import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
}

function getPageNumbers(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) {
    pages.push('ellipsis');
  }
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }
  if (end < total - 1) {
    pages.push('ellipsis');
  }
  pages.push(total);
  return pages;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = getPageNumbers(page, totalPages);

  return (
    <nav className="pagination-bar" aria-label="Hotel directory pagination">
      <button
        type="button"
        className="pagination-btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Previous</span>
      </button>

      {items.map((item, idx) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className="pagination-ellipsis" aria-hidden="true">
            &hellip;
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={`pagination-btn tabular-nums ${item === page ? 'active' : ''}`}
            onClick={() => onPageChange(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        className="pagination-btn"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <span>Next</span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
