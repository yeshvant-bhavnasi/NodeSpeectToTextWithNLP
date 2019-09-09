// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
//hello

var urlEndings = {"PolicyCenter":"/pc/PolicyCenter.do",
                  "ClaimCenter":"/cc/ClaimCenter.do",
                  "BillingCenter":"/bc/BillingCenter.do",
                  "ContactManager":"/ab/ContactManager.do"};

function addBookmarks() {
  var envName = document.getElementById('environment').value;
  console.log("for environment " + envName);
  var url = document.getElementById('url').value;
  console.log("and for url " + url);

  if (envName && url) {
    chrome.bookmarks.getTree(function(tree) {
      var bookmarkBar = tree[0].children[0]
      chrome.bookmarks.create({'parentId': bookmarkBar.id,
                             'title': envName} ,
                           function(newFolder){
                             console.log('created new bookmarks folder ' + newFolder );

                             for (var key in urlEndings) {

                               var bookmark = {'parentId':newFolder.id,
                                              'title':key,
                                              'url':url+urlEndings[key]};
                              chrome.bookmarks.create(bookmark,function(newBookmark) {
                                console.log('created new bookmark ' + bookmark);
                              });
                           }
                        });
    });

  } else {
    console.log("Please provide environment name und base/port 80 url");
  }
  //window.close();
}

console.log(document.getElementById('createBookmarksButton'));
document.getElementById('createBookmarksButton').addEventListener('click', addBookmarks);
