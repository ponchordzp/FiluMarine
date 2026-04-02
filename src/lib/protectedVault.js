export const PROTECTED_OPERATORS_VAULT = [];

// This file is now deprecated. Operator data is managed via the CharterOperator entity in the database.
// The inject function is kept as a no-op so that App.jsx doesn't crash if it imports it.
export const injectProtectedVaults = () => {
  // Deprecated: No longer intercepting localStorage. Operators are synced to localStorage directly by useOperators hook for legacy read-only compatibility.
};