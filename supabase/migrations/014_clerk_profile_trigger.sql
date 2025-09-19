-- Create trigger to automatically create profiles for Clerk users
-- This runs when users are created via Supabase's built-in Clerk integration

-- Function to handle new user creation from Clerk
create or replace function public.handle_clerk_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Create profile for new Clerk user
  insert into public.profiles (
    id,
    clerk_user_id,
    email,
    full_name,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.id, -- For Clerk integration, user ID is the Clerk user ID
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    now(),
    now()
  );
  return new;
end;
$$;

-- Create trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_clerk_new_user();

-- Grant necessary permissions
grant execute on function public.handle_clerk_new_user() to authenticated;
grant execute on function public.handle_clerk_new_user() to service_role;