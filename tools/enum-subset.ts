type IsTupleSubsetOfUnion<Union, Tuple extends Readonly<any[]>> = Tuple extends []
  ? true
  : Tuple extends [infer First, ...infer Rest]
  ? First extends Union
    ? Rest extends any[]
      ? Rest extends []
        ? true
        : Exclude<Union, First> extends never
        ? false
        : IsTupleSubsetOfUnion<Exclude<Union, First>, Rest>
      : false
    : false
  : false;

type EnumValues<Enum extends Record<any, string | number>> = {
  [K in keyof Enum]: Enum[K];
}[keyof Enum];

export const enumSubset = <Enum extends Record<any, string | number>, T extends Readonly<EnumValues<Enum>[]>>(
  _enum: Enum,
  ..._tuple: IsTupleSubsetOfUnion<EnumValues<Enum>, T> extends true ? T : never
): T => {
  return _tuple;
};

// enum Test {
//   A = 'a',
//   B = 'b',
//   C = 'c',
// }

// // enum Test {
// //   A = 0,
// //   B = 1,
// //   C = 2,
// // }

// const resultSuccess00 = enumSubset(Test, Test.A, Test.B, Test.C);
// const resultSuccess01 = enumSubset(Test, Test.A, Test.C, Test.B);
// const resultSuccess02 = enumSubset(Test, Test.B, Test.A, Test.C);
// const resultSuccess03 = enumSubset(Test, Test.B, Test.C, Test.A);
// const resultSuccess04 = enumSubset(Test, Test.C, Test.A, Test.B);
// const resultSuccess05 = enumSubset(Test, Test.C, Test.B, Test.A);
// const resultSuccess06 = enumSubset(Test, Test.B, Test.A);
// const resultSuccess07 = enumSubset(Test, Test.A, Test.B);
// const resultSuccess08 = enumSubset(Test, Test.B, Test.C);
// const resultSuccess09 = enumSubset(Test, Test.A);
// const resultSuccess10 = enumSubset(Test, Test.B);
// const resultSuccess11 = enumSubset(Test, Test.C);
// const resultSuccess12 = enumSubset(Test);

// const resultFailure00 = enumSubset(Test, Test.B, Test.B, Test.C, Test.A);
// const resultFailure01 = enumSubset(Test, Test.B, Test.C, Test.A, Test.A);
// const resultFailure02 = enumSubset(Test, Test.B, Test.C, Test.C);
// const resultFailure03 = enumSubset(Test, Test.B, Test.B);
// const resultFailure04 = enumSubset(Test, Test.B, Test.B, Test.B);
// const resultFailure05 = enumSubset(Test, Test.B, Test.A, Test.B);
// const resultFailure06 = enumSubset(Test, Test.B, 'y');
// const resultFailure07 = enumSubset(Test, 'y', Test.B, Test.C, Test.A);

// const resultEither00 = enumSubset(Test, 'a', Test.B, Test.C);
// const resultEither01 = enumSubset(Test, 0, Test.B, Test.C);
