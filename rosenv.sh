#!/bin/sh

# ROS Environnemt Manager
ROSENV_DIR=$HOME/.rosenv
rosenv() {
    if [ $# -lt 1 ]; then
        rosenv help
        return
    fi
    case $1 in
        "help")
            echo
            echo "ROS Environment Manager"
            ;;
        "register" | "add")
            # nickname path version [-m option]
            if [ $# -lt 4 ]; then
                rosenv help
                return
            fi
            local nickname
            local ws_path
            local version
            local comment
            nickname=$2
            ws_path=$3
            version=$4
            echo "  register $ws_path($version) as $nickname"
            # use node to read/write json file
            node <<EOF
var path = require('path');
var fs = require('fs');
if (!fs.existsSync("$ROSENV_DIR")) {
  fs.mkdirSync("$ROSENV_DIR");
}
var config = {};
if (fs.existsSync("$ROSENV_DIR/config.json")) {
  config = JSON.parse(fs.readFileSync("$ROSENV_DIR/config.json", "utf-8"));
}
config["$nickname"] = {
  path: "$ws_path",
  version: "$version"
};
fs.writeFileSync("$ROSENV_DIR/config.json", JSON.stringify(config, null, 4) + '\n');
EOF
            ;;
        "list")
            node <<EOF
var path = require('path');
var fs = require('fs');
var util = require('util');
if (fs.existsSync("$ROSENV_DIR/config.json")) {
  config = JSON.parse(fs.readFileSync("$ROSENV_DIR/config.json", "utf-8"));
  for (var key in config) {
    console.log(util.format('  %s (%s) %s', key, config[key].version, config[key].path));
  }
}
else {
  console.log("no env is registered");
}
EOF
            ;;
        "list-nicknames")       # internal command
            node <<EOF
var path = require('path');
var fs = require('fs');
if (fs.existsSync("$ROSENV_DIR/config.json")) {
  config = JSON.parse(fs.readFileSync("$ROSENV_DIR/config.json", "utf-8"));
  for (var key in config) {
    console.log(key);
  }
}
EOF
            ;;
        "get-path")             # internal command
            local nickname
            nickname=$2
            node <<EOF
var path = require('path');
var fs = require('fs');
if (fs.existsSync("$ROSENV_DIR/config.json")) {
  config = JSON.parse(fs.readFileSync("$ROSENV_DIR/config.json", "utf-8"));
  if (config.hasOwnProperty("$nickname")) {
    console.log(config["$nickname"].path);
  }
}
EOF
            ;;
        "get-version")             # internal command
            local nickname
            nickname=$2
            node <<EOF
var path = require('path');
var fs = require('fs');
if (fs.existsSync("$ROSENV_DIR/config.json")) {
  config = JSON.parse(fs.readFileSync("$ROSENV_DIR/config.json", "utf-8"));
  if (config.hasOwnProperty("$nickname")) {
    console.log(config["$nickname"].version);
  }
}
EOF
            ;;
        "rm" | "remove")
            local nickname
            nickname=$2
            node <<EOF
var path = require('path');
var fs = require('fs');
if (fs.existsSync("$ROSENV_DIR/config.json")) {
  config = JSON.parse(fs.readFileSync("$ROSENV_DIR/config.json", "utf-8"));
  delete config["$nickname"];
fs.writeFileSync("$ROSENV_DIR/config.json", JSON.stringify(config, null, 4) + '\n');
}
EOF
            ;;
        "is-catkin")
            local ws_path
            local nickname
            nickname=$2
            ws_path=$(rosenv get-path $nickname)
            if [ -e $ws_path/src -a -e $ws_path/src/CMakeLists.txt ]; then
                echo yes
            fi
            ;;
        "use")
            local nickname
            local develp
            local installp
            # parsing argument
            nickname=$ROSENV_CURRENT
            shift               # dispose 'use' argument
            while [ $# -gt 0 ]; do
                case "$1" in 
                    "--install") installp=true;;
                    "--devel") develp=true;;
                    *) nickname=$1;;
                esac
                shift
            done
            if [ "`rosenv get-version $nickname`" = "" ]; then
                echo $nickname is not registered yet
                return 1
            else
                local ws_path
                ws_path=$(rosenv get-path $nickname)
                if [ -e $ws_path/src -a -e $ws_path/src/CMakeLists.txt ]; then
                    # catkin
                    if [ "$installp" = "true" ]; then
                        echo switching to $nickname:install
                        source $ws_path/install/setup.`basename $SHELL`
                    else
                        echo switching to $nickname:devel
                        source $ws_path/devel/setup.`basename $SHELL`
                    fi
                    export ROSENV_CURRENT=$nickname
                else
                    # rosbuild
                    echo switching to $nickname
                    source $ws_path/setup.`basename $SHELL`
                    export ROSENV_CURRENT=$nickname
                fi
                        
            fi
            ;;
        "update")
            local nickname
            nickname=$ROSENV_CURRENT
            shift               # dispose 'update' argument
            while [ $# -gt 0 ]; do
                case "$1" in 
                    "--env") nickname=$2; shift;;
                    *) ;;
                esac
                shift
            done
            if [ "$(rosenv is-catkin $nickname)" = "yes" ] ; then
                (cd $(rosenv get-path $nickname)/src && wstool update);
            else
                (cd $(rosenv get-path $nickname) && rosws update);
            fi
            ;;
    esac


}
