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
        let fixedLabel = document.querySelector('.language-selector__label'); 
        let textTofixedLabel;
        
        if (e) {  
            helper.setCookie('KCDOCS.preselectedLanguage', e.target.getAttribute('data-platform'));
            articleContent.querySelectorAll('.language-selector__link--active').forEach(item => item.classList.remove('language-selector__link--active'));
            articleContent.querySelectorAll(`[data-platform=${e.target.getAttribute('data-platform')}]`).forEach(item => item.classList.add('language-selector__link--active'));
            updatePlatformInUrls(e.target.getAttribute('data-slug'));
            textTofixedLabel = e.target.innerHTML;
        } else {
            let preselectedPlatform = helper.getCookie('KCDOCS.preselectedLanguage');
            let preselectedElem = document.querySelectorAll(`[data-platform="${preselectedPlatform}"]`);

            if (preselectedPlatform && preselectedElem.length) {
                preselectedElem.forEach(item => {
                    item.classList.add('language-selector__link--active');
                });

                textTofixedLabel = preselectedElem[0].innerHTML;
            } else {
                let firstPlatformElem = document.querySelectorAll('.language-selector__item:first-child .language-selector__link');
                firstPlatformElem.forEach(item => {
                    item.classList.add('language-selector__link--active'); 
                });

                if (firstPlatformElem.length) {
                    textTofixedLabel = firstPlatformElem[0].innerHTML;
                }
            }
        }

        if (fixedLabel && textTofixedLabel) {
            fixedLabel.innerHTML = textTofixedLabel;
        }

    };

    const getSelectedPlatform = (e) => {
        let selectedPlatform;

        if (e) {
            selectedPlatform = e.target.getAttribute('data-platform');
        } else {
            let activeLink = document.querySelector('.language-selector__link--active');
            if (activeLink) {
                selectedPlatform = activeLink.getAttribute('data-platform');
            }
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

    const replaceLanguageInUrl = (e) => {
        let selectedPlatform = e.target.getAttribute('data-slug');
        let url = window.location;
        let path = url.href.split(/[?#]/)[0];

        path = path + '?lang=' + selectedPlatform + removeParameterfromUrlSearch(url.search, 'lang').replace('?', '&') + url.hash;

        if (history && history.replaceState) {
            history.replaceState({}, null, path);
        }
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

    const cloneLanguageSelectorToCodeBlocks = () => {
        let languageSelector = document.querySelector('.language-selector');

        if (languageSelector && languageSelector.querySelector('.language-selector__list:not(.language-selector__list--static)')) {
            languageSelector = languageSelector.cloneNode(true);
            let codeBlocks = document.querySelectorAll('*:not([data-platform-code]) + [data-platform-code]');

            languageSelector.classList.add('language-selector--code-block');
    
            codeBlocks.forEach(item => {
                let clonedSelector = item.parentNode.insertBefore(languageSelector, item);
                languageSelector = clonedSelector.cloneNode(true);
            });
        }
    };

    const cloneLanguageSelectorToFixed = () => {
        let languageSelector = document.querySelector('.language-selector');

        if (languageSelector) {
            languageSelector = languageSelector.cloneNode(true);
            let content = document.querySelector('.article__content');

            languageSelector.classList.add('language-selector--fixed');
            var label = document.createElement('div');
            label.classList.add('language-selector__label');
    
            languageSelector.insertBefore(label, languageSelector.firstChild);
            
            document.querySelector('body').addEventListener('click', (e) => {
                if (e.target && e.target.matches('.language-selector--fixed .language-selector__label')) {
                    if (languageSelector.classList.contains('language-selector--opened')) {
                        languageSelector.classList.remove('language-selector--opened');
                    } else {
                        languageSelector.classList.add('language-selector--opened');
                    }
                } else {
                    languageSelector.classList.remove('language-selector--opened');
                }
            });
    
            content.appendChild(languageSelector);
        }
    };

    const handleFixedSelector = () => {
        let selector = document.querySelector('.language-selector--fixed');
        let viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        if (viewportWidth >= 1150 && selector) {
            let topOffset = ((window.pageYOffset || document.scrollTop) - (document.clientTop || 0)) || 0;
            let mainSelector = document.querySelector('.language-selector');
            let isTop = topOffset <= mainSelector.getBoundingClientRect().top + mainSelector.offsetHeight + window.scrollY;

            if (isTop) {
                selector.classList.remove('language-selector--visible');
            } else {
                selector.classList.add('language-selector--visible');
            }
        }
    };

    const copyCode = () => {
        let articleContent = document.querySelector('.article__content');

        if (articleContent) {
            let copyButtons = articleContent.querySelectorAll('.infobar__copy');

            copyButtons.forEach(item => {
                item.innerHTML = (UIMessages ? UIMessages.copyCode : '');
            });
        
            articleContent.addEventListener('click', (e) => {
                if (e.target && e.target.matches('.infobar__copy')) {
                    e.preventDefault();
                    let text = e.target.innerHTML;
                    e.target.innerHTML = (UIMessages ? UIMessages.copyCodeActive : '');
                    setTimeout(() => {
                        e.target.innerHTML = text;
                    }, 1500);
                    let code = helper.findAncestor(e.target, 'pre').querySelector('.clean-code').innerHTML;
                    helper.copyToClipboard(helper.htmlDecode(code));
                }
            });
        }
    };

    const selectLanguage = () => {
        let articleContent = document.querySelector('.article__content');
        let selector = document.querySelectorAll('.language-selector__list:not(.language-selector__list--static)');
        
        if (selector.length) {
            highlightSelector();
            selectCode();
            switchContentChunk();
            selectLanguageOnClick(articleContent);
        } else {
            let fixedLabel = document.querySelector('.language-selector__label'); 
            let activeSelector = document.querySelector('.language-selector__link--active');
            if (fixedLabel && activeSelector) {
                fixedLabel.innerHTML = activeSelector.innerHTML;
            }
        }
    };

    const makeInfobarsVisible = () => {
        let infobars = document.querySelectorAll('.infobar');

        if (infobars.length) {
            infobars.forEach(item => {
                item.classList.add('infobar--visible');
            });
        }
    };

    cloneLanguageSelectorToCodeBlocks();
    cloneLanguageSelectorToFixed();
    handleFixedSelector();
    window.addEventListener('scroll', handleFixedSelector, supportsPassive ? { passive: true } : false);
    selectLanguage();
    copyCode();
    makeInfobarsVisible();
})();