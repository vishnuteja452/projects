import dotenv from "dotenv" 
import app from "./app.js"
import connectmongo from "./db/database.js"
dotenv.config({
    path:"./.env",
})

const port = process.env.PORT || 3000

connectmongo()
  .then(() =>{
    app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
});
  })
  .catch((err) => {
    console.log("mongodb connection failed");
    process.exit(1);
  });


