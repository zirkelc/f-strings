export const IfTrueSymbol = Symbol('if(true)');
export const IfFalseSymbol = Symbol('if(false)');
export const ElseSymbol = Symbol('else');
export const EndIfSymbol = Symbol('endif');

export const isControlSymbol = (value: any): boolean =>
  value === IfTrueSymbol ||
  value === IfFalseSymbol ||
  value === ElseSymbol ||
  value === EndIfSymbol;

export const If = (condition: any): symbol =>
  condition ? IfTrueSymbol : IfFalseSymbol;

export const Else = (): symbol => ElseSymbol;

export const EndIf = (): symbol => EndIfSymbol;
