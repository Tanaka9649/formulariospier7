"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const fieldClasses =
  "w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:opacity-50 disabled:bg-slate-50";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={fieldId} className="text-xs font-medium text-slate-600">
            {label}
          </label>
        )}
        <input ref={ref} id={fieldId} className={`${fieldClasses} ${className}`} {...props} />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className = "", rows = 3, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={fieldId} className="text-xs font-medium text-slate-600">
            {label}
          </label>
        )}
        <textarea ref={ref} id={fieldId} rows={rows} className={`${fieldClasses} resize-y ${className}`} {...props} />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
