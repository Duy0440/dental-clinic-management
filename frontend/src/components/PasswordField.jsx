import { useState } from "react";

// password field (input mat khau co nut an hien)
function PasswordField({
  name,
  value,
  onChange,
  required = false,
  minLength,
  placeholder,
  className = "form-control",
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="password-field">
      <input
        required={required}
        minLength={minLength}
        type={showPassword ? "text" : "password"}
        name={name}
        className={`${className} password-field-input`.trim()}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />

      <button
        type="button"
        className="password-toggle-button"
        onClick={() => setShowPassword((current) => !current)}
        aria-label={showPassword ? "An mat khau" : "Hien mat khau"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5C7 5 3.3 8 2 12c1.3 4 5 7 10 7s8.7-3 10-7c-1.3-4-5-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2.2a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z" />
        </svg>
        <span>{showPassword ? "An" : "Hien"}</span>
      </button>
    </div>
  );
}

export default PasswordField;
