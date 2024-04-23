import * as fs from "fs";
import * as glob from "glob";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
console.log("Hey");

// First, find all files relevant files. This glob pattern
// assumes this project is a sibling to the sample codebase.
const files = glob.sync("../src/components/**/*.js");
const propsAndValues: Record<string, string[]> = {};

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const ast = parse(content, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  traverse(ast, {
    JSXOpeningElement({ node }) {
      // Find JSX elements that open as a button (eg: `<button>`)
      if (node.name.type === "JSXIdentifier" && node.name.name === "button") {
        node.attributes.forEach((attribute) => {
          // Loop through each of the attributes. For this
          // purpose, we only care about JSXAttribute nodes.
          // There can also be JSXSpreadAttribute nodes, but
          // that's not used with buttons in this codebase
          // (eg: `<button {...props}>`).
          if (
            attribute.type === "JSXAttribute" &&
            attribute.name.type === "JSXIdentifier"
          ) {
            const propName = attribute.name.name;

            let value;
            if (attribute.value && attribute.value.type === "StringLiteral") {
              // Specifically track the string value if
              // a prop's value is a string literal.
              value = attribute.value.value;
            } else {
              // For more complex types, use the node's
              // type as the value. If needed, a case for
              // each node type could be added for a more
              // advanced audit.
              value = attribute.value?.type;
            }
            if (
              attribute.name.name === "onClick" &&
              attribute.value?.type === "JSXExpressionContainer"
            ) {
              const expression = attribute.value.expression;
              if (expression.type === "ArrowFunctionExpression") {
                console.log(
                  `Arrow function found in onClick of button in file ${file} at line ${node.loc?.start.line}`
                );
                console.log(
                  `Parameters: ${expression.params
                    .map((param) => param.type)
                    .join(", ")}`
                );
                console.log(`Expression variable: ${expression}`);
                if (expression.body.type === "CallExpression") {
                  console.log(expression.body);
                } else {
                  console.log(
                    `Function called in onClick: ${expression.body.type}`
                  );
                }
              }
              // Globally track the props and values used.
              if (propsAndValues[propName]) {
                if (value !== undefined) {
                  propsAndValues[propName].push(value);
                }
              } else {
                if (value !== undefined) {
                  propsAndValues[propName] = [value];
                }
              }
            }
          }
        }); // Closes node.attributes.forEach
      } // Closes if (node.name.type === "JSXIdentifier" && node.name.name === "button")
    }, // Closes traverse(ast, {
  }); // Closes files.forEach
}); // Closes glob.sync callback

// Log the props and their values with some formatting.
// The exact logging and formatting likely depends on what
// you're trying to audit in the code.
console.log(`button element audit:`);

for (let propName in propsAndValues) {
  console.group();
  console.log(`${propName} (${propsAndValues[propName].length} total):`);
  console.group();

  for (let value in propsAndValues[propName].sort()) {
    console.log(propsAndValues[propName][value]);
  }

  console.groupEnd();
  console.groupEnd();
}
