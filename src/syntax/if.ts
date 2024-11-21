import JExpression, { SyntaxHandler, Expression, Environment } from '../index';

// ["$if", true, "then", "else"]
const ifSyntax: SyntaxHandler = {
  sync: (j: JExpression, x: Expression[], env: Environment) => {
    const [cond, t, f] = x;
    if (j._eval(cond, false, env)) {
      return j._eval(t, false, env);
    } else {
      return j._eval(f, false, env);
    }
  },
  async: async (j: JExpression, x: Expression[], env: Environment) => {
    const [cond, t, f] = x;
    if (await j._eval(cond, true, env)) {
      return j._eval(t, true, env);
    } else {
      return j._eval(f, true, env);
    }
  },
};

export default ifSyntax;