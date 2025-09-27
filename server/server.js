const express = require('express');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
require('dotenv').config();

// Cloudinary config
cloudinary.config({
  cloud_name: 'deinxbdqr',
  api_key: '589886722862385',
  api_secret: 'u3JU4vqU7CIAQgEn11Ryl31cbZY'
});

// Multer config for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://192.168.0.101:3000"], // Multiple possible Vite ports
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://192.168.0.101:3000"],
  credentials: true
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sickdeveloper114_db_user:6aeaGpZiTD5N9b8G@cluster0.cr6afy9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Message model
const messageSchema = new mongoose.Schema({
  senderId: String,
  receiverId: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
  type: { type: String, default: 'text' },
  status: { type: String, default: 'sent' } // 'sent', 'delivered', 'read'
});

const Message = mongoose.model('Message', messageSchema);

// User model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  status: { type: String, default: 'Available' },
  isOnline: { type: Boolean, default: false },
  contacts: [{
    id: String,
    name: String,
    mobile: String,
    avatar: String,
    status: String,
    isOnline: Boolean,
    lastRead: { type: Date, default: null }
  }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Report model
const reportSchema = new mongoose.Schema({
  userId: String,
  reason: String,
  timestamp: { type: Date, default: Date.now },
  reportedBy: String
});

const Report = mongoose.model('Report', reportSchema);

// API routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, mobile, password } = req.body;
    if (!name || !mobile || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, mobile, password: hashedPassword });
    await user.save();
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, mobile: user.mobile }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ error: 'Mobile and password are required' });
    }
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, mobile: user.mobile }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login-otp', async (req, res) => {
  try {
    const { user_json_url } = req.body;
    if (!user_json_url) {
      return res.status(400).json({ error: 'user_json_url is required' });
    }

    https.get(user_json_url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);

          const user_country_code = jsonData.user_country_code;
          const user_phone_number = jsonData.user_phone_number;
          const user_first_name = jsonData.user_first_name;
          const user_last_name = jsonData.user_last_name;

          console.log("User Country Code:", user_country_code);
          console.log("User Phone Number:", user_phone_number);
          console.log("User First Name:", user_first_name);
          console.log("User Last name:", user_last_name);

          const mobile = `${user_country_code}${user_phone_number}`;
          const name = `${user_first_name} ${user_last_name}`;

          // Find or create user by mobile
          User.findOne({ mobile }).then((user) => {
            if (!user) {
              // Auto-register new user
              const newUser = new User({ name, mobile });
              newUser.save().then((savedUser) => {
                const token = jwt.sign(
                  { userId: savedUser._id },
                  process.env.JWT_SECRET || 'fallback_secret',
                  { expiresIn: '7d' }
                );
                res.json({
                  token,
                  user: { id: savedUser._id, name: savedUser.name, mobile: savedUser.mobile }
                });
              }).catch((saveError) => {
                res.status(500).json({ error: saveError.message });
              });
            } else {
              const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '7d' }
              );
              res.json({
                token,
                user: { id: user._id, name: user.name, mobile: user.mobile }
              });
            }
          }).catch((error) => {
            res.status(500).json({ error: error.message });
          });
        } catch (parseError) {
          res.status(500).json({ error: 'Invalid JSON response from user_json_url' });
        }
      });
    }).on("error", (err) => {
      res.status(500).json({ error: 'Error fetching user data: ' + err.message });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile endpoints
app.get('/api/profile', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profile/:userId', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const { userId } = req.params;
    const targetUser = await User.findById(userId).select('-password');
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    const currentUser = await User.findById(req.user.userId).select('blockedUsers');
    const isBlocked = currentUser ? currentUser.blockedUsers.some(blockedId => blockedId.toString() === userId) : false;
    const responseUser = { ...targetUser.toObject(), isBlocked };
    res.json(responseUser);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Profile endpoints
app.put('/api/profile', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const { name, status, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, status, avatar },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Block user endpoint
app.post('/api/block/:userId', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.blockedUsers.some(blockedId => blockedId.toString() === userId)) {
      return res.status(400).json({ error: 'User already blocked' });
    }
    const targetUserId = new mongoose.Types.ObjectId(userId);
    user.blockedUsers.push(targetUserId);
    await user.save();
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete chat endpoint
app.post('/api/delete-chat/:userId', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.contacts = user.contacts.filter(contact => contact.id !== userId);
    await user.save();
    // Optionally delete messages
    await Message.deleteMany({
      $or: [
        { senderId: req.user.userId, receiverId: userId },
        { senderId: userId, receiverId: req.user.userId }
      ]
    });
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Report user endpoint
app.post('/api/report/:userId', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }
    const report = new Report({
      userId,
      reason,
      reportedBy: req.user.userId
    });
    await report.save();
    res.json({ message: 'User reported successfully' });
  } catch (error) {
    console.error('Error reporting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload avatar endpoint
app.post('/api/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Cloudinary
    cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: 'Upload failed' });
        }
        res.json({ url: result.secure_url });
      }
    ).end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search user endpoint
app.get('/api/search-user', authenticateToken, async (req, res) => {
  try {
    const { mobile } = req.query;
    if (!mobile || typeof mobile !== 'string') {
      return res.status(400).json({ error: 'Mobile number is required' });
    }
    const user = await User.findOne({ mobile }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user._id,
      name: user.name,
      mobile: user.mobile,
      avatar: user.avatar,
      status: user.status,
      isOnline: user.isOnline
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add contact endpoint
app.post('/api/add-contact', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const { contactId } = req.body;
    if (!contactId) {
      console.log('Add contact 400: Contact ID is required');
      return res.status(400).json({ error: 'Contact ID is required' });
    }
    const contact = await User.findById(contactId).select('-password');
    if (!contact) {
      console.log('Add contact 404: Contact not found for ID', contactId);
      return res.status(404).json({ error: 'Contact not found' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.log('Add contact 404: User not found for ID', req.user.userId);
      return res.status(404).json({ error: 'User not found' });
    }
    // Check if already in contacts
    const existing = user.contacts.find(c => c.id === contactId);
    if (existing) {
      console.log('Add contact 400: Contact already added', contactId);
      return res.status(400).json({ error: 'Contact already added' });
    }
    user.contacts.push({
      id: contact._id.toString(),
      name: contact.name,
      mobile: contact.mobile,
      avatar: contact.avatar,
      status: contact.status,
      isOnline: contact.isOnline
    });
    await user.save();
    res.json({ message: 'Contact added successfully' });
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark chat as read endpoint
app.post('/api/mark-read', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const { chatId } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID is required' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const contact = user.contacts.find(c => c.id === chatId);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    const lastRead = new Date();
    contact.lastRead = lastRead;
    await user.save();

    // Update message statuses to 'read' for messages from chatId to user after lastRead
    await Message.updateMany(
      { senderId: chatId, receiverId: req.user.userId, status: { $ne: 'read' } },
      { status: 'read' }
    );

    // Emit messageRead to sender for all unread messages
    const unreadMessages = await Message.find({
      senderId: chatId,
      receiverId: req.user.userId,
      timestamp: { $lte: lastRead }
    });

    unreadMessages.forEach(msg => {
      io.to(msg.senderId).emit('messageRead', { messageId: msg._id });
    });

    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/messages/:userId/:contactId', authenticateToken, async (req, res) => {
  try {
    const { userId, contactId } = req.params;
    // Security: Ensure the requested userId matches the authenticated user
    if (userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's chats endpoint
app.get('/api/chats', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const user = await User.findById(req.user.userId).select('contacts');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const chats = await Promise.all(
      user.contacts.map(async (contact) => {
        if (!contact.id || typeof contact.id !== 'string') {
          console.warn('Invalid contact ID skipped:', contact.id);
          return null;
        }
        // Fetch latest contact info
        const contactUser = await User.findById(contact.id).select('name avatar status isOnline');
        if (!contactUser) {
          console.warn('Contact user not found:', contact.id);
          return null;
        }
        // Fetch messages between user and contact
        const messages = await Message.find({
          $or: [
            { senderId: req.user.userId, receiverId: contact.id },
            { senderId: contact.id, receiverId: req.user.userId }
          ]
        }).sort({ timestamp: -1 }).limit(1); // Latest message

        const latestMessage = messages[0];
        let unreadCount = 0;
        if (latestMessage) {
          // Count unread: messages from contact to user after lastRead
          const lastRead = contact.lastRead || new Date(0);
          const unreadMessages = await Message.find({
            senderId: contact.id,
            receiverId: req.user.userId,
            timestamp: { $gt: lastRead }
          });
          unreadCount = unreadMessages.length;
        }

        return {
          id: contact.id,
          type: 'individual',
          name: contactUser.name,
          avatar: contactUser.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b808?w=150&h=150&fit=crop&crop=face',
          participants: [contact.id],
          lastMessage: latestMessage ? latestMessage.content : '',
          lastMessageTime: latestMessage ? latestMessage.timestamp : new Date(0),
          unreadCount,
          isOnline: contactUser.isOnline,
          isPinned: false,
          isTyping: false,
          messages: []
        };
      })
    );

    // Filter out null chats and sort by lastMessageTime desc
    const validChats = chats.filter(chat => chat !== null);
    validChats.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

    res.json(validChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', async (userId) => {
    socket.userId = userId;
    socket.join(userId);
    console.log(`User ${userId} joined room`);

    // Send pending read events for messages that are read
    try {
      const messages = await Message.find({ senderId: userId, status: 'read' });
      messages.forEach(msg => {
        socket.emit('messageRead', { messageId: msg._id });
      });
    } catch (error) {
      console.error('Error sending pending reads:', error);
    }

    // Set user online
    try {
      const user = await User.findById(userId);
      if (user) {
        user.isOnline = true;
        await user.save();

        // Notify contacts that this user is online
        const contacts = user.contacts || [];
        contacts.forEach(contact => {
          io.to(contact.id).emit('userOnline', { userId });
        });
      }
    } catch (error) {
      console.error('Error setting user online:', error);
    }
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { senderId, receiverId, content, type, tempId } = data;
      const message = new Message({ senderId, receiverId, content, type, status: 'sent' });
      await message.save();

      // Emit to receiver
      io.to(receiverId).emit('receiveMessage', message);
      // Also emit back to sender for confirmation
      socket.emit('messageSent', { ...message.toObject(), tempId });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('messageDelivered', async (data) => {
    try {
      const { messageId, senderId } = data;
      await Message.findByIdAndUpdate(messageId, { status: 'delivered' });
      // Emit to sender
      io.to(senderId).emit('messageDelivered', { messageId });
    } catch (error) {
      console.error('Error updating message delivered:', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    const userId = socket.userId;
    if (userId) {
      try {
        const user = await User.findById(userId);
        if (user) {
          user.isOnline = false;
          await user.save();

          // Notify contacts that this user is offline
          const contacts = user.contacts || [];
          contacts.forEach(contact => {
            io.to(contact.id).emit('userOffline', { userId });
          });
        }
      } catch (error) {
        console.error('Error setting user offline:', error);
      }
    }
  });

  // Video call signaling
  socket.on('call-offer', (data) => {
    const { offer, to } = data;
    io.to(to).emit('call-offer', { offer, from: socket.userId });
  });

  socket.on('call-answer', (data) => {
    const { answer, to } = data;
    io.to(to).emit('call-answer', { answer, from: socket.userId });
  });

  socket.on('ice-candidate', (data) => {
    const { candidate, to } = data;
    io.to(to).emit('ice-candidate', { candidate, from: socket.userId });
  });

  socket.on('end-call', (data) => {
    const { to } = data;
    io.to(to).emit('call-ended');
  });

  socket.on('call-decline', (data) => {
    const { to } = data;
    io.to(to).emit('call-declined');
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
