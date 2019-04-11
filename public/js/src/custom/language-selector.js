(() => {
    const updatePlatformInUrls = (platform) => {
        let links = document.querySelectorAll('[data-lang]');

        links.forEach(item => {
            let href = item.getAttribute('href').split('?');
            let path = href[0];
            let qs = href[1] ? href[1].split('#')[0] : null;
            let hash = href[1] ? href[1].split('#')[1] : null;

            if (qs) {
                qs = qs.split('&');
                qs = qs.map(item => {
                    if (item.indexOf('lang') === 0) {
                        item = 'lang=' + platform;
                    }
                    return item;
                });
                qs.join('&');
            } else {
                qs = 'lang=' + platform;
            }

            item.setAttribute('href', `${path}${qs ? '?' + qs : ''}${hash ? '#' + hash : ''}`);
        });
    };

    const highlightSelector = (articleContent, e) => {  
        if (e) {  
            helper.setCookie('KCDOCS.preselectedLanguage', e.target.getAttribute('data-platform'));
            articleContent.querySelectorAll('.language-selector__link--active').forEach(item => item.classList.remove('language-selector__link--active'));
            articleContent.querySelectorAll(`[data-platform=${e.target.getAttribute('data-platform')}]`).forEach(item => item.classList.add('language-selector__link--active'));
            updatePlatformInUrls(e.target.getAttribute('data-slug'));
        } else {
            let preselectedPlatform = helper.getCookie('KCDOCS.preselectedLanguage');
            let preselectedElem = document.querySelectorAll(`[data-platform="${preselectedPlatform}"]`);

            if (preselectedPlatform && preselectedElem.length) {
                preselectedElem.forEach(item => {
                    item.classList.add('language-selector__link--active');
                });
            } else {
                let firstPlatformElem = document.querySelectorAll('.language-selector__link:first-child');
                firstPlatformElem.forEach(item => {
                    item.classList.add('language-selector__link--active'); 
                });
            }
        }
    };

    const getSelectedPlatform = (e) => {
        let selectedPlatform;

        if (e) {
            selectedPlatform = e.target.getAttribute('data-platform');
        } else {
            selectedPlatform = document.querySelector('.language-selector__link--active').getAttribute('data-platform');
        }

        return selectedPlatform;
    };

    const toggleBlock = (e, attribute, allowEmpty, selectorCompare) => {
        let selectedPlatform = getSelectedPlatform(e);
        let selectorToGetVisible = `[${attribute}${selectorCompare}"${selectedPlatform}"]`;

        if (allowEmpty) {
            selectorToGetVisible += `, [${attribute}=""]`;
        }
        document.querySelectorAll(`[${attribute}]`).forEach(item => item.classList.add('hidden'));
        document.querySelectorAll(selectorToGetVisible).forEach(item => item.classList.remove('hidden'));
    }

    const selectCode = (e) => {
        toggleBlock(e, 'data-platform-code', false, '=');
    };

    const switchContentChunk = (e) => {
        toggleBlock(e, 'data-platform-chunk', true, '*=');
    };

    const selectLanguageOnClick = (articleContent) => {
        const actionOnClick = (e) => {
            highlightSelector(articleContent, e);
            selectCode(e);
            switchContentChunk(e);
            replaceLanguageInUrl(e);
            document.querySelectorAll(`pre[data-platform-code=${e.target.getAttribute('data-platform')}] code`).forEach((item) => {
                Prism.highlightElement(item);
            });
        };

        articleContent.addEventListener('click', (e) => {
            if (e.target && e.target.matches('.language-selector__link')) {
                e.preventDefault();
                actionOnClick(e, articleContent);
            }
        });
    };
    const removeParameterfromUrlSearch = (urlSearch, param) => {
        urlSearch = urlSearch.replace('?', '').split('&');
        urlSearch = urlSearch.filter(item => item.indexOf(param) !== 0 && item !== '');
        return urlSearch.length ? '?' + urlSearch.join('&') : '';
    };

    const replaceLanguageInUrl = (e) => {
        let selectedPlatform = e.target.getAttribute('data-slug');
        let url = window.location;
        let path = url.href.split(/[?#]/)[0];

        path = path + '?lang=' + selectedPlatform + removeParameterfromUrlSearch(url.search, 'lang').replace('?', '&') + url.hash;

        if (history && history.replaceState) {
            history.replaceState({}, null, path);
        }
    };

    const cloneLanguageSelectorToCodeBlocks = () => {
        let languageSelector = document.querySelector('.language-selector').cloneNode(true);

        if (languageSelector.querySelector('.language-selector__list:not(.language-selector__list--static)')) {
            let codeBlocks = document.querySelectorAll('*:not([data-platform-code]) + [data-platform-code]');

            languageSelector.classList.add('language-selector--code-block');
    
            codeBlocks.forEach(item => {
                let clonedSelector = item.parentNode.insertBefore(languageSelector, item);
                languageSelector = clonedSelector.cloneNode(true);
            });
        }
    };

    const copyCode = () => {
        let articleContent = document.querySelector('.article__content');

        articleContent.addEventListener('click', (e) => {
            if (e.target && e.target.matches('.infobar__copy')) {
                e.preventDefault();
                let text = e.target.innerHTML;
                e.target.innerHTML = 'Code copied to clipboard';
                setTimeout(() => {
                    e.target.innerHTML = text;
                }, 1500);
                let code = helper.findAncestor(e.target, 'pre').querySelector('.clean-code').innerHTML;
                helper.copyToClipboard(helper.htmlDecode(code));
            }
        });
    };

    const selectLanguage = () => {
        let articleContent = document.querySelector('.article__content');
        let selector = document.querySelectorAll('.language-selector__list:not(.language-selector__list--static)');
        
        if (selector.length) {
            highlightSelector();
            selectCode();
            switchContentChunk();
            selectLanguageOnClick(articleContent);
        }
    };


    cloneLanguageSelectorToCodeBlocks();
    selectLanguage();
    copyCode();
})();