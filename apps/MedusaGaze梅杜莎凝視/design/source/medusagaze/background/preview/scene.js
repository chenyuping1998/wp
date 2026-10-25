// @ts-nocheck
// Generated offline review. Original TypeScript is checked separately.
var T = /* @__PURE__ */ ((r) => (r.Application = "application", r.WebGLPipes = "webgl-pipes", r.WebGLPipesAdaptor = "webgl-pipes-adaptor", r.WebGLSystem = "webgl-system", r.WebGPUPipes = "webgpu-pipes", r.WebGPUPipesAdaptor = "webgpu-pipes-adaptor", r.WebGPUSystem = "webgpu-system", r.CanvasSystem = "canvas-system", r.CanvasPipesAdaptor = "canvas-pipes-adaptor", r.CanvasPipes = "canvas-pipes", r.Asset = "asset", r.LoadParser = "load-parser", r.ResolveParser = "resolve-parser", r.CacheParser = "cache-parser", r.DetectionParser = "detection-parser", r.MaskEffect = "mask-effect", r.BlendMode = "blend-mode", r.TextureSource = "texture-source", r.Environment = "environment", r.ShapeBuilder = "shape-builder", r.Batcher = "batcher", r))(T || {});
const Wr = (r) => {
  if (typeof r == "function" || typeof r == "object" && r.extension) {
    if (!r.extension)
      throw new Error("Extension class must have an extension object");
    r = { ...typeof r.extension != "object" ? { type: r.extension } : r.extension, ref: r };
  }
  if (typeof r == "object")
    r = { ...r };
  else
    throw new Error("Invalid extension type");
  return typeof r.type == "string" && (r.type = [r.type]), r;
}, us = (r, e) => Wr(r).priority ?? e, V = {
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
  remove(...r) {
    return r.map(Wr).forEach((e) => {
      e.type.forEach((t) => {
        var s, i;
        return (i = (s = this._removeHandlers)[t]) == null ? void 0 : i.call(s, e);
      });
    }), this;
  },
  /**
   * Register new extensions with PixiJS.
   * @param extensions - The spread of extensions to add to PixiJS.
   * @returns {extensions} For chaining.
   */
  add(...r) {
    return r.map(Wr).forEach((e) => {
      e.type.forEach((t) => {
        var n, a;
        const s = this._addHandlers, i = this._queue;
        s[t] ? (a = s[t]) == null || a.call(s, e) : (i[t] = i[t] || [], (n = i[t]) == null || n.push(e));
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
  handle(r, e, t) {
    var a;
    const s = this._addHandlers, i = this._removeHandlers;
    if (s[r] || i[r])
      throw new Error(`Extension type ${r} already has a handler`);
    s[r] = e, i[r] = t;
    const n = this._queue;
    return n[r] && ((a = n[r]) == null || a.forEach((o) => e(o)), delete n[r]), this;
  },
  /**
   * Handle a type, but using a map by `name` property.
   * @param type - Type of extension to handle.
   * @param map - The object map of named extensions.
   * @returns {extensions} For chaining.
   */
  handleByMap(r, e) {
    return this.handle(
      r,
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
  handleByNamedList(r, e, t = -1) {
    return this.handle(
      r,
      (s) => {
        e.findIndex((n) => n.name === s.name) >= 0 || (e.push({ name: s.name, value: s.ref }), e.sort((n, a) => us(a.value, t) - us(n.value, t)));
      },
      (s) => {
        const i = e.findIndex((n) => n.name === s.name);
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
  handleByList(r, e, t = -1) {
    return this.handle(
      r,
      (s) => {
        e.includes(s.ref) || (e.push(s.ref), e.sort((i, n) => us(n, t) - us(i, t)));
      },
      (s) => {
        const i = e.indexOf(s.ref);
        i !== -1 && e.splice(i, 1);
      }
    );
  },
  /**
   * Mixin the source object into the target object.
   * @param Target - The target object to mix into.
   * @param sources - The source(s) object to mix from
   */
  mixin(r, ...e) {
    for (const t of e)
      Object.defineProperties(r.prototype, Object.getOwnPropertyDescriptors(t));
  }
}, fl = {
  extension: {
    type: T.Environment,
    name: "browser",
    priority: -1
  },
  test: () => !0,
  load: async () => {
    await Promise.resolve().then(() => v_);
  }
}, pl = {
  extension: {
    type: T.Environment,
    name: "webworker",
    priority: 0
  },
  test: () => typeof self < "u" && self.WorkerGlobalScope !== void 0,
  load: async () => {
    await Promise.resolve().then(() => T_);
  }
};
class Se {
  /**
   * Creates a new `ObservablePoint`
   * @param observer - Observer to pass to listen for change events.
   * @param {number} [x=0] - position of the point on the x axis
   * @param {number} [y=0] - position of the point on the y axis
   */
  constructor(e, t, s) {
    this._x = t || 0, this._y = s || 0, this._observer = e;
  }
  /**
   * Creates a clone of this point.
   * @param observer - Optional observer to pass to the new observable point.
   * @returns a copy of this observable point
   */
  clone(e) {
    return new Se(e ?? this._observer, this._x, this._y);
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
function gi(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var Qs = { exports: {} }, hn;
function ml() {
  return hn || (hn = 1, (function(r) {
    var e = Object.prototype.hasOwnProperty, t = "~";
    function s() {
    }
    Object.create && (s.prototype = /* @__PURE__ */ Object.create(null), new s().__proto__ || (t = !1));
    function i(h, c, l) {
      this.fn = h, this.context = c, this.once = l || !1;
    }
    function n(h, c, l, u, d) {
      if (typeof l != "function")
        throw new TypeError("The listener must be a function");
      var f = new i(l, u || h, d), p = t ? t + c : c;
      return h._events[p] ? h._events[p].fn ? h._events[p] = [h._events[p], f] : h._events[p].push(f) : (h._events[p] = f, h._eventsCount++), h;
    }
    function a(h, c) {
      --h._eventsCount === 0 ? h._events = new s() : delete h._events[c];
    }
    function o() {
      this._events = new s(), this._eventsCount = 0;
    }
    o.prototype.eventNames = function() {
      var c = [], l, u;
      if (this._eventsCount === 0) return c;
      for (u in l = this._events)
        e.call(l, u) && c.push(t ? u.slice(1) : u);
      return Object.getOwnPropertySymbols ? c.concat(Object.getOwnPropertySymbols(l)) : c;
    }, o.prototype.listeners = function(c) {
      var l = t ? t + c : c, u = this._events[l];
      if (!u) return [];
      if (u.fn) return [u.fn];
      for (var d = 0, f = u.length, p = new Array(f); d < f; d++)
        p[d] = u[d].fn;
      return p;
    }, o.prototype.listenerCount = function(c) {
      var l = t ? t + c : c, u = this._events[l];
      return u ? u.fn ? 1 : u.length : 0;
    }, o.prototype.emit = function(c, l, u, d, f, p) {
      var g = t ? t + c : c;
      if (!this._events[g]) return !1;
      var m = this._events[g], y = arguments.length, x, v;
      if (m.fn) {
        switch (m.once && this.removeListener(c, m.fn, void 0, !0), y) {
          case 1:
            return m.fn.call(m.context), !0;
          case 2:
            return m.fn.call(m.context, l), !0;
          case 3:
            return m.fn.call(m.context, l, u), !0;
          case 4:
            return m.fn.call(m.context, l, u, d), !0;
          case 5:
            return m.fn.call(m.context, l, u, d, f), !0;
          case 6:
            return m.fn.call(m.context, l, u, d, f, p), !0;
        }
        for (v = 1, x = new Array(y - 1); v < y; v++)
          x[v - 1] = arguments[v];
        m.fn.apply(m.context, x);
      } else {
        var A = m.length, M;
        for (v = 0; v < A; v++)
          switch (m[v].once && this.removeListener(c, m[v].fn, void 0, !0), y) {
            case 1:
              m[v].fn.call(m[v].context);
              break;
            case 2:
              m[v].fn.call(m[v].context, l);
              break;
            case 3:
              m[v].fn.call(m[v].context, l, u);
              break;
            case 4:
              m[v].fn.call(m[v].context, l, u, d);
              break;
            default:
              if (!x) for (M = 1, x = new Array(y - 1); M < y; M++)
                x[M - 1] = arguments[M];
              m[v].fn.apply(m[v].context, x);
          }
      }
      return !0;
    }, o.prototype.on = function(c, l, u) {
      return n(this, c, l, u, !1);
    }, o.prototype.once = function(c, l, u) {
      return n(this, c, l, u, !0);
    }, o.prototype.removeListener = function(c, l, u, d) {
      var f = t ? t + c : c;
      if (!this._events[f]) return this;
      if (!l)
        return a(this, f), this;
      var p = this._events[f];
      if (p.fn)
        p.fn === l && (!d || p.once) && (!u || p.context === u) && a(this, f);
      else {
        for (var g = 0, m = [], y = p.length; g < y; g++)
          (p[g].fn !== l || d && !p[g].once || u && p[g].context !== u) && m.push(p[g]);
        m.length ? this._events[f] = m.length === 1 ? m[0] : m : a(this, f);
      }
      return this;
    }, o.prototype.removeAllListeners = function(c) {
      var l;
      return c ? (l = t ? t + c : c, this._events[l] && a(this, l)) : (this._events = new s(), this._eventsCount = 0), this;
    }, o.prototype.off = o.prototype.removeListener, o.prototype.addListener = o.prototype.on, o.prefixed = t, o.EventEmitter = o, r.exports = o;
  })(Qs)), Qs.exports;
}
var gl = ml();
const Be = /* @__PURE__ */ gi(gl), _l = Math.PI * 2, xl = 180 / Math.PI, yl = Math.PI / 180;
class he {
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
    return new he(this.x, this.y);
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
    return Js.x = 0, Js.y = 0, Js;
  }
}
const Js = new he();
class z {
  /**
   * @param a - x scale
   * @param b - y skew
   * @param c - x skew
   * @param d - y scale
   * @param tx - x translation
   * @param ty - y translation
   */
  constructor(e = 1, t = 0, s = 0, i = 1, n = 0, a = 0) {
    this.array = null, this.a = e, this.b = t, this.c = s, this.d = i, this.tx = n, this.ty = a;
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
  set(e, t, s, i, n, a) {
    return this.a = e, this.b = t, this.c = s, this.d = i, this.tx = n, this.ty = a, this;
  }
  /**
   * Creates an array from the current Matrix object.
   * @param transpose - Whether we need to transpose the matrix or not
   * @param [out=new Float32Array(9)] - If provided the array will be assigned to out
   * @returns The newly created array which contains the matrix
   */
  toArray(e, t) {
    this.array || (this.array = new Float32Array(9));
    const s = t || this.array;
    return e ? (s[0] = this.a, s[1] = this.b, s[2] = 0, s[3] = this.c, s[4] = this.d, s[5] = 0, s[6] = this.tx, s[7] = this.ty, s[8] = 1) : (s[0] = this.a, s[1] = this.c, s[2] = this.tx, s[3] = this.b, s[4] = this.d, s[5] = this.ty, s[6] = 0, s[7] = 0, s[8] = 1), s;
  }
  /**
   * Get a new position with the current transformation applied.
   * Can be used to go from a child's coordinate space to the world coordinate space. (e.g. rendering)
   * @param pos - The origin
   * @param {Point} [newPos] - The point that the new position is assigned to (allowed to be same as input)
   * @returns {Point} The new point, transformed through this matrix
   */
  apply(e, t) {
    t = t || new he();
    const s = e.x, i = e.y;
    return t.x = this.a * s + this.c * i + this.tx, t.y = this.b * s + this.d * i + this.ty, t;
  }
  /**
   * Get a new position with the inverse of the current transformation applied.
   * Can be used to go from the world coordinate space to a child's coordinate space. (e.g. input)
   * @param pos - The origin
   * @param {Point} [newPos] - The point that the new position is assigned to (allowed to be same as input)
   * @returns {Point} The new point, inverse-transformed through this matrix
   */
  applyInverse(e, t) {
    t = t || new he();
    const s = this.a, i = this.b, n = this.c, a = this.d, o = this.tx, h = this.ty, c = 1 / (s * a + n * -i), l = e.x, u = e.y;
    return t.x = a * c * l + -n * c * u + (h * n - o * a) * c, t.y = s * c * u + -i * c * l + (-h * s + o * i) * c, t;
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
    const t = Math.cos(e), s = Math.sin(e), i = this.a, n = this.c, a = this.tx;
    return this.a = i * t - this.b * s, this.b = i * s + this.b * t, this.c = n * t - this.d * s, this.d = n * s + this.d * t, this.tx = a * t - this.ty * s, this.ty = a * s + this.ty * t, this;
  }
  /**
   * Appends the given Matrix to this Matrix.
   * @param matrix - The matrix to append.
   * @returns This matrix. Good for chaining method calls.
   */
  append(e) {
    const t = this.a, s = this.b, i = this.c, n = this.d;
    return this.a = e.a * t + e.b * i, this.b = e.a * s + e.b * n, this.c = e.c * t + e.d * i, this.d = e.c * s + e.d * n, this.tx = e.tx * t + e.ty * i + this.tx, this.ty = e.tx * s + e.ty * n + this.ty, this;
  }
  /**
   * Appends two matrix's and sets the result to this matrix. AB = A * B
   * @param a - The matrix to append.
   * @param b - The matrix to append.
   * @returns This matrix. Good for chaining method calls.
   */
  appendFrom(e, t) {
    const s = e.a, i = e.b, n = e.c, a = e.d, o = e.tx, h = e.ty, c = t.a, l = t.b, u = t.c, d = t.d;
    return this.a = s * c + i * u, this.b = s * l + i * d, this.c = n * c + a * u, this.d = n * l + a * d, this.tx = o * c + h * u + t.tx, this.ty = o * l + h * d + t.ty, this;
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
  setTransform(e, t, s, i, n, a, o, h, c) {
    return this.a = Math.cos(o + c) * n, this.b = Math.sin(o + c) * n, this.c = -Math.sin(o - h) * a, this.d = Math.cos(o - h) * a, this.tx = e - (s * this.a + i * this.c), this.ty = t - (s * this.b + i * this.d), this;
  }
  /**
   * Prepends the given Matrix to this Matrix.
   * @param matrix - The matrix to prepend
   * @returns This matrix. Good for chaining method calls.
   */
  prepend(e) {
    const t = this.tx;
    if (e.a !== 1 || e.b !== 0 || e.c !== 0 || e.d !== 1) {
      const s = this.a, i = this.c;
      this.a = s * e.a + this.b * e.c, this.b = s * e.b + this.b * e.d, this.c = i * e.a + this.d * e.c, this.d = i * e.b + this.d * e.d;
    }
    return this.tx = t * e.a + this.ty * e.c + e.tx, this.ty = t * e.b + this.ty * e.d + e.ty, this;
  }
  /**
   * Decomposes the matrix (x, y, scaleX, scaleY, and rotation) and sets the properties on to a transform.
   * @param transform - The transform to apply the properties to.
   * @returns The transform with the newly applied properties
   */
  decompose(e) {
    const t = this.a, s = this.b, i = this.c, n = this.d, a = e.pivot, o = -Math.atan2(-i, n), h = Math.atan2(s, t), c = Math.abs(o + h);
    return c < 1e-5 || Math.abs(_l - c) < 1e-5 ? (e.rotation = h, e.skew.x = e.skew.y = 0) : (e.rotation = 0, e.skew.x = o, e.skew.y = h), e.scale.x = Math.sqrt(t * t + s * s), e.scale.y = Math.sqrt(i * i + n * n), e.position.x = this.tx + (a.x * t + a.y * i), e.position.y = this.ty + (a.x * s + a.y * n), e;
  }
  /**
   * Inverts this matrix
   * @returns This matrix. Good for chaining method calls.
   */
  invert() {
    const e = this.a, t = this.b, s = this.c, i = this.d, n = this.tx, a = e * i - t * s;
    return this.a = i / a, this.b = -t / a, this.c = -s / a, this.d = e / a, this.tx = (s * this.ty - i * n) / a, this.ty = -(e * this.ty - t * n) / a, this;
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
    const e = new z();
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
    return vl.identity();
  }
  /**
   * A static Matrix that can be used to avoid creating new objects.
   * Will always ensure the matrix is reset to identity when requested.
   * Use this object for fast but temporary calculations, as it may be mutated later on.
   * This is a different object to the `IDENTITY` object and so can be modified without changing `IDENTITY`.
   * @readonly
   */
  static get shared() {
    return bl.identity();
  }
}
const bl = new z(), vl = new z(), ct = [1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1], lt = [0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1], ut = [0, -1, -1, -1, 0, 1, 1, 1, 0, 1, 1, 1, 0, -1, -1, -1], dt = [1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, 1, 1, 1, 0, -1], zr = [], Ka = [], ds = Math.sign;
function Tl() {
  for (let r = 0; r < 16; r++) {
    const e = [];
    zr.push(e);
    for (let t = 0; t < 16; t++) {
      const s = ds(ct[r] * ct[t] + ut[r] * lt[t]), i = ds(lt[r] * ct[t] + dt[r] * lt[t]), n = ds(ct[r] * ut[t] + ut[r] * dt[t]), a = ds(lt[r] * ut[t] + dt[r] * dt[t]);
      for (let o = 0; o < 16; o++)
        if (ct[o] === s && lt[o] === i && ut[o] === n && dt[o] === a) {
          e.push(o);
          break;
        }
    }
  }
  for (let r = 0; r < 16; r++) {
    const e = new z();
    e.set(ct[r], lt[r], ut[r], dt[r], 0, 0), Ka.push(e);
  }
}
Tl();
const ue = {
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
  uX: (r) => ct[r],
  /**
   * @memberof maths.groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The Y-component of the U-axis
   *    after rotating the axes.
   */
  uY: (r) => lt[r],
  /**
   * @memberof maths.groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The X-component of the V-axis
   *    after rotating the axes.
   */
  vX: (r) => ut[r],
  /**
   * @memberof maths.groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The Y-component of the V-axis
   *    after rotating the axes.
   */
  vY: (r) => dt[r],
  /**
   * @memberof maths.groupD8
   * @param {GD8Symmetry} rotation - symmetry whose opposite
   *   is needed. Only rotations have opposite symmetries while
   *   reflections don't.
   * @returns {GD8Symmetry} The opposite symmetry of `rotation`
   */
  inv: (r) => r & 8 ? r & 15 : -r & 7,
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
  add: (r, e) => zr[r][e],
  /**
   * Reverse of `add`.
   * @memberof maths.groupD8
   * @param {GD8Symmetry} rotationSecond - Second operation
   * @param {GD8Symmetry} rotationFirst - First operation
   * @returns {GD8Symmetry} Result
   */
  sub: (r, e) => zr[r][ue.inv(e)],
  /**
   * Adds 180 degrees to rotation, which is a commutative
   * operation.
   * @memberof maths.groupD8
   * @param {number} rotation - The number to rotate.
   * @returns {number} Rotated number
   */
  rotate180: (r) => r ^ 4,
  /**
   * Checks if the rotation angle is vertical, i.e. south
   * or north. It doesn't work for reflections.
   * @memberof maths.groupD8
   * @param {GD8Symmetry} rotation - The number to check.
   * @returns {boolean} Whether or not the direction is vertical
   */
  isVertical: (r) => (r & 3) === 2,
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
  byDirection: (r, e) => Math.abs(r) * 2 <= Math.abs(e) ? e >= 0 ? ue.S : ue.N : Math.abs(e) * 2 <= Math.abs(r) ? r > 0 ? ue.E : ue.W : e > 0 ? r > 0 ? ue.SE : ue.SW : r > 0 ? ue.NE : ue.NW,
  /**
   * Helps sprite to compensate texture packer rotation.
   * @memberof maths.groupD8
   * @param {Matrix} matrix - sprite world matrix
   * @param {GD8Symmetry} rotation - The rotation factor to use.
   * @param {number} tx - sprite anchoring
   * @param {number} ty - sprite anchoring
   */
  matrixAppendRotationInv: (r, e, t = 0, s = 0) => {
    const i = Ka[ue.inv(e)];
    i.tx = t, i.ty = s, r.append(i);
  }
}, fs = [new he(), new he(), new he(), new he()];
class oe {
  /**
   * @param x - The X coordinate of the upper-left corner of the rectangle
   * @param y - The Y coordinate of the upper-left corner of the rectangle
   * @param width - The overall width of the rectangle
   * @param height - The overall height of the rectangle
   */
  constructor(e = 0, t = 0, s = 0, i = 0) {
    this.type = "rectangle", this.x = Number(e), this.y = Number(t), this.width = Number(s), this.height = Number(i);
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
    return new oe(0, 0, 0, 0);
  }
  /**
   * Creates a clone of this Rectangle
   * @returns a copy of the rectangle
   */
  clone() {
    return new oe(this.x, this.y, this.width, this.height);
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
  strokeContains(e, t, s, i = 0.5) {
    const { width: n, height: a } = this;
    if (n <= 0 || a <= 0)
      return !1;
    const o = this.x, h = this.y, c = s * (1 - i), l = s - c, u = o - c, d = o + n + c, f = h - c, p = h + a + c, g = o + l, m = o + n - l, y = h + l, x = h + a - l;
    return e >= u && e <= d && t >= f && t <= p && !(e > g && e < m && t > y && t < x);
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
      const F = this.x < e.x ? e.x : this.x;
      if ((this.right > e.right ? e.right : this.right) <= F)
        return !1;
      const I = this.y < e.y ? e.y : this.y;
      return (this.bottom > e.bottom ? e.bottom : this.bottom) > I;
    }
    const s = this.left, i = this.right, n = this.top, a = this.bottom;
    if (i <= s || a <= n)
      return !1;
    const o = fs[0].set(e.left, e.top), h = fs[1].set(e.left, e.bottom), c = fs[2].set(e.right, e.top), l = fs[3].set(e.right, e.bottom);
    if (c.x <= o.x || h.y <= o.y)
      return !1;
    const u = Math.sign(t.a * t.d - t.b * t.c);
    if (u === 0 || (t.apply(o, o), t.apply(h, h), t.apply(c, c), t.apply(l, l), Math.max(o.x, h.x, c.x, l.x) <= s || Math.min(o.x, h.x, c.x, l.x) >= i || Math.max(o.y, h.y, c.y, l.y) <= n || Math.min(o.y, h.y, c.y, l.y) >= a))
      return !1;
    const d = u * (h.y - o.y), f = u * (o.x - h.x), p = d * s + f * n, g = d * i + f * n, m = d * s + f * a, y = d * i + f * a;
    if (Math.max(p, g, m, y) <= d * o.x + f * o.y || Math.min(p, g, m, y) >= d * l.x + f * l.y)
      return !1;
    const x = u * (o.y - c.y), v = u * (c.x - o.x), A = x * s + v * n, M = x * i + v * n, w = x * s + v * a, C = x * i + v * a;
    return !(Math.max(A, M, w, C) <= x * o.x + v * o.y || Math.min(A, M, w, C) >= x * l.x + v * l.y);
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
    const t = Math.max(this.x, e.x), s = Math.min(this.x + this.width, e.x + e.width), i = Math.max(this.y, e.y), n = Math.min(this.y + this.height, e.y + e.height);
    return this.x = t, this.width = Math.max(s - t, 0), this.y = i, this.height = Math.max(n - i, 0), this;
  }
  /**
   * Enlarges rectangle that way its corners lie on grid
   * @param resolution - resolution
   * @param eps - precision
   * @returns Returns itself.
   */
  ceil(e = 1, t = 1e-3) {
    const s = Math.ceil((this.x + this.width - t) * e) / e, i = Math.ceil((this.y + this.height - t) * e) / e;
    return this.x = Math.floor((this.x + t) * e) / e, this.y = Math.floor((this.y + t) * e) / e, this.width = s - this.x, this.height = i - this.y, this;
  }
  /**
   * Enlarges this rectangle to include the passed rectangle.
   * @param rectangle - The rectangle to include.
   * @returns Returns itself.
   */
  enlarge(e) {
    const t = Math.min(this.x, e.x), s = Math.max(this.x + this.width, e.x + e.width), i = Math.min(this.y, e.y), n = Math.max(this.y + this.height, e.y + e.height);
    return this.x = t, this.width = s - t, this.y = i, this.height = n - i, this;
  }
  /**
   * Returns the framing rectangle of the rectangle as a Rectangle object
   * @param out - optional rectangle to store the result
   * @returns The framing rectangle
   */
  getBounds(e) {
    return e || (e = new oe()), e.copyFrom(this), e;
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
    const t = e.x, s = e.y, i = e.x + e.width, n = e.y + e.height;
    return t >= this.x && t < this.x + this.width && s >= this.y && s < this.y + this.height && i >= this.x && i < this.x + this.width && n >= this.y && n < this.y + this.height;
  }
  toString() {
    return `[pixi.js/math:Rectangle x=${this.x} y=${this.y} width=${this.width} height=${this.height}]`;
  }
}
const er = {
  default: -1
};
function le(r = "default") {
  return er[r] === void 0 && (er[r] = -1), ++er[r];
}
const cn = {}, q = "8.0.0", Sl = "8.3.4";
function j(r, e, t = 3) {
  if (cn[e])
    return;
  let s = new Error().stack;
  typeof s > "u" ? console.warn("PixiJS Deprecation Warning: ", `${e}
Deprecated since v${r}`) : (s = s.split(`
`).splice(t).join(`
`), console.groupCollapsed ? (console.groupCollapsed(
    "%cPixiJS Deprecation Warning: %c%s",
    "color:#614108;background:#fffbe6",
    "font-weight:normal;color:#614108;background:#fffbe6",
    `${e}
Deprecated since v${r}`
  ), console.warn(s), console.groupEnd()) : (console.warn("PixiJS Deprecation Warning: ", `${e}
Deprecated since v${r}`), console.warn(s))), cn[e] = !0;
}
const qa = () => {
};
function Ct(r) {
  return r += r === 0 ? 1 : 0, --r, r |= r >>> 1, r |= r >>> 2, r |= r >>> 4, r |= r >>> 8, r |= r >>> 16, r + 1;
}
function ln(r) {
  return !(r & r - 1) && !!r;
}
function Za(r) {
  const e = {};
  for (const t in r)
    r[t] !== void 0 && (e[t] = r[t]);
  return e;
}
const un = /* @__PURE__ */ Object.create(null);
function wl(r) {
  const e = un[r];
  return e === void 0 && (un[r] = le("resource")), e;
}
const Qa = class Ja extends Be {
  /**
   * @param options - options for the style
   */
  constructor(e = {}) {
    super(), this._resourceType = "textureSampler", this._touched = 0, this._maxAnisotropy = 1, this.destroyed = !1, e = { ...Ja.defaultOptions, ...e }, this.addressMode = e.addressMode, this.addressModeU = e.addressModeU ?? this.addressModeU, this.addressModeV = e.addressModeV ?? this.addressModeV, this.addressModeW = e.addressModeW ?? this.addressModeW, this.scaleMode = e.scaleMode, this.magFilter = e.magFilter ?? this.magFilter, this.minFilter = e.minFilter ?? this.minFilter, this.mipmapFilter = e.mipmapFilter ?? this.mipmapFilter, this.lodMinClamp = e.lodMinClamp, this.lodMaxClamp = e.lodMaxClamp, this.compare = e.compare, this.maxAnisotropy = e.maxAnisotropy ?? 1;
  }
  set addressMode(e) {
    this.addressModeU = e, this.addressModeV = e, this.addressModeW = e;
  }
  /** setting this will set wrapModeU,wrapModeV and wrapModeW all at once! */
  get addressMode() {
    return this.addressModeU;
  }
  set wrapMode(e) {
    j(q, "TextureStyle.wrapMode is now TextureStyle.addressMode"), this.addressMode = e;
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
    return this._sharedResourceId = wl(e), this._resourceId;
  }
  /** Destroys the style */
  destroy() {
    this.destroyed = !0, this.emit("destroy", this), this.emit("change", this), this.removeAllListeners();
  }
};
Qa.defaultOptions = {
  addressMode: "clamp-to-edge",
  scaleMode: "linear"
};
let eo = Qa;
const to = class so extends Be {
  /**
   * @param options - options for creating a new TextureSource
   */
  constructor(e = {}) {
    super(), this.options = e, this.uid = le("textureSource"), this._resourceType = "textureSource", this._resourceId = le("resource"), this.uploadMethodId = "unknown", this._resolution = 1, this.pixelWidth = 1, this.pixelHeight = 1, this.width = 1, this.height = 1, this.sampleCount = 1, this.mipLevelCount = 1, this.autoGenerateMipmaps = !1, this.format = "rgba8unorm", this.dimension = "2d", this.antialias = !1, this._touched = 0, this._batchTick = -1, this._textureBindLocation = -1, e = { ...so.defaultOptions, ...e }, this.label = e.label ?? "", this.resource = e.resource, this.autoGarbageCollect = e.autoGarbageCollect, this._resolution = e.resolution, e.width ? this.pixelWidth = e.width * this._resolution : this.pixelWidth = this.resource ? this.resourceWidth ?? 1 : 1, e.height ? this.pixelHeight = e.height * this._resolution : this.pixelHeight = this.resource ? this.resourceHeight ?? 1 : 1, this.width = this.pixelWidth / this._resolution, this.height = this.pixelHeight / this._resolution, this.format = e.format, this.dimension = e.dimensions, this.mipLevelCount = e.mipLevelCount, this.autoGenerateMipmaps = e.autoGenerateMipmaps, this.sampleCount = e.sampleCount, this.antialias = e.antialias, this.alphaMode = e.alphaMode, this.style = new eo(Za(e)), this.destroyed = !1, this._refreshPOT();
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
    var t, s;
    this.style !== e && ((t = this._style) == null || t.off("change", this._onStyleChange, this), this._style = e, (s = this._style) == null || s.on("change", this._onStyleChange, this), this._onStyleChange());
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
  resize(e, t, s) {
    s || (s = this._resolution), e || (e = this.width), t || (t = this.height);
    const i = Math.round(e * s), n = Math.round(t * s);
    return this.width = i / s, this.height = n / s, this._resolution = s, this.pixelWidth === i && this.pixelHeight === n ? !1 : (this._refreshPOT(), this.pixelWidth = i, this.pixelHeight = n, this.emit("resize", this), this._resourceId = le("resource"), this.emit("change", this), !0);
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
    this.isPowerOfTwo = ln(this.pixelWidth) && ln(this.pixelHeight);
  }
  static test(e) {
    throw new Error("Unimplemented");
  }
};
to.defaultOptions = {
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
let _e = to;
class _i extends _e {
  constructor(e) {
    const t = e.resource || new Float32Array(e.width * e.height * 4);
    let s = e.format;
    s || (t instanceof Float32Array ? s = "rgba32float" : t instanceof Int32Array || t instanceof Uint32Array ? s = "rgba32uint" : t instanceof Int16Array || t instanceof Uint16Array ? s = "rgba16uint" : (t instanceof Int8Array, s = "bgra8unorm")), super({
      ...e,
      resource: t,
      format: s
    }), this.uploadMethodId = "buffer";
  }
  static test(e) {
    return e instanceof Int8Array || e instanceof Uint8Array || e instanceof Uint8ClampedArray || e instanceof Int16Array || e instanceof Uint16Array || e instanceof Int32Array || e instanceof Uint32Array || e instanceof Float32Array;
  }
}
_i.extension = T.TextureSource;
const dn = new z();
class ro {
  /**
   * @param texture - observed texture
   * @param clampMargin - Changes frame clamping, 0.5 by default. Use -0.5 for extra border.
   */
  constructor(e, t) {
    this.mapCoord = new z(), this.uClampFrame = new Float32Array(4), this.uClampOffset = new Float32Array(2), this._textureID = -1, this._updateID = 0, this.clampOffset = 0, typeof t > "u" ? this.clampMargin = e.width < 10 ? 0 : 0.5 : this.clampMargin = t, this.isSimple = !1, this.texture = e;
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
    const s = this.mapCoord;
    for (let i = 0; i < e.length; i += 2) {
      const n = e[i], a = e[i + 1];
      t[i] = n * s.a + a * s.c + s.tx, t[i + 1] = n * s.b + a * s.d + s.ty;
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
    const s = e.orig, i = e.trim;
    i && (dn.set(
      s.width / i.width,
      0,
      0,
      s.height / i.height,
      -i.x / i.width,
      -i.y / i.height
    ), this.mapCoord.append(dn));
    const n = e.source, a = this.uClampFrame, o = this.clampMargin / n._resolution, h = this.clampOffset / n._resolution;
    return a[0] = (e.frame.x + o + h) / n.width, a[1] = (e.frame.y + o + h) / n.height, a[2] = (e.frame.x + e.frame.width - o + h) / n.width, a[3] = (e.frame.y + e.frame.height - o + h) / n.height, this.uClampOffset[0] = this.clampOffset / n.pixelWidth, this.uClampOffset[1] = this.clampOffset / n.pixelHeight, this.isSimple = e.frame.width === n.width && e.frame.height === n.height && e.rotate === 0, !0;
  }
}
class H extends Be {
  /**
   * @param {rendering.TextureOptions} options - Options for the texture
   */
  constructor({
    source: e,
    label: t,
    frame: s,
    orig: i,
    trim: n,
    defaultAnchor: a,
    defaultBorders: o,
    rotate: h,
    dynamic: c
  } = {}) {
    if (super(), this.uid = le("texture"), this.uvs = { x0: 0, y0: 0, x1: 0, y1: 0, x2: 0, y2: 0, x3: 0, y3: 0 }, this.frame = new oe(), this.noFrame = !1, this.dynamic = !1, this.isTexture = !0, this.label = t, this.source = (e == null ? void 0 : e.source) ?? new _e(), this.noFrame = !s, s)
      this.frame.copyFrom(s);
    else {
      const { width: l, height: u } = this._source;
      this.frame.width = l, this.frame.height = u;
    }
    this.orig = i || this.frame, this.trim = n, this.rotate = h ?? 0, this.defaultAnchor = a, this.defaultBorders = o, this.destroyed = !1, this.dynamic = c || !1, this.updateUvs();
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
    return this._textureMatrix || (this._textureMatrix = new ro(this)), this._textureMatrix;
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
    const { uvs: e, frame: t } = this, { width: s, height: i } = this._source, n = t.x / s, a = t.y / i, o = t.width / s, h = t.height / i;
    let c = this.rotate;
    if (c) {
      const l = o / 2, u = h / 2, d = n + l, f = a + u;
      c = ue.add(c, ue.NW), e.x0 = d + l * ue.uX(c), e.y0 = f + u * ue.uY(c), c = ue.add(c, 2), e.x1 = d + l * ue.uX(c), e.y1 = f + u * ue.uY(c), c = ue.add(c, 2), e.x2 = d + l * ue.uX(c), e.y2 = f + u * ue.uY(c), c = ue.add(c, 2), e.x3 = d + l * ue.uX(c), e.y3 = f + u * ue.uY(c);
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
    return j(q, "Texture.baseTexture is now Texture.source"), this._source;
  }
}
H.EMPTY = new H({
  label: "EMPTY",
  source: new _e({
    label: "EMPTY"
  })
});
H.EMPTY.destroy = qa;
H.WHITE = new H({
  source: new _i({
    resource: new Uint8Array([255, 255, 255, 255]),
    width: 1,
    height: 1,
    alphaMode: "premultiply-alpha-on-upload",
    label: "WHITE"
  }),
  label: "WHITE"
});
H.WHITE.destroy = qa;
function io(r, e, t) {
  const { width: s, height: i } = t.orig, n = t.trim;
  if (n) {
    const a = n.width, o = n.height;
    r.minX = n.x - e._x * s, r.maxX = r.minX + a, r.minY = n.y - e._y * i, r.maxY = r.minY + o;
  } else
    r.minX = -e._x * s, r.maxX = r.minX + s, r.minY = -e._y * i, r.maxY = r.minY + i;
}
const fn = new z();
class ye {
  constructor(e = 1 / 0, t = 1 / 0, s = -1 / 0, i = -1 / 0) {
    this.minX = 1 / 0, this.minY = 1 / 0, this.maxX = -1 / 0, this.maxY = -1 / 0, this.matrix = fn, this.minX = e, this.minY = t, this.maxX = s, this.maxY = i;
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
    this._rectangle || (this._rectangle = new oe());
    const e = this._rectangle;
    return this.minX > this.maxX || this.minY > this.maxY ? (e.x = 0, e.y = 0, e.width = 0, e.height = 0) : e.copyFromBounds(this), e;
  }
  /** Clears the bounds and resets. */
  clear() {
    return this.minX = 1 / 0, this.minY = 1 / 0, this.maxX = -1 / 0, this.maxY = -1 / 0, this.matrix = fn, this;
  }
  /**
   * Sets the bounds.
   * @param x0 - left X of frame
   * @param y0 - top Y of frame
   * @param x1 - right X of frame
   * @param y1 - bottom Y of frame
   */
  set(e, t, s, i) {
    this.minX = e, this.minY = t, this.maxX = s, this.maxY = i;
  }
  /**
   * Adds sprite frame
   * @param x0 - left X of frame
   * @param y0 - top Y of frame
   * @param x1 - right X of frame
   * @param y1 - bottom Y of frame
   * @param matrix
   */
  addFrame(e, t, s, i, n) {
    n || (n = this.matrix);
    const a = n.a, o = n.b, h = n.c, c = n.d, l = n.tx, u = n.ty;
    let d = this.minX, f = this.minY, p = this.maxX, g = this.maxY, m = a * e + h * t + l, y = o * e + c * t + u;
    m < d && (d = m), y < f && (f = y), m > p && (p = m), y > g && (g = y), m = a * s + h * t + l, y = o * s + c * t + u, m < d && (d = m), y < f && (f = y), m > p && (p = m), y > g && (g = y), m = a * e + h * i + l, y = o * e + c * i + u, m < d && (d = m), y < f && (f = y), m > p && (p = m), y > g && (g = y), m = a * s + h * i + l, y = o * s + c * i + u, m < d && (d = m), y < f && (f = y), m > p && (p = m), y > g && (g = y), this.minX = d, this.minY = f, this.maxX = p, this.maxY = g;
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
    const t = this.minX, s = this.minY, i = this.maxX, n = this.maxY, { a, b: o, c: h, d: c, tx: l, ty: u } = e;
    let d = a * t + h * s + l, f = o * t + c * s + u;
    this.minX = d, this.minY = f, this.maxX = d, this.maxY = f, d = a * i + h * s + l, f = o * i + c * s + u, this.minX = d < this.minX ? d : this.minX, this.minY = f < this.minY ? f : this.minY, this.maxX = d > this.maxX ? d : this.maxX, this.maxY = f > this.maxY ? f : this.maxY, d = a * t + h * n + l, f = o * t + c * n + u, this.minX = d < this.minX ? d : this.minX, this.minY = f < this.minY ? f : this.minY, this.maxX = d > this.maxX ? d : this.maxX, this.maxY = f > this.maxY ? f : this.maxY, d = a * i + h * n + l, f = o * i + c * n + u, this.minX = d < this.minX ? d : this.minX, this.minY = f < this.minY ? f : this.minY, this.maxX = d > this.maxX ? d : this.maxX, this.maxY = f > this.maxY ? f : this.maxY;
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
  fitBounds(e, t, s, i) {
    return this.minX < e && (this.minX = e), this.maxX > t && (this.maxX = t), this.minY < s && (this.minY = s), this.maxY > i && (this.maxY = i), this;
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
  addVertexData(e, t, s, i) {
    let n = this.minX, a = this.minY, o = this.maxX, h = this.maxY;
    i || (i = this.matrix);
    const c = i.a, l = i.b, u = i.c, d = i.d, f = i.tx, p = i.ty;
    for (let g = t; g < s; g += 2) {
      const m = e[g], y = e[g + 1], x = c * m + u * y + f, v = l * m + d * y + p;
      n = x < n ? x : n, a = v < a ? v : a, o = x > o ? x : o, h = v > h ? v : h;
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
var Al = { grad: 0.9, turn: 360, rad: 360 / (2 * Math.PI) }, Xe = function(r) {
  return typeof r == "string" ? r.length > 0 : typeof r == "number";
}, ge = function(r, e, t) {
  return e === void 0 && (e = 0), t === void 0 && (t = Math.pow(10, e)), Math.round(t * r) / t + 0;
}, ke = function(r, e, t) {
  return e === void 0 && (e = 0), t === void 0 && (t = 1), r > t ? t : r > e ? r : e;
}, no = function(r) {
  return (r = isFinite(r) ? r % 360 : 0) > 0 ? r : r + 360;
}, pn = function(r) {
  return { r: ke(r.r, 0, 255), g: ke(r.g, 0, 255), b: ke(r.b, 0, 255), a: ke(r.a) };
}, tr = function(r) {
  return { r: ge(r.r), g: ge(r.g), b: ge(r.b), a: ge(r.a, 3) };
}, Cl = /^#([0-9a-f]{3,8})$/i, ps = function(r) {
  var e = r.toString(16);
  return e.length < 2 ? "0" + e : e;
}, ao = function(r) {
  var e = r.r, t = r.g, s = r.b, i = r.a, n = Math.max(e, t, s), a = n - Math.min(e, t, s), o = a ? n === e ? (t - s) / a : n === t ? 2 + (s - e) / a : 4 + (e - t) / a : 0;
  return { h: 60 * (o < 0 ? o + 6 : o), s: n ? a / n * 100 : 0, v: n / 255 * 100, a: i };
}, oo = function(r) {
  var e = r.h, t = r.s, s = r.v, i = r.a;
  e = e / 360 * 6, t /= 100, s /= 100;
  var n = Math.floor(e), a = s * (1 - t), o = s * (1 - (e - n) * t), h = s * (1 - (1 - e + n) * t), c = n % 6;
  return { r: 255 * [s, o, a, a, h, s][c], g: 255 * [h, s, s, o, a, a][c], b: 255 * [a, a, h, s, s, o][c], a: i };
}, mn = function(r) {
  return { h: no(r.h), s: ke(r.s, 0, 100), l: ke(r.l, 0, 100), a: ke(r.a) };
}, gn = function(r) {
  return { h: ge(r.h), s: ge(r.s), l: ge(r.l), a: ge(r.a, 3) };
}, _n = function(r) {
  return oo((t = (e = r).s, { h: e.h, s: (t *= ((s = e.l) < 50 ? s : 100 - s) / 100) > 0 ? 2 * t / (s + t) * 100 : 0, v: s + t, a: e.a }));
  var e, t, s;
}, Yt = function(r) {
  return { h: (e = ao(r)).h, s: (i = (200 - (t = e.s)) * (s = e.v) / 100) > 0 && i < 200 ? t * s / 100 / (i <= 100 ? i : 200 - i) * 100 : 0, l: i / 2, a: e.a };
  var e, t, s, i;
}, Pl = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i, El = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i, Ml = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i, Bl = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i, Vr = { string: [[function(r) {
  var e = Cl.exec(r);
  return e ? (r = e[1]).length <= 4 ? { r: parseInt(r[0] + r[0], 16), g: parseInt(r[1] + r[1], 16), b: parseInt(r[2] + r[2], 16), a: r.length === 4 ? ge(parseInt(r[3] + r[3], 16) / 255, 2) : 1 } : r.length === 6 || r.length === 8 ? { r: parseInt(r.substr(0, 2), 16), g: parseInt(r.substr(2, 2), 16), b: parseInt(r.substr(4, 2), 16), a: r.length === 8 ? ge(parseInt(r.substr(6, 2), 16) / 255, 2) : 1 } : null : null;
}, "hex"], [function(r) {
  var e = Ml.exec(r) || Bl.exec(r);
  return e ? e[2] !== e[4] || e[4] !== e[6] ? null : pn({ r: Number(e[1]) / (e[2] ? 100 / 255 : 1), g: Number(e[3]) / (e[4] ? 100 / 255 : 1), b: Number(e[5]) / (e[6] ? 100 / 255 : 1), a: e[7] === void 0 ? 1 : Number(e[7]) / (e[8] ? 100 : 1) }) : null;
}, "rgb"], [function(r) {
  var e = Pl.exec(r) || El.exec(r);
  if (!e) return null;
  var t, s, i = mn({ h: (t = e[1], s = e[2], s === void 0 && (s = "deg"), Number(t) * (Al[s] || 1)), s: Number(e[3]), l: Number(e[4]), a: e[5] === void 0 ? 1 : Number(e[5]) / (e[6] ? 100 : 1) });
  return _n(i);
}, "hsl"]], object: [[function(r) {
  var e = r.r, t = r.g, s = r.b, i = r.a, n = i === void 0 ? 1 : i;
  return Xe(e) && Xe(t) && Xe(s) ? pn({ r: Number(e), g: Number(t), b: Number(s), a: Number(n) }) : null;
}, "rgb"], [function(r) {
  var e = r.h, t = r.s, s = r.l, i = r.a, n = i === void 0 ? 1 : i;
  if (!Xe(e) || !Xe(t) || !Xe(s)) return null;
  var a = mn({ h: Number(e), s: Number(t), l: Number(s), a: Number(n) });
  return _n(a);
}, "hsl"], [function(r) {
  var e = r.h, t = r.s, s = r.v, i = r.a, n = i === void 0 ? 1 : i;
  if (!Xe(e) || !Xe(t) || !Xe(s)) return null;
  var a = (function(o) {
    return { h: no(o.h), s: ke(o.s, 0, 100), v: ke(o.v, 0, 100), a: ke(o.a) };
  })({ h: Number(e), s: Number(t), v: Number(s), a: Number(n) });
  return oo(a);
}, "hsv"]] }, xn = function(r, e) {
  for (var t = 0; t < e.length; t++) {
    var s = e[t][0](r);
    if (s) return [s, e[t][1]];
  }
  return [null, void 0];
}, Rl = function(r) {
  return typeof r == "string" ? xn(r.trim(), Vr.string) : typeof r == "object" && r !== null ? xn(r, Vr.object) : [null, void 0];
}, sr = function(r, e) {
  var t = Yt(r);
  return { h: t.h, s: ke(t.s + 100 * e, 0, 100), l: t.l, a: t.a };
}, rr = function(r) {
  return (299 * r.r + 587 * r.g + 114 * r.b) / 1e3 / 255;
}, yn = function(r, e) {
  var t = Yt(r);
  return { h: t.h, s: t.s, l: ke(t.l + 100 * e, 0, 100), a: t.a };
}, $r = (function() {
  function r(e) {
    this.parsed = Rl(e)[0], this.rgba = this.parsed || { r: 0, g: 0, b: 0, a: 1 };
  }
  return r.prototype.isValid = function() {
    return this.parsed !== null;
  }, r.prototype.brightness = function() {
    return ge(rr(this.rgba), 2);
  }, r.prototype.isDark = function() {
    return rr(this.rgba) < 0.5;
  }, r.prototype.isLight = function() {
    return rr(this.rgba) >= 0.5;
  }, r.prototype.toHex = function() {
    return e = tr(this.rgba), t = e.r, s = e.g, i = e.b, a = (n = e.a) < 1 ? ps(ge(255 * n)) : "", "#" + ps(t) + ps(s) + ps(i) + a;
    var e, t, s, i, n, a;
  }, r.prototype.toRgb = function() {
    return tr(this.rgba);
  }, r.prototype.toRgbString = function() {
    return e = tr(this.rgba), t = e.r, s = e.g, i = e.b, (n = e.a) < 1 ? "rgba(" + t + ", " + s + ", " + i + ", " + n + ")" : "rgb(" + t + ", " + s + ", " + i + ")";
    var e, t, s, i, n;
  }, r.prototype.toHsl = function() {
    return gn(Yt(this.rgba));
  }, r.prototype.toHslString = function() {
    return e = gn(Yt(this.rgba)), t = e.h, s = e.s, i = e.l, (n = e.a) < 1 ? "hsla(" + t + ", " + s + "%, " + i + "%, " + n + ")" : "hsl(" + t + ", " + s + "%, " + i + "%)";
    var e, t, s, i, n;
  }, r.prototype.toHsv = function() {
    return e = ao(this.rgba), { h: ge(e.h), s: ge(e.s), v: ge(e.v), a: ge(e.a, 3) };
    var e;
  }, r.prototype.invert = function() {
    return We({ r: 255 - (e = this.rgba).r, g: 255 - e.g, b: 255 - e.b, a: e.a });
    var e;
  }, r.prototype.saturate = function(e) {
    return e === void 0 && (e = 0.1), We(sr(this.rgba, e));
  }, r.prototype.desaturate = function(e) {
    return e === void 0 && (e = 0.1), We(sr(this.rgba, -e));
  }, r.prototype.grayscale = function() {
    return We(sr(this.rgba, -1));
  }, r.prototype.lighten = function(e) {
    return e === void 0 && (e = 0.1), We(yn(this.rgba, e));
  }, r.prototype.darken = function(e) {
    return e === void 0 && (e = 0.1), We(yn(this.rgba, -e));
  }, r.prototype.rotate = function(e) {
    return e === void 0 && (e = 15), this.hue(this.hue() + e);
  }, r.prototype.alpha = function(e) {
    return typeof e == "number" ? We({ r: (t = this.rgba).r, g: t.g, b: t.b, a: e }) : ge(this.rgba.a, 3);
    var t;
  }, r.prototype.hue = function(e) {
    var t = Yt(this.rgba);
    return typeof e == "number" ? We({ h: e, s: t.s, l: t.l, a: t.a }) : ge(t.h);
  }, r.prototype.isEqual = function(e) {
    return this.toHex() === We(e).toHex();
  }, r;
})(), We = function(r) {
  return r instanceof $r ? r : new $r(r);
}, bn = [], kl = function(r) {
  r.forEach(function(e) {
    bn.indexOf(e) < 0 && (e($r, Vr), bn.push(e));
  });
};
function Il(r, e) {
  var t = { white: "#ffffff", bisque: "#ffe4c4", blue: "#0000ff", cadetblue: "#5f9ea0", chartreuse: "#7fff00", chocolate: "#d2691e", coral: "#ff7f50", antiquewhite: "#faebd7", aqua: "#00ffff", azure: "#f0ffff", whitesmoke: "#f5f5f5", papayawhip: "#ffefd5", plum: "#dda0dd", blanchedalmond: "#ffebcd", black: "#000000", gold: "#ffd700", goldenrod: "#daa520", gainsboro: "#dcdcdc", cornsilk: "#fff8dc", cornflowerblue: "#6495ed", burlywood: "#deb887", aquamarine: "#7fffd4", beige: "#f5f5dc", crimson: "#dc143c", cyan: "#00ffff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkkhaki: "#bdb76b", darkgray: "#a9a9a9", darkgreen: "#006400", darkgrey: "#a9a9a9", peachpuff: "#ffdab9", darkmagenta: "#8b008b", darkred: "#8b0000", darkorchid: "#9932cc", darkorange: "#ff8c00", darkslateblue: "#483d8b", gray: "#808080", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", deeppink: "#ff1493", deepskyblue: "#00bfff", wheat: "#f5deb3", firebrick: "#b22222", floralwhite: "#fffaf0", ghostwhite: "#f8f8ff", darkviolet: "#9400d3", magenta: "#ff00ff", green: "#008000", dodgerblue: "#1e90ff", grey: "#808080", honeydew: "#f0fff0", hotpink: "#ff69b4", blueviolet: "#8a2be2", forestgreen: "#228b22", lawngreen: "#7cfc00", indianred: "#cd5c5c", indigo: "#4b0082", fuchsia: "#ff00ff", brown: "#a52a2a", maroon: "#800000", mediumblue: "#0000cd", lightcoral: "#f08080", darkturquoise: "#00ced1", lightcyan: "#e0ffff", ivory: "#fffff0", lightyellow: "#ffffe0", lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", linen: "#faf0e6", mediumaquamarine: "#66cdaa", lemonchiffon: "#fffacd", lime: "#00ff00", khaki: "#f0e68c", mediumseagreen: "#3cb371", limegreen: "#32cd32", mediumspringgreen: "#00fa9a", lightskyblue: "#87cefa", lightblue: "#add8e6", midnightblue: "#191970", lightpink: "#ffb6c1", mistyrose: "#ffe4e1", moccasin: "#ffe4b5", mintcream: "#f5fffa", lightslategray: "#778899", lightslategrey: "#778899", navajowhite: "#ffdead", navy: "#000080", mediumvioletred: "#c71585", powderblue: "#b0e0e6", palegoldenrod: "#eee8aa", oldlace: "#fdf5e6", paleturquoise: "#afeeee", mediumturquoise: "#48d1cc", mediumorchid: "#ba55d3", rebeccapurple: "#663399", lightsteelblue: "#b0c4de", mediumslateblue: "#7b68ee", thistle: "#d8bfd8", tan: "#d2b48c", orchid: "#da70d6", mediumpurple: "#9370db", purple: "#800080", pink: "#ffc0cb", skyblue: "#87ceeb", springgreen: "#00ff7f", palegreen: "#98fb98", red: "#ff0000", yellow: "#ffff00", slateblue: "#6a5acd", lavenderblush: "#fff0f5", peru: "#cd853f", palevioletred: "#db7093", violet: "#ee82ee", teal: "#008080", slategray: "#708090", slategrey: "#708090", aliceblue: "#f0f8ff", darkseagreen: "#8fbc8f", darkolivegreen: "#556b2f", greenyellow: "#adff2f", seagreen: "#2e8b57", seashell: "#fff5ee", tomato: "#ff6347", silver: "#c0c0c0", sienna: "#a0522d", lavender: "#e6e6fa", lightgreen: "#90ee90", orange: "#ffa500", orangered: "#ff4500", steelblue: "#4682b4", royalblue: "#4169e1", turquoise: "#40e0d0", yellowgreen: "#9acd32", salmon: "#fa8072", saddlebrown: "#8b4513", sandybrown: "#f4a460", rosybrown: "#bc8f8f", darksalmon: "#e9967a", lightgoldenrodyellow: "#fafad2", snow: "#fffafa", lightgrey: "#d3d3d3", lightgray: "#d3d3d3", dimgray: "#696969", dimgrey: "#696969", olivedrab: "#6b8e23", olive: "#808000" }, s = {};
  for (var i in t) s[t[i]] = i;
  var n = {};
  r.prototype.toName = function(a) {
    if (!(this.rgba.a || this.rgba.r || this.rgba.g || this.rgba.b)) return "transparent";
    var o, h, c = s[this.toHex()];
    if (c) return c;
    if (a != null && a.closest) {
      var l = this.toRgb(), u = 1 / 0, d = "black";
      if (!n.length) for (var f in t) n[f] = new r(t[f]).toRgb();
      for (var p in t) {
        var g = (o = l, h = n[p], Math.pow(o.r - h.r, 2) + Math.pow(o.g - h.g, 2) + Math.pow(o.b - h.b, 2));
        g < u && (u = g, d = p);
      }
      return d;
    }
  }, e.string.push([function(a) {
    var o = a.toLowerCase(), h = o === "transparent" ? "#0000" : t[o];
    return h ? new r(h).toRgb() : null;
  }, "name"]);
}
kl([Il]);
const Pt = class zt {
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
    const s = typeof e;
    if (s !== typeof t)
      return !1;
    if (s === "number" || s === "string" || e instanceof Number)
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
    const [e, t, s, i] = this._components;
    return { r: e, g: t, b: s, a: i };
  }
  /**
   * Convert to a RGB color object.
   * @example
   * import { Color } from 'pixi.js';
   * new Color('white').toRgb(); // returns { r: 1, g: 1, b: 1 }
   */
  toRgb() {
    const [e, t, s] = this._components;
    return { r: e, g: t, b: s };
  }
  /** Convert to a CSS-style rgba string: `rgba(255,255,255,1.0)`. */
  toRgbaString() {
    const [e, t, s] = this.toUint8RgbArray();
    return `rgba(${e},${t},${s},${this.alpha})`;
  }
  toUint8RgbArray(e) {
    const [t, s, i] = this._components;
    return this._arrayRgb || (this._arrayRgb = []), e || (e = this._arrayRgb), e[0] = Math.round(t * 255), e[1] = Math.round(s * 255), e[2] = Math.round(i * 255), e;
  }
  toArray(e) {
    this._arrayRgba || (this._arrayRgba = []), e || (e = this._arrayRgba);
    const [t, s, i, n] = this._components;
    return e[0] = t, e[1] = s, e[2] = i, e[3] = n, e;
  }
  toRgbArray(e) {
    this._arrayRgb || (this._arrayRgb = []), e || (e = this._arrayRgb);
    const [t, s, i] = this._components;
    return e[0] = t, e[1] = s, e[2] = i, e;
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
    const [e, t, s] = this.toUint8RgbArray();
    return (s << 16) + (t << 8) + e;
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
    const [t, s, i, n] = zt._temp.setValue(e)._components;
    return this._components[0] *= t, this._components[1] *= s, this._components[2] *= i, this._components[3] *= n, this._refreshInt(), this._value = null, this;
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
    let s = this._int >> 16 & 255, i = this._int >> 8 & 255, n = this._int & 255;
    return t && (s = s * e + 0.5 | 0, i = i * e + 0.5 | 0, n = n * e + 0.5 | 0), (e * 255 << 24) + (s << 16) + (i << 8) + n;
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
    let t, s, i, n;
    if ((typeof e == "number" || e instanceof Number) && e >= 0 && e <= 16777215) {
      const a = e;
      t = (a >> 16 & 255) / 255, s = (a >> 8 & 255) / 255, i = (a & 255) / 255, n = 1;
    } else if ((Array.isArray(e) || e instanceof Float32Array) && e.length >= 3 && e.length <= 4)
      e = this._clamp(e), [t, s, i, n = 1] = e;
    else if ((e instanceof Uint8Array || e instanceof Uint8ClampedArray) && e.length >= 3 && e.length <= 4)
      e = this._clamp(e, 0, 255), [t, s, i, n = 255] = e, t /= 255, s /= 255, i /= 255, n /= 255;
    else if (typeof e == "string" || typeof e == "object") {
      if (typeof e == "string") {
        const o = zt.HEX_PATTERN.exec(e);
        o && (e = `#${o[2]}`);
      }
      const a = We(e);
      a.isValid() && ({ r: t, g: s, b: i, a: n } = a.rgba, t /= 255, s /= 255, i /= 255);
    }
    if (t !== void 0)
      this._components[0] = t, this._components[1] = s, this._components[2] = i, this._components[3] = n, this._refreshInt();
    else
      throw new Error(`Unable to convert color ${e}`);
  }
  /** Refresh the internal color rgb number */
  _refreshInt() {
    this._clamp(this._components);
    const [e, t, s] = this._components;
    this._int = (e * 255 << 16) + (t * 255 << 8) + (s * 255 | 0);
  }
  /**
   * Clamps values to a range. Will override original values
   * @param value - Value(s) to clamp
   * @param min - Minimum value
   * @param max - Maximum value
   */
  _clamp(e, t = 0, s = 1) {
    return typeof e == "number" ? Math.min(Math.max(e, t), s) : (e.forEach((i, n) => {
      e[n] = Math.min(Math.max(i, t), s);
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
Pt.shared = new Pt();
Pt._temp = new Pt();
Pt.HEX_PATTERN = /^(#|0x)?(([a-f0-9]{3}){1,2}([a-f0-9]{2})?)$/i;
let ae = Pt;
const Gl = {
  cullArea: null,
  cullable: !1,
  cullableChildren: !0
};
class xi {
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
    var s;
    let t;
    return this._index > 0 ? t = this._pool[--this._index] : t = new this._classType(), (s = t.init) == null || s.call(t, e), t;
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
class Ul {
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
    return this._poolsByClass.has(e) || this._poolsByClass.set(e, new xi(e)), this._poolsByClass.get(e);
  }
  /** gets the usage stats of each pool in the system */
  stats() {
    const e = {};
    return this._poolsByClass.forEach((t) => {
      const s = e[t._classType.name] ? t._classType.name + t._classType.ID : t._classType.name;
      e[s] = {
        free: t.totalFree,
        used: t.totalUsed,
        size: t.totalSize
      };
    }), e;
  }
}
const Z = new Ul(), Fl = {
  /**
   * Is this container cached as a texture?
   * @readonly
   * @type {boolean}
   * @memberof scene.Container#
   */
  get isCachedAsTexture() {
    var r;
    return !!((r = this.renderGroup) != null && r.isCachedAsTexture);
  },
  cacheAsTexture(r) {
    typeof r == "boolean" && r === !1 ? this.disableRenderGroup() : (this.enableRenderGroup(), this.renderGroup.enableCacheAsTexture(r === !0 ? {} : r));
  },
  /**
   * Updates the cached texture. Will flag that this container's cached texture needs to be redrawn.
   * This will happen on the next render.
   * @memberof scene.Container#
   */
  updateCacheTexture() {
    var r;
    (r = this.renderGroup) == null || r.updateCacheTexture();
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
  set cacheAsBitmap(r) {
    j("v8.6.0", "cacheAsBitmap is deprecated, use cacheAsTexture instead."), this.cacheAsTexture(r);
  }
};
function ho(r, e, t) {
  const s = r.length;
  let i;
  if (e >= s || t === 0)
    return;
  t = e + t > s ? s - e : t;
  const n = s - t;
  for (i = e; i < n; ++i)
    r[i] = r[i + t];
  r.length = n;
}
const Dl = {
  allowChildren: !0,
  /**
   * Removes all children from this container that are within the begin and end indexes.
   * @param beginIndex - The beginning position.
   * @param endIndex - The ending position. Default value is size of the container.
   * @returns - List of removed children
   * @memberof scene.Container#
   */
  removeChildren(r = 0, e) {
    const t = e ?? this.children.length, s = t - r, i = [];
    if (s > 0 && s <= t) {
      for (let a = t - 1; a >= r; a--) {
        const o = this.children[a];
        o && (i.push(o), o.parent = null);
      }
      ho(this.children, r, t);
      const n = this.renderGroup || this.parentRenderGroup;
      n && n.removeChildren(i);
      for (let a = 0; a < i.length; ++a)
        this.emit("childRemoved", i[a], this, a), i[a].emit("removed", this);
      return i.length > 0 && this._didViewChangeTick++, i;
    } else if (s === 0 && this.children.length === 0)
      return i;
    throw new RangeError("removeChildren: numeric values are outside the acceptable range.");
  },
  /**
   * Removes a child from the specified index position.
   * @param index - The index to get the child from
   * @returns The child that was removed.
   * @memberof scene.Container#
   */
  removeChildAt(r) {
    const e = this.getChildAt(r);
    return this.removeChild(e);
  },
  /**
   * Returns the child at the specified index
   * @param index - The index to get the child at
   * @returns - The child at the given index, if any.
   * @memberof scene.Container#
   */
  getChildAt(r) {
    if (r < 0 || r >= this.children.length)
      throw new Error(`getChildAt: Index (${r}) does not exist.`);
    return this.children[r];
  },
  /**
   * Changes the position of an existing child in the container
   * @param child - The child Container instance for which you want to change the index number
   * @param index - The resulting index number for the child container
   * @memberof scene.Container#
   */
  setChildIndex(r, e) {
    if (e < 0 || e >= this.children.length)
      throw new Error(`The index ${e} supplied is out of bounds ${this.children.length}`);
    this.getChildIndex(r), this.addChildAt(r, e);
  },
  /**
   * Returns the index position of a child Container instance
   * @param child - The Container instance to identify
   * @returns - The index position of the child container to identify
   * @memberof scene.Container#
   */
  getChildIndex(r) {
    const e = this.children.indexOf(r);
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
  addChildAt(r, e) {
    this.allowChildren || j(q, "addChildAt: Only Containers will be allowed to add children in v8.0.0");
    const { children: t } = this;
    if (e < 0 || e > t.length)
      throw new Error(`${r}addChildAt: The index ${e} supplied is out of bounds ${t.length}`);
    if (r.parent) {
      const i = r.parent.children.indexOf(r);
      if (r.parent === this && i === e)
        return r;
      i !== -1 && r.parent.children.splice(i, 1);
    }
    e === t.length ? t.push(r) : t.splice(e, 0, r), r.parent = this, r.didChange = !0, r._updateFlags = 15;
    const s = this.renderGroup || this.parentRenderGroup;
    return s && s.addChild(r), this.sortableChildren && (this.sortDirty = !0), this.emit("childAdded", r, this, e), r.emit("added", this), r;
  },
  /**
   * Swaps the position of 2 Containers within this container.
   * @param child - First container to swap
   * @param child2 - Second container to swap
   * @memberof scene.Container#
   */
  swapChildren(r, e) {
    if (r === e)
      return;
    const t = this.getChildIndex(r), s = this.getChildIndex(e);
    this.children[t] = e, this.children[s] = r;
    const i = this.renderGroup || this.parentRenderGroup;
    i && (i.structureDidChange = !0), this._didContainerChangeTick++;
  },
  /**
   * Remove the Container from its parent Container. If the Container has no parent, do nothing.
   * @memberof scene.Container#
   */
  removeFromParent() {
    var r;
    (r = this.parent) == null || r.removeChild(this);
  },
  /**
   * Reparent the child to this container, keeping the same worldTransform.
   * @param child - The child to reparent
   * @returns The first child that was reparented.
   * @memberof scene.Container#
   */
  reparentChild(...r) {
    return r.length === 1 ? this.reparentChildAt(r[0], this.children.length) : (r.forEach((e) => this.reparentChildAt(e, this.children.length)), r[0]);
  },
  /**
   * Reparent the child to this container at the specified index, keeping the same worldTransform.
   * @param child - The child to reparent
   * @param index - The index to reparent the child to
   * @memberof scene.Container#
   */
  reparentChildAt(r, e) {
    if (r.parent === this)
      return this.setChildIndex(r, e), r;
    const t = r.worldTransform.clone();
    r.removeFromParent(), this.addChildAt(r, e);
    const s = this.worldTransform.clone();
    return s.invert(), t.prepend(s), r.setFromMatrix(t), r;
  }
}, Ol = {
  /**
   * Main method to collect renderables from the container and its children.
   * It checks the container's properties to decide whether to use a simple or advanced collection method.
   * @param {InstructionSet} instructionSet - The set of instructions to which the renderables will be added.
   * @param {Renderer} renderer - The renderer responsible for rendering the scene.
   * @param {IRenderLayer} currentLayer - The current render layer being processed.
   * @memberof scene.Container#
   */
  collectRenderables(r, e, t) {
    this.parentRenderLayer && this.parentRenderLayer !== t || this.globalDisplayStatus < 7 || !this.includeInBuild || (this.sortableChildren && this.sortChildren(), this.isSimple ? this.collectRenderablesSimple(r, e, t) : this.renderGroup ? e.renderPipes.renderGroup.addRenderGroup(this.renderGroup, r) : this.collectRenderablesWithEffects(r, e, t));
  },
  /**
   * Simple method for collecting renderables from the container's children.
   * This method is efficient and used when the container is marked as simple.
   * @param {InstructionSet} instructionSet - The set of instructions to which the renderables will be added.
   * @param {Renderer} renderer - The renderer responsible for rendering the scene.
   * @param {IRenderLayer} currentLayer - The current render layer being processed.
   * @memberof scene.Container#
   */
  collectRenderablesSimple(r, e, t) {
    const s = this.children, i = s.length;
    for (let n = 0; n < i; n++)
      s[n].collectRenderables(r, e, t);
  },
  /**
   * Advanced method for collecting renderables, which handles additional effects.
   * This method is used when the container has complex processing needs.
   * @param {InstructionSet} instructionSet - The set of instructions to which the renderables will be added.
   * @param {Renderer} renderer - The renderer responsible for rendering the scene.
   * @param {IRenderLayer} currentLayer - The current render layer being processed.
   * @memberof scene.Container#
   */
  collectRenderablesWithEffects(r, e, t) {
    const { renderPipes: s } = e;
    for (let i = 0; i < this.effects.length; i++) {
      const n = this.effects[i];
      s[n.pipe].push(n, this, r);
    }
    this.collectRenderablesSimple(r, e, t);
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const n = this.effects[i];
      s[n.pipe].pop(n, this, r);
    }
  }
};
class Fs {
  constructor() {
    this.pipe = "filter", this.priority = 1;
  }
  destroy() {
    for (let e = 0; e < this.filters.length; e++)
      this.filters[e].destroy();
    this.filters = null, this.filterArea = null;
  }
}
class Ll {
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
      const s = this._tests[t];
      if (s.test(e))
        return Z.get(s.maskClass, e);
    }
    return e;
  }
  returnMaskEffect(e) {
    Z.return(e);
  }
}
const Xr = new Ll();
V.handleByList(T.MaskEffect, Xr._effectClasses);
const Nl = {
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
    const r = this.renderGroup || this.parentRenderGroup;
    r && (r.structureDidChange = !0);
  },
  /**
   * @todo Needs docs.
   * @param effect - The effect to add.
   * @memberof scene.Container#
   * @ignore
   */
  addEffect(r) {
    this.effects.indexOf(r) === -1 && (this.effects.push(r), this.effects.sort((t, s) => t.priority - s.priority), this._markStructureAsChanged(), this._updateIsSimple());
  },
  /**
   * @todo Needs docs.
   * @param effect - The effect to remove.
   * @memberof scene.Container#
   * @ignore
   */
  removeEffect(r) {
    const e = this.effects.indexOf(r);
    e !== -1 && (this.effects.splice(e, 1), this._markStructureAsChanged(), this._updateIsSimple());
  },
  set mask(r) {
    const e = this._maskEffect;
    (e == null ? void 0 : e.mask) !== r && (e && (this.removeEffect(e), Xr.returnMaskEffect(e), this._maskEffect = null), r != null && (this._maskEffect = Xr.getMaskEffect(r), this.addEffect(this._maskEffect)));
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
  setMask(r) {
    this._maskOptions = {
      ...this._maskOptions,
      ...r
    }, r.mask && (this.mask = r.mask), this._markStructureAsChanged();
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
    var r;
    return (r = this._maskEffect) == null ? void 0 : r.mask;
  },
  set filters(r) {
    var n;
    !Array.isArray(r) && r && (r = [r]);
    const e = this._filterEffect || (this._filterEffect = new Fs());
    r = r;
    const t = (r == null ? void 0 : r.length) > 0, s = ((n = e.filters) == null ? void 0 : n.length) > 0, i = t !== s;
    r = Array.isArray(r) ? r.slice(0) : r, e.filters = Object.freeze(r), i && (t ? this.addEffect(e) : (this.removeEffect(e), e.filters = r ?? null));
  },
  /**
   * Sets the filters for the displayObject.
   * IMPORTANT: This is a WebGL only feature and will be ignored by the canvas renderer.
   * To remove filters simply set this property to `'null'`.
   * @memberof scene.Container#
   */
  get filters() {
    var r;
    return (r = this._filterEffect) == null ? void 0 : r.filters;
  },
  set filterArea(r) {
    this._filterEffect || (this._filterEffect = new Fs()), this._filterEffect.filterArea = r;
  },
  /**
   * The area the filter is applied to. This is used as more of an optimization
   * rather than figuring out the dimensions of the displayObject each frame you can set this rectangle.
   *
   * Also works as an interaction mask.
   * @memberof scene.Container#
   */
  get filterArea() {
    var r;
    return (r = this._filterEffect) == null ? void 0 : r.filterArea;
  }
}, Hl = {
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
    return j(q, "Container.name property has been removed, use Container.label instead"), this.label;
  },
  set name(r) {
    j(q, "Container.name property has been removed, use Container.label instead"), this.label = r;
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
  getChildByName(r, e = !1) {
    return this.getChildByLabel(r, e);
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
  getChildByLabel(r, e = !1) {
    const t = this.children;
    for (let s = 0; s < t.length; s++) {
      const i = t[s];
      if (i.label === r || r instanceof RegExp && r.test(i.label))
        return i;
    }
    if (e)
      for (let s = 0; s < t.length; s++) {
        const n = t[s].getChildByLabel(r, !0);
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
  getChildrenByLabel(r, e = !1, t = []) {
    const s = this.children;
    for (let i = 0; i < s.length; i++) {
      const n = s[i];
      (n.label === r || r instanceof RegExp && r.test(n.label)) && t.push(n);
    }
    if (e)
      for (let i = 0; i < s.length; i++)
        s[i].getChildrenByLabel(r, !0, t);
    return t;
  }
}, be = new xi(z), Ke = new xi(ye), Wl = new z(), zl = {
  /**
   * Computes the global bounds for the container, considering its children and optionally
   * factoring in render layers. It starts by clearing the provided bounds object, then
   * recursively calculates the bounds, and finally applies the world transformation.
   * @param {boolean} [factorRenderLayers] - Whether to consider render layers in the calculation.
   * @param {Bounds} [bounds] - The bounds object to store the result. If not provided, a new one is created.
   * @returns {Bounds} The computed bounds.
   * @memberof scene.Container#
   */
  getFastGlobalBounds(r, e) {
    e || (e = new ye()), e.clear(), this._getGlobalBoundsRecursive(!!r, e, this.parentRenderLayer), e.isValid || e.set(0, 0, 0, 0);
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
  _getGlobalBoundsRecursive(r, e, t) {
    let s = e;
    if (r && this.parentRenderLayer && this.parentRenderLayer !== t || this.localDisplayStatus !== 7 || !this.measurable)
      return;
    const i = !!this.effects.length;
    if ((this.renderGroup || i) && (s = Ke.get().clear()), this.boundsArea)
      e.addRect(this.boundsArea, this.worldTransform);
    else {
      if (this.renderPipeId) {
        const a = this.bounds;
        s.addFrame(
          a.minX,
          a.minY,
          a.maxX,
          a.maxY,
          this.groupTransform
        );
      }
      const n = this.children;
      for (let a = 0; a < n.length; a++)
        n[a]._getGlobalBoundsRecursive(r, s, t);
    }
    if (i) {
      let n = !1;
      const a = this.renderGroup || this.parentRenderGroup;
      for (let o = 0; o < this.effects.length; o++)
        this.effects[o].addBounds && (n || (n = !0, s.applyMatrix(a.worldTransform)), this.effects[o].addBounds(s, !0));
      n && (s.applyMatrix(a.worldTransform.copyTo(Wl).invert()), e.addBounds(s, this.relativeGroupTransform)), e.addBounds(s), Ke.return(s);
    } else this.renderGroup && (e.addBounds(s, this.relativeGroupTransform), Ke.return(s));
  }
};
function yi(r, e, t) {
  t.clear();
  let s, i;
  return r.parent ? e ? s = r.parent.worldTransform : (i = be.get().identity(), s = bi(r, i)) : s = z.IDENTITY, co(r, t, s, e), i && be.return(i), t.isValid || t.set(0, 0, 0, 0), t;
}
function co(r, e, t, s) {
  var o, h;
  if (!r.visible || !r.measurable)
    return;
  let i;
  s ? i = r.worldTransform : (r.updateLocalTransform(), i = be.get(), i.appendFrom(r.localTransform, t));
  const n = e, a = !!r.effects.length;
  if (a && (e = Ke.get().clear()), r.boundsArea)
    e.addRect(r.boundsArea, i);
  else {
    r.bounds && (e.matrix = i, e.addBounds(r.bounds));
    for (let c = 0; c < r.children.length; c++)
      co(r.children[c], e, i, s);
  }
  if (a) {
    for (let c = 0; c < r.effects.length; c++)
      (h = (o = r.effects[c]).addBounds) == null || h.call(o, e);
    n.addBounds(e, z.IDENTITY), Ke.return(e);
  }
  s || be.return(i);
}
function bi(r, e) {
  const t = r.parent;
  return t && (bi(t, e), t.updateLocalTransform(), e.append(t.localTransform)), e;
}
function lo(r, e) {
  if (r === 16777215 || !e)
    return e;
  if (e === 16777215 || !r)
    return r;
  const t = r >> 16 & 255, s = r >> 8 & 255, i = r & 255, n = e >> 16 & 255, a = e >> 8 & 255, o = e & 255, h = t * n / 255 | 0, c = s * a / 255 | 0, l = i * o / 255 | 0;
  return (h << 16) + (c << 8) + l;
}
const vn = 16777215;
function Ds(r, e) {
  return r === vn ? e : e === vn ? r : lo(r, e);
}
function Rs(r) {
  return ((r & 255) << 16) + (r & 65280) + (r >> 16 & 255);
}
const Vl = {
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
  getGlobalAlpha(r) {
    if (r)
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
  getGlobalTransform(r, e) {
    if (e)
      return r.copyFrom(this.worldTransform);
    this.updateLocalTransform();
    const t = bi(this, be.get().identity());
    return r.appendFrom(this.localTransform, t), be.return(t), r;
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
  getGlobalTint(r) {
    if (r)
      return this.renderGroup ? Rs(this.renderGroup.worldColor) : this.parentRenderGroup ? Rs(
        Ds(this.localColor, this.parentRenderGroup.worldColor)
      ) : this.tint;
    let e = this.localColor, t = this.parent;
    for (; t; )
      e = Ds(e, t.localColor), t = t.parent;
    return Rs(e);
  }
};
let ir = 0;
const Tn = 500;
function $(...r) {
  ir !== Tn && (ir++, ir === Tn ? console.warn("PixiJS Warning: too many warnings, no more warnings will be reported to the console by PixiJS.") : console.warn("PixiJS Warning: ", ...r));
}
function vi(r, e, t) {
  return e.clear(), t || (t = z.IDENTITY), uo(r, e, t, r, !0), e.isValid || e.set(0, 0, 0, 0), e;
}
function uo(r, e, t, s, i) {
  var h, c;
  let n;
  if (i)
    n = be.get(), n = t.copyTo(n);
  else {
    if (!r.visible || !r.measurable)
      return;
    r.updateLocalTransform();
    const l = r.localTransform;
    n = be.get(), n.appendFrom(l, t);
  }
  const a = e, o = !!r.effects.length;
  if (o && (e = Ke.get().clear()), r.boundsArea)
    e.addRect(r.boundsArea, n);
  else {
    r.renderPipeId && (e.matrix = n, e.addBounds(r.bounds));
    const l = r.children;
    for (let u = 0; u < l.length; u++)
      uo(l[u], e, n, s, !1);
  }
  if (o) {
    for (let l = 0; l < r.effects.length; l++)
      (c = (h = r.effects[l]).addLocalBounds) == null || c.call(h, e, s);
    a.addBounds(e, z.IDENTITY), Ke.return(e);
  }
  be.return(n);
}
function fo(r, e) {
  const t = r.children;
  for (let s = 0; s < t.length; s++) {
    const i = t[s], n = i.uid, a = (i._didViewChangeTick & 65535) << 16 | i._didContainerChangeTick & 65535, o = e.index;
    (e.data[o] !== n || e.data[o + 1] !== a) && (e.data[e.index] = n, e.data[e.index + 1] = a, e.didChange = !0), e.index = o + 2, i.children.length && fo(i, e);
  }
  return e.didChange;
}
const $l = new z(), Xl = {
  _localBoundsCacheId: -1,
  _localBoundsCacheData: null,
  _setWidth(r, e) {
    const t = Math.sign(this.scale.x) || 1;
    e !== 0 ? this.scale.x = r / e * t : this.scale.x = t;
  },
  _setHeight(r, e) {
    const t = Math.sign(this.scale.y) || 1;
    e !== 0 ? this.scale.y = r / e * t : this.scale.y = t;
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
    const r = this._localBoundsCacheData;
    return r.index = 1, r.didChange = !1, r.data[0] !== this._didViewChangeTick && (r.didChange = !0, r.data[0] = this._didViewChangeTick), fo(this, r), r.didChange && vi(this, r.localBounds, $l), r.localBounds;
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
  getBounds(r, e) {
    return yi(this, r, e || new ye());
  }
}, jl = {
  _onRender: null,
  set onRender(r) {
    const e = this.renderGroup || this.parentRenderGroup;
    if (!r) {
      this._onRender && (e == null || e.removeOnRender(this)), this._onRender = null;
      return;
    }
    this._onRender || e == null || e.addOnRender(this), this._onRender = r;
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
}, Yl = {
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
  set zIndex(r) {
    this._zIndex !== r && (this._zIndex = r, this.depthOfChildModified());
  },
  depthOfChildModified() {
    this.parent && (this.parent.sortableChildren = !0, this.parent.sortDirty = !0), this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0);
  },
  /**
   * Sorts children by zIndex.
   * @memberof scene.Container#
   */
  sortChildren() {
    this.sortDirty && (this.sortDirty = !1, this.children.sort(Kl));
  }
};
function Kl(r, e) {
  return r._zIndex - e._zIndex;
}
const ql = {
  /**
   * Returns the global position of the container.
   * @param point - The optional point to write the global value to.
   * @param skipUpdate - Should we skip the update transform.
   * @returns - The updated point.
   * @memberof scene.Container#
   */
  getGlobalPosition(r = new he(), e = !1) {
    return this.parent ? this.parent.toGlobal(this._position, r, e) : (r.x = this._position.x, r.y = this._position.y), r;
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
  toGlobal(r, e, t = !1) {
    const s = this.getGlobalTransform(be.get(), t);
    return e = s.apply(r, e), be.return(s), e;
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
  toLocal(r, e, t, s) {
    e && (r = e.toGlobal(r, t, s));
    const i = this.getGlobalTransform(be.get(), s);
    return t = i.applyInverse(r, t), be.return(i), t;
  }
};
class po {
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
let Zl = 0;
class Ql {
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
  createTexture(e, t, s) {
    const i = new _e({
      ...this.textureOptions,
      width: e,
      height: t,
      resolution: 1,
      antialias: s,
      autoGarbageCollect: !1
    });
    return new H({
      source: i,
      label: `texturePool_${Zl++}`
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
  getOptimalTexture(e, t, s = 1, i) {
    let n = Math.ceil(e * s - 1e-6), a = Math.ceil(t * s - 1e-6);
    n = Ct(n), a = Ct(a);
    const o = (n << 17) + (a << 1) + (i ? 1 : 0);
    this._texturePool[o] || (this._texturePool[o] = []);
    let h = this._texturePool[o].pop();
    return h || (h = this.createTexture(n, a, i)), h.source._resolution = s, h.source.width = n / s, h.source.height = a / s, h.source.pixelWidth = n, h.source.pixelHeight = a, h.frame.x = 0, h.frame.y = 0, h.frame.width = e, h.frame.height = t, h.updateUvs(), this._poolKeyHash[h.uid] = o, h;
  }
  /**
   * Gets extra texture of the same size as input renderTexture
   * @param texture - The texture to check what size it is.
   * @param antialias - Whether to use antialias.
   * @returns A texture that is a power of two
   */
  getSameSizeTexture(e, t = !1) {
    const s = e.source;
    return this.getOptimalTexture(e.width, e.height, s._resolution, t);
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
        const s = this._texturePool[t];
        if (s)
          for (let i = 0; i < s.length; i++)
            s[i].destroy(!0);
      }
    this._texturePool = {};
  }
}
const xe = new Ql();
class Jl {
  constructor() {
    this.renderPipeId = "renderGroup", this.root = null, this.canBundle = !1, this.renderGroupParent = null, this.renderGroupChildren = [], this.worldTransform = new z(), this.worldColorAlpha = 4294967295, this.worldColor = 16777215, this.worldAlpha = 1, this.childrenToUpdate = /* @__PURE__ */ Object.create(null), this.updateTick = 0, this.gcTick = 0, this.childrenRenderablesToUpdate = { list: [], index: 0 }, this.structureDidChange = !0, this.instructionSet = new po(), this._onRenderContainers = [], this.textureNeedsUpdate = !0, this.isCachedAsTexture = !1, this._matrixDirty = 7;
  }
  init(e) {
    this.root = e, e._onRender && this.addOnRender(e), e.didChange = !0;
    const t = e.children;
    for (let s = 0; s < t.length; s++) {
      const i = t[s];
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
    for (let s = 0; s < t.length; s++)
      this.addChild(t[s]);
  }
  removeChild(e) {
    if (this.structureDidChange = !0, e._onRender && (e.renderGroup || this.removeOnRender(e)), e.parentRenderGroup = null, e.renderGroup) {
      this._removeRenderGroupChild(e.renderGroup);
      return;
    }
    const t = e.children;
    for (let s = 0; s < t.length; s++)
      this.removeChild(t[s]);
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
    for (let s = 0; s < t.length; s++)
      this._getChildren(t[s], e);
    return e;
  }
  _getChildren(e, t = []) {
    if (t.push(e), e.renderGroup)
      return t;
    const s = e.children;
    for (let i = 0; i < s.length; i++)
      this._getChildren(s[i], t);
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
    return (this._matrixDirty & 1) === 0 ? this._inverseWorldTransform : (this._matrixDirty &= -2, this._inverseWorldTransform || (this._inverseWorldTransform = new z()), this._inverseWorldTransform.copyFrom(this.worldTransform).invert());
  }
  /**
   * Returns the inverse of the texture offset transform matrix.
   * @returns {Matrix} The inverse of the texture offset transform matrix.
   */
  get textureOffsetInverseTransform() {
    return (this._matrixDirty & 2) === 0 ? this._textureOffsetInverseTransform : (this._matrixDirty &= -3, this._textureOffsetInverseTransform || (this._textureOffsetInverseTransform = new z()), this._textureOffsetInverseTransform.copyFrom(this.inverseWorldTransform).translate(
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
    return e ? (this._inverseParentTextureTransform || (this._inverseParentTextureTransform = new z()), this._inverseParentTextureTransform.copyFrom(this.worldTransform).prepend(e.inverseWorldTransform).translate(
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
function eu(r, e, t = {}) {
  for (const s in e)
    !t[s] && e[s] !== void 0 && (r[s] = e[s]);
}
const nr = new Se(null), ar = new Se(null), or = new Se(null, 1, 1), Os = 1, Ti = 2, Kt = 4;
class pe extends Be {
  constructor(e = {}) {
    var t, s;
    super(), this.uid = le("renderable"), this._updateFlags = 15, this.renderGroup = null, this.parentRenderGroup = null, this.parentRenderGroupIndex = 0, this.didChange = !1, this.didViewUpdate = !1, this.relativeRenderGroupDepth = 0, this.children = [], this.parent = null, this.includeInBuild = !0, this.measurable = !0, this.isSimple = !0, this.updateTick = -1, this.localTransform = new z(), this.relativeGroupTransform = new z(), this.groupTransform = this.relativeGroupTransform, this.destroyed = !1, this._position = new Se(this, 0, 0), this._scale = or, this._pivot = ar, this._skew = nr, this._cx = 1, this._sx = 0, this._cy = 0, this._sy = 1, this._rotation = 0, this.localColor = 16777215, this.localAlpha = 1, this.groupAlpha = 1, this.groupColor = 16777215, this.groupColorAlpha = 4294967295, this.localBlendMode = "inherit", this.groupBlendMode = "normal", this.localDisplayStatus = 7, this.globalDisplayStatus = 7, this._didContainerChangeTick = 0, this._didViewChangeTick = 0, this._didLocalTransformChangeId = -1, this.effects = [], eu(this, e, {
      children: !0,
      parent: !0,
      effects: !0
    }), (t = e.children) == null || t.forEach((i) => this.addChild(i)), (s = e.parent) == null || s.addChild(this);
  }
  /**
   * Mixes all enumerable properties and methods from a source object to Container.
   * @param source - The source of properties and methods to mix in.
   * @deprecated since 8.8.0
   */
  static mixin(e) {
    j("8.8.0", "Container.mixin is deprecated, please use extensions.mixin instead."), V.mixin(pe, e);
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
    if (this.allowChildren || j(q, "addChild: Only Containers will be allowed to add children in v8.0.0"), e.length > 1) {
      for (let i = 0; i < e.length; i++)
        this.addChild(e[i]);
      return e[0];
    }
    const t = e[0], s = this.renderGroup || this.parentRenderGroup;
    return t.parent === this ? (this.children.splice(this.children.indexOf(t), 1), this.children.push(t), s && (s.structureDidChange = !0), t) : (t.parent && t.parent.removeChild(t), this.children.push(t), this.sortableChildren && (this.sortDirty = !0), t.parent = this, t.didChange = !0, t._updateFlags = 15, s && s.addChild(t), this.emit("childAdded", t, this, this.children.length - 1), t.emit("added", this), this._didViewChangeTick++, t._zIndex !== 0 && t.depthOfChildModified(), t);
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
    const t = e[0], s = this.children.indexOf(t);
    return s > -1 && (this._didViewChangeTick++, this.children.splice(s, 1), this.renderGroup ? this.renderGroup.removeChild(t) : this.parentRenderGroup && this.parentRenderGroup.removeChild(t), t.parentRenderLayer && t.parentRenderLayer.detach(t), t.parent = null, this.emit("childRemoved", t, this, s), t.emit("removed", this)), t;
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
    e == null || e.removeChild(this), this.renderGroup = Z.get(Jl, this), this.groupTransform = z.IDENTITY, e == null || e.addChild(this), this._updateIsSimple();
  }
  /** This will disable the render group for this container. */
  disableRenderGroup() {
    if (!this.renderGroup)
      return;
    const e = this.parentRenderGroup;
    e == null || e.removeChild(this), Z.return(this.renderGroup), this.renderGroup = null, this.groupTransform = this.relativeGroupTransform, e == null || e.addChild(this), this._updateIsSimple();
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
    return this._worldTransform || (this._worldTransform = new z()), this.renderGroup ? this._worldTransform.copyFrom(this.renderGroup.worldTransform) : this.parentRenderGroup && this._worldTransform.appendFrom(this.relativeGroupTransform, this.parentRenderGroup.worldTransform), this._worldTransform;
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
    return this.rotation * xl;
  }
  set angle(e) {
    this.rotation = e * yl;
  }
  /**
   * The center of rotation, scaling, and skewing for this display object in its local space. The `position`
   * is the projection of `pivot` in the parent's local space.
   *
   * By default, the pivot is the origin (0, 0).
   * @since 4.0.0
   */
  get pivot() {
    return this._pivot === ar && (this._pivot = new Se(this, 0, 0)), this._pivot;
  }
  set pivot(e) {
    this._pivot === ar && (this._pivot = new Se(this, 0, 0)), typeof e == "number" ? this._pivot.set(e) : this._pivot.copyFrom(e);
  }
  /**
   * The skew factor for the object in radians.
   * @since 4.0.0
   */
  get skew() {
    return this._skew === nr && (this._skew = new Se(this, 0, 0)), this._skew;
  }
  set skew(e) {
    this._skew === nr && (this._skew = new Se(this, 0, 0)), this._skew.copyFrom(e);
  }
  /**
   * The scale factors of this object along the local coordinate axes.
   *
   * The default scale is (1, 1).
   * @since 4.0.0
   */
  get scale() {
    return this._scale === or && (this._scale = new Se(this, 1, 1)), this._scale;
  }
  set scale(e) {
    this._scale === or && (this._scale = new Se(this, 0, 0)), typeof e == "number" ? this._scale.set(e) : this._scale.copyFrom(e);
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
    const s = this.getLocalBounds();
    typeof e == "object" ? (t = e.height ?? e.width, e = e.width) : t ?? (t = e), e !== void 0 && this._setWidth(e, s.width), t !== void 0 && this._setHeight(t, s.height);
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
    const t = this.localTransform, s = this._scale, i = this._pivot, n = this._position, a = s._x, o = s._y, h = i._x, c = i._y;
    t.a = this._cx * a, t.b = this._sx * a, t.c = this._cy * o, t.d = this._sy * o, t.tx = n._x - (h * t.a + c * t.c), t.ty = n._y - (h * t.b + c * t.d);
  }
  // / ///// color related stuff
  set alpha(e) {
    e !== this.localAlpha && (this.localAlpha = e, this._updateFlags |= Os, this._onUpdate());
  }
  /** The opacity of the object. */
  get alpha() {
    return this.localAlpha;
  }
  set tint(e) {
    const s = ae.shared.setValue(e ?? 16777215).toBgrNumber();
    s !== this.localColor && (this.localColor = s, this._updateFlags |= Os, this._onUpdate());
  }
  /**
   * The tint applied to the sprite. This is a hex value.
   *
   * A value of 0xFFFFFF will remove any tint effect.
   * @default 0xFFFFFF
   */
  get tint() {
    return Rs(this.localColor);
  }
  // / //////////////// blend related stuff
  set blendMode(e) {
    this.localBlendMode !== e && (this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0), this._updateFlags |= Ti, this.localBlendMode = e, this._onUpdate());
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
    (this.localDisplayStatus & 2) !== t && (this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0), this._updateFlags |= Kt, this.localDisplayStatus ^= 2, this._onUpdate());
  }
  /** @ignore */
  get culled() {
    return !(this.localDisplayStatus & 4);
  }
  /** @ignore */
  set culled(e) {
    const t = e ? 0 : 4;
    (this.localDisplayStatus & 4) !== t && (this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0), this._updateFlags |= Kt, this.localDisplayStatus ^= 4, this._onUpdate());
  }
  /** Can this object be rendered, if false the object will not be drawn but the transform will still be updated. */
  get renderable() {
    return !!(this.localDisplayStatus & 1);
  }
  set renderable(e) {
    const t = e ? 1 : 0;
    (this.localDisplayStatus & 1) !== t && (this._updateFlags |= Kt, this.localDisplayStatus ^= 1, this.parentRenderGroup && (this.parentRenderGroup.structureDidChange = !0), this._onUpdate());
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
V.mixin(
  pe,
  Dl,
  zl,
  ql,
  jl,
  Xl,
  Nl,
  Hl,
  Yl,
  Gl,
  Fl,
  Vl,
  Ol
);
class Xs extends pe {
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
    const t = this.bounds, { x: s, y: i } = e;
    return s >= t.minX && s <= t.maxX && i >= t.minY && i <= t.maxY;
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
  collectRenderablesSimple(e, t, s) {
    const { renderPipes: i, renderableGC: n } = t;
    i.blendMode.setBlendMode(this, this.groupBlendMode, e), i[this.renderPipeId].addRenderable(this, e), n.addRenderable(this), this.didViewUpdate = !1;
    const o = this.children, h = o.length;
    for (let c = 0; c < h; c++)
      o[c].collectRenderables(e, t, s);
  }
}
class Te extends Xs {
  /**
   * @param options - The options for creating the sprite.
   */
  constructor(e = H.EMPTY) {
    e instanceof H && (e = { texture: e });
    const { texture: t = H.EMPTY, anchor: s, roundPixels: i, width: n, height: a, ...o } = e;
    super({
      label: "Sprite",
      ...o
    }), this.renderPipeId = "sprite", this.batched = !0, this._visualBounds = { minX: 0, maxX: 1, minY: 0, maxY: 0 }, this._anchor = new Se(
      {
        _onUpdate: () => {
          this.onViewUpdate();
        }
      }
    ), s ? this.anchor = s : t.defaultAnchor && (this.anchor = t.defaultAnchor), this.texture = t, this.allowChildren = !1, this.roundPixels = i ?? !1, n !== void 0 && (this.width = n), a !== void 0 && (this.height = a);
  }
  /**
   * Helper function that creates a new sprite based on the source you provide.
   * The source can be - frame id, image, video, canvas element, video element, texture
   * @param source - Source to create texture from
   * @param [skipCache] - Whether to skip the cache or not
   * @returns The newly created sprite
   */
  static from(e, t = !1) {
    return e instanceof H ? new Te(e) : new Te(H.from(e, t));
  }
  set texture(e) {
    e || (e = H.EMPTY);
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
    return io(this._visualBounds, this._anchor, this._texture), this._visualBounds;
  }
  /**
   * @deprecated
   */
  get sourceBounds() {
    return j("8.6.1", "Sprite.sourceBounds is deprecated, use visualBounds instead."), this.visualBounds;
  }
  /** @private */
  updateBounds() {
    const e = this._anchor, t = this._texture, s = this._bounds, { width: i, height: n } = t.orig;
    s.minX = -e._x * i, s.maxX = s.minX + i, s.minY = -e._y * n, s.maxY = s.minY + n;
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
      const s = typeof e == "boolean" ? e : e == null ? void 0 : e.textureSource;
      this._texture.destroy(s);
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
function mo(r, e, t) {
  const s = tu;
  r.measurable = !0, yi(r, t, s), e.addBoundsMask(s), r.measurable = !1;
}
function go(r, e, t) {
  const s = Ke.get();
  r.measurable = !0;
  const i = be.get().identity(), n = _o(r, t, i);
  vi(r, s, n), r.measurable = !1, e.addBoundsMask(s), be.return(i), Ke.return(s);
}
function _o(r, e, t) {
  return r ? (r !== e && (_o(r.parent, e, t), r.updateLocalTransform(), t.append(r.localTransform)), t) : ($("Mask bounds, renderable is not inside the root container"), t);
}
class xo {
  constructor(e) {
    this.priority = 0, this.inverse = !1, this.pipe = "alphaMask", e != null && e.mask && this.init(e.mask);
  }
  init(e) {
    this.mask = e, this.renderMaskToTexture = !(e instanceof Te), this.mask.renderable = this.renderMaskToTexture, this.mask.includeInBuild = !this.renderMaskToTexture, this.mask.measurable = !1;
  }
  reset() {
    this.mask.measurable = !0, this.mask = null;
  }
  addBounds(e, t) {
    this.inverse || mo(this.mask, e, t);
  }
  addLocalBounds(e, t) {
    go(this.mask, e, t);
  }
  containsPoint(e, t) {
    const s = this.mask;
    return t(s, e);
  }
  destroy() {
    this.reset();
  }
  static test(e) {
    return e instanceof Te;
  }
}
xo.extension = T.MaskEffect;
class yo {
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
yo.extension = T.MaskEffect;
class bo {
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
    mo(this.mask, e, t);
  }
  addLocalBounds(e, t) {
    go(this.mask, e, t);
  }
  containsPoint(e, t) {
    const s = this.mask;
    return t(s, e);
  }
  destroy() {
    this.reset();
  }
  static test(e) {
    return e instanceof pe;
  }
}
bo.extension = T.MaskEffect;
const su = {
  createCanvas: (r, e) => {
    const t = document.createElement("canvas");
    return t.width = r, t.height = e, t;
  },
  getCanvasRenderingContext2D: () => CanvasRenderingContext2D,
  getWebGLRenderingContext: () => WebGLRenderingContext,
  getNavigator: () => navigator,
  getBaseUrl: () => document.baseURI ?? window.location.href,
  getFontFaceSet: () => document.fonts,
  fetch: (r, e) => fetch(r, e),
  parseXML: (r) => new DOMParser().parseFromString(r, "text/xml")
};
let Sn = su;
const J = {
  /**
   * Returns the current adapter.
   * @returns {environment.Adapter} The current adapter.
   */
  get() {
    return Sn;
  },
  /**
   * Sets the current adapter.
   * @param adapter - The new adapter.
   */
  set(r) {
    Sn = r;
  }
};
class qe extends _e {
  constructor(e) {
    e.resource || (e.resource = J.get().createCanvas()), e.width || (e.width = e.resource.width, e.autoDensity || (e.width /= e.resolution)), e.height || (e.height = e.resource.height, e.autoDensity || (e.height /= e.resolution)), super(e), this.uploadMethodId = "image", this.autoDensity = e.autoDensity, this.resizeCanvas(), this.transparent = !!e.transparent;
  }
  resizeCanvas() {
    this.autoDensity && (this.resource.style.width = `${this.width}px`, this.resource.style.height = `${this.height}px`), (this.resource.width !== this.pixelWidth || this.resource.height !== this.pixelHeight) && (this.resource.width = this.pixelWidth, this.resource.height = this.pixelHeight);
  }
  resize(e = this.width, t = this.height, s = this._resolution) {
    const i = super.resize(e, t, s);
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
qe.extension = T.TextureSource;
class gt extends _e {
  constructor(e) {
    if (e.resource && globalThis.HTMLImageElement && e.resource instanceof HTMLImageElement) {
      const t = J.get().createCanvas(e.resource.width, e.resource.height);
      t.getContext("2d").drawImage(e.resource, 0, 0, e.resource.width, e.resource.height), e.resource = t, $("ImageSource: Image element passed, converting to canvas. Use CanvasSource instead.");
    }
    super(e), this.uploadMethodId = "image", this.autoGarbageCollect = !0;
  }
  static test(e) {
    return globalThis.HTMLImageElement && e instanceof HTMLImageElement || typeof ImageBitmap < "u" && e instanceof ImageBitmap || globalThis.VideoFrame && e instanceof VideoFrame;
  }
}
gt.extension = T.TextureSource;
var ts = /* @__PURE__ */ ((r) => (r[r.INTERACTION = 50] = "INTERACTION", r[r.HIGH = 25] = "HIGH", r[r.NORMAL = 0] = "NORMAL", r[r.LOW = -25] = "LOW", r[r.UTILITY = -50] = "UTILITY", r))(ts || {});
class hr {
  /**
   * Constructor
   * @private
   * @param fn - The listener function to be added for one update
   * @param context - The listener context
   * @param priority - The priority for emitting
   * @param once - If the handler should fire once
   */
  constructor(e, t = null, s = 0, i = !1) {
    this.next = null, this.previous = null, this._destroyed = !1, this._fn = e, this._context = t, this.priority = s, this._once = i;
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
const vo = class Ce {
  constructor() {
    this.autoStart = !1, this.deltaTime = 1, this.lastTime = -1, this.speed = 1, this.started = !1, this._requestId = null, this._maxElapsedMS = 100, this._minElapsedMS = 0, this._protected = !1, this._lastFrame = -1, this._head = new hr(null, null, 1 / 0), this.deltaMS = 1 / Ce.targetFPMS, this.elapsedMS = 1 / Ce.targetFPMS, this._tick = (e) => {
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
  add(e, t, s = ts.NORMAL) {
    return this._addListener(new hr(e, t, s));
  }
  /**
   * Add a handler for the tick event which is only execute once.
   * @param fn - The listener function to be added for one update
   * @param context - The listener context
   * @param {number} [priority=UPDATE_PRIORITY.NORMAL] - The priority for emitting
   * @returns This instance of a ticker
   */
  addOnce(e, t, s = ts.NORMAL) {
    return this._addListener(new hr(e, t, s, !0));
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
    let t = this._head.next, s = this._head;
    if (!t)
      e.connect(s);
    else {
      for (; t; ) {
        if (e.priority > t.priority) {
          e.connect(s);
          break;
        }
        s = t, t = t.next;
      }
      e.previous || e.connect(s);
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
    let s = this._head.next;
    for (; s; )
      s.match(e, t) ? s = s.destroy() : s = s.next;
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
      this.deltaMS = t, this.deltaTime = this.deltaMS * Ce.targetFPMS;
      const s = this._head;
      let i = s.next;
      for (; i; )
        i = i.emit(this);
      s.next || this._cancelIfNeeded();
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
    const t = Math.min(this.maxFPS, e), s = Math.min(Math.max(0, t) / 1e3, Ce.targetFPMS);
    this._maxElapsedMS = 1 / s;
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
    if (!Ce._shared) {
      const e = Ce._shared = new Ce();
      e.autoStart = !0, e._protected = !0;
    }
    return Ce._shared;
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
    if (!Ce._system) {
      const e = Ce._system = new Ce();
      e.autoStart = !0, e._protected = !0;
    }
    return Ce._system;
  }
};
vo.targetFPMS = 0.06;
let Ve = vo, cr;
async function To() {
  return cr ?? (cr = (async () => {
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
    const s = e.createTexture();
    e.bindTexture(e.TEXTURE_2D, s);
    const i = e.createFramebuffer();
    e.bindFramebuffer(e.FRAMEBUFFER, i), e.framebufferTexture2D(
      e.FRAMEBUFFER,
      e.COLOR_ATTACHMENT0,
      e.TEXTURE_2D,
      s,
      0
    ), e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !1), e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL, e.NONE), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, e.RGBA, e.UNSIGNED_BYTE, t);
    const n = new Uint8Array(4);
    return e.readPixels(0, 0, 1, 1, e.RGBA, e.UNSIGNED_BYTE, n), e.deleteFramebuffer(i), e.deleteTexture(s), (a = e.getExtension("WEBGL_lose_context")) == null || a.loseContext(), n[0] <= n[3] ? "premultiplied-alpha" : "premultiply-alpha-on-upload";
  })()), cr;
}
const js = class So extends _e {
  constructor(e) {
    super(e), this.isReady = !1, this.uploadMethodId = "video", e = {
      ...So.defaultOptions,
      ...e
    }, this._autoUpdate = !0, this._isConnectedToTicker = !1, this._updateFPS = e.updateFPS || 0, this._msToNextUpdate = 0, this.autoPlay = e.autoPlay !== !1, this.alphaMode = e.alphaMode ?? "premultiply-alpha-on-upload", this._videoFrameRequestCallback = this._videoFrameRequestCallback.bind(this), this._videoFrameRequestCallbackHandle = null, this._load = null, this._resolve = null, this._reject = null, this._onCanPlay = this._onCanPlay.bind(this), this._onCanPlayThrough = this._onCanPlayThrough.bind(this), this._onError = this._onError.bind(this), this._onPlayStart = this._onPlayStart.bind(this), this._onPlayStop = this._onPlayStop.bind(this), this._onSeeked = this._onSeeked.bind(this), e.autoLoad !== !1 && this.load();
  }
  /** Update the video frame if the source is not destroyed and meets certain conditions. */
  updateFrame() {
    if (!this.destroyed) {
      if (this._updateFPS) {
        const e = Ve.shared.elapsedMS * this.resource.playbackRate;
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
    return (e.readyState === e.HAVE_ENOUGH_DATA || e.readyState === e.HAVE_FUTURE_DATA) && e.width && e.height && (e.complete = !0), e.addEventListener("play", this._onPlayStart), e.addEventListener("pause", this._onPlayStop), e.addEventListener("seeked", this._onSeeked), this._isSourceReady() ? this._mediaReady() : (t.preload || e.addEventListener("canplay", this._onCanPlay), e.addEventListener("canplaythrough", this._onCanPlayThrough), e.addEventListener("error", this._onError, !0)), this.alphaMode = await To(), this._load = new Promise((s, i) => {
      this.isValid ? s(this) : (this._resolve = s, this._reject = i, t.preloadTimeoutMs !== void 0 && (this._preloadTimeout = setTimeout(() => {
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
    this._autoUpdate && this._isSourcePlaying() ? !this._updateFPS && this.resource.requestVideoFrameCallback ? (this._isConnectedToTicker && (Ve.shared.remove(this.updateFrame, this), this._isConnectedToTicker = !1, this._msToNextUpdate = 0), this._videoFrameRequestCallbackHandle === null && (this._videoFrameRequestCallbackHandle = this.resource.requestVideoFrameCallback(
      this._videoFrameRequestCallback
    ))) : (this._videoFrameRequestCallbackHandle !== null && (this.resource.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle), this._videoFrameRequestCallbackHandle = null), this._isConnectedToTicker || (Ve.shared.add(this.updateFrame, this), this._isConnectedToTicker = !0, this._msToNextUpdate = 0)) : (this._videoFrameRequestCallbackHandle !== null && (this.resource.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle), this._videoFrameRequestCallbackHandle = null), this._isConnectedToTicker && (Ve.shared.remove(this.updateFrame, this), this._isConnectedToTicker = !1, this._msToNextUpdate = 0));
  }
  static test(e) {
    return globalThis.HTMLVideoElement && e instanceof HTMLVideoElement;
  }
};
js.extension = T.TextureSource;
js.defaultOptions = {
  ..._e.defaultOptions,
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
js.MIME_TYPES = {
  ogv: "video/ogg",
  mov: "video/quicktime",
  m4v: "video/mp4"
};
let ks = js;
const De = (r, e, t = !1) => (Array.isArray(r) || (r = [r]), e ? r.map((s) => typeof s == "string" || t ? e(s) : s) : r);
class ru {
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
    return t || $(`[Assets] Asset id ${e} was not found in the Cache`), t;
  }
  /**
   * Set a value by key or keys name
   * @param key - The key or keys to set
   * @param value - The value to store in the cache or from which cacheable assets will be derived.
   */
  set(e, t) {
    const s = De(e);
    let i;
    for (let h = 0; h < this.parsers.length; h++) {
      const c = this.parsers[h];
      if (c.test(t)) {
        i = c.getCacheableAssets(s, t);
        break;
      }
    }
    const n = new Map(Object.entries(i || {}));
    i || s.forEach((h) => {
      n.set(h, t);
    });
    const a = [...n.keys()], o = {
      cacheKeys: a,
      keys: s
    };
    s.forEach((h) => {
      this._cacheMap.set(h, o);
    }), a.forEach((h) => {
      const c = i ? i[h] : t;
      this._cache.has(h) && this._cache.get(h) !== c && $("[Cache] already has key:", h), this._cache.set(h, n.get(h));
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
      $(`[Assets] Asset id ${e} was not found in the Cache`);
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
const ce = new ru(), jr = [];
V.handleByList(T.TextureSource, jr);
function wo(r = {}) {
  const e = r && r.resource, t = e ? r.resource : r, s = e ? r : { resource: r };
  for (let i = 0; i < jr.length; i++) {
    const n = jr[i];
    if (n.test(t))
      return new n(s);
  }
  throw new Error(`Could not find a source type for resource: ${s.resource}`);
}
function iu(r = {}, e = !1) {
  const t = r && r.resource, s = t ? r.resource : r, i = t ? r : { resource: r };
  if (!e && ce.has(s))
    return ce.get(s);
  const n = new H({ source: wo(i) });
  return n.on("destroy", () => {
    ce.has(s) && ce.remove(s);
  }), e || ce.set(s, n), n;
}
function nu(r, e = !1) {
  return typeof r == "string" ? ce.get(r) : r instanceof _e ? new H({ source: r }) : iu(r, e);
}
H.from = nu;
_e.from = wo;
V.add(xo, yo, bo, ks, gt, qe, _i);
var at = /* @__PURE__ */ ((r) => (r[r.Low = 0] = "Low", r[r.Normal = 1] = "Normal", r[r.High = 2] = "High", r))(at || {});
function Ue(r) {
  if (typeof r != "string")
    throw new TypeError(`Path must be a string. Received ${JSON.stringify(r)}`);
}
function Dt(r) {
  return r.split("?")[0].split("#")[0];
}
function au(r) {
  return r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function ou(r, e, t) {
  return r.replace(new RegExp(au(e), "g"), t);
}
function hu(r, e) {
  let t = "", s = 0, i = -1, n = 0, a = -1;
  for (let o = 0; o <= r.length; ++o) {
    if (o < r.length)
      a = r.charCodeAt(o);
    else {
      if (a === 47)
        break;
      a = 47;
    }
    if (a === 47) {
      if (!(i === o - 1 || n === 1)) if (i !== o - 1 && n === 2) {
        if (t.length < 2 || s !== 2 || t.charCodeAt(t.length - 1) !== 46 || t.charCodeAt(t.length - 2) !== 46) {
          if (t.length > 2) {
            const h = t.lastIndexOf("/");
            if (h !== t.length - 1) {
              h === -1 ? (t = "", s = 0) : (t = t.slice(0, h), s = t.length - 1 - t.lastIndexOf("/")), i = o, n = 0;
              continue;
            }
          } else if (t.length === 2 || t.length === 1) {
            t = "", s = 0, i = o, n = 0;
            continue;
          }
        }
      } else
        t.length > 0 ? t += `/${r.slice(i + 1, o)}` : t = r.slice(i + 1, o), s = o - i - 1;
      i = o, n = 0;
    } else a === 46 && n !== -1 ? ++n : n = -1;
  }
  return t;
}
const Ee = {
  /**
   * Converts a path to posix format.
   * @param path - The path to convert to posix
   */
  toPosix(r) {
    return ou(r, "\\", "/");
  },
  /**
   * Checks if the path is a URL e.g. http://, https://
   * @param path - The path to check
   */
  isUrl(r) {
    return /^https?:/.test(this.toPosix(r));
  },
  /**
   * Checks if the path is a data URL
   * @param path - The path to check
   */
  isDataUrl(r) {
    return /^data:([a-z]+\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}()_|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s<>]*?)$/i.test(r);
  },
  /**
   * Checks if the path is a blob URL
   * @param path - The path to check
   */
  isBlobUrl(r) {
    return r.startsWith("blob:");
  },
  /**
   * Checks if the path has a protocol e.g. http://, https://, file:///, data:, blob:, C:/
   * This will return true for windows file paths
   * @param path - The path to check
   */
  hasProtocol(r) {
    return /^[^/:]+:/.test(this.toPosix(r));
  },
  /**
   * Returns the protocol of the path e.g. http://, https://, file:///, data:, blob:, C:/
   * @param path - The path to get the protocol from
   */
  getProtocol(r) {
    Ue(r), r = this.toPosix(r);
    const e = /^file:\/\/\//.exec(r);
    if (e)
      return e[0];
    const t = /^[^/:]+:\/{0,2}/.exec(r);
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
  toAbsolute(r, e, t) {
    if (Ue(r), this.isDataUrl(r) || this.isBlobUrl(r))
      return r;
    const s = Dt(this.toPosix(e ?? J.get().getBaseUrl())), i = Dt(this.toPosix(t ?? this.rootname(s)));
    return r = this.toPosix(r), r.startsWith("/") ? Ee.join(i, r.slice(1)) : this.isAbsolute(r) ? r : this.join(s, r);
  },
  /**
   * Normalizes the given path, resolving '..' and '.' segments
   * @param path - The path to normalize
   */
  normalize(r) {
    if (Ue(r), r.length === 0)
      return ".";
    if (this.isDataUrl(r) || this.isBlobUrl(r))
      return r;
    r = this.toPosix(r);
    let e = "";
    const t = r.startsWith("/");
    this.hasProtocol(r) && (e = this.rootname(r), r = r.slice(e.length));
    const s = r.endsWith("/");
    return r = hu(r), r.length > 0 && s && (r += "/"), t ? `/${r}` : e + r;
  },
  /**
   * Determines if path is an absolute path.
   * Absolute paths can be urls, data urls, or paths on disk
   * @param path - The path to test
   */
  isAbsolute(r) {
    return Ue(r), r = this.toPosix(r), this.hasProtocol(r) ? !0 : r.startsWith("/");
  },
  /**
   * Joins all given path segments together using the platform-specific separator as a delimiter,
   * then normalizes the resulting path
   * @param segments - The segments of the path to join
   */
  join(...r) {
    if (r.length === 0)
      return ".";
    let e;
    for (let t = 0; t < r.length; ++t) {
      const s = r[t];
      if (Ue(s), s.length > 0)
        if (e === void 0)
          e = s;
        else {
          const i = r[t - 1] ?? "";
          this.joinExtensions.includes(this.extname(i).toLowerCase()) ? e += `/../${s}` : e += `/${s}`;
        }
    }
    return e === void 0 ? "." : this.normalize(e);
  },
  /**
   * Returns the directory name of a path
   * @param path - The path to parse
   */
  dirname(r) {
    if (Ue(r), r.length === 0)
      return ".";
    r = this.toPosix(r);
    let e = r.charCodeAt(0);
    const t = e === 47;
    let s = -1, i = !0;
    const n = this.getProtocol(r), a = r;
    r = r.slice(n.length);
    for (let o = r.length - 1; o >= 1; --o)
      if (e = r.charCodeAt(o), e === 47) {
        if (!i) {
          s = o;
          break;
        }
      } else
        i = !1;
    return s === -1 ? t ? "/" : this.isUrl(a) ? n + r : n : t && s === 1 ? "//" : n + r.slice(0, s);
  },
  /**
   * Returns the root of the path e.g. /, C:/, file:///, http://domain.com/
   * @param path - The path to parse
   */
  rootname(r) {
    Ue(r), r = this.toPosix(r);
    let e = "";
    if (r.startsWith("/") ? e = "/" : e = this.getProtocol(r), this.isUrl(r)) {
      const t = r.indexOf("/", e.length);
      t !== -1 ? e = r.slice(0, t) : e = r, e.endsWith("/") || (e += "/");
    }
    return e;
  },
  /**
   * Returns the last portion of a path
   * @param path - The path to test
   * @param ext - Optional extension to remove
   */
  basename(r, e) {
    Ue(r), e && Ue(e), r = Dt(this.toPosix(r));
    let t = 0, s = -1, i = !0, n;
    if (e !== void 0 && e.length > 0 && e.length <= r.length) {
      if (e.length === r.length && e === r)
        return "";
      let a = e.length - 1, o = -1;
      for (n = r.length - 1; n >= 0; --n) {
        const h = r.charCodeAt(n);
        if (h === 47) {
          if (!i) {
            t = n + 1;
            break;
          }
        } else
          o === -1 && (i = !1, o = n + 1), a >= 0 && (h === e.charCodeAt(a) ? --a === -1 && (s = n) : (a = -1, s = o));
      }
      return t === s ? s = o : s === -1 && (s = r.length), r.slice(t, s);
    }
    for (n = r.length - 1; n >= 0; --n)
      if (r.charCodeAt(n) === 47) {
        if (!i) {
          t = n + 1;
          break;
        }
      } else s === -1 && (i = !1, s = n + 1);
    return s === -1 ? "" : r.slice(t, s);
  },
  /**
   * Returns the extension of the path, from the last occurrence of the . (period) character to end of string in the last
   * portion of the path. If there is no . in the last portion of the path, or if there are no . characters other than
   * the first character of the basename of path, an empty string is returned.
   * @param path - The path to parse
   */
  extname(r) {
    Ue(r), r = Dt(this.toPosix(r));
    let e = -1, t = 0, s = -1, i = !0, n = 0;
    for (let a = r.length - 1; a >= 0; --a) {
      const o = r.charCodeAt(a);
      if (o === 47) {
        if (!i) {
          t = a + 1;
          break;
        }
        continue;
      }
      s === -1 && (i = !1, s = a + 1), o === 46 ? e === -1 ? e = a : n !== 1 && (n = 1) : e !== -1 && (n = -1);
    }
    return e === -1 || s === -1 || n === 0 || n === 1 && e === s - 1 && e === t + 1 ? "" : r.slice(e, s);
  },
  /**
   * Parses a path into an object containing the 'root', `dir`, `base`, `ext`, and `name` properties.
   * @param path - The path to parse
   */
  parse(r) {
    Ue(r);
    const e = { root: "", dir: "", base: "", ext: "", name: "" };
    if (r.length === 0)
      return e;
    r = Dt(this.toPosix(r));
    let t = r.charCodeAt(0);
    const s = this.isAbsolute(r);
    let i;
    e.root = this.rootname(r), s || this.hasProtocol(r) ? i = 1 : i = 0;
    let n = -1, a = 0, o = -1, h = !0, c = r.length - 1, l = 0;
    for (; c >= i; --c) {
      if (t = r.charCodeAt(c), t === 47) {
        if (!h) {
          a = c + 1;
          break;
        }
        continue;
      }
      o === -1 && (h = !1, o = c + 1), t === 46 ? n === -1 ? n = c : l !== 1 && (l = 1) : n !== -1 && (l = -1);
    }
    return n === -1 || o === -1 || l === 0 || l === 1 && n === o - 1 && n === a + 1 ? o !== -1 && (a === 0 && s ? e.base = e.name = r.slice(1, o) : e.base = e.name = r.slice(a, o)) : (a === 0 && s ? (e.name = r.slice(1, n), e.base = r.slice(1, o)) : (e.name = r.slice(a, n), e.base = r.slice(a, o)), e.ext = r.slice(n, o)), e.dir = this.dirname(r), e;
  },
  sep: "/",
  delimiter: ":",
  joinExtensions: [".html"]
};
function Ao(r, e, t, s, i) {
  const n = e[t];
  for (let a = 0; a < n.length; a++) {
    const o = n[a];
    t < e.length - 1 ? Ao(r.replace(s[t], o), e, t + 1, s, i) : i.push(r.replace(s[t], o));
  }
}
function cu(r) {
  const e = /\{(.*?)\}/g, t = r.match(e), s = [];
  if (t) {
    const i = [];
    t.forEach((n) => {
      const a = n.substring(1, n.length - 1).split(",");
      i.push(a);
    }), Ao(r, i, 0, t, s);
  } else
    s.push(r);
  return s;
}
const Ls = (r) => !Array.isArray(r);
class Rt {
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
      this._defaultSearchParams = Object.keys(t).map((s) => `${encodeURIComponent(s)}=${encodeURIComponent(t[s])}`).join("&");
    }
  }
  /**
   * Returns the aliases for a given asset
   * @param asset - the asset to get the aliases for
   */
  getAlias(e) {
    const { alias: t, src: s } = e;
    return De(
      t || s,
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
    this._manifest && $("[Resolver] Manifest already exists, this will be overwritten"), this._manifest = e, e.bundles.forEach((t) => {
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
    const s = [];
    let i = t;
    Array.isArray(t) || (i = Object.entries(t).map(([n, a]) => typeof a == "string" || Array.isArray(a) ? { alias: n, src: a } : { alias: n, ...a })), i.forEach((n) => {
      const a = n.src, o = n.alias;
      let h;
      if (typeof o == "string") {
        const c = this._createBundleAssetId(e, o);
        s.push(c), h = [o, c];
      } else {
        const c = o.map((l) => this._createBundleAssetId(e, l));
        s.push(...c), h = [...o, ...c];
      }
      this.add({
        ...n,
        alias: h,
        src: a
      });
    }), this._bundles[e] = s;
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
    let s;
    s = (n) => {
      this.hasKey(n) && $(`[Resolver] already has key: ${n} overwriting`);
    }, De(t).forEach((n) => {
      const { src: a } = n;
      let { data: o, format: h, loadParser: c } = n;
      const l = De(a).map((f) => typeof f == "string" ? cu(f) : Array.isArray(f) ? f : [f]), u = this.getAlias(n);
      Array.isArray(u) ? u.forEach(s) : s(u);
      const d = [];
      l.forEach((f) => {
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
            o = p.data ?? o, h = p.format ?? h, c = p.loadParser ?? c, g = {
              ...g,
              ...p
            };
          if (!u)
            throw new Error(`[Resolver] alias is undefined for this asset: ${g.src}`);
          g = this._buildResolvedAsset(g, {
            aliases: u,
            data: o,
            format: h,
            loadParser: c
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
    const t = Ls(e);
    e = De(e);
    const s = {};
    return e.forEach((i) => {
      const n = this._bundles[i];
      if (n) {
        const a = this.resolve(n), o = {};
        for (const h in a) {
          const c = a[h];
          o[this._extractAssetIdFromBundle(i, h)] = c;
        }
        s[i] = o;
      }
    }), t ? s[e[0]] : s;
  }
  /**
   * Does exactly what resolve does, but returns just the URL rather than the whole asset object
   * @param key - The key or keys to resolve
   * @returns - The URLs associated with the key(s)
   */
  resolveUrl(e) {
    const t = this.resolve(e);
    if (typeof e != "string") {
      const s = {};
      for (const i in t)
        s[i] = t[i].src;
      return s;
    }
    return t.src;
  }
  resolve(e) {
    const t = Ls(e);
    e = De(e);
    const s = {};
    return e.forEach((i) => {
      if (!this._resolverHash[i])
        if (this._assetMap[i]) {
          let n = this._assetMap[i];
          const a = this._getPreferredOrder(n);
          a == null || a.priority.forEach((o) => {
            a.params[o].forEach((h) => {
              const c = n.filter((l) => l[o] ? l[o] === h : !1);
              c.length && (n = c);
            });
          }), this._resolverHash[i] = n[0];
        } else
          this._resolverHash[i] = this._buildResolvedAsset({
            alias: [i],
            src: i
          }, {});
      s[i] = this._resolverHash[i];
    }), t ? s[e[0]] : s;
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
      const s = e[t], i = this._preferredOrder.find((n) => n.params.format.includes(s.format));
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
    const { aliases: s, data: i, loadParser: n, format: a } = t;
    return (this._basePath || this._rootPath) && (e.src = Ee.toAbsolute(e.src, this._basePath, this._rootPath)), e.alias = s ?? e.alias ?? [e.src], e.src = this._appendDefaultSearchParams(e.src), e.data = { ...i || {}, ...e.data }, e.loadParser = n ?? e.loadParser, e.format = a ?? e.format ?? lu(e.src), e;
  }
}
Rt.RETINA_PREFIX = /@([0-9\.]+)x/;
function lu(r) {
  return r.split(".").pop().split("?").shift().split("#").shift();
}
const Yr = (r, e) => {
  const t = e.split("?")[1];
  return t && (r += `?${t}`), r;
}, Co = class Vt {
  /**
   * @param texture - Reference to the source BaseTexture object.
   * @param {object} data - Spritesheet image data.
   */
  constructor(e, t) {
    this.linkedSheets = [], this._texture = e instanceof H ? e : null, this.textureSource = e.source, this.textures = {}, this.animations = {}, this.data = t;
    const s = parseFloat(t.meta.scale);
    s ? (this.resolution = s, e.source.resolution = this.resolution) : this.resolution = e.source._resolution, this._frames = this.data.frames, this._frameKeys = Object.keys(this._frames), this._batchIndex = 0, this._callback = null;
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
    const s = Vt.BATCH_SIZE;
    for (; t - e < s && t < this._frameKeys.length; ) {
      const i = this._frameKeys[t], n = this._frames[i], a = n.frame;
      if (a) {
        let o = null, h = null;
        const c = n.trimmed !== !1 && n.sourceSize ? n.sourceSize : n.frame, l = new oe(
          0,
          0,
          Math.floor(c.w) / this.resolution,
          Math.floor(c.h) / this.resolution
        );
        n.rotated ? o = new oe(
          Math.floor(a.x) / this.resolution,
          Math.floor(a.y) / this.resolution,
          Math.floor(a.h) / this.resolution,
          Math.floor(a.w) / this.resolution
        ) : o = new oe(
          Math.floor(a.x) / this.resolution,
          Math.floor(a.y) / this.resolution,
          Math.floor(a.w) / this.resolution,
          Math.floor(a.h) / this.resolution
        ), n.trimmed !== !1 && n.spriteSourceSize && (h = new oe(
          Math.floor(n.spriteSourceSize.x) / this.resolution,
          Math.floor(n.spriteSourceSize.y) / this.resolution,
          Math.floor(a.w) / this.resolution,
          Math.floor(a.h) / this.resolution
        )), this.textures[i] = new H({
          source: this.textureSource,
          frame: o,
          orig: l,
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
      for (let s = 0; s < e[t].length; s++) {
        const i = e[t][s];
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
    for (const s in this.textures)
      this.textures[s].destroy();
    this._frames = null, this._frameKeys = null, this.data = null, this.textures = null, e && ((t = this._texture) == null || t.destroy(), this.textureSource.destroy()), this._texture = null, this.textureSource = null, this.linkedSheets = [];
  }
};
Co.BATCH_SIZE = 1e3;
let wn = Co;
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
function Po(r, e, t) {
  const s = {};
  if (r.forEach((i) => {
    s[i] = e;
  }), Object.keys(e.textures).forEach((i) => {
    s[i] = e.textures[i];
  }), !t) {
    const i = Ee.dirname(r[0]);
    e.linkedSheets.forEach((n, a) => {
      const o = Po([`${i}/${e.data.meta.related_multi_packs[a]}`], n, !0);
      Object.assign(s, o);
    });
  }
  return s;
}
const du = {
  extension: T.Asset,
  /** Handle the caching of the related Spritesheet Textures */
  cache: {
    test: (r) => r instanceof wn,
    getCacheableAssets: (r, e) => Po(r, e, !1)
  },
  /** Resolve the resolution of the asset. */
  resolver: {
    extension: {
      type: T.ResolveParser,
      name: "resolveSpritesheet"
    },
    test: (r) => {
      const t = r.split("?")[0].split("."), s = t.pop(), i = t.pop();
      return s === "json" && uu.includes(i);
    },
    parse: (r) => {
      var t;
      const e = r.split(".");
      return {
        resolution: parseFloat(((t = Rt.RETINA_PREFIX.exec(r)) == null ? void 0 : t[1]) ?? "1"),
        format: e[e.length - 2],
        src: r
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
      type: T.LoadParser,
      priority: at.Normal,
      name: "spritesheetLoader"
    },
    async testParse(r, e) {
      return Ee.extname(e.src).toLowerCase() === ".json" && !!r.frames;
    },
    async parse(r, e, t) {
      var l, u;
      const {
        texture: s,
        // if user need to use preloaded texture
        imageFilename: i,
        // if user need to use custom filename (not from jsonFile.meta.image)
        textureOptions: n
        // if user need to set texture options on texture
      } = (e == null ? void 0 : e.data) ?? {};
      let a = Ee.dirname(e.src);
      a && a.lastIndexOf("/") !== a.length - 1 && (a += "/");
      let o;
      if (s instanceof H)
        o = s;
      else {
        const d = Yr(a + (i ?? r.meta.image), e.src);
        o = (await t.load([{ src: d, data: n }]))[d];
      }
      const h = new wn(
        o.source,
        r
      );
      await h.parse();
      const c = (l = r == null ? void 0 : r.meta) == null ? void 0 : l.related_multi_packs;
      if (Array.isArray(c)) {
        const d = [];
        for (const p of c) {
          if (typeof p != "string")
            continue;
          let g = a + p;
          (u = e.data) != null && u.ignoreMultiPack || (g = Yr(g, e.src), d.push(t.load({
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
    async unload(r, e, t) {
      await t.unload(r.textureSource._sourceOrigin), r.destroy(!1);
    }
  }
};
V.add(du);
class ns {
  /**
   * @param manager - The event boundary which manages this event. Propagation can only occur
   *  within the boundary's jurisdiction.
   */
  constructor(e) {
    this.bubbles = !0, this.cancelBubble = !0, this.cancelable = !1, this.composed = !1, this.defaultPrevented = !1, this.eventPhase = ns.prototype.NONE, this.propagationStopped = !1, this.propagationImmediatelyStopped = !1, this.layer = new he(), this.page = new he(), this.NONE = 0, this.CAPTURING_PHASE = 1, this.AT_TARGET = 2, this.BUBBLING_PHASE = 3, this.manager = e;
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
  initEvent(e, t, s) {
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
  initUIEvent(e, t, s, i, n) {
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
var lr = /iPhone/i, An = /iPod/i, Cn = /iPad/i, Pn = /\biOS-universal(?:.+)Mac\b/i, ur = /\bAndroid(?:.+)Mobile\b/i, En = /Android/i, xt = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i, ms = /Silk/i, je = /Windows Phone/i, Mn = /\bWindows(?:.+)ARM\b/i, Bn = /BlackBerry/i, Rn = /BB10/i, kn = /Opera Mini/i, In = /\b(CriOS|Chrome)(?:.+)Mobile/i, Gn = /Mobile(?:.+)Firefox\b/i, Un = function(r) {
  return typeof r < "u" && r.platform === "MacIntel" && typeof r.maxTouchPoints == "number" && r.maxTouchPoints > 1 && typeof MSStream > "u";
};
function fu(r) {
  return function(e) {
    return e.test(r);
  };
}
function Fn(r) {
  var e = {
    userAgent: "",
    platform: "",
    maxTouchPoints: 0
  };
  !r && typeof navigator < "u" ? e = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints || 0
  } : typeof r == "string" ? e.userAgent = r : r && r.userAgent && (e = {
    userAgent: r.userAgent,
    platform: r.platform,
    maxTouchPoints: r.maxTouchPoints || 0
  });
  var t = e.userAgent, s = t.split("[FBAN");
  typeof s[1] < "u" && (t = s[0]), s = t.split("Twitter"), typeof s[1] < "u" && (t = s[0]);
  var i = fu(t), n = {
    apple: {
      phone: i(lr) && !i(je),
      ipod: i(An),
      tablet: !i(lr) && (i(Cn) || Un(e)) && !i(je),
      universal: i(Pn),
      device: (i(lr) || i(An) || i(Cn) || i(Pn) || Un(e)) && !i(je)
    },
    amazon: {
      phone: i(xt),
      tablet: !i(xt) && i(ms),
      device: i(xt) || i(ms)
    },
    android: {
      phone: !i(je) && i(xt) || !i(je) && i(ur),
      tablet: !i(je) && !i(xt) && !i(ur) && (i(ms) || i(En)),
      device: !i(je) && (i(xt) || i(ms) || i(ur) || i(En)) || i(/\bokhttp\b/i)
    },
    windows: {
      phone: i(je),
      tablet: i(Mn),
      device: i(je) || i(Mn)
    },
    other: {
      blackberry: i(Bn),
      blackberry10: i(Rn),
      opera: i(kn),
      firefox: i(Gn),
      chrome: i(In),
      device: i(Bn) || i(Rn) || i(kn) || i(Gn) || i(In)
    },
    any: !1,
    phone: !1,
    tablet: !1
  };
  return n.any = n.apple.device || n.android.device || n.windows.device || n.other.device, n.phone = n.apple.phone || n.android.phone || n.windows.phone, n.tablet = n.apple.tablet || n.android.tablet || n.windows.tablet, n;
}
const pu = Fn.default ?? Fn, mu = pu(globalThis.navigator), gu = 9, gs = 100, _u = 0, xu = 0, Dn = 2, On = 1, yu = -1e3, bu = -1e3, vu = 2, Si = class Eo {
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
    e.style.width = `${On}px`, e.style.height = `${On}px`, e.style.position = "absolute", e.style.top = `${yu}px`, e.style.left = `${bu}px`, e.style.zIndex = vu.toString(), e.style.backgroundColor = "#FF0000", e.title = "select to enable accessibility for this content", e.addEventListener("focus", () => {
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
    this._isActive = !0, this._div || (this._div = document.createElement("div"), this._div.style.width = `${gs}px`, this._div.style.height = `${gs}px`, this._div.style.position = "absolute", this._div.style.top = `${_u}px`, this._div.style.left = `${xu}px`, this._div.style.zIndex = Dn.toString(), this._div.style.pointerEvents = "none"), this._activateOnTab && (this._onKeyDown = this._onKeyDown.bind(this), globalThis.addEventListener("keydown", this._onKeyDown, !1)), this._deactivateOnMouseMove && (this._onMouseMove = this._onMouseMove.bind(this), globalThis.document.addEventListener("mousemove", this._onMouseMove, !0));
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
      for (let s = 0; s < t.length; s++)
        this._updateAccessibleObjects(t[s]);
  }
  /**
   * Runner init called, view is available at this point.
   * @ignore
   */
  init(e) {
    const s = {
      accessibilityOptions: {
        ...Eo.defaultOptions,
        ...(e == null ? void 0 : e.accessibilityOptions) || {}
      }
    };
    this.debug = s.accessibilityOptions.debug, this._activateOnTab = s.accessibilityOptions.activateOnTab, this._deactivateOnMouseMove = s.accessibilityOptions.deactivateOnMouseMove, s.accessibilityOptions.enabledByDefault ? this._activate() : this._activateOnTab && (this._onKeyDown = this._onKeyDown.bind(this), globalThis.addEventListener("keydown", this._onKeyDown, !1)), this._renderer.runners.postrender.remove(this);
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
      for (const s of this._children)
        s._renderId === this._renderId && t.add(this._children.indexOf(s));
    }
    for (let s = this._children.length - 1; s >= 0; s--) {
      const i = this._children[s];
      t.has(s) || (i._accessibleDiv && i._accessibleDiv.parentNode && (i._accessibleDiv.parentNode.removeChild(i._accessibleDiv), this._pool.push(i._accessibleDiv), i._accessibleDiv = null), i._accessibleActive = !1, ho(this._children, s, 1));
    }
    if (this._renderer.renderingToScreen) {
      const { x: s, y: i, width: n, height: a } = this._renderer.screen, o = this._div;
      o.style.left = `${s}px`, o.style.top = `${i}px`, o.style.width = `${n}px`, o.style.height = `${a}px`;
    }
    for (let s = 0; s < this._children.length; s++) {
      const i = this._children[s];
      if (!i._accessibleActive || !i._accessibleDiv)
        continue;
      const n = i._accessibleDiv, a = i.hitArea || i.getBounds().rectangle;
      if (i.hitArea) {
        const o = i.worldTransform, h = this._renderer.resolution, c = this._renderer.resolution;
        n.style.left = `${(o.tx + a.x * o.a) * h}px`, n.style.top = `${(o.ty + a.y * o.d) * c}px`, n.style.width = `${a.width * o.a * h}px`, n.style.height = `${a.height * o.d * c}px`;
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
    const { width: t, height: s } = this._renderer;
    e.x + e.width > t && (e.width = t - e.x), e.y + e.height > s && (e.height = s - e.y);
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
                    `, e.accessibleText && (t.innerText = e.accessibleText)), t.style.width = `${gs}px`, t.style.height = `${gs}px`, t.style.backgroundColor = this.debug ? "rgba(255,255,255,0.5)" : "transparent", t.style.position = "absolute", t.style.zIndex = Dn.toString(), t.style.borderStyle = "none", navigator.userAgent.toLowerCase().includes("chrome") ? t.setAttribute("aria-live", "off") : t.setAttribute("aria-live", "polite"), navigator.userAgent.match(/rv:.*Gecko\//) ? t.setAttribute("aria-relevant", "additions") : t.setAttribute("aria-relevant", "text"), t.addEventListener("click", this._onClick.bind(this)), t.addEventListener("focus", this._onFocus.bind(this)), t.addEventListener("focusout", this._onFocusOut.bind(this))), t.style.pointerEvents = e.accessiblePointerEvents, t.type = e.accessibleType, e.accessibleTitle && e.accessibleTitle !== null ? t.title = e.accessibleTitle : (!e.accessibleHint || e.accessibleHint === null) && (t.title = `container ${e.tabIndex}`), e.accessibleHint && e.accessibleHint !== null && t.setAttribute("aria-label", e.accessibleHint), this.debug && this._updateDebugHTML(t), e._accessibleActive = !0, e._accessibleDiv = t, t.container = e, this._children.push(e), this._div.appendChild(e._accessibleDiv), e.interactive && (e._accessibleDiv.tabIndex = e.tabIndex);
  }
  /**
   * Dispatch events with the EventSystem.
   * @param e
   * @param type
   * @private
   */
  _dispatchEvent(e, t) {
    const { container: s } = e.target, i = this._renderer.events.rootBoundary, n = Object.assign(new ns(i), { target: s });
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
Si.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem
  ],
  name: "accessibility"
};
Si.defaultOptions = {
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
let Tu = Si;
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
}, dr = /* @__PURE__ */ Object.create(null), Ln = /* @__PURE__ */ Object.create(null);
function ss(r, e) {
  let t = Ln[r];
  return t === void 0 && (dr[e] === void 0 && (dr[e] = 1), Ln[r] = t = dr[e]++), t;
}
let yt;
function Mo() {
  return (!yt || yt != null && yt.isContextLost()) && (yt = J.get().createCanvas().getContext("webgl", {})), yt;
}
let _s;
function wu() {
  if (!_s) {
    _s = "mediump";
    const r = Mo();
    r && r.getShaderPrecisionFormat && (_s = r.getShaderPrecisionFormat(r.FRAGMENT_SHADER, r.HIGH_FLOAT).precision ? "highp" : "mediump");
  }
  return _s;
}
function Au(r, e, t) {
  return e ? r : t ? (r = r.replace("out vec4 finalColor;", ""), `
        
        #ifdef GL_ES // This checks if it is WebGL1
        #define in varying
        #define finalColor gl_FragColor
        #define texture texture2D
        #endif
        ${r}
        `) : `
        
        #ifdef GL_ES // This checks if it is WebGL1
        #define in attribute
        #define out varying
        #endif
        ${r}
        `;
}
function Cu(r, e, t) {
  const s = t ? e.maxSupportedFragmentPrecision : e.maxSupportedVertexPrecision;
  if (r.substring(0, 9) !== "precision") {
    let i = t ? e.requestedFragmentPrecision : e.requestedVertexPrecision;
    return i === "highp" && s !== "highp" && (i = "mediump"), `precision ${i} float;
${r}`;
  } else if (s !== "highp" && r.substring(0, 15) === "precision highp")
    return r.replace("precision highp", "precision mediump");
  return r;
}
function Pu(r, e) {
  return e ? `#version 300 es
${r}` : r;
}
const Eu = {}, Mu = {};
function Bu(r, { name: e = "pixi-program" }, t = !0) {
  e = e.replace(/\s+/g, "-"), e += t ? "-fragment" : "-vertex";
  const s = t ? Eu : Mu;
  return s[e] ? (s[e]++, e += `-${s[e]}`) : s[e] = 1, r.indexOf("#define SHADER_NAME") !== -1 ? r : `${`#define SHADER_NAME ${e}`}
${r}`;
}
function Ru(r, e) {
  return e ? r.replace("#version 300 es", "") : r;
}
const fr = {
  // strips any version headers..
  stripVersion: Ru,
  // adds precision string if not already present
  ensurePrecision: Cu,
  // add some defines if WebGL1 to make it more compatible with WebGL2 shaders
  addProgramDefines: Au,
  // add the program name to the shader
  setProgramName: Bu,
  // add the version string to the shader header
  insertVersion: Pu
}, pr = /* @__PURE__ */ Object.create(null), Bo = class Kr {
  /**
   * Creates a shiny new GlProgram. Used by WebGL renderer.
   * @param options - The options for the program.
   */
  constructor(e) {
    e = { ...Kr.defaultOptions, ...e };
    const t = e.fragment.indexOf("#version 300 es") !== -1, s = {
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
    Object.keys(fr).forEach((a) => {
      const o = s[a];
      i = fr[a](i, o, !0), n = fr[a](n, o, !1);
    }), this.fragment = i, this.vertex = n, this.transformFeedbackVaryings = e.transformFeedbackVaryings, this._key = ss(`${this.vertex}:${this.fragment}`, "gl-program");
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
    return pr[t] || (pr[t] = new Kr(e)), pr[t];
  }
};
Bo.defaultOptions = {
  preferredVertexPrecision: "highp",
  preferredFragmentPrecision: "mediump"
};
let kt = Bo;
const Nn = {
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
function it(r) {
  return Nn[r] ?? Nn.float32;
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
function Iu({ source: r, entryPoint: e }) {
  const t = {}, s = r.indexOf(`fn ${e}`);
  if (s !== -1) {
    const i = r.indexOf("->", s);
    if (i !== -1) {
      const n = r.substring(s, i), a = /@location\((\d+)\)\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_<>]+)(?:,|\s|$)/g;
      let o;
      for (; (o = a.exec(n)) !== null; ) {
        const h = ku[o[3]] ?? "float32";
        t[o[2]] = {
          location: parseInt(o[1], 10),
          format: h,
          stride: it(h).stride,
          offset: 0,
          instance: !1,
          start: 0
        };
      }
    }
  }
  return t;
}
function mr(r) {
  var u, d;
  const e = /(^|[^/])@(group|binding)\(\d+\)[^;]+;/g, t = /@group\((\d+)\)/, s = /@binding\((\d+)\)/, i = /var(<[^>]+>)? (\w+)/, n = /:\s*(\w+)/, a = /struct\s+(\w+)\s*{([^}]+)}/g, o = /(\w+)\s*:\s*([\w\<\>]+)/g, h = /struct\s+(\w+)/, c = (u = r.match(e)) == null ? void 0 : u.map((f) => ({
    group: parseInt(f.match(t)[1], 10),
    binding: parseInt(f.match(s)[1], 10),
    name: f.match(i)[2],
    isUniform: f.match(i)[1] === "<uniform>",
    type: f.match(n)[1]
  }));
  if (!c)
    return {
      groups: [],
      structs: []
    };
  const l = ((d = r.match(a)) == null ? void 0 : d.map((f) => {
    const p = f.match(h)[1], g = f.match(o).reduce((m, y) => {
      const [x, v] = y.split(":");
      return m[x.trim()] = v.trim(), m;
    }, {});
    return g ? { name: p, members: g } : null;
  }).filter(({ name: f }) => c.some((p) => p.type === f))) ?? [];
  return {
    groups: c,
    structs: l
  };
}
var $t = /* @__PURE__ */ ((r) => (r[r.VERTEX = 1] = "VERTEX", r[r.FRAGMENT = 2] = "FRAGMENT", r[r.COMPUTE = 4] = "COMPUTE", r))($t || {});
function Gu({ groups: r }) {
  const e = [];
  for (let t = 0; t < r.length; t++) {
    const s = r[t];
    e[s.group] || (e[s.group] = []), s.isUniform ? e[s.group].push({
      binding: s.binding,
      visibility: $t.VERTEX | $t.FRAGMENT,
      buffer: {
        type: "uniform"
      }
    }) : s.type === "sampler" ? e[s.group].push({
      binding: s.binding,
      visibility: $t.FRAGMENT,
      sampler: {
        type: "filtering"
      }
    }) : s.type === "texture_2d" && e[s.group].push({
      binding: s.binding,
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
function Uu({ groups: r }) {
  const e = [];
  for (let t = 0; t < r.length; t++) {
    const s = r[t];
    e[s.group] || (e[s.group] = {}), e[s.group][s.name] = s.binding;
  }
  return e;
}
function Fu(r, e) {
  const t = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), i = [...r.structs, ...e.structs].filter((a) => t.has(a.name) ? !1 : (t.add(a.name), !0)), n = [...r.groups, ...e.groups].filter((a) => {
    const o = `${a.name}-${a.binding}`;
    return s.has(o) ? !1 : (s.add(o), !0);
  });
  return { structs: i, groups: n };
}
const gr = /* @__PURE__ */ Object.create(null);
class _t {
  /**
   * Create a new GpuProgram
   * @param options - The options for the gpu program
   */
  constructor(e) {
    var o, h;
    this._layoutKey = 0, this._attributeLocationsKey = 0;
    const { fragment: t, vertex: s, layout: i, gpuLayout: n, name: a } = e;
    if (this.name = a, this.fragment = t, this.vertex = s, t.source === s.source) {
      const c = mr(t.source);
      this.structsAndGroups = c;
    } else {
      const c = mr(s.source), l = mr(t.source);
      this.structsAndGroups = Fu(c, l);
    }
    this.layout = i ?? Uu(this.structsAndGroups), this.gpuLayout = n ?? Gu(this.structsAndGroups), this.autoAssignGlobalUniforms = ((o = this.layout[0]) == null ? void 0 : o.globalUniforms) !== void 0, this.autoAssignLocalUniforms = ((h = this.layout[1]) == null ? void 0 : h.localUniforms) !== void 0, this._generateProgramKey();
  }
  // TODO maker this pure
  _generateProgramKey() {
    const { vertex: e, fragment: t } = this, s = e.source + t.source + e.entryPoint + t.entryPoint;
    this._layoutKey = ss(s, "program");
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
    return gr[t] || (gr[t] = new _t(e)), gr[t];
  }
}
const Ro = [
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
], Du = Ro.reduce((r, e) => (r[e] = !0, r), {});
function Ou(r, e) {
  switch (r) {
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
const ko = class Io {
  /**
   * Create a new Uniform group
   * @param uniformStructures - The structures of the uniform group
   * @param options - The optional parameters of this uniform group
   */
  constructor(e, t) {
    this._touched = 0, this.uid = le("uniform"), this._resourceType = "uniformGroup", this._resourceId = le("resource"), this.isUniformGroup = !0, this._dirtyId = 0, this.destroyed = !1, t = { ...Io.defaultOptions, ...t }, this.uniformStructures = e;
    const s = {};
    for (const i in e) {
      const n = e[i];
      if (n.name = i, n.size = n.size ?? 1, !Du[n.type])
        throw new Error(`Uniform type ${n.type} is not supported. Supported uniform types are: ${Ro.join(", ")}`);
      n.value ?? (n.value = Ou(n.type, n.size)), s[i] = n.value;
    }
    this.uniforms = s, this._dirtyId = 1, this.ubo = t.ubo, this.isStatic = t.isStatic, this._signature = ss(Object.keys(s).map(
      (i) => `${i}-${e[i].type}`
    ).join("-"), "uniform-group");
  }
  /** Call this if you want the uniform groups data to be uploaded to the GPU only useful if `isStatic` is true. */
  update() {
    this._dirtyId++;
  }
};
ko.defaultOptions = {
  /** if true the UniformGroup is handled as an Uniform buffer object. */
  ubo: !1,
  /** if true, then you are responsible for when the data is uploaded to the GPU by calling `update()` */
  isStatic: !1
};
let ve = ko;
class Ze {
  /**
   * Create a new instance eof the Bind Group.
   * @param resources - The resources that are bound together for use by a shader.
   */
  constructor(e) {
    this.resources = /* @__PURE__ */ Object.create(null), this._dirty = !0;
    let t = 0;
    for (const s in e) {
      const i = e[s];
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
    for (const s in this.resources)
      e[t++] = this.resources[s]._resourceId;
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
    const s = this.resources[t];
    e !== s && (s && ((i = e.off) == null || i.call(e, "change", this.onResourceChange, this)), (n = e.on) == null || n.call(e, "change", this.onResourceChange, this), this.resources[t] = e, this._dirty = !0);
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
    for (const s in t)
      t[s]._touched = e;
  }
  /** Destroys this bind group and removes all listeners. */
  destroy() {
    var t;
    const e = this.resources;
    for (const s in e) {
      const i = e[s];
      (t = i.off) == null || t.call(i, "change", this.onResourceChange, this);
    }
    this.resources = null;
  }
  onResourceChange(e) {
    if (this._dirty = !0, e.destroyed) {
      const t = this.resources;
      for (const s in t)
        t[s] === e && (t[s] = null);
    } else
      this._updateKey();
  }
}
var Oe = /* @__PURE__ */ ((r) => (r[r.WEBGL = 1] = "WEBGL", r[r.WEBGPU = 2] = "WEBGPU", r[r.BOTH = 3] = "BOTH", r))(Oe || {});
class Ge extends Be {
  constructor(e) {
    super(), this.uid = le("shader"), this._uniformBindMap = /* @__PURE__ */ Object.create(null), this._ownedBindGroups = [];
    let {
      gpuProgram: t,
      glProgram: s,
      groups: i,
      resources: n,
      compatibleRenderers: a,
      groupMap: o
    } = e;
    this.gpuProgram = t, this.glProgram = s, a === void 0 && (a = 0, t && (a |= Oe.WEBGPU), s && (a |= Oe.WEBGL)), this.compatibleRenderers = a;
    const h = {};
    if (!n && !i && (n = {}), n && i)
      throw new Error("[Shader] Cannot have both resources and groups");
    if (!t && i && !o)
      throw new Error("[Shader] No group map or WebGPU shader provided - consider using resources instead.");
    if (!t && i && o)
      for (const c in o)
        for (const l in o[c]) {
          const u = o[c][l];
          h[u] = {
            group: c,
            binding: l,
            name: u
          };
        }
    else if (t && i && !o) {
      const c = t.structsAndGroups.groups;
      o = {}, c.forEach((l) => {
        o[l.group] = o[l.group] || {}, o[l.group][l.binding] = l.name, h[l.name] = l;
      });
    } else if (n) {
      i = {}, o = {}, t && t.structsAndGroups.groups.forEach((u) => {
        o[u.group] = o[u.group] || {}, o[u.group][u.binding] = u.name, h[u.name] = u;
      });
      let c = 0;
      for (const l in n)
        h[l] || (i[99] || (i[99] = new Ze(), this._ownedBindGroups.push(i[99])), h[l] = { group: 99, binding: c, name: l }, o[99] = o[99] || {}, o[99][c] = l, c++);
      for (const l in n) {
        const u = l;
        let d = n[l];
        !d.source && !d._resourceType && (d = new ve(d));
        const f = h[u];
        f && (i[f.group] || (i[f.group] = new Ze(), this._ownedBindGroups.push(i[f.group])), i[f.group].setResource(d, f.binding));
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
  addResource(e, t, s) {
    var i, n;
    (i = this._uniformBindMap)[t] || (i[t] = {}), (n = this._uniformBindMap[t])[s] || (n[s] = e), this.groups[t] || (this.groups[t] = new Ze(), this._ownedBindGroups.push(this.groups[t]));
  }
  _buildResourceAccessor(e, t) {
    const s = {};
    for (const i in t) {
      const n = t[i];
      Object.defineProperty(s, n.name, {
        get() {
          return e[n.group].getResource(n.binding);
        },
        set(a) {
          e[n.group].setResource(a, n.binding);
        }
      });
    }
    return s;
  }
  /**
   * Use to destroy the shader when its not longer needed.
   * It will destroy the resources and remove listeners.
   * @param destroyPrograms - if the programs should be destroyed as well.
   * Make sure its not being used by other shaders!
   */
  destroy(e = !1) {
    var t, s;
    this.emit("destroy", this), e && ((t = this.gpuProgram) == null || t.destroy(), (s = this.glProgram) == null || s.destroy()), this.gpuProgram = null, this.glProgram = null, this.removeAllListeners(), this._uniformBindMap = null, this._ownedBindGroups.forEach((i) => {
      i.destroy();
    }), this._ownedBindGroups = null, this.resources = null, this.groups = null;
  }
  static from(e) {
    const { gpu: t, gl: s, ...i } = e;
    let n, a;
    return t && (n = _t.from(t)), s && (a = kt.from(s)), new Ge({
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
}, _r = 0, xr = 1, yr = 2, br = 3, vr = 4, Tr = 5, qr = class Go {
  constructor() {
    this.data = 0, this.blendMode = "normal", this.polygonOffset = 0, this.blend = !0, this.depthMask = !0;
  }
  /**
   * Activates blending of the computed fragment color values.
   * @default true
   */
  get blend() {
    return !!(this.data & 1 << _r);
  }
  set blend(e) {
    !!(this.data & 1 << _r) !== e && (this.data ^= 1 << _r);
  }
  /**
   * Activates adding an offset to depth values of polygon's fragments
   * @default false
   */
  get offsets() {
    return !!(this.data & 1 << xr);
  }
  set offsets(e) {
    !!(this.data & 1 << xr) !== e && (this.data ^= 1 << xr);
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
    return !!(this.data & 1 << yr);
  }
  set culling(e) {
    !!(this.data & 1 << yr) !== e && (this.data ^= 1 << yr);
  }
  /**
   * Activates depth comparisons and updates to the depth buffer.
   * @default false
   */
  get depthTest() {
    return !!(this.data & 1 << br);
  }
  set depthTest(e) {
    !!(this.data & 1 << br) !== e && (this.data ^= 1 << br);
  }
  /**
   * Enables or disables writing to the depth buffer.
   * @default true
   */
  get depthMask() {
    return !!(this.data & 1 << Tr);
  }
  set depthMask(e) {
    !!(this.data & 1 << Tr) !== e && (this.data ^= 1 << Tr);
  }
  /**
   * Specifies whether or not front or back-facing polygons can be culled.
   * @default false
   */
  get clockwiseFrontFace() {
    return !!(this.data & 1 << vr);
  }
  set clockwiseFrontFace(e) {
    !!(this.data & 1 << vr) !== e && (this.data ^= 1 << vr);
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
    const e = new Go();
    return e.depthTest = !1, e.blend = !0, e;
  }
};
qr.default2d = qr.for2d();
let Ie = qr;
const Uo = class Zr extends Ge {
  /**
   * @param options - The optional parameters of this filter.
   */
  constructor(e) {
    e = { ...Zr.defaultOptions, ...e }, super(e), this.enabled = !0, this._state = Ie.for2d(), this.blendMode = e.blendMode, this.padding = e.padding, typeof e.antialias == "boolean" ? this.antialias = e.antialias ? "on" : "off" : this.antialias = e.antialias, this.resolution = e.resolution, this.blendRequired = e.blendRequired, this.clipToViewport = e.clipToViewport, this.addResource("uTexture", 0, 1);
  }
  /**
   * Applies the filter
   * @param filterManager - The renderer to retrieve the filter from
   * @param input - The input render target.
   * @param output - The target to output to.
   * @param clearMode - Should the output be cleared before rendering to it
   */
  apply(e, t, s, i) {
    e.applyFilter(this, t, s, i);
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
    const { gpu: t, gl: s, ...i } = e;
    let n, a;
    return t && (n = _t.from(t)), s && (a = kt.from(s)), new Zr({
      gpuProgram: n,
      glProgram: a,
      ...i
    });
  }
};
Uo.defaultOptions = {
  blendMode: "normal",
  resolution: 1,
  padding: 0,
  antialias: "off",
  blendRequired: !1,
  clipToViewport: !0
};
let Nu = Uo;
const Qr = [];
V.handleByNamedList(T.Environment, Qr);
async function Hu(r) {
  if (!r)
    for (let e = 0; e < Qr.length; e++) {
      const t = Qr[e];
      if (t.value.test()) {
        await t.value.load();
        return;
      }
    }
}
let Ot;
function Fo() {
  if (typeof Ot == "boolean")
    return Ot;
  try {
    Ot = new Function("param1", "param2", "param3", "return param1[param2] === param3;")({ a: "b" }, "a", "b") === !0;
  } catch {
    Ot = !1;
  }
  return Ot;
}
var xs = { exports: {} }, Hn;
function Wu() {
  if (Hn) return xs.exports;
  Hn = 1, xs.exports = r, xs.exports.default = r;
  function r(_, b, S) {
    S = S || 2;
    var P = b && b.length, E = P ? b[0] * S : _.length, B = e(_, 0, E, S, !0), R = [];
    if (!B || B.next === B.prev) return R;
    var G, L, N, ie, ne, ee, fe;
    if (P && (B = h(_, b, B, S)), _.length > 80 * S) {
      G = N = _[0], L = ie = _[1];
      for (var re = S; re < E; re += S)
        ne = _[re], ee = _[re + 1], ne < G && (G = ne), ee < L && (L = ee), ne > N && (N = ne), ee > ie && (ie = ee);
      fe = Math.max(N - G, ie - L), fe = fe !== 0 ? 32767 / fe : 0;
    }
    return s(B, R, S, G, L, fe, 0), R;
  }
  function e(_, b, S, P, E) {
    var B, R;
    if (E === X(_, b, S, P) > 0)
      for (B = b; B < S; B += P) R = U(B, _[B], _[B + 1], R);
    else
      for (B = S - P; B >= b; B -= P) R = U(B, _[B], _[B + 1], R);
    return R && A(R, R.next) && (O(R), R = R.next), R;
  }
  function t(_, b) {
    if (!_) return _;
    b || (b = _);
    var S = _, P;
    do
      if (P = !1, !S.steiner && (A(S, S.next) || v(S.prev, S, S.next) === 0)) {
        if (O(S), S = b = S.prev, S === S.next) break;
        P = !0;
      } else
        S = S.next;
    while (P || S !== b);
    return b;
  }
  function s(_, b, S, P, E, B, R) {
    if (_) {
      !R && B && f(_, P, E, B);
      for (var G = _, L, N; _.prev !== _.next; ) {
        if (L = _.prev, N = _.next, B ? n(_, P, E, B) : i(_)) {
          b.push(L.i / S | 0), b.push(_.i / S | 0), b.push(N.i / S | 0), O(_), _ = N.next, G = N.next;
          continue;
        }
        if (_ = N, _ === G) {
          R ? R === 1 ? (_ = a(t(_), b, S), s(_, b, S, P, E, B, 2)) : R === 2 && o(_, b, S, P, E, B) : s(t(_), b, S, P, E, B, 1);
          break;
        }
      }
    }
  }
  function i(_) {
    var b = _.prev, S = _, P = _.next;
    if (v(b, S, P) >= 0) return !1;
    for (var E = b.x, B = S.x, R = P.x, G = b.y, L = S.y, N = P.y, ie = E < B ? E < R ? E : R : B < R ? B : R, ne = G < L ? G < N ? G : N : L < N ? L : N, ee = E > B ? E > R ? E : R : B > R ? B : R, fe = G > L ? G > N ? G : N : L > N ? L : N, re = P.next; re !== b; ) {
      if (re.x >= ie && re.x <= ee && re.y >= ne && re.y <= fe && y(E, G, B, L, R, N, re.x, re.y) && v(re.prev, re, re.next) >= 0) return !1;
      re = re.next;
    }
    return !0;
  }
  function n(_, b, S, P) {
    var E = _.prev, B = _, R = _.next;
    if (v(E, B, R) >= 0) return !1;
    for (var G = E.x, L = B.x, N = R.x, ie = E.y, ne = B.y, ee = R.y, fe = G < L ? G < N ? G : N : L < N ? L : N, re = ie < ne ? ie < ee ? ie : ee : ne < ee ? ne : ee, $e = G > L ? G > N ? G : N : L > N ? L : N, Ae = ie > ne ? ie > ee ? ie : ee : ne > ee ? ne : ee, Ne = g(fe, re, b, S, P), He = g($e, Ae, b, S, P), K = _.prevZ, te = _.nextZ; K && K.z >= Ne && te && te.z <= He; ) {
      if (K.x >= fe && K.x <= $e && K.y >= re && K.y <= Ae && K !== E && K !== R && y(G, ie, L, ne, N, ee, K.x, K.y) && v(K.prev, K, K.next) >= 0 || (K = K.prevZ, te.x >= fe && te.x <= $e && te.y >= re && te.y <= Ae && te !== E && te !== R && y(G, ie, L, ne, N, ee, te.x, te.y) && v(te.prev, te, te.next) >= 0)) return !1;
      te = te.nextZ;
    }
    for (; K && K.z >= Ne; ) {
      if (K.x >= fe && K.x <= $e && K.y >= re && K.y <= Ae && K !== E && K !== R && y(G, ie, L, ne, N, ee, K.x, K.y) && v(K.prev, K, K.next) >= 0) return !1;
      K = K.prevZ;
    }
    for (; te && te.z <= He; ) {
      if (te.x >= fe && te.x <= $e && te.y >= re && te.y <= Ae && te !== E && te !== R && y(G, ie, L, ne, N, ee, te.x, te.y) && v(te.prev, te, te.next) >= 0) return !1;
      te = te.nextZ;
    }
    return !0;
  }
  function a(_, b, S) {
    var P = _;
    do {
      var E = P.prev, B = P.next.next;
      !A(E, B) && M(E, P, P.next, B) && D(E, B) && D(B, E) && (b.push(E.i / S | 0), b.push(P.i / S | 0), b.push(B.i / S | 0), O(P), O(P.next), P = _ = B), P = P.next;
    } while (P !== _);
    return t(P);
  }
  function o(_, b, S, P, E, B) {
    var R = _;
    do {
      for (var G = R.next.next; G !== R.prev; ) {
        if (R.i !== G.i && x(R, G)) {
          var L = k(R, G);
          R = t(R, R.next), L = t(L, L.next), s(R, b, S, P, E, B, 0), s(L, b, S, P, E, B, 0);
          return;
        }
        G = G.next;
      }
      R = R.next;
    } while (R !== _);
  }
  function h(_, b, S, P) {
    var E = [], B, R, G, L, N;
    for (B = 0, R = b.length; B < R; B++)
      G = b[B] * P, L = B < R - 1 ? b[B + 1] * P : _.length, N = e(_, G, L, P, !1), N === N.next && (N.steiner = !0), E.push(m(N));
    for (E.sort(c), B = 0; B < E.length; B++)
      S = l(E[B], S);
    return S;
  }
  function c(_, b) {
    return _.x - b.x;
  }
  function l(_, b) {
    var S = u(_, b);
    if (!S)
      return b;
    var P = k(S, _);
    return t(P, P.next), t(S, S.next);
  }
  function u(_, b) {
    var S = b, P = _.x, E = _.y, B = -1 / 0, R;
    do {
      if (E <= S.y && E >= S.next.y && S.next.y !== S.y) {
        var G = S.x + (E - S.y) * (S.next.x - S.x) / (S.next.y - S.y);
        if (G <= P && G > B && (B = G, R = S.x < S.next.x ? S : S.next, G === P))
          return R;
      }
      S = S.next;
    } while (S !== b);
    if (!R) return null;
    var L = R, N = R.x, ie = R.y, ne = 1 / 0, ee;
    S = R;
    do
      P >= S.x && S.x >= N && P !== S.x && y(E < ie ? P : B, E, N, ie, E < ie ? B : P, E, S.x, S.y) && (ee = Math.abs(E - S.y) / (P - S.x), D(S, _) && (ee < ne || ee === ne && (S.x > R.x || S.x === R.x && d(R, S))) && (R = S, ne = ee)), S = S.next;
    while (S !== L);
    return R;
  }
  function d(_, b) {
    return v(_.prev, _, b.prev) < 0 && v(b.next, _, _.next) < 0;
  }
  function f(_, b, S, P) {
    var E = _;
    do
      E.z === 0 && (E.z = g(E.x, E.y, b, S, P)), E.prevZ = E.prev, E.nextZ = E.next, E = E.next;
    while (E !== _);
    E.prevZ.nextZ = null, E.prevZ = null, p(E);
  }
  function p(_) {
    var b, S, P, E, B, R, G, L, N = 1;
    do {
      for (S = _, _ = null, B = null, R = 0; S; ) {
        for (R++, P = S, G = 0, b = 0; b < N && (G++, P = P.nextZ, !!P); b++)
          ;
        for (L = N; G > 0 || L > 0 && P; )
          G !== 0 && (L === 0 || !P || S.z <= P.z) ? (E = S, S = S.nextZ, G--) : (E = P, P = P.nextZ, L--), B ? B.nextZ = E : _ = E, E.prevZ = B, B = E;
        S = P;
      }
      B.nextZ = null, N *= 2;
    } while (R > 1);
    return _;
  }
  function g(_, b, S, P, E) {
    return _ = (_ - S) * E | 0, b = (b - P) * E | 0, _ = (_ | _ << 8) & 16711935, _ = (_ | _ << 4) & 252645135, _ = (_ | _ << 2) & 858993459, _ = (_ | _ << 1) & 1431655765, b = (b | b << 8) & 16711935, b = (b | b << 4) & 252645135, b = (b | b << 2) & 858993459, b = (b | b << 1) & 1431655765, _ | b << 1;
  }
  function m(_) {
    var b = _, S = _;
    do
      (b.x < S.x || b.x === S.x && b.y < S.y) && (S = b), b = b.next;
    while (b !== _);
    return S;
  }
  function y(_, b, S, P, E, B, R, G) {
    return (E - R) * (b - G) >= (_ - R) * (B - G) && (_ - R) * (P - G) >= (S - R) * (b - G) && (S - R) * (B - G) >= (E - R) * (P - G);
  }
  function x(_, b) {
    return _.next.i !== b.i && _.prev.i !== b.i && !F(_, b) && // dones't intersect other edges
    (D(_, b) && D(b, _) && I(_, b) && // locally visible
    (v(_.prev, _, b.prev) || v(_, b.prev, b)) || // does not create opposite-facing sectors
    A(_, b) && v(_.prev, _, _.next) > 0 && v(b.prev, b, b.next) > 0);
  }
  function v(_, b, S) {
    return (b.y - _.y) * (S.x - b.x) - (b.x - _.x) * (S.y - b.y);
  }
  function A(_, b) {
    return _.x === b.x && _.y === b.y;
  }
  function M(_, b, S, P) {
    var E = C(v(_, b, S)), B = C(v(_, b, P)), R = C(v(S, P, _)), G = C(v(S, P, b));
    return !!(E !== B && R !== G || E === 0 && w(_, S, b) || B === 0 && w(_, P, b) || R === 0 && w(S, _, P) || G === 0 && w(S, b, P));
  }
  function w(_, b, S) {
    return b.x <= Math.max(_.x, S.x) && b.x >= Math.min(_.x, S.x) && b.y <= Math.max(_.y, S.y) && b.y >= Math.min(_.y, S.y);
  }
  function C(_) {
    return _ > 0 ? 1 : _ < 0 ? -1 : 0;
  }
  function F(_, b) {
    var S = _;
    do {
      if (S.i !== _.i && S.next.i !== _.i && S.i !== b.i && S.next.i !== b.i && M(S, S.next, _, b)) return !0;
      S = S.next;
    } while (S !== _);
    return !1;
  }
  function D(_, b) {
    return v(_.prev, _, _.next) < 0 ? v(_, b, _.next) >= 0 && v(_, _.prev, b) >= 0 : v(_, b, _.prev) < 0 || v(_, _.next, b) < 0;
  }
  function I(_, b) {
    var S = _, P = !1, E = (_.x + b.x) / 2, B = (_.y + b.y) / 2;
    do
      S.y > B != S.next.y > B && S.next.y !== S.y && E < (S.next.x - S.x) * (B - S.y) / (S.next.y - S.y) + S.x && (P = !P), S = S.next;
    while (S !== _);
    return P;
  }
  function k(_, b) {
    var S = new Y(_.i, _.x, _.y), P = new Y(b.i, b.x, b.y), E = _.next, B = b.prev;
    return _.next = b, b.prev = _, S.next = E, E.prev = S, P.next = S, S.prev = P, B.next = P, P.prev = B, P;
  }
  function U(_, b, S, P) {
    var E = new Y(_, b, S);
    return P ? (E.next = P.next, E.prev = P, P.next.prev = E, P.next = E) : (E.prev = E, E.next = E), E;
  }
  function O(_) {
    _.next.prev = _.prev, _.prev.next = _.next, _.prevZ && (_.prevZ.nextZ = _.nextZ), _.nextZ && (_.nextZ.prevZ = _.prevZ);
  }
  function Y(_, b, S) {
    this.i = _, this.x = b, this.y = S, this.prev = null, this.next = null, this.z = 0, this.prevZ = null, this.nextZ = null, this.steiner = !1;
  }
  r.deviation = function(_, b, S, P) {
    var E = b && b.length, B = E ? b[0] * S : _.length, R = Math.abs(X(_, 0, B, S));
    if (E)
      for (var G = 0, L = b.length; G < L; G++) {
        var N = b[G] * S, ie = G < L - 1 ? b[G + 1] * S : _.length;
        R -= Math.abs(X(_, N, ie, S));
      }
    var ne = 0;
    for (G = 0; G < P.length; G += 3) {
      var ee = P[G] * S, fe = P[G + 1] * S, re = P[G + 2] * S;
      ne += Math.abs(
        (_[ee] - _[re]) * (_[fe + 1] - _[ee + 1]) - (_[ee] - _[fe]) * (_[re + 1] - _[ee + 1])
      );
    }
    return R === 0 && ne === 0 ? 0 : Math.abs((ne - R) / R);
  };
  function X(_, b, S, P) {
    for (var E = 0, B = b, R = S - P; B < S; B += P)
      E += (_[R] - _[B]) * (_[B + 1] + _[R + 1]), R = B;
    return E;
  }
  return r.flatten = function(_) {
    for (var b = _[0][0].length, S = { vertices: [], holes: [], dimensions: b }, P = 0, E = 0; E < _.length; E++) {
      for (var B = 0; B < _[E].length; B++)
        for (var R = 0; R < b; R++) S.vertices.push(_[E][B][R]);
      E > 0 && (P += _[E - 1].length, S.holes.push(P));
    }
    return S;
  }, xs.exports;
}
var zu = Wu();
const Vu = /* @__PURE__ */ gi(zu);
var Pe = /* @__PURE__ */ ((r) => (r[r.NONE = 0] = "NONE", r[r.COLOR = 16384] = "COLOR", r[r.STENCIL = 1024] = "STENCIL", r[r.DEPTH = 256] = "DEPTH", r[r.COLOR_DEPTH = 16640] = "COLOR_DEPTH", r[r.COLOR_STENCIL = 17408] = "COLOR_STENCIL", r[r.DEPTH_STENCIL = 1280] = "DEPTH_STENCIL", r[r.ALL = 17664] = "ALL", r))(Pe || {});
class Do {
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
  emit(e, t, s, i, n, a, o, h) {
    const { name: c, items: l } = this;
    for (let u = 0, d = l.length; u < d; u++)
      l[u][c](e, t, s, i, n, a, o, h);
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
const $u = [
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
], Oo = class Lo extends Be {
  /**
   * Set up a system with a collection of SystemClasses and runners.
   * Systems are attached dynamically to this class when added.
   * @param config - the config for the system manager
   */
  constructor(e) {
    super(), this.runners = /* @__PURE__ */ Object.create(null), this.renderPipes = /* @__PURE__ */ Object.create(null), this._initOptions = {}, this._systemsHash = /* @__PURE__ */ Object.create(null), this.type = e.type, this.name = e.name, this.config = e;
    const t = [...$u, ...this.config.runners ?? []];
    this._addRunners(...t), this._unsafeEvalCheck();
  }
  /**
   * Initialize the renderer.
   * @param options - The options to use to create the renderer.
   */
  async init(e = {}) {
    const t = e.skipExtensionImports === !0 ? !0 : e.manageImports === !1;
    await Hu(t), this._addSystems(this.config.systems), this._addPipes(this.config.renderPipes, this.config.renderPipeAdaptors);
    for (const s in this._systemsHash)
      e = { ...this._systemsHash[s].constructor.defaultOptions, ...e };
    e = { ...Lo.defaultOptions, ...e }, this._roundPixels = e.roundPixels ? 1 : 0;
    for (let s = 0; s < this.runners.init.items.length; s++)
      await this.runners.init.items[s].init(e);
    this._initOptions = e;
  }
  render(e, t) {
    let s = e;
    if (s instanceof pe && (s = { container: s }, t && (j(q, "passing a second argument is deprecated, please use render options instead"), s.target = t.renderTexture)), s.target || (s.target = this.view.renderTarget), s.target === this.view.renderTarget && (this._lastObjectRendered = s.container, s.clearColor ?? (s.clearColor = this.background.colorRgba), s.clear ?? (s.clear = this.background.clearBeforeRender)), s.clearColor) {
      const i = Array.isArray(s.clearColor) && s.clearColor.length === 4;
      s.clearColor = i ? s.clearColor : ae.shared.setValue(s.clearColor).toArray();
    }
    s.transform || (s.container.updateLocalTransform(), s.transform = s.container.localTransform), s.container.enableRenderGroup(), this.runners.prerender.emit(s), this.runners.renderStart.emit(s), this.runners.render.emit(s), this.runners.renderEnd.emit(s), this.runners.postrender.emit(s);
  }
  /**
   * Resizes the WebGL view to the specified width and height.
   * @param desiredScreenWidth - The desired width of the screen.
   * @param desiredScreenHeight - The desired height of the screen.
   * @param resolution - The resolution / device pixel ratio of the renderer.
   */
  resize(e, t, s) {
    const i = this.view.resolution;
    this.view.resize(e, t, s), this.emit("resize", this.view.screen.width, this.view.screen.height, this.view.resolution), s !== void 0 && s !== i && this.runners.resolutionChange.emit(s);
  }
  clear(e = {}) {
    const t = this;
    e.target || (e.target = t.renderTarget.renderTarget), e.clearColor || (e.clearColor = this.background.colorRgba), e.clear ?? (e.clear = Pe.ALL);
    const { clear: s, clearColor: i, target: n } = e;
    ae.shared.setValue(i ?? this.background.colorRgba), t.renderTarget.clear(n, s, ae.shared.toArray());
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
      this.runners[t] = new Do(t);
    });
  }
  _addSystems(e) {
    let t;
    for (t in e) {
      const s = e[t];
      this._addSystem(s.value, s.name);
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
    const s = new e(this);
    if (this[t])
      throw new Error(`Whoops! The name "${t}" is already in use`);
    this[t] = s, this._systemsHash[t] = s;
    for (const i in this.runners)
      this.runners[i].add(s);
    return this;
  }
  _addPipes(e, t) {
    const s = t.reduce((i, n) => (i[n.name] = n.value, i), {});
    e.forEach((i) => {
      const n = i.value, a = i.name, o = s[a];
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
    if (!Fo())
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
Oo.defaultOptions = {
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
let Ys = Oo, ys;
function Xu(r) {
  return ys !== void 0 || (ys = (() => {
    var t;
    const e = {
      stencil: !0,
      failIfMajorPerformanceCaveat: r ?? Ys.defaultOptions.failIfMajorPerformanceCaveat
    };
    try {
      if (!J.get().getWebGLRenderingContext())
        return !1;
      let i = J.get().createCanvas().getContext("webgl", e);
      const n = !!((t = i == null ? void 0 : i.getContextAttributes()) != null && t.stencil);
      if (i) {
        const a = i.getExtension("WEBGL_lose_context");
        a && a.loseContext();
      }
      return i = null, n;
    } catch {
      return !1;
    }
  })()), ys;
}
let bs;
async function ju(r = {}) {
  return bs !== void 0 || (bs = await (async () => {
    const e = J.get().getNavigator().gpu;
    if (!e)
      return !1;
    try {
      return await (await e.requestAdapter(r)).requestDevice(), !0;
    } catch {
      return !1;
    }
  })()), bs;
}
const Wn = ["webgl", "webgpu", "canvas"];
async function Yu(r) {
  let e = [];
  r.preference ? (e.push(r.preference), Wn.forEach((n) => {
    n !== r.preference && e.push(n);
  })) : e = Wn.slice();
  let t, s = {};
  for (let n = 0; n < e.length; n++) {
    const a = e[n];
    if (a === "webgpu" && await ju()) {
      const { WebGPURenderer: o } = await Promise.resolve().then(() => Rg);
      t = o, s = { ...r, ...r.webgpu };
      break;
    } else if (a === "webgl" && Xu(
      r.failIfMajorPerformanceCaveat ?? Ys.defaultOptions.failIfMajorPerformanceCaveat
    )) {
      const { WebGLRenderer: o } = await Promise.resolve().then(() => dg);
      t = o, s = { ...r, ...r.webgl };
      break;
    } else if (a === "canvas")
      throw s = { ...r }, new Error("CanvasRenderer is not yet implemented");
  }
  if (delete s.webgpu, delete s.webgl, !t)
    throw new Error("No available renderer for the current environment");
  const i = new t();
  return await i.init(s), i;
}
const Ns = "8.8.1";
class No {
  static init() {
    var e;
    (e = globalThis.__PIXI_APP_INIT__) == null || e.call(globalThis, this, Ns);
  }
  static destroy() {
  }
}
No.extension = T.Application;
class Ho {
  constructor(e) {
    this._renderer = e;
  }
  init() {
    var e;
    (e = globalThis.__PIXI_RENDERER_INIT__) == null || e.call(globalThis, this._renderer, Ns);
  }
  destroy() {
    this._renderer = null;
  }
}
Ho.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem
  ],
  name: "initHook",
  priority: -10
};
const Wo = class Jr {
  /** @ignore */
  constructor(...e) {
    this.stage = new pe(), e[0] !== void 0 && j(q, "Application constructor options are deprecated, please use Application.init() instead.");
  }
  /**
   * @param options - The optional application and renderer parameters.
   */
  async init(e) {
    e = { ...e }, this.renderer = await Yu(e), Jr._plugins.forEach((t) => {
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
    return j(q, "Application.view is deprecated, please use Application.canvas instead."), this.renderer.canvas;
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
    const s = Jr._plugins.slice(0);
    s.reverse(), s.forEach((i) => {
      i.destroy.call(this);
    }), this.stage.destroy(t), this.stage = null, this.renderer.destroy(e), this.renderer = null;
  }
};
Wo._plugins = [];
let zo = Wo;
V.handleByList(T.Application, zo._plugins);
V.add(No);
class Vo {
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
      let t, s;
      if (this._resizeTo === globalThis.window)
        t = globalThis.innerWidth, s = globalThis.innerHeight;
      else {
        const { clientWidth: i, clientHeight: n } = this._resizeTo;
        t = i, s = n;
      }
      this.renderer.resize(t, s), this.render();
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
Vo.extension = T.Application;
class $o {
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
          this._ticker && this._ticker.remove(this.render, this), this._ticker = t, t && t.add(this.render, this, ts.LOW);
        },
        get() {
          return this._ticker;
        }
      }
    ), this.stop = () => {
      this._ticker.stop();
    }, this.start = () => {
      this._ticker.start();
    }, this._ticker = null, this.ticker = e.sharedTicker ? Ve.shared : new Ve(), e.autoStart && this.start();
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
$o.extension = T.Application;
class Xo extends Be {
  constructor() {
    super(...arguments), this.chars = /* @__PURE__ */ Object.create(null), this.lineHeight = 0, this.fontFamily = "", this.fontMetrics = { fontSize: 0, ascent: 0, descent: 0 }, this.baseLineOffset = 0, this.distanceField = { type: "none", range: 0 }, this.pages = [], this.applyFillAsTint = !0, this.baseMeasurementFontSize = 100, this.baseRenderedFontSize = 100;
  }
  /**
   * The name of the font face.
   * @deprecated since 8.0.0 Use `fontFamily` instead.
   */
  get font() {
    return j(q, "BitmapFont.font is deprecated, please use BitmapFont.fontFamily instead."), this.fontFamily;
  }
  /**
   * The map of base page textures (i.e., sheets of glyphs).
   * @deprecated since 8.0.0 Use `pages` instead.
   */
  get pageTextures() {
    return j(q, "BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead."), this.pages;
  }
  /**
   * The size of the font face in pixels.
   * @deprecated since 8.0.0 Use `fontMetrics.fontSize` instead.
   */
  get size() {
    return j(q, "BitmapFont.size is deprecated, please use BitmapFont.fontMetrics.fontSize instead."), this.fontMetrics.fontSize;
  }
  /**
   * The kind of distance field for this font or "none".
   * @deprecated since 8.0.0 Use `distanceField.type` instead.
   */
  get distanceFieldRange() {
    return j(q, "BitmapFont.distanceFieldRange is deprecated, please use BitmapFont.distanceField.range instead."), this.distanceField.range;
  }
  /**
   * The range of the distance field in pixels.
   * @deprecated since 8.0.0 Use `distanceField.range` instead.
   */
  get distanceFieldType() {
    return j(q, "BitmapFont.distanceFieldType is deprecated, please use BitmapFont.distanceField.type instead."), this.distanceField.type;
  }
  destroy(e = !1) {
    var t;
    this.emit("destroy", this), this.removeAllListeners();
    for (const s in this.chars)
      (t = this.chars[s].texture) == null || t.destroy();
    this.chars = null, e && (this.pages.forEach((s) => s.texture.destroy(!0)), this.pages = null);
  }
}
const zn = [{ offset: 0, color: "white" }, { offset: 1, color: "black" }], wi = class ei {
  constructor(...e) {
    this.uid = le("fillGradient"), this.type = "linear", this.colorStops = [];
    let t = Ku(e);
    t = { ...t.type === "radial" ? ei.defaultRadialOptions : ei.defaultLinearOptions, ...Za(t) }, this._textureSize = t.textureSize, t.type === "radial" ? (this.center = t.center, this.outerCenter = t.outerCenter ?? this.center, this.innerRadius = t.innerRadius, this.outerRadius = t.outerRadius, this.scale = t.scale, this.rotation = t.rotation) : (this.start = t.start, this.end = t.end), this.textureSpace = t.textureSpace, this.type = t.type, t.colorStops.forEach((i) => {
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
    return this.colorStops.push({ offset: e, color: ae.shared.setValue(t).toHexa() }), this;
  }
  /**
   * Builds the internal texture and transform for the gradient.
   * Called automatically when the gradient is first used.
   * @internal
   */
  buildLinearGradient() {
    if (this.texture)
      return;
    const e = this.colorStops.length ? this.colorStops : zn, t = this._textureSize, { canvas: s, context: i } = $n(t, 1), n = i.createLinearGradient(0, 0, this._textureSize, 0);
    Vn(n, e), i.fillStyle = n, i.fillRect(0, 0, t, 1), this.texture = new H({
      source: new gt({
        resource: s
      })
    });
    const { x: a, y: o } = this.start, { x: h, y: c } = this.end, l = new z(), u = h - a, d = c - o, f = Math.sqrt(u * u + d * d), p = Math.atan2(d, u);
    l.scale(f / t, 1), l.rotate(p), l.translate(a, o), this.textureSpace === "local" && l.scale(t, t), this.transform = l;
  }
  buildGradient() {
    this.type === "linear" ? this.buildLinearGradient() : this.buildRadialGradient();
  }
  buildRadialGradient() {
    if (this.texture)
      return;
    const e = this.colorStops.length ? this.colorStops : zn, t = this._textureSize, { canvas: s, context: i } = $n(t, t), { x: n, y: a } = this.center, { x: o, y: h } = this.outerCenter, c = this.innerRadius, l = this.outerRadius, u = o - l, d = h - l, f = t / (l * 2), p = (n - u) * f, g = (a - d) * f, m = i.createRadialGradient(
      p,
      g,
      c * f,
      (o - u) * f,
      (h - d) * f,
      l * f
    );
    Vn(m, e), i.fillStyle = e[e.length - 1].color, i.fillRect(0, 0, t, t), i.fillStyle = m, i.translate(p, g), i.rotate(this.rotation), i.scale(1, this.scale), i.translate(-p, -g), i.fillRect(0, 0, t, t), this.texture = new H({
      source: new gt({
        resource: s,
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge"
      })
    });
    const y = new z();
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
wi.defaultLinearOptions = {
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
  colorStops: [],
  textureSpace: "local",
  type: "linear",
  textureSize: 256
};
wi.defaultRadialOptions = {
  center: { x: 0.5, y: 0.5 },
  innerRadius: 0,
  outerRadius: 0.5,
  colorStops: [],
  scale: 1,
  textureSpace: "local",
  type: "radial",
  textureSize: 256
};
let nt = wi;
function Vn(r, e) {
  for (let t = 0; t < e.length; t++) {
    const s = e[t];
    r.addColorStop(s.offset, s.color);
  }
}
function $n(r, e) {
  const t = J.get().createCanvas(r, e), s = t.getContext("2d");
  return { canvas: t, context: s };
}
function Ku(r) {
  let e = r[0] ?? {};
  return (typeof e == "number" || r[1]) && (j("8.5.2", "use options object instead"), e = {
    type: "linear",
    start: { x: r[0], y: r[1] },
    end: { x: r[2], y: r[3] },
    textureSpace: r[4],
    textureSize: r[5] ?? nt.defaultLinearOptions.textureSize
  }), e;
}
const Xn = {
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
class Ks {
  constructor(e, t) {
    this.uid = le("fillPattern"), this.transform = new z(), this._styleKey = null, this.texture = e, this.transform.scale(
      1 / e.frame.width,
      1 / e.frame.height
    ), t && (e.source.style.addressModeU = Xn[t].addressModeU, e.source.style.addressModeV = Xn[t].addressModeV);
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
var Sr, jn;
function qu() {
  if (jn) return Sr;
  jn = 1, Sr = t;
  var r = { a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0 }, e = /([astvzqmhlc])([^astvzqmhlc]*)/ig;
  function t(n) {
    var a = [];
    return n.replace(e, function(o, h, c) {
      var l = h.toLowerCase();
      for (c = i(c), l == "m" && c.length > 2 && (a.push([h].concat(c.splice(0, 2))), l = "l", h = h == "m" ? "l" : "L"); ; ) {
        if (c.length == r[l])
          return c.unshift(h), a.push(c);
        if (c.length < r[l]) throw new Error("malformed path data");
        a.push([h].concat(c.splice(0, r[l])));
      }
    }), a;
  }
  var s = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/ig;
  function i(n) {
    var a = n.match(s);
    return a ? a.map(Number) : [];
  }
  return Sr;
}
var Zu = qu();
const Qu = /* @__PURE__ */ gi(Zu);
function Ju(r, e) {
  const t = Qu(r), s = [];
  let i = null, n = 0, a = 0;
  for (let o = 0; o < t.length; o++) {
    const h = t[o], c = h[0], l = h;
    switch (c) {
      case "M":
        n = l[1], a = l[2], e.moveTo(n, a);
        break;
      case "m":
        n += l[1], a += l[2], e.moveTo(n, a);
        break;
      case "H":
        n = l[1], e.lineTo(n, a);
        break;
      case "h":
        n += l[1], e.lineTo(n, a);
        break;
      case "V":
        a = l[1], e.lineTo(n, a);
        break;
      case "v":
        a += l[1], e.lineTo(n, a);
        break;
      case "L":
        n = l[1], a = l[2], e.lineTo(n, a);
        break;
      case "l":
        n += l[1], a += l[2], e.lineTo(n, a);
        break;
      case "C":
        n = l[5], a = l[6], e.bezierCurveTo(
          l[1],
          l[2],
          // First control point
          l[3],
          l[4],
          // Second control point
          n,
          a
          // End point
        );
        break;
      case "c":
        e.bezierCurveTo(
          n + l[1],
          a + l[2],
          // First control point
          n + l[3],
          a + l[4],
          // Second control point
          n + l[5],
          a + l[6]
          // End point
        ), n += l[5], a += l[6];
        break;
      case "S":
        n = l[3], a = l[4], e.bezierCurveToShort(
          l[1],
          l[2],
          // Control point
          n,
          a
          // End point
        );
        break;
      case "s":
        e.bezierCurveToShort(
          n + l[1],
          a + l[2],
          // Control point
          n + l[3],
          a + l[4]
          // End point
        ), n += l[3], a += l[4];
        break;
      case "Q":
        n = l[3], a = l[4], e.quadraticCurveTo(
          l[1],
          l[2],
          // Control point
          n,
          a
          // End point
        );
        break;
      case "q":
        e.quadraticCurveTo(
          n + l[1],
          a + l[2],
          // Control point
          n + l[3],
          a + l[4]
          // End point
        ), n += l[3], a += l[4];
        break;
      case "T":
        n = l[1], a = l[2], e.quadraticCurveToShort(
          n,
          a
          // End point
        );
        break;
      case "t":
        n += l[1], a += l[2], e.quadraticCurveToShort(
          n,
          a
          // End point
        );
        break;
      case "A":
        n = l[6], a = l[7], e.arcToSvg(
          l[1],
          // rx
          l[2],
          // ry
          l[3],
          // x-axis-rotation
          l[4],
          // large-arc-flag
          l[5],
          // sweep-flag
          n,
          a
          // End point
        );
        break;
      case "a":
        n += l[6], a += l[7], e.arcToSvg(
          l[1],
          // rx
          l[2],
          // ry
          l[3],
          // x-axis-rotation
          l[4],
          // large-arc-flag
          l[5],
          // sweep-flag
          n,
          a
          // End point
        );
        break;
      case "Z":
      case "z":
        e.closePath(), s.length > 0 && (i = s.pop(), i ? (n = i.startX, a = i.startY) : (n = 0, a = 0)), i = null;
        break;
      default:
        $(`Unknown SVG path command: ${c}`);
    }
    c !== "Z" && c !== "z" && i === null && (i = { startX: n, startY: a }, s.push(i));
  }
  return e;
}
class Ai {
  /**
   * @param x - The X coordinate of the center of this circle
   * @param y - The Y coordinate of the center of this circle
   * @param radius - The radius of the circle
   */
  constructor(e = 0, t = 0, s = 0) {
    this.type = "circle", this.x = e, this.y = t, this.radius = s;
  }
  /**
   * Creates a clone of this Circle instance
   * @returns A copy of the Circle
   */
  clone() {
    return new Ai(this.x, this.y, this.radius);
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
    const s = this.radius * this.radius;
    let i = this.x - e, n = this.y - t;
    return i *= i, n *= n, i + n <= s;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this circle including the stroke.
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param width - The width of the line to check
   * @param alignment - The alignment of the stroke, 0.5 by default
   * @returns Whether the x/y coordinates are within this Circle
   */
  strokeContains(e, t, s, i = 0.5) {
    if (this.radius === 0)
      return !1;
    const n = this.x - e, a = this.y - t, o = this.radius, h = (1 - i) * s, c = Math.sqrt(n * n + a * a);
    return c <= o + h && c > o - (s - h);
  }
  /**
   * Returns the framing rectangle of the circle as a Rectangle object
   * @param out
   * @returns The framing rectangle
   */
  getBounds(e) {
    return e || (e = new oe()), e.x = this.x - this.radius, e.y = this.y - this.radius, e.width = this.radius * 2, e.height = this.radius * 2, e;
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
class Ci {
  /**
   * @param x - The X coordinate of the center of this ellipse
   * @param y - The Y coordinate of the center of this ellipse
   * @param halfWidth - The half width of this ellipse
   * @param halfHeight - The half height of this ellipse
   */
  constructor(e = 0, t = 0, s = 0, i = 0) {
    this.type = "ellipse", this.x = e, this.y = t, this.halfWidth = s, this.halfHeight = i;
  }
  /**
   * Creates a clone of this Ellipse instance
   * @returns {Ellipse} A copy of the ellipse
   */
  clone() {
    return new Ci(this.x, this.y, this.halfWidth, this.halfHeight);
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
    let s = (e - this.x) / this.halfWidth, i = (t - this.y) / this.halfHeight;
    return s *= s, i *= i, s + i <= 1;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this ellipse including stroke
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke
   * @returns Whether the x/y coords are within this ellipse
   */
  strokeContains(e, t, s, i = 0.5) {
    const { halfWidth: n, halfHeight: a } = this;
    if (n <= 0 || a <= 0)
      return !1;
    const o = s * (1 - i), h = s - o, c = n - h, l = a - h, u = n + o, d = a + o, f = e - this.x, p = t - this.y, g = f * f / (c * c) + p * p / (l * l), m = f * f / (u * u) + p * p / (d * d);
    return g > 1 && m <= 1;
  }
  /**
   * Returns the framing rectangle of the ellipse as a Rectangle object
   * @param out
   * @returns The framing rectangle
   */
  getBounds(e) {
    return e || (e = new oe()), e.x = this.x - this.halfWidth, e.y = this.y - this.halfHeight, e.width = this.halfWidth * 2, e.height = this.halfHeight * 2, e;
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
function ed(r, e, t, s, i, n) {
  const a = r - t, o = e - s, h = i - t, c = n - s, l = a * h + o * c, u = h * h + c * c;
  let d = -1;
  u !== 0 && (d = l / u);
  let f, p;
  d < 0 ? (f = t, p = s) : d > 1 ? (f = i, p = n) : (f = t + d * h, p = s + d * c);
  const g = r - f, m = e - p;
  return g * g + m * m;
}
let td, sd;
class qt {
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
      const s = [];
      for (let i = 0, n = t.length; i < n; i++)
        s.push(t[i].x, t[i].y);
      t = s;
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
    const t = this.points, s = t.length;
    for (let i = 0; i < s; i += 2) {
      const n = t[i], a = t[i + 1], o = t[(i + 2) % s], h = t[(i + 3) % s];
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
    const t = this.getBounds(td), s = e.getBounds(sd);
    if (!t.containsRect(s))
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
    const e = this.points.slice(), t = new qt(e);
    return t.closePath = this.closePath, t;
  }
  /**
   * Checks whether the x and y coordinates passed to this function are contained within this polygon.
   * @param x - The X coordinate of the point to test.
   * @param y - The Y coordinate of the point to test.
   * @returns - Whether the x/y coordinates are within this polygon.
   */
  contains(e, t) {
    let s = !1;
    const i = this.points.length / 2;
    for (let n = 0, a = i - 1; n < i; a = n++) {
      const o = this.points[n * 2], h = this.points[n * 2 + 1], c = this.points[a * 2], l = this.points[a * 2 + 1];
      h > t != l > t && e < (c - o) * ((t - h) / (l - h)) + o && (s = !s);
    }
    return s;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this polygon including the stroke.
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke, 0.5 by default
   * @returns Whether the x/y coordinates are within this polygon
   */
  strokeContains(e, t, s, i = 0.5) {
    const n = s * s, a = n * (1 - i), o = n - a, { points: h } = this, c = h.length - (this.closePath ? 0 : 2);
    for (let l = 0; l < c; l += 2) {
      const u = h[l], d = h[l + 1], f = h[(l + 2) % h.length], p = h[(l + 3) % h.length], g = ed(e, t, u, d, f, p), m = Math.sign((f - u) * (t - d) - (p - d) * (e - u));
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
    e || (e = new oe());
    const t = this.points;
    let s = 1 / 0, i = -1 / 0, n = 1 / 0, a = -1 / 0;
    for (let o = 0, h = t.length; o < h; o += 2) {
      const c = t[o], l = t[o + 1];
      s = c < s ? c : s, i = c > i ? c : i, n = l < n ? l : n, a = l > a ? l : a;
    }
    return e.x = s, e.width = i - s, e.y = n, e.height = a - n, e;
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
const vs = (r, e, t, s, i, n, a) => {
  const o = r - t, h = e - s, c = Math.sqrt(o * o + h * h);
  return c >= i - n && c <= i + a;
};
class Pi {
  /**
   * @param x - The X coordinate of the upper-left corner of the rounded rectangle
   * @param y - The Y coordinate of the upper-left corner of the rounded rectangle
   * @param width - The overall width of this rounded rectangle
   * @param height - The overall height of this rounded rectangle
   * @param radius - Controls the radius of the rounded corners
   */
  constructor(e = 0, t = 0, s = 0, i = 0, n = 20) {
    this.type = "roundedRectangle", this.x = e, this.y = t, this.width = s, this.height = i, this.radius = n;
  }
  /**
   * Returns the framing rectangle of the rounded rectangle as a Rectangle object
   * @param out - optional rectangle to store the result
   * @returns The framing rectangle
   */
  getBounds(e) {
    return e || (e = new oe()), e.x = this.x, e.y = this.y, e.width = this.width, e.height = this.height, e;
  }
  /**
   * Creates a clone of this Rounded Rectangle.
   * @returns - A copy of the rounded rectangle.
   */
  clone() {
    return new Pi(this.x, this.y, this.width, this.height, this.radius);
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
      const s = Math.max(0, Math.min(this.radius, Math.min(this.width, this.height) / 2));
      if (t >= this.y + s && t <= this.y + this.height - s || e >= this.x + s && e <= this.x + this.width - s)
        return !0;
      let i = e - (this.x + s), n = t - (this.y + s);
      const a = s * s;
      if (i * i + n * n <= a || (i = e - (this.x + this.width - s), i * i + n * n <= a) || (n = t - (this.y + this.height - s), i * i + n * n <= a) || (i = e - (this.x + s), i * i + n * n <= a))
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
  strokeContains(e, t, s, i = 0.5) {
    const { x: n, y: a, width: o, height: h, radius: c } = this, l = s * (1 - i), u = s - l, d = n + c, f = a + c, p = o - c * 2, g = h - c * 2, m = n + o, y = a + h;
    return (e >= n - l && e <= n + u || e >= m - u && e <= m + l) && t >= f && t <= f + g || (t >= a - l && t <= a + u || t >= y - u && t <= y + l) && e >= d && e <= d + p ? !0 : (
      // Top-left
      e < d && t < f && vs(
        e,
        t,
        d,
        f,
        c,
        u,
        l
      ) || e > m - c && t < f && vs(
        e,
        t,
        m - c,
        f,
        c,
        u,
        l
      ) || e > m - c && t > y - c && vs(
        e,
        t,
        m - c,
        y - c,
        c,
        u,
        l
      ) || e < d && t > y - c && vs(
        e,
        t,
        d,
        y - c,
        c,
        u,
        l
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
function id(r) {
  let e = "";
  for (let t = 0; t < r; ++t)
    t > 0 && (e += `
else `), t < r - 1 && (e += `if(test == ${t}.0){}`);
  return e;
}
function nd(r, e) {
  if (r === 0)
    throw new Error("Invalid value of `0` passed to `checkMaxIfStatementsInShader`");
  const t = e.createShader(e.FRAGMENT_SHADER);
  try {
    for (; ; ) {
      const s = rd.replace(/%forloop%/gi, id(r));
      if (e.shaderSource(t, s), e.compileShader(t), !e.getShaderParameter(t, e.COMPILE_STATUS))
        r = r / 2 | 0;
      else
        break;
    }
  } finally {
    e.deleteShader(t);
  }
  return r;
}
let bt = null;
function It() {
  var e;
  if (bt)
    return bt;
  const r = Mo();
  return bt = r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS), bt = nd(
    bt,
    r
  ), (e = r.getExtension("WEBGL_lose_context")) == null || e.loseContext(), bt;
}
const jo = {};
function Ei(r, e) {
  let t = 2166136261;
  for (let s = 0; s < e; s++)
    t ^= r[s].uid, t = Math.imul(t, 16777619), t >>>= 0;
  return jo[t] || ad(r, e, t);
}
let wr = 0;
function ad(r, e, t) {
  const s = {};
  let i = 0;
  wr || (wr = It());
  for (let a = 0; a < wr; a++) {
    const o = a < e ? r[a] : H.EMPTY.source;
    s[i++] = o.source, s[i++] = o.style;
  }
  const n = new Ze(s);
  return jo[t] = n, n;
}
class St {
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
function ti(r, e) {
  const t = r.byteLength / 8 | 0, s = new Float64Array(r, 0, t);
  new Float64Array(e, 0, t).set(s);
  const n = r.byteLength - t * 8;
  if (n > 0) {
    const a = new Uint8Array(r, t * 8, n);
    new Uint8Array(e, t * 8, n).set(a);
  }
}
const od = {
  normal: "normal-npm",
  add: "add-npm",
  screen: "screen-npm"
};
var me = /* @__PURE__ */ ((r) => (r[r.DISABLED = 0] = "DISABLED", r[r.RENDERING_MASK_ADD = 1] = "RENDERING_MASK_ADD", r[r.MASK_ACTIVE = 2] = "MASK_ACTIVE", r[r.INVERSE_MASK_ACTIVE = 3] = "INVERSE_MASK_ACTIVE", r[r.RENDERING_MASK_REMOVE = 4] = "RENDERING_MASK_REMOVE", r[r.NONE = 5] = "NONE", r))(me || {});
function rs(r, e) {
  return e.alphaMode === "no-premultiply-alpha" && od[r] || r;
}
class hd {
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
class cd {
  constructor() {
    this.renderPipeId = "batch", this.action = "startBatch", this.start = 0, this.size = 0, this.textures = new hd(), this.blendMode = "normal", this.topology = "triangle-strip", this.canBundle = !0;
  }
  destroy() {
    this.textures = null, this.gpuBindGroup = null, this.bindGroup = null, this.batcher = null;
  }
}
const Yo = [];
let si = 0;
function Yn() {
  return si > 0 ? Yo[--si] : new cd();
}
function Kn(r) {
  Yo[si++] = r;
}
let Lt = 0;
const Ko = class Is {
  constructor(e = {}) {
    this.uid = le("batcher"), this.dirty = !0, this.batchIndex = 0, this.batches = [], this._elements = [], Is.defaultOptions.maxTextures = Is.defaultOptions.maxTextures ?? It(), e = { ...Is.defaultOptions, ...e };
    const { maxTextures: t, attributesInitialSize: s, indicesInitialSize: i } = e;
    this.attributeBuffer = new St(s * 4), this.indexBuffer = new Uint16Array(i), this.maxTextures = t;
  }
  begin() {
    this.elementSize = 0, this.elementStart = 0, this.indexSize = 0, this.attributeSize = 0;
    for (let e = 0; e < this.batchIndex; e++)
      Kn(this.batches[e]);
    this.batchIndex = 0, this._batchIndexStart = 0, this._batchIndexSize = 0, this.dirty = !0;
  }
  add(e) {
    this._elements[this.elementSize++] = e, e._indexStart = this.indexSize, e._attributeStart = this.attributeSize, e._batcher = this, this.indexSize += e.indexSize, this.attributeSize += e.attributeSize * this.vertexSize;
  }
  checkAndUpdateTexture(e, t) {
    const s = e._batch.textures.ids[t._source.uid];
    return !s && s !== 0 ? !1 : (e._textureId = s, e.texture = t, !0);
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
    let s = Yn(), i = s.textures;
    i.clear();
    const n = t[this.elementStart];
    let a = rs(n.blendMode, n.texture._source), o = n.topology;
    this.attributeSize * 4 > this.attributeBuffer.size && this._resizeAttributeBuffer(this.attributeSize * 4), this.indexSize > this.indexBuffer.length && this._resizeIndexBuffer(this.indexSize);
    const h = this.attributeBuffer.float32View, c = this.attributeBuffer.uint32View, l = this.indexBuffer;
    let u = this._batchIndexSize, d = this._batchIndexStart, f = "startBatch";
    const p = this.maxTextures;
    for (let g = this.elementStart; g < this.elementSize; ++g) {
      const m = t[g];
      t[g] = null;
      const x = m.texture._source, v = rs(m.blendMode, x), A = a !== v || o !== m.topology;
      if (x._batchTick === Lt && !A) {
        m._textureId = x._textureBindLocation, u += m.indexSize, m.packAsQuad ? (this.packQuadAttributes(
          m,
          h,
          c,
          m._attributeStart,
          m._textureId
        ), this.packQuadIndex(
          l,
          m._indexStart,
          m._attributeStart / this.vertexSize
        )) : (this.packAttributes(
          m,
          h,
          c,
          m._attributeStart,
          m._textureId
        ), this.packIndex(
          m,
          l,
          m._indexStart,
          m._attributeStart / this.vertexSize
        )), m._batch = s;
        continue;
      }
      x._batchTick = Lt, (i.count >= p || A) && (this._finishBatch(
        s,
        d,
        u - d,
        i,
        a,
        o,
        e,
        f
      ), f = "renderBatch", d = u, a = v, o = m.topology, s = Yn(), i = s.textures, i.clear(), ++Lt), m._textureId = x._textureBindLocation = i.count, i.ids[x.uid] = i.count, i.textures[i.count++] = x, m._batch = s, u += m.indexSize, m.packAsQuad ? (this.packQuadAttributes(
        m,
        h,
        c,
        m._attributeStart,
        m._textureId
      ), this.packQuadIndex(
        l,
        m._indexStart,
        m._attributeStart / this.vertexSize
      )) : (this.packAttributes(
        m,
        h,
        c,
        m._attributeStart,
        m._textureId
      ), this.packIndex(
        m,
        l,
        m._indexStart,
        m._attributeStart / this.vertexSize
      ));
    }
    i.count > 0 && (this._finishBatch(
      s,
      d,
      u - d,
      i,
      a,
      o,
      e,
      f
    ), d = u, ++Lt), this.elementStart = this.elementSize, this._batchIndexStart = d, this._batchIndexSize = u;
  }
  _finishBatch(e, t, s, i, n, a, o, h) {
    e.gpuBindGroup = null, e.bindGroup = null, e.action = h, e.batcher = this, e.textures = i, e.blendMode = n, e.topology = a, e.start = t, e.size = s, ++Lt, this.batches[this.batchIndex++] = e, o.add(e);
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
    const t = Math.max(e, this.attributeBuffer.size * 2), s = new St(t);
    ti(this.attributeBuffer.rawBinaryData, s.rawBinaryData), this.attributeBuffer = s;
  }
  _resizeIndexBuffer(e) {
    const t = this.indexBuffer;
    let s = Math.max(e, t.length * 1.5);
    s += s % 2;
    const i = s > 65535 ? new Uint32Array(s) : new Uint16Array(s);
    if (i.BYTES_PER_ELEMENT !== t.BYTES_PER_ELEMENT)
      for (let n = 0; n < t.length; n++)
        i[n] = t[n];
    else
      ti(t.buffer, i.buffer);
    this.indexBuffer = i;
  }
  packQuadIndex(e, t, s) {
    e[t] = s + 0, e[t + 1] = s + 1, e[t + 2] = s + 2, e[t + 3] = s + 0, e[t + 4] = s + 2, e[t + 5] = s + 3;
  }
  packIndex(e, t, s, i) {
    const n = e.indices, a = e.indexSize, o = e.indexOffset, h = e.attributeOffset;
    for (let c = 0; c < a; c++)
      t[s++] = i + n[c + o] - h;
  }
  destroy() {
    for (let e = 0; e < this.batches.length; e++)
      Kn(this.batches[e]);
    this.batches = null;
    for (let e = 0; e < this._elements.length; e++)
      this._elements[e]._batch = null;
    this._elements = null, this.indexBuffer = null, this.attributeBuffer.destroy(), this.attributeBuffer = null;
  }
};
Ko.defaultOptions = {
  maxTextures: null,
  attributesInitialSize: 4,
  indicesInitialSize: 6
};
let ld = Ko;
var Q = /* @__PURE__ */ ((r) => (r[r.MAP_READ = 1] = "MAP_READ", r[r.MAP_WRITE = 2] = "MAP_WRITE", r[r.COPY_SRC = 4] = "COPY_SRC", r[r.COPY_DST = 8] = "COPY_DST", r[r.INDEX = 16] = "INDEX", r[r.VERTEX = 32] = "VERTEX", r[r.UNIFORM = 64] = "UNIFORM", r[r.STORAGE = 128] = "STORAGE", r[r.INDIRECT = 256] = "INDIRECT", r[r.QUERY_RESOLVE = 512] = "QUERY_RESOLVE", r[r.STATIC = 1024] = "STATIC", r))(Q || {});
class Me extends Be {
  /**
   * Creates a new Buffer with the given options
   * @param options - the options for the buffer
   */
  constructor(e) {
    let { data: t, size: s } = e;
    const { usage: i, label: n, shrinkToFit: a } = e;
    super(), this.uid = le("buffer"), this._resourceType = "buffer", this._resourceId = le("resource"), this._touched = 0, this._updateID = 1, this._dataInt32 = null, this.shrinkToFit = !0, this.destroyed = !1, t instanceof Array && (t = new Float32Array(t)), this._data = t, s ?? (s = t == null ? void 0 : t.byteLength);
    const o = !!t;
    this.descriptor = {
      size: s,
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
    return !!(this.descriptor.usage & Q.STATIC);
  }
  set static(e) {
    e ? this.descriptor.usage |= Q.STATIC : this.descriptor.usage &= ~Q.STATIC;
  }
  /**
   * Sets the data in the buffer to the given value. This will immediately update the buffer on the GPU.
   * If you only want to update a subset of the buffer, you can pass in the size of the data.
   * @param value - the data to set
   * @param size - the size of the data in bytes
   * @param syncGPU - should the buffer be updated on the GPU immediately?
   */
  setDataWithSize(e, t, s) {
    if (this._updateID++, this._updateSize = t * e.BYTES_PER_ELEMENT, this._data === e) {
      s && this.emit("update", this);
      return;
    }
    const i = this._data;
    if (this._data = e, this._dataInt32 = null, !i || i.length !== e.length) {
      !this.shrinkToFit && i && e.byteLength < i.byteLength ? s && this.emit("update", this) : (this.descriptor.size = e.byteLength, this._resourceId = le("resource"), this.emit("change", this));
      return;
    }
    s && this.emit("update", this);
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
function qo(r, e) {
  if (!(r instanceof Me)) {
    let t = e ? Q.INDEX : Q.VERTEX;
    r instanceof Array && (e ? (r = new Uint32Array(r), t = Q.INDEX | Q.COPY_DST) : (r = new Float32Array(r), t = Q.VERTEX | Q.COPY_DST)), r = new Me({
      data: r,
      label: e ? "index-mesh-buffer" : "vertex-mesh-buffer",
      usage: t
    });
  }
  return r;
}
function ud(r, e, t) {
  const s = r.getAttribute(e);
  if (!s)
    return t.minX = 0, t.minY = 0, t.maxX = 0, t.maxY = 0, t;
  const i = s.buffer.data;
  let n = 1 / 0, a = 1 / 0, o = -1 / 0, h = -1 / 0;
  const c = i.BYTES_PER_ELEMENT, l = (s.offset || 0) / c, u = (s.stride || 8) / c;
  for (let d = l; d < i.length; d += u) {
    const f = i[d], p = i[d + 1];
    f > o && (o = f), p > h && (h = p), f < n && (n = f), p < a && (a = p);
  }
  return t.minX = n, t.minY = a, t.maxX = o, t.maxY = h, t;
}
function dd(r) {
  return (r instanceof Me || Array.isArray(r) || r.BYTES_PER_ELEMENT) && (r = {
    buffer: r
  }), r.buffer = qo(r.buffer, !1), r;
}
class Gt extends Be {
  /**
   * Create a new instance of a geometry
   * @param options - The options for the geometry.
   */
  constructor(e = {}) {
    super(), this.uid = le("geometry"), this._layoutKey = 0, this.instanceCount = 1, this._bounds = new ye(), this._boundsDirty = !0;
    const { attributes: t, indexBuffer: s, topology: i } = e;
    if (this.buffers = [], this.attributes = {}, t)
      for (const n in t)
        this.addAttribute(n, t[n]);
    this.instanceCount = e.instanceCount ?? 1, s && this.addIndex(s), this.topology = i || "triangle-list";
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
    const s = dd(t);
    this.buffers.indexOf(s.buffer) === -1 && (this.buffers.push(s.buffer), s.buffer.on("update", this.onBufferUpdate, this), s.buffer.on("change", this.onBufferUpdate, this)), this.attributes[e] = s;
  }
  /**
   * Adds an index buffer to the geometry.
   * @param indexBuffer - The index buffer to add. Can be a Buffer, TypedArray, or an array of numbers.
   */
  addIndex(e) {
    this.indexBuffer = qo(e, !0), this.buffers.push(this.indexBuffer);
  }
  /** Returns the bounds of the geometry. */
  get bounds() {
    return this._boundsDirty ? (this._boundsDirty = !1, ud(this, "aPosition", this._bounds)) : this._bounds;
  }
  /**
   * destroys the geometry.
   * @param destroyBuffers - destroy the buffers associated with this geometry
   */
  destroy(e = !1) {
    this.emit("destroy", this), this.removeAllListeners(), e && this.buffers.forEach((t) => t.destroy()), this.attributes = null, this.buffers = null, this.indexBuffer = null, this._bounds = null;
  }
}
const fd = new Float32Array(1), pd = new Uint32Array(1);
class md extends Gt {
  constructor() {
    const t = new Me({
      data: fd,
      label: "attribute-batch-buffer",
      usage: Q.VERTEX | Q.COPY_DST,
      shrinkToFit: !1
    }), s = new Me({
      data: pd,
      label: "index-batch-buffer",
      usage: Q.INDEX | Q.COPY_DST,
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
      indexBuffer: s
    });
  }
}
function qn(r, e, t) {
  if (r)
    for (const s in r) {
      const i = s.toLocaleLowerCase(), n = e[i];
      if (n) {
        let a = r[s];
        s === "header" && (a = a.replace(/@in\s+[^;]+;\s*/g, "").replace(/@out\s+[^;]+;\s*/g, "")), t && n.push(`//----${t}----//`), n.push(a);
      } else
        $(`${s} placement hook does not exist in shader`);
    }
}
const gd = /\{\{(.*?)\}\}/g;
function Zn(r) {
  var s;
  const e = {};
  return (((s = r.match(gd)) == null ? void 0 : s.map((i) => i.replace(/[{()}]/g, ""))) ?? []).forEach((i) => {
    e[i] = [];
  }), e;
}
function Qn(r, e) {
  let t;
  const s = /@in\s+([^;]+);/g;
  for (; (t = s.exec(r)) !== null; )
    e.push(t[1]);
}
function Jn(r, e, t = !1) {
  const s = [];
  Qn(e, s), r.forEach((o) => {
    o.header && Qn(o.header, s);
  });
  const i = s;
  t && i.sort();
  const n = i.map((o, h) => `       @location(${h}) ${o},`).join(`
`);
  let a = e.replace(/@in\s+[^;]+;\s*/g, "");
  return a = a.replace("{{in}}", `
${n}
`), a;
}
function ea(r, e) {
  let t;
  const s = /@out\s+([^;]+);/g;
  for (; (t = s.exec(r)) !== null; )
    e.push(t[1]);
}
function _d(r) {
  const t = /\b(\w+)\s*:/g.exec(r);
  return t ? t[1] : "";
}
function xd(r) {
  const e = /@.*?\s+/g;
  return r.replace(e, "");
}
function yd(r, e) {
  const t = [];
  ea(e, t), r.forEach((h) => {
    h.header && ea(h.header, t);
  });
  let s = 0;
  const i = t.sort().map((h) => h.indexOf("builtin") > -1 ? h : `@location(${s++}) ${h}`).join(`,
`), n = t.sort().map((h) => `       var ${xd(h)};`).join(`
`), a = `return VSOutput(
            ${t.sort().map((h) => ` ${_d(h)}`).join(`,
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
function ta(r, e) {
  let t = r;
  for (const s in e) {
    const i = e[s];
    i.join(`
`).length ? t = t.replace(`{{${s}}}`, `//-----${s} START-----//
${i.join(`
`)}
//----${s} FINISH----//`) : t = t.replace(`{{${s}}}`, "");
  }
  return t;
}
const rt = /* @__PURE__ */ Object.create(null), Ar = /* @__PURE__ */ new Map();
let bd = 0;
function vd({
  template: r,
  bits: e
}) {
  const t = Zo(r, e);
  if (rt[t])
    return rt[t];
  const { vertex: s, fragment: i } = Sd(r, e);
  return rt[t] = Qo(s, i, e), rt[t];
}
function Td({
  template: r,
  bits: e
}) {
  const t = Zo(r, e);
  return rt[t] || (rt[t] = Qo(r.vertex, r.fragment, e)), rt[t];
}
function Sd(r, e) {
  const t = e.map((a) => a.vertex).filter((a) => !!a), s = e.map((a) => a.fragment).filter((a) => !!a);
  let i = Jn(t, r.vertex, !0);
  i = yd(t, i);
  const n = Jn(s, r.fragment, !0);
  return {
    vertex: i,
    fragment: n
  };
}
function Zo(r, e) {
  return e.map((t) => (Ar.has(t) || Ar.set(t, bd++), Ar.get(t))).sort((t, s) => t - s).join("-") + r.vertex + r.fragment;
}
function Qo(r, e, t) {
  const s = Zn(r), i = Zn(e);
  return t.forEach((n) => {
    qn(n.vertex, s, n.name), qn(n.fragment, i, n.name);
  }), {
    vertex: ta(r, s),
    fragment: ta(e, i)
  };
}
const wd = (
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
), Ad = (
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
), Cd = (
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
), Ed = {
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
}, Md = {
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
function as({ bits: r, name: e }) {
  const t = vd({
    template: {
      fragment: Ad,
      vertex: wd
    },
    bits: [
      Ed,
      ...r
    ]
  });
  return _t.from({
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
function os({ bits: r, name: e }) {
  return new kt({
    name: e,
    ...Td({
      template: {
        vertex: Cd,
        fragment: Pd
      },
      bits: [
        Md,
        ...r
      ]
    })
  });
}
const Mi = {
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
}, Bi = {
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
}, Cr = {};
function Bd(r) {
  const e = [];
  if (r === 1)
    e.push("@group(1) @binding(0) var textureSource1: texture_2d<f32>;"), e.push("@group(1) @binding(1) var textureSampler1: sampler;");
  else {
    let t = 0;
    for (let s = 0; s < r; s++)
      e.push(`@group(1) @binding(${t++}) var textureSource${s + 1}: texture_2d<f32>;`), e.push(`@group(1) @binding(${t++}) var textureSampler${s + 1}: sampler;`);
  }
  return e.join(`
`);
}
function Rd(r) {
  const e = [];
  if (r === 1)
    e.push("outColor = textureSampleGrad(textureSource1, textureSampler1, vUV, uvDx, uvDy);");
  else {
    e.push("switch vTextureId {");
    for (let t = 0; t < r; t++)
      t === r - 1 ? e.push("  default:{") : e.push(`  case ${t}:{`), e.push(`      outColor = textureSampleGrad(textureSource${t + 1}, textureSampler${t + 1}, vUV, uvDx, uvDy);`), e.push("      break;}");
    e.push("}");
  }
  return e.join(`
`);
}
function Ri(r) {
  return Cr[r] || (Cr[r] = {
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

                ${Bd(r)}
            `,
      main: `
                var uvDx = dpdx(vUV);
                var uvDy = dpdy(vUV);

                ${Rd(r)}
            `
    }
  }), Cr[r];
}
const Pr = {};
function kd(r) {
  const e = [];
  for (let t = 0; t < r; t++)
    t > 0 && e.push("else"), t < r - 1 && e.push(`if(vTextureId < ${t}.5)`), e.push("{"), e.push(`	outColor = texture(uTextures[${t}], vUV);`), e.push("}");
  return e.join(`
`);
}
function ki(r) {
  return Pr[r] || (Pr[r] = {
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

                uniform sampler2D uTextures[${r}];

            `,
      main: `

                ${kd(r)}
            `
    }
  }), Pr[r];
}
const hs = {
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
}, cs = {
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
}, sa = {};
function Ii(r) {
  let e = sa[r];
  if (e)
    return e;
  const t = new Int32Array(r);
  for (let s = 0; s < r; s++)
    t[s] = s;
  return e = sa[r] = new ve({
    uTextures: { value: t, type: "i32", size: r }
  }, { isStatic: !0 }), e;
}
class Id extends Ge {
  constructor(e) {
    const t = os({
      name: "batch",
      bits: [
        Bi,
        ki(e),
        cs
      ]
    }), s = as({
      name: "batch",
      bits: [
        Mi,
        Ri(e),
        hs
      ]
    });
    super({
      glProgram: t,
      gpuProgram: s,
      resources: {
        batchSamplers: Ii(e)
      }
    });
  }
}
let ra = null;
const Jo = class eh extends ld {
  constructor() {
    super(...arguments), this.geometry = new md(), this.shader = ra || (ra = new Id(this.maxTextures)), this.name = eh.extension.name, this.vertexSize = 6;
  }
  /**
   * Packs the attributes of a DefaultBatchableMeshElement into the provided views.
   * @param element - The DefaultBatchableMeshElement to pack.
   * @param float32View - The Float32Array view to pack into.
   * @param uint32View - The Uint32Array view to pack into.
   * @param index - The starting index in the views.
   * @param textureId - The texture ID to use.
   */
  packAttributes(e, t, s, i, n) {
    const a = n << 16 | e.roundPixels & 65535, o = e.transform, h = o.a, c = o.b, l = o.c, u = o.d, d = o.tx, f = o.ty, { positions: p, uvs: g } = e, m = e.color, y = e.attributeOffset, x = y + e.attributeSize;
    for (let v = y; v < x; v++) {
      const A = v * 2, M = p[A], w = p[A + 1];
      t[i++] = h * M + l * w + d, t[i++] = u * w + c * M + f, t[i++] = g[A], t[i++] = g[A + 1], s[i++] = m, s[i++] = a;
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
  packQuadAttributes(e, t, s, i, n) {
    const a = e.texture, o = e.transform, h = o.a, c = o.b, l = o.c, u = o.d, d = o.tx, f = o.ty, p = e.bounds, g = p.maxX, m = p.minX, y = p.maxY, x = p.minY, v = a.uvs, A = e.color, M = n << 16 | e.roundPixels & 65535;
    t[i + 0] = h * m + l * x + d, t[i + 1] = u * x + c * m + f, t[i + 2] = v.x0, t[i + 3] = v.y0, s[i + 4] = A, s[i + 5] = M, t[i + 6] = h * g + l * x + d, t[i + 7] = u * x + c * g + f, t[i + 8] = v.x1, t[i + 9] = v.y1, s[i + 10] = A, s[i + 11] = M, t[i + 12] = h * g + l * y + d, t[i + 13] = u * y + c * g + f, t[i + 14] = v.x2, t[i + 15] = v.y2, s[i + 16] = A, s[i + 17] = M, t[i + 18] = h * m + l * y + d, t[i + 19] = u * y + c * m + f, t[i + 20] = v.x3, t[i + 21] = v.y3, s[i + 22] = A, s[i + 23] = M;
  }
};
Jo.extension = {
  type: [
    T.Batcher
  ],
  name: "default"
};
let Gi = Jo;
function Gd(r, e, t, s, i, n, a, o = null) {
  let h = 0;
  t *= e, i *= n;
  const c = o.a, l = o.b, u = o.c, d = o.d, f = o.tx, p = o.ty;
  for (; h < a; ) {
    const g = r[t], m = r[t + 1];
    s[i] = c * g + u * m + f, s[i + 1] = l * g + d * m + p, i += n, t += e, h++;
  }
}
function Ud(r, e, t, s) {
  let i = 0;
  for (e *= t; i < s; )
    r[e] = 0, r[e + 1] = 0, e += t, i++;
}
function th(r, e, t, s, i) {
  const n = e.a, a = e.b, o = e.c, h = e.d, c = e.tx, l = e.ty;
  t || (t = 0), s || (s = 2), i || (i = r.length / s - t);
  let u = t * s;
  for (let d = 0; d < i; d++) {
    const f = r[u], p = r[u + 1];
    r[u] = n * f + o * p + c, r[u + 1] = a * f + h * p + l, u += s;
  }
}
const Fd = new z();
class Ui {
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
    const e = this.baseColor, t = e >> 16 | e & 65280 | (e & 255) << 16, s = this.renderable;
    return s ? lo(t, s.groupColor) + (this.alpha * s.groupAlpha * 255 << 24) : t + (this.alpha * 255 << 24);
  }
  get transform() {
    var e;
    return ((e = this.renderable) == null ? void 0 : e.groupTransform) || Fd;
  }
  copyTo(e) {
    e.indexOffset = this.indexOffset, e.indexSize = this.indexSize, e.attributeOffset = this.attributeOffset, e.attributeSize = this.attributeSize, e.baseColor = this.baseColor, e.alpha = this.alpha, e.texture = this.texture, e.geometryData = this.geometryData, e.topology = this.topology;
  }
  reset() {
    this.applyTransform = !0, this.renderable = null, this.topology = "triangle-list";
  }
}
const is = {
  extension: {
    type: T.ShapeBuilder,
    name: "circle"
  },
  build(r, e) {
    let t, s, i, n, a, o;
    if (r.type === "circle") {
      const A = r;
      t = A.x, s = A.y, a = o = A.radius, i = n = 0;
    } else if (r.type === "ellipse") {
      const A = r;
      t = A.x, s = A.y, a = A.halfWidth, o = A.halfHeight, i = n = 0;
    } else {
      const A = r, M = A.width / 2, w = A.height / 2;
      t = A.x + M, s = A.y + w, a = o = Math.max(0, Math.min(A.radius, Math.min(M, w))), i = M - a, n = w - o;
    }
    if (!(a >= 0 && o >= 0 && i >= 0 && n >= 0))
      return e;
    const h = Math.ceil(2.3 * Math.sqrt(a + o)), c = h * 8 + (i ? 4 : 0) + (n ? 4 : 0);
    if (c === 0)
      return e;
    if (h === 0)
      return e[0] = e[6] = t + i, e[1] = e[3] = s + n, e[2] = e[4] = t - i, e[5] = e[7] = s - n, e;
    let l = 0, u = h * 4 + (i ? 2 : 0) + 2, d = u, f = c, p = i + a, g = n, m = t + p, y = t - p, x = s + g;
    if (e[l++] = m, e[l++] = x, e[--u] = x, e[--u] = y, n) {
      const A = s - g;
      e[d++] = y, e[d++] = A, e[--f] = A, e[--f] = m;
    }
    for (let A = 1; A < h; A++) {
      const M = Math.PI / 2 * (A / h), w = i + Math.cos(M) * a, C = n + Math.sin(M) * o, F = t + w, D = t - w, I = s + C, k = s - C;
      e[l++] = F, e[l++] = I, e[--u] = I, e[--u] = D, e[d++] = D, e[d++] = k, e[--f] = k, e[--f] = F;
    }
    p = i, g = n + o, m = t + p, y = t - p, x = s + g;
    const v = s - g;
    return e[l++] = m, e[l++] = x, e[--f] = v, e[--f] = m, i && (e[l++] = y, e[l++] = x, e[--f] = v, e[--f] = y), e;
  },
  triangulate(r, e, t, s, i, n) {
    if (r.length === 0)
      return;
    let a = 0, o = 0;
    for (let l = 0; l < r.length; l += 2)
      a += r[l], o += r[l + 1];
    a /= r.length / 2, o /= r.length / 2;
    let h = s;
    e[h * t] = a, e[h * t + 1] = o;
    const c = h++;
    for (let l = 0; l < r.length; l += 2)
      e[h * t] = r[l], e[h * t + 1] = r[l + 1], l > 0 && (i[n++] = h, i[n++] = c, i[n++] = h - 1), h++;
    i[n++] = c + 1, i[n++] = c, i[n++] = h - 1;
  }
}, Dd = { ...is, extension: { ...is.extension, name: "ellipse" } }, Od = { ...is, extension: { ...is.extension, name: "roundedRectangle" } }, sh = 1e-4, ia = 1e-4;
function Ld(r) {
  const e = r.length;
  if (e < 6)
    return 1;
  let t = 0;
  for (let s = 0, i = r[e - 2], n = r[e - 1]; s < e; s += 2) {
    const a = r[s], o = r[s + 1];
    t += (a - i) * (o + n), i = a, n = o;
  }
  return t < 0 ? -1 : 1;
}
function na(r, e, t, s, i, n, a, o) {
  const h = r - t * i, c = e - s * i, l = r + t * n, u = e + s * n;
  let d, f;
  a ? (d = s, f = -t) : (d = -s, f = t);
  const p = h + d, g = c + f, m = l + d, y = u + f;
  return o.push(p, g), o.push(m, y), 2;
}
function ht(r, e, t, s, i, n, a, o) {
  const h = t - r, c = s - e;
  let l = Math.atan2(h, c), u = Math.atan2(i - r, n - e);
  o && l < u ? l += Math.PI * 2 : !o && l > u && (u += Math.PI * 2);
  let d = l;
  const f = u - l, p = Math.abs(f), g = Math.sqrt(h * h + c * c), m = (15 * p * Math.sqrt(g) / Math.PI >> 0) + 1, y = f / m;
  if (d += y, o) {
    a.push(r, e), a.push(t, s);
    for (let x = 1, v = d; x < m; x++, v += y)
      a.push(r, e), a.push(
        r + Math.sin(v) * g,
        e + Math.cos(v) * g
      );
    a.push(r, e), a.push(i, n);
  } else {
    a.push(t, s), a.push(r, e);
    for (let x = 1, v = d; x < m; x++, v += y)
      a.push(
        r + Math.sin(v) * g,
        e + Math.cos(v) * g
      ), a.push(r, e);
    a.push(i, n), a.push(r, e);
  }
  return m * 2;
}
function Nd(r, e, t, s, i, n) {
  const a = sh;
  if (r.length === 0)
    return;
  const o = e;
  let h = o.alignment;
  if (e.alignment !== 0.5) {
    let P = Ld(r);
    h = (h - 0.5) * P + 0.5;
  }
  const c = new he(r[0], r[1]), l = new he(r[r.length - 2], r[r.length - 1]), u = s, d = Math.abs(c.x - l.x) < a && Math.abs(c.y - l.y) < a;
  if (u) {
    r = r.slice(), d && (r.pop(), r.pop(), l.set(r[r.length - 2], r[r.length - 1]));
    const P = (c.x + l.x) * 0.5, E = (l.y + c.y) * 0.5;
    r.unshift(P, E), r.push(P, E);
  }
  const f = i, p = r.length / 2;
  let g = r.length;
  const m = f.length / 2, y = o.width / 2, x = y * y, v = o.miterLimit * o.miterLimit;
  let A = r[0], M = r[1], w = r[2], C = r[3], F = 0, D = 0, I = -(M - C), k = A - w, U = 0, O = 0, Y = Math.sqrt(I * I + k * k);
  I /= Y, k /= Y, I *= y, k *= y;
  const X = h, _ = (1 - X) * 2, b = X * 2;
  u || (o.cap === "round" ? g += ht(
    A - I * (_ - b) * 0.5,
    M - k * (_ - b) * 0.5,
    A - I * _,
    M - k * _,
    A + I * b,
    M + k * b,
    f,
    !0
  ) + 2 : o.cap === "square" && (g += na(A, M, I, k, _, b, !0, f))), f.push(
    A - I * _,
    M - k * _
  ), f.push(
    A + I * b,
    M + k * b
  );
  for (let P = 1; P < p - 1; ++P) {
    A = r[(P - 1) * 2], M = r[(P - 1) * 2 + 1], w = r[P * 2], C = r[P * 2 + 1], F = r[(P + 1) * 2], D = r[(P + 1) * 2 + 1], I = -(M - C), k = A - w, Y = Math.sqrt(I * I + k * k), I /= Y, k /= Y, I *= y, k *= y, U = -(C - D), O = w - F, Y = Math.sqrt(U * U + O * O), U /= Y, O /= Y, U *= y, O *= y;
    const E = w - A, B = M - C, R = w - F, G = D - C, L = E * R + B * G, N = B * R - G * E, ie = N < 0;
    if (Math.abs(N) < 1e-3 * Math.abs(L)) {
      f.push(
        w - I * _,
        C - k * _
      ), f.push(
        w + I * b,
        C + k * b
      ), L >= 0 && (o.join === "round" ? g += ht(
        w,
        C,
        w - I * _,
        C - k * _,
        w - U * _,
        C - O * _,
        f,
        !1
      ) + 4 : g += 2, f.push(
        w - U * b,
        C - O * b
      ), f.push(
        w + U * _,
        C + O * _
      ));
      continue;
    }
    const ne = (-I + A) * (-k + C) - (-I + w) * (-k + M), ee = (-U + F) * (-O + C) - (-U + w) * (-O + D), fe = (E * ee - R * ne) / N, re = (G * ne - B * ee) / N, $e = (fe - w) * (fe - w) + (re - C) * (re - C), Ae = w + (fe - w) * _, Ne = C + (re - C) * _, He = w - (fe - w) * b, K = C - (re - C) * b, te = Math.min(E * E + B * B, R * R + G * G), on = ie ? _ : b, dl = te + on * on * x;
    $e <= dl ? o.join === "bevel" || $e / x > v ? (ie ? (f.push(Ae, Ne), f.push(w + I * b, C + k * b), f.push(Ae, Ne), f.push(w + U * b, C + O * b)) : (f.push(w - I * _, C - k * _), f.push(He, K), f.push(w - U * _, C - O * _), f.push(He, K)), g += 2) : o.join === "round" ? ie ? (f.push(Ae, Ne), f.push(w + I * b, C + k * b), g += ht(
      w,
      C,
      w + I * b,
      C + k * b,
      w + U * b,
      C + O * b,
      f,
      !0
    ) + 4, f.push(Ae, Ne), f.push(w + U * b, C + O * b)) : (f.push(w - I * _, C - k * _), f.push(He, K), g += ht(
      w,
      C,
      w - I * _,
      C - k * _,
      w - U * _,
      C - O * _,
      f,
      !1
    ) + 4, f.push(w - U * _, C - O * _), f.push(He, K)) : (f.push(Ae, Ne), f.push(He, K)) : (f.push(w - I * _, C - k * _), f.push(w + I * b, C + k * b), o.join === "round" ? ie ? g += ht(
      w,
      C,
      w + I * b,
      C + k * b,
      w + U * b,
      C + O * b,
      f,
      !0
    ) + 2 : g += ht(
      w,
      C,
      w - I * _,
      C - k * _,
      w - U * _,
      C - O * _,
      f,
      !1
    ) + 2 : o.join === "miter" && $e / x <= v && (ie ? (f.push(He, K), f.push(He, K)) : (f.push(Ae, Ne), f.push(Ae, Ne)), g += 2), f.push(w - U * _, C - O * _), f.push(w + U * b, C + O * b), g += 2);
  }
  A = r[(p - 2) * 2], M = r[(p - 2) * 2 + 1], w = r[(p - 1) * 2], C = r[(p - 1) * 2 + 1], I = -(M - C), k = A - w, Y = Math.sqrt(I * I + k * k), I /= Y, k /= Y, I *= y, k *= y, f.push(w - I * _, C - k * _), f.push(w + I * b, C + k * b), u || (o.cap === "round" ? g += ht(
    w - I * (_ - b) * 0.5,
    C - k * (_ - b) * 0.5,
    w - I * _,
    C - k * _,
    w + I * b,
    C + k * b,
    f,
    !1
  ) + 2 : o.cap === "square" && (g += na(w, C, I, k, _, b, !1, f)));
  const S = ia * ia;
  for (let P = m; P < g + m - 2; ++P)
    A = f[P * 2], M = f[P * 2 + 1], w = f[(P + 1) * 2], C = f[(P + 1) * 2 + 1], F = f[(P + 2) * 2], D = f[(P + 2) * 2 + 1], !(Math.abs(A * (C - D) + w * (D - M) + F * (M - C)) < S) && n.push(P, P + 1, P + 2);
}
function Hd(r, e, t, s) {
  const i = sh;
  if (r.length === 0)
    return;
  const n = r[0], a = r[1], o = r[r.length - 2], h = r[r.length - 1], c = e || Math.abs(n - o) < i && Math.abs(a - h) < i, l = t, u = r.length / 2, d = l.length / 2;
  for (let f = 0; f < u; f++)
    l.push(r[f * 2]), l.push(r[f * 2 + 1]);
  for (let f = 0; f < u - 1; f++)
    s.push(d + f, d + f + 1);
  c && s.push(d + u - 1, d);
}
function rh(r, e, t, s, i, n, a) {
  const o = Vu(r, e, 2);
  if (!o)
    return;
  for (let c = 0; c < o.length; c += 3)
    n[a++] = o[c] + i, n[a++] = o[c + 1] + i, n[a++] = o[c + 2] + i;
  let h = i * s;
  for (let c = 0; c < r.length; c += 2)
    t[h] = r[c], t[h + 1] = r[c + 1], h += s;
}
const Wd = [], zd = {
  extension: {
    type: T.ShapeBuilder,
    name: "polygon"
  },
  build(r, e) {
    for (let t = 0; t < r.points.length; t++)
      e[t] = r.points[t];
    return e;
  },
  triangulate(r, e, t, s, i, n) {
    rh(r, Wd, e, t, s, i, n);
  }
}, Vd = {
  extension: {
    type: T.ShapeBuilder,
    name: "rectangle"
  },
  build(r, e) {
    const t = r, s = t.x, i = t.y, n = t.width, a = t.height;
    return n >= 0 && a >= 0 && (e[0] = s, e[1] = i, e[2] = s + n, e[3] = i, e[4] = s + n, e[5] = i + a, e[6] = s, e[7] = i + a), e;
  },
  triangulate(r, e, t, s, i, n) {
    let a = 0;
    s *= t, e[s + a] = r[0], e[s + a + 1] = r[1], a += t, e[s + a] = r[2], e[s + a + 1] = r[3], a += t, e[s + a] = r[6], e[s + a + 1] = r[7], a += t, e[s + a] = r[4], e[s + a + 1] = r[5], a += t;
    const o = s / t;
    i[n++] = o, i[n++] = o + 1, i[n++] = o + 2, i[n++] = o + 1, i[n++] = o + 3, i[n++] = o + 2;
  }
}, $d = {
  extension: {
    type: T.ShapeBuilder,
    name: "triangle"
  },
  build(r, e) {
    return e[0] = r.x, e[1] = r.y, e[2] = r.x2, e[3] = r.y2, e[4] = r.x3, e[5] = r.y3, e;
  },
  triangulate(r, e, t, s, i, n) {
    let a = 0;
    s *= t, e[s + a] = r[0], e[s + a + 1] = r[1], a += t, e[s + a] = r[2], e[s + a + 1] = r[3], a += t, e[s + a] = r[4], e[s + a + 1] = r[5];
    const o = s / t;
    i[n++] = o, i[n++] = o + 1, i[n++] = o + 2;
  }
}, Xd = new z(), jd = new oe();
function Yd(r, e, t, s) {
  const i = e.matrix ? r.copyFrom(e.matrix).invert() : r.identity();
  if (e.textureSpace === "local") {
    const n = t.getBounds(jd);
    i.translate(-n.x, -n.y), i.scale(1 / n.width, 1 / n.height);
  } else {
    i.translate(e.texture.frame.x, e.texture.frame.y), i.scale(1 / e.texture.source.width, 1 / e.texture.source.height);
    const n = e.texture.source.style;
    n.addressMode === "clamp-to-edge" && (n.addressMode = "repeat", n.update());
  }
  return s && i.append(Xd.copyFrom(s).invert()), i;
}
const qs = {};
V.handleByMap(T.ShapeBuilder, qs);
V.add(Vd, zd, $d, is, Dd, Od);
const Kd = new oe(), qd = new z();
function Zd(r, e) {
  const { geometryData: t, batches: s } = e;
  s.length = 0, t.indices.length = 0, t.vertices.length = 0, t.uvs.length = 0;
  for (let i = 0; i < r.instructions.length; i++) {
    const n = r.instructions[i];
    if (n.action === "texture")
      Qd(n.data, s, t);
    else if (n.action === "fill" || n.action === "stroke") {
      const a = n.action === "stroke", o = n.data.path.shapePath, h = n.data.style, c = n.data.hole;
      a && c && aa(c.shapePath, h, !0, s, t), c && (o.shapePrimitives[o.shapePrimitives.length - 1].holes = c.shapePath.shapePrimitives), aa(o, h, a, s, t);
    }
  }
}
function Qd(r, e, t) {
  const { vertices: s, uvs: i, indices: n } = t, a = n.length, o = s.length / 2, h = [], c = qs.rectangle, l = Kd, u = r.image;
  l.x = r.dx, l.y = r.dy, l.width = r.dw, l.height = r.dh;
  const d = r.transform;
  c.build(l, h), d && th(h, d), c.triangulate(h, s, 2, o, n, a);
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
  const p = Z.get(Ui);
  p.indexOffset = a, p.indexSize = n.length - a, p.attributeOffset = o, p.attributeSize = s.length / 2 - o, p.baseColor = r.style, p.alpha = r.alpha, p.texture = u, p.geometryData = t, e.push(p);
}
function aa(r, e, t, s, i) {
  const { vertices: n, uvs: a, indices: o } = i;
  r.shapePrimitives.forEach(({ shape: h, transform: c, holes: l }) => {
    const u = o.length, d = n.length / 2, f = [], p = qs[h.type];
    let g = "triangle-list";
    if (p.build(h, f), c && th(f, c), t) {
      const v = h.closePath ?? !0, A = e;
      A.pixelLine ? (Hd(f, v, n, o), g = "line-list") : Nd(f, A, !1, v, n, o);
    } else if (l) {
      const v = [], A = f.slice();
      Jd(l).forEach((w) => {
        v.push(A.length / 2), A.push(...w);
      }), rh(A, v, n, 2, d, o, u);
    } else
      p.triangulate(f, n, 2, d, o, u);
    const m = a.length / 2, y = e.texture;
    if (y !== H.WHITE) {
      const v = Yd(qd, e, h, c);
      Gd(n, 2, d, a, m, 2, n.length / 2 - d, v);
    } else
      Ud(a, m, 2, n.length / 2 - d);
    const x = Z.get(Ui);
    x.indexOffset = u, x.indexSize = o.length - u, x.attributeOffset = d, x.attributeSize = n.length / 2 - d, x.baseColor = e.color, x.alpha = e.alpha, x.texture = y, x.geometryData = i, x.topology = g, s.push(x);
  });
}
function Jd(r) {
  const e = [];
  for (let t = 0; t < r.length; t++) {
    const s = r[t].shape, i = [];
    qs[s.type].build(s, i), e.push(i);
  }
  return e;
}
class ef {
  constructor() {
    this.batches = [], this.geometryData = {
      vertices: [],
      uvs: [],
      indices: []
    };
  }
}
class tf {
  constructor() {
    this.batcher = new Gi(), this.instructions = new po();
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
    return j(Sl, "GraphicsContextRenderData#geometry is deprecated, please use batcher.geometry instead."), this.batcher.geometry;
  }
}
const Fi = class ri {
  constructor(e) {
    this._gpuContextHash = {}, this._graphicsDataContextHash = /* @__PURE__ */ Object.create(null), e.renderableGC.addManagedHash(this, "_gpuContextHash"), e.renderableGC.addManagedHash(this, "_graphicsDataContextHash");
  }
  /**
   * Runner init called, update the default options
   * @ignore
   */
  init(e) {
    ri.defaultOptions.bezierSmoothness = (e == null ? void 0 : e.bezierSmoothness) ?? ri.defaultOptions.bezierSmoothness;
  }
  getContextRenderData(e) {
    return this._graphicsDataContextHash[e.uid] || this._initContextRenderData(e);
  }
  // Context management functions
  updateGpuContext(e) {
    let t = this._gpuContextHash[e.uid] || this._initContext(e);
    if (e.dirty) {
      t ? this._cleanGraphicsContextData(e) : t = this._initContext(e), Zd(e, t);
      const s = e.batchMode;
      e.customShader || s === "no-batch" ? t.isBatchable = !1 : s === "auto" && (t.isBatchable = t.geometryData.vertices.length < 400), e.dirty = !1;
    }
    return t;
  }
  getGpuContext(e) {
    return this._gpuContextHash[e.uid] || this._initContext(e);
  }
  _initContextRenderData(e) {
    const t = Z.get(tf), { batches: s, geometryData: i } = this._gpuContextHash[e.uid], n = i.vertices.length, a = i.indices.length;
    for (let l = 0; l < s.length; l++)
      s[l].applyTransform = !1;
    const o = t.batcher;
    o.ensureAttributeBuffer(n), o.ensureIndexBuffer(a), o.begin();
    for (let l = 0; l < s.length; l++) {
      const u = s[l];
      o.add(u);
    }
    o.finish(t.instructions);
    const h = o.geometry;
    h.indexBuffer.setDataWithSize(o.indexBuffer, o.indexSize, !0), h.buffers[0].setDataWithSize(o.attributeBuffer.float32View, o.attributeSize, !0);
    const c = o.batches;
    for (let l = 0; l < c.length; l++) {
      const u = c[l];
      u.bindGroup = Ei(u.textures.textures, u.textures.count);
    }
    return this._graphicsDataContextHash[e.uid] = t, t;
  }
  _initContext(e) {
    const t = new ef();
    return t.context = e, this._gpuContextHash[e.uid] = t, e.on("destroy", this.onGraphicsContextDestroy, this), this._gpuContextHash[e.uid];
  }
  onGraphicsContextDestroy(e) {
    this._cleanGraphicsContextData(e), e.off("destroy", this.onGraphicsContextDestroy, this), this._gpuContextHash[e.uid] = null;
  }
  _cleanGraphicsContextData(e) {
    const t = this._gpuContextHash[e.uid];
    t.isBatchable || this._graphicsDataContextHash[e.uid] && (Z.return(this.getContextRenderData(e)), this._graphicsDataContextHash[e.uid] = null), t.batches && t.batches.forEach((s) => {
      Z.return(s);
    });
  }
  destroy() {
    for (const e in this._gpuContextHash)
      this._gpuContextHash[e] && this.onGraphicsContextDestroy(this._gpuContextHash[e].context);
  }
};
Fi.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem,
    T.CanvasSystem
  ],
  name: "graphicsContext"
};
Fi.defaultOptions = {
  /**
   * A value from 0 to 1 that controls the smoothness of bezier curves (the higher the smoother)
   * @default 0.5
   */
  bezierSmoothness: 0.5
};
let Di = Fi;
const sf = 8, Ts = 11920929e-14, rf = 1;
function ih(r, e, t, s, i, n, a, o, h, c) {
  const u = Math.min(
    0.99,
    // a value of 1.0 actually inverts smoothing, so we cap it at 0.99
    Math.max(0, c ?? Di.defaultOptions.bezierSmoothness)
  );
  let d = (rf - u) / 1;
  return d *= d, nf(e, t, s, i, n, a, o, h, r, d), r;
}
function nf(r, e, t, s, i, n, a, o, h, c) {
  ii(r, e, t, s, i, n, a, o, h, c, 0), h.push(a, o);
}
function ii(r, e, t, s, i, n, a, o, h, c, l) {
  if (l > sf)
    return;
  const u = (r + t) / 2, d = (e + s) / 2, f = (t + i) / 2, p = (s + n) / 2, g = (i + a) / 2, m = (n + o) / 2, y = (u + f) / 2, x = (d + p) / 2, v = (f + g) / 2, A = (p + m) / 2, M = (y + v) / 2, w = (x + A) / 2;
  if (l > 0) {
    let C = a - r, F = o - e;
    const D = Math.abs((t - a) * F - (s - o) * C), I = Math.abs((i - a) * F - (n - o) * C);
    if (D > Ts && I > Ts) {
      if ((D + I) * (D + I) <= c * (C * C + F * F)) {
        h.push(M, w);
        return;
      }
    } else if (D > Ts) {
      if (D * D <= c * (C * C + F * F)) {
        h.push(M, w);
        return;
      }
    } else if (I > Ts) {
      if (I * I <= c * (C * C + F * F)) {
        h.push(M, w);
        return;
      }
    } else if (C = M - (r + a) / 2, F = w - (e + o) / 2, C * C + F * F <= c) {
      h.push(M, w);
      return;
    }
  }
  ii(r, e, u, d, y, x, M, w, h, c, l + 1), ii(M, w, v, A, g, m, a, o, h, c, l + 1);
}
const af = 8, of = 11920929e-14, hf = 1;
function cf(r, e, t, s, i, n, a, o) {
  const c = Math.min(
    0.99,
    // a value of 1.0 actually inverts smoothing, so we cap it at 0.99
    Math.max(0, o ?? Di.defaultOptions.bezierSmoothness)
  );
  let l = (hf - c) / 1;
  return l *= l, lf(e, t, s, i, n, a, r, l), r;
}
function lf(r, e, t, s, i, n, a, o) {
  ni(a, r, e, t, s, i, n, o, 0), a.push(i, n);
}
function ni(r, e, t, s, i, n, a, o, h) {
  if (h > af)
    return;
  const c = (e + s) / 2, l = (t + i) / 2, u = (s + n) / 2, d = (i + a) / 2, f = (c + u) / 2, p = (l + d) / 2;
  let g = n - e, m = a - t;
  const y = Math.abs((s - n) * m - (i - a) * g);
  if (y > of) {
    if (y * y <= o * (g * g + m * m)) {
      r.push(f, p);
      return;
    }
  } else if (g = f - (e + n) / 2, m = p - (t + a) / 2, g * g + m * m <= o) {
    r.push(f, p);
    return;
  }
  ni(r, e, t, c, l, f, p, o, h + 1), ni(r, f, p, u, d, n, a, o, h + 1);
}
function nh(r, e, t, s, i, n, a, o) {
  let h = Math.abs(i - n);
  (!a && i > n || a && n > i) && (h = 2 * Math.PI - h), o || (o = Math.max(6, Math.floor(6 * Math.pow(s, 1 / 3) * (h / Math.PI)))), o = Math.max(o, 3);
  let c = h / o, l = i;
  c *= a ? -1 : 1;
  for (let u = 0; u < o + 1; u++) {
    const d = Math.cos(l), f = Math.sin(l), p = e + d * s, g = t + f * s;
    r.push(p, g), l += c;
  }
}
function uf(r, e, t, s, i, n) {
  const a = r[r.length - 2], h = r[r.length - 1] - t, c = a - e, l = i - t, u = s - e, d = Math.abs(h * u - c * l);
  if (d < 1e-8 || n === 0) {
    (r[r.length - 2] !== e || r[r.length - 1] !== t) && r.push(e, t);
    return;
  }
  const f = h * h + c * c, p = l * l + u * u, g = h * l + c * u, m = n * Math.sqrt(f) / d, y = n * Math.sqrt(p) / d, x = m * g / f, v = y * g / p, A = m * u + y * c, M = m * l + y * h, w = c * (y + x), C = h * (y + x), F = u * (m + v), D = l * (m + v), I = Math.atan2(C - M, w - A), k = Math.atan2(D - M, F - A);
  nh(
    r,
    A + e,
    M + t,
    n,
    I,
    k,
    c * l > u * h
  );
}
const Zt = Math.PI * 2, Er = {
  centerX: 0,
  centerY: 0,
  ang1: 0,
  ang2: 0
}, Mr = ({ x: r, y: e }, t, s, i, n, a, o, h) => {
  r *= t, e *= s;
  const c = i * r - n * e, l = n * r + i * e;
  return h.x = c + a, h.y = l + o, h;
};
function df(r, e) {
  const t = e === -1.5707963267948966 ? -0.551915024494 : 1.3333333333333333 * Math.tan(e / 4), s = e === 1.5707963267948966 ? 0.551915024494 : t, i = Math.cos(r), n = Math.sin(r), a = Math.cos(r + e), o = Math.sin(r + e);
  return [
    {
      x: i - n * s,
      y: n + i * s
    },
    {
      x: a + o * s,
      y: o - a * s
    },
    {
      x: a,
      y: o
    }
  ];
}
const oa = (r, e, t, s) => {
  const i = r * s - e * t < 0 ? -1 : 1;
  let n = r * t + e * s;
  return n > 1 && (n = 1), n < -1 && (n = -1), i * Math.acos(n);
}, ff = (r, e, t, s, i, n, a, o, h, c, l, u, d) => {
  const f = Math.pow(i, 2), p = Math.pow(n, 2), g = Math.pow(l, 2), m = Math.pow(u, 2);
  let y = f * p - f * m - p * g;
  y < 0 && (y = 0), y /= f * m + p * g, y = Math.sqrt(y) * (a === o ? -1 : 1);
  const x = y * i / n * u, v = y * -n / i * l, A = c * x - h * v + (r + t) / 2, M = h * x + c * v + (e + s) / 2, w = (l - x) / i, C = (u - v) / n, F = (-l - x) / i, D = (-u - v) / n, I = oa(1, 0, w, C);
  let k = oa(w, C, F, D);
  o === 0 && k > 0 && (k -= Zt), o === 1 && k < 0 && (k += Zt), d.centerX = A, d.centerY = M, d.ang1 = I, d.ang2 = k;
};
function pf(r, e, t, s, i, n, a, o = 0, h = 0, c = 0) {
  if (n === 0 || a === 0)
    return;
  const l = Math.sin(o * Zt / 360), u = Math.cos(o * Zt / 360), d = u * (e - s) / 2 + l * (t - i) / 2, f = -l * (e - s) / 2 + u * (t - i) / 2;
  if (d === 0 && f === 0)
    return;
  n = Math.abs(n), a = Math.abs(a);
  const p = Math.pow(d, 2) / Math.pow(n, 2) + Math.pow(f, 2) / Math.pow(a, 2);
  p > 1 && (n *= Math.sqrt(p), a *= Math.sqrt(p)), ff(
    e,
    t,
    s,
    i,
    n,
    a,
    h,
    c,
    l,
    u,
    d,
    f,
    Er
  );
  let { ang1: g, ang2: m } = Er;
  const { centerX: y, centerY: x } = Er;
  let v = Math.abs(m) / (Zt / 4);
  Math.abs(1 - v) < 1e-7 && (v = 1);
  const A = Math.max(Math.ceil(v), 1);
  m /= A;
  let M = r[r.length - 2], w = r[r.length - 1];
  const C = { x: 0, y: 0 };
  for (let F = 0; F < A; F++) {
    const D = df(g, m), { x: I, y: k } = Mr(D[0], n, a, u, l, y, x, C), { x: U, y: O } = Mr(D[1], n, a, u, l, y, x, C), { x: Y, y: X } = Mr(D[2], n, a, u, l, y, x, C);
    ih(
      r,
      M,
      w,
      I,
      k,
      U,
      O,
      Y,
      X
    ), M = Y, w = X, g += m;
  }
}
function mf(r, e, t) {
  const s = (a, o) => {
    const h = o.x - a.x, c = o.y - a.y, l = Math.sqrt(h * h + c * c), u = h / l, d = c / l;
    return { len: l, nx: u, ny: d };
  }, i = (a, o) => {
    a === 0 ? r.moveTo(o.x, o.y) : r.lineTo(o.x, o.y);
  };
  let n = e[e.length - 1];
  for (let a = 0; a < e.length; a++) {
    const o = e[a % e.length], h = o.radius ?? t;
    if (h <= 0) {
      i(a, o), n = o;
      continue;
    }
    const c = e[(a + 1) % e.length], l = s(o, n), u = s(o, c);
    if (l.len < 1e-4 || u.len < 1e-4) {
      i(a, o), n = o;
      continue;
    }
    let d = Math.asin(l.nx * u.ny - l.ny * u.nx), f = 1, p = !1;
    l.nx * u.nx - l.ny * -u.ny < 0 ? d < 0 ? d = Math.PI + d : (d = Math.PI - d, f = -1, p = !0) : d > 0 && (f = -1, p = !0);
    const g = d / 2;
    let m, y = Math.abs(
      Math.cos(g) * h / Math.sin(g)
    );
    y > Math.min(l.len / 2, u.len / 2) ? (y = Math.min(l.len / 2, u.len / 2), m = Math.abs(y * Math.sin(g) / Math.cos(g))) : m = h;
    const x = o.x + u.nx * y + -u.ny * m * f, v = o.y + u.ny * y + u.nx * m * f, A = Math.atan2(l.ny, l.nx) + Math.PI / 2 * f, M = Math.atan2(u.ny, u.nx) - Math.PI / 2 * f;
    a === 0 && r.moveTo(
      x + Math.cos(A) * m,
      v + Math.sin(A) * m
    ), r.arc(x, v, m, A, M, p), n = o;
  }
}
function gf(r, e, t, s) {
  const i = (o, h) => Math.sqrt((o.x - h.x) ** 2 + (o.y - h.y) ** 2), n = (o, h, c) => ({
    x: o.x + (h.x - o.x) * c,
    y: o.y + (h.y - o.y) * c
  }), a = e.length;
  for (let o = 0; o < a; o++) {
    const h = e[(o + 1) % a], c = h.radius ?? t;
    if (c <= 0) {
      o === 0 ? r.moveTo(h.x, h.y) : r.lineTo(h.x, h.y);
      continue;
    }
    const l = e[o], u = e[(o + 2) % a], d = i(l, h);
    let f;
    if (d < 1e-4)
      f = h;
    else {
      const m = Math.min(d / 2, c);
      f = n(
        h,
        l,
        m / d
      );
    }
    const p = i(u, h);
    let g;
    if (p < 1e-4)
      g = h;
    else {
      const m = Math.min(p / 2, c);
      g = n(
        h,
        u,
        m / p
      );
    }
    o === 0 ? r.moveTo(f.x, f.y) : r.lineTo(f.x, f.y), r.quadraticCurveTo(h.x, h.y, g.x, g.y, s);
  }
}
const _f = new oe();
class xf {
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
    const s = this._currentPoly.points, i = s[s.length - 2], n = s[s.length - 1];
    return (i !== e || n !== t) && s.push(e, t), this;
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
  arc(e, t, s, i, n, a) {
    this._ensurePoly(!1);
    const o = this._currentPoly.points;
    return nh(o, e, t, s, i, n, a), this;
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
  arcTo(e, t, s, i, n) {
    this._ensurePoly();
    const a = this._currentPoly.points;
    return uf(a, e, t, s, i, n), this;
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
  arcToSvg(e, t, s, i, n, a, o) {
    const h = this._currentPoly.points;
    return pf(
      h,
      this._currentPoly.lastX,
      this._currentPoly.lastY,
      a,
      o,
      e,
      t,
      s,
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
  bezierCurveTo(e, t, s, i, n, a, o) {
    this._ensurePoly();
    const h = this._currentPoly;
    return ih(
      this._currentPoly.points,
      h.lastX,
      h.lastY,
      e,
      t,
      s,
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
  quadraticCurveTo(e, t, s, i, n) {
    this._ensurePoly();
    const a = this._currentPoly;
    return cf(
      this._currentPoly.points,
      a.lastX,
      a.lastY,
      e,
      t,
      s,
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
    const s = this.shapePrimitives, i = s.length;
    for (let n = 0; n < e.instructions.length; n++) {
      const a = e.instructions[n];
      this[a.action](...a.data);
    }
    if (e.checkForHoles && s.length - i > 1) {
      let n = null;
      for (let a = i; a < s.length; a++) {
        const o = s[a];
        if (o.shape.type === "polygon") {
          const h = o.shape, c = n == null ? void 0 : n.shape;
          c && c.containsPolygon(h) ? (n.holes || (n.holes = []), n.holes.push(o), s.copyWithin(a, a + 1), s.length--, a--) : n = o;
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
  rect(e, t, s, i, n) {
    return this.drawShape(new oe(e, t, s, i), n), this;
  }
  /**
   * Draws a circle shape. This method adds a new circle path to the current drawing.
   * @param x - The x-coordinate of the center of the circle.
   * @param y - The y-coordinate of the center of the circle.
   * @param radius - The radius of the circle.
   * @param transform - An optional `Matrix` object to apply a transformation to the circle.
   * @returns The instance of the current object for chaining.
   */
  circle(e, t, s, i) {
    return this.drawShape(new Ai(e, t, s), i), this;
  }
  /**
   * Draws a polygon shape. This method allows for the creation of complex polygons by specifying a sequence of points.
   * @param points - An array of numbers, or or an array of PointData objects eg [{x,y}, {x,y}, {x,y}]
   * representing the x and y coordinates of the polygon's vertices, in sequence.
   * @param close - A boolean indicating whether to close the polygon path. True by default.
   * @param transform - An optional `Matrix` object to apply a transformation to the polygon.
   * @returns The instance of the current object for chaining.
   */
  poly(e, t, s) {
    const i = new qt(e);
    return i.closePath = t, this.drawShape(i, s), this;
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
  regularPoly(e, t, s, i, n = 0, a) {
    i = Math.max(i | 0, 3);
    const o = -1 * Math.PI / 2 + n, h = Math.PI * 2 / i, c = [];
    for (let l = 0; l < i; l++) {
      const u = o - l * h;
      c.push(
        e + s * Math.cos(u),
        t + s * Math.sin(u)
      );
    }
    return this.poly(c, !0, a), this;
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
  roundPoly(e, t, s, i, n, a = 0, o) {
    if (i = Math.max(i | 0, 3), n <= 0)
      return this.regularPoly(e, t, s, i, a);
    const h = s * Math.sin(Math.PI / i) - 1e-3;
    n = Math.min(n, h);
    const c = -1 * Math.PI / 2 + a, l = Math.PI * 2 / i, u = (i - 2) * Math.PI / i / 2;
    for (let d = 0; d < i; d++) {
      const f = d * l + c, p = e + s * Math.cos(f), g = t + s * Math.sin(f), m = f + Math.PI + u, y = f - Math.PI - u, x = p + n * Math.cos(m), v = g + n * Math.sin(m), A = p + n * Math.cos(y), M = g + n * Math.sin(y);
      d === 0 ? this.moveTo(x, v) : this.lineTo(x, v), this.quadraticCurveTo(p, g, A, M, o);
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
  roundShape(e, t, s = !1, i) {
    return e.length < 3 ? this : (s ? gf(this, e, t, i) : mf(this, e, t), this.closePath());
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
  filletRect(e, t, s, i, n) {
    if (n === 0)
      return this.rect(e, t, s, i);
    const a = Math.min(s, i) / 2, o = Math.min(a, Math.max(-a, n)), h = e + s, c = t + i, l = o < 0 ? -o : 0, u = Math.abs(o);
    return this.moveTo(e, t + u).arcTo(e + l, t + l, e + u, t, u).lineTo(h - u, t).arcTo(h - l, t + l, h, t + u, u).lineTo(h, c - u).arcTo(h - l, c - l, e + s - u, c, u).lineTo(e + u, c).arcTo(e + l, c - l, e, c - u, u).closePath();
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
  chamferRect(e, t, s, i, n, a) {
    if (n <= 0)
      return this.rect(e, t, s, i);
    const o = Math.min(n, Math.min(s, i) / 2), h = e + s, c = t + i, l = [
      e + o,
      t,
      h - o,
      t,
      h,
      t + o,
      h,
      c - o,
      h - o,
      c,
      e + o,
      c,
      e,
      c - o,
      e,
      t + o
    ];
    for (let u = l.length - 1; u >= 2; u -= 2)
      l[u] === l[u - 2] && l[u - 1] === l[u - 3] && l.splice(u - 1, 2);
    return this.poly(l, !0, a);
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
  ellipse(e, t, s, i, n) {
    return this.drawShape(new Ci(e, t, s, i), n), this;
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
  roundRect(e, t, s, i, n, a) {
    return this.drawShape(new Pi(e, t, s, i, n), a), this;
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
    let s = this._currentPoly;
    return s && this.endPoly(), s = new qt(), s.points.push(e, t), this._currentPoly = s, this;
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
    if (!this._currentPoly && (this._currentPoly = new qt(), e)) {
      const t = this.shapePrimitives[this.shapePrimitives.length - 1];
      if (t) {
        let s = t.shape.x, i = t.shape.y;
        if (t.transform && !t.transform.isIdentity()) {
          const n = t.transform, a = s;
          s = n.a * s + n.c * i + n.tx, i = n.b * a + n.d * i + n.ty;
        }
        this._currentPoly.points.push(s, i);
      } else
        this._currentPoly.points.push(0, 0);
    }
  }
  /** Builds the path. */
  buildPath() {
    const e = this._graphicsPath2D;
    this.shapePrimitives.length = 0, this._currentPoly = null;
    for (let t = 0; t < e.instructions.length; t++) {
      const s = e.instructions[t];
      this[s.action](...s.data);
    }
    this.finish();
  }
  /** Gets the bounds of the path. */
  get bounds() {
    const e = this._bounds;
    e.clear();
    const t = this.shapePrimitives;
    for (let s = 0; s < t.length; s++) {
      const i = t[s], n = i.shape.getBounds(_f);
      i.transform ? e.addRect(n, i.transform) : e.addRect(n);
    }
    return e;
  }
}
class Et {
  /**
   * Creates a `GraphicsPath` instance optionally from an SVG path string or an array of `PathInstruction`.
   * @param instructions - An SVG path string or an array of `PathInstruction` objects.
   * @param signed
   */
  constructor(e, t = !1) {
    this.instructions = [], this.uid = le("graphicsPath"), this._dirty = !0, this.checkForHoles = t, typeof e == "string" ? Ju(e, this) : this.instructions = (e == null ? void 0 : e.slice()) ?? [];
  }
  /**
   * Provides access to the internal shape path, ensuring it is up-to-date with the current instructions.
   * @returns The `ShapePath` instance associated with this `GraphicsPath`.
   */
  get shapePath() {
    return this._shapePath || (this._shapePath = new xf(this)), this._dirty && (this._dirty = !1, this._shapePath.buildPath()), this._shapePath;
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
  bezierCurveToShort(e, t, s, i, n) {
    const a = this.instructions[this.instructions.length - 1], o = this.getLastPoint(he.shared);
    let h = 0, c = 0;
    if (!a || a.action !== "bezierCurveTo")
      h = o.x, c = o.y;
    else {
      h = a.data[2], c = a.data[3];
      const l = o.x, u = o.y;
      h = l + (l - h), c = u + (u - c);
    }
    return this.instructions.push({ action: "bezierCurveTo", data: [h, c, e, t, s, i, n] }), this._dirty = !0, this;
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
  quadraticCurveToShort(e, t, s) {
    const i = this.instructions[this.instructions.length - 1], n = this.getLastPoint(he.shared);
    let a = 0, o = 0;
    if (!i || i.action !== "quadraticCurveTo")
      a = n.x, o = n.y;
    else {
      a = i.data[0], o = i.data[1];
      const h = n.x, c = n.y;
      a = h + (h - a), o = c + (c - o);
    }
    return this.instructions.push({ action: "quadraticCurveTo", data: [a, o, e, t, s] }), this._dirty = !0, this;
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
  rect(e, t, s, i, n) {
    return this.instructions.push({ action: "rect", data: [e, t, s, i, n] }), this._dirty = !0, this;
  }
  /**
   * Draws a circle shape. This method adds a new circle path to the current drawing.
   * @param x - The x-coordinate of the center of the circle.
   * @param y - The y-coordinate of the center of the circle.
   * @param radius - The radius of the circle.
   * @param transform - An optional `Matrix` object to apply a transformation to the circle.
   * @returns The instance of the current object for chaining.
   */
  circle(e, t, s, i) {
    return this.instructions.push({ action: "circle", data: [e, t, s, i] }), this._dirty = !0, this;
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
  star(e, t, s, i, n, a, o) {
    n || (n = i / 2);
    const h = -1 * Math.PI / 2 + a, c = s * 2, l = Math.PI * 2 / c, u = [];
    for (let d = 0; d < c; d++) {
      const f = d % 2 ? n : i, p = d * l + h;
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
    const t = new Et();
    if (t.checkForHoles = this.checkForHoles, !e)
      t.instructions = this.instructions.slice();
    else
      for (let s = 0; s < this.instructions.length; s++) {
        const i = this.instructions[s];
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
    const t = e.a, s = e.b, i = e.c, n = e.d, a = e.tx, o = e.ty;
    let h = 0, c = 0, l = 0, u = 0, d = 0, f = 0, p = 0, g = 0;
    for (let m = 0; m < this.instructions.length; m++) {
      const y = this.instructions[m], x = y.data;
      switch (y.action) {
        case "moveTo":
        case "lineTo":
          h = x[0], c = x[1], x[0] = t * h + i * c + a, x[1] = s * h + n * c + o;
          break;
        case "bezierCurveTo":
          l = x[0], u = x[1], d = x[2], f = x[3], h = x[4], c = x[5], x[0] = t * l + i * u + a, x[1] = s * l + n * u + o, x[2] = t * d + i * f + a, x[3] = s * d + n * f + o, x[4] = t * h + i * c + a, x[5] = s * h + n * c + o;
          break;
        case "quadraticCurveTo":
          l = x[0], u = x[1], h = x[2], c = x[3], x[0] = t * l + i * u + a, x[1] = s * l + n * u + o, x[2] = t * h + i * c + a, x[3] = s * h + n * c + o;
          break;
        case "arcToSvg":
          h = x[5], c = x[6], p = x[0], g = x[1], x[0] = t * p + i * g, x[1] = s * p + n * g, x[5] = t * h + i * c + a, x[6] = s * h + n * c + o;
          break;
        case "circle":
          x[4] = Nt(x[3], e);
          break;
        case "rect":
          x[4] = Nt(x[4], e);
          break;
        case "ellipse":
          x[8] = Nt(x[8], e);
          break;
        case "roundRect":
          x[5] = Nt(x[5], e);
          break;
        case "addPath":
          x[0].transform(e);
          break;
        case "poly":
          x[2] = Nt(x[2], e);
          break;
        default:
          $("unknown transform action", y.action);
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
    let t = this.instructions.length - 1, s = this.instructions[t];
    if (!s)
      return e.x = 0, e.y = 0, e;
    for (; s.action === "closePath"; ) {
      if (t--, t < 0)
        return e.x = 0, e.y = 0, e;
      s = this.instructions[t];
    }
    switch (s.action) {
      case "moveTo":
      case "lineTo":
        e.x = s.data[0], e.y = s.data[1];
        break;
      case "quadraticCurveTo":
        e.x = s.data[2], e.y = s.data[3];
        break;
      case "bezierCurveTo":
        e.x = s.data[4], e.y = s.data[5];
        break;
      case "arc":
      case "arcToSvg":
        e.x = s.data[5], e.y = s.data[6];
        break;
      case "addPath":
        s.data[0].getLastPoint(e);
        break;
    }
    return e;
  }
}
function Nt(r, e) {
  return r ? r.prepend(e) : e.clone();
}
function de(r, e, t) {
  const s = r.getAttribute(e);
  return s ? Number(s) : t;
}
function yf(r, e) {
  const t = r.querySelectorAll("defs");
  for (let s = 0; s < t.length; s++) {
    const i = t[s];
    for (let n = 0; n < i.children.length; n++) {
      const a = i.children[n];
      switch (a.nodeName.toLowerCase()) {
        case "lineargradient":
          e.defs[a.id] = bf(a);
          break;
        case "radialgradient":
          e.defs[a.id] = vf();
          break;
      }
    }
  }
}
function bf(r) {
  const e = de(r, "x1", 0), t = de(r, "y1", 0), s = de(r, "x2", 1), i = de(r, "y2", 0), n = r.getAttribute("gradientUnits") || "objectBoundingBox", a = new nt(
    e,
    t,
    s,
    i,
    n === "objectBoundingBox" ? "local" : "global"
  );
  for (let o = 0; o < r.children.length; o++) {
    const h = r.children[o], c = de(h, "offset", 0), l = ae.shared.setValue(h.getAttribute("stop-color")).toNumber();
    a.addColorStop(c, l);
  }
  return a;
}
function vf(r) {
  return $("[SVG Parser] Radial gradients are not yet supported"), new nt(0, 0, 1, 0);
}
function ha(r) {
  const e = r.match(/url\s*\(\s*['"]?\s*#([^'"\s)]+)\s*['"]?\s*\)/i);
  return e ? e[1] : "";
}
const ca = {
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
function ah(r, e) {
  const t = r.getAttribute("style"), s = {}, i = {}, n = {
    strokeStyle: s,
    fillStyle: i,
    useFill: !1,
    useStroke: !1
  };
  for (const a in ca) {
    const o = r.getAttribute(a);
    o && la(e, n, a, o.trim());
  }
  if (t) {
    const a = t.split(";");
    for (let o = 0; o < a.length; o++) {
      const h = a[o].trim(), [c, l] = h.split(":");
      ca[c] && la(e, n, c, l.trim());
    }
  }
  return {
    strokeStyle: n.useStroke ? s : null,
    fillStyle: n.useFill ? i : null,
    useFill: n.useFill,
    useStroke: n.useStroke
  };
}
function la(r, e, t, s) {
  switch (t) {
    case "stroke":
      if (s !== "none") {
        if (s.startsWith("url(")) {
          const i = ha(s);
          e.strokeStyle.fill = r.defs[i];
        } else
          e.strokeStyle.color = ae.shared.setValue(s).toNumber();
        e.useStroke = !0;
      }
      break;
    case "stroke-width":
      e.strokeStyle.width = Number(s);
      break;
    case "fill":
      if (s !== "none") {
        if (s.startsWith("url(")) {
          const i = ha(s);
          e.fillStyle.fill = r.defs[i];
        } else
          e.fillStyle.color = ae.shared.setValue(s).toNumber();
        e.useFill = !0;
      }
      break;
    case "fill-opacity":
      e.fillStyle.alpha = Number(s);
      break;
    case "stroke-opacity":
      e.strokeStyle.alpha = Number(s);
      break;
    case "opacity":
      e.fillStyle.alpha = Number(s), e.strokeStyle.alpha = Number(s);
      break;
  }
}
function Tf(r, e) {
  if (typeof r == "string") {
    const a = document.createElement("div");
    a.innerHTML = r.trim(), r = a.querySelector("svg");
  }
  const t = {
    context: e,
    defs: {},
    path: new Et()
  };
  yf(r, t);
  const s = r.children, { fillStyle: i, strokeStyle: n } = ah(r, t);
  for (let a = 0; a < s.length; a++) {
    const o = s[a];
    o.nodeName.toLowerCase() !== "defs" && oh(o, t, i, n);
  }
  return e;
}
function oh(r, e, t, s) {
  const i = r.children, { fillStyle: n, strokeStyle: a } = ah(r, e);
  n && t ? t = { ...t, ...n } : n && (t = n), a && s ? s = { ...s, ...a } : a && (s = a);
  const o = !t && !s;
  o && (t = { color: 0 });
  let h, c, l, u, d, f, p, g, m, y, x, v, A, M, w, C, F;
  switch (r.nodeName.toLowerCase()) {
    case "path":
      M = r.getAttribute("d"), r.getAttribute("fill-rule") === "evenodd" && $("SVG Evenodd fill rule not supported, your svg may render incorrectly"), w = new Et(M, !0), e.context.path(w), t && e.context.fill(t), s && e.context.stroke(s);
      break;
    case "circle":
      p = de(r, "cx", 0), g = de(r, "cy", 0), m = de(r, "r", 0), e.context.ellipse(p, g, m, m), t && e.context.fill(t), s && e.context.stroke(s);
      break;
    case "rect":
      h = de(r, "x", 0), c = de(r, "y", 0), C = de(r, "width", 0), F = de(r, "height", 0), y = de(r, "rx", 0), x = de(r, "ry", 0), y || x ? e.context.roundRect(h, c, C, F, y || x) : e.context.rect(h, c, C, F), t && e.context.fill(t), s && e.context.stroke(s);
      break;
    case "ellipse":
      p = de(r, "cx", 0), g = de(r, "cy", 0), y = de(r, "rx", 0), x = de(r, "ry", 0), e.context.beginPath(), e.context.ellipse(p, g, y, x), t && e.context.fill(t), s && e.context.stroke(s);
      break;
    case "line":
      l = de(r, "x1", 0), u = de(r, "y1", 0), d = de(r, "x2", 0), f = de(r, "y2", 0), e.context.beginPath(), e.context.moveTo(l, u), e.context.lineTo(d, f), s && e.context.stroke(s);
      break;
    case "polygon":
      A = r.getAttribute("points"), v = A.match(/\d+/g).map((D) => parseInt(D, 10)), e.context.poly(v, !0), t && e.context.fill(t), s && e.context.stroke(s);
      break;
    case "polyline":
      A = r.getAttribute("points"), v = A.match(/\d+/g).map((D) => parseInt(D, 10)), e.context.poly(v, !1), s && e.context.stroke(s);
      break;
    case "g":
    case "svg":
      break;
    default: {
      $(`[SVG parser] <${r.nodeName}> elements unsupported`);
      break;
    }
  }
  o && (t = null);
  for (let D = 0; D < i.length; D++)
    oh(i[D], e, t, s);
}
function Sf(r) {
  return ae.isColorLike(r);
}
function ua(r) {
  return r instanceof Ks;
}
function da(r) {
  return r instanceof nt;
}
function wf(r) {
  return r instanceof H;
}
function Af(r, e, t) {
  const s = ae.shared.setValue(e ?? 0);
  return r.color = s.toNumber(), r.alpha = s.alpha === 1 ? t.alpha : s.alpha, r.texture = H.WHITE, { ...t, ...r };
}
function Cf(r, e, t) {
  return r.texture = e, { ...t, ...r };
}
function fa(r, e, t) {
  return r.fill = e, r.color = 16777215, r.texture = e.texture, r.matrix = e.transform, { ...t, ...r };
}
function pa(r, e, t) {
  return e.buildGradient(), r.fill = e, r.color = 16777215, r.texture = e.texture, r.matrix = e.transform, r.textureSpace = e.textureSpace, { ...t, ...r };
}
function Pf(r, e) {
  const t = { ...e, ...r }, s = ae.shared.setValue(t.color);
  return t.alpha *= s.alpha, t.color = s.toNumber(), t;
}
function ft(r, e) {
  if (r == null)
    return null;
  const t = {}, s = r;
  return Sf(r) ? Af(t, r, e) : wf(r) ? Cf(t, r, e) : ua(r) ? fa(t, r, e) : da(r) ? pa(t, r, e) : s.fill && ua(s.fill) ? fa(s, s.fill, e) : s.fill && da(s.fill) ? pa(s, s.fill, e) : Pf(s, e);
}
function Hs(r, e) {
  const { width: t, alignment: s, miterLimit: i, cap: n, join: a, pixelLine: o, ...h } = e, c = ft(r, h);
  return c ? {
    width: t,
    alignment: s,
    miterLimit: i,
    cap: n,
    join: a,
    pixelLine: o,
    ...c
  } : null;
}
const Ef = new he(), ma = new z(), Oi = class ze extends Be {
  constructor() {
    super(...arguments), this.uid = le("graphicsContext"), this.dirty = !0, this.batchMode = "auto", this.instructions = [], this._activePath = new Et(), this._transform = new z(), this._fillStyle = { ...ze.defaultFillStyle }, this._strokeStyle = { ...ze.defaultStrokeStyle }, this._stateStack = [], this._tick = 0, this._bounds = new ye(), this._boundsDirty = !0;
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
    this._fillStyle = ft(e, ze.defaultFillStyle);
  }
  /**
   * The current stroke style of the graphics context. Similar to fill styles, stroke styles can encompass colors, gradients, patterns, or more detailed configurations via a StrokeStyle object.
   */
  get strokeStyle() {
    return this._strokeStyle;
  }
  set strokeStyle(e) {
    this._strokeStyle = Hs(e, ze.defaultStrokeStyle);
  }
  /**
   * Sets the current fill style of the graphics context. The fill style can be a color, gradient,
   * pattern, or a more complex style defined by a FillStyle object.
   * @param style - The fill style to apply. This can be a simple color, a gradient or pattern object,
   *                or a FillStyle or ConvertedFillStyle object.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  setFillStyle(e) {
    return this._fillStyle = ft(e, ze.defaultFillStyle), this;
  }
  /**
   * Sets the current stroke style of the graphics context. Similar to fill styles, stroke styles can
   * encompass colors, gradients, patterns, or more detailed configurations via a StrokeStyle object.
   * @param style - The stroke style to apply. Can be defined as a color, a gradient or pattern,
   *                or a StrokeStyle or ConvertedStrokeStyle object.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  setStrokeStyle(e) {
    return this._strokeStyle = ft(e, ze.defaultStrokeStyle), this;
  }
  texture(e, t, s, i, n, a) {
    return this.instructions.push({
      action: "texture",
      data: {
        image: e,
        dx: s || 0,
        dy: i || 0,
        dw: n || e.frame.width,
        dh: a || e.frame.height,
        transform: this._transform.clone(),
        alpha: this._fillStyle.alpha,
        style: t ? ae.shared.setValue(t).toNumber() : 16777215
      }
    }), this.onUpdate(), this;
  }
  /**
   * Resets the current path. Any previous path and its commands are discarded and a new path is
   * started. This is typically called before beginning a new shape or series of drawing commands.
   * @returns The instance of the current GraphicsContext for method chaining.
   */
  beginPath() {
    return this._activePath = new Et(), this;
  }
  fill(e, t) {
    let s;
    const i = this.instructions[this.instructions.length - 1];
    return this._tick === 0 && i && i.action === "stroke" ? s = i.data.path : s = this._activePath.clone(), s ? (e != null && (t !== void 0 && typeof e == "number" && (j(q, "GraphicsContext.fill(color, alpha) is deprecated, use GraphicsContext.fill({ color, alpha }) instead"), e = { color: e, alpha: t }), this._fillStyle = ft(e, ze.defaultFillStyle)), this.instructions.push({
      action: "fill",
      // TODO copy fill style!
      data: { style: this.fillStyle, path: s }
    }), this.onUpdate(), this._initNextPathLocation(), this._tick = 0, this) : this;
  }
  _initNextPathLocation() {
    const { x: e, y: t } = this._activePath.getLastPoint(he.shared);
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
    const s = this.instructions[this.instructions.length - 1];
    return this._tick === 0 && s && s.action === "fill" ? t = s.data.path : t = this._activePath.clone(), t ? (e != null && (this._strokeStyle = Hs(e, ze.defaultStrokeStyle)), this.instructions.push({
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
      const t = this.instructions[this.instructions.length - 1 - e], s = this._activePath.clone();
      if (t && (t.action === "stroke" || t.action === "fill"))
        if (t.data.hole)
          t.data.hole.addPath(s);
        else {
          t.data.hole = s;
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
  arc(e, t, s, i, n, a) {
    this._tick++;
    const o = this._transform;
    return this._activePath.arc(
      o.a * e + o.c * t + o.tx,
      o.b * e + o.d * t + o.ty,
      s,
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
  arcTo(e, t, s, i, n) {
    this._tick++;
    const a = this._transform;
    return this._activePath.arcTo(
      a.a * e + a.c * t + a.tx,
      a.b * e + a.d * t + a.ty,
      a.a * s + a.c * i + a.tx,
      a.b * s + a.d * i + a.ty,
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
  arcToSvg(e, t, s, i, n, a, o) {
    this._tick++;
    const h = this._transform;
    return this._activePath.arcToSvg(
      e,
      t,
      s,
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
  bezierCurveTo(e, t, s, i, n, a, o) {
    this._tick++;
    const h = this._transform;
    return this._activePath.bezierCurveTo(
      h.a * e + h.c * t + h.tx,
      h.b * e + h.d * t + h.ty,
      h.a * s + h.c * i + h.tx,
      h.b * s + h.d * i + h.ty,
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
  ellipse(e, t, s, i) {
    return this._tick++, this._activePath.ellipse(e, t, s, i, this._transform.clone()), this;
  }
  /**
   * Draws a circle shape. This method adds a new circle path to the current drawing.
   * @param x - The x-coordinate of the center of the circle.
   * @param y - The y-coordinate of the center of the circle.
   * @param radius - The radius of the circle.
   * @returns The instance of the current object for chaining.
   */
  circle(e, t, s) {
    return this._tick++, this._activePath.circle(e, t, s, this._transform.clone()), this;
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
    const s = this._transform;
    return this._activePath.lineTo(
      s.a * e + s.c * t + s.tx,
      s.b * e + s.d * t + s.ty
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
    const s = this._transform, i = this._activePath.instructions, n = s.a * e + s.c * t + s.tx, a = s.b * e + s.d * t + s.ty;
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
  quadraticCurveTo(e, t, s, i, n) {
    this._tick++;
    const a = this._transform;
    return this._activePath.quadraticCurveTo(
      a.a * e + a.c * t + a.tx,
      a.b * e + a.d * t + a.ty,
      a.a * s + a.c * i + a.tx,
      a.b * s + a.d * i + a.ty,
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
  rect(e, t, s, i) {
    return this._tick++, this._activePath.rect(e, t, s, i, this._transform.clone()), this;
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
  roundRect(e, t, s, i, n) {
    return this._tick++, this._activePath.roundRect(e, t, s, i, n, this._transform.clone()), this;
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
  regularPoly(e, t, s, i, n = 0, a) {
    return this._tick++, this._activePath.regularPoly(e, t, s, i, n, a), this;
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
  roundPoly(e, t, s, i, n, a) {
    return this._tick++, this._activePath.roundPoly(e, t, s, i, n, a), this;
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
  roundShape(e, t, s, i) {
    return this._tick++, this._activePath.roundShape(e, t, s, i), this;
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
  filletRect(e, t, s, i, n) {
    return this._tick++, this._activePath.filletRect(e, t, s, i, n), this;
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
  chamferRect(e, t, s, i, n, a) {
    return this._tick++, this._activePath.chamferRect(e, t, s, i, n, a), this;
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
  star(e, t, s, i, n = 0, a = 0) {
    return this._tick++, this._activePath.star(e, t, s, i, n, a, this._transform.clone()), this;
  }
  /**
   * Parses and renders an SVG string into the graphics context. This allows for complex shapes and paths
   * defined in SVG format to be drawn within the graphics context.
   * @param svg - The SVG string to be parsed and rendered.
   */
  svg(e) {
    return this._tick++, Tf(e, this), this;
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
  setTransform(e, t, s, i, n, a) {
    return e instanceof z ? (this._transform.set(e.a, e.b, e.c, e.d, e.tx, e.ty), this) : (this._transform.set(e, t, s, i, n, a), this);
  }
  transform(e, t, s, i, n, a) {
    return e instanceof z ? (this._transform.append(e), this) : (ma.set(e, t, s, i, n, a), this._transform.append(ma), this);
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
      const s = this.instructions[t], i = s.action;
      if (i === "fill") {
        const n = s.data;
        e.addBounds(n.path.bounds);
      } else if (i === "texture") {
        const n = s.data;
        e.addFrame(n.dx, n.dy, n.dx + n.dw, n.dy + n.dh, n.transform);
      }
      if (i === "stroke") {
        const n = s.data, a = n.style.alignment, o = n.style.width * (1 - a), h = n.path.bounds;
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
    let s = !1;
    for (let n = 0; n < t.length; n++) {
      const a = t[n], o = a.data, h = o.path;
      if (!a.action || !h)
        continue;
      const c = o.style, l = h.shapePath.shapePrimitives;
      for (let u = 0; u < l.length; u++) {
        const d = l[u].shape;
        if (!c || !d)
          continue;
        const f = l[u].transform, p = f ? f.applyInverse(e, Ef) : e;
        if (a.action === "fill")
          s = d.contains(p.x, p.y);
        else {
          const m = c;
          s = d.strokeContains(p.x, p.y, m.width, m.alignment);
        }
        const g = o.hole;
        if (g) {
          const m = (i = g.shapePath) == null ? void 0 : i.shapePrimitives;
          if (m)
            for (let y = 0; y < m.length; y++)
              m[y].shape.contains(p.x, p.y) && (s = !1);
        }
        if (s)
          return !0;
      }
    }
    return s;
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
      const s = typeof e == "boolean" ? e : e == null ? void 0 : e.textureSource;
      this._fillStyle.texture && this._fillStyle.texture.destroy(s), this._strokeStyle.texture && this._strokeStyle.texture.destroy(s);
    }
    this._fillStyle = null, this._strokeStyle = null, this.instructions = null, this._activePath = null, this._bounds = null, this._stateStack = null, this.customShader = null, this._transform = null;
  }
};
Oi.defaultFillStyle = {
  /** The color to use for the fill. */
  color: 16777215,
  /** The alpha value to use for the fill. */
  alpha: 1,
  /** The texture to use for the fill. */
  texture: H.WHITE,
  /** The matrix to apply. */
  matrix: null,
  /** The fill pattern to use. */
  fill: null,
  /** Whether coordinates are 'global' or 'local' */
  textureSpace: "local"
};
Oi.defaultStrokeStyle = {
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
  texture: H.WHITE,
  /** The matrix to apply. */
  matrix: null,
  /** The fill pattern to use. */
  fill: null,
  /** Whether coordinates are 'global' or 'local' */
  textureSpace: "local",
  /** If the stroke is a pixel line. */
  pixelLine: !1
};
let Re = Oi;
const ga = [
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
function hh(r) {
  const e = [];
  let t = 0;
  for (let s = 0; s < ga.length; s++) {
    const i = `_${ga[s]}`;
    e[t++] = r[i];
  }
  return t = ch(r._fill, e, t), t = Mf(r._stroke, e, t), t = Bf(r.dropShadow, e, t), e.join("-");
}
function ch(r, e, t) {
  var s;
  return r && (e[t++] = r.color, e[t++] = r.alpha, e[t++] = (s = r.fill) == null ? void 0 : s.styleKey), t;
}
function Mf(r, e, t) {
  return r && (t = ch(r, e, t), e[t++] = r.width, e[t++] = r.alignment, e[t++] = r.cap, e[t++] = r.join, e[t++] = r.miterLimit), t;
}
function Bf(r, e, t) {
  return r && (e[t++] = r.alpha, e[t++] = r.angle, e[t++] = r.blur, e[t++] = r.distance, e[t++] = ae.shared.setValue(r.color).toNumber()), t;
}
const Li = class Tt extends Be {
  constructor(e = {}) {
    super(), Rf(e);
    const t = { ...Tt.defaultTextStyle, ...e };
    for (const s in t) {
      const i = s;
      this[i] = t[s];
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
    e !== null && typeof e == "object" ? this._dropShadow = this._createProxy({ ...Tt.defaultDropShadow, ...e }) : this._dropShadow = e ? this._createProxy({ ...Tt.defaultDropShadow }) : null, this.update();
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
    e !== this._originalFill && (this._originalFill = e, this._isFillStyle(e) && (this._originalFill = this._createProxy({ ...Re.defaultFillStyle, ...e }, () => {
      this._fill = ft(
        { ...this._originalFill },
        Re.defaultFillStyle
      );
    })), this._fill = ft(
      e === 0 ? "black" : e,
      Re.defaultFillStyle
    ), this.update());
  }
  /** A fillstyle that will be used on the text stroke, e.g., 'blue', '#FCFF00'. */
  get stroke() {
    return this._originalStroke;
  }
  set stroke(e) {
    e !== this._originalStroke && (this._originalStroke = e, this._isFillStyle(e) && (this._originalStroke = this._createProxy({ ...Re.defaultStrokeStyle, ...e }, () => {
      this._stroke = Hs(
        { ...this._originalStroke },
        Re.defaultStrokeStyle
      );
    })), this._stroke = Hs(e, Re.defaultStrokeStyle), this.update());
  }
  _generateKey() {
    return this._styleKey = hh(this), this._styleKey;
  }
  update() {
    this._styleKey = null, this.emit("update", this);
  }
  /** Resets all properties to the default values */
  reset() {
    const e = Tt.defaultTextStyle;
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
    return new Tt({
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
    var s, i, n, a;
    if (this.removeAllListeners(), typeof e == "boolean" ? e : e == null ? void 0 : e.texture) {
      const o = typeof e == "boolean" ? e : e == null ? void 0 : e.textureSource;
      (s = this._fill) != null && s.texture && this._fill.texture.destroy(o), (i = this._originalFill) != null && i.texture && this._originalFill.texture.destroy(o), (n = this._stroke) != null && n.texture && this._stroke.texture.destroy(o), (a = this._originalStroke) != null && a.texture && this._originalStroke.texture.destroy(o);
    }
    this._fill = null, this._stroke = null, this.dropShadow = null, this._originalStroke = null, this._originalFill = null;
  }
  _createProxy(e, t) {
    return new Proxy(e, {
      set: (s, i, n) => (s[i] = n, t == null || t(i, n), this.update(), !0)
    });
  }
  _isFillStyle(e) {
    return (e ?? null) !== null && !(ae.isColorLike(e) || e instanceof nt || e instanceof Ks);
  }
};
Li.defaultDropShadow = {
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
Li.defaultTextStyle = {
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
let Je = Li;
function Rf(r) {
  const e = r;
  if (typeof e.dropShadow == "boolean" && e.dropShadow) {
    const t = Je.defaultDropShadow;
    r.dropShadow = {
      alpha: e.dropShadowAlpha ?? t.alpha,
      angle: e.dropShadowAngle ?? t.angle,
      blur: e.dropShadowBlur ?? t.blur,
      color: e.dropShadowColor ?? t.color,
      distance: e.dropShadowDistance ?? t.distance
    };
  }
  if (e.strokeThickness !== void 0) {
    j(q, "strokeThickness is now a part of stroke");
    const t = e.stroke;
    let s = {};
    if (ae.isColorLike(t))
      s.color = t;
    else if (t instanceof nt || t instanceof Ks)
      s.fill = t;
    else if (Object.hasOwnProperty.call(t, "color") || Object.hasOwnProperty.call(t, "fill"))
      s = t;
    else
      throw new Error("Invalid stroke value.");
    r.stroke = {
      ...s,
      width: e.strokeThickness
    };
  }
  if (Array.isArray(e.fillGradientStops)) {
    j(q, "gradient fill is now a fill pattern: `new FillGradient(...)`");
    let t;
    r.fontSize == null ? r.fontSize = Je.defaultTextStyle.fontSize : typeof r.fontSize == "string" ? t = parseInt(r.fontSize, 10) : t = r.fontSize;
    const s = new nt({
      start: { x: 0, y: 0 },
      end: { x: 0, y: (t || 0) * 1.7 }
    }), i = e.fillGradientStops.map((n) => ae.shared.setValue(n).toNumber());
    i.forEach((n, a) => {
      const o = a / (i.length - 1);
      s.addColorStop(o, n);
    }), r.fill = {
      fill: s
    };
  }
}
class kf {
  constructor(e) {
    this._canvasPool = /* @__PURE__ */ Object.create(null), this.canvasOptions = e || {}, this.enableFullScreen = !1;
  }
  /**
   * Creates texture with params that were specified in pool constructor.
   * @param pixelWidth - Width of texture in pixels.
   * @param pixelHeight - Height of texture in pixels.
   */
  _createCanvasAndContext(e, t) {
    const s = J.get().createCanvas();
    s.width = e, s.height = t;
    const i = s.getContext("2d");
    return { canvas: s, context: i };
  }
  /**
   * Gets a Power-of-Two render texture or fullScreen texture
   * @param minWidth - The minimum width of the render texture.
   * @param minHeight - The minimum height of the render texture.
   * @param resolution - The resolution of the render texture.
   * @returns The new render texture.
   */
  getOptimalCanvasAndContext(e, t, s = 1) {
    e = Math.ceil(e * s - 1e-6), t = Math.ceil(t * s - 1e-6), e = Ct(e), t = Ct(t);
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
    const t = e.canvas, { width: s, height: i } = t, n = (s << 17) + (i << 1);
    e.context.clearRect(0, 0, s, i), this._canvasPool[n].push(e);
  }
  clear() {
    this._canvasPool = {};
  }
}
const Qe = new kf(), If = [
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui"
];
function Ws(r) {
  const e = typeof r.fontSize == "number" ? `${r.fontSize}px` : r.fontSize;
  let t = r.fontFamily;
  Array.isArray(r.fontFamily) || (t = r.fontFamily.split(","));
  for (let s = t.length - 1; s >= 0; s--) {
    let i = t[s].trim();
    !/([\"\'])[^\'\"]+\1/.test(i) && !If.includes(i) && (i = `"${i}"`), t[s] = i;
  }
  return `${r.fontStyle} ${r.fontVariant} ${r.fontWeight} ${e} ${t.join(",")}`;
}
const Br = {
  // TextMetrics requires getImageData readback for measuring fonts.
  willReadFrequently: !0
}, Le = class W {
  /**
   * Checking that we can use modern canvas 2D API.
   *
   * Note: This is an unstable API, Chrome < 94 use `textLetterSpacing`, later versions use `letterSpacing`.
   * @see TextMetrics.experimentalLetterSpacing
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ICanvasRenderingContext2D/letterSpacing
   * @see https://developer.chrome.com/origintrials/#/view_trial/3585991203293757441
   */
  static get experimentalLetterSpacingSupported() {
    let e = W._experimentalLetterSpacingSupported;
    if (e !== void 0) {
      const t = J.get().getCanvasRenderingContext2D().prototype;
      e = W._experimentalLetterSpacingSupported = "letterSpacing" in t || "textLetterSpacing" in t;
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
  constructor(e, t, s, i, n, a, o, h, c) {
    this.text = e, this.style = t, this.width = s, this.height = i, this.lines = n, this.lineWidths = a, this.lineHeight = o, this.maxLineWidth = h, this.fontProperties = c;
  }
  /**
   * Measures the supplied string of text and returns a Rectangle.
   * @param text - The text to measure.
   * @param style - The text style to use for measuring
   * @param canvas - optional specification of the canvas to use for measuring.
   * @param wordWrap
   * @returns Measured width and height of the text.
   */
  static measureText(e = " ", t, s = W._canvas, i = t.wordWrap) {
    var x;
    const n = `${e}:${t.styleKey}`;
    if (W._measurementCache[n])
      return W._measurementCache[n];
    const a = Ws(t), o = W.measureFont(a);
    o.fontSize === 0 && (o.fontSize = t.fontSize, o.ascent = t.fontSize);
    const h = W.__context;
    h.font = a;
    const l = (i ? W._wordWrap(e, t, s) : e).split(/(?:\r\n|\r|\n)/), u = new Array(l.length);
    let d = 0;
    for (let v = 0; v < l.length; v++) {
      const A = W._measureText(l[v], t.letterSpacing, h);
      u[v] = A, d = Math.max(d, A);
    }
    const f = ((x = t._stroke) == null ? void 0 : x.width) || 0;
    let p = d + f;
    t.dropShadow && (p += t.dropShadow.distance);
    const g = t.lineHeight || o.fontSize;
    let m = Math.max(g, o.fontSize + f) + (l.length - 1) * (g + t.leading);
    return t.dropShadow && (m += t.dropShadow.distance), new W(
      e,
      t,
      p,
      m,
      l,
      u,
      g + t.leading,
      d,
      o
    );
  }
  static _measureText(e, t, s) {
    let i = !1;
    W.experimentalLetterSpacingSupported && (W.experimentalLetterSpacing ? (s.letterSpacing = `${t}px`, s.textLetterSpacing = `${t}px`, i = !0) : (s.letterSpacing = "0px", s.textLetterSpacing = "0px"));
    const n = s.measureText(e);
    let a = n.width;
    const o = -n.actualBoundingBoxLeft;
    let c = n.actualBoundingBoxRight - o;
    if (a > 0)
      if (i)
        a -= t, c -= t;
      else {
        const l = (W.graphemeSegmenter(e).length - 1) * t;
        a += l, c += l;
      }
    return Math.max(a, c);
  }
  /**
   * Applies newlines to a string to have it optimally fit into the horizontal
   * bounds set by the Text object's wordWrapWidth property.
   * @param text - String to apply word wrapping to
   * @param style - the style to use when wrapping
   * @param canvas - optional specification of the canvas to use for measuring.
   * @returns New string with new lines applied where required
   */
  static _wordWrap(e, t, s = W._canvas) {
    const i = s.getContext("2d", Br);
    let n = 0, a = "", o = "";
    const h = /* @__PURE__ */ Object.create(null), { letterSpacing: c, whiteSpace: l } = t, u = W._collapseSpaces(l), d = W._collapseNewlines(l);
    let f = !u;
    const p = t.wordWrapWidth + c, g = W._tokenize(e);
    for (let m = 0; m < g.length; m++) {
      let y = g[m];
      if (W._isNewline(y)) {
        if (!d) {
          o += W._addLine(a), f = !u, a = "", n = 0;
          continue;
        }
        y = " ";
      }
      if (u) {
        const v = W.isBreakingSpace(y), A = W.isBreakingSpace(a[a.length - 1]);
        if (v && A)
          continue;
      }
      const x = W._getFromCache(y, c, h, i);
      if (x > p)
        if (a !== "" && (o += W._addLine(a), a = "", n = 0), W.canBreakWords(y, t.breakWords)) {
          const v = W.wordWrapSplit(y);
          for (let A = 0; A < v.length; A++) {
            let M = v[A], w = M, C = 1;
            for (; v[A + C]; ) {
              const D = v[A + C];
              if (!W.canBreakChars(w, D, y, A, t.breakWords))
                M += D;
              else
                break;
              w = D, C++;
            }
            A += C - 1;
            const F = W._getFromCache(M, c, h, i);
            F + n > p && (o += W._addLine(a), f = !1, a = "", n = 0), a += M, n += F;
          }
        } else {
          a.length > 0 && (o += W._addLine(a), a = "", n = 0);
          const v = m === g.length - 1;
          o += W._addLine(y, !v), f = !1, a = "", n = 0;
        }
      else
        x + n > p && (f = !1, o += W._addLine(a), a = "", n = 0), (a.length > 0 || !W.isBreakingSpace(y) || f) && (a += y, n += x);
    }
    return o += W._addLine(a, !1), o;
  }
  /**
   * Convenience function for logging each line added during the wordWrap method.
   * @param line    - The line of text to add
   * @param newLine - Add new line character to end
   * @returns A formatted line
   */
  static _addLine(e, t = !0) {
    return e = W._trimRight(e), e = t ? `${e}
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
  static _getFromCache(e, t, s, i) {
    let n = s[e];
    return typeof n != "number" && (n = W._measureText(e, t, i) + t, s[e] = n), n;
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
      const s = e[t];
      if (!W.isBreakingSpace(s))
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
    return typeof e != "string" ? !1 : W._newlines.includes(e.charCodeAt(0));
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
    return typeof e != "string" ? !1 : W._breakingSpaces.includes(e.charCodeAt(0));
  }
  /**
   * Splits a string into words, breaking-spaces and newLine characters
   * @param text - The text
   * @returns A tokenized array
   */
  static _tokenize(e) {
    const t = [];
    let s = "";
    if (typeof e != "string")
      return t;
    for (let i = 0; i < e.length; i++) {
      const n = e[i], a = e[i + 1];
      if (W.isBreakingSpace(n, a) || W._isNewline(n)) {
        s !== "" && (t.push(s), s = ""), t.push(n);
        continue;
      }
      s += n;
    }
    return s !== "" && t.push(s), t;
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
  static canBreakChars(e, t, s, i, n) {
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
    return W.graphemeSegmenter(e);
  }
  /**
   * Calculates the ascent, descent and fontSize of a given font-style
   * @param font - String representing the style of the font
   * @returns Font properties object
   */
  static measureFont(e) {
    if (W._fonts[e])
      return W._fonts[e];
    const t = W._context;
    t.font = e;
    const s = t.measureText(W.METRICS_STRING + W.BASELINE_SYMBOL), i = {
      ascent: s.actualBoundingBoxAscent,
      descent: s.actualBoundingBoxDescent,
      fontSize: s.actualBoundingBoxAscent + s.actualBoundingBoxDescent
    };
    return W._fonts[e] = i, i;
  }
  /**
   * Clear font metrics in metrics cache.
   * @param {string} [font] - font name. If font name not set then clear cache for all fonts.
   */
  static clearMetrics(e = "") {
    e ? delete W._fonts[e] : W._fonts = {};
  }
  /**
   * Cached canvas element for measuring text
   * TODO: this should be private, but isn't because of backward compat, will fix later.
   * @ignore
   */
  static get _canvas() {
    if (!W.__canvas) {
      let e;
      try {
        const t = new OffscreenCanvas(0, 0), s = t.getContext("2d", Br);
        if (s != null && s.measureText)
          return W.__canvas = t, t;
        e = J.get().createCanvas();
      } catch {
        e = J.get().createCanvas();
      }
      e.width = e.height = 10, W.__canvas = e;
    }
    return W.__canvas;
  }
  /**
   * TODO: this should be private, but isn't because of backward compat, will fix later.
   * @ignore
   */
  static get _context() {
    return W.__context || (W.__context = W._canvas.getContext("2d", Br)), W.__context;
  }
};
Le.METRICS_STRING = "|ÉqÅ";
Le.BASELINE_SYMBOL = "M";
Le.BASELINE_MULTIPLIER = 1.4;
Le.HEIGHT_MULTIPLIER = 2;
Le.graphemeSegmenter = (() => {
  if (typeof (Intl == null ? void 0 : Intl.Segmenter) == "function") {
    const r = new Intl.Segmenter();
    return (e) => [...r.segment(e)].map((t) => t.segment);
  }
  return (r) => [...r];
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
let Ye = Le;
const _a = 1e5;
function zs(r, e, t, s = 0) {
  if (r.texture === H.WHITE && !r.fill)
    return ae.shared.setValue(r.color).setAlpha(r.alpha ?? 1).toHexa();
  if (r.fill) {
    if (r.fill instanceof Ks) {
      const i = r.fill, n = e.createPattern(i.texture.source.resource, "repeat"), a = i.transform.copyTo(z.shared);
      return a.scale(
        i.texture.frame.width,
        i.texture.frame.height
      ), n.setTransform(a), n;
    } else if (r.fill instanceof nt) {
      const i = r.fill, n = i.type === "linear", a = i.textureSpace === "local";
      let o = 1, h = 1;
      a && t && (o = t.width + s, h = t.height + s);
      let c, l = !1;
      if (n) {
        const { start: u, end: d } = i;
        c = e.createLinearGradient(
          u.x * o,
          u.y * h,
          d.x * o,
          d.y * h
        ), l = Math.abs(d.x - u.x) < Math.abs((d.y - u.y) * 0.1);
      } else {
        const { center: u, innerRadius: d, outerCenter: f, outerRadius: p } = i;
        c = e.createRadialGradient(
          u.x * o,
          u.y * h,
          d * o,
          f.x * o,
          f.y * h,
          p * o
        );
      }
      if (l && a && t) {
        const u = t.lineHeight / h;
        for (let d = 0; d < t.lines.length; d++) {
          const f = (d * t.lineHeight + s / 2) / h;
          i.colorStops.forEach((p) => {
            const g = f + p.offset * u;
            c.addColorStop(
              // fix to 5 decimal places to avoid floating point precision issues
              Math.floor(g * _a) / _a,
              ae.shared.setValue(p.color).toHex()
            );
          });
        }
      } else
        i.colorStops.forEach((u) => {
          c.addColorStop(u.offset, ae.shared.setValue(u.color).toHex());
        });
      return c;
    }
  } else {
    const i = e.createPattern(r.texture.source.resource, "repeat"), n = r.matrix.copyTo(z.shared);
    return n.scale(r.texture.frame.width, r.texture.frame.height), i.setTransform(n), i;
  }
  return $("FillStyle not recognised", r), "red";
}
function lh(r) {
  if (r === "")
    return [];
  typeof r == "string" && (r = [r]);
  const e = [];
  for (let t = 0, s = r.length; t < s; t++) {
    const i = r[t];
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
const uh = class dh extends Xo {
  /**
   * @param options - The options for the dynamic bitmap font.
   */
  constructor(e) {
    super(), this.resolution = 1, this.pages = [], this._padding = 0, this._measureCache = /* @__PURE__ */ Object.create(null), this._currentChars = [], this._currentX = 0, this._currentY = 0, this._currentPageIndex = -1, this._skipKerning = !1;
    const t = { ...dh.defaultOptions, ...e };
    this._textureSize = t.textureSize, this._mipmap = t.mipmap;
    const s = t.style.clone();
    t.overrideFill && (s._fill.color = 16777215, s._fill.alpha = 1, s._fill.texture = H.WHITE, s._fill.fill = null), this.applyFillAsTint = t.overrideFill;
    const i = s.fontSize;
    s.fontSize = this.baseMeasurementFontSize;
    const n = Ws(s);
    t.overrideSize ? s._stroke && (s._stroke.width *= this.baseRenderedFontSize / i) : s.fontSize = this.baseRenderedFontSize = i, this._style = s, this._skipKerning = t.skipKerning ?? !1, this.resolution = t.resolution ?? 1, this._padding = t.padding ?? 4, this.fontMetrics = Ye.measureFont(n), this.lineHeight = s.lineHeight || this.fontMetrics.fontSize || s.fontSize;
  }
  ensureCharacters(e) {
    var m, y;
    const t = lh(e).filter((x) => !this._currentChars.includes(x)).filter((x, v, A) => A.indexOf(x) === v);
    if (!t.length)
      return;
    this._currentChars = [...this._currentChars, ...t];
    let s;
    this._currentPageIndex === -1 ? s = this._nextPage() : s = this.pages[this._currentPageIndex];
    let { canvas: i, context: n } = s.canvasAndContext, a = s.texture.source;
    const o = this._style;
    let h = this._currentX, c = this._currentY;
    const l = this.baseRenderedFontSize / this.baseMeasurementFontSize, u = this._padding * l;
    let d = 0, f = !1;
    const p = i.width / this.resolution, g = i.height / this.resolution;
    for (let x = 0; x < t.length; x++) {
      const v = t[x], A = Ye.measureText(v, o, i, !1);
      A.lineHeight = A.height;
      const M = A.width * l, w = Math.ceil((o.fontStyle === "italic" ? 2 : 1) * M), C = A.height * l, F = w + u * 2, D = C + u * 2;
      if (f = !1, v !== `
` && v !== "\r" && v !== "	" && v !== " " && (f = !0, d = Math.ceil(Math.max(D, d))), h + F > p && (c += d, d = D, h = 0, c + d > g)) {
        a.update();
        const k = this._nextPage();
        i = k.canvasAndContext.canvas, n = k.canvasAndContext.context, a = k.texture.source, c = 0;
      }
      const I = M / l - (((m = o.dropShadow) == null ? void 0 : m.distance) ?? 0) - (((y = o._stroke) == null ? void 0 : y.width) ?? 0);
      if (this.chars[v] = {
        id: v.codePointAt(0),
        xOffset: -this._padding,
        yOffset: -this._padding,
        xAdvance: I,
        kerning: {}
      }, f) {
        this._drawGlyph(
          n,
          A,
          h + u,
          c + u,
          l,
          o
        );
        const k = a.width * l, U = a.height * l, O = new oe(
          h / k * a.width,
          c / U * a.height,
          F / k * a.width,
          D / U * a.height
        );
        this.chars[v].texture = new H({
          source: a,
          frame: O
        }), h += Math.ceil(F);
      }
    }
    a.update(), this._currentX = h, this._currentY = c, this._skipKerning && this._applyKerning(t, n);
  }
  /**
   * @deprecated since 8.0.0
   * The map of base page textures (i.e., sheets of glyphs).
   */
  get pageTextures() {
    return j(q, "BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead."), this.pages;
  }
  _applyKerning(e, t) {
    const s = this._measureCache;
    for (let i = 0; i < e.length; i++) {
      const n = e[i];
      for (let a = 0; a < this._currentChars.length; a++) {
        const o = this._currentChars[a];
        let h = s[n];
        h || (h = s[n] = t.measureText(n).width);
        let c = s[o];
        c || (c = s[o] = t.measureText(o).width);
        let l = t.measureText(n + o).width, u = l - (h + c);
        u && (this.chars[n].kerning[o] = u), l = t.measureText(n + o).width, u = l - (h + c), u && (this.chars[o].kerning[n] = u);
      }
    }
  }
  _nextPage() {
    this._currentPageIndex++;
    const e = this.resolution, t = Qe.getOptimalCanvasAndContext(
      this._textureSize,
      this._textureSize,
      e
    );
    this._setupContext(t.context, this._style, e);
    const s = e * (this.baseRenderedFontSize / this.baseMeasurementFontSize), i = new H({
      source: new gt({
        resource: t.canvas,
        resolution: s,
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
  _setupContext(e, t, s) {
    t.fontSize = this.baseRenderedFontSize, e.scale(s, s), e.font = Ws(t), t.fontSize = this.baseMeasurementFontSize, e.textBaseline = t.textBaseline;
    const i = t._stroke, n = (i == null ? void 0 : i.width) ?? 0;
    if (i && (e.lineWidth = n, e.lineJoin = i.join, e.miterLimit = i.miterLimit, e.strokeStyle = zs(i, e)), t._fill && (e.fillStyle = zs(t._fill, e)), t.dropShadow) {
      const a = t.dropShadow, o = ae.shared.setValue(a.color).toArray(), h = a.blur * s, c = a.distance * s;
      e.shadowColor = `rgba(${o[0] * 255},${o[1] * 255},${o[2] * 255},${a.alpha})`, e.shadowBlur = h, e.shadowOffsetX = Math.cos(a.angle) * c, e.shadowOffsetY = Math.sin(a.angle) * c;
    } else
      e.shadowColor = "black", e.shadowBlur = 0, e.shadowOffsetX = 0, e.shadowOffsetY = 0;
  }
  _drawGlyph(e, t, s, i, n, a) {
    const o = t.text, h = t.fontProperties, c = a._stroke, l = ((c == null ? void 0 : c.width) ?? 0) * n, u = s + l / 2, d = i - l / 2, f = h.descent * n, p = t.lineHeight * n;
    a.stroke && l && e.strokeText(o, u, d + p - f), a._fill && e.fillText(o, u, d + p - f);
  }
  destroy() {
    super.destroy();
    for (let e = 0; e < this.pages.length; e++) {
      const { canvasAndContext: t, texture: s } = this.pages[e];
      Qe.returnCanvasAndContext(t), s.destroy(!0);
    }
    this.pages = null;
  }
};
uh.defaultOptions = {
  textureSize: 512,
  style: new Je(),
  mipmap: !0
};
let xa = uh;
function fh(r, e, t, s) {
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
  }, c = (p) => {
    const g = n.width;
    for (let m = 0; m < h.index; m++) {
      const y = p.positions[m];
      n.chars.push(p.chars[m]), n.charPositions.push(y + g);
    }
    n.width += p.width, o = !1, h.width = 0, h.index = 0, h.chars.length = 0;
  }, l = () => {
    let p = n.chars.length - 1;
    if (s) {
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
  for (let p = 0; p < r.length + 1; p++) {
    let g;
    const m = p === r.length;
    m || (g = r[p]);
    const y = t.chars[g] || t.chars[" "];
    if (/(?:\s)/.test(g) || g === "\r" || g === `
` || m) {
      if (!o && e.wordWrap && n.width + h.width - d > f ? (l(), c(h), m || n.charPositions.push(0)) : (h.start = n.width, c(h), m || n.charPositions.push(0)), g === "\r" || g === `
`)
        n.width !== 0 && l();
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
  return l(), e.align === "center" ? Gf(i) : e.align === "right" ? Uf(i) : e.align === "justify" && Ff(i), i;
}
function Gf(r) {
  for (let e = 0; e < r.lines.length; e++) {
    const t = r.lines[e], s = r.width / 2 - t.width / 2;
    for (let i = 0; i < t.charPositions.length; i++)
      t.charPositions[i] += s;
  }
}
function Uf(r) {
  for (let e = 0; e < r.lines.length; e++) {
    const t = r.lines[e], s = r.width - t.width;
    for (let i = 0; i < t.charPositions.length; i++)
      t.charPositions[i] += s;
  }
}
function Ff(r) {
  const e = r.width;
  for (let t = 0; t < r.lines.length; t++) {
    const s = r.lines[t];
    let i = 0, n = s.spacesIndex[i++], a = 0;
    const o = s.spacesIndex.length, c = (e - s.width) / o;
    for (let l = 0; l < s.charPositions.length; l++)
      l === n && (n = s.spacesIndex[i++], a += c), s.charPositions[l] += a;
  }
}
let Ss = 0;
class Df {
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
    let s = `${t.fontFamily}-bitmap`, i = !0;
    if (t._fill.fill && !t._stroke)
      s += t._fill.fill.styleKey, i = !1;
    else if (t._stroke || t.dropShadow) {
      let o = t.styleKey;
      o = o.substring(0, o.lastIndexOf("-")), s = `${o}-bitmap`, i = !1;
    }
    if (!ce.has(s)) {
      const o = new xa({
        style: t,
        overrideFill: i,
        overrideSize: !0,
        ...this.defaultOptions
      });
      Ss++, Ss > 50 && $("BitmapText", `You have dynamically created ${Ss} bitmap fonts, this can be inefficient. Try pre installing your font styles using \`BitmapFont.install({name:"style1", style})\``), o.once("destroy", () => {
        Ss--, ce.remove(s);
      }), ce.set(
        s,
        o
      );
    }
    const n = ce.get(s);
    return (a = n.ensureCharacters) == null || a.call(n, e), n;
  }
  /**
   * Get the layout of a text for the specified style.
   * @param text - The text to get the layout for
   * @param style - The style to use
   * @param trimEnd - Whether to ignore whitespaces at the end of each line
   */
  getLayout(e, t, s = !0) {
    const i = this.getFont(e, t);
    return fh([...e], t, i, s);
  }
  /**
   * Measure the text using the specified style.
   * @param text - The text to measure
   * @param style - The style to use
   * @param trimEnd - Whether to ignore whitespaces at the end of each line
   */
  measureText(e, t, s = !0) {
    return this.getLayout(e, t, s);
  }
  // eslint-disable-next-line max-len
  install(...e) {
    var c, l, u, d;
    let t = e[0];
    typeof t == "string" && (t = {
      name: t,
      style: e[1],
      chars: (c = e[2]) == null ? void 0 : c.chars,
      resolution: (l = e[2]) == null ? void 0 : l.resolution,
      padding: (u = e[2]) == null ? void 0 : u.padding,
      skipKerning: (d = e[2]) == null ? void 0 : d.skipKerning
    }, j(q, "BitmapFontManager.install(name, style, options) is deprecated, use BitmapFontManager.install({name, style, ...options})"));
    const s = t == null ? void 0 : t.name;
    if (!s)
      throw new Error("[BitmapFontManager] Property `name` is required.");
    t = { ...this.defaultOptions, ...t };
    const i = t.style, n = i instanceof Je ? i : new Je(i), a = n._fill.fill !== null && n._fill.fill !== void 0, o = new xa({
      style: n,
      overrideFill: a,
      skipKerning: t.skipKerning,
      padding: t.padding,
      resolution: t.resolution,
      overrideSize: !1
    }), h = lh(t.chars);
    return o.ensureCharacters(h.join("")), ce.set(`${s}-bitmap`, o), o.once("destroy", () => ce.remove(`${s}-bitmap`)), o;
  }
  /**
   * Uninstalls a bitmap font from the cache.
   * @param {string} name - The name of the bitmap font to uninstall.
   */
  uninstall(e) {
    const t = `${e}-bitmap`, s = ce.get(t);
    s && s.destroy();
  }
}
const ai = new Df();
class ph extends Xo {
  constructor(e, t) {
    super();
    const { textures: s, data: i } = e;
    Object.keys(i.pages).forEach((n) => {
      const a = i.pages[parseInt(n, 10)], o = s[a.id];
      this.pages.push({ texture: o });
    }), Object.keys(i.chars).forEach((n) => {
      const a = i.chars[n], {
        frame: o,
        source: h
      } = s[a.page], c = new oe(
        a.x + o.x,
        a.y + o.y,
        a.width,
        a.height
      ), l = new H({
        source: h,
        frame: c
      });
      this.chars[n] = {
        id: n.codePointAt(0),
        xOffset: a.xOffset,
        yOffset: a.yOffset,
        xAdvance: a.xAdvance,
        kerning: a.kerning ?? {},
        texture: l
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
    ai.install(e);
  }
  /**
   * Uninstalls a bitmap font from the cache.
   * @param {string} name - The name of the bitmap font to uninstall.
   */
  static uninstall(e) {
    ai.uninstall(e);
  }
}
const Rr = {
  test(r) {
    return typeof r == "string" && r.startsWith("info face=");
  },
  parse(r) {
    const e = r.match(/^[a-z]+\s+.+$/gm), t = {
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
        const m = f[g].split("="), y = m[0], x = m[1].replace(/"/gm, ""), v = parseFloat(x), A = isNaN(v) ? x : v;
        p[y] = A;
      }
      t[d].push(p);
    }
    const s = {
      chars: {},
      pages: [],
      lineHeight: 0,
      fontSize: 0,
      fontFamily: "",
      distanceField: null,
      baseLineOffset: 0
    }, [i] = t.info, [n] = t.common, [a] = t.distanceField ?? [];
    a && (s.distanceField = {
      range: parseInt(a.distanceRange, 10),
      type: a.fieldType
    }), s.fontSize = parseInt(i.size, 10), s.fontFamily = i.face, s.lineHeight = parseInt(n.lineHeight, 10);
    const o = t.page;
    for (let u = 0; u < o.length; u++)
      s.pages.push({
        id: parseInt(o[u].id, 10) || 0,
        file: o[u].file
      });
    const h = {};
    s.baseLineOffset = s.lineHeight - parseInt(n.base, 10);
    const c = t.char;
    for (let u = 0; u < c.length; u++) {
      const d = c[u], f = parseInt(d.id, 10);
      let p = d.letter ?? d.char ?? String.fromCharCode(f);
      p === "space" && (p = " "), h[f] = p, s.chars[p] = {
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
    const l = t.kerning || [];
    for (let u = 0; u < l.length; u++) {
      const d = parseInt(l[u].first, 10), f = parseInt(l[u].second, 10), p = parseInt(l[u].amount, 10);
      s.chars[h[f]].kerning[h[d]] = p;
    }
    return s;
  }
}, ya = {
  test(r) {
    const e = r;
    return typeof e != "string" && "getElementsByTagName" in e && e.getElementsByTagName("page").length && e.getElementsByTagName("info")[0].getAttribute("face") !== null;
  },
  parse(r) {
    const e = {
      chars: {},
      pages: [],
      lineHeight: 0,
      fontSize: 0,
      fontFamily: "",
      distanceField: null,
      baseLineOffset: 0
    }, t = r.getElementsByTagName("info")[0], s = r.getElementsByTagName("common")[0], i = r.getElementsByTagName("distanceField")[0];
    i && (e.distanceField = {
      type: i.getAttribute("fieldType"),
      range: parseInt(i.getAttribute("distanceRange"), 10)
    });
    const n = r.getElementsByTagName("page"), a = r.getElementsByTagName("char"), o = r.getElementsByTagName("kerning");
    e.fontSize = parseInt(t.getAttribute("size"), 10), e.fontFamily = t.getAttribute("face"), e.lineHeight = parseInt(s.getAttribute("lineHeight"), 10);
    for (let c = 0; c < n.length; c++)
      e.pages.push({
        id: parseInt(n[c].getAttribute("id"), 10) || 0,
        file: n[c].getAttribute("file")
      });
    const h = {};
    e.baseLineOffset = e.lineHeight - parseInt(s.getAttribute("base"), 10);
    for (let c = 0; c < a.length; c++) {
      const l = a[c], u = parseInt(l.getAttribute("id"), 10);
      let d = l.getAttribute("letter") ?? l.getAttribute("char") ?? String.fromCharCode(u);
      d === "space" && (d = " "), h[u] = d, e.chars[d] = {
        id: u,
        // texture deets..
        page: parseInt(l.getAttribute("page"), 10) || 0,
        x: parseInt(l.getAttribute("x"), 10),
        y: parseInt(l.getAttribute("y"), 10),
        width: parseInt(l.getAttribute("width"), 10),
        height: parseInt(l.getAttribute("height"), 10),
        // render deets..
        xOffset: parseInt(l.getAttribute("xoffset"), 10),
        yOffset: parseInt(l.getAttribute("yoffset"), 10),
        // + baseLineOffset,
        xAdvance: parseInt(l.getAttribute("xadvance"), 10),
        kerning: {}
      };
    }
    for (let c = 0; c < o.length; c++) {
      const l = parseInt(o[c].getAttribute("first"), 10), u = parseInt(o[c].getAttribute("second"), 10), d = parseInt(o[c].getAttribute("amount"), 10);
      e.chars[h[u]].kerning[h[l]] = d;
    }
    return e;
  }
}, ba = {
  test(r) {
    return typeof r == "string" && r.includes("<font>") ? ya.test(J.get().parseXML(r)) : !1;
  },
  parse(r) {
    return ya.parse(J.get().parseXML(r));
  }
}, Of = [".xml", ".fnt"], Lf = {
  extension: {
    type: T.CacheParser,
    name: "cacheBitmapFont"
  },
  test: (r) => r instanceof ph,
  getCacheableAssets(r, e) {
    const t = {};
    return r.forEach((s) => {
      t[s] = e, t[`${s}-bitmap`] = e;
    }), t[`${e.fontFamily}-bitmap`] = e, t;
  }
}, Nf = {
  extension: {
    type: T.LoadParser,
    priority: at.Normal
  },
  name: "loadBitmapFont",
  test(r) {
    return Of.includes(Ee.extname(r).toLowerCase());
  },
  async testParse(r) {
    return Rr.test(r) || ba.test(r);
  },
  async parse(r, e, t) {
    const s = Rr.test(r) ? Rr.parse(r) : ba.parse(r), { src: i } = e, { pages: n } = s, a = [], o = s.distanceField ? {
      scaleMode: "linear",
      alphaMode: "premultiply-alpha-on-upload",
      autoGenerateMipmaps: !1,
      resolution: 1
    } : {};
    for (let u = 0; u < n.length; ++u) {
      const d = n[u].file;
      let f = Ee.join(Ee.dirname(i), d);
      f = Yr(f, i), a.push({
        src: f,
        data: o
      });
    }
    const h = await t.load(a), c = a.map((u) => h[u.src]);
    return new ph({
      data: s,
      textures: c
    }, i);
  },
  async load(r, e) {
    return await (await J.get().fetch(r)).text();
  },
  async unload(r, e, t) {
    await Promise.all(r.pages.map((s) => t.unload(s.texture.source._sourceOrigin))), r.destroy();
  }
};
class Hf {
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
      for (let s = 0; s < t; s++)
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
const Wf = {
  extension: {
    type: T.CacheParser,
    name: "cacheTextureArray"
  },
  test: (r) => Array.isArray(r) && r.every((e) => e instanceof H),
  getCacheableAssets: (r, e) => {
    const t = {};
    return r.forEach((s) => {
      e.forEach((i, n) => {
        t[s + (n === 0 ? "" : n + 1)] = i;
      });
    }), t;
  }
};
async function mh(r) {
  if ("Image" in globalThis)
    return new Promise((e) => {
      const t = new Image();
      t.onload = () => {
        e(!0);
      }, t.onerror = () => {
        e(!1);
      }, t.src = r;
    });
  if ("createImageBitmap" in globalThis && "fetch" in globalThis) {
    try {
      const e = await (await fetch(r)).blob();
      await createImageBitmap(e);
    } catch {
      return !1;
    }
    return !0;
  }
  return !1;
}
const zf = {
  extension: {
    type: T.DetectionParser,
    priority: 1
  },
  test: async () => mh(
    // eslint-disable-next-line max-len
    "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="
  ),
  add: async (r) => [...r, "avif"],
  remove: async (r) => r.filter((e) => e !== "avif")
}, va = ["png", "jpg", "jpeg"], Vf = {
  extension: {
    type: T.DetectionParser,
    priority: -1
  },
  test: () => Promise.resolve(!0),
  add: async (r) => [...r, ...va],
  remove: async (r) => r.filter((e) => !va.includes(e))
}, $f = "WorkerGlobalScope" in globalThis && globalThis instanceof globalThis.WorkerGlobalScope;
function Ni(r) {
  return $f ? !1 : document.createElement("video").canPlayType(r) !== "";
}
const Xf = {
  extension: {
    type: T.DetectionParser,
    priority: 0
  },
  test: async () => Ni("video/mp4"),
  add: async (r) => [...r, "mp4", "m4v"],
  remove: async (r) => r.filter((e) => e !== "mp4" && e !== "m4v")
}, jf = {
  extension: {
    type: T.DetectionParser,
    priority: 0
  },
  test: async () => Ni("video/ogg"),
  add: async (r) => [...r, "ogv"],
  remove: async (r) => r.filter((e) => e !== "ogv")
}, Yf = {
  extension: {
    type: T.DetectionParser,
    priority: 0
  },
  test: async () => Ni("video/webm"),
  add: async (r) => [...r, "webm"],
  remove: async (r) => r.filter((e) => e !== "webm")
}, Kf = {
  extension: {
    type: T.DetectionParser,
    priority: 0
  },
  test: async () => mh(
    "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA="
  ),
  add: async (r) => [...r, "webp"],
  remove: async (r) => r.filter((e) => e !== "webp")
};
class qf {
  constructor() {
    this._parsers = [], this._parsersValidated = !1, this.parsers = new Proxy(this._parsers, {
      set: (e, t, s) => (this._parsersValidated = !1, e[t] = s, !0)
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
    const s = {
      promise: null,
      parser: null
    };
    return s.promise = (async () => {
      var a, o;
      let i = null, n = null;
      if (t.loadParser && (n = this._parserHash[t.loadParser], n || $(`[Assets] specified load parser "${t.loadParser}" not found while loading ${e}`)), !n) {
        for (let h = 0; h < this.parsers.length; h++) {
          const c = this.parsers[h];
          if (c.load && ((a = c.test) != null && a.call(c, e, t, this))) {
            n = c;
            break;
          }
        }
        if (!n)
          return $(`[Assets] ${e} could not be loaded as we don't know how to parse it, ensure the correct parser has been added`), null;
      }
      i = await n.load(e, t, this), s.parser = n;
      for (let h = 0; h < this.parsers.length; h++) {
        const c = this.parsers[h];
        c.parse && c.parse && await ((o = c.testParse) == null ? void 0 : o.call(c, i, t, this)) && (i = await c.parse(i, t, this) || i, s.parser = c);
      }
      return i;
    })(), s;
  }
  async load(e, t) {
    this._parsersValidated || this._validateParsers();
    let s = 0;
    const i = {}, n = Ls(e), a = De(e, (c) => ({
      alias: [c],
      src: c,
      data: {}
    })), o = a.length, h = a.map(async (c) => {
      const l = Ee.toAbsolute(c.src);
      if (!i[c.src])
        try {
          this.promiseCache[l] || (this.promiseCache[l] = this._getLoadPromiseAndParser(l, c)), i[c.src] = await this.promiseCache[l].promise, t && t(++s / o);
        } catch (u) {
          throw delete this.promiseCache[l], delete i[c.src], new Error(`[Loader.load] Failed to load ${l}.
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
    const s = De(e, (i) => ({
      alias: [i],
      src: i
    })).map(async (i) => {
      var o, h;
      const n = Ee.toAbsolute(i.src), a = this.promiseCache[n];
      if (a) {
        const c = await a.promise;
        delete this.promiseCache[n], await ((h = (o = a.parser) == null ? void 0 : o.unload) == null ? void 0 : h.call(o, c, i, this));
      }
    });
    await Promise.all(s);
  }
  /** validates our parsers, right now it only checks for name conflicts but we can add more here as required! */
  _validateParsers() {
    this._parsersValidated = !0, this._parserHash = this._parsers.filter((e) => e.name).reduce((e, t) => (t.name ? e[t.name] && $(`[Assets] loadParser name conflict "${t.name}"`) : $("[Assets] loadParser should have a name"), { ...e, [t.name]: t }), {});
  }
}
function Ut(r, e) {
  if (Array.isArray(e)) {
    for (const t of e)
      if (r.startsWith(`data:${t}`))
        return !0;
    return !1;
  }
  return r.startsWith(`data:${e}`);
}
function Ft(r, e) {
  const t = r.split("?")[0], s = Ee.extname(t).toLowerCase();
  return Array.isArray(e) ? e.includes(s) : s === e;
}
const Zf = ".json", Qf = "application/json", Jf = {
  extension: {
    type: T.LoadParser,
    priority: at.Low
  },
  name: "loadJson",
  test(r) {
    return Ut(r, Qf) || Ft(r, Zf);
  },
  async load(r) {
    return await (await J.get().fetch(r)).json();
  }
}, ep = ".txt", tp = "text/plain", sp = {
  name: "loadTxt",
  extension: {
    type: T.LoadParser,
    priority: at.Low,
    name: "loadTxt"
  },
  test(r) {
    return Ut(r, tp) || Ft(r, ep);
  },
  async load(r) {
    return await (await J.get().fetch(r)).text();
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
], ip = [".ttf", ".otf", ".woff", ".woff2"], np = [
  "font/ttf",
  "font/otf",
  "font/woff",
  "font/woff2"
], ap = /^(--|-?[A-Z_])[0-9A-Z_-]*$/i;
function op(r) {
  const e = Ee.extname(r), i = Ee.basename(r, e).replace(/(-|_)/g, " ").toLowerCase().split(" ").map((o) => o.charAt(0).toUpperCase() + o.slice(1));
  let n = i.length > 0;
  for (const o of i)
    if (!o.match(ap)) {
      n = !1;
      break;
    }
  let a = i.join(" ");
  return n || (a = `"${a.replace(/[\\"]/g, "\\$&")}"`), a;
}
const hp = /^[0-9A-Za-z%:/?#\[\]@!\$&'()\*\+,;=\-._~]*$/;
function cp(r) {
  return hp.test(r) ? r : encodeURI(r);
}
const lp = {
  extension: {
    type: T.LoadParser,
    priority: at.Low
  },
  name: "loadWebFont",
  test(r) {
    return Ut(r, np) || Ft(r, ip);
  },
  async load(r, e) {
    var s, i, n;
    const t = J.get().getFontFaceSet();
    if (t) {
      const a = [], o = ((s = e.data) == null ? void 0 : s.family) ?? op(r), h = ((n = (i = e.data) == null ? void 0 : i.weights) == null ? void 0 : n.filter((l) => rp.includes(l))) ?? ["normal"], c = e.data ?? {};
      for (let l = 0; l < h.length; l++) {
        const u = h[l], d = new FontFace(o, `url(${cp(r)})`, {
          ...c,
          weight: u
        });
        await d.load(), t.add(d), a.push(d);
      }
      return ce.set(`${o}-and-url`, {
        url: r,
        fontFaces: a
      }), a.length === 1 ? a[0] : a;
    }
    return $("[loadWebFont] FontFace API is not supported. Skipping loading font"), null;
  },
  unload(r) {
    (Array.isArray(r) ? r : [r]).forEach((e) => {
      ce.remove(`${e.family}-and-url`), J.get().getFontFaceSet().delete(e);
    });
  }
};
function Hi(r, e = 1) {
  var s;
  const t = (s = Rt.RETINA_PREFIX) == null ? void 0 : s.exec(r);
  return t ? parseFloat(t[1]) : e;
}
function Wi(r, e, t) {
  r.label = t, r._sourceOrigin = t;
  const s = new H({
    source: r,
    label: t
  }), i = () => {
    delete e.promiseCache[t], ce.has(t) && ce.remove(t);
  };
  return s.source.once("destroy", () => {
    e.promiseCache[t] && ($("[Assets] A TextureSource managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the TextureSource."), i());
  }), s.once("destroy", () => {
    r.destroyed || ($("[Assets] A Texture managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the Texture."), i());
  }), s;
}
const up = ".svg", dp = "image/svg+xml", fp = {
  extension: {
    type: T.LoadParser,
    priority: at.Low,
    name: "loadSVG"
  },
  name: "loadSVG",
  config: {
    crossOrigin: "anonymous",
    parseAsGraphicsContext: !1
  },
  test(r) {
    return Ut(r, dp) || Ft(r, up);
  },
  async load(r, e, t) {
    var s;
    return ((s = e.data) == null ? void 0 : s.parseAsGraphicsContext) ?? this.config.parseAsGraphicsContext ? mp(r) : pp(r, e, t, this.config.crossOrigin);
  },
  unload(r) {
    r.destroy(!0);
  }
};
async function pp(r, e, t, s) {
  var m, y, x;
  const n = await (await J.get().fetch(r)).blob(), a = URL.createObjectURL(n), o = new Image();
  o.src = a, o.crossOrigin = s, await o.decode(), URL.revokeObjectURL(a);
  const h = document.createElement("canvas"), c = h.getContext("2d"), l = ((m = e.data) == null ? void 0 : m.resolution) || Hi(r), u = ((y = e.data) == null ? void 0 : y.width) ?? o.width, d = ((x = e.data) == null ? void 0 : x.height) ?? o.height;
  h.width = u * l, h.height = d * l, c.drawImage(o, 0, 0, u * l, d * l);
  const { parseAsGraphicsContext: f, ...p } = e.data ?? {}, g = new gt({
    resource: h,
    alphaMode: "premultiply-alpha-on-upload",
    resolution: l,
    ...p
  });
  return Wi(g, t, r);
}
async function mp(r) {
  const t = await (await J.get().fetch(r)).text(), s = new Re();
  return s.svg(t), s;
}
const gp = `(function () {
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
let wt = null, oi = class {
  constructor() {
    wt || (wt = URL.createObjectURL(new Blob([gp], { type: "application/javascript" }))), this.worker = new Worker(wt);
  }
};
oi.revokeObjectURL = function() {
  wt && (URL.revokeObjectURL(wt), wt = null);
};
const _p = `(function () {
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
let At = null;
class gh {
  constructor() {
    At || (At = URL.createObjectURL(new Blob([_p], { type: "application/javascript" }))), this.worker = new Worker(At);
  }
}
gh.revokeObjectURL = function() {
  At && (URL.revokeObjectURL(At), At = null);
};
let Ta = 0, kr;
class xp {
  constructor() {
    this._initialized = !1, this._createdWorkers = 0, this._workerPool = [], this._queue = [], this._resolveHash = {};
  }
  isImageBitmapSupported() {
    return this._isImageBitmapSupported !== void 0 ? this._isImageBitmapSupported : (this._isImageBitmapSupported = new Promise((e) => {
      const { worker: t } = new oi();
      t.addEventListener("message", (s) => {
        t.terminate(), oi.revokeObjectURL(), e(s.data);
      });
    }), this._isImageBitmapSupported);
  }
  loadImageBitmap(e, t) {
    var s;
    return this._run("loadImageBitmap", [e, (s = t == null ? void 0 : t.data) == null ? void 0 : s.alphaMode]);
  }
  async _initWorkers() {
    this._initialized || (this._initialized = !0);
  }
  _getWorker() {
    kr === void 0 && (kr = navigator.hardwareConcurrency || 4);
    let e = this._workerPool.pop();
    return !e && this._createdWorkers < kr && (this._createdWorkers++, e = new gh().worker, e.addEventListener("message", (t) => {
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
    const s = new Promise((i, n) => {
      this._queue.push({ id: e, arguments: t, resolve: i, reject: n });
    });
    return this._next(), s;
  }
  _next() {
    if (!this._queue.length)
      return;
    const e = this._getWorker();
    if (!e)
      return;
    const t = this._queue.pop(), s = t.id;
    this._resolveHash[Ta] = { resolve: t.resolve, reject: t.reject }, e.postMessage({
      data: t.arguments,
      uuid: Ta++,
      id: s
    });
  }
}
const Sa = new xp(), yp = [".jpeg", ".jpg", ".png", ".webp", ".avif"], bp = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
];
async function vp(r, e) {
  var i;
  const t = await J.get().fetch(r);
  if (!t.ok)
    throw new Error(`[loadImageBitmap] Failed to fetch ${r}: ${t.status} ${t.statusText}`);
  const s = await t.blob();
  return ((i = e == null ? void 0 : e.data) == null ? void 0 : i.alphaMode) === "premultiplied-alpha" ? createImageBitmap(s, { premultiplyAlpha: "none" }) : createImageBitmap(s);
}
const _h = {
  name: "loadTextures",
  extension: {
    type: T.LoadParser,
    priority: at.High,
    name: "loadTextures"
  },
  config: {
    preferWorkers: !0,
    preferCreateImageBitmap: !0,
    crossOrigin: "anonymous"
  },
  test(r) {
    return Ut(r, bp) || Ft(r, yp);
  },
  async load(r, e, t) {
    var n;
    let s = null;
    globalThis.createImageBitmap && this.config.preferCreateImageBitmap ? this.config.preferWorkers && await Sa.isImageBitmapSupported() ? s = await Sa.loadImageBitmap(r, e) : s = await vp(r, e) : s = await new Promise((a, o) => {
      s = new Image(), s.crossOrigin = this.config.crossOrigin, s.src = r, s.complete ? a(s) : (s.onload = () => {
        a(s);
      }, s.onerror = o);
    });
    const i = new gt({
      resource: s,
      alphaMode: "premultiply-alpha-on-upload",
      resolution: ((n = e.data) == null ? void 0 : n.resolution) || Hi(r),
      ...e.data
    });
    return Wi(i, t, r);
  },
  unload(r) {
    r.destroy(!0);
  }
}, xh = [".mp4", ".m4v", ".webm", ".ogg", ".ogv", ".h264", ".avi", ".mov"], Tp = xh.map((r) => `video/${r.substring(1)}`);
function Sp(r, e, t) {
  t === void 0 && !e.startsWith("data:") ? r.crossOrigin = Ap(e) : t !== !1 && (r.crossOrigin = typeof t == "string" ? t : "anonymous");
}
function wp(r) {
  return new Promise((e, t) => {
    r.addEventListener("canplaythrough", s), r.addEventListener("error", i), r.load();
    function s() {
      n(), e();
    }
    function i(a) {
      n(), t(a);
    }
    function n() {
      r.removeEventListener("canplaythrough", s), r.removeEventListener("error", i);
    }
  });
}
function Ap(r, e = globalThis.location) {
  if (r.startsWith("data:"))
    return "";
  e || (e = globalThis.location);
  const t = new URL(r, document.baseURI);
  return t.hostname !== e.hostname || t.port !== e.port || t.protocol !== e.protocol ? "anonymous" : "";
}
const Cp = {
  name: "loadVideo",
  extension: {
    type: T.LoadParser,
    name: "loadVideo"
  },
  test(r) {
    const e = Ut(r, Tp), t = Ft(r, xh);
    return e || t;
  },
  async load(r, e, t) {
    var h, c;
    const s = {
      ...ks.defaultOptions,
      resolution: ((h = e.data) == null ? void 0 : h.resolution) || Hi(r),
      alphaMode: ((c = e.data) == null ? void 0 : c.alphaMode) || await To(),
      ...e.data
    }, i = document.createElement("video"), n = {
      preload: s.autoLoad !== !1 ? "auto" : void 0,
      "webkit-playsinline": s.playsinline !== !1 ? "" : void 0,
      playsinline: s.playsinline !== !1 ? "" : void 0,
      muted: s.muted === !0 ? "" : void 0,
      loop: s.loop === !0 ? "" : void 0,
      autoplay: s.autoPlay !== !1 ? "" : void 0
    };
    Object.keys(n).forEach((l) => {
      const u = n[l];
      u !== void 0 && i.setAttribute(l, u);
    }), s.muted === !0 && (i.muted = !0), Sp(i, r, s.crossorigin);
    const a = document.createElement("source");
    let o;
    if (r.startsWith("data:"))
      o = r.slice(5, r.indexOf(";"));
    else if (!r.startsWith("blob:")) {
      const l = r.split("?")[0].slice(r.lastIndexOf(".") + 1).toLowerCase();
      o = ks.MIME_TYPES[l] || `video/${l}`;
    }
    return a.src = r, o && (a.type = o), new Promise((l) => {
      const u = async () => {
        const d = new ks({ ...s, resource: i });
        i.removeEventListener("canplay", u), e.data.preload && await wp(i), l(Wi(d, t, r));
      };
      i.addEventListener("canplay", u), i.appendChild(a);
    });
  },
  unload(r) {
    r.destroy(!0);
  }
}, yh = {
  extension: {
    type: T.ResolveParser,
    name: "resolveTexture"
  },
  test: _h.test,
  parse: (r) => {
    var e;
    return {
      resolution: parseFloat(((e = Rt.RETINA_PREFIX.exec(r)) == null ? void 0 : e[1]) ?? "1"),
      format: r.split(".").pop(),
      src: r
    };
  }
}, Pp = {
  extension: {
    type: T.ResolveParser,
    priority: -2,
    name: "resolveJson"
  },
  test: (r) => Rt.RETINA_PREFIX.test(r) && r.endsWith(".json"),
  parse: yh.parse
};
class Ep {
  constructor() {
    this._detections = [], this._initialized = !1, this.resolver = new Rt(), this.loader = new qf(), this.cache = ce, this._backgroundLoader = new Hf(this.loader), this._backgroundLoader.active = !0, this.reset();
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
      $("[Assets]AssetManager already initialized, did you load before calling this Assets.init()?");
      return;
    }
    if (this._initialized = !0, e.defaultSearchParams && this.resolver.setDefaultSearchParams(e.defaultSearchParams), e.basePath && (this.resolver.basePath = e.basePath), e.bundleIdentifier && this.resolver.setBundleIdentifier(e.bundleIdentifier), e.manifest) {
      let o = e.manifest;
      typeof o == "string" && (o = await this.load(o)), this.resolver.addManifest(o);
    }
    const t = ((n = e.texturePreference) == null ? void 0 : n.resolution) ?? 1, s = typeof t == "number" ? [t] : t, i = await this._detectFormats({
      preferredFormats: (a = e.texturePreference) == null ? void 0 : a.format,
      skipDetections: e.skipDetections,
      detections: this._detections
    });
    this.resolver.prefer({
      params: {
        format: i,
        resolution: s
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
    const s = Ls(e), i = De(e).map((o) => {
      if (typeof o != "string") {
        const h = this.resolver.getAlias(o);
        return h.some((c) => !this.resolver.hasKey(c)) && this.add(o), Array.isArray(h) ? h[0] : h;
      }
      return this.resolver.hasKey(o) || this.add({ alias: o, src: o }), o;
    }), n = this.resolver.resolve(i), a = await this._mapLoadToResolve(n, t);
    return s ? a[i[0]] : a;
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
    let s = !1;
    typeof e == "string" && (s = !0, e = [e]);
    const i = this.resolver.resolveBundle(e), n = {}, a = Object.keys(i);
    let o = 0, h = 0;
    const c = () => {
      t == null || t(++o / h);
    }, l = a.map((u) => {
      const d = i[u];
      return h += Object.keys(d).length, this._mapLoadToResolve(d, c).then((f) => {
        n[u] = f;
      });
    });
    return await Promise.all(l), s ? n[e[0]] : n;
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
    Object.values(t).forEach((s) => {
      this._backgroundLoader.add(Object.values(s));
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
      return ce.get(e);
    const t = {};
    for (let s = 0; s < e.length; s++)
      t[s] = ce.get(e[s]);
    return t;
  }
  /**
   * helper function to map resolved assets back to loaded assets
   * @param resolveResults - the resolve results from the resolver
   * @param onProgress - the progress callback
   */
  async _mapLoadToResolve(e, t) {
    const s = [...new Set(Object.values(e))];
    this._backgroundLoader.active = !1;
    const i = await this.loader.load(s, t);
    this._backgroundLoader.active = !0;
    const n = {};
    return s.forEach((a) => {
      const o = i[a.src], h = [a.src];
      a.alias && h.push(...a.alias), h.forEach((c) => {
        n[c] = o;
      }), ce.set(h, o);
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
    const t = De(e).map((i) => typeof i != "string" ? i.src : i), s = this.resolver.resolve(t);
    await this._unloadFromResolved(s);
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
    this._initialized || await this.init(), e = De(e);
    const t = this.resolver.resolveBundle(e), s = Object.keys(t).map((i) => this._unloadFromResolved(t[i]));
    await Promise.all(s);
  }
  async _unloadFromResolved(e) {
    const t = Object.values(e);
    t.forEach((s) => {
      ce.remove(s.src);
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
    for (const s of e.detections)
      e.skipDetections || await s.test() ? t = await s.add(t) : e.skipDetections || (t = await s.remove(t));
    return t = t.filter((s, i) => t.indexOf(s) === i), t;
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
      t.config && Object.keys(t.config).filter((s) => s in e).forEach((s) => {
        t.config[s] = e[s];
      });
    });
  }
}
const Xt = new Ep();
V.handleByList(T.LoadParser, Xt.loader.parsers).handleByList(T.ResolveParser, Xt.resolver.parsers).handleByList(T.CacheParser, Xt.cache.parsers).handleByList(T.DetectionParser, Xt.detections);
V.add(
  Wf,
  Vf,
  zf,
  Kf,
  Xf,
  jf,
  Yf,
  Jf,
  sp,
  lp,
  fp,
  _h,
  Cp,
  Nf,
  Lf,
  yh,
  Pp
);
const wa = {
  loader: T.LoadParser,
  resolver: T.ResolveParser,
  cache: T.CacheParser,
  detection: T.DetectionParser
};
V.handle(T.Asset, (r) => {
  const e = r.ref;
  Object.entries(wa).filter(([t]) => !!e[t]).forEach(([t, s]) => V.add(Object.assign(
    e[t],
    // Allow the function to optionally define it's own
    // ExtensionMetadata, the use cases here is priority for LoaderParsers
    { extension: e[t].extension ?? s }
  )));
}, (r) => {
  const e = r.ref;
  Object.keys(wa).filter((t) => !!e[t]).forEach((t) => V.remove(e[t]));
});
class Mp {
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
    this._tickerAdded || !this.domElement || (Ve.system.add(this._tickerUpdate, this, ts.INTERACTION), this._tickerAdded = !0);
  }
  /** Removes the ticker listener. */
  removeTickerListener() {
    this._tickerAdded && (Ve.system.remove(this._tickerUpdate, this), this._tickerAdded = !1);
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
const st = new Mp();
class Vs extends ns {
  constructor() {
    super(...arguments), this.client = new he(), this.movement = new he(), this.offset = new he(), this.global = new he(), this.screen = new he();
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
  getLocalPosition(e, t, s) {
    return e.worldTransform.applyInverse(s || this.global, t);
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
  initMouseEvent(e, t, s, i, n, a, o, h, c, l, u, d, f, p, g) {
    throw new Error("Method not implemented.");
  }
}
class Fe extends Vs {
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
class Mt extends Vs {
  constructor() {
    super(...arguments), this.DOM_DELTA_PIXEL = 0, this.DOM_DELTA_LINE = 1, this.DOM_DELTA_PAGE = 2;
  }
}
Mt.DOM_DELTA_PIXEL = 0;
Mt.DOM_DELTA_LINE = 1;
Mt.DOM_DELTA_PAGE = 2;
const Bp = 2048, Rp = new he(), Ht = new he();
class kp {
  /**
   * @param rootTarget - The holder of the event boundary.
   */
  constructor(e) {
    this.dispatch = new Be(), this.moveOnAll = !1, this.enableGlobalMoveEvents = !0, this.mappingState = {
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
    }), this.mappingTable[e].sort((s, i) => s.priority - i.priority);
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
      for (let s = 0, i = t.length; s < i; s++)
        t[s].fn(e);
    else
      $(`[EventBoundary]: Event mapping not defined for ${e.type}`);
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
      Rp.set(e, t),
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
    const s = e.composedPath();
    e.eventPhase = e.CAPTURING_PHASE;
    for (let i = 0, n = s.length - 1; i < n; i++)
      if (e.currentTarget = s[i], this.notifyTarget(e, t), e.propagationStopped || e.propagationImmediatelyStopped)
        return;
    if (e.eventPhase = e.AT_TARGET, e.currentTarget = e.target, this.notifyTarget(e, t), !(e.propagationStopped || e.propagationImmediatelyStopped)) {
      e.eventPhase = e.BUBBLING_PHASE;
      for (let i = s.length - 2; i >= 0; i--)
        if (e.currentTarget = s[i], this.notifyTarget(e, t), e.propagationStopped || e.propagationImmediatelyStopped)
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
  all(e, t, s = this._allInteractiveElements) {
    if (s.length === 0)
      return;
    e.eventPhase = e.BUBBLING_PHASE;
    const i = Array.isArray(t) ? t : [t];
    for (let n = s.length - 1; n >= 0; n--)
      i.forEach((a) => {
        e.currentTarget = s[n], this.notifyTarget(e, a);
      });
  }
  /**
   * Finds the propagation path from {@link EventBoundary.rootTarget rootTarget} to the passed
   * {@code target}. The last element in the path is {@code target}.
   * @param target - The target to find the propagation path to.
   */
  propagationPath(e) {
    const t = [e];
    for (let s = 0; s < Bp && e !== this.rootTarget && e.parent; s++) {
      if (!e.parent)
        throw new Error("Cannot find propagation path to disconnected target");
      t.push(e.parent), e = e.parent;
    }
    return t.reverse(), t;
  }
  hitTestMoveRecursive(e, t, s, i, n, a = !1) {
    let o = !1;
    if (this._interactivePrune(e))
      return null;
    if ((e.eventMode === "dynamic" || t === "dynamic") && (st.pauseUpdate = !1), e.interactiveChildren && e.children) {
      const l = e.children;
      for (let u = l.length - 1; u >= 0; u--) {
        const d = l[u], f = this.hitTestMoveRecursive(
          d,
          this._isInteractive(t) ? t : d.eventMode,
          s,
          i,
          n,
          a || n(e, s)
        );
        if (f) {
          if (f.length > 0 && !f[f.length - 1].parent)
            continue;
          const p = e.isInteractive();
          (f.length > 0 || p) && (p && this._allInteractiveElements.push(e), f.push(e)), this._hitElements.length === 0 && (this._hitElements = f), o = !0;
        }
      }
    }
    const h = this._isInteractive(t), c = e.isInteractive();
    return c && c && this._allInteractiveElements.push(e), a || this._hitElements.length > 0 ? null : o ? this._hitElements : h && !n(e, s) && i(e, s) ? c ? [e] : [] : null;
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
  hitTestRecursive(e, t, s, i, n) {
    if (this._interactivePrune(e) || n(e, s))
      return null;
    if ((e.eventMode === "dynamic" || t === "dynamic") && (st.pauseUpdate = !1), e.interactiveChildren && e.children) {
      const h = e.children, c = s;
      for (let l = h.length - 1; l >= 0; l--) {
        const u = h[l], d = this.hitTestRecursive(
          u,
          this._isInteractive(t) ? t : u.eventMode,
          c,
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
    return a && i(e, s) ? o ? [e] : [] : null;
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
      for (let s = 0; s < e.effects.length; s++) {
        const i = e.effects[s];
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
    const s = `on${t}`;
    (a = (n = e.currentTarget)[s]) == null || a.call(n, e);
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
    if (!(e instanceof Fe)) {
      $("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const t = this.createPointerEvent(e);
    if (this.dispatchEvent(t, "pointerdown"), t.pointerType === "touch")
      this.dispatchEvent(t, "touchstart");
    else if (t.pointerType === "mouse" || t.pointerType === "pen") {
      const i = t.button === 2;
      this.dispatchEvent(t, i ? "rightdown" : "mousedown");
    }
    const s = this.trackingData(e.pointerId);
    s.pressTargetsByButton[e.button] = t.composedPath(), this.freeEvent(t);
  }
  /**
   * Maps the upstream `pointermove` to downstream `pointerout`, `pointerover`, and `pointermove` events, in that order.
   *
   * The tracking data for the specific pointer has an updated `overTarget`. `mouseout`, `mouseover`,
   * `mousemove`, and `touchmove` events are fired as well for specific pointer types.
   * @param from - The upstream `pointermove` event.
   */
  mapPointerMove(e) {
    var h, c;
    if (!(e instanceof Fe)) {
      $("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    this._allInteractiveElements.length = 0, this._hitElements.length = 0, this._isPointerMoveEvent = !0;
    const t = this.createPointerEvent(e);
    this._isPointerMoveEvent = !1;
    const s = t.pointerType === "mouse" || t.pointerType === "pen", i = this.trackingData(e.pointerId), n = this.findMountedTarget(i.overTargets);
    if (((h = i.overTargets) == null ? void 0 : h.length) > 0 && n !== t.target) {
      const l = e.type === "mousemove" ? "mouseout" : "pointerout", u = this.createPointerEvent(e, l, n);
      if (this.dispatchEvent(u, "pointerout"), s && this.dispatchEvent(u, "mouseout"), !t.composedPath().includes(n)) {
        const d = this.createPointerEvent(e, "pointerleave", n);
        for (d.eventPhase = d.AT_TARGET; d.target && !t.composedPath().includes(d.target); )
          d.currentTarget = d.target, this.notifyTarget(d), s && this.notifyTarget(d, "mouseleave"), d.target = d.target.parent;
        this.freeEvent(d);
      }
      this.freeEvent(u);
    }
    if (n !== t.target) {
      const l = e.type === "mousemove" ? "mouseover" : "pointerover", u = this.clonePointerEvent(t, l);
      this.dispatchEvent(u, "pointerover"), s && this.dispatchEvent(u, "mouseover");
      let d = n == null ? void 0 : n.parent;
      for (; d && d !== this.rootTarget.parent && d !== t.target; )
        d = d.parent;
      if (!d || d === this.rootTarget.parent) {
        const p = this.clonePointerEvent(t, "pointerenter");
        for (p.eventPhase = p.AT_TARGET; p.target && p.target !== n && p.target !== this.rootTarget.parent; )
          p.currentTarget = p.target, this.notifyTarget(p), s && this.notifyTarget(p, "mouseenter"), p.target = p.target.parent;
        this.freeEvent(p);
      }
      this.freeEvent(u);
    }
    const a = [], o = this.enableGlobalMoveEvents ?? !0;
    this.moveOnAll ? a.push("pointermove") : this.dispatchEvent(t, "pointermove"), o && a.push("globalpointermove"), t.pointerType === "touch" && (this.moveOnAll ? a.splice(1, 0, "touchmove") : this.dispatchEvent(t, "touchmove"), o && a.push("globaltouchmove")), s && (this.moveOnAll ? a.splice(1, 0, "mousemove") : this.dispatchEvent(t, "mousemove"), o && a.push("globalmousemove"), this.cursor = (c = t.target) == null ? void 0 : c.cursor), a.length > 0 && this.all(t, a), this._allInteractiveElements.length = 0, this._hitElements.length = 0, i.overTargets = t.composedPath(), this.freeEvent(t);
  }
  /**
   * Maps the upstream `pointerover` to downstream `pointerover` and `pointerenter` events, in that order.
   *
   * The tracking data for the specific pointer gets a new `overTarget`.
   * @param from - The upstream `pointerover` event.
   */
  mapPointerOver(e) {
    var a;
    if (!(e instanceof Fe)) {
      $("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const t = this.trackingData(e.pointerId), s = this.createPointerEvent(e), i = s.pointerType === "mouse" || s.pointerType === "pen";
    this.dispatchEvent(s, "pointerover"), i && this.dispatchEvent(s, "mouseover"), s.pointerType === "mouse" && (this.cursor = (a = s.target) == null ? void 0 : a.cursor);
    const n = this.clonePointerEvent(s, "pointerenter");
    for (n.eventPhase = n.AT_TARGET; n.target && n.target !== this.rootTarget.parent; )
      n.currentTarget = n.target, this.notifyTarget(n), i && this.notifyTarget(n, "mouseenter"), n.target = n.target.parent;
    t.overTargets = s.composedPath(), this.freeEvent(s), this.freeEvent(n);
  }
  /**
   * Maps the upstream `pointerout` to downstream `pointerout`, `pointerleave` events, in that order.
   *
   * The tracking data for the specific pointer is cleared of a `overTarget`.
   * @param from - The upstream `pointerout` event.
   */
  mapPointerOut(e) {
    if (!(e instanceof Fe)) {
      $("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const t = this.trackingData(e.pointerId);
    if (t.overTargets) {
      const s = e.pointerType === "mouse" || e.pointerType === "pen", i = this.findMountedTarget(t.overTargets), n = this.createPointerEvent(e, "pointerout", i);
      this.dispatchEvent(n), s && this.dispatchEvent(n, "mouseout");
      const a = this.createPointerEvent(e, "pointerleave", i);
      for (a.eventPhase = a.AT_TARGET; a.target && a.target !== this.rootTarget.parent; )
        a.currentTarget = a.target, this.notifyTarget(a), s && this.notifyTarget(a, "mouseleave"), a.target = a.target.parent;
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
    if (!(e instanceof Fe)) {
      $("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const t = performance.now(), s = this.createPointerEvent(e);
    if (this.dispatchEvent(s, "pointerup"), s.pointerType === "touch")
      this.dispatchEvent(s, "touchend");
    else if (s.pointerType === "mouse" || s.pointerType === "pen") {
      const o = s.button === 2;
      this.dispatchEvent(s, o ? "rightup" : "mouseup");
    }
    const i = this.trackingData(e.pointerId), n = this.findMountedTarget(i.pressTargetsByButton[e.button]);
    let a = n;
    if (n && !s.composedPath().includes(n)) {
      let o = n;
      for (; o && !s.composedPath().includes(o); ) {
        if (s.currentTarget = o, this.notifyTarget(s, "pointerupoutside"), s.pointerType === "touch")
          this.notifyTarget(s, "touchendoutside");
        else if (s.pointerType === "mouse" || s.pointerType === "pen") {
          const h = s.button === 2;
          this.notifyTarget(s, h ? "rightupoutside" : "mouseupoutside");
        }
        o = o.parent;
      }
      delete i.pressTargetsByButton[e.button], a = o;
    }
    if (a) {
      const o = this.clonePointerEvent(s, "click");
      o.target = a, o.path = null, i.clicksByButton[e.button] || (i.clicksByButton[e.button] = {
        clickCount: 0,
        target: o.target,
        timeStamp: t
      });
      const h = i.clicksByButton[e.button];
      if (h.target === o.target && t - h.timeStamp < 200 ? ++h.clickCount : h.clickCount = 1, h.target = o.target, h.timeStamp = t, o.detail = h.clickCount, o.pointerType === "mouse") {
        const c = o.button === 2;
        this.dispatchEvent(o, c ? "rightclick" : "click");
      } else o.pointerType === "touch" && this.dispatchEvent(o, "tap");
      this.dispatchEvent(o, "pointertap"), this.freeEvent(o);
    }
    this.freeEvent(s);
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
    if (!(e instanceof Fe)) {
      $("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const t = this.trackingData(e.pointerId), s = this.findMountedTarget(t.pressTargetsByButton[e.button]), i = this.createPointerEvent(e);
    if (s) {
      let n = s;
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
    if (!(e instanceof Mt)) {
      $("EventBoundary cannot map a non-wheel event as a wheel event");
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
    for (let s = 1; s < e.length && e[s].parent === t; s++)
      t = e[s];
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
  createPointerEvent(e, t, s) {
    const i = this.allocateEvent(Fe);
    return this.copyPointerData(e, i), this.copyMouseData(e, i), this.copyData(e, i), i.nativeEvent = e.nativeEvent, i.originalEvent = e, i.target = s ?? this.hitTest(i.global.x, i.global.y) ?? this._hitElements[0], typeof t == "string" && (i.type = t), i;
  }
  /**
   * Creates a wheel event whose {@code originalEvent} is {@code from}.
   *
   * The event is allocated using {@link EventBoundary#allocateEvent this.allocateEvent}.
   * @param from - The upstream wheel event.
   */
  createWheelEvent(e) {
    const t = this.allocateEvent(Mt);
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
    const s = this.allocateEvent(Fe);
    return s.nativeEvent = e.nativeEvent, s.originalEvent = e.originalEvent, this.copyPointerData(e, s), this.copyMouseData(e, s), this.copyData(e, s), s.target = e.target, s.path = e.composedPath().slice(), s.type = t ?? s.type, s;
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
    e instanceof Fe && t instanceof Fe && (t.pointerId = e.pointerId, t.width = e.width, t.height = e.height, t.isPrimary = e.isPrimary, t.pointerType = e.pointerType, t.pressure = e.pressure, t.tangentialPressure = e.tangentialPressure, t.tiltX = e.tiltX, t.tiltY = e.tiltY, t.twist = e.twist);
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
    e instanceof Vs && t instanceof Vs && (t.altKey = e.altKey, t.button = e.button, t.buttons = e.buttons, t.client.copyFrom(e.client), t.ctrlKey = e.ctrlKey, t.metaKey = e.metaKey, t.movement.copyFrom(e.movement), t.screen.copyFrom(e.screen), t.shiftKey = e.shiftKey, t.global.copyFrom(e.global));
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
    const s = e.currentTarget._events[t];
    if (s)
      if ("fn" in s)
        s.once && e.currentTarget.removeListener(t, s.fn, void 0, !0), s.fn.call(s.context, e);
      else
        for (let i = 0, n = s.length; i < n && !e.propagationImmediatelyStopped; i++)
          s[i].once && e.currentTarget.removeListener(t, s[i].fn, void 0, !0), s[i].fn.call(s[i].context, e);
  }
}
const Ip = 1, Gp = {
  touchstart: "pointerdown",
  touchend: "pointerup",
  touchendoutside: "pointerupoutside",
  touchmove: "pointermove",
  touchcancel: "pointercancel"
}, zi = class hi {
  /**
   * @param {Renderer} renderer
   */
  constructor(e) {
    this.supportsTouchEvents = "ontouchstart" in globalThis, this.supportsPointerEvents = !!globalThis.PointerEvent, this.domElement = null, this.resolution = 1, this.renderer = e, this.rootBoundary = new kp(null), st.init(this), this.autoPreventDefault = !0, this._eventsAdded = !1, this._rootPointerEvent = new Fe(null), this._rootWheelEvent = new Mt(null), this.cursorStyles = {
      default: "inherit",
      pointer: "pointer"
    }, this.features = new Proxy({ ...hi.defaultEventFeatures }, {
      set: (t, s, i) => (s === "globalMove" && (this.rootBoundary.enableGlobalMoveEvents = i), t[s] = i, !0)
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
    const { canvas: t, resolution: s } = this.renderer;
    this.setTargetElement(t), this.resolution = s, hi._defaultEventMode = e.eventMode ?? "passive", Object.assign(this.features, e.eventFeatures ?? {}), this.rootBoundary.enableGlobalMoveEvents = this.features.globalMove;
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
    const s = this.cursorStyles[e];
    if (s)
      switch (typeof s) {
        case "string":
          t && (this.domElement.style.cursor = s);
          break;
        case "function":
          s(e);
          break;
        case "object":
          t && Object.assign(this.domElement.style, s);
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
    for (let s = 0, i = t.length; s < i; s++) {
      const n = t[s], a = this._bootstrapEvent(this._rootPointerEvent, n);
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
    for (let s = 0, i = t.length; s < i; s++) {
      const n = this._bootstrapEvent(this._rootPointerEvent, t[s]);
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
    const s = t !== this.domElement ? "outside" : "", i = this._normalizeToPointerData(e);
    for (let n = 0, a = i.length; n < a; n++) {
      const o = this._bootstrapEvent(this._rootPointerEvent, i[n]);
      o.type += s, this.rootBoundary.mapEvent(o);
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
    for (let s = 0, i = t.length; s < i; s++) {
      const n = this._bootstrapEvent(this._rootPointerEvent, t[s]);
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
  mapPositionToPoint(e, t, s) {
    const i = this.domElement.isConnected ? this.domElement.getBoundingClientRect() : {
      width: this.domElement.width,
      height: this.domElement.height,
      left: 0,
      top: 0
    }, n = 1 / this.resolution;
    e.x = (t - i.left) * (this.domElement.width / i.width) * n, e.y = (s - i.top) * (this.domElement.height / i.height) * n;
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
      for (let s = 0, i = e.changedTouches.length; s < i; s++) {
        const n = e.changedTouches[s];
        typeof n.button > "u" && (n.button = 0), typeof n.buttons > "u" && (n.buttons = 1), typeof n.isPrimary > "u" && (n.isPrimary = e.touches.length === 1 && e.type === "touchstart"), typeof n.width > "u" && (n.width = n.radiusX || 1), typeof n.height > "u" && (n.height = n.radiusY || 1), typeof n.tiltX > "u" && (n.tiltX = 0), typeof n.tiltY > "u" && (n.tiltY = 0), typeof n.pointerType > "u" && (n.pointerType = "touch"), typeof n.pointerId > "u" && (n.pointerId = n.identifier || 0), typeof n.pressure > "u" && (n.pressure = n.force || 0.5), typeof n.twist > "u" && (n.twist = 0), typeof n.tangentialPressure > "u" && (n.tangentialPressure = 0), typeof n.layerX > "u" && (n.layerX = n.offsetX = n.clientX), typeof n.layerY > "u" && (n.layerY = n.offsetY = n.clientY), n.isNormalized = !0, n.type = e.type, t.push(n);
      }
    else if (!globalThis.MouseEvent || e instanceof MouseEvent && (!this.supportsPointerEvents || !(e instanceof globalThis.PointerEvent))) {
      const s = e;
      typeof s.isPrimary > "u" && (s.isPrimary = !0), typeof s.width > "u" && (s.width = 1), typeof s.height > "u" && (s.height = 1), typeof s.tiltX > "u" && (s.tiltX = 0), typeof s.tiltY > "u" && (s.tiltY = 0), typeof s.pointerType > "u" && (s.pointerType = "mouse"), typeof s.pointerId > "u" && (s.pointerId = Ip), typeof s.pressure > "u" && (s.pressure = 0.5), typeof s.twist > "u" && (s.twist = 0), typeof s.tangentialPressure > "u" && (s.tangentialPressure = 0), s.isNormalized = !0, t.push(s);
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
    return e.originalEvent = null, e.nativeEvent = t, e.pointerId = t.pointerId, e.width = t.width, e.height = t.height, e.isPrimary = t.isPrimary, e.pointerType = t.pointerType, e.pressure = t.pressure, e.tangentialPressure = t.tangentialPressure, e.tiltX = t.tiltX, e.tiltY = t.tiltY, e.twist = t.twist, this._transferMouseData(e, t), this.mapPositionToPoint(e.screen, t.clientX, t.clientY), e.global.copyFrom(e.screen), e.offset.copyFrom(e.screen), e.isTrusted = t.isTrusted, e.type === "pointerleave" && (e.type = "pointerout"), e.type.startsWith("mouse") && (e.type = e.type.replace("mouse", "pointer")), e.type.startsWith("touch") && (e.type = Gp[e.type] || e.type), e;
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
zi.extension = {
  name: "events",
  type: [
    T.WebGLSystem,
    T.CanvasSystem,
    T.WebGPUSystem
  ],
  priority: -1
};
zi.defaultEventFeatures = {
  /** Enables pointer events associated with pointer movement. */
  move: !0,
  /** Enables global pointer move events. */
  globalMove: !0,
  /** Enables pointer events associated with clicking. */
  click: !0,
  /** Enables wheel events. */
  wheel: !0
};
let bh = zi;
const Up = {
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
  set interactive(r) {
    this.eventMode = r ? "static" : "passive";
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
    return this._internalEventMode ?? bh.defaultEventMode;
  },
  set eventMode(r) {
    this._internalEventMode = r;
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
  addEventListener(r, e, t) {
    const s = typeof t == "boolean" && t || typeof t == "object" && t.capture, i = typeof t == "object" ? t.signal : void 0, n = typeof t == "object" ? t.once === !0 : !1, a = typeof e == "function" ? void 0 : e;
    r = s ? `${r}capture` : r;
    const o = typeof e == "function" ? e : e.handleEvent, h = this;
    i && i.addEventListener("abort", () => {
      h.off(r, o, a);
    }), n ? h.once(r, o, a) : h.on(r, o, a);
  },
  /**
   * Unlike `off` or `removeListener` which are methods from EventEmitter, `removeEventListener`
   * seeks to be compatible with the DOM's `removeEventListener` with support for options.
   * @memberof scene.Container
   * @param type - The type of event the listener is bound to.
   * @param listener - The listener callback or object.
   * @param options - The original listener options. This is required to deregister a capture phase listener.
   */
  removeEventListener(r, e, t) {
    const s = typeof t == "boolean" && t || typeof t == "object" && t.capture, i = typeof e == "function" ? void 0 : e;
    r = s ? `${r}capture` : r, e = typeof e == "function" ? e : e.handleEvent, this.off(r, e, i);
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
  dispatchEvent(r) {
    if (!(r instanceof ns))
      throw new Error("Container cannot propagate events outside of the Federated Events API");
    return r.defaultPrevented = !1, r.path = null, r.target = this, r.manager.dispatchEvent(r), !r.defaultPrevented;
  }
};
class vh {
  constructor(e) {
    this._renderer = e;
  }
  push(e, t, s) {
    this._renderer.renderPipes.batch.break(s), s.add({
      renderPipeId: "filter",
      canBundle: !1,
      action: "pushFilter",
      container: t,
      filterEffect: e
    });
  }
  pop(e, t, s) {
    this._renderer.renderPipes.batch.break(s), s.add({
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
vh.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "filter"
};
function Fp(r, e) {
  e.clear();
  const t = e.matrix;
  for (let s = 0; s < r.length; s++) {
    const i = r[s];
    i.globalDisplayStatus < 7 || (e.matrix = i.worldTransform, e.addBounds(i.bounds));
  }
  return e.matrix = t, e;
}
const Dp = new Gt({
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
class Th {
  constructor(e) {
    this._filterStackIndex = 0, this._filterStack = [], this._filterGlobalUniforms = new ve({
      uInputSize: { value: new Float32Array(4), type: "vec4<f32>" },
      uInputPixel: { value: new Float32Array(4), type: "vec4<f32>" },
      uInputClamp: { value: new Float32Array(4), type: "vec4<f32>" },
      uOutputFrame: { value: new Float32Array(4), type: "vec4<f32>" },
      uGlobalFrame: { value: new Float32Array(4), type: "vec4<f32>" },
      uOutputTexture: { value: new Float32Array(4), type: "vec4<f32>" }
    }), this._globalFilterBindGroup = new Ze({}), this.renderer = e;
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
    const t = this.renderer, s = e.filterEffect.filters;
    this._filterStack[this._filterStackIndex] || (this._filterStack[this._filterStackIndex] = this._getFilterData());
    const i = this._filterStack[this._filterStackIndex];
    if (this._filterStackIndex++, s.length === 0) {
      i.skip = !0;
      return;
    }
    const n = i.bounds;
    if (e.renderables ? Fp(e.renderables, n) : e.filterEffect.filterArea ? (n.clear(), n.addRect(e.filterEffect.filterArea), n.applyMatrix(e.container.worldTransform)) : e.container.getFastGlobalBounds(!0, n), e.container) {
      const g = (e.container.renderGroup || e.container.parentRenderGroup).cacheToLocalTransform;
      g && n.applyMatrix(g);
    }
    const a = t.renderTarget.renderTarget.colorTexture.source;
    let o = 1 / 0, h = 0, c = !0, l = !1, u = !1, d = !0;
    for (let p = 0; p < s.length; p++) {
      const g = s[p];
      if (o = Math.min(o, g.resolution === "inherit" ? a._resolution : g.resolution), h += g.padding, g.antialias === "off" ? c = !1 : g.antialias === "inherit" && c && (c = a.antialias), g.clipToViewport || (d = !1), !!!(g.compatibleRenderers & t.type)) {
        u = !1;
        break;
      }
      if (g.blendRequired && !(((f = t.backBuffer) == null ? void 0 : f.useBackBuffer) ?? !0)) {
        $("Blend filter requires backBuffer on WebGL renderer to be enabled. Set `useBackBuffer: true` in the renderer options."), u = !1;
        break;
      }
      u = g.enabled || u, l || (l = g.blendRequired);
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
    i.skip = !1, i.bounds = n, i.blendRequired = l, i.container = e.container, i.filterEffect = e.filterEffect, i.previousRenderSurface = t.renderTarget.renderSurface, i.inputTexture = xe.getOptimalTexture(
      n.width,
      n.height,
      o,
      c
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
    const s = t.inputTexture, i = t.bounds;
    let n = H.EMPTY;
    if (e.renderTarget.finishRenderPass(), t.blendRequired) {
      const o = this._filterStackIndex > 0 ? this._filterStack[this._filterStackIndex - 1].bounds : null, h = e.renderTarget.getRenderTarget(t.previousRenderSurface);
      n = this.getBackTexture(h, i, o);
    }
    t.backTexture = n;
    const a = t.filterEffect.filters;
    if (this._globalFilterBindGroup.setResource(s.source.style, 2), this._globalFilterBindGroup.setResource(n.source, 3), e.globalUniforms.pop(), a.length === 1)
      a[0].apply(this, s, t.previousRenderSurface, !1), xe.returnTexture(s);
    else {
      let o = t.inputTexture, h = xe.getOptimalTexture(
        i.width,
        i.height,
        o.source._resolution,
        !1
      ), c = 0;
      for (c = 0; c < a.length - 1; ++c) {
        a[c].apply(this, o, h, !0);
        const u = o;
        o = h, h = u;
      }
      a[c].apply(this, o, t.previousRenderSurface, !1), xe.returnTexture(o), xe.returnTexture(h);
    }
    t.blendRequired && xe.returnTexture(n);
  }
  getBackTexture(e, t, s) {
    const i = e.colorTexture.source._resolution, n = xe.getOptimalTexture(
      t.width,
      t.height,
      i,
      !1
    );
    let a = t.minX, o = t.minY;
    s && (a -= s.minX, o -= s.minY), a = Math.floor(a * i), o = Math.floor(o * i);
    const h = Math.ceil(t.width * i), c = Math.ceil(t.height * i);
    return this.renderer.renderTarget.copyToTexture(
      e,
      n,
      { x: a, y: o },
      { width: h, height: c },
      { x: 0, y: 0 }
    ), n;
  }
  applyFilter(e, t, s, i) {
    const n = this.renderer, a = this._filterStack[this._filterStackIndex], o = a.bounds, h = he.shared, l = a.previousRenderSurface === s;
    let u = this.renderer.renderTarget.rootRenderTarget.colorTexture.source._resolution, d = this._filterStackIndex - 1;
    for (; d > 0 && this._filterStack[d].skip; )
      --d;
    d > 0 && (u = this._filterStack[d].inputTexture.source._resolution);
    const f = this._filterGlobalUniforms, p = f.uniforms, g = p.uOutputFrame, m = p.uInputSize, y = p.uInputPixel, x = p.uInputClamp, v = p.uGlobalFrame, A = p.uOutputTexture;
    if (l) {
      let C = this._filterStackIndex;
      for (; C > 0; ) {
        C--;
        const F = this._filterStack[this._filterStackIndex - 1];
        if (!F.skip) {
          h.x = F.bounds.minX, h.y = F.bounds.minY;
          break;
        }
      }
      g[0] = o.minX - h.x, g[1] = o.minY - h.y;
    } else
      g[0] = 0, g[1] = 0;
    g[2] = t.frame.width, g[3] = t.frame.height, m[0] = t.source.width, m[1] = t.source.height, m[2] = 1 / m[0], m[3] = 1 / m[1], y[0] = t.source.pixelWidth, y[1] = t.source.pixelHeight, y[2] = 1 / y[0], y[3] = 1 / y[1], x[0] = 0.5 * y[2], x[1] = 0.5 * y[3], x[2] = t.frame.width * m[2] - 0.5 * y[2], x[3] = t.frame.height * m[3] - 0.5 * y[3];
    const M = this.renderer.renderTarget.rootRenderTarget.colorTexture;
    v[0] = h.x * u, v[1] = h.y * u, v[2] = M.source.width * u, v[3] = M.source.height * u;
    const w = this.renderer.renderTarget.getRenderTarget(s);
    if (n.renderTarget.bind(s, !!i), s instanceof H ? (A[0] = s.frame.width, A[1] = s.frame.height) : (A[0] = w.width, A[1] = w.height), A[2] = w.isRoot ? -1 : 1, f.update(), n.renderPipes.uniformBatch) {
      const C = n.renderPipes.uniformBatch.getUboResource(f);
      this._globalFilterBindGroup.setResource(C, 0);
    } else
      this._globalFilterBindGroup.setResource(f, 0);
    this._globalFilterBindGroup.setResource(t.source, 1), this._globalFilterBindGroup.setResource(t.source.style, 2), e.groups[0] = this._globalFilterBindGroup, n.encoder.draw({
      geometry: Dp,
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
    const s = this._activeFilterData, i = e.set(
      s.inputTexture._source.width,
      0,
      0,
      s.inputTexture._source.height,
      s.bounds.minX,
      s.bounds.minY
    ), n = t.worldTransform.copyTo(z.shared), a = t.renderGroup || t.parentRenderGroup;
    return a && a.cacheToLocalTransform && n.prepend(a.cacheToLocalTransform), n.invert(), i.prepend(n), i.scale(
      1 / t.texture.frame.width,
      1 / t.texture.frame.height
    ), i.translate(t.anchor.x, t.anchor.y), i;
  }
}
Th.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem
  ],
  name: "filter"
};
var Op = `in vec2 vMaskCoord;
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
`, Lp = `in vec2 aPosition;

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
`, Aa = `struct GlobalFilterUniforms {
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
class Np extends Nu {
  constructor(e) {
    const { sprite: t, ...s } = e, i = new ro(t.texture), n = new ve({
      uFilterMatrix: { value: new z(), type: "mat3x3<f32>" },
      uMaskClamp: { value: i.uClampFrame, type: "vec4<f32>" },
      uAlpha: { value: 1, type: "f32" },
      uInverse: { value: e.inverse ? 1 : 0, type: "f32" }
    }), a = _t.from({
      vertex: {
        source: Aa,
        entryPoint: "mainVertex"
      },
      fragment: {
        source: Aa,
        entryPoint: "mainFragment"
      }
    }), o = kt.from({
      vertex: Lp,
      fragment: Op,
      name: "mask-filter"
    });
    super({
      ...s,
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
  apply(e, t, s, i) {
    this._textureMatrix.texture = this.sprite.texture, e.calculateSpriteMatrix(
      this.resources.filterUniforms.uniforms.uFilterMatrix,
      this.sprite
    ).prepend(this._textureMatrix.mapCoord), this.resources.uMaskTexture = this.sprite.texture.source, e.applyFilter(this, t, s, i);
  }
}
function Ca(r, e, t, s, i, n, a, o) {
  const h = a - t, c = o - s, l = i - t, u = n - s, d = r - t, f = e - s, p = h * h + c * c, g = h * l + c * u, m = h * d + c * f, y = l * l + u * u, x = l * d + u * f, v = 1 / (p * y - g * g), A = (y * m - g * x) * v, M = (p * x - g * m) * v;
  return A >= 0 && M >= 0 && A + M < 1;
}
class Bt extends Xs {
  /**
   * @param options - Options for the Graphics.
   */
  constructor(e) {
    e instanceof Re && (e = { context: e });
    const { context: t, roundPixels: s, ...i } = e || {};
    super({
      label: "Graphics",
      ...i
    }), this.renderPipeId = "graphics", t ? this._context = t : this._context = this._ownedContext = new Re(), this._context.on("update", this.onViewUpdate, this), this.allowChildren = !1, this.roundPixels = s ?? !1;
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
    return e ? new Bt(this._context.clone()) : (this._ownedContext = null, new Bt(this._context));
  }
  // -------- v7 deprecations ---------
  /**
   * @param width
   * @param color
   * @param alpha
   * @deprecated since 8.0.0 Use {@link Graphics#setStrokeStyle} instead
   */
  lineStyle(e, t, s) {
    j(q, "Graphics#lineStyle is no longer needed. Use Graphics#setStrokeStyle to set the stroke style.");
    const i = {};
    return e && (i.width = e), t && (i.color = t), s && (i.alpha = s), this.context.strokeStyle = i, this;
  }
  /**
   * @param color
   * @param alpha
   * @deprecated since 8.0.0 Use {@link Graphics#fill} instead
   */
  beginFill(e, t) {
    j(q, "Graphics#beginFill is no longer needed. Use Graphics#fill to fill the shape with the desired style.");
    const s = {};
    return e !== void 0 && (s.color = e), t !== void 0 && (s.alpha = t), this.context.fillStyle = s, this;
  }
  /**
   * @deprecated since 8.0.0 Use {@link Graphics#fill} instead
   */
  endFill() {
    j(q, "Graphics#endFill is no longer needed. Use Graphics#fill to fill the shape with the desired style."), this.context.fill();
    const e = this.context.strokeStyle;
    return (e.width !== Re.defaultStrokeStyle.width || e.color !== Re.defaultStrokeStyle.color || e.alpha !== Re.defaultStrokeStyle.alpha) && this.context.stroke(), this;
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#circle} instead
   */
  drawCircle(...e) {
    return j(q, "Graphics#drawCircle has been renamed to Graphics#circle"), this._callContextMethod("circle", e);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#ellipse} instead
   */
  drawEllipse(...e) {
    return j(q, "Graphics#drawEllipse has been renamed to Graphics#ellipse"), this._callContextMethod("ellipse", e);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#poly} instead
   */
  drawPolygon(...e) {
    return j(q, "Graphics#drawPolygon has been renamed to Graphics#poly"), this._callContextMethod("poly", e);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#rect} instead
   */
  drawRect(...e) {
    return j(q, "Graphics#drawRect has been renamed to Graphics#rect"), this._callContextMethod("rect", e);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#roundRect} instead
   */
  drawRoundedRect(...e) {
    return j(q, "Graphics#drawRoundedRect has been renamed to Graphics#roundRect"), this._callContextMethod("roundRect", e);
  }
  /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#star} instead
   */
  drawStar(...e) {
    return j(q, "Graphics#drawStar has been renamed to Graphics#star"), this._callContextMethod("star", e);
  }
}
const Sh = class wh extends Gt {
  constructor(...e) {
    let t = e[0] ?? {};
    t instanceof Float32Array && (j(q, "use new MeshGeometry({ positions, uvs, indices }) instead"), t = {
      positions: t,
      uvs: e[1],
      indices: e[2]
    }), t = { ...wh.defaultOptions, ...t };
    const s = t.positions || new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    let i = t.uvs;
    i || (t.positions ? i = new Float32Array(s.length) : i = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]));
    const n = t.indices || new Uint32Array([0, 1, 2, 0, 2, 3]), a = t.shrinkBuffersToFit, o = new Me({
      data: s,
      label: "attribute-mesh-positions",
      shrinkToFit: a,
      usage: Q.VERTEX | Q.COPY_DST
    }), h = new Me({
      data: i,
      label: "attribute-mesh-uvs",
      shrinkToFit: a,
      usage: Q.VERTEX | Q.COPY_DST
    }), c = new Me({
      data: n,
      label: "index-mesh-buffer",
      shrinkToFit: a,
      usage: Q.INDEX | Q.COPY_DST
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
      indexBuffer: c,
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
Sh.defaultOptions = {
  topology: "triangle-list",
  shrinkBuffersToFit: !1
};
let mt = Sh;
class ws extends Xs {
  constructor(...e) {
    let t = e[0];
    t instanceof Gt && (j(q, "Mesh: use new Mesh({ geometry, shader }) instead"), t = {
      geometry: t,
      shader: e[1]
    }, e[3] && (j(q, "Mesh: drawMode argument has been removed, use geometry.topology instead"), t.geometry.topology = e[3]));
    const { geometry: s, shader: i, texture: n, roundPixels: a, state: o, ...h } = t;
    super({
      label: "Mesh",
      ...h
    }), this.renderPipeId = "mesh", this._shader = null, this.allowChildren = !1, this.shader = i ?? null, this.texture = n ?? (i == null ? void 0 : i.texture) ?? H.WHITE, this.state = o ?? Ie.for2d(), this._geometry = s, this._geometry.on("update", this.onViewUpdate, this), this.roundPixels = a ?? !1;
  }
  /** Alias for {@link scene.Mesh#shader}. */
  get material() {
    return j(q, "mesh.material property has been removed, use mesh.shader instead"), this._shader;
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
    e || (e = H.EMPTY);
    const t = this._texture;
    t !== e && (t && t.dynamic && t.off("update", this.onViewUpdate, this), e.dynamic && e.on("update", this.onViewUpdate, this), this.shader && (this.shader.texture = e), this._texture = e, this.onViewUpdate());
  }
  get texture() {
    return this._texture;
  }
  get batched() {
    return this._shader || (this.state.data & 12) !== 0 ? !1 : this._geometry instanceof mt ? this._geometry.batchMode === "auto" ? this._geometry.positions.length / 2 <= 100 : this._geometry.batchMode === "batch" : !1;
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
    const { x: t, y: s } = e;
    if (!this.bounds.containsPoint(t, s))
      return !1;
    const i = this.geometry.getBuffer("aPosition").data, n = this.geometry.topology === "triangle-strip" ? 3 : 1;
    if (this.geometry.getIndex()) {
      const a = this.geometry.getIndex().data, o = a.length;
      for (let h = 0; h + 2 < o; h += n) {
        const c = a[h] * 2, l = a[h + 1] * 2, u = a[h + 2] * 2;
        if (Ca(
          t,
          s,
          i[c],
          i[c + 1],
          i[l],
          i[l + 1],
          i[u],
          i[u + 1]
        ))
          return !0;
      }
    } else {
      const a = i.length / 2;
      for (let o = 0; o + 2 < a; o += n) {
        const h = o * 2, c = (o + 1) * 2, l = (o + 2) * 2;
        if (Ca(
          t,
          s,
          i[h],
          i[h + 1],
          i[c],
          i[c + 1],
          i[l],
          i[l + 1]
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
    var s;
    if (super.destroy(e), typeof e == "boolean" ? e : e == null ? void 0 : e.texture) {
      const i = typeof e == "boolean" ? e : e == null ? void 0 : e.textureSource;
      this._texture.destroy(i);
    }
    (s = this._geometry) == null || s.off("update", this.onViewUpdate, this), this._texture = null, this._geometry = null, this._shader = null;
  }
}
class Hp extends Xs {
  constructor(e, t) {
    const { text: s, resolution: i, style: n, anchor: a, width: o, height: h, roundPixels: c, ...l } = e;
    super({
      ...l
    }), this.batched = !0, this._resolution = null, this._autoResolution = !0, this._didTextUpdate = !0, this._styleClass = t, this.text = s ?? "", this.style = n, this.resolution = i ?? null, this.allowChildren = !1, this._anchor = new Se(
      {
        _onUpdate: () => {
          this.onViewUpdate();
        }
      }
    ), a && (this.anchor = a), this.roundPixels = c ?? !1, o !== void 0 && (this.width = o), h !== void 0 && (this.height = h);
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
    const t = this.bounds.width, s = this.bounds.height, i = -t * this.anchor.x;
    let n = 0;
    return e.x >= i && e.x <= i + t && (n = -s * this.anchor.y, e.y >= n && e.y <= n + s);
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
function Wp(r, e) {
  let t = r[0] ?? {};
  return (typeof t == "string" || r[1]) && (j(q, `use new ${e}({ text: "hi!", style }) instead`), t = {
    text: t,
    style: r[1]
  }), t;
}
class zp extends Hp {
  constructor(...e) {
    const t = Wp(e, "Text");
    super(t, Je), this.renderPipeId = "text";
  }
  /** @private */
  updateBounds() {
    const e = this._bounds, t = this._anchor, s = Ye.measureText(
      this._text,
      this._style
    ), { width: i, height: n } = s;
    e.minX = -t._x * i, e.maxX = e.minX + i, e.minY = -t._y * n, e.maxY = e.minY + n;
  }
}
function Vp(r) {
  const e = r._stroke, t = r._fill, i = [`div { ${[
    `color: ${ae.shared.setValue(t.color).toHex()}`,
    `font-size: ${r.fontSize}px`,
    `font-family: ${r.fontFamily}`,
    `font-weight: ${r.fontWeight}`,
    `font-style: ${r.fontStyle}`,
    `font-variant: ${r.fontVariant}`,
    `letter-spacing: ${r.letterSpacing}px`,
    `text-align: ${r.align}`,
    `padding: ${r.padding}px`,
    `white-space: ${r.whiteSpace === "pre" && r.wordWrap ? "pre-wrap" : r.whiteSpace}`,
    ...r.lineHeight ? [`line-height: ${r.lineHeight}px`] : [],
    ...r.wordWrap ? [
      `word-wrap: ${r.breakWords ? "break-all" : "break-word"}`,
      `max-width: ${r.wordWrapWidth}px`
    ] : [],
    ...e ? [Ch(e)] : [],
    ...r.dropShadow ? [Ah(r.dropShadow)] : [],
    ...r.cssOverrides
  ].join(";")} }`];
  return $p(r.tagStyles, i), i.join(" ");
}
function Ah(r) {
  const e = ae.shared.setValue(r.color).setAlpha(r.alpha).toHexa(), t = Math.round(Math.cos(r.angle) * r.distance), s = Math.round(Math.sin(r.angle) * r.distance), i = `${t}px ${s}px`;
  return r.blur > 0 ? `text-shadow: ${i} ${r.blur}px ${e}` : `text-shadow: ${i} ${e}`;
}
function Ch(r) {
  return [
    `-webkit-text-stroke-width: ${r.width}px`,
    `-webkit-text-stroke-color: ${ae.shared.setValue(r.color).toHex()}`,
    `text-stroke-width: ${r.width}px`,
    `text-stroke-color: ${ae.shared.setValue(r.color).toHex()}`,
    "paint-order: stroke"
  ].join(";");
}
const Pa = {
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
}, Ea = {
  fill: (r) => `color: ${ae.shared.setValue(r).toHex()}`,
  breakWords: (r) => `word-wrap: ${r ? "break-all" : "break-word"}`,
  stroke: Ch,
  dropShadow: Ah
};
function $p(r, e) {
  for (const t in r) {
    const s = r[t], i = [];
    for (const n in s)
      Ea[n] ? i.push(Ea[n](s[n])) : Pa[n] && i.push(Pa[n].replace("{{VALUE}}", s[n]));
    e.push(`${t} { ${i.join(";")} }`);
  }
}
class Vi extends Je {
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
    return this._styleKey = hh(this) + this._cssOverrides.join("-"), this._styleKey;
  }
  update() {
    this._cssStyle = null, super.update();
  }
  /**
   * Creates a new HTMLTextStyle object with the same values as this one.
   * @returns New cloned HTMLTextStyle object
   */
  clone() {
    return new Vi({
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
    return this._cssStyle || (this._cssStyle = Vp(this)), this._cssStyle;
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
    const t = e.filter((s) => !this.cssOverrides.includes(s));
    t.length > 0 && (this.cssOverrides.push(...t), this.update());
  }
  /**
   * Remove any overrides that match the value.
   * @param {string} value - CSS style to remove.
   * @example
   * style.removeOverride('background-color: red');
   */
  removeOverride(...e) {
    const t = e.filter((s) => this.cssOverrides.includes(s));
    t.length > 0 && (this.cssOverrides = this.cssOverrides.filter((s) => !t.includes(s)), this.update());
  }
  set fill(e) {
    typeof e != "string" && typeof e != "number" && $("[HTMLTextStyle] only color fill is not supported by HTMLText"), super.fill = e;
  }
  set stroke(e) {
    e && typeof e != "string" && typeof e != "number" && $("[HTMLTextStyle] only color stroke is not supported by HTMLText"), super.stroke = e;
  }
}
const Ma = "http://www.w3.org/2000/svg", Ba = "http://www.w3.org/1999/xhtml";
class Ph {
  constructor() {
    this.svgRoot = document.createElementNS(Ma, "svg"), this.foreignObject = document.createElementNS(Ma, "foreignObject"), this.domElement = document.createElementNS(Ba, "div"), this.styleElement = document.createElementNS(Ba, "style"), this.image = new Image();
    const { foreignObject: e, svgRoot: t, styleElement: s, domElement: i } = this;
    e.setAttribute("width", "10000"), e.setAttribute("height", "10000"), e.style.overflow = "hidden", t.appendChild(e), e.appendChild(s), e.appendChild(i);
  }
}
let Ra;
function Xp(r, e, t, s) {
  s || (s = Ra || (Ra = new Ph()));
  const { domElement: i, styleElement: n, svgRoot: a } = s;
  i.innerHTML = `<style>${e.cssStyle};</style><div style='padding:0'>${r}</div>`, i.setAttribute("style", "transform-origin: top left; display: inline-block"), t && (n.textContent = t), document.body.appendChild(a);
  const o = i.getBoundingClientRect();
  a.remove();
  const h = e.padding * 2;
  return {
    width: o.width - h,
    height: o.height - h
  };
}
class Eh {
  constructor() {
    this._tempState = Ie.for2d(), this._didUploadHash = {};
  }
  init(e) {
    e.renderer.runners.contextChange.add(this);
  }
  contextChange() {
    this._didUploadHash = {};
  }
  start(e, t, s) {
    const i = e.renderer, n = this._didUploadHash[s.uid];
    i.shader.bind(s, n), n || (this._didUploadHash[s.uid] = !0), i.shader.updateUniformGroup(i.globalUniforms.uniformGroup), i.geometry.bind(t, s.glProgram);
  }
  execute(e, t) {
    const s = e.renderer;
    this._tempState.blendMode = t.blendMode, s.state.set(this._tempState);
    const i = t.textures.textures;
    for (let n = 0; n < t.textures.count; n++)
      s.texture.bind(i[n], n);
    s.geometry.draw(t.topology, t.size, t.start);
  }
}
Eh.extension = {
  type: [
    T.WebGLPipesAdaptor
  ],
  name: "batch"
};
const As = Ie.for2d();
class Mh {
  start(e, t, s) {
    const i = e.renderer, n = i.encoder, a = s.gpuProgram;
    this._shader = s, this._geometry = t, n.setGeometry(t, a), As.blendMode = "normal", i.pipeline.getPipeline(
      t,
      a,
      As
    );
    const o = i.globalUniforms.bindGroup;
    n.resetBindGroup(1), n.setBindGroup(0, o, a);
  }
  execute(e, t) {
    const s = this._shader.gpuProgram, i = e.renderer, n = i.encoder;
    if (!t.bindGroup) {
      const h = t.textures;
      t.bindGroup = Ei(h.textures, h.count);
    }
    As.blendMode = t.blendMode;
    const a = i.bindGroup.getBindGroup(
      t.bindGroup,
      s,
      1
    ), o = i.pipeline.getPipeline(
      this._geometry,
      s,
      As,
      t.topology
    );
    t.bindGroup._touch(i.textureGC.count), n.setPipeline(o), n.renderPassEncoder.setBindGroup(1, a), n.renderPassEncoder.drawIndexed(t.size, 1, t.start);
  }
}
Mh.extension = {
  type: [
    T.WebGPUPipesAdaptor
  ],
  name: "batch"
};
const $i = class Bh {
  constructor(e, t) {
    var s, i;
    this.state = Ie.for2d(), this._batchersByInstructionSet = /* @__PURE__ */ Object.create(null), this._activeBatches = /* @__PURE__ */ Object.create(null), this.renderer = e, this._adaptor = t, (i = (s = this._adaptor).init) == null || i.call(s, this);
  }
  static getBatcher(e) {
    return new this._availableBatchers[e]();
  }
  buildStart(e) {
    let t = this._batchersByInstructionSet[e.uid];
    t || (t = this._batchersByInstructionSet[e.uid] = /* @__PURE__ */ Object.create(null), t.default || (t.default = new Gi())), this._activeBatches = t, this._activeBatch = this._activeBatches.default;
    for (const s in this._activeBatches)
      this._activeBatches[s].begin();
  }
  addToBatch(e, t) {
    if (this._activeBatch.name !== e.batcherName) {
      this._activeBatch.break(t);
      let s = this._activeBatches[e.batcherName];
      s || (s = this._activeBatches[e.batcherName] = Bh.getBatcher(e.batcherName), s.begin()), this._activeBatch = s;
    }
    this._activeBatch.add(e);
  }
  break(e) {
    this._activeBatch.break(e);
  }
  buildEnd(e) {
    this._activeBatch.break(e);
    const t = this._activeBatches;
    for (const s in t) {
      const i = t[s], n = i.geometry;
      n.indexBuffer.setDataWithSize(i.indexBuffer, i.indexSize, !0), n.buffers[0].setDataWithSize(i.attributeBuffer.float32View, i.attributeSize, !1);
    }
  }
  upload(e) {
    const t = this._batchersByInstructionSet[e.uid];
    for (const s in t) {
      const i = t[s], n = i.geometry;
      i.dirty && (i.dirty = !1, n.buffers[0].update(i.attributeSize * 4));
    }
  }
  execute(e) {
    if (e.action === "startBatch") {
      const t = e.batcher, s = t.geometry, i = t.shader;
      this._adaptor.start(this, s, i);
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
$i.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "batch"
};
$i._availableBatchers = /* @__PURE__ */ Object.create(null);
let Rh = $i;
V.handleByMap(T.Batcher, Rh._availableBatchers);
V.add(Gi);
const Qt = {
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
}, jp = {
  ...Qt,
  vertex: {
    ...Qt.vertex,
    // replace the group!
    header: Qt.vertex.header.replace("group(1)", "group(2)")
  }
}, Xi = {
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
}, Yp = {
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
}, Kp = {
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
}, qp = new ye();
class Zp extends Fs {
  constructor() {
    super(), this.filters = [new Np({
      sprite: new Te(H.EMPTY),
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
class kh {
  constructor(e) {
    this._activeMaskStage = [], this._renderer = e;
  }
  push(e, t, s) {
    const i = this._renderer;
    if (i.renderPipes.batch.break(s), s.add({
      renderPipeId: "alphaMask",
      action: "pushMaskBegin",
      mask: e,
      inverse: t._maskOptions.inverse,
      canBundle: !1,
      maskedContainer: t
    }), e.inverse = t._maskOptions.inverse, e.renderMaskToTexture) {
      const n = e.mask;
      n.includeInBuild = !0, n.collectRenderables(
        s,
        i,
        null
      ), n.includeInBuild = !1;
    }
    i.renderPipes.batch.break(s), s.add({
      renderPipeId: "alphaMask",
      action: "pushMaskEnd",
      mask: e,
      maskedContainer: t,
      inverse: t._maskOptions.inverse,
      canBundle: !1
    });
  }
  pop(e, t, s) {
    this._renderer.renderPipes.batch.break(s), s.add({
      renderPipeId: "alphaMask",
      action: "popMaskEnd",
      mask: e,
      inverse: t._maskOptions.inverse,
      canBundle: !1
    });
  }
  execute(e) {
    const t = this._renderer, s = e.mask.renderMaskToTexture;
    if (e.action === "pushMaskBegin") {
      const i = Z.get(Zp);
      if (i.inverse = e.inverse, s) {
        e.mask.mask.measurable = !0;
        const n = yi(e.mask.mask, !0, qp);
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
      s && (t.type === Oe.WEBGL && t.renderTarget.finishRenderPass(), t.renderTarget.pop(), t.globalUniforms.pop()), t.filter.push({
        renderPipeId: "filter",
        action: "pushFilter",
        container: i.maskedContainer,
        filterEffect: i.filterEffect,
        canBundle: !1
      });
    } else if (e.action === "popMaskEnd") {
      t.filter.pop();
      const i = this._activeMaskStage.pop();
      s && xe.returnTexture(i.filterTexture), Z.return(i.filterEffect);
    }
  }
  destroy() {
    this._renderer = null, this._activeMaskStage = null;
  }
}
kh.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "alphaMask"
};
class Ih {
  constructor(e) {
    this._colorStack = [], this._colorStackIndex = 0, this._currentColor = 0, this._renderer = e;
  }
  buildStart() {
    this._colorStack[0] = 15, this._colorStackIndex = 1, this._currentColor = 15;
  }
  push(e, t, s) {
    this._renderer.renderPipes.batch.break(s);
    const n = this._colorStack;
    n[this._colorStackIndex] = n[this._colorStackIndex - 1] & e.mask;
    const a = this._colorStack[this._colorStackIndex];
    a !== this._currentColor && (this._currentColor = a, s.add({
      renderPipeId: "colorMask",
      colorMask: a,
      canBundle: !1
    })), this._colorStackIndex++;
  }
  pop(e, t, s) {
    this._renderer.renderPipes.batch.break(s);
    const n = this._colorStack;
    this._colorStackIndex--;
    const a = n[this._colorStackIndex - 1];
    a !== this._currentColor && (this._currentColor = a, s.add({
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
Ih.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "colorMask"
};
class Gh {
  constructor(e) {
    this._maskStackHash = {}, this._maskHash = /* @__PURE__ */ new WeakMap(), this._renderer = e;
  }
  push(e, t, s) {
    var i;
    const n = e, a = this._renderer;
    a.renderPipes.batch.break(s), a.renderPipes.blendMode.setBlendMode(n.mask, "none", s), s.add({
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
    h.instructionsStart = s.instructionSize, o.collectRenderables(
      s,
      a,
      null
    ), o.includeInBuild = !1, a.renderPipes.batch.break(s), s.add({
      renderPipeId: "stencilMask",
      action: "pushMaskEnd",
      mask: e,
      inverse: t._maskOptions.inverse,
      canBundle: !1
    });
    const c = s.instructionSize - h.instructionsStart - 1;
    h.instructionsLength = c;
    const l = a.renderTarget.renderTarget.uid;
    (i = this._maskStackHash)[l] ?? (i[l] = 0);
  }
  pop(e, t, s) {
    const i = e, n = this._renderer;
    n.renderPipes.batch.break(s), n.renderPipes.blendMode.setBlendMode(i.mask, "none", s), s.add({
      renderPipeId: "stencilMask",
      action: "popMaskBegin",
      inverse: t._maskOptions.inverse,
      canBundle: !1
    });
    const a = this._maskHash.get(e);
    for (let o = 0; o < a.instructionsLength; o++)
      s.instructions[s.instructionSize++] = s.instructions[a.instructionsStart++];
    s.add({
      renderPipeId: "stencilMask",
      action: "popMaskEnd",
      canBundle: !1
    });
  }
  execute(e) {
    var t;
    const s = this._renderer, i = s.renderTarget.renderTarget.uid;
    let n = (t = this._maskStackHash)[i] ?? (t[i] = 0);
    e.action === "pushMaskBegin" ? (s.renderTarget.ensureDepthStencil(), s.stencil.setStencilMode(me.RENDERING_MASK_ADD, n), n++, s.colorMask.setMask(0)) : e.action === "pushMaskEnd" ? (e.inverse ? s.stencil.setStencilMode(me.INVERSE_MASK_ACTIVE, n) : s.stencil.setStencilMode(me.MASK_ACTIVE, n), s.colorMask.setMask(15)) : e.action === "popMaskBegin" ? (s.colorMask.setMask(0), n !== 0 ? s.stencil.setStencilMode(me.RENDERING_MASK_REMOVE, n) : (s.renderTarget.clear(null, Pe.STENCIL), s.stencil.setStencilMode(me.DISABLED, n)), n--) : e.action === "popMaskEnd" && (e.inverse ? s.stencil.setStencilMode(me.INVERSE_MASK_ACTIVE, n) : s.stencil.setStencilMode(me.MASK_ACTIVE, n), s.colorMask.setMask(15)), this._maskStackHash[i] = n;
  }
  destroy() {
    this._renderer = null, this._maskStackHash = null, this._maskHash = null;
  }
}
Gh.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "stencilMask"
};
var Gs = /* @__PURE__ */ ((r) => (r[r.ELEMENT_ARRAY_BUFFER = 34963] = "ELEMENT_ARRAY_BUFFER", r[r.ARRAY_BUFFER = 34962] = "ARRAY_BUFFER", r[r.UNIFORM_BUFFER = 35345] = "UNIFORM_BUFFER", r))(Gs || {});
class Qp {
  constructor(e, t) {
    this._lastBindBaseLocation = -1, this._lastBindCallId = -1, this.buffer = e || null, this.updateID = -1, this.byteLength = -1, this.type = t;
  }
}
class Uh {
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
    const { _gl: t } = this, s = this.getGlBuffer(e);
    t.bindBuffer(s.type, s.buffer);
  }
  /**
   * Binds an uniform buffer to at the given index.
   *
   * A cache is used so a buffer will not be bound again if already bound.
   * @param glBuffer - the buffer to bind
   * @param index - the base index to bind it to.
   */
  bindBufferBase(e, t) {
    const { _gl: s } = this;
    this._boundBufferBases[t] !== e && (this._boundBufferBases[t] = e, e._lastBindBaseLocation = t, s.bindBufferBase(s.UNIFORM_BUFFER, t, e.buffer));
  }
  nextBindBase(e) {
    this._bindCallId++, this._minBaseLocation = 0, e && (this._boundBufferBases[0] = null, this._minBaseLocation = 1, this._nextBindBaseIndex < 1 && (this._nextBindBaseIndex = 1));
  }
  freeLocationForBufferBase(e) {
    let t = this.getLastBindBaseLocation(e);
    if (t >= this._minBaseLocation)
      return e._lastBindCallId = this._bindCallId, t;
    let s = 0, i = this._nextBindBaseIndex;
    for (; s < 2; ) {
      i >= this._maxBindings && (i = this._minBaseLocation, s++);
      const n = this._boundBufferBases[i];
      if (n && n._lastBindCallId === this._bindCallId) {
        i++;
        continue;
      }
      break;
    }
    return t = i, this._nextBindBaseIndex = i + 1, s >= 2 ? -1 : (e._lastBindCallId = this._bindCallId, this._boundBufferBases[t] = null, t);
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
  bindBufferRange(e, t, s, i) {
    const { _gl: n } = this;
    s || (s = 0), t || (t = 0), this._boundBufferBases[t] = null, n.bindBufferRange(n.UNIFORM_BUFFER, t || 0, e.buffer, s * 256, i || 256);
  }
  /**
   * Will ensure the data in the buffer is uploaded to the GPU.
   * @param {Buffer} buffer - the buffer to update
   */
  updateBuffer(e) {
    const { _gl: t } = this, s = this.getGlBuffer(e);
    if (e._updateID === s.updateID)
      return s;
    s.updateID = e._updateID, t.bindBuffer(s.type, s.buffer);
    const i = e.data, n = e.descriptor.usage & Q.STATIC ? t.STATIC_DRAW : t.DYNAMIC_DRAW;
    return i ? s.byteLength >= i.byteLength ? t.bufferSubData(s.type, 0, i, 0, e._updateSize / i.BYTES_PER_ELEMENT) : (s.byteLength = i.byteLength, t.bufferData(s.type, i, n)) : (s.byteLength = e.descriptor.size, t.bufferData(s.type, s.byteLength, n)), s;
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
    const s = this._gpuBuffers[e.uid], i = this._gl;
    t || i.deleteBuffer(s.buffer), this._gpuBuffers[e.uid] = null;
  }
  /**
   * creates and attaches a GLBuffer object tied to the current context.
   * @param buffer
   * @protected
   */
  createGLBuffer(e) {
    const { _gl: t } = this;
    let s = Gs.ARRAY_BUFFER;
    e.descriptor.usage & Q.INDEX ? s = Gs.ELEMENT_ARRAY_BUFFER : e.descriptor.usage & Q.UNIFORM && (s = Gs.UNIFORM_BUFFER);
    const i = new Qp(t.createBuffer(), s);
    return this._gpuBuffers[e.uid] = i, e.on("destroy", this.onBufferDestroy, this), i;
  }
  resetState() {
    this._boundBufferBases = /* @__PURE__ */ Object.create(null);
  }
}
Uh.extension = {
  type: [
    T.WebGLSystem
  ],
  name: "buffer"
};
const ji = class Fh {
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
    e = { ...Fh.defaultOptions, ...e };
    let t = this.multiView = e.multiView;
    if (e.context && t && ($("Renderer created with both a context and multiview enabled. Disabling multiView as both cannot work together."), t = !1), t ? this.canvas = J.get().createCanvas(this._renderer.canvas.width, this._renderer.canvas.height) : this.canvas = this._renderer.view.canvas, e.context)
      this.initFromContext(e.context);
    else {
      const s = this._renderer.background.alpha < 1, i = e.premultipliedAlpha ?? !0, n = e.antialias && !this._renderer.backBuffer.useBackBuffer;
      this.createContext(e.preferWebGLVersion, {
        alpha: s,
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
      e !== this.canvas && $("multiView is disabled, but targetCanvas is not the main canvas");
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
    this.gl = e, this.webGLVersion = e instanceof J.get().getWebGLRenderingContext() ? 1 : 2, this.getExtensions(), this.validateContext(e), this._renderer.runners.contextChange.emit(e);
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
    let s;
    const i = this.canvas;
    if (e === 2 && (s = i.getContext("webgl2", t)), !s && (s = i.getContext("webgl", t), !s))
      throw new Error("This browser does not support WebGL. Try using the canvas renderer");
    this.gl = s, this.initFromContext(this.gl);
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
      const s = e.getExtension("WEBGL_provoking_vertex");
      s && s.provokingVertexWEBGL(s.FIRST_VERTEX_CONVENTION_WEBGL);
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
    t && !t.stencil && $("Provided WebGL context does not have a stencil buffer, masks may not render correctly");
    const s = this.supports, i = this.webGLVersion === 2, n = this.extensions;
    s.uint32Indices = i || !!n.uint32ElementIndex, s.uniformBufferObject = i, s.vertexArrayObject = i || !!n.vertexArrayObject, s.srgbTextures = i || !!n.srgb, s.nonPowOf2wrapping = i, s.nonPowOf2mipmaps = i, s.msaa = i, s.uint32Indices || $("Provided WebGL context does not support 32 index buffer, large scenes may not render correctly");
  }
};
ji.extension = {
  type: [
    T.WebGLSystem
  ],
  name: "context"
};
ji.defaultOptions = {
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
let Jp = ji;
function Dh(r, e) {
  for (const t in r.attributes) {
    const s = r.attributes[t], i = e[t];
    i ? (s.format ?? (s.format = i.format), s.offset ?? (s.offset = i.offset), s.instance ?? (s.instance = i.instance)) : $(`Attribute ${t} is not present in the shader, but is present in the geometry. Unable to infer attribute details.`);
  }
  em(r);
}
function em(r) {
  const { buffers: e, attributes: t } = r, s = {}, i = {};
  for (const n in e) {
    const a = e[n];
    s[a.uid] = 0, i[a.uid] = 0;
  }
  for (const n in t) {
    const a = t[n];
    s[a.buffer.uid] += it(a.format).stride;
  }
  for (const n in t) {
    const a = t[n];
    a.stride ?? (a.stride = s[a.buffer.uid]), a.start ?? (a.start = i[a.buffer.uid]), i[a.buffer.uid] += it(a.format).stride;
  }
}
var ci = /* @__PURE__ */ ((r) => (r[r.RGBA = 6408] = "RGBA", r[r.RGB = 6407] = "RGB", r[r.RG = 33319] = "RG", r[r.RED = 6403] = "RED", r[r.RGBA_INTEGER = 36249] = "RGBA_INTEGER", r[r.RGB_INTEGER = 36248] = "RGB_INTEGER", r[r.RG_INTEGER = 33320] = "RG_INTEGER", r[r.RED_INTEGER = 36244] = "RED_INTEGER", r[r.ALPHA = 6406] = "ALPHA", r[r.LUMINANCE = 6409] = "LUMINANCE", r[r.LUMINANCE_ALPHA = 6410] = "LUMINANCE_ALPHA", r[r.DEPTH_COMPONENT = 6402] = "DEPTH_COMPONENT", r[r.DEPTH_STENCIL = 34041] = "DEPTH_STENCIL", r))(ci || {}), Oh = /* @__PURE__ */ ((r) => (r[r.TEXTURE_2D = 3553] = "TEXTURE_2D", r[r.TEXTURE_CUBE_MAP = 34067] = "TEXTURE_CUBE_MAP", r[r.TEXTURE_2D_ARRAY = 35866] = "TEXTURE_2D_ARRAY", r[r.TEXTURE_CUBE_MAP_POSITIVE_X = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X", r[r.TEXTURE_CUBE_MAP_NEGATIVE_X = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X", r[r.TEXTURE_CUBE_MAP_POSITIVE_Y = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y", r[r.TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y", r[r.TEXTURE_CUBE_MAP_POSITIVE_Z = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z", r[r.TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z", r))(Oh || {}), se = /* @__PURE__ */ ((r) => (r[r.UNSIGNED_BYTE = 5121] = "UNSIGNED_BYTE", r[r.UNSIGNED_SHORT = 5123] = "UNSIGNED_SHORT", r[r.UNSIGNED_SHORT_5_6_5 = 33635] = "UNSIGNED_SHORT_5_6_5", r[r.UNSIGNED_SHORT_4_4_4_4 = 32819] = "UNSIGNED_SHORT_4_4_4_4", r[r.UNSIGNED_SHORT_5_5_5_1 = 32820] = "UNSIGNED_SHORT_5_5_5_1", r[r.UNSIGNED_INT = 5125] = "UNSIGNED_INT", r[r.UNSIGNED_INT_10F_11F_11F_REV = 35899] = "UNSIGNED_INT_10F_11F_11F_REV", r[r.UNSIGNED_INT_2_10_10_10_REV = 33640] = "UNSIGNED_INT_2_10_10_10_REV", r[r.UNSIGNED_INT_24_8 = 34042] = "UNSIGNED_INT_24_8", r[r.UNSIGNED_INT_5_9_9_9_REV = 35902] = "UNSIGNED_INT_5_9_9_9_REV", r[r.BYTE = 5120] = "BYTE", r[r.SHORT = 5122] = "SHORT", r[r.INT = 5124] = "INT", r[r.FLOAT = 5126] = "FLOAT", r[r.FLOAT_32_UNSIGNED_INT_24_8_REV = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV", r[r.HALF_FLOAT = 36193] = "HALF_FLOAT", r))(se || {});
const ka = {
  uint8x2: se.UNSIGNED_BYTE,
  uint8x4: se.UNSIGNED_BYTE,
  sint8x2: se.BYTE,
  sint8x4: se.BYTE,
  unorm8x2: se.UNSIGNED_BYTE,
  unorm8x4: se.UNSIGNED_BYTE,
  snorm8x2: se.BYTE,
  snorm8x4: se.BYTE,
  uint16x2: se.UNSIGNED_SHORT,
  uint16x4: se.UNSIGNED_SHORT,
  sint16x2: se.SHORT,
  sint16x4: se.SHORT,
  unorm16x2: se.UNSIGNED_SHORT,
  unorm16x4: se.UNSIGNED_SHORT,
  snorm16x2: se.SHORT,
  snorm16x4: se.SHORT,
  float16x2: se.HALF_FLOAT,
  float16x4: se.HALF_FLOAT,
  float32: se.FLOAT,
  float32x2: se.FLOAT,
  float32x3: se.FLOAT,
  float32x4: se.FLOAT,
  uint32: se.UNSIGNED_INT,
  uint32x2: se.UNSIGNED_INT,
  uint32x3: se.UNSIGNED_INT,
  uint32x4: se.UNSIGNED_INT,
  sint32: se.INT,
  sint32x2: se.INT,
  sint32x3: se.INT,
  sint32x4: se.INT
};
function tm(r) {
  return ka[r] ?? ka.float32;
}
const sm = {
  "point-list": 0,
  "line-list": 1,
  "line-strip": 3,
  "triangle-list": 4,
  "triangle-strip": 5
};
class Lh {
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
    const s = this._renderer.context.extensions.vertexAttribDivisorANGLE;
    s && (e.drawArraysInstanced = (i, n, a, o) => {
      s.drawArraysInstancedANGLE(i, n, a, o);
    }, e.drawElementsInstanced = (i, n, a, o, h) => {
      s.drawElementsInstancedANGLE(i, n, a, o, h);
    }, e.vertexAttribDivisor = (i, n) => s.vertexAttribDivisorANGLE(i, n)), this._activeGeometry = null, this._activeVao = null, this._geometryVaoHash = /* @__PURE__ */ Object.create(null);
  }
  /**
   * Binds geometry so that is can be drawn. Creating a Vao if required
   * @param geometry - Instance of geometry to bind.
   * @param program - Instance of program to use vao for.
   */
  bind(e, t) {
    const s = this.gl;
    this._activeGeometry = e;
    const i = this.getVao(e, t);
    this._activeVao !== i && (this._activeVao = i, s.bindVertexArray(i)), this.updateBuffers();
  }
  /** Reset and unbind any active VAO and geometry. */
  resetState() {
    this.unbind();
  }
  /** Update buffers of the currently bound geometry. */
  updateBuffers() {
    const e = this._activeGeometry, t = this._renderer.buffer;
    for (let s = 0; s < e.buffers.length; s++) {
      const i = e.buffers[s];
      t.updateBuffer(i);
    }
  }
  /**
   * Check compatibility between a geometry and a program
   * @param geometry - Geometry instance.
   * @param program - Program instance.
   */
  checkCompatibility(e, t) {
    const s = e.attributes, i = t._attributeData;
    for (const n in i)
      if (!s[n])
        throw new Error(`shader and geometry incompatible, geometry missing the "${n}" attribute`);
  }
  /**
   * Takes a geometry and program and generates a unique signature for them.
   * @param geometry - To get signature from.
   * @param program - To test geometry against.
   * @returns - Unique signature of the geometry and program
   */
  getSignature(e, t) {
    const s = e.attributes, i = t._attributeData, n = ["g", e.uid];
    for (const a in s)
      i[a] && n.push(a, i[a].location);
    return n.join("-");
  }
  getVao(e, t) {
    var s;
    return ((s = this._geometryVaoHash[e.uid]) == null ? void 0 : s[t._key]) || this.initGeometryVao(e, t);
  }
  /**
   * Creates or gets Vao with the same structure as the geometry and stores it on the geometry.
   * If vao is created, it is bound automatically. We use a shader to infer what and how to set up the
   * attribute locations.
   * @param geometry - Instance of geometry to to generate Vao for.
   * @param program
   * @param _incRefCount - Increment refCount of all geometry buffers.
   */
  initGeometryVao(e, t, s = !0) {
    const i = this._renderer.gl, n = this._renderer.buffer;
    this._renderer.shader._getProgramData(t), this.checkCompatibility(e, t);
    const a = this.getSignature(e, t);
    this._geometryVaoHash[e.uid] || (this._geometryVaoHash[e.uid] = /* @__PURE__ */ Object.create(null), e.on("destroy", this.onGeometryDestroy, this));
    const o = this._geometryVaoHash[e.uid];
    let h = o[a];
    if (h)
      return o[t._key] = h, h;
    Dh(e, t._attributeData);
    const c = e.buffers;
    h = i.createVertexArray(), i.bindVertexArray(h);
    for (let l = 0; l < c.length; l++) {
      const u = c[l];
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
    const s = this._geometryVaoHash[e.uid], i = this.gl;
    if (s) {
      if (t)
        for (const n in s)
          this._activeVao !== s[n] && this.unbind(), i.deleteVertexArray(s[n]);
      this._geometryVaoHash[e.uid] = null;
    }
  }
  /**
   * Dispose all WebGL resources of all managed geometries.
   * @param [contextLost=false] - If context was lost, we suppress `gl.delete` calls
   */
  destroyAll(e = !1) {
    const t = this.gl;
    for (const s in this._geometryVaoHash) {
      if (e)
        for (const i in this._geometryVaoHash[s]) {
          const n = this._geometryVaoHash[s];
          this._activeVao !== n && this.unbind(), t.deleteVertexArray(n[i]);
        }
      this._geometryVaoHash[s] = null;
    }
  }
  /**
   * Activate vertex array object.
   * @param geometry - Geometry instance.
   * @param program - Shader program instance.
   */
  activateVao(e, t) {
    var o;
    const s = this._renderer.gl, i = this._renderer.buffer, n = e.attributes;
    e.indexBuffer && i.bind(e.indexBuffer);
    let a = null;
    for (const h in n) {
      const c = n[h], l = c.buffer, u = i.getGlBuffer(l), d = t._attributeData[h];
      if (d) {
        a !== u && (i.bind(l), a = u);
        const f = d.location;
        s.enableVertexAttribArray(f);
        const p = it(c.format), g = tm(c.format);
        if (((o = d.format) == null ? void 0 : o.substring(1, 4)) === "int" ? s.vertexAttribIPointer(
          f,
          p.size,
          g,
          c.stride,
          c.offset
        ) : s.vertexAttribPointer(
          f,
          p.size,
          g,
          p.normalised,
          c.stride,
          c.offset
        ), c.instance)
          if (this.hasInstance) {
            const m = c.divisor ?? 1;
            s.vertexAttribDivisor(f, m);
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
  draw(e, t, s, i) {
    const { gl: n } = this._renderer, a = this._activeGeometry, o = sm[e || a.topology];
    if (i ?? (i = a.instanceCount), a.indexBuffer) {
      const h = a.indexBuffer.data.BYTES_PER_ELEMENT, c = h === 2 ? n.UNSIGNED_SHORT : n.UNSIGNED_INT;
      i > 1 ? n.drawElementsInstanced(o, t || a.indexBuffer.data.length, c, (s || 0) * h, i) : n.drawElements(o, t || a.indexBuffer.data.length, c, (s || 0) * h);
    } else i > 1 ? n.drawArraysInstanced(o, s || 0, t || a.getSize(), i) : n.drawArrays(o, s || 0, t || a.getSize());
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
Lh.extension = {
  type: [
    T.WebGLSystem
  ],
  name: "geometry"
};
const rm = new Gt({
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
}), Yi = class Nh {
  constructor(e) {
    this.useBackBuffer = !1, this._useBackBufferThisRender = !1, this._renderer = e;
  }
  init(e = {}) {
    const { useBackBuffer: t, antialias: s } = { ...Nh.defaultOptions, ...e };
    this.useBackBuffer = t, this._antialias = s, this._renderer.context.supports.msaa || ($("antialiasing, is not supported on when using the back buffer"), this._antialias = !1), this._state = Ie.for2d();
    const i = new kt({
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
    this._bigTriangleShader = new Ge({
      glProgram: i,
      resources: {
        uTexture: H.WHITE.source
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
      const s = this._renderer.renderTarget.getRenderTarget(e.target);
      this._targetTexture = s.colorTexture, e.target = this._getBackBufferTexture(s.colorTexture);
    }
  }
  renderEnd() {
    this._presentBackBuffer();
  }
  _presentBackBuffer() {
    const e = this._renderer;
    e.renderTarget.finishRenderPass(), this._useBackBufferThisRender && (e.renderTarget.bind(this._targetTexture, !1), this._bigTriangleShader.resources.uTexture = this._backBufferTexture.source, e.encoder.draw({
      geometry: rm,
      shader: this._bigTriangleShader,
      state: this._state
    }));
  }
  _getBackBufferTexture(e) {
    return this._backBufferTexture = this._backBufferTexture || new H({
      source: new _e({
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
Yi.extension = {
  type: [
    T.WebGLSystem
  ],
  name: "backBuffer",
  priority: 1
};
Yi.defaultOptions = {
  /** if true will use the back buffer where required */
  useBackBuffer: !1
};
let im = Yi;
class Hh {
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
Hh.extension = {
  type: [
    T.WebGLSystem
  ],
  name: "colorMask"
};
class Wh {
  constructor(e) {
    this.commandFinished = Promise.resolve(), this._renderer = e;
  }
  setGeometry(e, t) {
    this._renderer.geometry.bind(e, t.glProgram);
  }
  finishRenderPass() {
  }
  draw(e) {
    const t = this._renderer, { geometry: s, shader: i, state: n, skipSync: a, topology: o, size: h, start: c, instanceCount: l } = e;
    t.shader.bind(i, a), t.geometry.bind(s, t.shader._activeProgram), n && t.state.set(n), t.geometry.draw(o, h, c, l ?? s.instanceCount);
  }
  destroy() {
    this._renderer = null;
  }
}
Wh.extension = {
  type: [
    T.WebGLSystem
  ],
  name: "encoder"
};
class nm {
  constructor() {
    this.width = -1, this.height = -1, this.msaa = !1, this.msaaRenderBuffer = [];
  }
}
const ot = [];
ot[me.NONE] = void 0;
ot[me.DISABLED] = {
  stencilWriteMask: 0,
  stencilReadMask: 0
};
ot[me.RENDERING_MASK_ADD] = {
  stencilFront: {
    compare: "equal",
    passOp: "increment-clamp"
  },
  stencilBack: {
    compare: "equal",
    passOp: "increment-clamp"
  }
};
ot[me.RENDERING_MASK_REMOVE] = {
  stencilFront: {
    compare: "equal",
    passOp: "decrement-clamp"
  },
  stencilBack: {
    compare: "equal",
    passOp: "decrement-clamp"
  }
};
ot[me.MASK_ACTIVE] = {
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
ot[me.INVERSE_MASK_ACTIVE] = {
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
class zh {
  constructor(e) {
    this._stencilCache = {
      enabled: !1,
      stencilReference: 0,
      stencilMode: me.NONE
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
      stencilMode: me.DISABLED,
      stencilReference: 0
    }), this.setStencilMode(t.stencilMode, t.stencilReference);
  }
  resetState() {
    this._stencilCache.enabled = !1, this._stencilCache.stencilMode = me.NONE, this._stencilCache.stencilReference = 0;
  }
  setStencilMode(e, t) {
    const s = this._renderTargetStencilState[this._activeRenderTarget.uid], i = this._gl, n = ot[e], a = this._stencilCache;
    if (s.stencilMode = e, s.stencilReference = t, e === me.DISABLED) {
      this._stencilCache.enabled && (this._stencilCache.enabled = !1, i.disable(i.STENCIL_TEST));
      return;
    }
    this._stencilCache.enabled || (this._stencilCache.enabled = !0, i.enable(i.STENCIL_TEST)), (e !== a.stencilMode || a.stencilReference !== t) && (a.stencilMode = e, a.stencilReference = t, i.stencilFunc(this._comparisonFuncMapping[n.stencilBack.compare], t, 255), i.stencilOp(i.KEEP, i.KEEP, this._stencilOpsMapping[n.stencilBack.passOp]));
  }
}
zh.extension = {
  type: [
    T.WebGLSystem
  ],
  name: "stencil"
};
class Vh {
  constructor(e) {
    this._syncFunctionHash = /* @__PURE__ */ Object.create(null), this._adaptor = e, this._systemCheck();
  }
  /**
   * Overridable function by `pixi.js/unsafe-eval` to silence
   * throwing an error if platform doesn't support unsafe-evals.
   * @private
   */
  _systemCheck() {
    if (!Fo())
      throw new Error("Current environment does not allow unsafe-eval, please use pixi.js/unsafe-eval module to enable support.");
  }
  ensureUniformGroup(e) {
    const t = this.getUniformGroupData(e);
    e.buffer || (e.buffer = new Me({
      data: new Float32Array(t.layout.size / 4),
      usage: Q.UNIFORM | Q.COPY_DST
    }));
  }
  getUniformGroupData(e) {
    return this._syncFunctionHash[e._signature] || this._initUniformGroup(e);
  }
  _initUniformGroup(e) {
    const t = e._signature;
    let s = this._syncFunctionHash[t];
    if (!s) {
      const i = Object.keys(e.uniformStructures).map((o) => e.uniformStructures[o]), n = this._adaptor.createUboElements(i), a = this._generateUboSync(n.uboElements);
      s = this._syncFunctionHash[t] = {
        layout: n,
        syncFunction: a
      };
    }
    return this._syncFunctionHash[t];
  }
  _generateUboSync(e) {
    return this._adaptor.generateUboSync(e);
  }
  syncUniformGroup(e, t, s) {
    const i = this.getUniformGroupData(e);
    e.buffer || (e.buffer = new Me({
      data: new Float32Array(i.layout.size / 4),
      usage: Q.UNIFORM | Q.COPY_DST
    }));
    let n = null;
    return t || (t = e.buffer.data, n = e.buffer.dataInt32), s || (s = 0), i.syncFunction(e.uniforms, t, n, s), !0;
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
const $h = {
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
function am(r) {
  const e = r.map((n) => ({
    data: n,
    offset: 0,
    size: 0
  })), t = 16;
  let s = 0, i = 0;
  for (let n = 0; n < e.length; n++) {
    const a = e[n];
    if (s = $h[a.data.type], !s)
      throw new Error(`Unknown type ${a.data.type}`);
    a.data.size > 1 && (s = Math.max(s, t) * a.data.size);
    const o = s === 12 ? 16 : s;
    a.size = s;
    const h = i % t;
    h > 0 && t - h < o ? i += (t - h) % 16 : i += (s - h % s) % s, a.offset = i, i += s;
  }
  return i = Math.ceil(i / 16) * 16, { uboElements: e, size: i };
}
const pt = [
  // uploading pixi matrix object to mat3
  {
    type: "mat3x3<f32>",
    test: (r) => r.value.a !== void 0,
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
    test: (r) => r.type === "vec4<f32>" && r.size === 1 && r.value.width !== void 0,
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
    test: (r) => r.type === "vec2<f32>" && r.size === 1 && r.value.x !== void 0,
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
    test: (r) => r.type === "vec4<f32>" && r.size === 1 && r.value.red !== void 0,
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
    test: (r) => r.type === "vec3<f32>" && r.size === 1 && r.value.red !== void 0,
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
function Xh(r, e, t, s) {
  const i = [`
        var v = null;
        var v2 = null;
        var t = 0;
        var index = 0;
        var name = null;
        var arrayOffset = null;
    `];
  let n = 0;
  for (let o = 0; o < r.length; o++) {
    const h = r[o], c = h.data.name;
    let l = !1, u = 0;
    for (let d = 0; d < pt.length; d++)
      if (pt[d].test(h.data)) {
        u = h.offset / 4, i.push(
          `name = "${c}";`,
          `offset += ${u - n};`,
          pt[d][e] || pt[d].ubo
        ), l = !0;
        break;
      }
    if (!l)
      if (h.data.size > 1)
        u = h.offset / 4, i.push(t(h, u - n));
      else {
        const d = s[h.data.type];
        u = h.offset / 4, i.push(
          /* wgsl */
          `
                    v = uv.${c};
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
function vt(r, e) {
  return `
        for (let i = 0; i < ${r * e}; i++) {
            data[offset + (((i / ${r})|0) * 4) + (i % ${r})] = v[i];
        }
    `;
}
const jh = {
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
  "mat3x2<f32>": vt(3, 2),
  "mat4x2<f32>": vt(4, 2),
  "mat2x3<f32>": vt(2, 3),
  "mat4x3<f32>": vt(4, 3),
  "mat2x4<f32>": vt(2, 4),
  "mat3x4<f32>": vt(3, 4)
}, om = {
  ...jh,
  "mat2x2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];
    `
};
function hm(r, e) {
  const t = Math.max($h[r.data.type] / 16, 1), s = r.data.value.length / r.data.size, i = (4 - s % 4) % 4, n = r.data.type.indexOf("i32") >= 0 ? "dataInt32" : "data";
  return `
        v = uv.${r.data.name};
        offset += ${e};

        arrayOffset = offset;

        t = 0;

        for(var i=0; i < ${r.data.size * t}; i++)
        {
            for(var j = 0; j < ${s}; j++)
            {
                ${n}[arrayOffset++] = v[t++];
            }
            ${i !== 0 ? `arrayOffset += ${i};` : ""}
        }
    `;
}
function cm(r) {
  return Xh(
    r,
    "uboStd40",
    hm,
    jh
  );
}
class Yh extends Vh {
  constructor() {
    super({
      createUboElements: am,
      generateUboSync: cm
    });
  }
}
Yh.extension = {
  type: [T.WebGLSystem],
  name: "ubo"
};
class lm {
  constructor() {
    this._clearColorCache = [0, 0, 0, 0], this._viewPortCache = new oe();
  }
  init(e, t) {
    this._renderer = e, this._renderTargetSystem = t, e.runners.contextChange.add(this);
  }
  contextChange() {
    this._clearColorCache = [0, 0, 0, 0], this._viewPortCache = new oe();
  }
  copyToTexture(e, t, s, i, n) {
    const a = this._renderTargetSystem, o = this._renderer, h = a.getGpuRenderTarget(e), c = o.gl;
    return this.finishRenderPass(e), c.bindFramebuffer(c.FRAMEBUFFER, h.resolveTargetFramebuffer), o.texture.bind(t, 0), c.copyTexSubImage2D(
      c.TEXTURE_2D,
      0,
      n.x,
      n.y,
      s.x,
      s.y,
      i.width,
      i.height
    ), t;
  }
  startRenderPass(e, t = !0, s, i) {
    const n = this._renderTargetSystem, a = e.colorTexture, o = n.getGpuRenderTarget(e);
    let h = i.y;
    e.isRoot && (h = a.pixelHeight - i.height), e.colorTextures.forEach((u) => {
      this._renderer.texture.unbind(u);
    });
    const c = this._renderer.gl;
    c.bindFramebuffer(c.FRAMEBUFFER, o.framebuffer);
    const l = this._viewPortCache;
    (l.x !== i.x || l.y !== h || l.width !== i.width || l.height !== i.height) && (l.x = i.x, l.y = h, l.width = i.width, l.height = i.height, c.viewport(
      i.x,
      h,
      i.width,
      i.height
    )), !o.depthStencilRenderBuffer && (e.stencil || e.depth) && this._initStencil(o), this.clear(e, t, s);
  }
  finishRenderPass(e) {
    const s = this._renderTargetSystem.getGpuRenderTarget(e);
    if (!s.msaa)
      return;
    const i = this._renderer.gl;
    i.bindFramebuffer(i.FRAMEBUFFER, s.resolveTargetFramebuffer), i.bindFramebuffer(i.READ_FRAMEBUFFER, s.framebuffer), i.blitFramebuffer(
      0,
      0,
      s.width,
      s.height,
      0,
      0,
      s.width,
      s.height,
      i.COLOR_BUFFER_BIT,
      i.NEAREST
    ), i.bindFramebuffer(i.FRAMEBUFFER, s.framebuffer);
  }
  initGpuRenderTarget(e) {
    const s = this._renderer.gl, i = new nm(), n = e.colorTexture;
    return qe.test(n.resource) ? (this._renderer.context.ensureCanvasSize(e.colorTexture.resource), i.framebuffer = null, i) : (this._initColor(e, i), s.bindFramebuffer(s.FRAMEBUFFER, null), i);
  }
  destroyGpuRenderTarget(e) {
    const t = this._renderer.gl;
    e.framebuffer && (t.deleteFramebuffer(e.framebuffer), e.framebuffer = null), e.resolveTargetFramebuffer && (t.deleteFramebuffer(e.resolveTargetFramebuffer), e.resolveTargetFramebuffer = null), e.depthStencilRenderBuffer && (t.deleteRenderbuffer(e.depthStencilRenderBuffer), e.depthStencilRenderBuffer = null), e.msaaRenderBuffer.forEach((s) => {
      t.deleteRenderbuffer(s);
    }), e.msaaRenderBuffer = null;
  }
  clear(e, t, s) {
    if (!t)
      return;
    const i = this._renderTargetSystem;
    typeof t == "boolean" && (t = t ? Pe.ALL : Pe.NONE);
    const n = this._renderer.gl;
    if (t & Pe.COLOR) {
      s ?? (s = i.defaultClearColor);
      const a = this._clearColorCache, o = s;
      (a[0] !== o[0] || a[1] !== o[1] || a[2] !== o[2] || a[3] !== o[3]) && (a[0] = o[0], a[1] = o[1], a[2] = o[2], a[3] = o[3], n.clearColor(o[0], o[1], o[2], o[3]));
    }
    n.clear(t);
  }
  resizeGpuRenderTarget(e) {
    if (e.isRoot)
      return;
    const s = this._renderTargetSystem.getGpuRenderTarget(e);
    this._resizeColor(e, s), (e.stencil || e.depth) && this._resizeStencil(s);
  }
  _initColor(e, t) {
    const s = this._renderer, i = s.gl, n = i.createFramebuffer();
    if (t.resolveTargetFramebuffer = n, i.bindFramebuffer(i.FRAMEBUFFER, n), t.width = e.colorTexture.source.pixelWidth, t.height = e.colorTexture.source.pixelHeight, e.colorTextures.forEach((a, o) => {
      const h = a.source;
      h.antialias && (s.context.supports.msaa ? t.msaa = !0 : $("[RenderTexture] Antialiasing on textures is not supported in WebGL1")), s.texture.bindSource(h, 0);
      const l = s.texture.getGlSource(h).texture;
      i.framebufferTexture2D(
        i.FRAMEBUFFER,
        i.COLOR_ATTACHMENT0 + o,
        3553,
        // texture.target,
        l,
        0
      );
    }), t.msaa) {
      const a = i.createFramebuffer();
      t.framebuffer = a, i.bindFramebuffer(i.FRAMEBUFFER, a), e.colorTextures.forEach((o, h) => {
        const c = i.createRenderbuffer();
        t.msaaRenderBuffer[h] = c;
      });
    } else
      t.framebuffer = n;
    this._resizeColor(e, t);
  }
  _resizeColor(e, t) {
    const s = e.colorTexture.source;
    if (t.width = s.pixelWidth, t.height = s.pixelHeight, e.colorTextures.forEach((i, n) => {
      n !== 0 && i.source.resize(s.width, s.height, s._resolution);
    }), t.msaa) {
      const i = this._renderer, n = i.gl, a = t.framebuffer;
      n.bindFramebuffer(n.FRAMEBUFFER, a), e.colorTextures.forEach((o, h) => {
        const c = o.source;
        i.texture.bindSource(c, 0);
        const u = i.texture.getGlSource(c).internalFormat, d = t.msaaRenderBuffer[h];
        n.bindRenderbuffer(
          n.RENDERBUFFER,
          d
        ), n.renderbufferStorageMultisample(
          n.RENDERBUFFER,
          4,
          u,
          c.pixelWidth,
          c.pixelHeight
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
    const t = this._renderer.gl, s = t.createRenderbuffer();
    e.depthStencilRenderBuffer = s, t.bindRenderbuffer(
      t.RENDERBUFFER,
      s
    ), t.framebufferRenderbuffer(
      t.FRAMEBUFFER,
      t.DEPTH_STENCIL_ATTACHMENT,
      t.RENDERBUFFER,
      s
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
    this._renderer.context.multiView && qe.test(t) && this._renderer.context.ensureCanvasSize(t);
  }
  postrender(e) {
    if (this._renderer.context.multiView && qe.test(e.colorTexture.resource)) {
      const t = this._renderer.context.canvas, s = e.colorTexture;
      s.context2D.drawImage(
        t,
        0,
        s.pixelHeight - t.height
      );
    }
  }
}
function um(r, e, t, s, i, n) {
  const a = n ? 1 : -1;
  return r.identity(), r.a = 1 / s * 2, r.d = a * (1 / i * 2), r.tx = -1 - e * r.a, r.ty = -a - t * r.d, r;
}
const Wt = /* @__PURE__ */ new Map();
function Kh(r, e) {
  if (!Wt.has(r)) {
    const t = new H({
      source: new qe({
        resource: r,
        ...e
      })
    }), s = () => {
      Wt.get(r) === t && Wt.delete(r);
    };
    t.once("destroy", s), t.source.once("destroy", s), Wt.set(r, t);
  }
  return Wt.get(r);
}
function dm(r) {
  const e = r.colorTexture.source.resource;
  return globalThis.HTMLCanvasElement && e instanceof HTMLCanvasElement && document.body.contains(e);
}
const qh = class Zh {
  /**
   * @param [descriptor] - Options for creating a render target.
   */
  constructor(e = {}) {
    if (this.uid = le("renderTarget"), this.colorTextures = [], this.dirtyId = 0, this.isRoot = !1, this._size = new Float32Array(2), this._managedColorTextures = !1, e = { ...Zh.defaultOptions, ...e }, this.stencil = e.stencil, this.depth = e.depth, this.isRoot = e.isRoot, typeof e.colorTextures == "number") {
      this._managedColorTextures = !0;
      for (let t = 0; t < e.colorTextures; t++)
        this.colorTextures.push(
          new _e({
            width: e.width,
            height: e.height,
            resolution: e.resolution,
            antialias: e.antialias
          })
        );
    } else {
      this.colorTextures = [...e.colorTextures.map((s) => s.source)];
      const t = this.colorTexture.source;
      this.resize(t.width, t.height, t._resolution);
    }
    this.colorTexture.source.on("resize", this.onSourceResize, this), (e.depthStencilTexture || this.stencil) && (e.depthStencilTexture instanceof H || e.depthStencilTexture instanceof _e ? this.depthStencilTexture = e.depthStencilTexture.source : this.ensureDepthStencilTexture());
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
    this.depthStencilTexture || (this.depthStencilTexture = new _e({
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
  resize(e, t, s = this.resolution, i = !1) {
    this.dirtyId++, this.colorTextures.forEach((n, a) => {
      i && a === 0 || n.source.resize(e, t, s);
    }), this.depthStencilTexture && this.depthStencilTexture.source.resize(e, t, s);
  }
  destroy() {
    this.colorTexture.source.off("resize", this.onSourceResize, this), this._managedColorTextures && this.colorTextures.forEach((e) => {
      e.destroy();
    }), this.depthStencilTexture && (this.depthStencilTexture.destroy(), delete this.depthStencilTexture);
  }
};
qh.defaultOptions = {
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
let li = qh;
class Qh {
  constructor(e) {
    this.rootViewPort = new oe(), this.viewport = new oe(), this.onRenderTargetChange = new Do("onRenderTargetChange"), this.projectionMatrix = new z(), this.defaultClearColor = [0, 0, 0, 0], this._renderSurfaceToRenderTargetHash = /* @__PURE__ */ new Map(), this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null), this._renderTargetStack = [], this._renderer = e, e.renderableGC.addManagedHash(this, "_gpuRenderTargetHash");
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
    clearColor: s,
    frame: i
  }) {
    var n, a;
    this._renderTargetStack.length = 0, this.push(
      e,
      t,
      s,
      i
    ), this.rootViewPort.copyFrom(this.viewport), this.rootRenderTarget = this.renderTarget, this.renderingToScreen = dm(this.rootRenderTarget), (a = (n = this.adaptor).prerender) == null || a.call(n, this.rootRenderTarget);
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
  bind(e, t = !0, s, i) {
    const n = this.getRenderTarget(e), a = this.renderTarget !== n;
    this.renderTarget = n, this.renderSurface = e;
    const o = this.getGpuRenderTarget(n);
    (n.pixelWidth !== o.width || n.pixelHeight !== o.height) && (this.adaptor.resizeGpuRenderTarget(n), o.width = n.pixelWidth, o.height = n.pixelHeight);
    const h = n.colorTexture, c = this.viewport, l = h.pixelWidth, u = h.pixelHeight;
    if (!i && e instanceof H && (i = e.frame), i) {
      const d = h._resolution;
      c.x = i.x * d + 0.5 | 0, c.y = i.y * d + 0.5 | 0, c.width = i.width * d + 0.5 | 0, c.height = i.height * d + 0.5 | 0;
    } else
      c.x = 0, c.y = 0, c.width = l, c.height = u;
    return um(
      this.projectionMatrix,
      0,
      0,
      c.width / h.resolution,
      c.height / h.resolution,
      !n.isRoot
    ), this.adaptor.startRenderPass(n, t, s, c), a && this.onRenderTargetChange.emit(n), n;
  }
  clear(e, t = Pe.ALL, s) {
    t && (e && (e = this.getRenderTarget(e)), this.adaptor.clear(
      e || this.renderTarget,
      t,
      s,
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
  push(e, t = Pe.ALL, s, i) {
    const n = this.bind(e, t, s, i);
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
  copyToTexture(e, t, s, i, n) {
    s.x < 0 && (i.width += s.x, n.x -= s.x, s.x = 0), s.y < 0 && (i.height += s.y, n.y -= s.y, s.y = 0);
    const { pixelWidth: a, pixelHeight: o } = e;
    return i.width = Math.min(i.width, a - s.x), i.height = Math.min(i.height, o - s.y), this.adaptor.copyToTexture(
      e,
      t,
      s,
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
    return qe.test(e) && (e = Kh(e).source), e instanceof li ? t = e : e instanceof _e && (t = new li({
      colorTextures: [e]
    }), qe.test(e.source.resource) && (t.isRoot = !0), e.once("destroy", () => {
      t.destroy(), this._renderSurfaceToRenderTargetHash.delete(e);
      const s = this._gpuRenderTargetHash[t.uid];
      s && (this._gpuRenderTargetHash[t.uid] = null, this.adaptor.destroyGpuRenderTarget(s));
    })), this._renderSurfaceToRenderTargetHash.set(e, t), t;
  }
  getGpuRenderTarget(e) {
    return this._gpuRenderTargetHash[e.uid] || (this._gpuRenderTargetHash[e.uid] = this.adaptor.initGpuRenderTarget(e));
  }
  resetState() {
    this.renderTarget = null, this.renderSurface = null;
  }
}
class Jh extends Qh {
  constructor(e) {
    super(e), this.adaptor = new lm(), this.adaptor.init(e, this);
  }
}
Jh.extension = {
  type: [T.WebGLSystem],
  name: "renderTarget"
};
class Ki extends Be {
  /**
   * Create a new Buffer Resource.
   * @param options - The options for the buffer resource
   * @param options.buffer - The underlying buffer that this resource is using
   * @param options.offset - The offset of the buffer this resource is using.
   * If not provided, then it will use the offset of the buffer.
   * @param options.size - The size of the buffer this resource is using.
   * If not provided, then it will use the size of the buffer.
   */
  constructor({ buffer: e, offset: t, size: s }) {
    super(), this.uid = le("buffer"), this._resourceType = "bufferResource", this._touched = 0, this._resourceId = le("resource"), this._bufferResource = !0, this.destroyed = !1, this.buffer = e, this.offset = t | 0, this.size = s, this.buffer.on("change", this.onBufferChange, this);
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
function fm(r, e) {
  const t = [], s = [`
        var g = s.groups;
        var sS = r.shader;
        var p = s.glProgram;
        var ugS = r.uniformGroup;
        var resources;
    `];
  let i = !1, n = 0;
  const a = e._getProgramData(r.glProgram);
  for (const h in r.groups) {
    const c = r.groups[h];
    t.push(`
            resources = g[${h}].resources;
        `);
    for (const l in c.resources) {
      const u = c.resources[l];
      if (u instanceof ve)
        if (u.ubo) {
          const d = r._uniformBindMap[h][Number(l)];
          t.push(`
                        sS.bindUniformBlock(
                            resources[${l}],
                            '${d}',
                            ${r.glProgram._uniformBlockData[d].index}
                        );
                    `);
        } else
          t.push(`
                        ugS.updateUniformGroup(resources[${l}], p, sD);
                    `);
      else if (u instanceof Ki) {
        const d = r._uniformBindMap[h][Number(l)];
        t.push(`
                    sS.bindUniformBlock(
                        resources[${l}],
                        '${d}',
                        ${r.glProgram._uniformBlockData[d].index}
                    );
                `);
      } else if (u instanceof _e) {
        const d = r._uniformBindMap[h][l], f = a.uniformData[d];
        f && (i || (i = !0, s.push(`
                        var tS = r.texture;
                        `)), e._gl.uniform1i(f.location, n), t.push(`
                        tS.bind(resources[${l}], ${n});
                    `), n++);
      }
    }
  }
  const o = [...s, ...t].join(`
`);
  return new Function("r", "s", "sD", o);
}
class pm {
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
function Ia(r, e, t) {
  const s = r.createShader(e);
  return r.shaderSource(s, t), r.compileShader(s), s;
}
function Ir(r) {
  const e = new Array(r);
  for (let t = 0; t < e.length; t++)
    e[t] = !1;
  return e;
}
function ec(r, e) {
  switch (r) {
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
      return Ir(2 * e);
    case "bvec3":
      return Ir(3 * e);
    case "bvec4":
      return Ir(4 * e);
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
let Cs = null;
const Ga = {
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
}, mm = {
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
function tc(r, e) {
  if (!Cs) {
    const t = Object.keys(Ga);
    Cs = {};
    for (let s = 0; s < t.length; ++s) {
      const i = t[s];
      Cs[r[i]] = Ga[i];
    }
  }
  return Cs[e];
}
function gm(r, e) {
  const t = tc(r, e);
  return mm[t] || "float32";
}
function _m(r, e, t = !1) {
  const s = {}, i = e.getProgramParameter(r, e.ACTIVE_ATTRIBUTES);
  for (let a = 0; a < i; a++) {
    const o = e.getActiveAttrib(r, a);
    if (o.name.startsWith("gl_"))
      continue;
    const h = gm(e, o.type);
    s[o.name] = {
      location: 0,
      // set further down..
      format: h,
      stride: it(h).stride,
      offset: 0,
      instance: !1,
      start: 0
    };
  }
  const n = Object.keys(s);
  if (t) {
    n.sort((a, o) => a > o ? 1 : -1);
    for (let a = 0; a < n.length; a++)
      s[n[a]].location = a, e.bindAttribLocation(r, a, n[a]);
    e.linkProgram(r);
  } else
    for (let a = 0; a < n.length; a++)
      s[n[a]].location = e.getAttribLocation(r, n[a]);
  return s;
}
function xm(r, e) {
  if (!e.ACTIVE_UNIFORM_BLOCKS)
    return {};
  const t = {}, s = e.getProgramParameter(r, e.ACTIVE_UNIFORM_BLOCKS);
  for (let i = 0; i < s; i++) {
    const n = e.getActiveUniformBlockName(r, i), a = e.getUniformBlockIndex(r, n), o = e.getActiveUniformBlockParameter(r, i, e.UNIFORM_BLOCK_DATA_SIZE);
    t[n] = {
      name: n,
      index: a,
      size: o
    };
  }
  return t;
}
function ym(r, e) {
  const t = {}, s = e.getProgramParameter(r, e.ACTIVE_UNIFORMS);
  for (let i = 0; i < s; i++) {
    const n = e.getActiveUniform(r, i), a = n.name.replace(/\[.*?\]$/, ""), o = !!n.name.match(/\[.*?\]$/), h = tc(e, n.type);
    t[a] = {
      name: a,
      index: i,
      type: h,
      size: n.size,
      isArray: o,
      value: ec(h, n.size)
    };
  }
  return t;
}
function Ua(r, e) {
  const t = r.getShaderSource(e).split(`
`).map((c, l) => `${l}: ${c}`), s = r.getShaderInfoLog(e), i = s.split(`
`), n = {}, a = i.map((c) => parseFloat(c.replace(/^ERROR\: 0\:([\d]+)\:.*$/, "$1"))).filter((c) => c && !n[c] ? (n[c] = !0, !0) : !1), o = [""];
  a.forEach((c) => {
    t[c - 1] = `%c${t[c - 1]}%c`, o.push("background: #FF0000; color:#FFFFFF; font-size: 10px", "font-size: 10px");
  });
  const h = t.join(`
`);
  o[0] = h, console.error(s), console.groupCollapsed("click to view full shader code"), console.warn(...o), console.groupEnd();
}
function bm(r, e, t, s) {
  r.getProgramParameter(e, r.LINK_STATUS) || (r.getShaderParameter(t, r.COMPILE_STATUS) || Ua(r, t), r.getShaderParameter(s, r.COMPILE_STATUS) || Ua(r, s), console.error("PixiJS Error: Could not initialize shader."), r.getProgramInfoLog(e) !== "" && console.warn("PixiJS Warning: gl.getProgramInfoLog()", r.getProgramInfoLog(e)));
}
function vm(r, e) {
  const t = Ia(r, r.VERTEX_SHADER, e.vertex), s = Ia(r, r.FRAGMENT_SHADER, e.fragment), i = r.createProgram();
  r.attachShader(i, t), r.attachShader(i, s);
  const n = e.transformFeedbackVaryings;
  n && (typeof r.transformFeedbackVaryings != "function" ? $("TransformFeedback is not supported but TransformFeedbackVaryings are given.") : r.transformFeedbackVaryings(
    i,
    n.names,
    n.bufferMode === "separate" ? r.SEPARATE_ATTRIBS : r.INTERLEAVED_ATTRIBS
  )), r.linkProgram(i), r.getProgramParameter(i, r.LINK_STATUS) || bm(r, i, t, s), e._attributeData = _m(
    i,
    r,
    !/^[ \t]*#[ \t]*version[ \t]+300[ \t]+es[ \t]*$/m.test(e.vertex)
  ), e._uniformData = ym(i, r), e._uniformBlockData = xm(i, r), r.deleteShader(t), r.deleteShader(s);
  const a = {};
  for (const h in e._uniformData) {
    const c = e._uniformData[h];
    a[h] = {
      location: r.getUniformLocation(i, h),
      value: ec(c.type, c.size)
    };
  }
  return new pm(i, a);
}
const Ps = {
  textureCount: 0,
  blockIndex: 0
};
class sc {
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
    Ps.textureCount = 0, Ps.blockIndex = 0;
    let s = this._shaderSyncFunctions[e.glProgram._key];
    s || (s = this._shaderSyncFunctions[e.glProgram._key] = this._generateShaderSync(e, this)), this._renderer.buffer.nextBindBase(!!e.glProgram.transformFeedbackVaryings), s(this._renderer, e, Ps);
  }
  /**
   * Updates the uniform group.
   * @param uniformGroup - the uniform group to update
   */
  updateUniformGroup(e) {
    this._renderer.uniformGroup.updateUniformGroup(e, this._activeProgram, Ps);
  }
  /**
   * Binds a uniform block to the shader.
   * @param uniformGroup - the uniform group to bind
   * @param name - the name of the uniform block
   * @param index - the index of the uniform block
   */
  bindUniformBlock(e, t, s = 0) {
    const i = this._renderer.buffer, n = this._getProgramData(this._activeProgram), a = e._bufferResource;
    a || this._renderer.ubo.updateUniformGroup(e);
    const o = e.buffer, h = i.updateBuffer(o), c = i.freeLocationForBufferBase(h);
    if (a) {
      const { offset: u, size: d } = e;
      u === 0 && d === o.data.byteLength ? i.bindBufferBase(h, c) : i.bindBufferRange(h, c, u);
    } else i.getLastBindBaseLocation(h) !== c && i.bindBufferBase(h, c);
    const l = this._activeProgram._uniformBlockData[t].index;
    n.uniformBlockBindings[s] !== c && (n.uniformBlockBindings[s] = c, this._renderer.gl.uniformBlockBinding(n.program, l, c));
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
    return this._programDataHash[t] = vm(this._gl, e), this._programDataHash[t];
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
    return fm(e, t);
  }
  resetState() {
    this._activeProgram = null;
  }
}
sc.extension = {
  type: [
    T.WebGLSystem
  ],
  name: "shader"
};
const Tm = {
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
}, Sm = {
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
function wm(r, e) {
  const t = [`
        var v = null;
        var cv = null;
        var cu = null;
        var t = 0;
        var gl = renderer.gl;
        var name = null;
    `];
  for (const s in r.uniforms) {
    if (!e[s]) {
      r.uniforms[s] instanceof ve ? r.uniforms[s].ubo ? t.push(`
                        renderer.shader.bindUniformBlock(uv.${s}, "${s}");
                    `) : t.push(`
                        renderer.shader.updateUniformGroup(uv.${s});
                    `) : r.uniforms[s] instanceof Ki && t.push(`
                        renderer.shader.bindBufferResource(uv.${s}, "${s}");
                    `);
      continue;
    }
    const i = r.uniformStructures[s];
    let n = !1;
    for (let a = 0; a < pt.length; a++) {
      const o = pt[a];
      if (i.type === o.type && o.test(i)) {
        t.push(`name = "${s}";`, pt[a].uniform), n = !0;
        break;
      }
    }
    if (!n) {
      const o = (i.size === 1 ? Tm : Sm)[i.type].replace("location", `ud["${s}"].location`);
      t.push(`
            cu = ud["${s}"];
            cv = cu.value;
            v = uv["${s}"];
            ${o};`);
    }
  }
  return new Function("ud", "uv", "renderer", "syncData", t.join(`
`));
}
class rc {
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
  updateUniformGroup(e, t, s) {
    const i = this._renderer.shader._getProgramData(t);
    (!e.isStatic || e._dirtyId !== i.uniformDirtyGroups[e.uid]) && (i.uniformDirtyGroups[e.uid] = e._dirtyId, this._getUniformSyncFunction(e, t)(i.uniformData, e.uniforms, this._renderer, s));
  }
  /**
   * Overridable by the pixi.js/unsafe-eval package to use static syncUniforms instead.
   * @param group
   * @param program
   */
  _getUniformSyncFunction(e, t) {
    var s;
    return ((s = this._uniformGroupSyncHash[e._signature]) == null ? void 0 : s[t._key]) || this._createUniformSyncFunction(e, t);
  }
  _createUniformSyncFunction(e, t) {
    const s = this._uniformGroupSyncHash[e._signature] || (this._uniformGroupSyncHash[e._signature] = {}), i = this._getSignature(e, t._uniformData, "u");
    return this._cache[i] || (this._cache[i] = this._generateUniformsSync(e, t._uniformData)), s[t._key] = this._cache[i], s[t._key];
  }
  _generateUniformsSync(e, t) {
    return wm(e, t);
  }
  /**
   * Takes a uniform group and data and generates a unique signature for them.
   * @param group - The uniform group to get signature of
   * @param group.uniforms
   * @param uniformData - Uniform information generated by the shader
   * @param preFix
   * @returns Unique signature of the uniform group
   */
  _getSignature(e, t, s) {
    const i = e.uniforms, n = [`${s}-`];
    for (const a in i)
      n.push(a), t[a] && n.push(t[a].type);
    return n.join("-");
  }
  /** Destroys this System and removes all its textures. */
  destroy() {
    this._renderer = null, this._cache = null;
  }
}
rc.extension = {
  type: [
    T.WebGLSystem
  ],
  name: "uniformGroup"
};
function Am(r) {
  const e = {};
  if (e.normal = [r.ONE, r.ONE_MINUS_SRC_ALPHA], e.add = [r.ONE, r.ONE], e.multiply = [r.DST_COLOR, r.ONE_MINUS_SRC_ALPHA, r.ONE, r.ONE_MINUS_SRC_ALPHA], e.screen = [r.ONE, r.ONE_MINUS_SRC_COLOR, r.ONE, r.ONE_MINUS_SRC_ALPHA], e.none = [0, 0], e["normal-npm"] = [r.SRC_ALPHA, r.ONE_MINUS_SRC_ALPHA, r.ONE, r.ONE_MINUS_SRC_ALPHA], e["add-npm"] = [r.SRC_ALPHA, r.ONE, r.ONE, r.ONE], e["screen-npm"] = [r.SRC_ALPHA, r.ONE_MINUS_SRC_COLOR, r.ONE, r.ONE_MINUS_SRC_ALPHA], e.erase = [r.ZERO, r.ONE_MINUS_SRC_ALPHA], !(r instanceof J.get().getWebGLRenderingContext()))
    e.min = [r.ONE, r.ONE, r.ONE, r.ONE, r.MIN, r.MIN], e.max = [r.ONE, r.ONE, r.ONE, r.ONE, r.MAX, r.MAX];
  else {
    const s = r.getExtension("EXT_blend_minmax");
    s && (e.min = [r.ONE, r.ONE, r.ONE, r.ONE, s.MIN_EXT, s.MIN_EXT], e.max = [r.ONE, r.ONE, r.ONE, r.ONE, s.MAX_EXT, s.MAX_EXT]);
  }
  return e;
}
const Cm = 0, Pm = 1, Em = 2, Mm = 3, Bm = 4, Rm = 5, ic = class ui {
  constructor() {
    this.gl = null, this.stateId = 0, this.polygonOffset = 0, this.blendMode = "none", this._blendEq = !1, this.map = [], this.map[Cm] = this.setBlend, this.map[Pm] = this.setOffset, this.map[Em] = this.setCullFace, this.map[Mm] = this.setDepthTest, this.map[Bm] = this.setFrontFace, this.map[Rm] = this.setDepthMask, this.checks = [], this.defaultState = Ie.for2d();
  }
  contextChange(e) {
    this.gl = e, this.blendModesMap = Am(e), this.resetState();
  }
  /**
   * Sets the current state
   * @param {*} state - The state to set.
   */
  set(e) {
    if (e || (e = this.defaultState), this.stateId !== e.data) {
      let t = this.stateId ^ e.data, s = 0;
      for (; t; )
        t & 1 && this.map[s].call(this, !!(e.data & 1 << s)), t >>= 1, s++;
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
    this._updateCheck(ui._checkBlendMode, e), this.gl[e ? "enable" : "disable"](this.gl.BLEND);
  }
  /**
   * Sets whether to enable or disable polygon offset fill.
   * @param value - Turn on or off webgl polygon offset testing.
   */
  setOffset(e) {
    this._updateCheck(ui._checkPolygonOffset, e), this.gl[e ? "enable" : "disable"](this.gl.POLYGON_OFFSET_FILL);
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
    const t = this.blendModesMap[e], s = this.gl;
    t.length === 2 ? s.blendFunc(t[0], t[1]) : s.blendFuncSeparate(t[0], t[1], t[2], t[3]), t.length === 6 ? (this._blendEq = !0, s.blendEquationSeparate(t[4], t[5])) : this._blendEq && (this._blendEq = !1, s.blendEquationSeparate(s.FUNC_ADD, s.FUNC_ADD));
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
    const s = this.checks.indexOf(e);
    t && s === -1 ? this.checks.push(e) : !t && s !== -1 && this.checks.splice(s, 1);
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
ic.extension = {
  type: [
    T.WebGLSystem
  ],
  name: "state"
};
let km = ic;
class Im {
  constructor(e) {
    this.target = Oh.TEXTURE_2D, this.texture = e, this.width = -1, this.height = -1, this.type = se.UNSIGNED_BYTE, this.internalFormat = ci.RGBA, this.format = ci.RGBA, this.samplerType = 0;
  }
}
const Gm = {
  id: "buffer",
  upload(r, e, t) {
    e.width === r.width || e.height === r.height ? t.texSubImage2D(
      t.TEXTURE_2D,
      0,
      0,
      0,
      r.width,
      r.height,
      e.format,
      e.type,
      r.resource
    ) : t.texImage2D(
      e.target,
      0,
      e.internalFormat,
      r.width,
      r.height,
      0,
      e.format,
      e.type,
      r.resource
    ), e.width = r.width, e.height = r.height;
  }
}, Um = {
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
}, Fm = {
  id: "compressed",
  upload(r, e, t) {
    t.pixelStorei(t.UNPACK_ALIGNMENT, 4);
    let s = r.pixelWidth, i = r.pixelHeight;
    const n = !!Um[r.format];
    for (let a = 0; a < r.resource.length; a++) {
      const o = r.resource[a];
      n ? t.compressedTexImage2D(
        t.TEXTURE_2D,
        a,
        e.internalFormat,
        s,
        i,
        0,
        o
      ) : t.texImage2D(
        t.TEXTURE_2D,
        a,
        e.internalFormat,
        s,
        i,
        0,
        e.format,
        e.type,
        o
      ), s = Math.max(s >> 1, 1), i = Math.max(i >> 1, 1);
    }
  }
}, nc = {
  id: "image",
  upload(r, e, t, s) {
    const i = e.width, n = e.height, a = r.pixelWidth, o = r.pixelHeight, h = r.resourceWidth, c = r.resourceHeight;
    h < a || c < o ? ((i !== a || n !== o) && t.texImage2D(
      e.target,
      0,
      e.internalFormat,
      a,
      o,
      0,
      e.format,
      e.type,
      null
    ), s === 2 ? t.texSubImage2D(
      t.TEXTURE_2D,
      0,
      0,
      0,
      h,
      c,
      e.format,
      e.type,
      r.resource
    ) : t.texSubImage2D(
      t.TEXTURE_2D,
      0,
      0,
      0,
      e.format,
      e.type,
      r.resource
    )) : i === a && n === o ? t.texSubImage2D(
      t.TEXTURE_2D,
      0,
      0,
      0,
      e.format,
      e.type,
      r.resource
    ) : s === 2 ? t.texImage2D(
      e.target,
      0,
      e.internalFormat,
      a,
      o,
      0,
      e.format,
      e.type,
      r.resource
    ) : t.texImage2D(
      e.target,
      0,
      e.internalFormat,
      e.format,
      e.type,
      r.resource
    ), e.width = a, e.height = o;
  }
}, Dm = {
  id: "video",
  upload(r, e, t, s) {
    if (!r.isValid) {
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
    nc.upload(r, e, t, s);
  }
}, Fa = {
  linear: 9729,
  nearest: 9728
}, Om = {
  linear: {
    linear: 9987,
    nearest: 9985
  },
  nearest: {
    linear: 9986,
    nearest: 9984
  }
}, Gr = {
  "clamp-to-edge": 33071,
  repeat: 10497,
  "mirror-repeat": 33648
}, Lm = {
  never: 512,
  less: 513,
  equal: 514,
  "less-equal": 515,
  greater: 516,
  "not-equal": 517,
  "greater-equal": 518,
  always: 519
};
function Da(r, e, t, s, i, n, a, o) {
  const h = n;
  if (!o || r.addressModeU !== "repeat" || r.addressModeV !== "repeat" || r.addressModeW !== "repeat") {
    const c = Gr[a ? "clamp-to-edge" : r.addressModeU], l = Gr[a ? "clamp-to-edge" : r.addressModeV], u = Gr[a ? "clamp-to-edge" : r.addressModeW];
    e[i](h, e.TEXTURE_WRAP_S, c), e[i](h, e.TEXTURE_WRAP_T, l), e.TEXTURE_WRAP_R && e[i](h, e.TEXTURE_WRAP_R, u);
  }
  if ((!o || r.magFilter !== "linear") && e[i](h, e.TEXTURE_MAG_FILTER, Fa[r.magFilter]), t) {
    if (!o || r.mipmapFilter !== "linear") {
      const c = Om[r.minFilter][r.mipmapFilter];
      e[i](h, e.TEXTURE_MIN_FILTER, c);
    }
  } else
    e[i](h, e.TEXTURE_MIN_FILTER, Fa[r.minFilter]);
  if (s && r.maxAnisotropy > 1) {
    const c = Math.min(r.maxAnisotropy, e.getParameter(s.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
    e[i](h, s.TEXTURE_MAX_ANISOTROPY_EXT, c);
  }
  r.compare && e[i](h, e.TEXTURE_COMPARE_FUNC, Lm[r.compare]);
}
function Nm(r) {
  return {
    // 8-bit formats
    r8unorm: r.RED,
    r8snorm: r.RED,
    r8uint: r.RED,
    r8sint: r.RED,
    // 16-bit formats
    r16uint: r.RED,
    r16sint: r.RED,
    r16float: r.RED,
    rg8unorm: r.RG,
    rg8snorm: r.RG,
    rg8uint: r.RG,
    rg8sint: r.RG,
    // 32-bit formats
    r32uint: r.RED,
    r32sint: r.RED,
    r32float: r.RED,
    rg16uint: r.RG,
    rg16sint: r.RG,
    rg16float: r.RG,
    rgba8unorm: r.RGBA,
    "rgba8unorm-srgb": r.RGBA,
    // Packed 32-bit formats
    rgba8snorm: r.RGBA,
    rgba8uint: r.RGBA,
    rgba8sint: r.RGBA,
    bgra8unorm: r.RGBA,
    "bgra8unorm-srgb": r.RGBA,
    rgb9e5ufloat: r.RGB,
    rgb10a2unorm: r.RGBA,
    rg11b10ufloat: r.RGB,
    // 64-bit formats
    rg32uint: r.RG,
    rg32sint: r.RG,
    rg32float: r.RG,
    rgba16uint: r.RGBA,
    rgba16sint: r.RGBA,
    rgba16float: r.RGBA,
    // 128-bit formats
    rgba32uint: r.RGBA,
    rgba32sint: r.RGBA,
    rgba32float: r.RGBA,
    // Depth/stencil formats
    stencil8: r.STENCIL_INDEX8,
    depth16unorm: r.DEPTH_COMPONENT,
    depth24plus: r.DEPTH_COMPONENT,
    "depth24plus-stencil8": r.DEPTH_STENCIL,
    depth32float: r.DEPTH_COMPONENT,
    "depth32float-stencil8": r.DEPTH_STENCIL
  };
}
function Hm(r, e) {
  let t = {}, s = r.RGBA;
  return r instanceof J.get().getWebGLRenderingContext() ? e.srgb && (t = {
    "rgba8unorm-srgb": e.srgb.SRGB8_ALPHA8_EXT,
    "bgra8unorm-srgb": e.srgb.SRGB8_ALPHA8_EXT
  }) : (t = {
    "rgba8unorm-srgb": r.SRGB8_ALPHA8,
    "bgra8unorm-srgb": r.SRGB8_ALPHA8
  }, s = r.RGBA8), {
    // 8-bit formats
    r8unorm: r.R8,
    r8snorm: r.R8_SNORM,
    r8uint: r.R8UI,
    r8sint: r.R8I,
    // 16-bit formats
    r16uint: r.R16UI,
    r16sint: r.R16I,
    r16float: r.R16F,
    rg8unorm: r.RG8,
    rg8snorm: r.RG8_SNORM,
    rg8uint: r.RG8UI,
    rg8sint: r.RG8I,
    // 32-bit formats
    r32uint: r.R32UI,
    r32sint: r.R32I,
    r32float: r.R32F,
    rg16uint: r.RG16UI,
    rg16sint: r.RG16I,
    rg16float: r.RG16F,
    rgba8unorm: r.RGBA,
    ...t,
    // Packed 32-bit formats
    rgba8snorm: r.RGBA8_SNORM,
    rgba8uint: r.RGBA8UI,
    rgba8sint: r.RGBA8I,
    bgra8unorm: s,
    rgb9e5ufloat: r.RGB9_E5,
    rgb10a2unorm: r.RGB10_A2,
    rg11b10ufloat: r.R11F_G11F_B10F,
    // 64-bit formats
    rg32uint: r.RG32UI,
    rg32sint: r.RG32I,
    rg32float: r.RG32F,
    rgba16uint: r.RGBA16UI,
    rgba16sint: r.RGBA16I,
    rgba16float: r.RGBA16F,
    // 128-bit formats
    rgba32uint: r.RGBA32UI,
    rgba32sint: r.RGBA32I,
    rgba32float: r.RGBA32F,
    // Depth/stencil formats
    stencil8: r.STENCIL_INDEX8,
    depth16unorm: r.DEPTH_COMPONENT16,
    depth24plus: r.DEPTH_COMPONENT24,
    "depth24plus-stencil8": r.DEPTH24_STENCIL8,
    depth32float: r.DEPTH_COMPONENT32F,
    "depth32float-stencil8": r.DEPTH32F_STENCIL8,
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
function Wm(r) {
  return {
    // 8-bit formats
    r8unorm: r.UNSIGNED_BYTE,
    r8snorm: r.BYTE,
    r8uint: r.UNSIGNED_BYTE,
    r8sint: r.BYTE,
    // 16-bit formats
    r16uint: r.UNSIGNED_SHORT,
    r16sint: r.SHORT,
    r16float: r.HALF_FLOAT,
    rg8unorm: r.UNSIGNED_BYTE,
    rg8snorm: r.BYTE,
    rg8uint: r.UNSIGNED_BYTE,
    rg8sint: r.BYTE,
    // 32-bit formats
    r32uint: r.UNSIGNED_INT,
    r32sint: r.INT,
    r32float: r.FLOAT,
    rg16uint: r.UNSIGNED_SHORT,
    rg16sint: r.SHORT,
    rg16float: r.HALF_FLOAT,
    rgba8unorm: r.UNSIGNED_BYTE,
    "rgba8unorm-srgb": r.UNSIGNED_BYTE,
    // Packed 32-bit formats
    rgba8snorm: r.BYTE,
    rgba8uint: r.UNSIGNED_BYTE,
    rgba8sint: r.BYTE,
    bgra8unorm: r.UNSIGNED_BYTE,
    "bgra8unorm-srgb": r.UNSIGNED_BYTE,
    rgb9e5ufloat: r.UNSIGNED_INT_5_9_9_9_REV,
    rgb10a2unorm: r.UNSIGNED_INT_2_10_10_10_REV,
    rg11b10ufloat: r.UNSIGNED_INT_10F_11F_11F_REV,
    // 64-bit formats
    rg32uint: r.UNSIGNED_INT,
    rg32sint: r.INT,
    rg32float: r.FLOAT,
    rgba16uint: r.UNSIGNED_SHORT,
    rgba16sint: r.SHORT,
    rgba16float: r.HALF_FLOAT,
    // 128-bit formats
    rgba32uint: r.UNSIGNED_INT,
    rgba32sint: r.INT,
    rgba32float: r.FLOAT,
    // Depth/stencil formats
    stencil8: r.UNSIGNED_BYTE,
    depth16unorm: r.UNSIGNED_SHORT,
    depth24plus: r.UNSIGNED_INT,
    "depth24plus-stencil8": r.UNSIGNED_INT_24_8,
    depth32float: r.FLOAT,
    "depth32float-stencil8": r.FLOAT_32_UNSIGNED_INT_24_8_REV
  };
}
const zm = 4;
class ac {
  constructor(e) {
    this.managedTextures = [], this._glTextures = /* @__PURE__ */ Object.create(null), this._glSamplers = /* @__PURE__ */ Object.create(null), this._boundTextures = [], this._activeTextureLocation = -1, this._boundSamplers = /* @__PURE__ */ Object.create(null), this._uploads = {
      image: nc,
      buffer: Gm,
      video: Dm,
      compressed: Fm
    }, this._premultiplyAlpha = !1, this._useSeparateSamplers = !1, this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_glTextures"), this._renderer.renderableGC.addManagedHash(this, "_glSamplers");
  }
  contextChange(e) {
    this._gl = e, this._mapFormatToInternalFormat || (this._mapFormatToInternalFormat = Hm(e, this._renderer.context.extensions), this._mapFormatToType = Wm(e), this._mapFormatToFormat = Nm(e)), this._glTextures = /* @__PURE__ */ Object.create(null), this._glSamplers = /* @__PURE__ */ Object.create(null), this._boundSamplers = /* @__PURE__ */ Object.create(null), this._premultiplyAlpha = !1;
    for (let t = 0; t < 16; t++)
      this.bind(H.EMPTY, t);
  }
  initSource(e) {
    this.bind(e);
  }
  bind(e, t = 0) {
    const s = e.source;
    e ? (this.bindSource(s, t), this._useSeparateSamplers && this._bindSampler(s.style, t)) : (this.bindSource(null, t), this._useSeparateSamplers && this._bindSampler(null, t));
  }
  bindSource(e, t = 0) {
    const s = this._gl;
    if (e._touched = this._renderer.textureGC.count, this._boundTextures[t] !== e) {
      this._boundTextures[t] = e, this._activateLocation(t), e || (e = H.EMPTY.source);
      const i = this.getGlSource(e);
      s.bindTexture(i.target, i.texture);
    }
  }
  _bindSampler(e, t = 0) {
    const s = this._gl;
    if (!e) {
      this._boundSamplers[t] = null, s.bindSampler(t, null);
      return;
    }
    const i = this._getGlSampler(e);
    this._boundSamplers[t] !== i && (this._boundSamplers[t] = i, s.bindSampler(t, i));
  }
  unbind(e) {
    const t = e.source, s = this._boundTextures, i = this._gl;
    for (let n = 0; n < s.length; n++)
      if (s[n] === t) {
        this._activateLocation(n);
        const a = this.getGlSource(t);
        i.bindTexture(a.target, null), s[n] = null;
      }
  }
  _activateLocation(e) {
    this._activeTextureLocation !== e && (this._activeTextureLocation = e, this._gl.activeTexture(this._gl.TEXTURE0 + e));
  }
  _initSource(e) {
    const t = this._gl, s = new Im(t.createTexture());
    if (s.type = this._mapFormatToType[e.format], s.internalFormat = this._mapFormatToInternalFormat[e.format], s.format = this._mapFormatToFormat[e.format], e.autoGenerateMipmaps && (this._renderer.context.supports.nonPowOf2mipmaps || e.isPowerOfTwo)) {
      const i = Math.max(e.width, e.height);
      e.mipLevelCount = Math.floor(Math.log2(i)) + 1;
    }
    return this._glTextures[e.uid] = s, this.managedTextures.includes(e) || (e.on("update", this.onSourceUpdate, this), e.on("resize", this.onSourceUpdate, this), e.on("styleChange", this.onStyleChange, this), e.on("destroy", this.onSourceDestroy, this), e.on("unload", this.onSourceUnload, this), e.on("updateMipmaps", this.onUpdateMipmaps, this), this.managedTextures.push(e)), this.onSourceUpdate(e), this.updateStyle(e, !1), s;
  }
  onStyleChange(e) {
    this.updateStyle(e, !1);
  }
  updateStyle(e, t) {
    const s = this._gl, i = this.getGlSource(e);
    s.bindTexture(s.TEXTURE_2D, i.texture), this._boundTextures[this._activeTextureLocation] = e, Da(
      e.style,
      s,
      e.mipLevelCount > 1,
      this._renderer.context.extensions.anisotropicFiltering,
      "texParameteri",
      s.TEXTURE_2D,
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
    const t = this._gl, s = this.getGlSource(e);
    t.bindTexture(t.TEXTURE_2D, s.texture), this._boundTextures[this._activeTextureLocation] = e;
    const i = e.alphaMode === "premultiply-alpha-on-upload";
    this._premultiplyAlpha !== i && (this._premultiplyAlpha = i, t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL, i)), this._uploads[e.uploadMethodId] ? this._uploads[e.uploadMethodId].upload(e, s, t, this._renderer.context.webGLVersion) : t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, e.pixelWidth, e.pixelHeight, 0, t.RGBA, t.UNSIGNED_BYTE, null), e.autoGenerateMipmaps && e.mipLevelCount > 1 && this.onUpdateMipmaps(e, !1);
  }
  onUpdateMipmaps(e, t = !0) {
    t && this.bindSource(e, 0);
    const s = this.getGlSource(e);
    this._gl.generateMipmap(s.target);
  }
  onSourceDestroy(e) {
    e.off("destroy", this.onSourceDestroy, this), e.off("update", this.onSourceUpdate, this), e.off("resize", this.onSourceUpdate, this), e.off("unload", this.onSourceUnload, this), e.off("styleChange", this.onStyleChange, this), e.off("updateMipmaps", this.onUpdateMipmaps, this), this.managedTextures.splice(this.managedTextures.indexOf(e), 1), this.onSourceUnload(e);
  }
  _initSampler(e) {
    const t = this._gl, s = this._gl.createSampler();
    return this._glSamplers[e._resourceId] = s, Da(
      e,
      t,
      this._boundTextures[this._activeTextureLocation].mipLevelCount > 1,
      this._renderer.context.extensions.anisotropicFiltering,
      "samplerParameteri",
      s,
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
    const { pixels: t, width: s, height: i } = this.getPixels(e), n = J.get().createCanvas();
    n.width = s, n.height = i;
    const a = n.getContext("2d");
    if (a) {
      const o = a.createImageData(s, i);
      o.data.set(t), a.putImageData(o, 0, 0);
    }
    return n;
  }
  getPixels(e) {
    const t = e.source.resolution, s = e.frame, i = Math.max(Math.round(s.width * t), 1), n = Math.max(Math.round(s.height * t), 1), a = new Uint8Array(zm * i * n), o = this._renderer, h = o.renderTarget.getRenderTarget(e), c = o.renderTarget.getGpuRenderTarget(h), l = o.gl;
    return l.bindFramebuffer(l.FRAMEBUFFER, c.resolveTargetFramebuffer), l.readPixels(
      Math.round(s.x * t),
      Math.round(s.y * t),
      i,
      n,
      l.RGBA,
      l.UNSIGNED_BYTE,
      a
    ), { pixels: new Uint8ClampedArray(a.buffer), width: i, height: n };
  }
  destroy() {
    this.managedTextures.slice().forEach((e) => this.onSourceDestroy(e)), this.managedTextures = null, this._renderer = null;
  }
  resetState() {
    this._activeTextureLocation = -1, this._boundTextures.fill(H.EMPTY.source), this._boundSamplers = /* @__PURE__ */ Object.create(null);
  }
}
ac.extension = {
  type: [
    T.WebGLSystem
  ],
  name: "texture"
};
class oc {
  init() {
    const e = new ve({
      uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
      uTransformMatrix: { value: new z(), type: "mat3x3<f32>" },
      uRound: { value: 0, type: "f32" }
    }), t = It(), s = os({
      name: "graphics",
      bits: [
        Bi,
        ki(t),
        Xi,
        cs
      ]
    });
    this.shader = new Ge({
      glProgram: s,
      resources: {
        localUniforms: e,
        batchSamplers: Ii(t)
      }
    });
  }
  execute(e, t) {
    const s = t.context, i = s.customShader || this.shader, n = e.renderer, a = n.graphicsContext, {
      batcher: o,
      instructions: h
    } = a.getContextRenderData(s);
    i.groups[0] = n.globalUniforms.bindGroup, n.state.set(e.state), n.shader.bind(i), n.geometry.bind(o.geometry, i.glProgram);
    const c = h.instructions;
    for (let l = 0; l < h.instructionSize; l++) {
      const u = c[l];
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
oc.extension = {
  type: [
    T.WebGLPipesAdaptor
  ],
  name: "graphics"
};
class hc {
  init() {
    const e = os({
      name: "mesh",
      bits: [
        Xi,
        Kp,
        cs
      ]
    });
    this._shader = new Ge({
      glProgram: e,
      resources: {
        uTexture: H.EMPTY.source,
        textureUniforms: {
          uTextureMatrix: { type: "mat3x3<f32>", value: new z() }
        }
      }
    });
  }
  execute(e, t) {
    const s = e.renderer;
    let i = t._shader;
    if (i) {
      if (!i.glProgram) {
        $("Mesh shader has no glProgram", t.shader);
        return;
      }
    } else {
      i = this._shader;
      const n = t.texture, a = n.source;
      i.resources.uTexture = a, i.resources.uSampler = a.style, i.resources.textureUniforms.uniforms.uTextureMatrix = n.textureMatrix.mapCoord;
    }
    i.groups[100] = s.globalUniforms.bindGroup, i.groups[101] = e.localUniformsBindGroup, s.encoder.draw({
      geometry: t._geometry,
      shader: i,
      state: t.state
    });
  }
  destroy() {
    this._shader.destroy(!0), this._shader = null;
  }
}
hc.extension = {
  type: [
    T.WebGLPipesAdaptor
  ],
  name: "mesh"
};
class cc {
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
cc.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "customRender"
};
class Zs {
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
function di(r, e) {
  const t = r.instructionSet, s = t.instructions;
  for (let i = 0; i < t.instructionSize; i++) {
    const n = s[i];
    e[n.renderPipeId].execute(n);
  }
}
const Vm = new z();
class lc {
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
    this._renderer.renderPipes.batch.break(t), e._batchableRenderGroup && (Z.return(e._batchableRenderGroup), e._batchableRenderGroup = null), t.add(e);
  }
  _addRenderableCacheAsTexture(e, t) {
    const s = e._batchableRenderGroup ?? (e._batchableRenderGroup = Z.get(Zs));
    s.renderable = e.root, s.transform = e.root.relativeGroupTransform, s.texture = e.texture, s.bounds = e._textureBounds, t.add(e), this._renderer.renderPipes.batch.addToBatch(s, t);
  }
  _executeCacheAsTexture(e) {
    if (e.textureNeedsUpdate) {
      e.textureNeedsUpdate = !1;
      const t = Vm.identity().translate(
        -e._textureBounds.x,
        -e._textureBounds.y
      );
      this._renderer.renderTarget.push(e.texture, !0, null, e.texture.frame), this._renderer.globalUniforms.push({
        worldTransformMatrix: t,
        worldColor: 4294967295
      }), di(e, this._renderer.renderPipes), this._renderer.renderTarget.finishRenderPass(), this._renderer.renderTarget.pop(), this._renderer.globalUniforms.pop();
    }
    e._batchableRenderGroup._batcher.updateElement(e._batchableRenderGroup), e._batchableRenderGroup._batcher.geometry.buffers[0].update();
  }
  _executeDirect(e) {
    this._renderer.globalUniforms.push({
      worldTransformMatrix: e.inverseParentTextureTransform,
      worldColor: e.worldColorAlpha
    }), di(e, this._renderer.renderPipes), this._renderer.globalUniforms.pop();
  }
}
lc.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "renderGroup"
};
function fi(r, e) {
  e || (e = 0);
  for (let t = e; t < r.length && r[t]; t++)
    r[t] = null;
}
const $m = new pe(), Oa = Kt | Os | Ti;
function uc(r, e = !1) {
  Xm(r);
  const t = r.childrenToUpdate, s = r.updateTick++;
  for (const i in t) {
    const n = Number(i), a = t[i], o = a.list, h = a.index;
    for (let c = 0; c < h; c++) {
      const l = o[c];
      l.parentRenderGroup === r && l.relativeRenderGroupDepth === n && dc(l, s, 0);
    }
    fi(o, h), a.index = 0;
  }
  if (e)
    for (let i = 0; i < r.renderGroupChildren.length; i++)
      uc(r.renderGroupChildren[i], e);
}
function Xm(r) {
  const e = r.root;
  let t;
  if (r.renderGroupParent) {
    const s = r.renderGroupParent;
    r.worldTransform.appendFrom(
      e.relativeGroupTransform,
      s.worldTransform
    ), r.worldColor = Ds(
      e.groupColor,
      s.worldColor
    ), t = e.groupAlpha * s.worldAlpha;
  } else
    r.worldTransform.copyFrom(e.localTransform), r.worldColor = e.localColor, t = e.localAlpha;
  t = t < 0 ? 0 : t > 1 ? 1 : t, r.worldAlpha = t, r.worldColorAlpha = r.worldColor + ((t * 255 | 0) << 24);
}
function dc(r, e, t) {
  if (e === r.updateTick)
    return;
  r.updateTick = e, r.didChange = !1;
  const s = r.localTransform;
  r.updateLocalTransform();
  const i = r.parent;
  if (i && !i.renderGroup ? (t |= r._updateFlags, r.relativeGroupTransform.appendFrom(
    s,
    i.relativeGroupTransform
  ), t & Oa && La(r, i, t)) : (t = r._updateFlags, r.relativeGroupTransform.copyFrom(s), t & Oa && La(r, $m, t)), !r.renderGroup) {
    const n = r.children, a = n.length;
    for (let c = 0; c < a; c++)
      dc(n[c], e, t);
    const o = r.parentRenderGroup, h = r;
    h.renderPipeId && !o.structureDidChange && o.updateRenderable(h);
  }
}
function La(r, e, t) {
  if (t & Os) {
    r.groupColor = Ds(
      r.localColor,
      e.groupColor
    );
    let s = r.localAlpha * e.groupAlpha;
    s = s < 0 ? 0 : s > 1 ? 1 : s, r.groupAlpha = s, r.groupColorAlpha = r.groupColor + ((s * 255 | 0) << 24);
  }
  t & Ti && (r.groupBlendMode = r.localBlendMode === "inherit" ? e.groupBlendMode : r.localBlendMode), t & Kt && (r.globalDisplayStatus = r.localDisplayStatus & e.globalDisplayStatus), r._updateFlags = 0;
}
function jm(r, e) {
  const { list: t, index: s } = r.childrenRenderablesToUpdate;
  let i = !1;
  for (let n = 0; n < s; n++) {
    const a = t[n];
    if (i = e[a.renderPipeId].validateRenderable(a), i)
      break;
  }
  return r.structureDidChange = i, i;
}
const Ym = new z();
class fc {
  constructor(e) {
    this._renderer = e;
  }
  render({ container: e, transform: t }) {
    const s = e.parent, i = e.renderGroup.renderGroupParent;
    e.parent = null, e.renderGroup.renderGroupParent = null;
    const n = this._renderer;
    let a = Ym;
    t && (a = a.copyFrom(e.renderGroup.localTransform), e.renderGroup.localTransform.copyFrom(t));
    const o = n.renderPipes;
    this._updateCachedRenderGroups(e.renderGroup, null), this._updateRenderGroups(e.renderGroup), n.globalUniforms.start({
      worldTransformMatrix: t ? e.renderGroup.localTransform : e.renderGroup.worldTransform,
      worldColor: e.renderGroup.worldColorAlpha
    }), di(e.renderGroup, o), o.uniformBatch && o.uniformBatch.renderEnd(), t && e.renderGroup.localTransform.copyFrom(a), e.parent = s, e.renderGroup.renderGroupParent = i;
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
    for (let s = e.renderGroupChildren.length - 1; s >= 0; s--)
      this._updateCachedRenderGroups(e.renderGroupChildren[s], t);
    if (e.invalidateMatrices(), e.isCachedAsTexture) {
      if (e.textureNeedsUpdate) {
        const s = e.root.getLocalBounds();
        s.ceil();
        const i = e.texture;
        e.texture && xe.returnTexture(e.texture);
        const n = this._renderer, a = e.textureOptions.resolution || n.view.resolution, o = e.textureOptions.antialias ?? n.view.antialias;
        e.texture = xe.getOptimalTexture(
          s.width,
          s.height,
          a,
          o
        ), e._textureBounds || (e._textureBounds = new ye()), e._textureBounds.copyFrom(s), i !== e.texture && e.renderGroupParent && (e.renderGroupParent.structureDidChange = !0);
      }
    } else e.texture && (xe.returnTexture(e.texture), e.texture = null);
  }
  _updateRenderGroups(e) {
    const t = this._renderer, s = t.renderPipes;
    if (e.runOnRender(t), e.instructionSet.renderPipes = s, e.structureDidChange ? fi(e.childrenRenderablesToUpdate.list, 0) : jm(e, s), uc(e), e.structureDidChange ? (e.structureDidChange = !1, this._buildInstructions(e, t)) : this._updateRenderables(e), e.childrenRenderablesToUpdate.index = 0, t.renderPipes.batch.upload(e.instructionSet), !(e.isCachedAsTexture && !e.textureNeedsUpdate))
      for (let i = 0; i < e.renderGroupChildren.length; i++)
        this._updateRenderGroups(e.renderGroupChildren[i]);
  }
  _updateRenderables(e) {
    const { list: t, index: s } = e.childrenRenderablesToUpdate;
    for (let i = 0; i < s; i++) {
      const n = t[i];
      n.didViewUpdate && e.updateRenderable(n);
    }
    fi(t, s);
  }
  _buildInstructions(e, t) {
    const s = e.root, i = e.instructionSet;
    i.reset();
    const n = t.renderPipes ? t : t.batch.renderer, a = n.renderPipes;
    a.batch.buildStart(i), a.blendMode.buildStart(), a.colorMask.buildStart(), s.sortableChildren && s.sortChildren(), s.collectRenderablesWithEffects(i, n, null), a.batch.buildEnd(i), a.blendMode.buildEnd(i);
  }
}
fc.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem,
    T.CanvasSystem
  ],
  name: "renderGroup"
};
class pc {
  constructor(e) {
    this._gpuSpriteHash = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_gpuSpriteHash");
  }
  addRenderable(e, t) {
    const s = this._getGpuSprite(e);
    e.didViewUpdate && this._updateBatchableSprite(e, s), this._renderer.renderPipes.batch.addToBatch(s, t);
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
    Z.return(t), this._gpuSpriteHash[e.uid] = null, e.off("destroyed", this._destroyRenderableBound);
  }
  _updateBatchableSprite(e, t) {
    t.bounds = e.visualBounds, t.texture = e._texture;
  }
  _getGpuSprite(e) {
    return this._gpuSpriteHash[e.uid] || this._initGPUSprite(e);
  }
  _initGPUSprite(e) {
    const t = Z.get(Zs);
    return t.renderable = e, t.transform = e.groupTransform, t.texture = e._texture, t.bounds = e.visualBounds, t.roundPixels = this._renderer._roundPixels | e._roundPixels, this._gpuSpriteHash[e.uid] = t, e.on("destroyed", this._destroyRenderableBound), t;
  }
  destroy() {
    for (const e in this._gpuSpriteHash)
      Z.return(this._gpuSpriteHash[e]);
    this._gpuSpriteHash = null, this._renderer = null;
  }
}
pc.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "sprite"
};
const qi = class mc {
  constructor() {
    this.clearBeforeRender = !0, this._backgroundColor = new ae(0), this.color = this._backgroundColor, this.alpha = 1;
  }
  /**
   * initiates the background system
   * @param options - the options for the background colors
   */
  init(e) {
    e = { ...mc.defaultOptions, ...e }, this.clearBeforeRender = e.clearBeforeRender, this.color = e.background || e.backgroundColor || this._backgroundColor, this.alpha = e.backgroundAlpha, this._backgroundColor.setAlpha(e.backgroundAlpha);
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
qi.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem,
    T.CanvasSystem
  ],
  name: "background",
  priority: 0
};
qi.defaultOptions = {
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
let Km = qi;
const Jt = {};
V.handle(T.BlendMode, (r) => {
  if (!r.name)
    throw new Error("BlendMode extension must have a name property");
  Jt[r.name] = r.ref;
}, (r) => {
  delete Jt[r.name];
});
class gc {
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
  setBlendMode(e, t, s) {
    if (this._activeBlendMode === t) {
      this._isAdvanced && this._renderableList.push(e);
      return;
    }
    this._activeBlendMode = t, this._isAdvanced && this._endAdvancedBlendMode(s), this._isAdvanced = !!Jt[t], this._isAdvanced && (this._beginAdvancedBlendMode(s), this._renderableList.push(e));
  }
  _beginAdvancedBlendMode(e) {
    this._renderer.renderPipes.batch.break(e);
    const t = this._activeBlendMode;
    if (!Jt[t]) {
      $(`Unable to assign BlendMode: '${t}'. You may want to include: import 'pixi.js/advanced-blend-modes'`);
      return;
    }
    let s = this._filterHash[t];
    s || (s = this._filterHash[t] = new Fs(), s.filters = [new Jt[t]()]);
    const i = {
      renderPipeId: "filter",
      action: "pushFilter",
      renderables: [],
      filterEffect: s,
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
gc.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "blendMode"
};
const Ur = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp"
}, Zi = class _c {
  /** @param renderer - The renderer this System works for. */
  constructor(e) {
    this._renderer = e;
  }
  _normalizeOptions(e, t = {}) {
    return e instanceof pe || e instanceof H ? {
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
      _c.defaultImageOptions
    );
    const { format: t, quality: s } = e, i = this.canvas(e);
    if (i.toBlob !== void 0)
      return new Promise((n, a) => {
        i.toBlob((o) => {
          if (!o) {
            a(new Error("ICanvas.toBlob failed!"));
            return;
          }
          const h = new FileReader();
          h.onload = () => n(h.result), h.onerror = a, h.readAsDataURL(o);
        }, Ur[t], s);
      });
    if (i.toDataURL !== void 0)
      return i.toDataURL(Ur[t], s);
    if (i.convertToBlob !== void 0) {
      const n = await i.convertToBlob({ type: Ur[t], quality: s });
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
    const t = e.target, s = this._renderer;
    if (t instanceof H)
      return s.texture.generateCanvas(t);
    const i = s.textureGenerator.generateTexture(e), n = s.texture.generateCanvas(i);
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
    const t = e.target, s = this._renderer, i = t instanceof H ? t : s.textureGenerator.generateTexture(e), n = s.texture.getPixels(i);
    return t instanceof pe && i.destroy(!0), n;
  }
  /**
   * Will return a texture of the target
   * @param options - The options for creating the texture, or the target to extract
   * @returns - A texture of the target
   */
  texture(e) {
    return e = this._normalizeOptions(e), e.target instanceof H ? e.target : this._renderer.textureGenerator.generateTexture(e);
  }
  /**
   * Will extract a HTMLImage of the target and download it
   * @param options - The options for downloading and extracting the image, or the target to extract
   */
  download(e) {
    e = this._normalizeOptions(e);
    const t = this.canvas(e), s = document.createElement("a");
    s.download = e.filename ?? "image.png", s.href = t.toDataURL("image/png"), document.body.appendChild(s), s.click(), document.body.removeChild(s);
  }
  /**
   * Logs the target to the console as an image. This is a useful way to debug what's happening in the renderer.
   * @param options - The options for logging the image, or the target to log
   */
  log(e) {
    const t = e.width ?? 200;
    e = this._normalizeOptions(e);
    const s = this.canvas(e), i = s.toDataURL();
    console.log(`[Pixi Texture] ${s.width}px ${s.height}px`);
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
Zi.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem
  ],
  name: "extract"
};
Zi.defaultImageOptions = {
  /** The format of the image. */
  format: "png",
  /** The quality of the image. */
  quality: 1
};
let qm = Zi;
class Qi extends H {
  static create(e) {
    return new Qi({
      source: new _e(e)
    });
  }
  /**
   * Resizes the render texture.
   * @param width - The new width of the render texture.
   * @param height - The new height of the render texture.
   * @param resolution - The new resolution of the render texture.
   * @returns This texture.
   */
  resize(e, t, s) {
    return this.source.resize(e, t, s), this;
  }
}
const Zm = new oe(), Qm = new ye(), Jm = [0, 0, 0, 0];
class xc {
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
    var c;
    e instanceof pe && (e = {
      target: e,
      frame: void 0,
      textureSourceOptions: {},
      resolution: void 0
    });
    const t = e.resolution || this._renderer.resolution, s = e.antialias || this._renderer.view.antialias, i = e.target;
    let n = e.clearColor;
    n ? n = Array.isArray(n) && n.length === 4 ? n : ae.shared.setValue(n).toArray() : n = Jm;
    const a = ((c = e.frame) == null ? void 0 : c.copyTo(Zm)) || vi(i, Qm).rectangle;
    a.width = Math.max(a.width, 1 / t) | 0, a.height = Math.max(a.height, 1 / t) | 0;
    const o = Qi.create({
      ...e.textureSourceOptions,
      width: a.width,
      height: a.height,
      resolution: t,
      antialias: s
    }), h = z.shared.translate(-a.x, -a.y);
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
xc.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem
  ],
  name: "textureGenerator"
};
function ls(r, e, t) {
  const s = (r >> 24 & 255) / 255;
  e[t++] = (r & 255) / 255 * s, e[t++] = (r >> 8 & 255) / 255 * s, e[t++] = (r >> 16 & 255) / 255 * s, e[t++] = s;
}
class yc {
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
    worldTransformMatrix: s,
    worldColor: i,
    offset: n
  }) {
    const a = this._renderer.renderTarget.renderTarget, o = this._stackIndex ? this._globalUniformDataStack[this._stackIndex - 1] : {
      worldTransformMatrix: new z(),
      worldColor: 4294967295,
      offset: new he()
    }, h = {
      projectionMatrix: t || this._renderer.renderTarget.projectionMatrix,
      resolution: e || a.size,
      worldTransformMatrix: s || o.worldTransformMatrix,
      worldColor: i || o.worldColor,
      offset: n || o.offset,
      bindGroup: null
    }, c = this._uniformsPool.pop() || this._createUniforms();
    this._activeUniforms.push(c);
    const l = c.uniforms;
    l.uProjectionMatrix = h.projectionMatrix, l.uResolution = h.resolution, l.uWorldTransformMatrix.copyFrom(h.worldTransformMatrix), l.uWorldTransformMatrix.tx -= h.offset.x, l.uWorldTransformMatrix.ty -= h.offset.y, ls(
      h.worldColor,
      l.uWorldColorAlpha,
      0
    ), c.update();
    let u;
    this._renderer.renderPipes.uniformBatch ? u = this._renderer.renderPipes.uniformBatch.getUniformBindGroup(c, !1) : (u = this._bindGroupPool.pop() || new Ze(), this._activeBindGroups.push(u), u.setResource(c, 0)), h.bindGroup = u, this._currentGlobalUniformData = h;
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
    return new ve({
      uProjectionMatrix: { value: new z(), type: "mat3x3<f32>" },
      uWorldTransformMatrix: { value: new z(), type: "mat3x3<f32>" },
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
yc.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem,
    T.CanvasSystem
  ],
  name: "globalUniforms"
};
let eg = 1;
class bc {
  constructor() {
    this._tasks = [], this._offset = 0;
  }
  /** Initializes the scheduler system and starts the ticker. */
  init() {
    Ve.system.add(this._update, this);
  }
  /**
   * Schedules a repeating task.
   * @param func - The function to execute.
   * @param duration - The interval duration in milliseconds.
   * @param useOffset - this will spread out tasks so that they do not all run at the same time
   * @returns The unique identifier for the scheduled task.
   */
  repeat(e, t, s = !0) {
    const i = eg++;
    let n = 0;
    return s && (this._offset += 1e3, n = this._offset), this._tasks.push({
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
      const s = this._tasks[t];
      if (e - s.offset - s.last >= s.duration) {
        const i = e - s.start;
        s.func(i), s.last = e;
      }
    }
  }
  /**
   * Destroys the scheduler system and removes all tasks.
   * @internal
   * @ignore
   */
  destroy() {
    Ve.system.remove(this._update, this), this._tasks.length = 0;
  }
}
bc.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem,
    T.CanvasSystem
  ],
  name: "scheduler",
  priority: 0
};
let Na = !1;
function tg(r) {
  if (!Na) {
    if (J.get().getNavigator().userAgent.toLowerCase().indexOf("chrome") > -1) {
      const e = [
        `%c  %c  %c  %c  %c PixiJS %c v${Ns} (${r}) http://www.pixijs.com/

`,
        "background: #E72264; padding:5px 0;",
        "background: #6CA2EA; padding:5px 0;",
        "background: #B5D33D; padding:5px 0;",
        "background: #FED23F; padding:5px 0;",
        "color: #FFFFFF; background: #E72264; padding:5px 0;",
        "color: #E72264; background: #FFFFFF; padding:5px 0;"
      ];
      globalThis.console.log(...e);
    } else globalThis.console && globalThis.console.log(`PixiJS ${Ns} - ${r} - http://www.pixijs.com/`);
    Na = !0;
  }
}
class Ji {
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
      this._renderer.type === Oe.WEBGL && (t += ` ${this._renderer.context.webGLVersion}`), tg(t);
    }
  }
}
Ji.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem,
    T.CanvasSystem
  ],
  name: "hello",
  priority: -2
};
Ji.defaultOptions = {
  /** {@link WebGLOptions.hello} */
  hello: !1
};
function sg(r) {
  let e = !1;
  for (const s in r)
    if (r[s] == null) {
      e = !0;
      break;
    }
  if (!e)
    return r;
  const t = /* @__PURE__ */ Object.create(null);
  for (const s in r) {
    const i = r[s];
    i && (t[s] = i);
  }
  return t;
}
function rg(r) {
  let e = 0;
  for (let t = 0; t < r.length; t++)
    r[t] == null ? e++ : r[t - e] = r[t];
  return r.length -= e, r;
}
let ig = 0;
const en = class vc {
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
    e = { ...vc.defaultOptions, ...e }, this.maxUnusedTime = e.renderableGCMaxUnusedTime, this._frequency = e.renderableGCFrequency, this.enabled = e.renderableGCActive;
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
          rg(t.context[t.hash]);
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
    this._now = performance.now(), e.renderGroup.gcTick = ig++, this._updateInstructionGCTick(e.renderGroup, e.renderGroup.gcTick);
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
    const e = this._now, t = this._managedRenderables, s = this._renderer.renderPipes;
    let i = 0;
    for (let a = 0; a < t.length; a++) {
      const o = t[a];
      if (o === null) {
        i++;
        continue;
      }
      const h = o.renderGroup ?? o.parentRenderGroup, c = ((n = h == null ? void 0 : h.instructionSet) == null ? void 0 : n.gcTick) ?? -1;
      if (((h == null ? void 0 : h.gcTick) ?? 0) === c && (o._lastUsed = e), e - o._lastUsed > this.maxUnusedTime) {
        if (!o.destroyed) {
          const l = s;
          h && (h.structureDidChange = !0), l[o.renderPipeId].destroyRenderable(o);
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
    for (const s of e.renderGroupChildren)
      this._updateInstructionGCTick(s, t);
  }
};
en.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem
  ],
  name: "renderableGC",
  priority: 0
};
en.defaultOptions = {
  /** Enable/disable the garbage collector */
  renderableGCActive: !0,
  /** Time in ms before an unused resource is collected (default 1 minute) */
  renderableGCMaxUnusedTime: 6e4,
  /** How often to run garbage collection in ms (default 30 seconds) */
  renderableGCFrequency: 3e4
};
let ng = en;
const tn = class Tc {
  /** @param renderer - The renderer this System works for. */
  constructor(e) {
    this._renderer = e, this.count = 0, this.checkCount = 0;
  }
  init(e) {
    e = { ...Tc.defaultOptions, ...e }, this.checkCountMax = e.textureGCCheckCountMax, this.maxIdle = e.textureGCAMaxIdle ?? e.textureGCMaxIdle, this.active = e.textureGCActive;
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
      const s = e[t];
      s.autoGarbageCollect && s.resource && s._touched > -1 && this.count - s._touched > this.maxIdle && (s._touched = -1, s.unload());
    }
  }
  destroy() {
    this._renderer = null;
  }
};
tn.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem
  ],
  name: "textureGC"
};
tn.defaultOptions = {
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
let ag = tn;
const sn = class Sc {
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
      ...Sc.defaultOptions,
      ...e
    }, e.view && (j(q, "ViewSystem.view has been renamed to ViewSystem.canvas"), e.canvas = e.view), this.screen = new oe(0, 0, e.width, e.height), this.canvas = e.canvas || J.get().createCanvas(), this.antialias = !!e.antialias, this.texture = Kh(this.canvas, e), this.renderTarget = new li({
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
  resize(e, t, s) {
    this.texture.source.resize(e, t, s), this.screen.width = this.texture.frame.width, this.screen.height = this.texture.frame.height;
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
sn.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem,
    T.CanvasSystem
  ],
  name: "view",
  priority: 0
};
sn.defaultOptions = {
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
let og = sn;
const wc = [
  Km,
  yc,
  Ji,
  og,
  fc,
  ag,
  xc,
  qm,
  Ho,
  ng,
  bc
], Ac = [
  gc,
  Rh,
  pc,
  lc,
  kh,
  Gh,
  Ih,
  cc
], hg = [
  ...wc,
  Yh,
  im,
  Jp,
  Uh,
  ac,
  Jh,
  Lh,
  rc,
  sc,
  Wh,
  km,
  zh,
  Hh
], cg = [...Ac], lg = [Eh, hc, oc], Cc = [], Pc = [], Ec = [];
V.handleByNamedList(T.WebGLSystem, Cc);
V.handleByNamedList(T.WebGLPipes, Pc);
V.handleByNamedList(T.WebGLPipesAdaptor, Ec);
V.add(...hg, ...cg, ...lg);
class ug extends Ys {
  constructor() {
    const e = {
      name: "webgl",
      type: Oe.WEBGL,
      systems: Cc,
      renderPipes: Pc,
      renderPipeAdaptors: Ec
    };
    super(e);
  }
}
const dg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  WebGLRenderer: ug
}, Symbol.toStringTag, { value: "Module" }));
class Mc {
  constructor(e) {
    this._hash = /* @__PURE__ */ Object.create(null), this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_hash");
  }
  contextChange(e) {
    this._gpu = e;
  }
  getBindGroup(e, t, s) {
    return e._updateKey(), this._hash[e._key] || this._createBindGroup(e, t, s);
  }
  _createBindGroup(e, t, s) {
    const i = this._gpu.device, n = t.layout[s], a = [], o = this._renderer;
    for (const l in n) {
      const u = e.resources[l] ?? e.resources[n[l]];
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
        binding: n[l],
        resource: d
      });
    }
    const h = o.shader.getProgramData(t).bindGroups[s], c = i.createBindGroup({
      layout: h,
      entries: a
    });
    return this._hash[e._key] = c, c;
  }
  destroy() {
    for (const e of Object.keys(this._hash))
      this._hash[e] = null;
    this._hash = null, this._renderer = null;
  }
}
Mc.extension = {
  type: [
    T.WebGPUSystem
  ],
  name: "bindGroup"
};
class Bc {
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
    const t = this._gpuBuffers[e.uid] || this.createGPUBuffer(e), s = e.data;
    return e._updateID && s && (e._updateID = 0, this._gpu.device.queue.writeBuffer(
      t,
      0,
      s.buffer,
      0,
      // round to the nearest 4 bytes
      (e._updateSize || s.byteLength) + 3 & -4
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
    return e._updateID = 0, e.data && (ti(e.data.buffer, t.getMappedRange()), t.unmap()), this._gpuBuffers[e.uid] = t, t;
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
Bc.extension = {
  type: [
    T.WebGPUSystem
  ],
  name: "buffer"
};
class fg {
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
    let s = t + e * 4;
    if (s = Math.ceil(s / this._minUniformOffsetAlignment) * this._minUniformOffsetAlignment, s > this.data.length * 4)
      throw new Error("UniformBufferBatch: ubo batch got too big");
    return this.byteIndex = s, t;
  }
  addGroup(e) {
    const t = this.addEmptyGroup(e.length);
    for (let s = 0; s < e.length; s++)
      this.data[t / 4 + s] = e[s];
    return t;
  }
  destroy() {
    this.data = null;
  }
}
class Rc {
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
Rc.extension = {
  type: [
    T.WebGPUSystem
  ],
  name: "colorMask"
};
class rn {
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
    const t = await J.get().getNavigator().gpu.requestAdapter({
      powerPreference: e.powerPreference,
      forceFallbackAdapter: e.forceFallbackAdapter
    }), s = [
      "texture-compression-bc",
      "texture-compression-astc",
      "texture-compression-etc2"
    ].filter((n) => t.features.has(n)), i = await t.requestDevice({
      requiredFeatures: s
    });
    return { adapter: t, device: i };
  }
  destroy() {
    this.gpu = null, this._renderer = null;
  }
}
rn.extension = {
  type: [
    T.WebGPUSystem
  ],
  name: "device"
};
rn.defaultOptions = {
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
class kc {
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
  setPipelineFromGeometryProgramAndState(e, t, s, i) {
    const n = this._renderer.pipeline.getPipeline(e, t, s, i);
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
  setBindGroup(e, t, s) {
    if (this._boundBindGroup[e] === t)
      return;
    this._boundBindGroup[e] = t, t._touch(this._renderer.textureGC.count);
    const i = this._renderer.bindGroup.getBindGroup(t, s, e);
    this.renderPassEncoder.setBindGroup(e, i);
  }
  setGeometry(e, t) {
    const s = this._renderer.pipeline.getBufferNamesToBind(e, t);
    for (const i in s)
      this._setVertexBuffer(i, e.attributes[s[i]].buffer);
    e.indexBuffer && this._setIndexBuffer(e.indexBuffer);
  }
  _setShaderBindGroups(e, t) {
    for (const s in e.groups) {
      const i = e.groups[s];
      t || this._syncBindGroup(i), this.setBindGroup(s, i, e.gpuProgram);
    }
  }
  _syncBindGroup(e) {
    for (const t in e.resources) {
      const s = e.resources[t];
      s.isUniformGroup && this._renderer.ubo.updateUniformGroup(s);
    }
  }
  draw(e) {
    const { geometry: t, shader: s, state: i, topology: n, size: a, start: o, instanceCount: h, skipSync: c } = e;
    this.setPipelineFromGeometryProgramAndState(t, s.gpuProgram, i, n), this.setGeometry(t, s.gpuProgram), this._setShaderBindGroups(s, c), t.indexBuffer ? this.renderPassEncoder.drawIndexed(
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
    const t = this._boundPipeline, s = { ...this._boundVertexBuffer }, i = this._boundIndexBuffer, n = { ...this._boundBindGroup };
    this._clearCache();
    const a = this._renderer.renderTarget.viewport;
    this.renderPassEncoder.setViewport(a.x, a.y, a.width, a.height, 0, 1), this.setPipeline(t);
    for (const o in s)
      this._setVertexBuffer(o, s[o]);
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
kc.extension = {
  type: [T.WebGPUSystem],
  name: "encoder",
  priority: 1
};
class Ic {
  constructor(e) {
    this._renderTargetStencilState = /* @__PURE__ */ Object.create(null), this._renderer = e, e.renderTarget.onRenderTargetChange.add(this);
  }
  onRenderTargetChange(e) {
    let t = this._renderTargetStencilState[e.uid];
    t || (t = this._renderTargetStencilState[e.uid] = {
      stencilMode: me.DISABLED,
      stencilReference: 0
    }), this._activeRenderTarget = e, this.setStencilMode(t.stencilMode, t.stencilReference);
  }
  setStencilMode(e, t) {
    const s = this._renderTargetStencilState[this._activeRenderTarget.uid];
    s.stencilMode = e, s.stencilReference = t;
    const i = this._renderer;
    i.pipeline.setStencilMode(e), i.encoder.renderPassEncoder.setStencilReference(t);
  }
  destroy() {
    this._renderer.renderTarget.onRenderTargetChange.remove(this), this._renderer = null, this._activeRenderTarget = null, this._renderTargetStencilState = null;
  }
}
Ic.extension = {
  type: [
    T.WebGPUSystem
  ],
  name: "stencil"
};
const Us = {
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
function pg(r) {
  const e = r.map((s) => ({
    data: s,
    offset: 0,
    size: 0
  }));
  let t = 0;
  for (let s = 0; s < e.length; s++) {
    const i = e[s];
    let n = Us[i.data.type].size;
    const a = Us[i.data.type].align;
    if (!Us[i.data.type])
      throw new Error(`[Pixi.js] WebGPU UniformBuffer: Unknown type ${i.data.type}`);
    i.data.size > 1 && (n = Math.max(n, a) * i.data.size), t = Math.ceil(t / a) * a, i.size = n, i.offset = t, t += n;
  }
  return t = Math.ceil(t / 16) * 16, { uboElements: e, size: t };
}
function mg(r, e) {
  const { size: t, align: s } = Us[r.data.type], i = (s - t) / 4, n = r.data.type.indexOf("i32") >= 0 ? "dataInt32" : "data";
  return `
         v = uv.${r.data.name};
         ${e !== 0 ? `offset += ${e};` : ""}

         arrayOffset = offset;

         t = 0;

         for(var i=0; i < ${r.data.size * (t / 4)}; i++)
         {
             for(var j = 0; j < ${t / 4}; j++)
             {
                 ${n}[arrayOffset++] = v[t++];
             }
             ${i !== 0 ? `arrayOffset += ${i};` : ""}
         }
     `;
}
function gg(r) {
  return Xh(
    r,
    "uboWgsl",
    mg,
    om
  );
}
class Gc extends Vh {
  constructor() {
    super({
      createUboElements: pg,
      generateUboSync: gg
    });
  }
}
Gc.extension = {
  type: [T.WebGPUSystem],
  name: "ubo"
};
const et = 128;
class Uc {
  constructor(e) {
    this._bindGroupHash = /* @__PURE__ */ Object.create(null), this._buffers = [], this._bindGroups = [], this._bufferResources = [], this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_bindGroupHash"), this._batchBuffer = new fg({ minUniformOffsetAlignment: et });
    const t = 256 / et;
    for (let s = 0; s < t; s++) {
      let i = Q.UNIFORM | Q.COPY_DST;
      s === 0 && (i |= Q.COPY_SRC), this._buffers.push(new Me({
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
    const s = e.buffer.data, i = this._batchBuffer.addEmptyGroup(s.length);
    return this._renderer.ubo.syncUniformGroup(e, this._batchBuffer.data, i / 4), this._bindGroupHash[e.uid] = this._getBindGroup(i / et), this._bindGroupHash[e.uid];
  }
  getUboResource(e) {
    this._renderer.ubo.updateUniformGroup(e);
    const t = e.buffer.data, s = this._batchBuffer.addGroup(t);
    return this._getBufferResource(s / et);
  }
  getArrayBindGroup(e) {
    const t = this._batchBuffer.addGroup(e);
    return this._getBindGroup(t / et);
  }
  getArrayBufferResource(e) {
    const s = this._batchBuffer.addGroup(e) / et;
    return this._getBufferResource(s);
  }
  _getBufferResource(e) {
    if (!this._bufferResources[e]) {
      const t = this._buffers[e % 2];
      this._bufferResources[e] = new Ki({
        buffer: t,
        offset: (e / 2 | 0) * 256,
        size: et
      });
    }
    return this._bufferResources[e];
  }
  _getBindGroup(e) {
    if (!this._bindGroups[e]) {
      const t = new Ze({
        0: this._getBufferResource(e)
      });
      this._bindGroups[e] = t;
    }
    return this._bindGroups[e];
  }
  _uploadBindGroups() {
    const e = this._renderer.buffer, t = this._buffers[0];
    t.update(this._batchBuffer.byteIndex), e.updateBuffer(t);
    const s = this._renderer.gpu.device.createCommandEncoder();
    for (let i = 1; i < this._buffers.length; i++) {
      const n = this._buffers[i];
      s.copyBufferToBuffer(
        e.getGPUBuffer(t),
        et,
        e.getGPUBuffer(n),
        0,
        this._batchBuffer.byteIndex
      );
    }
    this._renderer.gpu.device.queue.submit([s.finish()]);
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
Uc.extension = {
  type: [
    T.WebGPUPipes
  ],
  name: "uniformBatch"
};
const _g = {
  "point-list": 0,
  "line-list": 1,
  "line-strip": 2,
  "triangle-list": 3,
  "triangle-strip": 4
};
function xg(r, e, t, s, i) {
  return r << 24 | e << 16 | t << 10 | s << 5 | i;
}
function yg(r, e, t, s) {
  return t << 6 | r << 3 | s << 1 | e;
}
class Fc {
  constructor(e) {
    this._moduleCache = /* @__PURE__ */ Object.create(null), this._bufferLayoutsCache = /* @__PURE__ */ Object.create(null), this._bindingNamesCache = /* @__PURE__ */ Object.create(null), this._pipeCache = /* @__PURE__ */ Object.create(null), this._pipeStateCaches = /* @__PURE__ */ Object.create(null), this._colorMask = 15, this._multisampleCount = 1, this._renderer = e;
  }
  contextChange(e) {
    this._gpu = e, this.setStencilMode(me.DISABLED), this._updatePipeHash();
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
    this._stencilMode !== e && (this._stencilMode = e, this._stencilState = ot[e], this._updatePipeHash());
  }
  setPipeline(e, t, s, i) {
    const n = this.getPipeline(e, t, s);
    i.setPipeline(n);
  }
  getPipeline(e, t, s, i) {
    e._layoutKey || (Dh(e, t.attributeData), this._generateBufferKey(e)), i || (i = e.topology);
    const n = xg(
      e._layoutKey,
      t._layoutKey,
      s.data,
      s._blendModeId,
      _g[i]
    );
    return this._pipeCache[n] ? this._pipeCache[n] : (this._pipeCache[n] = this._createPipeline(e, t, s, i), this._pipeCache[n]);
  }
  _createPipeline(e, t, s, i) {
    const n = this._gpu.device, a = this._createVertexBufferLayouts(e, t), o = this._renderer.state.getColorTargets(s);
    o[0].writeMask = this._stencilMode === me.RENDERING_MASK_ADD ? 0 : this._colorMask;
    const h = this._renderer.shader.getProgramData(t).pipeline, c = {
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
        cullMode: s.cullMode
      },
      layout: h,
      multisample: {
        count: this._multisampleCount
      },
      // depthStencil,
      label: "PIXI Pipeline"
    };
    return this._depthStencilAttachment && (c.depthStencil = {
      ...this._stencilState,
      format: "depth24plus-stencil8",
      depthWriteEnabled: s.depthTest,
      depthCompare: s.depthTest ? "less" : "always"
    }), n.createRenderPipeline(c);
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
    let s = 0;
    const i = Object.keys(e.attributes).sort();
    for (let a = 0; a < i.length; a++) {
      const o = e.attributes[i[a]];
      t[s++] = o.offset, t[s++] = o.format, t[s++] = o.stride, t[s++] = o.instance;
    }
    const n = t.join("|");
    return e._layoutKey = ss(n, "geometry"), e._layoutKey;
  }
  _generateAttributeLocationsKey(e) {
    const t = [];
    let s = 0;
    const i = Object.keys(e.attributeData).sort();
    for (let a = 0; a < i.length; a++) {
      const o = e.attributeData[i[a]];
      t[s++] = o.location;
    }
    const n = t.join("|");
    return e._attributeLocationsKey = ss(n, "programAttributes"), e._attributeLocationsKey;
  }
  /**
   * Returns a hash of buffer names mapped to bind locations.
   * This is used to bind the correct buffer to the correct location in the shader.
   * @param geometry - The geometry where to get the buffer names
   * @param program - The program where to get the buffer names
   * @returns An object of buffer names mapped to the bind location.
   */
  getBufferNamesToBind(e, t) {
    const s = e._layoutKey << 16 | t._attributeLocationsKey;
    if (this._bindingNamesCache[s])
      return this._bindingNamesCache[s];
    const i = this._createVertexBufferLayouts(e, t), n = /* @__PURE__ */ Object.create(null), a = t.attributeData;
    for (let o = 0; o < i.length; o++) {
      const c = Object.values(i[o].attributes)[0].shaderLocation;
      for (const l in a)
        if (a[l].location === c) {
          n[o] = l;
          break;
        }
    }
    return this._bindingNamesCache[s] = n, n;
  }
  _createVertexBufferLayouts(e, t) {
    t._attributeLocationsKey || this._generateAttributeLocationsKey(t);
    const s = e._layoutKey << 16 | t._attributeLocationsKey;
    if (this._bufferLayoutsCache[s])
      return this._bufferLayoutsCache[s];
    const i = [];
    return e.buffers.forEach((n) => {
      const a = {
        arrayStride: 0,
        stepMode: "vertex",
        attributes: []
      }, o = a.attributes;
      for (const h in t.attributeData) {
        const c = e.attributes[h];
        (c.divisor ?? 1) !== 1 && $(`Attribute ${h} has an invalid divisor value of '${c.divisor}'. WebGPU only supports a divisor value of 1`), c.buffer === n && (a.arrayStride = c.stride, a.stepMode = c.instance ? "instance" : "vertex", o.push({
          shaderLocation: t.attributeData[h].location,
          offset: c.offset,
          format: c.format
        }));
      }
      o.length && i.push(a);
    }), this._bufferLayoutsCache[s] = i, i;
  }
  _updatePipeHash() {
    const e = yg(
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
Fc.extension = {
  type: [T.WebGPUSystem],
  name: "pipeline"
};
class bg {
  constructor() {
    this.contexts = [], this.msaaTextures = [], this.msaaSamples = 1;
  }
}
class vg {
  init(e, t) {
    this._renderer = e, this._renderTargetSystem = t;
  }
  copyToTexture(e, t, s, i, n) {
    const a = this._renderer, o = this._getGpuColorTexture(
      e
    ), h = a.texture.getGpuSource(
      t.source
    );
    return a.encoder.commandEncoder.copyTextureToTexture(
      {
        texture: o,
        origin: s
      },
      {
        texture: h,
        origin: n
      },
      i
    ), t;
  }
  startRenderPass(e, t = !0, s, i) {
    const a = this._renderTargetSystem.getGpuRenderTarget(e), o = this.getDescriptor(e, t, s);
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
  getDescriptor(e, t, s) {
    typeof t == "boolean" && (t = t ? Pe.ALL : Pe.NONE);
    const i = this._renderTargetSystem, n = i.getGpuRenderTarget(e), a = e.colorTextures.map(
      (c, l) => {
        const u = n.contexts[l];
        let d, f;
        u ? d = u.getCurrentTexture().createView() : d = this._renderer.texture.getGpuSource(c).createView({
          mipLevelCount: 1
        }), n.msaaTextures[l] && (f = d, d = this._renderer.texture.getTextureView(
          n.msaaTextures[l]
        ));
        const p = t & Pe.COLOR ? "clear" : "load";
        return s ?? (s = i.defaultClearColor), {
          view: d,
          resolveTarget: f,
          clearValue: s,
          storeOp: "store",
          loadOp: p
        };
      }
    );
    let o;
    if ((e.stencil || e.depth) && !e.depthStencilTexture && (e.ensureDepthStencilTexture(), e.depthStencilTexture.source.sampleCount = n.msaa ? 4 : 1), e.depthStencilTexture) {
      const c = t & Pe.STENCIL ? "clear" : "load", l = t & Pe.DEPTH ? "clear" : "load";
      o = {
        view: this._renderer.texture.getGpuSource(e.depthStencilTexture.source).createView(),
        stencilStoreOp: "store",
        stencilLoadOp: c,
        depthClearValue: 1,
        depthLoadOp: l,
        depthStoreOp: "store"
      };
    }
    return {
      colorAttachments: a,
      depthStencilAttachment: o
    };
  }
  clear(e, t = !0, s, i) {
    if (!t)
      return;
    const { gpu: n, encoder: a } = this._renderer, o = n.device;
    if (a.commandEncoder === null) {
      const c = o.createCommandEncoder(), l = this.getDescriptor(e, t, s), u = c.beginRenderPass(l);
      u.setViewport(i.x, i.y, i.width, i.height, 0, 1), u.end();
      const d = c.finish();
      o.queue.submit([d]);
    } else
      this.startRenderPass(e, t, s, i);
  }
  initGpuRenderTarget(e) {
    e.isRoot = !0;
    const t = new bg();
    return e.colorTextures.forEach((s, i) => {
      if (qe.test(s.resource)) {
        const n = s.resource.getContext(
          "webgpu"
        ), a = s.transparent ? "premultiplied" : "opaque";
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
      if (t.msaa = s.source.antialias, s.source.antialias) {
        const n = new _e({
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
    t.width = e.width, t.height = e.height, t.msaa && e.colorTextures.forEach((s, i) => {
      const n = t.msaaTextures[i];
      n == null || n.resize(
        s.source.width,
        s.source.height,
        s.source._resolution
      );
    });
  }
}
class Dc extends Qh {
  constructor(e) {
    super(e), this.adaptor = new vg(), this.adaptor.init(e, this);
  }
}
Dc.extension = {
  type: [T.WebGPUSystem],
  name: "renderTarget"
};
class Oc {
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
    const t = this._gpu.device, s = e.gpuLayout.map((n) => t.createBindGroupLayout({ entries: n })), i = { bindGroupLayouts: s };
    return this._gpuProgramData[e._layoutKey] = {
      bindGroups: s,
      pipeline: t.createPipelineLayout(i)
    }, this._gpuProgramData[e._layoutKey];
  }
  destroy() {
    this._gpu = null, this._gpuProgramData = null;
  }
}
Oc.extension = {
  type: [
    T.WebGPUSystem
  ],
  name: "shader"
};
const we = {};
we.normal = {
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
we.add = {
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
we.multiply = {
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
we.screen = {
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
we.overlay = {
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
we.none = {
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
we["normal-npm"] = {
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
we["add-npm"] = {
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
we["screen-npm"] = {
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
we.erase = {
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
we.min = {
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
we.max = {
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
class Lc {
  constructor() {
    this.defaultState = new Ie(), this.defaultState.blend = !0;
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
        blend: we[e.blendMode] || we.normal
      }
    ];
  }
  destroy() {
    this.gpu = null;
  }
}
Lc.extension = {
  type: [
    T.WebGPUSystem
  ],
  name: "state"
};
const Tg = {
  type: "image",
  upload(r, e, t) {
    const s = r.resource, i = (r.pixelWidth | 0) * (r.pixelHeight | 0), n = s.byteLength / i;
    t.device.queue.writeTexture(
      { texture: e },
      s,
      {
        offset: 0,
        rowsPerImage: r.pixelHeight,
        bytesPerRow: r.pixelHeight * n
      },
      {
        width: r.pixelWidth,
        height: r.pixelHeight,
        depthOrArrayLayers: 1
      }
    );
  }
}, Nc = {
  "bc1-rgba-unorm": { blockBytes: 8, blockWidth: 4, blockHeight: 4 },
  "bc2-rgba-unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
  "bc3-rgba-unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
  "bc7-rgba-unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
  "etc1-rgb-unorm": { blockBytes: 8, blockWidth: 4, blockHeight: 4 },
  "etc2-rgba8unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
  "astc-4x4-unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 }
}, Sg = { blockBytes: 4, blockWidth: 1, blockHeight: 1 }, wg = {
  type: "compressed",
  upload(r, e, t) {
    let s = r.pixelWidth, i = r.pixelHeight;
    const n = Nc[r.format] || Sg;
    for (let a = 0; a < r.resource.length; a++) {
      const o = r.resource[a], h = Math.ceil(s / n.blockWidth) * n.blockBytes;
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
          width: Math.ceil(s / n.blockWidth) * n.blockWidth,
          height: Math.ceil(i / n.blockHeight) * n.blockHeight,
          depthOrArrayLayers: 1
        }
      ), s = Math.max(s >> 1, 1), i = Math.max(i >> 1, 1);
    }
  }
}, Hc = {
  type: "image",
  upload(r, e, t) {
    const s = r.resource;
    if (!s)
      return;
    const i = Math.min(e.width, r.resourceWidth || r.pixelWidth), n = Math.min(e.height, r.resourceHeight || r.pixelHeight), a = r.alphaMode === "premultiply-alpha-on-upload";
    t.device.queue.copyExternalImageToTexture(
      { source: s },
      { texture: e, premultipliedAlpha: a },
      {
        width: i,
        height: n
      }
    );
  }
}, Ag = {
  type: "video",
  upload(r, e, t) {
    Hc.upload(r, e, t);
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
    let s = e;
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
      s = this.device.createTexture(h);
    }
    const a = this.device.createCommandEncoder({}), o = t.getBindGroupLayout(0);
    for (let h = 0; h < i; ++h) {
      let c = e.createView({
        baseMipLevel: 0,
        mipLevelCount: 1,
        dimension: "2d",
        baseArrayLayer: h,
        arrayLayerCount: 1
      }), l = n ? 1 : 0;
      for (let u = 1; u < e.mipLevelCount; ++u) {
        const d = s.createView({
          baseMipLevel: l++,
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
            resource: c
          }]
        });
        f.setPipeline(t), f.setBindGroup(0, p), f.draw(3, 1, 0, 0), f.end(), c = d;
      }
    }
    if (!n) {
      const h = {
        width: Math.ceil(e.width / 2),
        height: Math.ceil(e.height / 2),
        depthOrArrayLayers: i
      };
      for (let c = 1; c < e.mipLevelCount; ++c)
        a.copyTextureToTexture({
          texture: s,
          mipLevel: c - 1
        }, {
          texture: e,
          mipLevel: c
        }, h), h.width = Math.ceil(h.width / 2), h.height = Math.ceil(h.height / 2);
    }
    return this.device.queue.submit([a.finish()]), n || s.destroy(), e;
  }
}
class Wc {
  constructor(e) {
    this.managedTextures = [], this._gpuSources = /* @__PURE__ */ Object.create(null), this._gpuSamplers = /* @__PURE__ */ Object.create(null), this._bindGroupHash = /* @__PURE__ */ Object.create(null), this._textureViewHash = /* @__PURE__ */ Object.create(null), this._uploads = {
      image: Hc,
      buffer: Tg,
      video: Ag,
      compressed: wg
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
    const s = Nc[e.format] || { blockWidth: 1, blockHeight: 1 }, i = Math.ceil(e.pixelWidth / s.blockWidth) * s.blockWidth, n = Math.ceil(e.pixelHeight / s.blockHeight) * s.blockHeight, a = {
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
    return this._bindGroupHash[e.uid] = new Ze({
      0: t,
      1: t.style,
      2: new ve({
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
    const t = this._renderer, s = t.gpu.device.createCommandEncoder(), i = J.get().createCanvas();
    i.width = e.source.pixelWidth, i.height = e.source.pixelHeight;
    const n = i.getContext("webgpu");
    return n.configure({
      device: t.gpu.device,
      usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
      format: J.get().getNavigator().gpu.getPreferredCanvasFormat(),
      alphaMode: "premultiplied"
    }), s.copyTextureToTexture({
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
    }), t.gpu.device.queue.submit([s.finish()]), i;
  }
  getPixels(e) {
    const t = this.generateCanvas(e), s = Qe.getOptimalCanvasAndContext(t.width, t.height), i = s.context;
    i.drawImage(t, 0, 0);
    const { width: n, height: a } = t, o = i.getImageData(0, 0, n, a), h = new Uint8ClampedArray(o.data.buffer);
    return Qe.returnCanvasAndContext(s), { pixels: h, width: n, height: a };
  }
  destroy() {
    this.managedTextures.slice().forEach((e) => this.onSourceDestroy(e)), this.managedTextures = null;
    for (const e of Object.keys(this._bindGroupHash)) {
      const t = Number(e), s = this._bindGroupHash[t];
      s == null || s.destroy(), this._bindGroupHash[t] = null;
    }
    this._gpu = null, this._mipmapGenerator = null, this._gpuSources = null, this._bindGroupHash = null, this._textureViewHash = null, this._gpuSamplers = null;
  }
}
Wc.extension = {
  type: [
    T.WebGPUSystem
  ],
  name: "texture"
};
class zc {
  init() {
    const e = new ve({
      uTransformMatrix: { value: new z(), type: "mat3x3<f32>" },
      uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
      uRound: { value: 0, type: "f32" }
    }), t = as({
      name: "graphics",
      bits: [
        Mi,
        Ri(It()),
        jp,
        hs
      ]
    });
    this.shader = new Ge({
      gpuProgram: t,
      resources: {
        // added on the fly!
        localUniforms: e
      }
    });
  }
  execute(e, t) {
    const s = t.context, i = s.customShader || this.shader, n = e.renderer, a = n.graphicsContext, {
      batcher: o,
      instructions: h
    } = a.getContextRenderData(s), c = n.encoder;
    c.setGeometry(o.geometry, i.gpuProgram);
    const l = n.globalUniforms.bindGroup;
    c.setBindGroup(0, l, i.gpuProgram);
    const u = n.renderPipes.uniformBatch.getUniformBindGroup(i.resources.localUniforms, !0);
    c.setBindGroup(2, u, i.gpuProgram);
    const d = h.instructions;
    let f = null;
    for (let p = 0; p < h.instructionSize; p++) {
      const g = d[p];
      if (g.topology !== f && (f = g.topology, c.setPipelineFromGeometryProgramAndState(
        o.geometry,
        i.gpuProgram,
        e.state,
        g.topology
      )), i.groups[1] = g.bindGroup, !g.gpuBindGroup) {
        const m = g.textures;
        g.bindGroup = Ei(m.textures, m.count), g.gpuBindGroup = n.bindGroup.getBindGroup(
          g.bindGroup,
          i.gpuProgram,
          1
        );
      }
      c.setBindGroup(1, g.bindGroup, i.gpuProgram), c.renderPassEncoder.drawIndexed(g.size, 1, g.start);
    }
  }
  destroy() {
    this.shader.destroy(!0), this.shader = null;
  }
}
zc.extension = {
  type: [
    T.WebGPUPipesAdaptor
  ],
  name: "graphics"
};
class Vc {
  init() {
    const e = as({
      name: "mesh",
      bits: [
        Qt,
        Yp,
        hs
      ]
    });
    this._shader = new Ge({
      gpuProgram: e,
      resources: {
        uTexture: H.EMPTY._source,
        uSampler: H.EMPTY._source.style,
        textureUniforms: {
          uTextureMatrix: { type: "mat3x3<f32>", value: new z() }
        }
      }
    });
  }
  execute(e, t) {
    const s = e.renderer;
    let i = t._shader;
    if (!i)
      i = this._shader, i.groups[2] = s.texture.getTextureBindGroup(t.texture);
    else if (!i.gpuProgram) {
      $("Mesh shader has no gpuProgram", t.shader);
      return;
    }
    const n = i.gpuProgram;
    if (n.autoAssignGlobalUniforms && (i.groups[0] = s.globalUniforms.bindGroup), n.autoAssignLocalUniforms) {
      const a = e.localUniforms;
      i.groups[1] = s.renderPipes.uniformBatch.getUniformBindGroup(a, !0);
    }
    s.encoder.draw({
      geometry: t._geometry,
      shader: i,
      state: t.state
    });
  }
  destroy() {
    this._shader.destroy(!0), this._shader = null;
  }
}
Vc.extension = {
  type: [
    T.WebGPUPipesAdaptor
  ],
  name: "mesh"
};
const Pg = [
  ...wc,
  Gc,
  kc,
  rn,
  Bc,
  Wc,
  Dc,
  Oc,
  Lc,
  Fc,
  Rc,
  Ic,
  Mc
], Eg = [...Ac, Uc], Mg = [Mh, Vc, zc], $c = [], Xc = [], jc = [];
V.handleByNamedList(T.WebGPUSystem, $c);
V.handleByNamedList(T.WebGPUPipes, Xc);
V.handleByNamedList(T.WebGPUPipesAdaptor, jc);
V.add(...Pg, ...Eg, ...Mg);
class Bg extends Ys {
  constructor() {
    const e = {
      name: "webgpu",
      type: Oe.WEBGPU,
      systems: $c,
      renderPipes: Xc,
      renderPipeAdaptors: jc
    };
    super(e);
  }
}
const Rg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  WebGPURenderer: Bg
}, Symbol.toStringTag, { value: "Module" }));
class Yc {
  constructor(e, t) {
    this.state = Ie.for2d(), this._graphicsBatchesHash = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this.renderer = e, this._adaptor = t, this._adaptor.init(), this.renderer.renderableGC.addManagedHash(this, "_graphicsBatchesHash");
  }
  validateRenderable(e) {
    const t = e.context, s = !!this._graphicsBatchesHash[e.uid], i = this.renderer.graphicsContext.updateGpuContext(t);
    return !!(i.isBatchable || s !== i.isBatchable);
  }
  addRenderable(e, t) {
    const s = this.renderer.graphicsContext.updateGpuContext(e.context);
    e.didViewUpdate && this._rebuild(e), s.isBatchable ? this._addToBatcher(e, t) : (this.renderer.renderPipes.batch.break(t), t.add(e));
  }
  updateRenderable(e) {
    const t = this._graphicsBatchesHash[e.uid];
    if (t)
      for (let s = 0; s < t.length; s++) {
        const i = t[s];
        i._batcher.updateElement(i);
      }
  }
  destroyRenderable(e) {
    this._graphicsBatchesHash[e.uid] && this._removeBatchForRenderable(e.uid), e.off("destroyed", this._destroyRenderableBound);
  }
  execute(e) {
    if (!e.isRenderable)
      return;
    const t = this.renderer, s = e.context;
    if (!t.graphicsContext.getGpuContext(s).batches.length)
      return;
    const n = s.customShader || this._adaptor.shader;
    this.state.blendMode = e.groupBlendMode;
    const a = n.resources.localUniforms.uniforms;
    a.uTransformMatrix = e.groupTransform, a.uRound = t._roundPixels | e._roundPixels, ls(
      e.groupColorAlpha,
      a.uColor,
      0
    ), this._adaptor.execute(this, e);
  }
  _rebuild(e) {
    const t = !!this._graphicsBatchesHash[e.uid], s = this.renderer.graphicsContext.updateGpuContext(e.context);
    t && this._removeBatchForRenderable(e.uid), s.isBatchable && this._initBatchesForRenderable(e), e.batched = s.isBatchable;
  }
  _addToBatcher(e, t) {
    const s = this.renderer.renderPipes.batch, i = this._getBatchesForRenderable(e);
    for (let n = 0; n < i.length; n++) {
      const a = i[n];
      s.addToBatch(a, t);
    }
  }
  _getBatchesForRenderable(e) {
    return this._graphicsBatchesHash[e.uid] || this._initBatchesForRenderable(e);
  }
  _initBatchesForRenderable(e) {
    const t = e.context, s = this.renderer.graphicsContext.getGpuContext(t), i = this.renderer._roundPixels | e._roundPixels, n = s.batches.map((a) => {
      const o = Z.get(Ui);
      return a.copyTo(o), o.renderable = e, o.roundPixels = i, o;
    });
    return this._graphicsBatchesHash[e.uid] === void 0 && e.on("destroyed", this._destroyRenderableBound), this._graphicsBatchesHash[e.uid] = n, n;
  }
  _removeBatchForRenderable(e) {
    this._graphicsBatchesHash[e].forEach((t) => {
      Z.return(t);
    }), this._graphicsBatchesHash[e] = null;
  }
  destroy() {
    this.renderer = null, this._adaptor.destroy(), this._adaptor = null, this.state = null;
    for (const e in this._graphicsBatchesHash)
      this._removeBatchForRenderable(e);
    this._graphicsBatchesHash = null;
  }
}
Yc.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "graphics"
};
const Kc = class qc extends mt {
  constructor(...e) {
    super({});
    let t = e[0] ?? {};
    typeof t == "number" && (j(q, "PlaneGeometry constructor changed please use { width, height, verticesX, verticesY } instead"), t = {
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
    e = { ...qc.defaultOptions, ...e }, this.verticesX = this.verticesX ?? e.verticesX, this.verticesY = this.verticesY ?? e.verticesY, this.width = this.width ?? e.width, this.height = this.height ?? e.height;
    const t = this.verticesX * this.verticesY, s = [], i = [], n = [], a = this.verticesX - 1, o = this.verticesY - 1, h = this.width / a, c = this.height / o;
    for (let u = 0; u < t; u++) {
      const d = u % this.verticesX, f = u / this.verticesX | 0;
      s.push(d * h, f * c), i.push(d / a, f / o);
    }
    const l = a * o;
    for (let u = 0; u < l; u++) {
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
    this.buffers[0].data = new Float32Array(s), this.buffers[1].data = new Float32Array(i), this.indexBuffer.data = new Uint32Array(n), this.buffers[0].update(), this.buffers[1].update(), this.indexBuffer.update();
  }
};
Kc.defaultOptions = {
  width: 100,
  height: 100,
  verticesX: 10,
  verticesY: 10
};
let kg = Kc;
class nn {
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
    const t = this.geometry.getBuffer("aUV"), s = t.data;
    let i = s;
    const n = this.texture.textureMatrix;
    return n.isSimple || (i = this._transformedUvs, (this._textureMatrixUpdateId !== n._updateID || this._uvUpdateId !== t._updateID) && ((!i || i.length < s.length) && (i = this._transformedUvs = new Float32Array(s.length)), this._textureMatrixUpdateId = n._updateID, this._uvUpdateId = t._updateID, n.multiplyUvs(s, i))), i;
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
class Zc {
  constructor(e, t) {
    this.localUniforms = new ve({
      uTransformMatrix: { value: new z(), type: "mat3x3<f32>" },
      uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
      uRound: { value: 0, type: "f32" }
    }), this.localUniformsBindGroup = new Ze({
      0: this.localUniforms
    }), this._meshDataHash = /* @__PURE__ */ Object.create(null), this._gpuBatchableMeshHash = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this.renderer = e, this._adaptor = t, this._adaptor.init(), e.renderableGC.addManagedHash(this, "_gpuBatchableMeshHash"), e.renderableGC.addManagedHash(this, "_meshDataHash");
  }
  validateRenderable(e) {
    const t = this._getMeshData(e), s = t.batched, i = e.batched;
    if (t.batched = i, s !== i)
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
    const s = this.renderer.renderPipes.batch, { batched: i } = this._getMeshData(e);
    if (i) {
      const n = this._getBatchableMesh(e);
      n.setTexture(e._texture), n.geometry = e._geometry, s.addToBatch(n, t);
    } else
      s.break(t), t.add(e);
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
    t && (Z.return(t), this._gpuBatchableMeshHash[e.uid] = null), e.off("destroyed", this._destroyRenderableBound);
  }
  execute(e) {
    if (!e.isRenderable)
      return;
    e.state.blendMode = rs(e.groupBlendMode, e.texture._source);
    const t = this.localUniforms;
    t.uniforms.uTransformMatrix = e.groupTransform, t.uniforms.uRound = this.renderer._roundPixels | e._roundPixels, t.update(), ls(
      e.groupColorAlpha,
      t.uniforms.uColor,
      0
    ), this._adaptor.execute(this, e);
  }
  _getMeshData(e) {
    return this._meshDataHash[e.uid] || this._initMeshData(e);
  }
  _initMeshData(e) {
    var t, s;
    return this._meshDataHash[e.uid] = {
      batched: e.batched,
      indexSize: (t = e._geometry.indices) == null ? void 0 : t.length,
      vertexSize: (s = e._geometry.positions) == null ? void 0 : s.length
    }, e.on("destroyed", this._destroyRenderableBound), this._meshDataHash[e.uid];
  }
  _getBatchableMesh(e) {
    return this._gpuBatchableMeshHash[e.uid] || this._initBatchableMesh(e);
  }
  _initBatchableMesh(e) {
    const t = Z.get(nn);
    return t.renderable = e, t.setTexture(e._texture), t.transform = e.groupTransform, t.roundPixels = this.renderer._roundPixels | e._roundPixels, this._gpuBatchableMeshHash[e.uid] = t, t;
  }
  destroy() {
    for (const e in this._gpuBatchableMeshHash)
      this._gpuBatchableMeshHash[e] && Z.return(this._gpuBatchableMeshHash[e]);
    this._gpuBatchableMeshHash = null, this._meshDataHash = null, this.localUniforms = null, this.localUniformsBindGroup = null, this._adaptor.destroy(), this._adaptor = null, this.renderer = null;
  }
}
Zc.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "mesh"
};
class Ig {
  execute(e, t) {
    const s = e.state, i = e.renderer, n = t.shader || e.defaultShader;
    n.resources.uTexture = t.texture._source, n.resources.uniforms = e.localUniforms;
    const a = i.gl, o = e.getBuffers(t);
    i.shader.bind(n), i.state.set(s), i.geometry.bind(o.geometry, n.glProgram);
    const c = o.geometry.indexBuffer.data.BYTES_PER_ELEMENT === 2 ? a.UNSIGNED_SHORT : a.UNSIGNED_INT;
    a.drawElements(a.TRIANGLES, t.particleChildren.length * 6, c, 0);
  }
}
class Gg {
  execute(e, t) {
    const s = e.renderer, i = t.shader || e.defaultShader;
    i.groups[0] = s.renderPipes.uniformBatch.getUniformBindGroup(e.localUniforms, !0), i.groups[1] = s.texture.getTextureBindGroup(t.texture);
    const n = e.state, a = e.getBuffers(t);
    s.encoder.draw({
      geometry: a.geometry,
      shader: t.shader || e.defaultShader,
      state: n,
      size: t.particleChildren.length * 6
    });
  }
}
function Ha(r, e = null) {
  const t = r * 6;
  if (t > 65535 ? e || (e = new Uint32Array(t)) : e || (e = new Uint16Array(t)), e.length !== t)
    throw new Error(`Out buffer length is incorrect, got ${e.length} and expected ${t}`);
  for (let s = 0, i = 0; s < t; s += 6, i += 4)
    e[s + 0] = i + 0, e[s + 1] = i + 1, e[s + 2] = i + 2, e[s + 3] = i + 0, e[s + 4] = i + 2, e[s + 5] = i + 3;
  return e;
}
function Ug(r) {
  return {
    dynamicUpdate: Wa(r, !0),
    staticUpdate: Wa(r, !1)
  };
}
function Wa(r, e) {
  const t = [];
  t.push(`
      
        var index = 0;

        for (let i = 0; i < ps.length; ++i)
        {
            const p = ps[i];

            `);
  let s = 0;
  for (const n in r) {
    const a = r[n];
    if (e !== a.dynamic)
      continue;
    t.push(`offset = index + ${s}`), t.push(a.code);
    const o = it(a.format);
    s += o.stride / 4;
  }
  t.push(`
            index += stride * 4;
        }
    `), t.unshift(`
        var stride = ${s};
    `);
  const i = t.join(`
`);
  return new Function("ps", "f32v", "u32v", i);
}
class Fg {
  constructor(e) {
    this._size = 0, this._generateParticleUpdateCache = {};
    const t = this._size = e.size ?? 1e3, s = e.properties;
    let i = 0, n = 0;
    for (const l in s) {
      const u = s[l], d = it(u.format);
      u.dynamic ? n += d.stride : i += d.stride;
    }
    this._dynamicStride = n / 4, this._staticStride = i / 4, this.staticAttributeBuffer = new St(t * 4 * i), this.dynamicAttributeBuffer = new St(t * 4 * n), this.indexBuffer = Ha(t);
    const a = new Gt();
    let o = 0, h = 0;
    this._staticBuffer = new Me({
      data: new Float32Array(1),
      label: "static-particle-buffer",
      shrinkToFit: !1,
      usage: Q.VERTEX | Q.COPY_DST
    }), this._dynamicBuffer = new Me({
      data: new Float32Array(1),
      label: "dynamic-particle-buffer",
      shrinkToFit: !1,
      usage: Q.VERTEX | Q.COPY_DST
    });
    for (const l in s) {
      const u = s[l], d = it(u.format);
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
    const c = this.getParticleUpdate(s);
    this._dynamicUpload = c.dynamicUpdate, this._staticUpload = c.staticUpdate, this.geometry = a;
  }
  getParticleUpdate(e) {
    const t = Dg(e);
    return this._generateParticleUpdateCache[t] ? this._generateParticleUpdateCache[t] : (this._generateParticleUpdateCache[t] = this.generateParticleUpdate(e), this._generateParticleUpdateCache[t]);
  }
  generateParticleUpdate(e) {
    return Ug(e);
  }
  update(e, t) {
    e.length > this._size && (t = !0, this._size = Math.max(e.length, this._size * 1.5 | 0), this.staticAttributeBuffer = new St(this._size * this._staticStride * 4 * 4), this.dynamicAttributeBuffer = new St(this._size * this._dynamicStride * 4 * 4), this.indexBuffer = Ha(this._size), this.geometry.indexBuffer.setDataWithSize(
      this.indexBuffer,
      this.indexBuffer.byteLength,
      !0
    ));
    const s = this.dynamicAttributeBuffer;
    if (this._dynamicUpload(e, s.float32View, s.uint32View), this._dynamicBuffer.setDataWithSize(
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
function Dg(r) {
  const e = [];
  for (const t in r) {
    const s = r[t];
    e.push(t, s.code, s.dynamic ? "d" : "s");
  }
  return e.join("_");
}
var Og = `varying vec2 vUV;
varying vec4 vColor;

uniform sampler2D uTexture;

void main(void){
    vec4 color = texture2D(uTexture, vUV) * vColor;
    gl_FragColor = color;
}`, Lg = `attribute vec2 aVertex;
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
`, za = `
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
class Ng extends Ge {
  constructor() {
    const e = kt.from({
      vertex: Lg,
      fragment: Og
    }), t = _t.from({
      fragment: {
        source: za,
        entryPoint: "mainFragment"
      },
      vertex: {
        source: za,
        entryPoint: "mainVertex"
      }
    });
    super({
      glProgram: e,
      gpuProgram: t,
      resources: {
        // this will be replaced with the texture from the particle container
        uTexture: H.WHITE.source,
        // this will be replaced with the texture style from the particle container
        uSampler: new eo({}),
        // this will be replaced with the local uniforms from the particle container
        uniforms: {
          uTranslationMatrix: { value: new z(), type: "mat3x3<f32>" },
          uColor: { value: new ae(16777215), type: "vec4<f32>" },
          uRound: { value: 1, type: "f32" },
          uResolution: { value: [0, 0], type: "vec2<f32>" }
        }
      }
    });
  }
}
class Qc {
  /**
   * @param renderer - The renderer this sprite batch works for.
   * @param adaptor
   */
  constructor(e, t) {
    this.state = Ie.for2d(), this._gpuBufferHash = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this.localUniforms = new ve({
      uTranslationMatrix: { value: new z(), type: "mat3x3<f32>" },
      uColor: { value: new Float32Array(4), type: "vec4<f32>" },
      uRound: { value: 1, type: "f32" },
      uResolution: { value: [0, 0], type: "vec2<f32>" }
    }), this.renderer = e, this.adaptor = t, this.defaultShader = new Ng(), this.state = Ie.for2d();
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
    return this._gpuBufferHash[e.uid] = new Fg({
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
    const s = this.renderer, i = this.getBuffers(e);
    e.texture || (e.texture = t[0].texture);
    const n = this.state;
    i.update(t, e._childrenDirty), e._childrenDirty = !1, n.blendMode = rs(e.blendMode, e.texture._source);
    const a = this.localUniforms.uniforms, o = a.uTranslationMatrix;
    e.worldTransform.copyTo(o), o.prepend(s.globalUniforms.globalUniformData.projectionMatrix), a.uResolution = s.globalUniforms.globalUniformData.resolution, a.uRound = s._roundPixels | e._roundPixels, ls(
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
class Jc extends Qc {
  constructor(e) {
    super(e, new Ig());
  }
}
Jc.extension = {
  type: [
    T.WebGLPipes
  ],
  name: "particle"
};
class el extends Qc {
  constructor(e) {
    super(e, new Gg());
  }
}
el.extension = {
  type: [
    T.WebGPUPipes
  ],
  name: "particle"
};
const tl = class sl extends kg {
  constructor(e = {}) {
    e = { ...sl.defaultOptions, ...e }, super({
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
    var t, s;
    this.width = e.width ?? this.width, this.height = e.height ?? this.height, this._originalWidth = e.originalWidth ?? this._originalWidth, this._originalHeight = e.originalHeight ?? this._originalHeight, this._leftWidth = e.leftWidth ?? this._leftWidth, this._rightWidth = e.rightWidth ?? this._rightWidth, this._topHeight = e.topHeight ?? this._topHeight, this._bottomHeight = e.bottomHeight ?? this._bottomHeight, this._anchorX = (t = e.anchor) == null ? void 0 : t.x, this._anchorY = (s = e.anchor) == null ? void 0 : s.y, this.updateUvs(), this.updatePositions();
  }
  /** Updates the positions of the vertices. */
  updatePositions() {
    const e = this.positions, {
      width: t,
      height: s,
      _leftWidth: i,
      _rightWidth: n,
      _topHeight: a,
      _bottomHeight: o,
      _anchorX: h,
      _anchorY: c
    } = this, l = i + n, u = t > l ? 1 : t / l, d = a + o, f = s > d ? 1 : s / d, p = Math.min(u, f), g = h * t, m = c * s;
    e[0] = e[8] = e[16] = e[24] = -g, e[2] = e[10] = e[18] = e[26] = i * p - g, e[4] = e[12] = e[20] = e[28] = t - n * p - g, e[6] = e[14] = e[22] = e[30] = t - g, e[1] = e[3] = e[5] = e[7] = -m, e[9] = e[11] = e[13] = e[15] = a * p - m, e[17] = e[19] = e[21] = e[23] = s - o * p - m, e[25] = e[27] = e[29] = e[31] = s - m, this.getBuffer("aPosition").update();
  }
  /** Updates the UVs of the vertices. */
  updateUvs() {
    const e = this.uvs;
    e[0] = e[8] = e[16] = e[24] = 0, e[1] = e[3] = e[5] = e[7] = 0, e[6] = e[14] = e[22] = e[30] = 1, e[25] = e[27] = e[29] = e[31] = 1;
    const t = 1 / this._originalWidth, s = 1 / this._originalHeight;
    e[2] = e[10] = e[18] = e[26] = t * this._leftWidth, e[9] = e[11] = e[13] = e[15] = s * this._topHeight, e[4] = e[12] = e[20] = e[28] = 1 - t * this._rightWidth, e[17] = e[19] = e[21] = e[23] = 1 - s * this._bottomHeight, this.getBuffer("aUV").update();
  }
};
tl.defaultOptions = {
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
let Hg = tl;
class rl {
  constructor(e) {
    this._gpuSpriteHash = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_gpuSpriteHash");
  }
  addRenderable(e, t) {
    const s = this._getGpuSprite(e);
    e.didViewUpdate && this._updateBatchableSprite(e, s), this._renderer.renderPipes.batch.addToBatch(s, t);
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
    Z.return(t.geometry), Z.return(t), this._gpuSpriteHash[e.uid] = null, e.off("destroyed", this._destroyRenderableBound);
  }
  _updateBatchableSprite(e, t) {
    t.geometry.update(e), t.setTexture(e._texture);
  }
  _getGpuSprite(e) {
    return this._gpuSpriteHash[e.uid] || this._initGPUSprite(e);
  }
  _initGPUSprite(e) {
    const t = Z.get(nn);
    return t.geometry = Z.get(Hg), t.renderable = e, t.transform = e.groupTransform, t.texture = e._texture, t.roundPixels = this._renderer._roundPixels | e._roundPixels, this._gpuSpriteHash[e.uid] = t, e.didViewUpdate || this._updateBatchableSprite(e, t), e.on("destroyed", this._destroyRenderableBound), t;
  }
  destroy() {
    for (const e in this._gpuSpriteHash)
      this._gpuSpriteHash[e].geometry.destroy();
    this._gpuSpriteHash = null, this._renderer = null;
  }
}
rl.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "nineSliceSprite"
};
const Wg = {
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
}, zg = {
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
let Fr, Dr;
class Vg extends Ge {
  constructor() {
    Fr ?? (Fr = as({
      name: "tiling-sprite-shader",
      bits: [
        Qt,
        Wg,
        hs
      ]
    })), Dr ?? (Dr = os({
      name: "tiling-sprite-shader",
      bits: [
        Xi,
        zg,
        cs
      ]
    }));
    const e = new ve({
      uMapCoord: { value: new z(), type: "mat3x3<f32>" },
      uClampFrame: { value: new Float32Array([0, 0, 1, 1]), type: "vec4<f32>" },
      uClampOffset: { value: new Float32Array([0, 0]), type: "vec2<f32>" },
      uTextureTransform: { value: new z(), type: "mat3x3<f32>" },
      uSizeAnchor: { value: new Float32Array([100, 100, 0.5, 0.5]), type: "vec4<f32>" }
    });
    super({
      glProgram: Dr,
      gpuProgram: Fr,
      resources: {
        localUniforms: new ve({
          uTransformMatrix: { value: new z(), type: "mat3x3<f32>" },
          uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
          uRound: { value: 0, type: "f32" }
        }),
        tilingUniforms: e,
        uTexture: H.EMPTY.source,
        uSampler: H.EMPTY.source.style
      }
    });
  }
  updateUniforms(e, t, s, i, n, a) {
    const o = this.resources.tilingUniforms, h = a.width, c = a.height, l = a.textureMatrix, u = o.uniforms.uTextureTransform;
    u.set(
      s.a * h / e,
      s.b * h / t,
      s.c * c / e,
      s.d * c / t,
      s.tx / e,
      s.ty / t
    ), u.invert(), o.uniforms.uMapCoord = l.mapCoord, o.uniforms.uClampFrame = l.uClampFrame, o.uniforms.uClampOffset = l.uClampOffset, o.uniforms.uTextureTransform = u, o.uniforms.uSizeAnchor[0] = e, o.uniforms.uSizeAnchor[1] = t, o.uniforms.uSizeAnchor[2] = i, o.uniforms.uSizeAnchor[3] = n, a && (this.resources.uTexture = a.source, this.resources.uSampler = a.source.style);
  }
}
class $g extends mt {
  constructor() {
    super({
      positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      indices: new Uint32Array([0, 1, 2, 0, 2, 3])
    });
  }
}
function Xg(r, e) {
  const t = r.anchor.x, s = r.anchor.y;
  e[0] = -t * r.width, e[1] = -s * r.height, e[2] = (1 - t) * r.width, e[3] = -s * r.height, e[4] = (1 - t) * r.width, e[5] = (1 - s) * r.height, e[6] = -t * r.width, e[7] = (1 - s) * r.height;
}
function jg(r, e, t, s) {
  let i = 0;
  const n = r.length / e, a = s.a, o = s.b, h = s.c, c = s.d, l = s.tx, u = s.ty;
  for (t *= e; i < n; ) {
    const d = r[t], f = r[t + 1];
    r[t] = a * d + h * f + l, r[t + 1] = o * d + c * f + u, t += e, i++;
  }
}
function Yg(r, e) {
  const t = r.texture, s = t.frame.width, i = t.frame.height;
  let n = 0, a = 0;
  r.applyAnchorToTexture && (n = r.anchor.x, a = r.anchor.y), e[0] = e[6] = -n, e[2] = e[4] = 1 - n, e[1] = e[3] = -a, e[5] = e[7] = 1 - a;
  const o = z.shared;
  o.copyFrom(r._tileTransform.matrix), o.tx /= r.width, o.ty /= r.height, o.invert(), o.scale(r.width / s, r.height / i), jg(e, 2, 0, o);
}
const Es = new $g();
class il {
  constructor(e) {
    this._state = Ie.default2d, this._tilingSpriteDataHash = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_tilingSpriteDataHash");
  }
  validateRenderable(e) {
    const t = this._getTilingSpriteData(e), s = t.canBatch;
    this._updateCanBatch(e);
    const i = t.canBatch;
    if (i && i === s) {
      const { batchableMesh: n } = t;
      return !n._batcher.checkAndUpdateTexture(
        n,
        e.texture
      );
    }
    return s !== i;
  }
  addRenderable(e, t) {
    const s = this._renderer.renderPipes.batch;
    this._updateCanBatch(e);
    const i = this._getTilingSpriteData(e), { geometry: n, canBatch: a } = i;
    if (a) {
      i.batchableMesh || (i.batchableMesh = new nn());
      const o = i.batchableMesh;
      e.didViewUpdate && (this._updateBatchableMesh(e), o.geometry = n, o.renderable = e, o.transform = e.groupTransform, o.setTexture(e._texture)), o.roundPixels = this._renderer._roundPixels | e._roundPixels, s.addToBatch(o, t);
    } else
      s.break(t), i.shader || (i.shader = new Vg()), this.updateRenderable(e), t.add(e);
  }
  execute(e) {
    const { shader: t } = this._tilingSpriteDataHash[e.uid];
    t.groups[0] = this._renderer.globalUniforms.bindGroup;
    const s = t.resources.localUniforms.uniforms;
    s.uTransformMatrix = e.groupTransform, s.uRound = this._renderer._roundPixels | e._roundPixels, ls(
      e.groupColorAlpha,
      s.uColor,
      0
    ), this._state.blendMode = rs(e.groupBlendMode, e.texture._source), this._renderer.encoder.draw({
      geometry: Es,
      shader: t,
      state: this._state
    });
  }
  updateRenderable(e) {
    const t = this._getTilingSpriteData(e), { canBatch: s } = t;
    if (s) {
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
    var s;
    const t = this._getTilingSpriteData(e);
    t.batchableMesh = null, (s = t.shader) == null || s.destroy(), this._tilingSpriteDataHash[e.uid] = null, e.off("destroyed", this._destroyRenderableBound);
  }
  _getTilingSpriteData(e) {
    return this._tilingSpriteDataHash[e.uid] || this._initTilingSpriteData(e);
  }
  _initTilingSpriteData(e) {
    const t = new mt({
      indices: Es.indices,
      positions: Es.positions.slice(),
      uvs: Es.uvs.slice()
    });
    return this._tilingSpriteDataHash[e.uid] = {
      canBatch: !0,
      renderable: e,
      geometry: t
    }, e.on("destroyed", this._destroyRenderableBound), this._tilingSpriteDataHash[e.uid];
  }
  _updateBatchableMesh(e) {
    const t = this._getTilingSpriteData(e), { geometry: s } = t, i = e.texture.source.style;
    i.addressMode !== "repeat" && (i.addressMode = "repeat", i.update()), Yg(e, s.uvs), Xg(e, s.positions);
  }
  destroy() {
    for (const e in this._tilingSpriteDataHash)
      this.destroyRenderable(this._tilingSpriteDataHash[e].renderable);
    this._tilingSpriteDataHash = null, this._renderer = null;
  }
  _updateCanBatch(e) {
    const t = this._getTilingSpriteData(e), s = e.texture;
    let i = !0;
    return this._renderer.type === Oe.WEBGL && (i = this._renderer.context.supports.nonPowOf2wrapping), t.canBatch = s.textureMatrix.isSimple && (i || s.source.isPowerOfTwo), t.canBatch;
  }
}
il.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "tilingSprite"
};
const Kg = {
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
}, qg = {
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
}, Zg = {
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
}, Qg = {
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
let Or, Lr;
class Jg extends Ge {
  constructor() {
    const e = new ve({
      uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
      uTransformMatrix: { value: new z(), type: "mat3x3<f32>" },
      uDistance: { value: 4, type: "f32" },
      uRound: { value: 0, type: "f32" }
    }), t = It();
    Or ?? (Or = as({
      name: "sdf-shader",
      bits: [
        Mi,
        Ri(t),
        Kg,
        Zg,
        hs
      ]
    })), Lr ?? (Lr = os({
      name: "sdf-shader",
      bits: [
        Bi,
        ki(t),
        qg,
        Qg,
        cs
      ]
    })), super({
      glProgram: Lr,
      gpuProgram: Or,
      resources: {
        localUniforms: e,
        batchSamplers: Ii(t)
      }
    });
  }
}
class nl {
  constructor(e) {
    this._gpuBitmapText = {}, this._destroyRenderableBound = this.destroyRenderable.bind(this), this._renderer = e, this._renderer.renderableGC.addManagedHash(this, "_gpuBitmapText");
  }
  validateRenderable(e) {
    const t = this._getGpuBitmapText(e);
    return e._didTextUpdate && (e._didTextUpdate = !1, this._updateContext(e, t)), this._renderer.renderPipes.graphics.validateRenderable(t);
  }
  addRenderable(e, t) {
    const s = this._getGpuBitmapText(e);
    Va(e, s), e._didTextUpdate && (e._didTextUpdate = !1, this._updateContext(e, s)), this._renderer.renderPipes.graphics.addRenderable(s, t), s.context.customShader && this._updateDistanceField(e);
  }
  destroyRenderable(e) {
    e.off("destroyed", this._destroyRenderableBound), this._destroyRenderableByUid(e.uid);
  }
  _destroyRenderableByUid(e) {
    const t = this._gpuBitmapText[e].context;
    t.customShader && (Z.return(t.customShader), t.customShader = null), Z.return(this._gpuBitmapText[e]), this._gpuBitmapText[e] = null;
  }
  updateRenderable(e) {
    const t = this._getGpuBitmapText(e);
    Va(e, t), this._renderer.renderPipes.graphics.updateRenderable(t), t.context.customShader && this._updateDistanceField(e);
  }
  _updateContext(e, t) {
    const { context: s } = t, i = ai.getFont(e.text, e._style);
    s.clear(), i.distanceField.type !== "none" && (s.customShader || (s.customShader = Z.get(Jg)));
    const n = Array.from(e.text), a = e._style;
    let o = i.baseLineOffset;
    const h = fh(n, a, i, !0);
    let c = 0;
    const l = a.padding, u = h.scale;
    let d = h.width, f = h.height + h.offsetY;
    a._stroke && (d += a._stroke.width / u, f += a._stroke.width / u), s.translate(-e._anchor._x * d - l, -e._anchor._y * f - l).scale(u, u);
    const p = i.applyFillAsTint ? a._fill.color : 16777215;
    for (let g = 0; g < h.lines.length; g++) {
      const m = h.lines[g];
      for (let y = 0; y < m.charPositions.length; y++) {
        const x = n[c++], v = i.chars[x];
        v != null && v.texture && s.texture(
          v.texture,
          p || "black",
          Math.round(m.charPositions[y] + v.xOffset),
          Math.round(o + v.yOffset)
        );
      }
      o += i.lineHeight;
    }
  }
  _getGpuBitmapText(e) {
    return this._gpuBitmapText[e.uid] || this.initGpuText(e);
  }
  initGpuText(e) {
    const t = Z.get(Bt);
    return this._gpuBitmapText[e.uid] = t, this._updateContext(e, t), e.on("destroyed", this._destroyRenderableBound), this._gpuBitmapText[e.uid];
  }
  _updateDistanceField(e) {
    const t = this._getGpuBitmapText(e).context, s = e._style.fontFamily, i = ce.get(`${s}-bitmap`), { a: n, b: a, c: o, d: h } = e.groupTransform, c = Math.sqrt(n * n + a * a), l = Math.sqrt(o * o + h * h), u = (Math.abs(c) + Math.abs(l)) / 2, d = i.baseRenderedFontSize / e._style.fontSize, f = u * i.distanceField.range * (1 / d);
    t.customShader.resources.localUniforms.uniforms.uDistance = f;
  }
  destroy() {
    for (const e in this._gpuBitmapText)
      this._destroyRenderableByUid(e);
    this._gpuBitmapText = null, this._renderer = null;
  }
}
nl.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "bitmapText"
};
function Va(r, e) {
  e.groupTransform = r.groupTransform, e.groupColorAlpha = r.groupColorAlpha, e.groupColor = r.groupColor, e.groupBlendMode = r.groupBlendMode, e.globalDisplayStatus = r.globalDisplayStatus, e.groupTransform = r.groupTransform, e.localDisplayStatus = r.localDisplayStatus, e.groupAlpha = r.groupAlpha, e._roundPixels = r._roundPixels;
}
function pi(r, e) {
  const { texture: t, bounds: s } = r;
  io(s, e._anchor, t);
  const i = e._style.padding;
  s.minX -= i, s.minY -= i, s.maxX -= i, s.maxY -= i;
}
class al {
  constructor(e) {
    this._gpuText = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this._renderer = e, this._renderer.runners.resolutionChange.add(this), this._renderer.renderableGC.addManagedHash(this, "_gpuText");
  }
  resolutionChange() {
    for (const e in this._gpuText) {
      const t = this._gpuText[e];
      if (!t)
        continue;
      const s = t.batchableSprite.renderable;
      s._autoResolution && (s._resolution = this._renderer.resolution, s.onViewUpdate());
    }
  }
  validateRenderable(e) {
    const t = this._getGpuText(e), s = e._getKey();
    return t.textureNeedsUploading ? (t.textureNeedsUploading = !1, !0) : t.currentKey !== s;
  }
  addRenderable(e, t) {
    const i = this._getGpuText(e).batchableSprite;
    e._didTextUpdate && this._updateText(e), this._renderer.renderPipes.batch.addToBatch(i, t);
  }
  updateRenderable(e) {
    const s = this._getGpuText(e).batchableSprite;
    e._didTextUpdate && this._updateText(e), s._batcher.updateElement(s);
  }
  destroyRenderable(e) {
    e.off("destroyed", this._destroyRenderableBound), this._destroyRenderableById(e.uid);
  }
  _destroyRenderableById(e) {
    const t = this._gpuText[e];
    this._renderer.htmlText.decreaseReferenceCount(t.currentKey), Z.return(t.batchableSprite), this._gpuText[e] = null;
  }
  _updateText(e) {
    const t = e._getKey(), s = this._getGpuText(e), i = s.batchableSprite;
    s.currentKey !== t && this._updateGpuText(e).catch((n) => {
      console.error(n);
    }), e._didTextUpdate = !1, pi(i, e);
  }
  async _updateGpuText(e) {
    e._didTextUpdate = !1;
    const t = this._getGpuText(e);
    if (t.generatingTexture)
      return;
    const s = e._getKey();
    this._renderer.htmlText.decreaseReferenceCount(t.currentKey), t.generatingTexture = !0, t.currentKey = s;
    const i = e.resolution ?? this._renderer.resolution, n = await this._renderer.htmlText.getManagedTexture(
      e.text,
      i,
      e._style,
      e._getKey()
    ), a = t.batchableSprite;
    a.texture = t.texture = n, t.generatingTexture = !1, t.textureNeedsUploading = !0, e.onViewUpdate(), pi(a, e);
  }
  _getGpuText(e) {
    return this._gpuText[e.uid] || this.initGpuText(e);
  }
  initGpuText(e) {
    const t = {
      texture: H.EMPTY,
      currentKey: "--",
      batchableSprite: Z.get(Zs),
      textureNeedsUploading: !1,
      generatingTexture: !1
    }, s = t.batchableSprite;
    return s.renderable = e, s.transform = e.groupTransform, s.texture = H.EMPTY, s.bounds = { minX: 0, maxX: 1, minY: 0, maxY: 0 }, s.roundPixels = this._renderer._roundPixels | e._roundPixels, e._resolution = e._autoResolution ? this._renderer.resolution : e.resolution, this._gpuText[e.uid] = t, e.on("destroyed", this._destroyRenderableBound), t;
  }
  destroy() {
    for (const e in this._gpuText)
      this._destroyRenderableById(e);
    this._gpuText = null, this._renderer = null;
  }
}
al.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "htmlText"
};
function e_() {
  const { userAgent: r } = J.get().getNavigator();
  return /^((?!chrome|android).)*safari/i.test(r);
}
const t_ = new ye();
function ol(r, e, t, s) {
  const i = t_;
  i.minX = 0, i.minY = 0, i.maxX = r.width / s | 0, i.maxY = r.height / s | 0;
  const n = xe.getOptimalTexture(
    i.width,
    i.height,
    s,
    !1
  );
  return n.source.uploadMethodId = "image", n.source.resource = r, n.source.alphaMode = "premultiply-alpha-on-upload", n.frame.width = e / s, n.frame.height = t / s, n.source.emit("update", n.source), n.updateUvs(), n;
}
function s_(r, e) {
  const t = e.fontFamily, s = [], i = {}, n = /font-family:([^;"\s]+)/g, a = r.match(n);
  function o(h) {
    i[h] || (s.push(h), i[h] = !0);
  }
  if (Array.isArray(t))
    for (let h = 0; h < t.length; h++)
      o(t[h]);
  else
    o(t);
  a && a.forEach((h) => {
    const c = h.split(":")[1].trim();
    o(c);
  });
  for (const h in e.tagStyles) {
    const c = e.tagStyles[h].fontFamily;
    o(c);
  }
  return s;
}
async function r_(r) {
  const t = await (await J.get().fetch(r)).blob(), s = new FileReader();
  return await new Promise((n, a) => {
    s.onloadend = () => n(s.result), s.onerror = a, s.readAsDataURL(t);
  });
}
async function $a(r, e) {
  const t = await r_(e);
  return `@font-face {
        font-family: "${r.fontFamily}";
        src: url('${t}');
        font-weight: ${r.fontWeight};
        font-style: ${r.fontStyle};
    }`;
}
const Ms = /* @__PURE__ */ new Map();
async function i_(r, e, t) {
  const s = r.filter((i) => ce.has(`${i}-and-url`)).map((i, n) => {
    if (!Ms.has(i)) {
      const { url: a } = ce.get(`${i}-and-url`);
      n === 0 ? Ms.set(i, $a({
        fontWeight: e.fontWeight,
        fontStyle: e.fontStyle,
        fontFamily: i
      }, a)) : Ms.set(i, $a({
        fontWeight: t.fontWeight,
        fontStyle: t.fontStyle,
        fontFamily: i
      }, a));
    }
    return Ms.get(i);
  });
  return (await Promise.all(s)).join(`
`);
}
function n_(r, e, t, s, i) {
  const { domElement: n, styleElement: a, svgRoot: o } = i;
  n.innerHTML = `<style>${e.cssStyle}</style><div style='padding:0;'>${r}</div>`, n.setAttribute("style", `transform: scale(${t});transform-origin: top left; display: inline-block`), a.textContent = s;
  const { width: h, height: c } = i.image;
  return o.setAttribute("width", h.toString()), o.setAttribute("height", c.toString()), new XMLSerializer().serializeToString(o);
}
function a_(r, e) {
  const t = Qe.getOptimalCanvasAndContext(
    r.width,
    r.height,
    e
  ), { context: s } = t;
  return s.clearRect(0, 0, r.width, r.height), s.drawImage(r, 0, 0), t;
}
function o_(r, e, t) {
  return new Promise(async (s) => {
    t && await new Promise((i) => setTimeout(i, 100)), r.onload = () => {
      s();
    }, r.src = `data:image/svg+xml;charset=utf8,${encodeURIComponent(e)}`, r.crossOrigin = "anonymous";
  });
}
class an {
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
  getManagedTexture(e, t, s, i) {
    if (this._activeTextures[i])
      return this._increaseReferenceCount(i), this._activeTextures[i].promise;
    const n = this._buildTexturePromise(e, t, s).then((a) => (this._activeTextures[i].texture = a, a));
    return this._activeTextures[i] = {
      texture: null,
      promise: n,
      usageCount: 1
    }, n;
  }
  async _buildTexturePromise(e, t, s) {
    const i = Z.get(Ph), n = s_(e, s), a = await i_(
      n,
      s,
      Vi.defaultTextStyle
    ), o = Xp(e, s, a, i), h = Math.ceil(Math.ceil(Math.max(1, o.width) + s.padding * 2) * t), c = Math.ceil(Math.ceil(Math.max(1, o.height) + s.padding * 2) * t), l = i.image, u = 2;
    l.width = (h | 0) + u, l.height = (c | 0) + u;
    const d = n_(e, s, t, a, i);
    await o_(l, d, e_() && n.length > 0);
    const f = l;
    let p;
    this._createCanvas && (p = a_(l, t));
    const g = ol(
      p ? p.canvas : f,
      l.width - u,
      l.height - u,
      t
    );
    return this._createCanvas && (this._renderer.texture.initSource(g.source), Qe.returnCanvasAndContext(p)), Z.return(i), g;
  }
  _increaseReferenceCount(e) {
    this._activeTextures[e].usageCount++;
  }
  decreaseReferenceCount(e) {
    const t = this._activeTextures[e];
    t && (t.usageCount--, t.usageCount === 0 && (t.texture ? this._cleanUp(t) : t.promise.then((s) => {
      t.texture = s, this._cleanUp(t);
    }).catch(() => {
      $("HTMLTextSystem: Failed to clean texture");
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
an.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem,
    T.CanvasSystem
  ],
  name: "htmlText"
};
an.defaultFontOptions = {
  fontFamily: "Arial",
  fontStyle: "normal",
  fontWeight: "normal"
};
class hl {
  constructor(e) {
    this._gpuText = /* @__PURE__ */ Object.create(null), this._destroyRenderableBound = this.destroyRenderable.bind(this), this._renderer = e, this._renderer.runners.resolutionChange.add(this), this._renderer.renderableGC.addManagedHash(this, "_gpuText");
  }
  resolutionChange() {
    for (const e in this._gpuText) {
      const t = this._gpuText[e];
      if (!t)
        continue;
      const s = t.batchableSprite.renderable;
      s._autoResolution && (s._resolution = this._renderer.resolution, s.onViewUpdate());
    }
  }
  validateRenderable(e) {
    const t = this._getGpuText(e), s = e._getKey();
    return t.currentKey !== s;
  }
  addRenderable(e, t) {
    const i = this._getGpuText(e).batchableSprite;
    e._didTextUpdate && this._updateText(e), this._renderer.renderPipes.batch.addToBatch(i, t);
  }
  updateRenderable(e) {
    const s = this._getGpuText(e).batchableSprite;
    e._didTextUpdate && this._updateText(e), s._batcher.updateElement(s);
  }
  destroyRenderable(e) {
    e.off("destroyed", this._destroyRenderableBound), this._destroyRenderableById(e.uid);
  }
  _destroyRenderableById(e) {
    const t = this._gpuText[e];
    this._renderer.canvasText.decreaseReferenceCount(t.currentKey), Z.return(t.batchableSprite), this._gpuText[e] = null;
  }
  _updateText(e) {
    const t = e._getKey(), s = this._getGpuText(e), i = s.batchableSprite;
    s.currentKey !== t && this._updateGpuText(e), e._didTextUpdate = !1, pi(i, e);
  }
  _updateGpuText(e) {
    const t = this._getGpuText(e), s = t.batchableSprite;
    t.texture && this._renderer.canvasText.decreaseReferenceCount(t.currentKey), t.texture = s.texture = this._renderer.canvasText.getManagedTexture(e), t.currentKey = e._getKey(), s.texture = t.texture;
  }
  _getGpuText(e) {
    return this._gpuText[e.uid] || this.initGpuText(e);
  }
  initGpuText(e) {
    const t = {
      texture: null,
      currentKey: "--",
      batchableSprite: Z.get(Zs)
    };
    return t.batchableSprite.renderable = e, t.batchableSprite.transform = e.groupTransform, t.batchableSprite.bounds = { minX: 0, maxX: 1, minY: 0, maxY: 0 }, t.batchableSprite.roundPixels = this._renderer._roundPixels | e._roundPixels, this._gpuText[e.uid] = t, e._resolution = e._autoResolution ? this._renderer.resolution : e.resolution, this._updateText(e), e.on("destroyed", this._destroyRenderableBound), t;
  }
  destroy() {
    for (const e in this._gpuText)
      this._destroyRenderableById(e);
    this._gpuText = null, this._renderer = null;
  }
}
hl.extension = {
  type: [
    T.WebGLPipes,
    T.WebGPUPipes,
    T.CanvasPipes
  ],
  name: "text"
};
function Xa(r, e, t) {
  for (let s = 0, i = 4 * t * e; s < e; ++s, i += 4)
    if (r[i + 3] !== 0)
      return !1;
  return !0;
}
function ja(r, e, t, s, i) {
  const n = 4 * e;
  for (let a = s, o = s * n + 4 * t; a <= i; ++a, o += n)
    if (r[o + 3] !== 0)
      return !1;
  return !0;
}
function h_(r, e = 1) {
  const { width: t, height: s } = r, i = r.getContext("2d", {
    willReadFrequently: !0
  });
  if (i === null)
    throw new TypeError("Failed to get canvas 2D context");
  const a = i.getImageData(0, 0, t, s).data;
  let o = 0, h = 0, c = t - 1, l = s - 1;
  for (; h < s && Xa(a, t, h); )
    ++h;
  if (h === s)
    return oe.EMPTY;
  for (; Xa(a, t, l); )
    --l;
  for (; ja(a, t, o, h, l); )
    ++o;
  for (; ja(a, t, c, h, l); )
    --c;
  return ++c, ++l, new oe(o / e, h / e, (c - o) / e, (l - h) / e);
}
class cl {
  constructor(e) {
    this._activeTextures = {}, this._renderer = e;
  }
  getTextureSize(e, t, s) {
    const i = Ye.measureText(e || " ", s);
    let n = Math.ceil(Math.ceil(Math.max(1, i.width) + s.padding * 2) * t), a = Math.ceil(Math.ceil(Math.max(1, i.height) + s.padding * 2) * t);
    return n = Math.ceil(n - 1e-6), a = Math.ceil(a - 1e-6), n = Ct(n), a = Ct(a), { width: n, height: a };
  }
  getTexture(e, t, s, i) {
    typeof e == "string" && (j("8.0.0", "CanvasTextSystem.getTexture: Use object TextOptions instead of separate arguments"), e = {
      text: e,
      style: s,
      resolution: t
    }), e.style instanceof Je || (e.style = new Je(e.style));
    const { texture: n, canvasAndContext: a } = this.createTextureAndCanvas(
      e
    );
    return this._renderer.texture.initSource(n._source), Qe.returnCanvasAndContext(a), n;
  }
  createTextureAndCanvas(e) {
    const { text: t, style: s } = e, i = e.resolution ?? this._renderer.resolution, n = Ye.measureText(t || " ", s), a = Math.ceil(Math.ceil(Math.max(1, n.width) + s.padding * 2) * i), o = Math.ceil(Math.ceil(Math.max(1, n.height) + s.padding * 2) * i), h = Qe.getOptimalCanvasAndContext(a, o), { canvas: c } = h;
    this.renderTextToCanvas(t, s, i, h);
    const l = ol(c, a, o, i);
    if (s.trim) {
      const u = h_(c, i);
      l.frame.copyFrom(u), l.updateUvs();
    }
    return { texture: l, canvasAndContext: h };
  }
  getManagedTexture(e) {
    e._resolution = e._autoResolution ? this._renderer.resolution : e.resolution;
    const t = e._getKey();
    if (this._activeTextures[t])
      return this._increaseReferenceCount(t), this._activeTextures[t].texture;
    const { texture: s, canvasAndContext: i } = this.createTextureAndCanvas(e);
    return this._activeTextures[t] = {
      canvasAndContext: i,
      texture: s,
      usageCount: 1
    }, s;
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
    t.usageCount--, t.usageCount === 0 && (Qe.returnCanvasAndContext(t.canvasAndContext), this.returnTexture(t.texture), this._activeTextures[e] = null);
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
  renderTextToCanvas(e, t, s, i) {
    var x, v, A, M;
    const { canvas: n, context: a } = i, o = Ws(t), h = Ye.measureText(e || " ", t), c = h.lines, l = h.lineHeight, u = h.lineWidths, d = h.maxLineWidth, f = h.fontProperties, p = n.height;
    if (a.resetTransform(), a.scale(s, s), a.textBaseline = t.textBaseline, (x = t._stroke) != null && x.width) {
      const w = t._stroke;
      a.lineWidth = w.width, a.miterLimit = w.miterLimit, a.lineJoin = w.join, a.lineCap = w.cap;
    }
    a.font = o;
    let g, m;
    const y = t.dropShadow ? 2 : 1;
    for (let w = 0; w < y; ++w) {
      const C = t.dropShadow && w === 0, F = C ? Math.ceil(Math.max(1, p) + t.padding * 2) : 0, D = F * s;
      if (C) {
        a.fillStyle = "black", a.strokeStyle = "black";
        const U = t.dropShadow, O = U.color, Y = U.alpha;
        a.shadowColor = ae.shared.setValue(O).setAlpha(Y).toRgbaString();
        const X = U.blur * s, _ = U.distance * s;
        a.shadowBlur = X, a.shadowOffsetX = Math.cos(U.angle) * _, a.shadowOffsetY = Math.sin(U.angle) * _ + D;
      } else {
        if (a.fillStyle = t._fill ? zs(t._fill, a, h) : null, (v = t._stroke) != null && v.width) {
          const U = t._stroke.width * t._stroke.alignment;
          a.strokeStyle = zs(t._stroke, a, h, U);
        }
        a.shadowColor = "black";
      }
      let I = (l - f.fontSize) / 2;
      l - f.fontSize < 0 && (I = 0);
      const k = ((A = t._stroke) == null ? void 0 : A.width) ?? 0;
      for (let U = 0; U < c.length; U++)
        g = k / 2, m = k / 2 + U * l + f.ascent + I, t.align === "right" ? g += d - u[U] : t.align === "center" && (g += (d - u[U]) / 2), (M = t._stroke) != null && M.width && this._drawLetterSpacing(
          c[U],
          t,
          i,
          g + t.padding,
          m + t.padding - F,
          !0
        ), t._fill !== void 0 && this._drawLetterSpacing(
          c[U],
          t,
          i,
          g + t.padding,
          m + t.padding - F
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
  _drawLetterSpacing(e, t, s, i, n, a = !1) {
    const { context: o } = s, h = t.letterSpacing;
    let c = !1;
    if (Ye.experimentalLetterSpacingSupported && (Ye.experimentalLetterSpacing ? (o.letterSpacing = `${h}px`, o.textLetterSpacing = `${h}px`, c = !0) : (o.letterSpacing = "0px", o.textLetterSpacing = "0px")), h === 0 || c) {
      a ? o.strokeText(e, i, n) : o.fillText(e, i, n);
      return;
    }
    let l = i;
    const u = Ye.graphemeSegmenter(e);
    let d = o.measureText(e).width, f = 0;
    for (let p = 0; p < u.length; ++p) {
      const g = u[p];
      a ? o.strokeText(g, l, n) : o.fillText(g, l, n);
      let m = "";
      for (let y = p + 1; y < u.length; ++y)
        m += u[y];
      f = o.measureText(m).width, l += d - f + h, d = f;
    }
  }
  destroy() {
    this._activeTextures = null;
  }
}
cl.extension = {
  type: [
    T.WebGLSystem,
    T.WebGPUSystem,
    T.CanvasSystem
  ],
  name: "canvasText"
};
V.add(fl, pl);
const tt = { width: 1920, height: 1080 }, c_ = tt.width / 5 / 60, jt = 1.2, es = 1434 / 1536, l_ = ["mgBgBase", "mgBgFree", "mgBgCloud", "mgBgTourist", "mgBgIcecream", "mgBgFlame", "fxCrack1", "fxCrack2", "fxCrack3", "fxGlow"], Ya = { columns: 18, rows: 28 }, Bs = [
  { x: 580, y: 64, width: 600, height: 200 },
  { x: 1360, y: 84, width: 400, height: 134 },
  { x: -980, y: 75, width: 480, height: 160 },
  { x: -200, y: 80, width: 450, height: 150 }
], u_ = [{ x: 188, y: 712 }, { x: 1735, y: 712 }], d_ = [
  { key: "mgBgTourist", x: 370, y: 1002, width: 400, height: 800, plinth: 0.895 },
  { key: "mgBgIcecream", x: 1743, y: 995, width: 300, height: 600, plinth: 0.89 }
], $s = (r) => Math.max(0, Math.min(1, r)), mi = (r) => {
  const e = $s(r);
  return e * e * (3 - 2 * e);
}, Nr = [
  [[0, 0], [0.32, 0], [0.67, 0], [1, 0]],
  [[0, 0.25], [0.35, 0.22], [0.69, 0.27], [1, 0.24]],
  [[0, 0.46], [0.29, 0.43], [0.65, 0.49], [1, 0.45]],
  [[0, 0.71], [0.39, 0.68], [0.7, 0.73], [1, 0.7]],
  [[0, 1], [0.33, 1], [0.68, 1], [1, 1]]
], ll = Nr.slice(0, -1).flatMap((r, e) => r.slice(0, -1).map((t, s) => [t, r[s + 1], Nr[e + 1][s + 1], Nr[e + 1][s]])), ul = (r, e) => {
  if (e <= 0.16 || e >= jt) return 0;
  const t = Math.floor(r / 3), s = r % 3, i = 0.16 + s * 8e-3, n = 0.5 + (3 - t) * 0.023 + s * 7e-3, a = 0.87 + (3 - t) * 0.04 + s * 0.014;
  if (e < 0.39) return 1 - (1 - $s((e - i) / (0.39 - i))) ** 3;
  if (e < n) return 1;
  const o = $s((e - n) / (a - n)), h = o - 1, c = 1 + 2.25 * h ** 3 + 1.25 * h ** 2;
  return o >= 1 ? 0 : 1 - c;
}, f_ = (r, e, t) => {
  const i = tt.width + 1200;
  return ((e + r * c_ + 600) % i + i) % i - 600;
}, p_ = (r, e) => mi((r - 155 - e / 2) / 120) * mi((1770 - e / 2 - r) / 120), m_ = (r) => ({
  split: Math.max(...ll.map((e, t) => Math.abs(ul(t, r)))),
  crack: r >= 0.03 && r <= 0.16 ? mi((r - 0.03) / 0.035) : 0,
  crackStage: r < 0.065 ? 0 : r < 0.105 ? 1 : 2
}), g_ = (r, e, t, s) => {
  const i = ul(r, e), n = Math.floor(r / 3), a = r % 3, o = (a - 1) * 0.19 + (n % 2 ? -0.018 : 0.018), h = [-0.065, -0.012, 0.035, 0.055][n];
  return {
    x: o * t * i,
    y: (h * i + 0.024 * Math.max(i, 0) ** 2) * s,
    rotation: ((a - 1) * 0.19 + (n % 2 ? 0.075 : -0.075)) * i,
    depth: Math.abs(i)
  };
}, __ = (r, e, t, s) => {
  const i = Math.max(0, (es - e) / es) ** 1.5, n = Math.sin(t * 7.3 + s + e * 7.8) * 0.07 + Math.sin(t * 12.7 + s * 1.8 + e * 15.2) * 0.025, a = Math.sin(t * 8.1 + s + r * 7.4 + e * 3) * 0.04 + Math.sin(t * 13.7 + s * 1.4 + r * 12.1 + e * 5.2) * 0.012;
  return { x: r - 0.5 + n * i, y: e - es - a * i };
}, x_ = (r, e, t, s) => {
  const i = Math.max(0, (es - e) / es) ** 1.5;
  return {
    u: r + Math.sin(t * 6.7 + e * 11 + s) * 0.012 * i,
    v: e + Math.sin(t * 9.4 + e * 10 + s + r * 4) * 0.023 * i
  };
}, Hr = (r, e, t) => {
  let s = 0;
  for (const i of [16, 8, 0]) s |= Math.round((r >> i & 255) * (1 - t) + (e >> i & 255) * t) << i;
  return s;
};
function y_(r) {
  const e = new pe();
  e.label = "Medusa plaza / fixed architecture", e.eventMode = "none";
  const t = new Te(r.mgBgBase), s = new Te(r.mgBgFree);
  for (const x of [t, s])
    x.width = tt.width, x.height = tt.height, e.addChild(x);
  s.alpha = 0;
  const i = new pe(), n = new Bt().rect(155, 0, 1615, 145).fill(16777215);
  e.addChild(i, n), i.mask = n;
  const a = Bs.map((x) => {
    const v = new Te(r.mgBgCloud);
    return v.anchor.set(0.5), v.position.set(x.x, x.y), v.width = x.width, v.height = x.height, i.addChild(v), v;
  }), o = [], h = u_.map((x, v) => {
    const A = new pe();
    A.position.set(x.x, x.y), e.addChild(A);
    const M = new Te(r.fxGlow);
    M.anchor.set(0.5), M.y = -20, M.width = 145, M.height = 100, M.tint = 16754503, M.alpha = 0.19, M.blendMode = "add", A.addChild(M);
    const w = Ya.columns, C = Ya.rows, F = new Float32Array((w + 1) * (C + 1) * 2), D = new Float32Array(F.length), I = [];
    for (let O = 0; O <= C; O++) for (let Y = 0; Y <= w; Y++) {
      const X = (O * (w + 1) + Y) * 2;
      if (D[X] = Y / w, D[X + 1] = O / C, F[X] = (Y / w - 0.5) * 76, F[X + 1] = (O / C - 1) * 112, Y < w && O < C) {
        const _ = O * (w + 1) + Y;
        I.push(_, _ + 1, _ + w + 1, _ + 1, _ + w + 2, _ + w + 1);
      }
    }
    const k = new mt({ positions: F, uvs: D, indices: new Uint32Array(I) });
    o.push(k);
    const U = new ws({ geometry: k, texture: r.mgBgFlame });
    return A.addChild(U), { group: A, geometry: k, positions: F, uvs: D, restUVs: D.slice(), index: v };
  }), c = d_.map((x) => {
    const v = new Te(r.fxGlow);
    v.anchor.set(0.5), v.position.set(x.x, x.y - 8), v.width = x.width * 1.04, v.height = 38, v.tint = 4668468, v.alpha = 0.2, e.addChild(v);
    const A = new pe();
    A.position.set(x.x, x.y), e.addChild(A);
    const M = r[x.key], w = new Te(M);
    w.anchor.set(0.5, 1), w.width = x.width, w.height = x.height, A.addChild(w);
    const C = new pe();
    A.addChild(C);
    const F = ll.map((Y) => {
      const X = Y.map(([L, N]) => [L, N * x.plinth]), _ = X.reduce((L, N) => L + N[0] - 0.5, 0) / X.length * x.width, b = X.reduce((L, N) => L + N[1] - 1, 0) / X.length * x.height, S = new Float32Array(X.flatMap(([L, N]) => [(L - 0.5) * x.width - _, (N - 1) * x.height - b])), P = [];
      for (let L = 1; L < X.length - 1; L++) P.push(0, L, L + 1);
      const E = new mt({ positions: S, uvs: new Float32Array(X.flat()), indices: new Uint32Array(P) });
      o.push(E);
      const B = new pe();
      B.position.set(_, b), C.addChild(B);
      const R = new ws({ geometry: E, texture: M }), G = new ws({ geometry: E, texture: M });
      return R.alpha = 0.85, B.addChild(R, G), { piece: B, mesh: G, side: R, cx: _, cy: b };
    }), D = new mt({ positions: new Float32Array([-x.width / 2, (x.plinth - 1) * x.height, x.width / 2, (x.plinth - 1) * x.height, -x.width / 2, 0, x.width / 2, 0]), uvs: new Float32Array([0, x.plinth, 1, x.plinth, 0, 1, 1, 1]), indices: new Uint32Array([0, 1, 2, 1, 3, 2]) });
    o.push(D);
    const I = new ws({ geometry: D, texture: M });
    C.addChild(I);
    const k = new pe(), U = [r.fxCrack1, r.fxCrack2, r.fxCrack3].map((Y) => {
      const X = new Te(Y);
      return X.anchor.set(0.5, 1), X.width = x.width, X.height = x.height, X.tint = 4801342, k.addChild(X), X;
    }), O = new Te(M);
    return O.anchor.set(0.5, 1), O.width = x.width, O.height = x.height, A.addChild(k, O), k.mask = O, { data: x, group: A, intact: w, pieces: C, meshes: F, base: I, cracks: k, crackFrames: U };
  });
  let l = 0, u = 0, d = 0, f = jt, p = !1, g = !1;
  function m(x) {
    if (g) return;
    const v = Math.max(0, x);
    p || (l += v, f = Math.min(jt, f + v)), u += Math.sign(d - u) * Math.min(Math.abs(d - u), v / (p ? 0.25 : 1)), s.alpha = u, a.forEach((w, C) => {
      w.x = f_(l, Bs[C].x, Bs[C].width), w.tint = Hr(16777215, 9017282, u), w.alpha = (0.8 - u * 0.28) * p_(w.x, Bs[C].width);
    });
    for (const w of h)
      if (w.group.alpha = u, w.group.visible = u > 1e-3, !!w.group.visible) {
        for (let C = 0; C < w.positions.length; C += 2) {
          const F = w.restUVs[C], D = w.restUVs[C + 1], I = p ? 0 : l, k = w.index * 2.43, U = __(F, D, I, k), O = x_(F, D, I, k);
          w.positions[C] = U.x * 76, w.positions[C + 1] = U.y * 112, w.uvs[C] = O.u, w.uvs[C + 1] = O.v;
        }
        w.geometry.getBuffer("aPosition").update(), w.geometry.getBuffer("aUV").update();
      }
    const A = m_(f), M = Hr(16777215, 10268625, u);
    for (const w of c)
      w.intact.tint = M, w.base.tint = M, w.intact.visible = A.split < 1e-5, w.pieces.visible = !w.intact.visible, w.cracks.alpha = w.intact.visible ? A.crack * 0.74 : 0, w.crackFrames.forEach((C, F) => {
        C.visible = F === A.crackStage;
      }), w.meshes.forEach(({ piece: C, mesh: F, side: D, cx: I, cy: k }, U) => {
        const O = g_(U, f, w.data.width, w.data.height);
        C.position.set(I + O.x, k + O.y), C.rotation = O.rotation, F.tint = M, D.tint = Hr(M, 5326396, 0.58), D.position.set(4 * O.depth, 5 * O.depth), D.visible = O.depth > 3e-3;
      });
  }
  function y(x, v) {
    const A = Math.max(x / tt.width, v / tt.height);
    e.scale.set(A), e.position.set((x - tt.width * A) / 2, (v - tt.height * A) / 2);
  }
  return m(0), {
    root: e,
    update: m,
    setBounds: y,
    setNight(x) {
      d = x ? 1 : 0;
    },
    setReducedMotion(x) {
      p = x, x && (f = jt), m(0);
    },
    burstStatues() {
      return g || p || f < jt ? !1 : (f = 0, m(0), !0);
    },
    snapshot() {
      return { elapsed: l, nightness: $s(u), burstAge: f, reduced: p, cloudX: a.map((x) => x.x), architecture: { x: t.x, y: t.y, rotation: t.rotation } };
    },
    destroy() {
      g || (g = !0, e.destroy({ children: !0 }), o.forEach((x) => x.destroy()));
    }
  };
}
async function b_() {
  const r = document.querySelector("#stage"), e = document.querySelector("#status"), t = new zo();
  await t.init({ canvas: r, width: 1152, height: 648, antialias: !0, background: 1984848, resolution: 1 });
  const s = "../../../../../static/assets/", i = { mgBgBase: "sprites/medusaBackground/bg_base.jpg", mgBgFree: "sprites/medusaBackground/bg_free.jpg", mgBgCloud: "sprites/medusaBackground/cloud.png", mgBgTourist: "sprites/medusaBackground/statue_tourist.png", mgBgIcecream: "sprites/medusaBackground/statue_icecream.png", mgBgFlame: "sprites/medusaBackground/flame.png", fxCrack1: "sprites/medusaFx/fx_crack_1.png", fxCrack2: "sprites/medusaFx/fx_crack_2.png", fxCrack3: "sprites/medusaFx/fx_crack_3.png", fxGlow: "sprites/medusaFx/fx_glow.png" }, n = Object.fromEntries(await Promise.all(l_.map(async (U) => [U, await Xt.load(s + i[U])]))), a = y_(n);
  t.stage.addChild(a.root), a.setBounds(1152, 648);
  const o = new pe(), h = new Bt().roundRect(0, 0, 650, 42, 6).fill({ color: 729642, alpha: 0.88 }), c = new zp({ text: "BACKGROUND v2 / REAL-TIME ANIMATION", style: { fontFamily: "Arial", fontSize: 18, fill: 15985371 } });
  c.position.set(14, 10), o.position.set(18, 18), o.addChild(h, c), t.stage.addChild(o);
  let l = "scene", u = !1, d = !1, f = !1, p = 0, g = 0, m = 0, y = 0, x, v;
  const A = matchMedia("(prefers-reduced-motion: reduce)");
  a.setReducedMotion(A.matches);
  const M = document.querySelector("#reduced");
  M.checked = A.matches;
  const w = document.querySelector("#clock"), C = document.querySelector("#view");
  function F(U) {
    l = U, C.value = U;
    const O = t.screen.width, Y = t.screen.height;
    if (U === "scene") a.setBounds(O, Y);
    else {
      const X = O / (U === "fire" ? 580 : 820);
      a.root.scale.set(X), a.root.position.set(O / 2 - (U === "fire" ? 300 : 430) * X, Y / 2 - (U === "fire" ? 657 : 470) * X);
    }
    o.scale.set(Math.min(1, O / 900)), c.text = U === "fire" ? "FIRE DETAIL / ROOT LOCK + RISING CURLS" : U === "statue" ? "STATUE DETAIL / 12 FRAGMENTS + STAGGERED SETTLE" : "BACKGROUND v2 / REAL-TIME ANIMATION";
  }
  function D() {
    a.burstStatues() && document.querySelector("#sound").checked && (v == null || v.pause(), v = new Audio(s + "audio/medusa/sfx_statues_crack.wav"), v.volume = 0.45, v.play());
  }
  function I() {
    d || (f = !1, e.textContent = "手動檢視；可切換全景、火焰或石像細節。近看裁切只用於審片，遊戲鏡頭固定。");
  }
  function k() {
    u = !1, document.querySelector("#pause").textContent = "暫停", a.setNight(!1), a.update(1.2), F("scene"), p = 0, g = 0, f = !0, m = performance.now(), y = 0, t.render(), e.textContent = "演出中：白天 → 黃昏點火 → 石像碎裂 → 火焰近看 → 石像近看 → 回白天。近看裁切僅供審片。";
  }
  t.ticker.add(() => {
    const U = performance.now();
    if (!m || document.hidden) {
      m = U;
      return;
    }
    if (y += (U - m) / 1e3, m = U, y < 1 / 60) return;
    const O = y;
    y = 0, (!u || d) && a.update(O);
    const Y = a.snapshot();
    w.textContent = `雲層時間 ${Y.elapsed.toFixed(1)} 秒 · 夜景 ${Math.round(Y.nightness * 100)}%`, f && (!u || d) && (g = p, p += O, g < 2 && p >= 2 && a.setNight(!0), g < 4 && p >= 4 && D(), g < 7 && p >= 7 && F("fire"), g < 11 && p >= 11 && F("statue"), g < 11.5 && p >= 11.5 && D(), g < 14 && p >= 14 && (F("scene"), a.setNight(!1)), p >= 16 && (f = !1, (x == null ? void 0 : x.state) === "recording" ? x.stop() : e.textContent = "完整16秒演出已播放；可重新播放或手動檢查各動作。"));
  }), document.addEventListener("visibilitychange", () => {
    m = 0, y = 0;
  }), document.querySelector("#demo").onclick = k, document.querySelector("#day").onclick = () => {
    I(), a.setNight(!1);
  }, document.querySelector("#night").onclick = () => {
    I(), a.setNight(!0);
  }, document.querySelector("#burst").onclick = () => {
    I(), D();
  }, document.querySelector("#pause").onclick = (U) => {
    u = !u, U.currentTarget.textContent = u ? "繼續播放" : "暫停";
  }, document.querySelector("#minute").onclick = () => {
    a.update(60), e.textContent = "將雲的位置推進60秒；每分鐘移動原場景寬度的1/5。";
  }, M.onchange = () => {
    I(), a.setReducedMotion(M.checked), e.textContent = M.checked ? "減少動態：雲與火焰保持靜止，石像不碎裂。" : "已恢復一般背景動態。";
  }, C.onchange = () => {
    I(), F(C.value);
  }, document.querySelector("#shape").onchange = (U) => {
    const O = U.currentTarget.value === "portrait";
    I(), t.renderer.resize(O ? 432 : 1152, O ? 768 : 648), F(l);
  }, document.querySelector("#record").onclick = () => {
    if (d) return;
    if (!window.MediaRecorder || !r.captureStream) {
      e.textContent = "此瀏覽器不支援錄影，可直接觀看背景預演。";
      return;
    }
    if (M.checked) {
      e.textContent = "請先取消減少動態，再錄製一般版預演。";
      return;
    }
    t.renderer.resize(1152, 648), a.setBounds(1152, 648), document.querySelector("#shape").value = "landscape", k(), d = !0;
    const U = r.captureStream(60), O = [], Y = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    x = new MediaRecorder(U, { mimeType: Y, videoBitsPerSecond: 5e6 }), x.onstart = () => {
      m = performance.now(), y = 0;
    }, x.ondataavailable = (X) => {
      X.data.size && O.push(X.data);
    }, x.onstop = () => {
      const X = URL.createObjectURL(new Blob(O, { type: "video/webm" })), _ = document.createElement("a");
      _.href = X, _.download = "MedusaGaze_background_v2.webm", _.click(), setTimeout(() => URL.revokeObjectURL(X), 3e3), U.getTracks().forEach((b) => b.stop()), d = !1, e.textContent = "16秒背景動畫已下載，含火焰和石像近看。共用遊戲Pixi程式錄製，並非Stake Engine上機錄影。";
    }, x.start(), e.textContent = "錄製16秒動畫中：全景演出與動作細節。";
  }, F("scene"), A.matches ? e.textContent = "已依系統偏好減少動態；取消勾選後可播放動畫。" : k();
}
b_().catch((r) => {
  document.querySelector("#status").textContent = String(r), console.error(r);
});
V.add(Tu);
V.mixin(pe, Su);
V.add(Vo);
V.add($o);
V.add(bh);
V.mixin(pe, Up);
V.add(Yc);
V.add(Di);
V.add(Zc);
V.add(Jc);
V.add(el);
V.add(cl);
V.add(hl);
V.add(nl);
V.add(an);
V.add(al);
V.add(il);
V.add(rl);
V.add(Th);
V.add(vh);
const v_ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), T_ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
