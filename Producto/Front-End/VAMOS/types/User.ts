// app/components/Types/User.ts
//
// Tipo del usuario tal como lo devuelve la API Django.
// Ajusta los campos si tu modelo de Django tiene otros nombres.

export type User = {
  id: string;
  email: string;
  nombre: string;
  fecha_nacimiento: string;   // formato YYYY-MM-DD; el backend valida +18
  fecha_registro: string;     // ISO timestamp
  activo: boolean;
};

// Lo que envía el formulario de registro al backend.
// Es un subconjunto de User más la contraseña.
export type RegisterPayload = {
  email: string;
  password: string;
  nombre: string;
  fecha_nacimiento: string;
};

// Respuesta del endpoint de login con JWT.
export type LoginResponse = {
  access: string;
  refresh: string;
};