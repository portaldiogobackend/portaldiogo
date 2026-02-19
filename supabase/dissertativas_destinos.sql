create table if not exists public.tbf_questoes_dissertativas_destinos (
  id uuid primary key default gen_random_uuid(),
  questao_id uuid not null,
  aluno_id uuid not null,
  professor_id uuid null,
  enviado_em timestamptz not null default now()
);

create unique index if not exists uq_dissertativas_destinos_questao_aluno
  on public.tbf_questoes_dissertativas_destinos (questao_id, aluno_id);

alter table public.tbf_questoes_dissertativas_destinos enable row level security;

drop policy if exists "destinos_select_authenticated" on public.tbf_questoes_dissertativas_destinos;
create policy "destinos_select_authenticated"
  on public.tbf_questoes_dissertativas_destinos
  for select
  to authenticated
  using (true);

drop policy if exists "destinos_insert_authenticated" on public.tbf_questoes_dissertativas_destinos;
create policy "destinos_insert_authenticated"
  on public.tbf_questoes_dissertativas_destinos
  for insert
  to authenticated
  with check (true);

