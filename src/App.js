import React, { useState, useEffect } from 'react';
import './styles.css';
import MapComponent from './mapComponent';
import sampleResponse from './sampleResponse'; // Import your sample response

const API_ENDPOINT = 'https://hps0363ra2.execute-api.us-east-2.amazonaws.com/dev/rentalInfo'; // Comment out if not using the live API

function App() {
  const [radius, setRadius] = useState(0.1); // Initial radius value
  const [averagePrices, setAveragePrices] = useState([]); // State for average prices
  const [listings, setListings] = useState([]); // State for individual listings
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState({ latitude: null, longitude: null });
  const [expandedSections, setExpandedSections] = useState({}); // State for expandable sections
  const [statusType, setStatusType] = useState('ForRent'); // New state for status type


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
    console.log("calculateRentalPrices called");

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
      const response = await fetch(`${API_ENDPOINT}?latitude=${userCoordinates.latitude}&longitude=${userCoordinates.longitude}&radius=${radius}&statusType=${statusType}`, {
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
      setExpandedSection(null); // Reset the expanded section to collapse all sections
    }
};


  const toggleSection = (bedrooms) => {
    setExpandedSections(prevState => {
      const newState = {
        ...prevState,
        [bedrooms]: !prevState[bedrooms]
      };

      console.log("Expanded sections updated to:", newState);
      return newState;
    });
  };

  const handleIncrement = () => {
    setRadius(prevRadius => {
      const newRadius = Math.min(prevRadius + 0.1, 5);
      console.log("Radius incremented to:", newRadius);
      return newRadius;
    });
  };

  const handleDecrement = () => {
    setRadius(prevRadius => {
      const newRadius = Math.max(prevRadius - 0.1, 0.1);
      console.log("Radius decremented to:", newRadius);
      return newRadius;
    });
  };

  const [expandedSection, setExpandedSection] = useState(null);

  const handleToggle = (index) => {
    setExpandedSection(prevIndex => (prevIndex === index ? null : index));
  };
  
  return (
    <div className="container">
      <h1 className="title">Can I Afford to Live Here?</h1>
      <p className="instructions">Enter a search radius to see nearby properties</p>
      <div className="wrapper">
        <div className="number-stepper-container">
          <button id="decrement" onClick={handleDecrement}>-</button>
          <div className="input-with-suffix">
            <input type="number" value={radius.toFixed(1)} readOnly />
            <span className="suffix">miles</span>
          </div>
          <button id="increment" onClick={handleIncrement}>+</button>
        </div>
        <div className="toggle-button-container">
          <span className="toggle-label">Rent</span>
          <div className="toggle-button-cover">
            <div className="button r" id="button-1">
              <input type="checkbox" 
                    className="checkbox" 
                    checked={statusType === 'ForSale'} 
                    onChange={() => setStatusType(statusType === 'ForRent' ? 'ForSale' : 'ForRent')} />
              <div className="knobs"></div>
              <div className="layer"></div>
            </div>
          </div>
          <span className="toggle-label">Buy</span>
        </div>
        <button type="button" onClick={calculateRentalPrices} className="form-button">
          Show Prices
        </button>
      </div>
  
      {loading ? (
        <div className="spinner-wrapper">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div>
          {error && <div className="error-message">{error}</div>}
          <ul className="results-list">
            {averagePrices && averagePrices.map((item, index) => (
              <li key={index} className="result-item">
                <input 
                  type="radio" 
                  name="accordion" 
                  id={`toggle-${index}`} 
                  className="toggle" 
                  checked={expandedSection === index}
                  onChange={() => handleToggle(index)}
                />
                <label htmlFor={`toggle-${index}`} className="category-title">
                  Average {item.bedrooms === 'Unknown' ? 'Studio' : `${item.bedrooms} bedroom`}  <span className="listing-price">${item.average_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </label>
                <div className={`listing-container ${expandedSection === index ? 'expanded' : ''}`}>
                {listings && listings.filter(listing => {
                  const listingBedrooms = String(listing.bedrooms);
                  const itemBedrooms = String(item.bedrooms);
                  return listingBedrooms === itemBedrooms;
                }).map((listing, listingIndex) => (
                  <div key={listingIndex} className="listing-item">
                    <a 
                      href={`https://www.zillow.com${listing.detailUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="listing-item-link"
                    >
                      {listing.address.split(',')[0]}
                    </a>
                    <span className="listing-price"> ${listing.price.toLocaleString('en-US')}</span>
                  </div>
                ))}
                </div>
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
