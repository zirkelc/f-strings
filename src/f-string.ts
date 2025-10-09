const IfTrueSymbol = Symbol('if(true)');
const IfFalseSymbol = Symbol('if(false)');
const ElseSymbol = Symbol('else');
const EndIfSymbol = Symbol('endif');

// Matches strings that are empty/whitespace-only OR end with newline+whitespace
// Examples: "", "  ", "text\n  ", "text\n"
const ENDS_WITH_WHITESPACE_LINE = /^\s*$|\n\s*$/;

// Matches strings that start with a newline
// Examples: "\ntext", "\n  text", "\n"
const STARTS_WITH_NEWLINE = /^\n/;

// Matches strings that start with newline+horizontal-whitespace followed by another newline or end
// Examples: "\n  \n", "\n  ", "\n\t\n" (but NOT "\n\ntext")
const WHITESPACE_ONLY_LINE = /^\n[ \t]*(?:\n|$)/;

// Matches lines that start with whitespace followed by non-whitespace (captures the whitespace)
// Examples: "  text" (captures "  "), "\tcode" (captures "\t")
const INDENTED_LINE = /^(\s+)\S/;

export const If = (condition: any): symbol => {
  return condition ? IfTrueSymbol : IfFalseSymbol;
};

export const Else = () => ElseSymbol;

export const EndIf = () => EndIfSymbol;

const isControlSymbol = (value: any): boolean =>
  value === IfTrueSymbol ||
  value === IfFalseSymbol ||
  value === ElseSymbol ||
  value === EndIfSymbol;

/**
 * Removes common leading indentation from multi-line strings.
 * Finds the minimum indentation across all non-empty lines and removes it.
 * Also trims leading and trailing empty lines.
 */
const dedent = (str: string): string => {
  const lines = str.split('\n');

  // Find the minimum indentation across all non-empty lines
  let minIndent: number | null = null;

  for (const line of lines) {
    // Match lines that have indentation followed by non-whitespace
    const match = line.match(INDENTED_LINE);
    if (match?.[1]) {
      const indentLength = match[1].length;
      if (minIndent === null) {
        minIndent = indentLength;
      } else {
        minIndent = Math.min(minIndent, indentLength);
      }
    }
  }

  // If no indented lines found, just trim and return
  if (minIndent === null) {
    return str.trim();
  }

  // Remove the minimum indentation from each line
  const dedentedLines = lines.map((line) => {
    // Only remove indentation from lines that start with whitespace
    if (line[0] === ' ' || line[0] === '\t') {
      return line.slice(minIndent);
    }
    return line;
  });

  // Join lines and trim leading/trailing whitespace
  return dedentedLines.join('\n').trim();
};

/**
 * Looks ahead in the values array to find the next occurrence of a specific symbol,
 * accounting for nested If blocks.
 * Returns the index of the symbol or undefined if not found.
 */
const lookAhead = (
  values: any[],
  startIndex: number,
  symbol: symbol,
): number | undefined => {
  let depth = 0;
  for (let i = startIndex; i < values.length; i++) {
    if (values[i] === IfTrueSymbol || values[i] === IfFalseSymbol) {
      depth++;
    } else if (values[i] === EndIfSymbol) {
      if (depth === 0 && symbol === EndIfSymbol) {
        return i;
      }
      depth--;
    } else if (values[i] === symbol && depth === 0) {
      return i;
    }
  }
  return undefined;
};

/**
 * Evaluates a value, calling it if it's a function (lazy evaluation).
 * If the value is an array, joins it with newlines.
 */
const evaluate = (value: any): any => {
  if (typeof value === 'function') {
    return evaluate(value());
  }
  if (Array.isArray(value)) {
    return value.join('\n');
  }
  return value;
};

/**
 * Tagged template literal function with conditional blocks and automatic dedentation.
 *
 * @param strings - Template string array
 * @param values - Template values
 * @returns Processed string with false conditional blocks removed and dedented
 */
export const f = (strings: TemplateStringsArray, ...values: any[]): string => {
  // Get string at index with stripping applied if adjacent to control symbol on its own line
  const getString = (index: number): string => {
    let str = strings[index] ?? '';

    // Check if previous value was a control symbol on its own line (strip leading whitespace)
    if (index > 0 && isControlSymbol(values[index - 1])) {
      const prevStr = strings[index - 1] ?? '';

      if (
        ENDS_WITH_WHITESPACE_LINE.test(prevStr) &&
        STARTS_WITH_NEWLINE.test(str)
      ) {
        // If the line after control symbol contains only whitespace, remove it entirely
        // Otherwise, keep it as-is to preserve indentation of following content
        if (WHITESPACE_ONLY_LINE.test(str)) {
          str = str.replace(/^\n[ \t]*/, '');
        }
        // Don't strip anything if there's content - preserve the indentation
      }
    }

    // Check if current value is a control symbol on its own line (strip trailing whitespace)
    if (index < values.length && isControlSymbol(values[index])) {
      const nextStr = strings[index + 1] ?? '';

      if (
        ENDS_WITH_WHITESPACE_LINE.test(str) &&
        STARTS_WITH_NEWLINE.test(nextStr)
      ) {
        // Strip trailing whitespace on control symbol's line
        // Only strip the last \n+spaces if there's non-whitespace content before it
        // This preserves empty lines like "\n  " while removing "\nLine 1\n  " -> "\nLine 1"
        if (str.length > 0 && str.match(/\S/)) {
          // Has content, safe to strip last line
          str = str.replace(/\n[ \t]*$/, '');
        } else {
          // Only whitespace, just strip horizontal whitespace
          str = str.replace(/[ \t]+$/, '');
        }
      }
    }

    return str;
  };

  let result = '';
  let i = 0;

  // Template literals interleave strings and values: string[0] + value[0] + string[1] + value[1] + ...
  // We iterate through strings (which has one more element than values)
  while (i < strings.length) {
    result += getString(i);

    // Check if we have a corresponding value at this position
    if (i >= values.length) {
      i++;
      continue;
    }

    // Handle If(true) - include content from if-branch
    if (values[i] === IfTrueSymbol) {
      const endifIndex = lookAhead(values, i + 1, EndIfSymbol);

      if (endifIndex === undefined) {
        throw new Error(`Missing EndIf for If at index ${i}`);
      }

      // Continue processing normally until we hit Else or EndIf
      // This allows nested If blocks to be processed by the main loop
      i++;
    }
    // Handle If(false) - skip content from if-branch, include else-branch if present
    else if (values[i] === IfFalseSymbol) {
      const elseIndex = lookAhead(values, i + 1, ElseSymbol);
      const endifIndex = lookAhead(values, i + 1, EndIfSymbol);

      if (endifIndex === undefined) {
        throw new Error(`Missing EndIf for If at index ${i}`);
      }

      if (elseIndex !== undefined && elseIndex < endifIndex) {
        // Has Else: skip content between If and Else, include from Else to EndIf
        for (let j = elseIndex + 1; j < endifIndex; j++) {
          result += getString(j);
          if (values[j] !== undefined && !isControlSymbol(values[j])) {
            result += evaluate(values[j]); // Lazy evaluation happens here
          }
        }
        result += getString(endifIndex);
        i = endifIndex + 1; // Jump past the entire conditional block
      } else {
        // No Else: skip all content between If and EndIf
        i = endifIndex + 1; // Jump past the entire conditional block
      }
    }
    // Handle Else - skip to matching EndIf (we're in the true branch)
    else if (values[i] === ElseSymbol) {
      const endifIndex = lookAhead(values, i + 1, EndIfSymbol);
      if (endifIndex === undefined) {
        throw new Error(`Missing EndIf for Else at index ${i}`);
      }
      i = endifIndex + 1; // Skip to after EndIf
    }
    // Handle EndIf - just skip it
    else if (values[i] === EndIfSymbol) {
      i++;
    }
    // Handle regular values (not control symbols)
    else {
      result += evaluate(values[i]); // Lazy evaluation: calls function if value is a function
      i++;
    }
  }

  return dedent(result);
};
