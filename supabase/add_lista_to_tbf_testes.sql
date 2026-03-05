alter table if exists public.tbf_testes
  add column if not exists lista text;

create index if not exists idx_tbf_testes_lista
  on public.tbf_testes (lista);
