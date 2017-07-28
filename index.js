#!/usr/local/bin/node
require('es6-promise').polyfill();
require('isomorphic-fetch');

let fs = require('fs');
let path = require('path');
var defaults = require('defaults');
var shell = require('shelljs');

let args = require('subarg')(process.argv.slice(2));
let settings = require('./settings.js');
let stdin = process.stdin;
let stdout = process.stdout;
let c = args._;
let cmd = args._[0];
let cmdArgs = args._.slice(1);
let cmdWithArgs = args._.join(' ');

let debug = process.env.DEBUG || args.d || args.debug;
let opts = defaults({
  version: process.env.VERSION || args.v || args.version || 'v3',
  token: process.env.TOKEN || args.t || args.token || args.access_token || args['access-token'] || args.private_token,
  url: process.env.URL || args.u || args.url,
}, settings.load());
let commands = require('./commands.js')(opts);

if (args.h || args.help) {
  console.log('\ngitlab tool\n');
  console.log('usage: git-lab {options} -- {git command} [git options] \n');
  console.log('options:');
  console.log(' --token, -t gitlab acces token');
  console.log(' --url,   -u gitlab url, e.g: https://gitlab.myserver.com');
  console.log('example:\n');
  console.log(' git-lab --token 009afdg0SdfAS14250 --url https://gitlab.myserver.com --save home\n');
  console.log(' git-lab clone\n');
  console.log('example with environment variables:\n');
  console.log(' TOKEN=009afdg0SdfAS14250 URL=https://gitlab.myserver.com git-lab -s -- clone\n');
  process.exit();
}

if (debug) {
  console.log('opts', opts);
  console.log(`TOKEN ${opts.token}`);
  console.log(`URL ${opts.url}`);
  console.log('git-lab arguments', args);
  console.log('commands: ', c.join(' '));
}

if (!opts.token || !opts.url) {
  console.error('must provide TOKEN, URL as environment variables');
  console.error('or provide them as arguments:  --token <token> --url <url>');
  console.error('you can also save them so that you don\'t have to provide it every thime with:  "--save" or "--save home" for storing in the home directory');
  process.exit(1)
}

if (args.s || args.save) {
  console.log('s', args.s, 'save', args.save, typeof save)
  console.log('save', args.save || args.s)
  settings.save(args.s || args.save, opts);
}

// run commands
if (c[0] == 'projects' && c[1] === 'set') return run(commands.setProjectAttribute, c);
if (c[0] == 'projects' && c[1] === 'get') return run(commands.getProjectAttribute, c);
if (c[0] == 'projects') return run(commands.listProjects, c);
if (c[0] == 'groups' && c[1] === 'set') return run(commands.setGroupAttribute, c);
if (c[0] == 'groups' && c[1] === 'get') return run(commands.getProjectAttribute, c);
if (c[0] == 'groups' && c[1] === 'projects') return run(commands.listProjectsForGroups, c);
if (c[0] == 'groups') return run(commands.listGroups, c);

function run(fn, c) {
  if (stdin.isTTY) return fn.apply(null, [c]);
  stdin.pipe(require('split')()).on('data', processLine);
  function processLine(line) {
    if (!line.trim()) return;
    fn.apply(null, [c].concat([line.trim().split(' ')]));
  }
}


function merge(a, b) {

}

function executeGroupCommand(command, cmdArgs) {
  if (!group) {
    console.error('must provide GROUP as environment variables');
    console.error('or provide it as argument:  --group');
    process.exit(-1)
  }
  if (args.s || args.save) {
    fs.writeFileSync(SETTINGS_LOCAL, JSON.stringify({ token, url, group }, null, 2), 'utf8');
  }
  fetch(`${url}/api/${opts.version}/groups/${group}/projects\?private_token\=${token}&per_page=999`)
    .then(handleError)
    .then(function (projects) {
      projects.forEach(project => {
        execute(project.http_url_to_repo, command, cmdArgs);
      })
    });
}

function execute(repo, command, cmdArgs) {

  if (command === 'clone') {
    output(shell.exec(`git ${cmdArgs} ${repo}`, { async: true, silent: true }));
  } else if (command) {
    var dirname = repo.split('/').pop().split('.')[0];
    var pwd = process.cwd();
    shell.cd(`${pwd}/${dirname}`);
    output(shell.exec(cmdArgs, { async: true, silent: true }));
    shell.cd(pwd);
  } else {
    console.log(repo);
  }

  function output(child) {
    child.stdout.on('data', function (data) {
      console.log(`${repo}: ${data}`);
    });
    child.stderr.on('data', function (data) {
      console.log(`${repo} ERR: ${data}`);
    });
  }
}

