import { describe, expect, it, vi } from 'vitest';
import { Else, EndIf, f, If } from './f-strings';

describe('f-strings', () => {
  describe('conditional', () => {
    it('should include if-branch when condition is true', () => {
      const result = f`Start ${If(true)}TRUE${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start TRUE End"`);
    });

    it('should work with EndIf as function call', () => {
      const result = f`Start ${If(true)}TRUE${EndIf()} End`;
      expect(result).toMatchInlineSnapshot(`"Start TRUE End"`);
    });

    it('should work with Else and EndIf as function calls', () => {
      const result = f`Start ${If(false)}TRUE${Else()}FALSE${EndIf()} End`;
      expect(result).toMatchInlineSnapshot(`"Start FALSE End"`);
    });

    it('should exclude if-branch when condition is false', () => {
      const result = f`Start ${If(false)}FALSE${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start  End"`);
    });

    it('should exclude else-branch when condition is true', () => {
      const result = f`Start ${If(true)}TRUE${Else}FALSE${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start TRUE End"`);
    });

    it('should include else-branch when condition is false', () => {
      const result = f`Start ${If(false)}TRUE${Else}FALSE${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start FALSE End"`);
    });

    it('should handle empty conditional blocks', () => {
      const result = f`Start ${If(true)}${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start  End"`);
    });

    it('should handle truthy values', () => {
      const result = f`${If(1)}truthy${EndIf}`;
      expect(result).toMatchInlineSnapshot(`"truthy"`);
    });

    it('should handle falsy values', () => {
      const result = f`${If(0)}falsy${Else}else${EndIf}`;
      expect(result).toMatchInlineSnapshot(`"else"`);
    });

    it('should handle null condition', () => {
      const result = f`${If(null)}null${Else}not null${EndIf}`;
      expect(result).toMatchInlineSnapshot(`"not null"`);
    });

    it('should handle undefined condition', () => {
      const result = f`${If(undefined)}undefined${Else}defined${EndIf}`;
      expect(result).toMatchInlineSnapshot(`"defined"`);
    });

    it('should handle nested conditionals', () => {
      const result = f`Start ${If(true)}Outer ${If(true)}Inner${EndIf} Outer${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start Outer Inner Outer End"`);
    });

    it('should handle nested conditionals with false outer condition', () => {
      const result = f`Start ${If(false)}Outer ${If(true)}Inner${EndIf} Outer${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start  End"`);
    });

    it('should handle nested conditionals with false inner condition', () => {
      const result = f`Start ${If(true)}Outer ${If(false)}Inner${EndIf} Outer${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start Outer  Outer End"`);
    });

    it('should handle deeply nested conditionals', () => {
      const result = f`${If(true)}L1 ${If(true)}L2 ${If(true)}L3${EndIf} L2${EndIf} L1${EndIf}`;
      expect(result).toMatchInlineSnapshot(`"L1 L2 L3 L2 L1"`);
    });

    it('should handle nested conditionals with else branches', () => {
      const result = f`${If(true)}Outer ${If(false)}Inner True${Else}Inner False${EndIf} Outer${EndIf}`;
      expect(result).toMatchInlineSnapshot(`"Outer Inner False Outer"`);
    });
  });

  describe('interpolation', () => {
    it('should include regular interpolated values', () => {
      const num = 42;
      const str = 'hello';
      const result = f`Start ${num} ${str} End`;
      expect(result).toMatchInlineSnapshot(`"Start 42 hello End"`);
    });

    it('should include interpolated values in true conditional', () => {
      const num = 42;
      const str = 'hello';
      const result = f`Start ${If(true)}${num} ${str}${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start 42 hello End"`);
    });

    it('should exclude interpolated values in false conditional', () => {
      const num = 42;
      const str = 'hello';
      const result = f`Start ${If(false)}${num} ${str}${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start  End"`);
    });

    it('should include interpolated values in else-branch', () => {
      const num = 42;
      const str = 'hello';
      const result = f`Start ${If(false)}wrong${Else}${num} ${str}${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start 42 hello End"`);
    });
  });

  describe('lazy evaluation', () => {
    it('should evaluate function in if-branch', () => {
      const truthyFn = vi.fn(() => 'TRUE');
      const falsyFn = vi.fn(() => 'FALSE');
      const result = f`Start ${If(true)}${truthyFn}${Else}${falsyFn}${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start TRUE End"`);
      expect(truthyFn).toHaveBeenCalled();
      expect(falsyFn).not.toHaveBeenCalled();
    });

    it('should evaluate function in else-branch', () => {
      const truthyFn = vi.fn(() => 'TRUE');
      const falsyFn = vi.fn(() => 'FALSE');
      const result = f`Start ${If(false)} ${truthyFn} ${Else} ${falsyFn} ${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start  FALSE  End"`);
      expect(truthyFn).not.toHaveBeenCalled();
      expect(falsyFn).toHaveBeenCalled();
    });

    it('should mix lazy and eager values', () => {
      const eager = 'eager';
      const lazy = vi.fn(() => 'lazy');
      const result = f`Start ${If(true)} ${eager} ${lazy} ${EndIf} End`;
      expect(result).toMatchInlineSnapshot(`"Start  eager lazy  End"`);
    });

    it('should join array values with newlines', () => {
      const items = ['item1', 'item2', 'item3'];
      const result = f`
        List:
        ${items}
      `;
      expect(result).toMatchInlineSnapshot(`
        "List:
        item1
        item2
        item3"
      `);
    });

    it('should join array from function with newlines', () => {
      const getItems = vi.fn(() => ['a', 'b', 'c']);
      const result = f`${If(true)}${getItems}${EndIf}`;
      expect(result).toMatchInlineSnapshot(`
        "a
        b
        c"
      `);
      expect(getItems).toHaveBeenCalled();
    });

    it('should handle empty array', () => {
      const empty: string[] = [];
      const result = f`Start ${empty} End`;
      expect(result).toMatchInlineSnapshot(`"Start  End"`);
    });
  });

  describe('linebreaks', () => {
    const line1 = 'Line 1';
    const line2 = 'Line 2';

    it('should remove whitespace from standalone if-else-endif lines', () => {
      // if-only with no interpolation
      expect(f`
        ${If(true)}
        Line 1
        ${EndIf}
        ${If(true)}
        Line 2
        ${EndIf}
      `).toMatchInlineSnapshot(`
        "Line 1
        Line 2"
      `);

      // if-only with partial interpolation
      expect(f`
        ${If(true)}
        Line 1
        ${EndIf}
        ${If(true)}
        ${line2}
        ${EndIf}
      `).toMatchInlineSnapshot(`
        "Line 1
        Line 2"
      `);

      // if-only with full interpolation
      expect(f`
        ${If(true)}
        ${line1}
        ${EndIf}
        ${If(true)}
        ${line2}
        ${EndIf}
      `).toMatchInlineSnapshot(`
        "Line 1
        Line 2"
      `);

      // if-else with no interpolation
      expect(f`
        ${If(true)}
        Line 1
        ${Else}
        NotShown
        ${EndIf}
        ${If(true)}
        Line 2
        ${Else}
        NotShown
        ${EndIf}
      `).toMatchInlineSnapshot(`
        "Line 1
        Line 2"
      `);

      // if-else with partial interpolation
      expect(f`
        ${If(true)}
        Line1
        ${Else}
        ${line1}
        ${EndIf}
        ${If(false)}
        ${line2}
        ${Else}
        Line2
        ${EndIf}
      `).toMatchInlineSnapshot(`
        "Line1
        Line2"
      `);

      // if-else with full interpolation
      expect(f`
        ${If(false)}
        ${line1}
        ${Else}
        ${line1}
        ${EndIf}
        ${If(false)}
        ${line2}
        ${Else}
        ${line2}
        ${EndIf}
      `).toMatchInlineSnapshot(`
        "Line 1
        Line 2"
      `);
    });

    it('should NOT remove empty lines between if-else-endif', () => {
      // if-only with no interpolation
      expect(f`
        ${If(true)}
        Line 1
        ${EndIf}

        ${If(true)}
        Line 2
        ${EndIf}
      `).toMatchInlineSnapshot(`
        "Line 1

        Line 2"
      `);

      // if-only with partial interpolation
      expect(f`
        ${If(true)}
        Line 1
        ${EndIf}

        ${If(true)}
        ${line2}
        ${EndIf}
      `).toMatchInlineSnapshot(`
        "Line 1

        Line 2"
      `);

      // if-only with full interpolation
      expect(f`
        ${If(true)}
        ${line1}
        ${EndIf}

        ${If(true)}
        ${line2}
        ${EndIf}
      `).toMatchInlineSnapshot(`
        "Line 1

        Line 2"
      `);

      // if-else with no interpolation
      expect(f`
        ${If(false)}
        NotShown
        ${Else}
        Line 1
        ${EndIf}

        ${If(false)}
        NotShown
        ${Else}
        Line 2
        ${EndIf}
      `).toMatchInlineSnapshot(`
        "Line 1

        Line 2"
      `);

      // if-else with full interpolation
      expect(f`
        ${If(false)}
        ${line1}
        ${Else}
        Line 1
        ${EndIf}

        ${If(false)}
        ${line2}
        ${Else}
        Line 2
        ${EndIf}
      `).toMatchInlineSnapshot(`
        "Line 1

        Line 2"
      `);
    });

    it('should NOT remove whitespaces from following lines', () => {
      const result = f`
        Start
        ${If(true)}  Line 1
          ${EndIf}

          ${If(true)}
          Line 2${EndIf}
          Line 3
        End
      `;
      expect(result).toMatchInlineSnapshot(`
        "Start
          Line 1

          Line 2
          Line 3
        End"
      `);
      console.log(result);
    });

    it('should NOT remove whitespaces from inline if-else-endif lines', () => {
      const result = f`
        Line 1 ${If(true)}Line 2${EndIf} Line 3
      `;
      expect(result).toMatchInlineSnapshot(`
        "Line 1 Line 2 Line 3"
      `);
      console.log(result);
    });

    it('should trim leading/trailing whitespaces', () => {
      const result = f`

        Line 1
          Line 2
            Line 3

      `;
      expect(result.trim()).toMatchInlineSnapshot(`
        "Line 1
          Line 2
            Line 3"
      `);
    });

    it('should handle Else on standalone lines', () => {
      const result = f`
        ${If(false)}
        Line 1
        ${Else}
        Line 2
        ${EndIf}
      `;
      expect(result).toMatchInlineSnapshot(`
        "Line 2"
      `);
    });
  });

  describe('error handling', () => {
    it('should throw error when EndIf is missing', () => {
      expect(() => f`${If(true)}content`).toThrow(
        'Missing EndIf for If at index 0',
      );
    });

    it('should throw error when EndIf is missing for nested If', () => {
      expect(() => f`${If(true)}${If(true)}${EndIf}`).toThrow(
        'Missing EndIf for If at index 0',
      );
    });

    it('should throw error when EndIf is missing after Else', () => {
      expect(() => f`${If(false)}${Else}content`).toThrow(
        'Missing EndIf for If at index 0',
      );
    });

    it('should throw error when If is used without calling it', () => {
      expect(() => f`${If}content${EndIf}`).toThrow(
        'If must be called as a function: If(condition)',
      );
    });
  });

  describe('dedentation', () => {
    it('should dedent without interpolation', () => {
      const result = f`
        Line 1
        Line 2
        Line 3
      `;
      expect(result).toMatchInlineSnapshot(`
        "Line 1
        Line 2
        Line 3"
      `);
    });

    it('should dedent with interpolation', () => {
      const result = f`
        ${'Line 1'}
        ${'Line 2'}
        ${'Line 3'}
      `;
      expect(result).toMatchInlineSnapshot(`
        "Line 1
        Line 2
        Line 3"
      `);
    });

    it('should NOT remove indentation', () => {
      const result = f`
        Line 1
          Line 2
        Line 3
      `;
      expect(result.trim()).toMatchInlineSnapshot(`
        "Line 1
          Line 2
        Line 3"
      `);
    });

    it('should NOT remove empty lines', () => {
      const result = f`
        Line 1

          Line 2

            Line 3
      `;
      expect(result.trim()).toMatchInlineSnapshot(`
        "Line 1

          Line 2

            Line 3"
      `);
    });
  });
});
