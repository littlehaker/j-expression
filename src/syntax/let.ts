import JExpression, { SyntaxHandler, Expression, Environment } from '../index';

const letSyntax: SyntaxHandler = {
  // ["$let", ["$a", 1, "$b", 2], ["$add", "$a", "$b"]] => 3
  sync: (j: JExpression, x: Expression[], env: Environment) => {
    const newEnv = Object.assign({}, env);
    for (let i = 0; i < x[0].length; i++) {
      const item = x[0][i];
      if (i % 2 === 1) {
        const symbolStr = j.getSymbolString(x[0][i - 1]);
        // 绑定新环境
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
        // 绑定新环境
        newEnv[symbolStr] = await j._eval(item, true, newEnv);
      }
    }
    return await j._eval(x[1], true, newEnv);
  },
};

export default letSyntax;