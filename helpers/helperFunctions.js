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
     }
};

module.exports = helper;