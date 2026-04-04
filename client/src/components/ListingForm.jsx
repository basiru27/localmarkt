import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegions, useCategories } from '../hooks/useLookups';
import { useAuth } from '../context/AuthContext';
import { uploadImage, validateImage, ImageUploadError } from '../lib/imageUpload';
import { isValidGambianPhone, formatGambianPhone } from '../lib/utils';

export default function ListingForm({ initialData, onSubmit, isSubmitting }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const { data: regions, isLoading: regionsLoading } = useRegions();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    region_id: initialData?.region_id || '',
    category_id: initialData?.category_id || '',
    contact: initialData?.contact || '+220 ',
    image_url: initialData?.image_url || '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData?.image_url || null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);

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
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await validateImage(file);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: null }));
    } catch (error) {
      if (error instanceof ImageUploadError) {
        setErrors((prev) => ({ ...prev, image: error.message }));
      }
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      await validateImage(file);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: null }));
    } catch (error) {
      if (error instanceof ImageUploadError) {
        setErrors((prev) => ({ ...prev, image: error.message }));
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    let finalImageUrl = formData.image_url;

    // Upload new image if selected
    if (imageFile) {
      try {
        setUploading(true);
        setUploadProgress(0);
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);
        
        finalImageUrl = await uploadImage(imageFile, user.id);
        
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

    // Prepare submission data
    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      region_id: parseInt(formData.region_id),
      category_id: parseInt(formData.category_id),
      image_url: finalImageUrl || null,
    };

    onSubmit(submitData);
  };

  const isLoading = regionsLoading || categoriesLoading || isSubmitting || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="form-group">
        <label htmlFor="title" className="label">
          Title <span className="text-error">*</span>
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
        />
        {errors.title && (
          <p className="error-message">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.title}
          </p>
        )}
        <p className="text-xs text-text-muted mt-1">{formData.title.length}/100 characters</p>
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
        <p className="text-xs text-text-muted mt-1">A good description helps buyers understand what you're offering</p>
      </div>

      {/* Price */}
      <div className="form-group">
        <label htmlFor="price" className="label">
          Price (GMD) <span className="text-error">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-14 bg-gray-50 border-r border-border rounded-l-xl">
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
          />
        </div>
        {errors.price && (
          <p className="error-message">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.price}
          </p>
        )}
      </div>

      {/* Category & Region - side by side on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category */}
        <div className="form-group">
          <label htmlFor="category_id" className="label">
            Category <span className="text-error">*</span>
          </label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className={`input ${errors.category_id ? 'input-error' : ''}`}
            disabled={categoriesLoading}
          >
            <option value="">Select category</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="error-message">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.category_id}
            </p>
          )}
        </div>

        {/* Region */}
        <div className="form-group">
          <label htmlFor="region_id" className="label">
            Region <span className="text-error">*</span>
          </label>
          <select
            id="region_id"
            name="region_id"
            value={formData.region_id}
            onChange={handleChange}
            className={`input ${errors.region_id ? 'input-error' : ''}`}
            disabled={regionsLoading}
          >
            <option value="">Select region</option>
            {regions?.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          {errors.region_id && (
            <p className="error-message">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.region_id}
            </p>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="form-group">
        <label htmlFor="contact" className="label">
          Phone Number <span className="text-error">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
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
          />
        </div>
        {errors.contact && (
          <p className="error-message">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.contact}
          </p>
        )}
        <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Gambian numbers only. Only visible to logged-in users.
        </p>
      </div>

      {/* Image Upload */}
      <div className="form-group">
        <label className="label">
          Product Image
          <span className="text-text-muted font-normal ml-1">(optional)</span>
        </label>
        
        {imagePreview ? (
          <div className="relative inline-block animate-scale-in">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-w-sm h-auto rounded-xl object-cover shadow-lg"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {imageFile && (
              <div className="mt-2 text-sm text-text-secondary flex items-center gap-2">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {imageFile.name}
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-primary bg-primary-50 scale-[1.02]' 
                : 'border-border hover:border-primary hover:bg-gray-50'
            }`}
          >
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${
              dragActive ? 'bg-primary text-white' : 'bg-gray-100 text-text-muted'
            }`}>
              <svg
                className="w-8 h-8"
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
            <p className="text-base font-medium text-text mb-1">
              {dragActive ? 'Drop your image here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-text-muted">JPEG, PNG, or WebP (max 5MB)</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageSelect}
          className="hidden"
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
        <div className="bg-primary-50 rounded-xl p-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="spinner" />
            <span className="text-sm font-medium text-primary">Uploading image...</span>
          </div>
          <div className="w-full bg-white rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-teal-500 transition-all duration-300"
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
          onClick={() => navigate(-1)}
          className="btn-secondary py-3.5"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
