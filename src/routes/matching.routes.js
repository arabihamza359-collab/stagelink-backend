const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matching.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

// Admin manual trigger
router.post('/run', authorize('admin'), matchingController.runMatching);

// Insights
router.get('/suggestions/:student_id', authorize('student', 'admin'), matchingController.getSuggestionsForStudent);
router.get('/candidates/:offer_id', authorize('company', 'admin'), matchingController.getCandidatesForOffer);

module.exports = router;
