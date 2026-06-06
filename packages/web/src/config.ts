// Si existe la variable (desarrollo local), usa la IP completa.
// Si NO existe (producción en Docker), queda vacío para usar URL relativa.
const baseURL = import.meta.env.VITE_API_URL || '';

// Exportamos la constante para que toda la app la pueda usar
export const API_URL = `${baseURL}/api/v1`;