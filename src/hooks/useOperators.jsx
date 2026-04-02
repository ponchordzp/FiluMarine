import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useOperators() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['charter-operators'],
    queryFn: async () => {
      let ops = await base44.entities.CharterOperator.list();
      if (ops.length === 0) {
        // Try migration from localStorage if empty
        const raw = localStorage.getItem('filu_operators');
        const protectedRaw = localStorage.getItem('filu_operators_protected');
        let migrated = false;
        
        if (raw) {
          try {
            const localOps = JSON.parse(raw);
            const protectedData = protectedRaw ? JSON.parse(protectedRaw) : {};
            
            if (Array.isArray(localOps) && localOps.length > 0) {
              await Promise.all(localOps.map(op => {
                if (!op || !op.name) return null;
                const saved = protectedData[op.name.toUpperCase()] || {};
                const merged = { ...op, ...saved };
                return base44.entities.CharterOperator.create({
                  name: merged.name || merged.id,
                  description: merged.description || '',
                  contact_name: merged.contact_name || '',
                  contact_email: merged.contact_email || '',
                  contact_phone: merged.contact_phone || '',
                  paypal_username: merged.paypal_username || '',
                  commission_pct: Number(merged.commission_pct) || 0,
                  color: merged.color || '#1e88e5',
                  bank_name: merged.bank_name || '',
                  bank_account_clabe: merged.bank_account_clabe || '',
                  bank_account_number: merged.bank_account_number || '',
                  bank_account_holder: merged.bank_account_holder || '',
                  bank_notes: merged.bank_notes || '',
                  locations: merged.locations || [],
                  is_active: merged.is_active !== false
                });
              }));
              ops = await base44.entities.CharterOperator.list();
              migrated = true;
            }
          } catch(e) {
            console.error("Migration failed:", e);
          }
        }
        
        // If still empty after migration attempt, create defaults
        if (ops.length === 0 && !migrated) {
           await base44.entities.CharterOperator.create({
             name: 'FILU', paypal_username: 'filumarine', commission_pct: 0, color: '#1e88e5', locations: ['ixtapa_zihuatanejo', 'acapulco', 'cancun']
           });
           await base44.entities.CharterOperator.create({
             name: 'HILARIO', paypal_username: '', commission_pct: 0, color: '#10b981', locations: ['ixtapa_zihuatanejo', 'acapulco', 'cancun']
           });
           await base44.entities.CharterOperator.create({
             name: 'Seas The Day', paypal_username: 'seastheday', commission_pct: 15, color: '#f59e0b', locations: ['ixtapa_zihuatanejo', 'acapulco', 'cancun']
           });
           ops = await base44.entities.CharterOperator.list();
        }
      }
      
      // Sync back to localStorage so frozen files can still read from it
      if (ops.length > 0) {
        localStorage.setItem('filu_operators', JSON.stringify(ops));
      }
      
      return ops;
    }
  });

  const createOp = useMutation({
    mutationFn: (data) => base44.entities.CharterOperator.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['charter-operators'] })
  });

  const updateOp = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CharterOperator.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['charter-operators'] })
  });

  const deleteOp = useMutation({
    mutationFn: (id) => base44.entities.CharterOperator.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['charter-operators'] })
  });

  return { ...query, operators: query.data || [], createOp, updateOp, deleteOp };
}