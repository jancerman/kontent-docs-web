!(function () {
    if (typeof self !== 'undefined' && self.Prism && self.document) {
      var l = 'line-numbers';
        var c = /\n(?!$)/g;
        var m = function (e) {
          var t = a(e)['white-space'];
          if (t === 'pre-wrap' || t === 'pre-line') {
            var n = e.querySelector('code');
              var r = e.querySelector('.line-numbers-rows');
              var s = e.querySelector('.line-numbers-sizer');
              var i = n.textContent.split(c);
            s || ((s = document.createElement('span')).className = 'line-numbers-sizer', n.appendChild(s)), s.style.display = 'block', i.forEach(function (e, t) {
              s.textContent = e || '\n';
              var n = s.getBoundingClientRect().height;
              r.children[t].style.height = n + 'px'
            }), s.textContent = '', s.style.display = 'none'
          }
        };
        var a = function (e) {
          return e ? window.getComputedStyle ? getComputedStyle(e) : e.currentStyle || null : null
        };
      window.addEventListener('resize', function () {
        Array.prototype.forEach.call(document.querySelectorAll('pre.' + l), m)
      }), Prism.hooks.add('complete', function (e) {
        if (e.code) {
          var t = e.element;
            var n = t.parentNode;
          if (n && /pre/i.test(n.nodeName) && !t.querySelector('.line-numbers-rows')) {
            for (var r = !1, s = /(?:^|\s)line-numbers(?:\s|$)/, i = t; i; i = i.parentNode) {
if (s.test(i.className)) {
                r = !0;
                break
              }
} if (r) {
              t.className = t.className.replace(s, ' '), s.test(n.className) || (n.className += ' line-numbers');
              var l; var a = e.code.match(c);
                var o = a ? a.length + 1 : 1;
                var u = new Array(o + 1).join('<span></span>');
              (l = document.createElement('span')).setAttribute('aria-hidden', 'true'), l.className = 'line-numbers-rows', l.innerHTML = u, n.hasAttribute('data-start') && (n.style.counterReset = 'linenumber ' + (parseInt(n.getAttribute('data-start'), 10) - 1)), e.element.appendChild(l), m(n), Prism.hooks.run('line-numbers', e)
            }
          }
        }
      }), Prism.hooks.add('line-numbers', function (e) {
        e.plugins = e.plugins || {}, e.plugins.lineNumbers = !0
      }), Prism.plugins.lineNumbers = {
        getLine: function (e, t) {
          if (e.tagName === 'PRE' && e.classList.contains(l)) {
            var n = e.querySelector('.line-numbers-rows');
              var r = parseInt(e.getAttribute('data-start'), 10) || 1;
              var s = r + (n.children.length - 1);
            t < r && (t = r), s < t && (t = s);
            var i = t - r;
            return n.children[i]
          }
        }
      }
    }
  }());
