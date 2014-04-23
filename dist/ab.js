!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Ab=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/*global module*/

/**
 * Represents a single Ab test
 */
var Ab = function (profile, opts) {

	"use strict";
	
	this.opts = opts || {};
	this.profile = profile;
	this.storagePrefix += profile.id;
	
	// All users need to be allocated to a test percentile
	this.allocateId();

	if (!this.idValidator.test(this.profile.id)) {
		throw new Error('Invalid test profile id');
	}
	
	// if a variant is supplied then force the user in to that test
	if (!!this.opts.variant) { 
		this.addParticipation(this.profile.id, this.opts.variant);
	}

	return this;
};

Ab.prototype.min = 0;

Ab.prototype.max = 1000000;

Ab.prototype.uidKey = 'ab__uid';

Ab.prototype.storagePrefix = 'ab__';

Ab.prototype.profile = {};

Ab.prototype.isComplete = false;

Ab.prototype.idValidator = /^[a-z0-9-]{1,10}$/; 

Ab.prototype.getParticipation = function () {
	"use strict";
	var db = localStorage.getItem(this.storagePrefix);
	return (db) ? JSON.parse(db) : {};
};

Ab.prototype.removeParticipation = function () {
	"use strict";
	return localStorage.removeItem(this.storagePrefix);
};

Ab.prototype.addParticipation = function(test, variantId) {
	"use strict";
	localStorage.setItem(this.storagePrefix, JSON.stringify({
		"id": test,
		"variant": variantId
	}));
};

Ab.prototype.hasExpired = function () {
	"use strict";
	return (new Date() > this.profile.expiry);
};

Ab.prototype.clean = function () {
	"use strict";
	this.removeParticipation();
	return this;
};

Ab.prototype.segment = function () {
	"use strict";
    
	var smallestTestId = this.max * this.profile.audienceOffset,
		largestTestId  = smallestTestId + this.max * this.profile.audience;

	// deterministically allocate the user in to a test variant
	var allocateVariant = function (id, profile) {
		return profile.variants[id % profile.variants.length].id;
	};
	
	// check if not already a member of this experiment
	if (this.getParticipation().id === this.profile.id) {
		return this;
	}

	// check the test has not passed it's expiry date
	if (this.hasExpired()) {
		return this;
	}

	// check the test can be exectuted in this context
	if (!this.profile.canRun.call(this)) {
		return this;
	}

	if (smallestTestId <= this.getId() && largestTestId > this.getId()) {
		var variant = allocateVariant(this.getId(), this.profile);
		this.addParticipation(this.profile.id, variant);
	} else {
		this.addParticipation(this.profile.id, 'not-in-test');
	}
	
	return this;
}; 

Ab.prototype.hasId = function () {
	"use strict";
	return !!localStorage.getItem(this.uidKey);
};

Ab.prototype.getId = function () {
	"use strict";
	return parseInt(localStorage.getItem(this.uidKey));
};

Ab.prototype.setId = function (n) {
	"use strict";
	localStorage.setItem(this.uidKey, n);
	return n;
};

Ab.prototype.allocateId = function () {
	"use strict";
	
	// TODO for signed in people we should create a key off their user ids, I.e. deterministic 
	var generateRandomInteger = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min); 
	};

	switch (this.hasId()) {
		case true:
			return this.getId();
		default:
			return this.setId(generateRandomInteger(this.min, this.max));
	}
};

Ab.prototype.run = function () {
	"use strict";
	var belongsTo = this.getParticipation().variant;
	this.profile.variants.forEach(function (v) {
		if (v.id === belongsTo) {
			v.test.call();
		}
	});
	return this;
};

// a conversion
Ab.prototype.complete = function () {
	"use strict";
	this.isComplete = true;
	return this;
};

module.exports = Ab;

},{}]},{},[1])
(1)
});