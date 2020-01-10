/**
 * Table of contents, heading anchros, copy anchor URL to clipboard
 */

(() => {
    const articleContent = document.querySelector('.article__content');
    const tableOfContentsWrapper = document.querySelector('.table-of-contents__list');
    const tableOfContentsElem = document.querySelector('.table-of-contents');
    const anchorsOnly = document.querySelector('.article__content--anchors-only');
    let affixHeadings;
    let tableOfContentsElemFixed;

    // For all sub-headings set unique id and create the copy to clipboard icon
    const createAnchors = () => {
        const headings = articleContent.querySelectorAll('h2:not(.table-of-contents__heading):not(.feedback__heading), h3, h4');
        const anchorNameList = [];

        headings.forEach((item) => {
            const anchorName = item.innerHTML.toLowerCase().replace(/(<([^>]+)>)/ig, '').replace(/&[^\s]*;/g, '').replace(/\W/g, '-').replace(/[-]+/g, '-');
            anchorNameList.push(anchorName);

            let anchorNameCount = 0;
            anchorNameList.forEach((name) => {
                if (name === anchorName) {
                    anchorNameCount += 1;
                }
            });

            item.setAttribute('id', `a-${anchorName}${anchorNameCount > 1 ? `-${anchorNameCount}` : ''}`);
            item.innerHTML = `${item.innerHTML}<span class="anchor-copy" aria-hidden="true"><span class="anchor-copy__tooltip"></span></span>`;
        });
    };

    // Make all icons copy the headings URL to clipboard and show appropriate message in tooltip
    const copyAnchorClipboard = () => {
        const anchors = document.querySelectorAll('.anchor-copy');

        anchors.forEach((item) => {
            item.addEventListener('click', () => {
                const hash = item.parentElement.getAttribute('id');
                const url = window.location.href.split('#')[0];
                window.helper.copyToClipboard(`${url}#${hash}`);

                const tooltip = item.querySelector('.anchor-copy__tooltip');
                tooltip.classList.add('anchor-copy__tooltip--active');
                setTimeout(() => {
                    tooltip.classList.remove('anchor-copy__tooltip--active');
                }, 1500);
            })
        });
    };

    // Scroll to anchor on page load. Init all lazy loading elements to be able to scroll to the correct position
    const anchorOnLoad = () => {
        const hash = window.location.href.split('#')[1];

        if (hash) {
            // Load all lazy elements
            const lazyloadElems = document.querySelectorAll('.lazy');
            lazyloadElems.forEach((elem) => {
                elem.src = elem.dataset.src;
                elem.classList.remove('lazy');
                elem.removeAttribute('data-src');
            });

            setTimeout(() => {
                document.getElementById(hash).scrollIntoView({
                    block: 'start',
                    behavior: 'smooth'
                });
            }, 200);
        }
    };

    // For all sub-headings create a list cascade representing table of contents and append it to the appropriate element
    const createTableOfContents = () => {
        const headings = articleContent.querySelectorAll('h2:not(.table-of-contents__heading):not(.table-of-contents__whatsnext):not(.feedback__heading)');
        let tableOfContents = '';
        let prevHeadingLevel = 2;
        headings.forEach(item => {
            const headingLevel = parseInt(item.tagName.replace('H', ''));

            if (prevHeadingLevel > headingLevel) {
                tableOfContents += '</ul>';
            }

            if (prevHeadingLevel < headingLevel) {
                tableOfContents += '<ul>';
            }

            tableOfContents += `<li><a href="#${item.getAttribute('id')}">${item.innerHTML}</a></li>`;

            prevHeadingLevel = headingLevel;
        });

        tableOfContentsWrapper.innerHTML = tableOfContents;

        if (tableOfContentsWrapper.innerHTML) {
            tableOfContentsElem.classList.add('table-of-contents--render');
        }

        affixHeadings = headings;
    };

    // Scroll to appropriate anchor when a table of content items gets clicked
    const bindSmothScroll = () => {
        const tocs = document.querySelectorAll('.table-of-contents__list');
        for (let i = 0; i < tocs.length; i++) {
            tocs[i].addEventListener('click', (event) => {
                if (event.target && event.target.nodeName === 'A') {
                    event.preventDefault();
                    document.querySelector(event.target.getAttribute('href')).scrollIntoView({
                        block: 'start',
                        behavior: 'smooth'
                    });
                    history.replaceState(undefined, undefined, `${event.target.getAttribute('href')}`);
                }
            });
        }
    };

    const toggleItemsFromWithinContentChunks = () => {
        const run = () => {
            let chunks = document.querySelectorAll('[data-platform-chunk]');

            chunks = Array.prototype.slice.call(chunks).filter((chunk) => {
                return chunk.classList.contains('hidden');
            });

            const ids = [];

            chunks.forEach((chunk) => {
                const headings = chunk.querySelectorAll('h2[id]');
                headings.forEach((heading) => {
                    ids.push(heading.getAttribute('id'));
                });
            });

            const tocItems = document.querySelectorAll('.table-of-contents__list li a');
            tocItems.forEach((item) => {
                if (ids.indexOf(item.getAttribute('href').replace('#', '')) > -1) {
                    item.classList.add('hidden');
                } else {
                    item.classList.remove('hidden');
                }
            });
        };

        run();

        document.querySelector('body').addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('language-selector__link')) {
                run();
            }
        });
    };

    const cloneToFixed = () => {
        let toc = document.querySelector('.table-of-contents');

        if (toc) {
            toc = toc.cloneNode(true);
            const content = document.querySelector('.article__content');

            toc.classList.add('table-of-contents--fixed');
            content.appendChild(toc);
            tableOfContentsElemFixed = document.querySelector('.table-of-contents--fixed');
        }
    };

    const handleFixed = () => {
        const selector = document.querySelector('.table-of-contents--fixed');
        const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        if (viewportWidth >= 1150 && selector) {
            const topOffset = ((window.pageYOffset || document.scrollTop) - (document.clientTop || 0)) || 0;
            const main = document.querySelector('.table-of-contents');
            const isTop = topOffset <= main.getBoundingClientRect().top + main.offsetHeight + window.scrollY;

            if (isTop) {
                selector.classList.remove('table-of-contents--visible');
            } else {
                selector.classList.add('table-of-contents--visible');
            }
        }
    };

    const arrayMin = (arr) => {
        let len = arr.length;
        let min = Infinity;
        let minIndex = 0;

        while (len--) {
            if (arr[len][0] < min) {
                min = arr[len][0];
                minIndex = len;
            }
        }

        return arr[minIndex];
    };

    const filterNonHiddenHeadings = (headings) => {
        const nonHidden = [];

        for (let i = 0; i < headings.length; i++) {
            if (!headings[i].parentElement.classList.contains('hidden')) {
                nonHidden.push(headings[i]);
            }
        }

        return nonHidden;
    };

    const getNextHeadingPosition = (nextHeading) => {
        let position;

        if (nextHeading) {
            position = Math.floor(nextHeading.getBoundingClientRect().top);
        } else {
            const body = document.body;
                const html = document.documentElement;
            position = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        }

        return position;
    };

    const affix = () => {
        let headingsPosition = [];
        if (affixHeadings && tableOfContentsElemFixed) {
            const affixHeadingsLocal = filterNonHiddenHeadings(affixHeadings);

            for (let i = 0; i < affixHeadingsLocal.length; i++) {
                const nextHeading = affixHeadingsLocal[i + 1];
                const position = getNextHeadingPosition(nextHeading);

                headingsPosition.push([position, affixHeadingsLocal[i].id]);
            }

            const contentOffset = 128; // how many pixels before the heading is right on the top of viewport should the affix nav item get active
            headingsPosition = headingsPosition.filter((item) => item[0] >= contentOffset);
            const topHeading = arrayMin(headingsPosition);

            if (topHeading) {
                const active = tableOfContentsElemFixed.querySelector('.active');
                const futureActive = tableOfContentsElemFixed.querySelector(`[href="#${topHeading[1]}"]`);

                if (active) {
                    active.classList.remove('active');
                }

                if (futureActive) {
                    futureActive.classList.add('active');
                }
            }
        }
    };

    if (tableOfContentsElem) {
        setTimeout(() => {
            createAnchors();
            createTableOfContents();
            cloneToFixed();
            bindSmothScroll();
            handleFixed();
            window.addEventListener('scroll', handleFixed, window.supportsPassive ? {
                passive: true
            } : false);
            anchorOnLoad();
            toggleItemsFromWithinContentChunks();
            copyAnchorClipboard();
            if (!document.querySelector('[data-display-mode="step-by-step"]')) {
                affix();
                window.addEventListener('scroll', affix, window.supportsPassive ? {
                    passive: true
                } : false);
            }
        }, 0);
    } else if (anchorsOnly) {
        createAnchors();
        anchorOnLoad();
        copyAnchorClipboard();
    }
})();
