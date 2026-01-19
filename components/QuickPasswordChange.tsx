import React, { useState } from 'react';
import { agentAPI } from '../src/services/apiService';

interface QuickPasswordChangeProps {
  userEmail: string;
  agentId?: number;
  title?: string;
  isAdminReset?: boolean;
  onClose?: () => void;
}

const QuickPasswordChange: React.FC<QuickPasswordChangeProps> = ({
  userEmail,
  agentId,
  title = 'Update Password',
  isAdminReset = false,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 3) {
      setError('Password must be at least 3 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      if (isAdminReset && agentId) {
        await agentAPI.resetPassword(agentId, newPassword);
        setSuccess(true);
        setTimeout(() => {
          onClose?.();
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-1">User: {userEmail}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm text-emerald-700 font-medium">Password updated successfully!</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new password"
            disabled={loading || success}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm new password"
            disabled={loading || success}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handlePasswordReset}
          disabled={loading || success}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
};

export default QuickPasswordChange;
