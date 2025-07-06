const Video = require('../models/Video');
const YouTubeService = require('../services/youtubeService');
const GeminiService = require('../services/geminiService');
const { validationResult } = require('express-validator');

class VideoController {
  static async createSummary(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { youtubeUrl } = req.body;

      // Check if video already exists
      const existingVideo = await Video.findOne({ youtubeUrl });
      if (existingVideo) {
        return res.status(200).json({
          success: true,
          message: 'Video already summarized',
          data: existingVideo
        });
      }

      // Extract video ID and validate URL
      const videoId = YouTubeService.validateYouTubeUrl(youtubeUrl);

      // Get video information
      const videoInfo = await YouTubeService.getVideoInfo(videoId);

      // Create initial video record
      const video = new Video({
        youtubeUrl,
        videoId: videoInfo.videoId,
        title: videoInfo.title,
        channelName: videoInfo.channelName,
        duration: videoInfo.duration,
        status: 'processing'
      });

      await video.save();

      // Process video asynchronously
      VideoController.processVideoAsync(video._id, videoId, videoInfo);

      return res.status(202).json({
        success: true,
        message: 'Video processing started',
        data: {
          id: video._id,
          status: 'processing',
          videoId: videoInfo.videoId,
          title: videoInfo.title
        }
      });

    } catch (error) {
      console.error('Error creating summary:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create summary'
      });
    }
  }

  static async processVideoAsync(videoId, youtubeVideoId, videoInfo) {
    try {
      const startTime = Date.now();
      const geminiService = new GeminiService();

      // Get transcript
      const transcript = await YouTubeService.getTranscript(youtubeVideoId);
      const fullTranscript = transcript.map(segment => segment.text).join(' ');

      // Generate summary using Gemini
      const summary = await geminiService.generateSummary(
        videoInfo.title,
        videoInfo.channelName,
        fullTranscript
      );

      // Generate tags
      const tags = await geminiService.generateTags(
        videoInfo.title,
        videoInfo.channelName,
        summary
      );

      // Update video record
      const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
          transcript,
          summary,
          tags,
          status: 'completed',
          processingTime: Date.now() - startTime
        },
        { new: true }
      );

      console.log(`Video ${youtubeVideoId} processed successfully`);

    } catch (error) {
      console.error(`Error processing video ${youtubeVideoId}:`, error);
      
      // Update video status to failed
      await Video.findByIdAndUpdate(videoId, {
        status: 'failed'
      });
    }
  }

  static async getSummaries(req, res) {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      if (status) {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { channelName: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // Get videos with pagination
      const videos = await Video.find(query)
        .select('-transcript') // Exclude transcript to reduce response size
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await Video.countDocuments(query);

      return res.status(200).json({
        success: true,
        data: {
          videos,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting summaries:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get summaries'
      });
    }
  }

  static async getSummaryById(req, res) {
    try {
      const { id } = req.params;

      const video = await Video.findById(id);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video summary not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: video
      });

    } catch (error) {
      console.error('Error getting summary by ID:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get summary'
      });
    }
  }

  static async getSummaryStatus(req, res) {
    try {
      const { id } = req.params;

      const video = await Video.findById(id).select('status processingTime title');
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: video._id,
          status: video.status,
          processingTime: video.processingTime,
          title: video.title
        }
      });

    } catch (error) {
      console.error('Error getting summary status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get status'
      });
    }
  }

  static async deleteSummary(req, res) {
    try {
      const { id } = req.params;

      const video = await Video.findByIdAndDelete(id);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video summary not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Summary deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete summary'
      });
    }
  }
}

module.exports = VideoController;