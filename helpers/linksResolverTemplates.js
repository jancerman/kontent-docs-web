const cheerio = require('cheerio');

const linksResolverTemplates = {
    article: (item, urlMap) => {
        return urlMap.filter(elem => elem.codename === item.codename)[0].url;
    },
    resolveInnerRichTextLinks: (item, urlMap) => {
        Object.keys(item)
            .filter((key) => item.hasOwnProperty(key) && item[key].hasOwnProperty('type') && item[key].hasOwnProperty('links') && item[key].type === `rich_text`)
            .forEach((key) => {
                item[key].links.forEach((link) => {
                    let resolvedUrl = (urlMap.filter(elem => elem.codename === link.codename)[0].url);
                    if (item[key].value && resolvedUrl) {
                        const $ = cheerio.load(item[key].value);
                        $(`a[data-item-id="${link.itemId}"]`).each(function(i, elem) {
                            var $that = $(this);
                            $that.removeAttr('data-item-id');
                            $that.attr('href', resolvedUrl);
                        });
                        item[key].value = $.html();
                        item[key].value = item[key].value.replace('<html><head></head><body>', '').replace('</body></html>', '');
                    }
                });
            });

        return item;
    }
};

module.exports = linksResolverTemplates;
