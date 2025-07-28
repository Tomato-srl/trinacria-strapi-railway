'use strict';

/**
 * wallet-user service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::wallet-user.wallet-user');
