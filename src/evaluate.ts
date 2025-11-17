/**
 * Evaluates a value with lazy evaluation and array handling.
 *
 * - Functions are called recursively until a non-function value is reached
 * - Arrays are joined with newline separators
 * - All other values are returned as-is
 *
 * @param value - Value to evaluate
 * @returns Evaluated value
 */
export const evaluate = (value: any): any => {
  if (typeof value === 'function') {
    return evaluate(value());
  }
  if (Array.isArray(value)) {
    return value.join('\n');
  }
  return value;
};
