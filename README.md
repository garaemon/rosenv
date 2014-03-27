# rosenv
a script to manage several ROS workspaces

## Install
```sh
curl https://raw.github.com/garaemon/rosenv/master/install.sh | bash
```

And rosenv requires node.js. The latest stable version is recommended and please use
nvm.
```sh
curl https://raw.github.com/creationix/nvm/v0.3.0/install.sh | sh
nvm install 0.10
nvm use 0.10
```

Please see [nvm](https://github.com/creationix/nvm) for more details.

## Usage
Please run `rosenv help` for details.
### register a existing workspace
```sh
rosenv register <nickname> <directory> <distro>
```

### switch workspaces
```sh
rosenv use <nickname> [--devel|--install]
rosenv use --devel
rosenv use --install
```

### update worksapce
```sh
rosenv update [<nickname>] [-jJOB_NUM]
```

### install workspace
```sh
rosenv install <nickname> <path> <rosinstall> [<rosinstall> <rosinstall> ...] [--rosbuild]
```
