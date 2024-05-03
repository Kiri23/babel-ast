import { API, FileInfo } from "jscodeshift";

module.exports = function (fileInfo: FileInfo, api: API) {
  const j = api.jscodeshift;

  // Example transformation: replace all `var` declarations with `let`
  return j(fileInfo.source)
    .find(j.VariableDeclaration)
    .forEach((path) => {
      if (path.node.kind === "var") {
        path.node.kind = "let";
      }
    })
    .toSource();
};
