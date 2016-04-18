ESLINT=./node_modules/.bin/eslint
NODE=node
TAP=./node_modules/.bin/tap
WEBPACK=./node_modules/.bin/webpack --progress --colors

# ------------------------------------------------------------------------------

build:
	$(WEBPACK)

watch:
	$(WEBPACK) --watch

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

benchmark:
	$(NODE) ./test/benchmark/performance.js

# ------------------------------------------------------------------------------

.PHONY: build lint test coverage benchmark
