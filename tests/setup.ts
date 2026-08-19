import { config } from 'dotenv';

// Carga .env.local para las pruebas de integración contra Supabase.
config({ path: '.env.local' });
config({ path: '.env' });
