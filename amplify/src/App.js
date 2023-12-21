import React, { useState, useEffect } from 'react';
import './styles.css';
import MapComponent from './mapComponent';

const API_ENDPOINT = 'https://hps0363ra2.execute-api.us-east-2.amazonaws.com/dev/rentalInf';

function App() {
  const [radius, setRadius] = useState(0.1); // Initial radius value
  const [averagePrices, setAveragePrices] = useState([]); // State for average prices
  const [listings, setListings] = useState([]); // State for individual listings
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState({ latitude: null, longitude: null });
  const [expandedSections, setExpandedSections] = useState({}); // State for expandable sections

  useEffect(() => {
    const getCurrentPosition = () => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
    };

    const fetchCoordinates = async () => {
      try {
        const position = await getCurrentPosition();
        setUserCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting user location:', error);
        setError('Unable to fetch user location.');
      }
    };

    fetchCoordinates();
  }, []);

  const calculateRentalPrices = async () => {
    if (isNaN(radius) || radius <= 0) {
      setError('Please enter a valid positive number for the radius.');
      setAveragePrices([]);
      setListings([]);
      return;
    } else {
      setError('');
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINT}?latitude=${userCoordinates.latitude}&longitude=${userCoordinates.longitude}&radius=${radius}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rental prices: ${response.statusText}`);
      }

      const data = await response.json();
      setAveragePrices(data.averagePrices);
      setListings(data.listings);
    } catch (error) {
      console.error(`Error: ${error}`);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (bedrooms) => {
    setExpandedSections(prevState => ({
      ...prevState,
      [bedrooms]: !prevState[bedrooms]
    }));
  };

  const handleIncrement = () => {
    setRadius(prevRadius => Math.min(prevRadius + 0.1, 5)); // Increment, max 5
  };

  const handleDecrement = () => {
    setRadius(prevRadius => Math.max(prevRadius - 0.1, 0.1)); // Decrement, min 0.1
  };

  return (
    <div className="container">
      <h1 className="title">Can I Afford to Live Here?</h1>
      <p className="instructions">Enter a radius in miles to search active rental listings</p>
      <div className="wrapper">
        <div className="number-stepper-container">
          <button id="decrement" onClick={handleDecrement}>-</button>
          <div className="input-with-suffix">
            <input type="number" value={radius.toFixed(1)} readOnly />
            <span className="suffix">miles</span>
          </div>
          <button id="increment" onClick={handleIncrement}>+</button>
        </div>
        <button type="button" onClick={calculateRentalPrices} className="form-button">
          Show Average Rental Prices
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div>
          {error && <div className="error-message">{error}</div>}
          <ul className="results-list">
            {averagePrices.map((item, index) => (
              <li key={index} className="result-item">
                <div className="category-title" onClick={() => toggleSection(item.bedrooms)}>
                  Average {item.bedrooms === 'Unknown' ? 'Studio' : `${item.bedrooms} bedroom`} rental - ${item.average_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
                {expandedSections[item.bedrooms] && (
                  <ul className="listings-list">
                    {listings.filter(listing => listing.bedrooms === item.bedrooms).map((listing, listingIndex) => (
                      <li key={listingIndex} className="listing-item">
                        {listing.propertyType} - {listing.formattedAddress} - ${listing.price.toLocaleString('en-US')}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <MapComponent coordinates={userCoordinates} radius={parseFloat(radius)} />
    </div>
  );
}

export default App;
