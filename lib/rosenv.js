// lib/rosenv.js
var nopt = require('nopt');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var winston = require('winston');
var inquirer = require('inquirer');
var util = require('util');
var chalk = require('chalk');

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
  if (self.config.hasOwnProperty('env')
      && self.config.env) {
    for (var key in self.config.env) {
      var str = util.format('%s %s %s %s',
                            chalk.magenta.bold(key),
                            chalk.cyan(self.config.env[key].distro),
                            self.config.env[key].path,
                            self.config.env[key].comment);
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
    yes: Boolean
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
  else if (_.isEqual(cmd, 'help')) {
    printHelp();
  }
  else {
    printHelp();
  }
}

exports.main = main;

