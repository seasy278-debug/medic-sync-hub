-- Add calendar permissions table and update appointment policies

-- Create calendar permissions table
CREATE TABLE public.calendar_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    can_view BOOLEAN NOT NULL DEFAULT false,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, doctor_id)
);

-- Enable RLS on calendar permissions
ALTER TABLE public.calendar_permissions ENABLE ROW LEVEL SECURITY;

-- Add trigger for calendar permissions updated_at
CREATE TRIGGER update_calendar_permissions_updated_at
    BEFORE UPDATE ON public.calendar_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create policies for calendar permissions
CREATE POLICY "Admins can manage calendar permissions"
ON public.calendar_permissions FOR ALL
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can view their own permissions"
ON public.calendar_permissions FOR SELECT
TO authenticated
USING (user_id = public.get_current_profile_id());

-- Now update appointment policies to use calendar permissions
DROP POLICY IF EXISTS "Medical staff can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Medical staff can insert appointments" ON public.appointments;  
DROP POLICY IF EXISTS "Medical staff can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Medical staff can delete appointments" ON public.appointments;

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