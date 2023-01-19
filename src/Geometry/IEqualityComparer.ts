/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IEqualityComparer<T> {
  Equals: (x: T, y: T) => boolean
  GetHashCode: (obj: T) => number
}
