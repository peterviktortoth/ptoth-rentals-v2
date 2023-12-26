import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './styles.css';

mapboxgl.accessToken = 'pk.eyJ1IjoicGV0ZXJ2aWt0b3J0b3RoIiwiYSI6ImNscWN5bWM1ZzA3b3kyanBhMndyZW44eTMifQ.4le2l0XBKj7DKKYzu_LgyQ';

const MapComponent = ({ coordinates, radius }) => {
  const mapContainerRef = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

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

      marker.current = new mapboxgl.Marker()
        .setLngLat([coordinates.longitude, coordinates.latitude])
        .addTo(map.current);

      map.current.on('load', () => {
        setIsMapLoading(false);
        updateCircle();
      });
    }
  }, [coordinates]);

  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      updateCircle();
    }
  }, [radius]);

  const updateCircle = () => {
    const radiusInKilometers = getRadiusInKilometers(radius);
    const circleGeoJSON = createCircleGeoJSON([coordinates.longitude, coordinates.latitude], radiusInKilometers);
  
    if (map.current.getSource('circle-source')) {
      animateCircleTransition(circleGeoJSON, 500); // 1000 milliseconds for transition
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
          'fill-opacity': 0.5
        }
      });
    }
  };
  
  const animateCircleTransition = (finalGeoJSON, duration) => {
    const startTime = performance.now();
    const initialGeoJSON = map.current.getSource('circle-source')._data;
  
    const animate = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const t = Math.min(1, elapsedTime / duration); // t ranges from 0 to 1
  
      const interpolatedGeoJSON = interpolateGeoJSON(initialGeoJSON, finalGeoJSON, t);
      map.current.getSource('circle-source').setData(interpolatedGeoJSON);
  
      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
  
    requestAnimationFrame(animate);
  };
  
  const interpolateGeoJSON = (initialGeoJSON, finalGeoJSON, t) => {
    const interpolated = {
      ...initialGeoJSON,
      geometry: {
        ...initialGeoJSON.geometry,
        coordinates: [initialGeoJSON.geometry.coordinates[0].map((coord, index) => {
          const finalCoord = finalGeoJSON.geometry.coordinates[0][index];
          return [
            coord[0] + t * (finalCoord[0] - coord[0]),
            coord[1] + t * (finalCoord[1] - coord[1])
          ];
        })]
      }
    };
    return interpolated;
    
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
