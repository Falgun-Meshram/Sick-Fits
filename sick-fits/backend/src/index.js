require('dotenv').config({ path: 'variables.env' });

const cookeParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// Allow the use of cookies
server.express.use(cookeParser());

// Customn middleware to handle the Cookies
server.express.use((req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    req.userId = userId;
  }

  next();
});

// Another middleware to populate the request with the user
server.express.use(async (req, res, next) => {
  if (!req.userId) return next();
  const user = await db.query.user(
    { where: { id: req.userId } },
    '{id, permissions, email, name}'
  );
  req.user = user;
  next();
});

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL,
    },
  },
  deets => {
    console.log(`The server is now running on the port ${deets.port}`);
  }
);
