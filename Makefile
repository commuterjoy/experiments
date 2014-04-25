karma:
	mkdir -p ./target
	./node_modules/.bin/browserify test/ab.spec.js -o target/ab.spec.js
	./node_modules/karma/bin/karma start karma.conf.js --log-level debug --debug

clean:
	rm -Rf ./target

build:
	ruby -e "require 'json';JSON.parse(STDIN.read)" < bower.json
	ruby -e "require 'json';JSON.parse(STDIN.read)" < package.json
	./node_modules/.bin/jshint ./src ./test
	./node_modules/.bin/browserify -e src/ab.js -o dist/ab.js -s Ab
	./node_modules/.bin/uglifyjs -o dist/ab.min.js dist/ab.js

watch:
	watchr -e "watch('(src|test)/.*\.js') { system 'make' }"
