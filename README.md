# FloorPlan AI

Upload rough sketches, handwritten layouts, or old floor plans and regenerate them into professional CAD-style architectural layouts using OpenAI gpt-image-2 image-to-image transformation.

## How it works

1. **Upload** — Drop a floor plan image (JPG, PNG, WEBP, PDF) up to 10MB
2. **Transform** — gpt-image-2 directly regenerates the floor plan in a CAD style, guided by a reference style image (`public/reference/Reference.jpeg`)
3. **Download** — Save the regenerated blueprint as a PNG

**No intermediate text extraction.** The transformation is pure image-to-image — the uploaded floor plan directly guides the output geometry.

## Architecture

```
User Upload (image) ─┐
                     ├──→ gpt-image-2 (edit) ──→ Regenerated CAD Blueprint
Reference.jpeg ──────┘    input_fidelity: high
                           structure-preserving transformation
```

## Tech Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** components
- **Zustand** (state management)
- **Framer Motion** (animations)
- **OpenAI SDK** (gpt-image-2 image-to-image)

## Reference Style Image

Place your reference blueprint at `public/reference/Reference.jpeg`.

This image defines the **visual styling** (colors, line quality, typography, drafting aesthetics) while the uploaded floor plan defines the **geometry**. The model will never copy the reference's layout.

## Getting Started

### Prerequisites

- Node.js 20+
- An OpenAI API key with access to gpt-image-2

### Setup

```bash
cp .env.example .env.local
```

Edit `.env.local`:

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

Accepts a base64-encoded floor plan image with optional style/instruction parameters. Sends both the floor plan and reference style image to gpt-image-2 for direct image-to-image transformation.

**Request body:**

```json
{
  "image": "data:image/jpeg;base64,...",
  "style": "CAD Blueprint",
  "instructions": "Highlight emergency exits"
}
```

**Response:**

```json
{
  "success": true,
  "results": {
    "imageUrl": "data:image/png;base64,..."
  }
}
```

### Styles

- CAD Blueprint
- Modern Architectural
- Technical Drafting
- Pharmaceutical Layout
