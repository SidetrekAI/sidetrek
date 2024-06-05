#!/bin/sh

APP_NAME=sidetrek
INSTALL_DIRNAME=/usr/local/bin/

# Copy the single executable to the bin directory
cp ./$APP_NAME $INSTALL_DIRNAME

# Give execute permissions
chmod +x $INSTALL_DIRNAME/$APP_NAME

