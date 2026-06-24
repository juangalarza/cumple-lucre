# MASTER PROMPT — Sistema de Premiación con Ruleta
## Stack: Next.js 14 (App Router) · Supabase · TypeScript · Tailwind CSS

---

## CONTEXTO DEL PROYECTO

Estás construyendo un **sistema de premiación con ruleta** para eventos presenciales.
El sistema tiene dos superficies completamente separadas:

1. **`/admin`** — Panel privado para el organizador del evento. Gestiona premios, stock e historial.
2. **`/ruleta`** — Página pública que abren los participantes al escanear un QR. Muestra la ruleta animada y entrega un premio al azar.

El proyecto se integra dentro de un proyecto Next.js ya existente como un módulo adicional.
La base de datos usa **Supabase** con tablas propias dentro del proyecto existente.

---

## ARQUITECTURA DE ARCHIVOS

```
app/
├── admin/
│   └── page.tsx                  ← Panel de administración (protegido)
├── ruleta/
│   └── page.tsx                  ← Página pública del participante
│
components/
├── premiacion/
│   ├── AdminPanel.tsx            ← Componente principal del admin
│   ├── PrizesTable.tsx           ← Tabla de premios con stock controls
│   ├── AddPrizeForm.tsx          ← Formulario para agregar premio
│   ├── StatsRow.tsx              ← Tarjetas de métricas (total, stock, ganadores)
│   ├── HistorialList.tsx         ← Lista de ganadores registrados
│   ├── WheelCanvas.tsx           ← Canvas de la ruleta con animación
│   ├── ResultCard.tsx            ← Tarjeta del premio ganado
│   └── QRDisplay.tsx             ← Generador y descarga del QR
│
lib/
├── premiacion/
│   ├── actions.ts                ← Server Actions de Next.js (sortear, CRUD premios)
│   └── types.ts                  ← Tipos TypeScript del módulo
│
supabase/
└── migrations/
    └── premiacion_schema.sql     ← Schema completo de las tablas
```

---

## SCHEMA DE SUPABASE

Crear en Supabase el siguiente schema. Las tablas usan el prefijo `prem_` para no colisionar con otras tablas del proyecto existente.

```sql
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
-- Usa FOR UPDATE para evitar race conditions si dos
-- participantes escanean el QR al mismo tiempo.
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
  -- Verificar que hay stock
  select sum(stock) into v_total
  from prem_premios
  where activo = true and stock > 0;

  if v_total is null or v_total = 0 then
    return json_build_object('error', 'sin_stock');
  end if;

  -- Número aleatorio entre 0 y total de stock
  v_rand := floor(random() * v_total);

  -- Seleccionar ganador por peso proporcional al stock
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

  -- Descontar stock
  update prem_premios
  set stock = stock - 1
  where id = v_premio.id;

  -- Registrar ganador
  insert into prem_ganadores (premio_id, premio_nombre, premio_emoji)
  values (v_premio.id, v_premio.nombre, v_premio.emoji)
  returning id into v_ganador_id;

  -- Retornar resultado
  return json_build_object(
    'id',     v_premio.id,
    'nombre', v_premio.nombre,
    'emoji',  v_premio.emoji,
    'ganador_id', v_ganador_id
  );
end;
$$;

-- ─────────────────────────────────────────
-- RLS (Row Level Security)
-- ─────────────────────────────────────────
alter table prem_premios  enable row level security;
alter table prem_ganadores enable row level security;

-- La RPC sortear_premio es SECURITY DEFINER, no necesita política.
-- La página pública (/ruleta) solo llama a la RPC, no accede a tablas directamente.
-- El admin usa el service_role key (server-side), no necesita políticas de lectura pública.

-- Política para lectura pública de premios activos (solo para mostrar los segmentos en la ruleta)
create policy "Premios activos visibles públicamente"
  on prem_premios for select
  using (activo = true and stock > 0);
```

---

## TIPOS TYPESCRIPT

```typescript
// lib/premiacion/types.ts

export interface Premio {
  id: string
  nombre: string
  emoji: string
  stock: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Ganador {
  id: string
  premio_id: string | null
  premio_nombre: string
  premio_emoji: string
  created_at: string
}

export interface SorteoResult {
  id: string
  nombre: string
  emoji: string
  ganador_id: string
  error?: 'sin_stock'
}

export interface StatsData {
  totalPremios: number
  premiosActivos: number
  stockTotal: number
  ganadoresTotales: number
}
```

---

## SERVER ACTIONS

```typescript
// lib/premiacion/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server' // ajustar al path del proyecto
import { revalidatePath } from 'next/cache'
import type { Premio, Ganador, SorteoResult, StatsData } from './types'

// ── Leer premios ──────────────────────────────────────────
export async function getPremios(): Promise<Premio[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prem_premios')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

// ── Agregar premio ────────────────────────────────────────
export async function addPremio(
  nombre: string,
  emoji: string,
  stock: number
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('prem_premios')
    .insert({ nombre, emoji, stock })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ── Actualizar stock ──────────────────────────────────────
export async function updateStock(id: string, nuevoStock: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('prem_premios')
    .update({ stock: Math.max(0, nuevoStock) })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ── Eliminar premio ───────────────────────────────────────
export async function deletePremio(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('prem_premios')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ── Leer historial ────────────────────────────────────────
export async function getGanadores(limit = 50): Promise<Ganador[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prem_ganadores')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data ?? []
}

// ── Stats ─────────────────────────────────────────────────
export async function getStats(): Promise<StatsData> {
  const supabase = createClient()
  const [premios, ganadores] = await Promise.all([
    supabase.from('prem_premios').select('stock, activo'),
    supabase.from('prem_ganadores').select('id', { count: 'exact', head: true }),
  ])
  const lista = premios.data ?? []
  return {
    totalPremios:     lista.length,
    premiosActivos:   lista.filter(p => p.activo && p.stock > 0).length,
    stockTotal:       lista.reduce((a, p) => a + p.stock, 0),
    ganadoresTotales: ganadores.count ?? 0,
  }
}

// ── SORTEO (llamada desde el cliente vía API route) ───────
// Esta acción la expone /api/premiacion/sortear/route.ts
// para que el cliente pueda llamarla después de la animación
export async function sortearPremio(): Promise<SorteoResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('sortear_premio')
  if (error) throw new Error(error.message)
  return data as SorteoResult
}
```

---

## API ROUTE — SORTEO

```typescript
// app/api/premiacion/sortear/route.ts
// El cliente llama a este endpoint al finalizar la animación de la ruleta.

import { NextResponse } from 'next/server'
import { sortearPremio } from '@/lib/premiacion/actions'

export async function POST() {
  try {
    const result = await sortearPremio()
    if (result.error === 'sin_stock') {
      return NextResponse.json({ error: 'sin_stock' }, { status: 409 })
    }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
```

---

## PÁGINA ADMIN — `/admin/page.tsx`

```typescript
// app/admin/page.tsx
// Server Component — carga los datos en el servidor.
// Agregar aquí la lógica de autenticación que ya uses en el proyecto.

import { getPremios, getGanadores, getStats } from '@/lib/premiacion/actions'
import { AdminPanel } from '@/components/premiacion/AdminPanel'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [premios, ganadores, stats] = await Promise.all([
    getPremios(),
    getGanadores(),
    getStats(),
  ])

  return (
    <AdminPanel
      initialPremios={premios}
      initialGanadores={ganadores}
      initialStats={stats}
    />
  )
}
```

### Comportamiento del AdminPanel

El componente `AdminPanel` debe:

- Mostrar **4 stat cards** en la parte superior: Total premios / Con stock / Stock total / Ganadores totales.
- Tener un botón **"Agregar premio"** que abre un formulario inline (no modal) con campos: nombre, emoji, stock inicial.
- Mostrar una **tabla de premios** con columnas: Premio (emoji + nombre) / Probabilidad (% calculado por peso de stock) / Stock (control +/−) / Estado (badge: Disponible / Poco stock si <5 / Sin stock) / Acciones (eliminar).
- Tener una sección de **Historial** con los últimos 50 ganadores en orden cronológico inverso, mostrando emoji, nombre del premio y hora.
- Tener un botón **"Ver QR"** que abre un modal o sidebar con el `QRDisplay`.
- Toda mutación de datos usa **Server Actions** — no usar fetch desde el cliente para CRUD.
- Revalidar la página con `revalidatePath('/admin')` tras cada acción.
- **No requiere polling** — los datos del admin son estáticos hasta que el usuario interactúa.

---

## PÁGINA RULETA — `/ruleta/page.tsx`

```typescript
// app/ruleta/page.tsx
// Server Component mínimo — solo carga la lista de premios activos para pintar la ruleta.
// El sorteo real ocurre en el cliente → llama a /api/premiacion/sortear DESPUÉS de la animación.

import { createClient } from '@/lib/supabase/server'
import { WheelPage } from '@/components/premiacion/WheelCanvas'

export const dynamic = 'force-dynamic'

export default async function RuletaPage() {
  const supabase = createClient()
  const { data: premios } = await supabase
    .from('prem_premios')
    .select('id, nombre, emoji, stock')
    .eq('activo', true)
    .gt('stock', 0)
    .order('created_at', { ascending: true })

  return <WheelPage premios={premios ?? []} />
}
```

### Comportamiento de WheelPage (Client Component)

```
'use client'
```

El componente `WheelPage` debe:

- Ser un **Client Component** (`'use client'`).
- Recibir `premios: { id, nombre, emoji, stock }[]` como prop del servidor.
- Pintar la ruleta en un `<canvas>` con segmentos de colores proporcionales al **stock** de cada premio (más stock = segmento más grande). No iguales.
- La **flecha indicadora** apunta siempre hacia arriba (posición 12 en reloj).
- Al presionar **"Girar"**:
  1. Animar la ruleta con easing `ease-out` durante ~4.5 segundos.
  2. Al terminar la animación, hacer `POST /api/premiacion/sortear`.
  3. La respuesta del servidor determina el **ganador real** (no el cliente).
  4. Mostrar la tarjeta del ganador con emoji, nombre y mensaje de canje.
- Si la API devuelve `{ error: 'sin_stock' }`, mostrar pantalla de "Premios agotados".
- El botón queda **deshabilitado** mientras gira o mientras espera respuesta de la API.
- Diseño **mobile-first** — la ruleta se adapta al ancho de pantalla.
- Sin navegación ni header — es una página limpia pensada para pantalla completa en el celular del participante.

**Importante sobre la lógica del sorteo:**
El cliente anima la ruleta en una dirección visualmente aleatoria. El ganador **real** lo decide el servidor (RPC `sortear_premio`). El cliente NO predice quién gana antes de consultar la API — solo muestra el resultado después. Esto evita trampas y asegura consistencia del stock.

---

## COMPONENTE QRDisplay

```typescript
// components/premiacion/QRDisplay.tsx
// Genera el QR del evento y permite descargarlo o imprimirlo.
```

El componente debe:

- Usar la librería **`qrcode`** (`npm install qrcode @types/qrcode`) para generar un QR real.
- La URL del QR apunta a `/ruleta` (o al dominio configurado en `.env`).
- Mostrar un campo editable para personalizar la URL.
- Botones: **Descargar PNG** / **Imprimir** / **Copiar URL**.
- Opcionalmente incluir logo de la empresa superpuesto en el centro del QR.

```typescript
// Ejemplo de generación con la librería qrcode:
import QRCode from 'qrcode'

const dataUrl = await QRCode.toDataURL(url, {
  width: 400,
  margin: 2,
  color: { dark: '#0D0D12', light: '#FFFFFF' },
})
```

---

## VARIABLES DE ENTORNO

Agregar al `.env.local` existente (no reemplazar las que ya existen):

```env
# Ya deberías tener estas del proyecto principal:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# URL pública de la página de ruleta (para el QR):
NEXT_PUBLIC_RULETA_URL=https://tudominio.com/ruleta
```

---

## PALETA VISUAL

El sistema usa el mismo tema oscuro del prototipo HTML, adaptado a Tailwind:

```
Fondo principal:    #0D0D12  → bg-[#0D0D12]
Superficie:         #16161E  → bg-[#16161E]
Superficie 2:       #1E1E28  → bg-[#1E1E28]
Borde:              rgba(255,255,255,0.08)
Acento:             #7C5CFC  → text-[#7C5CFC] / bg-[#7C5CFC]
Éxito:              #22C55E  → text-green-500
Advertencia:        #F59E0B  → text-amber-500
Peligro:            #EF4444  → text-red-500
```

Fuente: `Inter` (ya incluida en Next.js con `next/font/google`).

Colores de los segmentos de la ruleta:
```typescript
const WHEEL_COLORS = [
  '#7C5CFC','#0F6E56','#993C1D','#185FA5',
  '#854F0B','#3B6D11','#993556','#5F5E5A',
  '#A32D2D','#0C447C','#534AB7','#1D9E75',
]
```

---

## DEPENDENCIAS A INSTALAR

```bash
npm install qrcode @types/qrcode
```

El resto del stack (Next.js, Supabase, TypeScript, Tailwind) ya está en el proyecto.

---

## ORDEN DE CONSTRUCCIÓN SUGERIDO

1. Correr el SQL del schema en Supabase (crear tablas + RPC).
2. Crear `lib/premiacion/types.ts` y `lib/premiacion/actions.ts`.
3. Crear `app/api/premiacion/sortear/route.ts`.
4. Construir `WheelCanvas.tsx` (Client Component) con datos mock primero, luego conectar.
5. Construir `AdminPanel.tsx` con Server Actions.
6. Crear las páginas `app/admin/page.tsx` y `app/ruleta/page.tsx`.
7. Agregar `QRDisplay.tsx` con la URL desde `.env`.
8. Proteger `/admin` con el middleware de autenticación que ya uses en el proyecto.

---

## RESTRICCIONES Y NOTAS CLAVE

- **El sorteo SIEMPRE lo decide el servidor** (RPC `sortear_premio`). El cliente nunca calcula el ganador.
- **La RPC usa `FOR UPDATE`** para evitar que dos sorteos simultáneos descuenten el mismo premio.
- **No usar `useState` para el stock en el admin** — los datos vienen del servidor y se revalidan con `revalidatePath`.
- **La página `/ruleta` no tiene layout compartido con el admin** — son superficies completamente independientes.
- **El QR apunta a una URL fija** — no cambia por participante. El sistema es stateless en el lado del participante.
- Respetar el **`check (stock >= 0)`** en la tabla — Supabase nunca va a permitir stock negativo aunque haya un bug.