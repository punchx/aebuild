#!/usr/bin/env node
var net = require('net');
var path = require('path');
var { exec } = require('child_process');
var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
var UglifyJS = require("uglify-js");
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

} else if ((args[2]=='--watch' && args[3]) || (args[2] && args[2] !='--prod')) {

	var myPath = path.resolve(args[3] || args[2] || '');
	myPath = isWin ? myPath.replace(/\\/g, '\\\\') : myPath;

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

			while (rec.length > 1) {
				if (rec[0] == '###End###') {
					client.destroy();
					process.exit();
					return;
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
	if ( !existsAebuildFile) {
		console.log('Aebuild was not intitiated in this folder!');
		process.exit();
	} else if (!aebuildJSON || !aebuildJSON.EntryPoint || (aebuildJSON.EntryPoint.trim() == '')) {	
		console.log('Entry point was not found!');
		process.exit();
	}

	var jsxFileName = aebuildJSON.EntryPoint;
	var jsxPath = path.resolve(path.join(workDir, jsxFileName));
	if (!fs.existsSync(jsxPath)) {
		console.log('Entry point was not found!');
		process.exit();
	}
	jsxPath = isWin ? jsxPath.replace(/\\/g, '\\\\') : jsxPath;
	var nStr = "";

	var fStr = fs.readFileSync(jsxPath, 'utf8');

	if (aebuildJSON.Console && aebuildJSON.Console.toLowerCase().trim() == 'remove') {
		//remove console
		nStr = fStr.replace(/console.(?:log|error)\s*\(.*\);?/g, "");
	} else if (aebuildJSON.Console && aebuildJSON.Console.toLowerCase().trim() == 'writeln') {
		//substitute conseol.log with writeLn - which print in info panel
		nStr = fStr.replace(/console.(?:log|error)/g, "writeLn");
	} else if (aebuildJSON.Console && aebuildJSON.Console.toLowerCase().trim() == 'alert') {
		//substitute conseol.log with alert
		nStr = fStr.replace(/console.(?:log|error)/g, "alert");
	}

	if (aebuildJSON.Binary && aebuildJSON.Binary.toLowerCase().trim() == 'true') {
		var uglyStr = UglifyJS.minify(nStr);
		var script = `#target estoolkit#dbg\n\
var s = "` + uglyStr.code + `";\n\
var bin = app.compile(s);\n\
var fOut = File("` + jsxPath + "bin" + `");\n\
fOut.open("w");\n\
fOut.write(bin);`;
		fs.writeFileSync(path.join(workDir,'compile-' + jsxFileName), script);
		var cp = exec('"ExtendScript Toolkit" -cmd ' + path.join(workDir,'compile-' + jsxFileName), function(err) {
			console.log(err);
		});

		cp.on('close', function() {
			fs.unlinkSync(path.join(workDir,'compile-' + jsxFileName));
			process.exit();
		}); 
	} else {
		fs.writeFileSync(path.join(workDir,'build-' + jsxFileName), nStr);
		process.exit();
	}

} else {
	console.log('Bad arguments list!');
	process.exit();
}