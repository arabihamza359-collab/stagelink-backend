const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { uploadCV, uploadPhoto } = require('../middleware/upload.middleware');
const { profileSchema } = require('../validations/student.validation');

router.use(authenticate);
router.use(authorize('student'));

router.get('/profile', studentController.getProfile);
router.post('/profile', validate(profileSchema), studentController.updateProfile);
router.get('/dashboard', studentController.getDashboard);
router.get('/matches', studentController.getMatches);
router.post('/upload-cv', uploadCV.single('cv'), studentController.uploadCV);
router.post('/upload-photo', uploadPhoto.single('photo'), studentController.uploadPhoto);
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationRead);

module.exports = router;
