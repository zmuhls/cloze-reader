// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (
  modules,
  entry,
  mainEntry,
  parcelRequireName,
  externals,
  distDir,
  publicUrl,
  devServer
) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var importMap = previousRequire.i || {};
  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        if (externals[name]) {
          return externals[name];
        }
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        globalObject
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.require = nodeRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.distDir = distDir;
  newRequire.publicUrl = publicUrl;
  newRequire.devServer = devServer;
  newRequire.i = importMap;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  // Only insert newRequire.load when it is actually used.
  // The code in this file is linted against ES5, so dynamic import is not allowed.
  // INSERT_LOAD_HERE

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });
    }
  }
})({"6bz8l":[function(require,module,exports,__globalThis) {
var global = arguments[3];
var HMR_HOST = null;
var HMR_PORT = null;
var HMR_SERVER_PORT = 61864;
var HMR_SECURE = false;
var HMR_ENV_HASH = "439701173a9199ea";
var HMR_USE_SSE = false;
module.bundle.HMR_BUNDLE_ID = "4943a1030f289648";
"use strict";
/* global HMR_HOST, HMR_PORT, HMR_SERVER_PORT, HMR_ENV_HASH, HMR_SECURE, HMR_USE_SSE, chrome, browser, __parcel__import__, __parcel__importScripts__, ServiceWorkerGlobalScope */ /*::
import type {
  HMRAsset,
  HMRMessage,
} from '@parcel/reporter-dev-server/src/HMRServer.js';
interface ParcelRequire {
  (string): mixed;
  cache: {|[string]: ParcelModule|};
  hotData: {|[string]: mixed|};
  Module: any;
  parent: ?ParcelRequire;
  isParcelRequire: true;
  modules: {|[string]: [Function, {|[string]: string|}]|};
  HMR_BUNDLE_ID: string;
  root: ParcelRequire;
}
interface ParcelModule {
  hot: {|
    data: mixed,
    accept(cb: (Function) => void): void,
    dispose(cb: (mixed) => void): void,
    // accept(deps: Array<string> | string, cb: (Function) => void): void,
    // decline(): void,
    _acceptCallbacks: Array<(Function) => void>,
    _disposeCallbacks: Array<(mixed) => void>,
  |};
}
interface ExtensionContext {
  runtime: {|
    reload(): void,
    getURL(url: string): string;
    getManifest(): {manifest_version: number, ...};
  |};
}
declare var module: {bundle: ParcelRequire, ...};
declare var HMR_HOST: string;
declare var HMR_PORT: string;
declare var HMR_SERVER_PORT: string;
declare var HMR_ENV_HASH: string;
declare var HMR_SECURE: boolean;
declare var HMR_USE_SSE: boolean;
declare var chrome: ExtensionContext;
declare var browser: ExtensionContext;
declare var __parcel__import__: (string) => Promise<void>;
declare var __parcel__importScripts__: (string) => Promise<void>;
declare var globalThis: typeof self;
declare var ServiceWorkerGlobalScope: Object;
*/ var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
    OldModule.call(this, moduleName);
    this.hot = {
        data: module.bundle.hotData[moduleName],
        _acceptCallbacks: [],
        _disposeCallbacks: [],
        accept: function(fn) {
            this._acceptCallbacks.push(fn || function() {});
        },
        dispose: function(fn) {
            this._disposeCallbacks.push(fn);
        }
    };
    module.bundle.hotData[moduleName] = undefined;
}
module.bundle.Module = Module;
module.bundle.hotData = {};
var checkedAssets /*: {|[string]: boolean|} */ , disposedAssets /*: {|[string]: boolean|} */ , assetsToDispose /*: Array<[ParcelRequire, string]> */ , assetsToAccept /*: Array<[ParcelRequire, string]> */ , bundleNotFound = false;
function getHostname() {
    return HMR_HOST || (typeof location !== 'undefined' && location.protocol.indexOf('http') === 0 ? location.hostname : 'localhost');
}
function getPort() {
    return HMR_PORT || (typeof location !== 'undefined' ? location.port : HMR_SERVER_PORT);
}
// eslint-disable-next-line no-redeclare
let WebSocket = globalThis.WebSocket;
if (!WebSocket && typeof module.bundle.root === 'function') try {
    // eslint-disable-next-line no-global-assign
    WebSocket = module.bundle.root('ws');
} catch  {
// ignore.
}
var hostname = getHostname();
var port = getPort();
var protocol = HMR_SECURE || typeof location !== 'undefined' && location.protocol === 'https:' && ![
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
].includes(hostname) ? 'wss' : 'ws';
// eslint-disable-next-line no-redeclare
var parent = module.bundle.parent;
if (!parent || !parent.isParcelRequire) {
    // Web extension context
    var extCtx = typeof browser === 'undefined' ? typeof chrome === 'undefined' ? null : chrome : browser;
    // Safari doesn't support sourceURL in error stacks.
    // eval may also be disabled via CSP, so do a quick check.
    var supportsSourceURL = false;
    try {
        (0, eval)('throw new Error("test"); //# sourceURL=test.js');
    } catch (err) {
        supportsSourceURL = err.stack.includes('test.js');
    }
    var ws;
    if (HMR_USE_SSE) ws = new EventSource('/__parcel_hmr');
    else try {
        // If we're running in the dev server's node runner, listen for messages on the parent port.
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) {
            parentPort.on('message', async (message)=>{
                try {
                    await handleMessage(message);
                    parentPort.postMessage('updated');
                } catch  {
                    parentPort.postMessage('restart');
                }
            });
            // After the bundle has finished running, notify the dev server that the HMR update is complete.
            queueMicrotask(()=>parentPort.postMessage('ready'));
        }
    } catch  {
        if (typeof WebSocket !== 'undefined') try {
            ws = new WebSocket(protocol + '://' + hostname + (port ? ':' + port : '') + '/');
        } catch (err) {
            // Ignore cloudflare workers error.
            if (err.message && !err.message.includes('Disallowed operation called within global scope')) console.error(err.message);
        }
    }
    if (ws) {
        // $FlowFixMe
        ws.onmessage = async function(event /*: {data: string, ...} */ ) {
            var data /*: HMRMessage */  = JSON.parse(event.data);
            await handleMessage(data);
        };
        if (ws instanceof WebSocket) {
            ws.onerror = function(e) {
                if (e.message) console.error(e.message);
            };
            ws.onclose = function() {
                console.warn("[parcel] \uD83D\uDEA8 Connection to the HMR server was lost");
            };
        }
    }
}
async function handleMessage(data /*: HMRMessage */ ) {
    checkedAssets = {} /*: {|[string]: boolean|} */ ;
    disposedAssets = {} /*: {|[string]: boolean|} */ ;
    assetsToAccept = [];
    assetsToDispose = [];
    bundleNotFound = false;
    if (data.type === 'reload') fullReload();
    else if (data.type === 'update') {
        // Remove error overlay if there is one
        if (typeof document !== 'undefined') removeErrorOverlay();
        let assets = data.assets;
        // Handle HMR Update
        let handled = assets.every((asset)=>{
            return asset.type === 'css' || asset.type === 'js' && hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle);
        });
        // Dispatch a custom event in case a bundle was not found. This might mean
        // an asset on the server changed and we should reload the page. This event
        // gives the client an opportunity to refresh without losing state
        // (e.g. via React Server Components). If e.preventDefault() is not called,
        // we will trigger a full page reload.
        if (handled && bundleNotFound && assets.some((a)=>a.envHash !== HMR_ENV_HASH) && typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') handled = !window.dispatchEvent(new CustomEvent('parcelhmrreload', {
            cancelable: true
        }));
        if (handled) {
            console.clear();
            // Dispatch custom event so other runtimes (e.g React Refresh) are aware.
            if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent('parcelhmraccept'));
            await hmrApplyUpdates(assets);
            hmrDisposeQueue();
            // Run accept callbacks. This will also re-execute other disposed assets in topological order.
            let processedAssets = {};
            for(let i = 0; i < assetsToAccept.length; i++){
                let id = assetsToAccept[i][1];
                if (!processedAssets[id]) {
                    hmrAccept(assetsToAccept[i][0], id);
                    processedAssets[id] = true;
                }
            }
        } else fullReload();
    }
    if (data.type === 'error') {
        // Log parcel errors to console
        for (let ansiDiagnostic of data.diagnostics.ansi){
            let stack = ansiDiagnostic.codeframe ? ansiDiagnostic.codeframe : ansiDiagnostic.stack;
            console.error("\uD83D\uDEA8 [parcel]: " + ansiDiagnostic.message + '\n' + stack + '\n\n' + ansiDiagnostic.hints.join('\n'));
        }
        if (typeof document !== 'undefined') {
            // Render the fancy html overlay
            removeErrorOverlay();
            var overlay = createErrorOverlay(data.diagnostics.html);
            // $FlowFixMe
            document.body.appendChild(overlay);
        }
    }
}
function removeErrorOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.remove();
        console.log("[parcel] \u2728 Error resolved");
    }
}
function createErrorOverlay(diagnostics) {
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    let errorHTML = '<div style="background: black; opacity: 0.85; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; font-family: Menlo, Consolas, monospace; z-index: 9999;">';
    for (let diagnostic of diagnostics){
        let stack = diagnostic.frames.length ? diagnostic.frames.reduce((p, frame)=>{
            return `${p}
<a href="${protocol === 'wss' ? 'https' : 'http'}://${hostname}:${port}/__parcel_launch_editor?file=${encodeURIComponent(frame.location)}" style="text-decoration: underline; color: #888" onclick="fetch(this.href); return false">${frame.location}</a>
${frame.code}`;
        }, '') : diagnostic.stack;
        errorHTML += `
      <div>
        <div style="font-size: 18px; font-weight: bold; margin-top: 20px;">
          \u{1F6A8} ${diagnostic.message}
        </div>
        <pre>${stack}</pre>
        <div>
          ${diagnostic.hints.map((hint)=>"<div>\uD83D\uDCA1 " + hint + '</div>').join('')}
        </div>
        ${diagnostic.documentation ? `<div>\u{1F4DD} <a style="color: violet" href="${diagnostic.documentation}" target="_blank">Learn more</a></div>` : ''}
      </div>
    `;
    }
    errorHTML += '</div>';
    overlay.innerHTML = errorHTML;
    return overlay;
}
function fullReload() {
    if (typeof location !== 'undefined' && 'reload' in location) location.reload();
    else if (typeof extCtx !== 'undefined' && extCtx && extCtx.runtime && extCtx.runtime.reload) extCtx.runtime.reload();
    else try {
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) parentPort.postMessage('restart');
    } catch (err) {
        console.error("[parcel] \u26A0\uFE0F An HMR update was not accepted. Please restart the process.");
    }
}
function getParents(bundle, id) /*: Array<[ParcelRequire, string]> */ {
    var modules = bundle.modules;
    if (!modules) return [];
    var parents = [];
    var k, d, dep;
    for(k in modules)for(d in modules[k][1]){
        dep = modules[k][1][d];
        if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) parents.push([
            bundle,
            k
        ]);
    }
    if (bundle.parent) parents = parents.concat(getParents(bundle.parent, id));
    return parents;
}
function updateLink(link) {
    var href = link.getAttribute('href');
    if (!href) return;
    var newLink = link.cloneNode();
    newLink.onload = function() {
        if (link.parentNode !== null) // $FlowFixMe
        link.parentNode.removeChild(link);
    };
    newLink.setAttribute('href', // $FlowFixMe
    href.split('?')[0] + '?' + Date.now());
    // $FlowFixMe
    link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
    if (cssTimeout || typeof document === 'undefined') return;
    cssTimeout = setTimeout(function() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for(var i = 0; i < links.length; i++){
            // $FlowFixMe[incompatible-type]
            var href /*: string */  = links[i].getAttribute('href');
            var hostname = getHostname();
            var servedFromHMRServer = hostname === 'localhost' ? new RegExp('^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):' + getPort()).test(href) : href.indexOf(hostname + ':' + getPort());
            var absolute = /^https?:\/\//i.test(href) && href.indexOf(location.origin) !== 0 && !servedFromHMRServer;
            if (!absolute) updateLink(links[i]);
        }
        cssTimeout = null;
    }, 50);
}
function hmrDownload(asset) {
    if (asset.type === 'js') {
        if (typeof document !== 'undefined') {
            let script = document.createElement('script');
            script.src = asset.url + '?t=' + Date.now();
            if (asset.outputFormat === 'esmodule') script.type = 'module';
            return new Promise((resolve, reject)=>{
                var _document$head;
                script.onload = ()=>resolve(script);
                script.onerror = reject;
                (_document$head = document.head) === null || _document$head === void 0 || _document$head.appendChild(script);
            });
        } else if (typeof importScripts === 'function') {
            // Worker scripts
            if (asset.outputFormat === 'esmodule') return import(asset.url + '?t=' + Date.now());
            else return new Promise((resolve, reject)=>{
                try {
                    importScripts(asset.url + '?t=' + Date.now());
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        }
    }
}
async function hmrApplyUpdates(assets) {
    global.parcelHotUpdate = Object.create(null);
    let scriptsToRemove;
    try {
        // If sourceURL comments aren't supported in eval, we need to load
        // the update from the dev server over HTTP so that stack traces
        // are correct in errors/logs. This is much slower than eval, so
        // we only do it if needed (currently just Safari).
        // https://bugs.webkit.org/show_bug.cgi?id=137297
        // This path is also taken if a CSP disallows eval.
        if (!supportsSourceURL) {
            let promises = assets.map((asset)=>{
                var _hmrDownload;
                return (_hmrDownload = hmrDownload(asset)) === null || _hmrDownload === void 0 ? void 0 : _hmrDownload.catch((err)=>{
                    // Web extension fix
                    if (extCtx && extCtx.runtime && extCtx.runtime.getManifest().manifest_version == 3 && typeof ServiceWorkerGlobalScope != 'undefined' && global instanceof ServiceWorkerGlobalScope) {
                        extCtx.runtime.reload();
                        return;
                    }
                    throw err;
                });
            });
            scriptsToRemove = await Promise.all(promises);
        }
        assets.forEach(function(asset) {
            hmrApply(module.bundle.root, asset);
        });
    } finally{
        delete global.parcelHotUpdate;
        if (scriptsToRemove) scriptsToRemove.forEach((script)=>{
            if (script) {
                var _document$head2;
                (_document$head2 = document.head) === null || _document$head2 === void 0 || _document$head2.removeChild(script);
            }
        });
    }
}
function hmrApply(bundle /*: ParcelRequire */ , asset /*:  HMRAsset */ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (asset.type === 'css') reloadCSS();
    else if (asset.type === 'js') {
        let deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID];
        if (deps) {
            if (modules[asset.id]) {
                // Remove dependencies that are removed and will become orphaned.
                // This is necessary so that if the asset is added back again, the cache is gone, and we prevent a full page reload.
                let oldDeps = modules[asset.id][1];
                for(let dep in oldDeps)if (!deps[dep] || deps[dep] !== oldDeps[dep]) {
                    let id = oldDeps[dep];
                    let parents = getParents(module.bundle.root, id);
                    if (parents.length === 1) hmrDelete(module.bundle.root, id);
                }
            }
            if (supportsSourceURL) // Global eval. We would use `new Function` here but browser
            // support for source maps is better with eval.
            (0, eval)(asset.output);
            // $FlowFixMe
            let fn = global.parcelHotUpdate[asset.id];
            modules[asset.id] = [
                fn,
                deps
            ];
        }
        // Always traverse to the parent bundle, even if we already replaced the asset in this bundle.
        // This is required in case modules are duplicated. We need to ensure all instances have the updated code.
        if (bundle.parent) hmrApply(bundle.parent, asset);
    }
}
function hmrDelete(bundle, id) {
    let modules = bundle.modules;
    if (!modules) return;
    if (modules[id]) {
        // Collect dependencies that will become orphaned when this module is deleted.
        let deps = modules[id][1];
        let orphans = [];
        for(let dep in deps){
            let parents = getParents(module.bundle.root, deps[dep]);
            if (parents.length === 1) orphans.push(deps[dep]);
        }
        // Delete the module. This must be done before deleting dependencies in case of circular dependencies.
        delete modules[id];
        delete bundle.cache[id];
        // Now delete the orphans.
        orphans.forEach((id)=>{
            hmrDelete(module.bundle.root, id);
        });
    } else if (bundle.parent) hmrDelete(bundle.parent, id);
}
function hmrAcceptCheck(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    checkedAssets = {};
    if (hmrAcceptCheckOne(bundle, id, depsByBundle)) return true;
    // Traverse parents breadth first. All possible ancestries must accept the HMR update, or we'll reload.
    let parents = getParents(module.bundle.root, id);
    let accepted = false;
    while(parents.length > 0){
        let v = parents.shift();
        let a = hmrAcceptCheckOne(v[0], v[1], null);
        if (a) // If this parent accepts, stop traversing upward, but still consider siblings.
        accepted = true;
        else if (a !== null) {
            // Otherwise, queue the parents in the next level upward.
            let p = getParents(module.bundle.root, v[1]);
            if (p.length === 0) {
                // If there are no parents, then we've reached an entry without accepting. Reload.
                accepted = false;
                break;
            }
            parents.push(...p);
        }
    }
    return accepted;
}
function hmrAcceptCheckOne(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
        // If we reached the root bundle without finding where the asset should go,
        // there's nothing to do. Mark as "accepted" so we don't reload the page.
        if (!bundle.parent) {
            bundleNotFound = true;
            return true;
        }
        return hmrAcceptCheckOne(bundle.parent, id, depsByBundle);
    }
    if (checkedAssets[id]) return null;
    checkedAssets[id] = true;
    var cached = bundle.cache[id];
    if (!cached) return true;
    assetsToDispose.push([
        bundle,
        id
    ]);
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        assetsToAccept.push([
            bundle,
            id
        ]);
        return true;
    }
    return false;
}
function hmrDisposeQueue() {
    // Dispose all old assets.
    for(let i = 0; i < assetsToDispose.length; i++){
        let id = assetsToDispose[i][1];
        if (!disposedAssets[id]) {
            hmrDispose(assetsToDispose[i][0], id);
            disposedAssets[id] = true;
        }
    }
    assetsToDispose = [];
}
function hmrDispose(bundle /*: ParcelRequire */ , id /*: string */ ) {
    var cached = bundle.cache[id];
    bundle.hotData[id] = {};
    if (cached && cached.hot) cached.hot.data = bundle.hotData[id];
    if (cached && cached.hot && cached.hot._disposeCallbacks.length) cached.hot._disposeCallbacks.forEach(function(cb) {
        cb(bundle.hotData[id]);
    });
    delete bundle.cache[id];
}
function hmrAccept(bundle /*: ParcelRequire */ , id /*: string */ ) {
    // Execute the module.
    bundle(id);
    // Run the accept callbacks in the new version of the module.
    var cached = bundle.cache[id];
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        let assetsToAlsoAccept = [];
        cached.hot._acceptCallbacks.forEach(function(cb) {
            let additionalAssets = cb(function() {
                return getParents(module.bundle.root, id);
            });
            if (Array.isArray(additionalAssets) && additionalAssets.length) assetsToAlsoAccept.push(...additionalAssets);
        });
        if (assetsToAlsoAccept.length) {
            let handled = assetsToAlsoAccept.every(function(a) {
                return hmrAcceptCheck(a[0], a[1]);
            });
            if (!handled) return fullReload();
            hmrDisposeQueue();
        }
    }
}

},{}],"gNc1f":[function(require,module,exports,__globalThis) {
// --- Constants and Config ---
// Flag to force fallback mode even with valid API key (for debugging)
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "fetchGutenbergPassage", ()=>fetchGutenbergPassage);
var _debugLog = require("@/utils/debugLog");
// Import the environment configuration utilities
var _environmentConfig = require("@/utils/environmentConfig");
// getGutenbergBookData and GutendexBookDetails are no longer used here as metadata
// is fetched by the web-enabled LLM directly in fetchGutenbergPassage.
// Other Gutendex types like GutendexResponse, SearchGutenbergBooksArgs are not directly used in main.ts anymore.
// import { getGutenbergBookData, GutendexBookDetails } from '@/services/gutenbergService'; // This line is removed
var _llmService = require("@/services/llmService");
// Import game logic functions and state, including startRound and handleSubmission
var _gameLogic = require("@/services/gameLogic");
const FORCE_FALLBACK = false; // Using the provided API key
// Empty stub functions for timer (since we're removing timer functionality)
function startTimer() {
// Timer functionality removed
}
function stopTimer() {
// Timer functionality removed
}
async function fetchGutenbergPassage(category = null, author = null, century = null, attemptedBookIds = [] // Keep track of books already tried
) {
    const MAX_RETRIES = 3;
    (0, _debugLog.debugLog)("Fetching Gutenberg passage", {
        category,
        author,
        century,
        attempt: attemptedBookIds.length + 1
    });
    // CHECK 1: Allow real Gutenberg fetching when possible
    // Only use fallback when necessary (GitHub Pages, missing API key)
    const TEMP_FORCE_FALLBACK = false; // Enable real Gutenberg fetching
    // Check for API key and environment
    const hasValidApiKey = Boolean((0, _environmentConfig.getEnvironmentConfig)().OPENROUTER_API_KEY);
    const isUsingCustomKey = (0, _environmentConfig.isUsingUserProvidedApiKey)();
    const isGitHubPages = window.location.hostname.includes('github.io');
    (0, _debugLog.debugLog)("Environment check", {
        hasValidApiKey,
        isUsingCustomKey,
        isGitHubPages,
        hostname: window.location.hostname,
        apiKeyFormat: (0, _environmentConfig.getEnvironmentConfig)().OPENROUTER_API_KEY.substring(0, 8) + "...",
        forceFallback: FORCE_FALLBACK,
        tempForceFallback: TEMP_FORCE_FALLBACK
    });
    // Use hardcoded examples if:
    // - we're on GitHub Pages AND don't have a custom key, OR
    // - have no valid API key, OR
    // - if we're forcing fallback mode (useful for debugging), OR
    // - temporarily forcing fallback globally
    // This fallback logic should be outside the retry loop, as it's a global override.
    if (!hasValidApiKey || FORCE_FALLBACK || TEMP_FORCE_FALLBACK) {
        console.warn("Using fallback passage due to missing API key or forced fallback.");
        let fallbackParagraphs;
        let fallbackMetadata = {
            title: "Fallback Passage",
            author: "Anonymous",
            id: 0
        };
        if (category === 'adventure') {
            fallbackParagraphs = `The intrepid explorer ventured deeper into the uncharted jungle, sweat beading on his brow as he hacked through the dense undergrowth with his machete. Strange bird calls echoed through the canopy above, and the air hung thick with moisture and the sweet scent of exotic flowers. He knew the lost temple lay somewhere ahead, its ancient stones hiding secrets that had remained untouched for centuries.

As night fell, he made camp beside a small stream, the gentle gurgling of water over stones providing a soothing counterpoint to the mysterious sounds of the jungle. His maps were worn and faded, but they had served him well thus far. Tomorrow would bring new challenges and, perhaps, the discovery that would cement his place in the annals of exploration.`;
            fallbackMetadata = {
                title: "Adventure Story Excerpt",
                author: "Various Authors",
                id: 0
            };
        } else if (category === 'science') {
            fallbackParagraphs = `The laboratory hummed with the soft whirring of centrifuges and the occasional beep of monitoring equipment. Dr. Chen carefully pipetted the clear solution into a series of test tubes, her steady hands reflecting years of practiced precision. This experiment represented months of theoretical work, and if successful, could fundamentally alter our understanding of cellular regeneration.

Scientific discovery has always balanced on the knife-edge between methodical process and creative insight. The greatest breakthroughs often come not from following established protocols, but from the moments when researchers question fundamental assumptions and pursue the unexpected anomalies that appear in their data. It is this combination of discipline and imagination that drives progress forward.`;
            fallbackMetadata = {
                title: "Scientific Musings",
                author: "Various Authors",
                id: 0
            };
        } else {
            // Default paragraphs for any other category or no category
            fallbackParagraphs = `The ability to think clearly and rationally is essential for making good decisions and solving problems effectively. Critical thinking involves analyzing information objectively and making reasoned judgments based on evidence rather than personal bias or emotional reactions. It requires skills such as attention to detail, logical reasoning, and the willingness to question assumptions.

Throughout history, literature has served as a mirror reflecting the values, concerns, and aspirations of society. Books allow us to experience different perspectives, fostering empathy and understanding across cultural divides. Whether through fiction or non-fiction, the written word preserves human knowledge and invites readers to engage with ideas that may challenge or expand their worldview.`;
            fallbackMetadata = {
                title: "General Knowledge Excerpt",
                author: "Various Authors",
                id: 0
            };
        }
        return {
            paragraphs: fallbackParagraphs.split(/\n+/).filter((p)=>p.trim().length > 0),
            metadata: fallbackMetadata
        };
    }
    // Retry loop
    for(let attempt = 0; attempt < MAX_RETRIES; attempt++){
        (0, _debugLog.debugLog)(`Fetch attempt ${attempt + 1} of ${MAX_RETRIES}. Attempted IDs: ${attemptedBookIds.join(', ')}`);
        const queryParts = [];
        if (author) queryParts.push(`by author "${author}"`);
        if (category) {
            if (category.includes('/')) {
                const categoryCode = category.split('/')[1];
                if (categoryCode) {
                    queryParts.push(`in the Gutenberg bookshelf ID "${categoryCode}"`);
                    (0, _debugLog.debugLog)(`Using bookshelf ID "${categoryCode}" from category "${category}".`);
                } else (0, _debugLog.debugLog)(`Could not extract bookshelf ID from category "${category}". Category will be ignored.`);
            } else queryParts.push(`in the category "${category}"`);
        }
        if (century) {
            const centuryNumber = parseInt(century);
            if (!isNaN(centuryNumber)) queryParts.push(`from the ${centuryNumber + 1}th century`);
        }
        let queryString = queryParts.join(' ');
        let baseQueryInstruction;
        if (queryParts.length > 0) {
            baseQueryInstruction = `from Project Gutenberg ${queryString}`;
            (0, _debugLog.debugLog)("Specific criteria provided: using standard query string.");
        } else {
            // For the initial fetch when no user settings are provided,
            // use a more specific instruction to encourage true randomness and variety.
            baseQueryInstruction = "from a truly random book in classic literature, prioritizing high variety and diverse selections. Please try to pick something unexpected or less common to ensure a unique experience.";
            (0, _debugLog.debugLog)("No specific criteria: using new enhanced random query string for initial fetch.");
        }
        let retryInstructions = "";
        if (attempt > 0) retryInstructions = ` This is attempt ${attempt + 1}. Please ensure you select a *different* book than previous attempts.`;
        if (attemptedBookIds.length > 0) retryInstructions += ` Avoid Project Gutenberg IDs: ${attemptedBookIds.join(', ')}.`;
        const userQuery = `Please provide a short literary passage (2-3 paragraphs) from Project Gutenberg.
${baseQueryInstruction ? `Ideally, the passage should be ${baseQueryInstruction}.` : 'The passage can be from any classic literary work.'}
${retryInstructions}
Include the title, author, and Project Gutenberg ID if available.

Format suggestion:
Title: [Book Title]
Author: [Book Author]
ID: [Book ID]
Passage:
[The passage text]

If no passage can be found, please indicate that. Focus on returning a passage, even if all criteria cannot be perfectly met.`;
        const messages = [
            {
                role: 'system',
                content: 'You are an assistant that helps find and display literary passages from Project Gutenberg. Please provide the passage text along with its title, author, and Project Gutenberg ID if available. Prioritize finding a passage, even if specific search criteria (like category, author, or century) are suggestions and cannot all be met. Avoid adding commentary or analysis not present in the original text.'
            },
            {
                role: 'user',
                content: userQuery
            }
        ];
        try {
            // Determine temperature: higher for purely random, default otherwise
            const temperature = queryParts.length === 0 ? 1.2 : undefined;
            (0, _debugLog.debugLog)(`LLM call (attempt ${attempt + 1}) with temperature: ${temperature === undefined ? 'default' : temperature}`);
            const llmResponseContent = await (0, _llmService.runAgenticLoop)(messages, [], temperature);
            if (!llmResponseContent) {
                console.error(`LLM call (attempt ${attempt + 1}) returned no content.`);
                if (attempt === MAX_RETRIES - 1) return null; // Last attempt failed
                await new Promise((resolve)=>setTimeout(resolve, 1000)); // Wait before retrying
                continue; // Next attempt
            }
            (0, _debugLog.debugLog)(`LLM Web Search Response for Passage (attempt ${attempt + 1}):`, llmResponseContent);
            let bookTitle = "Unknown Title";
            let bookAuthor = "Unknown Author";
            let bookId = null;
            let passageText = "";
            const titleMatch = llmResponseContent.match(/Title:\s*(.*)/i);
            if (titleMatch && titleMatch[1]) bookTitle = titleMatch[1].trim();
            const authorMatch = llmResponseContent.match(/Author:\s*(.*)/i);
            if (authorMatch && authorMatch[1]) bookAuthor = authorMatch[1].trim();
            const idMatch = llmResponseContent.match(/ID:\s*(\d+)/i);
            if (idMatch && idMatch[1]) bookId = parseInt(idMatch[1], 10);
            // Add bookId to attemptedBookIds if valid and not already present
            if (bookId !== null && !attemptedBookIds.includes(bookId)) attemptedBookIds.push(bookId);
            const passageMarker = "Passage:";
            const passageStartIndex = llmResponseContent.indexOf(passageMarker);
            if (passageStartIndex !== -1) passageText = llmResponseContent.substring(passageStartIndex + passageMarker.length).trim();
            else {
                let lastMetadataIndex = 0;
                if (titleMatch) lastMetadataIndex = Math.max(lastMetadataIndex, (titleMatch.index || 0) + titleMatch[0].length);
                if (authorMatch) lastMetadataIndex = Math.max(lastMetadataIndex, (authorMatch.index || 0) + authorMatch[0].length);
                if (idMatch) lastMetadataIndex = Math.max(lastMetadataIndex, (idMatch.index || 0) + idMatch[0].length);
                if (lastMetadataIndex > 0 && lastMetadataIndex < llmResponseContent.length) passageText = llmResponseContent.substring(lastMetadataIndex).trim();
                else if (!titleMatch && !authorMatch && !idMatch) {
                    passageText = llmResponseContent.trim();
                    (0, _debugLog.debugLog)("No metadata markers found, assuming entire response is passage text.");
                }
            }
            if (!passageText || llmResponseContent.toLowerCase().includes("no suitable passage found")) {
                console.warn(`Attempt ${attempt + 1}: Could not extract passage text or LLM indicated no passage found.`);
                if (attempt === MAX_RETRIES - 1) return null; // Last attempt failed
                await new Promise((resolve)=>setTimeout(resolve, 1000)); // Wait before retrying
                continue; // Next attempt
            }
            let paragraphs = passageText.split(/\n\s*\n/).map((p)=>p.trim()).filter((p)=>p.length > 150 && !p.startsWith('Project Gutenberg') && !p.startsWith('***') && !p.includes('*** END OF ') && !p.startsWith('THE END') && !p.includes('www.gutenberg.org') && !/^\*+$/.test(p)).slice(0, 10);
            if (paragraphs.length < 2) {
                (0, _debugLog.debugLog)(`Attempt ${attempt + 1}: First parsing didn't yield enough paragraphs, trying alternative.`);
                paragraphs = passageText.replace(/\r\n/g, '\n').split(/(?:\n\s*){2,}/).map((p)=>p.replace(/\n/g, ' ').trim()).filter((p)=>p.length > 150 && !p.includes('Project Gutenberg')).slice(0, 10);
            }
            paragraphs.sort((a, b)=>{
                const scoreA = Math.min(a.length, 1000) - Math.max(0, 2000 - a.length) + (a.match(/[.!?][\s"']/) ? 200 : 0);
                const scoreB = Math.min(b.length, 1000) - Math.max(0, 2000 - b.length) + (b.match(/[.!?][\s"']/) ? 200 : 0);
                return scoreB - scoreA;
            });
            paragraphs = paragraphs.slice(0, 2);
            if (paragraphs.length === 0) (0, _debugLog.debugLog)(`Attempt ${attempt + 1}: Failed to extract suitable paragraphs after all parsing attempts.`);
            // If we have at least one good paragraph, proceed. Otherwise, retry.
            if (paragraphs.length > 0) {
                console.log(`Attempt ${attempt + 1}: Successfully extracted ${paragraphs.length} paragraphs.`);
                return {
                    paragraphs: paragraphs,
                    metadata: {
                        title: bookTitle,
                        author: bookAuthor,
                        id: bookId !== null ? bookId : 0
                    }
                };
            } else console.warn(`Attempt ${attempt + 1}: Could only extract ${paragraphs.length} suitable paragraphs. Retrying if attempts remain.`);
        } catch (error) {
            console.error(`Error in fetchGutenbergPassage (LLM web search, attempt ${attempt + 1}):`, error);
        // Loop will continue if attempts < MAX_RETRIES
        }
        if (attempt < MAX_RETRIES - 1) await new Promise((resolve)=>setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff might be better
    } // End of retry loop
    console.error("Failed to fetch a suitable passage after all retries.");
    return null; // Indicate failure after all retries
}
// are now imported from and managed by gameLogic.ts.
// We use aliasing for round, blanksCount, hintsRemaining, hintedBlanks to avoid naming conflicts if needed,
// though direct usage of imported names is fine if there are no conflicts.
// Function to reset game state for a new game (not just a new round)
function resetGame() {
    // We'll use the imported resetGame function from gameLogic
    (0, _gameLogic.resetGame)();
    // Additional UI updates if needed
    if (gameArea) gameArea.innerHTML = '';
    if (resultArea) resultArea.textContent = '';
    if (roundInfo) roundInfo.textContent = '';
    if (bibliographicArea) bibliographicArea.innerHTML = '';
    stopTimer();
}
// Cache DOM elements
let bibliographicArea, gameArea, resultArea, hintBtn, submitBtn, roundInfo, newTextBtn, welcomeOverlay, startGameBtn;
function querySelectorSafe(selector, container = document) {
    const element = container.querySelector(selector);
    if (!element) {
        console.warn(`Element with selector "${selector}" not found.`);
        return null;
    }
    return element;
}
function cacheDOMElements() {
    try {
        bibliographicArea = querySelectorSafe('#bibliographic-area') || document.createElement('div');
        gameArea = querySelectorSafe('#game-area') || document.createElement('div');
        resultArea = querySelectorSafe('#result') || document.createElement('div');
        hintBtn = querySelectorSafe('#hint-btn') || document.createElement('button');
        submitBtn = querySelectorSafe('#submit-btn') || document.createElement('button');
        roundInfo = querySelectorSafe('#round-info') || document.createElement('div');
        // Settings elements are now handled by Preact components
        newTextBtn = querySelectorSafe('#new-text-btn') || document.createElement('button');
        // Check for welcome overlay elements (may not exist in inference.html)
        welcomeOverlay = querySelectorSafe('#welcome-overlay') || document.createElement('div');
        startGameBtn = querySelectorSafe('#start-game-btn') || document.createElement('button');
        console.log("DOM Elements cached successfully:", {
            gameAreaFound: !!document.querySelector('#game-area'),
            welcomeOverlayFound: !!document.querySelector('#welcome-overlay'),
            startGameBtnFound: !!document.querySelector('#start-game-btn')
        });
        // Initialize DOM elements for gameLogic service
        (0, _gameLogic.initializeGameDOMElements)({
            gameArea,
            roundInfo,
            submitBtn,
            hintBtn,
            resultArea,
            bibliographicArea
        });
    } catch (error) {
        console.error("Error caching DOM elements:", error);
    }
}
// Make functions globally available for legacy code and avoiding circular imports
if (typeof window !== 'undefined') {
    window.startRound = (0, _gameLogic.startRound);
    // findRelatedBooks is removed
    console.log("Added global functions to window object");
}
// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', ()=>{
    // Cache DOM elements
    cacheDOMElements();
    // Set up event listeners
    // The startGameBtn event listener is removed from here as it's handled by the WelcomeOverlay component's onStart prop
    // and the app.tsx component.
    newTextBtn.addEventListener('click', async ()=>{
        // Fetch a new passage without resetting game state, forcing a new passage
        await (0, _gameLogic.startRound)(true);
    });
    submitBtn.addEventListener('click', ()=>(0, _gameLogic.handleSubmission)());
// Show welcome overlay
// The welcome overlay visibility is now primarily managed by the App component's state
// and the WelcomeOverlay component itself.
// However, ensuring it's initially visible if not handled by Preact's initial render might still be useful.
// For now, let's assume Preact handles initial visibility correctly.
// If issues arise, we might need to revisit this.
// welcomeOverlay.classList.remove('hidden'); // This line can likely be removed or conditionalized
});

},{"@/utils/debugLog":"48AmR","@/utils/environmentConfig":"hZ7Ky","@/services/llmService":"ir9R2","@/services/gameLogic":"6WZYg","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"48AmR":[function(require,module,exports,__globalThis) {
// src/utils/debugLog.ts
/**
 * Helper function to add detailed debug logs to the console.
 * Includes a timestamp and optional data payload.
 * @param message The main log message.
 * @param data Optional data to be logged as a JSON string.
 */ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "debugLog", ()=>debugLog);
function debugLog(message, data) {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG ${timestamp}] ${message}`);
    if (data !== undefined) try {
        // Attempt to stringify, handling potential circular references or large objects
        const jsonData = JSON.stringify(data, (key, value)=>{
            if (value instanceof HTMLElement) return `HTMLElement (${value.tagName}${value.id ? '#' + value.id : ''})`;
            // Add more complex object handling here if needed
            return value;
        }, 2);
        console.log(jsonData);
    } catch (error) {
        console.log('[DEBUG Data Stringify Error]', error);
        console.log('[DEBUG Raw Data]', data); // Log raw data if stringify fails
    }
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"jnFvT":[function(require,module,exports,__globalThis) {
exports.interopDefault = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
};
exports.defineInteropFlag = function(a) {
    Object.defineProperty(a, '__esModule', {
        value: true
    });
};
exports.exportAll = function(source, dest) {
    Object.keys(source).forEach(function(key) {
        if (key === 'default' || key === '__esModule' || Object.prototype.hasOwnProperty.call(dest, key)) return;
        Object.defineProperty(dest, key, {
            enumerable: true,
            get: function() {
                return source[key];
            }
        });
    });
    return dest;
};
exports.export = function(dest, destName, get) {
    Object.defineProperty(dest, destName, {
        enumerable: true,
        get: get
    });
};

},{}],"hZ7Ky":[function(require,module,exports,__globalThis) {
// src/utils/environmentConfig.ts
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
/**
 * Determines if the application is running in a remote interface like GitHub Pages
 * @returns boolean indicating if this is a remote interface
 */ parcelHelpers.export(exports, "isRemoteInterface", ()=>isRemoteInterface);
/**
 * Retrieves the current environment configuration
 * Prioritizes user-provided values in localStorage over defaults
 * In remote interfaces, always uses the default key for security
 */ parcelHelpers.export(exports, "getEnvironmentConfig", ()=>getEnvironmentConfig);
/**
 * Checks if a user-provided API key is being used
 * Useful for determining if we're using a default key or user-provided key
 * Always returns false in remote interfaces for security
 */ parcelHelpers.export(exports, "isUsingUserProvidedApiKey", ()=>isUsingUserProvidedApiKey);
/**
 * Sets a user-provided API key in localStorage
 * Also validates the key format
 * In remote interfaces, this is a no-op for security
 * @param key The API key to set
 * @returns Whether the key was valid and set successfully
 */ parcelHelpers.export(exports, "setUserApiKey", ()=>setUserApiKey);
var _debugLog = require("./debugLog");
/**
 * Environment configuration management for the application
 * Handles secure storage and retrieval of sensitive configuration values
 */ // Define the default safe fallback key (will be used if no key is found)
// This key is obfuscated to prevent direct copying
const ENCODED_DEFAULT_KEY = 'c2stb3ItdjEtNGY4MmQ3NDBlZmQyNjlhY2IwYTA4MGIzMTgyNTQ5NDlhMTQ5Y2FlYTZmNzFkODAxMGM0MDJkNWQ5ZGViYjQ1Zg==';
function isRemoteInterface() {
    return window.location.hostname.includes('github.io') || window.location.hostname === 'cloze-reader.vercel.app' || window.location.protocol === 'file:';
}
function getEnvironmentConfig() {
    const remote = isRemoteInterface();
    // Try to get user-set API key from localStorage
    const userProvidedKey = localStorage.getItem('openrouter_api_key');
    const isUserKeyValid = Boolean(userProvidedKey) && userProvidedKey.startsWith('sk-or-') && userProvidedKey.length > 20;
    // Decode the default key
    const defaultKey = atob(ENCODED_DEFAULT_KEY);
    // Use default key if in remote interface, otherwise use user key if valid
    const apiKey = remote ? defaultKey : isUserKeyValid ? userProvidedKey : defaultKey;
    (0, _debugLog.debugLog)("Environment config loaded", {
        isRemoteInterface: remote,
        usingUserKey: !remote && isUserKeyValid,
        keyFormat: apiKey.substring(0, 8) + "..."
    });
    return {
        OPENROUTER_API_KEY: apiKey,
        IS_REMOTE_INTERFACE: remote
    };
}
function isUsingUserProvidedApiKey() {
    // In remote interfaces, always report as using the default key
    if (isRemoteInterface()) return false;
    const userProvidedKey = localStorage.getItem('openrouter_api_key');
    return Boolean(userProvidedKey) && userProvidedKey.startsWith('sk-or-') && userProvidedKey.length > 20;
}
function setUserApiKey(key) {
    // In remote interfaces, don't allow setting custom API keys
    if (isRemoteInterface()) {
        (0, _debugLog.debugLog)("Cannot set custom API key in remote interface");
        return false;
    }
    const trimmedKey = key.trim();
    if (trimmedKey && trimmedKey.startsWith('sk-or-') && trimmedKey.length > 20) {
        localStorage.setItem('openrouter_api_key', trimmedKey);
        return true;
    }
    return false;
}

},{"./debugLog":"48AmR","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"ir9R2":[function(require,module,exports,__globalThis) {
// src/services/llmService.ts
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "tools", ()=>tools);
parcelHelpers.export(exports, "TOOL_MAPPING", ()=>TOOL_MAPPING);
/**
 * Calls the OpenRouter LLM API with the given messages and tools.
 * @param messages Array of messages for the LLM.
 * @param currentTools Optional array of tool definitions for the LLM.
 * @param temperature Optional temperature setting for the LLM.
 * @returns A promise that resolves to the assistant's response message.
 */ parcelHelpers.export(exports, "callLLM", ()=>callLLM);
/**
 * Processes tool calls from an assistant's response.
 * @param assistantResponse The assistant's message containing tool calls.
 * @returns A promise that resolves to a message with the tool's response.
 */ parcelHelpers.export(exports, "getToolResponse", ()=>getToolResponse);
/**
 * Runs an agentic loop with the LLM, handling tool calls.
 * @param initialMessages The initial set of messages to start the loop.
 * @param loopTools The tools available for the LLM to use in this loop.
 * @param temperature Optional temperature setting for the LLM calls within the loop.
 * @returns A promise that resolves to the final assistant content or an error message.
 */ parcelHelpers.export(exports, "runAgenticLoop", ()=>runAgenticLoop);
var _debugLog = require("@/utils/debugLog");
var _environmentConfig = require("@/utils/environmentConfig");
const tools = [];
const TOOL_MAPPING = {
};
// For debugging tool calls
function logToolCall(message, data) {
    // Using debugLog for consistency, assuming it's globally available or passed/imported
    (0, _debugLog.debugLog)(`[LLM Service Tool Call] ${message}`, data);
}
async function callLLM(messages, currentTools, temperature) {
    const body = {
        model: 'google/gemini-flash-1.5:online',
        messages
    };
    if (temperature !== undefined) {
        body.temperature = temperature;
        (0, _debugLog.debugLog)("LLM Service: Using custom temperature", temperature);
    }
    // If tools are provided, add them. Otherwise, the model will rely on web search.
    if (currentTools && currentTools.length > 0) {
        body.tools = currentTools;
        body.tool_choice = 'auto'; // Let the model decide when to use tools
        (0, _debugLog.debugLog)("LLM Service: Using tools", currentTools);
    } else // If no specific tools, ensure tool_choice is not set or is 'none' if we want to prevent any tool use.
    // For web search, 'auto' or omitting tool_choice is fine.
    // The :online suffix handles the web search plugin implicitly.
    (0, _debugLog.debugLog)("LLM Service: No specific tools provided, relying on web search via :online model suffix.");
    (0, _debugLog.debugLog)("LLM Service: OpenRouter API Request", body);
    try {
        const apiKey = (0, _environmentConfig.getEnvironmentConfig)().OPENROUTER_API_KEY;
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : '',
                'X-Title': 'Cloze'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = await response.text();
            }
            const errorMessage = typeof errorData === 'object' && errorData?.error?.message ? errorData.error.message : typeof errorData === 'string' ? errorData : 'Unknown API error';
            console.error("LLM Service: OpenRouter API Error:", response.status, errorMessage);
            throw new Error(`OpenRouter API Error: ${response.status} - ${errorMessage}`);
        }
        const data = await response.json();
        (0, _debugLog.debugLog)("LLM Service: OpenRouter API Response", data);
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error("LLM Service: Invalid response structure from OpenRouter:", data);
            throw new Error("Invalid response structure from OpenRouter.");
        }
        return data.choices[0].message;
    } catch (error) {
        console.error("LLM Service: Error calling OpenRouter API:", error);
        throw error; // Re-throw to be handled by the caller
    }
}
async function getToolResponse(assistantResponse) {
    if (!assistantResponse.tool_calls || assistantResponse.tool_calls.length === 0) throw new Error("Assistant response does not contain tool calls.");
    const toolCall = assistantResponse.tool_calls[0]; // Assuming one tool call for now
    const toolName = toolCall.function.name;
    logToolCall("Received tool call", {
        toolName,
        toolCallId: toolCall.id
    });
    let toolArgs;
    try {
        toolArgs = JSON.parse(toolCall.function.arguments);
        logToolCall("Parsed tool arguments", toolArgs);
    } catch (error) {
        const errorObj = error;
        console.error("LLM Service: Failed to parse tool arguments:", errorObj);
        return {
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify({
                error: `Invalid JSON in tool arguments: ${errorObj.message}`
            })
        };
    }
    const toolFunction = TOOL_MAPPING[toolName];
    if (!toolFunction) {
        console.error(`LLM Service: Tool ${toolName} not found in TOOL_MAPPING.`);
        return {
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify({
                error: `Tool ${toolName} not found.`
            })
        };
    }
    try {
        logToolCall("Executing tool function", {
            name: toolName
        });
        const toolResult = await toolFunction(toolArgs);
        logToolCall("Tool execution result", toolResult);
        return {
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify(toolResult)
        };
    } catch (error) {
        console.error(`LLM Service: Error executing tool ${toolName}:`, error);
        return {
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify({
                error: `Error executing tool ${toolName}: ${error.message}`
            })
        };
    }
}
async function runAgenticLoop(initialMessages, loopTools, temperature) {
    let messages = [
        ...initialMessages
    ];
    const MAX_ITERATIONS = 5; // Prevent infinite loops
    for(let i = 0; i < MAX_ITERATIONS; i++){
        (0, _debugLog.debugLog)(`LLM Service: Agentic Loop Iteration ${i + 1}`);
        const assistantResponse = await callLLM(messages, loopTools, temperature); // Pass temperature
        messages.push(assistantResponse);
        if (assistantResponse.tool_calls && assistantResponse.tool_calls.length > 0) {
            // Potentially handle multiple tool calls in the future if needed
            const toolResponseMessage = await getToolResponse(assistantResponse);
            messages.push(toolResponseMessage);
        } else // No tool calls, loop finishes, return assistant's content
        return assistantResponse.content ?? null;
    }
    console.warn("LLM Service: Agentic loop reached max iterations.");
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content) return lastMessage.content;
    return "Agentic loop completed without a final assistant message or an error occurred.";
}

},{"@/utils/debugLog":"48AmR","@/utils/environmentConfig":"hZ7Ky","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"6WZYg":[function(require,module,exports,__globalThis) {
// src/services/gameLogic.ts
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
// --- Game Logic Functions ---
/**
 * Chooses words to redact from a list of words based on a scoring mechanism.
 * @param words The array of words in the paragraph.
 * @param count The desired number of redactions.
 * @returns An array of indices to be redacted.
 */ parcelHelpers.export(exports, "chooseRedactions", ()=>chooseRedactions);
/**
 * Extracts key terms from an array of words based on frequency, excluding common words.
 * @param words The array of words to process.
 * @param count The number of key terms to extract.
 * @returns An array of key terms.
 */ parcelHelpers.export(exports, "extractKeyTerms", ()=>extractKeyTerms);
parcelHelpers.export(exports, "paragraphsWords", ()=>paragraphsWords);
parcelHelpers.export(exports, "redactedIndices", ()=>redactedIndices);
parcelHelpers.export(exports, "round", ()=>round);
parcelHelpers.export(exports, "blanksCount", ()=>blanksCount);
parcelHelpers.export(exports, "hintsRemaining", ()=>hintsRemaining);
parcelHelpers.export(exports, "hintedBlanks", ()=>hintedBlanks);
parcelHelpers.export(exports, "previousBooks", ()=>previousBooks);
parcelHelpers.export(exports, "initializeGameDOMElements", ()=>initializeGameDOMElements);
/**
 * Renders the current round of the game, displaying paragraphs with redactions.
 */ parcelHelpers.export(exports, "renderRound", ()=>renderRound);
/**
 * Resets the game state for a new game.
 */ parcelHelpers.export(exports, "resetGame", ()=>resetGame);
/**
 * Starts a new round of the game by fetching a new passage and rendering it.
 */ parcelHelpers.export(exports, "startRound", ()=>startRound);
/**
 * Handles the submission of the user's guesses, checks answers, and updates the UI.
 * @param timedOut Whether the submission was triggered by a timer timeout.
 */ parcelHelpers.export(exports, "handleSubmission", ()=>handleSubmission);
var _debugLog = require("@/utils/debugLog");
var _main = require("@/main");
// --- Caching ---
const paragraphCache = {
    cache: {},
    maxSize: 10,
    set: function(key, value) {
        if (Object.keys(this.cache).length >= this.maxSize) {
            const oldestKey = Object.keys(this.cache)[0];
            delete this.cache[oldestKey];
        }
        this.cache[key] = {
            value,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem('paragraphCache', JSON.stringify(this.cache));
        } catch (e) {
            console.warn('Could not save cache to localStorage', e);
        }
    },
    get: function(key) {
        const item = this.cache[key];
        if (!item) return null;
        if (Date.now() - item.timestamp > 86400000) {
            delete this.cache[key];
            try {
                localStorage.setItem('paragraphCache', JSON.stringify(this.cache));
            } catch (e) {
                console.warn('Could not update cache in localStorage', e);
            }
            return null;
        }
        return item.value;
    },
    init: function() {
        try {
            const saved = localStorage.getItem('paragraphCache');
            if (saved) this.cache = JSON.parse(saved);
        } catch (e) {
            console.warn('Could not load cache from localStorage', e);
            this.cache = {};
        }
    }
};
// Initialize the cache when the module is loaded
paragraphCache.init();
function chooseRedactions(words, count) {
    const indices = [];
    if (words.length === 0 || count === 0) return indices;
    const functionWords = new Set([
        'the',
        'a',
        'an',
        'and',
        'or',
        'but',
        'if',
        'of',
        'at',
        'by',
        'for',
        'with',
        'about',
        'to',
        'from',
        'in',
        'on',
        'is',
        'are',
        'was',
        'were',
        'be',
        'been',
        'being',
        'have',
        'has',
        'had',
        'do',
        'does',
        'did',
        'will',
        'would',
        'shall',
        'should',
        'can',
        'could',
        'may',
        'might',
        'must',
        'that',
        'which',
        'who',
        'whom',
        'whose',
        'this',
        'these',
        'those',
        'am',
        'i',
        'we',
        'you',
        'he',
        'she',
        'they',
        'we',
        'it' // Corrected: removed duplicate 'we'
    ]);
    const scoredWords = words.map((word, index)=>{
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        let score = 0;
        score += cleanWord.length * 2;
        if (functionWords.has(cleanWord)) score -= 10;
        if (index > 0 && word[0] === word[0].toUpperCase() && word[0].match(/[A-Z]/)) score += 5;
        score += Math.random() * 2;
        return {
            index,
            score
        };
    });
    scoredWords.sort((a, b)=>b.score - a.score);
    const actualCount = Math.min(count, words.length);
    const candidatePoolSize = Math.min(actualCount * 2, words.length);
    const topCandidates = scoredWords.slice(0, candidatePoolSize);
    while(indices.length < actualCount && topCandidates.length > 0){
        const randomIndex = Math.floor(Math.random() * topCandidates.length);
        const selectedWord = topCandidates.splice(randomIndex, 1)[0];
        indices.push(selectedWord.index);
    }
    return indices.sort((a, b)=>a - b);
}
function extractKeyTerms(words, count = 3) {
    const commonWords = new Set([
        'the',
        'and',
        'of',
        'to',
        'a',
        'in',
        'that',
        'it',
        'is',
        'was',
        'were',
        'for',
        'on',
        'with',
        'as',
        'by',
        'an',
        'be',
        'at',
        'or',
        'i',
        'he',
        'she',
        'they',
        'we',
        'you',
        'my',
        'his',
        'her',
        'its',
        'our',
        'your',
        'them',
        'us',
        'me',
        'had',
        'has',
        'have',
        'do',
        'does',
        'did',
        'will',
        'would',
        'should',
        'can',
        'could',
        'may',
        'might',
        'must',
        'not',
        'no',
        'so',
        'if',
        'but',
        'very',
        'just',
        'from',
        'into',
        'out',
        'up',
        'down',
        'over',
        'under',
        'again',
        'then',
        'once',
        'here',
        'there',
        'when',
        'where',
        'why',
        'how',
        'all',
        'any',
        'both',
        'each',
        'few',
        'more',
        'most',
        'other',
        'some',
        'such',
        'than',
        'too',
        'very',
        's',
        't',
        'd',
        'll',
        'm',
        'o',
        're',
        've'
    ]);
    const frequency = {};
    words.forEach((word)=>{
        const cleanWord = word.toLowerCase().replace(/[^a-z0-9']/g, '');
        if (cleanWord.length > 3 && !commonWords.has(cleanWord) && !/^\d+$/.test(cleanWord)) frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
    });
    return Object.entries(frequency).sort(([, a], [, b])=>b - a).slice(0, count).map(([term])=>term);
}
let paragraphsWords = [
    [],
    []
];
let redactedIndices = [
    [],
    []
];
let round = 1;
let blanksCount = 1;
let hintsRemaining = 5;
let hintedBlanks = new Set();
let previousBooks = [];
let domElements = null;
function initializeGameDOMElements(elements) {
    domElements = elements;
}
function renderRound() {
    if (!domElements) {
        console.error("DOM elements not initialized for gameLogic.renderRound");
        return;
    }
    const { gameArea, roundInfo, submitBtn, hintBtn, resultArea } = domElements;
    const totalBlanks = redactedIndices[0].length + redactedIndices[1].length;
    roundInfo.textContent = `Round ${round} \u{2014} ${totalBlanks} blanks`;
    gameArea.innerHTML = '';
    if (paragraphsWords[0].length === 0 && paragraphsWords[1].length === 0) {
        gameArea.innerHTML = '<p class="text-red-500">Error: No paragraphs loaded.</p>';
        submitBtn.disabled = true;
        hintBtn.disabled = true;
        // stopTimer(); // stopTimer is not directly called here but good to note dependency
        return;
    }
    for(let pIdx = 0; pIdx < 2; pIdx++){
        if (paragraphsWords[pIdx].length === 0) continue;
        const paragraphElement = document.createElement('p');
        paragraphElement.className = 'typewriter-text leading-relaxed break-words mb-6';
        paragraphElement.style.maxWidth = '100%';
        paragraphElement.style.overflowWrap = 'break-word';
        gameArea.appendChild(paragraphElement);
        paragraphsWords[pIdx].forEach((word, idx)=>{
            if (redactedIndices[pIdx].includes(idx)) {
                const input = document.createElement('input');
                input.type = 'text';
                input.dataset.index = String(idx);
                input.dataset.paragraph = String(pIdx);
                input.placeholder = '_____';
                // Enhanced styling for input boxes
                input.className = 'border-b-2 border-typewriter-ink w-24 mx-1 text-center bg-transparent focus:outline-none focus:border-typewriter-ribbon focus:ring-1 focus:ring-typewriter-ribbon rounded-sm px-1 py-0.5 text-typewriter-ink placeholder-typewriter-ink placeholder-opacity-50';
                input.addEventListener('keydown', (e)=>{
                    if (e.key.length === 1) {
                        input.classList.add('shadow-typewriter-pressed');
                        setTimeout(()=>input.classList.remove('shadow-typewriter-pressed'), 100);
                    }
                });
                input.addEventListener('input', ()=>{
                    const allFilled = Array.from(gameArea.querySelectorAll('input[type="text"]')).every((i)=>i.value.trim() !== '');
                    submitBtn.disabled = !allFilled;
                });
                paragraphElement.appendChild(input);
                paragraphElement.appendChild(document.createTextNode(' '));
                input.addEventListener('focus', ()=>{
                    if (!domElements) return; // Guard against null domElements
                    const paragraphIdx = Number(input.dataset.paragraph);
                    const wordIdx = Number(input.dataset.index);
                    const blankKey = `${paragraphIdx}-${wordIdx}`;
                    domElements.hintBtn.disabled = hintsRemaining <= 0 || hintedBlanks.has(blankKey);
                    domElements.hintBtn.onclick = ()=>{
                        if (hintsRemaining > 0 && !hintedBlanks.has(blankKey)) {
                            const originalWord = paragraphsWords[paragraphIdx][wordIdx];
                            if (originalWord) {
                                const hintText = `Starts with "${originalWord[0]}", length ${originalWord.length}.`;
                                const hintDiv = document.createElement('div');
                                hintDiv.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
                                hintDiv.innerHTML = `
                  <div class="bg-aged-paper p-6 rounded shadow-typewriter max-w-md text-center typewriter-text">
                    <h3 class="text-xl font-bold mb-4 text-shadow-typewriter">Hint</h3>
                    <p>${hintText}</p>
                    <button class="mt-4 px-4 py-2 typewriter-key hover:bg-aged-paper">Got it</button>
                  </div>
                `;
                                document.body.appendChild(hintDiv);
                                const closeHint = ()=>document.body.removeChild(hintDiv);
                                hintDiv.querySelector('button')?.addEventListener('click', closeHint);
                                hintDiv.addEventListener('click', (e)=>{
                                    if (e.target === hintDiv) closeHint();
                                });
                                hintsRemaining--;
                                if (domElements) domElements.hintBtn.textContent = `Hint (${hintsRemaining})`;
                                hintedBlanks.add(blankKey);
                                input.classList.add('hinted-blank');
                                if (domElements) domElements.hintBtn.disabled = hintsRemaining <= 0 || hintedBlanks.has(blankKey);
                            }
                        }
                    };
                });
            } else {
                const wordSpan = document.createElement('span');
                wordSpan.textContent = word + ' ';
                wordSpan.className = 'typewriter-text';
                paragraphElement.appendChild(wordSpan);
            }
        });
    }
    const totalRedactedCount = redactedIndices[0].length + redactedIndices[1].length;
    submitBtn.disabled = totalRedactedCount === 0;
    hintBtn.disabled = hintsRemaining <= 0 || totalRedactedCount === 0;
    resultArea.textContent = '';
    // Assuming startTimer is globally available or will be handled
    if (typeof startTimer === 'function') startTimer();
    setTimeout(()=>{
        if (typeof window !== 'undefined' && window.applyTypewriterEffect) window.applyTypewriterEffect();
    }, 100);
}
function resetGame() {
    if (!domElements) {
        console.error("DOM elements not initialized for gameLogic.resetGame");
        return;
    }
    const { gameArea, resultArea, roundInfo, bibliographicArea } = domElements;
    round = 1;
    blanksCount = 1;
    hintsRemaining = 5;
    hintedBlanks.clear();
    paragraphsWords[0] = [];
    paragraphsWords[1] = [];
    redactedIndices[0] = [];
    redactedIndices[1] = [];
    previousBooks = []; // Reset previous books on a full game reset
    if (gameArea) gameArea.innerHTML = '';
    if (resultArea) resultArea.textContent = '';
    if (roundInfo) roundInfo.textContent = '';
    if (bibliographicArea) bibliographicArea.innerHTML = '';
    if (typeof stopTimer === 'function') stopTimer();
    (0, _debugLog.debugLog)("Game reset in gameLogic.ts");
}
async function startRound(forceNewPassage = false) {
    if (!domElements) {
        console.error("DOM elements not initialized for gameLogic.startRound");
        return;
    }
    const { gameArea, roundInfo, submitBtn, hintBtn, resultArea, bibliographicArea } = domElements;
    hintsRemaining = 3;
    if (hintBtn) hintBtn.textContent = `Hint (${hintsRemaining})`;
    if (submitBtn) submitBtn.disabled = true;
    if (hintBtn) hintBtn.disabled = true;
    if (gameArea) gameArea.innerHTML = '<div class="text-center p-4"><p class="text-lg typewriter-text">Fetching new paragraphs from Gutenberg...</p><p class="text-sm mt-2 text-opacity-70">*click* *clack* *ding*</p></div>';
    if (resultArea) resultArea.textContent = '';
    hintedBlanks.clear();
    if (typeof stopTimer === 'function') stopTimer();
    if (bibliographicArea) bibliographicArea.innerHTML = '';
    const category = localStorage.getItem('game_category') || '';
    const author = localStorage.getItem('game_author') || '';
    const century = localStorage.getItem('game_century') || ''; // Fetch century as well
    let cacheKey = `passage_${category || 'any'}_${author || 'any'}_${century || 'any'}`; // Include century in cache key
    // If all search parameters are empty, it's a "random" request.
    // Add a random component to the cache key to ensure a fresh fetch for "truly random" initial passages,
    // unless forceNewPassage is explicitly false (which might be used for specific reloads of the *same* random passage).
    // However, startRound is usually called with forceNewPassage=true for the very first load via app.tsx.
    if (!category && !author && !century && forceNewPassage) {
        cacheKey = `passage_random_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        (0, _debugLog.debugLog)("Generated unique cache key for initial random passage:", {
            cacheKey
        });
    }
    const cachedPassage = paragraphCache.get(cacheKey);
    // For truly random initial fetches, we want to bypass cache even if forceNewPassage wasn't explicitly true,
    // but the logic above already makes the cacheKey unique, effectively bypassing it.
    if (!forceNewPassage && cachedPassage && !cacheKey.startsWith('passage_random_')) {
        (0, _debugLog.debugLog)("Serving passage from cache", {
            cacheKey
        });
        const parsedCache = JSON.parse(cachedPassage);
        if (parsedCache && parsedCache.paragraphs && Array.isArray(parsedCache.paragraphs)) {
            const passageData = {
                paragraphs: parsedCache.paragraphs,
                metadata: parsedCache.metadata || null
            };
            if (bibliographicArea && passageData.metadata) {
                // Add to previous books history if not already there
                const isAlreadyFetched = previousBooks.some((book)=>book.id === passageData.metadata.id);
                if (!isAlreadyFetched) {
                    previousBooks.unshift(passageData.metadata);
                    if (previousBooks.length > 5) previousBooks.pop();
                }
                let historyHtml = '';
                if (previousBooks.length > 1) {
                    historyHtml = '<p class="text-xs text-typewriter-ink opacity-60 mt-1">Previously fetched:</p><ul class="text-xs list-disc list-inside opacity-60">';
                    previousBooks.slice(1, 5).forEach((book)=>{
                        historyHtml += `<li><a href="https://www.gutenberg.org/ebooks/${book.id}" target="_blank" class="underline hover:text-typewriter-ribbon">${book.title} by ${book.author}</a></li>`;
                    });
                    historyHtml += '</ul>';
                }
                bibliographicArea.innerHTML = `
                <p class="text-sm text-typewriter-ink opacity-80 mb-1">
                    (Cached) Currently from: <em><a href="https://www.gutenberg.org/ebooks/${passageData.metadata.id}" target="_blank" class="underline hover:text-typewriter-ribbon">${passageData.metadata.title}</a></em> by ${passageData.metadata.author} (ID: ${passageData.metadata.id})
                </p>
                ${historyHtml}
            `;
                setTimeout(()=>{
                    if (typeof window !== 'undefined' && window.applyTypewriterEffect) {
                        const metaElements = bibliographicArea.querySelectorAll('p, em, a, li');
                        metaElements.forEach((el)=>window.applyTypewriterEffect(el));
                    }
                }, 100);
            }
            paragraphsWords[0] = passageData.paragraphs[0].split(/\s+/).filter((w)=>w.length > 0);
            paragraphsWords[1] = passageData.paragraphs.length > 1 ? passageData.paragraphs[1].split(/\s+/).filter((w)=>w.length > 0) : [];
            redactedIndices[0].length = 0;
            redactedIndices[1].length = 0;
            const totalWords = paragraphsWords[0].length + paragraphsWords[1].length;
            const maxPossibleBlanks = Math.floor(totalWords * 0.3);
            const actualBlanksCount = Math.min(blanksCount, maxPossibleBlanks);
            if (paragraphsWords[0].length > 0) {
                const firstParaBlanks = paragraphsWords[1].length > 0 ? Math.floor(actualBlanksCount * (paragraphsWords[0].length / totalWords)) : actualBlanksCount;
                const newRedactionsPara0 = chooseRedactions(paragraphsWords[0], firstParaBlanks);
                newRedactionsPara0.forEach((r)=>redactedIndices[0].push(r));
            }
            if (paragraphsWords[1].length > 0) {
                const secondParaBlanks = actualBlanksCount - redactedIndices[0].length;
                const newRedactionsPara1 = chooseRedactions(paragraphsWords[1], secondParaBlanks);
                newRedactionsPara1.forEach((r)=>redactedIndices[1].push(r));
            }
            if (redactedIndices[0].length + redactedIndices[1].length === 0) {
                if (gameArea) gameArea.innerHTML = '<div class="text-center p-4"><p class="text-lg text-red-500 typewriter-text">Could not generate enough blanks from cached passage. Try different criteria or refresh.</p></div>';
                if (submitBtn) submitBtn.disabled = true;
                if (hintBtn) hintBtn.disabled = true;
                if (typeof stopTimer === 'function') stopTimer();
                return null;
            }
            renderRound();
            return passageData;
        } else console.warn("Cached data for key", cacheKey, "is invalid. Fetching new.");
    } else {
        if (forceNewPassage) (0, _debugLog.debugLog)("Forcing new passage fetch, bypassing cache.", {
            cacheKey
        });
        else (0, _debugLog.debugLog)("Cache miss or invalid cache data. Fetching new passage.", {
            cacheKey
        });
        let fetchedPassageData = null;
        try {
            // Pass century to fetchGutenbergPassage and initialize attemptedBookIds
            fetchedPassageData = await (0, _main.fetchGutenbergPassage)(category, author, century, []);
            if (!fetchedPassageData || fetchedPassageData.paragraphs.length === 0) {
                if (gameArea) gameArea.innerHTML = '<div class="text-center p-4"><p class="text-lg text-red-500 typewriter-text">Could not load a suitable passage after multiple attempts. Please check your API key, network, or try different search criteria.</p></div>';
                if (submitBtn) submitBtn.disabled = true;
                if (hintBtn) hintBtn.disabled = true;
                if (typeof stopTimer === 'function') stopTimer();
                return;
            }
            try {
                paragraphCache.set(cacheKey, JSON.stringify(fetchedPassageData));
                (0, _debugLog.debugLog)("Passage stored in cache", {
                    cacheKey
                });
            } catch (e) {
                console.warn("Failed to store passage in cache:", e);
            }
            paragraphsWords[0] = fetchedPassageData.paragraphs[0].split(/\s+/).filter((w)=>w.length > 0);
            paragraphsWords[1] = fetchedPassageData.paragraphs.length > 1 ? fetchedPassageData.paragraphs[1].split(/\s+/).filter((w)=>w.length > 0) : [];
            // Check if fetchedPassageData and its metadata are not null
            if (bibliographicArea && fetchedPassageData && fetchedPassageData.metadata) {
                // Add to previous books history
                const isAlreadyFetched = previousBooks.some((book)=>book.id === fetchedPassageData.metadata.id); // Added non-null assertion as we've checked fetchedPassageData
                if (!isAlreadyFetched) {
                    previousBooks.unshift(fetchedPassageData.metadata);
                    if (previousBooks.length > 5) previousBooks.pop();
                }
                let historyHtml = '';
                if (previousBooks.length > 1) {
                    historyHtml = '<p class="text-xs text-typewriter-ink opacity-60 mt-1">Previously fetched:</p><ul class="text-xs list-disc list-inside opacity-60">';
                    previousBooks.slice(1, 5).forEach((book)=>{
                        historyHtml += `<li><a href="https://www.gutenberg.org/ebooks/${book.id}" target="_blank" class="underline hover:text-typewriter-ribbon">${book.title} by ${book.author}</a></li>`;
                    });
                    historyHtml += '</ul>';
                }
                bibliographicArea.innerHTML = `
            <p class="text-sm text-typewriter-ink opacity-80 mb-1">
                Currently from: <em><a href="https://www.gutenberg.org/ebooks/${fetchedPassageData.metadata.id}" target="_blank" class="underline hover:text-typewriter-ribbon">${fetchedPassageData.metadata.title}</a></em> by ${fetchedPassageData.metadata.author} (ID: ${fetchedPassageData.metadata.id})
            </p>
            ${historyHtml}
        `;
                setTimeout(()=>{
                    if (typeof window !== 'undefined' && window.applyTypewriterEffect) {
                        const metaElements = bibliographicArea.querySelectorAll('p, em, a, li');
                        metaElements.forEach((el)=>window.applyTypewriterEffect(el));
                    }
                }, 100);
            }
        } catch (error) {
            console.error("Error fetching passage:", error);
            if (gameArea) gameArea.innerHTML = '<div class="text-center p-4"><p class="text-lg text-red-500 typewriter-text">An error occurred while fetching content. Please check your API key and network connection.</p></div>';
            if (submitBtn) submitBtn.disabled = true;
            if (hintBtn) hintBtn.disabled = true;
            if (typeof stopTimer === 'function') stopTimer();
            return;
        }
        if (!fetchedPassageData) return;
        redactedIndices[0].length = 0;
        redactedIndices[1].length = 0;
        const totalWords = paragraphsWords[0].length + paragraphsWords[1].length;
        const maxPossibleBlanks = Math.floor(totalWords * 0.3);
        const actualBlanksCount = Math.min(blanksCount, maxPossibleBlanks);
        if (paragraphsWords[0].length > 0) {
            const firstParaBlanks = paragraphsWords[1].length > 0 ? Math.floor(actualBlanksCount * (paragraphsWords[0].length / totalWords)) : actualBlanksCount;
            const newRedactionsPara0 = chooseRedactions(paragraphsWords[0], firstParaBlanks);
            newRedactionsPara0.forEach((r)=>redactedIndices[0].push(r));
        }
        if (paragraphsWords[1].length > 0) {
            const secondParaBlanks = actualBlanksCount - redactedIndices[0].length;
            const newRedactionsPara1 = chooseRedactions(paragraphsWords[1], secondParaBlanks);
            newRedactionsPara1.forEach((r)=>redactedIndices[1].push(r));
        }
        if (redactedIndices[0].length + redactedIndices[1].length === 0) {
            if (gameArea) gameArea.innerHTML = '<div class="text-center p-4"><p class="text-lg text-red-500 typewriter-text">Could not generate enough blanks. Try different criteria or refresh.</p></div>';
            if (submitBtn) submitBtn.disabled = true;
            if (hintBtn) hintBtn.disabled = true;
            if (typeof stopTimer === 'function') stopTimer();
            return;
        }
        renderRound();
    }
}
async function handleSubmission(timedOut = false) {
    if (!domElements) {
        console.error("DOM elements not initialized for gameLogic.handleSubmission");
        return;
    }
    const { gameArea, submitBtn, hintBtn, resultArea } = domElements;
    if (typeof stopTimer === 'function') stopTimer();
    const submitSound = ()=>{
    // Optional: Add typewriter 'ding' sound effect here
    };
    submitSound();
    const inputs = Array.from(gameArea.querySelectorAll('input[type="text"]'));
    let correctCount = 0;
    let totalCount = 0;
    inputs.forEach((input)=>{
        totalCount++;
        const paragraphIdx = Number(input.dataset.paragraph || '0');
        const wordIdx = Number(input.dataset.index);
        const originalWord = paragraphsWords[paragraphIdx][wordIdx];
        const guessedWord = input.value.trim();
        const originalWordClean = originalWord.replace(/[^\w\s'-]/g, '').toLowerCase();
        const guessedWordClean = guessedWord.toLowerCase();
        const wordSpan = document.createElement('span');
        wordSpan.className = 'typewriter-text font-bold';
        if (guessedWordClean === originalWordClean) {
            correctCount++;
            wordSpan.textContent = originalWord + ' ';
            wordSpan.classList.add('text-green-700');
        } else {
            wordSpan.textContent = `${guessedWord} [${originalWord}] `;
            wordSpan.classList.add('text-red-700');
        }
        input.parentElement?.insertBefore(wordSpan, input);
        input.remove();
    });
    const neededToPass = Math.ceil(totalCount * 0.6);
    resultArea.classList.remove('text-green-700', 'text-red-700');
    if (timedOut) {
        resultArea.textContent = `Time's up! You got ${correctCount}/${totalCount} correct.`;
        resultArea.classList.add(correctCount >= neededToPass ? 'text-green-700' : 'text-red-700', 'text-shadow-typewriter');
    } else {
        resultArea.textContent = `${correctCount}/${totalCount} correct.`;
        resultArea.classList.add(correctCount >= neededToPass ? 'text-green-700' : 'text-red-700', 'text-shadow-typewriter');
    }
    if (correctCount >= neededToPass) {
        round++;
        blanksCount++;
        if (resultArea) resultArea.textContent += ` Starting Round ${round} with ${blanksCount} blanks in 8 seconds...`;
    } else if (resultArea) resultArea.textContent += ` Getting a new passage in 8 seconds...`;
    if (submitBtn) submitBtn.disabled = true;
    if (hintBtn) hintBtn.disabled = true;
    if (correctCount >= neededToPass) setTimeout(()=>startRound(false), 8000);
    else setTimeout(()=>startRound(true), 8000);
}

},{"@/utils/debugLog":"48AmR","@/main":"gNc1f","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}]},["6bz8l","gNc1f"], "gNc1f", "parcelRequired201", {})

//# sourceMappingURL=inference.0f289648.js.map
