import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AlertCircle, Crosshair, ImagePlus } from 'lucide-react';
import type { Hotel } from '../types/hotel';
import { resolveAssetUrl } from '../api/hotelApi';

interface HotelFormProps {
  initialHotel?: Hotel | null;
  isEditMode: boolean;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

interface FormValues {
  title: string;
  description: string;
  latitude: string;
  longitude: string;
  price: string;
}

interface FormErrors {
  image?: string;
  title?: string;
  description?: string;
  latitude?: string;
  longitude?: string;
  price?: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

export default function HotelForm({
  initialHotel,
  isEditMode,
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: HotelFormProps) {
  const [values, setValues] = useState<FormValues>({
    title: initialHotel?.title ?? '',
    description: initialHotel?.description ?? '',
    latitude: initialHotel ? String(initialHotel.latitude) : '',
    longitude: initialHotel ? String(initialHotel.longitude) : '',
    price: initialHotel ? String(initialHotel.price) : '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(
    initialHotel?.imageUrl ? resolveAssetUrl(initialHotel.imageUrl) : ''
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [locating, setLocating] = useState(false);
  const [geoNote, setGeoNote] = useState<string | null>(null);

  useEffect(() => {
    if (initialHotel) {
      setValues({
        title: initialHotel.title,
        description: initialHotel.description,
        latitude: String(initialHotel.latitude),
        longitude: String(initialHotel.longitude),
        price: String(initialHotel.price),
      });
      setPreviewUrl(resolveAssetUrl(initialHotel.imageUrl));
    }
  }, [initialHotel]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateField = (
    field: keyof FormValues,
    val: string
  ): string | undefined => {
    const trimmed = val.trim();
    switch (field) {
      case 'title':
        if (!trimmed) return 'Title is required.';
        if (trimmed.length < 3 || trimmed.length > 100) {
          return 'Title must be between 3 and 100 characters.';
        }
        return undefined;
      case 'description':
        if (!trimmed) return 'Description is required.';
        if (trimmed.length < 10) {
          return 'Description must be at least 10 characters.';
        }
        return undefined;
      case 'latitude': {
        if (!trimmed) return 'Latitude is required.';
        const num = Number(trimmed);
        if (!Number.isFinite(num) || num < -90 || num > 90) {
          return 'Latitude must be a number between -90 and 90.';
        }
        return undefined;
      }
      case 'longitude': {
        if (!trimmed) return 'Longitude is required.';
        const num = Number(trimmed);
        if (!Number.isFinite(num) || num < -180 || num > 180) {
          return 'Longitude must be a number between -180 and 180.';
        }
        return undefined;
      }
      case 'price': {
        if (!trimmed) return 'Price is required.';
        const num = Number(trimmed);
        if (!Number.isFinite(num) || num <= 0) {
          return 'Price must be a number greater than 0.';
        }
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const validateAll = (): boolean => {
    const nextErrors: FormErrors = {
      title: validateField('title', values.title),
      description: validateField('description', values.description),
      latitude: validateField('latitude', values.latitude),
      longitude: validateField('longitude', values.longitude),
      price: validateField('price', values.price),
    };

    if (!isEditMode && !imageFile) {
      nextErrors.image = 'Hotel image is required (JPG, PNG, or WebP, max 2MB).';
    } else if (imageFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        nextErrors.image = 'Only JPG, PNG, and WebP images are allowed.';
      } else if (imageFile.size > MAX_IMAGE_BYTES) {
        nextErrors.image = 'Image file size must not exceed 2MB.';
      }
    }

    const filtered: FormErrors = {};
    (Object.keys(nextErrors) as Array<keyof FormErrors>).forEach((key) => {
      if (nextErrors[key]) {
        filtered[key] = nextErrors[key];
      }
    });

    setErrors(filtered);
    return Object.keys(filtered).length === 0;
  };

  const handleFieldChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const nextErr = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: nextErr }));
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: 'Invalid format. Please choose a JPG, PNG, or WebP image.',
      }));
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((prev) => ({
        ...prev,
        image: 'Image exceeds 2MB limit. Please choose a smaller file.',
      }));
      return;
    }

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setImageFile(file);
    setPreviewUrl(objectUrl);
    setErrors((prev) => ({ ...prev, image: undefined }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoNote('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setGeoNote(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setValues((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setErrors((prev) => ({
          ...prev,
          latitude: undefined,
          longitude: undefined,
        }));
        setLocating(false);
        setGeoNote('Coordinates filled from your current location.');
      },
      (err) => {
        setLocating(false);
        setGeoNote(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was denied. Please enter coordinates manually.'
            : 'Unable to determine your current location.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateAll()) return;

    const formData = new FormData();
    formData.append('title', values.title.trim());
    formData.append('description', values.description.trim());
    formData.append('latitude', String(Number(values.latitude)));
    formData.append('longitude', String(Number(values.longitude)));
    formData.append('price', String(Number(values.price)));
    if (imageFile) {
      formData.append('image', imageFile);
    }

    await onSubmit(formData);
  };

  return (
    <form className="hotel-form-card" onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="alert-banner" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="form-grid">
        {/* Image Upload */}
        <div className="field-group">
          <label htmlFor="hotel-image-input" className="field-label">
            Property Image {isEditMode ? '(Optional on edit)' : '*'}
          </label>
          <div className={`upload-zone ${errors.image ? 'has-error' : ''}`}>
            {previewUrl && (
              <div className="upload-preview-frame">
                <img
                  src={previewUrl}
                  alt={values.title ? `Preview of ${values.title}` : 'Selected hotel preview'}
                  className="upload-preview-img"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="upload-controls">
              <div>
                <input
                  id="hotel-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={handleImageChange}
                  aria-invalid={Boolean(errors.image)}
                  aria-describedby="hotel-image-hint hotel-image-error"
                  className="sr-only"
                />
                <label htmlFor="hotel-image-input" className="btn btn-secondary btn-sm">
                  <ImagePlus size={16} aria-hidden="true" />
                  <span>{previewUrl ? 'Replace Image' : 'Choose Image'}</span>
                </label>
              </div>
              <span id="hotel-image-hint" className="field-hint">
                JPG, PNG, or WebP up to 2MB
              </span>
            </div>
          </div>
          {errors.image && (
            <span id="hotel-image-error" className="field-error" role="alert">
              {errors.image}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="field-group">
          <label htmlFor="hotel-title-input" className="field-label">
            Hotel Title *
          </label>
          <input
            id="hotel-title-input"
            type="text"
            className="input-control"
            placeholder="e.g. Komorebi Cedar Ryokan"
            maxLength={100}
            value={values.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            onBlur={() =>
              setErrors((prev) => ({
                ...prev,
                title: validateField('title', values.title),
              }))
            }
            aria-invalid={Boolean(errors.title)}
            aria-describedby="hotel-title-error"
          />
          {errors.title && (
            <span id="hotel-title-error" className="field-error" role="alert">
              {errors.title}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="field-group">
          <label htmlFor="hotel-description-input" className="field-label">
            Description *
          </label>
          <textarea
            id="hotel-description-input"
            className="textarea-control"
            placeholder="Describe the architecture, setting, suites, and guest experience (minimum 10 characters)..."
            value={values.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            onBlur={() =>
              setErrors((prev) => ({
                ...prev,
                description: validateField('description', values.description),
              }))
            }
            aria-invalid={Boolean(errors.description)}
            aria-describedby="hotel-description-error"
          />
          {errors.description && (
            <span id="hotel-description-error" className="field-error" role="alert">
              {errors.description}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="field-group">
          <label htmlFor="hotel-price-input" className="field-label">
            Nightly Rate (USD) *
          </label>
          <input
            id="hotel-price-input"
            type="number"
            min="0.01"
            step="any"
            className="input-control tabular-nums"
            placeholder="e.g. 420"
            value={values.price}
            onChange={(e) => handleFieldChange('price', e.target.value)}
            onBlur={() =>
              setErrors((prev) => ({
                ...prev,
                price: validateField('price', values.price),
              }))
            }
            aria-invalid={Boolean(errors.price)}
            aria-describedby="hotel-price-error"
          />
          {errors.price && (
            <span id="hotel-price-error" className="field-error" role="alert">
              {errors.price}
            </span>
          )}
        </div>

        {/* Coordinates */}
        <div className="form-grid form-grid-two">
          <div className="field-group">
            <label htmlFor="hotel-latitude-input" className="field-label">
              Latitude (-90 to 90) *
            </label>
            <input
              id="hotel-latitude-input"
              type="number"
              step="any"
              min="-90"
              max="90"
              className="input-control tabular-nums"
              placeholder="e.g. 35.0037"
              value={values.latitude}
              onChange={(e) => handleFieldChange('latitude', e.target.value)}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  latitude: validateField('latitude', values.latitude),
                }))
              }
              aria-invalid={Boolean(errors.latitude)}
              aria-describedby="hotel-latitude-error"
            />
            {errors.latitude && (
              <span id="hotel-latitude-error" className="field-error" role="alert">
                {errors.latitude}
              </span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="hotel-longitude-input" className="field-label">
              Longitude (-180 to 180) *
            </label>
            <input
              id="hotel-longitude-input"
              type="number"
              step="any"
              min="-180"
              max="180"
              className="input-control tabular-nums"
              placeholder="e.g. 135.7785"
              value={values.longitude}
              onChange={(e) => handleFieldChange('longitude', e.target.value)}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  longitude: validateField('longitude', values.longitude),
                }))
              }
              aria-invalid={Boolean(errors.longitude)}
              aria-describedby="hotel-longitude-error"
            />
            {errors.longitude && (
              <span id="hotel-longitude-error" className="field-error" role="alert">
                {errors.longitude}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleUseMyLocation}
            disabled={locating}
          >
            <Crosshair size={15} aria-hidden="true" />
            <span>{locating ? 'Detecting location...' : 'Use My Current Location'}</span>
          </button>
          {geoNote && <span className="field-hint">{geoNote}</span>}
        </div>
      </div>

      <div className="form-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting
            ? isEditMode
              ? 'Saving Changes...'
              : 'Creating Hotel...'
            : isEditMode
            ? 'Save Changes'
            : 'Add Hotel'}
        </button>
      </div>
    </form>
  );
}
