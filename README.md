| [master](https://github.com/KenticoDocs/kontent-docs-web/tree/master) | [develop](https://github.com/KenticoDocs/kontent-docs-web/tree/develop) |
|:---:|:---:|
| [![Build Status](https://travis-ci.com/KenticoDocs/kontent-docs-web.svg?branch=master)](https://travis-ci.com/KenticoDocs/kontent-docs-web/branches) | [![Build Status](https://travis-ci.com/KenticoDocs/kontent-docs-web.svg?branch=develop)](https://travis-ci.com/KenticoDocs/kontent-docs-web/branches) |

# Kentico Kontent Documentation - Website

Kentico Kontent documentation portal, which utilizes [Kentico Kontent](https://app.kontent.ai/) as a source of its content.

## Overview
1. The website is written in JavaScript.
2. It uses [express.js](https://expressjs.com/) framework for server-side rendering and [Kentico Kontent Delivery SDK](https://github.com/Kentico/kontent-delivery-sdk-js) for content retrieval from Kentico Kontent project.
3. Additionally, [Autocomplete.js](https://github.com/algolia/autocomplete.js) package supports the search box that is connected to the indexed content on Algolia.

## Setup

### Prerequisites
1. Node (+npm) installed
2. Any JavaScript IDE installed
2. Subscription on Kentico Kontent

### Instructions
1. Clone the project repository.
2. Run `npm install` in the terminal.
3. Run `npm run debug` to start a development server.
4. The website can be opened in your browser at http://localhost:3000.

#### Required environmental variables
* `KC.ProjectId` - Kentico Kontent project ID
* `KC.PreviewApiKey` - Kentico Kontent preview API key (set this key to retrieve preview content from Kentico Kontent)

#### Optional environmental variables
Without the following variables, related features will not work on the website.
* `Search.ApiKey` - Algolia search-only API key (used for site search)
* `Search.AppId` - Algolia application ID (used for site search)
* `Search.IndexName` - Index name in Algolia application (used for site search)
* `APPINSIGHTS_INSTRUMENTATIONKEY` - Application Insights key (used for application monitoring)
* `GTM.id` - Google Tag Manager ID (used for analytics)
* `Intercom.id` - Intercom account ID (used for support chat)
* `LMS.id` - Kentico e-Learning API key (used for certification course and exam registration)
* `Recaptcha-v3.secret` - Google Recaptcha v3 secret API key (used for forms robot protection)
* `Recaptcha-v3.site` - Google Recaptcha v3 site API key (used for forms robot protection)
* `Recaptcha-v2.secret` - Google Recaptcha v2 secret API key (used for forms robot protection)
* `Recaptcha-v2.site` - Google Recaptcha v2 site API key (used for forms robot protection)
* `Webhook.Cache.Invalidate.PlatformsConfig` - Kentico Kontent Webhook token (used for PlatformsConfig cache invalidation)
* `Webhook.Cache.Invalidate.UrlMap` - Kentico Kontent Webhook token (used for UrlMap cache invalidation)
* `Webhook.Cache.Invalidate.CommonContent` - Kentico Kontent Webhook token (used for common content cache invalidation)
* `Jira.User` - User email for a Jira account (used for feedback form)
* `Jira.Token` - Jira API key (used for feedback form)
* `Jira.TMSNTST` - Jira Project codename (used for feedback form)
* `Jira.IssueType` - Jira Issue index (used for feedback form)
* `referenceRenderUrl` - URL of the Open API Processor that provides HTML of API references

## How To Contribute
Feel free to open a new issue where you describe your proposed changes, or even create a new pull request from your branch with proposed changes.

## Licence
All the source codes are published under MIT licence.
