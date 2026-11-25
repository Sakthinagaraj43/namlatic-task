interface LoaderProps {
  message?: string;
  variant?: 'spinner' | 'grid';
  count?: number;
}

export default function Loader({
  message = 'Loading hotels...',
  variant = 'spinner',
  count = 6,
}: LoaderProps) {
  if (variant === 'grid') {
    return (
      <div role="status" aria-live="polite" aria-label={message}>
        <span className="sr-only">{message}</span>
        <div className="hotel-grid" aria-hidden="true">
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="skeleton-card">
              <div className="skeleton-box" style={{ aspectRatio: '4 / 3' }} />
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="skeleton-box" style={{ height: '22px', width: '70%', borderRadius: '4px' }} />
                <div className="skeleton-box" style={{ height: '16px', width: '100%', borderRadius: '4px' }} />
                <div className="skeleton-box" style={{ height: '16px', width: '85%', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
