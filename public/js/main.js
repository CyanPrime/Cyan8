// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
	// Great success! All the File APIs are supported.
} else {
	alert('The File APIs are not fully supported in this browser.');
}

var customKeyMap = false;
var curGameKeys;
var gameName = "unknown";
var game = new Array();

var debug = false;
var printCall = false;
var errorOn0 = false;
var error = false;


var audio = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext);
var audCtx;
var oscillator;
var gain;
var sndMinLen = 0;

if(audio){
	audCtx = new audio();
	gain = audCtx.createGain();
	gain.connect(audCtx.destination);
}

function download(fileName, data) {
	var savElement = document.createElement("a");
	document.body.appendChild(savElement);
	savElement.style = "display: block; height: 100px; width:100px; border: 2px solid #888888;";
	var json = JSON.stringify(data);
	console.log("saved " + json);
	var blob = new Blob([json], {type: "octet/stream"});
	var url = window.URL.createObjectURL(blob);
	savElement.href = url;
	savElement.download = fileName;
	savElement.click();
	//savElement.innerHTML = '<a href="'+url+'">Download ' + filename + '</a>';
	//window.URL.revokeObjectURL(url);
	console.log("saved to " + url);
	
}

function loadJSON(path, success, error)
{
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function()
	{
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (xhr.status === 200) {
				if (success)
					success(JSON.parse(xhr.responseText));
			} else {
				if (error)
					error(xhr);
			}
		}
	};
	xhr.open("GET", path, true);
	xhr.send();
}
	
function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList object.
	var file = files[0];

	//socket.emit('game_bin', file);
	
	gameName = file.name;
	if(gameName.indexOf(".sav") <= 0){
		loadJSON('/json/' + file.name + '.json',
				 function(data) { 
					console.log(data); 
					
					curGameKeys = new Array();
					console.log(data);
					console.log(data.oldBtns); 
					console.log(data.oldBtns.length); 
					
					for(var i = 0; i < data.newBtns.length; i++){
						console.log('curGameKeys[' + parseInt(data.newBtns[i]) + '] = ' + parseInt(data.oldBtns[i]) + ';');
						curGameKeys[parseInt(data.newBtns[i])] = parseInt(data.oldBtns[i]);
					}
					
					document.getElementById("controls").innerHTML = data.desc;
					customKeyMap = true;
				 },
				 function(xhr) { 
					customKeyMap = false;
					document.getElementById("controls").innerHTML = "No custom controls.";
					console.error(xhr); 
				 }
			);
				
			var reader = new FileReader();
			reader.onload = function(e) {
				if(debug) console.log(e.target.result.byteLength);
				game = new Uint8Array(e.target.result);
				
				if(socket !== 'undefined'){}
					socket.emit('game_bin', new Uint8Array(e.target.result));
				}
				startEmu();
			};

			reader.onerror = function(e) {
				console.log(e);
			};
			reader.readAsArrayBuffer(file);
		}
		
		else{
			var reader = new FileReader();
			
			reader.onloadend = function(e) {
				//load savestate (.sav file)
				var result = JSON.parse(this.result);
				var savChip = result;

				myChip8.opcode = savChip.opcode;
				myChip8.V = savChip.V;
				myChip8.I = savChip.I;
				myChip8.pc = savChip.pc;
				myChip8.gfx = savChip.gfx;
				myChip8.draw = true;
				myChip8.delay_timer = savChip.delay_timer;
				myChip8.sound_timer = savChip.sound_timer;
				myChip8.stack = savChip.stack;
				myChip8.sp = savChip.sp
				myChip8.draw = savChip.draw;
				myChip8.waitForKey = savChip.waitForKey;
				myChip8.currentKey = savChip.currentKey;
				myChip8.state = savChip.state;

				//load all custom vars
				for (i = 0; i < 0x200; i++) {
					myChip8.memory[i] = savChip.memory[i];
				}
				
				//change anything that isn't default for this savestate.
				for(var i = 0x200; i < savChip.memory.byteLength; ++i){
					//0x200 == 512.
					if(savChip.memory[i] != 0)
						myChip8.memory[i] = savChip.memory[i];
					
					else
						myChip8.memory[i] = game[i];
				}
			};
			
			reader.onerror = function(e) {
				console.log(e);
			};
			
			reader.readAsText(file);
		}
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);


//main
var myChip8 = new chip8();
	
 document.addEventListener("keydown", function(e) {
	if(e.keyCode == 13) error = true;
	if(e.keyCode == 112 /*F1 - Save State*/){
		//save savestate when F1 is pressed.
		var savChip = new chip8();
		savChip = myChip8;
		
		for(var i = 0; i < myChip8.memory.byteLength; ++i){
			if(myChip8.memory[i] != game[i])
				savChip.memory[i] = myChip8.memory[i];
			
			else
				savChip.memory[i] = 0;
		}
		
		download(gameName + ".sav", savChip);
	}
	else{
		if(customKeyMap){
			if(curGameKeys[e.keyCode] != undefined){
				if(debug) console.log("down cust: " + curGameKeys[e.keyCode] + " || " + e.keyCode);
				myChip8.key[myChip8.keyMap[curGameKeys[e.keyCode]]] = true;
				myChip8.currentKey = myChip8.keyMap[curGameKeys[e.keyCode]];
			}
			
			else{
				if(debug) console.log("down cust: unknown key");
				myChip8.key[myChip8.keyMap[e.keyCode]] = true;
				myChip8.currentKey = myChip8.keyMap[e.keyCode];
			}
		}
		
		else{
			if(debug) console.log("down normal");
			myChip8.key[myChip8.keyMap[e.keyCode]] = true;
			myChip8.currentKey = myChip8.keyMap[e.keyCode];
		}
	}
});
	
document.addEventListener("keyup", function(e) {
	if(customKeyMap){
		if(curGameKeys[e.keyCode] != undefined) myChip8.key[myChip8.keyMap[curGameKeys[e.keyCode]]] = false;
		else myChip8.key[myChip8.keyMap[e.keyCode]] = false;
	}
	else myChip8.key[myChip8.keyMap[e.keyCode]] = false;
	myChip8.currentKey = false;
});
	
var startEmu = function(){
	
	myChip8.reset(); //(?)
	myChip8.loadGame(game);
	
	setInterval(function(){ mainLoop() }, (1000/60)/30);
}

var mainLoop = function(){
	if(!error){
		myChip8.cycle();
		
		if(myChip8.playSound){
			playSnd(1000);
			sndMinLen = 3;
		}
		else{
			if(sndMinLen <= 0) stopSnd()
			else sndMinLen--;
		}
		
		if(myChip8.draw)
			drawGraphics();
	}
}

var c = document.getElementById("screen");
var ctx = c.getContext("2d");

var drawGraphics = function(){
	ctx.fillStyle = "#222222";
	ctx.fillRect(0,0,640,480);
	
	ctx.fillStyle = "#444444";
	for(var x = 0; x < 64; x++){
		for(var y = 0; y < 32; y++){
			if(myChip8.gfx[x + (y * 64)])
				ctx.fillRect(x * 10,y * 10,10,10);
		}
	}
	
	this.draw = false;
}

var playSnd = function(frequency) {
	if (audCtx && !oscillator) {
		oscillator = audCtx.createOscillator();
		oscillator.frequency.value = frequency || 440;
		oscillator.type = oscillator.SQUARE;
		oscillator.connect(gain);
		oscillator.start(0);
	}
}

var stopSnd = function() {
	if (oscillator) {
		oscillator.stop(0);
		oscillator.disconnect(0);
		oscillator = null;
	}
}