const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();
const Thread = require('./server/models/Thread');

async function searchRedditImage(query) {
    try {
        const res = await axios.get(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=10`);
        const posts = res.data.data.children;
        for (let post of posts) {
            const url = post.data.url;
            if (url && (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg'))) {
                return url;
            }
        }
    } catch(e) {
        console.log("Error fetching reddit", e.message);
    }
    return null;
}

async function search4chanImage(board) {
    try {
        const res = await axios.get(`https://a.4cdn.org/${board}/catalog.json`);
        for (let page of res.data) {
            for (let thread of page.threads) {
                if (thread.ext && (thread.ext === '.jpg' || thread.ext === '.png')) {
                    return `https://i.4cdn.org/${board}/${thread.tim}${thread.ext}`;
                }
            }
        }
    } catch(e) {
        console.log("Error fetching 4chan", e.message);
    }
    return null;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const threads = await Thread.find({ 
    $or: [{ image: null }, { image: '' }, { image: { $exists: false } }] 
  }).limit(10);
  
  for (let i = 0; i < threads.length; i++) {
      let t = threads[i];
      let imgUrl = null;
      
      // Attempt Reddit query based on title
      const query = t.title.replace(/^\[.*?\]\s*/, '').substring(0, 40);
      
      // Randomly pick reddit or 4chan
      if (i % 2 === 0) {
          imgUrl = await searchRedditImage(query);
      } else {
          // just pick a relevant 4chan board image based on typical topics
          const boards = ['g', 'sci', 'pol', 'biz', 'int'];
          imgUrl = await search4chanImage(boards[i % boards.length]);
      }
      
      if (!imgUrl) {
          // Fallback to searching reddit broadly
          imgUrl = await searchRedditImage(t.category || "technology");
      }
      
      if (imgUrl) {
          console.log(`Setting image for ${t._id} -> ${imgUrl}`);
          t.image = imgUrl;
          await t.save();
      }
  }
  
  mongoose.disconnect();
}
run().catch(console.error);
