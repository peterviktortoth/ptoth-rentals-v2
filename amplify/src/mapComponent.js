import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './styles.css'; // Include your styles

mapboxgl.accessToken = 'pk.eyJ1IjoicGV0ZXJ2aWt0b3J0b3RoIiwiYSI6ImNscWN5bWM1ZzA3b3kyanBhMndyZW44eTMifQ.4le2l0XBKj7DKKYzu_LgyQ';

const MapComponent = ({ coordinates, radius }) => {
  const mapContainerRef = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  // Convert radius from miles to meters
  const getRadiusInMeters = (miles) => miles * 1609.34;

  useEffect(() => {
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) return;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [coordinates.longitude, coordinates.latitude],
        zoom: 15.2,
        scrollZoom: false,
        doubleClickZoom: false,
        touchZoomRotate: false,
        dragRotate: false,
        keyboard: false
      });

      marker.current = new mapboxgl.Marker()
        .setLngLat([coordinates.longitude, coordinates.latitude])
        .addTo(map.current);

      // Add or update the circle layer when the style is fully loaded
      map.current.on('styledata', () => {
        if (map.current.getLayer('circle-radius')) {
          map.current.setPaintProperty('circle-radius', 'circle-radius', getRadiusInMeters(radius));
        } else {
          map.current.addLayer({
            id: 'circle-radius',
            type: 'circle',
            source: {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [coordinates.longitude, coordinates.latitude]
                }
              }
            },
            paint: {
              'circle-radius': getRadiusInMeters(radius),
              'circle-color': 'blue',
              'circle-opacity': 0.5
            }
          });
        }
      });

      map.current.on('load', () => {
        setIsMapLoading(false);
      });
    }
  }, [coordinates]);

  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      const newZoomLevel = 15.2 - (radius - 0.1) * 6;
      map.current.easeTo({
        zoom: newZoomLevel,
        duration: 1000, // Duration of the animation in milliseconds
        essential: true
      });
    }
  }, [radius]);
  

  return (
    <div className="map-container">
      {isMapLoading && (
        <div className="spinner-container">
          <div className="spinner-text">Loading map</div>
          <div className="spinner"></div>
        </div>
      )}
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
};

export default MapComponent;
