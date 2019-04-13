# Aebuild
Sublime Text build system for sending and executing scripts to [After Effects](https://www.adobe.com)
## Installation
Aebuild is not a self-contained tool. It works alongside whith other my tool AeDevServer which you need to install.
Also aebuild is a Nodejs CLI Aapplication which means you need to install [Nodejs](https://nodejs.org/en/) before.

**Installation command:**
```
npm install -g aebuild
```
## How to use:
You have two choises. If you like to execute yuor script after every save then use watch mode by typing in your terminal:
```
aebuild --watch myscript.jsx
```
Or you can make a Sublime buid system file which following code and use for your jsx files:
```
{"shell_cmd": "aebuild $file"}
```
### Thank you!
