/**
 * Table of contents, heading anchros, copy anchor URL to clipboard
 */

(() => {
    const articleContent = document.querySelector('.article__content');
    const tableOfContentsWrapper = document.querySelector('.table-of-contents__list');
    const tableOfContentsElem = document.querySelector('.table-of-contents');

    // For all sub-headings set their id and create the copy to clipboard icon
    const createAnchors = () => {
        let headings = articleContent.querySelectorAll('h2:not(.table-of-contents__heading):not(.feedback__heading), h3, h4');

        headings.forEach((item) => {
            let anchorName = item.innerHTML.toLowerCase().replace(/(<([^>]+)>)/ig,'').replace(/\W/g,'-');
            item.setAttribute('id', `a-${anchorName}`);
            item.innerHTML = `${item.innerHTML}<span class="anchor-copy" aria-hidden="true"><span class="anchor-copy__tooltip"></span></span>`;
        });
    };

    // Make all icons copy the headings URL to clipboard and show appropriate message in tooltip
    const copyAnchorClipboard = () => {
        let anchors = document.querySelectorAll('.anchor-copy');

        anchors.forEach((item) => {
            item.addEventListener('click', () => {
                let hash = item.parentElement.getAttribute('id');
                let url = window.location.href.split('#')[0];
                helper.copyToClipboard(`${url}#${hash}`);

                let tooltip = item.querySelector('.anchor-copy__tooltip');
                tooltip.classList.add('anchor-copy__tooltip--active');
                setTimeout(() => {
                    tooltip.classList.remove('anchor-copy__tooltip--active');
                }, 1500);
            })
        });
    };

    // Scroll to anchor on page load. Init all lazy loading elements to be able to scroll to the correct position
    const anchorOnLoad = () => {
        let hash = window.location.href.split('#')[1];

        if (hash) {
            // Load all lazy elements
            let lazyloadElems = document.querySelectorAll('.lazy');
            lazyloadElems.forEach((elem) => {
                elem.src = elem.dataset.src;
                elem.classList.remove('lazy');
                elem.removeAttribute('data-src');
            });

            setTimeout(() => {
                document.getElementById(hash).scrollIntoView({ block: 'start',  behavior: 'smooth' });
            }, 200);
        }
    };

    // For all sub-headings create a list cascade representing table of contents and append it to the appropriate element
    const createTableOfContents = () => {
        let headings = articleContent.querySelectorAll('h2:not(.table-of-contents__heading):not(.table-of-contents__whatsnext):not(.feedback__heading)');
        let tableOfContents = '';
        let prevHeadingLevel = 2;
        headings.forEach(item => {
            let headingLevel = parseInt(item.tagName.replace('H', ''));

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
    };

    // Scroll to appropriate anchor when a table of content items gets clicked
    const bindSmothScroll = () => {
        tableOfContentsWrapper.addEventListener('click', (event) => {
            if(event.target && event.target.nodeName === 'A') {
                event.preventDefault();
                document.querySelector(event.target.getAttribute('href')).scrollIntoView({ block: 'start',  behavior: 'smooth' });
                history.replaceState(undefined, undefined, `${event.target.getAttribute('href')}`);
            }
        });
    };

    const toggleItemsFromWithinContentChunks = () => {
        const run = () => {
            let chunks = document.querySelectorAll('[data-platform-chunk]');

            chunks = Array.prototype.slice.call(chunks).filter((chunk) => {
                return chunk.classList.contains('hidden');
            });

            let ids = [];

            chunks.forEach((chunk) => {
                let headings = chunk.querySelectorAll('h2[id]');
                headings.forEach((heading) => {
                    ids.push(heading.getAttribute('id'));
                });
            });

            let tocItems = document.querySelectorAll('.table-of-contents__list li a');
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

    if (tableOfContentsElem) {
        setTimeout(() => {
            createAnchors();
            createTableOfContents();
            bindSmothScroll();
            anchorOnLoad();
            toggleItemsFromWithinContentChunks();
            copyAnchorClipboard();
        }, 0);
    }
})();