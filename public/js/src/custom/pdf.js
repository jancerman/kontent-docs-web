
(() => {
    if (!window.helper.getParameterByName('pdf')) return;
    const headings = document.querySelectorAll('.article__content h2, .article__content h3, .article__content h4');

    for (let i = 0; i < headings.length; i++) {
        const nextElem = headings[i].nextSibling;
        const div = document.createElement('div');
        div.style.pageBreakInside = 'avoid';
        headings[i].insertAdjacentElement('afterend', div);

        div.appendChild(headings[i]);
        div.appendChild(nextElem);
    }
})();
