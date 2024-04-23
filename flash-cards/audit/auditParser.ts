import * as fs from "fs";
import * as glob from "glob";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import { ReturnStatement } from "@babel/types";
console.log("Hey");

// First, find all files relevant files. This glob pattern
// assumes this project is a sibling to the sample codebase.
const files = glob.sync("../src/components/**/*.js");

const file = files[0];
// Read the contents of the first file in the list.
const content = fs.readFileSync(file, "utf8");

// Parse the file content to generate an Abstract Syntax Tree (AST).
const ast = parse(content, {
  sourceType: "module", // Since we're dealing with ES modules
  plugins: [
    "jsx", // Enable JSX parsing
    "typescript", // Enable TypeScript parsing
  ],
});

console.log(content);

const exportNamedDeclaration = ast.program.body[1];

if (
  exportNamedDeclaration.type === "ExportNamedDeclaration" &&
  exportNamedDeclaration.declaration?.type === "VariableDeclaration"
) {
  const variableDeclarator = exportNamedDeclaration.declaration.declarations[0];

  if (
    variableDeclarator.init?.type === "ArrowFunctionExpression" ||
    variableDeclarator.init?.type === "FunctionExpression"
  ) {
    console.log("The const variable exports a React component.");
    //log the body of the block statement
    console.log(variableDeclarator.init.body);
    if (variableDeclarator.init.body.type === "BlockStatement") {
      const returnStatement = variableDeclarator.init.body.body.find(
        (statement): statement is ReturnStatement =>
          statement.type === "ReturnStatement"
      );
      if (returnStatement && returnStatement.argument) {
        console.log("Return statement argument:", returnStatement.argument);
      }
    }
  } else {
    console.log("The exported const is not a React component.");
  }
} else {
  console.log(
    "The second item in the body is not an export named declaration of a const variable."
  );
}
