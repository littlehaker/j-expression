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
  _resolve(x: Expression, isAsync: boolean) {
    if (isAsync) {
      return Promise.resolve(x);
    } else {
      return x;
    }
  }
  _eval(x: Expression, isAsync: boolean): any {
    if (typeof x === "string") {
      if (x.startsWith(this.prefix)) {
        // If String startsWith prefix
        const doublePrefix = `${this.prefix}${this.prefix}`;
        if (x.startsWith(`${this.prefix}${this.prefix}`)) {
          return this._resolve(x.replace(doublePrefix, this.prefix), isAsync);
        } else {
          // Symbol
          const symbol = x.replace(this.prefix, "");
          return this._resolve(this.env[symbol], isAsync);
        }
      } else {
        // String
        return this._resolve(x, isAsync);
      }
    } else if (!(x instanceof Array)) {
      // Value
      return this._resolve(x, isAsync);
    } else {
      // Cond
      if (x[0] === `${this.prefix}cond`) {
        const conditions = x.slice(1);
        for (const [cond, val] of conditions) {
          if (this._eval(cond, isAsync)) {
            return this._eval(val, isAsync);
          }
        }
      } else if (x[0] === `${this.prefix}quote`) {
        // Quote
        return this._resolve(x[1], isAsync);
      } else if (x[0] === `${this.prefix}eval`) {
        // Eval
        if (isAsync) {
          return (async () => {
            return await this._eval(await this._eval(x[1], isAsync), isAsync);
          })();
        } else {
          return this._eval(this._eval(x[1], isAsync), isAsync);
        }
      } else {
        // Function call
        if (isAsync) {
          return (async () => {
            const proc = await this._eval(x[0], isAsync);
            if (!(proc instanceof Function)) {
              throw new Error(`${x[0]} is not a function`);
            }
            const args = await Promise.all(
              x.slice(1).map((arg) => {
                return this._eval(arg, isAsync);
              })
            );
            return this._resolve(proc(...args), isAsync);
          })();
        } else {
          const proc = this._eval(x[0], isAsync);
          if (!(proc instanceof Function)) {
            throw new Error(`${x[0]} is not a function`);
          }
          const args = x.slice(1).map((arg) => {
            return this._eval(arg, isAsync);
          });
          return this._resolve(proc(...args), isAsync);
        }
      }
    }
  }
  eval(x: Expression): any {
    return this._eval(x, false);
  }
  async evalAsync(x: Expression): Promise<any> {
    return await this._eval(x, true);
  }
}
