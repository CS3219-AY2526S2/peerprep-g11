/**
 * Shared password validation rules and UI component.
 * Used by signup and profile pages to keep requirements consistent.
 */

export const PASSWORD_MIN_LENGTH = 8;

/** Returns true if the password satisfies the length requirement. */
export const passwordLengthValid = (password: string): boolean =>
  password.length >= PASSWORD_MIN_LENGTH;

/** Returns true if the password contains at least one uppercase letter. */
export const passwordUppercaseValid = (password: string): boolean =>
  /[A-Z]/.test(password);

/** Returns true if the password passes all requirements. */
export const isPasswordValid = (password: string): boolean =>
  passwordLengthValid(password) && passwordUppercaseValid(password);

// ---------------------------------------------------------------------------
// UI component
// ---------------------------------------------------------------------------

interface CriterionRowProps {
  met: boolean;
  label: string;
}

function CriterionRow({ met, label }: CriterionRowProps) {
  return (
    <span
      className={`flex items-center gap-1.5 text-[11px] ${
        met ? 'text-emerald-600' : 'text-muted-foreground'
      }`}
    >
      <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 shrink-0">
        {met ? (
          <path
            d="M3 8l3.5 3.5L13 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        )}
      </svg>
      {label}
    </span>
  );
}

interface PasswordCriteriaProps {
  password: string;
}

/**
 * Renders the live password strength checklist beneath a password input.
 * Only renders when `password` is non-empty.
 */
export function PasswordCriteria({ password }: PasswordCriteriaProps) {
  if (password.length === 0) return null;

  return (
    <div className="grid gap-1 mt-0.5 pl-0.5">
      <CriterionRow
        met={passwordLengthValid(password)}
        label={`Minimum ${PASSWORD_MIN_LENGTH} characters`}
      />
      <CriterionRow
        met={passwordUppercaseValid(password)}
        label="At least one uppercase letter"
      />
    </div>
  );
}
