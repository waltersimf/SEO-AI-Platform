"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface OrganizationUser {
  id: string;
  name: string;
  email: string;
}

interface CreateChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export function CreateChatDialog({ isOpen, onClose, onChatCreated }: CreateChatDialogProps) {
  const [chatName, setChatName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Get current user ID from JWT token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub || "");
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []);

  // Fetch organization users when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadOrganizationUsers();
      // Reset state when opening
      setChatName("");
      setSelectedUserIds([]);
      setError("");
    }
  }, [isOpen]);

  const loadOrganizationUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/users/organization", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out current user from members list
        const otherUsers = data.filter((user: OrganizationUser) => user.id !== currentUserId);
        setOrganizationUsers(otherUsers);
      }
    } catch (error) {
      console.error("Failed to load organization users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chatName.trim()) {
      setError("Chat name is required");
      return;
    }

    // Validation: At least 2 members must be selected
    if (selectedUserIds.length < 2) {
      setError("Please select at least 2 members for the group chat");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("You must be logged in to create a chat");
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:4000/api/chat/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: chatName.trim(),
          memberIds: [currentUserId, ...selectedUserIds], // Include creator + selected users
        }),
      });

      if (response.ok) {
        const newChat = await response.json();
        setChatName("");
        setSelectedUserIds([]);
        onChatCreated(newChat.id);
        onClose();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to create chat");
        console.error("Failed to create chat:", data);
      }
    } catch (err) {
      console.error("Error creating chat:", err);
      setError("Failed to create chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create New Group Chat</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="chatName" className="block text-sm font-medium mb-2">
              Chat Name
            </label>
            <input
              id="chatName"
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="e.g. Project Alpha, Marketing Team"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
          </div>

          {/* Add Members Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Add Members (min 2)
            </label>

            {loadingUsers ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Loading users...
              </div>
            ) : organizationUsers.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No other users in your organization
              </div>
            ) : (
              <>
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {organizationUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted cursor-pointer transition-colors border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        disabled={loading}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Selected count */}
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedUserIds.length} member{selectedUserIds.length !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={loading || loadingUsers}
            >
              {loading ? "Creating..." : "Create Chat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
