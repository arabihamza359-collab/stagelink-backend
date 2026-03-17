const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { sendMessageSchema } = require('../validations/messages.validation');

router.use(authenticate);

router.post('/send', validate(sendMessageSchema), messagesController.sendMessage);
router.get('/conversations', messagesController.getConversations);
router.get('/conversation/:match_id', messagesController.getConversationMessages);
router.put('/:id/read', messagesController.markMessageRead);

module.exports = router;
