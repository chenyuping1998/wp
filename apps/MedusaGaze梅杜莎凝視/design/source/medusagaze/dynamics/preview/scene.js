// @ts-nocheck
// Generated review; original TypeScript is checked separately.
var v = /* @__PURE__ */ ((s) => (s.Application = "application", s.WebGLPipes = "webgl-pipes", s.WebGLPipesAdaptor = "webgl-pipes-adaptor", s.WebGLSystem = "webgl-system", s.WebGPUPipes = "webgpu-pipes", s.WebGPUPipesAdaptor = "webgpu-pipes-adaptor", s.WebGPUSystem = "webgpu-system", s.CanvasSystem = "canvas-system", s.CanvasPipesAdaptor = "canvas-pipes-adaptor", s.CanvasPipes = "canvas-pipes", s.Asset = "asset", s.LoadParser = "load-parser", s.ResolveParser = "resolve-parser", s.CacheParser = "cache-parser", s.DetectionParser = "detection-parser", s.MaskEffect = "mask-effect", s.BlendMode = "blend-mode", s.TextureSource = "texture-source", s.Environment = "environment", s.ShapeBuilder = "shape-builder", s.Batcher = "batcher", s))(v || {});
const Os = (s) => {
  if (typeof s == "function" || typeof s == "object" && s.extension) {
    if (!s.extension)
      throw new Error("Extension class must have an extension object");
    s = { ...typeof s.extension != "object" ? { type: s.extension } : s.extension, ref: s };
  }
  if (typeof s == "object")
    s = { ...s };
  else
    throw new Error("Invalid extension type");
  return typeof s.type == "string" && (s.type = [s.type]), s;
}, cr = (s, e) => Os(s).priority ?? e, z = {
  /** @ignore */
  _addHandlers: {},
  /** @ignore */
  _removeHandlers: {},
  /** @ignore */
  _queue: {},
  /**
   * Remove extensions from PixiJS.
   * @param extensions - Extensions to be removed.
   * @returns {extensions} For chaining.
   */
  remove(...s) {
    return s.map(Os).forEach((e) => {
      e.type.forEach((t) => {
        var r, i;
        return (i = (r = this._removeHandlers)[t]) == null ? void 0 : i.call(r, e);
      });
    }), this;
  },
  /**
   * Register new extensions with PixiJS.
   * @param extensions - The spread of extensions to add to PixiJS.
   * @returns {extensions} For chaining.
   */
  add(...s) {
    return s.map(Os).forEach((e) => {
      e.type.forEach((t) => {
        var n, a;
        const r = this._addHandlers, i = this._queue;
        r[t] ? (a = r[t]) == null || a.call(r, e) : (i[t] = i[t] || [], (n = i[t]) == null || n.push(e));
      });
    }), this;
  },
  /**
   * Internal method to handle extensions by name.
   * @param type - The extension type.
   * @param onAdd  - Function handler when extensions are added/registered {@link StrictExtensionFormat}.
   * @param onRemove  - Function handler when extensions are removed/unregistered {@link StrictExtensionFormat}.
   * @returns {extensions} For chaining.
   */
  handle(s, e, t) {
    var a;
    const r = this._addHandlers, i = this._removeHandlers;
    if (r[s] || i[s])
      throw new Error(`Extension type ${s} already has a handler`);
    r[s] = e, i[s] = t;
    const n = this._queue;
    return n[s] && ((a = n[s]) == null || a.forEach((o) => e(o)), delete n[s]), this;
  },
  /**
   * Handle a type, but using a map by `name` property.
   * @param type - Type of extension to handle.
   * @param map - The object map of named extensions.
   * @returns {extensions} For chaining.
   */
  handleByMap(s, e) {
    return this.handle(
      s,
      (t) => {
        t.name && (e[t.name] = t.ref);
      },
      (t) => {
        t.name && delete e[t.name];
      }
    );
  },
  /**
   * Handle a type, but using a list of extensions with a `name` property.
   * @param type - Type of extension to handle.
   * @param map - The array of named extensions.
   * @param defaultPriority - Fallback priority if none is defined.
   * @returns {extensions} For chaining.
   */
  handleByNamedList(s, e, t = -1) {
    return this.handle(
      s,
      (r) => {
        e.findIndex((n) => n.name === r.name) >= 0 || (e.push({ name: r.name, value: r.ref }), e.sort((n, a) => cr(a.value, t) - cr(n.value, t)));
      },
      (r) => {
        const i = e.findIndex((n) => n.name === r.name);
        i !== -1 && e.splice(i, 1);
      }
    );
  },
  /**
   * Handle a type, but using a list of extensions.
   * @param type - Type of extension to handle.
   * @param list - The list of extensions.
   * @param defaultPriority - The default priority to use if none is specified.
   * @returns {extensions} For chaining.
   */
  handleByList(s, e, t = -1) {
    return this.handle(
      s,
      (r) => {
        e.includes(r.ref) || (e.push(r.ref), e.sort((i, n) => cr(n, t) - cr(i, t)));
      },
      (r) => {
        const i = e.indexOf(r.ref);
        i !== -1 && e.splice(i, 1);
      }
    );
  },
  /**
   * Mixin the source object into the target object.
   * @param Target - The target object to mix into.
   * @param sources - The source(s) object to mix from
   */
  mixin(s, ...e) {
    for (const t of e)
      Object.defineProperties(s.prototype, Object.getOwnPropertyDescriptors(t));
  }
}, fc = {
  extension: {
    type: v.Environment,
    name: "browser",
    priority: -1
  },
  test: () => !0,
  load: async () => {
    await Promise.resolve().then(() => S_);
  }
}, pc = {
  extension: {
    type: v.Environment,
    name: "webworker",
    priority: 0
  },
  test: () => typeof self < "u" && self.WorkerGlobalScope !== void 0,
  load: async () => {
    await Promise.resolve().then(() => w_);
  }
};
class Te {
  /**
   * Creates a new `ObservablePoint`
   * @param observer - Observer to pass to listen for change events.
   * @param {number} [x=0] - position of the point on the x axis
   * @param {number} [y=0] - position of the point on the y axis
   */
  constructor(e, t, r) {
    this._x = t || 0, this._y = r || 0, this._observer = e;
  }
  /**
   * Creates a clone of this point.
   * @param observer - Optional observer to pass to the new observable point.
   * @returns a copy of this observable point
   */
  clone(e) {
    return new Te(e ?? this._observer, this._x, this._y);
  }
  /**
   * Sets the point to a new `x` and `y` position.
   * If `y` is omitted, both `x` and `y` will be set to `x`.
   * @param {number} [x=0] - position of the point on the x axis
   * @param {number} [y=x] - position of the point on the y axis
   * @returns The observable point instance itself
   */
  set(e = 0, t = e) {
    return (this._x !== e || this._y !== t) && (this._x = e, this._y = t, this._observer._onUpdate(this)), this;
  }
  /**
   * Copies x and y from the given point (`p`)
   * @param p - The point to copy from. Can be any of type that is or extends `PointData`
   * @returns The observable point instance itself
   */
  copyFrom(e) {
    return (this._x !== e.x || this._y !== e.y) && (this._x = e.x, this._y = e.y, this._observer._onUpdate(this)), this;
  }
  /**
   * Copies this point's x and y into that of the given point (`p`)
   * @param p - The point to copy to. Can be any of type that is or extends `PointData`
   * @returns The point (`p`) with values updated
   */
  copyTo(e) {
    return e.set(this._x, this._y), e;
  }
  /**
   * Accepts another point (`p`) and returns `true` if the given point is equal to this point
   * @param p - The point to check
   * @returns Returns `true` if both `x` and `y` are equal
   */
  equals(e) {
    return e.x === this._x && e.y === this._y;
  }
  toString() {
    return `[pixi.js/math:ObservablePoint x=0 y=0 scope=${this._observer}]`;
  }
  /** Position of the observable point on the x axis. */
  get x() {
    return this._x;
  }
  set x(e) {
    this._x !== e && (this._x = e, this._observer._onUpdate(this));
  }
  /** Position of the observable point on the y axis. */
  get y() {
    return this._y;
  }
  set y(e) {
    this._y !== e && (this._y = e, this._observer._onUpdate(this));
  }
}
function ui(s) {
  return s && s.__esModule && Object.prototype.hasOwnProperty.call(s, "default") ? s.default : s;
}
var Yr = { exports: {} }, rn;
function mc() {
  return rn || (rn = 1, (function(s) {
    var e = Object.prototype.hasOwnProperty, t = "~";
    function r() {
    }
    Object.create && (r.prototype = /* @__PURE__ */ Object.create(null), new r().__proto__ || (t = !1));
    function i(h, l, c) {
      this.fn = h, this.context = l, this.once = c || !1;
    }
    function n(h, l, c, u, d) {
      if (typeof c != "function")
        throw new TypeError("The listener must be a function");
      var f = new i(c, u || h, d), p = t ? t + l : l;
      return h._events[p] ? h._events[p].fn ? h._events[p] = [h._events[p], f] : h._events[p].push(f) : (h._events[p] = f, h._eventsCount++), h;
    }
    function a(h, l) {
      --h._eventsCount === 0 ? h._events = new r() : delete h._events[l];
    }
    function o() {
      this._events = new r(), this._eventsCount = 0;
    }
    o.prototype.eventNames = function() {
      var l = [], c, u;
      if (this._eventsCount === 0) return l;
      for (u in c = this._events)
        e.call(c, u) && l.push(t ? u.slice(1) : u);
      return Object.getOwnPropertySymbols ? l.concat(Object.getOwnPropertySymbols(c)) : l;
    }, o.prototype.listeners = function(l) {
      var c = t ? t + l : l, u = this._events[c];
      if (!u) return [];
      if (u.fn) return [u.fn];
      for (var d = 0, f = u.length, p = new Array(f); d < f; d++)
        p[d] = u[d].fn;
      return p;
    }, o.prototype.listenerCount = function(l) {
      var c = t ? t + l : l, u = this._events[c];
      return u ? u.fn ? 1 : u.length : 0;
    }, o.prototype.emit = function(l, c, u, d, f, p) {
      var g = t ? t + l : l;
      if (!this._events[g]) return !1;
      var m = this._events[g], y = arguments.length, T, S;
      if (m.fn) {
        switch (m.once && this.removeListener(l, m.fn, void 0, !0), y) {
          case 1:
            return m.fn.call(m.context), !0;
          case 2:
            return m.fn.call(m.context, c), !0;
          case 3:
            return m.fn.call(m.context, c, u), !0;
          case 4:
            return m.fn.call(m.context, c, u, d), !0;
          case 5:
            return m.fn.call(m.context, c, u, d, f), !0;
          case 6:
            return m.fn.call(m.context, c, u, d, f, p), !0;
        }
        for (S = 1, T = new Array(y - 1); S < y; S++)
          T[S - 1] = arguments[S];
        m.fn.apply(m.context, T);
      } else {
        var A = m.length, M;
        for (S = 0; S < A; S++)
          switch (m[S].once && this.removeListener(l, m[S].fn, void 0, !0), y) {
            case 1:
              m[S].fn.call(m[S].context);
              break;
            case 2:
              m[S].fn.call(m[S].context, c);
              break;
            case 3:
              m[S].fn.call(m[S].context, c, u);
              break;
            case 4:
              m[S].fn.call(m[S].context, c, u, d);
              break;
            default:
              if (!T) for (M = 1, T = new Array(y - 1); M < y; M++)
                T[M - 1] = arguments[M];
              m[S].fn.apply(m[S].context, T);
          }
      }
      return !0;
    }, o.prototype.on = function(l, c, u) {
      return n(this, l, c, u, !1);
    }, o.prototype.once = function(l, c, u) {
      return n(this, l, c, u, !0);
    }, o.prototype.removeListener = function(l, c, u, d) {
      var f = t ? t + l : l;
      if (!this._events[f]) return this;
      if (!c)
        return a(this, f), this;
      var p = this._events[f];
      if (p.fn)
        p.fn === c && (!d || p.once) && (!u || p.context === u) && a(this, f);
      else {
        for (var g = 0, m = [], y = p.length; g < y; g++)
          (p[g].fn !== c || d && !p[g].once || u && p[g].context !== u) && m.push(p[g]);
        m.length ? this._events[f] = m.length === 1 ? m[0] : m : a(this, f);
      }
      return this;
    }, o.prototype.removeAllListeners = function(l) {
      var c;
      return l ? (c = t ? t + l : l, this._events[c] && a(this, c)) : (this._events = new r(), this._eventsCount = 0), this;
    }, o.prototype.off = o.prototype.removeListener, o.prototype.addListener = o.prototype.on, o.prefixed = t, o.EventEmitter = o, s.exports = o;
  })(Yr)), Yr.exports;
}
var gc = mc();
const Me = /* @__PURE__ */ ui(gc), _c = Math.PI * 2, xc = 180 / Math.PI, yc = Math.PI / 180;
class oe {
  /**
   * Creates a new `Point`
   * @param {number} [x=0] - position of the point on the x axis
   * @param {number} [y=0] - position of the point on the y axis
   */
  constructor(e = 0, t = 0) {
    this.x = 0, this.y = 0, this.x = e, this.y = t;
  }
  /**
   * Creates a clone of this point
   * @returns A clone of this point
   */
  clone() {
    return new oe(this.x, this.y);
  }
  /**
   * Copies `x` and `y` from the given point into this point
   * @param p - The point to copy from
   * @returns The point instance itself
   */
  copyFrom(e) {
    return this.set(e.x, e.y), this;
  }
  /**
   * Copies this point's x and y into the given point (`p`).
   * @param p - The point to copy to. Can be any of type that is or extends `PointData`
   * @returns The point (`p`) with values updated
   */
  copyTo(e) {
    return e.set(this.x, this.y), e;
  }
  /**
   * Accepts another point (`p`) and returns `true` if the given point is equal to this point
   * @param p - The point to check
   * @returns Returns `true` if both `x` and `y` are equal
   */
  equals(e) {
    return e.x === this.x && e.y === this.y;
  }
  /**
   * Sets the point to a new `x` and `y` position.
   * If `y` is omitted, both `x` and `y` will be set to `x`.
   * @param {number} [x=0] - position of the point on the `x` axis
   * @param {number} [y=x] - position of the point on the `y` axis
   * @returns The point instance itself
   */
  set(e = 0, t = e) {
    return this.x = e, this.y = t, this;
  }
  toString() {
    return `[pixi.js/math:Point x=${this.x} y=${this.y}]`;
  }
  /**
   * A static Point object with `x` and `y` values of `0`. Can be used to avoid creating new objects multiple times.
   * @readonly
   */
  static get shared() {
    return Kr.x = 0, Kr.y = 0, Kr;
  }
}
const Kr = new oe();
class L {
  /**
   * @param a - x scale
   * @param b - y skew
   * @param c - x skew
   * @param d - y scale
   * @param tx - x translation
   * @param ty - y translation
   */
  constructor(e = 1, t = 0, r = 0, i = 1, n = 0, a = 0) {
    this.array = null, this.a = e, this.b = t, this.c = r, this.d = i, this.tx = n, this.ty = a;
  }
  /**
   * Creates a Matrix object based on the given array. The Element to Matrix mapping order is as follows:
   *
   * a = array[0]
   * b = array[1]
   * c = array[3]
   * d = array[4]
   * tx = array[2]
   * ty = array[5]
   * @param array - The array that the matrix will be populated from.
   */
  fromArray(e) {
    this.a = e[0], this.b = e[1], this.c = e[3], this.d = e[4], this.tx = e[2], this.ty = e[5];
  }
  /**
   * Sets the matrix properties.
   * @param a - Matrix component
   * @param b - Matrix component
   * @param c - Matrix component
   * @param d - Matrix component
   * @param tx - Matrix component
   * @param ty - Matrix component
   * @returns This matrix. Good for chaining method calls.
   */
  set(e, t, r, i, n, a) {
    return this.a = e, this.b = t, this.c = r, this.d = i, this.tx = n, this.ty = a, this;
  }
  /**
   * Creates an array from the current Matrix object.
   * @param transpose - Whether we need to transpose the matrix or not
   * @param [out=new Float32Array(9)] - If provided the array will be assigned to out
   * @returns The newly created array which contains the matrix
   */
  toArray(e, t) {
    this.array || (this.array = new Float32Array(9));
    const r = t || this.array;
    return e ? (r[0] = this.a, r[1] = this.b, r[2] = 0, r[3] = this.c, r[4] = this.d, r[5] = 0, r[6] = this.tx, r[7] = this.ty, r[8] = 1) : (r[0] = this.a, r[1] = this.c, r[2] = this.tx, r[3] = this.b, r[4] = this.d, r[5] = this.ty, r[6] = 0, r[7] = 0, r[8] = 1), r;
  }
  /**
   * Get a new position with the current transformation applied.
   * Can be used to go from a child's coordinate space to the world coordinate space. (e.g. rendering)
   * @param pos - The origin
   * @param {Point} [newPos] - The point that the new position is assigned to (allowed to be same as input)
   * @returns {Point} The new point, transformed through this matrix
   */
  apply(e, t) {
    t = t || new oe();
    const r = e.x, i = e.y;
    return t.x = this.a * r + this.c * i + this.tx, t.y = this.b * r + this.d * i + this.ty, t;
  }
  /**
   * Get a new position with the inverse of the current transformation applied.
   * Can be used to go from the world coordinate space to a child's coordinate space. (e.g. input)
   * @param pos - The origin
   * @param {Point} [newPos] - The point that the new position is assigned to (allowed to be same as input)
   * @returns {Point} The new point, inverse-transformed through this matrix
   */
  applyInverse(e, t) {
    t = t || new oe();
    const r = this.a, i = this.b, n = this.c, a = this.d, o = this.tx, h = this.ty, l = 1 / (r * a + n * -i), c = e.x, u = e.y;
    return t.x = a * l * c + -n * l * u + (h * n - o * a) * l, t.y = r * l * u + -i * l * c + (-h * r + o * i) * l, t;
  }
  /**
   * Translates the matrix on the x and y.
   * @param x - How much to translate x by
   * @param y - How much to translate y by
   * @returns This matrix. Good for chaining method calls.
   */
  translate(e, t) {
    return this.tx += e, this.ty += t, this;
  }
  /**
   * Applies a scale transformation to the matrix.
   * @param x - The amount to scale horizontally
   * @param y - The amount to scale vertically
   * @returns This matrix. Good for chaining method calls.
   */
  scale(e, t) {
    return this.a *= e, this.d *= t, this.c *= e, this.b *= t, this.tx *= e, this.ty *= t, this;
  }
  /**
   * Applies a rotation transformation to the matrix.
   * @param angle - The angle in radians.
   * @returns This matrix. Good for chaining method calls.
   */
  rotate(e) {
    const t = Math.cos(e), r = Math.sin(e), i = this.a, n = this.c, a = this.tx;
    return this.a = i * t - this.b * r, this.b = i * r + this.b * t, this.c = n * t - this.d * r, this.d = n * r + this.d * t, this.tx = a * t - this.ty * r, this.ty = a * r + this.ty * t, this;
  }
  /**
   * Appends the given Matrix to this Matrix.
   * @param matrix - The matrix to append.
   * @returns This matrix. Good for chaining method calls.
   */
  append(e) {
    const t = this.a, r = this.b, i = this.c, n = this.d;
    return this.a = e.a * t + e.b * i, this.b = e.a * r + e.b * n, this.c = e.c * t + e.d * i, this.d = e.c * r + e.d * n, this.tx = e.tx * t + e.ty * i + this.tx, this.ty = e.tx * r + e.ty * n + this.ty, this;
  }
  /**
   * Appends two matrix's and sets the result to this matrix. AB = A * B
   * @param a - The matrix to append.
   * @param b - The matrix to append.
   * @returns This matrix. Good for chaining method calls.
   */
  appendFrom(e, t) {
    const r = e.a, i = e.b, n = e.c, a = e.d, o = e.tx, h = e.ty, l = t.a, c = t.b, u = t.c, d = t.d;
    return this.a = r * l + i * u, this.b = r * c + i * d, this.c = n * l + a * u, this.d = n * c + a * d, this.tx = o * l + h * u + t.tx, this.ty = o * c + h * d + t.ty, this;
  }
  /**
   * Sets the matrix based on all the available properties
   * @param x - Position on the x axis
   * @param y - Position on the y axis
   * @param pivotX - Pivot on the x axis
   * @param pivotY - Pivot on the y axis
   * @param scaleX - Scale on the x axis
   * @param scaleY - Scale on the y axis
   * @param rotation - Rotation in radians
   * @param skewX - Skew on the x axis
   * @param skewY - Skew on the y axis
   * @returns This matrix. Good for chaining method calls.
   */
  setTransform(e, t, r, i, n, a, o, h, l) {
    return this.a = Math.cos(o + l) * n, this.b = Math.sin(o + l) * n, this.c = -Math.sin(o - h) * a, this.d = Math.cos(o - h) * a, this.tx = e - (r * this.a + i * this.c), this.ty = t - (r * this.b + i * this.d), this;
  }
  /**
   * Prepends the given Matrix to this Matrix.
   * @param matrix - The matrix to prepend
   * @returns This matrix. Good for chaining method calls.
   */
  prepend(e) {
    const t = this.tx;
    if (e.a !== 1 || e.b !== 0 || e.c !== 0 || e.d !== 1) {
      const r = this.a, i = this.c;
      this.a = r * e.a + this.b * e.c, this.b = r * e.b + this.b * e.d, this.c = i * e.a + this.d * e.c, this.d = i * e.b + this.d * e.d;
    }
    return this.tx = t * e.a + this.ty * e.c + e.tx, this.ty = t * e.b + this.ty * e.d + e.ty, this;
  }
  /**
   * Decomposes the matrix (x, y, scaleX, scaleY, and rotation) and sets the properties on to a transform.
   * @param transform - The transform to apply the properties to.
   * @returns The transform with the newly applied properties
   */
  decompose(e) {
    const t = this.a, r = this.b, i = this.c, n = this.d, a = e.pivot, o = -Math.atan2(-i, n), h = Math.atan2(r, t), l = Math.abs(o + h);
    return l < 1e-5 || Math.abs(_c - l) < 1e-5 ? (e.rotation = h, e.skew.x = e.skew.y = 0) : (e.rotation = 0, e.skew.x = o, e.skew.y = h), e.scale.x = Math.sqrt(t * t + r * r), e.scale.y = Math.sqrt(i * i + n * n), e.position.x = this.tx + (a.x * t + a.y * i), e.position.y = this.ty + (a.x * r + a.y * n), e;
  }
  /**
   * Inverts this matrix
   * @returns This matrix. Good for chaining method calls.
   */
  invert() {
    const e = this.a, t = this.b, r = this.c, i = this.d, n = this.tx, a = e * i - t * r;
    return this.a = i / a, this.b = -t / a, this.c = -r / a, this.d = e / a, this.tx = (r * this.ty - i * n) / a, this.ty = -(e * this.ty - t * n) / a, this;
  }
  /** Checks if this matrix is an identity matrix */
  isIdentity() {
    return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.tx === 0 && this.ty === 0;
  }
  /**
   * Resets this Matrix to an identity (default) matrix.
   * @returns This matrix. Good for chaining method calls.
   */
  identity() {
    return this.a = 1, this.b = 0, this.c = 0, this.d = 1, this.tx = 0, this.ty = 0, this;
  }
  /**
   * Creates a new Matrix object with the same values as this one.
   * @returns A copy of this matrix. Good for chaining method calls.
   */
  clone() {
    const e = new L();
    return e.a = this.a, e.b = this.b, e.c = this.c, e.d = this.d, e.tx = this.tx, e.ty = this.ty, e;
  }
  /**
   * Changes the values of the given matrix to be the same as the ones in this matrix
   * @param matrix - The matrix to copy to.
   * @returns The matrix given in parameter with its values updated.
   */
  copyTo(e) {
    return e.a = this.a, e.b = this.b, e.c = this.c, e.d = this.d, e.tx = this.tx, e.ty = this.ty, e;
  }
  /**
   * Changes the values of the matrix to be the same as the ones in given matrix
   * @param matrix - The matrix to copy from.
   * @returns this
   */
  copyFrom(e) {
    return this.a = e.a, this.b = e.b, this.c = e.c, this.d = e.d, this.tx = e.tx, this.ty = e.ty, this;
  }
  /**
   * check to see if two matrices are the same
   * @param matrix - The matrix to compare to.
   */
  equals(e) {
    return e.a === this.a && e.b === this.b && e.c === this.c && e.d === this.d && e.tx === this.tx && e.ty === this.ty;
  }
  toString() {
    return `[pixi.js:Matrix a=${this.a} b=${this.b} c=${this.c} d=${this.d} tx=${this.tx} ty=${this.ty}]`;
  }
  /**
   * A default (identity) matrix.
   *
   * This is a shared object, if you want to modify it consider creating a new `Matrix`
   * @readonly
   */
  static get IDENTITY() {
    return vc.identity();
  }
  /**
   * A static Matrix that can be used to avoid creating new objects.
   * Will always ensure the matrix is reset to identity when requested.
   * Use this object for fast but temporary calculations, as it may be mutated later on.
   * This is a different object to the `IDENTITY` object and so can be modified without changing `IDENTITY`.
   * @readonly
   */
  static get shared() {
    return bc.identity();
  }
}
const bc = new L(), vc = new L(), dt = [1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1], ft = [0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1], pt = [0, -1, -1, -1, 0, 1, 1, 1, 0, 1, 1, 1, 0, -1, -1, -1], mt = [1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, 1, 1, 1, 0, -1], Ls = [], ja = [], ur = Math.sign;
function Tc() {
  for (let s = 0; s < 16; s++) {
    const e = [];
    Ls.push(e);
    for (let t = 0; t < 16; t++) {
      const r = ur(dt[s] * dt[t] + pt[s] * ft[t]), i = ur(ft[s] * dt[t] + mt[s] * ft[t]), n = ur(dt[s] * pt[t] + pt[s] * mt[t]), a = ur(ft[s] * pt[t] + mt[s] * mt[t]);
      for (let o = 0; o < 16; o++)
        if (dt[o] === r && ft[o] === i && pt[o] === n && mt[o] === a) {
          e.push(o);
          break;
        }
    }
  }
  for (let s = 0; s < 16; s++) {
    const e = new L();
    e.set(dt[s], ft[s], pt[s], mt[s], 0, 0), ja.push(e);
  }
}
Tc();
const ce = {
  /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 0°       | East      |
   * @memberof maths.groupD8
   * @constant {GD8Symmetry}
   */
  E: 0,
  /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 45°↻     | Southeast |
   * @memberof maths.groupD8
   * @constant {GD8Symmetry}
   */
  SE: 1,
  /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 90°↻     | South     |
   * @memberof maths.groupD8
   * @constant {GD8Symmetry}
   */
  S: 2,
  /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 135°↻    | Southwest |
   * @memberof maths.groupD8
   * @constant {GD8Symmetry}
   */
  SW: 3,
  /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 180°     | West      |
   * @memberof maths.groupD8
   * @constant {GD8Symmetry}
   */
  W: 4,
  /**
   * | Rotation    | Direction    |
   * |-------------|--------------|
   * | -135°/225°↻ | Northwest    |
   * @memberof maths.groupD8
   * @constant {GD8Symmetry}
   */
  NW: 5,
  /**
   * | Rotation    | Direction    |
   * |-------------|--------------|
   * | -90°/270°↻  | North        |
   * @memberof maths.groupD8
   * @constant {GD8Symmetry}
   */
  N: 6,
  /**
   * | Rotation    | Direction    |
   * |-------------|--------------|
   * | -45°/315°↻  | Northeast    |
   * @memberof maths.groupD8
   * @constant {GD8Symmetry}
   */
  NE: 7,
  /**
   * Reflection about Y-axis.
   * @memberof maths.groupD8
   * @constant {GD8Symmetry}
   */
  MIRROR_VERTICAL: 8,
  /**
   * Reflection about the main diagonal.
   * @memberof maths.groupD8
   * @constant {GD8Symmetry}
   */
  MAIN_DIAGONAL: 10,
  /**
   * Reflection about X-axis.
   * @memberof maths.groupD8
   * @constant {GD8Symmetry}
   */
  MIRROR_HORIZONTAL: 12,
  /**
   * Reflection about reverse diagonal.
   * @memberof maths.groupD8
   * @constant {GD8Symmetry}
   */
  REVERSE_DIAGONAL: 14,
  /**
   * @memberof maths.groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The X-component of the U-axis
   *    after rotating the axes.
   */
  uX: (s) => dt[s],
  /**
   * @memberof maths.groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The Y-component of the U-axis
   *    after rotating the axes.
   */
  uY: (s) => ft[s],
  /**
   * @memberof maths.groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The X-component of the V-axis
   *    after rotating the axes.
   */
  vX: (s) => pt[s],
  /**
   * @memberof maths.groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The Y-component of the V-axis
   *    after rotating the axes.
   */
  vY: (s) => mt[s],
  /**
   * @memberof maths.groupD8
   * @param {GD8Symmetry} rotation - symmetry whose opposite
   *   is needed. Only rotations have opposite symmetries while
   *   reflections don't.
   * @returns {GD8Symmetry} The opposite symmetry of `rotation`
   */
  inv: (s) => s & 8 ? s & 15 : -s & 7,
  /**
   * Composes the two D8 operations.
   *
   * Taking `^` as reflection:
   *
   * |       | E=0 | S=2 | W=4 | N=6 | E^=8 | S^=10 | W^=12 | N^=14 |
   * |-------|-----|-----|-----|-----|------|-------|-------|-------|
   * | E=0   | E   | S   | W   | N   | E^   | S^    | W^    | N^    |
   * | S=2   | S   | W   | N   | E   | S^   | W^    | N^    | E^    |
   * | W=4   | W   | N   | E   | S   | W^   | N^    | E^    | S^    |
   * | N=6   | N   | E   | S   | W   | N^   | E^    | S^    | W^    |
   * | E^=8  | E^  | N^  | W^  | S^  | E    | N     | W     | S     |
   * | S^=10 | S^  | E^  | N^  | W^  | S    | E     | N     | W     |
   * | W^=12 | W^  | S^  | E^  | N^  | W    | S     | E     | N     |
   * | N^=14 | N^  | W^  | S^  | E^  | N    | W     | S     | E     |
   *
   * [This is a Cayley table]{@link https://en.wikipedia.org/wiki/Cayley_table}
   * @memberof maths.groupD8
   * @param {GD8Symmetry} rotationSecond - Second operation, which
   *   is the row in the above cayley table.
   * @param {GD8Symmetry} rotationFirst - First operation, which
   *   is the column in the above cayley table.
   * @returns {GD8Symmetry} Composed operation
   */
  add: (s, e) => Ls[s][e],
  /**
   * Reverse of `add`.
   * @memberof maths.groupD8
   * @param {GD8Symmetry} rotationSecond - Second operation
   * @param {GD8Symmetry} rotationFirst - First operation
   * @returns {GD8Symmetry} Result
   */
  sub: (s, e) => Ls[s][ce.inv(e)],
  /**
   * Adds 180 degrees to rotation, which is a commutative
   * operation.
   * @memberof maths.groupD8
   * @param {number} rotation - The number to rotate.
   * @returns {number} Rotated number
   */
  rotate180: (s) => s ^ 4,
  /**
   * Checks if the rotation angle is vertical, i.e. south
   * or north. It doesn't work for reflections.
   * @memberof maths.groupD8
   * @param {GD8Symmetry} rotation - The number to check.
   * @returns {boolean} Whether or not the direction is vertical
   */
  isVertical: (s) => (s & 3) === 2,
  // rotation % 4 === 2
  /**
   * Approximates the vector `V(dx,dy)` into one of the
   * eight directions provided by `groupD8`.
   * @memberof maths.groupD8
   * @param {number} dx - X-component of the vector
   * @param {number} dy - Y-component of the vector
   * @returns {GD8Symmetry} Approximation of the vector into
   *  one of the eight symmetries.
   */
  byDirection: (s, e) => Math.abs(s) * 2 <= Math.abs(e) ? e >= 0 ? ce.S : ce.N : Math.abs(e) * 2 <= Math.abs(s) ? s > 0 ? ce.E : ce.W : e > 0 ? s > 0 ? ce.SE : ce.SW : s > 0 ? ce.NE : ce.NW,
  /**
   * Helps sprite to compensate texture packer rotation.
   * @memberof maths.groupD8
   * @param {Matrix} matrix - sprite world matrix
   * @param {GD8Symmetry} rotation - The rotation factor to use.
   * @param {number} tx - sprite anchoring
   * @param {number} ty - sprite anchoring
   */
  matrixAppendRotationInv: (s, e, t = 0, r = 0) => {
    const i = ja[ce.inv(e)];
    i.tx = t, i.ty = r, s.append(i);
  }
}, dr = [new oe(), new oe(), new oe(), new oe()];
class ne {
  /**
   * @param x - The X coordinate of the upper-left corner of the rectangle
   * @param y - The Y coordinate of the upper-left corner of the rectangle
   * @param width - The overall width of the rectangle
   * @param height - The overall height of the rectangle
   */
  constructor(e = 0, t = 0, r = 0, i = 0) {
    this.type = "rectangle", this.x = Number(e), this.y = Number(t), this.width = Number(r), this.height = Number(i);
  }
  /** Returns the left edge of the rectangle. */
  get left() {
    return this.x;
  }
  /** Returns the right edge of the rectangle. */
  get right() {
    return this.x + this.width;
  }
  /** Returns the top edge of the rectangle. */
  get top() {
    return this.y;
  }
  /** Returns the bottom edge of the rectangle. */
  get bottom() {
    return this.y + this.height;
  }
  /** Determines whether the Rectangle is empty. */
  isEmpty() {
    return this.left === this.right || this.top === this.bottom;
  }
  /** A constant empty rectangle. This is a new object every time the property is accessed */
  static get EMPTY() {
    return new ne(0, 0, 0, 0);
  }
  /**
   * Creates a clone of this Rectangle
   * @returns a copy of the rectangle
   */
  clone() {
    return new ne(this.x, this.y, this.width, this.height);
  }
  /**
   * Converts a Bounds object to a Rectangle object.
   * @param bounds - The bounds to copy and convert to a rectangle.
   * @returns Returns itself.
   */
  copyFromBounds(e) {
    return this.x = e.minX, this.y = e.minY, this.width = e.maxX - e.minX, this.height = e.maxY - e.minY, this;
  }
  /**
   * Copies another rectangle to this one.
   * @param rectangle - The rectangle to copy from.
   * @returns Returns itself.
   */
  copyFrom(e) {
    return this.x = e.x, this.y = e.y, this.width = e.width, this.height = e.height, this;
  }
  /**
   * Copies this rectangle to another one.
   * @param rectangle - The rectangle to copy to.
   * @returns Returns given parameter.
   */
  copyTo(e) {
    return e.copyFrom(this), e;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this Rectangle
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coordinates are within this Rectangle
   */
  contains(e, t) {
    return this.width <= 0 || this.height <= 0 ? !1 : e >= this.x && e < this.x + this.width && t >= this.y && t < this.y + this.height;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this rectangle including the stroke.
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke, 0.5 by default
   * @returns Whether the x/y coordinates are within this rectangle
   */
  strokeContains(e, t, r, i = 0.5) {
    const { width: n, height: a } = this;
    if (n <= 0 || a <= 0)
      return !1;
    const o = this.x, h = this.y, l = r * (1 - i), c = r - l, u = o - l, d = o + n + l, f = h - l, p = h + a + l, g = o + c, m = o + n - c, y = h + c, T = h + a - c;
    return e >= u && e <= d && t >= f && t <= p && !(e > g && e < m && t > y && t < T);
  }
  /**
   * Determines whether the `other` Rectangle transformed by `transform` intersects with `this` Rectangle object.
   * Returns true only if the area of the intersection is >0, this means that Rectangles
   * sharing a side are not overlapping. Another side effect is that an arealess rectangle
   * (width or height equal to zero) can't intersect any other rectangle.
   * @param {Rectangle} other - The Rectangle to intersect with `this`.
   * @param {Matrix} transform - The transformation matrix of `other`.
   * @returns {boolean} A value of `true` if the transformed `other` Rectangle intersects with `this`; otherwise `false`.
   */
  intersects(e, t) {
    if (!t) {
      const N = this.x < e.x ? e.x : this.x;
      if ((this.right > e.right ? e.right : this.right) <= N)
        return !1;
      const k = this.y < e.y ? e.y : this.y;
      return (this.bottom > e.bottom ? e.bottom : this.bottom) > k;
    }
    const r = this.left, i = this.right, n = this.top, a = this.bottom;
    if (i <= r || a <= n)
      return !1;
    const o = dr[0].set(e.left, e.top), h = dr[1].set(e.left, e.bottom), l = dr[2].set(e.right, e.top), c = dr[3].set(e.right, e.bottom);
    if (l.x <= o.x || h.y <= o.y)
      return !1;
    const u = Math.sign(t.a * t.d - t.b * t.c);
    if (u === 0 || (t.apply(o, o), t.apply(h, h), t.apply(l, l), t.apply(c, c), Math.max(o.x, h.x, l.x, c.x) <= r || Math.min(o.x, h.x, l.x, c.x) >= i || Math.max(o.y, h.y, l.y, c.y) <= n || Math.min(o.y, h.y, l.y, c.y) >= a))
      return !1;
    const d = u * (h.y - o.y), f = u * (o.x - h.x), p = d * r + f * n, g = d * i + f * n, m = d * r + f * a, y = d * i + f * a;
    if (Math.max(p, g, m, y) <= d * o.x + f * o.y || Math.min(p, g, m, y) >= d * c.x + f * c.y)
      return !1;
    const T = u * (o.y - l.y), S = u * (l.x - o.x), A = T * r + S * n, M = T * i + S * n, P = T * r + S * a, E = T * i + S * a;
    return !(Math.max(A, M, P, E) <= T * o.x + S * o.y || Math.min(A, M, P, E) >= T * c.x + S * c.y);
  }
  /**
   * Pads the rectangle making it grow in all directions.
   * If paddingY is omitted, both paddingX and paddingY will be set to paddingX.
   * @param paddingX - The horizontal padding amount.
   * @param paddingY - The vertical padding amount.
   * @returns Returns itself.
   */
  pad(e = 0, t = e) {
    return this.x -= e, this.y -= t, this.width += e * 2, this.height += t * 2, this;
  }
  /**
   * Fits this rectangle around the passed one.
   * @param rectangle - The rectangle to fit.
   * @returns Returns itself.
   */
  fit(e) {
    const t = Math.max(this.x, e.x), r = Math.min(this.x + this.width, e.x + e.width), i = Math.max(this.y, e.y), n = Math.min(this.y + this.height, e.y + e.height);
    return this.x = t, this.width = Math.max(r - t, 0), this.y = i, this.height = Math.max(n - i, 0), this;
  }
  /**
   * Enlarges rectangle that way its corners lie on grid
   * @param resolution - resolution
   * @param eps - precision
   * @returns Returns itself.
   */
  ceil(e = 1, t = 1e-3) {
    const r = Math.ceil((this.x + this.width - t) * e) / e, i = Math.ceil((this.y + this.height - t) * e) / e;
    return this.x = Math.floor((this.x + t) * e) / e, this.y = Math.floor((this.y + t) * e) / e, this.width = r - this.x, this.height = i - this.y, this;
  }
  /**
   * Enlarges this rectangle to include the passed rectangle.
   * @param rectangle - The rectangle to include.
   * @returns Returns itself.
   */
  enlarge(e) {
    const t = Math.min(this.x, e.x), r = Math.max(this.x + this.width, e.x + e.width), i = Math.min(this.y, e.y), n = Math.max(this.y + this.height, e.y + e.height);
    return this.x = t, this.width = r - t, this.y = i, this.height = n - i, this;
  }
  /**
   * Returns the framing rectangle of the rectangle as a Rectangle object
   * @param out - optional rectangle to store the result
   * @returns The framing rectangle
   */
  getBounds(e) {
    return e || (e = new ne()), e.copyFrom(this), e;
  }
  /**
   * Checks if this rectangle fully contains another rectangle.
   *
   * A rectangle contains another rectangle if all four corners of the other rectangle
   * lie within the bounds of this rectangle.
   *
   * ```ts
   * const container = new Rectangle(0, 0, 100, 100);
   * const inside = new Rectangle(25, 25, 50, 50);
   * const partial = new Rectangle(75, 75, 50, 50);
   *
   * container.containsRect(inside); // Returns true
   * container.containsRect(partial); // Returns false - partial overlap
   * ```
   *
   * Note: If either rectangle has a width or height of 0, this method returns false
   * since a zero-area rectangle cannot meaningfully contain another rectangle.
   * @param other - The rectangle to check if it is contained within this one
   * @returns True if the other rectangle is fully contained within this one
   */
  containsRect(e) {
    if (this.width <= 0 || this.height <= 0)
      return !1;
    const t = e.x, r = e.y, i = e.x + e.width, n = e.y + e.height;
    return t >= this.x && t < this.x + this.width && r >= this.y && r < this.y + this.height && i >= this.x && i < this.x + this.width && n >= this.y && n < this.y + this.height;
  }
  toString() {
    return `[pixi.js/math:Rectangle x=${this.x} y=${this.y} width=${this.width} height=${this.height}]`;
  }
}
const qr = {
  default: -1
};
function le(s = "default") {
  return qr[s] === void 0 && (qr[s] = -1), ++qr[s];
}
const sn = {}, Y = "8.0.0", Sc = "8.3.4";
function X(s, e, t = 3) {
  if (sn[e])
    return;
  let r = new Error().stack;
  typeof r > "u" ? console.warn("PixiJS Deprecation Warning: ", `${e}
Deprecated since v${s}`) : (r = r.split(`
`).splice(t).join(`
`), console.groupCollapsed ? (console.groupCollapsed(
    "%cPixiJS Deprecation Warning: %c%s",
    "color:#614108;background:#fffbe6",
    "font-weight:normal;color:#614108;background:#fffbe6",
    `${e}
Deprecated since v${s}`
  ), console.warn(r), console.groupEnd()) : (console.warn("PixiJS Deprecation Warning: ", `${e}
Deprecated since v${s}`), console.warn(r))), sn[e] = !0;
}
const Ya = () => {
};
function Et(s) {
  return s += s === 0 ? 1 : 0, --s, s |= s >>> 1, s |= s >>> 2, s |= s >>> 4, s |= s >>> 8, s |= s >>> 16, s + 1;
}
function nn(s) {
  return !(s & s - 1) && !!s;
}
function Ka(s) {
  const e = {};
  for (const t in s)
    s[t] !== void 0 && (e[t] = s[t]);
  return e;
}
const an = /* @__PURE__ */ Object.create(null);
function wc(s) {
  const e = an[s];
  return e === void 0 && (an[s] = le("resource")), e;
}
const qa = class Za extends Me {
  /**
   * @param options - options for the style
   */
  constructor(e = {}) {
    super(), this._resourceType = "textureSampler", this._touched = 0, this._maxAnisotropy = 1, this.destroyed = !1, e = { ...Za.defaultOptions, ...e }, this.addressMode = e.addressMode, this.addressModeU = e.addressModeU ?? this.addressModeU, this.addressModeV = e.addressModeV ?? this.addressModeV, this.addressModeW = e.addressModeW ?? this.addressModeW, this.scaleMode = e.scaleMode, this.magFilter = e.magFilter ?? this.magFilter, this.minFilter = e.minFilter ?? this.minFilter, this.mipmapFilter = e.mipmapFilter ?? this.mipmapFilter, this.lodMinClamp = e.lodMinClamp, this.lodMaxClamp = e.lodMaxClamp, this.compare = e.compare, this.maxAnisotropy = e.maxAnisotropy ?? 1;
  }
  set addressMode(e) {
    this.addressModeU = e, this.addressModeV = e, this.addressModeW = e;
  }
  /** setting this will set wrapModeU,wrapModeV and wrapModeW all at once! */
  get addressMode() {
    return this.addressModeU;
  }
  set wrapMode(e) {
    X(Y, "TextureStyle.wrapMode is now TextureStyle.addressMode"), this.addressMode = e;
  }
  get wrapMode() {
    return this.addressMode;
  }
  set scaleMode(e) {
    this.magFilter = e, this.minFilter = e, this.mipmapFilter = e;
  }
  /** setting this will set magFilter,minFilter and mipmapFilter all at once!  */
  get scaleMode() {
    return this.magFilter;
  }
  /** Specifies the maximum anisotropy value clamp used by the sampler. */
  set maxAnisotropy(e) {
    this._maxAnisotropy = Math.min(e, 16), this._maxAnisotropy > 1 && (this.scaleMode = "linear");
  }
  get maxAnisotropy() {
    return this._maxAnisotropy;
  }
  // TODO - move this to WebGL?
  get _resourceId() {
    return this._sharedResourceId || this._generateResourceId();
  }
  update() {
    this.emit("change", this), this._sharedResourceId = null;
  }
  _generateResourceId() {
    const e = `${this.addressModeU}-${this.addressModeV}-${this.addressModeW}-${this.magFilter}-${this.minFilter}-${this.mipmapFilter}-${this.lodMinClamp}-${this.lodMaxClamp}-${this.compare}-${this._maxAnisotropy}`;
    return this._sharedResourceId = wc(e), this._resourceId;
  }
  /** Destroys the style */
  destroy() {
    this.destroyed = !0, this.emit("destroy", this), this.emit("change", this), this.removeAllListeners();
  }
};
qa.defaultOptions = {
  addressMode: "clamp-to-edge",
  scaleMode: "linear"
};
let Qa = qa;
const Ja = class eo extends Me {
  /**
   * @param options - options for creating a new TextureSource
   */
  constructor(e = {}) {
    super(), this.options = e, this.uid = le("textureSource"), this._resourceType = "textureSource", this._resourceId = le("resource"), this.uploadMethodId = "unknown", this._resolution = 1, this.pixelWidth = 1, this.pixelHeight = 1, this.width = 1, this.height = 1, this.sampleCount = 1, this.mipLevelCount = 1, this.autoGenerateMipmaps = !1, this.format = "rgba8unorm", this.dimension = "2d", this.antialias = !1, this._touched = 0, this._batchTick = -1, this._textureBindLocation = -1, e = { ...eo.defaultOptions, ...e }, this.label = e.label ?? "", this.resource = e.resource, this.autoGarbageCollect = e.autoGarbageCollect, this._resolution = e.resolution, e.width ? this.pixelWidth = e.width * this._resolution : this.pixelWidth = this.resource ? this.resourceWidth ?? 1 : 1, e.height ? this.pixelHeight = e.height * this._resolution : this.pixelHeight = this.resource ? this.resourceHeight ?? 1 : 1, this.width = this.pixelWidth / this._resolution, this.height = this.pixelHeight / this._resolution, this.format = e.format, this.dimension = e.dimensions, this.mipLevelCount = e.mipLevelCount, this.autoGenerateMipmaps = e.autoGenerateMipmaps, this.sampleCount = e.sampleCount, this.antialias = e.antialias, this.alphaMode = e.alphaMode, this.style = new Qa(Ka(e)), this.destroyed = !1, this._refreshPOT();
  }
  /** returns itself */
  get source() {
    return this;
  }
  /** the style of the texture */
  get style() {
    return this._style;
  }
  set style(e) {
    var t, r;
    this.style !== e && ((t = this._style) == null || t.off("change", this._onStyleChange, this), this._style = e, (r = this._style) == null || r.on("change", this._onStyleChange, this), this._onStyleChange());
  }
  /** setting this will set wrapModeU,wrapModeV and wrapModeW all at once! */
  get addressMode() {
    return this._style.addressMode;
  }
  set addressMode(e) {
    this._style.addressMode = e;
  }
  /** setting this will set wrapModeU,wrapModeV and wrapModeW all at once! */
  get repeatMode() {
    return this._style.addressMode;
  }
  set repeatMode(e) {
    this._style.addressMode = e;
  }
  /** Specifies the sampling behavior when the sample footprint is smaller than or equal to one texel. */
  get magFilter() {
    return this._style.magFilter;
  }
  set magFilter(e) {
    this._style.magFilter = e;
  }
  /** Specifies the sampling behavior when the sample footprint is larger than one texel. */
  get minFilter() {
    return this._style.minFilter;
  }
  set minFilter(e) {
    this._style.minFilter = e;
  }
  /** Specifies behavior for sampling between mipmap levels. */
  get mipmapFilter() {
    return this._style.mipmapFilter;
  }
  set mipmapFilter(e) {
    this._style.mipmapFilter = e;
  }
  /** Specifies the minimum and maximum levels of detail, respectively, used internally when sampling a texture. */
  get lodMinClamp() {
    return this._style.lodMinClamp;
  }
  set lodMinClamp(e) {
    this._style.lodMinClamp = e;
  }
  /** Specifies the minimum and maximum levels of detail, respectively, used internally when sampling a texture. */
  get lodMaxClamp() {
    return this._style.lodMaxClamp;
  }
  set lodMaxClamp(e) {
    this._style.lodMaxClamp = e;
  }
  _onStyleChange() {
    this.emit("styleChange", this);
  }
  /** call this if you have modified the texture outside of the constructor */
  update() {
    if (this.resource) {
      const e = this._resolution;
      if (this.resize(this.resourceWidth / e, this.resourceHeight / e))
        return;
    }
    this.emit("update", this);
  }
  /** Destroys this texture source */
  destroy() {
    this.destroyed = !0, this.emit("destroy", this), this.emit("change", this), this._style && (this._style.destroy(), this._style = null), this.uploadMethodId = null, this.resource = null, this.removeAllListeners();
  }
  /**
   * This will unload the Texture source from the GPU. This will free up the GPU memory
   * As soon as it is required fore rendering, it will be re-uploaded.
   */
  unload() {
    this._resourceId = le("resource"), this.emit("change", this), this.emit("unload", this);
  }
  /** the width of the resource. This is the REAL pure number, not accounting resolution   */
  get resourceWidth() {
    const { resource: e } = this;
    return e.naturalWidth || e.videoWidth || e.displayWidth || e.width;
  }
  /** the height of the resource. This is the REAL pure number, not accounting resolution */
  get resourceHeight() {
    const { resource: e } = this;
    return e.naturalHeight || e.videoHeight || e.displayHeight || e.height;
  }
  /**
   * the resolution of the texture. Changing this number, will not change the number of pixels in the actual texture
   * but will the size of the texture when rendered.
   *
   * changing the resolution of this texture to 2 for example will make it appear twice as small when rendered (as pixel
   * density will have increased)
   */
  get resolution() {
    return this._resolution;
  }
  set resolution(e) {
    this._resolution !== e && (this._resolution = e, this.width = this.pixelWidth / e, this.height = this.pixelHeight / e);
  }
  /**
   * Resize the texture, this is handy if you want to use the texture as a render texture
   * @param width - the new width of the texture
   * @param height - the new height of the texture
   * @param resolution - the new resolution of the texture
   * @returns - if the texture was resized
   */
  resize(e, t, r) {
    r || (r = this._resolution), e || (e = this.width), t || (t = this.height);
    const i = Math.round(e * r), n = Math.round(t * r);
    return this.width = i / r, this.height = n / r, this._resolution = r, this.pixelWidth === i && this.pixelHeight === n ? !1 : (this._refreshPOT(), this.pixelWidth = i, this.pixelHeight = n, this.emit("resize", this), this._resourceId = le("resource"), this.emit("change", this), !0);
  }
  /**
   * Lets the renderer know that this texture has been updated and its mipmaps should be re-generated.
   * This is only important for RenderTexture instances, as standard Texture instances will have their
   * mipmaps generated on upload. You should call this method after you make any change to the texture
   *
   * The reason for this is is can be quite expensive to update mipmaps for a texture. So by default,
   * We want you, the developer to specify when this action should happen.
   *
   * Generally you don't want to have mipmaps generated on Render targets that are changed every frame,
   */
  updateMipmaps() {
    this.autoGenerateMipmaps && this.mipLevelCount > 1 && this.emit("updateMipmaps", this);
  }
  set wrapMode(e) {
    this._style.wrapMode = e;
  }
  get wrapMode() {
    return this._style.wrapMode;
  }
  set scaleMode(e) {
    this._style.scaleMode = e;
  }
  /** setting this will set magFilter,minFilter and mipmapFilter all at once!  */
  get scaleMode() {
    return this._style.scaleMode;
  }
  /**
   * Refresh check for isPowerOfTwo texture based on size
   * @private
   */
  _refreshPOT() {
    this.isPowerOfTwo = nn(this.pixelWidth) && nn(this.pixelHeight);
  }
  static test(e) {
    throw new Error("Unimplemented");
  }
};
Ja.defaultOptions = {
  resolution: 1,
  format: "bgra8unorm",
  alphaMode: "premultiply-alpha-on-upload",
  dimensions: "2d",
  mipLevelCount: 1,
  autoGenerateMipmaps: !1,
  sampleCount: 1,
  antialias: !1,
  autoGarbageCollect: !1
};
let me = Ja;
class di extends me {
  constructor(e) {
    const t = e.resource || new Float32Array(e.width * e.height * 4);
    let r = e.format;
    r || (t instanceof Float32Array ? r = "rgba32float" : t instanceof Int32Array || t instanceof Uint32Array ? r = "rgba32uint" : t instanceof Int16Array || t instanceof Uint16Array ? r = "rgba16uint" : (t instanceof Int8Array, r = "bgra8unorm")), super({
      ...e,
      resource: t,
      format: r
    }), this.uploadMethodId = "buffer";
  }
  static test(e) {
    return e instanceof Int8Array || e instanceof Uint8Array || e instanceof Uint8ClampedArray || e instanceof Int16Array || e instanceof Uint16Array || e instanceof Int32Array || e instanceof Uint32Array || e instanceof Float32Array;
  }
}
di.extension = v.TextureSource;
const on = new L();
class to {
  /**
   * @param texture - observed texture
   * @param clampMargin - Changes frame clamping, 0.5 by default. Use -0.5 for extra border.
   */
  constructor(e, t) {
    this.mapCoord = new L(), this.uClampFrame = new Float32Array(4), this.uClampOffset = new Float32Array(2), this._textureID = -1, this._updateID = 0, this.clampOffset = 0, typeof t > "u" ? this.clampMargin = e.width < 10 ? 0 : 0.5 : this.clampMargin = t, this.isSimple = !1, this.texture = e;
  }
  /** Texture property. */
  get texture() {
    return this._texture;
  }
  set texture(e) {
    var t;
    this.texture !== e && ((t = this._texture) == null || t.removeListener("update", this.update, this), this._texture = e, this._texture.addListener("update", this.update, this), this.update());
  }
  /**
   * Multiplies uvs array to transform
   * @param uvs - mesh uvs
   * @param [out=uvs] - output
   * @returns - output
   */
  multiplyUvs(e, t) {
    t === void 0 && (t = e);
    const r = this.mapCoord;
    for (let i = 0; i < e.length; i += 2) {
      const n = e[i], a = e[i + 1];
      t[i] = n * r.a + a * r.c + r.tx, t[i + 1] = n * r.b + a * r.d + r.ty;
    }
    return t;
  }
  /**
   * Updates matrices if texture was changed
   * @returns - whether or not it was updated
   */
  update() {
    const e = this._texture;
    this._updateID++;
    const t = e.uvs;
    this.mapCoord.set(t.x1 - t.x0, t.y1 - t.y0, t.x3 - t.x0, t.y3 - t.y0, t.x0, t.y0);
    const r = e.orig, i = e.trim;
    i && (on.set(
      r.width / i.width,
      0,
      0,
      r.height / i.height,
      -i.x / i.width,
      -i.y / i.height
    ), this.mapCoord.append(on));
    const n = e.source, a = this.uClampFrame, o = this.clampMargin / n._resolution, h = this.clampOffset / n._resolution;
    return a[0] = (e.frame.x + o + h) / n.width, a[1] = (e.frame.y + o + h) / n.height, a[2] = (e.frame.x + e.frame.width - o + h) / n.width, a[3] = (e.frame.y + e.frame.height - o + h) / n.height, this.uClampOffset[0] = this.clampOffset / n.pixelWidth, this.uClampOffset[1] = this.clampOffset / n.pixelHeight, this.isSimple = e.frame.width === n.width && e.frame.height === n.height && e.rotate === 0, !0;
  }
}
class D extends Me {
  /**
   * @param {rendering.TextureOptions} options - Options for the texture
   */
  constructor({
    source: e,
    label: t,
    frame: r,
    orig: i,
    trim: n,
    defaultAnchor: a,
    defaultBorders: o,
    rotate: h,
    dynamic: l
  } = {}) {
    if (super(), this.uid = le("texture"), this.uvs = { x0: 0, y0: 0, x1: 0, y1: 0, x2: 0, y2: 0, x3: 0, y3: 0 }, this.frame = new ne(), this.noFrame = !1, this.dynamic = !1, this.isTexture = !0, this.label = t, this.source = (e == null ? void 0 : e.source) ?? new me(), this.noFrame = !r, r)
      this.frame.copyFrom(r);
    else {
      const { width: c, height: u } = this._source;
      this.frame.width = c, this.frame.height = u;
    }
    this.orig = i || this.frame, this.trim = n, this.rotate = h ?? 0, this.defaultAnchor = a, this.defaultBorders = o, this.destroyed = !1, this.dynamic = l || !1, this.updateUvs();
  }
  set source(e) {
    this._source && this._source.off("resize", this.update, this), this._source = e, e.on("resize", this.update, this), this.emit("update", this);
  }
  /** the underlying source of the texture (equivalent of baseTexture in v7) */
  get source() {
    return this._source;
  }
  /** returns a TextureMatrix instance for this texture. By default, that object is not created because its heavy. */
  get textureMatrix() {
    return this._textureMatrix || (this._textureMatrix = new to(this)), this._textureMatrix;
  }
  /** The width of the Texture in pixels. */
  get width() {
    return this.orig.width;
  }
  /** The height of the Texture in pixels. */
  get height() {
    return this.orig.height;
  }
  /** Call this function when you have modified the frame of this texture. */
  updateUvs() {
    const { uvs: e, frame: t } = this, { width: r, height: i } = this._source, n = t.x / r, a = t.y / i, o = t.width / r, h = t.height / i;
    let l = this.rotate;
    if (l) {
      const c = o / 2, u = h / 2, d = n + c, f = a + u;
      l = ce.add(l, ce.NW), e.x0 = d + c * ce.uX(l), e.y0 = f + u * ce.uY(l), l = ce.add(l, 2), e.x1 = d + c * ce.uX(l), e.y1 = f + u * ce.uY(l), l = ce.add(l, 2), e.x2 = d + c * ce.uX(l), e.y2 = f + u * ce.uY(l), l = ce.add(l, 2), e.x3 = d + c * ce.uX(l), e.y3 = f + u * ce.uY(l);
    } else
      e.x0 = n, e.y0 = a, e.x1 = n + o, e.y1 = a, e.x2 = n + o, e.y2 = a + h, e.x3 = n, e.y3 = a + h;
  }
  /**
   * Destroys this texture
   * @param destroySource - Destroy the source when the texture is destroyed.
   */
  destroy(e = !1) {
    this._source && e && (this._source.destroy(), this._source = null), this._textureMatrix = null, this.destroyed = !0, this.emit("destroy", this), this.removeAllListeners();
  }
  /**
   * Call this if you have modified the `texture outside` of the constructor.
   *
   * If you have modified this texture's source, you must separately call `texture.source.update()` to see those changes.
   */
  update() {
    this.noFrame && (this.frame.width = this._source.width, this.frame.height = this._source.height), this.updateUvs(), this.emit("update", this);
  }
  /** @deprecated since 8.0.0 */
  get baseTexture() {
    return X(Y, "Texture.baseTexture is now Texture.source"), this._source;
  }
}
D.EMPTY = new D({
  label: "EMPTY",
  source: new me({
    label: "EMPTY"
  })
});
D.EMPTY.destroy = Ya;
D.WHITE = new D({
  source: new di({
    resource: new Uint8Array([255, 255, 255, 255]),
    width: 1,
    height: 1,
    alphaMode: "premultiply-alpha-on-upload",
    label: "WHITE"
  }),
  label: "WHITE"
});
D.WHITE.destroy = Ya;
function ro(s, e, t) {
  const { width: r, height: i } = t.orig, n = t.trim;
  if (n) {
    const a = n.width, o = n.height;
    s.minX = n.x - e._x * r, s.maxX = s.minX + a, s.minY = n.y - e._y * i, s.maxY = s.minY + o;
  } else
    s.minX = -e._x * r, s.maxX = s.minX + r, s.minY = -e._y * i, s.maxY = s.minY + i;
}
const hn = new L();
class ye {
  constructor(e = 1 / 0, t = 1 / 0, r = -1 / 0, i = -1 / 0) {
    this.minX = 1 / 0, this.minY = 1 / 0, this.maxX = -1 / 0, this.maxY = -1 / 0, this.matrix = hn, this.minX = e, this.minY = t, this.maxX = r, this.maxY = i;
  }
  /**
   * Checks if bounds are empty.
   * @returns - True if empty.
   */
  isEmpty() {
    return this.minX > this.maxX || this.minY > this.maxY;
  }
  /** The bounding rectangle of the bounds. */
  get rectangle() {
    this._rectangle || (this._rectangle = new ne());
    const e = this._rectangle;
    return this.minX > this.maxX || this.minY > this.maxY ? (e.x = 0, e.y = 0, e.width = 0, e.height = 0) : e.copyFromBounds(this), e;
  }
  /** Clears the bounds and resets. */
  clear() {
    return this.minX = 1 / 0, this.minY = 1 / 0, this.maxX = -1 / 0, this.maxY = -1 / 0, this.matrix = hn, this;
  }
  /**
   * Sets the bounds.
   * @param x0 - left X of frame
   * @param y0 - top Y of frame
   * @param x1 - right X of frame
   * @param y1 - bottom Y of frame
   */
  set(e, t, r, i) {
    this.minX = e, this.minY = t, this.maxX = r, this.maxY = i;
  }
  /**
   * Adds sprite frame
   * @param x0 - left X of frame
   * @param y0 - top Y of frame
   * @param x1 - right X of frame
   * @param y1 - bottom Y of frame
   * @param matrix
   */
  addFrame(e, t, r, i, n) {
    n || (n = this.matrix);
    const a = n.a, o = n.b, h = n.c, l = n.d, c = n.tx, u = n.ty;
    let d = this.minX, f = this.minY, p = this.maxX, g = this.maxY, m = a * e + h * t + c, y = o * e + l * t + u;
    m < d && (d = m), y < f && (f = y), m > p && (p = m), y > g && (g = y), m = a * r + h * t + c, y = o * r + l * t + u, m < d && (d = m), y < f && (f = y), m > p && (p = m), y > g && (g = y), m = a * e + h * i + c, y = o * e + l * i + u, m < d && (d = m), y < f && (f = y), m > p && (p = m), y > g && (g = y), m = a * r + h * i + c, y = o * r + l * i + u, m < d && (d = m), y < f && (f = y), m > p && (p = m), y > g && (g = y), this.minX = d, this.minY = f, this.maxX = p, this.maxY = g;
  }
  /**
   * Adds a rectangle to the bounds.
   * @param rect - The rectangle to be added.
   * @param matrix - The matrix to apply to the bounds.
   */
  addRect(e, t) {
    this.addFrame(e.x, e.y, e.x + e.width, e.y + e.height, t);
  }
  /**
   * Adds other {@link Bounds}.
   * @param bounds - The Bounds to be added
   * @param matrix
   */
  addBounds(e, t) {
    this.addFrame(e.minX, e.minY, e.maxX, e.maxY, t);
  }
  /**
   * Adds other Bounds, masked with Bounds.
   * @param mask - The Bounds to be added.
   */
  addBoundsMask(e) {
    this.minX = this.minX > e.minX ? this.minX : e.minX, this.minY = this.minY > e.minY ? this.minY : e.minY, this.maxX = this.maxX < e.maxX ? this.maxX : e.maxX, this.maxY = this.maxY < e.maxY ? this.maxY : e.maxY;
  }
  /**
   * Adds other Bounds, multiplied with matrix.
   * @param matrix - The matrix to apply to the bounds.
   */
  applyMatrix(e) {
    const t = this.minX, r = this.minY, i = this.maxX, n = this.maxY, { a, b: o, c: h, d: l, tx: c, ty: u } = e;
    let d = a * t + h * r + c, f = o * t + l * r + u;
    this.minX = d, this.minY = f, this.maxX = d, this.maxY = f, d = a * i + h * r + c, f = o * i + l * r + u, this.minX = d < this.minX ? d : this.minX, this.minY = f < this.minY ? f : this.minY, this.maxX = d > this.maxX ? d : this.maxX, this.maxY = f > this.maxY ? f : this.maxY, d = a * t + h * n + c, f = o * t + l * n + u, this.minX = d < this.minX ? d : this.minX, this.minY = f < this.minY ? f : this.minY, this.maxX = d > this.maxX ? d : this.maxX, this.maxY = f > this.maxY ? f : this.maxY, d = a * i + h * n + c, f = o * i + l * n + u, this.minX = d < this.minX ? d : this.minX, this.minY = f < this.minY ? f : this.minY, this.maxX = d > this.maxX ? d : this.maxX, this.maxY = f > this.maxY ? f : this.maxY;
  }
  /**
   * Resizes the bounds object to include the given rectangle.
   * @param rect - The rectangle to be included.
   */
  fit(e) {
    return this.minX < e.left && (this.minX = e.left), this.maxX > e.right && (this.maxX = e.right), this.minY < e.top && (this.minY = e.top), this.maxY > e.bottom && (this.maxY = e.bottom), this;
  }
  /**
   * Resizes the bounds object to include the given bounds.
   * @param left - The left value of the bounds.
   * @param right - The right value of the bounds.
   * @param top - The top value of the bounds.
   * @param bottom - The bottom value of the bounds.
   */
  fitBounds(e, t, r, i) {
    return this.minX < e && (this.minX = e), this.maxX > t && (this.maxX = t), this.minY < r && (this.minY = r), this.maxY > i && (this.maxY = i), this;
  }
  /**
   * Pads bounds object, making it grow in all directions.
   * If paddingY is omitted, both paddingX and paddingY will be set to paddingX.
   * @param paddingX - The horizontal padding amount.
   * @param paddingY - The vertical padding amount.
   */
  pad(e, t = e) {
    return this.minX -= e, this.maxX += e, this.minY -= t, this.maxY += t, this;
  }
  /** Ceils the bounds. */
  ceil() {
    return this.minX = Math.floor(this.minX), this.minY = Math.floor(this.minY), this.maxX = Math.ceil(this.maxX), this.maxY = Math.ceil(this.maxY), this;
  }
  /** Clones the bounds. */
  clone() {
    return new ye(this.minX, this.minY, this.maxX, this.maxY);
  }
  /**
   * Scales the bounds by the given values
   * @param x - The X value to scale by.
   * @param y - The Y value to scale by.
   */
  scale(e, t = e) {
    return this.minX *= e, this.minY *= t, this.maxX *= e, this.maxY *= t, this;
  }
  /** the x value of the bounds. */
  get x() {
    return this.minX;
  }
  set x(e) {
    const t = this.maxX - this.minX;
    this.minX = e, this.maxX = e + t;
  }
  /** the y value of the bounds. */
  get y() {
    return this.minY;
  }
  set y(e) {
    const t = this.maxY - this.minY;
    this.minY = e, this.maxY = e + t;
  }
  /** the width value of the bounds. */
  get width() {
    return this.maxX - this.minX;
  }
  set width(e) {
    this.maxX = this.minX + e;
  }
  /** the height value of the bounds. */
  get height() {
    return this.maxY - this.minY;
  }
  set height(e) {
    this.maxY = this.minY + e;
  }
  /** the left value of the bounds. */
  get left() {
    return this.minX;
  }
  /** the right value of the bounds. */
  get right() {
    return this.maxX;
  }
  /** the top value of the bounds. */
  get top() {
    return this.minY;
  }
  /** the bottom value of the bounds. */
  get bottom() {
    return this.maxY;
  }
  /** Is the bounds positive. */
  get isPositive() {
    return this.maxX - this.minX > 0 && this.maxY - this.minY > 0;
  }
  get isValid() {
    return this.minX + this.minY !== 1 / 0;
  }
  /**
   * Adds screen vertices from array
   * @param vertexData - calculated vertices
   * @param beginOffset - begin offset
   * @param endOffset - end offset, excluded
   * @param matrix
   */
  addVertexData(e, t, r, i) {
    let n = this.minX, a = this.minY, o = this.maxX, h = this.maxY;
    i || (i = this.matrix);
    const l = i.a, c = i.b, u = i.c, d = i.d, f = i.tx, p = i.ty;
    for (let g = t; g < r; g += 2) {
      const m = e[g], y = e[g + 1], T = l * m + u * y + f, S = c * m + d * y + p;
      n = T < n ? T : n, a = S < a ? S : a, o = T > o ? T : o, h = S > h ? S : h;
    }
    this.minX = n, this.minY = a, this.maxX = o, this.maxY = h;
  }
  /**
   * Checks if the point is contained within the bounds.
   * @param x - x coordinate
   * @param y - y coordinate
   */
  containsPoint(e, t) {
    return this.minX <= e && this.minY <= t && this.maxX >= e && this.maxY >= t;
  }
  toString() {
    return `[pixi.js:Bounds minX=${this.minX} minY=${this.minY} maxX=${this.maxX} maxY=${this.maxY} width=${this.width} height=${this.height}]`;
  }
  /**
   * Copies the bounds from another bounds object.
   * @param bounds - The bounds to copy from.
   * @returns - This bounds object.
   */
  copyFrom(e) {
    return this.minX = e.minX, this.minY = e.minY, this.maxX = e.maxX, this.maxY = e.maxY, this;
  }
}
var Ac = { grad: 0.9, turn: 360, rad: 360 / (2 * Math.PI) }, Ye = function(s) {
  return typeof s == "string" ? s.length > 0 : typeof s == "number";
}, pe = function(s, e, t) {
  return e === void 0 && (e = 0), t === void 0 && (t = Math.pow(10, e)), Math.round(t * s) / t + 0;
}, Re = function(s, e, t) {
  return e === void 0 && (e = 0), t === void 0 && (t = 1), s > t ? t : s > e ? s : e;
}, so = function(s) {
  return (s = isFinite(s) ? s % 360 : 0) > 0 ? s : s + 360;
}, ln = function(s) {
  return { r: Re(s.r, 0, 255), g: Re(s.g, 0, 255), b: Re(s.b, 0, 255), a: Re(s.a) };
}, Zr = function(s) {
  return { r: pe(s.r), g: pe(s.g), b: pe(s.b), a: pe(s.a, 3) };
}, Pc = /^#([0-9a-f]{3,8})$/i, fr = function(s) {
  var e = s.toString(16);
  return e.length < 2 ? "0" + e : e;
}, io = function(s) {
  var e = s.r, t = s.g, r = s.b, i = s.a, n = Math.max(e, t, r), a = n - Math.min(e, t, r), o = a ? n === e ? (t - r) / a : n === t ? 2 + (r - e) / a : 4 + (e - t) / a : 0;
  return { h: 60 * (o < 0 ? o + 6 : o), s: n ? a / n * 100 : 0, v: n / 255 * 100, a: i };
}, no = function(s) {
  var e = s.h, t = s.s, r = s.v, i = s.a;
  e = e / 360 * 6, t /= 100, r /= 100;
  var n = Math.floor(e), a = r * (1 - t), o = r * (1 - (e - n) * t), h = r * (1 - (1 - e + n) * t), l = n % 6;
  return { r: 255 * [r, o, a, a, h, r][l], g: 255 * [h, r, r, o, a, a][l], b: 255 * [a, a, h, r, r, o][l], a: i };
}, cn = function(s) {
  return { h: so(s.h), s: Re(s.s, 0, 100), l: Re(s.l, 0, 100), a: Re(s.a) };
}, un = function(s) {
  return { h: pe(s.h), s: pe(s.s), l: pe(s.l), a: pe(s.a, 3) };
}, dn = function(s) {
  return no((t = (e = s).s, { h: e.h, s: (t *= ((r = e.l) < 50 ? r : 100 - r) / 100) > 0 ? 2 * t / (r + t) * 100 : 0, v: r + t, a: e.a }));
  var e, t, r;
}, jt = function(s) {
  return { h: (e = io(s)).h, s: (i = (200 - (t = e.s)) * (r = e.v) / 100) > 0 && i < 200 ? t * r / 100 / (i <= 100 ? i : 200 - i) * 100 : 0, l: i / 2, a: e.a };
  var e, t, r, i;
}, Cc = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i, Ec = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i, Mc = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i, Bc = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i, Ns = { string: [[function(s) {
  var e = Pc.exec(s);
  return e ? (s = e[1]).length <= 4 ? { r: parseInt(s[0] + s[0], 16), g: parseInt(s[1] + s[1], 16), b: parseInt(s[2] + s[2], 16), a: s.length === 4 ? pe(parseInt(s[3] + s[3], 16) / 255, 2) : 1 } : s.length === 6 || s.length === 8 ? { r: parseInt(s.substr(0, 2), 16), g: parseInt(s.substr(2, 2), 16), b: parseInt(s.substr(4, 2), 16), a: s.length === 8 ? pe(parseInt(s.substr(6, 2), 16) / 255, 2) : 1 } : null : null;
}, "hex"], [function(s) {
  var e = Mc.exec(s) || Bc.exec(s);
  return e ? e[2] !== e[4] || e[4] !== e[6] ? null : ln({ r: Number(e[1]) / (e[2] ? 100 / 255 : 1), g: Number(e[3]) / (e[4] ? 100 / 255 : 1), b: Number(e[5]) / (e[6] ? 100 / 255 : 1), a: e[7] === void 0 ? 1 : Number(e[7]) / (e[8] ? 100 : 1) }) : null;
}, "rgb"], [function(s) {
  var e = Cc.exec(s) || Ec.exec(s);
  if (!e) return null;
  var t, r, i = cn({ h: (t = e[1], r = e[2], r === void 0 && (r = "deg"), Number(t) * (Ac[r] || 1)), s: Number(e[3]), l: Number(e[4]), a: e[5] === void 0 ? 1 : Number(e[5]) / (e[6] ? 100 : 1) });
  return dn(i);
}, "hsl"]], object: [[function(s) {
  var e = s.r, t = s.g, r = s.b, i = s.a, n = i === void 0 ? 1 : i;
  return Ye(e) && Ye(t) && Ye(r) ? ln({ r: Number(e), g: Number(t), b: Number(r), a: Number(n) }) : null;
}, "rgb"], [function(s) {
  var e = s.h, t = s.s, r = s.l, i = s.a, n = i === void 0 ? 1 : i;
  if (!Ye(e) || !Ye(t) || !Ye(r)) return null;
  var a = cn({ h: Number(e), s: Number(t), l: Number(r), a: Number(n) });
  return dn(a);
}, "hsl"], [function(s) {
  var e = s.h, t = s.s, r = s.v, i = s.a, n = i === void 0 ? 1 : i;
  if (!Ye(e) || !Ye(t) || !Ye(r)) return null;
  var a = (function(o) {
    return { h: so(o.h), s: Re(o.s, 0, 100), v: Re(o.v, 0, 100), a: Re(o.a) };
  })({ h: Number(e), s: Number(t), v: Number(r), a: Number(n) });
  return no(a);
}, "hsv"]] }, fn = function(s, e) {
  for (var t = 0; t < e.length; t++) {
    var r = e[t][0](s);
    if (r) return [r, e[t][1]];
  }
  return [null, void 0];
}, Rc = function(s) {
  return typeof s == "string" ? fn(s.trim(), Ns.string) : typeof s == "object" && s !== null ? fn(s, Ns.object) : [null, void 0];
}, Qr = function(s, e) {
  var t = jt(s);
  return { h: t.h, s: Re(t.s + 100 * e, 0, 100), l: t.l, a: t.a };
}, Jr = function(s) {
  return (299 * s.r + 587 * s.g + 114 * s.b) / 1e3 / 255;
}, pn = function(s, e) {
  var t = jt(s);
  return { h: t.h, s: t.s, l: Re(t.l + 100 * e, 0, 100), a: t.a };
}, Hs = (function() {
  function s(e) {
    this.parsed = Rc(e)[0], this.rgba = this.parsed || { r: 0, g: 0, b: 0, a: 1 };
  }
  return s.prototype.isValid = function() {
    return this.parsed !== null;
  }, s.prototype.brightness = function() {
    return pe(Jr(this.rgba), 2);
  }, s.prototype.isDark = function() {
    return Jr(this.rgba) < 0.5;
  }, s.prototype.isLight = function() {
    return Jr(this.rgba) >= 0.5;
  }, s.prototype.toHex = function() {
    return e = Zr(this.rgba), t = e.r, r = e.g, i = e.b, a = (n = e.a) < 1 ? fr(pe(255 * n)) : "", "#" + fr(t) + fr(r) + fr(i) + a;
    var e, t, r, i, n, a;
  }, s.prototype.toRgb = function() {
    return Zr(this.rgba);
  }, s.prototype.toRgbString = function() {
    return e = Zr(this.rgba), t = e.r, r = e.g, i = e.b, (n = e.a) < 1 ? "rgba(" + t + ", " + r + ", " + i + ", " + n + ")" : "rgb(" + t + ", " + r + ", " + i + ")";
    var e, t, r, i, n;
  }, s.prototype.toHsl = function() {
    return un(jt(this.rgba));
  }, s.prototype.toHslString = function() {
    return e = un(jt(this.rgba)), t = e.h, r = e.s, i = e.l, (n = e.a) < 1 ? "hsla(" + t + ", " + r + "%, " + i + "%, " + n + ")" : "hsl(" + t + ", " + r + "%, " + i + "%)";
    var e, t, r, i, n;
  }, s.prototype.toHsv = function() {
    return e = io(this.rgba), { h: pe(e.h), s: pe(e.s), v: pe(e.v), a: pe(e.a, 3) };
    var e;
  }, s.prototype.invert = function() {
    return We({ r: 255 - (e = this.rgba).r, g: 255 - e.g, b: 255 - e.b, a: e.a });
    var e;
  }, s.prototype.saturate = function(e) {
    return e === void 0 && (e = 0.1), We(Qr(this.rgba, e));
  }, s.prototype.desaturate = function(e) {
    return e === void 0 && (e = 0.1), We(Qr(this.rgba, -e));
  }, s.prototype.grayscale = function() {
    return We(Qr(this.rgba, -1));
  }, s.prototype.lighten = function(e) {
    return e === void 0 && (e = 0.1), We(pn(this.rgba, e));
  }, s.prototype.darken = function(e) {
    return e === void 0 && (e = 0.1), We(pn(this.rgba, -e));
  }, s.prototype.rotate = function(e) {
    return e === void 0 && (e = 15), this.hue(this.hue() + e);
  }, s.prototype.alpha = function(e) {
    return typeof e == "number" ? We({ r: (t = this.rgba).r, g: t.g, b: t.b, a: e }) : pe(this.rgba.a, 3);
    var t;
  }, s.prototype.hue = function(e) {
    var t = jt(this.rgba);
    return typeof e == "number" ? We({ h: e, s: t.s, l: t.l, a: t.a }) : pe(t.h);
  }, s.prototype.isEqual = function(e) {
    return this.toHex() === We(e).toHex();
  }, s;
})(), We = function(s) {
  return s instanceof Hs ? s : new Hs(s);
}, mn = [], kc = function(s) {
  s.forEach(function(e) {
    mn.indexOf(e) < 0 && (e(Hs, Ns), mn.push(e));
  });
};
function Ic(s, e) {
  var t = { white: "#ffffff", bisque: "#ffe4c4", blue: "#0000ff", cadetblue: "#5f9ea0", chartreuse: "#7fff00", chocolate: "#d2691e", coral: "#ff7f50", antiquewhite: "#faebd7", aqua: "#00ffff", azure: "#f0ffff", whitesmoke: "#f5f5f5", papayawhip: "#ffefd5", plum: "#dda0dd", blanchedalmond: "#ffebcd", black: "#000000", gold: "#ffd700", goldenrod: "#daa520", gainsboro: "#dcdcdc", cornsilk: "#fff8dc", cornflowerblue: "#6495ed", burlywood: "#deb887", aquamarine: "#7fffd4", beige: "#f5f5dc", crimson: "#dc143c", cyan: "#00ffff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkkhaki: "#bdb76b", darkgray: "#a9a9a9", darkgreen: "#006400", darkgrey: "#a9a9a9", peachpuff: "#ffdab9", darkmagenta: "#8b008b", darkred: "#8b0000", darkorchid: "#9932cc", darkorange: "#ff8c00", darkslateblue: "#483d8b", gray: "#808080", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", deeppink: "#ff1493", deepskyblue: "#00bfff", wheat: "#f5deb3", firebrick: "#b22222", floralwhite: "#fffaf0", ghostwhite: "#f8f8ff", darkviolet: "#9400d3", magenta: "#ff00ff", green: "#008000", dodgerblue: "#1e90ff", grey: "#808080", honeydew: "#f0fff0", hotpink: "#ff69b4", blueviolet: "#8a2be2", forestgreen: "#228b22", lawngreen: "#7cfc00", indianred: "#cd5c5c", indigo: "#4b0082", fuchsia: "#ff00ff", brown: "#a52a2a", maroon: "#800000", mediumblue: "#0000cd", lightcoral: "#f08080", darkturquoise: "#00ced1", lightcyan: "#e0ffff", ivory: "#fffff0", lightyellow: "#ffffe0", lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", linen: "#faf0e6", mediumaquamarine: "#66cdaa", lemonchiffon: "#fffacd", lime: "#00ff00", khaki: "#f0e68c", mediumseagreen: "#3cb371", limegreen: "#32cd32", mediumspringgreen: "#00fa9a", lightskyblue: "#87cefa", lightblue: "#add8e6", midnightblue: "#191970", lightpink: "#ffb6c1", mistyrose: "#ffe4e1", moccasin: "#ffe4b5", mintcream: "#f5fffa", lightslategray: "#778899", lightslategrey: "#778899", navajowhite: "#ffdead", navy: "#000080", mediumvioletred: "#c71585", powderblue: "#b0e0e6", palegoldenrod: "#eee8aa", oldlace: "#fdf5e6", paleturquoise: "#afeeee", mediumturquoise: "#48d1cc", mediumorchid: "#ba55d3", rebeccapurple: "#663399", lightsteelblue: "#b0c4de", mediumslateblue: "#7b68ee", thistle: "#d8bfd8", tan: "#d2b48c", orchid: "#da70d6", mediumpurple: "#9370db", purple: "#800080", pink: "#ffc0cb", skyblue: "#87ceeb", springgreen: "#00ff7f", palegreen: "#98fb98", red: "#ff0000", yellow: "#ffff00", slateblue: "#6a5acd", lavenderblush: "#fff0f5", peru: "#cd853f", palevioletred: "#db7093", violet: "#ee82ee", teal: "#008080", slategray: "#708090", slategrey: "#708090", aliceblue: "#f0f8ff", darkseagreen: "#8fbc8f", darkolivegreen: "#556b2f", greenyellow: "#adff2f", seagreen: "#2e8b57", seashell: "#fff5ee", tomato: "#ff6347", silver: "#c0c0c0", sienna: "#a0522d", lavender: "#e6e6fa", lightgreen: "#90ee90", orange: "#ffa500", orangered: "#ff4500", steelblue: "#4682b4", royalblue: "#4169e1", turquoise: "#40e0d0", yellowgreen: "#9acd32", salmon: "#fa8072", saddlebrown: "#8b4513", sandybrown: "#f4a460", rosybrown: "#bc8f8f", darksalmon: "#e9967a", lightgoldenrodyellow: "#fafad2", snow: "#fffafa", lightgrey: "#d3d3d3", lightgray: "#d3d3d3", dimgray: "#696969", dimgrey: "#696969", olivedrab: "#6b8e23", olive: "#808000" }, r = {};
  for (var i in t) r[t[i]] = i;
  var n = {};
  s.prototype.toName = function(a) {
    if (!(this.rgba.a || this.rgba.r || this.rgba.g || this.rgba.b)) return "transparent";
    var o, h, l = r[this.toHex()];
    if (l) return l;
    if (a != null && a.closest) {
      var c = this.toRgb(), u = 1 / 0, d = "black";
      if (!n.length) for (var f in t) n[f] = new s(t[f]).toRgb();
      for (var p in t) {
        var g = (o = c, h = n[p], Math.pow(o.r - h.r, 2) + Math.pow(o.g - h.g, 2) + Math.pow(o.b - h.b, 2));
        g < u && (u = g, d = p);
      }
      return d;
    }
  }, e.string.push([function(a) {
    var o = a.toLowerCase(), h = o === "transparent" ? "#0000" : t[o];
    return h ? new s(h).toRgb() : null;
  }, "name"]);
}
kc([Ic]);
const Mt = class zt {
  /**
   * @param {ColorSource} value - Optional value to use, if not provided, white is used.
   */
  constructor(e = 16777215) {
    this._value = null, this._components = new Float32Array(4), this._components.fill(1), this._int = 16777215, this.value = e;
  }
  /** Get red component (0 - 1) */
  get red() {
    return this._components[0];
  }
  /** Get green component (0 - 1) */
  get green() {
    return this._components[1];
  }
  /** Get blue component (0 - 1) */
  get blue() {
    return this._components[2];
  }
  /** Get alpha component (0 - 1) */
  get alpha() {
    return this._components[3];
  }
  /**
   * Set the value, suitable for chaining
   * @param value
   * @see Color.value
   */
  setValue(e) {
    return this.value = e, this;
  }
  /**
   * The current color source.
   *
   * When setting:
   * - Setting to an instance of `Color` will copy its color source and components.
   * - Otherwise, `Color` will try to normalize the color source and set the components.
   *   If the color source is invalid, an `Error` will be thrown and the `Color` will left unchanged.
   *
   * Note: The `null` in the setter's parameter type is added to match the TypeScript rule: return type of getter
   * must be assignable to its setter's parameter type. Setting `value` to `null` will throw an `Error`.
   *
   * When getting:
   * - A return value of `null` means the previous value was overridden (e.g., {@link Color.multiply multiply},
   *   {@link Color.premultiply premultiply} or {@link Color.round round}).
   * - Otherwise, the color source used when setting is returned.
   */
  set value(e) {
    if (e instanceof zt)
      this._value = this._cloneSource(e._value), this._int = e._int, this._components.set(e._components);
    else {
      if (e === null)
        throw new Error("Cannot set Color#value to null");
      (this._value === null || !this._isSourceEqual(this._value, e)) && (this._value = this._cloneSource(e), this._normalize(this._value));
    }
  }
  get value() {
    return this._value;
  }
  /**
   * Copy a color source internally.
   * @param value - Color source
   */
  _cloneSource(e) {
    return typeof e == "string" || typeof e == "number" || e instanceof Number || e === null ? e : Array.isArray(e) || ArrayBuffer.isView(e) ? e.slice(0) : typeof e == "object" && e !== null ? { ...e } : e;
  }
  /**
   * Equality check for color sources.
   * @param value1 - First color source
   * @param value2 - Second color source
   * @returns `true` if the color sources are equal, `false` otherwise.
   */
  _isSourceEqual(e, t) {
    const r = typeof e;
    if (r !== typeof t)
      return !1;
    if (r === "number" || r === "string" || e instanceof Number)
      return e === t;
    if (Array.isArray(e) && Array.isArray(t) || ArrayBuffer.isView(e) && ArrayBuffer.isView(t))
      return e.length !== t.length ? !1 : e.every((n, a) => n === t[a]);
    if (e !== null && t !== null) {
      const n = Object.keys(e), a = Object.keys(t);
      return n.length !== a.length ? !1 : n.every((o) => e[o] === t[o]);
    }
    return e === t;
  }
  /**
   * Convert to a RGBA color object.
   * @example
   * import { Color } from 'pixi.js';
   * new Color('white').toRgb(); // returns { r: 1, g: 1, b: 1, a: 1 }
   */
  toRgba() {
    const [e, t, r, i] = this._components;
    return { r: e, g: t, b: r, a: i };
  }
  /**
   * Convert to a RGB color object.
   * @example
   * import { Color } from 'pixi.js';
   * new Color('white').toRgb(); // returns { r: 1, g: 1, b: 1 }
   */
  toRgb() {
    const [e, t, r] = this._components;
    return { r: e, g: t, b: r };
  }
  /** Convert to a CSS-style rgba string: `rgba(255,255,255,1.0)`. */
  toRgbaString() {
    const [e, t, r] = this.toUint8RgbArray();
    return `rgba(${e},${t},${r},${this.alpha})`;
  }
  toUint8RgbArray(e) {
    const [t, r, i] = this._components;
    return this._arrayRgb || (this._arrayRgb = []), e || (e = this._arrayRgb), e[0] = Math.round(t * 255), e[1] = Math.round(r * 255), e[2] = Math.round(i * 255), e;
  }
  toArray(e) {
    this._arrayRgba || (this._arrayRgba = []), e || (e = this._arrayRgba);
    const [t, r, i, n] = this._components;
    return e[0] = t, e[1] = r, e[2] = i, e[3] = n, e;
  }
  toRgbArray(e) {
    this._arrayRgb || (this._arrayRgb = []), e || (e = this._arrayRgb);
    const [t, r, i] = this._components;
    return e[0] = t, e[1] = r, e[2] = i, e;
  }
  /**
   * Convert to a hexadecimal number.
   * @example
   * import { Color } from 'pixi.js';
   * new Color('white').toNumber(); // returns 16777215
   */
  toNumber() {
    return this._int;
  }
  /**
   * Convert to a BGR number
   * @example
   * import { Color } from 'pixi.js';
   * new Color(0xffcc99).toBgrNumber(); // returns 0x99ccff
   */
  toBgrNumber() {
    const [e, t, r] = this.toUint8RgbArray();
    return (r << 16) + (t << 8) + e;
  }
  /**
   * Convert to a hexadecimal number in little endian format (e.g., BBGGRR).
   * @example
   * import { Color } from 'pixi.js';
   * new Color(0xffcc99).toLittleEndianNumber(); // returns 0x99ccff
   * @returns {number} - The color as a number in little endian format.
   */
  toLittleEndianNumber() {
    const e = this._int;
    return (e >> 16) + (e & 65280) + ((e & 255) << 16);
  }
  /**
   * Multiply with another color. This action is destructive, and will
   * override the previous `value` property to be `null`.
   * @param {ColorSource} value - The color to multiply by.
   */
  multiply(e) {
    const [t, r, i, n] = zt._temp.setValue(e)._components;
    return this._components[0] *= t, this._components[1] *= r, this._components[2] *= i, this._components[3] *= n, this._refreshInt(), this._value = null, this;
  }
  /**
   * Converts color to a premultiplied alpha format. This action is destructive, and will
   * override the previous `value` property to be `null`.
   * @param alpha - The alpha to multiply by.
   * @param {boolean} [applyToRGB=true] - Whether to premultiply RGB channels.
   * @returns {Color} - Itself.
   */
  premultiply(e, t = !0) {
    return t && (this._components[0] *= e, this._components[1] *= e, this._components[2] *= e), this._components[3] = e, this._refreshInt(), this._value = null, this;
  }
  /**
   * Premultiplies alpha with current color.
   * @param {number} alpha - The alpha to multiply by.
   * @param {boolean} [applyToRGB=true] - Whether to premultiply RGB channels.
   * @returns {number} tint multiplied by alpha
   */
  toPremultiplied(e, t = !0) {
    if (e === 1)
      return (255 << 24) + this._int;
    if (e === 0)
      return t ? 0 : this._int;
    let r = this._int >> 16 & 255, i = this._int >> 8 & 255, n = this._int & 255;
    return t && (r = r * e + 0.5 | 0, i = i * e + 0.5 | 0, n = n * e + 0.5 | 0), (e * 255 << 24) + (r << 16) + (i << 8) + n;
  }
  /**
   * Convert to a hexadecimal string.
   * @example
   * import { Color } from 'pixi.js';
   * new Color('white').toHex(); // returns "#ffffff"
   */
  toHex() {
    const e = this._int.toString(16);
    return `#${"000000".substring(0, 6 - e.length) + e}`;
  }
  /**
   * Convert to a hexadecimal string with alpha.
   * @example
   * import { Color } from 'pixi.js';
   * new Color('white').toHexa(); // returns "#ffffffff"
   */
  toHexa() {
    const t = Math.round(this._components[3] * 255).toString(16);
    return this.toHex() + "00".substring(0, 2 - t.length) + t;
  }
  /**
   * Set alpha, suitable for chaining.
   * @param alpha
   */
  setAlpha(e) {
    return this._components[3] = this._clamp(e), this;
  }
  /**
   * Normalize the input value into rgba
   * @param value - Input value
   */
  _normalize(e) {
    let t, r, i, n;
    if ((typeof e == "number" || e instanceof Number) && e >= 0 && e <= 16777215) {
      const a = e;
      t = (a >> 16 & 255) / 255, r = (a >> 8 & 255) / 255, i = (a & 255) / 255, n = 1;
    } else if ((Array.isArray(e) || e instanceof Float32Array) && e.length >= 3 && e.length <= 4)
      e = this._clamp(e), [t, r, i, n = 1] = e;
    else if ((e instanceof Uint8Array || e instanceof Uint8ClampedArray) && e.length >= 3 && e.length <= 4)
      e = this._clamp(e, 0, 255), [t, r, i, n = 255] = e, t /= 255, r /= 255, i /= 255, n /= 255;
    else if (typeof e == "string" || typeof e == "object") {
      if (typeof e == "string") {
        const o = zt.HEX_PATTERN.exec(e);
        o && (e = `#${o[2]}`);
      }
      const a = We(e);
      a.isValid() && ({ r: t, g: r, b: i, a: n } = a.rgba, t /= 255, r /= 255, i /= 255);
    }
    if (t !== void 0)
      this._components[0] = t, this._components[1] = r, this._components[2] = i, this._components[3] = n, this._refreshInt();
    else
      throw new Error(`Unable to convert color ${e}`);
  }
  /** Refresh the internal color rgb number */
  _refreshInt() {
    this._clamp(this._components);
    const [e, t, r] = this._components;
    this._int = (e * 255 << 16) + (t * 255 << 8) + (r * 255 | 0);
  }
  /**
   * Clamps values to a range. Will override original values
   * @param value - Value(s) to clamp
   * @param min - Minimum value
   * @param max - Maximum value
   */
  _clamp(e, t = 0, r = 1) {
    return typeof e == "number" ? Math.min(Math.max(e, t), r) : (e.forEach((i, n) => {
      e[n] = Math.min(Math.max(i, t), r);
    }), e);
  }
  /**
   * Check if the value is a color-like object
   * @param value - Value to check
   * @returns True if the value is a color-like object
   * @static
   * @example
   * import { Color } from 'pixi.js';
   * Color.isColorLike('white'); // returns true
   * Color.isColorLike(0xffffff); // returns true
   * Color.isColorLike([1, 1, 1]); // returns true
   */
  static isColorLike(e) {
    return typeof e == "number" || typeof e == "string" || e instanceof Number || e instanceof zt || Array.isArray(e) || e instanceof Uint8Array || e instanceof Uint8ClampedArray || e instanceof Float32Array || e.r !== void 0 && e.g !== void 0 && e.b !== void 0 || e.r !== void 0 && e.g !== void 0 && e.b !== void 0 && e.a !== void 0 || e.h !== void 0 && e.s !== void 0 && e.l !== void 0 || e.h !== void 0 && e.s !== void 0 && e.l !== void 0 && e.a !== void 0 || e.h !== void 0 && e.s !== void 0 && e.v !== void 0 || e.h !== void 0 && e.s !== void 0 && e.v !== void 0 && e.a !== void 0;
  }
};
Mt.shared = new Mt();
Mt._temp = new Mt();
Mt.HEX_PATTERN = /^(#|0x)?(([a-f0-9]{3}){1,2}([a-f0-9]{2})?)$/i;
let re = Mt;
const Gc = {
  cullArea: null,
  cullable: !1,
  cullableChildren: !0
};
class fi {
  /**
   * Constructs a new Pool.
   * @param ClassType - The constructor of the items in the pool.
   * @param {number} [initialSize] - The initial size of the pool.
   */
  constructor(e, t) {
    this._pool = [], this._count = 0, this._index = 0, this._classType = e, t && this.prepopulate(t);
  }
  /**
   * Prepopulates the pool with a given number of items.
   * @param total - The number of items to add to the pool.
   */
  prepopulate(e) {
    for (let t = 0; t < e; t++)
      this._pool[this._index++] = new this._classType();
    this._count += e;
  }
  /**
   * Gets an item from the pool. Calls the item's `init` method if it exists.
   * If there are no items left in the pool, a new one will be created.
   * @param {unknown} [data] - Optional data to pass to the item's constructor.
   * @returns {T} The item from the pool.
   */
  get(e) {
    var r;
    let t;
    return this._index > 0 ? t = this._pool[--this._index] : t = new this._classType(), (r = t.init) == null || r.call(t, e), t;
  }
  /**
   * Returns an item to the pool. Calls the item's `reset` method if it exists.
   * @param {T} item - The item to return to the pool.
   */
  return(e) {
    var t;
    (t = e.reset) == null || t.call(e), this._pool[this._index++] = e;
  }
  /**
   * Gets the number of items in the pool.
   * @readonly
   * @member {number}
   */
  get totalSize() {
    return this._count;
  }
  /**
   * Gets the number of items in the pool that are free to use without needing to create more.
   * @readonly
   * @member {number}
   */
  get totalFree() {
    return this._index;
  }
  /**
   * Gets the number of items in the pool that are currently in use.
   * @readonly
   * @member {number}
   */
  get totalUsed() {
    return this._count - this._index;
  }
  /** clears the pool - mainly used for debugging! */
  clear() {
    this._pool.length = 0, this._index = 0;
  }
}
class Uc {
  constructor() {
    this._poolsByClass = /* @__PURE__ */ new Map();
  }
  /**
   * Prepopulates a specific pool with a given number of items.
   * @template T The type of items in the pool. Must extend PoolItem.
   * @param {PoolItemConstructor<T>} Class - The constructor of the items in the pool.
   * @param {number} total - The number of items to add to the pool.
   */
  prepopulate(e, t) {
    this.getPool(e).prepopulate(t);
  }
  /**
   * Gets an item from a specific pool.
   * @template T The type of items in the pool. Must extend PoolItem.
   * @param {PoolItemConstructor<T>} Class - The constructor of the items in the pool.
   * @param {unknown} [data] - Optional data to pass to the item's constructor.
   * @returns {T} The item from the pool.
   */
  get(e, t) {
    return this.getPool(e).get(t);
  }
  /**
   * Returns an item to its respective pool.
   * @param {PoolItem} item - The item to return to the pool.
   */
  return(e) {
    this.getPool(e.constructor).return(e);
  }
  /**
   * Gets a specific pool based on the class type.
   * @template T The type of items in the pool. Must extend PoolItem.
   * @param {PoolItemConstructor<T>} ClassType - The constructor of the items in the pool.
   * @returns {Pool<T>} The pool of the given class type.
   */
  getPool(e) {
    return this._poolsByClass.has(e) || this._poolsByClass.set(e, new fi(e)), this._poolsByClass.get(e);
  }
  /** gets the usage stats of each pool in the system */
  stats() {
    const e = {};
    return this._poolsByClass.forEach((t) => {
      const r = e[t._classType.name] ? t._classType.name + t._classType.ID : t._classType.name;
      e[r] = {
        free: t.totalFree,
        used: t.totalUsed,
        size: t.totalSize
      };
    }), e;
  }
}
const K = new Uc(), Fc = {
  /**
   * Is this container cached as a texture?
   * @readonly
   * @type {boolean}
   * @memberof scene.Container#
   */
  get isCachedAsTexture() {
    var s;
    return !!((s = this.renderGroup) != null && s.isCachedAsTexture);
  },
  cacheAsTexture(s) {
    typeof s == "boolean" && s === !1 ? this.disableRenderGroup() : (this.enableRenderGroup(), this.renderGroup.enableCacheAsTexture(s === !0 ? {} : s));
  },
  /**
   * Updates the cached texture. Will flag that this container's cached texture needs to be redrawn.
   * This will happen on the next render.
   * @memberof scene.Container#
   */
  updateCacheTexture() {
    var s;
    (s = this.renderGroup) == null || s.updateCacheTexture();
  },
  /**
   * Allows backwards compatibility with pixi.js below version v8. Use `cacheAsTexture` instead.
   * @deprecated
   */
  get cacheAsBitmap() {
    return this.isCachedAsTexture;
  },
  /**
   * @deprecated
   */
  set cacheAsBitmap(s) {
    X("v8.6.0", "cacheAsBitmap is deprecated, use cacheAsTexture instead."), this.cacheAsTexture(s);
  }
};
function ao(s, e, t) {
  const r = s.length;
  let i;
  if (e >= r || t === 0)
    return;
  t = e + t > r ? r - e : t;
  const n = r - t;
  for (i = e; i < n; ++i)
    s[i] = s[i + t];
  s.length = n;
}
const Dc = {
  allowChildren: !0,
  /**
   * Removes all children from this container that are within the begin and end indexes.
   * @param beginIndex - The beginning position.
   * @param endIndex - The ending position. Default value is size of the container.
   * @returns - List of removed children
   * @memberof scene.Container#
   */
  removeChildren(s = 0, e) {
    const t = e ?? this.children.length, r = t - s, i = [];
    if (r > 0 && r <= t) {
      for (let a = t - 1; a >= s; a--) {
        const o = this.children[a];
        o && (i.push(o), o.parent = null);
      }
      ao(this.children, s, t);
      const n = this.renderGroup || this.parentRenderGroup;
      n && n.removeChildren(i);
      for (let a = 0; a < i.length; ++a)
        this.emit("childRemoved", i[a], this, a), i[a].emit("removed", this);
      return i.length > 0 && this._didViewChangeTick++, i;
    } else if (r === 0 && this.children.length === 0)
      return i;
    throw new RangeError("removeChildren: numeric values are outside the acceptable range.");
  },
  /**
   * Removes a child from the specified index position.
   * @param index - The index to get the child from
   * @returns The child that was removed.
   * @memberof scene.Container#
   */
  removeChildAt(s) {
    const e = this.getChildAt(s);
    return this.removeChild(e);
  },
  /**
   * Returns the child at the specified index
   * @param index - The index to get the child at
   * @returns - The child at the given index, if any.
   * @memberof scene.Container#
   */
  getChildAt(s) {
    if (s < 0 || s >= this.children.length)
      throw new Error(`getChildAt: Index (${s}) does not exist.`);
    return this.children[s];
  },
  /**
   * Changes the position of an existing child in the container
   * @param child - The child Container instance for which you want to change the index number
   * @param index - The resulting index number for the child container
   * @memberof scene.Container#
   */
  setChildIndex(s, e) {
    if (e < 0 || e >= this.children.length)
      throw new Error(`The index ${e} supplied is out of bounds ${this.children.length}`);
    this.getChildIndex(s), this.addChildAt(s, e);
  },
  /**
   * Returns the index position of a child Container instance
   * @param child - The Container instance to identify
   * @returns - The index position of the child container to identify
   * @memberof scene.Container#
   */
  getChildIndex(s) {
    const e = this.children.indexOf(s);
    if (e === -1)
      throw new Error("The supplied Container must be a child of the caller");
    return e;
  },
  /**
   * Adds a child to the container at a specified index. If the index is out of bounds an error will be thrown.
   * If the child is already in this container, it will be moved to the specified index.
   * @param {Container} child - The child to add.
   * @param {number} index - The absolute index where the child will be positioned at the end of the operation.
   * @returns {Container} The child that was added.
   * @memberof scene.Container#
   */
  addChildAt(s, e) {
    this.allowChildren || X(Y, "addChildAt: Only Containers will be allowed to add children in v8.0.0");
    const { children: t } = this;
    if (e < 0 || e > t.length)
      throw new Error(`${s}addChildAt: The index ${e} supplied is out of bounds ${t.length}`);
    if (s.parent) {
      const i = s.parent.children.indexOf(s);
      if (s.parent === this && i === e)
        return s;
      i !== -1 && s.parent.children.splice(i, 1);
    }
    e === t.length ? t.push(s) : t.splice(e, 0, s), s.parent = this, s.didChange = !0, s._updateFlags = 15;
    const r = this.renderGroup || this.parentRenderGroup;
    return r && r.addChild(s), this.sortableChildren && (this.sortDirty = !0), this.emit("childAdded", s, this, e), s.emit("added", this), s;
  },
  /**
   * Swaps the position of 2 Containers within this container.
   * @param child - First container to swap
   * @param child2 - Second container to swap
   * @memberof scene.Container#
   */
  swapChildren(s, e) {
    if (s === e)
      return;
    const t = this.getChildIndex(s), r = this.getChildIndex(e);
    this.children[t] = e, this.children[r] = s;
    const i = this.renderGroup || this.parentRenderGroup;
    i && (i.structureDidChange = !0), this._didContainerChangeTick++;
  },
  /**
   * Remove the Container from its parent Container. If the Container has no parent, do nothing.
   * @memberof scene.Container#
   */
  removeFromParent() {
    var s;
    (s = this.parent) == null || s.removeChild(this);
  },
  /**
   * Reparent the child to this container, keeping the same worldTransform.
   * @param child - The child to reparent
   * @returns The first child that was reparented.
   * @memberof scene.Container#
   */
  reparentChild(...s) {
    return s.length === 1 ? this.reparentChildAt(s[0], this.children.length) : (s.forEach((e) => this.reparentChildAt(e, this.children.length)), s[0]);
  },
  /**
   * Reparent the child to this container at the specified index, keeping the same worldTransform.
   * @param child - The child to reparent
   * @param index - The index to reparent the child to
   * @memberof scene.Container#
   */
  reparentChildAt(s, e) {
    if (s.parent === this)
      return this.setChildIndex(s, e), s;
    const t = s.worldTransform.clone();
    s.removeFromParent(), this.addChildAt(s, e);
    const r = this.worldTransform.clone();
    return r.invert(), t.prepend(r), s.setFromMatrix(t), s;
  }
}, Oc = {
  /**
   * Main method to collect renderables from the container and its children.
   * It checks the container's properties to decide whether to use a simple or advanced collection method.
   * @param {InstructionSet} instructionSet - The set of instructions to which the renderables will be added.
   * @param {Renderer} renderer - The renderer responsible for rendering the scene.
   * @param {IRenderLayer} currentLayer - The current render layer being processed.
   * @memberof scene.Container#
   */
  collectRenderables(s, e, t) {
    this.parentRenderLayer && this.parentRenderLayer !== t || this.globalDisplayStatus < 7 || !this.includeInBuild || (this.sortableChildren && this.sortChildren(), this.isSimple ? this.collectRenderablesSimple(s, e, t) : this.renderGroup ? e.renderPipes.renderGroup.addRenderGroup(this.renderGroup, s) : this.collectRenderablesWithEffects(s, e, t));
  },
  /**
   * Simple method for collecting renderables from the container's children.
   * This method is efficient and used when the container is marked as simple.
   * @param {InstructionSet} instructionSet - The set of instructions to which the renderables will be added.
   * @param {Renderer} renderer - The renderer responsible for rendering the scene.
   * @param {IRenderLayer} currentLayer - The current render layer being processed.
   * @memberof scene.Container#
   */
  collectRenderablesSimple(s, e, t) {
    const r = this.children, i = r.length;
    for (let n = 0; n < i; n++)
      r[n].collectRenderables(s, e, t);
  },
  /**
   * Advanced method for collecting renderables, which handles additional effects.
   * This method is used when the container has complex processing needs.
   * @param {InstructionSet} instructionSet - The set of instructions to which the renderables will be added.
   * @param {Renderer} renderer - The renderer responsible for rendering the scene.
   * @param {IRenderLayer} currentLayer - The current render layer being processed.
   * @memberof scene.Container#
   */
  collectRenderablesWithEffects(s, e, t) {
    const { renderPipes: r } = e;
    for (let i = 0; i < this.effects.length; i++) {
      const n = this.effects[i];
      r[n.pipe].push(n, this, s);
    }
    this.collectRenderablesSimple(s, e, t);
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const n = this.effects[i];
      r[n.pipe].pop(n, this, s);
    }
  }
};
class Ir {
  constructor() {
    this.pipe = "filter", this.priority = 1;
  }
  destroy() {
    for (let e = 0; e < this.filters.length; e++)
      this.filters[e].destroy();
    this.filters = null, this.filterArea = null;
  }
}
class Lc {
  constructor() {
    this._effectClasses = [], this._tests = [], this._initialized = !1;
  }
  init() {
    this._initialized || (this._initialized = !0, this._effectClasses.forEach((e) => {
      this.add({
        test: e.test,
        maskClass: e
      });
    }));
  }
  add(e) {
    this._tests.push(e);
  }
  getMaskEffect(e) {
    this._initialized || this.init();
    for (let t = 0; t < this._tests.length; t++) {
      const r = this._tests[t];
      if (r.test(e))
        return K.get(r.maskClass, e);
    }
    return e;
  }
  returnMaskEffect(e) {
    K.return(e);
  }
}
const Ws = new Lc();
z.handleByList(v.MaskEffect, Ws._effectClasses);
const Nc = {
  _maskEffect: null,
  _maskOptions: {
    inverse: !1
  },
  _filterEffect: null,
  /**
   * @todo Needs docs.
   * @memberof scene.Container#
   * @type {Array<Effect>}
   */
  effects: [],
  _markStructureAsChanged() {
    const s = this.renderGroup || this.parentRenderGroup;
    s && (s.structureDidChange = !0);
  },
  /**
   * @todo Needs docs.
   * @param effect - The effect to add.
   * @memberof scene.Container#
   * @ignore
   */
  addEffect(s) {
    this.effects.indexOf(s) === -1 && (this.effects.push(s), this.effects.sort((t, r) => t.priority - r.priority), this._markStructureAsChanged(), this._updateIsSimple());
  },
  /**
   * @todo Needs docs.
   * @param effect - The effect to remove.
   * @memberof scene.Container#
   * @ignore
   */
  removeEffect(s) {
    const e = this.effects.indexOf(s);
    e !== -1 && (this.effects.splice(e, 1), this._markStructureAsChanged(), this._updateIsSimple());
  },
  set mask(s) {
    const e = this._maskEffect;
    (e == null ? void 0 : e.mask) !== s && (e && (this.removeEffect(e), Ws.returnMaskEffect(e), this._maskEffect = null), s != null && (this._maskEffect = Ws.getMaskEffect(s), this.addEffect(this._maskEffect)));
  },
  /**
   * Used to set mask and control mask options.
   * @param options
   * @example
   * import { Graphics, Sprite } from 'pixi.js';
   *
   * const graphics = new Graphics();
   * graphics.beginFill(0xFF3300);
   * graphics.drawRect(50, 250, 100, 100);
   * graphics.endFill();
   *
   * const sprite = new Sprite(texture);
   * sprite.setMask({
   *     mask: graphics,
   *     inverse: true,
   * });
   * @memberof scene.Container#
   */
  setMask(s) {
    this._maskOptions = {
      ...this._maskOptions,
      ...s
    }, s.mask && (this.mask = s.mask), this._markStructureAsChanged();
  },
  /**
   * Sets a mask for the displayObject. A mask is an object that limits the visibility of an
   * object to the shape of the mask applied to it. In PixiJS a regular mask must be a
   * {@link Graphics} or a {@link Sprite} object. This allows for much faster masking in canvas as it
   * utilities shape clipping. Furthermore, a mask of an object must be in the subtree of its parent.
   * Otherwise, `getLocalBounds` may calculate incorrect bounds, which makes the container's width and height wrong.
   * To remove a mask, set this property to `null`.
   *
   * For sprite mask both alpha and red channel are used. Black mask is the same as transparent mask.
   * @example
   * import { Graphics, Sprite } from 'pixi.js';
   *
   * const graphics = new Graphics();
   * graphics.beginFill(0xFF3300);
   * graphics.drawRect(50, 250, 100, 100);
   * graphics.endFill();
   *
   * const sprite = new Sprite(texture);
   * sprite.mask = graphics;
   * @memberof scene.Container#
   */
  get mask() {
    var s;
    return (s = this._maskEffect) == null ? void 0 : s.mask;
  },
  set filters(s) {
    var n;
    !Array.isArray(s) && s && (s = [s]);
    const e = this._filterEffect || (this._filterEffect = new Ir());
    s = s;
    const t = (s == null ? void 0 : s.length) > 0, r = ((n = e.filters) == null ? void 0 : n.length) > 0, i = t !== r;
    s = Array.isArray(s) ? s.slice(0) : s, e.filters = Object.freeze(s), i && (t ? this.addEffect(e) : (this.removeEffect(e), e.filters = s ?? null));
  },
  /**
   * Sets the filters for the displayObject.
   * IMPORTANT: This is a WebGL only feature and will be ignored by the canvas renderer.
   * To remove filters simply set this property to `'null'`.
   * @memberof scene.Container#
   */
  get filters() {
    var s;
    return (s = this._filterEffect) == null ? void 0 : s.filters;
  },
  set filterArea(s) {
    this._filterEffect || (this._filterEffect = new Ir()), this._filterEffect.filterArea = s;
  },
  /**
   * The area the filter is applied to. This is used as more of an optimization
   * rather than figuring out the dimensions of the displayObject each frame you can set this rectangle.
   *
   * Also works as an interaction mask.
   * @memberof scene.Container#
   */
  get filterArea() {
    var s;
    return (s = this._filterEffect) == null ? void 0 : s.filterArea;
  }
}, Hc = {
  /**
   * The instance label of the object.
   * @memberof scene.Container#
   * @member {string} label
   */
  label: null,
  /**
   * The instance name of the object.
   * @deprecated since 8.0.0
   * @see scene.Container#label
   * @member {string} name
   * @memberof scene.Container#
   */
  get name() {
    return X(Y, "Container.name property has been removed, use Container.label instead"), this.label;
  },
  set name(s) {
    X(Y, "Container.name property has been removed, use Container.label instead"), this.label = s;
  },
  /**
   * @method getChildByName
   * @deprecated since 8.0.0
   * @param {string} name - Instance name.
   * @param {boolean}[deep=false] - Whether to search recursively
   * @returns {Container} The child with the specified name.
   * @see scene.Container#getChildByLabel
   * @memberof scene.Container#
   */
  getChildByName(s, e = !1) {
    return this.getChildByLabel(s, e);
  },
  /**
   * Returns the first child in the container with the specified label.
   *
   * Recursive searches are done in a pre-order traversal.
   * @memberof scene.Container#
   * @param {string|RegExp} label - Instance label.
   * @param {boolean}[deep=false] - Whether to search recursively
   * @returns {Container} The child with the specified label.
   */
  getChildByLabel(s, e = !1) {
    const t = this.children;
    for (let r = 0; r < t.length; r++) {
      const i = t[r];
      if (i.label === s || s instanceof RegExp && s.test(i.label))
        return i;
    }
    if (e)
      for (let r = 0; r < t.length; r++) {
        const n = t[r].getChildByLabel(s, !0);
        if (n)
          return n;
      }
    return null;
  },
  /**
   * Returns all children in the container with the specified label.
   * @memberof scene.Container#
   * @param {string|RegExp} label - Instance label.
   * @param {boolean}[deep=false] - Whether to search recursively
   * @param {Container[]} [out=[]] - The array to store matching children in.
   * @returns {Container[]} An array of children with the specified label.
   */
  getChildrenByLabel(s, e = !1, t = []) {
    const r = this.children;
    for (let i = 0; i < r.length; i++) {
      const n = r[i];
      (n.label === s || s instanceof RegExp && s.test(n.label)) && t.push(n);
    }
    if (e)
      for (let i = 0; i < r.length; i++)
        r[i].getChildrenByLabel(s, !0, t);
    return t;
  }
}, ve = new fi(L), Ze = new fi(ye), Wc = new L(), zc = {
  /**
   * Computes the global bounds for the container, considering its children and optionally
   * factoring in render layers. It starts by clearing the provided bounds object, then
   * recursively calculates the bounds, and finally applies the world transformation.
   * @param {boolean} [factorRenderLayers] - Whether to consider render layers in the calculation.
   * @param {Bounds} [bounds] - The bounds object to store the result. If not provided, a new one is created.
   * @returns {Bounds} The computed bounds.
   * @memberof scene.Container#
   */
  getFastGlobalBounds(s, e) {
    e || (e = new ye()), e.clear(), this._getGlobalBoundsRecursive(!!s, e, this.parentRenderLayer), e.isValid || e.set(0, 0, 0, 0);
    const t = this.renderGroup || this.parentRenderGroup;
    return e.applyMatrix(t.worldTransform), e;
  },
  /**
   * Recursively calculates the global bounds for the container and its children.
   * It considers visibility, measurability, and effects, and applies transformations
   * as necessary to compute the bounds accurately.
   * @param {boolean} factorRenderLayers - Whether to consider render layers in the calculation.
   * @param {Bounds} bounds - The bounds object to update with the calculated values.
   * @param {IRenderLayer} currentLayer - The current render layer being processed.
   * @memberof scene.Container#
   */
  _getGlobalBoundsRecursive(s, e, t) {
    let r = e;
    if (s && this.parentRenderLayer && this.parentRenderLayer !== t || this.localDisplayStatus !== 7 || !this.measurable)
      return;
    const i = !!this.effects.length;
    if ((this.renderGroup || i) && (r = Ze.get().clear()), this.boundsArea)
      e.addRect(this.boundsArea, this.worldTransform);
    else {
      if (this.renderPipeId) {
        const a = this.bounds;
        r.addFrame(
          a.minX,
          a.minY,
          a.maxX,
          a.maxY,
          this.groupTransform
        );
      }
      const n = this.children;
      for (let a = 0; a < n.length; a++)
        n[a]._getGlobalBoundsRecursive(s, r, t);
    }
    if (i) {
      let n = !1;
      const a = this.renderGroup || this.parentRenderGroup;
      for (let o = 0; o < this.effects.length; o++)
        this.effects[o].addBounds && (n || (n = !0, r.applyMatrix(a.worldTransform)), this.effects[o].addBounds(r, !0));
      n && (r.applyMatrix(a.worldTransform.copyTo(Wc).invert()), e.addBounds(r, this.relativeGroupTransform)), e.addBounds(r), Ze.return(r);
    } else this.renderGroup && (e.addBounds(r, this.relativeGroupTransform), Ze.return(r));
  }
};
function pi(s, e, t) {
  t.clear();
  let r, i;
  return s.parent ? e ? r = s.parent.worldTransform : (i = ve.get().identity(), r = mi(s, i)) : r = L.IDENTITY, oo(s, t, r, e), i && ve.return(i), t.isValid || t.set(0, 0, 0, 0), t;
}
function oo(s, e, t, r) {
  var o, h;
  if (!s.visible || !s.measurable)
    return;
  let i;
  r ? i = s.worldTransform : (s.updateLocalTransform(), i = ve.get(), i.appendFrom(s.localTransform, t));
  const n = e, a = !!s.effects.length;
  if (a && (e = Ze.get().clear()), s.boundsArea)
    e.addRect(s.boundsArea, i);
  else {
    s.bounds && (e.matrix = i, e.addBounds(s.bounds));
    for (let l = 0; l < s.children.length; l++)
      oo(s.children[l], e, i, r);
  }
  if (a) {
    for (let l = 0; l < s.effects.length; l++)
      (h = (o = s.effects[l]).addBounds) == null || h.call(o, e);
    n.addBounds(e, L.IDENTITY), Ze.return(e);
  }
  r || ve.return(i);
}
function mi(s, e) {
  const t = s.parent;
  return t && (mi(t, e), t.updateLocalTransform(), e.append(t.localTransform)), e;
}
function ho(s, e) {
  if (s === 16777215 || !e)
    return e;
  if (e === 16777215 || !s)
    return s;
  const t = s >> 16 & 255, r = s >> 8 & 255, i = s & 255, n = e >> 16 & 255, a = e >> 8 & 255, o = e & 255, h = t * n / 255 | 0, l = r * a / 255 | 0, c = i * o / 255 | 0;
  return (h << 16) + (l << 8) + c;
}
const gn = 16777215;
function Gr(s, e) {
  return s === gn ? e : e === gn ? s : ho(s, e);
}
function Er(s) {
  return ((s & 255) << 16) + (s & 65280) + (s >> 16 & 255);
}
const Vc = {
  /**
   * Returns the global (compound) alpha of the container within the scene.
   * @param skipUpdate - Performance optimization flag:
   *   - If false (default): Recalculates the entire alpha chain through parents for accuracy
   *   - If true: Uses cached worldAlpha from the last render pass for better performance
   * @returns The resulting alpha value (between 0 and 1)
   * @example
   * // Accurate but slower - recalculates entire alpha chain
   * const preciseAlpha = container.getGlobalAlpha();
   *
   * // Faster but may be outdated - uses cached alpha
   * const cachedAlpha = container.getGlobalAlpha(true);
   */
  getGlobalAlpha(s) {
    if (s)
      return this.renderGroup ? this.renderGroup.worldAlpha : this.parentRenderGroup ? this.parentRenderGroup.worldAlpha * this.alpha : this.alpha;
    let e = this.alpha, t = this.parent;
    for (; t; )
      e *= t.alpha, t = t.parent;
    return e;
  },
  /**
   * Returns the global transform matrix of the container within the scene.
   * @param matrix - Optional matrix to store the result. If not provided, a new Matrix will be created.
   * @param skipUpdate - Performance optimization flag:
   *   - If false (default): Recalculates the entire transform chain for accuracy
   *   - If true: Uses cached worldTransform from the last render pass for better performance
   * @returns The resulting transformation matrix (either the input matrix or a new one)
   * @example
   * // Accurate but slower - recalculates entire transform chain
   * const preciseTransform = container.getGlobalTransform();
   *
   * // Faster but may be outdated - uses cached transform
   * const cachedTransform = container.getGlobalTransform(undefined, true);
   *
   * // Reuse existing matrix
   * const existingMatrix = new Matrix();
   * container.getGlobalTransform(existingMatrix);
   */
  getGlobalTransform(s, e) {
    if (e)
      return s.copyFrom(this.worldTransform);
    this.updateLocalTransform();
    const t = mi(this, ve.get().identity());
    return s.appendFrom(this.localTransform, t), ve.return(t), s;
  },
  /**
   * Returns the global (compound) tint color of the container within the scene.
   * @param skipUpdate - Performance optimization flag:
   *   - If false (default): Recalculates the entire tint chain through parents for accuracy
   *   - If true: Uses cached worldColor from the last render pass for better performance
   * @returns The resulting tint color as a 24-bit RGB number (0xRRGGBB)
   * @example
   * // Accurate but slower - recalculates entire tint chain
   * const preciseTint = container.getGlobalTint();
   *
   * // Faster but may be outdated - uses cached tint
   * const cachedTint = container.getGlobalTint(true);
   */
  getGlobalTint(s) {
    if (s)
      return this.renderGroup ? Er(this.renderGroup.worldColor) : this.parentRenderGroup ? Er(
        Gr(this.localColor, this.parentRenderGroup.worldColor)
      ) : this.tint;
    let e = this.localColor, t = this.parent;
    for (; t; )
      e = Gr(e, t.localColor), t = t.parent;
    return Er(e);
  }
};
let es = 0;
const _n = 500;
function V(...s) {
  es !== _n && (es++, es === _n ? console.warn("PixiJS Warning: too many warnings, no more warnings will be reported to the console by PixiJS.") : console.warn("PixiJS Warning: ", ...s));
}
function gi(s, e, t) {
  return e.clear(), t || (t = L.IDENTITY), lo(s, e, t, s, !0), e.isValid || e.set(0, 0, 0, 0), e;
}
function lo(s, e, t, r, i) {
  var h, l;
  let n;
  if (i)
    n = ve.get(), n = t.copyTo(n);
  else {
    if (!s.visible || !s.measurable)
      return;
    s.updateLocalTransform();
    const c = s.localTransform;
    n = ve.get(), n.appendFrom(c, t);
  }
  const a = e, o = !!s.effects.length;
  if (o && (e = Ze.get().clear()), s.boundsArea)
    e.addRect(s.boundsArea, n);
  else {
    s.renderPipeId && (e.matrix = n, e.addBounds(s.bounds));
    const c = s.children;
    for (let u = 0; u < c.length; u++)
      lo(c[u], e, n, r, !1);
  }
  if (o) {
    for (let c = 0; c < s.effects.length; c++)
      (l = (h = s.effects[c]).addLocalBounds) == null || l.call(h, e, r);
    a.addBounds(e, L.IDENTITY), Ze.return(e);
  }
  ve.return(n);
}
function co(s, e) {
  const t = s.children;
  for (let r = 0; r < t.length; r++) {
    const i = t[r], n = i.uid, a = (i._didViewChangeTick & 65535) << 16 | i._didContainerChangeTick & 65535, o = e.index;
    (e.data[o] !== n || e.data[o + 1] !== a) && (e.data[e.index] = n, e.data[e.index + 1] = a, e.didChange = !0), e.index = o + 2, i.children.length && co(i, e);
  }
  return e.didChange;
}
const $c = new L(), Xc = {
  _localBoundsCacheId: -1,
  _localBoundsCacheData: null,
  _setWidth(s, e) {
    const t = Math.sign(this.scale.x) || 1;
    e !== 0 ? this.scale.x = s / e * t : this.scale.x = t;
  },
  _setHeight(s, e) {
    const t = Math.sign(this.scale.y) || 1;
    e !== 0 ? this.scale.y = s / e * t : this.scale.y = t;
  },
  /**
   * Retrieves the local bounds of the container as a Bounds object.
   * @returns - The bounding area.
   * @memberof scene.Container#
   */
  getLocalBounds() {
    this._localBoundsCacheData || (this._localBoundsCacheData = {
      data: [],
      index: 1,
      didChange: !1,
      localBounds: new ye()
    });
    const s = this._localBoundsCacheData;
    return s.index = 1, s.didChange = !1, s.data[0] !== this._didViewChangeTick && (s.didChange = !0, s.data[0] = this._didViewChangeTick), co(this, s), s.didChange && gi(this, s.localBounds, $c), s.localBounds;
  },
  /**
   * Calculates and returns the (world) bounds of the display object as a [Rectangle]{@link Rectangle}.
   * @param skipUpdate - Setting to `true` will stop the transforms of the scene graph from
   *  being updated. This means the calculation returned MAY be out of date BUT will give you a
   *  nice performance boost.
   * @param bounds - Optional bounds to store the result of the bounds calculation.
   * @returns - The minimum axis-aligned rectangle in world space that fits around this object.
   * @memberof scene.Container#
   */
  getBounds(s, e) {
    return pi(this, s, e || new ye());
  }
}, jc = {
  _onRender: null,
  set onRender(s) {
    const e = this.renderGroup || this.parentRenderGroup;
    if (!s) {
      this._onRender && (e == null || e.removeOnRender(this)), this._onRender = null;
      return;
    }
    this._onRender || e == null || e.addOnRender(this), this._onRender = s;
  },
  /**
   * This callback is used when the container is rendered. This is where you should add your custom
   * logic that is needed to be run every frame.
   *
   * In v7 many users used `updateTransform` for this, however the way v8 renders objects is different
   * and "updateTransform" is no longer called every frame
   * @example
   * const container = new Container();
   * container.onRender = () => {
   *    container.rotation += 0.01;
   * };
   * @memberof scene.Container#
   */
  get onRender() {
    return this._onRender;
  }
}, Yc = {
  _zIndex: 0,
  /**
   * Should children be sorted by zIndex at the next render call.
   *
   * Will get automatically set to true if a new child is added, or if a child's zIndex changes.
   * @type {boolean}
   * @memberof scene.Container#
   */
  sortDirty: !1,
  /**
   * If set to true, the container will sort its children by `zIndex` value
   * when the next render is called, or manually if `sortChildren()` is called.
   *
   * This actually changes the order of elements in the array, so should be treated
   * as a basic solution that is not performant compared to other solutions,
   * such as {@link https://github.com/pixijs/layers PixiJS Layers}
   *
   * Also be aware of that this may not work nicely with the `addChildAt()` function,
   * as the `zIndex` sorting may cause the child to automatically sorted to another position.
   * @type {boolean}
   * @memberof scene.Container#
   */
  sortableChildren: !1,
  /**
   * The zIndex of the container.
   *
   * Setting this value, will automatically set the parent to be sortable. Children will be automatically
   * sorted by zIndex value; a higher value will mean it will be moved towards the end of the array,
   * and thus rendered on top of other display objects within the same container.
   * @see scene.Container#sortableChildren
   * @memberof scene.Container#
   */
  get zIndex() {
    return this._zIndex;
  },
  set zIndex(s) {
    this._zIndex !== s && (this._zIndex = s, this.depthOfChildModified());
  },
  depthOfChildModified() {
    this.parent && (this.parent.sortableChildren = !0, this.parent.sortDirty = !0), this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0);
  },
  /**
   * Sorts children by zIndex.
   * @memberof scene.Container#
   */
  sortChildren() {
    this.sortDirty && (this.sortDirty = !1, this.children.sort(Kc));
  }
};
function Kc(s, e) {
  return s._zIndex - e._zIndex;
}
const qc = {
  /**
   * Returns the global position of the container.
   * @param point - The optional point to write the global value to.
   * @param skipUpdate - Should we skip the update transform.
   * @returns - The updated point.
   * @memberof scene.Container#
   */
  getGlobalPosition(s = new oe(), e = !1) {
    return this.parent ? this.parent.toGlobal(this._position, s, e) : (s.x = this._position.x, s.y = this._position.y), s;
  },
  /**
   * Calculates the global position of the container.
   * @param position - The world origin to calculate from.
   * @param point - A Point object in which to store the value, optional
   *  (otherwise will create a new Point).
   * @param skipUpdate - Should we skip the update transform.
   * @returns - A point object representing the position of this object.
   * @memberof scene.Container#
   */
  toGlobal(s, e, t = !1) {
    const r = this.getGlobalTransform(ve.get(), t);
    return e = r.apply(s, e), ve.return(r), e;
  },
  /**
   * Calculates the local position of the container relative to another point.
   * @param position - The world origin to calculate from.
   * @param from - The Container to calculate the global position from.
   * @param point - A Point object in which to store the value, optional
   *  (otherwise will create a new Point).
   * @param skipUpdate - Should we skip the update transform
   * @returns - A point object representing the position of this object
   * @memberof scene.Container#
   */
  toLocal(s, e, t, r) {
    e && (s = e.toGlobal(s, t, r));
    const i = this.getGlobalTransform(ve.get(), r);
    return t = i.applyInverse(s, t), ve.return(i), t;
  }
};
class uo {
  constructor() {
    this.uid = le("instructionSet"), this.instructions = [], this.instructionSize = 0, this.renderables = [], this.gcTick = 0;
  }
  /** reset the instruction set so it can be reused set size back to 0 */
  reset() {
    this.instructionSize = 0;
  }
  /**
   * Add an instruction to the set
   * @param instruction - add an instruction to the set
   */
  add(e) {
    this.instructions[this.instructionSize++] = e;
  }
  /**
   * Log the instructions to the console (for debugging)
   * @internal
   * @ignore
   */
  log() {
    this.instructions.length = this.instructionSize, console.table(this.instructions, ["type", "action"]);
  }
}
let Zc = 0;
class Qc {
  /**
   * @param textureOptions - options that will be passed to BaseRenderTexture constructor
   * @param {SCALE_MODE} [textureOptions.scaleMode] - See {@link SCALE_MODE} for possible values.
   */
  constructor(e) {
    this._poolKeyHash = /* @__PURE__ */ Object.create(null), this._texturePool = {}, this.textureOptions = e || {}, this.enableFullScreen = !1;
  }
  /**
   * Creates texture with params that were specified in pool constructor.
   * @param pixelWidth - Width of texture in pixels.
   * @param pixelHeight - Height of texture in pixels.
   * @param antialias
   */
  createTexture(e, t, r) {
    const i = new me({
      ...this.textureOptions,
      width: e,
      height: t,
      resolution: 1,
      antialias: r,
      autoGarbageCollect: !1
    });
    return new D({
      source: i,
      label: `texturePool_${Zc++}`
    });
  }
  /**
   * Gets a Power-of-Two render texture or fullScreen texture
   * @param frameWidth - The minimum width of the render texture.
   * @param frameHeight - The minimum height of the render texture.
   * @param resolution - The resolution of the render texture.
   * @param antialias
   * @returns The new render texture.
   */
  getOptimalTexture(e, t, r = 1, i) {
    let n = Math.ceil(e * r - 1e-6), a = Math.ceil(t * r - 1e-6);
    n = Et(n), a = Et(a);
    const o = (n << 17) + (a << 1) + (i ? 1 : 0);
    this._texturePool[o] || (this._texturePool[o] = []);
    let h = this._texturePool[o].pop();
    return h || (h = this.createTexture(n, a, i)), h.source._resolution = r, h.source.width = n / r, h.source.height = a / r, h.source.pixelWidth = n, h.source.pixelHeight = a, h.frame.x = 0, h.frame.y = 0, h.frame.width = e, h.frame.height = t, h.updateUvs(), this._poolKeyHash[h.uid] = o, h;
  }
  /**
   * Gets extra texture of the same size as input renderTexture
   * @param texture - The texture to check what size it is.
   * @param antialias - Whether to use antialias.
   * @returns A texture that is a power of two
   */
  getSameSizeTexture(e, t = !1) {
    const r = e.source;
    return this.getOptimalTexture(e.width, e.height, r._resolution, t);
  }
  /**
   * Place a render texture back into the pool.
   * @param renderTexture - The renderTexture to free
   */
  returnTexture(e) {
    const t = this._poolKeyHash[e.uid];
    this._texturePool[t].push(e);
  }
  /**
   * Clears the pool.
   * @param destroyTextures - Destroy all stored textures.
   */
  clear(e) {
    if (e = e !== !1, e)
      for (const t in this._texturePool) {
        const r = this._texturePool[t];
        if (r)
          for (let i = 0; i < r.length; i++)
            r[i].destroy(!0);
      }
    this._texturePool = {};
  }
}
const xe = new Qc();
class Jc {
  constructor() {
    this.renderPipeId = "renderGroup", this.root = null, this.canBundle = !1, this.renderGroupParent = null, this.renderGroupChildren = [], this.worldTransform = new L(), this.worldColorAlpha = 4294967295, this.worldColor = 16777215, this.worldAlpha = 1, this.childrenToUpdate = /* @__PURE__ */ Object.create(null), this.updateTick = 0, this.gcTick = 0, this.childrenRenderablesToUpdate = { list: [], index: 0 }, this.structureDidChange = !0, this.instructionSet = new uo(), this._onRenderContainers = [], this.textureNeedsUpdate = !0, this.isCachedAsTexture = !1, this._matrixDirty = 7;
  }
  init(e) {
    this.root = e, e._onRender && this.addOnRender(e), e.didChange = !0;
    const t = e.children;
    for (let r = 0; r < t.length; r++) {
      const i = t[r];
      i._updateFlags = 15, this.addChild(i);
    }
  }
  enableCacheAsTexture(e = {}) {
    this.textureOptions = e, this.isCachedAsTexture = !0, this.textureNeedsUpdate = !0;
  }
  disableCacheAsTexture() {
    this.isCachedAsTexture = !1, this.texture && (xe.returnTexture(this.texture), this.texture = null);
  }
  updateCacheTexture() {
    this.textureNeedsUpdate = !0;
  }
  reset() {
    this.renderGroupChildren.length = 0;
    for (const e in this.childrenToUpdate) {
      const t = this.childrenToUpdate[e];
      t.list.fill(null), t.index = 0;
    }
    this.childrenRenderablesToUpdate.index = 0, this.childrenRenderablesToUpdate.list.fill(null), this.root = null, this.updateTick = 0, this.structureDidChange = !0, this._onRenderContainers.length = 0, this.renderGroupParent = null, this.disableCacheAsTexture();
  }
  get localTransform() {
    return this.root.localTransform;
  }
  addRenderGroupChild(e) {
    e.renderGroupParent && e.renderGroupParent._removeRenderGroupChild(e), e.renderGroupParent = this, this.renderGroupChildren.push(e);
  }
  _removeRenderGroupChild(e) {
    const t = this.renderGroupChildren.indexOf(e);
    t > -1 && this.renderGroupChildren.splice(t, 1), e.renderGroupParent = null;
  }
  addChild(e) {
    if (this.structureDidChange = !0, e.parentRenderGroup = this, e.updateTick = -1, e.parent === this.root ? e.relativeRenderGroupDepth = 1 : e.relativeRenderGroupDepth = e.parent.relativeRenderGroupDepth + 1, e.didChange = !0, this.onChildUpdate(e), e.renderGroup) {
      this.addRenderGroupChild(e.renderGroup);
      return;
    }
    e._onRender && this.addOnRender(e);
    const t = e.children;
    for (let r = 0; r < t.length; r++)
      this.addChild(t[r]);
  }
  removeChild(e) {
    if (this.structureDidChange = !0, e._onRender && (e.renderGroup || this.removeOnRender(e)), e.parentRenderGroup = null, e.renderGroup) {
      this._removeRenderGroupChild(e.renderGroup);
      return;
    }
    const t = e.children;
    for (let r = 0; r < t.length; r++)
      this.removeChild(t[r]);
  }
  removeChildren(e) {
    for (let t = 0; t < e.length; t++)
      this.removeChild(e[t]);
  }
  onChildUpdate(e) {
    let t = this.childrenToUpdate[e.relativeRenderGroupDepth];
    t || (t = this.childrenToUpdate[e.relativeRenderGroupDepth] = {
      index: 0,
      list: []
    }), t.list[t.index++] = e;
  }
  updateRenderable(e) {
    e.globalDisplayStatus < 7 || (this.instructionSet.renderPipes[e.renderPipeId].updateRenderable(e), e.didViewUpdate = !1);
  }
  onChildViewUpdate(e) {
    this.childrenRenderablesToUpdate.list[this.childrenRenderablesToUpdate.index++] = e;
  }
  get isRenderable() {
    return this.root.localDisplayStatus === 7 && this.worldAlpha > 0;
  }
  /**
   * adding a container to the onRender list will make sure the user function
   * passed in to the user defined 'onRender` callBack
   * @param container - the container to add to the onRender list
   */
  addOnRender(e) {
    this._onRenderContainers.push(e);
  }
  removeOnRender(e) {
    this._onRenderContainers.splice(this._onRenderContainers.indexOf(e), 1);
  }
  runOnRender(e) {
    for (let t = 0; t < this._onRenderContainers.length; t++)
      this._onRenderContainers[t]._onRender(e);
  }
  destroy() {
    this.disableCacheAsTexture(), this.renderGroupParent = null, this.root = null, this.childrenRenderablesToUpdate = null, this.childrenToUpdate = null, this.renderGroupChildren = null, this._onRenderContainers = null, this.instructionSet = null;
  }
  getChildren(e = []) {
    const t = this.root.children;
    for (let r = 0; r < t.length; r++)
      this._getChildren(t[r], e);
    return e;
  }
  _getChildren(e, t = []) {
    if (t.push(e), e.renderGroup)
      return t;
    const r = e.children;
    for (let i = 0; i < r.length; i++)
      this._getChildren(r[i], t);
    return t;
  }
  invalidateMatrices() {
    this._matrixDirty = 7;
  }
  /**
   * Returns the inverse of the world transform matrix.
   * @returns {Matrix} The inverse of the world transform matrix.
   */
  get inverseWorldTransform() {
    return (this._matrixDirty & 1) === 0 ? this._inverseWorldTransform : (this._matrixDirty &= -2, this._inverseWorldTransform || (this._inverseWorldTransform = new L()), this._inverseWorldTransform.copyFrom(this.worldTransform).invert());
  }
  /**
   * Returns the inverse of the texture offset transform matrix.
   * @returns {Matrix} The inverse of the texture offset transform matrix.
   */
  get textureOffsetInverseTransform() {
    return (this._matrixDirty & 2) === 0 ? this._textureOffsetInverseTransform : (this._matrixDirty &= -3, this._textureOffsetInverseTransform || (this._textureOffsetInverseTransform = new L()), this._textureOffsetInverseTransform.copyFrom(this.inverseWorldTransform).translate(
      -this._textureBounds.x,
      -this._textureBounds.y
    ));
  }
  /**
   * Returns the inverse of the parent texture transform matrix.
   * This is used to properly transform coordinates when rendering into cached textures.
   * @returns {Matrix} The inverse of the parent texture transform matrix.
   */
  get inverseParentTextureTransform() {
    if ((this._matrixDirty & 4) === 0)
      return this._inverseParentTextureTransform;
    this._matrixDirty &= -5;
    const e = this._parentCacheAsTextureRenderGroup;
    return e ? (this._inverseParentTextureTransform || (this._inverseParentTextureTransform = new L()), this._inverseParentTextureTransform.copyFrom(this.worldTransform).prepend(e.inverseWorldTransform).translate(
      -e._textureBounds.x,
      -e._textureBounds.y
    )) : this.worldTransform;
  }
  /**
   * Returns a matrix that transforms coordinates to the correct coordinate space of the texture being rendered to.
   * This is the texture offset inverse transform of the closest parent RenderGroup that is cached as a texture.
   * @returns {Matrix | null} The transform matrix for the cached texture coordinate space,
   * or null if no parent is cached as texture.
   */
  get cacheToLocalTransform() {
    return this._parentCacheAsTextureRenderGroup ? this._parentCacheAsTextureRenderGroup.textureOffsetInverseTransform : null;
  }
}
function eu(s, e, t = {}) {
  for (const r in e)
    !t[r] && e[r] !== void 0 && (s[r] = e[r]);
}
const ts = new Te(null), rs = new Te(null), ss = new Te(null, 1, 1), Ur = 1, _i = 2, Yt = 4;
class _e extends Me {
  constructor(e = {}) {
    var t, r;
    super(), this.uid = le("renderable"), this._updateFlags = 15, this.renderGroup = null, this.parentRenderGroup = null, this.parentRenderGroupIndex = 0, this.didChange = !1, this.didViewUpdate = !1, this.relativeRenderGroupDepth = 0, this.children = [], this.parent = null, this.includeInBuild = !0, this.measurable = !0, this.isSimple = !0, this.updateTick = -1, this.localTransform = new L(), this.relativeGroupTransform = new L(), this.groupTransform = this.relativeGroupTransform, this.destroyed = !1, this._position = new Te(this, 0, 0), this._scale = ss, this._pivot = rs, this._skew = ts, this._cx = 1, this._sx = 0, this._cy = 0, this._sy = 1, this._rotation = 0, this.localColor = 16777215, this.localAlpha = 1, this.groupAlpha = 1, this.groupColor = 16777215, this.groupColorAlpha = 4294967295, this.localBlendMode = "inherit", this.groupBlendMode = "normal", this.localDisplayStatus = 7, this.globalDisplayStatus = 7, this._didContainerChangeTick = 0, this._didViewChangeTick = 0, this._didLocalTransformChangeId = -1, this.effects = [], eu(this, e, {
      children: !0,
      parent: !0,
      effects: !0
    }), (t = e.children) == null || t.forEach((i) => this.addChild(i)), (r = e.parent) == null || r.addChild(this);
  }
  /**
   * Mixes all enumerable properties and methods from a source object to Container.
   * @param source - The source of properties and methods to mix in.
   * @deprecated since 8.8.0
   */
  static mixin(e) {
    X("8.8.0", "Container.mixin is deprecated, please use extensions.mixin instead."), z.mixin(_e, e);
  }
  // = 'default';
  /**
   * We now use the _didContainerChangeTick and _didViewChangeTick to track changes
   * @deprecated since 8.2.6
   * @ignore
   */
  set _didChangeId(e) {
    this._didViewChangeTick = e >> 12 & 4095, this._didContainerChangeTick = e & 4095;
  }
  get _didChangeId() {
    return this._didContainerChangeTick & 4095 | (this._didViewChangeTick & 4095) << 12;
  }
  /**
   * Adds one or more children to the container.
   *
   * Multiple items can be added like so: `myContainer.addChild(thingOne, thingTwo, thingThree)`
   * @param {...Container} children - The Container(s) to add to the container
   * @returns {Container} - The first child that was added.
   */
  addChild(...e) {
    if (this.allowChildren || X(Y, "addChild: Only Containers will be allowed to add children in v8.0.0"), e.length > 1) {
      for (let i = 0; i < e.length; i++)
        this.addChild(e[i]);
      return e[0];
    }
    const t = e[0], r = this.renderGroup || this.parentRenderGroup;
    return t.parent === this ? (this.children.splice(this.children.indexOf(t), 1), this.children.push(t), r && (r.structureDidChange = !0), t) : (t.parent && t.parent.removeChild(t), this.children.push(t), this.sortableChildren && (this.sortDirty = !0), t.parent = this, t.didChange = !0, t._updateFlags = 15, r && r.addChild(t), this.emit("childAdded", t, this, this.children.length - 1), t.emit("added", this), this._didViewChangeTick++, t._zIndex !== 0 && t.depthOfChildModified(), t);
  }
  /**
   * Removes one or more children from the container.
   * @param {...Container} children - The Container(s) to remove
   * @returns {Container} The first child that was removed.
   */
  removeChild(...e) {
    if (e.length > 1) {
      for (let i = 0; i < e.length; i++)
        this.removeChild(e[i]);
      return e[0];
    }
    const t = e[0], r = this.children.indexOf(t);
    return r > -1 && (this._didViewChangeTick++, this.children.splice(r, 1), this.renderGroup ? this.renderGroup.removeChild(t) : this.parentRenderGroup && this.parentRenderGroup.removeChild(t), t.parentRenderLayer && t.parentRenderLayer.detach(t), t.parent = null, this.emit("childRemoved", t, this, r), t.emit("removed", this)), t;
  }
  /** @ignore */
  _onUpdate(e) {
    e && e === this._skew && this._updateSkew(), this._didContainerChangeTick++, !this.didChange && (this.didChange = !0, this.parentRenderGroup && this.parentRenderGroup.onChildUpdate(this));
  }
  set isRenderGroup(e) {
    !!this.renderGroup !== e && (e ? this.enableRenderGroup() : this.disableRenderGroup());
  }
  /**
   * Returns true if this container is a render group.
   * This means that it will be rendered as a separate pass, with its own set of instructions
   */
  get isRenderGroup() {
    return !!this.renderGroup;
  }
  /**
   * Calling this enables a render group for this container.
   * This means it will be rendered as a separate set of instructions.
   * The transform of the container will also be handled on the GPU rather than the CPU.
   */
  enableRenderGroup() {
    if (this.renderGroup)
      return;
    const e = this.parentRenderGroup;
    e == null || e.removeChild(this), this.renderGroup = K.get(Jc, this), this.groupTransform = L.IDENTITY, e == null || e.addChild(this), this._updateIsSimple();
  }
  /** This will disable the render group for this container. */
  disableRenderGroup() {
    if (!this.renderGroup)
      return;
    const e = this.parentRenderGroup;
    e == null || e.removeChild(this), K.return(this.renderGroup), this.renderGroup = null, this.groupTransform = this.relativeGroupTransform, e == null || e.addChild(this), this._updateIsSimple();
  }
  /** @ignore */
  _updateIsSimple() {
    this.isSimple = !this.renderGroup && this.effects.length === 0;
  }
  /**
   * Current transform of the object based on world (parent) factors.
   * @readonly
   */
  get worldTransform() {
    return this._worldTransform || (this._worldTransform = new L()), this.renderGroup ? this._worldTransform.copyFrom(this.renderGroup.worldTransform) : this.parentRenderGroup && this._worldTransform.appendFrom(this.relativeGroupTransform, this.parentRenderGroup.worldTransform), this._worldTransform;
  }
  /**
   * The position of the container on the x axis relative to the local coordinates of the parent.
   * An alias to position.x
   */
  get x() {
    return this._position.x;
  }
  set x(e) {
    this._position.x = e;
  }
  /**
   * The position of the container on the y axis relative to the local coordinates of the parent.
   * An alias to position.y
   */
  get y() {
    return this._position.y;
  }
  set y(e) {
    this._position.y = e;
  }
  /**
   * The coordinate of the object relative to the local coordinates of the parent.
   * @since 4.0.0
   */
  get position() {
    return this._position;
  }
  set position(e) {
    this._position.copyFrom(e);
  }
  /**
   * The rotation of the object in radians.
   * 'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.
   */
  get rotation() {
    return this._rotation;
  }
  set rotation(e) {
    this._rotation !== e && (this._rotation = e, this._onUpdate(this._skew));
  }
  /**
   * The angle of the object in degrees.
   * 'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.
   */
  get angle() {
    return this.rotation * xc;
  }
  set angle(e) {
    this.rotation = e * yc;
  }
  /**
   * The center of rotation, scaling, and skewing for this display object in its local space. The `position`
   * is the projection of `pivot` in the parent's local space.
   *
   * By default, the pivot is the origin (0, 0).
   * @since 4.0.0
   */
  get pivot() {
    return this._pivot === rs && (this._pivot = new Te(this, 0, 0)), this._pivot;
  }
  set pivot(e) {
    this._pivot === rs && (this._pivot = new Te(this, 0, 0)), typeof e == "number" ? this._pivot.set(e) : this._pivot.copyFrom(e);
  }
  /**
   * The skew factor for the object in radians.
   * @since 4.0.0
   */
  get skew() {
    return this._skew === ts && (this._skew = new Te(this, 0, 0)), this._skew;
  }
  set skew(e) {
    this._skew === ts && (this._skew = new Te(this, 0, 0)), this._skew.copyFrom(e);
  }
  /**
   * The scale factors of this object along the local coordinate axes.
   *
   * The default scale is (1, 1).
   * @since 4.0.0
   */
  get scale() {
    return this._scale === ss && (this._scale = new Te(this, 1, 1)), this._scale;
  }
  set scale(e) {
    this._scale === ss && (this._scale = new Te(this, 0, 0)), typeof e == "number" ? this._scale.set(e) : this._scale.copyFrom(e);
  }
  /**
   * The width of the Container, setting this will actually modify the scale to achieve the value set.
   * @memberof scene.Container#
   */
  get width() {
    return Math.abs(this.scale.x * this.getLocalBounds().width);
  }
  set width(e) {
    const t = this.getLocalBounds().width;
    this._setWidth(e, t);
  }
  /**
   * The height of the Container, setting this will actually modify the scale to achieve the value set.
   * @memberof scene.Container#
   */
  get height() {
    return Math.abs(this.scale.y * this.getLocalBounds().height);
  }
  set height(e) {
    const t = this.getLocalBounds().height;
    this._setHeight(e, t);
  }
  /**
   * Retrieves the size of the container as a [Size]{@link Size} object.
   * This is faster than get the width and height separately.
   * @param out - Optional object to store the size in.
   * @returns - The size of the container.
   * @memberof scene.Container#
   */
  getSize(e) {
    e || (e = {});
    const t = this.getLocalBounds();
    return e.width = Math.abs(this.scale.x * t.width), e.height = Math.abs(this.scale.y * t.height), e;
  }
  /**
   * Sets the size of the container to the specified width and height.
   * This is faster than setting the width and height separately.
   * @param value - This can be either a number or a [Size]{@link Size} object.
   * @param height - The height to set. Defaults to the value of `width` if not provided.
   * @memberof scene.Container#
   */
  setSize(e, t) {
    const r = this.getLocalBounds();
    typeof e == "object" ? (t = e.height ?? e.width, e = e.width) : t ?? (t = e), e !== void 0 && this._setWidth(e, r.width), t !== void 0 && this._setHeight(t, r.height);
  }
  /** Called when the skew or the rotation changes. */
  _updateSkew() {
    const e = this._rotation, t = this._skew;
    this._cx = Math.cos(e + t._y), this._sx = Math.sin(e + t._y), this._cy = -Math.sin(e - t._x), this._sy = Math.cos(e - t._x);
  }
  /**
   * Updates the transform properties of the container (accepts partial values).
   * @param {object} opts - The options for updating the transform.
   * @param {number} opts.x - The x position of the container.
   * @param {number} opts.y - The y position of the container.
   * @param {number} opts.scaleX - The scale factor on the x-axis.
   * @param {number} opts.scaleY - The scale factor on the y-axis.
   * @param {number} opts.rotation - The rotation of the container, in radians.
   * @param {number} opts.skewX - The skew factor on the x-axis.
   * @param {number} opts.skewY - The skew factor on the y-axis.
   * @param {number} opts.pivotX - The x coordinate of the pivot point.
   * @param {number} opts.pivotY - The y coordinate of the pivot point.
   */
  updateTransform(e) {
    return this.position.set(
      typeof e.x == "number" ? e.x : this.position.x,
      typeof e.y == "number" ? e.y : this.position.y
    ), this.scale.set(
      typeof e.scaleX == "number" ? e.scaleX || 1 : this.scale.x,
      typeof e.scaleY == "number" ? e.scaleY || 1 : this.scale.y
    ), this.rotation = typeof e.rotation == "number" ? e.rotation : this.rotation, this.skew.set(
      typeof e.skewX == "number" ? e.skewX : this.skew.x,
      typeof e.skewY == "number" ? e.skewY : this.skew.y
    ), this.pivot.set(
      typeof e.pivotX == "number" ? e.pivotX : this.pivot.x,
      typeof e.pivotY == "number" ? e.pivotY : this.pivot.y
    ), this;
  }
  /**
   * Updates the local transform using the given matrix.
   * @param matrix - The matrix to use for updating the transform.
   */
  setFromMatrix(e) {
    e.decompose(this);
  }
  /** Updates the local transform. */
  updateLocalTransform() {
    const e = this._didContainerChangeTick;
    if (this._didLocalTransformChangeId === e)
      return;
    this._didLocalTransformChangeId = e;
    const t = this.localTransform, r = this._scale, i = this._pivot, n = this._position, a = r._x, o = r._y, h = i._x, l = i._y;
    t.a = this._cx * a, t.b = this._sx * a, t.c = this._cy * o, t.d = this._sy * o, t.tx = n._x - (h * t.a + l * t.c), t.ty = n._y - (h * t.b + l * t.d);
  }
  // / ///// color related stuff
  set alpha(e) {
    e !== this.localAlpha && (this.localAlpha = e, this._updateFlags |= Ur, this._onUpdate());
  }
  /** The opacity of the object. */
  get alpha() {
    return this.localAlpha;
  }
  set tint(e) {
    const r = re.shared.setValue(e ?? 16777215).toBgrNumber();
    r !== this.localColor && (this.localColor = r, this._updateFlags |= Ur, this._onUpdate());
  }
  /**
   * The tint applied to the sprite. This is a hex value.
   *
   * A value of 0xFFFFFF will remove any tint effect.
   * @default 0xFFFFFF
   */
  get tint() {
    return Er(this.localColor);
  }
  // / //////////////// blend related stuff
  set blendMode(e) {
    this.localBlendMode !== e && (this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0), this._updateFlags |= _i, this.localBlendMode = e, this._onUpdate());
  }
  /**
   * The blend mode to be applied to the sprite. Apply a value of `'normal'` to reset the blend mode.
   * @default 'normal'
   */
  get blendMode() {
    return this.localBlendMode;
  }
  // / ///////// VISIBILITY / RENDERABLE /////////////////
  /** The visibility of the object. If false the object will not be drawn, and the transform will not be updated. */
  get visible() {
    return !!(this.localDisplayStatus & 2);
  }
  set visible(e) {
    const t = e ? 2 : 0;
    (this.localDisplayStatus & 2) !== t && (this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0), this._updateFlags |= Yt, this.localDisplayStatus ^= 2, this._onUpdate());
  }
  /** @ignore */
  get culled() {
    return !(this.localDisplayStatus & 4);
  }
  /** @ignore */
  set culled(e) {
    const t = e ? 0 : 4;
    (this.localDisplayStatus & 4) !== t && (this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0), this._updateFlags |= Yt, this.localDisplayStatus ^= 4, this._onUpdate());
  }
  /** Can this object be rendered, if false the object will not be drawn but the transform will still be updated. */
  get renderable() {
    return !!(this.localDisplayStatus & 1);
  }
  set renderable(e) {
    const t = e ? 1 : 0;
    (this.localDisplayStatus & 1) !== t && (this._updateFlags |= Yt, this.localDisplayStatus ^= 1, this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0), this._onUpdate());
  }
  /** Whether or not the object should be rendered. */
  get isRenderable() {
    return this.localDisplayStatus === 7 && this.groupAlpha > 0;
  }
  /**
   * Removes all internal references and listeners as well as removes children from the display list.
   * Do not use a Container after calling `destroy`.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @param {boolean} [options.children=false] - if set to true, all the children will have their destroy
   *  method called as well. 'options' will be passed on to those calls.
   * @param {boolean} [options.texture=false] - Only used for children with textures e.g. Sprites. If options.children
   * is set to true it should destroy the texture of the child sprite
   * @param {boolean} [options.textureSource=false] - Only used for children with textures e.g. Sprites.
   * If options.children is set to true it should destroy the texture source of the child sprite
   * @param {boolean} [options.context=false] - Only used for children with graphicsContexts e.g. Graphics.
   * If options.children is set to true it should destroy the context of the child graphics
   */
  destroy(e = !1) {
    var i;
    if (this.destroyed)
      return;
    this.destroyed = !0;
    let t;
    if (this.children.length && (t = this.removeChildren(0, this.children.length)), this.removeFromParent(), this.parent = null, this._maskEffect = null, this._filterEffect = null, this.effects = null, this._position = null, this._scale = null, this._pivot = null, this._skew = null, this.emit("destroyed", this), this.removeAllListeners(), (typeof e == "boolean" ? e : e == null ? void 0 : e.children) && t)
      for (let n = 0; n < t.length; ++n)
        t[n].destroy(e);
    (i = this.renderGroup) == null || i.destroy(), this.renderGroup = null;
  }
}
z.mixin(
  _e,
  Dc,
  zc,
  qc,
  jc,
  Xc,
  Nc,
  Hc,
  Yc,
  Gc,
  Fc,
  Vc,
  Oc
);
class Wr extends _e {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(e) {
    super(e), this.canBundle = !0, this.allowChildren = !1, this._roundPixels = 0, this._lastUsed = -1, this._bounds = new ye(0, 1, 0, 0), this._boundsDirty = !0;
  }
  /**
   * The local bounds of the view.
   * @type {rendering.Bounds}
   */
  get bounds() {
    return this._boundsDirty ? (this.updateBounds(), this._boundsDirty = !1, this._bounds) : this._bounds;
  }
  /**
   * Whether or not to round the x/y position of the sprite.
   * @type {boolean}
   */
  get roundPixels() {
    return !!this._roundPixels;
  }
  set roundPixels(e) {
    this._roundPixels = e ? 1 : 0;
  }
  /**
   * Checks if the object contains the given point.
   * @param point - The point to check
   */
  containsPoint(e) {
    const t = this.bounds, { x: r, y: i } = e;
    return r >= t.minX && r <= t.maxX && i >= t.minY && i <= t.maxY;
  }
  /** @private */
  onViewUpdate() {
    if (this._didViewChangeTick++, this._boundsDirty = !0, this.didViewUpdate)
      return;
    this.didViewUpdate = !0;
    const e = this.renderGroup || this.parentRenderGroup;
    e && e.onChildViewUpdate(this);
  }
  destroy(e) {
    super.destroy(e), this._bounds = null;
  }
  collectRenderablesSimple(e, t, r) {
    const { renderPipes: i, renderableGC: n } = t;
    i.blendMode.setBlendMode(this, this.groupBlendMode, e), i[this.renderPipeId].addRenderable(this, e), n.addRenderable(this), this.didViewUpdate = !1;
    const o = this.children, h = o.length;
    for (let l = 0; l < h; l++)
      o[l].collectRenderables(e, t, r);
  }
}
class $e extends Wr {
  /**
   * @param options - The options for creating the sprite.
   */
  constructor(e = D.EMPTY) {
    e instanceof D && (e = { texture: e });
    const { texture: t = D.EMPTY, anchor: r, roundPixels: i, width: n, height: a, ...o } = e;
    super({
      label: "Sprite",
      ...o
    }), this.renderPipeId = "sprite", this.batched = !0, this._visualBounds = { minX: 0, maxX: 1, minY: 0, maxY: 0 }, this._anchor = new Te(
      {
        _onUpdate: () => {
          this.onViewUpdate();
        }
      }
    ), r ? this.anchor = r : t.defaultAnchor && (this.anchor = t.defaultAnchor), this.texture = t, this.allowChildren = !1, this.roundPixels = i ?? !1, n !== void 0 && (this.width = n), a !== void 0 && (this.height = a);
  }
  /**
   * Helper function that creates a new sprite based on the source you provide.
   * The source can be - frame id, image, video, canvas element, video element, texture
   * @param source - Source to create texture from
   * @param [skipCache] - Whether to skip the cache or not
   * @returns The newly created sprite
   */
  static from(e, t = !1) {
    return e instanceof D ? new $e(e) : new $e(D.from(e, t));
  }
  set texture(e) {
    e || (e = D.EMPTY);
    const t = this._texture;
    t !== e && (t && t.dynamic && t.off("update", this.onViewUpdate, this), e.dynamic && e.on("update", this.onViewUpdate, this), this._texture = e, this._width && this._setWidth(this._width, this._texture.orig.width), this._height && this._setHeight(this._height, this._texture.orig.height), this.onViewUpdate());
  }
  /** The texture that the sprite is using. */
  get texture() {
    return this._texture;
  }
  /**
   * The bounds of the sprite, taking the texture's trim into account.
   * @type {rendering.Bounds}
   */
  get visualBounds() {
    return ro(this._visualBounds, this._anchor, this._texture), this._visualBounds;
  }
  /**
   * @deprecated
   */
  get sourceBounds() {
    return X("8.6.1", "Sprite.sourceBounds is deprecated, use visualBounds instead."), this.visualBounds;
  }
  /** @private */
  updateBounds() {
    const e = this._anchor, t = this._texture, r = this._bounds, { width: i, height: n } = t.orig;
    r.minX = -e._x * i, r.maxX = r.minX + i, r.minY = -e._y * n, r.maxY = r.minY + n;
  }
  /**
   * Destroys this sprite renderable and optionally its texture.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @param {boolean} [options.texture=false] - Should it destroy the current texture of the renderable as well
   * @param {boolean} [options.textureSource=false] - Should it destroy the textureSource of the renderable as well
   */
  destroy(e = !1) {
    if (super.destroy(e), typeof e == "boolean" ? e : e == null ? void 0 : e.texture) {
      const r = typeof e == "boolean" ? e : e == null ? void 0 : e.textureSource;
      this._texture.destroy(r);
    }
    this._texture = null, this._visualBounds = null, this._bounds = null, this._anchor = null;
  }
  /**
   * The anchor sets the origin point of the sprite. The default value is taken from the {@link Texture}
   * and passed to the constructor.
   *
   * The default is `(0,0)`, this means the sprite's origin is the top left.
   *
   * Setting the anchor to `(0.5,0.5)` means the sprite's origin is centered.
   *
   * Setting the anchor to `(1,1)` would mean the sprite's origin point will be the bottom right corner.
   *
   * If you pass only single parameter, it will set both x and y to the same value as shown in the example below.
   * @example
   * import { Sprite } from 'pixi.js';
   *
   * const sprite = new Sprite({texture: Texture.WHITE});
   * sprite.anchor.set(0.5); // This will set the origin to center. (0.5) is same as (0.5, 0.5).
   */
  get anchor() {
    return this._anchor;
  }
  set anchor(e) {
    typeof e == "number" ? this._anchor.set(e) : this._anchor.copyFrom(e);
  }
  /** The width of the sprite, setting this will actually modify the scale to achieve the value set. */
  get width() {
    return Math.abs(this.scale.x) * this._texture.orig.width;
  }
  set width(e) {
    this._setWidth(e, this._texture.orig.width), this._width = e;
  }
  /** The height of the sprite, setting this will actually modify the scale to achieve the value set. */
  get height() {
    return Math.abs(this.scale.y) * this._texture.orig.height;
  }
  set height(e) {
    this._setHeight(e, this._texture.orig.height), this._height = e;
  }
  /**
   * Retrieves the size of the Sprite as a [Size]{@link Size} object.
   * This is faster than get the width and height separately.
   * @param out - Optional object to store the size in.
   * @returns - The size of the Sprite.
   */
  getSize(e) {
    return e || (e = {}), e.width = Math.abs(this.scale.x) * this._texture.orig.width, e.height = Math.abs(this.scale.y) * this._texture.orig.height, e;
  }
  /**
   * Sets the size of the Sprite to the specified width and height.
   * This is faster than setting the width and height separately.
   * @param value - This can be either a number or a [Size]{@link Size} object.
   * @param height - The height to set. Defaults to the value of `width` if not provided.
   */
  setSize(e, t) {
    typeof e == "object" ? (t = e.height ?? e.width, e = e.width) : t ?? (t = e), e !== void 0 && this._setWidth(e, this._texture.orig.width), t !== void 0 && this._setHeight(t, this._texture.orig.height);
  }
}
const tu = new ye();
function fo(s, e, t) {
  const r = tu;
  s.measurable = !0, pi(s, t, r), e.addBoundsMask(r), s.measurable = !1;
}
function po(s, e, t) {
  const r = Ze.get();
  s.measurable = !0;
  const i = ve.get().identity(), n = mo(s, t, i);
  gi(s, r, n), s.measurable = !1, e.addBoundsMask(r), ve.return(i), Ze.return(r);
}
function mo(s, e, t) {
  return s ? (s !== e && (mo(s.parent, e, t), s.updateLocalTransform(), t.append(s.localTransform)), t) : (V("Mask bounds, renderable is not inside the root container"), t);
}
class go {
  constructor(e) {
    this.priority = 0, this.inverse = !1, this.pipe = "alphaMask", e != null && e.mask && this.init(e.mask);
  }
  init(e) {
    this.mask = e, this.renderMaskToTexture = !(e instanceof $e), this.mask.renderable = this.renderMaskToTexture, this.mask.includeInBuild = !this.renderMaskToTexture, this.mask.measurable = !1;
  }
  reset() {
    this.mask.measurable = !0, this.mask = null;
  }
  addBounds(e, t) {
    this.inverse || fo(this.mask, e, t);
  }
  addLocalBounds(e, t) {
    po(this.mask, e, t);
  }
  containsPoint(e, t) {
    const r = this.mask;
    return t(r, e);
  }
  destroy() {
    this.reset();
  }
  static test(e) {
    return e instanceof $e;
  }
}
go.extension = v.MaskEffect;
class _o {
  constructor(e) {
    this.priority = 0, this.pipe = "colorMask", e != null && e.mask && this.init(e.mask);
  }
  init(e) {
    this.mask = e;
  }
  destroy() {
  }
  static test(e) {
    return typeof e == "number";
  }
}
_o.extension = v.MaskEffect;
class xo {
  constructor(e) {
    this.priority = 0, this.pipe = "stencilMask", e != null && e.mask && this.init(e.mask);
  }
  init(e) {
    this.mask = e, this.mask.includeInBuild = !1, this.mask.measurable = !1;
  }
  reset() {
    this.mask.measurable = !0, this.mask.includeInBuild = !0, this.mask = null;
  }
  addBounds(e, t) {
    fo(this.mask, e, t);
  }
  addLocalBounds(e, t) {
    po(this.mask, e, t);
  }
  containsPoint(e, t) {
    const r = this.mask;
    return t(r, e);
  }
  destroy() {
    this.reset();
  }
  static test(e) {
    return e instanceof _e;
  }
}
xo.extension = v.MaskEffect;
const ru = {
  createCanvas: (s, e) => {
    const t = document.createElement("canvas");
    return t.width = s, t.height = e, t;
  },
  getCanvasRenderingContext2D: () => CanvasRenderingContext2D,
  getWebGLRenderingContext: () => WebGLRenderingContext,
  getNavigator: () => navigator,
  getBaseUrl: () => document.baseURI ?? window.location.href,
  getFontFaceSet: () => document.fonts,
  fetch: (s, e) => fetch(s, e),
  parseXML: (s) => new DOMParser().parseFromString(s, "text/xml")
};
let xn = ru;
const Z = {
  /**
   * Returns the current adapter.
   * @returns {environment.Adapter} The current adapter.
   */
  get() {
    return xn;
  },
  /**
   * Sets the current adapter.
   * @param adapter - The new adapter.
   */
  set(s) {
    xn = s;
  }
};
class Qe extends me {
  constructor(e) {
    e.resource || (e.resource = Z.get().createCanvas()), e.width || (e.width = e.resource.width, e.autoDensity || (e.width /= e.resolution)), e.height || (e.height = e.resource.height, e.autoDensity || (e.height /= e.resolution)), super(e), this.uploadMethodId = "image", this.autoDensity = e.autoDensity, this.resizeCanvas(), this.transparent = !!e.transparent;
  }
  resizeCanvas() {
    this.autoDensity && (this.resource.style.width = `${this.width}px`, this.resource.style.height = `${this.height}px`), (this.resource.width !== this.pixelWidth || this.resource.height !== this.pixelHeight) && (this.resource.width = this.pixelWidth, this.resource.height = this.pixelHeight);
  }
  resize(e = this.width, t = this.height, r = this._resolution) {
    const i = super.resize(e, t, r);
    return i && this.resizeCanvas(), i;
  }
  static test(e) {
    return globalThis.HTMLCanvasElement && e instanceof HTMLCanvasElement || globalThis.OffscreenCanvas && e instanceof OffscreenCanvas;
  }
  /**
   * Returns the 2D rendering context for the canvas.
   * Caches the context after creating it.
   * @returns The 2D rendering context of the canvas.
   */
  get context2D() {
    return this._context2D || (this._context2D = this.resource.getContext("2d"));
  }
}
Qe.extension = v.TextureSource;
class xt extends me {
  constructor(e) {
    if (e.resource && globalThis.HTMLImageElement && e.resource instanceof HTMLImageElement) {
      const t = Z.get().createCanvas(e.resource.width, e.resource.height);
      t.getContext("2d").drawImage(e.resource, 0, 0, e.resource.width, e.resource.height), e.resource = t, V("ImageSource: Image element passed, converting to canvas. Use CanvasSource instead.");
    }
    super(e), this.uploadMethodId = "image", this.autoGarbageCollect = !0;
  }
  static test(e) {
    return globalThis.HTMLImageElement && e instanceof HTMLImageElement || typeof ImageBitmap < "u" && e instanceof ImageBitmap || globalThis.VideoFrame && e instanceof VideoFrame;
  }
}
xt.extension = v.TextureSource;
var Jt = /* @__PURE__ */ ((s) => (s[s.INTERACTION = 50] = "INTERACTION", s[s.HIGH = 25] = "HIGH", s[s.NORMAL = 0] = "NORMAL", s[s.LOW = -25] = "LOW", s[s.UTILITY = -50] = "UTILITY", s))(Jt || {});
class is {
  /**
   * Constructor
   * @private
   * @param fn - The listener function to be added for one update
   * @param context - The listener context
   * @param priority - The priority for emitting
   * @param once - If the handler should fire once
   */
  constructor(e, t = null, r = 0, i = !1) {
    this.next = null, this.previous = null, this._destroyed = !1, this._fn = e, this._context = t, this.priority = r, this._once = i;
  }
  /**
   * Simple compare function to figure out if a function and context match.
   * @param fn - The listener function to be added for one update
   * @param context - The listener context
   * @returns `true` if the listener match the arguments
   */
  match(e, t = null) {
    return this._fn === e && this._context === t;
  }
  /**
   * Emit by calling the current function.
   * @param ticker - The ticker emitting.
   * @returns Next ticker
   */
  emit(e) {
    this._fn && (this._context ? this._fn.call(this._context, e) : this._fn(e));
    const t = this.next;
    return this._once && this.destroy(!0), this._destroyed && (this.next = null), t;
  }
  /**
   * Connect to the list.
   * @param previous - Input node, previous listener
   */
  connect(e) {
    this.previous = e, e.next && (e.next.previous = this), this.next = e.next, e.next = this;
  }
  /**
   * Destroy and don't use after this.
   * @param hard - `true` to remove the `next` reference, this
   *        is considered a hard destroy. Soft destroy maintains the next reference.
   * @returns The listener to redirect while emitting or removing.
   */
  destroy(e = !1) {
    this._destroyed = !0, this._fn = null, this._context = null, this.previous && (this.previous.next = this.next), this.next && (this.next.previous = this.previous);
    const t = this.next;
    return this.next = e ? null : t, this.previous = null, t;
  }
}
const yo = class Ae {
  constructor() {
    this.autoStart = !1, this.deltaTime = 1, this.lastTime = -1, this.speed = 1, this.started = !1, this._requestId = null, this._maxElapsedMS = 100, this._minElapsedMS = 0, this._protected = !1, this._lastFrame = -1, this._head = new is(null, null, 1 / 0), this.deltaMS = 1 / Ae.targetFPMS, this.elapsedMS = 1 / Ae.targetFPMS, this._tick = (e) => {
      this._requestId = null, this.started && (this.update(e), this.started && this._requestId === null && this._head.next && (this._requestId = requestAnimationFrame(this._tick)));
    };
  }
  /**
   * Conditionally requests a new animation frame.
   * If a frame has not already been requested, and if the internal
   * emitter has listeners, a new frame is requested.
   * @private
   */
  _requestIfNeeded() {
    this._requestId === null && this._head.next && (this.lastTime = performance.now(), this._lastFrame = this.lastTime, this._requestId = requestAnimationFrame(this._tick));
  }
  /**
   * Conditionally cancels a pending animation frame.
   * @private
   */
  _cancelIfNeeded() {
    this._requestId !== null && (cancelAnimationFrame(this._requestId), this._requestId = null);
  }
  /**
   * Conditionally requests a new animation frame.
   * If the ticker has been started it checks if a frame has not already
   * been requested, and if the internal emitter has listeners. If these
   * conditions are met, a new frame is requested. If the ticker has not
   * been started, but autoStart is `true`, then the ticker starts now,
   * and continues with the previous conditions to request a new frame.
   * @private
   */
  _startIfPossible() {
    this.started ? this._requestIfNeeded() : this.autoStart && this.start();
  }
  /**
   * Register a handler for tick events. Calls continuously unless
   * it is removed or the ticker is stopped.
   * @param fn - The listener function to be added for updates
   * @param context - The listener context
   * @param {number} [priority=UPDATE_PRIORITY.NORMAL] - The priority for emitting
   * @returns This instance of a ticker
   */
  add(e, t, r = Jt.NORMAL) {
    return this._addListener(new is(e, t, r));
  }
  /**
   * Add a handler for the tick event which is only execute once.
   * @param fn - The listener function to be added for one update
   * @param context - The listener context
   * @param {number} [priority=UPDATE_PRIORITY.NORMAL] - The priority for emitting
   * @returns This instance of a ticker
   */
  addOnce(e, t, r = Jt.NORMAL) {
    return this._addListener(new is(e, t, r, !0));
  }
  /**
   * Internally adds the event handler so that it can be sorted by priority.
   * Priority allows certain handler (user, AnimatedSprite, Interaction) to be run
   * before the rendering.
   * @private
   * @param listener - Current listener being added.
   * @returns This instance of a ticker
   */
  _addListener(e) {
    let t = this._head.next, r = this._head;
    if (!t)
      e.connect(r);
    else {
      for (; t; ) {
        if (e.priority > t.priority) {
          e.connect(r);
          break;
        }
        r = t, t = t.next;
      }
      e.previous || e.connect(r);
    }
    return this._startIfPossible(), this;
  }
  /**
   * Removes any handlers matching the function and context parameters.
   * If no handlers are left after removing, then it cancels the animation frame.
   * @param fn - The listener function to be removed
   * @param context - The listener context to be removed
   * @returns This instance of a ticker
   */
  remove(e, t) {
    let r = this._head.next;
    for (; r; )
      r.match(e, t) ? r = r.destroy() : r = r.next;
    return this._head.next || this._cancelIfNeeded(), this;
  }
  /**
   * The number of listeners on this ticker, calculated by walking through linked list
   * @readonly
   * @member {number}
   */
  get count() {
    if (!this._head)
      return 0;
    let e = 0, t = this._head;
    for (; t = t.next; )
      e++;
    return e;
  }
  /** Starts the ticker. If the ticker has listeners a new animation frame is requested at this point. */
  start() {
    this.started || (this.started = !0, this._requestIfNeeded());
  }
  /** Stops the ticker. If the ticker has requested an animation frame it is canceled at this point. */
  stop() {
    this.started && (this.started = !1, this._cancelIfNeeded());
  }
  /** Destroy the ticker and don't use after this. Calling this method removes all references to internal events. */
  destroy() {
    if (!this._protected) {
      this.stop();
      let e = this._head.next;
      for (; e; )
        e = e.destroy(!0);
      this._head.destroy(), this._head = null;
    }
  }
  /**
   * Triggers an update. An update entails setting the
   * current {@link ticker.Ticker#elapsedMS|elapsedMS},
   * the current {@link ticker.Ticker#deltaTime|deltaTime},
   * invoking all listeners with current deltaTime,
   * and then finally setting {@link ticker.Ticker#lastTime|lastTime}
   * with the value of currentTime that was provided.
   * This method will be called automatically by animation
   * frame callbacks if the ticker instance has been started
   * and listeners are added.
   * @param {number} [currentTime=performance.now()] - the current time of execution
   */
  update(e = performance.now()) {
    let t;
    if (e > this.lastTime) {
      if (t = this.elapsedMS = e - this.lastTime, t > this._maxElapsedMS && (t = this._maxElapsedMS), t *= this.speed, this._minElapsedMS) {
        const n = e - this._lastFrame | 0;
        if (n < this._minElapsedMS)
          return;
        this._lastFrame = e - n % this._minElapsedMS;
      }
      this.deltaMS = t, this.deltaTime = this.deltaMS * Ae.targetFPMS;
      const r = this._head;
      let i = r.next;
      for (; i; )
        i = i.emit(this);
      r.next || this._cancelIfNeeded();
    } else
      this.deltaTime = this.deltaMS = this.elapsedMS = 0;
    this.lastTime = e;
  }
  /**
   * The frames per second at which this ticker is running.
   * The default is approximately 60 in most modern browsers.
   * **Note:** This does not factor in the value of
   * {@link ticker.Ticker#speed|speed}, which is specific
   * to scaling {@link ticker.Ticker#deltaTime|deltaTime}.
   * @member {number}
   * @readonly
   */
  get FPS() {
    return 1e3 / this.elapsedMS;
  }
  /**
   * Manages the maximum amount of milliseconds allowed to
   * elapse between invoking {@link ticker.Ticker#update|update}.
   * This value is used to cap {@link ticker.Ticker#deltaTime|deltaTime},
   * but does not effect the measured value of {@link ticker.Ticker#FPS|FPS}.
   * When setting this property it is clamped to a value between
   * `0` and `Ticker.targetFPMS * 1000`.
   * @member {number}
   * @default 10
   */
  get minFPS() {
    return 1e3 / this._maxElapsedMS;
  }
  set minFPS(e) {
    const t = Math.min(this.maxFPS, e), r = Math.min(Math.max(0, t) / 1e3, Ae.targetFPMS);
    this._maxElapsedMS = 1 / r;
  }
  /**
   * Manages the minimum amount of milliseconds required to
   * elapse between invoking {@link ticker.Ticker#update|update}.
   * This will effect the measured value of {@link ticker.Ticker#FPS|FPS}.
   * If it is set to `0`, then there is no limit; PixiJS will render as many frames as it can.
   * Otherwise it will be at least `minFPS`
   * @member {number}
   * @default 0
   */
  get maxFPS() {
    return this._minElapsedMS ? Math.round(1e3 / this._minElapsedMS) : 0;
  }
  set maxFPS(e) {
    if (e === 0)
      this._minElapsedMS = 0;
    else {
      const t = Math.max(this.minFPS, e);
      this._minElapsedMS = 1 / (t / 1e3);
    }
  }
  /**
   * The shared ticker instance used by {@link AnimatedSprite} and by
   * {@link VideoResource} to update animation frames / video textures.
   *
   * It may also be used by {@link Application} if created with the `sharedTicker` option property set to true.
   *
   * The property {@link ticker.Ticker#autoStart|autoStart} is set to `true` for this instance.
   * Please follow the examples for usage, including how to opt-out of auto-starting the shared ticker.
   * @example
   * import { Ticker } from 'pixi.js';
   *
   * const ticker = Ticker.shared;
   * // Set this to prevent starting this ticker when listeners are added.
   * // By default this is true only for the Ticker.shared instance.
   * ticker.autoStart = false;
   *
   * // FYI, call this to ensure the ticker is stopped. It should be stopped
   * // if you have not attempted to render anything yet.
   * ticker.stop();
   *
   * // Call this when you are ready for a running shared ticker.
   * ticker.start();
   * @example
   * import { autoDetectRenderer, Container } from 'pixi.js';
   *
   * // You may use the shared ticker to render...
   * const renderer = autoDetectRenderer();
   * const stage = new Container();
   * document.body.appendChild(renderer.view);
   * ticker.add((time) => renderer.render(stage));
   *
   * // Or you can just update it manually.
   * ticker.autoStart = false;
   * ticker.stop();
   * const animate = (time) => {
   *     ticker.update(time);
   *     renderer.render(stage);
   *     requestAnimationFrame(animate);
   * };
   * animate(performance.now());
   * @member {ticker.Ticker}
   * @readonly
   * @static
   */
  static get shared() {
    if (!Ae._shared) {
      const e = Ae._shared = new Ae();
      e.autoStart = !0, e._protected = !0;
    }
    return Ae._shared;
  }
  /**
   * The system ticker instance used by {@link BasePrepare} for core timing
   * functionality that shouldn't usually need to be paused, unlike the `shared`
   * ticker which drives visual animations and rendering which may want to be paused.
   *
   * The property {@link ticker.Ticker#autoStart|autoStart} is set to `true` for this instance.
   * @member {ticker.Ticker}
   * @readonly
   * @static
   */
  static get system() {
    if (!Ae._system) {
      const e = Ae._system = new Ae();
      e.autoStart = !0, e._protected = !0;
    }
    return Ae._system;
  }
};
yo.targetFPMS = 0.06;
let Xe = yo, ns;
async function bo() {
  return ns ?? (ns = (async () => {
    var a;
    const e = document.createElement("canvas").getContext("webgl");
    if (!e)
      return "premultiply-alpha-on-upload";
    const t = await new Promise((o) => {
      const h = document.createElement("video");
      h.onloadeddata = () => o(h), h.onerror = () => o(null), h.autoplay = !1, h.crossOrigin = "anonymous", h.preload = "auto", h.src = "data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHGTbuMU6uEElTDZ1OsggEXTbuMU6uEHFO7a1OsggG97AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmoCrXsYMPQkBNgIRMYXZmV0GETGF2ZkSJiEBEAAAAAAAAFlSua8yuAQAAAAAAAEPXgQFzxYgAAAAAAAAAAZyBACK1nIN1bmSIgQCGhVZfVlA5g4EBI+ODhAJiWgDglLCBArqBApqBAlPAgQFVsIRVuYEBElTDZ9Vzc9JjwItjxYgAAAAAAAAAAWfInEWjh0VOQ09ERVJEh49MYXZjIGxpYnZweC12cDlnyKJFo4hEVVJBVElPTkSHlDAwOjAwOjAwLjA0MDAwMDAwMAAAH0O2dcfngQCgwqGggQAAAIJJg0IAABAAFgA4JBwYSgAAICAAEb///4r+AAB1oZ2mm+6BAaWWgkmDQgAAEAAWADgkHBhKAAAgIABIQBxTu2uRu4+zgQC3iveBAfGCAXHwgQM=", h.load();
    });
    if (!t)
      return "premultiply-alpha-on-upload";
    const r = e.createTexture();
    e.bindTexture(e.TEXTURE_2D, r);
    const i = e.createFramebuffer();
    e.bindFramebuffer(e.FRAMEBUFFER, i), e.framebufferTexture2D(
      e.FRAMEBUFFER,
      e.COLOR_ATTACHMENT0,
      e.TEXTURE_2D,
      r,
      0
    ), e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !1), e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL, e.NONE), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, e.RGBA, e.UNSIGNED_BYTE, t);
    const n = new Uint8Array(4);
    return e.readPixels(0, 0, 1, 1, e.RGBA, e.UNSIGNED_BYTE, n), e.deleteFramebuffer(i), e.deleteTexture(r), (a = e.getExtension("WEBGL_lose_context")) == null || a.loseContext(), n[0] <= n[3] ? "premultiplied-alpha" : "premultiply-alpha-on-upload";
  })()), ns;
}
const zr = class vo extends me {
  constructor(e) {
    super(e), this.isReady = !1, this.uploadMethodId = "video", e = {
      ...vo.defaultOptions,
      ...e
    }, this._autoUpdate = !0, this._isConnectedToTicker = !1, this._updateFPS = e.updateFPS || 0, this._msToNextUpdate = 0, this.autoPlay = e.autoPlay !== !1, this.alphaMode = e.alphaMode ?? "premultiply-alpha-on-upload", this._videoFrameRequestCallback = this._videoFrameRequestCallback.bind(this), this._videoFrameRequestCallbackHandle = null, this._load = null, this._resolve = null, this._reject = null, this._onCanPlay = this._onCanPlay.bind(this), this._onCanPlayThrough = this._onCanPlayThrough.bind(this), this._onError = this._onError.bind(this), this._onPlayStart = this._onPlayStart.bind(this), this._onPlayStop = this._onPlayStop.bind(this), this._onSeeked = this._onSeeked.bind(this), e.autoLoad !== !1 && this.load();
  }
  /** Update the video frame if the source is not destroyed and meets certain conditions. */
  updateFrame() {
    if (!this.destroyed) {
      if (this._updateFPS) {
        const e = Xe.shared.elapsedMS * this.resource.playbackRate;
        this._msToNextUpdate = Math.floor(this._msToNextUpdate - e);
      }
      (!this._updateFPS || this._msToNextUpdate <= 0) && (this._msToNextUpdate = this._updateFPS ? Math.floor(1e3 / this._updateFPS) : 0), this.isValid && this.update();
    }
  }
  /** Callback to update the video frame and potentially request the next frame update. */
  _videoFrameRequestCallback() {
    this.updateFrame(), this.destroyed ? this._videoFrameRequestCallbackHandle = null : this._videoFrameRequestCallbackHandle = this.resource.requestVideoFrameCallback(
      this._videoFrameRequestCallback
    );
  }
  /**
   * Checks if the resource has valid dimensions.
   * @returns {boolean} True if width and height are set, otherwise false.
   */
  get isValid() {
    return !!this.resource.videoWidth && !!this.resource.videoHeight;
  }
  /**
   * Start preloading the video resource.
   * @returns {Promise<this>} Handle the validate event
   */
  async load() {
    if (this._load)
      return this._load;
    const e = this.resource, t = this.options;
    return (e.readyState === e.HAVE_ENOUGH_DATA || e.readyState === e.HAVE_FUTURE_DATA) && e.width && e.height && (e.complete = !0), e.addEventListener("play", this._onPlayStart), e.addEventListener("pause", this._onPlayStop), e.addEventListener("seeked", this._onSeeked), this._isSourceReady() ? this._mediaReady() : (t.preload || e.addEventListener("canplay", this._onCanPlay), e.addEventListener("canplaythrough", this._onCanPlayThrough), e.addEventListener("error", this._onError, !0)), this.alphaMode = await bo(), this._load = new Promise((r, i) => {
      this.isValid ? r(this) : (this._resolve = r, this._reject = i, t.preloadTimeoutMs !== void 0 && (this._preloadTimeout = setTimeout(() => {
        this._onError(new ErrorEvent(`Preload exceeded timeout of ${t.preloadTimeoutMs}ms`));
      })), e.load());
    }), this._load;
  }
  /**
   * Handle video error events.
   * @param event - The error event
   */
  _onError(e) {
    this.resource.removeEventListener("error", this._onError, !0), this.emit("error", e), this._reject && (this._reject(e), this._reject = null, this._resolve = null);
  }
  /**
   * Checks if the underlying source is playing.
   * @returns True if playing.
   */
  _isSourcePlaying() {
    const e = this.resource;
    return !e.paused && !e.ended;
  }
  /**
   * Checks if the underlying source is ready for playing.
   * @returns True if ready.
   */
  _isSourceReady() {
    return this.resource.readyState > 2;
  }
  /** Runs the update loop when the video is ready to play. */
  _onPlayStart() {
    this.isValid || this._mediaReady(), this._configureAutoUpdate();
  }
  /** Stops the update loop when a pause event is triggered. */
  _onPlayStop() {
    this._configureAutoUpdate();
  }
  /** Handles behavior when the video completes seeking to the current playback position. */
  _onSeeked() {
    this._autoUpdate && !this._isSourcePlaying() && (this._msToNextUpdate = 0, this.updateFrame(), this._msToNextUpdate = 0);
  }
  _onCanPlay() {
    this.resource.removeEventListener("canplay", this._onCanPlay), this._mediaReady();
  }
  _onCanPlayThrough() {
    this.resource.removeEventListener("canplaythrough", this._onCanPlay), this._preloadTimeout && (clearTimeout(this._preloadTimeout), this._preloadTimeout = void 0), this._mediaReady();
  }
  /** Fired when the video is loaded and ready to play. */
  _mediaReady() {
    const e = this.resource;
    this.isValid && (this.isReady = !0, this.resize(e.videoWidth, e.videoHeight)), this._msToNextUpdate = 0, this.updateFrame(), this._msToNextUpdate = 0, this._resolve && (this._resolve(this), this._resolve = null, this._reject = null), this._isSourcePlaying() ? this._onPlayStart() : this.autoPlay && this.resource.play();
  }
  /** Cleans up resources and event listeners associated with this texture. */
  destroy() {
    this._configureAutoUpdate();
    const e = this.resource;
    e && (e.removeEventListener("play", this._onPlayStart), e.removeEventListener("pause", this._onPlayStop), e.removeEventListener("seeked", this._onSeeked), e.removeEventListener("canplay", this._onCanPlay), e.removeEventListener("canplaythrough", this._onCanPlayThrough), e.removeEventListener("error", this._onError, !0), e.pause(), e.src = "", e.load()), super.destroy();
  }
  /** Should the base texture automatically update itself, set to true by default. */
  get autoUpdate() {
    return this._autoUpdate;
  }
  set autoUpdate(e) {
    e !== this._autoUpdate && (this._autoUpdate = e, this._configureAutoUpdate());
  }
  /**
   * How many times a second to update the texture from the video.
   * Leave at 0 to update at every render.
   * A lower fps can help performance, as updating the texture at 60fps on a 30ps video may not be efficient.
   */
  get updateFPS() {
    return this._updateFPS;
  }
  set updateFPS(e) {
    e !== this._updateFPS && (this._updateFPS = e, this._configureAutoUpdate());
  }
  /**
   * Configures the updating mechanism based on the current state and settings.
   *
   * This method decides between using the browser's native video frame callback or a custom ticker
   * for updating the video frame. It ensures optimal performance and responsiveness
   * based on the video's state, playback status, and the desired frames-per-second setting.
   *
   * - If `_autoUpdate` is enabled and the video source is playing:
   *   - It will prefer the native video frame callback if available and no specific FPS is set.
   *   - Otherwise, it will use a custom ticker for manual updates.
   * - If `_autoUpdate` is disabled or the video isn't playing, any active update mechanisms are halted.
   */
  _configureAutoUpdate() {
    this._autoUpdate && this._isSourcePlaying() ? !this._updateFPS && this.resource.requestVideoFrameCallback ? (this._isConnectedToTicker && (Xe.shared.remove(this.updateFrame, this), this._isConnectedToTicker = !1, this._msToNextUpdate = 0), this._videoFrameRequestCallbackHandle === null && (this._videoFrameRequestCallbackHandle = this.resource.requestVideoFrameCallback(
      this._videoFrameRequestCallback
    ))) : (this._videoFrameRequestCallbackHandle !== null && (this.resource.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle), this._videoFrameRequestCallbackHandle = null), this._isConnectedToTicker || (Xe.shared.add(this.updateFrame, this), this._isConnectedToTicker = !0, this._msToNextUpdate = 0)) : (this._videoFrameRequestCallbackHandle !== null && (this.resource.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle), this._videoFrameRequestCallbackHandle = null), this._isConnectedToTicker && (Xe.shared.remove(this.updateFrame, this), this._isConnectedToTicker = !1, this._msToNextUpdate = 0));
  }
  static test(e) {
    return globalThis.HTMLVideoElement && e instanceof HTMLVideoElement;
  }
};
zr.extension = v.TextureSource;
zr.defaultOptions = {
  ...me.defaultOptions,
  /** If true, the video will start loading immediately. */
  autoLoad: !0,
  /** If true, the video will start playing as soon as it is loaded. */
  autoPlay: !0,
  /** The number of times a second to update the texture from the video. Leave at 0 to update at every render. */
  updateFPS: 0,
  /** If true, the video will be loaded with the `crossorigin` attribute. */
  crossorigin: !0,
  /** If true, the video will loop when it ends. */
  loop: !1,
  /** If true, the video will be muted. */
  muted: !0,
  /** If true, the video will play inline. */
  playsinline: !0,
  /** If true, the video will be preloaded. */
  preload: !1
};
zr.MIME_TYPES = {
  ogv: "video/ogg",
  mov: "video/quicktime",
  m4v: "video/mp4"
};
let Mr = zr;
const Fe = (s, e, t = !1) => (Array.isArray(s) || (s = [s]), e ? s.map((r) => typeof r == "string" || t ? e(r) : r) : s);
class su {
  constructor() {
    this._parsers = [], this._cache = /* @__PURE__ */ new Map(), this._cacheMap = /* @__PURE__ */ new Map();
  }
  /** Clear all entries. */
  reset() {
    this._cacheMap.clear(), this._cache.clear();
  }
  /**
   * Check if the key exists
   * @param key - The key to check
   */
  has(e) {
    return this._cache.has(e);
  }
  /**
   * Fetch entry by key
   * @param key - The key of the entry to get
   */
  get(e) {
    const t = this._cache.get(e);
    return t || V(`[Assets] Asset id ${e} was not found in the Cache`), t;
  }
  /**
   * Set a value by key or keys name
   * @param key - The key or keys to set
   * @param value - The value to store in the cache or from which cacheable assets will be derived.
   */
  set(e, t) {
    const r = Fe(e);
    let i;
    for (let h = 0; h < this.parsers.length; h++) {
      const l = this.parsers[h];
      if (l.test(t)) {
        i = l.getCacheableAssets(r, t);
        break;
      }
    }
    const n = new Map(Object.entries(i || {}));
    i || r.forEach((h) => {
      n.set(h, t);
    });
    const a = [...n.keys()], o = {
      cacheKeys: a,
      keys: r
    };
    r.forEach((h) => {
      this._cacheMap.set(h, o);
    }), a.forEach((h) => {
      const l = i ? i[h] : t;
      this._cache.has(h) && this._cache.get(h) !== l && V("[Cache] already has key:", h), this._cache.set(h, n.get(h));
    });
  }
  /**
   * Remove entry by key
   *
   * This function will also remove any associated alias from the cache also.
   * @param key - The key of the entry to remove
   */
  remove(e) {
    if (!this._cacheMap.has(e)) {
      V(`[Assets] Asset id ${e} was not found in the Cache`);
      return;
    }
    const t = this._cacheMap.get(e);
    t.cacheKeys.forEach((i) => {
      this._cache.delete(i);
    }), t.keys.forEach((i) => {
      this._cacheMap.delete(i);
    });
  }
  /** All loader parsers registered */
  get parsers() {
    return this._parsers;
  }
}
const he = new su(), zs = [];
z.handleByList(v.TextureSource, zs);
function To(s = {}) {
  const e = s && s.resource, t = e ? s.resource : s, r = e ? s : { resource: s };
  for (let i = 0; i < zs.length; i++) {
    const n = zs[i];
    if (n.test(t))
      return new n(r);
  }
  throw new Error(`Could not find a source type for resource: ${r.resource}`);
}
function iu(s = {}, e = !1) {
  const t = s && s.resource, r = t ? s.resource : s, i = t ? s : { resource: s };
  if (!e && he.has(r))
    return he.get(r);
  const n = new D({ source: To(i) });
  return n.on("destroy", () => {
    he.has(r) && he.remove(r);
  }), e || he.set(r, n), n;
}
function nu(s, e = !1) {
  return typeof s == "string" ? he.get(s) : s instanceof me ? new D({ source: s }) : iu(s, e);
}
D.from = nu;
me.from = To;
z.add(go, _o, xo, Mr, xt, Qe, di);
var ht = /* @__PURE__ */ ((s) => (s[s.Low = 0] = "Low", s[s.Normal = 1] = "Normal", s[s.High = 2] = "High", s))(ht || {});
function Ge(s) {
  if (typeof s != "string")
    throw new TypeError(`Path must be a string. Received ${JSON.stringify(s)}`);
}
function Dt(s) {
  return s.split("?")[0].split("#")[0];
}
function au(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function ou(s, e, t) {
  return s.replace(new RegExp(au(e), "g"), t);
}
function hu(s, e) {
  let t = "", r = 0, i = -1, n = 0, a = -1;
  for (let o = 0; o <= s.length; ++o) {
    if (o < s.length)
      a = s.charCodeAt(o);
    else {
      if (a === 47)
        break;
      a = 47;
    }
    if (a === 47) {
      if (!(i === o - 1 || n === 1)) if (i !== o - 1 && n === 2) {
        if (t.length < 2 || r !== 2 || t.charCodeAt(t.length - 1) !== 46 || t.charCodeAt(t.length - 2) !== 46) {
          if (t.length > 2) {
            const h = t.lastIndexOf("/");
            if (h !== t.length - 1) {
              h === -1 ? (t = "", r = 0) : (t = t.slice(0, h), r = t.length - 1 - t.lastIndexOf("/")), i = o, n = 0;
              continue;
            }
          } else if (t.length === 2 || t.length === 1) {
            t = "", r = 0, i = o, n = 0;
            continue;
          }
        }
      } else
        t.length > 0 ? t += `/${s.slice(i + 1, o)}` : t = s.slice(i + 1, o), r = o - i - 1;
      i = o, n = 0;
    } else a === 46 && n !== -1 ? ++n : n = -1;
  }
  return t;
}
const Ce = {
  /**
   * Converts a path to posix format.
   * @param path - The path to convert to posix
   */
  toPosix(s) {
    return ou(s, "\\", "/");
  },
  /**
   * Checks if the path is a URL e.g. http://, https://
   * @param path - The path to check
   */
  isUrl(s) {
    return /^https?:/.test(this.toPosix(s));
  },
  /**
   * Checks if the path is a data URL
   * @param path - The path to check
   */
  isDataUrl(s) {
    return /^data:([a-z]+\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}()_|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s<>]*?)$/i.test(s);
  },
  /**
   * Checks if the path is a blob URL
   * @param path - The path to check
   */
  isBlobUrl(s) {
    return s.startsWith("blob:");
  },
  /**
   * Checks if the path has a protocol e.g. http://, https://, file:///, data:, blob:, C:/
   * This will return true for windows file paths
   * @param path - The path to check
   */
  hasProtocol(s) {
    return /^[^/:]+:/.test(this.toPosix(s));
  },
  /**
   * Returns the protocol of the path e.g. http://, https://, file:///, data:, blob:, C:/
   * @param path - The path to get the protocol from
   */
  getProtocol(s) {
    Ge(s), s = this.toPosix(s);
    const e = /^file:\/\/\//.exec(s);
    if (e)
      return e[0];
    const t = /^[^/:]+:\/{0,2}/.exec(s);
    return t ? t[0] : "";
  },
  /**
   * Converts URL to an absolute path.
   * When loading from a Web Worker, we must use absolute paths.
   * If the URL is already absolute we return it as is
   * If it's not, we convert it
   * @param url - The URL to test
   * @param customBaseUrl - The base URL to use
   * @param customRootUrl - The root URL to use
   */
  toAbsolute(s, e, t) {
    if (Ge(s), this.isDataUrl(s) || this.isBlobUrl(s))
      return s;
    const r = Dt(this.toPosix(e ?? Z.get().getBaseUrl())), i = Dt(this.toPosix(t ?? this.rootname(r)));
    return s = this.toPosix(s), s.startsWith("/") ? Ce.join(i, s.slice(1)) : this.isAbsolute(s) ? s : this.join(r, s);
  },
  /**
   * Normalizes the given path, resolving '..' and '.' segments
   * @param path - The path to normalize
   */
  normalize(s) {
    if (Ge(s), s.length === 0)
      return ".";
    if (this.isDataUrl(s) || this.isBlobUrl(s))
      return s;
    s = this.toPosix(s);
    let e = "";
    const t = s.startsWith("/");
    this.hasProtocol(s) && (e = this.rootname(s), s = s.slice(e.length));
    const r = s.endsWith("/");
    return s = hu(s), s.length > 0 && r && (s += "/"), t ? `/${s}` : e + s;
  },
  /**
   * Determines if path is an absolute path.
   * Absolute paths can be urls, data urls, or paths on disk
   * @param path - The path to test
   */
  isAbsolute(s) {
    return Ge(s), s = this.toPosix(s), this.hasProtocol(s) ? !0 : s.startsWith("/");
  },
  /**
   * Joins all given path segments together using the platform-specific separator as a delimiter,
   * then normalizes the resulting path
   * @param segments - The segments of the path to join
   */
  join(...s) {
    if (s.length === 0)
      return ".";
    let e;
    for (let t = 0; t < s.length; ++t) {
      const r = s[t];
      if (Ge(r), r.length > 0)
        if (e === void 0)
          e = r;
        else {
          const i = s[t - 1] ?? "";
          this.joinExtensions.includes(this.extname(i).toLowerCase()) ? e += `/../${r}` : e += `/${r}`;
        }
    }
    return e === void 0 ? "." : this.normalize(e);
  },
  /**
   * Returns the directory name of a path
   * @param path - The path to parse
   */
  dirname(s) {
    if (Ge(s), s.length === 0)
      return ".";
    s = this.toPosix(s);
    let e = s.charCodeAt(0);
    const t = e === 47;
    let r = -1, i = !0;
    const n = this.getProtocol(s), a = s;
    s = s.slice(n.length);
    for (let o = s.length - 1; o >= 1; --o)
      if (e = s.charCodeAt(o), e === 47) {
        if (!i) {
          r = o;
          break;
        }
      } else
        i = !1;
    return r === -1 ? t ? "/" : this.isUrl(a) ? n + s : n : t && r === 1 ? "//" : n + s.slice(0, r);
  },
  /**
   * Returns the root of the path e.g. /, C:/, file:///, http://domain.com/
   * @param path - The path to parse
   */
  rootname(s) {
    Ge(s), s = this.toPosix(s);
    let e = "";
    if (s.startsWith("/") ? e = "/" : e = this.getProtocol(s), this.isUrl(s)) {
      const t = s.indexOf("/", e.length);
      t !== -1 ? e = s.slice(0, t) : e = s, e.endsWith("/") || (e += "/");
    }
    return e;
  },
  /**
   * Returns the last portion of a path
   * @param path - The path to test
   * @param ext - Optional extension to remove
   */
  basename(s, e) {
    Ge(s), e && Ge(e), s = Dt(this.toPosix(s));
    let t = 0, r = -1, i = !0, n;
    if (e !== void 0 && e.length > 0 && e.length <= s.length) {
      if (e.length === s.length && e === s)
        return "";
      let a = e.length - 1, o = -1;
      for (n = s.length - 1; n >= 0; --n) {
        const h = s.charCodeAt(n);
        if (h === 47) {
          if (!i) {
            t = n + 1;
            break;
          }
        } else
          o === -1 && (i = !1, o = n + 1), a >= 0 && (h === e.charCodeAt(a) ? --a === -1 && (r = n) : (a = -1, r = o));
      }
      return t === r ? r = o : r === -1 && (r = s.length), s.slice(t, r);
    }
    for (n = s.length - 1; n >= 0; --n)
      if (s.charCodeAt(n) === 47) {
        if (!i) {
          t = n + 1;
          break;
        }
      } else r === -1 && (i = !1, r = n + 1);
    return r === -1 ? "" : s.slice(t, r);
  },
  /**
   * Returns the extension of the path, from the last occurrence of the . (period) character to end of string in the last
   * portion of the path. If there is no . in the last portion of the path, or if there are no . characters other than
   * the first character of the basename of path, an empty string is returned.
   * @param path - The path to parse
   */
  extname(s) {
    Ge(s), s = Dt(this.toPosix(s));
    let e = -1, t = 0, r = -1, i = !0, n = 0;
    for (let a = s.length - 1; a >= 0; --a) {
      const o = s.charCodeAt(a);
      if (o === 47) {
        if (!i) {
          t = a + 1;
          break;
        }
        continue;
      }
      r === -1 && (i = !1, r = a + 1), o === 46 ? e === -1 ? e = a : n !== 1 && (n = 1) : e !== -1 && (n = -1);
    }
    return e === -1 || r === -1 || n === 0 || n === 1 && e === r - 1 && e === t + 1 ? "" : s.slice(e, r);
  },
  /**
   * Parses a path into an object containing the 'root', `dir`, `base`, `ext`, and `name` properties.
   * @param path - The path to parse
   */
  parse(s) {
    Ge(s);
    const e = { root: "", dir: "", base: "", ext: "", name: "" };
    if (s.length === 0)
      return e;
    s = Dt(this.toPosix(s));
    let t = s.charCodeAt(0);
    const r = this.isAbsolute(s);
    let i;
    e.root = this.rootname(s), r || this.hasProtocol(s) ? i = 1 : i = 0;
    let n = -1, a = 0, o = -1, h = !0, l = s.length - 1, c = 0;
    for (; l >= i; --l) {
      if (t = s.charCodeAt(l), t === 47) {
        if (!h) {
          a = l + 1;
          break;
        }
        continue;
      }
      o === -1 && (h = !1, o = l + 1), t === 46 ? n === -1 ? n = l : c !== 1 && (c = 1) : n !== -1 && (c = -1);
    }
    return n === -1 || o === -1 || c === 0 || c === 1 && n === o - 1 && n === a + 1 ? o !== -1 && (a === 0 && r ? e.base = e.name = s.slice(1, o) : e.base = e.name = s.slice(a, o)) : (a === 0 && r ? (e.name = s.slice(1, n), e.base = s.slice(1, o)) : (e.name = s.slice(a, n), e.base = s.slice(a, o)), e.ext = s.slice(n, o)), e.dir = this.dirname(s), e;
  },
  sep: "/",
  delimiter: ":",
  joinExtensions: [".html"]
};
function So(s, e, t, r, i) {
  const n = e[t];
  for (let a = 0; a < n.length; a++) {
    const o = n[a];
    t < e.length - 1 ? So(s.replace(r[t], o), e, t + 1, r, i) : i.push(s.replace(r[t], o));
  }
}
function lu(s) {
  const e = /\{(.*?)\}/g, t = s.match(e), r = [];
  if (t) {
    const i = [];
    t.forEach((n) => {
      const a = n.substring(1, n.length - 1).split(",");
      i.push(a);
    }), So(s, i, 0, t, r);
  } else
    r.push(s);
  return r;
}
const Fr = (s) => !Array.isArray(s);
class kt {
  constructor() {
    this._defaultBundleIdentifierOptions = {
      connector: "-",
      createBundleAssetId: (e, t) => `${e}${this._bundleIdConnector}${t}`,
      extractAssetIdFromBundle: (e, t) => t.replace(`${e}${this._bundleIdConnector}`, "")
    }, this._bundleIdConnector = this._defaultBundleIdentifierOptions.connector, this._createBundleAssetId = this._defaultBundleIdentifierOptions.createBundleAssetId, this._extractAssetIdFromBundle = this._defaultBundleIdentifierOptions.extractAssetIdFromBundle, this._assetMap = {}, this._preferredOrder = [], this._parsers = [], this._resolverHash = {}, this._bundles = {};
  }
  /**
   * Override how the resolver deals with generating bundle ids.
   * must be called before any bundles are added
   * @param bundleIdentifier - the bundle identifier options
   */
  setBundleIdentifier(e) {
    if (this._bundleIdConnector = e.connector ?? this._bundleIdConnector, this._createBundleAssetId = e.createBundleAssetId ?? this._createBundleAssetId, this._extractAssetIdFromBundle = e.extractAssetIdFromBundle ?? this._extractAssetIdFromBundle, this._extractAssetIdFromBundle("foo", this._createBundleAssetId("foo", "bar")) !== "bar")
      throw new Error("[Resolver] GenerateBundleAssetId are not working correctly");
  }
  /**
   * Let the resolver know which assets you prefer to use when resolving assets.
   * Multiple prefer user defined rules can be added.
   * @example
   * resolver.prefer({
   *     // first look for something with the correct format, and then then correct resolution
   *     priority: ['format', 'resolution'],
   *     params:{
   *         format:'webp', // prefer webp images
   *         resolution: 2, // prefer a resolution of 2
   *     }
   * })
   * resolver.add('foo', ['bar@2x.webp', 'bar@2x.png', 'bar.webp', 'bar.png']);
   * resolver.resolveUrl('foo') // => 'bar@2x.webp'
   * @param preferOrders - the prefer options
   */
  prefer(...e) {
    e.forEach((t) => {
      this._preferredOrder.push(t), t.priority || (t.priority = Object.keys(t.params));
    }), this._resolverHash = {};
  }
  /**
   * Set the base path to prepend to all urls when resolving
   * @example
   * resolver.basePath = 'https://home.com/';
   * resolver.add('foo', 'bar.ong');
   * resolver.resolveUrl('foo', 'bar.png'); // => 'https://home.com/bar.png'
   * @param basePath - the base path to use
   */
  set basePath(e) {
    this._basePath = e;
  }
  get basePath() {
    return this._basePath;
  }
  /**
   * Set the root path for root-relative URLs. By default the `basePath`'s root is used. If no `basePath` is set, then the
   * default value for browsers is `window.location.origin`
   * @example
   * // Application hosted on https://home.com/some-path/index.html
   * resolver.basePath = 'https://home.com/some-path/';
   * resolver.rootPath = 'https://home.com/';
   * resolver.add('foo', '/bar.png');
   * resolver.resolveUrl('foo', '/bar.png'); // => 'https://home.com/bar.png'
   * @param rootPath - the root path to use
   */
  set rootPath(e) {
    this._rootPath = e;
  }
  get rootPath() {
    return this._rootPath;
  }
  /**
   * All the active URL parsers that help the parser to extract information and create
   * an asset object-based on parsing the URL itself.
   *
   * Can be added using the extensions API
   * @example
   * resolver.add('foo', [
   *     {
   *         resolution: 2,
   *         format: 'png',
   *         src: 'image@2x.png',
   *     },
   *     {
   *         resolution:1,
   *         format:'png',
   *         src: 'image.png',
   *     },
   * ]);
   *
   * // With a url parser the information such as resolution and file format could extracted from the url itself:
   * extensions.add({
   *     extension: ExtensionType.ResolveParser,
   *     test: loadTextures.test, // test if url ends in an image
   *     parse: (value: string) =>
   *     ({
   *         resolution: parseFloat(Resolver.RETINA_PREFIX.exec(value)?.[1] ?? '1'),
   *         format: value.split('.').pop(),
   *         src: value,
   *     }),
   * });
   *
   * // Now resolution and format can be extracted from the url
   * resolver.add('foo', [
   *     'image@2x.png',
   *     'image.png',
   * ]);
   */
  get parsers() {
    return this._parsers;
  }
  /** Used for testing, this resets the resolver to its initial state */
  reset() {
    this.setBundleIdentifier(this._defaultBundleIdentifierOptions), this._assetMap = {}, this._preferredOrder = [], this._resolverHash = {}, this._rootPath = null, this._basePath = null, this._manifest = null, this._bundles = {}, this._defaultSearchParams = null;
  }
  /**
   * Sets the default URL search parameters for the URL resolver. The urls can be specified as a string or an object.
   * @param searchParams - the default url parameters to append when resolving urls
   */
  setDefaultSearchParams(e) {
    if (typeof e == "string")
      this._defaultSearchParams = e;
    else {
      const t = e;
      this._defaultSearchParams = Object.keys(t).map((r) => `${encodeURIComponent(r)}=${encodeURIComponent(t[r])}`).join("&");
    }
  }
  /**
   * Returns the aliases for a given asset
   * @param asset - the asset to get the aliases for
   */
  getAlias(e) {
    const { alias: t, src: r } = e;
    return Fe(
      t || r,
      (n) => typeof n == "string" ? n : Array.isArray(n) ? n.map((a) => (a == null ? void 0 : a.src) ?? a) : n != null && n.src ? n.src : n,
      !0
    );
  }
  /**
   * Add a manifest to the asset resolver. This is a nice way to add all the asset information in one go.
   * generally a manifest would be built using a tool.
   * @param manifest - the manifest to add to the resolver
   */
  addManifest(e) {
    this._manifest && V("[Resolver] Manifest already exists, this will be overwritten"), this._manifest = e, e.bundles.forEach((t) => {
      this.addBundle(t.name, t.assets);
    });
  }
  /**
   * This adds a bundle of assets in one go so that you can resolve them as a group.
   * For example you could add a bundle for each screen in you pixi app
   * @example
   * resolver.addBundle('animals', [
   *  { alias: 'bunny', src: 'bunny.png' },
   *  { alias: 'chicken', src: 'chicken.png' },
   *  { alias: 'thumper', src: 'thumper.png' },
   * ]);
   * // or
   * resolver.addBundle('animals', {
   *     bunny: 'bunny.png',
   *     chicken: 'chicken.png',
   *     thumper: 'thumper.png',
   * });
   *
   * const resolvedAssets = await resolver.resolveBundle('animals');
   * @param bundleId - The id of the bundle to add
   * @param assets - A record of the asset or assets that will be chosen from when loading via the specified key
   */
  addBundle(e, t) {
    const r = [];
    let i = t;
    Array.isArray(t) || (i = Object.entries(t).map(([n, a]) => typeof a == "string" || Array.isArray(a) ? { alias: n, src: a } : { alias: n, ...a })), i.forEach((n) => {
      const a = n.src, o = n.alias;
      let h;
      if (typeof o == "string") {
        const l = this._createBundleAssetId(e, o);
        r.push(l), h = [o, l];
      } else {
        const l = o.map((c) => this._createBundleAssetId(e, c));
        r.push(...l), h = [...o, ...l];
      }
      this.add({
        ...n,
        alias: h,
        src: a
      });
    }), this._bundles[e] = r;
  }
  /**
   * Tells the resolver what keys are associated with witch asset.
   * The most important thing the resolver does
   * @example
   * // Single key, single asset:
   * resolver.add({alias: 'foo', src: 'bar.png');
   * resolver.resolveUrl('foo') // => 'bar.png'
   *
   * // Multiple keys, single asset:
   * resolver.add({alias: ['foo', 'boo'], src: 'bar.png'});
   * resolver.resolveUrl('foo') // => 'bar.png'
   * resolver.resolveUrl('boo') // => 'bar.png'
   *
   * // Multiple keys, multiple assets:
   * resolver.add({alias: ['foo', 'boo'], src: ['bar.png', 'bar.webp']});
   * resolver.resolveUrl('foo') // => 'bar.png'
   *
   * // Add custom data attached to the resolver
   * Resolver.add({
   *     alias: 'bunnyBooBooSmooth',
   *     src: 'bunny{png,webp}',
   *     data: { scaleMode:SCALE_MODES.NEAREST }, // Base texture options
   * });
   *
   * resolver.resolve('bunnyBooBooSmooth') // => { src: 'bunny.png', data: { scaleMode: SCALE_MODES.NEAREST } }
   * @param aliases - the UnresolvedAsset or array of UnresolvedAssets to add to the resolver
   */
  add(e) {
    const t = [];
    Array.isArray(e) ? t.push(...e) : t.push(e);
    let r;
    r = (n) => {
      this.hasKey(n) && V(`[Resolver] already has key: ${n} overwriting`);
    }, Fe(t).forEach((n) => {
      const { src: a } = n;
      let { data: o, format: h, loadParser: l } = n;
      const c = Fe(a).map((f) => typeof f == "string" ? lu(f) : Array.isArray(f) ? f : [f]), u = this.getAlias(n);
      Array.isArray(u) ? u.forEach(r) : r(u);
      const d = [];
      c.forEach((f) => {
        f.forEach((p) => {
          let g = {};
          if (typeof p != "object") {
            g.src = p;
            for (let m = 0; m < this._parsers.length; m++) {
              const y = this._parsers[m];
              if (y.test(p)) {
                g = y.parse(p);
                break;
              }
            }
          } else
            o = p.data ?? o, h = p.format ?? h, l = p.loadParser ?? l, g = {
              ...g,
              ...p
            };
          if (!u)
            throw new Error(`[Resolver] alias is undefined for this asset: ${g.src}`);
          g = this._buildResolvedAsset(g, {
            aliases: u,
            data: o,
            format: h,
            loadParser: l
          }), d.push(g);
        });
      }), u.forEach((f) => {
        this._assetMap[f] = d;
      });
    });
  }
  // TODO: this needs an overload like load did in Assets
  /**
   * If the resolver has had a manifest set via setManifest, this will return the assets urls for
   * a given bundleId or bundleIds.
   * @example
   * // Manifest Example
   * const manifest = {
   *     bundles: [
   *         {
   *             name: 'load-screen',
   *             assets: [
   *                 {
   *                     alias: 'background',
   *                     src: 'sunset.png',
   *                 },
   *                 {
   *                     alias: 'bar',
   *                     src: 'load-bar.{png,webp}',
   *                 },
   *             ],
   *         },
   *         {
   *             name: 'game-screen',
   *             assets: [
   *                 {
   *                     alias: 'character',
   *                     src: 'robot.png',
   *                 },
   *                 {
   *                     alias: 'enemy',
   *                     src: 'bad-guy.png',
   *                 },
   *             ],
   *         },
   *     ]
   * };
   *
   * resolver.setManifest(manifest);
   * const resolved = resolver.resolveBundle('load-screen');
   * @param bundleIds - The bundle ids to resolve
   * @returns All the bundles assets or a hash of assets for each bundle specified
   */
  resolveBundle(e) {
    const t = Fr(e);
    e = Fe(e);
    const r = {};
    return e.forEach((i) => {
      const n = this._bundles[i];
      if (n) {
        const a = this.resolve(n), o = {};
        for (const h in a) {
          const l = a[h];
          o[this._extractAssetIdFromBundle(i, h)] = l;
        }
        r[i] = o;
      }
    }), t ? r[e[0]] : r;
  }
  /**
   * Does exactly what resolve does, but returns just the URL rather than the whole asset object
   * @param key - The key or keys to resolve
   * @returns - The URLs associated with the key(s)
   */
  resolveUrl(e) {
    const t = this.resolve(e);
    if (typeof e != "string") {
      const r = {};
      for (const i in t)
        r[i] = t[i].src;
      return r;
    }
    return t.src;
  }
  resolve(e) {
    const t = Fr(e);
    e = Fe(e);
    const r = {};
    return e.forEach((i) => {
      if (!this._resolverHash[i])
        if (this._assetMap[i]) {
          let n = this._assetMap[i];
          const a = this._getPreferredOrder(n);
          a == null || a.priority.forEach((o) => {
            a.params[o].forEach((h) => {
              const l = n.filter((c) => c[o] ? c[o] === h : !1);
              l.length && (n = l);
            });
          }), this._resolverHash[i] = n[0];
        } else
          this._resolverHash[i] = this._buildResolvedAsset({
            alias: [i],
            src: i
          }, {});
      r[i] = this._resolverHash[i];
    }), t ? r[e[0]] : r;
  }
  /**
   * Checks if an asset with a given key exists in the resolver
   * @param key - The key of the asset
   */
  hasKey(e) {
    return !!this._assetMap[e];
  }
  /**
   * Checks if a bundle with the given key exists in the resolver
   * @param key - The key of the bundle
   */
  hasBundle(e) {
    return !!this._bundles[e];
  }
  /**
   * Internal function for figuring out what prefer criteria an asset should use.
   * @param assets
   */
  _getPreferredOrder(e) {
    for (let t = 0; t < e.length; t++) {
      const r = e[t], i = this._preferredOrder.find((n) => n.params.format.includes(r.format));
      if (i)
        return i;
    }
    return this._preferredOrder[0];
  }
  /**
   * Appends the default url parameters to the url
   * @param url - The url to append the default parameters to
   * @returns - The url with the default parameters appended
   */
  _appendDefaultSearchParams(e) {
    if (!this._defaultSearchParams)
      return e;
    const t = /\?/.test(e) ? "&" : "?";
    return `${e}${t}${this._defaultSearchParams}`;
  }
  _buildResolvedAsset(e, t) {
    const { aliases: r, data: i, loadParser: n, format: a } = t;
    return (this._basePath || this._rootPath) && (e.src = Ce.toAbsolute(e.src, this._basePath, this._rootPath)), e.alias = r ?? e.alias ?? [e.src], e.src = this._appendDefaultSearchParams(e.src), e.data = { ...i || {}, ...e.data }, e.loadParser = n ?? e.loadParser, e.format = a ?? e.format ?? cu(e.src), e;
  }
}
kt.RETINA_PREFIX = /@([0-9\.]+)x/;
function cu(s) {
  return s.split(".").pop().split("?").shift().split("#").shift();
}
const Vs = (s, e) => {
  const t = e.split("?")[1];
  return t && (s += `?${t}`), s;
}, wo = class Vt {
  /**
   * @param texture - Reference to the source BaseTexture object.
   * @param {object} data - Spritesheet image data.
   */
  constructor(e, t) {
    this.linkedSheets = [], this._texture = e instanceof D ? e : null, this.textureSource = e.source, this.textures = {}, this.animations = {}, this.data = t;
    const r = parseFloat(t.meta.scale);
    r ? (this.resolution = r, e.source.resolution = this.resolution) : this.resolution = e.source._resolution, this._frames = this.data.frames, this._frameKeys = Object.keys(this._frames), this._batchIndex = 0, this._callback = null;
  }
  /**
   * Parser spritesheet from loaded data. This is done asynchronously
   * to prevent creating too many Texture within a single process.
   */
  parse() {
    return new Promise((e) => {
      this._callback = e, this._batchIndex = 0, this._frameKeys.length <= Vt.BATCH_SIZE ? (this._processFrames(0), this._processAnimations(), this._parseComplete()) : this._nextBatch();
    });
  }
  /**
   * Process a batch of frames
   * @param initialFrameIndex - The index of frame to start.
   */
  _processFrames(e) {
    let t = e;
    const r = Vt.BATCH_SIZE;
    for (; t - e < r && t < this._frameKeys.length; ) {
      const i = this._frameKeys[t], n = this._frames[i], a = n.frame;
      if (a) {
        let o = null, h = null;
        const l = n.trimmed !== !1 && n.sourceSize ? n.sourceSize : n.frame, c = new ne(
          0,
          0,
          Math.floor(l.w) / this.resolution,
          Math.floor(l.h) / this.resolution
        );
        n.rotated ? o = new ne(
          Math.floor(a.x) / this.resolution,
          Math.floor(a.y) / this.resolution,
          Math.floor(a.h) / this.resolution,
          Math.floor(a.w) / this.resolution
        ) : o = new ne(
          Math.floor(a.x) / this.resolution,
          Math.floor(a.y) / this.resolution,
          Math.floor(a.w) / this.resolution,
          Math.floor(a.h) / this.resolution
        ), n.trimmed !== !1 && n.spriteSourceSize && (h = new ne(
          Math.floor(n.spriteSourceSize.x) / this.resolution,
          Math.floor(n.spriteSourceSize.y) / this.resolution,
          Math.floor(a.w) / this.resolution,
          Math.floor(a.h) / this.resolution
        )), this.textures[i] = new D({
          source: this.textureSource,
          frame: o,
          orig: c,
          trim: h,
          rotate: n.rotated ? 2 : 0,
          defaultAnchor: n.anchor,
          defaultBorders: n.borders,
          label: i.toString()
        });
      }
      t++;
    }
  }
  /** Parse animations config. */
  _processAnimations() {
    const e = this.data.animations || {};
    for (const t in e) {
      this.animations[t] = [];
      for (let r = 0; r < e[t].length; r++) {
        const i = e[t][r];
        this.animations[t].push(this.textures[i]);
      }
    }
  }
  /** The parse has completed. */
  _parseComplete() {
    const e = this._callback;
    this._callback = null, this._batchIndex = 0, e.call(this, this.textures);
  }
  /** Begin the next batch of textures. */
  _nextBatch() {
    this._processFrames(this._batchIndex * Vt.BATCH_SIZE), this._batchIndex++, setTimeout(() => {
      this._batchIndex * Vt.BATCH_SIZE < this._frameKeys.length ? this._nextBatch() : (this._processAnimations(), this._parseComplete());
    }, 0);
  }
  /**
   * Destroy Spritesheet and don't use after this.
   * @param {boolean} [destroyBase=false] - Whether to destroy the base texture as well
   */
  destroy(e = !1) {
    var t;
    for (const r in this.textures)
      this.textures[r].destroy();
    this._frames = null, this._frameKeys = null, this.data = null, this.textures = null, e && ((t = this._texture) == null || t.destroy(), this.textureSource.destroy()), this._texture = null, this.textureSource = null, this.linkedSheets = [];
  }
};
wo.BATCH_SIZE = 1e3;
let yn = wo;
const uu = [
  "jpg",
  "png",
  "jpeg",
  "avif",
  "webp",
  "basis",
  "etc2",
  "bc7",
  "bc6h",
  "bc5",
  "bc4",
  "bc3",
  "bc2",
  "bc1",
  "eac",
  "astc"
];
function Ao(s, e, t) {
  const r = {};
  if (s.forEach((i) => {
    r[i] = e;
  }), Object.keys(e.textures).forEach((i) => {
    r[i] = e.textures[i];
  }), !t) {
    const i = Ce.dirname(s[0]);
    e.linkedSheets.forEach((n, a) => {
      const o = Ao([`${i}/${e.data.meta.related_multi_packs[a]}`], n, !0);
      Object.assign(r, o);
    });
  }
  return r;
}
const du = {
  extension: v.Asset,
  /** Handle the caching of the related Spritesheet Textures */
  cache: {
    test: (s) => s instanceof yn,
    getCacheableAssets: (s, e) => Ao(s, e, !1)
  },
  /** Resolve the resolution of the asset. */
  resolver: {
    extension: {
      type: v.ResolveParser,
      name: "resolveSpritesheet"
    },
    test: (s) => {
      const t = s.split("?")[0].split("."), r = t.pop(), i = t.pop();
      return r === "json" && uu.includes(i);
    },
    parse: (s) => {
      var t;
      const e = s.split(".");
      return {
        resolution: parseFloat(((t = kt.RETINA_PREFIX.exec(s)) == null ? void 0 : t[1]) ?? "1"),
        format: e[e.length - 2],
        src: s
      };
    }
  },
  /**
   * Loader plugin that parses sprite sheets!
   * once the JSON has been loaded this checks to see if the JSON is spritesheet data.
   * If it is, we load the spritesheets image and parse the data into Spritesheet
   * All textures in the sprite sheet are then added to the cache
   */
  loader: {
    name: "spritesheetLoader",
    extension: {
      type: v.LoadParser,
      priority: ht.Normal,
      name: "spritesheetLoader"
    },
    async testParse(s, e) {
      return Ce.extname(e.src).toLowerCase() === ".json" && !!s.frames;
    },
    async parse(s, e, t) {
      var c, u;
      const {
        texture: r,
        // if user need to use preloaded texture
        imageFilename: i,
        // if user need to use custom filename (not from jsonFile.meta.image)
        textureOptions: n
        // if user need to set texture options on texture
      } = (e == null ? void 0 : e.data) ?? {};
      let a = Ce.dirname(e.src);
      a && a.lastIndexOf("/") !== a.length - 1 && (a += "/");
      let o;
      if (r instanceof D)
        o = r;
      else {
        const d = Vs(a + (i ?? s.meta.image), e.src);
        o = (await t.load([{ src: d, data: n }]))[d];
      }
      const h = new yn(
        o.source,
        s
      );
      await h.parse();
      const l = (c = s == null ? void 0 : s.meta) == null ? void 0 : c.related_multi_packs;
      if (Array.isArray(l)) {
        const d = [];
        for (const p of l) {
          if (typeof p != "string")
            continue;
          let g = a + p;
          (u = e.data) != null && u.ignoreMultiPack || (g = Vs(g, e.src), d.push(t.load({
            src: g,
            data: {
              textureOptions: n,
              ignoreMultiPack: !0
            }
          })));
        }
        const f = await Promise.all(d);
        h.linkedSheets = f, f.forEach((p) => {
          p.linkedSheets = [h].concat(h.linkedSheets.filter((g) => g !== p));
        });
      }
      return h;
    },
    async unload(s, e, t) {
      await t.unload(s.textureSource._sourceOrigin), s.destroy(!1);
    }
  }
};
z.add(du);
class sr {
  /**
   * @param manager - The event boundary which manages this event. Propagation can only occur
   *  within the boundary's jurisdiction.
   */
  constructor(e) {
    this.bubbles = !0, this.cancelBubble = !0, this.cancelable = !1, this.composed = !1, this.defaultPrevented = !1, this.eventPhase = sr.prototype.NONE, this.propagationStopped = !1, this.propagationImmediatelyStopped = !1, this.layer = new oe(), this.page = new oe(), this.NONE = 0, this.CAPTURING_PHASE = 1, this.AT_TARGET = 2, this.BUBBLING_PHASE = 3, this.manager = e;
  }
  /** @readonly */
  get layerX() {
    return this.layer.x;
  }
  /** @readonly */
  get layerY() {
    return this.layer.y;
  }
  /** @readonly */
  get pageX() {
    return this.page.x;
  }
  /** @readonly */
  get pageY() {
    return this.page.y;
  }
  /**
   * Fallback for the deprecated @code{InteractionEvent.data}.
   * @deprecated since 7.0.0
   */
  get data() {
    return this;
  }
  /** The propagation path for this event. Alias for {@link EventBoundary.propagationPath}. */
  composedPath() {
    return this.manager && (!this.path || this.path[this.path.length - 1] !== this.target) && (this.path = this.target ? this.manager.propagationPath(this.target) : []), this.path;
  }
  /**
   * Unimplemented method included for implementing the DOM interface {@code Event}. It will throw an {@code Error}.
   * @deprecated
   * @param _type
   * @param _bubbles
   * @param _cancelable
   */
  initEvent(e, t, r) {
    throw new Error("initEvent() is a legacy DOM API. It is not implemented in the Federated Events API.");
  }
  /**
   * Unimplemented method included for implementing the DOM interface {@code UIEvent}. It will throw an {@code Error}.
   * @deprecated
   * @param _typeArg
   * @param _bubblesArg
   * @param _cancelableArg
   * @param _viewArg
   * @param _detailArg
   */
  initUIEvent(e, t, r, i, n) {
    throw new Error("initUIEvent() is a legacy DOM API. It is not implemented in the Federated Events API.");
  }
  /** Prevent default behavior of PixiJS and the user agent. */
  preventDefault() {
    this.nativeEvent instanceof Event && this.nativeEvent.cancelable && this.nativeEvent.preventDefault(), this.defaultPrevented = !0;
  }
  /**
   * Stop this event from propagating to any addition listeners, including on the
   * {@link FederatedEventTarget.currentTarget currentTarget} and also the following
   * event targets on the propagation path.
   */
  stopImmediatePropagation() {
    this.propagationImmediatelyStopped = !0;
  }
  /**
   * Stop this event from propagating to the next {@link FederatedEventTarget}. The rest of the listeners
   * on the {@link FederatedEventTarget.currentTarget currentTarget} will still be notified.
   */
  stopPropagation() {
    this.propagationStopped = !0;
  }
}
var as = /iPhone/i, bn = /iPod/i, vn = /iPad/i, Tn = /\biOS-universal(?:.+)Mac\b/i, os = /\bAndroid(?:.+)Mobile\b/i, Sn = /Android/i, bt = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i, pr = /Silk/i, Ke = /Windows Phone/i, wn = /\bWindows(?:.+)ARM\b/i, An = /BlackBerry/i, Pn = /BB10/i, Cn = /Opera Mini/i, En = /\b(CriOS|Chrome)(?:.+)Mobile/i, Mn = /Mobile(?:.+)Firefox\b/i, Bn = function(s) {
  return typeof s < "u" && s.platform === "MacIntel" && typeof s.maxTouchPoints == "number" && s.maxTouchPoints > 1 && typeof MSStream > "u";
};
function fu(s) {
  return function(e) {
    return e.test(s);
  };
}
function Rn(s) {
  var e = {
    userAgent: "",
    platform: "",
    maxTouchPoints: 0
  };
  !s && typeof navigator < "u" ? e = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints || 0
  } : typeof s == "string" ? e.userAgent = s : s && s.userAgent && (e = {
    userAgent: s.userAgent,
    platform: s.platform,
    maxTouchPoints: s.maxTouchPoints || 0
  });
  var t = e.userAgent, r = t.split("[FBAN");
  typeof r[1] < "u" && (t = r[0]), r = t.split("Twitter"), typeof r[1] < "u" && (t = r[0]);
  var i = fu(t), n = {
    apple: {
      phone: i(as) && !i(Ke),
      ipod: i(bn),
      tablet: !i(as) && (i(vn) || Bn(e)) && !i(Ke),
      universal: i(Tn),
      device: (i(as) || i(bn) || i(vn) || i(Tn) || Bn(e)) && !i(Ke)
    },
    amazon: {
      phone: i(bt),
      tablet: !i(bt) && i(pr),
      device: i(bt) || i(pr)
    },
    android: {
      phone: !i(Ke) && i(bt) || !i(Ke) && i(os),
      tablet: !i(Ke) && !i(bt) && !i(os) && (i(pr) || i(Sn)),
      device: !i(Ke) && (i(bt) || i(pr) || i(os) || i(Sn)) || i(/\bokhttp\b/i)
    },
    windows: {
      phone: i(Ke),
      tablet: i(wn),
      device: i(Ke) || i(wn)
    },
    other: {
      blackberry: i(An),
      blackberry10: i(Pn),
      opera: i(Cn),
      firefox: i(Mn),
      chrome: i(En),
      device: i(An) || i(Pn) || i(Cn) || i(Mn) || i(En)
    },
    any: !1,
    phone: !1,
    tablet: !1
  };
  return n.any = n.apple.device || n.android.device || n.windows.device || n.other.device, n.phone = n.apple.phone || n.android.phone || n.windows.phone, n.tablet = n.apple.tablet || n.android.tablet || n.windows.tablet, n;
}
const pu = Rn.default ?? Rn, mu = pu(globalThis.navigator), gu = 9, mr = 100, _u = 0, xu = 0, kn = 2, In = 1, yu = -1e3, bu = -1e3, vu = 2, xi = class Po {
  // 2fps
  // eslint-disable-next-line jsdoc/require-param
  /**
   * @param {WebGLRenderer|WebGPURenderer} renderer - A reference to the current renderer
   */
  constructor(e, t = mu) {
    this._mobileInfo = t, this.debug = !1, this._activateOnTab = !0, this._deactivateOnMouseMove = !0, this._isActive = !1, this._isMobileAccessibility = !1, this._div = null, this._pool = [], this._renderId = 0, this._children = [], this._androidUpdateCount = 0, this._androidUpdateFrequency = 500, this._hookDiv = null, (t.tablet || t.phone) && this._createTouchHook(), this._renderer = e;
  }
  /**
   * Value of `true` if accessibility is currently active and accessibility layers are showing.
   * @member {boolean}
   * @readonly
   */
  get isActive() {
    return this._isActive;
  }
  /**
   * Value of `true` if accessibility is enabled for touch devices.
   * @member {boolean}
   * @readonly
   */
  get isMobileAccessibility() {
    return this._isMobileAccessibility;
  }
  get hookDiv() {
    return this._hookDiv;
  }
  /**
   * Creates the touch hooks.
   * @private
   */
  _createTouchHook() {
    const e = document.createElement("button");
    e.style.width = `${In}px`, e.style.height = `${In}px`, e.style.position = "absolute", e.style.top = `${yu}px`, e.style.left = `${bu}px`, e.style.zIndex = vu.toString(), e.style.backgroundColor = "#FF0000", e.title = "select to enable accessibility for this content", e.addEventListener("focus", () => {
      this._isMobileAccessibility = !0, this._activate(), this._destroyTouchHook();
    }), document.body.appendChild(e), this._hookDiv = e;
  }
  /**
   * Destroys the touch hooks.
   * @private
   */
  _destroyTouchHook() {
    this._hookDiv && (document.body.removeChild(this._hookDiv), this._hookDiv = null);
  }
  /**
   * Activating will cause the Accessibility layer to be shown.
   * This is called when a user presses the tab key.
   * @private
   */
  _activate() {
    if (this._isActive)
      return;
    this._isActive = !0, this._div || (this._div = document.createElement("div"), this._div.style.width = `${mr}px`, this._div.style.height = `${mr}px`, this._div.style.position = "absolute", this._div.style.top = `${_u}px`, this._div.style.left = `${xu}px`, this._div.style.zIndex = kn.toString(), this._div.style.pointerEvents = "none"), this._activateOnTab && (this._onKeyDown = this._onKeyDown.bind(this), globalThis.addEventListener("keydown", this._onKeyDown, !1)), this._deactivateOnMouseMove && (this._onMouseMove = this._onMouseMove.bind(this), globalThis.document.addEventListener("mousemove", this._onMouseMove, !0));
    const e = this._renderer.view.canvas;
    if (e.parentNode)
      e.parentNode.appendChild(this._div), this._initAccessibilitySetup();
    else {
      const t = new MutationObserver(() => {
        e.parentNode && (e.parentNode.appendChild(this._div), t.disconnect(), this._initAccessibilitySetup());
      });
      t.observe(document.body, { childList: !0, subtree: !0 });
    }
  }
  // New method to handle initialization after div is ready
  _initAccessibilitySetup() {
    this._renderer.runners.postrender.add(this), this._renderer.lastObjectRendered && this._updateAccessibleObjects(this._renderer.lastObjectRendered);
  }
  /**
   * Deactivates the accessibility system. Removes listeners and accessibility elements.
   * @private
   */
  _deactivate() {
    if (!(!this._isActive || this._isMobileAccessibility)) {
      this._isActive = !1, globalThis.document.removeEventListener("mousemove", this._onMouseMove, !0), this._activateOnTab && globalThis.addEventListener("keydown", this._onKeyDown, !1), this._renderer.runners.postrender.remove(this);
      for (const e of this._children)
        e._accessibleDiv && e._accessibleDiv.parentNode && (e._accessibleDiv.parentNode.removeChild(e._accessibleDiv), e._accessibleDiv = null), e._accessibleActive = !1;
      this._pool.forEach((e) => {
        e.parentNode && e.parentNode.removeChild(e);
      }), this._div && this._div.parentNode && this._div.parentNode.removeChild(this._div), this._pool = [], this._children = [];
    }
  }
  /**
   * This recursive function will run through the scene graph and add any new accessible objects to the DOM layer.
   * @private
   * @param {Container} container - The Container to check.
   */
  _updateAccessibleObjects(e) {
    if (!e.visible || !e.accessibleChildren)
      return;
    e.accessible && (e._accessibleActive || this._addChild(e), e._renderId = this._renderId);
    const t = e.children;
    if (t)
      for (let r = 0; r < t.length; r++)
        this._updateAccessibleObjects(t[r]);
  }
  /**
   * Runner init called, view is available at this point.
   * @ignore
   */
  init(e) {
    const r = {
      accessibilityOptions: {
        ...Po.defaultOptions,
        ...(e == null ? void 0 : e.accessibilityOptions) || {}
      }
    };
    this.debug = r.accessibilityOptions.debug, this._activateOnTab = r.accessibilityOptions.activateOnTab, this._deactivateOnMouseMove = r.accessibilityOptions.deactivateOnMouseMove, r.accessibilityOptions.enabledByDefault ? this._activate() : this._activateOnTab && (this._onKeyDown = this._onKeyDown.bind(this), globalThis.addEventListener("keydown", this._onKeyDown, !1)), this._renderer.runners.postrender.remove(this);
  }
  /**
   * Updates the accessibility layer during rendering.
   * - Removes divs for containers no longer in the scene
   * - Updates the position and dimensions of the root div
   * - Updates positions of active accessibility divs
   * Only fires while the accessibility system is active.
   * @ignore
   */
  postrender() {
    const e = performance.now();
    if (this._mobileInfo.android.device && e < this._androidUpdateCount || (this._androidUpdateCount = e + this._androidUpdateFrequency, !this._renderer.renderingToScreen || !this._renderer.view.canvas))
      return;
    const t = /* @__PURE__ */ new Set();
    if (this._renderer.lastObjectRendered) {
      this._updateAccessibleObjects(this._renderer.lastObjectRendered);
      for (const r of this._children)
        r._renderId === this._renderId && t.add(this._children.indexOf(r));
    }
    for (let r = this._children.length - 1; r >= 0; r--) {
      const i = this._children[r];
      t.has(r) || (i._accessibleDiv && i._accessibleDiv.parentNode && (i._accessibleDiv.parentNode.removeChild(i._accessibleDiv), this._pool.push(i._accessibleDiv), i._accessibleDiv = null), i._accessibleActive = !1, ao(this._children, r, 1));
    }
    if (this._renderer.renderingToScreen) {
      const { x: r, y: i, width: n, height: a } = this._renderer.screen, o = this._div;
      o.style.left = `${r}px`, o.style.top = `${i}px`, o.style.width = `${n}px`, o.style.height = `${a}px`;
    }
    for (let r = 0; r < this._children.length; r++) {
      const i = this._children[r];
      if (!i._accessibleActive || !i._accessibleDiv)
        continue;
      const n = i._accessibleDiv, a = i.hitArea || i.getBounds().rectangle;
      if (i.hitArea) {
        const o = i.worldTransform, h = this._renderer.resolution, l = this._renderer.resolution;
        n.style.left = `${(o.tx + a.x * o.a) * h}px`, n.style.top = `${(o.ty + a.y * o.d) * l}px`, n.style.width = `${a.width * o.a * h}px`, n.style.height = `${a.height * o.d * l}px`;
      } else {
        this._capHitArea(a);
        const o = this._renderer.resolution, h = this._renderer.resolution;
        n.style.left = `${a.x * o}px`, n.style.top = `${a.y * h}px`, n.style.width = `${a.width * o}px`, n.style.height = `${a.height * h}px`;
      }
    }
    this._renderId++;
  }
  /**
   * private function that will visually add the information to the
   * accessibility div
   * @param {HTMLElement} div -
   */
  _updateDebugHTML(e) {
    e.innerHTML = `type: ${e.type}</br> title : ${e.title}</br> tabIndex: ${e.tabIndex}`;
  }
  /**
   * Adjust the hit area based on the bounds of a display object
   * @param {Rectangle} hitArea - Bounds of the child
   */
  _capHitArea(e) {
    e.x < 0 && (e.width += e.x, e.x = 0), e.y < 0 && (e.height += e.y, e.y = 0);
    const { width: t, height: r } = this._renderer;
    e.x + e.width > t && (e.width = t - e.x), e.y + e.height > r && (e.height = r - e.y);
  }
  /**
   * Creates or reuses a div element for a Container and adds it to the accessibility layer.
   * Sets up ARIA attributes, event listeners, and positioning based on the container's properties.
   * @private
   * @param {Container} container - The child to make accessible.
   */
  _addChild(e) {
    let t = this._pool.pop();
    t || (e.accessibleType === "button" ? t = document.createElement("button") : (t = document.createElement(e.accessibleType), t.style.cssText = `
                        color: transparent;
                        pointer-events: none;
                        padding: 0;
                        margin: 0;
                        border: 0;
                        outline: 0;
                        background: transparent;
                        box-sizing: border-box;
                        user-select: none;
                        -webkit-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                    `, e.accessibleText && (t.innerText = e.accessibleText)), t.style.width = `${mr}px`, t.style.height = `${mr}px`, t.style.backgroundColor = this.debug ? "rgba(255,255,255,0.5)" : "transparent", t.style.position = "absolute", t.style.zIndex = kn.toString(), t.style.borderStyle = "none", navigator.userAgent.toLowerCase().includes("chrome") ? t.setAttribute("aria-live", "off") : t.setAttribute("aria-live", "polite"), navigator.userAgent.match(/rv:.*Gecko\//) ? t.setAttribute("aria-relevant", "additions") : t.setAttribute("aria-relevant", "text"), t.addEventListener("click", this._onClick.bind(this)), t.addEventListener("focus", this._onFocus.bind(this)), t.addEventListener("focusout", this._onFocusOut.bind(this))), t.style.pointerEvents = e.accessiblePointerEvents, t.type = e.accessibleType, e.accessibleTitle && e.accessibleTitle !== null ? t.title = e.accessibleTitle : (!e.accessibleHint || e.accessibleHint === null) && (t.title = `container ${e.tabIndex}`), e.accessibleHint && e.accessibleHint !== null && t.setAttribute("aria-label", e.accessibleHint), this.debug && this._updateDebugHTML(t), e._accessibleActive = !0, e._accessibleDiv = t, t.container = e, this._children.push(e), this._div.appendChild(e._accessibleDiv), e.interactive && (e._accessibleDiv.tabIndex = e.tabIndex);
  }
  /**
   * Dispatch events with the EventSystem.
   * @param e
   * @param type
   * @private
   */
  _dispatchEvent(e, t) {
    const { container: r } = e.target, i = this._renderer.events.rootBoundary, n = Object.assign(new sr(i), { target: r });
    i.rootTarget = this._renderer.lastObjectRendered, t.forEach((a) => i.dispatchEvent(n, a));
  }
  /**
   * Maps the div button press to pixi's EventSystem (click)
   * @private
   * @param {MouseEvent} e - The click event.
   */
  _onClick(e) {
    this._dispatchEvent(e, ["click", "pointertap", "tap"]);
  }
  /**
   * Maps the div focus events to pixi's EventSystem (mouseover)
   * @private
   * @param {FocusEvent} e - The focus event.
   */
  _onFocus(e) {
    e.target.getAttribute("aria-live") || e.target.setAttribute("aria-live", "assertive"), this._dispatchEvent(e, ["mouseover"]);
  }
  /**
   * Maps the div focus events to pixi's EventSystem (mouseout)
   * @private
   * @param {FocusEvent} e - The focusout event.
   */
  _onFocusOut(e) {
    e.target.getAttribute("aria-live") || e.target.setAttribute("aria-live", "polite"), this._dispatchEvent(e, ["mouseout"]);
  }
  /**
   * Is called when a key is pressed
   * @private
   * @param {KeyboardEvent} e - The keydown event.
   */
  _onKeyDown(e) {
    e.keyCode !== gu || !this._activateOnTab || this._activate();
  }
  /**
   * Is called when the mouse moves across the renderer element
   * @private
   * @param {MouseEvent} e - The mouse event.
   */
  _onMouseMove(e) {
    e.movementX === 0 && e.movementY === 0 || this._deactivate();
  }
  /** Destroys the accessibility system. Removes all elements and listeners. */
  destroy() {
    this._deactivate(), this._destroyTouchHook(), this._div = null, this._pool = null, this._children = null, this._renderer = null, this._activateOnTab && globalThis.removeEventListener("keydown", this._onKeyDown);
  }
  /**
   * Enables or disables the accessibility system.
   * @param enabled - Whether to enable or disable accessibility.
   */
  setAccessibilityEnabled(e) {
    e ? this._activate() : this._deactivate();
  }
};
xi.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem
  ],
  name: "accessibility"
};
xi.defaultOptions = {
  /**
   * Whether to enable accessibility features on initialization
   * @default false
   */
  enabledByDefault: !1,
  /**
   * Whether to visually show the accessibility divs for debugging
   * @default false
   */
  debug: !1,
  /**
   * Whether to activate accessibility when tab key is pressed
   * @default true
   */
  activateOnTab: !0,
  /**
   * Whether to deactivate accessibility when mouse moves
   * @default true
   */
  deactivateOnMouseMove: !0
};
let Tu = xi;
const Su = {
  /**
   * Flag for if the object is accessible. If true AccessibilityManager will overlay a
   * shadow div with attributes set
   * @member {boolean}
   * @memberof scene.Container#
   */
  accessible: !1,
  /**
   * Sets the title attribute of the shadow div
   * If accessibleTitle AND accessibleHint has not been this will default to 'container [tabIndex]'
   * @member {string}
   * @memberof scene.Container#
   */
  accessibleTitle: null,
  /**
   * Sets the aria-label attribute of the shadow div
   * @member {string}
   * @memberof scene.Container#
   */
  accessibleHint: null,
  /**
   * @member {number}
   * @memberof scene.Container#
   * @todo Needs docs.
   */
  tabIndex: 0,
  /**
   * @member {boolean}
   * @memberof scene.Container#
   * @private
   */
  _accessibleActive: !1,
  /**
   * @memberof scene.Container#
   * @private
   */
  _accessibleDiv: null,
  /**
   * Specify the type of div the accessible layer is. Screen readers treat the element differently
   * depending on this type. Defaults to button.
   * @member {string}
   * @memberof scene.Container#
   * @default 'button'
   */
  accessibleType: "button",
  /**
   * Sets the text content of the shadow div
   * @member {string}
   * @memberof scene.Container#
   */
  accessibleText: null,
  /**
   * Specify the pointer-events the accessible div will use
   * Defaults to auto.
   * @type {PointerEvents}
   * @memberof scene.Container#
   * @default 'auto'
   */
  accessiblePointerEvents: "auto",
  /**
   * Setting to false will prevent any children inside this container to
   * be accessible. Defaults to true.
   * @member {boolean}
   * @memberof scene.Container#
   * @default true
   */
  accessibleChildren: !0,
  /**
   * @member {number}
   * @memberof scene.Container#
   * @private
   */
  _renderId: -1
}, hs = /* @__PURE__ */ Object.create(null), Gn = /* @__PURE__ */ Object.create(null);
function er(s, e) {
  let t = Gn[s];
  return t === void 0 && (hs[e] === void 0 && (hs[e] = 1), Gn[s] = t = hs[e]++), t;
}
let vt;
function Co() {
  return (!vt || vt != null && vt.isContextLost()) && (vt = Z.get().createCanvas().getContext("webgl", {})), vt;
}
let gr;
function wu() {
  if (!gr) {
    gr = "mediump";
    const s = Co();
    s && s.getShaderPrecisionFormat && (gr = s.getShaderPrecisionFormat(s.FRAGMENT_SHADER, s.HIGH_FLOAT).precision ? "highp" : "mediump");
  }
  return gr;
}
function Au(s, e, t) {
  return e ? s : t ? (s = s.replace("out vec4 finalColor;", ""), `
        
        #ifdef GL_ES // This checks if it is WebGL1
        #define in varying
        #define finalColor gl_FragColor
        #define texture texture2D
        #endif
        ${s}
        `) : `
        
        #ifdef GL_ES // This checks if it is WebGL1
        #define in attribute
        #define out varying
        #endif
        ${s}
        `;
}
function Pu(s, e, t) {
  const r = t ? e.maxSupportedFragmentPrecision : e.maxSupportedVertexPrecision;
  if (s.substring(0, 9) !== "precision") {
    let i = t ? e.requestedFragmentPrecision : e.requestedVertexPrecision;
    return i === "highp" && r !== "highp" && (i = "mediump"), `precision ${i} float;
${s}`;
  } else if (r !== "highp" && s.substring(0, 15) === "precision highp")
    return s.replace("precision highp", "precision mediump");
  return s;
}
function Cu(s, e) {
  return e ? `#version 300 es
${s}` : s;
}
const Eu = {}, Mu = {};
function Bu(s, { name: e = "pixi-program" }, t = !0) {
  e = e.replace(/\s+/g, "-"), e += t ? "-fragment" : "-vertex";
  const r = t ? Eu : Mu;
  return r[e] ? (r[e]++, e += `-${r[e]}`) : r[e] = 1, s.indexOf("#define SHADER_NAME") !== -1 ? s : `${`#define SHADER_NAME ${e}`}
${s}`;
}
function Ru(s, e) {
  return e ? s.replace("#version 300 es", "") : s;
}
const ls = {
  // strips any version headers..
  stripVersion: Ru,
  // adds precision string if not already present
  ensurePrecision: Pu,
  // add some defines if WebGL1 to make it more compatible with WebGL2 shaders
  addProgramDefines: Au,
  // add the program name to the shader
  setProgramName: Bu,
  // add the version string to the shader header
  insertVersion: Cu
}, cs = /* @__PURE__ */ Object.create(null), Eo = class $s {
  /**
   * Creates a shiny new GlProgram. Used by WebGL renderer.
   * @param options - The options for the program.
   */
  constructor(e) {
    e = { ...$s.defaultOptions, ...e };
    const t = e.fragment.indexOf("#version 300 es") !== -1, r = {
      stripVersion: t,
      ensurePrecision: {
        requestedFragmentPrecision: e.preferredFragmentPrecision,
        requestedVertexPrecision: e.preferredVertexPrecision,
        maxSupportedVertexPrecision: "highp",
        maxSupportedFragmentPrecision: wu()
      },
      setProgramName: {
        name: e.name
      },
      addProgramDefines: t,
      insertVersion: t
    };
    let i = e.fragment, n = e.vertex;
    Object.keys(ls).forEach((a) => {
      const o = r[a];
      i = ls[a](i, o, !0), n = ls[a](n, o, !1);
    }), this.fragment = i, this.vertex = n, this.transformFeedbackVaryings = e.transformFeedbackVaryings, this._key = er(`${this.vertex}:${this.fragment}`, "gl-program");
  }
  /** destroys the program */
  destroy() {
    this.fragment = null, this.vertex = null, this._attributeData = null, this._uniformData = null, this._uniformBlockData = null, this.transformFeedbackVaryings = null;
  }
  /**
   * Helper function that creates a program for a given source.
   * It will check the program cache if the program has already been created.
   * If it has that one will be returned, if not a new one will be created and cached.
   * @param options - The options for the program.
   * @returns A program using the same source
   */
  static from(e) {
    const t = `${e.vertex}:${e.fragment}`;
    return cs[t] || (cs[t] = new $s(e)), cs[t];
  }
};
Eo.defaultOptions = {
  preferredVertexPrecision: "highp",
  preferredFragmentPrecision: "mediump"
};
let yt = Eo;
const Un = {
  uint8x2: { size: 2, stride: 2, normalised: !1 },
  uint8x4: { size: 4, stride: 4, normalised: !1 },
  sint8x2: { size: 2, stride: 2, normalised: !1 },
  sint8x4: { size: 4, stride: 4, normalised: !1 },
  unorm8x2: { size: 2, stride: 2, normalised: !0 },
  unorm8x4: { size: 4, stride: 4, normalised: !0 },
  snorm8x2: { size: 2, stride: 2, normalised: !0 },
  snorm8x4: { size: 4, stride: 4, normalised: !0 },
  uint16x2: { size: 2, stride: 4, normalised: !1 },
  uint16x4: { size: 4, stride: 8, normalised: !1 },
  sint16x2: { size: 2, stride: 4, normalised: !1 },
  sint16x4: { size: 4, stride: 8, normalised: !1 },
  unorm16x2: { size: 2, stride: 4, normalised: !0 },
  unorm16x4: { size: 4, stride: 8, normalised: !0 },
  snorm16x2: { size: 2, stride: 4, normalised: !0 },
  snorm16x4: { size: 4, stride: 8, normalised: !0 },
  float16x2: { size: 2, stride: 4, normalised: !1 },
  float16x4: { size: 4, stride: 8, normalised: !1 },
  float32: { size: 1, stride: 4, normalised: !1 },
  float32x2: { size: 2, stride: 8, normalised: !1 },
  float32x3: { size: 3, stride: 12, normalised: !1 },
  float32x4: { size: 4, stride: 16, normalised: !1 },
  uint32: { size: 1, stride: 4, normalised: !1 },
  uint32x2: { size: 2, stride: 8, normalised: !1 },
  uint32x3: { size: 3, stride: 12, normalised: !1 },
  uint32x4: { size: 4, stride: 16, normalised: !1 },
  sint32: { size: 1, stride: 4, normalised: !1 },
  sint32x2: { size: 2, stride: 8, normalised: !1 },
  sint32x3: { size: 3, stride: 12, normalised: !1 },
  sint32x4: { size: 4, stride: 16, normalised: !1 }
};
function at(s) {
  return Un[s] ?? Un.float32;
}
const ku = {
  f32: "float32",
  "vec2<f32>": "float32x2",
  "vec3<f32>": "float32x3",
  "vec4<f32>": "float32x4",
  vec2f: "float32x2",
  vec3f: "float32x3",
  vec4f: "float32x4",
  i32: "sint32",
  "vec2<i32>": "sint32x2",
  "vec3<i32>": "sint32x3",
  "vec4<i32>": "sint32x4",
  u32: "uint32",
  "vec2<u32>": "uint32x2",
  "vec3<u32>": "uint32x3",
  "vec4<u32>": "uint32x4",
  bool: "uint32",
  "vec2<bool>": "uint32x2",
  "vec3<bool>": "uint32x3",
  "vec4<bool>": "uint32x4"
};
function Iu({ source: s, entryPoint: e }) {
  const t = {}, r = s.indexOf(`fn ${e}`);
  if (r !== -1) {
    const i = s.indexOf("->", r);
    if (i !== -1) {
      const n = s.substring(r, i), a = /@location\((\d+)\)\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_<>]+)(?:,|\s|$)/g;
      let o;
      for (; (o = a.exec(n)) !== null; ) {
        const h = ku[o[3]] ?? "float32";
        t[o[2]] = {
          location: parseInt(o[1], 10),
          format: h,
          stride: at(h).stride,
          offset: 0,
          instance: !1,
          start: 0
        };
      }
    }
  }
  return t;
}
function us(s) {
  var u, d;
  const e = /(^|[^/])@(group|binding)\(\d+\)[^;]+;/g, t = /@group\((\d+)\)/, r = /@binding\((\d+)\)/, i = /var(<[^>]+>)? (\w+)/, n = /:\s*(\w+)/, a = /struct\s+(\w+)\s*{([^}]+)}/g, o = /(\w+)\s*:\s*([\w\<\>]+)/g, h = /struct\s+(\w+)/, l = (u = s.match(e)) == null ? void 0 : u.map((f) => ({
    group: parseInt(f.match(t)[1], 10),
    binding: parseInt(f.match(r)[1], 10),
    name: f.match(i)[2],
    isUniform: f.match(i)[1] === "<uniform>",
    type: f.match(n)[1]
  }));
  if (!l)
    return {
      groups: [],
      structs: []
    };
  const c = ((d = s.match(a)) == null ? void 0 : d.map((f) => {
    const p = f.match(h)[1], g = f.match(o).reduce((m, y) => {
      const [T, S] = y.split(":");
      return m[T.trim()] = S.trim(), m;
    }, {});
    return g ? { name: p, members: g } : null;
  }).filter(({ name: f }) => l.some((p) => p.type === f))) ?? [];
  return {
    groups: l,
    structs: c
  };
}
var $t = /* @__PURE__ */ ((s) => (s[s.VERTEX = 1] = "VERTEX", s[s.FRAGMENT = 2] = "FRAGMENT", s[s.COMPUTE = 4] = "COMPUTE", s))($t || {});
function Gu({ groups: s }) {
  const e = [];
  for (let t = 0; t < s.length; t++) {
    const r = s[t];
    e[r.group] || (e[r.group] = []), r.isUniform ? e[r.group].push({
      binding: r.binding,
      visibility: $t.VERTEX | $t.FRAGMENT,
      buffer: {
        type: "uniform"
      }
    }) : r.type === "sampler" ? e[r.group].push({
      binding: r.binding,
      visibility: $t.FRAGMENT,
      sampler: {
        type: "filtering"
      }
    }) : r.type === "texture_2d" && e[r.group].push({
      binding: r.binding,
      visibility: $t.FRAGMENT,
      texture: {
        sampleType: "float",
        viewDimension: "2d",
        multisampled: !1
      }
    });
  }
  return e;
}
function Uu({ groups: s }) {
  const e = [];
  for (let t = 0; t < s.length; t++) {
    const r = s[t];
    e[r.group] || (e[r.group] = {}), e[r.group][r.name] = r.binding;
  }
  return e;
}
function Fu(s, e) {
  const t = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), i = [...s.structs, ...e.structs].filter((a) => t.has(a.name) ? !1 : (t.add(a.name), !0)), n = [...s.groups, ...e.groups].filter((a) => {
    const o = `${a.name}-${a.binding}`;
    return r.has(o) ? !1 : (r.add(o), !0);
  });
  return { structs: i, groups: n };
}
const ds = /* @__PURE__ */ Object.create(null);
class lt {
  /**
   * Create a new GpuProgram
   * @param options - The options for the gpu program
   */
  constructor(e) {
    var o, h;
    this._layoutKey = 0, this._attributeLocationsKey = 0;
    const { fragment: t, vertex: r, layout: i, gpuLayout: n, name: a } = e;
    if (this.name = a, this.fragment = t, this.vertex = r, t.source === r.source) {
      const l = us(t.source);
      this.structsAndGroups = l;
    } else {
      const l = us(r.source), c = us(t.source);
      this.structsAndGroups = Fu(l, c);
    }
    this.layout = i ?? Uu(this.structsAndGroups), this.gpuLayout = n ?? Gu(this.structsAndGroups), this.autoAssignGlobalUniforms = ((o = this.layout[0]) == null ? void 0 : o.globalUniforms) !== void 0, this.autoAssignLocalUniforms = ((h = this.layout[1]) == null ? void 0 : h.localUniforms) !== void 0, this._generateProgramKey();
  }
  // TODO maker this pure
  _generateProgramKey() {
    const { vertex: e, fragment: t } = this, r = e.source + t.source + e.entryPoint + t.entryPoint;
    this._layoutKey = er(r, "program");
  }
  get attributeData() {
    return this._attributeData ?? (this._attributeData = Iu(this.vertex)), this._attributeData;
  }
  /** destroys the program */
  destroy() {
    this.gpuLayout = null, this.layout = null, this.structsAndGroups = null, this.fragment = null, this.vertex = null;
  }
  /**
   * Helper function that creates a program for a given source.
   * It will check the program cache if the program has already been created.
   * If it has that one will be returned, if not a new one will be created and cached.
   * @param options - The options for the program.
   * @returns A program using the same source
   */
  static from(e) {
    const t = `${e.vertex.source}:${e.fragment.source}:${e.fragment.entryPoint}:${e.vertex.entryPoint}`;
    return ds[t] || (ds[t] = new lt(e)), ds[t];
  }
}
const Mo = [
  "f32",
  "i32",
  "vec2<f32>",
  "vec3<f32>",
  "vec4<f32>",
  "mat2x2<f32>",
  "mat3x3<f32>",
  "mat4x4<f32>",
  "mat3x2<f32>",
  "mat4x2<f32>",
  "mat2x3<f32>",
  "mat4x3<f32>",
  "mat2x4<f32>",
  "mat3x4<f32>",
  "vec2<i32>",
  "vec3<i32>",
  "vec4<i32>"
], Du = Mo.reduce((s, e) => (s[e] = !0, s), {});
function Ou(s, e) {
  switch (s) {
    case "f32":
      return 0;
    case "vec2<f32>":
      return new Float32Array(2 * e);
    case "vec3<f32>":
      return new Float32Array(3 * e);
    case "vec4<f32>":
      return new Float32Array(4 * e);
    case "mat2x2<f32>":
      return new Float32Array([
        1,
        0,
        0,
        1
      ]);
    case "mat3x3<f32>":
      return new Float32Array([
        1,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        1
      ]);
    case "mat4x4<f32>":
      return new Float32Array([
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1
      ]);
  }
  return null;
}
const Bo = class Ro {
  /**
   * Create a new Uniform group
   * @param uniformStructures - The structures of the uniform group
   * @param options - The optional parameters of this uniform group
   */
  constructor(e, t) {
    this._touched = 0, this.uid = le("uniform"), this._resourceType = "uniformGroup", this._resourceId = le("resource"), this.isUniformGroup = !0, this._dirtyId = 0, this.destroyed = !1, t = { ...Ro.defaultOptions, ...t }, this.uniformStructures = e;
    const r = {};
    for (const i in e) {
      const n = e[i];
      if (n.name = i, n.size = n.size ?? 1, !Du[n.type])
        throw new Error(`Uniform type ${n.type} is not supported. Supported uniform types are: ${Mo.join(", ")}`);
      n.value ?? (n.value = Ou(n.type, n.size)), r[i] = n.value;
    }
    this.uniforms = r, this._dirtyId = 1, this.ubo = t.ubo, this.isStatic = t.isStatic, this._signature = er(Object.keys(r).map(
      (i) => `${i}-${e[i].type}`
    ).join("-"), "uniform-group");
  }
  /** Call this if you want the uniform groups data to be uploaded to the GPU only useful if `isStatic` is true. */
  update() {
    this._dirtyId++;
  }
};
Bo.defaultOptions = {
  /** if true the UniformGroup is handled as an Uniform buffer object. */
  ubo: !1,
  /** if true, then you are responsible for when the data is uploaded to the GPU by calling `update()` */
  isStatic: !1
};
let be = Bo;
class Je {
  /**
   * Create a new instance eof the Bind Group.
   * @param resources - The resources that are bound together for use by a shader.
   */
  constructor(e) {
    this.resources = /* @__PURE__ */ Object.create(null), this._dirty = !0;
    let t = 0;
    for (const r in e) {
      const i = e[r];
      this.setResource(i, t++);
    }
    this._updateKey();
  }
  /**
   * Updates the key if its flagged as dirty. This is used internally to
   * match this bind group to a WebGPU BindGroup.
   * @internal
   * @ignore
   */
  _updateKey() {
    if (!this._dirty)
      return;
    this._dirty = !1;
    const e = [];
    let t = 0;
    for (const r in this.resources)
      e[t++] = this.resources[r]._resourceId;
    this._key = e.join("|");
  }
  /**
   * Set a resource at a given index. this function will
   * ensure that listeners will be removed from the current resource
   * and added to the new resource.
   * @param resource - The resource to set.
   * @param index - The index to set the resource at.
   */
  setResource(e, t) {
    var i, n;
    const r = this.resources[t];
    e !== r && (r && ((i = e.off) == null || i.call(e, "change", this.onResourceChange, this)), (n = e.on) == null || n.call(e, "change", this.onResourceChange, this), this.resources[t] = e, this._dirty = !0);
  }
  /**
   * Returns the resource at the current specified index.
   * @param index - The index of the resource to get.
   * @returns - The resource at the specified index.
   */
  getResource(e) {
    return this.resources[e];
  }
  /**
   * Used internally to 'touch' each resource, to ensure that the GC
   * knows that all resources in this bind group are still being used.
   * @param tick - The current tick.
   * @internal
   * @ignore
   */
  _touch(e) {
    const t = this.resources;
    for (const r in t)
      t[r]._touched = e;
  }
  /** Destroys this bind group and removes all listeners. */
  destroy() {
    var t;
    const e = this.resources;
    for (const r in e) {
      const i = e[r];
      (t = i.off) == null || t.call(i, "change", this.onResourceChange, this);
    }
    this.resources = null;
  }
  onResourceChange(e) {
    if (this._dirty = !0, e.destroyed) {
      const t = this.resources;
      for (const r in t)
        t[r] === e && (t[r] = null);
    } else
      this._updateKey();
  }
}
var Oe = /* @__PURE__ */ ((s) => (s[s.WEBGL = 1] = "WEBGL", s[s.WEBGPU = 2] = "WEBGPU", s[s.BOTH = 3] = "BOTH", s))(Oe || {});
class Ie extends Me {
  constructor(e) {
    super(), this.uid = le("shader"), this._uniformBindMap = /* @__PURE__ */ Object.create(null), this._ownedBindGroups = [];
    let {
      gpuProgram: t,
      glProgram: r,
      groups: i,
      resources: n,
      compatibleRenderers: a,
      groupMap: o
    } = e;
    this.gpuProgram = t, this.glProgram = r, a === void 0 && (a = 0, t && (a |= Oe.WEBGPU), r && (a |= Oe.WEBGL)), this.compatibleRenderers = a;
    const h = {};
    if (!n && !i && (n = {}), n && i)
      throw new Error("[Shader] Cannot have both resources and groups");
    if (!t && i && !o)
      throw new Error("[Shader] No group map or WebGPU shader provided - consider using resources instead.");
    if (!t && i && o)
      for (const l in o)
        for (const c in o[l]) {
          const u = o[l][c];
          h[u] = {
            group: l,
            binding: c,
            name: u
          };
        }
    else if (t && i && !o) {
      const l = t.structsAndGroups.groups;
      o = {}, l.forEach((c) => {
        o[c.group] = o[c.group] || {}, o[c.group][c.binding] = c.name, h[c.name] = c;
      });
    } else if (n) {
      i = {}, o = {}, t && t.structsAndGroups.groups.forEach((u) => {
        o[u.group] = o[u.group] || {}, o[u.group][u.binding] = u.name, h[u.name] = u;
      });
      let l = 0;
      for (const c in n)
        h[c] || (i[99] || (i[99] = new Je(), this._ownedBindGroups.push(i[99])), h[c] = { group: 99, binding: l, name: c }, o[99] = o[99] || {}, o[99][l] = c, l++);
      for (const c in n) {
        const u = c;
        let d = n[c];
        !d.source && !d._resourceType && (d = new be(d));
        const f = h[u];
        f && (i[f.group] || (i[f.group] = new Je(), this._ownedBindGroups.push(i[f.group])), i[f.group].setResource(d, f.binding));
      }
    }
    this.groups = i, this._uniformBindMap = o, this.resources = this._buildResourceAccessor(i, h);
  }
  /**
   * Sometimes a resource group will be provided later (for example global uniforms)
   * In such cases, this method can be used to let the shader know about the group.
   * @param name - the name of the resource group
   * @param groupIndex - the index of the group (should match the webGPU shader group location)
   * @param bindIndex - the index of the bind point (should match the webGPU shader bind point)
   */
  addResource(e, t, r) {
    var i, n;
    (i = this._uniformBindMap)[t] || (i[t] = {}), (n = this._uniformBindMap[t])[r] || (n[r] = e), this.groups[t] || (this.groups[t] = new Je(), this._ownedBindGroups.push(this.groups[t]));
  }
  _buildResourceAccessor(e, t) {
    const r = {};
    for (const i in t) {
      const n = t[i];
      Object.defineProperty(r, n.name, {
        get() {
          return e[n.group].getResource(n.binding);
        },
        set(a) {
          e[n.group].setResource(a, n.binding);
        }
      });
    }
    return r;
  }
  /**
   * Use to destroy the shader when its not longer needed.
   * It will destroy the resources and remove listeners.
   * @param destroyPrograms - if the programs should be destroyed as well.
   * Make sure its not being used by other shaders!
   */
  destroy(e = !1) {
    var t, r;
    this.emit("destroy", this), e && ((t = this.gpuProgram) == null || t.destroy(), (r = this.glProgram) == null || r.destroy()), this.gpuProgram = null, this.glProgram = null, this.removeAllListeners(), this._uniformBindMap = null, this._ownedBindGroups.forEach((i) => {
      i.destroy();
    }), this._ownedBindGroups = null, this.resources = null, this.groups = null;
  }
  static from(e) {
    const { gpu: t, gl: r, ...i } = e;
    let n, a;
    return t && (n = lt.from(t)), r && (a = yt.from(r)), new Ie({
      gpuProgram: n,
      glProgram: a,
      ...i
    });
  }
}
const Lu = {
  normal: 0,
  add: 1,
  multiply: 2,
  screen: 3,
  overlay: 4,
  erase: 5,
  "normal-npm": 6,
  "add-npm": 7,
  "screen-npm": 8,
  min: 9,
  max: 10
}, fs = 0, ps = 1, ms = 2, gs = 3, _s = 4, xs = 5, Xs = class ko {
  constructor() {
    this.data = 0, this.blendMode = "normal", this.polygonOffset = 0, this.blend = !0, this.depthMask = !0;
  }
  /**
   * Activates blending of the computed fragment color values.
   * @default true
   */
  get blend() {
    return !!(this.data & 1 << fs);
  }
  set blend(e) {
    !!(this.data & 1 << fs) !== e && (this.data ^= 1 << fs);
  }
  /**
   * Activates adding an offset to depth values of polygon's fragments
   * @default false
   */
  get offsets() {
    return !!(this.data & 1 << ps);
  }
  set offsets(e) {
    !!(this.data & 1 << ps) !== e && (this.data ^= 1 << ps);
  }
  /** The culling settings for this state none - No culling back - Back face culling front - Front face culling */
  set cullMode(e) {
    if (e === "none") {
      this.culling = !1;
      return;
    }
    this.culling = !0, this.clockwiseFrontFace = e === "front";
  }
  get cullMode() {
    return this.culling ? this.clockwiseFrontFace ? "front" : "back" : "none";
  }
  /**
   * Activates culling of polygons.
   * @default false
   */
  get culling() {
    return !!(this.data & 1 << ms);
  }
  set culling(e) {
    !!(this.data & 1 << ms) !== e && (this.data ^= 1 << ms);
  }
  /**
   * Activates depth comparisons and updates to the depth buffer.
   * @default false
   */
  get depthTest() {
    return !!(this.data & 1 << gs);
  }
  set depthTest(e) {
    !!(this.data & 1 << gs) !== e && (this.data ^= 1 << gs);
  }
  /**
   * Enables or disables writing to the depth buffer.
   * @default true
   */
  get depthMask() {
    return !!(this.data & 1 << xs);
  }
  set depthMask(e) {
    !!(this.data & 1 << xs) !== e && (this.data ^= 1 << xs);
  }
  /**
   * Specifies whether or not front or back-facing polygons can be culled.
   * @default false
   */
  get clockwiseFrontFace() {
    return !!(this.data & 1 << _s);
  }
  set clockwiseFrontFace(e) {
    !!(this.data & 1 << _s) !== e && (this.data ^= 1 << _s);
  }
  /**
   * The blend mode to be applied when this state is set. Apply a value of `normal` to reset the blend mode.
   * Setting this mode to anything other than NO_BLEND will automatically switch blending on.
   * @default 'normal'
   */
  get blendMode() {
    return this._blendMode;
  }
  set blendMode(e) {
    this.blend = e !== "none", this._blendMode = e, this._blendModeId = Lu[e] || 0;
  }
  /**
   * The polygon offset. Setting this property to anything other than 0 will automatically enable polygon offset fill.
   * @default 0
   */
  get polygonOffset() {
    return this._polygonOffset;
  }
  set polygonOffset(e) {
    this.offsets = !!e, this._polygonOffset = e;
  }
  toString() {
    return `[pixi.js/core:State blendMode=${this.blendMode} clockwiseFrontFace=${this.clockwiseFrontFace} culling=${this.culling} depthMask=${this.depthMask} polygonOffset=${this.polygonOffset}]`;
  }
  /**
   * A quickly getting an instance of a State that is configured for 2d rendering.
   * @returns a new State with values set for 2d rendering
   */
  static for2d() {
    const e = new ko();
    return e.depthTest = !1, e.blend = !0, e;
  }
};
Xs.default2d = Xs.for2d();
let ke = Xs;
const Io = class js extends Ie {
  /**
   * @param options - The optional parameters of this filter.
   */
  constructor(e) {
    e = { ...js.defaultOptions, ...e }, super(e), this.enabled = !0, this._state = ke.for2d(), this.blendMode = e.blendMode, this.padding = e.padding, typeof e.antialias == "boolean" ? this.antialias = e.antialias ? "on" : "off" : this.antialias = e.antialias, this.resolution = e.resolution, this.blendRequired = e.blendRequired, this.clipToViewport = e.clipToViewport, this.addResource("uTexture", 0, 1);
  }
  /**
   * Applies the filter
   * @param filterManager - The renderer to retrieve the filter from
   * @param input - The input render target.
   * @param output - The target to output to.
   * @param clearMode - Should the output be cleared before rendering to it
   */
  apply(e, t, r, i) {
    e.applyFilter(this, t, r, i);
  }
  /**
   * Get the blend mode of the filter.
   * @default "normal"
   */
  get blendMode() {
    return this._state.blendMode;
  }
  /** Sets the blend mode of the filter. */
  set blendMode(e) {
    this._state.blendMode = e;
  }
  /**
   * A short hand function to create a filter based of a vertex and fragment shader src.
   * @param options
   * @returns A shiny new PixiJS filter!
   */
  static from(e) {
    const { gpu: t, gl: r, ...i } = e;
    let n, a;
    return t && (n = lt.from(t)), r && (a = yt.from(r)), new js({
      gpuProgram: n,
      glProgram: a,
      ...i
    });
  }
};
Io.defaultOptions = {
  blendMode: "normal",
  resolution: 1,
  padding: 0,
  antialias: "off",
  blendRequired: !1,
  clipToViewport: !0
};
let Go = Io;
const Ys = [];
z.handleByNamedList(v.Environment, Ys);
async function Nu(s) {
  if (!s)
    for (let e = 0; e < Ys.length; e++) {
      const t = Ys[e];
      if (t.value.test()) {
        await t.value.load();
        return;
      }
    }
}
let Ot;
function Uo() {
  if (typeof Ot == "boolean")
    return Ot;
  try {
    Ot = new Function("param1", "param2", "param3", "return param1[param2] === param3;")({ a: "b" }, "a", "b") === !0;
  } catch {
    Ot = !1;
  }
  return Ot;
}
var _r = { exports: {} }, Fn;
function Hu() {
  if (Fn) return _r.exports;
  Fn = 1, _r.exports = s, _r.exports.default = s;
  function s(_, x, b) {
    b = b || 2;
    var w = x && x.length, C = w ? x[0] * b : _.length, B = e(_, 0, C, b, !0), R = [];
    if (!B || B.next === B.prev) return R;
    var U, W, H, se, ie, Q, de;
    if (w && (B = h(_, x, B, b)), _.length > 80 * b) {
      U = H = _[0], W = se = _[1];
      for (var te = b; te < C; te += b)
        ie = _[te], Q = _[te + 1], ie < U && (U = ie), Q < W && (W = Q), ie > H && (H = ie), Q > se && (se = Q);
      de = Math.max(H - U, se - W), de = de !== 0 ? 32767 / de : 0;
    }
    return r(B, R, b, U, W, de, 0), R;
  }
  function e(_, x, b, w, C) {
    var B, R;
    if (C === ge(_, x, b, w) > 0)
      for (B = x; B < b; B += w) R = F(B, _[B], _[B + 1], R);
    else
      for (B = b - w; B >= x; B -= w) R = F(B, _[B], _[B + 1], R);
    return R && A(R, R.next) && ($(R), R = R.next), R;
  }
  function t(_, x) {
    if (!_) return _;
    x || (x = _);
    var b = _, w;
    do
      if (w = !1, !b.steiner && (A(b, b.next) || S(b.prev, b, b.next) === 0)) {
        if ($(b), b = x = b.prev, b === b.next) break;
        w = !0;
      } else
        b = b.next;
    while (w || b !== x);
    return x;
  }
  function r(_, x, b, w, C, B, R) {
    if (_) {
      !R && B && f(_, w, C, B);
      for (var U = _, W, H; _.prev !== _.next; ) {
        if (W = _.prev, H = _.next, B ? n(_, w, C, B) : i(_)) {
          x.push(W.i / b | 0), x.push(_.i / b | 0), x.push(H.i / b | 0), $(_), _ = H.next, U = H.next;
          continue;
        }
        if (_ = H, _ === U) {
          R ? R === 1 ? (_ = a(t(_), x, b), r(_, x, b, w, C, B, 2)) : R === 2 && o(_, x, b, w, C, B) : r(t(_), x, b, w, C, B, 1);
          break;
        }
      }
    }
  }
  function i(_) {
    var x = _.prev, b = _, w = _.next;
    if (S(x, b, w) >= 0) return !1;
    for (var C = x.x, B = b.x, R = w.x, U = x.y, W = b.y, H = w.y, se = C < B ? C < R ? C : R : B < R ? B : R, ie = U < W ? U < H ? U : H : W < H ? W : H, Q = C > B ? C > R ? C : R : B > R ? B : R, de = U > W ? U > H ? U : H : W > H ? W : H, te = w.next; te !== x; ) {
      if (te.x >= se && te.x <= Q && te.y >= ie && te.y <= de && y(C, U, B, W, R, H, te.x, te.y) && S(te.prev, te, te.next) >= 0) return !1;
      te = te.next;
    }
    return !0;
  }
  function n(_, x, b, w) {
    var C = _.prev, B = _, R = _.next;
    if (S(C, B, R) >= 0) return !1;
    for (var U = C.x, W = B.x, H = R.x, se = C.y, ie = B.y, Q = R.y, de = U < W ? U < H ? U : H : W < H ? W : H, te = se < ie ? se < Q ? se : Q : ie < Q ? ie : Q, je = U > W ? U > H ? U : H : W > H ? W : H, we = se > ie ? se > Q ? se : Q : ie > Q ? ie : Q, Ne = g(de, te, x, b, w), He = g(je, we, x, b, w), j = _.prevZ, J = _.nextZ; j && j.z >= Ne && J && J.z <= He; ) {
      if (j.x >= de && j.x <= je && j.y >= te && j.y <= we && j !== C && j !== R && y(U, se, W, ie, H, Q, j.x, j.y) && S(j.prev, j, j.next) >= 0 || (j = j.prevZ, J.x >= de && J.x <= je && J.y >= te && J.y <= we && J !== C && J !== R && y(U, se, W, ie, H, Q, J.x, J.y) && S(J.prev, J, J.next) >= 0)) return !1;
      J = J.nextZ;
    }
    for (; j && j.z >= Ne; ) {
      if (j.x >= de && j.x <= je && j.y >= te && j.y <= we && j !== C && j !== R && y(U, se, W, ie, H, Q, j.x, j.y) && S(j.prev, j, j.next) >= 0) return !1;
      j = j.prevZ;
    }
    for (; J && J.z <= He; ) {
      if (J.x >= de && J.x <= je && J.y >= te && J.y <= we && J !== C && J !== R && y(U, se, W, ie, H, Q, J.x, J.y) && S(J.prev, J, J.next) >= 0) return !1;
      J = J.nextZ;
    }
    return !0;
  }
  function a(_, x, b) {
    var w = _;
    do {
      var C = w.prev, B = w.next.next;
      !A(C, B) && M(C, w, w.next, B) && I(C, B) && I(B, C) && (x.push(C.i / b | 0), x.push(w.i / b | 0), x.push(B.i / b | 0), $(w), $(w.next), w = _ = B), w = w.next;
    } while (w !== _);
    return t(w);
  }
  function o(_, x, b, w, C, B) {
    var R = _;
    do {
      for (var U = R.next.next; U !== R.prev; ) {
        if (R.i !== U.i && T(R, U)) {
          var W = G(R, U);
          R = t(R, R.next), W = t(W, W.next), r(R, x, b, w, C, B, 0), r(W, x, b, w, C, B, 0);
          return;
        }
        U = U.next;
      }
      R = R.next;
    } while (R !== _);
  }
  function h(_, x, b, w) {
    var C = [], B, R, U, W, H;
    for (B = 0, R = x.length; B < R; B++)
      U = x[B] * w, W = B < R - 1 ? x[B + 1] * w : _.length, H = e(_, U, W, w, !1), H === H.next && (H.steiner = !0), C.push(m(H));
    for (C.sort(l), B = 0; B < C.length; B++)
      b = c(C[B], b);
    return b;
  }
  function l(_, x) {
    return _.x - x.x;
  }
  function c(_, x) {
    var b = u(_, x);
    if (!b)
      return x;
    var w = G(b, _);
    return t(w, w.next), t(b, b.next);
  }
  function u(_, x) {
    var b = x, w = _.x, C = _.y, B = -1 / 0, R;
    do {
      if (C <= b.y && C >= b.next.y && b.next.y !== b.y) {
        var U = b.x + (C - b.y) * (b.next.x - b.x) / (b.next.y - b.y);
        if (U <= w && U > B && (B = U, R = b.x < b.next.x ? b : b.next, U === w))
          return R;
      }
      b = b.next;
    } while (b !== x);
    if (!R) return null;
    var W = R, H = R.x, se = R.y, ie = 1 / 0, Q;
    b = R;
    do
      w >= b.x && b.x >= H && w !== b.x && y(C < se ? w : B, C, H, se, C < se ? B : w, C, b.x, b.y) && (Q = Math.abs(C - b.y) / (w - b.x), I(b, _) && (Q < ie || Q === ie && (b.x > R.x || b.x === R.x && d(R, b))) && (R = b, ie = Q)), b = b.next;
    while (b !== W);
    return R;
  }
  function d(_, x) {
    return S(_.prev, _, x.prev) < 0 && S(x.next, _, _.next) < 0;
  }
  function f(_, x, b, w) {
    var C = _;
    do
      C.z === 0 && (C.z = g(C.x, C.y, x, b, w)), C.prevZ = C.prev, C.nextZ = C.next, C = C.next;
    while (C !== _);
    C.prevZ.nextZ = null, C.prevZ = null, p(C);
  }
  function p(_) {
    var x, b, w, C, B, R, U, W, H = 1;
    do {
      for (b = _, _ = null, B = null, R = 0; b; ) {
        for (R++, w = b, U = 0, x = 0; x < H && (U++, w = w.nextZ, !!w); x++)
          ;
        for (W = H; U > 0 || W > 0 && w; )
          U !== 0 && (W === 0 || !w || b.z <= w.z) ? (C = b, b = b.nextZ, U--) : (C = w, w = w.nextZ, W--), B ? B.nextZ = C : _ = C, C.prevZ = B, B = C;
        b = w;
      }
      B.nextZ = null, H *= 2;
    } while (R > 1);
    return _;
  }
  function g(_, x, b, w, C) {
    return _ = (_ - b) * C | 0, x = (x - w) * C | 0, _ = (_ | _ << 8) & 16711935, _ = (_ | _ << 4) & 252645135, _ = (_ | _ << 2) & 858993459, _ = (_ | _ << 1) & 1431655765, x = (x | x << 8) & 16711935, x = (x | x << 4) & 252645135, x = (x | x << 2) & 858993459, x = (x | x << 1) & 1431655765, _ | x << 1;
  }
  function m(_) {
    var x = _, b = _;
    do
      (x.x < b.x || x.x === b.x && x.y < b.y) && (b = x), x = x.next;
    while (x !== _);
    return b;
  }
  function y(_, x, b, w, C, B, R, U) {
    return (C - R) * (x - U) >= (_ - R) * (B - U) && (_ - R) * (w - U) >= (b - R) * (x - U) && (b - R) * (B - U) >= (C - R) * (w - U);
  }
  function T(_, x) {
    return _.next.i !== x.i && _.prev.i !== x.i && !N(_, x) && // dones't intersect other edges
    (I(_, x) && I(x, _) && k(_, x) && // locally visible
    (S(_.prev, _, x.prev) || S(_, x.prev, x)) || // does not create opposite-facing sectors
    A(_, x) && S(_.prev, _, _.next) > 0 && S(x.prev, x, x.next) > 0);
  }
  function S(_, x, b) {
    return (x.y - _.y) * (b.x - x.x) - (x.x - _.x) * (b.y - x.y);
  }
  function A(_, x) {
    return _.x === x.x && _.y === x.y;
  }
  function M(_, x, b, w) {
    var C = E(S(_, x, b)), B = E(S(_, x, w)), R = E(S(b, w, _)), U = E(S(b, w, x));
    return !!(C !== B && R !== U || C === 0 && P(_, b, x) || B === 0 && P(_, w, x) || R === 0 && P(b, _, w) || U === 0 && P(b, x, w));
  }
  function P(_, x, b) {
    return x.x <= Math.max(_.x, b.x) && x.x >= Math.min(_.x, b.x) && x.y <= Math.max(_.y, b.y) && x.y >= Math.min(_.y, b.y);
  }
  function E(_) {
    return _ > 0 ? 1 : _ < 0 ? -1 : 0;
  }
  function N(_, x) {
    var b = _;
    do {
      if (b.i !== _.i && b.next.i !== _.i && b.i !== x.i && b.next.i !== x.i && M(b, b.next, _, x)) return !0;
      b = b.next;
    } while (b !== _);
    return !1;
  }
  function I(_, x) {
    return S(_.prev, _, _.next) < 0 ? S(_, x, _.next) >= 0 && S(_, _.prev, x) >= 0 : S(_, x, _.prev) < 0 || S(_, _.next, x) < 0;
  }
  function k(_, x) {
    var b = _, w = !1, C = (_.x + x.x) / 2, B = (_.y + x.y) / 2;
    do
      b.y > B != b.next.y > B && b.next.y !== b.y && C < (b.next.x - b.x) * (B - b.y) / (b.next.y - b.y) + b.x && (w = !w), b = b.next;
    while (b !== _);
    return w;
  }
  function G(_, x) {
    var b = new ae(_.i, _.x, _.y), w = new ae(x.i, x.x, x.y), C = _.next, B = x.prev;
    return _.next = x, x.prev = _, b.next = C, C.prev = b, w.next = b, b.prev = w, B.next = w, w.prev = B, w;
  }
  function F(_, x, b, w) {
    var C = new ae(_, x, b);
    return w ? (C.next = w.next, C.prev = w, w.next.prev = C, w.next = C) : (C.prev = C, C.next = C), C;
  }
  function $(_) {
    _.next.prev = _.prev, _.prev.next = _.next, _.prevZ && (_.prevZ.nextZ = _.nextZ), _.nextZ && (_.nextZ.prevZ = _.prevZ);
  }
  function ae(_, x, b) {
    this.i = _, this.x = x, this.y = b, this.prev = null, this.next = null, this.z = 0, this.prevZ = null, this.nextZ = null, this.steiner = !1;
  }
  s.deviation = function(_, x, b, w) {
    var C = x && x.length, B = C ? x[0] * b : _.length, R = Math.abs(ge(_, 0, B, b));
    if (C)
      for (var U = 0, W = x.length; U < W; U++) {
        var H = x[U] * b, se = U < W - 1 ? x[U + 1] * b : _.length;
        R -= Math.abs(ge(_, H, se, b));
      }
    var ie = 0;
    for (U = 0; U < w.length; U += 3) {
      var Q = w[U] * b, de = w[U + 1] * b, te = w[U + 2] * b;
      ie += Math.abs(
        (_[Q] - _[te]) * (_[de + 1] - _[Q + 1]) - (_[Q] - _[de]) * (_[te + 1] - _[Q + 1])
      );
    }
    return R === 0 && ie === 0 ? 0 : Math.abs((ie - R) / R);
  };
  function ge(_, x, b, w) {
    for (var C = 0, B = x, R = b - w; B < b; B += w)
      C += (_[R] - _[B]) * (_[B + 1] + _[R + 1]), R = B;
    return C;
  }
  return s.flatten = function(_) {
    for (var x = _[0][0].length, b = { vertices: [], holes: [], dimensions: x }, w = 0, C = 0; C < _.length; C++) {
      for (var B = 0; B < _[C].length; B++)
        for (var R = 0; R < x; R++) b.vertices.push(_[C][B][R]);
      C > 0 && (w += _[C - 1].length, b.holes.push(w));
    }
    return b;
  }, _r.exports;
}
var Wu = Hu();
const zu = /* @__PURE__ */ ui(Wu);
var Pe = /* @__PURE__ */ ((s) => (s[s.NONE = 0] = "NONE", s[s.COLOR = 16384] = "COLOR", s[s.STENCIL = 1024] = "STENCIL", s[s.DEPTH = 256] = "DEPTH", s[s.COLOR_DEPTH = 16640] = "COLOR_DEPTH", s[s.COLOR_STENCIL = 17408] = "COLOR_STENCIL", s[s.DEPTH_STENCIL = 1280] = "DEPTH_STENCIL", s[s.ALL = 17664] = "ALL", s))(Pe || {});
class Fo {
  /**
   * @param name - The function name that will be executed on the listeners added to this Runner.
   */
  constructor(e) {
    this.items = [], this._name = e;
  }
  /* jsdoc/check-param-names */
  /**
   * Dispatch/Broadcast Runner to all listeners added to the queue.
   * @param {...any} params - (optional) parameters to pass to each listener
   */
  /* jsdoc/check-param-names */
  emit(e, t, r, i, n, a, o, h) {
    const { name: l, items: c } = this;
    for (let u = 0, d = c.length; u < d; u++)
      c[u][l](e, t, r, i, n, a, o, h);
    return this;
  }
  /**
   * Add a listener to the Runner
   *
   * Runners do not need to have scope or functions passed to them.
   * All that is required is to pass the listening object and ensure that it has contains a function that has the same name
   * as the name provided to the Runner when it was created.
   *
   * Eg A listener passed to this Runner will require a 'complete' function.
   *
   * ```
   * import { Runner } from 'pixi.js';
   *
   * const complete = new Runner('complete');
   * ```
   *
   * The scope used will be the object itself.
   * @param {any} item - The object that will be listening.
   */
  add(e) {
    return e[this._name] && (this.remove(e), this.items.push(e)), this;
  }
  /**
   * Remove a single listener from the dispatch queue.
   * @param {any} item - The listener that you would like to remove.
   */
  remove(e) {
    const t = this.items.indexOf(e);
    return t !== -1 && this.items.splice(t, 1), this;
  }
  /**
   * Check to see if the listener is already in the Runner
   * @param {any} item - The listener that you would like to check.
   */
  contains(e) {
    return this.items.indexOf(e) !== -1;
  }
  /** Remove all listeners from the Runner */
  removeAll() {
    return this.items.length = 0, this;
  }
  /** Remove all references, don't use after this. */
  destroy() {
    this.removeAll(), this.items = null, this._name = null;
  }
  /**
   * `true` if there are no this Runner contains no listeners
   * @readonly
   */
  get empty() {
    return this.items.length === 0;
  }
  /**
   * The name of the runner.
   * @readonly
   */
  get name() {
    return this._name;
  }
}
const Vu = [
  "init",
  "destroy",
  "contextChange",
  "resolutionChange",
  "resetState",
  "renderEnd",
  "renderStart",
  "render",
  "update",
  "postrender",
  "prerender"
], Do = class Oo extends Me {
  /**
   * Set up a system with a collection of SystemClasses and runners.
   * Systems are attached dynamically to this class when added.
   * @param config - the config for the system manager
   */
  constructor(e) {
    super(), this.runners = /* @__PURE__ */ Object.create(null), this.renderPipes = /* @__PURE__ */ Object.create(null), this._initOptions = {}, this._systemsHash = /* @__PURE__ */ Object.create(null), this.type = e.type, this.name = e.name, this.config = e;
    const t = [...Vu, ...this.config.runners ?? []];
    this._addRunners(...t), this._unsafeEvalCheck();
  }
  /**
   * Initialize the renderer.
   * @param options - The options to use to create the renderer.
   */
  async init(e = {}) {
    const t = e.skipExtensionImports === !0 ? !0 : e.manageImports === !1;
    await Nu(t), this._addSystems(this.config.systems), this._addPipes(this.config.renderPipes, this.config.renderPipeAdaptors);
    for (const r in this._systemsHash)
      e = { ...this._systemsHash[r].constructor.defaultOptions, ...e };
    e = { ...Oo.defaultOptions, ...e }, this._roundPixels = e.roundPixels ? 1 : 0;
    for (let r = 0; r < this.runners.init.items.length; r++)
      await this.runners.init.items[r].init(e);
    this._initOptions = e;
  }
  render(e, t) {
    let r = e;
    if (r instanceof _e && (r = { container: r }, t && (X(Y, "passing a second argument is deprecated, please use render options instead"), r.target = t.renderTexture)), r.target || (r.target = this.view.renderTarget), r.target === this.view.renderTarget && (this._lastObjectRendered = r.container, r.clearColor ?? (r.clearColor = this.background.colorRgba), r.clear ?? (r.clear = this.background.clearBeforeRender)), r.clearColor) {
      const i = Array.isArray(r.clearColor) && r.clearColor.length === 4;
      r.clearColor = i ? r.clearColor : re.shared.setValue(r.clearColor).toArray();
    }
    r.transform || (r.container.updateLocalTransform(), r.transform = r.container.localTransform), r.container.enableRenderGroup(), this.runners.prerender.emit(r), this.runners.renderStart.emit(r), this.runners.render.emit(r), this.runners.renderEnd.emit(r), this.runners.postrender.emit(r);
  }
  /**
   * Resizes the WebGL view to the specified width and height.
   * @param desiredScreenWidth - The desired width of the screen.
   * @param desiredScreenHeight - The desired height of the screen.
   * @param resolution - The resolution / device pixel ratio of the renderer.
   */
  resize(e, t, r) {
    const i = this.view.resolution;
    this.view.resize(e, t, r), this.emit("resize", this.view.screen.width, this.view.screen.height, this.view.resolution), r !== void 0 && r !== i && this.runners.resolutionChange.emit(r);
  }
  clear(e = {}) {
    const t = this;
    e.target || (e.target = t.renderTarget.renderTarget), e.clearColor || (e.clearColor = this.background.colorRgba), e.clear ?? (e.clear = Pe.ALL);
    const { clear: r, clearColor: i, target: n } = e;
    re.shared.setValue(i ?? this.background.colorRgba), t.renderTarget.clear(n, r, re.shared.toArray());
  }
  /** The resolution / device pixel ratio of the renderer. */
  get resolution() {
    return this.view.resolution;
  }
  set resolution(e) {
    this.view.resolution = e, this.runners.resolutionChange.emit(e);
  }
  /**
   * Same as view.width, actual number of pixels in the canvas by horizontal.
   * @member {number}
   * @readonly
   * @default 800
   */
  get width() {
    return this.view.texture.frame.width;
  }
  /**
   * Same as view.height, actual number of pixels in the canvas by vertical.
   * @default 600
   */
  get height() {
    return this.view.texture.frame.height;
  }
  // NOTE: this was `view` in v7
  /**
   * The canvas element that everything is drawn to.
   * @type {environment.ICanvas}
   */
  get canvas() {
    return this.view.canvas;
  }
  /**
   * the last object rendered by the renderer. Useful for other plugins like interaction managers
   * @readonly
   */
  get lastObjectRendered() {
    return this._lastObjectRendered;
  }
  /**
   * Flag if we are rendering to the screen vs renderTexture
   * @readonly
   * @default true
   */
  get renderingToScreen() {
    return this.renderTarget.renderingToScreen;
  }
  /**
   * Measurements of the screen. (0, 0, screenWidth, screenHeight).
   *
   * Its safe to use as filterArea or hitArea for the whole stage.
   */
  get screen() {
    return this.view.screen;
  }
  /**
   * Create a bunch of runners based of a collection of ids
   * @param runnerIds - the runner ids to add
   */
  _addRunners(...e) {
    e.forEach((t) => {
      this.runners[t] = new Fo(t);
    });
  }
  _addSystems(e) {
    let t;
    for (t in e) {
      const r = e[t];
      this._addSystem(r.value, r.name);
    }
  }
  /**
   * Add a new system to the renderer.
   * @param ClassRef - Class reference
   * @param name - Property name for system, if not specified
   *        will use a static `name` property on the class itself. This
   *        name will be assigned as s property on the Renderer so make
   *        sure it doesn't collide with properties on Renderer.
   * @returns Return instance of renderer
   */
  _addSystem(e, t) {
    const r = new e(this);
    if (this[t])
      throw new Error(`Whoops! The name "${t}" is already in use`);
    this[t] = r, this._systemsHash[t] = r;
    for (const i in this.runners)
      this.runners[i].add(r);
    return this;
  }
  _addPipes(e, t) {
    const r = t.reduce((i, n) => (i[n.name] = n.value, i), {});
    e.forEach((i) => {
      const n = i.value, a = i.name, o = r[a];
      this.renderPipes[a] = new n(
        this,
        o ? new o() : null
      );
    });
  }
  destroy(e = !1) {
    this.runners.destroy.items.reverse(), this.runners.destroy.emit(e), Object.values(this.runners).forEach((t) => {
      t.destroy();
    }), this._systemsHash = null, this.renderPipes = null;
  }
  /**
   * Generate a texture from a container.
   * @param options - options or container target to use when generating the texture
   * @returns a texture
   */
  generateTexture(e) {
    return this.textureGenerator.generateTexture(e);
  }
  /**
   * Whether the renderer will round coordinates to whole pixels when rendering.
   * Can be overridden on a per scene item basis.
   */
  get roundPixels() {
    return !!this._roundPixels;
  }
  /**
   * Overridable function by `pixi.js/unsafe-eval` to silence
   * throwing an error if platform doesn't support unsafe-evals.
   * @private
   * @ignore
   */
  _unsafeEvalCheck() {
    if (!Uo())
      throw new Error("Current environment does not allow unsafe-eval, please use pixi.js/unsafe-eval module to enable support.");
  }
  /**
   * Resets the rendering state of the renderer.
   * This is useful when you want to use the WebGL context directly and need to ensure PixiJS's internal state
   * stays synchronized. When modifying the WebGL context state externally, calling this method before the next Pixi
   * render will reset all internal caches and ensure it executes correctly.
   *
   * This is particularly useful when combining PixiJS with other rendering engines like Three.js:
   * ```js
   * // Reset Three.js state
   * threeRenderer.resetState();
   *
   * // Render a Three.js scene
   * threeRenderer.render(threeScene, threeCamera);
   *
   * // Reset PixiJS state since Three.js modified the WebGL context
   * pixiRenderer.resetState();
   *
   * // Now render Pixi content
   * pixiRenderer.render(pixiScene);
   * ```
   */
  resetState() {
    this.runners.resetState.emit();
  }
};
Do.defaultOptions = {
  /**
   * Default resolution / device pixel ratio of the renderer.
   * @default 1
   */
  resolution: 1,
  /**
   * Should the `failIfMajorPerformanceCaveat` flag be enabled as a context option used in the `isWebGLSupported`
   * function. If set to true, a WebGL renderer can fail to be created if the browser thinks there could be
   * performance issues when using WebGL.
   *
   * In PixiJS v6 this has changed from true to false by default, to allow WebGL to work in as many
   * scenarios as possible. However, some users may have a poor experience, for example, if a user has a gpu or
   * driver version blacklisted by the
   * browser.
   *
   * If your application requires high performance rendering, you may wish to set this to false.
   * We recommend one of two options if you decide to set this flag to false:
   *
   * 1: Use the Canvas renderer as a fallback in case high performance WebGL is
   *    not supported.
   *
   * 2: Call `isWebGLSupported` (which if found in the utils package) in your code before attempting to create a
   *    PixiJS renderer, and show an error message to the user if the function returns false, explaining that their
   *    device & browser combination does not support high performance WebGL.
   *    This is a much better strategy than trying to create a PixiJS renderer and finding it then fails.
   * @default false
   */
  failIfMajorPerformanceCaveat: !1,
  /**
   * Should round pixels be forced when rendering?
   * @default false
   */
  roundPixels: !1
};
let Vr = Do, xr;
function $u(s) {
  return xr !== void 0 || (xr = (() => {
    var t;
    const e = {
      stencil: !0,
      failIfMajorPerformanceCaveat: s ?? Vr.defaultOptions.failIfMajorPerformanceCaveat
    };
    try {
      if (!Z.get().getWebGLRenderingContext())
        return !1;
      let i = Z.get().createCanvas().getContext("webgl", e);
      const n = !!((t = i == null ? void 0 : i.getContextAttributes()) != null && t.stencil);
      if (i) {
        const a = i.getExtension("WEBGL_lose_context");
        a && a.loseContext();
      }
      return i = null, n;
    } catch {
      return !1;
    }
  })()), xr;
}
let yr;
async function Xu(s = {}) {
  return yr !== void 0 || (yr = await (async () => {
    const e = Z.get().getNavigator().gpu;
    if (!e)
      return !1;
    try {
      return await (await e.requestAdapter(s)).requestDevice(), !0;
    } catch {
      return !1;
    }
  })()), yr;
}
const Dn = ["webgl", "webgpu", "canvas"];
async function ju(s) {
  let e = [];
  s.preference ? (e.push(s.preference), Dn.forEach((n) => {
    n !== s.preference && e.push(n);
  })) : e = Dn.slice();
  let t, r = {};
  for (let n = 0; n < e.length; n++) {
    const a = e[n];
    if (a === "webgpu" && await Xu()) {
      const { WebGPURenderer: o } = await Promise.resolve().then(() => kg);
      t = o, r = { ...s, ...s.webgpu };
      break;
    } else if (a === "webgl" && $u(
      s.failIfMajorPerformanceCaveat ?? Vr.defaultOptions.failIfMajorPerformanceCaveat
    )) {
      const { WebGLRenderer: o } = await Promise.resolve().then(() => fg);
      t = o, r = { ...s, ...s.webgl };
      break;
    } else if (a === "canvas")
      throw r = { ...s }, new Error("CanvasRenderer is not yet implemented");
  }
  if (delete r.webgpu, delete r.webgl, !t)
    throw new Error("No available renderer for the current environment");
  const i = new t();
  return await i.init(r), i;
}
const Dr = "8.8.1";
class Lo {
  static init() {
    var e;
    (e = globalThis.__PIXI_APP_INIT__) == null || e.call(globalThis, this, Dr);
  }
  static destroy() {
  }
}
Lo.extension = v.Application;
class No {
  constructor(e) {
    this._renderer = e;
  }
  init() {
    var e;
    (e = globalThis.__PIXI_RENDERER_INIT__) == null || e.call(globalThis, this._renderer, Dr);
  }
  destroy() {
    this._renderer = null;
  }
}
No.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem
  ],
  name: "initHook",
  priority: -10
};
const Ho = class Ks {
  /** @ignore */
  constructor(...e) {
    this.stage = new _e(), e[0] !== void 0 && X(Y, "Application constructor options are deprecated, please use Application.init() instead.");
  }
  /**
   * @param options - The optional application and renderer parameters.
   */
  async init(e) {
    e = { ...e }, this.renderer = await ju(e), Ks._plugins.forEach((t) => {
      t.init.call(this, e);
    });
  }
  /** Render the current stage. */
  render() {
    this.renderer.render({ container: this.stage });
  }
  /**
   * Reference to the renderer's canvas element.
   * @readonly
   * @member {HTMLCanvasElement}
   */
  get canvas() {
    return this.renderer.canvas;
  }
  /**
   * Reference to the renderer's canvas element.
   * @member {HTMLCanvasElement}
   * @deprecated since 8.0.0
   */
  get view() {
    return X(Y, "Application.view is deprecated, please use Application.canvas instead."), this.renderer.canvas;
  }
  /**
   * Reference to the renderer's screen rectangle. Its safe to use as `filterArea` or `hitArea` for the whole screen.
   * @readonly
   */
  get screen() {
    return this.renderer.screen;
  }
  /**
   * Destroys the application and all of its resources.
   * @param {object|boolean}[rendererDestroyOptions=false] - The options for destroying the renderer.
   * @param {boolean}[rendererDestroyOptions.removeView=false] - Removes the Canvas element from the DOM.
   * @param {object|boolean} [options=false] - The options for destroying the stage.
   * @param {boolean} [options.children=false] - If set to true, all the children will have their destroy method
   * called as well. `options` will be passed on to those calls.
   * @param {boolean} [options.texture=false] - Only used for children with textures e.g. Sprites.
   * If options.children is set to true,
   * it should destroy the texture of the child sprite.
   * @param {boolean} [options.textureSource=false] - Only used for children with textures e.g. Sprites.
   *  If options.children is set to true,
   * it should destroy the texture source of the child sprite.
   * @param {boolean} [options.context=false] - Only used for children with graphicsContexts e.g. Graphics.
   * If options.children is set to true,
   * it should destroy the context of the child graphics.
   */
  destroy(e = !1, t = !1) {
    const r = Ks._plugins.slice(0);
    r.reverse(), r.forEach((i) => {
      i.destroy.call(this);
    }), this.stage.destroy(t), this.stage = null, this.renderer.destroy(e), this.renderer = null;
  }
};
Ho._plugins = [];
let Wo = Ho;
z.handleByList(v.Application, Wo._plugins);
z.add(Lo);
class zo {
  /**
   * Initialize the plugin with scope of application instance
   * @static
   * @private
   * @param {object} [options] - See application options
   */
  static init(e) {
    Object.defineProperty(
      this,
      "resizeTo",
      /**
       * The HTML element or window to automatically resize the
       * renderer's view element to match width and height.
       * @member {Window|HTMLElement}
       * @name resizeTo
       * @memberof app.Application#
       */
      {
        set(t) {
          globalThis.removeEventListener("resize", this.queueResize), this._resizeTo = t, t && (globalThis.addEventListener("resize", this.queueResize), this.resize());
        },
        get() {
          return this._resizeTo;
        }
      }
    ), this.queueResize = () => {
      this._resizeTo && (this._cancelResize(), this._resizeId = requestAnimationFrame(() => this.resize()));
    }, this._cancelResize = () => {
      this._resizeId && (cancelAnimationFrame(this._resizeId), this._resizeId = null);
    }, this.resize = () => {
      if (!this._resizeTo)
        return;
      this._cancelResize();
      let t, r;
      if (this._resizeTo === globalThis.window)
        t = globalThis.innerWidth, r = globalThis.innerHeight;
      else {
        const { clientWidth: i, clientHeight: n } = this._resizeTo;
        t = i, r = n;
      }
      this.renderer.resize(t, r), this.render();
    }, this._resizeId = null, this._resizeTo = null, this.resizeTo = e.resizeTo || null;
  }
  /**
   * Clean up the ticker, scoped to application
   * @static
   * @private
   */
  static destroy() {
    globalThis.removeEventListener("resize", this.queueResize), this._cancelResize(), this._cancelResize = null, this.queueResize = null, this.resizeTo = null, this.resize = null;
  }
}
zo.extension = v.Application;
class Vo {
  /**
   * Initialize the plugin with scope of application instance
   * @static
   * @private
   * @param {object} [options] - See application options
   */
  static init(e) {
    e = Object.assign({
      autoStart: !0,
      sharedTicker: !1
    }, e), Object.defineProperty(
      this,
      "ticker",
      {
        set(t) {
          this._ticker && this._ticker.remove(this.render, this), this._ticker = t, t && t.add(this.render, this, Jt.LOW);
        },
        get() {
          return this._ticker;
        }
      }
    ), this.stop = () => {
      this._ticker.stop();
    }, this.start = () => {
      this._ticker.start();
    }, this._ticker = null, this.ticker = e.sharedTicker ? Xe.shared : new Xe(), e.autoStart && this.start();
  }
  /**
   * Clean up the ticker, scoped to application.
   * @static
   * @private
   */
  static destroy() {
    if (this._ticker) {
      const e = this._ticker;
      this.ticker = null, e.destroy();
    }
  }
}
Vo.extension = v.Application;
class $o extends Me {
  constructor() {
    super(...arguments), this.chars = /* @__PURE__ */ Object.create(null), this.lineHeight = 0, this.fontFamily = "", this.fontMetrics = { fontSize: 0, ascent: 0, descent: 0 }, this.baseLineOffset = 0, this.distanceField = { type: "none", range: 0 }, this.pages = [], this.applyFillAsTint = !0, this.baseMeasurementFontSize = 100, this.baseRenderedFontSize = 100;
  }
  /**
   * The name of the font face.
   * @deprecated since 8.0.0 Use `fontFamily` instead.
   */
  get font() {
    return X(Y, "BitmapFont.font is deprecated, please use BitmapFont.fontFamily instead."), this.fontFamily;
  }
  /**
   * The map of base page textures (i.e., sheets of glyphs).
   * @deprecated since 8.0.0 Use `pages` instead.
   */
  get pageTextures() {
    return X(Y, "BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead."), this.pages;
  }
  /**
   * The size of the font face in pixels.
   * @deprecated since 8.0.0 Use `fontMetrics.fontSize` instead.
   */
  get size() {
    return X(Y, "BitmapFont.size is deprecated, please use BitmapFont.fontMetrics.fontSize instead."), this.fontMetrics.fontSize;
  }
  /**
   * The kind of distance field for this font or "none".
   * @deprecated since 8.0.0 Use `distanceField.type` instead.
   */
  get distanceFieldRange() {
    return X(Y, "BitmapFont.distanceFieldRange is deprecated, please use BitmapFont.distanceField.range instead."), this.distanceField.range;
  }
  /**
   * The range of the distance field in pixels.
   * @deprecated since 8.0.0 Use `distanceField.range` instead.
   */
  get distanceFieldType() {
    return X(Y, "BitmapFont.distanceFieldType is deprecated, please use BitmapFont.distanceField.type instead."), this.distanceField.type;
  }
  destroy(e = !1) {
    var t;
    this.emit("destroy", this), this.removeAllListeners();
    for (const r in this.chars)
      (t = this.chars[r].texture) == null || t.destroy();
    this.chars = null, e && (this.pages.forEach((r) => r.texture.destroy(!0)), this.pages = null);
  }
}
const On = [{ offset: 0, color: "white" }, { offset: 1, color: "black" }], yi = class qs {
  constructor(...e) {
    this.uid = le("fillGradient"), this.type = "linear", this.colorStops = [];
    let t = Yu(e);
    t = { ...t.type === "radial" ? qs.defaultRadialOptions : qs.defaultLinearOptions, ...Ka(t) }, this._textureSize = t.textureSize, t.type === "radial" ? (this.center = t.center, this.outerCenter = t.outerCenter ?? this.center, this.innerRadius = t.innerRadius, this.outerRadius = t.outerRadius, this.scale = t.scale, this.rotation = t.rotation) : (this.start = t.start, this.end = t.end), this.textureSpace = t.textureSpace, this.type = t.type, t.colorStops.forEach((i) => {
      this.addColorStop(i.offset, i.color);
    });
  }
  /**
   * Adds a color stop to the gradient
   * @param offset - Position of the stop (0-1)
   * @param color - Color of the stop
   * @returns This gradient instance for chaining
   */
  addColorStop(e, t) {
    return this.colorStops.push({ offset: e, color: re.shared.setValue(t).toHexa() }), this;
  }
  /**
   * Builds the internal texture and transform for the gradient.
   * Called automatically when the gradient is first used.
   * @internal
   */
  buildLinearGradient() {
    if (this.texture)
      return;
    const e = this.colorStops.length ? this.colorStops : On, t = this._textureSize, { canvas: r, context: i } = Nn(t, 1), n = i.createLinearGradient(0, 0, this._textureSize, 0);
    Ln(n, e), i.fillStyle = n, i.fillRect(0, 0, t, 1), this.texture = new D({
      source: new xt({
        resource: r
      })
    });
    const { x: a, y: o } = this.start, { x: h, y: l } = this.end, c = new L(), u = h - a, d = l - o, f = Math.sqrt(u * u + d * d), p = Math.atan2(d, u);
    c.scale(f / t, 1), c.rotate(p), c.translate(a, o), this.textureSpace === "local" && c.scale(t, t), this.transform = c;
  }
  buildGradient() {
    this.type === "linear" ? this.buildLinearGradient() : this.buildRadialGradient();
  }
  buildRadialGradient() {
    if (this.texture)
      return;
    const e = this.colorStops.length ? this.colorStops : On, t = this._textureSize, { canvas: r, context: i } = Nn(t, t), { x: n, y: a } = this.center, { x: o, y: h } = this.outerCenter, l = this.innerRadius, c = this.outerRadius, u = o - c, d = h - c, f = t / (c * 2), p = (n - u) * f, g = (a - d) * f, m = i.createRadialGradient(
      p,
      g,
      l * f,
      (o - u) * f,
      (h - d) * f,
      c * f
    );
    Ln(m, e), i.fillStyle = e[e.length - 1].color, i.fillRect(0, 0, t, t), i.fillStyle = m, i.translate(p, g), i.rotate(this.rotation), i.scale(1, this.scale), i.translate(-p, -g), i.fillRect(0, 0, t, t), this.texture = new D({
      source: new xt({
        resource: r,
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge"
      })
    });
    const y = new L();
    y.scale(1 / f, 1 / f), y.translate(u, d), this.textureSpace === "local" && y.scale(t, t), this.transform = y;
  }
  /**
   * Gets a unique key representing the current state of the gradient.
   * Used internally for caching.
   * @returns Unique string key
   */
  get styleKey() {
    return this.uid;
  }
  destroy() {
    var e;
    (e = this.texture) == null || e.destroy(!0), this.texture = null;
  }
};
yi.defaultLinearOptions = {
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
  colorStops: [],
  textureSpace: "local",
  type: "linear",
  textureSize: 256
};
yi.defaultRadialOptions = {
  center: { x: 0.5, y: 0.5 },
  innerRadius: 0,
  outerRadius: 0.5,
  colorStops: [],
  scale: 1,
  textureSpace: "local",
  type: "radial",
  textureSize: 256
};
let ot = yi;
function Ln(s, e) {
  for (let t = 0; t < e.length; t++) {
    const r = e[t];
    s.addColorStop(r.offset, r.color);
  }
}
function Nn(s, e) {
  const t = Z.get().createCanvas(s, e), r = t.getContext("2d");
  return { canvas: t, context: r };
}
function Yu(s) {
  let e = s[0] ?? {};
  return (typeof e == "number" || s[1]) && (X("8.5.2", "use options object instead"), e = {
    type: "linear",
    start: { x: s[0], y: s[1] },
    end: { x: s[2], y: s[3] },
    textureSpace: s[4],
    textureSize: s[5] ?? ot.defaultLinearOptions.textureSize
  }), e;
}
const Hn = {
  repeat: {
    addressModeU: "repeat",
    addressModeV: "repeat"
  },
  "repeat-x": {
    addressModeU: "repeat",
    addressModeV: "clamp-to-edge"
  },
  "repeat-y": {
    addressModeU: "clamp-to-edge",
    addressModeV: "repeat"
  },
  "no-repeat": {
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge"
  }
};
class $r {
  constructor(e, t) {
    this.uid = le("fillPattern"), this.transform = new L(), this._styleKey = null, this.texture = e, this.transform.scale(
      1 / e.frame.width,
      1 / e.frame.height
    ), t && (e.source.style.addressModeU = Hn[t].addressModeU, e.source.style.addressModeV = Hn[t].addressModeV);
  }
  setTransform(e) {
    const t = this.texture;
    this.transform.copyFrom(e), this.transform.invert(), this.transform.scale(
      1 / t.frame.width,
      1 / t.frame.height
    ), this._styleKey = null;
  }
  get styleKey() {
    return this._styleKey ? this._styleKey : (this._styleKey = `fill-pattern-${this.uid}-${this.texture.uid}-${this.transform.toArray().join("-")}`, this._styleKey);
  }
}
var ys, Wn;
function Ku() {
  if (Wn) return ys;
  Wn = 1, ys = t;
  var s = { a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0 }, e = /([astvzqmhlc])([^astvzqmhlc]*)/ig;
  function t(n) {
    var a = [];
    return n.replace(e, function(o, h, l) {
      var c = h.toLowerCase();
      for (l = i(l), c == "m" && l.length > 2 && (a.push([h].concat(l.splice(0, 2))), c = "l", h = h == "m" ? "l" : "L"); ; ) {
        if (l.length == s[c])
          return l.unshift(h), a.push(l);
        if (l.length < s[c]) throw new Error("malformed path data");
        a.push([h].concat(l.splice(0, s[c])));
      }
    }), a;
  }
  var r = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/ig;
  function i(n) {
    var a = n.match(r);
    return a ? a.map(Number) : [];
  }
  return ys;
}
var qu = Ku();
const Zu = /* @__PURE__ */ ui(qu);
function Qu(s, e) {
  const t = Zu(s), r = [];
  let i = null, n = 0, a = 0;
  for (let o = 0; o < t.length; o++) {
    const h = t[o], l = h[0], c = h;
    switch (l) {
      case "M":
        n = c[1], a = c[2], e.moveTo(n, a);
        break;
      case "m":
        n += c[1], a += c[2], e.moveTo(n, a);
        break;
      case "H":
        n = c[1], e.lineTo(n, a);
        break;
      case "h":
        n += c[1], e.lineTo(n, a);
        break;
      case "V":
        a = c[1], e.lineTo(n, a);
        break;
      case "v":
        a += c[1], e.lineTo(n, a);
        break;
      case "L":
        n = c[1], a = c[2], e.lineTo(n, a);
        break;
      case "l":
        n += c[1], a += c[2], e.lineTo(n, a);
        break;
      case "C":
        n = c[5], a = c[6], e.bezierCurveTo(
          c[1],
          c[2],
          // First control point
          c[3],
          c[4],
          // Second control point
          n,
          a
          // End point
        );
        break;
      case "c":
        e.bezierCurveTo(
          n + c[1],
          a + c[2],
          // First control point
          n + c[3],
          a + c[4],
          // Second control point
          n + c[5],
          a + c[6]
          // End point
        ), n += c[5], a += c[6];
        break;
      case "S":
        n = c[3], a = c[4], e.bezierCurveToShort(
          c[1],
          c[2],
          // Control point
          n,
          a
          // End point
        );
        break;
      case "s":
        e.bezierCurveToShort(
          n + c[1],
          a + c[2],
          // Control point
          n + c[3],
          a + c[4]
          // End point
        ), n += c[3], a += c[4];
        break;
      case "Q":
        n = c[3], a = c[4], e.quadraticCurveTo(
          c[1],
          c[2],
          // Control point
          n,
          a
          // End point
        );
        break;
      case "q":
        e.quadraticCurveTo(
          n + c[1],
          a + c[2],
          // Control point
          n + c[3],
          a + c[4]
          // End point
        ), n += c[3], a += c[4];
        break;
      case "T":
        n = c[1], a = c[2], e.quadraticCurveToShort(
          n,
          a
          // End point
        );
        break;
      case "t":
        n += c[1], a += c[2], e.quadraticCurveToShort(
          n,
          a
          // End point
        );
        break;
      case "A":
        n = c[6], a = c[7], e.arcToSvg(
          c[1],
          // rx
          c[2],
          // ry
          c[3],
          // x-axis-rotation
          c[4],
          // large-arc-flag
          c[5],
          // sweep-flag
          n,
          a
          // End point
        );
        break;
      case "a":
        n += c[6], a += c[7], e.arcToSvg(
          c[1],
          // rx
          c[2],
          // ry
          c[3],
          // x-axis-rotation
          c[4],
          // large-arc-flag
          c[5],
          // sweep-flag
          n,
          a
          // End point
        );
        break;
      case "Z":
      case "z":
        e.closePath(), r.length > 0 && (i = r.pop(), i ? (n = i.startX, a = i.startY) : (n = 0, a = 0)), i = null;
        break;
      default:
        V(`Unknown SVG path command: ${l}`);
    }
    l !== "Z" && l !== "z" && i === null && (i = { startX: n, startY: a }, r.push(i));
  }
  return e;
}
class bi {
  /**
   * @param x - The X coordinate of the center of this circle
   * @param y - The Y coordinate of the center of this circle
   * @param radius - The radius of the circle
   */
  constructor(e = 0, t = 0, r = 0) {
    this.type = "circle", this.x = e, this.y = t, this.radius = r;
  }
  /**
   * Creates a clone of this Circle instance
   * @returns A copy of the Circle
   */
  clone() {
    return new bi(this.x, this.y, this.radius);
  }
  /**
   * Checks whether the x and y coordinates given are contained within this circle
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coordinates are within this Circle
   */
  contains(e, t) {
    if (this.radius <= 0)
      return !1;
    const r = this.radius * this.radius;
    let i = this.x - e, n = this.y - t;
    return i *= i, n *= n, i + n <= r;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this circle including the stroke.
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param width - The width of the line to check
   * @param alignment - The alignment of the stroke, 0.5 by default
   * @returns Whether the x/y coordinates are within this Circle
   */
  strokeContains(e, t, r, i = 0.5) {
    if (this.radius === 0)
      return !1;
    const n = this.x - e, a = this.y - t, o = this.radius, h = (1 - i) * r, l = Math.sqrt(n * n + a * a);
    return l <= o + h && l > o - (r - h);
  }
  /**
   * Returns the framing rectangle of the circle as a Rectangle object
   * @param out
   * @returns The framing rectangle
   */
  getBounds(e) {
    return e || (e = new ne()), e.x = this.x - this.radius, e.y = this.y - this.radius, e.width = this.radius * 2, e.height = this.radius * 2, e;
  }
  /**
   * Copies another circle to this one.
   * @param circle - The circle to copy from.
   * @returns Returns itself.
   */
  copyFrom(e) {
    return this.x = e.x, this.y = e.y, this.radius = e.radius, this;
  }
  /**
   * Copies this circle to another one.
   * @param circle - The circle to copy to.
   * @returns Returns given parameter.
   */
  copyTo(e) {
    return e.copyFrom(this), e;
  }
  toString() {
    return `[pixi.js/math:Circle x=${this.x} y=${this.y} radius=${this.radius}]`;
  }
}
class vi {
  /**
   * @param x - The X coordinate of the center of this ellipse
   * @param y - The Y coordinate of the center of this ellipse
   * @param halfWidth - The half width of this ellipse
   * @param halfHeight - The half height of this ellipse
   */
  constructor(e = 0, t = 0, r = 0, i = 0) {
    this.type = "ellipse", this.x = e, this.y = t, this.halfWidth = r, this.halfHeight = i;
  }
  /**
   * Creates a clone of this Ellipse instance
   * @returns {Ellipse} A copy of the ellipse
   */
  clone() {
    return new vi(this.x, this.y, this.halfWidth, this.halfHeight);
  }
  /**
   * Checks whether the x and y coordinates given are contained within this ellipse
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coords are within this ellipse
   */
  contains(e, t) {
    if (this.halfWidth <= 0 || this.halfHeight <= 0)
      return !1;
    let r = (e - this.x) / this.halfWidth, i = (t - this.y) / this.halfHeight;
    return r *= r, i *= i, r + i <= 1;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this ellipse including stroke
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke
   * @returns Whether the x/y coords are within this ellipse
   */
  strokeContains(e, t, r, i = 0.5) {
    const { halfWidth: n, halfHeight: a } = this;
    if (n <= 0 || a <= 0)
      return !1;
    const o = r * (1 - i), h = r - o, l = n - h, c = a - h, u = n + o, d = a + o, f = e - this.x, p = t - this.y, g = f * f / (l * l) + p * p / (c * c), m = f * f / (u * u) + p * p / (d * d);
    return g > 1 && m <= 1;
  }
  /**
   * Returns the framing rectangle of the ellipse as a Rectangle object
   * @param out
   * @returns The framing rectangle
   */
  getBounds(e) {
    return e || (e = new ne()), e.x = this.x - this.halfWidth, e.y = this.y - this.halfHeight, e.width = this.halfWidth * 2, e.height = this.halfHeight * 2, e;
  }
  /**
   * Copies another ellipse to this one.
   * @param ellipse - The ellipse to copy from.
   * @returns Returns itself.
   */
  copyFrom(e) {
    return this.x = e.x, this.y = e.y, this.halfWidth = e.halfWidth, this.halfHeight = e.halfHeight, this;
  }
  /**
   * Copies this ellipse to another one.
   * @param ellipse - The ellipse to copy to.
   * @returns Returns given parameter.
   */
  copyTo(e) {
    return e.copyFrom(this), e;
  }
  toString() {
    return `[pixi.js/math:Ellipse x=${this.x} y=${this.y} halfWidth=${this.halfWidth} halfHeight=${this.halfHeight}]`;
  }
}
function Ju(s, e, t, r, i, n) {
  const a = s - t, o = e - r, h = i - t, l = n - r, c = a * h + o * l, u = h * h + l * l;
  let d = -1;
  u !== 0 && (d = c / u);
  let f, p;
  d < 0 ? (f = t, p = r) : d > 1 ? (f = i, p = n) : (f = t + d * h, p = r + d * l);
  const g = s - f, m = e - p;
  return g * g + m * m;
}
let ed, td;
class Kt {
  /**
   * @param points - This can be an array of Points
   *  that form the polygon, a flat array of numbers that will be interpreted as [x,y, x,y, ...], or
   *  the arguments passed can be all the points of the polygon e.g.
   *  `new Polygon(new Point(), new Point(), ...)`, or the arguments passed can be flat
   *  x,y values e.g. `new Polygon(x,y, x,y, x,y, ...)` where `x` and `y` are Numbers.
   */
  constructor(...e) {
    this.type = "polygon";
    let t = Array.isArray(e[0]) ? e[0] : e;
    if (typeof t[0] != "number") {
      const r = [];
      for (let i = 0, n = t.length; i < n; i++)
        r.push(t[i].x, t[i].y);
      t = r;
    }
    this.points = t, this.closePath = !0;
  }
  /**
   * Determines whether the polygon's points are arranged in a clockwise direction.
   * This is calculated using the "shoelace formula" (also known as surveyor's formula) to find the signed area.
   * A positive area indicates clockwise winding, while negative indicates counter-clockwise.
   *
   * The formula sums up the cross products of adjacent vertices:
   * For each pair of adjacent points (x1,y1) and (x2,y2), we calculate (x1*y2 - x2*y1)
   * The final sum divided by 2 gives the signed area - positive for clockwise.
   * @returns `true` if the polygon's points are arranged clockwise, `false` if counter-clockwise
   */
  isClockwise() {
    let e = 0;
    const t = this.points, r = t.length;
    for (let i = 0; i < r; i += 2) {
      const n = t[i], a = t[i + 1], o = t[(i + 2) % r], h = t[(i + 3) % r];
      e += (o - n) * (h + a);
    }
    return e < 0;
  }
  /**
   * Checks if this polygon completely contains another polygon.
   *
   * This is useful for detecting holes in shapes, like when parsing SVG paths.
   * For example, if you have two polygons:
   * ```ts
   * const outerSquare = new Polygon([0,0, 100,0, 100,100, 0,100]); // A square
   * const innerSquare = new Polygon([25,25, 75,25, 75,75, 25,75]); // A smaller square inside
   *
   * outerSquare.containsPolygon(innerSquare); // Returns true
   * innerSquare.containsPolygon(outerSquare); // Returns false
   * ```
   * @param polygon - The polygon to test for containment
   * @returns True if this polygon completely contains the other polygon
   */
  containsPolygon(e) {
    const t = this.getBounds(ed), r = e.getBounds(td);
    if (!t.containsRect(r))
      return !1;
    const i = e.points;
    for (let n = 0; n < i.length; n += 2) {
      const a = i[n], o = i[n + 1];
      if (!this.contains(a, o))
        return !1;
    }
    return !0;
  }
  /**
   * Creates a clone of this polygon.
   * @returns - A copy of the polygon.
   */
  clone() {
    const e = this.points.slice(), t = new Kt(e);
    return t.closePath = this.closePath, t;
  }
  /**
   * Checks whether the x and y coordinates passed to this function are contained within this polygon.
   * @param x - The X coordinate of the point to test.
   * @param y - The Y coordinate of the point to test.
   * @returns - Whether the x/y coordinates are within this polygon.
   */
  contains(e, t) {
    let r = !1;
    const i = this.points.length / 2;
    for (let n = 0, a = i - 1; n < i; a = n++) {
      const o = this.points[n * 2], h = this.points[n * 2 + 1], l = this.points[a * 2], c = this.points[a * 2 + 1];
      h > t != c > t && e < (l - o) * ((t - h) / (c - h)) + o && (r = !r);
    }
    return r;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this polygon including the stroke.
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke, 0.5 by default
   * @returns Whether the x/y coordinates are within this polygon
   */
  strokeContains(e, t, r, i = 0.5) {
    const n = r * r, a = n * (1 - i), o = n - a, { points: h } = this, l = h.length - (this.closePath ? 0 : 2);
    for (let c = 0; c < l; c += 2) {
      const u = h[c], d = h[c + 1], f = h[(c + 2) % h.length], p = h[(c + 3) % h.length], g = Ju(e, t, u, d, f, p), m = Math.sign((f - u) * (t - d) - (p - d) * (e - u));
      if (g <= (m < 0 ? o : a))
        return !0;
    }
    return !1;
  }
  /**
   * Returns the framing rectangle of the polygon as a Rectangle object
   * @param out - optional rectangle to store the result
   * @returns The framing rectangle
   */
  getBounds(e) {
    e || (e = new ne());
    const t = this.points;
    let r = 1 / 0, i = -1 / 0, n = 1 / 0, a = -1 / 0;
    for (let o = 0, h = t.length; o < h; o += 2) {
      const l = t[o], c = t[o + 1];
      r = l < r ? l : r, i = l > i ? l : i, n = c < n ? c : n, a = c > a ? c : a;
    }
    return e.x = r, e.width = i - r, e.y = n, e.height = a - n, e;
  }
  /**
   * Copies another polygon to this one.
   * @param polygon - The polygon to copy from.
   * @returns Returns itself.
   */
  copyFrom(e) {
    return this.points = e.points.slice(), this.closePath = e.closePath, this;
  }
  /**
   * Copies this polygon to another one.
   * @param polygon - The polygon to copy to.
   * @returns Returns given parameter.
   */
  copyTo(e) {
    return e.copyFrom(this), e;
  }
  toString() {
    return `[pixi.js/math:PolygoncloseStroke=${this.closePath}points=${this.points.reduce((e, t) => `${e}, ${t}`, "")}]`;
  }
  /**
   * Get the last X coordinate of the polygon
   * @readonly
   */
  get lastX() {
    return this.points[this.points.length - 2];
  }
  /**
   * Get the last Y coordinate of the polygon
   * @readonly
   */
  get lastY() {
    return this.points[this.points.length - 1];
  }
  /**
   * Get the first X coordinate of the polygon
   * @readonly
   */
  get x() {
    return this.points[this.points.length - 2];
  }
  /**
   * Get the first Y coordinate of the polygon
   * @readonly
   */
  get y() {
    return this.points[this.points.length - 1];
  }
}
const br = (s, e, t, r, i, n, a) => {
  const o = s - t, h = e - r, l = Math.sqrt(o * o + h * h);
  return l >= i - n && l <= i + a;
};
class Ti {
  /**
   * @param x - The X coordinate of the upper-left corner of the rounded rectangle
   * @param y - The Y coordinate of the upper-left corner of the rounded rectangle
   * @param width - The overall width of this rounded rectangle
   * @param height - The overall height of this rounded rectangle
   * @param radius - Controls the radius of the rounded corners
   */
  constructor(e = 0, t = 0, r = 0, i = 0, n = 20) {
    this.type = "roundedRectangle", this.x = e, this.y = t, this.width = r, this.height = i, this.radius = n;
  }
  /**
   * Returns the framing rectangle of the rounded rectangle as a Rectangle object
   * @param out - optional rectangle to store the result
   * @returns The framing rectangle
   */
  getBounds(e) {
    return e || (e = new ne()), e.x = this.x, e.y = this.y, e.width = this.width, e.height = this.height, e;
  }
  /**
   * Creates a clone of this Rounded Rectangle.
   * @returns - A copy of the rounded rectangle.
   */
  clone() {
    return new Ti(this.x, this.y, this.width, this.height, this.radius);
  }
  /**
   * Copies another rectangle to this one.
   * @param rectangle - The rectangle to copy from.
   * @returns Returns itself.
   */
  copyFrom(e) {
    return this.x = e.x, this.y = e.y, this.width = e.width, this.height = e.height, this;
  }
  /**
   * Copies this rectangle to another one.
   * @param rectangle - The rectangle to copy to.
   * @returns Returns given parameter.
   */
  copyTo(e) {
    return e.copyFrom(this), e;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this Rounded Rectangle
   * @param x - The X coordinate of the point to test.
   * @param y - The Y coordinate of the point to test.
   * @returns - Whether the x/y coordinates are within this Rounded Rectangle.
   */
  contains(e, t) {
    if (this.width <= 0 || this.height <= 0)
      return !1;
    if (e >= this.x && e <= this.x + this.width && t >= this.y && t <= this.y + this.height) {
      const r = Math.max(0, Math.min(this.radius, Math.min(this.width, this.height) / 2));
      if (t >= this.y + r && t <= this.y + this.height - r || e >= this.x + r && e <= this.x + this.width - r)
        return !0;
      let i = e - (this.x + r), n = t - (this.y + r);
      const a = r * r;
      if (i * i + n * n <= a || (i = e - (this.x + this.width - r), i * i + n * n <= a) || (n = t - (this.y + this.height - r), i * i + n * n <= a) || (i = e - (this.x + r), i * i + n * n <= a))
        return !0;
    }
    return !1;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this rectangle including the stroke.
   * @param pX - The X coordinate of the point to test
   * @param pY - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke, 0.5 by default
   * @returns Whether the x/y coordinates are within this rectangle
   */
  strokeContains(e, t, r, i = 0.5) {
    const { x: n, y: a, width: o, height: h, radius: l } = this, c = r * (1 - i), u = r - c, d = n + l, f = a + l, p = o - l * 2, g = h - l * 2, m = n + o, y = a + h;
    return (e >= n - c && e <= n + u || e >= m - u && e <= m + c) && t >= f && t <= f + g || (t >= a - c && t <= a + u || t >= y - u && t <= y + c) && e >= d && e <= d + p ? !0 : (
      // Top-left
      e < d && t < f && br(
        e,
        t,
        d,
        f,
        l,
        u,
        c
      ) || e > m - l && t < f && br(
        e,
        t,
        m - l,
        f,
        l,
        u,
        c
      ) || e > m - l && t > y - l && br(
        e,
        t,
        m - l,
        y - l,
        l,
        u,
        c
      ) || e < d && t > y - l && br(
        e,
        t,
        d,
        y - l,
        l,
        u,
        c
      )
    );
  }
  toString() {
    return `[pixi.js/math:RoundedRectangle x=${this.x} y=${this.y}width=${this.width} height=${this.height} radius=${this.radius}]`;
  }
}
const rd = [
  "precision mediump float;",
  "void main(void){",
  "float test = 0.1;",
  "%forloop%",
  "gl_FragColor = vec4(0.0);",
  "}"
].join(`
`);
function sd(s) {
  let e = "";
  for (let t = 0; t < s; ++t)
    t > 0 && (e += `
else `), t < s - 1 && (e += `if(test == ${t}.0){}`);
  return e;
}
function id(s, e) {
  if (s === 0)
    throw new Error("Invalid value of `0` passed to `checkMaxIfStatementsInShader`");
  const t = e.createShader(e.FRAGMENT_SHADER);
  try {
    for (; ; ) {
      const r = rd.replace(/%forloop%/gi, sd(s));
      if (e.shaderSource(t, r), e.compileShader(t), !e.getShaderParameter(t, e.COMPILE_STATUS))
        s = s / 2 | 0;
      else
        break;
    }
  } finally {
    e.deleteShader(t);
  }
  return s;
}
let Tt = null;
function It() {
  var e;
  if (Tt)
    return Tt;
  const s = Co();
  return Tt = s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS), Tt = id(
    Tt,
    s
  ), (e = s.getExtension("WEBGL_lose_context")) == null || e.loseContext(), Tt;
}
const Xo = {};
function Si(s, e) {
  let t = 2166136261;
  for (let r = 0; r < e; r++)
    t ^= s[r].uid, t = Math.imul(t, 16777619), t >>>= 0;
  return Xo[t] || nd(s, e, t);
}
let bs = 0;
function nd(s, e, t) {
  const r = {};
  let i = 0;
  bs || (bs = It());
  for (let a = 0; a < bs; a++) {
    const o = a < e ? s[a] : D.EMPTY.source;
    r[i++] = o.source, r[i++] = o.style;
  }
  const n = new Je(r);
  return Xo[t] = n, n;
}
class At {
  constructor(e) {
    typeof e == "number" ? this.rawBinaryData = new ArrayBuffer(e) : e instanceof Uint8Array ? this.rawBinaryData = e.buffer : this.rawBinaryData = e, this.uint32View = new Uint32Array(this.rawBinaryData), this.float32View = new Float32Array(this.rawBinaryData), this.size = this.rawBinaryData.byteLength;
  }
  /** View on the raw binary data as a `Int8Array`. */
  get int8View() {
    return this._int8View || (this._int8View = new Int8Array(this.rawBinaryData)), this._int8View;
  }
  /** View on the raw binary data as a `Uint8Array`. */
  get uint8View() {
    return this._uint8View || (this._uint8View = new Uint8Array(this.rawBinaryData)), this._uint8View;
  }
  /**  View on the raw binary data as a `Int16Array`. */
  get int16View() {
    return this._int16View || (this._int16View = new Int16Array(this.rawBinaryData)), this._int16View;
  }
  /** View on the raw binary data as a `Int32Array`. */
  get int32View() {
    return this._int32View || (this._int32View = new Int32Array(this.rawBinaryData)), this._int32View;
  }
  /** View on the raw binary data as a `Float64Array`. */
  get float64View() {
    return this._float64Array || (this._float64Array = new Float64Array(this.rawBinaryData)), this._float64Array;
  }
  /** View on the raw binary data as a `BigUint64Array`. */
  get bigUint64View() {
    return this._bigUint64Array || (this._bigUint64Array = new BigUint64Array(this.rawBinaryData)), this._bigUint64Array;
  }
  /**
   * Returns the view of the given type.
   * @param type - One of `int8`, `uint8`, `int16`,
   *    `uint16`, `int32`, `uint32`, and `float32`.
   * @returns - typed array of given type
   */
  view(e) {
    return this[`${e}View`];
  }
  /** Destroys all buffer references. Do not use after calling this. */
  destroy() {
    this.rawBinaryData = null, this._int8View = null, this._uint8View = null, this._int16View = null, this.uint16View = null, this._int32View = null, this.uint32View = null, this.float32View = null;
  }
  /**
   * Returns the size of the given type in bytes.
   * @param type - One of `int8`, `uint8`, `int16`,
   *   `uint16`, `int32`, `uint32`, and `float32`.
   * @returns - size of the type in bytes
   */
  static sizeOf(e) {
    switch (e) {
      case "int8":
      case "uint8":
        return 1;
      case "int16":
      case "uint16":
        return 2;
      case "int32":
      case "uint32":
      case "float32":
        return 4;
      default:
        throw new Error(`${e} isn't a valid view type`);
    }
  }
}
function Zs(s, e) {
  const t = s.byteLength / 8 | 0, r = new Float64Array(s, 0, t);
  new Float64Array(e, 0, t).set(r);
  const n = s.byteLength - t * 8;
  if (n > 0) {
    const a = new Uint8Array(s, t * 8, n);
    new Uint8Array(e, t * 8, n).set(a);
  }
}
const ad = {
  normal: "normal-npm",
  add: "add-npm",
  screen: "screen-npm"
};
var fe = /* @__PURE__ */ ((s) => (s[s.DISABLED = 0] = "DISABLED", s[s.RENDERING_MASK_ADD = 1] = "RENDERING_MASK_ADD", s[s.MASK_ACTIVE = 2] = "MASK_ACTIVE", s[s.INVERSE_MASK_ACTIVE = 3] = "INVERSE_MASK_ACTIVE", s[s.RENDERING_MASK_REMOVE = 4] = "RENDERING_MASK_REMOVE", s[s.NONE = 5] = "NONE", s))(fe || {});
function tr(s, e) {
  return e.alphaMode === "no-premultiply-alpha" && ad[s] || s;
}
class od {
  constructor() {
    this.ids = /* @__PURE__ */ Object.create(null), this.textures = [], this.count = 0;
  }
  /** Clear the textures and their locations. */
  clear() {
    for (let e = 0; e < this.count; e++) {
      const t = this.textures[e];
      this.textures[e] = null, this.ids[t.uid] = null;
    }
    this.count = 0;
  }
}
class hd {
  constructor() {
    this.renderPipeId = "batch", this.action = "startBatch", this.start = 0, this.size = 0, this.textures = new od(), this.blendMode = "normal", this.topology = "triangle-strip", this.canBundle = !0;
  }
  destroy() {
    this.textures = null, this.gpuBindGroup = null, this.bindGroup = null, this.batcher = null;
  }
}
const jo = [];
let Qs = 0;
function zn() {
  return Qs > 0 ? jo[--Qs] : new hd();
}
function Vn(s) {
  jo[Qs++] = s;
}
let Lt = 0;
const Yo = class Br {
  constructor(e = {}) {
    this.uid = le("batcher"), this.dirty = !0, this.batchIndex = 0, this.batches = [], this._elements = [], Br.defaultOptions.maxTextures = Br.defaultOptions.maxTextures ?? It(), e = { ...Br.defaultOptions, ...e };
    const { maxTextures: t, attributesInitialSize: r, indicesInitialSize: i } = e;
    this.attributeBuffer = new At(r * 4), this.indexBuffer = new Uint16Array(i), this.maxTextures = t;
  }
  begin() {
    this.elementSize = 0, this.elementStart = 0, this.indexSize = 0, this.attributeSize = 0;
    for (let e = 0; e < this.batchIndex; e++)
      Vn(this.batches[e]);
    this.batchIndex = 0, this._batchIndexStart = 0, this._batchIndexSize = 0, this.dirty = !0;
  }
  add(e) {
    this._elements[this.elementSize++] = e, e._indexStart = this.indexSize, e._attributeStart = this.attributeSize, e._batcher = this, this.indexSize += e.indexSize, this.attributeSize += e.attributeSize * this.vertexSize;
  }
  checkAndUpdateTexture(e, t) {
    const r = e._batch.textures.ids[t._source.uid];
    return !r && r !== 0 ? !1 : (e._textureId = r, e.texture = t, !0);
  }
  updateElement(e) {
    this.dirty = !0;
    const t = this.attributeBuffer;
    e.packAsQuad ? this.packQuadAttributes(
      e,
      t.float32View,
      t.uint32View,
      e._attributeStart,
      e._textureId
    ) : this.packAttributes(
      e,
      t.float32View,
      t.uint32View,
      e._attributeStart,
      e._textureId
    );
  }
  /**
   * breaks the batcher. This happens when a batch gets too big,
   * or we need to switch to a different type of rendering (a filter for example)
   * @param instructionSet
   */
  break(e) {
    const t = this._elements;
    if (!t[this.elementStart])
      return;
    let r = zn(), i = r.textures;
    i.clear();
    const n = t[this.elementStart];
    let a = tr(n.blendMode, n.texture._source), o = n.topology;
    this.attributeSize * 4 > this.attributeBuffer.size && this._resizeAttributeBuffer(this.attributeSize * 4), this.indexSize > this.indexBuffer.length && this._resizeIndexBuffer(this.indexSize);
    const h = this.attributeBuffer.float32View, l = this.attributeBuffer.uint32View, c = this.indexBuffer;
    let u = this._batchIndexSize, d = this._batchIndexStart, f = "startBatch";
    const p = this.maxTextures;
    for (let g = this.elementStart; g < this.elementSize; ++g) {
      const m = t[g];
      t[g] = null;
      const T = m.texture._source, S = tr(m.blendMode, T), A = a !== S || o !== m.topology;
      if (T._batchTick === Lt && !A) {
        m._textureId = T._textureBindLocation, u += m.indexSize, m.packAsQuad ? (this.packQuadAttributes(
          m,
          h,
          l,
          m._attributeStart,
          m._textureId
        ), this.packQuadIndex(
          c,
          m._indexStart,
          m._attributeStart / this.vertexSize
        )) : (this.packAttributes(
          m,
          h,
          l,
          m._attributeStart,
          m._textureId
        ), this.packIndex(
          m,
          c,
          m._indexStart,
          m._attributeStart / this.vertexSize
        )), m._batch = r;
        continue;
      }
      T._batchTick = Lt, (i.count >= p || A) && (this._finishBatch(
        r,
        d,
        u - d,
        i,
        a,
        o,
        e,
        f
      ), f = "renderBatch", d = u, a = S, o = m.topology, r = zn(), i = r.textures, i.clear(), ++Lt), m._textureId = T._textureBindLocation = i.count, i.ids[T.uid] = i.count, i.textures[i.count++] = T, m._batch = r, u += m.indexSize, m.packAsQuad ? (this.packQuadAttributes(
        m,
        h,
        l,
        m._attributeStart,
        m._textureId
      ), this.packQuadIndex(
        c,
        m._indexStart,
        m._attributeStart / this.vertexSize
      )) : (this.packAttributes(
        m,
        h,
        l,
        m._attributeStart,
        m._textureId
      ), this.packIndex(
        m,
        c,
        m._indexStart,
        m._attributeStart / this.vertexSize
      ));
    }
    i.count > 0 && (this._finishBatch(
      r,
      d,
      u - d,
      i,
      a,
      o,
      e,
      f
    ), d = u, ++Lt), this.elementStart = this.elementSize, this._batchIndexStart = d, this._batchIndexSize = u;
  }
  _finishBatch(e, t, r, i, n, a, o, h) {
    e.gpuBindGroup = null, e.bindGroup = null, e.action = h, e.batcher = this, e.textures = i, e.blendMode = n, e.topology = a, e.start = t, e.size = r, ++Lt, this.batches[this.batchIndex++] = e, o.add(e);
  }
  finish(e) {
    this.break(e);
  }
  /**
   * Resizes the attribute buffer to the given size (1 = 1 float32)
   * @param size - the size in vertices to ensure (not bytes!)
   */
  ensureAttributeBuffer(e) {
    e * 4 <= this.attributeBuffer.size || this._resizeAttributeBuffer(e * 4);
  }
  /**
   * Resizes the index buffer to the given size (1 = 1 float32)
   * @param size - the size in vertices to ensure (not bytes!)
   */
  ensureIndexBuffer(e) {
    e <= this.indexBuffer.length || this._resizeIndexBuffer(e);
  }
  _resizeAttributeBuffer(e) {
    const t = Math.max(e, this.attributeBuffer.size * 2), r = new At(t);
    Zs(this.attributeBuffer.rawBinaryData, r.rawBinaryData), this.attributeBuffer = r;
  }
  _resizeIndexBuffer(e) {
    const t = this.indexBuffer;
    let r = Math.max(e, t.length * 1.5);
    r += r % 2;
    const i = r > 65535 ? new Uint32Array(r) : new Uint16Array(r);
    if (i.BYTES_PER_ELEMENT !== t.BYTES_PER_ELEMENT)
      for (let n = 0; n < t.length; n++)
        i[n] = t[n];
    else
      Zs(t.buffer, i.buffer);
    this.indexBuffer = i;
  }
  packQuadIndex(e, t, r) {
    e[t] = r + 0, e[t + 1] = r + 1, e[t + 2] = r + 2, e[t + 3] = r + 0, e[t + 4] = r + 2, e[t + 5] = r + 3;
  }
  packIndex(e, t, r, i) {
    const n = e.indices, a = e.indexSize, o = e.indexOffset, h = e.attributeOffset;
    for (let l = 0; l < a; l++)
      t[r++] = i + n[l + o] - h;
  }
  destroy() {
    for (let e = 0; e < this.batches.length; e++)
      Vn(this.batches[e]);
    this.batches = null;
    for (let e = 0; e < this._elements.length; e++)
      this._elements[e]._batch = null;
    this._elements = null, this.indexBuffer = null, this.attributeBuffer.destroy(), this.attributeBuffer = null;
  }
};
Yo.defaultOptions = {
  maxTextures: null,
  attributesInitialSize: 4,
  indicesInitialSize: 6
};
let ld = Yo;
var q = /* @__PURE__ */ ((s) => (s[s.MAP_READ = 1] = "MAP_READ", s[s.MAP_WRITE = 2] = "MAP_WRITE", s[s.COPY_SRC = 4] = "COPY_SRC", s[s.COPY_DST = 8] = "COPY_DST", s[s.INDEX = 16] = "INDEX", s[s.VERTEX = 32] = "VERTEX", s[s.UNIFORM = 64] = "UNIFORM", s[s.STORAGE = 128] = "STORAGE", s[s.INDIRECT = 256] = "INDIRECT", s[s.QUERY_RESOLVE = 512] = "QUERY_RESOLVE", s[s.STATIC = 1024] = "STATIC", s))(q || {});
class Ee extends Me {
  /**
   * Creates a new Buffer with the given options
   * @param options - the options for the buffer
   */
  constructor(e) {
    let { data: t, size: r } = e;
    const { usage: i, label: n, shrinkToFit: a } = e;
    super(), this.uid = le("buffer"), this._resourceType = "buffer", this._resourceId = le("resource"), this._touched = 0, this._updateID = 1, this._dataInt32 = null, this.shrinkToFit = !0, this.destroyed = !1, t instanceof Array && (t = new Float32Array(t)), this._data = t, r ?? (r = t == null ? void 0 : t.byteLength);
    const o = !!t;
    this.descriptor = {
      size: r,
      usage: i,
      mappedAtCreation: o,
      label: n
    }, this.shrinkToFit = a ?? !0;
  }
  /** the data in the buffer */
  get data() {
    return this._data;
  }
  set data(e) {
    this.setDataWithSize(e, e.length, !0);
  }
  get dataInt32() {
    return this._dataInt32 || (this._dataInt32 = new Int32Array(this.data.buffer)), this._dataInt32;
  }
  /** whether the buffer is static or not */
  get static() {
    return !!(this.descriptor.usage & q.STATIC);
  }
  set static(e) {
    e ? this.descriptor.usage |= q.STATIC : this.descriptor.usage &= ~q.STATIC;
  }
  /**
   * Sets the data in the buffer to the given value. This will immediately update the buffer on the GPU.
   * If you only want to update a subset of the buffer, you can pass in the size of the data.
   * @param value - the data to set
   * @param size - the size of the data in bytes
   * @param syncGPU - should the buffer be updated on the GPU immediately?
   */
  setDataWithSize(e, t, r) {
    if (this._updateID++, this._updateSize = t * e.BYTES_PER_ELEMENT, this._data === e) {
      r && this.emit("update", this);
      return;
    }
    const i = this._data;
    if (this._data = e, this._dataInt32 = null, !i || i.length !== e.length) {
      !this.shrinkToFit && i && e.byteLength < i.byteLength ? r && this.emit("update", this) : (this.descriptor.size = e.byteLength, this._resourceId = le("resource"), this.emit("change", this));
      return;
    }
    r && this.emit("update", this);
  }
  /**
   * updates the buffer on the GPU to reflect the data in the buffer.
   * By default it will update the entire buffer. If you only want to update a subset of the buffer,
   * you can pass in the size of the buffer to update.
   * @param sizeInBytes - the new size of the buffer in bytes
   */
  update(e) {
    this._updateSize = e ?? this._updateSize, this._updateID++, this.emit("update", this);
  }
  /** Destroys the buffer */
  destroy() {
    this.destroyed = !0, this.emit("destroy", this), this.emit("change", this), this._data = null, this.descriptor = null, this.removeAllListeners();
  }
}
function Ko(s, e) {
  if (!(s instanceof Ee)) {
    let t = e ? q.INDEX : q.VERTEX;
    s instanceof Array && (e ? (s = new Uint32Array(s), t = q.INDEX | q.COPY_DST) : (s = new Float32Array(s), t = q.VERTEX | q.COPY_DST)), s = new Ee({
      data: s,
      label: e ? "index-mesh-buffer" : "vertex-mesh-buffer",
      usage: t
    });
  }
  return s;
}
function cd(s, e, t) {
  const r = s.getAttribute(e);
  if (!r)
    return t.minX = 0, t.minY = 0, t.maxX = 0, t.maxY = 0, t;
  const i = r.buffer.data;
  let n = 1 / 0, a = 1 / 0, o = -1 / 0, h = -1 / 0;
  const l = i.BYTES_PER_ELEMENT, c = (r.offset || 0) / l, u = (r.stride || 8) / l;
  for (let d = c; d < i.length; d += u) {
    const f = i[d], p = i[d + 1];
    f > o && (o = f), p > h && (h = p), f < n && (n = f), p < a && (a = p);
  }
  return t.minX = n, t.minY = a, t.maxX = o, t.maxY = h, t;
}
function ud(s) {
  return (s instanceof Ee || Array.isArray(s) || s.BYTES_PER_ELEMENT) && (s = {
    buffer: s
  }), s.buffer = Ko(s.buffer, !1), s;
}
class Gt extends Me {
  /**
   * Create a new instance of a geometry
   * @param options - The options for the geometry.
   */
  constructor(e = {}) {
    super(), this.uid = le("geometry"), this._layoutKey = 0, this.instanceCount = 1, this._bounds = new ye(), this._boundsDirty = !0;
    const { attributes: t, indexBuffer: r, topology: i } = e;
    if (this.buffers = [], this.attributes = {}, t)
      for (const n in t)
        this.addAttribute(n, t[n]);
    this.instanceCount = e.instanceCount ?? 1, r && this.addIndex(r), this.topology = i || "triangle-list";
  }
  onBufferUpdate() {
    this._boundsDirty = !0, this.emit("update", this);
  }
  /**
   * Returns the requested attribute.
   * @param id - The name of the attribute required
   * @returns - The attribute requested.
   */
  getAttribute(e) {
    return this.attributes[e];
  }
  /**
   * Returns the index buffer
   * @returns - The index buffer.
   */
  getIndex() {
    return this.indexBuffer;
  }
  /**
   * Returns the requested buffer.
   * @param id - The name of the buffer required.
   * @returns - The buffer requested.
   */
  getBuffer(e) {
    return this.getAttribute(e).buffer;
  }
  /**
   * Used to figure out how many vertices there are in this geometry
   * @returns the number of vertices in the geometry
   */
  getSize() {
    for (const e in this.attributes) {
      const t = this.attributes[e];
      return t.buffer.data.length / (t.stride / 4 || t.size);
    }
    return 0;
  }
  /**
   * Adds an attribute to the geometry.
   * @param name - The name of the attribute to add.
   * @param attributeOption - The attribute option to add.
   */
  addAttribute(e, t) {
    const r = ud(t);
    this.buffers.indexOf(r.buffer) === -1 && (this.buffers.push(r.buffer), r.buffer.on("update", this.onBufferUpdate, this), r.buffer.on("change", this.onBufferUpdate, this)), this.attributes[e] = r;
  }
  /**
   * Adds an index buffer to the geometry.
   * @param indexBuffer - The index buffer to add. Can be a Buffer, TypedArray, or an array of numbers.
   */
  addIndex(e) {
    this.indexBuffer = Ko(e, !0), this.buffers.push(this.indexBuffer);
  }
  /** Returns the bounds of the geometry. */
  get bounds() {
    return this._boundsDirty ? (this._boundsDirty = !1, cd(this, "aPosition", this._bounds)) : this._bounds;
  }
  /**
   * destroys the geometry.
   * @param destroyBuffers - destroy the buffers associated with this geometry
   */
  destroy(e = !1) {
    this.emit("destroy", this), this.removeAllListeners(), e && this.buffers.forEach((t) => t.destroy()), this.attributes = null, this.buffers = null, this.indexBuffer = null, this._bounds = null;
  }
}
const dd = new Float32Array(1), fd = new Uint32Array(1);
class pd extends Gt {
  constructor() {
    const t = new Ee({
      data: dd,
      label: "attribute-batch-buffer",
      usage: q.VERTEX | q.COPY_DST,
      shrinkToFit: !1
    }), r = new Ee({
      data: fd,
      label: "index-batch-buffer",
      usage: q.INDEX | q.COPY_DST,
      // | BufferUsage.STATIC,
      shrinkToFit: !1
    }), i = 24;
    super({
      attributes: {
        aPosition: {
          buffer: t,
          format: "float32x2",
          stride: i,
          offset: 0
        },
        aUV: {
          buffer: t,
          format: "float32x2",
          stride: i,
          offset: 8
        },
        aColor: {
          buffer: t,
          format: "unorm8x4",
          stride: i,
          offset: 16
        },
        aTextureIdAndRound: {
          buffer: t,
          format: "uint16x2",
          stride: i,
          offset: 20
        }
      },
      indexBuffer: r
    });
  }
}
function $n(s, e, t) {
  if (s)
    for (const r in s) {
      const i = r.toLocaleLowerCase(), n = e[i];
      if (n) {
        let a = s[r];
        r === "header" && (a = a.replace(/@in\s+[^;]+;\s*/g, "").replace(/@out\s+[^;]+;\s*/g, "")), t && n.push(`//----${t}----//`), n.push(a);
      } else
        V(`${r} placement hook does not exist in shader`);
    }
}
const md = /\{\{(.*?)\}\}/g;
function Xn(s) {
  var r;
  const e = {};
  return (((r = s.match(md)) == null ? void 0 : r.map((i) => i.replace(/[{()}]/g, ""))) ?? []).forEach((i) => {
    e[i] = [];
  }), e;
}
function jn(s, e) {
  let t;
  const r = /@in\s+([^;]+);/g;
  for (; (t = r.exec(s)) !== null; )
    e.push(t[1]);
}
function Yn(s, e, t = !1) {
  const r = [];
  jn(e, r), s.forEach((o) => {
    o.header && jn(o.header, r);
  });
  const i = r;
  t && i.sort();
  const n = i.map((o, h) => `       @location(${h}) ${o},`).join(`
`);
  let a = e.replace(/@in\s+[^;]+;\s*/g, "");
  return a = a.replace("{{in}}", `
${n}
`), a;
}
function Kn(s, e) {
  let t;
  const r = /@out\s+([^;]+);/g;
  for (; (t = r.exec(s)) !== null; )
    e.push(t[1]);
}
function gd(s) {
  const t = /\b(\w+)\s*:/g.exec(s);
  return t ? t[1] : "";
}
function _d(s) {
  const e = /@.*?\s+/g;
  return s.replace(e, "");
}
function xd(s, e) {
  const t = [];
  Kn(e, t), s.forEach((h) => {
    h.header && Kn(h.header, t);
  });
  let r = 0;
  const i = t.sort().map((h) => h.indexOf("builtin") > -1 ? h : `@location(${r++}) ${h}`).join(`,
`), n = t.sort().map((h) => `       var ${_d(h)};`).join(`
`), a = `return VSOutput(
            ${t.sort().map((h) => ` ${gd(h)}`).join(`,
`)});`;
  let o = e.replace(/@out\s+[^;]+;\s*/g, "");
  return o = o.replace("{{struct}}", `
${i}
`), o = o.replace("{{start}}", `
${n}
`), o = o.replace("{{return}}", `
${a}
`), o;
}
function qn(s, e) {
  let t = s;
  for (const r in e) {
    const i = e[r];
    i.join(`
`).length ? t = t.replace(`{{${r}}}`, `//-----${r} START-----//
${i.join(`
`)}
//----${r} FINISH----//`) : t = t.replace(`{{${r}}}`, "");
  }
  return t;
}
const it = /* @__PURE__ */ Object.create(null), vs = /* @__PURE__ */ new Map();
let yd = 0;
function bd({
  template: s,
  bits: e
}) {
  const t = qo(s, e);
  if (it[t])
    return it[t];
  const { vertex: r, fragment: i } = Td(s, e);
  return it[t] = Zo(r, i, e), it[t];
}
function vd({
  template: s,
  bits: e
}) {
  const t = qo(s, e);
  return it[t] || (it[t] = Zo(s.vertex, s.fragment, e)), it[t];
}
function Td(s, e) {
  const t = e.map((a) => a.vertex).filter((a) => !!a), r = e.map((a) => a.fragment).filter((a) => !!a);
  let i = Yn(t, s.vertex, !0);
  i = xd(t, i);
  const n = Yn(r, s.fragment, !0);
  return {
    vertex: i,
    fragment: n
  };
}
function qo(s, e) {
  return e.map((t) => (vs.has(t) || vs.set(t, yd++), vs.get(t))).sort((t, r) => t - r).join("-") + s.vertex + s.fragment;
}
function Zo(s, e, t) {
  const r = Xn(s), i = Xn(e);
  return t.forEach((n) => {
    $n(n.vertex, r, n.name), $n(n.fragment, i, n.name);
  }), {
    vertex: qn(s, r),
    fragment: qn(e, i)
  };
}
const Sd = (
  /* wgsl */
  `
    @in aPosition: vec2<f32>;
    @in aUV: vec2<f32>;

    @out @builtin(position) vPosition: vec4<f32>;
    @out vUV : vec2<f32>;
    @out vColor : vec4<f32>;

    {{header}}

    struct VSOutput {
        {{struct}}
    };

    @vertex
    fn main( {{in}} ) -> VSOutput {

        var worldTransformMatrix = globalUniforms.uWorldTransformMatrix;
        var modelMatrix = mat3x3<f32>(
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0
          );
        var position = aPosition;
        var uv = aUV;

        {{start}}
        
        vColor = vec4<f32>(1., 1., 1., 1.);

        {{main}}

        vUV = uv;

        var modelViewProjectionMatrix = globalUniforms.uProjectionMatrix * worldTransformMatrix * modelMatrix;

        vPosition =  vec4<f32>((modelViewProjectionMatrix *  vec3<f32>(position, 1.0)).xy, 0.0, 1.0);
       
        vColor *= globalUniforms.uWorldColorAlpha;

        {{end}}

        {{return}}
    };
`
), wd = (
  /* wgsl */
  `
    @in vUV : vec2<f32>;
    @in vColor : vec4<f32>;
   
    {{header}}

    @fragment
    fn main(
        {{in}}
      ) -> @location(0) vec4<f32> {
        
        {{start}}

        var outColor:vec4<f32>;
      
        {{main}}
        
        var finalColor:vec4<f32> = outColor * vColor;

        {{end}}

        return finalColor;
      };
`
), Ad = (
  /* glsl */
  `
    in vec2 aPosition;
    in vec2 aUV;

    out vec4 vColor;
    out vec2 vUV;

    {{header}}

    void main(void){

        mat3 worldTransformMatrix = uWorldTransformMatrix;
        mat3 modelMatrix = mat3(
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0
          );
        vec2 position = aPosition;
        vec2 uv = aUV;
        
        {{start}}
        
        vColor = vec4(1.);
        
        {{main}}
        
        vUV = uv;
        
        mat3 modelViewProjectionMatrix = uProjectionMatrix * worldTransformMatrix * modelMatrix;

        gl_Position = vec4((modelViewProjectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);

        vColor *= uWorldColorAlpha;

        {{end}}
    }
`
), Pd = (
  /* glsl */
  `
   
    in vec4 vColor;
    in vec2 vUV;

    out vec4 finalColor;

    {{header}}

    void main(void) {
        
        {{start}}

        vec4 outColor;
      
        {{main}}
        
        finalColor = outColor * vColor;
        
        {{end}}
    }
`
), Cd = {
  name: "global-uniforms-bit",
  vertex: {
    header: (
      /* wgsl */
      `
        struct GlobalUniforms {
            uProjectionMatrix:mat3x3<f32>,
            uWorldTransformMatrix:mat3x3<f32>,
            uWorldColorAlpha: vec4<f32>,
            uResolution: vec2<f32>,
        }

        @group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
        `
    )
  }
}, Ed = {
  name: "global-uniforms-bit",
  vertex: {
    header: (
      /* glsl */
      `
          uniform mat3 uProjectionMatrix;
          uniform mat3 uWorldTransformMatrix;
          uniform vec4 uWorldColorAlpha;
          uniform vec2 uResolution;
        `
    )
  }
};
function ir({ bits: s, name: e }) {
  const t = bd({
    template: {
      fragment: wd,
      vertex: Sd
    },
    bits: [
      Cd,
      ...s
    ]
  });
  return lt.from({
    name: e,
    vertex: {
      source: t.vertex,
      entryPoint: "main"
    },
    fragment: {
      source: t.fragment,
      entryPoint: "main"
    }
  });
}
function nr({ bits: s, name: e }) {
  return new yt({
    name: e,
    ...vd({
      template: {
        vertex: Ad,
        fragment: Pd
      },
      bits: [
        Ed,
        ...s
      ]
    })
  });
}
const wi = {
  name: "color-bit",
  vertex: {
    header: (
      /* wgsl */
      `
            @in aColor: vec4<f32>;
        `
    ),
    main: (
      /* wgsl */
      `
            vColor *= vec4<f32>(aColor.rgb * aColor.a, aColor.a);
        `
    )
  }
}, Ai = {
  name: "color-bit",
  vertex: {
    header: (
      /* glsl */
      `
            in vec4 aColor;
        `
    ),
    main: (
      /* glsl */
      `
            vColor *= vec4(aColor.rgb * aColor.a, aColor.a);
        `
    )
  }
}, Ts = {};
function Md(s) {
  const e = [];
  if (s === 1)
    e.push("@group(1) @binding(0) var textureSource1: texture_2d<f32>;"), e.push("@group(1) @binding(1) var textureSampler1: sampler;");
  else {
    let t = 0;
    for (let r = 0; r < s; r++)
      e.push(`@group(1) @binding(${t++}) var textureSource${r + 1}: texture_2d<f32>;`), e.push(`@group(1) @binding(${t++}) var textureSampler${r + 1}: sampler;`);
  }
  return e.join(`
`);
}
function Bd(s) {
  const e = [];
  if (s === 1)
    e.push("outColor = textureSampleGrad(textureSource1, textureSampler1, vUV, uvDx, uvDy);");
  else {
    e.push("switch vTextureId {");
    for (let t = 0; t < s; t++)
      t === s - 1 ? e.push("  default:{") : e.push(`  case ${t}:{`), e.push(`      outColor = textureSampleGrad(textureSource${t + 1}, textureSampler${t + 1}, vUV, uvDx, uvDy);`), e.push("      break;}");
    e.push("}");
  }
  return e.join(`
`);
}
function Pi(s) {
  return Ts[s] || (Ts[s] = {
    name: "texture-batch-bit",
    vertex: {
      header: `
                @in aTextureIdAndRound: vec2<u32>;
                @out @interpolate(flat) vTextureId : u32;
            `,
      main: `
                vTextureId = aTextureIdAndRound.y;
            `,
      end: `
                if(aTextureIdAndRound.x == 1)
                {
                    vPosition = vec4<f32>(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
                }
            `
    },
    fragment: {
      header: `
                @in @interpolate(flat) vTextureId: u32;

                ${Md(s)}
            `,
      main: `
                var uvDx = dpdx(vUV);
                var uvDy = dpdy(vUV);

                ${Bd(s)}
            `
    }
  }), Ts[s];
}
const Ss = {};
function Rd(s) {
  const e = [];
  for (let t = 0; t < s; t++)
    t > 0 && e.push("else"), t < s - 1 && e.push(`if(vTextureId < ${t}.5)`), e.push("{"), e.push(`	outColor = texture(uTextures[${t}], vUV);`), e.push("}");
  return e.join(`
`);
}
function Ci(s) {
  return Ss[s] || (Ss[s] = {
    name: "texture-batch-bit",
    vertex: {
      header: `
                in vec2 aTextureIdAndRound;
                out float vTextureId;

            `,
      main: `
                vTextureId = aTextureIdAndRound.y;
            `,
      end: `
                if(aTextureIdAndRound.x == 1.)
                {
                    gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
                }
            `
    },
    fragment: {
      header: `
                in float vTextureId;

                uniform sampler2D uTextures[${s}];

            `,
      main: `

                ${Rd(s)}
            `
    }
  }), Ss[s];
}
const ar = {
  name: "round-pixels-bit",
  vertex: {
    header: (
      /* wgsl */
      `
            fn roundPixels(position: vec2<f32>, targetSize: vec2<f32>) -> vec2<f32> 
            {
                return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
            }
        `
    )
  }
}, or = {
  name: "round-pixels-bit",
  vertex: {
    header: (
      /* glsl */
      `   
            vec2 roundPixels(vec2 position, vec2 targetSize)
            {       
                return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
            }
        `
    )
  }
}, Zn = {};
function Ei(s) {
  let e = Zn[s];
  if (e)
    return e;
  const t = new Int32Array(s);
  for (let r = 0; r < s; r++)
    t[r] = r;
  return e = Zn[s] = new be({
    uTextures: { value: t, type: "i32", size: s }
  }, { isStatic: !0 }), e;
}
class kd extends Ie {
  constructor(e) {
    const t = nr({
      name: "batch",
      bits: [
        Ai,
        Ci(e),
        or
      ]
    }), r = ir({
      name: "batch",
      bits: [
        wi,
        Pi(e),
        ar
      ]
    });
    super({
      glProgram: t,
      gpuProgram: r,
      resources: {
        batchSamplers: Ei(e)
      }
    });
  }
}
let Qn = null;
const Qo = class Jo extends ld {
  constructor() {
    super(...arguments), this.geometry = new pd(), this.shader = Qn || (Qn = new kd(this.maxTextures)), this.name = Jo.extension.name, this.vertexSize = 6;
  }
  /**
   * Packs the attributes of a DefaultBatchableMeshElement into the provided views.
   * @param element - The DefaultBatchableMeshElement to pack.
   * @param float32View - The Float32Array view to pack into.
   * @param uint32View - The Uint32Array view to pack into.
   * @param index - The starting index in the views.
   * @param textureId - The texture ID to use.
   */
  packAttributes(e, t, r, i, n) {
    const a = n << 16 | e.roundPixels & 65535, o = e.transform, h = o.a, l = o.b, c = o.c, u = o.d, d = o.tx, f = o.ty, { positions: p, uvs: g } = e, m = e.color, y = e.attributeOffset, T = y + e.attributeSize;
    for (let S = y; S < T; S++) {
      const A = S * 2, M = p[A], P = p[A + 1];
      t[i++] = h * M + c * P + d, t[i++] = u * P + l * M + f, t[i++] = g[A], t[i++] = g[A + 1], r[i++] = m, r[i++] = a;
    }
  }
  /**
   * Packs the attributes of a DefaultBatchableQuadElement into the provided views.
   * @param element - The DefaultBatchableQuadElement to pack.
   * @param float32View - The Float32Array view to pack into.
   * @param uint32View - The Uint32Array view to pack into.
   * @param index - The starting index in the views.
   * @param textureId - The texture ID to use.
   */
  packQuadAttributes(e, t, r, i, n) {
    const a = e.texture, o = e.transform, h = o.a, l = o.b, c = o.c, u = o.d, d = o.tx, f = o.ty, p = e.bounds, g = p.maxX, m = p.minX, y = p.maxY, T = p.minY, S = a.uvs, A = e.color, M = n << 16 | e.roundPixels & 65535;
    t[i + 0] = h * m + c * T + d, t[i + 1] = u * T + l * m + f, t[i + 2] = S.x0, t[i + 3] = S.y0, r[i + 4] = A, r[i + 5] = M, t[i + 6] = h * g + c * T + d, t[i + 7] = u * T + l * g + f, t[i + 8] = S.x1, t[i + 9] = S.y1, r[i + 10] = A, r[i + 11] = M, t[i + 12] = h * g + c * y + d, t[i + 13] = u * y + l * g + f, t[i + 14] = S.x2, t[i + 15] = S.y2, r[i + 16] = A, r[i + 17] = M, t[i + 18] = h * m + c * y + d, t[i + 19] = u * y + l * m + f, t[i + 20] = S.x3, t[i + 21] = S.y3, r[i + 22] = A, r[i + 23] = M;
  }
};
Qo.extension = {
  type: [
    v.Batcher
  ],
  name: "default"
};
let Mi = Qo;
function Id(s, e, t, r, i, n, a, o = null) {
  let h = 0;
  t *= e, i *= n;
  const l = o.a, c = o.b, u = o.c, d = o.d, f = o.tx, p = o.ty;
  for (; h < a; ) {
    const g = s[t], m = s[t + 1];
    r[i] = l * g + u * m + f, r[i + 1] = c * g + d * m + p, i += n, t += e, h++;
  }
}
function Gd(s, e, t, r) {
  let i = 0;
  for (e *= t; i < r; )
    s[e] = 0, s[e + 1] = 0, e += t, i++;
}
function eh(s, e, t, r, i) {
  const n = e.a, a = e.b, o = e.c, h = e.d, l = e.tx, c = e.ty;
  t || (t = 0), r || (r = 2), i || (i = s.length / r - t);
  let u = t * r;
  for (let d = 0; d < i; d++) {
    const f = s[u], p = s[u + 1];
    s[u] = n * f + o * p + l, s[u + 1] = a * f + h * p + c, u += r;
  }
}
const Ud = new L();
class Bi {
  constructor() {
    this.packAsQuad = !1, this.batcherName = "default", this.topology = "triangle-list", this.applyTransform = !0, this.roundPixels = 0, this._batcher = null, this._batch = null;
  }
  get uvs() {
    return this.geometryData.uvs;
  }
  get positions() {
    return this.geometryData.vertices;
  }
  get indices() {
    return this.geometryData.indices;
  }
  get blendMode() {
    return this.applyTransform ? this.renderable.groupBlendMode : "normal";
  }
  get color() {
    const e = this.baseColor, t = e >> 16 | e & 65280 | (e & 255) << 16, r = this.renderable;
    return r ? ho(t, r.groupColor) + (this.alpha * r.groupAlpha * 255 << 24) : t + (this.alpha * 255 << 24);
  }
  get transform() {
    var e;
    return ((e = this.renderable) == null ? void 0 : e.groupTransform) || Ud;
  }
  copyTo(e) {
    e.indexOffset = this.indexOffset, e.indexSize = this.indexSize, e.attributeOffset = this.attributeOffset, e.attributeSize = this.attributeSize, e.baseColor = this.baseColor, e.alpha = this.alpha, e.texture = this.texture, e.geometryData = this.geometryData, e.topology = this.topology;
  }
  reset() {
    this.applyTransform = !0, this.renderable = null, this.topology = "triangle-list";
  }
}
const rr = {
  extension: {
    type: v.ShapeBuilder,
    name: "circle"
  },
  build(s, e) {
    let t, r, i, n, a, o;
    if (s.type === "circle") {
      const A = s;
      t = A.x, r = A.y, a = o = A.radius, i = n = 0;
    } else if (s.type === "ellipse") {
      const A = s;
      t = A.x, r = A.y, a = A.halfWidth, o = A.halfHeight, i = n = 0;
    } else {
      const A = s, M = A.width / 2, P = A.height / 2;
      t = A.x + M, r = A.y + P, a = o = Math.max(0, Math.min(A.radius, Math.min(M, P))), i = M - a, n = P - o;
    }
    if (!(a >= 0 && o >= 0 && i >= 0 && n >= 0))
      return e;
    const h = Math.ceil(2.3 * Math.sqrt(a + o)), l = h * 8 + (i ? 4 : 0) + (n ? 4 : 0);
    if (l === 0)
      return e;
    if (h === 0)
      return e[0] = e[6] = t + i, e[1] = e[3] = r + n, e[2] = e[4] = t - i, e[5] = e[7] = r - n, e;
    let c = 0, u = h * 4 + (i ? 2 : 0) + 2, d = u, f = l, p = i + a, g = n, m = t + p, y = t - p, T = r + g;
    if (e[c++] = m, e[c++] = T, e[--u] = T, e[--u] = y, n) {
      const A = r - g;
      e[d++] = y, e[d++] = A, e[--f] = A, e[--f] = m;
    }
    for (let A = 1; A < h; A++) {
      const M = Math.PI / 2 * (A / h), P = i + Math.cos(M) * a, E = n + Math.sin(M) * o, N = t + P, I = t - P, k = r + E, G = r - E;
      e[c++] = N, e[c++] = k, e[--u] = k, e[--u] = I, e[d++] = I, e[d++] = G, e[--f] = G, e[--f] = N;
    }
    p = i, g = n + o, m = t + p, y = t - p, T = r + g;
    const S = r - g;
    return e[c++] = m, e[c++] = T, e[--f] = S, e[--f] = m, i && (e[c++] = y, e[c++] = T, e[--f] = S, e[--f] = y), e;
  },
  triangulate(s, e, t, r, i, n) {
    if (s.length === 0)
      return;
    let a = 0, o = 0;
    for (let c = 0; c < s.length; c += 2)
      a += s[c], o += s[c + 1];
    a /= s.length / 2, o /= s.length / 2;
    let h = r;
    e[h * t] = a, e[h * t + 1] = o;
    const l = h++;
    for (let c = 0; c < s.length; c += 2)
      e[h * t] = s[c], e[h * t + 1] = s[c + 1], c > 0 && (i[n++] = h, i[n++] = l, i[n++] = h - 1), h++;
    i[n++] = l + 1, i[n++] = l, i[n++] = h - 1;
  }
}, Fd = { ...rr, extension: { ...rr.extension, name: "ellipse" } }, Dd = { ...rr, extension: { ...rr.extension, name: "roundedRectangle" } }, th = 1e-4, Jn = 1e-4;
function Od(s) {
  const e = s.length;
  if (e < 6)
    return 1;
  let t = 0;
  for (let r = 0, i = s[e - 2], n = s[e - 1]; r < e; r += 2) {
    const a = s[r], o = s[r + 1];
    t += (a - i) * (o + n), i = a, n = o;
  }
  return t < 0 ? -1 : 1;
}
function ea(s, e, t, r, i, n, a, o) {
  const h = s - t * i, l = e - r * i, c = s + t * n, u = e + r * n;
  let d, f;
  a ? (d = r, f = -t) : (d = -r, f = t);
  const p = h + d, g = l + f, m = c + d, y = u + f;
  return o.push(p, g), o.push(m, y), 2;
}
function ut(s, e, t, r, i, n, a, o) {
  const h = t - s, l = r - e;
  let c = Math.atan2(h, l), u = Math.atan2(i - s, n - e);
  o && c < u ? c += Math.PI * 2 : !o && c > u && (u += Math.PI * 2);
  let d = c;
  const f = u - c, p = Math.abs(f), g = Math.sqrt(h * h + l * l), m = (15 * p * Math.sqrt(g) / Math.PI >> 0) + 1, y = f / m;
  if (d += y, o) {
    a.push(s, e), a.push(t, r);
    for (let T = 1, S = d; T < m; T++, S += y)
      a.push(s, e), a.push(
        s + Math.sin(S) * g,
        e + Math.cos(S) * g
      );
    a.push(s, e), a.push(i, n);
  } else {
    a.push(t, r), a.push(s, e);
    for (let T = 1, S = d; T < m; T++, S += y)
      a.push(
        s + Math.sin(S) * g,
        e + Math.cos(S) * g
      ), a.push(s, e);
    a.push(i, n), a.push(s, e);
  }
  return m * 2;
}
function Ld(s, e, t, r, i, n) {
  const a = th;
  if (s.length === 0)
    return;
  const o = e;
  let h = o.alignment;
  if (e.alignment !== 0.5) {
    let w = Od(s);
    h = (h - 0.5) * w + 0.5;
  }
  const l = new oe(s[0], s[1]), c = new oe(s[s.length - 2], s[s.length - 1]), u = r, d = Math.abs(l.x - c.x) < a && Math.abs(l.y - c.y) < a;
  if (u) {
    s = s.slice(), d && (s.pop(), s.pop(), c.set(s[s.length - 2], s[s.length - 1]));
    const w = (l.x + c.x) * 0.5, C = (c.y + l.y) * 0.5;
    s.unshift(w, C), s.push(w, C);
  }
  const f = i, p = s.length / 2;
  let g = s.length;
  const m = f.length / 2, y = o.width / 2, T = y * y, S = o.miterLimit * o.miterLimit;
  let A = s[0], M = s[1], P = s[2], E = s[3], N = 0, I = 0, k = -(M - E), G = A - P, F = 0, $ = 0, ae = Math.sqrt(k * k + G * G);
  k /= ae, G /= ae, k *= y, G *= y;
  const ge = h, _ = (1 - ge) * 2, x = ge * 2;
  u || (o.cap === "round" ? g += ut(
    A - k * (_ - x) * 0.5,
    M - G * (_ - x) * 0.5,
    A - k * _,
    M - G * _,
    A + k * x,
    M + G * x,
    f,
    !0
  ) + 2 : o.cap === "square" && (g += ea(A, M, k, G, _, x, !0, f))), f.push(
    A - k * _,
    M - G * _
  ), f.push(
    A + k * x,
    M + G * x
  );
  for (let w = 1; w < p - 1; ++w) {
    A = s[(w - 1) * 2], M = s[(w - 1) * 2 + 1], P = s[w * 2], E = s[w * 2 + 1], N = s[(w + 1) * 2], I = s[(w + 1) * 2 + 1], k = -(M - E), G = A - P, ae = Math.sqrt(k * k + G * G), k /= ae, G /= ae, k *= y, G *= y, F = -(E - I), $ = P - N, ae = Math.sqrt(F * F + $ * $), F /= ae, $ /= ae, F *= y, $ *= y;
    const C = P - A, B = M - E, R = P - N, U = I - E, W = C * R + B * U, H = B * R - U * C, se = H < 0;
    if (Math.abs(H) < 1e-3 * Math.abs(W)) {
      f.push(
        P - k * _,
        E - G * _
      ), f.push(
        P + k * x,
        E + G * x
      ), W >= 0 && (o.join === "round" ? g += ut(
        P,
        E,
        P - k * _,
        E - G * _,
        P - F * _,
        E - $ * _,
        f,
        !1
      ) + 4 : g += 2, f.push(
        P - F * x,
        E - $ * x
      ), f.push(
        P + F * _,
        E + $ * _
      ));
      continue;
    }
    const ie = (-k + A) * (-G + E) - (-k + P) * (-G + M), Q = (-F + N) * (-$ + E) - (-F + P) * (-$ + I), de = (C * Q - R * ie) / H, te = (U * ie - B * Q) / H, je = (de - P) * (de - P) + (te - E) * (te - E), we = P + (de - P) * _, Ne = E + (te - E) * _, He = P - (de - P) * x, j = E - (te - E) * x, J = Math.min(C * C + B * B, R * R + U * U), tn = se ? _ : x, dc = J + tn * tn * T;
    je <= dc ? o.join === "bevel" || je / T > S ? (se ? (f.push(we, Ne), f.push(P + k * x, E + G * x), f.push(we, Ne), f.push(P + F * x, E + $ * x)) : (f.push(P - k * _, E - G * _), f.push(He, j), f.push(P - F * _, E - $ * _), f.push(He, j)), g += 2) : o.join === "round" ? se ? (f.push(we, Ne), f.push(P + k * x, E + G * x), g += ut(
      P,
      E,
      P + k * x,
      E + G * x,
      P + F * x,
      E + $ * x,
      f,
      !0
    ) + 4, f.push(we, Ne), f.push(P + F * x, E + $ * x)) : (f.push(P - k * _, E - G * _), f.push(He, j), g += ut(
      P,
      E,
      P - k * _,
      E - G * _,
      P - F * _,
      E - $ * _,
      f,
      !1
    ) + 4, f.push(P - F * _, E - $ * _), f.push(He, j)) : (f.push(we, Ne), f.push(He, j)) : (f.push(P - k * _, E - G * _), f.push(P + k * x, E + G * x), o.join === "round" ? se ? g += ut(
      P,
      E,
      P + k * x,
      E + G * x,
      P + F * x,
      E + $ * x,
      f,
      !0
    ) + 2 : g += ut(
      P,
      E,
      P - k * _,
      E - G * _,
      P - F * _,
      E - $ * _,
      f,
      !1
    ) + 2 : o.join === "miter" && je / T <= S && (se ? (f.push(He, j), f.push(He, j)) : (f.push(we, Ne), f.push(we, Ne)), g += 2), f.push(P - F * _, E - $ * _), f.push(P + F * x, E + $ * x), g += 2);
  }
  A = s[(p - 2) * 2], M = s[(p - 2) * 2 + 1], P = s[(p - 1) * 2], E = s[(p - 1) * 2 + 1], k = -(M - E), G = A - P, ae = Math.sqrt(k * k + G * G), k /= ae, G /= ae, k *= y, G *= y, f.push(P - k * _, E - G * _), f.push(P + k * x, E + G * x), u || (o.cap === "round" ? g += ut(
    P - k * (_ - x) * 0.5,
    E - G * (_ - x) * 0.5,
    P - k * _,
    E - G * _,
    P + k * x,
    E + G * x,
    f,
    !1
  ) + 2 : o.cap === "square" && (g += ea(P, E, k, G, _, x, !1, f)));
  const b = Jn * Jn;
  for (let w = m; w < g + m - 2; ++w)
    A = f[w * 2], M = f[w * 2 + 1], P = f[(w + 1) * 2], E = f[(w + 1) * 2 + 1], N = f[(w + 2) * 2], I = f[(w + 2) * 2 + 1], !(Math.abs(A * (E - I) + P * (I - M) + N * (M - E)) < b) && n.push(w, w + 1, w + 2);
}
function Nd(s, e, t, r) {
  const i = th;
  if (s.length === 0)
    return;
  const n = s[0], a = s[1], o = s[s.length - 2], h = s[s.length - 1], l = e || Math.abs(n - o) < i && Math.abs(a - h) < i, c = t, u = s.length / 2, d = c.length / 2;
  for (let f = 0; f < u; f++)
    c.push(s[f * 2]), c.push(s[f * 2 + 1]);
  for (let f = 0; f < u - 1; f++)
    r.push(d + f, d + f + 1);
  l && r.push(d + u - 1, d);
}
function rh(s, e, t, r, i, n, a) {
  const o = zu(s, e, 2);
  if (!o)
    return;
  for (let l = 0; l < o.length; l += 3)
    n[a++] = o[l] + i, n[a++] = o[l + 1] + i, n[a++] = o[l + 2] + i;
  let h = i * r;
  for (let l = 0; l < s.length; l += 2)
    t[h] = s[l], t[h + 1] = s[l + 1], h += r;
}
const Hd = [], Wd = {
  extension: {
    type: v.ShapeBuilder,
    name: "polygon"
  },
  build(s, e) {
    for (let t = 0; t < s.points.length; t++)
      e[t] = s.points[t];
    return e;
  },
  triangulate(s, e, t, r, i, n) {
    rh(s, Hd, e, t, r, i, n);
  }
}, zd = {
  extension: {
    type: v.ShapeBuilder,
    name: "rectangle"
  },
  build(s, e) {
    const t = s, r = t.x, i = t.y, n = t.width, a = t.height;
    return n >= 0 && a >= 0 && (e[0] = r, e[1] = i, e[2] = r + n, e[3] = i, e[4] = r + n, e[5] = i + a, e[6] = r, e[7] = i + a), e;
  },
  triangulate(s, e, t, r, i, n) {
    let a = 0;
    r *= t, e[r + a] = s[0], e[r + a + 1] = s[1], a += t, e[r + a] = s[2], e[r + a + 1] = s[3], a += t, e[r + a] = s[6], e[r + a + 1] = s[7], a += t, e[r + a] = s[4], e[r + a + 1] = s[5], a += t;
    const o = r / t;
    i[n++] = o, i[n++] = o + 1, i[n++] = o + 2, i[n++] = o + 1, i[n++] = o + 3, i[n++] = o + 2;
  }
}, Vd = {
  extension: {
    type: v.ShapeBuilder,
    name: "triangle"
  },
  build(s, e) {
    return e[0] = s.x, e[1] = s.y, e[2] = s.x2, e[3] = s.y2, e[4] = s.x3, e[5] = s.y3, e;
  },
  triangulate(s, e, t, r, i, n) {
    let a = 0;
    r *= t, e[r + a] = s[0], e[r + a + 1] = s[1], a += t, e[r + a] = s[2], e[r + a + 1] = s[3], a += t, e[r + a] = s[4], e[r + a + 1] = s[5];
    const o = r / t;
    i[n++] = o, i[n++] = o + 1, i[n++] = o + 2;
  }
}, $d = new L(), Xd = new ne();
function jd(s, e, t, r) {
  const i = e.matrix ? s.copyFrom(e.matrix).invert() : s.identity();
  if (e.textureSpace === "local") {
    const n = t.getBounds(Xd);
    i.translate(-n.x, -n.y), i.scale(1 / n.width, 1 / n.height);
  } else {
    i.translate(e.texture.frame.x, e.texture.frame.y), i.scale(1 / e.texture.source.width, 1 / e.texture.source.height);
    const n = e.texture.source.style;
    n.addressMode === "clamp-to-edge" && (n.addressMode = "repeat", n.update());
  }
  return r && i.append($d.copyFrom(r).invert()), i;
}
const Xr = {};
z.handleByMap(v.ShapeBuilder, Xr);
z.add(zd, Wd, Vd, rr, Fd, Dd);
const Yd = new ne(), Kd = new L();
function qd(s, e) {
  const { geometryData: t, batches: r } = e;
  r.length = 0, t.indices.length = 0, t.vertices.length = 0, t.uvs.length = 0;
  for (let i = 0; i < s.instructions.length; i++) {
    const n = s.instructions[i];
    if (n.action === "texture")
      Zd(n.data, r, t);
    else if (n.action === "fill" || n.action === "stroke") {
      const a = n.action === "stroke", o = n.data.path.shapePath, h = n.data.style, l = n.data.hole;
      a && l && ta(l.shapePath, h, !0, r, t), l && (o.shapePrimitives[o.shapePrimitives.length - 1].holes = l.shapePath.shapePrimitives), ta(o, h, a, r, t);
    }
  }
}
function Zd(s, e, t) {
  const { vertices: r, uvs: i, indices: n } = t, a = n.length, o = r.length / 2, h = [], l = Xr.rectangle, c = Yd, u = s.image;
  c.x = s.dx, c.y = s.dy, c.width = s.dw, c.height = s.dh;
  const d = s.transform;
  l.build(c, h), d && eh(h, d), l.triangulate(h, r, 2, o, n, a);
  const f = u.uvs;
  i.push(
    f.x0,
    f.y0,
    f.x1,
    f.y1,
    f.x3,
    f.y3,
    f.x2,
    f.y2
  );
  const p = K.get(Bi);
  p.indexOffset = a, p.indexSize = n.length - a, p.attributeOffset = o, p.attributeSize = r.length / 2 - o, p.baseColor = s.style, p.alpha = s.alpha, p.texture = u, p.geometryData = t, e.push(p);
}
function ta(s, e, t, r, i) {
  const { vertices: n, uvs: a, indices: o } = i;
  s.shapePrimitives.forEach(({ shape: h, transform: l, holes: c }) => {
    const u = o.length, d = n.length / 2, f = [], p = Xr[h.type];
    let g = "triangle-list";
    if (p.build(h, f), l && eh(f, l), t) {
      const S = h.closePath ?? !0, A = e;
      A.pixelLine ? (Nd(f, S, n, o), g = "line-list") : Ld(f, A, !1, S, n, o);
    } else if (c) {
      const S = [], A = f.slice();
      Qd(c).forEach((P) => {
        S.push(A.length / 2), A.push(...P);
      }), rh(A, S, n, 2, d, o, u);
    } else
      p.triangulate(f, n, 2, d, o, u);
    const m = a.length / 2, y = e.texture;
    if (y !== D.WHITE) {
      const S = jd(Kd, e, h, l);
      Id(n, 2, d, a, m, 2, n.length / 2 - d, S);
    } else
      Gd(a, m, 2, n.length / 2 - d);
    const T = K.get(Bi);
    T.indexOffset = u, T.indexSize = o.length - u, T.attributeOffset = d, T.attributeSize = n.length / 2 - d, T.baseColor = e.color, T.alpha = e.alpha, T.texture = y, T.geometryData = i, T.topology = g, r.push(T);
  });
}
function Qd(s) {
  const e = [];
  for (let t = 0; t < s.length; t++) {
    const r = s[t].shape, i = [];
    Xr[r.type].build(r, i), e.push(i);
  }
  return e;
}
class Jd {
  constructor() {
    this.batches = [], this.geometryData = {
      vertices: [],
      uvs: [],
      indices: []
    };
  }
}
class ef {
  constructor() {
    this.batcher = new Mi(), this.instructions = new uo();
  }
  init() {
    this.instructions.reset();
  }
  /**
   * @deprecated since version 8.0.0
   * Use `batcher.geometry` instead.
   * @see {Batcher#geometry}
   */
  get geometry() {
    return X(Sc, "GraphicsContextRenderData#geometry is deprecated, please use batcher.geometry instead."), this.batcher.geometry;
  }
}
const Ri = class Js {
  constructor(e) {
    this._gpuContextHash = {}, this._graphicsDataContextHash = /* @__PURE__ */ Object.create(null), e.renderableGC.addManagedHash(this, "_gpuContextHash"), e.renderableGC.addManagedHash(this, "_graphicsDataContextHash");
  }
  /**
   * Runner init called, update the default options
   * @ignore
   */
  init(e) {
    Js.defaultOptions.bezierSmoothness = (e == null ? void 0 : e.bezierSmoothness) ?? Js.defaultOptions.bezierSmoothness;
  }
  getContextRenderData(e) {
    return this._graphicsDataContextHash[e.uid] || this._initContextRenderData(e);
  }
  // Context management functions
  updateGpuContext(e) {
    let t = this._gpuContextHash[e.uid] || this._initContext(e);
    if (e.dirty) {
      t ? this._cleanGraphicsContextData(e) : t = this._initContext(e), qd(e, t);
      const r = e.batchMode;
      e.customShader || r === "no-batch" ? t.isBatchable = !1 : r === "auto" && (t.isBatchable = t.geometryData.vertices.length < 400), e.dirty = !1;
    }
    return t;
  }
  getGpuContext(e) {
    return this._gpuContextHash[e.uid] || this._initContext(e);
  }
  _initContextRenderData(e) {
    const t = K.get(ef), { batches: r, geometryData: i } = this._gpuContextHash[e.uid], n = i.vertices.length, a = i.indices.length;
    for (let c = 0; c < r.length; c++)
      r[c].applyTransform = !1;
    const o = t.batcher;
    o.ensureAttributeBuffer(n), o.ensureIndexBuffer(a), o.begin();
    for (let c = 0; c < r.length; c++) {
      const u = r[c];
      o.add(u);
    }
    o.finish(t.instructions);
    const h = o.geometry;
    h.indexBuffer.setDataWithSize(o.indexBuffer, o.indexSize, !0), h.buffers[0].setDataWithSize(o.attributeBuffer.float32View, o.attributeSize, !0);
    const l = o.batches;
    for (let c = 0; c < l.length; c++) {
      const u = l[c];
      u.bindGroup = Si(u.textures.textures, u.textures.count);
    }
    return this._graphicsDataContextHash[e.uid] = t, t;
  }
  _initContext(e) {
    const t = new Jd();
    return t.context = e, this._gpuContextHash[e.uid] = t, e.on("destroy", this.onGraphicsContextDestroy, this), this._gpuContextHash[e.uid];
  }
  onGraphicsContextDestroy(e) {
    this._cleanGraphicsContextData(e), e.off("destroy", this.onGraphicsContextDestroy, this), this._gpuContextHash[e.uid] = null;
  }
  _cleanGraphicsContextData(e) {
    const t = this._gpuContextHash[e.uid];
    t.isBatchable || this._graphicsDataContextHash[e.uid] && (K.return(this.getContextRenderData(e)), this._graphicsDataContextHash[e.uid] = null), t.batches && t.batches.forEach((r) => {
      K.return(r);
    });
  }
  destroy() {
    for (const e in this._gpuContextHash)
      this._gpuContextHash[e] && this.onGraphicsContextDestroy(this._gpuContextHash[e].context);
  }
};
Ri.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem,
    v.CanvasSystem
  ],
  name: "graphicsContext"
};
Ri.defaultOptions = {
  /**
   * A value from 0 to 1 that controls the smoothness of bezier curves (the higher the smoother)
   * @default 0.5
   */
  bezierSmoothness: 0.5
};
let ki = Ri;
const tf = 8, vr = 11920929e-14, rf = 1;
function sh(s, e, t, r, i, n, a, o, h, l) {
  const u = Math.min(
    0.99,
    // a value of 1.0 actually inverts smoothing, so we cap it at 0.99
    Math.max(0, l ?? ki.defaultOptions.bezierSmoothness)
  );
  let d = (rf - u) / 1;
  return d *= d, sf(e, t, r, i, n, a, o, h, s, d), s;
}
function sf(s, e, t, r, i, n, a, o, h, l) {
  ei(s, e, t, r, i, n, a, o, h, l, 0), h.push(a, o);
}
function ei(s, e, t, r, i, n, a, o, h, l, c) {
  if (c > tf)
    return;
  const u = (s + t) / 2, d = (e + r) / 2, f = (t + i) / 2, p = (r + n) / 2, g = (i + a) / 2, m = (n + o) / 2, y = (u + f) / 2, T = (d + p) / 2, S = (f + g) / 2, A = (p + m) / 2, M = (y + S) / 2, P = (T + A) / 2;
  if (c > 0) {
    let E = a - s, N = o - e;
    const I = Math.abs((t - a) * N - (r - o) * E), k = Math.abs((i - a) * N - (n - o) * E);
    if (I > vr && k > vr) {
      if ((I + k) * (I + k) <= l * (E * E + N * N)) {
        h.push(M, P);
        return;
      }
    } else if (I > vr) {
      if (I * I <= l * (E * E + N * N)) {
        h.push(M, P);
        return;
      }
    } else if (k > vr) {
      if (k * k <= l * (E * E + N * N)) {
        h.push(M, P);
        return;
      }
    } else if (E = M - (s + a) / 2, N = P - (e + o) / 2, E * E + N * N <= l) {
      h.push(M, P);
      return;
    }
  }
  ei(s, e, u, d, y, T, M, P, h, l, c + 1), ei(M, P, S, A, g, m, a, o, h, l, c + 1);
}
const nf = 8, af = 11920929e-14, of = 1;
function hf(s, e, t, r, i, n, a, o) {
  const l = Math.min(
    0.99,
    // a value of 1.0 actually inverts smoothing, so we cap it at 0.99
    Math.max(0, o ?? ki.defaultOptions.bezierSmoothness)
  );
  let c = (of - l) / 1;
  return c *= c, lf(e, t, r, i, n, a, s, c), s;
}
function lf(s, e, t, r, i, n, a, o) {
  ti(a, s, e, t, r, i, n, o, 0), a.push(i, n);
}
function ti(s, e, t, r, i, n, a, o, h) {
  if (h > nf)
    return;
  const l = (e + r) / 2, c = (t + i) / 2, u = (r + n) / 2, d = (i + a) / 2, f = (l + u) / 2, p = (c + d) / 2;
  let g = n - e, m = a - t;
  const y = Math.abs((r - n) * m - (i - a) * g);
  if (y > af) {
    if (y * y <= o * (g * g + m * m)) {
      s.push(f, p);
      return;
    }
  } else if (g = f - (e + n) / 2, m = p - (t + a) / 2, g * g + m * m <= o) {
    s.push(f, p);
    return;
  }
  ti(s, e, t, l, c, f, p, o, h + 1), ti(s, f, p, u, d, n, a, o, h + 1);
}
function ih(s, e, t, r, i, n, a, o) {
  let h = Math.abs(i - n);
  (!a && i > n || a && n > i) && (h = 2 * Math.PI - h), o || (o = Math.max(6, Math.floor(6 * Math.pow(r, 1 / 3) * (h / Math.PI)))), o = Math.max(o, 3);
  let l = h / o, c = i;
  l *= a ? -1 : 1;
  for (let u = 0; u < o + 1; u++) {
    const d = Math.cos(c), f = Math.sin(c), p = e + d * r, g = t + f * r;
    s.push(p, g), c += l;
  }
}
function cf(s, e, t, r, i, n) {
  const a = s[s.length - 2], h = s[s.length - 1] - t, l = a - e, c = i - t, u = r - e, d = Math.abs(h * u - l * c);
  if (d < 1e-8 || n === 0) {
    (s[s.length - 2] !== e || s[s.length - 1] !== t) && s.push(e, t);
    return;
  }
  const f = h * h + l * l, p = c * c + u * u, g = h * c + l * u, m = n * Math.sqrt(f) / d, y = n * Math.sqrt(p) / d, T = m * g / f, S = y * g / p, A = m * u + y * l, M = m * c + y * h, P = l * (y + T), E = h * (y + T), N = u * (m + S), I = c * (m + S), k = Math.atan2(E - M, P - A), G = Math.atan2(I - M, N - A);
  ih(
    s,
    A + e,
    M + t,
    n,
    k,
    G,
    l * c > u * h
  );
}
const qt = Math.PI * 2, ws = {
  centerX: 0,
  centerY: 0,
  ang1: 0,
  ang2: 0
}, As = ({ x: s, y: e }, t, r, i, n, a, o, h) => {
  s *= t, e *= r;
  const l = i * s - n * e, c = n * s + i * e;
  return h.x = l + a, h.y = c + o, h;
};
function uf(s, e) {
  const t = e === -1.5707963267948966 ? -0.551915024494 : 1.3333333333333333 * Math.tan(e / 4), r = e === 1.5707963267948966 ? 0.551915024494 : t, i = Math.cos(s), n = Math.sin(s), a = Math.cos(s + e), o = Math.sin(s + e);
  return [
    {
      x: i - n * r,
      y: n + i * r
    },
    {
      x: a + o * r,
      y: o - a * r
    },
    {
      x: a,
      y: o
    }
  ];
}
const ra = (s, e, t, r) => {
  const i = s * r - e * t < 0 ? -1 : 1;
  let n = s * t + e * r;
  return n > 1 && (n = 1), n < -1 && (n = -1), i * Math.acos(n);
}, df = (s, e, t, r, i, n, a, o, h, l, c, u, d) => {
  const f = Math.pow(i, 2), p = Math.pow(n, 2), g = Math.pow(c, 2), m = Math.pow(u, 2);
  let y = f * p - f * m - p * g;
  y < 0 && (y = 0), y /= f * m + p * g, y = Math.sqrt(y) * (a === o ? -1 : 1);
  const T = y * i / n * u, S = y * -n / i * c, A = l * T - h * S + (s + t) / 2, M = h * T + l * S + (e + r) / 2, P = (c - T) / i, E = (u - S) / n, N = (-c - T) / i, I = (-u - S) / n, k = ra(1, 0, P, E);
  let G = ra(P, E, N, I);
  o === 0 && G > 0 && (G -= qt), o === 1 && G < 0 && (G += qt), d.centerX = A, d.centerY = M, d.ang1 = k, d.ang2 = G;
};
function ff(s, e, t, r, i, n, a, o = 0, h = 0, l = 0) {
  if (n === 0 || a === 0)
    return;
  const c = Math.sin(o * qt / 360), u = Math.cos(o * qt / 360), d = u * (e - r) / 2 + c * (t - i) / 2, f = -c * (e - r) / 2 + u * (t - i) / 2;
  if (d === 0 && f === 0)
    return;
  n = Math.abs(n), a = Math.abs(a);
  const p = Math.pow(d, 2) / Math.pow(n, 2) + Math.pow(f, 2) / Math.pow(a, 2);
  p > 1 && (n *= Math.sqrt(p), a *= Math.sqrt(p)), df(
    e,
    t,
    r,
    i,
    n,
    a,
    h,
    l,
    c,
    u,
    d,
    f,
    ws
  );
  let { ang1: g, ang2: m } = ws;
  const { centerX: y, centerY: T } = ws;
  let S = Math.abs(m) / (qt / 4);
  Math.abs(1 - S) < 1e-7 && (S = 1);
  const A = Math.max(Math.ceil(S), 1);
  m /= A;
  let M = s[s.length - 2], P = s[s.length - 1];
  const E = { x: 0, y: 0 };
  for (let N = 0; N < A; N++) {
    const I = uf(g, m), { x: k, y: G } = As(I[0], n, a, u, c, y, T, E), { x: F, y: $ } = As(I[1], n, a, u, c, y, T, E), { x: ae, y: ge } = As(I[2], n, a, u, c, y, T, E);
    sh(
      s,
      M,
      P,
      k,
      G,
      F,
      $,
      ae,
      ge
    ), M = ae, P = ge, g += m;
  }
}
function pf(s, e, t) {
  const r = (a, o) => {
    const h = o.x - a.x, l = o.y - a.y, c = Math.sqrt(h * h + l * l), u = h / c, d = l / c;
    return { len: c, nx: u, ny: d };
  }, i = (a, o) => {
    a === 0 ? s.moveTo(o.x, o.y) : s.lineTo(o.x, o.y);
  };
  let n = e[e.length - 1];
  for (let a = 0; a < e.length; a++) {
    const o = e[a % e.length], h = o.radius ?? t;
    if (h <= 0) {
      i(a, o), n = o;
      continue;
    }
    const l = e[(a + 1) % e.length], c = r(o, n), u = r(o, l);
    if (c.len < 1e-4 || u.len < 1e-4) {
      i(a, o), n = o;
      continue;
    }
    let d = Math.asin(c.nx * u.ny - c.ny * u.nx), f = 1, p = !1;
    c.nx * u.nx - c.ny * -u.ny < 0 ? d < 0 ? d = Math.PI + d : (d = Math.PI - d, f = -1, p = !0) : d > 0 && (f = -1, p = !0);
    const g = d / 2;
    let m, y = Math.abs(
      Math.cos(g) * h / Math.sin(g)
    );
    y > Math.min(c.len / 2, u.len / 2) ? (y = Math.min(c.len / 2, u.len / 2), m = Math.abs(y * Math.sin(g) / Math.cos(g))) : m = h;
    const T = o.x + u.nx * y + -u.ny * m * f, S = o.y + u.ny * y + u.nx * m * f, A = Math.atan2(c.ny, c.nx) + Math.PI / 2 * f, M = Math.atan2(u.ny, u.nx) - Math.PI / 2 * f;
    a === 0 && s.moveTo(
      T + Math.cos(A) * m,
      S + Math.sin(A) * m
    ), s.arc(T, S, m, A, M, p), n = o;
  }
}
function mf(s, e, t, r) {
  const i = (o, h) => Math.sqrt((o.x - h.x) ** 2 + (o.y - h.y) ** 2), n = (o, h, l) => ({
    x: o.x + (h.x - o.x) * l,
    y: o.y + (h.y - o.y) * l
  }), a = e.length;
  for (let o = 0; o < a; o++) {
    const h = e[(o + 1) % a], l = h.radius ?? t;
    if (l <= 0) {
      o === 0 ? s.moveTo(h.x, h.y) : s.lineTo(h.x, h.y);
      continue;
    }
    const c = e[o], u = e[(o + 2) % a], d = i(c, h);
    let f;
    if (d < 1e-4)
      f = h;
    else {
      const m = Math.min(d / 2, l);
      f = n(
        h,
        c,
        m / d
      );
    }
    const p = i(u, h);
    let g;
    if (p < 1e-4)
      g = h;
    else {
      const m = Math.min(p / 2, l);
      g = n(
        h,
        u,
        m / p
      );
    }
    o === 0 ? s.moveTo(f.x, f.y) : s.lineTo(f.x, f.y), s.quadraticCurveTo(h.x, h.y, g.x, g.y, r);
  }
}
const gf = new ne();
class _f {
  constructor(e) {
    this.shapePrimitives = [], this._currentPoly = null, this._bounds = new ye(), this._graphicsPath2D = e, this.signed = e.checkForHoles;
  }
  /**
   * Sets the starting point for a new sub-path. Any subsequent drawing commands are considered part of this path.
   * @param x - The x-coordinate for the starting point.
   * @param y - The y-coordinate for the starting point.
   * @returns The instance of the current object for chaining.
   */
  moveTo(e, t) {
    return this.startPoly(e, t), this;
  }
  /**
   * Connects the current point to a new point with a straight line. This method updates the current path.
   * @param x - The x-coordinate of the new point to connect to.
   * @param y - The y-coordinate of the new point to connect to.
   * @returns The instance of the current object for chaining.
   */
  lineTo(e, t) {
    this._ensurePoly();
    const r = this._currentPoly.points, i = r[r.length - 2], n = r[r.length - 1];
    return (i !== e || n !== t) && r.push(e, t), this;
  }
  /**
   * Adds an arc to the path. The arc is centered at (x, y)
   *  position with radius `radius` starting at `startAngle` and ending at `endAngle`.
   * @param x - The x-coordinate of the arc's center.
   * @param y - The y-coordinate of the arc's center.
   * @param radius - The radius of the arc.
   * @param startAngle - The starting angle of the arc, in radians.
   * @param endAngle - The ending angle of the arc, in radians.
   * @param counterclockwise - Specifies whether the arc should be drawn in the anticlockwise direction. False by default.
   * @returns The instance of the current object for chaining.
   */
  arc(e, t, r, i, n, a) {
    this._ensurePoly(!1);
    const o = this._currentPoly.points;
    return ih(o, e, t, r, i, n, a), this;
  }
  /**
   * Adds an arc to the path with the arc tangent to the line joining two specified points.
   * The arc radius is specified by `radius`.
   * @param x1 - The x-coordinate of the first point.
   * @param y1 - The y-coordinate of the first point.
   * @param x2 - The x-coordinate of the second point.
   * @param y2 - The y-coordinate of the second point.
   * @param radius - The radius of the arc.
   * @returns The instance of the current object for chaining.
   */
  arcTo(e, t, r, i, n) {
    this._ensurePoly();
    const a = this._currentPoly.points;
    return cf(a, e, t, r, i, n), this;
  }
  /**
   * Adds an SVG-style arc to the path, allowing for elliptical arcs based on the SVG spec.
   * @param rx - The x-radius of the ellipse.
   * @param ry - The y-radius of the ellipse.
   * @param xAxisRotation - The rotation of the ellipse's x-axis relative
   * to the x-axis of the coordinate system, in degrees.
   * @param largeArcFlag - Determines if the arc should be greater than or less than 180 degrees.
   * @param sweepFlag - Determines if the arc should be swept in a positive angle direction.
   * @param x - The x-coordinate of the arc's end point.
   * @param y - The y-coordinate of the arc's end point.
   * @returns The instance of the current object for chaining.
   */
  arcToSvg(e, t, r, i, n, a, o) {
    const h = this._currentPoly.points;
    return ff(
      h,
      this._currentPoly.lastX,
      this._currentPoly.lastY,
      a,
      o,
      e,
      t,
      r,
      i,
      n
    ), this;
  }
  /**
   * Adds a cubic Bezier curve to the path.
   * It requires three points: the first two are control points and the third one is the end point.
   * The starting point is the last point in the current path.
   * @param cp1x - The x-coordinate of the first control point.
   * @param cp1y - The y-coordinate of the first control point.
   * @param cp2x - The x-coordinate of the second control point.
   * @param cp2y - The y-coordinate of the second control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */
  bezierCurveTo(e, t, r, i, n, a, o) {
    this._ensurePoly();
    const h = this._currentPoly;
    return sh(
      this._currentPoly.points,
      h.lastX,
      h.lastY,
      e,
      t,
      r,
      i,
      n,
      a,
      o
    ), this;
  }
  /**
   * Adds a quadratic curve to the path. It requires two points: the control point and the end point.
   * The starting point is the last point in the current path.
   * @param cp1x - The x-coordinate of the control point.
   * @param cp1y - The y-coordinate of the control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothing - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */
  quadraticCurveTo(e, t, r, i, n) {
    this._ensurePoly();
    const a = this._currentPoly;
    return hf(
      this._currentPoly.points,
      a.lastX,
      a.lastY,
      e,
      t,
      r,
      i,
      n
    ), this;
  }
  /**
   * Closes the current path by drawing a straight line back to the start.
   * If the shape is already closed or there are no points in the path, this method does nothing.
   * @returns The instance of the current object for chaining.
   */
  closePath() {
    return this.endPoly(!0), this;
  }
  /**
   * Adds another path to the current path. This method allows for the combination of multiple paths into one.
   * @param path - The `GraphicsPath` object representing the path to add.
   * @param transform - An optional `Matrix` object to apply a transformation to the path before adding it.
   * @returns The instance of the current object for chaining.
   */
  addPath(e, t) {
    this.endPoly(), t && !t.isIdentity() && (e = e.clone(!0), e.transform(t));
    const r = this.shapePrimitives, i = r.length;
    for (let n = 0; n < e.instructions.length; n++) {
      const a = e.instructions[n];
      this[a.action](...a.data);
    }
    if (e.checkForHoles && r.length - i > 1) {
      let n = null;
      for (let a = i; a < r.length; a++) {
        const o = r[a];
        if (o.shape.type === "polygon") {
          const h = o.shape, l = n == null ? void 0 : n.shape;
          l && l.containsPolygon(h) ? (n.holes || (n.holes = []), n.holes.push(o), r.copyWithin(a, a + 1), r.length--, a--) : n = o;
        }
      }
    }
    return this;
  }
  /**
   * Finalizes the drawing of the current path. Optionally, it can close the path.
   * @param closePath - A boolean indicating whether to close the path after finishing. False by default.
   */
  finish(e = !1) {
    this.endPoly(e);
  }
  /**
   * Draws a rectangle shape. This method adds a new rectangle path to the current drawing.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @param transform - An optional `Matrix` object to apply a transformation to the rectangle.
   * @returns The instance of the current object for chaining.
   */
  rect(e, t, r, i, n) {
    return this.drawShape(new ne(e, t, r, i), n), this;
  }
  /**
   * Draws a circle shape. This method adds a new circle path to the current drawing.
   * @param x - The x-coordinate of the center of the circle.
   * @param y - The y-coordinate of the center of the circle.
   * @param radius - The radius of the circle.
   * @param transform - An optional `Matrix` object to apply a transformation to the circle.
   * @returns The instance of the current object for chaining.
   */
  circle(e, t, r, i) {
    return this.drawShape(new bi(e, t, r), i), this;
  }
  /**
   * Draws a polygon shape. This method allows for the creation of complex polygons by specifying a sequence of points.
   * @param points - An array of numbers, or or an array of PointData objects eg [{x,y}, {x,y}, {x,y}]
   * representing the x and y coordinates of the polygon's vertices, in sequence.
   * @param close - A boolean indicating whether to close the polygon path. True by default.
   * @param transform - An optional `Matrix` object to apply a transformation to the polygon.
   * @returns The instance of the current object for chaining.
   */
  poly(e, t, r) {
    const i = new Kt(e);
    return i.closePath = t, this.drawShape(i, r), this;
  }
  /**
   * Draws a regular polygon with a specified number of sides. All sides and angles are equal.
   * @param x - The x-coordinate of the center of the polygon.
   * @param y - The y-coordinate of the center of the polygon.
   * @param radius - The radius of the circumscribed circle of the polygon.
   * @param sides - The number of sides of the polygon. Must be 3 or more.
   * @param rotation - The rotation angle of the polygon, in radians. Zero by default.
   * @param transform - An optional `Matrix` object to apply a transformation to the polygon.
   * @returns The instance of the current object for chaining.
   */
  regularPoly(e, t, r, i, n = 0, a) {
    i = Math.max(i | 0, 3);
    const o = -1 * Math.PI / 2 + n, h = Math.PI * 2 / i, l = [];
    for (let c = 0; c < i; c++) {
      const u = o - c * h;
      l.push(
        e + r * Math.cos(u),
        t + r * Math.sin(u)
      );
    }
    return this.poly(l, !0, a), this;
  }
  /**
   * Draws a polygon with rounded corners.
   * Similar to `regularPoly` but with the ability to round the corners of the polygon.
   * @param x - The x-coordinate of the center of the polygon.
   * @param y - The y-coordinate of the center of the polygon.
   * @param radius - The radius of the circumscribed circle of the polygon.
   * @param sides - The number of sides of the polygon. Must be 3 or more.
   * @param corner - The radius of the rounding of the corners.
   * @param rotation - The rotation angle of the polygon, in radians. Zero by default.
   * @param smoothness - Optional parameter to adjust the smoothness of the rounding.
   * @returns The instance of the current object for chaining.
   */
  roundPoly(e, t, r, i, n, a = 0, o) {
    if (i = Math.max(i | 0, 3), n <= 0)
      return this.regularPoly(e, t, r, i, a);
    const h = r * Math.sin(Math.PI / i) - 1e-3;
    n = Math.min(n, h);
    const l = -1 * Math.PI / 2 + a, c = Math.PI * 2 / i, u = (i - 2) * Math.PI / i / 2;
    for (let d = 0; d < i; d++) {
      const f = d * c + l, p = e + r * Math.cos(f), g = t + r * Math.sin(f), m = f + Math.PI + u, y = f - Math.PI - u, T = p + n * Math.cos(m), S = g + n * Math.sin(m), A = p + n * Math.cos(y), M = g + n * Math.sin(y);
      d === 0 ? this.moveTo(T, S) : this.lineTo(T, S), this.quadraticCurveTo(p, g, A, M, o);
    }
    return this.closePath();
  }
  /**
   * Draws a shape with rounded corners. This function supports custom radius for each corner of the shape.
   * Optionally, corners can be rounded using a quadratic curve instead of an arc, providing a different aesthetic.
   * @param points - An array of `RoundedPoint` representing the corners of the shape to draw.
   * A minimum of 3 points is required.
   * @param radius - The default radius for the corners.
   * This radius is applied to all corners unless overridden in `points`.
   * @param useQuadratic - If set to true, rounded corners are drawn using a quadraticCurve
   *  method instead of an arc method. Defaults to false.
   * @param smoothness - Specifies the smoothness of the curve when `useQuadratic` is true.
   * Higher values make the curve smoother.
   * @returns The instance of the current object for chaining.
   */
  roundShape(e, t, r = !1, i) {
    return e.length < 3 ? this : (r ? mf(this, e, t, i) : pf(this, e, t), this.closePath());
  }
  /**
   * Draw Rectangle with fillet corners. This is much like rounded rectangle
   * however it support negative numbers as well for the corner radius.
   * @param x - Upper left corner of rect
   * @param y - Upper right corner of rect
   * @param width - Width of rect
   * @param height - Height of rect
   * @param fillet - accept negative or positive values
   */
  filletRect(e, t, r, i, n) {
    if (n === 0)
      return this.rect(e, t, r, i);
    const a = Math.min(r, i) / 2, o = Math.min(a, Math.max(-a, n)), h = e + r, l = t + i, c = o < 0 ? -o : 0, u = Math.abs(o);
    return this.moveTo(e, t + u).arcTo(e + c, t + c, e + u, t, u).lineTo(h - u, t).arcTo(h - c, t + c, h, t + u, u).lineTo(h, l - u).arcTo(h - c, l - c, e + r - u, l, u).lineTo(e + u, l).arcTo(e + c, l - c, e, l - u, u).closePath();
  }
  /**
   * Draw Rectangle with chamfer corners. These are angled corners.
   * @param x - Upper left corner of rect
   * @param y - Upper right corner of rect
   * @param width - Width of rect
   * @param height - Height of rect
   * @param chamfer - non-zero real number, size of corner cutout
   * @param transform
   */
  chamferRect(e, t, r, i, n, a) {
    if (n <= 0)
      return this.rect(e, t, r, i);
    const o = Math.min(n, Math.min(r, i) / 2), h = e + r, l = t + i, c = [
      e + o,
      t,
      h - o,
      t,
      h,
      t + o,
      h,
      l - o,
      h - o,
      l,
      e + o,
      l,
      e,
      l - o,
      e,
      t + o
    ];
    for (let u = c.length - 1; u >= 2; u -= 2)
      c[u] === c[u - 2] && c[u - 1] === c[u - 3] && c.splice(u - 1, 2);
    return this.poly(c, !0, a);
  }
  /**
   * Draws an ellipse at the specified location and with the given x and y radii.
   * An optional transformation can be applied, allowing for rotation, scaling, and translation.
   * @param x - The x-coordinate of the center of the ellipse.
   * @param y - The y-coordinate of the center of the ellipse.
   * @param radiusX - The horizontal radius of the ellipse.
   * @param radiusY - The vertical radius of the ellipse.
   * @param transform - An optional `Matrix` object to apply a transformation to the ellipse. This can include rotations.
   * @returns The instance of the current object for chaining.
   */
  ellipse(e, t, r, i, n) {
    return this.drawShape(new vi(e, t, r, i), n), this;
  }
  /**
   * Draws a rectangle with rounded corners.
   * The corner radius can be specified to determine how rounded the corners should be.
   * An optional transformation can be applied, which allows for rotation, scaling, and translation of the rectangle.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @param radius - The radius of the rectangle's corners. If not specified, corners will be sharp.
   * @param transform - An optional `Matrix` object to apply a transformation to the rectangle.
   * @returns The instance of the current object for chaining.
   */
  roundRect(e, t, r, i, n, a) {
    return this.drawShape(new Ti(e, t, r, i, n), a), this;
  }
  /**
   * Draws a given shape on the canvas.
   * This is a generic method that can draw any type of shape specified by the `ShapePrimitive` parameter.
   * An optional transformation matrix can be applied to the shape, allowing for complex transformations.
   * @param shape - The shape to draw, defined as a `ShapePrimitive` object.
   * @param matrix - An optional `Matrix` for transforming the shape. This can include rotations,
   * scaling, and translations.
   * @returns The instance of the current object for chaining.
   */
  drawShape(e, t) {
    return this.endPoly(), this.shapePrimitives.push({ shape: e, transform: t }), this;
  }
  /**
   * Starts a new polygon path from the specified starting point.
   * This method initializes a new polygon or ends the current one if it exists.
   * @param x - The x-coordinate of the starting point of the new polygon.
   * @param y - The y-coordinate of the starting point of the new polygon.
   * @returns The instance of the current object for chaining.
   */
  startPoly(e, t) {
    let r = this._currentPoly;
    return r && this.endPoly(), r = new Kt(), r.points.push(e, t), this._currentPoly = r, this;
  }
  /**
   * Ends the current polygon path. If `closePath` is set to true,
   * the path is closed by connecting the last point to the first one.
   * This method finalizes the current polygon and prepares it for drawing or adding to the shape primitives.
   * @param closePath - A boolean indicating whether to close the polygon by connecting the last point
   *  back to the starting point. False by default.
   * @returns The instance of the current object for chaining.
   */
  endPoly(e = !1) {
    const t = this._currentPoly;
    return t && t.points.length > 2 && (t.closePath = e, this.shapePrimitives.push({ shape: t })), this._currentPoly = null, this;
  }
  _ensurePoly(e = !0) {
    if (!this._currentPoly && (this._currentPoly = new Kt(), e)) {
      const t = this.shapePrimitives[this.shapePrimitives.length - 1];
      if (t) {
        let r = t.shape.x, i = t.shape.y;
        if (t.transform && !t.transform.isIdentity()) {
          const n = t.transform, a = r;
          r = n.a * r + n.c * i + n.tx, i = n.b * a + n.d * i + n.ty;
        }
        this._currentPoly.points.push(r, i);
      } else
        this._currentPoly.points.push(0, 0);
    }
  }
  /** Builds the path. */
  buildPath() {
    const e = this._graphicsPath2D;
    this.shapePrimitives.length = 0, this._currentPoly = null;
    for (let t = 0; t < e.instructions.length; t++) {
      const r = e.instructions[t];
      this[r.action](...r.data);
    }
    this.finish();
  }
  /** Gets the bounds of the path. */
  get bounds() {
    const e = this._bounds;
    e.clear();
    const t = this.shapePrimitives;
    for (let r = 0; r < t.length; r++) {
      const i = t[r], n = i.shape.getBounds(gf);
      i.transform ? e.addRect(n, i.transform) : e.addRect(n);
    }
    return e;
  }
}
class Bt {
  /**
   * Creates a `GraphicsPath` instance optionally from an SVG path string or an array of `PathInstruction`.
   * @param instructions - An SVG path string or an array of `PathInstruction` objects.
   * @param signed
   */
  constructor(e, t = !1) {
    this.instructions = [], this.uid = le("graphicsPath"), this._dirty = !0, this.checkForHoles = t, typeof e == "string" ? Qu(e, this) : this.instructions = (e == null ? void 0 : e.slice()) ?? [];
  }
  /**
   * Provides access to the internal shape path, ensuring it is up-to-date with the current instructions.
   * @returns The `ShapePath` instance associated with this `GraphicsPath`.
   */
  get shapePath() {
    return this._shapePath || (this._shapePath = new _f(this)), this._dirty && (this._dirty = !1, this._shapePath.buildPath()), this._shapePath;
  }
  /**
   * Adds another `GraphicsPath` to this path, optionally applying a transformation.
   * @param path - The `GraphicsPath` to add.
   * @param transform - An optional transformation to apply to the added path.
   * @returns The instance of the current object for chaining.
   */
  addPath(e, t) {
    return e = e.clone(), this.instructions.push({ action: "addPath", data: [e, t] }), this._dirty = !0, this;
  }
  arc(...e) {
    return this.instructions.push({ action: "arc", data: e }), this._dirty = !0, this;
  }
  arcTo(...e) {
    return this.instructions.push({ action: "arcTo", data: e }), this._dirty = !0, this;
  }
  arcToSvg(...e) {
    return this.instructions.push({ action: "arcToSvg", data: e }), this._dirty = !0, this;
  }
  bezierCurveTo(...e) {
    return this.instructions.push({ action: "bezierCurveTo", data: e }), this._dirty = !0, this;
  }
  /**
   * Adds a cubic Bezier curve to the path.
   * It requires two points: the second control point and the end point. The first control point is assumed to be
   * The starting point is the last point in the current path.
   * @param cp2x - The x-coordinate of the second control point.
   * @param cp2y - The y-coordinate of the second control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */
  bezierCurveToShort(e, t, r, i, n) {
    const a = this.instructions[this.instructions.length - 1], o = this.getLastPoint(oe.shared);
    let h = 0, l = 0;
    if (!a || a.action !== "bezierCurveTo")
      h = o.x, l = o.y;
    else {
      h = a.data[2], l = a.data[3];
      const c = o.x, u = o.y;
      h = c + (c - h), l = u + (u - l);
    }
    return this.instructions.push({ action: "bezierCurveTo", data: [h, l, e, t, r, i, n] }), this._dirty = !0, this;
  }
  /**
   * Closes the current path by drawing a straight line back to the start.
   * If the shape is already closed or there are no points in the path, this method does nothing.
   * @returns The instance of the current object for chaining.
   */
  closePath() {
    return this.instructions.push({ action: "closePath", data: [] }), this._dirty = !0, this;
  }
  ellipse(...e) {
    return this.instructions.push({ action: "ellipse", data: e }), this._dirty = !0, this;
  }
  lineTo(...e) {
    return this.instructions.push({ action: "lineTo", data: e }), this._dirty = !0, this;
  }
  moveTo(...e) {
    return this.instructions.push({ action: "moveTo", data: e }), this;
  }
  quadraticCurveTo(...e) {
    return this.instructions.push({ action: "quadraticCurveTo", data: e }), this._dirty = !0, this;
  }
  /**
   * Adds a quadratic curve to the path. It uses the previous point as the control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */
  quadraticCurveToShort(e, t, r) {
    const i = this.instructions[this.instructions.length - 1], n = this.getLastPoint(oe.shared);
    let a = 0, o = 0;
    if (!i || i.action !== "quadraticCurveTo")
      a = n.x, o = n.y;
    else {
      a = i.data[0], o = i.data[1];
      const h = n.x, l = n.y;
      a = h + (h - a), o = l + (l - o);
    }
    return this.instructions.push({ action: "quadraticCurveTo", data: [a, o, e, t, r] }), this._dirty = !0, this;
  }
  /**
   * Draws a rectangle shape. This method adds a new rectangle path to the current drawing.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @param transform - An optional `Matrix` object to apply a transformation to the rectangle.
   * @returns The instance of the current object for chaining.
   */
  rect(e, t, r, i, n) {
    return this.instructions.push({ action: "rect", data: [e, t, r, i, n] }), this._dirty = !0, this;
  }
  /**
   * Draws a circle shape. This method adds a new circle path to the current drawing.
   * @param x - The x-coordinate of the center of the circle.
   * @param y - The y-coordinate of the center of the circle.
   * @param radius - The radius of the circle.
   * @param transform - An optional `Matrix` object to apply a transformation to the circle.
   * @returns The instance of the current object for chaining.
   */
  circle(e, t, r, i) {
    return this.instructions.push({ action: "circle", data: [e, t, r, i] }), this._dirty = !0, this;
  }
  roundRect(...e) {
    return this.instructions.push({ action: "roundRect", data: e }), this._dirty = !0, this;
  }
  poly(...e) {
    return this.instructions.push({ action: "poly", data: e }), this._dirty = !0, this;
  }
  regularPoly(...e) {
    return this.instructions.push({ action: "regularPoly", data: e }), this._dirty = !0, this;
  }
  roundPoly(...e) {
    return this.instructions.push({ action: "roundPoly", data: e }), this._dirty = !0, this;
  }
  roundShape(...e) {
    return this.instructions.push({ action: "roundShape", data: e }), this._dirty = !0, this;
  }
  filletRect(...e) {
    return this.instructions.push({ action: "filletRect", data: e }), this._dirty = !0, this;
  }
  chamferRect(...e) {
    return this.instructions.push({ action: "chamferRect", data: e }), this._dirty = !0, this;
  }
  /**
   * Draws a star shape centered at a specified location. This method allows for the creation
   *  of stars with a variable number of points, outer radius, optional inner radius, and rotation.
   * The star is drawn as a closed polygon with alternating outer and inner vertices to create the star's points.
   * An optional transformation can be applied to scale, rotate, or translate the star as needed.
   * @param x - The x-coordinate of the center of the star.
   * @param y - The y-coordinate of the center of the star.
   * @param points - The number of points of the star.
   * @param radius - The outer radius of the star (distance from the center to the outer points).
   * @param innerRadius - Optional. The inner radius of the star
   * (distance from the center to the inner points between the outer points).
   * If not provided, defaults to half of the `radius`.
   * @param rotation - Optional. The rotation of the star in radians, where 0 is aligned with the y-axis.
   * Defaults to 0, meaning one point is directly upward.
   * @param transform - An optional `Matrix` object to apply a transformation to the star.
   * This can include rotations, scaling, and translations.
   * @returns The instance of the current object for chaining further drawing commands.
   */
  // eslint-disable-next-line max-len
  star(e, t, r, i, n, a, o) {
    n || (n = i / 2);
    const h = -1 * Math.PI / 2 + a, l = r * 2, c = Math.PI * 2 / l, u = [];
    for (let d = 0; d < l; d++) {
      const f = d % 2 ? n : i, p = d * c + h;
      u.push(
        e + f * Math.cos(p),
        t + f * Math.sin(p)
      );
    }
    return this.poly(u, !0, o), this;
  }
  /**
   * Creates a copy of the current `GraphicsPath` instance. This method supports both shallow and deep cloning.
   * A shallow clone copies the reference of the instructions array, while a deep clone creates a new array and
   * copies each instruction individually, ensuring that modifications to the instructions of the cloned `GraphicsPath`
   * do not affect the original `GraphicsPath` and vice versa.
   * @param deep - A boolean flag indicating whether the clone should be deep.
   * @returns A new `GraphicsPath` instance that is a clone of the current instance.
   */
  clone(e = !1) {
    const t = new Bt();
    if (t.checkForHoles = this.checkForHoles, !e)
      t.instructions = this.instructions.slice();
    else
      for (let r = 0; r < this.instructions.length; r++) {
        const i = this.instructions[r];
        t.instructions.push({ action: i.action, data: i.data.slice() });
      }
    return t;
  }
  clear() {
    return this.instructions.length = 0, this._dirty = !0, this;
  }
  /**
   * Applies a transformation matrix to all drawing instructions within the `GraphicsPath`.
   * This method enables the modification of the path's geometry according to the provided
   * transformation matrix, which can include translations, rotations, scaling, and skewing.
   *
   * Each drawing instruction in the path is updated to reflect the transformation,
   * ensuring the visual representation of the path is consistent with the applied matrix.
   *
   * Note: The transformation is applied directly to the coordinates and control points of the drawing instructions,
   * not to the path as a whole. This means the transformation's effects are baked into the individual instructions,
   * allowing for fine-grained control over the path's appearance.
   * @param matrix - A `Matrix` object representing the transformation to apply.
   * @returns The instance of the current object for chaining further operations.
   */
  transform(e) {
    if (e.isIdentity())
      return this;
    const t = e.a, r = e.b, i = e.c, n = e.d, a = e.tx, o = e.ty;
    let h = 0, l = 0, c = 0, u = 0, d = 0, f = 0, p = 0, g = 0;
    for (let m = 0; m < this.instructions.length; m++) {
      const y = this.instructions[m], T = y.data;
      switch (y.action) {
        case "moveTo":
        case "lineTo":
          h = T[0], l = T[1], T[0] = t * h + i * l + a, T[1] = r * h + n * l + o;
          break;
        case "bezierCurveTo":
          c = T[0], u = T[1], d = T[2], f = T[3], h = T[4], l = T[5], T[0] = t * c + i * u + a, T[1] = r * c + n * u + o, T[2] = t * d + i * f + a, T[3] = r * d + n * f + o, T[4] = t * h + i * l + a, T[5] = r * h + n * l + o;
          break;
        case "quadraticCurveTo":
          c = T[0], u = T[1], h = T[2], l = T[3], T[0] = t * c + i * u + a, T[1] = r * c + n * u + o, T[2] = t * h + i * l + a, T[3] = r * h + n * l + o;
          break;
        case "arcToSvg":
          h = T[5], l = T[6], p = T[0], g = T[1], T[0] = t * p + i * g, T[1] = r * p + n * g, T[5] = t * h + i * l + a, T[6] = r * h + n * l + o;
          break;
        case "circle":
          T[4] = Nt(T[3], e);
          break;
        case "rect":
          T[4] = Nt(T[4], e);
          break;
        case "ellipse":
          T[8] = Nt(T[8], e);
          break;
        case "roundRect":
          T[5] = Nt(T[5], e);
          break;
        case "addPath":
          T[0].transform(e);
          break;
        case "poly":
          T[2] = Nt(T[2], e);
          break;
        default:
          V("unknown transform action", y.action);
          break;
      }
    }
    return this._dirty = !0, this;
  }
  get bounds() {
    return this.shapePath.bounds;
  }
  /**
   * Retrieves the last point from the current drawing instructions in the `GraphicsPath`.
   * This method is useful for operations that depend on the path's current endpoint,
   * such as connecting subsequent shapes or paths. It supports various drawing instructions,
   * ensuring the last point's position is accurately determined regardless of the path's complexity.
   *
   * If the last instruction is a `closePath`, the method iterates backward through the instructions
   *  until it finds an actionable instruction that defines a point (e.g., `moveTo`, `lineTo`,
   * `quadraticCurveTo`, etc.). For compound paths added via `addPath`, it recursively retrieves
   * the last point from the nested path.
   * @param out - A `Point` object where the last point's coordinates will be stored.
   * This object is modified directly to contain the result.
   * @returns The `Point` object containing the last point's coordinates.
   */
  getLastPoint(e) {
    let t = this.instructions.length - 1, r = this.instructions[t];
    if (!r)
      return e.x = 0, e.y = 0, e;
    for (; r.action === "closePath"; ) {
      if (t--, t < 0)
        return e.x = 0, e.y = 0, e;
      r = this.instructions[t];
    }
    switch (r.action) {
      case "moveTo":
      case "lineTo":
        e.x = r.data[0], e.y = r.data[1];
        break;
      case "quadraticCurveTo":
        e.x = r.data[2], e.y = r.data[3];
        break;
      case "bezierCurveTo":
        e.x = r.data[4], e.y = r.data[5];
        break;
      case "arc":
      case "arcToSvg":
        e.x = r.data[5], e.y = r.data[6];
        break;
      case "addPath":
        r.data[0].getLastPoint(e);
        break;
    }
    return e;
  }
}
function Nt(s, e) {
  return s ? s.prepend(e) : e.clone();
}
function ue(s, e, t) {
  const r = s.getAttribute(e);
  return r ? Number(r) : t;
}
function xf(s, e) {
  const t = s.querySelectorAll("defs");
  for (let r = 0; r < t.length; r++) {
    const i = t[r];
    for (let n = 0; n < i.children.length; n++) {
      const a = i.children[n];
      switch (a.nodeName.toLowerCase()) {
        case "lineargradient":
          e.defs[a.id] = yf(a);
          break;
        case "radialgradient":
          e.defs[a.id] = bf();
          break;
      }
    }
  }
}
function yf(s) {
  const e = ue(s, "x1", 0), t = ue(s, "y1", 0), r = ue(s, "x2", 1), i = ue(s, "y2", 0), n = s.getAttribute("gradientUnits") || "objectBoundingBox", a = new ot(
    e,
    t,
    r,
    i,
    n === "objectBoundingBox" ? "local" : "global"
  );
  for (let o = 0; o < s.children.length; o++) {
    const h = s.children[o], l = ue(h, "offset", 0), c = re.shared.setValue(h.getAttribute("stop-color")).toNumber();
    a.addColorStop(l, c);
  }
  return a;
}
function bf(s) {
  return V("[SVG Parser] Radial gradients are not yet supported"), new ot(0, 0, 1, 0);
}
function sa(s) {
  const e = s.match(/url\s*\(\s*['"]?\s*#([^'"\s)]+)\s*['"]?\s*\)/i);
  return e ? e[1] : "";
}
const ia = {
  // Fill properties
  fill: { type: "paint", default: 0 },
  // Fill color/gradient
  "fill-opacity": { type: "number", default: 1 },
  // Fill transparency
  // Stroke properties
  stroke: { type: "paint", default: 0 },
  // Stroke color/gradient
  "stroke-width": { type: "number", default: 1 },
  // Width of stroke
  "stroke-opacity": { type: "number", default: 1 },
  // Stroke transparency
  "stroke-linecap": { type: "string", default: "butt" },
  // End cap style: butt, round, square
  "stroke-linejoin": { type: "string", default: "miter" },
  // Join style: miter, round, bevel
  "stroke-miterlimit": { type: "number", default: 10 },
  // Limit on miter join sharpness
  "stroke-dasharray": { type: "string", default: "none" },
  // Dash pattern
  "stroke-dashoffset": { type: "number", default: 0 },
  // Offset for dash pattern
  // Global properties
  opacity: { type: "number", default: 1 }
  // Overall opacity
};
function nh(s, e) {
  const t = s.getAttribute("style"), r = {}, i = {}, n = {
    strokeStyle: r,
    fillStyle: i,
    useFill: !1,
    useStroke: !1
  };
  for (const a in ia) {
    const o = s.getAttribute(a);
    o && na(e, n, a, o.trim());
  }
  if (t) {
    const a = t.split(";");
    for (let o = 0; o < a.length; o++) {
      const h = a[o].trim(), [l, c] = h.split(":");
      ia[l] && na(e, n, l, c.trim());
    }
  }
  return {
    strokeStyle: n.useStroke ? r : null,
    fillStyle: n.useFill ? i : null,
    useFill: n.useFill,
    useStroke: n.useStroke
  };
}
function na(s, e, t, r) {
  switch (t) {
    case "stroke":
      if (r !== "none") {
        if (r.startsWith("url(")) {
          const i = sa(r);
          e.strokeStyle.fill = s.defs[i];
        } else
          e.strokeStyle.color = re.shared.setValue(r).toNumber();
        e.useStroke = !0;
      }
      break;
    case "stroke-width":
      e.strokeStyle.width = Number(r);
      break;
    case "fill":
      if (r !== "none") {
        if (r.startsWith("url(")) {
          const i = sa(r);
          e.fillStyle.fill = s.defs[i];
        } else
          e.fillStyle.color = re.shared.setValue(r).toNumber();
        e.useFill = !0;
      }
      break;
    case "fill-opacity":
      e.fillStyle.alpha = Number(r);
      break;
    case "stroke-opacity":
      e.strokeStyle.alpha = Number(r);
      break;
    case "opacity":
      e.fillStyle.alpha = Number(r), e.strokeStyle.alpha = Number(r);
      break;
  }
}
function vf(s, e) {
  if (typeof s == "string") {
    const a = document.createElement("div");
    a.innerHTML = s.trim(), s = a.querySelector("svg");
  }
  const t = {
    context: e,
    defs: {},
    path: new Bt()
  };
  xf(s, t);
  const r = s.children, { fillStyle: i, strokeStyle: n } = nh(s, t);
  for (let a = 0; a < r.length; a++) {
    const o = r[a];
    o.nodeName.toLowerCase() !== "defs" && ah(o, t, i, n);
  }
  return e;
}
function ah(s, e, t, r) {
  const i = s.children, { fillStyle: n, strokeStyle: a } = nh(s, e);
  n && t ? t = { ...t, ...n } : n && (t = n), a && r ? r = { ...r, ...a } : a && (r = a);
  const o = !t && !r;
  o && (t = { color: 0 });
  let h, l, c, u, d, f, p, g, m, y, T, S, A, M, P, E, N;
  switch (s.nodeName.toLowerCase()) {
    case "path":
      M = s.getAttribute("d"), s.getAttribute("fill-rule") === "evenodd" && V("SVG Evenodd fill rule not supported, your svg may render incorrectly"), P = new Bt(M, !0), e.context.path(P), t && e.context.fill(t), r && e.context.stroke(r);
      break;
    case "circle":
      p = ue(s, "cx", 0), g = ue(s, "cy", 0), m = ue(s, "r", 0), e.context.ellipse(p, g, m, m), t && e.context.fill(t), r && e.context.stroke(r);
      break;
    case "rect":
      h = ue(s, "x", 0), l = ue(s, "y", 0), E = ue(s, "width", 0), N = ue(s, "height", 0), y = ue(s, "rx", 0), T = ue(s, "ry", 0), y || T ? e.context.roundRect(h, l, E, N, y || T) : e.context.rect(h, l, E, N), t && e.context.fill(t), r && e.context.stroke(r);
      break;
    case "ellipse":
      p = ue(s, "cx", 0), g = ue(s, "cy", 0), y = ue(s, "rx", 0), T = ue(s, "ry", 0), e.context.beginPath(), e.context.ellipse(p, g, y, T), t && e.context.fill(t), r && e.context.stroke(r);
      break;
    case "line":
      c = ue(s, "x1", 0), u = ue(s, "y1", 0), d = ue(s, "x2", 0), f = ue(s, "y2", 0), e.context.beginPath(), e.context.moveTo(c, u), e.context.lineTo(d, f), r && e.context.stroke(r);
      break;
    case "polygon":
      A = s.getAttribute("points"), S = A.match(/\d+/g).map((I) => parseInt(I, 10)), e.context.poly(S, !0), t && e.context.fill(t), r && e.context.stroke(r);
      break;
    case "polyline":
      A = s.getAttribute("points"), S = A.match(/\d+/g).map((I) => parseInt(I, 10)), e.context.poly(S, !1), r && e.context.stroke(r);
      break;
    case "g":
    case "svg":
      break;
    default: {
      V(`[SVG parser] <${s.nodeName}> elements unsupported`);
      break;
    }
  }
  o && (t = null);
  for (let I = 0; I < i.length; I++)
    ah(i[I], e, t, r);
}
function Tf(s) {
  return re.isColorLike(s);
}
function aa(s) {
  return s instanceof $r;
}
function oa(s) {
  return s instanceof ot;
}
function Sf(s) {
  return s instanceof D;
}
function wf(s, e, t) {
  const r = re.shared.setValue(e ?? 0);
  return s.color = r.toNumber(), s.alpha = r.alpha === 1 ? t.alpha : r.alpha, s.texture = D.WHITE, { ...t, ...s };
}
function Af(s, e, t) {
  return s.texture = e, { ...t, ...s };
}
function ha(s, e, t) {
  return s.fill = e, s.color = 16777215, s.texture = e.texture, s.matrix = e.transform, { ...t, ...s };
}
function la(s, e, t) {
  return e.buildGradient(), s.fill = e, s.color = 16777215, s.texture = e.texture, s.matrix = e.transform, s.textureSpace = e.textureSpace, { ...t, ...s };
}
function Pf(s, e) {
  const t = { ...e, ...s }, r = re.shared.setValue(t.color);
  return t.alpha *= r.alpha, t.color = r.toNumber(), t;
}
function gt(s, e) {
  if (s == null)
    return null;
  const t = {}, r = s;
  return Tf(s) ? wf(t, s, e) : Sf(s) ? Af(t, s, e) : aa(s) ? ha(t, s, e) : oa(s) ? la(t, s, e) : r.fill && aa(r.fill) ? ha(r, r.fill, e) : r.fill && oa(r.fill) ? la(r, r.fill, e) : Pf(r, e);
}
function Or(s, e) {
  const { width: t, alignment: r, miterLimit: i, cap: n, join: a, pixelLine: o, ...h } = e, l = gt(s, h);
  return l ? {
    width: t,
    alignment: r,
    miterLimit: i,
    cap: n,
    join: a,
    pixelLine: o,
    ...l
  } : null;
}
const Cf = new oe(), ca = new L(), Ii = class ze extends Me {
  constructor() {
    super(...arguments), this.uid = le("graphicsContext"), this.dirty = !0, this.batchMode = "auto", this.instructions = [], this._activePath = new Bt(), this._transform = new L(), this._fillStyle = { ...ze.defaultFillStyle }, this._strokeStyle = { ...ze.defaultStrokeStyle }, this._stateStack = [], this._tick = 0, this._bounds = new ye(), this._boundsDirty = !0;
  }
  /**
   * Creates a new GraphicsContext object that is a clone of this instance, copying all properties,
   * including the current drawing state, transformations, styles, and instructions.
   * @returns A new GraphicsContext instance with the same properties and state as this one.
   */
  clone() {
    const e = new ze();
    return e.batchMode = this.batchMode, e.instructions = this.instructions.slice(), e._activePath = this._activePath.clone(), e._transform = this._transform.clone(), e._fillStyle = { ...this._fillStyle }, e._strokeStyle = { ...this._strokeStyle }, e._stateStack = this._stateStack.slice(), e._bounds = this._bounds.clone(), e._boundsDirty = !0, e;
  }
  /**
   * The current fill style of the graphics context. This can be a color, gradient, pattern, or a more complex style defined by a FillStyle object.
   */
  get fillStyle() {
    return this._fillStyle;
  }
  set fillStyle(e) {
    this._fillStyle = gt(e, ze.defaultFillStyle);
  }
  /**
   * The current stroke style of the graphics context. Similar to fill styles, stroke styles can encompass colors, gradients, patterns, or more detailed configurations via a StrokeStyle object.
   */
  get strokeStyle() {
    return this._strokeStyle;
  }
  set strokeStyle(e) {
    this._strokeStyle = Or(e, ze.defaultStrokeStyle);
  }
  /**
   * Sets the current fill style of the graphics context. The fill style can be a color, gradient,
   * pattern, or a more complex style defined by a FillStyle object.
   * @param style - The fill style to apply. This can be a simple color, a gradient or pattern object,
   *                or a FillStyle or ConvertedFillStyle object.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  setFillStyle(e) {
    return this._fillStyle = gt(e, ze.defaultFillStyle), this;
  }
  /**
   * Sets the current stroke style of the graphics context. Similar to fill styles, stroke styles can
   * encompass colors, gradients, patterns, or more detailed configurations via a StrokeStyle object.
   * @param style - The stroke style to apply. Can be defined as a color, a gradient or pattern,
   *                or a StrokeStyle or ConvertedStrokeStyle object.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  setStrokeStyle(e) {
    return this._strokeStyle = gt(e, ze.defaultStrokeStyle), this;
  }
  texture(e, t, r, i, n, a) {
    return this.instructions.push({
      action: "texture",
      data: {
        image: e,
        dx: r || 0,
        dy: i || 0,
        dw: n || e.frame.width,
        dh: a || e.frame.height,
        transform: this._transform.clone(),
        alpha: this._fillStyle.alpha,
        style: t ? re.shared.setValue(t).toNumber() : 16777215
      }
    }), this.onUpdate(), this;
  }
  /**
   * Resets the current path. Any previous path and its commands are discarded and a new path is
   * started. This is typically called before beginning a new shape or series of drawing commands.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  beginPath() {
    return this._activePath = new Bt(), this;
  }
  fill(e, t) {
    let r;
    const i = this.instructions[this.instructions.length - 1];
    return this._tick === 0 && i && i.action === "stroke" ? r = i.data.path : r = this._activePath.clone(), r ? (e != null && (t !== void 0 && typeof e == "number" && (X(Y, "GraphicsContext.fill(color, alpha) is deprecated, use GraphicsContext.fill({ color, alpha }) instead"), e = { color: e, alpha: t }), this._fillStyle = gt(e, ze.defaultFillStyle)), this.instructions.push({
      action: "fill",
      // TODO copy fill style!
      data: { style: this.fillStyle, path: r }
    }), this.onUpdate(), this._initNextPathLocation(), this._tick = 0, this) : this;
  }
  _initNextPathLocation() {
    const { x: e, y: t } = this._activePath.getLastPoint(oe.shared);
    this._activePath.clear(), this._activePath.moveTo(e, t);
  }
  /**
   * Strokes the current path with the current stroke style. This method can take an optional
   * FillInput parameter to define the stroke's appearance, including its color, width, and other properties.
   * @param style - (Optional) The stroke style to apply. Can be defined as a simple color or a more complex style object. If omitted, uses the current stroke style.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  stroke(e) {
    let t;
    const r = this.instructions[this.instructions.length - 1];
    return this._tick === 0 && r && r.action === "fill" ? t = r.data.path : t = this._activePath.clone(), t ? (e != null && (this._strokeStyle = Or(e, ze.defaultStrokeStyle)), this.instructions.push({
      action: "stroke",
      // TODO copy fill style!
      data: { style: this.strokeStyle, path: t }
    }), this.onUpdate(), this._initNextPathLocation(), this._tick = 0, this) : this;
  }
  /**
   * Applies a cutout to the last drawn shape. This is used to create holes or complex shapes by
   * subtracting a path from the previously drawn path. If a hole is not completely in a shape, it will
   * fail to cut correctly!
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  cut() {
    for (let e = 0; e < 2; e++) {
      const t = this.instructions[this.instructions.length - 1 - e], r = this._activePath.clone();
      if (t && (t.action === "stroke" || t.action === "fill"))
        if (t.data.hole)
          t.data.hole.addPath(r);
        else {
          t.data.hole = r;
          break;
        }
    }
    return this._initNextPathLocation(), this;
  }
  /**
   * Adds an arc to the current path, which is centered at (x, y) with the specified radius,
   * starting and ending angles, and direction.
   * @param x - The x-coordinate of the arc's center.
   * @param y - The y-coordinate of the arc's center.
   * @param radius - The arc's radius.
   * @param startAngle - The starting angle, in radians.
   * @param endAngle - The ending angle, in radians.
   * @param counterclockwise - (Optional) Specifies whether the arc is drawn counterclockwise (true) or clockwise (false). Defaults to false.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  arc(e, t, r, i, n, a) {
    this._tick++;
    const o = this._transform;
    return this._activePath.arc(
      o.a * e + o.c * t + o.tx,
      o.b * e + o.d * t + o.ty,
      r,
      i,
      n,
      a
    ), this;
  }
  /**
   * Adds an arc to the current path with the given control points and radius, connected to the previous point
   * by a straight line if necessary.
   * @param x1 - The x-coordinate of the first control point.
   * @param y1 - The y-coordinate of the first control point.
   * @param x2 - The x-coordinate of the second control point.
   * @param y2 - The y-coordinate of the second control point.
   * @param radius - The arc's radius.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  arcTo(e, t, r, i, n) {
    this._tick++;
    const a = this._transform;
    return this._activePath.arcTo(
      a.a * e + a.c * t + a.tx,
      a.b * e + a.d * t + a.ty,
      a.a * r + a.c * i + a.tx,
      a.b * r + a.d * i + a.ty,
      n
    ), this;
  }
  /**
   * Adds an SVG-style arc to the path, allowing for elliptical arcs based on the SVG spec.
   * @param rx - The x-radius of the ellipse.
   * @param ry - The y-radius of the ellipse.
   * @param xAxisRotation - The rotation of the ellipse's x-axis relative
   * to the x-axis of the coordinate system, in degrees.
   * @param largeArcFlag - Determines if the arc should be greater than or less than 180 degrees.
   * @param sweepFlag - Determines if the arc should be swept in a positive angle direction.
   * @param x - The x-coordinate of the arc's end point.
   * @param y - The y-coordinate of the arc's end point.
   * @returns The instance of the current object for chaining.
   */
  arcToSvg(e, t, r, i, n, a, o) {
    this._tick++;
    const h = this._transform;
    return this._activePath.arcToSvg(
      e,
      t,
      r,
      // should we rotate this with transform??
      i,
      n,
      h.a * a + h.c * o + h.tx,
      h.b * a + h.d * o + h.ty
    ), this;
  }
  /**
   * Adds a cubic Bezier curve to the path.
   * It requires three points: the first two are control points and the third one is the end point.
   * The starting point is the last point in the current path.
   * @param cp1x - The x-coordinate of the first control point.
   * @param cp1y - The y-coordinate of the first control point.
   * @param cp2x - The x-coordinate of the second control point.
   * @param cp2y - The y-coordinate of the second control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */
  bezierCurveTo(e, t, r, i, n, a, o) {
    this._tick++;
    const h = this._transform;
    return this._activePath.bezierCurveTo(
      h.a * e + h.c * t + h.tx,
      h.b * e + h.d * t + h.ty,
      h.a * r + h.c * i + h.tx,
      h.b * r + h.d * i + h.ty,
      h.a * n + h.c * a + h.tx,
      h.b * n + h.d * a + h.ty,
      o
    ), this;
  }
  /**
   * Closes the current path by drawing a straight line back to the start.
   * If the shape is already closed or there are no points in the path, this method does nothing.
   * @returns The instance of the current object for chaining.
   */
  closePath() {
    var e;
    return this._tick++, (e = this._activePath) == null || e.closePath(), this;
  }
  /**
   * Draws an ellipse at the specified location and with the given x and y radii.
   * An optional transformation can be applied, allowing for rotation, scaling, and translation.
   * @param x - The x-coordinate of the center of the ellipse.
   * @param y - The y-coordinate of the center of the ellipse.
   * @param radiusX - The horizontal radius of the ellipse.
   * @param radiusY - The vertical radius of the ellipse.
   * @returns The instance of the current object for chaining.
   */
  ellipse(e, t, r, i) {
    return this._tick++, this._activePath.ellipse(e, t, r, i, this._transform.clone()), this;
  }
  /**
   * Draws a circle shape. This method adds a new circle path to the current drawing.
   * @param x - The x-coordinate of the center of the circle.
   * @param y - The y-coordinate of the center of the circle.
   * @param radius - The radius of the circle.
   * @returns The instance of the current object for chaining.
   */
  circle(e, t, r) {
    return this._tick++, this._activePath.circle(e, t, r, this._transform.clone()), this;
  }
  /**
   * Adds another `GraphicsPath` to this path, optionally applying a transformation.
   * @param path - The `GraphicsPath` to add.
   * @returns The instance of the current object for chaining.
   */
  path(e) {
    return this._tick++, this._activePath.addPath(e, this._transform.clone()), this;
  }
  /**
   * Connects the current point to a new point with a straight line. This method updates the current path.
   * @param x - The x-coordinate of the new point to connect to.
   * @param y - The y-coordinate of the new point to connect to.
   * @returns The instance of the current object for chaining.
   */
  lineTo(e, t) {
    this._tick++;
    const r = this._transform;
    return this._activePath.lineTo(
      r.a * e + r.c * t + r.tx,
      r.b * e + r.d * t + r.ty
    ), this;
  }
  /**
   * Sets the starting point for a new sub-path. Any subsequent drawing commands are considered part of this path.
   * @param x - The x-coordinate for the starting point.
   * @param y - The y-coordinate for the starting point.
   * @returns The instance of the current object for chaining.
   */
  moveTo(e, t) {
    this._tick++;
    const r = this._transform, i = this._activePath.instructions, n = r.a * e + r.c * t + r.tx, a = r.b * e + r.d * t + r.ty;
    return i.length === 1 && i[0].action === "moveTo" ? (i[0].data[0] = n, i[0].data[1] = a, this) : (this._activePath.moveTo(
      n,
      a
    ), this);
  }
  /**
   * Adds a quadratic curve to the path. It requires two points: the control point and the end point.
   * The starting point is the last point in the current path.
   * @param cpx - The x-coordinate of the control point.
   * @param cpy - The y-coordinate of the control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */
  quadraticCurveTo(e, t, r, i, n) {
    this._tick++;
    const a = this._transform;
    return this._activePath.quadraticCurveTo(
      a.a * e + a.c * t + a.tx,
      a.b * e + a.d * t + a.ty,
      a.a * r + a.c * i + a.tx,
      a.b * r + a.d * i + a.ty,
      n
    ), this;
  }
  /**
   * Draws a rectangle shape. This method adds a new rectangle path to the current drawing.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @returns The instance of the current object for chaining.
   */
  rect(e, t, r, i) {
    return this._tick++, this._activePath.rect(e, t, r, i, this._transform.clone()), this;
  }
  /**
   * Draws a rectangle with rounded corners.
   * The corner radius can be specified to determine how rounded the corners should be.
   * An optional transformation can be applied, which allows for rotation, scaling, and translation of the rectangle.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @param radius - The radius of the rectangle's corners. If not specified, corners will be sharp.
   * @returns The instance of the current object for chaining.
   */
  roundRect(e, t, r, i, n) {
    return this._tick++, this._activePath.roundRect(e, t, r, i, n, this._transform.clone()), this;
  }
  /**
   * Draws a polygon shape by specifying a sequence of points. This method allows for the creation of complex polygons,
   * which can be both open and closed. An optional transformation can be applied, enabling the polygon to be scaled,
   * rotated, or translated as needed.
   * @param points - An array of numbers, or an array of PointData objects eg [{x,y}, {x,y}, {x,y}]
   * representing the x and y coordinates, of the polygon's vertices, in sequence.
   * @param close - A boolean indicating whether to close the polygon path. True by default.
   */
  poly(e, t) {
    return this._tick++, this._activePath.poly(e, t, this._transform.clone()), this;
  }
  /**
   * Draws a regular polygon with a specified number of sides. All sides and angles are equal.
   * @param x - The x-coordinate of the center of the polygon.
   * @param y - The y-coordinate of the center of the polygon.
   * @param radius - The radius of the circumscribed circle of the polygon.
   * @param sides - The number of sides of the polygon. Must be 3 or more.
   * @param rotation - The rotation angle of the polygon, in radians. Zero by default.
   * @param transform - An optional `Matrix` object to apply a transformation to the polygon.
   * @returns The instance of the current object for chaining.
   */
  regularPoly(e, t, r, i, n = 0, a) {
    return this._tick++, this._activePath.regularPoly(e, t, r, i, n, a), this;
  }
  /**
   * Draws a polygon with rounded corners.
   * Similar to `regularPoly` but with the ability to round the corners of the polygon.
   * @param x - The x-coordinate of the center of the polygon.
   * @param y - The y-coordinate of the center of the polygon.
   * @param radius - The radius of the circumscribed circle of the polygon.
   * @param sides - The number of sides of the polygon. Must be 3 or more.
   * @param corner - The radius of the rounding of the corners.
   * @param rotation - The rotation angle of the polygon, in radians. Zero by default.
   * @returns The instance of the current object for chaining.
   */
  roundPoly(e, t, r, i, n, a) {
    return this._tick++, this._activePath.roundPoly(e, t, r, i, n, a), this;
  }
  /**
   * Draws a shape with rounded corners. This function supports custom radius for each corner of the shape.
   * Optionally, corners can be rounded using a quadratic curve instead of an arc, providing a different aesthetic.
   * @param points - An array of `RoundedPoint` representing the corners of the shape to draw.
   * A minimum of 3 points is required.
   * @param radius - The default radius for the corners.
   * This radius is applied to all corners unless overridden in `points`.
   * @param useQuadratic - If set to true, rounded corners are drawn using a quadraticCurve
   *  method instead of an arc method. Defaults to false.
   * @param smoothness - Specifies the smoothness of the curve when `useQuadratic` is true.
   * Higher values make the curve smoother.
   * @returns The instance of the current object for chaining.
   */
  roundShape(e, t, r, i) {
    return this._tick++, this._activePath.roundShape(e, t, r, i), this;
  }
  /**
   * Draw Rectangle with fillet corners. This is much like rounded rectangle
   * however it support negative numbers as well for the corner radius.
   * @param x - Upper left corner of rect
   * @param y - Upper right corner of rect
   * @param width - Width of rect
   * @param height - Height of rect
   * @param fillet - accept negative or positive values
   */
  filletRect(e, t, r, i, n) {
    return this._tick++, this._activePath.filletRect(e, t, r, i, n), this;
  }
  /**
   * Draw Rectangle with chamfer corners. These are angled corners.
   * @param x - Upper left corner of rect
   * @param y - Upper right corner of rect
   * @param width - Width of rect
   * @param height - Height of rect
   * @param chamfer - non-zero real number, size of corner cutout
   * @param transform
   */
  chamferRect(e, t, r, i, n, a) {
    return this._tick++, this._activePath.chamferRect(e, t, r, i, n, a), this;
  }
  /**
   * Draws a star shape centered at a specified location. This method allows for the creation
   *  of stars with a variable number of points, outer radius, optional inner radius, and rotation.
   * The star is drawn as a closed polygon with alternating outer and inner vertices to create the star's points.
   * An optional transformation can be applied to scale, rotate, or translate the star as needed.
   * @param x - The x-coordinate of the center of the star.
   * @param y - The y-coordinate of the center of the star.
   * @param points - The number of points of the star.
   * @param radius - The outer radius of the star (distance from the center to the outer points).
   * @param innerRadius - Optional. The inner radius of the star
   * (distance from the center to the inner points between the outer points).
   * If not provided, defaults to half of the `radius`.
   * @param rotation - Optional. The rotation of the star in radians, where 0 is aligned with the y-axis.
   * Defaults to 0, meaning one point is directly upward.
   * @returns The instance of the current object for chaining further drawing commands.
   */
  star(e, t, r, i, n = 0, a = 0) {
    return this._tick++, this._activePath.star(e, t, r, i, n, a, this._transform.clone()), this;
  }
  /**
   * Parses and renders an SVG string into the graphics context. This allows for complex shapes and paths
   * defined in SVG format to be drawn within the graphics context.
   * @param svg - The SVG string to be parsed and rendered.
   */
  svg(e) {
    return this._tick++, vf(e, this), this;
  }
  /**
   * Restores the most recently saved graphics state by popping the top of the graphics state stack.
   * This includes transformations, fill styles, and stroke styles.
   */
  restore() {
    const e = this._stateStack.pop();
    return e && (this._transform = e.transform, this._fillStyle = e.fillStyle, this._strokeStyle = e.strokeStyle), this;
  }
  /** Saves the current graphics state, including transformations, fill styles, and stroke styles, onto a stack. */
  save() {
    return this._stateStack.push({
      transform: this._transform.clone(),
      fillStyle: { ...this._fillStyle },
      strokeStyle: { ...this._strokeStyle }
    }), this;
  }
  /**
   * Returns the current transformation matrix of the graphics context.
   * @returns The current transformation matrix.
   */
  getTransform() {
    return this._transform;
  }
  /**
   * Resets the current transformation matrix to the identity matrix, effectively removing any transformations (rotation, scaling, translation) previously applied.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  resetTransform() {
    return this._transform.identity(), this;
  }
  /**
   * Applies a rotation transformation to the graphics context around the current origin.
   * @param angle - The angle of rotation in radians.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  rotate(e) {
    return this._transform.rotate(e), this;
  }
  /**
   * Applies a scaling transformation to the graphics context, scaling drawings by x horizontally and by y vertically.
   * @param x - The scale factor in the horizontal direction.
   * @param y - (Optional) The scale factor in the vertical direction. If not specified, the x value is used for both directions.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  scale(e, t = e) {
    return this._transform.scale(e, t), this;
  }
  setTransform(e, t, r, i, n, a) {
    return e instanceof L ? (this._transform.set(e.a, e.b, e.c, e.d, e.tx, e.ty), this) : (this._transform.set(e, t, r, i, n, a), this);
  }
  transform(e, t, r, i, n, a) {
    return e instanceof L ? (this._transform.append(e), this) : (ca.set(e, t, r, i, n, a), this._transform.append(ca), this);
  }
  /**
   * Applies a translation transformation to the graphics context, moving the origin by the specified amounts.
   * @param x - The amount to translate in the horizontal direction.
   * @param y - (Optional) The amount to translate in the vertical direction. If not specified, the x value is used for both directions.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  translate(e, t = e) {
    return this._transform.translate(e, t), this;
  }
  /**
   * Clears all drawing commands from the graphics context, effectively resetting it. This includes clearing the path,
   * and optionally resetting transformations to the identity matrix.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  clear() {
    return this._activePath.clear(), this.instructions.length = 0, this.resetTransform(), this.onUpdate(), this;
  }
  onUpdate() {
    this.dirty || (this.emit("update", this, 16), this.dirty = !0, this._boundsDirty = !0);
  }
  /** The bounds of the graphic shape. */
  get bounds() {
    if (!this._boundsDirty)
      return this._bounds;
    const e = this._bounds;
    e.clear();
    for (let t = 0; t < this.instructions.length; t++) {
      const r = this.instructions[t], i = r.action;
      if (i === "fill") {
        const n = r.data;
        e.addBounds(n.path.bounds);
      } else if (i === "texture") {
        const n = r.data;
        e.addFrame(n.dx, n.dy, n.dx + n.dw, n.dy + n.dh, n.transform);
      }
      if (i === "stroke") {
        const n = r.data, a = n.style.alignment, o = n.style.width * (1 - a), h = n.path.bounds;
        e.addFrame(
          h.minX - o,
          h.minY - o,
          h.maxX + o,
          h.maxY + o
        );
      }
    }
    return e;
  }
  /**
   * Check to see if a point is contained within this geometry.
   * @param point - Point to check if it's contained.
   * @returns {boolean} `true` if the point is contained within geometry.
   */
  containsPoint(e) {
    var i;
    if (!this.bounds.containsPoint(e.x, e.y))
      return !1;
    const t = this.instructions;
    let r = !1;
    for (let n = 0; n < t.length; n++) {
      const a = t[n], o = a.data, h = o.path;
      if (!a.action || !h)
        continue;
      const l = o.style, c = h.shapePath.shapePrimitives;
      for (let u = 0; u < c.length; u++) {
        const d = c[u].shape;
        if (!l || !d)
          continue;
        const f = c[u].transform, p = f ? f.applyInverse(e, Cf) : e;
        if (a.action === "fill")
          r = d.contains(p.x, p.y);
        else {
          const m = l;
          r = d.strokeContains(p.x, p.y, m.width, m.alignment);
        }
        const g = o.hole;
        if (g) {
          const m = (i = g.shapePath) == null ? void 0 : i.shapePrimitives;
          if (m)
            for (let y = 0; y < m.length; y++)
              m[y].shape.contains(p.x, p.y) && (r = !1);
        }
        if (r)
          return !0;
      }
    }
    return r;
  }
  /**
   * Destroys the GraphicsData object.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @param {boolean} [options.texture=false] - Should it destroy the current texture of the fill/stroke style?
   * @param {boolean} [options.textureSource=false] - Should it destroy the texture source of the fill/stroke style?
   */
  destroy(e = !1) {
    if (this._stateStack.length = 0, this._transform = null, this.emit("destroy", this), this.removeAllListeners(), typeof e == "boolean" ? e : e == null ? void 0 : e.texture) {
      const r = typeof e == "boolean" ? e : e == null ? void 0 : e.textureSource;
      this._fillStyle.texture && this._fillStyle.texture.destroy(r), this._strokeStyle.texture && this._strokeStyle.texture.destroy(r);
    }
    this._fillStyle = null, this._strokeStyle = null, this.instructions = null, this._activePath = null, this._bounds = null, this._stateStack = null, this.customShader = null, this._transform = null;
  }
};
Ii.defaultFillStyle = {
  /** The color to use for the fill. */
  color: 16777215,
  /** The alpha value to use for the fill. */
  alpha: 1,
  /** The texture to use for the fill. */
  texture: D.WHITE,
  /** The matrix to apply. */
  matrix: null,
  /** The fill pattern to use. */
  fill: null,
  /** Whether coordinates are 'global' or 'local' */
  textureSpace: "local"
};
Ii.defaultStrokeStyle = {
  /** The width of the stroke. */
  width: 1,
  /** The color to use for the stroke. */
  color: 16777215,
  /** The alpha value to use for the stroke. */
  alpha: 1,
  /** The alignment of the stroke. */
  alignment: 0.5,
  /** The miter limit to use. */
  miterLimit: 10,
  /** The line cap style to use. */
  cap: "butt",
  /** The line join style to use. */
  join: "miter",
  /** The texture to use for the fill. */
  texture: D.WHITE,
  /** The matrix to apply. */
  matrix: null,
  /** The fill pattern to use. */
  fill: null,
  /** Whether coordinates are 'global' or 'local' */
  textureSpace: "local",
  /** If the stroke is a pixel line. */
  pixelLine: !1
};
let Be = Ii;
const ua = [
  "align",
  "breakWords",
  "cssOverrides",
  "fontVariant",
  "fontWeight",
  "leading",
  "letterSpacing",
  "lineHeight",
  "padding",
  "textBaseline",
  "trim",
  "whiteSpace",
  "wordWrap",
  "wordWrapWidth",
  "fontFamily",
  "fontStyle",
  "fontSize"
];
function oh(s) {
  const e = [];
  let t = 0;
  for (let r = 0; r < ua.length; r++) {
    const i = `_${ua[r]}`;
    e[t++] = s[i];
  }
  return t = hh(s._fill, e, t), t = Ef(s._stroke, e, t), t = Mf(s.dropShadow, e, t), e.join("-");
}
function hh(s, e, t) {
  var r;
  return s && (e[t++] = s.color, e[t++] = s.alpha, e[t++] = (r = s.fill) == null ? void 0 : r.styleKey), t;
}
function Ef(s, e, t) {
  return s && (t = hh(s, e, t), e[t++] = s.width, e[t++] = s.alignment, e[t++] = s.cap, e[t++] = s.join, e[t++] = s.miterLimit), t;
}
function Mf(s, e, t) {
  return s && (e[t++] = s.alpha, e[t++] = s.angle, e[t++] = s.blur, e[t++] = s.distance, e[t++] = re.shared.setValue(s.color).toNumber()), t;
}
const Gi = class wt extends Me {
  constructor(e = {}) {
    super(), Bf(e);
    const t = { ...wt.defaultTextStyle, ...e };
    for (const r in t) {
      const i = r;
      this[i] = t[r];
    }
    this.update();
  }
  /**
   * Alignment for multiline text, does not affect single line text.
   * @member {'left'|'center'|'right'|'justify'}
   */
  get align() {
    return this._align;
  }
  set align(e) {
    this._align = e, this.update();
  }
  /** Indicates if lines can be wrapped within words, it needs wordWrap to be set to true. */
  get breakWords() {
    return this._breakWords;
  }
  set breakWords(e) {
    this._breakWords = e, this.update();
  }
  /** Set a drop shadow for the text. */
  get dropShadow() {
    return this._dropShadow;
  }
  set dropShadow(e) {
    e !== null && typeof e == "object" ? this._dropShadow = this._createProxy({ ...wt.defaultDropShadow, ...e }) : this._dropShadow = e ? this._createProxy({ ...wt.defaultDropShadow }) : null, this.update();
  }
  /** The font family, can be a single font name, or a list of names where the first is the preferred font. */
  get fontFamily() {
    return this._fontFamily;
  }
  set fontFamily(e) {
    this._fontFamily = e, this.update();
  }
  /** The font size (as a number it converts to px, but as a string, equivalents are '26px','20pt','160%' or '1.6em') */
  get fontSize() {
    return this._fontSize;
  }
  set fontSize(e) {
    typeof e == "string" ? this._fontSize = parseInt(e, 10) : this._fontSize = e, this.update();
  }
  /**
   * The font style.
   * @member {'normal'|'italic'|'oblique'}
   */
  get fontStyle() {
    return this._fontStyle;
  }
  set fontStyle(e) {
    this._fontStyle = e.toLowerCase(), this.update();
  }
  /**
   * The font variant.
   * @member {'normal'|'small-caps'}
   */
  get fontVariant() {
    return this._fontVariant;
  }
  set fontVariant(e) {
    this._fontVariant = e, this.update();
  }
  /**
   * The font weight.
   * @member {'normal'|'bold'|'bolder'|'lighter'|'100'|'200'|'300'|'400'|'500'|'600'|'700'|'800'|'900'}
   */
  get fontWeight() {
    return this._fontWeight;
  }
  set fontWeight(e) {
    this._fontWeight = e, this.update();
  }
  /** The space between lines. */
  get leading() {
    return this._leading;
  }
  set leading(e) {
    this._leading = e, this.update();
  }
  /** The amount of spacing between letters, default is 0. */
  get letterSpacing() {
    return this._letterSpacing;
  }
  set letterSpacing(e) {
    this._letterSpacing = e, this.update();
  }
  /** The line height, a number that represents the vertical space that a letter uses. */
  get lineHeight() {
    return this._lineHeight;
  }
  set lineHeight(e) {
    this._lineHeight = e, this.update();
  }
  /**
   * Occasionally some fonts are cropped. Adding some padding will prevent this from happening
   * by adding padding to all sides of the text.
   */
  get padding() {
    return this._padding;
  }
  set padding(e) {
    this._padding = e, this.update();
  }
  /** Trim transparent borders. This is an expensive operation so only use this if you have to! */
  get trim() {
    return this._trim;
  }
  set trim(e) {
    this._trim = e, this.update();
  }
  /**
   * The baseline of the text that is rendered.
   * @member {'alphabetic'|'top'|'hanging'|'middle'|'ideographic'|'bottom'}
   */
  get textBaseline() {
    return this._textBaseline;
  }
  set textBaseline(e) {
    this._textBaseline = e, this.update();
  }
  /**
   * How newlines and spaces should be handled.
   * Default is 'pre' (preserve, preserve).
   *
   *  value       | New lines     |   Spaces
   *  ---         | ---           |   ---
   * 'normal'     | Collapse      |   Collapse
   * 'pre'        | Preserve      |   Preserve
   * 'pre-line'   | Preserve      |   Collapse
   * @member {'normal'|'pre'|'pre-line'}
   */
  get whiteSpace() {
    return this._whiteSpace;
  }
  set whiteSpace(e) {
    this._whiteSpace = e, this.update();
  }
  /** Indicates if word wrap should be used. */
  get wordWrap() {
    return this._wordWrap;
  }
  set wordWrap(e) {
    this._wordWrap = e, this.update();
  }
  /** The width at which text will wrap, it needs wordWrap to be set to true. */
  get wordWrapWidth() {
    return this._wordWrapWidth;
  }
  set wordWrapWidth(e) {
    this._wordWrapWidth = e, this.update();
  }
  /**
   * The fill style that will be used to color the text.
   * This can be:
   * - A color string like 'red', '#00FF00', or 'rgba(255,0,0,0.5)'
   * - A hex number like 0xff0000 for red
   * - A FillStyle object with properties like { color: 0xff0000, alpha: 0.5 }
   * - A FillGradient for gradient fills
   * - A FillPattern for pattern/texture fills
   *
   * When using a FillGradient, vertical gradients (angle of 90 degrees) are applied per line of text,
   * while gradients at any other angle are spread across the entire text body as a whole.
   * @example
   * // Vertical gradient applied per line
   * const verticalGradient = new FillGradient(0, 0, 0, 1)
   *     .addColorStop(0, 0xff0000)
   *     .addColorStop(1, 0x0000ff);
   *
   * const text = new Text({
   *     text: 'Line 1\nLine 2',
   *     style: { fill: verticalGradient }
   * });
   *
   * To manage the gradient in a global scope, set the textureSpace property of the FillGradient to 'global'.
   * @type {string|number|FillStyle|FillGradient|FillPattern}
   */
  get fill() {
    return this._originalFill;
  }
  set fill(e) {
    e !== this._originalFill && (this._originalFill = e, this._isFillStyle(e) && (this._originalFill = this._createProxy({ ...Be.defaultFillStyle, ...e }, () => {
      this._fill = gt(
        { ...this._originalFill },
        Be.defaultFillStyle
      );
    })), this._fill = gt(
      e === 0 ? "black" : e,
      Be.defaultFillStyle
    ), this.update());
  }
  /** A fillstyle that will be used on the text stroke, e.g., 'blue', '#FCFF00'. */
  get stroke() {
    return this._originalStroke;
  }
  set stroke(e) {
    e !== this._originalStroke && (this._originalStroke = e, this._isFillStyle(e) && (this._originalStroke = this._createProxy({ ...Be.defaultStrokeStyle, ...e }, () => {
      this._stroke = Or(
        { ...this._originalStroke },
        Be.defaultStrokeStyle
      );
    })), this._stroke = Or(e, Be.defaultStrokeStyle), this.update());
  }
  _generateKey() {
    return this._styleKey = oh(this), this._styleKey;
  }
  update() {
    this._styleKey = null, this.emit("update", this);
  }
  /** Resets all properties to the default values */
  reset() {
    const e = wt.defaultTextStyle;
    for (const t in e)
      this[t] = e[t];
  }
  get styleKey() {
    return this._styleKey || this._generateKey();
  }
  /**
   * Creates a new TextStyle object with the same values as this one.
   * @returns New cloned TextStyle object
   */
  clone() {
    return new wt({
      align: this.align,
      breakWords: this.breakWords,
      dropShadow: this._dropShadow ? { ...this._dropShadow } : null,
      fill: this._fill,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      fontStyle: this.fontStyle,
      fontVariant: this.fontVariant,
      fontWeight: this.fontWeight,
      leading: this.leading,
      letterSpacing: this.letterSpacing,
      lineHeight: this.lineHeight,
      padding: this.padding,
      stroke: this._stroke,
      textBaseline: this.textBaseline,
      whiteSpace: this.whiteSpace,
      wordWrap: this.wordWrap,
      wordWrapWidth: this.wordWrapWidth
    });
  }
  /**
   * Destroys this text style.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @param {boolean} [options.texture=false] - Should it destroy the texture of the this style
   * @param {boolean} [options.textureSource=false] - Should it destroy the textureSource of the this style
   */
  destroy(e = !1) {
    var r, i, n, a;
    if (this.removeAllListeners(), typeof e == "boolean" ? e : e == null ? void 0 : e.texture) {
      const o = typeof e == "boolean" ? e : e == null ? void 0 : e.textureSource;
      (r = this._fill) != null && r.texture && this._fill.texture.destroy(o), (i = this._originalFill) != null && i.texture && this._originalFill.texture.destroy(o), (n = this._stroke) != null && n.texture && this._stroke.texture.destroy(o), (a = this._originalStroke) != null && a.texture && this._originalStroke.texture.destroy(o);
    }
    this._fill = null, this._stroke = null, this.dropShadow = null, this._originalStroke = null, this._originalFill = null;
  }
  _createProxy(e, t) {
    return new Proxy(e, {
      set: (r, i, n) => (r[i] = n, t == null || t(i, n), this.update(), !0)
    });
  }
  _isFillStyle(e) {
    return (e ?? null) !== null && !(re.isColorLike(e) || e instanceof ot || e instanceof $r);
  }
};
Gi.defaultDropShadow = {
  /** Set alpha for the drop shadow */
  alpha: 1,
  /** Set a angle of the drop shadow */
  angle: Math.PI / 6,
  /** Set a shadow blur radius */
  blur: 0,
  /** A fill style to be used on the  e.g., 'red', '#00FF00' */
  color: "black",
  /** Set a distance of the drop shadow */
  distance: 5
};
Gi.defaultTextStyle = {
  /**
   * See {@link TextStyle.align}
   * @type {'left'|'center'|'right'|'justify'}
   */
  align: "left",
  /** See {@link TextStyle.breakWords} */
  breakWords: !1,
  /** See {@link TextStyle.dropShadow} */
  dropShadow: null,
  /**
   * See {@link TextStyle.fill}
   * @type {string|string[]|number|number[]|CanvasGradient|CanvasPattern}
   */
  fill: "black",
  /**
   * See {@link TextStyle.fontFamily}
   * @type {string|string[]}
   */
  fontFamily: "Arial",
  /**
   * See {@link TextStyle.fontSize}
   * @type {number|string}
   */
  fontSize: 26,
  /**
   * See {@link TextStyle.fontStyle}
   * @type {'normal'|'italic'|'oblique'}
   */
  fontStyle: "normal",
  /**
   * See {@link TextStyle.fontVariant}
   * @type {'normal'|'small-caps'}
   */
  fontVariant: "normal",
  /**
   * See {@link TextStyle.fontWeight}
   * @type {'normal'|'bold'|'bolder'|'lighter'|'100'|'200'|'300'|'400'|'500'|'600'|'700'|'800'|'900'}
   */
  fontWeight: "normal",
  /** See {@link TextStyle.leading} */
  leading: 0,
  /** See {@link TextStyle.letterSpacing} */
  letterSpacing: 0,
  /** See {@link TextStyle.lineHeight} */
  lineHeight: 0,
  /** See {@link TextStyle.padding} */
  padding: 0,
  /**
   * See {@link TextStyle.stroke}
   * @type {string|number}
   */
  stroke: null,
  /**
   * See {@link TextStyle.textBaseline}
   * @type {'alphabetic'|'top'|'hanging'|'middle'|'ideographic'|'bottom'}
   */
  textBaseline: "alphabetic",
  /** See {@link TextStyle.trim} */
  trim: !1,
  /**
   * See {@link TextStyle.whiteSpace}
   * @type {'normal'|'pre'|'pre-line'}
   */
  whiteSpace: "pre",
  /** See {@link TextStyle.wordWrap} */
  wordWrap: !1,
  /** See {@link TextStyle.wordWrapWidth} */
  wordWrapWidth: 100
};
let tt = Gi;
function Bf(s) {
  const e = s;
  if (typeof e.dropShadow == "boolean" && e.dropShadow) {
    const t = tt.defaultDropShadow;
    s.dropShadow = {
      alpha: e.dropShadowAlpha ?? t.alpha,
      angle: e.dropShadowAngle ?? t.angle,
      blur: e.dropShadowBlur ?? t.blur,
      color: e.dropShadowColor ?? t.color,
      distance: e.dropShadowDistance ?? t.distance
    };
  }
  if (e.strokeThickness !== void 0) {
    X(Y, "strokeThickness is now a part of stroke");
    const t = e.stroke;
    let r = {};
    if (re.isColorLike(t))
      r.color = t;
    else if (t instanceof ot || t instanceof $r)
      r.fill = t;
    else if (Object.hasOwnProperty.call(t, "color") || Object.hasOwnProperty.call(t, "fill"))
      r = t;
    else
      throw new Error("Invalid stroke value.");
    s.stroke = {
      ...r,
      width: e.strokeThickness
    };
  }
  if (Array.isArray(e.fillGradientStops)) {
    X(Y, "gradient fill is now a fill pattern: `new FillGradient(...)`");
    let t;
    s.fontSize == null ? s.fontSize = tt.defaultTextStyle.fontSize : typeof s.fontSize == "string" ? t = parseInt(s.fontSize, 10) : t = s.fontSize;
    const r = new ot({
      start: { x: 0, y: 0 },
      end: { x: 0, y: (t || 0) * 1.7 }
    }), i = e.fillGradientStops.map((n) => re.shared.setValue(n).toNumber());
    i.forEach((n, a) => {
      const o = a / (i.length - 1);
      r.addColorStop(o, n);
    }), s.fill = {
      fill: r
    };
  }
}
class Rf {
  constructor(e) {
    this._canvasPool = /* @__PURE__ */ Object.create(null), this.canvasOptions = e || {}, this.enableFullScreen = !1;
  }
  /**
   * Creates texture with params that were specified in pool constructor.
   * @param pixelWidth - Width of texture in pixels.
   * @param pixelHeight - Height of texture in pixels.
   */
  _createCanvasAndContext(e, t) {
    const r = Z.get().createCanvas();
    r.width = e, r.height = t;
    const i = r.getContext("2d");
    return { canvas: r, context: i };
  }
  /**
   * Gets a Power-of-Two render texture or fullScreen texture
   * @param minWidth - The minimum width of the render texture.
   * @param minHeight - The minimum height of the render texture.
   * @param resolution - The resolution of the render texture.
   * @returns The new render texture.
   */
  getOptimalCanvasAndContext(e, t, r = 1) {
    e = Math.ceil(e * r - 1e-6), t = Math.ceil(t * r - 1e-6), e = Et(e), t = Et(t);
    const i = (e << 17) + (t << 1);
    this._canvasPool[i] || (this._canvasPool[i] = []);
    let n = this._canvasPool[i].pop();
    return n || (n = this._createCanvasAndContext(e, t)), n;
  }
  /**
   * Place a render texture back into the pool.
   * @param canvasAndContext
   */
  returnCanvasAndContext(e) {
    const t = e.canvas, { width: r, height: i } = t, n = (r << 17) + (i << 1);
    e.context.clearRect(0, 0, r, i), this._canvasPool[n].push(e);
  }
  clear() {
    this._canvasPool = {};
  }
}
const et = new Rf(), kf = [
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui"
];
function Lr(s) {
  const e = typeof s.fontSize == "number" ? `${s.fontSize}px` : s.fontSize;
  let t = s.fontFamily;
  Array.isArray(s.fontFamily) || (t = s.fontFamily.split(","));
  for (let r = t.length - 1; r >= 0; r--) {
    let i = t[r].trim();
    !/([\"\'])[^\'\"]+\1/.test(i) && !kf.includes(i) && (i = `"${i}"`), t[r] = i;
  }
  return `${s.fontStyle} ${s.fontVariant} ${s.fontWeight} ${e} ${t.join(",")}`;
}
const Ps = {
  // TextMetrics requires getImageData readback for measuring fonts.
  willReadFrequently: !0
}, Le = class O {
  /**
   * Checking that we can use modern canvas 2D API.
   *
   * Note: This is an unstable API, Chrome < 94 use `textLetterSpacing`, later versions use `letterSpacing`.
   * @see TextMetrics.experimentalLetterSpacing
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ICanvasRenderingContext2D/letterSpacing
   * @see https://developer.chrome.com/origintrials/#/view_trial/3585991203293757441
   */
  static get experimentalLetterSpacingSupported() {
    let e = O._experimentalLetterSpacingSupported;
    if (e !== void 0) {
      const t = Z.get().getCanvasRenderingContext2D().prototype;
      e = O._experimentalLetterSpacingSupported = "letterSpacing" in t || "textLetterSpacing" in t;
    }
    return e;
  }
  /**
   * @param text - the text that was measured
   * @param style - the style that was measured
   * @param width - the measured width of the text
   * @param height - the measured height of the text
   * @param lines - an array of the lines of text broken by new lines and wrapping if specified in style
   * @param lineWidths - an array of the line widths for each line matched to `lines`
   * @param lineHeight - the measured line height for this style
   * @param maxLineWidth - the maximum line width for all measured lines
   * @param {FontMetrics} fontProperties - the font properties object from TextMetrics.measureFont
   */
  constructor(e, t, r, i, n, a, o, h, l) {
    this.text = e, this.style = t, this.width = r, this.height = i, this.lines = n, this.lineWidths = a, this.lineHeight = o, this.maxLineWidth = h, this.fontProperties = l;
  }
  /**
   * Measures the supplied string of text and returns a Rectangle.
   * @param text - The text to measure.
   * @param style - The text style to use for measuring
   * @param canvas - optional specification of the canvas to use for measuring.
   * @param wordWrap
   * @returns Measured width and height of the text.
   */
  static measureText(e = " ", t, r = O._canvas, i = t.wordWrap) {
    var T;
    const n = `${e}:${t.styleKey}`;
    if (O._measurementCache[n])
      return O._measurementCache[n];
    const a = Lr(t), o = O.measureFont(a);
    o.fontSize === 0 && (o.fontSize = t.fontSize, o.ascent = t.fontSize);
    const h = O.__context;
    h.font = a;
    const c = (i ? O._wordWrap(e, t, r) : e).split(/(?:\r\n|\r|\n)/), u = new Array(c.length);
    let d = 0;
    for (let S = 0; S < c.length; S++) {
      const A = O._measureText(c[S], t.letterSpacing, h);
      u[S] = A, d = Math.max(d, A);
    }
    const f = ((T = t._stroke) == null ? void 0 : T.width) || 0;
    let p = d + f;
    t.dropShadow && (p += t.dropShadow.distance);
    const g = t.lineHeight || o.fontSize;
    let m = Math.max(g, o.fontSize + f) + (c.length - 1) * (g + t.leading);
    return t.dropShadow && (m += t.dropShadow.distance), new O(
      e,
      t,
      p,
      m,
      c,
      u,
      g + t.leading,
      d,
      o
    );
  }
  static _measureText(e, t, r) {
    let i = !1;
    O.experimentalLetterSpacingSupported && (O.experimentalLetterSpacing ? (r.letterSpacing = `${t}px`, r.textLetterSpacing = `${t}px`, i = !0) : (r.letterSpacing = "0px", r.textLetterSpacing = "0px"));
    const n = r.measureText(e);
    let a = n.width;
    const o = -n.actualBoundingBoxLeft;
    let l = n.actualBoundingBoxRight - o;
    if (a > 0)
      if (i)
        a -= t, l -= t;
      else {
        const c = (O.graphemeSegmenter(e).length - 1) * t;
        a += c, l += c;
      }
    return Math.max(a, l);
  }
  /**
   * Applies newlines to a string to have it optimally fit into the horizontal
   * bounds set by the Text object's wordWrapWidth property.
   * @param text - String to apply word wrapping to
   * @param style - the style to use when wrapping
   * @param canvas - optional specification of the canvas to use for measuring.
   * @returns New string with new lines applied where required
   */
  static _wordWrap(e, t, r = O._canvas) {
    const i = r.getContext("2d", Ps);
    let n = 0, a = "", o = "";
    const h = /* @__PURE__ */ Object.create(null), { letterSpacing: l, whiteSpace: c } = t, u = O._collapseSpaces(c), d = O._collapseNewlines(c);
    let f = !u;
    const p = t.wordWrapWidth + l, g = O._tokenize(e);
    for (let m = 0; m < g.length; m++) {
      let y = g[m];
      if (O._isNewline(y)) {
        if (!d) {
          o += O._addLine(a), f = !u, a = "", n = 0;
          continue;
        }
        y = " ";
      }
      if (u) {
        const S = O.isBreakingSpace(y), A = O.isBreakingSpace(a[a.length - 1]);
        if (S && A)
          continue;
      }
      const T = O._getFromCache(y, l, h, i);
      if (T > p)
        if (a !== "" && (o += O._addLine(a), a = "", n = 0), O.canBreakWords(y, t.breakWords)) {
          const S = O.wordWrapSplit(y);
          for (let A = 0; A < S.length; A++) {
            let M = S[A], P = M, E = 1;
            for (; S[A + E]; ) {
              const I = S[A + E];
              if (!O.canBreakChars(P, I, y, A, t.breakWords))
                M += I;
              else
                break;
              P = I, E++;
            }
            A += E - 1;
            const N = O._getFromCache(M, l, h, i);
            N + n > p && (o += O._addLine(a), f = !1, a = "", n = 0), a += M, n += N;
          }
        } else {
          a.length > 0 && (o += O._addLine(a), a = "", n = 0);
          const S = m === g.length - 1;
          o += O._addLine(y, !S), f = !1, a = "", n = 0;
        }
      else
        T + n > p && (f = !1, o += O._addLine(a), a = "", n = 0), (a.length > 0 || !O.isBreakingSpace(y) || f) && (a += y, n += T);
    }
    return o += O._addLine(a, !1), o;
  }
  /**
   * Convenience function for logging each line added during the wordWrap method.
   * @param line    - The line of text to add
   * @param newLine - Add new line character to end
   * @returns A formatted line
   */
  static _addLine(e, t = !0) {
    return e = O._trimRight(e), e = t ? `${e}
` : e, e;
  }
  /**
   * Gets & sets the widths of calculated characters in a cache object
   * @param key            - The key
   * @param letterSpacing  - The letter spacing
   * @param cache          - The cache
   * @param context        - The canvas context
   * @returns The from cache.
   */
  static _getFromCache(e, t, r, i) {
    let n = r[e];
    return typeof n != "number" && (n = O._measureText(e, t, i) + t, r[e] = n), n;
  }
  /**
   * Determines whether we should collapse breaking spaces.
   * @param whiteSpace - The TextStyle property whiteSpace
   * @returns Should collapse
   */
  static _collapseSpaces(e) {
    return e === "normal" || e === "pre-line";
  }
  /**
   * Determines whether we should collapse newLine chars.
   * @param whiteSpace - The white space
   * @returns should collapse
   */
  static _collapseNewlines(e) {
    return e === "normal";
  }
  /**
   * Trims breaking whitespaces from string.
   * @param text - The text
   * @returns Trimmed string
   */
  static _trimRight(e) {
    if (typeof e != "string")
      return "";
    for (let t = e.length - 1; t >= 0; t--) {
      const r = e[t];
      if (!O.isBreakingSpace(r))
        break;
      e = e.slice(0, -1);
    }
    return e;
  }
  /**
   * Determines if char is a newline.
   * @param char - The character
   * @returns True if newline, False otherwise.
   */
  static _isNewline(e) {
    return typeof e != "string" ? !1 : O._newlines.includes(e.charCodeAt(0));
  }
  /**
   * Determines if char is a breaking whitespace.
   *
   * It allows one to determine whether char should be a breaking whitespace
   * For example certain characters in CJK langs or numbers.
   * It must return a boolean.
   * @param char - The character
   * @param [_nextChar] - The next character
   * @returns True if whitespace, False otherwise.
   */
  static isBreakingSpace(e, t) {
    return typeof e != "string" ? !1 : O._breakingSpaces.includes(e.charCodeAt(0));
  }
  /**
   * Splits a string into words, breaking-spaces and newLine characters
   * @param text - The text
   * @returns A tokenized array
   */
  static _tokenize(e) {
    const t = [];
    let r = "";
    if (typeof e != "string")
      return t;
    for (let i = 0; i < e.length; i++) {
      const n = e[i], a = e[i + 1];
      if (O.isBreakingSpace(n, a) || O._isNewline(n)) {
        r !== "" && (t.push(r), r = ""), t.push(n);
        continue;
      }
      r += n;
    }
    return r !== "" && t.push(r), t;
  }
  /**
   * Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
   *
   * It allows one to customise which words should break
   * Examples are if the token is CJK or numbers.
   * It must return a boolean.
   * @param _token - The token
   * @param breakWords - The style attr break words
   * @returns Whether to break word or not
   */
  static canBreakWords(e, t) {
    return t;
  }
  /**
   * Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
   *
   * It allows one to determine whether a pair of characters
   * should be broken by newlines
   * For example certain characters in CJK langs or numbers.
   * It must return a boolean.
   * @param _char - The character
   * @param _nextChar - The next character
   * @param _token - The token/word the characters are from
   * @param _index - The index in the token of the char
   * @param _breakWords - The style attr break words
   * @returns whether to break word or not
   */
  static canBreakChars(e, t, r, i, n) {
    return !0;
  }
  /**
   * Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
   *
   * It is called when a token (usually a word) has to be split into separate pieces
   * in order to determine the point to break a word.
   * It must return an array of characters.
   * @param token - The token to split
   * @returns The characters of the token
   * @see CanvasTextMetrics.graphemeSegmenter
   */
  static wordWrapSplit(e) {
    return O.graphemeSegmenter(e);
  }
  /**
   * Calculates the ascent, descent and fontSize of a given font-style
   * @param font - String representing the style of the font
   * @returns Font properties object
   */
  static measureFont(e) {
    if (O._fonts[e])
      return O._fonts[e];
    const t = O._context;
    t.font = e;
    const r = t.measureText(O.METRICS_STRING + O.BASELINE_SYMBOL), i = {
      ascent: r.actualBoundingBoxAscent,
      descent: r.actualBoundingBoxDescent,
      fontSize: r.actualBoundingBoxAscent + r.actualBoundingBoxDescent
    };
    return O._fonts[e] = i, i;
  }
  /**
   * Clear font metrics in metrics cache.
   * @param {string} [font] - font name. If font name not set then clear cache for all fonts.
   */
  static clearMetrics(e = "") {
    e ? delete O._fonts[e] : O._fonts = {};
  }
  /**
   * Cached canvas element for measuring text
   * TODO: this should be private, but isn't because of backward compat, will fix later.
   * @ignore
   */
  static get _canvas() {
    if (!O.__canvas) {
      let e;
      try {
        const t = new OffscreenCanvas(0, 0), r = t.getContext("2d", Ps);
        if (r != null && r.measureText)
          return O.__canvas = t, t;
        e = Z.get().createCanvas();
      } catch {
        e = Z.get().createCanvas();
      }
      e.width = e.height = 10, O.__canvas = e;
    }
    return O.__canvas;
  }
  /**
   * TODO: this should be private, but isn't because of backward compat, will fix later.
   * @ignore
   */
  static get _context() {
    return O.__context || (O.__context = O._canvas.getContext("2d", Ps)), O.__context;
  }
};
Le.METRICS_STRING = "|ÉqÅ";
Le.BASELINE_SYMBOL = "M";
Le.BASELINE_MULTIPLIER = 1.4;
Le.HEIGHT_MULTIPLIER = 2;
Le.graphemeSegmenter = (() => {
  if (typeof (Intl == null ? void 0 : Intl.Segmenter) == "function") {
    const s = new Intl.Segmenter();
    return (e) => [...s.segment(e)].map((t) => t.segment);
  }
  return (s) => [...s];
})();
Le.experimentalLetterSpacing = !1;
Le._fonts = {};
Le._newlines = [
  10,
  // line feed
  13
  // carriage return
];
Le._breakingSpaces = [
  9,
  // character tabulation
  32,
  // space
  8192,
  // en quad
  8193,
  // em quad
  8194,
  // en space
  8195,
  // em space
  8196,
  // three-per-em space
  8197,
  // four-per-em space
  8198,
  // six-per-em space
  8200,
  // punctuation space
  8201,
  // thin space
  8202,
  // hair space
  8287,
  // medium mathematical space
  12288
  // ideographic space
];
Le._measurementCache = {};
let qe = Le;
const da = 1e5;
function Nr(s, e, t, r = 0) {
  if (s.texture === D.WHITE && !s.fill)
    return re.shared.setValue(s.color).setAlpha(s.alpha ?? 1).toHexa();
  if (s.fill) {
    if (s.fill instanceof $r) {
      const i = s.fill, n = e.createPattern(i.texture.source.resource, "repeat"), a = i.transform.copyTo(L.shared);
      return a.scale(
        i.texture.frame.width,
        i.texture.frame.height
      ), n.setTransform(a), n;
    } else if (s.fill instanceof ot) {
      const i = s.fill, n = i.type === "linear", a = i.textureSpace === "local";
      let o = 1, h = 1;
      a && t && (o = t.width + r, h = t.height + r);
      let l, c = !1;
      if (n) {
        const { start: u, end: d } = i;
        l = e.createLinearGradient(
          u.x * o,
          u.y * h,
          d.x * o,
          d.y * h
        ), c = Math.abs(d.x - u.x) < Math.abs((d.y - u.y) * 0.1);
      } else {
        const { center: u, innerRadius: d, outerCenter: f, outerRadius: p } = i;
        l = e.createRadialGradient(
          u.x * o,
          u.y * h,
          d * o,
          f.x * o,
          f.y * h,
          p * o
        );
      }
      if (c && a && t) {
        const u = t.lineHeight / h;
        for (let d = 0; d < t.lines.length; d++) {
          const f = (d * t.lineHeight + r / 2) / h;
          i.colorStops.forEach((p) => {
            const g = f + p.offset * u;
            l.addColorStop(
              // fix to 5 decimal places to avoid floating point precision issues
              Math.floor(g * da) / da,
              re.shared.setValue(p.color).toHex()
            );
          });
        }
      } else
        i.colorStops.forEach((u) => {
          l.addColorStop(u.offset, re.shared.setValue(u.color).toHex());
        });
      return l;
    }
  } else {
    const i = e.createPattern(s.texture.source.resource, "repeat"), n = s.matrix.copyTo(L.shared);
    return n.scale(s.texture.frame.width, s.texture.frame.height), i.setTransform(n), i;
  }
  return V("FillStyle not recognised", s), "red";
}
function lh(s) {
  if (s === "")
    return [];
  typeof s == "string" && (s = [s]);
  const e = [];
  for (let t = 0, r = s.length; t < r; t++) {
    const i = s[t];
    if (Array.isArray(i)) {
      if (i.length !== 2)
        throw new Error(`[BitmapFont]: Invalid character range length, expecting 2 got ${i.length}.`);
      if (i[0].length === 0 || i[1].length === 0)
        throw new Error("[BitmapFont]: Invalid character delimiter.");
      const n = i[0].charCodeAt(0), a = i[1].charCodeAt(0);
      if (a < n)
        throw new Error("[BitmapFont]: Invalid character range.");
      for (let o = n, h = a; o <= h; o++)
        e.push(String.fromCharCode(o));
    } else
      e.push(...Array.from(i));
  }
  if (e.length === 0)
    throw new Error("[BitmapFont]: Empty set when resolving characters.");
  return e;
}
const ch = class uh extends $o {
  /**
   * @param options - The options for the dynamic bitmap font.
   */
  constructor(e) {
    super(), this.resolution = 1, this.pages = [], this._padding = 0, this._measureCache = /* @__PURE__ */ Object.create(null), this._currentChars = [], this._currentX = 0, this._currentY = 0, this._currentPageIndex = -1, this._skipKerning = !1;
    const t = { ...uh.defaultOptions, ...e };
    this._textureSize = t.textureSize, this._mipmap = t.mipmap;
    const r = t.style.clone();
    t.overrideFill && (r._fill.color = 16777215, r._fill.alpha = 1, r._fill.texture = D.WHITE, r._fill.fill = null), this.applyFillAsTint = t.overrideFill;
    const i = r.fontSize;
    r.fontSize = this.baseMeasurementFontSize;
    const n = Lr(r);
    t.overrideSize ? r._stroke && (r._stroke.width *= this.baseRenderedFontSize / i) : r.fontSize = this.baseRenderedFontSize = i, this._style = r, this._skipKerning = t.skipKerning ?? !1, this.resolution = t.resolution ?? 1, this._padding = t.padding ?? 4, this.fontMetrics = qe.measureFont(n), this.lineHeight = r.lineHeight || this.fontMetrics.fontSize || r.fontSize;
  }
  ensureCharacters(e) {
    var m, y;
    const t = lh(e).filter((T) => !this._currentChars.includes(T)).filter((T, S, A) => A.indexOf(T) === S);
    if (!t.length)
      return;
    this._currentChars = [...this._currentChars, ...t];
    let r;
    this._currentPageIndex === -1 ? r = this._nextPage() : r = this.pages[this._currentPageIndex];
    let { canvas: i, context: n } = r.canvasAndContext, a = r.texture.source;
    const o = this._style;
    let h = this._currentX, l = this._currentY;
    const c = this.baseRenderedFontSize / this.baseMeasurementFontSize, u = this._padding * c;
    let d = 0, f = !1;
    const p = i.width / this.resolution, g = i.height / this.resolution;
    for (let T = 0; T < t.length; T++) {
      const S = t[T], A = qe.measureText(S, o, i, !1);
      A.lineHeight = A.height;
      const M = A.width * c, P = Math.ceil((o.fontStyle === "italic" ? 2 : 1) * M), E = A.height * c, N = P + u * 2, I = E + u * 2;
      if (f = !1, S !== `
` && S !== "\r" && S !== "	" && S !== " " && (f = !0, d = Math.ceil(Math.max(I, d))), h + N > p && (l += d, d = I, h = 0, l + d > g)) {
        a.update();
        const G = this._nextPage();
        i = G.canvasAndContext.canvas, n = G.canvasAndContext.context, a = G.texture.source, l = 0;
      }
      const k = M / c - (((m = o.dropShadow) == null ? void 0 : m.distance) ?? 0) - (((y = o._stroke) == null ? void 0 : y.width) ?? 0);
      if (this.chars[S] = {
        id: S.codePointAt(0),
        xOffset: -this._padding,
        yOffset: -this._padding,
        xAdvance: k,
        kerning: {}
      }, f) {
        this._drawGlyph(
          n,
          A,
          h + u,
          l + u,
          c,
          o
        );
        const G = a.width * c, F = a.height * c, $ = new ne(
          h / G * a.width,
          l / F * a.height,
          N / G * a.width,
          I / F * a.height
        );
        this.chars[S].texture = new D({
          source: a,
          frame: $
        }), h += Math.ceil(N);
      }
    }
    a.update(), this._currentX = h, this._currentY = l, this._skipKerning && this._applyKerning(t, n);
  }
  /**
   * @deprecated since 8.0.0
   * The map of base page textures (i.e., sheets of glyphs).
   */
  get pageTextures() {
    return X(Y, "BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead."), this.pages;
  }
  _applyKerning(e, t) {
    const r = this._measureCache;
    for (let i = 0; i < e.length; i++) {
      const n = e[i];
      for (let a = 0; a < this._currentChars.length; a++) {
        const o = this._currentChars[a];
        let h = r[n];
        h || (h = r[n] = t.measureText(n).width);
        let l = r[o];
        l || (l = r[o] = t.measureText(o).width);
        let c = t.measureText(n + o).width, u = c - (h + l);
        u && (this.chars[n].kerning[o] = u), c = t.measureText(n + o).width, u = c - (h + l), u && (this.chars[o].kerning[n] = u);
      }
    }
  }
  _nextPage() {
    this._currentPageIndex++;
    const e = this.resolution, t = et.getOptimalCanvasAndContext(
      this._textureSize,
      this._textureSize,
      e
    );
    this._setupContext(t.context, this._style, e);
    const r = e * (this.baseRenderedFontSize / this.baseMeasurementFontSize), i = new D({
      source: new xt({
        resource: t.canvas,
        resolution: r,
        alphaMode: "premultiply-alpha-on-upload",
        autoGenerateMipmaps: this._mipmap
      })
    }), n = {
      canvasAndContext: t,
      texture: i
    };
    return this.pages[this._currentPageIndex] = n, n;
  }
  // canvas style!
  _setupContext(e, t, r) {
    t.fontSize = this.baseRenderedFontSize, e.scale(r, r), e.font = Lr(t), t.fontSize = this.baseMeasurementFontSize, e.textBaseline = t.textBaseline;
    const i = t._stroke, n = (i == null ? void 0 : i.width) ?? 0;
    if (i && (e.lineWidth = n, e.lineJoin = i.join, e.miterLimit = i.miterLimit, e.strokeStyle = Nr(i, e)), t._fill && (e.fillStyle = Nr(t._fill, e)), t.dropShadow) {
      const a = t.dropShadow, o = re.shared.setValue(a.color).toArray(), h = a.blur * r, l = a.distance * r;
      e.shadowColor = `rgba(${o[0] * 255},${o[1] * 255},${o[2] * 255},${a.alpha})`, e.shadowBlur = h, e.shadowOffsetX = Math.cos(a.angle) * l, e.shadowOffsetY = Math.sin(a.angle) * l;
    } else
      e.shadowColor = "black", e.shadowBlur = 0, e.shadowOffsetX = 0, e.shadowOffsetY = 0;
  }
  _drawGlyph(e, t, r, i, n, a) {
    const o = t.text, h = t.fontProperties, l = a._stroke, c = ((l == null ? void 0 : l.width) ?? 0) * n, u = r + c / 2, d = i - c / 2, f = h.descent * n, p = t.lineHeight * n;
    a.stroke && c && e.strokeText(o, u, d + p - f), a._fill && e.fillText(o, u, d + p - f);
  }
  destroy() {
    super.destroy();
    for (let e = 0; e < this.pages.length; e++) {
      const { canvasAndContext: t, texture: r } = this.pages[e];
      et.returnCanvasAndContext(t), r.destroy(!0);
    }
    this.pages = null;
  }
};
ch.defaultOptions = {
  textureSize: 512,
  style: new tt(),
  mipmap: !0
};
let fa = ch;
function dh(s, e, t, r) {
  const i = {
    width: 0,
    height: 0,
    offsetY: 0,
    scale: e.fontSize / t.baseMeasurementFontSize,
    lines: [{
      width: 0,
      charPositions: [],
      spaceWidth: 0,
      spacesIndex: [],
      chars: []
    }]
  };
  i.offsetY = t.baseLineOffset;
  let n = i.lines[0], a = null, o = !0;
  const h = {
    width: 0,
    start: 0,
    index: 0,
    // use index to not modify the array as we use it a lot!
    positions: [],
    chars: []
  }, l = (p) => {
    const g = n.width;
    for (let m = 0; m < h.index; m++) {
      const y = p.positions[m];
      n.chars.push(p.chars[m]), n.charPositions.push(y + g);
    }
    n.width += p.width, o = !1, h.width = 0, h.index = 0, h.chars.length = 0;
  }, c = () => {
    let p = n.chars.length - 1;
    if (r) {
      let g = n.chars[p];
      for (; g === " "; )
        n.width -= t.chars[g].xAdvance, g = n.chars[--p];
    }
    i.width = Math.max(i.width, n.width), n = {
      width: 0,
      charPositions: [],
      chars: [],
      spaceWidth: 0,
      spacesIndex: []
    }, o = !0, i.lines.push(n), i.height += t.lineHeight;
  }, u = t.baseMeasurementFontSize / e.fontSize, d = e.letterSpacing * u, f = e.wordWrapWidth * u;
  for (let p = 0; p < s.length + 1; p++) {
    let g;
    const m = p === s.length;
    m || (g = s[p]);
    const y = t.chars[g] || t.chars[" "];
    if (/(?:\s)/.test(g) || g === "\r" || g === `
` || m) {
      if (!o && e.wordWrap && n.width + h.width - d > f ? (c(), l(h), m || n.charPositions.push(0)) : (h.start = n.width, l(h), m || n.charPositions.push(0)), g === "\r" || g === `
`)
        n.width !== 0 && c();
      else if (!m) {
        const M = y.xAdvance + (y.kerning[a] || 0) + d;
        n.width += M, n.spaceWidth = M, n.spacesIndex.push(n.charPositions.length), n.chars.push(g);
      }
    } else {
      const A = y.kerning[a] || 0, M = y.xAdvance + A + d;
      h.positions[h.index++] = h.width + A, h.chars.push(g), h.width += M;
    }
    a = g;
  }
  return c(), e.align === "center" ? If(i) : e.align === "right" ? Gf(i) : e.align === "justify" && Uf(i), i;
}
function If(s) {
  for (let e = 0; e < s.lines.length; e++) {
    const t = s.lines[e], r = s.width / 2 - t.width / 2;
    for (let i = 0; i < t.charPositions.length; i++)
      t.charPositions[i] += r;
  }
}
function Gf(s) {
  for (let e = 0; e < s.lines.length; e++) {
    const t = s.lines[e], r = s.width - t.width;
    for (let i = 0; i < t.charPositions.length; i++)
      t.charPositions[i] += r;
  }
}
function Uf(s) {
  const e = s.width;
  for (let t = 0; t < s.lines.length; t++) {
    const r = s.lines[t];
    let i = 0, n = r.spacesIndex[i++], a = 0;
    const o = r.spacesIndex.length, l = (e - r.width) / o;
    for (let c = 0; c < r.charPositions.length; c++)
      c === n && (n = r.spacesIndex[i++], a += l), r.charPositions[c] += a;
  }
}
let Tr = 0;
class Ff {
  constructor() {
    this.ALPHA = [["a", "z"], ["A", "Z"], " "], this.NUMERIC = [["0", "9"]], this.ALPHANUMERIC = [["a", "z"], ["A", "Z"], ["0", "9"], " "], this.ASCII = [[" ", "~"]], this.defaultOptions = {
      chars: this.ALPHANUMERIC,
      resolution: 1,
      padding: 4,
      skipKerning: !1
    };
  }
  /**
   * Get a font for the specified text and style.
   * @param text - The text to get the font for
   * @param style - The style to use
   */
  getFont(e, t) {
    var a;
    let r = `${t.fontFamily}-bitmap`, i = !0;
    if (t._fill.fill && !t._stroke)
      r += t._fill.fill.styleKey, i = !1;
    else if (t._stroke || t.dropShadow) {
      let o = t.styleKey;
      o = o.substring(0, o.lastIndexOf("-")), r = `${o}-bitmap`, i = !1;
    }
    if (!he.has(r)) {
      const o = new fa({
        style: t,
        overrideFill: i,
        overrideSize: !0,
        ...this.defaultOptions
      });
      Tr++, Tr > 50 && V("BitmapText", `You have dynamically created ${Tr} bitmap fonts, this can be inefficient. Try pre installing your font styles using \`BitmapFont.install({name:"style1", style})\``), o.once("destroy", () => {
        Tr--, he.remove(r);
      }), he.set(
        r,
        o
      );
    }
    const n = he.get(r);
    return (a = n.ensureCharacters) == null || a.call(n, e), n;
  }
  /**
   * Get the layout of a text for the specified style.
   * @param text - The text to get the layout for
   * @param style - The style to use
   * @param trimEnd - Whether to ignore whitespaces at the end of each line
   */
  getLayout(e, t, r = !0) {
    const i = this.getFont(e, t);
    return dh([...e], t, i, r);
  }
  /**
   * Measure the text using the specified style.
   * @param text - The text to measure
   * @param style - The style to use
   * @param trimEnd - Whether to ignore whitespaces at the end of each line
   */
  measureText(e, t, r = !0) {
    return this.getLayout(e, t, r);
  }
  // eslint-disable-next-line max-len
  install(...e) {
    var l, c, u, d;
    let t = e[0];
    typeof t == "string" && (t = {
      name: t,
      style: e[1],
      chars: (l = e[2]) == null ? void 0 : l.chars,
      resolution: (c = e[2]) == null ? void 0 : c.resolution,
      padding: (u = e[2]) == null ? void 0 : u.padding,
      skipKerning: (d = e[2]) == null ? void 0 : d.skipKerning
    }, X(Y, "BitmapFontManager.install(name, style, options) is deprecated, use BitmapFontManager.install({name, style, ...options})"));
    const r = t == null ? void 0 : t.name;
    if (!r)
      throw new Error("[BitmapFontManager] Property `name` is required.");
    t = { ...this.defaultOptions, ...t };
    const i = t.style, n = i instanceof tt ? i : new tt(i), a = n._fill.fill !== null && n._fill.fill !== void 0, o = new fa({
      style: n,
      overrideFill: a,
      skipKerning: t.skipKerning,
      padding: t.padding,
      resolution: t.resolution,
      overrideSize: !1
    }), h = lh(t.chars);
    return o.ensureCharacters(h.join("")), he.set(`${r}-bitmap`, o), o.once("destroy", () => he.remove(`${r}-bitmap`)), o;
  }
  /**
   * Uninstalls a bitmap font from the cache.
   * @param {string} name - The name of the bitmap font to uninstall.
   */
  uninstall(e) {
    const t = `${e}-bitmap`, r = he.get(t);
    r && r.destroy();
  }
}
const ri = new Ff();
class fh extends $o {
  constructor(e, t) {
    super();
    const { textures: r, data: i } = e;
    Object.keys(i.pages).forEach((n) => {
      const a = i.pages[parseInt(n, 10)], o = r[a.id];
      this.pages.push({ texture: o });
    }), Object.keys(i.chars).forEach((n) => {
      const a = i.chars[n], {
        frame: o,
        source: h
      } = r[a.page], l = new ne(
        a.x + o.x,
        a.y + o.y,
        a.width,
        a.height
      ), c = new D({
        source: h,
        frame: l
      });
      this.chars[n] = {
        id: n.codePointAt(0),
        xOffset: a.xOffset,
        yOffset: a.yOffset,
        xAdvance: a.xAdvance,
        kerning: a.kerning ?? {},
        texture: c
      };
    }), this.baseRenderedFontSize = i.fontSize, this.baseMeasurementFontSize = i.fontSize, this.fontMetrics = {
      ascent: 0,
      descent: 0,
      fontSize: i.fontSize
    }, this.baseLineOffset = i.baseLineOffset, this.lineHeight = i.lineHeight, this.fontFamily = i.fontFamily, this.distanceField = i.distanceField ?? {
      type: "none",
      range: 0
    }, this.url = t;
  }
  /** Destroys the BitmapFont object. */
  destroy() {
    super.destroy();
    for (let e = 0; e < this.pages.length; e++) {
      const { texture: t } = this.pages[e];
      t.destroy(!0);
    }
    this.pages = null;
  }
  /**
   * Generates a bitmap-font for the given style and character set
   * @param options - Setup options for font generation.
   * @returns Font generated by style options.
   * @example
   * import { BitmapFont, BitmapText } from 'pixi.js';
   *
   * BitmapFont.install('TitleFont', {
   *     fontFamily: 'Arial',
   *     fontSize: 12,
   *     strokeThickness: 2,
   *     fill: 'purple',
   * });
   *
   * const title = new BitmapText({ text: 'This is the title', fontFamily: 'TitleFont' });
   */
  static install(e) {
    ri.install(e);
  }
  /**
   * Uninstalls a bitmap font from the cache.
   * @param {string} name - The name of the bitmap font to uninstall.
   */
  static uninstall(e) {
    ri.uninstall(e);
  }
}
const Cs = {
  test(s) {
    return typeof s == "string" && s.startsWith("info face=");
  },
  parse(s) {
    const e = s.match(/^[a-z]+\s+.+$/gm), t = {
      info: [],
      common: [],
      page: [],
      char: [],
      chars: [],
      kerning: [],
      kernings: [],
      distanceField: []
    };
    for (const u in e) {
      const d = e[u].match(/^[a-z]+/gm)[0], f = e[u].match(/[a-zA-Z]+=([^\s"']+|"([^"]*)")/gm), p = {};
      for (const g in f) {
        const m = f[g].split("="), y = m[0], T = m[1].replace(/"/gm, ""), S = parseFloat(T), A = isNaN(S) ? T : S;
        p[y] = A;
      }
      t[d].push(p);
    }
    const r = {
      chars: {},
      pages: [],
      lineHeight: 0,
      fontSize: 0,
      fontFamily: "",
      distanceField: null,
      baseLineOffset: 0
    }, [i] = t.info, [n] = t.common, [a] = t.distanceField ?? [];
    a && (r.distanceField = {
      range: parseInt(a.distanceRange, 10),
      type: a.fieldType
    }), r.fontSize = parseInt(i.size, 10), r.fontFamily = i.face, r.lineHeight = parseInt(n.lineHeight, 10);
    const o = t.page;
    for (let u = 0; u < o.length; u++)
      r.pages.push({
        id: parseInt(o[u].id, 10) || 0,
        file: o[u].file
      });
    const h = {};
    r.baseLineOffset = r.lineHeight - parseInt(n.base, 10);
    const l = t.char;
    for (let u = 0; u < l.length; u++) {
      const d = l[u], f = parseInt(d.id, 10);
      let p = d.letter ?? d.char ?? String.fromCharCode(f);
      p === "space" && (p = " "), h[f] = p, r.chars[p] = {
        id: f,
        // texture deets..
        page: parseInt(d.page, 10) || 0,
        x: parseInt(d.x, 10),
        y: parseInt(d.y, 10),
        width: parseInt(d.width, 10),
        height: parseInt(d.height, 10),
        xOffset: parseInt(d.xoffset, 10),
        yOffset: parseInt(d.yoffset, 10),
        xAdvance: parseInt(d.xadvance, 10),
        kerning: {}
      };
    }
    const c = t.kerning || [];
    for (let u = 0; u < c.length; u++) {
      const d = parseInt(c[u].first, 10), f = parseInt(c[u].second, 10), p = parseInt(c[u].amount, 10);
      r.chars[h[f]].kerning[h[d]] = p;
    }
    return r;
  }
}, pa = {
  test(s) {
    const e = s;
    return typeof e != "string" && "getElementsByTagName" in e && e.getElementsByTagName("page").length && e.getElementsByTagName("info")[0].getAttribute("face") !== null;
  },
  parse(s) {
    const e = {
      chars: {},
      pages: [],
      lineHeight: 0,
      fontSize: 0,
      fontFamily: "",
      distanceField: null,
      baseLineOffset: 0
    }, t = s.getElementsByTagName("info")[0], r = s.getElementsByTagName("common")[0], i = s.getElementsByTagName("distanceField")[0];
    i && (e.distanceField = {
      type: i.getAttribute("fieldType"),
      range: parseInt(i.getAttribute("distanceRange"), 10)
    });
    const n = s.getElementsByTagName("page"), a = s.getElementsByTagName("char"), o = s.getElementsByTagName("kerning");
    e.fontSize = parseInt(t.getAttribute("size"), 10), e.fontFamily = t.getAttribute("face"), e.lineHeight = parseInt(r.getAttribute("lineHeight"), 10);
    for (let l = 0; l < n.length; l++)
      e.pages.push({
        id: parseInt(n[l].getAttribute("id"), 10) || 0,
        file: n[l].getAttribute("file")
      });
    const h = {};
    e.baseLineOffset = e.lineHeight - parseInt(r.getAttribute("base"), 10);
    for (let l = 0; l < a.length; l++) {
      const c = a[l], u = parseInt(c.getAttribute("id"), 10);
      let d = c.getAttribute("letter") ?? c.getAttribute("char") ?? String.fromCharCode(u);
      d === "space" && (d = " "), h[u] = d, e.chars[d] = {
        id: u,
        // texture deets..
        page: parseInt(c.getAttribute("page"), 10) || 0,
        x: parseInt(c.getAttribute("x"), 10),
        y: parseInt(c.getAttribute("y"), 10),
        width: parseInt(c.getAttribute("width"), 10),
        height: parseInt(c.getAttribute("height"), 10),
        // render deets..
        xOffset: parseInt(c.getAttribute("xoffset"), 10),
        yOffset: parseInt(c.getAttribute("yoffset"), 10),
        // + baseLineOffset,
        xAdvance: parseInt(c.getAttribute("xadvance"), 10),
        kerning: {}
      };
    }
    for (let l = 0; l < o.length; l++) {
      const c = parseInt(o[l].getAttribute("first"), 10), u = parseInt(o[l].getAttribute("second"), 10), d = parseInt(o[l].getAttribute("amount"), 10);
      e.chars[h[u]].kerning[h[c]] = d;
    }
    return e;
  }
}, ma = {
  test(s) {
    return typeof s == "string" && s.includes("<font>") ? pa.test(Z.get().parseXML(s)) : !1;
  },
  parse(s) {
    return pa.parse(Z.get().parseXML(s));
  }
}, Df = [".xml", ".fnt"], Of = {
  extension: {
    type: v.CacheParser,
    name: "cacheBitmapFont"
  },
  test: (s) => s instanceof fh,
  getCacheableAssets(s, e) {
    const t = {};
    return s.forEach((r) => {
      t[r] = e, t[`${r}-bitmap`] = e;
    }), t[`${e.fontFamily}-bitmap`] = e, t;
  }
}, Lf = {
  extension: {
    type: v.LoadParser,
    priority: ht.Normal
  },
  name: "loadBitmapFont",
  test(s) {
    return Df.includes(Ce.extname(s).toLowerCase());
  },
  async testParse(s) {
    return Cs.test(s) || ma.test(s);
  },
  async parse(s, e, t) {
    const r = Cs.test(s) ? Cs.parse(s) : ma.parse(s), { src: i } = e, { pages: n } = r, a = [], o = r.distanceField ? {
      scaleMode: "linear",
      alphaMode: "premultiply-alpha-on-upload",
      autoGenerateMipmaps: !1,
      resolution: 1
    } : {};
    for (let u = 0; u < n.length; ++u) {
      const d = n[u].file;
      let f = Ce.join(Ce.dirname(i), d);
      f = Vs(f, i), a.push({
        src: f,
        data: o
      });
    }
    const h = await t.load(a), l = a.map((u) => h[u.src]);
    return new fh({
      data: r,
      textures: l
    }, i);
  },
  async load(s, e) {
    return await (await Z.get().fetch(s)).text();
  },
  async unload(s, e, t) {
    await Promise.all(s.pages.map((r) => t.unload(r.texture.source._sourceOrigin))), s.destroy();
  }
};
class Nf {
  /**
   * @param loader
   * @param verbose - should the loader log to the console
   */
  constructor(e, t = !1) {
    this._loader = e, this._assetList = [], this._isLoading = !1, this._maxConcurrent = 1, this.verbose = t;
  }
  /**
   * Adds an array of assets to load.
   * @param assetUrls - assets to load
   */
  add(e) {
    e.forEach((t) => {
      this._assetList.push(t);
    }), this.verbose && console.log("[BackgroundLoader] assets: ", this._assetList), this._isActive && !this._isLoading && this._next();
  }
  /**
   * Loads the next set of assets. Will try to load as many assets as it can at the same time.
   *
   * The max assets it will try to load at one time will be 4.
   */
  async _next() {
    if (this._assetList.length && this._isActive) {
      this._isLoading = !0;
      const e = [], t = Math.min(this._assetList.length, this._maxConcurrent);
      for (let r = 0; r < t; r++)
        e.push(this._assetList.pop());
      await this._loader.load(e), this._isLoading = !1, this._next();
    }
  }
  /**
   * Activate/Deactivate the loading. If set to true then it will immediately continue to load the next asset.
   * @returns whether the class is active
   */
  get active() {
    return this._isActive;
  }
  set active(e) {
    this._isActive !== e && (this._isActive = e, e && !this._isLoading && this._next());
  }
}
const Hf = {
  extension: {
    type: v.CacheParser,
    name: "cacheTextureArray"
  },
  test: (s) => Array.isArray(s) && s.every((e) => e instanceof D),
  getCacheableAssets: (s, e) => {
    const t = {};
    return s.forEach((r) => {
      e.forEach((i, n) => {
        t[r + (n === 0 ? "" : n + 1)] = i;
      });
    }), t;
  }
};
async function ph(s) {
  if ("Image" in globalThis)
    return new Promise((e) => {
      const t = new Image();
      t.onload = () => {
        e(!0);
      }, t.onerror = () => {
        e(!1);
      }, t.src = s;
    });
  if ("createImageBitmap" in globalThis && "fetch" in globalThis) {
    try {
      const e = await (await fetch(s)).blob();
      await createImageBitmap(e);
    } catch {
      return !1;
    }
    return !0;
  }
  return !1;
}
const Wf = {
  extension: {
    type: v.DetectionParser,
    priority: 1
  },
  test: async () => ph(
    // eslint-disable-next-line max-len
    "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="
  ),
  add: async (s) => [...s, "avif"],
  remove: async (s) => s.filter((e) => e !== "avif")
}, ga = ["png", "jpg", "jpeg"], zf = {
  extension: {
    type: v.DetectionParser,
    priority: -1
  },
  test: () => Promise.resolve(!0),
  add: async (s) => [...s, ...ga],
  remove: async (s) => s.filter((e) => !ga.includes(e))
}, Vf = "WorkerGlobalScope" in globalThis && globalThis instanceof globalThis.WorkerGlobalScope;
function Ui(s) {
  return Vf ? !1 : document.createElement("video").canPlayType(s) !== "";
}
const $f = {
  extension: {
    type: v.DetectionParser,
    priority: 0
  },
  test: async () => Ui("video/mp4"),
  add: async (s) => [...s, "mp4", "m4v"],
  remove: async (s) => s.filter((e) => e !== "mp4" && e !== "m4v")
}, Xf = {
  extension: {
    type: v.DetectionParser,
    priority: 0
  },
  test: async () => Ui("video/ogg"),
  add: async (s) => [...s, "ogv"],
  remove: async (s) => s.filter((e) => e !== "ogv")
}, jf = {
  extension: {
    type: v.DetectionParser,
    priority: 0
  },
  test: async () => Ui("video/webm"),
  add: async (s) => [...s, "webm"],
  remove: async (s) => s.filter((e) => e !== "webm")
}, Yf = {
  extension: {
    type: v.DetectionParser,
    priority: 0
  },
  test: async () => ph(
    "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA="
  ),
  add: async (s) => [...s, "webp"],
  remove: async (s) => s.filter((e) => e !== "webp")
};
class Kf {
  constructor() {
    this._parsers = [], this._parsersValidated = !1, this.parsers = new Proxy(this._parsers, {
      set: (e, t, r) => (this._parsersValidated = !1, e[t] = r, !0)
    }), this.promiseCache = {};
  }
  /** function used for testing */
  reset() {
    this._parsersValidated = !1, this.promiseCache = {};
  }
  /**
   * Used internally to generate a promise for the asset to be loaded.
   * @param url - The URL to be loaded
   * @param data - any custom additional information relevant to the asset being loaded
   * @returns - a promise that will resolve to an Asset for example a Texture of a JSON object
   */
  _getLoadPromiseAndParser(e, t) {
    const r = {
      promise: null,
      parser: null
    };
    return r.promise = (async () => {
      var a, o;
      let i = null, n = null;
      if (t.loadParser && (n = this._parserHash[t.loadParser], n || V(`[Assets] specified load parser "${t.loadParser}" not found while loading ${e}`)), !n) {
        for (let h = 0; h < this.parsers.length; h++) {
          const l = this.parsers[h];
          if (l.load && ((a = l.test) != null && a.call(l, e, t, this))) {
            n = l;
            break;
          }
        }
        if (!n)
          return V(`[Assets] ${e} could not be loaded as we don't know how to parse it, ensure the correct parser has been added`), null;
      }
      i = await n.load(e, t, this), r.parser = n;
      for (let h = 0; h < this.parsers.length; h++) {
        const l = this.parsers[h];
        l.parse && l.parse && await ((o = l.testParse) == null ? void 0 : o.call(l, i, t, this)) && (i = await l.parse(i, t, this) || i, r.parser = l);
      }
      return i;
    })(), r;
  }
  async load(e, t) {
    this._parsersValidated || this._validateParsers();
    let r = 0;
    const i = {}, n = Fr(e), a = Fe(e, (l) => ({
      alias: [l],
      src: l,
      data: {}
    })), o = a.length, h = a.map(async (l) => {
      const c = Ce.toAbsolute(l.src);
      if (!i[l.src])
        try {
          this.promiseCache[c] || (this.promiseCache[c] = this._getLoadPromiseAndParser(c, l)), i[l.src] = await this.promiseCache[c].promise, t && t(++r / o);
        } catch (u) {
          throw delete this.promiseCache[c], delete i[l.src], new Error(`[Loader.load] Failed to load ${c}.
${u}`);
        }
    });
    return await Promise.all(h), n ? i[a[0].src] : i;
  }
  /**
   * Unloads one or more assets. Any unloaded assets will be destroyed, freeing up memory for your app.
   * The parser that created the asset, will be the one that unloads it.
   * @example
   * // Single asset:
   * const asset = await Loader.load('cool.png');
   *
   * await Loader.unload('cool.png');
   *
   * console.log(asset.destroyed); // true
   * @param assetsToUnloadIn - urls that you want to unload, or a single one!
   */
  async unload(e) {
    const r = Fe(e, (i) => ({
      alias: [i],
      src: i
    })).map(async (i) => {
      var o, h;
      const n = Ce.toAbsolute(i.src), a = this.promiseCache[n];
      if (a) {
        const l = await a.promise;
        delete this.promiseCache[n], await ((h = (o = a.parser) == null ? void 0 : o.unload) == null ? void 0 : h.call(o, l, i, this));
      }
    });
    await Promise.all(r);
  }
  /** validates our parsers, right now it only checks for name conflicts but we can add more here as required! */
  _validateParsers() {
    this._parsersValidated = !0, this._parserHash = this._parsers.filter((e) => e.name).reduce((e, t) => (t.name ? e[t.name] && V(`[Assets] loadParser name conflict "${t.name}"`) : V("[Assets] loadParser should have a name"), { ...e, [t.name]: t }), {});
  }
}
function Ut(s, e) {
  if (Array.isArray(e)) {
    for (const t of e)
      if (s.startsWith(`data:${t}`))
        return !0;
    return !1;
  }
  return s.startsWith(`data:${e}`);
}
function Ft(s, e) {
  const t = s.split("?")[0], r = Ce.extname(t).toLowerCase();
  return Array.isArray(e) ? e.includes(r) : r === e;
}
const qf = ".json", Zf = "application/json", Qf = {
  extension: {
    type: v.LoadParser,
    priority: ht.Low
  },
  name: "loadJson",
  test(s) {
    return Ut(s, Zf) || Ft(s, qf);
  },
  async load(s) {
    return await (await Z.get().fetch(s)).json();
  }
}, Jf = ".txt", ep = "text/plain", tp = {
  name: "loadTxt",
  extension: {
    type: v.LoadParser,
    priority: ht.Low,
    name: "loadTxt"
  },
  test(s) {
    return Ut(s, ep) || Ft(s, Jf);
  },
  async load(s) {
    return await (await Z.get().fetch(s)).text();
  }
}, rp = [
  "normal",
  "bold",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900"
], sp = [".ttf", ".otf", ".woff", ".woff2"], ip = [
  "font/ttf",
  "font/otf",
  "font/woff",
  "font/woff2"
], np = /^(--|-?[A-Z_])[0-9A-Z_-]*$/i;
function ap(s) {
  const e = Ce.extname(s), i = Ce.basename(s, e).replace(/(-|_)/g, " ").toLowerCase().split(" ").map((o) => o.charAt(0).toUpperCase() + o.slice(1));
  let n = i.length > 0;
  for (const o of i)
    if (!o.match(np)) {
      n = !1;
      break;
    }
  let a = i.join(" ");
  return n || (a = `"${a.replace(/[\\"]/g, "\\$&")}"`), a;
}
const op = /^[0-9A-Za-z%:/?#\[\]@!\$&'()\*\+,;=\-._~]*$/;
function hp(s) {
  return op.test(s) ? s : encodeURI(s);
}
const lp = {
  extension: {
    type: v.LoadParser,
    priority: ht.Low
  },
  name: "loadWebFont",
  test(s) {
    return Ut(s, ip) || Ft(s, sp);
  },
  async load(s, e) {
    var r, i, n;
    const t = Z.get().getFontFaceSet();
    if (t) {
      const a = [], o = ((r = e.data) == null ? void 0 : r.family) ?? ap(s), h = ((n = (i = e.data) == null ? void 0 : i.weights) == null ? void 0 : n.filter((c) => rp.includes(c))) ?? ["normal"], l = e.data ?? {};
      for (let c = 0; c < h.length; c++) {
        const u = h[c], d = new FontFace(o, `url(${hp(s)})`, {
          ...l,
          weight: u
        });
        await d.load(), t.add(d), a.push(d);
      }
      return he.set(`${o}-and-url`, {
        url: s,
        fontFaces: a
      }), a.length === 1 ? a[0] : a;
    }
    return V("[loadWebFont] FontFace API is not supported. Skipping loading font"), null;
  },
  unload(s) {
    (Array.isArray(s) ? s : [s]).forEach((e) => {
      he.remove(`${e.family}-and-url`), Z.get().getFontFaceSet().delete(e);
    });
  }
};
function Fi(s, e = 1) {
  var r;
  const t = (r = kt.RETINA_PREFIX) == null ? void 0 : r.exec(s);
  return t ? parseFloat(t[1]) : e;
}
function Di(s, e, t) {
  s.label = t, s._sourceOrigin = t;
  const r = new D({
    source: s,
    label: t
  }), i = () => {
    delete e.promiseCache[t], he.has(t) && he.remove(t);
  };
  return r.source.once("destroy", () => {
    e.promiseCache[t] && (V("[Assets] A TextureSource managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the TextureSource."), i());
  }), r.once("destroy", () => {
    s.destroyed || (V("[Assets] A Texture managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the Texture."), i());
  }), r;
}
const cp = ".svg", up = "image/svg+xml", dp = {
  extension: {
    type: v.LoadParser,
    priority: ht.Low,
    name: "loadSVG"
  },
  name: "loadSVG",
  config: {
    crossOrigin: "anonymous",
    parseAsGraphicsContext: !1
  },
  test(s) {
    return Ut(s, up) || Ft(s, cp);
  },
  async load(s, e, t) {
    var r;
    return ((r = e.data) == null ? void 0 : r.parseAsGraphicsContext) ?? this.config.parseAsGraphicsContext ? pp(s) : fp(s, e, t, this.config.crossOrigin);
  },
  unload(s) {
    s.destroy(!0);
  }
};
async function fp(s, e, t, r) {
  var m, y, T;
  const n = await (await Z.get().fetch(s)).blob(), a = URL.createObjectURL(n), o = new Image();
  o.src = a, o.crossOrigin = r, await o.decode(), URL.revokeObjectURL(a);
  const h = document.createElement("canvas"), l = h.getContext("2d"), c = ((m = e.data) == null ? void 0 : m.resolution) || Fi(s), u = ((y = e.data) == null ? void 0 : y.width) ?? o.width, d = ((T = e.data) == null ? void 0 : T.height) ?? o.height;
  h.width = u * c, h.height = d * c, l.drawImage(o, 0, 0, u * c, d * c);
  const { parseAsGraphicsContext: f, ...p } = e.data ?? {}, g = new xt({
    resource: h,
    alphaMode: "premultiply-alpha-on-upload",
    resolution: c,
    ...p
  });
  return Di(g, t, s);
}
async function pp(s) {
  const t = await (await Z.get().fetch(s)).text(), r = new Be();
  return r.svg(t), r;
}
const mp = `(function () {
    'use strict';

    const WHITE_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    async function checkImageBitmap() {
      try {
        if (typeof createImageBitmap !== "function")
          return false;
        const response = await fetch(WHITE_PNG);
        const imageBlob = await response.blob();
        const imageBitmap = await createImageBitmap(imageBlob);
        return imageBitmap.width === 1 && imageBitmap.height === 1;
      } catch (_e) {
        return false;
      }
    }
    void checkImageBitmap().then((result) => {
      self.postMessage(result);
    });

})();
`;
let Pt = null, si = class {
  constructor() {
    Pt || (Pt = URL.createObjectURL(new Blob([mp], { type: "application/javascript" }))), this.worker = new Worker(Pt);
  }
};
si.revokeObjectURL = function() {
  Pt && (URL.revokeObjectURL(Pt), Pt = null);
};
const gp = `(function () {
    'use strict';

    async function loadImageBitmap(url, alphaMode) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(\`[WorkerManager.loadImageBitmap] Failed to fetch \${url}: \${response.status} \${response.statusText}\`);
      }
      const imageBlob = await response.blob();
      return alphaMode === "premultiplied-alpha" ? createImageBitmap(imageBlob, { premultiplyAlpha: "none" }) : createImageBitmap(imageBlob);
    }
    self.onmessage = async (event) => {
      try {
        const imageBitmap = await loadImageBitmap(event.data.data[0], event.data.data[1]);
        self.postMessage({
          data: imageBitmap,
          uuid: event.data.uuid,
          id: event.data.id
        }, [imageBitmap]);
      } catch (e) {
        self.postMessage({
          error: e,
          uuid: event.data.uuid,
          id: event.data.id
        });
      }
    };

})();
`;
let Ct = null;
class mh {
  constructor() {
    Ct || (Ct = URL.createObjectURL(new Blob([gp], { type: "application/javascript" }))), this.worker = new Worker(Ct);
  }
}
mh.revokeObjectURL = function() {
  Ct && (URL.revokeObjectURL(Ct), Ct = null);
};
let _a = 0, Es;
class _p {
  constructor() {
    this._initialized = !1, this._createdWorkers = 0, this._workerPool = [], this._queue = [], this._resolveHash = {};
  }
  isImageBitmapSupported() {
    return this._isImageBitmapSupported !== void 0 ? this._isImageBitmapSupported : (this._isImageBitmapSupported = new Promise((e) => {
      const { worker: t } = new si();
      t.addEventListener("message", (r) => {
        t.terminate(), si.revokeObjectURL(), e(r.data);
      });
    }), this._isImageBitmapSupported);
  }
  loadImageBitmap(e, t) {
    var r;
    return this._run("loadImageBitmap", [e, (r = t == null ? void 0 : t.data) == null ? void 0 : r.alphaMode]);
  }
  async _initWorkers() {
    this._initialized || (this._initialized = !0);
  }
  _getWorker() {
    Es === void 0 && (Es = navigator.hardwareConcurrency || 4);
    let e = this._workerPool.pop();
    return !e && this._createdWorkers < Es && (this._createdWorkers++, e = new mh().worker, e.addEventListener("message", (t) => {
      this._complete(t.data), this._returnWorker(t.target), this._next();
    })), e;
  }
  _returnWorker(e) {
    this._workerPool.push(e);
  }
  _complete(e) {
    e.error !== void 0 ? this._resolveHash[e.uuid].reject(e.error) : this._resolveHash[e.uuid].resolve(e.data), this._resolveHash[e.uuid] = null;
  }
  async _run(e, t) {
    await this._initWorkers();
    const r = new Promise((i, n) => {
      this._queue.push({ id: e, arguments: t, resolve: i, reject: n });
    });
    return this._next(), r;
  }
  _next() {
    if (!this._queue.length)
      return;
    const e = this._getWorker();
    if (!e)
      return;
    const t = this._queue.pop(), r = t.id;
    this._resolveHash[_a] = { resolve: t.resolve, reject: t.reject }, e.postMessage({
      data: t.arguments,
      uuid: _a++,
      id: r
    });
  }
}
const xa = new _p(), xp = [".jpeg", ".jpg", ".png", ".webp", ".avif"], yp = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
];
async function bp(s, e) {
  var i;
  const t = await Z.get().fetch(s);
  if (!t.ok)
    throw new Error(`[loadImageBitmap] Failed to fetch ${s}: ${t.status} ${t.statusText}`);
  const r = await t.blob();
  return ((i = e == null ? void 0 : e.data) == null ? void 0 : i.alphaMode) === "premultiplied-alpha" ? createImageBitmap(r, { premultiplyAlpha: "none" }) : createImageBitmap(r);
}
const gh = {
  name: "loadTextures",
  extension: {
    type: v.LoadParser,
    priority: ht.High,
    name: "loadTextures"
  },
  config: {
    preferWorkers: !0,
    preferCreateImageBitmap: !0,
    crossOrigin: "anonymous"
  },
  test(s) {
    return Ut(s, yp) || Ft(s, xp);
  },
  async load(s, e, t) {
    var n;
    let r = null;
    globalThis.createImageBitmap && this.config.preferCreateImageBitmap ? this.config.preferWorkers && await xa.isImageBitmapSupported() ? r = await xa.loadImageBitmap(s, e) : r = await bp(s, e) : r = await new Promise((a, o) => {
      r = new Image(), r.crossOrigin = this.config.crossOrigin, r.src = s, r.complete ? a(r) : (r.onload = () => {
        a(r);
      }, r.onerror = o);
    });
    const i = new xt({
      resource: r,
      alphaMode: "premultiply-alpha-on-upload",
      resolution: ((n = e.data) == null ? void 0 : n.resolution) || Fi(s),
      ...e.data
    });
    return Di(i, t, s);
  },
  unload(s) {
    s.destroy(!0);
  }
}, _h = [".mp4", ".m4v", ".webm", ".ogg", ".ogv", ".h264", ".avi", ".mov"], vp = _h.map((s) => `video/${s.substring(1)}`);
function Tp(s, e, t) {
  t === void 0 && !e.startsWith("data:") ? s.crossOrigin = wp(e) : t !== !1 && (s.crossOrigin = typeof t == "string" ? t : "anonymous");
}
function Sp(s) {
  return new Promise((e, t) => {
    s.addEventListener("canplaythrough", r), s.addEventListener("error", i), s.load();
    function r() {
      n(), e();
    }
    function i(a) {
      n(), t(a);
    }
    function n() {
      s.removeEventListener("canplaythrough", r), s.removeEventListener("error", i);
    }
  });
}
function wp(s, e = globalThis.location) {
  if (s.startsWith("data:"))
    return "";
  e || (e = globalThis.location);
  const t = new URL(s, document.baseURI);
  return t.hostname !== e.hostname || t.port !== e.port || t.protocol !== e.protocol ? "anonymous" : "";
}
const Ap = {
  name: "loadVideo",
  extension: {
    type: v.LoadParser,
    name: "loadVideo"
  },
  test(s) {
    const e = Ut(s, vp), t = Ft(s, _h);
    return e || t;
  },
  async load(s, e, t) {
    var h, l;
    const r = {
      ...Mr.defaultOptions,
      resolution: ((h = e.data) == null ? void 0 : h.resolution) || Fi(s),
      alphaMode: ((l = e.data) == null ? void 0 : l.alphaMode) || await bo(),
      ...e.data
    }, i = document.createElement("video"), n = {
      preload: r.autoLoad !== !1 ? "auto" : void 0,
      "webkit-playsinline": r.playsinline !== !1 ? "" : void 0,
      playsinline: r.playsinline !== !1 ? "" : void 0,
      muted: r.muted === !0 ? "" : void 0,
      loop: r.loop === !0 ? "" : void 0,
      autoplay: r.autoPlay !== !1 ? "" : void 0
    };
    Object.keys(n).forEach((c) => {
      const u = n[c];
      u !== void 0 && i.setAttribute(c, u);
    }), r.muted === !0 && (i.muted = !0), Tp(i, s, r.crossorigin);
    const a = document.createElement("source");
    let o;
    if (s.startsWith("data:"))
      o = s.slice(5, s.indexOf(";"));
    else if (!s.startsWith("blob:")) {
      const c = s.split("?")[0].slice(s.lastIndexOf(".") + 1).toLowerCase();
      o = Mr.MIME_TYPES[c] || `video/${c}`;
    }
    return a.src = s, o && (a.type = o), new Promise((c) => {
      const u = async () => {
        const d = new Mr({ ...r, resource: i });
        i.removeEventListener("canplay", u), e.data.preload && await Sp(i), c(Di(d, t, s));
      };
      i.addEventListener("canplay", u), i.appendChild(a);
    });
  },
  unload(s) {
    s.destroy(!0);
  }
}, xh = {
  extension: {
    type: v.ResolveParser,
    name: "resolveTexture"
  },
  test: gh.test,
  parse: (s) => {
    var e;
    return {
      resolution: parseFloat(((e = kt.RETINA_PREFIX.exec(s)) == null ? void 0 : e[1]) ?? "1"),
      format: s.split(".").pop(),
      src: s
    };
  }
}, Pp = {
  extension: {
    type: v.ResolveParser,
    priority: -2,
    name: "resolveJson"
  },
  test: (s) => kt.RETINA_PREFIX.test(s) && s.endsWith(".json"),
  parse: xh.parse
};
class Cp {
  constructor() {
    this._detections = [], this._initialized = !1, this.resolver = new kt(), this.loader = new Kf(), this.cache = he, this._backgroundLoader = new Nf(this.loader), this._backgroundLoader.active = !0, this.reset();
  }
  /**
   * Best practice is to call this function before any loading commences
   * Initiating is the best time to add any customization to the way things are loaded.
   *
   * you do not need to call this for the Assets class to work, only if you want to set any initial properties
   * @param options - options to initialize the Assets manager with
   */
  async init(e = {}) {
    var n, a;
    if (this._initialized) {
      V("[Assets]AssetManager already initialized, did you load before calling this Assets.init()?");
      return;
    }
    if (this._initialized = !0, e.defaultSearchParams && this.resolver.setDefaultSearchParams(e.defaultSearchParams), e.basePath && (this.resolver.basePath = e.basePath), e.bundleIdentifier && this.resolver.setBundleIdentifier(e.bundleIdentifier), e.manifest) {
      let o = e.manifest;
      typeof o == "string" && (o = await this.load(o)), this.resolver.addManifest(o);
    }
    const t = ((n = e.texturePreference) == null ? void 0 : n.resolution) ?? 1, r = typeof t == "number" ? [t] : t, i = await this._detectFormats({
      preferredFormats: (a = e.texturePreference) == null ? void 0 : a.format,
      skipDetections: e.skipDetections,
      detections: this._detections
    });
    this.resolver.prefer({
      params: {
        format: i,
        resolution: r
      }
    }), e.preferences && this.setPreferences(e.preferences);
  }
  /**
   * Allows you to specify how to resolve any assets load requests.
   * There are a few ways to add things here as shown below:
   * @example
   * import { Assets } from 'pixi.js';
   *
   * // Simple
   * Assets.add({alias: 'bunnyBooBoo', src: 'bunny.png'});
   * const bunny = await Assets.load('bunnyBooBoo');
   *
   * // Multiple keys:
   * Assets.add({alias: ['burger', 'chicken'], src: 'bunny.png'});
   *
   * const bunny = await Assets.load('burger');
   * const bunny2 = await Assets.load('chicken');
   *
   * // passing options to to the object
   * Assets.add({
   *     alias: 'bunnyBooBooSmooth',
   *     src: 'bunny.{png,webp}',
   *     data: { scaleMode: SCALE_MODES.NEAREST }, // Base texture options
   * });
   *
   * // Multiple assets
   *
   * // The following all do the same thing:
   *
   * Assets.add({alias: 'bunnyBooBoo', src: 'bunny.{png,webp}'});
   *
   * Assets.add({
   *     alias: 'bunnyBooBoo',
   *     src: [
   *         'bunny.png',
   *         'bunny.webp',
   *    ],
   * });
   *
   * const bunny = await Assets.load('bunnyBooBoo'); // Will try to load WebP if available
   * @param assets - the unresolved assets to add to the resolver
   */
  add(e) {
    this.resolver.add(e);
  }
  async load(e, t) {
    this._initialized || await this.init();
    const r = Fr(e), i = Fe(e).map((o) => {
      if (typeof o != "string") {
        const h = this.resolver.getAlias(o);
        return h.some((l) => !this.resolver.hasKey(l)) && this.add(o), Array.isArray(h) ? h[0] : h;
      }
      return this.resolver.hasKey(o) || this.add({ alias: o, src: o }), o;
    }), n = this.resolver.resolve(i), a = await this._mapLoadToResolve(n, t);
    return r ? a[i[0]] : a;
  }
  /**
   * This adds a bundle of assets in one go so that you can load them as a group.
   * For example you could add a bundle for each screen in you pixi app
   * @example
   * import { Assets } from 'pixi.js';
   *
   * Assets.addBundle('animals', [
   *  { alias: 'bunny', src: 'bunny.png' },
   *  { alias: 'chicken', src: 'chicken.png' },
   *  { alias: 'thumper', src: 'thumper.png' },
   * ]);
   * // or
   * Assets.addBundle('animals', {
   *     bunny: 'bunny.png',
   *     chicken: 'chicken.png',
   *     thumper: 'thumper.png',
   * });
   *
   * const assets = await Assets.loadBundle('animals');
   * @param bundleId - the id of the bundle to add
   * @param assets - a record of the asset or assets that will be chosen from when loading via the specified key
   */
  addBundle(e, t) {
    this.resolver.addBundle(e, t);
  }
  /**
   * Bundles are a way to load multiple assets at once.
   * If a manifest has been provided to the init function then you can load a bundle, or bundles.
   * you can also add bundles via `addBundle`
   * @example
   * import { Assets } from 'pixi.js';
   *
   * // Manifest Example
   * const manifest = {
   *     bundles: [
   *         {
   *             name: 'load-screen',
   *             assets: [
   *                 {
   *                     alias: 'background',
   *                     src: 'sunset.png',
   *                 },
   *                 {
   *                     alias: 'bar',
   *                     src: 'load-bar.{png,webp}',
   *                 },
   *             ],
   *         },
   *         {
   *             name: 'game-screen',
   *             assets: [
   *                 {
   *                     alias: 'character',
   *                     src: 'robot.png',
   *                 },
   *                 {
   *                     alias: 'enemy',
   *                     src: 'bad-guy.png',
   *                 },
   *             ],
   *         },
   *     ]
   * };
   *
   * await Assets.init({ manifest });
   *
   * // Load a bundle...
   * loadScreenAssets = await Assets.loadBundle('load-screen');
   * // Load another bundle...
   * gameScreenAssets = await Assets.loadBundle('game-screen');
   * @param bundleIds - the bundle id or ids to load
   * @param onProgress - Optional function that is called when progress on asset loading is made.
   * The function is passed a single parameter, `progress`, which represents the percentage (0.0 - 1.0)
   * of the assets loaded. Do not use this function to detect when assets are complete and available,
   * instead use the Promise returned by this function.
   * @returns all the bundles assets or a hash of assets for each bundle specified
   */
  async loadBundle(e, t) {
    this._initialized || await this.init();
    let r = !1;
    typeof e == "string" && (r = !0, e = [e]);
    const i = this.resolver.resolveBundle(e), n = {}, a = Object.keys(i);
    let o = 0, h = 0;
    const l = () => {
      t == null || t(++o / h);
    }, c = a.map((u) => {
      const d = i[u];
      return h += Object.keys(d).length, this._mapLoadToResolve(d, l).then((f) => {
        n[u] = f;
      });
    });
    return await Promise.all(c), r ? n[e[0]] : n;
  }
  /**
   * Initiate a background load of some assets. It will passively begin to load these assets in the background.
   * So when you actually come to loading them you will get a promise that resolves to the loaded assets immediately
   *
   * An example of this might be that you would background load game assets after your initial load.
   * then when you got to actually load your game screen assets when a player goes to the game - the loading
   * would already have stared or may even be complete, saving you having to show an interim load bar.
   * @example
   * import { Assets } from 'pixi.js';
   *
   * Assets.backgroundLoad('bunny.png');
   *
   * // later on in your app...
   * await Assets.loadBundle('bunny.png'); // Will resolve quicker as loading may have completed!
   * @param urls - the url / urls you want to background load
   */
  async backgroundLoad(e) {
    this._initialized || await this.init(), typeof e == "string" && (e = [e]);
    const t = this.resolver.resolve(e);
    this._backgroundLoader.add(Object.values(t));
  }
  /**
   * Initiate a background of a bundle, works exactly like backgroundLoad but for bundles.
   * this can only be used if the loader has been initiated with a manifest
   * @example
   * import { Assets } from 'pixi.js';
   *
   * await Assets.init({
   *     manifest: {
   *         bundles: [
   *             {
   *                 name: 'load-screen',
   *                 assets: [...],
   *             },
   *             ...
   *         ],
   *     },
   * });
   *
   * Assets.backgroundLoadBundle('load-screen');
   *
   * // Later on in your app...
   * await Assets.loadBundle('load-screen'); // Will resolve quicker as loading may have completed!
   * @param bundleIds - the bundleId / bundleIds you want to background load
   */
  async backgroundLoadBundle(e) {
    this._initialized || await this.init(), typeof e == "string" && (e = [e]);
    const t = this.resolver.resolveBundle(e);
    Object.values(t).forEach((r) => {
      this._backgroundLoader.add(Object.values(r));
    });
  }
  /**
   * Only intended for development purposes.
   * This will wipe the resolver and caches.
   * You will need to reinitialize the Asset
   */
  reset() {
    this.resolver.reset(), this.loader.reset(), this.cache.reset(), this._initialized = !1;
  }
  get(e) {
    if (typeof e == "string")
      return he.get(e);
    const t = {};
    for (let r = 0; r < e.length; r++)
      t[r] = he.get(e[r]);
    return t;
  }
  /**
   * helper function to map resolved assets back to loaded assets
   * @param resolveResults - the resolve results from the resolver
   * @param onProgress - the progress callback
   */
  async _mapLoadToResolve(e, t) {
    const r = [...new Set(Object.values(e))];
    this._backgroundLoader.active = !1;
    const i = await this.loader.load(r, t);
    this._backgroundLoader.active = !0;
    const n = {};
    return r.forEach((a) => {
      const o = i[a.src], h = [a.src];
      a.alias && h.push(...a.alias), h.forEach((l) => {
        n[l] = o;
      }), he.set(h, o);
    }), n;
  }
  /**
   * Unload an asset or assets. As the Assets class is responsible for creating the assets via the `load` function
   * this will make sure to destroy any assets and release them from memory.
   * Once unloaded, you will need to load the asset again.
   *
   * Use this to help manage assets if you find that you have a large app and you want to free up memory.
   *
   * - it's up to you as the developer to make sure that textures are not actively being used when you unload them,
   * Pixi won't break but you will end up with missing assets. Not a good look for the user!
   * @example
   * import { Assets } from 'pixi.js';
   *
   * // Load a URL:
   * const myImageTexture = await Assets.load('http://some.url.com/image.png'); // => returns a texture
   *
   * await Assets.unload('http://some.url.com/image.png')
   *
   * // myImageTexture will be destroyed now.
   *
   * // Unload multiple assets:
   * const textures = await Assets.unload(['thumper', 'chicko']);
   * @param urls - the urls to unload
   */
  async unload(e) {
    this._initialized || await this.init();
    const t = Fe(e).map((i) => typeof i != "string" ? i.src : i), r = this.resolver.resolve(t);
    await this._unloadFromResolved(r);
  }
  /**
   * Bundles are a way to manage multiple assets at once.
   * this will unload all files in a bundle.
   *
   * once a bundle has been unloaded, you need to load it again to have access to the assets.
   * @example
   * import { Assets } from 'pixi.js';
   *
   * Assets.addBundle({
   *     'thumper': 'http://some.url.com/thumper.png',
   * })
   *
   * const assets = await Assets.loadBundle('thumper');
   *
   * // Now to unload...
   *
   * await Assets.unloadBundle('thumper');
   *
   * // All assets in the assets object will now have been destroyed and purged from the cache
   * @param bundleIds - the bundle id or ids to unload
   */
  async unloadBundle(e) {
    this._initialized || await this.init(), e = Fe(e);
    const t = this.resolver.resolveBundle(e), r = Object.keys(t).map((i) => this._unloadFromResolved(t[i]));
    await Promise.all(r);
  }
  async _unloadFromResolved(e) {
    const t = Object.values(e);
    t.forEach((r) => {
      he.remove(r.src);
    }), await this.loader.unload(t);
  }
  /**
   * Detects the supported formats for the browser, and returns an array of supported formats, respecting
   * the users preferred formats order.
   * @param options - the options to use when detecting formats
   * @param options.preferredFormats - the preferred formats to use
   * @param options.skipDetections - if we should skip the detections altogether
   * @param options.detections - the detections to use
   * @returns - the detected formats
   */
  async _detectFormats(e) {
    let t = [];
    e.preferredFormats && (t = Array.isArray(e.preferredFormats) ? e.preferredFormats : [e.preferredFormats]);
    for (const r of e.detections)
      e.skipDetections || await r.test() ? t = await r.add(t) : e.skipDetections || (t = await r.remove(t));
    return t = t.filter((r, i) => t.indexOf(r) === i), t;
  }
  /** All the detection parsers currently added to the Assets class. */
  get detections() {
    return this._detections;
  }
  /**
   * General setter for preferences. This is a helper function to set preferences on all parsers.
   * @param preferences - the preferences to set
   */
  setPreferences(e) {
    this.loader.parsers.forEach((t) => {
      t.config && Object.keys(t.config).filter((r) => r in e).forEach((r) => {
        t.config[r] = e[r];
      });
    });
  }
}
const Xt = new Cp();
z.handleByList(v.LoadParser, Xt.loader.parsers).handleByList(v.ResolveParser, Xt.resolver.parsers).handleByList(v.CacheParser, Xt.cache.parsers).handleByList(v.DetectionParser, Xt.detections);
z.add(
  Hf,
  zf,
  Wf,
  Yf,
  $f,
  Xf,
  jf,
  Qf,
  tp,
  lp,
  dp,
  gh,
  Ap,
  Lf,
  Of,
  xh,
  Pp
);
const ya = {
  loader: v.LoadParser,
  resolver: v.ResolveParser,
  cache: v.CacheParser,
  detection: v.DetectionParser
};
z.handle(v.Asset, (s) => {
  const e = s.ref;
  Object.entries(ya).filter(([t]) => !!e[t]).forEach(([t, r]) => z.add(Object.assign(
    e[t],
    // Allow the function to optionally define it's own
    // ExtensionMetadata, the use cases here is priority for LoaderParsers
    { extension: e[t].extension ?? r }
  )));
}, (s) => {
  const e = s.ref;
  Object.keys(ya).filter((t) => !!e[t]).forEach((t) => z.remove(e[t]));
});
class Ep {
  constructor() {
    this.interactionFrequency = 10, this._deltaTime = 0, this._didMove = !1, this._tickerAdded = !1, this._pauseUpdate = !0;
  }
  /**
   * Initializes the event ticker.
   * @param events - The event system.
   */
  init(e) {
    this.removeTickerListener(), this.events = e, this.interactionFrequency = 10, this._deltaTime = 0, this._didMove = !1, this._tickerAdded = !1, this._pauseUpdate = !0;
  }
  /** Whether to pause the update checks or not. */
  get pauseUpdate() {
    return this._pauseUpdate;
  }
  set pauseUpdate(e) {
    this._pauseUpdate = e;
  }
  /** Adds the ticker listener. */
  addTickerListener() {
    this._tickerAdded || !this.domElement || (Xe.system.add(this._tickerUpdate, this, Jt.INTERACTION), this._tickerAdded = !0);
  }
  /** Removes the ticker listener. */
  removeTickerListener() {
    this._tickerAdded && (Xe.system.remove(this._tickerUpdate, this), this._tickerAdded = !1);
  }
  /** Sets flag to not fire extra events when the user has already moved there mouse */
  pointerMoved() {
    this._didMove = !0;
  }
  /** Updates the state of interactive objects. */
  _update() {
    if (!this.domElement || this._pauseUpdate)
      return;
    if (this._didMove) {
      this._didMove = !1;
      return;
    }
    const e = this.events._rootPointerEvent;
    this.events.supportsTouchEvents && e.pointerType === "touch" || globalThis.document.dispatchEvent(new PointerEvent("pointermove", {
      clientX: e.clientX,
      clientY: e.clientY,
      pointerType: e.pointerType,
      pointerId: e.pointerId
    }));
  }
  /**
   * Updates the state of interactive objects if at least {@link interactionFrequency}
   * milliseconds have passed since the last invocation.
   *
   * Invoked by a throttled ticker update from {@link Ticker.system}.
   * @param ticker - The throttled ticker.
   */
  _tickerUpdate(e) {
    this._deltaTime += e.deltaTime, !(this._deltaTime < this.interactionFrequency) && (this._deltaTime = 0, this._update());
  }
}
const st = new Ep();
class Hr extends sr {
  constructor() {
    super(...arguments), this.client = new oe(), this.movement = new oe(), this.offset = new oe(), this.global = new oe(), this.screen = new oe();
  }
  /** @readonly */
  get clientX() {
    return this.client.x;
  }
  /** @readonly */
  get clientY() {
    return this.client.y;
  }
  /**
   * Alias for {@link FederatedMouseEvent.clientX this.clientX}.
   * @readonly
   */
  get x() {
    return this.clientX;
  }
  /**
   * Alias for {@link FederatedMouseEvent.clientY this.clientY}.
   * @readonly
   */
  get y() {
    return this.clientY;
  }
  /** @readonly */
  get movementX() {
    return this.movement.x;
  }
  /** @readonly */
  get movementY() {
    return this.movement.y;
  }
  /** @readonly */
  get offsetX() {
    return this.offset.x;
  }
  /** @readonly */
  get offsetY() {
    return this.offset.y;
  }
  /** @readonly */
  get globalX() {
    return this.global.x;
  }
  /** @readonly */
  get globalY() {
    return this.global.y;
  }
  /**
   * The pointer coordinates in the renderer's screen. Alias for {@code screen.x}.
   * @readonly
   */
  get screenX() {
    return this.screen.x;
  }
  /**
   * The pointer coordinates in the renderer's screen. Alias for {@code screen.y}.
   * @readonly
   */
  get screenY() {
    return this.screen.y;
  }
  /**
   * This will return the local coordinates of the specified container for this InteractionData
   * @param {Container} container - The Container that you would like the local
   *  coords off
   * @param {PointData} point - A Point object in which to store the value, optional (otherwise
   *  will create a new point)
   * @param {PointData} globalPos - A Point object containing your custom global coords, optional
   *  (otherwise will use the current global coords)
   * @returns - A point containing the coordinates of the InteractionData position relative
   *  to the Container
   */
  getLocalPosition(e, t, r) {
    return e.worldTransform.applyInverse(r || this.global, t);
  }
  /**
   * Whether the modifier key was pressed when this event natively occurred.
   * @param key - The modifier key.
   */
  getModifierState(e) {
    return "getModifierState" in this.nativeEvent && this.nativeEvent.getModifierState(e);
  }
  /**
   * Not supported.
   * @param _typeArg
   * @param _canBubbleArg
   * @param _cancelableArg
   * @param _viewArg
   * @param _detailArg
   * @param _screenXArg
   * @param _screenYArg
   * @param _clientXArg
   * @param _clientYArg
   * @param _ctrlKeyArg
   * @param _altKeyArg
   * @param _shiftKeyArg
   * @param _metaKeyArg
   * @param _buttonArg
   * @param _relatedTargetArg
   * @deprecated since 7.0.0
   */
  // eslint-disable-next-line max-params
  initMouseEvent(e, t, r, i, n, a, o, h, l, c, u, d, f, p, g) {
    throw new Error("Method not implemented.");
  }
}
class Ue extends Hr {
  constructor() {
    super(...arguments), this.width = 0, this.height = 0, this.isPrimary = !1;
  }
  // Only included for completeness for now
  getCoalescedEvents() {
    return this.type === "pointermove" || this.type === "mousemove" || this.type === "touchmove" ? [this] : [];
  }
  // Only included for completeness for now
  getPredictedEvents() {
    throw new Error("getPredictedEvents is not supported!");
  }
}
class Rt extends Hr {
  constructor() {
    super(...arguments), this.DOM_DELTA_PIXEL = 0, this.DOM_DELTA_LINE = 1, this.DOM_DELTA_PAGE = 2;
  }
}
Rt.DOM_DELTA_PIXEL = 0;
Rt.DOM_DELTA_LINE = 1;
Rt.DOM_DELTA_PAGE = 2;
const Mp = 2048, Bp = new oe(), Ht = new oe();
class Rp {
  /**
   * @param rootTarget - The holder of the event boundary.
   */
  constructor(e) {
    this.dispatch = new Me(), this.moveOnAll = !1, this.enableGlobalMoveEvents = !0, this.mappingState = {
      trackingData: {}
    }, this.eventPool = /* @__PURE__ */ new Map(), this._allInteractiveElements = [], this._hitElements = [], this._isPointerMoveEvent = !1, this.rootTarget = e, this.hitPruneFn = this.hitPruneFn.bind(this), this.hitTestFn = this.hitTestFn.bind(this), this.mapPointerDown = this.mapPointerDown.bind(this), this.mapPointerMove = this.mapPointerMove.bind(this), this.mapPointerOut = this.mapPointerOut.bind(this), this.mapPointerOver = this.mapPointerOver.bind(this), this.mapPointerUp = this.mapPointerUp.bind(this), this.mapPointerUpOutside = this.mapPointerUpOutside.bind(this), this.mapWheel = this.mapWheel.bind(this), this.mappingTable = {}, this.addEventMapping("pointerdown", this.mapPointerDown), this.addEventMapping("pointermove", this.mapPointerMove), this.addEventMapping("pointerout", this.mapPointerOut), this.addEventMapping("pointerleave", this.mapPointerOut), this.addEventMapping("pointerover", this.mapPointerOver), this.addEventMapping("pointerup", this.mapPointerUp), this.addEventMapping("pointerupoutside", this.mapPointerUpOutside), this.addEventMapping("wheel", this.mapWheel);
  }
  /**
   * Adds an event mapping for the event `type` handled by `fn`.
   *
   * Event mappings can be used to implement additional or custom events. They take an event
   * coming from the upstream scene (or directly from the {@link EventSystem}) and dispatch new downstream events
   * generally trickling down and bubbling up to {@link EventBoundary.rootTarget this.rootTarget}.
   *
   * To modify the semantics of existing events, the built-in mapping methods of EventBoundary should be overridden
   * instead.
   * @param type - The type of upstream event to map.
   * @param fn - The mapping method. The context of this function must be bound manually, if desired.
   */
  addEventMapping(e, t) {
    this.mappingTable[e] || (this.mappingTable[e] = []), this.mappingTable[e].push({
      fn: t,
      priority: 0
    }), this.mappingTable[e].sort((r, i) => r.priority - i.priority);
  }
  /**
   * Dispatches the given event
   * @param e - The event to dispatch.
   * @param type - The type of event to dispatch. Defaults to `e.type`.
   */
  dispatchEvent(e, t) {
    e.propagationStopped = !1, e.propagationImmediatelyStopped = !1, this.propagate(e, t), this.dispatch.emit(t || e.type, e);
  }
  /**
   * Maps the given upstream event through the event boundary and propagates it downstream.
   * @param e - The event to map.
   */
  mapEvent(e) {
    if (!this.rootTarget)
      return;
    const t = this.mappingTable[e.type];
    if (t)
      for (let r = 0, i = t.length; r < i; r++)
        t[r].fn(e);
    else
      V(`[EventBoundary]: Event mapping not defined for ${e.type}`);
  }
  /**
   * Finds the Container that is the target of a event at the given coordinates.
   *
   * The passed (x,y) coordinates are in the world space above this event boundary.
   * @param x - The x coordinate of the event.
   * @param y - The y coordinate of the event.
   */
  hitTest(e, t) {
    st.pauseUpdate = !0;
    const i = this._isPointerMoveEvent && this.enableGlobalMoveEvents ? "hitTestMoveRecursive" : "hitTestRecursive", n = this[i](
      this.rootTarget,
      this.rootTarget.eventMode,
      Bp.set(e, t),
      this.hitTestFn,
      this.hitPruneFn
    );
    return n && n[0];
  }
  /**
   * Propagate the passed event from from {@link EventBoundary.rootTarget this.rootTarget} to its
   * target {@code e.target}.
   * @param e - The event to propagate.
   * @param type - The type of event to propagate. Defaults to `e.type`.
   */
  propagate(e, t) {
    if (!e.target)
      return;
    const r = e.composedPath();
    e.eventPhase = e.CAPTURING_PHASE;
    for (let i = 0, n = r.length - 1; i < n; i++)
      if (e.currentTarget = r[i], this.notifyTarget(e, t), e.propagationStopped || e.propagationImmediatelyStopped)
        return;
    if (e.eventPhase = e.AT_TARGET, e.currentTarget = e.target, this.notifyTarget(e, t), !(e.propagationStopped || e.propagationImmediatelyStopped)) {
      e.eventPhase = e.BUBBLING_PHASE;
      for (let i = r.length - 2; i >= 0; i--)
        if (e.currentTarget = r[i], this.notifyTarget(e, t), e.propagationStopped || e.propagationImmediatelyStopped)
          return;
    }
  }
  /**
   * Emits the event {@code e} to all interactive containers. The event is propagated in the bubbling phase always.
   *
   * This is used in the `globalpointermove` event.
   * @param e - The emitted event.
   * @param type - The listeners to notify.
   * @param targets - The targets to notify.
   */
  all(e, t, r = this._allInteractiveElements) {
    if (r.length === 0)
      return;
    e.eventPhase = e.BUBBLING_PHASE;
    const i = Array.isArray(t) ? t : [t];
    for (let n = r.length - 1; n >= 0; n--)
      i.forEach((a) => {
        e.currentTarget = r[n], this.notifyTarget(e, a);
      });
  }
  /**
   * Finds the propagation path from {@link EventBoundary.rootTarget rootTarget} to the passed
   * {@code target}. The last element in the path is {@code target}.
   * @param target - The target to find the propagation path to.
   */
  propagationPath(e) {
    const t = [e];
    for (let r = 0; r < Mp && e !== this.rootTarget && e.parent; r++) {
      if (!e.parent)
        throw new Error("Cannot find propagation path to disconnected target");
      t.push(e.parent), e = e.parent;
    }
    return t.reverse(), t;
  }
  hitTestMoveRecursive(e, t, r, i, n, a = !1) {
    let o = !1;
    if (this._interactivePrune(e))
      return null;
    if ((e.eventMode === "dynamic" || t === "dynamic") && (st.pauseUpdate = !1), e.interactiveChildren && e.children) {
      const c = e.children;
      for (let u = c.length - 1; u >= 0; u--) {
        const d = c[u], f = this.hitTestMoveRecursive(
          d,
          this._isInteractive(t) ? t : d.eventMode,
          r,
          i,
          n,
          a || n(e, r)
        );
        if (f) {
          if (f.length > 0 && !f[f.length - 1].parent)
            continue;
          const p = e.isInteractive();
          (f.length > 0 || p) && (p && this._allInteractiveElements.push(e), f.push(e)), this._hitElements.length === 0 && (this._hitElements = f), o = !0;
        }
      }
    }
    const h = this._isInteractive(t), l = e.isInteractive();
    return l && l && this._allInteractiveElements.push(e), a || this._hitElements.length > 0 ? null : o ? this._hitElements : h && !n(e, r) && i(e, r) ? l ? [e] : [] : null;
  }
  /**
   * Recursive implementation for {@link EventBoundary.hitTest hitTest}.
   * @param currentTarget - The Container that is to be hit tested.
   * @param eventMode - The event mode for the `currentTarget` or one of its parents.
   * @param location - The location that is being tested for overlap.
   * @param testFn - Callback that determines whether the target passes hit testing. This callback
   *  can assume that `pruneFn` failed to prune the container.
   * @param pruneFn - Callback that determiness whether the target and all of its children
   *  cannot pass the hit test. It is used as a preliminary optimization to prune entire subtrees
   *  of the scene graph.
   * @returns An array holding the hit testing target and all its ancestors in order. The first element
   *  is the target itself and the last is {@link EventBoundary.rootTarget rootTarget}. This is the opposite
   *  order w.r.t. the propagation path. If no hit testing target is found, null is returned.
   */
  hitTestRecursive(e, t, r, i, n) {
    if (this._interactivePrune(e) || n(e, r))
      return null;
    if ((e.eventMode === "dynamic" || t === "dynamic") && (st.pauseUpdate = !1), e.interactiveChildren && e.children) {
      const h = e.children, l = r;
      for (let c = h.length - 1; c >= 0; c--) {
        const u = h[c], d = this.hitTestRecursive(
          u,
          this._isInteractive(t) ? t : u.eventMode,
          l,
          i,
          n
        );
        if (d) {
          if (d.length > 0 && !d[d.length - 1].parent)
            continue;
          const f = e.isInteractive();
          return (d.length > 0 || f) && d.push(e), d;
        }
      }
    }
    const a = this._isInteractive(t), o = e.isInteractive();
    return a && i(e, r) ? o ? [e] : [] : null;
  }
  _isInteractive(e) {
    return e === "static" || e === "dynamic";
  }
  _interactivePrune(e) {
    return !e || !e.visible || !e.renderable || !e.measurable || e.eventMode === "none" || e.eventMode === "passive" && !e.interactiveChildren;
  }
  /**
   * Checks whether the container or any of its children cannot pass the hit test at all.
   *
   * {@link EventBoundary}'s implementation uses the {@link Container.hitArea hitArea}
   * and {@link Container._maskEffect} for pruning.
   * @param container - The container to prune.
   * @param location - The location to test for overlap.
   */
  hitPruneFn(e, t) {
    if (e.hitArea && (e.worldTransform.applyInverse(t, Ht), !e.hitArea.contains(Ht.x, Ht.y)))
      return !0;
    if (e.effects && e.effects.length)
      for (let r = 0; r < e.effects.length; r++) {
        const i = e.effects[r];
        if (i.containsPoint && !i.containsPoint(t, this.hitTestFn))
          return !0;
      }
    return !1;
  }
  /**
   * Checks whether the container passes hit testing for the given location.
   * @param container - The container to test.
   * @param location - The location to test for overlap.
   * @returns - Whether `container` passes hit testing for `location`.
   */
  hitTestFn(e, t) {
    return e.hitArea ? !0 : e != null && e.containsPoint ? (e.worldTransform.applyInverse(t, Ht), e.containsPoint(Ht)) : !1;
  }
  /**
   * Notify all the listeners to the event's `currentTarget`.
   *
   * If the `currentTarget` contains the property `on<type>`, then it is called here,
   * simulating the behavior from version 6.x and prior.
   * @param e - The event passed to the target.
   * @param type - The type of event to notify. Defaults to `e.type`.
   */
  notifyTarget(e, t) {
    var n, a;
    if (!e.currentTarget.isInteractive())
      return;
    t ?? (t = e.type);
    const r = `on${t}`;
    (a = (n = e.currentTarget)[r]) == null || a.call(n, e);
    const i = e.eventPhase === e.CAPTURING_PHASE || e.eventPhase === e.AT_TARGET ? `${t}capture` : t;
    this._notifyListeners(e, i), e.eventPhase === e.AT_TARGET && this._notifyListeners(e, t);
  }
  /**
   * Maps the upstream `pointerdown` events to a downstream `pointerdown` event.
   *
   * `touchstart`, `rightdown`, `mousedown` events are also dispatched for specific pointer types.
   * @param from - The upstream `pointerdown` event.
   */
  mapPointerDown(e) {
    if (!(e instanceof Ue)) {
      V("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const t = this.createPointerEvent(e);
    if (this.dispatchEvent(t, "pointerdown"), t.pointerType === "touch")
      this.dispatchEvent(t, "touchstart");
    else if (t.pointerType === "mouse" || t.pointerType === "pen") {
      const i = t.button === 2;
      this.dispatchEvent(t, i ? "rightdown" : "mousedown");
    }
    const r = this.trackingData(e.pointerId);
    r.pressTargetsByButton[e.button] = t.composedPath(), this.freeEvent(t);
  }
  /**
   * Maps the upstream `pointermove` to downstream `pointerout`, `pointerover`, and `pointermove` events, in that order.
   *
   * The tracking data for the specific pointer has an updated `overTarget`. `mouseout`, `mouseover`,
   * `mousemove`, and `touchmove` events are fired as well for specific pointer types.
   * @param from - The upstream `pointermove` event.
   */
  mapPointerMove(e) {
    var h, l;
    if (!(e instanceof Ue)) {
      V("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    this._allInteractiveElements.length = 0, this._hitElements.length = 0, this._isPointerMoveEvent = !0;
    const t = this.createPointerEvent(e);
    this._isPointerMoveEvent = !1;
    const r = t.pointerType === "mouse" || t.pointerType === "pen", i = this.trackingData(e.pointerId), n = this.findMountedTarget(i.overTargets);
    if (((h = i.overTargets) == null ? void 0 : h.length) > 0 && n !== t.target) {
      const c = e.type === "mousemove" ? "mouseout" : "pointerout", u = this.createPointerEvent(e, c, n);
      if (this.dispatchEvent(u, "pointerout"), r && this.dispatchEvent(u, "mouseout"), !t.composedPath().includes(n)) {
        const d = this.createPointerEvent(e, "pointerleave", n);
        for (d.eventPhase = d.AT_TARGET; d.target && !t.composedPath().includes(d.target); )
          d.currentTarget = d.target, this.notifyTarget(d), r && this.notifyTarget(d, "mouseleave"), d.target = d.target.parent;
        this.freeEvent(d);
      }
      this.freeEvent(u);
    }
    if (n !== t.target) {
      const c = e.type === "mousemove" ? "mouseover" : "pointerover", u = this.clonePointerEvent(t, c);
      this.dispatchEvent(u, "pointerover"), r && this.dispatchEvent(u, "mouseover");
      let d = n == null ? void 0 : n.parent;
      for (; d && d !== this.rootTarget.parent && d !== t.target; )
        d = d.parent;
      if (!d || d === this.rootTarget.parent) {
        const p = this.clonePointerEvent(t, "pointerenter");
        for (p.eventPhase = p.AT_TARGET; p.target && p.target !== n && p.target !== this.rootTarget.parent; )
          p.currentTarget = p.target, this.notifyTarget(p), r && this.notifyTarget(p, "mouseenter"), p.target = p.target.parent;
        this.freeEvent(p);
      }
      this.freeEvent(u);
    }
    const a = [], o = this.enableGlobalMoveEvents ?? !0;
    this.moveOnAll ? a.push("pointermove") : this.dispatchEvent(t, "pointermove"), o && a.push("globalpointermove"), t.pointerType === "touch" && (this.moveOnAll ? a.splice(1, 0, "touchmove") : this.dispatchEvent(t, "touchmove"), o && a.push("globaltouchmove")), r && (this.moveOnAll ? a.splice(1, 0, "mousemove") : this.dispatchEvent(t, "mousemove"), o && a.push("globalmousemove"), this.cursor = (l = t.target) == null ? void 0 : l.cursor), a.length > 0 && this.all(t, a), this._allInteractiveElements.length = 0, this._hitElements.length = 0, i.overTargets = t.composedPath(), this.freeEvent(t);
  }
  /**
   * Maps the upstream `pointerover` to downstream `pointerover` and `pointerenter` events, in that order.
   *
   * The tracking data for the specific pointer gets a new `overTarget`.
   * @param from - The upstream `pointerover` event.
   */
  mapPointerOver(e) {
    var a;
    if (!(e instanceof Ue)) {
      V("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const t = this.trackingData(e.pointerId), r = this.createPointerEvent(e), i = r.pointerType === "mouse" || r.pointerType === "pen";
    this.dispatchEvent(r, "pointerover"), i && this.dispatchEvent(r, "mouseover"), r.pointerType === "mouse" && (this.cursor = (a = r.target) == null ? void 0 : a.cursor);
    const n = this.clonePointerEvent(r, "pointerenter");
    for (n.eventPhase = n.AT_TARGET; n.target && n.target !== this.rootTarget.parent; )
      n.currentTarget = n.target, this.notifyTarget(n), i && this.notifyTarget(n, "mouseenter"), n.target = n.target.parent;
    t.overTargets = r.composedPath(), this.freeEvent(r), this.freeEvent(n);
  }
  /**
   * Maps the upstream `pointerout` to downstream `pointerout`, `pointerleave` events, in that order.
   *
   * The tracking data for the specific pointer is cleared of a `overTarget`.
   * @param from - The upstream `pointerout` event.
   */
  mapPointerOut(e) {
    if (!(e instanceof Ue)) {
      V("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const t = this.trackingData(e.pointerId);
    if (t.overTargets) {
      const r = e.pointerType === "mouse" || e.pointerType === "pen", i = this.findMountedTarget(t.overTargets), n = this.createPointerEvent(e, "pointerout", i);
      this.dispatchEvent(n), r && this.dispatchEvent(n, "mouseout");
      const a = this.createPointerEvent(e, "pointerleave", i);
      for (a.eventPhase = a.AT_TARGET; a.target && a.target !== this.rootTarget.parent; )
        a.currentTarget = a.target, this.notifyTarget(a), r && this.notifyTarget(a, "mouseleave"), a.target = a.target.parent;
      t.overTargets = null, this.freeEvent(n), this.freeEvent(a);
    }
    this.cursor = null;
  }
  /**
   * Maps the upstream `pointerup` event to downstream `pointerup`, `pointerupoutside`,
   * and `click`/`rightclick`/`pointertap` events, in that order.
   *
   * The `pointerupoutside` event bubbles from the original `pointerdown` target to the most specific
   * ancestor of the `pointerdown` and `pointerup` targets, which is also the `click` event's target. `touchend`,
   * `rightup`, `mouseup`, `touchendoutside`, `rightupoutside`, `mouseupoutside`, and `tap` are fired as well for
   * specific pointer types.
   * @param from - The upstream `pointerup` event.
   */
  mapPointerUp(e) {
    if (!(e instanceof Ue)) {
      V("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const t = performance.now(), r = this.createPointerEvent(e);
    if (this.dispatchEvent(r, "pointerup"), r.pointerType === "touch")
      this.dispatchEvent(r, "touchend");
    else if (r.pointerType === "mouse" || r.pointerType === "pen") {
      const o = r.button === 2;
      this.dispatchEvent(r, o ? "rightup" : "mouseup");
    }
    const i = this.trackingData(e.pointerId), n = this.findMountedTarget(i.pressTargetsByButton[e.button]);
    let a = n;
    if (n && !r.composedPath().includes(n)) {
      let o = n;
      for (; o && !r.composedPath().includes(o); ) {
        if (r.currentTarget = o, this.notifyTarget(r, "pointerupoutside"), r.pointerType === "touch")
          this.notifyTarget(r, "touchendoutside");
        else if (r.pointerType === "mouse" || r.pointerType === "pen") {
          const h = r.button === 2;
          this.notifyTarget(r, h ? "rightupoutside" : "mouseupoutside");
        }
        o = o.parent;
      }
      delete i.pressTargetsByButton[e.button], a = o;
    }
    if (a) {
      const o = this.clonePointerEvent(r, "click");
      o.target = a, o.path = null, i.clicksByButton[e.button] || (i.clicksByButton[e.button] = {
        clickCount: 0,
        target: o.target,
        timeStamp: t
      });
      const h = i.clicksByButton[e.button];
      if (h.target === o.target && t - h.timeStamp < 200 ? ++h.clickCount : h.clickCount = 1, h.target = o.target, h.timeStamp = t, o.detail = h.clickCount, o.pointerType === "mouse") {
        const l = o.button === 2;
        this.dispatchEvent(o, l ? "rightclick" : "click");
      } else o.pointerType === "touch" && this.dispatchEvent(o, "tap");
      this.dispatchEvent(o, "pointertap"), this.freeEvent(o);
    }
    this.freeEvent(r);
  }
  /**
   * Maps the upstream `pointerupoutside` event to a downstream `pointerupoutside` event, bubbling from the original
   * `pointerdown` target to `rootTarget`.
   *
   * (The most specific ancestor of the `pointerdown` event and the `pointerup` event must the
   * `{@link EventBoundary}'s root because the `pointerup` event occurred outside of the boundary.)
   *
   * `touchendoutside`, `mouseupoutside`, and `rightupoutside` events are fired as well for specific pointer
   * types. The tracking data for the specific pointer is cleared of a `pressTarget`.
   * @param from - The upstream `pointerupoutside` event.
   */
  mapPointerUpOutside(e) {
    if (!(e instanceof Ue)) {
      V("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const t = this.trackingData(e.pointerId), r = this.findMountedTarget(t.pressTargetsByButton[e.button]), i = this.createPointerEvent(e);
    if (r) {
      let n = r;
      for (; n; )
        i.currentTarget = n, this.notifyTarget(i, "pointerupoutside"), i.pointerType === "touch" ? this.notifyTarget(i, "touchendoutside") : (i.pointerType === "mouse" || i.pointerType === "pen") && this.notifyTarget(i, i.button === 2 ? "rightupoutside" : "mouseupoutside"), n = n.parent;
      delete t.pressTargetsByButton[e.button];
    }
    this.freeEvent(i);
  }
  /**
   * Maps the upstream `wheel` event to a downstream `wheel` event.
   * @param from - The upstream `wheel` event.
   */
  mapWheel(e) {
    if (!(e instanceof Rt)) {
      V("EventBoundary cannot map a non-wheel event as a wheel event");
      return;
    }
    const t = this.createWheelEvent(e);
    this.dispatchEvent(t), this.freeEvent(t);
  }
  /**
   * Finds the most specific event-target in the given propagation path that is still mounted in the scene graph.
   *
   * This is used to find the correct `pointerup` and `pointerout` target in the case that the original `pointerdown`
   * or `pointerover` target was unmounted from the scene graph.
   * @param propagationPath - The propagation path was valid in the past.
   * @returns - The most specific event-target still mounted at the same location in the scene graph.
   */
  findMountedTarget(e) {
    if (!e)
      return null;
    let t = e[0];
    for (let r = 1; r < e.length && e[r].parent === t; r++)
      t = e[r];
    return t;
  }
  /**
   * Creates an event whose {@code originalEvent} is {@code from}, with an optional `type` and `target` override.
   *
   * The event is allocated using {@link EventBoundary#allocateEvent this.allocateEvent}.
   * @param from - The {@code originalEvent} for the returned event.
   * @param [type=from.type] - The type of the returned event.
   * @param target - The target of the returned event.
   */
  createPointerEvent(e, t, r) {
    const i = this.allocateEvent(Ue);
    return this.copyPointerData(e, i), this.copyMouseData(e, i), this.copyData(e, i), i.nativeEvent = e.nativeEvent, i.originalEvent = e, i.target = r ?? this.hitTest(i.global.x, i.global.y) ?? this._hitElements[0], typeof t == "string" && (i.type = t), i;
  }
  /**
   * Creates a wheel event whose {@code originalEvent} is {@code from}.
   *
   * The event is allocated using {@link EventBoundary#allocateEvent this.allocateEvent}.
   * @param from - The upstream wheel event.
   */
  createWheelEvent(e) {
    const t = this.allocateEvent(Rt);
    return this.copyWheelData(e, t), this.copyMouseData(e, t), this.copyData(e, t), t.nativeEvent = e.nativeEvent, t.originalEvent = e, t.target = this.hitTest(t.global.x, t.global.y), t;
  }
  /**
   * Clones the event {@code from}, with an optional {@code type} override.
   *
   * The event is allocated using {@link EventBoundary#allocateEvent this.allocateEvent}.
   * @param from - The event to clone.
   * @param [type=from.type] - The type of the returned event.
   */
  clonePointerEvent(e, t) {
    const r = this.allocateEvent(Ue);
    return r.nativeEvent = e.nativeEvent, r.originalEvent = e.originalEvent, this.copyPointerData(e, r), this.copyMouseData(e, r), this.copyData(e, r), r.target = e.target, r.path = e.composedPath().slice(), r.type = t ?? r.type, r;
  }
  /**
   * Copies wheel {@link FederatedWheelEvent} data from {@code from} into {@code to}.
   *
   * The following properties are copied:
   * + deltaMode
   * + deltaX
   * + deltaY
   * + deltaZ
   * @param from - The event to copy data from.
   * @param to - The event to copy data into.
   */
  copyWheelData(e, t) {
    t.deltaMode = e.deltaMode, t.deltaX = e.deltaX, t.deltaY = e.deltaY, t.deltaZ = e.deltaZ;
  }
  /**
   * Copies pointer {@link FederatedPointerEvent} data from {@code from} into {@code to}.
   *
   * The following properties are copied:
   * + pointerId
   * + width
   * + height
   * + isPrimary
   * + pointerType
   * + pressure
   * + tangentialPressure
   * + tiltX
   * + tiltY
   * @param from - The event to copy data from.
   * @param to - The event to copy data into.
   */
  copyPointerData(e, t) {
    e instanceof Ue && t instanceof Ue && (t.pointerId = e.pointerId, t.width = e.width, t.height = e.height, t.isPrimary = e.isPrimary, t.pointerType = e.pointerType, t.pressure = e.pressure, t.tangentialPressure = e.tangentialPressure, t.tiltX = e.tiltX, t.tiltY = e.tiltY, t.twist = e.twist);
  }
  /**
   * Copies mouse {@link FederatedMouseEvent} data from {@code from} to {@code to}.
   *
   * The following properties are copied:
   * + altKey
   * + button
   * + buttons
   * + clientX
   * + clientY
   * + metaKey
   * + movementX
   * + movementY
   * + pageX
   * + pageY
   * + x
   * + y
   * + screen
   * + shiftKey
   * + global
   * @param from - The event to copy data from.
   * @param to - The event to copy data into.
   */
  copyMouseData(e, t) {
    e instanceof Hr && t instanceof Hr && (t.altKey = e.altKey, t.button = e.button, t.buttons = e.buttons, t.client.copyFrom(e.client), t.ctrlKey = e.ctrlKey, t.metaKey = e.metaKey, t.movement.copyFrom(e.movement), t.screen.copyFrom(e.screen), t.shiftKey = e.shiftKey, t.global.copyFrom(e.global));
  }
  /**
   * Copies base {@link FederatedEvent} data from {@code from} into {@code to}.
   *
   * The following properties are copied:
   * + isTrusted
   * + srcElement
   * + timeStamp
   * + type
   * @param from - The event to copy data from.
   * @param to - The event to copy data into.
   */
  copyData(e, t) {
    t.isTrusted = e.isTrusted, t.srcElement = e.srcElement, t.timeStamp = performance.now(), t.type = e.type, t.detail = e.detail, t.view = e.view, t.which = e.which, t.layer.copyFrom(e.layer), t.page.copyFrom(e.page);
  }
  /**
   * @param id - The pointer ID.
   * @returns The tracking data stored for the given pointer. If no data exists, a blank
   *  state will be created.
   */
  trackingData(e) {
    return this.mappingState.trackingData[e] || (this.mappingState.trackingData[e] = {
      pressTargetsByButton: {},
      clicksByButton: {},
      overTarget: null
    }), this.mappingState.trackingData[e];
  }
  /**
   * Allocate a specific type of event from {@link EventBoundary#eventPool this.eventPool}.
   *
   * This allocation is constructor-agnostic, as long as it only takes one argument - this event
   * boundary.
   * @param constructor - The event's constructor.
   */
  allocateEvent(e) {
    this.eventPool.has(e) || this.eventPool.set(e, []);
    const t = this.eventPool.get(e).pop() || new e(this);
    return t.eventPhase = t.NONE, t.currentTarget = null, t.defaultPrevented = !1, t.path = null, t.target = null, t;
  }
  /**
   * Frees the event and puts it back into the event pool.
   *
   * It is illegal to reuse the event until it is allocated again, using `this.allocateEvent`.
   *
   * It is also advised that events not allocated from {@link EventBoundary#allocateEvent this.allocateEvent}
   * not be freed. This is because of the possibility that the same event is freed twice, which can cause
   * it to be allocated twice & result in overwriting.
   * @param event - The event to be freed.
   * @throws Error if the event is managed by another event boundary.
   */
  freeEvent(e) {
    if (e.manager !== this)
      throw new Error("It is illegal to free an event not managed by this EventBoundary!");
    const t = e.constructor;
    this.eventPool.has(t) || this.eventPool.set(t, []), this.eventPool.get(t).push(e);
  }
  /**
   * Similar to {@link EventEmitter.emit}, except it stops if the `propagationImmediatelyStopped` flag
   * is set on the event.
   * @param e - The event to call each listener with.
   * @param type - The event key.
   */
  _notifyListeners(e, t) {
    const r = e.currentTarget._events[t];
    if (r)
      if ("fn" in r)
        r.once && e.currentTarget.removeListener(t, r.fn, void 0, !0), r.fn.call(r.context, e);
      else
        for (let i = 0, n = r.length; i < n && !e.propagationImmediatelyStopped; i++)
          r[i].once && e.currentTarget.removeListener(t, r[i].fn, void 0, !0), r[i].fn.call(r[i].context, e);
  }
}
const kp = 1, Ip = {
  touchstart: "pointerdown",
  touchend: "pointerup",
  touchendoutside: "pointerupoutside",
  touchmove: "pointermove",
  touchcancel: "pointercancel"
}, Oi = class ii {
  /**
   * @param {Renderer} renderer
   */
  constructor(e) {
    this.supportsTouchEvents = "ontouchstart" in globalThis, this.supportsPointerEvents = !!globalThis.PointerEvent, this.domElement = null, this.resolution = 1, this.renderer = e, this.rootBoundary = new Rp(null), st.init(this), this.autoPreventDefault = !0, this._eventsAdded = !1, this._rootPointerEvent = new Ue(null), this._rootWheelEvent = new Rt(null), this.cursorStyles = {
      default: "inherit",
      pointer: "pointer"
    }, this.features = new Proxy({ ...ii.defaultEventFeatures }, {
      set: (t, r, i) => (r === "globalMove" && (this.rootBoundary.enableGlobalMoveEvents = i), t[r] = i, !0)
    }), this._onPointerDown = this._onPointerDown.bind(this), this._onPointerMove = this._onPointerMove.bind(this), this._onPointerUp = this._onPointerUp.bind(this), this._onPointerOverOut = this._onPointerOverOut.bind(this), this.onWheel = this.onWheel.bind(this);
  }
  /**
   * The default interaction mode for all display objects.
   * @see Container.eventMode
   * @type {EventMode}
   * @readonly
   * @since 7.2.0
   */
  static get defaultEventMode() {
    return this._defaultEventMode;
  }
  /**
   * Runner init called, view is available at this point.
   * @ignore
   */
  init(e) {
    const { canvas: t, resolution: r } = this.renderer;
    this.setTargetElement(t), this.resolution = r, ii._defaultEventMode = e.eventMode ?? "passive", Object.assign(this.features, e.eventFeatures ?? {}), this.rootBoundary.enableGlobalMoveEvents = this.features.globalMove;
  }
  /**
   * Handle changing resolution.
   * @ignore
   */
  resolutionChange(e) {
    this.resolution = e;
  }
  /** Destroys all event listeners and detaches the renderer. */
  destroy() {
    this.setTargetElement(null), this.renderer = null, this._currentCursor = null;
  }
  /**
   * Sets the current cursor mode, handling any callbacks or CSS style changes.
   * @param mode - cursor mode, a key from the cursorStyles dictionary
   */
  setCursor(e) {
    e || (e = "default");
    let t = !0;
    if (globalThis.OffscreenCanvas && this.domElement instanceof OffscreenCanvas && (t = !1), this._currentCursor === e)
      return;
    this._currentCursor = e;
    const r = this.cursorStyles[e];
    if (r)
      switch (typeof r) {
        case "string":
          t && (this.domElement.style.cursor = r);
          break;
        case "function":
          r(e);
          break;
        case "object":
          t && Object.assign(this.domElement.style, r);
          break;
      }
    else t && typeof e == "string" && !Object.prototype.hasOwnProperty.call(this.cursorStyles, e) && (this.domElement.style.cursor = e);
  }
  /**
   * The global pointer event.
   * Useful for getting the pointer position without listening to events.
   * @since 7.2.0
   */
  get pointer() {
    return this._rootPointerEvent;
  }
  /**
   * Event handler for pointer down events on {@link EventSystem#domElement this.domElement}.
   * @param nativeEvent - The native mouse/pointer/touch event.
   */
  _onPointerDown(e) {
    if (!this.features.click)
      return;
    this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;
    const t = this._normalizeToPointerData(e);
    this.autoPreventDefault && t[0].isNormalized && (e.cancelable || !("cancelable" in e)) && e.preventDefault();
    for (let r = 0, i = t.length; r < i; r++) {
      const n = t[r], a = this._bootstrapEvent(this._rootPointerEvent, n);
      this.rootBoundary.mapEvent(a);
    }
    this.setCursor(this.rootBoundary.cursor);
  }
  /**
   * Event handler for pointer move events on on {@link EventSystem#domElement this.domElement}.
   * @param nativeEvent - The native mouse/pointer/touch events.
   */
  _onPointerMove(e) {
    if (!this.features.move)
      return;
    this.rootBoundary.rootTarget = this.renderer.lastObjectRendered, st.pointerMoved();
    const t = this._normalizeToPointerData(e);
    for (let r = 0, i = t.length; r < i; r++) {
      const n = this._bootstrapEvent(this._rootPointerEvent, t[r]);
      this.rootBoundary.mapEvent(n);
    }
    this.setCursor(this.rootBoundary.cursor);
  }
  /**
   * Event handler for pointer up events on {@link EventSystem#domElement this.domElement}.
   * @param nativeEvent - The native mouse/pointer/touch event.
   */
  _onPointerUp(e) {
    if (!this.features.click)
      return;
    this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;
    let t = e.target;
    e.composedPath && e.composedPath().length > 0 && (t = e.composedPath()[0]);
    const r = t !== this.domElement ? "outside" : "", i = this._normalizeToPointerData(e);
    for (let n = 0, a = i.length; n < a; n++) {
      const o = this._bootstrapEvent(this._rootPointerEvent, i[n]);
      o.type += r, this.rootBoundary.mapEvent(o);
    }
    this.setCursor(this.rootBoundary.cursor);
  }
  /**
   * Event handler for pointer over & out events on {@link EventSystem#domElement this.domElement}.
   * @param nativeEvent - The native mouse/pointer/touch event.
   */
  _onPointerOverOut(e) {
    if (!this.features.click)
      return;
    this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;
    const t = this._normalizeToPointerData(e);
    for (let r = 0, i = t.length; r < i; r++) {
      const n = this._bootstrapEvent(this._rootPointerEvent, t[r]);
      this.rootBoundary.mapEvent(n);
    }
    this.setCursor(this.rootBoundary.cursor);
  }
  /**
   * Passive handler for `wheel` events on {@link EventSystem.domElement this.domElement}.
   * @param nativeEvent - The native wheel event.
   */
  onWheel(e) {
    if (!this.features.wheel)
      return;
    const t = this.normalizeWheelEvent(e);
    this.rootBoundary.rootTarget = this.renderer.lastObjectRendered, this.rootBoundary.mapEvent(t);
  }
  /**
   * Sets the {@link EventSystem#domElement domElement} and binds event listeners.
   *
   * To deregister the current DOM element without setting a new one, pass {@code null}.
   * @param element - The new DOM element.
   */
  setTargetElement(e) {
    this._removeEvents(), this.domElement = e, st.domElement = e, this._addEvents();
  }
  /** Register event listeners on {@link Renderer#domElement this.domElement}. */
  _addEvents() {
    if (this._eventsAdded || !this.domElement)
      return;
    st.addTickerListener();
    const e = this.domElement.style;
    e && (globalThis.navigator.msPointerEnabled ? (e.msContentZooming = "none", e.msTouchAction = "none") : this.supportsPointerEvents && (e.touchAction = "none")), this.supportsPointerEvents ? (globalThis.document.addEventListener("pointermove", this._onPointerMove, !0), this.domElement.addEventListener("pointerdown", this._onPointerDown, !0), this.domElement.addEventListener("pointerleave", this._onPointerOverOut, !0), this.domElement.addEventListener("pointerover", this._onPointerOverOut, !0), globalThis.addEventListener("pointerup", this._onPointerUp, !0)) : (globalThis.document.addEventListener("mousemove", this._onPointerMove, !0), this.domElement.addEventListener("mousedown", this._onPointerDown, !0), this.domElement.addEventListener("mouseout", this._onPointerOverOut, !0), this.domElement.addEventListener("mouseover", this._onPointerOverOut, !0), globalThis.addEventListener("mouseup", this._onPointerUp, !0), this.supportsTouchEvents && (this.domElement.addEventListener("touchstart", this._onPointerDown, !0), this.domElement.addEventListener("touchend", this._onPointerUp, !0), this.domElement.addEventListener("touchmove", this._onPointerMove, !0))), this.domElement.addEventListener("wheel", this.onWheel, {
      passive: !0,
      capture: !0
    }), this._eventsAdded = !0;
  }
  /** Unregister event listeners on {@link EventSystem#domElement this.domElement}. */
  _removeEvents() {
    if (!this._eventsAdded || !this.domElement)
      return;
    st.removeTickerListener();
    const e = this.domElement.style;
    e && (globalThis.navigator.msPointerEnabled ? (e.msContentZooming = "", e.msTouchAction = "") : this.supportsPointerEvents && (e.touchAction = "")), this.supportsPointerEvents ? (globalThis.document.removeEventListener("pointermove", this._onPointerMove, !0), this.domElement.removeEventListener("pointerdown", this._onPointerDown, !0), this.domElement.removeEventListener("pointerleave", this._onPointerOverOut, !0), this.domElement.removeEventListener("pointerover", this._onPointerOverOut, !0), globalThis.removeEventListener("pointerup", this._onPointerUp, !0)) : (globalThis.document.removeEventListener("mousemove", this._onPointerMove, !0), this.domElement.removeEventListener("mousedown", this._onPointerDown, !0), this.domElement.removeEventListener("mouseout", this._onPointerOverOut, !0), this.domElement.removeEventListener("mouseover", this._onPointerOverOut, !0), globalThis.removeEventListener("mouseup", this._onPointerUp, !0), this.supportsTouchEvents && (this.domElement.removeEventListener("touchstart", this._onPointerDown, !0), this.domElement.removeEventListener("touchend", this._onPointerUp, !0), this.domElement.removeEventListener("touchmove", this._onPointerMove, !0))), this.domElement.removeEventListener("wheel", this.onWheel, !0), this.domElement = null, this._eventsAdded = !1;
  }
  /**
   * Maps x and y coords from a DOM object and maps them correctly to the PixiJS view. The
   * resulting value is stored in the point. This takes into account the fact that the DOM
   * element could be scaled and positioned anywhere on the screen.
   * @param  {PointData} point - the point that the result will be stored in
   * @param  {number} x - the x coord of the position to map
   * @param  {number} y - the y coord of the position to map
   */
  mapPositionToPoint(e, t, r) {
    const i = this.domElement.isConnected ? this.domElement.getBoundingClientRect() : {
      width: this.domElement.width,
      height: this.domElement.height,
      left: 0,
      top: 0
    }, n = 1 / this.resolution;
    e.x = (t - i.left) * (this.domElement.width / i.width) * n, e.y = (r - i.top) * (this.domElement.height / i.height) * n;
  }
  /**
   * Ensures that the original event object contains all data that a regular pointer event would have
   * @param event - The original event data from a touch or mouse event
   * @returns An array containing a single normalized pointer event, in the case of a pointer
   *  or mouse event, or a multiple normalized pointer events if there are multiple changed touches
   */
  _normalizeToPointerData(e) {
    const t = [];
    if (this.supportsTouchEvents && e instanceof TouchEvent)
      for (let r = 0, i = e.changedTouches.length; r < i; r++) {
        const n = e.changedTouches[r];
        typeof n.button > "u" && (n.button = 0), typeof n.buttons > "u" && (n.buttons = 1), typeof n.isPrimary > "u" && (n.isPrimary = e.touches.length === 1 && e.type === "touchstart"), typeof n.width > "u" && (n.width = n.radiusX || 1), typeof n.height > "u" && (n.height = n.radiusY || 1), typeof n.tiltX > "u" && (n.tiltX = 0), typeof n.tiltY > "u" && (n.tiltY = 0), typeof n.pointerType > "u" && (n.pointerType = "touch"), typeof n.pointerId > "u" && (n.pointerId = n.identifier || 0), typeof n.pressure > "u" && (n.pressure = n.force || 0.5), typeof n.twist > "u" && (n.twist = 0), typeof n.tangentialPressure > "u" && (n.tangentialPressure = 0), typeof n.layerX > "u" && (n.layerX = n.offsetX = n.clientX), typeof n.layerY > "u" && (n.layerY = n.offsetY = n.clientY), n.isNormalized = !0, n.type = e.type, t.push(n);
      }
    else if (!globalThis.MouseEvent || e instanceof MouseEvent && (!this.supportsPointerEvents || !(e instanceof globalThis.PointerEvent))) {
      const r = e;
      typeof r.isPrimary > "u" && (r.isPrimary = !0), typeof r.width > "u" && (r.width = 1), typeof r.height > "u" && (r.height = 1), typeof r.tiltX > "u" && (r.tiltX = 0), typeof r.tiltY > "u" && (r.tiltY = 0), typeof r.pointerType > "u" && (r.pointerType = "mouse"), typeof r.pointerId > "u" && (r.pointerId = kp), typeof r.pressure > "u" && (r.pressure = 0.5), typeof r.twist > "u" && (r.twist = 0), typeof r.tangentialPressure > "u" && (r.tangentialPressure = 0), r.isNormalized = !0, t.push(r);
    } else
      t.push(e);
    return t;
  }
  /**
   * Normalizes the native {@link https://w3c.github.io/uievents/#interface-wheelevent WheelEvent}.
   *
   * The returned {@link FederatedWheelEvent} is a shared instance. It will not persist across
   * multiple native wheel events.
   * @param nativeEvent - The native wheel event that occurred on the canvas.
   * @returns A federated wheel event.
   */
  normalizeWheelEvent(e) {
    const t = this._rootWheelEvent;
    return this._transferMouseData(t, e), t.deltaX = e.deltaX, t.deltaY = e.deltaY, t.deltaZ = e.deltaZ, t.deltaMode = e.deltaMode, this.mapPositionToPoint(t.screen, e.clientX, e.clientY), t.global.copyFrom(t.screen), t.offset.copyFrom(t.screen), t.nativeEvent = e, t.type = e.type, t;
  }
  /**
   * Normalizes the `nativeEvent` into a federateed {@link FederatedPointerEvent}.
   * @param event
   * @param nativeEvent
   */
  _bootstrapEvent(e, t) {
    return e.originalEvent = null, e.nativeEvent = t, e.pointerId = t.pointerId, e.width = t.width, e.height = t.height, e.isPrimary = t.isPrimary, e.pointerType = t.pointerType, e.pressure = t.pressure, e.tangentialPressure = t.tangentialPressure, e.tiltX = t.tiltX, e.tiltY = t.tiltY, e.twist = t.twist, this._transferMouseData(e, t), this.mapPositionToPoint(e.screen, t.clientX, t.clientY), e.global.copyFrom(e.screen), e.offset.copyFrom(e.screen), e.isTrusted = t.isTrusted, e.type === "pointerleave" && (e.type = "pointerout"), e.type.startsWith("mouse") && (e.type = e.type.replace("mouse", "pointer")), e.type.startsWith("touch") && (e.type = Ip[e.type] || e.type), e;
  }
  /**
   * Transfers base & mouse event data from the {@code nativeEvent} to the federated event.
   * @param event
   * @param nativeEvent
   */
  _transferMouseData(e, t) {
    e.isTrusted = t.isTrusted, e.srcElement = t.srcElement, e.timeStamp = performance.now(), e.type = t.type, e.altKey = t.altKey, e.button = t.button, e.buttons = t.buttons, e.client.x = t.clientX, e.client.y = t.clientY, e.ctrlKey = t.ctrlKey, e.metaKey = t.metaKey, e.movement.x = t.movementX, e.movement.y = t.movementY, e.page.x = t.pageX, e.page.y = t.pageY, e.relatedTarget = null, e.shiftKey = t.shiftKey;
  }
};
Oi.extension = {
  name: "events",
  type: [
    v.WebGLSystem,
    v.CanvasSystem,
    v.WebGPUSystem
  ],
  priority: -1
};
Oi.defaultEventFeatures = {
  /** Enables pointer events associated with pointer movement. */
  move: !0,
  /** Enables global pointer move events. */
  globalMove: !0,
  /** Enables pointer events associated with clicking. */
  click: !0,
  /** Enables wheel events. */
  wheel: !0
};
let yh = Oi;
const Gp = {
  /**
   * Property-based event handler for the `click` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onclick = (event) => {
   *  //some function here that happens on click
   * }
   */
  onclick: null,
  /**
   * Property-based event handler for the `mousedown` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmousedown = (event) => {
   *  //some function here that happens on mousedown
   * }
   */
  onmousedown: null,
  /**
   * Property-based event handler for the `mouseenter` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmouseenter = (event) => {
   *  //some function here that happens on mouseenter
   * }
   */
  onmouseenter: null,
  /**
   * Property-based event handler for the `mouseleave` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmouseleave = (event) => {
   *  //some function here that happens on mouseleave
   * }
   */
  onmouseleave: null,
  /**
   * Property-based event handler for the `mousemove` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmousemove = (event) => {
   *  //some function here that happens on mousemove
   * }
   */
  onmousemove: null,
  /**
   * Property-based event handler for the `globalmousemove` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onglobalmousemove = (event) => {
   *  //some function here that happens on globalmousemove
   * }
   */
  onglobalmousemove: null,
  /**
   * Property-based event handler for the `mouseout` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmouseout = (event) => {
   *  //some function here that happens on mouseout
   * }
   */
  onmouseout: null,
  /**
   * Property-based event handler for the `mouseover` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmouseover = (event) => {
   *  //some function here that happens on mouseover
   * }
   */
  onmouseover: null,
  /**
   * Property-based event handler for the `mouseup` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmouseup = (event) => {
   *  //some function here that happens on mouseup
   * }
   */
  onmouseup: null,
  /**
   * Property-based event handler for the `mouseupoutside` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmouseupoutside = (event) => {
   *  //some function here that happens on mouseupoutside
   * }
   */
  onmouseupoutside: null,
  /**
   * Property-based event handler for the `pointercancel` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointercancel = (event) => {
   *  //some function here that happens on pointercancel
   * }
   */
  onpointercancel: null,
  /**
   * Property-based event handler for the `pointerdown` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerdown = (event) => {
   *  //some function here that happens on pointerdown
   * }
   */
  onpointerdown: null,
  /**
   * Property-based event handler for the `pointerenter` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerenter = (event) => {
   *  //some function here that happens on pointerenter
   * }
   */
  onpointerenter: null,
  /**
   * Property-based event handler for the `pointerleave` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerleave = (event) => {
   *  //some function here that happens on pointerleave
   * }
   */
  onpointerleave: null,
  /**
   * Property-based event handler for the `pointermove` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointermove = (event) => {
   *  //some function here that happens on pointermove
   * }
   */
  onpointermove: null,
  /**
   * Property-based event handler for the `globalpointermove` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onglobalpointermove = (event) => {
   *  //some function here that happens on globalpointermove
   * }
   */
  onglobalpointermove: null,
  /**
   * Property-based event handler for the `pointerout` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerout = (event) => {
   *  //some function here that happens on pointerout
   * }
   */
  onpointerout: null,
  /**
   * Property-based event handler for the `pointerover` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerover = (event) => {
   *  //some function here that happens on pointerover
   * }
   */
  onpointerover: null,
  /**
   * Property-based event handler for the `pointertap` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointertap = (event) => {
   *  //some function here that happens on pointertap
   * }
   */
  onpointertap: null,
  /**
   * Property-based event handler for the `pointerup` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerup = (event) => {
   *  //some function here that happens on pointerup
   * }
   */
  onpointerup: null,
  /**
   * Property-based event handler for the `pointerupoutside` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerupoutside = (event) => {
   *  //some function here that happens on pointerupoutside
   * }
   */
  onpointerupoutside: null,
  /**
   * Property-based event handler for the `rightclick` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onrightclick = (event) => {
   *  //some function here that happens on rightclick
   * }
   */
  onrightclick: null,
  /**
   * Property-based event handler for the `rightdown` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onrightdown = (event) => {
   *  //some function here that happens on rightdown
   * }
   */
  onrightdown: null,
  /**
   * Property-based event handler for the `rightup` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onrightup = (event) => {
   *  //some function here that happens on rightup
   * }
   */
  onrightup: null,
  /**
   * Property-based event handler for the `rightupoutside` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onrightupoutside = (event) => {
   *  //some function here that happens on rightupoutside
   * }
   */
  onrightupoutside: null,
  /**
   * Property-based event handler for the `tap` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.ontap = (event) => {
   *  //some function here that happens on tap
   * }
   */
  ontap: null,
  /**
   * Property-based event handler for the `touchcancel` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.ontouchcancel = (event) => {
   *  //some function here that happens on touchcancel
   * }
   */
  ontouchcancel: null,
  /**
   * Property-based event handler for the `touchend` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.ontouchend = (event) => {
   *  //some function here that happens on touchend
   * }
   */
  ontouchend: null,
  /**
   * Property-based event handler for the `touchendoutside` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.ontouchendoutside = (event) => {
   *  //some function here that happens on touchendoutside
   * }
   */
  ontouchendoutside: null,
  /**
   * Property-based event handler for the `touchmove` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.ontouchmove = (event) => {
   *  //some function here that happens on touchmove
   * }
   */
  ontouchmove: null,
  /**
   * Property-based event handler for the `globaltouchmove` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onglobaltouchmove = (event) => {
   *  //some function here that happens on globaltouchmove
   * }
   */
  onglobaltouchmove: null,
  /**
   * Property-based event handler for the `touchstart` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.ontouchstart = (event) => {
   *  //some function here that happens on touchstart
   * }
   */
  ontouchstart: null,
  /**
   * Property-based event handler for the `wheel` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onwheel = (event) => {
   *  //some function here that happens on wheel
   * }
   */
  onwheel: null,
  /**
   * Enable interaction events for the Container. Touch, pointer and mouse
   * @memberof scene.Container#
   */
  get interactive() {
    return this.eventMode === "dynamic" || this.eventMode === "static";
  },
  set interactive(s) {
    this.eventMode = s ? "static" : "passive";
  },
  /**
   * @ignore
   */
  _internalEventMode: void 0,
  /**
   * Enable interaction events for the Container. Touch, pointer and mouse.
   * There are 5 types of interaction settings:
   * - `'none'`: Ignores all interaction events, even on its children.
   * - `'passive'`: **(default)** Does not emit events and ignores all hit testing on itself and non-interactive children.
   * Interactive children will still emit events.
   * - `'auto'`: Does not emit events but is hit tested if parent is interactive. Same as `interactive = false` in v7
   * - `'static'`: Emit events and is hit tested. Same as `interaction = true` in v7
   * - `'dynamic'`: Emits events and is hit tested but will also receive mock interaction events fired from a ticker to
   * allow for interaction when the mouse isn't moving
   * @example
   * import { Sprite } from 'pixi.js';
   *
   * const sprite = new Sprite(texture);
   * sprite.eventMode = 'static';
   * sprite.on('tap', (event) => {
   *     // Handle event
   * });
   * @memberof scene.Container#
   * @since 7.2.0
   */
  get eventMode() {
    return this._internalEventMode ?? yh.defaultEventMode;
  },
  set eventMode(s) {
    this._internalEventMode = s;
  },
  /**
   * Determines if the container is interactive or not
   * @returns {boolean} Whether the container is interactive or not
   * @memberof scene.Container#
   * @since 7.2.0
   * @example
   * import { Sprite } from 'pixi.js';
   *
   * const sprite = new Sprite(texture);
   * sprite.eventMode = 'static';
   * sprite.isInteractive(); // true
   *
   * sprite.eventMode = 'dynamic';
   * sprite.isInteractive(); // true
   *
   * sprite.eventMode = 'none';
   * sprite.isInteractive(); // false
   *
   * sprite.eventMode = 'passive';
   * sprite.isInteractive(); // false
   *
   * sprite.eventMode = 'auto';
   * sprite.isInteractive(); // false
   */
  isInteractive() {
    return this.eventMode === "static" || this.eventMode === "dynamic";
  },
  /**
   * Determines if the children to the container can be clicked/touched
   * Setting this to false allows PixiJS to bypass a recursive `hitTest` function
   * @memberof scene.Container#
   */
  interactiveChildren: !0,
  /**
   * Interaction shape. Children will be hit first, then this shape will be checked.
   * Setting this will cause this shape to be checked in hit tests rather than the container's bounds.
   * @example
   * import { Rectangle, Sprite } from 'pixi.js';
   *
   * const sprite = new Sprite(texture);
   * sprite.interactive = true;
   * sprite.hitArea = new Rectangle(0, 0, 100, 100);
   * @member {IHitArea}
   * @memberof scene.Container#
   */
  hitArea: null,
  /**
   * Unlike `on` or `addListener` which are methods from EventEmitter, `addEventListener`
   * seeks to be compatible with the DOM's `addEventListener` with support for options.
   * @memberof scene.Container
   * @param type - The type of event to listen to.
   * @param listener - The listener callback or object.
   * @param options - Listener options, used for capture phase.
   * @example
   * // Tell the user whether they did a single, double, triple, or nth click.
   * button.addEventListener('click', {
   *     handleEvent(e): {
   *         let prefix;
   *
   *         switch (e.detail) {
   *             case 1: prefix = 'single'; break;
   *             case 2: prefix = 'double'; break;
   *             case 3: prefix = 'triple'; break;
   *             default: prefix = e.detail + 'th'; break;
   *         }
   *
   *         console.log('That was a ' + prefix + 'click');
   *     }
   * });
   *
   * // But skip the first click!
   * button.parent.addEventListener('click', function blockClickOnce(e) {
   *     e.stopImmediatePropagation();
   *     button.parent.removeEventListener('click', blockClickOnce, true);
   * }, {
   *     capture: true,
   * });
   */
  addEventListener(s, e, t) {
    const r = typeof t == "boolean" && t || typeof t == "object" && t.capture, i = typeof t == "object" ? t.signal : void 0, n = typeof t == "object" ? t.once === !0 : !1, a = typeof e == "function" ? void 0 : e;
    s = r ? `${s}capture` : s;
    const o = typeof e == "function" ? e : e.handleEvent, h = this;
    i && i.addEventListener("abort", () => {
      h.off(s, o, a);
    }), n ? h.once(s, o, a) : h.on(s, o, a);
  },
  /**
   * Unlike `off` or `removeListener` which are methods from EventEmitter, `removeEventListener`
   * seeks to be compatible with the DOM's `removeEventListener` with support for options.
   * @memberof scene.Container
   * @param type - The type of event the listener is bound to.
   * @param listener - The listener callback or object.
   * @param options - The original listener options. This is required to deregister a capture phase listener.
   */
  removeEventListener(s, e, t) {
    const r = typeof t == "boolean" && t || typeof t == "object" && t.capture, i = typeof e == "function" ? void 0 : e;
    s = r ? `${s}capture` : s, e = typeof e == "function" ? e : e.handleEvent, this.off(s, e, i);
  },
  /**
   * Dispatch the event on this {@link Container} using the event's {@link EventBoundary}.
   *
   * The target of the event is set to `this` and the `defaultPrevented` flag is cleared before dispatch.
   * @memberof scene.Container
   * @param e - The event to dispatch.
   * @returns Whether the {@link FederatedEvent.preventDefault preventDefault}() method was not invoked.
   * @example
   * // Reuse a click event!
   * button.dispatchEvent(clickEvent);
   */
  dispatchEvent(s) {
    if (!(s instanceof sr))
      throw new Error("Container cannot propagate events outside of the Federated Events API");
    return s.defaultPrevented = !1, s.path = null, s.target = this, s.manager.dispatchEvent(s), !s.defaultPrevented;
  }
};
var Up = `in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`, Fp = `
in vec2 vTextureCoord;
in vec4 vColor;

out vec4 finalColor;

uniform float uColorMatrix[20];
uniform float uAlpha;

uniform sampler2D uTexture;

float rand(vec2 co)
{
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main()
{
    vec4 color = texture(uTexture, vTextureCoord);
    float randomValue = rand(gl_FragCoord.xy * 0.2);
    float diff = (randomValue - 0.5) *  0.5;

    if (uAlpha == 0.0) {
        finalColor = color;
        return;
    }

    if (color.a > 0.0) {
        color.rgb /= color.a;
    }

    vec4 result;

    result.r = (uColorMatrix[0] * color.r);
        result.r += (uColorMatrix[1] * color.g);
        result.r += (uColorMatrix[2] * color.b);
        result.r += (uColorMatrix[3] * color.a);
        result.r += uColorMatrix[4];

    result.g = (uColorMatrix[5] * color.r);
        result.g += (uColorMatrix[6] * color.g);
        result.g += (uColorMatrix[7] * color.b);
        result.g += (uColorMatrix[8] * color.a);
        result.g += uColorMatrix[9];

    result.b = (uColorMatrix[10] * color.r);
       result.b += (uColorMatrix[11] * color.g);
       result.b += (uColorMatrix[12] * color.b);
       result.b += (uColorMatrix[13] * color.a);
       result.b += uColorMatrix[14];

    result.a = (uColorMatrix[15] * color.r);
       result.a += (uColorMatrix[16] * color.g);
       result.a += (uColorMatrix[17] * color.b);
       result.a += (uColorMatrix[18] * color.a);
       result.a += uColorMatrix[19];

    vec3 rgb = mix(color.rgb, result.rgb, uAlpha);

    // Premultiply alpha again.
    rgb *= result.a;

    finalColor = vec4(rgb, result.a);
}
`, ba = `struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,
};

struct ColorMatrixUniforms {
  uColorMatrix:array<vec4<f32>, 5>,
  uAlpha:f32,
};


@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler : sampler;
@group(1) @binding(0) var<uniform> colorMatrixUniforms : ColorMatrixUniforms;


struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv : vec2<f32>,
  };
  
fn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>
{
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;

    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>
{
  return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

@vertex
fn mainVertex(
  @location(0) aPosition : vec2<f32>, 
) -> VSOutput {
  return VSOutput(
   filterVertexPosition(aPosition),
   filterTextureCoord(aPosition),
  );
}


@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
) -> @location(0) vec4<f32> {


  var c = textureSample(uTexture, uSampler, uv);
  
  if (colorMatrixUniforms.uAlpha == 0.0) {
    return c;
  }

 
    // Un-premultiply alpha before applying the color matrix. See issue #3539.
    if (c.a > 0.0) {
      c.r /= c.a;
      c.g /= c.a;
      c.b /= c.a;
    }

    var cm = colorMatrixUniforms.uColorMatrix;


    var result = vec4<f32>(0.);

    result.r = (cm[0][0] * c.r);
    result.r += (cm[0][1] * c.g);
    result.r += (cm[0][2] * c.b);
    result.r += (cm[0][3] * c.a);
    result.r += cm[1][0];

    result.g = (cm[1][1] * c.r);
    result.g += (cm[1][2] * c.g);
    result.g += (cm[1][3] * c.b);
    result.g += (cm[2][0] * c.a);
    result.g += cm[2][1];

    result.b = (cm[2][2] * c.r);
    result.b += (cm[2][3] * c.g);
    result.b += (cm[3][0] * c.b);
    result.b += (cm[3][1] * c.a);
    result.b += cm[3][2];

    result.a = (cm[3][3] * c.r);
    result.a += (cm[4][0] * c.g);
    result.a += (cm[4][1] * c.b);
    result.a += (cm[4][2] * c.a);
    result.a += cm[4][3];

    var rgb = mix(c.rgb, result.rgb, colorMatrixUniforms.uAlpha);

    rgb.r *= result.a;
    rgb.g *= result.a;
    rgb.b *= result.a;

    return vec4(rgb, result.a);
}`;
class va extends Go {
  constructor(e = {}) {
    const t = new be({
      uColorMatrix: {
        value: [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        type: "f32",
        size: 20
      },
      uAlpha: {
        value: 1,
        type: "f32"
      }
    }), r = lt.from({
      vertex: {
        source: ba,
        entryPoint: "mainVertex"
      },
      fragment: {
        source: ba,
        entryPoint: "mainFragment"
      }
    }), i = yt.from({
      vertex: Up,
      fragment: Fp,
      name: "color-matrix-filter"
    });
    super({
      ...e,
      gpuProgram: r,
      glProgram: i,
      resources: {
        colorMatrixUniforms: t
      }
    }), this.alpha = 1;
  }
  /**
   * Transforms current matrix and set the new one
   * @param {number[]} matrix - 5x4 matrix
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  _loadMatrix(e, t = !1) {
    let r = e;
    t && (this._multiply(r, this.matrix, e), r = this._colorMatrix(r)), this.resources.colorMatrixUniforms.uniforms.uColorMatrix = r, this.resources.colorMatrixUniforms.update();
  }
  /**
   * Multiplies two mat5's
   * @private
   * @param out - 5x4 matrix the receiving matrix
   * @param a - 5x4 matrix the first operand
   * @param b - 5x4 matrix the second operand
   * @returns {number[]} 5x4 matrix
   */
  _multiply(e, t, r) {
    return e[0] = t[0] * r[0] + t[1] * r[5] + t[2] * r[10] + t[3] * r[15], e[1] = t[0] * r[1] + t[1] * r[6] + t[2] * r[11] + t[3] * r[16], e[2] = t[0] * r[2] + t[1] * r[7] + t[2] * r[12] + t[3] * r[17], e[3] = t[0] * r[3] + t[1] * r[8] + t[2] * r[13] + t[3] * r[18], e[4] = t[0] * r[4] + t[1] * r[9] + t[2] * r[14] + t[3] * r[19] + t[4], e[5] = t[5] * r[0] + t[6] * r[5] + t[7] * r[10] + t[8] * r[15], e[6] = t[5] * r[1] + t[6] * r[6] + t[7] * r[11] + t[8] * r[16], e[7] = t[5] * r[2] + t[6] * r[7] + t[7] * r[12] + t[8] * r[17], e[8] = t[5] * r[3] + t[6] * r[8] + t[7] * r[13] + t[8] * r[18], e[9] = t[5] * r[4] + t[6] * r[9] + t[7] * r[14] + t[8] * r[19] + t[9], e[10] = t[10] * r[0] + t[11] * r[5] + t[12] * r[10] + t[13] * r[15], e[11] = t[10] * r[1] + t[11] * r[6] + t[12] * r[11] + t[13] * r[16], e[12] = t[10] * r[2] + t[11] * r[7] + t[12] * r[12] + t[13] * r[17], e[13] = t[10] * r[3] + t[11] * r[8] + t[12] * r[13] + t[13] * r[18], e[14] = t[10] * r[4] + t[11] * r[9] + t[12] * r[14] + t[13] * r[19] + t[14], e[15] = t[15] * r[0] + t[16] * r[5] + t[17] * r[10] + t[18] * r[15], e[16] = t[15] * r[1] + t[16] * r[6] + t[17] * r[11] + t[18] * r[16], e[17] = t[15] * r[2] + t[16] * r[7] + t[17] * r[12] + t[18] * r[17], e[18] = t[15] * r[3] + t[16] * r[8] + t[17] * r[13] + t[18] * r[18], e[19] = t[15] * r[4] + t[16] * r[9] + t[17] * r[14] + t[18] * r[19] + t[19], e;
  }
  /**
   * Create a Float32 Array and normalize the offset component to 0-1
   * @param {number[]} matrix - 5x4 matrix
   * @returns {number[]} 5x4 matrix with all values between 0-1
   */
  _colorMatrix(e) {
    const t = new Float32Array(e);
    return t[4] /= 255, t[9] /= 255, t[14] /= 255, t[19] /= 255, t;
  }
  /**
   * Adjusts brightness
   * @param b - value of the brightness (0-1, where 0 is black)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  brightness(e, t) {
    const r = [
      e,
      0,
      0,
      0,
      0,
      0,
      e,
      0,
      0,
      0,
      0,
      0,
      e,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(r, t);
  }
  /**
   * Sets each channel on the diagonal of the color matrix.
   * This can be used to achieve a tinting effect on Containers similar to the tint field of some
   * display objects like Sprite, Text, Graphics, and Mesh.
   * @param color - Color of the tint. This is a hex value.
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  tint(e, t) {
    const [r, i, n] = re.shared.setValue(e).toArray(), a = [
      r,
      0,
      0,
      0,
      0,
      0,
      i,
      0,
      0,
      0,
      0,
      0,
      n,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(a, t);
  }
  /**
   * Set the matrices in grey scales
   * @param scale - value of the grey (0-1, where 0 is black)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  greyscale(e, t) {
    const r = [
      e,
      e,
      e,
      0,
      0,
      e,
      e,
      e,
      0,
      0,
      e,
      e,
      e,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(r, t);
  }
  /**
   * for our american friends!
   * @param scale
   * @param multiply
   */
  grayscale(e, t) {
    this.greyscale(e, t);
  }
  /**
   * Set the black and white matrice.
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  blackAndWhite(e) {
    const t = [
      0.3,
      0.6,
      0.1,
      0,
      0,
      0.3,
      0.6,
      0.1,
      0,
      0,
      0.3,
      0.6,
      0.1,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(t, e);
  }
  /**
   * Set the hue property of the color
   * @param rotation - in degrees
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  hue(e, t) {
    e = (e || 0) / 180 * Math.PI;
    const r = Math.cos(e), i = Math.sin(e), n = Math.sqrt, a = 1 / 3, o = n(a), h = r + (1 - r) * a, l = a * (1 - r) - o * i, c = a * (1 - r) + o * i, u = a * (1 - r) + o * i, d = r + a * (1 - r), f = a * (1 - r) - o * i, p = a * (1 - r) - o * i, g = a * (1 - r) + o * i, m = r + a * (1 - r), y = [
      h,
      l,
      c,
      0,
      0,
      u,
      d,
      f,
      0,
      0,
      p,
      g,
      m,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(y, t);
  }
  /**
   * Set the contrast matrix, increase the separation between dark and bright
   * Increase contrast : shadows darker and highlights brighter
   * Decrease contrast : bring the shadows up and the highlights down
   * @param amount - value of the contrast (0-1)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  contrast(e, t) {
    const r = (e || 0) + 1, i = -0.5 * (r - 1), n = [
      r,
      0,
      0,
      0,
      i,
      0,
      r,
      0,
      0,
      i,
      0,
      0,
      r,
      0,
      i,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(n, t);
  }
  /**
   * Set the saturation matrix, increase the separation between colors
   * Increase saturation : increase contrast, brightness, and sharpness
   * @param amount - The saturation amount (0-1)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  saturate(e = 0, t) {
    const r = e * 2 / 3 + 1, i = (r - 1) * -0.5, n = [
      r,
      i,
      i,
      0,
      0,
      i,
      r,
      i,
      0,
      0,
      i,
      i,
      r,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(n, t);
  }
  /** Desaturate image (remove color) Call the saturate function */
  desaturate() {
    this.saturate(-1);
  }
  /**
   * Negative image (inverse of classic rgb matrix)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  negative(e) {
    const t = [
      -1,
      0,
      0,
      1,
      0,
      0,
      -1,
      0,
      1,
      0,
      0,
      0,
      -1,
      1,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(t, e);
  }
  /**
   * Sepia image
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  sepia(e) {
    const t = [
      0.393,
      0.7689999,
      0.18899999,
      0,
      0,
      0.349,
      0.6859999,
      0.16799999,
      0,
      0,
      0.272,
      0.5339999,
      0.13099999,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(t, e);
  }
  /**
   * Color motion picture process invented in 1916 (thanks Dominic Szablewski)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  technicolor(e) {
    const t = [
      1.9125277891456083,
      -0.8545344976951645,
      -0.09155508482755585,
      0,
      11.793603434377337,
      -0.3087833385928097,
      1.7658908555458428,
      -0.10601743074722245,
      0,
      -70.35205161461398,
      -0.231103377548616,
      -0.7501899197440212,
      1.847597816108189,
      0,
      30.950940869491138,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(t, e);
  }
  /**
   * Polaroid filter
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  polaroid(e) {
    const t = [
      1.438,
      -0.062,
      -0.062,
      0,
      0,
      -0.122,
      1.378,
      -0.122,
      0,
      0,
      -0.016,
      -0.016,
      1.483,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(t, e);
  }
  /**
   * Filter who transforms : Red -> Blue and Blue -> Red
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  toBGR(e) {
    const t = [
      0,
      0,
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(t, e);
  }
  /**
   * Color reversal film introduced by Eastman Kodak in 1935. (thanks Dominic Szablewski)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  kodachrome(e) {
    const t = [
      1.1285582396593525,
      -0.3967382283601348,
      -0.03992559172921793,
      0,
      63.72958762196502,
      -0.16404339962244616,
      1.0835251566291304,
      -0.05498805115633132,
      0,
      24.732407896706203,
      -0.16786010706155763,
      -0.5603416277695248,
      1.6014850761964943,
      0,
      35.62982807460946,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(t, e);
  }
  /**
   * Brown delicious browni filter (thanks Dominic Szablewski)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  browni(e) {
    const t = [
      0.5997023498159715,
      0.34553243048391263,
      -0.2708298674538042,
      0,
      47.43192855600873,
      -0.037703249837783157,
      0.8609577587992641,
      0.15059552388459913,
      0,
      -36.96841498319127,
      0.24113635128153335,
      -0.07441037908422492,
      0.44972182064877153,
      0,
      -7.562075277591283,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(t, e);
  }
  /**
   * Vintage filter (thanks Dominic Szablewski)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  vintage(e) {
    const t = [
      0.6279345635605994,
      0.3202183420819367,
      -0.03965408211312453,
      0,
      9.651285835294123,
      0.02578397704808868,
      0.6441188644374771,
      0.03259127616149294,
      0,
      7.462829176470591,
      0.0466055556782719,
      -0.0851232987247891,
      0.5241648018700465,
      0,
      5.159190588235296,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(t, e);
  }
  /**
   * We don't know exactly what it does, kind of gradient map, but funny to play with!
   * @param desaturation - Tone values.
   * @param toned - Tone values.
   * @param lightColor - Tone values, example: `0xFFE580`
   * @param darkColor - Tone values, example: `0xFFE580`
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  colorTone(e, t, r, i, n) {
    e || (e = 0.2), t || (t = 0.15), r || (r = 16770432), i || (i = 3375104);
    const a = re.shared, [o, h, l] = a.setValue(r).toArray(), [c, u, d] = a.setValue(i).toArray(), f = [
      0.3,
      0.59,
      0.11,
      0,
      0,
      o,
      h,
      l,
      e,
      0,
      c,
      u,
      d,
      t,
      0,
      o - c,
      h - u,
      l - d,
      0,
      0
    ];
    this._loadMatrix(f, n);
  }
  /**
   * Night effect
   * @param intensity - The intensity of the night effect.
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  night(e, t) {
    e || (e = 0.1);
    const r = [
      e * -2,
      -e,
      0,
      0,
      0,
      -e,
      0,
      e,
      0,
      0,
      0,
      e,
      e * 2,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(r, t);
  }
  /**
   * Predator effect
   *
   * Erase the current matrix by setting a new independent one
   * @param amount - how much the predator feels his future victim
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  predator(e, t) {
    const r = [
      // row 1
      11.224130630493164 * e,
      -4.794486999511719 * e,
      -2.8746118545532227 * e,
      0 * e,
      0.40342438220977783 * e,
      // row 2
      -3.6330697536468506 * e,
      9.193157196044922 * e,
      -2.951810836791992 * e,
      0 * e,
      -1.316135048866272 * e,
      // row 3
      -3.2184197902679443 * e,
      -4.2375030517578125 * e,
      7.476448059082031 * e,
      0 * e,
      0.8044459223747253 * e,
      // row 4
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(r, t);
  }
  /**
   * LSD effect
   *
   * Multiply the current matrix
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  lsd(e) {
    const t = [
      2,
      -0.4,
      0.5,
      0,
      0,
      -0.5,
      2,
      -0.4,
      0,
      0,
      -0.4,
      -0.5,
      3,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(t, e);
  }
  /** Erase the current matrix by setting the default one. */
  reset() {
    const e = [
      1,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(e, !1);
  }
  /**
   * The matrix of the color matrix filter
   * @member {number[]}
   * @default [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]
   */
  get matrix() {
    return this.resources.colorMatrixUniforms.uniforms.uColorMatrix;
  }
  set matrix(e) {
    this.resources.colorMatrixUniforms.uniforms.uColorMatrix = e;
  }
  /**
   * The opacity value to use when mixing the original and resultant colors.
   *
   * When the value is 0, the original color is used without modification.
   * When the value is 1, the result color is used.
   * When in the range (0, 1) the color is interpolated between the original and result by this amount.
   * @default 1
   */
  get alpha() {
    return this.resources.colorMatrixUniforms.uniforms.uAlpha;
  }
  set alpha(e) {
    this.resources.colorMatrixUniforms.uniforms.uAlpha = e;
  }
}
class bh {
  constructor(e) {
    this._renderer = e;
  }
  push(e, t, r) {
    this._renderer.renderPipes.batch.break(r), r.add({
      renderPipeId: "filter",
      canBundle: !1,
      action: "pushFilter",
      container: t,
      filterEffect: e
    });
  }
  pop(e, t, r) {
    this._renderer.renderPipes.batch.break(r), r.add({
      renderPipeId: "filter",
      action: "popFilter",
      canBundle: !1
    });
  }
  execute(e) {
    e.action === "pushFilter" ? this._renderer.filter.push(e) : e.action === "popFilter" && this._renderer.filter.pop();
  }
  destroy() {
    this._renderer = null;
  }
}
bh.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "filter"
};
function Dp(s, e) {
  e.clear();
  const t = e.matrix;
  for (let r = 0; r < s.length; r++) {
    const i = s[r];
    i.globalDisplayStatus < 7 || (e.matrix = i.worldTransform, e.addBounds(i.bounds));
  }
  return e.matrix = t, e;
}
const Op = new Gt({
  attributes: {
    aPosition: {
      buffer: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      format: "float32x2",
      stride: 8,
      offset: 0
    }
  },
  indexBuffer: new Uint32Array([0, 1, 2, 0, 2, 3])
});
class vh {
  constructor(e) {
    this._filterStackIndex = 0, this._filterStack = [], this._filterGlobalUniforms = new be({
      uInputSize: { value: new Float32Array(4), type: "vec4<f32>" },
      uInputPixel: { value: new Float32Array(4), type: "vec4<f32>" },
      uInputClamp: { value: new Float32Array(4), type: "vec4<f32>" },
      uOutputFrame: { value: new Float32Array(4), type: "vec4<f32>" },
      uGlobalFrame: { value: new Float32Array(4), type: "vec4<f32>" },
      uOutputTexture: { value: new Float32Array(4), type: "vec4<f32>" }
    }), this._globalFilterBindGroup = new Je({}), this.renderer = e;
  }
  /**
   * The back texture of the currently active filter. Requires the filter to have `blendRequired` set to true.
   * @readonly
   */
  get activeBackTexture() {
    var e;
    return (e = this._activeFilterData) == null ? void 0 : e.backTexture;
  }
  push(e) {
    var f;
    const t = this.renderer, r = e.filterEffect.filters;
    this._filterStack[this._filterStackIndex] || (this._filterStack[this._filterStackIndex] = this._getFilterData());
    const i = this._filterStack[this._filterStackIndex];
    if (this._filterStackIndex++, r.length === 0) {
      i.skip = !0;
      return;
    }
    const n = i.bounds;
    if (e.renderables ? Dp(e.renderables, n) : e.filterEffect.filterArea ? (n.clear(), n.addRect(e.filterEffect.filterArea), n.applyMatrix(e.container.worldTransform)) : e.container.getFastGlobalBounds(!0, n), e.container) {
      const g = (e.container.renderGroup || e.container.parentRenderGroup).cacheToLocalTransform;
      g && n.applyMatrix(g);
    }
    const a = t.renderTarget.renderTarget.colorTexture.source;
    let o = 1 / 0, h = 0, l = !0, c = !1, u = !1, d = !0;
    for (let p = 0; p < r.length; p++) {
      const g = r[p];
      if (o = Math.min(o, g.resolution === "inherit" ? a._resolution : g.resolution), h += g.padding, g.antialias === "off" ? l = !1 : g.antialias === "inherit" && l && (l = a.antialias), g.clipToViewport || (d = !1), !!!(g.compatibleRenderers & t.type)) {
        u = !1;
        break;
      }
      if (g.blendRequired && !(((f = t.backBuffer) == null ? void 0 : f.useBackBuffer) ?? !0)) {
        V("Blend filter requires backBuffer on WebGL renderer to be enabled. Set `useBackBuffer: true` in the renderer options."), u = !1;
        break;
      }
      u = g.enabled || u, c || (c = g.blendRequired);
    }
    if (!u) {
      i.skip = !0;
      return;
    }
    if (d) {
      const p = t.renderTarget.rootViewPort, g = t.renderTarget.renderTarget.resolution;
      n.fitBounds(0, p.width / g, 0, p.height / g);
    }
    if (n.scale(o).ceil().scale(1 / o).pad(h | 0), !n.isPositive) {
      i.skip = !0;
      return;
    }
    i.skip = !1, i.bounds = n, i.blendRequired = c, i.container = e.container, i.filterEffect = e.filterEffect, i.previousRenderSurface = t.renderTarget.renderSurface, i.inputTexture = xe.getOptimalTexture(
      n.width,
      n.height,
      o,
      l
    ), t.renderTarget.bind(i.inputTexture, !0), t.globalUniforms.push({
      offset: n
    });
  }
  pop() {
    const e = this.renderer;
    this._filterStackIndex--;
    const t = this._filterStack[this._filterStackIndex];
    if (t.skip)
      return;
    this._activeFilterData = t;
    const r = t.inputTexture, i = t.bounds;
    let n = D.EMPTY;
    if (e.renderTarget.finishRenderPass(), t.blendRequired) {
      const o = this._filterStackIndex > 0 ? this._filterStack[this._filterStackIndex - 1].bounds : null, h = e.renderTarget.getRenderTarget(t.previousRenderSurface);
      n = this.getBackTexture(h, i, o);
    }
    t.backTexture = n;
    const a = t.filterEffect.filters;
    if (this._globalFilterBindGroup.setResource(r.source.style, 2), this._globalFilterBindGroup.setResource(n.source, 3), e.globalUniforms.pop(), a.length === 1)
      a[0].apply(this, r, t.previousRenderSurface, !1), xe.returnTexture(r);
    else {
      let o = t.inputTexture, h = xe.getOptimalTexture(
        i.width,
        i.height,
        o.source._resolution,
        !1
      ), l = 0;
      for (l = 0; l < a.length - 1; ++l) {
        a[l].apply(this, o, h, !0);
        const u = o;
        o = h, h = u;
      }
      a[l].apply(this, o, t.previousRenderSurface, !1), xe.returnTexture(o), xe.returnTexture(h);
    }
    t.blendRequired && xe.returnTexture(n);
  }
  getBackTexture(e, t, r) {
    const i = e.colorTexture.source._resolution, n = xe.getOptimalTexture(
      t.width,
      t.height,
      i,
      !1
    );
    let a = t.minX, o = t.minY;
    r && (a -= r.minX, o -= r.minY), a = Math.floor(a * i), o = Math.floor(o * i);
    const h = Math.ceil(t.width * i), l = Math.ceil(t.height * i);
    return this.renderer.renderTarget.copyToTexture(
      e,
      n,
      { x: a, y: o },
      { width: h, height: l },
      { x: 0, y: 0 }
    ), n;
  }
  applyFilter(e, t, r, i) {
    const n = this.renderer, a = this._filterStack[this._filterStackIndex], o = a.bounds, h = oe.shared, c = a.previousRenderSurface === r;
    let u = this.renderer.renderTarget.rootRenderTarget.colorTexture.source._resolution, d = this._filterStackIndex - 1;
    for (; d > 0 && this._filterStack[d].skip; )
      --d;
    d > 0 && (u = this._filterStack[d].inputTexture.source._resolution);
    const f = this._filterGlobalUniforms, p = f.uniforms, g = p.uOutputFrame, m = p.uInputSize, y = p.uInputPixel, T = p.uInputClamp, S = p.uGlobalFrame, A = p.uOutputTexture;
    if (c) {
      let E = this._filterStackIndex;
      for (; E > 0; ) {
        E--;
        const N = this._filterStack[this._filterStackIndex - 1];
        if (!N.skip) {
          h.x = N.bounds.minX, h.y = N.bounds.minY;
          break;
        }
      }
      g[0] = o.minX - h.x, g[1] = o.minY - h.y;
    } else
      g[0] = 0, g[1] = 0;
    g[2] = t.frame.width, g[3] = t.frame.height, m[0] = t.source.width, m[1] = t.source.height, m[2] = 1 / m[0], m[3] = 1 / m[1], y[0] = t.source.pixelWidth, y[1] = t.source.pixelHeight, y[2] = 1 / y[0], y[3] = 1 / y[1], T[0] = 0.5 * y[2], T[1] = 0.5 * y[3], T[2] = t.frame.width * m[2] - 0.5 * y[2], T[3] = t.frame.height * m[3] - 0.5 * y[3];
    const M = this.renderer.renderTarget.rootRenderTarget.colorTexture;
    S[0] = h.x * u, S[1] = h.y * u, S[2] = M.source.width * u, S[3] = M.source.height * u;
    const P = this.renderer.renderTarget.getRenderTarget(r);
    if (n.renderTarget.bind(r, !!i), r instanceof D ? (A[0] = r.frame.width, A[1] = r.frame.height) : (A[0] = P.width, A[1] = P.height), A[2] = P.isRoot ? -1 : 1, f.update(), n.renderPipes.uniformBatch) {
      const E = n.renderPipes.uniformBatch.getUboResource(f);
      this._globalFilterBindGroup.setResource(E, 0);
    } else
      this._globalFilterBindGroup.setResource(f, 0);
    this._globalFilterBindGroup.setResource(t.source, 1), this._globalFilterBindGroup.setResource(t.source.style, 2), e.groups[0] = this._globalFilterBindGroup, n.encoder.draw({
      geometry: Op,
      shader: e,
      state: e._state,
      topology: "triangle-list"
    }), n.type === Oe.WEBGL && n.renderTarget.finishRenderPass();
  }
  _getFilterData() {
    return {
      skip: !1,
      inputTexture: null,
      bounds: new ye(),
      container: null,
      filterEffect: null,
      blendRequired: !1,
      previousRenderSurface: null
    };
  }
  /**
   * Multiply _input normalized coordinates_ to this matrix to get _sprite texture normalized coordinates_.
   *
   * Use `outputMatrix * vTextureCoord` in the shader.
   * @param outputMatrix - The matrix to output to.
   * @param {Sprite} sprite - The sprite to map to.
   * @returns The mapped matrix.
   */
  calculateSpriteMatrix(e, t) {
    const r = this._activeFilterData, i = e.set(
      r.inputTexture._source.width,
      0,
      0,
      r.inputTexture._source.height,
      r.bounds.minX,
      r.bounds.minY
    ), n = t.worldTransform.copyTo(L.shared), a = t.renderGroup || t.parentRenderGroup;
    return a && a.cacheToLocalTransform && n.prepend(a.cacheToLocalTransform), n.invert(), i.prepend(n), i.scale(
      1 / t.texture.frame.width,
      1 / t.texture.frame.height
    ), i.translate(t.anchor.x, t.anchor.y), i;
  }
}
vh.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem
  ],
  name: "filter"
};
var Lp = `in vec2 vMaskCoord;
in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform sampler2D uMaskTexture;

uniform float uAlpha;
uniform vec4 uMaskClamp;
uniform float uInverse;

out vec4 finalColor;

void main(void)
{
    float clip = step(3.5,
        step(uMaskClamp.x, vMaskCoord.x) +
        step(uMaskClamp.y, vMaskCoord.y) +
        step(vMaskCoord.x, uMaskClamp.z) +
        step(vMaskCoord.y, uMaskClamp.w));

    // TODO look into why this is needed
    float npmAlpha = uAlpha;
    vec4 original = texture(uTexture, vTextureCoord);
    vec4 masky = texture(uMaskTexture, vMaskCoord);
    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);

    float a = alphaMul * masky.r * npmAlpha * clip;

    if (uInverse == 1.0) {
        a = 1.0 - a;
    }

    finalColor = original * a;
}
`, Np = `in vec2 aPosition;

out vec2 vTextureCoord;
out vec2 vMaskCoord;


uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
uniform mat3 uFilterMatrix;

vec4 filterVertexPosition(  vec2 aPosition )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
       
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(  vec2 aPosition )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

vec2 getFilterCoord( vec2 aPosition )
{
    return  ( uFilterMatrix * vec3( filterTextureCoord(aPosition), 1.0)  ).xy;
}   

void main(void)
{
    gl_Position = filterVertexPosition(aPosition);
    vTextureCoord = filterTextureCoord(aPosition);
    vMaskCoord = getFilterCoord(aPosition);
}
`, Ta = `struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,
};

struct MaskUniforms {
  uFilterMatrix:mat3x3<f32>,
  uMaskClamp:vec4<f32>,
  uAlpha:f32,
  uInverse:f32,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler : sampler;

@group(1) @binding(0) var<uniform> filterUniforms : MaskUniforms;
@group(1) @binding(1) var uMaskTexture: texture_2d<f32>;

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) filterUv : vec2<f32>,
};

fn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>
{
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;

    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>
{
    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

fn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>
{
  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);
}

fn getFilterCoord(aPosition:vec2<f32> ) -> vec2<f32>
{
  return ( filterUniforms.uFilterMatrix * vec3( filterTextureCoord(aPosition), 1.0)  ).xy;
}

fn getSize() -> vec2<f32>
{
  return gfu.uGlobalFrame.zw;
}

@vertex
fn mainVertex(
  @location(0) aPosition : vec2<f32>,
) -> VSOutput {
  return VSOutput(
   filterVertexPosition(aPosition),
   filterTextureCoord(aPosition),
   getFilterCoord(aPosition)
  );
}

@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
  @location(1) filterUv: vec2<f32>,
  @builtin(position) position: vec4<f32>
) -> @location(0) vec4<f32> {

    var maskClamp = filterUniforms.uMaskClamp;
    var uAlpha = filterUniforms.uAlpha;

    var clip = step(3.5,
      step(maskClamp.x, filterUv.x) +
      step(maskClamp.y, filterUv.y) +
      step(filterUv.x, maskClamp.z) +
      step(filterUv.y, maskClamp.w));

    var mask = textureSample(uMaskTexture, uSampler, filterUv);
    var source = textureSample(uTexture, uSampler, uv);
    var alphaMul = 1.0 - uAlpha * (1.0 - mask.a);

    var a: f32 = alphaMul * mask.r * uAlpha * clip;

    if (filterUniforms.uInverse == 1.0) {
        a = 1.0 - a;
    }

    return source * a;
}
`;
class Hp extends Go {
  constructor(e) {
    const { sprite: t, ...r } = e, i = new to(t.texture), n = new be({
      uFilterMatrix: { value: new L(), type: "mat3x3<f32>" },
      uMaskClamp: { value: i.uClampFrame, type: "vec4<f32>" },
      uAlpha: { value: 1, type: "f32" },
      uInverse: { value: e.inverse ? 1 : 0, type: "f32" }
    }), a = lt.from({
      vertex: {
        source: Ta,
        entryPoint: "mainVertex"
      },
      fragment: {
        source: Ta,
        entryPoint: "mainFragment"
      }
    }), o = yt.from({
      vertex: Np,
      fragment: Lp,
      name: "mask-filter"
    });
    super({
      ...r,
      gpuProgram: a,
      glProgram: o,
      resources: {
        filterUniforms: n,
        uMaskTexture: t.texture.source
      }
    }), this.sprite = t, this._textureMatrix = i;
  }
  set inverse(e) {
    this.resources.filterUniforms.uniforms.uInverse = e ? 1 : 0;
  }
  get inverse() {
    return this.resources.filterUniforms.uniforms.uInverse === 1;
  }
  apply(e, t, r, i) {
    this._textureMatrix.texture = this.sprite.texture, e.calculateSpriteMatrix(
      this.resources.filterUniforms.uniforms.uFilterMatrix,
      this.sprite
    ).prepend(this._textureMatrix.mapCoord), this.resources.uMaskTexture = this.sprite.texture.source, e.applyFilter(this, t, r, i);
  }
}
function Sa(s, e, t, r, i, n, a, o) {
  const h = a - t, l = o - r, c = i - t, u = n - r, d = s - t, f = e - r, p = h * h + l * l, g = h * c + l * u, m = h * d + l * f, y = c * c + u * u, T = c * d + u * f, S = 1 / (p * y - g * g), A = (y * m - g * T) * S, M = (p * T - g * m) * S;
  return A >= 0 && M >= 0 && A + M < 1;
}
class Ve extends Wr {
  /**
   * @param options - Options for the Graphics.
   */
  constructor(e) {
    e instanceof Be && (e = { context: e });
    const { context: t, roundPixels: r, ...i } = e || {};
    super({
      label: "Graphics",
      ...i
    }), this.renderPipeId = "graphics", t ? this._context = t : this._context = this._ownedContext = new Be(), this._context.on("update", this.onViewUpdate, this), this.allowChildren = !1, this.roundPixels = r ?? !1;
  }
  set context(e) {
    e !== this._context && (this._context.off("update", this.onViewUpdate, this), this._context = e, this._context.on("update", this.onViewUpdate, this), this.onViewUpdate());
  }
  get context() {
    return this._context;
  }
  /**
   * The local bounds of the graphic.
   * @type {rendering.Bounds}
   */
  get bounds() {
    return this._context.bounds;
  }
  /**
   * Graphics objects do not need to update their bounds as the context handles this.
   * @private
   */
  updateBounds() {
  }
  /**
   * Checks if the object contains the given point.
   * @param point - The point to check
   */
  containsPoint(e) {
    return this._context.containsPoint(e);
  }
  /**
   * Destroys this graphics renderable and optionally its context.
   * @param options - Options parameter. A boolean will act as if all options
   *
   * If the context was created by this graphics and `destroy(false)` or `destroy()` is called
   * then the context will still be destroyed.
   *
   * If you want to explicitly not destroy this context that this graphics created,
   * then you should pass destroy({ context: false })
   *
   * If the context was passed in as an argument to the constructor then it will not be destroyed
   * @param {boolean} [options.texture=false] - Should destroy the texture of the graphics context
   * @param {boolean} [options.textureSource=false] - Should destroy the texture source of the graphics context
   * @param {boolean} [options.context=false] - Should destroy the context
   */
  destroy(e) {
    this._ownedContext && !e ? this._ownedContext.destroy(e) : (e === !0 || (e == null ? void 0 : e.context) === !0) && this._context.destroy(e), this._ownedContext = null, this._context = null, super.destroy(e);
  }
  _callContextMethod(e, t) {
    return this.context[e](...t), this;
  }
  // --------------------------------------- GraphicsContext methods ---------------------------------------
  /**
   * Sets the current fill style of the graphics context. The fill style can be a color, gradient,
   * pattern, or a more complex style defined by a FillStyle object.
   * @param {FillInput} args - The fill style to apply. This can be a simple color, a gradient or
   * pattern object, or a FillStyle or ConvertedFillStyle object.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  setFillStyle(...e) {
    return this._callContextMethod("setFillStyle", e);
  }
  /**
   * Sets the current stroke style of the graphics context. Similar to fill styles, stroke styles can
   * encompass colors, gradients, patterns, or more detailed configurations via a StrokeStyle object.
   * @param {StrokeInput} args - The stroke style to apply. Can be defined as a color, a gradient or pattern,
   * or a StrokeStyle or ConvertedStrokeStyle object.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  setStrokeStyle(...e) {
    return this._callContextMethod("setStrokeStyle", e);
  }
  fill(...e) {
    return this._callContextMethod("fill", e);
  }
  /**
   * Strokes the current path with the current stroke style. This method can take an optional
   * FillStyle parameter to define the stroke's appearance, including its color, width, and other properties.
   * @param {FillStyle} args - (Optional) The stroke style to apply. Can be defined as a simple color or a more
   * complex style object. If omitted, uses the current stroke style.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  stroke(...e) {
    return this._callContextMethod("stroke", e);
  }
  texture(...e) {
    return this._callContextMethod("texture", e);
  }
  /**
   * Resets the current path. Any previous path and its commands are discarded and a new path is
   * started. This is typically called before beginning a new shape or series of drawing commands.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  beginPath() {
    return this._callContextMethod("beginPath", []);
  }
  /**
   * Applies a cutout to the last drawn shape. This is used to create holes or complex shapes by
   * subtracting a path from the previously drawn path. If a hole is not completely in a shape, it will
   * fail to cut correctly!
   */
  cut() {
    return this._callContextMethod("cut", []);
  }
  arc(...e) {
    return this._callContextMethod("arc", e);
  }
  arcTo(...e) {
    return this._callContextMethod("arcTo", e);
  }
  arcToSvg(...e) {
    return this._callContextMethod("arcToSvg", e);
  }
  bezierCurveTo(...e) {
    return this._callContextMethod("bezierCurveTo", e);
  }
  /**
   * Closes the current path by drawing a straight line back to the start.
   * If the shape is already closed or there are no points in the path, this method does nothing.
   * @returns The instance of the current object for chaining.
   */
  closePath() {
    return this._callContextMethod("closePath", []);
  }
  ellipse(...e) {
    return this._callContextMethod("ellipse", e);
  }
  circle(...e) {
    return this._callContextMethod("circle", e);
  }
  path(...e) {
    return this._callContextMethod("path", e);
  }
  lineTo(...e) {
    return this._callContextMethod("lineTo", e);
  }
  moveTo(...e) {
    return this._callContextMethod("moveTo", e);
  }
  quadraticCurveTo(...e) {
    return this._callContextMethod("quadraticCurveTo", e);
  }
  rect(...e) {
    return this._callContextMethod("rect", e);
  }
  roundRect(...e) {
    return this._callContextMethod("roundRect", e);
  }
  poly(...e) {
    return this._callContextMethod("poly", e);
  }
  regularPoly(...e) {
    return this._callContextMethod("regularPoly", e);
  }
  roundPoly(...e) {
    return this._callContextMethod("roundPoly", e);
  }
  roundShape(...e) {
    return this._callContextMethod("roundShape", e);
  }
  filletRect(...e) {
    return this._callContextMethod("filletRect", e);
  }
  chamferRect(...e) {
    return this._callContextMethod("chamferRect", e);
  }
  star(...e) {
    return this._callContextMethod("star", e);
  }
  svg(...e) {
    return this._callContextMethod("svg", e);
  }
  restore(...e) {
    return this._callContextMethod("restore", e);
  }
  /** Saves the current graphics state, including transformations, fill styles, and stroke styles, onto a stack. */
  save() {
    return this._callContextMethod("save", []);
  }
  /**
   * Returns the current transformation matrix of the graphics context.
   * @returns The current transformation matrix.
   */
  getTransform() {
    return this.context.getTransform();
  }
  /**
   * Resets the current transformation matrix to the identity matrix, effectively removing
   * any transformations (rotation, scaling, translation) previously applied.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  resetTransform() {
    return this._callContextMethod("resetTransform", []);
  }
  rotateTransform(...e) {
    return this._callContextMethod("rotate", e);
  }
  scaleTransform(...e) {
    return this._callContextMethod("scale", e);
  }
  setTransform(...e) {
    return this._callContextMethod("setTransform", e);
  }
  transform(...e) {
    return this._callContextMethod("transform", e);
  }
  translateTransform(...e) {
    return this._callContextMethod("translate", e);
  }
  /**
   * Clears all drawing commands from the graphics context, effectively resetting it. This includes clearing the path,
   * and optionally resetting transformations to the identity matrix.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  clear() {
    return this._callContextMethod("clear", []);
  }
  /**
   * The fill style to use.
   * @type {ConvertedFillStyle}
   */
  get fillStyle() {
    return this._context.fillStyle;
  }
  set fillStyle(e) {
    this._context.fillStyle = e;
  }
  /**
   * The stroke style to use.
   * @type {ConvertedStrokeStyle}
   */
  get strokeStyle() {
    return this._context.strokeStyle;
  }
  set strokeStyle(e) {
    this._context.strokeStyle = e;
  }
  /**
   * Creates a new Graphics object.
   * Note that only the context of the object is cloned, not its transform (position,scale,etc)
   * @param deep - Whether to create a deep clone of the graphics object. If false, the context
   * will be shared between the two objects (default false). If true, the context will be
   * cloned (recommended if you need to modify the context in any way).
   * @returns - A clone of the graphics object
   */
  clone(e = !1) {
    return e ? new Ve(this._context.clone()) : (this._ownedContext = null, new Ve(this._context));
  }
  // -------- v7 deprecations ---------
  /**
   * @param width
   * @param color
   * @param alpha
   * @deprecated since 8.0.0 Use {@link Graphics#setStrokeStyle} instead
   */
  lineStyle(e, t, r) {
    X(Y, "Graphics#lineStyle is no longer needed. Use Graphics#setStrokeStyle to set the stroke style.");
    const i = {};
    return e && (i.width = e), t && (i.color = t), r && (i.alpha = r), this.context.strokeStyle = i, this;
  }
  /**
   * @param color
   * @param alpha
   * @deprecated since 8.0.0 Use {@link Graphics#fill} instead
   */
  beginFill(e, t) {
    X(Y, "Graphics#beginFill is no longer needed. Use Graphics#fill to fill the shape with the desired style.");
    const r = {};
    return e !== void 0 && (r.color = e), t !== void 0 && (r.alpha = t), this.context.fillStyle = r, this;
  }
  /**
   * @deprecated since 8.0.0 Use {@link Graphics#fill} instead
   */
  endFill() {
    X(Y, "Graphics#endFill is no longer needed. Use Graphics#fill to fill the shape with the desired style."), this.context.fill();
    const e = this.context.strokeStyle;
    return (e.width !== Be.defaultStrokeStyle.width || e.color !== Be.defaultStrokeStyle.color || e.alpha !== Be.defaultStrokeStyle.alpha) && this.context.stroke(), this;
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#circle} instead
   */
  drawCircle(...e) {
    return X(Y, "Graphics#drawCircle has been renamed to Graphics#circle"), this._callContextMethod("circle", e);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#ellipse} instead
   */
  drawEllipse(...e) {
    return X(Y, "Graphics#drawEllipse has been renamed to Graphics#ellipse"), this._callContextMethod("ellipse", e);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#poly} instead
   */
  drawPolygon(...e) {
    return X(Y, "Graphics#drawPolygon has been renamed to Graphics#poly"), this._callContextMethod("poly", e);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#rect} instead
   */
  drawRect(...e) {
    return X(Y, "Graphics#drawRect has been renamed to Graphics#rect"), this._callContextMethod("rect", e);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#roundRect} instead
   */
  drawRoundedRect(...e) {
    return X(Y, "Graphics#drawRoundedRect has been renamed to Graphics#roundRect"), this._callContextMethod("roundRect", e);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#star} instead
   */
  drawStar(...e) {
    return X(Y, "Graphics#drawStar has been renamed to Graphics#star"), this._callContextMethod("star", e);
  }
}
const Th = class Sh extends Gt {
  constructor(...e) {
    let t = e[0] ?? {};
    t instanceof Float32Array && (X(Y, "use new MeshGeometry({ positions, uvs, indices }) instead"), t = {
      positions: t,
      uvs: e[1],
      indices: e[2]
    }), t = { ...Sh.defaultOptions, ...t };
    const r = t.positions || new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    let i = t.uvs;
    i || (t.positions ? i = new Float32Array(r.length) : i = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]));
    const n = t.indices || new Uint32Array([0, 1, 2, 0, 2, 3]), a = t.shrinkBuffersToFit, o = new Ee({
      data: r,
      label: "attribute-mesh-positions",
      shrinkToFit: a,
      usage: q.VERTEX | q.COPY_DST
    }), h = new Ee({
      data: i,
      label: "attribute-mesh-uvs",
      shrinkToFit: a,
      usage: q.VERTEX | q.COPY_DST
    }), l = new Ee({
      data: n,
      label: "index-mesh-buffer",
      shrinkToFit: a,
      usage: q.INDEX | q.COPY_DST
    });
    super({
      attributes: {
        aPosition: {
          buffer: o,
          format: "float32x2",
          stride: 8,
          offset: 0
        },
        aUV: {
          buffer: h,
          format: "float32x2",
          stride: 8,
          offset: 0
        }
      },
      indexBuffer: l,
      topology: t.topology
    }), this.batchMode = "auto";
  }
  /** The positions of the mesh. */
  get positions() {
    return this.attributes.aPosition.buffer.data;
  }
  /**
   * Set the positions of the mesh.
   * When setting the positions, its important that the uvs array is at least as long as the positions array.
   * otherwise the geometry will not be valid.
   * @param {Float32Array} value - The positions of the mesh.
   */
  set positions(e) {
    this.attributes.aPosition.buffer.data = e;
  }
  /** The UVs of the mesh. */
  get uvs() {
    return this.attributes.aUV.buffer.data;
  }
  /**
   * Set the UVs of the mesh.
   * Its important that the uvs array you set is at least as long as the positions array.
   * otherwise the geometry will not be valid.
   * @param {Float32Array} value - The UVs of the mesh.
   */
  set uvs(e) {
    this.attributes.aUV.buffer.data = e;
  }
  /** The indices of the mesh. */
  get indices() {
    return this.indexBuffer.data;
  }
  set indices(e) {
    this.indexBuffer.data = e;
  }
};
Th.defaultOptions = {
  topology: "triangle-list",
  shrinkBuffersToFit: !1
};
let hr = Th;
class wa extends Wr {
  constructor(...e) {
    let t = e[0];
    t instanceof Gt && (X(Y, "Mesh: use new Mesh({ geometry, shader }) instead"), t = {
      geometry: t,
      shader: e[1]
    }, e[3] && (X(Y, "Mesh: drawMode argument has been removed, use geometry.topology instead"), t.geometry.topology = e[3]));
    const { geometry: r, shader: i, texture: n, roundPixels: a, state: o, ...h } = t;
    super({
      label: "Mesh",
      ...h
    }), this.renderPipeId = "mesh", this._shader = null, this.allowChildren = !1, this.shader = i ?? null, this.texture = n ?? (i == null ? void 0 : i.texture) ?? D.WHITE, this.state = o ?? ke.for2d(), this._geometry = r, this._geometry.on("update", this.onViewUpdate, this), this.roundPixels = a ?? !1;
  }
  /** Alias for {@link scene.Mesh#shader}. */
  get material() {
    return X(Y, "mesh.material property has been removed, use mesh.shader instead"), this._shader;
  }
  /**
   * Represents the vertex and fragment shaders that processes the geometry and runs on the GPU.
   * Can be shared between multiple Mesh objects.
   */
  set shader(e) {
    this._shader !== e && (this._shader = e, this.onViewUpdate());
  }
  get shader() {
    return this._shader;
  }
  /**
   * Includes vertex positions, face indices, colors, UVs, and
   * custom attributes within buffers, reducing the cost of passing all
   * this data to the GPU. Can be shared between multiple Mesh objects.
   */
  set geometry(e) {
    var t;
    this._geometry !== e && ((t = this._geometry) == null || t.off("update", this.onViewUpdate, this), e.on("update", this.onViewUpdate, this), this._geometry = e, this.onViewUpdate());
  }
  get geometry() {
    return this._geometry;
  }
  /** The texture that the Mesh uses. Null for non-MeshMaterial shaders */
  set texture(e) {
    e || (e = D.EMPTY);
    const t = this._texture;
    t !== e && (t && t.dynamic && t.off("update", this.onViewUpdate, this), e.dynamic && e.on("update", this.onViewUpdate, this), this.shader && (this.shader.texture = e), this._texture = e, this.onViewUpdate());
  }
  get texture() {
    return this._texture;
  }
  get batched() {
    return this._shader || (this.state.data & 12) !== 0 ? !1 : this._geometry instanceof hr ? this._geometry.batchMode === "auto" ? this._geometry.positions.length / 2 <= 100 : this._geometry.batchMode === "batch" : !1;
  }
  /**
   * The local bounds of the mesh.
   * @type {rendering.Bounds}
   */
  get bounds() {
    return this._geometry.bounds;
  }
  /**
   * Update local bounds of the mesh.
   * @private
   */
  updateBounds() {
    this._bounds = this._geometry.bounds;
  }
  /**
   * Checks if the object contains the given point.
   * @param point - The point to check
   */
  containsPoint(e) {
    const { x: t, y: r } = e;
    if (!this.bounds.containsPoint(t, r))
      return !1;
    const i = this.geometry.getBuffer("aPosition").data, n = this.geometry.topology === "triangle-strip" ? 3 : 1;
    if (this.geometry.getIndex()) {
      const a = this.geometry.getIndex().data, o = a.length;
      for (let h = 0; h + 2 < o; h += n) {
        const l = a[h] * 2, c = a[h + 1] * 2, u = a[h + 2] * 2;
        if (Sa(
          t,
          r,
          i[l],
          i[l + 1],
          i[c],
          i[c + 1],
          i[u],
          i[u + 1]
        ))
          return !0;
      }
    } else {
      const a = i.length / 2;
      for (let o = 0; o + 2 < a; o += n) {
        const h = o * 2, l = (o + 1) * 2, c = (o + 2) * 2;
        if (Sa(
          t,
          r,
          i[h],
          i[h + 1],
          i[l],
          i[l + 1],
          i[c],
          i[c + 1]
        ))
          return !0;
      }
    }
    return !1;
  }
  /**
   * Destroys this sprite renderable and optionally its texture.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @param {boolean} [options.texture=false] - Should it destroy the current texture of the renderable as well
   * @param {boolean} [options.textureSource=false] - Should it destroy the textureSource of the renderable as well
   */
  destroy(e) {
    var r;
    if (super.destroy(e), typeof e == "boolean" ? e : e == null ? void 0 : e.texture) {
      const i = typeof e == "boolean" ? e : e == null ? void 0 : e.textureSource;
      this._texture.destroy(i);
    }
    (r = this._geometry) == null || r.off("update", this.onViewUpdate, this), this._texture = null, this._geometry = null, this._shader = null;
  }
}
class Wp extends Wr {
  constructor(e, t) {
    const { text: r, resolution: i, style: n, anchor: a, width: o, height: h, roundPixels: l, ...c } = e;
    super({
      ...c
    }), this.batched = !0, this._resolution = null, this._autoResolution = !0, this._didTextUpdate = !0, this._styleClass = t, this.text = r ?? "", this.style = n, this.resolution = i ?? null, this.allowChildren = !1, this._anchor = new Te(
      {
        _onUpdate: () => {
          this.onViewUpdate();
        }
      }
    ), a && (this.anchor = a), this.roundPixels = l ?? !1, o !== void 0 && (this.width = o), h !== void 0 && (this.height = h);
  }
  /**
   * The anchor sets the origin point of the text.
   * The default is `(0,0)`, this means the text's origin is the top left.
   *
   * Setting the anchor to `(0.5,0.5)` means the text's origin is centered.
   *
   * Setting the anchor to `(1,1)` would mean the text's origin point will be the bottom right corner.
   *
   * If you pass only single parameter, it will set both x and y to the same value as shown in the example below.
   * @example
   * import { Text } from 'pixi.js';
   *
   * const text = new Text('hello world');
   * text.anchor.set(0.5); // This will set the origin to center. (0.5) is same as (0.5, 0.5).
   */
  get anchor() {
    return this._anchor;
  }
  set anchor(e) {
    typeof e == "number" ? this._anchor.set(e) : this._anchor.copyFrom(e);
  }
  /** Set the copy for the text object. To split a line you can use '\n'. */
  set text(e) {
    e = e.toString(), this._text !== e && (this._text = e, this.onViewUpdate());
  }
  get text() {
    return this._text;
  }
  /**
   * The resolution / device pixel ratio of the canvas.
   * @default 1
   */
  set resolution(e) {
    this._autoResolution = e === null, this._resolution = e, this.onViewUpdate();
  }
  get resolution() {
    return this._resolution;
  }
  get style() {
    return this._style;
  }
  /**
   * Set the style of the text.
   *
   * Set up an event listener to listen for changes on the style object and mark the text as dirty.
   *
   * If setting the `style` can also be partial {@link AnyTextStyleOptions}.
   * @type {
   * text.TextStyle |
   * Partial<text.TextStyle> |
   * text.TextStyleOptions |
   * text.HTMLTextStyle |
   * Partial<text.HTMLTextStyle> |
   * text.HTMLTextStyleOptions
   * }
   */
  set style(e) {
    var t;
    e || (e = {}), (t = this._style) == null || t.off("update", this.onViewUpdate, this), e instanceof this._styleClass ? this._style = e : this._style = new this._styleClass(e), this._style.on("update", this.onViewUpdate, this), this.onViewUpdate();
  }
  /** The width of the sprite, setting this will actually modify the scale to achieve the value set. */
  get width() {
    return Math.abs(this.scale.x) * this.bounds.width;
  }
  set width(e) {
    this._setWidth(e, this.bounds.width);
  }
  /** The height of the sprite, setting this will actually modify the scale to achieve the value set. */
  get height() {
    return Math.abs(this.scale.y) * this.bounds.height;
  }
  set height(e) {
    this._setHeight(e, this.bounds.height);
  }
  /**
   * Retrieves the size of the Text as a [Size]{@link Size} object.
   * This is faster than get the width and height separately.
   * @param out - Optional object to store the size in.
   * @returns - The size of the Text.
   */
  getSize(e) {
    return e || (e = {}), e.width = Math.abs(this.scale.x) * this.bounds.width, e.height = Math.abs(this.scale.y) * this.bounds.height, e;
  }
  /**
   * Sets the size of the Text to the specified width and height.
   * This is faster than setting the width and height separately.
   * @param value - This can be either a number or a [Size]{@link Size} object.
   * @param height - The height to set. Defaults to the value of `width` if not provided.
   */
  setSize(e, t) {
    typeof e == "object" ? (t = e.height ?? e.width, e = e.width) : t ?? (t = e), e !== void 0 && this._setWidth(e, this.bounds.width), t !== void 0 && this._setHeight(t, this.bounds.height);
  }
  /**
   * Checks if the text contains the given point.
   * @param point - The point to check
   */
  containsPoint(e) {
    const t = this.bounds.width, r = this.bounds.height, i = -t * this.anchor.x;
    let n = 0;
    return e.x >= i && e.x <= i + t && (n = -r * this.anchor.y, e.y >= n && e.y <= n + r);
  }
  onViewUpdate() {
    this.didViewUpdate || (this._didTextUpdate = !0), super.onViewUpdate();
  }
  _getKey() {
    return `${this.text}:${this._style.styleKey}:${this._resolution}`;
  }
  /**
   * Destroys this text renderable and optionally its style texture.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @param {boolean} [options.texture=false] - Should it destroy the texture of the text style
   * @param {boolean} [options.textureSource=false] - Should it destroy the textureSource of the text style
   * @param {boolean} [options.style=false] - Should it destroy the style of the text
   */
  destroy(e = !1) {
    super.destroy(e), this.owner = null, this._bounds = null, this._anchor = null, (typeof e == "boolean" ? e : e != null && e.style) && this._style.destroy(e), this._style = null, this._text = null;
  }
}
function zp(s, e) {
  let t = s[0] ?? {};
  return (typeof t == "string" || s[1]) && (X(Y, `use new ${e}({ text: "hi!", style }) instead`), t = {
    text: t,
    style: s[1]
  }), t;
}
class Vp extends Wp {
  constructor(...e) {
    const t = zp(e, "Text");
    super(t, tt), this.renderPipeId = "text";
  }
  /** @private */
  updateBounds() {
    const e = this._bounds, t = this._anchor, r = qe.measureText(
      this._text,
      this._style
    ), { width: i, height: n } = r;
    e.minX = -t._x * i, e.maxX = e.minX + i, e.minY = -t._y * n, e.maxY = e.minY + n;
  }
}
function $p(s) {
  const e = s._stroke, t = s._fill, i = [`div { ${[
    `color: ${re.shared.setValue(t.color).toHex()}`,
    `font-size: ${s.fontSize}px`,
    `font-family: ${s.fontFamily}`,
    `font-weight: ${s.fontWeight}`,
    `font-style: ${s.fontStyle}`,
    `font-variant: ${s.fontVariant}`,
    `letter-spacing: ${s.letterSpacing}px`,
    `text-align: ${s.align}`,
    `padding: ${s.padding}px`,
    `white-space: ${s.whiteSpace === "pre" && s.wordWrap ? "pre-wrap" : s.whiteSpace}`,
    ...s.lineHeight ? [`line-height: ${s.lineHeight}px`] : [],
    ...s.wordWrap ? [
      `word-wrap: ${s.breakWords ? "break-all" : "break-word"}`,
      `max-width: ${s.wordWrapWidth}px`
    ] : [],
    ...e ? [Ah(e)] : [],
    ...s.dropShadow ? [wh(s.dropShadow)] : [],
    ...s.cssOverrides
  ].join(";")} }`];
  return Xp(s.tagStyles, i), i.join(" ");
}
function wh(s) {
  const e = re.shared.setValue(s.color).setAlpha(s.alpha).toHexa(), t = Math.round(Math.cos(s.angle) * s.distance), r = Math.round(Math.sin(s.angle) * s.distance), i = `${t}px ${r}px`;
  return s.blur > 0 ? `text-shadow: ${i} ${s.blur}px ${e}` : `text-shadow: ${i} ${e}`;
}
function Ah(s) {
  return [
    `-webkit-text-stroke-width: ${s.width}px`,
    `-webkit-text-stroke-color: ${re.shared.setValue(s.color).toHex()}`,
    `text-stroke-width: ${s.width}px`,
    `text-stroke-color: ${re.shared.setValue(s.color).toHex()}`,
    "paint-order: stroke"
  ].join(";");
}
const Aa = {
  fontSize: "font-size: {{VALUE}}px",
  fontFamily: "font-family: {{VALUE}}",
  fontWeight: "font-weight: {{VALUE}}",
  fontStyle: "font-style: {{VALUE}}",
  fontVariant: "font-variant: {{VALUE}}",
  letterSpacing: "letter-spacing: {{VALUE}}px",
  align: "text-align: {{VALUE}}",
  padding: "padding: {{VALUE}}px",
  whiteSpace: "white-space: {{VALUE}}",
  lineHeight: "line-height: {{VALUE}}px",
  wordWrapWidth: "max-width: {{VALUE}}px"
}, Pa = {
  fill: (s) => `color: ${re.shared.setValue(s).toHex()}`,
  breakWords: (s) => `word-wrap: ${s ? "break-all" : "break-word"}`,
  stroke: Ah,
  dropShadow: wh
};
function Xp(s, e) {
  for (const t in s) {
    const r = s[t], i = [];
    for (const n in r)
      Pa[n] ? i.push(Pa[n](r[n])) : Aa[n] && i.push(Aa[n].replace("{{VALUE}}", r[n]));
    e.push(`${t} { ${i.join(";")} }`);
  }
}
class Li extends tt {
  constructor(e = {}) {
    super(e), this._cssOverrides = [], this.cssOverrides ?? (this.cssOverrides = e.cssOverrides), this.tagStyles = e.tagStyles ?? {};
  }
  /** List of style overrides that will be applied to the HTML text. */
  set cssOverrides(e) {
    this._cssOverrides = e instanceof Array ? e : [e], this.update();
  }
  get cssOverrides() {
    return this._cssOverrides;
  }
  _generateKey() {
    return this._styleKey = oh(this) + this._cssOverrides.join("-"), this._styleKey;
  }
  update() {
    this._cssStyle = null, super.update();
  }
  /**
   * Creates a new HTMLTextStyle object with the same values as this one.
   * @returns New cloned HTMLTextStyle object
   */
  clone() {
    return new Li({
      align: this.align,
      breakWords: this.breakWords,
      dropShadow: this.dropShadow ? { ...this.dropShadow } : null,
      fill: this._fill,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      fontStyle: this.fontStyle,
      fontVariant: this.fontVariant,
      fontWeight: this.fontWeight,
      letterSpacing: this.letterSpacing,
      lineHeight: this.lineHeight,
      padding: this.padding,
      stroke: this._stroke,
      whiteSpace: this.whiteSpace,
      wordWrap: this.wordWrap,
      wordWrapWidth: this.wordWrapWidth,
      cssOverrides: this.cssOverrides
    });
  }
  get cssStyle() {
    return this._cssStyle || (this._cssStyle = $p(this)), this._cssStyle;
  }
  /**
   * Add a style override, this can be any CSS property
   * it will override any built-in style. This is the
   * property and the value as a string (e.g., `color: red`).
   * This will override any other internal style.
   * @param {string} value - CSS style(s) to add.
   * @example
   * style.addOverride('background-color: red');
   */
  addOverride(...e) {
    const t = e.filter((r) => !this.cssOverrides.includes(r));
    t.length > 0 && (this.cssOverrides.push(...t), this.update());
  }
  /**
   * Remove any overrides that match the value.
   * @param {string} value - CSS style to remove.
   * @example
   * style.removeOverride('background-color: red');
   */
  removeOverride(...e) {
    const t = e.filter((r) => this.cssOverrides.includes(r));
    t.length > 0 && (this.cssOverrides = this.cssOverrides.filter((r) => !t.includes(r)), this.update());
  }
  set fill(e) {
    typeof e != "string" && typeof e != "number" && V("[HTMLTextStyle] only color fill is not supported by HTMLText"), super.fill = e;
  }
  set stroke(e) {
    e && typeof e != "string" && typeof e != "number" && V("[HTMLTextStyle] only color stroke is not supported by HTMLText"), super.stroke = e;
  }
}
const Ca = "http://www.w3.org/2000/svg", Ea = "http://www.w3.org/1999/xhtml";
class Ph {
  constructor() {
    this.svgRoot = document.createElementNS(Ca, "svg"), this.foreignObject = document.createElementNS(Ca, "foreignObject"), this.domElement = document.createElementNS(Ea, "div"), this.styleElement = document.createElementNS(Ea, "style"), this.image = new Image();
    const { foreignObject: e, svgRoot: t, styleElement: r, domElement: i } = this;
    e.setAttribute("width", "10000"), e.setAttribute("height", "10000"), e.style.overflow = "hidden", t.appendChild(e), e.appendChild(r), e.appendChild(i);
  }
}
let Ma;
function jp(s, e, t, r) {
  r || (r = Ma || (Ma = new Ph()));
  const { domElement: i, styleElement: n, svgRoot: a } = r;
  i.innerHTML = `<style>${e.cssStyle};</style><div style='padding:0'>${s}</div>`, i.setAttribute("style", "transform-origin: top left; display: inline-block"), t && (n.textContent = t), document.body.appendChild(a);
  const o = i.getBoundingClientRect();
  a.remove();
  const h = e.padding * 2;
  return {
    width: o.width - h,
    height: o.height - h
  };
}
class Ch {
  constructor() {
    this._tempState = ke.for2d(), this._didUploadHash = {};
  }
  init(e) {
    e.renderer.runners.contextChange.add(this);
  }
  contextChange() {
    this._didUploadHash = {};
  }
  start(e, t, r) {
    const i = e.renderer, n = this._didUploadHash[r.uid];
    i.shader.bind(r, n), n || (this._didUploadHash[r.uid] = !0), i.shader.updateUniformGroup(i.globalUniforms.uniformGroup), i.geometry.bind(t, r.glProgram);
  }
  execute(e, t) {
    const r = e.renderer;
    this._tempState.blendMode = t.blendMode, r.state.set(this._tempState);
    const i = t.textures.textures;
    for (let n = 0; n < t.textures.count; n++)
      r.texture.bind(i[n], n);
    r.geometry.draw(t.topology, t.size, t.start);
  }
}
Ch.extension = {
  type: [
    v.WebGLPipesAdaptor
  ],
  name: "batch"
};
const Sr = ke.for2d();
class Eh {
  start(e, t, r) {
    const i = e.renderer, n = i.encoder, a = r.gpuProgram;
    this._shader = r, this._geometry = t, n.setGeometry(t, a), Sr.blendMode = "normal", i.pipeline.getPipeline(
      t,
      a,
      Sr
    );
    const o = i.globalUniforms.bindGroup;
    n.resetBindGroup(1), n.setBindGroup(0, o, a);
  }
  execute(e, t) {
    const r = this._shader.gpuProgram, i = e.renderer, n = i.encoder;
    if (!t.bindGroup) {
      const h = t.textures;
      t.bindGroup = Si(h.textures, h.count);
    }
    Sr.blendMode = t.blendMode;
    const a = i.bindGroup.getBindGroup(
      t.bindGroup,
      r,
      1
    ), o = i.pipeline.getPipeline(
      this._geometry,
      r,
      Sr,
      t.topology
    );
    t.bindGroup._touch(i.textureGC.count), n.setPipeline(o), n.renderPassEncoder.setBindGroup(1, a), n.renderPassEncoder.drawIndexed(t.size, 1, t.start);
  }
}
Eh.extension = {
  type: [
    v.WebGPUPipesAdaptor
  ],
  name: "batch"
};
const Ni = class Mh {
  constructor(e, t) {
    var r, i;
    this.state = ke.for2d(), this._batchersByInstructionSet = /* @__PURE__ */ Object.create(null), this._activeBatches = /* @__PURE__ */ Object.create(null), this.renderer = e, this._adaptor = t, (i = (r = this._adaptor).init) == null || i.call(r, this);
  }
  static getBatcher(e) {
    return new this._availableBatchers[e]();
  }
  buildStart(e) {
    let t = this._batchersByInstructionSet[e.uid];
    t || (t = this._batchersByInstructionSet[e.uid] = /* @__PURE__ */ Object.create(null), t.default || (t.default = new Mi())), this._activeBatches = t, this._activeBatch = this._activeBatches.default;
    for (const r in this._activeBatches)
      this._activeBatches[r].begin();
  }
  addToBatch(e, t) {
    if (this._activeBatch.name !== e.batcherName) {
      this._activeBatch.break(t);
      let r = this._activeBatches[e.batcherName];
      r || (r = this._activeBatches[e.batcherName] = Mh.getBatcher(e.batcherName), r.begin()), this._activeBatch = r;
    }
    this._activeBatch.add(e);
  }
  break(e) {
    this._activeBatch.break(e);
  }
  buildEnd(e) {
    this._activeBatch.break(e);
    const t = this._activeBatches;
    for (const r in t) {
      const i = t[r], n = i.geometry;
      n.indexBuffer.setDataWithSize(i.indexBuffer, i.indexSize, !0), n.buffers[0].setDataWithSize(i.attributeBuffer.float32View, i.attributeSize, !1);
    }
  }
  upload(e) {
    const t = this._batchersByInstructionSet[e.uid];
    for (const r in t) {
      const i = t[r], n = i.geometry;
      i.dirty && (i.dirty = !1, n.buffers[0].update(i.attributeSize * 4));
    }
  }
  execute(e) {
    if (e.action === "startBatch") {
      const t = e.batcher, r = t.geometry, i = t.shader;
      this._adaptor.start(this, r, i);
    }
    this._adaptor.execute(this, e);
  }
  destroy() {
    this.state = null, this.renderer = null, this._adaptor = null;
    for (const e in this._activeBatches)
      this._activeBatches[e].destroy();
    this._activeBatches = null;
  }
};
Ni.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "batch"
};
Ni._availableBatchers = /* @__PURE__ */ Object.create(null);
let Bh = Ni;
z.handleByMap(v.Batcher, Bh._availableBatchers);
z.add(Mi);
const Zt = {
  name: "local-uniform-bit",
  vertex: {
    header: (
      /* wgsl */
      `

            struct LocalUniforms {
                uTransformMatrix:mat3x3<f32>,
                uColor:vec4<f32>,
                uRound:f32,
            }

            @group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;
        `
    ),
    main: (
      /* wgsl */
      `
            vColor *= localUniforms.uColor;
            modelMatrix *= localUniforms.uTransformMatrix;
        `
    ),
    end: (
      /* wgsl */
      `
            if(localUniforms.uRound == 1)
            {
                vPosition = vec4(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
            }
        `
    )
  }
}, Yp = {
  ...Zt,
  vertex: {
    ...Zt.vertex,
    // replace the group!
    header: Zt.vertex.header.replace("group(1)", "group(2)")
  }
}, Hi = {
  name: "local-uniform-bit",
  vertex: {
    header: (
      /* glsl */
      `

            uniform mat3 uTransformMatrix;
            uniform vec4 uColor;
            uniform float uRound;
        `
    ),
    main: (
      /* glsl */
      `
            vColor *= uColor;
            modelMatrix = uTransformMatrix;
        `
    ),
    end: (
      /* glsl */
      `
            if(uRound == 1.)
            {
                gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
            }
        `
    )
  }
}, Kp = {
  name: "texture-bit",
  vertex: {
    header: (
      /* wgsl */
      `

        struct TextureUniforms {
            uTextureMatrix:mat3x3<f32>,
        }

        @group(2) @binding(2) var<uniform> textureUniforms : TextureUniforms;
        `
    ),
    main: (
      /* wgsl */
      `
            uv = (textureUniforms.uTextureMatrix * vec3(uv, 1.0)).xy;
        `
    )
  },
  fragment: {
    header: (
      /* wgsl */
      `
            @group(2) @binding(0) var uTexture: texture_2d<f32>;
            @group(2) @binding(1) var uSampler: sampler;

         
        `
    ),
    main: (
      /* wgsl */
      `
            outColor = textureSample(uTexture, uSampler, vUV);
        `
    )
  }
}, qp = {
  name: "texture-bit",
  vertex: {
    header: (
      /* glsl */
      `
            uniform mat3 uTextureMatrix;
        `
    ),
    main: (
      /* glsl */
      `
            uv = (uTextureMatrix * vec3(uv, 1.0)).xy;
        `
    )
  },
  fragment: {
    header: (
      /* glsl */
      `
        uniform sampler2D uTexture;

         
        `
    ),
    main: (
      /* glsl */
      `
            outColor = texture(uTexture, vUV);
        `
    )
  }
}, Zp = new ye();
class Qp extends Ir {
  constructor() {
    super(), this.filters = [new Hp({
      sprite: new $e(D.EMPTY),
      inverse: !1,
      resolution: "inherit",
      antialias: "inherit"
    })];
  }
  get sprite() {
    return this.filters[0].sprite;
  }
  set sprite(e) {
    this.filters[0].sprite = e;
  }
  get inverse() {
    return this.filters[0].inverse;
  }
  set inverse(e) {
    this.filters[0].inverse = e;
  }
}
class Rh {
  constructor(e) {
    this._activeMaskStage = [], this._renderer = e;
  }
  push(e, t, r) {
    const i = this._renderer;
    if (i.renderPipes.batch.break(r), r.add({
      renderPipeId: "alphaMask",
      action: "pushMaskBegin",
      mask: e,
      inverse: t._maskOptions.inverse,
      canBundle: !1,
      maskedContainer: t
    }), e.inverse = t._maskOptions.inverse, e.renderMaskToTexture) {
      const n = e.mask;
      n.includeInBuild = !0, n.collectRenderables(
        r,
        i,
        null
      ), n.includeInBuild = !1;
    }
    i.renderPipes.batch.break(r), r.add({
      renderPipeId: "alphaMask",
      action: "pushMaskEnd",
      mask: e,
      maskedContainer: t,
      inverse: t._maskOptions.inverse,
      canBundle: !1
    });
  }
  pop(e, t, r) {
    this._renderer.renderPipes.batch.break(r), r.add({
      renderPipeId: "alphaMask",
      action: "popMaskEnd",
      mask: e,
      inverse: t._maskOptions.inverse,
      canBundle: !1
    });
  }
  execute(e) {
    const t = this._renderer, r = e.mask.renderMaskToTexture;
    if (e.action === "pushMaskBegin") {
      const i = K.get(Qp);
      if (i.inverse = e.inverse, r) {
        e.mask.mask.measurable = !0;
        const n = pi(e.mask.mask, !0, Zp);
        e.mask.mask.measurable = !1, n.ceil();
        const a = t.renderTarget.renderTarget.colorTexture.source, o = xe.getOptimalTexture(
          n.width,
          n.height,
          a._resolution,
          a.antialias
        );
        t.renderTarget.push(o, !0), t.globalUniforms.push({
          offset: n,
          worldColor: 4294967295
        });
        const h = i.sprite;
        h.texture = o, h.worldTransform.tx = n.minX, h.worldTransform.ty = n.minY, this._activeMaskStage.push({
          filterEffect: i,
          maskedContainer: e.maskedContainer,
          filterTexture: o
        });
      } else
        i.sprite = e.mask.mask, this._activeMaskStage.push({
          filterEffect: i,
          maskedContainer: e.maskedContainer
        });
    } else if (e.action === "pushMaskEnd") {
      const i = this._activeMaskStage[this._activeMaskStage.length - 1];
      r && (t.type === Oe.WEBGL && t.renderTarget.finishRenderPass(), t.renderTarget.pop(), t.globalUniforms.pop()), t.filter.push({
        renderPipeId: "filter",
        action: "pushFilter",
        container: i.maskedContainer,
        filterEffect: i.filterEffect,
        canBundle: !1
      });
    } else if (e.action === "popMaskEnd") {
      t.filter.pop();
      const i = this._activeMaskStage.pop();
      r && xe.returnTexture(i.filterTexture), K.return(i.filterEffect);
    }
  }
  destroy() {
    this._renderer = null, this._activeMaskStage = null;
  }
}
Rh.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "alphaMask"
};
class kh {
  constructor(e) {
    this._colorStack = [], this._colorStackIndex = 0, this._currentColor = 0, this._renderer = e;
  }
  buildStart() {
    this._colorStack[0] = 15, this._colorStackIndex = 1, this._currentColor = 15;
  }
  push(e, t, r) {
    this._renderer.renderPipes.batch.break(r);
    const n = this._colorStack;
    n[this._colorStackIndex] = n[this._colorStackIndex - 1] & e.mask;
    const a = this._colorStack[this._colorStackIndex];
    a !== this._currentColor && (this._currentColor = a, r.add({
      renderPipeId: "colorMask",
      colorMask: a,
      canBundle: !1
    })), this._colorStackIndex++;
  }
  pop(e, t, r) {
    this._renderer.renderPipes.batch.break(r);
    const n = this._colorStack;
    this._colorStackIndex--;
    const a = n[this._colorStackIndex - 1];
    a !== this._currentColor && (this._currentColor = a, r.add({
      renderPipeId: "colorMask",
      colorMask: a,
      canBundle: !1
    }));
  }
  execute(e) {
    this._renderer.colorMask.setMask(e.colorMask);
  }
  destroy() {
    this._colorStack = null;
  }
}
kh.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "colorMask"
};
class Ih {
  constructor(e) {
    this._maskStackHash = {}, this._maskHash = /* @__PURE__ */ new WeakMap(), this._renderer = e;
  }
  push(e, t, r) {
    var i;
    const n = e, a = this._renderer;
    a.renderPipes.batch.break(r), a.renderPipes.blendMode.setBlendMode(n.mask, "none", r), r.add({
      renderPipeId: "stencilMask",
      action: "pushMaskBegin",
      mask: e,
      inverse: t._maskOptions.inverse,
      canBundle: !1
    });
    const o = n.mask;
    o.includeInBuild = !0, this._maskHash.has(n) || this._maskHash.set(n, {
      instructionsStart: 0,
      instructionsLength: 0
    });
    const h = this._maskHash.get(n);
    h.instructionsStart = r.instructionSize, o.collectRenderables(
      r,
      a,
      null
    ), o.includeInBuild = !1, a.renderPipes.batch.break(r), r.add({
      renderPipeId: "stencilMask",
      action: "pushMaskEnd",
      mask: e,
      inverse: t._maskOptions.inverse,
      canBundle: !1
    });
    const l = r.instructionSize - h.instructionsStart - 1;
    h.instructionsLength = l;
    const c = a.renderTarget.renderTarget.uid;
    (i = this._maskStackHash)[c] ?? (i[c] = 0);
  }
  pop(e, t, r) {
    const i = e, n = this._renderer;
    n.renderPipes.batch.break(r), n.renderPipes.blendMode.setBlendMode(i.mask, "none", r), r.add({
      renderPipeId: "stencilMask",
      action: "popMaskBegin",
      inverse: t._maskOptions.inverse,
      canBundle: !1
    });
    const a = this._maskHash.get(e);
    for (let o = 0; o < a.instructionsLength; o++)
      r.instructions[r.instructionSize++] = r.instructions[a.instructionsStart++];
    r.add({
      renderPipeId: "stencilMask",
      action: "popMaskEnd",
      canBundle: !1
    });
  }
  execute(e) {
    var t;
    const r = this._renderer, i = r.renderTarget.renderTarget.uid;
    let n = (t = this._maskStackHash)[i] ?? (t[i] = 0);
    e.action === "pushMaskBegin" ? (r.renderTarget.ensureDepthStencil(), r.stencil.setStencilMode(fe.RENDERING_MASK_ADD, n), n++, r.colorMask.setMask(0)) : e.action === "pushMaskEnd" ? (e.inverse ? r.stencil.setStencilMode(fe.INVERSE_MASK_ACTIVE, n) : r.stencil.setStencilMode(fe.MASK_ACTIVE, n), r.colorMask.setMask(15)) : e.action === "popMaskBegin" ? (r.colorMask.setMask(0), n !== 0 ? r.stencil.setStencilMode(fe.RENDERING_MASK_REMOVE, n) : (r.renderTarget.clear(null, Pe.STENCIL), r.stencil.setStencilMode(fe.DISABLED, n)), n--) : e.action === "popMaskEnd" && (e.inverse ? r.stencil.setStencilMode(fe.INVERSE_MASK_ACTIVE, n) : r.stencil.setStencilMode(fe.MASK_ACTIVE, n), r.colorMask.setMask(15)), this._maskStackHash[i] = n;
  }
  destroy() {
    this._renderer = null, this._maskStackHash = null, this._maskHash = null;
  }
}
Ih.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "stencilMask"
};
var Rr = /* @__PURE__ */ ((s) => (s[s.ELEMENT_ARRAY_BUFFER = 34963] = "ELEMENT_ARRAY_BUFFER", s[s.ARRAY_BUFFER = 34962] = "ARRAY_BUFFER", s[s.UNIFORM_BUFFER = 35345] = "UNIFORM_BUFFER", s))(Rr || {});
class Jp {
  constructor(e, t) {
    this._lastBindBaseLocation = -1, this._lastBindCallId = -1, this.buffer = e || null, this.updateID = -1, this.byteLength = -1, this.type = t;
  }
}
class Gh {
  /**
   * @param {Renderer} renderer - The renderer this System works for.
   */
  constructor(e) {
    this._gpuBuffers = /* @__PURE__ */ Object.create(null), this._boundBufferBases = /* @__PURE__ */ Object.create(null), this._minBaseLocation = 0, this._nextBindBaseIndex = this._minBaseLocation, this._bindCallId = 0, this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_gpuBuffers");
  }
  /**
   * @ignore
   */
  destroy() {
    this._renderer = null, this._gl = null, this._gpuBuffers = null, this._boundBufferBases = null;
  }
  /** Sets up the renderer context and necessary buffers. */
  contextChange() {
    const e = this._gl = this._renderer.gl;
    this._gpuBuffers = /* @__PURE__ */ Object.create(null), this._maxBindings = e.MAX_UNIFORM_BUFFER_BINDINGS ? e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS) : 0;
  }
  getGlBuffer(e) {
    return this._gpuBuffers[e.uid] || this.createGLBuffer(e);
  }
  /**
   * This binds specified buffer. On first run, it will create the webGL buffers for the context too
   * @param buffer - the buffer to bind to the renderer
   */
  bind(e) {
    const { _gl: t } = this, r = this.getGlBuffer(e);
    t.bindBuffer(r.type, r.buffer);
  }
  /**
   * Binds an uniform buffer to at the given index.
   *
   * A cache is used so a buffer will not be bound again if already bound.
   * @param glBuffer - the buffer to bind
   * @param index - the base index to bind it to.
   */
  bindBufferBase(e, t) {
    const { _gl: r } = this;
    this._boundBufferBases[t] !== e && (this._boundBufferBases[t] = e, e._lastBindBaseLocation = t, r.bindBufferBase(r.UNIFORM_BUFFER, t, e.buffer));
  }
  nextBindBase(e) {
    this._bindCallId++, this._minBaseLocation = 0, e && (this._boundBufferBases[0] = null, this._minBaseLocation = 1, this._nextBindBaseIndex < 1 && (this._nextBindBaseIndex = 1));
  }
  freeLocationForBufferBase(e) {
    let t = this.getLastBindBaseLocation(e);
    if (t >= this._minBaseLocation)
      return e._lastBindCallId = this._bindCallId, t;
    let r = 0, i = this._nextBindBaseIndex;
    for (; r < 2; ) {
      i >= this._maxBindings && (i = this._minBaseLocation, r++);
      const n = this._boundBufferBases[i];
      if (n && n._lastBindCallId === this._bindCallId) {
        i++;
        continue;
      }
      break;
    }
    return t = i, this._nextBindBaseIndex = i + 1, r >= 2 ? -1 : (e._lastBindCallId = this._bindCallId, this._boundBufferBases[t] = null, t);
  }
  getLastBindBaseLocation(e) {
    const t = e._lastBindBaseLocation;
    return this._boundBufferBases[t] === e ? t : -1;
  }
  /**
   * Binds a buffer whilst also binding its range.
   * This will make the buffer start from the offset supplied rather than 0 when it is read.
   * @param glBuffer - the buffer to bind
   * @param index - the base index to bind at, defaults to 0
   * @param offset - the offset to bind at (this is blocks of 256). 0 = 0, 1 = 256, 2 = 512 etc
   * @param size - the size to bind at (this is blocks of 256).
   */
  bindBufferRange(e, t, r, i) {
    const { _gl: n } = this;
    r || (r = 0), t || (t = 0), this._boundBufferBases[t] = null, n.bindBufferRange(n.UNIFORM_BUFFER, t || 0, e.buffer, r * 256, i || 256);
  }
  /**
   * Will ensure the data in the buffer is uploaded to the GPU.
   * @param {Buffer} buffer - the buffer to update
   */
  updateBuffer(e) {
    const { _gl: t } = this, r = this.getGlBuffer(e);
    if (e._updateID === r.updateID)
      return r;
    r.updateID = e._updateID, t.bindBuffer(r.type, r.buffer);
    const i = e.data, n = e.descriptor.usage & q.STATIC ? t.STATIC_DRAW : t.DYNAMIC_DRAW;
    return i ? r.byteLength >= i.byteLength ? t.bufferSubData(r.type, 0, i, 0, e._updateSize / i.BYTES_PER_ELEMENT) : (r.byteLength = i.byteLength, t.bufferData(r.type, i, n)) : (r.byteLength = e.descriptor.size, t.bufferData(r.type, r.byteLength, n)), r;
  }
  /** dispose all WebGL resources of all managed buffers */
  destroyAll() {
    const e = this._gl;
    for (const t in this._gpuBuffers)
      e.deleteBuffer(this._gpuBuffers[t].buffer);
    this._gpuBuffers = /* @__PURE__ */ Object.create(null);
  }
  /**
   * Disposes buffer
   * @param {Buffer} buffer - buffer with data
   * @param {boolean} [contextLost=false] - If context was lost, we suppress deleteVertexArray
   */
  onBufferDestroy(e, t) {
    const r = this._gpuBuffers[e.uid], i = this._gl;
    t || i.deleteBuffer(r.buffer), this._gpuBuffers[e.uid] = null;
  }
  /**
   * creates and attaches a GLBuffer object tied to the current context.
   * @param buffer
   * @protected
   */
  createGLBuffer(e) {
    const { _gl: t } = this;
    let r = Rr.ARRAY_BUFFER;
    e.descriptor.usage & q.INDEX ? r = Rr.ELEMENT_ARRAY_BUFFER : e.descriptor.usage & q.UNIFORM && (r = Rr.UNIFORM_BUFFER);
    const i = new Jp(t.createBuffer(), r);
    return this._gpuBuffers[e.uid] = i, e.on("destroy", this.onBufferDestroy, this), i;
  }
  resetState() {
    this._boundBufferBases = /* @__PURE__ */ Object.create(null);
  }
}
Gh.extension = {
  type: [
    v.WebGLSystem
  ],
  name: "buffer"
};
const Wi = class Uh {
  /** @param renderer - The renderer this System works for. */
  constructor(e) {
    this.supports = {
      /** Support for 32-bit indices buffer. */
      uint32Indices: !0,
      /** Support for UniformBufferObjects */
      uniformBufferObject: !0,
      /** Support for VertexArrayObjects */
      vertexArrayObject: !0,
      /** Support for SRGB texture format */
      srgbTextures: !0,
      /** Support for wrapping modes if a texture is non-power of two */
      nonPowOf2wrapping: !0,
      /** Support for MSAA (antialiasing of dynamic textures) */
      msaa: !0,
      /** Support for mipmaps if a texture is non-power of two */
      nonPowOf2mipmaps: !0
    }, this._renderer = e, this.extensions = /* @__PURE__ */ Object.create(null), this.handleContextLost = this.handleContextLost.bind(this), this.handleContextRestored = this.handleContextRestored.bind(this);
  }
  /**
   * `true` if the context is lost
   * @readonly
   */
  get isLost() {
    return !this.gl || this.gl.isContextLost();
  }
  /**
   * Handles the context change event.
   * @param {WebGLRenderingContext} gl - New WebGL context.
   */
  contextChange(e) {
    this.gl = e, this._renderer.gl = e;
  }
  init(e) {
    e = { ...Uh.defaultOptions, ...e };
    let t = this.multiView = e.multiView;
    if (e.context && t && (V("Renderer created with both a context and multiview enabled. Disabling multiView as both cannot work together."), t = !1), t ? this.canvas = Z.get().createCanvas(this._renderer.canvas.width, this._renderer.canvas.height) : this.canvas = this._renderer.view.canvas, e.context)
      this.initFromContext(e.context);
    else {
      const r = this._renderer.background.alpha < 1, i = e.premultipliedAlpha ?? !0, n = e.antialias && !this._renderer.backBuffer.useBackBuffer;
      this.createContext(e.preferWebGLVersion, {
        alpha: r,
        premultipliedAlpha: i,
        antialias: n,
        stencil: !0,
        preserveDrawingBuffer: e.preserveDrawingBuffer,
        powerPreference: e.powerPreference ?? "default"
      });
    }
  }
  ensureCanvasSize(e) {
    if (!this.multiView) {
      e !== this.canvas && V("multiView is disabled, but targetCanvas is not the main canvas");
      return;
    }
    const { canvas: t } = this;
    (t.width < e.width || t.height < e.height) && (t.width = Math.max(e.width, e.width), t.height = Math.max(e.height, e.height));
  }
  /**
   * Initializes the context.
   * @protected
   * @param {WebGLRenderingContext} gl - WebGL context
   */
  initFromContext(e) {
    this.gl = e, this.webGLVersion = e instanceof Z.get().getWebGLRenderingContext() ? 1 : 2, this.getExtensions(), this.validateContext(e), this._renderer.runners.contextChange.emit(e);
    const t = this._renderer.view.canvas;
    t.addEventListener("webglcontextlost", this.handleContextLost, !1), t.addEventListener("webglcontextrestored", this.handleContextRestored, !1);
  }
  /**
   * Initialize from context options
   * @protected
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
   * @param preferWebGLVersion
   * @param {object} options - context attributes
   */
  createContext(e, t) {
    let r;
    const i = this.canvas;
    if (e === 2 && (r = i.getContext("webgl2", t)), !r && (r = i.getContext("webgl", t), !r))
      throw new Error("This browser does not support WebGL. Try using the canvas renderer");
    this.gl = r, this.initFromContext(this.gl);
  }
  /** Auto-populate the {@link GlContextSystem.extensions extensions}. */
  getExtensions() {
    const { gl: e } = this, t = {
      anisotropicFiltering: e.getExtension("EXT_texture_filter_anisotropic"),
      floatTextureLinear: e.getExtension("OES_texture_float_linear"),
      s3tc: e.getExtension("WEBGL_compressed_texture_s3tc"),
      s3tc_sRGB: e.getExtension("WEBGL_compressed_texture_s3tc_srgb"),
      // eslint-disable-line camelcase
      etc: e.getExtension("WEBGL_compressed_texture_etc"),
      etc1: e.getExtension("WEBGL_compressed_texture_etc1"),
      pvrtc: e.getExtension("WEBGL_compressed_texture_pvrtc") || e.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),
      atc: e.getExtension("WEBGL_compressed_texture_atc"),
      astc: e.getExtension("WEBGL_compressed_texture_astc"),
      bptc: e.getExtension("EXT_texture_compression_bptc"),
      rgtc: e.getExtension("EXT_texture_compression_rgtc"),
      loseContext: e.getExtension("WEBGL_lose_context")
    };
    if (this.webGLVersion === 1)
      this.extensions = {
        ...t,
        drawBuffers: e.getExtension("WEBGL_draw_buffers"),
        depthTexture: e.getExtension("WEBGL_depth_texture"),
        vertexArrayObject: e.getExtension("OES_vertex_array_object") || e.getExtension("MOZ_OES_vertex_array_object") || e.getExtension("WEBKIT_OES_vertex_array_object"),
        uint32ElementIndex: e.getExtension("OES_element_index_uint"),
        // Floats and half-floats
        floatTexture: e.getExtension("OES_texture_float"),
        floatTextureLinear: e.getExtension("OES_texture_float_linear"),
        textureHalfFloat: e.getExtension("OES_texture_half_float"),
        textureHalfFloatLinear: e.getExtension("OES_texture_half_float_linear"),
        vertexAttribDivisorANGLE: e.getExtension("ANGLE_instanced_arrays"),
        srgb: e.getExtension("EXT_sRGB")
      };
    else {
      this.extensions = {
        ...t,
        colorBufferFloat: e.getExtension("EXT_color_buffer_float")
      };
      const r = e.getExtension("WEBGL_provoking_vertex");
      r && r.provokingVertexWEBGL(r.FIRST_VERTEX_CONVENTION_WEBGL);
    }
  }
  /**
   * Handles a lost webgl context
   * @param {WebGLContextEvent} event - The context lost event.
   */
  handleContextLost(e) {
    e.preventDefault(), this._contextLossForced && (this._contextLossForced = !1, setTimeout(() => {
      var t;
      this.gl.isContextLost() && ((t = this.extensions.loseContext) == null || t.restoreContext());
    }, 0));
  }
  /** Handles a restored webgl context. */
  handleContextRestored() {
    this._renderer.runners.contextChange.emit(this.gl);
  }
  destroy() {
    var t;
    const e = this._renderer.view.canvas;
    this._renderer = null, e.removeEventListener("webglcontextlost", this.handleContextLost), e.removeEventListener("webglcontextrestored", this.handleContextRestored), this.gl.useProgram(null), (t = this.extensions.loseContext) == null || t.loseContext();
  }
  /**
   * this function can be called to force a webGL context loss
   * this will release all resources on the GPU.
   * Useful if you need to put Pixi to sleep, and save some GPU memory
   *
   * As soon as render is called - all resources will be created again.
   */
  forceContextLoss() {
    var e;
    (e = this.extensions.loseContext) == null || e.loseContext(), this._contextLossForced = !0;
  }
  /**
   * Validate context.
   * @param {WebGLRenderingContext} gl - Render context.
   */
  validateContext(e) {
    const t = e.getContextAttributes();
    t && !t.stencil && V("Provided WebGL context does not have a stencil buffer, masks may not render correctly");
    const r = this.supports, i = this.webGLVersion === 2, n = this.extensions;
    r.uint32Indices = i || !!n.uint32ElementIndex, r.uniformBufferObject = i, r.vertexArrayObject = i || !!n.vertexArrayObject, r.srgbTextures = i || !!n.srgb, r.nonPowOf2wrapping = i, r.nonPowOf2mipmaps = i, r.msaa = i, r.uint32Indices || V("Provided WebGL context does not support 32 index buffer, large scenes may not render correctly");
  }
};
Wi.extension = {
  type: [
    v.WebGLSystem
  ],
  name: "context"
};
Wi.defaultOptions = {
  /**
   * {@link WebGLOptions.context}
   * @default null
   */
  context: null,
  /**
   * {@link WebGLOptions.premultipliedAlpha}
   * @default true
   */
  premultipliedAlpha: !0,
  /**
   * {@link WebGLOptions.preserveDrawingBuffer}
   * @default false
   */
  preserveDrawingBuffer: !1,
  /**
   * {@link WebGLOptions.powerPreference}
   * @default default
   */
  powerPreference: void 0,
  /**
   * {@link WebGLOptions.webGLVersion}
   * @default 2
   */
  preferWebGLVersion: 2,
  /**
   * {@link WebGLOptions.multiView}
   * @default false
   */
  multiView: !1
};
let em = Wi;
function Fh(s, e) {
  for (const t in s.attributes) {
    const r = s.attributes[t], i = e[t];
    i ? (r.format ?? (r.format = i.format), r.offset ?? (r.offset = i.offset), r.instance ?? (r.instance = i.instance)) : V(`Attribute ${t} is not present in the shader, but is present in the geometry. Unable to infer attribute details.`);
  }
  tm(s);
}
function tm(s) {
  const { buffers: e, attributes: t } = s, r = {}, i = {};
  for (const n in e) {
    const a = e[n];
    r[a.uid] = 0, i[a.uid] = 0;
  }
  for (const n in t) {
    const a = t[n];
    r[a.buffer.uid] += at(a.format).stride;
  }
  for (const n in t) {
    const a = t[n];
    a.stride ?? (a.stride = r[a.buffer.uid]), a.start ?? (a.start = i[a.buffer.uid]), i[a.buffer.uid] += at(a.format).stride;
  }
}
var ni = /* @__PURE__ */ ((s) => (s[s.RGBA = 6408] = "RGBA", s[s.RGB = 6407] = "RGB", s[s.RG = 33319] = "RG", s[s.RED = 6403] = "RED", s[s.RGBA_INTEGER = 36249] = "RGBA_INTEGER", s[s.RGB_INTEGER = 36248] = "RGB_INTEGER", s[s.RG_INTEGER = 33320] = "RG_INTEGER", s[s.RED_INTEGER = 36244] = "RED_INTEGER", s[s.ALPHA = 6406] = "ALPHA", s[s.LUMINANCE = 6409] = "LUMINANCE", s[s.LUMINANCE_ALPHA = 6410] = "LUMINANCE_ALPHA", s[s.DEPTH_COMPONENT = 6402] = "DEPTH_COMPONENT", s[s.DEPTH_STENCIL = 34041] = "DEPTH_STENCIL", s))(ni || {}), Dh = /* @__PURE__ */ ((s) => (s[s.TEXTURE_2D = 3553] = "TEXTURE_2D", s[s.TEXTURE_CUBE_MAP = 34067] = "TEXTURE_CUBE_MAP", s[s.TEXTURE_2D_ARRAY = 35866] = "TEXTURE_2D_ARRAY", s[s.TEXTURE_CUBE_MAP_POSITIVE_X = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X", s[s.TEXTURE_CUBE_MAP_NEGATIVE_X = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X", s[s.TEXTURE_CUBE_MAP_POSITIVE_Y = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y", s[s.TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y", s[s.TEXTURE_CUBE_MAP_POSITIVE_Z = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z", s[s.TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z", s))(Dh || {}), ee = /* @__PURE__ */ ((s) => (s[s.UNSIGNED_BYTE = 5121] = "UNSIGNED_BYTE", s[s.UNSIGNED_SHORT = 5123] = "UNSIGNED_SHORT", s[s.UNSIGNED_SHORT_5_6_5 = 33635] = "UNSIGNED_SHORT_5_6_5", s[s.UNSIGNED_SHORT_4_4_4_4 = 32819] = "UNSIGNED_SHORT_4_4_4_4", s[s.UNSIGNED_SHORT_5_5_5_1 = 32820] = "UNSIGNED_SHORT_5_5_5_1", s[s.UNSIGNED_INT = 5125] = "UNSIGNED_INT", s[s.UNSIGNED_INT_10F_11F_11F_REV = 35899] = "UNSIGNED_INT_10F_11F_11F_REV", s[s.UNSIGNED_INT_2_10_10_10_REV = 33640] = "UNSIGNED_INT_2_10_10_10_REV", s[s.UNSIGNED_INT_24_8 = 34042] = "UNSIGNED_INT_24_8", s[s.UNSIGNED_INT_5_9_9_9_REV = 35902] = "UNSIGNED_INT_5_9_9_9_REV", s[s.BYTE = 5120] = "BYTE", s[s.SHORT = 5122] = "SHORT", s[s.INT = 5124] = "INT", s[s.FLOAT = 5126] = "FLOAT", s[s.FLOAT_32_UNSIGNED_INT_24_8_REV = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV", s[s.HALF_FLOAT = 36193] = "HALF_FLOAT", s))(ee || {});
const Ba = {
  uint8x2: ee.UNSIGNED_BYTE,
  uint8x4: ee.UNSIGNED_BYTE,
  sint8x2: ee.BYTE,
  sint8x4: ee.BYTE,
  unorm8x2: ee.UNSIGNED_BYTE,
  unorm8x4: ee.UNSIGNED_BYTE,
  snorm8x2: ee.BYTE,
  snorm8x4: ee.BYTE,
  uint16x2: ee.UNSIGNED_SHORT,
  uint16x4: ee.UNSIGNED_SHORT,
  sint16x2: ee.SHORT,
  sint16x4: ee.SHORT,
  unorm16x2: ee.UNSIGNED_SHORT,
  unorm16x4: ee.UNSIGNED_SHORT,
  snorm16x2: ee.SHORT,
  snorm16x4: ee.SHORT,
  float16x2: ee.HALF_FLOAT,
  float16x4: ee.HALF_FLOAT,
  float32: ee.FLOAT,
  float32x2: ee.FLOAT,
  float32x3: ee.FLOAT,
  float32x4: ee.FLOAT,
  uint32: ee.UNSIGNED_INT,
  uint32x2: ee.UNSIGNED_INT,
  uint32x3: ee.UNSIGNED_INT,
  uint32x4: ee.UNSIGNED_INT,
  sint32: ee.INT,
  sint32x2: ee.INT,
  sint32x3: ee.INT,
  sint32x4: ee.INT
};
function rm(s) {
  return Ba[s] ?? Ba.float32;
}
const sm = {
  "point-list": 0,
  "line-list": 1,
  "line-strip": 3,
  "triangle-list": 4,
  "triangle-strip": 5
};
class Oh {
  /** @param renderer - The renderer this System works for. */
  constructor(e) {
    this._geometryVaoHash = /* @__PURE__ */ Object.create(null), this._renderer = e, this._activeGeometry = null, this._activeVao = null, this.hasVao = !0, this.hasInstance = !0, this._renderer.renderableGC.addManagedHash(this, "_geometryVaoHash");
  }
  /** Sets up the renderer context and necessary buffers. */
  contextChange() {
    const e = this.gl = this._renderer.gl;
    if (!this._renderer.context.supports.vertexArrayObject)
      throw new Error("[PixiJS] Vertex Array Objects are not supported on this device");
    const t = this._renderer.context.extensions.vertexArrayObject;
    t && (e.createVertexArray = () => t.createVertexArrayOES(), e.bindVertexArray = (i) => t.bindVertexArrayOES(i), e.deleteVertexArray = (i) => t.deleteVertexArrayOES(i));
    const r = this._renderer.context.extensions.vertexAttribDivisorANGLE;
    r && (e.drawArraysInstanced = (i, n, a, o) => {
      r.drawArraysInstancedANGLE(i, n, a, o);
    }, e.drawElementsInstanced = (i, n, a, o, h) => {
      r.drawElementsInstancedANGLE(i, n, a, o, h);
    }, e.vertexAttribDivisor = (i, n) => r.vertexAttribDivisorANGLE(i, n)), this._activeGeometry = null, this._activeVao = null, this._geometryVaoHash = /* @__PURE__ */ Object.create(null);
  }
  /**
   * Binds geometry so that is can be drawn. Creating a Vao if required
   * @param geometry - Instance of geometry to bind.
   * @param program - Instance of program to use vao for.
   */
  bind(e, t) {
    const r = this.gl;
    this._activeGeometry = e;
    const i = this.getVao(e, t);
    this._activeVao !== i && (this._activeVao = i, r.bindVertexArray(i)), this.updateBuffers();
  }
  /** Reset and unbind any active VAO and geometry. */
  resetState() {
    this.unbind();
  }
  /** Update buffers of the currently bound geometry. */
  updateBuffers() {
    const e = this._activeGeometry, t = this._renderer.buffer;
    for (let r = 0; r < e.buffers.length; r++) {
      const i = e.buffers[r];
      t.updateBuffer(i);
    }
  }
  /**
   * Check compatibility between a geometry and a program
   * @param geometry - Geometry instance.
   * @param program - Program instance.
   */
  checkCompatibility(e, t) {
    const r = e.attributes, i = t._attributeData;
    for (const n in i)
      if (!r[n])
        throw new Error(`shader and geometry incompatible, geometry missing the "${n}" attribute`);
  }
  /**
   * Takes a geometry and program and generates a unique signature for them.
   * @param geometry - To get signature from.
   * @param program - To test geometry against.
   * @returns - Unique signature of the geometry and program
   */
  getSignature(e, t) {
    const r = e.attributes, i = t._attributeData, n = ["g", e.uid];
    for (const a in r)
      i[a] && n.push(a, i[a].location);
    return n.join("-");
  }
  getVao(e, t) {
    var r;
    return ((r = this._geometryVaoHash[e.uid]) == null ? void 0 : r[t._key]) || this.initGeometryVao(e, t);
  }
  /**
   * Creates or gets Vao with the same structure as the geometry and stores it on the geometry.
   * If vao is created, it is bound automatically. We use a shader to infer what and how to set up the
   * attribute locations.
   * @param geometry - Instance of geometry to to generate Vao for.
   * @param program
   * @param _incRefCount - Increment refCount of all geometry buffers.
   */
  initGeometryVao(e, t, r = !0) {
    const i = this._renderer.gl, n = this._renderer.buffer;
    this._renderer.shader._getProgramData(t), this.checkCompatibility(e, t);
    const a = this.getSignature(e, t);
    this._geometryVaoHash[e.uid] || (this._geometryVaoHash[e.uid] = /* @__PURE__ */ Object.create(null), e.on("destroy", this.onGeometryDestroy, this));
    const o = this._geometryVaoHash[e.uid];
    let h = o[a];
    if (h)
      return o[t._key] = h, h;
    Fh(e, t._attributeData);
    const l = e.buffers;
    h = i.createVertexArray(), i.bindVertexArray(h);
    for (let c = 0; c < l.length; c++) {
      const u = l[c];
      n.bind(u);
    }
    return this.activateVao(e, t), o[t._key] = h, o[a] = h, i.bindVertexArray(null), h;
  }
  /**
   * Disposes geometry.
   * @param geometry - Geometry with buffers. Only VAO will be disposed
   * @param [contextLost=false] - If context was lost, we suppress deleteVertexArray
   */
  onGeometryDestroy(e, t) {
    const r = this._geometryVaoHash[e.uid], i = this.gl;
    if (r) {
      if (t)
        for (const n in r)
          this._activeVao !== r[n] && this.unbind(), i.deleteVertexArray(r[n]);
      this._geometryVaoHash[e.uid] = null;
    }
  }
  /**
   * Dispose all WebGL resources of all managed geometries.
   * @param [contextLost=false] - If context was lost, we suppress `gl.delete` calls
   */
  destroyAll(e = !1) {
    const t = this.gl;
    for (const r in this._geometryVaoHash) {
      if (e)
        for (const i in this._geometryVaoHash[r]) {
          const n = this._geometryVaoHash[r];
          this._activeVao !== n && this.unbind(), t.deleteVertexArray(n[i]);
        }
      this._geometryVaoHash[r] = null;
    }
  }
  /**
   * Activate vertex array object.
   * @param geometry - Geometry instance.
   * @param program - Shader program instance.
   */
  activateVao(e, t) {
    var o;
    const r = this._renderer.gl, i = this._renderer.buffer, n = e.attributes;
    e.indexBuffer && i.bind(e.indexBuffer);
    let a = null;
    for (const h in n) {
      const l = n[h], c = l.buffer, u = i.getGlBuffer(c), d = t._attributeData[h];
      if (d) {
        a !== u && (i.bind(c), a = u);
        const f = d.location;
        r.enableVertexAttribArray(f);
        const p = at(l.format), g = rm(l.format);
        if (((o = d.format) == null ? void 0 : o.substring(1, 4)) === "int" ? r.vertexAttribIPointer(
          f,
          p.size,
          g,
          l.stride,
          l.offset
        ) : r.vertexAttribPointer(
          f,
          p.size,
          g,
          p.normalised,
          l.stride,
          l.offset
        ), l.instance)
          if (this.hasInstance) {
            const m = l.divisor ?? 1;
            r.vertexAttribDivisor(f, m);
          } else
            throw new Error("geometry error, GPU Instancing is not supported on this device");
      }
    }
  }
  /**
   * Draws the currently bound geometry.
   * @param topology - The type primitive to render.
   * @param size - The number of elements to be rendered. If not specified, all vertices after the
   *  starting vertex will be drawn.
   * @param start - The starting vertex in the geometry to start drawing from. If not specified,
   *  drawing will start from the first vertex.
   * @param instanceCount - The number of instances of the set of elements to execute. If not specified,
   *  all instances will be drawn.
   */
  draw(e, t, r, i) {
    const { gl: n } = this._renderer, a = this._activeGeometry, o = sm[e || a.topology];
    if (i ?? (i = a.instanceCount), a.indexBuffer) {
      const h = a.indexBuffer.data.BYTES_PER_ELEMENT, l = h === 2 ? n.UNSIGNED_SHORT : n.UNSIGNED_INT;
      i > 1 ? n.drawElementsInstanced(o, t || a.indexBuffer.data.length, l, (r || 0) * h, i) : n.drawElements(o, t || a.indexBuffer.data.length, l, (r || 0) * h);
    } else i > 1 ? n.drawArraysInstanced(o, r || 0, t || a.getSize(), i) : n.drawArrays(o, r || 0, t || a.getSize());
    return this;
  }
  /** Unbind/reset everything. */
  unbind() {
    this.gl.bindVertexArray(null), this._activeVao = null, this._activeGeometry = null;
  }
  destroy() {
    this._renderer = null, this.gl = null, this._activeVao = null, this._activeGeometry = null;
  }
}
Oh.extension = {
  type: [
    v.WebGLSystem
  ],
  name: "geometry"
};
const im = new Gt({
  attributes: {
    aPosition: [
      -1,
      -1,
      // Bottom left corner
      3,
      -1,
      // Bottom right corner, extending beyond right edge
      -1,
      3
      // Top left corner, extending beyond top edge
    ]
  }
}), zi = class Lh {
  constructor(e) {
    this.useBackBuffer = !1, this._useBackBufferThisRender = !1, this._renderer = e;
  }
  init(e = {}) {
    const { useBackBuffer: t, antialias: r } = { ...Lh.defaultOptions, ...e };
    this.useBackBuffer = t, this._antialias = r, this._renderer.context.supports.msaa || (V("antialiasing, is not supported on when using the back buffer"), this._antialias = !1), this._state = ke.for2d();
    const i = new yt({
      vertex: `
                attribute vec2 aPosition;
                out vec2 vUv;

                void main() {
                    gl_Position = vec4(aPosition, 0.0, 1.0);

                    vUv = (aPosition + 1.0) / 2.0;

                    // flip dem UVs
                    vUv.y = 1.0 - vUv.y;
                }`,
      fragment: `
                in vec2 vUv;
                out vec4 finalColor;

                uniform sampler2D uTexture;

                void main() {
                    finalColor = texture(uTexture, vUv);
                }`,
      name: "big-triangle"
    });
    this._bigTriangleShader = new Ie({
      glProgram: i,
      resources: {
        uTexture: D.WHITE.source
      }
    });
  }
  /**
   * This is called before the RenderTargetSystem is started. This is where
   * we replace the target with the back buffer if required.
   * @param options - The options for this render.
   */
  renderStart(e) {
    const t = this._renderer.renderTarget.getRenderTarget(e.target);
    if (this._useBackBufferThisRender = this.useBackBuffer && !!t.isRoot, this._useBackBufferThisRender) {
      const r = this._renderer.renderTarget.getRenderTarget(e.target);
      this._targetTexture = r.colorTexture, e.target = this._getBackBufferTexture(r.colorTexture);
    }
  }
  renderEnd() {
    this._presentBackBuffer();
  }
  _presentBackBuffer() {
    const e = this._renderer;
    e.renderTarget.finishRenderPass(), this._useBackBufferThisRender && (e.renderTarget.bind(this._targetTexture, !1), this._bigTriangleShader.resources.uTexture = this._backBufferTexture.source, e.encoder.draw({
      geometry: im,
      shader: this._bigTriangleShader,
      state: this._state
    }));
  }
  _getBackBufferTexture(e) {
    return this._backBufferTexture = this._backBufferTexture || new D({
      source: new me({
        width: e.width,
        height: e.height,
        resolution: e._resolution,
        antialias: this._antialias
      })
    }), this._backBufferTexture.source.resize(
      e.width,
      e.height,
      e._resolution
    ), this._backBufferTexture;
  }
  /** destroys the back buffer */
  destroy() {
    this._backBufferTexture && (this._backBufferTexture.destroy(), this._backBufferTexture = null);
  }
};
zi.extension = {
  type: [
    v.WebGLSystem
  ],
  name: "backBuffer",
  priority: 1
};
zi.defaultOptions = {
  /** if true will use the back buffer where required */
  useBackBuffer: !1
};
let nm = zi;
class Nh {
  constructor(e) {
    this._colorMaskCache = 15, this._renderer = e;
  }
  setMask(e) {
    this._colorMaskCache !== e && (this._colorMaskCache = e, this._renderer.gl.colorMask(
      !!(e & 8),
      !!(e & 4),
      !!(e & 2),
      !!(e & 1)
    ));
  }
}
Nh.extension = {
  type: [
    v.WebGLSystem
  ],
  name: "colorMask"
};
class Hh {
  constructor(e) {
    this.commandFinished = Promise.resolve(), this._renderer = e;
  }
  setGeometry(e, t) {
    this._renderer.geometry.bind(e, t.glProgram);
  }
  finishRenderPass() {
  }
  draw(e) {
    const t = this._renderer, { geometry: r, shader: i, state: n, skipSync: a, topology: o, size: h, start: l, instanceCount: c } = e;
    t.shader.bind(i, a), t.geometry.bind(r, t.shader._activeProgram), n && t.state.set(n), t.geometry.draw(o, h, l, c ?? r.instanceCount);
  }
  destroy() {
    this._renderer = null;
  }
}
Hh.extension = {
  type: [
    v.WebGLSystem
  ],
  name: "encoder"
};
class am {
  constructor() {
    this.width = -1, this.height = -1, this.msaa = !1, this.msaaRenderBuffer = [];
  }
}
const ct = [];
ct[fe.NONE] = void 0;
ct[fe.DISABLED] = {
  stencilWriteMask: 0,
  stencilReadMask: 0
};
ct[fe.RENDERING_MASK_ADD] = {
  stencilFront: {
    compare: "equal",
    passOp: "increment-clamp"
  },
  stencilBack: {
    compare: "equal",
    passOp: "increment-clamp"
  }
};
ct[fe.RENDERING_MASK_REMOVE] = {
  stencilFront: {
    compare: "equal",
    passOp: "decrement-clamp"
  },
  stencilBack: {
    compare: "equal",
    passOp: "decrement-clamp"
  }
};
ct[fe.MASK_ACTIVE] = {
  stencilWriteMask: 0,
  stencilFront: {
    compare: "equal",
    passOp: "keep"
  },
  stencilBack: {
    compare: "equal",
    passOp: "keep"
  }
};
ct[fe.INVERSE_MASK_ACTIVE] = {
  stencilWriteMask: 0,
  stencilFront: {
    compare: "not-equal",
    passOp: "replace"
  },
  stencilBack: {
    compare: "not-equal",
    passOp: "replace"
  }
};
class Wh {
  constructor(e) {
    this._stencilCache = {
      enabled: !1,
      stencilReference: 0,
      stencilMode: fe.NONE
    }, this._renderTargetStencilState = /* @__PURE__ */ Object.create(null), e.renderTarget.onRenderTargetChange.add(this);
  }
  contextChange(e) {
    this._gl = e, this._comparisonFuncMapping = {
      always: e.ALWAYS,
      never: e.NEVER,
      equal: e.EQUAL,
      "not-equal": e.NOTEQUAL,
      less: e.LESS,
      "less-equal": e.LEQUAL,
      greater: e.GREATER,
      "greater-equal": e.GEQUAL
    }, this._stencilOpsMapping = {
      keep: e.KEEP,
      zero: e.ZERO,
      replace: e.REPLACE,
      invert: e.INVERT,
      "increment-clamp": e.INCR,
      "decrement-clamp": e.DECR,
      "increment-wrap": e.INCR_WRAP,
      "decrement-wrap": e.DECR_WRAP
    }, this.resetState();
  }
  onRenderTargetChange(e) {
    if (this._activeRenderTarget === e)
      return;
    this._activeRenderTarget = e;
    let t = this._renderTargetStencilState[e.uid];
    t || (t = this._renderTargetStencilState[e.uid] = {
      stencilMode: fe.DISABLED,
      stencilReference: 0
    }), this.setStencilMode(t.stencilMode, t.stencilReference);
  }
  resetState() {
    this._stencilCache.enabled = !1, this._stencilCache.stencilMode = fe.NONE, this._stencilCache.stencilReference = 0;
  }
  setStencilMode(e, t) {
    const r = this._renderTargetStencilState[this._activeRenderTarget.uid], i = this._gl, n = ct[e], a = this._stencilCache;
    if (r.stencilMode = e, r.stencilReference = t, e === fe.DISABLED) {
      this._stencilCache.enabled && (this._stencilCache.enabled = !1, i.disable(i.STENCIL_TEST));
      return;
    }
    this._stencilCache.enabled || (this._stencilCache.enabled = !0, i.enable(i.STENCIL_TEST)), (e !== a.stencilMode || a.stencilReference !== t) && (a.stencilMode = e, a.stencilReference = t, i.stencilFunc(this._comparisonFuncMapping[n.stencilBack.compare], t, 255), i.stencilOp(i.KEEP, i.KEEP, this._stencilOpsMapping[n.stencilBack.passOp]));
  }
}
Wh.extension = {
  type: [
    v.WebGLSystem
  ],
  name: "stencil"
};
class zh {
  constructor(e) {
    this._syncFunctionHash = /* @__PURE__ */ Object.create(null), this._adaptor = e, this._systemCheck();
  }
  /**
   * Overridable function by `pixi.js/unsafe-eval` to silence
   * throwing an error if platform doesn't support unsafe-evals.
   * @private
   */
  _systemCheck() {
    if (!Uo())
      throw new Error("Current environment does not allow unsafe-eval, please use pixi.js/unsafe-eval module to enable support.");
  }
  ensureUniformGroup(e) {
    const t = this.getUniformGroupData(e);
    e.buffer || (e.buffer = new Ee({
      data: new Float32Array(t.layout.size / 4),
      usage: q.UNIFORM | q.COPY_DST
    }));
  }
  getUniformGroupData(e) {
    return this._syncFunctionHash[e._signature] || this._initUniformGroup(e);
  }
  _initUniformGroup(e) {
    const t = e._signature;
    let r = this._syncFunctionHash[t];
    if (!r) {
      const i = Object.keys(e.uniformStructures).map((o) => e.uniformStructures[o]), n = this._adaptor.createUboElements(i), a = this._generateUboSync(n.uboElements);
      r = this._syncFunctionHash[t] = {
        layout: n,
        syncFunction: a
      };
    }
    return this._syncFunctionHash[t];
  }
  _generateUboSync(e) {
    return this._adaptor.generateUboSync(e);
  }
  syncUniformGroup(e, t, r) {
    const i = this.getUniformGroupData(e);
    e.buffer || (e.buffer = new Ee({
      data: new Float32Array(i.layout.size / 4),
      usage: q.UNIFORM | q.COPY_DST
    }));
    let n = null;
    return t || (t = e.buffer.data, n = e.buffer.dataInt32), r || (r = 0), i.syncFunction(e.uniforms, t, n, r), !0;
  }
  updateUniformGroup(e) {
    if (e.isStatic && !e._dirtyId)
      return !1;
    e._dirtyId = 0;
    const t = this.syncUniformGroup(e);
    return e.buffer.update(), t;
  }
  destroy() {
    this._syncFunctionHash = null;
  }
}
const Vh = {
  f32: 4,
  i32: 4,
  "vec2<f32>": 8,
  "vec3<f32>": 12,
  "vec4<f32>": 16,
  "vec2<i32>": 8,
  "vec3<i32>": 12,
  "vec4<i32>": 16,
  "mat2x2<f32>": 32,
  "mat3x3<f32>": 48,
  "mat4x4<f32>": 64
  // TODO - not essential for now but support these in the future
  // int:      4,
  // ivec2:    8,
  // ivec3:    12,
  // ivec4:    16,
  // uint:     4,
  // uvec2:    8,
  // uvec3:    12,
  // uvec4:    16,
  // bool:     4,
  // bvec2:    8,
  // bvec3:    12,
  // bvec4:    16,
  // mat2:     16 * 2,
  // mat3:     16 * 3,
  // mat4:     16 * 4,
};
function om(s) {
  const e = s.map((n) => ({
    data: n,
    offset: 0,
    size: 0
  })), t = 16;
  let r = 0, i = 0;
  for (let n = 0; n < e.length; n++) {
    const a = e[n];
    if (r = Vh[a.data.type], !r)
      throw new Error(`Unknown type ${a.data.type}`);
    a.data.size > 1 && (r = Math.max(r, t) * a.data.size);
    const o = r === 12 ? 16 : r;
    a.size = r;
    const h = i % t;
    h > 0 && t - h < o ? i += (t - h) % 16 : i += (r - h % r) % r, a.offset = i, i += r;
  }
  return i = Math.ceil(i / 16) * 16, { uboElements: e, size: i };
}
const _t = [
  // uploading pixi matrix object to mat3
  {
    type: "mat3x3<f32>",
    test: (s) => s.value.a !== void 0,
    ubo: `
            var matrix = uv[name].toArray(true);
            data[offset] = matrix[0];
            data[offset + 1] = matrix[1];
            data[offset + 2] = matrix[2];
            data[offset + 4] = matrix[3];
            data[offset + 5] = matrix[4];
            data[offset + 6] = matrix[5];
            data[offset + 8] = matrix[6];
            data[offset + 9] = matrix[7];
            data[offset + 10] = matrix[8];
        `,
    uniform: `
            gl.uniformMatrix3fv(ud[name].location, false, uv[name].toArray(true));
        `
  },
  // uploading a pixi rectangle as a vec4
  {
    type: "vec4<f32>",
    test: (s) => s.type === "vec4<f32>" && s.size === 1 && s.value.width !== void 0,
    ubo: `
            v = uv[name];
            data[offset] = v.x;
            data[offset + 1] = v.y;
            data[offset + 2] = v.width;
            data[offset + 3] = v.height;
        `,
    uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height) {
                cv[0] = v.x;
                cv[1] = v.y;
                cv[2] = v.width;
                cv[3] = v.height;
                gl.uniform4f(ud[name].location, v.x, v.y, v.width, v.height);
            }
        `
  },
  // uploading a pixi point as a vec2
  {
    type: "vec2<f32>",
    test: (s) => s.type === "vec2<f32>" && s.size === 1 && s.value.x !== void 0,
    ubo: `
            v = uv[name];
            data[offset] = v.x;
            data[offset + 1] = v.y;
        `,
    uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.x || cv[1] !== v.y) {
                cv[0] = v.x;
                cv[1] = v.y;
                gl.uniform2f(ud[name].location, v.x, v.y);
            }
        `
  },
  // uploading a pixi color as a vec4
  {
    type: "vec4<f32>",
    test: (s) => s.type === "vec4<f32>" && s.size === 1 && s.value.red !== void 0,
    ubo: `
            v = uv[name];
            data[offset] = v.red;
            data[offset + 1] = v.green;
            data[offset + 2] = v.blue;
            data[offset + 3] = v.alpha;
        `,
    uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue || cv[3] !== v.alpha) {
                cv[0] = v.red;
                cv[1] = v.green;
                cv[2] = v.blue;
                cv[3] = v.alpha;
                gl.uniform4f(ud[name].location, v.red, v.green, v.blue, v.alpha);
            }
        `
  },
  // uploading a pixi color as a vec3
  {
    type: "vec3<f32>",
    test: (s) => s.type === "vec3<f32>" && s.size === 1 && s.value.red !== void 0,
    ubo: `
            v = uv[name];
            data[offset] = v.red;
            data[offset + 1] = v.green;
            data[offset + 2] = v.blue;
        `,
    uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue) {
                cv[0] = v.red;
                cv[1] = v.green;
                cv[2] = v.blue;
                gl.uniform3f(ud[name].location, v.red, v.green, v.blue);
            }
        `
  }
];
function $h(s, e, t, r) {
  const i = [`
        var v = null;
        var v2 = null;
        var t = 0;
        var index = 0;
        var name = null;
        var arrayOffset = null;
    `];
  let n = 0;
  for (let o = 0; o < s.length; o++) {
    const h = s[o], l = h.data.name;
    let c = !1, u = 0;
    for (let d = 0; d < _t.length; d++)
      if (_t[d].test(h.data)) {
        u = h.offset / 4, i.push(
          `name = "${l}";`,
          `offset += ${u - n};`,
          _t[d][e] || _t[d].ubo
        ), c = !0;
        break;
      }
    if (!c)
      if (h.data.size > 1)
        u = h.offset / 4, i.push(t(h, u - n));
      else {
        const d = r[h.data.type];
        u = h.offset / 4, i.push(
          /* wgsl */
          `
                    v = uv.${l};
                    offset += ${u - n};
                    ${d};
                `
        );
      }
    n = u;
  }
  const a = i.join(`
`);
  return new Function(
    "uv",
    "data",
    "dataInt32",
    "offset",
    a
  );
}
function St(s, e) {
  return `
        for (let i = 0; i < ${s * e}; i++) {
            data[offset + (((i / ${s})|0) * 4) + (i % ${s})] = v[i];
        }
    `;
}
const Xh = {
  f32: `
        data[offset] = v;`,
  i32: `
        dataInt32[offset] = v;`,
  "vec2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];`,
  "vec3<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];`,
  "vec4<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];`,
  "vec2<i32>": `
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];`,
  "vec3<i32>": `
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];
        dataInt32[offset + 2] = v[2];`,
  "vec4<i32>": `
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];
        dataInt32[offset + 2] = v[2];
        dataInt32[offset + 3] = v[3];`,
  "mat2x2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 4] = v[2];
        data[offset + 5] = v[3];`,
  "mat3x3<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 4] = v[3];
        data[offset + 5] = v[4];
        data[offset + 6] = v[5];
        data[offset + 8] = v[6];
        data[offset + 9] = v[7];
        data[offset + 10] = v[8];`,
  "mat4x4<f32>": `
        for (let i = 0; i < 16; i++) {
            data[offset + i] = v[i];
        }`,
  "mat3x2<f32>": St(3, 2),
  "mat4x2<f32>": St(4, 2),
  "mat2x3<f32>": St(2, 3),
  "mat4x3<f32>": St(4, 3),
  "mat2x4<f32>": St(2, 4),
  "mat3x4<f32>": St(3, 4)
}, hm = {
  ...Xh,
  "mat2x2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];
    `
};
function lm(s, e) {
  const t = Math.max(Vh[s.data.type] / 16, 1), r = s.data.value.length / s.data.size, i = (4 - r % 4) % 4, n = s.data.type.indexOf("i32") >= 0 ? "dataInt32" : "data";
  return `
        v = uv.${s.data.name};
        offset += ${e};

        arrayOffset = offset;

        t = 0;

        for(var i=0; i < ${s.data.size * t}; i++)
        {
            for(var j = 0; j < ${r}; j++)
            {
                ${n}[arrayOffset++] = v[t++];
            }
            ${i !== 0 ? `arrayOffset += ${i};` : ""}
        }
    `;
}
function cm(s) {
  return $h(
    s,
    "uboStd40",
    lm,
    Xh
  );
}
class jh extends zh {
  constructor() {
    super({
      createUboElements: om,
      generateUboSync: cm
    });
  }
}
jh.extension = {
  type: [v.WebGLSystem],
  name: "ubo"
};
class um {
  constructor() {
    this._clearColorCache = [0, 0, 0, 0], this._viewPortCache = new ne();
  }
  init(e, t) {
    this._renderer = e, this._renderTargetSystem = t, e.runners.contextChange.add(this);
  }
  contextChange() {
    this._clearColorCache = [0, 0, 0, 0], this._viewPortCache = new ne();
  }
  copyToTexture(e, t, r, i, n) {
    const a = this._renderTargetSystem, o = this._renderer, h = a.getGpuRenderTarget(e), l = o.gl;
    return this.finishRenderPass(e), l.bindFramebuffer(l.FRAMEBUFFER, h.resolveTargetFramebuffer), o.texture.bind(t, 0), l.copyTexSubImage2D(
      l.TEXTURE_2D,
      0,
      n.x,
      n.y,
      r.x,
      r.y,
      i.width,
      i.height
    ), t;
  }
  startRenderPass(e, t = !0, r, i) {
    const n = this._renderTargetSystem, a = e.colorTexture, o = n.getGpuRenderTarget(e);
    let h = i.y;
    e.isRoot && (h = a.pixelHeight - i.height), e.colorTextures.forEach((u) => {
      this._renderer.texture.unbind(u);
    });
    const l = this._renderer.gl;
    l.bindFramebuffer(l.FRAMEBUFFER, o.framebuffer);
    const c = this._viewPortCache;
    (c.x !== i.x || c.y !== h || c.width !== i.width || c.height !== i.height) && (c.x = i.x, c.y = h, c.width = i.width, c.height = i.height, l.viewport(
      i.x,
      h,
      i.width,
      i.height
    )), !o.depthStencilRenderBuffer && (e.stencil || e.depth) && this._initStencil(o), this.clear(e, t, r);
  }
  finishRenderPass(e) {
    const r = this._renderTargetSystem.getGpuRenderTarget(e);
    if (!r.msaa)
      return;
    const i = this._renderer.gl;
    i.bindFramebuffer(i.FRAMEBUFFER, r.resolveTargetFramebuffer), i.bindFramebuffer(i.READ_FRAMEBUFFER, r.framebuffer), i.blitFramebuffer(
      0,
      0,
      r.width,
      r.height,
      0,
      0,
      r.width,
      r.height,
      i.COLOR_BUFFER_BIT,
      i.NEAREST
    ), i.bindFramebuffer(i.FRAMEBUFFER, r.framebuffer);
  }
  initGpuRenderTarget(e) {
    const r = this._renderer.gl, i = new am(), n = e.colorTexture;
    return Qe.test(n.resource) ? (this._renderer.context.ensureCanvasSize(e.colorTexture.resource), i.framebuffer = null, i) : (this._initColor(e, i), r.bindFramebuffer(r.FRAMEBUFFER, null), i);
  }
  destroyGpuRenderTarget(e) {
    const t = this._renderer.gl;
    e.framebuffer && (t.deleteFramebuffer(e.framebuffer), e.framebuffer = null), e.resolveTargetFramebuffer && (t.deleteFramebuffer(e.resolveTargetFramebuffer), e.resolveTargetFramebuffer = null), e.depthStencilRenderBuffer && (t.deleteRenderbuffer(e.depthStencilRenderBuffer), e.depthStencilRenderBuffer = null), e.msaaRenderBuffer.forEach((r) => {
      t.deleteRenderbuffer(r);
    }), e.msaaRenderBuffer = null;
  }
  clear(e, t, r) {
    if (!t)
      return;
    const i = this._renderTargetSystem;
    typeof t == "boolean" && (t = t ? Pe.ALL : Pe.NONE);
    const n = this._renderer.gl;
    if (t & Pe.COLOR) {
      r ?? (r = i.defaultClearColor);
      const a = this._clearColorCache, o = r;
      (a[0] !== o[0] || a[1] !== o[1] || a[2] !== o[2] || a[3] !== o[3]) && (a[0] = o[0], a[1] = o[1], a[2] = o[2], a[3] = o[3], n.clearColor(o[0], o[1], o[2], o[3]));
    }
    n.clear(t);
  }
  resizeGpuRenderTarget(e) {
    if (e.isRoot)
      return;
    const r = this._renderTargetSystem.getGpuRenderTarget(e);
    this._resizeColor(e, r), (e.stencil || e.depth) && this._resizeStencil(r);
  }
  _initColor(e, t) {
    const r = this._renderer, i = r.gl, n = i.createFramebuffer();
    if (t.resolveTargetFramebuffer = n, i.bindFramebuffer(i.FRAMEBUFFER, n), t.width = e.colorTexture.source.pixelWidth, t.height = e.colorTexture.source.pixelHeight, e.colorTextures.forEach((a, o) => {
      const h = a.source;
      h.antialias && (r.context.supports.msaa ? t.msaa = !0 : V("[RenderTexture] Antialiasing on textures is not supported in WebGL1")), r.texture.bindSource(h, 0);
      const c = r.texture.getGlSource(h).texture;
      i.framebufferTexture2D(
        i.FRAMEBUFFER,
        i.COLOR_ATTACHMENT0 + o,
        3553,
        // texture.target,
        c,
        0
      );
    }), t.msaa) {
      const a = i.createFramebuffer();
      t.framebuffer = a, i.bindFramebuffer(i.FRAMEBUFFER, a), e.colorTextures.forEach((o, h) => {
        const l = i.createRenderbuffer();
        t.msaaRenderBuffer[h] = l;
      });
    } else
      t.framebuffer = n;
    this._resizeColor(e, t);
  }
  _resizeColor(e, t) {
    const r = e.colorTexture.source;
    if (t.width = r.pixelWidth, t.height = r.pixelHeight, e.colorTextures.forEach((i, n) => {
      n !== 0 && i.source.resize(r.width, r.height, r._resolution);
    }), t.msaa) {
      const i = this._renderer, n = i.gl, a = t.framebuffer;
      n.bindFramebuffer(n.FRAMEBUFFER, a), e.colorTextures.forEach((o, h) => {
        const l = o.source;
        i.texture.bindSource(l, 0);
        const u = i.texture.getGlSource(l).internalFormat, d = t.msaaRenderBuffer[h];
        n.bindRenderbuffer(
          n.RENDERBUFFER,
          d
        ), n.renderbufferStorageMultisample(
          n.RENDERBUFFER,
          4,
          u,
          l.pixelWidth,
          l.pixelHeight
        ), n.framebufferRenderbuffer(
          n.FRAMEBUFFER,
          n.COLOR_ATTACHMENT0 + h,
          n.RENDERBUFFER,
          d
        );
      });
    }
  }
  _initStencil(e) {
    if (e.framebuffer === null)
      return;
    const t = this._renderer.gl, r = t.createRenderbuffer();
    e.depthStencilRenderBuffer = r, t.bindRenderbuffer(
      t.RENDERBUFFER,
      r
    ), t.framebufferRenderbuffer(
      t.FRAMEBUFFER,
      t.DEPTH_STENCIL_ATTACHMENT,
      t.RENDERBUFFER,
      r
    ), this._resizeStencil(e);
  }
  _resizeStencil(e) {
    const t = this._renderer.gl;
    t.bindRenderbuffer(
      t.RENDERBUFFER,
      e.depthStencilRenderBuffer
    ), e.msaa ? t.renderbufferStorageMultisample(
      t.RENDERBUFFER,
      4,
      t.DEPTH24_STENCIL8,
      e.width,
      e.height
    ) : t.renderbufferStorage(
      t.RENDERBUFFER,
      this._renderer.context.webGLVersion === 2 ? t.DEPTH24_STENCIL8 : t.DEPTH_STENCIL,
      e.width,
      e.height
    );
  }
  prerender(e) {
    const t = e.colorTexture.resource;
    this._renderer.context.multiView && Qe.test(t) && this._renderer.context.ensureCanvasSize(t);
  }
  postrender(e) {
    if (this._renderer.context.multiView && Qe.test(e.colorTexture.resource)) {
      const t = this._renderer.context.canvas, r = e.colorTexture;
      r.context2D.drawImage(
        t,
        0,
        r.pixelHeight - t.height
      );
    }
  }
}
function dm(s, e, t, r, i, n) {
  const a = n ? 1 : -1;
  return s.identity(), s.a = 1 / r * 2, s.d = a * (1 / i * 2), s.tx = -1 - e * s.a, s.ty = -a - t * s.d, s;
}
const Wt = /* @__PURE__ */ new Map();
function Yh(s, e) {
  if (!Wt.has(s)) {
    const t = new D({
      source: new Qe({
        resource: s,
        ...e
      })
    }), r = () => {
      Wt.get(s) === t && Wt.delete(s);
    };
    t.once("destroy", r), t.source.once("destroy", r), Wt.set(s, t);
  }
  return Wt.get(s);
}
function fm(s) {
  const e = s.colorTexture.source.resource;
  return globalThis.HTMLCanvasElement && e instanceof HTMLCanvasElement && document.body.contains(e);
}
const Kh = class qh {
  /**
   * @param [descriptor] - Options for creating a render target.
   */
  constructor(e = {}) {
    if (this.uid = le("renderTarget"), this.colorTextures = [], this.dirtyId = 0, this.isRoot = !1, this._size = new Float32Array(2), this._managedColorTextures = !1, e = { ...qh.defaultOptions, ...e }, this.stencil = e.stencil, this.depth = e.depth, this.isRoot = e.isRoot, typeof e.colorTextures == "number") {
      this._managedColorTextures = !0;
      for (let t = 0; t < e.colorTextures; t++)
        this.colorTextures.push(
          new me({
            width: e.width,
            height: e.height,
            resolution: e.resolution,
            antialias: e.antialias
          })
        );
    } else {
      this.colorTextures = [...e.colorTextures.map((r) => r.source)];
      const t = this.colorTexture.source;
      this.resize(t.width, t.height, t._resolution);
    }
    this.colorTexture.source.on("resize", this.onSourceResize, this), (e.depthStencilTexture || this.stencil) && (e.depthStencilTexture instanceof D || e.depthStencilTexture instanceof me ? this.depthStencilTexture = e.depthStencilTexture.source : this.ensureDepthStencilTexture());
  }
  get size() {
    const e = this._size;
    return e[0] = this.pixelWidth, e[1] = this.pixelHeight, e;
  }
  get width() {
    return this.colorTexture.source.width;
  }
  get height() {
    return this.colorTexture.source.height;
  }
  get pixelWidth() {
    return this.colorTexture.source.pixelWidth;
  }
  get pixelHeight() {
    return this.colorTexture.source.pixelHeight;
  }
  get resolution() {
    return this.colorTexture.source._resolution;
  }
  get colorTexture() {
    return this.colorTextures[0];
  }
  onSourceResize(e) {
    this.resize(e.width, e.height, e._resolution, !0);
  }
  /**
   * This will ensure a depthStencil texture is created for this render target.
   * Most likely called by the mask system to make sure we have stencil buffer added.
   * @internal
   * @ignore
   */
  ensureDepthStencilTexture() {
    this.depthStencilTexture || (this.depthStencilTexture = new me({
      width: this.width,
      height: this.height,
      resolution: this.resolution,
      format: "depth24plus-stencil8",
      autoGenerateMipmaps: !1,
      antialias: !1,
      mipLevelCount: 1
      // sampleCount: handled by the render target system..
    }));
  }
  resize(e, t, r = this.resolution, i = !1) {
    this.dirtyId++, this.colorTextures.forEach((n, a) => {
      i && a === 0 || n.source.resize(e, t, r);
    }), this.depthStencilTexture && this.depthStencilTexture.source.resize(e, t, r);
  }
  destroy() {
    this.colorTexture.source.off("resize", this.onSourceResize, this), this._managedColorTextures && this.colorTextures.forEach((e) => {
      e.destroy();
    }), this.depthStencilTexture && (this.depthStencilTexture.destroy(), delete this.depthStencilTexture);
  }
};
Kh.defaultOptions = {
  /** the width of the RenderTarget */
  width: 0,
  /** the height of the RenderTarget */
  height: 0,
  /** the resolution of the RenderTarget */
  resolution: 1,
  /** an array of textures, or a number indicating how many color textures there should be */
  colorTextures: 1,
  /** should this render target have a stencil buffer? */
  stencil: !1,
  /** should this render target have a depth buffer? */
  depth: !1,
  /** should this render target be antialiased? */
  antialias: !1,
  // save on perf by default!
  /** is this a root element, true if this is gl context owners render target */
  isRoot: !1
};
let ai = Kh;
class Zh {
  constructor(e) {
    this.rootViewPort = new ne(), this.viewport = new ne(), this.onRenderTargetChange = new Fo("onRenderTargetChange"), this.projectionMatrix = new L(), this.defaultClearColor = [0, 0, 0, 0], this._renderSurfaceToRenderTargetHash = /* @__PURE__ */ new Map(), this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null), this._renderTargetStack = [], this._renderer = e, e.renderableGC.addManagedHash(this, "_gpuRenderTargetHash");
  }
  /** called when dev wants to finish a render pass */
  finishRenderPass() {
    this.adaptor.finishRenderPass(this.renderTarget);
  }
  /**
   * called when the renderer starts to render a scene.
   * @param options
   * @param options.target - the render target to render to
   * @param options.clear - the clear mode to use. Can be true or a CLEAR number 'COLOR | DEPTH | STENCIL' 0b111
   * @param options.clearColor - the color to clear to
   * @param options.frame - the frame to render to
   */
  renderStart({
    target: e,
    clear: t,
    clearColor: r,
    frame: i
  }) {
    var n, a;
    this._renderTargetStack.length = 0, this.push(
      e,
      t,
      r,
      i
    ), this.rootViewPort.copyFrom(this.viewport), this.rootRenderTarget = this.renderTarget, this.renderingToScreen = fm(this.rootRenderTarget), (a = (n = this.adaptor).prerender) == null || a.call(n, this.rootRenderTarget);
  }
  postrender() {
    var e, t;
    (t = (e = this.adaptor).postrender) == null || t.call(e, this.rootRenderTarget);
  }
  /**
   * Binding a render surface! This is the main function of the render target system.
   * It will take the RenderSurface (which can be a texture, canvas, or render target) and bind it to the renderer.
   * Once bound all draw calls will be rendered to the render surface.
   *
   * If a frame is not provide and the render surface is a texture, the frame of the texture will be used.
   * @param renderSurface - the render surface to bind
   * @param clear - the clear mode to use. Can be true or a CLEAR number 'COLOR | DEPTH | STENCIL' 0b111
   * @param clearColor - the color to clear to
   * @param frame - the frame to render to
   * @returns the render target that was bound
   */
  bind(e, t = !0, r, i) {
    const n = this.getRenderTarget(e), a = this.renderTarget !== n;
    this.renderTarget = n, this.renderSurface = e;
    const o = this.getGpuRenderTarget(n);
    (n.pixelWidth !== o.width || n.pixelHeight !== o.height) && (this.adaptor.resizeGpuRenderTarget(n), o.width = n.pixelWidth, o.height = n.pixelHeight);
    const h = n.colorTexture, l = this.viewport, c = h.pixelWidth, u = h.pixelHeight;
    if (!i && e instanceof D && (i = e.frame), i) {
      const d = h._resolution;
      l.x = i.x * d + 0.5 | 0, l.y = i.y * d + 0.5 | 0, l.width = i.width * d + 0.5 | 0, l.height = i.height * d + 0.5 | 0;
    } else
      l.x = 0, l.y = 0, l.width = c, l.height = u;
    return dm(
      this.projectionMatrix,
      0,
      0,
      l.width / h.resolution,
      l.height / h.resolution,
      !n.isRoot
    ), this.adaptor.startRenderPass(n, t, r, l), a && this.onRenderTargetChange.emit(n), n;
  }
  clear(e, t = Pe.ALL, r) {
    t && (e && (e = this.getRenderTarget(e)), this.adaptor.clear(
      e || this.renderTarget,
      t,
      r,
      this.viewport
    ));
  }
  contextChange() {
    this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null);
  }
  /**
   * Push a render surface to the renderer. This will bind the render surface to the renderer,
   * @param renderSurface - the render surface to push
   * @param clear - the clear mode to use. Can be true or a CLEAR number 'COLOR | DEPTH | STENCIL' 0b111
   * @param clearColor - the color to clear to
   * @param frame - the frame to use when rendering to the render surface
   */
  push(e, t = Pe.ALL, r, i) {
    const n = this.bind(e, t, r, i);
    return this._renderTargetStack.push({
      renderTarget: n,
      frame: i
    }), n;
  }
  /** Pops the current render target from the renderer and restores the previous render target. */
  pop() {
    this._renderTargetStack.pop();
    const e = this._renderTargetStack[this._renderTargetStack.length - 1];
    this.bind(e.renderTarget, !1, null, e.frame);
  }
  /**
   * Gets the render target from the provide render surface. Eg if its a texture,
   * it will return the render target for the texture.
   * If its a render target, it will return the same render target.
   * @param renderSurface - the render surface to get the render target for
   * @returns the render target for the render surface
   */
  getRenderTarget(e) {
    return e.isTexture && (e = e.source), this._renderSurfaceToRenderTargetHash.get(e) ?? this._initRenderTarget(e);
  }
  /**
   * Copies a render surface to another texture.
   *
   * NOTE:
   * for sourceRenderSurfaceTexture, The render target must be something that is written too by the renderer
   *
   * The following is not valid:
   * @example
   * const canvas = document.createElement('canvas')
   * canvas.width = 200;
   * canvas.height = 200;
   *
   * const ctx = canvas2.getContext('2d')!
   * ctx.fillStyle = 'red'
   * ctx.fillRect(0, 0, 200, 200);
   *
   * const texture = RenderTexture.create({
   *   width: 200,
   *   height: 200,
   * })
   * const renderTarget = renderer.renderTarget.getRenderTarget(canvas2);
   *
   * renderer.renderTarget.copyToTexture(renderTarget,texture, {x:0,y:0},{width:200,height:200},{x:0,y:0});
   *
   * The best way to copy a canvas is to create a texture from it. Then render with that.
   *
   * Parsing in a RenderTarget canvas context (with a 2d context)
   * @param sourceRenderSurfaceTexture - the render surface to copy from
   * @param destinationTexture - the texture to copy to
   * @param originSrc - the origin of the copy
   * @param originSrc.x - the x origin of the copy
   * @param originSrc.y - the y origin of the copy
   * @param size - the size of the copy
   * @param size.width - the width of the copy
   * @param size.height - the height of the copy
   * @param originDest - the destination origin (top left to paste from!)
   * @param originDest.x - the x origin of the paste
   * @param originDest.y - the y origin of the paste
   */
  copyToTexture(e, t, r, i, n) {
    r.x < 0 && (i.width += r.x, n.x -= r.x, r.x = 0), r.y < 0 && (i.height += r.y, n.y -= r.y, r.y = 0);
    const { pixelWidth: a, pixelHeight: o } = e;
    return i.width = Math.min(i.width, a - r.x), i.height = Math.min(i.height, o - r.y), this.adaptor.copyToTexture(
      e,
      t,
      r,
      i,
      n
    );
  }
  /**
   * ensures that we have a depth stencil buffer available to render to
   * This is used by the mask system to make sure we have a stencil buffer.
   */
  ensureDepthStencil() {
    this.renderTarget.stencil || (this.renderTarget.stencil = !0, this.adaptor.startRenderPass(this.renderTarget, !1, null, this.viewport));
  }
  /** nukes the render target system */
  destroy() {
    this._renderer = null, this._renderSurfaceToRenderTargetHash.forEach((e, t) => {
      e !== t && e.destroy();
    }), this._renderSurfaceToRenderTargetHash.clear(), this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null);
  }
  _initRenderTarget(e) {
    let t = null;
    return Qe.test(e) && (e = Yh(e).source), e instanceof ai ? t = e : e instanceof me && (t = new ai({
      colorTextures: [e]
    }), Qe.test(e.source.resource) && (t.isRoot = !0), e.once("destroy", () => {
      t.destroy(), this._renderSurfaceToRenderTargetHash.delete(e);
      const r = this._gpuRenderTargetHash[t.uid];
      r && (this._gpuRenderTargetHash[t.uid] = null, this.adaptor.destroyGpuRenderTarget(r));
    })), this._renderSurfaceToRenderTargetHash.set(e, t), t;
  }
  getGpuRenderTarget(e) {
    return this._gpuRenderTargetHash[e.uid] || (this._gpuRenderTargetHash[e.uid] = this.adaptor.initGpuRenderTarget(e));
  }
  resetState() {
    this.renderTarget = null, this.renderSurface = null;
  }
}
class Qh extends Zh {
  constructor(e) {
    super(e), this.adaptor = new um(), this.adaptor.init(e, this);
  }
}
Qh.extension = {
  type: [v.WebGLSystem],
  name: "renderTarget"
};
class Vi extends Me {
  /**
   * Create a new Buffer Resource.
   * @param options - The options for the buffer resource
   * @param options.buffer - The underlying buffer that this resource is using
   * @param options.offset - The offset of the buffer this resource is using.
   * If not provided, then it will use the offset of the buffer.
   * @param options.size - The size of the buffer this resource is using.
   * If not provided, then it will use the size of the buffer.
   */
  constructor({ buffer: e, offset: t, size: r }) {
    super(), this.uid = le("buffer"), this._resourceType = "bufferResource", this._touched = 0, this._resourceId = le("resource"), this._bufferResource = !0, this.destroyed = !1, this.buffer = e, this.offset = t | 0, this.size = r, this.buffer.on("change", this.onBufferChange, this);
  }
  onBufferChange() {
    this._resourceId = le("resource"), this.emit("change", this);
  }
  /**
   * Destroys this resource. Make sure the underlying buffer is not used anywhere else
   * if you want to destroy it as well, or code will explode
   * @param destroyBuffer - Should the underlying buffer be destroyed as well?
   */
  destroy(e = !1) {
    this.destroyed = !0, e && this.buffer.destroy(), this.emit("change", this), this.buffer = null;
  }
}
function pm(s, e) {
  const t = [], r = [`
        var g = s.groups;
        var sS = r.shader;
        var p = s.glProgram;
        var ugS = r.uniformGroup;
        var resources;
    `];
  let i = !1, n = 0;
  const a = e._getProgramData(s.glProgram);
  for (const h in s.groups) {
    const l = s.groups[h];
    t.push(`
            resources = g[${h}].resources;
        `);
    for (const c in l.resources) {
      const u = l.resources[c];
      if (u instanceof be)
        if (u.ubo) {
          const d = s._uniformBindMap[h][Number(c)];
          t.push(`
                        sS.bindUniformBlock(
                            resources[${c}],
                            '${d}',
                            ${s.glProgram._uniformBlockData[d].index}
                        );
                    `);
        } else
          t.push(`
                        ugS.updateUniformGroup(resources[${c}], p, sD);
                    `);
      else if (u instanceof Vi) {
        const d = s._uniformBindMap[h][Number(c)];
        t.push(`
                    sS.bindUniformBlock(
                        resources[${c}],
                        '${d}',
                        ${s.glProgram._uniformBlockData[d].index}
                    );
                `);
      } else if (u instanceof me) {
        const d = s._uniformBindMap[h][c], f = a.uniformData[d];
        f && (i || (i = !0, r.push(`
                        var tS = r.texture;
                        `)), e._gl.uniform1i(f.location, n), t.push(`
                        tS.bind(resources[${c}], ${n});
                    `), n++);
      }
    }
  }
  const o = [...r, ...t].join(`
`);
  return new Function("r", "s", "sD", o);
}
class mm {
  /**
   * Makes a new Pixi program.
   * @param program - webgl program
   * @param uniformData - uniforms
   */
  constructor(e, t) {
    this.program = e, this.uniformData = t, this.uniformGroups = {}, this.uniformDirtyGroups = {}, this.uniformBlockBindings = {};
  }
  /** Destroys this program. */
  destroy() {
    this.uniformData = null, this.uniformGroups = null, this.uniformDirtyGroups = null, this.uniformBlockBindings = null, this.program = null;
  }
}
function Ra(s, e, t) {
  const r = s.createShader(e);
  return s.shaderSource(r, t), s.compileShader(r), r;
}
function Ms(s) {
  const e = new Array(s);
  for (let t = 0; t < e.length; t++)
    e[t] = !1;
  return e;
}
function Jh(s, e) {
  switch (s) {
    case "float":
      return 0;
    case "vec2":
      return new Float32Array(2 * e);
    case "vec3":
      return new Float32Array(3 * e);
    case "vec4":
      return new Float32Array(4 * e);
    case "int":
    case "uint":
    case "sampler2D":
    case "sampler2DArray":
      return 0;
    case "ivec2":
      return new Int32Array(2 * e);
    case "ivec3":
      return new Int32Array(3 * e);
    case "ivec4":
      return new Int32Array(4 * e);
    case "uvec2":
      return new Uint32Array(2 * e);
    case "uvec3":
      return new Uint32Array(3 * e);
    case "uvec4":
      return new Uint32Array(4 * e);
    case "bool":
      return !1;
    case "bvec2":
      return Ms(2 * e);
    case "bvec3":
      return Ms(3 * e);
    case "bvec4":
      return Ms(4 * e);
    case "mat2":
      return new Float32Array([
        1,
        0,
        0,
        1
      ]);
    case "mat3":
      return new Float32Array([
        1,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        1
      ]);
    case "mat4":
      return new Float32Array([
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1
      ]);
  }
  return null;
}
let wr = null;
const ka = {
  FLOAT: "float",
  FLOAT_VEC2: "vec2",
  FLOAT_VEC3: "vec3",
  FLOAT_VEC4: "vec4",
  INT: "int",
  INT_VEC2: "ivec2",
  INT_VEC3: "ivec3",
  INT_VEC4: "ivec4",
  UNSIGNED_INT: "uint",
  UNSIGNED_INT_VEC2: "uvec2",
  UNSIGNED_INT_VEC3: "uvec3",
  UNSIGNED_INT_VEC4: "uvec4",
  BOOL: "bool",
  BOOL_VEC2: "bvec2",
  BOOL_VEC3: "bvec3",
  BOOL_VEC4: "bvec4",
  FLOAT_MAT2: "mat2",
  FLOAT_MAT3: "mat3",
  FLOAT_MAT4: "mat4",
  SAMPLER_2D: "sampler2D",
  INT_SAMPLER_2D: "sampler2D",
  UNSIGNED_INT_SAMPLER_2D: "sampler2D",
  SAMPLER_CUBE: "samplerCube",
  INT_SAMPLER_CUBE: "samplerCube",
  UNSIGNED_INT_SAMPLER_CUBE: "samplerCube",
  SAMPLER_2D_ARRAY: "sampler2DArray",
  INT_SAMPLER_2D_ARRAY: "sampler2DArray",
  UNSIGNED_INT_SAMPLER_2D_ARRAY: "sampler2DArray"
}, gm = {
  float: "float32",
  vec2: "float32x2",
  vec3: "float32x3",
  vec4: "float32x4",
  int: "sint32",
  ivec2: "sint32x2",
  ivec3: "sint32x3",
  ivec4: "sint32x4",
  uint: "uint32",
  uvec2: "uint32x2",
  uvec3: "uint32x3",
  uvec4: "uint32x4",
  bool: "uint32",
  bvec2: "uint32x2",
  bvec3: "uint32x3",
  bvec4: "uint32x4"
};
function el(s, e) {
  if (!wr) {
    const t = Object.keys(ka);
    wr = {};
    for (let r = 0; r < t.length; ++r) {
      const i = t[r];
      wr[s[i]] = ka[i];
    }
  }
  return wr[e];
}
function _m(s, e) {
  const t = el(s, e);
  return gm[t] || "float32";
}
function xm(s, e, t = !1) {
  const r = {}, i = e.getProgramParameter(s, e.ACTIVE_ATTRIBUTES);
  for (let a = 0; a < i; a++) {
    const o = e.getActiveAttrib(s, a);
    if (o.name.startsWith("gl_"))
      continue;
    const h = _m(e, o.type);
    r[o.name] = {
      location: 0,
      // set further down..
      format: h,
      stride: at(h).stride,
      offset: 0,
      instance: !1,
      start: 0
    };
  }
  const n = Object.keys(r);
  if (t) {
    n.sort((a, o) => a > o ? 1 : -1);
    for (let a = 0; a < n.length; a++)
      r[n[a]].location = a, e.bindAttribLocation(s, a, n[a]);
    e.linkProgram(s);
  } else
    for (let a = 0; a < n.length; a++)
      r[n[a]].location = e.getAttribLocation(s, n[a]);
  return r;
}
function ym(s, e) {
  if (!e.ACTIVE_UNIFORM_BLOCKS)
    return {};
  const t = {}, r = e.getProgramParameter(s, e.ACTIVE_UNIFORM_BLOCKS);
  for (let i = 0; i < r; i++) {
    const n = e.getActiveUniformBlockName(s, i), a = e.getUniformBlockIndex(s, n), o = e.getActiveUniformBlockParameter(s, i, e.UNIFORM_BLOCK_DATA_SIZE);
    t[n] = {
      name: n,
      index: a,
      size: o
    };
  }
  return t;
}
function bm(s, e) {
  const t = {}, r = e.getProgramParameter(s, e.ACTIVE_UNIFORMS);
  for (let i = 0; i < r; i++) {
    const n = e.getActiveUniform(s, i), a = n.name.replace(/\[.*?\]$/, ""), o = !!n.name.match(/\[.*?\]$/), h = el(e, n.type);
    t[a] = {
      name: a,
      index: i,
      type: h,
      size: n.size,
      isArray: o,
      value: Jh(h, n.size)
    };
  }
  return t;
}
function Ia(s, e) {
  const t = s.getShaderSource(e).split(`
`).map((l, c) => `${c}: ${l}`), r = s.getShaderInfoLog(e), i = r.split(`
`), n = {}, a = i.map((l) => parseFloat(l.replace(/^ERROR\: 0\:([\d]+)\:.*$/, "$1"))).filter((l) => l && !n[l] ? (n[l] = !0, !0) : !1), o = [""];
  a.forEach((l) => {
    t[l - 1] = `%c${t[l - 1]}%c`, o.push("background: #FF0000; color:#FFFFFF; font-size: 10px", "font-size: 10px");
  });
  const h = t.join(`
`);
  o[0] = h, console.error(r), console.groupCollapsed("click to view full shader code"), console.warn(...o), console.groupEnd();
}
function vm(s, e, t, r) {
  s.getProgramParameter(e, s.LINK_STATUS) || (s.getShaderParameter(t, s.COMPILE_STATUS) || Ia(s, t), s.getShaderParameter(r, s.COMPILE_STATUS) || Ia(s, r), console.error("PixiJS Error: Could not initialize shader."), s.getProgramInfoLog(e) !== "" && console.warn("PixiJS Warning: gl.getProgramInfoLog()", s.getProgramInfoLog(e)));
}
function Tm(s, e) {
  const t = Ra(s, s.VERTEX_SHADER, e.vertex), r = Ra(s, s.FRAGMENT_SHADER, e.fragment), i = s.createProgram();
  s.attachShader(i, t), s.attachShader(i, r);
  const n = e.transformFeedbackVaryings;
  n && (typeof s.transformFeedbackVaryings != "function" ? V("TransformFeedback is not supported but TransformFeedbackVaryings are given.") : s.transformFeedbackVaryings(
    i,
    n.names,
    n.bufferMode === "separate" ? s.SEPARATE_ATTRIBS : s.INTERLEAVED_ATTRIBS
  )), s.linkProgram(i), s.getProgramParameter(i, s.LINK_STATUS) || vm(s, i, t, r), e._attributeData = xm(
    i,
    s,
    !/^[ \t]*#[ \t]*version[ \t]+300[ \t]+es[ \t]*$/m.test(e.vertex)
  ), e._uniformData = bm(i, s), e._uniformBlockData = ym(i, s), s.deleteShader(t), s.deleteShader(r);
  const a = {};
  for (const h in e._uniformData) {
    const l = e._uniformData[h];
    a[h] = {
      location: s.getUniformLocation(i, h),
      value: Jh(l.type, l.size)
    };
  }
  return new mm(i, a);
}
const Ar = {
  textureCount: 0,
  blockIndex: 0
};
class tl {
  constructor(e) {
    this._activeProgram = null, this._programDataHash = /* @__PURE__ */ Object.create(null), this._shaderSyncFunctions = /* @__PURE__ */ Object.create(null), this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_programDataHash");
  }
  contextChange(e) {
    this._gl = e, this._programDataHash = /* @__PURE__ */ Object.create(null), this._shaderSyncFunctions = /* @__PURE__ */ Object.create(null), this._activeProgram = null, this.maxTextures = It();
  }
  /**
   * Changes the current shader to the one given in parameter.
   * @param shader - the new shader
   * @param skipSync - false if the shader should automatically sync its uniforms.
   * @returns the glProgram that belongs to the shader.
   */
  bind(e, t) {
    if (this._setProgram(e.glProgram), t)
      return;
    Ar.textureCount = 0, Ar.blockIndex = 0;
    let r = this._shaderSyncFunctions[e.glProgram._key];
    r || (r = this._shaderSyncFunctions[e.glProgram._key] = this._generateShaderSync(e, this)), this._renderer.buffer.nextBindBase(!!e.glProgram.transformFeedbackVaryings), r(this._renderer, e, Ar);
  }
  /**
   * Updates the uniform group.
   * @param uniformGroup - the uniform group to update
   */
  updateUniformGroup(e) {
    this._renderer.uniformGroup.updateUniformGroup(e, this._activeProgram, Ar);
  }
  /**
   * Binds a uniform block to the shader.
   * @param uniformGroup - the uniform group to bind
   * @param name - the name of the uniform block
   * @param index - the index of the uniform block
   */
  bindUniformBlock(e, t, r = 0) {
    const i = this._renderer.buffer, n = this._getProgramData(this._activeProgram), a = e._bufferResource;
    a || this._renderer.ubo.updateUniformGroup(e);
    const o = e.buffer, h = i.updateBuffer(o), l = i.freeLocationForBufferBase(h);
    if (a) {
      const { offset: u, size: d } = e;
      u === 0 && d === o.data.byteLength ? i.bindBufferBase(h, l) : i.bindBufferRange(h, l, u);
    } else i.getLastBindBaseLocation(h) !== l && i.bindBufferBase(h, l);
    const c = this._activeProgram._uniformBlockData[t].index;
    n.uniformBlockBindings[r] !== l && (n.uniformBlockBindings[r] = l, this._renderer.gl.uniformBlockBinding(n.program, c, l));
  }
  _setProgram(e) {
    if (this._activeProgram === e)
      return;
    this._activeProgram = e;
    const t = this._getProgramData(e);
    this._gl.useProgram(t.program);
  }
  /**
   * @param program - the program to get the data for
   * @internal
   * @private
   */
  _getProgramData(e) {
    return this._programDataHash[e._key] || this._createProgramData(e);
  }
  _createProgramData(e) {
    const t = e._key;
    return this._programDataHash[t] = Tm(this._gl, e), this._programDataHash[t];
  }
  destroy() {
    for (const e of Object.keys(this._programDataHash))
      this._programDataHash[e].destroy(), this._programDataHash[e] = null;
    this._programDataHash = null;
  }
  /**
   * Creates a function that can be executed that will sync the shader as efficiently as possible.
   * Overridden by the unsafe eval package if you don't want eval used in your project.
   * @param shader - the shader to generate the sync function for
   * @param shaderSystem - the shader system to use
   * @returns - the generated sync function
   * @ignore
   */
  _generateShaderSync(e, t) {
    return pm(e, t);
  }
  resetState() {
    this._activeProgram = null;
  }
}
tl.extension = {
  type: [
    v.WebGLSystem
  ],
  name: "shader"
};
const Sm = {
  f32: `if (cv !== v) {
            cu.value = v;
            gl.uniform1f(location, v);
        }`,
  "vec2<f32>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2f(location, v[0], v[1]);
        }`,
  "vec3<f32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3f(location, v[0], v[1], v[2]);
        }`,
  "vec4<f32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4f(location, v[0], v[1], v[2], v[3]);
        }`,
  i32: `if (cv !== v) {
            cu.value = v;
            gl.uniform1i(location, v);
        }`,
  "vec2<i32>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2i(location, v[0], v[1]);
        }`,
  "vec3<i32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3i(location, v[0], v[1], v[2]);
        }`,
  "vec4<i32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4i(location, v[0], v[1], v[2], v[3]);
        }`,
  u32: `if (cv !== v) {
            cu.value = v;
            gl.uniform1ui(location, v);
        }`,
  "vec2<u32>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2ui(location, v[0], v[1]);
        }`,
  "vec3<u32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3ui(location, v[0], v[1], v[2]);
        }`,
  "vec4<u32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4ui(location, v[0], v[1], v[2], v[3]);
        }`,
  bool: `if (cv !== v) {
            cu.value = v;
            gl.uniform1i(location, v);
        }`,
  "vec2<bool>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2i(location, v[0], v[1]);
        }`,
  "vec3<bool>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3i(location, v[0], v[1], v[2]);
        }`,
  "vec4<bool>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4i(location, v[0], v[1], v[2], v[3]);
        }`,
  "mat2x2<f32>": "gl.uniformMatrix2fv(location, false, v);",
  "mat3x3<f32>": "gl.uniformMatrix3fv(location, false, v);",
  "mat4x4<f32>": "gl.uniformMatrix4fv(location, false, v);"
}, wm = {
  f32: "gl.uniform1fv(location, v);",
  "vec2<f32>": "gl.uniform2fv(location, v);",
  "vec3<f32>": "gl.uniform3fv(location, v);",
  "vec4<f32>": "gl.uniform4fv(location, v);",
  "mat2x2<f32>": "gl.uniformMatrix2fv(location, false, v);",
  "mat3x3<f32>": "gl.uniformMatrix3fv(location, false, v);",
  "mat4x4<f32>": "gl.uniformMatrix4fv(location, false, v);",
  i32: "gl.uniform1iv(location, v);",
  "vec2<i32>": "gl.uniform2iv(location, v);",
  "vec3<i32>": "gl.uniform3iv(location, v);",
  "vec4<i32>": "gl.uniform4iv(location, v);",
  u32: "gl.uniform1iv(location, v);",
  "vec2<u32>": "gl.uniform2iv(location, v);",
  "vec3<u32>": "gl.uniform3iv(location, v);",
  "vec4<u32>": "gl.uniform4iv(location, v);",
  bool: "gl.uniform1iv(location, v);",
  "vec2<bool>": "gl.uniform2iv(location, v);",
  "vec3<bool>": "gl.uniform3iv(location, v);",
  "vec4<bool>": "gl.uniform4iv(location, v);"
};
function Am(s, e) {
  const t = [`
        var v = null;
        var cv = null;
        var cu = null;
        var t = 0;
        var gl = renderer.gl;
        var name = null;
    `];
  for (const r in s.uniforms) {
    if (!e[r]) {
      s.uniforms[r] instanceof be ? s.uniforms[r].ubo ? t.push(`
                        renderer.shader.bindUniformBlock(uv.${r}, "${r}");
                    `) : t.push(`
                        renderer.shader.updateUniformGroup(uv.${r});
                    `) : s.uniforms[r] instanceof Vi && t.push(`
                        renderer.shader.bindBufferResource(uv.${r}, "${r}");
                    `);
      continue;
    }
    const i = s.uniformStructures[r];
    let n = !1;
    for (let a = 0; a < _t.length; a++) {
      const o = _t[a];
      if (i.type === o.type && o.test(i)) {
        t.push(`name = "${r}";`, _t[a].uniform), n = !0;
        break;
      }
    }
    if (!n) {
      const o = (i.size === 1 ? Sm : wm)[i.type].replace("location", `ud["${r}"].location`);
      t.push(`
            cu = ud["${r}"];
            cv = cu.value;
            v = uv["${r}"];
            ${o};`);
    }
  }
  return new Function("ud", "uv", "renderer", "syncData", t.join(`
`));
}
class rl {
  /** @param renderer - The renderer this System works for. */
  constructor(e) {
    this._cache = {}, this._uniformGroupSyncHash = {}, this._renderer = e, this.gl = null, this._cache = {};
  }
  contextChange(e) {
    this.gl = e;
  }
  /**
   * Uploads the uniforms values to the currently bound shader.
   * @param group - the uniforms values that be applied to the current shader
   * @param program
   * @param syncData
   * @param syncData.textureCount
   */
  updateUniformGroup(e, t, r) {
    const i = this._renderer.shader._getProgramData(t);
    (!e.isStatic || e._dirtyId !== i.uniformDirtyGroups[e.uid]) && (i.uniformDirtyGroups[e.uid] = e._dirtyId, this._getUniformSyncFunction(e, t)(i.uniformData, e.uniforms, this._renderer, r));
  }
  /**
   * Overridable by the pixi.js/unsafe-eval package to use static syncUniforms instead.
   * @param group
   * @param program
   */
  _getUniformSyncFunction(e, t) {
    var r;
    return ((r = this._uniformGroupSyncHash[e._signature]) == null ? void 0 : r[t._key]) || this._createUniformSyncFunction(e, t);
  }
  _createUniformSyncFunction(e, t) {
    const r = this._uniformGroupSyncHash[e._signature] || (this._uniformGroupSyncHash[e._signature] = {}), i = this._getSignature(e, t._uniformData, "u");
    return this._cache[i] || (this._cache[i] = this._generateUniformsSync(e, t._uniformData)), r[t._key] = this._cache[i], r[t._key];
  }
  _generateUniformsSync(e, t) {
    return Am(e, t);
  }
  /**
   * Takes a uniform group and data and generates a unique signature for them.
   * @param group - The uniform group to get signature of
   * @param group.uniforms
   * @param uniformData - Uniform information generated by the shader
   * @param preFix
   * @returns Unique signature of the uniform group
   */
  _getSignature(e, t, r) {
    const i = e.uniforms, n = [`${r}-`];
    for (const a in i)
      n.push(a), t[a] && n.push(t[a].type);
    return n.join("-");
  }
  /** Destroys this System and removes all its textures. */
  destroy() {
    this._renderer = null, this._cache = null;
  }
}
rl.extension = {
  type: [
    v.WebGLSystem
  ],
  name: "uniformGroup"
};
function Pm(s) {
  const e = {};
  if (e.normal = [s.ONE, s.ONE_MINUS_SRC_ALPHA], e.add = [s.ONE, s.ONE], e.multiply = [s.DST_COLOR, s.ONE_MINUS_SRC_ALPHA, s.ONE, s.ONE_MINUS_SRC_ALPHA], e.screen = [s.ONE, s.ONE_MINUS_SRC_COLOR, s.ONE, s.ONE_MINUS_SRC_ALPHA], e.none = [0, 0], e["normal-npm"] = [s.SRC_ALPHA, s.ONE_MINUS_SRC_ALPHA, s.ONE, s.ONE_MINUS_SRC_ALPHA], e["add-npm"] = [s.SRC_ALPHA, s.ONE, s.ONE, s.ONE], e["screen-npm"] = [s.SRC_ALPHA, s.ONE_MINUS_SRC_COLOR, s.ONE, s.ONE_MINUS_SRC_ALPHA], e.erase = [s.ZERO, s.ONE_MINUS_SRC_ALPHA], !(s instanceof Z.get().getWebGLRenderingContext()))
    e.min = [s.ONE, s.ONE, s.ONE, s.ONE, s.MIN, s.MIN], e.max = [s.ONE, s.ONE, s.ONE, s.ONE, s.MAX, s.MAX];
  else {
    const r = s.getExtension("EXT_blend_minmax");
    r && (e.min = [s.ONE, s.ONE, s.ONE, s.ONE, r.MIN_EXT, r.MIN_EXT], e.max = [s.ONE, s.ONE, s.ONE, s.ONE, r.MAX_EXT, r.MAX_EXT]);
  }
  return e;
}
const Cm = 0, Em = 1, Mm = 2, Bm = 3, Rm = 4, km = 5, sl = class oi {
  constructor() {
    this.gl = null, this.stateId = 0, this.polygonOffset = 0, this.blendMode = "none", this._blendEq = !1, this.map = [], this.map[Cm] = this.setBlend, this.map[Em] = this.setOffset, this.map[Mm] = this.setCullFace, this.map[Bm] = this.setDepthTest, this.map[Rm] = this.setFrontFace, this.map[km] = this.setDepthMask, this.checks = [], this.defaultState = ke.for2d();
  }
  contextChange(e) {
    this.gl = e, this.blendModesMap = Pm(e), this.resetState();
  }
  /**
   * Sets the current state
   * @param {*} state - The state to set.
   */
  set(e) {
    if (e || (e = this.defaultState), this.stateId !== e.data) {
      let t = this.stateId ^ e.data, r = 0;
      for (; t; )
        t & 1 && this.map[r].call(this, !!(e.data & 1 << r)), t >>= 1, r++;
      this.stateId = e.data;
    }
    for (let t = 0; t < this.checks.length; t++)
      this.checks[t](this, e);
  }
  /**
   * Sets the state, when previous state is unknown.
   * @param {*} state - The state to set
   */
  forceState(e) {
    e || (e = this.defaultState);
    for (let t = 0; t < this.map.length; t++)
      this.map[t].call(this, !!(e.data & 1 << t));
    for (let t = 0; t < this.checks.length; t++)
      this.checks[t](this, e);
    this.stateId = e.data;
  }
  /**
   * Sets whether to enable or disable blending.
   * @param value - Turn on or off WebGl blending.
   */
  setBlend(e) {
    this._updateCheck(oi._checkBlendMode, e), this.gl[e ? "enable" : "disable"](this.gl.BLEND);
  }
  /**
   * Sets whether to enable or disable polygon offset fill.
   * @param value - Turn on or off webgl polygon offset testing.
   */
  setOffset(e) {
    this._updateCheck(oi._checkPolygonOffset, e), this.gl[e ? "enable" : "disable"](this.gl.POLYGON_OFFSET_FILL);
  }
  /**
   * Sets whether to enable or disable depth test.
   * @param value - Turn on or off webgl depth testing.
   */
  setDepthTest(e) {
    this.gl[e ? "enable" : "disable"](this.gl.DEPTH_TEST);
  }
  /**
   * Sets whether to enable or disable depth mask.
   * @param value - Turn on or off webgl depth mask.
   */
  setDepthMask(e) {
    this.gl.depthMask(e);
  }
  /**
   * Sets whether to enable or disable cull face.
   * @param {boolean} value - Turn on or off webgl cull face.
   */
  setCullFace(e) {
    this.gl[e ? "enable" : "disable"](this.gl.CULL_FACE);
  }
  /**
   * Sets the gl front face.
   * @param {boolean} value - true is clockwise and false is counter-clockwise
   */
  setFrontFace(e) {
    this.gl.frontFace(this.gl[e ? "CW" : "CCW"]);
  }
  /**
   * Sets the blend mode.
   * @param {number} value - The blend mode to set to.
   */
  setBlendMode(e) {
    if (this.blendModesMap[e] || (e = "normal"), e === this.blendMode)
      return;
    this.blendMode = e;
    const t = this.blendModesMap[e], r = this.gl;
    t.length === 2 ? r.blendFunc(t[0], t[1]) : r.blendFuncSeparate(t[0], t[1], t[2], t[3]), t.length === 6 ? (this._blendEq = !0, r.blendEquationSeparate(t[4], t[5])) : this._blendEq && (this._blendEq = !1, r.blendEquationSeparate(r.FUNC_ADD, r.FUNC_ADD));
  }
  /**
   * Sets the polygon offset.
   * @param {number} value - the polygon offset
   * @param {number} scale - the polygon offset scale
   */
  setPolygonOffset(e, t) {
    this.gl.polygonOffset(e, t);
  }
  // used
  /** Resets all the logic and disables the VAOs. */
  resetState() {
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, !1), this.forceState(this.defaultState), this._blendEq = !0, this.blendMode = "", this.setBlendMode("normal");
  }
  /**
   * Checks to see which updates should be checked based on which settings have been activated.
   *
   * For example, if blend is enabled then we should check the blend modes each time the state is changed
   * or if polygon fill is activated then we need to check if the polygon offset changes.
   * The idea is that we only check what we have too.
   * @param func - the checking function to add or remove
   * @param value - should the check function be added or removed.
   */
  _updateCheck(e, t) {
    const r = this.checks.indexOf(e);
    t && r === -1 ? this.checks.push(e) : !t && r !== -1 && this.checks.splice(r, 1);
  }
  /**
   * A private little wrapper function that we call to check the blend mode.
   * @param system - the System to perform the state check on
   * @param state - the state that the blendMode will pulled from
   */
  static _checkBlendMode(e, t) {
    e.setBlendMode(t.blendMode);
  }
  /**
   * A private little wrapper function that we call to check the polygon offset.
   * @param system - the System to perform the state check on
   * @param state - the state that the blendMode will pulled from
   */
  static _checkPolygonOffset(e, t) {
    e.setPolygonOffset(1, t.polygonOffset);
  }
  /**
   * @ignore
   */
  destroy() {
    this.gl = null, this.checks.length = 0;
  }
};
sl.extension = {
  type: [
    v.WebGLSystem
  ],
  name: "state"
};
let Im = sl;
class Gm {
  constructor(e) {
    this.target = Dh.TEXTURE_2D, this.texture = e, this.width = -1, this.height = -1, this.type = ee.UNSIGNED_BYTE, this.internalFormat = ni.RGBA, this.format = ni.RGBA, this.samplerType = 0;
  }
}
const Um = {
  id: "buffer",
  upload(s, e, t) {
    e.width === s.width || e.height === s.height ? t.texSubImage2D(
      t.TEXTURE_2D,
      0,
      0,
      0,
      s.width,
      s.height,
      e.format,
      e.type,
      s.resource
    ) : t.texImage2D(
      e.target,
      0,
      e.internalFormat,
      s.width,
      s.height,
      0,
      e.format,
      e.type,
      s.resource
    ), e.width = s.width, e.height = s.height;
  }
}, Fm = {
  "bc1-rgba-unorm": !0,
  "bc1-rgba-unorm-srgb": !0,
  "bc2-rgba-unorm": !0,
  "bc2-rgba-unorm-srgb": !0,
  "bc3-rgba-unorm": !0,
  "bc3-rgba-unorm-srgb": !0,
  "bc4-r-unorm": !0,
  "bc4-r-snorm": !0,
  "bc5-rg-unorm": !0,
  "bc5-rg-snorm": !0,
  "bc6h-rgb-ufloat": !0,
  "bc6h-rgb-float": !0,
  "bc7-rgba-unorm": !0,
  "bc7-rgba-unorm-srgb": !0,
  // ETC2 compressed formats usable if "texture-compression-etc2" is both
  // supported by the device/user agent and enabled in requestDevice.
  "etc2-rgb8unorm": !0,
  "etc2-rgb8unorm-srgb": !0,
  "etc2-rgb8a1unorm": !0,
  "etc2-rgb8a1unorm-srgb": !0,
  "etc2-rgba8unorm": !0,
  "etc2-rgba8unorm-srgb": !0,
  "eac-r11unorm": !0,
  "eac-r11snorm": !0,
  "eac-rg11unorm": !0,
  "eac-rg11snorm": !0,
  // ASTC compressed formats usable if "texture-compression-astc" is both
  // supported by the device/user agent and enabled in requestDevice.
  "astc-4x4-unorm": !0,
  "astc-4x4-unorm-srgb": !0,
  "astc-5x4-unorm": !0,
  "astc-5x4-unorm-srgb": !0,
  "astc-5x5-unorm": !0,
  "astc-5x5-unorm-srgb": !0,
  "astc-6x5-unorm": !0,
  "astc-6x5-unorm-srgb": !0,
  "astc-6x6-unorm": !0,
  "astc-6x6-unorm-srgb": !0,
  "astc-8x5-unorm": !0,
  "astc-8x5-unorm-srgb": !0,
  "astc-8x6-unorm": !0,
  "astc-8x6-unorm-srgb": !0,
  "astc-8x8-unorm": !0,
  "astc-8x8-unorm-srgb": !0,
  "astc-10x5-unorm": !0,
  "astc-10x5-unorm-srgb": !0,
  "astc-10x6-unorm": !0,
  "astc-10x6-unorm-srgb": !0,
  "astc-10x8-unorm": !0,
  "astc-10x8-unorm-srgb": !0,
  "astc-10x10-unorm": !0,
  "astc-10x10-unorm-srgb": !0,
  "astc-12x10-unorm": !0,
  "astc-12x10-unorm-srgb": !0,
  "astc-12x12-unorm": !0,
  "astc-12x12-unorm-srgb": !0
}, Dm = {
  id: "compressed",
  upload(s, e, t) {
    t.pixelStorei(t.UNPACK_ALIGNMENT, 4);
    let r = s.pixelWidth, i = s.pixelHeight;
    const n = !!Fm[s.format];
    for (let a = 0; a < s.resource.length; a++) {
      const o = s.resource[a];
      n ? t.compressedTexImage2D(
        t.TEXTURE_2D,
        a,
        e.internalFormat,
        r,
        i,
        0,
        o
      ) : t.texImage2D(
        t.TEXTURE_2D,
        a,
        e.internalFormat,
        r,
        i,
        0,
        e.format,
        e.type,
        o
      ), r = Math.max(r >> 1, 1), i = Math.max(i >> 1, 1);
    }
  }
}, il = {
  id: "image",
  upload(s, e, t, r) {
    const i = e.width, n = e.height, a = s.pixelWidth, o = s.pixelHeight, h = s.resourceWidth, l = s.resourceHeight;
    h < a || l < o ? ((i !== a || n !== o) && t.texImage2D(
      e.target,
      0,
      e.internalFormat,
      a,
      o,
      0,
      e.format,
      e.type,
      null
    ), r === 2 ? t.texSubImage2D(
      t.TEXTURE_2D,
      0,
      0,
      0,
      h,
      l,
      e.format,
      e.type,
      s.resource
    ) : t.texSubImage2D(
      t.TEXTURE_2D,
      0,
      0,
      0,
      e.format,
      e.type,
      s.resource
    )) : i === a && n === o ? t.texSubImage2D(
      t.TEXTURE_2D,
      0,
      0,
      0,
      e.format,
      e.type,
      s.resource
    ) : r === 2 ? t.texImage2D(
      e.target,
      0,
      e.internalFormat,
      a,
      o,
      0,
      e.format,
      e.type,
      s.resource
    ) : t.texImage2D(
      e.target,
      0,
      e.internalFormat,
      e.format,
      e.type,
      s.resource
    ), e.width = a, e.height = o;
  }
}, Om = {
  id: "video",
  upload(s, e, t, r) {
    if (!s.isValid) {
      t.texImage2D(
        e.target,
        0,
        e.internalFormat,
        1,
        1,
        0,
        e.format,
        e.type,
        null
      );
      return;
    }
    il.upload(s, e, t, r);
  }
}, Ga = {
  linear: 9729,
  nearest: 9728
}, Lm = {
  linear: {
    linear: 9987,
    nearest: 9985
  },
  nearest: {
    linear: 9986,
    nearest: 9984
  }
}, Bs = {
  "clamp-to-edge": 33071,
  repeat: 10497,
  "mirror-repeat": 33648
}, Nm = {
  never: 512,
  less: 513,
  equal: 514,
  "less-equal": 515,
  greater: 516,
  "not-equal": 517,
  "greater-equal": 518,
  always: 519
};
function Ua(s, e, t, r, i, n, a, o) {
  const h = n;
  if (!o || s.addressModeU !== "repeat" || s.addressModeV !== "repeat" || s.addressModeW !== "repeat") {
    const l = Bs[a ? "clamp-to-edge" : s.addressModeU], c = Bs[a ? "clamp-to-edge" : s.addressModeV], u = Bs[a ? "clamp-to-edge" : s.addressModeW];
    e[i](h, e.TEXTURE_WRAP_S, l), e[i](h, e.TEXTURE_WRAP_T, c), e.TEXTURE_WRAP_R && e[i](h, e.TEXTURE_WRAP_R, u);
  }
  if ((!o || s.magFilter !== "linear") && e[i](h, e.TEXTURE_MAG_FILTER, Ga[s.magFilter]), t) {
    if (!o || s.mipmapFilter !== "linear") {
      const l = Lm[s.minFilter][s.mipmapFilter];
      e[i](h, e.TEXTURE_MIN_FILTER, l);
    }
  } else
    e[i](h, e.TEXTURE_MIN_FILTER, Ga[s.minFilter]);
  if (r && s.maxAnisotropy > 1) {
    const l = Math.min(s.maxAnisotropy, e.getParameter(r.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
    e[i](h, r.TEXTURE_MAX_ANISOTROPY_EXT, l);
  }
  s.compare && e[i](h, e.TEXTURE_COMPARE_FUNC, Nm[s.compare]);
}
function Hm(s) {
  return {
    // 8-bit formats
    r8unorm: s.RED,
    r8snorm: s.RED,
    r8uint: s.RED,
    r8sint: s.RED,
    // 16-bit formats
    r16uint: s.RED,
    r16sint: s.RED,
    r16float: s.RED,
    rg8unorm: s.RG,
    rg8snorm: s.RG,
    rg8uint: s.RG,
    rg8sint: s.RG,
    // 32-bit formats
    r32uint: s.RED,
    r32sint: s.RED,
    r32float: s.RED,
    rg16uint: s.RG,
    rg16sint: s.RG,
    rg16float: s.RG,
    rgba8unorm: s.RGBA,
    "rgba8unorm-srgb": s.RGBA,
    // Packed 32-bit formats
    rgba8snorm: s.RGBA,
    rgba8uint: s.RGBA,
    rgba8sint: s.RGBA,
    bgra8unorm: s.RGBA,
    "bgra8unorm-srgb": s.RGBA,
    rgb9e5ufloat: s.RGB,
    rgb10a2unorm: s.RGBA,
    rg11b10ufloat: s.RGB,
    // 64-bit formats
    rg32uint: s.RG,
    rg32sint: s.RG,
    rg32float: s.RG,
    rgba16uint: s.RGBA,
    rgba16sint: s.RGBA,
    rgba16float: s.RGBA,
    // 128-bit formats
    rgba32uint: s.RGBA,
    rgba32sint: s.RGBA,
    rgba32float: s.RGBA,
    // Depth/stencil formats
    stencil8: s.STENCIL_INDEX8,
    depth16unorm: s.DEPTH_COMPONENT,
    depth24plus: s.DEPTH_COMPONENT,
    "depth24plus-stencil8": s.DEPTH_STENCIL,
    depth32float: s.DEPTH_COMPONENT,
    "depth32float-stencil8": s.DEPTH_STENCIL
  };
}
function Wm(s, e) {
  let t = {}, r = s.RGBA;
  return s instanceof Z.get().getWebGLRenderingContext() ? e.srgb && (t = {
    "rgba8unorm-srgb": e.srgb.SRGB8_ALPHA8_EXT,
    "bgra8unorm-srgb": e.srgb.SRGB8_ALPHA8_EXT
  }) : (t = {
    "rgba8unorm-srgb": s.SRGB8_ALPHA8,
    "bgra8unorm-srgb": s.SRGB8_ALPHA8
  }, r = s.RGBA8), {
    // 8-bit formats
    r8unorm: s.R8,
    r8snorm: s.R8_SNORM,
    r8uint: s.R8UI,
    r8sint: s.R8I,
    // 16-bit formats
    r16uint: s.R16UI,
    r16sint: s.R16I,
    r16float: s.R16F,
    rg8unorm: s.RG8,
    rg8snorm: s.RG8_SNORM,
    rg8uint: s.RG8UI,
    rg8sint: s.RG8I,
    // 32-bit formats
    r32uint: s.R32UI,
    r32sint: s.R32I,
    r32float: s.R32F,
    rg16uint: s.RG16UI,
    rg16sint: s.RG16I,
    rg16float: s.RG16F,
    rgba8unorm: s.RGBA,
    ...t,
    // Packed 32-bit formats
    rgba8snorm: s.RGBA8_SNORM,
    rgba8uint: s.RGBA8UI,
    rgba8sint: s.RGBA8I,
    bgra8unorm: r,
    rgb9e5ufloat: s.RGB9_E5,
    rgb10a2unorm: s.RGB10_A2,
    rg11b10ufloat: s.R11F_G11F_B10F,
    // 64-bit formats
    rg32uint: s.RG32UI,
    rg32sint: s.RG32I,
    rg32float: s.RG32F,
    rgba16uint: s.RGBA16UI,
    rgba16sint: s.RGBA16I,
    rgba16float: s.RGBA16F,
    // 128-bit formats
    rgba32uint: s.RGBA32UI,
    rgba32sint: s.RGBA32I,
    rgba32float: s.RGBA32F,
    // Depth/stencil formats
    stencil8: s.STENCIL_INDEX8,
    depth16unorm: s.DEPTH_COMPONENT16,
    depth24plus: s.DEPTH_COMPONENT24,
    "depth24plus-stencil8": s.DEPTH24_STENCIL8,
    depth32float: s.DEPTH_COMPONENT32F,
    "depth32float-stencil8": s.DEPTH32F_STENCIL8,
    // Compressed formats
    ...e.s3tc ? {
      "bc1-rgba-unorm": e.s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT,
      "bc2-rgba-unorm": e.s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT,
      "bc3-rgba-unorm": e.s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT
    } : {},
    ...e.s3tc_sRGB ? {
      "bc1-rgba-unorm-srgb": e.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
      "bc2-rgba-unorm-srgb": e.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
      "bc3-rgba-unorm-srgb": e.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT
    } : {},
    ...e.rgtc ? {
      "bc4-r-unorm": e.rgtc.COMPRESSED_RED_RGTC1_EXT,
      "bc4-r-snorm": e.rgtc.COMPRESSED_SIGNED_RED_RGTC1_EXT,
      "bc5-rg-unorm": e.rgtc.COMPRESSED_RED_GREEN_RGTC2_EXT,
      "bc5-rg-snorm": e.rgtc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT
    } : {},
    ...e.bptc ? {
      "bc6h-rgb-float": e.bptc.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,
      "bc6h-rgb-ufloat": e.bptc.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,
      "bc7-rgba-unorm": e.bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT,
      "bc7-rgba-unorm-srgb": e.bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT
    } : {},
    ...e.etc ? {
      "etc2-rgb8unorm": e.etc.COMPRESSED_RGB8_ETC2,
      "etc2-rgb8unorm-srgb": e.etc.COMPRESSED_SRGB8_ETC2,
      "etc2-rgb8a1unorm": e.etc.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
      "etc2-rgb8a1unorm-srgb": e.etc.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
      "etc2-rgba8unorm": e.etc.COMPRESSED_RGBA8_ETC2_EAC,
      "etc2-rgba8unorm-srgb": e.etc.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
      "eac-r11unorm": e.etc.COMPRESSED_R11_EAC,
      // 'eac-r11snorm'
      "eac-rg11unorm": e.etc.COMPRESSED_SIGNED_RG11_EAC
      // 'eac-rg11snorm'
    } : {},
    ...e.astc ? {
      "astc-4x4-unorm": e.astc.COMPRESSED_RGBA_ASTC_4x4_KHR,
      "astc-4x4-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
      "astc-5x4-unorm": e.astc.COMPRESSED_RGBA_ASTC_5x4_KHR,
      "astc-5x4-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,
      "astc-5x5-unorm": e.astc.COMPRESSED_RGBA_ASTC_5x5_KHR,
      "astc-5x5-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
      "astc-6x5-unorm": e.astc.COMPRESSED_RGBA_ASTC_6x5_KHR,
      "astc-6x5-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
      "astc-6x6-unorm": e.astc.COMPRESSED_RGBA_ASTC_6x6_KHR,
      "astc-6x6-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
      "astc-8x5-unorm": e.astc.COMPRESSED_RGBA_ASTC_8x5_KHR,
      "astc-8x5-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
      "astc-8x6-unorm": e.astc.COMPRESSED_RGBA_ASTC_8x6_KHR,
      "astc-8x6-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
      "astc-8x8-unorm": e.astc.COMPRESSED_RGBA_ASTC_8x8_KHR,
      "astc-8x8-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
      "astc-10x5-unorm": e.astc.COMPRESSED_RGBA_ASTC_10x5_KHR,
      "astc-10x5-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
      "astc-10x6-unorm": e.astc.COMPRESSED_RGBA_ASTC_10x6_KHR,
      "astc-10x6-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
      "astc-10x8-unorm": e.astc.COMPRESSED_RGBA_ASTC_10x8_KHR,
      "astc-10x8-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,
      "astc-10x10-unorm": e.astc.COMPRESSED_RGBA_ASTC_10x10_KHR,
      "astc-10x10-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
      "astc-12x10-unorm": e.astc.COMPRESSED_RGBA_ASTC_12x10_KHR,
      "astc-12x10-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
      "astc-12x12-unorm": e.astc.COMPRESSED_RGBA_ASTC_12x12_KHR,
      "astc-12x12-unorm-srgb": e.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR
    } : {}
  };
}
function zm(s) {
  return {
    // 8-bit formats
    r8unorm: s.UNSIGNED_BYTE,
    r8snorm: s.BYTE,
    r8uint: s.UNSIGNED_BYTE,
    r8sint: s.BYTE,
    // 16-bit formats
    r16uint: s.UNSIGNED_SHORT,
    r16sint: s.SHORT,
    r16float: s.HALF_FLOAT,
    rg8unorm: s.UNSIGNED_BYTE,
    rg8snorm: s.BYTE,
    rg8uint: s.UNSIGNED_BYTE,
    rg8sint: s.BYTE,
    // 32-bit formats
    r32uint: s.UNSIGNED_INT,
    r32sint: s.INT,
    r32float: s.FLOAT,
    rg16uint: s.UNSIGNED_SHORT,
    rg16sint: s.SHORT,
    rg16float: s.HALF_FLOAT,
    rgba8unorm: s.UNSIGNED_BYTE,
    "rgba8unorm-srgb": s.UNSIGNED_BYTE,
    // Packed 32-bit formats
    rgba8snorm: s.BYTE,
    rgba8uint: s.UNSIGNED_BYTE,
    rgba8sint: s.BYTE,
    bgra8unorm: s.UNSIGNED_BYTE,
    "bgra8unorm-srgb": s.UNSIGNED_BYTE,
    rgb9e5ufloat: s.UNSIGNED_INT_5_9_9_9_REV,
    rgb10a2unorm: s.UNSIGNED_INT_2_10_10_10_REV,
    rg11b10ufloat: s.UNSIGNED_INT_10F_11F_11F_REV,
    // 64-bit formats
    rg32uint: s.UNSIGNED_INT,
    rg32sint: s.INT,
    rg32float: s.FLOAT,
    rgba16uint: s.UNSIGNED_SHORT,
    rgba16sint: s.SHORT,
    rgba16float: s.HALF_FLOAT,
    // 128-bit formats
    rgba32uint: s.UNSIGNED_INT,
    rgba32sint: s.INT,
    rgba32float: s.FLOAT,
    // Depth/stencil formats
    stencil8: s.UNSIGNED_BYTE,
    depth16unorm: s.UNSIGNED_SHORT,
    depth24plus: s.UNSIGNED_INT,
    "depth24plus-stencil8": s.UNSIGNED_INT_24_8,
    depth32float: s.FLOAT,
    "depth32float-stencil8": s.FLOAT_32_UNSIGNED_INT_24_8_REV
  };
}
const Vm = 4;
class nl {
  constructor(e) {
    this.managedTextures = [], this._glTextures = /* @__PURE__ */ Object.create(null), this._glSamplers = /* @__PURE__ */ Object.create(null), this._boundTextures = [], this._activeTextureLocation = -1, this._boundSamplers = /* @__PURE__ */ Object.create(null), this._uploads = {
      image: il,
      buffer: Um,
      video: Om,
      compressed: Dm
    }, this._premultiplyAlpha = !1, this._useSeparateSamplers = !1, this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_glTextures"), this._renderer.renderableGC.addManagedHash(this, "_glSamplers");
  }
  contextChange(e) {
    this._gl = e, this._mapFormatToInternalFormat || (this._mapFormatToInternalFormat = Wm(e, this._renderer.context.extensions), this._mapFormatToType = zm(e), this._mapFormatToFormat = Hm(e)), this._glTextures = /* @__PURE__ */ Object.create(null), this._glSamplers = /* @__PURE__ */ Object.create(null), this._boundSamplers = /* @__PURE__ */ Object.create(null), this._premultiplyAlpha = !1;
    for (let t = 0; t < 16; t++)
      this.bind(D.EMPTY, t);
  }
  initSource(e) {
    this.bind(e);
  }
  bind(e, t = 0) {
    const r = e.source;
    e ? (this.bindSource(r, t), this._useSeparateSamplers && this._bindSampler(r.style, t)) : (this.bindSource(null, t), this._useSeparateSamplers && this._bindSampler(null, t));
  }
  bindSource(e, t = 0) {
    const r = this._gl;
    if (e._touched = this._renderer.textureGC.count, this._boundTextures[t] !== e) {
      this._boundTextures[t] = e, this._activateLocation(t), e || (e = D.EMPTY.source);
      const i = this.getGlSource(e);
      r.bindTexture(i.target, i.texture);
    }
  }
  _bindSampler(e, t = 0) {
    const r = this._gl;
    if (!e) {
      this._boundSamplers[t] = null, r.bindSampler(t, null);
      return;
    }
    const i = this._getGlSampler(e);
    this._boundSamplers[t] !== i && (this._boundSamplers[t] = i, r.bindSampler(t, i));
  }
  unbind(e) {
    const t = e.source, r = this._boundTextures, i = this._gl;
    for (let n = 0; n < r.length; n++)
      if (r[n] === t) {
        this._activateLocation(n);
        const a = this.getGlSource(t);
        i.bindTexture(a.target, null), r[n] = null;
      }
  }
  _activateLocation(e) {
    this._activeTextureLocation !== e && (this._activeTextureLocation = e, this._gl.activeTexture(this._gl.TEXTURE0 + e));
  }
  _initSource(e) {
    const t = this._gl, r = new Gm(t.createTexture());
    if (r.type = this._mapFormatToType[e.format], r.internalFormat = this._mapFormatToInternalFormat[e.format], r.format = this._mapFormatToFormat[e.format], e.autoGenerateMipmaps && (this._renderer.context.supports.nonPowOf2mipmaps || e.isPowerOfTwo)) {
      const i = Math.max(e.width, e.height);
      e.mipLevelCount = Math.floor(Math.log2(i)) + 1;
    }
    return this._glTextures[e.uid] = r, this.managedTextures.includes(e) || (e.on("update", this.onSourceUpdate, this), e.on("resize", this.onSourceUpdate, this), e.on("styleChange", this.onStyleChange, this), e.on("destroy", this.onSourceDestroy, this), e.on("unload", this.onSourceUnload, this), e.on("updateMipmaps", this.onUpdateMipmaps, this), this.managedTextures.push(e)), this.onSourceUpdate(e), this.updateStyle(e, !1), r;
  }
  onStyleChange(e) {
    this.updateStyle(e, !1);
  }
  updateStyle(e, t) {
    const r = this._gl, i = this.getGlSource(e);
    r.bindTexture(r.TEXTURE_2D, i.texture), this._boundTextures[this._activeTextureLocation] = e, Ua(
      e.style,
      r,
      e.mipLevelCount > 1,
      this._renderer.context.extensions.anisotropicFiltering,
      "texParameteri",
      r.TEXTURE_2D,
      // will force a clamp to edge if the texture is not a power of two
      !this._renderer.context.supports.nonPowOf2wrapping && !e.isPowerOfTwo,
      t
    );
  }
  onSourceUnload(e) {
    const t = this._glTextures[e.uid];
    t && (this.unbind(e), this._glTextures[e.uid] = null, this._gl.deleteTexture(t.texture));
  }
  onSourceUpdate(e) {
    const t = this._gl, r = this.getGlSource(e);
    t.bindTexture(t.TEXTURE_2D, r.texture), this._boundTextures[this._activeTextureLocation] = e;
    const i = e.alphaMode === "premultiply-alpha-on-upload";
    this._premultiplyAlpha !== i && (this._premultiplyAlpha = i, t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL, i)), this._uploads[e.uploadMethodId] ? this._uploads[e.uploadMethodId].upload(e, r, t, this._renderer.context.webGLVersion) : t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, e.pixelWidth, e.pixelHeight, 0, t.RGBA, t.UNSIGNED_BYTE, null), e.autoGenerateMipmaps && e.mipLevelCount > 1 && this.onUpdateMipmaps(e, !1);
  }
  onUpdateMipmaps(e, t = !0) {
    t && this.bindSource(e, 0);
    const r = this.getGlSource(e);
    this._gl.generateMipmap(r.target);
  }
  onSourceDestroy(e) {
    e.off("destroy", this.onSourceDestroy, this), e.off("update", this.onSourceUpdate, this), e.off("resize", this.onSourceUpdate, this), e.off("unload", this.onSourceUnload, this), e.off("styleChange", this.onStyleChange, this), e.off("updateMipmaps", this.onUpdateMipmaps, this), this.managedTextures.splice(this.managedTextures.indexOf(e), 1), this.onSourceUnload(e);
  }
  _initSampler(e) {
    const t = this._gl, r = this._gl.createSampler();
    return this._glSamplers[e._resourceId] = r, Ua(
      e,
      t,
      this._boundTextures[this._activeTextureLocation].mipLevelCount > 1,
      this._renderer.context.extensions.anisotropicFiltering,
      "samplerParameteri",
      r,
      !1,
      !0
    ), this._glSamplers[e._resourceId];
  }
  _getGlSampler(e) {
    return this._glSamplers[e._resourceId] || this._initSampler(e);
  }
  getGlSource(e) {
    return this._glTextures[e.uid] || this._initSource(e);
  }
  generateCanvas(e) {
    const { pixels: t, width: r, height: i } = this.getPixels(e), n = Z.get().createCanvas();
    n.width = r, n.height = i;
    const a = n.getContext("2d");
    if (a) {
      const o = a.createImageData(r, i);
      o.data.set(t), a.putImageData(o, 0, 0);
    }
    return n;
  }
  getPixels(e) {
    const t = e.source.resolution, r = e.frame, i = Math.max(Math.round(r.width * t), 1), n = Math.max(Math.round(r.height * t), 1), a = new Uint8Array(Vm * i * n), o = this._renderer, h = o.renderTarget.getRenderTarget(e), l = o.renderTarget.getGpuRenderTarget(h), c = o.gl;
    return c.bindFramebuffer(c.FRAMEBUFFER, l.resolveTargetFramebuffer), c.readPixels(
      Math.round(r.x * t),
      Math.round(r.y * t),
      i,
      n,
      c.RGBA,
      c.UNSIGNED_BYTE,
      a
    ), { pixels: new Uint8ClampedArray(a.buffer), width: i, height: n };
  }
  destroy() {
    this.managedTextures.slice().forEach((e) => this.onSourceDestroy(e)), this.managedTextures = null, this._renderer = null;
  }
  resetState() {
    this._activeTextureLocation = -1, this._boundTextures.fill(D.EMPTY.source), this._boundSamplers = /* @__PURE__ */ Object.create(null);
  }
}
nl.extension = {
  type: [
    v.WebGLSystem
  ],
  name: "texture"
};
class al {
  init() {
    const e = new be({
      uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
      uTransformMatrix: { value: new L(), type: "mat3x3<f32>" },
      uRound: { value: 0, type: "f32" }
    }), t = It(), r = nr({
      name: "graphics",
      bits: [
        Ai,
        Ci(t),
        Hi,
        or
      ]
    });
    this.shader = new Ie({
      glProgram: r,
      resources: {
        localUniforms: e,
        batchSamplers: Ei(t)
      }
    });
  }
  execute(e, t) {
    const r = t.context, i = r.customShader || this.shader, n = e.renderer, a = n.graphicsContext, {
      batcher: o,
      instructions: h
    } = a.getContextRenderData(r);
    i.groups[0] = n.globalUniforms.bindGroup, n.state.set(e.state), n.shader.bind(i), n.geometry.bind(o.geometry, i.glProgram);
    const l = h.instructions;
    for (let c = 0; c < h.instructionSize; c++) {
      const u = l[c];
      if (u.size) {
        for (let d = 0; d < u.textures.count; d++)
          n.texture.bind(u.textures.textures[d], d);
        n.geometry.draw(u.topology, u.size, u.start);
      }
    }
  }
  destroy() {
    this.shader.destroy(!0), this.shader = null;
  }
}
al.extension = {
  type: [
    v.WebGLPipesAdaptor
  ],
  name: "graphics"
};
class ol {
  init() {
    const e = nr({
      name: "mesh",
      bits: [
        Hi,
        qp,
        or
      ]
    });
    this._shader = new Ie({
      glProgram: e,
      resources: {
        uTexture: D.EMPTY.source,
        textureUniforms: {
          uTextureMatrix: { type: "mat3x3<f32>", value: new L() }
        }
      }
    });
  }
  execute(e, t) {
    const r = e.renderer;
    let i = t._shader;
    if (i) {
      if (!i.glProgram) {
        V("Mesh shader has no glProgram", t.shader);
        return;
      }
    } else {
      i = this._shader;
      const n = t.texture, a = n.source;
      i.resources.uTexture = a, i.resources.uSampler = a.style, i.resources.textureUniforms.uniforms.uTextureMatrix = n.textureMatrix.mapCoord;
    }
    i.groups[100] = r.globalUniforms.bindGroup, i.groups[101] = e.localUniformsBindGroup, r.encoder.draw({
      geometry: t._geometry,
      shader: i,
      state: t.state
    });
  }
  destroy() {
    this._shader.destroy(!0), this._shader = null;
  }
}
ol.extension = {
  type: [
    v.WebGLPipesAdaptor
  ],
  name: "mesh"
};
class hl {
  constructor(e) {
    this._renderer = e;
  }
  updateRenderable() {
  }
  destroyRenderable() {
  }
  validateRenderable() {
    return !1;
  }
  addRenderable(e, t) {
    this._renderer.renderPipes.batch.break(t), t.add(e);
  }
  execute(e) {
    e.isRenderable && e.render(this._renderer);
  }
  destroy() {
    this._renderer = null;
  }
}
hl.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "customRender"
};
class jr {
  constructor() {
    this.batcherName = "default", this.topology = "triangle-list", this.attributeSize = 4, this.indexSize = 6, this.packAsQuad = !0, this.roundPixels = 0, this._attributeStart = 0, this._batcher = null, this._batch = null;
  }
  get blendMode() {
    return this.renderable.groupBlendMode;
  }
  get color() {
    return this.renderable.groupColorAlpha;
  }
  reset() {
    this.renderable = null, this.texture = null, this._batcher = null, this._batch = null, this.bounds = null;
  }
}
function hi(s, e) {
  const t = s.instructionSet, r = t.instructions;
  for (let i = 0; i < t.instructionSize; i++) {
    const n = r[i];
    e[n.renderPipeId].execute(n);
  }
}
const $m = new L();
class ll {
  constructor(e) {
    this._renderer = e;
  }
  addRenderGroup(e, t) {
    e.isCachedAsTexture ? this._addRenderableCacheAsTexture(e, t) : this._addRenderableDirect(e, t);
  }
  execute(e) {
    e.isRenderable && (e.isCachedAsTexture ? this._executeCacheAsTexture(e) : this._executeDirect(e));
  }
  destroy() {
    this._renderer = null;
  }
  _addRenderableDirect(e, t) {
    this._renderer.renderPipes.batch.break(t), e._batchableRenderGroup && (K.return(e._batchableRenderGroup), e._batchableRenderGroup = null), t.add(e);
  }
  _addRenderableCacheAsTexture(e, t) {
    const r = e._batchableRenderGroup ?? (e._batchableRenderGroup = K.get(jr));
    r.renderable = e.root, r.transform = e.root.relativeGroupTransform, r.texture = e.texture, r.bounds = e._textureBounds, t.add(e), this._renderer.renderPipes.batch.addToBatch(r, t);
  }
  _executeCacheAsTexture(e) {
    if (e.textureNeedsUpdate) {
      e.textureNeedsUpdate = !1;
      const t = $m.identity().translate(
        -e._textureBounds.x,
        -e._textureBounds.y
      );
      this._renderer.renderTarget.push(e.texture, !0, null, e.texture.frame), this._renderer.globalUniforms.push({
        worldTransformMatrix: t,
        worldColor: 4294967295
      }), hi(e, this._renderer.renderPipes), this._renderer.renderTarget.finishRenderPass(), this._renderer.renderTarget.pop(), this._renderer.globalUniforms.pop();
    }
    e._batchableRenderGroup._batcher.updateElement(e._batchableRenderGroup), e._batchableRenderGroup._batcher.geometry.buffers[0].update();
  }
  _executeDirect(e) {
    this._renderer.globalUniforms.push({
      worldTransformMatrix: e.inverseParentTextureTransform,
      worldColor: e.worldColorAlpha
    }), hi(e, this._renderer.renderPipes), this._renderer.globalUniforms.pop();
  }
}
ll.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "renderGroup"
};
function li(s, e) {
  e || (e = 0);
  for (let t = e; t < s.length && s[t]; t++)
    s[t] = null;
}
const Xm = new _e(), Fa = Yt | Ur | _i;
function cl(s, e = !1) {
  jm(s);
  const t = s.childrenToUpdate, r = s.updateTick++;
  for (const i in t) {
    const n = Number(i), a = t[i], o = a.list, h = a.index;
    for (let l = 0; l < h; l++) {
      const c = o[l];
      c.parentRenderGroup === s && c.relativeRenderGroupDepth === n && ul(c, r, 0);
    }
    li(o, h), a.index = 0;
  }
  if (e)
    for (let i = 0; i < s.renderGroupChildren.length; i++)
      cl(s.renderGroupChildren[i], e);
}
function jm(s) {
  const e = s.root;
  let t;
  if (s.renderGroupParent) {
    const r = s.renderGroupParent;
    s.worldTransform.appendFrom(
      e.relativeGroupTransform,
      r.worldTransform
    ), s.worldColor = Gr(
      e.groupColor,
      r.worldColor
    ), t = e.groupAlpha * r.worldAlpha;
  } else
    s.worldTransform.copyFrom(e.localTransform), s.worldColor = e.localColor, t = e.localAlpha;
  t = t < 0 ? 0 : t > 1 ? 1 : t, s.worldAlpha = t, s.worldColorAlpha = s.worldColor + ((t * 255 | 0) << 24);
}
function ul(s, e, t) {
  if (e === s.updateTick)
    return;
  s.updateTick = e, s.didChange = !1;
  const r = s.localTransform;
  s.updateLocalTransform();
  const i = s.parent;
  if (i && !i.renderGroup ? (t |= s._updateFlags, s.relativeGroupTransform.appendFrom(
    r,
    i.relativeGroupTransform
  ), t & Fa && Da(s, i, t)) : (t = s._updateFlags, s.relativeGroupTransform.copyFrom(r), t & Fa && Da(s, Xm, t)), !s.renderGroup) {
    const n = s.children, a = n.length;
    for (let l = 0; l < a; l++)
      ul(n[l], e, t);
    const o = s.parentRenderGroup, h = s;
    h.renderPipeId && !o.structureDidChange && o.updateRenderable(h);
  }
}
function Da(s, e, t) {
  if (t & Ur) {
    s.groupColor = Gr(
      s.localColor,
      e.groupColor
    );
    let r = s.localAlpha * e.groupAlpha;
    r = r < 0 ? 0 : r > 1 ? 1 : r, s.groupAlpha = r, s.groupColorAlpha = s.groupColor + ((r * 255 | 0) << 24);
  }
  t & _i && (s.groupBlendMode = s.localBlendMode === "inherit" ? e.groupBlendMode : s.localBlendMode), t & Yt && (s.globalDisplayStatus = s.localDisplayStatus & e.globalDisplayStatus), s._updateFlags = 0;
}
function Ym(s, e) {
  const { list: t, index: r } = s.childrenRenderablesToUpdate;
  let i = !1;
  for (let n = 0; n < r; n++) {
    const a = t[n];
    if (i = e[a.renderPipeId].validateRenderable(a), i)
      break;
  }
  return s.structureDidChange = i, i;
}
const Km = new L();
class dl {
  constructor(e) {
    this._renderer = e;
  }
  render({ container: e, transform: t }) {
    const r = e.parent, i = e.renderGroup.renderGroupParent;
    e.parent = null, e.renderGroup.renderGroupParent = null;
    const n = this._renderer;
    let a = Km;
    t && (a = a.copyFrom(e.renderGroup.localTransform), e.renderGroup.localTransform.copyFrom(t));
    const o = n.renderPipes;
    this._updateCachedRenderGroups(e.renderGroup, null), this._updateRenderGroups(e.renderGroup), n.globalUniforms.start({
      worldTransformMatrix: t ? e.renderGroup.localTransform : e.renderGroup.worldTransform,
      worldColor: e.renderGroup.worldColorAlpha
    }), hi(e.renderGroup, o), o.uniformBatch && o.uniformBatch.renderEnd(), t && e.renderGroup.localTransform.copyFrom(a), e.parent = r, e.renderGroup.renderGroupParent = i;
  }
  destroy() {
    this._renderer = null;
  }
  _updateCachedRenderGroups(e, t) {
    if (e.isCachedAsTexture) {
      if (!e.updateCacheTexture)
        return;
      t = e;
    }
    e._parentCacheAsTextureRenderGroup = t;
    for (let r = e.renderGroupChildren.length - 1; r >= 0; r--)
      this._updateCachedRenderGroups(e.renderGroupChildren[r], t);
    if (e.invalidateMatrices(), e.isCachedAsTexture) {
      if (e.textureNeedsUpdate) {
        const r = e.root.getLocalBounds();
        r.ceil();
        const i = e.texture;
        e.texture && xe.returnTexture(e.texture);
        const n = this._renderer, a = e.textureOptions.resolution || n.view.resolution, o = e.textureOptions.antialias ?? n.view.antialias;
        e.texture = xe.getOptimalTexture(
          r.width,
          r.height,
          a,
          o
        ), e._textureBounds || (e._textureBounds = new ye()), e._textureBounds.copyFrom(r), i !== e.texture && e.renderGroupParent && (e.renderGroupParent.structureDidChange = !0);
      }
    } else e.texture && (xe.returnTexture(e.texture), e.texture = null);
  }
  _updateRenderGroups(e) {
    const t = this._renderer, r = t.renderPipes;
    if (e.runOnRender(t), e.instructionSet.renderPipes = r, e.structureDidChange ? li(e.childrenRenderablesToUpdate.list, 0) : Ym(e, r), cl(e), e.structureDidChange ? (e.structureDidChange = !1, this._buildInstructions(e, t)) : this._updateRenderables(e), e.childrenRenderablesToUpdate.index = 0, t.renderPipes.batch.upload(e.instructionSet), !(e.isCachedAsTexture && !e.textureNeedsUpdate))
      for (let i = 0; i < e.renderGroupChildren.length; i++)
        this._updateRenderGroups(e.renderGroupChildren[i]);
  }
  _updateRenderables(e) {
    const { list: t, index: r } = e.childrenRenderablesToUpdate;
    for (let i = 0; i < r; i++) {
      const n = t[i];
      n.didViewUpdate && e.updateRenderable(n);
    }
    li(t, r);
  }
  _buildInstructions(e, t) {
    const r = e.root, i = e.instructionSet;
    i.reset();
    const n = t.renderPipes ? t : t.batch.renderer, a = n.renderPipes;
    a.batch.buildStart(i), a.blendMode.buildStart(), a.colorMask.buildStart(), r.sortableChildren && r.sortChildren(), r.collectRenderablesWithEffects(i, n, null), a.batch.buildEnd(i), a.blendMode.buildEnd(i);
  }
}
dl.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem,
    v.CanvasSystem
  ],
  name: "renderGroup"
};
class fl {
  constructor(e) {
    this._gpuSpriteHash = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_gpuSpriteHash");
  }
  addRenderable(e, t) {
    const r = this._getGpuSprite(e);
    e.didViewUpdate && this._updateBatchableSprite(e, r), this._renderer.renderPipes.batch.addToBatch(r, t);
  }
  updateRenderable(e) {
    const t = this._gpuSpriteHash[e.uid];
    e.didViewUpdate && this._updateBatchableSprite(e, t), t._batcher.updateElement(t);
  }
  validateRenderable(e) {
    const t = this._getGpuSprite(e);
    return !t._batcher.checkAndUpdateTexture(
      t,
      e._texture
    );
  }
  destroyRenderable(e) {
    const t = this._gpuSpriteHash[e.uid];
    K.return(t), this._gpuSpriteHash[e.uid] = null, e.off("destroyed", this._destroyRenderableBound);
  }
  _updateBatchableSprite(e, t) {
    t.bounds = e.visualBounds, t.texture = e._texture;
  }
  _getGpuSprite(e) {
    return this._gpuSpriteHash[e.uid] || this._initGPUSprite(e);
  }
  _initGPUSprite(e) {
    const t = K.get(jr);
    return t.renderable = e, t.transform = e.groupTransform, t.texture = e._texture, t.bounds = e.visualBounds, t.roundPixels = this._renderer._roundPixels | e._roundPixels, this._gpuSpriteHash[e.uid] = t, e.on("destroyed", this._destroyRenderableBound), t;
  }
  destroy() {
    for (const e in this._gpuSpriteHash)
      K.return(this._gpuSpriteHash[e]);
    this._gpuSpriteHash = null, this._renderer = null;
  }
}
fl.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "sprite"
};
const $i = class pl {
  constructor() {
    this.clearBeforeRender = !0, this._backgroundColor = new re(0), this.color = this._backgroundColor, this.alpha = 1;
  }
  /**
   * initiates the background system
   * @param options - the options for the background colors
   */
  init(e) {
    e = { ...pl.defaultOptions, ...e }, this.clearBeforeRender = e.clearBeforeRender, this.color = e.background || e.backgroundColor || this._backgroundColor, this.alpha = e.backgroundAlpha, this._backgroundColor.setAlpha(e.backgroundAlpha);
  }
  /** The background color to fill if not transparent */
  get color() {
    return this._backgroundColor;
  }
  set color(e) {
    this._backgroundColor.setValue(e);
  }
  /** The background color alpha. Setting this to 0 will make the canvas transparent. */
  get alpha() {
    return this._backgroundColor.alpha;
  }
  set alpha(e) {
    this._backgroundColor.setAlpha(e);
  }
  /** The background color as an [R, G, B, A] array. */
  get colorRgba() {
    return this._backgroundColor.toArray();
  }
  /**
   * destroys the background system
   * @internal
   * @ignore
   */
  destroy() {
  }
};
$i.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem,
    v.CanvasSystem
  ],
  name: "background",
  priority: 0
};
$i.defaultOptions = {
  /**
   * {@link WebGLOptions.backgroundAlpha}
   * @default 1
   */
  backgroundAlpha: 1,
  /**
   * {@link WebGLOptions.backgroundColor}
   * @default 0x000000
   */
  backgroundColor: 0,
  /**
   * {@link WebGLOptions.clearBeforeRender}
   * @default true
   */
  clearBeforeRender: !0
};
let qm = $i;
const Qt = {};
z.handle(v.BlendMode, (s) => {
  if (!s.name)
    throw new Error("BlendMode extension must have a name property");
  Qt[s.name] = s.ref;
}, (s) => {
  delete Qt[s.name];
});
class ml {
  constructor(e) {
    this._isAdvanced = !1, this._filterHash = /* @__PURE__ */ Object.create(null), this._renderer = e, this._renderer.runners.prerender.add(this);
  }
  prerender() {
    this._activeBlendMode = "normal", this._isAdvanced = !1;
  }
  /**
   * This ensures that a blendMode switch is added to the instruction set if the blend mode has changed.
   * @param renderable - The renderable we are adding to the instruction set
   * @param blendMode - The blend mode of the renderable
   * @param instructionSet - The instruction set we are adding to
   */
  setBlendMode(e, t, r) {
    if (this._activeBlendMode === t) {
      this._isAdvanced && this._renderableList.push(e);
      return;
    }
    this._activeBlendMode = t, this._isAdvanced && this._endAdvancedBlendMode(r), this._isAdvanced = !!Qt[t], this._isAdvanced && (this._beginAdvancedBlendMode(r), this._renderableList.push(e));
  }
  _beginAdvancedBlendMode(e) {
    this._renderer.renderPipes.batch.break(e);
    const t = this._activeBlendMode;
    if (!Qt[t]) {
      V(`Unable to assign BlendMode: '${t}'. You may want to include: import 'pixi.js/advanced-blend-modes'`);
      return;
    }
    let r = this._filterHash[t];
    r || (r = this._filterHash[t] = new Ir(), r.filters = [new Qt[t]()]);
    const i = {
      renderPipeId: "filter",
      action: "pushFilter",
      renderables: [],
      filterEffect: r,
      canBundle: !1
    };
    this._renderableList = i.renderables, e.add(i);
  }
  _endAdvancedBlendMode(e) {
    this._renderableList = null, this._renderer.renderPipes.batch.break(e), e.add({
      renderPipeId: "filter",
      action: "popFilter",
      canBundle: !1
    });
  }
  /**
   * called when the instruction build process is starting this will reset internally to the default blend mode
   * @internal
   * @ignore
   */
  buildStart() {
    this._isAdvanced = !1;
  }
  /**
   * called when the instruction build process is finished, ensuring that if there is an advanced blend mode
   * active, we add the final render instructions added to the instruction set
   * @param instructionSet - The instruction set we are adding to
   * @internal
   * @ignore
   */
  buildEnd(e) {
    this._isAdvanced && this._endAdvancedBlendMode(e);
  }
  /**
   * @internal
   * @ignore
   */
  destroy() {
    this._renderer = null, this._renderableList = null;
    for (const e in this._filterHash)
      this._filterHash[e].destroy();
    this._filterHash = null;
  }
}
ml.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "blendMode"
};
const Rs = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp"
}, Xi = class gl {
  /** @param renderer - The renderer this System works for. */
  constructor(e) {
    this._renderer = e;
  }
  _normalizeOptions(e, t = {}) {
    return e instanceof _e || e instanceof D ? {
      target: e,
      ...t
    } : {
      ...t,
      ...e
    };
  }
  /**
   * Will return a HTML Image of the target
   * @param options - The options for creating the image, or the target to extract
   * @returns - HTML Image of the target
   */
  async image(e) {
    const t = new Image();
    return t.src = await this.base64(e), t;
  }
  /**
   * Will return a base64 encoded string of this target. It works by calling
   * `Extract.canvas` and then running toDataURL on that.
   * @param options - The options for creating the image, or the target to extract
   */
  async base64(e) {
    e = this._normalizeOptions(
      e,
      gl.defaultImageOptions
    );
    const { format: t, quality: r } = e, i = this.canvas(e);
    if (i.toBlob !== void 0)
      return new Promise((n, a) => {
        i.toBlob((o) => {
          if (!o) {
            a(new Error("ICanvas.toBlob failed!"));
            return;
          }
          const h = new FileReader();
          h.onload = () => n(h.result), h.onerror = a, h.readAsDataURL(o);
        }, Rs[t], r);
      });
    if (i.toDataURL !== void 0)
      return i.toDataURL(Rs[t], r);
    if (i.convertToBlob !== void 0) {
      const n = await i.convertToBlob({ type: Rs[t], quality: r });
      return new Promise((a, o) => {
        const h = new FileReader();
        h.onload = () => a(h.result), h.onerror = o, h.readAsDataURL(n);
      });
    }
    throw new Error("Extract.base64() requires ICanvas.toDataURL, ICanvas.toBlob, or ICanvas.convertToBlob to be implemented");
  }
  /**
   * Creates a Canvas element, renders this target to it and then returns it.
   * @param options - The options for creating the canvas, or the target to extract
   * @returns - A Canvas element with the texture rendered on.
   */
  canvas(e) {
    e = this._normalizeOptions(e);
    const t = e.target, r = this._renderer;
    if (t instanceof D)
      return r.texture.generateCanvas(t);
    const i = r.textureGenerator.generateTexture(e), n = r.texture.generateCanvas(i);
    return i.destroy(!0), n;
  }
  /**
   * Will return a one-dimensional array containing the pixel data of the entire texture in RGBA
   * order, with integer values between 0 and 255 (included).
   * @param options - The options for extracting the image, or the target to extract
   * @returns - One-dimensional array containing the pixel data of the entire texture
   */
  pixels(e) {
    e = this._normalizeOptions(e);
    const t = e.target, r = this._renderer, i = t instanceof D ? t : r.textureGenerator.generateTexture(e), n = r.texture.getPixels(i);
    return t instanceof _e && i.destroy(!0), n;
  }
  /**
   * Will return a texture of the target
   * @param options - The options for creating the texture, or the target to extract
   * @returns - A texture of the target
   */
  texture(e) {
    return e = this._normalizeOptions(e), e.target instanceof D ? e.target : this._renderer.textureGenerator.generateTexture(e);
  }
  /**
   * Will extract a HTMLImage of the target and download it
   * @param options - The options for downloading and extracting the image, or the target to extract
   */
  download(e) {
    e = this._normalizeOptions(e);
    const t = this.canvas(e), r = document.createElement("a");
    r.download = e.filename ?? "image.png", r.href = t.toDataURL("image/png"), document.body.appendChild(r), r.click(), document.body.removeChild(r);
  }
  /**
   * Logs the target to the console as an image. This is a useful way to debug what's happening in the renderer.
   * @param options - The options for logging the image, or the target to log
   */
  log(e) {
    const t = e.width ?? 200;
    e = this._normalizeOptions(e);
    const r = this.canvas(e), i = r.toDataURL();
    console.log(`[Pixi Texture] ${r.width}px ${r.height}px`);
    const n = [
      "font-size: 1px;",
      `padding: ${t}px 300px;`,
      `background: url(${i}) no-repeat;`,
      "background-size: contain;"
    ].join(" ");
    console.log("%c ", n);
  }
  destroy() {
    this._renderer = null;
  }
};
Xi.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem
  ],
  name: "extract"
};
Xi.defaultImageOptions = {
  /** The format of the image. */
  format: "png",
  /** The quality of the image. */
  quality: 1
};
let Zm = Xi;
class ji extends D {
  static create(e) {
    return new ji({
      source: new me(e)
    });
  }
  /**
   * Resizes the render texture.
   * @param width - The new width of the render texture.
   * @param height - The new height of the render texture.
   * @param resolution - The new resolution of the render texture.
   * @returns This texture.
   */
  resize(e, t, r) {
    return this.source.resize(e, t, r), this;
  }
}
const Qm = new ne(), Jm = new ye(), eg = [0, 0, 0, 0];
class _l {
  constructor(e) {
    this._renderer = e;
  }
  /**
   * A Useful function that returns a texture of the display object that can then be used to create sprites
   * This can be quite useful if your container is complicated and needs to be reused multiple times.
   * @param {GenerateTextureOptions | Container} options - Generate texture options.
   * @param {Container} [options.container] - If not given, the renderer's resolution is used.
   * @param {Rectangle} options.region - The region of the container, that shall be rendered,
   * @param {number} [options.resolution] - The resolution of the texture being generated.
   *        if no region is specified, defaults to the local bounds of the container.
   * @param {GenerateTextureSourceOptions} [options.textureSourceOptions] - Texture options for GPU.
   * @returns a shiny new texture of the container passed in
   */
  generateTexture(e) {
    var l;
    e instanceof _e && (e = {
      target: e,
      frame: void 0,
      textureSourceOptions: {},
      resolution: void 0
    });
    const t = e.resolution || this._renderer.resolution, r = e.antialias || this._renderer.view.antialias, i = e.target;
    let n = e.clearColor;
    n ? n = Array.isArray(n) && n.length === 4 ? n : re.shared.setValue(n).toArray() : n = eg;
    const a = ((l = e.frame) == null ? void 0 : l.copyTo(Qm)) || gi(i, Jm).rectangle;
    a.width = Math.max(a.width, 1 / t) | 0, a.height = Math.max(a.height, 1 / t) | 0;
    const o = ji.create({
      ...e.textureSourceOptions,
      width: a.width,
      height: a.height,
      resolution: t,
      antialias: r
    }), h = L.shared.translate(-a.x, -a.y);
    return this._renderer.render({
      container: i,
      transform: h,
      target: o,
      clearColor: n
    }), o.source.updateMipmaps(), o;
  }
  destroy() {
    this._renderer = null;
  }
}
_l.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem
  ],
  name: "textureGenerator"
};
function lr(s, e, t) {
  const r = (s >> 24 & 255) / 255;
  e[t++] = (s & 255) / 255 * r, e[t++] = (s >> 8 & 255) / 255 * r, e[t++] = (s >> 16 & 255) / 255 * r, e[t++] = r;
}
class xl {
  constructor(e) {
    this._stackIndex = 0, this._globalUniformDataStack = [], this._uniformsPool = [], this._activeUniforms = [], this._bindGroupPool = [], this._activeBindGroups = [], this._renderer = e;
  }
  reset() {
    this._stackIndex = 0;
    for (let e = 0; e < this._activeUniforms.length; e++)
      this._uniformsPool.push(this._activeUniforms[e]);
    for (let e = 0; e < this._activeBindGroups.length; e++)
      this._bindGroupPool.push(this._activeBindGroups[e]);
    this._activeUniforms.length = 0, this._activeBindGroups.length = 0;
  }
  start(e) {
    this.reset(), this.push(e);
  }
  bind({
    size: e,
    projectionMatrix: t,
    worldTransformMatrix: r,
    worldColor: i,
    offset: n
  }) {
    const a = this._renderer.renderTarget.renderTarget, o = this._stackIndex ? this._globalUniformDataStack[this._stackIndex - 1] : {
      worldTransformMatrix: new L(),
      worldColor: 4294967295,
      offset: new oe()
    }, h = {
      projectionMatrix: t || this._renderer.renderTarget.projectionMatrix,
      resolution: e || a.size,
      worldTransformMatrix: r || o.worldTransformMatrix,
      worldColor: i || o.worldColor,
      offset: n || o.offset,
      bindGroup: null
    }, l = this._uniformsPool.pop() || this._createUniforms();
    this._activeUniforms.push(l);
    const c = l.uniforms;
    c.uProjectionMatrix = h.projectionMatrix, c.uResolution = h.resolution, c.uWorldTransformMatrix.copyFrom(h.worldTransformMatrix), c.uWorldTransformMatrix.tx -= h.offset.x, c.uWorldTransformMatrix.ty -= h.offset.y, lr(
      h.worldColor,
      c.uWorldColorAlpha,
      0
    ), l.update();
    let u;
    this._renderer.renderPipes.uniformBatch ? u = this._renderer.renderPipes.uniformBatch.getUniformBindGroup(l, !1) : (u = this._bindGroupPool.pop() || new Je(), this._activeBindGroups.push(u), u.setResource(l, 0)), h.bindGroup = u, this._currentGlobalUniformData = h;
  }
  push(e) {
    this.bind(e), this._globalUniformDataStack[this._stackIndex++] = this._currentGlobalUniformData;
  }
  pop() {
    this._currentGlobalUniformData = this._globalUniformDataStack[--this._stackIndex - 1], this._renderer.type === Oe.WEBGL && this._currentGlobalUniformData.bindGroup.resources[0].update();
  }
  get bindGroup() {
    return this._currentGlobalUniformData.bindGroup;
  }
  get globalUniformData() {
    return this._currentGlobalUniformData;
  }
  get uniformGroup() {
    return this._currentGlobalUniformData.bindGroup.resources[0];
  }
  _createUniforms() {
    return new be({
      uProjectionMatrix: { value: new L(), type: "mat3x3<f32>" },
      uWorldTransformMatrix: { value: new L(), type: "mat3x3<f32>" },
      // TODO - someone smart - set this to be a unorm8x4 rather than a vec4<f32>
      uWorldColorAlpha: { value: new Float32Array(4), type: "vec4<f32>" },
      uResolution: { value: [0, 0], type: "vec2<f32>" }
    }, {
      isStatic: !0
    });
  }
  destroy() {
    this._renderer = null;
  }
}
xl.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem,
    v.CanvasSystem
  ],
  name: "globalUniforms"
};
let tg = 1;
class yl {
  constructor() {
    this._tasks = [], this._offset = 0;
  }
  /** Initializes the scheduler system and starts the ticker. */
  init() {
    Xe.system.add(this._update, this);
  }
  /**
   * Schedules a repeating task.
   * @param func - The function to execute.
   * @param duration - The interval duration in milliseconds.
   * @param useOffset - this will spread out tasks so that they do not all run at the same time
   * @returns The unique identifier for the scheduled task.
   */
  repeat(e, t, r = !0) {
    const i = tg++;
    let n = 0;
    return r && (this._offset += 1e3, n = this._offset), this._tasks.push({
      func: e,
      duration: t,
      start: performance.now(),
      offset: n,
      last: performance.now(),
      repeat: !0,
      id: i
    }), i;
  }
  /**
   * Cancels a scheduled task.
   * @param id - The unique identifier of the task to cancel.
   */
  cancel(e) {
    for (let t = 0; t < this._tasks.length; t++)
      if (this._tasks[t].id === e) {
        this._tasks.splice(t, 1);
        return;
      }
  }
  /**
   * Updates and executes the scheduled tasks.
   * @private
   */
  _update() {
    const e = performance.now();
    for (let t = 0; t < this._tasks.length; t++) {
      const r = this._tasks[t];
      if (e - r.offset - r.last >= r.duration) {
        const i = e - r.start;
        r.func(i), r.last = e;
      }
    }
  }
  /**
   * Destroys the scheduler system and removes all tasks.
   * @internal
   * @ignore
   */
  destroy() {
    Xe.system.remove(this._update, this), this._tasks.length = 0;
  }
}
yl.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem,
    v.CanvasSystem
  ],
  name: "scheduler",
  priority: 0
};
let Oa = !1;
function rg(s) {
  if (!Oa) {
    if (Z.get().getNavigator().userAgent.toLowerCase().indexOf("chrome") > -1) {
      const e = [
        `%c  %c  %c  %c  %c PixiJS %c v${Dr} (${s}) http://www.pixijs.com/

`,
        "background: #E72264; padding:5px 0;",
        "background: #6CA2EA; padding:5px 0;",
        "background: #B5D33D; padding:5px 0;",
        "background: #FED23F; padding:5px 0;",
        "color: #FFFFFF; background: #E72264; padding:5px 0;",
        "color: #E72264; background: #FFFFFF; padding:5px 0;"
      ];
      globalThis.console.log(...e);
    } else globalThis.console && globalThis.console.log(`PixiJS ${Dr} - ${s} - http://www.pixijs.com/`);
    Oa = !0;
  }
}
class Yi {
  constructor(e) {
    this._renderer = e;
  }
  /**
   * It all starts here! This initiates every system, passing in the options for any system by name.
   * @param options - the config for the renderer and all its systems
   */
  init(e) {
    if (e.hello) {
      let t = this._renderer.name;
      this._renderer.type === Oe.WEBGL && (t += ` ${this._renderer.context.webGLVersion}`), rg(t);
    }
  }
}
Yi.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem,
    v.CanvasSystem
  ],
  name: "hello",
  priority: -2
};
Yi.defaultOptions = {
  /** {@link WebGLOptions.hello} */
  hello: !1
};
function sg(s) {
  let e = !1;
  for (const r in s)
    if (s[r] == null) {
      e = !0;
      break;
    }
  if (!e)
    return s;
  const t = /* @__PURE__ */ Object.create(null);
  for (const r in s) {
    const i = s[r];
    i && (t[r] = i);
  }
  return t;
}
function ig(s) {
  let e = 0;
  for (let t = 0; t < s.length; t++)
    s[t] == null ? e++ : s[t - e] = s[t];
  return s.length -= e, s;
}
let ng = 0;
const Ki = class bl {
  /**
   * Creates a new RenderableGCSystem instance.
   * @param renderer - The renderer this garbage collection system works for
   */
  constructor(e) {
    this._managedRenderables = [], this._managedHashes = [], this._managedArrays = [], this._renderer = e;
  }
  /**
   * Initializes the garbage collection system with the provided options.
   * @param options - Configuration options for the renderer
   */
  init(e) {
    e = { ...bl.defaultOptions, ...e }, this.maxUnusedTime = e.renderableGCMaxUnusedTime, this._frequency = e.renderableGCFrequency, this.enabled = e.renderableGCActive;
  }
  /**
   * Gets whether the garbage collection system is currently enabled.
   * @returns True if GC is enabled, false otherwise
   */
  get enabled() {
    return !!this._handler;
  }
  /**
   * Enables or disables the garbage collection system.
   * When enabled, schedules periodic cleanup of resources.
   * When disabled, cancels all scheduled cleanups.
   */
  set enabled(e) {
    this.enabled !== e && (e ? (this._handler = this._renderer.scheduler.repeat(
      () => this.run(),
      this._frequency,
      !1
    ), this._hashHandler = this._renderer.scheduler.repeat(
      () => {
        for (const t of this._managedHashes)
          t.context[t.hash] = sg(t.context[t.hash]);
      },
      this._frequency
    ), this._arrayHandler = this._renderer.scheduler.repeat(
      () => {
        for (const t of this._managedArrays)
          ig(t.context[t.hash]);
      },
      this._frequency
    )) : (this._renderer.scheduler.cancel(this._handler), this._renderer.scheduler.cancel(this._hashHandler), this._renderer.scheduler.cancel(this._arrayHandler)));
  }
  /**
   * Adds a hash table to be managed by the garbage collector.
   * @param context - The object containing the hash table
   * @param hash - The property name of the hash table
   */
  addManagedHash(e, t) {
    this._managedHashes.push({ context: e, hash: t });
  }
  /**
   * Adds an array to be managed by the garbage collector.
   * @param context - The object containing the array
   * @param hash - The property name of the array
   */
  addManagedArray(e, t) {
    this._managedArrays.push({ context: e, hash: t });
  }
  /**
   * Updates the GC timestamp and tracking before rendering.
   * @param options - The render options
   * @param options.container - The container to render
   */
  prerender({
    container: e
  }) {
    this._now = performance.now(), e.renderGroup.gcTick = ng++, this._updateInstructionGCTick(e.renderGroup, e.renderGroup.gcTick);
  }
  /**
   * Starts tracking a renderable for garbage collection.
   * @param renderable - The renderable to track
   */
  addRenderable(e) {
    this.enabled && (e._lastUsed === -1 && (this._managedRenderables.push(e), e.once("destroyed", this._removeRenderable, this)), e._lastUsed = this._now);
  }
  /**
   * Performs garbage collection by cleaning up unused renderables.
   * Removes renderables that haven't been used for longer than maxUnusedTime.
   */
  run() {
    var n;
    const e = this._now, t = this._managedRenderables, r = this._renderer.renderPipes;
    let i = 0;
    for (let a = 0; a < t.length; a++) {
      const o = t[a];
      if (o === null) {
        i++;
        continue;
      }
      const h = o.renderGroup ?? o.parentRenderGroup, l = ((n = h == null ? void 0 : h.instructionSet) == null ? void 0 : n.gcTick) ?? -1;
      if (((h == null ? void 0 : h.gcTick) ?? 0) === l && (o._lastUsed = e), e - o._lastUsed > this.maxUnusedTime) {
        if (!o.destroyed) {
          const c = r;
          h && (h.structureDidChange = !0), c[o.renderPipeId].destroyRenderable(o);
        }
        o._lastUsed = -1, i++, o.off("destroyed", this._removeRenderable, this);
      } else
        t[a - i] = o;
    }
    t.length -= i;
  }
  /** Cleans up the garbage collection system. Disables GC and removes all tracked resources. */
  destroy() {
    this.enabled = !1, this._renderer = null, this._managedRenderables.length = 0, this._managedHashes.length = 0, this._managedArrays.length = 0;
  }
  /**
   * Removes a renderable from being tracked when it's destroyed.
   * @param renderable - The renderable to stop tracking
   */
  _removeRenderable(e) {
    const t = this._managedRenderables.indexOf(e);
    t >= 0 && (e.off("destroyed", this._removeRenderable, this), this._managedRenderables[t] = null);
  }
  /**
   * Updates the GC tick counter for a render group and its children.
   * @param renderGroup - The render group to update
   * @param gcTick - The new tick value
   */
  _updateInstructionGCTick(e, t) {
    e.instructionSet.gcTick = t;
    for (const r of e.renderGroupChildren)
      this._updateInstructionGCTick(r, t);
  }
};
Ki.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem
  ],
  name: "renderableGC",
  priority: 0
};
Ki.defaultOptions = {
  /** Enable/disable the garbage collector */
  renderableGCActive: !0,
  /** Time in ms before an unused resource is collected (default 1 minute) */
  renderableGCMaxUnusedTime: 6e4,
  /** How often to run garbage collection in ms (default 30 seconds) */
  renderableGCFrequency: 3e4
};
let ag = Ki;
const qi = class vl {
  /** @param renderer - The renderer this System works for. */
  constructor(e) {
    this._renderer = e, this.count = 0, this.checkCount = 0;
  }
  init(e) {
    e = { ...vl.defaultOptions, ...e }, this.checkCountMax = e.textureGCCheckCountMax, this.maxIdle = e.textureGCAMaxIdle ?? e.textureGCMaxIdle, this.active = e.textureGCActive;
  }
  /**
   * Checks to see when the last time a texture was used.
   * If the texture has not been used for a specified amount of time, it will be removed from the GPU.
   */
  postrender() {
    this._renderer.renderingToScreen && (this.count++, this.active && (this.checkCount++, this.checkCount > this.checkCountMax && (this.checkCount = 0, this.run())));
  }
  /**
   * Checks to see when the last time a texture was used.
   * If the texture has not been used for a specified amount of time, it will be removed from the GPU.
   */
  run() {
    const e = this._renderer.texture.managedTextures;
    for (let t = 0; t < e.length; t++) {
      const r = e[t];
      r.autoGarbageCollect && r.resource && r._touched > -1 && this.count - r._touched > this.maxIdle && (r._touched = -1, r.unload());
    }
  }
  destroy() {
    this._renderer = null;
  }
};
qi.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem
  ],
  name: "textureGC"
};
qi.defaultOptions = {
  /**
   * If set to true, this will enable the garbage collector on the GPU.
   * @default true
   */
  textureGCActive: !0,
  /**
   * @deprecated since 8.3.0
   * @see {@link TextureGCSystem.textureGCMaxIdle}
   */
  textureGCAMaxIdle: null,
  /**
   * The maximum idle frames before a texture is destroyed by garbage collection.
   * @default 60 * 60
   */
  textureGCMaxIdle: 3600,
  /**
   * Frames between two garbage collections.
   * @default 600
   */
  textureGCCheckCountMax: 600
};
let og = qi;
const Zi = class Tl {
  /**
   * Whether CSS dimensions of canvas view should be resized to screen dimensions automatically.
   * @member {boolean}
   */
  get autoDensity() {
    return this.texture.source.autoDensity;
  }
  set autoDensity(e) {
    this.texture.source.autoDensity = e;
  }
  /** The resolution / device pixel ratio of the renderer. */
  get resolution() {
    return this.texture.source._resolution;
  }
  set resolution(e) {
    this.texture.source.resize(
      this.texture.source.width,
      this.texture.source.height,
      e
    );
  }
  /**
   * initiates the view system
   * @param options - the options for the view
   */
  init(e) {
    e = {
      ...Tl.defaultOptions,
      ...e
    }, e.view && (X(Y, "ViewSystem.view has been renamed to ViewSystem.canvas"), e.canvas = e.view), this.screen = new ne(0, 0, e.width, e.height), this.canvas = e.canvas || Z.get().createCanvas(), this.antialias = !!e.antialias, this.texture = Yh(this.canvas, e), this.renderTarget = new ai({
      colorTextures: [this.texture],
      depth: !!e.depth,
      isRoot: !0
    }), this.texture.source.transparent = e.backgroundAlpha < 1, this.resolution = e.resolution;
  }
  /**
   * Resizes the screen and canvas to the specified dimensions.
   * @param desiredScreenWidth - The new width of the screen.
   * @param desiredScreenHeight - The new height of the screen.
   * @param resolution
   */
  resize(e, t, r) {
    this.texture.source.resize(e, t, r), this.screen.width = this.texture.frame.width, this.screen.height = this.texture.frame.height;
  }
  /**
   * Destroys this System and optionally removes the canvas from the dom.
   * @param {options | false} options - The options for destroying the view, or "false".
   * @param options.removeView - Whether to remove the view element from the DOM. Defaults to `false`.
   */
  destroy(e = !1) {
    (typeof e == "boolean" ? e : !!(e != null && e.removeView)) && this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas);
  }
};
Zi.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem,
    v.CanvasSystem
  ],
  name: "view",
  priority: 0
};
Zi.defaultOptions = {
  /**
   * {@link WebGLOptions.width}
   * @default 800
   */
  width: 800,
  /**
   * {@link WebGLOptions.height}
   * @default 600
   */
  height: 600,
  /**
   * {@link WebGLOptions.autoDensity}
   * @default false
   */
  autoDensity: !1,
  /**
   * {@link WebGLOptions.antialias}
   * @default false
   */
  antialias: !1
};
let hg = Zi;
const Sl = [
  qm,
  xl,
  Yi,
  hg,
  dl,
  og,
  _l,
  Zm,
  No,
  ag,
  yl
], wl = [
  ml,
  Bh,
  fl,
  ll,
  Rh,
  Ih,
  kh,
  hl
], lg = [
  ...Sl,
  jh,
  nm,
  em,
  Gh,
  nl,
  Qh,
  Oh,
  rl,
  tl,
  Hh,
  Im,
  Wh,
  Nh
], cg = [...wl], ug = [Ch, ol, al], Al = [], Pl = [], Cl = [];
z.handleByNamedList(v.WebGLSystem, Al);
z.handleByNamedList(v.WebGLPipes, Pl);
z.handleByNamedList(v.WebGLPipesAdaptor, Cl);
z.add(...lg, ...cg, ...ug);
class dg extends Vr {
  constructor() {
    const e = {
      name: "webgl",
      type: Oe.WEBGL,
      systems: Al,
      renderPipes: Pl,
      renderPipeAdaptors: Cl
    };
    super(e);
  }
}
const fg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  WebGLRenderer: dg
}, Symbol.toStringTag, { value: "Module" }));
class El {
  constructor(e) {
    this._hash = /* @__PURE__ */ Object.create(null), this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_hash");
  }
  contextChange(e) {
    this._gpu = e;
  }
  getBindGroup(e, t, r) {
    return e._updateKey(), this._hash[e._key] || this._createBindGroup(e, t, r);
  }
  _createBindGroup(e, t, r) {
    const i = this._gpu.device, n = t.layout[r], a = [], o = this._renderer;
    for (const c in n) {
      const u = e.resources[c] ?? e.resources[n[c]];
      let d;
      if (u._resourceType === "uniformGroup") {
        const f = u;
        o.ubo.updateUniformGroup(f);
        const p = f.buffer;
        d = {
          buffer: o.buffer.getGPUBuffer(p),
          offset: 0,
          size: p.descriptor.size
        };
      } else if (u._resourceType === "buffer") {
        const f = u;
        d = {
          buffer: o.buffer.getGPUBuffer(f),
          offset: 0,
          size: f.descriptor.size
        };
      } else if (u._resourceType === "bufferResource") {
        const f = u;
        d = {
          buffer: o.buffer.getGPUBuffer(f.buffer),
          offset: f.offset,
          size: f.size
        };
      } else if (u._resourceType === "textureSampler") {
        const f = u;
        d = o.texture.getGpuSampler(f);
      } else if (u._resourceType === "textureSource") {
        const f = u;
        d = o.texture.getGpuSource(f).createView({});
      }
      a.push({
        binding: n[c],
        resource: d
      });
    }
    const h = o.shader.getProgramData(t).bindGroups[r], l = i.createBindGroup({
      layout: h,
      entries: a
    });
    return this._hash[e._key] = l, l;
  }
  destroy() {
    for (const e of Object.keys(this._hash))
      this._hash[e] = null;
    this._hash = null, this._renderer = null;
  }
}
El.extension = {
  type: [
    v.WebGPUSystem
  ],
  name: "bindGroup"
};
class Ml {
  constructor(e) {
    this._gpuBuffers = /* @__PURE__ */ Object.create(null), this._managedBuffers = [], e.renderableGC.addManagedHash(this, "_gpuBuffers");
  }
  contextChange(e) {
    this._gpu = e;
  }
  getGPUBuffer(e) {
    return this._gpuBuffers[e.uid] || this.createGPUBuffer(e);
  }
  updateBuffer(e) {
    const t = this._gpuBuffers[e.uid] || this.createGPUBuffer(e), r = e.data;
    return e._updateID && r && (e._updateID = 0, this._gpu.device.queue.writeBuffer(
      t,
      0,
      r.buffer,
      0,
      // round to the nearest 4 bytes
      (e._updateSize || r.byteLength) + 3 & -4
    )), t;
  }
  /** dispose all WebGL resources of all managed buffers */
  destroyAll() {
    for (const e in this._gpuBuffers)
      this._gpuBuffers[e].destroy();
    this._gpuBuffers = {};
  }
  createGPUBuffer(e) {
    this._gpuBuffers[e.uid] || (e.on("update", this.updateBuffer, this), e.on("change", this.onBufferChange, this), e.on("destroy", this.onBufferDestroy, this), this._managedBuffers.push(e));
    const t = this._gpu.device.createBuffer(e.descriptor);
    return e._updateID = 0, e.data && (Zs(e.data.buffer, t.getMappedRange()), t.unmap()), this._gpuBuffers[e.uid] = t, t;
  }
  onBufferChange(e) {
    this._gpuBuffers[e.uid].destroy(), e._updateID = 0, this._gpuBuffers[e.uid] = this.createGPUBuffer(e);
  }
  /**
   * Disposes buffer
   * @param buffer - buffer with data
   */
  onBufferDestroy(e) {
    this._managedBuffers.splice(this._managedBuffers.indexOf(e), 1), this._destroyBuffer(e);
  }
  destroy() {
    this._managedBuffers.forEach((e) => this._destroyBuffer(e)), this._managedBuffers = null, this._gpuBuffers = null;
  }
  _destroyBuffer(e) {
    this._gpuBuffers[e.uid].destroy(), e.off("update", this.updateBuffer, this), e.off("change", this.onBufferChange, this), e.off("destroy", this.onBufferDestroy, this), this._gpuBuffers[e.uid] = null;
  }
}
Ml.extension = {
  type: [
    v.WebGPUSystem
  ],
  name: "buffer"
};
class pg {
  constructor({ minUniformOffsetAlignment: e }) {
    this._minUniformOffsetAlignment = 256, this.byteIndex = 0, this._minUniformOffsetAlignment = e, this.data = new Float32Array(65535);
  }
  clear() {
    this.byteIndex = 0;
  }
  addEmptyGroup(e) {
    if (e > this._minUniformOffsetAlignment / 4)
      throw new Error(`UniformBufferBatch: array is too large: ${e * 4}`);
    const t = this.byteIndex;
    let r = t + e * 4;
    if (r = Math.ceil(r / this._minUniformOffsetAlignment) * this._minUniformOffsetAlignment, r > this.data.length * 4)
      throw new Error("UniformBufferBatch: ubo batch got too big");
    return this.byteIndex = r, t;
  }
  addGroup(e) {
    const t = this.addEmptyGroup(e.length);
    for (let r = 0; r < e.length; r++)
      this.data[t / 4 + r] = e[r];
    return t;
  }
  destroy() {
    this.data = null;
  }
}
class Bl {
  constructor(e) {
    this._colorMaskCache = 15, this._renderer = e;
  }
  setMask(e) {
    this._colorMaskCache !== e && (this._colorMaskCache = e, this._renderer.pipeline.setColorMask(e));
  }
  destroy() {
    this._renderer = null, this._colorMaskCache = null;
  }
}
Bl.extension = {
  type: [
    v.WebGPUSystem
  ],
  name: "colorMask"
};
class Qi {
  /**
   * @param {WebGPURenderer} renderer - The renderer this System works for.
   */
  constructor(e) {
    this._renderer = e;
  }
  async init(e) {
    return this._initPromise ? this._initPromise : (this._initPromise = this._createDeviceAndAdaptor(e).then((t) => {
      this.gpu = t, this._renderer.runners.contextChange.emit(this.gpu);
    }), this._initPromise);
  }
  /**
   * Handle the context change event
   * @param gpu
   */
  contextChange(e) {
    this._renderer.gpu = e;
  }
  /**
   * Helper class to create a WebGL Context
   * @param {object} options - An options object that gets passed in to the canvas element containing the
   *    context attributes
   * @see https://developer.mozilla.org/en/docs/Web/API/HTMLCanvasElement/getContext
   * @returns {WebGLRenderingContext} the WebGL context
   */
  async _createDeviceAndAdaptor(e) {
    const t = await Z.get().getNavigator().gpu.requestAdapter({
      powerPreference: e.powerPreference,
      forceFallbackAdapter: e.forceFallbackAdapter
    }), r = [
      "texture-compression-bc",
      "texture-compression-astc",
      "texture-compression-etc2"
    ].filter((n) => t.features.has(n)), i = await t.requestDevice({
      requiredFeatures: r
    });
    return { adapter: t, device: i };
  }
  destroy() {
    this.gpu = null, this._renderer = null;
  }
}
Qi.extension = {
  type: [
    v.WebGPUSystem
  ],
  name: "device"
};
Qi.defaultOptions = {
  /**
   * {@link WebGPUOptions.powerPreference}
   * @default default
   */
  powerPreference: void 0,
  /**
   * Force the use of the fallback adapter
   * @default false
   */
  forceFallbackAdapter: !1
};
class Rl {
  constructor(e) {
    this._boundBindGroup = /* @__PURE__ */ Object.create(null), this._boundVertexBuffer = /* @__PURE__ */ Object.create(null), this._renderer = e;
  }
  renderStart() {
    this.commandFinished = new Promise((e) => {
      this._resolveCommandFinished = e;
    }), this.commandEncoder = this._renderer.gpu.device.createCommandEncoder();
  }
  beginRenderPass(e) {
    this.endRenderPass(), this._clearCache(), this.renderPassEncoder = this.commandEncoder.beginRenderPass(e.descriptor);
  }
  endRenderPass() {
    this.renderPassEncoder && this.renderPassEncoder.end(), this.renderPassEncoder = null;
  }
  setViewport(e) {
    this.renderPassEncoder.setViewport(e.x, e.y, e.width, e.height, 0, 1);
  }
  setPipelineFromGeometryProgramAndState(e, t, r, i) {
    const n = this._renderer.pipeline.getPipeline(e, t, r, i);
    this.setPipeline(n);
  }
  setPipeline(e) {
    this._boundPipeline !== e && (this._boundPipeline = e, this.renderPassEncoder.setPipeline(e));
  }
  _setVertexBuffer(e, t) {
    this._boundVertexBuffer[e] !== t && (this._boundVertexBuffer[e] = t, this.renderPassEncoder.setVertexBuffer(e, this._renderer.buffer.updateBuffer(t)));
  }
  _setIndexBuffer(e) {
    if (this._boundIndexBuffer === e)
      return;
    this._boundIndexBuffer = e;
    const t = e.data.BYTES_PER_ELEMENT === 2 ? "uint16" : "uint32";
    this.renderPassEncoder.setIndexBuffer(this._renderer.buffer.updateBuffer(e), t);
  }
  resetBindGroup(e) {
    this._boundBindGroup[e] = null;
  }
  setBindGroup(e, t, r) {
    if (this._boundBindGroup[e] === t)
      return;
    this._boundBindGroup[e] = t, t._touch(this._renderer.textureGC.count);
    const i = this._renderer.bindGroup.getBindGroup(t, r, e);
    this.renderPassEncoder.setBindGroup(e, i);
  }
  setGeometry(e, t) {
    const r = this._renderer.pipeline.getBufferNamesToBind(e, t);
    for (const i in r)
      this._setVertexBuffer(i, e.attributes[r[i]].buffer);
    e.indexBuffer && this._setIndexBuffer(e.indexBuffer);
  }
  _setShaderBindGroups(e, t) {
    for (const r in e.groups) {
      const i = e.groups[r];
      t || this._syncBindGroup(i), this.setBindGroup(r, i, e.gpuProgram);
    }
  }
  _syncBindGroup(e) {
    for (const t in e.resources) {
      const r = e.resources[t];
      r.isUniformGroup && this._renderer.ubo.updateUniformGroup(r);
    }
  }
  draw(e) {
    const { geometry: t, shader: r, state: i, topology: n, size: a, start: o, instanceCount: h, skipSync: l } = e;
    this.setPipelineFromGeometryProgramAndState(t, r.gpuProgram, i, n), this.setGeometry(t, r.gpuProgram), this._setShaderBindGroups(r, l), t.indexBuffer ? this.renderPassEncoder.drawIndexed(
      a || t.indexBuffer.data.length,
      h ?? t.instanceCount,
      o || 0
    ) : this.renderPassEncoder.draw(a || t.getSize(), h ?? t.instanceCount, o || 0);
  }
  finishRenderPass() {
    this.renderPassEncoder && (this.renderPassEncoder.end(), this.renderPassEncoder = null);
  }
  postrender() {
    this.finishRenderPass(), this._gpu.device.queue.submit([this.commandEncoder.finish()]), this._resolveCommandFinished(), this.commandEncoder = null;
  }
  // restores a render pass if finishRenderPass was called
  // not optimised as really used for debugging!
  // used when we want to stop drawing and log a texture..
  restoreRenderPass() {
    const e = this._renderer.renderTarget.adaptor.getDescriptor(
      this._renderer.renderTarget.renderTarget,
      !1,
      [0, 0, 0, 1]
    );
    this.renderPassEncoder = this.commandEncoder.beginRenderPass(e);
    const t = this._boundPipeline, r = { ...this._boundVertexBuffer }, i = this._boundIndexBuffer, n = { ...this._boundBindGroup };
    this._clearCache();
    const a = this._renderer.renderTarget.viewport;
    this.renderPassEncoder.setViewport(a.x, a.y, a.width, a.height, 0, 1), this.setPipeline(t);
    for (const o in r)
      this._setVertexBuffer(o, r[o]);
    for (const o in n)
      this.setBindGroup(o, n[o], null);
    this._setIndexBuffer(i);
  }
  _clearCache() {
    for (let e = 0; e < 16; e++)
      this._boundBindGroup[e] = null, this._boundVertexBuffer[e] = null;
    this._boundIndexBuffer = null, this._boundPipeline = null;
  }
  destroy() {
    this._renderer = null, this._gpu = null, this._boundBindGroup = null, this._boundVertexBuffer = null, this._boundIndexBuffer = null, this._boundPipeline = null;
  }
  contextChange(e) {
    this._gpu = e;
  }
}
Rl.extension = {
  type: [v.WebGPUSystem],
  name: "encoder",
  priority: 1
};
class kl {
  constructor(e) {
    this._renderTargetStencilState = /* @__PURE__ */ Object.create(null), this._renderer = e, e.renderTarget.onRenderTargetChange.add(this);
  }
  onRenderTargetChange(e) {
    let t = this._renderTargetStencilState[e.uid];
    t || (t = this._renderTargetStencilState[e.uid] = {
      stencilMode: fe.DISABLED,
      stencilReference: 0
    }), this._activeRenderTarget = e, this.setStencilMode(t.stencilMode, t.stencilReference);
  }
  setStencilMode(e, t) {
    const r = this._renderTargetStencilState[this._activeRenderTarget.uid];
    r.stencilMode = e, r.stencilReference = t;
    const i = this._renderer;
    i.pipeline.setStencilMode(e), i.encoder.renderPassEncoder.setStencilReference(t);
  }
  destroy() {
    this._renderer.renderTarget.onRenderTargetChange.remove(this), this._renderer = null, this._activeRenderTarget = null, this._renderTargetStencilState = null;
  }
}
kl.extension = {
  type: [
    v.WebGPUSystem
  ],
  name: "stencil"
};
const kr = {
  i32: { align: 4, size: 4 },
  u32: { align: 4, size: 4 },
  f32: { align: 4, size: 4 },
  f16: { align: 2, size: 2 },
  "vec2<i32>": { align: 8, size: 8 },
  "vec2<u32>": { align: 8, size: 8 },
  "vec2<f32>": { align: 8, size: 8 },
  "vec2<f16>": { align: 4, size: 4 },
  "vec3<i32>": { align: 16, size: 12 },
  "vec3<u32>": { align: 16, size: 12 },
  "vec3<f32>": { align: 16, size: 12 },
  "vec3<f16>": { align: 8, size: 6 },
  "vec4<i32>": { align: 16, size: 16 },
  "vec4<u32>": { align: 16, size: 16 },
  "vec4<f32>": { align: 16, size: 16 },
  "vec4<f16>": { align: 8, size: 8 },
  "mat2x2<f32>": { align: 8, size: 16 },
  "mat2x2<f16>": { align: 4, size: 8 },
  "mat3x2<f32>": { align: 8, size: 24 },
  "mat3x2<f16>": { align: 4, size: 12 },
  "mat4x2<f32>": { align: 8, size: 32 },
  "mat4x2<f16>": { align: 4, size: 16 },
  "mat2x3<f32>": { align: 16, size: 32 },
  "mat2x3<f16>": { align: 8, size: 16 },
  "mat3x3<f32>": { align: 16, size: 48 },
  "mat3x3<f16>": { align: 8, size: 24 },
  "mat4x3<f32>": { align: 16, size: 64 },
  "mat4x3<f16>": { align: 8, size: 32 },
  "mat2x4<f32>": { align: 16, size: 32 },
  "mat2x4<f16>": { align: 8, size: 16 },
  "mat3x4<f32>": { align: 16, size: 48 },
  "mat3x4<f16>": { align: 8, size: 24 },
  "mat4x4<f32>": { align: 16, size: 64 },
  "mat4x4<f16>": { align: 8, size: 32 }
};
function mg(s) {
  const e = s.map((r) => ({
    data: r,
    offset: 0,
    size: 0
  }));
  let t = 0;
  for (let r = 0; r < e.length; r++) {
    const i = e[r];
    let n = kr[i.data.type].size;
    const a = kr[i.data.type].align;
    if (!kr[i.data.type])
      throw new Error(`[Pixi.js] WebGPU UniformBuffer: Unknown type ${i.data.type}`);
    i.data.size > 1 && (n = Math.max(n, a) * i.data.size), t = Math.ceil(t / a) * a, i.size = n, i.offset = t, t += n;
  }
  return t = Math.ceil(t / 16) * 16, { uboElements: e, size: t };
}
function gg(s, e) {
  const { size: t, align: r } = kr[s.data.type], i = (r - t) / 4, n = s.data.type.indexOf("i32") >= 0 ? "dataInt32" : "data";
  return `
         v = uv.${s.data.name};
         ${e !== 0 ? `offset += ${e};` : ""}

         arrayOffset = offset;

         t = 0;

         for(var i=0; i < ${s.data.size * (t / 4)}; i++)
         {
             for(var j = 0; j < ${t / 4}; j++)
             {
                 ${n}[arrayOffset++] = v[t++];
             }
             ${i !== 0 ? `arrayOffset += ${i};` : ""}
         }
     `;
}
function _g(s) {
  return $h(
    s,
    "uboWgsl",
    gg,
    hm
  );
}
class Il extends zh {
  constructor() {
    super({
      createUboElements: mg,
      generateUboSync: _g
    });
  }
}
Il.extension = {
  type: [v.WebGPUSystem],
  name: "ubo"
};
const rt = 128;
class Gl {
  constructor(e) {
    this._bindGroupHash = /* @__PURE__ */ Object.create(null), this._buffers = [], this._bindGroups = [], this._bufferResources = [], this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_bindGroupHash"), this._batchBuffer = new pg({ minUniformOffsetAlignment: rt });
    const t = 256 / rt;
    for (let r = 0; r < t; r++) {
      let i = q.UNIFORM | q.COPY_DST;
      r === 0 && (i |= q.COPY_SRC), this._buffers.push(new Ee({
        data: this._batchBuffer.data,
        usage: i
      }));
    }
  }
  renderEnd() {
    this._uploadBindGroups(), this._resetBindGroups();
  }
  _resetBindGroups() {
    for (const e in this._bindGroupHash)
      this._bindGroupHash[e] = null;
    this._batchBuffer.clear();
  }
  // just works for single bind groups for now
  getUniformBindGroup(e, t) {
    if (!t && this._bindGroupHash[e.uid])
      return this._bindGroupHash[e.uid];
    this._renderer.ubo.ensureUniformGroup(e);
    const r = e.buffer.data, i = this._batchBuffer.addEmptyGroup(r.length);
    return this._renderer.ubo.syncUniformGroup(e, this._batchBuffer.data, i / 4), this._bindGroupHash[e.uid] = this._getBindGroup(i / rt), this._bindGroupHash[e.uid];
  }
  getUboResource(e) {
    this._renderer.ubo.updateUniformGroup(e);
    const t = e.buffer.data, r = this._batchBuffer.addGroup(t);
    return this._getBufferResource(r / rt);
  }
  getArrayBindGroup(e) {
    const t = this._batchBuffer.addGroup(e);
    return this._getBindGroup(t / rt);
  }
  getArrayBufferResource(e) {
    const r = this._batchBuffer.addGroup(e) / rt;
    return this._getBufferResource(r);
  }
  _getBufferResource(e) {
    if (!this._bufferResources[e]) {
      const t = this._buffers[e % 2];
      this._bufferResources[e] = new Vi({
        buffer: t,
        offset: (e / 2 | 0) * 256,
        size: rt
      });
    }
    return this._bufferResources[e];
  }
  _getBindGroup(e) {
    if (!this._bindGroups[e]) {
      const t = new Je({
        0: this._getBufferResource(e)
      });
      this._bindGroups[e] = t;
    }
    return this._bindGroups[e];
  }
  _uploadBindGroups() {
    const e = this._renderer.buffer, t = this._buffers[0];
    t.update(this._batchBuffer.byteIndex), e.updateBuffer(t);
    const r = this._renderer.gpu.device.createCommandEncoder();
    for (let i = 1; i < this._buffers.length; i++) {
      const n = this._buffers[i];
      r.copyBufferToBuffer(
        e.getGPUBuffer(t),
        rt,
        e.getGPUBuffer(n),
        0,
        this._batchBuffer.byteIndex
      );
    }
    this._renderer.gpu.device.queue.submit([r.finish()]);
  }
  destroy() {
    for (let e = 0; e < this._bindGroups.length; e++)
      this._bindGroups[e].destroy();
    this._bindGroups = null, this._bindGroupHash = null;
    for (let e = 0; e < this._buffers.length; e++)
      this._buffers[e].destroy();
    this._buffers = null;
    for (let e = 0; e < this._bufferResources.length; e++)
      this._bufferResources[e].destroy();
    this._bufferResources = null, this._batchBuffer.destroy(), this._bindGroupHash = null, this._renderer = null;
  }
}
Gl.extension = {
  type: [
    v.WebGPUPipes
  ],
  name: "uniformBatch"
};
const xg = {
  "point-list": 0,
  "line-list": 1,
  "line-strip": 2,
  "triangle-list": 3,
  "triangle-strip": 4
};
function yg(s, e, t, r, i) {
  return s << 24 | e << 16 | t << 10 | r << 5 | i;
}
function bg(s, e, t, r) {
  return t << 6 | s << 3 | r << 1 | e;
}
class Ul {
  constructor(e) {
    this._moduleCache = /* @__PURE__ */ Object.create(null), this._bufferLayoutsCache = /* @__PURE__ */ Object.create(null), this._bindingNamesCache = /* @__PURE__ */ Object.create(null), this._pipeCache = /* @__PURE__ */ Object.create(null), this._pipeStateCaches = /* @__PURE__ */ Object.create(null), this._colorMask = 15, this._multisampleCount = 1, this._renderer = e;
  }
  contextChange(e) {
    this._gpu = e, this.setStencilMode(fe.DISABLED), this._updatePipeHash();
  }
  setMultisampleCount(e) {
    this._multisampleCount !== e && (this._multisampleCount = e, this._updatePipeHash());
  }
  setRenderTarget(e) {
    this._multisampleCount = e.msaaSamples, this._depthStencilAttachment = e.descriptor.depthStencilAttachment ? 1 : 0, this._updatePipeHash();
  }
  setColorMask(e) {
    this._colorMask !== e && (this._colorMask = e, this._updatePipeHash());
  }
  setStencilMode(e) {
    this._stencilMode !== e && (this._stencilMode = e, this._stencilState = ct[e], this._updatePipeHash());
  }
  setPipeline(e, t, r, i) {
    const n = this.getPipeline(e, t, r);
    i.setPipeline(n);
  }
  getPipeline(e, t, r, i) {
    e._layoutKey || (Fh(e, t.attributeData), this._generateBufferKey(e)), i || (i = e.topology);
    const n = yg(
      e._layoutKey,
      t._layoutKey,
      r.data,
      r._blendModeId,
      xg[i]
    );
    return this._pipeCache[n] ? this._pipeCache[n] : (this._pipeCache[n] = this._createPipeline(e, t, r, i), this._pipeCache[n]);
  }
  _createPipeline(e, t, r, i) {
    const n = this._gpu.device, a = this._createVertexBufferLayouts(e, t), o = this._renderer.state.getColorTargets(r);
    o[0].writeMask = this._stencilMode === fe.RENDERING_MASK_ADD ? 0 : this._colorMask;
    const h = this._renderer.shader.getProgramData(t).pipeline, l = {
      // TODO later check if its helpful to create..
      // layout,
      vertex: {
        module: this._getModule(t.vertex.source),
        entryPoint: t.vertex.entryPoint,
        // geometry..
        buffers: a
      },
      fragment: {
        module: this._getModule(t.fragment.source),
        entryPoint: t.fragment.entryPoint,
        targets: o
      },
      primitive: {
        topology: i,
        cullMode: r.cullMode
      },
      layout: h,
      multisample: {
        count: this._multisampleCount
      },
      // depthStencil,
      label: "PIXI Pipeline"
    };
    return this._depthStencilAttachment && (l.depthStencil = {
      ...this._stencilState,
      format: "depth24plus-stencil8",
      depthWriteEnabled: r.depthTest,
      depthCompare: r.depthTest ? "less" : "always"
    }), n.createRenderPipeline(l);
  }
  _getModule(e) {
    return this._moduleCache[e] || this._createModule(e);
  }
  _createModule(e) {
    const t = this._gpu.device;
    return this._moduleCache[e] = t.createShaderModule({
      code: e
    }), this._moduleCache[e];
  }
  _generateBufferKey(e) {
    const t = [];
    let r = 0;
    const i = Object.keys(e.attributes).sort();
    for (let a = 0; a < i.length; a++) {
      const o = e.attributes[i[a]];
      t[r++] = o.offset, t[r++] = o.format, t[r++] = o.stride, t[r++] = o.instance;
    }
    const n = t.join("|");
    return e._layoutKey = er(n, "geometry"), e._layoutKey;
  }
  _generateAttributeLocationsKey(e) {
    const t = [];
    let r = 0;
    const i = Object.keys(e.attributeData).sort();
    for (let a = 0; a < i.length; a++) {
      const o = e.attributeData[i[a]];
      t[r++] = o.location;
    }
    const n = t.join("|");
    return e._attributeLocationsKey = er(n, "programAttributes"), e._attributeLocationsKey;
  }
  /**
   * Returns a hash of buffer names mapped to bind locations.
   * This is used to bind the correct buffer to the correct location in the shader.
   * @param geometry - The geometry where to get the buffer names
   * @param program - The program where to get the buffer names
   * @returns An object of buffer names mapped to the bind location.
   */
  getBufferNamesToBind(e, t) {
    const r = e._layoutKey << 16 | t._attributeLocationsKey;
    if (this._bindingNamesCache[r])
      return this._bindingNamesCache[r];
    const i = this._createVertexBufferLayouts(e, t), n = /* @__PURE__ */ Object.create(null), a = t.attributeData;
    for (let o = 0; o < i.length; o++) {
      const l = Object.values(i[o].attributes)[0].shaderLocation;
      for (const c in a)
        if (a[c].location === l) {
          n[o] = c;
          break;
        }
    }
    return this._bindingNamesCache[r] = n, n;
  }
  _createVertexBufferLayouts(e, t) {
    t._attributeLocationsKey || this._generateAttributeLocationsKey(t);
    const r = e._layoutKey << 16 | t._attributeLocationsKey;
    if (this._bufferLayoutsCache[r])
      return this._bufferLayoutsCache[r];
    const i = [];
    return e.buffers.forEach((n) => {
      const a = {
        arrayStride: 0,
        stepMode: "vertex",
        attributes: []
      }, o = a.attributes;
      for (const h in t.attributeData) {
        const l = e.attributes[h];
        (l.divisor ?? 1) !== 1 && V(`Attribute ${h} has an invalid divisor value of '${l.divisor}'. WebGPU only supports a divisor value of 1`), l.buffer === n && (a.arrayStride = l.stride, a.stepMode = l.instance ? "instance" : "vertex", o.push({
          shaderLocation: t.attributeData[h].location,
          offset: l.offset,
          format: l.format
        }));
      }
      o.length && i.push(a);
    }), this._bufferLayoutsCache[r] = i, i;
  }
  _updatePipeHash() {
    const e = bg(
      this._stencilMode,
      this._multisampleCount,
      this._colorMask,
      this._depthStencilAttachment
    );
    this._pipeStateCaches[e] || (this._pipeStateCaches[e] = /* @__PURE__ */ Object.create(null)), this._pipeCache = this._pipeStateCaches[e];
  }
  destroy() {
    this._renderer = null, this._bufferLayoutsCache = null;
  }
}
Ul.extension = {
  type: [v.WebGPUSystem],
  name: "pipeline"
};
class vg {
  constructor() {
    this.contexts = [], this.msaaTextures = [], this.msaaSamples = 1;
  }
}
class Tg {
  init(e, t) {
    this._renderer = e, this._renderTargetSystem = t;
  }
  copyToTexture(e, t, r, i, n) {
    const a = this._renderer, o = this._getGpuColorTexture(
      e
    ), h = a.texture.getGpuSource(
      t.source
    );
    return a.encoder.commandEncoder.copyTextureToTexture(
      {
        texture: o,
        origin: r
      },
      {
        texture: h,
        origin: n
      },
      i
    ), t;
  }
  startRenderPass(e, t = !0, r, i) {
    const a = this._renderTargetSystem.getGpuRenderTarget(e), o = this.getDescriptor(e, t, r);
    a.descriptor = o, this._renderer.pipeline.setRenderTarget(a), this._renderer.encoder.beginRenderPass(a), this._renderer.encoder.setViewport(i);
  }
  finishRenderPass() {
    this._renderer.encoder.endRenderPass();
  }
  /**
   * returns the gpu texture for the first color texture in the render target
   * mainly used by the filter manager to get copy the texture for blending
   * @param renderTarget
   * @returns a gpu texture
   */
  _getGpuColorTexture(e) {
    const t = this._renderTargetSystem.getGpuRenderTarget(e);
    return t.contexts[0] ? t.contexts[0].getCurrentTexture() : this._renderer.texture.getGpuSource(
      e.colorTextures[0].source
    );
  }
  getDescriptor(e, t, r) {
    typeof t == "boolean" && (t = t ? Pe.ALL : Pe.NONE);
    const i = this._renderTargetSystem, n = i.getGpuRenderTarget(e), a = e.colorTextures.map(
      (l, c) => {
        const u = n.contexts[c];
        let d, f;
        u ? d = u.getCurrentTexture().createView() : d = this._renderer.texture.getGpuSource(l).createView({
          mipLevelCount: 1
        }), n.msaaTextures[c] && (f = d, d = this._renderer.texture.getTextureView(
          n.msaaTextures[c]
        ));
        const p = t & Pe.COLOR ? "clear" : "load";
        return r ?? (r = i.defaultClearColor), {
          view: d,
          resolveTarget: f,
          clearValue: r,
          storeOp: "store",
          loadOp: p
        };
      }
    );
    let o;
    if ((e.stencil || e.depth) && !e.depthStencilTexture && (e.ensureDepthStencilTexture(), e.depthStencilTexture.source.sampleCount = n.msaa ? 4 : 1), e.depthStencilTexture) {
      const l = t & Pe.STENCIL ? "clear" : "load", c = t & Pe.DEPTH ? "clear" : "load";
      o = {
        view: this._renderer.texture.getGpuSource(e.depthStencilTexture.source).createView(),
        stencilStoreOp: "store",
        stencilLoadOp: l,
        depthClearValue: 1,
        depthLoadOp: c,
        depthStoreOp: "store"
      };
    }
    return {
      colorAttachments: a,
      depthStencilAttachment: o
    };
  }
  clear(e, t = !0, r, i) {
    if (!t)
      return;
    const { gpu: n, encoder: a } = this._renderer, o = n.device;
    if (a.commandEncoder === null) {
      const l = o.createCommandEncoder(), c = this.getDescriptor(e, t, r), u = l.beginRenderPass(c);
      u.setViewport(i.x, i.y, i.width, i.height, 0, 1), u.end();
      const d = l.finish();
      o.queue.submit([d]);
    } else
      this.startRenderPass(e, t, r, i);
  }
  initGpuRenderTarget(e) {
    e.isRoot = !0;
    const t = new vg();
    return e.colorTextures.forEach((r, i) => {
      if (Qe.test(r.resource)) {
        const n = r.resource.getContext(
          "webgpu"
        ), a = r.transparent ? "premultiplied" : "opaque";
        try {
          n.configure({
            device: this._renderer.gpu.device,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
            format: "bgra8unorm",
            alphaMode: a
          });
        } catch (o) {
          console.error(o);
        }
        t.contexts[i] = n;
      }
      if (t.msaa = r.source.antialias, r.source.antialias) {
        const n = new me({
          width: 0,
          height: 0,
          sampleCount: 4
        });
        t.msaaTextures[i] = n;
      }
    }), t.msaa && (t.msaaSamples = 4, e.depthStencilTexture && (e.depthStencilTexture.source.sampleCount = 4)), t;
  }
  destroyGpuRenderTarget(e) {
    e.contexts.forEach((t) => {
      t.unconfigure();
    }), e.msaaTextures.forEach((t) => {
      t.destroy();
    }), e.msaaTextures.length = 0, e.contexts.length = 0;
  }
  ensureDepthStencilTexture(e) {
    const t = this._renderTargetSystem.getGpuRenderTarget(e);
    e.depthStencilTexture && t.msaa && (e.depthStencilTexture.source.sampleCount = 4);
  }
  resizeGpuRenderTarget(e) {
    const t = this._renderTargetSystem.getGpuRenderTarget(e);
    t.width = e.width, t.height = e.height, t.msaa && e.colorTextures.forEach((r, i) => {
      const n = t.msaaTextures[i];
      n == null || n.resize(
        r.source.width,
        r.source.height,
        r.source._resolution
      );
    });
  }
}
class Fl extends Zh {
  constructor(e) {
    super(e), this.adaptor = new Tg(), this.adaptor.init(e, this);
  }
}
Fl.extension = {
  type: [v.WebGPUSystem],
  name: "renderTarget"
};
class Dl {
  constructor() {
    this._gpuProgramData = /* @__PURE__ */ Object.create(null);
  }
  contextChange(e) {
    this._gpu = e, this.maxTextures = e.device.limits.maxSampledTexturesPerShaderStage;
  }
  getProgramData(e) {
    return this._gpuProgramData[e._layoutKey] || this._createGPUProgramData(e);
  }
  _createGPUProgramData(e) {
    const t = this._gpu.device, r = e.gpuLayout.map((n) => t.createBindGroupLayout({ entries: n })), i = { bindGroupLayouts: r };
    return this._gpuProgramData[e._layoutKey] = {
      bindGroups: r,
      pipeline: t.createPipelineLayout(i)
    }, this._gpuProgramData[e._layoutKey];
  }
  destroy() {
    this._gpu = null, this._gpuProgramData = null;
  }
}
Dl.extension = {
  type: [
    v.WebGPUSystem
  ],
  name: "shader"
};
const Se = {};
Se.normal = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  }
};
Se.add = {
  alpha: {
    srcFactor: "src-alpha",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "one",
    dstFactor: "one",
    operation: "add"
  }
};
Se.multiply = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "dst",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  }
};
Se.screen = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "one",
    dstFactor: "one-minus-src",
    operation: "add"
  }
};
Se.overlay = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "one",
    dstFactor: "one-minus-src",
    operation: "add"
  }
};
Se.none = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "zero",
    dstFactor: "zero",
    operation: "add"
  }
};
Se["normal-npm"] = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "src-alpha",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  }
};
Se["add-npm"] = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one",
    operation: "add"
  },
  color: {
    srcFactor: "src-alpha",
    dstFactor: "one",
    operation: "add"
  }
};
Se["screen-npm"] = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "src-alpha",
    dstFactor: "one-minus-src",
    operation: "add"
  }
};
Se.erase = {
  alpha: {
    srcFactor: "zero",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "zero",
    dstFactor: "one-minus-src",
    operation: "add"
  }
};
Se.min = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one",
    operation: "min"
  },
  color: {
    srcFactor: "one",
    dstFactor: "one",
    operation: "min"
  }
};
Se.max = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one",
    operation: "max"
  },
  color: {
    srcFactor: "one",
    dstFactor: "one",
    operation: "max"
  }
};
class Ol {
  constructor() {
    this.defaultState = new ke(), this.defaultState.blend = !0;
  }
  contextChange(e) {
    this.gpu = e;
  }
  /**
   * Gets the blend mode data for the current state
   * @param state - The state to get the blend mode from
   */
  getColorTargets(e) {
    return [
      {
        format: "bgra8unorm",
        writeMask: 0,
        blend: Se[e.blendMode] || Se.normal
      }
    ];
  }
  destroy() {
    this.gpu = null;
  }
}
Ol.extension = {
  type: [
    v.WebGPUSystem
  ],
  name: "state"
};
const Sg = {
  type: "image",
  upload(s, e, t) {
    const r = s.resource, i = (s.pixelWidth | 0) * (s.pixelHeight | 0), n = r.byteLength / i;
    t.device.queue.writeTexture(
      { texture: e },
      r,
      {
        offset: 0,
        rowsPerImage: s.pixelHeight,
        bytesPerRow: s.pixelHeight * n
      },
      {
        width: s.pixelWidth,
        height: s.pixelHeight,
        depthOrArrayLayers: 1
      }
    );
  }
}, Ll = {
  "bc1-rgba-unorm": { blockBytes: 8, blockWidth: 4, blockHeight: 4 },
  "bc2-rgba-unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
  "bc3-rgba-unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
  "bc7-rgba-unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
  "etc1-rgb-unorm": { blockBytes: 8, blockWidth: 4, blockHeight: 4 },
  "etc2-rgba8unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
  "astc-4x4-unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 }
}, wg = { blockBytes: 4, blockWidth: 1, blockHeight: 1 }, Ag = {
  type: "compressed",
  upload(s, e, t) {
    let r = s.pixelWidth, i = s.pixelHeight;
    const n = Ll[s.format] || wg;
    for (let a = 0; a < s.resource.length; a++) {
      const o = s.resource[a], h = Math.ceil(r / n.blockWidth) * n.blockBytes;
      t.device.queue.writeTexture(
        {
          texture: e,
          mipLevel: a
        },
        o,
        {
          offset: 0,
          bytesPerRow: h
        },
        {
          width: Math.ceil(r / n.blockWidth) * n.blockWidth,
          height: Math.ceil(i / n.blockHeight) * n.blockHeight,
          depthOrArrayLayers: 1
        }
      ), r = Math.max(r >> 1, 1), i = Math.max(i >> 1, 1);
    }
  }
}, Nl = {
  type: "image",
  upload(s, e, t) {
    const r = s.resource;
    if (!r)
      return;
    const i = Math.min(e.width, s.resourceWidth || s.pixelWidth), n = Math.min(e.height, s.resourceHeight || s.pixelHeight), a = s.alphaMode === "premultiply-alpha-on-upload";
    t.device.queue.copyExternalImageToTexture(
      { source: r },
      { texture: e, premultipliedAlpha: a },
      {
        width: i,
        height: n
      }
    );
  }
}, Pg = {
  type: "video",
  upload(s, e, t) {
    Nl.upload(s, e, t);
  }
};
class Cg {
  constructor(e) {
    this.device = e, this.sampler = e.createSampler({ minFilter: "linear" }), this.pipelines = {};
  }
  _getMipmapPipeline(e) {
    let t = this.pipelines[e];
    return t || (this.mipmapShaderModule || (this.mipmapShaderModule = this.device.createShaderModule({
      code: (
        /* wgsl */
        `
                        var<private> pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(
                        vec2<f32>(-1.0, -1.0), vec2<f32>(-1.0, 3.0), vec2<f32>(3.0, -1.0));

                        struct VertexOutput {
                        @builtin(position) position : vec4<f32>,
                        @location(0) texCoord : vec2<f32>,
                        };

                        @vertex
                        fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
                        var output : VertexOutput;
                        output.texCoord = pos[vertexIndex] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);
                        output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
                        return output;
                        }

                        @group(0) @binding(0) var imgSampler : sampler;
                        @group(0) @binding(1) var img : texture_2d<f32>;

                        @fragment
                        fn fragmentMain(@location(0) texCoord : vec2<f32>) -> @location(0) vec4<f32> {
                        return textureSample(img, imgSampler, texCoord);
                        }
                    `
      )
    })), t = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: this.mipmapShaderModule,
        entryPoint: "vertexMain"
      },
      fragment: {
        module: this.mipmapShaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: e }]
      }
    }), this.pipelines[e] = t), t;
  }
  /**
   * Generates mipmaps for the given GPUTexture from the data in level 0.
   * @param {module:External.GPUTexture} texture - Texture to generate mipmaps for.
   * @returns {module:External.GPUTexture} - The originally passed texture
   */
  generateMipmap(e) {
    const t = this._getMipmapPipeline(e.format);
    if (e.dimension === "3d" || e.dimension === "1d")
      throw new Error("Generating mipmaps for non-2d textures is currently unsupported!");
    let r = e;
    const i = e.depthOrArrayLayers || 1, n = e.usage & GPUTextureUsage.RENDER_ATTACHMENT;
    if (!n) {
      const h = {
        size: {
          width: Math.ceil(e.width / 2),
          height: Math.ceil(e.height / 2),
          depthOrArrayLayers: i
        },
        format: e.format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
        mipLevelCount: e.mipLevelCount - 1
      };
      r = this.device.createTexture(h);
    }
    const a = this.device.createCommandEncoder({}), o = t.getBindGroupLayout(0);
    for (let h = 0; h < i; ++h) {
      let l = e.createView({
        baseMipLevel: 0,
        mipLevelCount: 1,
        dimension: "2d",
        baseArrayLayer: h,
        arrayLayerCount: 1
      }), c = n ? 1 : 0;
      for (let u = 1; u < e.mipLevelCount; ++u) {
        const d = r.createView({
          baseMipLevel: c++,
          mipLevelCount: 1,
          dimension: "2d",
          baseArrayLayer: h,
          arrayLayerCount: 1
        }), f = a.beginRenderPass({
          colorAttachments: [{
            view: d,
            storeOp: "store",
            loadOp: "clear",
            clearValue: { r: 0, g: 0, b: 0, a: 0 }
          }]
        }), p = this.device.createBindGroup({
          layout: o,
          entries: [{
            binding: 0,
            resource: this.sampler
          }, {
            binding: 1,
            resource: l
          }]
        });
        f.setPipeline(t), f.setBindGroup(0, p), f.draw(3, 1, 0, 0), f.end(), l = d;
      }
    }
    if (!n) {
      const h = {
        width: Math.ceil(e.width / 2),
        height: Math.ceil(e.height / 2),
        depthOrArrayLayers: i
      };
      for (let l = 1; l < e.mipLevelCount; ++l)
        a.copyTextureToTexture({
          texture: r,
          mipLevel: l - 1
        }, {
          texture: e,
          mipLevel: l
        }, h), h.width = Math.ceil(h.width / 2), h.height = Math.ceil(h.height / 2);
    }
    return this.device.queue.submit([a.finish()]), n || r.destroy(), e;
  }
}
class Hl {
  constructor(e) {
    this.managedTextures = [], this._gpuSources = /* @__PURE__ */ Object.create(null), this._gpuSamplers = /* @__PURE__ */ Object.create(null), this._bindGroupHash = /* @__PURE__ */ Object.create(null), this._textureViewHash = /* @__PURE__ */ Object.create(null), this._uploads = {
      image: Nl,
      buffer: Sg,
      video: Pg,
      compressed: Ag
    }, this._renderer = e, e.renderableGC.addManagedHash(this, "_gpuSources"), e.renderableGC.addManagedHash(this, "_gpuSamplers"), e.renderableGC.addManagedHash(this, "_bindGroupHash"), e.renderableGC.addManagedHash(this, "_textureViewHash");
  }
  contextChange(e) {
    this._gpu = e;
  }
  initSource(e) {
    if (e.autoGenerateMipmaps) {
      const h = Math.max(e.pixelWidth, e.pixelHeight);
      e.mipLevelCount = Math.floor(Math.log2(h)) + 1;
    }
    let t = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
    e.uploadMethodId !== "compressed" && (t |= GPUTextureUsage.RENDER_ATTACHMENT, t |= GPUTextureUsage.COPY_SRC);
    const r = Ll[e.format] || { blockWidth: 1, blockHeight: 1 }, i = Math.ceil(e.pixelWidth / r.blockWidth) * r.blockWidth, n = Math.ceil(e.pixelHeight / r.blockHeight) * r.blockHeight, a = {
      label: e.label,
      size: { width: i, height: n },
      format: e.format,
      sampleCount: e.sampleCount,
      mipLevelCount: e.mipLevelCount,
      dimension: e.dimension,
      usage: t
    }, o = this._gpu.device.createTexture(a);
    return this._gpuSources[e.uid] = o, this.managedTextures.includes(e) || (e.on("update", this.onSourceUpdate, this), e.on("resize", this.onSourceResize, this), e.on("destroy", this.onSourceDestroy, this), e.on("unload", this.onSourceUnload, this), e.on("updateMipmaps", this.onUpdateMipmaps, this), this.managedTextures.push(e)), this.onSourceUpdate(e), o;
  }
  onSourceUpdate(e) {
    const t = this.getGpuSource(e);
    t && (this._uploads[e.uploadMethodId] && this._uploads[e.uploadMethodId].upload(e, t, this._gpu), e.autoGenerateMipmaps && e.mipLevelCount > 1 && this.onUpdateMipmaps(e));
  }
  onSourceUnload(e) {
    const t = this._gpuSources[e.uid];
    t && (this._gpuSources[e.uid] = null, t.destroy());
  }
  onUpdateMipmaps(e) {
    this._mipmapGenerator || (this._mipmapGenerator = new Cg(this._gpu.device));
    const t = this.getGpuSource(e);
    this._mipmapGenerator.generateMipmap(t);
  }
  onSourceDestroy(e) {
    e.off("update", this.onSourceUpdate, this), e.off("unload", this.onSourceUnload, this), e.off("destroy", this.onSourceDestroy, this), e.off("resize", this.onSourceResize, this), e.off("updateMipmaps", this.onUpdateMipmaps, this), this.managedTextures.splice(this.managedTextures.indexOf(e), 1), this.onSourceUnload(e);
  }
  onSourceResize(e) {
    const t = this._gpuSources[e.uid];
    t ? (t.width !== e.pixelWidth || t.height !== e.pixelHeight) && (this._textureViewHash[e.uid] = null, this._bindGroupHash[e.uid] = null, this.onSourceUnload(e), this.initSource(e)) : this.initSource(e);
  }
  _initSampler(e) {
    return this._gpuSamplers[e._resourceId] = this._gpu.device.createSampler(e), this._gpuSamplers[e._resourceId];
  }
  getGpuSampler(e) {
    return this._gpuSamplers[e._resourceId] || this._initSampler(e);
  }
  getGpuSource(e) {
    return this._gpuSources[e.uid] || this.initSource(e);
  }
  /**
   * this returns s bind group for a specific texture, the bind group contains
   * - the texture source
   * - the texture style
   * - the texture matrix
   * This is cached so the bind group should only be created once per texture
   * @param texture - the texture you want the bindgroup for
   * @returns the bind group for the texture
   */
  getTextureBindGroup(e) {
    return this._bindGroupHash[e.uid] ?? this._createTextureBindGroup(e);
  }
  _createTextureBindGroup(e) {
    const t = e.source;
    return this._bindGroupHash[e.uid] = new Je({
      0: t,
      1: t.style,
      2: new be({
        uTextureMatrix: { type: "mat3x3<f32>", value: e.textureMatrix.mapCoord }
      })
    }), this._bindGroupHash[e.uid];
  }
  getTextureView(e) {
    const t = e.source;
    return this._textureViewHash[t.uid] ?? this._createTextureView(t);
  }
  _createTextureView(e) {
    return this._textureViewHash[e.uid] = this.getGpuSource(e).createView(), this._textureViewHash[e.uid];
  }
  generateCanvas(e) {
    const t = this._renderer, r = t.gpu.device.createCommandEncoder(), i = Z.get().createCanvas();
    i.width = e.source.pixelWidth, i.height = e.source.pixelHeight;
    const n = i.getContext("webgpu");
    return n.configure({
      device: t.gpu.device,
      usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
      format: Z.get().getNavigator().gpu.getPreferredCanvasFormat(),
      alphaMode: "premultiplied"
    }), r.copyTextureToTexture({
      texture: t.texture.getGpuSource(e.source),
      origin: {
        x: 0,
        y: 0
      }
    }, {
      texture: n.getCurrentTexture()
    }, {
      width: i.width,
      height: i.height
    }), t.gpu.device.queue.submit([r.finish()]), i;
  }
  getPixels(e) {
    const t = this.generateCanvas(e), r = et.getOptimalCanvasAndContext(t.width, t.height), i = r.context;
    i.drawImage(t, 0, 0);
    const { width: n, height: a } = t, o = i.getImageData(0, 0, n, a), h = new Uint8ClampedArray(o.data.buffer);
    return et.returnCanvasAndContext(r), { pixels: h, width: n, height: a };
  }
  destroy() {
    this.managedTextures.slice().forEach((e) => this.onSourceDestroy(e)), this.managedTextures = null;
    for (const e of Object.keys(this._bindGroupHash)) {
      const t = Number(e), r = this._bindGroupHash[t];
      r == null || r.destroy(), this._bindGroupHash[t] = null;
    }
    this._gpu = null, this._mipmapGenerator = null, this._gpuSources = null, this._bindGroupHash = null, this._textureViewHash = null, this._gpuSamplers = null;
  }
}
Hl.extension = {
  type: [
    v.WebGPUSystem
  ],
  name: "texture"
};
class Wl {
  init() {
    const e = new be({
      uTransformMatrix: { value: new L(), type: "mat3x3<f32>" },
      uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
      uRound: { value: 0, type: "f32" }
    }), t = ir({
      name: "graphics",
      bits: [
        wi,
        Pi(It()),
        Yp,
        ar
      ]
    });
    this.shader = new Ie({
      gpuProgram: t,
      resources: {
        // added on the fly!
        localUniforms: e
      }
    });
  }
  execute(e, t) {
    const r = t.context, i = r.customShader || this.shader, n = e.renderer, a = n.graphicsContext, {
      batcher: o,
      instructions: h
    } = a.getContextRenderData(r), l = n.encoder;
    l.setGeometry(o.geometry, i.gpuProgram);
    const c = n.globalUniforms.bindGroup;
    l.setBindGroup(0, c, i.gpuProgram);
    const u = n.renderPipes.uniformBatch.getUniformBindGroup(i.resources.localUniforms, !0);
    l.setBindGroup(2, u, i.gpuProgram);
    const d = h.instructions;
    let f = null;
    for (let p = 0; p < h.instructionSize; p++) {
      const g = d[p];
      if (g.topology !== f && (f = g.topology, l.setPipelineFromGeometryProgramAndState(
        o.geometry,
        i.gpuProgram,
        e.state,
        g.topology
      )), i.groups[1] = g.bindGroup, !g.gpuBindGroup) {
        const m = g.textures;
        g.bindGroup = Si(m.textures, m.count), g.gpuBindGroup = n.bindGroup.getBindGroup(
          g.bindGroup,
          i.gpuProgram,
          1
        );
      }
      l.setBindGroup(1, g.bindGroup, i.gpuProgram), l.renderPassEncoder.drawIndexed(g.size, 1, g.start);
    }
  }
  destroy() {
    this.shader.destroy(!0), this.shader = null;
  }
}
Wl.extension = {
  type: [
    v.WebGPUPipesAdaptor
  ],
  name: "graphics"
};
class zl {
  init() {
    const e = ir({
      name: "mesh",
      bits: [
        Zt,
        Kp,
        ar
      ]
    });
    this._shader = new Ie({
      gpuProgram: e,
      resources: {
        uTexture: D.EMPTY._source,
        uSampler: D.EMPTY._source.style,
        textureUniforms: {
          uTextureMatrix: { type: "mat3x3<f32>", value: new L() }
        }
      }
    });
  }
  execute(e, t) {
    const r = e.renderer;
    let i = t._shader;
    if (!i)
      i = this._shader, i.groups[2] = r.texture.getTextureBindGroup(t.texture);
    else if (!i.gpuProgram) {
      V("Mesh shader has no gpuProgram", t.shader);
      return;
    }
    const n = i.gpuProgram;
    if (n.autoAssignGlobalUniforms && (i.groups[0] = r.globalUniforms.bindGroup), n.autoAssignLocalUniforms) {
      const a = e.localUniforms;
      i.groups[1] = r.renderPipes.uniformBatch.getUniformBindGroup(a, !0);
    }
    r.encoder.draw({
      geometry: t._geometry,
      shader: i,
      state: t.state
    });
  }
  destroy() {
    this._shader.destroy(!0), this._shader = null;
  }
}
zl.extension = {
  type: [
    v.WebGPUPipesAdaptor
  ],
  name: "mesh"
};
const Eg = [
  ...Sl,
  Il,
  Rl,
  Qi,
  Ml,
  Hl,
  Fl,
  Dl,
  Ol,
  Ul,
  Bl,
  kl,
  El
], Mg = [...wl, Gl], Bg = [Eh, zl, Wl], Vl = [], $l = [], Xl = [];
z.handleByNamedList(v.WebGPUSystem, Vl);
z.handleByNamedList(v.WebGPUPipes, $l);
z.handleByNamedList(v.WebGPUPipesAdaptor, Xl);
z.add(...Eg, ...Mg, ...Bg);
class Rg extends Vr {
  constructor() {
    const e = {
      name: "webgpu",
      type: Oe.WEBGPU,
      systems: Vl,
      renderPipes: $l,
      renderPipeAdaptors: Xl
    };
    super(e);
  }
}
const kg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  WebGPURenderer: Rg
}, Symbol.toStringTag, { value: "Module" }));
class jl {
  constructor(e, t) {
    this.state = ke.for2d(), this._graphicsBatchesHash = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this.renderer = e, this._adaptor = t, this._adaptor.init(), this.renderer.renderableGC.addManagedHash(this, "_graphicsBatchesHash");
  }
  validateRenderable(e) {
    const t = e.context, r = !!this._graphicsBatchesHash[e.uid], i = this.renderer.graphicsContext.updateGpuContext(t);
    return !!(i.isBatchable || r !== i.isBatchable);
  }
  addRenderable(e, t) {
    const r = this.renderer.graphicsContext.updateGpuContext(e.context);
    e.didViewUpdate && this._rebuild(e), r.isBatchable ? this._addToBatcher(e, t) : (this.renderer.renderPipes.batch.break(t), t.add(e));
  }
  updateRenderable(e) {
    const t = this._graphicsBatchesHash[e.uid];
    if (t)
      for (let r = 0; r < t.length; r++) {
        const i = t[r];
        i._batcher.updateElement(i);
      }
  }
  destroyRenderable(e) {
    this._graphicsBatchesHash[e.uid] && this._removeBatchForRenderable(e.uid), e.off("destroyed", this._destroyRenderableBound);
  }
  execute(e) {
    if (!e.isRenderable)
      return;
    const t = this.renderer, r = e.context;
    if (!t.graphicsContext.getGpuContext(r).batches.length)
      return;
    const n = r.customShader || this._adaptor.shader;
    this.state.blendMode = e.groupBlendMode;
    const a = n.resources.localUniforms.uniforms;
    a.uTransformMatrix = e.groupTransform, a.uRound = t._roundPixels | e._roundPixels, lr(
      e.groupColorAlpha,
      a.uColor,
      0
    ), this._adaptor.execute(this, e);
  }
  _rebuild(e) {
    const t = !!this._graphicsBatchesHash[e.uid], r = this.renderer.graphicsContext.updateGpuContext(e.context);
    t && this._removeBatchForRenderable(e.uid), r.isBatchable && this._initBatchesForRenderable(e), e.batched = r.isBatchable;
  }
  _addToBatcher(e, t) {
    const r = this.renderer.renderPipes.batch, i = this._getBatchesForRenderable(e);
    for (let n = 0; n < i.length; n++) {
      const a = i[n];
      r.addToBatch(a, t);
    }
  }
  _getBatchesForRenderable(e) {
    return this._graphicsBatchesHash[e.uid] || this._initBatchesForRenderable(e);
  }
  _initBatchesForRenderable(e) {
    const t = e.context, r = this.renderer.graphicsContext.getGpuContext(t), i = this.renderer._roundPixels | e._roundPixels, n = r.batches.map((a) => {
      const o = K.get(Bi);
      return a.copyTo(o), o.renderable = e, o.roundPixels = i, o;
    });
    return this._graphicsBatchesHash[e.uid] === void 0 && e.on("destroyed", this._destroyRenderableBound), this._graphicsBatchesHash[e.uid] = n, n;
  }
  _removeBatchForRenderable(e) {
    this._graphicsBatchesHash[e].forEach((t) => {
      K.return(t);
    }), this._graphicsBatchesHash[e] = null;
  }
  destroy() {
    this.renderer = null, this._adaptor.destroy(), this._adaptor = null, this.state = null;
    for (const e in this._graphicsBatchesHash)
      this._removeBatchForRenderable(e);
    this._graphicsBatchesHash = null;
  }
}
jl.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "graphics"
};
const Yl = class Kl extends hr {
  constructor(...e) {
    super({});
    let t = e[0] ?? {};
    typeof t == "number" && (X(Y, "PlaneGeometry constructor changed please use { width, height, verticesX, verticesY } instead"), t = {
      width: t,
      height: e[1],
      verticesX: e[2],
      verticesY: e[3]
    }), this.build(t);
  }
  /**
   * Refreshes plane coordinates
   * @param options - Options to be applied to plane geometry
   */
  build(e) {
    e = { ...Kl.defaultOptions, ...e }, this.verticesX = this.verticesX ?? e.verticesX, this.verticesY = this.verticesY ?? e.verticesY, this.width = this.width ?? e.width, this.height = this.height ?? e.height;
    const t = this.verticesX * this.verticesY, r = [], i = [], n = [], a = this.verticesX - 1, o = this.verticesY - 1, h = this.width / a, l = this.height / o;
    for (let u = 0; u < t; u++) {
      const d = u % this.verticesX, f = u / this.verticesX | 0;
      r.push(d * h, f * l), i.push(d / a, f / o);
    }
    const c = a * o;
    for (let u = 0; u < c; u++) {
      const d = u % a, f = u / a | 0, p = f * this.verticesX + d, g = f * this.verticesX + d + 1, m = (f + 1) * this.verticesX + d, y = (f + 1) * this.verticesX + d + 1;
      n.push(
        p,
        g,
        m,
        g,
        y,
        m
      );
    }
    this.buffers[0].data = new Float32Array(r), this.buffers[1].data = new Float32Array(i), this.indexBuffer.data = new Uint32Array(n), this.buffers[0].update(), this.buffers[1].update(), this.indexBuffer.update();
  }
};
Yl.defaultOptions = {
  width: 100,
  height: 100,
  verticesX: 10,
  verticesY: 10
};
let Ig = Yl;
class Ji {
  constructor() {
    this.batcherName = "default", this.packAsQuad = !1, this.indexOffset = 0, this.attributeOffset = 0, this.roundPixels = 0, this._batcher = null, this._batch = null, this._textureMatrixUpdateId = -1, this._uvUpdateId = -1;
  }
  get blendMode() {
    return this.renderable.groupBlendMode;
  }
  get topology() {
    return this._topology || this.geometry.topology;
  }
  set topology(e) {
    this._topology = e;
  }
  reset() {
    this.renderable = null, this.texture = null, this._batcher = null, this._batch = null, this.geometry = null, this._uvUpdateId = -1, this._textureMatrixUpdateId = -1;
  }
  /**
   * Sets the texture for the batchable mesh.
   * As it does so, it resets the texture matrix update ID.
   * this is to ensure that the texture matrix is recalculated when the uvs are referenced
   * @param value - The texture to set.
   */
  setTexture(e) {
    this.texture !== e && (this.texture = e, this._textureMatrixUpdateId = -1);
  }
  get uvs() {
    const t = this.geometry.getBuffer("aUV"), r = t.data;
    let i = r;
    const n = this.texture.textureMatrix;
    return n.isSimple || (i = this._transformedUvs, (this._textureMatrixUpdateId !== n._updateID || this._uvUpdateId !== t._updateID) && ((!i || i.length < r.length) && (i = this._transformedUvs = new Float32Array(r.length)), this._textureMatrixUpdateId = n._updateID, this._uvUpdateId = t._updateID, n.multiplyUvs(r, i))), i;
  }
  get positions() {
    return this.geometry.positions;
  }
  get indices() {
    return this.geometry.indices;
  }
  get color() {
    return this.renderable.groupColorAlpha;
  }
  get groupTransform() {
    return this.renderable.groupTransform;
  }
  get attributeSize() {
    return this.geometry.positions.length / 2;
  }
  get indexSize() {
    return this.geometry.indices.length;
  }
}
class ql {
  constructor(e, t) {
    this.localUniforms = new be({
      uTransformMatrix: { value: new L(), type: "mat3x3<f32>" },
      uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
      uRound: { value: 0, type: "f32" }
    }), this.localUniformsBindGroup = new Je({
      0: this.localUniforms
    }), this._meshDataHash = /* @__PURE__ */ Object.create(null), this._gpuBatchableMeshHash = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this.renderer = e, this._adaptor = t, this._adaptor.init(), e.renderableGC.addManagedHash(this, "_gpuBatchableMeshHash"), e.renderableGC.addManagedHash(this, "_meshDataHash");
  }
  validateRenderable(e) {
    const t = this._getMeshData(e), r = t.batched, i = e.batched;
    if (t.batched = i, r !== i)
      return !0;
    if (i) {
      const n = e._geometry;
      if (n.indices.length !== t.indexSize || n.positions.length !== t.vertexSize)
        return t.indexSize = n.indices.length, t.vertexSize = n.positions.length, !0;
      const a = this._getBatchableMesh(e);
      return a.texture.uid !== e._texture.uid && (a._textureMatrixUpdateId = -1), !a._batcher.checkAndUpdateTexture(
        a,
        e._texture
      );
    }
    return !1;
  }
  addRenderable(e, t) {
    const r = this.renderer.renderPipes.batch, { batched: i } = this._getMeshData(e);
    if (i) {
      const n = this._getBatchableMesh(e);
      n.setTexture(e._texture), n.geometry = e._geometry, r.addToBatch(n, t);
    } else
      r.break(t), t.add(e);
  }
  updateRenderable(e) {
    if (e.batched) {
      const t = this._gpuBatchableMeshHash[e.uid];
      t.setTexture(e._texture), t.geometry = e._geometry, t._batcher.updateElement(t);
    }
  }
  destroyRenderable(e) {
    this._meshDataHash[e.uid] = null;
    const t = this._gpuBatchableMeshHash[e.uid];
    t && (K.return(t), this._gpuBatchableMeshHash[e.uid] = null), e.off("destroyed", this._destroyRenderableBound);
  }
  execute(e) {
    if (!e.isRenderable)
      return;
    e.state.blendMode = tr(e.groupBlendMode, e.texture._source);
    const t = this.localUniforms;
    t.uniforms.uTransformMatrix = e.groupTransform, t.uniforms.uRound = this.renderer._roundPixels | e._roundPixels, t.update(), lr(
      e.groupColorAlpha,
      t.uniforms.uColor,
      0
    ), this._adaptor.execute(this, e);
  }
  _getMeshData(e) {
    return this._meshDataHash[e.uid] || this._initMeshData(e);
  }
  _initMeshData(e) {
    var t, r;
    return this._meshDataHash[e.uid] = {
      batched: e.batched,
      indexSize: (t = e._geometry.indices) == null ? void 0 : t.length,
      vertexSize: (r = e._geometry.positions) == null ? void 0 : r.length
    }, e.on("destroyed", this._destroyRenderableBound), this._meshDataHash[e.uid];
  }
  _getBatchableMesh(e) {
    return this._gpuBatchableMeshHash[e.uid] || this._initBatchableMesh(e);
  }
  _initBatchableMesh(e) {
    const t = K.get(Ji);
    return t.renderable = e, t.setTexture(e._texture), t.transform = e.groupTransform, t.roundPixels = this.renderer._roundPixels | e._roundPixels, this._gpuBatchableMeshHash[e.uid] = t, t;
  }
  destroy() {
    for (const e in this._gpuBatchableMeshHash)
      this._gpuBatchableMeshHash[e] && K.return(this._gpuBatchableMeshHash[e]);
    this._gpuBatchableMeshHash = null, this._meshDataHash = null, this.localUniforms = null, this.localUniformsBindGroup = null, this._adaptor.destroy(), this._adaptor = null, this.renderer = null;
  }
}
ql.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "mesh"
};
class Gg {
  execute(e, t) {
    const r = e.state, i = e.renderer, n = t.shader || e.defaultShader;
    n.resources.uTexture = t.texture._source, n.resources.uniforms = e.localUniforms;
    const a = i.gl, o = e.getBuffers(t);
    i.shader.bind(n), i.state.set(r), i.geometry.bind(o.geometry, n.glProgram);
    const l = o.geometry.indexBuffer.data.BYTES_PER_ELEMENT === 2 ? a.UNSIGNED_SHORT : a.UNSIGNED_INT;
    a.drawElements(a.TRIANGLES, t.particleChildren.length * 6, l, 0);
  }
}
class Ug {
  execute(e, t) {
    const r = e.renderer, i = t.shader || e.defaultShader;
    i.groups[0] = r.renderPipes.uniformBatch.getUniformBindGroup(e.localUniforms, !0), i.groups[1] = r.texture.getTextureBindGroup(t.texture);
    const n = e.state, a = e.getBuffers(t);
    r.encoder.draw({
      geometry: a.geometry,
      shader: t.shader || e.defaultShader,
      state: n,
      size: t.particleChildren.length * 6
    });
  }
}
function La(s, e = null) {
  const t = s * 6;
  if (t > 65535 ? e || (e = new Uint32Array(t)) : e || (e = new Uint16Array(t)), e.length !== t)
    throw new Error(`Out buffer length is incorrect, got ${e.length} and expected ${t}`);
  for (let r = 0, i = 0; r < t; r += 6, i += 4)
    e[r + 0] = i + 0, e[r + 1] = i + 1, e[r + 2] = i + 2, e[r + 3] = i + 0, e[r + 4] = i + 2, e[r + 5] = i + 3;
  return e;
}
function Fg(s) {
  return {
    dynamicUpdate: Na(s, !0),
    staticUpdate: Na(s, !1)
  };
}
function Na(s, e) {
  const t = [];
  t.push(`
      
        var index = 0;

        for (let i = 0; i < ps.length; ++i)
        {
            const p = ps[i];

            `);
  let r = 0;
  for (const n in s) {
    const a = s[n];
    if (e !== a.dynamic)
      continue;
    t.push(`offset = index + ${r}`), t.push(a.code);
    const o = at(a.format);
    r += o.stride / 4;
  }
  t.push(`
            index += stride * 4;
        }
    `), t.unshift(`
        var stride = ${r};
    `);
  const i = t.join(`
`);
  return new Function("ps", "f32v", "u32v", i);
}
class Dg {
  constructor(e) {
    this._size = 0, this._generateParticleUpdateCache = {};
    const t = this._size = e.size ?? 1e3, r = e.properties;
    let i = 0, n = 0;
    for (const c in r) {
      const u = r[c], d = at(u.format);
      u.dynamic ? n += d.stride : i += d.stride;
    }
    this._dynamicStride = n / 4, this._staticStride = i / 4, this.staticAttributeBuffer = new At(t * 4 * i), this.dynamicAttributeBuffer = new At(t * 4 * n), this.indexBuffer = La(t);
    const a = new Gt();
    let o = 0, h = 0;
    this._staticBuffer = new Ee({
      data: new Float32Array(1),
      label: "static-particle-buffer",
      shrinkToFit: !1,
      usage: q.VERTEX | q.COPY_DST
    }), this._dynamicBuffer = new Ee({
      data: new Float32Array(1),
      label: "dynamic-particle-buffer",
      shrinkToFit: !1,
      usage: q.VERTEX | q.COPY_DST
    });
    for (const c in r) {
      const u = r[c], d = at(u.format);
      u.dynamic ? (a.addAttribute(u.attributeName, {
        buffer: this._dynamicBuffer,
        stride: this._dynamicStride * 4,
        offset: o * 4,
        format: u.format
      }), o += d.size) : (a.addAttribute(u.attributeName, {
        buffer: this._staticBuffer,
        stride: this._staticStride * 4,
        offset: h * 4,
        format: u.format
      }), h += d.size);
    }
    a.addIndex(this.indexBuffer);
    const l = this.getParticleUpdate(r);
    this._dynamicUpload = l.dynamicUpdate, this._staticUpload = l.staticUpdate, this.geometry = a;
  }
  getParticleUpdate(e) {
    const t = Og(e);
    return this._generateParticleUpdateCache[t] ? this._generateParticleUpdateCache[t] : (this._generateParticleUpdateCache[t] = this.generateParticleUpdate(e), this._generateParticleUpdateCache[t]);
  }
  generateParticleUpdate(e) {
    return Fg(e);
  }
  update(e, t) {
    e.length > this._size && (t = !0, this._size = Math.max(e.length, this._size * 1.5 | 0), this.staticAttributeBuffer = new At(this._size * this._staticStride * 4 * 4), this.dynamicAttributeBuffer = new At(this._size * this._dynamicStride * 4 * 4), this.indexBuffer = La(this._size), this.geometry.indexBuffer.setDataWithSize(
      this.indexBuffer,
      this.indexBuffer.byteLength,
      !0
    ));
    const r = this.dynamicAttributeBuffer;
    if (this._dynamicUpload(e, r.float32View, r.uint32View), this._dynamicBuffer.setDataWithSize(
      this.dynamicAttributeBuffer.float32View,
      e.length * this._dynamicStride * 4,
      !0
    ), t) {
      const i = this.staticAttributeBuffer;
      this._staticUpload(e, i.float32View, i.uint32View), this._staticBuffer.setDataWithSize(
        i.float32View,
        e.length * this._staticStride * 4,
        !0
      );
    }
  }
  destroy() {
    this._staticBuffer.destroy(), this._dynamicBuffer.destroy(), this.geometry.destroy();
  }
}
function Og(s) {
  const e = [];
  for (const t in s) {
    const r = s[t];
    e.push(t, r.code, r.dynamic ? "d" : "s");
  }
  return e.join("_");
}
var Lg = `varying vec2 vUV;
varying vec4 vColor;

uniform sampler2D uTexture;

void main(void){
    vec4 color = texture2D(uTexture, vUV) * vColor;
    gl_FragColor = color;
}`, Ng = `attribute vec2 aVertex;
attribute vec2 aUV;
attribute vec4 aColor;

attribute vec2 aPosition;
attribute float aRotation;

uniform mat3 uTranslationMatrix;
uniform float uRound;
uniform vec2 uResolution;
uniform vec4 uColor;

varying vec2 vUV;
varying vec4 vColor;

vec2 roundPixels(vec2 position, vec2 targetSize)
{       
    return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
}

void main(void){
    float cosRotation = cos(aRotation);
    float sinRotation = sin(aRotation);
    float x = aVertex.x * cosRotation - aVertex.y * sinRotation;
    float y = aVertex.x * sinRotation + aVertex.y * cosRotation;

    vec2 v = vec2(x, y);
    v = v + aPosition;

    gl_Position = vec4((uTranslationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);

    if(uRound == 1.0)
    {
        gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
    }

    vUV = aUV;
    vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uColor;
}
`, Ha = `
struct ParticleUniforms {
  uProjectionMatrix:mat3x3<f32>,
  uColor:vec4<f32>,
  uResolution:vec2<f32>,
  uRoundPixels:f32,
};

@group(0) @binding(0) var<uniform> uniforms: ParticleUniforms;

@group(1) @binding(0) var uTexture: texture_2d<f32>;
@group(1) @binding(1) var uSampler : sampler;

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) color : vec4<f32>,
  };
@vertex
fn mainVertex(
  @location(0) aVertex: vec2<f32>,
  @location(1) aPosition: vec2<f32>,
  @location(2) aUV: vec2<f32>,
  @location(3) aColor: vec4<f32>,
  @location(4) aRotation: f32,
) -> VSOutput {
  
   let v = vec2(
       aVertex.x * cos(aRotation) - aVertex.y * sin(aRotation),
       aVertex.x * sin(aRotation) + aVertex.y * cos(aRotation)
   ) + aPosition;

   let position = vec4((uniforms.uProjectionMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);

    let vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uniforms.uColor;

  return VSOutput(
   position,
   aUV,
   vColor,
  );
}

@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
  @builtin(position) position: vec4<f32>,
) -> @location(0) vec4<f32> {

    var sample = textureSample(uTexture, uSampler, uv) * color;
   
    return sample;
}`;
class Hg extends Ie {
  constructor() {
    const e = yt.from({
      vertex: Ng,
      fragment: Lg
    }), t = lt.from({
      fragment: {
        source: Ha,
        entryPoint: "mainFragment"
      },
      vertex: {
        source: Ha,
        entryPoint: "mainVertex"
      }
    });
    super({
      glProgram: e,
      gpuProgram: t,
      resources: {
        // this will be replaced with the texture from the particle container
        uTexture: D.WHITE.source,
        // this will be replaced with the texture style from the particle container
        uSampler: new Qa({}),
        // this will be replaced with the local uniforms from the particle container
        uniforms: {
          uTranslationMatrix: { value: new L(), type: "mat3x3<f32>" },
          uColor: { value: new re(16777215), type: "vec4<f32>" },
          uRound: { value: 1, type: "f32" },
          uResolution: { value: [0, 0], type: "vec2<f32>" }
        }
      }
    });
  }
}
class Zl {
  /**
   * @param renderer - The renderer this sprite batch works for.
   * @param adaptor
   */
  constructor(e, t) {
    this.state = ke.for2d(), this._gpuBufferHash = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this.localUniforms = new be({
      uTranslationMatrix: { value: new L(), type: "mat3x3<f32>" },
      uColor: { value: new Float32Array(4), type: "vec4<f32>" },
      uRound: { value: 1, type: "f32" },
      uResolution: { value: [0, 0], type: "vec2<f32>" }
    }), this.renderer = e, this.adaptor = t, this.defaultShader = new Hg(), this.state = ke.for2d();
  }
  validateRenderable(e) {
    return !1;
  }
  addRenderable(e, t) {
    this.renderer.renderPipes.batch.break(t), t.add(e);
  }
  getBuffers(e) {
    return this._gpuBufferHash[e.uid] || this._initBuffer(e);
  }
  _initBuffer(e) {
    return this._gpuBufferHash[e.uid] = new Dg({
      size: e.particleChildren.length,
      properties: e._properties
    }), e.on("destroyed", this._destroyRenderableBound), this._gpuBufferHash[e.uid];
  }
  updateRenderable(e) {
  }
  destroyRenderable(e) {
    this._gpuBufferHash[e.uid].destroy(), this._gpuBufferHash[e.uid] = null, e.off("destroyed", this._destroyRenderableBound);
  }
  execute(e) {
    const t = e.particleChildren;
    if (t.length === 0)
      return;
    const r = this.renderer, i = this.getBuffers(e);
    e.texture || (e.texture = t[0].texture);
    const n = this.state;
    i.update(t, e._childrenDirty), e._childrenDirty = !1, n.blendMode = tr(e.blendMode, e.texture._source);
    const a = this.localUniforms.uniforms, o = a.uTranslationMatrix;
    e.worldTransform.copyTo(o), o.prepend(r.globalUniforms.globalUniformData.projectionMatrix), a.uResolution = r.globalUniforms.globalUniformData.resolution, a.uRound = r._roundPixels | e._roundPixels, lr(
      e.groupColorAlpha,
      a.uColor,
      0
    ), this.adaptor.execute(this, e);
  }
  /** Destroys the ParticleRenderer. */
  destroy() {
    this.defaultShader && (this.defaultShader.destroy(), this.defaultShader = null);
  }
}
class Ql extends Zl {
  constructor(e) {
    super(e, new Gg());
  }
}
Ql.extension = {
  type: [
    v.WebGLPipes
  ],
  name: "particle"
};
class Jl extends Zl {
  constructor(e) {
    super(e, new Ug());
  }
}
Jl.extension = {
  type: [
    v.WebGPUPipes
  ],
  name: "particle"
};
const ec = class tc extends Ig {
  constructor(e = {}) {
    e = { ...tc.defaultOptions, ...e }, super({
      width: e.width,
      height: e.height,
      verticesX: 4,
      verticesY: 4
    }), this.update(e);
  }
  /**
   * Updates the NineSliceGeometry with the options.
   * @param options - The options of the NineSliceGeometry.
   */
  update(e) {
    var t, r;
    this.width = e.width ?? this.width, this.height = e.height ?? this.height, this._originalWidth = e.originalWidth ?? this._originalWidth, this._originalHeight = e.originalHeight ?? this._originalHeight, this._leftWidth = e.leftWidth ?? this._leftWidth, this._rightWidth = e.rightWidth ?? this._rightWidth, this._topHeight = e.topHeight ?? this._topHeight, this._bottomHeight = e.bottomHeight ?? this._bottomHeight, this._anchorX = (t = e.anchor) == null ? void 0 : t.x, this._anchorY = (r = e.anchor) == null ? void 0 : r.y, this.updateUvs(), this.updatePositions();
  }
  /** Updates the positions of the vertices. */
  updatePositions() {
    const e = this.positions, {
      width: t,
      height: r,
      _leftWidth: i,
      _rightWidth: n,
      _topHeight: a,
      _bottomHeight: o,
      _anchorX: h,
      _anchorY: l
    } = this, c = i + n, u = t > c ? 1 : t / c, d = a + o, f = r > d ? 1 : r / d, p = Math.min(u, f), g = h * t, m = l * r;
    e[0] = e[8] = e[16] = e[24] = -g, e[2] = e[10] = e[18] = e[26] = i * p - g, e[4] = e[12] = e[20] = e[28] = t - n * p - g, e[6] = e[14] = e[22] = e[30] = t - g, e[1] = e[3] = e[5] = e[7] = -m, e[9] = e[11] = e[13] = e[15] = a * p - m, e[17] = e[19] = e[21] = e[23] = r - o * p - m, e[25] = e[27] = e[29] = e[31] = r - m, this.getBuffer("aPosition").update();
  }
  /** Updates the UVs of the vertices. */
  updateUvs() {
    const e = this.uvs;
    e[0] = e[8] = e[16] = e[24] = 0, e[1] = e[3] = e[5] = e[7] = 0, e[6] = e[14] = e[22] = e[30] = 1, e[25] = e[27] = e[29] = e[31] = 1;
    const t = 1 / this._originalWidth, r = 1 / this._originalHeight;
    e[2] = e[10] = e[18] = e[26] = t * this._leftWidth, e[9] = e[11] = e[13] = e[15] = r * this._topHeight, e[4] = e[12] = e[20] = e[28] = 1 - t * this._rightWidth, e[17] = e[19] = e[21] = e[23] = 1 - r * this._bottomHeight, this.getBuffer("aUV").update();
  }
};
ec.defaultOptions = {
  /** The width of the NineSlicePlane, setting this will actually modify the vertices and UV's of this plane. */
  width: 100,
  /** The height of the NineSlicePlane, setting this will actually modify the vertices and UV's of this plane. */
  height: 100,
  /** The width of the left column. */
  leftWidth: 10,
  /** The height of the top row. */
  topHeight: 10,
  /** The width of the right column. */
  rightWidth: 10,
  /** The height of the bottom row. */
  bottomHeight: 10,
  /** The original width of the texture */
  originalWidth: 100,
  /** The original height of the texture */
  originalHeight: 100
};
let Wg = ec;
class rc {
  constructor(e) {
    this._gpuSpriteHash = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_gpuSpriteHash");
  }
  addRenderable(e, t) {
    const r = this._getGpuSprite(e);
    e.didViewUpdate && this._updateBatchableSprite(e, r), this._renderer.renderPipes.batch.addToBatch(r, t);
  }
  updateRenderable(e) {
    const t = this._gpuSpriteHash[e.uid];
    e.didViewUpdate && this._updateBatchableSprite(e, t), t._batcher.updateElement(t);
  }
  validateRenderable(e) {
    const t = this._getGpuSprite(e);
    return !t._batcher.checkAndUpdateTexture(
      t,
      e._texture
    );
  }
  destroyRenderable(e) {
    const t = this._gpuSpriteHash[e.uid];
    K.return(t.geometry), K.return(t), this._gpuSpriteHash[e.uid] = null, e.off("destroyed", this._destroyRenderableBound);
  }
  _updateBatchableSprite(e, t) {
    t.geometry.update(e), t.setTexture(e._texture);
  }
  _getGpuSprite(e) {
    return this._gpuSpriteHash[e.uid] || this._initGPUSprite(e);
  }
  _initGPUSprite(e) {
    const t = K.get(Ji);
    return t.geometry = K.get(Wg), t.renderable = e, t.transform = e.groupTransform, t.texture = e._texture, t.roundPixels = this._renderer._roundPixels | e._roundPixels, this._gpuSpriteHash[e.uid] = t, e.didViewUpdate || this._updateBatchableSprite(e, t), e.on("destroyed", this._destroyRenderableBound), t;
  }
  destroy() {
    for (const e in this._gpuSpriteHash)
      this._gpuSpriteHash[e].geometry.destroy();
    this._gpuSpriteHash = null, this._renderer = null;
  }
}
rc.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "nineSliceSprite"
};
const zg = {
  name: "tiling-bit",
  vertex: {
    header: (
      /* wgsl */
      `
            struct TilingUniforms {
                uMapCoord:mat3x3<f32>,
                uClampFrame:vec4<f32>,
                uClampOffset:vec2<f32>,
                uTextureTransform:mat3x3<f32>,
                uSizeAnchor:vec4<f32>
            };

            @group(2) @binding(0) var<uniform> tilingUniforms: TilingUniforms;
            @group(2) @binding(1) var uTexture: texture_2d<f32>;
            @group(2) @binding(2) var uSampler: sampler;
        `
    ),
    main: (
      /* wgsl */
      `
            uv = (tilingUniforms.uTextureTransform * vec3(uv, 1.0)).xy;

            position = (position - tilingUniforms.uSizeAnchor.zw) * tilingUniforms.uSizeAnchor.xy;
        `
    )
  },
  fragment: {
    header: (
      /* wgsl */
      `
            struct TilingUniforms {
                uMapCoord:mat3x3<f32>,
                uClampFrame:vec4<f32>,
                uClampOffset:vec2<f32>,
                uTextureTransform:mat3x3<f32>,
                uSizeAnchor:vec4<f32>
            };

            @group(2) @binding(0) var<uniform> tilingUniforms: TilingUniforms;
            @group(2) @binding(1) var uTexture: texture_2d<f32>;
            @group(2) @binding(2) var uSampler: sampler;
        `
    ),
    main: (
      /* wgsl */
      `

            var coord = vUV + ceil(tilingUniforms.uClampOffset - vUV);
            coord = (tilingUniforms.uMapCoord * vec3(coord, 1.0)).xy;
            var unclamped = coord;
            coord = clamp(coord, tilingUniforms.uClampFrame.xy, tilingUniforms.uClampFrame.zw);

            var bias = 0.;

            if(unclamped.x == coord.x && unclamped.y == coord.y)
            {
                bias = -32.;
            } 

            outColor = textureSampleBias(uTexture, uSampler, coord, bias);
        `
    )
  }
}, Vg = {
  name: "tiling-bit",
  vertex: {
    header: (
      /* glsl */
      `
            uniform mat3 uTextureTransform;
            uniform vec4 uSizeAnchor;
        
        `
    ),
    main: (
      /* glsl */
      `
            uv = (uTextureTransform * vec3(aUV, 1.0)).xy;

            position = (position - uSizeAnchor.zw) * uSizeAnchor.xy;
        `
    )
  },
  fragment: {
    header: (
      /* glsl */
      `
            uniform sampler2D uTexture;
            uniform mat3 uMapCoord;
            uniform vec4 uClampFrame;
            uniform vec2 uClampOffset;
        `
    ),
    main: (
      /* glsl */
      `

        vec2 coord = vUV + ceil(uClampOffset - vUV);
        coord = (uMapCoord * vec3(coord, 1.0)).xy;
        vec2 unclamped = coord;
        coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);
        
        outColor = texture(uTexture, coord, unclamped == coord ? 0.0 : -32.0);// lod-bias very negative to force lod 0
    
        `
    )
  }
};
let ks, Is;
class $g extends Ie {
  constructor() {
    ks ?? (ks = ir({
      name: "tiling-sprite-shader",
      bits: [
        Zt,
        zg,
        ar
      ]
    })), Is ?? (Is = nr({
      name: "tiling-sprite-shader",
      bits: [
        Hi,
        Vg,
        or
      ]
    }));
    const e = new be({
      uMapCoord: { value: new L(), type: "mat3x3<f32>" },
      uClampFrame: { value: new Float32Array([0, 0, 1, 1]), type: "vec4<f32>" },
      uClampOffset: { value: new Float32Array([0, 0]), type: "vec2<f32>" },
      uTextureTransform: { value: new L(), type: "mat3x3<f32>" },
      uSizeAnchor: { value: new Float32Array([100, 100, 0.5, 0.5]), type: "vec4<f32>" }
    });
    super({
      glProgram: Is,
      gpuProgram: ks,
      resources: {
        localUniforms: new be({
          uTransformMatrix: { value: new L(), type: "mat3x3<f32>" },
          uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
          uRound: { value: 0, type: "f32" }
        }),
        tilingUniforms: e,
        uTexture: D.EMPTY.source,
        uSampler: D.EMPTY.source.style
      }
    });
  }
  updateUniforms(e, t, r, i, n, a) {
    const o = this.resources.tilingUniforms, h = a.width, l = a.height, c = a.textureMatrix, u = o.uniforms.uTextureTransform;
    u.set(
      r.a * h / e,
      r.b * h / t,
      r.c * l / e,
      r.d * l / t,
      r.tx / e,
      r.ty / t
    ), u.invert(), o.uniforms.uMapCoord = c.mapCoord, o.uniforms.uClampFrame = c.uClampFrame, o.uniforms.uClampOffset = c.uClampOffset, o.uniforms.uTextureTransform = u, o.uniforms.uSizeAnchor[0] = e, o.uniforms.uSizeAnchor[1] = t, o.uniforms.uSizeAnchor[2] = i, o.uniforms.uSizeAnchor[3] = n, a && (this.resources.uTexture = a.source, this.resources.uSampler = a.source.style);
  }
}
class Xg extends hr {
  constructor() {
    super({
      positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      indices: new Uint32Array([0, 1, 2, 0, 2, 3])
    });
  }
}
function jg(s, e) {
  const t = s.anchor.x, r = s.anchor.y;
  e[0] = -t * s.width, e[1] = -r * s.height, e[2] = (1 - t) * s.width, e[3] = -r * s.height, e[4] = (1 - t) * s.width, e[5] = (1 - r) * s.height, e[6] = -t * s.width, e[7] = (1 - r) * s.height;
}
function Yg(s, e, t, r) {
  let i = 0;
  const n = s.length / e, a = r.a, o = r.b, h = r.c, l = r.d, c = r.tx, u = r.ty;
  for (t *= e; i < n; ) {
    const d = s[t], f = s[t + 1];
    s[t] = a * d + h * f + c, s[t + 1] = o * d + l * f + u, t += e, i++;
  }
}
function Kg(s, e) {
  const t = s.texture, r = t.frame.width, i = t.frame.height;
  let n = 0, a = 0;
  s.applyAnchorToTexture && (n = s.anchor.x, a = s.anchor.y), e[0] = e[6] = -n, e[2] = e[4] = 1 - n, e[1] = e[3] = -a, e[5] = e[7] = 1 - a;
  const o = L.shared;
  o.copyFrom(s._tileTransform.matrix), o.tx /= s.width, o.ty /= s.height, o.invert(), o.scale(s.width / r, s.height / i), Yg(e, 2, 0, o);
}
const Pr = new Xg();
class sc {
  constructor(e) {
    this._state = ke.default2d, this._tilingSpriteDataHash = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_tilingSpriteDataHash");
  }
  validateRenderable(e) {
    const t = this._getTilingSpriteData(e), r = t.canBatch;
    this._updateCanBatch(e);
    const i = t.canBatch;
    if (i && i === r) {
      const { batchableMesh: n } = t;
      return !n._batcher.checkAndUpdateTexture(
        n,
        e.texture
      );
    }
    return r !== i;
  }
  addRenderable(e, t) {
    const r = this._renderer.renderPipes.batch;
    this._updateCanBatch(e);
    const i = this._getTilingSpriteData(e), { geometry: n, canBatch: a } = i;
    if (a) {
      i.batchableMesh || (i.batchableMesh = new Ji());
      const o = i.batchableMesh;
      e.didViewUpdate && (this._updateBatchableMesh(e), o.geometry = n, o.renderable = e, o.transform = e.groupTransform, o.setTexture(e._texture)), o.roundPixels = this._renderer._roundPixels | e._roundPixels, r.addToBatch(o, t);
    } else
      r.break(t), i.shader || (i.shader = new $g()), this.updateRenderable(e), t.add(e);
  }
  execute(e) {
    const { shader: t } = this._tilingSpriteDataHash[e.uid];
    t.groups[0] = this._renderer.globalUniforms.bindGroup;
    const r = t.resources.localUniforms.uniforms;
    r.uTransformMatrix = e.groupTransform, r.uRound = this._renderer._roundPixels | e._roundPixels, lr(
      e.groupColorAlpha,
      r.uColor,
      0
    ), this._state.blendMode = tr(e.groupBlendMode, e.texture._source), this._renderer.encoder.draw({
      geometry: Pr,
      shader: t,
      state: this._state
    });
  }
  updateRenderable(e) {
    const t = this._getTilingSpriteData(e), { canBatch: r } = t;
    if (r) {
      const { batchableMesh: i } = t;
      e.didViewUpdate && this._updateBatchableMesh(e), i._batcher.updateElement(i);
    } else if (e.didViewUpdate) {
      const { shader: i } = t;
      i.updateUniforms(
        e.width,
        e.height,
        e._tileTransform.matrix,
        e.anchor.x,
        e.anchor.y,
        e.texture
      );
    }
  }
  destroyRenderable(e) {
    var r;
    const t = this._getTilingSpriteData(e);
    t.batchableMesh = null, (r = t.shader) == null || r.destroy(), this._tilingSpriteDataHash[e.uid] = null, e.off("destroyed", this._destroyRenderableBound);
  }
  _getTilingSpriteData(e) {
    return this._tilingSpriteDataHash[e.uid] || this._initTilingSpriteData(e);
  }
  _initTilingSpriteData(e) {
    const t = new hr({
      indices: Pr.indices,
      positions: Pr.positions.slice(),
      uvs: Pr.uvs.slice()
    });
    return this._tilingSpriteDataHash[e.uid] = {
      canBatch: !0,
      renderable: e,
      geometry: t
    }, e.on("destroyed", this._destroyRenderableBound), this._tilingSpriteDataHash[e.uid];
  }
  _updateBatchableMesh(e) {
    const t = this._getTilingSpriteData(e), { geometry: r } = t, i = e.texture.source.style;
    i.addressMode !== "repeat" && (i.addressMode = "repeat", i.update()), Kg(e, r.uvs), jg(e, r.positions);
  }
  destroy() {
    for (const e in this._tilingSpriteDataHash)
      this.destroyRenderable(this._tilingSpriteDataHash[e].renderable);
    this._tilingSpriteDataHash = null, this._renderer = null;
  }
  _updateCanBatch(e) {
    const t = this._getTilingSpriteData(e), r = e.texture;
    let i = !0;
    return this._renderer.type === Oe.WEBGL && (i = this._renderer.context.supports.nonPowOf2wrapping), t.canBatch = r.textureMatrix.isSimple && (i || r.source.isPowerOfTwo), t.canBatch;
  }
}
sc.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "tilingSprite"
};
const qg = {
  name: "local-uniform-msdf-bit",
  vertex: {
    header: (
      /* wgsl */
      `
            struct LocalUniforms {
                uColor:vec4<f32>,
                uTransformMatrix:mat3x3<f32>,
                uDistance: f32,
                uRound:f32,
            }

            @group(2) @binding(0) var<uniform> localUniforms : LocalUniforms;
        `
    ),
    main: (
      /* wgsl */
      `
            vColor *= localUniforms.uColor;
            modelMatrix *= localUniforms.uTransformMatrix;
        `
    ),
    end: (
      /* wgsl */
      `
            if(localUniforms.uRound == 1)
            {
                vPosition = vec4(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
            }
        `
    )
  },
  fragment: {
    header: (
      /* wgsl */
      `
            struct LocalUniforms {
                uColor:vec4<f32>,
                uTransformMatrix:mat3x3<f32>,
                uDistance: f32
            }

            @group(2) @binding(0) var<uniform> localUniforms : LocalUniforms;
         `
    ),
    main: (
      /* wgsl */
      ` 
            outColor = vec4<f32>(calculateMSDFAlpha(outColor, localUniforms.uColor, localUniforms.uDistance));
        `
    )
  }
}, Zg = {
  name: "local-uniform-msdf-bit",
  vertex: {
    header: (
      /* glsl */
      `
            uniform mat3 uTransformMatrix;
            uniform vec4 uColor;
            uniform float uRound;
        `
    ),
    main: (
      /* glsl */
      `
            vColor *= uColor;
            modelMatrix *= uTransformMatrix;
        `
    ),
    end: (
      /* glsl */
      `
            if(uRound == 1.)
            {
                gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
            }
        `
    )
  },
  fragment: {
    header: (
      /* glsl */
      `
            uniform float uDistance;
         `
    ),
    main: (
      /* glsl */
      ` 
            outColor = vec4(calculateMSDFAlpha(outColor, vColor, uDistance));
        `
    )
  }
}, Qg = {
  name: "msdf-bit",
  fragment: {
    header: (
      /* wgsl */
      `
            fn calculateMSDFAlpha(msdfColor:vec4<f32>, shapeColor:vec4<f32>, distance:f32) -> f32 {
                
                // MSDF
                var median = msdfColor.r + msdfColor.g + msdfColor.b -
                    min(msdfColor.r, min(msdfColor.g, msdfColor.b)) -
                    max(msdfColor.r, max(msdfColor.g, msdfColor.b));
            
                // SDF
                median = min(median, msdfColor.a);

                var screenPxDistance = distance * (median - 0.5);
                var alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);
                if (median < 0.01) {
                    alpha = 0.0;
                } else if (median > 0.99) {
                    alpha = 1.0;
                }

                // Gamma correction for coverage-like alpha
                var luma: f32 = dot(shapeColor.rgb, vec3<f32>(0.299, 0.587, 0.114));
                var gamma: f32 = mix(1.0, 1.0 / 2.2, luma);
                var coverage: f32 = pow(shapeColor.a * alpha, gamma);

                return coverage;
             
            }
        `
    )
  }
}, Jg = {
  name: "msdf-bit",
  fragment: {
    header: (
      /* glsl */
      `
            float calculateMSDFAlpha(vec4 msdfColor, vec4 shapeColor, float distance) {
                
                // MSDF
                float median = msdfColor.r + msdfColor.g + msdfColor.b -
                                min(msdfColor.r, min(msdfColor.g, msdfColor.b)) -
                                max(msdfColor.r, max(msdfColor.g, msdfColor.b));
               
                // SDF
                median = min(median, msdfColor.a);
            
                float screenPxDistance = distance * (median - 0.5);
                float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);
           
                if (median < 0.01) {
                    alpha = 0.0;
                } else if (median > 0.99) {
                    alpha = 1.0;
                }

                // Gamma correction for coverage-like alpha
                float luma = dot(shapeColor.rgb, vec3(0.299, 0.587, 0.114));
                float gamma = mix(1.0, 1.0 / 2.2, luma);
                float coverage = pow(shapeColor.a * alpha, gamma);  
              
                return coverage;
            }
        `
    )
  }
};
let Gs, Us;
class e_ extends Ie {
  constructor() {
    const e = new be({
      uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
      uTransformMatrix: { value: new L(), type: "mat3x3<f32>" },
      uDistance: { value: 4, type: "f32" },
      uRound: { value: 0, type: "f32" }
    }), t = It();
    Gs ?? (Gs = ir({
      name: "sdf-shader",
      bits: [
        wi,
        Pi(t),
        qg,
        Qg,
        ar
      ]
    })), Us ?? (Us = nr({
      name: "sdf-shader",
      bits: [
        Ai,
        Ci(t),
        Zg,
        Jg,
        or
      ]
    })), super({
      glProgram: Us,
      gpuProgram: Gs,
      resources: {
        localUniforms: e,
        batchSamplers: Ei(t)
      }
    });
  }
}
class ic {
  constructor(e) {
    this._gpuBitmapText = {}, this._destroyRenderableBound = this.destroyRenderable.bind(this), this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_gpuBitmapText");
  }
  validateRenderable(e) {
    const t = this._getGpuBitmapText(e);
    return e._didTextUpdate && (e._didTextUpdate = !1, this._updateContext(e, t)), this._renderer.renderPipes.graphics.validateRenderable(t);
  }
  addRenderable(e, t) {
    const r = this._getGpuBitmapText(e);
    Wa(e, r), e._didTextUpdate && (e._didTextUpdate = !1, this._updateContext(e, r)), this._renderer.renderPipes.graphics.addRenderable(r, t), r.context.customShader && this._updateDistanceField(e);
  }
  destroyRenderable(e) {
    e.off("destroyed", this._destroyRenderableBound), this._destroyRenderableByUid(e.uid);
  }
  _destroyRenderableByUid(e) {
    const t = this._gpuBitmapText[e].context;
    t.customShader && (K.return(t.customShader), t.customShader = null), K.return(this._gpuBitmapText[e]), this._gpuBitmapText[e] = null;
  }
  updateRenderable(e) {
    const t = this._getGpuBitmapText(e);
    Wa(e, t), this._renderer.renderPipes.graphics.updateRenderable(t), t.context.customShader && this._updateDistanceField(e);
  }
  _updateContext(e, t) {
    const { context: r } = t, i = ri.getFont(e.text, e._style);
    r.clear(), i.distanceField.type !== "none" && (r.customShader || (r.customShader = K.get(e_)));
    const n = Array.from(e.text), a = e._style;
    let o = i.baseLineOffset;
    const h = dh(n, a, i, !0);
    let l = 0;
    const c = a.padding, u = h.scale;
    let d = h.width, f = h.height + h.offsetY;
    a._stroke && (d += a._stroke.width / u, f += a._stroke.width / u), r.translate(-e._anchor._x * d - c, -e._anchor._y * f - c).scale(u, u);
    const p = i.applyFillAsTint ? a._fill.color : 16777215;
    for (let g = 0; g < h.lines.length; g++) {
      const m = h.lines[g];
      for (let y = 0; y < m.charPositions.length; y++) {
        const T = n[l++], S = i.chars[T];
        S != null && S.texture && r.texture(
          S.texture,
          p || "black",
          Math.round(m.charPositions[y] + S.xOffset),
          Math.round(o + S.yOffset)
        );
      }
      o += i.lineHeight;
    }
  }
  _getGpuBitmapText(e) {
    return this._gpuBitmapText[e.uid] || this.initGpuText(e);
  }
  initGpuText(e) {
    const t = K.get(Ve);
    return this._gpuBitmapText[e.uid] = t, this._updateContext(e, t), e.on("destroyed", this._destroyRenderableBound), this._gpuBitmapText[e.uid];
  }
  _updateDistanceField(e) {
    const t = this._getGpuBitmapText(e).context, r = e._style.fontFamily, i = he.get(`${r}-bitmap`), { a: n, b: a, c: o, d: h } = e.groupTransform, l = Math.sqrt(n * n + a * a), c = Math.sqrt(o * o + h * h), u = (Math.abs(l) + Math.abs(c)) / 2, d = i.baseRenderedFontSize / e._style.fontSize, f = u * i.distanceField.range * (1 / d);
    t.customShader.resources.localUniforms.uniforms.uDistance = f;
  }
  destroy() {
    for (const e in this._gpuBitmapText)
      this._destroyRenderableByUid(e);
    this._gpuBitmapText = null, this._renderer = null;
  }
}
ic.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "bitmapText"
};
function Wa(s, e) {
  e.groupTransform = s.groupTransform, e.groupColorAlpha = s.groupColorAlpha, e.groupColor = s.groupColor, e.groupBlendMode = s.groupBlendMode, e.globalDisplayStatus = s.globalDisplayStatus, e.groupTransform = s.groupTransform, e.localDisplayStatus = s.localDisplayStatus, e.groupAlpha = s.groupAlpha, e._roundPixels = s._roundPixels;
}
function ci(s, e) {
  const { texture: t, bounds: r } = s;
  ro(r, e._anchor, t);
  const i = e._style.padding;
  r.minX -= i, r.minY -= i, r.maxX -= i, r.maxY -= i;
}
class nc {
  constructor(e) {
    this._gpuText = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this._renderer = e, this._renderer.runners.resolutionChange.add(this), this._renderer.renderableGC.addManagedHash(this, "_gpuText");
  }
  resolutionChange() {
    for (const e in this._gpuText) {
      const t = this._gpuText[e];
      if (!t)
        continue;
      const r = t.batchableSprite.renderable;
      r._autoResolution && (r._resolution = this._renderer.resolution, r.onViewUpdate());
    }
  }
  validateRenderable(e) {
    const t = this._getGpuText(e), r = e._getKey();
    return t.textureNeedsUploading ? (t.textureNeedsUploading = !1, !0) : t.currentKey !== r;
  }
  addRenderable(e, t) {
    const i = this._getGpuText(e).batchableSprite;
    e._didTextUpdate && this._updateText(e), this._renderer.renderPipes.batch.addToBatch(i, t);
  }
  updateRenderable(e) {
    const r = this._getGpuText(e).batchableSprite;
    e._didTextUpdate && this._updateText(e), r._batcher.updateElement(r);
  }
  destroyRenderable(e) {
    e.off("destroyed", this._destroyRenderableBound), this._destroyRenderableById(e.uid);
  }
  _destroyRenderableById(e) {
    const t = this._gpuText[e];
    this._renderer.htmlText.decreaseReferenceCount(t.currentKey), K.return(t.batchableSprite), this._gpuText[e] = null;
  }
  _updateText(e) {
    const t = e._getKey(), r = this._getGpuText(e), i = r.batchableSprite;
    r.currentKey !== t && this._updateGpuText(e).catch((n) => {
      console.error(n);
    }), e._didTextUpdate = !1, ci(i, e);
  }
  async _updateGpuText(e) {
    e._didTextUpdate = !1;
    const t = this._getGpuText(e);
    if (t.generatingTexture)
      return;
    const r = e._getKey();
    this._renderer.htmlText.decreaseReferenceCount(t.currentKey), t.generatingTexture = !0, t.currentKey = r;
    const i = e.resolution ?? this._renderer.resolution, n = await this._renderer.htmlText.getManagedTexture(
      e.text,
      i,
      e._style,
      e._getKey()
    ), a = t.batchableSprite;
    a.texture = t.texture = n, t.generatingTexture = !1, t.textureNeedsUploading = !0, e.onViewUpdate(), ci(a, e);
  }
  _getGpuText(e) {
    return this._gpuText[e.uid] || this.initGpuText(e);
  }
  initGpuText(e) {
    const t = {
      texture: D.EMPTY,
      currentKey: "--",
      batchableSprite: K.get(jr),
      textureNeedsUploading: !1,
      generatingTexture: !1
    }, r = t.batchableSprite;
    return r.renderable = e, r.transform = e.groupTransform, r.texture = D.EMPTY, r.bounds = { minX: 0, maxX: 1, minY: 0, maxY: 0 }, r.roundPixels = this._renderer._roundPixels | e._roundPixels, e._resolution = e._autoResolution ? this._renderer.resolution : e.resolution, this._gpuText[e.uid] = t, e.on("destroyed", this._destroyRenderableBound), t;
  }
  destroy() {
    for (const e in this._gpuText)
      this._destroyRenderableById(e);
    this._gpuText = null, this._renderer = null;
  }
}
nc.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "htmlText"
};
function t_() {
  const { userAgent: s } = Z.get().getNavigator();
  return /^((?!chrome|android).)*safari/i.test(s);
}
const r_ = new ye();
function ac(s, e, t, r) {
  const i = r_;
  i.minX = 0, i.minY = 0, i.maxX = s.width / r | 0, i.maxY = s.height / r | 0;
  const n = xe.getOptimalTexture(
    i.width,
    i.height,
    r,
    !1
  );
  return n.source.uploadMethodId = "image", n.source.resource = s, n.source.alphaMode = "premultiply-alpha-on-upload", n.frame.width = e / r, n.frame.height = t / r, n.source.emit("update", n.source), n.updateUvs(), n;
}
function s_(s, e) {
  const t = e.fontFamily, r = [], i = {}, n = /font-family:([^;"\s]+)/g, a = s.match(n);
  function o(h) {
    i[h] || (r.push(h), i[h] = !0);
  }
  if (Array.isArray(t))
    for (let h = 0; h < t.length; h++)
      o(t[h]);
  else
    o(t);
  a && a.forEach((h) => {
    const l = h.split(":")[1].trim();
    o(l);
  });
  for (const h in e.tagStyles) {
    const l = e.tagStyles[h].fontFamily;
    o(l);
  }
  return r;
}
async function i_(s) {
  const t = await (await Z.get().fetch(s)).blob(), r = new FileReader();
  return await new Promise((n, a) => {
    r.onloadend = () => n(r.result), r.onerror = a, r.readAsDataURL(t);
  });
}
async function za(s, e) {
  const t = await i_(e);
  return `@font-face {
        font-family: "${s.fontFamily}";
        src: url('${t}');
        font-weight: ${s.fontWeight};
        font-style: ${s.fontStyle};
    }`;
}
const Cr = /* @__PURE__ */ new Map();
async function n_(s, e, t) {
  const r = s.filter((i) => he.has(`${i}-and-url`)).map((i, n) => {
    if (!Cr.has(i)) {
      const { url: a } = he.get(`${i}-and-url`);
      n === 0 ? Cr.set(i, za({
        fontWeight: e.fontWeight,
        fontStyle: e.fontStyle,
        fontFamily: i
      }, a)) : Cr.set(i, za({
        fontWeight: t.fontWeight,
        fontStyle: t.fontStyle,
        fontFamily: i
      }, a));
    }
    return Cr.get(i);
  });
  return (await Promise.all(r)).join(`
`);
}
function a_(s, e, t, r, i) {
  const { domElement: n, styleElement: a, svgRoot: o } = i;
  n.innerHTML = `<style>${e.cssStyle}</style><div style='padding:0;'>${s}</div>`, n.setAttribute("style", `transform: scale(${t});transform-origin: top left; display: inline-block`), a.textContent = r;
  const { width: h, height: l } = i.image;
  return o.setAttribute("width", h.toString()), o.setAttribute("height", l.toString()), new XMLSerializer().serializeToString(o);
}
function o_(s, e) {
  const t = et.getOptimalCanvasAndContext(
    s.width,
    s.height,
    e
  ), { context: r } = t;
  return r.clearRect(0, 0, s.width, s.height), r.drawImage(s, 0, 0), t;
}
function h_(s, e, t) {
  return new Promise(async (r) => {
    t && await new Promise((i) => setTimeout(i, 100)), s.onload = () => {
      r();
    }, s.src = `data:image/svg+xml;charset=utf8,${encodeURIComponent(e)}`, s.crossOrigin = "anonymous";
  });
}
class en {
  constructor(e) {
    this._activeTextures = {}, this._renderer = e, this._createCanvas = e.type === Oe.WEBGPU;
  }
  getTexture(e) {
    return this._buildTexturePromise(
      e.text,
      e.resolution,
      e.style
    );
  }
  getManagedTexture(e, t, r, i) {
    if (this._activeTextures[i])
      return this._increaseReferenceCount(i), this._activeTextures[i].promise;
    const n = this._buildTexturePromise(e, t, r).then((a) => (this._activeTextures[i].texture = a, a));
    return this._activeTextures[i] = {
      texture: null,
      promise: n,
      usageCount: 1
    }, n;
  }
  async _buildTexturePromise(e, t, r) {
    const i = K.get(Ph), n = s_(e, r), a = await n_(
      n,
      r,
      Li.defaultTextStyle
    ), o = jp(e, r, a, i), h = Math.ceil(Math.ceil(Math.max(1, o.width) + r.padding * 2) * t), l = Math.ceil(Math.ceil(Math.max(1, o.height) + r.padding * 2) * t), c = i.image, u = 2;
    c.width = (h | 0) + u, c.height = (l | 0) + u;
    const d = a_(e, r, t, a, i);
    await h_(c, d, t_() && n.length > 0);
    const f = c;
    let p;
    this._createCanvas && (p = o_(c, t));
    const g = ac(
      p ? p.canvas : f,
      c.width - u,
      c.height - u,
      t
    );
    return this._createCanvas && (this._renderer.texture.initSource(g.source), et.returnCanvasAndContext(p)), K.return(i), g;
  }
  _increaseReferenceCount(e) {
    this._activeTextures[e].usageCount++;
  }
  decreaseReferenceCount(e) {
    const t = this._activeTextures[e];
    t && (t.usageCount--, t.usageCount === 0 && (t.texture ? this._cleanUp(t) : t.promise.then((r) => {
      t.texture = r, this._cleanUp(t);
    }).catch(() => {
      V("HTMLTextSystem: Failed to clean texture");
    }), this._activeTextures[e] = null));
  }
  _cleanUp(e) {
    xe.returnTexture(e.texture), e.texture.source.resource = null, e.texture.source.uploadMethodId = "unknown";
  }
  getReferenceCount(e) {
    return this._activeTextures[e].usageCount;
  }
  destroy() {
    this._activeTextures = null;
  }
}
en.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem,
    v.CanvasSystem
  ],
  name: "htmlText"
};
en.defaultFontOptions = {
  fontFamily: "Arial",
  fontStyle: "normal",
  fontWeight: "normal"
};
class oc {
  constructor(e) {
    this._gpuText = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this._renderer = e, this._renderer.runners.resolutionChange.add(this), this._renderer.renderableGC.addManagedHash(this, "_gpuText");
  }
  resolutionChange() {
    for (const e in this._gpuText) {
      const t = this._gpuText[e];
      if (!t)
        continue;
      const r = t.batchableSprite.renderable;
      r._autoResolution && (r._resolution = this._renderer.resolution, r.onViewUpdate());
    }
  }
  validateRenderable(e) {
    const t = this._getGpuText(e), r = e._getKey();
    return t.currentKey !== r;
  }
  addRenderable(e, t) {
    const i = this._getGpuText(e).batchableSprite;
    e._didTextUpdate && this._updateText(e), this._renderer.renderPipes.batch.addToBatch(i, t);
  }
  updateRenderable(e) {
    const r = this._getGpuText(e).batchableSprite;
    e._didTextUpdate && this._updateText(e), r._batcher.updateElement(r);
  }
  destroyRenderable(e) {
    e.off("destroyed", this._destroyRenderableBound), this._destroyRenderableById(e.uid);
  }
  _destroyRenderableById(e) {
    const t = this._gpuText[e];
    this._renderer.canvasText.decreaseReferenceCount(t.currentKey), K.return(t.batchableSprite), this._gpuText[e] = null;
  }
  _updateText(e) {
    const t = e._getKey(), r = this._getGpuText(e), i = r.batchableSprite;
    r.currentKey !== t && this._updateGpuText(e), e._didTextUpdate = !1, ci(i, e);
  }
  _updateGpuText(e) {
    const t = this._getGpuText(e), r = t.batchableSprite;
    t.texture && this._renderer.canvasText.decreaseReferenceCount(t.currentKey), t.texture = r.texture = this._renderer.canvasText.getManagedTexture(e), t.currentKey = e._getKey(), r.texture = t.texture;
  }
  _getGpuText(e) {
    return this._gpuText[e.uid] || this.initGpuText(e);
  }
  initGpuText(e) {
    const t = {
      texture: null,
      currentKey: "--",
      batchableSprite: K.get(jr)
    };
    return t.batchableSprite.renderable = e, t.batchableSprite.transform = e.groupTransform, t.batchableSprite.bounds = { minX: 0, maxX: 1, minY: 0, maxY: 0 }, t.batchableSprite.roundPixels = this._renderer._roundPixels | e._roundPixels, this._gpuText[e.uid] = t, e._resolution = e._autoResolution ? this._renderer.resolution : e.resolution, this._updateText(e), e.on("destroyed", this._destroyRenderableBound), t;
  }
  destroy() {
    for (const e in this._gpuText)
      this._destroyRenderableById(e);
    this._gpuText = null, this._renderer = null;
  }
}
oc.extension = {
  type: [
    v.WebGLPipes,
    v.WebGPUPipes,
    v.CanvasPipes
  ],
  name: "text"
};
function Va(s, e, t) {
  for (let r = 0, i = 4 * t * e; r < e; ++r, i += 4)
    if (s[i + 3] !== 0)
      return !1;
  return !0;
}
function $a(s, e, t, r, i) {
  const n = 4 * e;
  for (let a = r, o = r * n + 4 * t; a <= i; ++a, o += n)
    if (s[o + 3] !== 0)
      return !1;
  return !0;
}
function l_(s, e = 1) {
  const { width: t, height: r } = s, i = s.getContext("2d", {
    willReadFrequently: !0
  });
  if (i === null)
    throw new TypeError("Failed to get canvas 2D context");
  const a = i.getImageData(0, 0, t, r).data;
  let o = 0, h = 0, l = t - 1, c = r - 1;
  for (; h < r && Va(a, t, h); )
    ++h;
  if (h === r)
    return ne.EMPTY;
  for (; Va(a, t, c); )
    --c;
  for (; $a(a, t, o, h, c); )
    ++o;
  for (; $a(a, t, l, h, c); )
    --l;
  return ++l, ++c, new ne(o / e, h / e, (l - o) / e, (c - h) / e);
}
class hc {
  constructor(e) {
    this._activeTextures = {}, this._renderer = e;
  }
  getTextureSize(e, t, r) {
    const i = qe.measureText(e || " ", r);
    let n = Math.ceil(Math.ceil(Math.max(1, i.width) + r.padding * 2) * t), a = Math.ceil(Math.ceil(Math.max(1, i.height) + r.padding * 2) * t);
    return n = Math.ceil(n - 1e-6), a = Math.ceil(a - 1e-6), n = Et(n), a = Et(a), { width: n, height: a };
  }
  getTexture(e, t, r, i) {
    typeof e == "string" && (X("8.0.0", "CanvasTextSystem.getTexture: Use object TextOptions instead of separate arguments"), e = {
      text: e,
      style: r,
      resolution: t
    }), e.style instanceof tt || (e.style = new tt(e.style));
    const { texture: n, canvasAndContext: a } = this.createTextureAndCanvas(
      e
    );
    return this._renderer.texture.initSource(n._source), et.returnCanvasAndContext(a), n;
  }
  createTextureAndCanvas(e) {
    const { text: t, style: r } = e, i = e.resolution ?? this._renderer.resolution, n = qe.measureText(t || " ", r), a = Math.ceil(Math.ceil(Math.max(1, n.width) + r.padding * 2) * i), o = Math.ceil(Math.ceil(Math.max(1, n.height) + r.padding * 2) * i), h = et.getOptimalCanvasAndContext(a, o), { canvas: l } = h;
    this.renderTextToCanvas(t, r, i, h);
    const c = ac(l, a, o, i);
    if (r.trim) {
      const u = l_(l, i);
      c.frame.copyFrom(u), c.updateUvs();
    }
    return { texture: c, canvasAndContext: h };
  }
  getManagedTexture(e) {
    e._resolution = e._autoResolution ? this._renderer.resolution : e.resolution;
    const t = e._getKey();
    if (this._activeTextures[t])
      return this._increaseReferenceCount(t), this._activeTextures[t].texture;
    const { texture: r, canvasAndContext: i } = this.createTextureAndCanvas(e);
    return this._activeTextures[t] = {
      canvasAndContext: i,
      texture: r,
      usageCount: 1
    }, r;
  }
  _increaseReferenceCount(e) {
    this._activeTextures[e].usageCount++;
  }
  /**
   * Returns a texture that was created wit the above `getTexture` function.
   * Handy if you are done with a texture and want to return it to the pool.
   * @param texture - The texture to be returned.
   */
  returnTexture(e) {
    const t = e.source;
    t.resource = null, t.uploadMethodId = "unknown", t.alphaMode = "no-premultiply-alpha", xe.returnTexture(e);
  }
  decreaseReferenceCount(e) {
    const t = this._activeTextures[e];
    t.usageCount--, t.usageCount === 0 && (et.returnCanvasAndContext(t.canvasAndContext), this.returnTexture(t.texture), this._activeTextures[e] = null);
  }
  getReferenceCount(e) {
    return this._activeTextures[e].usageCount;
  }
  /**
   * Renders text to its canvas, and updates its texture.
   *
   * By default this is used internally to ensure the texture is correct before rendering,
   * but it can be used called externally, for example from this class to 'pre-generate' the texture from a piece of text,
   * and then shared across multiple Sprites.
   * @param text
   * @param style
   * @param resolution
   * @param canvasAndContext
   */
  renderTextToCanvas(e, t, r, i) {
    var T, S, A, M;
    const { canvas: n, context: a } = i, o = Lr(t), h = qe.measureText(e || " ", t), l = h.lines, c = h.lineHeight, u = h.lineWidths, d = h.maxLineWidth, f = h.fontProperties, p = n.height;
    if (a.resetTransform(), a.scale(r, r), a.textBaseline = t.textBaseline, (T = t._stroke) != null && T.width) {
      const P = t._stroke;
      a.lineWidth = P.width, a.miterLimit = P.miterLimit, a.lineJoin = P.join, a.lineCap = P.cap;
    }
    a.font = o;
    let g, m;
    const y = t.dropShadow ? 2 : 1;
    for (let P = 0; P < y; ++P) {
      const E = t.dropShadow && P === 0, N = E ? Math.ceil(Math.max(1, p) + t.padding * 2) : 0, I = N * r;
      if (E) {
        a.fillStyle = "black", a.strokeStyle = "black";
        const F = t.dropShadow, $ = F.color, ae = F.alpha;
        a.shadowColor = re.shared.setValue($).setAlpha(ae).toRgbaString();
        const ge = F.blur * r, _ = F.distance * r;
        a.shadowBlur = ge, a.shadowOffsetX = Math.cos(F.angle) * _, a.shadowOffsetY = Math.sin(F.angle) * _ + I;
      } else {
        if (a.fillStyle = t._fill ? Nr(t._fill, a, h) : null, (S = t._stroke) != null && S.width) {
          const F = t._stroke.width * t._stroke.alignment;
          a.strokeStyle = Nr(t._stroke, a, h, F);
        }
        a.shadowColor = "black";
      }
      let k = (c - f.fontSize) / 2;
      c - f.fontSize < 0 && (k = 0);
      const G = ((A = t._stroke) == null ? void 0 : A.width) ?? 0;
      for (let F = 0; F < l.length; F++)
        g = G / 2, m = G / 2 + F * c + f.ascent + k, t.align === "right" ? g += d - u[F] : t.align === "center" && (g += (d - u[F]) / 2), (M = t._stroke) != null && M.width && this._drawLetterSpacing(
          l[F],
          t,
          i,
          g + t.padding,
          m + t.padding - N,
          !0
        ), t._fill !== void 0 && this._drawLetterSpacing(
          l[F],
          t,
          i,
          g + t.padding,
          m + t.padding - N
        );
    }
  }
  /**
   * Render the text with letter-spacing.
   * @param text - The text to draw
   * @param style
   * @param canvasAndContext
   * @param x - Horizontal position to draw the text
   * @param y - Vertical position to draw the text
   * @param isStroke - Is this drawing for the outside stroke of the
   *  text? If not, it's for the inside fill
   */
  _drawLetterSpacing(e, t, r, i, n, a = !1) {
    const { context: o } = r, h = t.letterSpacing;
    let l = !1;
    if (qe.experimentalLetterSpacingSupported && (qe.experimentalLetterSpacing ? (o.letterSpacing = `${h}px`, o.textLetterSpacing = `${h}px`, l = !0) : (o.letterSpacing = "0px", o.textLetterSpacing = "0px")), h === 0 || l) {
      a ? o.strokeText(e, i, n) : o.fillText(e, i, n);
      return;
    }
    let c = i;
    const u = qe.graphemeSegmenter(e);
    let d = o.measureText(e).width, f = 0;
    for (let p = 0; p < u.length; ++p) {
      const g = u[p];
      a ? o.strokeText(g, c, n) : o.fillText(g, c, n);
      let m = "";
      for (let y = p + 1; y < u.length; ++y)
        m += u[y];
      f = o.measureText(m).width, c += d - f + h, d = f;
    }
  }
  destroy() {
    this._activeTextures = null;
  }
}
hc.extension = {
  type: [
    v.WebGLSystem,
    v.WebGPUSystem,
    v.CanvasSystem
  ],
  name: "canvasText"
};
z.add(fc, pc);
const Fs = (s, e, t, r) => (i) => {
  if (i <= 0) return 0;
  if (i >= 1) return 1;
  let n = 0, a = 1, o = i;
  for (let h = 0; h < 24; h++)
    o = (n + a) / 2, 3 * (1 - o) ** 2 * o * s + 3 * (1 - o) * o * o * t + o ** 3 < i ? n = o : a = o;
  return 3 * (1 - o) ** 2 * o * e + 3 * (1 - o) * o * o * r + o ** 3;
}, c_ = {
  /** the default: every beat, every chain link */
  soft: Fs(0.25, 0, 0.75, 1),
  /** arriving and settling (fast start, long slow stop) */
  settle: Fs(0.36, 0.64, 0.7, 1),
  /** leaving a hold toward an accent */
  leave: Fs(0.25, 0, 0.63, 0.5),
  linear: (s) => s,
  hold: () => 0
}, lc = (s, e) => {
  if (s <= e[0][0]) return e[0][1];
  for (let t = 1; t < e.length; t++) {
    const [r, i, n = "soft"] = e[t];
    if (s <= r) {
      const [a, o] = e[t - 1];
      return o + (i - o) * c_[n]((s - a) / (r - a || 1));
    }
  }
  return e[e.length - 1][1];
}, u_ = { anticipate: 133, wink: 267, pop1: 433, back: 667, pop2: 1167, done: 1500 }, cc = (s, e = u_) => lc(s, [[0, 0], [e.anticipate, -0.35], [e.pop1, 1], [e.back, 0.15, "settle"], [e.pop2, 0.85], [e.done, 0, "settle"]]), Ds = 567, De = (s) => Math.max(0, Math.min(1, s)), nt = (s) => {
  const e = De(s);
  return e * e * (3 - 2 * e);
}, d_ = (s, e = "") => {
  const t = De(s), r = e === "H2" || e === "H4", i = e === "H3" || e === "H5", a = e.startsWith("H") || e === "S" ? cc(t * 1500) : lc(t * 1500, [[0, 0], [200, -0.3], [533, 1], [833, 0], [1100, 0.3], [1400, 0], [1500, 0]]), o = r ? 0.84 : i ? 1.1 : 1, h = 1 + Math.max(0, a) * 0.035, l = 1 + (a < 0 ? -0.065 : -0.025) * a, c = 1 / l;
  return { y: a === 0 ? 0 : -a * 0.062 * o, sx: l * h, sy: c * h };
}, f_ = (s, e) => {
  const t = De(e);
  return -0.68 + 1.36 * t + 0.08 * Math.sin(s * 5.5 + 1.1) * Math.sin(Math.PI * t);
}, p_ = (s, e = 1) => {
  const t = De(s), r = Math.max(0, Math.min(1.5, e)), i = [
    [0, 1, 1],
    [0.24, 1 + 0.055 * r, 1 - 0.09 * r],
    [0.57, 1 - 0.018 * r, 1 + 0.038 * r],
    [1, 1, 1]
  ];
  let n = 1;
  for (; n < i.length - 1 && t > i[n][0]; ) n++;
  const a = i[n - 1], o = i[n], h = nt((t - a[0]) / (o[0] - a[0])), l = a[1] + (o[1] - a[1]) * h, c = a[2] + (o[2] - a[2]) * h;
  return { sx: l, sy: c, y: (1 - c) * 0.5 };
}, Xa = [[-0.28, -0.33], [0.06, -0.35], [0.34, -0.12], [0.29, 0.29], [-0.04, 0.32], [-0.34, 0.13], [-0.02, -0.03], [-0.31, -0.11]], uc = Xa.map((s, e) => {
  let t = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
  return Xa.forEach((r, i) => {
    if (e === i) return;
    const n = r[0] - s[0], a = r[1] - s[1], o = (r[0] ** 2 + r[1] ** 2 - s[0] ** 2 - s[1] ** 2) / 2, h = [];
    t.forEach((l, c) => {
      const u = t[(c + 1) % t.length], d = l[0] * n + l[1] * a - o, f = u[0] * n + u[1] * a - o;
      if (d <= 1e-12 && h.push(l), d < 0 != f < 0) {
        const p = d / (d - f);
        h.push([l[0] + (u[0] - l[0]) * p, l[1] + (u[1] - l[1]) * p]);
      }
    }), t = h;
  }), t;
}), m_ = (s, e, t = 0) => {
  const r = De(e), i = uc[s], n = Math.atan2(i.reduce((c, u) => c + u[1], 0), i.reduce((c, u) => c + u[0], 0)) + (t % 5 - 2) * 0.045, a = 0.08 + s % 3 * 0.012, o = De((r - a) / (1 - a)), h = 0.46 + s % 3 * 0.1 + t % 7 * 6e-3, l = 1 - (1 - o) ** 2;
  return {
    x: Math.cos(n) * h * l,
    y: Math.sin(n) * h * l - 0.26 * o + 1 * o * o,
    rotation: (s % 2 ? 1 : -1) * (0.55 + s * 0.16) * o,
    sx: 1 - 0.5 * Math.sin(o * Math.PI * (0.8 + s % 3 * 0.2)) ** 2,
    depth: Math.sin(o * Math.PI),
    scale: 1 - 0.2 * o,
    alpha: 1 - nt((r - 0.4) / 0.6)
  };
}, g_ = (s) => {
  const e = nt(s / 55), t = 1 - nt((s - Ds) / 243), r = cc(De(s / Ds) * 1500);
  return {
    alpha: e * t * (0.55 + 0.45 * Math.max(0, r)),
    gather: 1 - (1 - De(s / 210)) ** 3,
    stone: nt((s - Ds) / 135),
    contact: Math.sin(Math.PI * De((s - 390) / 145)) ** 2
  };
}, __ = (s, e, t = 0) => {
  const r = De((e - 0.08) / 0.92), i = s * 2.399963 + t * 0.17, n = 0.34 + s % 3 * 0.09;
  return {
    x: Math.cos(i) * n * r,
    y: Math.sin(i) * n * r - 0.28 * r + 0.85 * r * r,
    rotation: (s % 2 ? -1 : 1) * r * (2 + s * 0.4),
    size: 0.012 + s % 3 * 5e-3,
    alpha: nt(r / 0.06) * (1 - nt((r - 0.28) / 0.72))
  };
}, x_ = (s, e = 1) => {
  const t = De(s), r = Math.max(0.65, Math.min(1.4, e));
  return { spread: 1 - (1 - t) ** 3, alpha: nt(t / 0.08) * (1 - t) ** 1.7, weight: r };
};
function y_(s, e, t, r, i, n = 0) {
  const a = g_(i);
  if (a.alpha < 1e-3) return;
  const o = a.stone > 0.2 ? 10223573 : 16770208, h = r * (0.42 - 0.035 * a.gather);
  for (const l of [-1, 1]) {
    const c = l < 0 ? Math.PI * 0.67 : -Math.PI * 0.33;
    s.moveTo(e + Math.cos(c) * h, t + Math.sin(c) * h).arc(e, t, h, c, c + Math.PI * 0.66).stroke({ width: 1.5, color: o, alpha: a.alpha * 0.5 });
  }
  for (let l = 0; l < 5; l++) {
    const c = l * Math.PI * 2 / 5 + n * 0.37, u = r * (0.62 - a.gather * 0.23), d = e + Math.cos(c) * u, f = t + Math.sin(c) * u;
    s.moveTo(d + Math.cos(c) * r * 0.045, f + Math.sin(c) * r * 0.045).lineTo(d, f).stroke({ width: 1.2, color: o, alpha: a.alpha * 0.72 }), s.circle(d, f, 1.1).fill({ color: 16774873, alpha: a.alpha * 0.8 });
  }
  a.contact > 1e-3 && s.ellipse(e, t + r * 0.31, r * (0.22 + a.contact * 0.15), r * 0.025).fill({ color: 12910560, alpha: a.contact * 0.28 });
}
function b_(s, e, t = 0) {
  s.clear();
  const r = Math.max(0, Math.min(1, (e - 0.08) / 0.92));
  if (r <= 0 || r >= 1) return;
  const i = Math.sin(Math.PI * r) ** 1.5;
  for (let n = 0; n < 4; n++) {
    const a = n * 2.399963 + t * 0.11, o = Math.cos(a) * r * 0.32, h = Math.sin(a) * r * 0.2 + 0.12 * r * r, l = 0.045 + 0.15 * r;
    for (let c = 3; c >= 1; c--) s.ellipse(o, h, l * c / 2, l * c / 3).fill({ color: 11977398, alpha: i * 0.035 });
  }
  for (let n = 0; n < 6; n++) {
    const a = __(n, e, t), o = Math.cos(a.rotation), h = Math.sin(a.rotation), l = [[-1, -0.5], [0.7, -0.9], [1, 0.35], [-0.35, 1]].flatMap(([c, u]) => [a.x + (c * o - u * h) * a.size, a.y + (c * h + u * o) * a.size]);
    s.poly(l).fill({ color: n % 2 ? 14013637 : 9411988, alpha: a.alpha * 0.86 });
  }
}
function v_(s, e, t, r = 1) {
  s.clear();
  const i = x_(t, r);
  if (i.alpha < 1e-3) return;
  const n = e * (0.12 + 0.24 * i.spread) * i.weight;
  s.ellipse(0, 0, n, e * 0.016).fill({ color: 16773072, alpha: i.alpha * 0.5 }), s.ellipse(0, 1, n * 1.14, e * (0.015 + 0.025 * i.spread)).stroke({ width: 1, color: 11857617, alpha: i.alpha * 0.38 });
  for (const a of [-1, 1]) {
    const o = a * n * 0.66, h = a * n * 1.24, l = -e * (0.015 + 0.07 * i.spread);
    s.moveTo(o, -1).quadraticCurveTo(a * n, -e * 0.055, h, l).stroke({ width: 1.2, color: 16768136, alpha: i.alpha * 0.75 }), s.circle(h, l, 1.15).fill({ color: 16775388, alpha: i.alpha * 0.8 });
    const c = a * e * (0.08 + 0.18 * i.spread), u = -e * 0.11 * Math.sin(t * Math.PI);
    s.poly([c - 1, u, c, u - 1.8, c + 1.6, u + 0.4]).fill({ color: 13031110, alpha: i.alpha * 0.7 });
  }
}
async function T_() {
  const s = document.querySelector("#stage"), e = document.querySelector("#status"), t = new Wo();
  await t.init({ canvas: s, width: 1152, height: 480, antialias: !0, background: 1060664, resolution: 1 });
  const r = await Promise.all(["h4", "h2", "h1", "h3"].map((I) => Xt.load("../../../../../static/assets/sprites/medusaSymbols/" + I + ".png"))), i = [0, 1, 2, 3].map((I) => {
    const k = new _e();
    return k.position.set(144 + I * 288, 235), k.scale.set(1.7), t.stage.addChild(k), k;
  }), n = (I, k, G, F = 16) => {
    const $ = new Vp({ text: I, style: { fontFamily: "Arial", fontSize: F, fill: 16047517 } });
    $.anchor.set(0.5), $.position.set(k, G), t.stage.addChild($);
  };
  ["ROOT BEAT", "STONE ADVANCE", "SHARDS + STONE DUST", "REEL STOP SQUASH"].forEach((I, k) => n(I, 144 + k * 288, 50));
  for (const I of [288, 576, 864]) t.stage.addChild(new Ve().moveTo(I, 80).lineTo(I, 420).stroke({ width: 1, color: 3232858 }));
  const a = new $e(r[0]);
  a.anchor.set(0.5), a.width = a.height = 98, i[0].addChild(a);
  const o = new Ve();
  i[0].addChild(o);
  const h = new $e(r[1]), l = new $e(r[1]), c = new Ve(), u = new Ve(), d = new _e();
  for (const I of [h, l])
    I.anchor.set(0.5), I.width = I.height = 98;
  const f = new va();
  f.saturate(-1, !1), l.tint = 11117466, d.filters = [f], d.addChild(l), d.mask = c, i[1].addChild(h, d, c, u);
  const p = new _e(), g = new Ve();
  p.scale.set(98), p.addChild(g), i[2].addChild(p);
  const m = new va();
  m.saturate(-1, !1), p.filters = [m];
  const y = uc.map((I) => {
    const k = I.reduce((x, b) => x + b[0], 0) / I.length, G = I.reduce((x, b) => x + b[1], 0) / I.length, F = [];
    for (let x = 1; x < I.length - 1; x++) F.push(0, x, x + 1);
    const $ = new hr({ positions: new Float32Array(I.flatMap(([x, b]) => [x - k, b - G])), uvs: new Float32Array(I.flatMap(([x, b]) => [x + 0.5, b + 0.5])), indices: new Uint32Array(F) }), ae = new wa({ geometry: $, texture: r[2] }), ge = new wa({ geometry: $, texture: r[2] }), _ = new _e();
    return ae.tint = 11117466, ge.tint = 5657422, _.addChild(ge, ae), p.addChild(_), { node: _, front: ae, side: ge, cx: k, cy: G };
  }), T = new $e(r[3]), S = new Ve();
  T.anchor.set(0.5), T.width = T.height = 98, S.y = 98 * 0.4, i[3].addChild(T, S);
  const A = document.querySelector("#seek");
  let M = 0.35, P = !1, E = 0;
  function N() {
    const I = d_(M, "H4");
    a.position.y = I.y * 98, a.scale.set(98 / r[0].width * I.sx, 98 / r[0].height * I.sy), o.clear(), y_(o, 0, 0, 98, M * 567, 4);
    const k = [];
    for (let F = 24; F >= 0; F--) k.push((F / 24 - 0.5) * 98, f_(F / 24, M) * 98);
    c.clear().poly([-59, -69, 59, -69, ...k]).fill(16777215), d.visible = M > 0, u.clear(), b_(g, M, 17), y.forEach(({ node: F, front: $, side: ae, cx: ge, cy: _ }, x) => {
      const b = m_(x, M, 17);
      F.position.set(ge + b.x, _ + b.y), F.rotation = b.rotation, F.scale.set(b.scale * b.sx, b.scale), F.alpha = b.alpha, $.position.set(0, 0), ae.position.set(0.025 * b.depth, 0.018 * b.depth), ae.visible = b.depth > 1e-3;
    });
    const G = p_(M, 1.2);
    T.position.y = G.y * 98, T.scale.set(98 / r[3].width * G.sx, 98 / r[3].height * G.sy), v_(S, 98, M, 1.2), e.textContent = `${Math.round(M * 100)}% · 與正式遊戲共用聚光、石屑、接地特效及動作曲線。各欄分別檢查一個階段。`;
  }
  A.oninput = () => {
    P = !1, M = Number(A.value) / 100, N();
  }, document.querySelector("#play").onclick = () => {
    P = !0, E = 0;
  }, document.querySelector("#pause").onclick = () => {
    P = !1;
  }, t.ticker.add(() => {
    const I = performance.now(), k = E ? (I - E) / 1e3 : 0;
    E = I, !(!P || document.hidden) && (M = (M + k * 0.65) % 1, A.value = String(M * 100), N());
  }), N();
}
T_().catch((s) => {
  document.querySelector("#status").textContent = String(s), console.error(s);
});
z.add(Tu);
z.mixin(_e, Su);
z.add(zo);
z.add(Vo);
z.add(yh);
z.mixin(_e, Gp);
z.add(jl);
z.add(ki);
z.add(ql);
z.add(Ql);
z.add(Jl);
z.add(hc);
z.add(oc);
z.add(ic);
z.add(en);
z.add(nc);
z.add(sc);
z.add(rc);
z.add(vh);
z.add(bh);
const S_ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), w_ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
