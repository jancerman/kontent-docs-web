/**
 * Tbale of contents, heading anchros, copy anchor URL to clipboard
 */
(() => {
    // For all sub-headings set their id and create the copy to clipboard icon
    const createAnchors = () => {
        let headings = document.querySelector('.article__content').querySelectorAll('h2:not(.table-of-contents__heading), h3, h4');

        headings.forEach((item) => {
            let anchorName = item.innerHTML.toLowerCase().replace(/\W/g,'-');
            item.setAttribute('id', anchorName);
            item.innerHTML = `${item.innerHTML}<span class="anchor-copy" aria-hidden="true"><span class="anchor-copy__tooltip">Copy URL</span></span>`;
        });
    };

    // Make all icons copy the headings URL to clipboard and show appropriate message in tooltip
    const copyAnchorClipboard = () => {
        let anchors = document.querySelectorAll('.anchor-copy');

        anchors.forEach((item) => {
            item.addEventListener('click', (event) => {
                let hash = item.parentElement.getAttribute('id');
                let url = window.location.href.split('#')[0];
                helper.copyToClipboard(`${url}#${hash}`);

                let tooltip = item.querySelector('.anchor-copy__tooltip');
                let tooltipText = tooltip.innerHTML;
                tooltip.innerHTML = 'URL copied to clipboard';
                setTimeout(() => {
                    tooltip.innerHTML = tooltipText;
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
        let headings = document.querySelector('.article__content').querySelectorAll('h2:not(.table-of-contents__heading), h3, h4');
        let tableOfContentsWrapper = document.querySelector('.table-of-contents__list');
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
            document.querySelector('.table-of-contents').classList.add('table-of-contents--render');
        }
    };

    // Scroll to appropriate anchor when a table of content items gets clicked
    const bindSmothScroll = () => {
        let tableOfContentsWrapper = document.querySelector('.table-of-contents__list');
        tableOfContentsWrapper.addEventListener('click', (event) => {
            if(event.target && event.target.nodeName === 'A') {
                event.preventDefault();
                document.querySelector(event.target.getAttribute('href')).scrollIntoView({ block: 'start',  behavior: 'smooth' });
                history.replaceState(undefined, undefined, `${event.target.getAttribute('href')}`);
            }
        });
    };

    // Make table of contents fixed to top/bottom of the screen, or header/footer
    // When enough space position the table of contents on the right hand side of the screen. Otherwise, position in under the article heading
    const fixTableOfContents = () => {
        let tableOfContents = document.querySelector('.table-of-contents');
        let viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        let webWidth = document.querySelector('main').offsetWidth;
        let remainingSpace = (viewportWidth - webWidth) / 2;

        if (remainingSpace >= 280) {
            if (tableOfContents) {
                let topOffset = ((window.pageYOffset || document.scrollTop) - (document.clientTop || 0)) || 0;
                let isTop = topOffset <= document.querySelector('.navigation').offsetHeight;

                let isBottom = (window.innerHeight + window.pageYOffset + helper.outerHeight(document.querySelector('.footer'))) >= document.body.offsetHeight;

                tableOfContents.classList.add('table-of-contents--fixed');
                tableOfContents.style.left = `${viewportWidth - remainingSpace}px`;

                if (isTop) {
                    tableOfContents.classList.add('table-of-contents--top');
                } else {
                    tableOfContents.classList.remove('table-of-contents--top');
                }

                if (isBottom) {
                    tableOfContents.classList.add('table-of-contents--bottom');
                } else {
                    tableOfContents.classList.remove('table-of-contents--bottom');
                }
            }
        } else {
            tableOfContents.classList.remove('table-of-contents--top');
            tableOfContents.classList.remove('table-of-contents--bottom');
            tableOfContents.classList.remove('table-of-contents--fixed');
        }
    };

    if (document.querySelector('.table-of-contents')) {
        setTimeout(() => {
            createAnchors();
            createTableOfContents();
            bindSmothScroll();
            fixTableOfContents();
            anchorOnLoad();
            copyAnchorClipboard();
    
            window.addEventListener('scroll', fixTableOfContents, supportsPassive ? { passive: true } : false);
            window.addEventListener('resize', fixTableOfContents);
        }, 0);
    }
})();