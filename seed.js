const mongoose = require('mongoose');
const axios = require('axios');
const Thread = require('./server/models/Thread');
const User = require('./server/models/User');
const Comment = require('./server/models/Comment');
require('dotenv').config();

const boardMappings = {
    'technology': { reddit: 'technology', chan: 'g' },
    'programming': { reddit: 'programming', chan: 'g' },
    'ai': { reddit: 'MachineLearning', chan: 'g' },
    'gaming': { reddit: 'gaming', chan: 'v' },
    'healthcare': { reddit: 'health', chan: 'sci' },
    'politics': { reddit: 'indianews', chan: 'int' },
    'general': { reddit: 'technology+science+education+futurology+gadgets', chan: 'misc' },
    'startups': { reddit: 'startups', chan: 'biz' },
    'careers': { reddit: 'cscareerquestions', chan: 'biz' },
    'education': { reddit: 'education', chan: 'sci' },
    'productivity': { reddit: 'productivity', chan: 'biz' },
    'open-source': { reddit: 'opensource', chan: 'g' },
    'linux': { reddit: 'linux', chan: 'g' }
};

const boardNames = Object.keys(boardMappings);

const forbiddenRegex = /anime|manga|waifu|weeb|otaku|hentai|vtuber|meme\b|pepe|wojak|soyjack|chad|kek\b|lmao|shitpost/i;
const forbiddenSubs = ['anime', 'memes', 'dankmemes', 'shitposting', 'funny', 'animemes', 'me_irl', 'mangadex', 'manga', 'vtubers', 'hololive', 'goodanimemes'];

const commentSamples = [
    { c: "This is a high-utility technical analysis. Extremely relevant to p/", t: "green" },
    { c: "Agree. But have we considered the latency impact of this particular protocol?", t: "orange" },
    { c: "I've implemented this in my system, works as expected. 10/10.", t: "green" },
    { c: "Interesting point of view, though the benchmarks are missing context.", t: "orange" },
    { c: "Wait, isn't this just a recycled meme? Waste of the p/ feed.", t: "red" },
    { c: "Can we get back to the actual technical specs? This is useless drama.", t: "red" }
];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchReddit(subreddit, limit = 10) {
    try {
        console.log(`Fetching r/${subreddit}...`);
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`, {
            headers: { 'User-Agent': 'PostraBot/1.0' }
        });
        
        let children = response.data.data.children;
        // Strictly block platform-level NSFW/Adult Content arrays and wildcard strings
        children = children.filter(child => !child.data.over_18 && !forbiddenRegex.test(child.data.title) && !forbiddenRegex.test(child.data.selftext || ''));

        return children.map(child => {
            let imgUrl = '';
            if (child.data.url && (child.data.url.match(/\.(jpeg|jpg|gif|png)$/i))) {
                imgUrl = child.data.url;
            } else if (child.data.thumbnail && child.data.thumbnail.startsWith('http')) {
                imgUrl = child.data.thumbnail;
            }
            return {
                title: child.data.title,
                description: child.data.selftext || child.data.title,
                url: `https://reddit.com${child.data.permalink}`,
                source: `r/${subreddit}`,
                image: imgUrl
            };
        });
    } catch (e) {
        console.error(`Error fetching reddit r/${subreddit}: ${e.message}`);
        return [];
    }
}

async function fetch4chan(board, limit = 10) {
    try {
        console.log(`Fetching 4chan /${board}/...`);
        const response = await axios.get(`https://a.4cdn.org/${board}/catalog.json`);
        const threads = [];
        for (const page of response.data) {
            for (const thread of page.threads) {
                if (threads.length >= limit) break;
                if (forbiddenRegex.test(thread.sub || '') || forbiddenRegex.test(thread.com || '')) continue;
                let imgUrl = '';
                if(thread.tim && thread.ext) {
                    imgUrl = `https://i.4cdn.org/${board}/${thread.tim}${thread.ext}`;
                }
                threads.push({
                    title: thread.sub || thread.com || 'No Title',
                    description: (thread.com || 'No Description').replace(/<[^>]*>?/gm, ''),
                    url: `https://boards.4channel.org/${board}/thread/${thread.no}`,
                    source: `4chan /${board}/`,
                    image: imgUrl
                });
            }
            if (threads.length >= limit) break;
        }
        return threads;
    } catch (e) {
        console.error(`Error fetching 4chan /${board}/: ${e.message}`);
        return [];
    }
}

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("POSTRA | Overhauling content with live Reddit and 4chan feeds...");

        // 1. Remove all current posts, users, comments
        await Thread.deleteMany({});
        await User.deleteMany({});
        await Comment.deleteMany({});

        // Create base users
        const users = [];
        for(let i = 0; i < 20; i++) {
            const u = new User({ 
                username: `analyst_${i}`, 
                email: `expert_${i}@postra.ai`, 
                password: 'password', 
                participationScore: Math.floor(Math.random() * 500) 
            });
            await u.save();
            users.push(u._id);
        }

        // 2. Add 100 trending posts for the main page (p/general)
        console.log("Fetching 100 trending posts for General feed...");
        const redditGeneral = await fetchReddit(boardMappings['general'].reddit, 100);
        await wait(1000);
        const generalPosts = [...redditGeneral];

        let seedCounter = 1;

        for (const post of generalPosts) {
            
            const desc = post.description.length > 300 ? post.description.substring(0, 300) + '...' : post.description;
            
            const thread = new Thread({
                title: `[${post.source}] ${post.title}`,
                description: `${desc}\n\nLink: ${post.url}`,
                author: users[Math.floor(Math.random() * users.length)],
                category: 'general',
                image: post.image,
                commentCount: 30,
                usefulTags: Math.floor(Math.random() * 40),
                importantTags: Math.floor(Math.random() * 20),
                wasteTags: Math.floor(Math.random() * 5),
                uniqueContributors: users.slice(0, 10)
            });
            thread.calculateTrending();
            await thread.save();

            for (let j = 0; j < 30; j++) {
                const sample = commentSamples[Math.floor(Math.random() * commentSamples.length)];
                const comment = new Comment({
                    threadId: thread._id,
                    author: `analyst_${Math.floor(Math.random() * 20)}`,
                    content: sample.c,
                    usefulTags: sample.t === 'green' ? 10 : (sample.t === 'orange' ? 2 : 0),
                    wasteTags: sample.t === 'red' ? 10 : 0
                });
                comment.calculateQuality();
                await comment.save();
            }
        }

        // 3. Add board relevant news
        for (const board of boardNames) {
            if (board === 'general') continue; // Already did general
            
            console.log(`Processing Board: p/${board}...`);
            const mapping = boardMappings[board];
            const redditPosts = await fetchReddit(mapping.reddit, 30);
            await wait(1500);
            const boardPosts = [...redditPosts];

            for (const post of boardPosts) {

                const desc = post.description.length > 300 ? post.description.substring(0, 300) + '...' : post.description;

                const thread = new Thread({
                    title: `[${post.source}] ${post.title}`,
                    description: `${desc}\n\nLink: ${post.url}`,
                    author: users[Math.floor(Math.random() * users.length)],
                    category: board,
                    image: post.image,
                    commentCount: 30,
                    usefulTags: Math.floor(Math.random() * 40),
                    importantTags: Math.floor(Math.random() * 20),
                    wasteTags: Math.floor(Math.random() * 5),
                    uniqueContributors: users.slice(0, 10)
                });
                thread.calculateTrending();
                await thread.save();

                for (let j = 0; j < 30; j++) {
                    const sample = commentSamples[Math.floor(Math.random() * commentSamples.length)];
                    const comment = new Comment({
                        threadId: thread._id,
                        author: `analyst_${Math.floor(Math.random() * 20)}`,
                        content: sample.c,
                        usefulTags: sample.t === 'green' ? 10 : (sample.t === 'orange' ? 2 : 0),
                        wasteTags: sample.t === 'red' ? 10 : 0
                    });
                    comment.calculateQuality();
                    await comment.save();
                }
            }
        }

        console.log("POSTRA | Seeding Complete. Live content is now active.");
        process.exit();
    } catch (err) {
        console.error("Critical Seeding Error:", err);
        process.exit(1);
    }
};

seedDB();
