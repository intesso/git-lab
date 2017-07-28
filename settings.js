const fs = require('fs');
const SETTINGS_HOME = `${require('os').homedir()}/.git-lab`;
const SETTINGS_LOCAL = `${process.cwd()}/.git-lab`;

exports.readSingle = (path) => {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (e) {
    return false;
  }
};

exports.writeSingle = (path, settings) => {
  try {
    return fs.writeFileSync(path, JSON.stringify(settings, null, 2), 'utf8');
  } catch (e) {
    console.error(`Error writing settings file: ${path}: ${e}`);
    process.exit(-1);
  }
};

exports.load = () => {
  return exports.readSingle(SETTINGS_LOCAL) || exports.readSingle(SETTINGS_HOME) || {};
};

exports.save = (where, settings) => {
  let path = where === 'home' ? SETTINGS_HOME : SETTINGS_LOCAL;
  return exports.writeSingle(path, settings);
};
