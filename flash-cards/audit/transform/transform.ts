import { parse } from "@babel/parser";
import generate from "@babel/generator";
import traverse from "@babel/traverse";
import * as fs from "fs";
import * as glob from "glob";

const files = glob.sync("../../../flash-cards/src/components/**/*.js");

files.forEach((file) => {
  const contents = fs.readFileSync(file).toString();

  const ast = parse(contents, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  traverse(ast, {
    JSXElement({ node }) {
      const { openingElement, closingElement } = node;

      if (
        openingElement.name.type === "JSXIdentifier" &&
        openingElement.name.name === "button"
      ) {
        const hasButtonClassName = openingElement.attributes.find(
          (attribute) => {
            return (
              attribute.type === "JSXAttribute" &&
              attribute.name.type === "JSXIdentifier" &&
              attribute.name.name === "className" &&
              attribute.value?.type === "StringLiteral" &&
              attribute.value.value.split(" ").includes("button")
            );
          }
        );

        if (!hasButtonClassName) return;

        openingElement.name.name = "Button";
        if (closingElement?.name.type === "JSXIdentifier") {
          closingElement.name.name = "Button";
        }
      }
    },
  });

  const { code } = generate(ast);

  fs.writeFileSync(file, code);
});
