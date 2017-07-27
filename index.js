#!/usr/local/bin/node
require('es6-promise').polyfill();
require('isomorphic-fetch');

let fs = require('fs');
let path = require('path');
var shell = require('shelljs');

let args = require('subarg')(process.argv.slice(2));
let instructions = args._;
let cmd = args._[0];
let cmdArgs = args._.slice(1);
let cmdWithArgs = args._.join(' ');

let debug = process.env.DEBUG || args.d || args.debug;
let opts = Object.assign({
  version: process.env.VERSION || args.v || args.version || 'v4',
  token: process.env.TOKEN || args.t || args.token || args.access_token || args['access-token'] || args.private_token,
  url: process.env.URL || args.u || args.url,
}, require('./settings.js').read());

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
  console.log(' TOKEN=009afdg0SdfAS14250 URL=https://gitlab.myserver.com GROUP=rocket-science git-lab -s -- clone\n');
  process.exit();
}

if (debug) {
  console.log('opts', opts);
  console.log(`TOKEN ${opts.token}`);
  console.log(`URL ${url.url}`);
  console.log('git-lab arguments', args);
  console.log('command with arguments: ', cmdWithArgs);
}

if (!opts.token || !opts.url) {
  console.error('must provide TOKEN, URL as environment variables');
  console.error('or provide them as arguments:  --token <token> --url <url>');
  console.error('you can also save them so that you don\'t have to provide it every thime with:  "--save" or "--save home" for storing in the home directory');
  process.exit(-1)
}

if (args.s || args.save) {
  require('./settings.js').save(args.s || args.save);
}

switch (cmd) {
  case 'edit-project':
  case 'get-boards':
  case 'add-board':
  case 'get-labels':
  case 'add-label':
  case 'get-milestones':
  case 'add-milestone':
    processInput(cmd, cmdArgs)
    break;
  case 'projects':
    if (cmdArgs.length === 0) return commands.listProjects(cmd, cmdArgs);
    if (cmdArgs[0] === 'get') return processInput(cmd, cmdArgs, commands.getProjectAttribute)
    break;
  default:
    executeGroupCommand(cmd, cmdArgs)
    break;
}

function processInput(cmd, cmdArgs, fn) {
  process.stdin.pipe(require('split')()).on('data', processLine)
  function processLine(line) {
    if (!line.trim()) return;
    fn.call(null, cmd, cmdArgs, line);
  }
}

var commands = {
  listProjects: function (cmd, cmdArgs, input) {
    fetch(`${url}/api/${opts.version}/projects?private_token\=${token}&per_page=999`)
      .then((projects) => {
        projects.forEach((project) => console.log(project.path_with_namespace));
      })
      .catch(reason => console.log(reason))
  },
  getProjectAttribute: function (cmd, cmdArgs, input) {
    let project = parse.project(input);
    fetch(`${url}/api/${opts.version}/projects/${project.id}`)
      .then(handleError)
      .then((proj) => console.log(proj))
  },
  'get-settings': function (command, cmdArgs, project, projectId) {
    fetch(`${url}/api/${opts.version}/projects/${projectId}`)
      .then((proj) => console.log(proj))
      .catch(reason => console.log(reason))
  },
  'get-boards': function (command, cmdArgs, project, projectId) {
    fetch(`${url}/api/${opts.version}/projects/${projectId}/boards?private_token\=${token}`)
      .then((boards) => {
        boards.forEach((board) => console.log(JSON.stringify(board, null, 2)));
      })
      .catch(reason => console.log(reason))
  },
  'add-board': function (command, cmdArgs, project, projectId) {
    var board = require('./board.json');
    var boardId = 28;
    console.log('projectId' + projectId)
    fetch(`${url}/api/${opts.version}/projects/${projectId}/boards/${boardId}/lists?private_token\=${token}`, {
      method: 'POST',
      body: board
    })
      .then(board => console.log(board))
      .catch(reason => console.log(reason))
  },
  'add-label': function (command, cmdArgs, project, projectId) {
  },
  'get-boards': function (command, cmdArgs, project, projectId) {
  },

}

let parse = {
  project: (input) => ({
    id: (input || '').replace(/\//g, '%2F'),
    group: (input || '').split('/')[0],
    project: (input || '').split('/')[1]
  })
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
