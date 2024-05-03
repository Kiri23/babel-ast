import { parse } from "@babel/parser";
import generate from "@babel/generator";
import traverse from "@babel/traverse";
import * as types from "@babel/types";
import * as fs from "fs";
import * as glob from "glob";
import * as prettier from "prettier";
import * as path from "path";

let flag = false;

const files = glob.sync("../../../flash-cards/src/components/**/*.js");

files.forEach(async (file) => {
  const contents = fs.readFileSync(file).toString();

  const ast = parse(contents, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  // Keep track if any button elements were converted
  // to the Button component.
  let fileContainsButton = false;

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
        fileContainsButton = true;
        const newProps: types.JSXAttribute[] = [];
        openingElement.attributes.forEach((attribute) => {
          if (
            attribute.type === "JSXAttribute" &&
            attribute.name.type === "JSXIdentifier"
          ) {
            switch (attribute.name.name) {
              case "type":
                // The `type` prop now defaults to `"button"` so
                // it only needs to be set if it's something else.
                if (
                  attribute.value?.type !== "StringLiteral" ||
                  attribute.value.value !== "button"
                ) {
                  newProps.push(attribute);
                }
                break;
              case "className": {
                if (attribute.value?.type === "StringLiteral") {
                  // Convert a single string of class names into
                  // an array of individual class names. This assumes
                  // all class names are strings and separated by one
                  // space, which is true for the "Flash" codebase.
                  const classNames = attribute.value.value.split(" ");

                  // Find the class name that controls the style
                  // variant. All the variants follow the pattern
                  // `button--{variant}`. `button--block` also
                  // follows that pattern so it needs to
                  // be ignored. Finally, to get only the
                  // variant, the first `button--` part can
                  // be removed.
                  let variant = classNames.find(
                    (className) =>
                      className.startsWith("button--") &&
                      className !== "button--block"
                  );
                  if (variant) {
                    variant = variant.replace("button--", "");
                  }

                  // The `variant` prop only needs to be set when
                  // it's not `primary` since that's the default.
                  if (variant !== "primary") {
                    // This is an entirely new prop, so we need to
                    // build a new AST node. This can be a bit hard,
                    // which is where `@babel/types` can be used. It
                    // exports "builders" to construct each type of
                    // node in an AST and ensures it's correct.
                    if (variant) {
                      if (!flag) {
                        console.log("attribute", attribute);
                      }
                      newProps.push(
                        types.jsxAttribute(
                          types.jsxIdentifier("variant"),
                          types.stringLiteral(variant)
                        )
                      );
                      if (!flag) {
                        console.log("newProps", newProps);
                      }
                      flag = true;
                    }

                    // The `block` prop only needs to be set when the
                    // `button--block` className was used.
                    if (classNames.includes("button--block")) {
                      // This is another new prop which requires a
                      // new node.
                      newProps.push(
                        types.jsxAttribute(types.jsxIdentifier("block"))
                      );
                    }
                  }
                  break;
                }
              }
              case "onClick":
                // No changes to the `onClick` prop so it
                // can be passed through to the new props.
                newProps.push(attribute);
                break;
            }
          }
        });
        // console.log("newProps", newProps);
        openingElement.name.name = "Button";
        openingElement.attributes = newProps;
        if (closingElement?.name.type === "JSXIdentifier") {
          closingElement.name.name = "Button";
        }
      }
    },
  });

  // When the current file contains a `Button` component,
  // add the necessary import. It only needs to be added
  // once per file, so it's outside the traverse to avoid
  // adding it multiple times.
  if (fileContainsButton) {
    // Construct a relative path from the current file
    // to the `Button` component. Alternatively, this
    // could use a hardcoded absolute path if supported.
    const relativePathToButtonComponent = path.relative(
      // Due to how the relative helper works, the `from`
      // needs to be passed as a directory.
      // See: https://stackoverflow.com/a/31024574/2690790
      path.dirname(file),
      "../flash-cards/src/components/Button/Button.js"
    );

    // Construct a new import statement.
    const buttonComponentImport = types.importDeclaration(
      [
        types.importSpecifier(
          types.identifier("Button"),
          types.identifier("Button")
        ),
      ],
      types.stringLiteral(relativePathToButtonComponent)
    );
    ast.program.body.unshift(buttonComponentImport);
  }

  const { code } = generate(ast);
  const formattedCode = await prettier.format(code, { filepath: file });

  fs.writeFileSync(file, formattedCode);
});
