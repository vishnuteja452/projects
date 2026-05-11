const mongoose = require('mongoose');
require('dotenv').config();
const Thread = require('./server/models/Thread');
const Comment = require('./server/models/Comment');

const MOCK_COMMENTS = [
    "This is highly informative, thanks for sharing! It really helps clarify the situation.",
    "I agree with the general premise, but there are a few edge cases to consider.",
    "bruh lol 💀💀💀",
    "Can you provide more sources on this? I want to read up more.",
    "This is exactly what I was looking for. The structural points are solid.",
    "Just basic stuff, but good for beginners I guess.",
    "LMAO, who even typed this? hilarious.",
    "A brilliant summary. Saving this for later reference.",
    "I feel like this completely missed the point of the original article.",
    "literally me when I try to code at 3am 😂",
    "The analysis on the secondary factors is top-tier. Great job.",
    "Okay, but what about the socio-economic impacts?",
    "meme review: 10/10 would read again.",
    "Very detailed and precise. The methodology makes sense.",
    "Hmm, I'm not fully convinced yet, but it's an interesting perspective.",
    "based and redpilled.",
    "This should be added to the wiki, incredibly useful.",
    "I've seen similar arguments before. Needs more novelty.",
    "can we get an F in the chat for this dude",
    "This totally changes how I approach this problem. Fantastic insights!"
];

const MOCK_AUTHORS = ["analyst", "crypto_bro", "dev_guy", "meme_lord", "researcher", "casual_user", "expert", "anon"];

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    console.log("Connected to DB, clearing old comments...");
    await Comment.deleteMany({});
    
    const threads = await Thread.find({});
    console.log(`Found ${threads.length} threads. Generating comments...`);

    for (let thread of threads) {
        let commentsList = [];
        
        for (let i = 0; i < 50; i++) {
            // Decide tags based on index to distribute
            let useful = 0, average = 0, memes = 0;
            
            if (i % 3 === 0) useful = Math.floor(Math.random() * 10) + 1;
            else if (i % 3 === 1) average = Math.floor(Math.random() * 10) + 1;
            else memes = Math.floor(Math.random() * 10) + 1;

            let color = 'orange';
            if (i % 3 === 0) color = 'green';
            else if (i % 3 === 2) color = 'red';

            const c = new Comment({
                threadId: thread._id,
                author: MOCK_AUTHORS[Math.floor(Math.random() * MOCK_AUTHORS.length)],
                content: MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)],
                usefulTags: useful,
                averageTags: average,
                memeTags: memes,
                qualityColor: color,
                parentId: null
            });
            c.calculateQuality();
            await c.save();
            commentsList.push(c);
            
            // Randomly create a nested reply
            if (Math.random() < 0.4 && commentsList.length > 0) {
                const parent = commentsList[Math.floor(Math.random() * commentsList.length)];
                
                let rUseful = 0, rAverage = 0, rMemes = 0;
                let rColor = 'orange';
                if (Math.random() < 0.3) { rUseful = 5; rColor = 'green'; }
                else if (Math.random() < 0.3) { rMemes = 5; rColor = 'red'; }
                else { rAverage = 5; rColor = 'orange'; }

                const reply = new Comment({
                    threadId: thread._id,
                    author: MOCK_AUTHORS[Math.floor(Math.random() * MOCK_AUTHORS.length)],
                    content: "Reply to that: " + MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)],
                    usefulTags: rUseful,
                    averageTags: rAverage,
                    memeTags: rMemes,
                    qualityColor: rColor,
                    parentId: parent._id
                });
                reply.calculateQuality();
                await reply.save();
                i++; // counts towards 50
            }
        }
        
        thread.commentCount = 50;
        await thread.save();
    }
    
    console.log("Seeding complete.");
    process.exit(0);
}

seed();
