let all = 'all';
let stdin = process.stdin;
let stdout = process.stdout;
var defaults = require('defaults');
var qs = require('qs');

require('es6-promise').polyfill();
let superagentPromisePlugin = require('superagent-promise-plugin');
let request = superagentPromisePlugin.patch(require('superagent'));

let parse = {
  project: (input = '') => ({
    name: input,
    id: encodeURIComponent(input),
    group: input.split('/')[0],
    project: input.split('/')[1]
  }),
  group: (input = '') => ({
    name: input,
    id: encodeURIComponent(input)
  })
}

function handleError(err) {
  if (!err) console.log('unknown error');
  let status = err.status || '';
  if (err.message) return console.log(`Error: ${status} ${err.message}`);
  console.log(err);
}

function stringify(data) {
  return JSON.stringify(data);
}

// commands arguments: c: commands array, i: stdin words array
module.exports = (opts) => ({
  listProjects: function (c, i, attr = 'path_with_namespace') {
    attr = c[1] ? c[1] : attr;
    request.get(`${opts.url}/api/${opts.version}/projects?per_page=999`)
      .set('PRIVATE-TOKEN', opts.token)
      .then(res => res.body.forEach((project) => console.log(attr == all ? stringify(project) : project[attr])))
      .catch(handleError)
  },
  getProjectAttribute: function (c, i) {
    let project = parse.project(i[0]), attr = c[2];
    request.get(`${opts.url}/api/${opts.version}/projects/${project.id}`)
      .set('PRIVATE-TOKEN', opts.token)
      .then(res => console.log(attr == all ? `${project.name} ${stringify(res.body)}` : `${project.name} ${res.body[attr]}`))
      .catch(handleError)
  },
  setProjectAttribute: function (c, i) {
    let project = parse.project(i[0]), attr = c[2], value = c[3];
    request.put(`${opts.url}/api/${opts.version}/projects/${project.id}`)
      .set('PRIVATE-TOKEN', opts.token)
      .send({
        id: project.id,
        name: project.project,
        [attr]: value
      })
      .then(res => console.log(`${project.name} ${res.body[attr]}`))
      .catch(handleError)
  },
  listGroups: function (c, i, attr = 'path') {
    attr = c[2] ? c[2] : attr;
    request.get(`${opts.url}/api/${opts.version}/groups?per_page=999`)
      .set('PRIVATE-TOKEN', opts.token)
      .then(res => res.body.forEach((group) => console.log(attr == all ? stringify(group) : group[attr])))
      .catch(handleError)
  },
  listProjectsForGroups: function (c, i, attr = 'path_with_namespace') {
    let group = parse.group(c[2]);
    attr = c[3] ? c[3] : attr;
    request.get(`${opts.url}/api/${opts.version}/groups/${group.id}/projects\?per_page=999`)
      .set('PRIVATE-TOKEN', opts.token)
      .then(res => res.body.forEach(project => console.log(attr == all ? stringify(project) : project[attr])))
      .catch(handleError)
  },
  getGroupAttribute: function (c, i) {
    let group = parse.group(i[0]), attr = c[2];
    request.get(`${opts.url}/api/${opts.version}/groups/${group.id}`)
      .set('PRIVATE-TOKEN', opts.token)
      .then(res => console.log(attr == all ? `${group.name} ${stringify(res.body)}` : `${group.name} ${res.body[attr]}`))
      .catch(handleError)
  },
  setGroupAttribute: function (c, i) {
    let group = parse.group(i[0]), attr = c[2], value = c[3];
    request.put(`${opts.url}/api/${opts.version}/groups/${group.id}`)
      .set('PRIVATE-TOKEN', opts.token)
      .send({
        id: group.id,
        name: group.name,
        [attr]: value
      })
      .then(res => console.log(`${group.name} ${res.body[attr]}`))
      .catch(handleError)
  },
  getProjectBoards: function (c, i, attr = 'id') {
    attr = c[1] ? c[1] : attr;
    let project = parse.project(i[0]);
    request.get(`${opts.url}/api/${opts.version}/projects/${project.id}/boards`)
      .set('PRIVATE-TOKEN', opts.token)
      .then(res => res.body.forEach(board => console.log(attr == all ? `${project.name} ${stringify(board)}` : `${project.name} ${board[attr]}`)))
      .catch(handleError)
  },
  addProjectBoardList: function (c, i) {
    let project = parse.project(i[0]);
    let boardId = i[1];
    let board = require('./board.json');
    fetch(`${opts.url}/api/${opts.version}/projects/${project.id}/boards/${boardId}/lists?private_token\=${opts.token}`, {
      method: 'POST',
      body: board
    })
      .then(parseJson)
      .then(board => console.log(board))
      .catch(handleError)
  },
  listIssues: function (c, i, attr = 'title') {
    let query = c[1] && c[1].includes('=') ? c[1] : '';
    attr = c[2] ? c[2] : !query && c[1] ? c[1] : attr;
    query = [query, 'per_page=999'].join('&');
    request.get(`${opts.url}/api/${opts.version}/issues?${query}`)
      .set('PRIVATE-TOKEN', opts.token)
      .then(res => res.body.forEach((issue) => console.log(attr == all ? `${extractIdFromUrl(opts.url, issue.web_url)} ${stringify(issue)}` : `${extractIdFromUrl(opts.url, issue.web_url)} ${issue.iid} ${issue.id} ${issue[attr]}`)))
      .catch(handleError)
  },
  listGroupIssues: function (c, i, attr = 'title') {
    let group = parse.group(i[0]);
    let query = c[1] && c[1].includes('=') ? c[1] : '';
    attr = c[2] ? c[2] : !query && c[1] ? c[1] : attr;
    query = [query, 'per_page=999'].join('&');
    request.get(`${opts.url}/api/${opts.version}/groups/${group.id}/issues?${query}`)
      .set('PRIVATE-TOKEN', opts.token)
      .then(res => res.body.forEach((issue) => console.log(attr == all ? `${extractIdFromUrl(opts.url, issue.web_url)} ${stringify(issue)}` : `${extractIdFromUrl(opts.url, issue.web_url)} ${issue.iid} ${issue.id} ${issue[attr]}`)))
      .catch(handleError)
  },
  listProjectIssues: function (c, i, attr = 'title') {
    let project = parse.project(i[0]);
    let query = c[1] && c[1].includes('=') ? c[1] : '';
    attr = c[2] ? c[2] : !query && c[1] ? c[1] : attr;
    query = [query, 'per_page=999'].join('&');
    request.get(`${opts.url}/api/${opts.version}/projects/${project.id}/issues?${query}`)
      .set('PRIVATE-TOKEN', opts.token)
      .then(res => res.body.forEach((issue) => console.log(attr == all ? `${extractIdFromUrl(opts.url, issue.web_url)} ${stringify(issue)}` : `${extractIdFromUrl(opts.url, issue.web_url)} ${issue.iid} ${issue.id} ${issue[attr]}`)))
      .catch(handleError)
  },
  getProjectIssue: function (c, i) {
    let project = parse.project(i[0]), iid = i[1], attr = c[2];
    request.get(`${opts.url}/api/${opts.version}/projects/${project.id}/issues/${iid}`)
      .set('PRIVATE-TOKEN', opts.token)
      .then(res => console.log(attr == all ? `${project.name} ${stringify(res.body)}` : `${project.name} ${res.body[attr]}`))
      .catch(handleError)
  },
  setProjectIssue: function (c, i) {
    let project = parse.project(i[0]), iid = i[1], obj = c[2];
    request.put(`${opts.url}/api/${opts.version}/projects/${project.id}/issues/${iid}`)
      .set('PRIVATE-TOKEN', opts.token)
      .send(defaults({
        id: project.id,
        issue_iid: iid
      }), obj)
      .then(res => console.log(`${project.name} ${res.body[attr]}`))
      .catch(handleError)
  },

});

function extractIdFromUrl(host, url) {
  return url.replace(`${host}/`, '').replace(/\/issues.*/g, '');
}

