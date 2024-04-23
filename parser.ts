import { parse } from "@babel/parser";

const code = "2 + (4 * 10)";

const ast = parse(code);

const [statement] = ast.program.body;

if (statement.type === "ExpressionStatement") {
  if (statement.expression.type === "BinaryExpression") {
    console.log("left", statement.expression.left);
    console.log("operator", statement.expression.operator);
    console.log("right", statement.expression.right);
    console.log("NEW statement below");
    console.log("NEW statement below");
    console.log("NEW statement below");
    if (statement.expression.right.type === "BinaryExpression") {
      console.log("left", statement.expression.right.left);
      console.log("operator", statement.expression.right.operator);
      console.log("right", statement.expression.right.right);
    }
  }
}
