window.searchAPI.appid = window.helper.getParameterByName('searchappid') || window.searchAPI.appid;
window.searchAPI.apikey = window.helper.getParameterByName('window.searchAPIkey') || window.searchAPI.apikey;
window.searchAPI.indexname = window.helper.getParameterByName('searchindexname') || window.searchAPI.indexname;

const searchClient = algoliasearch(window.searchAPI.appid, window.searchAPI.apikey);

const search = instantsearch({
  indexName: window.searchAPI.indexname,
  searchClient,
});

const removeInlineElements = (content) => {
  if (content) {
      content = content.replace(/{@[a-z,0-9,-</>]+@}/g, '');
      content = content.replace(/{~[^~]+~}/g, '');
      content = content.replace(/\r?\n|\r/g, ' ');
  }
  return content;
};

const formatSuggestion = (suggestion) => {
  // Get url from the urlMap
  const suggestionUrl = window.urlMap.filter(item => item.codename === suggestion.codename);

  // Add an anchor to the url if available
  let anchor = suggestion._highlightResult.title.value ? `#a-${suggestion._highlightResult.title.value.replace(/<\/?[^>]+(>|$)/g, '').toLowerCase().replace(/\W/g, '-').replace(/[-]+/g, '-')}` : '';
  // Keep anchors only for references, changelog, and terminology
  if (suggestion.codename !== 'terminology' && suggestion.codename !== 'product_changelog') {
      anchor = '';
  }
  const tech = suggestion.platforms && suggestion.platforms.length === 1 ? `?tech=${window.helper.getTech(suggestion.platforms[0])}` : '';
  suggestion.resolvedUrl = suggestionUrl.length ? `${suggestionUrl[0].url}${suggestionUrl[0].url.indexOf('?tech') === -1 ? tech : ''}${suggestion.section !== 'API' ? anchor : ''}` : '';
  let section = (suggestion.section === 'tutorials' && suggestion.resolvedUrl.includes('/reference/')) ? 'reference' : suggestion.section;

  if (section.toLowerCase() === 'api') {
      section = 'Reference';
  }

  // Custom general label for tutorials
  if (suggestion.section === 'tutorials') {
      section = 'Tutorial'
  }

  // Custom label for terminology page
  if (suggestion.codename === 'terminology') {
      section = 'Terminology'
  }

  // Custom label for product changelog
  if (suggestion.codename === 'product_changelog') {
      section = 'Changelog'
  }

  // Template for a single search result suggestion
  return `<li class="aa-suggestion">
            <a href="${suggestion.resolvedUrl}" class="suggestion">
              <div class="suggestion__left">
                <span class="suggestion__heading">${removeInlineElements(suggestion._highlightResult.title.value)}</span>
                ${suggestion._highlightResult.heading.value ? '<span class="suggestion__sub-heading">'+ removeInlineElements(suggestion._highlightResult.heading.value) +'</span>' : ''}
                <p class="suggestion__text">${removeInlineElements(suggestion._snippetResult.content.value)}</p>
              </div>
              <div class="suggestion__right">
                <span class="suggestion__category suggestion__category--${section.toLowerCase()}">${section.toUpperCase()}</span>
              </div>
            </a>
          </li>`;
};

// Helper for the render function
const renderIndexListItem = ({ hits }) => {
  return `
      ${hits.map((hit) => {
        console.log(hit);
        return formatSuggestion(hit)
      }).join('')}`
  };

// Create the render function
const renderAutocomplete = (renderOptions, isFirstRender) => {
  const { indices, currentRefinement, refine, widgetParams } = renderOptions;
  const input = document.querySelector('#nav-search');

  if (isFirstRender) {

    const wrapper = document.createElement('div');
    wrapper.classList.add('aa-dropdown-menu');

    const ul = document.createElement('ul');
    const header = document.createElement('div');
    header.classList.add('aa-header');
    wrapper.appendChild(header);
    wrapper.appendChild(ul);

    input.addEventListener('input', event => {
      refine(event.currentTarget.value);
    });

    widgetParams.container.appendChild(wrapper);
  }
  
  const searchResultsNumber = indices.length ? indices[0].hits.length : 0;
  const searchTerm = window.filterXSS(decodeURIComponent(currentRefinement));
  const headerElem = widgetParams.container.querySelector('.aa-header');
  const wrapperElem = widgetParams.container.querySelector('.aa-dropdown-menu');

  if (searchResultsNumber && searchTerm) {
    headerElem.innerHTML = `Showing ${searchResultsNumber} results for <strong>${searchTerm}</strong>`;
    input.value = searchTerm;
    widgetParams.container.querySelector('ul').innerHTML = indices
      .map(renderIndexListItem)
      .join('');

      wrapperElem.classList.add('aa-dropdown-menu--visible');
  } else {
    wrapperElem.classList.remove('aa-dropdown-menu--visible');
  }
  
};

// Create the custom widget
const customAutocomplete = instantsearch.connectors.connectAutocomplete(
  renderAutocomplete
);

// Instantiate the custom widget
search.addWidgets([
  customAutocomplete({
    container: document.querySelector('#autocomplete'),
  })
]);

search.start();