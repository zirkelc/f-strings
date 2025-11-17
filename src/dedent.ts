// Matches lines that start with whitespace followed by non-whitespace content
// Captures the leading whitespace for indentation calculation
// Examples: "  text" (captures "  "), "\tcode" (captures "\t")
const INDENTED_LINE = /^(\s+)\S/;

/**
 * Removes common leading indentation from multi-line strings.
 * Finds the minimum indentation across all non-empty lines and removes it.
 * Also trims leading and trailing empty lines.
 */
export const dedent = (str: string): string => {
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
