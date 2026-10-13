# AdopTree

Aplicación de portafolio sobre adopción y seguimiento de árboles en Bucaramanga. El frontend usa React y la API usa NestJS. Las especies, regiones, fotografías e historias iniciales son ilustrativas. El recorrido de USD 5 no procesa pagos ni registra siembras reales.

El mapa usa [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) y los mapas públicos de [OpenFreeMap](https://openfreemap.org/). Necesita Internet en el navegador; si no puede cargar, aparece un mapa de respaldo. Los contornos y marcadores son referencias visuales, no límites autorizados ni ubicaciones exactas de plantación.

## Desarrollo local

Necesitas Node.js 24 y pnpm 12. Desde la raíz del repositorio:

```bash
pnpm --dir apps/api install --no-lockfile
pnpm --dir apps/web install --no-lockfile
pnpm dev
```

Abre `http://localhost:5173`. El comando inicia NestJS en el puerto 3000 y Vite en el 5173. Vite envía las peticiones `/api` a NestJS. Para detener ambos procesos, usa `Ctrl+C`.

Si quieres iniciarlos por separado, ejecuta `pnpm --dir apps/api dev` y `pnpm --dir apps/web dev` en dos terminales.

Para comprobar los cambios:

```bash
pnpm test
pnpm build
```

## Ejecutar una compilación de producción localmente

Después de instalar las dependencias y ejecutar `pnpm build`:

```bash
pnpm start
```

Abre `http://localhost:3000`. NestJS sirve la web compilada y la API desde el mismo origen. `http://localhost:3000/api/health` debe responder `{"status":"ok"}`. Puedes cambiar el puerto con `PORT=8080 pnpm start`.

## Producción con Docker

El `Dockerfile` de la raíz construye el frontend y la API en una sola imagen. Con Docker instalado:

```bash
docker build -t adoptree:latest .
docker run --rm -p 3000:3000 adoptree:latest
```

Comprueba `http://localhost:3000` y `http://localhost:3000/api/health`. El servidor escucha en `0.0.0.0` y toma el puerto de `PORT`; si no se define, usa 3000. La imagen no necesita base de datos ni variables secretas.

## Desplegar en Railway

1. Sube este repositorio a GitHub y crea un proyecto en Railway con **New Project → Deploy from GitHub repo**.
2. Selecciona el repositorio y deja la raíz como directorio del servicio. Railway [detecta el `Dockerfile` de la raíz](https://docs.railway.com/builds/dockerfiles); no hace falta configurar comandos de build o inicio.
3. En la configuración del servicio, establece **Healthcheck Path** en `/api/health`. Railway comprobará que la nueva versión responde antes de enviarle tráfico. Consulta la [guía de healthchecks](https://docs.railway.com/deployments/healthchecks).
4. En **Networking → Public Networking**, selecciona **Generate Domain**. Abre el dominio generado y comprueba `https://TU-DOMINIO/api/health`. Railway explica esta opción en [Public Networking](https://docs.railway.com/networking/public-networking).

La API usa el `PORT` proporcionado por Railway. Frontend y API se sirven desde el mismo dominio. Los cambios que subas a la rama conectada disparan una nueva compilación de la imagen.

## Desplegar frontend y API por separado en Vercel

La API NestJS puede publicarse como un proyecto Vercel independiente mediante la función `apps/api/api/[...path].ts`.

1. Crea un proyecto Vercel para el frontend con **Root Directory** `apps/web` y el comando de build `pnpm build`.
2. Crea otro proyecto con **Root Directory** `apps/api`, **Framework Preset** `Other` y el comando de build `pnpm build`. Deja el directorio de salida sin configurar para que Vercel publique la función de `api/`.
3. Cuando Vercel asigne un dominio al proyecto de API, establece en el proyecto del frontend la variable `VITE_API_BASE_URL` con el origen HTTPS de ese dominio, sin una ruta final `/api` ni una barra al final (por ejemplo, `https://<dominio-real-de-la-api>`).
4. Redespliega el frontend después de configurar la variable.

Sin `VITE_API_BASE_URL`, el frontend usa rutas relativas `/api/...`; esto conserva el proxy local de Vite y el despliegue en el que frontend y API comparten origen.

## Desplegar en una VPS o EC2

Estos pasos sirven para una VPS Linux con acceso SSH y Docker. Si usas Ubuntu, instala Docker Engine siguiendo la [guía oficial de Docker](https://docs.docker.com/engine/install/ubuntu/). En EC2, permite tráfico entrante a los puertos 80 y 443 en el grupo de seguridad; limita SSH a tu IP. Los [grupos de seguridad](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html) controlan ese acceso.

1. Apunta un registro DNS `A` de tu dominio a la IP pública de la VPS.
2. Conéctate por SSH, clona el repositorio y ejecuta, desde su raíz:

```bash
git clone https://github.com/USUARIO/adoptree.git
cd adoptree
sudo docker build -t adoptree:latest .
sudo docker run -d --name adoptree --restart unless-stopped -p 127.0.0.1:3000:3000 adoptree:latest
curl -fsS http://127.0.0.1:3000/api/health
```

Sustituye la dirección del repositorio por la tuya. La aplicación queda disponible solo en el puerto local de la VPS; un proxy publicará el sitio con HTTPS.

3. Instala [Caddy](https://caddyserver.com/docs/install), abre `/etc/caddy/Caddyfile` y configura tu dominio:

```caddyfile
arboles.ejemplo.com {
    reverse_proxy 127.0.0.1:3000
}
```

Reemplaza `arboles.ejemplo.com` por tu dominio y aplica la configuración:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Con el DNS y los puertos 80/443 disponibles, [Caddy gestiona HTTPS](https://caddyserver.com/docs/automatic-https) y reenvía las peticiones a la aplicación. Comprueba `https://arboles.ejemplo.com/api/health` y después la página principal.

Para publicar una versión nueva, desde la carpeta del repositorio en la VPS:

```bash
git pull
sudo docker build -t adoptree:latest .
sudo docker rm -f adoptree
sudo docker run -d --name adoptree --restart unless-stopped -p 127.0.0.1:3000:3000 adoptree:latest
```

Para ver errores de inicio: `sudo docker logs --tail 100 adoptree`. Si no tienes dominio todavía, puedes probar temporalmente con `-p 80:3000` y `http://IP_PUBLICA`; esa prueba no ofrece HTTPS.

## Datos y API

La vista previa de adopción se guarda en `localStorage` del navegador. Un despliegue nuevo no necesita migraciones, pero esos datos no se comparten entre dispositivos. El catálogo y las fichas ilustrativas se editan en `apps/api/src/data.ts`.

- `GET /api/health`: estado del servicio.
- `GET /api/catalog`: especies y zonas.
- `GET /api/trees`: fichas ilustrativas.
- `GET /api/trees/:id`: ficha por identificador.
- `POST /api/adoptions/preview`: prepara un recorrido con `speciesId`, `zoneId` y `name`; devuelve `charged: false` y `plantedAt: null`.

La interfaz no representa alianzas confirmadas, ubicaciones de siembra exactas ni cobros reales. Para operar con personas y árboles reales harán falta acuerdos con las entidades responsables, almacenamiento duradero, autenticación y pagos verificados.
