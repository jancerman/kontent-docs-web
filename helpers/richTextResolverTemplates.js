const moment = require('moment');
const helper = require('./helperFunctions');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const getImageAttributes = (item, cssClass, dpr, transformationQueryString) => {
    if (item.image_width.value.length) {
        switch (item.image_width.value[0].codename) {
            case 'n25_':
                cssClass += ' article__image--25';
                transformationQueryString += '168';
                break;
            case 'n50_':
                cssClass += ' article__image--50';
                transformationQueryString += '336';
                break;
            case 'n75_':
                cssClass += ' article__image--75';
                transformationQueryString += '504';
                break;
            case 'n100_':
                cssClass += ' article__image--100';
                transformationQueryString += '672';
                break;
            default:
                transformationQueryString += '896';
        }
    }

    if (dpr) {
        transformationQueryString += `&dpr=${dpr}`;
    }

    if (item.image.value.length && item.image.value[0].url.endsWith('.gif')) {
        transformationQueryString = '';
    }

    return {
        cssClass: cssClass,
        transformationQueryString: transformationQueryString
    }
}

const getEmbeddedTemplate = (cssClass, item, netlifyId) => {
    return {
        youtube: `
            <div class="embed${cssClass}">
                <iframe class="lazy" width="560" height="315" data-src="https://www.youtube-nocookie.com/embed/${item.id.value}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe>
                <noscript>
                    <iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${item.id.value}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe>
                </noscript>
            </div>
            <p class="print-only"> 
                <i>Play video on <a href="https://www.youtube.com/watch?v=${item.id.value}"> https://www.youtube.com/watch?v=${item.id.value}</a></i>
            </p>
            `,
        codepen: `
            <div class="embed${cssClass}">
                <iframe class="lazy" height="265" scrolling="no" data-src="https://codepen.io/${item.id.value.replace('/pen/', '/embed/')}/?height=265&amp;theme-id=0" frameborder="no" allowtransparency="true" allowfullscreen="true"></iframe>
                <noscript>
                    <iframe height="265" scrolling="no" src="https://codepen.io/${item.id.value}/?height=265&amp;theme-id=0" frameborder="no" allowtransparency="true" allowfullscreen="true"></iframe>
                </noscript>
            </div>
            <p class="print-only"> 
                <i>See the code example on <a href="https://codepen.io/${item.id.value}">https://codepen.io/${item.id.value}</a></i>
            </p>
            `,
        stackblitz: `
            <div class="embed${cssClass}">
                <iframe class="lazy" data-src="https://stackblitz.com/edit/${item.id.value}?embed=1"></iframe>
                <noscript>
                    <iframe src="https://stackblitz.com/edit/${item.id.value}?embed=1"></iframe>
                </noscript>
            </div>
            <p class="print-only"> 
                <i>See the code example on <a href="https://stackblitz.com/edit/${item.id.value}">https://stackblitz.com/edit/${item.id.value}</a></i>
            </p>
            `,
        codesandbox: `
            <div class="embed${cssClass}">
                <iframe class="lazy" data-src="https://codesandbox.io/embed/${item.id.value}"></iframe>
                <noscript>
                    <iframe src="https://codesandbox.io/embed/${item.id.value}"></iframe>
                </noscript>
            </div>
            <p class="print-only"> 
                <i>See the code example on <a href="https://codesandbox.io/s/${item.id.value}">https://codesandbox.io/s/${item.id.value}</a></i>
            </p>
            `,
        netlify: `
            <div class="embed${cssClass}">
                <iframe class="lazy lazy--exclude-dnt" data-src="https://${netlifyId[0]}.netlify.com/${netlifyId[1]}"></iframe>
                <noscript>
                    <iframe src="https://${netlifyId[0]}.netlify.com${netlifyId[1]}"></iframe>
                </noscript>
            </div>
            <p class="print-only"> 
                <i>See the example on <a href="https://${netlifyId[0]}.netlify.com${netlifyId[1]}">https://${netlifyId[0]}.netlify.com${netlifyId[1]}</a></i>
            </p>
            `,
        giphy: `
            <div class="embed embed--giphy${cssClass}">
                <iframe class="lazy" data-src="https://giphy.com/embed/${item.id.value}"></iframe>
                <div class="embed__overlay" aria-hidden="true"></div>
                <noscript>
                    <iframe src="https://giphy.com/embed/${item.id.value}"></iframe>
                </noscript>
                <a class="embed__link" href="https://giphy.com/gifs/${item.id.value}" target="_blank">via GIPHY</a>
            </div>
            <p class="print-only"> 
                <i>See the image on <a href="https://giphy.com/embed/${item.id.value}">https://giphy.com/embed/${item.id.value}</a></i>
            </p>
            `,
    }
};

const richTextResolverTemplates = {
    embeddedContent: (item) => {
        let cssClass = '';
        let netlifyId = '';

        if (item.width.value.length) {
            switch (item.width.value[0].codename) {
                case 'n50_':
                    cssClass += ' embed--50';
                    break;
                case 'n75_':
                    cssClass += ' embed--75';
                    break;
                case 'n100_':
                    cssClass += ' embed--100';
                    break;
                default:
                    cssClass += '';
            }
        }

        if (item.provider.value.length && item.provider.value[0].codename === 'netlify') {
            netlifyId = item.id.value.trim().split(';');

            if (!netlifyId[1]) {
                netlifyId[1] = '';
            }
        }

        if (item.provider.value.length) {
            return getEmbeddedTemplate(cssClass, item, netlifyId)[item.provider.value[0].codename];
        } else {
            return '';
        }
    },
    signpost: (item) => {
        let type = '';
        let listClass = '';

        if (item.type.value.length) type = item.type.value[0].codename;
        if (type === 'platform_selection') listClass = ' selection--platforms';

        return `
            <section class="presentation__section">
                <h2 class="presentation__heading">${item.title.value}</h2>
                ${item.description.value && item.description.value !== '<p><br></p>' ? '<h3 class="presentation__sub-heading">'+ item.description.value +'</h3>' : ''}
                <ul class="selection${listClass}">
                    ${item.content.value}
                </ul>
            </section>
        `;
    },
    homeLinkToContentItem: (item, config) => {
        const urlMap = config.urlMap;
        const dpr = config.dpr ? `&dpr=${config.dpr}` : '';
        let resolvedUrl = '';

        if (item.linked_item.value[0] && urlMap) {
            resolvedUrl = urlMap.filter(elem => elem.codename === item.linked_item.value[0].system.codename)[0].url;
        }

        return `
            <li class="selection__item">
                ${resolvedUrl ? '<a class="selection__link" href="'+ resolvedUrl + '">' : '<div class="selection__link">'}
                    <div class="selection__img-sizer">
                        <img class="selection__img" src="${item.image.value[0] ? item.image.value[0].url + `?w=290&fm=jpg&auto=format${dpr}` : 'https://plchldr.co/i/290x168?&amp;bg=ededed&amp;text=Image'}">
                    </div>
                    <div class="selection__title">${item.title.value}</div>
                ${resolvedUrl ? '</a>' : '</div>'}
            </li>
        `;
    },
    callout: (item) => {
        return `
            <div class="callout callout--${item.type.value.length ? item.type.value[0].codename : ''}">
                ${item.content.value}
            </div>`;
    },
    image: (item, config) => {
        if (item.image.value.length) {
            const alt = item.image.value[0].description ? item.image.value[0].description : '';
            const url = encodeURI(item.url.value.trim());
            const dpr = config.dpr;
            const transformationQueryString = '?fm=jpg&auto=format&w=';
            let cssClass = item.border.value.length && item.border.value[0].codename === 'show' ? ' article__image-border' : '';
            cssClass += item.zoomable.value.length && item.zoomable.value[0].codename === 'true' && !url ? ' article__add-lightbox' : '';
            const openLinkTag = url ? '<a href="'+ url +'" target="_blank" class="no-icon">' : '';
            const closeLinkTag = url ? '</a>' : '';

            const attributes = getImageAttributes(item, cssClass, dpr, transformationQueryString);
            return `
                <figure>
                    ${openLinkTag}
                        <img class="article__image ${attributes.cssClass}" alt="${alt}" src="${item.image.value[0].url}${attributes.transformationQueryString}">
                    ${closeLinkTag}
                    <noscript>
                        ${openLinkTag}
                            <img class="article__image ${attributes.cssClass}" alt="${alt}" src="${item.image.value[0].url}${attributes.transformationQueryString}">
                        ${closeLinkTag}
                    </noscript>
                    ${item.description.value && item.description.value !== '<p><br></p>' ? '<figcaption>'+ item.description.value +'</figcaption>' : ''}
                </figure>`;
        }

        return '';
    },
    callToAction: (item) => {
        return `<div class="call-to-action" data-click="support"><span>${item.text.value}</span><span></span></div>`;
    },
    contentChunk: (item) => {
        const platforms = [];
        let value = item.content.value;
        item.platform.value.forEach(item => platforms.push(item.codename));
        if (platforms.length) {
            value = `<div data-platform-chunk="${platforms.join('|')}">${value}</div>`;
        }
        return value;
    },
    homeLinkToExternalUrl: (item, config) => {
        const dpr = config.dpr ? `&dpr=${config.dpr}` : '';
        return `
            <li class="selection__item">
                <a class="selection__link" href="${item.url.value}">
                    <div class="selection__img-sizer">
                        <img class="selection__img" src="${item.image.value[0] ? item.image.value[0].url + `?w=290&fm=jpg&auto=format${dpr}` : 'https://plchldr.co/i/290x168?&amp;bg=ededed&amp;text=Image'}">
                    </div>
                    <div class="selection__title">${item.title.value}</div>
                </a>
            </li>
        `;
    },
    codeSample: (item) => {
        const lang = helper.getPrismClassName(item.programming_language.value.length ? item.programming_language.value[0] : '');
        let infoBar = '<div class="infobar"><ul class="infobar__languages">';
        item.programming_language.value.forEach(item => {
            infoBar += `<li class="infobar__lang">${item.name}</li>`;
        });
        infoBar += '</ul><div class="infobar__copy"><div class="infobar__tooltip"></div></div></div>';

    return `<pre class="line-numbers" data-platform-code="${item.platform.value.length ? item.platform.value[0].codename : ''}">${infoBar}<div class="clean-code">${helper.escapeHtml(item.code.value)}</div><code class="${lang}">${helper.escapeHtml(item.code.value)}</code></pre>`;
    },
    contentSwitcher: (item) => {
        let switcher = '<div class="language-selector"><ul class="language-selector__list">';

        item.children.forEach(item => {
            switcher += `<li class="language-selector__item"><a class="language-selector__link" href="" data-platform="${item.platform.value.length ? item.platform.value[0].codename : ''}">${item.platform.value.length ? item.platform.value[0].name : ''}</a></li>`
        })
        switcher += '</ul></div>';

        return switcher;
    },
    codeSamples: (item) => {
        let codeExamples = '<div class="code-samples">';
        item.code_samples.value.forEach(item => {
            codeExamples += richTextResolverTemplates.codeSample(item);
        });
        codeExamples += '</div>';

        return codeExamples;
    },
    releaseNote: (item) => {
        const isPlanned = (new Date(item.release_date.value)).getTime() > (new Date()).getTime();
        const displaySeverity = item.severity.value[0].codename === 'breaking_change';

        let services = '';
        const servicesCodenames = [];
        item.affected_services.value.forEach((service) => {
            servicesCodenames.push(service.codename);
            services += `<li class="article__tags-item article__tags-item--green">${service.name}</li>`;
        });

        return `
            <div class="mix ${servicesCodenames.join(' ')} ${item.severity.value[0].codename} all_changes">
                <h2>${item.title.value}</h2>
                <div class="article__info-bar">
                    <time class="article__date article__date--body" datetime="${moment(item.release_date.value).format('YYYY-MM-DD')}">${isPlanned ? 'Planned for ': ''}${moment(item.release_date.value).format('MMMM D, YYYY')}</time>
                    ${displaySeverity || services ? `
                        <ul class="article__tags">
                            ${displaySeverity ? `<li class="article__tags-item article__tags-item--red">${item.severity.value[0].name}</li>` : ''}
                            ${services}
                        </ul>` : ''}
                </div>
                ${item.content.value}
            </div>
        `;
    },
    releaseNoteRSS: (item, config) => {
        const anchorName = item.title.value.toLowerCase().replace(/(<([^>]+)>)/ig, '').replace(/&[^\s]*;/g, '').replace(/\W/g, '-').replace(/[-]+/g, '-');
        const url = `${helper.getDomain(config.protocol, config.host)}${config.customField.url}#a-${anchorName}`;
        return `<item>
            <title>${item.title.value}</title>
            <pubDate>${moment(item.system.lastModified).format('ddd, DD MMM YYYY HH:mm:ss ZZ')}</pubDate>
            <atom:updated>${moment(item.system.lastModified).format('YYYY-MM-DDTHH:mm:ssZ')}</atom:updated>
            <description>
                <![CDATA[${entities.decode(helper.stripTags(item.content.value).trim().replace(/(\r\n|\n|\r)/gm, ''))}]]>
            </description>
            <link>${url}</link>
            <guid isPermaLink="false">${url}</guid>
        </item>`;
    }
};

module.exports = richTextResolverTemplates;
