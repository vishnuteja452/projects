const axios = require('axios');

async function listModels() {
    const key = 'AIzaSyC33wqQ6L1Sli9c1WhnDziAsqpgW6AJops';
    const versions = ['v1', 'v1beta'];
    
    console.log("--- Listing Available Models for API Key ---");
    
    for (const v of versions) {
        try {
            console.log(`Checking Version: ${v}...`);
            const url = `https://generativelanguage.googleapis.com/${v}/models?key=${key}`;
            const res = await axios.get(url);
            console.log(`✅ Success with ${v}`);
            const models = res.data.models.map(m => m.name);
            console.log("Available Models:", models);
            process.exit(0);
        } catch (err) {
            console.error(`❌ Failed with ${v}:`, err.response ? err.response.data : err.message);
        }
    }
    process.exit(1);
}

listModels();
