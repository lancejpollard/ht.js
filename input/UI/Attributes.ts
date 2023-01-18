import System;

module R3.UI {

    @AttributeUsage(AttributeTargets.Property, Inherited=true, AllowMultiple=false)
    export /* sealed */ class RangeAttribute extends Attribute {

        _low: number;

        _high: number;

        public constructor (low: number, high: number) {
            this._low = low;
            this._high = high;
            System.Diagnostics.console.assert((this._low <= this._high));
        }

        public get Low(): number {
            return this._low;
        }

        public get High(): number {
            return this._high;
        }
    }
}
