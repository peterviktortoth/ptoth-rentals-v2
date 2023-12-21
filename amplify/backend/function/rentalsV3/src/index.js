const fetch = require('node-fetch');

exports.handler = async (event) => {
  const latitude = event.queryStringParameters.latitude;
  const longitude = event.queryStringParameters.longitude;
  const radius = event.queryStringParameters.radius || '0.1'; // Default radius

  if (!latitude || !longitude) {
    throw new Error("Coordinates not provided or invalid.");
  }

  console.log(`Current Location: Latitude ${latitude}, Longitude ${longitude}`);

  const url = `https://api.rentcast.io/v1/listings/rental/long-term?latitude=${latitude}&longitude=${longitude}&radius=${radius}&status=Active&limit=500`;
  const headers = {
    "accept": "application/json",
    "X-Api-Key": "5fe60f24d1c04d22a89cc5e1583a119f", // Use environment variables or a secure method to store API keys
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }
  const data = await response.json();

  const rentalPrices = {};
  const listings = []; // Array to hold individual listings with selected details

  data.forEach(property => {
    const bedrooms = property.bedrooms || "Unknown";
    const price = property.price || 0;

    // Aggregate prices for average calculation
    if (!rentalPrices[bedrooms]) {
      rentalPrices[bedrooms] = [price];
    } else {
      rentalPrices[bedrooms].push(price);
    }

    // Add each property to the listings array with specific details
    listings.push({
      id: property.id,
      propertyType: property.propertyType,
      price: price,
      formattedAddress: property.formattedAddress,
      bedrooms: bedrooms
      // Include other relevant details here
    });
  });

  const averagePrices = Object.entries(rentalPrices).map(([bedrooms, prices]) => {
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return { bedrooms, average_price: averagePrice };
  });

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // Enable CORS for all domains
    },
    body: JSON.stringify({ averagePrices, listings }), // Include both average prices and listings
  };
};
