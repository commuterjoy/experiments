A JavaScript AB testing framework, ported from [http://www.github.com/guardian/frontend](guardian/frontend).

Each AB test is represented by a JavaScript object describing the profile of the test to be undertaken. 

```
var profile = { 
	id: 'background', // A unique name for the test.
	audience: 0.1, // A percent of the users you want to run the test on, Eg. 0.1 = 10%.
	audienceOffset: 0.8, // A segment of the users you want to target the test at. 
	expiry: new Date(2015, 1, 1), // The end date of the test 
	variants: [ // An array of two functions - the first representing the control group, the second the variant.
		{ 
			id: 'control',
			test: function () {
				document.body.style.backgroundColor = '#ffffff';
			}
		},
		{
			id: 'pink',
			test: function () {
				document.body.style.backgroundColor = '#c52720'; // this test turns the page background red
			}
		}
	],
	canRun: function () { // Preconditions that all the test to run, or not
		return true;
	}
}
```

## Demo

Compile the code and open the example.html file in _./demos_

With developer tools, we can feed the profile in to the AB test framework, force our variant to '_pink_', then _run_ the test. 

```
var a = new Ab(profile, { variant: 'pink' })
a.run();
```

You should see the page background turn pink, and running the test on every subsequent visit will turn the page pink until the test has expired.

During this time we can track the data of that user (say, pages per visit) and compare with the control group to see if that variant had the impact we thought it would have, which is the essence of a AB test.

You can inspect data this test creates in local storage.

Firstly, each test subject is allocated a persistant id (an integer),

```
localStorage.getItem('ab__uid'); // Eg, "3467"
```

Next, each test remembers the variant the user is in over mulitple sessions,

```
localStorage.getItem('ab__background'); // Eg, '{"id":"background","variant":"pink"}'
```

In the real world we want the test subjects allocated randomly in to a variants (or excluded from the test), so we don't specify the variant in the _Ab_ constructor and invoke `segment()` instead,

```
var a = new Ab(profile);
a.segment(); // assign a user in to a test variant 
a.run();
```

The `segment()` decides if a user should be in the test, and if they are, then splits the audience between a 'control' group and a number of 'variants'.

Segmentation is fairly trivial at the moment, but later it can be used to certain types of users (Eg, every international user who has visited more than 3 times a week).
