const router = require('express').Router();
const controller = require('../controllers/lead.controller');

router.get('/leads', controller.getLeads);
router.post('/leads', controller.createLead);
router.get('/leads/:id', controller.getLeadById);
router.delete('/leads/:id', controller.deleteLead);
// Demo error simulation endpoint (kept under /api root as per spec)
router.get('/test-error', controller.testError);
router.get('/simulate-error', controller.testError); // alias

module.exports = router;
