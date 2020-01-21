window.basicLightbox = (function() {
    return (function i(u, c, a) {
        function s(n, e) {
            if (!c[n]) {
                if (!u[n]) {
                    var t = typeof require === 'function' && require;
                    if (!e && t) return t(n, !0);
                    if (l) return l(n, !0);
                    var o = new Error("Cannot find module '" + n + "'");
                    throw o.code = 'MODULE_NOT_FOUND', o
                }
                var r = c[n] = {
                    exports: {}
                };
                u[n][0].call(r.exports, function(e) {
                    return s(u[n][1][e] || e)
                }, r, r.exports, i, u, c, a)
            }
            return c[n].exports
        }
        for (var l = typeof require === 'function' && require, e = 0; e < a.length; e++) s(a[e]);
        return s
    }({
        1: [function(e, n, t) {
            'use strict';
            Object.defineProperty(t, '__esModule', {
                value: !0
            });
            var c = function(e) {
                    var n = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
                        var t = document.createElement('div');
                    return t.innerHTML = e.trim(), !0 === n ? t.children : t.firstChild
                };
                var a = function(e, n) {
                    var t = e.children;
                    return t.length === 1 && t[0].tagName === n
                };
                var u = t.visible = function(e) {
                    return (e = e || document.querySelector('.basicLightbox')) != null && !0 === e.ownerDocument.body.contains(e)
                };
            t.create = function(e, o) {
                var r = (function(e, n) {
                        var t = c('\n\t\t<div class="basicLightbox ' + n.className + '">\n\t\t\t<div class="basicLightbox__placeholder" role="dialog"></div>\n\t\t</div>\n\t');
                            var o = t.querySelector('.basicLightbox__placeholder');
                        e.forEach(function(e) {
                            return o.appendChild(e)
                        });
                        var r = a(o, 'IMG');
                            var i = a(o, 'VIDEO');
                            var u = a(o, 'IFRAME');
                        return !0 === r && t.classList.add('basicLightbox--img'), !0 === i && t.classList.add('basicLightbox--video'), !0 === u && t.classList.add('basicLightbox--iframe'), t
                    }(e = (function(e) {
                        var n = typeof e === 'string';
                            var t = e instanceof HTMLElement == 1;
                        if (!1 === n && !1 === t) throw new Error('Content must be a DOM element/node or string');
                        return !0 === n ? Array.from(c(e, !0)) : e.tagName === 'TEMPLATE' ? [e.content.cloneNode(!0)] : Array.from(e.children)
                    }(e)), o = (function() {
                        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                        if ((e = Object.assign({}, e)).closable == null && (e.closable = !0), e.className == null && (e.className = ''), e.onShow == null && (e.onShow = function() {}), e.onClose == null && (e.onClose = function() {}), typeof e.closable !== 'boolean') throw new Error('Property `closable` must be a boolean');
                        if (typeof e.className !== 'string') throw new Error('Property `className` must be a string');
                        if (typeof e.onShow !== 'function') throw new Error('Property `onShow` must be a function');
                        if (typeof e.onClose !== 'function') throw new Error('Property `onClose` must be a function');
                        return e
                    }(o))));
                    var n = function(e) {
                        return !1 !== o.onClose(i) && (t = function() {
                            if (typeof e === 'function') return e(i)
                        }, (n = r).classList.remove('basicLightbox--visible'), setTimeout(function() {
                            return !1 === u(n) || n.parentElement.removeChild(n), t()
                        }, 410), !0);
                        var n, t
                    };
                !0 === o.closable && r.addEventListener('click', function(e) {
                    /* e.target === r && */n()
                });
                var i = {
                    element: function() {
                        return r
                    },
                    visible: function() {
                        return u(r)
                    },
                    show: function(e) {
                        return !1 !== o.onShow(i) && (n = r, t = function() {
                            if (typeof e === 'function') return e(i)
                        }, document.body.appendChild(n), setTimeout(function() {
                            requestAnimationFrame(function() {
                                return n.classList.add('basicLightbox--visible'), t()
                            })
                        }, 10), !0);
                        var n, t
                    },
                    close: n
                };
                return i
            }
        }, {}]
    }, {}, [1]))(1)
})();
