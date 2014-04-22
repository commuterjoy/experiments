
/* */
var Ab = function (profile) {
	this.profile = profile;
	this.allocateId();	
	this.storagePrefix += profile.id.toLowerCase();
};

Ab.prototype.min = 0;

Ab.prototype.max = 1000;

Ab.prototype.uidKey = 'ab__uid';

Ab.prototype.storagePrefix = 'ab__';

Ab.prototype.profile = {};

Ab.prototype.isComplete = false;

Ab.prototype.getParticipation = function () {
	var db = localStorage.getItem(this.storagePrefix);
	return (db) ? JSON.parse(db) : {};
}

Ab.prototype.addParticipation = function(test, variantId) {
	localStorage.setItem(this.storagePrefix, JSON.stringify({
		"id": test,
		"variant": variantId
	}));
}

Ab.prototype.segment = function () {
    
	var smallestTestId = this.max * this.profile.audienceOffset,
		largestTestId  = smallestTestId + this.max * this.profile.audience;

	// deterministically allocate the user in to a test variant
	var allocateVariant = function (id, profile) {
		return profile.variants[id % profile.variants.length].id;
	}
	
	// check if not a member of this experiment
	if (this.getParticipation().id === this.profile.id) {
		return false;
	}

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

// a conversion
Ab.prototype.complete = function () {
	this.isComplete = true;
}

module.exports = Ab;
