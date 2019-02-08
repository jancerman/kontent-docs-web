/**
 * Tbale of contents, heading anchros, copy anchor URL to clipboard
 */
(() => {
    // For all sub-headings set their id and create the copy to clipboard icon
    const createAnchors = () => {
        let headings = document.querySelector('.article__content').querySelectorAll('h2:not(.table-of-contents__heading), h3, h4');

        headings.forEach((item) => {
            let anchorName = item.innerHTML.toLowerCase().replace(/(<([^>]+)>)/ig,'').replace(/\W/g,'-');
            item.setAttribute('id', anchorName);
            item.innerHTML = `${item.innerHTML}<span class="anchor-copy" aria-hidden="true"><span class="anchor-copy__tooltip">${UIMessages.copyUrl}</span></span>`;
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
                tooltip.innerHTML = UIMessages.copyUrlActive;
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
                console.log(hash);
                document.getElementById(hash).scrollIntoView({ block: 'start',  behavior: 'smooth' });
            }, 200);
        }
    };

    // For all sub-headings create a list cascade representing table of contents and append it to the appropriate element
    const createTableOfContents = () => {
        let headings = document.querySelector('.article__content').querySelectorAll('h2:not(.table-of-contents__heading):not(.table-of-contents__whatsnext)');
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

    if (document.querySelector('.table-of-contents')) {
        setTimeout(() => {
            createAnchors();
            createTableOfContents();
            bindSmothScroll();
            anchorOnLoad();
            copyAnchorClipboard();
        }, 0);
    }
})();