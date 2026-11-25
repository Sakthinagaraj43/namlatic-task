import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Pencil, Trash2 } from 'lucide-react';
import type { Hotel } from '../types/hotel';
import { resolveAssetUrl } from '../api/hotelApi';

interface HotelCardProps {
  hotel: Hotel;
  onDeleteRequest: (hotel: Hotel) => void;
}

function truncateText(text: string, maxLength = 100): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}...`;
}

export default function HotelCard({ hotel, onDeleteRequest }: HotelCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = resolveAssetUrl(hotel.imageUrl);

  return (
    <article className="hotel-card">
      <Link
        to={`/hotels/${encodeURIComponent(hotel.id)}`}
        className="hotel-card-link"
        aria-label={`View details for ${hotel.title}`}
      >
        <div className="hotel-card-media">
          {!imageFailed && imageSrc ? (
            <img
              src={imageSrc}
              alt={`${hotel.title} exterior and property view`}
              className="hotel-card-image"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="image-fallback">
              <Building2 size={28} aria-hidden="true" />
              <span>{hotel.title}</span>
            </div>
          )}
        </div>

        <div className="hotel-card-body">
          <div className="hotel-card-top">
            <h2 className="hotel-card-title">{hotel.title}</h2>
            <span className="hotel-card-price tabular-nums">
              ${Number(hotel.price).toLocaleString()}
              <span className="hotel-card-price-unit"> / night</span>
            </span>
          </div>

          <p className="hotel-card-description">{truncateText(hotel.description, 100)}</p>

          <div className="hotel-card-coords tabular-nums">
            <MapPin size={13} aria-hidden="true" />
            <span>
              {hotel.latitude.toFixed(4)}, {hotel.longitude.toFixed(4)}
            </span>
          </div>
        </div>
      </Link>

      <div className="hotel-card-actions">
        <Link
          to={`/hotels/${encodeURIComponent(hotel.id)}/edit`}
          className="btn btn-secondary btn-sm"
          aria-label={`Edit ${hotel.title}`}
        >
          <Pencil size={14} aria-hidden="true" />
          <span>Edit</span>
        </Link>
        <button
          type="button"
          className="btn btn-ghost-danger btn-sm"
          onClick={() => onDeleteRequest(hotel)}
          aria-label={`Delete ${hotel.title}`}
        >
          <Trash2 size={14} aria-hidden="true" />
          <span>Delete</span>
        </button>
      </div>
    </article>
  );
}
