/**
 * Recursively checks and converts error objects to strings to make data safely renderable in React.
 * Specifically targets objects with signature matching error objects (type, loc, msg, input, url)
 * 
 * @param {any} data - Data to sanitize
 * @returns {any} - Sanitized data safe for React rendering
 */
export const sanitizeData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  // Check if this is a potential error object
  if (
    typeof data === 'object' && 
    !Array.isArray(data) && 
    data !== null &&
    data.type && 
    data.loc && 
    data.msg && 
    data.input
  ) {
    // Convert error object to string
    return `Error: ${data.msg}`;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  // Handle plain objects
  if (typeof data === 'object' && data !== null) {
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = sanitizeData(data[key]);
      }
    }
    return result;
  }

  // Return primitive values as is
  return data;
};

const SafeDataUtils = { sanitizeData };

export default SafeDataUtils; 