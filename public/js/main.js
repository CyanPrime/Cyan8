var customKeyMap = false;
var curGameKeys;
var gameName = "unknown";
var game = new Array();

var debug = true;

//audio currently not working
var audio = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext);
var audCtx;
var oscillator;
var gain;
//audio vars end

var sndMinLen = 0;
var playerNum = -1;

$( document ).ready(function() {
	var socket = io();

	if(audio){
		audCtx = new audio();
		gain = audCtx.createGain();
		gain.connect(audCtx.destination);
	}

	document.addEventListener("keydown", function(e) {
		//if(e.keyCode == 13) error = true;
		if(customKeyMap){
			if(curGameKeys[e.keyCode] != undefined){
				//if(debug) console.log("down cust: " + curGameKeys[e.keyCode] + " || " + e.keyCode);
				socket.emit('keydown', curGameKeys[e.keyCode]);
			}
		}
	});
		
	document.addEventListener("keyup", function(e) {
		if(customKeyMap){
			if(curGameKeys[e.keyCode] != undefined){
				socket.emit('keyup', curGameKeys[e.keyCode]);
			}
		}
	});

	var c = document.getElementById("screen");
	var ctx = c.getContext("2d");

	var drawGraphics = function(scrArr){
		//console.log("drawing screen");
		ctx.fillStyle = "#222222";
		ctx.fillRect(0,0,640,480);
		
		ctx.fillStyle = "#ffffff";
		for(var x = 0; x < 64; x++){
			for(var y = 0; y < 32; y++){
				if(scrArr[y][x] == 1)
					ctx.fillRect(x * 10,y * 10,10,10);
			}
		}
	}


	$('form').submit(function(){
		socket.emit('be_player', 1337);
		return false;
	});

	socket.on('be_player', function(msg){
		if(msg == 'success 1'){
			$("#controls").append('<br />You are player 1');
			$("#play_form").html('');
			playerNum = 1;
		}
		
		if(msg == 'success 2'){
			$("#controls").append('<br />You are player 2');
			$("#play_form").html('');
			playerNum = 2;
		}
		
		if(msg == 'fail: game full'){
			$("#controls").append('<br />Game is full. Try again later.');
		}
		
		console.log(msg);
	});


	var self = this;

	socket.on('game_bin', function(msg){
		console.log(msg.payload.byteLength);
		console.log("game got: " + msg.name);
		for(var i = 0; i < 10; i++){
			console.log("[" + msg.payload[i] + "]");
		}

		//startEmu(msg.name, msg.payload);
	});
				
	socket.on('screenArray', function(msg){
		drawGraphics(msg);
	});

	socket.on('conjson', function(msg){
		var data = msg;

		if(data !== 'undefined'){
		
			curGameKeys = new Array();
			console.log(data);
			
			if(playerNum == 1){
				if(data.oldBtnsP1 !== 'undefined'){
					console.log(data.oldBtnsP1); 
					if(data.oldBtnsP1.length !== 'undefined'){
						console.log(data.oldBtnsP1.length); 
						
						for(var i = 0; i < data.newBtnsP1.length; i++){
							console.log('curGameKeys[' + parseInt(data.newBtnsP1[i]) + '] = ' + parseInt(data.oldBtnsP1[i]) + ';');
							curGameKeys[parseInt(data.newBtnsP1[i])] = parseInt(data.oldBtnsP1[i]);
						}
						
						document.getElementById("controls").innerHTML = data.desc;
						customKeyMap = true;
					}
				}
			}
			
			if(playerNum == 2){
				if(data.oldBtnsP2 !== 'undefined'){
					console.log(data.oldBtnsP2); 
					if(data.oldBtnsP2.length !== 'undefined'){
						console.log(data.oldBtnsP2.length); 
						
						for(var i = 0; i < data.newBtnsP2.length; i++){
							console.log('curGameKeys[' + parseInt(data.newBtnsP2[i]) + '] = ' + parseInt(data.oldBtnsP2[i]) + ';');
							curGameKeys[parseInt(data.newBtnsP2[i])] = parseInt(data.oldBtnsP2[i]);
						}
						
						document.getElementById("controls").innerHTML = data.desc;
						customKeyMap = true;
					}
				}
			}
		}
	});
});