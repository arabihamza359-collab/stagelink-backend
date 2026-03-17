const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { subscribeSchema, cvPremiumSchema } = require('../validations/payments.validation');

router.use(authenticate);

router.post('/subscribe', authorize('company'), validate(subscribeSchema), paymentsController.subscribe);
router.post('/cv-premium', authorize('student'), validate(cvPremiumSchema), paymentsController.requestCvPremium);
router.get('/history', paymentsController.getHistory);

module.exports = router;
