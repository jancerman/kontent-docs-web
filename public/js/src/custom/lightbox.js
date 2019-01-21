(() => {
    setTimeout(() => {
        document.querySelectorAll('.article__content img.article__add-lightbox').forEach(item => {
            let figcaption = '';
            let nextSibling = item.nextSibling;
            let nextNextSibling = nextSibling.nextSibling;

            let captionElem = (() => {
                if (nextSibling.tagName === 'FIGCAPTION') {
                    return nextSibling;
                } else if (nextNextSibling.tagName === 'FIGCAPTION') {
                    return nextNextSibling;
                } else {
                    return null;
                }
            })();

            if (captionElem !== null) {
                figcaption = `<p>${captionElem.innerHTML}</p>`;
            }
            
            item.addEventListener('click', event => {
                basicLightbox.create(`<img src="${item.getAttribute('src')}">${figcaption}`).show();
            });
        });
    }, 0);
})();
