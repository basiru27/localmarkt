/**
 * Accessible Form Field Component
 * 
 * Features:
 * - Automatic label association via htmlFor/id
 * - Required indicator with aria-required
 * - Error message with aria-describedby linkage
 * - aria-invalid when error is present
 * - Helper text support
 * - Consistent styling with design system
 * 
 * @param {Object} props
 * @param {string} props.id - Unique ID for input (required for accessibility)
 * @param {string} props.label - Label text
 * @param {string} [props.error] - Error message to display
 * @param {string} [props.helperText] - Helper text below input
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {React.ReactNode} props.children - Input element(s)
 * @param {string} [props.className] - Additional classes for wrapper
 */
export default function FormField({
  id,
  label,
  error,
  helperText,
  required = false,
  children,
  className = '',
}) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && (
            <span className="text-error ml-1" aria-hidden="true">*</span>
          )}
        </label>
      )}
      
      {/* Clone children to inject accessibility props */}
      {typeof children === 'function' 
        ? children({ 
            // ARIA attributes for accessibility
            id,
            'aria-invalid': error ? 'true' : undefined,
            'aria-describedby': describedBy,
            'aria-required': required ? 'true' : undefined,
            // Error class - apply AFTER base classes to ensure it takes effect
            // Usage: className={`input ${fieldProps.errorClass}`}
            errorClass: error ? 'input-error' : '',
          })
        : children
      }

      {/* Error message */}
      {error && (
        <p 
          id={errorId} 
          className="error-message" 
          role="alert"
          aria-live="polite"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}

      {/* Helper text (only show when no error) */}
      {helperText && !error && (
        <p 
          id={helperId} 
          className="text-sm text-text-muted mt-1"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

/**
 * Input wrapper that automatically applies FormField accessibility props
 * Use with render prop pattern from FormField
 * 
 * The fieldProps object contains:
 * - id: string - The field ID for label association
 * - aria-invalid: 'true' | undefined - Set when error is present
 * - aria-describedby: string | undefined - Links to error/helper text
 * - aria-required: 'true' | undefined - Set when field is required
 * - errorClass: string - CSS class for error state ('input-error' or '')
 * 
 * @example
 * <FormField id="email" label="Email" error={errors.email} required>
 *   {(fieldProps) => (
 *     <input 
 *       type="email" 
 *       className={`input pl-12 ${fieldProps.errorClass}`}
 *       {...fieldProps}
 *     />
 *   )}
 * </FormField>
 */
