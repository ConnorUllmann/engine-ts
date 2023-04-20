export function bounds<T>(searchValue: T, ascendingValues: T[]): { last: T; next: T } | null {
  let leftIndex = 0;
  let rightIndex = ascendingValues.length - 1;
  while (rightIndex > leftIndex) {
    const middleIndex = Math.floor((rightIndex + leftIndex) / 2);
    const middle = ascendingValues[middleIndex];
    if (searchValue === middle) {
      return { last: middle, next: middle };
    }
    if (rightIndex - leftIndex === 1) {
      const left = ascendingValues[leftIndex];
      const right = ascendingValues[rightIndex];
      if (searchValue === left) return { last: left, next: left };
      if (searchValue === right) return { last: right, next: right };
      if (searchValue < left || searchValue > right) return null;
      return { last: left, next: right };
    }
    if (searchValue < middle) {
      rightIndex = middleIndex;
      continue;
    }
    if (searchValue > middle) {
      leftIndex = middleIndex;
      continue;
    }
  }
  return null;
}

export function boundsWithGetter<T, U>(
  searchValue: U,
  ascendingValues: T[],
  getter: (t: T) => U
): { leftIndex: number | null; rightIndex: number | null } {
  let leftIndex = 0;
  let rightIndex = ascendingValues.length - 1;
  while (rightIndex > leftIndex) {
    const middleIndex = Math.floor((rightIndex + leftIndex) / 2);
    const middleT = ascendingValues[middleIndex];
    const middle = getter(middleT);
    if (searchValue === middle) {
      return { leftIndex: middleIndex, rightIndex: middleIndex };
    }
    if (rightIndex - leftIndex === 1) {
      const leftT = ascendingValues[leftIndex];
      const rightT = ascendingValues[rightIndex];
      const left = getter(leftT);
      const right = getter(rightT);
      if (searchValue === left) return { leftIndex, rightIndex: leftIndex };
      if (searchValue === right) return { leftIndex: rightIndex, rightIndex };
      if (searchValue < left) return { leftIndex: null, rightIndex: 0 };
      if (searchValue > right) return { leftIndex: ascendingValues.length - 1, rightIndex: null };
      return { leftIndex, rightIndex };
    }
    if (searchValue < middle) {
      rightIndex = middleIndex;
      continue;
    }
    if (searchValue > middle) {
      leftIndex = middleIndex;
      continue;
    }
  }
  return { leftIndex: null, rightIndex: null };
}

// const assert = (searchValue: number, ascendingValues: number[], expected: { last: number, next: number } | null) => {
//     const actual = bounds(searchValue, ascendingValues);
//     const report = [
//         `searchValue: ${searchValue}`,
//         `ascendingValues: [${ascendingValues.join(', ')}]`,
//         `expected: ${expected == null ? 'null' : `{ last: ${expected.last}, next: ${expected.next} }`}`,
//         `actual: ${actual == null ? 'null' : `{ last: ${actual.last}, next: ${actual.next} }`}`
//     ].join('\n');

//     let success = false;
//     if(actual == null && expected == null)
//         success = true;
//     else if(actual != null && expected != null)
//         success = actual.last === expected.last && actual.next === expected.next;

//     success ? console.log(report) : console.warn(report);
// }

// console.log("Running tests...");

// assert(5, [1], null);
// assert(5, [], null);

// assert(5, [1, 2, 4, 8, 9, 27], { last: 4, next: 8 });
// assert(1.5, [1, 2, 4, 8, 9, 27], { last: 1, next: 2 });
// assert(17, [1, 2, 4, 8, 9, 27], { last: 9, next: 27 });
// assert(2, [1, 2, 4, 8, 9, 27], { last: 2, next: 2 });
// assert(0, [1, 2, 4, 8, 9, 27], null);
// assert(1, [1, 2, 4, 8, 9, 27], { last: 1, next: 1 });
// assert(200, [1, 2, 4, 8, 9, 27], null);
// assert(27, [1, 2, 4, 8, 9, 27], { last: 27, next: 27 });

// assert(5, [1, 2, 4, 4, 8, 8, 9, 27], { last: 4, next: 8 });
// assert(1.5, [1, 1, 2, 2, 4, 4, 8, 9, 27], { last: 1, next: 2 });
// assert(17, [1, 2, 4, 4, 8, 9, 9, 27, 27], { last: 9, next: 27 });
// assert(2, [1, 1, 2, 2, 4, 4, 8, 9, 27], { last: 2, next: 2 });
// assert(0, [1, 1, 2, 4, 8, 9, 27], null);
// assert(1, [1, 1, 2, 4, 8, 9, 27], { last: 1, next: 1 });
// assert(200, [1, 2, 4, 8, 9, 27, 27], null);
// assert(27, [1, 2, 4, 8, 9, 27, 27], { last: 27, next: 27 });
