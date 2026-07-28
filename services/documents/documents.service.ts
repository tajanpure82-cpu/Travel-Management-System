/**
 * documents.service
 * ─────────────────────────────────────────────────────────────────────────
 * All Firestore access for the "documents" collection goes through this
 * file. Ordered by name (this module has no natural chronological order).
 */

import type { FirestoreError } from "firebase/firestore"

import {
  createDocument,
  deleteDocument,
  subscribeToCollection,
  updateDocument,
  type WithId,
} from "@/lib/firebase/crud"
import type { DocumentRecord, NewDocumentRecord } from "@/types/document"

const COLLECTION = "documents"

export function subscribeToDocumentRecords(
  onData: (records: WithId<DocumentRecord>[]) => void,
  onError?: (error: FirestoreError) => void
) {
  return subscribeToCollection<DocumentRecord>(COLLECTION, onData, onError, "name")
}

export function addDocumentRecord(data: NewDocumentRecord): Promise<string> {
  return createDocument<NewDocumentRecord>(COLLECTION, data)
}

export function updateDocumentRecord(
  id: string,
  data: Partial<NewDocumentRecord>
): Promise<void> {
  return updateDocument<NewDocumentRecord>(COLLECTION, id, data)
}

export function deleteDocumentRecord(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id)
}
