import JExpression, { SyntaxHandler, Expression, Environment } from '../index';

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

export default defineSyntax;