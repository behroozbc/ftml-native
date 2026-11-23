import {
    defineFtmlElements,
    initialize,
    type FtmlConfig,
    type FtmlDocumentElement,
    type FtmlFragmentElement,
} from "../dist/index.mjs";
import "./style.css";

defineFtmlElements();

const form = document.querySelector<HTMLFormElement>("#render-form")!;
const stage = document.querySelector<HTMLElement>("#stage")!;
const status = document.querySelector<HTMLElement>("#status")!;
const statusText = document.querySelector<HTMLElement>("#status-text")!;
const contextState = document.querySelector<HTMLElement>("#context-state")!;
const submitButton = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
const emptyState = stage.querySelector<HTMLElement>("#empty-state")!;
const documentViewer = stage.querySelector<FtmlDocumentElement>("#ftml-document")!;
const fragmentViewer = stage.querySelector<FtmlFragmentElement>("#ftml-fragment")!;
let renderId = 0;
let initialization: Promise<void> | undefined;
let initializedBackend: string | undefined;

for (const viewer of [documentViewer, fragmentViewer]) {
    viewer.addEventListener("ftml-error", (errorEvent) => {
        const detail = (errorEvent as CustomEvent<Error>).detail;
        setStatus(detail.message, "error");
    });
}

const backendInput = form.querySelector<HTMLInputElement>("#backend")!;
backendInput.value = "https://mathhub.info";

function setStatus(message: string, state: "ready" | "loading" | "error" = "ready") {
    status.dataset.state = state;
    statusText.textContent = message;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const currentRender = ++renderId;
    const formData = new FormData(form);
    const backendUrl = String(formData.get("backend")).trim();
    const uri = String(formData.get("uri")).trim();
    const mode = String(formData.get("mode"));
    const markSections = (form.querySelector<HTMLInputElement>("#sections")!).checked;

    submitButton.disabled = true;
    contextState.textContent = "STANDALONE";
    setStatus("Connecting to FTML", "loading");
    emptyState.hidden = false;
    emptyState.classList.remove("error-state");
    emptyState.querySelector(".empty-glyph")!.textContent = "F";
    emptyState.querySelector("p")!.textContent = "Awaiting document";
    documentViewer.hidden = true;
    fragmentViewer.hidden = true;

    try {
        if (initializedBackend && initializedBackend !== backendUrl) {
            throw new Error("Reload the page to switch FTML backends.");
        }
        initialization ??= initialize(backendUrl, "WARN");
        await initialization;
        initializedBackend = backendUrl;
        if (currentRender !== renderId) return;

        const config: FtmlConfig = {
            allowHovers: form.querySelector<HTMLInputElement>("#hovers")!.checked,
            toc: form.querySelector<HTMLInputElement>("#toc")!.checked ? "Get" : "None",
            sectionWrap: markSections
                ? (_sectionUri, level) => (element) => {
                    element.classList.add("demo-section");
                    element.dataset.demoLevel = level.type;
                }
                : undefined,
            onProblemResponse: (response) => {
                setStatus(`Response received for ${response.uri}`);
            },
        };

        emptyState.hidden = true;
        documentViewer.hidden = mode !== "document";
        fragmentViewer.hidden = mode !== "fragment";

        const viewer = mode === "fragment" ? fragmentViewer : documentViewer;
        viewer.config = config;

        if (mode === "fragment") {
            fragmentViewer.fragment = { type: "FromBackend", uri };
        } else {
            documentViewer.document = { type: "FromBackend", uri };
        }

        setStatus("Rendering requested", "loading");
    } catch (error) {
        if (currentRender !== renderId) return;
        setStatus(error instanceof Error ? error.message : "Unable to initialize FTML", "error");
        emptyState.hidden = false;
        emptyState.classList.add("error-state");
        emptyState.querySelector(".empty-glyph")!.textContent = "!";
        emptyState.querySelector("p")!.textContent = "Could not connect to FTML";
        documentViewer.hidden = true;
        fragmentViewer.hidden = true;
    } finally {
        if (currentRender === renderId) submitButton.disabled = false;
    }
});