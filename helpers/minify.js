const minifier = require('html-minifier').minify;
const minifierOptions = {
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true
};

const minify = (text) => {
    return text; //minifier(text, minifierOptions);
};

module.exports = minify;