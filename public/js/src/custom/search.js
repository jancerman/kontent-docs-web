/**
 * Initializes Algolia search with use of autocomplete.js
 */

(() => {
    // Get Algolia API details from object in the global scope (should be present in the page head)
    // Or use API detail injected with url parameters
    searchAPI.appid = helper.getParameterByName('searchappid') || searchAPI.appid;
    searchAPI.apikey = helper.getParameterByName('searchapikey') || searchAPI.apikey;
    searchAPI.indexname = helper.getParameterByName('searchindexname') || searchAPI.indexname;

    const client = algoliasearch(searchAPI.appid, searchAPI.apikey)
    const tutorials = client.initIndex(searchAPI.indexname);
    const url = window.location;
    let searchTerm = '';
    let searchResultSelected = false;
    let emptySuggestions = true;
    let searchResultsNumber = 0;
    let arrowPressed = false;
    let searchInput = document.querySelector('#nav-search');

    // Get injected KC API details 
    const projectIdUrl = helper.getParameterByName('projectid');
    const previewApiKeyUrl = helper.getParameterByName('previewapikey');

    // Build query string with injected KC API details for the urlMap 
    const queryString = (() => {
        let qString = '';
        qString += (typeof projectIdUrl !== 'undefined' && projectIdUrl !== null) ? `projectid=${projectIdUrl}&` : '';
        qString += (typeof previewApiKeyUrl !== 'undefined' && previewApiKeyUrl !== null) ? `previewapikey=${previewApiKeyUrl}&` : '';
        qString = qString.slice(0, -1);
        qString = qString ? `?${qString}` : '';
        return qString;
    })();

    const arrowPress = (e) => {
        e = e || window.event;
        if (e.keyCode == '38' || e.keyCode == '40' || e.keyCode == '37' || e.keyCode == '39') {
            arrowPressed = true;
            searchInput.value = decodeURI(searchTerm);
        } else {
            arrowPressed = false;
        }
    };

    const removeInlineElements = (content) => {
        content = content.replace(/{@[a-z,0-9,-</>]+@}/g, '');
        content = content.replace(/{~[^~]+~}/g, '');
        content = content.replace(/\r?\n|\r/g, ' ');
        return content;
    };

    const formatSuggestionContent = (suggestion) => {
        // Get content with highlighted markup
        let content = suggestion._highlightResult.content.value;

        // Remove inline icon, code macros and newlines
        content = removeInlineElements(content);

        // Get start and end indexes of the first highlighted match
        let indexStart = content.indexOf('<em>');
        let indexEnd = content.lastIndexOf('</em>') + 5;

        // Get highlighted string
        let highlighted = content.substring(indexStart, indexEnd);

        // Number of chars before and after the highlighted string to be rendered
        let numCharsBefore = 20;
        let numCharsAfter = 150;

        // Get desired number of chars before and after
        let contentBefore = content.substring(indexStart - numCharsBefore, indexStart);
        let contentAfter = content.substring(indexEnd, indexEnd + numCharsAfter);

        // Add hellip before the text in case the highlighed string is somewhere in the the middle of the search result content
        if (contentBefore.length === numCharsBefore) {
            contentBefore = `&hellip;${contentBefore}`;
        }

        // Strip tags and unfinished tags at the end of the sting in after text
        contentAfter = contentAfter.replace(/(<([^>]+)>)/ig, '');
        contentAfter = contentAfter.replace(/(<([^>]+)$)/ig, '');

        // Add hellip after the text in case the highlighed string is somewhere in the the middle of the search result content
        if (contentAfter.length === numCharsAfter) {
            contentAfter = `${contentAfter}&hellip;`;
        }

        suggestion._highlightResult.content.value = `${contentBefore}${highlighted}${contentAfter}`;

        return suggestion;
    };

    const formatSuggestion = (suggestion, urlMap) => {
        // Store current search input value for use of querystring that is used in Google Analytics search terms
        searchTerm = encodeURIComponent(searchInput.value);
        emptySuggestions = false;

        // Get url from the urlMap
        const suggestionUrl = urlMap.filter(item => item.codename === suggestion.codename);

        // Add an anchor to the url if available
        const anchor = suggestion._highlightResult.heading.value ? `#a-${suggestion._highlightResult.heading.value.replace(/<\/?[^>]+(>|$)/g, '').toLowerCase().replace(/\W/g,'-')}` : '';
        suggestion.resolvedUrl = suggestionUrl.length ? `${suggestionUrl[0].url}${anchor}` : '';

        // Template for a single search result suggestion
        return `<a href="${suggestion.resolvedUrl}" class="suggestion">
                    <span class="suggestion__heading">${removeInlineElements(suggestion._highlightResult.title.value)}</span><span class="suggestion__category">Tutorials</span>
                    ${suggestion._highlightResult.heading.value ? '<span class="suggestion__sub-heading">'+ removeInlineElements(suggestion._highlightResult.heading.value) +'</span>' : ''}
                    <p class="suggestion__text">${suggestion._highlightResult.content.value}</p>
                </a>`;
    };

    const formatEmptySuggestion = () => {
        searchTerm = encodeURIComponent(searchInput.value);
        emptySuggestions = true;

        // Template for a empty result
        return `<div class="suggestion suggestion--empty">
                    <span class="suggestion__heading">${UIMessages ? UIMessages.searchNoResults : ''}</span>
                </div>`;
    };

    const onAutocompleteSelected = (suggestion, context) => {
        searchResultSelected = true;
        searchInput.value = decodeURI(searchTerm);

        logSearchTermSelected(searchTerm, suggestion.resolvedUrl);

        // Do nothing on click, as the browser will handle <a> tag by default 
        if (context.selectionMethod === 'click') {
            return;
        }

        // Change the page (for example, when enter key gets hit)
        window.location.assign(`${suggestion.resolvedUrl}`);
    };

    const onAutocompleteClosed = () => {
        if (searchTerm !== '' && !searchResultSelected) {
            //Prevent logging twice when ESC key gets pressed
            setTimeout(() => {
                if (searchInput.value !== '') {
                    logSearchTermErased();
                }
            }, 500);
        }
    };

    const getSuggestionsSource = (hitsSource, query, callback) => {
        hitsSource(query, (suggestions) => {
            searchResultsNumber = suggestions.length;
            let limitedSuggestions = [];
            let limit = suggestions.length <= 8 ? suggestions.length : 8;

            for (let i = 0; i < limit; i++) {
                limitedSuggestions.push(formatSuggestionContent(suggestions[i]))
            }
            callback(limitedSuggestions);
        });
    };

    // Init Algolia
    const initAutocomplete = (urlMap) => {
        // Init autocomplete and set maximum of suggested search items 
        var hitsSource = autocomplete.sources.hits(tutorials, {
            hitsPerPage: 1000
        });

        autocomplete('#nav-search', {
                autoselect: true,
                openOnFocus: true,
                clearOnSelected: false
            }, [{
                source: (query, callback) => {
                    getSuggestionsSource(hitsSource, query, callback);
                },
                displayKey: 'title',
                templates: {
                    suggestion: (suggestion) => {
                        return formatSuggestion(suggestion, urlMap);
                    },
                    empty: () => {
                        return formatEmptySuggestion();
                    }
                }
            }])
            .on('autocomplete:selected', (event, suggestion, dataset, context) => {
                onAutocompleteSelected(suggestion, context);
            })
            .on('autocomplete:closed', onAutocompleteClosed)
    };

    const eraseIntervalOnSearch = (e) => {
        let prevTerm = '';
        let interval = setInterval(() => {
            if (prevTerm !== '' && e.target.value === '') {
                logSearchTermErased();
            }
            prevTerm = e.target.value;
        }, 500);

        return interval;
    };

    const typeIntervalOnSearch = (e) => {
        let prevTerm = '';
        let interval = setInterval(() => {
            if (prevTerm !== e.target.value && e.target.value !== '' && arrowPressed === false) {
                logSearchTerm(e.target.value);
            }
            prevTerm = e.target.value;
        }, 1000);

        return interval;
    };

    // On search input focus set timer that checks updates on the input
    // If the input gets empty, log it
    const searchTermObserver = () => {
        let intervalErase;
        let intervalType;

        if (searchInput) {
            searchInput.addEventListener('focus', (e) => {
                intervalErase = eraseIntervalOnSearch(e);
                intervalType = typeIntervalOnSearch(e);
            });

            searchInput.addEventListener('blur', (e) => {
                clearInterval(intervalErase);
                clearInterval(intervalType);
            });
        }
    };

    const logSearchTermErased = () => {
        window.dataLayer.push({
            'event': 'event',
            'eventCategory': 'search--used',
            'eventAction': decodeURI(searchTerm),
            'eventLabel': 'Not clicked'
        });
    };

    const logSearchTerm = (term) => {
        window.dataLayer.push({
            'event': 'event',
            'eventCategory': 'search--searched-result',
            'eventAction': decodeURI(term),
            'eventLabel': searchResultsNumber
        });
    };

    const logSearchTermSelected = (term, url) => {
        window.dataLayer.push({
            'event': 'event',
            'eventCategory': 'search--used',
            'eventAction': decodeURI(term),
            'eventLabel': url
        });
    };

    const initAlgoliaSearch = () => {
        document.onkeydown = arrowPress;

        // Get urlMap and init the autocomplete
        helper.ajaxGet(`${url.protocol}//${url.hostname + (location.port ? ':' + location.port : '')}/urlmap${queryString}`, (urlMap) => {
            initAutocomplete(urlMap);
        }, 'json');

        searchTermObserver();
    };

    const setFocusOnMagnifier = (prefix) => {
        let search = document.querySelector(`.${prefix}__search`);
        if (search) {
            let icon = search.querySelector(`.${prefix}__search-icon`);
            icon.addEventListener('click', () => {
                searchInput.focus();
            });
        }
    };

    if (searchAPI) {
        initAlgoliaSearch();
        setFocusOnMagnifier('navigation');
        setFocusOnMagnifier('hero');
    }
})();