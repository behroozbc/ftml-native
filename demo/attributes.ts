import { defineFtmlElements, initialize } from "../dist/index.mjs";
import "./style.css";

const backendInput = document.querySelector<HTMLInputElement>("#backend")!;
const loadButton = document.querySelector<HTMLButtonElement>("#load")!;
const status = document.querySelector<HTMLElement>("#status")!;

let initializedBackend: string | undefined;

for (const element of document.querySelectorAll("ftml-document, ftml-fragment")) {
    element.addEventListener("ftml-error", (event) => {
        const error = (event as CustomEvent<Error>).detail;
        status.textContent = error.message;
        status.dataset.state = "error";
    });
}

loadButton.addEventListener("click", async () => {
    const backend = backendInput.value.trim();
    if (!backend) return;

    loadButton.disabled = true;
    status.textContent = "Initializing";
    status.dataset.state = "loading";

    try {
        if (!initializedBackend || initializedBackend !== backend) {
            await initialize(backend, "WARN");
            initializedBackend = backend;
        }
        defineFtmlElements();
        status.textContent = "Attributes loaded";
        status.dataset.state = "ready";
    } catch (error) {
        status.textContent = error instanceof Error ? error.message : "Unable to initialize FTML";
        status.dataset.state = "error";
    } finally {
        loadButton.disabled = false;
    }
});
