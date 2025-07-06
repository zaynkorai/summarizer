const express = require('express');
const { body, param, query } = require('express-validator');
const VideoController = require('../controllers/videoController');

const router = express.Router();

// Validation middleware
const validateYouTubeUrl = [
  body('youtubeUrl')
    .notEmpty()
    .withMessage('YouTube URL is required')
    .isURL()
    .withMessage('Must be a valid URL')
    .custom((value) => {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      if (!youtubeRegex.test(value)) {
        throw new Error('Must be a valid YouTube URL');
      }
      return true;
    })
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['processing', 'completed', 'failed'])
    .withMessage('Status must be processing, completed, or failed')
];

const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid video ID format')
];

// Routes
router.post('/summarize', validateYouTubeUrl, VideoController.createSummary);

router.get('/summaries', validatePagination, VideoController.getSummaries);

router.get('/summary/:id', validateId, VideoController.getSummaryById);

router.get('/summary/:id/status', validateId, VideoController.getSummaryStatus);

router.delete('/summary/:id', validateId, VideoController.deleteSummary);

module.exports = router;