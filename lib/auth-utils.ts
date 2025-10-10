import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/api/auth/signin")
  }
  return session
}

export async function requireRole(minRole: UserRole) {
  const session = await requireAuth()
  
  const roleHierarchy: Record<UserRole, number> = {
    USER: 0,
    VERIFIER: 1,
    MOD: 2,
    ADMIN: 3,
  }
  
  if (roleHierarchy[session.user.role] < roleHierarchy[minRole]) {
    redirect("/")
  }
  
  return session
}

export async function getSession() {
  return await auth()
}

export function canVerify(role: UserRole): boolean {
  return role === UserRole.VERIFIER || role === UserRole.MOD || role === UserRole.ADMIN
}

export function isMod(role: UserRole): boolean {
  return role === UserRole.MOD || role === UserRole.ADMIN
}

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    USER: 0,
    VERIFIER: 1,
    MOD: 2,
    ADMIN: 3,
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

