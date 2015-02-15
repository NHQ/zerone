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
