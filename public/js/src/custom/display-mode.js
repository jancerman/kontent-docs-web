/* eslint-disable no-new */
/* eslint-disable no-undef */

(() => {
    const createSections = (content) => {
        if (!content) {
            return;
        }

        // Each section starts with h2
        // Get h2s as as delimiter ind iterate them
        const h2s = content.querySelectorAll('.article__content > h2');

        for (let i = 0; i < h2s.length; i++) {
            // Create a section tag
            const wrapper = document.createElement('section');
            // Mode id from h2 to section
            wrapper.setAttribute('data-display-mode-id', h2s[i].getAttribute('id'));
            // Create index and visibility flags
            wrapper.setAttribute('data-display-mode-index', i);
            wrapper.setAttribute('data-display-mode-visible', 'false');
            // Add section in front of h2
            h2s[i].insertAdjacentElement('beforebegin', wrapper);
        }

        // Get newly created sentions
        const sections = content.querySelectorAll('.article__content > [data-display-mode-index]');
        let sectionsWrapper;
        if (sections && sections.length) {
            // Create a wrapper div
            sectionsWrapper = document.createElement('div');
            sectionsWrapper.setAttribute('data-display-mode-wrapper', '');
            sections[0].insertAdjacentElement('beforebegin', sectionsWrapper);
        }

        // Iterate sections
        for (let i = 0; i < sections.length; i++) {
            // Get section index
            const sectionIndex = parseInt(sections[i].getAttribute('data-display-mode-index'));
            // Bet all tags between current and next section
            const sectionElements = window.helper.nextUntil(sections[i], `[data-display-mode-index="${sectionIndex + 1}"]`, null, 'style, #feedback-form, #recaptcha-script, .language-selector, .table-of-contents');

            // Move the tags in the current sention
            for (let j = 0; j < sectionElements.length; j++) {
                sections[i].appendChild(sectionElements[j]);
            }

            const nextSection = sections[i + 1];
            if (nextSection) {
                const nextLink = document.createElement('a');
                nextLink.setAttribute('href', `#${nextSection.getAttribute('data-display-mode-id')}`);
                nextLink.innerHTML = window.UIMessages ? window.UIMessages.nextPartText : 'Go to next part';
                nextLink.setAttribute('data-display-mode-next', '');
                sections[i].appendChild(nextLink);
            }

            if (sectionsWrapper) {
                // Move section in the wrapper
                sectionsWrapper.appendChild(sections[i]);
            }
        }

        return sectionsWrapper;
    };

    const activateSection = (wrapper, id) => {
        if (id) {
            // Hide a visible section
            wrapper.querySelector('[data-display-mode-visible="true"]').setAttribute('data-display-mode-visible', 'false');
            // Display section that is intended to be visible
            const section = wrapper.querySelector(`[data-display-mode-id="${id.replace('#', '')}"]`);

            if (section) {
                section.setAttribute('data-display-mode-visible', 'true');

                // Scroll to the top of the section
                section.scrollIntoView({
                    block: 'start',
                    behavior: 'smooth'
                });
            }

            // Update url hash
            history.replaceState(undefined, undefined, id);
        }
    };

    const activateTOC = (href) => {
        const links = document.querySelectorAll('.table-of-contents__list a');
        for (let i = 0; i < links.length; i++) {
            if (links[i].getAttribute('href') === href) {
                links[i].classList.add('active');
            } else {
                links[i].classList.remove('active');
            }
        }
    };

    const makeSectionsInteractive = (wrapper) => {
        // On page load get url hash
        const hash = window.location.hash;
        let index = 0;
        let scrollToAnchor = false;
        const articleContent = document.querySelector('[data-display-mode]');
        if (hash) {
            // Get section index by the hash
            let hashElem = wrapper.querySelector(`[data-display-mode-id="${hash.replace('#', '')}"]`);
            if (hashElem) {
                index = hashElem.getAttribute('data-display-mode-index');
            } else {
                // If section with given hash ges not exist, find out if there is any other element with id equal to the hash and fond its parent section
                hashElem = wrapper.querySelector(hash);
                const parentWrapper = window.helper.findAncestor(hashElem, '[data-display-mode-index]');
                if (parentWrapper) {
                    index = parentWrapper.getAttribute('data-display-mode-index');
                    scrollToAnchor = true;
                }
            }
        }

        // Display section by id
        const section = wrapper.querySelector(`[data-display-mode-index="${index}"]`);
        section.setAttribute('data-display-mode-visible', true);
        activateTOC(`#${section.getAttribute('data-display-mode-id')}`);

        if (scrollToAnchor) {
            wrapper.querySelector(hash).scrollIntoView({
                block: 'start',
                behavior: 'smooth'
            });
        }

        articleContent.addEventListener('click', (e) => {
            // Activate section on table of contents link or next link click
            if (e.target && (e.target.matches('.table-of-contents__list a') || e.target.matches('[data-display-mode-next]'))) {
                e.preventDefault();
                const href = e.target.getAttribute('href');
                activateSection(wrapper, href);
                activateTOC(href);
            }
        });
    };

    const init = () => {
        const displayModeElem = document.querySelector('[data-display-mode]');

        if (!displayModeElem) {
            return;
        }

        if (displayModeElem.getAttribute('data-display-mode') === 'step-by-step') {
            const sectionsWrapper = createSections(displayModeElem);
            makeSectionsInteractive(sectionsWrapper);
        }
    };

    setTimeout(() => {
        init();
    }, 0);
})();
