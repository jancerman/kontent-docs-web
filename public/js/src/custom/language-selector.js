(() => {
    const updatePlatformInUrls = (platform) => {
        const links = document.querySelectorAll('[data-lang]');

        links.forEach(item => {
            const href = item.getAttribute('href').split('?');
            const path = href[0];
            let qs = href[1] ? href[1].split('#')[0] : null;
            const hash = href[1] ? href[1].split('#')[1] : null;

            if (qs) {
                qs = qs.split('&');
                qs = qs.map(item => {
                    if (item.indexOf('tech') === 0) {
                        item = 'tech=' + platform;
                    }
                    return item;
                });
                qs.join('&');
            } else {
                qs = 'tech=' + platform;
            }

            item.setAttribute('href', `${path}${qs ? '?' + qs : ''}${hash ? '#' + hash : ''}`);
        });
    };

    const highlightSelector = (articleContent, e) => {
        const fixedLabel = document.querySelector('.language-selector__label');
        let textTofixedLabel;

        if (e) {
            window.helper.setCookie('KCDOCS.preselectedLanguage', e.target.getAttribute('data-platform'));
            articleContent.querySelectorAll('.language-selector__link--active').forEach(item => item.classList.remove('language-selector__link--active'));
            articleContent.querySelectorAll(`[data-platform=${e.target.getAttribute('data-platform')}]`).forEach(item => item.classList.add('language-selector__link--active'));
            updatePlatformInUrls(e.target.getAttribute('data-slug'));
            textTofixedLabel = e.target.innerHTML;
        } else {
            const preselectedPlatform = window.helper.getCookie('KCDOCS.preselectedLanguage');
            const preselectedElem = document.querySelectorAll(`[data-platform="${preselectedPlatform}"]`);

            if (preselectedPlatform && preselectedElem.length) {
                preselectedElem.forEach(item => {
                    item.classList.add('language-selector__link--active');
                });

                textTofixedLabel = preselectedElem[0].innerHTML;
            } else {
                const firstPlatformElem = document.querySelectorAll('.language-selector__item:first-child .language-selector__link');
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
            const activeLink = document.querySelector('.language-selector__link--active');
            if (activeLink) {
                selectedPlatform = activeLink.getAttribute('data-platform');
            }
        }

        return selectedPlatform;
    };

    const toggleBlock = (e, attribute, allowEmpty, selectorCompare) => {
        const selectedPlatform = getSelectedPlatform(e);
        let selectorToGetVisible = `[${attribute}${selectorCompare}"${selectedPlatform}"]`;

        if (allowEmpty) {
            selectorToGetVisible += `, [${attribute}=""]`;
        }
        document.querySelectorAll(`[${attribute}]:not([${attribute}=""])`).forEach(item => item.classList.add('hidden'));
        document.querySelectorAll(selectorToGetVisible).forEach(item => item.classList.remove('hidden'));
    }

    const selectCode = (e) => {
        toggleBlock(e, 'data-platform-code', false, '=');
    };

    const switchContentChunk = (e) => {
        toggleBlock(e, 'data-platform-chunk', true, '*=');
    };

    const removeParameterfromUrlSearch = (urlSearch, param) => {
        urlSearch = urlSearch.replace('?', '').split('&');
        urlSearch = urlSearch.filter(item => item.indexOf(param) !== 0 && item !== '');
        return urlSearch.length ? '?' + urlSearch.join('&') : '';
    };

    const replaceLanguageInUrl = (e) => {
        const selectedPlatform = e.target.getAttribute('data-slug');
        const url = window.location;
        let path = url.href.split(/[?#]/)[0];

        path = path + '?tech=' + selectedPlatform + removeParameterfromUrlSearch(url.search, 'tech').replace('?', '&') + url.hash;

        if (history && history.replaceState) {
            history.replaceState({}, null, path);
        }
    };

    const getScrollPosition = () => {
        const doc = document.documentElement;
        return window.pageYOffset || doc.scrollTop;
    };

    const getFirstElemInViewport = (selector) => {
        const elements = document.querySelectorAll(selector);
        for (var i = 0; i < elements.length; i++) {
            if ((elements[i].getBoundingClientRect().top >= 0) && (elements[i].offsetWidth > 0 && elements[i].offsetHeight > 0)) {
                return elements[i];
            }
        }
        return null;
    };

    const actionLanguageOnClick = (e, articleContent) => {
        highlightSelector(articleContent, e);
        selectCode(e);
        switchContentChunk(e);
        replaceLanguageInUrl(e);
        document.querySelectorAll(`pre[data-platform-code=${e.target.getAttribute('data-platform')}] code`).forEach((item) => {
            window.Prism.highlightElement(item);
        });
    };

    const handleLanguageSelection = (e, articleContent) => {
        if (e.target && e.target.matches('.language-selector__link')) {
            e.preventDefault();

            let offsetTarget = e.target;
            let prevElemOffset;
            let scrollPosition;
            let newElemOffset;

            if (window.helper.findAncestor(offsetTarget, '.language-selector--fixed')) {
                offsetTarget = getFirstElemInViewport('.language-selector--code-block');
            }

            if (offsetTarget) {
                prevElemOffset = offsetTarget.getBoundingClientRect().top;
            }

            actionLanguageOnClick(e, articleContent);

            if (offsetTarget) {
                scrollPosition = getScrollPosition();
                newElemOffset = offsetTarget.getBoundingClientRect().top;
                window.scrollTo(0, scrollPosition - (prevElemOffset - newElemOffset));
            }
        }
    };

    const selectLanguageOnClick = (articleContent) => {
        articleContent.addEventListener('click', (e) => {
            handleLanguageSelection(e, articleContent);
        });
    };

    const hidePlaformInContentChunk = (item, languageSelector) => {
        const chunkParent = window.helper.findAncestor(item, '[data-platform-chunk]');

        if (chunkParent) {
            const languageSelectorItems = languageSelector.querySelectorAll('.language-selector__link');
            const chunkPlatforms = chunkParent.getAttribute('data-platform-chunk').split('|');
            languageSelectorItems.forEach((elem) => {
                const elemParent = window.helper.findAncestor(elem, '.language-selector__item');
                elemParent.style.display = 'none';
                if (chunkPlatforms.indexOf(elem.getAttribute('data-platform')) > -1) {
                    elemParent.style.display = 'block';
                }
            });
        }

        return languageSelector;
    };

    const showAllPlatformsInContentChunk = (languageSelector) => {
        const languageSelectorItems = languageSelector.querySelectorAll('.language-selector__link');
        languageSelectorItems.forEach((elem) => {
            const elemParent = window.helper.findAncestor(elem, '.language-selector__item');
            elemParent.style.display = 'block';
        });

        return languageSelector;
    };

    const cloneLanguageSelectorToCodeBlocks = () => {
        let languageSelector = document.querySelector('.language-selector');

        if (languageSelector && languageSelector.querySelector('.language-selector__list:not(.language-selector__list--static)') && languageSelector.querySelector('.language-selector__list').childNodes.length > 1) {
            languageSelector = languageSelector.cloneNode(true);
            const codeBlocks = document.querySelectorAll('*:not([data-platform-code]) + [data-platform-code]:not([data-platform-code=""]), [data-platform-code]:first-child:not([data-platform-code=""])');

            languageSelector.classList.add('language-selector--code-block');

            codeBlocks.forEach(item => {
                languageSelector = hidePlaformInContentChunk(item, languageSelector);

                const clonedSelector = item.parentNode.insertBefore(languageSelector, item);
                languageSelector = clonedSelector.cloneNode(true);

                languageSelector = showAllPlatformsInContentChunk(languageSelector);
            });
        }
    };

    const cloneLanguageSelectorToFixed = () => {
        let languageSelector = document.querySelector('.language-selector');

        if (languageSelector) {
            languageSelector = languageSelector.cloneNode(true);
            const content = document.querySelector('.article__content');

            languageSelector.classList.add('language-selector--fixed');
            var label = document.createElement('div');
            label.classList.add('language-selector__label');
            languageSelector.insertBefore(label, languageSelector.firstChild);

            var text = document.createElement('label');
            text.classList.add('language-selector__fixed-label');
            text.innerHTML = window.UIMessages && window.UIMessages.technologyLabel ? window.UIMessages.technologyLabel : 'Technology';
            languageSelector.insertBefore(text, languageSelector.firstChild);

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
        const selector = document.querySelector('.language-selector--fixed');
        const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        if (viewportWidth >= 1150 && selector) {
            const topOffset = ((window.pageYOffset || document.scrollTop) - (document.clientTop || 0)) || 0;
            const mainSelector = document.querySelector('.language-selector');
            const isTop = topOffset <= mainSelector.getBoundingClientRect().top + mainSelector.offsetHeight + window.scrollY;

            if (isTop) {
                selector.classList.remove('language-selector--visible');
            } else {
                selector.classList.add('language-selector--visible');
            }
        }
    };

    const copyCode = () => {
        const articleContent = document.querySelector('.article__content');

        if (articleContent) {
            const copyTooltips = articleContent.querySelectorAll('.infobar__tooltip');

            copyTooltips.forEach(item => {
                item.innerHTML = (window.UIMessages ? window.UIMessages.copyCode : '');
            });

            articleContent.addEventListener('click', (e) => {
                if (e.target && e.target.matches('.infobar__copy')) {
                    e.preventDefault();
                    const textElem = e.target.querySelector('.infobar__tooltip');
                    const text = textElem.innerHTML;
                    textElem.innerHTML = (window.UIMessages ? window.UIMessages.copyCodeActive : '');
                    setTimeout(() => {
                        textElem.innerHTML = text;
                    }, 1500);
                    const code = window.helper.findAncestor(e.target, 'pre').querySelector('.clean-code').innerHTML;
                    window.helper.copyToClipboard(window.helper.htmlDecode(code));
                }
            });
        }
    };

    const selectLanguage = () => {
        const articleContent = document.querySelector('.article__content');
        const selector = document.querySelectorAll('.language-selector__list:not(.language-selector__list--static)');

        if (selector.length) {
            highlightSelector();
            selectCode();
            switchContentChunk();
            selectLanguageOnClick(articleContent);
        } else {
            const fixedLabel = document.querySelector('.language-selector__label');
            const activeSelector = document.querySelector('.language-selector__link--active');
            if (fixedLabel && activeSelector) {
                fixedLabel.innerHTML = activeSelector.innerHTML;
            }
        }
    };

    const makeInfobarsVisible = () => {
        const infobars = document.querySelectorAll('.infobar');

        if (infobars.length) {
            infobars.forEach(item => {
                item.classList.add('infobar--visible');
            });
        }
    };

    const findAndRemoveFromArray = (array, item) => {
        const index = array.indexOf(item);
        if (index > -1) {
          array.splice(index, 1);
        }
        return array;
    };

    const handleEmptyPlatforms = () => {
        const codeBlocks = document.querySelectorAll('.code-samples');
        const message = window.UIMessages && window.UIMessages.emptyCodeBlock ? window.UIMessages.emptyCodeBlock : 'We don\'t have a code sample for the selected technology.';

        codeBlocks.forEach((block) => {
            let availablePlatforms = [...block.querySelectorAll('[data-platform]')].map((item) => {
                return item.getAttribute('data-platform');
            });

            const availableCodeBlocks = [...block.querySelectorAll('[data-platform-code]')].map((item) => {
                return item.getAttribute('data-platform-code');
            });

            availableCodeBlocks.forEach((item) => {
                availablePlatforms = findAndRemoveFromArray(availablePlatforms, item);
            });

            let emptyBlocks = '';
            availablePlatforms.forEach((platform) => {
                emptyBlocks += `<pre class="code-samples__empty" data-platform-code="${platform}"><div class="code-samples__text">${message}</div></pre>`;
                block.querySelector(`[data-platform="${platform}"]`).classList.add('language-selector__empty');
            });

            block.innerHTML = block.innerHTML + emptyBlocks;
        });
    };

    cloneLanguageSelectorToCodeBlocks();
    cloneLanguageSelectorToFixed();
    handleEmptyPlatforms();
    handleFixedSelector();
    window.addEventListener('scroll', handleFixedSelector, window.supportsPassive ? { passive: true } : false);
    selectLanguage();
    copyCode();
    setTimeout(() => {
        makeInfobarsVisible();
    }, 0);
})();
