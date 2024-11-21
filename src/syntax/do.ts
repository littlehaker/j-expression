import JExpression, { SyntaxHandler, Expression, Environment } from '../index';

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

export default doSyntax;