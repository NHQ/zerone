master = new AudioContext
var jsynth = require('jsynth')

var nvelope = require('nvelope')
var jigger = require('jigger')
var generator = new jigger()

var oscillators = require('oscillators');
var sync = require('./') // jsynth-sync
var bpm  = 72
var  f = 54
var timer = sync(bpm, master.sampleRate)


var generators = [];
var beatmath = require('beatmath')
var onbeat = beatmath(4, [7, 8])
unswing = false
var t0 = timer.on(1/2, [,[,,1,,],[,,,,,,,,,,1],[,,,,1],[,,,,],0,[1,0,0,,,,],], function(ti, b, off, swing){
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


