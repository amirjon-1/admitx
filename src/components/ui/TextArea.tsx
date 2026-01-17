import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxCount?: number;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, hint, showCount, maxCount, value, ...props }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          value={value}
          className={cn(
            'w-full px-4 py-3 border rounded-lg transition-colors resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'placeholder:text-gray-400',
            error
              ? 'border-red-300 bg-red-50 focus:ring-red-500'
              : 'border-gray-300 bg-white',
            className
          )}
          {...props}
        />
        <div className="flex justify-between mt-1">
          {hint && !error && (
            <p className="text-sm text-gray-500">{hint}</p>
          )}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {showCount && maxCount && (
            <p
              className={cn(
                'text-sm ml-auto',
                currentLength > maxCount ? 'text-red-600' : 'text-gray-500'
              )}
            >
              {currentLength}/{maxCount}
            </p>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
