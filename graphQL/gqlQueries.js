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
        itemsByType(type: "navigation_item", limit: 0, depth: 3, order: "", urlSlug: "tutorials") {
            ... on NavigationItemContentType {
                title {
                    value
                }
                url {
                    value
                }
                children {
                    ... on ScenarioContentType {
                        title {
                            value
                        }
                        short_title {
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
                                        short_title {
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
        }
    }
    `,
    navigationItem: (urlSlug) => {
        return `
        {
            itemsByType(type: "navigation_item", limit: 1, depth: 0, order: "", urlSlug: "${urlSlug}") {
                ... on NavigationItemContentType {
                    title {
                        value
                    }
                    url {
                        value
                    }
                    children {
                        ... on ScenarioContentType {
                            url {
                                value
                            }
                        }
                    }
                }
                
            }
        } 
        `
    },
    scenario: (urlSlug) => {
        return `
        {
            itemsByType(type: "scenario", limit: 0, depth: 1, order: "", urlSlug: "${urlSlug}") {
                ... on ScenarioContentType {
                    title {
                        value
                    }
                    url {
                        value
                    }
                    description {
                        value
                    }
                    content {
                        value
                    }
                }
            }
        } 
        `
    },
    topic: (urlSlug) => {
        return `
        {
            itemsByType(type: "topic", limit: 0, depth: 1, order: "", urlSlug: "${urlSlug}") {
                ... on TopicContentType {
                    url {
                        value
                    }
                    children {
                        ... on ArticleContentType {
                            url {
                                value
                            }
                        }
                    }
                }
            }
        } 
        `
    },
    article: (urlSlug) => {
        return `
        {
            itemsByType(type: "article", limit: 0, depth: 1, order: "", urlSlug: "${urlSlug}") {
                ... on ArticleContentType {
                    system {
                        ... on SystemInfo {
                            lastModified
                        }
                    }
                    title {
                        value
                    }
                    url {
                        value
                    }
                    description {
                        value
                    }
                    author {
                        ... on AuthorContentType {
                            name {
                                value
                            }
                        }
                    }
                    content {
                        value
                    }
                }
            }
        } 
        `
    }
}


module.exports = queries;