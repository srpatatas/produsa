# Contribuir a Produsa

Guía para colaborar en el proyecto usando un AI coding assistant (Gemini, Claude, ChatGPT, etc). No necesitás saber programar ni usar git — tu AI assistant se encarga.

## Setup inicial (una sola vez)

Abrí la app **Terminal** (Aplicaciones > Utilidades, o buscá "Terminal" en Spotlight con `Cmd + Espacio`).

Copiá y pegá cada comando de a uno, presionando Enter después de cada uno.

### 1. Instalar Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Si te pide la contraseña de tu Mac, escribila (no se ve mientras escribís, es normal) y presioná Enter.

### 2. Instalar Node.js y Git

```bash
brew install node git
```

### 3. Configurar Git

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### 4. Descargar el proyecto

```bash
cd ~/Documents
git clone https://github.com/srpatatas/produsa.git
cd produsa
```

### 5. Instalar dependencias

```bash
npm install
```

### 6. Configurar variables de entorno

Pedile a Fede el archivo `.env.local` y copialo a la carpeta `~/Documents/produsa/`.

**IMPORTANTE**: este archivo tiene contraseñas. No lo compartas ni lo subas a GitHub.

### 7. Verificar que funciona

```bash
npm run dev
```

Abrí http://localhost:3000 en el navegador. Deberías ver la pantalla de login.

Para parar el servidor: `Ctrl + C` en la terminal.

---

## Cómo hacer cambios con tu AI assistant

### Paso 1: Copiá este prompt inicial

Cada vez que quieras empezar un cambio nuevo, pegá esto en Gemini (o tu AI):

```
Estoy trabajando en un proyecto web llamado Produsa. Es un sitio de predicciones 
para la Copa del Mundo FIFA 2026.

Stack: Next.js 16, App Router, TypeScript, Tailwind CSS v4, tema oscuro, 
Neon Postgres, Vercel Blob para imágenes. UI en español argentino.

El código está en ~/Documents/produsa/

Antes de hacer cualquier cambio:
1. Creá una branch nueva desde main actualizado
2. Hacé los cambios
3. Verificá con npm test y npm run build
4. Commiteá y pusheá la branch

Dame los comandos de terminal que necesito copiar y pegar.

Quiero hacer lo siguiente: [DESCRIBÍ TU CAMBIO ACÁ]
```

### Paso 2: Compartí archivos si hace falta

Si el AI necesita ver código existente, copiá y pegá los archivos que te pida. Los más importantes:

| Qué | Dónde |
|-----|-------|
| Páginas | `src/app/*/page.tsx` |
| Componentes | `src/components/` |
| API routes | `src/app/api/` |
| Datos de partidos | `src/data/` |
| Helpers y DB | `src/lib/` |
| Tipos TypeScript | `src/types/index.ts` |
| Estilos globales | `src/app/globals.css` |

### Paso 3: Copiá los comandos que te da

Tu AI te va a dar comandos de terminal. Copialos y pegalos en la Terminal uno por uno. Ejemplo típico:

```bash
# El AI te va a dar algo como esto:
cd ~/Documents/produsa
git checkout main
git pull origin main
git checkout -b feat/mi-cambio

# Después te va a decir qué archivos editar
# Y al final:
npm test
npm run build
git add -A
git commit -m "Descripción del cambio"
git push origin feat/mi-cambio
```

### Paso 4: Avisá que está listo

Mandale un mensaje a Fede diciendo:
- Qué cambiaste
- El nombre de tu branch (ej: `feat/mi-cambio`)
- Fede va a revisarlo, mergearlo a main, y deployar a produsa.site

---

## Para volver a trabajar (las próximas veces)

```bash
cd ~/Documents/produsa
git checkout main
git pull origin main
npm install
npm run dev
```

Y empezá desde el Paso 1 de arriba.

---

## Estructura del proyecto

```
src/
  app/                    # Páginas y API routes
    api/                  # Backend endpoints
    admin/                # Panel de administración
    cambiar-pin/          # Mi cuenta (perfil + PIN)
    en-vivo/              # Vista de partidos en vivo
    fixture/              # Resultados y posiciones oficiales
    login/                # Pantalla de login/registro
    planillas/            # Predicciones L/E/V
    ranking/              # Tabla de posiciones
  components/             # Componentes React reutilizables
  context/                # React contexts (User, Planilla)
  data/                   # Datos estáticos (equipos, grupos, partidos)
  lib/                    # Utilidades (auth, DB, scoring, lock, results)
  types/                  # Interfaces TypeScript
  __tests__/              # Tests
scripts/                  # Scripts de setup y sync
public/                   # Imágenes, fuentes
```

## Reglas importantes

- **No editar `.env.local`** — contiene secrets
- **No editar `src/data/matches.ts`** sin consultar — datos oficiales de la FIFA
- **Siempre crear una branch** — nunca trabajar directo en `main`
- **Fede deploya** — no deployar sin avisarle antes

## Comandos de referencia

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Correr tests |
| `npm run build` | Verificar que compila |
| `Ctrl + C` | Parar el servidor |
