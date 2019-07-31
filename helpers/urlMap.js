const { DeliveryClient } = require('kentico-cloud-delivery');
const { deliveryConfig } = require('../config');
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
    topic: {
        urlLength: 3
    },
    article: {
        urlLength: [2, 4]
    },
    multiplatform_article: {
        urlLength: 4
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

const redefineTypeLevel = (response) => {
    let level = [2, 4];

    if (response.system && response.system.type === 'multiplatform_article') {
      level = [2, 5];
    }

    return level;
  };

const handleLangForMultiplatformArticle = (queryString, item) => {
    queryString = '?tech=';
    const cachedPlatforms = cache.get(`platformsConfig_${deliveryConfig.projectId}`);
    if (cachedPlatforms && cachedPlatforms.length && item.elements.platform.value.length) {
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
        url: `/${settings.url.join('/')}${settings.queryString}`,
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

createUrlMap = (response, url, urlMap = []) => {
    let node = '';
    let queryString = '';

    if (response.items) node = 'items';
    if (response.navigation) node = 'navigation';
    if (response.children) node = 'children';

    if (response[node]) {
        response[node].forEach(item => {
            urlMap = handleNode({ response, item, urlMap, url, queryString });
        });
    }

    return urlMap;
};

handleNode = (settings) => {
    typeLevels.article.urlLength = redefineTypeLevel(settings.response);

    if (settings.item.elements.url && typeLevels[settings.item.system.type]) {
        const typeLevel = getTypeLevel(typeLevels[settings.item.system.type].urlLength, settings.url.length);

        settings.url.length = typeLevel;
        let slug = '';

        if (settings.response.system && settings.response.system.type === 'multiplatform_article') {
            // Handle "lang" query string in case articles are assigned to "multiplatform_article"
            settings.queryString = handleLangForMultiplatformArticle(settings.queryString, settings.item);
        /* }  else if (settings.item.system && settings.item.system.type === 'article' && globalConfig.isSitemap) {
            // Handle "lang" query string in case "article" has values selected in the "Platform" field
            let tempProperties = handleLangForPlatformField({ item: settings.item, slug, url: settings.url, urlMap: settings.urlMap });
            settings.urlMap = tempProperties.urlMap;
            slug = tempProperties.slug;
            settings.url = tempProperties.url; */
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
        settings.urlMap = addItemToMap({ urlMap: settings.urlMap, item: settings.item, url: settings.url, queryString: settings.queryString, type: settings.item.system.type });
    }

    settings.queryString = '';

    return createUrlMap(settings.item, settings.url, settings.urlMap);
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

    let urlMap = createUrlMap(response, []);
    urlMap = await addUnusedArtilesToUrlMap(deliveryClient, urlMap);
    return urlMap;
};

module.exports = getUrlMap;
