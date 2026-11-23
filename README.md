# @flexiformal/ftml-native

Framework-free FTML web components for browser applications.

```ts
import { defineFtmlElements, initialize } from "@flexiformal/ftml-native";

await initialize();
defineFtmlElements();

const documentElement = document.createElement("ftml-document");
documentElement.document = {
    type: "FromBackend",
    uri: "http://example.org/archive/document?lang=en",
};
documentElement.config = { allowHovers: true };
document.body.append(documentElement);
```

The registered elements are `<ftml-setup>`, `<ftml-document>`, and
`<ftml-fragment>`. Documents and fragments accept `uri` and optional `html`
attributes for simple markup use. Their typed options can be set through the
`document` and `fragment` properties. All FTML configuration can be supplied
through the `config` property; wrapping callbacks receive native DOM elements
and a Leptos context.

`<ftml-setup>` provides its Leptos context to nested FTML elements. The context
is also available from its `context` property and through the bubbling
`ftml-context` event. Elements dispatch a bubbling `ftml-error` event when
required document or fragment options are missing.