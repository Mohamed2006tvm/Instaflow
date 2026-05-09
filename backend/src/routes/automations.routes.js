const { Router } = require('express');
const {
  listAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  toggleAutomation,
  deleteAutomation,
} = require('../controllers/automations.controller');

const router = Router();

router.get('/', listAutomations);
router.get('/:id', getAutomation);
router.post('/', createAutomation);
router.put('/:id', updateAutomation);
router.patch('/:id/toggle', toggleAutomation);
router.delete('/:id', deleteAutomation);

module.exports = router;
