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
["$append", "Hello ", 'world!'] // => (append "Hello " "world!")

["$quote", ["$add", 1, 2]] // => (quote (+ 1 2)) => '(+ 1 2)

["$add", 1, 1] // =>  (+ 1 1)   ["$add", 1, 1] makes more sense than ["$+", 1, 1]
["$minus", 8, 1] // => (- 8 1)

["$list", 1, 2, 3] // => (list 1 2 3) => '(1 2 3)
```

And `j-expression` is a simple interpreter to eval these expressions.

### Install

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
- Computation: `$add` / `$minus`
```javascript
["$add", 2, 1] // => 3
["$minus", 2, 1] // => 1
["$add", "foo", "bar"] // => "foobar"
```
- Condition: `$if` / `$cond`
```javascript
["$if", true, "foo", "bar"] // => "foo"
["$cond",
  [["$gt", 2, 1], "foo"],
  [["$lt", 2, 3], "bar"],
  [true, "baz"]] // => if 2 > 1 then "foo" else if 2 < 3 then "bar" else baz => "foo"
```
- Boolean: `$and` / `$or`
```javascript
["$and", true, false, true] // => false
["$or", true, false, true] // => true
```
- List: `$list`
```javascript
["$list", 1, 2, 3] // => [1, 2, 3]
```
- Eval: `$quote` / `$eval`
```javascript
["$quote", ["$add", 1, 2]] // => ["$add", 1, 2]
["$eval", ["$quote", ["$add", 1, 2]]] // => 3
```

### Limitation
- No lexical scope
- Dynamic scope only
- Poor default environment but easy to extend

### License

MIT
