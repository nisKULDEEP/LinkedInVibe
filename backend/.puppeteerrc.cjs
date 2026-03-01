const { join } = require('path');

/**
 * @type {import('puppeteer').Configuration}
 */
module.exports = {
    // Changes the cache location for Puppeteer to a local directory
    // This ensures Render persists the downloaded Chrome binary across the build & runtime process
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
