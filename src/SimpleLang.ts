export default class SimpleLang {
	memory: Map<string, number | string> = new Map();
	memoryLimit = 100;
	operationLimit = 100;
	cache = '<Cache: undefined>';
	pointMap: Map<string, number> = new Map();
	nestMap: Map<number, number> = new Map();
	nests = ['if', 'else', 'elif', 'endif'];

	init(input: string) {
		const code = this.format(input);
		this.mapData(code);
		return this.run(code);
	}

	format(input: string) {
		const comments = /(?<!\\)(?:\\\\)*(\/\*(.+)\*\/)/g;
		if (comments.test(input)) {
			input = input.replaceAll(comments, '');
		}
		const code = input.split(';');
		// console.log(code);
		code[0] = code[0].replace('```', '');
		code.pop();
		code.forEach(function(item, index, code) {
			while (item.substring(0, 2) == '\n') {
				item = item.substring(2);
			}
			item = item.trim().replaceAll('\\n', '\n');
			if (item != '') code[index] = item;
		});
		// console.log(code);
		return code;
	}

	private mapData(code: string[]) {
		// let nestID = 0;
		// const trackNests: number[][] = [];
		for (let i = 0; i < code.length; i++) {
			if (code[i].charAt(0) == '@') {
				if (this.pointMap.has(code[i].substring(1))) {
					throw 'Duplicate points detected';
				}
				this.pointMap.set(code[i].substring(1), i);
			}
			// const codeChunk = code[i].split(' ');
			// if (this.nests.includes(codeChunk[0])) {
			// 	if (codeChunk[0] == 'endif') {
			// 		const nestPlots = trackNests.shift();
			// 		for (let j = 0; j < nestPlots.length; j++) {
			// 			this.nestMap.set(nestPlots[j], i);
			// 		}
			// 	} else if (codeChunk[0] == 'else' || codeChunk[0] == 'elif') {
			// 		trackNests[0].unshift(i);
			// 		// this.nestMap.set(i, trackNests[0]);
			// 	} else {
			// 		trackNests.unshift([i]);
			// 		// trackNests.unshift(nestID);
			// 		// this.nestMap.set(i, nestID);
			// 		// nestID++;
			// 	}
			// }
		}
		// console.log('nestMap', this.nestMap);
	}
	private substitute(value: string) {
		const regexp = /(?<!\\)(?:\\\\)*({(\w+)})/g;
		const references = Array.from(value.matchAll(regexp));

		for (const match of references) {
			if (this.memory.has(match[2])) {
				value = value.replace(match[1], String(this.memory.get(match[2])));
			} else if (match[2] == 'cache') {
				value = value.replace(match[1], String(this.cache));
			} else {
				throw 'Undefined variable reference';
			}
		}
		return value;
	}
	private conditional(codeChunk: string[]) {
		let result = true;
		if (codeChunk.length % 3 != 0) throw 'Bad conditional';
		for (let i = 0; i < codeChunk.length; i += 3) {
			const check1 = this.substitute(codeChunk[i]);
			const check2 = this.substitute(codeChunk[i + 2]);
			switch (codeChunk[i + 1]) {
				case '==':
					result = result && check1 == check2;
					break;

				case '!=':
					result = result && check1 != check2;
					break;

				case '<':
					result = result && check1 < check2;
					break;

				case '>':
					result = result && check1 > check2;
					break;

				case '<=':
					result = result && check1 <= check2;
					break;

				case '>=':
					result = result && check1 >= check2;
					break;

				default:
					throw 'Bad conditional';
			}
		}
		return result;
	}
	run(code: string[]) {
		this.cache = '0';
		let output = '';
		const skipTo: string[] = [];
		let operations = 0;
		// const runUntil: string[] = [];
		if (code.length < 1) {
			throw 'Empty input, make sure each line ends with a semicolon'
		}
		for (let i = 0; i < code.length; i++) {
			if (operations > this.operationLimit) {
				throw 'Operation limit exceeded';
			}
			if (code[i].charAt(0) == '@') {
				continue;
			}
			if (skipTo.length &&
				!code[i].startsWith('else') &&
				!code[i].startsWith('endif') &&
				!code[i].startsWith('if') &&
				!code[i].startsWith('elif')) {
				// console.log('Skipped', code[i], skipTo);
				continue;
			}
			const codeChunk = code[i].split(' ');
			switch (codeChunk[0]) {
				case 'print': {
					try {
						output += this.substitute(codeChunk.slice(1).join(' '));
					} catch (error) {
						// console.error(error);
						throw 'Print error';
					}
					break;
				}


				case 'store': {
					throw 'Deprecated statement: store';
					// try {
					// 	this.memory[codeChunk[1]] = this.substitute(codeChunk.slice(2).join(''));
					// 	// console.log('STORE', this.memory);
					// } catch (error) {
					// 	// console.error(error);
					// 	throw 'Memory called out of range';
					// }
					break;
				}

				case 'num': {
					if (this.memory.size > this.memoryLimit) throw 'Memory limit exceeded';
					const check = this.substitute(codeChunk.slice(2).join(''));
					if (isNaN(+check)) throw 'Value is not a number';
					try {
						this.memory.set(codeChunk[1], +check);
						// console.log('NUM', this.memory);
					} catch (error) {
						// console.error(error);
						throw 'Memory called out of range';
					}
					break;
				}

				case 'str': {
					if (this.memory.size > this.memoryLimit) throw 'Memory limit exceeded';
					try {
						const check = this.substitute(codeChunk.slice(2).join(''));
						this.memory.set(codeChunk[1], String(check));
						// console.log('STR', this.memory);
					} catch (error) {
						// console.error(error);
						throw 'Memory called out of range';
					}
					break;
				}

				case 'add': {
					try {
						let result = 0;
						for (let i = 1; i < codeChunk.length; i++) {
							const addend = this.substitute(codeChunk[i]);
							// if (/#(\d+|cache)/g.test(codeChunk[i])) {
							// 	if (codeChunk[i].slice(1) == 'cache') {
							// 		addend = this.cache;
							// 	} else {
							// 		addend = this.memory[codeChunk[i].slice(1)];
							// 	}
							// } else {
							// 	addend = codeChunk[i];
							// }
							if (isNaN(+addend)) throw 'Must be numbers';
							result += +addend;
						}
						// console.log('ADD', result, String(result));
						this.cache = String(result);
					} catch (error) {
						// console.error(error);
						if (error != 'Must be numbers') throw 'Addition error';
					}
					break;
				}

				case 'if': {
					if (skipTo.length) {
						skipTo.unshift('endif');
						// console.log('IF (skipped)', skipTo);
					} else if (codeChunk.length > 2) {
						if (this.conditional(codeChunk.slice(1))) {
							// console.log('IF: TRUE', skipTo);
						} else {
							// i = this.nestMap.get(i);
							skipTo.unshift('else');
							// console.log('IF: FALSE', skipTo);
						}
					}
					break;
				}

				case 'else': {
					if (skipTo.includes('endif')) {
						// console.log('Skipped else', skipTo);
						continue;
					}
					if (skipTo.includes('else')) {
						skipTo.shift();
					} else {
						skipTo.unshift('endif');
					}
					// console.log('ELSE', skipTo);
					continue;
				}

				case 'elif': {
					if (skipTo.includes('endif')) {
						// console.log('Skipped elif', skipTo);
						continue;
					}
					if (skipTo.includes('else')) {
						if (this.conditional(codeChunk.slice(1))) {
							skipTo.shift();
						}
					} else {
						skipTo.unshift('endif');
					}
					// console.log('ELIF', skipTo);
					continue;
				}

				case 'endif': {
					if (skipTo.length) {
						skipTo.shift();
					}
					// console.log('ENDIF', skipTo);
					continue;
				}

				case 'goto': {
					if (codeChunk[1].startsWith('@')) {
						if (this.pointMap.has(codeChunk[1].slice(1))) {
							// console.log('GOTO', this.pointMap.get(codeChunk[1].slice(1)));
							i = this.pointMap.get(codeChunk[1].slice(1));
						} else {
							throw 'Undefined point';
						}
					} else {
						throw 'Invalid point format';
					}
					break;
				}

				default: {
					// console.log('BAD SYNTAX', codeChunk);
					throw 'Bad syntax';
				}

			}

			operations++;

		}
		console.log('Operations:', operations);
		console.log('Memory:', this.memory.size);
		return output;
	}
}