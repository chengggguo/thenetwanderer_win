/*web socket*/
var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)


/* text to svg*/
var fs = require('fs')
var svgpath = require('svgpath')
const svgcode = require("svgcode")
const TextToSVG = require('text-to-svg')

/*svg reotation*/
const textToSVG = TextToSVG.loadSync('./fonts/simplex.ttf')
const attributes = {fill: 'none', stroke: 'black'}
const options = {x: 0, y: 0, fontSize: 72, anchor: 'top', attributes: attributes};

/*read presaved gateways's ip address */
var rlIP = require('readline-specific')
var LineCounterIP = 1
var ipAdd = ' '

/* get a random name*/
var rlName = require('readline-specific')
var randomNameNo = 1
var name = ' '

var totalData = "33"
/*arduino serail port(gbrl)*/
const SerialPort = require('serialport')
const portCNC = new SerialPort('/COM6', { baudRate: 115200 })
const portSpindle = new SerialPort('/COM4',{ baudRate: 9600})
var Readline = SerialPort.parsers.Readline

/*line by line gcode sender*/
var LineByLineReader = require('line-by-line')
var serialState = new Boolean() //checking the grbl feedback
var parser = new Readline()
portCNC.pipe(parser)
var parserSpindle = new Readline()
portSpindle.pipe(parserSpindle)
//var parser = portCNC.pipe(new Readline({delimiter:'\n'}))
var Fiber = require('fibers')

//limit counter for engraving test
var PosLimit = 40

var path


/*communication with the arduino(grbl)*/
portCNC.on('open',function(){
  console.log('waiting for serial port connection')
});

/*communication with the spindle*/
portSpindle.on('open',function(){
	console.log('talking to spindle')

});

/*feedback from arduino(grbl)*/
parser.on('data', line => {
  console.log(line)
})

/*moving the CNC to next starting position after finish one line*/
var PosCounter = 1

/*communication with the client (error page of the browser)*/
app.use(express.static('./'))
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html')
})
 


setTimeout(function(){
	console.log("config now")
	ConfigSender()


	setTimeout(function(){
		for (var i = 0; i < PosLimit; i++){
			setDelay(i)
		}

	},60000)


},2000)

function printing(){
	console.log("prepare the random text")
	getRandmonText()
	setTimeout(function(){
		// console.log("send the gcode" + i + "round")
		senderPart()
	},300)

}

function setDelay(i,calback){
	setTimeout(function(){
		printing()
		// getRandmonText()
		console.log(i)
		console.log("send the gcode " + i + " round")
	},i*400000)			//modify the holding time of which line
	return('finish')
}




function getRandmonText(){

	setTimeout(function(){
		LineCounterIP = getRandomInt(627)
		rlIP.oneline('./ipPreSorted2.txt', LineCounterIP,function(err,res){
			if (err) {
				console.error(err)
			}
			ipAdd = res
			console.log('got a random IP')
			console.log(ipAdd)
		})
		setTimeout(function(){
			randomNameNo = getRandomInt(3110)
			rlName.oneline('./names.txt', LineCounterIP,function(err,res){
				if (err) {
					console.error(err)
				}
				name = res
				name = name.toString()
				console.log('got a random name')
				console.log(name)
			})
			setTimeout(function(){
				var score = getRandomInt(2700) // get a random scroe for testing
				score = score.toString()
				console.log('got random name and score')
				totalData =  ipAdd + " " + name + " " + score;
				//totalData =  "192.232.123.678 asdfghj 1999" //for testing
				console.log("the machine will print" + totalData)

				console.log("text to SVG")

				const svgData = textToSVG.getD(totalData, options);
				console.log("text to SVG done")

				/*rotate the svg image and save*/
				var transformed = svgpath(svgData).rotate(270, 0, 0).scale(-0.055, 0.055).translate(0,0).toString(); //modify the size and direction of gcode
				path = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><path fill= \"none\" stroke=\"black\" stroke-width=\"0\" d=\"" + transformed + "\"/></svg>";
				// console.log(path);

			},100)

		},100)

	},10)



}

function senderPart(){
		Fiber(function(){
		fs.writeFile("./test.svg", path, function(){
			console.log("SVG Saved");
			const gcode = svgcode()
			.loadFile(__dirname + "/test.svg")
			.generateGcode();

			/*conver the svg to gcode file and save*/
			var gcodeData = gcode.gCode;
			var newStart = 5
			var resetPos = 0 - newStart*(PosCounter-1)
   			// console.log('newStart' + newStart)
	   		var gcodeString = "G1 F1200\nG21\nM05 G4 P0.5 S0\n"; // for servo version 
			// var gcodeString = "G1 F1500\nG21\nM3 S1000\n";
			// var zVal = -1; // comment out on servo version
			var gcodeEnding = " "

			/*need to check the part belowwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww*/
			if (PosCounter < PosLimit){
   				gcodeEnding = "G0 X" + newStart + " " + "Y0\n"// servo version
   				// gcodeEnding = "M3 0\nG0 X" + newStart + " " + "Y0\n"
   				console.log('reach the end')
   			} else{
   				gcodeEnding = "G0 X" +resetPos + " " + "Y0\n"
   				// gcodeEnding = "M3 0\nG0 X10 Y0\n"
    			PosCounter = 1
    			console.log('far from the end')
    		}
    			/**/


    		for(var i=0; i<gcodeData.length; i++){
    			/*UNCOMMENT TO CHANGE THE VALUE OF Z*/
    			var g = gcodeData[i].includes("G1");
    			var n = gcodeData[i].includes("Z");
    			var gStart = gcodeData[i].includes("G9")
    			var f = gcodeData[i].includes("G0") // new for servo version
    			var u = gcodeData[i].includes("Z0")
    			var o = gcodeData[i].includes("X")
    			var d = gcodeData[i].includes("Z-10")
    			var substring = "";
    			var splitSubs;
    			if(g && o){
    				splitSubs = gcodeData[i].split("Z");
       				//console.log(splitSubs[1]);
       				gcodeString += splitSubs[0] +"\n";//set F to change the feed speed
       				//gcodeString += splitSubs[0] + "Z" + zVal + " " + "F150" +"\n";//(3 stepper versionset F to change the feed speed
       			}else if(g && d){
       				splitSubs = gcodeData[i].split("G");
    				gcodeString += splitSubs[0] + "M03 G4 P0.1 S100" + "\n" // servo down

    			}else if(f && u){
					splitSubs = gcodeData[i].split("G");
   					gcodeString += splitSubs[0] + "M05 G4 P0.1 S0" + "\n" // servo up

    			}else if(gStart){
    				splitSubs = gcodeData[i].split("9")
   					gcodeString+= splitSubs[0]+ "92 X0 Y0" + "\n" // for serbo version
       					// gcodeString+= splitSubs[0]+ "92 X0 Y0 Z0" + "\n" //G92 sets current position as new zero

       			}else{
       				gcodeString += gcodeData[i]+"\n";
       			}
					//gcodeString += gcodeData[i]+"\n"; //COMMENT WHEN CHANGING VALUE OF Z
			}
			gcodeString = gcodeString + gcodeEnding;

			console.log('PosCounter'+PosCounter)



				//console.log(gcodeString);
			fs.writeFile("./test.nc", gcodeString, function(){
				console.log("GCODE Saved");
			});
		});

		senderholder(300)

		GcodeSender(function(){
//			socket.emit('status','F');
    	}); // take advantage of return to excute F after gcode sender

	}).run()
	return('finish')

}

/*fiber to block Gcodesender excutes after new Gcode has been saved*/
function senderholder(ms){	
	var fiber = Fiber.current
	setTimeout(function(){
		fiber.run()
	},ms)
	Fiber.yield()
}

/*checking the state of grbl, if true (get 'ok')then send another land of gcode*/
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

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

/*gcode sender*/
function GcodeSender(callback){
  console.log('in GcodeSender now')
  portSpindle.write("1\n")
  console.log('on') //spindle on
  var lr = new LineByLineReader('test.nc', {skipEmptyLines: true}),
    row = 0
  lr.on('error', function(err){
    throw err
  })

  lr.on('open', function(){
    console.log('gcode file is opened')
  })

  lr.on('line',function(line){
    console.log(line)
    portCNC.write(line + '\n')
    lr.pause()

    SerialState()
    if (serialState){
      setTimeout(function(){
        lr.resume()
      },450)
    }
  });

  lr.on('end',function(){
//    port.write("$H\n\r")
    PosCounter += 1
    console.log('gcode file all line sent');
    portSpindle.write("2\n")
    callback();
  })
  return ('finish')
}

/*grbl configuration*/
function ConfigSender(){
  console.log('configing the GRBL now')
  var lr = new LineByLineReader('GrblConfig.txt', {skipEmptyLines: true}),
    row = 0
  lr.on('error', function(err){
    throw err
  })

  lr.on('open', function(){
    console.log('gcode file is opened')
  })

  lr.on('line',function(line){
    console.log(line)
    portCNC.write(line + '\n')
    lr.pause()

    SerialState()
    if (serialState){
      setTimeout(function(){
        lr.resume()
      },50)
    }
  });

  lr.on('end',function(){
    console.log('config done')
  })
  return ('finish')
}

