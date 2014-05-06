/*global require,describe,beforeEach,it,expect,spyOn*/

var Experiments = require('./../main'); 

// polyfill for PhantomJS
function CustomEvent ( event, params ) {
    "use strict";
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
}

CustomEvent.prototype = window.Event.prototype;
window.CustomEvent = CustomEvent;

describe('AB Testing', function() {

	"use strict";

    var listener = {
        'start': function () {},
        'complete': function () {}
    };
	
    // mock test
	var test = {
		id: 'foo',
		audience: 0.1, // 10% of people  
		audienceOffset: 0.8, // ... in the 0.8 - 0.9 range
		expiry: new Date(2050, 1, 1),
        variants: [{
			id: 'A',
			test: function () {
				return true;
			}
		},{ 
			id: 'B',
			test: function () {
				return true;
			}
		}],
		canRun: function () {
			return true;
		}
	};
        
	beforeEach(function() {
        spyOn(Math, 'random').and.returnValue(0.85123);
		localStorage.clear();
        document.body.removeEventListener('experiments.foo.started', listener.start);
        document.body.removeEventListener('experiments.foo.started', listener.complete);
        document.documentElement.className = '';
	});

	describe("Experiments", function () {
		
		it('should exist', function() {
			expect(new Experiments(test)).toBeDefined();
		});
		
		it('complain about invalid test names', function() {
			expect(function () { 
				new Experiments({ id: 'gA___' });
			}).toThrow();
		});
		
	});

	describe("User segmentation", function () {
		
		it('should assign new users to an audience segment', function() {
			var a = new Experiments(test);
			expect(a.getId()).toEqual(851230);
		});
        
        it("segmentation should optionally be deterministic", function() {
			var a = new Experiments(test, { seed: 'abc' });
			expect(a.getId()).toEqual(731943);
		});
		
		it('should not reassign the user to audience segment if one already exists', function() {
			localStorage.setItem('ab__uid', '101');	
			var a = new Experiments(test);
			expect(a.getId()).toEqual(101);
		});
		
		it('should allocate the user to a test variant', function() {
			new Experiments(test).segment();
			expect(localStorage.getItem('ab__foo')).toEqual('{"id":"foo","variant":"A"}');
		});
	
        it('should fire an event when new user joins the experiment for the first time', function() {
            spyOn(listener, 'start');
            document.body.addEventListener('experiments.foo.started', listener.start, true);
            new Experiments(test).segment();
            new Experiments(test).segment(); // call twice to ensure start event is only triggered once
            expect(listener.start.calls.count()).toEqual(1);
            expect(listener.start.calls.mostRecent().args[0].detail.variant).toEqual("A");

		});

		it('should put all non-participating users in a "not in test" group', function() {
			var t = Object.create(test, { audienceOffset: { value: 0.3 } }); 
			new Experiments(t).segment();
			expect(localStorage.getItem('ab__foo')).toEqual('{"id":"foo","variant":"not-in-test"}');
		});
		
        it('should not fire a start event when a user is put in to the "not in test" group', function() {
            spyOn(listener, 'start');
            document.body.addEventListener('experiments.foo.started', listener.start, true);
			var t = Object.create(test, { audienceOffset: { value: 0.3 } }); 
			new Experiments(t).segment();
            expect(listener.start.calls.count()).toEqual(0);
		});
	
		it("should not segment user if they already belong to the test", function() {
			var t = '{"id":"foo","variant":"B"}';
			localStorage.setItem('ab__foo', t);	
			new Experiments(test).segment();
			expect(localStorage.getItem('ab__foo')).toEqual(t);
		});

		it("should not segment user if test can't be run", function() {
			var t = Object.create(test, { canRun: { value: function () {
					return false;
				}
			}}); 
			new Experiments(t).segment();
			expect(localStorage.getItem('ab__foo')).toBeNull();
		});
		
		it("Mark the test as complete", function() {
            spyOn(listener, 'complete');
            document.body.addEventListener('experiments.foo.complete', listener.complete, true);
            var a = new Experiments(test).segment().complete();
			expect(a.isComplete).toBeTruthy();
			expect(localStorage.getItem('ab__foo')).toEqual('{"id":"foo","variant":"A","complete":true}');
            expect(listener.complete.calls.count()).toEqual(1);
		});
		
		it('should allow the forcing of users in to a given test and variant', function () {
			var t = Object.create(test, { audienceOffset: { value: 0.3 } }); 
			new Experiments(t, { variant: 'B' }).segment();
			expect(localStorage.getItem('ab__foo')).toEqual('{"id":"foo","variant":"B"}');
		});

        it('complain if a user specified variant does not exist in the experiment', function() {
			expect(function () { 
			    new Experiments(test, { variant: 'X' });
			}).toThrow();
		});
		
        it('forcing of users in to a given variant should overwrite an existing variant', function () {
			localStorage.setItem('ab__foo', '{"id":"foo","variant":"C"}');
			var t = Object.create(test, { audienceOffset: { value: 0.3 } });
			new Experiments(t, { variant: 'B' }).segment();
			expect(localStorage.getItem('ab__foo')).toEqual('{"id":"foo","variant":"B"}');
		});

		it("should not segment user if the test has expired", function() {
			var dateInThePast = new Date(2000, 1, 1); 
			var t = Object.create(test, { expiry: { value: dateInThePast }}); 
			new Experiments(t).segment();
			expect(localStorage.getItem('ab__foo')).toBeNull();
		});
		
		it('should remove participation from a test', function () {
			var a = new Experiments(test).segment();
			expect(localStorage.getItem('ab__foo')).toEqual('{"id":"foo","variant":"A"}');
			a.clean();
			expect(localStorage.getItem('ab__foo')).toBeNull();
		});
		
	});

	describe("Running tests", function () {

		it('should be able to start test', function() {
			var variant = test.variants[0];
			spyOn(variant, 'test');
			new Experiments(test).segment().run();
			expect(variant.test.calls.count()).toBe(1);
		});
		
        it('should affix a css flag with the ', function() {
			new Experiments(test).segment().run();
			expect(document.documentElement.className).toContain(' foo:A');
		});

	});

	describe("Analytics", function () {

		it('should return the variant of a test that current user is participating in', function () {
			var ab = new Experiments(test).segment();
			expect(ab.getParticipation().variant).toBe('A');
		});

	});

});
