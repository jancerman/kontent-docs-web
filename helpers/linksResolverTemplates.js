const cheerio = require('cheerio');

const updateLinkAttribute = (element, resolvedUrl, link) => {
    const $ = cheerio.load(element.value);
    $(`a[data-item-id="${link.itemId}"]`).each((index, item) => {
        let $item = $(item);
        $item.removeAttr('data-item-id');
        $item.attr('href', resolvedUrl);
    });
    element.value = $.html();
    element.value = element.value.replace('<html><head></head><body>', '').replace('</body></html>', '');
};

const resolveLinkUrlsInElement = (element, item, urlMap) => {
    element.links.forEach((link) => {
        let resolvedUrl = urlMap.filter(elem => elem.codename === link.codename);

        if (resolvedUrl.length > 0) {
            resolvedUrl = resolvedUrl[0].url;
        } else if (link.type === 'article') {
            resolvedUrl = `/other/${item.urlSlug}`;
        } else {
            resolvedUrl = '/page-not-found';
        }
        if (element.value && resolvedUrl) {
            updateLinkAttribute(element, resolvedUrl, link)
        }
    });
};

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
            .filter((key) =>
                item.hasOwnProperty(key) &&
                item[key].hasOwnProperty('type') &&
                item[key].hasOwnProperty('links') &&
                item[key].type === `rich_text`)
            .forEach((key) => resolveLinkUrlsInElement(item[key], item, urlMap));

        return item;
    }
};

module.exports = linksResolverTemplates;
