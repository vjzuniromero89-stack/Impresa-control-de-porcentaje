# Configuración obligatoria en Vercel

Este ZIP no puede incluir claves privadas ni inventar las credenciales de un proyecto Supabase.

En Vercel > Project > Settings > Environment Variables agrega:

NEXT_PUBLIC_SUPABASE_URL = URL de tu proyecto Supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = Publishable Key de tu proyecto Supabase

Activa Production, Preview y Development y luego haz Redeploy.

## Base de datos
Ejecuta el archivo:
supabase/migrations/001_initial_schema.sql

La migración crea y carga:
- partners
- debts
- payments
- investments
- settings

Datos iniciales:
- Bordadora: $12,500; $1,600 pagados; saldo $10,900
- DTF: saldo $5,400
- Liquidación socios: saldo $4,700
- Deuda con Víctor: saldo $2,500
- Carlos inicia 20% y progresa a 40%
- Víctor inicia 80% y baja a 60%
- Los pagos de las dos deudas especiales se reconocen 50/50
