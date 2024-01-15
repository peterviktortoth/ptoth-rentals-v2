import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';

function ResultItem({ item, index, expandedSections, handleToggle, listings, handleListingClick }) {
  const resultsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(listings.length / resultsPerPage);
  const isExpanded = expandedSections.includes(index);

  const handlers = useSwipeable({
    onSwipedLeft: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1)),
    onSwipedRight: () => setCurrentPage((prev) => Math.max(prev - 1, 0)),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const paginatedListings = listings.slice(currentPage * resultsPerPage, (currentPage + 1) * resultsPerPage);

  const { bedrooms, average_price, numberOfResults } = item;


  return (
    <li {...handlers} className={`result-item ${isExpanded ? 'expanded' : ''}`} key={index}>
      <input 
        type="checkbox"
        className="toggle"
        id={`toggle-${index}`}
        checked={isExpanded}
        onChange={() => handleToggle(index)}
      />
      <label htmlFor={`toggle-${index}`} className="category-title">
  <span className="title-text">
    {bedrooms === 'Unknown' ? 'Studio' : `${bedrooms} bedroom`}
    <br />
    Average price: ${average_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
    <br />
    Number of results: {numberOfResults}
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
      {/* Conditionally render page counter */}
      {isExpanded && (
        <div className="pagination-indicators">
          <span>{`Page ${currentPage + 1} of ${totalPages}`}</span>
        </div>
      )}
    </li>
  );
}

export default ResultItem;
