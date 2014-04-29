karma:
	mkdir -p ./target
	./node_modules/.bin/browserify test/experiments.spec.js -o target/experiments.spec.js -s Experiments
	./node_modules/karma/bin/karma start karma.conf.js --log-level debug --debug

clean:
	rm -Rf ./target

build:
	ruby -e "require 'json';JSON.parse(STDIN.read)" < bower.json
	ruby -e "require 'json';JSON.parse(STDIN.read)" < package.json
	./node_modules/.bin/jshint ./src ./test
	./node_modules/.bin/browserify -e src/experiments.js -o dist/experiments.js -s Experiments
	./node_modules/.bin/uglifyjs -o dist/experiments.min.js dist/experiments.js

watch:
	watchr -e "watch('(src|test)/.*\.js') { system 'make' }"
