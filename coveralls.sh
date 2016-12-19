#!/bin/bash

BUILDER=ubuntu-14.04-local
TOCKEN=U8nzHXvDjksJtPYykiCviw52ABRv9HLnI

NODE_ENV=test istanbul cover _mocha --report lcovonly -- -R spec && cat ./coverage/lcov.info | COVERALLS_SERVICE_NAME=$BUILDER COVERALLS_REPO_TOKEN=$TOCKEN ./node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage