#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const net = require('net');
const port = 1337;
const host = '127.0.0.1';

const args = process.argv;
// const args = ['','','D:/jsx/hello.jsx']

if ((args[2]=='--watch' && args[3]) || args[2]) {
	const myPath = path.resolve(args[3] || args[2] || Null).replace(/\\/g, '\\\\');
	
	// console.log(myPath.replace(/\\/g, '\\\\'));

	function lint(file) {
		let messages = linter.verify(file, {
			    rules: {
			        semi: 2
			    }
			});
		if (messages[0]) {
				console.log('Error at line [ ' + messages[0].line + ' ]:' + messages[0].message.split(':')[1]);
		} else {
			return true;
		}
	}

	function execScript(path) {
		let myFile = fs.readFileSync(path, 'utf8');
		if (true) {
			let buffered = '';
			const client = new net.Socket();
			client.connect(port, host, function() {
				client.write(path);
			});

			client.on('data', function(data) {
				buffered += data;
				msgSplit();
			});

			client.on('error', function(err) {
				console.log(err);
			});

			client.on('close', function() {
			});

			function msgSplit() {
				var rec = buffered.split('\0');

				while(rec.length > 1) {
					if(rec[0] == '###End###') {
						client.destroy();
						return true;
					}
					console.log(rec[0]);
					buffered = rec.slice(1).join('\0');
					rec = buffered.split('\0');
				}
			}
		} else {
			return false;
		}
	}

	if (args[2] =='--watch' && myPath) {
		var chokidar = require('chokidar');
		chokidar.watch(myPath).on('change', function (event, path) {
			execScript(myPath);
		});

	} else if (myPath) {
		execScript(myPath);
	}
} else {
	console.log('Need minimum one argument - [ file path ]');
}