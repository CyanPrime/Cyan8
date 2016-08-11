var customKeyMap = false;
var curGameKeys;
var gameName = "unknown";
var game = new Array();

var debug = true;
var chat = new Chat();

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
	
	//needed for touch controls to work.
	this.touchPos = [0,0];
	
	var setupTouchControls = function(me){
		$(document).off('touchstart touchmove touchend');
		
		$(document).on('touchstart touchmove touchend',function(e){		
			//prevent chrome on android from calling events we don't want.
			e.preventDefault();
			e.stopImmediatePropagation();
			
			//if(playerNum == -1) socket.emit('be_player', 1337);
			
			//get fingers touching screen
			var touches = e.originalEvent.touches;

			var btnNum = 0;
			
			var keyCodes = [38,40];
			
			//go through the buttons and see what ones we're on.
			$('.btn').each(function() {
				
				//are we in the element? start as no.
				var inElem = false;
				
				//check if any fingers are touching the element.
				for(var i = 0; i < touches.length; i++){
					var touch = touches[i];
					
					//draw x and y to screen
					me.touchPos[0] = touch.pageX;
					me.touchPos[1] = touch.pageY;
					
					// check if is inside boundaries
					if(touch.pageX >= $(this).offset().left && touch.pageX <= $(this).offset().left + $(this).outerWidth() && 
					touch.pageY >= $(this).offset().top  && touch.pageY <= $(this).offset().top + $(this).outerHeight()) {
						inElem = true;
					}
				}
				
				//we're in the button
				if(inElem === true){
					$(this).addClass("btnpressed");  
					socket.emit('keydown', curGameKeys[keyCodes[btnNum]]);
					
				}
				
				//we're not in the button
				else { 
					$(this).removeClass("btnpressed");  
					socket.emit('keyup', curGameKeys[keyCodes[btnNum]]);
				}
				
				//increment the btnNum that controls what key does what.
				btnNum++;
			});
		});
	};

	document.addEventListener("keydown", function(e) {
		if(chat.chat_mode){
			if(e.keyCode == 32 /* space */) chat.addSpaceToChat();
			if(e.keyCode == 8 /* backspace */) chat.backspace();
			if(e.keyCode == 13 /* enter */) chat.sendChat(socket, "player" + playerNum);
			else{
				chat.addToChat(e.keyCode);
			}
		}
		
		else{
			if(e.keyCode == 84 /* t */ && playerNum != -1) chat.chat_mode = true;
			
			if(customKeyMap){
				if(curGameKeys[e.keyCode] != undefined){
					//if(debug) console.log("down cust: " + curGameKeys[e.keyCode] + " || " + e.keyCode);
					socket.emit('keydown', curGameKeys[e.keyCode]);
				}
			}
		}
	});
		
	document.addEventListener("keyup", function(e) {
		if(!chat.chat_mode){
			if(customKeyMap){
				if(curGameKeys[e.keyCode] != undefined){
					socket.emit('keyup', curGameKeys[e.keyCode]);
				}
			}
		}
	});

	setupTouchControls(this);
	
	var c = document.getElementById("screen");
	var ctx = c.getContext("2d");

	var drawGraphics = function(scrArr){
		//console.log("drawing screen");
		var pixel_size = 10;
		ctx.fillStyle = "#222222";
		ctx.fillRect(0,0,640,480);
		
		ctx.fillStyle = "#ffffff";
		for(var x = 0; x < 64; x++){
			for(var y = 0; y < 32; y++){
				if(scrArr[y][x] == 1)
					ctx.fillRect(x * pixel_size,y * pixel_size, pixel_size, pixel_size);
			}
		}
		
		ctx.fillStyle = "#ffff00";
		ctx.fillText(chat.text, 10, 310);
		
		for(var i = 0; i <= 5; i++){
			if(chat.log[(chat.log.length - 1) - i] !== undefined){
				var num = (chat.log.length - 6);
				if(num <= 0) num = 0;
				ctx.fillText(chat.log[num + i], 10, 10 + (10 * i));
			}
		}
	}


	$('form').submit(function(){
		socket.emit('be_player', 1337);
		return false;
	});
	
	$('button').on('touchend',function(e){	
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
	
	socket.on('chat', function(msg){
		chat.log.push(msg);
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