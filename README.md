# JSWebLibrary

![GitHub license](https://img.shields.io/github/license/dealfonso/jslibrary) ![GitHub repo size](https://img.shields.io/github/repo-size/dealfonso/jslibrary) ![GitHub issues](https://img.shields.io/github/issues/dealfonso/jslibrary)

This is a template repository to create JavaScript Libraries intended to be ran in the browser. The final result is a **single file** that **includes all the dependencies** and that **does not pollute the global namespace**. The resulting library can also be used as a module in other libraries.

## Why?

I know there are tools to create JavaScript libraries, like `webpack`, `rollup`, etc. But I find that these frameworks are intended _to create complex libraries_. I also find that developing with these frameworks is not easy, as they need a web server, configuration files, etc.

I wanted to create a template that enable me to **develop the library using common workflows** (i.e. including different files that are part of the library in an html file and opening it in the browser), but also be able to create a final version that is distributable in a single file.

The result is this template, that uses `make` to build the library and `uglify-js` to minify it, and **creates a single distributable file**, that **does not pollute the global namespace**. Moreover, each library generated with this template **can be used as a module** in other libraries. The **dependencies are also included in the distributable file**, so the library can be used as a module without the need to include the dependencies in the html file.

Additionally the library includes a PHP script that can be used to develop the library using it as if it was the final library, which makes it **similar to the development process of `webpack`** and others.

## Usage

1. Clone this repository (or create a new one from this template repository)
    ```bash
    $ git clone https://github.com/dealfonso/jslibrary.git
    $ cd jslibrary
    ```

2. Adapt the license notice files to your needs:

    - `notice` contains the license notice to be included in the header of the generated files in full format.
    - `notice.min` contains the license notice to be included in the header of the minified files.

3. Install dependencies

    This package depends on `make`, `uglify-js` and `js-beautify`. Install them using your package manager.

    e.g. on Debian/Ubuntu:

    ```bash
    $ apt install make
    $ npm install uglify-js js-beautify
    ```

4. Develop your library under `src` folder.

    > Please make sure that the order of the files in the `src` folder is the order you want them to be concatenated. E.g. use a prefix like `01-`, `02-`, etc.

5. Build your library

    ```bash
    $ make
    ```

## Result

The result of the build process will be a set of files under the `dist` folder.

- `dist/<library-name>.raw.js`: Concatenated and beautified version of your library (still contains comments).
- `dist/<library-name>.full.js`: The same as `dist/<library-name>.raw.js` but with an envelope of `((window, document) => { ... })(window, document);` to avoid polluting the global namespace, with the comments removed.
- `dist/<library-name>.js`: The same as `dist/<library-name>.full.js` but removing unnecessary spaces and line breaks.
- `dist/<library-name>.min.js`: The same as `dist/<library-name>.js` but minified.
- `dist/<library-name>.compress.js`: The same as `dist/<library-name>.min.js` but compressed.

> The name of the library is taken from the variable `LIBRARY_NAME` either from the env or defined in the `Makefile`. If the variable is not defined, the name of the library will fallback to the current folder name.

## Distributing

You can distribute your library by copying the files under the `dist` folder.

If you are using GitHub, you can also distribute it using jsDelivr. To do so, you need to create a new release and upload the files under the `dist` folder as assets. Then you can use the following URL to access the files:

```
https://cdn.jsdelivr.net/gh/<user>/<repo>@<version>/dist/<library-name>.js
```

E.g. for this repository:

```
https://cdn.jsdelivr.net/gh/dealfonso/jslibrary@main/dist/jslibrary.js
```

## Developing process

### Using static files

When developing your library, you are encouraged to include the raw files in the `src` folder in your development html files. E.g.:

```html
(...)
<script src="src/01-mylib.js"></script>
<script src="src/02-mylib.js"></script>
<script src="src/03-mylib.js"></script>
(...)
```

When building the final library, the process will create a `dist` file that isolates the content of your library from the global namespace. In particular, will wrap your library code in a function that receives the `window` an `exports` object as parameters:

```javascript
((exports) => {
    // Your library code here
})(window);
```

### Using a development server

This library includes a PHP script that can be used to develop the library as if it was the final library. To do so, you need to start a PHP server in the root folder of the library:

```bash
$ php -S localhost:8000 devel.php
```

> This mechanism tries to mimic the one used by `webpack` and others, that generate the packed file upon request during the development process.

Then you can access the library in your browser by using the URL `http://localhost:8000/`. This will load the file `index.html` of the root folder of the library (if exists).

If the requested file is one of the files that should be generated upon building the library (e.g. `dist/jslibrary.js`), the script will build execute the `make` command in the root folder of the library and will return the generated file.

> Using the current `Makefile`, the build process will be executed only if there are modified files.

#### Caveats

1. The name of the library is taken from the variable `$LIBRARY_NAME` in the script. If the variable is not defined, the name of the library will fallback to the current folder name. If you have changed the name of the library in the `Makefile`, you should also change the value of the variable in the script.
2. Make sure to run `make clean` if you changed the `Makefile`, before using the development server.
3. This script is intended to be used in development environments. It is not intended to be used in production environments.

## Modules and namespaces

The building process of the library is oriented to keep the library code isolated from the global namespace. This is achieved by wrapping the library code in a function that receives the `exports` object as parameter. At the same time, this enables the library to be used as a module in other libraries by using the object `imports` to access the symbols exported by the dependencies.

### Exporting symbols (e.g. to the global namespace `window`)

If you want to export any symbol to the global namespace (e.g. `window`), you can use the `exports` object:

```javascript
exports.mySymbol = mySymbol;
```

When the library is loaded, the `exports` object will be the `window` object and so the symbol will be exported to the global namespace.

The only caveat is that you should check that the `exports` object exists before using it to avoid errors when developing the library by including the static raw files in the `src` folder in your development html files. E.g.:

```javascript
if (typeof exports !== 'undefined') {
    exports = {}
}
(...)
exports.mySymbol = mySymbol;
```

This also **enables the library to be used as a module in other library** (using the scheme of `jslibrary`), because the `exports` object will be exported to the local `imports` object of the library in which the module is being used.

> The concept is that the `exports` object refers to the **parent namespace**, so if the library is used as a module, the symbols will be exported to the `imports` object of the library in which the module is being used but, if it is the main library, the symbols will be exported to `window` object.

### Working with submodules

This template enables to work with libraries created with this template as submodules. To do so, you need to:

1. Create a new repository using this template.

1. Create the folders that contain the submodules under folder `depends`.

    > These folders need the up-to-date version of the `Makefile`.

1. Build your library:

    ```bash
    $ make
    ```

e.g.:

If you have a library called `mylib` that depends on `dom2object` ([yo can have a look at it](https://github.com/dealfonso/dom2object)), you need to create the following folder structure (e.g. by cloning the repository inside folder `depends`):

```
mylib
├── depends
│   └── dom2object
│       ├── Makefile
│       ├── notice
│       ├── notice.min
│       └── src
│           └── dom2object.js
├── Makefile
├── notice
├── notice.min
└── src
    └── mylib.js
```

In this example we want to use `dom2object` as a module by the object `imports`: `dom2object` exports a function called `DOM2Object` that can be used in `mylib` as `imports.DOM2Object`. The file `mylib.js` may look like this:

```javascript
let obj = imports.DOM2Object(document.querySelector('div'));
```

> Note that the `imports` object is used to access the symbols exported by the dependencies.

Now you need to update the variable `DEPENDS` in the `Makefile` of `mylib`, to include the name of the submodules:

```Makefile
(...)
DEPENDS = dom2object
(...)
```

And now you can build your library:

```bash
$ make
```

This will create the file `depends/dom2object/dist/dom2object.module.js` file, which is a modified version that makes puts the exports of `dom2object` in an object called `imports`. Then the code is added to the `mylib` file, which (once built) will look like:

```javascript
(function (exports) {
        // This code is generated during the build process
        if (typeof imports === "undefined") {
                var imports = {}
        }
        // This code comes from the dom2object dependency
        (function (exports) {
                function DOMToObject(el, acquireChildrenFromAnonymous = false) {
                        (...)
                }
                exports.DOMToObject = DOMToObject
        })(imports);
        // This is the code of mylib
        let obj = imports.DOMToObject(document.querySelector('div'));
})(window);
```

### Development of a library that imports other modules

In case that you are using imported modules in your library (i.e. including them in the `depends` folder, updating the `DEPENDS` variable in the `Makefile`, etc.), you should _build_ the imported modules to include them in your development html files.

To do so, you can use the `make` target `depends`:

```bash
$ make depends
```

The result will be a set of files under the `depends` folder, one for each imported module, under their `dist` folder. E.g.: `depends/dom2object/dist/dom2object.module.js`.

You can include these files in your development html files, before the files of the library that your are currently developing. E.g.:

```html
(...)
<script src="depends/dom2object/dist/dom2object.module.js"></script>
<script src="src/01-mylib.js"></script>
<script src="src/02-mylib.js"></script>
<script src="src/03-mylib.js"></script>
(...)
```

If done in this way, the `imports` object will be available in the global namespace, so you can use it in your library code.

#### Techinical Details

> You can skip this content if you are not interested in the technical details of the building process.

The makefile has a target called `module` that will create a modified version of the library that can be used as a module. This target will envelope the library code in a function that receives the `exports` parameter (where the libraries should export the symbols). That function will be called with the `imports` object as parameter, so that the things exported by the dependency can be used in the library by prepending `imports.` to the symbol.

```javascript
if (typeof imports === 'undefined') {
    imports = {}
}
((exports) => {
    // Your library code here
})(imports);
```

The current library is also enveloped by a function that receives the `exports` object as parameter. In case that is being generated a distributable version, the `exports` object will be the `window` object, so the library can export symbols to the global namespace.

The final result will be something like:

```javascript
((exports) => {
    if (typeof imports === 'undefined') {
        imports = {}
    }
    ((exports) => {
        // Dependency code here
    })(imports);
    // Your library code here    
})(window);
```

> In case that the library had also dependencies, they can be used using the same scheme, because the `imports` object will be local to the scope of the library.