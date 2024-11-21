import condSyntax from './syntax/cond';
import ifSyntax from './syntax/if';
import andSyntax from './syntax/and';
import orSyntax from './syntax/or';
import quoteSyntax from './syntax/quote';
import evalSyntax from './syntax/eval';
import defineSyntax from './syntax/define';
import doSyntax from './syntax/do';
import fnSyntax from './syntax/fn';
import letSyntax from './syntax/let';

export type Environment = Record<string, any>;
export type Expression = any | Expression[];

export interface SyntaxHandler {
  sync: (j: JExpression, args: Expression[], env: Environment) => any;
  async: (j: JExpression, args: Expression[], env: Environment) => Promise<any>;
}

const defaultEnv: Environment = {
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

export default class JExpression {
  prefix = "$";
  env: Environment;
  syntax: Record<string, SyntaxHandler>;
  constructor(_env: Environment = {}) {
    this.env = Object.assign({}, _env, defaultEnv);
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