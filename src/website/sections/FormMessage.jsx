/** One status line under a website form (success in green, problems in red). */
export function FormMessage({ error = false, children }) {
  return (
    <p className={`form-message${error ? ' form-message--error' : ''}`} role={error ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
