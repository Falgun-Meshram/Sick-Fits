<<<<<<< HEAD
// lets go!
require("dotenv").config({ path: "variables.env" });
const createServer = require("./createServer");
const db = require("./db");

const server = createServer();

// TODO User express middleware to handle cookies (JWT)
// TODO User express middleware to populate current user

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL,
    },
  },
  deets => {
    console.log(
      `Server is now running on port http:localhost:7777${deets.port} `
    );
  }
);
=======
// let's go!
>>>>>>> 052c60766f6cce6f278d34ea490888273254e9d3
