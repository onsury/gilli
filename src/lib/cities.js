// src/lib/cities.js
// Maps pincode prefix (first 3 digits) to Indian city.
// Used to silently tag shop records with city context.

const CITY_BY_PREFIX = {
  '110': 'Delhi',
  '160': 'Chandigarh',
  '302': 'Jaipur',
  '226': 'Lucknow',
  '380': 'Ahmedabad',
  '452': 'Indore',
  '462': 'Bhopal',
  '400': 'Mumbai',
  '411': 'Pune',
  '700': 'Kolkata',
  '682': 'Kochi',
  '641': 'Coimbatore',
  '600': 'Chennai',
  '500': 'Hyderabad',
  '560': 'Bangalore',
};

export function cityFromPincode(pincode) {
  if (!pincode || typeof pincode !== 'string') return null;
  const prefix = pincode.trim().substring(0, 3);
  return CITY_BY_PREFIX[prefix] || null;
}

export function isKnownCity(pincode) {
  return cityFromPincode(pincode) !== null;
}

export const SUPPORTED_CITIES = Object.values(CITY_BY_PREFIX).sort();
