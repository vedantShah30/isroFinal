# ISRO Frontend - README

## Overview

A Next.js-based web application for satellite imagery analysis using AI models for captioning, grounding, and visual question answering (VQA).

## Folder Structure

```
app/
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.js                 # NextAuth authentication handler
│   ├── chats/
│   │   ├── [id]/
│   │   │   ├── get/
│   │   │   │   └── route.js            # Fetch specific chat
│   │   │   └── pdf/                     # PDF export functionality
│   │   ├── create/
│   │   │   └── route.js                # Create new chat
│   │   ├── delete/
│   │   │   └── route.js                # Delete chat
│   │   ├── get/
│   │   │   └── route.js                # Fetch all chats
│   │   ├── share/                       # Share chat functionality
│   │   ├── update/
│   │   │   └── route.js                # Update chat
│   │   └── update-title/
│   │       └── route.js                # Update chat title
│   ├── models/
│   │   ├── caption/
│   │   │   └── route.js                # Caption API proxy
│   │   ├── classify/
│   │   │   └── route.js                # Classify API proxy
│   │   ├── ground/
│   │   │   └── route.js                # Ground API proxy
│   │   └── vqa/
│   │       └── route.js                # VQA API proxy
│   ├── routines/
│   │   ├── create/
│   │   │   └── route.js                # Create routine
│   │   └── get/
│   │       └── route.js                # Fetch routines
│   ├── testimage/
│   │   └── route.js
│   ├── upload/
│   │   └── route.js                    # Image upload handler
│   └── verify-password/
│       └── route.js                    # Password verification
│
├── chat/
│   ├── page.js                          # Chat list page
│   └── [id]/
│       └── page.js                      # Chat detail page (main app)
│
├── components/
│   ├── AppFooter.js
│   ├── AuthProvider.js                  # NextAuth provider wrapper
│   ├── ChatListItem.js                  # Individual chat item
│   ├── ChatSection.js                   # Chat history display
│   ├── Header.js
│   ├── ImageCropperModal.js             # Image cropping tool
│   ├── ImageUploader.js                 # Image upload component
│   ├── Loader.js                        # Loading spinner
│   ├── Promptbox.js                     # Input prompt box
│   ├── ResultsDisplay.js                # Display AI results
│   ├── RoutinesModal.js                 # Routines selection modal
│   ├── SaveRoutineModal.js              # Save routine modal
│   ├── Scene3D.js                       # 3D background scene
│   ├── Sidebar.js                       # Navigation sidebar
│   ├── Toast.js                         # Toast notifications
│   └── UploadCard.js                    # Image upload card
│
├── dashboard/
│   └── page.js
│
├── image/
│   └── page.js                          # Image upload/selection page
│
├── loader/
│   └── page.js
│
├── test/
│   └── page.js
│
├── test2/
│   └── page.js
│
├── ui/
│   └── page.jsx
│
├── globals.css                          # Global styles
├── layout.js                            # Root layout
└── page.js                              # Home page
│
lib/
├── mongodb.js                           # MongoDB connection
│
models/
├── Chat.js                              # Chat schema
├── Routine.js                           # Routine schema
└── User.js                              # User schema
│
public/
└── pdfkit/
    └── js/
        └── data/
│
middleware.js                            # Password protection middleware

.env.local                               # Environment variables
eslint.config.mjs
jsconfig.json
next.config.mjs
package.json
postcss.config.js
tailwind.config.js
```

## Tech Stack

- **Frontend Framework**: Next.js 16.0.3
- **UI Framework**: React 19.2.0
- **Styling**: Tailwind CSS 4
- **Authentication**: NextAuth 4.24.13
- **Animation**: Framer Motion 12.23.24
- **3D Graphics**: Three.js 0.181.2 & React Three Fiber 9.4.0
- **Image Processing**: React Image Crop 11.0.10, React Cropper 2.3.3
- **Database ORM**: Mongoose 9.0.0
- **AI Integration**: Google Generative AI SDK
- **Cloud Storage**: Cloudinary 2.8.0
- **Icons**: Lucide React 0.555.0

## External APIs

### Google OAuth

- **Purpose**: User authentication
- **Implementation**: NextAuth.js
- **Configuration**:
  - `NEXTAUTH_URL`: Application URL
  - `NEXTAUTH_SECRET`: Secret key for session encryption
  - `GOOGLE_CLIENT_ID`: Google OAuth client ID
  - `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### Backend AI Models

- **Classify API**: Determine query type (Captioning/Grounding/VQA)
- **Caption API**: Generate image descriptions
- **Ground API**: Detect object locations with coordinates
- **VQA API**: Answer questions about images

### Cloudinary

- **Purpose**: Image hosting and CDN
- **Configuration**: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

### MongoDB

- **Purpose**: Data persistence
- **Configuration**: `MONGODB_URI`

## Installation Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB instance
- Google OAuth credentials
- Cloudinary account
- Environment variables configured

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd inter-mid
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Variables

Create `.env.local` file in root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name

# Gemini API (for backend models)
GEMINI_API_KEY=your_gemini_api_key

# Password Protection
NEXT_PUBLIC_PASSWORD_PROTECTION=true
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
```

### Step 4: Database Setup

```bash
npm run dev
```

The application will automatically connect to MongoDB on first run.

### Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in browser.

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Key Features

- **Image Upload**: Upload satellite imagery via Cloudinary
- **AI Analysis**:
  - Image Captioning
  - Object Grounding with Coordinates
  - Visual Question Answering
- **Auto-Classification**: Automatically classifies query type
- **Routines**: Save and reuse analysis workflows
- **Chat History**: Persistent chat with MongoDB
- **Password Protection**: Team access control with password
- **Export**: Save analysis results
- **Responsive Design**: Works on all devices

## Authentication Flow

1. User visits application
2. Redirected to Google OAuth login (if not authenticated)
3. After successful authentication, NextAuth creates session
4. Session stored in MongoDB
5. User can access protected routes
