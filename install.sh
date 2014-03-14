#!/bin/bash

ROSENV_DIR=$HOME/.rosenv

if ! hash git 2>/dev/null; then
  echo >&2 "You need to install git - visit http://git-scm.com/downloads"
  exit 1
fi

if [ -d "$ROSENV_DIR" ]; then
  echo "=> ROSENV is already installed in $ROSENV_DIR, trying to update"
  echo -ne "\r=> "
  cd $ROSENV_DIR && git pull
else
  # Cloning to $NVM_DIR
  git clone https://github.com/garaemon/rosenv.git $ROSENV_DIR  
fi

echo "add below to your bashrc/zshrc"
echo "  source \$HOME/.rosenv/rosenv.sh"
