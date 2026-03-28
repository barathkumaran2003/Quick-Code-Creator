# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

### `artifacts/qr-generator` (`@workspace/qr-generator`)

Smart QR Generator Pro — a React + Vite SaaS web app for generating customizable QR codes.

**Features:**
- QR generation from text, URL, Google Maps, vCard contacts, and files (images, audio, video, documents)
- Large file uploads via GCS object storage (images ≤5MB, audio ≤10MB, video ≤20MB, docs ≤5MB); QR encodes the served URL, not raw base64
- Advanced customization: foreground/background colors, gradients, QR size, error correction, corner styles
- Smart center logo based on input type (auto-detected), with custom logo upload option
- Drag & drop file upload using react-dropzone with upload progress UI
- Download as PNG or SVG, copy to clipboard
- QR history saved in localStorage (no database)
- Search, filter by type, delete from history
- Settings page for default color/size preferences
- Dark/light mode toggle with localStorage persistence
- Smooth animations with framer-motion
- QR Error Boundary preventing RangeError crashes from qrcode.react

**Tech:** React, Vite, TypeScript, Tailwind CSS, qrcode.react, framer-motion, react-dropzone, lucide-react, @workspace/object-storage-web
**Route:** Served at `/`

### `artifacts/api-server` (`@workspace/api-server`)

Express API server for object storage operations.

**Routes (all under `/api`):**
- `GET /api/health` — health check
- `POST /api/storage/uploads/request-url` — get presigned GCS URL for file upload
- `GET /api/storage/objects/*` — serve uploaded objects from GCS (private bucket)
- `GET /api/storage/public-objects/*` — serve public objects from PUBLIC_OBJECT_SEARCH_PATHS

**Object Storage Flow:**
1. Frontend POSTs file metadata to `/api/storage/uploads/request-url`
2. API returns `{ uploadURL, objectPath }` — uploadURL is a GCS presigned PUT URL
3. Frontend PUTs the file directly to GCS via the presigned URL
4. QR code encodes: `${window.location.origin}/api/storage${objectPath}` — a short scannable URL

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (available but not used for QR app)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Object Storage**: Replit GCS Object Storage (bucket: `replit-objstore-a1d390dc-...`)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (object storage routes)
│   └── qr-generator/       # Smart QR Generator Pro (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── object-storage-web/ # useUpload hook + ObjectUploader component (Uppy-backed)
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml     # pnpm workspace catalog (react@19.1.0, etc.)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references (includes object-storage-web)
└── package.json            # Root package with pnpm.overrides for React 19
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from root** — `pnpm run typecheck`
- **`emitDeclarationOnly`** — no JS emit from tsc; bundling handled by esbuild/Vite
- **Project references** — `lib/object-storage-web` is in root tsconfig.json and qr-generator tsconfig.json

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `lib/object-storage-web` (`@workspace/object-storage-web`)

Frontend React library for object storage uploads.

- `useUpload(options)` — hook returning `{ uploadFile, isUploading, progress, error }`. Two-step: POST metadata → PUT to presigned URL.
- `ObjectUploader` — Uppy Dashboard component for drag-and-drop uploads
- `basePath` defaults to `/api/storage` but can be overridden

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen. Storage endpoints added:
- `POST /storage/uploads/request-url`
- `GET /storage/objects/{objectPath}`
- `GET /storage/public-objects/{filePath}`

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas. Includes `RequestUploadUrlBody`, `RequestUploadUrlResponse`.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks from OpenAPI spec.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `drizzle.config.ts` — requires `DATABASE_URL` (auto-provided by Replit)
- Dev: `pnpm --filter @workspace/db run push`

### `scripts` (`@workspace/scripts`)

Utility scripts. Run via `pnpm --filter @workspace/scripts run <script>`.

## Environment Variables / Secrets

- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` — GCS bucket ID for object storage
- `PRIVATE_OBJECT_DIR` — private directory path in bucket for uploaded objects
- `PUBLIC_OBJECT_SEARCH_PATHS` — comma-separated paths for public objects
- `SESSION_SECRET` — session signing secret
