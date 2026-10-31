// src/features/auth/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { FormField } from '../../components/ui';
import { Card } from '../../components/ui';
import { loginSchema } from '../../lib/validators';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, profile } = useAuth();  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      loginSchema.parse({ email, password });
      const { data, error: err } = await signIn({ email, password });
      if (err) throw err;
      navigate((profile?.role === 'customer') ? '/portal' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '8vh auto', padding: 16 }}>
      <Card style={{ padding: 32 }}>
        <h2 style={{ marginBottom: 8, fontSize: 24 }}>Welcome back</h2>
        <p style={{ color: '#8A97A8', fontSize: 14, marginBottom: 24 }}>Sign in to your Brightloop account</p>
        {error && <div style={{ color: '#F26D6D', fontSize: 13, marginBottom: 16, padding: 8, background: 'rgba(242,109,109,0.1)', borderRadius: 6 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <FormField label="Email">
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </FormField>
          <FormField label="Password">
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </FormField>
          <Button type="submit" variant="primary" disabled={submitting} className="w-full" style={{ width: '100%', marginTop: 16 }}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p style={{ marginTop: 20, fontSize: 13, color: '#8A97A8', textAlign: 'center' }}>
          Don't have an account? <a href="/signup" style={{ color: '#2DD4A8', fontWeight: 600 }}>Sign up</a>
        </p>
        <p style={{ marginTop: 8, fontSize: 13, color: '#8A97A8', textAlign: 'center' }}>
          <a href="/forgot-password" style={{ color: '#2DD4A8', fontWeight: 600 }}>Forgot password?</a>
        </p>
      </Card>
    </div>
  );
}
