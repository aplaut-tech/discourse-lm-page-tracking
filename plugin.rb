# name: lm-page-tracking
# version: 0.0.1
# authors: Shoppilot team

# register_asset 'javascripts/discourse/initializers/page-tracking.js.es6'

after_initialize do

  ApplicationHelper.module_eval do
    def google_universal_analytics_json(ua_domain_name = nil)
      result = {}
      if ua_domain_name
        result[:cookieDomain] = ua_domain_name.gsub(/^http(s)?:\/\//, '')
      end
      if current_user.present?
        result[:userAuth] = 1
        if (sso_record = current_user.single_sign_on_record)
          result[:userId] = sso_record.external_id
        end
      else
        result[:userAuth] = 0
      end
      if SiteSetting.ga_universal_auto_link_domains.present?
        result[:allowLinker] = true
      end
      result.to_json.html_safe
    end
  end
end
