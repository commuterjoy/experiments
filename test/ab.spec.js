
var Ab = require('../src/ab.js'); 

describe('AB Testing', function() {
	
	var test = {
		id: 'foo',
		audience: 0.1, // 10% of people  
		audienceOffset: 0.8, // ... in the 0.8 - 0.9 range
		variants: [{ id: 'A' },{ id: 'B' }]
	};

	beforeEach(function() {
		spyOn(Math, 'random').and.returnValue(0.85123);
		localStorage.clear();
	});

	afterEach(function() {
	});

	describe("Ab", function () {
		it('should exist', function() {
			expect(new Ab()).toBeDefined();
		});
	});

	describe("User segmentation", function () {
		
		it('should assign the user to a persistant audience segment', function() {
			var a = new Ab();
			expect(a.getId()).toEqual(852);
		});
		
		it('should not reassign the user to audience segment if one already exists', function() {
			localStorage.setItem('ab__uid', '101');	
			var a = new Ab();
			expect(a.getId()).toEqual(101);
		});
		
		it('should allocate the user to a test variant', function() {
			var a = new Ab(test);
			expect(a.segment()).toEqual('A');
			expect(localStorage.getItem('ab__stash')).toEqual('{"foo":{"variant":"A"}}')
		});

		it('should put all non-participating users in a "not in test" group', function() {
			var t = Object.create(test, { audienceOffset: { value: 0.3 } }); 
			var a = new Ab(t)
			a.segment();
			expect(localStorage.getItem('ab__stash')).toEqual('{"foo":{"variant":"not-in-test"}}')
		});

		it("should not segment user if test can't be run", function() {
		});

		it("should not segment user if the test has expired", function() {
		});

		it("should not segment user if the test is switched off", function() {
		});

		it("should not segment user if they already belong to the test", function() {
		});

		it('should retrieve all the tests user is in', function() {
		});

		it('should remove expired tests from being logged', function () {
		});

		it('should remove participation from tests that have been removed/renamed', function () {
		})

		it('should allow the forcing of users in to a given test and variant', function () {
		});

	});

	describe("Running tests", function () {

		it('should be able to start test', function() {
		});

		it('should not to run the after the expiry date', function () {
		});

		it('The current DOM context should be passed to the test variant functions', function() {
		});

	});

	describe("Analytics", function () {

		it('should tell me if an event is applicable to a test that I belong to', function () {
		});

		it('should tell me if an event is applicable to a test with multiple event strings that I belong to', function () {
		});

		it('should return a list of test names that are relevant to the event', function () {
		});

		it('should return the variant of a test that current user is participating in', function () {
		});

	});

});
