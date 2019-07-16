
                // Search results objects is beaten into chunks. That means that there are multiple objects for a single search result.
                // The intention of the code below is to group all objects that belong to on search result.

                suggestions.forEach(item => {
                    // Top level grouping check for "codename" match
                    if (groupedSuggestions.filter(groupedItem => groupedItem.codename === item.codename).length === 0) {
                        var tempItem = {};
                        tempItem.codename = item.codename;

                        // Filter only objectss that match the codename
                        var contentCodename = suggestions.filter(codenameItem => codenameItem.codename === item.codename);

                        // Sort them by order
                        var compare = (a, b) => {
                            if (a.order < b.order) { return -1; }
                            if (a.order > b.order) { return 1; }
                            return 0;
                        }
                        contentCodename.sort(compare);

                        // Copy helper object that stores info about highlighting of the first object
                        tempItem._highlightResult = contentCodename[0]._highlightResult

                        // Group content values and headings
                        var tempHeading = '';
                        var tempContent = '';

                        contentCodename.forEach(contentItem => {
                            // Second level grouping check for "heading" match
                            if (tempHeading !== contentItem.heading) {
                                tempContent += contentItem.heading;
                            }

                            tempHeading = contentItem.heading;
                            tempContent += contentItem.content;
                        });

                        tempItem.content = tempContent;

                        groupedSuggestions.push(tempItem);
                    }
                });

                hitsSource(query, (suggestions) => {
                    var limitedSuggestions = [];

                    suggestions.forEach(item => {
                        if (limitedSuggestions.filter(groupedItem => groupedItem.codename === item.codename).length === 0) {
                            limitedSuggestions.push(item);
                        }

                        if (limitedSuggestions.length === 8) {
                            callback(limitedSuggestions);
                        }
                    });

                    callback(limitedSuggestions);
                });
