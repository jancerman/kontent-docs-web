const minifier = require('html-minifier').minify;
const minifierOptions = {
    collapseWhitespace: true
};

const minify = (text) => {
    return minifier(text, minifierOptions);
};

module.exports = minify;
