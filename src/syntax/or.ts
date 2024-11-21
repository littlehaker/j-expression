import JExpression, { SyntaxHandler, Expression, Environment } from '../index';

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

export default orSyntax;