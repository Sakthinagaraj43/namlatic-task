import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearHotelError,
  clearSelectedHotel,
  createHotel,
  fetchHotelById,
  updateHotel,
} from '../store/hotelSlice';
import HotelForm from '../components/HotelForm';
import Loader from '../components/Loader';
import SuccessPopup from '../components/SuccessPopup';

export default function HotelFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selectedHotel, loading, submitting, error } = useAppSelector(
    (state) => state.hotels
  );

  const [savedHotelId, setSavedHotelId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    dispatch(clearHotelError());
    if (id) {
      dispatch(fetchHotelById(id));
    } else {
      dispatch(clearSelectedHotel());
    }
    return () => {
      dispatch(clearHotelError());
    };
  }, [dispatch, id]);

  const handleFormSubmit = async (formData: FormData) => {
    if (isEditMode && id) {
      const result = await dispatch(updateHotel({ id, formData }));
      if (updateHotel.fulfilled.match(result)) {
        setSavedHotelId(result.payload.id);
        setSuccessMsg(`"${result.payload.title}" has been updated successfully.`);
      }
    } else {
      const result = await dispatch(createHotel(formData));
      if (createHotel.fulfilled.match(result)) {
        setSavedHotelId(result.payload.id);
        setSuccessMsg(`"${result.payload.title}" has been added to the directory.`);
      }
    }
  };

  const pageTitle = isEditMode
    ? selectedHotel
      ? `Edit ${selectedHotel.title} — Vespera Stays`
      : 'Edit Hotel — Vespera Stays'
    : 'Add New Hotel — Vespera Stays';

  return (
    <div className="form-page-wrapper">
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={
            isEditMode
              ? 'Update hotel listing details, nightly rate, imagery, and map coordinates.'
              : 'Add a new boutique hotel listing with image upload, description, nightly rate, and geographic coordinates.'
          }
        />
      </Helmet>

      <Link
        to={isEditMode && id ? `/hotels/${encodeURIComponent(id)}` : '/'}
        className="back-link"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <span>{isEditMode ? 'Back to Hotel Details' : 'Back to Directory'}</span>
      </Link>

      <div className="page-intro" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">
            {isEditMode ? 'Edit Hotel Listing' : 'Add New Hotel'}
          </h1>
          <p className="page-subtitle">
            {isEditMode
              ? 'Update the property details, nightly pricing, or replace the photograph.'
              : 'Provide property photography, description, nightly rate, and exact map coordinates.'}
          </p>
        </div>
      </div>

      {isEditMode && loading && <Loader message="Loading hotel details..." />}

      {isEditMode && !loading && !selectedHotel && error && (
        <div className="state-panel state-panel-error" role="alert">
          <AlertCircle size={32} color="var(--danger)" aria-hidden="true" />
          <h2 className="state-title">Hotel not found</h2>
          <p className="state-text">{error}</p>
          <Link to="/" className="btn btn-secondary">
            Return to Directory
          </Link>
        </div>
      )}

      {(!isEditMode || (!loading && selectedHotel)) && (
        <HotelForm
          initialHotel={isEditMode ? selectedHotel : null}
          isEditMode={isEditMode}
          isSubmitting={submitting}
          serverError={error}
          onSubmit={handleFormSubmit}
          onCancel={() =>
            navigate(isEditMode && id ? `/hotels/${encodeURIComponent(id)}` : '/')
          }
        />
      )}

      <SuccessPopup
        isOpen={Boolean(successMsg)}
        title={isEditMode ? 'Hotel Updated' : 'Hotel Created'}
        message={successMsg || ''}
        actionLabel="View Hotel"
        onClose={() => {
          const targetId = savedHotelId;
          setSuccessMsg(null);
          if (targetId) {
            navigate(`/hotels/${encodeURIComponent(targetId)}`);
          } else {
            navigate('/');
          }
        }}
      />
    </div>
  );
}
