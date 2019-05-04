#!/usr/bin/env node
var net = require('net');
var path = require('path');
var { exec } = require('child_process');
var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
var isWin = process.platform === 'win32';
var fs = require('fs');
var port = 1337;
var host = '127.0.0.1';
var args = process.argv;
var workDir = process.cwd();
var aebuildJsonPath = path.join(workDir, 'aebuild.json');
var existsAebuildFile = fs.existsSync(aebuildJsonPath);
var aebuildJSON;

function setSettings() {
	if (existsAebuildFile) {
		var rawdata = fs.readFileSync(aebuildJsonPath);  
		aebuildJSON = JSON.parse(rawdata);
		port = aebuildJSON.Port;
	}
}


function Init() {

	var defaultObj = {
		ScriptName: "",
		Version: "",
		EntryPoint: "main.jsx",
		Author: "",
		Port: "1337",
		UI: "false",
		Binary: "false"
	};


	var initObject = {};
	var keys = ['ScriptName', 'Version', 'EntryPoint','Author', 'Port', 'UI', 'Binary'];
	var questions = ['Script name: ', 'Version: ', 'Entry Point: ','Author name: ', 'Port: ', 'UI(true/false): ', 'Binary: ', 'Presss any key to continue...'];


	function rlLoop() {
		var i = 0;
		process.stdout.write(questions[i]);
		rl.on('line', function(line) {
			if (i < questions.length -1) {
				if (line.trim() == '') {
					initObject[keys[i]] = defaultObj[keys[i]];
				} else {
					initObject[keys[i]] = line;
				}
				process.stdout.write(questions[i+1]);
			} else {
				rl.close();
			}		
			i++;
		});
	}

	if (existsAebuildFile) {		
		rl.question('File aebuild.json already exitsts. Do you want to rewrite it?Y/N:', function(answer) {
				if (answer.toLowerCase().trim() != 'y') {
					rl.close();
					return;
				}
				rlLoop();
		});
	} else {
		rlLoop();
	}


	rl.on('close', function() {
		var data = JSON.stringify(initObject, null, 2);
		fs.writeFileSync(aebuildJsonPath, data);
		var rawdata = fs.readFileSync(aebuildJsonPath);  
		var aebuildfile = JSON.parse(rawdata);
		console.log(aebuildfile);
		process.exit();
	});

}


setSettings();

if (args[2] == 'init') {
	
	Init();

} else if ((args[2]=='--watch' && args[3]) || args[2] !='--prod') {

	console.log('here');
	var myPath = path.resolve(args[3] || args[2] || '');
	myPath = isWin ? myPath.replace(/\\/g, '\\\\') : myPath;


	function execScript(path) {
		var buffered = '';
		var client = new net.Socket();
		// console.log(port);
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

			while (rec.length > 1) {
				if (rec[0] == '###End###') {
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
} else if (args[2]=='--prod') {
	//read file
	var jsxFileName = aebuildJSON.entryPoint || 'main.jsx';
	var jsxPath = path.resolve(path.join(workDir, jsxFileName));
	jsxPath = isWin ? jsxPath.replace(/\\/g, '\\\\') : jsxPath;

	/*if (aebuildJSON.console && aebuildJSON.console.toLowerCase().trim() == 'remove') {
		//remove console
	} else if (aebuildJSON.console && aebuildJSON.console.toLowerCase().trim() == 'writeLn') {
		//substitute conseol.log with print
	} else if (aebuildJSON.console && aebuildJSON.console.toLowerCase().trim() == 'alert') {
		//substitute conseol.log with alert
	}*/

if (aebuildJSON.Binary && aebuildJSON.Binary.toLowerCase().trim() == 'true') {

		var script = `#target estoolkit#dbg\n\
var f= File("` + jsxPath + `");\n\
f.open("r");\n\
var s = f.read();\n\
f.close();\n\
var bin = app.compile(s);\n\
var fOut = File(f.absoluteURI + "bin");\n\
fOut.open("w");\n\
fOut.write(bin);`;
		fs.writeFileSync(path.join(workDir,'compile-' + jsxFileName), script);
		exec('"ExtendScript Toolkit" -run ' + path.join(workDir,'compile-' + jsxFileName), function(err) {
			console.log(err);
		});
		// process.exit();
	}

} else {
	console.log('Bad arguments list!');
}