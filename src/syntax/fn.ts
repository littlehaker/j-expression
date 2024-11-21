import JExpression, { SyntaxHandler, Expression, Environment } from '../index';

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
    };
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
    };
  },
};

export default fnSyntax;