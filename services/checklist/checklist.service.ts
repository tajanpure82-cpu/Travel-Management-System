/**
 * checklist.service
 * ─────────────────────────────────────────────────────────────────────────
 * All Firestore access for the "checklistItems" collection goes through
 * this file. Ordered by title.
 */

import type { FirestoreError } from "firebase/firestore"

import {
  createDocument,
  deleteDocument,
  subscribeToCollection,
  updateDocument,
  type WithId,
} from "@/lib/firebase/crud"
import type { ChecklistItem, NewChecklistItem } from "@/types/checklist"

const COLLECTION = "checklistItems"

export function subscribeToChecklistItems(
  onData: (items: WithId<ChecklistItem>[]) => void,
  onError?: (error: FirestoreError) => void
) {
  return subscribeToCollection<ChecklistItem>(COLLECTION, onData, onError, "title")
}

export function addChecklistItem(data: NewChecklistItem): Promise<string> {
  return createDocument<NewChecklistItem>(COLLECTION, data)
}

export function updateChecklistItem(
  id: string,
  data: Partial<NewChecklistItem>
): Promise<void> {
  return updateDocument<NewChecklistItem>(COLLECTION, id, data)
}

export function deleteChecklistItem(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id)
}
