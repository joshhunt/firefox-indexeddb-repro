const { default: definitionsList, manifestVersion } = await import(
  "./definitions-list.js"
);

const DATABASE_NAME = "repro-two-db";
const STORE_NAME = "repro-two-db-store";

let idbReadyResolve;

/** @type {Promise<IDBDatabase>} */
let idbReady = new Promise((resolve) => {
  idbReadyResolve = resolve;
});

function initIdb() {
  const dbOpenRequest = window.indexedDB.open(DATABASE_NAME);

  dbOpenRequest.onsuccess = (event) => idbReadyResolve(event.target.result);

  /** @param {IDBVersionChangeEvent} event */
  dbOpenRequest.onupgradeneeded = (event) => {
    ``;
    /** @type {IDBOpenDBRequest} */
    const target = event.target;
    const db = target.result;

    const objectStore = db.createObjectStore(STORE_NAME, {
      keyPath: "key",
      autoIncrement: true,
    });

    objectStore.createIndex("tableName", "tableName");
    objectStore.createIndex("version", "version");
    objectStore.createIndex("byVersionByTable", ["version", "tableName"]);
    objectStore.createIndex("byVersionByKey", ["version", "key"]);

    objectStore.transaction.onComplete = () => {
      idbReadyResolve(event.target.result);
    };
  };
}

initIdb();

document.querySelector(".js-load-data").addEventListener("click", async () => {
  console.log("deleting database");
  const deleteRequest = window.indexedDB.deleteDatabase(DATABASE_NAME);

  deleteRequest.onsuccess = async () => {
    console.log("initializing new idb");
    initIdb();

    console.log("waiting for idb to be ready...");
    const db = await idbReady;

    console.log({
      definitionsList,
      manifestVersion,
    });

    const rows = [];
    const total = definitionsList.length;

    let loadedCounter = 0;

    for (const [tableName, tablePath] of definitionsList) {
      loadedCounter += 1;
      console.log(`Fetching ${tableName} from network...`);

      const resp = await fetch(tablePath);
      const table = await resp.json();

      for (const hash in table) {
        const def = table[hash];
        rows.push({
          tableName,
          definition: def,
          version: manifestVersion,
        });
      }

      console.log(" done");
    }

    console.log("Fetched all JSON from network");

    const idbStore = db
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME);

    console.log("Saving", rows.length, "rows into idb");
    console.time("save-rows");
    for (const row of rows) {
      idbStore.add(row);
    }
    console.timeEnd("save-rows");
    console.log("Done saving rows");
  };
});
