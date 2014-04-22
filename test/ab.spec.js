
var Ab = require('./../main'); 

describe('AB Testing', function() {
	
	var test = {
		id: 'foo',
		audience: 0.1, // 10% of people  
		audienceOffset: 0.8, // ... in the 0.8 - 0.9 range
		expiry: new Date(2050, 1, 1),
		variants: [{ id: 'A' },{ id: 'B' }],
		canRun: function () {
			return true;
		}
	};

	beforeEach(function() {
		spyOn(Math, 'random').and.returnValue(0.85123);
		localStorage.clear();
	});

	describe("Ab", function () {
		
		it('should exist', function() {
			expect(new Ab(test)).toBeDefined();
		});
		
		it('complain about invalid test names', function() {
			expect(function () { 
				new Ab({ id: 'gA___' })
			}).toThrow();
		});
	});

	describe("User segmentation", function () {
		
		it('should assign new users to an audience segment', function() {
			var a = new Ab(test);
			expect(a.getId()).toEqual(852);
		});
		
		it('should not reassign the user to audience segment if one already exists', function() {
			localStorage.setItem('ab__uid', '101');	
			var a = new Ab(test);
			expect(a.getId()).toEqual(101);
		});
		
		it('should allocate the user to a test variant', function() {
			var a = new Ab(test);
			expect(a.segment()).toEqual('A');
			expect(localStorage.getItem('ab__foo')).toEqual('{"id":"foo","variant":"A"}')
		});

		it('should put all non-participating users in a "not in test" group', function() {
			var t = Object.create(test, { audienceOffset: { value: 0.3 } }); 
			var a = new Ab(t)
			a.segment();
			expect(localStorage.getItem('ab__foo')).toEqual('{"id":"foo","variant":"not-in-test"}')
		});
	
		it("should not segment user if they already belong to the test", function() {
			var t = '{"id":"foo","variant":"B"}';
			localStorage.setItem('ab__foo', t);	
			var a = new Ab(test);
			a.segment();
			expect(localStorage.getItem('ab__foo')).toEqual(t);
		});

		it("should not segment user if test can't be run", function() {
			var t = Object.create(test, { canRun: { value: function () {
					return false;
				}
			}}); 
			var a = new Ab(t)
			a.segment();
			expect(localStorage.getItem('ab__foo')).toBeNull();
		});
		
		it("Mark the test as complete", function() {
			var a = new Ab(test)
			a.complete();
			expect(a.isComplete).toBeTruthy();
		});
		
		it('should allow the forcing of users in to a given test and variant', function () {
			var t = Object.create(test, { audienceOffset: { value: 0.3 } }); 
			var a = new Ab(t, { variant: 'B' })
			a.segment();
			expect(localStorage.getItem('ab__foo')).toEqual('{"id":"foo","variant":"B"}')
		});

		it("should not segment user if the test has expired", function() {
			var dateInThePast = new Date(2000, 1, 1); 
			var t = Object.create(test, { expiry: { value: dateInThePast }}); 
			var a = new Ab(t);
			a.segment();
			expect(localStorage.getItem('ab__foo')).toBeNull();
		});
		
		it('should remove participation from a test', function () {
			var a = new Ab(test);
			a.segment();
			expect(localStorage.getItem('ab__foo')).toEqual('{"id":"foo","variant":"A"}')
			a.clean();
			expect(localStorage.getItem('ab__foo')).toBeNull();
		});

	});

	describe("Running tests", function () {

		xit('should be able to start test', function() {
		});

		xit('should not to run the after the expiry date', function () {
		});

		xit('The current DOM context should be passed to the test variant functions', function() {
		});

	});

	describe("Analytics", function () {

		xit('should tell me if an event is applicable to a test that I belong to', function () {
		});

		xit('should tell me if an event is applicable to a test with multiple event strings that I belong to', function () {
		});

		xit('should return a list of test names that are relevant to the event', function () {
		});

		xit('should return the variant of a test that current user is participating in', function () {
		});

	});

});
