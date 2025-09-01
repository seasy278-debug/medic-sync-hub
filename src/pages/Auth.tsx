import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Heart, Shield } from 'lucide-react';

const Auth = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    
    if (!error) {
      // Show success message or redirect
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
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Prijava</TabsTrigger>
                <TabsTrigger value="signup">Registracija</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-4">
                    <CardTitle className="text-xl">Prijavite se</CardTitle>
                    <CardDescription>
                      Unesite vaše podatke za pristup sistemu
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
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
              </TabsContent>
              
              <TabsContent value="signup">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-4">
                    <CardTitle className="text-xl">Napravite nalog</CardTitle>
                    <CardDescription>
                      Registrujte se za pristup PulsMedic sistemu
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Puno ime</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Petar Petrović"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          required
                          className="transition-all duration-200 focus:shadow-medical"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="vase.ime@pulsmedic.rs"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          className="transition-all duration-200 focus:shadow-medical"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Šifra</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          className="transition-all duration-200 focus:shadow-medical"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-medical hover:shadow-medical transition-all duration-200"
                      >
                        {loading ? 'Registracija...' : 'Registrujte se'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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