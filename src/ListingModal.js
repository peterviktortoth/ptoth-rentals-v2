function ListingModal({ listing, onClose }) {
  if (!listing) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
      <h2>{listing.address.split(',')[0]}</h2>
        <div className="modal-close" onClick={onClose}>Close</div>
        {listing.imgSrc && <img src={listing.imgSrc} alt={`Image for ${listing.address}`} />}
        <ul>
          <li><strong>Number of Bedrooms:</strong> {listing.bedrooms}</li>
          <li><strong>Price:</strong> ${listing.price.toLocaleString('en-US')}</li>
          <li>
            <a href={`https://www.zillow.com${listing.detailUrl}`} target="_blank" rel="noopener noreferrer">View Listing</a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ListingModal;
