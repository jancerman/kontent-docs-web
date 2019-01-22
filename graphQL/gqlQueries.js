const queries = {
    navigation: `
    {
        itemsByType(type: "home", limit: 0, depth: 0, order: "") {
            ... on HomeContentType {
                navigation {
                    ... on NavigationItemContentType {
                        title {
                            value
                        }
                        url {
                            value
                        }
                    }
                }
            }
            
        }
    } 
    `,
    subNavigation: `
    {
        itemsByType(type: "scenario", limit: 0, depth: 2, order: "") {
            ... on ScenarioContentType {
                title {
                    value
                }
                url {
                    value
                }
                children {
                    ... on TopicContentType {
                        title {
                            value
                        }
                        url {
                            value
                        }
                        children {
                            ... on ArticleContentType {
                                title {
                                    value
                                }
                                url {
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }
    } 
    `
}


module.exports = queries;