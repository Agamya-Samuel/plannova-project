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
  backgroundImages?: string[]; // Legacy field - kept for backward compatibility
  backgroundImagesMobile?: string[]; // Images optimized for mobile devices
  backgroundImagesLaptop?: string[]; // Images optimized for laptop/desktop devices
  textGradientFrom?: string;
  textGradientTo?: string;
  typingOptions?: string[]; // Array of options for typing effect (e.g., "wedding platform", "corporate wedding")
  backgroundBlur?: number; // Background blur level: 0-100 (0 = no blur, 100 = maximum blur)
};

const PAGE_KEY = 'home';

export default function AdminPageSettings() {
  const { isLoading, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [backgroundImagesMobile, setBackgroundImagesMobile] = useState<string[]>(['']); // Images for mobile devices
  const [backgroundImagesLaptop, setBackgroundImagesLaptop] = useState<string[]>(['']); // Images for laptop/desktop devices
  const [textGradientFrom, setTextGradientFrom] = useState<string>('');
  const [textGradientTo, setTextGradientTo] = useState<string>('');
  const [typingOptions, setTypingOptions] = useState<string[]>(['']); // Options for typing effect
  const [backgroundBlur, setBackgroundBlur] = useState<number>(4); // Background blur level: 0-100, default 4 to match previous 'sm' behavior

  // Fetch existing settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<PageSettingsDto>(`/page-settings/${PAGE_KEY}`);
      setTitle(res.data.title || '');
      setDescription(res.data.description || '');
      // Load mobile and laptop images, fallback to legacy backgroundImages if needed
      setBackgroundImagesMobile(res.data.backgroundImagesMobile?.length ? res.data.backgroundImagesMobile : (res.data.backgroundImages?.length ? res.data.backgroundImages : ['']));
      setBackgroundImagesLaptop(res.data.backgroundImagesLaptop?.length ? res.data.backgroundImagesLaptop : (res.data.backgroundImages?.length ? res.data.backgroundImages : ['']));
      setTextGradientFrom(res.data.textGradientFrom || '');
      setTextGradientTo(res.data.textGradientTo || '');
      setTypingOptions(res.data.typingOptions?.length ? res.data.typingOptions : ['']);
      setBackgroundBlur(typeof res.data.backgroundBlur === 'number' ? res.data.backgroundBlur : 4); // Default to 4 if not set (matches previous 'sm' behavior)
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

  // Mobile image management functions
  const addMobileImageField = () => setBackgroundImagesMobile((prev) => [...prev, '']);
  const removeMobileImageField = (index: number) => setBackgroundImagesMobile((prev) => prev.filter((_, i) => i !== index));
  const updateMobileImage = (index: number, value: string) =>
    setBackgroundImagesMobile((prev) => prev.map((v, i) => (i === index ? value : v)));
  
  // Laptop image management functions
  const addLaptopImageField = () => setBackgroundImagesLaptop((prev) => [...prev, '']);
  const removeLaptopImageField = (index: number) => setBackgroundImagesLaptop((prev) => prev.filter((_, i) => i !== index));
  const updateLaptopImage = (index: number, value: string) =>
    setBackgroundImagesLaptop((prev) => prev.map((v, i) => (i === index ? value : v)));
  
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
    // Clean mobile and laptop images - remove empty strings
    const cleanedMobile = backgroundImagesMobile.map((u) => u.trim()).filter((u) => u.length > 0);
    const cleanedLaptop = backgroundImagesLaptop.map((u) => u.trim()).filter((u) => u.length > 0);
    
    // Require at least one image for each device type
    if (cleanedMobile.length === 0) {
      toast.error('Add at least one mobile background image URL');
      return;
    }
    if (cleanedLaptop.length === 0) {
      toast.error('Add at least one laptop background image URL');
      return;
    }
    
    try {
      setSaving(true);
      // Clean typing options - remove empty strings
      const cleanedTypingOptions = typingOptions.map((opt) => opt.trim()).filter((opt) => opt.length > 0);
      
      await apiClient.put(`/page-settings/${PAGE_KEY}`, {
        title: title.trim(),
        description: description.trim() || undefined,
        backgroundImagesMobile: cleanedMobile,
        backgroundImagesLaptop: cleanedLaptop,
        textGradientFrom: textGradientFrom || undefined,
        textGradientTo: textGradientTo || undefined,
        typingOptions: cleanedTypingOptions.length > 0 ? cleanedTypingOptions : undefined,
        backgroundBlur: backgroundBlur || undefined,
      });
      await fetchSettings();
      toast.success('Page settings saved');
      router.push('/');
    } catch (error: unknown) {
      console.error('Error saving page settings:', error);
      const apiError = error as { response?: { status?: number; data?: { error?: string } } };
      if (apiError.response?.status === 403) {
        toast.error('Access denied. Admin role required to save page settings.');
      } else {
        toast.error(apiError.response?.data?.error || 'Failed to save page settings');
      }
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

          {/* Mobile Background Images Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Mobile Background Image URLs
                <span className="text-xs text-gray-500 ml-2">(Shown on mobile devices)</span>
              </label>
              <Button variant="ghost" onClick={addMobileImageField} disabled={loading}>
                <Plus className="h-4 w-4 mr-1" /> Add URL
              </Button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Add multiple images to enable random selection. Images will be randomly displayed on mobile devices.
            </p>
            <div className="space-y-3">
              {backgroundImagesMobile.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateMobileImage(index, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                    placeholder="https://example.com/mobile-image.jpg"
                    disabled={loading}
                  />
                  <Button variant="destructive" onClick={() => removeMobileImageField(index)} disabled={loading || backgroundImagesMobile.length === 1}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Laptop Background Images Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Laptop/Desktop Background Image URLs
                <span className="text-xs text-gray-500 ml-2">(Shown on laptop and desktop devices)</span>
              </label>
              <Button variant="ghost" onClick={addLaptopImageField} disabled={loading}>
                <Plus className="h-4 w-4 mr-1" /> Add URL
              </Button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Add multiple images to enable random selection. Images will be randomly displayed on laptop and desktop devices.
            </p>
            <div className="space-y-3">
              {backgroundImagesLaptop.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateLaptopImage(index, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                    placeholder="https://example.com/laptop-image.jpg"
                    disabled={loading}
                  />
                  <Button variant="destructive" onClick={() => removeLaptopImageField(index)} disabled={loading || backgroundImagesLaptop.length === 1}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Background Blur Control Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Background Blur Level
              </label>
              <span className="text-sm font-semibold text-pink-600">
                {backgroundBlur}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Control the blur amount applied to the homepage background image (0 = no blur, 100 = maximum blur)
            </p>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={backgroundBlur}
              onChange={(e) => setBackgroundBlur(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
              disabled={loading}
            />
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


