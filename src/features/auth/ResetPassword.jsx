// src/features/auth/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { FormField } from '../../components/ui';
import { Card } from '../../components/ui';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = searchParams.get('access_token') || searchParams.get('code');
    if (token) {
      // Supabase handles the callback; we just need a valid session
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { error: err } = await updatePassword(password);
      if (err) throw err;
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '8vh auto', padding: 16 }}>
      <Card style={{ padding: 32 }}>
        <h2 style={{ marginBottom: 8, fontSize: 24 }}>Reset password</h2>
        <p style={{ color: '#8A97A8', fontSize: 14, marginBottom: 24 }}>Choose a new password</p>
        {error && <div style={{ color: '#F26D6D', fontSize: 13, marginBottom: 16, padding: 8, background: 'rgba(242,109,109,0.1)', borderRadius: 6 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <FormField label="New password">
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </FormField>
          <Button type="submit" variant="primary" disabled={submitting} className="w-full" style={{ width: '100%', marginTop: 16 }}>
            {submitting ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>
        <p style={{ marginTop: 20, fontSize: 13, color: '#8A97A8', textAlign: 'center' }}>
          <a href="/login" style={{ color: '#2DD4A8', fontWeight: 600 }}>Back to sign in</a>
        </p>
      </Card>
    </div>
  );
}
