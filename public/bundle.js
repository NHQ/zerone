(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/johnny/.npm/lib/node_modules/watchify/node_modules/browserify/node_modules/events/events.js":[function(require,module,exports){
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
      }
      throw TypeError('Uncaught, unspecified "error" event.');
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
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

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
    var m;
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
  } else {
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

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
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

},{}],"/home/johnny/projects/zerone/example.js":[function(require,module,exports){
master = new AudioContext
var jsynth = require('jsynth')

var nvelope = require('nvelope')
var jigger = require('jigger')
var generator = new jigger()

var oscillators = require('oscillators');
var sync = require('./xindex') // jsynth-zerone
var bpm  = 72
var  f = 499
var timer = sync(bpm, master.sampleRate)


var generators = [];
var beatmath = require('beatmath')
var onbeat = beatmath(4, [7, 8])
unswing = false
var t0 = timer.beat(1/2, [,[,,1,,],[,,,,,,,,,,1],[,,,,1],[,,,,],0,[1,0,0,,,,],], function(ti, b, off, swing){
  console.log('major beat is %d', b)
  if(unswing){
    swing(0)
  }
  var x = onbeat(b)
  if(x)
  {
    swing(4/5)
    unswing = true
  }
  var attack = [[0,0], [0,1], [1,1]]
  var release = [[0,1], [0,0], [1, 0]]
  var y = b % 2 == 1 ? 1 : 1/2
  var durations = [.02, bpm / 60 * y ]

  var amod = {}
  amod.curves = [attack, release];
  amod.durations = durations;
  var mod = nvelope(amod.curves, amod.durations);
  var synth = function(t){
		return oscillators.sine(t, f*2*(y)) * mod(t - ti)
	}
	generator.set(ti, synth, amod)
}) 

var synth = function(t, s, i){
	timer.tick.call(timer, t)
	return generator.tick(t, s, i)
}

dsp = jsynth(master, synth)
dsp.connect(master.destination)



},{"./xindex":"/home/johnny/projects/zerone/xindex.js","beatmath":"/home/johnny/projects/zerone/node_modules/beatmath/index.js","jigger":"/home/johnny/projects/zerone/node_modules/jigger/index.js","jsynth":"/home/johnny/projects/zerone/node_modules/jsynth/index.js","nvelope":"/home/johnny/projects/zerone/node_modules/nvelope/index.js","oscillators":"/home/johnny/projects/zerone/node_modules/oscillators/oscillators.js"}],"/home/johnny/projects/zerone/node_modules/beatmath/index.js":[function(require,module,exports){
module.exports = function(m, btz){
  return function(beat){
    var x = beat % m
    if(x==0) x=m
    var i = 0
    var r = false
    for(i; i < btz.length; i++){
      if(btz[i] == x){
        r = true
        break
      }
    }
    return r
  }
}

},{}],"/home/johnny/projects/zerone/node_modules/jigger/index.js":[function(require,module,exports){
var nvelope = require('nvelope')


module.exports = chrono

function chrono(_time){
  if(!(this instanceof chrono)) return new chrono(_time)
  var self = this
  this.ret = {}
  this.gens = []
  this.time = _time || 0
  this.start = _time || 0

  this.set = function(time, synth, mods){
    var x;
    self.gens.push(x = new generate(time, synth, mods))
    return x
  }
  this.tick = function(t, s, i){
    self.time = t
    gc(t)
    return self.gens.reduce(function(a,e){
    	return a + e.signal(t, s, i)
    },0)
  }
  
  function gc(t){
    self.gens = self.gens.filter(function(e){
      if(e.start + e.dur < t) return false
      else return true 
    })
  }
}

function generate(_time, synth, mod){
  if(!(this instanceof generate)) return new generate(_time, synth, mod)
  var self = this
  this.start = _time
  this.dur = mod.durations.reduce(function(acc, e){
  	return acc + e
  },0)
  this.synth = synth
  this.env = nvelope(mod.curves, mod.durations)
  this.signal = function(t, s, i){
  	return self.synth(t, s, i) * self.env(t - self.start)
  }
}

},{"nvelope":"/home/johnny/projects/zerone/node_modules/nvelope/index.js"}],"/home/johnny/projects/zerone/node_modules/jsynth-sync/index.js":[function(require,module,exports){
var emitter = require('events').EventEmitter

module.exports = sync

var $ = module.exports

function sync(bpm, sampleRate){ // bpm, sampleRate, 

	if(!(this instanceof sync)) return new sync(bpm, sampleRate)

	this.bpm = bpm
	this.beatsPerSecond = bpm / 60
	this.sampleRate = sampleRate
	this.spb = Math.round(sampleRate / this.beatsPerSecond)
	this.s = 0
	this.t = 0
	this.index = []
	this.beatIndex = new Array()
}

$.prototype.clearAll = function(bpm, samplerate){
	this.index = this.index.map(function(){return undefined})
}

$.prototype.tick = function(t, i){
	++this.s
//	if(!t) t = this.s / this.sampleRate
//	var f = (this.s % this.spb) + 1;
	for(var n = 0; n < this.index.length; n++ ){
		if(this.index[n]) this.index[n](t, i, this.s)
	}
}

$.prototype.off = function(i){
	this.index.splice(i,1,undefined)
}

$.prototype.on = function(beats, fn){
	var i = Math.ceil(this.spb * beats);
	var l = this.index.length;
	var self = this;
	var off = function(){
    self.off(l)
  };
  var delta = 0
  var skipNext = false
  var skip = false 
  function swing(beat){
    delta = Math.abs(Math.floor(self.spb * beat))
    skipNext = beat === 0 ? false : true
  }
  var emit = new emitter()
  emit.on('stop', off)
	this.index.push((function(b, fn, beats, off){
    return function(t, a, f){
      if(f % (i + delta) == 0) {
        if(skip){
          skip = false
          return
        }
        if(skipNext){
          skipNext = false
          skip = true
          if(delta >= i) {
            skip = false
          }
        }
        fn.apply(fn, [t, ++b, off, swing])
        emit.emit('beat', b)
      }
    }
  })(0, fn, beats, off))
  return emit

}

function amilli(t){
	return [Math.floor(t), (t % 1) * 1000]
}

},{"events":"/home/johnny/.npm/lib/node_modules/watchify/node_modules/browserify/node_modules/events/events.js"}],"/home/johnny/projects/zerone/node_modules/jsynth/index.js":[function(require,module,exports){
module.exports = function (context, fn, bufSize) {

    if (typeof context === 'function') {
      fn = context;
      context = new webkitAudioContext() ;
    }

    if(!bufSize) bufSize = 4096;

    var self = context.createScriptProcessor(bufSize, 1, 1);

    self.fn = fn

    var tt = 0.0
    var ii = 0
    const rate = context.sampleRate

    self.i = self.t = 0

    window._SAMPLERATE = self.sampleRate = self.rate = context.sampleRate;

    self.duration = Infinity;

    self.recording = false;

    self.onaudioprocess = function(e){
      var output = e.outputBuffer.getChannelData(0)
      ,   input = e.inputBuffer.getChannelData(0);
      self.tick(output, input);
    };

    self.tick = function (output, input) { // a fill-a-buffer function

      for (var i = 0; i < output.length; i += 1) {

          tt = ii / rate
          ii = ii + 1
          output[i] = self.fn(tt, ii, input[i]);

      }

      return output
      
    };

    self.stop = function(){
    
      self.disconnect();

      self.playing = false;

      if(self.recording) {}
    };

    self.play = function(opts){

      if (self.playing) return;

      self.connect(self.context.destination);

      self.playing = true;

      return
    
    };

    self.record = function(){

    };

    self.reset = function(){
      self.i = self.t = 0
    };

    self.createSample = function(duration){
      self.reset();
      var buffer = self.context.createBuffer(1, duration, self.context.sampleRate)
      var blob = buffer.getChannelData(0);
      self.tick(blob);
      return buffer
    };

    return self;
};

function mergeArgs (opts, args) {
    Object.keys(opts || {}).forEach(function (key) {
        args[key] = opts[key];
    });

    return Object.keys(args).reduce(function (acc, key) {
        var dash = key.length === 1 ? '-' : '--';
        return acc.concat(dash + key, args[key]);
    }, []);
}

function signed (n) {
    if (isNaN(n)) return 0;
    var b = Math.pow(2, 15);
    return n > 0
        ? Math.min(b - 1, Math.floor((b * n) - 1))
        : Math.max(-b, Math.ceil((b * n) - 1))
    ;
}

},{}],"/home/johnny/projects/zerone/node_modules/nvelope/amod.js":[function(require,module,exports){
module.exports = function (pts) {
        return function (t) {
                for (var a = pts; a.length > 1; a = b){
                        for (var i = 0, b = [], j; i < a.length - 1; i++){
                                for (b[i] = [], j = 1; j < a[i].length; j++){
                                        b[i][j] = a[i][j] * (1 - t) + a[i+1][j] * t;
                                }
                        }
                }
                return a[0][1];
	}    
}



},{}],"/home/johnny/projects/zerone/node_modules/nvelope/index.js":[function(require,module,exports){
var amod = require( './amod.js');
var tnorm = require('normalize-time');

module.exports = function(pts, durs){
	
	pts = pts.map(amod)
	var t = 0;
	var totalDuration = durs.reduce(function(e,i){return e + i}, 0);
	var tdNormFN = tnorm(t, totalDuration);
	var s = 0;
	var end = t + totalDuration;
	var durFNS = durs.map(function(e,i){
		var x = tnorm(t + s, e)
		s += e;
		return x
	})
	var dp = 0;
	var durpercent = durs.map(function(e, i){
		var x = (e / totalDuration) + dp;
		dp+= (e / totalDuration)
		return x
	})
	var tn, n, i, v = 0, fn = 0;
	var envelope = function(t){
		tn = tdNormFN(t);
		if(0 > tn || tn > 1) return 0;
		fn = durpercent.reduce(function(p, e, i, d){return ((d[i-1] || 0) <= tn && tn <= e) ? i : p}, 0)
		v = pts[fn](durFNS[fn](t))
		return v
	}
	return envelope

	// probably deletable
	function xenvelope(t, sustain){
		tn = tdNormFN(t); 
		if(0 >= tn || tn  >= 1) return 0;
		if(tn > durpercent[fn]) fn = (fn + 1 > pts.length - 1 ? 0 : fn + 1)
		v = pts[fn](durFNS[fn](t))
		return v
	}
}


},{"./amod.js":"/home/johnny/projects/zerone/node_modules/nvelope/amod.js","normalize-time":"/home/johnny/projects/zerone/node_modules/nvelope/node_modules/normalize-time/index.js"}],"/home/johnny/projects/zerone/node_modules/nvelope/node_modules/normalize-time/index.js":[function(require,module,exports){
module.exports = function(start, dur, min, max){

	if(!min) min = 0;
	if(!max) max = 1;
	var end = start + dur;
	var d = end - start;
	var r = max - min;

	return function(time){

		x = min + (time - start) * r / d
		if(x > 1){
//			console.log('pre', time, end)
			if(time < end) x = Number('.' + x.toString().split('.').join(''))
//			console.log('norm', x)
		}
		return x
	}

}

},{}],"/home/johnny/projects/zerone/node_modules/oscillators/oscillators.js":[function(require,module,exports){
var OZ = module.exports
var tau = Math.PI * 2

OZ.sine = sine;
OZ.saw = saw;
OZ.saw_i = saw_i;
OZ.triangle = triangle;
OZ.triangle_s = triangle_s;
OZ.square = square;

function sine(t, f){

    return Math.sin(t * tau * f);
    
};

function saw(t, f){

    var n = ((t % (1/f)) * f) % 1; // n = [0 -> 1]

    return -1 + (2 * n)

};

function saw_i(t, f){

    var n = ((t % (1/f)) * f) % 1; // n = [0 -> 1]
    
    return 1 - (2 * n)

};

function triangle(t, f){
    
    var n = ((t % (1/f)) * f) % 1; // n = [0 -> 1]
    
    return n < 0.5 ? -1 + (2 * (2 * n)) : 1 - (2 * (2 * n))
    
};

function triangle_s(t, f){
    
    var n = ((t % (1/f)) * f) % 1; // n = [0 -> 1]
    
    var s = Math.abs(Math.sin(t));
    
    return n < s ? -1 + (2 * (2 * (n / s))) : 1 - (2 * (2 * (n / s)))
    
};

function square(t, f){

    return ((t % (1/f)) * f) % 1 > 0.5 ? 1 : -1;

};

},{}],"/home/johnny/projects/zerone/xindex.js":[function(require,module,exports){
var sync = require('jsynth-sync')

module.exports = function(bpm, sampleRate){
  var Timer = sync(bpm, sampleRate)
  Timer.beat = beat
  return Timer
  
  function beat (interval, rayray, fn){
    var swag = 0
    var swinger = function(x){swag = x}
    var master = undefined

    return eys(interval, rayray, fn)

    function eys (interval, rayray, fn){
      var y = rayray.length
      
      if(!master) master = {rayray: rayray, beat: 0}

      var timer = Timer.on(interval, function(time, beat, xxx, swing){
        if(rayray === master.rayray){
          master.beat = beat
          //console.log('master beat %d', beat)
        }
        else{
          //console.log('submaster beat %d', beat, rayray)
        }
        swing(swag)
        var i = rayray[(beat-1)%y]
        if(i){
          if(Array.isArray(i)){
            var yn = i.length
            var intervaln = interval / yn
            var bat = eys(intervaln, i, fn)// interval is bug?
            bat._l = i.length
            bat.on('beat', function(b){
              if(b == bat._l) bat.emit('stop') 
            })
          }
          else{
            fn(time, master.beat, xxx, swinger)
          }
        }
        else{
          return
        }
      })
      return timer
    }
  }
}

},{"jsynth-sync":"/home/johnny/projects/zerone/node_modules/jsynth-sync/index.js"}]},{},["/home/johnny/projects/zerone/example.js"]);
