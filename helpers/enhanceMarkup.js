const cheerio = require('cheerio');
const helper = require('./helperFunctions');

// !!!!! Keep using the "function" keyword in the ".each" callback instead of arrow function

const replaceNodeWithItsContent = ($, selector) => {
    $(selector).each(function() {
        var contents = $(this).contents();
        $(this).replaceWith(contents);
    });
};

const setWidthToImages = ($) => {
    $('img[data-asset-id]').each(function() {
        var $that = $(this);
        var src = $that.attr('src');
        if (src && !src.endsWith('.gif')) {
            $that.attr('src', src + '?w=926&fm=jpg&auto=format');
        }
    });
};

const removeEmptyParagraph = ($) => {
    $('p:empty').remove();
};

const processLinks = ($) => {
    $('a[data-item-id][href=""]').each(function () {
        var $that = $(this);
        $that.removeAttr('data-item-id');
        $that.attr('href', '/page-not-found');
    });
};

const enhanceMarkup = (text) => {
    text = helper.resolveMacros(text);
    const $ = cheerio.load(text);

    replaceNodeWithItsContent($, 'p.kc-linked-item-wrapper, p:empty');
    setWidthToImages($);
    processLinks($);
    removeEmptyParagraph($);

    const output = $.html();
    return output.replace('<html><head></head><body>', '').replace('</body></html>', '');
};

module.exports = enhanceMarkup;
