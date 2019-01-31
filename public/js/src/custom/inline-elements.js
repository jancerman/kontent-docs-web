/**
 * Traverses content of a page and replaces its pieces by something else
 */
(() => {

    // Replace text by something else
    const replaceText = function (node) {
        let current = node.innerHTML;

        // If macro in format {@ sometext @}, replace it by icon
        let replaced = current.replace(/{@[a-z,0-9,-]+@}/g, (match) => {
            return `<i aria-hidden="true" class="icon ${match.replace('{@', '').replace('@}', '')}"></i>`;
        });

        // If macro in format {~ sometext ~}, replace it by inlone code
        replaced = replaced.replace(/{~[^~]+~}/g, (match) => {
            return `<code>${match.replace('{~', '').replace('~}', '')}</code>`;
        });
        node.innerHTML = replaced;
    }

    // Traverse content
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

    // Traverse article content
    let articleContent = document.querySelector('.article__content');

    if (articleContent) {
        traverse(articleContent);
    }
})();