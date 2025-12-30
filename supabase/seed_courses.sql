-- Run this script in the Supabase SQL Editor

do $$
declare
  v_uni_id text;
  v_user_id text;
begin
  -- 1. Get the current user's ID
  v_user_id := auth.uid()::text;
  
  -- If running as admin/no-auth, might need to manually set user ID
  -- v_user_id := 'EXISTING_USER_ID_HERE'; 

  if v_user_id is null then
    raise notice 'No authenticated user found. Please run this script while logged in or manually set v_user_id.';
    return;
  end if;

  -- 2. Find or Create University
  -- Check if user already has a university
  select "universityId" into v_uni_id from public."Profile" where id = v_user_id;

  -- If not, try to find ANY university or create one
  if v_uni_id is null then
      select id into v_uni_id from public."University" limit 1;
      
      if v_uni_id is null then
           -- Create Demo University
           -- Assumes 'id' is TEXT. If UUID, use gen_random_uuid()
           insert into public."University" (id, name, location, domain)
           values (gen_random_uuid()::text, 'Demo University', 'Internet', 'demo.edu')
           returning id into v_uni_id;
      end if;
      
      -- Update User Profile to link to this university
      update public."Profile" set "universityId" = v_uni_id where id = v_user_id;
      raise notice 'Linked user % to University %', v_user_id, v_uni_id;
  end if;

  -- 3. Insert Sample Courses
  if v_uni_id is not null then
      -- Insert CS101
      insert into public."Course" (id, code, name, "universityId")
      values (gen_random_uuid()::text, 'CS101', 'Introduction to Computer Science', v_uni_id)
      on conflict do nothing; -- Assuming unique constraint on code? If not, might duplicate.
      
      -- Insert MATH101
      insert into public."Course" (id, code, name, "universityId")
      values (gen_random_uuid()::text, 'MATH101', 'Calculus I', v_uni_id)
      on conflict do nothing;
      
       -- Insert PHYS101
      insert into public."Course" (id, code, name, "universityId")
      values (gen_random_uuid()::text, 'PHYS101', 'Physics I', v_uni_id)
      on conflict do nothing;
      
      raise notice 'Seeded courses for university %', v_uni_id;
  end if;

end $$;
