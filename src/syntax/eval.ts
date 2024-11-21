import JExpression, { SyntaxHandler, Expression, Environment } from '../index';

const evalSyntax: SyntaxHandler = {
  // ["$eval", ["$quote", ["$add", 1, 2]]] => 3
  sync: (j: JExpression, x: Expression[], env: Environment) => {
    return j._eval(j._eval(x[0], false, env), false, env);
  },
  async: async (j: JExpression, x: Expression[], env: Environment) => {
    return await j._eval(await j._eval(x[0], true, env), true, env);
  },
};

export default evalSyntax;