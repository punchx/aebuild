#!/usr/bin/env node
var net = require('net');
var port = 1337;
var host = '127.0.0.1';

var args = process.argv;

if ((args[2]=='--watch' && args[3]) || args[2]) {
	var isWin = process.platform === 'win32';
	if(isWin) {
		var myPath = (args[3] || args[2] || '').replace(/\\/g, '\\\\');
	} else {
		var myPath = args[3] || args[2] || '';
	}

	function execScript(path) {
		var buffered = '';
		var client = new net.Socket();
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