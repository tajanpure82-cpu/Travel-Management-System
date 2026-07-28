/**
 * errors
 * ─────────────────────────────────────────────────────────────────────────
 * Turns Firebase's error codes (both Auth and Firestore) into messages a
 * person can actually act on, instead of surfacing raw codes like
 * "auth/wrong-password" in a toast. Used everywhere a Firebase call is
 * wrapped in try/catch — the service layer and the login form both use
 * this so the message a user sees is always consistent.
 */

interface FirebaseLikeError {
  code?: string
  message?: string
}

function isFirebaseLikeError(error: unknown): error is FirebaseLikeError {
  return typeof error === "object" && error !== null && "code" in error
}

const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/email-already-in-use": "An account already exists with that email.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/network-request-failed": "Network error — check your connection and try again.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",

  // Firestore
  "permission-denied": "You don't have permission to do that.",
  unavailable: "Can't reach the server right now. Check your connection and try again.",
  "not-found": "That item no longer exists — it may have been deleted elsewhere.",
  "deadline-exceeded": "That took too long and timed out. Try again.",

  // Storage
  "storage/unauthorized": "You don't have permission to access that file.",
  "storage/canceled": "Upload cancelled.",
  "storage/quota-exceeded": "Storage limit reached.",
}

/** Returns a friendly message for any error thrown by a Firebase call. */
export function getErrorMessage(error: unknown): string {
  if (isFirebaseLikeError(error) && error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code]
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return "Something went wrong. Please try again."
}
