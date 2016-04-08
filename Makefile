ESLINT=./node_modules/.bin/eslint
NODE=node
TAP=./node_modules/.bin/tap

# ------------------------------------------------------------------------------

lint:
	$(ESLINT) ./*.js
	$(ESLINT) ./lib/*.js
	$(ESLINT) ./test/**/*.js

test:
	@make lint
	$(TAP) ./test/{unit,integration}/*.js

coverage:
	$(TAP) ./test/{unit,integration}/*.js --coverage --coverage-report=lcov

benchmark:
	$(NODE) ./test/benchmark/performance.js

# ------------------------------------------------------------------------------

.PHONY: lint test coverage benchmark
