var BCLS = (function(window, document) {
  var mrssStr = '<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:georss="http://www.georss.org/georss" xmlns:gml="http://www.opengis.net/gml" xmlns:atom="http://www.w3.org/2005/Atom">',
    sChannel = '<channel>',
    eChannel = '</channel>',
    sTitle = '<title>',
    eTitle = '</title>',
    sDescription = '<description>',
    eDescription = '</description>',
    sItem = '<item>',
    eItem = '</item>',
    sCdata = '<![CDATA[',
    eCdata = ']]>',
    sGuid = '<guid isPermaLink="false">',
    eGuid = '</guid>',
    sLink = '<link>',
    eLink = '</link>',
    sPubDate = '<pubDate>',
    ePubDate = '</pubDate>',
    sMediaContent = '<media:content',
    eMediaContent = ' />',
    sMediaPlayer = '<media:player',
    eMediaPlayer = '/>',
    sMediaDescription = '<description>',
    eMediaDescription = '</description>',
    sMediaThumbnail = '<media:thumbnail',
    eMediaThumbnail = '/>',
    sMediaTitle = '<title>',
    eMediaTitle = '</title>',
    // account stuff
    accountId,
    default_accountId = '1752604059001',
    policyKey,
    default_policyKey = 'BCpkADawqM1eifBpAkEr4aJrH9i950qErQCg8FvHXBCigF0JjC-zZyhN4T1XGGGBbB0hojevaABtp54BTvT9Er0KplSpC6tqm8YgyCtIzGl5sc77i23GLWYdpLdtF7Aei45EuLqlUznlkiXU',
    // api stuff
    baseURL = 'https://edge.api.brightcove.com/playback/v1/accounts/',
    sort,
    sortDirection = "",
    search,
    limit = 25,
    totalVideos = 0,
    totalCalls = 0,
    callNumber = 0,
    videosArray = [],
    // elements
    account_id = document.getElementById('account_id'),
    policy_key = document.getElementById('policy_key'),
    feedTitle = document.getElementById('feedTitle'),
    feedDescription = document.getElementById('feedDescription'),
    siteURL = document.getElementById('siteURL'),
    feedURL = document.getElementById('feedURL'),
    numberSelect = document.getElementById('numberSelect'),
    searchStr = document.getElementById('searchStr'),
    sortSelect = document.getElementById('sortSelect'),
    directionSelect = document.getElementById('directionSelect'),
    dateRangeType = document.getElementById('dateRangeType'),
    fromDate = document.getElementById('fromDate'),
    toDate = document.getElementById('toDate'),
    dateTypeValue,
    fromDateValue,
    toDateValue,
    makeFeed = document.getElementById('makeFeed'),
    logger = document.getElementById('logger'),
    apiRequest = document.getElementById('apiRequest'),
    feedDisplay = document.getElementById('feedDisplay'),
    allButtons = document.getElementsByName('button');

  /**
   * tests for all the ways a variable might be undefined or not have a value
   * @param {String|Number} x the variable to test
   * @return {Boolean} true if variable is defined and has a value
   */
  function isDefined(x) {
    if (x === '' || x === null || x === undefined) {
      return false;
    }
    return true;
  }

  /**
   * get selected value for single select element
   * @param {htmlElement} e the select element
   */
  function getSelectedValue(e) {
    return e.options[e.selectedIndex].value;
  }


  /**
   * disables all buttons so user can't submit new request until current one finishes
   */
  function disableButtons() {
    var i,
      iMax = allButtons.length;
    for (i = 0; i < iMax; i++) {
      allButtons[i].setAttribute('disabled', 'disabled');
    }
  }

  /**
   * re-enables all buttons
   */
  function enableButtons() {
    var i,
      iMax = allButtons.length;
    for (i = 0; i < iMax; i++) {
      allButtons[i].removeAttribute('disabled');
    }
  }

  /**
   * sort an array of objects based on an object property
   * @param {array} targetArray - array to be sorted
   * @param {string|number} objProperty - object property to sort on
   * @return sorted array
   */
  function sortArray(targetArray, objProperty) {
    targetArray.sort(function(b, a) {
      var propA = a[objProperty],
        propB = b[objProperty];
      // sort ascending; reverse propA and propB to sort descending
      if (propA < propB) {
        return -1;
      } else if (propA > propB) {
        return 1;
      } else {
        return 0;
      }
    });
    return targetArray;
  }

  function processSources(sources) {
    var i = sources.length;
    // remove non-MP4 sources
    // while (i > 0) {
    //     i--;
    //     if (sources[i].container !== 'MP4') {
    //         sources.splice(i, 1);
    //     } else if (sources[i].hasOwnProperty('stream_name')) {
    //         sources.splice(i, 1);
    //     }
    // }
    // sort sources by encoding rate
    sortArray(sources, 'encoding_rate');
    // return the first item (highest bitrate)
    return (sources.length > 0) ? sources[0] : null;
  }

  function addItems() {
    var i, iMax, video, pubdate, videoURL, thumbnailURL, doThumbnail;
    iMax = videosArray.length;
    for (i = 0; i < iMax; i++) {
      doThumbnail = true;
      video = videosArray[i];
      video.location = 'https://players.brightcove.net/' + accountId + '/default_default/index.html?videoId=' + video.id;
      // video may not have a valid source; if not, don't include it
      // console.log('video', video);
      if (video.hasOwnProperty('source') && isDefined(video.source)) {
        if (video.source.hasOwnProperty('src')) {
          videoURL = video.source.src.replace(/&/g, '&amp;');
        }
      }
      // depending on when/how the video was created, it may have different thumbnail properties or none at all
      if (video.hasOwnProperty('thumbnail')) {
        thumbnailURL = video.thumbnail.replace(/&/g, '&amp;');
      } else {
        doThumbnail = false;
      }

      pubdate = new Date(video.published_at).toGMTString();
      mrssStr += sItem;
      mrssStr += sLink + video.location + eLink;
      mrssStr += sPubDate + sCdata + pubdate + eCdata + ePubDate;
      mrssStr += sGuid + video.id + eGuid;
      mrssStr += sMediaContent;
      if (isDefined(videoURL)) {
        mrssStr += ' url="' + videoURL + '"';
      }
      if (isDefined(video.source) && video.source.hasOwnProperty('size')) {
        mrssStr += ' fileSize="' + video.source.size + '"';
      }
      mrssStr += ' type="video/quicktime" medium="video" duration="' + (video.duration / 1000) + '" isDefault="true"';
      if (isDefined(video.source) && video.source.hasOwnProperty('width')) {
        mrssStr += ' height="' + video.source.height + '" width="' + video.source.width + '"' + eMediaContent;
      } else {
        mrssStr += eMediaContent;
      }
      mrssStr += sMediaPlayer + ' url="' + video.location + '"' + eMediaPlayer;
      mrssStr += sMediaTitle + sCdata + video.name + eCdata + eMediaTitle;
      mrssStr += sMediaDescription + sCdata + video.description + eCdata + eMediaDescription;
      if (doThumbnail) {
        mrssStr += sMediaThumbnail + ' url="' + thumbnailURL + '"' + eMediaThumbnail;
      }
      mrssStr += eItem;
    }
    mrssStr += eChannel + '</rss>';
    logger.textContent = 'Finished!';
    feedDisplay.textContent = vkbeautify.xml(mrssStr);
    enableButtons();
  }

  /**
   * sets up the data for the API request
   * @param {String} id the id of the button that was clicked
   */
  function setRequestData(id) {
    var endPoint = '',
      requesturl;
    // disable buttons to prevent a new request before current one finishes
    disableButtons();
    switch (id) {
      case 'getVideos':
        var callback = function(response) {
          var i,
            iMax,
            parsedData;
          parsedData = JSON.parse(response);
          videosArray = parsedData.videos;
          // for each video, get the best source and set that as source
          // if video has no source, remove it
          i = videosArray.length;
          while (i > 0) {
            i--;
            videosArray[i].source = processSources(videosArray[i].sources);
          }
          addItems();
        };
        endPoint = accountId + '/videos?sort=' + sort + '&limit=' + limit;
        if (isDefined(search)) {
          endPoint += '&q=' + search;
        }
        requesturl = baseURL + endPoint;
        apiRequest.textContent = requesturl;
        getMediaData(requesturl, id, callback);
        break;
    }
  }

  /**
   * send API request to the proxy
   * @param  {Object} requestData options for the request
   * @param  {String} requestID the type of request = id of the button
   * @param  {Function} [callback] callback function
   */
  function getMediaData(requesturl, requestID, callback) {
    var httpRequest = new XMLHttpRequest(),
      parsedData,
      requestParams,
      dataString,
      sources,
      // response handler
      getResponse = function() {
        try {
          if (httpRequest.readyState === 4) {
            if (httpRequest.status >= 200 && httpRequest.status < 300) {
              // check for completion
              if (requestID === 'getVideos') {
                callback(httpRequest.responseText);
              } else {
                alert('There was a problem with the request. Request returned ' + httpRequest.status);
              }
            }
          }
        } catch (e) {
          alert('Caught Exception: ' + e);
        }
      };
    // set response handler
    httpRequest.onreadystatechange = getResponse;
    // open the request
    httpRequest.open('GET', requesturl);
    // set headers
    httpRequest.setRequestHeader("BCOV-Policy", policyKey);
    // open and send request
    httpRequest.send();
  }

  function init() {
    // date pickers
    rome(fromDate);
    rome(toDate);
    // event handlers
    makeFeed.addEventListener('click', function() {
      var numVideos;
      // get the inputs
      policyKey = policy_key.value;
      accountId = account_id.value;
      // only use entered account id if client id and secret are entered also
      if (isDefined(accountId)) {
        if (!isDefined(policyKey)) {
          window.alert('To use your own account, you must provide your own policy key - since it is missing, a sample account will be used');
          policyKey = default_policyKey;
          accountId = default_accountId;
        }
      } else {
        policyKey = default_policyKey;
        accountId = default_accountId;
      }
      sort = getSelectedValue(sortSelect);
      sortDirection = getSelectedValue(directionSelect);
      if (isDefined(sortDirection)) {
        sort = sortDirection + sort;
      }
      search = searchStr.value;
      dateTypeValue = getSelectedValue(dateRangeType);
      fromDateValue = rome(fromDate).getDate();
      if (isDefined(fromDateValue)) {
        fromDateValue = fromDateValue.toISOString();
        if (isDefined(search)) {
          search += '%20+';
        }
        search += dateTypeValue + ':' + fromDateValue + '..';
      }
      toDateValue = rome(toDate).getDate();
      if (isDefined(toDateValue)) {
        toDateValue = toDateValue.toISOString();

        if (isDefined(fromDateValue)) {
          search += toDateValue;
        } else {
          if (isDefined(search)) {
            search += '%20+';
          }
          search += dateTypeValue + ':..' + toDateValue;
        }
      }
      search = encodeURI(search);
      numVideos = getSelectedValue(numberSelect);
      // add title and description
      mrssStr += sChannel + sTitle + feedTitle.value + eTitle + sDescription + feedDescription.value + eDescription + sLink + siteURL.value.replace(/&/g, '&amp;') + eLink + '<atom:link href="' + feedURL.value.replace(/&/g, '&amp;') + '" rel="self" type="application/rss+xml" />';
      totalVideos = parseInt(numVideos);
      totalCalls = numVideos;
      logger.textContent = 'Total videos to retrieve: ' + totalVideos;
      setRequestData('getVideos');
    });
    feedDisplay.addEventListener('click', function() {
      feedDisplay.select();
    });
  }

  init();
})(window, document);