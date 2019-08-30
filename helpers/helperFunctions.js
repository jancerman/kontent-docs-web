const helper = {
    escapeHtml: (unsafe) => {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&quot;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },
    removeNewLines: (unsafe) => {
        return unsafe.replace(/\r?\n|\r/g, '');
    },
    getFormValue: (formValues, fieldName) => {
        var value = '';
        if (typeof formValues !== 'undefined') {
            value = formValues[fieldName] || '';
        }
        return value;
    },
    getValidationMessages: (errors, data) => {
        errors.forEach((item) => {
            if (item.msg) {
                if (data.elements && data.elements[item.msg] && data.elements[item.msg].value) {
                    item.msg = data.elements[item.msg].value;
                }

                if (data.content && data.content[item.msg] && data.content[item.msg].value) {
                    item.msg = data.content[item.msg].value;
                }
            }
        });

        return errors;
    },
    getPrismClassName: (item) => {
        let lang;
        const pairings = {
            'rest': 'shell',
            'shell': 'shell',
            'curl': 'shell',
            '_net': 'dotnet',
            'c_': 'dotnet',
            'javascript': 'js',
            'json': 'js',
            'typescript': 'ts',
            'java': 'java',
            'android': 'java',
            'javarx': 'java',
            'php': 'php',
            'swift': 'swift',
            'python': 'python',
            'ruby': 'ruby'
        }

        if (item && item.codename) {
            lang = pairings[item.codename];
        }

        if (!lang) {
            lang = 'clike';
        }

        return `lang-${lang}`;
    },
    stripTags: (text) => {
        return text.replace(/<\/?[^>]+(>|$)/g, '');
    },
    resolveMacros: (text) => {
        // If macro in format {@ sometext @}, replace it by icon
        let replaced = text.replace(/{@[a-z,0-9,-]+@}/g, (match) => {
            return `<i aria-hidden="true" class="icon ${match.replace('{@', '').replace('@}', '')}"></i>`;
        });

        // If macro in format {~ sometext ~}, replace it by inlone code
        replaced = replaced.replace(/{~[^~]+~}/g, (match) => {
            return `<code>${match.replace('{~', '').replace('~}', '')}</code>`;
        });

        return replaced;
    },
    capitalizeFirstLetter: (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1)
    }
};

module.exports = helper;
