/**
 * Lazy loading
 */

// Bring UIMessages from the global scope inlined in HTML head
let UIMessages = UIMessages ? UIMessages : null;

// On scroll, check elements with the "lazy" class name and transform their data-src attribute into src
// Implementation uses IntersectionObserver if is available, otherwise fallbacks to using scroll, resize and orientationChange events
const loadOnScroll = () => {
    var lazyloadElems;

    if ('IntersectionObserver' in window) {
        lazyloadElems = document.querySelectorAll('.lazy');

        var elemObserver = new IntersectionObserver((entries, observer) => {
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
    } else {
        var lazyloadThrottleTimeout;
        lazyloadElems = document.querySelectorAll('.lazy');

        var lazyload = () => {
            if (lazyloadThrottleTimeout) {
                clearTimeout(lazyloadThrottleTimeout);
            }

            lazyloadThrottleTimeout = setTimeout(() => {
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
            }, 20);
        }

        document.addEventListener('scroll', lazyload, supportsPassive ? {
            passive: true
        } : false);
        window.addEventListener('resize', lazyload);
        window.addEventListener('orientationChange', lazyload);
    }
};

const loadOnClick = () => {
    let lazy = document.querySelectorAll('.lazy');
    let label = UIMessages ? UIMessages.dntLabel : '';

    lazy.forEach(item => {
        let wrapper = helper.getParents(item);
        wrapper[0].insertBefore(helper.createElementFromHTML(`<div class="embed__dnt-enable">${helper.decodeHTMLEntities(label)}</div>`), wrapper[0].firstChild);
    });

    document.querySelector('body').addEventListener('click', e => {
        e.stopPropagation();
        if (e.target && e.target.matches('div.embed__dnt-enable, div.embed__dnt-enable *')) {
            let target = e.target;

            // If embed wrapper element child gets clicked, find the parent embed wrapper
            if (!target.classList.contains('embed__dnt-enable')) {
                target = helper.getParents(target).filter(item => {
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
        }
    });
};

// Conditionally load stylesheets
const loadFonts = () => {
    if (document.querySelector('code, pre')) {
        helper.addStylesheet('https://fonts.googleapis.com/css?family=Inconsolata');
    }
};

// Fire on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    loadFonts();

    // Check if "Do not flag" is enabled in the browser settings
    // If yes, make embeds load on click, otherwise lazyload on scroll
    if (window.doNotTrack || navigator.doNotTrack || navigator.msDoNotTrack || 'msTrackingProtectionEnabled' in window.external) {
        if (window.doNotTrack == '1' || navigator.doNotTrack === 'yes' || navigator.doNotTrack == '1' || navigator.msDoNotTrack == '1' || window.external.msTrackingProtectionEnabled()) {
            loadOnClick();
        } else {
            loadOnScroll();
        }
    } else {
        loadOnScroll();
    }
});