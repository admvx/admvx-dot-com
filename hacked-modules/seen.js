/** Heavily edited + stripped back 3D renderer based on seen.js v0.2.7: themadcreator.github.io/seen */

"use strict";

(function() {
  let ARRAY_POOL, IDENTITY, NEXT_UNIQUE_ID, POINT_POOL, _svg, seen, DEFAULT_NORMAL,
    slice = [].slice,
    extend = function(child, parent) { for (let key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;
    
  seen = {};
  
  if (typeof window !== "undefined" && window !== null) {
    window.seen = seen;
  }
  
  if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
    module.exports = seen;
  }
  
  NEXT_UNIQUE_ID = 1;
  
  seen.Util = {
    defaults: function(obj, opts, defaults) {
      let prop, results;
      for (prop in opts) {
        if (obj[prop] == null) {
          obj[prop] = opts[prop];
        }
      }
      results = [];
      for (prop in defaults) {
        if (obj[prop] == null) {
          results.push(obj[prop] = defaults[prop]);
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    arraysEqual: function(a, b) {
      let i, len1, o, val;
      if (!a.length === b.length) {
        return false;
      }
      for (i = o = 0, len1 = a.length; o < len1; i = ++o) {
        val = a[i];
        if (!(val === b[i])) {
          return false;
        }
      }
      return true;
    },
    uniqueId: function() {
      return NEXT_UNIQUE_ID++;
    },
    element: function(elementOrString) {
      if (typeof elementOrString === 'string') {
        return document.getElementById(elementOrString);
      } else {
        return elementOrString;
      }
    }
  };
  
  ARRAY_POOL = new Array(16);
  
  IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  
  seen.Matrix = (function() {
    function Matrix(m1) {
      this.m = m1 != null ? m1 : null;
      if (this.m == null) {
        this.m = IDENTITY.slice();
      }
      this.baked = IDENTITY;
    }
    
    Matrix.prototype.copy = function() {
      return new seen.Matrix(this.m.slice());
    };
    
    Matrix.prototype.matrix = function(m) {
      let c, i, j, o, u;
      c = ARRAY_POOL;
      for (j = o = 0; o < 4; j = ++o) {
        for (i = u = 0; u < 16; i = u += 4) {
          c[i + j] = m[i] * this.m[j] + m[i + 1] * this.m[4 + j] + m[i + 2] * this.m[8 + j] + m[i + 3] * this.m[12 + j];
        }
      }
      ARRAY_POOL = this.m;
      this.m = c;
      return this;
    };
    
    Matrix.prototype.reset = function() {
      this.m = this.baked.slice();
      return this;
    };
    
    Matrix.prototype.multiply = function(b) {
      return this.matrix(b.m);
    };
    
    Matrix.prototype.rotx = function(theta) {
      let ct, rm, st;
      ct = Math.cos(theta);
      st = Math.sin(theta);
      rm = [1, 0, 0, 0, 0, ct, -st, 0, 0, st, ct, 0, 0, 0, 0, 1];
      return this.matrix(rm);
    };
    
    Matrix.prototype.roty = function(theta) {
      let ct, rm, st;
      ct = Math.cos(theta);
      st = Math.sin(theta);
      rm = [ct, 0, st, 0, 0, 1, 0, 0, -st, 0, ct, 0, 0, 0, 0, 1];
      return this.matrix(rm);
    };
    
    Matrix.prototype.rotz = function(theta) {
      let ct, rm, st;
      ct = Math.cos(theta);
      st = Math.sin(theta);
      rm = [ct, -st, 0, 0, st, ct, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      return this.matrix(rm);
    };
    
    Matrix.prototype.translate = function(x, y, z) {
      let rm;
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      if (z == null) {
        z = 0;
      }
      rm = [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];
      return this.matrix(rm);
    };
    
    Matrix.prototype.scale = function(sx, sy, sz) {
      let rm;
      if (sx == null) {
        sx = 1;
      }
      if (sy == null) {
        sy = sx;
      }
      if (sz == null) {
        sz = sy;
      }
      rm = [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
      return this.matrix(rm);
    };
    
    return Matrix;
  })();
  
  seen.M = function(m) {
    return new seen.Matrix(m);
  };
  
  seen.Transformable = (function() {
    function Transformable() {
      let fn, len1, method, o, ref;
      this.m = new seen.Matrix();
      this.baked = IDENTITY;
      ref = ['scale', 'translate', 'rotx', 'roty', 'rotz', 'matrix', 'reset'];
      fn = (function(_this) {
        return function(method) {
          return _this[method] = function() {
            let ref1;
            (ref1 = this.m[method]).call.apply(ref1, [this.m].concat(slice.call(arguments)));
            return this;
          };
        };
      })(this);
      for (o = 0, len1 = ref.length; o < len1; o++) {
        method = ref[o];
        fn(method);
      }
    }
    
    Transformable.prototype.transform = function(m) {
      this.m.multiply(m);
      return this;
    };
    
    return Transformable;
  })();
  
  seen.Point = (function() {
    function Point(x4, y4, z4, w1) {
      this.x = x4 != null ? x4 : 0;
      this.y = y4 != null ? y4 : 0;
      this.z = z4 != null ? z4 : 0;
      this.w = w1 != null ? w1 : 1;
    }
    
    Point.prototype.copy = function() {
      return new seen.Point(this.x, this.y, this.z, this.w);
    };
    
    Point.prototype.set = function(p) {
      this.x = p.x;
      this.y = p.y;
      this.z = p.z;
      this.w = p.w;
      return this;
    };
    
    Point.prototype.add = function(q) {
      this.x += q.x;
      this.y += q.y;
      this.z += q.z;
      return this;
    };
    
    Point.prototype.subtract = function(q) {
      this.x -= q.x;
      this.y -= q.y;
      this.z -= q.z;
      return this;
    };
    
    Point.prototype.translate = function(x, y, z) {
      this.x += x;
      this.y += y;
      this.z += z;
      return this;
    };
    
    Point.prototype.multiply = function(n) {
      this.x *= n;
      this.y *= n;
      this.z *= n;
      return this;
    };
    
    Point.prototype.divide = function(n) {
      this.x /= n;
      this.y /= n;
      this.z /= n;
      return this;
    };
    
    Point.prototype.normalize = function() {
      let n;
      n = this.magnitude();
      if (n === 0) {
        this.set(seen.Points.Z());
      } else {
        this.divide(n);
      }
      return this;
    };
    
    Point.prototype.transform = function(matrix) {
      let r;
      r = POINT_POOL;
      r.x = this.x * matrix.m[0] + this.y * matrix.m[1] + this.z * matrix.m[2] + this.w * matrix.m[3];
      r.y = this.x * matrix.m[4] + this.y * matrix.m[5] + this.z * matrix.m[6] + this.w * matrix.m[7];
      r.z = this.x * matrix.m[8] + this.y * matrix.m[9] + this.z * matrix.m[10] + this.w * matrix.m[11];
      r.w = this.x * matrix.m[12] + this.y * matrix.m[13] + this.z * matrix.m[14] + this.w * matrix.m[15];
      this.set(r);
      return this;
    };
    
    Point.prototype.magnitudeSquared = function() {
      return this.dot(this);
    };
    
    Point.prototype.magnitude = function() {
      return Math.sqrt(this.magnitudeSquared());
    };
    
    Point.prototype.dot = function(q) {
      return this.x * q.x + this.y * q.y + this.z * q.z;
    };
    
    Point.prototype.cross = function(q) {
      let r;
      r = POINT_POOL;
      r.x = this.y * q.z - this.z * q.y;
      r.y = this.z * q.x - this.x * q.z;
      r.z = this.x * q.y - this.y * q.x;
      this.set(r);
      return this;
    };
    
    return Point;
  })();
  
  seen.P = function(x, y, z, w) {
    return new seen.Point(x, y, z, w);
  };
  
  POINT_POOL = seen.P();
  
  seen.Points = {
    X: function() {
      return seen.P(1, 0, 0);
    },
    Y: function() {
      return seen.P(0, 1, 0);
    },
    Z: function() {
      return seen.P(0, 0, 1);
    },
    ZERO: function() {
      return seen.P(0, 0, 0);
    }
  };
  
  seen.RenderContext = (function() {
    function RenderContext() {
      this.render = this.render.bind(this);
      this.layers = [];
    }
    
    RenderContext.prototype.render = function() {
      let layer, len1, o, ref;
      this.reset();
      ref = this.layers;
      for (o = 0, len1 = ref.length; o < len1; o++) {
        layer = ref[o];
        layer.context.reset();
        layer.layer.render(layer.context);
        layer.context.cleanup();
      }
      this.cleanup();
      return this;
    };
    
    RenderContext.prototype.layer = function(layer) {
      this.layers.push({
        layer: layer,
        context: this
      });
      return this;
    };
    
    RenderContext.prototype.sceneLayer = function(scene) {
      this.layer(new seen.SceneLayer(scene));
      return this;
    };
    
    RenderContext.prototype.reset = function() { };
    
    RenderContext.prototype.cleanup = function() { };
    
    return RenderContext;
  })();
  
  seen.RenderLayerContext = (function() {
    function RenderLayerContext() { }
    
    RenderLayerContext.prototype.path = function() { };
    
    RenderLayerContext.prototype.reset = function() { };
    
    RenderLayerContext.prototype.cleanup = function() { };
    
    return RenderLayerContext;
  })();
  
  seen.Painter = (function() {
    function Painter() { }
    
    Painter.prototype.paint = function() { };
    
    return Painter;
  })();
  
  seen.PathPainter = (function(superClass) {
    extend(PathPainter, superClass);
    
    function PathPainter() {
      return PathPainter.__super__.constructor.apply(this, arguments);
    }
    
    PathPainter.prototype.paint = function(renderModel, context) {
      let painter;
      painter = context.path().path(renderModel.projected.points);
      painter.fill(renderModel.fill);
    };
    
    return PathPainter;
  })(seen.Painter);
  
  seen.Painters = {
    path: new seen.PathPainter()
  };
  
  DEFAULT_NORMAL = seen.Points.Z();
  
  seen.RenderModel = (function() {
    function RenderModel(surface1, transform1, projection1, viewport1) {
      this.surface = surface1;
      this.transform = transform1;
      this.projection = projection1;
      this.viewport = viewport1;
      this.points = this.surface.points;
      this.transformed = this._initRenderData();
      this.projected = this._initRenderData();
      this._update();
    }
    
    RenderModel.prototype.update = function(transform, projection, viewport) {
      if (!this.surface.dirty && seen.Util.arraysEqual(transform.m, this.transform.m) && seen.Util.arraysEqual(projection.m, this.projection.m) && seen.Util.arraysEqual(viewport.m, this.viewport.m)) {
        
      } else {
        this.transform = transform;
        this.projection = projection;
        this.viewport = viewport;
        return this._update();
      }
    };
    
    RenderModel.prototype._update = function() {
      let cameraSpace;
      this._math(this.transformed, this.points, this.transform, false);
      cameraSpace = this.transformed.points.map((function(_this) {
        return function(p) {
          return p.copy().transform(_this.projection);
        };
      })(this));
      this.inFrustrum = true;
      this._math(this.projected, cameraSpace, this.viewport, true);
      return this.surface.dirty = false;
    };
    
    RenderModel.prototype._initRenderData = function() {
      let p;
      return {
        points: (function() {
          let len1, o, ref, results;
          ref = this.points;
          results = [];
          for (o = 0, len1 = ref.length; o < len1; o++) {
            p = ref[o];
            results.push(p.copy());
          }
          return results;
        }).call(this),
        barycenter: seen.P(),
        normal: seen.P(),
        v0: seen.P(),
        v1: seen.P()
      };
    };
    
    RenderModel.prototype._math = function(set, points, transform, applyClip) {
      let i, len1, len2, o, p, ref, sp, u;
      for (i = o = 0, len1 = points.length; o < len1; i = ++o) {
        p = points[i];
        sp = set.points[i];
        sp.set(p).transform(transform);
        if (applyClip) {
          sp.divide(sp.w);
        }
      }
      set.barycenter.multiply(0);
      ref = set.points;
      for (u = 0, len2 = ref.length; u < len2; u++) {
        p = ref[u];
        set.barycenter.add(p);
      }
      set.barycenter.divide(set.points.length);
      
      set.v0.set(set.points[1]).subtract(set.points[0]);
      set.v1.set(set.points[points.length - 1]).subtract(set.points[0]);
      return set.normal.set(set.v0).cross(set.v1).normalize();
    };
    
    return RenderModel;
  })();
  
  seen.RenderLayer = (function() {
    function RenderLayer() {
      this.render = this.render.bind(this);
    }
    
    RenderLayer.prototype.render = function(context) { };
    
    return RenderLayer;
  })();
  
  seen.SceneLayer = (function(superClass) {
    extend(SceneLayer, superClass);
    
    function SceneLayer(scene1) {
      this.scene = scene1;
      this.render = this.render.bind(this);
    }
    
    SceneLayer.prototype.render = function(context) {
      let len1, o, ref, renderModel, results;
      ref = this.scene.render();
      results = [];
      for (o = 0, len1 = ref.length; o < len1; o++) {
        renderModel = ref[o];
        results.push(renderModel.surface.painter.paint(renderModel, context));
      }
      return results;
    };
    
    return SceneLayer;
  })(seen.RenderLayer);
  
  _svg = function(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  };
  
  seen.SvgStyler = (function() {
    SvgStyler.prototype._d = '';
    SvgStyler.prototype._svgTag = 'g';
    
    function SvgStyler(elementFactory) {
      this.elementFactory = elementFactory;
    }
    
    SvgStyler.prototype.clear = function() {
      this._attributes = {};
      return this;
    };
    
    SvgStyler.prototype.fill = function(fill) {
      let el = this.elementFactory(this._svgTag);
      // el.setAttribute('style', 'fill:' + fill);
      el.setAttribute('style', 'color:' + fill);
      el.setAttribute('d', this._d);
      return el;
    };
    
    return SvgStyler;
  })();
  
  seen.SvgPathPainter = (function(superClass) {
    extend(SvgPathPainter, superClass);
    
    function SvgPathPainter() {
      return SvgPathPainter.__super__.constructor.apply(this, arguments);
    }
    
    SvgPathPainter.prototype._svgTag = 'path';
    
    SvgPathPainter.prototype.path = function(points) {
      this._d = 'M' + points.map(function(p) {
        return p.x + " " + p.y;
      }).join('L');
      return this;
    };
    
    return SvgPathPainter;
  })(seen.SvgStyler);
  
  seen.SvgLayerRenderContext = (function(superClass) {
    extend(SvgLayerRenderContext, superClass);
    
    function SvgLayerRenderContext(group1) {
      this.group = group1;
      this._elementFactory = this._elementFactory.bind(this);
      this.pathPainter = new seen.SvgPathPainter(this._elementFactory);
      this._i = 0;
    }
    
    SvgLayerRenderContext.prototype.path = function() {
      return this.pathPainter.clear();
    };
    
    SvgLayerRenderContext.prototype.reset = function() {
      return this._i = 0;
    };
    
    SvgLayerRenderContext.prototype.cleanup = function() {
      let children, results;
      children = this.group.childNodes;
      results = [];
      while (this._i < children.length) {
        children[this._i].setAttribute('style', 'display: none;');
        results.push(this._i++);
      }
      return results;
    };
    
    SvgLayerRenderContext.prototype._elementFactory = function(type) {
      let children, current, path;
      children = this.group.childNodes;
      if (this._i >= children.length) {
        path = _svg(type);
        this.group.appendChild(path);
        this._i++;
        return path;
      }
      current = children[this._i];
      if (current.tagName === type) {
        this._i++;
        return current;
      } else {
        path = _svg(type);
        this.group.replaceChild(path, current);
        this._i++;
        return path;
      }
    };
    
    return SvgLayerRenderContext;
  })(seen.RenderLayerContext);
  
  seen.SvgRenderContext = (function(superClass) {
    extend(SvgRenderContext, superClass);
    
    function SvgRenderContext(svg) {
      this.svg = svg;
      SvgRenderContext.__super__.constructor.call(this);
      this.svg = seen.Util.element(this.svg);
    }
    
    SvgRenderContext.prototype.layer = function(layer) {
      let group;
      this.svg.appendChild(group = _svg('g'));
      this.layers.push({
        layer: layer,
        context: new seen.SvgLayerRenderContext(group)
      });
      return this;
    };
    
    return SvgRenderContext;
  })(seen.RenderContext);
  
  seen.SvgContext = function(elementId, scene) {
    let context;
    context = new seen.SvgRenderContext(elementId);
    if (scene != null) {
      context.sceneLayer(scene);
    }
    return context;
  };
  
  seen.Surface = (function() {
    Surface.prototype.cullBackfaces = true;
    
    function Surface(points1, painter1) {
      this.points = points1;
      this.painter = painter1 != null ? painter1 : seen.Painters.path;
      this.id = 's' + seen.Util.uniqueId();
    }
    
    Surface.prototype.fill = function(fill) {
      this.fillMaterial = fill;
      return this;
    };
    
    return Surface;
  })();
  
  seen.Shape = (function(superClass) {
    extend(Shape, superClass);
    
    function Shape(type1, surfaces1) {
      this.type = type1;
      this.surfaces = surfaces1;
      Shape.__super__.constructor.call(this);
    }
    
    return Shape;
  })(seen.Transformable);
  
  seen.Model = (function(superClass) {
    extend(Model, superClass);
    
    function Model() {
      Model.__super__.constructor.call(this);
      this.children = [];
    }
    
    Model.prototype.add = function() {
      let child, children, len1, o;
      children = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      for (o = 0, len1 = children.length; o < len1; o++) {
        child = children[o];
        if (child instanceof seen.Shape || child instanceof seen.Model) {
          this.children.push(child);
        }
      }
      return this;
    };
    
    Model.prototype.eachRenderable = function(lightFn, shapeFn) {
      return this._eachRenderable(lightFn, shapeFn, [], this.m);
    };
    
    Model.prototype._eachRenderable = function(lightFn, shapeFn, lightModels, transform) {
      let child, len2, ref1, results, u;
      ref1 = this.children;
      results = [];
      for (u = 0, len2 = ref1.length; u < len2; u++) {
        child = ref1[u];
        if (child instanceof seen.Shape) {
          shapeFn.call(this, child, lightModels, child.m.copy().multiply(transform));
        }
        if (child instanceof seen.Model) {
          results.push(child._eachRenderable(lightFn, shapeFn, lightModels, child.m.copy().multiply(transform)));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
    
    return Model;
  })(seen.Transformable);
  
  seen.Projections = {
    perspectiveFov: function(fovyInDegrees, front) {
      let tan;
      if (fovyInDegrees == null) {
        fovyInDegrees = 50;
      }
      if (front == null) {
        front = 1;
      }
      tan = front * Math.tan(fovyInDegrees * Math.PI / 360);
      return seen.Projections.perspective(-tan, tan, -tan, tan, front, 2 * front);
    },
    perspective: function(left, right, bottom, top, near, far) {
      let dx, dy, dz, m, near2;
      if (left == null) {
        left = -1;
      }
      if (right == null) {
        right = 1;
      }
      if (bottom == null) {
        bottom = -1;
      }
      if (top == null) {
        top = 1;
      }
      if (near == null) {
        near = 1;
      }
      if (far == null) {
        far = 100;
      }
      near2 = 2 * near;
      dx = right - left;
      dy = top - bottom;
      dz = far - near;
      m = new Array(16);
      m[0] = near2 / dx;
      m[1] = 0.0;
      m[2] = (right + left) / dx;
      m[3] = 0.0;
      m[4] = 0.0;
      m[5] = near2 / dy;
      m[6] = (top + bottom) / dy;
      m[7] = 0.0;
      m[8] = 0.0;
      m[9] = 0.0;
      m[10] = -(far + near) / dz;
      m[11] = -(far * near2) / dz;
      m[12] = 0.0;
      m[13] = 0.0;
      m[14] = -1.0;
      m[15] = 0.0;
      return seen.M(m);
    }
  };
  
  seen.Viewports = {
    center: function(width, height, x, y) {
      let postscale, prescale;
      if (width == null) {
        width = 500;
      }
      if (height == null) {
        height = 500;
      }
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      prescale = seen.M().translate(-x, -y, -height).scale(1 / width, 1 / height, 1 / height);
      postscale = seen.M().scale(width, -height, height).translate(x + width / 2, y + height / 2, height);
      return {
        prescale: prescale,
        postscale: postscale
      };
    },
    origin: function(width, height, x, y) {
      let postscale, prescale;
      if (width == null) {
        width = 500;
      }
      if (height == null) {
        height = 500;
      }
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      prescale = seen.M().translate(-x, -y, -1).scale(1 / width, 1 / height, 1 / height);
      postscale = seen.M().scale(width, -height, height).translate(x, y);
      return {
        prescale: prescale,
        postscale: postscale
      };
    }
  };
  
  seen.Camera = (function(superClass) {
    extend(Camera, superClass);
    
    Camera.prototype.defaults = {
      projection: seen.Projections.perspective()
    };
    
    function Camera(options) {
      seen.Util.defaults(this, options, this.defaults);
      Camera.__super__.constructor.apply(this, arguments);
    }
    
    return Camera;
  })(seen.Transformable);
  
  seen.Shapes = {
    mapPointsToSurfaces: function(points, coordinateMap) {
      let c, coords, len1, o, spts, surfaces;
      surfaces = [];
      for (o = 0, len1 = coordinateMap.length; o < len1; o++) {
        coords = coordinateMap[o];
        spts = (function() {
          let len2, results, u;
          results = [];
          for (u = 0, len2 = coords.length; u < len2; u++) {
            c = coords[u];
            results.push(points[c].copy());
          }
          return results;
        })();
        surfaces.push(new seen.Surface(spts));
      }
      return surfaces;
    }
  };
  
  seen.Scene = (function() {
    Scene.prototype.defaults = function() {
      return {
        model: new seen.Model(),
        camera: new seen.Camera(),
        viewport: seen.Viewports.origin(1, 1),
        cullBackfaces: true,
        fractionalPoints: false,
        cache: true
      };
    };
    
    function Scene(options) {
      this.flushCache = this.flushCache.bind(this);
      this.render = this.render.bind(this);
      seen.Util.defaults(this, options, this.defaults());
      this._renderModelCache = {};
    }
    
    Scene.prototype.render = function() {
      let projection, renderModels, viewport;
      projection = this.camera.m.copy().multiply(this.viewport.prescale).multiply(this.camera.projection);
      viewport = this.viewport.postscale;
      renderModels = [];
      this.model.eachRenderable(function() {
        
      }, (function(_this) {
        return function(shape, lights, transform) {
          let len1, o, ref3, renderModel, results, surface;
          ref3 = shape.surfaces;
          results = [];
          for (o = 0, len1 = ref3.length; o < len1; o++) {
            surface = ref3[o];
            renderModel = _this._renderSurface(surface, transform, projection, viewport);
            renderModel.fill = surface.fillMaterial;
            results.push(renderModels.push(renderModel));
          }
          return results;
        };
      })(this));
      renderModels.sort(function(a, b) {
        return b.projected.barycenter.z - a.projected.barycenter.z;
      });
      return renderModels;
    };
    
    Scene.prototype._renderSurface = function(surface, transform, projection, viewport) {
      let renderModel;
      if (! this.cache) {
        return new seen.RenderModel(surface, transform, projection, viewport);
      }
      renderModel = this._renderModelCache[surface.id];
      if (renderModel) {
        renderModel.update(transform, projection, viewport);
      } else {
        renderModel = this._renderModelCache[surface.id] = new seen.RenderModel(surface, transform, projection, viewport);
      }
      return renderModel;
    };
    
    Scene.prototype.flushCache = function() {
      return this._renderModelCache = {};
    };
    
    return Scene;
  })();
  
})(this);
