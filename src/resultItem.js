import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';

function ResultItem({ item, expandedSections, handleToggle, listings, handleListingClick }) {
  const resultsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(listings.length / resultsPerPage);
  // Adjusted to check for expansion based on bedrooms, not index
  const isExpanded = expandedSections;

  const handlers = useSwipeable({
    onSwipedLeft: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1)),
    onSwipedRight: () => setCurrentPage((prev) => Math.max(prev - 1, 0)),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const paginatedListings = listings.slice(currentPage * resultsPerPage, (currentPage + 1) * resultsPerPage);

  const { bedrooms, average_price, numberOfResults } = item;

  return (
    <li {...handlers} className={`result-item ${isExpanded ? 'expanded' : ''}`}>
      <input 
        type="checkbox"
        className="toggle"
        id={`toggle-${bedrooms}`} // Use bedrooms as part of the ID for uniqueness
        checked={isExpanded}
        onChange={() => handleToggle(bedrooms)} // Pass bedrooms to toggle function
      />
      <label htmlFor={`toggle-${bedrooms}`} className="category-title"> {/* Adjusted for bedrooms */}
        <span className="title-text">
        {bedrooms === 'Unknown' ? 'Studio' : `${bedrooms} bedroom`}
        <br />
        Average price -  <span className="price-text">${average_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
        <br />
        </span>

      </label>

      <div className={`listing-container ${isExpanded ? 'expanded' : ''}`}>
        {paginatedListings.map((listing, listingIndex) => (
          <div key={listingIndex} className="listing-item" onClick={() => handleListingClick(listing)}>
            <div className="listing-content">
              {listing.address.split(',')[0]}
              <span className="listing-price"> ${listing.price.toLocaleString('en-US')}</span>
            </div>
            <span className="listing-icon">+</span>
          </div>
        ))}
      </div>
      {isExpanded && (
        <div className="pagination-indicators">
          <span>{`Page ${currentPage + 1} of ${totalPages}`}</span>
        </div>
      )}
    </li>
  );
}

export default ResultItem;
