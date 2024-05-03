import { JSXAttribute, Transform } from "jscodeshift";
import * as path from "path";
import * as prettier from "prettier";

// Define a transform function that adheres to the jscodeshift API.
// The function accepts three arguments:
//  - fileInfo: info about the current file
//  - api: jscodeshift library and helper functions
//  - options: all options passed to the runner via the CLI
const transform: Transform = (fileInfo, api) => {
  // Alias the jscodeshift API for ease of use.
  const j = api.jscodeshift;

  // Convert the file source into an AST.
  const root = j(fileInfo.source);
  let fileContainsButton = false;

  root
    .findJSXElements("button")
    .filter(({ node }) => {
      return !!node.openingElement.attributes?.find(
        (attribute) =>
          attribute.type === "JSXAttribute" &&
          attribute.name.type === "JSXIdentifier" &&
          attribute.name.name === "className" &&
          attribute.value?.type === "StringLiteral" &&
          attribute.value.value.split(" ").includes("button")
      );
    })
    .replaceWith(({ node }) => {
      fileContainsButton = true;
      //   create new props
      const newProps: JSXAttribute[] = [];
      node.openingElement.attributes?.forEach((attribute) => {
        if (
          attribute.type === "JSXAttribute" &&
          attribute.name.type === "JSXIdentifier"
        ) {
          switch (attribute.name.name) {
            case "type":
              if (
                attribute.value?.type !== "StringLiteral" ||
                attribute.value.value !== "button"
              ) {
                newProps.push(attribute);
              }
              break;
            case "className": {
              if (attribute.value?.type === "StringLiteral") {
                const classNames = attribute.value.value.split(" ");
                const variant = classNames
                  .find(
                    (className) =>
                      className.startsWith("button--") &&
                      className !== "button--block"
                  )
                  ?.replace("button--", "");

                if (variant !== "primary" && variant) {
                  newProps.push(
                    j.jsxAttribute(
                      j.jsxIdentifier("variant"),
                      j.stringLiteral(variant)
                    )
                  );
                }

                if (classNames.includes("button--block")) {
                  newProps.push(j.jsxAttribute(j.jsxIdentifier("block")));
                }
              }
              break;
            }
            case "onClick":
              newProps.push(attribute);
              break;
          }
        }
      });
      //   rename button to Button, add new props and close element with Button
      node.openingElement = j.jsxOpeningElement(
        j.jsxIdentifier("Button"),
        newProps
      );
      node.closingElement = j.jsxClosingElement(j.jsxIdentifier("Button"));

      return node;
    });

  if (fileContainsButton) {
    // Construct a relative path to the Button component
    // and a new import statement in the same way as the
    // custom script.
    const relativePathToButtonComponent = path.relative(
      path.dirname(fileInfo.path),
      "../../button.js"
    );

    const buttonComponentImport = j.importDeclaration(
      [j.importSpecifier(j.identifier("Button"), j.identifier("Button"))],
      j.stringLiteral(relativePathToButtonComponent)
    );

    // There's not a convenient API to insert something at the
    // top of any file, so resort to mutating directly.
    root.get().node.program.body.unshift(buttonComponentImport);

    // Finally, convert the AST back to source code and apply
    // formatting with Prettier for consistency.
    return root.toSource();
  } else {
    return null;
  }
};

// The transform function then needs to be the default export.
// This will then be executed by jscodeshift for every file.
export default transform;
