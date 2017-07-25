#!/usr/local/bin/node
require('es6-promise').polyfill();
require('isomorphic-fetch');

let fs = require('fs');
let path = require('path');
var shell = require('shelljs');

let args = require('subarg')(process.argv.slice(2));
let command = args._[0];
let cmdArgs = args._.join(' ');

const SETTINGS_HOME = `${require('os').homedir()}/.git-lab`;
const SETTINGS_LOCAL = `${process.cwd()}/.git-lab`;
const API_VERSION = 'v4';

let debug = process.env.DEBUG || args.d || args.debug;
let settings = {};
try {
  settings = JSON.parse(fs.readFileSync(SETTINGS_LOCAL, 'utf8'));
} catch (e) {
  if (debug) console.error('no settings file found ".git-lab"');
}

let token = process.env.TOKEN || args.t || args.token || args.access_token || args['access-token'] || settings.token;
let url = process.env.URL || args.u || args.url || settings.url;
let group = process.env.GROUP || args.g || args.group || settings.group;

if (args.h || args.help) {
  console.log('\ngitlab tool\n');
  console.log('usage: git-lab {options} -- {git command} [git options] \n');
  console.log('options:');
  console.log(' --token, -t gitlab acces token');
  console.log(' --url,   -u gitlab url, e.g: https://gitlab.myserver.com');
  console.log(' --group, -g gitlab group name\n');
  console.log('example:\n');
  console.log(' git-lab --token 009afdg0SdfAS14250 --url https://gitlab.myserver.com --group rocket-science  --save -- clone\n');
  console.log('example with environment variables:\n');
  console.log(' TOKEN=009afdg0SdfAS14250 URL=https://gitlab.myserver.com GROUP=rocket-science git-lab -s -- clone\n');
  process.exit();
}

if (debug) {
  console.log('settings file local: ', SETTINGS_LOCAL);
  console.log('settings file home: ', SETTINGS_HOME);
  console.log('settings', settings);
  console.log(`TOKEN ${token}`);
  console.log(`URL ${url}`);
  console.log(`GROUP ${group}`);
  console.log('git-lab arguments', args);
  console.log('command', command);
  console.log('command with arguments: ', cmdArgs);
}

if (!token || !url) {
  console.error('must provide TOKEN, URL and GROUP as environment variables');
  console.error('or provide them as arguments:  --token --url --group');
  process.exit(-1)
}

if (args.s || args.save) {
  fs.writeFileSync(SETTINGS_LOCAL, JSON.stringify({ token, url, group }, null, 2), 'utf8');
}

if (command === 'get-boards') {
  process.stdin.pipe(require('split')()).on('data', processLine)
  function processLine(projectId) {
    var projectId = projectId.replace(/\//g, '%2F')
    if (!projectId.trim()) return;
    console.log('projectId' + projectId)
    fetch(`${url}/api/${API_VERSION}/projects/${projectId}/boards?private_token\=${token}`)
      .then(handleError)
      .then((boards) => {
        boards.forEach((board) => console.log(board));
      })
      //.catch(reason => console.log("catch" + reason))
  }
} else if (command === 'add-label') {
  process.stdin.pipe(require('split')()).on('data', processLine)
  function processLine(line) {
    console.log('bla' + line + '!')
  }
} else if (command === 'ls') {
  fetch(`${url}/api/${API_VERSION}/projects?private_token\=${token}&per_page=999`)
    .then(handleError)
    .then((projects) => {
      projects.forEach((project) => console.log(project.path_with_namespace));
    })
} else {
  fetch(`${url}/api/${API_VERSION}/groups/${group}/projects\?private_token\=${token}&per_page=999`)
    .then(handleError)
    .then(function (projects) {
      projects.forEach(project => {
        execute(project.http_url_to_repo, command, cmdArgs);
      })
    });
}

function handleError(res) {
  if (res.status >= 400) {
    throw new Error("Bad response from server");
  }
  return res.json();
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
