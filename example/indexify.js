(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"_process":3,"inherits":2}],6:[function(require,module,exports){
module.exports = function(c){
  return {
    Image: require("./ContexImages/Image")(c),
    ImageObjec: require("./ContexImages/ImageObjec")(c)
  };
};
},{"./ContexImages/Image":7,"./ContexImages/ImageObjec":8}],7:[function(require,module,exports){
var util = require('util');
var events = require('events');

var nlsrc = [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAIVBMVEX///98fHz6+vqMjIyWlpa+vr7Q0NC2tra",
      "EhITo6Oiurq7gQ/BeAAAAXElEQVQYlYWOSRbAIAxCIYPT/Q9cjUNdtWzC+wYi8C8xdgHZ5SZAodYFNEBS6txxqnE+eABjEhsmMQbGPm53gCzX",
      "I2O0E/HZzrZLe7umkdxnUZUlgJ2/eg7wki89lEABGUoqalIAAAAASUVORK5CYII="
    ].join("");

module.exports = function(c){
  var Contex = c.Contex;
  var Objec = c.Objec;
  var Color = c.Color;
  
  function Image(url){
    this.dom = document.createElement("img");
    this.isLoaded = false;
    this.events = new events.EventEmitter();
    this.dom.addEventListener("load", function(){
      this.isLoaded = true;
      this.events.emit("load");
    }.bind(this));
    this.dom.src = url;
    
    this.notLoaded = document.createElement("img");
    this.notLoaded.src = nlsrc;
    this.nlloaded = false;
    this.notLoaded.addEventListener("load", function(){
      this.nlloaded = true;
      this.events.emit("nlloaded");
    }.bind(this));
  }
  
  //util.inherits(Image, events.EventEmitter); ///why doesn't util.inherits work
  return Image;
};
},{"events":1,"util":5}],8:[function(require,module,exports){
var util = require('util');

module.exports = function(c){
  var Contex = c.Contex;
  var Objec = c.Objec;
  var Color = c.Color;
  
  function ImageObjec(image, x, y, w, h){
    this.img = image;
    this.x = -x;
    this.y = -y;
    this.super(w,h);
    
    this.img.events.on("load",function(){
      this.update();
    }.bind(this));
    
    this.img.events.on("nlloaded",function(){
      this.update();
    }.bind(this));
  }
  
  /**/
  ImageObjec.prototype.super = function(w,h){
    this.image = new Contex(w,h);
    this.update();
  };
  
  ImageObjec.prototype.resize = function(w,h){
    this.image.resize(w,h);
    this.update();
  };
  
  ImageObjec.prototype.drawOnto = function(contex,x,y,anchor,w,h){
    contex.drawObjec(this,x,y,anchor,w,h);
  };
  /**/
  
  ImageObjec.prototype.update = function(){
    this.image.clear();
    if(this.img.isLoaded)
      this.image.ctx.drawImage(this.img.dom, this.x, this.y);
    else if(this.img.nlloaded)
      this.image.ctx.drawImage(this.img.notLoaded, 0,0,this.image.dom.width, this.image.dom.height);
  };
  
  return ImageObjec;
};
},{"util":5}],9:[function(require,module,exports){
module.exports = require("./ContexImage");
},{"./ContexImage":6}],10:[function(require,module,exports){
module.exports = function(c){
  return {
    Rectangle: require("./ContexPrimitives/Rectangle")(c),
    Ellipse: require("./ContexPrimitives/Ellipse")(c),
    FillModes: {
      Stroke: 1,
      Fill: 2
    }
  };
};
},{"./ContexPrimitives/Ellipse":11,"./ContexPrimitives/Rectangle":12}],11:[function(require,module,exports){
var util = require('util');

module.exports = function(c){
  var Contex = c.Contex;
  var Objec = c.Objec;
  var Color = c.Color;
  
  function Ellipse(w,h){
    this.fillColor = new Color("#fff");
    this.strokeColor = new Color("#fff");
    this.strokeWidth = 0;
    
    this.fillMode = 2;
    
    this.super(w,h);
  }
  
  
  /**/
  Ellipse.prototype.super = function(w,h){
    this.image = new Contex(w,h);
    this.update();
  };
  
  Ellipse.prototype.resize = function(w,h){
    this.image.resize(w,h);
    this.update();
  };
  
  Ellipse.prototype.drawOnto = function(contex,x,y,anchor,w,h){
    contex.drawObjec(this,x,y,anchor,w,h);
  };
  /**/
  
  //util.inherits(Ellipse, Objec);
  
  Ellipse.prototype.update = function(){
    this.image.clear();
    
    this.image.ctx.fillStyle = this.fillColor.get();
    this.image.ctx.strokeStyle = this.strokeColor.get();
    this.image.ctx.lineWidth = this.strokeWidth.get();
    
    this.image.ctx.beginPath();
    this.image.ctx.ellipse(this.image.dom.width/2, this.image.dom.height/2, (this.image.dom.width-this.strokeWidth)/2, (this.image.dom.height-this.strokeWidth)/2, 0 * Math.PI/180, 0, 2 * Math.PI);
    if((this.fillMode & 1) == 1)this.image.ctx.stroke();
    if((this.fillMode & 2) == 2)this.image.ctx.fill();
  };
  return Ellipse;
};
},{"util":5}],12:[function(require,module,exports){
var util = require('util');

module.exports = function(c){
  var Contex = c.Contex;
  var Objec = c.Objec;
  var Color = c.Color;
  
  function Rectangle(w,h){
    this.fillColor = new Color("#fff");
    this.strokeColor = new Color("#fff");
    this.strokeWidth = 0;
    
    this.fillMode = 1|2;
    
    this.super(w,h);
  }
  
  
  /**/
  Rectangle.prototype.super = function(w,h){
    this.image = new Contex(w,h);
    this.update();
  };
  
  Rectangle.prototype.resize = function(w,h){
    this.image.resize(w,h);
    this.update();
  };
  
  Rectangle.prototype.drawOnto = function(contex,x,y,anchor,w,h){
    contex.drawObjec(this,x,y,anchor,w,h);
  };
  /**/
  
  //util.inherits(Rectangle, Objec);
  
  Rectangle.prototype.update = function(){
    this.image.clear();
    
    this.image.ctx.fillStyle = this.fillColor.get();
    this.image.ctx.strokeStyle = this.strokeColor.get();
    this.image.ctx.lineWidth = this.strokeWidth;
    
    this.image.ctx.beginPath();
    var sw = (((this.fillMode & 1) == 1)?this.strokeWidth:0);
    this.image.ctx.rect(0+sw,0+sw, this.image.dom.width-sw*2, this.image.dom.height-sw*2);
    if((this.fillMode & 1) == 1)this.image.ctx.stroke();
    if((this.fillMode & 2) == 2)this.image.ctx.fill();
  };
  return Rectangle;
};
},{"util":5}],13:[function(require,module,exports){
module.exports = require('./ContexPrimitives');
},{"./ContexPrimitives":10}],14:[function(require,module,exports){
var util = require('util');
var events = require('events');

if (!Object.prototype.keys) {
    Object.prototype.keys = function (obj) {
        var arr = [],
            key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                arr.push(key);
            }
        }
        return arr;
    };
}

module.exports = function(c,CI){
  var Contex = c.Contex;
  var Objec = c.Objec;
  var Color = c.Color;
  
  var Image = CI.Image;
  var ImageObjec = CI.ImageObjec;
  
  function parseMap(map){
    var result = [];
    var tilesets = {};
    var imageObjecs = {};
    
    var size = [0,0];
    
    var event = new events.EventEmitter();
    
    var loadedImages = 0;
    
    var loaded = false;
    
    map.map.forEach(function(layer){
      var layero = [];
      var tileset;
      if(tilesets[layer.tileset]){
        tileset = tilesets[layer.tileset];
      }else{
        tileset = {
          "image": new Image(map.tilesets[layer.tileset].image),
          "tilesize": map.tilesets[layer.tileset].tilesize
        };
        tileset.image.events.on("load",function(){
          loadedImages++;
          console.log("images loaded",loadedImages,"images left",Object.keys(map.tilesets).length);
          if(loadedImages >= Object.keys(map.tilesets).length){
            console.log("all images loaded");
            loaded = true;
            event.emit("loaded");
          }
        });
        tilesets[layer.tileset] = tileset;
      }
      
      var sizex = 0;
      var sizey = 0;
      layer.content.forEach(function(content,y){
        sizex = y;
        var layeroo = [];
        content.split(",").forEach(function(tile,x){
          sizey = x;
          
          if(imageObjecs[tile]){
            layeroo.push({img: imageObjecs[tile], x: x*tileset.tilesize[0], y: y*tileset.tilesize[1]});
          }else{
            if(tile == "-1")
              layeroo.push(undefined);
            else{
              var xs = parseInt(tile.split(".")[0],10);
              var ys = parseInt(tile.split(".")[1],10);
              //console.log(xs, tileset.tilesize, xs*tileset.tilesize[0], ys*tileset.tilesize[1], tileset.tilesize[0], tileset.tilesize[1]);
              var imageObjec = new ImageObjec(tileset.image, xs*tileset.tilesize[0], ys*tileset.tilesize[1], tileset.tilesize[0], tileset.tilesize[1]);
              imageObjecs[tile] = imageObjec;
              layeroo.push({
                img: imageObjec, x: x*tileset.tilesize[0], y: y*tileset.tilesize[1]
              });
            }
          }
        });
        layero.push(layeroo);
      });
      
      sizex *= tileset.tilesize[0];
      sizey *= tileset.tilesize[1];
      
      size = [Math.max(sizex, size[0]), Math.max(sizey, size[1])];
      
      result.push(layero);
    });
    
    return {
      w: size[0],
      h: size[1],
      result: result,
      events: event,
      loaded: loaded
    };
  }
  
  function Tiled(map){
    this.map = parseMap(map);
    
    this.map.events.on("loaded",function(){
      console.log("saw said images");
      this.update();
    }.bind(this));
    
    this.super(this.map.w, this.map.h);
  }
  
  /**/
  Tiled.prototype.super = function(w,h){
    this.image = new Contex(w,h);
    this.update();
  };
  
  Tiled.prototype.resize = function(w,h){
    this.image.resize(w,h);
    this.update();
  };
  
  Tiled.prototype.drawOnto = function(contex,x,y,anchor,w,h){
    contex.drawObjec(this,x,y,anchor,w,h);
  };
  /**/
  
  //util.inherits(Tiled, Objec);
  
  Tiled.prototype.update = function(){
    this.image.clear();
    
    this.map.result.forEach(function(layer){
      layer.forEach(function(tileset, x){
        tileset.forEach(function(tile,y){
          if(tile){
            tile.img.update();
            tile.img.drawOnto(this.image, tile.x,tile.y);
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };
  return Tiled;
};
},{"events":1,"util":5}],15:[function(require,module,exports){
module.exports = function(C,CI){
  return {
    Tiled: require("./ContexTiled/Tiled")(C,CI)
  };
};
},{"./ContexTiled/Tiled":14}],16:[function(require,module,exports){
function Contex(w,h,db){
    if(h && w){
        this.dom = document.createElement("canvas");
        this.dom.width = w;
        this.dom.height = h;
    }else if(w){
        this.dom = w;
    }else if(h){
        this.dom = h.canvas;
    }
    
    if(db){
        var dd = document.createElement("canvas");
        dd.width = this.dom.width;
        dd.height = this.dom.height;
        
        this.ctx = dd.getContext("2d");
        this._dtx = this.dom.getContext("2d");
    }else{
        this.ctx = this.dom.getContext("2d");
    }
    
    this.camera = {x:0,y:0};
} // ctx.translate - no cameras needed
Contex.prototype.swap = function(){
    if(this._dtx)this._dtx.drawImage(this.ctx.canvas, 0, 0);
};
Contex.prototype.drawObjec = function(objec,x,y, anchor,w,h){
    this.drawImage(objec.image,x,y, anchor,w,h);
};
Contex.prototype.drawImage = function(contex,x,y, anchor,ww,hh){
    var xmask = anchor ? anchor.x : 0;
    var ymask = anchor ? anchor.y : 0;
    var w = ww || contex.dom.width;
    var h = hh || contex.dom.height;
    var xadd = xmask * w;
    var yadd = ymask * h;
    this.ctx.drawImage(contex.dom,x-xadd + this.camera.x,y-yadd + this.camera.y,ww || contex.dom.width, hh||contex.dom.height);
};
Contex.prototype.resize = function(w,h){
    var newctx = new Contex(w,h);
    newctx.drawImage(this,0,0);
    this.dom.width = w;
    this.dom.height = h;
    this.drawImage(newctx,0,0);
    
    if(this._dtx){
        this.ctx.canvas.width = w;
        this.ctx.canvas.height = h;
        this.swap();
    }
    
    return;
};
Contex.prototype.clear = function(color){
    this.ctx.fillStyle = (color || Colors.Transparent).get();
    this.ctx.strokeStyle = (color || Colors.Transparent).get();
    this.ctx.lineWidth = 0;
    
    var oldcop = this.ctx.globalCompositeOperation;
    if((color || Colors.Transparent) == Colors.Transparent){
        
    
        this.ctx.globalCompositeOperation = "destination-out";
    }
    
    this.ctx.beginPath();
    var sw = (0);
    this.ctx.rect(0+sw,0+sw, this.dom.width-sw*2, this.dom.height-sw*2);
    this.ctx.fill();
    
    this.ctx.globalCompositeOperation = oldcop;
};

var Objec = require("./Contex/Objec.js")(Contex);
var Color = require("./Contex/Color.js")(Color);

var Colors = {
    "White": new Color("white"),
    "Red": new Color("red"),
    "Transparent": new Color("rgba(0,0,0,1)")
};

module.exports = {
    Contex: Contex,
    Objec: Objec,
    Color: Color,
    Colors: Colors
};
},{"./Contex/Color.js":17,"./Contex/Objec.js":18}],17:[function(require,module,exports){
module.exports = function(Contex){
  
  function Color(hex){
      this.hex = hex;
  }
  
  Object.prototype.get = function(){
    return this.hex;
  };
  
  return Color;
};
},{}],18:[function(require,module,exports){
module.exports = function(Contex){
  function Objec(w,h){
    this.super(w,h);
  }
  
  Objec.prototype.super = function(w,h){
    this.image = new Contex(w,h);
    this.update();
  };
  
  Objec.prototype.update = function(){
    this.image.clear();
  };
  
  Objec.prototype.resize = function(w,h){
    this.image.resize(w,h);
    this.update();
  };
  
  Objec.prototype.drawOnto = function(contex,x,y,anchor,w,h){
    contex.drawObjec(this,x,y,anchor,w,h);
  };
  
  return Objec;
};
},{}],19:[function(require,module,exports){
module.exports = require("./Contex");
},{"./Contex":16}],20:[function(require,module,exports){
var C = require("../contex/index");
var CP = require("../contex-primitives/index")(C);
var CI = require("../contex-image/index")(C);
var CT = require("../contex-tiled/index")(C, CI);

var gloop = require('gloop')();
require('keyboardevent-key-polyfill').polyfill();

var Contex = C.Contex;
var Color = C.Color;
var Colors = C.Colors;
var Anchors = C.Anchors;
var Rectangle = CP.Rectangle;
var FillModes = CP.FillModes;
var Image = CI.Image;
var ImageObjec = CI.ImageObjec;
var Tiled = CT.Tiled;

var mainContex = new Contex(window.innerWidth,window.innerHeight, true);
document.body.appendChild(mainContex.dom);
mainContex.dom.style.position="fixed";
mainContex.dom.style.top="0";
mainContex.dom.style.left="0";
mainContex.dom.style.width="100%";
mainContex.dom.style.height="100%";

var testRect = new ImageObjec(new Image("imgae.png"), 0,0,60,60);//new Rectangle(30,30); // https://i.stack.imgur.com/UAqTj.jpg?s=64&g=1

testRect.fillColor = new Color("#123456");
testRect.strokeColor = new Color("#654321");
testRect.strokeWidth = 5;
testRect.fillMode = FillModes.Fill;
testRect.update();

var testTiled = new Tiled(require("./map.json"));


mainContex.clear(Colors.Red);
testRect.drawOnto(mainContex,50,50, {x: 0.5, y: 0.5});

var xpos = 50;
var ypos = 50;
var prexpos = 0;

var dir = {
  left: false,
  right: false,
  up:false,
  down: false
};

gloop.on('tick', function (dt) {
  if(dir.right)xpos += (dt / 1000)*100;
  if(dir.left)xpos -= (dt / 1000)*100;
  if(dir.up)ypos -= (dt / 1000)*100;
  if(dir.down)ypos += (dt / 1000)*100;
  
  mainContex.clear(Colors.Red);
  mainContex.drawObjec(testTiled,0,0);
  mainContex.drawObjec(testRect,xpos,ypos, {x: 0.5, y: 0.5}, 30, 30);
  
  mainContex.camera.x = -xpos + 0.5*(mainContex.dom.width);
  mainContex.camera.y = -ypos + 0.5*(mainContex.dom.height);
  
  mainContex.swap();
});
 
gloop.on('frame', function (t) {
  //draw
  //update
});
 
gloop.on('start', function () {
});
 
gloop.on('stop', function () {
});
gloop.start();

document.addEventListener('keydown', function (e) {
  if(e.key == "ArrowLeft")dir.left = true;
  if(e.key == "ArrowRight")dir.right = true;
  if(e.key == "ArrowUp")dir.up = true;
  if(e.key == "ArrowDown")dir.down = true;
});

document.addEventListener('keyup', function (e) {
  if(e.key == "ArrowLeft")dir.left = false;
  if(e.key == "ArrowRight")dir.right = false;
  if(e.key == "ArrowUp")dir.up = false;
  if(e.key == "ArrowDown")dir.down = false;
});

window.addEventListener('resize', function (e) {
  mainContex.resize(window.innerWidth,window.innerHeight);
});
},{"../contex-image/index":9,"../contex-primitives/index":13,"../contex-tiled/index":15,"../contex/index":19,"./map.json":21,"gloop":22,"keyboardevent-key-polyfill":25}],21:[function(require,module,exports){
module.exports={
    "map": [
    {"layer": "background", "tileset": "mage_city.png", "content": ["0.7,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0",
    "0.7,1.7,2.7,0.0,0.0,0.0,2.35,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0",
    "0.7,1.7,1.7,2.7,0.0,0.0,0.0,0.0,2.33,3.33,4.33,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0",
    "0.0,0.7,1.7,1.7,2.7,0.0,0.0,0.0,2.34,3.34,4.34,5.34,0.0,2.35,0.0,0.0,3.36,4.36,5.36,0.0,3.36,3.36,0.0,0.0,0.0",
    "0.0,0.0,0.7,1.7,1.7,2.7,0.0,2.35,2.35,3.35,4.35,5.35,0.0,0.0,0.0,0.0,0.0,3.36,0.0,0.0,0.0,2.35,0.0,0.0,0.0",
    "0.0,0.0,0.7,1.7,1.7,2.7,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.9,1.9,2.9,0.0,0.0,0.0,0.0,0.0",
    "0.0,0.0,0.0,0.7,1.7,1.7,2.7,0.0,0.0,0.0,0.0,0.0,0.0,0.0,3.36,0.0,0.0,0.1,1.1,2.1,0.0,0.0,0.0,0.0,0.0",
    "3.36,0.0,0.0,0.0,0.7,1.7,2.7,0.0,0.0,0.0,0.0,3.36,0.0,0.0,0.0,0.0,0.0,0.11,1.11,2.11,0.0,0.0,0.0,0.0,0.0",
    "0.0,0.0,0.0,0.0,0.0,0.7,1.7,2.7,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,3.36,0.0,0.0,0.0",
    "0.0,3.36,0.0,0.0,0.0,0.0,0.7,1.7,2.7,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,3.36,0.0,0.0,0.0",
    "0.0,0.0,3.36,3.36,0.0,0.0,0.7,1.7,1.7,2.7,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,3.36,2.35,0.0,0.0",
    "0.0,0.0,0.0,0.0,2.35,0.0,0.0,0.7,1.7,2.7,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,3.36,0.0,3.36,0.0,0.0,0.0,0.0",
    "0.0,0.0,3.36,5.36,0.0,0.0,0.0,0.0,0.0,0.7,2.7,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0",
    "0.0,0.0,0.0,0.0,2.35,0.0,3.36,0.0,0.0,0.0,0.7,2.7,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0",
    "3.36,3.36,0.0,0.33,1.33,0.0,0.0,0.0,0.0,0.0,0.7,1.7,2.7,0.0,0.0,0.0,0.0,0.0,0.0,0.0,2.35,3.36,0.0,0.0,0.0",
    "0.0,0.0,0.0,0.34,1.34,0.0,0.0,0.0,0.0,0.0,0.0,0.7,1.7,2.7,0.0,0.0,0.0,0.0,4.36,5.36,0.0,3.36,0.0,0.0,0.0",
    "0.0,0.0,2.35,0.0,0.0,3.36,0.41,0.0,0.0,0.0,0.0,0.7,1.7,2.7,0.0,0.0,0.0,3.36,3.36,0.0,0.0,0.0,0.0,0.0,0.0",
    "0.0,0.0,3.36,0.0,0.0,3.36,0.43,2.35,0.0,0.0,0.0,0.0,0.7,1.7,2.7,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0",
    "0.0,3.36,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.7,1.7,2.7,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0"]},
    {"layer": "foreground", "tileset": "mage_city.png", "content": ["-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,5.6,-1,-1,-1,-1,-1,-1,5.6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,-1,1.2,2.2,-1,0.23,1.23,1.23,1.23,1.23,2.23,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,-1,1.3,2.3,-1,0.25,1.25,1.25,3.24,1.23,2.24,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,5.6,-1,-1,-1,-1,-1,-1,-1,-1,2.15,3.15,-1,0.24,1.24,2.24,-1,-1,-1,-1,-1,-1,-1",
    "5.6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,2.16,3.16,-1,0.25,1.25,2.25,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,1.2,2.2,-1,0.30,1.30,2.30,-1,2.17,3.17,-1,3.4,4.4,5.4,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,1.3,2.3,-1,0.31,1.31,2.31,-1,2.18,3.18,-1,0.4,1.4,2.4,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,2.16,3.16,2.32,-1,-1,-1,-1,0.5,1.5,2.5,-1,-1,6.31,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,2.17,3.17,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,2.18,3.18,-1,-1,-1,-1,-1,-1,-1,0.30,1.30,2.30,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0.31,1.31,2.31,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0.32,1.32,2.32,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1",
    "-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1"]}
    ],
    "tilesets": {
        "mage_city.png": {
            "tilesize": [32,32],
            "image": "magecity.png"
        } 
    }
}
},{}],22:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
(function() {
  var EventEmitter, GameLoop, create, raf,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  raf = require('raf');

  GameLoop = (function(_super) {
    __extends(GameLoop, _super);

    GameLoop.defaults = {
      timeScale: 1,
      ticksPerSecond: 120
    };

    function GameLoop(properties) {
      var _ref, _ref1;
      this.timeScale = (_ref = properties != null ? properties.timeScale : void 0) != null ? _ref : GameLoop.defaults.timeScale;
      this.ticksPerSecond = (_ref1 = properties != null ? properties.ticksPerSecond : void 0) != null ? _ref1 : GameLoop.defaults.ticksPerSecond;
      this.dt = 1000 / this.ticksPerSecond;
      this.__accum = 0;
    }

    GameLoop.prototype.start = function() {
      var run;
      this.emit('start');
      run = (function(_this) {
        return function() {
          _this._loop();
          return _this._handle = raf(run);
        };
      })(this);
      return this._handle = raf(run);
    };

    GameLoop.prototype.stop = function() {
      this.emit('stop');
      return raf.cancel(this._handle);
    };

    GameLoop.prototype._loop = function() {
      var count, delta, now;
      now = Date.now();
      if (this.__lastCall == null) {
        this.__lastCall = now;
      }
      delta = now - this.__lastCall;
      count = 0;
      this.__lastCall = now;
      this.__accum = Math.min((this.dt / this.timeScale) * 10, this.__accum + delta);
      while ((this.__accum >= this.dt / this.timeScale) && count < 20) {
        count += 1;
        this.emit('tick', this.dt);
        this.__accum -= this.dt / this.timeScale;
      }
      return this.emit('frame', (1 - this.__accum / this.dt / this.timeScale) / 1000);
    };

    return GameLoop;

  })(EventEmitter);

  create = function(properties) {
    return new GameLoop(properties);
  };

  module.exports = create;

}).call(this);

},{"events":1,"raf":23}],23:[function(require,module,exports){
var now = require('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]
  , isNative = true

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  isNative = false

  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  if(!isNative) {
    return raf.call(global, fn)
  }
  return raf.call(global, function() {
    try{
      fn.apply(this, arguments)
    } catch(e) {
      setTimeout(function() { throw e }, 0)
    }
  })
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

},{"performance-now":24}],24:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.6.3
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

/*

*/

}).call(this,require('_process'))
},{"_process":3}],25:[function(require,module,exports){
/* global define, KeyboardEvent, module */

(function () {

  var keyboardeventKeyPolyfill = {
    polyfill: polyfill,
    keys: {
      3: 'Cancel',
      6: 'Help',
      8: 'Backspace',
      9: 'Tab',
      12: 'Clear',
      13: 'Enter',
      16: 'Shift',
      17: 'Control',
      18: 'Alt',
      19: 'Pause',
      20: 'CapsLock',
      27: 'Escape',
      28: 'Convert',
      29: 'NonConvert',
      30: 'Accept',
      31: 'ModeChange',
      32: ' ',
      33: 'PageUp',
      34: 'PageDown',
      35: 'End',
      36: 'Home',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      41: 'Select',
      42: 'Print',
      43: 'Execute',
      44: 'PrintScreen',
      45: 'Insert',
      46: 'Delete',
      48: ['0', ')'],
      49: ['1', '!'],
      50: ['2', '@'],
      51: ['3', '#'],
      52: ['4', '$'],
      53: ['5', '%'],
      54: ['6', '^'],
      55: ['7', '&'],
      56: ['8', '*'],
      57: ['9', '('],
      91: 'OS',
      93: 'ContextMenu',
      144: 'NumLock',
      145: 'ScrollLock',
      181: 'VolumeMute',
      182: 'VolumeDown',
      183: 'VolumeUp',
      186: [';', ':'],
      187: ['=', '+'],
      188: [',', '<'],
      189: ['-', '_'],
      190: ['.', '>'],
      191: ['/', '?'],
      192: ['`', '~'],
      219: ['[', '{'],
      220: ['\\', '|'],
      221: [']', '}'],
      222: ["'", '"'],
      224: 'Meta',
      225: 'AltGraph',
      246: 'Attn',
      247: 'CrSel',
      248: 'ExSel',
      249: 'EraseEof',
      250: 'Play',
      251: 'ZoomOut'
    }
  };

  // Function keys (F1-24).
  var i;
  for (i = 1; i < 25; i++) {
    keyboardeventKeyPolyfill.keys[111 + i] = 'F' + i;
  }

  // Printable ASCII characters.
  var letter = '';
  for (i = 65; i < 91; i++) {
    letter = String.fromCharCode(i);
    keyboardeventKeyPolyfill.keys[i] = [letter.toLowerCase(), letter.toUpperCase()];
  }

  function polyfill () {
    if (!('KeyboardEvent' in window) ||
        'key' in KeyboardEvent.prototype) {
      return false;
    }

    // Polyfill `key` on `KeyboardEvent`.
    var proto = {
      get: function (x) {
        var key = keyboardeventKeyPolyfill.keys[this.which || this.keyCode];

        if (Array.isArray(key)) {
          key = key[+this.shiftKey];
        }

        return key;
      }
    };
    Object.defineProperty(KeyboardEvent.prototype, 'key', proto);
    return proto;
  }

  if (typeof define === 'function' && define.amd) {
    define('keyboardevent-key-polyfill', keyboardeventKeyPolyfill);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    module.exports = keyboardeventKeyPolyfill;
  } else if (window) {
    window.keyboardeventKeyPolyfill = keyboardeventKeyPolyfill;
  }

})();

},{}]},{},[20]);
