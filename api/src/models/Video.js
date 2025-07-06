const mongoose = require('mongoose');

const transcriptSegmentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  start: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  }
}, { _id: false });

const videoSchema = new mongoose.Schema({
  youtubeUrl: {
    type: String,
    required: [true, 'YouTube URL is required'],
    unique: true
  },
  videoId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  transcript: [transcriptSegmentSchema],
  summary: {
    executive: {
      type: String,
      required: true
    },
    keyPoints: [{
      type: String,
      required: true
    }],
    detailedSummary: {
      type: String,
      required: true
    }
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  processingTime: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
videoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
videoSchema.index({ videoId: 1 });
videoSchema.index({ status: 1 });
videoSchema.index({ createdAt: -1 });

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;