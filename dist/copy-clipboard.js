/**
    MIT License

    Copyright 2023 Carlos A. (https://github.com/dealfonso)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

(function (exports) {
	if (typeof exports === "undefined") {
		var exports = {};
	}
	const VERSION = "1.0.1";
	const DEFAULT_OPTIONS = {
		target: null,
		targetChildren: null,
		multiple: true,
		joinText: "\n",
		images: true,
		value: null,
		suppressWarnings: true,
		debug: false
	};

	function snakeToCamel(str) {
		let stage1 = str.split("-").map(v => v.charAt(0).toUpperCase() + v.slice(1)).join("");
		return stage1.charAt(0).toLowerCase() + stage1.slice(1);
	}

	function mergeOptions(target, options = {}, prefix = "") {
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

	function boolVal(value) {
		if (!!value === value) {
			return value;
		}
		if (+value === value) {
			if (value == 0) return false;
			return true;
		}
		if ("" + value === value) {
			return value.toLowerCase() === "true";
		}
		return !!value;
	}
	async function copyTextToClipboard(text) {
		try {
			await navigator.clipboard.writeText(text);
		} catch (err) {
			console.error("Failed to copy text to clipboard:", err);
		}
	}
	async function copyImageToClipboard(imageElement) {
		async function getImage(imageElement, changeCrossOrigin = false) {
			async function getBlobFromImage(image) {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				canvas.width = image.naturalWidth || image.width;
				canvas.height = image.naturalHeight || image.height;
				ctx.drawImage(image, 0, 0);
				return new Promise((resolve, reject) => {
					canvas.toBlob(blob => {
						canvas.remove();
						if (removeImage) {
							image.remove();
						}
						if (blob) {
							resolve(blob);
						} else {
							reject(new Error("Failed to create blob from canvas"));
						}
					}, "image/png");
				});
			}
			let image = imageElement;
			let removeImage = false;
			if (changeCrossOrigin) {
				removeImage = true;
				image = new Image();
				image.crossOrigin = "anonymous";
				image.src = imageElement.src;
				return new Promise((resolve, reject) => {
					image.onload = () => getBlobFromImage(image).then(resolve).catch(reject);
					image.onerror = err => reject(new Error(`Failed to load image: ${err.message}`));
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
				blob = await getImage(imageElement, true);
			}
			if (!blob) {
				throw new Error("Blob creation failed");
			}
			let item = new ClipboardItem({
				[blob.type]: blob
			});
			try {
				await navigator.clipboard.write([item]);
			} catch (err) {
				console.error("Failed to copy image to clipboard:", err);
			}
		} catch (err_1) {
			console.error("Failed to fetch image:", err_1);
		}
	}

	function copyClipboard(element, options = {}) {
		options = Object.assign({}, DEFAULT_OPTIONS, options);
		let WARNING = x => x;
		let DEBUG = x => x;
		if (!boolVal(options.suppressWarnings)) {
			WARNING = (...x) => console.warn(...x);
		}
		if (boolVal(options.debug)) {
			DEBUG = (...x) => console.log(...x);
		}
		let elements = [];
		if (typeof element === "string") {
			elements = document.querySelectorAll(element);
		} else if (element instanceof HTMLElement) {
			elements = [element];
		}
		if (elements.length === 0) {
			WARNING("No elements found to make copyable:", element);
			return;
		}
		if (elements instanceof NodeList || elements instanceof HTMLCollection) {
			elements = Array.from(elements);
		} else if (!Array.isArray(elements)) {
			elements = [elements];
		}
		for (const copyable of elements) {
			let elementOptions = mergeOptions(copyable, options, "copy");
			WARNING = x => x;
			if (!boolVal(elementOptions.suppressWarnings)) {
				WARNING = x => console.warn(x);
			}
			DEBUG = x => x;
			if (boolVal(elementOptions.debug)) {
				DEBUG = (...x) => console.log(...x);
			}
			if (!elementOptions.target && !elementOptions.targetChildren && !elementOptions.value) {
				WARNING("Nothing to copy for element:", copyable);
				continue;
			}
			if (copyable._copyClipboard) {
				copyable.removeEventListener("click", copyable._copyClipboard.copyHandler);
				delete copyable._copyClipboard;
			}
			const copyHandler = function () {
				let targetElements = [];
				if (elementOptions.value) {
					if (options.images && options.value instanceof File && options.value.type.startsWith("image/")) {
						let item = new ClipboardItem({
							[options.value.type]: options.value
						});
						navigator.clipboard.write([item]).then(() => {
							DEBUG(`Image copied from file to clipboard.`);
						}).catch(err => {
							console.error("Failed to copy image:", err);
						});
						return;
					} else if (typeof options.value === "string" || typeof options.value === "number") {
						copyTextToClipboard(options.value);
						return;
					} else if (options.value instanceof HTMLElement) {
						copyTextToClipboard(options.value.innerText || options.value.textContent);
						return;
					} else if (Array.isArray(options.value)) {
						copyTextToClipboard(options.value.join("\n"));
						return;
					} else {
						WARNING(`Unsupported value type for copying: ${typeof options.value}. Expected string, number, HTMLElement or array.`);
						return;
					}
				} else {
					let targets = elementOptions.target ? document.querySelectorAll(elementOptions.target) : [];
					let targetChildren = elementOptions.targetChildren ? copyable.querySelectorAll(elementOptions.targetChildren) : [];
					targets = [...targets, ...targetChildren];
					if (targets.length === 0) {
						WARNING(`No target elements found for selector: ${elementOptions.target} or children selector: ${elementOptions.targetChildren}.`);
						return;
					}
					if (!boolVal(elementOptions.multiple)) {
						targetElements = [targets[0]];
						DEBUG(`Copying only the first target element: ${targetElements[0]}`);
					} else {
						targetElements = Array.from(targets);
						DEBUG(`Copying all target elements: `, targetElements);
					}
					let resultingTexts = [];
					for (const targetElement of targetElements) {
						if (boolVal(elementOptions.images) && targetElement.tagName.toLowerCase() === "img") {
							copyImageToClipboard(targetElement);
							return;
						} else {
							if (targetElement.tagName.toLowerCase() === "input" || targetElement.tagName.toLowerCase() === "textarea") {
								resultingTexts.push(targetElement.value || "");
							} else if (targetElement.tagName.toLowerCase() === "select") {
								resultingTexts.push(targetElement.options[targetElement.selectedIndex].text || "");
							} else if (targetElement.tagName.toLowerCase() === "img") {
								resultingTexts.push(targetElement.alt || targetElement.title || targetElement.src || "");
							} else {
								resultingTexts.push(targetElement.innerText || targetElement.textContent || targetElement.value || targetElement.text || targetElement.alt || "");
							}
						}
					}
					if (resultingTexts.length > 0) {
						copyTextToClipboard(resultingTexts.join(elementOptions.joinText));
					}
				}
			};
			copyable._copyClipboard = {
				options: elementOptions,
				copyHandler: copyHandler,
				version: VERSION
			};
			copyable.addEventListener("click", copyHandler);
		}
	}

	function handlePaste(event, options = {}) {
		const DEFAULT_OPTIONS = {
			onPasteImage: file => {},
			onPasteText: text => {},
			onError: error => console.error(error)
		};
		options = Object.assign({}, DEFAULT_OPTIONS, options);
		let clipboardData = event.clipboardData || window.clipboardData;
		if (!clipboardData) {
			if (typeof options.onError === "function") {
				options.onError("No clipboard data available. Please ensure you have copied something to the clipboard before pasting.");
			}
			return false;
		}
		if (clipboardData.items) {
			for (var i = 0; i < clipboardData.items.length; i++) {
				var item = clipboardData.items[i];
				if (item.kind === "file" && item.type.startsWith("image/")) {
					var file = item.getAsFile();
					if (!file) {
						if (typeof options.onError === "function") {
							options.onError("No file found in clipboard data. Please ensure you have copied an image to the clipboard before pasting.");
						}
						return false;
					}
					if (typeof options.onPasteImage === "function") {
						options.onPasteImage(file);
					}
					return true;
					break;
				} else if (item.kind === "string" && item.type === "text/plain") {
					item.getAsString(function (text) {
						if (typeof options.onPasteText === "function") {
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
				if (typeof options.onPasteText === "function") {
					options.onPasteText(pastedData);
				}
				return true;
			} else {
				if (typeof options.onError === "function") {
					options.onError("No text data found in clipboard data. Please ensure you have copied text to the clipboard before pasting.");
				}
				return false;
			}
		}
	}
	navigator.permissions.query({
		name: "clipboard-write"
	}).then(result => {
		if (result.state === "granted" || result.state === "prompt") {
			exports.copyClipboard = copyClipboard;
		} else {
			console.warn("Clipboard write permission is not granted. Cannot make elements copyable.");
			exports.copyClipboard = function () {
				console.warn("Clipboard write permission is not granted. Cannot make elements copyable.");
			};
		}
		exports.copyClipboard.version = VERSION;
		exports.copyClipboard.copyTextToClipboard = copyTextToClipboard;
		exports.copyClipboard.copyImageToClipboard = copyImageToClipboard;
		exports.copyClipboard.handlePaste = handlePaste;
	});
	document.addEventListener("DOMContentLoaded", () => {
		const copyableElements = document.querySelectorAll("[data-copy-target],[data-copy-value],[data-copy-target-children]");
		copyableElements.forEach(element => {
			const options = mergeOptions(element, DEFAULT_OPTIONS, "copy");
			copyClipboard(element, options);
		});
	});
})(window);
