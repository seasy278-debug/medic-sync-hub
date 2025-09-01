import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  ArrowLeft,
  Activity,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertTriangle
} from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  jmbg: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_notes: string | null;
  allergies: string | null;
  chronic_conditions: string | null;
  is_active: boolean;
  created_at: string;
}

const Patients = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatePatientOpen, setIsCreatePatientOpen] = useState(false);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const [patientForm, setPatientForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    jmbg: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
    allergies: '',
    chronic_conditions: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchPatients();
    }
  }, [user, loading, navigate]);

  const fetchPatients = async () => {
    try {
      setLoadingData(true);
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);

    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Greška",
        description: "Nije moguće učitati pacijente",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const createPatient = async () => {
    try {
      const { error } = await supabase
        .from('patients')
        .insert({
          ...patientForm,
          date_of_birth: patientForm.date_of_birth || null,
          jmbg: patientForm.jmbg || null,
          phone: patientForm.phone || null,
          email: patientForm.email || null,
          address: patientForm.address || null,
          city: patientForm.city || null,
          emergency_contact_name: patientForm.emergency_contact_name || null,
          emergency_contact_phone: patientForm.emergency_contact_phone || null,
          medical_notes: patientForm.medical_notes || null,
          allergies: patientForm.allergies || null,
          chronic_conditions: patientForm.chronic_conditions || null,
        });

      if (error) throw error;

      toast({
        title: "Uspešno",
        description: "Pacijent je uspešno dodat",
      });

      setIsCreatePatientOpen(false);
      resetForm();
      fetchPatients();
    } catch (error: any) {
      console.error('Error creating patient:', error);
      toast({
        title: "Greška",
        description: error.message || "Nije moguće dodati pacijenta",
        variant: "destructive",
      });
    }
  };

  const updatePatient = async () => {
    if (!selectedPatient) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update({
          ...patientForm,
          date_of_birth: patientForm.date_of_birth || null,
          jmbg: patientForm.jmbg || null,
          phone: patientForm.phone || null,
          email: patientForm.email || null,
          address: patientForm.address || null,
          city: patientForm.city || null,
          emergency_contact_name: patientForm.emergency_contact_name || null,
          emergency_contact_phone: patientForm.emergency_contact_phone || null,
          medical_notes: patientForm.medical_notes || null,
          allergies: patientForm.allergies || null,
          chronic_conditions: patientForm.chronic_conditions || null,
        })
        .eq('id', selectedPatient.id);

      if (error) throw error;

      toast({
        title: "Uspešno",
        description: "Podaci o pacijentu su ažurirani",
      });

      setIsEditPatientOpen(false);
      resetForm();
      fetchPatients();
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast({
        title: "Greška",
        description: error.message || "Nije moguće ažurirati pacijenta",
        variant: "destructive",
      });
    }
  };

  const deletePatient = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update({ is_active: false })
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "Uspešno",
        description: "Pacijent je uklonjen iz aktivne liste",
      });

      fetchPatients();
    } catch (error: any) {
      toast({
        title: "Greška",
        description: error.message || "Nije moguće ukloniti pacijenta",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setPatientForm({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      jmbg: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      medical_notes: '',
      allergies: '',
      chronic_conditions: ''
    });
    setSelectedPatient(null);
  };

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientForm({
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth || '',
      jmbg: patient.jmbg || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      city: patient.city || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || '',
      medical_notes: patient.medical_notes || '',
      allergies: patient.allergies || '',
      chronic_conditions: patient.chronic_conditions || ''
    });
    setIsEditPatientOpen(true);
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.jmbg?.includes(searchQuery) ||
    patient.phone?.includes(searchQuery) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Učitavanje pacijenata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="hover:shadow-card transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Nazad
            </Button>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-medical p-2 rounded-lg shadow-medical">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Pacijenti</h1>
                <p className="text-sm text-muted-foreground">Upravljanje pacijentima</p>
              </div>
            </div>
          </div>
          
          <Dialog open={isCreatePatientOpen} onOpenChange={setIsCreatePatientOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-medical hover:shadow-medical">
                <UserPlus className="h-4 w-4 mr-2" />
                Dodaj pacijenta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Dodavanje novog pacijenta</DialogTitle>
                <DialogDescription>
                  Unesite osnovne podatke o pacijentu
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Ime *</Label>
                    <Input
                      id="first_name"
                      value={patientForm.first_name}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Marko"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Prezime *</Label>
                    <Input
                      id="last_name"
                      value={patientForm.last_name}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Marković"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Datum rođenja</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={patientForm.date_of_birth}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jmbg">JMBG</Label>
                    <Input
                      id="jmbg"
                      value={patientForm.jmbg}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, jmbg: e.target.value }))}
                      placeholder="1234567890123"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={patientForm.phone}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+381 11 234 5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={patientForm.email}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="marko@email.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresa</Label>
                    <Input
                      id="address"
                      value={patientForm.address}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Knez Mihailova 12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Grad</Label>
                    <Input
                      id="city"
                      value={patientForm.city}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Beograd"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name">Kontakt za hitne slučajeve</Label>
                    <Input
                      id="emergency_contact_name"
                      value={patientForm.emergency_contact_name}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                      placeholder="Ana Marković"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">Telefon hitnog kontakta</Label>
                    <Input
                      id="emergency_contact_phone"
                      value={patientForm.emergency_contact_phone}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                      placeholder="+381 11 987 6543"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="allergies">Alergije</Label>
                  <Textarea
                    id="allergies"
                    value={patientForm.allergies}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, allergies: e.target.value }))}
                    placeholder="Penicilin, orasi..."
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chronic_conditions">Hronična oboljenja</Label>
                  <Textarea
                    id="chronic_conditions"
                    value={patientForm.chronic_conditions}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, chronic_conditions: e.target.value }))}
                    placeholder="Hipertenzija, dijabetes..."
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="medical_notes">Medicinske napomene</Label>
                  <Textarea
                    id="medical_notes"
                    value={patientForm.medical_notes}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, medical_notes: e.target.value }))}
                    placeholder="Dodatne napomene o pacijentu..."
                    rows={3}
                  />
                </div>
                
                <Button onClick={createPatient} className="w-full bg-gradient-medical hover:shadow-medical">
                  Dodaj pacijenta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pretraži pacijente po imenu, JMBG-u, telefonu ili email-u..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 transition-all duration-200 focus:shadow-medical"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ukupno pacijenata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{patients.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sa alergijama</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {patients.filter(p => p.allergies).length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sa hroničnim oboljenjima</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {patients.filter(p => p.chronic_conditions).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patients List */}
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-card transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        {patient.allergies && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Alergije
                          </Badge>
                        )}
                        {patient.chronic_conditions && (
                          <Badge variant="outline" className="text-xs border-warning text-warning">
                            <Heart className="h-3 w-3 mr-1" />
                            Hronično
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        {patient.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{patient.phone}</span>
                          </div>
                        )}
                        {patient.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{patient.email}</span>
                          </div>
                        )}
                        {(patient.address || patient.city) && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{[patient.address, patient.city].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </div>
                      
                      {patient.jmbg && (
                        <p className="text-xs text-muted-foreground mt-1">JMBG: {patient.jmbg}</p>
                      )}
                      
                      {patient.date_of_birth && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Rođen: {new Date(patient.date_of_birth).toLocaleDateString('sr-RS')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(patient)}
                      className="hover:shadow-card transition-all duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePatient(patient.id)}
                      className="hover:shadow-card transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredPatients.length === 0 && (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery ? 'Nema rezultata pretrage' : 'Nema pacijenata'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Pokušajte sa drugim terminima pretrage.' 
                    : 'Dodajte prvog pacijenta u sistem.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Patient Dialog */}
        <Dialog open={isEditPatientOpen} onOpenChange={setIsEditPatientOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Uređivanje podataka pacijenta</DialogTitle>
              <DialogDescription>
                Ažurirajte podatke o pacijentu
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">Ime *</Label>
                  <Input
                    id="edit_first_name"
                    value={patientForm.first_name}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Marko"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name">Prezime *</Label>
                  <Input
                    id="edit_last_name"
                    value={patientForm.last_name}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Marković"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_date_of_birth">Datum rođenja</Label>
                  <Input
                    id="edit_date_of_birth"
                    type="date"
                    value={patientForm.date_of_birth}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_jmbg">JMBG</Label>
                  <Input
                    id="edit_jmbg"
                    value={patientForm.jmbg}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, jmbg: e.target.value }))}
                    placeholder="1234567890123"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_phone">Telefon</Label>
                  <Input
                    id="edit_phone"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+381 11 234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={patientForm.email}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="marko@email.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_address">Adresa</Label>
                  <Input
                    id="edit_address"
                    value={patientForm.address}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Knez Mihailova 12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_city">Grad</Label>
                  <Input
                    id="edit_city"
                    value={patientForm.city}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Beograd"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_emergency_contact_name">Kontakt za hitne slučajeve</Label>
                  <Input
                    id="edit_emergency_contact_name"
                    value={patientForm.emergency_contact_name}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                    placeholder="Ana Marković"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_emergency_contact_phone">Telefon hitnog kontakta</Label>
                  <Input
                    id="edit_emergency_contact_phone"
                    value={patientForm.emergency_contact_phone}
                    onChange={(e) => setPatientForm(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                    placeholder="+381 11 987 6543"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_allergies">Alergije</Label>
                <Textarea
                  id="edit_allergies"
                  value={patientForm.allergies}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder="Penicilin, orasi..."
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_chronic_conditions">Hronična oboljenja</Label>
                <Textarea
                  id="edit_chronic_conditions"
                  value={patientForm.chronic_conditions}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, chronic_conditions: e.target.value }))}
                  placeholder="Hipertenzija, dijabetes..."
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_medical_notes">Medicinske napomene</Label>
                <Textarea
                  id="edit_medical_notes"
                  value={patientForm.medical_notes}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, medical_notes: e.target.value }))}
                  placeholder="Dodatne napomene o pacijentu..."
                  rows={3}
                />
              </div>
              
              <Button onClick={updatePatient} className="w-full bg-gradient-medical hover:shadow-medical">
                Ažuriraj podatke
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Patients;