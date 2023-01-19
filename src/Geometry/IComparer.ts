export interface IComparer {
  // Compares two objects. An implementation of this method must return a
  // value less than zero if x is less than y, zero if x is equal to y, or a
  // value greater than zero if x is greater than y.
  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Compare: (x: any, y: any) => number
}
