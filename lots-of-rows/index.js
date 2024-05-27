import definitionsList from "../definitions-list.js";
import {
  indexedDBPut,
  indexedDBGetAllCursor,
  getDb,
  STORE_NAME,
} from "./idb.js";

function log(msg) {
  outputEl.innerHTML += msg;
  window.scrollTo(0, document.body.scrollHeight);
}

const VERSION = "225530.24.05.01.1730-24-bnet.55439";

async function fetchDefinitions() {
  let loadedCounter = 0;

  const allTables = {};
  const total = definitionsList.length;

  for (const [tableName, tablePath] of definitionsList) {
    loadedCounter += 1;
    log(`Fetching ${loadedCounter}/${total} ${tableName} from network...`);

    const resp = await fetch(tablePath);
    const table = await resp.json();
    allTables[tableName] = table;

    log(" done\n");
  }

  log("Fetched all JSON from network.\n\n");

  for (const tableName in allTables) {
    const table = allTables[tableName];

    const entries = Object.entries(table);

    log(
      `Writing ${entries.length} ${tableName} definitions to IndexedDB individually...`
    );

    for (const [key, definition] of entries) {
      const row = {
        version: VERSION,
        tableName,
        key,
        definition,
      };

      // console.log(tableName, key);
      await indexedDBPut(row);
    }

    log(` done\n`);
  }

  log("Wrote all to IndexedDB.\n");
}

async function getAllRows() {
  log("\nLoading IDBObjectStore.openCursor() from IndexedDB\n");

  const startTime = performance.now();
  console.time("load all with cursor");
  const results = await indexedDBGetAllCursor();
  console.timeEnd("load all with cursor");
  const endTime = performance.now();

  log(
    `Loaded ${results.length} rows from IndexedDB in ${endTime - startTime}ms\n`
  );

  const byTable = {};

  for (const row of results) {
    const { tableName, key, definition } = row;

    if (!byTable[tableName]) {
      byTable[tableName] = [];
    }

    byTable[tableName].push(definition);
  }

  // log number of rows for each table
  for (const tableName in byTable) {
    log(`${tableName}: ${byTable[tableName].length}\n`);

    if (tableName === "Race") {
      console.log(byTable[tableName]);
    }
  }
}

async function getAllRowsWithIndex() {
  log("\nLoading IDBIndex.openCursor() from IndexedDB\n");

  const startTime = performance.now();
  console.time("load all with index cursor");

  const results = [];
  const db = await getDb();
  const store = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
  const versionIndex = store.index("version");

  let cursorRequest = versionIndex.openCursor(VERSION);
  cursorRequest.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      results.push(cursor.value);
      cursor.continue();
    } else {
      whenFinished(results);
    }
  };

  function whenFinished(results) {
    console.timeEnd("load all with index cursor");
    const endTime = performance.now();

    log(
      `Loaded ${results.length} rows from IndexedDB in ${
        endTime - startTime
      }ms\n`
    );

    const byTable = {};

    for (const row of results) {
      const { tableName, key, definition } = row;

      if (!byTable[tableName]) {
        byTable[tableName] = [];
      }

      byTable[tableName].push(definition);
    }

    // log number of rows for each table
    for (const tableName in byTable) {
      log(`${tableName}: ${byTable[tableName].length}\n`);

      if (tableName === "Race") {
        console.log(byTable[tableName]);
      }
    }
  }
}

const outputEl = document.querySelector(".output");

function handleError(error) {
  console.error(error);
  log("\n\nERROR: " + error);
}

document.querySelector(".js-fetch-button").addEventListener("click", () => {
  fetchDefinitions().catch(handleError);
});

document
  .querySelector(".js-idb-load-cursor-button")
  .addEventListener("click", () => {
    getAllRows().catch(handleError);
  });

document
  .querySelector(".js-idb-load-cursor-index-button")
  .addEventListener("click", () => {
    getAllRowsWithIndex().catch(handleError);
  });
