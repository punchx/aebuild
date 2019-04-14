# Aebuild v.1.0.2
Sublime Text build system for sending and executing scripts to [After Effects](https://www.adobe.com)
## Installation
Aebuild is not a self-contained tool. It works alongside whith other my tool [AeDevServer](https://github.com/punchx/aedevserver) which you need to install.
Also aebuild is a Nodejs CLI Aapplication which means you need to install [Nodejs](https://nodejs.org/en/) before.

**Installation command:**
```
npm install -g aebuild
```
## How to use:
You have two choices. If you like to execute your script after every save then use watch mode by typing in your terminal:
```
aebuild --watch myscript.jsx
```
Or you can make a Sublime buid system file which following code and use it for your jsx files:
```
{"shell_cmd": "aebuild $file"}
```
### Thank you!
