(() => {
    const replaceText = function (node) {
        let current = node.innerHTML;
        let replaced = current.replace(/{@[a-z,0-9,-]+@}/g, (match) => {
            return `<i aria-hidden="true" class="icon ${match.replace('{@', '').replace('@}', '')}"></i>`;
        });
        replaced = replaced.replace(/{~[^~]+~}/g, (match) => {
            return `<code>${match.replace('{~', '').replace('~}', '')}</code>`;
        });
        node.innerHTML = replaced;
    }

    const traverse = function (node) {
        let children = node.childNodes;
        let childLen = children.length;

        for (let i = 0; i < childLen; i++) {
            let child = children.item(i);

            if (child.nodeType === 1) { 
                replaceText(child);
            } else {
                traverse(child);
            }
        }
    }

    let articleContent = document.querySelector('.article__content');

    if (articleContent) {
        traverse(articleContent);
    }
})();