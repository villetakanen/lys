# Create a Lys Presentation

Generate a single-file HTML slide deck using the Lys structural slide engine.

## When to Use

User asks to create a presentation, slide deck, pitch, or talk about a topic.

## HTML Contract

Slides are `<article>` elements inside `<div data-lys>`. Use standard HTML only.

### Data Attributes (on `<article>`)

| Attribute | Purpose |
|---|---|
| `data-notes` | Speaker notes |
| `data-class` | CSS classes to add |
| `data-background` | Background color, gradient, or image URL |
| `data-transition` | `"fade"` enables fade transitions for the deck |
| `data-timing` | Duration in seconds |

### CSS Tokens

Override on `:root`, `[data-lys]`, or per-slide `<article>`:

| Token | Default |
|---|---|
| `--lys-aspect-ratio` | `16 / 9` |
| `--lys-slide-padding` | `2rem` |
| `--lys-transition-duration` | `300ms` |
| `--lys-transition-easing` | `ease-in-out` |
| `--lys-font-size-base` | `clamp(1rem, 2vw, 1.5rem)` |
| `--lys-slide-gap` | `0` |
| `--lys-slide-max-width` | `100vw` |
| `--lys-slide-max-height` | `100vh` |
| `--lys-focus-ring` | `2px solid currentColor` |

## Slide Patterns

### Title Slide

```html
<article data-class="title-slide" data-background="linear-gradient(135deg, #0f0c29, #302b63)" data-notes="Welcome and introduce topic">
  <h1>Presentation Title</h1>
  <p>Subtitle or author name</p>
</article>
```

### Content Slide

```html
<article data-background="#1a1a2e" data-notes="Key points to cover">
  <h2>Section Title</h2>
  <ul>
    <li>First point</li>
    <li>Second point</li>
    <li>Third point</li>
  </ul>
</article>
```

### Code Slide

```html
<article data-class="code-slide" data-background="#0f0c29" data-notes="Walk through the code">
  <h2>Code Example</h2>
  <pre><code>&lt;div data-lys&gt;
  &lt;article&gt;&lt;h1&gt;Hello&lt;/h1&gt;&lt;/article&gt;
&lt;/div&gt;</code></pre>
</article>
```

### Image / Gradient Slide

```html
<article data-background="linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" data-notes="Visual emphasis slide">
  <h2>Visual Impact</h2>
  <p>Use gradients or solid colors for visual variety.</p>
</article>
```

### Two-Column Slide

```html
<article data-background="#1a1a2e" data-notes="Compare two concepts">
  <h2>Comparison</h2>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1em;">
    <div>
      <h3>Option A</h3>
      <p>Description of the first option.</p>
    </div>
    <div>
      <h3>Option B</h3>
      <p>Description of the second option.</p>
    </div>
  </div>
</article>
```

### Quote Slide

```html
<article data-background="#302b63" data-notes="Impactful quote">
  <blockquote>
    <p>The best way to predict the future is to invent it.</p>
    <footer>— Alan Kay</footer>
  </blockquote>
</article>
```

## Quality Checklist

Before outputting, verify:

1. Every slide has a heading (`<h1>`–`<h6>`)
2. Every slide has `data-notes` with useful speaker notes
3. HTML has `lang` attribute, `<meta charset>`, and `<meta name="viewport">`
4. All slides are `<article>` elements (never `<div>` or `<section>`)
5. `<style>` block includes a custom theme — never output unstyled slides
6. Content works without JS (articles are readable as a document)
7. Code blocks use `<pre><code>` with HTML entities for `<` and `>`
8. `* { margin: 0; box-sizing: border-box; }` in the theme CSS

## Output Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TITLE</title>
  <style>
<!-- LYS:CSS -->
[data-lys]{--_lys-aspect-ratio:var(--lys-aspect-ratio,16 / 9);--_lys-slide-padding:var(--lys-slide-padding,2rem);--_lys-transition-duration:var(--lys-transition-duration,.3s);--_lys-transition-easing:var(--lys-transition-easing,ease-in-out);--_lys-font-size-base:var(--lys-font-size-base,clamp(1rem, 2vw, 1.5rem));--_lys-slide-gap:var(--lys-slide-gap,0);--_lys-slide-max-width:var(--lys-slide-max-width,100vw);--_lys-slide-max-height:var(--lys-slide-max-height,100vh);--_lys-focus-ring:var(--lys-focus-ring,2px solid currentColor);scroll-snap-type:y mandatory;height:100vh;margin:0;display:block;overflow:hidden auto}[data-lys]>article{scroll-snap-align:start;min-height:var(--_lys-slide-max-height);max-width:var(--_lys-slide-max-width);padding:var(--_lys-slide-padding);font-size:var(--_lys-font-size-base);box-sizing:border-box;aspect-ratio:var(--_lys-aspect-ratio);max-height:var(--_lys-slide-max-height);margin-inline:auto;position:relative;overflow:hidden}[data-lys]>article+article{margin-top:var(--_lys-slide-gap)}[data-lys]>article[data-background]{background:attr(data-background type(<color>), none)}[data-lys]>article{transition-duration:var(--_lys-transition-duration);transition-timing-function:var(--_lys-transition-easing)}[data-lys]>article:focus-visible{outline:var(--_lys-focus-ring);outline-offset:-2px}[data-lys]>article:focus:not(:focus-visible){outline:none}.lys-sr-only{clip:rect(0, 0, 0, 0);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}[data-lys][data-lys-mode=fade]{scroll-snap-type:none;position:relative;overflow:hidden}[data-lys][data-lys-mode=fade]>article{scroll-snap-align:unset;min-height:unset;height:var(--_lys-slide-max-height);opacity:0;pointer-events:none;transition-property:opacity;position:absolute;top:0;left:50%;transform:translate(-50%)}[data-lys][data-lys-mode=fade]>article[data-lys-active]{opacity:1;pointer-events:auto}@media (prefers-reduced-motion:reduce){[data-lys]{--_lys-transition-duration:0s}}@media print{[data-lys]{scroll-snap-type:none;height:auto;overflow:visible}[data-lys]>article{scroll-snap-align:unset;page-break-after:always;break-after:page;min-height:auto}[data-lys]>article:last-child{page-break-after:avoid;break-after:avoid}[data-lys][data-lys-mode=fade]>article{opacity:1;pointer-events:auto;position:static;transform:none}}
/*$vite$:1*/
<!-- /LYS:CSS -->
  </style>
  <style>
    /* Theme: customize tokens, typography, colors */
    :root {
      --lys-slide-padding: 3rem 4rem;
      --lys-aspect-ratio: 16/9;
      --lys-transition-duration: 400ms;
    }

    * { margin: 0; box-sizing: border-box; }

    body {
      font-family: system-ui, -apple-system, sans-serif;
      color: #f0f0f0;
      background: #0a0a0a;
    }

    [data-lys] > article {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    /* Add heading styles, list styles, code styles, slide variants here */
  </style>
</head>
<body>
  <div data-lys>
    <!-- SLIDES: 8-12 articles using the patterns above -->
  </div>
  <script>
<!-- LYS:JS -->
var Lys=(function(e){Object.defineProperty(e,Symbol.toStringTag,{value:`Module`});function t(e,t,n){let r=[],i=new Map,a=new Set;if(e.setAttribute(`role`,`group`),r.push(`role`),e.setAttribute(`aria-roledescription`,`slide deck`),r.push(`aria-roledescription`),!e.hasAttribute(`aria-label`)&&!e.hasAttribute(`aria-labelledby`)){let n=(t[0]?.querySelector(`h1, h2, h3, h4, h5, h6`))?.textContent?.trim()||`Slide deck`;e.setAttribute(`aria-label`,n),r.push(`aria-label`)}let o=t.length;for(let e=0;e<o;e++){let r=t[e];if(!r)continue;let s=[];r.setAttribute(`role`,`group`),s.push(`role`),r.setAttribute(`aria-roledescription`,`slide`),s.push(`aria-roledescription`),r.hasAttribute(`aria-label`)||(r.setAttribute(`aria-label`,`Slide ${e+1} of ${o}`),s.push(`aria-label`)),e!==n&&(r.setAttribute(`aria-hidden`,`true`),s.push(`aria-hidden`)),r.hasAttribute(`tabindex`)||(r.setAttribute(`tabindex`,`-1`),a.add(r)),i.set(r,s)}let s=document.createElement(`div`);s.setAttribute(`role`,`status`),s.setAttribute(`aria-live`,`polite`),s.setAttribute(`aria-atomic`,`true`),s.className=`lys-sr-only`,e.appendChild(s);function c(e){let{from:n,to:r,slide:a}=e.detail,o=t[n];if(o){o.setAttribute(`aria-hidden`,`true`);let e=i.get(o);e&&!e.includes(`aria-hidden`)&&e.push(`aria-hidden`)}let c=t[r];c&&c.removeAttribute(`aria-hidden`);let l=c?.getAttribute(`aria-label`),u=l&&!/^Slide \d+ of \d+$/.test(l)?`: ${l}`:``;s.textContent=`Slide ${r+1} of ${t.length}${u}`,a.focus({preventScroll:!0})}return e.addEventListener(`lys:slidechange`,c),{destroy(){e.removeEventListener(`lys:slidechange`,c);for(let t of r)e.removeAttribute(t);for(let[e,t]of i)for(let n of t)e.removeAttribute(n);i.clear();for(let e of a)e.removeAttribute(`tabindex`);a.clear(),s.remove()}}}var n=`input,textarea,select,button,[contenteditable],[role='textbox']`;function r(e,t){let r=!t.hasAttribute(`tabindex`);r&&t.setAttribute(`tabindex`,`0`);function i(t){if(!(t.ctrlKey||t.altKey||t.metaKey))switch(t.key){case`ArrowRight`:case`ArrowDown`:e.next(),t.preventDefault();break;case`ArrowLeft`:case`ArrowUp`:e.prev(),t.preventDefault();break;case` `:if(t.target.closest(n))return;t.shiftKey?e.prev():e.next(),t.preventDefault();break;case`Home`:e.goTo(0),t.preventDefault();break;case`End`:e.goTo(e.total-1),t.preventDefault();break}}t.addEventListener(`keydown`,i);let a=0,o=0;function s(e){let t=e.touches[0];t&&(a=t.clientX,o=t.clientY)}function c(t){let n=t.changedTouches[0];if(!n)return;let r=n.clientX-a,i=n.clientY-o;Math.abs(r)>50&&Math.abs(r)>Math.abs(i)&&(r<0?e.next():e.prev())}t.addEventListener(`touchstart`,s,{passive:!0}),t.addEventListener(`touchend`,c,{passive:!0});function l(e){let t=e.match(/^#slide=(.+)$/);if(!t?.[1])return null;let n=t[1],r=Number(n);return Number.isFinite(r)?r-1:n}function u(e){let t=e.detail,n=t.slide.id||String(t.to+1);history.replaceState(null,``,`#slide=${n}`)}function d(){let t=l(location.hash);t!==null&&e.goTo(t)}t.addEventListener(`lys:slidechange`,u),window.addEventListener(`hashchange`,d);let f=l(location.hash);return f!==null&&e.goTo(f),document.querySelectorAll(`[data-lys]`).length===1&&t.focus({preventScroll:!0}),{destroy(){t.removeEventListener(`keydown`,i),t.removeEventListener(`touchstart`,s),t.removeEventListener(`touchend`,c),t.removeEventListener(`lys:slidechange`,u),window.removeEventListener(`hashchange`,d),r&&t.removeAttribute(`tabindex`)}}}var i=new WeakMap,a=class e{#e;#t=[];#n=-1;#r=new Map;#i=!1;#a=null;#o=null;static init(){let t=document.querySelectorAll(`[data-lys]`);return Array.from(t,t=>e.from(t))}static from(t){return i.get(t)||new e(t)}constructor(e){let n=i.get(e);n&&n.destroy(),this.#e=e,this.#t=Array.from(e.querySelectorAll(`:scope > article`)),this.#n=this.#t.length>0?0:-1;for(let e of this.#t){let t=e.dataset.class;if(t){let n=t.split(/\s+/).filter(Boolean);e.classList.add(...n),this.#r.set(e,n)}}for(let e of this.#t){let t=e.dataset.background;t&&(e.style.background=t)}this.#n>=0&&(this.#t[this.#n]?.setAttribute(`data-lys-active`,``),e.setAttribute(`data-lys-current`,String(this.#n))),this.#i=this.#t.some(e=>e.dataset.transition===`fade`),this.#i&&e.setAttribute(`data-lys-mode`,`fade`),i.set(e,this),this.#a=r(this,e),this.#o=t(e,this.#t,this.#n),e.dispatchEvent(new CustomEvent(`lys:ready`,{detail:{instance:this},bubbles:!0}))}get current(){return this.#n}get total(){return this.#t.length}get slide(){return this.#t[this.#n]??null}next(){this.goTo(this.#n+1)}prev(){this.goTo(this.#n-1)}goTo(e){if(this.#t.length===0)return;let t;if(typeof e==`string`){if(t=this.#t.findIndex(t=>t.id===e),t===-1)return}else t=Math.max(0,Math.min(e,this.#t.length-1));if(t===this.#n)return;let n=this.#n,r=this.#t[this.#n],i=this.#t[t];if(i){if(r?.removeAttribute(`data-lys-active`),this.#n=t,i.setAttribute(`data-lys-active`,``),this.#e.setAttribute(`data-lys-current`,String(this.#n)),!this.#i){let e=matchMedia(`(prefers-reduced-motion: reduce)`).matches;i.scrollIntoView({behavior:e?`instant`:`smooth`,block:`start`})}this.#e.dispatchEvent(new CustomEvent(`lys:slidechange`,{detail:{from:n,to:this.#n,slide:i},bubbles:!0}))}}destroy(){this.#o?.destroy(),this.#o=null,this.#a?.destroy(),this.#a=null;for(let e of this.#t)e.removeAttribute(`data-lys-active`);this.#e.removeAttribute(`data-lys-current`),this.#e.removeAttribute(`data-lys-mode`),this.#i=!1;for(let[e,t]of this.#r)e.classList.remove(...t);this.#r.clear();for(let e of this.#t)e.dataset.background&&(e.style.background=``);this.#t=[],this.#n=-1,i.delete(this.#e)}};return typeof document<`u`&&(document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,()=>a.init(),{once:!0}):a.init()),e.Lys=a,e})({});
<!-- /LYS:JS -->
  </script>
</body>
</html>
```

## Anti-Patterns

Do NOT generate:

1. `<div>` or `<section>` as slides — always use `<article>`
2. Inline `onclick` or JS event handlers — Lys handles all interaction
3. External dependencies, CDN links, or `<script src>` — single file, fully inlined
4. Framework components (React, Vue, etc.) — plain HTML only
5. `data-lys-active`, `data-lys-current`, `data-lys-mode` attributes — these are internal state managed by Lys
6. `--_lys-*` internal tokens — only set `--lys-*` public tokens
7. Unstyled output — always include a cohesive theme with colors, typography, and spacing
