// API utilities for external services

const GOOGLE_PLACES_API_KEY = 'AIzaSyBQex3BqbnFLYqQkIpLeWGOZevQeT5x2Qk';

/**
 * Searches for places using Google Places API Text Search
 * @param {string} query - Search query (business name, address, etc.)
 * @param {string} location - Optional location bias (lat,lng)
 * @returns {Promise<Object>} Search results
 */
export const searchPlaces = async (query, location = null) => {
  try {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    if (location) {
      url += `&location=${location}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
};

/**
 * Searches for a business by CID (Customer ID)
 * Note: CID is typically used in Google My Business API, but we can try to find the business
 * by searching for common business identifiers or names
 * @param {string} cid - Customer ID
 * @returns {Promise<Object>} Search results
 */
export const searchBusinessByCID = async (cid) => {
  try {
    console.log(`Searching for business with CID: ${cid}`);
    
    // Try different search strategies
    const searchQueries = [
      `business ID ${cid}`,
      `customer ID ${cid}`,
      `CID ${cid}`,
      `Google My Business ${cid}`
    ];

    const results = [];
    
    for (const query of searchQueries) {
      try {
        const searchResult = await searchPlaces(query);
        if (searchResult.results && searchResult.results.length > 0) {
          results.push({
            query,
            results: searchResult.results
          });
        }
      } catch (error) {
        console.log(`Search failed for query "${query}":`, error.message);
      }
    }

    return {
      cid,
      searches: results,
      totalResults: results.reduce((sum, r) => sum + r.results.length, 0)
    };
  } catch (error) {
    console.error('Error searching business by CID:', error);
    throw error;
  }
};

/**
 * Fetches place details from Google Places API
 * @param {string} placeId - The Google Place ID
 * @param {string} fields - Comma-separated list of fields to return
 * @returns {Promise<Object>} Place details
 */
export const getPlaceDetails = async (placeId, fields = 'name,formattedAddress,plusCode,geometry,internationalPhoneNumber,websiteUri,reviews') => {
  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw error;
  }
};

/**
 * Example usage function
 */
export const getExamplePlaceDetails = async () => {
  const placeId = 'ChIJbdfcVJG7DmQRmdWH6gPekvw';
  const fields = 'name,formattedAddress,plusCode,geometry,internationalPhoneNumber,websiteUri,reviews';
  
  try {
    const placeDetails = await getPlaceDetails(placeId, fields);
    console.log('Place details:', placeDetails);
    return placeDetails;
  } catch (error) {
    console.error('Failed to get place details:', error);
    throw error;
  }
}; 