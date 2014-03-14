# rosenv
a script to manage several ROS workspaces

## Usage
### register a existing workspace
```sh
rosenv register <nickname> <directory> <distro> [-m comment] [-y]
```

### switch workspaces
```sh
rosenv use <nickname> [--devel|--install]
rosenv use --devel
rosenv use --install
```

### update worksapce
```sh
rosenv update [--env <nickname>]
```

### install workspace
```sh
rosenv install <nickname> <path> <rosinstall> [<rosinstall> <rosinstall> ...] [-m <comment>]
```
