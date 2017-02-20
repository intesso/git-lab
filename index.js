#!/usr/local/bin/node

require('es6-promise').polyfill();
require('isomorphic-fetch');

let fs = require('fs');
let path = require('path');
var shell = require('shelljs');

let args = require('subarg')(process.argv.slice(2));
let command = args._[0];
let cmdArgs = args._.join(' ');

const FILENAME = `${process.cwd()}/.git-lab`;

let settings = {};
try {
  settings = JSON.parse(fs.readFileSync(FILENAME, 'utf8'));
} catch (e) {
  console.error('no settings file found (.git-lab)');
}

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

let token = process.env.TOKEN || args.t || args.token || args.access_token || args['access-token'] || settings.token;
let url = process.env.URL || args.u || args.url || settings.url;
let group = process.env.GROUP || args.g || args.group || settings.group;
let debug = process.env.DEBUG || args.d || args.debug || settings.debug;

if (debug) {
  console.log('settings filename: ', process.cwd(), FILENAME);
  console.log('settings', settings);
  console.log(`TOKEN ${token}`);
  console.log(`URL ${url}`);
  console.log(`GROUP ${group}`);
  console.log('git-lab arguments', args);
  console.log('command', command);
  console.log('command with arguments: ', cmdArgs);
}


if (!token || !url || !group) {
  console.error('must provide TOKEN, URL and GROUP as environment variables');
  console.error('or provide them as arguments:  --token --url --group');
  process.exit(-1)
}

if (args.s || args.save) {
  fs.writeFileSync(FILENAME, JSON.stringify({ token, url, group }, null, 2), 'utf8');
}

fetch(`${url}/api/v3/groups/${group}/projects\?private_token\=${token}&per_page=999`)
  .then(function (response) {
    if (response.status >= 400) {
      throw new Error("Bad response from server");
    }
    return response.json();
  })
  .then(function (projects) {
    projects.forEach(project => {
      execute(project.http_url_to_repo, command, cmdArgs);
    })
  });

function execute(repo, command, cmdArgs) {
  if (command === 'clone') {
    shell.exec(`git ${cmdArgs} ${repo}`);
  } else if (command) {
    var dirname = repo.split('/').pop().split('.')[0];
    var pwd = process.cwd();
    shell.cd(`${pwd}/${dirname}`);
    shell.exec(cmdArgs);
    shell.cd(pwd);
  } else {
    console.log(repo);
  }
}
