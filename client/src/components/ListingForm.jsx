import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegions, useCategories } from '../hooks/useLookups';
import { useAuth } from '../context/AuthContext';
import { uploadImage, validateImage, ImageUploadError } from '../lib/imageUpload';

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
    contact: initialData?.contact || '',
    image_url: initialData?.image_url || '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData?.image_url || null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
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

    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact information is required';
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
        finalImageUrl = await uploadImage(imageFile, user.id);
      } catch (error) {
        setErrors((prev) => ({ ...prev, image: error.message }));
        setUploading(false);
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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Title */}
      <div>
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
        {errors.title && <p className="error-message">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input min-h-[100px]"
          placeholder="Describe your item or service..."
          rows={4}
        />
      </div>

      {/* Price */}
      <div>
        <label htmlFor="price" className="label">
          Price (GMD) <span className="text-error">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            GMD
          </span>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className={`input pl-14 ${errors.price ? 'input-error' : ''}`}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
        {errors.price && <p className="error-message">{errors.price}</p>}
      </div>

      {/* Category & Region - side by side on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category */}
        <div>
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
          {errors.category_id && <p className="error-message">{errors.category_id}</p>}
        </div>

        {/* Region */}
        <div>
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
          {errors.region_id && <p className="error-message">{errors.region_id}</p>}
        </div>
      </div>

      {/* Contact */}
      <div>
        <label htmlFor="contact" className="label">
          Contact Information <span className="text-error">*</span>
        </label>
        <input
          type="text"
          id="contact"
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          className={`input ${errors.contact ? 'input-error' : ''}`}
          placeholder="Phone number or email"
        />
        {errors.contact && <p className="error-message">{errors.contact}</p>}
        <p className="text-xs text-text-secondary mt-1">
          This will only be visible to logged-in users
        </p>
      </div>

      {/* Image Upload */}
      <div>
        <label className="label">Image</label>
        
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-w-xs h-auto rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <svg
              className="w-8 h-8 mx-auto text-gray-400 mb-2"
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
            <p className="text-sm text-gray-500">Click to upload image</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP (max 5MB)</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        {errors.image && <p className="error-message">{errors.image}</p>}
      </div>

      {/* Submit buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1 py-3"
        >
          {uploading ? 'Uploading image...' : isSubmitting ? 'Saving...' : initialData ? 'Update Listing' : 'Post Listing'}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
