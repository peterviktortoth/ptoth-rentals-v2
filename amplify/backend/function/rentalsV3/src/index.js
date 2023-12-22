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
  return coordinates.join(", ");
}

exports.handler = async (event) => {
  const latitude = parseFloat(event.queryStringParameters.latitude);
  const longitude = parseFloat(event.queryStringParameters.longitude);
  const radius = parseFloat(event.queryStringParameters.radius || '0.1'); // Default radius

  if (!latitude || !longitude) {
    throw new Error("Coordinates not provided or invalid.");
  }

  console.log(`Current Location: Latitude ${latitude}, Longitude ${longitude}`);

  // Generate the polygon from the center coordinates and radius
  const polygon = generatePolygon(latitude, longitude, radius);

  const url = 'https://zillow-com1.p.rapidapi.com/propertyByPolygon';
  const headers = {
    "accept": "application/json",
    "X-RapidAPI-Key": "591a7713f3msh5c9d90523a6ecc7p19cbbfjsnf76adb1ce074", // Use environment variables or a secure method to store API keys
    "X-RapidAPI-Host": 'zillow-com1.p.rapidapi.com'
  };

  const response = await fetch(url, {
    method: 'GET',
    headers: headers,
    params: {
      polygon: polygon,
      home_type: 'Houses'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }
  const data = await response.json();

  // Process the response data to calculate average prices and extract listings
  const rentalPrices = {};
  const listings = data.props.map(prop => {
    const price = prop.price ? parseFloat(prop.price.replace(/\D/g, '')) : 0;
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
