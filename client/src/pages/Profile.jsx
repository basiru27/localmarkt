import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const getAuthHeader = () => {
    if (!session?.access_token) return {};
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await profileApi.get(getAuthHeader());
      return res;
    }
  });

  const mutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await profileApi.update(updatedData, getAuthHeader());
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setErrorMsg('');
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to update profile');
      setSuccessMessage('');
    }
  });

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg('');
    setSuccessMessage('');

    try {
      // Compress
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      // Update Profile Record
      mutation.mutate({ 
        ...profile, 
        avatar_url: publicUrl 
      });

    } catch (err) {
      console.error('Avatar upload error:', err);
      setErrorMsg('Failed to upload avatar.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    mutation.mutate({
      display_name: formData.get('display_name'),
      phone_number: formData.get('phone_number'),
      bio: formData.get('bio'),
      avatar_url: profile?.avatar_url
    });
  };

  if (isLoading) {
    return (
      <div className="container-app py-8 animate-pulse flex flex-col items-center gap-4">
        <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
        <div className="w-64 h-8 bg-gray-200 rounded"></div>
        <div className="w-96 h-32 bg-gray-200 rounded mt-4"></div>
      </div>
    );
  }

  return (
    <div className="container-app py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-text">My Profile</h1>
      
      {successMessage && (
        <div className="alert alert-success mb-6">
          {successMessage}
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-error mb-6">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden">
        
        {/* Avatar Section */}
        <div className="p-6 border-b border-border-light flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                {profile?.display_name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase()}
              </div>
            )}
            
            <label className={`absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${uploading ? 'opacity-100' : ''}`}>
              {uploading ? (
                <div className="spinner w-6 h-6 border-white border-t-transparent" />
              ) : (
                <>
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[10px] font-medium">Upload</span>
                </>
              )}
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </label>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-text">{profile?.display_name || 'Anonymous User'}</h2>
            <p className="text-sm text-text-muted">{profile?.email}</p>
            <p className="text-xs text-text-muted mt-1 bg-gray-100 px-2 py-1 rounded inline-block">
              Role: <span className="capitalize font-semibold text-primary">{profile?.role}</span>
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label htmlFor="display_name" className="block text-sm font-semibold text-text mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              defaultValue={profile?.display_name || ''}
              className="input w-full"
              placeholder="e.g., Momodou Jallow"
            />
          </div>

          <div>
            <label htmlFor="phone_number" className="block text-sm font-semibold text-text mb-1">
              Phone Number <span className="text-xs text-text-muted font-normal">(Buyers will see this to contact you)</span>
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              defaultValue={profile?.phone_number || ''}
              className="input w-full"
              placeholder="+220 700 0000"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-semibold text-text mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              defaultValue={profile?.bio || ''}
              className="input w-full resize-none"
              placeholder="Tell buyers a bit about yourself or your shop..."
            />
          </div>

          <div className="pt-4 border-t border-border-light flex justify-end">
            <button 
              type="submit" 
              disabled={mutation.isPending || uploading}
              className="btn-primary w-full sm:w-auto"
            >
              {mutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
