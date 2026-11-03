// Los usuarios de cliente pueden no tener email: entran con usuario y contraseña.
// Supabase Auth igual necesita uno, así que se arma uno interno en un dominio reservado (example.com)
// al que nunca llega un mail. En las pantallas se muestra como "sin email".

export const DOMINIO_SIN_EMAIL = "sin-email.example.com";
export const emailInterno = (usuario: string) => `${usuario}@${DOMINIO_SIN_EMAIL}`;
export const esEmailInterno = (email: string) => email.endsWith(`@${DOMINIO_SIN_EMAIL}`);
