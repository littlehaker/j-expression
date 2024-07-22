import JExpression from "../src";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let expr;

beforeAll(() => {
  expr = new JExpression();
});

test("types", () => {
  // Number
  expect(expr.eval(1)).toBe(1);
  // Symbol
  expect(expr.eval("$add")).toBeInstanceOf(Function);
  // String
  expect(expr.eval("one")).toBe("one");
  expect(expr.eval("$$add")).toBe("$add"); // String with prefix
  // Boolean
  expect(expr.eval(true)).toBe(true);
});

test("default env", () => {
  // Computation
  expect(expr.eval(["$add", 1, 2])).toBe(3);
  expect(expr.eval(["$subtract", 2, 1])).toBe(1);
  expect(expr.eval(["$multiply", 2, 2])).toBe(4);
  expect(expr.eval(["$divide", 2, 1])).toBe(2);

  // Comparision
  expect(expr.eval(["$gt", 2, 1])).toBe(true);
  expect(expr.eval(["$lt", 2, 1])).toBe(false);
  expect(expr.eval(["$eq", 1, 1])).toBe(true);

  expect(expr.eval(["$if", true, "foo", "bar"])).toBe("foo");
  expect(expr.eval(["$if", false, "foo", "bar"])).toBe("bar");

  expect(expr.eval(["$and", true, false])).toBe(false);
  expect(expr.eval(["$and", true, true])).toBe(true);
  expect(expr.eval(["$and", false, false])).toBe(false);

  expect(expr.eval(["$or", true, false])).toBe(true);
  expect(expr.eval(["$or", true, true])).toBe(true);
  expect(expr.eval(["$or", false, false])).toBe(false);

  expect(expr.eval(["$list", 1, 2])).toEqual([1, 2]);
  expect(expr.eval(["$list", ["$add", 1, 2], 2])).toEqual([3, 2]);
});

test("$fn", () => {
  expect(
    expr.eval([["$fn", ["$a", "$b"], ["$list", "$a", "$b"]], 1, 2])
  ).toEqual([1, 2]);
});

test("$cond", () => {
  expect(
    expr.eval(["$cond", [["$gt", ["$add", 1, 2], 1], "foo"], [true, "bar"]])
  ).toBe("foo");
  expect(
    expr.eval(["$cond", [["$gt", ["$add", 1, 2], 4], "foo"], [true, "bar"]])
  ).toBe("bar");
});

test("$let", () => {
  expect(expr.eval(["$let", ["$a", 1], "$a"])).toBe(1);
  expect(expr.eval(["$let", ["$a", 2, "$b", 3], ["$add", "$a", "$b"]])).toBe(5);
  expect(expr.eval(["$let", ["$a", 1, "$b", ["$add", "$a", 1]], "$b"])).toBe(2);
  // Nested let bindings
  expect(
    expr.eval(["$let", ["$a", 1], ["$let", ["$b", 2], ["$add", "$a", "$b"]]])
  ).toBe(3);
});

test("$quote", () => {
  expect(expr.eval(["$quote", ["$add", 1, 2]])).toEqual(["$add", 1, 2]);
});

test("$eval", () => {
  expect(expr.eval(["$eval", ["$quote", ["$add", 1, 2]]])).toBe(3);
});

test("define", () => {
  expr.define("answer", 42);
  expect(expr.eval("$answer")).toBe(42);
});

test("not a function call error", () => {
  expect(() => expr.eval(["$unknown", 1, 2])).toThrow(
    "$unknown is not a function"
  );
});

test("async", async () => {
  expr.define("deferred", Promise.resolve(42));
  expect(await expr.evalAsync("$deferred")).toBe(42);

  expect(await expr.evalAsync("$$add")).toBe("$add"); // String with prefix

  expr.define("addAsync", async (a, b) => {
    await sleep(10);
    return a + b;
  });

  // Function
  expect(
    await expr.evalAsync([
      ["$fn", ["$a", "$b"], ["$addAsync", "$a", "$b"]],
      1,
      2,
    ])
  ).toBe(3);

  // Condition
  expect(
    await expr.evalAsync([
      "$cond",
      [["$gt", ["$addAsync", 1, 2], 1], "foo"],
      [true, "bar"],
    ])
  ).toBe("foo");

  // Eval & Quote
  expect(await expr.evalAsync(["$eval", ["$quote", ["$addAsync", 1, 2]]])).toBe(
    3
  );

  // Let
  expect(
    await expr.evalAsync([
      "$let",
      ["$a", 1, "$b", ["$addAsync", "$a", "$deferred"]],
      "$b",
    ])
  ).toBe(43);

  // Thrown
  expect(expr.evalAsync(["$unknown", 1, 2])).rejects.toThrow(
    "$unknown is not a function"
  );
});
