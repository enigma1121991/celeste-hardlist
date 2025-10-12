import { UserRole } from "@prisma/client"

interface RoleBadgeProps {
  role: UserRole
  size?: "sm" | "md" | "lg"
}

export default function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  if (role === UserRole.USER) {
    return null // Don't show badge for regular users
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  }

  const roleConfig = {
    [UserRole.ADMIN]: {
      label: "Admin",
      colors: "bg-red-500/20 text-red-400 border-red-500/50",
    },
    [UserRole.MOD]: {
      label: "Moderator",
      colors: "bg-purple-500/20 text-purple-400 border-purple-500/50",
    },
    [UserRole.VERIFIER]: {
      label: "Verifier",
      colors: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    },
    [UserRole.USER]: {
      label: "User",
      colors: "",
    },
  }

  const config = roleConfig[role]

  if (!config) {
    console.warn(`Unknown role: ${role}`)
    return null
}

  return (
    <span
      className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-semibold border ${config.colors}`}
    >
      {config.label}
    </span>
  )
}



