export const PROTECTED_OPERATORS_VAULT = [
  {
    id: 'op_filu_protected',
    name: 'FILU',
    commission_pct: 20, // Strict fallback fee
    paypal_username: 'filumarine',
    locations: ['ixtapa_zihuatanejo', 'acapulco', 'cancun'],
    is_active: true
  },
  {
    id: 'op_hilario_protected',
    name: 'HILARIO',
    commission_pct: 0, // Original default fee for Hilario
    paypal_username: '',
    locations: ['ixtapa_zihuatanejo', 'acapulco', 'cancun'],
    is_active: true
  },
  {
    id: 'op_seastheday_protected',
    name: 'Seas The Day',
    commission_pct: 15, // Strict fallback fee
    paypal_username: 'seastheday',
    locations: ['ixtapa_zihuatanejo', 'acapulco', 'cancun'],
    is_active: true
  }
];

export const injectProtectedVaults = () => {
  if (typeof window === 'undefined') return;
  
  const enforceOperatorVault = (rawOpsStr) => {
    let localOps = [];
    try {
      localOps = rawOpsStr ? JSON.parse(rawOpsStr) : [];
      if (!Array.isArray(localOps)) localOps = [];
    } catch {
      localOps = [];
    }
    
    let opsChanged = false;

    // Force remove the incorrect 'SeasTheDay' (no spaces)
    const wrongIdx = localOps.findIndex(o => o.name === 'SeasTheDay');
    if (wrongIdx !== -1) {
      localOps.splice(wrongIdx, 1);
      opsChanged = true;
    }

    PROTECTED_OPERATORS_VAULT.forEach(protectedOp => {
      const existingIdx = localOps.findIndex(o => o.name && o.name.toLowerCase() === protectedOp.name.toLowerCase());
      
      if (existingIdx === -1) {
        localOps.push({ ...protectedOp });
        opsChanged = true;
      }
      // We explicitly DO NOT touch existing operators here so that we NEVER 
      // overwrite or truncate any fields configured in the Operators Dashboard.
    });

    return { localOps, opsChanged };
  };

  // 1. Initial Injection
  try {
    const rawOps = localStorage.getItem('filu_operators');
    const { localOps, opsChanged } = enforceOperatorVault(rawOps);
    
    if (opsChanged || !rawOps) {
      localStorage.setItem('filu_operators', JSON.stringify(localOps));
    }
  } catch (e) {
    console.error("Vault injection failed:", e);
  }

  // 2. Bulletproof Interceptor - ALWAYS intercept setItem to protect data globally
  if (!window._filuVaultInterceptorInstalled) {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      // Intercept any attempt to save filu_operators and enforce protection BEFORE saving
      if (key === 'filu_operators') {
        try {
          const { localOps, opsChanged } = enforceOperatorVault(value);
          if (opsChanged) {
            value = JSON.stringify(localOps);
          }
        } catch (e) {
          console.error("Vault interceptor failed:", e);
        }
      }
      originalSetItem.apply(this, [key, value]);
    };
    window._filuVaultInterceptorInstalled = true;
  }

  // 3. Bulletproof GET Interceptor - ALWAYS return fully merged, accurate data
  if (!window._filuVaultGetInterceptorInstalled) {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = function(key) {
      const rawValue = originalGetItem.apply(this, arguments);
      if (key === 'filu_operators' && rawValue) {
        try {
          const ops = JSON.parse(rawValue);
          if (!Array.isArray(ops)) return rawValue;

          const protectedRaw = originalGetItem.call(this, 'filu_operators_protected');
          const protectedData = protectedRaw ? JSON.parse(protectedRaw) : {};

          const mergedOps = ops.map(op => {
             if (!op || !op.name) return op;
             const saved = protectedData[op.name.toUpperCase()];
             if (!saved) return op;
             return { ...op, ...saved };
          });

          // Restore any operators that exist in the protected vault but are missing from the current ops array
          Object.keys(protectedData).forEach(opNameUpper => {
             const saved = protectedData[opNameUpper];
             if (!mergedOps.some(op => (op.name || '').toUpperCase() === opNameUpper)) {
               mergedOps.push({
                 id: saved.id || `op_${opNameUpper.toLowerCase()}_restored`,
                 name: saved.name || opNameUpper,
                 ...saved
               });
             }
          });

          // Ensure strict hard-coded PROTECTED_OPERATORS_VAULT are always present
          PROTECTED_OPERATORS_VAULT.forEach(protectedOp => {
             const existingIdx = mergedOps.findIndex(op => (op.name || '').toUpperCase() === protectedOp.name.toUpperCase());
             if (existingIdx === -1) {
               mergedOps.push({...protectedOp, ...(protectedData[protectedOp.name.toUpperCase()] || {})});
             }
          });

          return JSON.stringify(mergedOps);
        } catch (e) {
          console.error("Vault get interceptor failed:", e);
        }
      }
      return rawValue;
    };
    window._filuVaultGetInterceptorInstalled = true;
  }
};