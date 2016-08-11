/***************************************************
              CHIP8.js
***************************************************/

class Chip8 {
	constructor(){
		this.debug = false;
		this.printCall = false;
		this.error = false;
		this.errorOn0 = false;
		this.reset();
	}
	
	reset(){
		this.opcode = 0; //two bytes long
		
		var memory = new ArrayBuffer(0x1000); 
		this.memory = new Uint8Array(memory);
		
		// Reset memory.
		for (i = 0; i < this.memory.length; i++) {
			this.memory[i] = 0;
		}
			
		this.chip8_fontset = 
		[
		  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
		  0x20, 0x60, 0x20, 0x20, 0x70, // 1
		  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
		  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
		  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
		  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
		  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
		  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
		  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
		  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
		  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
		  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
		  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
		  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
		  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
		  0xF0, 0x80, 0xF0, 0x80, 0x80  // F
		];
		
		for (i = 0; i < this.chip8_fontset.length; i++) {
			this.memory[i] = this.chip8_fontset[i];
		}
		
		this.V = new Array(16);
		
		for(var i = 0; i < this.V.length; i++){
			this.V[i] = 0;
		}
		
		//0x000 to 0xFFF
		this.I = 0; // two bytes long(?)
		this.pc = 0x200; // two bytes long(?)
		if(this.debug) console.log("pc: " + this.pc);
		//total of 2048 
		this.gfx = new Array(64 * 32);
		
		for(var x = 0; x < 64; x++){
			for(var y = 0; y < 32; y++){
				this.gfx[(y * 64) + x] = 0;
			}
		}
		
		this.delay_timer = 0; // 1 byte long(?)
		this.sound_timer = 0; // 1 byte long(?)
		
		this.stack = new Array(16); // 2 bytes long(?) - ushort
		this.sp = 0; // 2 bytes long(?) - ushort
		
		this.key = new Array(16); // 1 bytes long(?) - uchar
		
		for(var i = 0; i < 16; ++i){
			this.key[i] = false;
		}

		this.draw = false;
		this.waitForKey = false;
		this.keyPress = false;
		
		this.keyMap = {
		49: 0x1, // 1
		50: 0x2, // 2
		51: 0x3, // 3
		52: 0x4, // 4
		81: 0x5, // Q
		87: 0x6, // W
		69: 0x7, // E
		82: 0x8, // R
		65: 0x9, // A
		83: 0xA, // S
		68: 0xB, // D
		70: 0xC, // F
		90: 0xD, // Z
		88: 0xE, // X
		67: 0xF, // C
		86: 0x10 // V
		};
		this.currentKey = false;
		
		this.state = 0;
		
		this.playSound = false;
	}
	
	loadGame(myGame){
		console.log("loading game: " + myGame.byteLength);
	
		var myGameArray = new Uint8Array(myGame);
		
		for(var i = 0; i < myGame.byteLength; ++i){
			//0x200 == 512.
			this.memory[i + 0x200] = myGameArray[i];
		}
	}
	
	cycle(){
		//console.log("cycle");
		
		// Fetch Opcode
		this.opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1];
		var x = (this.opcode & 0x0F00) >> 8;
		var y = (this.opcode & 0x00F0) >> 4;
		
		 if(this.sound_timer > 0) this.playSound = true;
		 else this.playSound = false;
		// Update timers
		if(this.delay_timer > 0) this.delay_timer--;
		if(this.sound_timer > 0) this.sound_timer--;
		
		//console.log("this.pc: " + this.pc);
		
		//console.log("decode opcode: " + this.opcode);
		
		// Decode Opcode
		switch(this.opcode & 0xF000){
			case 0x0000:
				switch(this.opcode & 0x00FF)
				{ 
					case 0x00E0: // 0x00E0: Clears the screen 
						if(this.printCall) console.log("00E0: clear the screen");
						for(var x = 0; x < 64; x++){
							for(var y = 0; y < 32; y++){
								this.gfx[(y * 64) + x] = 0;
							}
						}
						this.draw = true;
					break;
				 
					case 0x00EE: // 0x00EE: Returns from subroutine 
						if(this.printCall) console.log("00EE: Returns from subroutine");

						if(this.debug) console.log("this.pc: " + this.pc);
						if(this.debug) console.log("this.stack[this.sp]: " + this.stack[this.sp]);
						this.pc = this.stack[this.sp];
						if(this.debug) console.log("this.pc: " + this.pc);
						
						if(this.debug) console.log("this.sp;1: " + this.sp);						 
						this.sp--;
						if(this.debug) console.log("this.sp;2: " + this.sp);
					break;
			 
					default:
						if(this.errorOn0){
							console.log("Unknown opcode: " + this.opcode.toString(16));
							this.error = true;
						}
					break;				
				}
			break;
			 // JP addr
			// 1nnnn
			// Jump to location nnn
			case 0x1000:
				if(this.printCall) console.log("1000: jump to addr = " + (this.opcode & 0x0FFF));
				if(this.debug) console.log("jump to addr: " + (this.opcode & 0x0FFF));	
				this.pc = this.opcode & 0x0FFF;
				this.state = 0;
			break;

			case 0x2000:
				if(this.printCall) console.log("2000: Calls subroutine at = " + (this.opcode & 0x0FFF));
				if(this.debug) console.log("Calls subroutine at: " + (this.opcode & 0x0FFF));	
				if(this.debug) console.log("full code: " + this.opcode.toString(16));
				
				if(this.debug) console.log("this.sp;1: " + this.sp);
				this.sp++;
				if(this.debug) console.log("this.sp;2: " + this.sp);
				
				if(this.debug) console.log("this.stack[this.sp]: " + this.stack[this.sp]);
				this.stack[this.sp] = this.pc;
				if(this.debug) console.log("this.stack[this.sp]2: " + this.stack[this.sp]);
				
				if(this.debug) console.log("this.pc1: " + this.pc);
				this.pc = this.opcode & 0x0FFF;
				if(this.debug) console.log("this.pc2: " + this.pc);
				
				this.state = 0;
			break;
			
			case 0x3000: // 0x3XNN: Skips the next instruction if VX equals NN
				if(this.printCall) console.log("0XNN - skip if equal: " + this.V[x] + " = " + (this.opcode & 0x00FF));
				if(this.V[x] == (this.opcode & 0x00FF))
					this.state = 2;
			break;
			
			case 0x4000: // 0x4XNN: Skips the next instruction if VX doesn't equals NN
				if(this.printCall) console.log("4XNN - skip if not equal: " + this.V[x] + " = " + (this.opcode & 0x00FF));
				if(this.V[x] != (this.opcode & 0x00FF))
					this.state = 2;
			break;
			
			case 0x5000: // 0x5XNN: Skips the next instruction if VX equals VY
				if(this.printCall) console.log("5XNN - skip if equal: " + this.V[x] + " = " + this.V[y]);
				if(this.V[x] == this.V[y])
					this.state = 2;
			break;
			
			//6XNN
			//V[X] = NN;
			case 0x6000:
				if(this.printCall) console.log("6XNN - set V[X] to NN: this.V[x](" + this.V[x] + ") = " + (this.opcode & 0x00FF));
				if(this.debug) console.log("call opcode: 6XNN");
				if(this.debug) console.log("full opcode: " + this.opcode.toString(16));
				if(this.debug) console.log("this.V[x] =" + this.V[x] );
				if(this.debug) console.log("(this.opcode & 0x00FF) =" + (this.opcode & 0x00FF) );
				if(this.debug) console.log("(this.opcode & 0x00FF) 16 =" + (this.opcode & 0x00FF).toString(16));
				this.V[x] = (this.opcode & 0x00FF);
				if(this.debug) console.log("this.V[x]2 =" + this.V[x] );
			break;
			
			//7XNN
			//Adds NN to VX.
			case 0x7000:
				var val =  this.V[x] + (this.opcode & 0x00FF);
				
				if (val > 255) {
					val -= 256;
				}
				if(this.printCall) console.log("7XNN -  V[X] += NN: this.V[x](" + this.V[x] + ") = " + val);
				this.V[x] = val;
			break;
			
			
			
			case 0x8000:
				switch((this.opcode & 0x000f)){
					//8XY0
					//Sets VX to the value of VY.
					case 0x0000:
						if(this.printCall) console.log("8XY0 - Set VX to VY");
						this.V[x] = this.V[y];
					break;
					
					//8XY1
					//Sets VX to VX OR VY.
					case 0x0001:
						if(this.printCall) console.log("8XY1 - Set VX to VX OR VY");
						this.V[x] |= this.V[y];
					break;
					
					//8XY2
					//Sets VX to VX AND VY.
					case 0x0002:
						if(this.printCall) console.log("8XY2 - Set VX to VX AND VY");
						this.V[x] &= this.V[y];
					break;
					
					//8XY3
					//Sets VX to VX XOR VY.
					case 0x0003:
						if(this.printCall) console.log("8XY3 - Set VX to VX XOR VY");
						this.V[x] ^= this.V[y];
					break;
					
					//8XY4
					//Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
					case 0x0004:
						if(this.printCall) console.log("8XY4 - Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.");
						var sum = this.V[x] + this.V[y];
						if(sum > 0xFF){
							this.V[0xF] = 0;
							sum -= 256; //needs to be here
						}
						else
							this.V[0xF] = 1;
						
						this.V[x]  = sum;
					break;
					
					//8XY5
					//VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
					case 0x0005:
						if(this.printCall) console.log("8XY5 - VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.");
						if(this.V[x] > this.V[y])
							this.V[0xF] = 1; // there's a borrow.
						else
							this.V[0xF] = 0;
						
						this.V[x] -= this.V[y];
					break;
					
					//8XY6
					//Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift.
					case 0x0006:
						if(this.printCall) console.log("8XY6 - Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift.");
						this.V[0xF] = this.V[x] & 0x1;
						this.V[x] >>= 1;
					break;
					
					//8XY7
					// 	Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
					case 0x0007:
						if(this.printCall) console.log("8XY7 - Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't.");
						if(this.V[y] > this.V[x])
							this.V[0xF] = 0; // there's a borrow.
						else
							this.V[0xF] = 1;
						
						this.V[x] = this.V[y] - this.V[x];
						if(this.V[x] < 0) this.V[x] == 256;
					break;
					
					//8XYE
					//Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift.
					case 0x000E:
						if(this.printCall) console.log("8XYE - Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift.");
						this.V[0xF] = +( this.V[x] & 0x80);
						this.V[x] <<= 1;
						if(this.V[x] > 255) this.V[x] -= 256;
					break;
					
					default:
						console.log("Unknown opcode: " + this.opcode.toString(16));
					break;
				}
			break;
			
			case 0x9000: // 9XY0:  Skips the next instruction if VX doesn't equal VY.
				if(this.printCall) console.log("9XY0 - Skips the next instruction if VX(" + this.V[x] + ") doesn't equal VY(" + this.V[y] + ").");
						
				if(this.V[x] != this.V[y])
					this.state = 2;
			break;
			
			//ANNN
			//I = NNN;
			case 0xA000:// Execute Opcode
				if(this.printCall) console.log("ANNN - I(" + this.I + ") = NNN(" + (this.opcode & 0xFFF) + ").");
						
				if(this.debug) console.log("set I to: " + (this.opcode & 0xFFF));	
				this.I = (this.opcode & 0xFFF);
			break;
			
			case 0xB000: // BNNN: Jumps to the address NNN plus V0
				if(this.printCall) console.log("BNNN - PC(" + this.pc + ") = NNN(" + (this.opcode & 0xFFF) + ") + V[0]("+this.V[0]+").");
				this.pc = (this.opcode & 0x0FFF) + this.V[0];
			break;
			
			case 0xC000: // CXNN: Sets VX to a random number and NN
				if(this.printCall) console.log("CXNN - Sets V(" + this.pc + ") = Random +  NN(" + (this.opcode & 0xFFF) + ").");
				
				this.V[x] = Math.floor(Math.random()*0xFF) & (this.opcode & 0x00FF);
			break;
			
			case 0xD000:
				if(this.printCall) console.log("DXYN - Draw screen.");
				if(this.debug) console.log("call opcode 0xDXYN");
				if(this.debug) console.log("full opcode: " + this.opcode.toString(16));	
				var dx = this.V[x];
				var dy = this.V[y];
				var height = (this.opcode & 0x000F);
				var pixel;
				
				this.V[0xF] = 0;
				for(var yLine = 0; yLine < height; yLine++){
					pixel = this.memory[this.I + yLine];
					for(var xLine = 0; xLine < 8; xLine++){
						if((pixel & (0x80 >> xLine)) != 0){
							var px = dx + xLine;
							var py = dy + yLine;
							
							if(py >= 64){
								py-= 64;
							}
							if(py < 0){
								py += 64;
							}
							if(py >= 32){
								py-= 32;
							}
							if(py < 0){
								py += 32;
							}
							
							if(this.gfx[px + (py * 64)] == 1){
								//for collision detection (hit this pixel)
								this.V[0xF] = 1;
							}
							
							this.gfx[px + (py * 64)] ^= 1;
						}
					}
				}
				
				this.draw = true;
			break;
			
			case 0xE000:
				switch((this.opcode & 0x00FF)){
					//EX9E
					//Skips the next instruction if the key stored in VX is pressed.
					case 0x009E:
						if(this.printCall) console.log("EX9E +" + this.key[this.V[x]]);
					
						if(this.key[this.V[x]] > 0)
							this.state = 2;
					break;
					
					//EXA1
					//Skips the next instruction if the key stored in VX isn't pressed.
					case 0x00A1:
						if(this.printCall) console.log("EXA1: key = " + this.key[this.V[x]]);
						if(this.key[this.V[x]] == 0){
							if(this.debug) console.log("key in VX not pressed. Skip");
							this.state = 2;
						}
						else{
							if(this.debug) console.log("key in VX pressed. No Skip");
						}
					break;
					
					default:
						console.log("Unknown opcode: " + this.opcode.toString(16));
					break;
				}
			break;
			
			case 0xF000:
				switch(this.opcode & 0x00FF){
					
					//FX07
					//Sets VX to the value of the delay timer.
					case 0x0007:
						if(this.printCall) console.log("FX07 - Sets VX to the value of the delay timer.");
						this.V[x] = this.delay_timer;
					break;
					
					case 0x000A: // FX0A: A key press is awaited, and then stored in VX		
					{
						console.log("FX0A - await key press.");
						if(!this.currentKey){
							return;
						}else{
							if(this.debug) console.write("this.currentKey = " + this.currentKey);
							this.key[this.V[x]] = this.currentKey;
						}
						
											
					}
					break;
					
					case 0x0015:
						if(this.printCall) console.log("FX15 - delay timer equals VX.");
						this.delay_timer = this.V[x];
					break;
					
					case 0x0018:
						if(this.printCall) console.log("FX18 - sound timer equals VX.");
						this.sound_timer = this.V[x];
					break;
					
					case 0x001E: // FX1E: Adds VX to I
						if(this.printCall) console.log("FX1E: Adds VX to I");
						//start possible this.error
						/*if(this.I + this.V[x] > 0xFFF)	// VF is set to 1 when range overflow (I+VX>0xFFF), and 0 when there isn't.
							this.V[0xF] = 1;
						else
							this.V[0xF] = 0;*/
						//end
						this.I += this.V[x];
					break;

					case 0x0029: // FX29: Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font
						if(this.printCall) console.log("FX29: Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font");
						this.I = this.V[x] * 0x5;
					break;

					case 0x0033: // FX33: Stores the Binary-coded decimal representation of VX at the addresses I, I plus 1, and I plus 2
						if(this.printCall) console.log("FX33: Stores the Binary-coded decimal representation of VX at the addresses I, I plus 1, and I plus 2");
						this.memory[this.I]     = parseInt(this.V[x] / 100);
						this.memory[this.I + 1] = parseInt(this.V[x] % 100 / 10);
						this.memory[this.I + 2] = parseInt(this.V[x] % 10);
					break;

					case 0x0055: // FX55: Stores V0 to VX in memory starting at address I
						if(this.printCall) console.log("FX55: Stores V0 to VX in memory starting at address I");
						for (var i = 0; i <= x; ++i)
							this.memory[this.I + i] = this.V[i];	

						// On the original interpreter, when the operation is done, I = I + X + 1.
						//this.I += (x + 1);
					break;
					
					case 0x0065: // FX65: Fills V0 to VX with values from memory starting at address I	
						if(this.printCall) console.log("FX65: Fills V0 to VX with values from memory starting at address I");
						for (var i = 0; i <= x; ++i)
							this.V[i] = this.memory[this.I + i];			

						// On the original interpreter, when the operation is done, I = I + X + 1.
						//this.I += (x + 1);
					break;
					
					default:
						console.log("Unknown opcode: " + this.opcode.toString(16));
					break;
				}
			break;
			
			default:
				console.log("Unknown opcode: " + this.opcode.toString(16));
			break;
		}
		
		this.pc += (2 * this.state);
		this.state = 1;
	}
} 

module.exports = new Chip8();

/***************************************************
              /CHIP8.js
***************************************************/