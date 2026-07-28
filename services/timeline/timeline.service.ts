/**
 * timeline.service
 * ─────────────────────────────────────────────────────────────────────────
 * All Firestore access for the "timelineEntries" collection goes through
 * this file.
 *
 * Deliberately no `orderByField` passed to the subscription — Firestore's
 * `orderBy` sorts null values first on a nullable numeric field, but this
 * module needs entries with no day set pushed to the *end*. That's not
 * something Firestore's query can express, so ordering stays entirely
 * client-side in TimelineTable's `sortByDay`, same as it was before this
 * collection existed in Firestore at all.
 */

import type { FirestoreError } from "firebase/firestore"

import {
  createDocument,
  deleteDocument,
  subscribeToCollection,
  updateDocument,
  type WithId,
} from "@/lib/firebase/crud"
import type { NewTimelineEntry, TimelineEntry } from "@/types/timeline"

const COLLECTION = "timelineEntries"

export function subscribeToTimelineEntries(
  onData: (entries: WithId<TimelineEntry>[]) => void,
  onError?: (error: FirestoreError) => void
) {
  return subscribeToCollection<TimelineEntry>(COLLECTION, onData, onError)
}

export function addTimelineEntry(data: NewTimelineEntry): Promise<string> {
  return createDocument<NewTimelineEntry>(COLLECTION, data)
}

export function updateTimelineEntry(
  id: string,
  data: Partial<NewTimelineEntry>
): Promise<void> {
  return updateDocument<NewTimelineEntry>(COLLECTION, id, data)
}

export function deleteTimelineEntry(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id)
}
