/**
 * Recursively checks and converts error objects to strings to make data safely renderable in React.
 * Specifically targets objects with signature matching error objects (type, loc, msg, input, url)
 * 
 * @param {any} data - Data to sanitize
 * @param {WeakSet} visited - Set to track visited objects and prevent circular references
 * @returns {any} - Sanitized data safe for React rendering
 */
export const sanitizeData = (data, visited = new WeakSet()) => {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle circular references
  if (typeof data === 'object' && data !== null) {
    if (visited.has(data)) {
      return '[Circular Reference]';
    }
    visited.add(data);
  }

  // Check if this is a potential error object
  if (
    typeof data === 'object' && 
    !Array.isArray(data) && 
    data !== null &&
    data.type && 
    data.loc && 
    data.msg && 
    'input' in data  // Check for property existence instead of truthy value
  ) {
    // Convert error object to string
    return `Error: ${data.msg}`;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, visited));
  }

  // Handle plain objects
  if (typeof data === 'object' && data !== null) {
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = sanitizeData(data[key], visited);
      }
    }
    return result;
  }

  // Return primitive values as is
  return data;
};

const SafeDataUtils = { sanitizeData };

export default SafeDataUtils; 