// This file was generated by modules-webmake (modules for web) project.
// See: https://github.com/medikoo/modules-webmake

(function (modules) {
	'use strict';

	var resolve, getRequire, require, notFoundError, findFile
	  , extensions = {".js":[],".json":[],".css":[],".html":[]};
	notFoundError = function (path) {
		var error = new Error("Could not find module '" + path + "'");
		error.code = 'MODULE_NOT_FOUND';
		return error;
	};
	findFile = function (scope, name, extName) {
		var i, ext;
		if (typeof scope[name + extName] === 'function') return name + extName;
		for (i = 0; (ext = extensions[extName][i]); ++i) {
			if (typeof scope[name + ext] === 'function') return name + ext;
		}
		return null;
	};
	resolve = function (scope, tree, path, fullpath, state) {
		var name, dir, exports, module, fn, found, i, ext;
		path = path.split(/[\\/]/);
		name = path.pop();
		if ((name === '.') || (name === '..')) {
			path.push(name);
			name = '';
		}
		while ((dir = path.shift()) != null) {
			if (!dir || (dir === '.')) continue;
			if (dir === '..') {
				scope = tree.pop();
			} else {
				tree.push(scope);
				scope = scope[dir];
			}
			if (!scope) throw notFoundError(fullpath);
		}
		if (name && (typeof scope[name] !== 'function')) {
			found = findFile(scope, name, '.js');
			if (!found) found = findFile(scope, name, '.json');
			if (!found) found = findFile(scope, name, '.css');
			if (!found) found = findFile(scope, name, '.html');
			if (found) {
				name = found;
			} else if ((state !== 2) && (typeof scope[name] === 'object')) {
				tree.push(scope);
				scope = scope[name];
				name = '';
			}
		}
		if (!name) {
			if ((state !== 1) && scope[':mainpath:']) {
				return resolve(scope, tree, scope[':mainpath:'], fullpath, 1);
			}
			return resolve(scope, tree, 'index', fullpath, 2);
		}
		fn = scope[name];
		if (!fn) throw notFoundError(fullpath);
		if (fn.hasOwnProperty('module')) return fn.module.exports;
		exports = {};
		fn.module = module = { exports: exports };
		fn.call(exports, exports, module, getRequire(scope, tree));
		return module.exports;
	};
	require = function (scope, tree, fullpath) {
		var name, path = fullpath, t = fullpath.charAt(0), state = 0;
		if (t === '/') {
			path = path.slice(1);
			scope = modules['/'];
			tree = [];
		} else if (t !== '.') {
			name = path.split('/', 1)[0];
			scope = modules[name];
			if (!scope) throw notFoundError(fullpath);
			tree = [];
			path = path.slice(name.length + 1);
			if (!path) {
				path = scope[':mainpath:'];
				if (path) {
					state = 1;
				} else {
					path = 'index';
					state = 2;
				}
			}
		}
		return resolve(scope, tree, path, fullpath, state);
	};
	getRequire = function (scope, tree) {
		return function (path) { return require(scope, [].concat(tree), path); };
	};
	return getRequire(modules, []);
})({
	"domjs": {
		":mainpath:": "lib/html5",
		"lib": {
			"domjs.js": function (exports, module, require) {
				'use strict';

				var forEach       = Array.prototype.forEach
				  , map           = Array.prototype.map
				  , slice         = Array.prototype.slice
				  , keys          = Object.keys
				  , reserved      = require('es5-ext/lib/reserved')
				  , isFunction    = require('es5-ext/lib/Function/is-function')
				  , partial       = require('es5-ext/lib/Function/prototype/partial')
				  , dscope        = require('./dscope')
				  , compact       = require('es5-ext/lib/Array/prototype/compact')
				  , contains      = require('es5-ext/lib/Array/prototype/contains')
				  , flatten       = require('es5-ext/lib/Array/prototype/flatten')
				  , isList        = require('es5-ext/lib/Object/is-list')
				  , isPlainObject = require('es5-ext/lib/Object/is-plain-object')
				  , isObject      = require('es5-ext/lib/Object/is-object')
				  , oForEach      = require('es5-ext/lib/Object/for-each')
				  , oMap          = require('es5-ext/lib/Object/map')
				  , toArray       = require('es5-ext/lib/Array/from')
				  , isNode        = require('./is-node')

				  , renameReserved, nodeMap, nextInit;

				renameReserved = (function (rename) {
					return function (scope) {
						Object.keys(scope).forEach(rename, scope);
					};
				}(function (key) {
					if (contains.call(reserved, key)) {
						this['_' + key] = this[key];
						delete this[key];
					}
				}));

				nodeMap = (function (create) {
					return {
						_cdata: create('createCDATASection'),
						_comment: create('createComment'),
						_text: create('createTextNode')
					};
				}(function (method) {
					return function (str) {
						return this.df.appendChild(this.document[method](str || ''));
					};
				}));

				nodeMap._element = function (name) {
					this.createElement(name, this.processArguments(slice.call(arguments, 1)));
				};
				nodeMap._direct = function () {
					forEach.call(arguments, this.df.appendChild, this.df);
				};
				nodeMap._detached = function () {
					return this.processChildren(toArray(arguments)).map(function (el) {
						if (el.parentNode) {
							el.parentNode.removeChild(el);
						}
						return el;
					});
				};

				nextInit = function (document, extRequire) {
					this.document = document;
					this.require = extRequire || require;
					this.df = this.document.createDocumentFragment();
					this.map = oMap(this.map, function (value) {
						return isFunction(value) ? value.bind(this) : value;
					}, this);
					return this;
				};

				module.exports = {
					init: (function (setCreate) {
						return function (elMap) {
							this.map = {};
							// attach node methods
							keys(nodeMap).forEach(function (key) {
								this.map[key] = nodeMap[key];
							}, this);
							// attach element methods
							elMap.forEach(setCreate, this);
							renameReserved(this.map);
							this.map._map = this.map;

							this.init = nextInit;
							this.idMap = {};
							return this;
						};
					}(function (name) {
						this.map[name] = this.getCreate(name);
					})),
					build: function (f) {
						var df, predf;
						predf = this.df;
						df = this.df = this.document.createDocumentFragment();
						dscope(isFunction(f) ? f : partial.call(this.require, f), this.map);
						if (predf) {
							this.df = predf;
						}
						return df;
					},
					processArguments: function (args) {
						args = toArray(args);
						return [isPlainObject(args[0]) ? args.shift() : {}, args];
					},
					getCreate: function (name) {
						return function () {
							return this.getUpdate(this.createElement(name,
								this.processArguments(arguments)));
						};
					},
					getUpdate: function (el) {
						return function f() {
							if (!arguments.length) {
								return el;
							}
							this.updateElement(el, this.processArguments(arguments));
							return f;
						}.bind(this);
					},
					createElement: function (name, data) {
						return this.updateElement(this.df.appendChild(
							this.document.createElement(name)
						), data);
					},
					processChildren: function (children) {
						return compact.call(flatten.call(children.map(function self(child) {
							if (isFunction(child)) {
								child = child();
							} else if (!isNode(child) && isList(child) && isObject(child)) {
								return map.call(child, self, this);
							} else if ((typeof child === "string") || (typeof child === "number")) {
								child = this.document.createTextNode(child);
							}
							return child;
						}, this)));
					},
					updateElement: function (el, data) {
						var attrs = data[0], children = data[1], self = this;
						oForEach(attrs, function (value, name) {
							this.setAttribute(el, name, value);
						}, this);
						this.processChildren(children).forEach(el.appendChild, el);
						return el;
					},
					setAttribute: function (el, name, value) {
						if ((value == null) || (value === false)) {
							return;
						} else if (value === true) {
							value = name;
						}
						if (name === 'id') {
							if (this.idMap[value]) {
								console.warn("Duplicate HTML element id: '" + value + "'");
							} else {
								this.idMap[value] = el;
							}
						}
						el.setAttribute(name, value);
					},
					getById: function (id) {
						var current = this.document.getElementById(id);
						!this.idMap[id] && (this.idMap[id] = current);
						return current || this.idMap[id];
					}
				};
			},
			"dscope.js": function (exports, module, require) {
				// Dynamic scope for given function
				// Pollutes global scope for time of function call

				'use strict';

				var keys     = Object.keys
				  , global   = require('es5-ext/lib/global')
				  , reserved = require('es5-ext/lib/reserved').all

				  , set, unset;

				set = function (scope, cache) {
					keys(scope).forEach(function (key) {
						if (global.hasOwnProperty(key)) {
							cache[key] = global[key];
						}
						global[key] = scope[key];
					});
				};

				unset = function (scope, cache) {
					keys(scope).forEach(function (key) {
						if (cache.hasOwnProperty(key)) {
							global[key] = cache[key];
						} else {
							delete global[key];
						}
					});
				};

				module.exports = function (fn, scope) {
					var result, cache = {};
					set(scope, cache);
					result = fn();
					unset(scope, cache);
					return result;
				};
			},
			"html5.js": function (exports, module, require) {
				'use strict';

				var isFunction = require('es5-ext/lib/Function/is-function')
				  , d          = require('es5-ext/lib/Object/descriptor')
				  , domjs      = require('./domjs')

				  , html5js
				  , superSetAttribute = domjs.setAttribute;

				html5js = Object.create(domjs, {
					setAttribute: d(function (el, name, value) {
						if ((name.slice(0, 2) === 'on') && isFunction(value)) {
							el.setAttribute(name, name);
							el[name] = value;
						} else {
							superSetAttribute.call(this, el, name, value);
						}
					})
				}).init(['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
					'b', 'bdi', 'bdo', 'blockquote', 'br', 'button', 'canvas', 'caption', 'cite',
					'code', 'col', 'colgroup', 'command', 'datalist', 'dd', 'del', 'details',
					'device', 'dfn', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption',
					'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header',
					'hgroup', 'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen',
					'label', 'legend', 'li', 'link', 'map', 'mark', 'menu', 'meter', 'nav',
					'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param',
					'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section',
					'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary',
					'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time',
					'tr', 'track', 'ul', 'var', 'video', 'wbr']);

				module.exports = function (document, require) {
					return Object.create(html5js).init(document, require);
				};
			},
			"is-node.js": function (exports, module, require) {
				// Whether object is DOM node

				'use strict';

				module.exports = function (x) {
					return (x && (typeof x.nodeType === "number") &&
						(typeof x.nodeName === "string")) || false;
				};
			}
		}
	},
	"es5-ext": {
		":mainpath:": "lib",
		"lib": {
			"Array": {
				"from.js": function (exports, module, require) {
					'use strict';

					var isArray       = Array.isArray
					  , slice         = Array.prototype.slice
					  , isArguments   = require('../Function/is-arguments');

					module.exports = function (obj) {
						if (isArray(obj)) {
							return obj;
						} else if (isArguments(obj)) {
							return (obj.length === 1) ? [obj[0]] : Array.apply(null, obj);
						} else {
							return slice.call(obj);
						}
					};
				},
				"prototype": {
					"compact.js": function (exports, module, require) {
						// Inspired by: http://documentcloud.github.com/underscore/#compact

						'use strict';

						var filter = Array.prototype.filter;

						module.exports = function () {
							return filter.call(this, Boolean);
						};
					},
					"contains.js": function (exports, module, require) {
						'use strict';

						var indexOf = require('./e-index-of');

						module.exports = function (searchElement) {
							return indexOf.call(this, searchElement, arguments[1]) > -1;
						};
					},
					"e-index-of.js": function (exports, module, require) {
						'use strict';

						var indexOf = Array.prototype.indexOf
						  , isNaN   = require('../../Number/is-nan')
						  , ois     = require('../../Object/is')
						  , value   = require('../../Object/valid-value');

						module.exports = function (searchElement) {
							var i;
							if (!isNaN(searchElement) && (searchElement !== 0)) {
								return indexOf.apply(this, arguments);
							}

							for (i = (arguments[1] >>> 0); i < (value(this).length >>> 0); ++i) {
								if (this.hasOwnProperty(i) && ois(searchElement, this[i])) {
									return i;
								}
							}
							return -1;
						};
					},
					"flatten.js": function (exports, module, require) {
						'use strict';

						var isArray   = Array.isArray
						  , forEach   = Array.prototype.forEach
						  , push      = Array.prototype.push;

						module.exports = function flatten() {
							var r = [];
							forEach.call(this, function (x) {
								push.apply(r, isArray(x) ? flatten.call(x) : [x]);
							});
							return r;
						};
					}
				}
			},
			"Function": {
				"arguments.js": function (exports, module, require) {
					'use strict';

					module.exports = function () {
						return arguments;
					};
				},
				"is-arguments.js": function (exports, module, require) {
					'use strict';

					var toString = Object.prototype.toString

					  , id = toString.call(require('./arguments')());

					module.exports = function (x) {
						return toString.call(x) === id;
					};
				},
				"is-function.js": function (exports, module, require) {
					'use strict';

					var toString = Object.prototype.toString

					  , id = toString.call(require('./noop'));

					module.exports = function (f) {
						return (typeof f === "function") && (toString.call(f) === id);
					};
				},
				"noop.js": function (exports, module, require) {
					'use strict';

					module.exports = function () {};
				},
				"prototype": {
					"partial.js": function (exports, module, require) {
						'use strict';

						var apply    = Function.prototype.apply
						  , callable = require('../../Object/valid-callable')
						  , toArray  = require('../../Array/from');

						module.exports = function () {
							var fn = callable(this)
							  , args = toArray(arguments);

							return function () {
								return apply.call(fn, this, args.concat(toArray(arguments)));
							};
						};
					}
				}
			},
			"Number": {
				"is-nan.js": function (exports, module, require) {
					'use strict';

					module.exports = function (value) {
						return (value !== value);
					};
				}
			},
			"Object": {
				"_iterate.js": function (exports, module, require) {
					// Internal method, used by iteration functions.
					// Calls a function for each key-value pair found in object
					// Optionally takes compareFn to iterate object in specific order

					'use strict';

					var call       = Function.prototype.call
					  , keys       = Object.keys
					  , isCallable = require('./is-callable')
					  , callable   = require('./valid-callable')
					  , value      = require('./valid-value');

					module.exports = function (method) {
						return function (obj, cb) {
							var list, thisArg = arguments[2], compareFn = arguments[3];
							value(obj);
							callable(cb);

							list = keys(obj);
							if (compareFn) {
								list.sort(isCallable(compareFn) ? compareFn : undefined);
							}
							return list[method](function (key, index) {
								return call.call(cb, thisArg, obj[key], key, obj, index);
							});
						};
					};
				},
				"descriptor.js": function (exports, module, require) {
					'use strict';

					var isCallable = require('./is-callable')
					  , callable   = require('./valid-callable')
					  , contains   = require('../String/prototype/contains')

					  , d;

					d = module.exports = function (dscr, value) {
						var c, e, w;
						if (arguments.length < 2) {
							value = dscr;
							dscr = null;
						}
						if (dscr == null) {
							c = w = true;
							e = false;
						} else {
							c = contains.call(dscr, 'c');
							e = contains.call(dscr, 'e');
							w = contains.call(dscr, 'w');
						}

						return { value: value, configurable: c, enumerable: e, writable: w };
					};

					d.gs = function (dscr, get, set) {
						var c, e;
						if (isCallable(dscr)) {
							set = (get == null) ? undefined : callable(get);
							get = dscr;
							dscr = null;
						} else {
							get = (get == null) ? undefined : callable(get);
							set = (set == null) ? undefined : callable(set);
						}
						if (dscr == null) {
							c = true;
							e = false;
						} else {
							c = contains.call(dscr, 'c');
							e = contains.call(dscr, 'e');
						}

						return { get: get, set: set, configurable: c, enumerable: e };
					};
				},
				"for-each.js": function (exports, module, require) {
					'use strict';

					module.exports = require('./_iterate')('forEach');
				},
				"is-callable.js": function (exports, module, require) {
					// Inspired by: http://www.davidflanagan.com/2009/08/typeof-isfuncti.html

					'use strict';

					var forEach = Array.prototype.forEach.bind([]);

					module.exports = function (obj) {
						var type;
						if (!obj) {
							return false;
						}
						type = typeof obj;
						if (type === 'function') {
							return true;
						}
						if (type !== 'object') {
							return false;
						}

						try {
							forEach(obj);
							return true;
						} catch (e) {
							if (e instanceof TypeError) {
								return false;
							}
							throw e;
						}
					};
				},
				"is-list.js": function (exports, module, require) {
					'use strict';

					var isFunction = require('../Function/is-function')
					  , isObject   = require('./is-object');

					module.exports = function (x) {
						return ((x != null) && (typeof x.length === 'number') &&

							// Just checking ((typeof x === 'object') && (typeof x !== 'function'))
							// won't work right for some cases, e.g.:
							// type of instance of NodeList in Safari is a 'function'

							((isObject(x) && !isFunction(x)) || (typeof x === "string"))) || false;
					};
				},
				"is-object.js": function (exports, module, require) {
					'use strict';

					var map = { function: true, object: true };

					module.exports = function (x) {
						return ((x != null) && map[typeof x]) || false;
					};
				},
				"is-plain-object.js": function (exports, module, require) {
					'use strict';

					var getPrototypeOf = Object.getPrototypeOf
					  , prototype      = Object.prototype
					  , toString       = prototype.toString

					  , id = {}.toString();

					module.exports = function (value) {
						return (value && (typeof value === 'object') &&
							(getPrototypeOf(value) === prototype) && (toString.call(value) === id)) ||
							false;
					};
				},
				"is.js": function (exports, module, require) {
					// Implementation credits go to:
					// http://wiki.ecmascript.org/doku.php?id=harmony:egal

					'use strict';

					module.exports = function (x, y) {
						return (x === y) ?
							((x !== 0) || ((1 / x) === (1 / y))) :
							((x !== x) && (y !== y));
					};
				},
				"map.js": function (exports, module, require) {
					'use strict';

					var forEach = require('./for-each');

					module.exports = function (obj, cb) {
						var o = {};
						forEach(obj, function (value, key) {
							o[key] = cb.call(this, value, key, obj);
						}, arguments[2]);
						return o;
					};
				},
				"valid-callable.js": function (exports, module, require) {
					'use strict';

					var isCallable = require('./is-callable');

					module.exports = function (fn) {
						if (!isCallable(fn)) {
							throw new TypeError(fn + " is not a function");
						}
						return fn;
					};
				},
				"valid-value.js": function (exports, module, require) {
					'use strict';

					module.exports = function (value) {
						if (value == null) {
							throw new TypeError("Cannot use null or undefined");
						}
						return value;
					};
				}
			},
			"String": {
				"prototype": {
					"contains.js": function (exports, module, require) {
						'use strict';

						var indexOf = String.prototype.indexOf;

						module.exports = function (searchString) {
							return indexOf.call(this, searchString, arguments[1]) > -1;
						};
					}
				}
			},
			"global.js": function (exports, module, require) {
				'use strict';

				module.exports = new Function("return this")();
			},
			"reserved.js": function (exports, module, require) {
				'use strict';

				var freeze  = Object.freeze

				  , keywords, future, futureStrict, all;

				// 7.6.1.1 Keywords
				keywords = freeze(['break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do',
					'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new',
					'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
					'with']);

				// 7.6.1.2 Future Reserved Words
				future = freeze(['class', 'const', 'enum', 'exports', 'extends', 'import', 'super'])

				// Future Reserved Words (only in strict mode)
				futureStrict = freeze(['implements', 'interface', 'let', 'package', 'private', 'protected', 'public',
					'static', 'yield']);

				all = module.exports = keywords.concat(future, futureStrict);
				all.keywords = keywords;
				all.future = future;
				all.futureStrict = futureStrict;
				freeze(all);
			}
		}
	},
	"missilewar": {
		"res": {
			"dependencies.js": function (exports, module, require) {
				domjs = require('domjs/lib/html5')(document);
			}
		}
	}
})("missilewar/res/dependencies");
