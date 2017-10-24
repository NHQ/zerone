var sync = require('../jsynth-sync')

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
      

      var timer = Timer.on(interval, function(time, beat, xxx, swing){
        if(rayray === master.rayray){
          master.beat = beat
          master.stop = xxx
          master.ended = false
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
             var _timer = eys(intervaln, i, fn)// interval is bug?
            _timer._l = i.length
            _timer.on('end', function(){
              master.timer.emit('stop')
            })
            _timer.on('beat', function(b){
              if(b === _timer._l) _timer.emit('stop') 
            })
          }
          else{
            fn(time, master.beat, beat, i, xxx, swinger)
          }
        }
        else{
          return
        }
      })
      if(!master){
        master = {rayray: rayray, beat: 0}
        master.timer = timer
      }
      timer.on('end', function(){
        timer.emit('stop')
      })
      return timer
    }
  }
}
