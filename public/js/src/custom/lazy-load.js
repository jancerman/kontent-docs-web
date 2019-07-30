/**
 * Lazy loading
 */
(() => {
    let lazyloadElems = document.querySelectorAll('.lazy');

    const beLazyOnIntersectionObserver = (flag) => {
        if (flag === 'dnt-excluded') {
            lazyloadElems = document.querySelectorAll('.lazy.lazy--exclude-dnt');
        }

        var elemObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    var elem = entry.target;
                    if (elem.classList.contains('lazy') && elem.hasAttribute('data-src')) {
                        elem.src = elem.dataset.src;
                        elem.classList.remove('lazy');
                        elem.removeAttribute('data-src');
                        elemObserver.unobserve(elem);
                    }
                }
            });
        });

        lazyloadElems.forEach((elem) => {
            elemObserver.observe(elem);
        });
    };

    const handleLazyFallback = (lazyloadElems, lazyload) => {
        var scrollTop = window.pageYOffset;
        lazyloadElems.forEach((el) => {
            let offsetTop = el.offsetTop === 0 ? el.offsetParent.offsetTop : el.offsetTop;

            if (offsetTop < (window.innerHeight + scrollTop)) {
                if (el.classList.contains('lazy') && el.hasAttribute('data-src')) {
                    el.src = el.dataset.src;
                    el.classList.remove('lazy');
                    el.removeAttribute('data-src');
                }
            }
        });
        if (lazyloadElems.length === 0) {
            document.removeEventListener('scroll', lazyload);
            window.removeEventListener('resize', lazyload);
            window.removeEventListener('orientationChange', lazyload);
        }
    };

    const beLazyFallback = (flag) => {
        var lazyloadThrottleTimeout;

        if (flag === 'dnt-excluded') {
            lazyloadElems = document.querySelectorAll('.lazy.lazy--exclude-dnt');
        }

        var lazyload = () => {
            if (lazyloadThrottleTimeout) {
                clearTimeout(lazyloadThrottleTimeout);
            }

            lazyloadThrottleTimeout = setTimeout(() => {
                handleLazyFallback(lazyloadElems, lazyload);
            }, 20);
        }

        lazyload();
        document.addEventListener('scroll', lazyload, window.supportsPassive ? { passive: true } : false);
        window.addEventListener('resize', lazyload);
        window.addEventListener('orientationChange', lazyload);
    };

    // On scroll, check elements with the "lazy" class name and transform their data-src attribute into src
    // Implementation uses IntersectionObserver if is available, otherwise fallbacks to using scroll, resize and orientationChange events
    const loadOnScroll = (flag) => {
        if ('IntersectionObserver' in window) {
            beLazyOnIntersectionObserver(flag);
        } else {
            beLazyFallback(flag);
        }
    };

    const handleLazyEmbed = (target) => {
        // If embed wrapper element child gets clicked, find the parent embed wrapper
        if (!target.classList.contains('embed__dnt-enable')) {
            target = window.helper.getParents(target).filter(item => {
                let isEmbedWrapper = false;
                if (item.classList) {
                    isEmbedWrapper = item.classList.contains('embed__dnt-enable');
                }
                return isEmbedWrapper;
            })[0];
        }

        let el = target.nextElementSibling;
        if (el.classList.contains('lazy') && el.hasAttribute('data-src')) {
            el.src = el.dataset.src;
            el.classList.remove('lazy');
            el.removeAttribute('data-src');
            target.parentNode.removeChild(target);
        }
    };

    const loadOnClick = () => {
        let lazy = document.querySelectorAll('.lazy:not(.lazy--exclude-dnt)');
        let label = window.UIMessages ? window.UIMessages.dntLabel : '';

        lazy.forEach(item => {
            let wrapper = window.helper.getParents(item);
            wrapper[0].insertBefore(window.helper.createElementFromHTML(`<div class="embed__dnt-enable">${window.helper.decodeHTMLEntities(label)}</div>`), wrapper[0].firstChild);
        });

        document.querySelector('body').addEventListener('click', (e) => {
            e.stopPropagation();
            if (e.target && e.target.matches('div.embed__dnt-enable, div.embed__dnt-enable *')) {
                handleLazyEmbed(e.target);
            }
        });
    };

    // Conditionally load stylesheets
    const loadFonts = () => {
        if (document.querySelector('code, pre')) {
            window.helper.addStylesheet('https://fonts.googleapis.com/css?family=Inconsolata');
        }
    };

    // Fire on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        loadFonts();

        // Check if "Do not flag" is enabled in the browser settings
        // If yes, make embeds load on click, otherwise lazyload on scroll
        if (window.doNotTrack || navigator.doNotTrack || navigator.msDoNotTrack) {
            if (window.doNotTrack === '1' || navigator.doNotTrack === 'yes' || navigator.doNotTrack === '1' || navigator.msDoNotTrack === '1') {
                loadOnClick();
                loadOnScroll('dnt-excluded');
            } else {
                loadOnScroll();
            }
        } else {
            loadOnScroll();
        }
    });
})();