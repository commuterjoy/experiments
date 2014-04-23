karma:
	mkdir -p ./target
	./node_modules/.bin/browserify test/ab.spec.js -o target/ab.spec.js
	./node_modules/karma/bin/karma start karma.config --log-level debug --debug

clean:
	rm -Rf ./target

build:
	mkdir -p ./target
	./node_modules/.bin/jshint ./src ./test
	./node_modules/.bin/browserify -e src/ab.js -o target/ab.js -s Ab
	./node_modules/.bin/uglifyjs -o target/ab.min.js target/ab.js	

watch:
	watchr -e "watch('(src|test)/.*\.js') { system 'make' }"
