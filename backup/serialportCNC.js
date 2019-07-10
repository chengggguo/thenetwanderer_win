const SerialPort = require('serialport')
const port = new SerialPort('/dev/ttyUSB0', { baudRate: 115200 })
var Readline = SerialPort.parsers.Readline
var LineByLineReader = require('line-by-line')



var serialState = new Boolean()

var parser = port.pipe(new Readline({delimiter:'\n'}))


port.on('open',function(){
	console.log('waiting for serial port connection')
});

/*feedback from grbl*/
parser.on('data', line => {
	console.log(line)
})


/*grbl configuration*/
function config(){
	port.write('$G\n[G0 G54 G17 G21 G90 G94 M0 M5 M9 T0 F0.SO.]\n$$\n$0=10 (step pulse, usec)\n$1=25 (step idle delay, msec)\n$2=0 (step port invert mask:00000000)\n$3=0 (dir port invert mask:00000110)\n$4=0 (step enable invert, bool)\n$5=0 (limit pins invert, bool)\n$6=0 (probe pin invert, bool)\n$10=3 (status report mask:00000011)\n$11=0.020 (junction deviation, mm)\n$12=0.002 (arc tolerance, mm)\n$13=0 (report inches, bool)\n$20=0 (soft limits, bool)\n$21=0 (hard limits, bool)\n$22=0 (homing cycle, bool)\n$23=1 (homing dir invert mask:00000001)\n$24=50.000 (homing feed, mm/min)\n$25=635.000 (homing seek, mm/min)\n$26=250 (homing debounce, msec)\n$27=1.000 (homing pull-off, mm)\n$100=314.961 (x, step/mm)\n$101=314.961 (y, step/mm)\n$102=314.961 (z, step/mm)\n$110=635.000 (x max rate, mm/min)\n$111=635.000 (y max rate, mm/min)\n$112=635.000 (z max rate, mm/min)\n$120=50.000 (x accel, mm/sec^2)\n$121=50.000 (y accel, mm/sec^2)\n$122=50.000 (z accel, mm/sec^2)\n$130=225.000 (x max travel, mm)\n$131=125.000 (y max travel, mm)\n$132=170.000 (z max travel, mm)\n', function(err) {
	  if (err) {
	    return console.log('Error on write: ', err.message)
	  }
	  console.log('grbl configuration done')
	});
};

/*spindle control for testing*/
function spindleOn(){
	console.log('spindle on')
	port.write('m3 s1000\n')

	SerialState()
	if (serialState){
		setTimeout(spindleOff,3000)
	}
};

function spindleOff(){
	console.log('spindle off')
	port.write('m3 0\n')
};


/*checking the state of grbl, if true then send another land of gcode*/
function SerialState(){
	parser.on('data', line => {
		if(line.includes('ok')){
			serialState = true

		}else{
			serialState = false
		}		
	})

	return serialState
}


function GcodeSender(){
	console.log('in GcodeSender now')
	var	lr = new LineByLineReader('test.nc', {skipEmptyLines: true}),
		row = 0
	lr.on('error', function(err){
		throw err
	})

	lr.on('open', function(){
		console.log('gcode file is opened')
	})

	lr.on('line',function(line){
		console.log(line)
		port.write(line + '\n')
		lr.pause()

		SerialState()
		if (serialState){
			setTimeout(function(){
				lr.resume()
			},150)

		}

	});

	lr.on('end',function(){
		console.log('gcode file all line sent')
	})

}

setTimeout(config,2000)
setTimeout(GcodeSender,3000)
//setTimeout(spindleOn,3000)

