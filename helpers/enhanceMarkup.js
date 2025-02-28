const cheerio = require('cheerio');
const helper = require('./helperFunctions');

// !!!!! Keep using the "function" keyword in the ".each" callback instead of arrow function

const replaceNodeWithItsContent = ($, selector) => {
    $(selector).each(function() {
        var contents = $(this).contents();
        $(this).replaceWith(contents);
    });
};

const replaceTooltipSpaces = ($) => {
    $('a[href^="#term-definition-"]').each(function() {
        var $that = $(this);
        $that.html($that.html().replace(/\s/g, '&nbsp;'));
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
    $('a[target="_blank"]:not([data-lightbox]):not(.edit-link)').each(function () {
        var $that = $(this);
        var linkHTML = $that.html() + '<span class="a-blank"><span>Opens in a new window</span></span>';
        $that.html(linkHTML);
    });
    $('a[href*="tech={tech}"]').each(function () {
        var $that = $(this);
        $that.attr('rel', 'nofollow');
    });
};

const createAnchors = ($) => {
    const $headings = $('h2:not(.table-of-contents__heading):not(.feedback__heading), h3, h4');
    const anchorNameList = [];

    $headings.each(function () {
        var $that = $(this);
        const anchorName = helper.generateAnchor($that.html());
        anchorNameList.push(anchorName);
        let anchorNameCount = 0;
        anchorNameList.forEach((name) => {
            if (name === anchorName) {
                anchorNameCount += 1;
            }
        });

        const id = `a-${anchorName}${anchorNameCount > 1 ? `-${anchorNameCount}` : ''}`;
        $that.attr('id', id);
        $that.html(`<a href="#${id}" class="anchor-copy" aria-hidden="true"></a>${$that.html()}`);
    });
};

const enhanceMarkup = (text) => {
    text = helper.resolveMacros(text);
    const $ = cheerio.load(text);

    replaceNodeWithItsContent($, 'p.kc-linked-item-wrapper, p:empty');
    setWidthToImages($);
    processLinks($);
    removeEmptyParagraph($);
    createAnchors($);
    replaceTooltipSpaces($);

    const output = $.html();
    return output.replace('<html><head></head><body>', '').replace('</body></html>', '');
};

module.exports = enhanceMarkup;
