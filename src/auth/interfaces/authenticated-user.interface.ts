/**
 * Interface representing an authenticated user extracted from JWT token
 * This matches the structure returned by the JWT strategy validation
 */
export interface AuthenticatedUser {
  /** User's unique identifier (UUID) */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name: string;
}
