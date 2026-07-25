#!/bin/sh
set -eu

npm run migrate
exec npm run standalone
