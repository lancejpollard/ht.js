import System.Collections.Generic;
import System.Linq;

module R3.Math {
    
    //  http://www.codeproject.com/Articles/42492/Using-LINQ-to-Calculate-Basic-Statistics
    //  Add more from there as needed.
    export class Statistics {
        
        public static Median(this source: IEnumerable<number>): number {
            return Statistics.ElementAtPercentage(source, 0.5);
        }
        
        ///  <summary>
        ///  This is like Median, but allows you to grab the element an arbitrary percentage along.
        ///  percentage should be between 0 and 1.
        ///  </summary>
        public static ElementAtPercentage(this source: IEnumerable<number>, percentage: number): number {
            let sortedList = from;
            number;
            let orderby: source;
            let select: number;
            number;
            let count: number = sortedList.Count();
            let itemIndex: number = (<number>(((<number>(count)) * percentage)));
            if (((count % 2) 
                        == 0)) {
                return ((sortedList.ElementAt(itemIndex) + sortedList.ElementAt((itemIndex - 1))) 
                            / 2);
            }
            
            //  Odd number of items. 
            return sortedList.ElementAt(itemIndex);
        }
    }
}