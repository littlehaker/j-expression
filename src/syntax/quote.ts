import JExpression, { SyntaxHandler, Expression, Environment } from '../index';

const quoteSyntax: SyntaxHandler = {
  // ["$quote", "$foo"] => "$foo"
  sync: (_j: JExpression, x: Expression[], _env: Environment) => {
    return x[0];
  },
  async: async (_j: JExpression, x: Expression[], _env: Environment) => {
    return Promise.resolve(x[0]);
  },
};

export default quoteSyntax;