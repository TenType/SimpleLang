import SimpleLang from './SimpleLang';
import readline from 'readline';

const input: string[] = [];

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

console.log('** Input code below - Exit the command line (^C) to run when ready **');
rl.prompt();

rl.on('line', cmd => {
	input.push(cmd);
});

rl.on('close', () => {
	const program = new SimpleLang();
	try {
		const output = program.init(input.join('\n'));
		if (output) {
			console.log(String(output));
		} else {
			console.log('No output');
		}
	} catch (error) {
		console.log(error);
	}
	rl.close();
});