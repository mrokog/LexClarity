/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentAnalysis, ActionItem, QaResponse, ComparisonResult } from '../types/legal';

const DB_NAME = 'LexClarity_ClientDB';
const DB_VERSION = 1;

interface DBSchema {
  documents: DocumentAnalysis;
  actions: { docId: string; actions: ActionItem[] };
  qaCache: { key: string; docHash: string; question: string; response: QaResponse; timestamp: number };
  comparisons: { id: string; result: ComparisonResult; timestamp: number };
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('actions')) {
        db.createObjectStore('actions', { keyPath: 'docId' });
      }
      if (!db.objectStoreNames.contains('qaCache')) {
        const qaStore = db.createObjectStore('qaCache', { keyPath: 'key' });
        qaStore.createIndex('docHash', 'docHash', { unique: false });
      }
      if (!db.objectStoreNames.contains('comparisons')) {
        db.createObjectStore('comparisons', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Fallback to localStorage if IndexedDB encounters any problem
const LOCAL_STORAGE_PREFIX = 'lexclarity_';

export async function saveDocumentToDb(doc: DocumentAnalysis): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');
      const req = store.put(doc);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}doc_${doc.id}`, JSON.stringify(doc));
    } catch {
      // storage quota or disabled
    }
  }
}

export async function getDocumentFromDb(id: string): Promise<DocumentAnalysis | null> {
  try {
    const db = await getDB();
    return await new Promise<DocumentAnalysis | null>((resolve, reject) => {
      const tx = db.transaction('documents', 'readonly');
      const store = tx.objectStore('documents');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}doc_${id}`);
    return raw ? JSON.parse(raw) : null;
  }
}

export async function getAllDocumentsFromDb(): Promise<DocumentAnalysis[]> {
  try {
    const db = await getDB();
    return await new Promise<DocumentAnalysis[]>((resolve, reject) => {
      const tx = db.transaction('documents', 'readonly');
      const store = tx.objectStore('documents');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const docs: DocumentAnalysis[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${LOCAL_STORAGE_PREFIX}doc_`)) {
        try {
          docs.push(JSON.parse(localStorage.getItem(key) || ''));
        } catch {
          // ignore corrupted items
        }
      }
    }
    return docs.sort((a, b) => b.createdAt - a.createdAt);
  }
}

export async function deleteDocumentFromDb(id: string): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}doc_${id}`);
  }
}

export async function saveActionsToDb(docId: string, actions: ActionItem[]): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('actions', 'readwrite');
      const store = tx.objectStore('actions');
      const req = store.put({ docId, actions });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}actions_${docId}`, JSON.stringify(actions));
  }
}

export async function getActionsFromDb(docId: string): Promise<ActionItem[] | null> {
  try {
    const db = await getDB();
    return await new Promise<ActionItem[] | null>((resolve, reject) => {
      const tx = db.transaction('actions', 'readonly');
      const store = tx.objectStore('actions');
      const req = store.get(docId);
      req.onsuccess = () => resolve(req.result ? req.result.actions : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}actions_${docId}`);
    return raw ? JSON.parse(raw) : null;
  }
}

export async function getCachedQa(docHash: string, normalizedQuestion: string): Promise<QaResponse | null> {
  const key = `${docHash}::${normalizedQuestion}`;
  try {
    const db = await getDB();
    return await new Promise<QaResponse | null>((resolve, reject) => {
      const tx = db.transaction('qaCache', 'readonly');
      const store = tx.objectStore('qaCache');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.response : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}qa_${key}`);
    return raw ? JSON.parse(raw) : null;
  }
}

export async function saveCachedQa(docHash: string, normalizedQuestion: string, response: QaResponse): Promise<void> {
  const key = `${docHash}::${normalizedQuestion}`;
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('qaCache', 'readwrite');
      const store = tx.objectStore('qaCache');
      const req = store.put({ key, docHash, question: normalizedQuestion, response, timestamp: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}qa_${key}`, JSON.stringify(response));
  }
}
