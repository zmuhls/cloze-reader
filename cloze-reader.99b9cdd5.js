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
})({"jLiUF":[function(require,module,exports,__globalThis) {
var global = arguments[3];
var HMR_HOST = null;
var HMR_PORT = null;
var HMR_SERVER_PORT = 61864;
var HMR_SECURE = false;
var HMR_ENV_HASH = "439701173a9199ea";
var HMR_USE_SSE = false;
module.bundle.HMR_BUNDLE_ID = "5dc6182799b9cdd5";
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

},{}],"9T1gr":[function(require,module,exports,__globalThis) {
var _jsxRuntime = require("preact/jsx-runtime");
var _preact = require("preact");
var _hooks = require("preact/hooks");
var _settingsFooter = require("./components/settings/SettingsFooter");
var _welcomeOverlay = require("./components/welcome/WelcomeOverlay");
var _apiConfiguration = require("./components/settings/ApiConfiguration");
var _queryOptions = require("./components/settings/QueryOptions");
var _gameLogic = require("./services/gameLogic");
console.log("APP.TSX: Script loading");
// Determine if this is a remote interface (GitHub Pages)
const isRemoteInterface = window.location.hostname.includes('github.io');
// Function to start the game round 
const startGameRound = (forceNewPassage = true)=>{
    console.log("APP.TSX: startGameRound called", {
        forceNewPassage
    });
    // Show loading state in the game area
    const gameArea = document.getElementById('game-area');
    if (gameArea) gameArea.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8 text-center" aria-live="polite">
        <p class="text-lg typewriter-text mb-3">Fetching new passage...</p>
        <p class="text-sm opacity-70 mb-4">*click* *clack* *ding*</p>
        <div role="status" aria-label="Loading passage" class="relative h-2 w-48 bg-aged-paper-dark overflow-hidden rounded-full">
          <div class="absolute top-0 left-0 h-full bg-typewriter-ribbon animate-pulse rounded-full" style="width: 30%"></div>
        </div>
      </div>
    `;
    // Call startRound from gameLogic.ts
    try {
        if (typeof window !== 'undefined' && typeof window.startRound === 'function') window.startRound(forceNewPassage);
        else (0, _gameLogic.startRound)(forceNewPassage);
        console.log("APP.TSX: startRound call completed successfully");
    } catch (error) {
        console.error("APP.TSX: Error in startRound:", error);
        // Show error state in the game area
        if (gameArea) gameArea.innerHTML = `
        <div class="text-center p-6" aria-live="assertive">
          <p class="text-lg typewriter-text text-red-600 mb-2">Oops! We couldn't fetch a passage.</p>
          <p class="typewriter-text mb-4">Please try again later or check your connection.</p>
          <button 
            id="retry-btn" 
            class="px-4 py-2 bg-typewriter-ink text-aged-paper rounded hover:bg-opacity-80 focus:ring-2 focus:ring-typewriter-ribbon focus:outline-none"
            onclick="window.startRound(true)"
          >
            Try Again
          </button>
        </div>
      `;
    }
};
// Main application component
const App = ()=>{
    // Start with welcome hidden in remote interface for better UX flow
    const [showWelcome, setShowWelcome] = (0, _hooks.useState)(!isRemoteInterface);
    const [isFirstLoad, setIsFirstLoad] = (0, _hooks.useState)(true);
    // Auto-start with fetching a passage in remote interfaces
    (0, _hooks.useEffect)(()=>{
        if (isRemoteInterface && isFirstLoad) {
            setIsFirstLoad(false);
            // Small delay to ensure DOM is ready
            setTimeout(()=>{
                startGameRound(true);
            }, 100);
        }
    }, [
        isRemoteInterface,
        isFirstLoad
    ]);
    // Listen to settings changes
    (0, _hooks.useEffect)(()=>{
        const handleSettingsChange = ()=>{
            // Log settings changes
            console.log("Settings changed:", {
                apiKey: (0, _apiConfiguration.apiKeySignal).value ? "Key set" : "No key",
                category: (0, _queryOptions.categorySignal).value,
                author: (0, _queryOptions.authorSignal).value,
                century: (0, _queryOptions.centurySignal).value
            });
        };
        // Set up listeners for signals
        const unsubscribeApiKey = (0, _apiConfiguration.apiKeySignal).subscribe(handleSettingsChange);
        const unsubscribeCategory = (0, _queryOptions.categorySignal).subscribe(handleSettingsChange);
        const unsubscribeAuthor = (0, _queryOptions.authorSignal).subscribe(handleSettingsChange);
        const unsubscribeCentury = (0, _queryOptions.centurySignal).subscribe(handleSettingsChange);
        return ()=>{
            unsubscribeApiKey();
            unsubscribeCategory();
            unsubscribeAuthor();
            unsubscribeCentury();
        };
    }, []);
    const handleWelcomeStart = ()=>{
        setShowWelcome(false);
        startGameRound(true);
    };
    return (0, _jsxRuntime.jsx)((0, _jsxRuntime.Fragment), {
        children: showWelcome && (0, _jsxRuntime.jsx)((0, _welcomeOverlay.WelcomeOverlay), {
            onStart: handleWelcomeStart
        })
    });
};
// Render the App component
(0, _preact.render)((0, _jsxRuntime.jsx)(App, {}), document.getElementById('app') || document.body);
// Render the SettingsFooter component
const settingsFooterContainer = document.getElementById('settings-footer-container');
if (settingsFooterContainer) (0, _preact.render)((0, _jsxRuntime.jsx)((0, _settingsFooter.SettingsFooter), {
    isRemoteInterface: isRemoteInterface
}), settingsFooterContainer);
else console.error('Settings footer container not found!');

},{"preact/jsx-runtime":"jBtcg","preact":"agj7k","preact/hooks":"83L4j","./components/settings/SettingsFooter":"44q1z","./components/settings/ApiConfiguration":"iI8MK","./components/welcome/WelcomeOverlay":"dsv6M","./services/gameLogic":"6WZYg","./components/settings/QueryOptions":"a1Bg6"}],"jBtcg":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Fragment", ()=>(0, _preact.Fragment));
parcelHelpers.export(exports, "jsx", ()=>u);
parcelHelpers.export(exports, "jsxAttr", ()=>l);
parcelHelpers.export(exports, "jsxDEV", ()=>u);
parcelHelpers.export(exports, "jsxEscape", ()=>s);
parcelHelpers.export(exports, "jsxTemplate", ()=>a);
parcelHelpers.export(exports, "jsxs", ()=>u);
var _preact = require("preact");
var t = /["&<]/;
function n(r) {
    if (0 === r.length || !1 === t.test(r)) return r;
    for(var e = 0, n = 0, o = "", f = ""; n < r.length; n++){
        switch(r.charCodeAt(n)){
            case 34:
                f = "&quot;";
                break;
            case 38:
                f = "&amp;";
                break;
            case 60:
                f = "&lt;";
                break;
            default:
                continue;
        }
        n !== e && (o += r.slice(e, n)), o += f, e = n + 1;
    }
    return n !== e && (o += r.slice(e, n)), o;
}
var o = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, f = 0, i = Array.isArray;
function u(e, t, n, o, i, u) {
    t || (t = {});
    var a, c, p = t;
    if ("ref" in p) for(c in p = {}, t)"ref" == c ? a = t[c] : p[c] = t[c];
    var l = {
        type: e,
        props: p,
        key: n,
        ref: a,
        __k: null,
        __: null,
        __b: 0,
        __e: null,
        __c: null,
        constructor: void 0,
        __v: --f,
        __i: -1,
        __u: 0,
        __source: i,
        __self: u
    };
    if ("function" == typeof e && (a = e.defaultProps)) for(c in a)void 0 === p[c] && (p[c] = a[c]);
    return (0, _preact.options).vnode && (0, _preact.options).vnode(l), l;
}
function a(r) {
    var t = u((0, _preact.Fragment), {
        tpl: r,
        exprs: [].slice.call(arguments, 1)
    });
    return t.key = t.__v, t;
}
var c = {}, p = /[A-Z]/g;
function l(e, t) {
    if ((0, _preact.options).attr) {
        var f = (0, _preact.options).attr(e, t);
        if ("string" == typeof f) return f;
    }
    if ("ref" === e || "key" === e) return "";
    if ("style" === e && "object" == typeof t) {
        var i = "";
        for(var u in t){
            var a = t[u];
            if (null != a && "" !== a) {
                var l = "-" == u[0] ? u : c[u] || (c[u] = u.replace(p, "-$&").toLowerCase()), s = ";";
                "number" != typeof a || l.startsWith("--") || o.test(l) || (s = "px;"), i = i + l + ":" + a + s;
            }
        }
        return e + '="' + i + '"';
    }
    return null == t || !1 === t || "function" == typeof t || "object" == typeof t ? "" : !0 === t ? e : e + '="' + n(t) + '"';
}
function s(r) {
    if (null == r || "boolean" == typeof r || "function" == typeof r) return null;
    if ("object" == typeof r) {
        if (void 0 === r.constructor) return r;
        if (i(r)) {
            for(var e = 0; e < r.length; e++)r[e] = s(r[e]);
            return r;
        }
    }
    return n("" + r);
}

},{"preact":"agj7k","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"agj7k":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Component", ()=>x);
parcelHelpers.export(exports, "Fragment", ()=>k);
parcelHelpers.export(exports, "cloneElement", ()=>J);
parcelHelpers.export(exports, "createContext", ()=>K);
parcelHelpers.export(exports, "createElement", ()=>_);
parcelHelpers.export(exports, "createRef", ()=>b);
parcelHelpers.export(exports, "h", ()=>_);
parcelHelpers.export(exports, "hydrate", ()=>G);
parcelHelpers.export(exports, "isValidElement", ()=>t);
parcelHelpers.export(exports, "options", ()=>l);
parcelHelpers.export(exports, "render", ()=>E);
parcelHelpers.export(exports, "toChildArray", ()=>H);
var n, l, u, t, i, r, o, e, f, c, s, a, h, p = {}, y = [], v = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, w = Array.isArray;
function d(n, l) {
    for(var u in l)n[u] = l[u];
    return n;
}
function g(n) {
    n && n.parentNode && n.parentNode.removeChild(n);
}
function _(l, u, t) {
    var i, r, o, e = {};
    for(o in u)"key" == o ? i = u[o] : "ref" == o ? r = u[o] : e[o] = u[o];
    if (arguments.length > 2 && (e.children = arguments.length > 3 ? n.call(arguments, 2) : t), "function" == typeof l && null != l.defaultProps) for(o in l.defaultProps)null == e[o] && (e[o] = l.defaultProps[o]);
    return m(l, e, i, r, null);
}
function m(n, t, i, r, o) {
    var e = {
        type: n,
        props: t,
        key: i,
        ref: r,
        __k: null,
        __: null,
        __b: 0,
        __e: null,
        __c: null,
        constructor: void 0,
        __v: null == o ? ++u : o,
        __i: -1,
        __u: 0
    };
    return null == o && null != l.vnode && l.vnode(e), e;
}
function b() {
    return {
        current: null
    };
}
function k(n) {
    return n.children;
}
function x(n, l) {
    this.props = n, this.context = l;
}
function S(n, l) {
    if (null == l) return n.__ ? S(n.__, n.__i + 1) : null;
    for(var u; l < n.__k.length; l++)if (null != (u = n.__k[l]) && null != u.__e) return u.__e;
    return "function" == typeof n.type ? S(n) : null;
}
function C(n) {
    var l, u;
    if (null != (n = n.__) && null != n.__c) {
        for(n.__e = n.__c.base = null, l = 0; l < n.__k.length; l++)if (null != (u = n.__k[l]) && null != u.__e) {
            n.__e = n.__c.base = u.__e;
            break;
        }
        return C(n);
    }
}
function M(n) {
    (!n.__d && (n.__d = !0) && i.push(n) && !$.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)($);
}
function $() {
    for(var n, u, t, r, o, f, c, s = 1; i.length;)i.length > s && i.sort(e), n = i.shift(), s = i.length, n.__d && (t = void 0, o = (r = (u = n).__v).__e, f = [], c = [], u.__P && ((t = d({}, r)).__v = r.__v + 1, l.vnode && l.vnode(t), O(u.__P, t, r, u.__n, u.__P.namespaceURI, 32 & r.__u ? [
        o
    ] : null, f, null == o ? S(r) : o, !!(32 & r.__u), c), t.__v = r.__v, t.__.__k[t.__i] = t, z(f, t, c), t.__e != o && C(t)));
    $.__r = 0;
}
function I(n, l, u, t, i, r, o, e, f, c, s) {
    var a, h, v, w, d, g, _ = t && t.__k || y, m = l.length;
    for(f = P(u, l, _, f, m), a = 0; a < m; a++)null != (v = u.__k[a]) && (h = -1 == v.__i ? p : _[v.__i] || p, v.__i = a, g = O(n, v, h, i, r, o, e, f, c, s), w = v.__e, v.ref && h.ref != v.ref && (h.ref && q(h.ref, null, v), s.push(v.ref, v.__c || w, v)), null == d && null != w && (d = w), 4 & v.__u || h.__k === v.__k ? f = A(v, f, n) : "function" == typeof v.type && void 0 !== g ? f = g : w && (f = w.nextSibling), v.__u &= -7);
    return u.__e = d, f;
}
function P(n, l, u, t, i) {
    var r, o, e, f, c, s = u.length, a = s, h = 0;
    for(n.__k = new Array(i), r = 0; r < i; r++)null != (o = l[r]) && "boolean" != typeof o && "function" != typeof o ? (f = r + h, (o = n.__k[r] = "string" == typeof o || "number" == typeof o || "bigint" == typeof o || o.constructor == String ? m(null, o, null, null, null) : w(o) ? m(k, {
        children: o
    }, null, null, null) : null == o.constructor && o.__b > 0 ? m(o.type, o.props, o.key, o.ref ? o.ref : null, o.__v) : o).__ = n, o.__b = n.__b + 1, e = null, -1 != (c = o.__i = L(o, u, f, a)) && (a--, (e = u[c]) && (e.__u |= 2)), null == e || null == e.__v ? (-1 == c && (i > s ? h-- : i < s && h++), "function" != typeof o.type && (o.__u |= 4)) : c != f && (c == f - 1 ? h-- : c == f + 1 ? h++ : (c > f ? h-- : h++, o.__u |= 4))) : n.__k[r] = null;
    if (a) for(r = 0; r < s; r++)null != (e = u[r]) && 0 == (2 & e.__u) && (e.__e == t && (t = S(e)), B(e, e));
    return t;
}
function A(n, l, u) {
    var t, i;
    if ("function" == typeof n.type) {
        for(t = n.__k, i = 0; t && i < t.length; i++)t[i] && (t[i].__ = n, l = A(t[i], l, u));
        return l;
    }
    n.__e != l && (l && n.type && !u.contains(l) && (l = S(n)), u.insertBefore(n.__e, l || null), l = n.__e);
    do l = l && l.nextSibling;
    while (null != l && 8 == l.nodeType);
    return l;
}
function H(n, l) {
    return l = l || [], null == n || "boolean" == typeof n || (w(n) ? n.some(function(n) {
        H(n, l);
    }) : l.push(n)), l;
}
function L(n, l, u, t) {
    var i, r, o = n.key, e = n.type, f = l[u];
    if (null === f && null == n.key || f && o == f.key && e == f.type && 0 == (2 & f.__u)) return u;
    if (t > (null != f && 0 == (2 & f.__u) ? 1 : 0)) for(i = u - 1, r = u + 1; i >= 0 || r < l.length;){
        if (i >= 0) {
            if ((f = l[i]) && 0 == (2 & f.__u) && o == f.key && e == f.type) return i;
            i--;
        }
        if (r < l.length) {
            if ((f = l[r]) && 0 == (2 & f.__u) && o == f.key && e == f.type) return r;
            r++;
        }
    }
    return -1;
}
function T(n, l, u) {
    "-" == l[0] ? n.setProperty(l, null == u ? "" : u) : n[l] = null == u ? "" : "number" != typeof u || v.test(l) ? u : u + "px";
}
function j(n, l, u, t, i) {
    var r;
    n: if ("style" == l) {
        if ("string" == typeof u) n.style.cssText = u;
        else {
            if ("string" == typeof t && (n.style.cssText = t = ""), t) for(l in t)u && l in u || T(n.style, l, "");
            if (u) for(l in u)t && u[l] == t[l] || T(n.style, l, u[l]);
        }
    } else if ("o" == l[0] && "n" == l[1]) r = l != (l = l.replace(f, "$1")), l = l.toLowerCase() in n || "onFocusOut" == l || "onFocusIn" == l ? l.toLowerCase().slice(2) : l.slice(2), n.l || (n.l = {}), n.l[l + r] = u, u ? t ? u.u = t.u : (u.u = c, n.addEventListener(l, r ? a : s, r)) : n.removeEventListener(l, r ? a : s, r);
    else {
        if ("http://www.w3.org/2000/svg" == i) l = l.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
        else if ("width" != l && "height" != l && "href" != l && "list" != l && "form" != l && "tabIndex" != l && "download" != l && "rowSpan" != l && "colSpan" != l && "role" != l && "popover" != l && l in n) try {
            n[l] = null == u ? "" : u;
            break n;
        } catch (n) {}
        "function" == typeof u || (null == u || !1 === u && "-" != l[4] ? n.removeAttribute(l) : n.setAttribute(l, "popover" == l && 1 == u ? "" : u));
    }
}
function F(n) {
    return function(u) {
        if (this.l) {
            var t = this.l[u.type + n];
            if (null == u.t) u.t = c++;
            else if (u.t < t.u) return;
            return t(l.event ? l.event(u) : u);
        }
    };
}
function O(n, u, t, i, r, o, e, f, c, s) {
    var a, h, p, y, v, _, m, b, S, C, M, $, P, A, H, L, T, j = u.type;
    if (null != u.constructor) return null;
    128 & t.__u && (c = !!(32 & t.__u), o = [
        f = u.__e = t.__e
    ]), (a = l.__b) && a(u);
    n: if ("function" == typeof j) try {
        if (b = u.props, S = "prototype" in j && j.prototype.render, C = (a = j.contextType) && i[a.__c], M = a ? C ? C.props.value : a.__ : i, t.__c ? m = (h = u.__c = t.__c).__ = h.__E : (S ? u.__c = h = new j(b, M) : (u.__c = h = new x(b, M), h.constructor = j, h.render = D), C && C.sub(h), h.props = b, h.state || (h.state = {}), h.context = M, h.__n = i, p = h.__d = !0, h.__h = [], h._sb = []), S && null == h.__s && (h.__s = h.state), S && null != j.getDerivedStateFromProps && (h.__s == h.state && (h.__s = d({}, h.__s)), d(h.__s, j.getDerivedStateFromProps(b, h.__s))), y = h.props, v = h.state, h.__v = u, p) S && null == j.getDerivedStateFromProps && null != h.componentWillMount && h.componentWillMount(), S && null != h.componentDidMount && h.__h.push(h.componentDidMount);
        else {
            if (S && null == j.getDerivedStateFromProps && b !== y && null != h.componentWillReceiveProps && h.componentWillReceiveProps(b, M), !h.__e && null != h.shouldComponentUpdate && !1 === h.shouldComponentUpdate(b, h.__s, M) || u.__v == t.__v) {
                for(u.__v != t.__v && (h.props = b, h.state = h.__s, h.__d = !1), u.__e = t.__e, u.__k = t.__k, u.__k.some(function(n) {
                    n && (n.__ = u);
                }), $ = 0; $ < h._sb.length; $++)h.__h.push(h._sb[$]);
                h._sb = [], h.__h.length && e.push(h);
                break n;
            }
            null != h.componentWillUpdate && h.componentWillUpdate(b, h.__s, M), S && null != h.componentDidUpdate && h.__h.push(function() {
                h.componentDidUpdate(y, v, _);
            });
        }
        if (h.context = M, h.props = b, h.__P = n, h.__e = !1, P = l.__r, A = 0, S) {
            for(h.state = h.__s, h.__d = !1, P && P(u), a = h.render(h.props, h.state, h.context), H = 0; H < h._sb.length; H++)h.__h.push(h._sb[H]);
            h._sb = [];
        } else do h.__d = !1, P && P(u), a = h.render(h.props, h.state, h.context), h.state = h.__s;
        while (h.__d && ++A < 25);
        h.state = h.__s, null != h.getChildContext && (i = d(d({}, i), h.getChildContext())), S && !p && null != h.getSnapshotBeforeUpdate && (_ = h.getSnapshotBeforeUpdate(y, v)), L = a, null != a && a.type === k && null == a.key && (L = N(a.props.children)), f = I(n, w(L) ? L : [
            L
        ], u, t, i, r, o, e, f, c, s), h.base = u.__e, u.__u &= -161, h.__h.length && e.push(h), m && (h.__E = h.__ = null);
    } catch (n) {
        if (u.__v = null, c || null != o) {
            if (n.then) {
                for(u.__u |= c ? 160 : 128; f && 8 == f.nodeType && f.nextSibling;)f = f.nextSibling;
                o[o.indexOf(f)] = null, u.__e = f;
            } else for(T = o.length; T--;)g(o[T]);
        } else u.__e = t.__e, u.__k = t.__k;
        l.__e(n, u, t);
    }
    else null == o && u.__v == t.__v ? (u.__k = t.__k, u.__e = t.__e) : f = u.__e = V(t.__e, u, t, i, r, o, e, c, s);
    return (a = l.diffed) && a(u), 128 & u.__u ? void 0 : f;
}
function z(n, u, t) {
    for(var i = 0; i < t.length; i++)q(t[i], t[++i], t[++i]);
    l.__c && l.__c(u, n), n.some(function(u) {
        try {
            n = u.__h, u.__h = [], n.some(function(n) {
                n.call(u);
            });
        } catch (n) {
            l.__e(n, u.__v);
        }
    });
}
function N(n) {
    return "object" != typeof n || null == n || n.__b && n.__b > 0 ? n : w(n) ? n.map(N) : d({}, n);
}
function V(u, t, i, r, o, e, f, c, s) {
    var a, h, y, v, d, _, m, b = i.props, k = t.props, x = t.type;
    if ("svg" == x ? o = "http://www.w3.org/2000/svg" : "math" == x ? o = "http://www.w3.org/1998/Math/MathML" : o || (o = "http://www.w3.org/1999/xhtml"), null != e) {
        for(a = 0; a < e.length; a++)if ((d = e[a]) && "setAttribute" in d == !!x && (x ? d.localName == x : 3 == d.nodeType)) {
            u = d, e[a] = null;
            break;
        }
    }
    if (null == u) {
        if (null == x) return document.createTextNode(k);
        u = document.createElementNS(o, x, k.is && k), c && (l.__m && l.__m(t, e), c = !1), e = null;
    }
    if (null == x) b === k || c && u.data == k || (u.data = k);
    else {
        if (e = e && n.call(u.childNodes), b = i.props || p, !c && null != e) for(b = {}, a = 0; a < u.attributes.length; a++)b[(d = u.attributes[a]).name] = d.value;
        for(a in b)if (d = b[a], "children" == a) ;
        else if ("dangerouslySetInnerHTML" == a) y = d;
        else if (!(a in k)) {
            if ("value" == a && "defaultValue" in k || "checked" == a && "defaultChecked" in k) continue;
            j(u, a, null, d, o);
        }
        for(a in k)d = k[a], "children" == a ? v = d : "dangerouslySetInnerHTML" == a ? h = d : "value" == a ? _ = d : "checked" == a ? m = d : c && "function" != typeof d || b[a] === d || j(u, a, d, b[a], o);
        if (h) c || y && (h.__html == y.__html || h.__html == u.innerHTML) || (u.innerHTML = h.__html), t.__k = [];
        else if (y && (u.innerHTML = ""), I("template" == t.type ? u.content : u, w(v) ? v : [
            v
        ], t, i, r, "foreignObject" == x ? "http://www.w3.org/1999/xhtml" : o, e, f, e ? e[0] : i.__k && S(i, 0), c, s), null != e) for(a = e.length; a--;)g(e[a]);
        c || (a = "value", "progress" == x && null == _ ? u.removeAttribute("value") : null != _ && (_ !== u[a] || "progress" == x && !_ || "option" == x && _ != b[a]) && j(u, a, _, b[a], o), a = "checked", null != m && m != u[a] && j(u, a, m, b[a], o));
    }
    return u;
}
function q(n, u, t) {
    try {
        if ("function" == typeof n) {
            var i = "function" == typeof n.__u;
            i && n.__u(), i && null == u || (n.__u = n(u));
        } else n.current = u;
    } catch (n) {
        l.__e(n, t);
    }
}
function B(n, u, t) {
    var i, r;
    if (l.unmount && l.unmount(n), (i = n.ref) && (i.current && i.current != n.__e || q(i, null, u)), null != (i = n.__c)) {
        if (i.componentWillUnmount) try {
            i.componentWillUnmount();
        } catch (n) {
            l.__e(n, u);
        }
        i.base = i.__P = null;
    }
    if (i = n.__k) for(r = 0; r < i.length; r++)i[r] && B(i[r], u, t || "function" != typeof n.type);
    t || g(n.__e), n.__c = n.__ = n.__e = void 0;
}
function D(n, l, u) {
    return this.constructor(n, u);
}
function E(u, t, i) {
    var r, o, e, f;
    t == document && (t = document.documentElement), l.__ && l.__(u, t), o = (r = "function" == typeof i) ? null : i && i.__k || t.__k, e = [], f = [], O(t, u = (!r && i || t).__k = _(k, null, [
        u
    ]), o || p, p, t.namespaceURI, !r && i ? [
        i
    ] : o ? null : t.firstChild ? n.call(t.childNodes) : null, e, !r && i ? i : o ? o.__e : t.firstChild, r, f), z(e, u, f);
}
function G(n, l) {
    E(n, l, G);
}
function J(l, u, t) {
    var i, r, o, e, f = d({}, l.props);
    for(o in l.type && l.type.defaultProps && (e = l.type.defaultProps), u)"key" == o ? i = u[o] : "ref" == o ? r = u[o] : f[o] = null == u[o] && null != e ? e[o] : u[o];
    return arguments.length > 2 && (f.children = arguments.length > 3 ? n.call(arguments, 2) : t), m(l.type, f, i || l.key, r || l.ref, null);
}
function K(n) {
    function l(n) {
        var u, t;
        return this.getChildContext || (u = new Set, (t = {})[l.__c] = this, this.getChildContext = function() {
            return t;
        }, this.componentWillUnmount = function() {
            u = null;
        }, this.shouldComponentUpdate = function(n) {
            this.props.value != n.value && u.forEach(function(n) {
                n.__e = !0, M(n);
            });
        }, this.sub = function(n) {
            u.add(n);
            var l = n.componentWillUnmount;
            n.componentWillUnmount = function() {
                u && u.delete(n), l && l.call(n);
            };
        }), n.children;
    }
    return l.__c = "__cC" + h++, l.__ = n, l.Provider = l.__l = (l.Consumer = function(n, l) {
        return n.children(l);
    }).contextType = l, l;
}
n = y.slice, l = {
    __e: function(n, l, u, t) {
        for(var i, r, o; l = l.__;)if ((i = l.__c) && !i.__) try {
            if ((r = i.constructor) && null != r.getDerivedStateFromError && (i.setState(r.getDerivedStateFromError(n)), o = i.__d), null != i.componentDidCatch && (i.componentDidCatch(n, t || {}), o = i.__d), o) return i.__E = i;
        } catch (l) {
            n = l;
        }
        throw n;
    }
}, u = 0, t = function(n) {
    return null != n && null == n.constructor;
}, x.prototype.setState = function(n, l) {
    var u;
    u = null != this.__s && this.__s != this.state ? this.__s : this.__s = d({}, this.state), "function" == typeof n && (n = n(d({}, u), this.props)), n && d(u, n), null != n && this.__v && (l && this._sb.push(l), M(this));
}, x.prototype.forceUpdate = function(n) {
    this.__v && (this.__e = !0, n && this.__h.push(n), M(this));
}, x.prototype.render = k, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n, l) {
    return n.__v.__b - l.__v.__b;
}, $.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = F(!1), a = F(!0), h = 0;

},{"@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"83L4j":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "useCallback", ()=>q);
parcelHelpers.export(exports, "useContext", ()=>x);
parcelHelpers.export(exports, "useDebugValue", ()=>P);
parcelHelpers.export(exports, "useEffect", ()=>y);
parcelHelpers.export(exports, "useErrorBoundary", ()=>b);
parcelHelpers.export(exports, "useId", ()=>g);
parcelHelpers.export(exports, "useImperativeHandle", ()=>F);
parcelHelpers.export(exports, "useLayoutEffect", ()=>_);
parcelHelpers.export(exports, "useMemo", ()=>T);
parcelHelpers.export(exports, "useReducer", ()=>h);
parcelHelpers.export(exports, "useRef", ()=>A);
parcelHelpers.export(exports, "useState", ()=>d);
var _preact = require("preact");
var t, r, u, i, o = 0, f = [], c = (0, _preact.options), e = c.__b, a = c.__r, v = c.diffed, l = c.__c, m = c.unmount, s = c.__;
function p(n, t) {
    c.__h && c.__h(r, n, o || t), o = 0;
    var u = r.__H || (r.__H = {
        __: [],
        __h: []
    });
    return n >= u.__.length && u.__.push({}), u.__[n];
}
function d(n) {
    return o = 1, h(D, n);
}
function h(n, u, i) {
    var o = p(t++, 2);
    if (o.t = n, !o.__c && (o.__ = [
        i ? i(u) : D(void 0, u),
        function(n) {
            var t = o.__N ? o.__N[0] : o.__[0], r = o.t(t, n);
            t !== r && (o.__N = [
                r,
                o.__[1]
            ], o.__c.setState({}));
        }
    ], o.__c = r, !r.__f)) {
        var f = function(n, t, r) {
            if (!o.__c.__H) return !0;
            var u = o.__c.__H.__.filter(function(n) {
                return !!n.__c;
            });
            if (u.every(function(n) {
                return !n.__N;
            })) return !c || c.call(this, n, t, r);
            var i = o.__c.props !== n;
            return u.forEach(function(n) {
                if (n.__N) {
                    var t = n.__[0];
                    n.__ = n.__N, n.__N = void 0, t !== n.__[0] && (i = !0);
                }
            }), c && c.call(this, n, t, r) || i;
        };
        r.__f = !0;
        var c = r.shouldComponentUpdate, e = r.componentWillUpdate;
        r.componentWillUpdate = function(n, t, r) {
            if (this.__e) {
                var u = c;
                c = void 0, f(n, t, r), c = u;
            }
            e && e.call(this, n, t, r);
        }, r.shouldComponentUpdate = f;
    }
    return o.__N || o.__;
}
function y(n, u) {
    var i = p(t++, 3);
    !c.__s && C(i.__H, u) && (i.__ = n, i.u = u, r.__H.__h.push(i));
}
function _(n, u) {
    var i = p(t++, 4);
    !c.__s && C(i.__H, u) && (i.__ = n, i.u = u, r.__h.push(i));
}
function A(n) {
    return o = 5, T(function() {
        return {
            current: n
        };
    }, []);
}
function F(n, t, r) {
    o = 6, _(function() {
        if ("function" == typeof n) {
            var r = n(t());
            return function() {
                n(null), r && "function" == typeof r && r();
            };
        }
        if (n) return n.current = t(), function() {
            return n.current = null;
        };
    }, null == r ? r : r.concat(n));
}
function T(n, r) {
    var u = p(t++, 7);
    return C(u.__H, r) && (u.__ = n(), u.__H = r, u.__h = n), u.__;
}
function q(n, t) {
    return o = 8, T(function() {
        return n;
    }, t);
}
function x(n) {
    var u = r.context[n.__c], i = p(t++, 9);
    return i.c = n, u ? (null == i.__ && (i.__ = !0, u.sub(r)), u.props.value) : n.__;
}
function P(n, t) {
    c.useDebugValue && c.useDebugValue(t ? t(n) : n);
}
function b(n) {
    var u = p(t++, 10), i = d();
    return u.__ = n, r.componentDidCatch || (r.componentDidCatch = function(n, t) {
        u.__ && u.__(n, t), i[1](n);
    }), [
        i[0],
        function() {
            i[1](void 0);
        }
    ];
}
function g() {
    var n = p(t++, 11);
    if (!n.__) {
        for(var u = r.__v; null !== u && !u.__m && null !== u.__;)u = u.__;
        var i = u.__m || (u.__m = [
            0,
            0
        ]);
        n.__ = "P" + i[0] + "-" + i[1]++;
    }
    return n.__;
}
function j() {
    for(var n; n = f.shift();)if (n.__P && n.__H) try {
        n.__H.__h.forEach(z), n.__H.__h.forEach(B), n.__H.__h = [];
    } catch (t) {
        n.__H.__h = [], c.__e(t, n.__v);
    }
}
c.__b = function(n) {
    r = null, e && e(n);
}, c.__ = function(n, t) {
    n && t.__k && t.__k.__m && (n.__m = t.__k.__m), s && s(n, t);
}, c.__r = function(n) {
    a && a(n), t = 0;
    var i = (r = n.__c).__H;
    i && (u === r ? (i.__h = [], r.__h = [], i.__.forEach(function(n) {
        n.__N && (n.__ = n.__N), n.u = n.__N = void 0;
    })) : (i.__h.forEach(z), i.__h.forEach(B), i.__h = [], t = 0)), u = r;
}, c.diffed = function(n) {
    v && v(n);
    var t = n.__c;
    t && t.__H && (t.__H.__h.length && (1 !== f.push(t) && i === c.requestAnimationFrame || ((i = c.requestAnimationFrame) || w)(j)), t.__H.__.forEach(function(n) {
        n.u && (n.__H = n.u), n.u = void 0;
    })), u = r = null;
}, c.__c = function(n, t) {
    t.some(function(n) {
        try {
            n.__h.forEach(z), n.__h = n.__h.filter(function(n) {
                return !n.__ || B(n);
            });
        } catch (r) {
            t.some(function(n) {
                n.__h && (n.__h = []);
            }), t = [], c.__e(r, n.__v);
        }
    }), l && l(n, t);
}, c.unmount = function(n) {
    m && m(n);
    var t, r = n.__c;
    r && r.__H && (r.__H.__.forEach(function(n) {
        try {
            z(n);
        } catch (n) {
            t = n;
        }
    }), r.__H = void 0, t && c.__e(t, r.__v));
};
var k = "function" == typeof requestAnimationFrame;
function w(n) {
    var t, r = function() {
        clearTimeout(u), k && cancelAnimationFrame(t), setTimeout(n);
    }, u = setTimeout(r, 100);
    k && (t = requestAnimationFrame(r));
}
function z(n) {
    var t = r, u = n.__c;
    "function" == typeof u && (n.__c = void 0, u()), r = t;
}
function B(n) {
    var t = r;
    n.__c = n.__(), r = t;
}
function C(n, t) {
    return !n || n.length !== t.length || t.some(function(t, r) {
        return t !== n[r];
    });
}
function D(n, t) {
    return "function" == typeof t ? t(n) : t;
}

},{"preact":"agj7k","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"44q1z":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "SettingsFooter", ()=>SettingsFooter);
var _jsxRuntime = require("preact/jsx-runtime");
var _hooks = require("preact/hooks");
var _queryOptions = require("./QueryOptions");
const SettingsFooter = ({ isRemoteInterface = window.location.hostname.includes('github.io') })=>{
    const [isExpanded, setIsExpanded] = (0, _hooks.useState)(false);
    const [isRendered, setIsRendered] = (0, _hooks.useState)(false);
    // Handle initial render to prevent content flash
    (0, _hooks.useEffect)(()=>{
        setIsRendered(true);
    }, []);
    const toggleExpanded = ()=>{
        setIsExpanded(!isExpanded);
    };
    return (0, _jsxRuntime.jsxs)("div", {
        className: `settings-footer ${isExpanded ? 'expanded' : ''}`,
        role: "region",
        "aria-label": "Game settings",
        children: [
            (0, _jsxRuntime.jsx)("div", {
                className: "settings-header minimalist-header",
                onClick: toggleExpanded,
                onKeyDown: (e)=>{
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpanded();
                    }
                },
                tabIndex: 0,
                role: "button",
                "aria-expanded": isExpanded,
                "aria-controls": "settings-content",
                children: (0, _jsxRuntime.jsxs)("span", {
                    className: "settings-icon",
                    children: [
                        isExpanded ? "\u25BC" : "\u25B2",
                        (0, _jsxRuntime.jsx)("span", {
                            className: "px-1",
                            children: "Search & Settings"
                        })
                    ]
                })
            }),
            (0, _jsxRuntime.jsx)("div", {
                id: "settings-content",
                className: "settings-content",
                style: {
                    maxHeight: isExpanded ? '500px' : '0',
                    opacity: isExpanded ? '1' : '0',
                    visibility: isExpanded ? 'visible' : 'hidden'
                },
                children: (0, _jsxRuntime.jsx)("div", {
                    className: "p-4 bg-aged-paper-light rounded shadow-sm",
                    children: (0, _jsxRuntime.jsx)((0, _queryOptions.QueryOptions), {
                        isRemoteInterface: isRemoteInterface
                    })
                })
            })
        ]
    });
};

},{"preact/jsx-runtime":"jBtcg","preact/hooks":"83L4j","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT","./QueryOptions":"a1Bg6"}],"a1Bg6":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "categorySignal", ()=>categorySignal);
parcelHelpers.export(exports, "authorSignal", ()=>authorSignal);
parcelHelpers.export(exports, "centurySignal", ()=>centurySignal);
parcelHelpers.export(exports, "QueryOptions", ()=>QueryOptions);
var _jsxRuntime = require("preact/jsx-runtime");
var _hooks = require("preact/hooks");
var _signals = require("@preact/signals");
const categorySignal = (0, _signals.signal)(localStorage.getItem('game_category') || '');
const authorSignal = (0, _signals.signal)(localStorage.getItem('game_author') || '');
const centurySignal = (0, _signals.signal)(localStorage.getItem('game_century') || '');
const QueryOptions = ({ isRemoteInterface = false })=>{
    const [selectedCategory, setSelectedCategory] = (0, _hooks.useState)(categorySignal.value);
    const [author, setAuthor] = (0, _hooks.useState)(authorSignal.value);
    const [century, setCentury] = (0, _hooks.useState)(centurySignal.value);
    // Update state when signals change
    (0, _hooks.useEffect)(()=>{
        setSelectedCategory(categorySignal.value);
    }, [
        categorySignal.value
    ]);
    (0, _hooks.useEffect)(()=>{
        setAuthor(authorSignal.value);
    }, [
        authorSignal.value
    ]);
    (0, _hooks.useEffect)(()=>{
        setCentury(centurySignal.value);
    }, [
        centurySignal.value
    ]);
    const handleCategoryChange = (e)=>{
        const newCategory = e.target.value;
        setSelectedCategory(newCategory);
        localStorage.setItem('game_category', newCategory);
        categorySignal.value = newCategory;
    };
    const handleAuthorInput = (e)=>{
        const newAuthor = e.target.value;
        setAuthor(newAuthor);
        localStorage.setItem('game_author', newAuthor);
        authorSignal.value = newAuthor;
    };
    const handleCenturyChange = (e)=>{
        const newCentury = e.target.value;
        setCentury(newCentury);
        localStorage.setItem('game_century', newCentury);
        centurySignal.value = newCentury;
    };
    // Category/Topic options
    const categoryOptions = [
        {
            value: "",
            text: "Random Topic"
        },
        // User Specified Categories
        {
            value: "bookshelf/466",
            text: "Philosophy & Ethics"
        },
        {
            value: "bookshelf/478",
            text: "Science (General)"
        },
        {
            value: "bookshelf/468",
            text: "Politics"
        },
        {
            value: "bookshelf/446",
            text: "History (General)"
        },
        {
            value: "bookshelf/458",
            text: "Literature"
        },
        {
            value: "bookshelf/460",
            text: "Music"
        },
        {
            value: "bookshelf/484",
            text: "Teaching & Education"
        },
        {
            value: "bookshelf/459",
            text: "Mathematics"
        },
        {
            value: "bookshelf/427",
            text: "Biographies"
        },
        // Additional Prominent Categories
        {
            value: "bookshelf/486",
            text: "Fiction (General)"
        },
        {
            value: "bookshelf/480",
            text: "Science-Fiction & Fantasy"
        },
        {
            value: "bookshelf/433",
            text: "Crime/Mystery"
        },
        {
            value: "bookshelf/453",
            text: "Humour"
        },
        {
            value: "bookshelf/467",
            text: "Poetry"
        },
        {
            value: "bookshelf/485",
            text: "Travel & Geography"
        }
    ];
    // Century options
    const centuryOptions = [
        {
            value: "",
            text: "Any Century"
        },
        {
            value: "15",
            text: "16th Century (1500s)"
        },
        {
            value: "16",
            text: "17th Century (1600s)"
        },
        {
            value: "17",
            text: "18th Century (1700s)"
        },
        {
            value: "18",
            text: "19th Century (1800s)"
        },
        {
            value: "19",
            text: "20th Century (1900s)"
        }
    ];
    // Standardized select component style classes
    const selectClasses = "w-full p-2 border border-typewriter-ink bg-aged-paper-light rounded focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon focus:border-typewriter-ribbon appearance-none pr-8";
    // Standardized input component style classes
    const inputClasses = "w-full p-2 border border-typewriter-ink bg-aged-paper-light rounded focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon focus:border-typewriter-ribbon";
    return (0, _jsxRuntime.jsxs)("div", {
        className: "mb-4",
        children: [
            (0, _jsxRuntime.jsx)("h3", {
                className: "text-lg font-semibold mb-2 text-typewriter-ink",
                children: "Search Options"
            }),
            (0, _jsxRuntime.jsxs)("div", {
                className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                children: [
                    (0, _jsxRuntime.jsxs)("div", {
                        children: [
                            (0, _jsxRuntime.jsx)("label", {
                                htmlFor: "category-select",
                                className: "block mb-2 text-typewriter-ink",
                                children: "Category"
                            }),
                            (0, _jsxRuntime.jsxs)("div", {
                                className: "relative",
                                children: [
                                    (0, _jsxRuntime.jsx)("select", {
                                        id: "category-select",
                                        className: selectClasses,
                                        value: selectedCategory,
                                        onInput: handleCategoryChange,
                                        "aria-label": "Select category",
                                        children: categoryOptions.map((option)=>(0, _jsxRuntime.jsx)("option", {
                                                value: option.value,
                                                children: option.text
                                            }, option.value))
                                    }),
                                    (0, _jsxRuntime.jsx)("div", {
                                        className: "pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-typewriter-ink",
                                        children: (0, _jsxRuntime.jsx)("svg", {
                                            className: "fill-current h-4 w-4",
                                            xmlns: "http://www.w3.org/2000/svg",
                                            viewBox: "0 0 20 20",
                                            children: (0, _jsxRuntime.jsx)("path", {
                                                d: "M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                                            })
                                        })
                                    })
                                ]
                            })
                        ]
                    }),
                    (0, _jsxRuntime.jsxs)("div", {
                        children: [
                            (0, _jsxRuntime.jsx)("label", {
                                htmlFor: "author-input",
                                className: "block mb-2 text-typewriter-ink",
                                children: "Author"
                            }),
                            (0, _jsxRuntime.jsx)("input", {
                                id: "author-input",
                                type: "text",
                                className: inputClasses,
                                placeholder: "Enter author name",
                                value: author,
                                onInput: handleAuthorInput,
                                "aria-label": "Author name"
                            })
                        ]
                    }),
                    (0, _jsxRuntime.jsxs)("div", {
                        children: [
                            (0, _jsxRuntime.jsx)("label", {
                                htmlFor: "century-select",
                                className: "block mb-2 text-typewriter-ink",
                                children: "Century"
                            }),
                            (0, _jsxRuntime.jsxs)("div", {
                                className: "relative",
                                children: [
                                    (0, _jsxRuntime.jsx)("select", {
                                        id: "century-select",
                                        className: selectClasses,
                                        value: century,
                                        onInput: handleCenturyChange,
                                        "aria-label": "Select century",
                                        children: centuryOptions.map((option)=>(0, _jsxRuntime.jsx)("option", {
                                                value: option.value,
                                                children: option.text
                                            }, option.value))
                                    }),
                                    (0, _jsxRuntime.jsx)("div", {
                                        className: "pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-typewriter-ink",
                                        children: (0, _jsxRuntime.jsx)("svg", {
                                            className: "fill-current h-4 w-4",
                                            xmlns: "http://www.w3.org/2000/svg",
                                            viewBox: "0 0 20 20",
                                            children: (0, _jsxRuntime.jsx)("path", {
                                                d: "M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                                            })
                                        })
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
};

},{"preact/jsx-runtime":"jBtcg","preact/hooks":"83L4j","@preact/signals":"9Kynq","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"9Kynq":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Signal", ()=>(0, _signalsCore.Signal));
parcelHelpers.export(exports, "batch", ()=>(0, _signalsCore.batch));
parcelHelpers.export(exports, "computed", ()=>(0, _signalsCore.computed));
parcelHelpers.export(exports, "effect", ()=>(0, _signalsCore.effect));
parcelHelpers.export(exports, "signal", ()=>(0, _signalsCore.signal));
parcelHelpers.export(exports, "untracked", ()=>(0, _signalsCore.untracked));
parcelHelpers.export(exports, "useComputed", ()=>useComputed);
parcelHelpers.export(exports, "useSignal", ()=>useSignal);
parcelHelpers.export(exports, "useSignalEffect", ()=>useSignalEffect);
var _preact = require("preact");
var _hooks = require("preact/hooks");
var _signalsCore = require("@preact/signals-core");
var s, h, l, d = [], p = [];
(0, _signalsCore.effect)(function() {
    s = this.N;
})();
function m(i, r) {
    (0, _preact.options)[i] = r.bind(null, (0, _preact.options)[i] || function() {});
}
function _(i) {
    if (l) l();
    l = i && i.S();
}
function g(i) {
    var n = this, f = i.data, o = useSignal(f);
    o.value = f;
    var u = (0, _hooks.useMemo)(function() {
        var i = n, t = n.__v;
        while(t = t.__)if (t.__c) {
            t.__c.__$f |= 4;
            break;
        }
        var f = (0, _signalsCore.computed)(function() {
            var i = o.value.value;
            return 0 === i ? 0 : !0 === i ? "" : i || "";
        }), u = (0, _signalsCore.computed)(function() {
            return !Array.isArray(f.value) && !(0, _preact.isValidElement)(f.value);
        }), c = (0, _signalsCore.effect)(function() {
            this.N = F;
            if (u.value) {
                var n = f.value;
                if (i.__v && i.__v.__e && 3 === i.__v.__e.nodeType) i.__v.__e.data = n;
            }
        }), v = n.__$u.d;
        n.__$u.d = function() {
            c();
            v.call(this);
        };
        return [
            u,
            f
        ];
    }, []), c = u[0], v = u[1];
    return c.value ? v.peek() : v.value;
}
g.displayName = "_st";
Object.defineProperties((0, _signalsCore.Signal).prototype, {
    constructor: {
        configurable: !0,
        value: void 0
    },
    type: {
        configurable: !0,
        value: g
    },
    props: {
        configurable: !0,
        get: function() {
            return {
                data: this
            };
        }
    },
    __b: {
        configurable: !0,
        value: 1
    }
});
m("__b", function(i, n) {
    if ("string" == typeof n.type) {
        var r, t = n.props;
        for(var f in t)if ("children" !== f) {
            var o = t[f];
            if (o instanceof (0, _signalsCore.Signal)) {
                if (!r) n.__np = r = {};
                r[f] = o;
                t[f] = o.peek();
            }
        }
    }
    i(n);
});
m("__r", function(i, n) {
    _();
    var r, t = n.__c;
    if (t) {
        t.__$f &= -2;
        if (void 0 === (r = t.__$u)) t.__$u = r = function(i) {
            var n;
            (0, _signalsCore.effect)(function() {
                n = this;
            });
            n.c = function() {
                t.__$f |= 1;
                t.setState({});
            };
            return n;
        }();
    }
    h = t;
    _(r);
    i(n);
});
m("__e", function(i, n, r, t) {
    _();
    h = void 0;
    i(n, r, t);
});
m("diffed", function(i, n) {
    _();
    h = void 0;
    var r;
    if ("string" == typeof n.type && (r = n.__e)) {
        var t = n.__np, f = n.props;
        if (t) {
            var o = r.U;
            if (o) for(var e in o){
                var u = o[e];
                if (void 0 !== u && !(e in t)) {
                    u.d();
                    o[e] = void 0;
                }
            }
            else {
                o = {};
                r.U = o;
            }
            for(var a in t){
                var c = o[a], v = t[a];
                if (void 0 === c) {
                    c = b(r, a, v, f);
                    o[a] = c;
                } else c.o(v, f);
            }
        }
    }
    i(n);
});
function b(i, n, r, t) {
    var f = n in i && void 0 === i.ownerSVGElement, o = (0, _signalsCore.signal)(r);
    return {
        o: function(i, n) {
            o.value = i;
            t = n;
        },
        d: (0, _signalsCore.effect)(function() {
            this.N = F;
            var r = o.value.value;
            if (t[n] !== r) {
                t[n] = r;
                if (f) i[n] = r;
                else if (r) i.setAttribute(n, r);
                else i.removeAttribute(n);
            }
        })
    };
}
m("unmount", function(i, n) {
    if ("string" == typeof n.type) {
        var r = n.__e;
        if (r) {
            var t = r.U;
            if (t) {
                r.U = void 0;
                for(var f in t){
                    var o = t[f];
                    if (o) o.d();
                }
            }
        }
    } else {
        var e = n.__c;
        if (e) {
            var u = e.__$u;
            if (u) {
                e.__$u = void 0;
                u.d();
            }
        }
    }
    i(n);
});
m("__h", function(i, n, r, t) {
    if (t < 3 || 9 === t) n.__$f |= 2;
    i(n, r, t);
});
(0, _preact.Component).prototype.shouldComponentUpdate = function(i, n) {
    var r = this.__$u, t = r && void 0 !== r.s;
    for(var f in n)return !0;
    if (this.__f || "boolean" == typeof this.u && !0 === this.u) {
        var o = 2 & this.__$f;
        if (!(t || o || 4 & this.__$f)) return !0;
        if (1 & this.__$f) return !0;
    } else {
        if (!(t || 4 & this.__$f)) return !0;
        if (3 & this.__$f) return !0;
    }
    for(var e in i)if ("__source" !== e && i[e] !== this.props[e]) return !0;
    for(var u in this.props)if (!(u in i)) return !0;
    return !1;
};
function useSignal(i) {
    return (0, _hooks.useMemo)(function() {
        return (0, _signalsCore.signal)(i);
    }, []);
}
function useComputed(i) {
    var n = (0, _hooks.useRef)(i);
    n.current = i;
    h.__$f |= 4;
    return (0, _hooks.useMemo)(function() {
        return (0, _signalsCore.computed)(function() {
            return n.current();
        });
    }, []);
}
var y = "undefined" == typeof requestAnimationFrame ? setTimeout : function(i) {
    var n = function() {
        clearTimeout(r);
        cancelAnimationFrame(t);
        i();
    }, r = setTimeout(n, 100), t = requestAnimationFrame(n);
}, k = function(i) {
    queueMicrotask(function() {
        queueMicrotask(i);
    });
};
function q() {
    (0, _signalsCore.batch)(function() {
        var i;
        while(i = d.shift())s.call(i);
    });
}
function A() {
    if (1 === d.push(this)) ((0, _preact.options).requestAnimationFrame || y)(q);
}
function w() {
    (0, _signalsCore.batch)(function() {
        var i;
        while(i = p.shift())s.call(i);
    });
}
function F() {
    if (1 === p.push(this)) ((0, _preact.options).requestAnimationFrame || k)(w);
}
function useSignalEffect(i) {
    var n = (0, _hooks.useRef)(i);
    n.current = i;
    (0, _hooks.useEffect)(function() {
        return (0, _signalsCore.effect)(function() {
            this.N = A;
            return n.current();
        });
    }, []);
}

},{"preact":"agj7k","preact/hooks":"83L4j","@preact/signals-core":"kM6Nd","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"kM6Nd":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Signal", ()=>u);
parcelHelpers.export(exports, "batch", ()=>r);
parcelHelpers.export(exports, "computed", ()=>w);
parcelHelpers.export(exports, "effect", ()=>E);
parcelHelpers.export(exports, "signal", ()=>d);
parcelHelpers.export(exports, "untracked", ()=>n);
var i = Symbol.for("preact-signals");
function t() {
    if (!(s > 1)) {
        var i, t = !1;
        while(void 0 !== h){
            var r = h;
            h = void 0;
            f++;
            while(void 0 !== r){
                var o = r.o;
                r.o = void 0;
                r.f &= -3;
                if (!(8 & r.f) && c(r)) try {
                    r.c();
                } catch (r) {
                    if (!t) {
                        i = r;
                        t = !0;
                    }
                }
                r = o;
            }
        }
        f = 0;
        s--;
        if (t) throw i;
    } else s--;
}
function r(i) {
    if (s > 0) return i();
    s++;
    try {
        return i();
    } finally{
        t();
    }
}
var o = void 0;
function n(i) {
    var t = o;
    o = void 0;
    try {
        return i();
    } finally{
        o = t;
    }
}
var h = void 0, s = 0, f = 0, v = 0;
function e(i) {
    if (void 0 !== o) {
        var t = i.n;
        if (void 0 === t || t.t !== o) {
            t = {
                i: 0,
                S: i,
                p: o.s,
                n: void 0,
                t: o,
                e: void 0,
                x: void 0,
                r: t
            };
            if (void 0 !== o.s) o.s.n = t;
            o.s = t;
            i.n = t;
            if (32 & o.f) i.S(t);
            return t;
        } else if (-1 === t.i) {
            t.i = 0;
            if (void 0 !== t.n) {
                t.n.p = t.p;
                if (void 0 !== t.p) t.p.n = t.n;
                t.p = o.s;
                t.n = void 0;
                o.s.n = t;
                o.s = t;
            }
            return t;
        }
    }
}
function u(i) {
    this.v = i;
    this.i = 0;
    this.n = void 0;
    this.t = void 0;
}
u.prototype.brand = i;
u.prototype.h = function() {
    return !0;
};
u.prototype.S = function(i) {
    if (this.t !== i && void 0 === i.e) {
        i.x = this.t;
        if (void 0 !== this.t) this.t.e = i;
        this.t = i;
    }
};
u.prototype.U = function(i) {
    if (void 0 !== this.t) {
        var t = i.e, r = i.x;
        if (void 0 !== t) {
            t.x = r;
            i.e = void 0;
        }
        if (void 0 !== r) {
            r.e = t;
            i.x = void 0;
        }
        if (i === this.t) this.t = r;
    }
};
u.prototype.subscribe = function(i) {
    var t = this;
    return E(function() {
        var r = t.value, n = o;
        o = void 0;
        try {
            i(r);
        } finally{
            o = n;
        }
    });
};
u.prototype.valueOf = function() {
    return this.value;
};
u.prototype.toString = function() {
    return this.value + "";
};
u.prototype.toJSON = function() {
    return this.value;
};
u.prototype.peek = function() {
    var i = o;
    o = void 0;
    try {
        return this.value;
    } finally{
        o = i;
    }
};
Object.defineProperty(u.prototype, "value", {
    get: function() {
        var i = e(this);
        if (void 0 !== i) i.i = this.i;
        return this.v;
    },
    set: function(i) {
        if (i !== this.v) {
            if (f > 100) throw new Error("Cycle detected");
            this.v = i;
            this.i++;
            v++;
            s++;
            try {
                for(var r = this.t; void 0 !== r; r = r.x)r.t.N();
            } finally{
                t();
            }
        }
    }
});
function d(i) {
    return new u(i);
}
function c(i) {
    for(var t = i.s; void 0 !== t; t = t.n)if (t.S.i !== t.i || !t.S.h() || t.S.i !== t.i) return !0;
    return !1;
}
function a(i) {
    for(var t = i.s; void 0 !== t; t = t.n){
        var r = t.S.n;
        if (void 0 !== r) t.r = r;
        t.S.n = t;
        t.i = -1;
        if (void 0 === t.n) {
            i.s = t;
            break;
        }
    }
}
function l(i) {
    var t = i.s, r = void 0;
    while(void 0 !== t){
        var o = t.p;
        if (-1 === t.i) {
            t.S.U(t);
            if (void 0 !== o) o.n = t.n;
            if (void 0 !== t.n) t.n.p = o;
        } else r = t;
        t.S.n = t.r;
        if (void 0 !== t.r) t.r = void 0;
        t = o;
    }
    i.s = r;
}
function y(i) {
    u.call(this, void 0);
    this.x = i;
    this.s = void 0;
    this.g = v - 1;
    this.f = 4;
}
(y.prototype = new u).h = function() {
    this.f &= -3;
    if (1 & this.f) return !1;
    if (32 == (36 & this.f)) return !0;
    this.f &= -5;
    if (this.g === v) return !0;
    this.g = v;
    this.f |= 1;
    if (this.i > 0 && !c(this)) {
        this.f &= -2;
        return !0;
    }
    var i = o;
    try {
        a(this);
        o = this;
        var t = this.x();
        if (16 & this.f || this.v !== t || 0 === this.i) {
            this.v = t;
            this.f &= -17;
            this.i++;
        }
    } catch (i) {
        this.v = i;
        this.f |= 16;
        this.i++;
    }
    o = i;
    l(this);
    this.f &= -2;
    return !0;
};
y.prototype.S = function(i) {
    if (void 0 === this.t) {
        this.f |= 36;
        for(var t = this.s; void 0 !== t; t = t.n)t.S.S(t);
    }
    u.prototype.S.call(this, i);
};
y.prototype.U = function(i) {
    if (void 0 !== this.t) {
        u.prototype.U.call(this, i);
        if (void 0 === this.t) {
            this.f &= -33;
            for(var t = this.s; void 0 !== t; t = t.n)t.S.U(t);
        }
    }
};
y.prototype.N = function() {
    if (!(2 & this.f)) {
        this.f |= 6;
        for(var i = this.t; void 0 !== i; i = i.x)i.t.N();
    }
};
Object.defineProperty(y.prototype, "value", {
    get: function() {
        if (1 & this.f) throw new Error("Cycle detected");
        var i = e(this);
        this.h();
        if (void 0 !== i) i.i = this.i;
        if (16 & this.f) throw this.v;
        return this.v;
    }
});
function w(i) {
    return new y(i);
}
function _(i) {
    var r = i.u;
    i.u = void 0;
    if ("function" == typeof r) {
        s++;
        var n = o;
        o = void 0;
        try {
            r();
        } catch (t) {
            i.f &= -2;
            i.f |= 8;
            g(i);
            throw t;
        } finally{
            o = n;
            t();
        }
    }
}
function g(i) {
    for(var t = i.s; void 0 !== t; t = t.n)t.S.U(t);
    i.x = void 0;
    i.s = void 0;
    _(i);
}
function p(i) {
    if (o !== this) throw new Error("Out-of-order effect");
    l(this);
    o = i;
    this.f &= -2;
    if (8 & this.f) g(this);
    t();
}
function b(i) {
    this.x = i;
    this.u = void 0;
    this.s = void 0;
    this.o = void 0;
    this.f = 32;
}
b.prototype.c = function() {
    var i = this.S();
    try {
        if (8 & this.f) return;
        if (void 0 === this.x) return;
        var t = this.x();
        if ("function" == typeof t) this.u = t;
    } finally{
        i();
    }
};
b.prototype.S = function() {
    if (1 & this.f) throw new Error("Cycle detected");
    this.f |= 1;
    this.f &= -9;
    _(this);
    a(this);
    s++;
    var i = o;
    o = this;
    return p.bind(this, i);
};
b.prototype.N = function() {
    if (!(2 & this.f)) {
        this.f |= 2;
        this.o = h;
        h = this;
    }
};
b.prototype.d = function() {
    this.f |= 8;
    if (!(1 & this.f)) g(this);
};
function E(i) {
    var t = new b(i);
    try {
        t.c();
    } catch (i) {
        t.d();
        throw i;
    }
    return t.d.bind(t);
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"iI8MK":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "apiKeySignal", ()=>apiKeySignal);
parcelHelpers.export(exports, "ApiConfiguration", ()=>ApiConfiguration);
// Export isValidApiKey for use in other modules if needed
parcelHelpers.export(exports, "isValidApiKey", ()=>isValidApiKey);
var _jsxRuntime = require("preact/jsx-runtime");
var _hooks = require("preact/hooks");
var _signals = require("@preact/signals");
var _environmentConfig = require("@/utils/environmentConfig");
const apiKeySignal = (0, _signals.signal)((0, _environmentConfig.getEnvironmentConfig)().OPENROUTER_API_KEY);
/**
 * Helper function to check if the API key is valid.
 * @param key The API key string to validate.
 * @returns True if the key is valid, false otherwise.
 */ function isValidApiKey(key) {
    return Boolean(key) && key.startsWith('sk-or-') && key.length > 20;
}
const ApiConfiguration = ({ isRemoteInterface = window.location.hostname.includes('github.io') })=>{
    const [inputKey, setInputKey] = (0, _hooks.useState)(apiKeySignal.value);
    const [message, setMessage] = (0, _hooks.useState)('');
    const [messageType, setMessageType] = (0, _hooks.useState)('');
    const [apiStatus, setApiStatus] = (0, _hooks.useState)('ready');
    // Effect to ensure the input field and signal reflect the latest from localStorage on mount
    // and to update the input field if the signal changes externally.
    (0, _hooks.useEffect)(()=>{
        const currentStoredKey = (0, _environmentConfig.getEnvironmentConfig)().OPENROUTER_API_KEY;
        setInputKey(currentStoredKey);
        // Ensure the signal is also in sync with the potentially updated localStorage value
        if (apiKeySignal.value !== currentStoredKey) apiKeySignal.value = currentStoredKey;
        // For remote interfaces, ensure we're using the default key
        if (isRemoteInterface && (0, _environmentConfig.isUsingUserProvidedApiKey)()) {
            console.log("Remote interface detected, using default API key");
            localStorage.removeItem('openrouter_api_key');
            apiKeySignal.value = (0, _environmentConfig.getEnvironmentConfig)().OPENROUTER_API_KEY;
        }
    }, []); // Runs once on mount to initialize from localStorage
    // This effect handles updates if apiKeySignal changes due to other interactions (e.g. after saving)
    (0, _hooks.useEffect)(()=>{
        setInputKey(apiKeySignal.value);
    }, [
        apiKeySignal.value
    ]);
    /**
     * Handles saving the input API key using the environment utility and updating the signal.
     * Performs validation through the utility function.
     */ const handleSave = ()=>{
        const isValid = (0, _environmentConfig.setUserApiKey)(inputKey);
        if (isValid) {
            // Update the signal with the new key from the environment
            apiKeySignal.value = (0, _environmentConfig.getEnvironmentConfig)().OPENROUTER_API_KEY;
            setMessageType('success');
            setMessage('API key saved successfully!');
        } else {
            setMessageType('error');
            setMessage('Please enter a valid OpenRouter API key (starts with sk-or-)');
        }
        // Clear message after a few seconds
        setTimeout(()=>setMessage(''), 3000);
    };
    const messageClass = messageType === 'success' ? 'text-green-600' : messageType === 'error' ? 'text-red-600' : messageType === 'info' ? 'text-blue-600' : '';
    // When running in a remote interface, don't show the API key input UI
    if (isRemoteInterface) return null;
    return (0, _jsxRuntime.jsxs)("div", {
        className: "mb-4 mt-6 pt-4 border-t border-typewriter-ink border-opacity-20",
        children: [
            (0, _jsxRuntime.jsx)("h3", {
                className: "text-lg font-semibold mb-2 text-typewriter-ink",
                children: "API Configuration"
            }),
            (0, _jsxRuntime.jsx)("label", {
                htmlFor: "api-key-input",
                className: "block mb-2 text-typewriter-ink",
                children: "OpenRouter API Key"
            }),
            (0, _jsxRuntime.jsxs)("div", {
                className: "flex flex-col sm:flex-row gap-2",
                children: [
                    (0, _jsxRuntime.jsx)("input", {
                        id: "api-key-input",
                        type: "password",
                        className: "flex-grow p-2 border border-typewriter-ink bg-aged-paper-light rounded focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon",
                        placeholder: "sk-or-...",
                        value: inputKey,
                        onInput: (e)=>setInputKey(e.target.value),
                        "aria-label": "OpenRouter API Key input"
                    }),
                    (0, _jsxRuntime.jsx)("button", {
                        onClick: handleSave,
                        className: "px-4 py-2 bg-typewriter-ink text-aged-paper rounded hover:bg-opacity-80 focus:ring-2 focus:ring-typewriter-ribbon focus:outline-none typewriter-key min-w-[120px] min-h-[42px] flex items-center justify-center",
                        "aria-label": "Save API key",
                        children: "Save API Key"
                    })
                ]
            }),
            (0, _jsxRuntime.jsxs)("p", {
                className: "text-sm mt-2 text-typewriter-ink opacity-80",
                children: [
                    (0, _environmentConfig.isUsingUserProvidedApiKey)() ? "Custom API key is being used" : "Using default API key. Get your own at ",
                    !(0, _environmentConfig.isUsingUserProvidedApiKey)() && (0, _jsxRuntime.jsx)("a", {
                        href: "https://openrouter.ai",
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "underline hover:text-typewriter-ribbon focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon rounded",
                        "aria-label": "Visit OpenRouter website",
                        children: "openrouter.ai"
                    })
                ]
            }),
            message && (0, _jsxRuntime.jsx)("p", {
                className: `mt-2 text-sm ${messageClass}`,
                role: "status",
                children: message
            })
        ]
    });
};

},{"preact/jsx-runtime":"jBtcg","preact/hooks":"83L4j","@preact/signals":"9Kynq","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT","@/utils/environmentConfig":"hZ7Ky"}],"dsv6M":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "WelcomeOverlay", ()=>WelcomeOverlay);
var _jsxRuntime = require("preact/jsx-runtime");
var _hooks = require("preact/hooks");
const WelcomeOverlay = ({ onStart })=>{
    const [visible, setVisible] = (0, _hooks.useState)(true);
    const startButtonRef = (0, _hooks.useRef)(null);
    // When component mounts, focus the start button for accessibility
    (0, _hooks.useEffect)(()=>{
        if (visible && startButtonRef.current) startButtonRef.current.focus();
        // Trap focus within the modal when it's visible
        const handleTabKey = (e)=>{
            if (!visible || e.key !== 'Tab') return;
            // List of all focusable elements in the overlay
            const modal = document.querySelector('#welcome-modal');
            if (!modal) return;
            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (e.shiftKey) // If shift+tab and on first element, wrap to last
            {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else // If tab and on last element, wrap to first
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        };
        // Handle escape key to close the modal
        const handleEscapeKey = (e)=>{
            if (visible && e.key === 'Escape') handleStart();
        };
        document.addEventListener('keydown', handleTabKey);
        document.addEventListener('keydown', handleEscapeKey);
        return ()=>{
            document.removeEventListener('keydown', handleTabKey);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [
        visible
    ]);
    const handleStart = ()=>{
        setVisible(false);
        onStart();
    };
    // Don't render if not visible
    if (!visible) return null;
    return (0, _jsxRuntime.jsx)("div", {
        id: "welcome-overlay",
        className: "fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-60 backdrop-blur-sm",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "welcome-title",
        onClick: (e)=>{
            // Only close if the click was on the backdrop, not the modal itself
            if (e.target.id === 'welcome-overlay') handleStart();
        },
        children: (0, _jsxRuntime.jsxs)("div", {
            id: "welcome-modal",
            className: "bg-aged-paper p-6 md:p-8 rounded-lg shadow-lg max-w-2xl w-full",
            onClick: (e)=>e.stopPropagation(),
            children: [
                (0, _jsxRuntime.jsx)("h1", {
                    id: "welcome-title",
                    className: "text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-typewriter-ink text-center",
                    children: "Cloze Reader"
                }),
                (0, _jsxRuntime.jsxs)("div", {
                    className: "prose prose-lg mb-6 typewriter-text text-typewriter-ink",
                    children: [
                        (0, _jsxRuntime.jsxs)("div", {
                            className: "mb-4",
                            children: [
                                (0, _jsxRuntime.jsx)("strong", {
                                    className: "text-lg",
                                    children: "How to Play"
                                }),
                                (0, _jsxRuntime.jsxs)("ol", {
                                    className: "list-inside space-y-1 mt-2",
                                    children: [
                                        (0, _jsxRuntime.jsx)("li", {
                                            children: "Load book excerpts from the Gutenberg Project"
                                        }),
                                        (0, _jsxRuntime.jsx)("li", {
                                            children: "Read context clues to infer missing words"
                                        }),
                                        (0, _jsxRuntime.jsx)("li", {
                                            children: "Get at least half correct to level up"
                                        })
                                    ]
                                })
                            ]
                        }),
                        (0, _jsxRuntime.jsxs)("div", {
                            children: [
                                (0, _jsxRuntime.jsx)("strong", {
                                    className: "text-lg",
                                    children: "Game Controls"
                                }),
                                (0, _jsxRuntime.jsxs)("ul", {
                                    className: "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2",
                                    children: [
                                        (0, _jsxRuntime.jsxs)("li", {
                                            className: "flex items-center",
                                            children: [
                                                (0, _jsxRuntime.jsx)("span", {
                                                    className: "text-typewriter-ribbon mr-2"
                                                }),
                                                (0, _jsxRuntime.jsxs)("span", {
                                                    children: [
                                                        (0, _jsxRuntime.jsx)("strong", {
                                                            children: "Topic:"
                                                        }),
                                                        " Choose a category"
                                                    ]
                                                })
                                            ]
                                        }),
                                        (0, _jsxRuntime.jsxs)("li", {
                                            className: "flex items-center",
                                            children: [
                                                (0, _jsxRuntime.jsx)("span", {
                                                    className: "text-typewriter-ribbon mr-2"
                                                }),
                                                (0, _jsxRuntime.jsxs)("span", {
                                                    children: [
                                                        (0, _jsxRuntime.jsx)("strong", {
                                                            children: "Author:"
                                                        }),
                                                        " Specify if desired"
                                                    ]
                                                })
                                            ]
                                        }),
                                        (0, _jsxRuntime.jsxs)("li", {
                                            className: "flex items-center",
                                            children: [
                                                (0, _jsxRuntime.jsx)("span", {
                                                    className: "text-typewriter-ribbon mr-2"
                                                }),
                                                (0, _jsxRuntime.jsxs)("span", {
                                                    children: [
                                                        (0, _jsxRuntime.jsx)("strong", {
                                                            children: "Century:"
                                                        }),
                                                        " Filter by time period"
                                                    ]
                                                })
                                            ]
                                        }),
                                        (0, _jsxRuntime.jsxs)("li", {
                                            className: "flex items-center",
                                            children: [
                                                (0, _jsxRuntime.jsx)("span", {
                                                    className: "text-typewriter-ribbon mr-2"
                                                }),
                                                (0, _jsxRuntime.jsxs)("span", {
                                                    children: [
                                                        (0, _jsxRuntime.jsx)("strong", {
                                                            children: "Hint:"
                                                        }),
                                                        " Get help (limited)"
                                                    ]
                                                })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                }),
                (0, _jsxRuntime.jsx)("div", {
                    className: "text-center",
                    children: (0, _jsxRuntime.jsx)("button", {
                        ref: startButtonRef,
                        id: "start-game-btn",
                        className: "px-6 py-3 bg-typewriter-ribbon text-aged-paper font-bold text-lg rounded shadow-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-typewriter-ink focus:ring-offset-2 focus:ring-offset-aged-paper transition-all duration-200",
                        "aria-label": "Start game",
                        onClick: (e)=>{
                            e.preventDefault();
                            handleStart();
                        },
                        onKeyDown: (e)=>{
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleStart();
                            }
                        },
                        children: "\u25BA START READING \u25C4"
                    })
                })
            ]
        })
    });
};

},{"preact/jsx-runtime":"jBtcg","preact/hooks":"83L4j","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}]},["jLiUF","9T1gr"], "9T1gr", "parcelRequired201", {})

//# sourceMappingURL=cloze-reader.99b9cdd5.js.map
