import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Navigation } from 'lucide-react';

interface HotelMapProps {
  title: string;
  latitude: number;
  longitude: number;
  price: number;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const hotelPinIcon = L.divIcon({
  className: 'custom-hotel-pin',
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#1e3a34;border:3px solid #ffffff;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,0.35);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const userPinIcon = L.divIcon({
  className: 'custom-user-pin',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(37,99,235,0.45);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

function calculateDistanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function MapViewportController({
  hotelCoords,
  userCoords,
}: {
  hotelCoords: Coordinates;
  userCoords: Coordinates | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (userCoords) {
      const bounds = L.latLngBounds(
        [hotelCoords.lat, hotelCoords.lng],
        [userCoords.lat, userCoords.lng]
      );
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 13 });
    } else {
      map.setView([hotelCoords.lat, hotelCoords.lng], 13);
    }
  }, [map, hotelCoords.lat, hotelCoords.lng, userCoords]);

  return null;
}

export default function HotelMap({
  title,
  latitude,
  longitude,
  price,
}: HotelMapProps) {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>(
    'Click "Show My Location" to display your position alongside this hotel.'
  );
  const [locating, setLocating] = useState(false);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Browser geolocation is unavailable on this device.');
      return;
    }

    setLocating(true);
    setGeoStatus('Requesting your location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setLocating(false);
        const distanceKm = calculateDistanceKm(coords, {
          lat: latitude,
          lng: longitude,
        });
        setGeoStatus(
          `Your location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}) is ${distanceKm.toFixed(1)} km from ${title}.`
        );
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus('Location permission was declined. Showing hotel marker only.');
        } else {
          setGeoStatus('Unable to retrieve your current location.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (!navigator.geolocation || !navigator.permissions) return;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((permission) => {
        if (permission.state === 'granted') {
          requestUserLocation();
        }
      })
      .catch(() => {
        // Permissions API optional across browsers
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  return (
    <section className="detail-map-section" aria-label="Hotel location map">
      <div className="map-header">
        <div>
          <h2 className="map-heading">Property Location</h2>
          <p className="map-status-note">{geoStatus}</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={requestUserLocation}
            disabled={locating}
          >
            <Crosshair size={15} aria-hidden="true" />
            <span>{locating ? 'Locating...' : 'Show My Location'}</span>
          </button>
          <a
            href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <Navigation size={15} aria-hidden="true" />
            <span>OpenStreetMap</span>
          </a>
        </div>
      </div>

      <div className="map-container-frame">
        <MapContainer
          center={[latitude, longitude]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewportController
            hotelCoords={{ lat: latitude, lng: longitude }}
            userCoords={userLocation}
          />

          <Marker position={[latitude, longitude]} icon={hotelPinIcon}>
            <Popup>
              <strong>{title}</strong>
              <br />${Number(price).toLocaleString()} / night
              <br />
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </Popup>
          </Marker>

          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userPinIcon}
            >
              <Popup>
                <strong>Your Location</strong>
                <br />
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </section>
  );
}
