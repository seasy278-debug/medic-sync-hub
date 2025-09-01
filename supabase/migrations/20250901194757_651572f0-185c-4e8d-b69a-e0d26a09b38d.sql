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

-- Create new RLS policies using security definer functions for profiles
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
CREATE POLICY "Medical staff can view patients"
ON public.patients FOR SELECT
TO authenticated
USING (public.is_medical_staff());

CREATE POLICY "Medical staff can insert patients"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (public.is_medical_staff());

CREATE POLICY "Medical staff can update patients"
ON public.patients FOR UPDATE
TO authenticated
USING (public.is_medical_staff());

CREATE POLICY "Medical staff can delete patients"
ON public.patients FOR DELETE
TO authenticated
USING (public.is_medical_staff());

-- Basic policies for appointments (will be updated later with calendar permissions)
CREATE POLICY "Medical staff can view appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (public.is_medical_staff());

CREATE POLICY "Medical staff can insert appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (public.is_medical_staff());

CREATE POLICY "Medical staff can update appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (public.is_medical_staff());

CREATE POLICY "Medical staff can delete appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (public.is_medical_staff());

-- Policies for inventory
CREATE POLICY "Medical staff can view inventory categories"
ON public.inventory_categories FOR SELECT
TO authenticated
USING (public.is_medical_staff());

CREATE POLICY "Admins can insert inventory categories"
ON public.inventory_categories FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update inventory categories"
ON public.inventory_categories FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete inventory categories"
ON public.inventory_categories FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Medical staff can view inventory items"
ON public.inventory_items FOR SELECT
TO authenticated
USING (public.is_medical_staff());

CREATE POLICY "Medical staff can insert inventory items"
ON public.inventory_items FOR INSERT
TO authenticated
WITH CHECK (public.get_current_user_role() IN ('admin'::user_role, 'doctor'::user_role));

CREATE POLICY "Medical staff can update inventory items"
ON public.inventory_items FOR UPDATE
TO authenticated
USING (public.get_current_user_role() IN ('admin'::user_role, 'doctor'::user_role));

CREATE POLICY "Medical staff can delete inventory items"
ON public.inventory_items FOR DELETE
TO authenticated
USING (public.get_current_user_role() IN ('admin'::user_role, 'doctor'::user_role));

CREATE POLICY "Medical staff can view inventory transactions"
ON public.inventory_transactions FOR SELECT
TO authenticated
USING (public.is_medical_staff());

CREATE POLICY "Medical staff can insert inventory transactions"
ON public.inventory_transactions FOR INSERT
TO authenticated
WITH CHECK (public.is_medical_staff());

CREATE POLICY "Medical staff can update inventory transactions"
ON public.inventory_transactions FOR UPDATE
TO authenticated
USING (public.is_medical_staff());

CREATE POLICY "Medical staff can delete inventory transactions"
ON public.inventory_transactions FOR DELETE
TO authenticated
USING (public.is_medical_staff());