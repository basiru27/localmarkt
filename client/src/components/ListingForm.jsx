import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegions, useCategories } from '../hooks/useLookups';
import { useAuth } from '../context/AuthContext';
import { uploadImage, validateImage, compressImage, ImageUploadError } from '../lib/imageUpload';
import { isValidGambianPhone, formatGambianPhone } from '../lib/utils';

// Condition options for the listing
const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used_like_new', label: 'Used – Like New' },
  { value: 'used_good', label: 'Used – Good' },
  { value: 'used_fair', label: 'Used – Fair' },
];

import { useOffline } from '../context/OfflineContext';
import Modal, { ModalFooter } from './Modal';
import { formatPrice } from '../lib/utils';

export default function ListingForm({ initialData, onSubmit, isSubmitting }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const fileInputRef = useRef(null);
  
  const { data: regions, isLoading: regionsLoading } = useRegions();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    condition: initialData?.condition || '',
    region_id: initialData?.region_id || '',
    category_id: initialData?.category_id || '',
    contact: initialData?.contact || '+220 ',
    image_url: initialData?.image_url || '',
    negotiable: initialData?.negotiable || false,
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(
    Array.isArray(initialData?.images) && initialData.images.length > 0
      ? initialData.images
      : (initialData?.image_url ? [initialData.image_url] : [])
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [draftExists, setDraftExists] = useState(() => {
    if (!initialData) {
      return !!localStorage.getItem('localmarkt_listing_draft');
    }
    return false;
  });
  const [showPreview, setShowPreview] = useState(false);

  // Autosave draft
  useEffect(() => {
    if (initialData || draftExists) return;
    const timer = setTimeout(() => {
      localStorage.setItem('localmarkt_listing_draft', JSON.stringify(formData));
    }, 800);
    return () => clearTimeout(timer);
  }, [formData, initialData, draftExists]);

  const handleContinueDraft = () => {
    try {
      const saved = localStorage.getItem('localmarkt_listing_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      }
    } catch (e) {
      console.error(e);
    }
    setDraftExists(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('localmarkt_listing_draft');
    setDraftExists(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePhoneChange = (e) => {
    const { value } = e.target;
    
    // Format the phone number with Gambian mask
    const formattedValue = formatGambianPhone(value);
    
    setFormData((prev) => ({ ...prev, contact: formattedValue }));
    
    // Clear error when user starts typing
    if (errors.contact) {
      setErrors((prev) => ({ ...prev, contact: null }));
    }
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    if (imagePreviews.length + files.length > 5) {
      setErrors((prev) => ({ ...prev, image: 'Maximum 5 images allowed' }));
      return;
    }

    try {
      for (const file of files) {
        await validateImage(file);
      }
      setImageFiles(prev => [...prev, ...files]);
      setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
      setErrors((prev) => ({ ...prev, image: null }));
    } catch (error) {
      if (error instanceof ImageUploadError) {
        setErrors((prev) => ({ ...prev, image: error.message }));
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;

    if (imagePreviews.length + files.length > 5) {
      setErrors((prev) => ({ ...prev, image: 'Maximum 5 images allowed' }));
      return;
    }

    try {
      for (const file of files) {
        await validateImage(file);
      }
      setImageFiles(prev => [...prev, ...files]);
      setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
      setErrors((prev) => ({ ...prev, image: null }));
    } catch (error) {
      if (error instanceof ImageUploadError) {
        setErrors((prev) => ({ ...prev, image: error.message }));
      }
    }
  };

  const removeImage = (index) => {
    const isNewFile = typeof imagePreviews[index] === 'string' && imagePreviews[index].startsWith('blob:');
    if (isNewFile) {
      // It's a new file, remove from imageFiles based on how many exist
      // This is slightly tricky, we'll just rebuild the arrays
      const objUrl = imagePreviews[index];
      const fileIndex = imageFiles.findIndex(f => URL.createObjectURL(f) === objUrl || f.name); // approximation
      setImageFiles(prev => {
        const newFiles = [...prev];
        if (fileIndex !== -1) newFiles.splice(fileIndex, 1);
        else newFiles.splice(index - (imagePreviews.length - prev.length), 1);
        return newFiles;
      });
    }
    
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.contact.trim() || formData.contact.trim() === '+220') {
      newErrors.contact = 'Phone number is required';
    } else if (!isValidGambianPhone(formData.contact)) {
      newErrors.contact = 'Please enter a valid Gambian phone number (e.g. +220 3XXXXXX)';
    }

    if (!formData.region_id) {
      newErrors.region_id = 'Please select a region';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }

    if (!formData.condition) {
      newErrors.condition = 'Please select a condition';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    let uploadedUrls = [];
    let offlineImagesData = [];

    // Filter out existing URLs that were kept
    const existingUrls = imagePreviews.filter(p => typeof p === 'string' && !p.startsWith('blob:'));
    uploadedUrls = [...existingUrls];

    if (imageFiles.length > 0) {
      if (!isOnline) {
        try {
          for (const file of imageFiles) {
            const compressed = await compressImage(file);
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(compressed);
            });
            offlineImagesData.push({ dataUrl: base64, type: compressed.type, name: compressed.name });
          }
        } catch (err) {
          console.error(err);
          setErrors((prev) => ({ ...prev, image: 'Failed to process image for offline saving' }));
          return;
        }
      } else {
        try {
          if (!user || !user.id) {
            throw new Error("User session is missing or invalid. Please log out and log back in.");
          }
          
          setUploading(true);
          setUploadProgress(0);
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
          }, 200);
          
          for (const file of imageFiles) {
            const url = await uploadImage(file, user.id);
            uploadedUrls.push(url);
          }
          
          clearInterval(progressInterval);
          setUploadProgress(100);
        } catch (error) {
          setErrors((prev) => ({ ...prev, image: error.message }));
          setUploading(false);
          setUploadProgress(0);
          return;
        }
        setUploading(false);
      }
    }

    // Prepare submission data
    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      negotiable: formData.negotiable,
      region_id: parseInt(formData.region_id),
      category_id: parseInt(formData.category_id),
      image_url: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
      images: uploadedUrls,
      ...(offlineImagesData.length > 0 && { offlineImagesData }),
    };

    if (!initialData) {
      localStorage.removeItem('localmarkt_listing_draft');
    }

    onSubmit(submitData);
  };

  const handlePreviewPost = () => {
    setShowPreview(false);
    handleSubmit({ preventDefault: () => {} });
  };

  const isLoading = regionsLoading || categoriesLoading || isSubmitting || uploading;

  return (
    <>
      {draftExists && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 text-amber-800">
            <span className="text-lg">📝</span>
            <p className="text-sm font-semibold">You have an unsaved draft.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleContinueDraft}
              className="px-3 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Continue draft
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 text-xs font-bold bg-white text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="form-group">
        <label htmlFor="title" className="label">
          Title <span className="text-error" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`input ${errors.title ? 'input-error' : ''}`}
          placeholder="What are you selling?"
          maxLength={100}
          aria-required="true"
          aria-invalid={errors.title ? 'true' : 'false'}
          aria-describedby={errors.title ? 'title-error title-hint' : 'title-hint'}
        />
        {errors.title && (
          <p id="title-error" className="error-message" role="alert">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.title}
          </p>
        )}
        <p id="title-hint" className="text-xs text-text-muted mt-1">{formData.title.length}/100 characters</p>
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description" className="label">
          Description
          <span className="text-text-muted font-normal ml-1">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input min-h-[120px]"
          placeholder="Describe your item or service in detail..."
          rows={4}
        />
        <div className="mt-1 flex flex-col gap-1">
          <p className="text-xs text-text-muted">A good description helps buyers understand what you're offering</p>
          {(!formData.description || formData.description.length < 20) && (
            <p className="text-[12px] text-[#22c55e] italic flex items-center gap-1 opacity-90">
              💡 Listings with descriptions get 3× more contacts.
            </p>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="form-group">
        <label htmlFor="price" className="label">
          Price (GMD) <span className="text-error" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-14 bg-gray-50 border-r border-border rounded-l-xl" aria-hidden="true">
            <span className="text-sm font-semibold text-text-secondary">GMD</span>
          </div>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className={`input pl-20 text-lg font-semibold ${errors.price ? 'input-error' : ''}`}
            placeholder="0.00"
            min="0"
            step="0.01"
            aria-required="true"
            aria-invalid={errors.price ? 'true' : 'false'}
            aria-describedby={errors.price ? 'price-error' : undefined}
          />
        </div>
        {errors.price && (
          <p id="price-error" className="error-message" role="alert">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.price}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="negotiable"
            name="negotiable"
            checked={formData.negotiable}
            onChange={(e) => setFormData(prev => ({ ...prev, negotiable: e.target.checked }))}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="negotiable" className="text-sm text-text-secondary cursor-pointer select-none">
            Price is negotiable
          </label>
        </div>
      </div>

      {/* Category & Region - side by side on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category */}
        <div className="form-group">
          <label htmlFor="category_id" className="label">
            Category <span className="text-error" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className={`input ${errors.category_id ? 'input-error' : ''}`}
            disabled={categoriesLoading}
            aria-required="true"
            aria-invalid={errors.category_id ? 'true' : 'false'}
            aria-describedby={errors.category_id ? 'category-error' : undefined}
            aria-busy={categoriesLoading}
          >
            <option value="">Select category</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p id="category-error" className="error-message" role="alert">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.category_id}
            </p>
          )}
        </div>

        {/* Region */}
        <div className="form-group">
          <label htmlFor="region_id" className="label">
            Region <span className="text-error" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <select
            id="region_id"
            name="region_id"
            value={formData.region_id}
            onChange={handleChange}
            className={`input ${errors.region_id ? 'input-error' : ''}`}
            disabled={regionsLoading}
            aria-required="true"
            aria-invalid={errors.region_id ? 'true' : 'false'}
            aria-describedby={errors.region_id ? 'region-error' : undefined}
            aria-busy={regionsLoading}
          >
            <option value="">Select region</option>
            {regions?.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          {errors.region_id && (
            <p id="region-error" className="error-message" role="alert">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.region_id}
            </p>
          )}
        </div>
      </div>

      {/* Condition */}
      <div className="form-group">
        <label htmlFor="condition" className="label">
          Condition <span className="text-error" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <select
          id="condition"
          name="condition"
          value={formData.condition}
          onChange={handleChange}
          className={`input ${errors.condition ? 'input-error' : ''}`}
          aria-required="true"
          aria-invalid={errors.condition ? 'true' : 'false'}
          aria-describedby={errors.condition ? 'condition-error' : undefined}
        >
          <option value="">Select condition</option>
          {CONDITION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.condition && (
          <p id="condition-error" className="error-message" role="alert">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.condition}
          </p>
        )}
      </div>

      {/* Contact */}
      <div className="form-group">
        <label htmlFor="contact" className="label">
          Phone Number <span className="text-error" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true">
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <input
            type="tel"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handlePhoneChange}
            className={`input pl-12 ${errors.contact ? 'input-error' : ''}`}
            placeholder="+220 XXXXXXX"
            aria-required="true"
            aria-invalid={errors.contact ? 'true' : 'false'}
            aria-describedby={errors.contact ? 'contact-error contact-hint' : 'contact-hint'}
          />
        </div>
        {errors.contact && (
          <p id="contact-error" className="error-message" role="alert">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.contact}
          </p>
        )}
        <p id="contact-hint" className="text-xs text-text-muted mt-1 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Gambian numbers only. Only visible to logged-in users.
        </p>
      </div>

      {/* Image Upload */}
      <div className="form-group">
        <label id="image-upload-label" className="label">
          Product Image
          <span className="text-text-muted font-normal ml-1">(optional)</span>
        </label>
        
        {imagePreviews.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4">
            {imagePreviews.map((preview, idx) => (
              <div key={idx} className="relative inline-block animate-scale-in">
                <img
                  src={preview}
                  alt={`Preview ${idx + 1}`}
                  className="w-[72px] h-[72px] rounded-xl object-cover shadow-lg"
                />
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded">Cover</span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  aria-label="Remove image"
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 focus:outline-none transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        {imagePreviews.length < 5 && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            aria-labelledby="image-upload-label"
            aria-describedby="image-upload-hint"
            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              dragActive 
                ? 'border-primary bg-primary-50 scale-[1.02]' 
                : 'border-border hover:border-primary hover:bg-gray-50'
            } ${imagePreviews.length === 0 ? 'h-[120px]' : 'py-6'}`}
          >
            <div className={`w-10 h-10 mb-2 rounded-xl flex items-center justify-center transition-colors ${
              dragActive ? 'bg-primary text-white' : 'bg-gray-100 text-text-muted'
            }`} aria-hidden="true">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text mb-0.5">
                {dragActive ? 'Drop your image here' : 'Click to upload or drag and drop'}
              </p>
              <p id="image-upload-hint" className="text-xs text-text-muted">JPEG, PNG, or WebP (max 5MB)</p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleImageSelect}
          className="sr-only"
          aria-labelledby="image-upload-label"
          aria-describedby="image-upload-hint"
        />
        
        {errors.image && (
          <p className="error-message mt-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.image}
          </p>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-primary-50 rounded-xl p-4 animate-fade-in" role="status" aria-live="polite">
          <div className="flex items-center gap-3 mb-2">
            <div className="spinner" aria-hidden="true" />
            <span className="text-sm font-medium text-primary">Uploading image... {uploadProgress}%</span>
          </div>
          <div className="w-full bg-white rounded-full h-2 overflow-hidden" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1 py-3.5 text-base"
        >
          {uploading ? (
            <>
              <div className="spinner w-5 h-5 border-white border-t-transparent" />
              Uploading image...
            </>
          ) : isSubmitting ? (
            <>
              <div className="spinner w-5 h-5 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {initialData ? 'Update Listing' : 'Post Listing'}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            if (validate()) setShowPreview(true);
          }}
          className="btn-secondary py-3.5 flex-1"
          disabled={isLoading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-ghost py-3.5 px-4"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
      </form>
      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Listing Preview"
        size="preview"
      >
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
                {imagePreviews.length > 0 ? (
                  <img src={imagePreviews[0]} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">No Image Provided</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-text leading-tight mb-2 break-words">
                  {formData.title || 'Untitled Listing'}
                </h2>
                <div className="price-tag text-xl inline-flex items-center gap-2">
                  {formData.price ? formatPrice(formData.price) : 'GMD 0.00'}
                  {formData.negotiable && (
                    <span className="ml-2 px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
                      Negotiable
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.condition && (
                  <span className="badge-secondary border border-gray-200">
                    {CONDITION_OPTIONS.find(c => c.value === formData.condition)?.label || formData.condition}
                  </span>
                )}
                {formData.region_id && (
                  <span className="badge-secondary border border-gray-200">
                    {regions?.find(r => r.id === parseInt(formData.region_id))?.name || 'Region'}
                  </span>
                )}
                {formData.category_id && (
                  <span className="badge-secondary border border-gray-200">
                    {categories?.find(c => c.id === parseInt(formData.category_id))?.name || 'Category'}
                  </span>
                )}
              </div>

              <div className="card-static p-4">
                <h3 className="font-semibold text-text mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                  Description
                </h3>
                <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {formData.description || <span className="italic text-gray-400">No description provided.</span>}
                </p>
              </div>

              <div className="card-static p-4">
                <h3 className="font-semibold text-text mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Contact Preview
                </h3>
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-3 border border-primary/10">
                  <p className="text-text font-semibold text-center">{formData.contact || '+220 XXXXXXX'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ModalFooter>
          <button type="button" onClick={() => setShowPreview(false)} className="btn-secondary">
            Edit Form
          </button>
          <button type="button" onClick={handlePreviewPost} className="btn-primary" disabled={isLoading}>
            {uploading || isSubmitting ? 'Posting...' : 'Looks good — Post Listing'}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}
