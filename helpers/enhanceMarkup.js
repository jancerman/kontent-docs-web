const cheerio = require('cheerio');

const enhanceMarkup = (text) => {
    const $ = cheerio.load(text);

    $('p.kc-linked-item-wrapper, p:empty').each(function(i, elem) {
        var contents = $(this).contents();
        $(this).replaceWith(contents);
    });

    $('img[data-asset-id]').each(function(i, elem) {
        var $that = $(this);
        if (!$that.attr('src').endsWith('.gif')) {
            $that.attr('src', $that.attr('src') + '?w=926');
        }
    });

    $(`a[data-item-id][href=""]`).each(function(i, elem) {
        var $that = $(this);
        $that.removeAttr('data-item-id');
        $that.attr('href', '/page-not-found');
    });

    let output = $.html();
    return output.replace('<html><head></head><body>', '').replace('</body></html>', '');
};

module.exports = enhanceMarkup;
