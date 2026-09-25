export class AuthError extends Error {
  constructor(message = "You must be signed in.") {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Expected, user-facing failure (validation beyond zod, conflicts, not found). */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}
