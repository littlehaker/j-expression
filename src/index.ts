type Environment = Record<string, any>;
type Expression = any | Expression[];

const defualtEnv: Environment = {
  if: (cond, t, f) => (cond ? t : f),
  gt: (a, b) => a > b,
  lt: (a, b) => a < b,
  eq: (a, b) => a == b,
  add: (a, b) => a + b,
  minus: (a, b) => a - b,
  and: (...args) => args.reduce((a, b) => a && b, true),
  val: 15,
  list: (...list) => {
    return list;
  },
};

export default class JExpression {
  prefix = "$";
  env: Environment;
  constructor(_env: Environment = {}) {
    this.env = Object.assign({}, _env, defualtEnv);
  }
  define(symbol: string, val: any) {
    this.env[symbol] = val;
  }
  eval(x: Expression): any {
    if (typeof x === "string") {
      if (x.startsWith(this.prefix)) {
        // Symbol
        const symbol = x.replace(this.prefix, "");
        return this.env[symbol];
      } else {
        // String
        // TODO: If String startsWith prefix
        return x;
      }
    } else if (!(x instanceof Array)) {
      // Literal
      return x;
    } else {
      // Cond
      if (x[0] === `${this.prefix}cond`) {
        const conditions = x.slice(1);
        for (const [cond, val] of conditions) {
          if (this.eval(cond)) {
            return this.eval(val);
          }
        }
      } else if (x[0] === `${this.prefix}quote`) {
        // Quote
        return x[1];
      } else if (x[0] === `${this.prefix}eval`) {
        // Eval
        return this.eval(this.eval(x[1]));
      } else {
        const proc = this.eval(x[0]);
        if (!(proc instanceof Function)) {
          throw new Error(`${x[0]} is not a function`);
        }
        const args = x.slice(1).map((arg) => {
          return this.eval(arg);
        });
        return proc(...args);
      }
    }
  }
}
