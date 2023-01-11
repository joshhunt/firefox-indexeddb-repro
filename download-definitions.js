import * as manifestNode from "@d2api/manifest-node";
import fs from "fs/promises";
import path from "path";

manifestNode
  .load()
  .then(async () => {
    console.log("Loaded definitions");

    for (const tableName in manifestNode.allManifest) {
      const table = manifestNode.allManifest[tableName];
      const tablePath = path.join(".", "definitions", `${tableName}.json`);
      console.log("Writing", tableName, "to", tablePath);
      await fs.writeFile(tablePath, JSON.stringify(table));
    }

    await fs.rm(path.join(".", "manifests"), {
      recursive: true,
    });
  })
  .catch((err) => {
    console.error("Failed to download definitions:", err);
    console.error("Try running this again");
  });
