const cheerio = require('cheerio');
const helpers = require('./helperFunctions');

const updateLinkAttribute = (element, resolvedUrl, link) => {
    const $ = cheerio.load(element.value);
    $(`a[data-item-id="${link.linkId}"]`).each((index, item) => {
        const $item = $(item);
        $item.removeAttr('data-item-id');
        $item.attr('href', resolvedUrl);
    });
    element.value = $.html();
    element.value = element.value.replace('<html><head></head><body>', '').replace('</body></html>', '');
};

const resolveLinkUrlsInElement = (element, item, urlMap) => {
    element.links.forEach((link) => {
        let resolvedUrl = [];

        if (urlMap) {
            resolvedUrl = urlMap.filter(elem => elem.codename === link.codename);
        }

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
        let url = [];

        if (urlMap) {
            url = urlMap.filter(elem => elem.codename === item.codename);
        }

        if (url.length > 0) {
            return url[0].url;
        } else if (item.type === 'article') {
            return `/other/${item.urlSlug}`;
        } else {
            return '/page-not-found';
        }
    },
    resolveInnerRichTextLinks: (item, urlMap) => {
        const keys = helpers.removeUnderscoreElems(Object.keys(item));
        keys
            .filter((key) =>
                Object.prototype.hasOwnProperty.call(item, key) &&
                Object.prototype.hasOwnProperty.call(item[key], 'type') &&
                Object.prototype.hasOwnProperty.call(item[key], 'links') &&
                item[key].type === 'rich_text')
            .forEach((key) => resolveLinkUrlsInElement(item[key], item, urlMap));

        return item;
    }
};

module.exports = linksResolverTemplates;
