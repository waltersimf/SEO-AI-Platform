"use client";

import { useEffect, useState } from "react";
import { User as UserIcon } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserListProps {
  onUserClick: (userId: string) => void;
  currentUserId: string;
}

export function UserList({ onUserClick, currentUserId }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:4000/api/users/organization", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError("Failed to load users");
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b bg-muted/50">
        <h3 className="font-semibold">Team Members</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Click to start a direct chat
        </p>
      </div>
      <div className="divide-y">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onUserClick(user.id)}
            disabled={user.id === currentUserId}
            className={`w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${
              user.id === currentUserId ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            {user.id === currentUserId && (
              <span className="text-xs text-muted-foreground">(You)</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
