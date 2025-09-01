-- Fix infinite recursion in RLS policies by using security definer functions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile and admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile and admins can update all" ON public.profiles;
DROP POLICY IF EXISTS "Medical staff can manage patients" ON public.patients;
DROP POLICY IF EXISTS "Medical staff can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Medical staff can view inventory categories" ON public.inventory_categories;
DROP POLICY IF EXISTS "Admins can manage inventory categories" ON public.inventory_categories;
DROP POLICY IF EXISTS "Medical staff can view inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Admins and doctors can manage inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Medical staff can view inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Medical staff can create inventory transactions" ON public.inventory_transactions;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role_result, 'receptionist'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_role() = 'admin'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_medical_staff()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS uuid AS $$
DECLARE
  profile_id uuid;
BEGIN
  SELECT id INTO profile_id 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create new RLS policies using security definer functions
CREATE POLICY "Users can view profiles based on role"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR public.is_admin()
);

CREATE POLICY "Users can update their own profile, admins can update all"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR public.is_admin()
);

CREATE POLICY "Only admins can create new profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_admin());

-- Policies for patients
CREATE POLICY "Medical staff can manage patients"
ON public.patients FOR ALL
TO authenticated
USING (public.is_medical_staff());

-- Policies for appointments  
CREATE POLICY "Medical staff can manage appointments"
ON public.appointments FOR ALL
TO authenticated
USING (public.is_medical_staff());

-- Policies for inventory
CREATE POLICY "Medical staff can view inventory categories"
ON public.inventory_categories FOR SELECT
TO authenticated
USING (public.is_medical_staff());

CREATE POLICY "Admins can manage inventory categories"
ON public.inventory_categories FOR INSERT, UPDATE, DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Medical staff can view inventory items"
ON public.inventory_items FOR SELECT
TO authenticated
USING (public.is_medical_staff());

CREATE POLICY "Medical staff can manage inventory items"
ON public.inventory_items FOR INSERT, UPDATE, DELETE
TO authenticated
USING (public.get_current_user_role() IN ('admin'::user_role, 'doctor'::user_role));

CREATE POLICY "Medical staff can manage inventory transactions"
ON public.inventory_transactions FOR ALL
TO authenticated
USING (public.is_medical_staff());

-- Add calendar access control table
CREATE TABLE public.calendar_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    can_view BOOLEAN NOT NULL DEFAULT false,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, doctor_id)
);

-- Enable RLS on calendar permissions
ALTER TABLE public.calendar_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage calendar permissions"
ON public.calendar_permissions FOR ALL
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can view their own permissions"
ON public.calendar_permissions FOR SELECT
TO authenticated
USING (user_id = public.get_current_profile_id());

-- Update appointments table to include calendar permissions check
DROP POLICY IF EXISTS "Medical staff can manage appointments" ON public.appointments;

CREATE POLICY "Users can view appointments based on permissions"
ON public.appointments FOR SELECT
TO authenticated
USING (
  public.is_admin() OR
  doctor_id = public.get_current_profile_id() OR
  EXISTS (
    SELECT 1 FROM public.calendar_permissions cp
    WHERE cp.user_id = public.get_current_profile_id() 
    AND cp.doctor_id = appointments.doctor_id 
    AND cp.can_view = true
  )
);

CREATE POLICY "Users can create appointments based on permissions"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin() OR
  doctor_id = public.get_current_profile_id() OR
  EXISTS (
    SELECT 1 FROM public.calendar_permissions cp
    WHERE cp.user_id = public.get_current_profile_id() 
    AND cp.doctor_id = appointments.doctor_id 
    AND cp.can_edit = true
  )
);

CREATE POLICY "Users can update appointments based on permissions"
ON public.appointments FOR UPDATE
TO authenticated
USING (
  public.is_admin() OR
  doctor_id = public.get_current_profile_id() OR
  EXISTS (
    SELECT 1 FROM public.calendar_permissions cp
    WHERE cp.user_id = public.get_current_profile_id() 
    AND cp.doctor_id = appointments.doctor_id 
    AND cp.can_edit = true
  )
);

CREATE POLICY "Users can delete appointments based on permissions"
ON public.appointments FOR DELETE
TO authenticated
USING (
  public.is_admin() OR
  doctor_id = public.get_current_profile_id() OR
  EXISTS (
    SELECT 1 FROM public.calendar_permissions cp
    WHERE cp.user_id = public.get_current_profile_id() 
    AND cp.doctor_id = appointments.doctor_id 
    AND cp.can_edit = true
  )
);

-- Add trigger for calendar permissions updated_at
CREATE TRIGGER update_calendar_permissions_updated_at
    BEFORE UPDATE ON public.calendar_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();