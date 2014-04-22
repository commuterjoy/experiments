
/* */
var Ab = function (profile, opts) {
	
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
};

Ab.prototype.min = 0;

Ab.prototype.max = 1000;

Ab.prototype.uidKey = 'ab__uid';

Ab.prototype.storagePrefix = 'ab__';

Ab.prototype.profile = {};

Ab.prototype.isComplete = false;

Ab.prototype.idValidator = /^[a-z0-9-]{1,10}$/; 

Ab.prototype.getParticipation = function () {
	var db = localStorage.getItem(this.storagePrefix);
	return (db) ? JSON.parse(db) : {};
}

Ab.prototype.removeParticipation = function () {
	return localStorage.removeItem(this.storagePrefix);
}

Ab.prototype.addParticipation = function(test, variantId) {
	localStorage.setItem(this.storagePrefix, JSON.stringify({
		"id": test,
		"variant": variantId
	}));
}

Ab.prototype.hasExpired = function () {
	return (new Date() > this.profile.expiry);
}

Ab.prototype.clean = function () {
	this.removeParticipation();
}

Ab.prototype.segment = function () {
    
	var smallestTestId = this.max * this.profile.audienceOffset,
		largestTestId  = smallestTestId + this.max * this.profile.audience;

	// deterministically allocate the user in to a test variant
	var allocateVariant = function (id, profile) {
		return profile.variants[id % profile.variants.length].id;
	}
	
	// check if not already a member of this experiment
	if (this.getParticipation().id === this.profile.id) {
		return false;
	}

	// check the test has not passed it's expiry date
	if (this.hasExpired()) {
		return false;
	}

	// check the test can be exectuted in this context
	if (!this.profile.canRun.call(this)) {
		return false;
	}

	if (smallestTestId <= this.getId() && largestTestId > this.getId()) {
		var variant = allocateVariant(this.getId(), this.profile);
		this.addParticipation(this.profile.id, variant);
		return variant;
	} else {
		this.addParticipation(this.profile.id, 'not-in-test');
	}
}; 

Ab.prototype.hasId = function () {
	return !!localStorage.getItem(this.uidKey)
}

Ab.prototype.getId = function () {
	return parseInt(localStorage.getItem(this.uidKey));
}

Ab.prototype.setId = function (n) {
	localStorage.setItem(this.uidKey, n);
	return n;
}

Ab.prototype.allocateId = function () {
	
	// TODO for signed in people we should create a key off their user ids, I.e. deterministic 
	var generateRandomInteger = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min); 
	}

	switch (this.hasId()) {
		case true:
			return this.getId();
		default:
			return this.setId(generateRandomInteger(this.min, this.max));
	}
};

Ab.prototype.run = function () {
	var belongsTo = this.getParticipation().variant;
	this.profile.variants.forEach(function (v) {
		if (v.id === belongsTo) {
			v.test.call(self);
		};
	});
}

// a conversion
Ab.prototype.complete = function () {
	this.isComplete = true;
}

module.exports = Ab;
