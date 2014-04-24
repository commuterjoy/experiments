/*global module,require */

require('seedrandom');

/**
 * Represents a single Ab test
 * @type {Function}
 * @param {Object} profile
 * @param {Object} opts (optional)
 */
var Ab = function (profile, opts) {

    "use strict";

    this.opts = opts || {};
    this.seed = this.opts.seed;
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

/**
 * Represents the minimum end of the range of a user's ID. Ie. Allocation 
 * of user ID's should be evenly distributed between min and max to ensure
 * the segmention is fair. 
 * @type {Number}
 */
Ab.prototype.min = 0;

/**
 * Represents the upper end of the range of a user's ID. 
 * @type {Number}
 */
Ab.prototype.max = 1000000;

/**
 * The localStorage key of the user id. 
 * @type {String}
 */
Ab.prototype.uidKey = 'ab__uid';

/** 
 * If set, the allocation of the uidKey is generated with a seeded random
 * number. This makes the uid deterministic, while making the allocation evenly
 * distributed from 0 to 1 across all test subjects. A good idea is to seed the
 * number with a persistant string or integer held externally, for example a
 * logged in user account. This ensures the user gets allocated in to the same
 * test bucket and variant across devices, sessions etc. even if the
 * localStorage data is disgarded.
 *
 * Ref: https://github.com/davidbau/seedrandom
 *
 * @type {String}
 */
Ab.prototype.seed = undefined;

/**
 * The localstorage key prefix for each AB test. 
 * @type {String}
 */
Ab.prototype.storagePrefix = 'ab__';

/**
 * The test profile.
 * @type {Object}
 */
Ab.prototype.profile = {};

/**
 * Each test can be marked as complete (AKA. a conversion), so this property
 * represents the state of the test for ecah user.
 * @type {Boolean}
 */
Ab.prototype.isComplete = false;

/**
 * The valid pattern for each AB test's ID. 
 * @type {RegExp}
 */
Ab.prototype.idValidator = /^[a-z0-9-]{1,10}$/; 

/**
 * Gets the state of the user for this experiment
 * @return {Object} An object representing that state 
 */
Ab.prototype.getParticipation = function () {
    "use strict";
    var db = localStorage.getItem(this.storagePrefix);
    return (db) ? JSON.parse(db) : {};
};

/**
 * Remove a user's participation from an experiment
 * @return {Boolean} 
 */
Ab.prototype.removeParticipation = function () {
    "use strict";
    return localStorage.removeItem(this.storagePrefix);
};

/**
 * Allow a user to join an experiment
 */
Ab.prototype.addParticipation = function(test, variantId) {
    "use strict";
    localStorage.setItem(this.storagePrefix, JSON.stringify({
        "id": test,
        "variant": variantId
    }));
};

/** 
 * Tests whether the experiment has expired
 * @return {Boolean} 
 */
Ab.prototype.hasExpired = function () {
    "use strict";
    return (new Date() > this.profile.expiry);
};

/** 
 * Remove a user's participation from an experiment
 * @return {Object} 
 */
Ab.prototype.clean = function () {
    "use strict";
    this.removeParticipation();
    return this;
};

/**
 * Puts the user in a test variant
 * @return {Object}
 */
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

/** 
 * Has the user been allocated a permanent AB test ID
 * @return {Boolean} 
 */
Ab.prototype.hasId = function () {
    "use strict";
    return !!localStorage.getItem(this.uidKey);
};

/** 
 * Get the user's AB test ID
 * @return {Boolean} 
 */
Ab.prototype.getId = function () {
    "use strict";
    return parseInt(localStorage.getItem(this.uidKey));
};

/** 
 * Set the user's AB test ID
 * @return {String}
 */
Ab.prototype.setId = function (n) {
    "use strict";
    localStorage.setItem(this.uidKey, n);
    return n;
};

/** 
 * Allocate the user a permanent test ID
 * @return {Object} 
 */
Ab.prototype.allocateId = function () {
    "use strict";

    var generateRandomInteger = function(min, max, seed) {
        var rng = (seed) ? new Math.seedrandom(seed) : Math.random;
        return Math.floor(rng() * (max - min + 1) + min);
    };

    switch (this.hasId()) {
        case true:
            return this.getId();
        default:
            return this.setId(generateRandomInteger(this.min, this.max, this.seed));
    }
};

/** 
 * Run the AB test
 * @return {Object} 
 */
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

/** 
 * Mark the AB test as complete, IE. a successful conversion
 * @return {Object} 
 */
Ab.prototype.complete = function () {
    "use strict";
    this.isComplete = true;
    return this;
};

module.exports = Ab;
