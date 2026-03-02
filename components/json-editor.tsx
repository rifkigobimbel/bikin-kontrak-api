'use client';

import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function highlightJSON(json: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let i = 0;

  while (i < json.length) {
    // String
    if (json[i] === '"') {
      let j = i + 1;
      while (j < json.length && json[j] !== '"') {
        if (json[j] === '\\') j++;
        j++;
      }
      const str = json.slice(i, j + 1);
      // Check if it's a key (followed by :)
      let k = j + 1;
      while (k < json.length && /\s/.test(json[k])) k++;
      const isKey = json[k] === ':';
      tokens.push(
        <span key={`${i}-str`} className={isKey ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}>
          {str}
        </span>
      );
      i = j + 1;
    }
    // Number
    else if (/\d/.test(json[i]) || (json[i] === '-' && /\d/.test(json[i + 1]))) {
      let j = i;
      if (json[j] === '-') j++;
      while (j < json.length && /[\d.eE+-]/.test(json[j])) j++;
      tokens.push(
        <span key={`${i}-num`} className="text-orange-600 dark:text-orange-400">
          {json.slice(i, j)}
        </span>
      );
      i = j;
    }
    // Boolean and null
    else if (json.slice(i, i + 4) === 'true' || json.slice(i, i + 5) === 'false') {
      const length = json.slice(i, i + 4) === 'true' ? 4 : 5;
      tokens.push(
        <span key={`${i}-bool`} className="text-purple-600 dark:text-purple-400">
          {json.slice(i, i + length)}
        </span>
      );
      i += length;
    }
    else if (json.slice(i, i + 4) === 'null') {
      tokens.push(
        <span key={`${i}-null`} className="text-purple-600 dark:text-purple-400">
          null
        </span>
      );
      i += 4;
    }
    // Punctuation and whitespace
    else {
      const char = json[i];
      if (/[\{\}\[\]:,]/.test(char)) {
        tokens.push(
          <span key={`${i}-punct`} className="text-gray-700 dark:text-gray-300">
            {char}
          </span>
        );
      } else if (/\s/.test(char)) {
        tokens.push(
          <span key={`${i}-space`}>{char}</span>
        );
      } else {
        tokens.push(char);
      }
      i++;
    }
  }

  return tokens;
}

interface JSONEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  minHeight?: string;
}

export function JSONEditor({
  value = '',
  onChange,
  onValidationChange,
  placeholder = 'Enter JSON...',
  className,
  disabled = false,
  error: externalError,
  minHeight = 'min-h-64',
}: JSONEditorProps) {
  const [localError, setLocalError] = useState<string | undefined>();

  const validateJSON = useCallback(
    (text: string) => {
      if (!text.trim()) {
        setLocalError(undefined);
        onValidationChange?.(false);
        return;
      }

      try {
        JSON.parse(text);
        setLocalError(undefined);
        onValidationChange?.(true);
      } catch (err) {
        const errorMessage =
          err instanceof SyntaxError
            ? `Syntax Error: ${err.message}`
            : 'Invalid JSON';
        setLocalError(errorMessage);
        onValidationChange?.(false, errorMessage);
      }
    },
    [onValidationChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    validateJSON(newValue);
  };

  const displayError = externalError || localError;
  const isValid = value.trim() && !displayError;

  return (
    <div className="space-y-2">
      <div className="relative">
        <div
          className={cn(
            'relative rounded-md border bg-white dark:bg-slate-950 overflow-hidden',
            displayError &&
              'border-red-500 ring-1 ring-red-500/20',
            isValid &&
              'border-green-500 ring-1 ring-green-500/20',
            !displayError && !isValid &&
              'border-input',
            className
          )}
        >
          {/* Highlighted display layer */}
          <pre
            className={cn(
              'absolute inset-0 font-mono text-sm p-3 pr-10 pointer-events-none whitespace-pre-wrap break-words overflow-hidden',
              minHeight
            )}
          >
            <code>{highlightJSON(value)}</code>
          </pre>

          {/* Input textarea overlay */}
          <Textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            spellCheck={false}
            autoComplete="off"
            className={cn(
              'relative font-mono text-sm resize-none pr-10 bg-transparent text-transparent caret-foreground',
              minHeight,
              'border-0 focus-visible:ring-0 focus-visible:border-0'
            )}
          />
        </div>

        {displayError && (
          <AlertCircle className="absolute top-3 right-3 h-5 w-5 text-red-500 pointer-events-none" />
        )}
        {isValid && (
          <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-green-500 pointer-events-none" />
        )}
      </div>

      {displayError && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
