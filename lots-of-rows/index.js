import definitionsList from "../definitions-list.js";
import {
  indexedDBPut,
  indexedDBGet,
  indexedDBGetAll,
  indexedDBGetAllKeys,
  indexedDBGetAllCursor,
} from "./idb.js";

function log(msg) {
  outputEl.innerHTML += msg;
  window.scrollTo(0, document.body.scrollHeight);
}

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

async function getAllRowsWithCursor() {
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

    byTable[tableName].push(key);
  }

  // log number of rows for each table
  for (const tableName in byTable) {
    log(`${tableName}: ${byTable[tableName].length}\n`);
  }
}

const outputEl = document.querySelector(".output");
const fetchButtonEl = document.querySelector(".js-fetch-button");
const idbLoadCursorButtonEl = document.querySelector(
  ".js-idb-load-cursor-button"
);

function handleError(error) {
  console.error(error);
  log("\n\nERROR: " + error);
}

fetchButtonEl.addEventListener("click", () => {
  fetchDefinitions().catch(handleError);
});

idbLoadCursorButtonEl.addEventListener("click", () => {
  getAllRowsWithCursor().catch(handleError);
});
