karma:
	mkdir -p ./target
	./node_modules/browserify/bin/cmd.js test/ab.spec.js -o target/ab.spec.js
	./node_modules/karma/bin/karma start karma.config --log-level debug --debug

clean:
	rm -Rf ./target

build:
	mkdir -p ./target
	./node_modules/jshint/bin/jshint ./src ./test
	./node_modules/browserify/bin/cmd.js -e src/ab.js -o target/ab.js -s Ab
	./node_modules/uglify-js/bin/uglifyjs -o target/ab.min.js target/ab.js	

watch:
	watchr -e "watch('(src|test)/.*\.js') { system 'make' }"
