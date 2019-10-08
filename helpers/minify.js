const minifier = require('html-minifier').minify;
const minifierOptions = {
    collapseWhitespace: true
};

const minify = (text) => {
    if (text) {
        return minifier(text, minifierOptions);
    } else {
        return '';
    }
};

module.exports = minify;
