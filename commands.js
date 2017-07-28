let all = 'all';
let stdin = process.stdin;
let stdout = process.stdout;
let parse = {
  project: (input = '') => ({
    name: input,
    id: encodeURIComponent(input),
    group: input.split('/')[0],
    project: input.split('/')[1]
  }),
  group: (input = '') => ({
    name: input,
    id: input.replace(/\//g, '%2F')
  })
}

function handleError(err) {
  if (!err) console.log('unknown error');
  let status = err.status || '';
  if (err.message) return console.log(`Error: ${status} ${err.message}`);
  console.log(err);
}

function parseJson(response) {
  if (response.status >= 400) {
    throw new Error(`Bad response from server, ${JSON.stringify(response)}`);
  }
  return response.json();
}

// commands arguments: c: commands array, i: stdin words array
module.exports = (opts) => ({
  listProjects: function (c, i, attr = 'path_with_namespace') {
    attr = c[1] ? c[1] : attr;
    fetch(`${opts.url}/api/${opts.version}/projects?private_token\=${opts.token}&per_page=999`)
      .then(parseJson)
      .then((projects) => {
        projects.forEach((project) => console.log(attr == all ? JSON.stringify(project) : project[attr]));
      })
      .catch(handleError)
  },
  getProjectAttribute: function (c, i) {
    let project = parse.project(i[0]);
    let attr = c[2];
    fetch(`${opts.url}/api/${opts.version}/projects/${project.id}?private_token\=${opts.token}`)
      .then(parseJson)
      .then(project => {
        console.log(attr == all ? `${project.name} ${JSON.stringify(project)}` : `${project.name} ${project[attr]}`)
      })
      .catch(handleError)
  },
  setProjectAttribute: function (c, i) {
    let project = parse.project(i[0]);
    let attr = c[2];
    let value = c[3];
    fetch(`${opts.url}/api/${opts.version}/projects/${project.id}?private_token\=${opts.token}`, {
      method: 'POST',
      body: { [attr]: value }
    })
      .then(parseJson)
      .then(data => {
        console.log(`${project.name} ${data}`)
      })
      .catch(handleError)
  },
  listGroups: function (c, i, attr = 'path') {
    attr = c[2] ? c[2] : attr;
    fetch(`${opts.url}/api/${opts.version}/groups?private_token\=${opts.token}&per_page=999`)
      .then(parseJson)
      .then((groups) => {
        groups.forEach((group) => console.log(attr == all ? group : group[attr]));
      })
      .catch(handleError)
  },
  listProjectsForGroups: function (c, i, attr = 'path_with_namespace') {
    let group = c[2];
    attr = c[3] ? c[3] : attr;
    fetch(`${opts.url}/api/${opts.version}/groups/${group}/projects\?private_token\=${opts.token}&per_page=999`)
      .then(parseJson)
      .then((projects) => {
        projects.forEach((project) => console.log(attr == all ? project : project[attr]));
      })
      .catch(handleError)
  },
  getGroupAttribute: function (c, i) {
    let group = i[0];
    fetch(`${opts.url}/api/${opts.version}/groups/${group}?private_token\=${opts.token}`)
      .then(parseJson)
      .then(data => {
        console.log(`${project.name} ${data[c[2]]}`)
      })
      .catch(handleError)
  },
  setGroupAttribute: function (c, i) {
    let group = i[0];
    fetch(`${opts.url}/api/${opts.version}/projects/${group}?private_token\=${opts.token}`, {
      method: 'POST',
      body: { [c[2]]: c[3] }
    })
      .then(parseJson)
      .then(data => {
        console.log(`${group} ${data[c[2]]}`)
      })
      .catch(handleError)
  },
  getProjectBoards: function (c, i) {
    let project = parse.project(i[0]);
    fetch(`${opts.url}/api/${opts.version}/projects/${project.id}/boards?private_token\=${opts.token}`)
      .then(parseJson)
      .then((boards) => {
        boards.forEach((board) => console.log(JSON.stringify(board, null, 2)));
      })
      .catch(handleError)
  },
  addProjectBoardList: function (c, i) {
    let project = parse.project(i[0]);
    var board = require('./board.json');
    var boardId = 28;
    fetch(`${opts.url}/api/${opts.version}/projects/${project.id}/boards/${boardId}/lists?private_token\=${opts.token}`, {
      method: 'POST',
      body: board
    })
      .then(parseJson)
      .then(board => console.log(board))
      .catch(handleError)
  },
  'add-label': function (command, cmdArgs, project, projectId) {
  },
  'get-boards': function (command, cmdArgs, project, projectId) {
  },

});
