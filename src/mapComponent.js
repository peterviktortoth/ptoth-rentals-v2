import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './styles.css';

mapboxgl.accessToken = 'pk.eyJ1IjoicGV0ZXJ2aWt0b3J0b3RoIiwiYSI6ImNscWN5bWM1ZzA3b3kyanBhMndyZW44eTMifQ.4le2l0XBKj7DKKYzu_LgyQ';

const MapComponent = ({ coordinates, radius, listings, onCoordinateChange }) => {
  const mapContainerRef = useRef(null);
  const map = useRef(null);
  const userLocationMarker = useRef(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const listingMarkersRef = useRef([]);

  const formatPrice = (price) => {
    if (price >= 1e6) {
      return `$${(price / 1e6).toFixed(1)}M`;
    } else if (price >= 1e3) {
      return `$${(price / 1e3).toFixed(0)}k`;
    }
    return `$${price}`;
  };

  // Convert radius from miles to kilometers
  const getRadiusInKilometers = (miles) => miles * 1.60934;

  const createCircleGeoJSON = (center, radiusInKm) => {
    const points = 64;
    const coords = [];

    for (let i = 0; i < points; i++) {
      const angle = (i * 360) / points;
      const bearing = angle * Math.PI / 180;
      coords.push(destinationPoint(center, radiusInKm, bearing));
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    };
  };

  const destinationPoint = (start, distance, bearing) => {
    const R = 6371.01;
    const lat1 = start[1] * Math.PI / 180;
    const lon1 = start[0] * Math.PI / 180;
    const dByR = distance / R;

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dByR) +
      Math.cos(lat1) * Math.sin(dByR) * Math.cos(bearing));
    const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(dByR) * Math.cos(lat1),
      Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat2));

    return [lon2 * 180 / Math.PI, lat2 * 180 / Math.PI];
  };

  useEffect(() => {
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) return;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [coordinates.longitude, coordinates.latitude],
        zoom: 13.2,
        scrollZoom: true,
        doubleClickZoom: true,
        touchZoomRotate: true,
        dragRotate: true,
        keyboard: true,
      });

      // Add user location marker
      userLocationMarker.current = new mapboxgl.Marker({ draggable: true })
      .setLngLat([coordinates.longitude, coordinates.latitude])
      .addTo(map.current);

    userLocationMarker.current.on('dragend', onDragEnd);

    map.current.on('load', () => {
      setIsMapLoading(false);
      updateCircle({ lng: coordinates.longitude, lat: coordinates.latitude }, radius);
    });
  }
}, [coordinates, radius]);

const radiusRef = useRef(radius);

useEffect(() => {
  radiusRef.current = radius;
}, [radius]);

const onDragEnd = () => {
  const currentRadius = radiusRef.current;
  const newLngLat = userLocationMarker.current.getLngLat();
  updateCircle(newLngLat, currentRadius);
  onCoordinateChange(newLngLat.lat, newLngLat.lng);
};


useEffect(() => {
  if (map.current && map.current.isStyleLoaded() && userLocationMarker.current) {
    const currentLngLat = userLocationMarker.current.getLngLat();
    updateCircle(currentLngLat, radius);
  }
}, [radius]);


  useEffect(() => {
    // Function to add markers for listings
    const addListingMarkers = () => {
      // Clear existing listing markers
      listingMarkersRef.current.forEach(marker => marker.remove());
      listingMarkersRef.current = [];

      // Add new markers for listings
      listings.forEach(listing => {
        const marker = new mapboxgl.Marker({ color: "#0000FF" }) // Blue color for listings
          .setLngLat([listing.longitude, listing.latitude])
          .addTo(map.current);
        listingMarkersRef.current.push(marker);
      });
    };

    if (map.current) {
      addListingMarkers();
    }
  }, [listings]);

  useEffect(() => {
    const addListingMarkers = () => {
      listingMarkersRef.current.forEach(marker => marker.remove());
      listingMarkersRef.current = [];

      listings.forEach(listing => {
        const formattedPrice = formatPrice(listing.price);
        const customMarkerEl = createCustomMarkerElement(formattedPrice);
        const marker = new mapboxgl.Marker({ element: customMarkerEl, anchor: 'bottom' })
          .setLngLat([listing.longitude, listing.latitude])
          .addTo(map.current);
        listingMarkersRef.current.push(marker);
      });
    };

    if (map.current) {
      addListingMarkers();
    }
  }, [listings]);

  const createCustomMarkerElement = (priceLabel) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';

    // Create a div for the price label
    const priceLabelDiv = document.createElement('div');
    priceLabelDiv.className = 'price-label';
    priceLabelDiv.textContent = priceLabel;
    el.appendChild(priceLabelDiv);

    // Create a div for the marker icon
    const markerIcon = document.createElement('div');
    markerIcon.className = 'marker-icon';
    el.appendChild(markerIcon);

    return el;
  };

  const updateCircle = (newLngLat, radius) => {
    const radiusInKilometers = getRadiusInKilometers(radius);
    const circleGeoJSON = createCircleGeoJSON([newLngLat.lng, newLngLat.lat], radiusInKilometers);
  
    if (map.current.getSource('circle-source')) {
        map.current.getSource('circle-source').setData(circleGeoJSON);
    } else {
        map.current.addSource('circle-source', {
            type: 'geojson',
            data: circleGeoJSON
        });

        map.current.addLayer({
            id: 'circle-layer',
            type: 'fill',
            source: 'circle-source',
            paint: {
                'fill-color': 'blue',
                'fill-opacity': 0.3
            }
        });
    }
};
  

  return (
    <div className="map-container">
      {isMapLoading && (
        <div className="spinner-container">
          <div className="spinner-text">Loading map...</div>
          <div className="spinner"></div>
        </div>
      )}
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
};

export default MapComponent;
