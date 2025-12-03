"use client";

import { useState, useEffect } from "react";

export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface Permissions {
  role: Role | null;
  isOwner: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  canManageTeam: boolean;
  isLoading: boolean;
}

/**
 * Hook to get user permissions based on their role from JWT token
 *
 * Role hierarchy:
 * - OWNER: Full access, can manage organization and team
 * - ADMIN: Can manage team members and all content
 * - MEMBER: Can create and edit content
 * - VIEWER: Read-only access
 */
export function usePermissions(): Permissions {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRole(payload.role || "MEMBER");
    } catch (error) {
      console.error("Failed to parse token for permissions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isOwner = role === "OWNER";
  const isAdmin = role === "ADMIN";
  const canEdit = role !== "VIEWER" && role !== null;
  const canManageTeam = role === "OWNER" || role === "ADMIN";

  return {
    role,
    isOwner,
    isAdmin,
    canEdit,
    canManageTeam,
    isLoading,
  };
}
