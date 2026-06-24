-- ─────────────────────────────────────────
-- TABLA: prem_premios
-- ─────────────────────────────────────────
create table prem_premios (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  emoji       text not null default '🎁',
  stock       integer not null default 0 check (stock >= 0),
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- TABLA: prem_ganadores
-- ─────────────────────────────────────────
create table prem_ganadores (
  id           uuid primary key default gen_random_uuid(),
  premio_id    uuid references prem_premios(id) on delete set null,
  premio_nombre text not null,
  premio_emoji  text not null default '🎁',
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────
create index on prem_premios (activo, stock);
create index on prem_ganadores (created_at desc);

-- ─────────────────────────────────────────
-- TRIGGER: actualizar updated_at automáticamente
-- ─────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger prem_premios_updated_at
  before update on prem_premios
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────
-- RPC: sortear_premio (operación atómica)
-- Selecciona un premio al azar con peso proporcional
-- al stock, descuenta 1 unidad y registra al ganador.
-- Usa FOR UPDATE para evitar race conditions.
-- ─────────────────────────────────────────
create or replace function sortear_premio()
returns json
language plpgsql
security definer
as $$
declare
  v_premio     prem_premios%rowtype;
  v_ganador_id uuid;
  v_total      integer;
  v_rand       float;
  v_acum       integer := 0;
  v_rec        prem_premios%rowtype;
begin
  select sum(stock) into v_total
  from prem_premios
  where activo = true and stock > 0;

  if v_total is null or v_total = 0 then
    return json_build_object('error', 'sin_stock');
  end if;

  v_rand := floor(random() * v_total);

  for v_rec in
    select * from prem_premios
    where activo = true and stock > 0
    order by created_at asc
    for update
  loop
    v_acum := v_acum + v_rec.stock;
    if v_rand < v_acum then
      v_premio := v_rec;
      exit;
    end if;
  end loop;

  update prem_premios
  set stock = stock - 1
  where id = v_premio.id;

  insert into prem_ganadores (premio_id, premio_nombre, premio_emoji)
  values (v_premio.id, v_premio.nombre, v_premio.emoji)
  returning id into v_ganador_id;

  return json_build_object(
    'id',         v_premio.id,
    'nombre',     v_premio.nombre,
    'emoji',      v_premio.emoji,
    'ganador_id', v_ganador_id
  );
end;
$$;

-- ─────────────────────────────────────────
-- RLS (Row Level Security)
-- ─────────────────────────────────────────
alter table prem_premios  enable row level security;
alter table prem_ganadores enable row level security;

create policy "Premios activos visibles públicamente"
  on prem_premios for select
  using (activo = true and stock > 0);
