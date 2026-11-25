import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AlertCircle, Building2, Plus, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearHotelError, deleteHotel, fetchHotels } from '../store/hotelSlice';
import type { Hotel } from '../types/hotel';
import SearchFilterBar from '../components/SearchFilterBar';
import type { SearchFilterValues } from '../components/SearchFilterBar';
import HotelCard from '../components/HotelCard';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import SuccessPopup from '../components/SuccessPopup';
import Loader from '../components/Loader';

const ITEMS_PER_PAGE = 6;

export default function HotelListPage() {
  const dispatch = useAppDispatch();
  const { list, loading, submitting, error, pagination } = useAppSelector(
    (state) => state.hotels
  );

  const [filters, setFilters] = useState<SearchFilterValues>({
    search: '',
    minPrice: '',
    maxPrice: '',
  });
  const [page, setPage] = useState(1);
  const [hotelToDelete, setHotelToDelete] = useState<Hotel | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadHotels = useCallback(() => {
    dispatch(
      fetchHotels({
        search: filters.search,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        page,
        limit: ITEMS_PER_PAGE,
      })
    );
  }, [dispatch, filters.search, filters.minPrice, filters.maxPrice, page]);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  const handleFilterChange = useCallback((nextValues: SearchFilterValues) => {
    setFilters(nextValues);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ search: '', minPrice: '', maxPrice: '' });
    setPage(1);
  }, []);

  const handleConfirmDelete = async () => {
    if (!hotelToDelete) return;
    const deletedTitle = hotelToDelete.title;
    const result = await dispatch(deleteHotel(hotelToDelete.id));
    if (deleteHotel.fulfilled.match(result)) {
      setHotelToDelete(null);
      setSuccessMessage(`"${deletedTitle}" has been removed from the directory.`);
      const nextPage = list.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        loadHotels();
      }
    }
  };

  const hasFilters =
    filters.search.trim() !== '' ||
    filters.minPrice.trim() !== '' ||
    filters.maxPrice.trim() !== '';

  return (
    <>
      <Helmet>
        <title>Vespera Stays — Curated Hotel Directory</title>
        <meta
          name="description"
          content="Browse, search, and manage curated boutique hotels worldwide by title, nightly price range, and geographic location."
        />
      </Helmet>

      <div className="page-intro">
        <div>
          <h1 className="page-title">Curated Hotel Directory</h1>
          <p className="page-subtitle">
            Explore architectural sanctuaries and boutique properties, filter by nightly rate, or manage listings.
          </p>
        </div>

        {!loading && !error && (
          <div className="results-summary tabular-nums">
            {pagination.total} {pagination.total === 1 ? 'property' : 'properties'}
          </div>
        )}
      </div>

      <SearchFilterBar
        values={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {error && (
        <div className="state-panel state-panel-error" role="alert">
          <AlertCircle size={32} color="var(--danger)" aria-hidden="true" />
          <h2 className="state-title">Unable to load hotels</h2>
          <p className="state-text">{error}</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              dispatch(clearHotelError());
              loadHotels();
            }}
          >
            <RefreshCw size={16} aria-hidden="true" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {!error && loading && <Loader variant="grid" count={ITEMS_PER_PAGE} />}

      {!error && !loading && list.length === 0 && (
        <div className="state-panel">
          <Building2 size={36} color="var(--ink-muted)" aria-hidden="true" />
          <h2 className="state-title">
            {hasFilters ? 'No matching hotels found' : 'No hotels in directory yet'}
          </h2>
          <p className="state-text">
            {hasFilters
              ? 'Try broadening your title search or adjusting the minimum and maximum nightly price range.'
              : 'Get started by adding your first hotel property with imagery and coordinates.'}
          </p>
          {hasFilters ? (
            <button type="button" className="btn btn-secondary" onClick={handleResetFilters}>
              Clear All Filters
            </button>
          ) : (
            <Link to="/hotels/add" className="btn btn-primary">
              <Plus size={16} aria-hidden="true" />
              <span>Add First Hotel</span>
            </Link>
          )}
        </div>
      )}

      {!error && !loading && list.length > 0 && (
        <>
          <section className="hotel-grid" aria-label="Hotel listings">
            {list.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onDeleteRequest={(target) => setHotelToDelete(target)}
              />
            ))}
          </section>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}

      <ConfirmModal
        isOpen={Boolean(hotelToDelete)}
        title="Delete Hotel"
        message={
          hotelToDelete
            ? `Are you sure you want to permanently remove "${hotelToDelete.title}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Hotel"
        isLoading={submitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!submitting) setHotelToDelete(null);
        }}
      />

      <SuccessPopup
        isOpen={Boolean(successMessage)}
        title="Property Deleted"
        message={successMessage || ''}
        actionLabel="Continue"
        onClose={() => setSuccessMessage(null)}
      />
    </>
  );
}
