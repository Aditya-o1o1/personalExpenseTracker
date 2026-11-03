import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  maxLength,
  required = false,
  placeholder,
  rightContent,
  hint,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="label !mb-0" htmlFor={id}>{label}</label>
        {rightContent}
      </div>
      <div className="relative">
        <input
          id={id}
          className="field !pr-12"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted transition hover:text-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet"
          onClick={() => setVisible((current) => !current)}
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
