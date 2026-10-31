// src/features/auth/ForgotPassword.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { FormField } from '../../components/ui';
import { Card } from '../../components/ui';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { error: err } = await resetPassword(email);
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset link');
    }
  };

  if (sent) {
    return (
      <div style={{ maxWidth: 400, margin: '8vh auto', padding: 16 }}>
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8, fontSize: 24 }}>Check your email</h2>
          <p style={{ color: '#8A97A8', fontSize: 14, marginBottom: 24 }}>A password reset link has been sent to {email}</p>
          <Button variant="primary" onClick={() => navigate('/login')} className="w-full" style={{ width: '100%' }}>Back to sign in</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '8vh auto', padding: 16 }}>
      <Card style={{ padding: 32 }}>
        <h2 style={{ marginBottom: 8, fontSize: 24 }}>Forgot password</h2>
        <p style={{ color: '#8A97A8', fontSize: 14, marginBottom: 24 }}>Enter your email to reset your password</p>
        {error && <div style={{ color: '#F26D6D', fontSize: 13, marginBottom: 16, padding: 8, background: 'rgba(242,109,109,0.1)', borderRadius: 6 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <FormField label="Email">
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </FormField>
          <Button type="submit" variant="primary" disabled={submitting} className="w-full" style={{ width: '100%', marginTop: 16 }}>
            {submitting ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
        <p style={{ marginTop: 20, fontSize: 13, color: '#8A97A8', textAlign: 'center' }}>
          <a href="/login" style={{ color: '#2DD4A8', fontWeight: 600 }}>Back to sign in</a>
        </p>
      </Card>
    </div>
  );
}
