import useDocumentTitle from '../hooks/useDocumentTitle';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';
import { formatGambianPhone, isValidGambianPhone } from '../lib/utils';
import AvatarImage from '../components/AvatarImage';

export default function Profile() {
  useDocumentTitle('My Profile');

  const queryClient = useQueryClient();
  const { session, user, refreshProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  // Tab State
  const [activeTab, setActiveTab] = useState('profile');
  
  const [uploading, setUploading] = useState(false);
  const [phoneValue, setPhoneValue] = useState('+220 ');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [bioError, setBioError] = useState('');
  
  // Security Tab State
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Notifications Tab State
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState({
    email_contact: true,
    email_moderation: true,
    email_sales: true
  });

  const fileInputRef = useRef(null);

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
  
  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);
  
  useEffect(() => {
    if (profile?.notifications) {
      setEmailPrefs(profile.notifications);
    } else if (profile) {
      // Fallback for existing rows without notifications backfilled yet
      setEmailPrefs({ email_contact: true, email_moderation: true, email_sales: true });
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
      success('Profile updated successfully!');
    },
    onError: (err) => {
      const details = err.response?.data?.details;
      if (details && Array.isArray(details)) {
        const msgs = details.map(d => `${d.field}: ${d.message}`).join('; ');
        showError(msgs || 'Failed to update profile');
      } else {
        showError(err.response?.data?.error || err.message || 'Failed to update profile');
      }
    }
  });

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 500,
      };

      let compressedFile;
      try {
        compressedFile = await imageCompression(file, options);
      } catch (compressErr) {
        console.error('Image compression failed:', compressErr);
        showError('Image compression failed. Try a smaller image.');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id || user.id}-${Math.random()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile);

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        showError(`Upload failed: ${uploadError.message || 'Unknown storage error'}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      mutation.mutate({ avatar_url: publicUrl });

    } catch (err) {
      console.error('Unexpected avatar error:', err);
      showError(err.message || 'Failed to upload avatar.');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    setUploading(true);

    try {
      await profileApi.deleteAvatar(getAuthHeader());
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      refreshProfile(user.id);
      success('Avatar removed successfully!');
    } catch (err) {
      console.error('Avatar remove error:', err);
      showError(err.response?.data?.error || err.message || 'Failed to remove avatar.');
    } finally {
      setUploading(false);
    }
  };

  const handlePhoneChange = (e) => {
    setPhoneValue(formatGambianPhone(e.target.value));
    if (phoneError) setPhoneError('');
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const displayNameVal = formData.get('display_name');

    if (!displayNameVal || displayNameVal.trim().length < 2) {
      setNameError('Display name must be at least 2 characters');
      return;
    } else {
      setNameError('');
    }

    if (!phoneValue || phoneValue.trim() === '' || phoneValue.trim() === '+220') {
      setPhoneError('Phone number is required');
      return;
    } else if (!isValidGambianPhone(phoneValue)) {
      setPhoneError('Please enter a valid Gambian phone number (e.g. +220 3XXXXXX)');
      return;
    } else {
      setPhoneError('');
    }

    const bioVal = formData.get('bio');
    if (bioVal && bioVal.length > 500) {
      setBioError('Bio must not exceed 500 characters');
      return;
    } else {
      setBioError('');
    }

    mutation.mutate({
      display_name: displayNameVal,
      phone_number: phoneValue,
      bio: bioVal,
      avatar_url: profile?.avatar_url
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    try {
      // Supabase enforces confirming previous logic or sending a recovery email if not signed in,
      // but since they are signed in, updateUser updates the password directly.
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;
      
      success('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.message || 'Failed to update password.');
    }
  };

  const togglePushNotifications = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop notification");
      return;
    }

    if (Notification.permission === "granted") {
      // Cannot programmatically revoke permission. Provide instruction.
      alert("Please revoke notification permissions in your browser settings.");
      return;
    }

    if (Notification.permission !== "denied" || Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === "granted");
      if (permission === "granted") {
        success("Push notifications enabled!");
      }
    }
  };

  const handleEmailToggle = async (key) => {
    const newPrefs = { ...emailPrefs, [key]: !emailPrefs[key] };
    setEmailPrefs(newPrefs);
    
    try {
      await profileApi.update({ notifications: newPrefs }, getAuthHeader());
      success(`${key === 'email_contact' ? 'Contact requests' : key === 'email_moderation' ? 'Moderation alerts' : 'New sales alerts'} notification preference updated.`);
    } catch (err) {
      setEmailPrefs({ ...emailPrefs }); // revert
      showError(err.message || 'Failed to update notification preference.');
    }
  };

  const getEmailLabel = (key) => {
    switch(key) {
      case 'email_contact': return 'Contact request alerts';
      case 'email_moderation': return 'Moderation & policy alerts';
      case 'email_sales': return 'New sales notifications';
      default: return key;
    }
  };

  if (isLoading) {
    return (
      <div className="container-app py-8 animate-pulse flex flex-col items-center gap-4">
        <div className="w-24 h-24 bg-[#F5EFE8] animate-pulse rounded-full"></div>
        <div className="w-64 h-8 bg-[#F5EFE8] animate-pulse rounded"></div>
        <div className="w-96 h-32 bg-[#F5EFE8] animate-pulse rounded mt-4"></div>
      </div>
    );
  }

  const displayName = profile?.display_name || user?.user_metadata?.display_name || '';
  const email = profile?.email || user?.email || '';

  return (
    <div className="container-app py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-text">Account Settings</h1>

      {/* Tabs Navigation */}
      <div className="border-b border-border mb-6 overflow-x-auto scrollbar-hide">
        <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex-shrink-0 ${
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:border-border hover:text-text'
            }`}>
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex-shrink-0 ${
              activeTab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:border-border hover:text-text'
            }`}>
            Security & Auth
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex-shrink-0 ${
              activeTab === 'notifications'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:border-border hover:text-text'
            }`}>
            Notifications
          </button>
        </nav>
      </div>

      {activeTab === 'profile' && (
        <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden">
          {/* Avatar Section */}
          <div className="p-6 border-b border-border-light flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group inline-block">
              <AvatarImage 
                src={profile?.avatar_url} 
                name={displayName}
                size="xl"
                className="border-4 border-white shadow-md"
              />
              
              {/* Remove X — always visible on mobile, hover on desktop */}
              {profile?.avatar_url && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAvatarRemove();
                  }}
                  disabled={uploading}
                  className="absolute -top-1.5 -right-1.5 w-11 h-11 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  title="Remove avatar"
                  aria-label="Remove avatar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Desktop hover overlay — hidden on mobile */}
              <label 
                htmlFor="avatar-upload-input"
                className={`absolute inset-0 bg-black/50 text-white rounded-full flex-col items-center justify-center cursor-pointer hidden sm:flex sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${uploading ? 'opacity-100' : ''}`}
              >
                {uploading ? (
                  <div className="spinner w-6 h-6 border-white border-t-transparent" />
                ) : (
                  <>
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[10px] font-medium">Change Photo</span>
                  </>
                )}
              </label>
              
              {/* Mobile camera badge — always visible */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`absolute -bottom-0.5 -right-0.5 w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white sm:hidden z-20 transition-opacity ${uploading ? 'opacity-60' : 'hover:opacity-90'}`}
                aria-label="Upload avatar"
              >
                {uploading ? (
                  <div className="spinner w-5 h-5 border-white border-t-transparent" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              
              {/* Hidden file input — shared by desktop label and mobile button */}
              <input
                ref={fileInputRef}
                id="avatar-upload-input"
                type="file"
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
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
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
            <div className="form-group">
              <label htmlFor="display_name" className="label">
                Display Name <span className="text-error" aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                defaultValue={displayName}
                onChange={() => { if (nameError) setNameError('') }}
                className={`input ${nameError ? 'input-error' : ''}`}
                placeholder="e.g., Momodou Jallow"
              />
              {nameError && <p className="error-message text-red-500 mt-1 text-sm">{nameError}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="phone_number" className="label">
                Phone Number <span className="text-error" aria-hidden="true">*</span> <span className="text-text-muted font-normal ml-1">(Buyers will see this to contact you)</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
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
                />
              </div>
              {phoneError && <p className="error-message text-red-500 mt-1 text-sm">{phoneError}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="bio" className="label">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                defaultValue={profile?.bio || ''}
                className="input min-h-[120px]"
                placeholder="Tell buyers a bit about yourself or your shop..."
                onChange={() => bioError && setBioError('')}
              />
              {bioError && <p className="error-message text-red-500 mt-1 text-sm">{bioError}</p>}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
              <button 
                type="submit" 
                disabled={mutation.isPending || uploading}
                className="btn-primary w-full sm:flex-1"
              >
                {mutation.isPending ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden p-6">
          <h2 className="text-lg font-bold text-text mb-4">Change Password</h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="form-group">
              <label className="label">Email Address</label>
              <input type="email" value={email} disabled className="input bg-gray-50 text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Your email address is managed through your authentication provider.</p>
            </div>

            <div className="form-group">
              <label htmlFor="newPassword" className="label">New Password</label>
              <input
                type="password"
                id="newPassword"
                className="input"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="input"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full sm:w-auto">
              Update Password
            </button>
          </form>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden p-6">
          <h2 className="text-lg font-bold text-text mb-4">Notification Preferences</h2>

          <div className="flex items-center justify-between py-4 border-b border-border-light gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text">Push Notifications</h3>
              <p className="text-sm text-text-muted">Receive alerts for listings and messages on this device.</p>
            </div>
            <div>
              <button
                onClick={togglePushNotifications}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  pushEnabled ? 'bg-primary' : 'bg-gray-300'
                }`}
                aria-pressed={pushEnabled}
                style={{ minWidth: 0, minHeight: 0 }}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    pushEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
          
          <p className="text-sm font-medium text-text mt-6 mb-3">Email Notifications</p>
          {Object.entries(emailPrefs).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-border-light last:border-0 gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-text text-sm">{getEmailLabel(key)}</h3>
                <p className="text-xs text-text-muted whitespace-normal">
                  {key === 'email_contact' ? 'Get notified when someone contacts you' :
                   key === 'email_moderation' ? 'Updates on your listings and reports' :
                   'Receive order confirmations and sales updates'}
                </p>
              </div>
              <button
                onClick={() => handleEmailToggle(key)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  enabled ? 'bg-primary' : 'bg-gray-300'
                }`}
                aria-pressed={enabled}
                style={{ minWidth: 0, minHeight: 0 }}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
