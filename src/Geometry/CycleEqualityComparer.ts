export class CycleEqualityComparer
  implements IEqualityComparer<Array<number>>
{
  Equals(c1: Array<number>, c2: Array<number>): boolean {
    if (c1.Count != c2.Count) {
      return false
    }

    let sorted1: Array<number> = c1.OrderBy(i => i).ToArray()
    let sorted2: Array<number> = c2.OrderBy(i => i).ToArray()
    for (let i: number = 0; i < sorted1.Length; i++) {
      if (sorted1[i] != sorted2[i]) {
        return false
      }
    }

    return true
  }

  GetHashCode(cycle: Array<number>): number {
    let hCode: number = 0
    for (let idx of cycle) {
      hCode = hCode ^ idx
    }

    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    return hCode
  }
}
