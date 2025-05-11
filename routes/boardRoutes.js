const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const listRoutes = require('./listRoutes');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Board CRUD operations
router.post('/', boardController.createBoard);
router.get('/', boardController.getUserBoards);
router.get('/:id', boardController.getBoard);
router.patch('/:id', boardController.updateBoard);
router.delete('/:id', boardController.deleteBoard);

// Member management
router.post('/:id/members', boardController.addMember);
router.delete('/:id/members/:memberId', boardController.removeMember);

// List routes
router.use('/:boardId/lists', listRoutes);

module.exports = router; 