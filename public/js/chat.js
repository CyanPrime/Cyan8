class Chat{
	constructor(){
		this.chat_mode = false;
		this.text = "";
		this.log = Array();
	}
	
	addToChat(ch){
		var add = false;
		if (
				(ch >= 65 && ch <= 90)  ||
				(ch >= 97 && ch <= 122) /*||
				(ch >= 48 && ch <= 57)  ||*/
				
			){
			  add = true;
		}
		
		if(add) this.text += String.fromCharCode(ch);
	}
	
	addSpaceToChat(){
		this.text += " ";
	}
	
	backspace(){
		this.text = this.text.substr(0, this.text.length - 1);
	}
	
	sendChat(socket, name){
		if(this.text != ""){
			socket.emit('chat', name + ": " + this.text);
			this.text = "";
		}
		this.chat_mode = false;
	}
}