karma:
	mkdir -p ./target
	./node_modules/browserify/bin/cmd.js test/ab.spec.js -o target/ab.spec.js
	./node_modules/karma/bin/karma start karma.config --log-level debug --debug

clean:
	rm -Rf ./target

build:
	./node_modules/jshint/bin/jshint ./src ./test

watch:
	watchr -e "watch('(src|test)/.*\.js') { system 'make' }"
