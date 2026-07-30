/**
 * Generic Firebase Storage utilities
 * ─────────────────────────────────────────────────────────────────────────
 * Same spirit as lib/firebase/crud.ts — generic, collection/feature-
 * agnostic functions that any module can reuse, rather than writing
 * Storage-specific code once per feature. Expenses' receipt upload is the
 * first thing to use this; Documents' previously-deferred real file
 * upload can adopt the same two functions later without any changes here.
 */

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage"

import { storage } from "@/lib/firebase/config"

/**
 * Uploads a file to the given Storage path and returns its public
 * download URL. Callers are responsible for making the path unique
 * (e.g. prefixing with a random ID) — this doesn't check for collisions.
 */
export async function uploadFile(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

/**
 * Deletes a file given its download URL. Used when deleting a record
 * that has an attached file, so Storage doesn't accumulate orphaned
 * uploads with nothing pointing at them. Safe to call even if the file
 * is already gone — Storage's "not found" case is swallowed rather than
 * thrown, since the end state (file doesn't exist) is what the caller
 * wants either way.
 */
export async function deleteFileByUrl(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch (error) {
    console.warn("[firebase/storage] deleteFileByUrl: file may already be gone", error)
  }
}
