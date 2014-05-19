(function(w, $){
	var TuringRunner = function(){
		this.delay = 10;

		var me = this;
		var machines = [];
		var currentMachine = 0;

		var machineElements = $('[data-program]');

		machineElements.each(function(){
			var el = $(this);
			var name = $(this).data('program');
			$.get(name, function(programText){
				var machine = new TuringMachine(el, name, programText);
				machines.push(machine);
				run.call(me);
			});
		})

		function run(){
			if (machines.length != machineElements.length){
				return;
			}

			machines[currentMachine].exec();
			nextMachine();

			w.setTimeout(function(){
				run.call(me);
			}, this.delay);
		}

		function nextMachine(){
			currentMachine++;
			if (currentMachine >= machines.length){
				currentMachine = 0;
			}
		}
	}

	var TuringMachine = function(domElement, programName, programText){
		this.state = '';
		this.ui = {
			root: $(domElement),
			title: $('<h1>').text(programName)
		};

		this._initProgram(programText);
		this._initUI();
	};

	TuringMachine.prototype = {
		_initProgram: function(programText){
			var i;
			var p = programText
						.replace(/\r\n/gi, '\n')
						.split('\n')
						.filter(function(item){
							return !($.trim(item) === '');
						});
			this.position = p[0];
			this.initialTapeState = p[1].split('');
			this.program = [];

			for(i = 2; i < p.length; i++){
				var line = p[i].split(' ');
				var cmd = {
					state: line[0],
					tapeValue: line[1],
					newTapeValue: line[2],
					direction: line[3],
					newState: line[4]
				}

				this.program.push(cmd);
			}

			this.state = this.program[0].state;
		},

		_initUI: function(){
			this.ui.root.addClass('turing-machine');
			this.ui.title.appendTo(this.ui.root);
			this.tape = new Tape(this.initialTapeState, this.position);
			this.tape.getElement().appendTo(this.ui.root);
		},

		_getCommand: function(state, tapeValue){
			var command = this.program.filter(function(cmd){
				return (cmd.state == state && cmd.tapeValue == tapeValue);
			});

			return command.length ? command[0] : null;
		},

		exec: function(){
			var value = this.tape.read();
			var cmd = this._getCommand(this.state, value);

			if (!cmd){
				return false;
			}

			this.tape.write(cmd.newTapeValue);
			this.tape[cmd.direction == 'R' ? 'moveRight' : 'moveLeft']();
			this.state = cmd.newState;

			this.isReady = true;

			return true;
		}
	};

	var Tape = function(state, position){
		this.state = state;
		this.position = position;
		this.ui = {};

		this._init();
	};

	Tape.prototype = {
		_init: function(){
			var me = this;
			this.ui.root = $('<div>').addClass('tape');
			this.state.forEach(function(item){
				me._createCell(item).appendTo(me.ui.root);
			});

			this.ui.root.children().eq(this.position - 1).addClass('active');
		},

		_createCell: function(value){
			var cell = $('<div>').addClass('cell').html('&nbsp;');
			if (value !== null && typeof value !== 'undefined'){
				cell.text(value).data('value', value);
			}

			return cell;
		},

		_getCurrentCell: function(){
			return this.ui.root.find('.active');
		},

		getElement: function(){
			return this.ui.root;
		},

		read: function(){
			return this._getCurrentCell().data('value');
		},

		write: function(value){
			this._getCurrentCell().data('value', value).text(value);
		},

		moveLeft: function(){
			var currCell = this._getCurrentCell();
			var prevCell = currCell.prev();
			if (!prevCell.length){
				prevCell = this._createCell().prependTo(this.ui.root);
			}
			currCell.removeClass('active');
			prevCell.addClass('active');
		},

		moveRight: function(){
			var currCell = this._getCurrentCell();
			var nextCell = currCell.next();
			if (!nextCell.length){
				nextCell = this._createCell().appendTo(this.ui.root);
			}
			currCell.removeClass('active');
			nextCell.addClass('active');
		}
	};

	w.TuringRunner = TuringRunner;
})(window, jQuery);