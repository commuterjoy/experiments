
/* */
var Ab = function (profile) {
	this.profile = profile;
	this.allocateId();	
};

Ab.prototype.min = 0;

Ab.prototype.max = 1000;

Ab.prototype.uidKey = 'ab__uid';

Ab.prototype.db = 'ab__stash'; // { 'test-id': '<variant>' } 

Ab.prototype.profile = {};

Ab.prototype.getParticipations = function () {
	return JSON.parse(localStorage.getItem(this.db)) || {};
}

Ab.prototype.addParticipation = function(test, variantId) {
	var participations = this.getParticipations();
	participations[test] = {
		variant: variantId
	};
	localStorage.setItem(this.db, JSON.stringify(participations));
}

Ab.prototype.segment = function () {
    
	var smallestTestId = this.max * this.profile.audienceOffset;
	var largestTestId  = smallestTestId + this.max * this.profile.audience;

	var allocateVariant = function (id, profile) {
		return profile.variants[id % profile.variants.length].id;
	} 

	if (smallestTestId <= this.getId() && largestTestId > this.getId()) {
		var variant = allocateVariant(this.getId(), this.profile);
		this.addParticipation(this.profile.id, variant);
		return variant;
	}

	return 'B';
}; 

/****/

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
	
	// TODO for signed in people we should create a key off their user ids. 
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

module.exports = Ab;
