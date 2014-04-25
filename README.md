A JavaScript AB testing framework, ported from
[http://www.github.com/guardian/frontend](guardian/frontend).

[AB testing's](http://en.wikipedia.org/wiki/A/B_testing) goal is to identify
changes to web pages that increase or maximize an outcome of interest.

## Goals

- 100% client-side
- Segmentation
    - Basic - audience is segmented in to random buckets. 
    - Deterministic - allows predictable allocation of users in to tests based
      on some external key (Eg, username) 
- Fixed duration tests - that automatically close and delete their footprint.
- Isolation of each test audience - so a user can not accidentally be in several
  tests at once.
- Agnostic of where the data is logged - most companies have their own customer
  data repositories.
- Minimal payload - ~2kb (minified + gzip) with no additional cookie overhead
  created. 

## Usage

Let's say we want to test the effectiveness of a button that says 'help' versus
one that says 'stuck?'.  

Our hypothesis is that, when a user sees an error message, 2% more people will click
'help' than 'stuck?'.

First we **profile** describes our test. We represent that has a plain
JavaScript object with a unique test identifier.

```
var profile = {
    id: 'help'
} 
```

Next we need to create our two **variants** - 'help' and 'stuck'.

In _experiments_ each test is represented by a JavaScript function, so we add
them to the profile. In this experiment we simply need to update the copy of
two buttons in the page, but tests can largely do whatever is needed - change
the layout, load in extra data, truncate bodies of text etc.

```
var profile = {
    id: 'help',
    variants: [ 
		{ 
			id: 'help',
			test: function () {
				$('.help-button').text('help'); 
			}
		},
		{
			id: 'stuck',
			test: function () {
				$('.help-button').text('stuck?'); 
			}
		}
	]
}
```

Now we need an **audience** for the test. Again we defined a property in our
profile. The profile defines the audience as a % of your total visitors, so if
we want 10% of people to participate in the test we can state an audience of
'0.1', or 5% an audience of '0.05'.

```
var profile = {
    id: 'help',
    audience: 0.1,   // ie. 0.1 = 10%
    variants: [ 
	    ...
    ]
}
```

Often we want to run several tests simultaneously and be confident that
variations in one test aren't influencing a second. For this we use the idea of
a **audience offset**.

Each user in a test is assigned a persistent number, evenly distributed from 1
to 1,000,000. We can allocate blocks of these users to individual tests.

For example, a profile with an audience of 10% and offset of 0.3 will allocate
all the users with an identifier in the range 300,000 to 400,000 to the test
and split the variants evenly between this group of people.

In the profile below we would expect, 

- 5% of people to be allocated to the 'help' group  
- 5% of people to be allocated to the 'stuck' group  
- 90% of people to not be in the test.

The later group can obviously be selected for other tests.

```
var profile = {
    id: 'help',
    audience: 0.1,
    audienceOffset: 0.3, 
    variants: [ 
	    ...
    ]
}
```

A good AB test runs for a fixed period of time. For this reason each test
profile must have an **expiry** date, represented as JavaScript Date object.

If the date is the past the test framework will refuse to execute the test.


```
var profile = {
    id: 'help',
    expiry: new Date(2015, 1, 1)    // ie. runs until 1 Jan, 2015
    ...
}
```

Lastly we might want to scope the test to an particular context. For example,
our help test should not be executed on pages that do not produce error
messages.

The **canRun** function is evaluated each time the test is loaded and decides
if the test should be run.

```
var profile = {
    id: 'help',
	canRun: function () {
        return (page.config.type === 'article');
	}
    ...
}
```

With our profile we can now instantiate a test, segment the audience and run it.

```
var help = new Ab(profile).segment().run();
```

### Seeding

Often the goal of an AB test is to track a users behaviour over a period of
time - often over several sessions and often over several devices. 

Purely client-side test frameworks make this hard as cookies and localStorage
are somewhat volatile and, more crtically, local to a web browser on a single
device.

One approach to solving this problem is using [seeded random number
generators](https://github.com/davidbau/seedrandom).

These are deterministic algorithms that can, given the same key, generate an
evenly distributed set of numbers, which we can fairly segment on. 

For example, lets say we have user ID of 'UID=314146' stashed in a cookie. We
can extract that and pass it to the framework to repeatedly bucket the user in
to the same id and same test variant, Eg. 

```
var k = getCookie('UID').split('=')[1];  // k = 314146
new Ab(profile, { seed: key }).segment().run();
```

This is very useful when testing people across different devices over long
periods of time and, helpfully, independent of needing a persistance layer
beyond any current sign-in system. 

## Demo

Compile the code and open the example.html file in _./demos_

### Running a test

With developer tools, we can feed the above profile in to the AB test
framework, force our variant to '_pink_', then _run_ the test. 

```
var a = new Ab(p, { variant: 'pink' }).run()
```

You should see the page background turn pink, and running the test on every
subsequent visit will turn the page pink until the test has expired.


Allocate yourself in to the control group and re-run the test and the
background should turn white.

```
var a = new Ab(p, { variant: 'control' }).run();
```

For the duration of the test we can track the data of that user (say, pages per
visit or scroll depth) and compare with the control group to see if that
variant had the positive impact we thought it would have.

### Segmentation

You can inspect data the tests create in local storage.

Firstly, each test subject is allocated a persistant id (an integer) that is
shared across tests.

```
localStorage.getItem('ab__uid');
```

Next, each test remembers the variant the user is in over mulitple sessions,

```
localStorage.getItem('ab__background'); 
```

In the real world we want the test subjects allocated randomly in to a variants
(or excluded from the test), so we don't specify the variant in the _Ab_
constructor and invoke `segment()` instead, before running the experiment,

```
var a = new Ab(profile).segment().run();
```

The `segment()` function decides if a user should be in the test, and, if they
are, splits the audience between a 'control' group and a number of 'variants'.
