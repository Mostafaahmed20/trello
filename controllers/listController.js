const List = require('../models/List');
const Board = require('../models/Board');
const Card = require('../models/Card');

// Create a new list
exports.createList = async (req, res) => {
  try {
    const { title, position } = req.body;
    const boardId = req.params.boardId;

    // Check if board exists and user has access
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (!board.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the highest position if not provided
    let listPosition = position;
    if (!listPosition) {
      const lastList = await List.findOne({ board: boardId })
        .sort({ position: -1 });
      listPosition = lastList ? lastList.position + 1 : 0;
    }

    const list = new List({
      title,
      board: boardId,
      position: listPosition
    });

    await list.save();

    // Add list to board's lists array
    board.lists.push(list._id);
    await board.save();

    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ message: 'Error creating list', error: error.message });
  }
};

// Get all lists for a board
exports.getBoardLists = async (req, res) => {
  try {
    const boardId = req.params.boardId;

    // Check if board exists and user has access
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (!board.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const lists = await List.find({ board: boardId })
      .populate({
        path: 'cards',
        populate: [
          { path: 'members', select: 'username email' },
          { path: 'comments.author', select: 'username email' }
        ]
      })
      .sort({ position: 1 });

    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lists', error: error.message });
  }
};

// Update list
exports.updateList = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['title', 'position'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ message: 'Invalid updates' });
  }

  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check if user has access to the board
    const board = await Board.findById(list.board);
    if (!board.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    updates.forEach(update => list[update] = req.body[update]);
    await list.save();

    res.json(list);
  } catch (error) {
    res.status(400).json({ message: 'Error updating list', error: error.message });
  }
};

// Delete list
exports.deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check if user has access to the board
    const board = await Board.findById(list.board);
    if (!board.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete all cards in the list
    await Card.deleteMany({ list: list._id });

    // Remove list from board's lists array
    await Board.findByIdAndUpdate(list.board, {
      $pull: { lists: list._id }
    });

    // Delete the list
    await list.remove();

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting list', error: error.message });
  }
};

// Reorder lists
exports.reorderLists = async (req, res) => {
  try {
    const { lists } = req.body;
    const boardId = req.params.boardId;

    // Check if board exists and user has access
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (!board.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update positions of all lists
    const updatePromises = lists.map(list => 
      List.findByIdAndUpdate(list._id, { position: list.position })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Lists reordered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error reordering lists', error: error.message });
  }
}; 