'use strict';

/**
 * operator service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::operator.operator');
