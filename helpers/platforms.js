const handleCache = require('./handleCache');
const requestDelivery = require('./requestDelivery');
const commonContent = require('./commonContent');

const cache = require('memory-cache');

const platforms = {
    getSelectedPlatform: (platformsConfig, cookiesPlatform) => {
        let platform = platformsConfig ? platformsConfig.filter(item => item.system.codename === cookiesPlatform) : null;
        if (platform && platform.length) {
            platform = platform[0].elements.url.value
        } else {
            platform = null;
        }
        return platform;
    },
    getPlatformsConfig: (projectId) => {
        return (cache.get(`platformsConfig_${projectId}`) && cache.get(`platformsConfig_${projectId}`).length
        ? cache.get(`platformsConfig_${projectId}`)[0].options
        : null);
    },
    getMultiplatformArticleContent: async (content, preselectedPlatform, urlMap, KCDetails, res) => {
        let platformItem = content[0].children.filter(item => {
            if (item.platform.value.length) {
                return item.platform.value[0].codename === preselectedPlatform;
            }
            return false;
        });

        let availablePlatforms = content[0].children;

        if (!platformItem.length && availablePlatforms.length) {
            platformItem.push(availablePlatforms[0]);
        }

        if (platformItem.length) {
            content = await handleCache.evaluateSingle(res, `article_${platformItem[0].elements.url.value}`, async () => {
                return await requestDelivery({
                    codename: platformItem[0].system.codename,
                    type: 'article',
                    depth: 2,
                    resolveRichText: true,
                    urlMap: urlMap,
                    ...KCDetails
                });
            });
        } else {
            return null;
        }

        return {
            content: content,
            availablePlatforms: availablePlatforms
        }
    },
    getDefaultPlatform: (req, content, preselectedPlatform) => {
        preselectedPlatform = req.cookies['KCDOCS.preselectedLanguage'];

        if (content.children && content.children.length) {
            preselectedPlatform = content.children[0].elements.platform.value[0].codename;
        } else if (content.platform && content.platform.value.length) {
            preselectedPlatform = content.platform.value[0].codename;
        }

        return preselectedPlatform;
    },
    getAvailablePlatform: (content, preselectedPlatform) => {
        let platformItems;
        if (content.children) {
            platformItems = content.children.filter(item => {
                if (item.platform.value.length) {
                    return item.platform.value[0].codename === preselectedPlatform;
                }
                return false;
            });

            if (platformItems.length) {
                preselectedPlatform = platformItems[0].platform.value[0].codename;
            } else {
                preselectedPlatform = content.children[0].platform.value[0].codename;
            }
        } else {
            platformItems = content.platform.value.filter(item => item.codename === preselectedPlatform);

            if (platformItems.length) {
                preselectedPlatform = platformItems[0].codename;
            } else {
                if (content.platform.value.length) {
                    preselectedPlatform = content.platform.value[0].codename;
                }
            }
        }

        return preselectedPlatform;
    },
    getPreselectedPlatform: (content, cookiesPlatform, req, res) => {
        const KCDetails = commonContent.getKCDetails(res);
        const platformsConfig = platforms.getPlatformsConfig(KCDetails.projectid);
        let preselectedPlatform = req.query.tech;

        if (preselectedPlatform) {
            let tempPlatforms = platformsConfig ? platformsConfig.filter(item => item.elements.url.value === preselectedPlatform) : null;
            if (tempPlatforms && tempPlatforms.length) {
                preselectedPlatform = tempPlatforms[0].system.codename;
                cookiesPlatform = preselectedPlatform;
            } else {
                return null;
            }
        }

        if (!preselectedPlatform) {
            preselectedPlatform = platforms.getDefaultPlatform(req, content, preselectedPlatform);
        } else {
            preselectedPlatform = platforms.getAvailablePlatform(content, preselectedPlatform);
        }

        return {
            preselectedPlatform: preselectedPlatform,
            cookiesPlatform: cookiesPlatform
        };
    },
    getPreselectedPlatformByConfig: (preselectedPlatform, platformsConfig) => {
        preselectedPlatform = platformsConfig ? platformsConfig.filter(item => item.system.codename === preselectedPlatform) : null;
        if (preselectedPlatform && preselectedPlatform.length) {
            preselectedPlatform = preselectedPlatform[0].elements.url.value;
        } else {
            preselectedPlatform = null;
        }

        return preselectedPlatform;
    },
    getCanonicalUrl: (urlMap, content, preselectedPlatform) => {
        let canonicalUrl;
        if ((content.system.type === 'article' && content.platform.value.length > 1) || (content.system.type === 'multiplatform_article' && content.children.length && preselectedPlatform === content.children[0].platform.value[0].codename)) {
            canonicalUrl = urlMap.filter(item => item.codename === content.system.codename);
            canonicalUrl = canonicalUrl.length ? canonicalUrl[0].url : null;
        }
        return canonicalUrl;
    }
};

module.exports = platforms;
