type Environment = Record<string, any>;
type Expression = any | Expression[];

const defualtEnv: Environment = {
  if: (cond, t, f) => (cond ? t : f),
  gt: (a, b) => a > b,
  lt: (a, b) => a < b,
  eq: (a, b) => a == b,
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  and: (...args) => args.reduce((a, b) => a && b, true),
  or: (...args) => args.reduce((a, b) => a || b, false),
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
        // If String startsWith prefix
        const doublePrefix = `${this.prefix}${this.prefix}`;
        if (x.startsWith(`${this.prefix}${this.prefix}`)) {
          return x.replace(doublePrefix, this.prefix);
        } else {
          // Symbol
          const symbol = x.replace(this.prefix, "");
          return this.env[symbol];
        }
      } else {
        // String
        return x;
      }
    } else if (!(x instanceof Array)) {
      // Value
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
        // Function call
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
  async evalAsync(x: Expression): Promise<any> {
    if (typeof x === "string") {
      if (x.startsWith(this.prefix)) {
        // If String startsWith prefix
        const doublePrefix = `${this.prefix}${this.prefix}`;
        if (x.startsWith(`${this.prefix}${this.prefix}`)) {
          return Promise.resolve(x.replace(doublePrefix, this.prefix));
        } else {
          // Symbol
          const symbol = x.replace(this.prefix, "");
          return Promise.resolve(this.env[symbol]);
        }
      } else {
        // String
        return Promise.resolve(x);
      }
    } else if (!(x instanceof Array)) {
      // Literal
      return Promise.resolve(x);
    } else {
      // Cond
      if (x[0] === `${this.prefix}cond`) {
        const conditions = x.slice(1);
        for (const [cond, val] of conditions) {
          if (await this.evalAsync(cond)) {
            return await this.evalAsync(val);
          }
        }
      } else if (x[0] === `${this.prefix}quote`) {
        // Quote
        return Promise.resolve(x[1]);
      } else if (x[0] === `${this.prefix}eval`) {
        // Eval
        return await this.evalAsync(await this.evalAsync(x[1]));
      } else {
        const proc = await this.evalAsync(x[0]);
        if (!(proc instanceof Function)) {
          throw new Error(`${x[0]} is not a function`);
        }
        const args = await Promise.all(
          x.slice(1).map((arg) => {
            return this.evalAsync(arg);
          })
        );
        return Promise.resolve(proc(...args));
      }
    }
  }
}
