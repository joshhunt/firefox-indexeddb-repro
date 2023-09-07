import definitionsList from "./definitions-list.js";
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

    log(`Writing ${tableName} to IndexedDB...`);
    await indexedDBPut(tableName, { tableName, table });
    log(` done\n`);
  }

  log("Wrote all to IndexedDB.\n");
}

async function getAllRows() {
  log("\nLoading IDBObjectStore.getAll() from IndexedDB\n");

  const startTime = performance.now();
  const results = await indexedDBGetAll();
  const endTime = performance.now();

  log(
    `Loaded ${results.length} rows from IndexedDB in ${endTime - startTime}ms\n`
  );
}

async function getAllRowsWithCursor() {
  log("\nLoading IDBObjectStore.openCursor() from IndexedDB\n");

  const startTime = performance.now();
  const results = await indexedDBGetAllCursor();
  const endTime = performance.now();

  log(
    `Loaded ${results.length} rows from IndexedDB in ${endTime - startTime}ms\n`
  );
}

async function getRowsIndividually() {
  log("\nLoading tables from IndexedDB one at a time\n");

  const startTime = performance.now();

  const keys = await indexedDBGetAllKeys();
  log(`Got ${keys.length} keys from IndexedDB\n`);

  for (const key of keys) {
    log(`Reading ${key} from IndexedDB...`);
    await indexedDBGet(key);
    log(` done\n`);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  log(`Loaded all tables from IndexedDB in ${duration}ms\n`);
}

async function loadInventoryItemsFromIndexedDB() {
  log("\nLoading just one large table from IndexedDB\n");

  const startTime = performance.now();

  await indexedDBGet("InventoryItem");

  const endTime = performance.now();
  const duration = endTime - startTime;

  log(`Loaded just one large table from IndexedDB in ${duration}ms\n`);
}

const outputEl = document.querySelector(".output");
const fetchButtonEl = document.querySelector(".js-fetch-button");
const idbLoadManyButtonEl = document.querySelector(".js-idb-load-many-button");
const idbLoadCursorButtonEl = document.querySelector(
  ".js-idb-load-cursor-button"
);
const idbLoadOneAtATimeButtonEl = document.querySelector(
  ".js-idb-load-one-at-a-time-button"
);
const idbLoadInventoryItemsButtonEl = document.querySelector(
  ".js-idb-load-one-large-button"
);

function handleError(error) {
  console.error(error);
  log("\n\nERROR: " + error);
}

fetchButtonEl.addEventListener("click", () => {
  fetchDefinitions().catch(handleError);
});

idbLoadManyButtonEl.addEventListener("click", () => {
  getAllRows().catch(handleError);
});

idbLoadOneAtATimeButtonEl.addEventListener("click", () => {
  getRowsIndividually().catch(handleError);
});

idbLoadInventoryItemsButtonEl.addEventListener("click", () => {
  loadInventoryItemsFromIndexedDB().catch(handleError);
});

idbLoadCursorButtonEl.addEventListener("click", () => {
  getAllRowsWithCursor().catch(handleError);
});
