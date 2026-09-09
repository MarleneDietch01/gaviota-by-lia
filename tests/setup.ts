import { config } from 'dotenv';
import WebSocket from 'ws';

// Las pruebas de integración escriben en una base real, así que su destino
// se declara aparte: `.env.test.local` (ignorado por git) tiene prioridad
// sobre `.env.local`, que en un árbol normal apunta a PRODUCCIÓN. dotenv no
// pisa variables ya definidas, así que el primero que se carga manda.
config({ path: '.env.test.local' });
config({ path: '.env.local' });
config({ path: '.env' });

// @supabase/supabase-js inicializa su cliente de realtime en el constructor y
// exige un WebSocket global. Node solo lo trae de serie a partir de la v22
// (este proyecto fija `engines.node >=20.9.0`), así que se aporta aquí. Las
// pruebas nunca abren un canal de realtime; solo necesitan que el constructor
// no reviente.
if (!(globalThis as { WebSocket?: unknown }).WebSocket) {
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}
