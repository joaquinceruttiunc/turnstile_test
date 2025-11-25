# turnstile_test

Proyecto de prueba para integrar Cloudflare Turnstile (widget en cliente + verificación en servidor).

Configuración rápida

Ambas se obtienen al crear el widget:

- Site key (cliente).
- Secret key (servidor): guardarla en la variable de entorno `TURNSTILE_SECRET` y no comprometerla en el repositorio.

Cómo ejecutar localmente

1. Instala dependencias:

```bash
npm install
```

2. Exporta la secret en tu entorno:

```bash
export TURNSTILE_SECRET="..."
```

3. Iniciar la app:

```bash
npm start
```

La app quedará disponible en http://localhost:3000

Despliegue en Render

1. Crea un nuevo servicio Web desde tu repo.
2. En Environment, añade la variable `TURNSTILE_SECRET` con tu secret (valor: la secret key real).
3. Comando de start: `npm start` (por defecto el puerto lo toma Render vía `PORT` env var).

Notas

- No subas la `TURNSTILE_SECRET` al repositorio.
- El servidor expone `/verify` que recibe JSON { token } y hace POST a Cloudflare para verificar.
