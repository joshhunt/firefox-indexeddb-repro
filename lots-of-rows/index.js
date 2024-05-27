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

  const startMark = performance.mark("getAllRows-start");
  const results = await indexedDBGetAllCursor();
  const endMark = performance.mark("getAllRows-end");
  const measureMark = performance.measure(
    "getAllRows-duration",
    startMark.name,
    endMark.name
  );

  log(
    `Loaded ${results.length} rows using IDBObjectStore.openCursor in ${measureMark.duration}ms\n`
  );
}

async function getAllRowsWithIndex() {
  log("\nLoading IDBIndex.openCursor() from IndexedDB\n");

  const startMark = performance.mark("getAllRowsWithIndex-start");

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
    const endMark = performance.mark("getAllRowsWithIndex-end");
    const measureMark = performance.measure(
      "getAllRowsWithIndex-duration",
      startMark.name,
      endMark.name
    );

    log(
      `Loaded ${results.length} rows using IDBIndex.openCursor in ${measureMark.duration}ms\n`
    );
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
