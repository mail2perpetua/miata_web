import { useId, useState } from 'react';
import { CloudUpload } from 'lucide-react';
import { formatBytes } from '@/utils/format';

/**
 * Click-or-drop file picker. Validates extension and size in the browser for quick feedback;
 * the server re-validates type, content and size.
 */
export function FileDrop({ accept, maxBytes, file, onChange, error, hint, label = 'Choose a file or drag it here' }) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState(null);

  const pick = (selected) => {
    if (!selected) return;
    const extensions = accept?.split(',').map((a) => a.trim().toLowerCase()) ?? [];
    const ext = `.${selected.name.split('.').pop().toLowerCase()}`;
    if (extensions.length && !extensions.includes(ext)) {
      setLocalError(`Allowed types: ${extensions.join(', ')}`);
      return;
    }
    if (maxBytes && selected.size > maxBytes) {
      setLocalError(`File must be ${formatBytes(maxBytes)} or smaller`);
      return;
    }
    setLocalError(null);
    onChange(selected);
  };

  const shownError = localError || error;
  return (
    <div className="field">
      <label
        htmlFor={inputId}
        className={`file-drop ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0]);
        }}
      >
        <CloudUpload aria-hidden="true" />
        {file ? (
          <>
            <span className="file-drop__name">{file.name}</span>
            <span className="muted">{formatBytes(file.size)} · click to change</span>
          </>
        ) : (
          <>
            <span className="file-drop__name">{label}</span>
            {hint && <span className="muted">{hint}</span>}
          </>
        )}
      </label>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = ''; // allow choosing the same file again
        }}
        aria-invalid={shownError ? 'true' : undefined}
      />
      {shownError && (
        <span className="field__error" role="alert">
          {shownError}
        </span>
      )}
    </div>
  );
}
