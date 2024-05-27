// Heavily inspired by https://github.com/jakearchibald/idb-keyval/blob/main/src/index.ts

const DATABASE_NAME = "firefox-idb-repro-lots-of-rows";
const STORE_NAME = "firefox-idb-repro-store-lots-of-rows";

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.oncomplete = request.onsuccess = () => resolve(request.result);
    request.onabort = request.onerror = () => reject(request.error);
  });
}

const dbOpenRequest = indexedDB.open(DATABASE_NAME);
dbOpenRequest.onupgradeneeded = () => {
  dbOpenRequest.result.createObjectStore(STORE_NAME, {
    keyPath: ["tableName", "key"],
  });
};
const dbPromise = promisifyRequest(dbOpenRequest);

export async function indexedDBPut(value) {
  const db = await dbPromise;

  const request = db
    .transaction(STORE_NAME, "readwrite")
    .objectStore(STORE_NAME)
    .put(value);

  return promisifyRequest(request);
}

export async function indexedDBGet(key) {
  const db = await dbPromise;

  const request = db
    .transaction(STORE_NAME, "readonly")
    .objectStore(STORE_NAME)
    .get(key);

  return promisifyRequest(request);
}

export async function indexedDBGetAll() {
  const db = await dbPromise;

  const request = db
    .transaction(STORE_NAME, "readonly")
    .objectStore(STORE_NAME)
    .getAll();

  return promisifyRequest(request);
}

export async function indexedDBGetAllKeys() {
  const db = await dbPromise;

  const request = db
    .transaction(STORE_NAME, "readonly")
    .objectStore(STORE_NAME)
    .getAllKeys();

  return promisifyRequest(request);
}

export async function indexedDBGetAllCursor() {
  const db = await dbPromise;

  const cursorRequest = db
    .transaction(STORE_NAME, "readonly")
    .objectStore(STORE_NAME)
    .openCursor();

  return new Promise((resolve) => {
    const results = [];

    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
  });
}
