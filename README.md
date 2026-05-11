# Produsa — Copa del Mundo 2026

Sitio de predicciones para la Copa del Mundo FIFA 2026. Predecí los resultados de los partidos y competí con tus amigos.

## Setup (primera vez)

Abrí la app **Terminal** (la encontrás en Aplicaciones > Utilidades, o buscando "Terminal" en Spotlight con `Cmd + Espacio`).

Copiá y pegá cada comando de a uno, presionando Enter después de cada uno.

### 1. Instalar Homebrew (gestor de paquetes para Mac)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Si te pide la contraseña de tu Mac, escribila (no se va a ver mientras escribís, es normal) y presioná Enter.

### 2. Instalar Node.js

```bash
brew install node
```

### 3. Verificar que se instaló bien

```bash
node --version
```

Deberías ver algo como `v26.0.0` (el número puede variar, lo importante es que no diga "command not found").

### 4. Descargar el proyecto

```bash
cd ~/Documents
```

```bash
git clone https://github.com/srpatatas/produsa.git
```

```bash
cd produsa
```

### 5. Instalar las dependencias del proyecto

```bash
npm install
```

Esto va a tardar un par de minutos. Esperá a que termine.

### 6. Levantar el sitio

```bash
npm run dev
```

### 7. Abrir en el navegador

Abrí Chrome (o el navegador que uses) y andá a:

```
http://localhost:3000
```

Para ver la versión mobile, hacé click derecho en la página > "Inspeccionar" > clickeá el icono de celular/tablet arriba a la izquierda (o `Cmd + Shift + M`).

### Para cerrar el servidor

Volvé a la Terminal y presioná `Ctrl + C`.

### Para volver a levantar el sitio (las próximas veces)

```bash
cd ~/Documents/produsa
```

```bash
npm run dev
```

Y abrí http://localhost:3000 en el navegador.

## Tests

```bash
npm test
```

## Stack técnico

- **Next.js 16** con App Router y TypeScript
- **Tailwind CSS v4** con tema personalizado FIFA 2026
- **Jest** + Testing Library para tests
- **localStorage** para persistir predicciones (sin backend por ahora)

## Estructura del proyecto

```
src/
  app/           # Páginas (grupos, ranking, en-vivo)
  components/    # Componentes React (layout, grupos, partidos, live, leaderboard)
  context/       # Contextos React (usuario, predicciones)
  data/          # Datos estáticos (equipos, grupos, partidos, scores mock)
  lib/           # Utilidades (scoring, localStorage, helpers)
  types/         # Interfaces TypeScript
  __tests__/     # Tests
```
