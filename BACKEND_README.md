# ISRO Backend - README

## Overview

Backend service deployed on Render providing AI-powered satellite imagery analysis APIs for captioning, grounding, and visual question answering.

## Folder Structure

```
backend/
├── models/
│   ├── caption.py               # Image captioning model
│   ├── grounding.py             # Object detection & grounding
│   └── vqa.py                   # Visual question answering
│
├── routes/
│   ├── __init__.py
│   ├── caption.py               # /api/caption endpoint
│   ├── classify.py              # /api/classify endpoint
│   ├── ground.py                # /api/ground endpoint
│   └── vqa.py                   # /api/vqa endpoint
│
├── utils/
│   ├── __init__.py
│   ├── image_handler.py         # Image processing utilities
│   ├── validators.py            # Input validation
│   └── logger.py                # Logging configuration
│
├── config/
│   ├── __init__.py
│   └── settings.py              # Configuration settings
│
├── tests/
│   ├── test_caption.py
│   ├── test_grounding.py
│   └── test_vqa.py
│
├── app.py                       # Flask/FastAPI main application
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables
├── .gitignore
├── README.md
└── deploy.sh                    # Deployment script
```

## Tech Stack

- **Framework**: Flask / FastAPI (Python)
- **AI Models**: Google Generative AI (Gemini 2.5 Flash)
- **Image Processing**: OpenCV, Pillow, NumPy
- **HTTP Client**: Requests, HTTPX
- **Image Download**: Urllib
- **Deployment**: Render
- **Runtime**: Python 3.9+

## External APIs

### Google Generative AI (Gemini)

- **Purpose**: Core AI model for all three tasks
- **Model**: gemini-2.5-flash
- **API Key**: `GEMINI_API_KEY`
- **Rate Limiting**: Monitor API usage and quotas
- **Cost**: Pay-per-request pricing

### Image Input

- Accepts URLs (HTTP/HTTPS)
- Supported formats: JPEG, PNG, WebP, GIF
- Max size: Determined by Gemini limits
- Downloaded and converted to base64 for API

## Installation Setup

### Prerequisites

- Python 3.9 or higher
- pip package manager
- Google Gemini API key
- Render account (for deployment)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd backend
```

### Step 2: Create Virtual Environment

```bash
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Environment Variables

Create `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key
FLASK_ENV=development
DEBUG=True
```

### Step 5: Run Development Server

```bash
python app.py
```

Server runs on `http://localhost:5000`

### Step 6: Test API Endpoints

**Classification:**

```bash
curl -X POST http://localhost:5000/api/classify \
  -H "Content-Type: application/json" \
  -d '{"query": "Where is the person in the image?"}'
```

**Captioning:**

```bash
curl -X POST http://localhost:5000/api/caption \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/image.jpg", "prompt": "Describe this image"}'
```

**Grounding:**

```bash
curl -X POST http://localhost:5000/api/ground \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/image.jpg", "prompt": "Locate the building"}'
```

**VQA:**

```bash
curl -X POST http://localhost:5000/api/vqa \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/image.jpg", "question": "What color is the sky?"}'
```

## API Endpoints

### POST /api/classify

Classifies user query into one of three categories.

**Request:**

```json
{
  "query": "Where is the person?",
  "message": "optional alternative field"
}
```

**Response:**

```json
{
  "type": "grounding",
  "category": "grounding",
  "confidence": 0.95
}
```

**Category Types:**

- `captioning`: Image description task
- `grounding`: Object location task
- `vqa`: Question answering task

---

### POST /api/caption

Generates descriptive caption for image.

**Request:**

```json
{
  "image_url": "https://example.com/image.jpg",
  "prompt": "Describe this image",
  "imageUrl": "alternative field name"
}
```

**Response:**

```json
{
  "caption": "A satellite image showing urban development..."
}
```

---

### POST /api/ground

Detects object locations and returns normalized coordinates.

**Request:**

```json
{
  "image_url": "https://example.com/image.jpg",
  "prompt": "Locate the building"
}
```

**Response:**

```json
{
  "coordinates": [
    { "x": 0.25, "y": 0.3 },
    { "x": 0.75, "y": 0.3 },
    { "x": 0.75, "y": 0.8 },
    { "x": 0.25, "y": 0.8 }
  ],
  "description": "Building detected in center of image"
}
```

**Coordinate Format:**

- Four corners of bounding rectangle
- Normalized between 0 and 1
- Order: Top-left, Top-right, Bottom-right, Bottom-left

---

### POST /api/vqa

Answers questions about image content.

**Request:**

```json
{
  "image_url": "https://example.com/image.jpg",
  "question": "What color is the sky?",
  "prompt": "alternative field name"
}
```

**Response:**

```json
{
  "answer": "blue"
}
```

**Note:** Answers are one-word responses.

---

## Deployment on Render

### Step 1: Push to GitHub

```bash
git push origin main
```

### Step 2: Create Render Service

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name**: isro-backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`

### Step 3: Add Environment Variables

In Render dashboard:

- Add `GEMINI_API_KEY`
- Add `FLASK_ENV=production`

### Step 4: Deploy

Click "Deploy" and wait for build completion.

**Backend URL**: `https://backend-yx9z.onrender.com`

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Server/API error

**Error Response:**

```json
{
  "error": "imageUrl is required",
  "status": 400
}
```

## Performance Considerations

- Image processing cached where possible
- Base64 encoding optimized for large images
- Gemini API calls are rate-limited
- Consider implementing request queuing for high volume

## Security

- No sensitive data logged
- API key stored in environment variables
- Input validation on all endpoints
- CORS headers configured for frontend origin
