const fetch = require('node-fetch');

// Function to generate a polygon based on the center coordinates and radius
function generatePolygon(latitude, longitude, radius, numberOfVertices = 30) {
  const earthRadiusInKilometers = 6371;
  let coordinates = [];
  for (let i = 0; i < numberOfVertices; i++) {
    const angle = (i * 2 * Math.PI) / numberOfVertices;
    const latRadians = (latitude * Math.PI) / 180;
    const lonRadians = (longitude * Math.PI) / 180;
    const dX = radius * Math.cos(angle) / earthRadiusInKilometers;
    const dY = radius * Math.sin(angle) / earthRadiusInKilometers;
    const newLat = latRadians + dX;
    const newLon = lonRadians + (dY / Math.cos(latRadians));
    coordinates.push(`${newLon * 180 / Math.PI} ${newLat * 180 / Math.PI}`);
  }

  // Repeat the first coordinate at the end to close the polygon
  if (coordinates.length > 0) {
    coordinates.push(coordinates[0]);
  }

  return coordinates.join(", ");
}

exports.handler = async (event) => {
  const latitude = parseFloat(event.queryStringParameters.latitude);
  const longitude = parseFloat(event.queryStringParameters.longitude);
  const radius = parseFloat(event.queryStringParameters.radius || '0.1'); // Default radius
  const statusType = event.queryStringParameters.statusType || 'ForRent'; // Default to 'ForRent'


  if (!latitude || !longitude) {
    throw new Error("Coordinates not provided or invalid.");
  }

  console.log(`Current Location: Latitude ${latitude}, Longitude ${longitude}`);

  // Generate the polygon from the center coordinates and radius
  const polygon = generatePolygon(latitude, longitude, radius);

  const url = 'https://zillow-com1.p.rapidapi.com/propertyByPolygon';
  const queryParams = new URLSearchParams({
    polygon: polygon
  }).toString();

  const response = await fetch(`${url}?${queryParams}&status_type=${statusType}`, {
    method: 'GET',
    headers: {
        "accept": "application/json",
        "X-RapidAPI-Key": "591a7713f3msh5c9d90523a6ecc7p19cbbfjsnf76adb1ce074",
        "X-RapidAPI-Host": 'zillow-com1.p.rapidapi.com'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }
  const data = await response.json();
  console.log("API response data:", data); // Log the response data for debugging

  if (listings.length === 0) {
    return {
      statusCode: 404, // You can choose to use 404 or another appropriate status code
      headers: {"Access-Control-Allow-Origin": "*"},
      body: JSON.stringify({ error: "No listings found in your search area. Try increasing the radius!" })
    };
  }
  
  // Check if 'props' exists and is an array
  if (!Array.isArray(data.props)) {
    return {
      statusCode: 500,
      headers: {"Access-Control-Allow-Origin": "*"},
      body: JSON.stringify({ error: "Invalid data format from API" })
    };
  }

  const rentalPrices = {};
  const listings = data.props.map(prop => {
  // Check if price is a string and contains characters other than digits
  let price = 0;
  if (typeof prop.price === 'string') {
    price = parseFloat(prop.price.replace(/\D/g, ''));
  } else if (typeof prop.price === 'number') {
    price = prop.price; // If it's already a number, use it directly
  }
    const bedrooms = prop.bedrooms || "Unknown";

    if (!rentalPrices[bedrooms]) {
      rentalPrices[bedrooms] = [price];
    } else {
      rentalPrices[bedrooms].push(price);
    }

    return {
      zpid: prop.zpid,
      address: prop.address,
      price: price,
      bedrooms: bedrooms,
      imgSrc: prop.imgSrc,
      detailUrl: prop.detailUrl,
      latitude: prop.latitude,
      longitude: prop.longitude
      // Include other relevant details here
    };
  });
  
   if (listings.length === 0) {
    return {
      statusCode: 404, // You can choose to use 404 or another appropriate status code
      headers: {"Access-Control-Allow-Origin": "*"},
      body: JSON.stringify({ error: "No listings found in your search area. Try increasing the radius!" })
    };
  }

  const averagePrices = Object.entries(rentalPrices).map(([bedrooms, prices]) => {
    // Filter out prices that are 0
    const filteredPrices = prices.filter(price => price > 0);
  
    // Calculate average only if there are valid prices
    let averagePrice = 0;
    if (filteredPrices.length > 0) {
      averagePrice = filteredPrices.reduce((sum, price) => sum + price, 0) / filteredPrices.length;
    }
  
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