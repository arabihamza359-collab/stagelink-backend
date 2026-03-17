const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { profileSchema, offerSchema } = require('../validations/company.validation');

router.use(authenticate);
router.use(authorize('company'));

router.get('/profile', companyController.getProfile);
router.post('/profile', validate(profileSchema), companyController.updateProfile);
router.get('/dashboard', companyController.getDashboard);

router.post('/offers', validate(offerSchema), companyController.createOffer);
router.get('/offers', companyController.getOffers);
router.put('/offers/:id', validate(offerSchema), companyController.updateOffer);
router.delete('/offers/:id', companyController.deleteOffer);

router.get('/candidates', companyController.getCandidates);
router.post('/contact/:student_id', companyController.contactCandidate);
router.get('/subscription', companyController.getSubscription);

module.exports = router;
