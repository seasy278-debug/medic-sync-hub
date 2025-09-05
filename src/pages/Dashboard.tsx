import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Users, 
  Package, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Activity,
  UserPlus,
  Bell
} from 'lucide-react';

interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  lowStockItems: number;
  pendingAppointments: number;
}

const Dashboard = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    totalPatients: 0,
    lowStockItems: 0,
    pendingAppointments: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    const fetchStats = async () => {
      if (!user) return;

      try {
        // Today's appointments
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('appointment_date', today);

        // Total patients
        const { count: patientsCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Low stock items
        const { data: allItems } = await supabase
          .from('inventory_items')
          .select('current_stock, min_stock_level');
        
        const lowStock = allItems?.filter(item => 
          item.current_stock <= item.min_stock_level
        ) || [];

        // Pending appointments
        const { count: pendingCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'scheduled');

        setStats({
          todayAppointments: todayCount || 0,
          totalPatients: patientsCount || 0,
          lowStockItems: lowStock?.length || 0,
          pendingAppointments: pendingCount || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive text-destructive-foreground';
      case 'doctor': return 'bg-primary text-primary-foreground';
      case 'nurse': return 'bg-success text-success-foreground';
      case 'receptionist': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'doctor': return 'Lekar';
      case 'nurse': return 'Sestra';
      case 'receptionist': return 'Recepcioner';
      default: return 'Nepoznato';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-medical p-2 rounded-lg shadow-medical">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">PulsMedic</h1>
              <p className="text-sm text-muted-foreground">Sistem za upravljanje ordinacijom</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {profile?.full_name || 'Korisnik'}
              </p>
              <Badge className={`text-xs ${getRoleBadgeColor(profile?.role || '')}`}>
                {getRoleText(profile?.role || '')}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSignOut}
              className="hover:shadow-medical transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Dobrodošli, {profile?.full_name?.split(' ')[0] || 'Korisnik'}!
          </h2>
          <p className="text-muted-foreground">
            Pregled aktivnosti vaše ordinacije za danas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-card transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Današnji pregledi</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.todayAppointments}</div>
              <p className="text-xs text-muted-foreground">
                zakazanih za danas
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-card transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ukupno pacijenata</CardTitle>
              <Users className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">
                aktivnih pacijenata
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-card transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Niske zalihe</CardTitle>
              <Package className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">
                artikala za dopunu
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-card transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Na čekanju</CardTitle>
              <ClipboardList className="h-4 w-4 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.pendingAppointments}</div>
              <p className="text-xs text-muted-foreground">
                termina za potvrdu
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-200 cursor-pointer group"
            onClick={() => navigate('/patients')}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors duration-200">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Upravljaj pacijentima</CardTitle>
                  <CardDescription>Dodaj i upravljaj pacijentima</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-200 cursor-pointer group"
            onClick={() => navigate('/appointments')}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-success/10 p-3 rounded-lg group-hover:bg-success/20 transition-colors duration-200">
                  <Calendar className="h-6 w-6 text-success" />
                </div>
                <div>
                  <CardTitle className="text-lg">Kalendar termina</CardTitle>
                  <CardDescription>Zakaži i upravljaj terminima</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-200 cursor-pointer group"
            onClick={() => navigate('/inventory')}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-warning/10 p-3 rounded-lg group-hover:bg-warning/20 transition-colors duration-200">
                  <Package className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg">Upravljaj zalihama</CardTitle>
                  <CardDescription>Pregled i upravljanje medicinskim zalihama</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {profile?.role === 'admin' && (
            <Card 
              className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-elevated transition-all duration-200 cursor-pointer group"
              onClick={() => navigate('/admin')}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-destructive/10 p-3 rounded-lg group-hover:bg-destructive/20 transition-colors duration-200">
                    <Settings className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Administracija</CardTitle>
                    <CardDescription>Upravljanje korisnicima i sistemom</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;