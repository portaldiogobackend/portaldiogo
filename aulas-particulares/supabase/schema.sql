-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS (Public profile linked to auth.users)
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  nome text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for users
alter table public.users enable row level security;

create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

-- Trigger to create public.users on auth.signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nome)
  values (new.id, new.email, new.raw_user_meta_data->>'nome');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error on multiple runs
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. STUDENTS
create table if not exists public.students (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  nome text not null,
  telefone text,
  valor_aula decimal(10,2),
  tipo_pagamento text check (tipo_pagamento in ('mensal', 'aula', 'pacote')),
  ativo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.students enable row level security;

create policy "Users can CRUD their own students" on public.students
  for all using (auth.uid() = user_id);

-- 3. LESSONS
create table if not exists public.lessons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  student_id uuid references public.students(id) not null,
  data date not null,
  horario time not null,
  tipo text check (tipo in ('presencial', 'online')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lessons enable row level security;

create policy "Users can CRUD their own lessons" on public.lessons
  for all using (auth.uid() = user_id);

-- 4. ATTENDANCE
create table if not exists public.attendance (
  id uuid default uuid_generate_v4() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  presente boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.attendance enable row level security;

create policy "Users can CRUD attendance for their lessons" on public.attendance
  for all using (
    exists (
      select 1 from public.lessons
      where public.lessons.id = attendance.lesson_id
      and public.lessons.user_id = auth.uid()
    )
  );

-- 5. PAYMENTS
create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.students(id) not null,
  user_id uuid references public.users(id) not null,
  valor decimal(10,2) not null,
  data_pagamento date not null,
  status text check (status in ('pago', 'pendente')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payments enable row level security;

create policy "Users can CRUD their own payments" on public.payments
  for all using (auth.uid() = user_id);

-- SEED DATA EXAMPLE
-- Insert this manually after creating a user in Authentication
/*
insert into public.students (user_id, nome, telefone, valor_aula, tipo_pagamento)
values 
  ('USER_UUID_HERE', 'João Silva', '11999999999', 100.00, 'aula'),
  ('USER_UUID_HERE', 'Maria Oliveira', '11988888888', 400.00, 'mensal');

insert into public.lessons (user_id, student_id, data, horario, tipo)
values
  ('USER_UUID_HERE', 'STUDENT_UUID_1', '2023-10-25', '14:00', 'presencial'),
  ('USER_UUID_HERE', 'STUDENT_UUID_2', '2023-10-26', '10:00', 'online');
*/
