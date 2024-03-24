import React, { useState, useEffect } from 'react';
import './styles.css';
import MapComponent from './mapComponent';
import ReactGA4 from 'react-ga4';
import ListingModal from './ListingModal';
import ResultItem from './resultItem';

const API_ENDPOINT = 'https://hps0363ra2.execute-api.us-east-2.amazonaws.com/dev/rentalInfo';

function App() {
  const [radius, setRadius] = useState(0.1);
  const [averagePrices, setAveragePrices] = useState([]);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState({ latitude: null, longitude: null });
  const [expandedSections, setExpandedSections] = useState([]);
  const [statusType, setStatusType] = useState('ForRent');
  const [selectedListing, setSelectedListing] = useState(null);

  useEffect(() => {
    ReactGA4.initialize('G-72LH4NNPY2');
    ReactGA4.send('pageview');
  }, []);

  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        setUserCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting user location:', error);
        setError('Unable to fetch user location');
      }
    };

    fetchCoordinates();
  }, []);

  const calculateRentalPrices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINT}?latitude=${userCoordinates.latitude}&longitude=${userCoordinates.longitude}&radius=${radius}&statusType=${statusType}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setAveragePrices(data.averagePrices);
      setListings(data.listings);
      setError('');
    } catch (error) {
      console.error(`Error: ${error}`);
      setError('Failed to fetch rental prices');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (bedrooms) => {
    setExpandedSections(prev => (prev.includes(bedrooms) ? prev.filter(b => b !== bedrooms) : [...prev, bedrooms]));
  };

  return (
    <div className="container">
      <h1 className="title">Can I Afford to Live Here?</h1>
      <div className="wrapper">
        <div className="number-stepper-container">
          <button id="decrement" onClick={() => setRadius(Math.max(radius - 0.1, 0.1))}>-</button>
          <div className="input-with-suffix">
            <input type="number" value={radius.toFixed(1)} readOnly />
            <span className="suffix">miles</span>
          </div>
          <button id="increment" onClick={() => setRadius(Math.min(radius + 0.1, 5))}>+</button>
        </div>
        <div className="toggle-button-container">
          <span className="toggle-label">Rent</span>
          <div className="toggle-button-cover">
            <div className="button r" id="button-1">
              <input type="checkbox" className="checkbox" checked={statusType === 'ForSale'} onChange={() => setStatusType(statusType === 'ForRent' ? 'ForSale' : 'ForRent')} />
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
        <div className="loading-spinner"></div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div>
          <ul className="results-list">
            {averagePrices.map((item) => {
              const relatedListings = listings.filter(listing => String(listing.bedrooms) === String(item.bedrooms) && expandedSections.includes(item.bedrooms));
              return (
                <ResultItem
                  key={item.bedrooms}
                  item={item}
                  expandedSections={expandedSections.includes(item.bedrooms)}
                  handleToggle={() => handleToggle(item.bedrooms)}
                  listings={relatedListings}
                  handleListingClick={setSelectedListing}
                />
              );
            })}
          </ul>
          <MapComponent 
            coordinates={userCoordinates} 
            radius={parseFloat(radius)} 
            listings={listings} // Adjust according to how you want to use displayedListings or listings
            onCoordinateChange={(lat, lng) => setUserCoordinates({ latitude: lat, longitude: lng })}
          />
          {selectedListing && (
            <ListingModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
          )}
        </div>
      )}
    </div>
  );
          }  

export default App;