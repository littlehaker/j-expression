import JExpression, { SyntaxHandler, Expression, Environment } from '../index';

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

export default andSyntax;