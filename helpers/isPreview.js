const isPreview = (injectedApiKey) => {
    return (typeof process.env['KC.PreviewApiKey'] !== 'undefined' || injectedApiKey !== null);
};

module.exports = isPreview;