import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Calendar, Users, Package, Shield, Heart, Activity } from 'lucide-react';
import medicalHero from '@/assets/medical-hero.jpg';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-medical p-2 rounded-xl shadow-medical">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">PulsMedic</h1>
              <p className="text-sm text-muted-foreground">pulsmedic.rs</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-foreground">
                  Dobrodošli, {profile?.full_name?.split(' ')[0] || 'Korisnik'}
                </span>
                <Button onClick={() => navigate('/dashboard')} className="bg-gradient-medical hover:shadow-medical">
                  Kontrolna tabla
                </Button>
              </div>
            ) : (
              <Button onClick={() => navigate('/auth')} className="bg-gradient-medical hover:shadow-medical">
                Prijavite se
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-card opacity-50"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-primary">
                  <Heart className="h-5 w-5" />
                  <span className="text-sm font-medium">Profesionalno upravljanje ordinacijom</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  PulsMedic<br />
                  <span className="bg-gradient-medical bg-clip-text text-transparent">
                    Sistem
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-md">
                  Kompletno rešenje za upravljanje ordinacijom opšte medicine. 
                  Jednostavno zakazivanje pregleda, upravljanje pacijentima i medicinskim zalihama.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button 
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-gradient-medical hover:shadow-medical transition-all duration-300 text-lg px-8 py-6"
                >
                  <Activity className="h-5 w-5 mr-2" />
                  {user ? 'Idite na kontrolnu tablu' : 'Počnite odmah'}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary/20 hover:bg-primary/5 text-lg px-8 py-6 transition-all duration-300"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Saznajte više
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-elevated">
                <img 
                  src={medicalHero} 
                  alt="PulsMedic sistem za upravljanje ordinacijom" 
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-medical opacity-20 rounded-2xl blur-xl scale-105"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Sve što vašoj ordinaciji treba
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Moderan sistem koji omogućava efikasno upravljanje svim aspektima vaše medicinske prakse
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors duration-300">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Zakazivanje pregleda</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Jednostavno upravljanje terminima, automatska obaveštenja i pregled rasporedâ lekara.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-success/10 p-3 rounded-xl group-hover:bg-success/20 transition-colors duration-300">
                    <Users className="h-6 w-6 text-success" />
                  </div>
                  <CardTitle className="text-xl">Upravljanje pacijentima</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Kompletni medicinski kartoni, istorija bolesti i praćenje tretmana pacijenata.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-warning/10 p-3 rounded-xl group-hover:bg-warning/20 transition-colors duration-300">
                    <Package className="h-6 w-6 text-warning" />
                  </div>
                  <CardTitle className="text-xl">Medicinske zalihe</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Praćenje inventara lekova i medicinske opreme sa automatskim upozorenjem za niske zalihe.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="bg-gradient-medical p-2 rounded-xl shadow-medical">
                <Stethoscope className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">PulsMedic</h3>
                <p className="text-sm text-muted-foreground">pulsmedic.rs</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © 2025 PulsMedic. Sva prava zadržana.
              </p>
              <p className="text-sm text-muted-foreground">
                Sistem za upravljanje ordinacijama opšte medicine
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
