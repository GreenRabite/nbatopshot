const snoowrap = require('snoowrap');
require('dotenv').config();

export default const redditBot = () => new snoowrap({
  userAgent: 'KobeBot',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_SECRET_ID,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN,
});