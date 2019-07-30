const KenticoCloud = require('kentico-cloud-delivery');
const { deliveryConfig } = require('../config');
const enhanceMarkup = require('./enhanceMarkup');
const consola = require('consola');

const richTextResolverTemplates = require('./richTextResolverTemplates');
const linksResolverTemplates = require('./linksResolverTemplates');

const defineDeliveryConfig = (config) => {
    deliveryConfig.projectId = config.projectid;
    const previewApiKey = config.previewapikey;
    const securedApiKey = config.securedapikey;

    if (previewApiKey) {
        deliveryConfig.previewApiKey = previewApiKey;
        deliveryConfig.enablePreviewMode = true;
    }

    if (securedApiKey) {
        deliveryConfig.securedApiKey = securedApiKey;
        deliveryConfig.enableSecuredMode = true;
    }
};

const addQueryToOrder = (query, config) => {
    if (config.order.field && config.order.type) {
        if (config.order.type === 'descending') {
            query.orderByDescending(config.order.field);
        }

        if (config.order.type === 'ascending') {
            query.orderByAscending(config.order.field);
        }
    }

    return query;
};

const defineQuery = (deliveryConfig, config) => {
    const deliveryClient = new KenticoCloud.DeliveryClient(deliveryConfig);

    let query = deliveryClient.items()

        if (config.type) { query.type(config.type); }
        if (config.types) { query.types(config.types); }
        if (config.codename) { query.equalsFilter('system.codename', config.codename); }
        if (config.depth) { query.depthParameter(config.depth); }
        if (config.slug) { query.equalsFilter('elements.url', config.slug); }
        if (config.limit) { query.limitParameter(config.limit) }
        if (config.order) { query = addQueryToOrder(query, config); }

    return query;
};

const components = [{
        type: 'embedded_content',
        resolver: richTextResolverTemplates.embeddedContent
    }, {
        type: 'signpost',
        resolver: richTextResolverTemplates.signpost
    }, {
        type: 'callout',
        resolver: richTextResolverTemplates.callout
    }, {
        type: 'home__link_to_content_item',
        resolver: richTextResolverTemplates.homeLinkToContentItem
    }, {
        type: 'image',
        resolver: richTextResolverTemplates.image
    }, {
        type: 'call_to_action',
        resolver: richTextResolverTemplates.callToAction
    }, {
        type: 'home__link_to_external_url',
        resolver: richTextResolverTemplates.homeLinkToExternalUrl
    }, {
        type: 'code_sample',
        resolver: richTextResolverTemplates.codeSample
    }, {
        type: 'code_samples',
        resolver: richTextResolverTemplates.codeSamples
    }, {
        type: 'content_chunk',
        resolver: richTextResolverTemplates.contentChunk
    }, {
        type: 'content_switcher',
        resolver: richTextResolverTemplates.contentSwitcher
    }
];

const resolveRichText = (item, config) => {
    item = linksResolverTemplates.resolveInnerRichTextLinks(item, config.urlMap);

    for (var i = 0; i < components.length; i++) {
        if (item.system.type === components[i].type) {
            return components[i].resolver(item, config.urlMap);
        }
    }

    return `Missing Rich text resolver for the ${item.system.type} type.`;
};

const resolveLink = (link, config) => {
    if (config.urlMap && config.urlMap.length) {
        return linksResolverTemplates.resolve(link, config.urlMap);
    } else {
        return `/`;
    }
};

const getResponse = async (query, config) => {
    const response = await query
        .getPromise()
        .catch(err => {
            consola.error(err);
        });

    if (config.resolveRichText && response) {
        response.items.forEach((elem) => {
            Object.keys(elem)
                .filter((key) => elem.hasOwnProperty(key) && elem[key].hasOwnProperty('type') && elem[key].type === `rich_text`)
                .forEach((key) => {
                    elem[key].getHtml();
                    elem[key].value = enhanceMarkup(elem[key].resolvedHtml);
                });
        });
    }

    return response;
};

const requestDelivery = async (config) => {
    defineDeliveryConfig(config);
    const query = defineQuery(deliveryConfig, config);
    let queryConfigObject = {
        waitForLoadingNewContent: true
    };

    if (config.resolveRichText) {
        queryConfigObject.richTextResolver = (item) => {
            return resolveRichText(item, config);
        };
        queryConfigObject.linkResolver = (link) => {
            return resolveLink(link, config);
        };
    }

    query.queryConfig(queryConfigObject);

    const response = await getResponse(query, config);
    return response ? response.items : response;
};

module.exports = requestDelivery;
