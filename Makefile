ESLINT=./node_modules/.bin/eslint
NODE=node
TAP=./node_modules/.bin/tap
WEBPACK=./node_modules/.bin/webpack --progress --colors
WEBPACK_DEV_SERVER=./node_modules/.bin/webpack-dev-server

# ------------------------------------------------------------------------------

build:
	$(WEBPACK)

watch:
	$(WEBPACK) --watch

serve:
	$(WEBPACK_DEV_SERVER) --content-base ./

# ------------------------------------------------------------------------------

lint:
	$(ESLINT) ./src/*.js
	$(ESLINT) ./src/**/*.js
	$(ESLINT) ./test/**/*.js

test:
	@make lint
	$(TAP) ./test/{unit,integration}/*.js

coverage:
	$(TAP) ./test/{unit,integration}/*.js --coverage --coverage-report=lcov

# ------------------------------------------------------------------------------

.PHONY: build lint test coverage benchmark
