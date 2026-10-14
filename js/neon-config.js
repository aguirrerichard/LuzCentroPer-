import { neon } from "https://esm.sh/@neondatabase/serverless";

// Cadena de conexión oficial de tu proyecto en Neon
export const sql = neon('postgresql://neondb_owner:npg_d2PbqhVtFc4T@ep-solitary-unit-b4p7m63j-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require');