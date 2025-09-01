import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Plus,
  ArrowLeft,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Search,
  Calendar
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface InventoryItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  unit_of_measure: string;
  current_stock: number;
  min_stock_level: number;
  unit_price: number | null;
  supplier: string | null;
  expiry_date: string | null;
  created_at: string;
  inventory_categories: Category;
}

interface Transaction {
  id: string;
  item_id: string;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string | null;
  performed_by: string;
  created_at: string;
  inventory_items: { name: string };
  profiles: { full_name: string };
}

const Inventory = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  
  const [itemForm, setItemForm] = useState({
    category_id: '',
    name: '',
    description: '',
    unit_of_measure: 'kom',
    current_stock: 0,
    min_stock_level: 10,
    unit_price: '',
    supplier: '',
    expiry_date: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  const [transactionForm, setTransactionForm] = useState({
    transaction_type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reason: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, loading, navigate]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch inventory items
      const { data: itemsData, error: itemsError } = await supabase
        .from('inventory_items')
        .select(`
          *,
          inventory_categories (id, name, description)
        `)
        .order('name', { ascending: true });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          inventory_items!inner (name),
          profiles!inner (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData as Transaction[] || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Greška",
        description: "Nije moguće učitati podatke",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const createItem = async () => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .insert({
          ...itemForm,
          unit_price: itemForm.unit_price ? parseFloat(itemForm.unit_price) : null,
          supplier: itemForm.supplier || null,
          expiry_date: itemForm.expiry_date || null,
          description: itemForm.description || null
        });

      if (error) throw error;

      toast({
        title: "Uspešno",
        description: "Artikal je dodat u inventar",
      });

      setIsCreateItemOpen(false);
      resetItemForm();
      fetchData();
    } catch (error: any) {
      console.error('Error creating item:', error);
      toast({
        title: "Greška",
        description: error.message || "Nije moguće dodati artikal",
        variant: "destructive",
      });
    }
  };

  const createCategory = async () => {
    try {
      const { error } = await supabase
        .from('inventory_categories')
        .insert(categoryForm);

      if (error) throw error;

      toast({
        title: "Uspešno",
        description: "Kategorija je kreirana",
      });

      setIsCreateCategoryOpen(false);
      setCategoryForm({ name: '', description: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: "Greška",
        description: error.message || "Nije moguće kreirati kategoriju",
        variant: "destructive",
      });
    }
  };

  const createTransaction = async () => {
    if (!selectedItem || !profile) return;

    try {
      // Create transaction
      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert({
          item_id: selectedItem.id,
          transaction_type: transactionForm.transaction_type,
          quantity: transactionForm.quantity,
          reason: transactionForm.reason || null,
          performed_by: profile.id
        });

      if (transactionError) throw transactionError;

      // Update item stock
      let newStock = selectedItem.current_stock;
      
      if (transactionForm.transaction_type === 'in') {
        newStock += transactionForm.quantity;
      } else if (transactionForm.transaction_type === 'out') {
        newStock -= transactionForm.quantity;
      } else {
        newStock = transactionForm.quantity; // adjustment sets absolute value
      }

      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ current_stock: Math.max(0, newStock) })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      toast({
        title: "Uspešno",
        description: "Transakcija je evidentirana",
      });

      setIsTransactionOpen(false);
      setTransactionForm({
        transaction_type: 'in',
        quantity: 0,
        reason: ''
      });
      setSelectedItem(null);
      fetchData();
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Greška",
        description: error.message || "Nije moguće evidentirati transakciju",
        variant: "destructive",
      });
    }
  };

  const resetItemForm = () => {
    setItemForm({
      category_id: '',
      name: '',
      description: '',
      unit_of_measure: 'kom',
      current_stock: 0,
      min_stock_level: 10,
      unit_price: '',
      supplier: '',
      expiry_date: ''
    });
  };

  const openTransactionDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsTransactionOpen(true);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.inventory_categories.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = items.filter(item => item.current_stock <= item.min_stock_level);
  const expiringSoonItems = items.filter(item => {
    if (!item.expiry_date) return false;
    const expiryDate = new Date(item.expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock === 0) {
      return <Badge variant="destructive" className="text-xs">Nema na stanju</Badge>;
    } else if (item.current_stock <= item.min_stock_level) {
      return <Badge variant="outline" className="text-xs border-warning text-warning">Niske zalihe</Badge>;
    } else {
      return <Badge variant="outline" className="text-xs border-success text-success">Na stanju</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'out': return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'adjustment': return <Edit className="h-4 w-4 text-warning" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTransactionText = (type: string) => {
    switch (type) {
      case 'in': return 'Ulaz';
      case 'out': return 'Izlaz';
      case 'adjustment': return 'Korekcija';
      default: return type;
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Učitavanje inventara...</p>
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
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Inventar</h1>
                <p className="text-sm text-muted-foreground">Upravljanje zalihama</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {profile?.role === 'admin' && (
              <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="hover:shadow-card">
                    <Plus className="h-4 w-4 mr-2" />
                    Kategorija
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nova kategorija</DialogTitle>
                    <DialogDescription>
                      Kreiranje nove kategorije inventara
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_name">Naziv kategorije</Label>
                      <Input
                        id="category_name"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Medicinski materijal"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category_description">Opis</Label>
                      <Textarea
                        id="category_description"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Opis kategorije..."
                        rows={3}
                      />
                    </div>
                    
                    <Button onClick={createCategory} className="w-full bg-gradient-medical hover:shadow-medical">
                      Kreiraj kategoriju
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-medical hover:shadow-medical">
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj artikal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Dodavanje novog artikla</DialogTitle>
                  <DialogDescription>
                    Unesite podatke o novom artiklu u inventaru
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item_name">Naziv *</Label>
                      <Input
                        id="item_name"
                        value={itemForm.name}
                        onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Jednokratne špriceve 5ml"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item_category">Kategorija *</Label>
                      <Select value={itemForm.category_id} onValueChange={(value) => setItemForm(prev => ({ ...prev, category_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Izaberite kategoriju" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="item_description">Opis</Label>
                    <Textarea
                      id="item_description"
                      value={itemForm.description}
                      onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detaljni opis artikla..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit_of_measure">Jedinica mere</Label>
                      <Select value={itemForm.unit_of_measure} onValueChange={(value) => setItemForm(prev => ({ ...prev, unit_of_measure: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kom">kom</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="l">l</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                          <SelectItem value="pakovanje">pakovanje</SelectItem>
                          <SelectItem value="kutija">kutija</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_stock">Početno stanje</Label>
                      <Input
                        id="current_stock"
                        type="number"
                        value={itemForm.current_stock}
                        onChange={(e) => setItemForm(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min_stock_level">Minimalne zalihe</Label>
                      <Input
                        id="min_stock_level"
                        type="number"
                        value={itemForm.min_stock_level}
                        onChange={(e) => setItemForm(prev => ({ ...prev, min_stock_level: parseInt(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit_price">Jedinična cena (RSD)</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        value={itemForm.unit_price}
                        onChange={(e) => setItemForm(prev => ({ ...prev, unit_price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Dobavljač</Label>
                      <Input
                        id="supplier"
                        value={itemForm.supplier}
                        onChange={(e) => setItemForm(prev => ({ ...prev, supplier: e.target.value }))}
                        placeholder="Naziv dobavljača"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Datum isteka</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={itemForm.expiry_date}
                      onChange={(e) => setItemForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                    />
                  </div>
                  
                  <Button onClick={createItem} className="w-full bg-gradient-medical hover:shadow-medical">
                    Dodaj u inventar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items">Artikli</TabsTrigger>
            <TabsTrigger value="alerts">Upozorenja</TabsTrigger>
            <TabsTrigger value="transactions">Transakcije</TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pretraži artikle po nazivu, kategoriji ili dobavljaču..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 transition-all duration-200 focus:shadow-medical"
                />
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Ukupno artikala</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{items.length}</div>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Niske zalihe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">{lowStockItems.length}</div>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Istiru uskoro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{expiringSoonItems.length}</div>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Kategorije</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent-foreground">{categories.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Items List */}
            <div className="grid gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-card transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                            {getStockStatus(item)}
                            <Badge variant="outline" className="text-xs">
                              {item.inventory_categories.name}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Na stanju:</span>
                              <span className={item.current_stock <= item.min_stock_level ? 'text-warning font-medium' : ''}>
                                {item.current_stock} {item.unit_of_measure}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Min. nivo:</span>
                              <span>{item.min_stock_level} {item.unit_of_measure}</span>
                            </div>
                            {item.unit_price && (
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Cena:</span>
                                <span>{item.unit_price} RSD</span>
                              </div>
                            )}
                            {item.expiry_date && (
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Ističe: {new Date(item.expiry_date).toLocaleDateString('sr-RS')}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {item.supplier && (
                            <p className="text-xs text-muted-foreground">Dobavljač: {item.supplier}</p>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTransactionDialog(item)}
                        className="hover:shadow-card transition-all duration-200"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Transakcija
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredItems.length === 0 && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {searchQuery ? 'Nema rezultata pretrage' : 'Nema artikala u inventaru'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'Pokušajte sa drugim terminima pretrage.' 
                        : 'Dodajte prvi artikal u inventar.'
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Upozorenja</h2>
              <p className="text-muted-foreground">Artikli koji zahtevaju pažnju</p>
            </div>

            <div className="space-y-6">
              {/* Low Stock Alerts */}
              {lowStockItems.length > 0 && (
                <Card className="border-warning/50 bg-warning/5">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-warning">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Niske zalihe ({lowStockItems.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lowStockItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-card rounded-lg">
                          <div>
                            <h4 className="font-medium text-foreground">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Na stanju: {item.current_stock} {item.unit_of_measure} (min: {item.min_stock_level})
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTransactionDialog(item)}
                          >
                            Dodaj zalihe
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Expiring Soon Alerts */}
              {expiringSoonItems.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-destructive">
                      <Calendar className="h-5 w-5" />
                      <span>Ističu uskoro ({expiringSoonItems.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {expiringSoonItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-card rounded-lg">
                          <div>
                            <h4 className="font-medium text-foreground">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Ističe: {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('sr-RS') : 'N/A'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTransactionDialog(item)}
                          >
                            Izlaz
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {lowStockItems.length === 0 && expiringSoonItems.length === 0 && (
                <Card className="border-success/50 bg-success/5">
                  <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 text-success mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Sve je u redu!</h3>
                    <p className="text-muted-foreground">Nema artikala koji zahtevaju hitnu pažnju.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Poslednje transakcije</h2>
              <p className="text-muted-foreground">Pregled poslednje 50 transakcija</p>
            </div>

            <div className="grid gap-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <h4 className="font-medium text-foreground">
                            {getTransactionText(transaction.transaction_type)} - {transaction.inventory_items.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Količina: {transaction.quantity} | 
                            Izvršio: {transaction.profiles.full_name} | 
                            {new Date(transaction.created_at).toLocaleDateString('sr-RS')} {new Date(transaction.created_at).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {transaction.reason && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Razlog: {transaction.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {transactions.length === 0 && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Nema transakcija</h3>
                    <p className="text-muted-foreground">Transakcije će se prikazati ovde kada se izvrše.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Transaction Dialog */}
        <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova transakcija</DialogTitle>
              <DialogDescription>
                {selectedItem && `Transakcija za: ${selectedItem.name}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transaction_type">Tip transakcije</Label>
                <Select value={transactionForm.transaction_type} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, transaction_type: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Ulaz - Dodavanje zaliha</SelectItem>
                    <SelectItem value="out">Izlaz - Trošenje zaliha</SelectItem>
                    <SelectItem value="adjustment">Korekcija - Podešavanje stanja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transaction_quantity">
                  Količina ({selectedItem?.unit_of_measure})
                </Label>
                <Input
                  id="transaction_quantity"
                  type="number"
                  value={transactionForm.quantity}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transaction_reason">Razlog</Label>
                <Textarea
                  id="transaction_reason"
                  value={transactionForm.reason}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Razlog transakcije..."
                  rows={2}
                />
              </div>
              
              {selectedItem && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Trenutno stanje: <span className="font-medium">{selectedItem.current_stock} {selectedItem.unit_of_measure}</span>
                  </p>
                  {transactionForm.transaction_type !== 'adjustment' && (
                    <p className="text-sm text-muted-foreground">
                      Novo stanje: <span className="font-medium">
                        {transactionForm.transaction_type === 'in' 
                          ? selectedItem.current_stock + transactionForm.quantity
                          : Math.max(0, selectedItem.current_stock - transactionForm.quantity)
                        } {selectedItem.unit_of_measure}
                      </span>
                    </p>
                  )}
                  {transactionForm.transaction_type === 'adjustment' && (
                    <p className="text-sm text-muted-foreground">
                      Novo stanje: <span className="font-medium">{transactionForm.quantity} {selectedItem.unit_of_measure}</span>
                    </p>
                  )}
                </div>
              )}
              
              <Button onClick={createTransaction} className="w-full bg-gradient-medical hover:shadow-medical">
                Izvrši transakciju
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Inventory;