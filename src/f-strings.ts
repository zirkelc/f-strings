import { dedent } from './dedent.js';
import { evaluate } from './evaluate.js';
import {
  Else,
  ElseSymbol,
  EndIf,
  EndIfSymbol,
  If,
  IfFalseSymbol,
  IfTrueSymbol,
  isControlSymbol,
} from './symbols.js';

// Matches strings that are whitespace-only or end with newline followed by optional whitespace
// Used to detect control symbols on their own line
// Examples: "", "  ", "text\n  ", "text\n"
const ENDS_WITH_WHITESPACE_LINE = /^\s*$|\n\s*$/;

// Matches strings that start with a newline
// Used to detect whitespace that should be stripped after control symbols
// Examples: "\ntext", "\n  text", "\n"
const STARTS_WITH_NEWLINE = /^\n/;

/**
 * Looks ahead in the values array to find the next occurrence of a specific symbol
 * at the current nesting level (depth 0), accounting for nested If blocks.
 *
 * Tracks depth: increments on If symbols, decrements on EndIf symbols.
 * Only returns when the target symbol is found at depth 0.
 *
 * @param values - Normalized values array
 * @param startIndex - Index to start searching from
 * @param symbol - Symbol to search for (ElseSymbol or EndIfSymbol)
 * @returns Index of the symbol at depth 0, or undefined if not found
 */
const lookAhead = (
  values: any[],
  startIndex: number,
  symbol: symbol,
): number | undefined => {
  let depth = 0;
  for (let i = startIndex; i < values.length; i++) {
    const val = values[i];
    if (val === IfTrueSymbol || val === IfFalseSymbol) {
      depth++;
    } else if (val === EndIfSymbol) {
      if (depth === 0 && symbol === EndIfSymbol) {
        return i;
      }
      depth--;
    } else if (depth === 0) {
      if (symbol === ElseSymbol && val === ElseSymbol) {
        return i;
      } else if (val === symbol) {
        return i;
      }
    }
  }
  return undefined;
};

/**
 * Tagged template literal function with conditional blocks and automatic dedentation.
 *
 * @param strings - Template string array
 * @param rawValues - Template values
 * @returns Processed string with false conditional blocks removed and dedented
 */
export const f = (
  strings: TemplateStringsArray,
  ...rawValues: any[]
): string => {
  // Normalize values: convert Else/EndIf function references to their symbols
  // This allows both ${Else} and ${Else()} syntax while maintaining type safety
  const values = rawValues.map((v) => {
    if (v === Else || v === EndIf) {
      return v();
    } else if (v === If) {
      throw new Error('If must be called as a function: If(condition)');
    }
    return v;
  });

  /**
   * Gets the template string at the given index with context-aware whitespace stripping.
   *
   * Whitespace is only stripped when control symbols are on their own lines, meaning:
   * - Both neighbors (previous and current value, or current and next value) are control symbols
   * - The string segment matches the standalone pattern (ends/starts with newline + whitespace)
   *
   * This preserves whitespace for interpolated values while cleaning up control flow syntax.
   */
  const getString = (index: number): string => {
    let str = strings[index] ?? '';

    // Strip leading whitespace if previous value was a standalone control symbol
    // Only strip when both the previous value AND current value are control symbols (or we're at the end)
    // This ensures we don't strip whitespace before interpolated values
    if (index > 0 && isControlSymbol(values[index - 1])) {
      const currentValueIsControl =
        index < values.length && isControlSymbol(values[index]);
      const atEnd = index >= values.length;

      if (currentValueIsControl || atEnd) {
        const prevStr = strings[index - 1] ?? '';

        // Only strip if the pattern suggests control symbols on their own line
        if (
          ENDS_WITH_WHITESPACE_LINE.test(prevStr) &&
          STARTS_WITH_NEWLINE.test(str)
        ) {
          if (/^\n[ \t]*$/.test(str)) {
            // Single line with only whitespace after newline - strip it completely
            str = str.replace(/^\n[ \t]*/, '');
          } else if (/^\n[ \t]*\n/.test(str) && !str.match(/\S/)) {
            // Multiple newlines with only whitespace - preserve empty lines, strip first line's whitespace
            str = str.replace(/^\n[ \t]*/, '');
          }
          // If there's actual content, preserve indentation (don't strip)
        }
      }
    }

    // Strip trailing whitespace if current value is a standalone control symbol
    // Only strip when both the current value AND next value are control symbols (or we're at the end)
    // This ensures we don't strip whitespace after interpolated values
    if (index < values.length && isControlSymbol(values[index])) {
      const nextValueIsControl =
        index + 1 < values.length && isControlSymbol(values[index + 1]);
      const nextAtEnd = index + 1 >= values.length;

      if (nextValueIsControl || nextAtEnd) {
        const nextStr = strings[index + 1] ?? '';

        // Only strip if the pattern suggests control symbols on their own line
        if (
          ENDS_WITH_WHITESPACE_LINE.test(str) &&
          STARTS_WITH_NEWLINE.test(nextStr)
        ) {
          // Detect inline content: non-whitespace characters before the trailing whitespace
          const hasInlineContent = str.match(/\S/) && !str.match(/^\s*\n/);

          if (hasInlineContent) {
            // Inline content exists - strip only horizontal whitespace, preserve the newline
            // Example: "text  \n" -> "text\n"
            str = str.replace(/[ \t]+$/, '');
          } else {
            // No inline content - control symbol is standalone, strip newline and whitespace
            // Example: "  \n" -> ""
            str = str.replace(/\n[ \t]*$/, '');
          }
        }
      }
    }

    return str;
  };

  let result = '';
  let i = 0;

  // Iterate through template strings and interleaved values
  // Template structure: string[0] + value[0] + string[1] + value[1] + ... + string[n]
  // Note: strings.length = values.length + 1
  while (i < strings.length) {
    result += getString(i);

    // Check if there's a corresponding value at this position
    if (i >= values.length) {
      i++;
      continue;
    }

    const value = values[i];

    // Handle If(true) - include the if-branch content, skip the else-branch
    if (value === IfTrueSymbol) {
      const endifIndex = lookAhead(values, i + 1, EndIfSymbol);

      if (endifIndex === undefined) {
        throw new Error(`Missing EndIf for If at index ${i}`);
      }

      // Simply increment and let the main loop process the if-branch
      // Nested If blocks will be handled recursively
      // When we encounter Else, we'll skip to EndIf (see Else handler below)
      i++;
    }
    // Handle If(false) - skip the if-branch, include the else-branch if present
    else if (value === IfFalseSymbol) {
      const elseIndex = lookAhead(values, i + 1, ElseSymbol);
      const endifIndex = lookAhead(values, i + 1, EndIfSymbol);

      if (endifIndex === undefined) {
        throw new Error(`Missing EndIf for If at index ${i}`);
      }

      if (elseIndex !== undefined && elseIndex < endifIndex) {
        // Has Else branch - skip if-branch, manually process else-branch
        for (let j = elseIndex + 1; j < endifIndex; j++) {
          result += getString(j);
          if (values[j] !== undefined && !isControlSymbol(values[j])) {
            result += evaluate(values[j]);
          }
        }
        result += getString(endifIndex);
        i = endifIndex + 1;
      } else {
        // No Else branch - skip entire if-block
        i = endifIndex + 1;
      }
    }
    // Handle Else - we only reach this when in a true branch, so skip to EndIf
    else if (value === ElseSymbol) {
      const endifIndex = lookAhead(values, i + 1, EndIfSymbol);
      if (endifIndex === undefined) {
        throw new Error(`Missing EndIf for Else at index ${i}`);
      }
      i = endifIndex + 1;
    }
    // Handle EndIf - just skip it (boundary marker only)
    else if (value === EndIfSymbol) {
      i++;
    }
    // Handle regular interpolated values
    else {
      result += evaluate(value);
      i++;
    }
  }

  return dedent(result);
};
