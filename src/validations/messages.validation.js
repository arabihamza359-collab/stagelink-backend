const { z } = require('zod');

const sendMessageSchema = z.object({
  body: z.object({
    receiver_id: z.string().uuid(),
    match_id: z.string().uuid(),
    content: z.string().min(1)
  })
});

module.exports = {
  sendMessageSchema
};
