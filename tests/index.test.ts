import JExpression from "../src";

let expr;

beforeAll(() => {
  expr = new JExpression();
});

test("types", () => {
  // number
  expect(expr.eval(1)).toBe(1);
  // symbol
  expect(expr.eval("$add")).toBeInstanceOf(Function);
  // string
  expect(expr.eval("one")).toBe("one");
  expect(expr.eval("$$add")).toBe("$add"); // string with prefix
  // boolean
  expect(expr.eval(true)).toBe(true);
});

test("default env", () => {
  expect(expr.eval(["$add", 1, 2])).toBe(3);
  expect(expr.eval(["$minus", 2, 1])).toBe(1);
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

test("$cond", () => {
  expect(
    expr.eval(["$cond", [["$gt", ["$add", 1, 2], 1], "foo"], [true, "bar"]])
  ).toBe("foo");
  expect(
    expr.eval(["$cond", [["$gt", ["$add", 1, 2], 4], "foo"], [true, "bar"]])
  ).toBe("bar");
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

  expect(await expr.evalAsync("$$add")).toBe("$add"); // string with prefix

  // condition
  expr.define("addAsync", async (a, b) => a + b);
  expect(
    await expr.evalAsync([
      "$cond",
      [["$gt", ["$addAsync", 1, 2], 1], "foo"],
      [true, "bar"],
    ])
  ).toBe("foo");

  // eval & quote
  expect(await expr.evalAsync(["$eval", ["$quote", ["$addAsync", 1, 2]]])).toBe(
    3
  );

  // thrown
  expect(expr.evalAsync(["$unknown", 1, 2])).rejects.toThrow(
    "$unknown is not a function"
  );
});
