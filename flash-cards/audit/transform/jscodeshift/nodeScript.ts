const fs = require("fs");
const path = require("path");
const jscodeshift = require("jscodeshift");
const transformer = require("./transformOutputText");

const inputFile = path.join(__dirname, "originalFile.ts");
const outputFile = path.join(__dirname, "newFile.ts");

// Read the original JavaScript file
fs.readFile(inputFile, "utf8", (err: NodeJS.ErrnoException, code: string) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }

  // Apply the transformation
  const transformedCode = transformer({ source: code }, { jscodeshift });

  // Write the transformed code to a new file
  fs.writeFile(outputFile, transformedCode, (err: NodeJS.ErrnoException) => {
    if (err) {
      console.error("Error writing the file:", err);
      return;
    }
    console.log("Transformation complete and saved to " + outputFile);
  });
});
