var program = require('commander'),
	chokidar = require('chokidar'),
	path = require('path'),
	colors = require('colors'),
	fs = require('fs'),
	jade = require('jade');

colors.setTheme({
	info: 'green',
	data: 'grey',
	warn: 'yellow',
	debug: 'blue',
	error: 'red'
});

program
	.version('0.0.1')
	.usage('[options] path/to/template/dir/')
	.option('-o, --output [path]', 'set the output directory for compile templates')
	.option('-e, --extension [.jade]', 'set extension of source file', '.jade')
	.option('-D, --no-debug', 'compile without debugging (smaller functions)')
	.option('-P, --pretty', 'compile pretty and human readable')
	.parse(process.argv);

var source = path.resolve(program.args[0]),
	output = program.output ? path.resolve(program.output) : source;

console.info('Output dir:'. info, output.data);
console.info('Watch files with extension:'.info, program.extension.data);
console.info('Start watching dir:'.info, source.data);

var writeInFile = function(file, content){
	fs.writeFile(file, content, function(err){
		if(err) throw err;
		console.log('Write file:'.debug, file.data);
	});
};

var compileFile = function(jadeFile){
	jadeFile = path.resolve(jadeFile);
	fs.readFile(jadeFile, 'utf-8', function(err, str){
		if(err) throw err;
		var content = jade.render(str, {pretty: program.pretty, compileDebug: program.debug}),
			dir = path.dirname(jadeFile.replace(source, output)),
			file = dir + '/' + path.basename(jadeFile, program.extension) + ".html";

		try {
			fs.statSync(dir);
			writeInFile(file, content);
		}
		catch (er){
			fs.mkdir(dir, 0777, function(err){
				if(err) throw err;
				writeInFile(file, content);
			});
		}
	});
};

var checkFile = function(file){
	file = path.resolve(file);
	var isDir = fs.lstatSync(file).isDirectory(),
		fileOk = !(/^\./.test(file) || (!isDir && path.extname(file) != program.extension));
	if(fileOk && !isDir)
		compileFile(file);
	return !fileOk;
};

var watcher = chokidar.watch(program.args[0], {ignored: checkFile, persistent: true});

watcher.on('change', function(file){
	var date = new Date(),
		strTime = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	console.info('Change detected at'.info, strTime.data, 'in:'.info, path.basename(file).data);
	compileFile(file);
});
