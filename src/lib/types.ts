/** Shapes shared by admin pages and components (client-safe). */

export type Role = "owner" | "staff"
/** `pending` is kept for accounts the owner still has to approve. */
export type UserStatus = "active" | "pending" | "disabled"
/** New shops wait for a platform admin before they appear publicly. */
export type ShopStatus = "pending" | "active" | "suspended"

/** The signed-in admin user. */
export type AdminUser = {
  id: string
  name: string
  title: string
  email: string
  phone: string
  avatar: string
  role: Role
  /** Can approve, suspend and delete shops on the whole platform. */
  platformAdmin: boolean
}

/** A row of the staff page. */
export type PublicUser = Omit<AdminUser, "platformAdmin"> & { status: UserStatus }
