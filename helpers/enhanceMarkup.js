const cheerio = require('cheerio');

const replaceNodeWithItsContent = ($, selector) => {
    $(selector).each(() => {
        var contents = $(this).contents();
        $(this).replaceWith(contents);
    });
};

const setWidthToImages = ($) => {
    $('img[data-asset-id]').each(() => {
        var $that = $(this);
        var src = $that.attr('src');
        if (src && !src.endsWith('.gif')) {
            $that.attr('src', src + '?w=926');
        }
    });
};

const processLinks = ($) => {
    $(`a[data-item-id][href=""]`).each(() => {
        var $that = $(this);
        $that.removeAttr('data-item-id');
        $that.attr('href', '/page-not-found');
    });
};

const enhanceMarkup = (text) => {
    const $ = cheerio.load(text);

    replaceNodeWithItsContent($, 'p.kc-linked-item-wrapper, p:empty');
    setWidthToImages($);
    processLinks($);

    let output = $.html();
    return output.replace('<html><head></head><body>', '').replace('</body></html>', '');
};

module.exports = enhanceMarkup;
