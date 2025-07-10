if (typeof exports === 'undefined') {
    var exports = {}
}

const VERSION = '1.0.2'; // Version of the copyClipboard function

const DEFAULT_OPTIONS = {
    // The selector for the elements to make copyable (i.e. the element whose content will be copied)
    target: null, 
    // The selector for the children of the target elements to make copyable (i.e. if the copyable element is a container and you want to copy from on of its children)
    targetChildren: null,
    // Whether to copy only the content of the first target element or all of them
    multiple: true,
    // The character to use to join the text content of the targets when copying multiple elements
    joinText: '\n',
    // Whether to copy an image to the clipboard if the target is an image
    images: true,
    // A value to copy instead of the content of the targets
    value: null,
    // Whether to hide warnings or not
    suppressWarnings: true,
    // Whether to log debug messages or not
    debug: false
};

/**
 * Converts a snake_case string to camelCase.
 * @param {string} str - The snake_case string to convert.
 * @returns {string} - The converted camelCase string.
 */
function snakeToCamel(str) {
    let stage1 = str.split("-").map((v) => v.charAt(0).toUpperCase() + v.slice(1)).join("");
    return stage1.charAt(0).toLowerCase() + stage1.slice(1);
}

/**
 * Merges options from the target element's dataset with the provided options, creating a new options object
 *   that contains the dataset attributes that match the keys in the options object.
 * If a prefix is provided, it will be prepended to the dataset keys.
 * @example
 *     <div data-copy-target="selector" data-copy-value="value"></div>
 *     mergeOptions(document.querySelector('div'), { target: 'defaultSelector', value: 'defaultValue' }, 'copy');
 *   This will return an object like:
 *      { target: 'selector', value: 'value' }
 * 
 * @param {HTMLElement} target - The target element from which to read dataset attributes.
 * @param {Object} options - The options to merge with the dataset attributes.
 * @param {string} prefix - A prefix to prepend to the dataset keys.
 * @returns {Object} - The merged options object.
 */
function mergeOptions(target, options = {}, prefix = '') {
    if (prefix != "") {
        prefix = prefix + "-";
    }
    let resultingOptions = {};
    for (const key in options) {
        let optionName = snakeToCamel(`${prefix}${key}`);
        if (optionName in target.dataset) {
            resultingOptions[key] = target.dataset[optionName];
        } else {
            resultingOptions[key] = options[key];
        }
    }
    return resultingOptions;
}

/**
 * Converts a value to a boolean, taking into account various types of values.
 * - If the value is a boolean, it returns the value as is.
 * - If the value is a number, it returns true for any non-zero number and false for zero.
 * - If the value is a string, it checks if the string is 'true' (case-insensitive) and returns true, otherwise it returns false.
 * - For any other type, it returns the boolean equivalent of the value.
 * @param {*} value - The value to convert to a boolean.
 * @returns {boolean} - The boolean representation of the value.
 */
function boolVal(value) {
    if (!!value === value) {
        return value;
    }
    if (+value === value) {
        if (value == 0) return false;
        return true;
    }
    if (''+value === value) {
        return value.toLowerCase() === 'true';
    }
    return !!value;
}

async function copyTextToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy text to clipboard:', err);
    }
}

async function copyImageToClipboard(imageElement) {

    async function getImage(imageElement, changeCrossOrigin = false) {

        async function getBlobFromImage(image) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.naturalWidth || image.width;
            canvas.height = image.naturalHeight || image.height;
            ctx.drawImage(image, 0, 0);
            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    canvas.remove(); // Clean up the canvas element
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                }, 'image/png'); // You can change the format if needed
            });
        }

        if (typeof imageElement === 'string') {
            // If the imageElement is a string, we assume it's a URL
            let image = new Image();
            image.crossOrigin = 'anonymous'; // Ensure the image can be accessed if it's from a different origin
            image.src = imageElement;
            return new Promise((resolve, reject) => {
                image.onload = () => getBlobFromImage(image).then(resolve).catch(reject);
                image.onerror = (err) => reject(new Error(`Failed to load image: ${err.message}`));
            });
        }

        if (!(imageElement instanceof HTMLImageElement)) {
            throw new Error('Provided element is not an image');
        }

        let image = imageElement;
        if (changeCrossOrigin) {
            image = new Image();
            image.crossOrigin = 'anonymous'; // Ensure the image can be accessed if it's from a different origin
            image.src = imageElement.src;
            return new Promise((resolve, reject) => {
                image.onload = () => getBlobFromImage(image).then(resolve).catch(reject);
                image.onerror = (err) => reject(new Error(`Failed to load image: ${err.message}`));
            });
        } else {
            return getBlobFromImage(image);
        }
    }

    let blob = null;
    try {
        blob = await getImage(imageElement, false);
    } catch (err) {
        console.warn("Failed to get image without cross-origin; we'll try to download it again\n", err);
    }

    try {
        if (!blob) {
            blob = await getImage(imageElement, true); // Try again with cross-origin
        }
        if (!blob) {
            throw new Error('Blob creation failed');
        }
        let item = new ClipboardItem({ [blob.type]: blob });
        try {
            await navigator.clipboard.write([item]);
        } catch (err) {
            console.error('Failed to copy image to clipboard:', err);
        }
    } catch (err_1) {
        console.error('Failed to fetch image:', err_1);
    }
}

function copyClipboard(element, options = {}) {
    options = Object.assign({}, DEFAULT_OPTIONS, options);
    let WARNING = (x) => x;
    let DEBUG = (x) => x;
    if (!boolVal(options.suppressWarnings)) {
        WARNING = (...x) => console.warn(...x)
    }
    if (boolVal(options.debug)) {
        DEBUG = (...x) => console.log(...x);
    }

    // First we get the elements to make copyable
    let elements = [];
    if (typeof element === 'string') {
        elements = document.querySelectorAll(element);
    } else if (element instanceof HTMLElement) {
        elements = [element];
    }
    if (elements.length === 0) {
        WARNING('No elements found to make copyable:', element);
        return;
    }
    if (elements instanceof NodeList || elements instanceof HTMLCollection) {
        elements = Array.from(elements);
    } else if (!Array.isArray(elements)) {
        elements = [elements];
    }

    // Now we get the target selector and target children selector from the options
    for (const copyable of elements) {
        let elementOptions = mergeOptions(copyable, options, "copy");

        // Get the suppressWarnings option
        WARNING = (x) => x;
        if (!boolVal(elementOptions.suppressWarnings)) {
            WARNING = (x) => console.warn(x)
        }
        // Get the debug option
        DEBUG = (x) => x;
        if (boolVal(elementOptions.debug)) {
            DEBUG = (...x) => console.log(...x);
        }

        if (!elementOptions.target && !elementOptions.targetChildren && !elementOptions.value) {
            WARNING('Nothing to copy for element:', copyable);
            continue;
        }

        // In case that we have set this element as copyable before, we need to remove the previous event listener
        if (copyable._copyClipboard) {
            copyable.removeEventListener('click', copyable._copyClipboard.copyHandler);
            delete copyable._copyClipboard; // Clean up the previous copyable data
        }

        // Finally we prepare the target selector and target children selector
        const copyHandler = function() {
            let targetElements = [];

            if (elementOptions.value) {
                // If the value is a file that contains an image, we copy the image to the clipboard
                if (options.images && options.value instanceof File && options.value.type.startsWith('image/')) {
                    let item = new ClipboardItem({ [options.value.type]: options.value });
                    navigator.clipboard.write([item])
                        .then(() => {
                            DEBUG(`Image copied from file to clipboard.`);
                        })
                        .catch(err => {
                            console.error('Failed to copy image:', err);
                        });
                    return; // Skip the text copying for images
                } else if (typeof options.value === 'string' || typeof options.value === 'number') {
                    // If the value is a string or number, we copy it to the clipboard
                    copyTextToClipboard(options.value);
                    return; 
                } else if (options.value instanceof HTMLElement) {
                    // If the value is an HTMLElement, we copy its text content to the clipboard
                    copyTextToClipboard(options.value.innerText || options.value.textContent);
                    return; 
                } else if (Array.isArray(options.value)) {
                    // If the value is an array, we join it and copy it to the clipboard
                    copyTextToClipboard(options.value.join('\n'));
                    return; 
                } else {
                    // If the value is not a string, number, HTMLElement or array, we log a warning
                    WARNING(`Unsupported value type for copying: ${typeof options.value}. Expected string, number, HTMLElement or array.`);
                    return;
                }
            } else {
                // There is no value to copy, so we need to get the target elements
                let targets = elementOptions.target ? document.querySelectorAll(elementOptions.target) : [];
                let targetChildren = elementOptions.targetChildren ? copyable.querySelectorAll(elementOptions.targetChildren) : [];
                targets = [ ...targets, ...targetChildren ];

                if (targets.length === 0) {
                    WARNING(`No target elements found for selector: ${elementOptions.target} or children selector: ${elementOptions.targetChildren}.`);
                    return;
                }

                if (!boolVal(elementOptions.multiple)) {
                    // If we are copying only the first target element, we take the first one
                    targetElements = [targets[0]];
                    DEBUG(`Copying only the first target element: ${targetElements[0]}`);
                } else {
                    // If we are copying all target elements, we take all of them
                    targetElements = Array.from(targets);
                    DEBUG(`Copying all target elements: `, targetElements);
                }

                let resultingTexts = [];

                for (const targetElement of targetElements) {
                    // If the target element is an image and we are allowed to copy images, we copy it
                    if (boolVal(elementOptions.images) && targetElement.tagName.toLowerCase() === 'img') {
                        copyImageToClipboard(targetElement);
                        return; // Skip the text copying for images
                    } else {
                        // Otherwise, we copy the text content of the target element to the clipboard
                        if (targetElement.tagName.toLowerCase() === 'input' || targetElement.tagName.toLowerCase() === 'textarea') {
                            // If the target element is an input or textarea, we copy its value
                            resultingTexts.push(targetElement.value || '');
                        } else if (targetElement.tagName.toLowerCase() === 'select') {
                            // If the target element is a select, we copy its selected option text
                            resultingTexts.push(targetElement.options[targetElement.selectedIndex].text || '');
                        } else if (targetElement.tagName.toLowerCase() === 'img') {
                            resultingTexts.push(targetElement.alt || targetElement.title || targetElement.src || '');
                        } else {
                            // For other elements, we copy the inner text or text content
                            // We also check for textContent, value, text, and alt attributes as fallbacks
                            // to ensure we get the text content correctly
                            resultingTexts.push(targetElement.innerText || targetElement.textContent || targetElement.value || targetElement.text || targetElement.alt || '');
                        }
                    }
                }

                // If we have collected any text content, we copy it to the clipboard
                if (resultingTexts.length > 0) {
                    copyTextToClipboard(resultingTexts.join(elementOptions.joinText));
                }
            }
        }

        copyable._copyClipboard = {
            options: elementOptions,
            copyHandler: copyHandler,
            version: VERSION // Version of the copyClipboard function
        };
        copyable.addEventListener('click', copyHandler);
    }
}

function handlePaste(event, options = {}) {

    const DEFAULT_OPTIONS = {
        onPasteImage: (file) => {},
        onPasteText: (text) => {},
        onError: (error) => console.error(error),
    }

    options = Object.assign({}, DEFAULT_OPTIONS, options);

    // Get the clipboard data
    let clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData) {
        if (typeof options.onError === 'function') {
            options.onError("No clipboard data available. Please ensure you have copied something to the clipboard before pasting.");
        }
        return false;
    }

    // Check if the clipboard data is an image
    if (clipboardData.items) {
        for (var i = 0; i < clipboardData.items.length; i++) {
            var item = clipboardData.items[i];
            if (item.kind === "file" && item.type.startsWith("image/")) {
                var file = item.getAsFile();
                if (!file) {
                    if (typeof options.onError === 'function') {
                        options.onError("No file found in clipboard data. Please ensure you have copied an image to the clipboard before pasting.");
                    }
                    return false;
                }

                if (typeof options.onPasteImage === 'function') {
                    options.onPasteImage(file);
                }
                return true;
                break;
            } else if (item.kind === "string" && item.type === "text/plain") {
                item.getAsString(function (text) {
                    if (typeof options.onPasteText === 'function') {
                        options.onPasteText(text);
                    }
                });
                return true;
                break;
            }
        }
    } else {
        var pastedData = clipboardData.getData("Text");
        if (pastedData) {
            if (typeof options.onPasteText === 'function') {
                options.onPasteText(pastedData);
            }
            return true;
        } else {
            if (typeof options.onError === 'function') {
                options.onError("No text data found in clipboard data. Please ensure you have copied text to the clipboard before pasting.");
            }
            return false;
        }
    }    
}

navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
    if (result.state === "granted" || result.state === "prompt") {
        exports.copyClipboard = copyClipboard;
    } else {
        console.warn('Clipboard write permission is not granted. Cannot make elements copyable.');
        exports.copyClipboard = function() {
            console.warn('Clipboard write permission is not granted. Cannot make elements copyable.');
        }
    }
    exports.copyClipboard.version = VERSION; // Export the version of the copyClipboard function
    exports.copyClipboard.copyTextToClipboard = copyTextToClipboard;
    exports.copyClipboard.copyImageToClipboard = copyImageToClipboard;
    exports.copyClipboard.handlePaste = handlePaste;
});

document.addEventListener('DOMContentLoaded', () => {
    // Automatically apply copyClipboard to elements with the data-copy-target attribute
    const copyableElements = document.querySelectorAll('[data-copy-target],[data-copy-value],[data-copy-target-children]');
    copyableElements.forEach(element => {
        const options = mergeOptions(element, DEFAULT_OPTIONS, 'copy');
        copyClipboard(element, options);
    });
});

