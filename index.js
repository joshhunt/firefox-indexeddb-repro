import * as idb from "./node_modules/idb-keyval/dist/index.js";
import definitionsList from "./definitions-list.js";

const idbStore = idb.createStore("firefox-idb-repro");

const LOG_TO_CONSOLE = false;

function log(msg) {
  if (LOG_TO_CONSOLE) {
    console.log(msg);
  } else {
    outputEl.innerHTML += msg;
    outputEl.scrollTo(0, outputEl.scrollHeight);
  }
}

async function fetchDefinitions() {
  let loadedCounter = 0;

  const allTables = {};

  for (const [tableName, tablePath] of definitionsList) {
    const resp = await fetch(tablePath);
    const table = await resp.json();
    allTables[tableName] = table;
    loadedCounter += 1;

    log(
      `Fetched ${loadedCounter}/${definitionsList.length} ${tableName} from network\n`
    );
  }

  log("Fetched all JSON from network.\n\n");

  for (const tableName in allTables) {
    const table = allTables[tableName];

    log(`Writing ${tableName} to IndexedDB...`);
    await idb.set(tableName, table, idbStore);
    log(` done\n`);
  }

  log("Wrote all to IndexedDB.\n");
}

async function loadManyFromIndexedDB() {
  log("\nLoading all tables from IndexedDB\n");

  const startTime = performance.now();
  await idb.entries(idbStore);
  const endTime = performance.now();

  const duration = endTime - startTime;
  log(`Loadinged all tables from IndexedDB in ${duration}ms\n`);
}

async function loadOneAtATimeFromIndexedDB() {
  log("\nLoading tables from IndexedDB one at a time\n");

  const startTime = performance.now();

  const keys = await idb.keys(idbStore);
  log(`Got ${keys.length} keys from IndexedDB\n`);

  for (const key of keys) {
    log(`Reading ${key} from IndexedDB...`);
    await idb.get(key, idbStore);
    log(` done\n`);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  log(`Loaded all tables from IndexedDB in ${duration}ms\n`);
}

async function loadInventoryItemsFromIndexedDB() {
  log("\nLoading just one large table from IndexedDB\n");

  const startTime = performance.now();

  await idb.get("InventoryItem", idbStore);

  const endTime = performance.now();
  const duration = endTime - startTime;

  log(`Loaded just one large table from IndexedDB in ${duration}ms\n`);
}

const outputEl = document.querySelector(".output");
const fetchButtonEl = document.querySelector(".js-fetch-button");
const idbLoadManyButtonEl = document.querySelector(".js-idb-load-many-button");
const idbLoadOneAtATimeButtonEl = document.querySelector(
  ".js-idb-load-one-at-a-time-button"
);
const idbLoadInventoryItemsButtonEl = document.querySelector(
  ".js-idb-load-one-large-button"
);

fetchButtonEl.addEventListener("click", async () => {
  try {
    await fetchDefinitions();
  } catch (error) {
    console.error(error);
    log("ERROR: " + error);
  }
});

idbLoadManyButtonEl.addEventListener("click", async () => {
  try {
    await loadManyFromIndexedDB();
  } catch (error) {
    console.error(error);
    log("ERROR: " + error);
  }
});

idbLoadOneAtATimeButtonEl.addEventListener("click", async () => {
  try {
    await loadOneAtATimeFromIndexedDB();
  } catch (error) {
    console.error(error);
    log("ERROR: " + error);
  }
});

idbLoadInventoryItemsButtonEl.addEventListener("click", async () => {
  try {
    await loadInventoryItemsFromIndexedDB();
  } catch (error) {
    console.error(error);
    log("ERROR: " + error);
  }
});
