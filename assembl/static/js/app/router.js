'use strict';

var Marionette = require('./shims/marionette.js'),
    routeManager = require('./routeManager.js');

var Router = Marionette.AppRouter.extend({
  controller: routeManager,

  //Note:  This should match with assembl/lib/frontend_url.py
  appRoutes: {
    "": "home",
    "edition": "edition",
    "partners": "partners",
    "notifications": "notifications",
    "settings": "settings",
    "about": "about",
    "discussion_preferences": "adminDiscussionPreferences",
    "sentrytest": "sentryTest",
    "user/notifications": "userNotifications",
    "user/profile": "profile",
    "user/account": "account",
    "user/discussion_preferences": "userDiscussionPreferences",
    "posts/*id": "post",
    "idea/*id": "idea",
    "profile/*id": "user",
    "G/*path": "groupSpec",
    "*actions": "defaults"
  }

});

module.exports = Router;

