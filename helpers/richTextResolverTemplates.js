const helper = require('./helperFunctions');

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

        if (item.provider.value[0].codename === 'netlify') {
            netlifyId = item.id.value.trim().split(';');

            if (!netlifyId[1]) {
                netlifyId[1] = '';
            }
        }

        const templates = {
            youtube: `
                <div class="embed${cssClass}">
                    <iframe class="lazy" width="560" height="315" data-src="https://www.youtube-nocookie.com/embed/${item.id.value}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen="">
                    <noscript>
                        <iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${item.id.value}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen="">
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
                    <iframe class="lazy" data-src="https://${netlifyId[0]}.netlify.com/${netlifyId[1]}"></iframe>
                    <noscript>
                        <iframe src="https://${netlifyId[0]}.netlify.com${netlifyId[1]}"></iframe>
                    </noscript>
                </div>
                <p class="print-only"> 
                    <i>See the code example on <a href="https://${netlifyId[0]}.netlify.com${netlifyId[1]}">https://${netlifyId[0]}.netlify.com${netlifyId[1]}</a></i>
                </p>
                `
        };

        return templates[item.provider.value[0].codename];
    },
    signpost: (item) => {
        let type = '';
        let listClass = '';

        if (item.type.value[0]) type = item.type.value[0].codename;
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
    homeLinkToContentItem: (item, urlMap) => {
        let resolvedUrl = '';

        if (item.linked_item[0]) {
            resolvedUrl = urlMap.filter(elem => elem.codename === item.linked_item[0].system.codename)[0].url;
        }

        return `
            <li class="selection__item">
                ${resolvedUrl ? '<a class="selection__link" href="'+ resolvedUrl + '">' : '<div class="selection__link">'}
                    <div class="selection__img-sizer">
                        <img class="selection__img" src="${item.image.value[0] ? item.image.value[0].url + '?w=290&fm=jpg&auto=format' : 'https://plchldr.co/i/290x168?&amp;bg=ededed&amp;text=Image'}">
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
    image: (item) => {
        if (item.image.value[0]) {
            let alt = item.image.value[0].description ? item.image.value[0].description : '';
            let url = encodeURI(item.url.value.trim());
            let transformationQueryString = '?fm=jpg&auto=format&w=';
            let cssClass = item.border.value[0].codename === 'show' ? ' article__image-border' : '';
            cssClass += item.zoomable.value[0].codename === 'true' && !url ? ' article__add-lightbox' : '';
            let openLinkTag = url ? '<a href="'+ url +'" target="_blank" class="no-icon">' : '';
            let closeLinkTag = url ? '</a>' : '';

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

            if (item.image.value[0].url.endsWith('.gif')) {
                transformationQueryString = '';
            }

            return `
                <figure>
                    ${openLinkTag}
                        <img class="${cssClass}" alt="${alt}" src="${item.image.value[0].url}${transformationQueryString}">
                    ${closeLinkTag}
                    <noscript>
                        ${openLinkTag}
                            <img class="article__image-border" alt="${alt}" src="${item.image.value[0].url}${transformationQueryString}">
                        ${closeLinkTag}
                    </noscript>
                    ${item.description.value && item.description.value !== '<p><br></p>' ? '<figcaption>'+ item.description.value +'</figcaption>' : ''}
                </figure>`;
        }

        return ``;
    },
    callToAction: (item) => {
        return `<div class="call-to-action" data-click="support">${item.text.value}</div>`;
    },
    contentChunk: (item) => {
        let platforms = [];
        let value = item.content.value;
        item.platform.value.forEach(item => platforms.push(item.codename));
        if (platforms.length) {
            value = `<div data-platform-chunk="${platforms.join('|')}">${value}</div>`;
        }
        return value;
    },
    homeLinkToExternalUrl: (item) => {
        return `
            <li class="selection__item">
                <a class="selection__link" href="${item.url.value}">
                    <div class="selection__img-sizer">
                        <img class="selection__img" src="${item.image.value[0] ? item.image.value[0].url + '?w=290&fm=jpg&auto=format' : 'https://plchldr.co/i/290x168?&amp;bg=ededed&amp;text=Image'}">
                    </div>
                    <div class="selection__title">${item.title.value}</div>
                </a>
            </li>
        `;
    },
    codeSample: (item) => {
        const lang = helper.getPrismClassName(item.programming_language.value[0]);
        let infoBar = '<div class="infobar"><ul class="infobar__languages">';
        item.programming_language.value.forEach(item => {
            infoBar += `<li class="infobar__lang">${item.name}</li>`;
        });
        infoBar += `</ul><div class="infobar__copy"></div></div>`;

    return `<pre class="line-numbers" data-platform-code="${item.platform.value[0] ? item.platform.value[0].codename : ''}">${infoBar}<div class="clean-code">${helper.escapeHtml(item.code.value)}</div><code class="${lang}">${helper.escapeHtml(item.code.value)}</code></pre>`;
    },
    contentSwitcher: (item) => {
        let switcher = '<div class="language-selector"><ul class="language-selector__list">';

        item.children.forEach(item => {
            switcher += `<li class="language-selector__item"><a class="language-selector__link" href="" data-platform="${item.platform.value[0].codename}">${item.platform.value[0].name}</a></li>`
        })
        switcher += '</ul></div>';

        return switcher;
    },
    codeSamples: (item) => {
        let codeExamples = '<div class="code-samples">';
        item.code_samples.forEach(item => {
            codeExamples += richTextResolverTemplates.codeSample(item);
        });
        codeExamples += '</div>';

        return codeExamples;
    },
};

module.exports = richTextResolverTemplates;
