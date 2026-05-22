# FloorPlan AI

Upload rough sketches, handwritten layouts, or old floor plans and regenerate them into professional CAD-style architectural layouts using OpenAI vision (GPT-4o) and generation (gpt-image-1).

## How it works

1. **Upload** — Drop a floor plan image (JPG, PNG, WEBP, PDF) up to 10MB
2. **Analyze** — GPT-4o extracts the exact architectural structure (rooms, walls, doors, labels, dimensions)
3. **Generate** — gpt-image-1 produces a clean CAD-style blueprint preserving the original geometry
4. **Download** — Save the regenerated blueprint as a PNG

## Tech Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** components
- **Zustand** (state management)
- **Framer Motion** (animations)
- **OpenAI SDK** (GPT-4o vision + gpt-image-1 generation)

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key with access to GPT-4o and gpt-image-1

### Setup

```bash
# Copy environment variables
cp .env.example .env.local
```

Edit `.env.local` and set your key:

```
OPENAI_API_KEY="sk-..."
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Scripts

| Command         | Description           |
| --------------- | --------------------- |
| `npm run dev`   | Start dev server      |
| `npm run build` | Production build      |
| `npm run start` | Start production server |
| `npm run lint`  | Run ESLint            |

## API

### `POST /api/generate`

Accepts a base64-encoded image with optional style/instruction parameters and returns a regenerated CAD blueprint.

**Request body:**

```json
{
  "image": "data:image/jpeg;base64,...",
  "style": "CAD Blueprint",
  "instructions": "Highlight emergency exits",
  "preserveStructure": true,
  "enhanceLabels": true
}
```

**Response:**

```json
{
  "success": true,
  "results": {
    "imageUrl": "data:image/png;base64,...",
    "description": "..."
  }
}
```

### Styles

- CAD Blueprint
- Modern Architectural
- Technical Drafting
- Pharmaceutical Layout
