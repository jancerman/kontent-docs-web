const {
    DeliveryClient
} = require('kentico-cloud-delivery');
const {
    deliveryConfig
} = require('../config');
const cache = require('memory-cache');
let fields = ['codename', 'url'];
let createUrlMap, handleNode;

// Define length of url for specific content types (number of path elements)
const typeLevels = {
    home: {
        urlLength: 0
    },
    navigation_item: {
        urlLength: 1
    },
    scenario: {
        urlLength: 2
    },
    certification: {
        urlLength: 2
    },
    zapi_specification: {
        urlLength: 2
    },
    zapi__category: {
        urlLength: 3
    },
    zapi_path_operation: {
        urlLength: 3
    },
    topic: {
        urlLength: 3
    },
    article: {
        urlLength: [2, 4]
    },
    multiplatform_article: {
        urlLength: [2, 4]
    }
};

const getMapItem = (data) => {
    let item = {};
    fields.forEach(field => {
        switch (field) {
            case 'codename':
                item.codename = data.codename;
                break;
            case 'url':
                item.url = data.url;
                break;
            case 'date':
                item.date = data.date;
                break;
            case 'visibility':
                item.visibility = data.visibility;
                break;
            case 'type':
                item.type = data.type;
                break;
            default:
                item[field] = 'is-unknown-field';
        }
    });

    return item;
};

const redefineTypeLevelArticle = (response, urlLength) => {
    let level = [2, 4];

    if (response.system && response.system.type === 'multiplatform_article') {
        if (urlLength === 4) {
            level = [2, 5];
        } else if (urlLength === 2) {
            level = [3, 4];
        }
    }

    return level;
};

const handleLangForMultiplatformArticle = (queryString, item) => {
    queryString = '?tech=';
    const cachedPlatforms = cache.get(`platformsConfig_${deliveryConfig.projectId}`);
    if (cachedPlatforms && cachedPlatforms.length && item.elements.platform && item.elements.platform.value.length) {
        let tempPlatform = cachedPlatforms[0].options.filter(elem => item.elements.platform.value[0].codename === elem.platform.value[0].codename);
        if (tempPlatform.length) {
            queryString += tempPlatform[0].url.value;
        }
    }

    return queryString;
};

const addItemToMap = (settings) => {
    settings.urlMap.push(getMapItem({
        codename: settings.item.system.codename,
        url: `/${settings.url.join('/')}${settings.queryString}${settings.hash}`,
        date: settings.item.system.lastModified,
        visibility: settings.item.visibility && settings.item.visibility.value.length ? settings.item.visibility.value : null,
        type: settings.type
    }, fields));

    return settings.urlMap;
};

const getTypeLevel = (typeLength, urlLength) => {
    let typeLevel = 0;

    if (Array.isArray(typeLength)) {
        for (let i = 0; i < typeLength.length; i++) {
            if (typeLength[i] >= urlLength) {
                typeLevel = typeLength[i];
                break;
            }
        }
    } else {
        typeLevel = typeLength;
    }

    return typeLevel;
};

createUrlMap = (response, isSitemap, url, urlMap = []) => {
    let nodes = [];
    let queryString = '';
    let hash = '';

    if (response.items) nodes.push('items');
    if (response.navigation) nodes.push('navigation');
    if (response.children) nodes.push('children');
    if (response.topics) nodes.push('topics');

    if (!isSitemap) {
        if (response.categories) nodes.push('categories');
        if (response.path_operations) nodes.push('path_operations');
    }

    for (let i = 0; i < nodes.length; i++) {
        if (response[nodes[i]]) {
            response[nodes[i]].forEach(item => {
                urlMap = handleNode({
                    response,
                    item,
                    urlMap,
                    url,
                    queryString,
                    hash,
                    isSitemap
                });
            });
        }
    }

    return urlMap;
};

handleNode = (settings) => {
    if (settings.response.system && settings.item.system && settings.response.system.type === 'navigation_item' && settings.item.system.type === 'multiplatform_article') {
        settings.url.length = 2;
    }

    typeLevels.article.urlLength = redefineTypeLevelArticle(settings.response, settings.url.length);

    if (settings.item.elements.url && typeLevels[settings.item.system.type]) {
        const typeLevel = getTypeLevel(typeLevels[settings.item.system.type].urlLength, settings.url.length);

        settings.url.length = typeLevel;
        let slug = '';

        if (settings.response.system && settings.item.system && settings.response.system.type === 'multiplatform_article' && settings.item.system.type === 'article') {
            // Handle "lang" query string in case articles are assigned to "multiplatform_article"
            settings.queryString = handleLangForMultiplatformArticle(settings.queryString, settings.item);
            /* }  else if (settings.item.system && settings.item.system.type === 'article' && globalConfig.isSitemap) {
                // Handle "lang" query string in case "article" has values selected in the "Platform" field
                let tempProperties = handleLangForPlatformField({ item: settings.item, slug, url: settings.url, urlMap: settings.urlMap });
                settings.urlMap = tempProperties.urlMap;
                slug = tempProperties.slug;
                settings.url = tempProperties.url; */
        } else if (settings.item.system.type === 'zapi__category') {
            settings.hash = `#tag/${settings.item.elements.url.value}`;
        } else if (settings.item.system.type === 'zapi_path_operation') {
            settings.hash = `#operation/${settings.item.elements.url.value}`;
        } else {
            slug = settings.item.elements.url.value;
        }

        if (slug) {
            settings.url[settings.url.length - 1] = slug;
        } else {
            settings.url.length = settings.url.length - 1;
        }
    }

    // Add url to map
    if (typeLevels[settings.item.system.type]) {
        settings.urlMap = addItemToMap({
            urlMap: settings.urlMap,
            item: settings.item,
            url: settings.url,
            queryString: settings.queryString,
            hash: settings.hash,
            type: settings.item.system.type
        });
    }

    settings.queryString = '';
    settings.hash = '';

    return createUrlMap(settings.item, settings.isSitemap, settings.url, settings.urlMap);
};

const addUnusedArtilesToUrlMap = async (deliveryClient, urlMap) => {
    const query = deliveryClient.items()
        .type('article');

    const articles = await query
        .getPromise();

    articles.items.forEach((articleItem) => {
        let isInUrlMap = false;
        urlMap.forEach((mapItem) => {
            if (articleItem.system.codename === mapItem.codename) {
                isInUrlMap = true;
            }
        });

        if (!isInUrlMap) {
            urlMap.push(getMapItem({
                codename: articleItem.system.codename,
                url: `/other/${articleItem.elements.url.value}`,
                date: articleItem.system.lastModified,
                visibility: articleItem.visibility && articleItem.visibility.value.length ? articleItem.visibility.value : null,
                type: 'article'
            }, fields));
        }
    });

    return urlMap;
};

const getUrlMap = async (res, isSitemap) => {
    // globalConfig = config;
    deliveryConfig.projectId = res.locals.projectid;

    if (res.locals.previewapikey) {
        deliveryConfig.previewApiKey = res.locals.previewapikey;
        deliveryConfig.enablePreviewMode = true;
    }

    if (res.locals.securedapikey) {
        deliveryConfig.securedApiKey = res.locals.securedapikey;
        deliveryConfig.enableSecuredMode = true;
    }

    const deliveryClient = new DeliveryClient(deliveryConfig);

    const query = deliveryClient.items()
        .type('home')
        .queryConfig({
            waitForLoadingNewContent: true
        })
        .depthParameter(5);

    const response = await query
        .getPromise();

    if (isSitemap) {
        fields = ['codename', 'url', 'date', 'visibility', 'type'];
    } else {
        fields = ['codename', 'url'];
    }

    let urlMap = createUrlMap(response, isSitemap, []);
    urlMap = await addUnusedArtilesToUrlMap(deliveryClient, urlMap);
    return urlMap;
};

module.exports = getUrlMap;
