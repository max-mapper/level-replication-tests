var master = new (webkitAudioContext || AudioContext)
var jsynth = require('jsynth')
var tune = require('tune')
 
var ff = [];
[
  'C D E G',
  'A B C E',
  'C D E G',
  'A B C E',
  'A C F G',
  'A B D G',
  'Ab C Eb G',
  'A Bb D F',
].forEach(function(chord) {
  chord = chord.split(' ')
  var oct = 2, arp = [];
  for (var i = 0; i < (chord.length - 1) * 6; i++) {
    if (i % 4 === 0) oct++
    arp.push(chord[i % 4] + oct)
  }
  ff = ff.concat(arp.concat(arp.slice(0, -1).reverse()))
});
ff = tune(ff)
 
var synth = jsynth(master, function(t) {
  return ff(t * 2) / 50
})
synth.connect(master.destination)