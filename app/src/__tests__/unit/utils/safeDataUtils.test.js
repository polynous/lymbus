import { sanitizeData } from '../../../utils/safeDataUtils';

describe('safeDataUtils', () => {
  describe('sanitizeData', () => {
    it('should return null and undefined as is', () => {
      expect(sanitizeData(null)).toBeNull();
      expect(sanitizeData(undefined)).toBeUndefined();
    });

    it('should return primitive values unchanged', () => {
      expect(sanitizeData('hello')).toBe('hello');
      expect(sanitizeData(123)).toBe(123);
      expect(sanitizeData(true)).toBe(true);
      expect(sanitizeData(false)).toBe(false);
    });

    it('should convert error objects to safe strings', () => {
      const errorObject = {
        type: 'validation_error',
        loc: ['body', 'email'],
        msg: 'Invalid email format',
        input: 'invalid-email',
        url: 'https://example.com'
      };

      const result = sanitizeData(errorObject);
      expect(result).toBe('Error: Invalid email format');
    });

    it('should handle partial error objects', () => {
      const partialError = {
        type: 'error',
        loc: ['field'],
        msg: 'Error message',
        input: 'bad input'
        // missing url property
      };

      const result = sanitizeData(partialError);
      expect(result).toBe('Error: Error message');
    });

    it('should not convert objects that are not error objects', () => {
      const regularObject = {
        name: 'John',
        age: 30,
        email: 'john@example.com'
      };

      const result = sanitizeData(regularObject);
      expect(result).toEqual(regularObject);
    });

    it('should recursively sanitize arrays', () => {
      const arrayWithError = [
        'valid string',
        123,
        {
          type: 'validation_error',
          loc: ['array', '1'],
          msg: 'Array item error',
          input: 'bad value'
        },
        'another string'
      ];

      const result = sanitizeData(arrayWithError);
      expect(result).toEqual([
        'valid string',
        123,
        'Error: Array item error',
        'another string'
      ]);
    });

    it('should recursively sanitize nested objects', () => {
      const nestedObject = {
        user: {
          name: 'John',
          preferences: {
            theme: 'dark',
            error: {
              type: 'validation_error',
              loc: ['preferences', 'theme'],
              msg: 'Invalid theme',
              input: 'invalid-theme'
            }
          }
        },
        metadata: {
          timestamp: Date.now(),
          errors: [
            {
              type: 'field_error',
              loc: ['metadata'],
              msg: 'Field validation failed',
              input: null
            }
          ]
        }
      };

      const result = sanitizeData(nestedObject);
      expect(result.user.name).toBe('John');
      expect(result.user.preferences.theme).toBe('dark');
      expect(result.user.preferences.error).toBe('Error: Invalid theme');
      expect(result.metadata.errors[0]).toBe('Error: Field validation failed');
    });

    it('should handle arrays within nested objects', () => {
      const complexStructure = {
        data: [
          { valid: true },
          {
            type: 'error',
            loc: ['data', '1'],
            msg: 'Invalid data',
            input: 'bad'
          }
        ],
        nested: {
          items: [
            'string',
            {
              type: 'nested_error',
              loc: ['nested', 'items', '1'],
              msg: 'Nested validation error',
              input: { invalid: 'object' }
            }
          ]
        }
      };

      const result = sanitizeData(complexStructure);
      expect(result.data[0]).toEqual({ valid: true });
      expect(result.data[1]).toBe('Error: Invalid data');
      expect(result.nested.items[0]).toBe('string');
      expect(result.nested.items[1]).toBe('Error: Nested validation error');
    });

    it('should handle circular references gracefully', () => {
      const circularObject = { name: 'test' };
      circularObject.self = circularObject;

      // This should not throw an error (though it may not handle the circular ref perfectly)
      expect(() => sanitizeData(circularObject)).not.toThrow();
    });

    it('should preserve object properties that are not error-like', () => {
      const mixedObject = {
        validField: 'valid value',
        errorField: {
          type: 'validation_error',
          loc: ['field'],
          msg: 'This is an error',
          input: 'invalid'
        },
        numberField: 42,
        booleanField: true,
        nullField: null
      };

      const result = sanitizeData(mixedObject);
      expect(result.validField).toBe('valid value');
      expect(result.errorField).toBe('Error: This is an error');
      expect(result.numberField).toBe(42);
      expect(result.booleanField).toBe(true);
      expect(result.nullField).toBeNull();
    });

    it('should handle edge cases with empty objects and arrays', () => {
      expect(sanitizeData({})).toEqual({});
      expect(sanitizeData([])).toEqual([]);
    });

    it('should handle objects with some error properties but not all required', () => {
      const incompleteError = {
        type: 'error',
        msg: 'Error message'
        // missing loc and input
      };

      const result = sanitizeData(incompleteError);
      expect(result).toEqual(incompleteError); // Should not be converted
    });
  });
}); 