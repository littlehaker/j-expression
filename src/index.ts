type Environment = Record<string, any>;
type Expression = any | Expression[];

const defualtEnv: Environment = {
  if: (cond: boolean, t: any, f: any) => (cond ? t : f),
  gt: (a: number, b: number) => a > b,
  lt: (a: number, b: number) => a < b,
  eq: (a: any, b: any) => a == b,
  add: (a: number, b: number) => a + b,
  subtract: (a: number, b: number) => a - b,
  multiply: (a: number, b: number) => a * b,
  divide: (a: number, b: number) => a / b,
  and: (...args: boolean[]) => args.reduce((a, b) => a && b, true),
  or: (...args: boolean[]) => args.reduce((a, b) => a || b, false),
  list: (...list: any[]) => {
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
  getSymbolString(s: string) {
    return s.replace(this.prefix, "");
  }
  _eval(x: Expression, isAsync: boolean, env: Environment): any {
    if (typeof x === "string") {
      if (x.startsWith(this.prefix)) {
        // If String startsWith prefix
        const doublePrefix = `${this.prefix}${this.prefix}`;
        if (x.startsWith(`${this.prefix}${this.prefix}`)) {
          return this._resolve(x.replace(doublePrefix, this.prefix), isAsync);
        } else {
          // Symbol
          const symbol = this.getSymbolString(x);
          return this._resolve(env[symbol], isAsync);
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
          if (this._eval(cond, isAsync, env)) {
            return this._eval(val, isAsync, env);
          }
        }
      } else if (
        x[0] === `${this.prefix}fn` ||
        x[0] === `${this.prefix}lambda`
      ) {
        // Function / Lambda
        // ["$fn", ["$a", "$b"], ["$add", "$a", "$b"]]
        return (...args) => {
          const newEnv = Object.assign({}, env);
          // Binding parameters to function arguments
          x[1].forEach((item, i) => {
            newEnv[this.getSymbolString(item)] = args[i];
          });
          return this._eval(x[2], isAsync, newEnv);
        };
      } else if (x[0] === `${this.prefix}quote`) {
        // Quote
        return this._resolve(x[1], isAsync);
      } else if (x[0] === `${this.prefix}eval`) {
        // Eval
        if (isAsync) {
          return (async () => {
            return await this._eval(
              await this._eval(x[1], isAsync, env),
              isAsync,
              env
            );
          })();
        } else {
          return this._eval(this._eval(x[1], isAsync, env), isAsync, env);
        }
      } else if (x[0] === `${this.prefix}let`) {
        const newEnv = Object.assign({}, env);
        // Let bindings, lexical scope
        // ["$let", ["$a", 1, "$b", 2], ["$add", "$a", "$b"]]
        if (isAsync) {
          // ["$a", 1, "$b", 2]
          return (async () => {
            for (let i = 0; i < x[1].length; i++) {
              const item = x[1][i];
              if (i % 2 === 1) {
                const symbolStr = this.getSymbolString(x[1][i - 1]);
                // Bind new Environment
                newEnv[symbolStr] = await this._eval(item, isAsync, newEnv);
              }
            }
            return this._eval(x[2], isAsync, newEnv);
          })();
        } else {
          // ["$a", 1, "$b", 2]
          for (let i = 0; i < x[1].length; i++) {
            const item = x[1][i];
            if (i % 2 === 1) {
              const symbolStr = this.getSymbolString(x[1][i - 1]);
              // Bind new Environment
              newEnv[symbolStr] = this._eval(item, isAsync, newEnv);
            }
          }
          return this._eval(x[2], isAsync, newEnv);
        }
      } else {
        // Function call
        if (isAsync) {
          return (async () => {
            const proc = await this._eval(x[0], isAsync, env);
            if (!(proc instanceof Function)) {
              throw new Error(`${x[0]} is not a function`);
            }
            const args = await Promise.all(
              x.slice(1).map((arg) => {
                return this._eval(arg, isAsync, env);
              })
            );
            return this._resolve(proc(...args), isAsync);
          })();
        } else {
          const proc = this._eval(x[0], isAsync, env);
          if (!(proc instanceof Function)) {
            throw new Error(`${x[0]} is not a function`);
          }
          const args = x.slice(1).map((arg) => {
            return this._eval(arg, isAsync, env);
          });
          return this._resolve(proc(...args), isAsync);
        }
      }
    }
  }
  eval(x: Expression): any {
    return this._eval(x, false, this.env);
  }
  async evalAsync(x: Expression): Promise<any> {
    return await this._eval(x, true, this.env);
  }
}
