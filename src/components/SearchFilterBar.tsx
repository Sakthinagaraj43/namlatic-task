import { useEffect, useRef, useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';

export interface SearchFilterValues {
  search: string;
  minPrice: string;
  maxPrice: string;
}

interface SearchFilterBarProps {
  values: SearchFilterValues;
  onChange: (nextValues: SearchFilterValues) => void;
  onReset: () => void;
}

export default function SearchFilterBar({
  values,
  onChange,
  onReset,
}: SearchFilterBarProps) {
  const [searchInput, setSearchInput] = useState(values.search);
  const latestValuesRef = useRef(values);
  latestValuesRef.current = values;

  useEffect(() => {
    setSearchInput(values.search);
  }, [values.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== latestValuesRef.current.search) {
        onChange({
          ...latestValuesRef.current,
          search: searchInput,
        });
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput, onChange]);

  const hasActiveFilters =
    searchInput.trim() !== '' ||
    values.minPrice.trim() !== '' ||
    values.maxPrice.trim() !== '';

  return (
    <section className="filter-bar" aria-label="Search and filter hotels">
      <div className="field-group filter-search-group">
        <label htmlFor="hotel-search-input" className="field-label">
          Search by hotel name
        </label>
        <div className="input-with-icon">
          <Search size={16} className="input-icon" aria-hidden="true" />
          <input
            id="hotel-search-input"
            type="search"
            className="input-control"
            placeholder="Search Kyoto, Cliffside, Riad..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="min-price-input" className="field-label">
          Min price ($)
        </label>
        <input
          id="min-price-input"
          type="number"
          min="0"
          step="1"
          className="input-control tabular-nums"
          placeholder="0"
          value={values.minPrice}
          onChange={(e) =>
            onChange({
              ...values,
              search: searchInput,
              minPrice: e.target.value,
            })
          }
        />
      </div>

      <div className="field-group">
        <label htmlFor="max-price-input" className="field-label">
          Max price ($)
        </label>
        <input
          id="max-price-input"
          type="number"
          min="0"
          step="1"
          className="input-control tabular-nums"
          placeholder="1000"
          value={values.maxPrice}
          onChange={(e) =>
            onChange({
              ...values,
              search: searchInput,
              maxPrice: e.target.value,
            })
          }
        />
      </div>

      <div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setSearchInput('');
            onReset();
          }}
          disabled={!hasActiveFilters}
          style={{ width: '100%' }}
        >
          <RotateCcw size={15} aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>
    </section>
  );
}
