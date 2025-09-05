import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Heart, Shield } from 'lucide-react';

const Auth = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(loginEmail, loginPassword);
    
    if (!error) {
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-medical p-3 rounded-2xl shadow-medical">
              <Stethoscope className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">PulsMedic</h1>
          <p className="text-muted-foreground mt-2">Sistem za upravljanje ordinacijom</p>
        </div>

        <Card className="shadow-elevated border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <Heart className="h-5 w-5 text-primary" />
              <Shield className="h-5 w-5 text-success" />
            </div>
            <CardTitle className="text-xl text-center">Prijavite se</CardTitle>
            <CardDescription className="text-center">
              Unesite vaše podatke za pristup sistemu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vase.ime@pulsmedic.rs"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="transition-all duration-200 focus:shadow-medical"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Šifra</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="transition-all duration-200 focus:shadow-medical"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-medical hover:shadow-medical transition-all duration-200"
              >
                {loading ? 'Prijavljivanje...' : 'Prijavite se'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>© 2025 PulsMedic. Sva prava zadržana.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;