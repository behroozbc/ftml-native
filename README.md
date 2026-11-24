# @behroozbc/ftml-native

Framework-free FTML web components for browser applications.

```ts
import { defineFtmlElements, initialize } from "@behroozbc/ftml-native";

await initialize();
defineFtmlElements();

const documentElement = document.createElement("ftml-document");
documentElement.document = {
    type: "FromBackend",
    uri: "http://mathhub.info?a=sTeX/MathTutorial&d=textbook&l=en",
};
documentElement.config = { allowHovers: true };
document.body.append(documentElement);
```

A live attribute/property playground is available in `demo/index.html`. The
markup-only example is at `demo/attributes.html` and can be opened through Vite
at `/attributes.html`.

The registered elements are `<ftml-setup>`, `<ftml-document>`, and
`<ftml-fragment>`.

## Property examples

### Document with a backend URI

```ts
const documentElement = document.createElement("ftml-document");
documentElement.document = {
    type: "FromBackend",
    uri: "http://mathhub.info?a=sTeX/MathTutorial&d=textbook&l=en",
};
documentElement.config = {
    allowHovers: true,
    allowFullscreen: true,
    toc: "Get",
};
document.body.append(documentElement);
```

### Inline HTML document

```ts
const documentElement = document.createElement("ftml-document");
documentElement.document = {
    type: "HtmlString",
    html: "<section><h2>Inline document</h2><p>Hello.</p></section>",
    uri: "http://mathhub.info?a=sTeX/MathTutorial&amp;d=textbook&amp;l=en",
};
document.body.append(documentElement);
```

### Fragment

```ts
const fragmentElement = document.createElement("ftml-fragment");
fragmentElement.fragment = {
    type: "FromBackend",
    uri: "http://mathhub.info?a=sTeX/MathTutorial&d=textbook&e=<element-id>&l=en",
};
fragmentElement.config = { showContent: true };
document.body.append(fragmentElement);
```

## Attribute examples

### Backend document

```html
<ftml-document
  uri="http://mathhub.info?a=sTeX/MathTutorial&amp;d=textbook&amp;l=en"
  allow-hovers
  allow-fullscreen
  toc="get"
  highlight-style="colored"></ftml-document>
```

Boolean attributes accept a missing value or `true` as enabled. `false` and
`0` explicitly disable an option.

```html
<ftml-document uri="http://mathhub.info?a=sTeX/MathTutorial&amp;d=textbook&amp;l=en" allow-hovers="false"></ftml-document>
```

### Independent document and fragment attributes

```html
<ftml-document
  uri="http://mathhub.info?a=sTeX/MathTutorial&amp;d=textbook&amp;l=en"
  allow-hovers="true"
  toc="get"></ftml-document>

<ftml-fragment
  html="&lt;p&gt;Inline fragment&lt;/p&gt;"
  show-content></ftml-fragment>
```

### Inline HTML

```html
<ftml-document
  html="&lt;section&gt;&lt;h2&gt;Inline document&lt;/h2&gt;&lt;/section&gt;"
  uri="http://mathhub.info?a=sTeX/MathTutorial&amp;d=textbook&amp;l=en"></ftml-document>

<ftml-fragment
  html="&lt;p&gt;Inline fragment&lt;/p&gt;"></ftml-fragment>
```

### Nested setup context

```html
<ftml-setup allow-hovers toc="get">
  <ftml-document
    uri="http://mathhub.info?a=sTeX/MathTutorial&amp;d=textbook&amp;l=en"></ftml-document>
  <ftml-fragment
    html="&lt;p&gt;Nested fragment&lt;/p&gt;"></ftml-fragment>
</ftml-setup>
```

When `ftml-setup` already has a context, nested elements inherit it. JavaScript
`context` properties can still be set explicitly when context nesting is not used.

## Attributes and properties

| Element | Attributes | Properties |
| --- | --- | --- |
| `<ftml-setup>` | FTML config attributes below | `config`, `context` |
| `<ftml-document>` | `uri`, `html`, FTML config attributes below | `document`, `config`, `context` |
| `<ftml-fragment>` | `uri`, `html`, FTML config attributes below | `fragment`, `config`, `context` |

For documents and fragments:

- `uri` selects content with `type: "FromBackend"`.
- `html` selects inline markup with `type: "HtmlString"`. An optional `uri`
  attribute is retained as the markup URI.
- `document` and `fragment` accept their typed options only through JavaScript
  properties. In HTML, use `uri` for backend content or `html` plus optional
  `uri` for inline markup. Setting a JavaScript property takes precedence over
  attributes.

The base elements support all properties from `FtmlConfig` in one of these ways:

- Use individual attributes for configuration instead of a combined `config`
  JSON attribute.
- Boolean properties use presence-based attributes. Attribute values of
  `"false"` or `"0"` disable the option; other values enable it.
- `document-uri` maps to `documentUri`.
- `highlight-style` accepts `colored`, `subtle`, `off`, or `none`, and also
  accepts its numeric enum value (`0`-`3`).
- `toc` accepts `none`, `extract`, or `get`.
- `toc-progress` is a JSON array of TOC progress objects.
- `problem-states` accepts a JSON array of `[uri, state]` entries and converts
  it to the `Map` required by `FtmlConfig.problemStates`.
- `autoexpand-limit` is a JSON `LogicalLevel` object, such as
  `{"type":"Section"}` or `{"type":"None"}`.

Boolean attributes are:

- `allow-hovers`
- `allow-fullscreen`
- `allow-formal-info`
- `allow-notation-changes`
- `allow-subterms`
- `choose-highlight-style`
- `show-content`
- `pdf-link`

Combined JSON `config`, `document`, and `fragment` attributes are not supported.
The `context` property is JavaScript-only; pass a `FtmlContext` with the
`context` property. Callback fields (`sectionWrap`, `paragraphWrap`,
`slideWrap`, `problemWrap`, `onSectionTitle`, and `onProblemResponse`) are also
JavaScript-only.

`<ftml-setup>` provides its Leptos context to nested FTML elements. The context
is also available from its `context` property and through the bubbling
`ftml-context` event. Elements dispatch a bubbling `ftml-error` event when
required document or fragment options are missing.