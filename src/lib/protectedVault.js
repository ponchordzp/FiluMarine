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
    id: 'op_seastheday_protected',
    name: 'SeasTheDay',
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

    PROTECTED_OPERATORS_VAULT.forEach(protectedOp => {
      const existingIdx = localOps.findIndex(o => o.name && o.name.toLowerCase() === protectedOp.name.toLowerCase());
      
      if (existingIdx === -1) {
        localOps.push({ ...protectedOp });
        opsChanged = true;
      } else {
        const existing = localOps[existingIdx];
        
        // 1. NEVER delete or truncate the fee field
        if (existing.commission_pct === undefined || existing.commission_pct === null || existing.commission_pct === '' || isNaN(parseFloat(existing.commission_pct))) {
          existing.commission_pct = protectedOp.commission_pct;
          opsChanged = true;
        }
        
        // 2. Protect assigned locations from being deleted
        if (!existing.locations || !Array.isArray(existing.locations) || existing.locations.length === 0) {
          existing.locations = [...protectedOp.locations];
          opsChanged = true;
        }
      }
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
          const { localOps } = enforceOperatorVault(value);
          value = JSON.stringify(localOps);
        } catch (e) {
          console.error("Vault interceptor failed:", e);
        }
      }
      originalSetItem.apply(this, arguments);
    };
    window._filuVaultInterceptorInstalled = true;
  }
};