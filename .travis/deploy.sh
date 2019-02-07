#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")/.." \
    || exit 1

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Skip deployment for pull requests
if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
    exit 0
fi

# Only execute the following if the commit is made to the `master` or `develop` branches
if [ "$TRAVIS_BRANCH" == "master" ]; then
    GIT_DESTINATION_LIVE=$GIT_DESTINATION_LIVE_MASTER
    GIT_DESTINATION_PREVIEW=$GIT_DESTINATION_PREVIEW_MASTER
elif [ "$TRAVIS_BRANCH" == "develop" ]; then
    GIT_DESTINATION_LIVE=$GIT_DESTINATION_LIVE_DEVELOP
    GIT_DESTINATION_PREVIEW=$GIT_DESTINATION_PREVIEW_DEVELOP
else
    exit 0
fi

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

main () {
    declare -r TMP_DIR_PREVIEW="$(mktemp -d XXXXX)"
    declare -r TMP_DIR_LIVE="$(mktemp -d XXXXX)"

    cd "$TMP_DIR_PREVIEW"
    {
        git config --global user.email "$GIT_USER_EMAIL" \
          && git config --global user.name "$GIT_USER_NAME" \
          && git init \
          && git add -A \
          && git commit --message "$TRAVIS_COMMIT_MESSAGE" \
          && git push --quiet --force --set-upstream "https://$GIT_USER_NAME:$GIT_PASSWORD@$GIT_DESTINATION_PREVIEW" master
    } || {
        exit 1
    }

    cd "$TMP_DIR_LIVE"
    {
        git init \
          && git add -A \
          && git commit --message "$TRAVIS_COMMIT_MESSAGE" \
          && git push --quiet --force --set-upstream "https://$GIT_USER_NAME:$GIT_PASSWORD@$GIT_DESTINATION_LIVE" master
    } || {
        exit 1
    }

    rm -rf "$TMP_DIR_PREVIEW"
    rm -rf "$TMP_DIR_LIVE"
}

main "$@"
