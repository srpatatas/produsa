# Produsa — Copa del Mundo 2026

Sitio de predicciones para la Copa del Mundo FIFA 2026. Predecí los resultados de los partidos y competí con tus amigos.

## Requisitos

- **Node.js** 20 o superior — instalalo con [Homebrew](https://brew.sh):
  ```bash
  brew install node
  ```
- **npm** (viene incluido con Node.js)

Verificá que estén instalados:
```bash
node --version   # v20+
npm --version    # v10+
```

## Instalación

```bash
git clone https://github.com/srpatatas/produsa.git
cd produsa
npm install
```

## Levantar el proyecto

```bash
npm run dev
```

Abrí http://localhost:3000 en el navegador. Para ver la versión mobile, usá las DevTools del navegador (`Cmd + Shift + M` en Chrome).

## Tests

```bash
npm test              # correr una vez
npm run test:watch    # correr en modo watch
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (hot reload) |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción (requiere build previo) |
| `npm test` | Correr suite de tests |
| `npm run lint` | Correr ESLint |

## Stack

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
