import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';
import { formatGambianPhone, isValidGambianPhone } from '../lib/utils';

export default function Profile() {
  const queryClient = useQueryClient();
  const { session, user, refreshProfile } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [phoneValue, setPhoneValue] = useState('+220 ');
  const [phoneError, setPhoneError] = useState('');

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

  useEffect(() => {
    if (profile?.phone_number) {
      setPhoneValue(profile.phone_number);
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await profileApi.update(updatedData, getAuthHeader());
      return res;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      refreshProfile(user.id);
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
      const fileName = `${profile?.id || user.id}-${Math.random()}.${fileExt}`;
      
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

  const handleAvatarRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    setUploading(true);
    setErrorMsg('');
    setSuccessMessage('');

    try {
      if (profile?.avatar_url) {
        const urlParts = profile.avatar_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          await supabase.storage.from('avatars').remove([fileName]);
        }
      }

      mutation.mutate({ 
        ...profile, 
        avatar_url: null 
      }, {
        onSettled: () => setUploading(false)
      });
    } catch (err) {
      console.error('Avatar remove error:', err);
      setErrorMsg('Failed to remove avatar.');
      setUploading(false);
    }
  };

  const handlePhoneChange = (e) => {
    setPhoneValue(formatGambianPhone(e.target.value));
    if (phoneError) setPhoneError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (phoneValue && phoneValue.trim() !== '+220' && phoneValue.trim() !== '') {
      if (!isValidGambianPhone(phoneValue)) {
        setPhoneError('Please enter a valid Gambian phone number (e.g. +220 3XXXXXX)');
        return;
      }
    } else {
       // Clear if it's just the prefix or empty
       if (phoneValue.trim() === '+220') {
           setPhoneValue('');
       }
    }

    const formData = new FormData(e.target);
    mutation.mutate({
      display_name: formData.get('display_name'),
      phone_number: phoneValue.trim() === '+220' ? '' : phoneValue,
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

  const displayName = profile?.display_name || user?.user_metadata?.display_name || '';
  const email = profile?.email || user?.email || '';
  const initial = (displayName.charAt(0) || email.charAt(0) || 'U').toUpperCase();

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
          <div className="relative group inline-block">
            {profile?.avatar_url ? (
              <>
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAvatarRemove();
                  }}
                  disabled={uploading}
                  className="absolute top-0 right-0 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  title="Remove avatar"
                  aria-label="Remove avatar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-3xl font-bold shadow-md">
                {initial}
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
            <h2 className="text-lg font-bold text-text">{displayName || 'Anonymous User'}</h2>
            <p className="text-sm text-text-muted">{email}</p>
            <p className="text-xs text-text-muted mt-1 bg-gray-100 px-2 py-1 rounded inline-block">
              Role: <span className="capitalize font-semibold text-primary">{profile?.role || 'user'}</span>
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="form-group">
            <label htmlFor="display_name" className="label">
              Display Name
            </label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              defaultValue={displayName}
              className="input"
              placeholder="e.g., Momodou Jallow"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone_number" className="label">
              Phone Number <span className="text-text-muted font-normal ml-1">(Buyers will see this to contact you)</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true">
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={phoneValue}
                onChange={handlePhoneChange}
                className={`input pl-12 ${phoneError ? 'input-error' : ''}`}
                placeholder="+220 XXXXXXX"
                aria-invalid={phoneError ? 'true' : 'false'}
              />
            </div>
            {phoneError && (
              <p className="error-message" role="alert">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {phoneError}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="bio" className="label">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              defaultValue={profile?.bio || ''}
              className="input min-h-[120px]"
              placeholder="Tell buyers a bit about yourself or your shop..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <button 
              type="submit" 
              disabled={mutation.isPending || uploading}
              className="btn-primary flex-1 py-3.5 text-base"
            >
              {mutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
