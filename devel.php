<?php
/*
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

/*
    This mini-app tries to imitate the behaviour of webpack dev server, for the scheme of this jslibrary:

    - In case that the file which corresponds to the library is requested, the mini-app builds the library (i.e. by running 
    "make") and then serves the file. 
    - In case that any other file is requested, the mini-app tries to serve it from the filesystem.

    (*) In this way, the library includes any of its dependencies (i.e. the modules) and updates everytime 
        the source files are changed. So this scheme is very useful for development.

    This is very similar to what webpack does, but adapted to the scheme of _jslibrary_.

    This snippet is based on the following answer from stackoverflow:
    https://stackoverflow.com/a/38926070/14699733

    To use this snippet, name it as (e.g.) devel.php and place it in the same directory as the files you want to serve.

    Then start the server with the following command:
    php -S localhost:8000 devel.php
*/

// Name of the library (if empty, it will be the name of the directory). 
// IMPORTANT: Make sure that it matches the name of the library in the Makefile
$LIBRARY_NAME = "";

if (empty($LIBRARY_NAME)) {
    $LIBRARY_NAME = basename(__DIR__);
}

define("DERIVED_FILES", [
    "dist/{$LIBRARY_NAME}.js",
    "dist/{$LIBRARY_NAME}.min.js",
    "dist/{$LIBRARY_NAME}.compress.js",
    "dist/{$LIBRARY_NAME}.css",
    "dist/{$LIBRARY_NAME}.min.css",
]);

$content_types = [
    'css' => 'text/css',
    'gif' => 'image/gif',
    'htm' => 'text/html',
    'html' => 'text/html',
    'ico' => 'image/x-icon',
    'jpeg' => 'image/jpeg',
    'jpg' => 'image/jpeg',
    'js' => 'text/javascript',
    'json' => 'application/json',
    'pdf' => 'application/pdf',
    'png' => 'image/png',
    'svg' => 'image/svg+xml',
    'txt' => 'text/plain',
    'xml' => 'text/xml',
];

if(!defined('STDERR')) define('STDERR', fopen('php://stderr', 'wb'));

function debug(...$var) {
    foreach ($var as $v) {
        fwrite(STDERR, $v);
    }
    fwrite(STDERR, "\n");
}

chdir(__DIR__);

// If the URI is one of the derived files, build it and serve it
$trimmedURI = ltrim($_SERVER["REQUEST_URI"], '/');
if (in_array($trimmedURI, DERIVED_FILES)) {
    // Execute "make" in this folder
    exec("make {$trimmedURI}");

    // If the file exists, display it
    $filePath = realpath(ltrim($_SERVER["REQUEST_URI"], '/'));

    if (file_exists($filePath)) {
        $ext = pathinfo($filePath, PATHINFO_EXTENSION);
        header("Content-Type: " . ($content_types[$ext] ?? 'application/octet-stream'));
        echo file_get_contents($filePath);
    } else {
        header("HTTP/1.1 500 Internal Server Error");
        echo "500 Internal Server Error";
    }
    die();
}

// If it was not a derived file, try to serve it from the filesystem
$filePath = realpath($trimmedURI);

// If it is a directory, try to find an index file to serve it
if ($filePath && is_dir($filePath)){
    foreach (['index.php', 'index.html'] as $indexFile){
        if ($filePath = realpath($filePath . DIRECTORY_SEPARATOR . $indexFile)){
            break;
        }
    }
}

// And now, if it is a file, serve it
if ($filePath && is_file($filePath)) {

    // 1. check that file is not outside of this directory for security
    // 2. check for circular reference to router.php
    // 3. don't serve dotfiles
    if (strpos($filePath, __DIR__ . DIRECTORY_SEPARATOR) === 0 &&
        $filePath != __DIR__ . DIRECTORY_SEPARATOR . basename(__FILE__) &&
        substr(basename($filePath), 0, 1) != '.'
    ) {
        if (strtolower(substr($filePath, -4)) == '.php') {
            // php file; serve through interpreter
            include $filePath;
        } else {
            // asset file; serve from filesystem
            return false;
        }
    } else {
        // disallowed file
        header("HTTP/1.1 404 Not Found");
        echo "404 Not Found";
    }
}