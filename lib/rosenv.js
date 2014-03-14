// lib/rosenv.js
var nopt = require('nopt');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var winston = require('winston');
var inquirer = require('inquirer');
var util = require('util');
var chalk = require('chalk');

// ROS_CURRENT_ENV
//   the ros environment nickname currently used

// configuration file format is json
// it is like as following:
// env := {nickname: envspec}
// envspec := {path: $directory, distro: $distro, comment: $comment}
var Configuration = function(spec) {
  var self = this;
  if (!spec) spec = {};

  if (spec.config) {
    if (!fs.existsSync(spec.config)) {
      self.config_path = spec.config;
    }
    else {
      throw new Error(util.format('there is no %s', spec.config));
    }
  }
  else {
    var dirpath = path.join(process.env['HOME'], '.rosenv');
    self.config_path = path.join(dirpath, 'config.json');
    if (!fs.existsSync(dirpath)) {
      winston.info('no %s is available, automatically create it', dirpath);
      fs.mkdirSync(dirpath);
    }
    if (!fs.existsSync(self.config_path)) {
      winston.info('no %s is available, automatically create it', self.config_path);
      fs.openSync(self.config_path, 'w');
    }
  }

  // read configs from configuration file
  var file_content = fs.readFileSync(self.config_path, 'utf8');
  if (file_content) {
    self.config = JSON.parse(file_content);
  }
  else {
    self.config = {};
  }
  
};

Configuration.prototype.printEnvList = function() {
  var self = this;
  var current_env = process.env['ROS_CURRENT_ENV'];
  if (self.config.hasOwnProperty('env')
      && self.config.env) {
    for (var key in self.config.env) {
      var str = util.format('%s %s %s %s',
                            chalk.magenta.bold(key),
                            chalk.cyan(self.config.env[key].distro),
                            self.config.env[key].path,
                            self.config.env[key].comment);
      if (_.isEqual(key, current_env)) {
        str = chalk.red.bold('* ') + str;
      }
      else {
        str = '  ' + str;
      }
      console.log(str);
    }
  }
  else {
    console.log(chalk.red('no environment is registered'));
  }
};

// register command:
//   rosenv register nickname directory distro
Configuration.prototype.registerEnv = function(opts) {
  var self = this;
  var nickname = opts.argv.remain[1];
  var directory = opts.argv.remain[2];
  var distro = opts.argv.remain[3];
  var comment = opts.comment || '';
  inquirer.prompt([{
    type: "confirm",
    message: util.format("register %s as %s (distro: %s)", directory, nickname, distro),
    name: "registerp",
    default: true
  }], function(answers) {
    if (answers.registerp) {
      if (!self.config.hasOwnProperty('env')) {
        self.config.env = {};
      }
      self.config.env[nickname] = {
        path: directory,
        distro: distro,
        comment: comment
      };
      // dump to JSON
      console.log(self.config_path);
      fs.writeFileSync(self.config_path, JSON.stringify(self.config, null, 4));
    }
  });
};

Configuration.prototype.useEnv = function(opts) {
  var self = this;
  // configuring env
  var switch_env = null;
  if (opts.argv.remain.length == 2) {
    switch_env = opts.argv.remain[1];
  }
  else if (process.env['ROS_CURRENT_ENV']) {
    switch_env = process.env['ROS_CURRENT_ENV'];
  }
  else {
    throw new Error('no environment is specified');
  }
  // check the environment exists
  if (!self.config.env.hasOwnProperty(switch_env)) {
    throw new Error(util.format('environment %s does not exist', switch_env));
  }
  // check the configuration, the workspace is catkin or rosbuild
  var sh_file = null;
  var ws = self.config.env[switch_env].path;
  if (isWorkspaceCatkin(ws)) { // catkin
    if (opts.install) {
      sh_file = path.join(ws, 'install', 'setup.zsh');
    }
    else {
      sh_file = path.join(ws, 'devel', 'setup.zsh');
    }
  }
  else {                        // rosbuild
    console.log(util.format('switching to %s', chalk.red(switch_env)));
    sh_file = path.join(ws, 'setup.zsh');
  }
  console.log(util.format('source %s', sh_file));
  console.log(util.format('export ROS_CURRENT_ENV=%s', switch_env));
};

function isWorkspaceCatkin(ws) {
  if (fs.existsSync(path.join(ws, 'src')) &&
      fs.existsSync(path.join(ws, 'src', 'CMakeLists.txt'))) {
    return true;
  }
  else {
    return false;
  }
}


function printHelp() {
  console.log('Usage: rosenv [command] [option]');
};

function main() {
  var opts = nopt({
    help: Boolean,
    version: Boolean,
    debug: Boolean,
    config: String,
    comment: String,
    yes: Boolean,
    install: Boolean,
    devel: Boolean
  }, {
    h: '--help',
    d: '--debug',
    v: '--version',
    c: '--config',
    m: '--comment',
    y: '--yes'
  });
  
  var args = opts.argv.remain;
  var cmd = args[0];
  var config = new Configuration({config: opts.config});

  if (_.isEqual(cmd, 'list')) {
    config.printEnvList();
  }
  else if (_.isEqual(cmd, 'register')) {
    config.registerEnv(opts);
  }
  else if (_.isEqual(cmd, 'use')) {
    config.useEnv(opts);
  }
  else if (_.isEqual(cmd, 'help')) {
    printHelp();
  }
  else {
    printHelp();
  }
}

exports.main = main;

