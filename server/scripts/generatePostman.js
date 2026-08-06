/**
 * Generates:
 *   1. server/swagger.json  — the raw OpenAPI spec (also served at /api-docs.json)
 *   2. server/postman/collection.json — a ready-to-import Postman collection
 *
 * Usage:  npm run docs:postman   (from the server directory)
 */
const fs = require("fs");
const path = require("path");
const { convert } = require("openapi-to-postmanv2");
const { swaggerSpec } = require("../swagger");

const serverDir = path.join(__dirname, "..");
const specPath = path.join(serverDir, "swagger.json");
const collectionDir = path.join(serverDir, "postman");
const collectionPath = path.join(collectionDir, "collection.json");

// 1. Write the raw OpenAPI spec.
fs.writeFileSync(specPath, JSON.stringify(swaggerSpec, null, 2));
console.log(`OpenAPI spec written to ${path.relative(serverDir, specPath)}`);

// 2. Convert the spec to a Postman collection.
convert(
  { type: "string", data: JSON.stringify(swaggerSpec) },
  {
    schemaFaker: true,
    requestParametersResolution: "Example",
    exampleParametersResolution: "Example",
    folderStrategy: "Tags",
  },
  (err, result) => {
    if (err) {
      console.error("Conversion failed:", err);
      process.exit(1);
    }

    if (!result.result) {
      console.error("Conversion failed:", result.reason);
      process.exit(1);
    }

    if (!fs.existsSync(collectionDir)) {
      fs.mkdirSync(collectionDir, { recursive: true });
    }

    fs.writeFileSync(
      collectionPath,
      JSON.stringify(result.output[0].data, null, 2)
    );
    console.log(
      `Postman collection written to ${path.relative(serverDir, collectionPath)}`
    );
    console.log(`Requests: ${result.output[0].data.item.length}`);
  }
);
