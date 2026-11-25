import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AlertCircle, ArrowLeft, Building2, Pencil, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearHotelError,
  deleteHotel,
  fetchHotelById,
} from '../store/hotelSlice';
import { resolveAssetUrl } from '../api/hotelApi';
import HotelMap from '../components/HotelMap';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import SuccessPopup from '../components/SuccessPopup';

export default function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selectedHotel, loading, submitting, error } = useAppSelector(
    (state) => state.hotels
  );

  const [imageFailed, setImageFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletedTitle, setDeletedTitle] = useState<string | null>(null);

  useEffect(() => {
    setImageFailed(false);
    dispatch(clearHotelError());
    if (id) {
      dispatch(fetchHotelById(id));
    }
  }, [dispatch, id]);

  const handleConfirmDelete = async () => {
    if (!selectedHotel) return;
    const title = selectedHotel.title;
    const result = await dispatch(deleteHotel(selectedHotel.id));
    if (deleteHotel.fulfilled.match(result)) {
      setConfirmOpen(false);
      setDeletedTitle(title);
    }
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Hotel — Vespera Stays</title>
        </Helmet>
        <Loader message="Loading hotel profile..." />
      </>
    );
  }

  if (error || !selectedHotel) {
    return (
      <>
        <Helmet>
          <title>Hotel Not Found — Vespera Stays</title>
        </Helmet>
        <Link to="/" className="back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to Directory</span>
        </Link>
        <div className="state-panel state-panel-error" role="alert">
          <AlertCircle size={32} color="var(--danger)" aria-hidden="true" />
          <h1 className="state-title">Hotel not found</h1>
          <p className="state-text">
            {error || 'The requested hotel listing could not be found.'}
          </p>
          <Link to="/" className="btn btn-secondary">
            Return to Directory
          </Link>
        </div>
      </>
    );
  }

  const imageSrc = resolveAssetUrl(selectedHotel.imageUrl);
  const metaDescription =
    selectedHotel.description.length > 155
      ? `${selectedHotel.description.slice(0, 152).trimEnd()}...`
      : selectedHotel.description;

  return (
    <>
      <Helmet>
        <title>{selectedHotel.title} — Vespera Stays</title>
        <meta name="description" content={metaDescription} />
      </Helmet>

      <Link to="/" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Back to Directory</span>
      </Link>

      <div className="detail-layout">
        <div className="detail-hero-media">
          {!imageFailed && imageSrc ? (
            <img
              src={imageSrc}
              alt={`${selectedHotel.title} architectural exterior`}
              className="detail-hero-image"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="image-fallback">
              <Building2 size={40} aria-hidden="true" />
              <span>{selectedHotel.title}</span>
            </div>
          )}
        </div>

        <aside className="detail-info-panel">
          <div className="detail-header">
            <h1 className="detail-title">{selectedHotel.title}</h1>
            <div className="detail-price-row">
              <span className="detail-price tabular-nums">
                ${Number(selectedHotel.price).toLocaleString()}
              </span>
              <span className="hotel-card-price-unit">per night</span>
            </div>
          </div>

          <p className="detail-description">{selectedHotel.description}</p>

          <div className="detail-specs">
            <div>
              <div className="spec-label">Latitude</div>
              <div className="spec-value tabular-nums">
                {selectedHotel.latitude.toFixed(6)}&deg;
              </div>
            </div>
            <div>
              <div className="spec-label">Longitude</div>
              <div className="spec-value tabular-nums">
                {selectedHotel.longitude.toFixed(6)}&deg;
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <Link
              to={`/hotels/${encodeURIComponent(selectedHotel.id)}/edit`}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              <Pencil size={16} aria-hidden="true" />
              <span>Edit Property</span>
            </Link>
            <button
              type="button"
              className="btn btn-ghost-danger"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 size={16} aria-hidden="true" />
              <span>Delete</span>
            </button>
          </div>
        </aside>
      </div>

      <HotelMap
        title={selectedHotel.title}
        latitude={selectedHotel.latitude}
        longitude={selectedHotel.longitude}
        price={selectedHotel.price}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Hotel"
        message={`Are you sure you want to permanently remove "${selectedHotel.title}"? This action cannot be undone.`}
        confirmLabel="Delete Hotel"
        isLoading={submitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!submitting) setConfirmOpen(false);
        }}
      />

      <SuccessPopup
        isOpen={Boolean(deletedTitle)}
        title="Property Deleted"
        message={
          deletedTitle
            ? `"${deletedTitle}" has been removed from the directory.`
            : ''
        }
        actionLabel="Back to Directory"
        onClose={() => {
          setDeletedTitle(null);
          navigate('/');
        }}
      />
    </>
  );
}
