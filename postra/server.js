const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const axios = require('axios');

const passport = require('passport');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Route Definitions
const authRoutes = require('./server/routes/authRoutes');
const threadRoutes = require('./server/routes/threadRoutes');
const commentRoutes = require('./server/routes/commentRoutes');
const vapiController = require('./server/controllers/vapiController');

app.use('/api', authRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/comments', commentRoutes);

// Voice Assistant Route
app.post('/api/ai/vapi', vapiController.handleVoiceQuery);

// Image Proxy to bypass Hotlink/CORS restrictions from Reddit/4chan CDNs
app.get('/api/proxy-image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).send('URL required');
        
        const response = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 5000,
            headers: {
                'Referer': 'https://boards.4channel.org/', 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
        response.data.pipe(res);
    } catch(err) {
        // Fail gracefully to trigger the frontend onerror display fallback
        res.status(404).send('Not found');
    }
});

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Server Listen
app.listen(PORT, () => {
    console.log(`POSTRA (Participation Oriented Structured Threaded Response Application) running at http://localhost:${PORT}`);
    console.log('Premium community platform and Access-Controlled participation active.');
});
