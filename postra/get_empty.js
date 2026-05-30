const mongoose = require('mongoose');
require('dotenv').config();
const Thread = require('./server/models/Thread');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const threads = await Thread.find({ 
    $or: [
      { image: null }, 
      { image: '' },
      { image: { $exists: false } }
    ] 
  }).limit(5);
  console.log(JSON.stringify(threads.map(t => ({ id: t._id, title: t.title, category: t.category })), null, 2));
  mongoose.disconnect();
}
run().catch(console.error);
