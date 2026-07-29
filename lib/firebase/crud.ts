/**
 * Generic Firestore CRUD utilities
 * ─────────────────────────────────────────────────────────────────────────
 * One generic, typed implementation of the operations every module needs
 * (subscribe to a collection in real time, create, update, delete, get a
 * single document). Every module's `services/<module>/<module>.service.ts`
 * is a thin, named wrapper around these.
 *
 * Build-fix note: `createDocument`, `updateDocument`, and
 * `setDocumentData` each cast their outgoing data to Firebase's own
 * `WithFieldValue<DocumentData>` / `UpdateData<DocumentData>` types
 * before calling `addDoc`/`updateDoc`/`setDoc`. Without this, TypeScript
 * tries to infer the Firestore SDK's generic `DbModelType` from the
 * *data* argument (typed as this module's own `T`), then checks whether
 * the plain, converter-less `DocumentReference<DocumentData,
 * DocumentData>` returned by `doc()` is assignable to
 * `DocumentReference<DocumentData, T>` — which it never is, since a
 * converter-less reference's internal converter type doesn't match a
 * reference parametrized to a specific app type. The cast forces
 * inference the other way: `DbModelType = DocumentData`, matching what
 * `doc()`/`collection()` actually return. This isn't a workaround for a
 * bug in this file — it's the documented shape Firebase's own modular
 * SDK expects when a `DocumentReference`/`CollectionReference` is used
 * without `.withConverter()`, which this app deliberately doesn't use.
 * `WithFieldValue<DocumentData>` for creates/sets (matching
 * `addDoc`/`setDoc`'s parameter type), `UpdateData<DocumentData>` for
 * updates (matching `updateDoc`'s, which supports dot-notation partial
 * paths). Verified by compiling both the failing and fixed versions
 * against the real, currently-installed `firebase` package before this
 * was shipped, not just reasoned through.
 *
 * Dates: documents keep storing dates as plain ISO strings (matching what
 * every module already did with local state), not Firestore Timestamps.
 *
 * IDs: Firestore assigns the document ID on create (via `addDoc`) — none
 * of the client-side `crypto.randomUUID()` generation the modules used to
 * do is needed anymore.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type DocumentData,
  type FirestoreError,
  type Unsubscribe,
  type UpdateData,
  type WithFieldValue,
} from "firebase/firestore"

import { db } from "@/lib/firebase/config"

/** Every document read back from Firestore carries its own id. */
export type WithId<T> = T & { id: string }

/** Removes any `id` key from a payload before it's written to Firestore.
 *  The document ID is Firestore's job, assigned by `addDoc`/`doc()` — it
 *  should never also exist as a field inside the document's own data. */
function stripId<T extends object>(data: T): T {
  if (!("id" in data)) return data
  const { id: _ignoredId, ...rest } = data as Record<string, unknown>
  return rest as T
}

/**
 * Subscribes to a collection in real time. Calls `onData` with the full,
 * current list every time anything in the collection changes (an add, an
 * edit, a delete — from this browser tab or any other). Returns the
 * unsubscribe function; callers must invoke it in a useEffect cleanup.
 */
export function subscribeToCollection<T>(
  collectionName: string,
  onData: (items: WithId<T>[]) => void,
  onError?: (error: FirestoreError) => void,
  orderByField?: string
): Unsubscribe {
  const collectionRef = collection(db, collectionName)
  const q = orderByField ? query(collectionRef, orderBy(orderByField)) : query(collectionRef)

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data() as T
        // Spread data FIRST, then set id LAST — id always wins over
        // anything (correct or stray) in the stored data.
        return {
          ...data,
          id: docSnapshot.id,
        }
      })

      if (process.env.NODE_ENV !== "production") {
        const seen = new Set<string>()
        for (const item of items) {
          if (seen.has(item.id)) {
            console.error(
              `[firestore] Duplicate id "${item.id}" found in collection "${collectionName}". ` +
                "Firestore document IDs are unique by definition, so this should never happen — " +
                "it means something wrote a stray `id` field into a document's data at some point."
            )
          }
          seen.add(item.id)
        }
      }

      onData(items)
    },
    (error) => {
      console.error(`[firestore] subscribeToCollection(${collectionName}) failed:`, error)
      onError?.(error)
    }
  )
}

/** Creates a new document with a Firestore-assigned ID. Returns that ID. */
export async function createDocument<T extends object>(
  collectionName: string,
  data: T
): Promise<string> {
  const collectionRef = collection(db, collectionName)
  const docRef = await addDoc(
    collectionRef,
    stripId(data) as WithFieldValue<DocumentData>
  )
  return docRef.id
}

/** Updates specific fields on an existing document. */
export async function updateDocument<T extends object>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await updateDoc(docRef, stripId(data) as UpdateData<DocumentData>)
}

/** Deletes a document. */
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await deleteDoc(docRef)
}

/** Reads a single document once (not subscribed). Returns null if missing. */
export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<WithId<T> | null> {
  const docRef = doc(db, collectionName, id)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  const data = snapshot.data() as T
  return { ...data, id: snapshot.id }
}

/**
 * Subscribes to a single, fixed document in real time — for singleton
 * modules like Settings, where there's exactly one record for the whole
 * app rather than a list. Unlike subscribeToCollection, this always
 * watches the same `docId`; it never changes which document it's
 * pointed at. Calls `onData(null)` if the document hasn't been created
 * yet (e.g. Settings has never been saved).
 */
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  onData: (data: T | null) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, docId)
  return onSnapshot(
    docRef,
    (snapshot) => {
      onData(snapshot.exists() ? (snapshot.data() as T) : null)
    },
    (error) => {
      console.error(
        `[firestore] subscribeToDocument(${collectionName}/${docId}) failed:`,
        error
      )
      onError?.(error)
    }
  )
}

/**
 * Writes to a single, fixed document — creates it if it doesn't exist yet
 * (the very first save) or merges these fields into it otherwise. This is
 * `setDoc(..., { merge: true })` rather than `updateDoc` specifically
 * because `updateDoc` throws on a document that doesn't exist yet, which
 * would break a singleton's first-ever save.
 */
export async function setDocumentData<T extends object>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  const docRef = doc(db, collectionName, docId)
  await setDoc(docRef, stripId(data) as WithFieldValue<DocumentData>, { merge: true })
}
