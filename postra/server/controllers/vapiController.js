const axios = require('axios');
const Thread = require('../models/Thread');
const User = require('../models/User');

exports.handleVoiceQuery = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: "Empty query provided." });

        const GEMINI_KEY = process.env.GEMINI_KEY;
        const model = 'gemini-1.5-flash';
        
        const q = query.toLowerCase();
        let fallbackUsed = false;
        
        if (!GEMINI_KEY || GEMINI_KEY === 'your_gemini_key_here') {
            fallbackUsed = true;
        }

        if (!fallbackUsed) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_KEY}`;
                const response = await axios.post(url, {
                    contents: [{
                        parts: [{
                            text: `SYSTEM INSTRUCTION: You are an independent, expert-level AI Assistant. Provide a short, concise, and straight-to-the-point answer to the following question. Avoid unnecessary details. Do not mention Postra or any platform-specific limitations. 
                            
                            USER QUERY: ${query}`
                        }]
                    }]
                });

                if (response.data && response.data.candidates && response.data.candidates[0].content) {
                    const answer = response.data.candidates[0].content.parts[0].text;
                    return res.json({ answer });
                }
            } catch (apiErr) {
                console.error("Gemini API Error, using fallback:", apiErr.message);
                fallbackUsed = true;
            }
        }
        
        if (fallbackUsed) {
            let answer = "I am currently operating in offline mode. I can provide local platform statistics. ";
            if (q.includes('how many threads') || q.includes('discourse') || q.includes('posts')) {
                const count = await Thread.countDocuments();
                answer = `We currently have ${count} active threads in the discourse database.`;
            } else if (q.includes('users') || q.includes('analysts') || q.includes('members')) {
                const count = await User.countDocuments();
                answer = `There are currently ${count} registered analysts participating in the platform.`;
            } else if (q.includes('trending') || q.includes('top')) {
                const topThread = await Thread.findOne().sort({ trendingScore: -1 });
                if (topThread) {
                    answer = `The top trending discourse right now is titled "${topThread.title}".`;
                } else {
                    answer = "There are no trending discourses available right now.";
                }
            } else {
                answer += "Please ask me about thread counts, user counts, or trending topics.";
            }
            return res.json({ answer });
        }

    } catch (err) {
        console.error("Gemini Technical Fault:", err.message);
        res.status(500).json({ error: "Intelligence Protocol Interrupted." });
    }
};
