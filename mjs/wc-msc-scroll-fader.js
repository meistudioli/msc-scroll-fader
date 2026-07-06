import { _wcl } from './common-lib.js';
import { _wccss } from './common-css.js';

const defaults = {
  direction: 'vertical', // vertical, horizontal
};

const booleanAttrs = [];
const objectAttrs = [];
const custumEvents = {};

const template = document.createElement('template');
template.innerHTML = `
<style>
${_wccss}

:host {
  --mask-size-start: var(--msc-scroll-fader-mask-size-start, 16px);
  --mask-size-end: var(--msc-scroll-fader-mask-size-end, 16px);

  /* use vertical as default */
  --animation-axis: block;
  --overflow: hidden auto;
  --mask-direction: 180deg;

  --mask-image-start: linear-gradient(
    var(--mask-direction),
    transparent 0%,
    black 0%,
    black calc(100% - var(--mask-size-end)),
    transparent 100%
  );
  --mask-image-process: linear-gradient(
    var(--mask-direction),
    transparent 0%,
    black var(--mask-size-start),
    black calc(100% - var(--mask-size-end)),
    transparent 100%
  );
  --mask-image-end: linear-gradient(
    var(--mask-direction),
    transparent 0%,
    black var(--mask-size-start),
    black 100%,
    transparent 100%
  );

  position: relative;
  inline-size: 100%;
  display: block;
  outline: 0 none;
  border: 0 none;
  box-sizing: border-box;
  overflow: var(--overflow);
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

  /* force hide scroll */
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @supports (animation-timeline: scroll()) {
    animation: adjust-mask auto linear forwards;
    animation-timeline: scroll(self var(--animation-axis));
  }

  @supports not (animation-timeline: scroll()) {
    mask-image: var(--mask-image-process);
    -webkit-mask-image: var(--mask-image-process);
  }
}

:host([direction='vertical']) {
  --animation-axis: block;
  --overflow: hidden auto;
  --mask-direction: 180deg;
}

:host([direction='horizontal']) {
  --animation-axis: inline;
  --overflow: auto hidden;
  --mask-direction: 90deg;
}

@keyframes adjust-mask {
  0% {
    mask-image: var(--mask-image-start);
    -webkit-mask-image: var(--mask-image-start);
  }

  1%, 99% {
    mask-image: var(--mask-image-process);
    -webkit-mask-image: var(--mask-image-process);
  }

  100% {
    mask-image: var(--mask-image-end);
    -webkit-mask-image: var(--mask-image-end);
  }
}

.main {
  inline-size: 100%;
  box-sizing: border-box;

  slot {
    inline-size: 100%;
    display: block;
  }
}
</style>

<div class="main" ontouchstart="">
  <slot></slot>
</div>
`;

export class MscScrollFader extends HTMLElement {
  #data;
  #nodes;
  #config;

  constructor(config) {
    super();

    // template
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // data
    this.#data = {
      controller: ''
    };

    // nodes
    this.#nodes = {
      styleSheet: this.shadowRoot.querySelector('style')
    };

    // config
    this.#config = {
      ...defaults,
      ...config // new MscScrollFader(config)
    };
  }

  async connectedCallback() {
   const { config, error } = await _wcl.getWCConfig(this);

    if (error) {
      console.warn(`${_wcl.classToTagName(this.constructor.name)}: ${error}`);
      this.remove();
      return;
    } else {
      this.#config = {
        ...this.#config,
        ...config
      };
    }

    // upgradeProperty
    Object.keys(defaults).forEach((key) => this.#upgradeProperty(key));
  }

  #format(attrName, oldValue, newValue) {
    const hasValue = newValue !== null;

    if (!hasValue) {
      if (booleanAttrs.includes(attrName)) {
        this.#config[attrName] = false;
      } else {
        this.#config[attrName] = defaults[attrName];
      }
    } else {
      switch (attrName) {
        case 'direction':
          this.#config[attrName] = ['vertical', 'horizontal'].includes(newValue) ? newValue : defaults[attrName];
          break;
      }
    }
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (!MscScrollFader.observedAttributes.includes(attrName)) {
      return;
    }

    this.#format(attrName, oldValue, newValue);
  }

  static get observedAttributes() {
    return Object.keys(defaults); // MscScrollFader.observedAttributes
  }

  static get supportedEvents() {
    return Object.keys(custumEvents).map(
      (key) => {
        return custumEvents[key];
      }
    );
  }

  #upgradeProperty(prop) {
    let value;

    if (MscScrollFader.observedAttributes.includes(prop)) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        value = this[prop];
        delete this[prop];
      } else {
        if (booleanAttrs.includes(prop)) {
          value = (this.hasAttribute(prop) || this.#config[prop]) ? true : false;
        } else if (objectAttrs.includes(prop)) {
          value = this.hasAttribute(prop) ? this.getAttribute(prop) : JSON.stringify(this.#config[prop]);
        } else {
          value = this.hasAttribute(prop) ? this.getAttribute(prop) : this.#config[prop];
        }
      }

      this[prop] = value;
    }
  }

  set direction(value) {
    if (value) {
      this.setAttribute('direction', value);
    } else {
      this.removeAttribute('direction');
    }
  }

  get direction() {
    return this.#config.direction;
  }
}

// define web component
const S = _wcl.supports();
const T = _wcl.classToTagName('MscScrollFader');
if (S.customElements && S.shadowDOM && S.template && !window.customElements.get(T)) {
  window.customElements.define(_wcl.classToTagName('MscScrollFader'), MscScrollFader);
}