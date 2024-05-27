import * as manifestNode from "@d2api/manifest-node";
import { loadedVersion } from "@d2api/manifest";
import fs from "fs/promises";
import path from "path";

manifestNode
  .load()
  .then(async (...args) => {
    console.log("Loaded definitions", loadedVersion, ...args);

    const tables = [];

    for (const tableName in manifestNode.allManifest) {
      const table = manifestNode.allManifest[tableName];
      const tablePath = path.join(".", "definitions", `${tableName}.json`);
      console.log("Writing", tableName, "to", tablePath);
      await fs.writeFile(tablePath, JSON.stringify(table));

      tables.push([tableName, "./" + tablePath]);
    }

    const defsListFile = `
export default ${JSON.stringify(tables, null, 2)};
export const manifestVersion = "${loadedVersion}";
`;

    await fs.writeFile("./definitions-list.js", defsListFile);

    await fs.rm(path.join(".", "manifests"), {
      recursive: true,
    });
  })
  .catch((err) => {
    console.error("Failed to download definitions:", err);
    console.error("Try running this again");
  });
