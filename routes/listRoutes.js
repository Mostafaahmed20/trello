const express = require('express');
const router = express.Router({ mergeParams: true }); // To access boardId from parent router
const listController = require('../controllers/listController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// List CRUD operations
router.post('/', listController.createList);
router.get('/', listController.getBoardLists);
router.patch('/:id', listController.updateList);
router.delete('/:id', listController.deleteList);

// List reordering
router.post('/reorder', listController.reorderLists);

module.exports = router; 