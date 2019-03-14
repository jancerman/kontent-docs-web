const cheerio = require('cheerio');

const linksResolverTemplates = {
    resolve: (item, urlMap) => {
        let url = urlMap.filter(elem => elem.codename === item.codename);

        if (url.length > 0) {
            return url[0].url;
        } else if (item.type === 'article') {
            return `/other/${item.urlSlug}`;
        } else {
            return '/page-not-found';
        }
    },
    resolveInnerRichTextLinks: (item, urlMap) => {
        Object.keys(item)
            .filter((key) => item.hasOwnProperty(key) && item[key].hasOwnProperty('type') && item[key].hasOwnProperty('links') && item[key].type === `rich_text`)
            .forEach((key) => {
                item[key].links.forEach((link) => {
                    let resolvedUrl = urlMap.filter(elem => elem.codename === link.codename);
                    if (resolvedUrl.length > 0) {
                        resolvedUrl = resolvedUrl[0].url;
                    } else if (link.type === 'article') {
                        resolvedUrl = `/other/${item.urlSlug}`;
                    } else {
                        resolvedUrl = '/page-not-found';
                    }
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
