const Board = require('../models/Board');
const User = require('../models/User');
const List = require('../models/List');

// Create a new board
exports.createBoard = async (req, res) => {
  try {
    const { title, description, isPrivate } = req.body;
    
    const board = new Board({
      title,
      description,
      owner: req.user._id,
      isPrivate: isPrivate || false,
      members: [req.user._id]
    });

    await board.save();

    // Add board to user's boards array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { boards: board._id }
    });

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ message: 'Error creating board', error: error.message });
  }
};

// Get all boards for a user
exports.getUserBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    }).populate('owner', 'username email')
      .populate('members', 'username email');

    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching boards', error: error.message });
  }
};

// Get a single board with its lists and cards
exports.getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members', 'username email')
      .populate({
        path: 'lists',
        populate: {
          path: 'cards',
          populate: [
            { path: 'members', select: 'username email' },
            { path: 'comments.author', select: 'username email' }
          ]
        }
      });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user has access to the board
    if (!board.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching board', error: error.message });
  }
};

// Update board
exports.updateBoard = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['title', 'description', 'background', 'isPrivate'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ message: 'Invalid updates' });
  }

  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the owner
    if (!board.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can update the board' });
    }

    updates.forEach(update => board[update] = req.body[update]);
    await board.save();

    res.json(board);
  } catch (error) {
    res.status(400).json({ message: 'Error updating board', error: error.message });
  }
};

// Delete board
exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the owner
    if (!board.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can delete the board' });
    }

    // Remove board from all members' boards array
    await User.updateMany(
      { boards: board._id },
      { $pull: { boards: board._id } }
    );

    // Delete all lists and cards associated with the board
    const lists = await List.find({ board: board._id });
    for (const list of lists) {
      await Card.deleteMany({ list: list._id });
    }
    await List.deleteMany({ board: board._id });

    // Delete the board
    await board.remove();

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting board', error: error.message });
  }
};

// Add member to board
exports.addMember = async (req, res) => {
  try {
    const { email } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the owner
    if (!board.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can add members' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    if (board.members.includes(user._id)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    board.members.push(user._id);
    await board.save();

    // Add board to user's boards array
    await User.findByIdAndUpdate(user._id, {
      $push: { boards: board._id }
    });

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: 'Error adding member', error: error.message });
  }
};

// Remove member from board
exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the owner
    if (!board.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can remove members' });
    }

    // Cannot remove the owner
    if (board.owner.equals(memberId)) {
      return res.status(400).json({ message: 'Cannot remove the board owner' });
    }

    board.members = board.members.filter(member => !member.equals(memberId));
    await board.save();

    // Remove board from user's boards array
    await User.findByIdAndUpdate(memberId, {
      $pull: { boards: board._id }
    });

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: 'Error removing member', error: error.message });
  }
}; 