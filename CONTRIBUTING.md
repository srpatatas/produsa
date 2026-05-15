# Contribuir a Produsa

Guía paso a paso para colaborar en el proyecto. Pensada para macOS y para trabajar con un AI coding assistant (Gemini, Claude, etc).

## Setup inicial (una sola vez)

### 1. Instalar Homebrew

Abrí la app **Terminal** (Aplicaciones > Utilidades, o buscá "Terminal" en Spotlight con `Cmd + Espacio`).

Copiá y pegá este comando, presioná Enter:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Si te pide la contraseña de tu Mac, escribila (no se ve mientras escribís, es normal) y presioná Enter.

### 2. Instalar Node.js y Git

```bash
brew install node git
```

Verificá que se instalaron:

```bash
node --version
git --version
```

### 3. Configurar Git (tu nombre y email)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### 4. Clonar el repositorio

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

Pedile a Fede el archivo `.env.local` y copialo a la carpeta del proyecto:

```bash
# Fede te va a mandar el archivo por mensaje privado
# Copialo a ~/Documents/produsa/.env.local
```

**IMPORTANTE**: nunca subas `.env.local` a GitHub. Contiene contraseñas y API keys.

### 7. Instalar Vercel CLI

```bash
npm install -g vercel
vercel login
```

Se va a abrir el navegador para autenticarte. Después:

```bash
vercel link
```

Elegí el proyecto `produsa` cuando te pregunte.

### 8. Verificar que todo funciona

```bash
npm run dev
```

Abrí http://localhost:3000 en el navegador. Deberías ver la pantalla de login.

Para parar el servidor: `Ctrl + C` en la terminal.

---

## Flujo de trabajo con branches

**NUNCA trabajes directo en `main`.** Siempre creá una branch para tus cambios.

### Crear una branch nueva

```bash
# Asegurate de estar en main y actualizado
git checkout main
git pull origin main

# Creá tu branch con un nombre descriptivo
git checkout -b feat/nombre-del-cambio
```

Ejemplos de nombres de branch:
- `feat/agregar-notificaciones` — nueva funcionalidad
- `fix/ranking-avatar-roto` — arreglar un bug
- `style/mejorar-login-mobile` — cambios de diseño

### Hacer cambios

1. Hacé los cambios en tu editor (o con ayuda de Gemini)
2. Verificá que funciona:

```bash
npm run dev
# Revisá en http://localhost:3000

npm test
# Verificá que los tests pasen

npm run build
# Verificá que el build compila
```

### Guardar tus cambios (commit)

```bash
# Ver qué archivos cambiaron
git status

# Agregar todos los cambios
git add -A

# Crear el commit con un mensaje descriptivo
git commit -m "Descripción corta de lo que hiciste"
```

### Subir tu branch a GitHub

```bash
git push origin feat/nombre-del-cambio
```

### Crear un Pull Request

1. Andá a https://github.com/srpatatas/produsa
2. Vas a ver un banner amarillo que dice "Compare & pull request" — clickealo
3. Escribí una descripción de tus cambios
4. Clickeá "Create pull request"
5. Avisale a Fede para que lo revise y lo mergee

### Después de que se mergea

```bash
git checkout main
git pull origin main
# Tu branch ya se puede borrar
git branch -d feat/nombre-del-cambio
```

---

## Deployar a producción

Solo después de que tus cambios estén en `main`:

```bash
git checkout main
git pull origin main
vercel build --prod && vercel deploy --prebuilt --prod
```

---

## Trabajar con Gemini (o cualquier AI assistant)

Como Gemini no tiene acceso directo a los archivos, el flujo es:

### 1. Describí lo que querés hacer

Ej: "Quiero agregar un botón de compartir en la página de ranking"

### 2. Compartí el contexto necesario

Copiá y pegá los archivos relevantes. Los más importantes:

| Qué | Dónde |
|-----|-------|
| Páginas | `src/app/*/page.tsx` |
| Componentes | `src/components/` |
| API routes | `src/app/api/` |
| Datos de partidos | `src/data/` |
| Helpers y DB | `src/lib/` |
| Tipos TypeScript | `src/types/index.ts` |
| Estilos globales | `src/app/globals.css` |

**Tip**: Decile a Gemini la estructura del proyecto y el stack:
> "Este proyecto usa Next.js 16 con App Router, TypeScript, Tailwind CSS v4 con tema oscuro, y Neon Postgres como base de datos. El idioma de la UI es español argentino."

### 3. Aplicá los cambios

Copiá el código que te da Gemini a tu editor y guardá.

### 4. Testeá

```bash
npm test        # tests
npm run build   # verificar que compila
npm run dev     # probar en el navegador
```

### 5. Commiteá y subí

```bash
git add -A
git commit -m "Descripción del cambio"
git push origin feat/tu-branch
```

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
    fixture/              # Componentes del fixture
    home/                 # Countdown del próximo partido
    layout/               # Header, BottomNav, Shell, UserMenu
    live/                 # Scoreboard y predicciones en vivo
    planillas/            # Planillas, comodines, bonus
    teams/                # FlagImage, TeamBadge
    ui/                   # AvatarDisplay, ScoreInput
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
- **No editar `src/data/matches.ts`** sin consultar — son los datos oficiales de la FIFA
- **Siempre correr `npm test` antes de commitear**
- **Siempre correr `npm run build` antes de deployar**
- **Usar branches** — nunca pushear directo a `main`
- **Escribir en español argentino** — toda la UI está en español

## Comandos útiles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo (hot reload) |
| `npm run build` | Build de producción |
| `npm test` | Correr tests |
| `npm run lint` | Verificar código con ESLint |
| `vercel build --prod && vercel deploy --prebuilt --prod` | Deployar a produsa.site |
| `npm run sync-results` | Sincronizar resultados desde OpenFootball |
| `npm run setup-db` | Crear tablas en la base de datos |
