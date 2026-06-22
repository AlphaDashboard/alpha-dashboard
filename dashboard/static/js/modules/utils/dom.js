export const domUtils = {
    createElement(tag, classes = '', attributes = {}) {
        const el = document.createElement(tag);
        if (classes) {
            el.className = classes;
        }
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'innerHTML') {
                el.innerHTML = value;
            } else if (key === 'innerText') {
                el.innerText = value;
            } else {
                el.setAttribute(key, value);
            }
        }
        return el;
    },

    getElement(selector) {
        return document.querySelector(selector);
    },

    getAllElements(selector) {
        return document.querySelectorAll(selector);
    },

    on(selector, event, handler) {
        const els = document.querySelectorAll(selector);
        els.forEach(el => el.addEventListener(event, handler));
    },

    delegate(selector, event, targetSelector, handler) {
        const root = document.querySelector(selector);
        if (!root) return;
        root.addEventListener(event, function(e) {
            const target = e.target.closest(targetSelector);
            if (target && root.contains(target)) {
                handler.call(target, e, target);
            }
        });
    }
};
