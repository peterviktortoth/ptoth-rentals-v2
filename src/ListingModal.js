import React, { useEffect, useRef } from 'react';
import ReactGA4 from 'react-ga4';

function ListingModal({ listing, onClose }) {
  const modalRef = useRef(null);

  // Effect for Google Analytics event tracking
  useEffect(() => {
    if (listing) {
      ReactGA4.event({
        category: 'Listing Modal',
        action: 'Open',
        label: listing.address
      });
    }
  }, [listing]);

  // Effect for handling click outside of modal
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!listing) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal" ref={modalRef}>
        <h2>{listing.address.split(',')[0]}</h2>
        {listing.imgSrc && <img src={listing.imgSrc} alt={`Image for ${listing.address}`} />}
        <ul>
          <li><strong>Number of Bedrooms:</strong> {listing.bedrooms}</li>
          <li><strong>Price:</strong> ${listing.price.toLocaleString('en-US')}</li>
          <div>
          <button
              className="view-listing-button"
              onClick={(e) => {
                e.preventDefault();

                // Create a link element
                const link = document.createElement('a');
                link.href = `https://www.zillow.com${listing.detailUrl}`;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';

                // Simulate a click on the link
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                ReactGA4.event({
                  category: 'Listing Modal',
                  action: 'View Listing Click',
                  label: listing.address
                });
              }}
            >
              View Listing
            </button>

          </div>
        </ul>
      </div>
    </div>
  );  
}

export default ListingModal;
