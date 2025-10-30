"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api";
import { toast } from "sonner";

// BlogEditor: simple, reusable blog create form.
// Use this in admin, provider, and staff areas.
// Keeps logic small and focused. Easy to extend later.

interface BlogPayload {
  title: string;
  coverImageUrl?: string;
  excerpt?: string;
  content?: string;
  status?: "draft" | "published";
}

interface BlogEditorProps {
  defaultStatus?: "draft" | "published";
}

const BlogEditor: React.FC<BlogEditorProps> = ({ defaultStatus = "draft" }) => {
  const [form, setForm] = useState<BlogPayload>({
    title: "",
    coverImageUrl: "",
    excerpt: "",
    content: "",
    status: defaultStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof BlogPayload, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setIsSubmitting(true);
    try {
      // Minimal payload. Backend can set author based on token.
      await apiClient.post("/blogs", form);
      toast.success("Blog saved");
      setForm({ title: "", coverImageUrl: "", excerpt: "", content: "", status: defaultStatus });
    } catch {
      toast.error("Failed to save blog");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white text-gray-900">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={e => handleChange("title", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white text-gray-900"
          placeholder="Enter blog title"
          required
        />
      </div>

      {/* Cover Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
        <input
          type="url"
          value={form.coverImageUrl || ""}
          onChange={e => handleChange("coverImageUrl", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white text-gray-900"
          placeholder="https://..."
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
        <textarea
          value={form.excerpt || ""}
          onChange={e => handleChange("excerpt", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white text-gray-900"
          placeholder="Short summary shown in lists"
          rows={3}
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea
          value={form.content || ""}
          onChange={e => handleChange("content", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white text-gray-900"
          placeholder="Write your blog content here"
          rows={10}
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={form.status}
          onChange={e => handleChange("status", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white text-gray-900"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div>
        <Button type="submit" disabled={isSubmitting} className="px-6">
          {isSubmitting ? "Saving..." : "Save Blog"}
        </Button>
      </div>
    </form>
  );
};

export default BlogEditor;


