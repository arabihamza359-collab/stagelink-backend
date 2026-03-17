const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/stats', adminController.getStats);
router.get('/students', adminController.getStudents);
router.get('/companies', adminController.getCompanies);
router.put('/users/:id/activate', adminController.toggleUserActivation);
router.put('/testimonials/:id/approve', adminController.approveTestimonial);
router.get('/matches', adminController.getMatches);
router.post('/send-notification', adminController.sendBulkNotification);

module.exports = router;
