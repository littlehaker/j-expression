## j-expression

S-expression but in JSON

### S-expression

S-expression is also known as 'symbolic expressions' are a type of notation used to represent structured data, which is commonly used in LISP.

Typical forms of S-expression are like below:

```scheme
;; Strings can be added
(append "Hello " "world!") ; => "Hello world!"

;; If you want to create a literal list of data, use ' to stop it from
;; being evaluated
'(+ 1 2) ; => (quote (+ 1 2)) => (+ 1 2)

;; Now, some arithmetic operations
(+ 1 1)  ; => 2
(- 8 1)  ; => 7

;; `list' is a convenience variadic constructor for lists
(list 1 2 3) ; => '(1 2 3)
```

As we can see, S-expression is all about list. LISP interpreter evals the list to get the result.

### JSON

What's the alternative of list? JSON! We can use JSON to represent S-expression.

```javascript
// String startsWith "$" like "$append" is a symbol live in the Environment, otherwise "Hello " is a string.
// String startsWith "$$" will escape this rule.
["$append", "Hello ", "world!"] // => (append "Hello " "world!") => "Hello world!"
["$append", "$$Hello ", "world!"] // => (append "$Hello " "world!") => "$Hello world!"

["$quote", ["$add", 1, 2]] // => (quote (+ 1 2)) => '(+ 1 2)

["$add", 1, 1] // =>  (+ 1 1)   ["$add", 1, 1] makes more sense than ["$+", 1, 1]
["$subtract", 8, 1] // => (- 8 1)

["$list", 1, 2, 3] // => (list 1 2 3) => '(1 2 3)
```

And `j-expression` is a simple interpreter to eval these expressions.

### Scenario
This kind of expression can be used for dynamic rules.

We can provide a UI/Editor to generate such expression, then eval it to get the return value.

Please check the demo(https://j-expression-editor.vercel.app) and the source code(https://github.com/littlehaker/j-expression-editor) for a simple editor.

![screenshot](https://raw.githubusercontent.com/littlehaker/j-expression-editor/main/docs/screenshot.png)

### Installation

`npm i j-expression`

### Usage

```javascript
import JExpression from "j-expression";
const expr = new JExpression();

expr.eval(["$add", 1, 2]); // => 3

// Custom Environment
expr.define("answer", 42);
expr.eval("$answer"); // => 42
```

### Environment
Environment is where the interpreter accesses the symbols.
- Comparison: `$gt` / `$lt` / `$eq`
```javascript
["$gt", 2, 1] // => true
["$lt", 2, 1] // => false
["$eq", 2, 1] // => false
```
- Computation: `$add` / `$subtract` / `$multiply`  / `$divide`
```javascript
["$add", 2, 1] // => 3
["$subtract", 2, 1] // => 1
["$multiply", 2, 2] // => 4
["$divide", 2, 1] // => 2
```
- Condition: `$if` / `$cond`
```javascript
["$if", true, "foo", "bar"] // => "foo"
["$cond",
  [["$gt", 2, 1], "foo"],
  [["$lt", 2, 3], "bar"],
  [true, "baz"]] // => if 2 > 1 then "foo" else if 2 < 3 then "bar" else baz => "foo"
```
- Boolean: `$and` / `$or` / `$not`
```javascript
["$and", true, false] // => false
["$or", true, false] // => true
["$not", true] // => false
```
- List: `$list`
```javascript
["$list", 1, 2, 3] // => [1, 2, 3]
```
- Definition: `$def`
```javascript
["$def", "$answer", 42]
"$answer" // => 42
```
- Function: `$fn`
```javascript
[
  ["$fn", ["$val"], ["$add", "$val", 1]], // define a function with $val as parameter
  3
] // => 4
```
- Multi Expression: `$do`
```javascript
["$do",
  ["$def", "$inc", ["$fn", ["$val"], ["$add", "$val", 1]]],
  ["$inc", 3]
] // => 4
```

- Eval: `$quote` / `$eval`
```javascript
["$quote", ["$add", 1, 2]] // => ["$add", 1, 2]
["$eval", ["$quote", ["$add", 1, 2]]] // => 3
```

### Lexical Scope
You can use `let` binding to create lexical scopes.
```javascript
["let", ["$a", 1, "$b", 2], // => let a = 1, b = 2
  ["$add", "$a", "$b"]] // => ["$add", 1, 2] => 3
```
Also, you can create nested lexical scopes.
```javascript
["$let", ["$a", 1], // => let a = 1
  ["$let", ["$b", 2], // => let b = 2
    ["$add", "$a", "$b"]]] // => ["$add", 1, 2] => 3
```

### Asynchronous
You can use `evalAsync` to do asynchronous evaluation.

```javascript
expr.define("addAsync", async (a, b) => a + b);
expr.define("deferredValue", Promise.resolve(42));

await expr.evalAsync(["$addAsync", 1, "$deferredValue"]) // => 43
```

### License

MIT
