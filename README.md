# Copy Clipboard

A lightweight JavaScript library that enables copying content to clipboard with a single click. Supports copying both text and images.

## Features

- Copy text or images to clipboard with one click
- Configurable through JavaScript or HTML data attributes
- Support for copying from specific elements
- Automatic setup for elements with specific data attributes
- Lightweight with no dependencies
- Handle paste events for images and text

## Installation

### Direct include in HTML

```html
<script src="path/to/copy-clipboard.js"></script>
```

or use a CDN:

```html
<script src="https://cdn.jsdelivr.net/gh/dealfonso/copy-clipboard/dist/copy-clipboard.min.js"></script>
```

## Basic Usage

### Using JavaScript

```javascript
// Make a button copy content from an element
copyClipboard('#myButton', {
  target: '#contentToCopy'
});

// Copy a specific value
copyClipboard('#myButton', {
  value: 'Text to copy'
});

// Copy content from child elements
copyClipboard('#container', {
  targetChildren: '.copy-item'
});
```

### Using HTML data attributes

```html
<!-- Copy from a target element -->
<button data-copy-target="#contentToCopy">Copy</button>
<div id="contentToCopy">This text will be copied</div>

<!-- Copy a specific value -->
<button data-copy-value="Text to copy">Copy text</button>

<!-- Copy from child elements -->
<div data-copy-target-children=".item">
  <span class="item">Item 1</span>
  <span class="item">Item 2</span>
</div>
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | String | `null` | Selector for elements whose content will be copied |
| `targetChildren` | String | `null` | Selector for children of the element that will be copied |
| `multiple` | Boolean | `true` | If `false`, only copies the first matching element |
| `joinText` | String | `\n` | Text to join multiple copied elements (if `copyFirst` is `false`) |
| `images` | Boolean | `true` | If `true`, allows copying images to clipboard |
| `value` | String\|Number\|HTMLElement\|Array | `null` | Specific value to copy instead of element content |
| `suppressWarnings` | Boolean | `true` | If `true`, doesn't show warnings in console |
| `debug` | Boolean | `false` | If `true`, shows debug messages in console |

## API Functions

The library exports several utility functions that can be used independently:

### copyTextToClipboard(text)

Copies text content to the clipboard.

**Parameters:**
- `text` (String): The text to copy to the clipboard

**Example:**
```javascript
copyClipboard.copyTextToClipboard('Hello, world!');
```

### copyImageToClipboard(imageElement)

Copies an image element to the clipboard as a blob.

**Parameters:**
- `imageElement` (HTMLImageElement): The image element to copy

**Example:**
```javascript
const img = document.querySelector('#myImage');
copyClipboard.copyImageToClipboard(img);
```

### handlePaste(event, options)

Handles paste events to detect pasted images or text from the clipboard.

**Parameters:**
- `event` (ClipboardEvent): The paste event object
- `options` (Object): Configuration options for handling paste

**Options:**
- `onPasteImage` (Function): Callback function called when an image is pasted. Receives the image file as parameter
- `onPasteText` (Function): Callback function called when text is pasted. Receives the text as parameter
- `onError` (Function): Callback function called when an error occurs. Receives the error message as parameter

**Returns:** Boolean indicating if the paste was handled successfully

**Example:**
```javascript
document.addEventListener('paste', function(event) {
  copyClipboard.handlePaste(event, {
    onPasteImage: function(file) {
      console.log('Image pasted:', file.name);
      // Handle the pasted image file
    },
    onPasteText: function(text) {
      console.log('Text pasted:', text);
      // Handle the pasted text
    },
    onError: function(error) {
      console.error('Paste error:', error);
    }
  });
});
```

## Data Attributes

You can configure all the above options using HTML data attributes with the `data-copy-` prefix:

```html
<button 
  data-copy-target="#myContent"
  data-copy-copy-first="false"
  data-copy-join-text=", "
  data-copy-copy-images="true"
  data-copy-suppress-warnings="false"
  data-copy-debug="true">
  Copy all
</button>
```

## Caveats

When copying images, if the image is not hosted on the same domain or does not have the appropriate CORS headers, it may not be copied correctly due to browser security restrictions. Ensure that images are accessible and properly configured for cross-origin requests if needed.

This is because in case that the library is not able to copy the image due to CORS issues, it will try to retrieve the image using `crossorigin="anonymous"` attribute. This may lead to either a problem due to the origin or the server not allowing cross-origin requests, or it may work if the server is configured correctly. 

*e.g.*, if you are using a service like [Picsum](https://picsum.photos/) to generate random images, you can use the following HTML to copy an image:

```html
<img id="myImage" src="https://picsum.photos/200">
<button data-copy-target="#myImage">Copy image</button>
```

Copying the image will work, but the image will be different each time you copy it, as Picsum serves a random image each time the URL is accessed.

To solve this, you can use the `crossorigin` attribute in the image tag:

```html
<img id="myImage" src="https://picsum.photos/200" crossorigin="anonymous">
<button data-copy-target="#myImage">Copy image</button>
```

## Browser Compatibility

This library uses the modern Clipboard API, so it's compatible with modern browsers such as:

- Chrome 66+
- Firefox 63+
- Safari 13.1+
- Edge 79+

## Examples

### Copy an image

```html
<img id="myImage" src="example.jpg" alt="Example">
<button data-copy-target="#myImage">Copy image</button>
```

### Copy multiple elements

```html
<div id="container">
  <p class="copyable">Paragraph 1</p>
  <p class="copyable">Paragraph 2</p>
</div>
<button data-copy-target=".copyable" data-copy-copy-first="false">Copy all paragraphs</button>
```

### Copy content programmatically

```javascript
document.getElementById('copyButton').addEventListener('click', function() {
  copyClipboard(this, {
    value: 'This text will be copied on click'
  });
});
```

### Handle paste events

This is an example of how to handle paste events to copy images or text from the clipboard:

```html
<textarea id="pasteArea" placeholder="Paste content here..."></textarea>
<script>
document.getElementById('pasteArea').addEventListener('paste', function(event) {
  copyClipboard.handlePaste(event, {
    onPasteImage: function(file) {
      alert('Image pasted: ' + file.name);
    },
    onPasteText: function(text) {
      this.value = text;
    }.bind(this)
  });
});
</script>
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.