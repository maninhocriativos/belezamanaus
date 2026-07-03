drop policy if exists "users can insert own profile" on profiles;

create policy "users can insert own profile"
on profiles for insert
with check (id = auth.uid());
