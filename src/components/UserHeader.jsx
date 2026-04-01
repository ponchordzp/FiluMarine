import React from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function UserHeader() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-white/10 bg-white/5">
      {user.operator && (
        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
          {user.operator}
        </span>
      )}
      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
        {user.role}
      </span>
    </div>
  );
}