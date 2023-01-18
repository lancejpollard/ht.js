export /* sealed */ class RangeAttribute extends Attribute {
  _low: number

  _high: number

  constructor(low: number, high: number) {
    this._low = low
    this._high = high
    System.Diagnostics.console.assert(this._low <= this._high)
  }

  get Low(): number {
    return this._low
  }

  get High(): number {
    return this._high
  }
}
