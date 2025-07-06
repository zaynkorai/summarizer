const { YoutubeTranscript } = require('youtube-transcript');
const axios = require('axios');

class YouTubeService {
  static extractVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  static async getVideoInfo(videoId) {
    try {
      // Using YouTube Data API v3 to get video information
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }

      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`
      );

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video not found or not accessible');
      }

      const video = response.data.items[0];
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;

      // Convert duration from ISO 8601 format to seconds
      const duration = this.parseDuration(contentDetails.duration);

      return {
        videoId,
        title: snippet.title,
        channelName: snippet.channelTitle,
        duration,
        description: snippet.description,
        publishedAt: snippet.publishedAt
      };
    } catch (error) {
      throw new Error(`Failed to get video info: ${error.message}`);
    }
  }

  static parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (match[1] || '').replace('H', '') || 0;
    const minutes = (match[2] || '').replace('M', '') || 0;
    const seconds = (match[3] || '').replace('S', '') || 0;
    
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
  }

  static async getTranscript(videoId) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      
      return transcript.map(segment => ({
        text: segment.text,
        start: segment.offset / 1000, // Convert to seconds
        duration: segment.duration / 1000 // Convert to seconds
      }));
    } catch (error) {
      throw new Error(`Failed to get transcript: ${error.message}`);
    }
  }

  static async getFullTranscript(videoId) {
    try {
      const transcript = await this.getTranscript(videoId);
      return transcript.map(segment => segment.text).join(' ');
    } catch (error) {
      throw new Error(`Failed to get full transcript: ${error.message}`);
    }
  }

  static validateYouTubeUrl(url) {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    return videoId;
  }
}

module.exports = YouTubeService; 