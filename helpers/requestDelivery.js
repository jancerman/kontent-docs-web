const { DeliveryClient } = require('kentico-cloud-delivery');
const { deliveryConfig } = require('../config');
const enhanceMarkup = require('./enhanceMarkup')

const richTextResolverTemplates = require('./richTextResolverTemplates');
const linksResolverTemplates = require('./linksResolverTemplates');

const requestDelivery = async (config) => {
    deliveryConfig.projectId = config.projectid;
    const previewApiKey = config.previewapikey;

    if (previewApiKey) {
        deliveryConfig.previewApiKey = previewApiKey;
        deliveryConfig.enablePreviewMode = true;
    }
  
    const deliveryClient = new DeliveryClient(deliveryConfig);

    const query = deliveryClient.items()
        .type(config.type);
    
        config.depth && query.depthParameter(config.depth);
        config.slug && query.equalsFilter('elements.url', config.slug);

    if (config.resolveRichText) {
        query.queryConfig({
            richTextResolver: (item, context) => {
                if (item.system.type === 'embedded_content') {
                    return richTextResolverTemplates.embeddedContent(item);
                } else if (item.system.type === 'signpost') {
                    return richTextResolverTemplates.signpost(item);
                } else if (item.system.type === 'callout') {
                    return richTextResolverTemplates.callout(item);
                } else if (item.system.type === 'home__link_to_content_item') {
                    return richTextResolverTemplates.homeLinkToContentItem(item, config.urlMap);
                } else if (item.system.type === 'image') {
                    return richTextResolverTemplates.image(item);
                } else if (item.system.type === 'call_to_action') {
                    return richTextResolverTemplates.callToAction(item);
                } else if (item.system.type === 'home__link_to_external_url') {
                    return richTextResolverTemplates.homeLinkToExternalUrl(item);
                } else if (item.system.type === 'code_sample') {
                    return richTextResolverTemplates.codeSample(item);
                } else if (item.system.type === 'content_chunk') {
                    return richTextResolverTemplates.contentChunk(item);
                } else {
                    return `Missing Rich text resolver for the ${item.system.type} type.`;
                }
            },
            linkResolver: (link) => {
                if ((link.type === 'article' || link.type === 'scenario') && config.urlMap && config.urlMap.length) {
                    return linksResolverTemplates.article(link, config.urlMap);
                } else {
                    return `/`;
                }
            }
        });
    }

    const response = await query
        .getPromise();

    if (config.resolveRichText) {
        response.items.forEach((elem) => {
            Object.keys(elem)
                .filter((key) => elem.hasOwnProperty(key) && elem[key].hasOwnProperty('type') && elem[key].type === `rich_text`)
                .forEach((key) => {
                    elem[key].getHtml();
                    elem[key].value = enhanceMarkup(elem[key].resolvedHtml);
                });
        });
    }
      
    return response.items;
};

module.exports = requestDelivery;