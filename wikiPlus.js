run();

function run()
{
  //alert("Hello, You are using WikiPlus!");

  var maxNumber; //number of pages of history to process
  var dateLimit; //bool: limit history search by date
  var maxDays; //maximum number of days of history to search

  console.log("Loading saved options");

  //add status div
  $("body").append("<div id=\"wikiPlusStatus\"><p>WikiPlus</p><p id =\"statusP\"></p></div>");

  var $statusP = $("#statusP");

  $statusP.text("Loading saved options");

  chrome.storage.sync.get({
    //numberBoxChecked: true,
    numberInput: 10,
    dateBoxChecked: true,
    dateInput: 30
  }, function(items) {
    //debugger;
    var error = chrome.runtime.lastError; //todo:remove after testing
    //alert("items retrieved");

    maxNumber = items.numberInput;
    dateLimit = items.dateBoxChecked;
    maxDays = items.dateInput;

    continueAfterOptionsLoad();
  });

  //todo: it con take a good amount of time to load this data.  need a loading message
  function continueAfterOptionsLoad() {
    //debugger;

    $statusP.text("Getting page history");

    //var host = window.location.hostname; // #langCode#.wikipedia.org
    //var lang = host.split(".", 1)[0]; // 'en', 'de', 'es', etc.

    var pathArray = window.location.pathname.split("/");
    var title = pathArray[pathArray.length - 1];

    // //var postData = "pages=" + title + "&limit=" + maxNumber;
    // var postData = "pages=" + title + "&limit=" + maxNumber + "&dir=desc";
    //
    // //this doesn't work becasue if using descending results start at offset date and go backwards in time.
    // //if using ascending results results still start at offset date and we don't get the most recent results
    // // if (dateLimit)
    // // {
    // //   var offsetMS = Date.now() - maxDays * 8.64e7; //8.64e7 is the number of milliseconds in a day
    // //   var offsetDate = new Date(offsetMS);
    // //   postData += "&offset=" + toUTC8601DateString(offsetDate);
    // // }
    // //todo: fix date limit
    // debugger;
    // $.post("/wiki/Special:Export", postData, handleHistoryPageScrape, "xml").fail(handleHistoryPageScrapeFail);

    var postData = "action=query&format=xml&prop=revisions&titles=" + title + "&rvlimit=" + maxNumber + "&rvprop=ids|flags|timestamp|user|size|comment|tags|content";

    if (dateLimit)
    {
      var offsetMS = Date.now() - maxDays * 8.64e7; //8.64e7 is the number of milliseconds in a day
      var offsetDate = new Date(offsetMS);
      postData += "&rvstart=" + toUTC8601DateString(new Date(Date.now())) + "&rvend=" + toUTC8601DateString(offsetDate);
    }

    $.post("/w/api.php", postData, handleHistoryPageScrape, "xml").fail(handleHistoryPageScrapeFail);

    function handleHistoryPageScrape(data) { //data is XMLDocumnet

      var pageNode = data.getElementsByTagName("page")[0];

      if (pageNode == undefined) //no history pages meet the search criteria
      {
        //todo: do something better here
        alert("WikiPlus: No history pages match search criteria.");
      }
      else
      {
        // var testOutput = new XMLSerializer().serializeToString(data);

        var revisions = pageNode.getElementsByTagName("rev"); //revisions is a HTMLCollection;

        var ids = []; //revision ids
        var dates = []; //date strings in the format 2011-07-29T09:22:38Z todo: make sure UTC
        var userNames = []; //username
        var ips = [];
        var minor = []; //bool: true if minor edit
        var desc = []; //edit description
        var text = [];
        var html = [];
        //we can also get byte count from xml field if we want to
        //debugger;
        // if (dateLimit)
        // {
        //   var offsetMS = Date.now() - maxDays * 8.64e7; //8.64e7 is the number of milliseconds in a day
        //   var offsetDate = new Date(offsetMS);
        //   var minDateString = toUTC8601DateString(offsetDate);
        // }

        //for (var i = revisions.length - 1; i >= 0; i--) {
        //debugger;

        for (var i = 0; i < revisions.length; i++) {

          var id = revisions[i].getAttribute("revid");
          ids.push(id);
          dates.push(revisions[i].getAttribute("timestamp"));

          // var username = revisions[i].getElementsByTagName("username"); //returns HTMLCollection
          // if (username.length > 0 ) {
          //   userNames.push(username[0].innerHTML);
          // }
          // else { //ip address
          //   userNames.push("");
          // }
          // var ipAddress = revisions[i].getElementsByTagName("ip");
          // if (ipAddress.length > 0) {
          //   ips.push(ipAddress[0].innerHTML);
          // }
          // else {
          //   ips.push("");
          // }

          if (revisions[i].getAttribute("anon") === null)
          {
            userNames.push(revisions[i].getAttribute("user"));
            ips.push("");
          }
          else {
            userNames.push("");
            ips.push(revisions[i].getAttribute("user"));
          }

          if (revisions[i].getAttribute("minor") === null) {
            minor.push(false);
          }
          else {
            minor.push(true);
          }

          // var comments = (revisions[i].getElementsByTagName("comment"));
          // if (comments.length > 0) {
          //   desc.push(comments[0].innerHTML);
          // }
          // else {
          //   desc.push("");
          // }

          desc.push(revisions[i].getAttribute("comment"));

          text.push(revisions[i].getElementsByTagName("content")[0].innerHTML);

          html.push("");
        }

        parseText().then(continueAfterParsing);

        async function parseText()
        {
          for (var i = 0; i < text.length; i++)
          {
            html[i] = await parsoidJsapi.parse(text[i]);
            debugger;
          }
        }

        function continueAfterParsing() {
          debugger;
          console.log(html[0]);
        }

        //convert all revision text from wikiMarkup to html
        //todo: this is really slow.  diff first then html?
        //parsePages(0);
        //var charData = new DoubleLinkedList();
        //calculateDiffs();
        //var textToParse = getParserInput();

        //replace ampersand escaped characters
        //textToParse = textToParse.split("&lt;").join("<");
        //textToParse = textToParse.split("&gt;").join(">");
        //textToParse = textToParse.split("&amp;").join("%26");

        //parseWikiText(textToParse); //todo:testing

        // function getParserInput()
        // {
        //   debugger;
        //   var output = "";
        //   var node = charData.head;
        //   var lastVersions = [];
        //
        //   while (node)
        //   {
        //     //if versions change mark change
        //     var versionDiffs = getVersionDiffs(lastVersions, node.data.versions);
        //     if (versionDiffs.length > 0)
        //     {
        //       output += "§♥§"; //string representing start of version info
        //       for (var i = 0; i < versionDiffs.length; i++)
        //       {
        //         output += versionDiffs[i] + ',';
        //       }
        //       output = output.slice(0, -1);
        //       output += "♥§♥"; //string representing end of version CharInfo
        //     }
        //
        //     output += node.data.char;
        //     lastVersions = node.data.versions.slice();
        //     node = node.next;
        //   }
        //
        //   return output;
        // }
        //
        // //returns array of diffs between two version arrays.  version additions from arr1 to arr2 are represented as a positive number.
        // //version subtractions are represented as a negative number
        // function getVersionDiffs(arr1, arr2)
        // {
        //   //debugger;
        //   var index1 = 0;
        //   var index2 = 0;
        //   var output = [];
        //
        //   while (index1 < arr1.length && index2 < arr2.length)
        //   {
        //     if (arr1[index1] === arr2[index2])
        //     {
        //       index1++;
        //       index2++;
        //     }
        //     else if (arr1[index1] < arr2[index2])
        //     {
        //       output.push(arr1[index1] * -1);
        //       index1++;
        //     }
        //     else //arr1[index1] > arr2[index2]
        //     {
        //       output.push(arr2[index2]);
        //       index2++;
        //     }
        //   }
        //   while (index1 < arr1.length)
        //   {
        //     output.push(arr1[index1] * -1)
        //     index1++;
        //   }
        //   while (index2 < arr2.length)
        //   {
        //     output.push(arr2[index2])
        //     index2++;
        //   }
        //
        //   return output;
        // }
        //
        function calculateDiffs(){
          //debugger;

          $statusP.text("calculating differences");
          var dmp = new diff_match_patch();
          //dmp.Diff_EditCost = 10; //this only has effect on diff_cleanup

          if (text.length < 2)
          {
            alert(text.length + " result" + ((text.length === 0) ? "s" : ("" + " match search criteria.  No data to compare.")));
            return;
          }

          var results = new Array(text.length - 1);
          //var test2 = new Array(revisions.length - 1);
          //var test3 = new Array(revisions.length - 1);
          //var test4 = new Array(revisions.length - 1);

          //var stats = [];



          for (var i = 1; i < text.length; i++){
            var diffs = dmp.diff_main(text[0], text[i]);    //returns array of Diffs. Each diff is an array of an iteger then a string.
            //0 = text in both
            //1 = text in 2nd input but not in 1st.
            //-1 = text in 1st input but not in 2nd.

            //var diff2 = diff.slice();
            //var diff3 = diff.slice();
            //dmp.diff_cleanupSemantic(diff2);
            //var diff4 = diff2.slice();
            //dmp.diff_cleanupMerge(diff3);
            //dmp.diff_cleanupMerge(diff4);

            dmp.diff_cleanupSemantic(diffs);
            results[i-1] = diffs; //raw diffs

            //test2[i-1] = diff2; //semantic clean
            //test3[i-1] = diff3; //merge clean
            //test4[i-1] = diff4; //semantic then merge clean

            //stats.push([diff.length, diff2.length, diff3.length, diff4.length]);
            //console.log(diff.length + "  " + diff2.length  + "  " +  diff3.length + "  " +  diff4.length);

            //merge clean results in slightly fewer diffs than sematic clean. doing both doesn't result in much change in number

            //@testing
          }
          //
          //   //build linked list? of arrays containing character from text and data structure representing which versions it is in
          //   //loop through diffs.  add characters in each diff.  if diff is an addition, check to see if it is already there...do another diff with added characters not in original in that spot? yes?
          //
          //   //debugger;
          //
          //   var char = results[0][0][1].charAt(0); //fist version comparison, first diff, text portion
          //   var versions;
          //
          //   if (results[0][0][0] === -1){ //new version only
          //     versions = [1];
          //   }
          //
          //   else if (results[0][0][0] === 0){ //both versions
          //     versions = [1,2];
          //   }
          //
          //   else //results[0][0][0] === 1 -- old version only
          //   {
          //     versions = [2];
          //   }
          //
          //   //var data = [char, versions];
          //
          //   function CharInfo(char, versions)
          //   {
          //     this.char = char;
          //     this.versions = versions;
          //   }
          //   var charVerData = new CharInfo(char, versions.slice());
          //
          //   //charData.head = new Node(data);
          //   //charData.curNode = charData.head;
          //
          //   charData.insertAfterCurrent(charVerData);
          //
          //   for (var i = 1; i < results[0][0][1].length; i++)
          //   {
          //     char = results[0][0][1].charAt(i);
          //     charVerData = new CharInfo(char, versions.slice());
          //     charData.insertAfterCurrent(charVerData);
          //     charData.gotoNext();
          //     //data = [char, versions];
          //     //charData.curNode.next = new Node(data);
          //     //charData.curNode = charData.curNode.next;
          //   }
          //   //first diff in first comparison complete
          //   //debugger;
          //
          //   //loop through all remaining diffs in fist comparison
          //   for (var i = 1; i < results[0].length; i++)
          //   {
          //     if (results[0][i][0] === -1) //new version only
          //     {
          //       versions = [1];
          //     }
          //
          //     else if (results[0][i][0] === 0) //both versions
          //     {
          //       versions = [1,2];
          //     }
          //
          //     else //results[0][i][0] === 1 -- old version only
          //     {
          //       versions = [2];
          //     }
          //
          //     for (var j = 0; j < results[0][i][1].length; j++)
          //     {
          //       char = results[0][i][1].charAt(j);
          //       charVerData = new CharInfo(char, versions.slice());
          //       charData.insertAfterCurrent(charVerData);
          //       charData.gotoNext();
          //       //data = [char, versions];
          //       //charData.curNode.next = new Node(data);
          //       //charData.curNode = charData.curNode.next;
          //     }
          //   }
          //
          //   //first comparison complete.  loop through remaining comparisons
          //   for (var i = 1; i < results.length; i++)
          //   {
          //     charData.curNode = charData.head;
          //     //loop through diffs
          //     for (var j = 0; j < results[i].length; j++)
          //     {
          //       if (results[i][j][0] === -1) //new version only.
          //       {
          //         //debugger;
          //         //only in new version.  therefore data is already in charData.  no new version info to record.
          //
          //         //increment charData by number of characters in diff, skipping chars in charData that do not have version 0.
          //         for (var k = 0; k < results[i][j][1].length; k++)
          //         {
          //           if (charData.curNode.data.versions[0] !== 1) //fist version flag !== 1.  not a current version character
          //           {
          //             k--; //add one to the number of chars we must increment
          //           }
          //           //charData.curNode = charData.curNode.next;
          //           charData.gotoNext();
          //         }
          //         //debugger;
          //       }
          //       else if (results[i][j][0] === 0) //both versions.  need to add version info
          //       {
          //         //debugger;
          //         for (var k= 0; k < results[i][j][1].length; k++)
          //         {
          //           if (charData.curNode.data.versions[0] !== 1) //fist version flag !== 1.  not a current version character
          //           {
          //             k--; //add one to the number of chars we must increment
          //             //charData.curNode = charData.curNode.next;
          //             charData.gotoNext();
          //           }
          //           else
          //           //got a current version character
          //           {
          //             if (charData.curNode.data.char !== results[i][j][1].charAt(k))
          //             {
          //               //got a current version character but it doens't match what we are looking for from the diff.  this shouldn't happen
          //               alert("Error processing history. Code 001.");
          //               debugger;
          //               throw new Error("Error processing history. Code 001.");
          //             }
          //             else
          //             {
          //               //debugger;
          //               //characters match.  All is well.  Add the new version code to the character.
          //               charData.curNode.data.versions.push(i+2); // i+2 because there is one less number of comparisons(i) than versions and versions start at 1
          //               //charData.curNode = charData.curNode.next;
          //               charData.gotoNext();
          //             }
          //           }
          //         }
          //         //debugger;
          //       }
          //       else //(results[i][j][0] === 1) //old version only.
          //       {
          //         //debugger;
          //         //look for old version only stuff in charData
          //         //if (charData.curNode.next && charData.curNode.next.data.versions[0] !== 1)
          //         if (charData.curNode && charData.curNode.data.versions[0] !== 1)
          //         {
          //           var oldNode = charData.curNode;
          //           //got some old only stuff
          //           var oldChars = charData.curNode.data.char;
          //           while (charData.curNode.next && charData.curNode.next.data.versions[0] !== 1)
          //           {
          //             charData.gotoNext();
          //             oldChars += charData.curNode.data.char;
          //           }
          //
          //           charData.curNode = oldNode;
          //
          //           //do a diff on our diff and the old only text we already have
          //           var diffs2 = dmp.diff_main(oldChars, results[i][j][1]);
          //
          //           //diff result: -1 is only in existing: skip in charData
          //           //              0 is in both: add version
          //           //              1 is only in the old version we are comparing for the fist time: add chars and version
          //
          //           for (var k = 0; k < diffs2.length; k++)
          //           {
          //             if (diffs2[k][0] === -1)
          //             {
          //               for (var l = 0; l < diffs2[k][1].length; l++)
          //               {
          //                 charData.gotoNext();
          //               }
          //             }
          //             else if (diffs2[k][0] === 0)
          //             {
          //               for (var l = 0; l < diffs2[k][1].length; l++)
          //               {
          //                 //debugger;
          //                 charData.curNode.data.versions.push(i+2); //  i+2 because there is one less number of comparisons(i) than versions and versions start at 1
          //                 charData.gotoNext();
          //               }
          //             }
          //             else //diffs2[0] === 1
          //             {
          //               for (var l = 0; l < diffs2[k][1].length; l++)
          //               {
          //                 var insertChar = diffs2[k][1].charAt(l);
          //                 var insertData = new CharInfo(insertChar, [i+2]);  //i+2 because there is one less number of comparisons(i) than versions and versions start at 1
          //                 charData.insertBeforeCurrent(insertData);
          //
          //                 //todo: maybe we have to check the next diff with things in charData to see if we have our current charData there?  check during testing
          //               }
          //             }
          //           }
          //         }
          //         else
          //         {
          //           //no old version only characters found at this position. need to add these caracters and version info
          //           for (var k= 0; k < results[i][j][1].length; k++)
          //           {
          //             var insertChar = results[i][j][1].charAt(k);
          //             var insertData = new CharInfo(insertChar, [i+2]);// i+2 because there is one less number of comparisons(i) than versions and versions start at 1
          //             charData.insertBeforeCurrent(insertData);
          //             //charData.gotoNext();
          //           }
          //           //charData.gotoNext();
          //         }
          //         //debugger;
          //       }
          //     }
          //   }
          // }

          // function parseWikiText(wikiText)
          // {
          //   debugger;
          //   $statusP.text("parsing wikiText");
          //   postData = "action=parse&prop=text&format=xml&text=" + wikiText;
          //   $.post("/w/api.php", postData, handleParseText, "xml").fail(handleParseTextFail);
          //
          //   function handleParseText(HTMLdata) { //HTMLdata is XMLDocument
          //     debugger;
          //     var htmlText = HTMLdata.getElementsByTagName("text")[0].innerHTML;
          //     htmlText = htmlText.split("&gt;").join(">").split("&lt;").join("<").split("&amp;").join("&");
          //
          //
          //     var version1 = filterHTML(htmlText,["1"]);
          //
          //     document.body.innerHTML = version1;
          //
          //     //TODO: CONTINUE HERE
          //
          //   }
          // }

          // function filterHTML(htmlText, verArray)
          // {
          //   debugger;
          //
          //   var split1 = htmlText.split("§♥§");
          //   var output = "";
          //
          //   var includeIt = false;
          //
          //   for (var i = 1; i < split1.length; i++)
          //   {
          //     var split2 = split1[i].split("♥§♥");
          //     var versions = split2[0].split(",");
          //     var text = split2[1];
          //
          //     for (var j = 0; j < verArray.length; j++)
          //     {
          //       if (versions.includes("-" + verArray[j]))
          //       {
          //         includeIt = false;
          //         break;
          //       }
          //       else if (versions.includes(verArray[j]))
          //       {
          //         includeIt = true;
          //         break;
          //       }
          //     }
          //     if (includeIt)
          //     {
          //       output += text;
          //     }
          //   }
          //
          //   return output;
          // }

          // function parsePages(idIndex)
          // {
          //   //debugger;
          //   $statusP.text("parsing wikiText " + (idIndex + 1) + " of " + ids.length);
          //   postData = "action=parse&oldid=" + ids[idIndex] + "&format=xml&prop=text";
          //
          //   $.post("/w/api.php", postData, handleParsePost, "xml").fail(handleParsePostFail);
          //
          //   function handleParsePost(HTMLdata) { //HTMLdata is XMLDocument
          //     //debugger;
          //     var htmlText = HTMLdata.getElementsByTagName("text")[0].innerHTML;
          //     htmlText = htmlText.replace(new RegExp("&lt;", 'g'), "<");
          //     htmlText = htmlText.replace(new RegExp("&gt;", 'g'), ">");
          //
          //
          //     html.push(htmlText);
          //     if (html.length < ids.length)
          //     {
          //         //parse the next id
          //         parsePages(html.length);
          //     }
          //     else {
          //       continueAfterParsing();
          //     }
          //   }
          // }

          // function continueAfterParsing(){
          //   debugger;
          //
          //   $statusP.text("calculating differences");
          //   var dmp = new diff_match_patch();
          //   //dmp.Diff_EditCost = 10; //this only has effect on diff_cleanup
          //
          //   if (html.length < 2)
          //   {
          //     alert(html.length + " result" + ((html.length === 0) ? "s" : ("" + " match search criteria.  No data to compare.")));
          //     return;
          //   }
          //
          //   var results = new Array(html.length - 1);
          //   //var test2 = new Array(revisions.length - 1);
          //   //var test3 = new Array(revisions.length - 1);
          //   //var test4 = new Array(revisions.length - 1);
          //
          //   //var stats = [];
          //
          //
          //
          //   for (var i = 1; i < html.length; i++){
          //     var diffs = dmp.diff_main(html[0], html[i]);    //returns array of Diffs. Each diff is an array of an iteger then a string.
          //     //0 = text in both
          //     //1 = text in 2nd input but not in 1st.
          //     //-1 = text in 1st input but not in 2nd.
          //
          //     //var diff2 = diff.slice();
          //     //var diff3 = diff.slice();
          //     //dmp.diff_cleanupSemantic(diff2);
          //     //var diff4 = diff2.slice();
          //     //dmp.diff_cleanupMerge(diff3);
          //     //dmp.diff_cleanupMerge(diff4);
          //
          //     dmp.diff_cleanupSemantic(diffs);
          //     results[i-1] = diffs; //raw diffs
          //
          //     //test2[i-1] = diff2; //semantic clean
          //     //test3[i-1] = diff3; //merge clean
          //     //test4[i-1] = diff4; //semantic then merge clean
          //
          //     //stats.push([diff.length, diff2.length, diff3.length, diff4.length]);
          //     //console.log(diff.length + "  " + diff2.length  + "  " +  diff3.length + "  " +  diff4.length);
          //
          //     //merge clean results in slightly fewer diffs than sematic clean. doing both doesn't result in much change in number
          //
          //     //@testing
          //   }
          //
          //   //build linked list? of arrays containing character from text and data structure representing which versions it is in
          //   //loop through diffs.  add characters in each diff.  if diff is an addition, check to see if it is already there...do another diff with added characters not in original in that spot? yes?
          //
          //   //debugger;
          //   var charData = new DoubleLinkedList();
          //
          //   var char = results[0][0][1].charAt(0); //fist version comparison, first diff, text portion
          //   var versions;
          //
          //   if (results[0][0][0] === -1){ //new version only
          //     versions = [0];
          //   }
          //
          //   else if (results[0][0][0] === 0){ //both versions
          //     versions = [0,1];
          //   }
          //
          //   else //results[0][0][0] === 1 -- old version only
          //   {
          //     versions = [1];
          //   }
          //
          //   //var data = [char, versions];
          //
          //   function CharInfo(char, versions)
          //   {
          //     this.char = char;
          //     this.versions = versions;
          //   }
          //   var charVerData = new CharInfo(char, versions.slice());
          //
          //   //charData.head = new Node(data);
          //   //charData.curNode = charData.head;
          //
          //   charData.insertAfterCurrent(charVerData);
          //
          //   for (var i = 1; i < results[0][0][1].length; i++)
          //   {
          //     char = results[0][0][1].charAt(i);
          //     charVerData = new CharInfo(char, versions.slice());
          //     charData.insertAfterCurrent(charVerData);
          //     charData.gotoNext();
          //     //data = [char, versions];
          //     //charData.curNode.next = new Node(data);
          //     //charData.curNode = charData.curNode.next;
          //   }
          //   //first diff in first comparison complete
          //   //debugger;
          //
          //   //loop through all remaining diffs in fist comparison
          //   for (var i = 1; i < results[0].length; i++)
          //   {
          //     if (results[0][i][0] === -1) //new version only
          //     {
          //       versions = [0];
          //     }
          //
          //     else if (results[0][i][0] === 0) //both versions
          //     {
          //       versions = [0,1];
          //     }
          //
          //     else //results[0][i][0] === 1 -- old version only
          //     {
          //       versions = [1];
          //     }
          //
          //     for (var j = 0; j < results[0][i][1].length; j++)
          //     {
          //       char = results[0][i][1].charAt(j);
          //       charVerData = new CharInfo(char, versions.slice());
          //       charData.insertAfterCurrent(charVerData);
          //       charData.gotoNext();
          //       //data = [char, versions];
          //       //charData.curNode.next = new Node(data);
          //       //charData.curNode = charData.curNode.next;
          //     }
          //   }
          //
          //   //first comparison complete.  loop through remaining comparisons
          //   for (var i = 1; i < results.length; i++)
          //   {
          //     charData.curNode = charData.head;
          //     //loop through diffs
          //     for (var j = 0; j < results[i].length; j++)
          //     {
          //       if (results[i][j][0] === -1) //new version only.
          //       {
          //         //debugger;
          //         //only in new version.  therefore data is already in charData.  no new version info to record.
          //
          //         //increment charData by number of characters in diff, skipping chars in charData that do not have version 0.
          //         for (var k = 0; k < results[i][j][1].length; k++)
          //         {
          //           if (charData.curNode.data.versions[0] !== 0) //fist version flag !== 0.  not a current version character
          //           {
          //             k--; //add one to the number of chars we must increment
          //           }
          //           //charData.curNode = charData.curNode.next;
          //           charData.gotoNext();
          //         }
          //         //debugger;
          //       }
          //       else if (results[i][j][0] === 0) //both versions.  need to add version info
          //       {
          //         //debugger;
          //         for (var k= 0; k < results[i][j][1].length; k++)
          //         {
          //           if (charData.curNode.data.versions[0] !== 0) //fist version flag !== 0.  not a current version character
          //           {
          //             k--; //add one to the number of chars we must increment
          //             //charData.curNode = charData.curNode.next;
          //             charData.gotoNext();
          //           }
          //           else
          //           //got a current version character
          //           {
          //             if (charData.curNode.data.char !== results[i][j][1].charAt(k))
          //             {
          //               //got a current version character but it doens't match what we are looking for from the diff.  this shouldn't happen
          //               alert("Error processing history. Code 001.");
          //               debugger;
          //               throw new Error("Error processing history. Code 001.");
          //             }
          //             else
          //             {
          //               //debugger;
          //               //characters match.  All is well.  Add the new version code to the character.
          //               charData.curNode.data.versions.push(i+1); // i+1 because there is one less number of comparisons(i) than versions
          //               //charData.curNode = charData.curNode.next;
          //               charData.gotoNext();
          //             }
          //           }
          //         }
          //         //debugger;
          //       }
          //       else //(results[i][j][0] === 1) //old version only.
          //       {
          //         //debugger;
          //         //look for old version only stuff in charData
          //         //if (charData.curNode.next && charData.curNode.next.data.versions[0] !== 0)
          //         if (charData.curNode && charData.curNode.data.versions[0] !== 0)
          //         {
          //           var oldNode = charData.curNode;
          //           //got some old only stuff
          //           var oldChars = charData.curNode.data.char;
          //           while (charData.curNode.next && charData.curNode.next.data.versions[0] !== 0)
          //           {
          //             charData.gotoNext();
          //             oldChars += charData.curNode.data.char;
          //           }
          //
          //           charData.curNode = oldNode;
          //
          //           //do a diff on our diff and the old only text we already have
          //           var diffs2 = dmp.diff_main(oldChars, results[i][j][1]);
          //
          //           //diff result: -1 is only in existing: skip in charData
          //           //              0 is in both: add version
          //           //              1 is only in the old version we are comparing for the fist time: add chars and version
          //
          //           for (var k = 0; k < diffs2.length; k++)
          //           {
          //             if (diffs2[k][0] === -1)
          //             {
          //               for (var l = 0; l < diffs2[k][1].length; l++)
          //               {
          //                 charData.gotoNext();
          //               }
          //             }
          //             else if (diffs2[k][0] === 0)
          //             {
          //               for (var l = 0; l < diffs2[k][1].length; l++)
          //               {
          //                 //debugger;
          //                 charData.curNode.data.versions.push(i+1); // i+1 because there is one less number of comparisons(i) than versions
          //                 charData.gotoNext();
          //               }
          //             }
          //             else //diffs2[0] === 1
          //             {
          //               for (var l = 0; l < diffs2[k][1].length; l++)
          //               {
          //                 var insertChar = diffs2[k][1].charAt(l);
          //                 var insertData = new CharInfo(insertChar, [i+1]); // i+1 because there is one less number of comparisons(i) than versions
          //                 charData.insertBeforeCurrent(insertData);
          //
          //                 //todo: maybe we have to check the next diff with things in charData to see if we have our current charData there?  check during testing
          //               }
          //             }
          //           }
          //         }
          //         else
          //         {
          //           //no old version only characters found at this position. need to add these caracters and version info
          //           for (var k= 0; k < results[i][j][1].length; k++)
          //           {
          //             var insertChar = results[i][j][1].charAt(k);
          //             var insertData = new CharInfo(insertChar, [i+1]);// i+1 because there is one less number of comparisons(i) than versions
          //             charData.insertBeforeCurrent(insertData);
          //             //charData.gotoNext();
          //           }
          //           //charData.gotoNext();
          //         }
          //         //debugger;
          //       }
          //     }
          //   }
          //   debugger;
          //
          //   $statusP.text("complete.");
          //
          //   //TODO:
          //   //replace $("div#mw-content-text").html()
        }
      }
    }
  }
  //
  function handleHistoryPageScrapeFail(jqXHR, textStatus, errorThrown)
  {
    //   //todo: improve error handling
    alert("Problem getting revision history for this article");
    debugger;
    alert(textStatus);
  }

  function handleParsePostFail(jqXHR, textStatus, errorThrown)
  {
    //   //todo: improve error handling
    alert("Problem parsing history page for this article");
    debugger;
    alert(textStatus);
  }

  function handleParseTextFail(jqXHR, textStatus, errorThrown)
  {
    //   //todo: improve error handling
    alert("Problem parsing wikiText for this article");
    debugger;
    alert(textStatus);
  }
}



function toUTC8601DateString (date)
{
  var curr_year = date.getUTCFullYear();

  var curr_month = date.getUTCMonth() + 1; //Months are zero based
  if (curr_month < 10)
  curr_month = "0" + curr_month;

  var curr_date = date.getUTCDate();
  if (curr_date < 10)
  curr_date = "0" + curr_date;

  var curr_hour = date.getUTCHours();
  if (curr_hour < 10)
  curr_hour = "0" + curr_hour;

  var curr_min = date.getUTCMinutes();
  if (curr_min < 10)
  curr_min = "0" + curr_min;

  var curr_sec = date.getUTCSeconds();
  if (curr_sec < 10)
  curr_sec = "0" + curr_sec;

  var newTimeStamp = curr_year + "-" + curr_month + "-" + curr_date + "T" + curr_hour + ":" + curr_min + ":" + curr_sec + "Z";
  return newTimeStamp;
}

//outputs as string all characters that are in the specified version number or all of an array of version numbers
function outputFullVersion(charInfo, version, excludeVersion)
{
  debugger;
  var output = "";
  var node = charInfo.head;

  if (excludeVersion === undefined)
  {
    excludeVersion = [];
  }
  else if (Array.isArray(excludeVersion) === false)
  {
    excludeVersion = [excludeVersion];
  }

  while (node)
  {
    if (Array.isArray(version))
    {
      var include = true;
      for (var i = 0; i < version.length; i++)
      {
        if (node.data.versions.includes(version[i]) === false)
        {
          include = false;
          break;
        }
      }
      if (include === true)
      {
        for (var i = 0; i < excludeVersion.length; i++)
        {
          if (node.data.versions.includes(excludeVersion[i]))
          {
            include = false;
            break;
          }
        }
      }
      if (include === true) output += node.data.char;
    }
    else if (version === undefined || node.data.versions.includes(version)) //todo: implement binary search of versions
    {
      var include = true;
      for (var i = 0; i < excludeVersion.length; i++)
      {
        if (node.data.versions.includes(excludeVersion[i]))
        {
          include = false;
          break;
        }
      }
      if (include === true)
      {
        output += node.data.char;
      }
    }
    node = node.next;
  }
  return output;
}


function outputFromCursor(charInfo, offset)
{
  return outputFromCursor(charInfo, offset, null, null);
}

function outputFromCursor(charInfo, offset, length)
{
  return outputFromCursor(charInfo, offset, length, null);
}

//returns output from charInfo curNode cursor with specified offset, length, and required versions as int or array
function outputFromCursor(charInfo, offset, length, version)
{
  if (charInfo == false || charInfo.curNode == false)
  {
    return false;
  }

  var node = charInfo.curNode;
  while (offset < 0)
  {
    node = node.previous;
    if (node == false)
    {
      return false;
    }
    offset++;
  }

  while (offset > 0)
  {
    node = node.next;
    if (node == false)
    {
      return false;
    }
    offset--;
  }

  while ((length === null || length > 0) && node != false)
  {
    if (Array.isArray(version))
    {
      var include = true;
      for (var i = 0; i < version.length; i++)
      {
        if (node.data.versions.includes(version[i]) === false)
        {
          include = false;
          break;
        }
      }
      if (include === true)
      {
        output += node.data.char;
        if (length !== null)
        {
          length--;
        }
      }
    }
    else if (version === null || node.data.versions.includes(version))
    {
      output += node.data.char;
      if (length !== null)
      {
        length--;
      }
    }
    node = node.next;
  }

  return output;
}
