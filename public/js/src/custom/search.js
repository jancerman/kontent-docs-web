/**
 * Initializes Algolia search with use of autocomplete.js
 */

(() => {
    const initAlgoliaSearch = () => {
        // Get Algolia API details from object in the global scope (should be present in the page head)
        // Or use API detail injected with url parameters
        searchAPI.appid = helper.getParameterByName('searchappid') || searchAPI.appid;
        searchAPI.apikey = helper.getParameterByName('searchapikey') || searchAPI.apikey;
        searchAPI.indexname = helper.getParameterByName('searchindexname') || searchAPI.indexname;

        const client = algoliasearch(searchAPI.appid, searchAPI.apikey)
        const tutorials = client.initIndex(searchAPI.indexname);
        const url = window.location;
        let searchTerm = '';

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

        // Init Algolia
        const initAutocomplete = (urlMap) => {
            // Init autocomplete and set maximum of suggested search items 
            var hitsSource = autocomplete.sources.hits(tutorials, {
                hitsPerPage: 8
            });
    
            autocomplete('#nav-search', {
                autoselect: true,
                openOnFocus: true
            }, [{
                source: (query, callback) => {
                    hitsSource(query, (suggestions) => {
                        suggestions.forEach(item => {
                            // Get content with highlighted markup
                            let content = item._highlightResult.content.value;
                            // Remove inline icon, code macros and newlines
                            content = content.replace(/{@[a-z,0-9,-]+@}/g, '');
                            content = content.replace(/{~[^~]+~}/g, '');
                            content = content.replace(/\r?\n|\r/g, '');
    
                            // Get start and end idexes of the first highlighted match
                            let indexStart = content.indexOf('<em>');
                            let indexEnd = content.indexOf('</em>') + 5;
    
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
                            contentAfter = contentAfter.replace(/(<([^>]+)>)/ig,'');
                            contentAfter = contentAfter.replace(/(<([^>]+)$)/ig,'');
    
                            /*
                            // Find out whether there is another highighted text in the after text
                            let contentAfterStartIndex = contentAfter.indexOf('<em>');
                            let contentAfterEndIndex = contentAfter.indexOf('</em>');
    
                            // If there is unclosed em tag in teh after text, add closing em tag
                            if (contentAfterStartIndex > -1 && contentAfterEndIndex === -1) {
                                contentAfter = `${contentAfter}</em>`;
                            }
                            */
    
                            // Add hellip after the text in case the highlighed string is somewhere in the the middle of the search result content
                            if (contentAfter.length === numCharsAfter) {
                                contentAfter = `${contentAfter}&hellip;`;
                            }
    
                            item._highlightResult.content.value = `${contentBefore}${highlighted}${contentAfter}`;
                        });
        
                        callback(suggestions);
                    });
                },
                displayKey: 'title',
                templates: {
                    suggestion: (suggestion) => {
                        // Store current search input value for use of querystring that is used in Google Analytics search terms
                        searchTerm = encodeURIComponent(document.querySelector('#nav-search').value);
                        
                        // Get url from the urlMap
                        const suggestionUrl = urlMap.filter(item => item.codename === suggestion.codename);

                        // Add an anchor to the url if available
                        const anchor = suggestion._highlightResult.heading.value ? `#${suggestion._highlightResult.heading.value.replace(/<\/?[^>]+(>|$)/g, '').toLowerCase().replace(/\W/g,'-')}` : '';
                        suggestion.resolvedUrl = suggestionUrl.length ? `${suggestionUrl[0].url}?searchterm=${searchTerm}${anchor}` : '';
                        
                        // Template for a single search result suggestion
                        return `<a href="${suggestion.resolvedUrl}" class="suggestion">
                                    <span class="suggestion__heading">${suggestion._highlightResult.title.value}</span><span class="suggestion__category">Tutorials</span>
                                    ${suggestion._highlightResult.heading.value ? '<span class="suggestion__sub-heading">'+ suggestion._highlightResult.heading.value +'</span>' : ''}
                                    <p class="suggestion__text">${suggestion._highlightResult.content.value}</p>
                                </a>`;
                    }
                }
            }])
            .on('autocomplete:selected', (event, suggestion, dataset, context) => {
                // Do nothing on click, as the browser will handle <a> tag by default 
                if (context.selectionMethod === 'click') {
                  return;
                }

                // Change the page (for example, when enter key gets hit)
                window.location.assign(`${suggestion.resolvedUrl}`);
            })
        };

        // Get urlMap and init the autocomplete
        helper.ajaxGet(`${url.protocol}//${url.hostname + (location.port ? ':' + location.port : '')}/urlmap${queryString}`, (urlMap) => {
            initAutocomplete(urlMap);
        }, 'json');
    };

    // In the header handle re-sizing the search input on focus/blur
    const resizeNavSearch = () => {
        let searchElem = document.querySelector('#nav-search');
        let navElem = document.querySelector('.navigation__right');

        if (navElem && searchElem) {
            searchElem.addEventListener('focus', (event) => {
                navElem.classList.add('navigation__right--full');
            });
        
            searchElem.addEventListener('blur', (event) => {
                navElem.classList.remove('navigation__right--full');
            });
        }
    };

    if (searchAPI) {
        initAlgoliaSearch();
        resizeNavSearch();
    }
})();