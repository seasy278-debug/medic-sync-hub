-- Clear existing data and recreate schema for PulsMedic medical practice management

-- Drop existing tables (in correct order to handle dependencies)
DROP TABLE IF EXISTS customer_visits CASCADE;
DROP TABLE IF EXISTS player_inventory CASCADE;
DROP TABLE IF EXISTS item_types CASCADE;
DROP TABLE IF EXISTS item_categories CASCADE;
DROP TABLE IF EXISTS shop_upgrades CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'nurse', 'receptionist');

-- Create appointment status enum
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

-- Create profiles table for medical staff
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'receptionist',
    phone TEXT,
    specialization TEXT,
    license_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create patients table
CREATE TABLE public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    jmbg TEXT UNIQUE,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_notes TEXT,
    allergies TEXT,
    chronic_conditions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    diagnosis TEXT,
    treatment TEXT,
    next_appointment_needed BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medical inventory categories
CREATE TABLE public.inventory_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medical inventory items
CREATE TABLE public.inventory_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES inventory_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    unit_of_measure TEXT NOT NULL DEFAULT 'kom',
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2),
    supplier TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory transactions
CREATE TABLE public.inventory_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    performed_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile and admins can view all"
ON public.profiles FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
);

CREATE POLICY "Allow system profile creation"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own profile and admins can update all"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
);

-- RLS Policies for patients (medical staff can access)
CREATE POLICY "Medical staff can manage patients"
ON public.patients FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() AND p.is_active = true
    )
);

-- RLS Policies for appointments (medical staff can access)
CREATE POLICY "Medical staff can manage appointments"
ON public.appointments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() AND p.is_active = true
    )
);

-- RLS Policies for inventory (medical staff can access)
CREATE POLICY "Medical staff can view inventory categories"
ON public.inventory_categories FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() AND p.is_active = true
    )
);

CREATE POLICY "Admins can manage inventory categories"
ON public.inventory_categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
);

CREATE POLICY "Medical staff can view inventory items"
ON public.inventory_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() AND p.is_active = true
    )
);

CREATE POLICY "Admins and doctors can manage inventory items"
ON public.inventory_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'doctor') AND p.is_active = true
    )
);

CREATE POLICY "Medical staff can view inventory transactions"
ON public.inventory_transactions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() AND p.is_active = true
    )
);

CREATE POLICY "Medical staff can create inventory transactions"
ON public.inventory_transactions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() AND p.is_active = true
    )
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        CASE 
            WHEN NEW.email = 'nenad@pulsmedic.rs' THEN 'admin'::user_role
            ELSE 'receptionist'::user_role
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default inventory categories
INSERT INTO public.inventory_categories (name, description) VALUES
('Lekovi', 'Osnovni lekovi i farmaceutski proizvodi'),
('Medicinski materijal', 'Jednokratni medicinski materijal'),
('Dijagnostika', 'Dijagnostički testovi i reagensi'),
('Oprema', 'Medicinska oprema i instrumenti'),
('Dokumentacija', 'Medicinska dokumentacija i obrasce');

-- Insert some sample inventory items
INSERT INTO public.inventory_items (category_id, name, description, unit_of_measure, current_stock, min_stock_level, unit_price) 
SELECT 
    c.id,
    item_name,
    item_desc,
    'kom' as unit_of_measure,
    50 as current_stock,
    10 as min_stock_level,
    price
FROM public.inventory_categories c
CROSS JOIN (VALUES
    ('Jednokratne špriceve 5ml', 'Sterilne jednokratne špriceve', 15.0),
    ('Medicinske maske', 'Hirurške maske za jednokratnu upotrebu', 5.0),
    ('Rukavice nitrilne', 'Jednokratne nitrilne rukavice', 25.0)
) AS items(item_name, item_desc, price)
WHERE c.name = 'Medicinski materijal'
LIMIT 3;