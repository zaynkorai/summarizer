# YouTube Summarizer API

A powerful Express.js API that extracts YouTube video transcripts and generates comprehensive summaries using Google's Gemini AI.

## Features

- 🎥 YouTube video transcript extraction
- 🤖 AI-powered summarization using Gemini
- 📊 Comprehensive video analysis (executive summary, key points, detailed summary)
- 🏷️ Automatic tag generation
- 📝 Full transcript storage
- 🔍 Search and filter capabilities
- 📄 Pagination support
- ⚡ Asynchronous processing
- 🛡️ Rate limiting and security

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini AI
- **YouTube**: YouTube Data API v3
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- YouTube Data API v3 key
- Google Gemini AI API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/youtube-summarizer
   YOUTUBE_API_KEY=your_youtube_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   FRONTEND_URL=http://localhost:3001
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### 1. Create Video Summary
**POST** `/api/videos/summarize`

Request body:
```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

Response:
```json
{
  "success": true,
  "message": "Video processing started",
  "data": {
    "id": "video_id",
    "status": "processing",
    "videoId": "youtube_video_id",
    "title": "Video Title"
  }
}
```

### 2. Get All Summaries
**GET** `/api/videos/summaries`

Query parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `status` (optional): Filter by status (processing/completed/failed)
- `search` (optional): Search in title, channel, or tags

Response:
```json
{
  "success": true,
  "data": {
    "videos": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 3. Get Summary by ID
**GET** `/api/videos/summary/:id`

Response:
```json
{
  "success": true,
  "data": {
    "_id": "video_id",
    "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
    "videoId": "youtube_video_id",
    "title": "Video Title",
    "channelName": "Channel Name",
    "duration": 3600,
    "transcript": [...],
    "summary": {
      "executive": "Executive summary...",
      "keyPoints": ["Point 1", "Point 2", ...],
      "detailedSummary": "Detailed summary..."
    },
    "tags": ["tag1", "tag2", ...],
    "status": "completed",
    "processingTime": 5000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Get Summary Status
**GET** `/api/videos/summary/:id/status`

Response:
```json
{
  "success": true,
  "data": {
    "id": "video_id",
    "status": "completed",
    "processingTime": 5000,
    "title": "Video Title"
  }
}
```

### 5. Delete Summary
**DELETE** `/api/videos/summary/:id`

Response:
```json
{
  "success": true,
  "message": "Summary deleted successfully"
}
```

### 6. Health Check
**GET** `/api/health`

Response:
```json
{
  "success": true,
  "message": "YouTube Summarizer API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Video Status

- **processing**: Video is being processed (transcript extraction and summarization)
- **completed**: Video has been successfully processed
- **failed**: Processing failed (check logs for details)

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Rate limit headers included in responses

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment | No (default: development) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | Yes |
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | No |

## Getting API Keys

### YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add the key to your `.env` file

### Google Gemini AI
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the key to your `.env` file

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests (if available)
npm test
```

## Production

```bash
# Install dependencies
npm install --production

# Start production server
npm start
```

## Docker

```bash
# Build image
docker build -t youtube-summarizer-api .

# Run container
docker run -p 3000:3000 --env-file .env youtube-summarizer-api
```

## License

ISC
