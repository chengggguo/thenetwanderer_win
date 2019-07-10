var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var svgpath = require('svgpath');
const svgcode = require("svgcode");
const TextToSVG = require('text-to-svg');

const textToSVG = TextToSVG.loadSync('./fonts/simplex.ttf');
const attributes = {fill: 'none', stroke: 'black'};
const options = {x: 0, y: 0, fontSize: 72, anchor: 'top', attributes: attributes};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('cnc', function(data){
  	console.log("CNC printing: ");
  	console.log(data);
  	// console.log(data.ip);
  	// console.log(data.name);
  	// console.log(data.score);
  	socket.emit('status', "P");//P for printing, F for finished
  	const svgData = textToSVG.getD(data, options);

  	var transformed = svgpath(svgData).rotate(90, 0, 0).scale(-0.06, 0.06).translate(0,0).toString();
  	var path = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><path fill= \"none\" stroke=\"black\" stroke-width=\"0.1\" d=\"" + transformed + "\"/></svg>";
	//console.log(path);
	fs.writeFile("./test.svg", path, function(){
  		console.log("SVG Saved");
  		const gcode = svgcode()
			.loadFile(__dirname + "/test.svg")
			.generateGcode();

		var gcodeData = gcode.gCode;
		var gcodeString = "G1 F3000\nG1 X0 Y0\nM3 S1000\n";
		var zVal = 0;
		for(var i=0; i<gcodeData.length; i++){
			/*UNCOMMENT TO CHANGE THE VALUE OF Z*/
			var g = gcodeData[i].includes("G1");
			var n = gcodeData[i].includes("Z");
			var substring = "";
			var splitSubs;
			if(g && n){
				splitSubs = gcodeData[i].split("Z");
				//console.log(splitSubs[1]);
				gcodeString += splitSubs[0] + "Z" + zVal + "\n";
			}else{
				gcodeString += gcodeData[i]+"\n";
			}
			//gcodeString += gcodeData[i]+"\n"; //COMMENT WHEN CHANGING VALUE OF Z
		}

		//console.log(gcodeString);
		fs.writeFile("./test.nc", gcodeString, function(){
  			console.log("GCODE Saved");
  		});
  	});

  	//Test for a timeout to send data to the browser after 10 secs
  	setTimeout(function(){
  		socket.emit('status', "F");
  	},10000);
  
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});