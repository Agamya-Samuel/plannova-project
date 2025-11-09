'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Save, Trash } from 'lucide-react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

type PageSettingsDto = {
  key: string;
  title: string;
  description?: string;
  backgroundImages: string[];
  textGradientFrom?: string;
  textGradientTo?: string;
  typingOptions?: string[]; // Array of options for typing effect (e.g., "wedding platform", "corporate wedding")
};

const PAGE_KEY = 'home';

export default function AdminPageSettings() {
  const { isLoading, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [backgroundImages, setBackgroundImages] = useState<string[]>(['']);
  const [textGradientFrom, setTextGradientFrom] = useState<string>('');
  const [textGradientTo, setTextGradientTo] = useState<string>('');
  const [typingOptions, setTypingOptions] = useState<string[]>(['']); // Options for typing effect

  // Fetch existing settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<PageSettingsDto>(`/page-settings/${PAGE_KEY}`);
      setTitle(res.data.title || '');
      setDescription(res.data.description || '');
      setBackgroundImages(res.data.backgroundImages?.length ? res.data.backgroundImages : ['']);
      setTextGradientFrom(res.data.textGradientFrom || '');
      setTextGradientTo(res.data.textGradientTo || '');
      setTypingOptions(res.data.typingOptions?.length ? res.data.typingOptions : ['']);
    } catch {
      // If not found, keep defaults and allow creating
      if (process.env.NODE_ENV === 'development') {
        console.log('No existing page settings, will create on save');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const addImageField = () => setBackgroundImages((prev) => [...prev, '']);
  const removeImageField = (index: number) => setBackgroundImages((prev) => prev.filter((_, i) => i !== index));
  const updateImage = (index: number, value: string) =>
    setBackgroundImages((prev) => prev.map((v, i) => (i === index ? value : v)));
  
  // Typing options management functions
  const addTypingOption = () => setTypingOptions((prev) => [...prev, '']);
  const removeTypingOption = (index: number) => setTypingOptions((prev) => prev.filter((_, i) => i !== index));
  const updateTypingOption = (index: number, value: string) =>
    setTypingOptions((prev) => prev.map((v, i) => (i === index ? value : v)));

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    const cleaned = backgroundImages.map((u) => u.trim()).filter((u) => u.length > 0);
    if (cleaned.length === 0) {
      toast.error('Add at least one background image URL');
      return;
    }
    try {
      setSaving(true);
      // Clean typing options - remove empty strings
      const cleanedTypingOptions = typingOptions.map((opt) => opt.trim()).filter((opt) => opt.length > 0);
      
      await apiClient.put(`/page-settings/${PAGE_KEY}`, {
        title: title.trim(),
        description: description.trim() || undefined,
        backgroundImages: cleaned,
        textGradientFrom: textGradientFrom || undefined,
        textGradientTo: textGradientTo || undefined,
        typingOptions: cleanedTypingOptions.length > 0 ? cleanedTypingOptions : undefined,
      });
      await fetchSettings();
      toast.success('Page settings saved');
      router.push('/');
    } catch {
      toast.error('Failed to save page settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoading && user?.role !== 'ADMIN') {
    return <div>Your session timed out. Please log in again.</div>;
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Page Settings</h1>
              <p className="text-gray-600">Configure homepage title and background images</p>
            </div>
            <Settings className="h-6 w-6 text-gray-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {/* Gradient Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Text Gradient</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                ['#ffffff','#ffffff'],
                ['#ffffff','#e5e7eb'],
                ['#f472b6','#c084fc'],
                ['#22d3ee','#a78bfa'],
                ['#34d399','#10b981'],
                ['#f59e0b','#ef4444']
              ].map((pair, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setTextGradientFrom(pair[0]); setTextGradientTo(pair[1]); }}
                  className={`h-8 w-14 rounded border ${textGradientFrom===pair[0] && textGradientTo===pair[1] ? 'ring-2 ring-pink-500' : 'border-gray-200'}`}
                  style={{ backgroundImage: `linear-gradient(90deg, ${pair[0]}, ${pair[1]})` }}
                  aria-label={`Gradient ${idx+1}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">From</span>
                <input type="color" value={textGradientFrom || '#ffffff'} onChange={(e)=>setTextGradientFrom(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">To</span>
                <input type="color" value={textGradientTo || '#ffffff'} onChange={(e)=>setTextGradientTo(e.target.value)} />
              </div>
              <div className="text-sm text-gray-500">Applies to title and description</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Page Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
              placeholder="Enter homepage title"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
              placeholder="Short subtitle/description shown under the title"
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Background Image URLs</label>
              <Button variant="ghost" onClick={addImageField} disabled={loading}>
                <Plus className="h-4 w-4 mr-1" /> Add URL
              </Button>
            </div>
            <div className="space-y-3">
              {backgroundImages.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateImage(index, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                    placeholder="https://example.com/image.jpg"
                    disabled={loading}
                  />
                  <Button variant="destructive" onClick={() => removeImageField(index)} disabled={loading || backgroundImages.length === 1}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Typing Options Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Typing Effect Options</label>
              <Button variant="ghost" onClick={addTypingOption} disabled={loading}>
                <Plus className="h-4 w-4 mr-1" /> Add Option
              </Button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              These options will cycle through with a typing effect below &quot;Welcome to Plannova&quot; (e.g., &quot;wedding platform&quot;, &quot;corporate wedding&quot;)
            </p>
            <div className="space-y-3">
              {typingOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateTypingOption(index, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                    placeholder="e.g., wedding platform"
                    disabled={loading}
                  />
                  <Button variant="destructive" onClick={() => removeTypingOption(index)} disabled={loading || typingOptions.length === 1}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || loading}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


