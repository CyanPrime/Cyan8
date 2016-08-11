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

$( document ).ready(function() {
	var socket = io();
	$('form').submit(function(){
		socket.emit('chat message', $('#m').val());
		$('#m').val('');
		return false;
	});

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
				socket.emit('game_bin', {name: gameName, payload: e.target.result });
			};

			reader.onerror = function(e) {
				console.log(e);
			};
			reader.readAsArrayBuffer(file);
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
});