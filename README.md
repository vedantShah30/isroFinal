# ISRO SAC - Satellite Imagery Analysis Platform

A web-based platform for interpreting and analyzing satellite imagery using natural language interfaces. Built for the Space Applications Centre (SAC), ISRO.

## Features

### 🛰️ Core Capabilities

1. **Image Captioning**
   - Generate comprehensive descriptions of satellite imagery
   - Supports natural color composite (RGB) images
   - Expert-level caption generation

2. **Object Grounding**
   - Localize objects within satellite images using natural language queries
   - Oriented bounding box visualization
   - High precision object detection

3. **Visual Question Answering (VQA)**
   - Answer geometric and semantic attribute questions
   - Supports binary (yes/no), numeric, and string answers
   - Context-aware responses

###  Technical Specifications

- **Image Format**: PNG, JPG (L1/L2 processed, 0-255 value range)
- **Resolution Support**: 0.5m to 10m per pixel
- **Maximum Size**: 2K × 2K pixels
- **Color Composite**: RGB natural color

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd inter-mid
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your model API endpoints:
```env
CAPTIONING_API_URL=https://your-api.com/caption
GROUNDING_API_URL=https://your-api.com/ground
VQA_API_URL=https://your-api.com/vqa
MODEL_API_KEY=your-api-key
```

5. Run the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
inter-mid/
├── app/
│   ├── components/
│   │   ├── Header.js           # Navigation header
│   │   ├── ImageUploader.js    # Image upload interface
│   │   ├── QueryInterface.js   # Analysis mode selection
│   │   ├── ResultsDisplay.js   # Results visualization
│   │   └── Scene3D.js          # 3D background
│   ├── api/
│   │   ├── model1/route.js     # Captioning API
│   │   ├── model2/route.js     # Grounding API
│   │   └── model3/route.js     # VQA API
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── public/
├── .env.example
├── package.json
└── README.md
```

## API Integration

### Captioning Endpoint
```javascript
POST /api/model1
FormData: { image: File }
Response: { caption: string, confidence: number }
```

### Grounding Endpoint
```javascript
POST /api/model2
FormData: { image: File, query: string }
Response: { boundingBoxes: Array, count: number }
```

### VQA Endpoint
```javascript
POST /api/model3
FormData: { image: File, question: string }
Response: { answer: string, answerType: 'binary'|'numeric'|'string', confidence: number }
```

## Evaluation Metrics

- **Captioning**: BLEU Score with expert annotations
- **Grounding**: Intersection-over-Union (IoU) @ 0.7
- **VQA**: Type-specific accuracy (binary, numeric, attribute)

## Technology Stack

- **Framework**: Next.js 16
- **UI**: React 19, Tailwind CSS 4
- **3D Graphics**: React Three Fiber, Three.js
- **Animations**: Framer Motion
- **API**: Next.js API Routes

## Deployment

For production deployment:

```bash
npm run build
npm start
```

## Development Guidelines

- Follow ISRO design guidelines
- Maintain anonymous interface (no institute names)
- Use professional UI elements (SVG icons, no emojis)
- Ensure responsive design
- Optimize for performance

## References

- VRSBench: https://vrsbench.github.io/
- ISRO SAC Official Website

## License

Property of Space Applications Centre (SAC), ISRO

---

**Note**: This is a prototype platform for the Inter IIT Tech Meet competition. Update API endpoints before production use.
