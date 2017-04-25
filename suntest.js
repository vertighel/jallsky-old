
/// tests with suncalc to make an automatic system starting at dusk and stopping at sunrise

var SunCalc = require('suncalc');

var latitude=44.5  /// in header_template.json
var longitude=9.20 /// in header_template.json

var now = new Date();

var tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1); 

var todaytimes    = SunCalc.getTimes(/*Date*/ now,      /*Number*/ latitude, /*Number*/ longitude)
var tomorrowtimes = SunCalc.getTimes(/*Date*/ tomorrow, /*Number*/ latitude, /*Number*/ longitude)

console.log(now)
console.log(tomorrow)

console.log(todaytimes.sunrise)
console.log(todaytimes.dusk)

console.log(tomorrowtimes.sunrise)
console.log(tomorrowtimes.dusk)

/// If < 0, take following day parameters
console.log(now-todaytimes.dusk)
