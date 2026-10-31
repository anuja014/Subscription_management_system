// src/features/auth/Signup.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { FormField } from '../../components/ui';
import { Card } from '../../components/ui';
import { Badge } from '../../components/ui';
import { signupSchema, passwordStrengthChecks } from '../../lib/validators';

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrengthChecks(password);
  const allValid = Object.values(strength).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      signupSchema.parse({ email, password, full_name: fullName });
      const { data, error: err } = await signUp({ email, password, full_name: fullName });
      if (err) throw err;
      navigate('/verify-email');
    } catch (err) {
      setError(err.message || 'Signup failed');
    }
  };

  return (
    <main className="auth-shell">
      <Card className="auth-card">
        <div className="auth-mark">AU</div>
        <h2 style={{ marginBottom: 8, fontSize: 24 }}>Create account</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Join Aureon Billing</p>
        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16, padding: 8, background: 'var(--danger-soft)', borderRadius: 6 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <FormField label="Full name">
            <Input id="full_name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </FormField>
          <FormField label="Email">
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </FormField>
          <FormField label="Password">
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <div style={{ marginTop: 10 }}>
              <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>Password rules:</strong>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <Badge variant={strength.length ? 'success' : 'info'} style={{ padding: '2px 8px', fontSize: 11 }}>More than 8 chars</Badge>
                <Badge variant={strength.uppercase ? 'success' : 'info'} style={{ padding: '2px 8px', fontSize: 11 }}>Uppercase</Badge>
                <Badge variant={strength.lowercase ? 'success' : 'info'} style={{ padding: '2px 8px', fontSize: 11 }}>Lowercase</Badge>
                <Badge variant={strength.special ? 'success' : 'info'} style={{ padding: '2px 8px', fontSize: 11 }}>Special char</Badge>
              </div>
            </div>
          </FormField>
          <Button type="submit" variant="primary" disabled={submitting || !allValid} className="w-full" style={{ width: '100%', marginTop: 16 }}>
            {submitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          Already have an account? <a href="/login" style={{ color: 'var(--link)', fontWeight: 600 }}>Sign in</a>
        </p>
      </Card>
    </main>
  );
}
