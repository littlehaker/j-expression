import JExpression, { SyntaxHandler, Expression, Environment } from '../index';

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

export default condSyntax;