karma:
	mkdir -p ./target
	./node_modules/browserify/bin/cmd.js test/ab.spec.js -o target/ab.spec.js
	./node_modules/karma/bin/karma start ab.config.js --log-level debug --debug --auto-watch #--single-run

clean:
	rm -Rf ./target

watch:
	watchr -e "watch('src/.*\.js') { system 'make' }"
