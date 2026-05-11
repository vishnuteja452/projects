const axios = require('axios');

exports.handleVoiceQuery = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: "Empty query provided." });

        // VERIFIED KEY & VERSION
        const GEMINI_KEY = 'AIzaSyC33wqQ6L1Sli9c1WhnDziAsqpgW6AJops';
        const model = 'gemini-2.5-flash';
        
        // Target: VERIFIED Gemini 2.5 Flash Model on v1 API
        const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_KEY}`;

        console.log(`POSTRA Intel | Routing discourse to verified brain: ${model}`);

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
            res.json({ answer });
        } else {
            console.error("Gemini Parsing Error - Full Data:", JSON.stringify(response.data));
            res.status(500).json({ error: "Intelligence analysis failed. Please verify API response structure." });
        }

    } catch (err) {
        console.error("Gemini Technical Fault:", err.response ? err.response.data : err.message);
        res.status(500).json({ error: "Gemini Intelligence Protocol Interrupted." });
    }
};
