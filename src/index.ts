import * as Base from "@flexiformal/ftml";

export * as FTML from "@flexiformal/ftml";
export const initialize = Base.initialize;

export type FtmlConfig = Base.FTML.FtmlConfig;
export type FtmlContext = Base.FTML.LeptosContext;
export type FtmlDocumentOptions = Base.FTML.DocumentOptions;
export type FtmlFragmentOptions = Base.FTML.FragmentOptions;

export function getCurrentUri(
    context: FtmlContext,
): Base.FTML.NarrativeUri {
    return Base.FTML.get_current_uri(context);
}

const BOOLEAN_CONFIG_ATTRIBUTES: [string, keyof FtmlConfig][] = [
    ["allow-hovers", "allowHovers"],
    ["allow-fullscreen", "allowFullscreen"],
    ["allow-formal-info", "allowFormalInfo"],
    ["allow-notation-changes", "allowNotationChanges"],
    ["allow-subterms", "allowSubterms"],
    ["choose-highlight-style", "chooseHighlightStyle"],
    ["show-content", "showContent"],
    ["pdf-link", "pdfLink"],
];

const SCALAR_CONFIG_ATTRIBUTES: [string, keyof FtmlConfig][] = [
    ["document-uri", "documentUri"],
];

const ENUM_CONFIG_ATTRIBUTES: [string, keyof FtmlConfig][] = [
    ["highlight-style", "highlightStyle"],
    ["toc", "toc"],
];

const JSON_CONFIG_ATTRIBUTES: [string, keyof FtmlConfig][] = [
    ["toc-progress", "tocProgress"],
    ["autoexpand-limit", "autoexpandLimit"],
    ["problem-states", "problemStates"],
];

const CONFIG_ATTRIBUTES = [
    ...BOOLEAN_CONFIG_ATTRIBUTES.map(([attribute]) => attribute),
    ...SCALAR_CONFIG_ATTRIBUTES.map(([attribute]) => attribute),
    ...ENUM_CONFIG_ATTRIBUTES.map(([attribute]) => attribute),
    ...JSON_CONFIG_ATTRIBUTES.map(([attribute]) => attribute),
];

abstract class FtmlElement extends HTMLElement {
    static get observedAttributes(): string[] {
        return CONFIG_ATTRIBUTES;
    }

    private _config: FtmlConfig = {};
    private _providedContext: FtmlContext | undefined;
    private _renderedContext: FtmlContext | undefined;
    private _handle: Base.FTML.LeptosMountHandle | undefined;
    private _mountPoint: HTMLDivElement | undefined;

    get config(): FtmlConfig {
        return this._config;
    }

    set config(value: FtmlConfig) {
        this._config = value ?? {};
        this.renderFtml();
    }

    get context(): FtmlContext | undefined {
        return this._providedContext ?? this._renderedContext;
    }

    set context(value: FtmlContext | undefined) {
        this._providedContext = value;
        this.renderFtml();
    }

    connectedCallback(): void {
        this.renderFtml();
    }

    disconnectedCallback(): void {
        this.unmount();
        this._renderedContext = undefined;
    }

    attributeChangedCallback(
        _name: string,
        oldValue: string | null,
        newValue: string | null,
    ): void {
        if (oldValue !== newValue) this.renderFtml();
    }

    protected abstract mount(
        target: HTMLDivElement,
        config: FtmlConfig,
        context: FtmlContext | undefined,
    ): Base.FTML.LeptosMountHandle | undefined;

    protected renderFtml(): void {
        if (!this.isConnected) return;

        this.unmount();
        const target = this.getMountPoint();
        const context = this._providedContext ?? this.findParentContext();
        try {
            this._handle = this.mount(target, this.getConfig(), context);
        } catch (error) {
            this.dispatchEvent(
                new CustomEvent("ftml-error", {
                    detail: error instanceof Error
                        ? error
                        : new Error(String(error)),
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    protected setRenderedContext(context: FtmlContext): void {
        this._renderedContext = context;
        this.dispatchEvent(
            new CustomEvent<FtmlContext>("ftml-context", {
                detail: context,
                bubbles: true,
                composed: true,
            }),
        );
    }

    protected unmount(): void {
        this._handle?.unmount();
        this._handle = undefined;
    }

    private getMountPoint(): HTMLDivElement {
        if (!this._mountPoint) {
            this._mountPoint = document.createElement("div");
            this._mountPoint.style.display = "contents";
            this.append(this._mountPoint);
        }
        return this._mountPoint;
    }

    private findParentContext(): FtmlContext | undefined {
        let parent = this.parentElement;
        while (parent) {
            if (parent instanceof FtmlElement && parent.context) {
                return parent.context;
            }
            parent = parent.parentElement;
        }
        return undefined;
    }

    private getConfig(): FtmlConfig {
        const config: FtmlConfig = {};
        for (const [attribute, property] of BOOLEAN_CONFIG_ATTRIBUTES) {
            if (!this.hasAttribute(attribute)) continue;
            const value = this.getAttribute(attribute)?.toLowerCase();
            (config as Record<string, unknown>)[property] =
                value !== "false" && value !== "0";
        }

        for (const [attribute, property] of SCALAR_CONFIG_ATTRIBUTES) {
            if (!this.hasAttribute(attribute)) continue;
            (config as Record<string, unknown>)[property] =
                this.getAttribute(attribute);
        }

        for (const [attribute, property] of ENUM_CONFIG_ATTRIBUTES) {
            if (!this.hasAttribute(attribute)) continue;
            const value = this.getAttribute(attribute)?.trim();
            if (!value) continue;

            if (property === "highlightStyle") {
                const styles: Record<string, number> = {
                    colored: 0,
                    subtle: 1,
                    off: 2,
                    none: 3,
                };
                const numericValue = Number(value);
                const style = Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= 3
                    ? numericValue
                    : styles[value.toLowerCase()];
                if (style !== undefined) {
                    config.highlightStyle = style as FtmlConfig["highlightStyle"];
                }
            } else if (property === "toc") {
                const toc = value.toLowerCase();
                if (toc === "none" || toc === "extract" || toc === "get") {
                    config.toc = toc[0].toUpperCase() + toc.slice(1) as FtmlConfig["toc"];
                }
            }
        }

        for (const [attribute, property] of JSON_CONFIG_ATTRIBUTES) {
            if (!this.hasAttribute(attribute)) continue;
            const value = this.getAttribute(attribute);
            if (!value) continue;
            try {
                const parsed = JSON.parse(value);
                if (property === "problemStates") {
                    const entries = Array.isArray(parsed) ? parsed : [];
                    config.problemStates = new Map(entries);
                } else {
                    (config as Record<string, unknown>)[property] = parsed;
                }
            } catch (error) {
                this.dispatchEvent(
                    new CustomEvent("ftml-error", {
                        detail: error instanceof Error
                            ? new Error(`Invalid ${attribute} attribute: ${error.message}`)
                            : new Error(`Invalid ${attribute} attribute.`),
                        bubbles: true,
                        composed: true,
                    }),
                );
            }
        }

        Object.assign(config, this._config);
        return config;
    }
}

export class FtmlSetupElement extends FtmlElement {
    static get observedAttributes(): string[] {
        return [...super.observedAttributes];
    }

    private _content: Node[] | undefined;

    protected mount(
        target: HTMLDivElement,
        config: FtmlConfig,
        context: FtmlContext | undefined,
    ): Base.FTML.LeptosMountHandle | undefined {
        if (context) return Base.FTML.apply_config(config, target, context);

        this._content ??= Array.from(this.childNodes).filter(
            (node) => node !== target,
        );
        return Base.ftmlSetup(
            target,
            (element, leptosContext) => {
                this.setRenderedContext(leptosContext);
                element.append(...(this._content ?? []));
            },
            config,
        );
    }
}

export class FtmlDocumentElement extends FtmlElement {
    static get observedAttributes(): string[] {
        return [...super.observedAttributes, "uri", "html"];
    }

    private _document: FtmlDocumentOptions | undefined;

    get document(): FtmlDocumentOptions | undefined {
        return this._document;
    }

    set document(value: FtmlDocumentOptions | undefined) {
        this._document = value;
        this.renderFtml();
    }

    protected mount(
        target: HTMLDivElement,
        config: FtmlConfig,
        context: FtmlContext | undefined,
    ): Base.FTML.LeptosMountHandle | undefined {
        const document = this._document ?? this.optionsFromAttributes();
        if (!document) {
            this.dispatchEvent(
                new CustomEvent("ftml-error", {
                    detail: new Error("ftml-document requires a document or uri."),
                    bubbles: true,
                    composed: true,
                }),
            );
            return undefined;
        }
        return Base.ftmlDocument(target, document, context, config);
    }

    private optionsFromAttributes(): FtmlDocumentOptions | undefined {
        const uri = this.getAttribute("uri");
        if (this.hasAttribute("html")) {
            return {
                type: "HtmlString",
                html: this.getAttribute("html") ?? "",
                uri: uri ?? undefined,
            };
        }
        return uri ? { type: "FromBackend", uri } : undefined;
    }
}

export class FtmlFragmentElement extends FtmlElement {
    static get observedAttributes(): string[] {
        return [...super.observedAttributes, "uri", "html"];
    }

    private _fragment: FtmlFragmentOptions | undefined;

    get fragment(): FtmlFragmentOptions | undefined {
        return this._fragment;
    }

    set fragment(value: FtmlFragmentOptions | undefined) {
        this._fragment = value;
        this.renderFtml();
    }

    protected mount(
        target: HTMLDivElement,
        config: FtmlConfig,
        context: FtmlContext | undefined,
    ): Base.FTML.LeptosMountHandle | undefined {
        const fragment = this._fragment ?? this.optionsFromAttributes();
        if (!fragment) {
            this.dispatchEvent(
                new CustomEvent("ftml-error", {
                    detail: new Error("ftml-fragment requires a fragment or uri."),
                    bubbles: true,
                    composed: true,
                }),
            );
            return undefined;
        }
        return Base.ftmlFragment(target, fragment, context, config);
    }

    private optionsFromAttributes(): FtmlFragmentOptions | undefined {
        const uri = this.getAttribute("uri");
        if (this.hasAttribute("html")) {
            return {
                type: "HtmlString",
                html: this.getAttribute("html") ?? "",
                uri: uri ?? undefined,
            };
        }
        return uri ? { type: "FromBackend", uri } : undefined;
    }
}

export function defineFtmlElements(
    registry: CustomElementRegistry = customElements,
): void {
    if (!registry.get("ftml-setup")) {
        registry.define("ftml-setup", FtmlSetupElement);
    }
    if (!registry.get("ftml-document")) {
        registry.define("ftml-document", FtmlDocumentElement);
    }
    if (!registry.get("ftml-fragment")) {
        registry.define("ftml-fragment", FtmlFragmentElement);
    }
}