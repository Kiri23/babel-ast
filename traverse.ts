import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

const code = "2 + (4 * 10)";

const ast = parse(code);

traverse(ast, {
  NumericLiteral(path) {
    console.log(path.node);
  },
  BinaryExpression(path) {
    // console.log(path.node.operator);
  },
});
