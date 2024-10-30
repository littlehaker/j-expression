type Environment = Record<string, any>;
type Expression = any | Expression[];

const defualtEnv: Environment = {
  gt: (a: number, b: number) => a > b,
  lt: (a: number, b: number) => a < b,
  eq: (a: any, b: any) => a == b,
  add: (a: number, b: number) => a + b,
  subtract: (a: number, b: number) => a - b,
  multiply: (a: number, b: number) => a * b,
  divide: (a: number, b: number) => a / b,
  not: (val: boolean) => !val,
  list: (...list: any[]) => {
    return list;
  },
};

interface SyntaxHandler {
  sync: (j: JExpression, args: Expression[], env: Environment) => any;
  async: (j: JExpression, args: Expression[], env: Environment) => Promise<any>;
}

const condSyntax: SyntaxHandler = {
  sync: (j: JExpression, conditions: Expression[], env: Environment) => {
    for (const [cond, val] of conditions) {
      if (j._eval(cond, false, env)) {
        return j._eval(val, false, env);
      }
    }
  },
  async: async (j: JExpression, conditions: Expression[], env: Environment) => {
    for (const [cond, val] of conditions) {
      if (await j._eval(cond, true, env)) {
        return j._eval(val, true, env);
      }
    }
  },
};

const ifSyntax: SyntaxHandler = {
  // ["$if", true, "then", "else"]
  sync: (j: JExpression, x: Expression[], env: Environment) => {
    const [cond, t, f] = x
    if (j._eval(cond, false, env)) {
      return j._eval(t, false, env);
    } else {
      return j._eval(f, false, env);
    }
  },
  async: async (j: JExpression, x: Expression[], env: Environment) => {
    console.log(x);
    const [cond, t, f] = x
    if (await j._eval(cond, true, env)) {
      return j._eval(t, true, env);
    } else {
      return j._eval(f, true, env);
    }
  }
}

const andSyntax: SyntaxHandler = {
  // ["$and", true, false] => false
  sync: (j: JExpression, x: Expression[], env: Environment) => {
    for (const exp of x) {
      if (!j._eval(exp, false, env)) {
        return false;
      }
    }
    return true;
  },
  async: async (j: JExpression, x: Expression[], env: Environment) => {
    for (const exp of x) {
      if (!(await j._eval(exp, true, env))) {
        return false;
      }
    }
    return true;
  },
};

const orSyntax: SyntaxHandler = {
  // ["$or", true, false] => true
  sync: (j: JExpression, x: Expression[], env: Environment) => {
    for (const exp of x) {
      if (j._eval(exp, false, env)) {
        return true;
      }
    }
    return false;
  },
  async: async (j: JExpression, x: Expression[], env: Environment) => {
    for (const exp of x) {
      if (await j._eval(exp, true, env)) {
        return true;
      }
    }
    return false;
  },
};

const quoteSyntax: SyntaxHandler = {
  // ["$quote", "$foo"] => "$foo"
  sync: (_j: JExpression, x: Expression[], _env: Environment) => {
    return x[0];
  },
  async: async (_j: JExpression, x: Expression[], _env: Environment) => {
    return Promise.resolve(x[0]);
  },
};

const evalSyntax: SyntaxHandler = {
  // ["$eval", ["$quote", ["$add", 1, 2]]] => 3
  sync: (j: JExpression, x: Expression[], env: Environment) => {
    return j._eval(j._eval(x[0], false, env), false, env);
  },
  async: async (j: JExpression, x: Expression[], env: Environment) => {
    return await j._eval(await j._eval(x[0], true, env), true, env);
  },
};

const defineSyntax: SyntaxHandler = {
  sync: (j: JExpression, x: Expression[], env: Environment) => {
    const symbolStr = j.getSymbolString(x[0]);
    const val = j._eval(x[1], false, env);
    env[symbolStr] = val;
    return val;
  },
  async: async (j: JExpression, x: Expression[], env: Environment) => {
    const symbolStr = j.getSymbolString(x[0]);
    const val = await j._eval(x[1], true, env);
    env[symbolStr] = val;
    return val;
  },
};

const doSyntax: SyntaxHandler = {
  // ["$do", ["$add", 1, 2], ["$add", 3, 4]] => 7
  sync: (j: JExpression, segments: Expression[], env: Environment) => {
    for (let i = 0; i < segments.length; i++) {
      const exp = segments[i];
      const ret = j._eval(exp, false, env);
      if (i === segments.length - 1) {
        return ret;
      }
    }
  },
  async: async (j: JExpression, segments: Expression[], env: Environment) => {
    for (let i = 0; i < segments.length; i++) {
      const exp = segments[i];
      const ret = await j._eval(exp, true, env);
      if (i === segments.length - 1) {
        return ret;
      }
    }
  },
};

const fnSyntax: SyntaxHandler = {
  // [["$fn", ["$a", "$b"], ["$add", "$a", "$b"]], 1, 2] => 3
  sync: (j: JExpression, x: Expression[], env: Environment) => {
    return (...args: any) => {
      const newEnv: Environment = Object.assign({}, env);
      const variables = x[0];
      variables.forEach((variable, i) => {
        const symbolStr = j.getSymbolString(variable);
        newEnv[symbolStr] = args[i];
      });
      return j._eval(x[1], false, newEnv);
    }
  },
  async: async (j: JExpression, x: Expression[], env: Environment) => {
    return async (...args: any) => {
      const newEnv: Environment = Object.assign({}, env);
      const variables = x[0];
      variables.forEach((variable, i) => {
        const symbolStr = j.getSymbolString(variable);
        newEnv[symbolStr] = args[i];
      });
      return await j._eval(x[1], true, newEnv);
    }
  }
}

const letSyntax: SyntaxHandler = {
  // ["$let", ["$a", 1, "$b", 2], ["$add", "$a", "$b"]] => 3
  sync: (j: JExpression, x: Expression[], env: Environment) => {
    const newEnv = Object.assign({}, env);
    for (let i = 0; i < x[0].length; i++) {
      const item = x[0][i];
      if (i % 2 === 1) {
        const symbolStr = j.getSymbolString(x[0][i - 1]);
        // Bind new Environment
        newEnv[symbolStr] = j._eval(item, false, newEnv);
      }
    }
    return j._eval(x[1], false, newEnv);
  },
  async: async (j: JExpression, x: Expression[], env: Environment) => {
    const newEnv = Object.assign({}, env);
    for (let i = 0; i < x[0].length; i++) {
      const item = x[0][i];
      if (i % 2 === 1) {
        const symbolStr = j.getSymbolString(x[0][i - 1]);
        // Bind new Environment
        newEnv[symbolStr] = await j._eval(item, true, newEnv);
      }
    }
    return await j._eval(x[1], true, newEnv);
  },
}

export default class JExpression {
  prefix = "$";
  env: Environment;
  syntax: Record<string, SyntaxHandler>;
  constructor(_env: Environment = {}) {
    this.env = Object.assign({}, _env, defualtEnv);
    this.syntax = {};
    this.initSyntax();
  }
  initSyntax() {
    this.defineSyntax("cond", condSyntax);
    this.defineSyntax("if", ifSyntax);
    this.defineSyntax("and", andSyntax);
    this.defineSyntax("or", orSyntax);
    this.defineSyntax("quote", quoteSyntax);
    this.defineSyntax("eval", evalSyntax);
    this.defineSyntax("def", defineSyntax);
    this.defineSyntax("do", doSyntax);
    this.defineSyntax("fn", fnSyntax);
    this.defineSyntax("let", letSyntax);
  }
  define(symbol: string, val: any) {
    this.env[symbol] = val;
  }
  defineSyntax(
    syntax: string,
    handler: SyntaxHandler
  ) {
    this.syntax[syntax] = handler;
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
        if (x.startsWith(doublePrefix)) {
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
      // Syntax
      const syntax = x[0];
      if (typeof syntax === "string") {
        const syntaxStr = this.getSymbolString(syntax);
        const handler = this.syntax[syntaxStr];
        if (handler) {
          if (isAsync) {
            return handler.async(this, x.slice(1), env);
          } else {
            return handler.sync(this, x.slice(1), env);
          }
        }
      }

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
  eval(x: Expression): any {
    return this._eval(x, false, this.env);
  }
  async evalAsync(x: Expression): Promise<any> {
    return await this._eval(x, true, this.env);
  }
}
