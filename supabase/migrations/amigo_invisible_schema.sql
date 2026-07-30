-- Amigo Invisible

create table if not exists public.amigo_invisible_jugadores (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  token       text not null unique,
  asignado_a  uuid references public.amigo_invisible_jugadores(id),
  revelado_at timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.amigo_invisible_config (
  id     int  primary key default 1,
  estado text not null default 'abierto' check (estado in ('abierto','sorteado')),
  titulo text,
  constraint solo_una_fila check (id = 1)
);

insert into public.amigo_invisible_config (id, estado)
values (1, 'abierto')
on conflict (id) do nothing;

alter table public.amigo_invisible_jugadores enable row level security;
alter table public.amigo_invisible_config    enable row level security;

create policy "admin full jugadores" on public.amigo_invisible_jugadores
  for all to authenticated using (true) with check (true);

create policy "admin full config" on public.amigo_invisible_config
  for all to authenticated using (true) with check (true);
