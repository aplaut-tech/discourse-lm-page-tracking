import { cleanDOM } from 'discourse/lib/clean-dom';
import { startPageTracking, onPageChange } from 'discourse/lib/page-tracker';
import { viewTrackingRequired } from 'discourse/lib/ajax';

export default {
  name: "page-tracking",

  initialize(container) {

    // Tell our AJAX system to track a page transition
    const router = container.lookup('router:main');
    router.on('willTransition', viewTrackingRequired);
    router.on('didTransition', cleanDOM);

    startPageTracking(router);

    // Out of the box, Discourse tries to track google analytics
    // if it is present
    if (typeof window._gaq !== 'undefined') {
      onPageChange((url, title) => {
        window._gaq.push(["_set", "title", title]);
        window._gaq.push(['_trackPageview', url]);
      });
      return;
    }

    // Also use Universal Analytics if it is present
    if (typeof window.ga !== 'undefined') {
      onPageChange((url, title) => {
        window.ga('send', 'pageview', {page: url, title: title});
      });
    }

    // And Google Tag Manager too
    if (typeof window.dataLayer !== 'undefined') {

      onPageChange((url, title) => {
        var app = container.lookup('controller:application');
        var route_name = app.currentRouteName;
        var event_payload = {} ; // {'event': 'virtualPageView'};

        if (route_name.match(/^discovery\./)) {
          if (route_name != 'discovery.categories') {
            var discovery_controller = container.lookup('controller:discovery');
            var category = discovery_controller.get('category');
            if (category) {
              event_payload['pageType'] = 'ForumCategoryPage';
              event_payload['discussionCategoryName'] = category.get('name');
              window.dataLayer.push(event_payload);
            }
          }
        } else if (route_name.match(/^topic\./)) {
          var topic_controller = container.lookup('controller:topic');
          var category = topic_controller.get('model.category');
          var topic = topic_controller.get('model');
          var posts = topic_controller.get('model.postStream.loadedAllPosts');

          if (category) {
            event_payload['pageType'] = 'ForumDiscussionPage';
            event_payload['discussionCategoryName'] = category.get('name');
          }
          if (topic) {
            Ember.$.getJSON("/t/" + topic.id).then(function(t) {
              event_payload['discussionID'] = topic.id;
              event_payload['discussionName'] = topic.title;
              event_payload['totalComments'] = topic.posts_count;
              event_payload['authorName'] = t.details.created_by.username;
              event_payload['totalLikes'] = topic.like_count;
              window.dataLayer.push(event_payload);
            })
          }
        }
      });
    }
  }
};
